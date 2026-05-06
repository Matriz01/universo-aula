/**
 * Tests para usePlanetPosition — hook de posición orbital.
 *
 * Estrategia: no montamos el hook React (requiere R3F). En cambio,
 * extraemos las funciones puras de la lógica orbital y las testamos
 * directamente con un helper `computeAt` que simula la posición de
 * un planeta en `tDays` días desde J2000.
 *
 * Tasks 4.1 (TEST) → 4.2 (IMPL)
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import {
  solveKeplerNewtonRaphson,
  applyOrbitalRotation,
  degToRad,
  SPEEDUP_EXPLORADOR,
  SPEEDUP_APRENDIZ,
} from '@/scenes/orbital';
import { visualDistance } from '@/scenes/scale';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Fixtures mínimos (datos NASA JPL J2000)
// ---------------------------------------------------------------------------

const earthData: PlanetData = {
  id: 'earth',
  classification: 'terrestrial',
  radius_km: 6371.0,
  mass_kg: 5.972e24,
  density_g_cm3: 5.514,
  gravity_m_s2: 9.807,
  rotation_period_h: 23.9345,
  axial_tilt_deg: 23.4393,
  mean_temperature_k: 288,
  semi_major_axis_AU: 1.0,
  eccentricity: 0.01671,
  inclination_deg: 0.00005,
  longitude_ascending_node_deg: -11.26064,
  argument_perihelion_deg: 114.20783,
  mean_anomaly_J2000_deg: 358.617,
  orbital_period_days: 365.256,
  color_hex: '#4a90e2',
  has_rings: false,
  moons_count: 1,
  texture_base: '/textures/earth/',
};

const mercuryData: PlanetData = {
  id: 'mercury',
  classification: 'terrestrial',
  radius_km: 2439.7,
  mass_kg: 3.3011e23,
  density_g_cm3: 5.427,
  gravity_m_s2: 3.7,
  rotation_period_h: 1407.6,
  axial_tilt_deg: 0.034,
  mean_temperature_k: 440,
  semi_major_axis_AU: 0.387098,
  eccentricity: 0.20563,
  inclination_deg: 7.005,
  longitude_ascending_node_deg: 48.331,
  argument_perihelion_deg: 29.124,
  mean_anomaly_J2000_deg: 174.796,
  orbital_period_days: 87.969,
  color_hex: '#8c7853',
  has_rings: false,
  moons_count: 0,
  texture_base: '/textures/mercury/',
};

// ---------------------------------------------------------------------------
// Helper computeAt — simula la posición del planeta sin React/useFrame
// Implementa el mismo algoritmo que usePlanetPosition internamente.
// ---------------------------------------------------------------------------

type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';

function computeAt(planet: PlanetData, level: PedagogicalLevel, tDays: number): Vector3 {
  const a = visualDistance(planet.semi_major_axis_AU);
  const b = a * Math.sqrt(1 - planet.eccentricity ** 2);
  const n = (2 * Math.PI) / planet.orbital_period_days; // rad/día
  const M0 = degToRad(planet.mean_anomaly_J2000_deg);
  const omega = degToRad(planet.argument_perihelion_deg);
  const Omega = degToRad(planet.longitude_ascending_node_deg);
  const inc = degToRad(planet.inclination_deg);

  // elapsed simulado en días — equivale a dt * speedup * (1 s / speedup) acumulado
  const elapsed = tDays;

  const pos = new Vector3();

  if (level === 'explorador') {
    const theta = n * elapsed;
    pos.set(a * Math.cos(theta), 0, a * Math.sin(theta));
  } else if (level === 'aprendiz') {
    const theta = n * elapsed;
    pos.set(a * Math.cos(theta), 0, b * Math.sin(theta));
  } else {
    // investigador — Kepler completo
    const M = M0 + n * elapsed;
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

  return pos;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeAt — nivel Explorador (circular)', () => {
  it('Earth en t=0: Y=0 y módulo ≈ visualDistance(1.0)', () => {
    const pos = computeAt(earthData, 'explorador', 0);
    expect(pos.y).toBeCloseTo(0, 10);
    expect(pos.length()).toBeCloseTo(visualDistance(1.0), 3);
  });

  it('Earth módulo constante a lo largo de la órbita (circular)', () => {
    const period = earthData.orbital_period_days;
    const r0 = computeAt(earthData, 'explorador', 0).length();
    const r1 = computeAt(earthData, 'explorador', period / 4).length();
    const r2 = computeAt(earthData, 'explorador', period / 2).length();
    expect(r1).toBeCloseTo(r0, 3);
    expect(r2).toBeCloseTo(r0, 3);
  });

  it('Mars en t=period completa una vuelta (posición ≈ t=0)', () => {
    // Órbita circular: en t=period debe volver al mismo punto
    const marsData: PlanetData = {
      id: 'mars',
      classification: 'terrestrial',
      radius_km: 3389.5,
      mass_kg: 6.4171e23,
      density_g_cm3: 3.9335,
      gravity_m_s2: 3.71,
      rotation_period_h: 24.6229,
      axial_tilt_deg: 25.19,
      mean_temperature_k: 210,
      semi_major_axis_AU: 1.523679,
      eccentricity: 0.0934,
      inclination_deg: 1.85,
      longitude_ascending_node_deg: 49.558,
      argument_perihelion_deg: 286.502,
      mean_anomaly_J2000_deg: 19.412,
      orbital_period_days: 686.98,
      color_hex: '#c1440e',
      has_rings: false,
      moons_count: 2,
      texture_base: '/textures/mars/',
    };
    const p0 = computeAt(marsData, 'explorador', 0);
    const p1 = computeAt(marsData, 'explorador', marsData.orbital_period_days);
    expect(p0.x).toBeCloseTo(p1.x, 3);
    expect(p0.z).toBeCloseTo(p1.z, 3);
  });

  it('Y siempre cero en órbita circular', () => {
    [0, 100, 200, 300].forEach((t) => {
      const pos = computeAt(earthData, 'explorador', t);
      expect(pos.y).toBeCloseTo(0, 10);
    });
  });
});

describe('computeAt — nivel Aprendiz (elipse)', () => {
  it('Mercury en t=period/4 satisface ecuación de elipse (x²/a² + z²/b² ≈ 1)', () => {
    const a = visualDistance(mercuryData.semi_major_axis_AU);
    const b = a * Math.sqrt(1 - mercuryData.eccentricity ** 2);
    const t = mercuryData.orbital_period_days / 4;
    const pos = computeAt(mercuryData, 'aprendiz', t);
    // La elipse aproximada: x²/a² + z²/b² ≈ 1
    const check = (pos.x * pos.x) / (a * a) + (pos.z * pos.z) / (b * b);
    expect(check).toBeCloseTo(1, 2);
  });

  it('Mercury semi-ejes mayor y menor son distintos (órbita no circular)', () => {
    const a = visualDistance(mercuryData.semi_major_axis_AU);
    const b = a * Math.sqrt(1 - mercuryData.eccentricity ** 2);
    expect(b).toBeLessThan(a);
    expect(a - b).toBeGreaterThan(0.01);
  });
});

describe('computeAt — nivel Investigador (Kepler completo)', () => {
  it('Mercury con inclinación produce Y ≠ 0 en algún punto de la órbita', () => {
    // Mercury tiene inclination_deg=7.005, Y debería ser no nulo
    const pos = computeAt(mercuryData, 'investigador', mercuryData.orbital_period_days / 4);
    // Con inclinación y argumento perihelio, Y debe ser distinto de 0
    expect(Math.abs(pos.y)).toBeGreaterThan(0.001);
  });

  it('Earth en t=0 tiene |Y| muy pequeño (eclíptica de referencia)', () => {
    const pos = computeAt(earthData, 'investigador', 0);
    // Earth tiene inclinación ~0.00005°, casi en el plano eclíptico
    expect(Math.abs(pos.y)).toBeLessThan(0.1);
  });

  it('Mercury radio medio ≈ visualDistance(semi_major_axis_AU)', () => {
    // En media de 4 puntos la distancia debe aproximarse a a*(1-e²/2) ≈ a
    const positions = [0, 1, 2, 3].map((i) =>
      computeAt(mercuryData, 'investigador', (i * mercuryData.orbital_period_days) / 4),
    );
    const avgR = positions.reduce((s, p) => s + p.length(), 0) / positions.length;
    const a = visualDistance(mercuryData.semi_major_axis_AU);
    // La media debería estar entre 0.8*a y 1.2*a
    expect(avgR).toBeGreaterThan(0.8 * a);
    expect(avgR).toBeLessThan(1.2 * a);
  });
});

describe('speedups — constantes de aceleración', () => {
  it('SPEEDUP_EXPLORADOR = 30', () => {
    expect(SPEEDUP_EXPLORADOR).toBe(30);
  });

  it('SPEEDUP_APRENDIZ = 10', () => {
    expect(SPEEDUP_APRENDIZ).toBe(10);
  });
});
