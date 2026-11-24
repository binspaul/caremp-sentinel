import pytest
from src.core.models import VitalReading
from src.services.circadian import CircadianEngine, CircadianAssessment


def test_normal_circadian_rhythm():
    """Verifies that a healthy day/night balance yields NORMAL_RHYTHM with a high score."""
    engine = CircadianEngine()

    assessment = engine.assess_circadian_rhythm(
        resident_id=1,
        daytime_sleep_minutes=30,
        nighttime_sleep_minutes=450,  # 7.5 hours
        night_awakenings=1,
        deep_sleep_minutes=75
    )

    assert assessment.status == "NORMAL_RHYTHM"
    assert assessment.severity == "NORMAL"
    assert assessment.circadian_score >= 85.0
    assert assessment.day_night_ratio <= 0.15
    assert len(assessment.actionable_advice) >= 1
    assert "Healthy day-night sleep balance" in assessment.actionable_advice[0]


def test_mild_circadian_drift():
    """Verifies that moderate afternoon napping and 3 night awakenings triggers MILD_DRIFT."""
    engine = CircadianEngine()

    assessment = engine.assess_circadian_rhythm(
        resident_id=1,
        daytime_sleep_minutes=95,
        nighttime_sleep_minutes=340,
        night_awakenings=3,
        deep_sleep_minutes=45
    )

    assert assessment.status == "MILD_DRIFT"
    assert assessment.severity in ("LOW", "MODERATE")
    assert 50.0 <= assessment.circadian_score < 75.0
    assert assessment.day_night_ratio > 0.25
    assert any("Limit afternoon" in tip for tip in assessment.actionable_advice)


def test_severe_day_night_reversal():
    """Verifies that extensive armchair napping and broken nights triggers SEVERE_REVERSAL."""
    engine = CircadianEngine()

    # 3.5 hrs napping in day vs 4 hrs sleep at night, 6 night wakeups, 20 mins deep sleep
    assessment = engine.assess_circadian_rhythm(
        resident_id=1,
        daytime_sleep_minutes=210,
        nighttime_sleep_minutes=240,
        night_awakenings=6,
        deep_sleep_minutes=20
    )

    assert assessment.status == "SEVERE_REVERSAL"
    assert assessment.severity == "HIGH"
    assert assessment.circadian_score < 50.0
    assert assessment.day_night_ratio >= 0.80
    assert len(assessment.contributing_factors) >= 3
    assert any("Severe day-night sleep inversion" in f for f in assessment.contributing_factors)
    assert any("sunlight" in tip.lower() for tip in assessment.actionable_advice)
    assert any("11:00 AM" in tip for tip in assessment.actionable_advice)


def test_process_reading_contract():
    """Verifies BaseEngine process_reading returns compliant contract dictionary."""
    engine = CircadianEngine()
    reading = VitalReading(resident_id=4, total_sleep_time=420, deep_sleep_time=60)
    result = engine.process_reading(reading)

    assert result["resident_id"] == 4
    assert "circadian_score" in result
    assert "status" in result
    assert "severity" in result
    assert "day_night_ratio" in result
    assert "actionable_advice" in result
