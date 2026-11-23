import pytest
from datetime import datetime, timedelta
from src.services.baseline.engine import BaselineEngine
from src.services.baseline.repository import InMemoryBaselineRepository
from src.services.trend.engine import TrendEngine
from src.services.trend.repository import InMemoryTrendRepository
from src.services.correlation.engine import CorrelationEngine
from src.services.correlation.repository import InMemoryCorrelationRepository
from src.services.healthy_ageing.engine import HealthyAgeingEngine
from src.services.ai_summary.engine import AISummaryEngine
from src.services.ai_summary.llm_client import generate_template_summary, parse_summary
from src.core.models import VitalReading

_BASE_TIME = datetime(2026, 7, 29, 13, 36, 0)


def test_template_summary_good_category():
    context = {"resident_name": "Rose", "category": "Good", "score": 85}
    text = generate_template_summary(context)
    headline, summary = parse_summary(text)

    assert "Rose" in headline
    assert len(headline) > 0
    assert len(summary) > 0
    # Friendly, non-clinical language
    assert "wonderfully" in headline.lower() or "great" in headline.lower()


def test_template_summary_concern_category():
    context = {"resident_name": "Arthur", "category": "Poor", "score": 50}
    text = generate_template_summary(context)
    headline, summary = parse_summary(text)

    assert "Arthur" in headline
    assert "checking" in headline.lower() or "caregiver" in summary.lower()


def test_ai_summary_learning_phase():
    engine = AISummaryEngine()
    result = engine.get_current_summary(1)
    assert result["status"] == "learning"


def test_ai_summary_generates_when_ready_without_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    baseline_engine = BaselineEngine(repository=InMemoryBaselineRepository())
    trend_engine = TrendEngine(repository=InMemoryTrendRepository())
    correlation_engine = CorrelationEngine(repository=InMemoryCorrelationRepository())
    healthy_engine = HealthyAgeingEngine(baseline_engine, trend_engine, correlation_engine)
    ai_engine = AISummaryEngine(baseline_engine, trend_engine, correlation_engine, healthy_engine)

    # Feed 10 readings to exit learning mode
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

    result = ai_engine.get_current_summary(1, resident_name="Rose")

    assert result["status"] == "ready"
    assert "headline" in result
    assert "summary" in result
    assert "Rose" in result["headline"]
