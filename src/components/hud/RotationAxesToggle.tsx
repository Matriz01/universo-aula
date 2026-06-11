/**
 * RotationAxesToggle — botón HUD para mostrar/ocultar los ejes de rotación axial.
 *
 * Extraído de App.tsx (líneas 74-86). Sin cambios de lógica ni estilo.
 * REQ-TOPBAR-1, REQ-AXIS-VIS-5
 */

import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

export function RotationAxesToggle(): React.JSX.Element {
  const { t: tSolar } = useTranslation('solar');
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);
  const toggleRotationAxes = useAppStore((s) => s.toggleRotationAxes);

  return (
    <button
      type="button"
      onClick={toggleRotationAxes}
      aria-label={showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
      title={showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
      className={`pointer-events-auto rounded border px-2 py-1 text-xs backdrop-blur transition-colors ${
        showRotationAxes
          ? 'border-cyan-400 bg-cyan-900/60 text-cyan-300'
          : 'border-white/20 bg-black/40 text-white hover:border-white/40'
      }`}
    >
      {showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
    </button>
  );
}

RotationAxesToggle.displayName = 'RotationAxesToggle';
