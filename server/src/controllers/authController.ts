import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { CONFIG } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';

export function login(req: Request, res: Response) {
  const { email, password, role } = req.body;

  let query = 'SELECT * FROM users WHERE is_active = 1';
  let params: any[] = [];

  if (email) {
    query += ' AND email = ?';
    params.push(email);
  } else if (role) {
    query += ' AND role = ?';
    params.push(role);
  } else {
    return res.status(400).json({ success: false, error: 'Email or role is required' });
  }

  const user = db.prepare(query).get(...params) as any;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials or user not found' });
  }

  if (password && !role) {
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    CONFIG.JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRES_IN as any }
  );

  return res.json({
    success: true,
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
    }
  });
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  return res.json({ success: true, user: req.user });
}

export function getDemoUsers(_req: Request, res: Response) {
  const users = db.prepare('SELECT user_id, name, email, role, organization FROM users WHERE is_active = 1').all();
  return res.json({ success: true, users });
}
