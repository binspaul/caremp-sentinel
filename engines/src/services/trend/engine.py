from typing import Any, Dict, Optional
from datetime import datetime
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .regression import compute_trend
from .repository import BaseTrendRepository, InMemoryTrendRepository

_SHARED_REPOSITORY = InMemoryTrendRepository()

# Rolling windows to compute trends over, as window_name -> {size, min_readings}.
WINDOWS = {
    "30m": {"size": 30, "min_readings": 10}
}

RECALCULATE_EVERY = 1
SLEEP_COMPUTATION_STATE_FINAL = 2


class TrendEngine(BaseEngine):
    """
    Trend Engine that fits a rolling linear regression per resident and metric to
    detect whether a vital is trending up, down, or holding steady.
    Enhanced with timestamp-aware regression and motion spike suppression.
    """

    def __init__(self, repository: Optional[BaseTrendRepository] = None, recalculate_every: int = RECALCULATE_EVERY):
        self.repository = repository or _SHARED_REPOSITORY
        self.recalculate_every = recalculate_every
        self._readings_since_recalculation: Dict[int, int] = {}

        # Supported continuous health metrics
        self.metrics = [
            "heart_rate",
            "hrv",
            "systolic_bp",
            "diastolic_bp",
            "oxygen_saturation",
            "body_temperature",
            "skin_temperature",
        ]

        # Sleep metrics are updated when night session is finalized
        self.sleep_metrics = [
            "deep_sleep_time",
            "light_sleep_time",
            "rem_sleep_time",
            "awake_sleep_time",
            "total_sleep_time"
        ]

        self._last_processed_at: Dict[int, Any] = {}

    @property
    def name(self) -> str:
        return "Trend Engine"

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Updates each metric's rolling window(s) for every reading, calculates trends,
        and returns the resident's trend status.
        """
        resident_id = reading.resident_id

        # 0. Reject duplicate/replayed readings
        last_processed_at = self._last_processed_at.get(resident_id)
        if last_processed_at is not None and reading.generated_at is not None:
            r_time = reading.generated_at.replace(tzinfo=None) if reading.generated_at.tzinfo else reading.generated_at
            lp_time = last_processed_at.replace(tzinfo=None) if last_processed_at.tzinfo else last_processed_at
            if r_time <= lp_time:
                return {
                    "resident_id": resident_id,
                    "trends": self.get_all_trends(resident_id),
                    "status": "skipped_duplicate"
                }
        self._last_processed_at[resident_id] = reading.generated_at

        # 1. Update rolling window(s) with timestamp awareness
        metrics_to_update = self.metrics
        if reading.sleep_computation_state == SLEEP_COMPUTATION_STATE_FINAL:
            metrics_to_update = self.metrics + self.sleep_metrics

        for metric in metrics_to_update:
            value = getattr(reading, metric, None)
            if value is None:
                continue
            for window_name, window_config in WINDOWS.items():
                self.repository.add_reading(
                    resident_id,
                    metric,
                    window_name,
                    reading.generated_at if isinstance(reading.generated_at, datetime) else None,
                    float(value),
                    window_config["size"]
                )

        # 2. Return the computed trends
        trends = self.get_all_trends(resident_id)

        return {
            "resident_id": resident_id,
            "trends": trends,
            "status": "updated"
        }

    def get_current_trend(self, resident_id: int, metric: str, window_name: str = "30m") -> Optional[Dict[str, Any]]:
        """
        Returns the current trend status for a resident/metric's window.
        """
        window_config = WINDOWS.get(window_name)
        if window_config is None:
            return None

        window_size = window_config["size"]
        min_readings = window_config.get("min_readings", window_size)
        entries = self.repository.get_window_entries(resident_id, metric, window_name)
        available = len(entries)

        if available < min_readings:
            return {"status": "learning", "available_readings": available, "required_readings": min_readings}

        timestamps = [t for t, _ in entries]
        values = [v for _, v in entries]

        trend = compute_trend(values, timestamps=timestamps)
        if trend is None:
            return {"status": "learning", "available_readings": available, "required_readings": max(min_readings, 2)}

        return {
            "status": "ready",
            "direction": trend.direction,
            "slope": round(trend.slope, 4),
            "first_value": round(trend.first_value, 4),
            "last_value": round(trend.last_value, 4),
            "absolute_change": round(trend.absolute_change, 4),
            "percentage_change": round(trend.percentage_change, 2) if trend.percentage_change is not None else None,
            "strength": round(trend.strength, 4)
        }

    def get_all_trends(self, resident_id: int) -> Dict[str, Any]:
        """
        Returns trends across all metrics for a resident.
        """
        result: Dict[str, Any] = {}
        for metric in self.metrics + self.sleep_metrics:
            windows_result: Dict[str, Any] = {}
            for window_name in WINDOWS:
                trend = self.get_current_trend(resident_id, metric, window_name)
                if trend is not None:
                    windows_result[window_name] = trend
            if windows_result:
                result[metric] = windows_result
        return result
