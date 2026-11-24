"""
Wandering & Egress Safety Engine
Evaluates spatial movement patterns, corridor pacing loops, and nocturnal bed exits
with an immediate emergency safety override on perimeter boundary breaches.
"""
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from ...core.base import BaseEngine
from ...core.models import VitalReading
from ..baseline.engine import BaselineEngine
from .models import WanderingAssessment


class WanderingEngine(BaseEngine):
    """
    Analytics engine tracking corridor pacing loops, nighttime bed exits,
    and perimeter egress risk.
    """

    def __init__(self, baseline_engine: Optional[BaselineEngine] = None):
        self.baseline_engine = baseline_engine or BaselineEngine()
        # In-memory transition history: resident_id -> list of (timestamp, zone_name, zone_type)
        self._zone_history: Dict[int, List[Tuple[datetime, str, str]]] = {}
        # In-memory bed exit tracking: resident_id -> (exit_timestamp, bed_zone_name)
        self._night_bed_exit: Dict[int, Optional[Tuple[datetime, str]]] = {}

    @property
    def name(self) -> str:
        return "wandering"

    def reset_state_for_resident(self, resident_id: int) -> None:
        """Utility to reset resident memory tracking (useful in tests and shifts)."""
        self._zone_history.pop(resident_id, None)
        self._night_bed_exit.pop(resident_id, None)

    def assess_movement(
        self,
        resident_id: int,
        current_zone: str,
        zone_type: str = "corridor",
        is_safe_perimeter: bool = True,
        reading: Optional[VitalReading] = None,
        timestamp: Optional[datetime] = None,
        forced_minutes_out_of_bed: Optional[float] = None,
        forced_pacing_laps: Optional[int] = None
    ) -> WanderingAssessment:
        now = timestamp or (reading.generated_at if reading else datetime.utcnow())
        hour = now.hour + (now.minute / 60.0)
        is_night_hours = (hour >= 23.0 or hour < 5.0)

        factors: List[str] = []

        # =========================================================================
        # RULE 0: Immediate Perimeter Safety Override (Life Safety Breach)
        # =========================================================================
        if not is_safe_perimeter or zone_type == "restricted":
            factors.append(f"Immediate Perimeter Breach: resident detected in restricted zone '{current_zone}' (Risk Score = 100.0)")
            action_alert = f"🚨 IMMEDIATE DOOR ALERT: Resident is at restricted exit '{current_zone}'. Dispatch security/caregiver immediately to prevent elopement!"
            return WanderingAssessment(
                resident_id=resident_id,
                wandering_status="PERIMETER_ALERT",
                elopement_risk="CRITICAL",
                risk_score=100.0,
                current_location=current_zone,
                is_safe_zone=False,
                night_bed_exit=is_night_hours,
                pacing_loop_count=forced_pacing_laps or 0,
                minutes_out_of_bed=forced_minutes_out_of_bed or 0.0,
                contributing_factors=factors,
                action_alert=action_alert
            )

        # =========================================================================
        # Safe Interior Analysis: Update State History
        # =========================================================================
        if resident_id not in self._zone_history:
            self._zone_history[resident_id] = []
        history = self._zone_history[resident_id]

        # Append current transition if different from last recorded zone
        if not history or history[-1][1] != current_zone:
            history.append((now, current_zone, zone_type))

        # Prune history older than 15 minutes
        cutoff = now - timedelta(minutes=15)
        self._zone_history[resident_id] = [entry for entry in history if entry[0] >= cutoff]
        recent_history = self._zone_history[resident_id]

        # 1. Pacing Loop Analytics (Back-and-forth transitions in last 15 mins)
        if forced_pacing_laps is not None:
            pacing_laps = forced_pacing_laps
        else:
            pacing_laps = 0
            if len(recent_history) >= 3:
                for i in range(2, len(recent_history)):
                    # A-B-A pattern represents a completed turn-around loop
                    if recent_history[i][1] == recent_history[i - 2][1] and recent_history[i][1] != recent_history[i - 1][1]:
                        pacing_laps += 1

        pacing_pts = 0.0
        if pacing_laps >= 5:
            pacing_pts = 45.0
            factors.append(f"Compulsive pacing loop: {pacing_laps} corridor laps in the last 15 minutes (+45 pts)")
        elif pacing_laps >= 3:
            pacing_pts = 25.0
            factors.append(f"Disoriented pacing pattern: {pacing_laps} corridor laps in the last 15 minutes (+25 pts)")

        # 2. Night Bed-Exit Anomaly Analytics (11:00 PM – 5:00 AM)
        is_suite = (zone_type in ("suite", "bedroom") or "suite" in current_zone.lower() or "room" in current_zone.lower())
        night_exit_flag = False
        minutes_out = 0.0

        if is_night_hours:
            if is_suite:
                # In bed/suite -> clear bed-exit tracking
                self._night_bed_exit[resident_id] = None
            else:
                # Outside suite at night
                night_exit_flag = True
                if resident_id not in self._night_bed_exit or self._night_bed_exit[resident_id] is None:
                    self._night_bed_exit[resident_id] = (now, current_zone)

                if forced_minutes_out_of_bed is not None:
                    minutes_out = forced_minutes_out_of_bed
                else:
                    exit_time, _ = self._night_bed_exit[resident_id]
                    minutes_out = round(max(0.0, (now - exit_time).total_seconds() / 60.0), 1)

        night_exit_pts = 0.0
        if is_night_hours and night_exit_flag:
            if minutes_out > 15.0:
                night_exit_pts = 45.0
                factors.append(f"Prolonged nocturnal wandering: resident has been out of bed for {round(minutes_out)} minutes (+45 pts)")
            elif minutes_out > 5.0:
                night_exit_pts = 30.0
                factors.append(f"Nocturnal bed exit: resident has been out of bed for {round(minutes_out)} minutes (+30 pts)")

        # 3. Supportive Heart Rate Restlessness Analytics
        hr_restlessness_pts = 0.0
        baselines = self.baseline_engine.get_current_baselines(resident_id)
        baseline_hr = baselines.get("heart_rate", 70.0)

        if reading and reading.heart_rate:
            current_hr = reading.heart_rate
            if is_night_hours and night_exit_flag and (current_hr > baseline_hr * 1.20):
                hr_restlessness_pts = 15.0
                factors.append(
                    f"Supportive physical restlessness: elevated pulse {round(current_hr)} bpm during movement (+15 pts)"
                )

        # 4. Final Numerical Score (Cleanly Summed)
        risk_score = round(min(100.0, max(0.0, pacing_pts + night_exit_pts + hr_restlessness_pts)), 1)

        # 5. Determine Status and Action Alert
        if risk_score >= 75.0:
            status = "PERIMETER_ALERT"
            elopement_risk = "CRITICAL"
            action_alert = f"🚨 PERIMETER ALERT: High elopement risk ({risk_score} pts) in '{current_zone}'. Immediate staff presence required!"
        elif risk_score >= 55.0 or (night_exit_flag and minutes_out > 5.0):
            status = "NOCTURNAL_BED_EXIT"
            elopement_risk = "ELEVATED"
            action_alert = f"Resident exited bed at night and is active in '{current_zone}' ({round(minutes_out)} mins). Dispatch caregiver to guide them safely back to bed."
        elif risk_score >= 30.0 or pacing_laps >= 3:
            status = "HALLWAY_PACING"
            elopement_risk = "LOW"
            action_alert = f"Resident is pacing in '{current_zone}' ({pacing_laps} laps). Suggest offering warm tea or engaging in quiet lounge seating."
        else:
            status = "SAFE_IN_ROOM"
            elopement_risk = "LOW"
            action_alert = None

        return WanderingAssessment(
            resident_id=resident_id,
            wandering_status=status,
            elopement_risk=elopement_risk,
            risk_score=risk_score,
            current_location=current_zone,
            is_safe_zone=True,
            night_bed_exit=night_exit_flag,
            pacing_loop_count=pacing_laps,
            minutes_out_of_bed=minutes_out,
            contributing_factors=factors,
            action_alert=action_alert
        )

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """BaseEngine interface implementation."""
        assessment = self.assess_movement(
            resident_id=reading.resident_id,
            current_zone="North Memory Corridor Gallery",
            zone_type="corridor",
            is_safe_perimeter=True,
            reading=reading
        )
        return {
            "resident_id": reading.resident_id,
            "wandering_status": assessment.wandering_status,
            "elopement_risk": assessment.elopement_risk,
            "risk_score": assessment.risk_score,
            "current_location": assessment.current_location,
            "night_bed_exit": assessment.night_bed_exit,
            "pacing_loop_count": assessment.pacing_loop_count,
            "action_alert": assessment.action_alert
        }
