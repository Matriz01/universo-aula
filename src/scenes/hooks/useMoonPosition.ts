/**
 * Hook useMoonPosition — calcula la posición geocéntrica de la Luna.
 *
 * Exporta:
 * - computeMoonPosition: función pura testeable (sin React, sin Three.js hooks)
 * - useMoonPosition: hook React que actualiza la posición en cada frame
 *
 * Modelo orbital: Kepler completo con applyOrbitalRotation 3D usando los
 * elementos geocéntricos de MOON_ORBITAL_ELEMENTS (inclination ~5.14°).
 *
 * Escala: 1 unidad de escena = 1000 km (localVisualDistanceFromKm).
 */

import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { MOON_ORBITAL_ELEMENTS } from '@/scenes/data/moon';
import { solveKeplerNewtonRaphson, applyOrbitalRotation, degToRad } from '@/scenes/orbital';
import { localVisualDistanceFromKm } from '@/scenes/scale';
import { J2000_JD, getJD } from '@/scenes/simulationClock';

// ---------------------------------------------------------------------------
// computeMoonPosition — función pura testeable
// ---------------------------------------------------------------------------

/**
 * Calcula la posición tridimensional de la Luna para el JD indicado.
 *
 * Algoritmo:
 * 1. Anomalía media M = M0 + (360/T) * (jd - J2000)
 * 2. Resolver ecuación de Kepler → anomalía excéntrica E (Newton-Raphson)
 * 3. Calcular anomalía verdadera ν y radio r
 * 4. Aplicar rotaciones orbitales (ω, i, Ω) con applyOrbitalRotation
 * 5. Escalar la distancia: 1 u = 1000 km
 * 6. Sumar earthWorldPos para obtener posición en coordenadas mundiales
 *
 * @param earthWorldPos - Posición de la Tierra en el espacio mundial (Vector3)
 * @param jd            - Julian Date actual
 * @returns Vector3 con la posición de la Luna en coordenadas mundiales
 */
export function computeMoonPosition(earthWorldPos: Vector3, jd: number): Vector3 {
  const {
    semi_major_axis_km,
    eccentricity,
    inclination_deg,
    longitude_ascending_node_deg,
    argument_perihelion_deg,
    mean_anomaly_J2000_deg,
    orbital_period_days,
  } = MOON_ORBITAL_ELEMENTS;

  // Semieje mayor en unidades de escena (1 u = 1000 km)
  const a = localVisualDistanceFromKm(semi_major_axis_km);

  // Movimiento medio en rad/día
  const n = (2 * Math.PI) / orbital_period_days;

  // Anomalía media para el JD dado
  const M0 = degToRad(mean_anomaly_J2000_deg);
  const M = M0 + n * (jd - J2000_JD);

  // Resolver ecuación de Kepler
  const E = solveKeplerNewtonRaphson(M, eccentricity, 1e-6, 8);

  // Anomalía verdadera ν
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2),
    );

  // Radio vectorial en unidades de escena
  const r = a * (1 - eccentricity * Math.cos(E));

  // Ángulos en radianes
  const omega = degToRad(argument_perihelion_deg);
  const Omega = degToRad(longitude_ascending_node_deg);
  const inc = degToRad(inclination_deg);

  // Aplicar rotaciones orbitales 3D → posición geocéntrica
  const moonRelative = new Vector3();
  applyOrbitalRotation(moonRelative, r, nu, omega, Omega, inc);

  // Posición mundial = posición geocéntrica + posición de la Tierra
  return moonRelative.add(earthWorldPos);
}

// ---------------------------------------------------------------------------
// useMoonPosition — hook React per-frame
// ---------------------------------------------------------------------------

/**
 * Hook que actualiza la posición de la Luna en cada frame de animación.
 *
 * Lee el Julian Date desde simulationClock.getJD() de forma imperativa
 * (sin suscripción React) — no provoca re-renders.
 *
 * @param earthPosRef - Ref a la posición actual de la Tierra (actualizada por usePlanetPosition)
 * @returns MutableRefObject<Vector3> con la posición de la Luna (actualizado en useFrame)
 */
export function useMoonPosition(earthPosRef: MutableRefObject<Vector3>): MutableRefObject<Vector3> {
  const moonPosRef = useRef<Vector3>(new Vector3());

  // Priority -0.5: este hook ESCRIBE moonPosRef (consumido por PlanetMoon y
  // MoonMarker→BodyMarker) → banda de escritores. NO usar priority > 0 (render
  // takeover de R3F: congela el canvas sin EffectComposer — bug C1).
  // Cadena writer→writer: este hook LEE earthPosRef, escrito por
  // usePlanetPosition (también -0.5). El orden intra-banda es por orden de
  // montaje (sort estable de R3F) y usePlanetPosition se invoca siempre antes
  // que useMoonPosition en los componentes que los combinan (MoonMarker,
  // PlanetMoon) — el mismo orden que tenían cuando ambos iban en priority 0.
  useFrame(() => {
    const jd = getJD();
    // earthPosRef.current YA viene con el originOffset aplicado por usePlanetPosition,
    // así que computeMoonPosition recibe Earth en el frame del cuerpo seleccionado y
    // retorna la posición de la Luna ya en ese mismo frame. NO restar offset aquí —
    // hacerlo es doble-offset y deja la Luna a ~150 000 unidades fuera de cámara
    // (regresión de Phase C orbital-fidelity, enmascarada por test con offset=0).
    const moonPos = computeMoonPosition(earthPosRef.current, jd);
    moonPosRef.current.copy(moonPos);
  }, -0.5);

  return moonPosRef;
}
