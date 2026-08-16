import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { apiRouter } from './routes/index.js';

const app = express();

// Initialize DB and Seed data if empty
initDatabase();
seedDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Genova eDNA Biodiversity Intelligence Platform API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🧬 GENOVA API SERVER RUNNING ON PORT ${CONFIG.PORT}`);
  console.log(`📡 Endpoints available at: http://localhost:${CONFIG.PORT}/api`);
  console.log(`==================================================\n`);
});

export default app;
