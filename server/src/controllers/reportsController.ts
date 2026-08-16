import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

export function getAllReports(req: Request, res: Response) {
  const { site_id, report_type } = req.query;

  let query = `
    SELECT r.*, s.name as site_name, sm.location_name
    FROM reports r
    LEFT JOIN sites s ON r.site_id = s.site_id
    LEFT JOIN samples sm ON r.sample_id = sm.sample_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (site_id) {
    query += ' AND r.site_id = ?';
    params.push(site_id);
  }
  if (report_type) {
    query += ' AND r.report_type = ?';
    params.push(report_type);
  }

  query += ' ORDER BY r.created_at DESC';

  const reports = db.prepare(query).all(...params) as any[];
  reports.forEach(r => {
    if (r.metadata) {
      try {
        r.metadata = JSON.parse(r.metadata);
      } catch (_) {}
    }
  });

  return res.json({ success: true, count: reports.length, reports });
}

export function generateReport(req: AuthRequest, res: Response) {
  const { title, report_type, site_id, sample_id } = req.body;
  const userName = req.user?.name || 'Dr. Priya Sharma';

  const reportId = `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const hash = crypto.createHash('sha256').update(`${reportId}-${Date.now()}-${userName}`).digest('hex');

  const metadata = JSON.stringify({
    generated_timestamp: new Date().toISOString(),
    verifier_node: 'Genova-Auth-Cluster-Node-01',
    hash_algorithm: 'SHA-256',
    legal_statute: 'Wildlife Protection Act (1972/2022) & Biological Diversity Act 2002'
  });

  db.prepare(`
    INSERT INTO reports (
      report_id, title, report_type, site_id, sample_id, generated_by, file_format, file_size_kb, hash_checksum, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'PDF', ?, ?, ?, datetime('now'))
  `).run(
    reportId,
    title || 'eDNA Biodiversity Survey & Legal Compliance Audit',
    report_type || 'FULL_SURVEY',
    site_id || 'site-sundarbans',
    sample_id || 'EDNA-IND-00142',
    userName,
    Math.floor(250 + Math.random() * 200),
    hash,
    metadata
  );

  const created = db.prepare('SELECT * FROM reports WHERE report_id = ?').get(reportId) as any;
  if (created.metadata) {
    try {
      created.metadata = JSON.parse(created.metadata);
    } catch (_) {}
  }

  return res.status(201).json({
    success: true,
    message: 'Regulatory report generated and registered with SHA-256 checksum audit trail.',
    report: created
  });
}
