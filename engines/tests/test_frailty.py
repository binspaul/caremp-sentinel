from src.services.frailty.engine import FrailtyEngine
from src.services.frailty.frailty_clock import compute_frailty_and_longevity
from src.core.models import VitalReading


def test_frailty_robust():
    assessment = compute_frailty_and_longevity(
        resident_id=1,
        chronological_age=65,
        resting_hr=68,
        hrv_rmssd=45,
        systolic_bp=118,
        diastolic_bp=78,
        spo2=98,
        total_sleep_minutes=450,
        deep_sleep_minutes=75,
        step_count=7000
    )
    assert assessment.classification == "ROBUST"
    assert assessment.frailty_index < 0.12
    assert assessment.sarcopenia_risk == "LOW"


def test_frailty_frail():
    assessment = compute_frailty_and_longevity(
        resident_id=1,
        chronological_age=78,
        resting_hr=96,      # tachycardia
        hrv_rmssd=16,       # severely depressed HRV
        systolic_bp=165,    # hypertension
        diastolic_bp=95,
        spo2=91,            # hypoxemia
        total_sleep_minutes=240, # severe sleep deprivation
        deep_sleep_minutes=20,
        step_count=900      # severe sedentary
    )
    assert assessment.classification == "FRAIL"
    assert assessment.frailty_index >= 0.25
    assert assessment.biological_age_delta > 0
    assert assessment.sarcopenia_risk == "HIGH"
    assert len(assessment.contributing_factors) >= 4
    assert len(assessment.longevity_interventions) >= 1


def test_frailty_engine_reading():
    engine = FrailtyEngine()
    engine.set_chronological_age(1, 72)
    reading = VitalReading(
        resident_id=1,
        heart_rate=72,
        hrv=42,
        systolic_bp=122,
        diastolic_bp=80,
        oxygen_saturation=97
    )
    assessment = engine.assess_reading(reading)
    assert assessment.classification in ("ROBUST", "PRE_FRAIL")
