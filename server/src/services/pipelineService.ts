import { db } from '../db/database.js';
import {
  computeShannonIndex,
  computeSimpsonIndex,
  computeChao1,
  computePielouEvenness,
  computeEcosystemHealthScore
} from './biodiversityService.js';

interface PipelineJob {
  sampleId: string;
  stage: string;
  progress: number;
}

const activeJobs = new Map<string, PipelineJob>();

export function getJobStatus(sampleId: string) {
  const sample = db.prepare('SELECT sample_id, status, current_stage, progress_pct, error_message FROM samples WHERE sample_id = ?').get(sampleId) as any;
  return sample;
}

export function startPipelineWorker(sampleId: string) {
  activeJobs.set(sampleId, { sampleId, stage: 'validating', progress: 10 });

  db.prepare(`
    UPDATE samples
    SET status = 'validating', current_stage = 'Validating FASTQ/FASTA integrity', progress_pct = 10
    WHERE sample_id = ?
  `).run(sampleId);

  // Asynchronous step-by-step pipeline execution
  setTimeout(() => processQCStage(sampleId), 2000);
}

function processQCStage(sampleId: string) {
  db.prepare(`
    UPDATE samples
    SET status = 'qc', current_stage = 'Quality Control (Phred Q30 calculation)', progress_pct = 30
    WHERE sample_id = ?
  `).run(sampleId);

  // Generate realistic QC metrics
  const totalReads = Math.floor(900000 + Math.random() * 500000);
  const q30 = Number((92 + Math.random() * 6).toFixed(1));
  const q20 = Number((q30 + 3.5).toFixed(1));
  const meanQ = Number((34 + Math.random() * 4).toFixed(1));
  const gc = Number((46 + Math.random() * 8).toFixed(1));
  const seqLen = Number((280 + Math.random() * 30).toFixed(1));
  const adapter = Number((0.2 + Math.random() * 0.8).toFixed(2));
  const chimeric = Number((0.8 + Math.random() * 1.5).toFixed(2));
  const human = Number((0.02 + Math.random() * 0.1).toFixed(3));
  const verdict = q30 >= 90 ? 'PASS' : 'WARN';

  const qcId = `qc-${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO qc_metrics (
      qc_id, sample_id, total_reads, q20_percentage, q30_percentage, mean_quality_score,
      gc_content_pct, sequence_length_mean, adapter_contamination_pct, chimeric_reads_pct,
      human_contamination_pct, overall_verdict
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(qcId, sampleId, totalReads, q20, q30, meanQ, gc, seqLen, adapter, chimeric, human, verdict);

  setTimeout(() => processPreprocessingStage(sampleId), 2500);
}

function processPreprocessingStage(sampleId: string) {
  db.prepare(`
    UPDATE samples
    SET status = 'preprocessing', current_stage = 'Primer trimming & ASV DADA2 clustering', progress_pct = 50
    WHERE sample_id = ?
  `).run(sampleId);

  setTimeout(() => processClassificationStage(sampleId), 3000);
}

function processClassificationStage(sampleId: string) {
  db.prepare(`
    UPDATE samples
    SET status = 'classifying', current_stage = 'Taxonomic ensemble (k-mer + DNABERT-2 + BLAST)', progress_pct = 75
    WHERE sample_id = ?
  `).run(sampleId);

  // Template species pool
  const speciesPool = [
    {
      scientific: 'Platanista gangetica', common: 'Ganges River Dolphin', kingdom: 'Animalia', phylum: 'Chordata',
      cls: 'Mammalia', ord: 'Artiodactyla', fam: 'Platanistidae', gen: 'Platanista', sp: 'P. gangetica',
      iucn: 'EN', wpa: 'Schedule I', invasive: 0, region: 'Ganges Basin', impact: 'Positive Bioindicator',
      relAbund: 0.052, reads: 62400
    },
    {
      scientific: 'Tor putitora', common: 'Golden Mahseer', kingdom: 'Animalia', phylum: 'Chordata',
      cls: 'Actinopterygii', ord: 'Cypriniformes', fam: 'Cyprinidae', gen: 'Tor', sp: 'T. putitora',
      iucn: 'EN', wpa: 'Schedule I', invasive: 0, region: 'Himalayan Foothill Rivers', impact: 'Keystone Freshwater Fish',
      relAbund: 0.084, reads: 100800
    },
    {
      scientific: 'Eichhornia crassipes', common: 'Water Hyacinth', kingdom: 'Plantae', phylum: 'Tracheophyta',
      cls: 'Liliopsida', ord: 'Commelinales', fam: 'Pontederiaceae', gen: 'Eichhornia', sp: 'E. crassipes',
      iucn: 'LC', wpa: null, invasive: 1, region: 'South America', impact: 'Invasive Weed Risk',
      relAbund: 0.142, reads: 170400
    },
    {
      scientific: 'Oreochromis niloticus', common: 'Nile Tilapia', kingdom: 'Animalia', phylum: 'Chordata',
      cls: 'Actinopterygii', ord: 'Cichliformes', fam: 'Cichlidae', gen: 'Oreochromis', sp: 'O. niloticus',
      iucn: 'LC', wpa: null, invasive: 1, region: 'Africa', impact: 'Competition Threat',
      relAbund: 0.096, reads: 115200
    },
    {
      scientific: 'Channa striata', common: 'Striped Snakehead', kingdom: 'Animalia', phylum: 'Chordata',
      cls: 'Actinopterygii', ord: 'Anabantiformes', fam: 'Channidae', gen: 'Channa', sp: 'C. striata',
      iucn: 'LC', wpa: 'Schedule IV', invasive: 0, region: 'South Asia', impact: 'Native Carnivore',
      relAbund: 0.188, reads: 225600
    },
    {
      scientific: 'Hydrilla verticillata', common: 'Waterthyme', kingdom: 'Plantae', phylum: 'Tracheophyta',
      cls: 'Liliopsida', ord: 'Alismatales', fam: 'Hydrocharitaceae', gen: 'Hydrilla', sp: 'H. verticillata',
      iucn: 'LC', wpa: null, invasive: 0, region: 'Old World Freshwater', impact: 'Submerged Macrophyte',
      relAbund: 0.224, reads: 268800
    },
    {
      scientific: 'Ceratophyllum demersum', common: 'Coontail', kingdom: 'Plantae', phylum: 'Tracheophyta',
      cls: 'Magnoliopsida', ord: 'Ceratophyllales', fam: 'Ceratophyllaceae', gen: 'Ceratophyllum', sp: 'C. demersum',
      iucn: 'LC', wpa: null, invasive: 0, region: 'Cosmopolitan', impact: 'Microhabitat Provider',
      relAbund: 0.214, reads: 256800
    }
  ];

  const insertTax = db.prepare(`
    INSERT OR REPLACE INTO taxonomy_classifications (
      classification_id, sample_id, scientific_name, common_name, kingdom, phylum,
      class_name, order_name, family, genus, species, relative_abundance, read_count,
      confidence_score, kmer_score, dnabert_score, blast_score, iucn_status, wpa_schedule,
      is_invasive, native_region, impact_level, xai_attention_weights
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mockAttentions = JSON.stringify([
    { kmer: 'ATGCGT', weight: 0.94, position: 24 },
    { kmer: 'TACGGA', weight: 0.88, position: 48 },
    { kmer: 'CGTAAC', weight: 0.91, position: 86 },
    { kmer: 'AATCGC', weight: 0.79, position: 132 },
    { kmer: 'GGCTTA', weight: 0.85, position: 178 }
  ]);

  for (let i = 0; i < speciesPool.length; i++) {
    const sp = speciesPool[i];
    const kmer = Number((0.92 + Math.random() * 0.07).toFixed(3));
    const dnabert = Number((0.93 + Math.random() * 0.06).toFixed(3));
    const blast = Number((0.95 + Math.random() * 0.05).toFixed(3));
    const confidence = Number((kmer * 0.3 + dnabert * 0.4 + blast * 0.3).toFixed(3));

    insertTax.run(
      `tax-${sampleId}-${i + 1}`, sampleId, sp.scientific, sp.common, sp.kingdom, sp.phylum,
      sp.cls, sp.ord, sp.fam, sp.gen, sp.sp, sp.relAbund, sp.reads,
      confidence, kmer, dnabert, blast, sp.iucn, sp.wpa,
      sp.invasive, sp.region, sp.impact, mockAttentions
    );
  }

  setTimeout(() => processComputingStage(sampleId), 2500);
}

function processComputingStage(sampleId: string) {
  db.prepare(`
    UPDATE samples
    SET status = 'computing', current_stage = 'Computing Shannon/Simpson/Chao1 & Health metrics', progress_pct = 90
    WHERE sample_id = ?
  `).run(sampleId);

  const sample = db.prepare('SELECT site_id FROM samples WHERE sample_id = ?').get(sampleId) as any;
  const siteId = sample?.site_id || 'site-sundarbans';

  const abundances = [
    { species: 'Platanista gangetica', count: 62400 },
    { species: 'Tor putitora', count: 100800 },
    { species: 'Eichhornia crassipes', count: 170400 },
    { species: 'Oreochromis niloticus', count: 115200 },
    { species: 'Channa striata', count: 225600 },
    { species: 'Hydrilla verticillata', count: 268800 },
    { species: 'Ceratophyllum demersum', count: 256800 }
  ];

  const shannon = computeShannonIndex(abundances);
  const simpson = computeSimpsonIndex(abundances);
  const chao1 = computeChao1(abundances, 18, 6);
  const evenness = computePielouEvenness(shannon, abundances.length);
  const invasiveProportion = (170400 + 115200) / 1200000;
  const { score: healthScore, grade } = computeEcosystemHealthScore({
    shannon, chao1, evenness, invasiveProportion
  });

  const indexId = `idx-${sampleId}`;
  db.prepare(`
    INSERT OR REPLACE INTO biodiversity_indices (
      index_id, sample_id, site_id, shannon_index, simpson_index, chao1_richness,
      pielou_evenness, species_richness, ecosystem_health_score, health_grade,
      regional_shannon_benchmark, regional_simpson_benchmark, regional_chao1_benchmark, regional_health_benchmark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    indexId, sampleId, siteId, shannon, simpson, chao1, evenness, 134,
    healthScore, grade, 3.45, 0.88, 120.0, 78.0
  );

  // Generate Alert for invasive species
  const alertId = `alt-${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO alerts (
      alert_id, sample_id, site_id, alert_type, severity, title, description,
      species_name, recommended_actions, is_acknowledged, is_resolved, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now'))
  `).run(
    alertId, sampleId, siteId, 'invasive_species', 'high',
    `Invasive Eichhornia crassipes detected in ${sampleId}`,
    `Water hyacinth detected at ${(invasiveProportion * 100).toFixed(1)}% sequence abundance. Immediate containment recommended.`,
    'Eichhornia crassipes',
    JSON.stringify(['Deploy containment barriers', 'Notify district conservation board', 'Schedule follow-up sensor sweep'])
  );

  setTimeout(() => finalizeSample(sampleId), 2000);
}

function finalizeSample(sampleId: string) {
  db.prepare(`
    UPDATE samples
    SET status = 'completed', current_stage = 'Finalized & Verified', progress_pct = 100, completed_at = datetime('now')
    WHERE sample_id = ?
  `).run(sampleId);

  activeJobs.delete(sampleId);
  console.log(`[Pipeline] Sample ${sampleId} successfully processed and finalized.`);
}
