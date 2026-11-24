from typing import Any, Dict, Optional, Tuple, List
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
    AI Summary Engine that turns resident vital baselines, trends,
    sundowning restlessness, wandering safety, circadian sleep rhythm, and deterioration
    into a warm, supportive, non-clinical update directly for the resident.
    Includes state fingerprint caching and automatic zero-key template generation.
    """

    def __init__(
        self,
        baseline_engine: Optional[BaselineEngine] = None,
        trend_engine: Optional[TrendEngine] = None,
        correlation_engine: Optional[CorrelationEngine] = None,
        healthy_ageing_engine: Optional[HealthyAgeingEngine] = None,
        sundowning_engine: Optional[Any] = None,
        wandering_engine: Optional[Any] = None,
        circadian_engine: Optional[Any] = None,
        deterioration_engine: Optional[Any] = None,
    ):
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.trend_engine = trend_engine or TrendEngine()
        self.correlation_engine = correlation_engine or CorrelationEngine()
        self.healthy_ageing_engine = healthy_ageing_engine
        self.sundowning_engine = sundowning_engine
        self.wandering_engine = wandering_engine
        self.circadian_engine = circadian_engine
        self.deterioration_engine = deterioration_engine

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

    def _build_context(
        self,
        resident_id: int,
        resident_name: Optional[str] = None,
        twin: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Assembles plain-language friendly context from the engines.
        Returns None if there is no data or baselines recorded yet for the resident.
        """
        baselines = self.baseline_engine.get_current_baselines(resident_id)

        # If healthy ageing is explicitly provided and still learning, or no data yet
        if not baselines and not (twin and twin.get("physiology")):
            if self.healthy_ageing_engine:
                ha = self.healthy_ageing_engine.get_current_assessment(resident_id)
                if ha.get("status") != "ready":
                    return None
            else:
                return None

        trends: Dict[str, str] = {}
        for metric in self.baseline_engine.metrics:
            trend = self.trend_engine.get_current_trend(resident_id, metric)
            if trend and trend.get("status") == "ready":
                trends[metric] = trend["direction"]

        score = 88.0
        category = "Good"
        triggered_descriptions: List[str] = []

        # 1. Healthy Ageing integration (if active and ready)
        if self.healthy_ageing_engine:
            ha = self.healthy_ageing_engine.get_current_assessment(resident_id)
            if ha.get("status") == "ready":
                score = float(ha.get("score", 88.0))
                category = ha.get("category", "Good")
                rule_descriptions = {rule.id: rule.description for rule in rules.RULES}
                triggered_descriptions.extend([
                    rule_descriptions.get(r_id, r_id) for r_id in ha.get("triggered_rules", [])
                ])

        # 2. Sundowning & Agitation integration
        sundowning_data = None
        if twin and "sundowning" in (twin.get("healthInsights") or {}):
            sundowning_data = twin["healthInsights"]["sundowning"]
        elif self.sundowning_engine:
            sundowning_data = self.sundowning_engine.get_current_assessment(resident_id)

        sundowning_status = None
        if sundowning_data:
            s_status = sundowning_data.status if hasattr(sundowning_data, "status") else sundowning_data.get("status", "CALM")
            s_idx = sundowning_data.agitation_index if hasattr(sundowning_data, "agitation_index") else sundowning_data.get("agitationIndex", 0.0)
            sundowning_status = s_status
            if s_status in ("AGITATED", "SURGE_ALERT") or s_idx >= 65:
                triggered_descriptions.append("Late-afternoon restlessness / agitation detected")
                score = min(score, 50.0)
                category = "Watch"
            elif s_status == "RESTLESS" or s_idx >= 40:
                triggered_descriptions.append("Mild afternoon restlessness")
                score = min(score, 70.0)
                if category == "Good":
                    category = "Fair"

        # 3. Wandering & Safety integration
        wandering_data = None
        if twin and "wandering" in (twin.get("healthInsights") or {}):
            wandering_data = twin["healthInsights"]["wandering"]
        elif self.wandering_engine:
            wandering_data = self.wandering_engine.get_current_assessment(resident_id)

        wandering_status = None
        if wandering_data:
            w_status = wandering_data.wandering_status if hasattr(wandering_data, "wandering_status") else wandering_data.get("wanderingStatus", "NORMAL")
            w_score = wandering_data.risk_score if hasattr(wandering_data, "risk_score") else wandering_data.get("riskScore", 0.0)
            wandering_status = w_status
            if w_status == "PERIMETER_ALERT":
                triggered_descriptions.append("Perimeter safety alert: resident near exit")
                score = min(score, 30.0)
                category = "Urgent"
            elif w_status == "NOCTURNAL_BED_EXIT" or w_score >= 50:
                triggered_descriptions.append("Nighttime bed exit / active in hallways")
                score = min(score, 55.0)
                category = "Watch"
            elif w_status == "PACING_LOOP":
                triggered_descriptions.append("Repetitive corridor pacing detected")
                score = min(score, 65.0)
                if category == "Good":
                    category = "Fair"

        # 4. Circadian Sleep-Wake integration
        circadian_data = None
        if twin and "circadian" in (twin.get("healthInsights") or {}):
            circadian_data = twin["healthInsights"]["circadian"]
        elif self.circadian_engine:
            circadian_data = self.circadian_engine.get_current_assessment(resident_id)

        circadian_status = None
        if circadian_data:
            c_status = circadian_data.status if hasattr(circadian_data, "status") else circadian_data.get("status", "OPTIMAL")
            c_score = circadian_data.circadian_score if hasattr(circadian_data, "circadian_score") else circadian_data.get("circadianScore", 100.0)
            circadian_status = c_status
            if c_status == "DAY_NIGHT_REVERSAL" or c_score < 50:
                triggered_descriptions.append("Day-night sleep reversal detected")
                score = min(score, 55.0)
                category = "Watch"
            elif c_status == "MODERATE_IRREGULARITY":
                triggered_descriptions.append("Daytime sleepiness / fragmented night sleep")
                score = min(score, 70.0)
                if category == "Good":
                    category = "Fair"

        # 5. Deterioration & Vital Warning integration
        deterioration_data = None
        if twin and "deterioration" in (twin.get("healthInsights") or {}):
            deterioration_data = twin["healthInsights"]["deterioration"]
        elif self.deterioration_engine:
            deterioration_data = self.deterioration_engine.get_current_assessment(resident_id)

        if deterioration_data:
            priority = deterioration_data.overall_clinical_priority if hasattr(deterioration_data, "overall_clinical_priority") else deterioration_data.get("overall_clinical_priority", "ROUTINE")
            if priority == "CRITICAL_EMERGENCY":
                triggered_descriptions.append("Elevated vital signs / possible infection alert")
                score = min(score, 25.0)
                category = "Critical"
            elif priority == "URGENT_ATTENTION":
                triggered_descriptions.append("Elevated vital signs need caregiver attention")
                score = min(score, 50.0)
                category = "Watch"

        return {
            "resident_name": resident_name,
            "score": round(score, 1),
            "category": category,
            "triggered_rule_descriptions": triggered_descriptions,
            "baselines": baselines,
            "trends": trends,
            "sundowning_status": sundowning_status,
            "wandering_status": wandering_status,
            "circadian_status": circadian_status,
        }

    @staticmethod
    def _fingerprint(context: Dict[str, Any]) -> Tuple:
        return (
            context.get("resident_name"),
            context.get("category"),
            round(context.get("score", 0)),
            tuple(sorted(context.get("triggered_rule_descriptions", []))),
            tuple(sorted(context.get("trends", {}).items())),
            context.get("sundowning_status"),
            context.get("wandering_status"),
            context.get("circadian_status"),
        )

    def get_current_summary(
        self,
        resident_id: int,
        resident_name: Optional[str] = None,
        twin: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Returns the current wellness summary for a resident.
        Generates fresh text only when health state changes, otherwise serves from cache.
        """
        context = self._build_context(resident_id, resident_name, twin=twin)
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
