# System Architecture & API Specification
## genova — eDNA Biodiversity Intelligence Platform
**Version:** 1.0 | **Project:** SIH25042 | **Team:** Antigravity

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React.js Web App (Researcher / Authority / Public)              │
│  React Native Mobile App (Field Researcher)                      │
└───────────────────────┬──────────────────────────────────────────┘
                        │ HTTPS / REST + WebSocket
┌───────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                        │
│  Auth Middleware → Rate Limiter → Request Router                  │
└──┬──────────┬──────────┬──────────┬──────────────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌────────────────┐
│Sample│  │ Bio  │  │Alert │  │  AI Services   │
│Svc   │  │ Svc  │  │ Svc  │  │  (ML Models)   │
└──┬───┘  └──┬───┘  └──┬───┘  └────────┬───────┘
   │          │          │               │
   ▼          ▼          ▼               ▼
┌─────────────────────────────────────────────────┐
│                  MESSAGE QUEUE                   │
│           Celery + Redis (Job Pipeline)          │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────▼───────────────┐
         │   ANALYSIS WORKER POOL      │
         │  ┌──────────────────────┐   │
         │  │ QC Engine            │   │
         │  │ Preprocessing        │   │
         │  │ Taxonomy Classifier  │   │
         │  │ Biodiversity Engine  │   │
         │  │ Risk Engine          │   │
         │  │ Prediction Engine    │   │
         │  └──────────────────────┘   │
         └─────────────────────────────┘
                       │
   ┌───────────────────┼────────────────────┐
   ▼                   ▼                    ▼
┌──────────┐    ┌─────────────┐    ┌──────────────┐
│PostgreSQL│    │ Elasticsearch│    │   Neo4j      │
│+ Time-   │    │ (Species /  │    │ (Knowledge   │
│  scale   │    │  Taxonomy   │    │  Graph)      │
└──────────┘    │  Search)    │    └──────────────┘
                └─────────────┘
                       │
                ┌──────▼──────┐
                │  MinIO/S3   │
                │ (FASTQ/FASTA│
                │  file store)│
                └─────────────┘
```

---

## 2. Service Architecture

### 2.1 Microservices Overview

| Service | Responsibility | Port |
|---------|---------------|------|
| `api-gateway` | Auth, routing, rate limiting | 8000 |
| `sample-service` | Upload, tracking, QC | 8001 |
| `taxonomy-service` | ML classification pipeline | 8002 |
| `biodiversity-service` | Index computation, benchmarking | 8003 |
| `alert-service` | Invasive, conservation, anomaly detection | 8004 |
| `prediction-service` | LSTM forecasting, scenario simulation | 8005 |
| `assistant-service` | RAG AI assistant | 8006 |
| `report-service` | PDF/compliance report generation | 8007 |
| `notification-service` | Email/webhook alerts | 8008 |

---

### 2.2 Analysis Pipeline (Worker Flow)

```
UPLOAD EVENT
     ↓
[Job: validate_file]
  → Check format (FASTQ/FASTA)
  → Virus/malware scan
  → Assign EDNA-IND-XXXXX ID
     ↓
[Job: quality_control]
  → PHRED Q30 scoring
  → Read depth analysis
  → Contamination screen
  → Generate QC report
  → PASS / WARN / FAIL decision
     ↓ (if PASS or WARN)
[Job: preprocess]
  → Adapter/primer trimming (Cutadapt)
  → Paired-end merging (FLASH2)
  → OTU/ASV clustering (VSEARCH/DADA2)
  → Chimera removal (UCHIME)
  → Output: cleaned FASTA + abundance table
     ↓
[Job: taxonomic_classify]
  → k-mer frequency model (scikit-learn)
  → DNABERT-2 embedding model (PyTorch)
  → BLAST similarity (NCBI/BOLD local DB)
  → Ensemble vote → confidence score
  → Flag unclassified sequences
  → Output: taxonomy table (TSV)
     ↓
[Job: biodiversity_compute]
  → Shannon / Simpson / Chao1 / Pielou
  → Alpha diversity per site
  → Beta diversity (if multi-site)
  → Ecosystem Health Score
  → Benchmark against regional averages
     ↓
