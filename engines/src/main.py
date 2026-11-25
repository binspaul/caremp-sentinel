from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .services.baseline import BaselineEngine
from .services.trend import TrendEngine
from .services.correlation import CorrelationEngine
from .services.healthy_ageing import HealthyAgeingEngine
from .services.ai_summary import AISummaryEngine
from .services.genomics import GenomicsEngine
from .services.deterioration import DeteriorationEngine
from .services.frailty import FrailtyEngine
from .services.sundowning import SundowningEngine
from .services.wandering import WanderingEngine
from .services.circadian import CircadianEngine
from .utils import mapper
from .config import settings

app = FastAPI(
    title=f"{settings.APP_NAME} - careMP Sentinel",
    version="2.0.0",
    description="Microservice providing AI Diagnostics, Genomics (PRS & PGx), Early Deterioration Prediction, and Longevity Analytics."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent stateful engine instances shared across all requests
baseline_engine = BaselineEngine()
trend_engine = TrendEngine(recalculate_every=1)
correlation_engine = CorrelationEngine(recalculate_every=1)
healthy_ageing_engine = HealthyAgeingEngine(baseline_engine, trend_engine, correlation_engine, recalculate_every=1)

# careMP Sentinel Core Innovations
genomics_engine = GenomicsEngine()
deterioration_engine = DeteriorationEngine()
frailty_engine = FrailtyEngine()
sundowning_engine = SundowningEngine(baseline_engine, trend_engine)
wandering_engine = WanderingEngine(baseline_engine)
circadian_engine = CircadianEngine()

# AI Summary Engine with dementia intelligence integration
ai_summary_engine = AISummaryEngine(
    baseline_engine=baseline_engine,
    trend_engine=trend_engine,
    correlation_engine=correlation_engine,
    healthy_ageing_engine=healthy_ageing_engine,
    sundowning_engine=sundowning_engine,
    wandering_engine=wandering_engine,
    circadian_engine=circadian_engine,
    deterioration_engine=deterioration_engine,
)

# Pre-seed residents with clinically grounded Biotech & Genomic profiles
genomics_engine.register_profile(
    resident_id=1,
    prs_inputs={"cad": 84.0, "t2d": 62.0, "alzheimers": 72.0, "sarcopenia": 58.0},
    variants=[
        {"gene": "CYP2C19", "diplotype": "*1/*2", "phenotype": "INTERMEDIATE"},
        {"gene": "SLCO1B1", "diplotype": "521T>C", "phenotype": "DECREASED"},
        {"gene": "CYP2D6", "diplotype": "*1/*1", "phenotype": "NORMAL"},
        {"gene": "CYP2C9", "diplotype": "*1/*1", "phenotype": "NORMAL"}
    ],
    medications=["Atorvastatin", "Clopidogrel", "Lisinopril"]
)
deterioration_engine.set_daytime_baseline(1, 120.0)
frailty_engine.set_chronological_age(1, 78)

# Resident 2: Eleanor Vance (RES-002)
genomics_engine.register_profile(
    resident_id=2,
    prs_inputs={"cad": 76.0, "t2d": 45.0, "alzheimers": 88.0, "sarcopenia": 65.0},
    variants=[
        {"gene": "CYP2D6", "diplotype": "*4/*4", "phenotype": "POOR"},
        {"gene": "CYP2C19", "diplotype": "*1/*1", "phenotype": "NORMAL"}
    ],
    medications=["Metoprolol", "Donepezil", "Apixaban"]
)
deterioration_engine.set_daytime_baseline(2, 132.0)
frailty_engine.set_chronological_age(2, 78)

# Resident 3: Marcus Chen (RES-003)
genomics_engine.register_profile(
    resident_id=3,
    prs_inputs={"cad": 82.0, "t2d": 79.0, "alzheimers": 35.0, "sarcopenia": 40.0},
    variants=[
        {"gene": "CYP2C9", "diplotype": "*1/*3", "phenotype": "INTERMEDIATE"},
        {"gene": "VKORC1", "diplotype": "-1639G>A", "phenotype": "DECREASED"}
    ],
    medications=["Lisinopril", "Metformin", "Warfarin"]
)
deterioration_engine.set_daytime_baseline(3, 124.0)
frailty_engine.set_chronological_age(3, 68)

# Resident 4: Clara Oswald (RES-004)
genomics_engine.register_profile(
    resident_id=4,
    prs_inputs={"cad": 42.0, "t2d": 38.0, "alzheimers": 85.0, "sarcopenia": 45.0},
    variants=[
        {"gene": "APOE", "diplotype": "e3/e4", "phenotype": "ELEVATED_RISK"},
        {"gene": "CYP2D6", "diplotype": "*1/*1", "phenotype": "NORMAL"}
    ],
    medications=["Donepezil", "Calcium Citrate"]
)
deterioration_engine.set_daytime_baseline(4, 120.0)
frailty_engine.set_chronological_age(4, 74)


def _require_resident_id(twin: Dict[str, Any]) -> int:
    resident_id = twin.get("residentId") or twin.get("resident_id")
    if resident_id is None:
        raise HTTPException(status_code=400, detail="Request body must include 'residentId'.")
    return int(resident_id)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "sentinel_suite": ["baseline", "trend", "correlation", "healthy_ageing", "genomics", "deterioration", "frailty", "sundowning", "wandering", "circadian", "ai_summary"]
    }


