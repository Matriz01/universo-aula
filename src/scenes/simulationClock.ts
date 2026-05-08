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
 *
 * Unidades de speedup en tick():
 *   `speedup` es "segundos simulados por segundo real" (s_sim / s_real).
 *   La fórmula jd += (deltaSeconds * speedup) / 86400 convierte correctamente:
 *     deltaSeconds [s_real] × speedup [s_sim/s_real] / 86400 [s_sim/día] = días JD
 *   Usar SPEED_STOPS_SECONDS_PER_SECOND como valores válidos de speedup.
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Época J2000.0 en Julian Date (2000-01-01T12:00:00 TT) */
export const J2000_JD = 2451545.0 as const;

/**
 * Escala discreta de 13 velocidades de simulación, en segundos simulados
 * por segundo real (s_sim / s_real).
 *
 * Stop 0 = pausa (0 s/s)
 * Stop 1 = tiempo real (1 s/s)
 * Stop 12 = 1 año simulado por segundo real (31 536 000 s/s)
 *
 * Correspondencia:
 *  0  → 0          (Pausa)
 *  1  → 1          (1 s/s — tiempo real)
 *  2  → 3 600      (1 h/s)
 *  3  → 10 800     (3 h/s)
 *  4  → 21 600     (6 h/s)
 *  5  → 43 200     (12 h/s)
 *  6  → 86 400     (24 h/s = 1 día/s)
 *  7  → 259 200    (3 d/s)
 *  8  → 604 800    (1 semana/s)
 *  9  → 2 592 000  (1 mes/s ≈ 30 días)
 * 10  → 7 776 000  (3 meses/s)
 * 11  → 15 552 000 (6 meses/s)
 * 12  → 31 536 000 (1 año/s = 365 días)
 */
export const SPEED_STOPS_SECONDS_PER_SECOND: readonly number[] = [
  0, 1, 3600, 10800, 21600, 43200, 86400, 259200, 604800, 2592000, 7776000, 15552000, 31536000,
] as const;

/**
 * Etiquetas en español (castellano peninsular) para cada stop de SPEED_STOPS_SECONDS_PER_SECOND.
 * Índice sincronizado con SPEED_STOPS_SECONDS_PER_SECOND.
 */
export const SPEED_STOP_LABELS_ES: readonly string[] = [
  'Pausa',
  '1 s/s',
  '1 h/s',
  '3 h/s',
  '6 h/s',
  '12 h/s',
  '24 h/s',
  '3 d/s',
  '1 sem/s',
  '1 mes/s',
  '3 mes/s',
  '6 mes/s',
  '1 año/s',
] as const;

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
 * Fórmula: jd += (deltaSeconds * speedup) / 86400
 *
 * @param deltaSeconds - Tiempo real transcurrido (segundos, típicamente el `delta` de R3F useFrame)
 * @param speedup      - Segundos simulados por segundo real (s_sim/s_real).
 *                       Usar valores de SPEED_STOPS_SECONDS_PER_SECOND.
 *                       Ejemplo: 86400 → 1 día simulado por segundo real.
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
