/**
 * DateControl — HUD para navegar a una fecha de simulación concreta.
 *
 * - Input type="date" para selección directa
 * - Slider de años offset [-100, +100] desde el momento actual real
 * - Botón "Hoy" para volver a new Date()
 *
 * Posición: top-right (LevelSelector está top-left).
 */

import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

/** Fecha real de inicio de la sesión (constante para no moverse con la simulación) */
const SESSION_NOW = new Date();

export function DateControl() {
  const { t } = useTranslation('solar');
  const time = useAppStore((s) => s.simulationTime);
  const setTime = useAppStore((s) => s.setSimulationTime);

  // ISO date para el input type="date"
  const isoDate = time.toISOString().split('T')[0];

  // Slider: años offset desde el momento de carga de la sesión
  const yearsOffset = (time.getTime() - SESSION_NOW.getTime()) / (365.25 * 86_400_000);

  return (
    <div className="absolute top-4 right-4 pointer-events-none flex flex-col gap-2 z-20">
      <div className="pointer-events-auto bg-black/60 backdrop-blur-sm rounded p-3 text-white text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="sim-date" className="text-xs opacity-70">
            {t('simulation.date_label', 'Fecha')}
          </label>
          <input
            id="sim-date"
            type="date"
            value={isoDate}
            onChange={(e) => {
              const next = new Date(e.target.value);
              if (!isNaN(next.getTime())) setTime(next);
            }}
            min="1925-01-01"
            max="2125-12-31"
            className="bg-white/10 rounded px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => setTime(new Date())}
            className="bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-xs pointer-events-auto"
            aria-label={t('simulation.go_to_today', 'Hoy')}
          >
            {t('simulation.go_to_today', 'Hoy')}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="range"
            min={-100}
            max={100}
            step={0.5}
            value={yearsOffset}
            onChange={(e) => {
              const offset = parseFloat(e.target.value);
              const next = new Date(SESSION_NOW.getTime() + offset * 365.25 * 86_400_000);
              setTime(next);
            }}
            className="flex-1 pointer-events-auto"
          />
          <span className="text-xs opacity-70 w-16 text-right">
            {yearsOffset >= 0 ? '+' : ''}
            {yearsOffset.toFixed(0)}a
          </span>
        </div>
      </div>
    </div>
  );
}
