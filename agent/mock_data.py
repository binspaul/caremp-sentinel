"""
Realistic Mock Clinical and Digital Twin Datasets for Local Development
Used when USE_MOCK_API=True or as fallback when API backend is pending.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Mock Digital Twin Profiles
MOCK_TWIN_PROFILES: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "userId": "usr_7721",
        "name": "Alex Rivera",
        "age": 36,
        "gender": "Non-binary",
        "primaryGoal": "Optimize metabolic flexibility, stabilize daily glucose, and improve deep sleep latency",
        "baselineVitals": {
            "restingHeartRate": 64,
            "bloodPressure": "118/76 mmHg",
            "fastingGlucose": 88,
            "vo2Max": 46.5,
            "resilienceScore": 88
        },
        "healthRecords": [
            {
                "id": "rec_metabolic_panel_01",
                "type": "Comprehensive Metabolic Panel",
                "date": "2026-02-10",
                "summary": "HbA1c 5.4%, Fasting Glucose 88 mg/dL, Insulin sensitivity optimal"
            },
            {
                "id": "rec_cardio_scan_02",
                "type": "Cardiology & HRV Analysis",
                "date": "2026-02-14",
                "summary": "Resting HR 64 bpm, HRV 72 ms (Good parasympathetic recovery), BP 118/76"
            },
            {
                "id": "rec_sleep_study_03",
                "type": "Sleep Polysomnography",
                "date": "2026-02-18",
                "summary": "Avg Sleep 7.4 hrs, Deep Sleep 22%, REM 23%, Sleep Latency 14 mins"
            }
        ],
        "aiSummary": (
            "Alex displays excellent metabolic and cardiovascular stability. "
            "Recent sleep metrics demonstrate high recovery resilience. "
            "Slight circadian phase delay noted on weekends."
        )
    }
}

# Detailed Clinical Reports (Retrieved lazily via get_health_record)
MOCK_HEALTH_REPORTS: Dict[str, Dict[str, Any]] = {
    "rec_metabolic_panel_01": {
        "id": "rec_metabolic_panel_01",
        "type": "Comprehensive Metabolic Panel",
        "date": "2026-02-10",
        "physician": "Dr. Sarah Jenkins, MD",
        "fullReportText": (
            "Comprehensive Metabolic & Endocrine Evaluation:\n"
            "- HbA1c: 5.4% (Reference: < 5.7% - Optimal glycemic control)\n"
            "- Fasting Plasma Glucose: 88 mg/dL (Reference: 70-99 mg/dL)\n"
            "- Fasting Insulin: 4.8 uIU/mL (Reference: 2.6-24.9 uIU/mL)\n"
            "- HOMA-IR: 1.04 (Optimal insulin sensitivity)\n"
            "- Total Cholesterol: 178 mg/dL (Desirable: < 200 mg/dL)\n"
            "- HDL: 62 mg/dL (Optimal: > 50 mg/dL)\n"
            "- Triglycerides: 86 mg/dL (Normal: < 150 mg/dL)\n"
            "Clinical Assessment: Excellent glycemic regulation. Mitochondrial and metabolic baseline in top tier."
        ),
        "status": "final"
    },
    "rec_cardio_scan_02": {
        "id": "rec_cardio_scan_02",
        "type": "Cardiology & HRV Analysis",
        "date": "2026-02-14",
        "physician": "Dr. Marcus Vance, FACC",
        "fullReportText": (
            "Cardiovascular Rhythm & Autonomic Assessment:\n"
            "- Resting Heart Rate: 64 bpm (Basal nocturnal: 58 bpm)\n"
            "- Blood Pressure: 118/76 mmHg (Normotensive)\n"
            "- HRV (RMSSD): 72 ms (Well-balanced autonomic tone, high vagal activity)\n"
            "- 12-Lead ECG: Normal sinus rhythm with no ST-T abnormalities or ectopic foci.\n"
            "Clinical Assessment: Outstanding cardiovascular resilience. Aerobic fitness supports recovery."
        ),
        "status": "final"
    },
    "rec_sleep_study_03": {
        "id": "rec_sleep_study_03",
        "type": "Sleep Polysomnography",
        "date": "2026-02-18",
        "physician": "Dr. Elena Rostova, MD",
        "fullReportText": (
            "Full Polysomnographic & Sleep Architecture Review:\n"
            "- Total Sleep Duration: 7 hours 24 minutes\n"
            "- REM Sleep: 23% (Target: 20-25%)\n"
            "- Deep Slow-Wave Sleep (N3): 22% (Target: 15-22% - Substantial cellular repair)\n"
            "- Sleep Onset Latency: 14 minutes (Normal: 10-20 minutes)\n"
            "- Respiratory Disturbance Index (RDI): 1.1 events/hr (Normal < 5.0)\n"
            "Clinical Assessment: Restorative sleep architecture. Consistent sleep schedule recommended."
        ),
        "status": "final"
    }
}

# Engines Microservice Mock Analytics
MOCK_ENGINE_ANALYTICS: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "chronologicalAge": 36,
        "biologicalAge": 33.6,
        "biologicalAgeDelta": -2.4,
        "longevityScore": 91,
        "resilienceScore": 88,
        "ewmaBaselines": {
            "heartRate": 64.2,
            "systolicBp": 117.8,
            "diastolicBp": 75.6,
            "sleepHours": 7.4
        },
        "vitalTrends": {
            "heartRate": "Stable / Slightly Decreasing (-0.8 bpm over 30d)",
            "sleepDuration": "Upward trajectory (+24 mins/night)",
            "glucoseVariability": "Low glycemic excursion (CV 12%)"
        },
        "crossCorrelations": [
            "Strong positive correlation (r=0.78) between daily step count (>8,500) and REM sleep duration.",
            "Moderate inverse correlation (r=-0.64) between late evening screen time and deep sleep latency."
        ]
    }
}

# In-memory mock storage for Long-Term and Short-Term Memories
MOCK_LTM_STORE: Dict[int, str] = {
    1: (
        "## LIFESTYLE & EXERCISE\n"
        "- Runs 5k three mornings per week (Tues/Thurs/Sat).\n"
        "- Practicing intermittent fasting (16:8 protocol, eating window 12 PM - 8 PM).\n\n"
        "## DIET & ALLERGIES\n"
        "- Lactose intolerant (uses oat milk).\n"
        "- Mild allergy to shellfish.\n\n"
        "## CHRONIC CONDITIONS\n"
        "- No chronic diseases. Family history of mild hypertension."
    )
}

MOCK_STM_STORE: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "memoryText": "Preparing for a business trip to Tokyo next Tuesday; worried about jet lag affecting sleep.",
        "ttlDays": 7,
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "isExpired": False
    }
}

# careMP Sentinel Mock Genomic Profiles (Biotech & Precision Medicine)
MOCK_GENOMICS_PROFILES: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "overallGeneticRiskTier": "HIGH",
        "prsScores": [
            {
                "condition": "Coronary Artery Disease (CAD)",
                "percentile": 84.0,
                "riskLevel": "HIGH",
                "oddsRatio": 1.85,
                "clinicalImplication": "High genetic vascular resistance burden; requires strict systolic BP auto-regulation (<125 mmHg) and nocturnal dip monitoring."
            },
            {
                "condition": "Type 2 Diabetes (T2D)",
                "percentile": 62.0,
                "riskLevel": "ELEVATED",
                "oddsRatio": 1.24,
                "clinicalImplication": "Metabolic dysregulation susceptibility; higher autonomic HRV sensitivity to glycemic shifts."
            },
            {
                "condition": "Late-Onset Alzheimer's Disease",
                "percentile": 72.0,
                "riskLevel": "ELEVATED",
                "oddsRatio": 1.77,
                "clinicalImplication": "APOE e3/e4 heterozygote; prioritized for circadian rhythm stability and restorative slow-wave deep sleep."
            },
            {
                "condition": "Sarcopenia & Musculoskeletal Frailty",
                "percentile": 58.0,
                "riskLevel": "AVERAGE",
                "oddsRatio": 1.14,
                "clinicalImplication": "Standard age trajectory with moderate musculoskeletal maintenance."
            }
        ],
        "pharmacogenomics": {
            "variants": [
                {"gene": "CYP2C19", "diplotype": "*1/*2", "phenotype": "INTERMEDIATE_METABOLIZER"},
                {"gene": "SLCO1B1", "diplotype": "521T>C", "phenotype": "DECREASED_FUNCTION"},
                {"gene": "CYP2D6", "diplotype": "*1/*1", "phenotype": "NORMAL_METABOLIZER"}
            ],
            "activeAlerts": [
                {
                    "medication": "Clopidogrel",
                    "gene": "CYP2C19",
                    "severity": "HIGH_RISK",
                    "cpicLevel": "A",
                    "mechanism": "CYP2C19 *2 loss-of-function allele limits bioactivation, leading to reduced platelet inhibition and elevated stent thrombosis / ischemic risk.",
                    "clinicalRecommendation": "Discontinue Clopidogrel. Switch to alternative P2Y12 inhibitor: Ticagrelor 90 mg BID or Prasugrel 10 mg QD.",
                    "alternativeOptions": ["Ticagrelor", "Prasugrel"]
                },
                {
                    "medication": "Atorvastatin",
                    "gene": "SLCO1B1",
                    "severity": "HIGH_RISK",
                    "cpicLevel": "A",
                    "mechanism": "SLCO1B1 521T>C variant impairs hepatic uptake transporter, causing elevated systemic statin concentrations and marked myopathy risk.",
                    "clinicalRecommendation": "Consider dose reduction (<=20 mg/day) or transition to Rosuvastatin or Pravastatin which have minimal SLCO1B1 dependency.",
                    "alternativeOptions": ["Rosuvastatin", "Pravastatin"]
                }
            ]
        },
        "phenoGenomicCalibrations": [
            {
                "condition": "Coronary Artery Disease (CAD)",
                "adjustedMetrics": {
                    "systolic_bp_target_max": 125.0,
                    "diastolic_bp_target_max": 80.0,
                    "nocturnal_dip_min_percent": 10.0,
                    "resting_hr_upper_alert": 85.0
                },
                "rationale": "High genetic CAD risk requires tighter hemodynamic tolerance thresholds to prevent end-organ remodeling."
            }
        ]
    }
}

# careMP Sentinel Mock Deterioration & Sepsis Data (AI Diagnostics)
MOCK_DETERIORATION_PROFILES: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "news2": {
            "totalScore": 12,
            "riskLevel": "HIGH",
            "hasExtremeScore": True,
            "actionProtocol": "EMERGENCY: Immediate clinical assessment by emergency medical team required.",
            "subscores": [
                {"parameter": "Heart Rate", "observedValue": 126.0, "points": 2, "clinicalNote": "Moderate Tachycardia (126 bpm)"},
                {"parameter": "Respiration Rate", "observedValue": 24.0, "points": 2, "clinicalNote": "Tachypnea (24 bpm)"},
                {"parameter": "Systolic Blood Pressure", "observedValue": 88.0, "points": 3, "clinicalNote": "Severe Hypotension (88 mmHg)"},
                {"parameter": "SpO2", "observedValue": 89.0, "points": 3, "clinicalNote": "Severe Hypoxemia (89%)"},
                {"parameter": "Body Temperature", "observedValue": 39.3, "points": 2, "clinicalNote": "Severe Pyrexia (39.3°C)"}
            ]
        },
        "sepsis": {
            "isSuspected": True,
            "severity": "HIGH_PRODROME",
            "qsofaScore": 2,
            "sirsCriteriaMet": 3,
            "advanceWarningHours": 8.5,
            "clinicalIndicators": [
                "Tachycardia (126 bpm) reflecting elevated systemic inflammatory load",
                "Tachypnea (24 bpm) indicating respiratory compensation for metabolic acidosis",
                "Hypotension (SBP 88 mmHg) indicates septic vasodilation / shock",
                "Hyperthermia (39.3°C) marking active pyrogenic immune activation"
            ],
            "immediateRecommendation": "CRITICAL SEPSIS ALERT: Initiate Sepsis Six protocol immediately (lactate, blood cultures, IV fluids, IV broad-spectrum antibiotics, oxygen)."
        },
        "frailty": {
            "frailtyIndex": 0.32,
            "classification": "FRAIL",
            "biologicalAgeDelta": 5.8,
            "sarcopeniaRisk": "MODERATE",
            "mobilityCadenceScore": 55.0,
            "autonomicResilience": 61.6
        },
        "overallClinicalPriority": "CRITICAL_EMERGENCY"
    }
}
