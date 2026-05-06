/**
 * Hook usePlanetPosition — calcula la posición de un planeta en la escena R3F.
 *
 * Implementa los tres modelos orbitales del design §4.2:
 *   - Explorador: órbita circular (rápida, pedagógica)
 *   - Aprendiz:   elipse simplificada (centrada en el origen)
 *   - Investigador: Kepler completo con applyOrbitalRotation 3D
 *
 * Escala según viewMode:
 *   - global → visualDistance (curva didáctica sublogarítmica)
 *   - local  → localVisualDistanceFromAU (escala real: 1 unidad = 1000 km)
 *
 * Retorna un React.MutableRefObject<Vector3> cuyo .current se actualiza
 * en cada frame de useFrame — no provoca re-renders.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import {
  solveKeplerNewtonRaphson,
  applyOrbitalRotation,
  degToRad,
  SPEEDUP_EXPLORADOR,
  SPEEDUP_APRENDIZ,
  SPEEDUP_INVESTIGADOR,
} from '@/scenes/orbital';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';
import { useAppStore } from '@/store/useAppStore';

export type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';

/**
 * Hook que actualiza la posición del planeta cada frame.
 *
 * @param planet - Datos del planeta (NASA JPL J2000)
 * @param level  - Nivel pedagógico activo
 * @returns Ref al Vector3 de posición (actualizado en useFrame, sin re-renders)
 */
export function usePlanetPosition(
  planet: PlanetData,
  level: PedagogicalLevel,
): React.MutableRefObject<Vector3> {
  const posRef = useRef<Vector3>(new Vector3());
  const elapsed = useRef<number>(0);
  const speed = useAppStore((s) => s.simulationSpeed);
  const viewMode = useAppStore((s) => s.viewMode);

  // Memoizamos derivados que no cambian con t
  // La distancia semieje mayor se escala según el modo: real en local, didáctica en global
  const { a, b, n, M0, omega, Omega, inc } = useMemo(() => {
    const scaledDist =
      viewMode === 'local'
        ? localVisualDistanceFromAU(planet.semi_major_axis_AU)
        : visualDistance(planet.semi_major_axis_AU);
    return {
      a: scaledDist,
      b: scaledDist * Math.sqrt(1 - planet.eccentricity ** 2),
      n: (2 * Math.PI) / planet.orbital_period_days, // mean motion rad/día
      M0: degToRad(planet.mean_anomaly_J2000_deg),
      omega: degToRad(planet.argument_perihelion_deg),
      Omega: degToRad(planet.longitude_ascending_node_deg),
      inc: degToRad(planet.inclination_deg),
    };
  }, [planet, viewMode]);

  useFrame((_, dt) => {
    const speedup =
      level === 'explorador'
        ? SPEEDUP_EXPLORADOR
        : level === 'aprendiz'
          ? SPEEDUP_APRENDIZ
          : SPEEDUP_INVESTIGADOR;

    elapsed.current += dt * speed * speedup; // días simulados (pausa si speed=0)

    if (level === 'explorador') {
      // Órbita circular — sin excentricidad, sin inclinación
      const theta = n * elapsed.current;
      posRef.current.set(a * Math.cos(theta), 0, a * Math.sin(theta));
    } else if (level === 'aprendiz') {
      // Elipse centrada en el origen (aproximación didáctica, sin inclinación)
      const theta = n * elapsed.current;
      posRef.current.set(a * Math.cos(theta), 0, b * Math.sin(theta));
    } else {
      // Investigador — Kepler Newton-Raphson + rotaciones 3D
      const M = M0 + n * elapsed.current;
      const E = solveKeplerNewtonRaphson(M, planet.eccentricity, 1e-6, 8);
      const nu =
        2 *
        Math.atan2(
          Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
          Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2),
        );
      const r = a * (1 - planet.eccentricity * Math.cos(E));
      applyOrbitalRotation(posRef.current, r, nu, omega, Omega, inc);
    }
  });

  return posRef;
}
