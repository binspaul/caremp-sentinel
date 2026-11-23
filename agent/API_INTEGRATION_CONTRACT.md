# Care Coach Agent: API Integration Contract & Handoff Guide

This document defines the exact contract between the **ADK Care Coach Agent** and the **NestJS Backend (`api/`)** & **Health Analytics Engines (`engines/`)**.

During local development and hackathon demos, the agent runs in **Mock-First Mode** (`USE_MOCK_API=true` in `agent/.env`). As soon as backend routes are live, set `USE_MOCK_API=false` to switch to live endpoints with zero agent code changes.

---

## 1. Digital Twin Profile

### Endpoint: `GET /v1/digital-twin/resident/:residentId`
- **Purpose**: Fetch user identity, baseline vitals, summary of clinical records, and goal.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response Format (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
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
      }
    ],
    "aiSummary": "Alex displays excellent metabolic and cardiovascular stability."
  }
}
```

---

## 2. Short-Term Memory (Temporary symptoms, recovery, trips)

### Endpoint: `GET /v1/short-term-memory/:residentId`
- **Purpose**: Retrieve active (unexpired) temporary memory context.
- **Response Format (`200 OK` or `404 Not Found`)**:
```json
{
  "status": "success",
  "data": {
    "residentId": 1,
    "memoryText": "Preparing for a business trip to Tokyo next Tuesday; worried about jet lag affecting sleep.",
    "ttlDays": 7,
    "expiresAt": "2026-02-27T06:00:00Z",
    "isExpired": false
  }
}
```

### Endpoint: `POST /v1/short-term-memory`
- **Purpose**: Upsert a temporary memory with calculated TTL.
- **Request Body**:
```json
{
  "residentId": 1,
  "memoryText": "Acute headache started yesterday morning; taking 400mg ibuprofen.",
  "ttlDays": 3
}
```

---

## 3. Long-Term Memory (Permanent preferences, allergies, lifestyle, conditions)

### Endpoint: `GET /v1/long-term-memory/:residentId`
- **Purpose**: Retrieve persistent markdown profile.
- **Response Format (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "residentId": 1,
    "memoryText": "## LIFESTYLE & EXERCISE\n- Runs 5k three mornings per week.\n\n## DIET & ALLERGIES\n- Lactose intolerant.\n- Mild allergy to shellfish."
  }
}
```

### Endpoint: `POST /v1/long-term-memory`
- **Purpose**: Upsert synthesized & compacted long-term memory document (max 6,000 chars).
- **Request Body**:
```json
{
  "residentId": 1,
  "memoryText": "## LIFESTYLE & EXERCISE\n...\n## DIET & ALLERGIES\n..."
}
```

---

## 4. Health Analytics Engines (Python Microservice)

### Endpoint: `GET /api/engines/pipeline` (or `/api/engines/healthy-ageing`)
- **Purpose**: Delivers rolling EWMA vitals, trend directions, cross-vital correlations, and biological age delta.
- **Response Format (`200 OK`)**:
```json
{
  "residentId": 1,
  "chronologicalAge": 36,
  "biologicalAge": 33.6,
  "biologicalAgeDelta": -2.4,
  "longevityScore": 91,
  "resilienceScore": 88,
  "ewmaBaselines": {
    "heartRate": 64.2,
    "sleepHours": 7.4
  },
  "vitalTrends": {
    "heartRate": "Stable / Slightly Decreasing (-0.8 bpm over 30d)",
    "sleepDuration": "Upward trajectory (+24 mins/night)"
  }
}
```

---

## How to Switch from Mock to Live
In `agent/.env`:
```bash
USE_MOCK_API=false
API_BASE_URL=http://localhost:4000/v1
```
The agent automatically handles authorization and endpoint routing.
