import express from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import registrationsRouter from './routes/registrations.js';
import adminRouter from './routes/admin.js';
import translationRouter from './routes/translation.js';
import { pool, initDatabase } from './config/db.js';
import { env } from './config/env.js';

export const app = express();

const ensureDatabaseReady: RequestHandler = (_req, res, next) => {
  if (!env.databaseUrl) {
    return res.status(503).json({ ok: false, error: 'DATABASE_URL is not configured.' });
  }

  void initDatabase().then(() => next()).catch((error: unknown) => {
    console.error('Failed to initialize registration database:', error);
    res.status(503).json({ ok: false, error: 'Registration database is unavailable.' });
  });
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'registration-api',
    status: 'online',
    routes: [
      '/health',
      '/api/registrations/request',
      '/api/registrations/verify',
      '/api/registrations/resend',
      '/api/admin/registrations/review',
      '/api/translation/translate',
    ],
  });
});

app.get('/health', async (_req, res) => {
  const missingConfiguration = [
    !env.databaseUrl && 'DATABASE_URL',
    !env.smtp.host && 'SMTP_HOST',
  ].filter((value): value is string => Boolean(value));

  if (missingConfiguration.length > 0) {
    return res.status(503).json({
      ok: false,
      service: 'registration-api',
      status: 'misconfigured',
      missingConfiguration,
    });
  }

  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true, service: 'registration-api', status: 'healthy' });
  } catch (error) {
    console.error('Registration API health check failed:', error);
    return res.status(503).json({
      ok: false,
      service: 'registration-api',
      status: 'unavailable',
      error: 'Registration database is unavailable.',
    });
  }
});

app.use('/api/registrations', ensureDatabaseReady, registrationsRouter);
app.use('/api/admin/registrations', ensureDatabaseReady, adminRouter);
app.use('/api/translation', translationRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found.' });
});
