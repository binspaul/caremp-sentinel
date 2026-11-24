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
        "name": "Eleanor Vance",
        "alias": "Alex Rivera",
        "age": 78,
        "gender": "Female",
        "diagnosis": "FAST Stage 5 Moderate Alzheimer's Disease",
        "primaryGoal": "Stabilize sundowning agitation, maintain dignity and comfort, prevent wandering elopement, and preserve circadian sleep rhythm",
        "baselineVitals": {
            "restingHeartRate": 74,
            "bloodPressure": "134/82 mmHg",
            "fastingGlucose": 96,
            "respirationRate": 18,
            "spo2": 96,
            "bodyTemperature": 37.1,
            "resilienceScore": 62
        },
        "healthRecords": [
            {
                "id": "rec_metabolic_panel_01",
                "type": "Comprehensive Metabolic Panel & Urinalysis",
                "date": "2026-02-22",
                "summary": "Urinalysis leukocyte esterase trace-positive, mild pyuria; NEWS2 score 5 indicates potential early occult UTI."
            },
            {
                "id": "rec_cardio_scan_02",
                "type": "Cardiology & Autonomic Assessment",
                "date": "2026-02-20",
                "summary": "Resting HR 74 bpm, BP 134/82 mmHg, HRV 38 ms, circadian BP dipping blunted."
            },
            {
                "id": "rec_sleep_study_03",
                "type": "Circadian Actigraphy & Sleep Study",
                "date": "2026-02-18",
                "summary": "Night sleep 290 mins, daytime naps 110 mins, 5 nocturnal awakenings, circadian score 48/100."
            }
        ],
        "aiSummary": (
            "Eleanor Vance (78yo F) is living with FAST Stage 5 Alzheimer's Disease. "
            "Currently experiencing late-afternoon sundowning restlessness (Agitation Index: 76) and corridor pacing. "
            "Elevated NEWS2 score of 5 warrants clinical screening for occult urinary tract infection. "
            "Non-pharmacological validation therapy and Glen Miller big-band music successfully de-escalate agitation."
        )
    }
}

# Detailed Clinical Reports (Retrieved lazily via get_health_record)
MOCK_HEALTH_REPORTS: Dict[str, Dict[str, Any]] = {
    "rec_metabolic_panel_01": {
        "id": "rec_metabolic_panel_01",
        "type": "Comprehensive Metabolic Panel & Urinalysis",
        "date": "2026-02-22",
        "physician": "Dr. Sarah Jenkins, MD",
        "fullReportText": (
            "Comprehensive Metabolic, Renal & Urinalysis Evaluation:\n"
            "- Fasting Plasma Glucose: 96 mg/dL (Reference: 70-99 mg/dL)\n"
            "- BUN / Creatinine: 18 / 0.9 mg/dL (eGFR 72 mL/min/1.73m² - Age appropriate)\n"
            "- Serum Electrolytes: Na 139 mEq/L, K 4.1 mEq/L, Cl 102 mEq/L\n"
            "- Urinalysis Dipstick: Leukocyte esterase trace positive (+1), Nitrite negative, WBC 6-10/hpf\n"
            "- Clinical Note: Mild pyuria and low-grade temperature (37.4°C) with NEWS2 score 5.\n"
            "Clinical Assessment: Potential occult lower urinary tract infection (UTI) causing acute behavioral change. Clean-catch culture ordered."
        ),
        "status": "final"
    },
    "rec_cardio_scan_02": {
        "id": "rec_cardio_scan_02",
        "type": "Cardiology & Autonomic Assessment",
        "date": "2026-02-20",
        "physician": "Dr. Marcus Vance, FACC",
        "fullReportText": (
            "Cardiovascular Rhythm & Autonomic Assessment:\n"
            "- Resting Heart Rate: 74 bpm (Late afternoon sundowning surge: 88 bpm)\n"
            "- Blood Pressure: 134/82 mmHg (Mild stage 1 hypertension)\n"
            "- HRV (RMSSD): 38 ms (Blunted autonomic parasympathetic buffer)\n"
            "- 12-Lead ECG: Normal sinus rhythm with mild non-specific ST-T wave variations.\n"
            "Clinical Assessment: Hemodynamic parameters stable with mild late-afternoon sympathetic escalation during sundowning periods."
        ),
        "status": "final"
    },
    "rec_sleep_study_03": {
        "id": "rec_sleep_study_03",
        "type": "Circadian Actigraphy & Sleep Study",
        "date": "2026-02-18",
        "physician": "Dr. Elena Rostova, MD",
        "fullReportText": (
            "24-Hour Continuous Actigraphy & Circadian Sleep Architecture:\n"
            "- Total Nighttime Sleep: 4 hours 50 minutes (290 minutes)\n"
            "- Daytime Nap Duration: 110 minutes (fragmented across 2 naps)\n"
            "- Sleep Fragmentation Index: 5 nocturnal bed-exit / wake episodes\n"
            "- Circadian Regularity Score: 48/100 (Mild circadian phase delay and fragmentation)\n"
            "- Day/Night Sleep Ratio: 0.38 (Elevated; indicates encroaching day-night reversal)\n"
            "Clinical Assessment: Mild circadian disruption secondary to FAST Stage 5 Alzheimer's. Daytime sensory engagement and morning bright light therapy recommended."
        ),
        "status": "final"
    }
}