[Job: risk_analysis]
  → Invasive species lookup
  → Conservation/WPA status check
  → Anomaly detection (Isolation Forest)
  → Alert generation
     ↓
[Job: update_timeseries]
  → Compare with previous surveys (same site)
  → Compute change metrics
  → Trigger prediction model update
     ↓
[Job: finalize_dashboard]
  → Write all results to PostgreSQL
  → Index taxonomy to Elasticsearch
  → Update Neo4j knowledge graph
  → Notify user (WebSocket push)
```

---

## 3. Technology Stack

### Backend
```yaml
Language:        Python 3.11
Framework:       FastAPI 0.110+
ASGI Server:     Uvicorn + Gunicorn
Queue:           Celery 5.3 + Redis 7
ORM:             SQLAlchemy 2.0 + Alembic
Auth:            JWT (python-jose) + bcrypt
Validation:      Pydantic v2
HTTP Client:     httpx (async)
```

### AI / ML
```yaml
DNA Models:      DNABERT-2 (HuggingFace Transformers)
                 Nucleotide Transformer (optional)
Classification:  scikit-learn (Random Forest + SVM ensemble)
                 XGBoost (meta-learner)
Prediction:      PyTorch LSTM / TFT (Temporal Fusion Transformer)
Anomaly:         scikit-learn IsolationForest, PyOD
RAG:             LangChain + ChromaDB + Ollama (local LLM)
Bioinformatics:  BioPython 1.83, Biopandas
Pipeline Tools:  VSEARCH, Cutadapt, FLASH2 (system binaries)
```

### Databases
```yaml
Primary DB:      PostgreSQL 16 + TimescaleDB extension
Search:          Elasticsearch 8.x
Graph:           Neo4j 5.x (Community Edition)
Cache:           Redis 7
File Storage:    MinIO (S3-compatible, self-hosted)
Vector Store:    ChromaDB (RAG embeddings)
```

### Frontend
```yaml
Framework:       React 18 + TypeScript
Build:           Vite
Maps:            Leaflet.js + react-leaflet
Charts:          Recharts + Plotly.js
State:           Zustand
HTTP:            Axios + React Query
Mobile:          React Native (Expo)
UI Components:   Tailwind CSS + shadcn/ui
```

### DevOps
```yaml
Containerization: Docker + Docker Compose
Reverse Proxy:    Nginx
Environment:      .env with python-dotenv
CI:               GitHub Actions
```

---

## 4. API Specification

**Base URL:** `https://api.bioscan.ai/v1`
**Auth:** `Authorization: Bearer <JWT_TOKEN>`
**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

---

### 4.1 Authentication

#### POST `/auth/register`
Register a new user account.

**Request:**
```json
{
  "name": "Pravin Kumar",
  "email": "pravin@vsb.ac.in",
  "password": "securepassword",
  "role": "researcher",
  "organization": "VSB Engineering College"
}
```

**Response `201`:**
```json
{
  "user_id": "usr_9a3f2c",
  "email": "pravin@vsb.ac.in",
  "role": "researcher",
  "created_at": "2025-08-15T10:00:00Z"
}
```

---

#### POST `/auth/login`
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "pravin@vsb.ac.in",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

---

### 4.2 Samples

#### POST `/samples/upload`
Upload an eDNA sequencing file for analysis.

**Request:** `multipart/form-data`
```
file:           <FASTQ or FASTA file, max 2GB>
location_name:  "Palar River, Tamil Nadu"
latitude:       12.9716
longitude:      79.9714
collection_date: "2025-08-10"
water_temp_c:   28.4
ph:             7.2
dissolved_oxygen: 6.8
notes:          "Collected 500m downstream from bridge"
```

