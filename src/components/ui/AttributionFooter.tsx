/**
 * AttributionFooter — footer permanente de atribución.
 *
 * Siempre visible (fixed bottom), no ocultable.
 * Texto desde t('solar:ui.attribution').
 * Estilo sutil, semi-transparente, contraste accesible WCAG AA.
 * NO interfiere con la interacción 3D (pointer-events solo en el footer).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export const AttributionFooter = React.memo(function AttributionFooter() {
  const { t } = useTranslation('solar');

  return (
    <footer
      data-testid="attribution-footer"
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 bg-black/50 px-4 py-1.5 text-xs text-white/60 backdrop-blur-sm"
      style={{ pointerEvents: 'none' }}
    >
      <span style={{ pointerEvents: 'auto' }}>{t('solar:ui.attribution')}</span>
      <a
        href="https://www.solarsystemscope.com/textures/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Solar System Scope"
        className="text-white/70 underline-offset-2 hover:text-white hover:underline"
        style={{ pointerEvents: 'auto' }}
      >
        Solar System Scope
      </a>
      <span className="text-white/30" aria-hidden="true">
        ·
      </span>
      <a
        href="/CREDITS.md"
        className="text-white/70 underline-offset-2 hover:text-white hover:underline"
        style={{ pointerEvents: 'auto' }}
      >
        Créditos completos
      </a>
      <span className="text-white/30" aria-hidden="true">
        ·
      </span>
      <a
        href="/LICENSE"
        className="text-white/70 underline-offset-2 hover:text-white hover:underline"
        style={{ pointerEvents: 'auto' }}
      >
        Licencia
      </a>
    </footer>
  );
});

AttributionFooter.displayName = 'AttributionFooter';