# Engines Microservice Mock Analytics
MOCK_ENGINE_ANALYTICS: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "chronologicalAge": 78,
        "biologicalAge": 81.2,
        "biologicalAgeDelta": 3.2,
        "longevityScore": 68,
        "resilienceScore": 62,
        "ewmaBaselines": {
            "heartRate": 74.5,
            "systolicBp": 133.8,
            "diastolicBp": 81.6,
            "sleepHours": 5.8
        },
        "vitalTrends": {
            "heartRate": "Elevated during late-afternoon sundowning window (+14 bpm at 16:00-18:30)",
            "sleepDuration": "Fragmented night sleep with compensatory afternoon napping",
            "glucoseVariability": "Normoglycemic baseline (CV 14%)"
        },
        "crossCorrelations": [
            "Strong positive correlation (r=0.82) between late-afternoon ambient shadow levels and wandering pacing frequency.",
            "Strong positive correlation (r=0.76) between Glen Miller jazz listening sessions and agitation reduction."
        ]
    }
}

# In-memory mock storage for Long-Term and Short-Term Memories
MOCK_LTM_STORE: Dict[int, str] = {
    1: (
        "## LIFE STORY & IDENTITY ANCHORS\n"
        "- Former elementary school librarian for 32 years; deeply fulfilled by children's literature, cataloging, and reading.\n"
        "- Music preference: Deep love for Glen Miller big-band jazz; provides instant calming and emotional grounding.\n"
        "- Cherished tactile anchor: Familiar lavender knit blanket kept in Room 204.\n"
        "- Family: Beloved daughter Sarah visits every Sunday afternoon without fail.\n"
        "- Meaningful therapeutic activities: Enjoys sorting, cataloging, and organizing books and illustrated magazines.\n\n"
        "## KNOWN TRIGGERS & SUNDOWNING\n"
        "- Harsh evening shadows during the sundowning window (4:00 PM - 6:30 PM).\n"
        "- Loud televisions, jarring public address intercoms, and chaotic background noise.\n"
        "- Being rushed, corrected, or confronted with reality checks.\n\n"
        "## DEMENTIA CARE & VALIDATION THERAPY PRINCIPLES\n"
        "- Never contradict, argue, or say 'as I told you earlier'. Enter Eleanor's reality with warmth and empathy.\n"
        "- When sundowning / restlessness is detected, recommend non-pharmacological redirection using LTM life anchors.\n"
        "- When sudden combativeness is noted, check NEWS2 / vitals to rule out acute UTI / occult infection."
    )
}

