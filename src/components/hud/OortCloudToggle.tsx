/**
 * OortCloudToggle — HUD widget for toggling the Oort cloud layer.
 *
 * Visible only when viewMode === 'global' (ADR-005).
 * Returns null in local mode — the toggle is a global-only feature.
 *
 * Styled to match the known-events toggle in ViewModeIndicator for visual
 * symmetry (ADR-005). Uses i18n keys under solar namespace:
 *   - label:   hud.toggleOortCloud
 *   - tooltip: hud.toggleOortCloudTooltip
 *
 * data-testid="oort-cloud-toggle" for e2e and unit test locators.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

export function OortCloudToggle(): React.JSX.Element | null {
  const { t } = useTranslation('solar');
  const viewMode = useAppStore((s) => s.viewMode);
  const showOortCloud = useAppStore((s) => s.showOortCloud);
  const setShowOortCloud = useAppStore((s) => s.setShowOortCloud);

  // Only visible in global mode (ADR-005)
  if (viewMode !== 'global') return null;

  return (
    <div className="pointer-events-none">
      <div className="pointer-events-auto rounded-lg border border-white/20 bg-black/50 px-3 py-2 backdrop-blur">
        <label
          className="flex cursor-pointer items-center gap-2 text-xs text-white/80"
          title={t(
            'hud.toggleOortCloudTooltip',
            'Show the cometary cloud surrounding the solar system',
          )}
        >
          <input
            type="checkbox"
            data-testid="oort-cloud-toggle"
            checked={showOortCloud}
            onChange={() => setShowOortCloud(!showOortCloud)}
            className="rounded"
          />
          {t('hud.toggleOortCloud', 'Oort Cloud')}
        </label>
      </div>
    </div>
  );
}

OortCloudToggle.displayName = 'OortCloudToggle';
