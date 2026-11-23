"""
Deterioration & Sepsis Early Warning Engine
Coordinates continuous NEWS2 acuity scoring, sepsis prodrome detection, and nocturnal risk assessment.
"""
from typing import Dict, Any, Optional
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .models import DeteriorationAssessment
from .news2 import calculate_news2, evaluate_sepsis_risk
from .arrhythmia import evaluate_nocturnal_hemodynamics


class DeteriorationEngine(BaseEngine):
    """
    Continuous clinical deterioration engine for real-time acuity and sepsis prevention.
    """

    def __init__(self):
        # In-memory cache of daytime systolic BP baselines for dipping calculations: resident_id -> float
        self._daytime_sbp_cache: Dict[int, float] = {}

    @property
    def name(self) -> str:
        return "deterioration"

    def set_daytime_baseline(self, resident_id: int, sbp: float) -> None:
        self._daytime_sbp_cache[resident_id] = sbp

    def assess_reading(
        self,
        reading: VitalReading,
        is_sleep: bool = False
    ) -> DeteriorationAssessment:
        news2 = calculate_news2(
            heart_rate=reading.heart_rate,
            systolic_bp=reading.systolic_bp,
            spo2=reading.oxygen_saturation,
            body_temp=reading.body_temperature
        )

        sepsis = evaluate_sepsis_risk(
            heart_rate=reading.heart_rate,
            systolic_bp=reading.systolic_bp,
            spo2=reading.oxygen_saturation,
            body_temp=reading.body_temperature
        )

        daytime_sbp = self._daytime_sbp_cache.get(reading.resident_id, 120.0)
        nocturnal = evaluate_nocturnal_hemodynamics(
            is_sleep=is_sleep or (reading.deep_sleep_time is not None and reading.deep_sleep_time > 0),
            systolic_bp=reading.systolic_bp,
            daytime_sbp_baseline=daytime_sbp,
            heart_rate=reading.heart_rate,
            spo2=reading.oxygen_saturation
        )

        # Overall clinical priority
        if news2.risk_level == "HIGH" or sepsis.severity == "HIGH_PRODROME":
            priority = "CRITICAL_EMERGENCY"
        elif news2.risk_level == "MEDIUM" or sepsis.severity == "ELEVATED" or nocturnal.dipping_status == "REVERSE_DIPPER":
            priority = "URGENT_REVIEW"
        else:
            priority = "ROUTINE"

        return DeteriorationAssessment(
            resident_id=reading.resident_id,
            news2=news2,
            sepsis=sepsis,
            nocturnal=nocturnal,
            overall_clinical_priority=priority
        )

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        assessment = self.assess_reading(reading)
        return {
            "resident_id": reading.resident_id,
            "news2_score": assessment.news2.total_score,
            "news2_risk": assessment.news2.risk_level,
            "sepsis_suspected": assessment.sepsis.is_sepsis_suspected,
            "sepsis_severity": assessment.sepsis.severity,
            "overall_clinical_priority": assessment.overall_clinical_priority
        }
