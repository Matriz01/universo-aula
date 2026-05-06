import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { EmptyScene } from '@/scenes/EmptyScene';
import { LevelSelector } from '@/components/ui/LevelSelector';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { AttributionFooter } from '@/components/ui/AttributionFooter';
import { CreditsModal } from '@/components/ui/CreditsModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ViewModeIndicator } from '@/components/ui/ViewModeIndicator';
import { ErrorBoundary } from '@/app/ErrorBoundary';

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
  const { t, i18n } = useTranslation('common');
  const setLocale = useAppStore((s) => s.setLocale);
  const legacyFlag = useAppStore((s) => s.legacyFlag) || readLegacyFlag();

  function handleLocaleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    setLocale(lang);
    void i18n.changeLanguage(lang);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0b14] text-white">
      {/* Capa 3D — ocupa toda la pantalla */}
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

      {/* HUD superpuesto */}
      <div className="relative z-10 flex flex-col items-start gap-2 p-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('appName')}</h1>
        <p className="text-sm text-gray-300">{t('tagline')}</p>

        {/* Selector de nivel pedagógico */}
        <LevelSelector />

        {/* Indicador de modo de visualización (solo visible en modo local) */}
        <ViewModeIndicator />

        {/* Fila inferior: selector de idioma + botón créditos */}
        <div className="flex items-center gap-2">
          <label htmlFor="locale-selector" className="sr-only">
            Idioma
          </label>
          <select
            id="locale-selector"
            value={i18n.language}
            onChange={handleLocaleChange}
            className="rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white backdrop-blur"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>

          <CreditsModal />
        </div>
      </div>

      {/* Panel de información del planeta seleccionado */}
      <InfoPanel />

      {/* Footer de atribución permanente */}
      <AttributionFooter />
    </div>
  );
}
