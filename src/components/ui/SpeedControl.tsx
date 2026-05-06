/**
 * <SpeedControl> — control HUD de velocidad de simulación.
 *
 * - Slider HTML5 nativo (0..5, step 0.1) que ajusta simulationSpeed en el store.
 * - Botón pausa/reanudar: alterna entre speed=0 y el último valor distinto de 0.
 * - Posicionado top-right del HUD, semitransparente.
 * - i18n: solar:simulation.speed_label | solar:simulation.pause | solar:simulation.play
 */

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

export function SpeedControl() {
  const { t } = useTranslation('solar');
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useAppStore((s) => s.setSimulationSpeed);

  /** Último valor de velocidad distinto de 0 (para reanudar desde pausa) */
  const lastNonZeroSpeed = useRef<number>(simulationSpeed > 0 ? simulationSpeed : 1.0);

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    setSimulationSpeed(value);
    if (value > 0) {
      lastNonZeroSpeed.current = value;
    }
  }

  function handlePauseResume() {
    if (simulationSpeed === 0) {
      // Reanudar al último valor conocido
      setSimulationSpeed(lastNonZeroSpeed.current);
    } else {
      // Guardar el valor actual y pausar
      lastNonZeroSpeed.current = simulationSpeed;
      setSimulationSpeed(0);
    }
  }

  const isPaused = simulationSpeed === 0;

  return (
    <div
      className="flex items-center gap-2 rounded border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur"
      role="group"
      aria-label={t('simulation.speed_label')}
    >
      <span className="text-xs text-gray-300 select-none whitespace-nowrap">
        {t('simulation.speed_label')}: {simulationSpeed.toFixed(1)}×
      </span>
      <input
        type="range"
        min="0"
        max="5"
        step="0.1"
        value={simulationSpeed}
        onChange={handleSliderChange}
        aria-label={t('simulation.speed_label')}
        className="w-24 accent-yellow-400"
      />
      <button
        type="button"
        onClick={handlePauseResume}
        aria-pressed={isPaused}
        className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20 active:bg-white/30 transition-colors"
      >
        {isPaused ? t('simulation.play') : t('simulation.pause')}
      </button>
    </div>
  );
}

SpeedControl.displayName = 'SpeedControl';
