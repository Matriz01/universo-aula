/**
 * <SpeedControl> — control HUD de velocidad de simulación con presets táctiles.
 *
 * Reemplaza el slider HTML5 por 6 botones de preset grandes (touch target ≥ 44px):
 *   [ Pausa ] [ 0.1× ] [ 0.5× ] [ 1× ] [ 2× ] [ 5× ]
 *
 * - Touch target mínimo 44px (Apple HIG / WCAG 2.5.5)
 * - aria-pressed y aria-label correctos en cada botón
 * - El botón "Pausa" pone simulationSpeed=0
 * - Cuando paused, muestra "▶ Reanudar" que pone speed=1
 * - Posicionado en HUD, semitransparente
 * - i18n: solar:simulation.speed_label | solar:simulation.preset.*
 */

import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const PRESETS = [0.1, 0.5, 1, 2, 5] as const;

type PresetKey = 'slow' | 'half' | 'normal' | 'fast' | 'turbo';

const PRESET_KEYS: PresetKey[] = ['slow', 'half', 'normal', 'fast', 'turbo'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPreset(value: number): string {
  return `${value}×`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SpeedControl() {
  const { t } = useTranslation('solar');
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useAppStore((s) => s.setSimulationSpeed);

  const isPaused = simulationSpeed === 0;

  function handlePreset(value: number) {
    setSimulationSpeed(value);
  }

  function handlePause() {
    setSimulationSpeed(0);
  }

  function handleResume() {
    setSimulationSpeed(1);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded border border-white/20 bg-black/40 px-3 py-2 backdrop-blur"
      role="group"
      aria-label={t('simulation.speed_label')}
    >
      {/* Label */}
      <span className="text-xs text-gray-300 select-none whitespace-nowrap mr-1">
        {t('simulation.speed_label')}
      </span>

      {/* Pausa / Reanudar */}
      {isPaused ? (
        <button
          type="button"
          onClick={handleResume}
          aria-label={t('simulation.preset.pause')}
          aria-pressed={true}
          className="min-h-[44px] min-w-[56px] rounded border border-yellow-400/60 bg-yellow-400/20 px-3 py-1 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/30 active:bg-yellow-400/40 transition-colors"
        >
          ▶ {t('simulation.preset.pause')}
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePause}
          aria-label={t('simulation.preset.pause')}
          aria-pressed={false}
          className="min-h-[44px] min-w-[56px] rounded border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20 active:bg-white/30 transition-colors"
        >
          ⏸ {t('simulation.preset.pause')}
        </button>
      )}

      {/* Botones de preset */}
      {PRESETS.map((value, idx) => {
        const key = PRESET_KEYS[idx];
        const isActive = !isPaused && simulationSpeed === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handlePreset(value)}
            aria-label={t(`simulation.preset.${key}`)}
            aria-pressed={isActive}
            className={[
              'min-h-[44px] min-w-[56px] rounded border px-3 py-1 text-sm font-semibold transition-colors',
              isActive
                ? 'border-yellow-400/80 bg-yellow-400/25 text-yellow-200'
                : 'border-white/20 bg-white/10 text-white hover:bg-white/20 active:bg-white/30',
            ].join(' ')}
          >
            {formatPreset(value)}
          </button>
        );
      })}
    </div>
  );
}

SpeedControl.displayName = 'SpeedControl';
