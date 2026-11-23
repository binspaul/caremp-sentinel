from typing import Any, Dict, Optional, Tuple
from ...core.base import BaseEngine
from ...core.models import VitalReading
from ..baseline.engine import BaselineEngine
from ..trend.engine import TrendEngine
from ..correlation.engine import CorrelationEngine
from ..healthy_ageing.engine import HealthyAgeingEngine
from ..healthy_ageing import rules
from . import llm_client


class AISummaryEngine(BaseEngine):
    """
    AI Summary Engine that turns Healthy Ageing's score/category/triggered rules
    into a short, warm, non-clinical update directly for the resident.
    Includes state fingerprint caching and automatic zero-key template generation.
    """

    def __init__(
        self,
        baseline_engine: Optional[BaselineEngine] = None,
        trend_engine: Optional[TrendEngine] = None,
        correlation_engine: Optional[CorrelationEngine] = None,
        healthy_ageing_engine: Optional[HealthyAgeingEngine] = None,
    ):
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.trend_engine = trend_engine or TrendEngine()
        self.correlation_engine = correlation_engine or CorrelationEngine()
        self.healthy_ageing_engine = healthy_ageing_engine or HealthyAgeingEngine(
            self.baseline_engine, self.trend_engine, self.correlation_engine
        )

        # resident_id -> {"fingerprint": ..., "summary": {"headline": ..., "summary": ...}}
        self._cache: Dict[int, Dict[str, Any]] = {}

    @property
    def name(self) -> str:
        return "AI Summary Engine"

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Processes a reading by returning the latest available wellness summary.
        """
        resident_id = reading.resident_id
        summary_result = self.get_current_summary(resident_id)

        return {
            "resident_id": resident_id,
            "ai_summary": summary_result,
            "status": "updated"
        }

    def _build_context(self, resident_id: int, resident_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Assembles plain-language friendly context from the engines.
        Returns None if Healthy Ageing is still in its learning phase.
        """
        assessment = self.healthy_ageing_engine.get_current_assessment(resident_id)
        if assessment.get("status") != "ready":
            return None

        rule_descriptions = {rule.id: rule.description for rule in rules.RULES}
        triggered_descriptions = [
            rule_descriptions.get(rule_id, rule_id) for rule_id in assessment.get("triggered_rules", [])
        ]

        baselines = self.baseline_engine.get_current_baselines(resident_id)

        trends: Dict[str, str] = {}
        for metric in self.baseline_engine.metrics:
            trend = self.trend_engine.get_current_trend(resident_id, metric)
            if trend and trend.get("status") == "ready":
                trends[metric] = trend["direction"]

        return {
            "resident_name": resident_name,
            "score": assessment["score"],
            "category": assessment["category"],
            "triggered_rule_descriptions": triggered_descriptions,
            "baselines": baselines,
            "trends": trends,
        }

    @staticmethod
    def _fingerprint(context: Dict[str, Any]) -> Tuple:
        return (
            context.get("resident_name"),
            context.get("category"),
            round(context.get("score", 0)),
            tuple(sorted(context.get("triggered_rule_descriptions", []))),
            tuple(sorted(context.get("trends", {}).items())),
        )

    def get_current_summary(self, resident_id: int, resident_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns the current wellness summary for a resident.
        Generates fresh text only when health state changes, otherwise serves from cache.
        """
        context = self._build_context(resident_id, resident_name)
        if context is None:
            return {"status": "learning"}

        fingerprint = self._fingerprint(context)
        cached = self._cache.get(resident_id)

        if cached is not None and cached["fingerprint"] == fingerprint:
            return {"status": "ready", **cached["summary"]}

        try:
            raw_response = llm_client.generate_summary(context)
            headline, summary_text = llm_client.parse_summary(raw_response)
            summary = {"headline": headline, "summary": summary_text}
            self._cache[resident_id] = {"fingerprint": fingerprint, "summary": summary}
            return {"status": "ready", **summary}
        except Exception as error:
            if cached is not None:
                return {"status": "ready", **cached["summary"], "stale": True}
            # Graceful fallback directly to template
            raw_fallback = llm_client.generate_template_summary(context)
            headline, summary_text = llm_client.parse_summary(raw_fallback)
            return {"status": "ready", "headline": headline, "summary": summary_text}
