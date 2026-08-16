# Product Requirements Document (PRD)
## genova — eDNA Biodiversity Intelligence Platform
**Version:** 1.0 | **Project:** SIH25042 | **Team:** Antigravity

---

## 1. Executive Summary

**Product Name:** genova
**One-liner:** Transform raw environmental DNA sequences into actionable biodiversity intelligence for India's ecosystems.
**Problem:** India has no unified, AI-powered platform that converts eDNA field samples into taxonomic identification, biodiversity metrics, conservation alerts, and regulatory reports — all in one pipeline.
**Solution:** genova ingests FASTA/FASTQ sequencing files, runs multi-model AI classification, computes ecological indices, detects threats, predicts trends, and generates government-ready compliance reports.

---

## 2. Goals & Success Metrics

### Product Goals
| Goal | Description |
|------|-------------|
| G1 | Process FASTA/FASTQ files and produce taxonomic results within 5 minutes |
| G2 | Achieve >90% genus-level classification accuracy on Indian freshwater species |
| G3 | Detect known invasive species with >85% precision |
| G4 | Generate MoEFCC/WPA-compatible compliance reports automatically |
| G5 | Enable non-expert users (forest officers) to interpret biodiversity data without a biologist |

### Success Metrics (SIH Demo)
- Upload → complete analysis pipeline: ≤5 minutes for 1,000 sequences
- Taxonomy confidence shown on every result (no black-box outputs)
- At least 3 distinct alert types firing correctly on demo dataset
- Interactive map loads with ≥5 sampling locations and clickable data
- AI Assistant answers at least 5 pre-defined natural language queries correctly

---

## 3. Users & Personas

### Persona 1 — Field Researcher (Primary)
- **Who:** PhD student or ICAR researcher collecting eDNA samples
- **Goal:** Upload sequencing output, get species list and biodiversity report fast
- **Pain point:** Currently uses 5+ separate tools (BLAST, R, Excel, QIIME) to piece together results
- **Needs:** One-click pipeline, export to PDF, sample tracking

### Persona 2 — Forest Department Officer (Primary)
- **Who:** State forest official monitoring wildlife sanctuaries
- **Goal:** Know if endangered or invasive species are present without reading raw data
- **Pain point:** Cannot interpret DNA data, relies on slow third-party lab reports
- **Needs:** Plain-language alerts, WPA-compliant reports, map view

### Persona 3 — Environmental Authority / Regulator (Secondary)
- **Who:** MoEFCC official or State Biodiversity Board member
- **Goal:** Review biodiversity health across multiple sites over time
- **Pain point:** No standardized digital biodiversity monitoring tool
- **Needs:** Dashboard overview, compliance exports, trend charts

### Persona 4 — Lab Technician (Secondary)
- **Who:** Sequencing facility technician at a university or private lab
- **Goal:** Push sequencing results directly to BioScan AI via API
- **Pain point:** Manual file transfers and format conversions
- **Needs:** LIMS API integration, automated upload on run completion

---

## 4. Scope

### In Scope (Version 1.0 — SIH Build)
- FASTA/FASTQ file upload with validation
- Quality Control (PHRED Q30, read depth, contamination screen)
- Automated preprocessing pipeline (trimming, merging, OTU clustering)
- AI Taxonomic Classification (multi-model ensemble)
- Biodiversity Metrics (Shannon, Simpson, Chao1, Pielou, Beta)
- Ecosystem Health Score (weighted, auditable)
- Invasive Species Detection with spread map
- Conservation/Endangered Species Alert (WPA + IUCN)
- Biodiversity Change Detection (multi-survey comparison)
- Biodiversity Trend Prediction (12-month LSTM forecast)
- Environmental Factor Correlation analysis
- Interactive Biodiversity Heatmap (Leaflet)
- Explainable AI results panel
- AI Biodiversity Assistant (RAG-based)
- Regulatory Compliance Report export (PDF)
- Sample tracking with unique EDNA-IND-XXXXX IDs
- Role-based dashboard views (Researcher / Authority / Public)
- Mobile-responsive Field Researcher interface

### Out of Scope (v1.0, Future Roadmap)
- Federated Sampling Network (v2)
- Lab LIMS direct API (v2)
- Drone/Satellite imagery integration (v3)
- Community Science Portal (v2)
- 3D Digital Ecosystem Twin (v3)
- Audio/acoustic biodiversity fusion (v2)

---

## 5. Features & User Stories

### F1 — Sample Upload & Pipeline

| ID | User Story | Priority |
|----|-----------|----------|
| US-01 | As a researcher, I can upload a FASTQ or FASTA file so that the system can analyze my eDNA sample | P0 |
| US-02 | As a researcher, I can view a quality control report before analysis proceeds | P0 |
| US-03 | As a researcher, I receive a unique sample ID (EDNA-IND-XXXXX) for every submission | P0 |
| US-04 | As a researcher, I can attach GPS coordinates, date, water temperature, pH to a sample | P1 |
| US-05 | As a researcher, I can track the processing status of my submitted sample in real time | P1 |

**Acceptance Criteria (US-01):**
- Accepts `.fastq`, `.fastq.gz`, `.fasta`, `.fa` formats
- Max file size: 2GB
- File validated for format integrity before queuing
- Upload progress shown with percentage
- Error message returned within 10 seconds if file is invalid

---

### F2 — AI Taxonomic Classification

