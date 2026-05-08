/**
 * Tests para MoonOrbitPath — geometría inclinada de la órbita lunar.
 *
 * Verifica que los puntos generados para el path NO están todos en el plano Y=0,
 * confirmando que la órbita es una elipse 3D inclinada (~5.14°) y no un
 * círculo plano en el plano XZ.
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computeMoonPosition } from '@/scenes/hooks/useMoonPosition';
import { J2000_JD } from '@/scenes/simulationClock';
import { MOON_ORBITAL_ELEMENTS } from '@/scenes/data/moon';

describe('MoonOrbitPath — geometría inclinada', () => {
  it('los puntos de la órbita NO están todos en el plano Y=0 (|y| > 1e-4 en algún punto)', () => {
    const earthPos = new Vector3(0, 0, 0);
    const N = 64;
    const period = MOON_ORBITAL_ELEMENTS.orbital_period_days;

    const points: Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const jd = J2000_JD + (i / N) * period;
      points.push(computeMoonPosition(earthPos, jd));
    }

    // Al menos un punto debe tener componente Y significativa (órbita inclinada)
    const maxY = Math.max(...points.map((p) => Math.abs(p.y)));
    expect(maxY).toBeGreaterThan(1e-4);
  });

  it('los puntos forman una elipse con radio coherente con la distancia Tierra-Luna', () => {
    const earthPos = new Vector3(0, 0, 0);
    const N = 64;
    const period = MOON_ORBITAL_ELEMENTS.orbital_period_days;

    const distances: number[] = [];
    for (let i = 0; i < N; i++) {
      const jd = J2000_JD + (i / N) * period;
      const pos = computeMoonPosition(earthPos, jd);
      distances.push(pos.length());
    }

    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    // Todos los puntos deben estar a distancia positiva del origen
    expect(minDist).toBeGreaterThan(0);
    // La distancia debe variar (elipse con e=0.0549, no círculo perfecto)
    expect(maxDist).toBeGreaterThan(minDist);
    // La variación relativa debe ser consistente con e=0.0549
    // Para una elipse: r_max/r_min = (1+e)/(1-e) ≈ 1.116
    const ratio = maxDist / minDist;
    expect(ratio).toBeGreaterThan(1.05);
  });
});
