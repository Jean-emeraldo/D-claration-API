import { env } from '../config/env.js';

export type TranslationLanguage = 'mg' | 'fr' | 'en';

const baseCatalog: Record<string, Record<TranslationLanguage, string>> = {
  'registration.title': { mg: 'Fisoratana anarana', fr: 'Inscription', en: 'Registration' },
  'registration.email': { mg: 'Adiresy mailaka', fr: 'Adresse e-mail', en: 'Email address' },
  'registration.confirm': { mg: 'Hamafiso', fr: 'Confirmer', en: 'Confirm' },
  'registration.password': { mg: 'Tenimiafina', fr: 'Mot de passe', en: 'Password' },
  'settings.language': { mg: 'Fiteny', fr: 'Langue', en: 'Language' },
  'settings.logout': { mg: 'Hiala', fr: 'Déconnexion', en: 'Logout' },
};

export async function translateText(text: string, targetLang: TranslationLanguage): Promise<string> {
  const normalized = text.trim();
  if (!normalized) return '';

  const catalogEntry = Object.entries(baseCatalog).find(([key]) => key === normalized.toLowerCase().replace(/\s+/g, '.'));
  if (catalogEntry) {
    return catalogEntry[1][targetLang] ?? catalogEntry[1].mg;
  }

  if (env.appBaseUrl.includes('localhost') === false && process.env.TRANSLATION_API_URL) {
    try {
      const response = await fetch(process.env.TRANSLATION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: targetLang }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.translatedText === 'string') {
          return data.translatedText;
        }
      }
    } catch (error) {
      console.warn('AI translation fallback unavailable:', error);
    }
  }

  return text;
}

export async function translateKey(key: string, targetLang: TranslationLanguage): Promise<string> {
  const value = baseCatalog[key];
  if (value) {
    return value[targetLang] ?? value.mg;
  }

  return key;
}
