import { Router } from 'express';
import { z } from 'zod';
import { requestRegistration, resendOtp, verifyOtp } from '../services/registrationService.js';

const router = Router();

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  phone: z.string().min(6).max(30).optional(),
});

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

router.post('/request', async (req, res) => {
  try {
    const payload = requestSchema.parse(req.body);
    const result = await requestRegistration(payload);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return res.status(400).json({ ok: false, error: message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const payload = verifySchema.parse(req.body);
    const result = await verifyOtp(payload.email, payload.otp);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid validation';
    return res.status(400).json({ ok: false, error: message });
  }
});

router.post('/resend', async (req, res) => {
  try {
    const payload = z.object({ email: z.string().email() }).parse(req.body);
    const result = await resendOtp(payload.email);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return res.status(400).json({ ok: false, error: message });
  }
});

export default router;
