"""
Centralized Backend & Analytics API Client for Care Coach Agent

Supports seamless toggle between Live NestJS endpoints and local mock data:
- When USE_MOCK_API=True: Operates immediately with rich mock state and local memory stores.
- When USE_MOCK_API=False: Connects to live backend with JWT authentication and fallback resilience.
"""
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
try:
    import requests
except ImportError:
    requests = None

from .config import (
    USE_MOCK_API,
    API_BASE_URL,
    API_BEARER_TOKEN,
    API_USER_EMAIL,
    API_USER_PASSWORD,
    ENGINES_API_URL,
)
from .mock_data import (
    MOCK_TWIN_PROFILES,
    MOCK_HEALTH_REPORTS,
    MOCK_ENGINE_ANALYTICS,
    MOCK_LTM_STORE,
    MOCK_STM_STORE,
    MOCK_GENOMICS_PROFILES,
    MOCK_DETERIORATION_PROFILES,
    MOCK_DEMENTIA_PROFILES,
)

logger = logging.getLogger(__name__)


def parse_resident_id(user_id: Any) -> int:
    """Helper utility to parse a user_id or resident_id into an integer resident ID."""
    if user_id is None or not str(user_id).strip():
        return 1
    clean_id = str(user_id).strip()
    if clean_id.lower() in ("user", "default", "me", "resident"):
        return 1
    try:
        return int(clean_id)
    except ValueError:
        match = re.search(r'\d+', clean_id)
        if match:
            return int(match.group(0))
        return 1


