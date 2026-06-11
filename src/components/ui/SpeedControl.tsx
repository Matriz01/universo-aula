/**
 * <SpeedControl> — control HUD de velocidad de simulación con escala de 25 stops.
 *
 * Diseño Batch 4 (actualizado Issues 9-11):
 *   Layout: top-center, fijo, sobre el contenido HUD principal.
 *   Controles: [ ◀ ] [ ⏸/▶ ] [ ▶ ] + leyenda con la etiqueta del stop actual.
 *
 * - Flechas ◀/▶ invocan decrementSpeedStop / incrementSpeedStop del store.
 * - Botón central alterna pausa/play via togglePause.
 * - Leyenda muestra SPEED_STOP_LABELS_ES[stopIndex] (ej: "1 h/s", "Pausa", "-1 h/s").
 * - Flecha izquierda deshabilitada en el primer stop (-1 año/s, índice 0).
 * - Flecha derecha deshabilitada en el último stop (1 año/s, índice 24).
 * - Velocidades negativas: retroceso en el tiempo. El botón central pausa/reanuda.
 * - Sin i18n externo — etiquetas hardcoded en es-ES (castellano peninsular).
 * - Sin nuevas dependencias.
 */

import { useAppStore } from '@/store/useAppStore';
import { SPEED_STOPS_SECONDS_PER_SECOND, SPEED_STOP_LABELS_ES } from '@/scenes/simulationClock';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStopIndex(speed: number): number {
  const idx = SPEED_STOPS_SECONDS_PER_SECOND.indexOf(speed);
  return idx === -1 ? 13 : idx; // fallback a stop 13 (tiempo real, índice 13 en escala de 25)
}

// ---------------------------------------------------------------------------
// SVG icons (inline, sin dependencias externas)
// ---------------------------------------------------------------------------

function IconPause() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SpeedControl() {
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const togglePause = useAppStore((s) => s.togglePause);
  const incrementSpeedStop = useAppStore((s) => s.incrementSpeedStop);
  const decrementSpeedStop = useAppStore((s) => s.decrementSpeedStop);

  const isPaused = simulationSpeed === 0;
  const stopIdx = getStopIndex(simulationSpeed);
  const isFirstStop = stopIdx === 0;
  const isLastStop = stopIdx === SPEED_STOPS_SECONDS_PER_SECOND.length - 1;
  const label = SPEED_STOP_LABELS_ES[stopIdx] ?? 'Pausa';

  const btnBase =
    'flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
  const btnEnabled = 'text-white hover:bg-white/20 active:bg-white/30';
  const btnDisabled = 'text-white/30 cursor-not-allowed';

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white shadow-lg backdrop-blur">
        {/* Flecha izquierda — decrementar stop */}
        <button
          type="button"
          onClick={decrementSpeedStop}
          disabled={isFirstStop}
          aria-label="Reducir velocidad"
          className={`${btnBase} ${isFirstStop ? btnDisabled : btnEnabled}`}
        >
          <IconChevronLeft />
        </button>

        {/* Botón central — pause / play */}
        <button
          type="button"
          onClick={togglePause}
          aria-label={isPaused ? 'Reanudar simulación' : 'Pausar simulación'}
          className={`${btnBase} ${isPaused ? 'bg-white/20 hover:bg-white/30 text-white' : btnEnabled}`}
        >
          {isPaused ? <IconPlay /> : <IconPause />}
        </button>

        {/* Flecha derecha — incrementar stop */}
        <button
          type="button"
          onClick={incrementSpeedStop}
          disabled={isLastStop}
          aria-label="Aumentar velocidad"
          className={`${btnBase} ${isLastStop ? btnDisabled : btnEnabled}`}
        >
          <IconChevronRight />
        </button>

        {/* Leyenda — etiqueta del stop actual */}
        <span className="min-w-[4.5rem] select-none text-center text-xs font-semibold tabular-nums">
          {label}
        </span>
      </div>
    </div>
  );
}

SpeedControl.displayName = 'SpeedControl';
