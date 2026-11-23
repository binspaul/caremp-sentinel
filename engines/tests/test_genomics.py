from src.services.genomics.engine import GenomicsEngine
from src.services.genomics.prs import evaluate_polygenic_profile, calibrate_vital_thresholds
from src.services.genomics.pharmacogenomics import evaluate_prescriptions, PharmacogenomicVariant


def test_prs_calculation():
    scores = evaluate_polygenic_profile({
        "cad": 85.0,
        "t2d": 65.0,
        "alzheimers": 78.0
    })
    assert len(scores) == 3
    cad = next(s for s in scores if "CAD" in s.condition)
    assert cad.risk_level == "HIGH"
    assert cad.odds_ratio > 1.0


def test_pheno_genomic_calibrations():
    scores = evaluate_polygenic_profile({"cad": 85.0})
    calibrations = calibrate_vital_thresholds(scores)
    assert len(calibrations) >= 1
    cad_cal = calibrations[0]
    assert cad_cal.adjusted_metrics["systolic_bp_target_max"] == 125.0


def test_pharmacogenomics_cpic_alerts():
    variants = [
        PharmacogenomicVariant(gene="CYP2C19", diplotype="*1/*2", phenotype="INTERMEDIATE"),
        PharmacogenomicVariant(gene="SLCO1B1", diplotype="521T>C", phenotype="DECREASED"),
        PharmacogenomicVariant(gene="CYP2D6", diplotype="*4/*4", phenotype="POOR")
    ]
    meds = ["Atorvastatin", "Clopidogrel", "Codeine"]
    alerts = evaluate_prescriptions(variants, meds)

    assert len(alerts) == 3
    clopidogrel_alert = next(a for a in alerts if a.medication.lower() == "clopidogrel")
    assert clopidogrel_alert.severity == "HIGH_RISK"
    assert "Ticagrelor" in clopidogrel_alert.alternative_options

    statin_alert = next(a for a in alerts if a.medication.lower() == "atorvastatin")
    assert statin_alert.severity == "HIGH_RISK"
    assert "Rosuvastatin" in statin_alert.alternative_options


def test_genomics_engine_workflow():
    engine = GenomicsEngine()
    assessment = engine.register_profile(
        resident_id=1,
        prs_inputs={"cad": 82.0, "alzheimers": 75.0},
        variants=[{"gene": "CYP2C19", "diplotype": "*1/*2", "phenotype": "INTERMEDIATE"}],
        medications=["Clopidogrel"]
    )
    assert assessment.overall_genetic_risk_tier == "HIGH"
    assert len(assessment.active_pgx_alerts) == 1
