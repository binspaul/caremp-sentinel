from typing import Any, Dict, Optional, Tuple
from datetime import datetime
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .correlation import compute_correlation
from .repository import BaseCorrelationRepository, InMemoryCorrelationRepository

_SHARED_REPOSITORY = InMemoryCorrelationRepository()

WINDOW_SIZE = 30
MIN_READINGS = 2
ASYNC_PAIRING_WINDOW_SECONDS = 30.0

# Fixed vital pairs to correlate
VITAL_PAIRS = [
    ("heart_rate", "oxygen_saturation"),
    ("heart_rate", "hrv"),
    ("systolic_bp", "diastolic_bp"),
    ("hrv", "body_temperature"),
]

RECALCULATE_EVERY = 1


class CorrelationEngine(BaseEngine):
    """
    Correlation Engine that computes a rolling Pearson correlation between
    fixed pairs of vitals for each resident (e.g. heart rate vs SpO2).
    Enhanced with asynchronous sensor pairing buffer.
    """

    def __init__(self, repository: Optional[BaseCorrelationRepository] = None, recalculate_every: int = RECALCULATE_EVERY):
        self.repository = repository or _SHARED_REPOSITORY
        self.recalculate_every = recalculate_every
        self._readings_since_recalculation: Dict[int, int] = {}
        self.tracked_metrics = sorted({metric for pair in VITAL_PAIRS for metric in pair})
        self._last_processed_at: Dict[int, Any] = {}
        
        # Cache for asynchronous sensor streams: resident_id -> {metric: (timestamp, value)}
        self._recent_metric_cache: Dict[int, Dict[str, Tuple[datetime, float]]] = {}

    @property
    def name(self) -> str:
        return "Correlation Engine"

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Updates the resident's rolling window for every reading and returns correlations.
        Uses a short lookback buffer to align asynchronous wearable streams.
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
                    "correlations": self.get_current_correlations(resident_id),
                    "status": "skipped_duplicate"
                }
        self._last_processed_at[resident_id] = reading.generated_at

        # 1. Update cache with freshly arrived metrics
        if resident_id not in self._recent_metric_cache:
            self._recent_metric_cache[resident_id] = {}
        resident_cache = self._recent_metric_cache[resident_id]

        current_time = reading.generated_at if isinstance(reading.generated_at, datetime) else datetime.utcnow()

        snapshot: Dict[str, float] = {}
        for metric in self.tracked_metrics:
            value = getattr(reading, metric, None)
            if value is not None:
                float_val = float(value)
                resident_cache[metric] = (current_time, float_val)
                snapshot[metric] = float_val
            elif metric in resident_cache:
                # Forward-fill if the cached reading is within the asynchronous pairing window
                cached_time, cached_val = resident_cache[metric]
                if abs((current_time - cached_time).total_seconds()) <= ASYNC_PAIRING_WINDOW_SECONDS:
                    snapshot[metric] = cached_val

        # Add snapshot to rolling lookback window
        self.repository.add_reading(resident_id, snapshot, WINDOW_SIZE)

        # 2. Return current correlations
        correlations = self.get_current_correlations(resident_id)

        return {
            "resident_id": resident_id,
            "correlations": correlations,
            "status": "updated"
        }

    def get_current_correlations(self, resident_id: int) -> Dict[str, Any]:
        """
        Returns the current correlation status for every configured vital pair
        for a resident, without processing a new reading.
        """
        window = self.repository.get_window(resident_id)
        result: Dict[str, Any] = {}

        for metric_a, metric_b in VITAL_PAIRS:
            x_values = []
            y_values = []
            for entry in window:
                if metric_a in entry and metric_b in entry:
                    x_values.append(entry[metric_a])
                    y_values.append(entry[metric_b])

            pair_key = f"{metric_a}-{metric_b}"
            available = len(x_values)

            if available < MIN_READINGS:
                result[pair_key] = {
                    "status": "learning",
                    "available_readings": available,
                    "required_readings": MIN_READINGS
                }
                continue

            correlation = compute_correlation(x_values, y_values)
            if correlation is None:
                result[pair_key] = {
                    "status": "learning",
                    "available_readings": available,
                    "required_readings": MIN_READINGS
                }
                continue

            result[pair_key] = {
                "status": "ready",
                "coefficient": round(correlation.coefficient, 4),
                "direction": correlation.direction,
                "strength": correlation.strength
            }

        return result
