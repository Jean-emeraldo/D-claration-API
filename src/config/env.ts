import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:4000',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 10),
  approvalTtlMinutes: Number(process.env.APPROVAL_TTL_MINUTES ?? 30),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'Registration API <noreply@example.com>',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
  },
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

if (!Number.isInteger(env.otpTtlMinutes) || env.otpTtlMinutes < 1 || env.otpTtlMinutes > 60) {
  throw new Error('OTP_TTL_MINUTES must be an integer between 1 and 60.');
}

if (!Number.isInteger(env.approvalTtlMinutes) || env.approvalTtlMinutes < 1 || env.approvalTtlMinutes > 1440) {
  throw new Error('APPROVAL_TTL_MINUTES must be an integer between 1 and 1440.');
}
