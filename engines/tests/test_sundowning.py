import pytest
from datetime import datetime
from src.core.models import VitalReading
from src.services.baseline.engine import BaselineEngine
from src.services.trend.engine import TrendEngine
from src.services.sundowning import SundowningEngine, SundowningAssessment


def test_calm_morning_state():
    """Verifies that a calm resident in the morning receives a CALM status with low agitation index."""
    baseline_engine = BaselineEngine()
    engine = SundowningEngine(baseline_engine=baseline_engine)

    # Pre-set baseline
    baseline_engine.process_reading(VitalReading(
        resident_id=1,
        heart_rate=70.0,
        hrv=35.0,
        generated_at=datetime(2026, 11, 24, 8, 0, 0)
    ))

    # Calm reading at 09:30 AM
    reading = VitalReading(
        resident_id=1,
        heart_rate=71.0,
        hrv=36.0,
        generated_at=datetime(2026, 11, 24, 9, 30, 0)
    )

    assessment = engine.assess_reading(reading)
    assert assessment.status == "CALM"
    assert assessment.severity == "NORMAL"
    assert assessment.agitation_index < 20.0
    assert assessment.advance_notice_minutes is None
    assert assessment.is_sundowning_window is False


def test_early_restlessness_sundowning_window():
    """Verifies that an early pulse elevation and HRV dip at 4:30 PM triggers RESTLESS with 35-min advance warning."""
    baseline_engine = BaselineEngine()
    engine = SundowningEngine(baseline_engine=baseline_engine)

    # Establish baseline
    baseline_engine.process_reading(VitalReading(
        resident_id=1,
        heart_rate=70.0,
        hrv=35.0,
        generated_at=datetime(2026, 11, 24, 8, 0, 0)
    ))

    # Reading at 16:30 (4:30 PM) during peak sundowning window: HR rises to 86 bpm (+23%), HRV dips to 20 ms
    reading = VitalReading(
        resident_id=1,
        heart_rate=86.0,
        hrv=20.0,
        generated_at=datetime(2026, 11, 24, 16, 30, 0)
    )

    assessment = engine.assess_reading(reading)
    assert assessment.status == "RESTLESS"
    assert assessment.is_sundowning_window is True
    assert 35.0 <= assessment.agitation_index < 65.0
    assert assessment.advance_notice_minutes == 35
    assert len(assessment.contributing_factors) >= 2
    assert any("above calm baseline" in f for f in assessment.contributing_factors)
    assert any("warm drink" in action.lower() or "music" in action.lower() for action in assessment.recommended_interventions)


def test_severe_sundowning_surge():
    """Verifies that an acute distress event (matching Scenario 6: HR 122 bpm, HRV 11 ms at 17:15) triggers SUNDOWNING_SURGE."""
    baseline_engine = BaselineEngine()
    engine = SundowningEngine(baseline_engine=baseline_engine)

    # Establish baseline
    baseline_engine.process_reading(VitalReading(
        resident_id=1,
        heart_rate=70.0,
        hrv=35.0,
        generated_at=datetime(2026, 11, 24, 8, 0, 0)
    ))

    # Severe surge reading at 17:15 (5:15 PM): HR 122 bpm (+74%), HRV 11 ms
    reading = VitalReading(
        resident_id=1,
        heart_rate=122.0,
        hrv=11.0,
        generated_at=datetime(2026, 11, 24, 17, 15, 0)
    )

    assessment = engine.assess_reading(reading)
    assert assessment.status == "SUNDOWNING_SURGE"
    assert assessment.severity == "HIGH"
    assert assessment.agitation_index >= 65.0
    assert assessment.is_sundowning_window is True
    assert len(assessment.recommended_interventions) >= 3
    assert any("dim" in action.lower() for action in assessment.recommended_interventions)


def test_process_reading_contract():
    """Verifies that BaseEngine process_reading returns a compliant dictionary."""
    engine = SundowningEngine()
    reading = VitalReading(resident_id=2, heart_rate=75.0, hrv=30.0)
    result = engine.process_reading(reading)

    assert result["resident_id"] == 2
    assert "agitation_index" in result
    assert "status" in result
    assert "severity" in result
    assert "contributing_factors" in result
    assert "recommended_interventions" in result

