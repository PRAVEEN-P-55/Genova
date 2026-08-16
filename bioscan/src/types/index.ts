// ============================================
// GENOVA — TYPE DEFINITIONS
// ============================================

export type UserRole = 'researcher' | 'authority' | 'lab_technician' | 'admin' | 'public'

export interface User {
  user_id: string
  name: string
  email: string
  role: UserRole
  organization?: string
}

export type SampleStatus =
  | 'queued' | 'validating' | 'qc' | 'preprocessing'
  | 'classifying' | 'computing' | 'finalizing' | 'completed' | 'failed' | 'processing'

export type HealthClassification = 'HEALTHY' | 'MODERATE' | 'DEGRADED' | 'CRITICAL'
export type ColorZone = 'green' | 'yellow' | 'orange' | 'red'
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertType = 'INVASIVE_SPECIES' | 'CONSERVATION' | 'ANOMALY' | 'BIODIVERSITY_DECLINE'
export type IUCNStatus = 'Least Concern' | 'Near Threatened' | 'Vulnerable' | 'Endangered' | 'Critically Endangered'
export type WPASchedule = 'Schedule I' | 'Schedule II' | 'Schedule IV' | null
export type TrendDirection = 'INCREASE' | 'STABLE' | 'DECLINE'

export interface Site {
  site_id: string
  name: string
  state: string
  district?: string
  ecosystem_type: string
  lat: number
  lon: number
  latest_health_score: number
  health_classification: HealthClassification
  latest_sample_date: string
  total_samples: number
  active_alerts: number
  species_detected: number
}

export interface Sample {
  sample_id: string
  status: SampleStatus
  location_name: string
  site_id?: string
  lat: number
  lon: number
  collection_date: string
  water_temp_c?: number
  ph?: number
  dissolved_oxygen?: number
  qc_summary?: {
    phred_q30_rate: number
    read_depth: number
    reliability_score: number
    status: 'PASS' | 'WARN' | 'FAIL'
  }
  analysis_summary?: {
    total_sequences: number
    taxa_detected: number
    unclassified: number
    alerts: number
    ecosystem_health_score: number
    shannon_index: number
  }
  created_at: string
  completed_at?: string
  progress_pct?: number
  current_stage?: string
}

export interface TaxonomyResult {
  result_id: string
  sequence_id: string
  classification_status: 'CLASSIFIED' | 'UNCLASSIFIED' | 'PARTIAL' | 'NOVEL_CANDIDATE'
  taxonomy?: {
    kingdom: string
    phylum: string
    class: string
    order: string
    family: string
    genus: string
    species: string
    common_name: string
  }
  confidence: number
  ensemble?: {
    kmer_model: number
    dnabert_model: number
    blast_identity: number
    agreement: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  barcode_marker?: string
  reference_db?: string
  conservation_status?: IUCNStatus
  wpa_schedule?: WPASchedule
  is_invasive?: boolean
  nearest_match?: { taxon: string; similarity: number }
  read_count?: number
  relative_abundance?: number
}

export interface XAIData {
  sequence_id: string
  predicted_species: string
  confidence: number
  evidence: {
    kmer_score: number
    dnabert_cosine: number
    blast_identity: number
    blast_evalue: string
    blast_reference_accession: string
  }
  attention_weights: {
    high_importance_regions: Array<{
      start: number; end: number; label: string; weight: number
    }>
  }
  alternative_matches: Array<{
    species: string; confidence: number; distinguishing_feature: string
  }>
}

export interface BiodiversityMetrics {
  sample_id: string
  site: string
  collection_date: string
  alpha_diversity: {
    species_richness: number
    shannon_index: number
    simpson_index: number
    chao1_richness_estimate: number
    pielou_evenness: number
  }
  ecosystem_health: {
    score: number
    classification: HealthClassification
    color_zone: ColorZone
    components: Record<string, { weight: number; raw_score: number; weighted: number }>
    confidence: number
    methodology_version: string
  }
  benchmark: {
    state_average: { health_score: number; species_richness: number }
    national_average: { health_score: number; species_richness: number }
    comparison: string
  }
  taxonomic_breakdown: {
    fish: number; plant: number; microbial: number; fungal: number
    amphibian: number; other: number; unclassified: number
  }
  conservation_breakdown: { LC: number; NT: number; VU: number; EN: number; CR: number }
}

export interface Alert {
  alert_id: string
  sample_id: string
  site_id?: string
  site_name?: string
  alert_type: AlertType
  severity: AlertSeverity
  species_name?: string
  common_name?: string
  confidence: number
  iucn_status?: IUCNStatus
  wpa_schedule?: WPASchedule
  invasive_risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
  sites_affected?: string[]
  recommended_actions: string[]
  regulatory_reference?: string
  disclaimer: string
  is_acknowledged: boolean
  created_at: string
  lat?: number
  lon?: number
}

export interface Prediction {
  site_id: string
  site_name: string
  current_index: number
  forecast: {
    baseline: {
      six_months: { mean: number; lower_ci: number; upper_ci: number }
      twelve_months: { mean: number; lower_ci: number; upper_ci: number }
    }
    trend_direction: TrendDirection
    significance: string
    model: string
    inputs_used: string[]
    training_period: string
    disclaimer: string
  }
  scenarios: Array<{
    name: string
    description: string
    twelve_month_forecast: { mean: number; lower_ci: number; upper_ci: number }
    color: string
  }>
  history: Array<{ month: string; value: number }>
}

export interface AssistantMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ type?: string; id?: string; date?: string; title?: string; sample_id?: string; confidence?: number }>
  citations?: Array<{ title: string; reference?: string; sample_id?: string; confidence?: number; type?: string }>
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  created_at: string
}

export interface PipelineStage {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  duration_seconds?: number
}