MOCK_STM_STORE: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "memoryText": (
            "Refused breakfast oral pills at 8:15 AM due to minor gum sensitivity; ate pureed oatmeal. "
            "Participated in 15-min garden walk with PT at 10:30 AM. "
            "Currently pacing North Memory Corridor Gallery looking for elementary school library keys; "
            "sundowning restlessness surge observed at 16:15."
        ),
        "ttlDays": 3,
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
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
                "condition": "Late-Onset Alzheimer's Disease",
                "percentile": 88.0,
                "riskLevel": "HIGH",
                "oddsRatio": 2.45,
                "clinicalImplication": "APOE e4/e4 homozygote; high neurodegenerative susceptibility requiring circadian stabilization and tailored validation therapy."
            },
            {
                "condition": "Coronary Artery Disease (CAD)",
                "percentile": 74.0,
                "riskLevel": "ELEVATED",
                "oddsRatio": 1.62,
                "clinicalImplication": "Elevated vascular burden; requires blood pressure stability and avoidance of adrenergic overstimulation."
            },
            {
                "condition": "Type 2 Diabetes (T2D)",
                "percentile": 58.0,
                "riskLevel": "AVERAGE",
                "oddsRatio": 1.15,
                "clinicalImplication": "Normoglycemic baseline with moderate metabolic resilience."
            },
            {
                "condition": "Sarcopenia & Musculoskeletal Frailty",
                "percentile": 78.0,
                "riskLevel": "HIGH",
                "oddsRatio": 1.82,
                "clinicalImplication": "High fall risk; requires daily gait support, fall detection beacons, and supervised garden walks."
            }
        ],
        "pharmacogenomics": {
            "variants": [
                {"gene": "CYP2D6", "diplotype": "*4/*4", "phenotype": "POOR_METABOLIZER"},
                {"gene": "CYP2C19", "diplotype": "*1/*2", "phenotype": "INTERMEDIATE_METABOLIZER"},
                {"gene": "SLCO1B1", "diplotype": "521T>C", "phenotype": "DECREASED_FUNCTION"}
            ],
            "activeAlerts": [
                {
                    "medication": "Donepezil",
                    "gene": "CYP2D6",
                    "severity": "MODERATE_RISK",
                    "cpicLevel": "B",
                    "mechanism": "CYP2D6 Poor Metabolizer phenotype leads to elevated steady-state donepezil levels, increasing risk of bradycardia and GI distress.",
                    "clinicalRecommendation": "Maintain conservative dosing (5 mg/day) or consider Galantamine / Memantine with ECG heart rate monitoring.",
                    "alternativeOptions": ["Memantine", "Rivastigmine patch"]
                },
                {
                    "medication": "Clopidogrel",
                    "gene": "CYP2C19",
                    "severity": "HIGH_RISK",
                    "cpicLevel": "A",
                    "mechanism": "CYP2C19 *2 loss-of-function allele limits bioactivation, leading to reduced platelet inhibition.",
                    "clinicalRecommendation": "Discontinue Clopidogrel. Switch to alternative P2Y12 inhibitor: Ticagrelor 90 mg BID or Prasugrel 10 mg QD.",
                    "alternativeOptions": ["Ticagrelor", "Prasugrel"]
                }
            ]
        },
        "phenoGenomicCalibrations": [
            {
                "condition": "Late-Onset Alzheimer's Disease",
                "adjustedMetrics": {
                    "circadian_regularity_min_target": 65.0,
                    "agitation_alert_threshold": 65.0,
                    "resting_hr_upper_alert": 90.0
                },
                "rationale": "High genetic AD risk requires strict circadian entrainment and proactive sundowning de-escalation."
            }
        ]
    }
}

# careMP Sentinel Mock Deterioration & Sepsis Data (AI Diagnostics)
MOCK_DETERIORATION_PROFILES: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "news2": {
            "totalScore": 5,
            "riskLevel": "MEDIUM",
            "hasExtremeScore": False,
            "actionProtocol": "URGENT CLINICAL REVIEW: NEWS2 score of 5 warrants clinical review to rule out acute occult UTI or infection.",
            "subscores": [
                {"parameter": "Heart Rate", "observedValue": 88.0, "points": 1, "clinicalNote": "Mild Tachycardia (88 bpm)"},
                {"parameter": "Respiration Rate", "observedValue": 21.0, "points": 2, "clinicalNote": "Mild Tachypnea (21 bpm)"},
                {"parameter": "Systolic Blood Pressure", "observedValue": 136.0, "points": 0, "clinicalNote": "Normal SBP (136 mmHg)"},
                {"parameter": "SpO2", "observedValue": 95.0, "points": 1, "clinicalNote": "Mild Desaturation (95%)"},
                {"parameter": "Body Temperature", "observedValue": 37.4, "points": 1, "clinicalNote": "Low-grade pyrexia (37.4°C)"}
            ]
        },
        "sepsis": {
            "isSuspected": False,
            "severity": "LOW_PRODROME",
            "qsofaScore": 1,
            "sirsCriteriaMet": 2,
            "advanceWarningHours": 12.0,
            "clinicalIndicators": [
                "Low-grade temperature elevation (37.4°C) with respiratory rate 21 bpm",
                "Urinalysis trace-positive leukocyte esterase suggests early occult UTI",
                "Sudden behavioral restlessness may be secondary to occult infection"
            ],
            "immediateRecommendation": "Obtain clean-catch urine specimen for urinalysis/culture; rule out occult UTI before adjusting psychotropic regimen."
        },
        "frailty": {
            "frailtyIndex": 0.44,
            "classification": "MODERATELY_FRAIL",
            "biologicalAgeDelta": 3.2,
            "sarcopeniaRisk": "HIGH",
            "mobilityCadenceScore": 46.0,
            "autonomicResilience": 48.0
        },
        "overallClinicalPriority": "MEDIUM_URGENT_REVIEW"
    }
}

