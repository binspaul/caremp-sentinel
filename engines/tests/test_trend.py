import pytest
from datetime import datetime, timedelta
from src.services.trend.engine import TrendEngine, WINDOWS
from src.services.trend.repository import InMemoryTrendRepository
from src.core.models import VitalReading

_BASE_TIME = datetime(2026, 7, 29, 13, 36, 0)
MIN_READINGS = WINDOWS["30m"]["min_readings"]

def test_trend_learning_phase_until_minimum_readings():
    engine = TrendEngine(repository=InMemoryTrendRepository())

    for i in range(MIN_READINGS - 1):
        reading = VitalReading(
            resident_id=1,
            heart_rate=70.0 + i,
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        result = engine.process_reading(reading)
        hr_trend = result["trends"]["heart_rate"]["30m"]
        assert hr_trend["status"] == "learning"

def test_trend_becomes_ready_and_detects_increase():
    engine = TrendEngine(repository=InMemoryTrendRepository())

    for i in range(MIN_READINGS):
        reading = VitalReading(
            resident_id=1,
            heart_rate=70.0 + (i * 2.0),
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        result = engine.process_reading(reading)

    hr_trend = result["trends"]["heart_rate"]["30m"]
    assert hr_trend["status"] == "ready"
    assert hr_trend["direction"] == "Increasing"
    assert hr_trend["slope"] > 0
    assert hr_trend["strength"] == pytest.approx(1.0)

def test_trend_suppresses_isolated_motion_spike():
    engine = TrendEngine(repository=InMemoryTrendRepository())

    # 9 flat baseline readings around 70 bpm
    for i in range(MIN_READINGS - 1):
        reading = VitalReading(
            resident_id=2,
            heart_rate=70.0,
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        engine.process_reading(reading)

    # 10th reading has an isolated motion artifact spike of 160 bpm
    spike_reading = VitalReading(
        resident_id=2,
        heart_rate=160.0,
        generated_at=_BASE_TIME + timedelta(minutes=MIN_READINGS - 1)
    )
    result = engine.process_reading(spike_reading)
    hr_trend = result["trends"]["heart_rate"]["30m"]

    # Even with the spike, robust fitting suppresses it from triggering a runaway trend
    assert hr_trend["status"] == "ready"
    assert hr_trend["last_value"] < 120.0
