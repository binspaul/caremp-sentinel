from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PolygenicRiskScore(BaseModel):
    """
    Standard Polygenic Risk Score (PRS) representation.
    """
    condition: str
    percentile: float = Field(..., ge=0.0, le=100.0, description="Risk percentile in reference population (0-100)")
    risk_level: str = Field(..., description="LOW | AVERAGE | ELEVATED | HIGH")
    odds_ratio: float = Field(default=1.0, description="Relative risk / odds ratio compared to median")
    snps_evaluated: int = Field(default=0)
    clinical_implication: str


class PharmacogenomicVariant(BaseModel):
    """
    Specific pharmacogenomic gene, diplotype, and metabolizer phenotype.
    """
    gene: str  # e.g. CYP2C19, SLCO1B1, CYP2D6, CYP2C9, VKORC1
    diplotype: str  # e.g. *1/*2, *1/*1, 521T>C
    phenotype: str  # NORMAL, INTERMEDIATE, POOR, RAPID, ULTRARAPID


class DrugGeneAlert(BaseModel):
    """
    Actionable CPIC/PharmGKB clinical alert when an active medication conflicts with patient genetics.
    """
    medication: str
    gene: str
    severity: str = Field(..., description="ADVISORY | WARNING | HIGH_RISK")
    cpic_level: str = Field(default="A", description="CPIC Evidence Level (A, B)")
    mechanism: str
    clinical_recommendation: str
    alternative_options: List[str] = Field(default_factory=list)


class PhenoGenomicCalibration(BaseModel):
    """
    Calibrated physiological thresholds customized to genetic predispositions.
    """
    condition: str
    adjusted_metrics: Dict[str, Any] = Field(default_factory=dict)
    rationale: str


class GenomicAssessment(BaseModel):
    """
    Aggregated genomic profile and clinical interpretation for digital twin.
    """
    resident_id: int
    prs_scores: List[PolygenicRiskScore] = Field(default_factory=list)
    variants: List[PharmacogenomicVariant] = Field(default_factory=list)
    active_pgx_alerts: List[DrugGeneAlert] = Field(default_factory=list)
    pheno_calibrations: List[PhenoGenomicCalibration] = Field(default_factory=list)
    overall_genetic_risk_tier: str = Field(default="MODERATE")
