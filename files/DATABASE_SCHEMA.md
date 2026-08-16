# Database Schema
## genova — eDNA Biodiversity Intelligence Platform
**Version:** 1.0 | **Primary DB:** PostgreSQL 16 + TimescaleDB

---

## 1. Schema Overview

```
genova_db
├── auth            → users, roles, sessions
├── samples         → sample metadata, QC, tracking
├── taxonomy        → classification results, sequences
├── biodiversity    → indices, health scores, benchmarks
├── alerts          → invasive, conservation, anomaly
├── timeseries      → historical indices (TimescaleDB)
├── predictions     → forecast results, scenarios
├── knowledge       → species reference, sites
├── reports         → generated report records
└── assistant       → RAG conversation logs
```

---

## 2. Auth Schema

### `users`
```sql
CREATE TABLE users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'researcher',
                  -- researcher | authority | lab_technician | admin | public
  organization    VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  email_verified  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### `sessions`
```sql
CREATE TABLE sessions (
  session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  ip_address      INET,
  user_agent      TEXT
);

CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

---

## 3. Samples Schema

### `sites`
Reusable geographic locations that can be sampled multiple times.

```sql
CREATE TABLE sites (
  site_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  state           VARCHAR(100),
  district        VARCHAR(100),
  ecosystem_type  VARCHAR(100),
                  -- freshwater_river | freshwater_lake | coastal |
                  -- marine | terrestrial_forest | wetland | mangrove
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,
  elevation_m     DECIMAL(8, 2),
  description     TEXT,
  created_by      UUID REFERENCES users(user_id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sites_geo ON sites USING GIST (
  ST_MakePoint(longitude, latitude)
);
CREATE INDEX idx_sites_state ON sites(state);
```

### `samples`
Core sample tracking table.

```sql
CREATE TABLE samples (
  sample_id       VARCHAR(20) PRIMARY KEY,
                  -- Format: EDNA-IND-00001 (auto-generated)
  user_id         UUID NOT NULL REFERENCES users(user_id),
  site_id         UUID REFERENCES sites(site_id),

  -- Location (stored independently even if site exists)
  location_name   VARCHAR(255) NOT NULL,
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,

  -- Collection metadata
  collection_date DATE NOT NULL,
  collected_by    VARCHAR(255),
  collection_method VARCHAR(100),
                  -- water_filtration | sediment | soil | air

  -- Environmental parameters
  water_temp_c    DECIMAL(5, 2),
  ph              DECIMAL(4, 2),
  dissolved_oxygen DECIMAL(5, 2), -- mg/L
  salinity_ppt    DECIMAL(6, 3),
  turbidity_ntu   DECIMAL(8, 2),
  notes           TEXT,

  -- File storage
  file_name       VARCHAR(500) NOT NULL,
  file_format     VARCHAR(10) NOT NULL, -- FASTQ | FASTA
  file_size_bytes BIGINT,
  file_path       TEXT NOT NULL,        -- MinIO object path
  file_md5        VARCHAR(32),

  -- Sequencing info
  sequencing_platform VARCHAR(100),     -- Illumina MiSeq | ONT | PacBio
  barcode_markers VARCHAR(200),         -- COI,16S,ITS (comma-separated)

  -- Job tracking
  job_id          VARCHAR(100),
  status          VARCHAR(30) NOT NULL DEFAULT 'queued',
                  -- queued | validating | qc | preprocessing |
                  -- classifying | computing | finalizing | completed | failed
  current_stage   VARCHAR(50),
  progress_pct    SMALLINT DEFAULT 0,
  error_message   TEXT,
  failed_stage    VARCHAR(50),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  queued_at       TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_samples_user ON samples(user_id);
CREATE INDEX idx_samples_site ON samples(site_id);
CREATE INDEX idx_samples_status ON samples(status);
CREATE INDEX idx_samples_date ON samples(collection_date DESC);
CREATE INDEX idx_samples_geo ON samples USING GIST (
  ST_MakePoint(longitude, latitude)
);

-- Auto-generate sample_id sequence
CREATE SEQUENCE sample_id_seq START 1;
-- Trigger function to generate EDNA-IND-XXXXX IDs
CREATE OR REPLACE FUNCTION generate_sample_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sample_id := 'EDNA-IND-' || LPAD(nextval('sample_id_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sample_id
  BEFORE INSERT ON samples
  FOR EACH ROW
  EXECUTE FUNCTION generate_sample_id();
```

