import pytest
from src.services.correlation.correlation import compute_correlation, _direction, _strength

def test_returns_none_with_fewer_than_two_points():
    assert compute_correlation([], []) is None
    assert compute_correlation([1.0], [2.0]) is None

def test_perfect_positive_correlation():
    result = compute_correlation([1.0, 2.0, 3.0, 4.0], [2.0, 4.0, 6.0, 8.0])
    assert result.coefficient == pytest.approx(1.0)
    assert result.direction == "Positive"
    assert result.strength == "Strong"

def test_perfect_negative_correlation():
    result = compute_correlation([1.0, 2.0, 3.0, 4.0], [8.0, 6.0, 4.0, 2.0])
    assert result.coefficient == pytest.approx(-1.0)
    assert result.direction == "Negative"
    assert result.strength == "Strong"

def test_returns_none_when_a_series_has_zero_variance():
    assert compute_correlation([1.0, 2.0, 3.0], [5.0, 5.0, 5.0]) is None

def test_direction_follows_thresholds():
    assert _direction(0.05) == "None"
    assert _direction(-0.05) == "None"
    assert _direction(0.5) == "Positive"
    assert _direction(-0.5) == "Negative"

def test_strength_bucket_boundaries():
    assert _strength(0.1) == "Weak"
    assert _strength(0.39) == "Weak"
    assert _strength(0.4) == "Moderate"
    assert _strength(0.6) == "Strong"
