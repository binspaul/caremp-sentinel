"""
Frailty & Longevity Clock Engine
Coordinates continuous Rockwood e-FI calculations and biological age estimation.
"""
from typing import Dict, Any, Optional
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .models import FrailtyAssessment
from .frailty_clock import compute_frailty_and_longevity


class FrailtyEngine(BaseEngine):
    """
    Computes electronic Frailty Index (e-FI) and biological longevity trajectories.
    """

    def __init__(self):
        # In-memory store of resident chronological ages: resident_id -> age
        self._age_cache: Dict[int, int] = {}

    @property
    def name(self) -> str:
        return "frailty"

    def set_chronological_age(self, resident_id: int, age: int) -> None:
        self._age_cache[resident_id] = age

    def assess_reading(
        self,
        reading: VitalReading,
        chronological_age: Optional[int] = None
    ) -> FrailtyAssessment:
        age = chronological_age or self._age_cache.get(reading.resident_id, 72)
        return compute_frailty_and_longevity(
            resident_id=reading.resident_id,
            chronological_age=age,
            resting_hr=reading.heart_rate,
            hrv_rmssd=reading.hrv,
            systolic_bp=reading.systolic_bp,
            diastolic_bp=reading.diastolic_bp,
            spo2=reading.oxygen_saturation,
            total_sleep_minutes=reading.total_sleep_time,
            deep_sleep_minutes=reading.deep_sleep_time,
            step_count=None
        )

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        assessment = self.assess_reading(reading)
        return {
            "resident_id": reading.resident_id,
            "frailty_index": assessment.frailty_index,
            "classification": assessment.classification,
            "biological_age_delta": assessment.biological_age_delta,
            "sarcopenia_risk": assessment.sarcopenia_risk,
            "autonomic_resilience": assessment.autonomic_resilience
        }