### `sample_qc_reports`
Quality control results per sample.

```sql
CREATE TABLE sample_qc_reports (
  qc_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),

  -- Read statistics
  total_reads       INTEGER,
  passed_reads      INTEGER,
  failed_reads      INTEGER,
  phred_q30_rate    DECIMAL(5, 2),   -- Percentage of bases Q30+
  mean_read_length  DECIMAL(8, 2),
  read_depth        INTEGER,

  -- Quality indicators
  gc_content_pct    DECIMAL(5, 2),
  gc_status         VARCHAR(10),     -- NORMAL | HIGH | LOW
  duplication_rate  DECIMAL(5, 2),

  -- Contamination
  human_dna_pct        DECIMAL(6, 4),
  lab_contaminant_pct  DECIMAL(6, 4),
  chloroplast_dna_pct  DECIMAL(6, 4),
  contamination_flag   BOOLEAN DEFAULT FALSE,
  contamination_notes  TEXT,

  -- Overall assessment
  reliability_score  SMALLINT,       -- 0–100
  qc_status          VARCHAR(10) NOT NULL, -- PASS | WARN | FAIL
  fail_reason        TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qc_sample ON sample_qc_reports(sample_id);
```

---

## 4. Taxonomy Schema

### `taxonomy_results`
One row per identified taxon per sample.

```sql
CREATE TABLE taxonomy_results (
  result_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  sequence_id       VARCHAR(100) NOT NULL,   -- Internal sequence identifier

  -- Classification status
  classification_status VARCHAR(20) NOT NULL,
  -- CLASSIFIED | UNCLASSIFIED | PARTIAL | NOVEL_CANDIDATE

  -- Taxonomy hierarchy
  kingdom           VARCHAR(100),
  phylum            VARCHAR(100),
  class             VARCHAR(100),
  taxonomy_order    VARCHAR(100),            -- 'order' is reserved in SQL
  family            VARCHAR(100),
  genus             VARCHAR(100),
  species           VARCHAR(200),
  common_name       VARCHAR(300),
  lowest_rank_identified VARCHAR(20),
  -- kingdom | phylum | class | order | family | genus | species

  -- Confidence & ensemble
  final_confidence  DECIMAL(5, 4),           -- 0.0000–1.0000
  kmer_confidence   DECIMAL(5, 4),
  dnabert_confidence DECIMAL(5, 4),
  blast_identity    DECIMAL(5, 4),
  blast_evalue      VARCHAR(20),
  blast_accession   VARCHAR(50),
  ensemble_agreement VARCHAR(10),            -- HIGH | MEDIUM | LOW

  -- Barcode marker used
  barcode_marker    VARCHAR(20),             -- COI | 16S | ITS | matK | rbcL
  reference_db      VARCHAR(100),

  -- Conservation
  iucn_status       VARCHAR(50),
  wpa_schedule      VARCHAR(20),             -- NULL | Schedule I–IV
  is_invasive       BOOLEAN DEFAULT FALSE,

  -- Novel/unclassified metadata
  nearest_known_taxon VARCHAR(200),
  nearest_similarity  DECIMAL(5, 4),

  -- Abundance
  read_count        INTEGER,
  relative_abundance DECIMAL(8, 6),         -- Fraction of total reads

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_sample ON taxonomy_results(sample_id);
CREATE INDEX idx_tax_species ON taxonomy_results(species);
CREATE INDEX idx_tax_confidence ON taxonomy_results(final_confidence DESC);
CREATE INDEX idx_tax_status ON taxonomy_results(classification_status);
CREATE INDEX idx_tax_invasive ON taxonomy_results(is_invasive) WHERE is_invasive = TRUE;
CREATE INDEX idx_tax_wpa ON taxonomy_results(wpa_schedule) WHERE wpa_schedule IS NOT NULL;
```

### `taxonomy_xai`
Explainable AI detail per classified result.

