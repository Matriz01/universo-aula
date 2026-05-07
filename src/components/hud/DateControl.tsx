/**
 * DateControl — visualización de fecha gregoriana en formato es-ES.
 *
 * Muestra la fecha actual del simulationClock en castellano peninsular
 * (ejemplo: "1 de enero de 2000"). Se actualiza como máximo 1 vez/segundo
 * mediante setInterval(1000ms) — nunca a 60Hz (REQ-DATE-2).
 *
 * IMPORTANTE: componente de SOLO LECTURA (REQ-DATE-3). No permite scrubbing
 * ni entrada de usuario. La fecha se deriva del simulationClock, no de Zustand.
 *
 * Diseño: §3 ADR-3 (setInterval + string short-circuit).
 * Ubicación: HUD bottom-left de App.tsx (REQ-DATE-4).
 */

import { useState, useEffect } from 'react';
import { getGregorianDate } from '@/scenes/simulationClock';

// ---------------------------------------------------------------------------
// Formateador de fecha (singleton — Intl.DateTimeFormat es costoso de crear)
// ---------------------------------------------------------------------------

const FMT = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });

/**
 * Formatea { year, month, day } en es-ES "largo" (ej: "1 de enero de 2000").
 * Usa Date.UTC para evitar desfases de zona horaria del SO.
 */
function formatDate({ year, month, day }: { year: number; month: number; day: number }): string {
  return FMT.format(new Date(Date.UTC(year, month - 1, day)));
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Muestra la fecha del simulationClock en formato es-ES largo.
 * Re-renderiza como máximo 1 vez por segundo (throttle vía setInterval).
 * Componente de solo lectura — sin inputs ni botones (REQ-DATE-3).
 */
export function DateControl() {
  const [label, setLabel] = useState<string>(() => formatDate(getGregorianDate()));

  useEffect(() => {
    const id = setInterval(() => {
      const next = formatDate(getGregorianDate());
      // Short-circuit: si la cadena no cambió, no dispara re-render (REQ-DATE-2 escenario 2)
      setLabel((prev) => (prev === next ? prev : next));
    }, 1000);

    // Cleanup: evita interval leak al desmontar (React 19 strict-mode double-mount safe)
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs tabular-nums text-white/80" aria-live="polite">
      {label}
    </span>
  );
}

DateControl.displayName = 'DateControl';
