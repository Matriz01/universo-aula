/**
 * ViewModeIndicator — HUD que muestra el modo de visualización actual.
 *
 * - En modo global: nada visible (o texto mínimo).
 * - En modo local: muestra "Vista local: {nombre}" + botón "Salir" + toggle de eventos conocidos.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, useViewMode, useShowKnownEvents } from '@/store/useAppStore';

export const ViewModeIndicator = React.memo(function ViewModeIndicator() {
  const { t } = useTranslation('solar');
  const viewMode = useViewMode();
  const showKnownEvents = useShowKnownEvents();
  const goToBody = useAppStore((s) => s.goToBody);
  const setShowKnownEvents = useAppStore((s) => s.setShowKnownEvents);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);

  if (viewMode !== 'local') return null;

  const planetName = selectedPlanet ? t(`solar:${selectedPlanet}.name`, selectedPlanet) : '';

  const label = t('solar:view_mode.local', {
    name: planetName,
    defaultValue: `Vista local: ${planetName}`,
  });

  return (
    <div className="pointer-events-none">
      <div
        data-testid="view-mode-indicator"
        className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-white/20 bg-black/50 px-3 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          <button
            type="button"
            data-testid="exit-local-mode"
            onClick={() => goToBody(null)}
            className="rounded border border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20 transition-colors"
            aria-label={t('solar:view_mode.exit', 'Salir')}
          >
            {t('solar:view_mode.exit', 'Salir')}
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            data-testid="known-events-toggle"
            checked={showKnownEvents}
            onChange={(e) => setShowKnownEvents(e.target.checked)}
            className="rounded"
          />
          {t('solar:view_mode.known_events_toggle', 'Mostrar eventos conocidos')}
        </label>
      </div>
    </div>
  );
});

ViewModeIndicator.displayName = 'ViewModeIndicator';
