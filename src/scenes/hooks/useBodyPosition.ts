import { useMemo } from 'react';
import { Vector3 } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';
import { daysSinceJ2000, solveKepler, trueAnomalyFromEccentric } from '@/scenes/orbital/keplerTime';

export type ScaleMode = 'global' | 'local';

/**
 * Calcula la posición de un cuerpo en órbita kepleriana en función del tiempo.
 *
 * Función pura — el resultado solo depende de los inputs. Sin estado interno.
 *
 * @param body Datos orbitales del cuerpo (de planets.json)
 * @param time Fecha de la simulación (Date)
 * @param scaleMode 'global' (didáctica) o 'local' (1u=1000km real)
 */
export function computeBodyPosition(body: PlanetData, time: Date, scaleMode: ScaleMode): Vector3 {
  const days = daysSinceJ2000(time);

  // Mean motion (rad/día) = 2π / period_days
  const meanMotion = (2 * Math.PI) / body.orbital_period_days;

  // Mean anomaly en t
  const M0 = (body.mean_anomaly_J2000_deg * Math.PI) / 180;
  const M = M0 + meanMotion * days;

  // Resolver Kepler
  const E = solveKepler(M, body.eccentricity);
  const trueAnomaly = trueAnomalyFromEccentric(E, body.eccentricity);

  // Radio orbital en unidades de escala
  const distanceFn = scaleMode === 'local' ? localVisualDistanceFromAU : visualDistance;
  const a = distanceFn(body.semi_major_axis_AU); // semieje mayor visual
  const r = a * (1 - body.eccentricity * Math.cos(E)); // radio visual

  // Aplicar inclinación, longitud nodo ascendente, argumento perihelio
  const inc = (body.inclination_deg * Math.PI) / 180;
  const omega = (body.argument_perihelion_deg * Math.PI) / 180;
  const Omega = (body.longitude_ascending_node_deg * Math.PI) / 180;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);
  const cosVwOmega = Math.cos(trueAnomaly + omega);
  const sinVwOmega = Math.sin(trueAnomaly + omega);

  const x = r * (cosOmega * cosVwOmega - sinOmega * sinVwOmega * cosInc);
  const y = r * sinVwOmega * sinInc;
  const z = r * (sinOmega * cosVwOmega + cosOmega * sinVwOmega * cosInc);

  return new Vector3(x, y, z);
}

/**
 * Hook React que memoiza la posición de un cuerpo.
 *
 * Para evitar invalidación constante de useMemo con Date como dep,
 * usa el timestamp numérico (time.getTime()) como key.
 */
export function useBodyPosition(body: PlanetData, time: Date, scaleMode: ScaleMode): Vector3 {
  return useMemo(
    () => computeBodyPosition(body, time, scaleMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [body, time.getTime(), scaleMode],
  );
}
