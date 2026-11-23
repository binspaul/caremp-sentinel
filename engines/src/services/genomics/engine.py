"""
Genomics & Precision Biotechnology Engine
Coordinates Polygenic Risk Scoring, CPIC Pharmacogenomic Safety, and Pheno-Genomic Calibration.
"""
from typing import Dict, Any, List, Optional
from ...core.base import BaseEngine
from ...core.models import VitalReading
from .models import (
    GenomicAssessment,
    PolygenicRiskScore,
    PharmacogenomicVariant,
    DrugGeneAlert,
    PhenoGenomicCalibration
)
from .prs import evaluate_polygenic_profile, calibrate_vital_thresholds
from .pharmacogenomics import evaluate_prescriptions


class GenomicsEngine(BaseEngine):
    """
    Evaluates patient genetic predisposition and pharmacogenomics against active vitals and prescriptions.
    """

    def __init__(self):
        # In-memory store of resident genomic profiles: resident_id -> GenomicAssessment
        self._profiles: Dict[int, GenomicAssessment] = {}

    @property
    def name(self) -> str:
        return "genomics"

    def register_profile(
        self,
        resident_id: int,
        prs_inputs: Dict[str, float],
        variants: List[Dict[str, str]],
        medications: List[str]
    ) -> GenomicAssessment:
        """
        Registers or updates a resident's genomic and medication profile.
        """
        prs_scores = evaluate_polygenic_profile(prs_inputs)
        parsed_variants = [
            PharmacogenomicVariant(
                gene=v.get("gene", ""),
                diplotype=v.get("diplotype", ""),
                phenotype=v.get("phenotype", "NORMAL")
            )
            for v in variants
        ]
        active_alerts = evaluate_prescriptions(parsed_variants, medications)
        calibrations = calibrate_vital_thresholds(prs_scores)

        # Determine overall genetic risk tier
        high_prs_count = sum(1 for s in prs_scores if s.risk_level in ("HIGH", "ELEVATED"))
        high_pgx_count = sum(1 for a in active_alerts if a.severity == "HIGH_RISK")

        if high_pgx_count > 0 or high_prs_count >= 2:
            tier = "HIGH"
        elif high_prs_count == 1:
            tier = "ELEVATED"
        else:
            tier = "STANDARD"

        assessment = GenomicAssessment(
            resident_id=resident_id,
            prs_scores=prs_scores,
            variants=parsed_variants,
            active_pgx_alerts=active_alerts,
            pheno_calibrations=calibrations,
            overall_genetic_risk_tier=tier
        )

        self._profiles[resident_id] = assessment
        return assessment

    def get_assessment(self, resident_id: int) -> Optional[GenomicAssessment]:
        return self._profiles.get(resident_id)

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Checks current vital reading against pheno-genomic calibrations if available.
        """
        assessment = self._profiles.get(reading.resident_id)
        if not assessment:
            return {"status": "no_genomic_profile", "alerts": []}

        triggered_flags: List[str] = []
        for cal in assessment.pheno_calibrations:
            metrics = cal.adjusted_metrics
            if "systolic_bp_target_max" in metrics and reading.systolic_bp:
                if reading.systolic_bp > metrics["systolic_bp_target_max"]:
                    triggered_flags.append(
                        f"Pheno-Genomic Systolic BP Alert: {reading.systolic_bp} mmHg exceeds genetic CAD target ({metrics['systolic_bp_target_max']} mmHg)"
                    )
            if "resting_hr_upper_alert" in metrics and reading.heart_rate:
                if reading.heart_rate > metrics["resting_hr_upper_alert"]:
                    triggered_flags.append(
                        f"Pheno-Genomic Resting HR Alert: {reading.heart_rate} bpm exceeds genetic target ({metrics['resting_hr_upper_alert']} bpm)"
                    )

        return {
            "resident_id": reading.resident_id,
            "status": "evaluated",
            "tier": assessment.overall_genetic_risk_tier,
            "active_pgx_alerts_count": len(assessment.active_pgx_alerts),
            "triggered_flags": triggered_flags
        }