```sql
CREATE TABLE taxonomy_xai (
  xai_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id         UUID NOT NULL REFERENCES taxonomy_results(result_id),
  sample_id         VARCHAR(20) NOT NULL,

  -- Evidence summary
  evidence_kmer_score     DECIMAL(5, 4),
  evidence_dnabert_cosine DECIMAL(5, 4),
  evidence_blast_identity DECIMAL(5, 4),
  evidence_blast_evalue   VARCHAR(20),

  -- Attention weights (stored as JSONB)
  -- Format: [{"start": 45, "end": 120, "label": "COI conserved", "weight": 0.82}]
  attention_regions JSONB,

  -- Alternative matches
  -- Format: [{"species": "Labeo bata", "confidence": 0.68, "distinguishing": "pos 267"}]
  alternative_matches JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xai_result ON taxonomy_xai(result_id);
```

---

## 5. Biodiversity Schema

### `biodiversity_metrics`
Computed ecological indices per sample.

```sql
CREATE TABLE biodiversity_metrics (
  metric_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id) UNIQUE,
  site_id           UUID REFERENCES sites(site_id),
  computed_at       TIMESTAMPTZ DEFAULT NOW(),

  -- Alpha diversity
  species_richness       INTEGER,
  shannon_index          DECIMAL(8, 5),
  simpson_index          DECIMAL(8, 5),
  chao1_estimate         DECIMAL(8, 2),
  chao1_lower_ci         DECIMAL(8, 2),
  chao1_upper_ci         DECIMAL(8, 2),
  pielou_evenness        DECIMAL(8, 5),

  -- Taxonomic breakdown
  total_taxa             INTEGER,
  fish_taxa              INTEGER,
  plant_taxa             INTEGER,
  microbial_taxa         INTEGER,
  fungal_taxa            INTEGER,
  amphibian_taxa         INTEGER,
  other_taxa             INTEGER,
  unclassified_count     INTEGER,

  -- Conservation breakdown
  iucn_critically_endangered INTEGER DEFAULT 0,
  iucn_endangered            INTEGER DEFAULT 0,
  iucn_vulnerable            INTEGER DEFAULT 0,
  iucn_near_threatened       INTEGER DEFAULT 0,
  wpa_schedule_1             INTEGER DEFAULT 0,
  wpa_schedule_2             INTEGER DEFAULT 0,
  wpa_schedule_4             INTEGER DEFAULT 0,
  invasive_count             INTEGER DEFAULT 0,

  -- Native vs invasive
  native_species_count  INTEGER,
  native_species_pct    DECIMAL(5, 2),

  -- Sequencing stats
  total_sequences       INTEGER,
  classified_count      INTEGER,
  classification_rate   DECIMAL(5, 2)
);

CREATE INDEX idx_bio_sample ON biodiversity_metrics(sample_id);
CREATE INDEX idx_bio_site ON biodiversity_metrics(site_id);
```

### `ecosystem_health_scores`
Ecosystem health scoring with full audit trail.

```sql
CREATE TABLE ecosystem_health_scores (
  score_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  site_id           UUID REFERENCES sites(site_id),

  -- Final score
  health_score      DECIMAL(5, 2),   -- 0–100
  classification    VARCHAR(20),     -- HEALTHY | MODERATE | DEGRADED | CRITICAL
  color_zone        VARCHAR(10),     -- green | yellow | orange | red
  confidence        DECIMAL(5, 4),

  -- Component scores (JSONB for flexibility)
  -- {"component": "species_diversity", "weight": 0.25, "raw": 82, "weighted": 20.5}
  components        JSONB NOT NULL,

  -- Methodology
  methodology_version VARCHAR(10) NOT NULL DEFAULT 'v1.2',
  computed_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_sample ON ecosystem_health_scores(sample_id);
CREATE INDEX idx_health_site ON ecosystem_health_scores(site_id);
CREATE INDEX idx_health_score ON ecosystem_health_scores(health_score DESC);
```

### `site_benchmarks`
Comparison of site metrics against regional/national baselines.

