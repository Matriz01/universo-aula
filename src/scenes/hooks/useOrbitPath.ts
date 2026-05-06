/**
 * Hook useOrbitPath — genera los puntos de la trayectoria orbital para dibujar
 * el camino que sigue un planeta.
 *
 * Implementa los tres modelos del design §4.2 para un periodo completo:
 *   - Explorador:    círculo (Y=0)
 *   - Aprendiz:      elipse plana (Y=0)
 *   - Investigador:  elipse con inclinación 3D (Kepler completo)
 *
 * Exporta también `computeOrbitPoints` como función pura para facilitar tests.
 */

import { useMemo } from 'react';
import { Vector3 } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { applyOrbitalRotation, degToRad } from '@/scenes/orbital';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';

export type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';

/**
 * Función pura que genera los puntos de la trayectoria orbital.
 * Se exporta separada del hook para facilitar los tests unitarios.
 *
 * @param planet   - Datos del planeta
 * @param level    - Nivel pedagógico
 * @param segments - Número de puntos (default 128)
 * @param scaleMode - Escala a aplicar: 'global' (didáctica) o 'local' (real 1:1)
 * @returns Array de Vector3 con los puntos de la trayectoria (primer = último para cierre)
 */
export function computeOrbitPoints(
  planet: PlanetData,
  level: PedagogicalLevel,
  segments = 128,
  scaleMode: 'global' | 'local' = 'global',
): Vector3[] {
  const a =
    scaleMode === 'local'
      ? localVisualDistanceFromAU(planet.semi_major_axis_AU)
      : visualDistance(planet.semi_major_axis_AU);
  const b = a * Math.sqrt(1 - planet.eccentricity ** 2);
  const omega = degToRad(planet.argument_perihelion_deg);
  const Omega = degToRad(planet.longitude_ascending_node_deg);
  const inc = degToRad(planet.inclination_deg);

  const points: Vector3[] = [];

  // Generamos segments-1 puntos únicos + 1 cierre (= primer punto repetido)
  // → total: segments puntos con points[0] === points[segments-1]
  for (let i = 0; i < segments - 1; i++) {
    // Parámetro t ∈ [0, 2π) para un periodo completo
    const t = (i / (segments - 1)) * 2 * Math.PI;
    const pt = new Vector3();

    if (level === 'explorador') {
      // Circular plana
      pt.set(a * Math.cos(t), 0, a * Math.sin(t));
    } else if (level === 'aprendiz') {
      // Elipse plana (centrada en el origen, aproximación didáctica)
      pt.set(a * Math.cos(t), 0, b * Math.sin(t));
    } else {
      // Investigador — Kepler: t es la anomalía excéntrica E
      // Usamos E directamente como parámetro uniforme en [0, 2π]
      const E = t;
      const nu =
        2 *
        Math.atan2(
          Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
          Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2),
        );
      const r = a * (1 - planet.eccentricity * Math.cos(E));
      applyOrbitalRotation(pt, r, nu, omega, Omega, inc);
    }

    points.push(pt);
  }

  // Punto de cierre — igual al primero para órbita cerrada
  if (points.length > 0) {
    points.push(points[0].clone());
  }

  return points;
}

/**
 * Hook React que memoiza los puntos de la trayectoria orbital.
 * Los puntos sólo se recalculan si cambian planet, level o scaleMode.
 *
 * @param planet     - Datos del planeta
 * @param level      - Nivel pedagógico
 * @param segments   - Número de puntos (default 128)
 * @param scaleMode  - Escala a aplicar: 'global' (didáctica) o 'local' (real 1:1)
 */
export function useOrbitPath(
  planet: PlanetData,
  level: PedagogicalLevel,
  segments = 128,
  scaleMode: 'global' | 'local' = 'global',
): Vector3[] {
  return useMemo(
    () => computeOrbitPoints(planet, level, segments, scaleMode),
    [planet, level, segments, scaleMode],
  );
}