**Response `202`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "job_id": "job_7f3b9d",
  "status": "queued",
  "estimated_completion_minutes": 4,
  "upload_url": "https://storage.bioscan.ai/samples/EDNA-IND-00142"
}
```

---

#### GET `/samples/{sample_id}`
Get sample details and analysis status.

**Response `200`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "status": "completed",
  "location": {
    "name": "Palar River, Tamil Nadu",
    "lat": 12.9716,
    "lon": 79.9714
  },
  "collection_date": "2025-08-10",
  "metadata": {
    "water_temp_c": 28.4,
    "ph": 7.2,
    "dissolved_oxygen": 6.8
  },
  "qc_summary": {
    "phred_q30_rate": 91.3,
    "read_depth": 48200,
    "reliability_score": 87,
    "status": "PASS"
  },
  "analysis_summary": {
    "total_sequences": 1284,
    "taxa_detected": 89,
    "unclassified": 23,
    "alerts": 2,
    "ecosystem_health_score": 78,
    "shannon_index": 3.42
  },
  "created_at": "2025-08-15T10:00:00Z",
  "completed_at": "2025-08-15T10:04:22Z"
}
```

---

#### GET `/samples/{sample_id}/status`
WebSocket-compatible polling endpoint for job status.

**Response `200`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "job_id": "job_7f3b9d",
  "status": "processing",
  "current_stage": "taxonomic_classify",
  "stages_completed": ["validate", "quality_control", "preprocess"],
  "stages_remaining": ["biodiversity_compute", "risk_analysis", "finalize"],
  "progress_pct": 58
}
```

---

#### GET `/samples`
List all samples for the authenticated user.

**Query Parameters:**
- `page` (int, default 1)
- `limit` (int, default 20, max 100)
- `status` (string: queued | processing | completed | failed)
- `site_id` (string)
- `date_from` (date)
- `date_to` (date)

**Response `200`:**
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "samples": [
    {
      "sample_id": "EDNA-IND-00142",
      "location_name": "Palar River",
      "collection_date": "2025-08-10",
      "status": "completed",
      "taxa_detected": 89,
      "health_score": 78,
      "alerts": 2
    }
  ]
}
```

---

### 4.3 Taxonomy

#### GET `/taxonomy/{sample_id}`
Get full taxonomic results for a sample.

**Query Parameters:**
- `kingdom` (string: Animalia | Plantae | Fungi | Bacteria | Archaea)
- `min_confidence` (float: 0.0–1.0, default 0.5)
- `conservation_status` (string: endangered | vulnerable | invasive)
- `page` (int)
- `limit` (int)

