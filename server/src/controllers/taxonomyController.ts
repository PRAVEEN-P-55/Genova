import { Request, Response } from 'express';
import { db } from '../db/database.js';

export function getSampleTaxonomy(req: Request, res: Response) {
  const { sampleId } = req.params;
  const { kingdom, iucn_status, is_invasive } = req.query;

  let query = 'SELECT * FROM taxonomy_classifications WHERE sample_id = ?';
  const params: any[] = [sampleId];

  if (kingdom) {
    query += ' AND kingdom = ?';
    params.push(kingdom);
  }
  if (iucn_status) {
    query += ' AND iucn_status = ?';
    params.push(iucn_status);
  }
  if (is_invasive !== undefined) {
    query += ' AND is_invasive = ?';
    params.push(Number(is_invasive));
  }

  query += ' ORDER BY relative_abundance DESC';

  const results = db.prepare(query).all(...params);
  return res.json({ success: true, count: results.length, classifications: results });
}

export function getSpeciesDetail(req: Request, res: Response) {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM taxonomy_classifications WHERE classification_id = ?').get(id) as any;

  if (!item) {
    return res.status(404).json({ success: false, error: 'Taxonomy classification not found' });
  }

  if (item.xai_attention_weights) {
    try {
      item.xai_attention_weights = JSON.parse(item.xai_attention_weights);
    } catch (_) {}
  }

  return res.json({ success: true, species: item });
}
