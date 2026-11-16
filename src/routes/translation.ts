import { Router } from 'express';
import { z } from 'zod';
import { translateKey, translateText, type TranslationLanguage } from '../services/translationService.js';

const router = Router();

const requestSchema = z.object({
  text: z.string(),
  targetLang: z.enum(['mg', 'fr', 'en']).default('mg'),
});

const keySchema = z.object({
  key: z.string(),
  targetLang: z.enum(['mg', 'fr', 'en']).default('mg'),
});

router.post('/translate', async (req, res) => {
  try {
    const payload = requestSchema.parse(req.body);
    const output = await translateText(payload.text, payload.targetLang as TranslationLanguage);
    return res.status(200).json({ ok: true, data: { translatedText: output, targetLang: payload.targetLang } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Translation failed';
    return res.status(400).json({ ok: false, error: message });
  }
});

router.post('/key', async (req, res) => {
  try {
    const payload = keySchema.parse(req.body);
    const output = await translateKey(payload.key, payload.targetLang as TranslationLanguage);
    return res.status(200).json({ ok: true, data: { value: output, targetLang: payload.targetLang } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Translation failed';
    return res.status(400).json({ ok: false, error: message });
  }
});

export default router;
