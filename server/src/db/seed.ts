import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';

export function seedDatabase() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    console.log('[Seed] Database already contains data. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with initial Genova datasets...');

  const passwordHash = bcrypt.hashSync('Genova2025!', 10);

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (user_id, name, email, password_hash, role, organization, is_active, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `);

  insertUser.run('usr-res-01', 'Dr. Priya Sharma', 'researcher@genova.ai', passwordHash, 'researcher', 'Wildlife Institute of India (WII)');
  insertUser.run('usr-auth-01', 'Rajesh Verma, IFS', 'authority@genova.ai', passwordHash, 'authority', 'National Biodiversity Authority (NBA)');
  insertUser.run('usr-tech-01', 'Ananya Sen', 'tech@genova.ai', passwordHash, 'lab_technician', 'Centre for Cellular & Molecular Biology (CCMB)');
  insertUser.run('usr-adm-01', 'Admin Officer', 'admin@genova.ai', passwordHash, 'admin', 'Ministry of Environment, Forest & CC');
  insertUser.run('usr-pub-01', 'Citizen Observer', 'public@genova.ai', passwordHash, 'public', 'Independent Conservationist');

  // 2. Sites
  const insertSite = db.prepare(`
    INSERT INTO sites (site_id, name, state, district, ecosystem_type, latitude, longitude, elevation_m, description, baseline_health_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSite.run('site-sundarbans', 'Sundarbans Mangrove Core Zone', 'West Bengal', 'South 24 Parganas', 'mangrove', 21.9497, 88.8996, 4.2, 'Tidal mangrove delta and UNESCO World Heritage site with high estuarine biodiversity.', 82.5);
  insertSite.run('site-western-ghats', 'Silent Valley National Park Core', 'Kerala', 'Palakkad', 'terrestrial_forest', 11.0827, 76.4428, 920.0, 'Tropical evergreen rainforest biodiversity hotspot with endangered endemic species.', 89.4);
  insertSite.run('site-chilika', 'Chilika Lake Brackish Lagoon', 'Odisha', 'Puri', 'coastal', 19.7180, 85.3210, 1.5, 'Largest coastal lagoon in India and Ramsar wetland home to endangered Irrawaddy dolphins.', 78.0);
  insertSite.run('site-kaziranga', 'Kaziranga Brahmaputra River Basin', 'Assam', 'Golaghat', 'freshwater_river', 26.6594, 93.3533, 76.0, 'Dynamic alluvial floodplain supporting aquatic megafauna and wetland ecosystems.', 84.1);
  insertSite.run('site-ganga', 'Ganga River Dolphin Sanctuary', 'Uttar Pradesh', 'Varanasi', 'freshwater_river', 25.3176, 83.0061, 80.0, 'Sacred river stretch monitoring indicator freshwater species and anthropogenic runoff impacts.', 68.2);

  // 3. Samples
  const insertSample = db.prepare(`
    INSERT INTO samples (
      sample_id, user_id, site_id, location_name, latitude, longitude, collection_date,
      collected_by, collection_method, water_temp_c, ph, dissolved_oxygen, salinity_ppt, turbidity_ntu,
      notes, file_name, file_format, file_size_bytes, file_path, sequencing_platform, barcode_markers,
      status, current_stage, progress_pct, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSample.run(
    'EDNA-IND-00142', 'usr-res-01', 'site-sundarbans', 'Sundarbans Estuary Transect A-4',
    21.9497, 88.8996, '2025-02-14', 'Dr. Priya Sharma', 'water_filtration',
    24.6, 7.8, 6.8, 18.4, 14.2, 'Post-monsoon seasonal eDNA survey across main creek.',
    'SUNDARBANS_E142_L001_R1.fastq.gz', 'FASTQ', 48920114, '/uploads/samples/SUNDARBANS_E142_L001_R1.fastq.gz',
    'Illumina MiSeq (2x300bp)', '12S,16S,COI', 'completed', 'Finalized', 100,
    '2025-02-14 09:30:00', '2025-02-14 10:15:22'
  );

  insertSample.run(
    'EDNA-IND-00143', 'usr-res-01', 'site-western-ghats', 'Silent Valley Stream S-12',
    11.0827, 76.4428, '2025-02-12', 'R. K. Menon', 'water_filtration',
    19.2, 6.9, 8.4, 0.1, 3.2, 'Pristine mountain stream upstream of buffer zone.',
    'WESTERN_GHATS_S143_R1.fastq.gz', 'FASTQ', 38102940, '/uploads/samples/WESTERN_GHATS_S143_R1.fastq.gz',
    'Oxford Nanopore MinION', '16S,COI', 'completed', 'Finalized', 100,
    '2025-02-12 11:00:00', '2025-02-12 11:42:10'
  );

  insertSample.run(
    'EDNA-IND-00144', 'usr-tech-01', 'site-chilika', 'Chilika Outer Channel Zone',
    19.7180, 85.3210, '2025-02-10', 'Ananya Sen', 'sediment',
    23.1, 8.1, 7.1, 14.8, 18.6, 'Sediment core sample for benthic biodiversity & invasive bivalve detection.',
    'CHILIKA_OC_144_R1.fastq.gz', 'FASTQ', 56291000, '/uploads/samples/CHILIKA_OC_144_R1.fastq.gz',
    'Illumina NovaSeq 6000', '18S,COI', 'completed', 'Finalized', 100,
    '2025-02-10 14:15:00', '2025-02-10 15:05:40'
  );

  insertSample.run(
    'EDNA-IND-00145', 'usr-res-01', 'site-ganga', 'Varanasi Assi Ghat Upstream',
    25.3176, 83.0061, '2025-02-08', 'Dr. S. K. Tripathi', 'water_filtration',
    21.4, 8.3, 5.4, 0.4, 28.5, 'Urban discharge impact survey examining riverine bio-indicators.',
    'GANGA_VAR_145_R1.fastq.gz', 'FASTQ', 42100980, '/uploads/samples/GANGA_VAR_145_R1.fastq.gz',
    'Illumina MiSeq', '12S,COI', 'completed', 'Finalized', 100,
    '2025-02-08 08:45:00', '2025-02-08 09:35:10'
  );

  // 4. QC Metrics
  const insertQC = db.prepare(`
    INSERT INTO qc_metrics (
      qc_id, sample_id, total_reads, q20_percentage, q30_percentage, mean_quality_score,
      gc_content_pct, sequence_length_mean, adapter_contamination_pct, chimeric_reads_pct,
      human_contamination_pct, overall_verdict
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertQC.run('qc-00142', 'EDNA-IND-00142', 1245890, 98.4, 94.2, 36.8, 48.6, 292.4, 0.4, 1.2, 0.08, 'PASS');
  insertQC.run('qc-00143', 'EDNA-IND-00143', 980450, 97.8, 93.1, 35.9, 46.2, 410.8, 0.6, 1.8, 0.04, 'PASS');
  insertQC.run('qc-00144', 'EDNA-IND-00144', 1640200, 98.9, 95.6, 37.4, 51.2, 285.0, 0.2, 0.9, 0.12, 'PASS');
  insertQC.run('qc-00145', 'EDNA-IND-00145', 1120000, 96.5, 91.8, 34.7, 49.8, 280.2, 1.2, 2.4, 0.35, 'WARN');

  // 5. Taxonomy Classifications for EDNA-IND-00142
  const insertTaxonomy = db.prepare(`
    INSERT INTO taxonomy_classifications (
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

  insertTaxonomy.run(
    'tax-01', 'EDNA-IND-00142', 'Platanista gangetica', 'Ganges River Dolphin',
    'Animalia', 'Chordata', 'Mammalia', 'Artiodactyla', 'Platanistidae', 'Platanista', 'P. gangetica',
    0.048, 59800, 0.978, 0.965, 0.982, 0.990, 'EN', 'Schedule I', 0, 'Ganges-Brahmaputra Basin', 'Positive Bioindicator', mockAttentions
  );

  insertTaxonomy.run(
    'tax-02', 'EDNA-IND-00142', 'Panthera tigris tigris', 'Bengal Tiger',
    'Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Felidae', 'Panthera', 'P. tigris',
    0.012, 14950, 0.962, 0.945, 0.970, 0.975, 'EN', 'Schedule I', 0, 'Indian Subcontinent', 'Apex Predator', mockAttentions
  );

  insertTaxonomy.run(
    'tax-03', 'EDNA-IND-00142', 'Orcaella brevirostris', 'Irrawaddy Dolphin',
    'Animalia', 'Chordata', 'Mammalia', 'Artiodactyla', 'Delphinidae', 'Orcaella', 'O. brevirostris',
    0.034, 42360, 0.954, 0.940, 0.961, 0.962, 'EN', 'Schedule I', 0, 'Coastal South Asia', 'Estuarine Indicator', mockAttentions
  );

  insertTaxonomy.run(
    'tax-04', 'EDNA-IND-00142', 'Eichhornia crassipes', 'Water Hyacinth',
    'Plantae', 'Tracheophyta', 'Liliopsida', 'Commelinales', 'Pontederiaceae', 'Eichhornia', 'E. crassipes',
    0.162, 201800, 0.986, 0.980, 0.991, 0.990, 'LC', null, 1, 'South America', 'High Threat to Estuaries', mockAttentions
  );

  insertTaxonomy.run(
    'tax-05', 'EDNA-IND-00142', 'Oreochromis niloticus', 'Nile Tilapia',
    'Animalia', 'Chordata', 'Actinopterygii', 'Cichliformes', 'Cichlidae', 'Oreochromis', 'O. niloticus',
    0.098, 122100, 0.944, 0.932, 0.950, 0.952, 'LC', null, 1, 'Africa', 'Displaces Native Fishes', mockAttentions
  );

  insertTaxonomy.run(
    'tax-06', 'EDNA-IND-00142', 'Tenualosa ilisha', 'Hilsa Shad',
    'Animalia', 'Chordata', 'Actinopterygii', 'Clupeiformes', 'Clupeidae', 'Tenualosa', 'T. ilisha',
    0.185, 230490, 0.989, 0.982, 0.992, 0.995, 'LC', 'Schedule II', 0, 'Bay of Bengal Rivers', 'Keystone Anadromous Fish', mockAttentions
  );

  insertTaxonomy.run(
    'tax-07', 'EDNA-IND-00142', 'Rhizophora mucronata', 'Asiatic Mangrove',
    'Plantae', 'Tracheophyta', 'Magnoliopsida', 'Malpighiales', 'Rhizophoraceae', 'Rhizophora', 'R. mucronata',
    0.245, 305200, 0.994, 0.990, 0.996, 0.998, 'LC', 'Schedule IV', 0, 'Indo-Pacific Mangroves', 'Coastal Shield Flora', mockAttentions
  );

  insertTaxonomy.run(
    'tax-08', 'EDNA-IND-00142', 'Avicennia marina', 'Grey Mangrove',
    'Plantae', 'Tracheophyta', 'Magnoliopsida', 'Lamiales', 'Acanthaceae', 'Avicennia', 'A. marina',
    0.216, 269100, 0.991, 0.988, 0.993, 0.994, 'LC', 'Schedule IV', 0, 'Tropical Coastal Mangrove', 'Carbon Sink Plant', mockAttentions
  );

  // 6. Biodiversity Indices
  const insertIndices = db.prepare(`
    INSERT INTO biodiversity_indices (
      index_id, sample_id, site_id, shannon_index, simpson_index, chao1_richness,
      pielou_evenness, species_richness, ecosystem_health_score, health_grade,
      regional_shannon_benchmark, regional_simpson_benchmark, regional_chao1_benchmark, regional_health_benchmark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertIndices.run(
    'idx-00142', 'EDNA-IND-00142', 'site-sundarbans', 3.84, 0.94, 142.5, 0.84, 128,
    84.5, 'A - Stable & Diverse', 3.45, 0.88, 120.0, 78.0
  );
  insertIndices.run(
    'idx-00143', 'EDNA-IND-00143', 'site-western-ghats', 4.18, 0.96, 178.0, 0.89, 164,
    91.2, 'A+ - Pristine', 3.90, 0.92, 150.0, 86.0
  );
  insertIndices.run(
    'idx-00144', 'EDNA-IND-00144', 'site-chilika', 3.62, 0.91, 126.0, 0.80, 112,
    77.8, 'B+ - Good', 3.50, 0.89, 115.0, 75.0
  );
  insertIndices.run(
    'idx-00145', 'EDNA-IND-00145', 'site-ganga', 2.94, 0.81, 88.0, 0.72, 76,
    64.2, 'C+ - Vulnerable', 3.20, 0.85, 105.0, 72.0
  );

  // 7. Alerts
  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      alert_id, sample_id, site_id, alert_type, severity, title, description,
      species_name, recommended_actions, is_acknowledged, acknowledged_by, acknowledged_at,
      is_resolved, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlert.run(
    'alt-001', 'EDNA-IND-00142', 'site-sundarbans', 'invasive_species', 'critical',
    'Rapid Expansion of Invasive Eichhornia crassipes',
    'Water hyacinth relative sequence abundance surged from 4.2% to 16.2% across tidal creek channels, posing hypoxia risks.',
    'Eichhornia crassipes',
    JSON.stringify([
      'Deploy mechanical removal teams at Matla river estuary confluence',
      'Increase dissolved oxygen sensor monitoring frequency',
      'Notify West Bengal Forest & Estuarine Wildlife Division'
    ]),
    0, null, null, 0, '2025-02-14 10:18:00'
  );

  insertAlert.run(
    'alt-002', 'EDNA-IND-00142', 'site-sundarbans', 'conservation_priority', 'high',
    'Positive eDNA Detection of Endangered Platanista gangetica',
    'Significant read count (59,800 reads, 97.8% confidence) confirms presence of Ganges river dolphin in lower estuarine belt.',
    'Platanista gangetica',
    JSON.stringify([
      'Enforce zero motorized fishing trawler zone in sector B',
      'Log GPS coordinates to National Wildlife Database',
      'Schedule follow-up acoustic validation survey'
    ]),
    1, 'Rajesh Verma, IFS', '2025-02-14 11:20:00', 0, '2025-02-14 10:20:00'
  );

  insertAlert.run(
    'alt-003', 'EDNA-IND-00142', 'site-sundarbans', 'invasive_species', 'medium',
    'Incipient Population of Nile Tilapia (Oreochromis niloticus)',
    'Detected 9.8% relative abundance of invasive African cichlid in brackish tidal zone.',
    'Oreochromis niloticus',
    JSON.stringify([
      'Commission selective netting survey with local fisheries department',
      'Monitor potential competition with native juvenile Hilsa shad'
    ]),
    0, null, null, 0, '2025-02-14 10:22:00'
  );

  // 8. Timeseries Metrics
  const insertTimeseries = db.prepare(`
    INSERT INTO timeseries_metrics (id, site_id, record_date, health_score, shannon_index, species_count, water_temp_c, dissolved_oxygen, ph, turbidity_ntu)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const months = ['2024-03', '2024-05', '2024-07', '2024-09', '2024-11', '2025-01', '2025-02'];
  const scores = [88.2, 86.4, 82.1, 80.5, 83.9, 85.1, 84.5];
  const shannons = [4.12, 3.98, 3.75, 3.68, 3.82, 3.90, 3.84];
  const counts = [156, 148, 134, 129, 138, 144, 128];

  months.forEach((m, idx) => {
    insertTimeseries.run(
      `ts-${idx + 1}`, 'site-sundarbans', `${m}-15`, scores[idx], shannons[idx], counts[idx],
      24.0 + (idx % 3), 6.8 + (idx % 2) * 0.4, 7.8, 14.0 + idx
    );
  });

  // 9. Predictions
  const insertPrediction = db.prepare(`
    INSERT INTO predictions (prediction_id, site_id, forecast_horizon_months, model_type, model_r2, model_rmse, forecast_series)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const forecastData = [
    { month: 'Mar 25', baseline: 84.5, predicted: 84.2, upper: 86.8, lower: 81.6, alertThreshold: 70 },
    { month: 'Apr 25', baseline: 84.5, predicted: 83.6, upper: 86.5, lower: 80.7, alertThreshold: 70 },
    { month: 'May 25', baseline: 84.5, predicted: 82.1, upper: 85.4, lower: 78.8, alertThreshold: 70 },
    { month: 'Jun 25', baseline: 84.5, predicted: 80.4, upper: 84.1, lower: 76.7, alertThreshold: 70 },
    { month: 'Jul 25', baseline: 84.5, predicted: 78.9, upper: 82.8, lower: 75.0, alertThreshold: 70 },
    { month: 'Aug 25', baseline: 84.5, predicted: 77.2, upper: 81.5, lower: 72.9, alertThreshold: 70 },
    { month: 'Sep 25', baseline: 84.5, predicted: 79.1, upper: 83.7, lower: 74.5, alertThreshold: 70 },
    { month: 'Oct 25', baseline: 84.5, predicted: 81.5, upper: 86.0, lower: 77.0, alertThreshold: 70 },
    { month: 'Nov 25', baseline: 84.5, predicted: 83.0, upper: 87.8, lower: 78.2, alertThreshold: 70 },
    { month: 'Dec 25', baseline: 84.5, predicted: 84.8, upper: 89.9, lower: 79.7, alertThreshold: 70 },
    { month: 'Jan 26', baseline: 84.5, predicted: 85.6, upper: 91.2, lower: 80.0, alertThreshold: 70 },
    { month: 'Feb 26', baseline: 84.5, predicted: 85.2, upper: 91.0, lower: 79.4, alertThreshold: 70 }
  ];

  insertPrediction.run('pred-sundarbans', 'site-sundarbans', 12, 'LSTM-Bidirectional (PyTorch)', 0.887, 2.14, JSON.stringify(forecastData));

  // 10. Reports
  const insertReport = db.prepare(`
    INSERT INTO reports (report_id, title, report_type, site_id, sample_id, generated_by, file_format, file_size_kb, hash_checksum, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReport.run(
    'REP-2025-001', 'Sundarbans Biosphere eDNA Survey & WPA Schedule I Audit', 'WPA_COMPLIANCE',
    'site-sundarbans', 'EDNA-IND-00142', 'Dr. Priya Sharma', 'PDF', 312,
    'a7f8e91d04b931e285dcb9876a4321fe',
    JSON.stringify({ compliance_status: 'Compliant', schedule1_species_detected: 3, invasive_threats: 2 }),
    '2025-02-14 11:30:00'
  );

  insertReport.run(
    'REP-2025-002', 'National Biodiversity Strategy (NBSAP) Target 4 Estuarine Assessment', 'NBSAP_ALIGNMENT',
    'site-sundarbans', 'EDNA-IND-00142', 'Rajesh Verma, IFS', 'PDF', 428,
    'f3c4d5e6a7b8c9d0123456789abcdef0',
    JSON.stringify({ target_aligned: 'Target 4 (Invasive Control) & Target 6 (Species Recovery)', confidence_interval: '95%' }),
    '2025-02-14 12:15:00'
  );

  // 11. Knowledge Base (for RAG citations)
  const insertKB = db.prepare(`
    INSERT INTO knowledge_base (kb_id, category, topic, content, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertKB.run(
    'kb-01', 'biodiversity_health', 'Ecosystem Health Score Formulation',
    'The Genova Ecosystem Health Score is a composite index computed as: HealthScore = 0.35 * Shannon_Normalized + 0.25 * Chao1_Normalized + 0.20 * Evenness + 0.20 * (1 - Invasive_Proportion). Scale ranges from 0 to 100.',
    'Genova Core Methodology v1.4 (WII & NBA)'
  );

  insertKB.run(
    'kb-02', 'regulations', 'Wildlife Protection Act (1972, Amendment 2022)',
    'Schedule I species including Platanista gangetica (Ganges River dolphin) and Panthera tigris tigris enjoy absolute legal protection. Detection via eDNA mandates priority alerting and buffer zone protocol initiation within 24 hours.',
    'Ministry of Environment, Forest and Climate Change Gazette 2022'
  );

  insertKB.run(
    'kb-03', 'invasive_management', 'Eichhornia crassipes Control Protocol',
    'Water hyacinth rapid spread in tidal estuaries can cause sharp nocturnal dissolved oxygen depletion below 4.0 mg/L, triggering fish kills. Recommended interventions include biological control with Neochetina weevils combined with physical containment booms.',
    'National Wetland Conservation Guidelines'
  );

  console.log('[Seed] Genova database successfully seeded with all initial data!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}
