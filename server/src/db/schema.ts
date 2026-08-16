export const schemaSql = `
-- GENOVA eDNA Biodiversity Intelligence Platform
-- SQLite Database Schema

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'researcher', -- researcher, authority, lab_technician, admin, public
  organization TEXT,
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  ecosystem_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  elevation_m REAL,
  description TEXT,
  baseline_health_score REAL DEFAULT 75.0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samples (
  sample_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  site_id TEXT REFERENCES sites(site_id),
  location_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  collection_date TEXT NOT NULL,
  collected_by TEXT,
  collection_method TEXT,
  water_temp_c REAL,
  ph REAL,
  dissolved_oxygen REAL,
  salinity_ppt REAL,
  turbidity_ntu REAL,
  notes TEXT,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_path TEXT,
  file_md5 TEXT,
  sequencing_platform TEXT,
  barcode_markers TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  current_stage TEXT,
  progress_pct INTEGER DEFAULT 100,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_metrics (
  qc_id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  total_reads INTEGER NOT NULL,
  q20_percentage REAL NOT NULL,
  q30_percentage REAL NOT NULL,
  mean_quality_score REAL NOT NULL,
  gc_content_pct REAL NOT NULL,
  sequence_length_mean REAL NOT NULL,
  adapter_contamination_pct REAL NOT NULL,
  chimeric_reads_pct REAL NOT NULL,
  human_contamination_pct REAL NOT NULL,
  overall_verdict TEXT NOT NULL, -- PASS, WARN, FAIL
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS taxonomy_classifications (
  classification_id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  kingdom TEXT NOT NULL,
  phylum TEXT NOT NULL,
  class_name TEXT NOT NULL,
  order_name TEXT NOT NULL,
  family TEXT NOT NULL,
  genus TEXT NOT NULL,
  species TEXT NOT NULL,
  relative_abundance REAL NOT NULL,
  read_count INTEGER NOT NULL,
  confidence_score REAL NOT NULL,
  kmer_score REAL NOT NULL,
  dnabert_score REAL NOT NULL,
  blast_score REAL NOT NULL,
  iucn_status TEXT,
  wpa_schedule TEXT,
  is_invasive INTEGER DEFAULT 0,
  native_region TEXT,
  impact_level TEXT,
  xai_attention_weights TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS biodiversity_indices (
  index_id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(site_id),
  shannon_index REAL NOT NULL,
  simpson_index REAL NOT NULL,
  chao1_richness REAL NOT NULL,
  pielou_evenness REAL NOT NULL,
  species_richness INTEGER NOT NULL,
  ecosystem_health_score REAL NOT NULL,
  health_grade TEXT NOT NULL,
  regional_shannon_benchmark REAL NOT NULL,
  regional_simpson_benchmark REAL NOT NULL,
  regional_chao1_benchmark REAL NOT NULL,
  regional_health_benchmark REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id TEXT PRIMARY KEY,
  sample_id TEXT REFERENCES samples(sample_id),
  site_id TEXT REFERENCES sites(site_id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  species_name TEXT,
  recommended_actions TEXT,
  is_acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  is_resolved INTEGER DEFAULT 0,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timeseries_metrics (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(site_id),
  record_date TEXT NOT NULL,
  health_score REAL NOT NULL,
  shannon_index REAL NOT NULL,
  species_count INTEGER NOT NULL,
  water_temp_c REAL,
  dissolved_oxygen REAL,
  ph REAL,
  turbidity_ntu REAL
);

CREATE TABLE IF NOT EXISTS predictions (
  prediction_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(site_id),
  forecast_horizon_months INTEGER DEFAULT 12,
  model_type TEXT DEFAULT 'LSTM-Bidirectional',
  model_r2 REAL DEFAULT 0.887,
  model_rmse REAL DEFAULT 2.14,
  forecast_series TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  report_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  site_id TEXT REFERENCES sites(site_id),
  sample_id TEXT REFERENCES samples(sample_id),
  generated_by TEXT NOT NULL,
  file_format TEXT DEFAULT 'PDF',
  file_size_kb INTEGER DEFAULT 240,
  hash_checksum TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  message_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  citations TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  kb_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL
);
`;