**Response `200`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "total_taxa": 89,
  "results": [
    {
      "sequence_id": "seq_001_0042",
      "taxonomy": {
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class": "Actinopterygii",
        "order": "Cypriniformes",
        "family": "Cyprinidae",
        "genus": "Labeo",
        "species": "rohita",
        "common_name": "Rohu"
      },
      "confidence": 0.924,
      "ensemble": {
        "kmer_model": 0.87,
        "dnabert_model": 0.91,
        "blast_identity": 0.974,
        "agreement": "HIGH"
      },
      "barcode_marker": "COI",
      "reference_db": "BOLD Systems v5",
      "conservation_status": "Least Concern",
      "wpa_schedule": null,
      "is_invasive": false
    },
    {
      "sequence_id": "seq_002_0019",
      "taxonomy": null,
      "classification_status": "UNCLASSIFIED",
      "label": "Potential Novel/Unclassified Taxon — validation required",
      "nearest_match": {
        "taxon": "Cyprinidae (family)",
        "similarity": 0.71
      },
      "confidence": 0.38
    }
  ]
}
```

---

#### GET `/taxonomy/{sample_id}/xai/{sequence_id}`
Get explainable AI breakdown for a specific classification.

**Response `200`:**
```json
{
  "sequence_id": "seq_001_0042",
  "predicted_species": "Labeo rohita",
  "confidence": 0.924,
  "evidence": {
    "kmer_score": 0.87,
    "dnabert_cosine": 0.91,
    "blast_identity": 0.974,
    "blast_evalue": "0.0",
    "blast_reference_accession": "KM396246"
  },
  "attention_weights": {
    "high_importance_regions": [
      { "start": 45, "end": 120, "label": "COI conserved region", "weight": 0.82 },
      { "start": 220, "end": 290, "label": "Species-specific variable region", "weight": 0.91 }
    ]
  },
  "alternative_matches": [
    { "species": "Labeo bata", "confidence": 0.682, "distinguishing_feature": "COI nucleotide at position 267" }
  ]
}
```

---

### 4.4 Biodiversity

#### GET `/biodiversity/{sample_id}`
Get biodiversity indices for a sample.

**Response `200`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "site": "Palar River, Tamil Nadu",
  "collection_date": "2025-08-10",
  "alpha_diversity": {
    "species_richness": 89,
    "shannon_index": 3.42,
    "simpson_index": 0.91,
    "chao1_richness_estimate": 102,
    "pielou_evenness": 0.78
  },
  "ecosystem_health": {
    "score": 78,
    "classification": "MODERATE",
    "color_zone": "yellow",
    "components": {
      "species_diversity": { "weight": 0.25, "raw_score": 82, "weighted": 20.5 },
      "native_species_ratio": { "weight": 0.20, "raw_score": 78, "weighted": 15.6 },
      "invasive_species_penalty": { "weight": 0.15, "raw_score": -40, "weighted": -6.0 },
      "rare_threatened_species": { "weight": 0.15, "raw_score": 90, "weighted": 13.5 },
      "population_trend": { "weight": 0.15, "raw_score": 60, "weighted": 9.0 },
      "pollution_bioindicators": { "weight": 0.10, "raw_score": 55, "weighted": 5.5 }
    },
    "confidence": 0.84,
    "methodology_version": "v1.2"
  },
  "benchmark": {
    "state_average": { "health_score": 80, "species_richness": 91 },
    "national_average": { "health_score": 76, "species_richness": 104 },
    "comparison": "Site is slightly below Tamil Nadu average, above national average"
  }
}
```

---

#### GET `/biodiversity/compare`
Compare biodiversity metrics between two sites or two surveys.

**Query Parameters:**
- `sample_id_a` (string, required)
- `sample_id_b` (string, required)

**Response `200`:**
```json
{
  "comparison_type": "same_site_temporal",
  "site": "Palar River",
  "period_a": { "sample_id": "EDNA-IND-00091", "date": "2024-08-10", "species_richness": 97, "shannon": 3.61 },
  "period_b": { "sample_id": "EDNA-IND-00142", "date": "2025-08-10", "species_richness": 89, "shannon": 3.42 },
  "change": {
    "species_richness_delta": -8,
    "species_richness_pct_change": -8.25,
    "shannon_delta": -0.19,
    "direction": "DECLINE",
    "significance": "STATISTICALLY_SIGNIFICANT",
    "p_value": 0.032
  },
  "species_gained": [],
  "species_lost": [
    { "species": "Tor tor", "common_name": "Mahseer", "conservation_status": "Vulnerable" },
    { "species": "Notopterus notopterus", "common_name": "Bronze featherback" }
  ],
  "alert": "⚠️ 8.25% decline in observed species richness over 12 months"
}
```

---

#### GET `/biodiversity/beta`
Compute beta diversity between two sites.

**Query Parameters:**
- `sample_id_a`, `sample_id_b` (string, required)

**Response `200`:**
```json
{
  "site_a": "Palar River",
  "site_b": "Cauvery River",
  "bray_curtis_distance": 0.34,
  "interpretation": "Moderate dissimilarity",
  "shared_species": 61,
  "unique_to_a": 28,
  "unique_to_b": 9
}
```

---

### 4.5 Alerts

#### GET `/alerts/{sample_id}`
Get all alerts generated for a sample.

