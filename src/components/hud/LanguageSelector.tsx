/**
 * LanguageSelector — selector nativo de idioma para el HUD.
 *
 * Usa <select> nativo para máxima compatibilidad con SMART boards,
 * tablets, Android TV y accesibilidad del SO.
 * A11y: aria-label en castellano peninsular (per spec REQ-LANG-1).
 * pointer-events-auto: elemento interactivo sobre el canvas.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

/**
 * Selector de idioma (Español / English).
 * Lee el locale del store; onChange actualiza store + i18n.
 */
export const LanguageSelector = React.memo(function LanguageSelector() {
  const { i18n, t } = useTranslation('solar');
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    setLocale(lang);
    void i18n.changeLanguage(lang);
  }

  return (
    <div className="pointer-events-auto">
      {/* Label visualmente oculta para accesibilidad */}
      <label htmlFor="language-selector" className="sr-only">
        {t('solar:hud.language', 'Idioma')}
      </label>
      <select
        id="language-selector"
        aria-label={t('solar:hud.language', 'Idioma')}
        value={locale}
        onChange={handleChange}
        className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur focus:outline-none focus:ring-1 focus:ring-white/40"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
