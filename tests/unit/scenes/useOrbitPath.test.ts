/**
 * Tests para useOrbitPath — genera los puntos de la trayectoria orbital.
 *
 * Estrategia: testamos la función pura `computeOrbitPoints` que el hook
 * usa internamente, sin montar React. El hook es un wrapper React.
 *
 * Tasks 4.3 (TEST) → 4.4 (IMPL)
 */

import { describe, it, expect } from 'vitest';
import { computeOrbitPoints } from '@/scenes/hooks/useOrbitPath';
import { visualDistance } from '@/scenes/scale';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Fixtures
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
// Tests
// ---------------------------------------------------------------------------

describe('computeOrbitPoints — nivel Explorador (circular)', () => {
  it('Earth: genera 128 puntos por defecto', () => {
    const pts = computeOrbitPoints(earthData, 'explorador');
    expect(pts).toHaveLength(128);
  });

  it('Earth: todos los puntos tienen Y=0', () => {
    const pts = computeOrbitPoints(earthData, 'explorador');
    pts.forEach((p) => {
      expect(p.y).toBeCloseTo(0, 10);
    });
  });

  it('Earth: todos los puntos tienen módulo ≈ visualDistance(1.0)', () => {
    const d = visualDistance(1.0);
    const pts = computeOrbitPoints(earthData, 'explorador');
    pts.forEach((p) => {
      expect(p.length()).toBeCloseTo(d, 2);
    });
  });

  it('primer y último punto son iguales (órbita cerrada)', () => {
    const pts = computeOrbitPoints(earthData, 'explorador');
    const first = pts[0];
    const last = pts[pts.length - 1];
    expect(first.x).toBeCloseTo(last.x, 3);
    expect(first.z).toBeCloseTo(last.z, 3);
  });

  it('acepta parámetro segments personalizado', () => {
    const pts = computeOrbitPoints(earthData, 'explorador', 64);
    expect(pts).toHaveLength(64);
  });
});

describe('computeOrbitPoints — nivel Aprendiz (elipse)', () => {
  it('Mercury: genera 128 puntos', () => {
    const pts = computeOrbitPoints(mercuryData, 'aprendiz');
    expect(pts).toHaveLength(128);
  });

  it('Mercury: los puntos forman una elipse (distancia máx ≠ distancia mín)', () => {
    const pts = computeOrbitPoints(mercuryData, 'aprendiz');
    const radii = pts.map((p) => Math.sqrt(p.x * p.x + p.z * p.z));
    const rMax = Math.max(...radii);
    const rMin = Math.min(...radii);
    // Mercury tiene e=0.20563, la diferencia rMax-rMin debe ser perceptible
    expect(rMax - rMin).toBeGreaterThan(0.1);
  });

  it('Mercury: todos los puntos tienen Y=0 (elipse plana nivel aprendiz)', () => {
    const pts = computeOrbitPoints(mercuryData, 'aprendiz');
    pts.forEach((p) => {
      expect(p.y).toBeCloseTo(0, 10);
    });
  });

  it('primer y último punto son iguales (órbita cerrada)', () => {
    const pts = computeOrbitPoints(mercuryData, 'aprendiz');
    const first = pts[0];
    const last = pts[pts.length - 1];
    expect(first.x).toBeCloseTo(last.x, 3);
    expect(first.z).toBeCloseTo(last.z, 3);
  });
});

describe('computeOrbitPoints — nivel Investigador (Kepler 3D)', () => {
  it('Mercury: algunos puntos tienen Y ≠ 0 (inclinación 3D)', () => {
    const pts = computeOrbitPoints(mercuryData, 'investigador');
    const hasNonZeroY = pts.some((p) => Math.abs(p.y) > 0.001);
    expect(hasNonZeroY).toBe(true);
  });

  it('Earth: Y muy pequeño (casi en eclíptica)', () => {
    const pts = computeOrbitPoints(earthData, 'investigador');
    const maxY = Math.max(...pts.map((p) => Math.abs(p.y)));
    expect(maxY).toBeLessThan(0.05);
  });
});
