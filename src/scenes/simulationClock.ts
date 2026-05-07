/**
 * simulationClock — ÚNICA fuente autoritativa del tiempo de simulación.
 *
 * INVARIANTE ARQUITECTÓNICA (NO ROMPER):
 * El tiempo a 60Hz NUNCA vive en React state ni en Zustand. Vive en este
 * módulo como objeto mutable, mutado y leído imperativamente desde useFrame.
 * Mover `jd` a Zustand provoca ~17 re-renders/frame (regresión Refactor C).
 * Anclaje: J2000.0 (JD = 2451545.0 = 2000-01-01T12:00:00 TT).
 *
 * Uso correcto:
 *   ✅ Leer getJD() dentro de useFrame (imperativo, sin suscripción)
 *   ✅ Tick único en <SimulationTicker>, primer hijo de <SolarSystemContent>
 *   ❌ NUNCA añadir simulationTime, elapsed o jd a useAppStore / Zustand
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Época J2000.0 en Julian Date (2000-01-01T12:00:00 TT) */
export const J2000_JD = 2451545.0 as const;

/** Nivel Explorador: 3 días simulados por segundo real (speedup base × 1) */
export const SPEEDUP_EXPLORADOR = 3 as const;

/** Nivel Aprendiz: 1 día simulado por segundo real */
export const SPEEDUP_APRENDIZ = 1 as const;

/** Nivel Investigador: 0.3 días simulados por segundo real (Kepler completo) */
export const SPEEDUP_INVESTIGADOR = 0.3 as const;

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';

// ---------------------------------------------------------------------------
// Estado interno (módulo-level, no exportado)
// Mutación in-place — sin clases, sin React, sin Zustand.
// ---------------------------------------------------------------------------

const state: { jd: number; paused: boolean } = {
  jd: J2000_JD,
  paused: false,
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Devuelve el Julian Date actual (float64). */
export function getJD(): number {
  return state.jd;
}

/** Devuelve true si el reloj está pausado. */
export function getPaused(): boolean {
  return state.paused;
}

/** Establece el flag de pausa. */
export function setPaused(paused: boolean): void {
  state.paused = paused;
}

/**
 * Avanza el JD cuando no está pausado.
 * Fórmula: jd += deltaSeconds * speedup / 86400
 *
 * @param deltaSeconds - Tiempo real transcurrido (segundos, típicamente el `dt` de R3F useFrame)
 * @param speedup      - Factor de aceleración (simulationSpeed × speedupForLevel)
 */
export function tick(deltaSeconds: number, speedup: number): void {
  if (state.paused) return;
  state.jd += (deltaSeconds * speedup) / 86400;
}

/**
 * Establece el JD al valor exacto indicado.
 * Útil para tests y para que el futuro date-scrubber UI lo use.
 */
export function reset(jd: number): void {
  state.jd = jd;
}

/**
 * Convierte el JD actual a fecha Gregoriana.
 * Delega en jdToGregorian().
 */
export function getGregorianDate(): { year: number; month: number; day: number } {
  return jdToGregorian(state.jd);
}

/**
 * Mapea un nivel pedagógico al speedup de días-simulados/seg correspondiente.
 */
export function speedupForLevel(level: PedagogicalLevel): number {
  switch (level) {
    case 'explorador':
      return SPEEDUP_EXPLORADOR;
    case 'aprendiz':
      return SPEEDUP_APRENDIZ;
    case 'investigador':
      return SPEEDUP_INVESTIGADOR;
  }
}

// ---------------------------------------------------------------------------
// Conversión JD → Gregoriano (función pura, testeable independientemente)
// Algoritmo: Fliegel–Van Flandern (1968). Aritmética entera pura.
// Referencia: Communications of the ACM, Vol 11, p 657.
// ---------------------------------------------------------------------------

/**
 * Convierte un Julian Date a fecha Gregoriana (pura, sin side-effects).
 * Devuelve { year, month, day } con month ∈ [1..12], day ∈ [1..31].
 * La hora del día se descarta (DateControl muestra solo fecha).
 */
export function jdToGregorian(jd: number): { year: number; month: number; day: number } {
  // JD comienza al mediodía → desplazar media jornada para obtener el día UTC correcto
  const z = Math.floor(jd + 0.5);

  // Algoritmo Fliegel-Van Flandern para convertir JDN a Gregoriano
  const a = z + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);

  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return { year, month, day };
}
