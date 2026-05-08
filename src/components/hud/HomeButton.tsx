/**
 * HomeButton — botón HUD para centrar la cámara en el Sol (vista global panorámica).
 *
 * Solo visible cuando viewMode === 'global'.
 * Al hacer clic, incrementa cameraHomeRequested en el store → GlobalCameraControls
 * lo detecta y ejecuta el tween de reset (camera-controls.setLookAt con transición).
 *
 * Atajo de teclado equivalente: H (manejado directamente en GlobalCameraControls).
 *
 * Accesibilidad:
 * - role="button" + aria-label en castellano
 * - pointer-events-auto (el wrapper HUD tiene pointer-events-none)
 */

import { useAppStore } from '@/store/useAppStore';

export function HomeButton() {
  const viewMode = useAppStore((s) => s.viewMode);
  const requestCameraHome = useAppStore((s) => s.requestCameraHome);

  // Solo visible en modo global
  if (viewMode !== 'global') return null;

  return (
    <button
      type="button"
      onClick={requestCameraHome}
      aria-label="Centrar en Sol"
      title="Centrar en Sol (tecla H)"
      className="pointer-events-auto rounded border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
    >
      Centrar en Sol
    </button>
  );
}

HomeButton.displayName = 'HomeButton';
