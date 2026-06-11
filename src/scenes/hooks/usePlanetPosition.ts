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

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { solveKeplerNewtonRaphson, applyOrbitalRotation, degToRad } from '@/scenes/orbital';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';
import { useAppStore } from '@/store/useAppStore';
import { J2000_JD, getJD } from '@/scenes/simulationClock';
import { useOriginOffset } from '@/scenes/contexts/OriginOffsetContext';

export type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';
export type ViewMode = 'global' | 'local';

// ---------------------------------------------------------------------------
// computePosition — función pura testeable (REQ-ORB-4, T2.2)
//
// Calcula la posición de un planeta para un Julian Date dado, de forma
// determinista y sin side-effects. Sin useFrame, sin React, sin Three.js hooks.
//
// Esta función encapsula la lógica orbital de usePlanetPosition para que
// los tests unitarios puedan verificar el comportamiento sin montar R3F.
// ---------------------------------------------------------------------------

/**
 * Calcula la posición tridimensional de un planeta para el JD indicado.
 *
 * @param planet       - Datos orbitales del planeta (NASA JPL J2000)
 * @param level        - Nivel pedagógico (define el modelo orbital empleado)
 * @param jd           - Julian Date actual (desde simulationClock.getJD())
 * @param viewMode     - 'global' → escala didáctica; 'local' → escala real (1 u = 1000 km)
 * @param originOffset - (opcional) Vector3 a restar al resultado. En modo local,
 *                       pasar la posición absoluta del cuerpo seleccionado para
 *                       que ese cuerpo sea siempre el origen (REQ-FRAME-1).
 *                       Default: Vector3(0,0,0) — sin cambio.
 * @returns Posición {x, y, z} en unidades de escena
 */
export function computePosition(
  planet: PlanetData,
  level: PedagogicalLevel,
  jd: number,
  viewMode: ViewMode,
  originOffset?: Vector3,
): { x: number; y: number; z: number } {
  const scaledDist =
    viewMode === 'local'
      ? localVisualDistanceFromAU(planet.semi_major_axis_AU)
      : visualDistance(planet.semi_major_axis_AU);

  const a = scaledDist;
  const b = scaledDist * Math.sqrt(1 - planet.eccentricity ** 2);
  const n = (2 * Math.PI) / planet.orbital_period_days; // mean motion rad/día
  const M0 = degToRad(planet.mean_anomaly_J2000_deg);
  const omega = degToRad(planet.argument_perihelion_deg);
  const Omega = degToRad(planet.longitude_ascending_node_deg);
  const inc = degToRad(planet.inclination_deg);

  // Días transcurridos desde J2000 — fuente de verdad: JD del reloj
  const daysSinceJ2000 = jd - J2000_JD;

  const pos = new Vector3();

  if (level === 'explorador') {
    const theta = n * daysSinceJ2000;
    pos.set(a * Math.cos(theta), 0, a * Math.sin(theta));
  } else if (level === 'aprendiz') {
    const theta = n * daysSinceJ2000;
    pos.set(a * Math.cos(theta), 0, b * Math.sin(theta));
  } else {
    // investigador — Kepler Newton-Raphson + rotaciones 3D
    const M = M0 + n * daysSinceJ2000;
    const E = solveKeplerNewtonRaphson(M, planet.eccentricity, 1e-6, 8);
    const nu =
      2 *
      Math.atan2(
        Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
        Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2),
      );
    const r = a * (1 - planet.eccentricity * Math.cos(E));
    applyOrbitalRotation(pos, r, nu, omega, Omega, inc);
  }

  // Aplicar el offset del origen si se proporciona (REQ-FRAME-1: modo local frame-of-reference)
  if (originOffset) {
    pos.sub(originOffset);
  }

  return { x: pos.x, y: pos.y, z: pos.z };
}

/**
 * Hook que actualiza la posición del planeta cada frame.
 *
 * Lee el Julian Date desde simulationClock.getJD() de forma imperativa
 * (sin suscripción React) y delega en computePosition() para el cálculo.
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
  const viewMode = useAppStore((s) => s.viewMode);

  // viewMode se memoiza para estabilizar la referencia en el closure de useFrame.
  // No necesitamos speed ni elapsed: el JD viene del simulationClock global.
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  // Leer el offset del origen desde el context (ADR-1: ref — sin re-renders)
  // En modo global: offset = (0,0,0) — sin cambio.
  // En modo local:  offset = posición absoluta del cuerpo seleccionado.
  const originOffsetRef = useOriginOffset();

  // Priority -0.5: este hook ESCRIBE posRef, consumido por otros useFrame
  // (Planet/Saturn, MoonOrbitPath, BodyMarker, useMoonPosition). La banda de
  // escritores garantiza que los lectores priority-0 ven el valor del frame
  // actual (fix de drift #44) SIN usar priority > 0, que en R3F activa el
  // render takeover y congela el canvas cuando no hay EffectComposer (GPU
  // mid/low — bug C1). Invariante: Ticker (-2) → OriginTracker (-1) →
  // position writers (-0.5) → consumers/readers (0) → composer (1).
  useFrame(() => {
    const jd = getJD();
    // Pasar el offset del origen para obtener la posición relativa (REQ-FRAME-1)
    const pos = computePosition(planet, level, jd, viewModeRef.current, originOffsetRef.current);
    posRef.current.set(pos.x, pos.y, pos.z);
  }, -0.5);

  return posRef;
}