```sql
CREATE TABLE site_benchmarks (
  benchmark_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  site_id           UUID REFERENCES sites(site_id),
  benchmark_date    DATE NOT NULL,

  -- Site values
  site_health_score     DECIMAL(5, 2),
  site_species_richness INTEGER,
  site_shannon          DECIMAL(8, 5),

  -- Regional comparison (Tamil Nadu example)
  state_avg_health_score     DECIMAL(5, 2),
  state_avg_species_richness DECIMAL(8, 2),
  state_avg_shannon          DECIMAL(8, 5),
  state_benchmark_source     VARCHAR(200),

  -- National comparison
  national_avg_health_score     DECIMAL(5, 2),
  national_avg_species_richness DECIMAL(8, 2),
  national_avg_shannon          DECIMAL(8, 5),
  national_benchmark_source     VARCHAR(200),

  -- Narrative
  comparison_summary TEXT,

  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bench_sample ON site_benchmarks(sample_id);
```

### `beta_diversity` (TimescaleDB hypertable for time-aware queries)
Beta diversity comparisons between sites.

```sql
CREATE TABLE beta_diversity (
  comparison_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id_a        VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  sample_id_b        VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  site_a             VARCHAR(255),
  site_b             VARCHAR(255),

  bray_curtis_distance  DECIMAL(8, 5),
  jaccard_distance      DECIMAL(8, 5),
  interpretation        VARCHAR(50), -- low | moderate | high dissimilarity

  shared_species_count  INTEGER,
  unique_to_a           INTEGER,
  unique_to_b           INTEGER,

  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beta_sample_a ON beta_diversity(sample_id_a);
CREATE INDEX idx_beta_sample_b ON beta_diversity(sample_id_b);
```

---

## 6. Alerts Schema

### `alerts`
All system-generated alerts.

```sql
CREATE TABLE alerts (
  alert_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  site_id           UUID REFERENCES sites(site_id),

  alert_type        VARCHAR(30) NOT NULL,
  -- INVASIVE_SPECIES | CONSERVATION | ANOMALY | BIODIVERSITY_DECLINE

  severity          VARCHAR(10) NOT NULL,  -- LOW | MEDIUM | HIGH | CRITICAL

  -- Species info (for species-level alerts)
  species_name      VARCHAR(200),
  common_name       VARCHAR(300),
  confidence        DECIMAL(5, 4),

  -- Conservation info
  iucn_status       VARCHAR(50),
  wpa_schedule      VARCHAR(20),

  -- Invasive info
  invasive_risk_level VARCHAR(10),         -- LOW | MEDIUM | HIGH
  sites_affected    TEXT[],               -- Array of site names

  -- Anomaly info
  anomaly_type      VARCHAR(100),
  anomaly_description TEXT,
  anomaly_algorithm VARCHAR(100),

  -- Response
  recommended_actions  TEXT[],
  regulatory_reference VARCHAR(500),
  disclaimer           TEXT,

  -- Status
  is_acknowledged   BOOLEAN DEFAULT FALSE,
  acknowledged_by   UUID REFERENCES users(user_id),
  acknowledged_at   TIMESTAMPTZ,
  resolution_notes  TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_sample ON alerts(sample_id);
CREATE INDEX idx_alerts_site ON alerts(site_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_species ON alerts(species_name);
CREATE INDEX idx_alerts_unack ON alerts(is_acknowledged) WHERE is_acknowledged = FALSE;
```

---

## 7. TimeSeries Schema (TimescaleDB)

### `biodiversity_timeseries`
Hypertable for storing biodiversity metrics over time per site.

```sql
CREATE TABLE biodiversity_timeseries (
  time              TIMESTAMPTZ NOT NULL,
  site_id           UUID NOT NULL REFERENCES sites(site_id),
  sample_id         VARCHAR(20) REFERENCES samples(sample_id),

  species_richness  INTEGER,
  shannon_index     DECIMAL(8, 5),
  simpson_index     DECIMAL(8, 5),
  health_score      DECIMAL(5, 2),
  invasive_count    INTEGER,
  threatened_count  INTEGER,
  classified_rate   DECIMAL(5, 2)
);

-- Convert to TimescaleDB hypertable (partition by month)
SELECT create_hypertable('biodiversity_timeseries', 'time');

-- Continuous aggregate for monthly averages (auto-maintained)
CREATE MATERIALIZED VIEW monthly_site_biodiversity
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 month', time) AS month,
  site_id,
  AVG(species_richness)::DECIMAL(8,2) AS avg_richness,
  AVG(shannon_index)::DECIMAL(8,5) AS avg_shannon,
  AVG(health_score)::DECIMAL(5,2) AS avg_health_score,
  COUNT(*) AS sample_count
FROM biodiversity_timeseries
GROUP BY 1, 2;
```

