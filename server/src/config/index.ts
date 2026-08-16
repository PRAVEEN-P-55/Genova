import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '8000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'genova-super-secret-key-sih25042',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || path.resolve(process.cwd(), 'genova.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  CORS_ORIGINS: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
};
