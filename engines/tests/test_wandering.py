import pytest
from datetime import datetime
from src.core.models import VitalReading
from src.services.baseline.engine import BaselineEngine
from src.services.wandering import WanderingEngine, WanderingAssessment


def test_safe_in_room_state():
    """Verifies that a resident resting in their bedroom receives SAFE_IN_ROOM with low risk score."""
    engine = WanderingEngine()
    engine.reset_state_for_resident(1)

    assessment = engine.assess_movement(
        resident_id=1,
        current_zone="Suite 204 (Eleanor Vance)",
        zone_type="suite",
        is_safe_perimeter=True,
        timestamp=datetime(2026, 11, 24, 14, 0, 0)
    )

    assert assessment.wandering_status == "SAFE_IN_ROOM"
    assert assessment.elopement_risk == "LOW"
    assert assessment.risk_score == 0.0
    assert assessment.is_safe_zone is True
    assert assessment.night_bed_exit is False
    assert assessment.action_alert is None


def test_daytime_corridor_pacing():
    """Verifies that 5 corridor laps trigger HALLWAY_PACING with exact 45 points."""
    engine = WanderingEngine()
    engine.reset_state_for_resident(1)

    assessment = engine.assess_movement(
        resident_id=1,
        current_zone="North Memory Corridor Gallery",
        zone_type="corridor",
        is_safe_perimeter=True,
        timestamp=datetime(2026, 11, 24, 16, 0, 0),
        forced_pacing_laps=5
    )

    assert assessment.wandering_status == "HALLWAY_PACING"
    assert assessment.risk_score == 45.0
    assert assessment.pacing_loop_count == 5
    assert assessment.night_bed_exit is False
    assert "Compulsive pacing loop: 5 corridor laps" in assessment.contributing_factors[0]
    assert "pacing" in assessment.action_alert.lower()


def test_nocturnal_bed_exit_with_supportive_hr():
    """Verifies that a 02:30 AM bed exit for 8 mins with 4 laps and supportive pulse triggers NOCTURNAL_BED_EXIT (70 pts)."""
    baseline_engine = BaselineEngine()
    engine = WanderingEngine(baseline_engine=baseline_engine)
    engine.reset_state_for_resident(1)

    # Establish baseline HR of 70 bpm
    baseline_engine.process_reading(VitalReading(
        resident_id=1,
        heart_rate=70.0,
        generated_at=datetime(2026, 11, 24, 8, 0, 0)
    ))

    # Night reading: 02:30 AM, pulse 92 bpm (>20% above 70 bpm baseline)
    reading = VitalReading(
        resident_id=1,
        heart_rate=92.0,
        generated_at=datetime(2026, 11, 24, 2, 30, 0)
    )

    assessment = engine.assess_movement(
        resident_id=1,
        current_zone="North Memory Corridor Gallery",
        zone_type="corridor",
        is_safe_perimeter=True,
        reading=reading,
        timestamp=datetime(2026, 11, 24, 2, 30, 0),
        forced_minutes_out_of_bed=8.0,
        forced_pacing_laps=4
    )

    # Calculation: 25 (4 laps) + 30 (>5 min night exit) + 15 (supportive HR) = 70.0
    assert assessment.wandering_status == "NOCTURNAL_BED_EXIT"
    assert assessment.elopement_risk == "ELEVATED"
    assert assessment.risk_score == 70.0
    assert assessment.night_bed_exit is True
    assert assessment.minutes_out_of_bed == 8.0
    assert len(assessment.contributing_factors) == 3
    assert any("out of bed for 8 minutes" in f for f in assessment.contributing_factors)
    assert any("4 corridor laps" in f for f in assessment.contributing_factors)
    assert any("Supportive physical restlessness" in f for f in assessment.contributing_factors)
    assert "dispatch caregiver" in assessment.action_alert.lower()


def test_immediate_perimeter_safety_override():
    """Verifies that is_safe_perimeter=False triggers an immediate PERIMETER_ALERT with score=100.0 regardless of lap count."""
    engine = WanderingEngine()
    engine.reset_state_for_resident(1)

    # Resident walks straight to restricted fire stairwell (0 laps, 0 mins out)
    assessment = engine.assess_movement(
        resident_id=1,
        current_zone="Fire Stairwell B (Restricted Egress)",
        zone_type="restricted",
        is_safe_perimeter=False,
        timestamp=datetime(2026, 11, 24, 15, 0, 0),
        forced_minutes_out_of_bed=0.0,
        forced_pacing_laps=0
    )

    assert assessment.wandering_status == "PERIMETER_ALERT"
    assert assessment.elopement_risk == "CRITICAL"
    assert assessment.risk_score == 100.0
    assert assessment.is_safe_zone is False
    assert "Immediate Perimeter Breach" in assessment.contributing_factors[0]
    assert "IMMEDIATE DOOR ALERT" in assessment.action_alert


def test_process_reading_contract():
    """Verifies BaseEngine process_reading returns compliant contract dictionary."""
    engine = WanderingEngine()
    reading = VitalReading(resident_id=3, heart_rate=72.0)
    result = engine.process_reading(reading)

    assert result["resident_id"] == 3
    assert "wandering_status" in result
    assert "elopement_risk" in result
    assert "risk_score" in result
    assert "current_location" in result
