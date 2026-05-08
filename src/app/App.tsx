import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { EmptyScene } from '@/scenes/EmptyScene';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { AttributionFooter } from '@/components/ui/AttributionFooter';
import { CreditsModal } from '@/components/ui/CreditsModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ViewModeIndicator } from '@/components/ui/ViewModeIndicator';
import { SpeedControl } from '@/components/ui/SpeedControl';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { HomeButton } from '@/components/hud/HomeButton';
import { Logo } from '@/components/hud/Logo';
import { LanguageSelector } from '@/components/hud/LanguageSelector';
import { LevelDropdown } from '@/components/hud/LevelDropdown';
import { DatePicker } from '@/components/hud/DatePicker';
import { CreditsButton } from '@/components/hud/CreditsButton';

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
  const { t: tSolar } = useTranslation('solar');
  const legacyFlag = useAppStore((s) => s.legacyFlag) || readLegacyFlag();
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);
  const toggleRotationAxes = useAppStore((s) => s.toggleRotationAxes);
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0b14] text-white">
      {/* Capa 3D — ocupa toda la pantalla, z-0 */}
      <div className="absolute inset-0 z-0">
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

      {/* HUD — pointer-events-none base, z-10 */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Top-left: Logo + HomeButton */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <Logo />
          <HomeButton />
        </div>

        {/* Top-center: SpeedControl — z-40, pointer-events-auto */}
        <div className="pointer-events-auto absolute left-1/2 top-4 z-40 -translate-x-1/2">
          <SpeedControl />
        </div>

        {/* Top-right: columna vertical (LanguageSelector → LevelDropdown → DatePicker) — z-40 */}
        <div className="pointer-events-none absolute right-4 top-4 z-40 flex flex-col items-end gap-2">
          <LanguageSelector />
          <LevelDropdown />
          <DatePicker />
        </div>

        {/* Indicador de modo de visualización (solo visible en modo local) */}
        <div className="pointer-events-auto absolute bottom-20 right-4">
          <ViewModeIndicator />
        </div>

        {/* Bottom-right: toggle de ejes axiales + CreditsButton — z-40 */}
        <div className="pointer-events-auto absolute bottom-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRotationAxes}
            aria-label={showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
            title={showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
            className={`rounded border px-2 py-1 text-xs backdrop-blur transition-colors ${
              showRotationAxes
                ? 'border-cyan-400 bg-cyan-900/60 text-cyan-300'
                : 'border-white/20 bg-black/40 text-white hover:border-white/40'
            }`}
          >
            {showRotationAxes ? tSolar('hud.hideAxes') : tSolar('hud.showAxes')}
          </button>
          <CreditsButton onOpen={() => setCreditsOpen(true)} />
        </div>
      </div>

      {/* Panel de información del planeta seleccionado — z-50 */}
      <InfoPanel />

      {/* Footer de atribución permanente — z-20 */}
      <AttributionFooter />

      {/* Modal de créditos — z-60, controlado por estado App */}
      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </div>
  );
}
