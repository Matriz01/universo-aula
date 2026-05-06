/**
 * Constantes J2000 epoch.
 */
export const J2000_MS = new Date('2000-01-01T12:00:00Z').getTime();
export const DAY_MS = 86_400_000;

/**
 * Días simulados desde J2000 epoch para una fecha dada.
 * Acepta diferencia 64s con TT (despreciable para MVP).
 */
export function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000_MS) / DAY_MS;
}

/**
 * Resuelve la ecuación de Kepler M = E - e*sin(E) por Newton-Raphson.
 */
export function solveKepler(
  meanAnomalyRad: number,
  eccentricity: number,
  tolerance = 1e-6,
  maxIter = 8,
): number {
  let E = meanAnomalyRad;
  for (let i = 0; i < maxIter; i++) {
    const dE = (E - eccentricity * Math.sin(E) - meanAnomalyRad) / (1 - eccentricity * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }
  return E;
}

/**
 * Anomalía verdadera ν desde anomalía excéntrica E y excentricidad e.
 */
export function trueAnomalyFromEccentric(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}