**Response `200`:**
```json
{
  "sample_id": "EDNA-IND-00142",
  "total_alerts": 2,
  "alerts": [
    {
      "alert_id": "alrt_9f2a1b",
      "type": "INVASIVE_SPECIES",
      "severity": "HIGH",
      "species": "Oreochromis niloticus",
      "common_name": "Nile Tilapia",
      "confidence": 0.94,
      "sites_affected": ["Palar River", "Cheyyar River", "Ponnaiyar River"],
      "recommended_actions": [
        "Conduct physical verification at all three sites",
        "Notify State Fisheries Department",
        "Assess spread corridor between sites"
      ],
      "regulatory_reference": "NBSAP Invasive Species Management Protocol",
      "disclaimer": "AI detection — field verification required before regulatory action"
    },
    {
      "alert_id": "alrt_8c3d4e",
      "type": "CONSERVATION",
      "severity": "CRITICAL",
      "species_signal": "Chitala chitala",
      "common_name": "Clown Knifefish",
      "confidence": 0.81,
      "wpa_schedule": "Schedule II",
      "iucn_status": "Near Threatened",
      "recommended_actions": [
        "Increase monitoring frequency at this site",
        "Conduct physical verification",
        "Review protection measures"
      ],
      "disclaimer": "Potential signal only — laboratory and field validation recommended"
    }
  ]
}
```

---

#### GET `/alerts/map`
Get all active alerts across all sites (for map view).

**Response `200`:**
```json
{
  "alerts": [
    {
      "alert_id": "alrt_9f2a1b",
      "type": "INVASIVE_SPECIES",
      "severity": "HIGH",
      "species": "Oreochromis niloticus",
      "lat": 12.9716,
      "lon": 79.9714,
      "site_name": "Palar River"
    }
  ]
}
```

---

### 4.6 Predictions

#### GET `/predictions/{site_id}`
Get biodiversity trend forecast for a site.

**Query Parameters:**
- `horizon_months` (int: 6 or 12, default 12)

**Response `200`:**
```json
{
  "site_id": "site_palar_river",
  "site_name": "Palar River, Tamil Nadu",
  "current_index": 78,
  "forecast": {
    "baseline": {
      "6_months": { "mean": 75, "lower_ci": 71.9, "upper_ci": 78.1 },
      "12_months": { "mean": 71, "lower_ci": 66.2, "upper_ci": 75.8 }
    },
    "trend_direction": "DECLINE",
    "significance": "STATISTICALLY_SIGNIFICANT",
    "model": "LSTM",
    "inputs_used": ["historical_edna", "water_temperature", "rainfall", "dissolved_oxygen"],
    "training_period": "2018–2024",
    "disclaimer": "Estimates based on historical trends. Actual outcomes depend on environmental conditions."
  },
  "scenarios": [
    {
      "name": "Invasive species controlled",
      "description": "Nile Tilapia population reduced by 80%",
      "12_month_forecast": { "mean": 81, "lower_ci": 77.2, "upper_ci": 84.8 }
    },
    {
      "name": "Continued degradation",
      "description": "Current pollution levels maintained + 10% increase",
      "12_month_forecast": { "mean": 62, "lower_ci": 55.9, "upper_ci": 68.1 }
    }
  ]
}
```

---

### 4.7 AI Assistant

#### POST `/assistant/query`
Ask a natural language question to the RAG-powered AI assistant.

**Request:**
```json
{
  "question": "Which fish species disappeared between 2024 and 2025 at Palar River?",
  "context": {
    "site_id": "site_palar_river",
    "sample_ids": ["EDNA-IND-00091", "EDNA-IND-00142"]
  }
}
```

**Response `200`:**
```json
{
  "answer": "Comparing samples EDNA-IND-00091 (August 2024) and EDNA-IND-00142 (August 2025), six fish species were present in 2024 but absent in 2025: Tor tor (Mahseer), Notopterus notopterus, Labeo calbasu, Rasbora daniconius, Puntius sophore, and Cirrhinus cirrhosus. The Mahseer is of particular conservation concern as it is listed as Vulnerable on the IUCN Red List.",
  "confidence": "HIGH",
  "sources": [
    { "type": "sample", "id": "EDNA-IND-00091", "date": "2024-08-10" },
    { "type": "sample", "id": "EDNA-IND-00142", "date": "2025-08-10" },
    { "type": "database", "name": "IUCN Red List", "accessed": "2025-08-15" }
  ],
  "suggested_visualizations": ["species_comparison_chart", "conservation_status_breakdown"],
  "disclaimer": "This answer is generated from platform data only. Always verify with a qualified ecologist."
}
```

