import { Router } from 'express';
import { z } from 'zod';
import { getRegistrationStatus, reviewRegistration } from '../services/registrationService.js';

const router = Router();

const reviewSchema = z.object({
  requestId: z.number().int().positive().optional(),
  email: z.string().email().optional(),
  decision: z.enum(['approve', 'reject']),
  adminNote: z.string().max(500).optional(),
}).refine((value) => Boolean(value.requestId || value.email), {
  message: 'requestId or email is required.',
  path: ['requestId'],
});

router.post('/review', async (req, res) => {
  try {
    const payload = reviewSchema.parse(req.body);
    const result = await reviewRegistration(payload);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Review failed';
    return res.status(400).json({ ok: false, error: message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid request id.' });
    }

    const result = await getRegistrationStatus(id);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request not found';
    return res.status(404).json({ ok: false, error: message });
  }
});

export default router;
