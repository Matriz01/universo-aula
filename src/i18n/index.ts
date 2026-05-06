import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

/**
 * Devuelve la cadena de fallback para un locale dado.
 *
 * Regla:
 * - Locale simple `xx`          → [xx]            (ej: 'en' → ['en'])
 * - Locale `xx-YY` o `xx-YY-zz` → [xx, es, en]   (ej: 'ca-ES-valencia' → ['ca','es','en'])
 *   Excepción: si xx === 'es', se omite el duplicado → ['es','en']
 *              si xx === 'en', no se añaden es/en extra → ['en']
 */
export function fallbackChain(locale: string): string[] {
  const parts = locale.split('-');
  const base = parts[0].toLowerCase();

  // Locale simple
  if (parts.length === 1) {
    return [base];
  }

  // Locale compuesto
  const chain: string[] = [base];
  if (base !== 'es') chain.push('es');
  if (base !== 'en') chain.push('en');
  return chain;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: (code: string) => {
      if (!code) return ['es', 'en'];
      return fallbackChain(code);
    },
    supportedLngs: ['es', 'en', 'ca'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      es: { common: esCommon },
      en: { common: enCommon },
    },
    defaultNS: 'common',
  });

export default i18n;
