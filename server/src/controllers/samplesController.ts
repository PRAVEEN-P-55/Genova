import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { startPipelineWorker, getJobStatus } from '../services/pipelineService.js';

export function getAllSamples(req: Request, res: Response) {
  const { site_id, status, limit = 50 } = req.query;

  let query = `
    SELECT s.*, st.name as site_name, q.overall_verdict as qc_verdict, q.q30_percentage,
           b.ecosystem_health_score, b.health_grade
    FROM samples s
    LEFT JOIN sites st ON s.site_id = st.site_id
    LEFT JOIN qc_metrics q ON s.sample_id = q.sample_id
    LEFT JOIN biodiversity_indices b ON s.sample_id = b.sample_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (site_id) {
    query += ' AND s.site_id = ?';
    params.push(site_id);
  }
  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.created_at DESC LIMIT ?';
  params.push(Number(limit));

  const samples = db.prepare(query).all(...params);
  return res.json({ success: true, samples });
}

export function getSampleById(req: Request, res: Response) {
  const { id } = req.params;

  const sample = db.prepare(`
    SELECT s.*, st.name as site_name, st.ecosystem_type
    FROM samples s
    LEFT JOIN sites st ON s.site_id = st.site_id
    WHERE s.sample_id = ?
  `).get(id) as any;

  if (!sample) {
    return res.status(404).json({ success: false, error: 'Sample not found' });
  }

  const qc = db.prepare('SELECT * FROM qc_metrics WHERE sample_id = ?').get(id);
  const biodiversity = db.prepare('SELECT * FROM biodiversity_indices WHERE sample_id = ?').get(id);
  const taxonomy = db.prepare(`
    SELECT * FROM taxonomy_classifications WHERE sample_id = ? ORDER BY relative_abundance DESC
  `).all(id);
  const alerts = db.prepare('SELECT * FROM alerts WHERE sample_id = ?').all(id);

  return res.json({
    success: true,
    sample,
    qc,
    biodiversity,
    taxonomy,
    alerts
  });
}

export function uploadSample(req: AuthRequest, res: Response) {
  const {
    location_name,
    site_id,
    latitude,
    longitude,
    collection_date,
    collected_by,
    collection_method,
    water_temp_c,
    ph,
    dissolved_oxygen,
    salinity_ppt,
    turbidity_ntu,
    notes,
    sequencing_platform,
    barcode_markers,
    file_name,
    file_format
  } = req.body;

  const sampleNumber = Math.floor(100 + Math.random() * 900);
  const sampleId = `EDNA-IND-00${sampleNumber}`;
  const userId = req.user?.user_id || 'usr-res-01';

  const insertSample = db.prepare(`
    INSERT INTO samples (
      sample_id, user_id, site_id, location_name, latitude, longitude, collection_date,
      collected_by, collection_method, water_temp_c, ph, dissolved_oxygen, salinity_ppt, turbidity_ntu,
      notes, file_name, file_format, file_size_bytes, file_path, sequencing_platform, barcode_markers,
      status, current_stage, progress_pct, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 'Queued for processing', 0, datetime('now'))
  `);

  insertSample.run(
    sampleId,
    userId,
    site_id || 'site-sundarbans',
    location_name || 'Transect Field Point',
    parseFloat(latitude) || 21.9497,
    parseFloat(longitude) || 88.8996,
    collection_date || new Date().toISOString().split('T')[0],
    collected_by || req.user?.name || 'Dr. Priya Sharma',
    collection_method || 'water_filtration',
    parseFloat(water_temp_c) || 24.5,
    parseFloat(ph) || 7.8,
    parseFloat(dissolved_oxygen) || 6.8,
    parseFloat(salinity_ppt) || 18.0,
    parseFloat(turbidity_ntu) || 14.0,
    notes || 'Freshly submitted sample run.',
    file_name || (req.file ? req.file.originalname : 'SAMPLE_R1.fastq.gz'),
    file_format || 'FASTQ',
    req.file ? req.file.size : 45000000,
    req.file ? req.file.path : '/uploads/SAMPLE_R1.fastq.gz',
    sequencing_platform || 'Illumina MiSeq (2x300bp)',
    barcode_markers || '12S,16S,COI'
  );

  // Trigger async bioinformatic pipeline
  startPipelineWorker(sampleId);

  return res.status(201).json({
    success: true,
    message: 'Sample successfully registered and queued for pipeline analysis.',
    sample_id: sampleId,
    status: 'queued',
    pipeline_tracking_url: `/api/samples/${sampleId}/status`
  });
}

export function getSampleStatus(req: Request, res: Response) {
  const { id } = req.params;
  const status = getJobStatus(id);
  if (!status) {
    return res.status(404).json({ success: false, error: 'Sample not found' });
  }
  return res.json({ success: true, ...status });
}
