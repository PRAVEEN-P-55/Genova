# 🧬 genova
### AI-Powered eDNA Biodiversity Intelligence Platform
**SIH25042 | Team Antigravity**

> Transform raw environmental DNA sequences into actionable biodiversity intelligence for India's ecosystems.

---

## 📌 What is genova?

genova is a full-stack platform that ingests environmental DNA (eDNA) sequencing files from field samples, runs them through an automated AI/ML analysis pipeline, and delivers:      

- **Taxonomic identification** of organisms present in the sample
- **Biodiversity metrics** (Shannon, Simpson, Chao1, Pielou indices)
- **Ecosystem health scoring** with a transparent, auditable methodology
- **Conservation and invasive species alerts** aligned with WPA and IUCN databases
- **Biodiversity trend prediction** using LSTM time-series models
- **Regulatory compliance reports** ready for MoEFCC/WPA submission
- **RAG-powered AI assistant** that answers natural language questions from your actual data

**Core pipeline:**
```
FASTA/FASTQ Upload → QC → Preprocessing → AI Classification →
Biodiversity Engine → Risk Analysis → Prediction → Dashboard
```

---

## 🗂️ Repository Structure

```
genova/
├── backend/
│   ├── api/                    # FastAPI application
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── samples.py
│   │   │   ├── taxonomy.py
│   │   │   ├── biodiversity.py
│   │   │   ├── alerts.py
│   │   │   ├── predictions.py
│   │   │   ├── assistant.py
│   │   │   ├── reports.py
│   │   │   └── sites.py
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── middleware/         # Auth, rate limiting
│   │
│   ├── workers/                # Celery analysis pipeline
│   │   ├── tasks/
│   │   │   ├── validate.py
│   │   │   ├── quality_control.py
│   │   │   ├── preprocess.py
│   │   │   ├── classify.py
│   │   │   ├── biodiversity.py
│   │   │   ├── risk_analysis.py
│   │   │   ├── prediction.py
│   │   │   └── finalize.py
│   │   └── celery_app.py
│   │
│   ├── ml/                     # AI/ML models
│   │   ├── taxonomy/
│   │   │   ├── kmer_model.py
│   │   │   ├── dnabert_model.py
│   │   │   ├── blast_lookup.py
│   │   │   └── ensemble.py
│   │   ├── prediction/
│   │   │   └── lstm_model.py
│   │   ├── anomaly/
│   │   │   └── isolation_forest.py
│   │   └── assistant/
│   │       └── rag_pipeline.py
│   │
│   ├── db/
│   │   ├── migrations/         # Alembic migrations
│   │   ├── seed/               # Reference data seeders
│   │   └── connection.py
│   │
│   ├── config.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SampleUpload.tsx
│   │   │   ├── SampleResults.tsx
│   │   │   ├── TaxonomyView.tsx
│   │   │   ├── BiodiversityMap.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   ├── Predictions.tsx
│   │   │   ├── AIAssistant.tsx
│   │   │   └── Reports.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/              # Zustand state
│   │   ├── api/                # Axios API client
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
│
├── mobile/                     # React Native (Field Researcher App)
│   └── src/
│
├── data/
│   ├── reference_db/           # Local copies of BOLD, SILVA, IUCN data
│   ├── demo_samples/           # Demo FASTQ/FASTA files for SIH presentation
│   └── benchmarks/             # State and national average JSON files
│
├── scripts/
│   ├── seed_species_reference.py
│   ├── seed_sites.py
│   ├── download_reference_db.sh
│   └── run_demo_pipeline.sh
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── nginx.conf
├── .env.example
├── PRD.md
├── SYSTEM_ARCHITECTURE_AND_APIS.md
├── DATABASE_SCHEMA.md
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 20+
- 8GB RAM minimum (for ML models)
- 20GB free disk (reference databases)

### 1. Clone the Repository

```bash
git clone https://github.com/antigravity-team/bioscan-ai.git
cd bioscan-ai
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=postgresql://bioscan:bioscan@localhost:5432/bioscan_db
REDIS_URL=redis://localhost:6379/0

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bioscan-samples

# JWT
JWT_SECRET_KEY=your-very-secure-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# ML Models
DNABERT_MODEL_PATH=./ml/models/dnabert2
BLAST_DB_PATH=./data/reference_db/blast

