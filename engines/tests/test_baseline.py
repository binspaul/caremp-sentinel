import pytest
from datetime import datetime, timedelta
from src.services.baseline.engine import BaselineEngine
from src.services.baseline.repository import InMemoryBaselineRepository
from src.core.models import VitalReading

def test_baseline_engine_updates_state(sample_reading):
    engine = BaselineEngine(repository=InMemoryBaselineRepository(), alpha=0.5)
    result = engine.process_reading(sample_reading)

    assert result["resident_id"] == 101
    assert "heart_rate" in result["baselines"]
    assert result["baselines"]["heart_rate"] == 72.0

    # Process second reading
    reading2 = VitalReading(
        resident_id=101, 
        heart_rate=80.0,
        generated_at=sample_reading.generated_at + timedelta(seconds=60)
    )
    result2 = engine.process_reading(reading2)
    # EWMA with alpha 0.5: 0.5*80 + 0.5*72 = 76.0
    assert result2["baselines"]["heart_rate"] == 76.0

def test_physiological_preclamp_discards_extreme_artifacts():
    engine = BaselineEngine(repository=InMemoryBaselineRepository(), alpha=0.1)
    t0 = datetime(2026, 11, 20, 10, 0, 0)
    
    # Valid reading
    reading1 = VitalReading(resident_id=1, heart_rate=72.0, generated_at=t0)
    engine.process_reading(reading1)
    assert engine.get_current_baselines(1)["heart_rate"] == 72.0

    # Sensor glitch: impossible 450 bpm HR
    reading2 = VitalReading(resident_id=1, heart_rate=450.0, generated_at=t0 + timedelta(seconds=60))
    result = engine.process_reading(reading2)

    # 450 bpm was filtered out, baseline remains uncorrupted at 72.0
    assert result["baselines"]["heart_rate"] == 72.0

def test_time_aware_smoothing_adapts_for_reconnect_gaps():
    engine = BaselineEngine(repository=InMemoryBaselineRepository(), alpha=0.1)
    t0 = datetime(2026, 11, 20, 10, 0, 0)

    reading1 = VitalReading(resident_id=1, heart_rate=70.0, generated_at=t0)
    engine.process_reading(reading1)

    # 2 hours later (7200 seconds), resident reconnects with HR=90.0
    reading2 = VitalReading(resident_id=1, heart_rate=90.0, generated_at=t0 + timedelta(hours=2))
    result = engine.process_reading(reading2)

    # Effective alpha adapted smoothly, moving baseline higher than a single 60s step
    assert result["baselines"]["heart_rate"] > 72.0
