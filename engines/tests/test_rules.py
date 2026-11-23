import pytest
from src.services.healthy_ageing import rules

def _context(baselines=None, trends=None, correlations=None):
    return {
        "baselines": baselines or {},
        "trends": trends or {},
        "correlations": correlations or {},
    }

def test_significant_bp_elevation_triggers_at_threshold():
    assert rules._significant_bp_elevation(_context({"systolic_bp": 140, "diastolic_bp": 80})) is True
    assert rules._significant_bp_elevation(_context({"systolic_bp": 120, "diastolic_bp": 90})) is True
    assert rules._significant_bp_elevation(_context({"systolic_bp": 120, "diastolic_bp": 80})) is False

def test_mild_bp_elevation_triggers_in_range():
    assert rules._mild_bp_elevation(_context({"systolic_bp": 135, "diastolic_bp": 75})) is True
    assert rules._mild_bp_elevation(_context({"systolic_bp": 120, "diastolic_bp": 75})) is False

def test_mild_bp_elevation_does_not_double_fire_with_significant():
    context = _context({"systolic_bp": 135, "diastolic_bp": 95})
    assert rules._significant_bp_elevation(context) is True
    assert rules._mild_bp_elevation(context) is False

def test_resting_heart_rate_elevated_boundary():
    assert rules._resting_heart_rate_elevated(_context({"heart_rate": 101})) is True
    assert rules._resting_heart_rate_elevated(_context({"heart_rate": 100})) is False

def test_resting_heart_rate_low_boundary():
    assert rules._resting_heart_rate_low(_context({"heart_rate": 49})) is True
    assert rules._resting_heart_rate_low(_context({"heart_rate": 50})) is False

def test_low_oxygen_saturation_boundary():
    assert rules._low_oxygen_saturation(_context({"oxygen_saturation": 93})) is True
    assert rules._low_oxygen_saturation(_context({"oxygen_saturation": 94})) is False

def test_elevated_body_temperature_boundary():
    assert rules._elevated_body_temperature(_context({"body_temperature": 37.6})) is True
    assert rules._elevated_body_temperature(_context({"body_temperature": 37.5})) is False

def test_score_and_category_mapping():
    assert rules.determine_category(95) == "Excellent"
    assert rules.determine_category(90) == "Excellent"
    assert rules.determine_category(85) == "Good"
    assert rules.determine_category(75) == "Good"
    assert rules.determine_category(70) == "Fair"
    assert rules.determine_category(50) == "Poor"
    assert rules.determine_category(35) == "Critical"

def test_category_hysteresis_deadband():
    # If previously "Good" and score drops slightly to 74.0 (within 1.5 buffer of 75), keep "Good"
    assert rules.determine_category(74.0, previous_category="Good") == "Good"
    
    # If score drops below buffer to 73.0, it drops to "Fair"
    assert rules.determine_category(73.0, previous_category="Good") == "Fair"
    
    # If previously "Fair" and climbs to 74.0, it stays "Fair" (must reach 75 to enter Good)
    assert rules.determine_category(74.0, previous_category="Fair") == "Fair"
    assert rules.determine_category(75.0, previous_category="Fair") == "Good"