---

## 8. Predictions Schema

### `biodiversity_predictions`
Stored forecast results.

```sql
CREATE TABLE biodiversity_predictions (
  prediction_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           UUID NOT NULL REFERENCES sites(site_id),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Current baseline
  current_index     DECIMAL(5, 2),
  based_on_samples  VARCHAR(20)[],        -- Array of sample IDs used

  -- Forecast (JSONB: {"horizon_months": 6, "mean": 75, "lower_ci": 71.9, "upper_ci": 78.1})
  baseline_forecast JSONB,
  trend_direction   VARCHAR(10),          -- INCREASE | STABLE | DECLINE
  is_significant    BOOLEAN,
  p_value           DECIMAL(6, 4),

  -- Scenarios (JSONB array)
  scenarios         JSONB,

  -- Model metadata
  model_type        VARCHAR(50) DEFAULT 'LSTM',
  inputs_used       TEXT[],
  training_period   VARCHAR(50),

  expires_at        TIMESTAMPTZ           -- Predictions expire after 30 days
);

CREATE INDEX idx_pred_site ON biodiversity_predictions(site_id);
CREATE INDEX idx_pred_generated ON biodiversity_predictions(generated_at DESC);
```

---

## 9. Knowledge Schema

### `species_reference`
Reference species database (synced from BOLD, IUCN, NCBI).

```sql
CREATE TABLE species_reference (
  species_ref_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name   VARCHAR(300) UNIQUE NOT NULL,
  common_names      TEXT[],

  -- Taxonomy
  kingdom           VARCHAR(100),
  phylum            VARCHAR(100),
  class             VARCHAR(100),
  taxonomy_order    VARCHAR(100),
  family            VARCHAR(100),
  genus             VARCHAR(100),
  species_epithet   VARCHAR(200),

  -- Barcode references
  bold_bin          VARCHAR(50),           -- BOLD BIN accession
  ncbi_taxid        VARCHAR(20),
  reference_sequences TEXT[],             -- GenBank accessions

  -- Conservation
  iucn_status       VARCHAR(50),
  iucn_version      VARCHAR(20),
  iucn_assessed_year INTEGER,
  wpa_schedule      VARCHAR(20),
  cites_appendix    VARCHAR(10),

  -- Ecology
  habitat_types     TEXT[],
  geographic_range  TEXT,
  trophic_level     VARCHAR(50),
  is_invasive_india BOOLEAN DEFAULT FALSE,
  invasive_risk_level VARCHAR(10),
  invasive_source_regions TEXT[],

  -- Source tracking
  data_sources      TEXT[],
  last_synced       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_species_name ON species_reference(scientific_name);
CREATE INDEX idx_species_kingdom ON species_reference(kingdom);
CREATE INDEX idx_species_iucn ON species_reference(iucn_status);
CREATE INDEX idx_species_invasive ON species_reference(is_invasive_india) WHERE is_invasive_india = TRUE;
CREATE INDEX idx_species_wpa ON species_reference(wpa_schedule) WHERE wpa_schedule IS NOT NULL;
CREATE INDEX idx_species_fulltext ON species_reference USING GIN (
  to_tsvector('english', scientific_name || ' ' || array_to_string(common_names, ' '))
);
```

### `environmental_factors`
Environmental parameter readings per sample (for correlation analysis).

```sql
CREATE TABLE environmental_factors (
  factor_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id         VARCHAR(20) NOT NULL REFERENCES samples(sample_id),
  site_id           UUID REFERENCES sites(site_id),
  measured_at       TIMESTAMPTZ NOT NULL,

  -- Water parameters
  water_temp_c      DECIMAL(5, 2),
  ph                DECIMAL(4, 2),
  dissolved_oxygen  DECIMAL(5, 2),
  turbidity_ntu     DECIMAL(8, 2),
  conductivity_us   DECIMAL(8, 2),
  nitrates_mgl      DECIMAL(8, 4),
  phosphates_mgl    DECIMAL(8, 4),
  salinity_ppt      DECIMAL(6, 3),

  -- Atmospheric / regional
  air_temp_c        DECIMAL(5, 2),
  rainfall_mm       DECIMAL(8, 2),
  rainfall_30day_mm DECIMAL(8, 2),

  -- Derived/computed
  pollution_score   DECIMAL(5, 2),  -- 0–100 composite
  data_source       VARCHAR(100)    -- field_measurement | government_station | satellite
);

CREATE INDEX idx_env_sample ON environmental_factors(sample_id);
CREATE INDEX idx_env_site ON environmental_factors(site_id);
```

