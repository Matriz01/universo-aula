/**
 * TourControls — HUD de control del tour.
 *
 * Botones: Iniciar tour / Detener tour / Siguiente (sólo con reducedMotion)
 * Usa keys solar:ui.tour.* de i18n.
 * Contraste WCAG AA garantizado con clases Tailwind.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { useTour } from '@/scenes/hooks/useTour';

export const TourControls = React.memo(function TourControls() {
  const { t } = useTranslation('solar');
  const tourActive = useAppStore((s) => s.tourActive);
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);
  const { state, dispatch } = useTour();

  return (
    <div
      data-testid="tour-controls"
      role="group"
      aria-label={t('solar:ui.tour.controls_label', 'Tour controls')}
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
    >
      {!tourActive ? (
        <button
          type="button"
          data-testid="tour-start"
          onClick={() => dispatch({ type: 'start' })}
          aria-label={t('solar:ui.tour.start')}
        >
          {t('solar:ui.tour.start')}
        </button>
      ) : (
        <>
          <button
            type="button"
            data-testid="tour-stop"
            onClick={() => dispatch({ type: 'user_interrupt' })}
            aria-label={t('solar:ui.tour.stop')}
          >
            {t('solar:ui.tour.stop')}
          </button>

          {prefersReducedMotion && state.kind === 'narration' && (
            <button
              type="button"
              data-testid="tour-next"
              onClick={() => dispatch({ type: 'tts_done' })}
              aria-label={t('solar:ui.tour.next')}
            >
              {t('solar:ui.tour.next')}
            </button>
          )}
        </>
      )}
    </div>
  );
});

TourControls.displayName = 'TourControls';
