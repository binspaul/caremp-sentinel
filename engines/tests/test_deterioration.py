from src.services.deterioration.engine import DeteriorationEngine
from src.services.deterioration.news2 import calculate_news2, evaluate_sepsis_risk
from src.services.deterioration.arrhythmia import evaluate_nocturnal_hemodynamics
from src.core.models import VitalReading


def test_news2_normal():
    news = calculate_news2(heart_rate=72, systolic_bp=120, spo2=98, body_temp=36.8)
    assert news.total_score == 0
    assert news.risk_level == "LOW"


def test_news2_critical():
    # Severe tachycardia (135), severe hypotension (85), hypoxia (89), pyrexia (39.2)
    news = calculate_news2(heart_rate=135, systolic_bp=85, spo2=89, body_temp=39.2)
    assert news.total_score >= 8
    assert news.risk_level == "HIGH"
    assert news.has_extreme_single_score is True


def test_sepsis_early_warning():
    # Tachycardia + hypotension + pyrexia + hypoxia
    sepsis = evaluate_sepsis_risk(heart_rate=125, systolic_bp=88, spo2=89, body_temp=39.4)
    assert sepsis.is_sepsis_suspected is True
    assert sepsis.severity == "HIGH_PRODROME"
    assert sepsis.advance_warning_hours is not None
    assert sepsis.qsofa_score >= 2


def test_nocturnal_non_dipper():
    assessment = evaluate_nocturnal_hemodynamics(
        is_sleep=True,
        systolic_bp=122,
        daytime_sbp_baseline=125,  # Only 2.4% dip
        heart_rate=65,
        spo2=96
    )
    assert assessment.dipping_status == "NON_DIPPER"
    assert assessment.dip_percentage < 10.0


def test_nocturnal_reverse_dipper():
    assessment = evaluate_nocturnal_hemodynamics(
        is_sleep=True,
        systolic_bp=135,
        daytime_sbp_baseline=120,  # Negative dip (BP increases during sleep)
        heart_rate=70,
        spo2=96
    )
    assert assessment.dipping_status == "REVERSE_DIPPER"


def test_deterioration_engine_full():
    engine = DeteriorationEngine()
    engine.set_daytime_baseline(1, 120.0)
    reading = VitalReading(
        resident_id=1,
        heart_rate=130,
        systolic_bp=86,
        oxygen_saturation=89,
        body_temperature=39.3
    )
    assessment = engine.assess_reading(reading)
    assert assessment.overall_clinical_priority == "CRITICAL_EMERGENCY"
    assert assessment.news2.risk_level == "HIGH"
    assert assessment.sepsis.is_sepsis_suspected is True
