import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { queryRAGAssistant } from '../services/ragService.js';

export function chatWithAssistant(req: AuthRequest, res: Response) {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Query message string is required' });
  }

  const userId = req.user?.user_id || 'usr-res-01';
  const response = queryRAGAssistant(message, userId);

  return res.json({
    success: true,
    message: response.answer,
    citations: response.citations
  });
}

export function getChatHistory(req: AuthRequest, res: Response) {
  const userId = req.user?.user_id || 'usr-res-01';

  const messages = db.prepare(`
    SELECT * FROM assistant_messages WHERE user_id = ? ORDER BY created_at ASC
  `).all(userId) as any[];

  messages.forEach(m => {
    if (m.citations) {
      try {
        m.citations = JSON.parse(m.citations);
      } catch (_) {}
    }
  });

  return res.json({ success: true, messages });
}
