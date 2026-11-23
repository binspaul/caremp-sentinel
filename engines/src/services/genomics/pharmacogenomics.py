"""
Pharmacogenomics (PGx) Safety Engine
Implements CPIC / PharmGKB Level A & B clinical guidelines to prevent Adverse Drug Events (ADEs).
"""
from typing import List, Dict, Any, Optional
from .models import PharmacogenomicVariant, DrugGeneAlert


# CPIC Evidence-based Rule Catalog
CPIC_RULES = [
    # 1. CYP2C19 & Clopidogrel (Plavix)
    {
        "gene": "CYP2C19",
        "affected_phenotypes": ["INTERMEDIATE", "POOR"],
        "medications": ["clopidogrel", "plavix"],
        "severity": "HIGH_RISK",
        "cpic_level": "A",
        "mechanism": "CYP2C19 loss-of-function alleles (*2, *3) significantly diminish active thiol metabolite formation, leading to impaired platelet inhibition and heightened risk of major adverse cardiovascular events (MACE) and stent thrombosis.",
        "recommendation": "Avoid clopidogrel. Prescribe alternative antiplatelet agent with non-CYP2C19 bioactivation: Ticagrelor (90 mg BID) or Prasugrel (10 mg QD), unless contraindicated.",
        "alternatives": ["Ticagrelor", "Prasugrel"]
    },
    # 2. SLCO1B1 & Simvastatin / Atorvastatin
    {
        "gene": "SLCO1B1",
        "affected_phenotypes": ["DECREASED", "POOR", "INTERMEDIATE", "521T>C"],
        "medications": ["simvastatin", "zocor", "atorvastatin", "lipitor"],
        "severity": "HIGH_RISK",
        "cpic_level": "A",
        "mechanism": "SLCO1B1 c.521T>C (rs4149056) reduces hepatic uptake of statins via OATP1B1, leading to marked elevation in systemic drug exposure and up to 17-fold increased risk of statin-induced myopathy and rhabdomyolysis.",
        "recommendation": "For Simvastatin: Dose reduction <=20 mg/day or switch. For Atorvastatin: Start with lower dose (<=20 mg) or switch to Rosuvastatin or Pravastatin which have minimal OATP1B1 dependency. Monitor serum creatine kinase (CK).",
        "alternatives": ["Rosuvastatin", "Pravastatin"]
    },
    # 3. CYP2D6 & Codeine / Tramadol
    {
        "gene": "CYP2D6",
        "affected_phenotypes": ["POOR"],
        "medications": ["codeine", "tramadol", "ultram", "tylenol with codeine"],
        "severity": "WARNING",
        "cpic_level": "A",
        "mechanism": "CYP2D6 poor metabolizers lack the enzymatic conversion of codeine to its active analgesic metabolite morphine, resulting in inadequate pain relief.",
        "recommendation": "Avoid codeine and tramadol due to therapeutic failure. Choose alternative analgesic not reliant on CYP2D6 (e.g. acetaminophen, NSAIDs, or morphine/hydromorphone if opioid required).",
        "alternatives": ["Acetaminophen", "Hydromorphone", "Ibuprofen"]
    },
    # 4. CYP2D6 & Metoprolol
    {
        "gene": "CYP2D6",
        "affected_phenotypes": ["POOR"],
        "medications": ["metoprolol", "lopressor", "toprol"],
        "severity": "WARNING",
        "cpic_level": "B",
        "mechanism": "Impaired CYP2D6 metabolism produces 3- to 5-fold higher metoprolol systemic exposure, markedly elevating the risk of severe bradycardia, fatigue, and heart block.",
        "recommendation": "Consider 50% dose reduction of metoprolol with tight resting HR telemetry monitoring, or switch to alternative beta-blockers not heavily metabolized by CYP2D6 (e.g. Bisoprolol, Atenolol, or Carvedilol).",
        "alternatives": ["Bisoprolol", "Atenolol", "Carvedilol"]
    },
    # 5. CYP2C9 / VKORC1 & Warfarin
    {
        "gene": "CYP2C9",
        "affected_phenotypes": ["INTERMEDIATE", "POOR", "*2/*2", "*2/*3", "*3/*3"],
        "medications": ["warfarin", "coumadin"],
        "severity": "HIGH_RISK",
        "cpic_level": "A",
        "mechanism": "Reduced S-warfarin clearance and/or heightened vitamin K epoxide reductase sensitivity significantly increases bleeding risk and time to stable INR.",
        "recommendation": "Utilize CPIC pharmacogenetic dosing algorithm to calculate reduced initial dose (typically 20-40% lower), or consider direct oral anticoagulants (DOACs like Apixaban or Rivaroxaban) if clinically appropriate.",
        "alternatives": ["Apixaban", "Rivaroxaban"]
    }
]


def evaluate_prescriptions(
    variants: List[PharmacogenomicVariant],
    active_medications: List[str]
) -> List[DrugGeneAlert]:
    """
    Evaluates active medications against patient genetic variants.
    """
    alerts: List[DrugGeneAlert] = []
    normalized_meds = [m.lower().strip() for m in active_medications if m]

    # Map resident variants by gene
    variant_map: Dict[str, PharmacogenomicVariant] = {
        v.gene.upper().strip(): v for v in variants
    }

    for rule in CPIC_RULES:
        rule_gene = rule["gene"].upper()
        if rule_gene not in variant_map:
            continue

        resident_variant = variant_map[rule_gene]
        res_pheno = resident_variant.phenotype.upper()
        res_diplo = resident_variant.diplotype.upper()

        # Check if phenotype or diplotype triggers rule
        pheno_match = any(
            p in res_pheno or p in res_diplo
            for p in rule["affected_phenotypes"]
        )

        if not pheno_match:
            continue

        # Check if any active medication matches rule
        matched_med = None
        for med in rule["medications"]:
            if any(med in active_med for active_med in normalized_meds):
                matched_med = med.capitalize()
                break

        if matched_med:
            alerts.append(DrugGeneAlert(
                medication=matched_med,
                gene=resident_variant.gene,
                severity=rule["severity"],
                cpic_level=rule["cpic_level"],
                mechanism=rule["mechanism"],
                clinical_recommendation=rule["recommendation"],
                alternative_options=rule["alternatives"]
            ))

    return alerts
