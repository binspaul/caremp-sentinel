import pytest
from src.services.trend.regression import compute_trend

def test_returns_none_with_fewer_than_two_points():
    assert compute_trend([]) is None
    assert compute_trend([10.0]) is None

def test_perfectly_linear_increasing_series():
    trend = compute_trend([10.0, 20.0, 30.0, 40.0])

    assert trend.direction == "Increasing"
    assert trend.slope == pytest.approx(10.0)
    assert trend.strength == pytest.approx(1.0)
    assert trend.first_value == 10.0
    assert trend.last_value == 40.0
    assert trend.absolute_change == pytest.approx(30.0)
    assert trend.percentage_change == pytest.approx(300.0)

def test_perfectly_linear_decreasing_series():
    trend = compute_trend([40.0, 30.0, 20.0, 10.0])

    assert trend.direction == "Decreasing"
    assert trend.slope == pytest.approx(-10.0)
    assert trend.strength == pytest.approx(1.0)

def test_flat_series_is_stable():
    trend = compute_trend([50.0, 50.0, 50.0, 50.0])

    assert trend.direction == "Stable"
    assert trend.slope == pytest.approx(0.0)
    assert trend.strength == pytest.approx(1.0)
    assert trend.absolute_change == 0.0

def test_small_fluctuation_within_threshold_is_stable():
    trend = compute_trend([100.0, 100.2, 99.9, 100.1])
    assert trend.direction == "Stable"