@app.post("/engines/baseline")
@app.post("/api/engines/baseline")
def run_baseline(twin: Dict[str, Any]) -> Dict[str, Any]:
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    baseline_engine.process_reading(reading)

    updated_twin = dict(twin)
    baselines = mapper.map_baselines(baseline_engine, resident_id)
    updated_twin["baselines"] = baselines

    print(f"\n==================== [BASELINE ENGINE] ====================")
    print(f"Resident ID: {resident_id}")
    for metric, val in baselines.items():
        if isinstance(val, dict) and "value" in val:
            print(f"  • {metric}: {val['value']}")
        elif metric == "sleep":
            print(f"  • sleep: {val}")
    print("===========================================================")
    return updated_twin


@app.post("/engines/trend")
@app.post("/api/engines/trend")
def run_trend(twin: Dict[str, Any]) -> Dict[str, Any]:
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    trend_engine.process_reading(reading)

    updated_twin = dict(twin)
    trends = mapper.map_trends(trend_engine, resident_id)
    updated_twin["trends"] = trends

    print(f"\n===================== [TREND ENGINE] =====================")
    print(f"Resident ID: {resident_id} | Computed {len(trends)} trend(s)")
    for t in trends:
        print(f"  • {t['vital']}: {t['direction']} ({t['percentageChange']}% change, slope: {t['rateOfChange']})")
    print("==========================================================")
    return updated_twin


@app.post("/engines/correlation")
@app.post("/api/engines/correlation")
def run_correlation(twin: Dict[str, Any]) -> Dict[str, Any]:
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    correlation_engine.process_reading(reading)

    updated_twin = dict(twin)
    correlations = mapper.map_correlations(correlation_engine, resident_id)
    updated_twin["correlations"] = correlations

    print(f"\n================== [CORRELATION ENGINE] ==================")
    print(f"Resident ID: {resident_id} | Computed {len(correlations)} pair(s)")
    for c in correlations:
        print(f"  • {c['vitalPair']}: {c['direction']} ({c['strength']}, r={c['coefficient']})")
    print("==========================================================")
    return updated_twin


@app.post("/engines/healthy-ageing")
@app.post("/api/engines/healthy-ageing")
def run_healthy_ageing(twin: Dict[str, Any]) -> Dict[str, Any]:
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    healthy_ageing_engine.process_reading(reading)
    healthy_ageing = mapper.map_healthy_ageing(healthy_ageing_engine, resident_id)

    updated_twin = dict(twin)
    print(f"\n================ [HEALTHY AGEING ENGINE] ================")
    print(f"Resident ID: {resident_id}")
    if healthy_ageing is not None:
        existing_insights = twin.get("healthInsights") or {}
        updated_twin["healthInsights"] = {**existing_insights, "healthyAgeing": healthy_ageing}
        print(f"  • Health Score: {healthy_ageing['score']}/100")
        print(f"  • Category: {healthy_ageing['category']}")
        print(f"  • Triggered Rules: {healthy_ageing['triggeredRules']}")
    else:
        print("  • Status: In learning phase (accumulating readings)")
    print("==========================================================")
    return updated_twin


# =====================================================================
# careMP Sentinel: Genomics, Deterioration & Frailty Endpoints
# =====================================================================

