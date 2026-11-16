import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth:
        env.smtp.user && env.smtp.pass
          ? {
              user: env.smtp.user,
              pass: env.smtp.pass,
            }
          : undefined,
    })
  : null;

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`[MAIL DEV MODE] To: ${to}`);
    console.log(`[MAIL DEV MODE] Subject: ${subject}`);
    console.log(`[MAIL DEV MODE] Body: ${text}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  });
}
