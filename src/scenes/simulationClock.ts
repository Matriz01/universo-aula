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
 * Escala discreta de 25 velocidades de simulación, en segundos simulados
 * por segundo real (s_sim / s_real).
 *
 * La escala es simétrica alrededor del stop central (índice 12 = pausa = 0 s/s).
 * Velocidades negativas permiten retroceder en el tiempo.
 *
 * Correspondencia:
 *  0  → -31 536 000 (-1 año/s)
 *  1  → -15 552 000 (-6 mes/s)
 *  2  →  -7 776 000 (-3 mes/s)
 *  3  →  -2 592 000 (-1 mes/s)
 *  4  →    -604 800 (-1 sem/s)
 *  5  →    -259 200 (-3 d/s)
 *  6  →     -86 400 (-24 h/s)
 *  7  →     -43 200 (-12 h/s)
 *  8  →     -21 600 (-6 h/s)
 *  9  →     -10 800 (-3 h/s)
 * 10  →      -3 600 (-1 h/s)
 * 11  →          -1 (-1 s/s)
 * 12  →           0 (Pausa)
 * 13  →           1 (1 s/s — tiempo real)
 * 14  →       3 600 (1 h/s)
 * 15  →      10 800 (3 h/s)
 * 16  →      21 600 (6 h/s)
 * 17  →      43 200 (12 h/s)
 * 18  →      86 400 (24 h/s = 1 día/s)
 * 19  →     259 200 (3 d/s)
 * 20  →     604 800 (1 semana/s)
 * 21  →   2 592 000 (1 mes/s ≈ 30 días)
 * 22  →   7 776 000 (3 meses/s)
 * 23  →  15 552 000 (6 meses/s)
 * 24  →  31 536 000 (1 año/s = 365 días)
 */
export const SPEED_STOPS_SECONDS_PER_SECOND: readonly number[] = [
  -31536000, -15552000, -7776000, -2592000, -604800, -259200, -86400, -43200, -21600, -10800, -3600,
  -1, 0, 1, 3600, 10800, 21600, 43200, 86400, 259200, 604800, 2592000, 7776000, 15552000, 31536000,
] as const;

/**
 * Etiquetas en español (castellano peninsular) para cada stop de SPEED_STOPS_SECONDS_PER_SECOND.
 * Índice sincronizado con SPEED_STOPS_SECONDS_PER_SECOND.
 */
export const SPEED_STOP_LABELS_ES: readonly string[] = [
  '-1 año/s',
  '-6 mes/s',
  '-3 mes/s',
  '-1 mes/s',
  '-1 sem/s',
  '-3 d/s',
  '-24 h/s',
  '-12 h/s',
  '-6 h/s',
  '-3 h/s',
  '-1 h/s',
  '-1 s/s',
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
// Función auxiliar interna: extrae la fecha UTC de hoy
// ---------------------------------------------------------------------------

/**
 * Devuelve la fecha civil UTC del instante actual como { year, month, day }.
 * Usa getUTC* para evitar desfases de timezone del sistema operativo.
 * Uso exclusivo de la inicialización del módulo.
 */
function todayUTC(): { year: number; month: number; day: number } {
  const d = new Date();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

// ---------------------------------------------------------------------------
// Estado interno (módulo-level, no exportado)
// Mutación in-place — sin clases, sin React, sin Zustand.
// ---------------------------------------------------------------------------

const state: { jd: number; paused: boolean } = {
  // Inicialización en la fecha UTC real. J2000_JD permanece como constante
  // exportada para los datos orbitales (epoch de referencia).
  jd: gregorianToJD(todayUTC()),
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

// ---------------------------------------------------------------------------
// Conversión Gregoriano → JD (función pura, inverso de jdToGregorian)
// Algoritmo: Fliegel–Van Flandern (variante directa).
// Referencia: Communications of the ACM, Vol 11, p 657.
// ---------------------------------------------------------------------------

/**
 * Convierte una fecha gregoriana a Julian Date.
 *
 * El resultado es el JD de la medianoche UTC del día indicado (JDN - 0.5).
 * Esto es consistente con jdToGregorian, que usa floor(jd + 0.5) para
 * extraer el número de día.
 *
 * TIMEZONE: la función opera sobre la fecha civil {year, month, day} tal como
 * la proporciona el llamador. Para obtener la fecha local del usuario, extrae
 * getFullYear/getMonth/getDate de `new Date()` antes de llamar a esta función.
 * No usa Date internamente (sin riesgo de TZ del runtime).
 *
 * @param d - Fecha gregoriana { year, month, day } (month ∈ [1..12], day ∈ [1..31])
 * @returns Julian Date de la medianoche UTC del día indicado.
 */
export function gregorianToJD(d: { year: number; month: number; day: number }): number {
  const { year, month, day } = d;
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  // JDN es el número de día juliano (mediodía TT).
  // Restamos 0.5 para obtener la medianoche UTC del mismo día civil.
  return jdn - 0.5;
}

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