@app.post("/engines/genomics")
@app.post("/api/engines/genomics")
def run_genomics(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluates PRS percentiles, CPIC pharmacogenomic safety, and pheno-genomic bounds."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    genomics_engine.process_reading(reading)

    genomics_data = mapper.map_genomics(genomics_engine, resident_id)
    updated_twin = dict(twin)
    if genomics_data:
        existing_insights = twin.get("healthInsights") or {}
        updated_twin["healthInsights"] = {**existing_insights, "genomics": genomics_data}

    print(f"\n==================== [GENOMICS ENGINE] ====================")
    print(f"Resident ID: {resident_id}")
    if genomics_data:
        print(f"  • Genetic Risk Tier: {genomics_data.get('overallGeneticRiskTier')}")
        print(f"  • Active PGx Alerts: {len(genomics_data.get('pharmacogenomics', {}).get('activeAlerts', []))}")
        for alert in genomics_data.get("pharmacogenomics", {}).get("activeAlerts", []):
            print(f"    - [{alert['severity']}] {alert['medication']} x {alert['gene']}: {alert['clinicalRecommendation']}")
    print("===========================================================")
    return updated_twin


@app.post("/engines/genomics/register")
@app.post("/api/engines/genomics/register")
def register_genomic_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Registers or updates a resident's PRS, variants, and active medications."""
    resident_id = int(payload.get("resident_id") or payload.get("residentId", 1))
    prs = payload.get("prs_inputs") or payload.get("prs", {})
    variants = payload.get("variants") or []
    medications = payload.get("medications") or []

    assessment = genomics_engine.register_profile(resident_id, prs, variants, medications)
    return {
        "status": "success",
        "resident_id": resident_id,
        "genetic_risk_tier": assessment.overall_genetic_risk_tier,
        "prs_count": len(assessment.prs_scores),
        "active_pgx_alerts": len(assessment.active_pgx_alerts)
    }


@app.post("/engines/deterioration")
@app.post("/api/engines/deterioration")
def run_deterioration(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Computes real-time NEWS2 score, Sepsis prodrome detection, and nocturnal dipping."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)

    deterioration_data = mapper.map_deterioration(deterioration_engine, reading)
    updated_twin = dict(twin)
    existing_insights = twin.get("healthInsights") or {}
    updated_twin["healthInsights"] = {**existing_insights, "deterioration": deterioration_data}

    print(f"\n================ [DETERIORATION & SEPSIS] ================")
    print(f"Resident ID: {resident_id}")
    news2 = deterioration_data["news2"]
    sepsis = deterioration_data["sepsis"]
    print(f"  • NEWS2 Score: {news2['totalScore']} ({news2['riskLevel']} Risk)")
    print(f"  • Sepsis Suspected: {sepsis['isSuspected']} (Severity: {sepsis['severity']})")
    print(f"  • Clinical Priority: {deterioration_data['overallClinicalPriority']}")
    print("===========================================================")
    return updated_twin


@app.post("/engines/frailty")
@app.post("/api/engines/frailty")
def run_frailty(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Computes electronic Frailty Index (e-FI) and biological longevity delta."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)

    identity = twin.get("identity") or {}
    age = identity.get("age", 72)

    frailty_data = mapper.map_frailty(frailty_engine, reading, chronological_age=age)
    updated_twin = dict(twin)
    existing_insights = twin.get("healthInsights") or {}
    updated_twin["healthInsights"] = {**existing_insights, "frailty": frailty_data}

    print(f"\n================ [FRAILTY & LONGEVITY] ================")
    print(f"Resident ID: {resident_id}")
    print(f"  • Rockwood e-FI: {frailty_data['frailtyIndex']} ({frailty_data['classification']})")
    print(f"  • Biological Age Delta: {frailty_data['biologicalAgeDelta']:+} years")
    print(f"  • Sarcopenia Risk: {frailty_data['sarcopeniaRisk']}")
    print("=======================================================")
    return updated_twin


@app.post("/engines/sundowning")
@app.post("/api/engines/sundowning")
def run_sundowning(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Computes real-time Sundowning & Agitation Index (0-100) with 30-45 min advance warning."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)

    sundowning_data = mapper.map_sundowning(sundowning_engine, reading)
    updated_twin = dict(twin)
    existing_insights = twin.get("healthInsights") or {}
    updated_twin["healthInsights"] = {**existing_insights, "sundowning": sundowning_data}

    print(f"\n================ [SUNDOWNING & AGITATION] ================")
    print(f"Resident ID: {resident_id}")
    print(f"  • Agitation Index: {sundowning_data['agitationIndex']}/100 ({sundowning_data['status']})")
    print(f"  • Severity: {sundowning_data['severity']}")
    if sundowning_data.get('advanceNoticeMinutes'):
        print(f"  • Advance Warning: {sundowning_data['advanceNoticeMinutes']} minutes ahead")
    print("==========================================================")
    return updated_twin


@app.post("/engines/wandering")
@app.post("/api/engines/wandering")
def run_wandering(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Computes real-time Wandering & Egress Safety analytics with perimeter override."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    location_data = twin.get("location") or twin.get("facilityZone") or {}

    wandering_data = mapper.map_wandering(wandering_engine, reading, location_data=location_data)
    updated_twin = dict(twin)
    existing_insights = twin.get("healthInsights") or {}
    updated_twin["healthInsights"] = {**existing_insights, "wandering": wandering_data}

    print(f"\n================= [WANDERING & SAFETY] =================")
    print(f"Resident ID: {resident_id}")
    print(f"  • Status: {wandering_data['wanderingStatus']} (Risk: {wandering_data['elopementRisk']}, Score: {wandering_data['riskScore']}/100)")
    print(f"  • Location: {wandering_data['currentLocation']} (Safe Zone: {wandering_data['isSafeZone']})")
    if wandering_data.get('actionAlert'):
        print(f"  • Alert: {wandering_data['actionAlert']}")
    print("=========================================================")
    return updated_twin


@app.post("/engines/circadian")
@app.post("/api/engines/circadian")
def run_circadian(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Computes 24-hour Circadian Sleep-Wake rhythm stability and day-night reversal."""
    resident_id = _require_resident_id(twin)
    reading = mapper.build_reading_from_twin(twin)
    sleep_data = twin.get("physiology", {}).get("sleep") or {}

    circadian_data = mapper.map_circadian(circadian_engine, reading, sleep_data=sleep_data)
    updated_twin = dict(twin)
    existing_insights = twin.get("healthInsights") or {}
    updated_twin["healthInsights"] = {**existing_insights, "circadian": circadian_data}

    print(f"\n================ [CIRCADIAN SLEEP RHYTHM] ================")
    print(f"Resident ID: {resident_id}")
    print(f"  • Circadian Score: {circadian_data['circadianScore']}/100 ({circadian_data['status']})")
    print(f"  • Day-Night Ratio: {circadian_data['dayNightRatio']} (Day: {circadian_data['daytimeSleepMinutes']}m, Night: {circadian_data['nighttimeSleepMinutes']}m)")
    if circadian_data.get('actionableAdvice'):
        print(f"  • Advice: {circadian_data['actionableAdvice'][0]}")
    print("==========================================================")
    return updated_twin


@app.post("/engines/ai-summary")
@app.post("/api/engines/ai-summary")
def run_ai_summary(twin: Dict[str, Any]) -> Dict[str, Any]:
    resident_id = _require_resident_id(twin)
    identity = twin.get("identity") or {}
    resident_name = identity.get("firstName")

    result = ai_summary_engine.get_current_summary(resident_id, resident_name, twin=twin)

    updated_twin = dict(twin)
    print(f"\n=================== [AI SUMMARY ENGINE] ===================")
    print(f"Resident ID: {resident_id} ({resident_name or 'Resident'})")
    if result.get("status") == "ready":
        headline = result.get("headline", "")
        summary_text = result.get("summary", "")
        updated_twin["aiSummary"] = f"{headline}\n{summary_text}" if headline else summary_text
        print(f"  • Headline: {headline}")
        print(f"  • Summary:  {summary_text}")
    else:
        print("  • Status: Waiting for baselines or reading context...")
    print("===========================================================\n")
    return updated_twin


@app.post("/engines/pipeline")
@app.post("/api/engines/pipeline")
def run_pipeline(twin: Dict[str, Any]) -> Dict[str, Any]:
    """Runs the dementia pipeline sequentially."""
    twin = run_baseline(twin)
    twin = run_trend(twin)
    twin = run_correlation(twin)
    twin = run_deterioration(twin)
    twin = run_sundowning(twin)
    twin = run_wandering(twin)
    twin = run_circadian(twin)
    twin = run_ai_summary(twin)
    return twin


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
