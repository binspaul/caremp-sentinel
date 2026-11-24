"""
Sundowning & Agitation Predictor Engine
Detects late-afternoon autonomic surges, baseline deviations, and restlessness
to provide caregivers with a 30 to 45-minute advance warning.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from ...core.base import BaseEngine
from ...core.models import VitalReading
from ..baseline.engine import BaselineEngine
from ..trend.engine import TrendEngine
from .models import SundowningAssessment


class SundowningEngine(BaseEngine):
    """
    Analyzes late-afternoon time windows, heart rate elevations, HRV stress collapse,
    and vital trajectories to compute an Agitation Index (0-100).
    """

    def __init__(
        self,
        baseline_engine: Optional[BaselineEngine] = None,
        trend_engine: Optional[TrendEngine] = None
    ):
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.trend_engine = trend_engine or TrendEngine()
        self._last_assessment: Dict[int, SundowningAssessment] = {}

    @property
    def name(self) -> str:
        return "sundowning"

    def assess_reading(
        self,
        reading: VitalReading,
        custom_time: Optional[datetime] = None
    ) -> SundowningAssessment:
        resident_id = reading.resident_id
        timestamp = custom_time or reading.generated_at or datetime.utcnow()
        hour = timestamp.hour + (timestamp.minute / 60.0)

        # 1. Determine Time Window Weight
        # Peak Sundowning Window: 15:00 - 19:30
        is_sundowning_window = (15.0 <= hour <= 19.5)
        if is_sundowning_window:
            time_weight = 1.0
        elif (14.0 <= hour < 15.0) or (19.5 < hour <= 21.0):
            time_weight = 0.75
        else:
            time_weight = 0.40

        # 2. Retrieve Resident Baselines
        baselines = self.baseline_engine.get_current_baselines(resident_id)
        baseline_hr = baselines.get("heart_rate", 70.0)
        baseline_hrv = baselines.get("hrv", 32.0)

        factors: List[str] = []

        # 3. Calculate Heart Rate Surge Above Calm Baseline
        current_hr = reading.heart_rate or baseline_hr
        hr_surge_pts = 0.0
        if current_hr > baseline_hr:
            pct_rise = ((current_hr - baseline_hr) / baseline_hr) * 100.0
            # Scale: a 25% rise yields ~50 pts, a 50% rise yields 100 pts
            hr_surge_pts = min(100.0, pct_rise * 2.0)
            if pct_rise >= 10.0:
                factors.append(
                    f"Heart rate is {round(pct_rise)}% above calm baseline ({round(current_hr)} bpm vs {round(baseline_hr)} bpm normal)"
                )

        # 4. Calculate HRV Stress Collapse Score
        # Normal relaxed HRV >= 35ms (0 stress pts), severely depressed <= 12ms (100 stress pts)
        current_hrv = reading.hrv if reading.hrv is not None else baseline_hrv
        hrv_stress_pts = 0.0
        if current_hrv < 35.0:
            hrv_stress_pts = min(100.0, max(0.0, ((35.0 - current_hrv) / (35.0 - 12.0)) * 100.0))
            if current_hrv <= 22.0:
                factors.append(
                    f"Autonomic stress response: HRV dropped to {round(current_hrv, 1)} ms (calm baseline: {round(baseline_hrv, 1)} ms)"
                )

        # 5. Check Trend Velocity Boost from Trend Engine
        trend_boost = 0.0
        hr_trend = self.trend_engine.get_current_trend(resident_id, "heart_rate")
        if hr_trend and hr_trend.get("status") == "ready":
            direction = hr_trend.get("direction")
            slope = hr_trend.get("slope", 0.0)
            strength = hr_trend.get("strength", 0.0)
            if direction == "Increasing" and strength >= 0.5:
                trend_boost = 12.0
                factors.append(
                    f"Heart rate has been climbing steadily over the last 15 minutes (slope: +{round(slope, 3)})"
                )

        if is_sundowning_window:
            factors.append(f"Late-afternoon circadian fatigue window ({timestamp.strftime('%H:%M')})")

        # 6. Composite Agitation Index
        raw_index = (0.50 * hr_surge_pts) + (0.40 * hrv_stress_pts) + trend_boost
        final_index = round(max(0.0, min(100.0, raw_index * time_weight)), 1)

        # 7. Severity Tiers & Advance Warning
        if final_index >= 65.0:
            status = "SUNDOWNING_SURGE"
            severity = "HIGH"
            advance_notice = 15
        elif final_index >= 35.0:
            status = "RESTLESS"
            severity = "MODERATE" if final_index >= 50.0 else "LOW"
            advance_notice = 35
        else:
            status = "CALM"
            severity = "NORMAL"
            advance_notice = None

        # 8. Dynamic Non-Pharmacological Interventions
        interventions: List[str] = []
        if status == "SUNDOWNING_SURGE":
            interventions.append("Immediately dim harsh overhead fluorescent lighting to minimize glare and confusing shadows.")
            interventions.append("Reduce hallway and television noise; escort resident to a quiet, familiar sensory room.")
            interventions.append("Provide a familiar comfort item (weighted blanket, tactile cushion, or personal photo album).")
            interventions.append("Use a calm, gentle, reassuring tone; avoid contradicting or correcting disorientation.")
        elif status == "RESTLESS":
            interventions.append("Offer a soothing warm drink (chamomile tea or warm milk) and a light nutritious snack.")
            interventions.append("Play gentle, familiar music from their youth (soft acoustic or 1950s/60s classics).")
            interventions.append("Gently guide resident to a comfortable seating area near natural soft light.")
            interventions.append("Engage in a quiet, low-demand activity (folding soft towels or looking at picture books).")

        assessment = SundowningAssessment(
            resident_id=resident_id,
            agitation_index=final_index,
            status=status,
            severity=severity,
            is_sundowning_window=is_sundowning_window,
            advance_notice_minutes=advance_notice,
            contributing_factors=factors,
            recommended_interventions=interventions
        )
        self._last_assessment[resident_id] = assessment
        return assessment

    def get_current_assessment(self, resident_id: int) -> Optional[SundowningAssessment]:
        return self._last_assessment.get(resident_id)

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        assessment = self.assess_reading(reading)
        return {
            "resident_id": reading.resident_id,
            "agitation_index": assessment.agitation_index,
            "status": assessment.status,
            "severity": assessment.severity,
            "advance_notice_minutes": assessment.advance_notice_minutes,
            "contributing_factors": assessment.contributing_factors,
            "recommended_interventions": assessment.recommended_interventions
        }