# careMP Sentinel Mock Dementia & Memory Care Telemetry Profiles
MOCK_DEMENTIA_PROFILES: Dict[int, Dict[str, Any]] = {
    1: {
        "residentId": 1,
        "residentName": "Eleanor Vance",
        "diagnosis": "FAST Stage 5 Moderate Alzheimer's Disease",
        "sundowning": {
            "agitationIndex": 76,
            "alertLevel": "SUNDOWNING_SURGE",
            "wanderingStatus": "HALLWAY_PACING",
            "locationZone": "North Memory Corridor Gallery",
            "isSundowningWindow": True,
            "advanceNoticeMinutes": 35,
            "calmingSuggestions": [
                "Play Glen Miller big-band jazz softly in background",
                "Provide her familiar lavender knit blanket for tactile comfort",
                "Invite Eleanor to sort and organize illustrated library books (former librarian)",
                "Close window blinds to eliminate harsh evening shadow glare (4:00-6:30 PM window)",
                "Serve warm decaffeinated chamomile tea or warm milk",
                "Avoid rushing or contradicting; use validation therapy techniques"
            ]
        },
        "circadian": {
            "dayNapMinutes": 110,
            "nightSleepMinutes": 290,
            "sleepFragmentationEvents": 5,
            "circadianRegularityScore": 48,
            "dayNightStatus": "MILD",
            "deepSleepMinutes": 42,
            "dayNightRatio": 0.38,
            "actionableAdvice": [
                "Provide morning natural daylight / 10,000-lux light exposure at 08:30 AM",
                "Cap afternoon nap to maximum 30-45 minutes before 2:00 PM",
                "Encourage daily 15-min sensory garden walk with physical therapist",
                "Use amber/warm dim lighting in Suite 204 after 19:00"
            ]
        },
        "shiftHandoff": {
            "vitalsSummary": {
                "heartRate": 88,
                "bloodPressure": "136/84 mmHg",
                "respirationRate": 21,
                "spo2": 95,
                "bodyTemperature": 37.4,
                "news2Score": 5,
                "clinicalAlert": "MODERATE_ACUITY (NEWS2 = 5) - Monitor for occult infection / UTI"
            },
            "behavioralObservations": {
                "agitationIndex": 76,
                "alertLevel": "SUNDOWNING_SURGE",
                "wanderingStatus": "HALLWAY_PACING",
                "location": "North Memory Corridor Gallery",
                "mood": "Restless, looking for elementary school library keys, pacing hallway",
                "validationTherapyResponse": "Responded positively to book sorting invitation and tactile blanket"
            },
            "mealsHydration": {
                "breakfast": "Ate pureed oatmeal (85% consumed)",
                "lunch": "Ate 70% of pureed chicken and vegetable soup; 400 mL fluids consumed",
                "medicationAdherence": "Refused breakfast oral pills at 8:15 AM due to minor gum sensitivity; ate pureed oatmeal. Re-offered with soft applesauce."
            },
            "eveningWatchOuts": [
                "Sundowning surge window active (4:00-6:30 PM); close blinds against harsh shadow patterns",
                "Hallway corridor pacing active; monitor egress beacons and fire exit doors",
                "NEWS2 score of 5: rule out acute occult UTI or silent infection before attributing combativeness solely to dementia",
                "Validate concerns gently—never argue, contradict, or say 'as I told you earlier'"
            ]
        }
    }
}
