from typing import Dict, Any, Optional
from datetime import datetime
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .ewma import EWMABaseline
from .repository import BaseBaselineRepository, InMemoryBaselineRepository

# Shared default repository instance for the baseline engine
_SHARED_REPOSITORY = InMemoryBaselineRepository()

# sleepComputationState value marking a night's sleep session as finalized
SLEEP_COMPUTATION_STATE_FINAL = 2

# Physiological survival/validity ranges for pre-clamping corrupted hardware artifacts
PHYSIOLOGICAL_RANGES = {
    "heart_rate": (30.0, 240.0),
    "hrv": (1.0, 300.0),
    "oxygen_saturation": (40.0, 100.0),
    "systolic_bp": (50.0, 260.0),
    "diastolic_bp": (30.0, 150.0),
    "body_temperature": (30.0, 43.0),
    "skin_temperature": (20.0, 42.0),
}

class BaselineEngine(BaseEngine):
    """
    Baseline Engine that calculates and maintains adaptive health baseline averages
    for residents using Exponentially Weighted Moving Averages (EWMA), spike filtering,
    physiological bounds checks, and time-delta awareness.
    """

    def __init__(self, repository: Optional[BaseBaselineRepository] = None, alpha: float = 0.1):
        self.repository = repository or _SHARED_REPOSITORY
        self.alpha = alpha

        # Supported health metrics to calculate baselines for, updated every reading.
        self.metrics = [
            "heart_rate",
            "hrv",
            "systolic_bp",
            "diastolic_bp",
            "oxygen_saturation",
            "body_temperature",
            "skin_temperature",
        ]

        # Sleep metrics are only meaningful once a night's session is finalized
        self.sleep_metrics = [
            "deep_sleep_time",
            "light_sleep_time",
            "rem_sleep_time",
            "awake_sleep_time",
            "total_sleep_time"
        ]

        # Tracks the last reading timestamp processed per resident
        self._last_processed_at: Dict[int, Any] = {}

    @property
    def name(self) -> str:
        return "Baseline Engine"

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Processes a single VitalReading, updates the resident's metrics baselines,
        persists the updated state, and returns the result dictionary.
        """
        resident_id = reading.resident_id

        # 0. Reject duplicate/replayed readings and compute elapsed seconds (dt)
        dt_seconds = 60.0
        last_processed_at = self._last_processed_at.get(resident_id)
        if last_processed_at is not None and reading.generated_at is not None:
            r_time = reading.generated_at.replace(tzinfo=None) if reading.generated_at.tzinfo else reading.generated_at
            lp_time = last_processed_at.replace(tzinfo=None) if last_processed_at.tzinfo else last_processed_at
            if r_time <= lp_time:
                return {
                    "resident_id": resident_id,
                    "baselines": self.get_current_baselines(resident_id),
                    "status": "skipped_duplicate"
                }
            dt = (r_time - lp_time).total_seconds()
            if dt > 0:
                dt_seconds = dt

        self._last_processed_at[resident_id] = reading.generated_at

        # 1. Retrieve current baseline states for this resident
        resident_states = self.repository.get_baselines_for_resident(resident_id)
        if not resident_states:
            resident_states = {}

        updated_baselines: Dict[str, float] = {}

        # 2. Iterate through each vital metric and run EWMA update
        metrics_to_process = self.metrics
        if reading.sleep_computation_state == SLEEP_COMPUTATION_STATE_FINAL:
            metrics_to_process = self.metrics + self.sleep_metrics

        for metric in metrics_to_process:
            value = getattr(reading, metric, None)

            # Physiological range pre-check: drop impossible hardware artifacts
            if value is not None and metric in PHYSIOLOGICAL_RANGES:
                low, high = PHYSIOLOGICAL_RANGES[metric]
                if value < low or value > high:
                    value = None

            # Retrieve or initialize EWMA state for the specific metric
            metric_state = resident_states.get(metric, {})
            ewma = EWMABaseline(alpha=self.alpha)

            # Populate state if it exists
            if "baseline" in metric_state:
                ewma.baseline = metric_state["baseline"]
                ewma.mad = metric_state.get("mad", 1.0)

            # Run EWMA update with elapsed time awareness
            ewma.update(value, dt_seconds=dt_seconds)

            # Save the updated state if baseline has been computed
            if ewma.baseline is not None:
                resident_states[metric] = {
                    "baseline": ewma.baseline,
                    "mad": ewma.mad,
                    "updated_at": reading.generated_at.isoformat()
                }
                updated_baselines[metric] = round(ewma.baseline, 4)

        # 3. Persist the updated state back to the repository
        self.repository.save_baselines_for_resident(resident_id, resident_states)

        return {
            "resident_id": resident_id,
            "baselines": updated_baselines,
            "status": "updated"
        }

    def get_current_baselines(self, resident_id: int) -> Dict[str, float]:
        """
        Returns the current rounded baseline value for each tracked metric for a
        resident, without processing a new reading.
        """
        resident_states = self.repository.get_baselines_for_resident(resident_id)
        return {
            metric: round(state["baseline"], 4)
            for metric, state in resident_states.items()
            if "baseline" in state
        }
