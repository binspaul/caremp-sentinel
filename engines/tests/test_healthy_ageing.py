import pytest
from datetime import datetime, timedelta
from src.services.baseline.engine import BaselineEngine
from src.services.baseline.repository import InMemoryBaselineRepository
from src.services.trend.engine import TrendEngine
from src.services.trend.repository import InMemoryTrendRepository
from src.services.correlation.engine import CorrelationEngine
from src.services.correlation.repository import InMemoryCorrelationRepository
from src.services.healthy_ageing.engine import HealthyAgeingEngine
from src.core.models import VitalReading

_BASE_TIME = datetime(2026, 7, 29, 13, 36, 0)

def test_healthy_ageing_stays_learning_until_inputs_ready():
    baseline_engine = BaselineEngine(repository=InMemoryBaselineRepository())
    trend_engine = TrendEngine(repository=InMemoryTrendRepository())
    correlation_engine = CorrelationEngine(repository=InMemoryCorrelationRepository())
    healthy_engine = HealthyAgeingEngine(baseline_engine, trend_engine, correlation_engine)

    # 1 reading only -> Trend and Correlation are in learning mode
    reading = VitalReading(
        resident_id=1,
        heart_rate=72.0,
        oxygen_saturation=98.0,
        hrv=45.0,
        systolic_bp=120.0,
        diastolic_bp=80.0,
        generated_at=_BASE_TIME
    )
    baseline_engine.process_reading(reading)
    trend_engine.process_reading(reading)
    correlation_engine.process_reading(reading)
    result = healthy_engine.process_reading(reading)

    assert result["healthy_ageing"]["status"] == "learning"
    assert "pending_trends" in result["healthy_ageing"]

def test_healthy_ageing_evaluates_score_when_ready():
    baseline_engine = BaselineEngine(repository=InMemoryBaselineRepository())
    trend_engine = TrendEngine(repository=InMemoryTrendRepository())
    correlation_engine = CorrelationEngine(repository=InMemoryCorrelationRepository())
    healthy_engine = HealthyAgeingEngine(baseline_engine, trend_engine, correlation_engine)

    # Feed 10 varied readings
    for i in range(10):
        reading = VitalReading(
            resident_id=1,
            heart_rate=70.0 + (i % 2),
            oxygen_saturation=98.0 + (i % 2),
            hrv=50.0 - (i % 2),
            systolic_bp=120.0,
            diastolic_bp=80.0,
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        baseline_engine.process_reading(reading)
        trend_engine.process_reading(reading)
        correlation_engine.process_reading(reading)

    result = healthy_engine.process_reading(reading)
    ha = result["healthy_ageing"]

    assert ha["status"] == "ready"
    assert "score" in ha
    assert "category" in ha
    assert 0 <= ha["score"] <= 100
