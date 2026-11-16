import express from 'express';
import cors from 'cors';
import registrationsRouter from './routes/registrations.js';
import adminRouter from './routes/admin.js';
import translationRouter from './routes/translation.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'registration-api',
    status: 'healthy',
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

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'registration-api', status: 'healthy' });
});

app.use('/api/registrations', registrationsRouter);
app.use('/api/admin/registrations', adminRouter);
app.use('/api/translation', translationRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found.' });
});
