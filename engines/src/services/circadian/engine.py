"""
Circadian Sleep-Wake Engine
Evaluates 24-hour sleep-wake rhythm stability, day-night sleep inversion,
and sleep fragmentation for dementia and memory care residents.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .models import CircadianAssessment


class CircadianEngine(BaseEngine):
    """
    Computes Circadian Regularity Score (0-100), Day-to-Night Sleep Ratio (DNSR),
    and identifies Day-Night Reversal patterns.
    """

    def __init__(self):
        # In-memory store of recent sleep metrics: resident_id -> dict of accumulated metrics
        self._sleep_cache: Dict[int, Dict[str, Any]] = {}
        self._last_assessment: Dict[int, CircadianAssessment] = {}

    @property
    def name(self) -> str:
        return "circadian"

    def assess_circadian_rhythm(
        self,
        resident_id: int,
        daytime_sleep_minutes: int = 0,
        nighttime_sleep_minutes: int = 0,
        night_awakenings: int = 0,
        deep_sleep_minutes: Optional[int] = None
    ) -> CircadianAssessment:
        factors: List[str] = []
        advice: List[str] = []

        # 1. Day-to-Night Sleep Ratio (DNSR)
        # Ratio = Daytime Sleep / Nighttime Sleep (clamped if night sleep is 0)
        safe_night = max(60, nighttime_sleep_minutes)
        ratio = round(daytime_sleep_minutes / safe_night, 2)

        ratio_penalty = 0.0
        if ratio > 0.50:
            ratio_penalty = min(50.0, ratio * 45.0)
            factors.append(
                f"Severe day-night sleep inversion (ratio: {ratio}): {daytime_sleep_minutes} mins daytime naps vs {nighttime_sleep_minutes} mins night sleep"
            )
        elif ratio > 0.20:
            ratio_penalty = min(25.0, ratio * 40.0)
            factors.append(
                f"Mild daytime sleepiness (ratio: {ratio}): {daytime_sleep_minutes} mins daytime naps"
            )

        # 2. Nighttime Sleep Fragmentation Penalty
        fragmentation_penalty = 0.0
        if night_awakenings >= 5:
            fragmentation_penalty = 30.0
            factors.append(f"Severely fragmented sleep: {night_awakenings} separate wake-up episodes recorded tonight")
        elif night_awakenings >= 3:
            fragmentation_penalty = 15.0
            factors.append(f"Broken night sleep: {night_awakenings} wake-up episodes recorded")

        # 3. Restorative Deep Sleep Penalty
        deep_sleep_penalty = 0.0
        if deep_sleep_minutes is not None:
            if deep_sleep_minutes < 30 and nighttime_sleep_minutes >= 180:
                deep_sleep_penalty = 15.0
                factors.append(
                    f"Restorative deep sleep is depleted: only {deep_sleep_minutes} minutes recorded (minimum target: 45 mins)"
                )

        # 4. Final Circadian Score (0 to 100)
        raw_score = 100.0 - ratio_penalty - fragmentation_penalty - deep_sleep_penalty
        score = round(max(0.0, min(100.0, raw_score)), 1)

        # 5. Severity Tiers & Status
        if score < 50.0 or ratio > 0.50:
            status = "SEVERE_REVERSAL"
            severity = "HIGH"
            advice.append("Increase morning natural sunlight exposure: open blinds early and spend 20 minutes on the patio at 9:30 AM.")
            advice.append("Schedule an engaging physical or social activity at 11:00 AM (e.g. music circle or balloon toss) to minimize chair napping.")
            advice.append("Ensure bedroom is completely quiet, cool, and dark at night; avoid caffeine and heavy liquids after 6:00 PM.")
        elif score < 75.0 or ratio > 0.25 or night_awakenings >= 3:
            status = "MILD_DRIFT"
            severity = "MODERATE" if score < 60.0 else "LOW"
            advice.append("Limit afternoon armchair naps to no more than 30 minutes before 2:00 PM.")
            advice.append("Encourage light afternoon walking in the courtyard before dinner.")
            advice.append("Establish a soothing bedtime routine: warm chamomile tea, calming acoustic music, and soft lighting 45 mins before bed.")
        else:
            status = "NORMAL_RHYTHM"
            severity = "NORMAL"
            advice.append("Healthy day-night sleep balance. Continue current daily activity and nighttime routine.")

        assessment = CircadianAssessment(
            resident_id=resident_id,
            circadian_score=score,
            status=status,
            severity=severity,
            daytime_sleep_minutes=daytime_sleep_minutes,
            nighttime_sleep_minutes=nighttime_sleep_minutes,
            day_night_ratio=ratio,
            night_awakenings=night_awakenings,
            deep_sleep_minutes=deep_sleep_minutes,
            contributing_factors=factors,
            actionable_advice=advice
        )
        self._last_assessment[resident_id] = assessment
        return assessment

    def get_current_assessment(self, resident_id: int) -> Optional[CircadianAssessment]:
        return self._last_assessment.get(resident_id)

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """BaseEngine interface implementation."""
        # Extract sleep metrics from reading if available
        night_sleep = reading.total_sleep_time or 360
        deep_sleep = reading.deep_sleep_time or 45

        assessment = self.assess_circadian_rhythm(
            resident_id=reading.resident_id,
            daytime_sleep_minutes=60,
            nighttime_sleep_minutes=night_sleep,
            night_awakenings=2,
            deep_sleep_minutes=deep_sleep
        )
        return {
            "resident_id": reading.resident_id,
            "circadian_score": assessment.circadian_score,
            "status": assessment.status,
            "severity": assessment.severity,
            "day_night_ratio": assessment.day_night_ratio,
            "actionable_advice": assessment.actionable_advice
        }
