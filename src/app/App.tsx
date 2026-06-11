import { lazy, Suspense, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { EmptyScene } from '@/scenes/EmptyScene';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { AttributionFooter } from '@/components/ui/AttributionFooter';
import { CreditsModal } from '@/components/ui/CreditsModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ViewModeIndicator } from '@/components/ui/ViewModeIndicator';
import { CreditsButton } from '@/components/hud/CreditsButton';
import { OortCloudToggle } from '@/components/hud/OortCloudToggle';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { CockpitFrame } from '@/components/cockpit/CockpitFrame';
import { TopBar } from '@/components/cockpit/TopBar';

// Lazy import de SolarSystemScene — Three.js sólo se carga cuando se necesita
const SolarSystemScene = lazy(() =>
  import('@/scenes/SolarSystemScene').then((m) => ({ default: m.SolarSystemScene })),
);

/** Lee el query param ?legacy=1 de la URL para el fallback de emergencia */
function readLegacyFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('legacy') === '1';
  } catch {
    return false;
  }
}

export function App() {
  const legacyFlag = useAppStore((s) => s.legacyFlag) || readLegacyFlag();
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <>
      <CockpitFrame topBar={<TopBar />}>
        {/* Escena 3D — ocupa toda la celda canvas */}
        <div className="absolute inset-0">
          {legacyFlag ? (
            <EmptyScene />
          ) : (
            <ErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <SolarSystemScene />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        {/* OverlayLayer transitorio (ADR-D8) — anclado a la celda canvas, NO al viewport.
            Los widgets pendientes de migrar (PR2) viven aquí.
            pointer-events-none en la capa; cada widget restaura pointer-events-auto. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Panel de información del planeta seleccionado
              InfoPanel usa absolute (ya no fixed) → anclado a esta celda */}
          <InfoPanel />

          {/* Indicador de modo de visualización (solo visible en modo local) */}
          <div className="pointer-events-auto absolute bottom-20 right-4">
            <ViewModeIndicator />
          </div>

          {/* Toggle Nube de Oort (solo visible en modo global, ADR-005) */}
          <div className="pointer-events-auto absolute bottom-32 right-4">
            <OortCloudToggle />
          </div>

          {/* Bottom-right: CreditsButton */}
          <div className="pointer-events-auto absolute bottom-4 right-4 z-40">
            <CreditsButton onOpen={() => setCreditsOpen(true)} />
          </div>
        </div>
      </CockpitFrame>

      {/* Footer de atribución permanente — z-20
          Permanece fuera del grid en PR1 (viewport-bottom == celda-bottom sin status-bar).
          Migra a StatusBar en PR2. */}
      <AttributionFooter />

      {/* Modal de créditos — z-60, controlado por estado App.
          Overlay legítimo: queda fuera del grid. */}
      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  );
}