| ID | User Story | Priority |
|----|-----------|----------|
| US-06 | As a researcher, I can see a list of all species/taxa identified in my sample with confidence scores | P0 |
| US-07 | As a researcher, I can see the full taxonomic hierarchy (Kingdom → Species) for each detection | P0 |
| US-08 | As a researcher, I can see which sequences could not be classified (flagged as unclassified/novel) | P0 |
| US-09 | As a researcher, I can see the evidence behind each classification (XAI panel) | P1 |
| US-10 | As a researcher, I can filter taxonomy results by Kingdom, confidence level, or conservation status | P1 |

**Acceptance Criteria (US-06):**
- Every detection shows: Scientific name, common name, confidence %, ensemble agreement
- Results sorted by confidence descending by default
- Unclassified sequences clearly labeled "Potential Novel/Unclassified Taxon — validation required"
- No result presented without a confidence score

---

### F3 — Biodiversity Metrics Dashboard

| ID | User Story | Priority |
|----|-----------|----------|
| US-11 | As a researcher, I can view Shannon, Simpson, Chao1, and Pielou indices for my sample | P0 |
| US-12 | As an authority, I can see the Ecosystem Health Score with its component breakdown | P0 |
| US-13 | As a researcher, I can compare beta diversity between two sites | P1 |
| US-14 | As an authority, I can see a site benchmarked against the Tamil Nadu and national average | P1 |

---

### F4 — Risk & Alert System

| ID | User Story | Priority |
|----|-----------|----------|
| US-15 | As an authority, I receive an alert when a known invasive species is detected | P0 |
| US-16 | As an authority, I receive an alert when a WPA Schedule I–IV species signal is detected | P0 |
| US-17 | As a researcher, I can see on a map where an invasive species has been detected across all sites | P0 |
| US-18 | As a researcher, I am notified when a statistically anomalous eDNA signal is found | P1 |

**Acceptance Criteria (US-15):**
- Alert fires within the analysis result page
- Alert shows: species name, confidence, risk level, affected sites, recommended action
- Alert language clearly distinguishes detection from confirmed presence
- Alert recommends field verification

---

### F5 — Temporal Analysis & Prediction

| ID | User Story | Priority |
|----|-----------|----------|
| US-19 | As a researcher, I can compare biodiversity metrics between two surveys at the same site | P0 |
| US-20 | As a researcher, I can see which species appeared or disappeared between surveys | P0 |
| US-21 | As an authority, I can see a 6-month and 12-month biodiversity forecast with confidence interval | P1 |
| US-22 | As an authority, I can run "what-if" scenarios (e.g., invasive species removed) on the forecast | P2 |

---

### F6 — AI Biodiversity Assistant

| ID | User Story | Priority |
|----|-----------|----------|
| US-23 | As a user, I can ask natural language questions about my site's biodiversity data | P1 |
| US-24 | As a user, every AI Assistant answer cites the specific sample or data source it used | P1 |
| US-25 | As a user, the assistant can show relevant charts or maps in response to my question | P2 |

---

### F7 — Compliance & Reporting

| ID | User Story | Priority |
|----|-----------|----------|
| US-26 | As an authority, I can export a biodiversity report formatted for MoEFCC submission | P1 |
| US-27 | As a researcher, I can export a full analysis PDF for a single sample | P1 |
| US-28 | As an authority, I can export a WPA Schedule species detection summary | P1 |

---

### F8 — Map & Visualization

| ID | User Story | Priority |
|----|-----------|----------|
| US-29 | As a user, I can see all sampling sites on an interactive map colored by health score | P0 |
| US-30 | As a user, I can click a site on the map to see its biodiversity summary | P0 |
| US-31 | As a researcher, I can see AI-recommended next sampling locations on the map | P1 |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Analysis pipeline completes in ≤5 min for 1,000 sequences |
| **Performance** | Dashboard page load ≤2 seconds |
| **Scalability** | Architecture supports 50 concurrent analysis jobs |
| **Security** | All uploaded files encrypted at rest (AES-256) |
| **Security** | API endpoints protected with JWT authentication |
| **Availability** | 99% uptime during SIH evaluation period |
| **Accuracy** | Taxonomy: >90% genus-level accuracy on test set |
| **Accuracy** | Invasive detection: >85% precision, >80% recall |
| **Usability** | Forest officer persona can complete alert workflow without training |
| **Compliance** | Audit log for all analysis runs (sample ID, timestamp, user, result hash) |

---

## 7. Constraints & Assumptions

**Constraints:**
- No access to live DNA sequencing hardware during development
- Budget: zero external API costs (use open-source models and public databases)
- Timeline: SIH evaluation deadline

**Assumptions:**
- Demo dataset will use publicly available Indian eDNA data from NCBI SRA and BOLD Systems
- Simulated/augmented sequences acceptable if clearly disclosed in UI
- Reference databases (BOLD, SILVA, NCBI RefSeq) can be downloaded and hosted locally
- IUCN Red List and WPA species lists available as static JSON exports

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DNABERT-2 too slow for demo hardware | Medium | High | Pre-run all demo samples; show cached results |
| Indian eDNA public data insufficient | Medium | High | Augment with BOLD reference sequences |
| FASTQ parsing edge cases | Low | Medium | Use BioPython's SeqIO; test on 10+ real files |
| RAG assistant hallucination | Medium | Medium | Ground all responses to platform DB; no external LLM fallback |
| Judge questions unclassified clusters as "new species" | High | Medium | Add prominent scientific disclaimer in XAI panel |

---

*PRD Version 1.0 | SIH25042 — BioScan AI | Team Antigravity*
