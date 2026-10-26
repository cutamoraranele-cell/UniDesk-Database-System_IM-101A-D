import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEngineDiagnostics } from './config/db.js';

import lookupRoutes from './routes/lookup.routes.js';
import facilitiesRoutes from './routes/facilities.routes.js';
import officesRoutes from './routes/offices.routes.js';
import reservationsRoutes from './routes/reservations.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');
const distIndex = path.join(distPath, 'index.html');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Database Engine Health & Diagnostic Check
app.get('/api/health', async (req, res) => {
  try {
    const diag = await getEngineDiagnostics();
    res.json({
      status: 'ONLINE',
      system: 'UniDesk Database Engine API',
      diagnostics: diag
    });
  } catch (err) {
    res.status(500).json({
      status: 'DEGRADED',
      error: err.message
    });
  }
});

// Serve frontend static build files if available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Route all non-API GET requests to the Frontend App (SPA) or helpful portal
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>UniDesk Database System | Portal</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #141b2d; padding: 2.5rem; border-radius: 16px; border: 1px solid #1e293b; max-width: 540px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin: 0 0 0.5rem; font-size: 1.8rem; }
        p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.8rem 1.6rem; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 1rem; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .links { margin-top: 1.5rem; font-size: 0.85rem; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">● UNIDESK ENGINE ONLINE</div>
        <h1>UniDesk Campus Operations</h1>
        <p>You have accessed the backend REST API server on <strong>port 5000</strong>.</p>
        <p>The interactive frontend web interface is running on <strong>http://localhost:5173</strong>.</p>
        <a href="http://localhost:5173" class="btn">Launch UniDesk Frontend Interface &rarr;</a>
        <div class="links">
          Health: <a href="/api/health" style="color:#38bdf8">/api/health</a> &bull; Offices: <a href="/api/offices" style="color:#38bdf8">/api/offices</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Database Server Error',
    sqlState: err.sqlState || undefined,
    code: err.code || undefined
  });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`================================================================`);
  console.log(` UNIDESK API SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`================================================================`);
  try {
    const diag = await getEngineDiagnostics();
    console.log(`[DB CONNECTED] User: ${diag.currentUser} | Role: ${diag.currentRole}`);
    console.log(`[DB STATUS] Tables: ${diag.tableCount} | Triggers: ${diag.triggerCount} | Routines: ${diag.routineCount}`);
    console.log(`[DB LATENCY] ${diag.latencyMs}ms ping`);
  } catch (e) {
    console.error(`[DB ERROR] Could not verify database connection:`, e.message);
  }
});