---

## 10. Reports Schema

### `reports`
Generated compliance and summary reports.

```sql
CREATE TABLE reports (
  report_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(user_id),

  report_type       VARCHAR(50) NOT NULL,
  -- moefcc_biodiversity_assessment | wpa_schedule_summary |
  -- iucn_red_list_summary | full_analysis_pdf | state_biodiversity_board

  title             VARCHAR(500),
  sample_ids        VARCHAR(20)[],
  site_id           UUID REFERENCES sites(site_id),

  -- File storage
  file_path         TEXT,            -- MinIO path once generated
  file_size_bytes   BIGINT,

  status            VARCHAR(20) DEFAULT 'pending',
  -- pending | generating | completed | failed

  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ     -- Auto-delete after 30 days
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
```

---

## 11. Assistant Schema

### `assistant_sessions`
RAG AI assistant conversation tracking.

```sql
CREATE TABLE assistant_sessions (
  session_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(user_id),
  site_id           UUID REFERENCES sites(site_id),
  context_sample_ids VARCHAR(20)[],
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_active_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assistant_messages (
  message_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES assistant_sessions(session_id),
  role              VARCHAR(10) NOT NULL,        -- user | assistant
  content           TEXT NOT NULL,
  sources           JSONB,                       -- Citations used by assistant
  confidence        VARCHAR(10),                 -- HIGH | MEDIUM | LOW
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asst_session ON assistant_messages(session_id);
CREATE INDEX idx_asst_created ON assistant_messages(created_at DESC);
```

---

## 12. Audit & Sampling Recommendation

### `audit_log`
Immutable audit trail for all analysis runs.

```sql
CREATE TABLE audit_log (
  log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(user_id),
  action            VARCHAR(100) NOT NULL,
  resource_type     VARCHAR(50),              -- sample | report | alert
  resource_id       VARCHAR(100),
  result_hash       VARCHAR(64),              -- SHA-256 of analysis result
  ip_address        INET,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('audit_log', 'created_at');
```

### `sampling_recommendations`
AI-generated next-sampling-location suggestions.

```sql
CREATE TABLE sampling_recommendations (
  rec_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           UUID NOT NULL REFERENCES sites(site_id),
  recommended_lat   DECIMAL(10, 7) NOT NULL,
  recommended_lon   DECIMAL(10, 7) NOT NULL,
  description       TEXT,
  priority          VARCHAR(10) NOT NULL,     -- LOW | MEDIUM | HIGH | CRITICAL
  reasons           TEXT[],
  is_actioned       BOOLEAN DEFAULT FALSE,
  expires_at        TIMESTAMPTZ,
  generated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rec_site ON sampling_recommendations(site_id);
```

---

## 13. Entity Relationship Summary

```
users ──────────────────────┐
  │                         │
  ├── samples ──────────────┼── sites
  │     │                   │     │
  │     ├── sample_qc       │     ├── biodiversity_timeseries
  │     ├── taxonomy_results│     ├── site_benchmarks
  │     │     └── xai       │     ├── biodiversity_predictions
  │     ├── biodiversity     │     ├── alerts
  │     │     └── health     │     └── sampling_recommendations
  │     ├── environmental    │
  │     ├── alerts           │
  │     └── beta_diversity   │
  │                          │
  ├── reports ───────────────┘
  └── assistant_sessions
        └── assistant_messages

species_reference (global lookup table)
audit_log (append-only, time-partitioned)
```

---

## 14. Migration Strategy

```bash
# Initial setup
alembic init alembic
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head

# Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;  -- for geo queries

# Seed reference data
python scripts/seed_species_reference.py   # from BOLD + IUCN JSON
python scripts/seed_sites.py               # known sampling sites
python scripts/seed_benchmarks.py          # state/national averages
```

---

*Schema v1.0 | SIH25042 — BioScan AI | Team Antigravity*