# IUCN API (get free token at iucnredlist.org/api/v4)
IUCN_API_TOKEN=your-iucn-token-here

# LLM for RAG Assistant (using Ollama locally)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### 3. Download Reference Databases

```bash
chmod +x scripts/download_reference_db.sh
./scripts/download_reference_db.sh
```

This downloads:
- BOLD Systems COI barcode database (India species subset)
- SILVA 16S rRNA database (v138)
- UNITE ITS fungal database
- NCBI IUCN species status export

### 4. Start All Services

```bash
docker-compose up -d
```

Services started:
| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| Redis | localhost:6379 |
| PostgreSQL | localhost:5432 |
| Elasticsearch | localhost:9200 |
| Neo4j Browser | http://localhost:7474 |
| Ollama (LLM) | http://localhost:11434 |

### 5. Initialize Database

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_species_reference.py
docker-compose exec backend python scripts/seed_sites.py
docker-compose exec backend python scripts/seed_benchmarks.py
```

### 6. Load Demo Data (for SIH)

```bash
./scripts/run_demo_pipeline.sh
```

This pre-processes the demo FASTQ files so the SIH demo runs instantly without waiting for live analysis.

---

## 🧪 Running Tests

```bash
# Backend unit + integration tests
cd backend
pytest tests/ -v --cov=api --cov=workers

# Frontend tests
cd frontend
npm test

# ML model accuracy tests
cd backend
pytest tests/ml/ -v
```

---

## 🔌 API Usage

### Authenticate
```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "researcher@example.com", "password": "password"}'
```

### Upload a Sample
```bash
curl -X POST http://localhost:8000/v1/samples/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/sample.fastq" \
  -F "location_name=Palar River, Tamil Nadu" \
  -F "latitude=12.9716" \
  -F "longitude=79.9714" \
  -F "collection_date=2025-08-10" \
  -F "water_temp_c=28.4" \
  -F "ph=7.2"
```

### Check Analysis Status
```bash
curl http://localhost:8000/v1/samples/EDNA-IND-00001/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Taxonomy Results
```bash
curl "http://localhost:8000/v1/taxonomy/EDNA-IND-00001?kingdom=Animalia&min_confidence=0.7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ask the AI Assistant
```bash
curl -X POST http://localhost:8000/v1/assistant/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which fish species disappeared between 2024 and 2025 at Palar River?",
    "context": {"site_id": "site_palar_river"}
  }'
