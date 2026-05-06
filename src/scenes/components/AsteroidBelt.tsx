/**
 * Componente <AsteroidBelt> — cinturón de asteroides con instancedMesh.
 *
 * Características:
 * - IcosahedronGeometry(radius, 0) — geometría icosaédrica de baja resolución
 * - Distribución log-normal de radios entre inner_AU y outer_AU
 * - Dispersión vertical gaussiana (vertical_dispersion del config)
 * - Rotación aleatoria por instancia
 * - Count adaptado a useGpuCapability: high=2000, mid=1000, low=500
 * - instancedMesh con name="asteroid-belt" (design §4.12)
 *
 * Semilla determinista: se usa una semilla fija para reproducibilidad en tests.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import type { InstancedMesh } from 'three';
import {
  IcosahedronGeometry,
  MeshStandardMaterial,
  Matrix4,
  Quaternion,
  Euler,
  Vector3,
  Color,
} from 'three';
import { useGpuCapability } from '@/scenes/hooks/useGpuCapability';
import type { AsteroidBeltConfig } from '@/scenes/data/types';
import { visualDistance } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface AsteroidBeltProps {
  config: AsteroidBeltConfig;
}

// ---------------------------------------------------------------------------
// PRNG determinista (Mulberry32) — semilla fija para distribución reproducible
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Genera un número con distribución normal Box-Muller */
function gaussianRandom(rand: () => number, mean = 0, std = 1): number {
  const u = 1 - rand(); // [0, 1)
  const v = rand();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------------------------------------------------------------------------
// Componente AsteroidBelt
// ---------------------------------------------------------------------------

export const AsteroidBelt = React.memo(function AsteroidBelt({ config }: AsteroidBeltProps) {
  const gpu = useGpuCapability();
  const meshRef = useRef<InstancedMesh>(null);

  // Count según capacidad GPU
  const count = useMemo(() => {
    if (gpu === 'high') return config.count_high;
    if (gpu === 'low') return config.count_low;
    return config.count_mid; // mid o null (detectando) → mid como fallback
  }, [gpu, config]);

  // Rango de distancias visuales del cinturón
  const innerDist = useMemo(() => visualDistance(config.inner_AU), [config.inner_AU]);
  const outerDist = useMemo(() => visualDistance(config.outer_AU), [config.outer_AU]);

  // Geometría y material compartidos
  const geometry = useMemo(() => new IcosahedronGeometry(0.02, 0), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(config.color_hex),
        roughness: 0.9,
        metalness: 0.1,
      }),
    [config.color_hex],
  );

  // Generamos las matrices de instancia con semilla fija
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || typeof mesh.setMatrixAt !== 'function') return;

    const rand = mulberry32(0xdeadbeef);
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const euler = new Euler();

    mesh.name = 'asteroid-belt';

    for (let i = 0; i < count; i++) {
      // Distribución log-normal del radio: mapeamos al rango [inner, outer]
      // log-normal: exp(μ + σ*N(0,1)) normalizado al rango visual
      const logMin = Math.log(innerDist);
      const logMax = Math.log(outerDist);
      const logMean = (logMin + logMax) / 2;
      const logStd = (logMax - logMin) / 6; // 3σ cubre el rango
      const r = Math.exp(gaussianRandom(rand, logMean, logStd));
      // Clamp al rango válido
      const rClamped = Math.max(innerDist, Math.min(outerDist, r));

      // Ángulo aleatorio uniforme en [0, 2π)
      const theta = rand() * 2 * Math.PI;

      // Dispersión vertical gaussiana
      const y = gaussianRandom(rand, 0, config.vertical_dispersion);

      position.set(rClamped * Math.cos(theta), y, rClamped * Math.sin(theta));

      // Rotación aleatoria por instancia
      euler.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
      quaternion.setFromEuler(euler);

      // Escala aleatoria entre size_min y size_max
      const s = config.size_min + rand() * (config.size_max - config.size_min);
      scale.set(s, s, s);

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    if (mesh.instanceMatrix && typeof mesh.instanceMatrix === 'object') {
      (mesh.instanceMatrix as { needsUpdate: boolean }).needsUpdate = true;
    }
  }, [count, innerDist, outerDist, config.vertical_dispersion, config.size_min, config.size_max]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      name="asteroid-belt"
      frustumCulled={false}
    />
  );
});

AsteroidBelt.displayName = 'AsteroidBelt';
