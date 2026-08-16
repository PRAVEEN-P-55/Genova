import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import { CONFIG } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}

export const db = new DatabaseSync(CONFIG.DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

import { schemaSql } from './schema.js';

export function initDatabase() {
  if (schemaSql) {
    db.exec(schemaSql);
    console.log('[DB] SQLite Schema initialized successfully at:', CONFIG.DB_PATH);
  }
}