---

### 4.8 Maps & Sites

#### GET `/sites`
Get all sampling sites with summary stats.

**Response `200`:**
```json
{
  "sites": [
    {
      "site_id": "site_palar_river",
      "name": "Palar River",
      "state": "Tamil Nadu",
      "lat": 12.9716,
      "lon": 79.9714,
      "latest_health_score": 78,
      "health_classification": "MODERATE",
      "latest_sample_date": "2025-08-10",
      "total_samples": 14,
      "active_alerts": 2,
      "species_detected": 89
    }
  ]
}
```

---

#### GET `/sites/{site_id}/sampling-recommendation`
Get AI-recommended next sampling location near this site.

**Response `200`:**
```json
{
  "recommended_location": {
    "lat": 13.0142,
    "lon": 79.9328,
    "description": "Upstream tributary confluence, 4.2km NW of current site"
  },
  "priority": "HIGH",
  "reasons": [
    "Biodiversity uncertainty: High (last sampled >8 months ago)",
    "Habitat transition zone: River-wetland ecotone",
    "Species anomaly detected downstream (Nile Tilapia spread corridor)",
    "Previous sampling: Low (1 sample total)"
  ]
}
```

---

### 4.9 Reports

#### POST `/reports/generate`
Generate a compliance or summary report.

**Request:**
```json
{
  "report_type": "moefcc_biodiversity_assessment",
  "sample_ids": ["EDNA-IND-00142"],
  "site_id": "site_palar_river",
  "include_sections": ["taxonomy", "biodiversity_metrics", "alerts", "recommendations"]
}
```

**Available report_type values:**
- `moefcc_biodiversity_assessment`
- `wpa_schedule_detection_summary`
- `iucn_red_list_summary`
- `full_analysis_pdf`
- `state_biodiversity_board_format`

**Response `202`:**
```json
{
  "report_id": "rpt_4a9f2c",
  "status": "generating",
  "estimated_seconds": 30
}
```

#### GET `/reports/{report_id}/download`
Download the generated report (PDF).

**Response:** Binary PDF stream with `Content-Disposition: attachment`

---

### 4.10 WebSocket — Live Job Status

**Endpoint:** `wss://api.bioscan.ai/v1/ws/jobs/{job_id}`

**Messages from server:**
```json
{ "event": "stage_complete", "stage": "quality_control", "progress_pct": 20 }
{ "event": "stage_complete", "stage": "preprocess", "progress_pct": 40 }
{ "event": "stage_complete", "stage": "taxonomic_classify", "progress_pct": 65 }
{ "event": "stage_complete", "stage": "biodiversity_compute", "progress_pct": 80 }
{ "event": "stage_complete", "stage": "risk_analysis", "progress_pct": 90 }
{ "event": "job_complete", "sample_id": "EDNA-IND-00142", "progress_pct": 100, "redirect_url": "/samples/EDNA-IND-00142/results" }
```

---

## 5. Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Uploaded file is not a valid FASTQ or FASTA format.",
    "details": "File header does not match expected @ (FASTQ) or > (FASTA) prefix.",
    "request_id": "req_7f3a2d"
  }
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad request (invalid input) |
| 401 | Unauthenticated |
| 403 | Forbidden (role/permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate sample) |
| 413 | File too large (>2GB) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Analysis worker unavailable |

---

## 6. External Integrations

| Service | Purpose | Access Method |
|---------|---------|---------------|
| BOLD Systems API | COI barcode reference lookup | REST API + local mirror |
| NCBI E-utilities | GenBank sequence fetch | REST API |
| SILVA Database | 16S rRNA reference | Local FASTA download |
| UNITE Database | ITS fungal reference | Local FASTA download |
| IUCN Red List API | Conservation status lookup | REST API (token required) |
| GBIF API | Occurrence/distribution data | REST API (public) |

---

*Architecture v1.0 | SIH25042 — BioScan AI | Team Antigravity*
