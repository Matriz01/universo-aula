/**
 * LevelSelector — selector de nivel pedagógico en el HUD.
 *
 * Tres botones (Explorador / Aprendiz / Investigador).
 * Lee `level` de useAppStore y llama `setLevel` al hacer click.
 * Texto desde t('solar:ui.level_selector.{level}').
 * Contraste WCAG AA garantizado.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { PedagogicalLevel } from '@/types/index';

const LEVELS: PedagogicalLevel[] = ['explorador', 'aprendiz', 'investigador'];

export const LevelSelector = React.memo(function LevelSelector() {
  const { t } = useTranslation('solar');
  const level = useAppStore((s) => s.level);
  const setLevel = useAppStore((s) => s.setLevel);

  return (
    <div className="pointer-events-none">
      <div
        data-testid="level-selector"
        role="group"
        aria-label={t('solar:ui.level_selector.label', 'Nivel pedagógico')}
        className="pointer-events-auto flex gap-1 rounded-lg border border-white/20 bg-black/40 p-1 backdrop-blur"
      >
        {LEVELS.map((lvl) => {
          const isActive = level === lvl;
          return (
            <button
              key={lvl}
              type="button"
              data-testid={`level-button-${lvl}`}
              aria-pressed={isActive}
              aria-label={t(`solar:ui.level_selector.${lvl}`)}
              onClick={() => setLevel(lvl)}
              className={[
                'rounded px-3 py-1 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-black'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {t(`solar:ui.level_selector.${lvl}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
});

LevelSelector.displayName = 'LevelSelector';