```

Full API documentation: [SYSTEM_ARCHITECTURE_AND_APIS.md](./SYSTEM_ARCHITECTURE_AND_APIS.md)

---

## 🤖 AI Models

### Taxonomic Classification (Ensemble)

| Model | Purpose | Framework |
|-------|---------|-----------|
| k-mer frequency model | Fast initial filter | scikit-learn (Random Forest) |
| DNABERT-2 | Deep sequence understanding | PyTorch / HuggingFace |
| BLAST local search | Reference database match | BioPython + local BOLD/SILVA DB |
| XGBoost meta-learner | Ensemble voting | XGBoost |

**Barcode-specific models:**
- COI — Animals (BOLD Systems reference)
- 16S rRNA — Prokaryotes (SILVA reference)
- ITS — Fungi (UNITE reference)
- rbcL / matK — Plants (NCBI GenBank)

### Biodiversity Prediction (LSTM)
- Input features: historical biodiversity indices, water temperature, rainfall, dissolved oxygen, pollution scores
- Training data: 2018–2024 monitoring records from WII, CPCB, and state forest departments
- Output: 6-month and 12-month forecasts with 95% confidence intervals
- Scenarios: user-configurable environmental condition simulation

### Anomaly Detection
- Isolation Forest + One-Class SVM ensemble
- Detects unusual eDNA signals not covered by known invasive/conservation lists
- Triggers resampling recommendations for anomalous sites

### RAG AI Assistant
- Vector store: ChromaDB (all platform data indexed as embeddings)
- LLM: Llama 3.1 (8B, via Ollama — runs fully offline)
- Pipeline: Query → Intent classification → Retriever → Context injection → Response
- All answers grounded in platform data — no hallucinated biodiversity facts

---

## 🗺️ Key Features

### 1. Automated Analysis Pipeline
One upload triggers the full pipeline: validation → QC → preprocessing → classification → biodiversity → risk → prediction → dashboard.

### 2. Explainable AI
Every taxonomic prediction shows confidence scores, ensemble agreement, attention-weighted sequence regions, and BLAST evidence — no black-box results.

### 3. Biodiversity Metrics
Shannon, Simpson, Chao1, Pielou's Evenness, and Beta Diversity computed per sample and displayed with full methodology documentation.

### 4. Conservation & Invasive Alerts
Automatic flagging against IUCN Red List, Wildlife Protection Act (WPA) Schedule I–IV, and India's known invasive species database.

### 5. Regulatory Compliance Reports
One-click PDF export formatted for MoEFCC, WPA, State Biodiversity Boards, and EIA biodiversity assessment components.

### 6. Temporal Biodiversity Tracking
Multi-survey comparison for the same site — shows species gained, species lost, index changes, and statistical significance of decline.

### 7. Interactive Biodiversity Map
Leaflet-powered map with site health score overlays, alert markers, invasive species spread visualization, and AI-recommended next sampling locations.

---

## 📊 Reference Databases

| Database | Version | Used For |
|----------|---------|----------|
| BOLD Systems | v5 | COI animal barcodes |
| SILVA | 138.1 | 16S rRNA prokaryote classification |
| UNITE | v9.0 | ITS fungal classification |
| NCBI RefSeq | Current | Plant barcodes, general reference |
| IUCN Red List | v2024-1 | Conservation status lookup |
| WPA Species List | 2024 | Schedule I–IV flagging |
| GBIF India | Current | Distribution / occurrence validation |
| WII Biodiversity | 2023 | National/state benchmark averages |

---

## ⚠️ Scientific Disclaimers

BioScan AI is a decision-support tool, not a replacement for expert ecological field surveys. Users must understand:

- AI classification results ≠ confirmed species identification
- "Potential novel/unclassified taxon" ≠ a proven new species discovery
- Environmental correlations ≠ proven causation
- Conservation alerts require field and laboratory validation before regulatory action
- Biodiversity predictions are estimates with uncertainty — not guaranteed outcomes
- All results should be reviewed by a qualified ecologist before formal reporting

These disclaimers are displayed prominently in the platform UI and in all generated reports.

---

## 🛠️ Development Notes

### Adding a New Reference Database
```python
# 1. Add to data/reference_db/
# 2. Create a loader in scripts/seed_*.py
# 3. Add to species_reference table via seeder
# 4. Update blast_lookup.py to include new DB in search path
```

### Adding a New Alert Type
```python
# backend/workers/tasks/risk_analysis.py
class AlertType(Enum):
    INVASIVE_SPECIES = "INVASIVE_SPECIES"
    CONSERVATION = "CONSERVATION"
    ANOMALY = "ANOMALY"
    BIODIVERSITY_DECLINE = "BIODIVERSITY_DECLINE"
    YOUR_NEW_TYPE = "YOUR_NEW_TYPE"   # Add here
```

### Updating Ecosystem Health Score Methodology
```python
# backend/services/biodiversity_service.py
HEALTH_SCORE_WEIGHTS = {
    "species_diversity": 0.25,
    "native_species_ratio": 0.20,
    "invasive_species_penalty": 0.15,
    "rare_threatened_species": 0.15,
    "population_trend": 0.15,
    "pollution_bioindicators": 0.10,
}
# Update methodology_version when changing weights
METHODOLOGY_VERSION = "v1.2"
```

---

## 👥 Team

**Team Antigravity** | SIH 2025 | Problem Statement SIH25042

| Name | Role |
|------|------|
| Pravin | Backend / ML |
| Navanitha M | Frontend / UI |
| [Team] | Bioinformatics Pipeline |
| [Team] | DevOps / Database |

**Institution:** V.S.B Engineering College, Karur | Computer Science Engineering | Batch 2024–2028

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Product Requirements — features, user stories, acceptance criteria |
| [SYSTEM_ARCHITECTURE_AND_APIS.md](./SYSTEM_ARCHITECTURE_AND_APIS.md) | Architecture diagrams, service layout, full API specification |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Complete PostgreSQL schema with all tables, indexes, and relationships |

---

## 📝 License

This project is developed for Smart India Hackathon 2025 (SIH25042). All rights reserved by Team Antigravity and V.S.B Engineering College.

---

*BioScan AI | Team Antigravity | SIH25042 | V.S.B Engineering College, Karur*
