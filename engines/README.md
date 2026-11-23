# Health Analytics Engines

Microservice providing analytical health computation engines for **careMP Sentinel**.

---

## 🤖 Guide for AI Agents & Developers

### Design Philosophy
1. **Decoupled Architecture**: Engines compute pure analytics from `VitalReading` data models. They are decoupled from data ingestion mechanisms and storage layers.
2. **Standard Python Packages**: Every service under `src/services/` uses standard Python naming conventions (`baseline/`, `trend/`, `correlation/`, `healthy_ageing/`, `ai_summary/`) with **no hyphens**. Always use native relative or package imports:
   ```python
   from src.services.baseline import BaselineEngine
   from src.core.models import VitalReading
   ```
3. **Pydantic Validation**: Input and output payloads use Pydantic models (`DigitalTwinPayload`, `VitalReading`) located in `src/core/models.py`. Do not bypass models with raw untyped dictionaries when building new endpoints.
4. **Stateful vs Stateless**:
   - `BaselineEngine` and `TrendEngine` maintain in-memory sliding windows / EWMA states per `resident_id`.
   - All engines inherit from `BaseEngine` (`src/core/base.py`) and implement `process_reading(reading: VitalReading) -> Dict[str, Any]`.

---

## 📁 Directory Structure

```text
engines/
├── src/
│   ├── core/                      # Data models & BaseEngine abstract class
│   │   ├── base.py
│   │   └── models.py
│   ├── services/                  # Analytical engines
│   │   ├── baseline/              # EWMA rolling baseline calculation
│   │   ├── trend/                 # Linear regression & trend detection
│   │   ├── correlation/           # Cross-vital correlation
│   │   ├── healthy_ageing/        # Longevity & biological age delta
│   │   └── ai_summary/            # Clinical synthesis & summary
│   ├── utils/
│   │   └── mapper.py              # Payload mapping utilities
│   ├── config.py                  # Settings & environment variables
│   └── main.py                    # FastAPI entrypoint
├── tests/                         # Pytest test suite
│   ├── conftest.py
│   └── test_baseline.py
├── requirements.txt               # Dependencies
└── README.md
```

---

## 🚀 Getting Started

### 1. Set Up Environment
```bash
cd engines
python -m venv .venv

# Windows:
.venv\Scripts\activate

# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Run the Development Server
```bash
uvicorn src.main:app --reload --port 5001
```
Interactive Swagger API documentation will be available at:
`http://localhost:5001/docs`

### 3. Run Tests
```bash
pytest
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status check |
| `POST` | `/api/engines/baseline` | Computes rolling EWMA baselines |
| `POST` | `/api/engines/trend` | Evaluates trajectory and regression trends |
| `POST` | `/api/engines/correlation` | Evaluates cross-vital correlations |
| `POST` | `/api/engines/healthy-ageing` | Computes biological age & resilience score |
| `POST` | `/api/engines/ai-summary` | Generates summary synthesis |
| `POST` | `/api/engines/pipeline` | Runs the complete engine pipeline in sequence |
