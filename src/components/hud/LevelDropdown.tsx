/**
 * LevelDropdown — selector nativo de nivel pedagógico para el HUD.
 *
 * Reemplaza el LevelSelector (3 botones) por un <select> nativo que encaja
 * en la columna vertical top-right sin ocupar ancho horizontal excesivo.
 * A11y: aria-label en castellano peninsular (per spec REQ-LEVEL-1).
 * pointer-events-auto: elemento interactivo sobre el canvas.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { PedagogicalLevel } from '@/types/index';

const LEVELS: Array<{ value: PedagogicalLevel; labelKey: string }> = [
  { value: 'explorador', labelKey: 'solar:hud.levelExplorador' },
  { value: 'aprendiz', labelKey: 'solar:hud.levelAprendiz' },
  { value: 'investigador', labelKey: 'solar:hud.levelInvestigador' },
];

/**
 * Selector de nivel pedagógico (Explorador / Aprendiz / Investigador).
 * Lee el nivel del store; onChange actualiza el store.
 */
export const LevelDropdown = React.memo(function LevelDropdown() {
  const { t } = useTranslation('solar');
  const level = useAppStore((s) => s.level);
  const setLevel = useAppStore((s) => s.setLevel);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLevel(e.target.value as PedagogicalLevel);
  }

  return (
    <div className="pointer-events-auto">
      <label htmlFor="level-dropdown" className="sr-only">
        {t('solar:hud.level', 'Nivel pedagógico')}
      </label>
      <select
        id="level-dropdown"
        aria-label={t('solar:hud.level', 'Nivel pedagógico')}
        value={level}
        onChange={handleChange}
        className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur focus:outline-none focus:ring-1 focus:ring-white/40"
      >
        {LEVELS.map(({ value, labelKey }) => (
          <option key={value} value={value}>
            {t(labelKey, value)}
          </option>
        ))}
      </select>
    </div>
  );
});

LevelDropdown.displayName = 'LevelDropdown';