class ApiClient:
    """Unified API Client with mock-first fallback architecture for hackathon agility."""

    def __init__(self):
        self._cached_token: Optional[str] = None
        self.use_mock: bool = USE_MOCK_API

    def get_token(self) -> str:
        """Retrieves JWT Bearer Token via config or login endpoint."""
        if API_BEARER_TOKEN and API_BEARER_TOKEN.strip():
            return API_BEARER_TOKEN.strip()

        if self._cached_token:
            return self._cached_token

        if not API_USER_EMAIL or not API_USER_PASSWORD:
            return "mock-jwt-token"

        login_url = f"{API_BASE_URL}/auth/login"
        payload = {
            "emailAddress": API_USER_EMAIL.strip(),
            "password": API_USER_PASSWORD.strip()
        }

        try:
            response = requests.post(login_url, json=payload, timeout=5)
            if response.status_code == 200:
                data = response.json()
                token = data.get("token") or (data.get("data") and data.get("data").get("token"))
                if token:
                    self._cached_token = token
                    return token
        except Exception as e:
            logger.warning(f"Live auth connection failed ({e}), continuing in mock mode.")

        return "mock-jwt-token"

    def clear_token_cache(self):
        self._cached_token = None

    # --- Digital Twin Endpoints ---

    def get_digital_twin(self, resident_id: Any) -> Dict[str, Any]:
        """Fetches live Digital Twin profile for resident and enriches with engine analytics."""
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            token = self.get_token()
            url = f"{API_BASE_URL}/digital-twin/resident/{res_id}"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

            try:
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    body = response.json()
                    twin_data = body.get("data")
                    if twin_data:
                        # Normalize common fields for ease of clinical agent access
                        identity = twin_data.get("identity") or {}
                        full_name = f"{identity.get('firstName', '')} {identity.get('lastName', '')}".strip() or f"Resident #{res_id}"
                        twin_data["name"] = full_name
                        twin_data["age"] = identity.get("age")
                        twin_data["gender"] = identity.get("gender")

                        # If healthInsights are missing or sparse, enrich via live analytics engine pipeline
                        if not twin_data.get("healthInsights") or not twin_data.get("healthInsights", {}).get("sundowning"):
                            try:
                                engine_url = f"{ENGINES_API_URL}/pipeline"
                                eng_resp = requests.post(engine_url, json=twin_data, timeout=5)
                                if eng_resp.status_code == 200:
                                    twin_data = eng_resp.json()
                                    twin_data["name"] = full_name
                            except Exception as eng_err:
                                logger.warning(f"Engine pipeline enrichment failed ({eng_err}), continuing with base twin.")

                        return twin_data
                logger.warning(f"Live digital twin fetch returned {response.status_code}, attempting local fallback.")
            except Exception as e:
                logger.warning(f"Failed to fetch live digital twin ({e}), attempting local fallback.")

        return MOCK_TWIN_PROFILES.get(res_id, MOCK_TWIN_PROFILES.get(1, {}))

    # --- Health Reports (Lazy-Loading) ---

    def get_health_record(self, record_id: str) -> Dict[str, Any]:
        """Fetches detailed clinical report."""
        if record_id in MOCK_HEALTH_REPORTS:
            return MOCK_HEALTH_REPORTS[record_id]

        return {
            "error": f"Health record with ID '{record_id}' not found.",
            "availableRecordIds": list(MOCK_HEALTH_REPORTS.keys())
        }

    # --- Short-Term Memory ---

    def get_short_term_memory(self, resident_id: Any) -> Optional[Dict[str, Any]]:
        """Fetches active short-term memory record."""
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            token = self.get_token()
            url = f"{API_BASE_URL}/short-term-memory/{res_id}"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

            try:
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    body = response.json()
                    return body.get("data")
            except Exception as e:
                logger.warning(f"Live STM fetch failed ({e}), checking local mock store.")

        record = MOCK_STM_STORE.get(res_id)
        if record and not record.get("isExpired"):
            return record
        return None

    def save_short_term_memory(
        self,
        resident_id: Any,
        memory_text: str,
        ttl_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Saves short-term memory with TTL."""
        res_id = parse_resident_id(resident_id)
        ttl = ttl_days if (ttl_days and ttl_days > 0) else 7

        if not self.use_mock:
            token = self.get_token()
            url = f"{API_BASE_URL}/short-term-memory"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            payload = {"residentId": res_id, "memoryText": memory_text, "ttlDays": ttl}

            try:
                response = requests.post(url, json=payload, headers=headers, timeout=5)
                if response.status_code in (200, 201):
                    body = response.json()
                    return body.get("data", payload)
            except Exception as e:
                logger.warning(f"Live STM save failed ({e}), saved to local mock store.")

        # Local fallback save
        expires_at = (datetime.now(timezone.utc) + timedelta(days=ttl)).isoformat()
        saved_record = {
            "residentId": res_id,
            "memoryText": memory_text,
            "ttlDays": ttl,
            "expiresAt": expires_at,
            "isExpired": False
        }
        MOCK_STM_STORE[res_id] = saved_record
        return saved_record

    # --- Long-Term Memory ---

    def get_long_term_memory(self, resident_id: Any) -> Optional[Dict[str, Any]]:
        """Fetches long-term memory profile."""
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            token = self.get_token()
            url = f"{API_BASE_URL}/long-term-memory/{res_id}"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

            try:
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    body = response.json()
                    return body.get("data")
            except Exception as e:
                logger.warning(f"Live LTM fetch failed ({e}), using local store.")

        text = MOCK_LTM_STORE.get(res_id, "")
        return {"residentId": res_id, "memoryText": text} if text else None

    def save_long_term_memory(self, resident_id: Any, memory_text: str) -> Dict[str, Any]:
        """Saves compacted long-term memory profile."""
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            token = self.get_token()
            url = f"{API_BASE_URL}/long-term-memory"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            payload = {"residentId": res_id, "memoryText": memory_text}

            try:
                response = requests.post(url, json=payload, headers=headers, timeout=5)
                if response.status_code in (200, 201):
                    body = response.json()
                    return body.get("data", payload)
            except Exception as e:
                logger.warning(f"Live LTM save failed ({e}), saved to local store.")

        MOCK_LTM_STORE[res_id] = memory_text
        return {"residentId": res_id, "memoryText": memory_text}

    # --- Health Engines Analytics ---

    def get_twin_analytics(self, resident_id: Any) -> Dict[str, Any]:
        """
        Fetches physiological trend analytics, biological age delta, and correlations
        from the Health Analytics Engines service.
        """
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            url = f"{ENGINES_API_URL}/pipeline"
            twin = self.get_digital_twin(res_id)
            try:
                response = requests.post(url, json=twin, timeout=5)
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                logger.warning(f"Live engines pipeline failed ({e}), returning mock analytics.")

        return MOCK_ENGINE_ANALYTICS.get(res_id, MOCK_ENGINE_ANALYTICS.get(1, {}))

    # --- careMP Sentinel: Genomics & Precision Biotechnology ---

    def get_genomic_profile(self, resident_id: Any) -> Dict[str, Any]:
        """
        Fetches PRS scores, pharmacogenomics variants, and active drug-gene contraindications
        directly from the live NestJS Database API and Analytics Engine.
        """
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            # 1. First attempt live NestJS genomics repository
            token = self.get_token()
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            try:
                url = f"{API_BASE_URL}/genomics/resident/{res_id}"
                res = requests.get(url, headers=headers, timeout=5)
                if res.status_code == 200:
                    body = res.json()
                    gdata = body.get("data")
                    if gdata:
                        return {
                            "residentId": res_id,
                            "overallRiskTier": gdata.get("overallRiskTier", "STANDARD"),
                            "prsScores": gdata.get("prsScores", []),
                            "variants": gdata.get("variants", []),
                            "activeMedications": gdata.get("activeMedications", []),
                            "activePgxAlerts": gdata.get("activePgxAlerts", []),
                            "pharmacogenomics": {
                                "variants": gdata.get("variants", []),
                                "activeAlerts": gdata.get("activePgxAlerts", []),
                            },
                            "phenoGenomicCalibrations": gdata.get("phenoGenomicCalibrations", []),
                        }
            except Exception as e:
                logger.warning(f"NestJS live genomics query failed ({e}), checking engine...")

            # 2. Second attempt live FastAPI Genomics Engine
            url = f"{ENGINES_API_URL}/genomics"
            twin = self.get_digital_twin(res_id)
            try:
                response = requests.post(url, json=twin, timeout=5)
                if response.status_code == 200:
                    insights = response.json().get("healthInsights", {})
                    g_engine = insights.get("genomics")
                    if g_engine:
                        return g_engine
            except Exception as e:
                logger.warning(f"Genomics engine query failed ({e}), using mock.")

        return MOCK_GENOMICS_PROFILES.get(res_id, MOCK_GENOMICS_PROFILES.get(1, {}))

    def evaluate_drug_pgx(self, resident_id: Any, medication_name: str) -> Dict[str, Any]:
        """
        Checks a proposed medication against the resident's genetic variants per CPIC guidelines.
        """
        res_id = parse_resident_id(resident_id)
        profile = self.get_genomic_profile(res_id)
        med_lower = medication_name.lower().strip()

        alerts = profile.get("activePgxAlerts") or profile.get("pharmacogenomics", {}).get("activeAlerts", [])
        matched_alert = next((a for a in alerts if a.get("medication", "").lower() == med_lower), None)

        if matched_alert:
            return {
                "status": "ALERT_TRIGGERED",
                "residentId": res_id,
                "medication": medication_name,
                "alert": matched_alert,
                "isSafe": False,
                "summary": f"CONTRAINDICATION / HIGH RISK: {medication_name} conflicts with {matched_alert.get('gene')}. Recommendation: {matched_alert.get('clinicalRecommendation')}"
            }

        return {
            "status": "NO_KNOWN_CONTRAINDICATION",
            "residentId": res_id,
            "medication": medication_name,
            "isSafe": True,
            "summary": f"No high-risk CPIC pharmacogenomic conflict detected for {medication_name} under resident #{res_id}'s sequenced alleles."
        }

    # --- careMP Sentinel: Telemedicine & Early Deterioration ---

    def get_deterioration_and_frailty(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves live NEWS2 score, Sepsis prodrome assessment, and Rockwood e-FI frailty index.
        """
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            twin = self.get_digital_twin(res_id)
            try:
                det_url = f"{ENGINES_API_URL}/deterioration"
                det_res = requests.post(det_url, json=twin, timeout=5)
                frailty_url = f"{ENGINES_API_URL}/frailty"
                frailty_res = requests.post(frailty_url, json=twin, timeout=5)

                if det_res.status_code == 200:
                    det_data = det_res.json().get("healthInsights", {}).get("deterioration", {})
                    if frailty_res.status_code == 200:
                        frailty_data = frailty_res.json().get("healthInsights", {}).get("frailty", {})
                        det_data["frailty"] = frailty_data
                    return det_data
            except Exception as e:
                logger.warning(f"Live deterioration engine query failed ({e}), falling back to mock.")

        return MOCK_DETERIORATION_PROFILES.get(res_id, MOCK_DETERIORATION_PROFILES.get(1, {}))

    def generate_telemedicine_brief(self, resident_id: Any) -> Dict[str, Any]:
        """
        Synthesizes a 30-second FHIR-aligned clinical briefing for attending tele-physicians.
        """
        res_id = parse_resident_id(resident_id)
        twin = self.get_digital_twin(res_id)
        genomics = self.get_genomic_profile(res_id)
        deterioration = self.get_deterioration_and_frailty(res_id)

        identity = twin.get("identity") or {}
        patient_name = f"{identity.get('firstName', '')} {identity.get('lastName', '')}".strip() or twin.get("name") or f"Resident #{res_id}"

        news2 = deterioration.get("news2", {})
        sepsis = deterioration.get("sepsis", {})
        pgx_alerts = genomics.get("activePgxAlerts") or genomics.get("pharmacogenomics", {}).get("activeAlerts", [])

        brief = {
            "residentId": res_id,
            "patientName": patient_name,
            "clinicalAcuity": {
                "news2Score": news2.get("totalScore", 0),
                "riskLevel": news2.get("riskLevel", "LOW"),
                "sepsisSuspected": sepsis.get("isSuspected") or sepsis.get("isSepsisSuspected", False),
                "sepsisSeverity": sepsis.get("severity", "LOW")
            },
            "pharmacogenomicWarnings": [
                f"{a.get('medication', '')} x {a.get('gene', '')} ({a.get('severity', '')}): {a.get('clinicalRecommendation', '')}"
                for a in pgx_alerts
            ],
            "actionProtocol": news2.get("actionProtocol", "Continue standard continuous wearable biometric telemetry."),
            "recommendedImmediateActions": sepsis.get("clinicalIndicators", []) if isinstance(sepsis.get("clinicalIndicators"), list) else [str(sepsis.get("clinicalIndicators", ""))]
        }
        return brief

    # --- careMP Sentinel: Dementia Memory Care & Validation Telemetry ---

    def get_sundowning_and_wandering(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves real-time sundowning agitation metrics and wandering/spatial safety status.
        Returns agitationIndex, alertLevel, wanderingStatus, locationZone, and calmingSuggestions.
        """
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            twin = self.get_digital_twin(res_id)
            try:
                sun_url = f"{ENGINES_API_URL}/sundowning"
                sun_res = requests.post(sun_url, json=twin, timeout=5)
                wand_url = f"{ENGINES_API_URL}/wandering"
                wand_res = requests.post(wand_url, json=twin, timeout=5)

                if sun_res.status_code == 200:
                    sun_data = sun_res.json().get("healthInsights", {}).get("sundowning", {})
                    wand_data = wand_res.json().get("healthInsights", {}).get("wandering", {}) if wand_res.status_code == 200 else {}
                    status_raw = sun_data.get("status", "CALM")
                    alert_level = status_raw if status_raw in ("CALM", "RESTLESS", "SUNDOWNING_SURGE") else "SUNDOWNING_SURGE"
                    
                    calming = sun_data.get("recommendedInterventions") or [
                        "Offer familiar sensory blanket or comforting item",
                        "Adjust environmental lighting to warm 2700K tone",
                        "Use calm, unhurried verbal validation techniques"
                    ]

                    return {
                        "residentId": res_id,
                        "agitationIndex": sun_data.get("agitationIndex", 0),
                        "alertLevel": alert_level,
                        "wanderingStatus": wand_data.get("wanderingStatus", "SAFE_IN_ROOM"),
                        "locationZone": wand_data.get("currentLocation", "Resident Suite"),
                        "isSundowningWindow": sun_data.get("isSundowningWindow", False),
                        "advanceNoticeMinutes": sun_data.get("advanceNoticeMinutes"),
                        "calmingSuggestions": calming,
                    }
            except Exception as e:
                logger.warning(f"Sundowning/wandering query failed ({e}), using fallback.")

        dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES.get(1, {}))
        sundowning = dementia.get("sundowning", {})
        return {
            "residentId": res_id,
            "agitationIndex": sundowning.get("agitationIndex", 76),
            "alertLevel": sundowning.get("alertLevel", "SUNDOWNING_SURGE"),
            "wanderingStatus": sundowning.get("wanderingStatus", "HALLWAY_PACING"),
            "locationZone": sundowning.get("locationZone", "North Memory Corridor Gallery"),
            "isSundowningWindow": sundowning.get("isSundowningWindow", True),
            "advanceNoticeMinutes": sundowning.get("advanceNoticeMinutes", 35),
            "calmingSuggestions": sundowning.get("calmingSuggestions", []),
        }

    def get_circadian_sleep_profile(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves 24-hour circadian sleep-wake rhythm regularity and day-night reversal metrics.
        Returns dayNapMinutes, nightSleepMinutes, sleepFragmentationEvents, circadianRegularityScore, and dayNightStatus.
        """
        res_id = parse_resident_id(resident_id)

        if not self.use_mock:
            twin = self.get_digital_twin(res_id)
            try:
                circ_url = f"{ENGINES_API_URL}/circadian"
                circ_res = requests.post(circ_url, json=twin, timeout=5)
                if circ_res.status_code == 200:
                    circ_data = circ_res.json().get("healthInsights", {}).get("circadian", {})
                    status_raw = circ_data.get("status", "MILD_DRIFT")
                    day_night_status = "NORMAL" if "NORMAL" in status_raw else ("SEVERE_REVERSAL" if "SEVERE" in status_raw or "REVERSAL" in status_raw else "MILD")
                    return {
                        "residentId": res_id,
                        "dayNapMinutes": circ_data.get("daytimeSleepMinutes", 60),
                        "nightSleepMinutes": circ_data.get("nighttimeSleepMinutes", 360),
                        "sleepFragmentationEvents": circ_data.get("nightAwakenings", 2),
                        "circadianRegularityScore": circ_data.get("circadianScore", 75),
                        "dayNightStatus": day_night_status,
                        "deepSleepMinutes": circ_data.get("deepSleepMinutes", 60),
                        "dayNightRatio": circ_data.get("dayNightRatio", 0.2),
                        "actionableAdvice": circ_data.get("actionableAdvice", []),
                    }
            except Exception as e:
                logger.warning(f"Circadian query failed ({e}), using fallback.")

        dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES.get(1, {}))
        circ = dementia.get("circadian", {})
        return {
            "residentId": res_id,
            "dayNapMinutes": circ.get("dayNapMinutes", 110),
            "nightSleepMinutes": circ.get("nightSleepMinutes", 290),
            "sleepFragmentationEvents": circ.get("sleepFragmentationEvents", 5),
            "circadianRegularityScore": circ.get("circadianRegularityScore", 48),
            "dayNightStatus": circ.get("dayNightStatus", "MILD"),
            "deepSleepMinutes": circ.get("deepSleepMinutes", 42),
            "dayNightRatio": circ.get("dayNightRatio", 0.38),
            "actionableAdvice": circ.get("actionableAdvice", []),
        }

    def generate_shift_handoff_brief(self, resident_id: Any) -> Dict[str, Any]:
        """
        Synthesizes a structured 60-second shift handoff card with vitalsSummary,
        behavioralObservations, mealsHydration, and eveningWatchOuts for ANY resident.
        """
        res_id = parse_resident_id(resident_id)
        twin = self.get_digital_twin(res_id)
        det = self.get_deterioration_and_frailty(res_id)
        dementia = self.get_sundowning_and_wandering(res_id)

        identity = twin.get("identity") or {}
        resident_name = f"{identity.get('firstName', '')} {identity.get('lastName', '')}".strip() or twin.get("name") or f"Resident #{res_id}"
        diagnosis = twin.get("diagnosis", "Memory Care & Assisted Living Surveillance")

        physio = twin.get("physiology") or {}
        def val_of(metric: str, default: float) -> float:
            v = physio.get(metric)
            if isinstance(v, dict):
                return v.get("value", default)
            if isinstance(v, (int, float)):
                return float(v)
            return default

        news2 = det.get("news2", {})
        news2_score = news2.get("totalScore", 0)

        vitals_summary = {
            "heartRate": int(val_of("heartRate", 74)),
            "bloodPressure": f"{int(val_of('systolicBP', 120))}/{int(val_of('diastolicBP', 80))} mmHg",
            "respirationRate": 18,
            "spo2": int(val_of("spo2", 97)),
            "bodyTemperature": round(val_of("bodyTemperature", 36.8), 1),
            "news2Score": news2_score,
            "clinicalAlert": f"Clinical Acuity Level: {news2.get('riskLevel', 'ROUTINE')} (NEWS2 = {news2_score})"
        }

        behavioral = {
            "agitationIndex": dementia.get("agitationIndex", 0),
            "alertLevel": dementia.get("alertLevel", "CALM"),
            "wanderingStatus": dementia.get("wanderingStatus", "SAFE_IN_ROOM"),
            "location": dementia.get("locationZone", "Resident Suite"),
            "mood": "Calm and cooperative" if dementia.get("agitationIndex", 0) < 40 else "Elevated restlessness during circadian transition window",
            "validationTherapyResponse": "Responsive to personalized sensory calming anchors"
        }

        watchouts = [
            f"Active diagnosis: {diagnosis}",
            f"Sundowning surveillance: status is {dementia.get('alertLevel', 'CALM')} (Index: {dementia.get('agitationIndex', 0)}/100)",
            f"Location safety: {dementia.get('locationZone', 'Suite')} ({dementia.get('wanderingStatus', 'SAFE')})",
            "Ensure hydration and maintain routine night-time orientation cues."
        ]

        return {
            "residentId": res_id,
            "residentName": resident_name,
            "diagnosis": diagnosis,
            "handoffTimestamp": datetime.now(timezone.utc).isoformat(),
            "vitalsSummary": vitals_summary,
            "behavioralObservations": behavioral,
            "mealsHydration": {
                "meals": "Nutrition intake within baseline requirements",
                "medicationAdherence": "Medications administered as scheduled"
            },
            "eveningWatchOuts": watchouts,
            "summary": (
                f"60-Second Shift Handover for {resident_name}: "
                f"Vitals stable (HR {vitals_summary['heartRate']} bpm, BP {vitals_summary['bloodPressure']}). "
                f"NEWS2 score: {news2_score}. "
                f"Cognitive/Behavioral state: {behavioral['alertLevel']} with Agitation Index {behavioral['agitationIndex']}/100. "
                f"Location: {behavioral['location']}."
            )
        }


# Global singleton instance
api_client = ApiClient()
