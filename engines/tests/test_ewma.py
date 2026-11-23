import pytest
from src.services.baseline.ewma import EWMABaseline

def test_first_value_seeds_baseline_directly():
    ewma = EWMABaseline()
    result = ewma.update(72.0)

    assert result == 72.0
    assert ewma.baseline == 72.0
    assert ewma.mad == 7.2

def test_first_value_near_zero_floors_mad_at_one():
    ewma = EWMABaseline()
    ewma.update(0.5)

    assert ewma.mad == 1.0

def test_second_value_moves_baseline_by_alpha():
    ewma = EWMABaseline(alpha=0.1, beta=0.1, k=3.0)
    ewma.update(100.0)
    ewma.update(110.0)

    expected_baseline = 0.1 * 110.0 + 0.9 * 100.0
    assert ewma.baseline == pytest.approx(expected_baseline)

def test_large_outlier_is_clipped_instead_of_adopted():
    ewma = EWMABaseline(alpha=0.1, beta=0.1, k=3.0)
    ewma.update(70.0)  # baseline=70, mad=7.0

    # diff=430 >> 3*7=21, clipped to 70 + 21 = 91
    ewma.update(500.0)

    # Baseline moves toward 91, not 500
    assert 70.0 < ewma.baseline < 75.0

def test_none_value_is_ignored():
    ewma = EWMABaseline()
    ewma.update(80.0)
    result = ewma.update(None)

    assert result == 80.0
    assert ewma.baseline == 80.0
