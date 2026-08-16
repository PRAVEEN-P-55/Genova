import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

export function getAllAlerts(req: Request, res: Response) {
  const { site_id, severity, is_acknowledged, is_resolved } = req.query;

  let query = `
    SELECT a.*, s.name as site_name, sm.location_name
    FROM alerts a
    LEFT JOIN sites s ON a.site_id = s.site_id
    LEFT JOIN samples sm ON a.sample_id = sm.sample_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (site_id) {
    query += ' AND a.site_id = ?';
    params.push(site_id);
  }
  if (severity) {
    query += ' AND a.severity = ?';
    params.push(severity);
  }
  if (is_acknowledged !== undefined) {
    query += ' AND a.is_acknowledged = ?';
    params.push(Number(is_acknowledged));
  }
  if (is_resolved !== undefined) {
    query += ' AND a.is_resolved = ?';
    params.push(Number(is_resolved));
  }

  query += ' ORDER BY a.created_at DESC';

  const alerts = db.prepare(query).all(...params) as any[];

  // Parse recommended actions JSON
  alerts.forEach(a => {
    if (a.recommended_actions) {
      try {
        a.recommended_actions = JSON.parse(a.recommended_actions);
      } catch (_) {}
    }
  });

  return res.json({ success: true, count: alerts.length, alerts });
}

export function acknowledgeAlert(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userName = req.user?.name || 'Authorized Officer';

  db.prepare(`
    UPDATE alerts
    SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = datetime('now')
    WHERE alert_id = ?
  `).run(userName, id);

  const updated = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(id);
  return res.json({ success: true, message: 'Alert acknowledged', alert: updated });
}

export function resolveAlert(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userName = req.user?.name || 'Authorized Officer';

  db.prepare(`
    UPDATE alerts
    SET is_resolved = 1, resolved_by = ?, resolved_at = datetime('now')
    WHERE alert_id = ?
  `).run(userName, id);

  const updated = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(id);
  return res.json({ success: true, message: 'Alert marked as resolved', alert: updated });
}
