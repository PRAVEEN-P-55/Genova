import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import { db } from '../db/database.js';

export interface AuthRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    role: string;
    name: string;
    organization?: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { user_id: string; email: string; role: string; name: string };
    const user = db.prepare('SELECT user_id, name, email, role, organization FROM users WHERE user_id = ? AND is_active = 1').get(decoded.user_id) as any;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid', details: err.message });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      const user = db.prepare('SELECT user_id, name, email, role, organization FROM users WHERE user_id = ? AND is_active = 1').get(decoded.user_id) as any;
      if (user) req.user = user;
    } catch (_) {}
  }
  next();
}
