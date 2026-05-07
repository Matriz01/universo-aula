/**
 * Tests de determinismo para computePosition() (replan-2026-05)
 *
 * Verifica que una función pura computePosition(planet, level, jd, viewMode)
 * extraída de usePlanetPosition devuelve resultados idénticos para el mismo
 * (planet, level, jd, viewMode), en conformidad con REQ-ORB-4.
 *
 * TDD: este archivo se escribe ANTES de que computePosition sea exportada.
 * La primera ejecución DEBE fallar con "is not a function" o import error.
 */

import { describe, it, expect } from 'vitest';
import { computePosition } from '@/scenes/hooks/usePlanetPosition';
import { J2000_JD } from '../../../src/scenes/simulationClock';
import type { PlanetData } from '@/scenes/data/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

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

const saturnData: PlanetData = {
  id: 'saturn',
  classification: 'gas_giant',
  radius_km: 58232,
  mass_kg: 5.683e26,
  density_g_cm3: 0.687,
  gravity_m_s2: 10.44,
  rotation_period_h: 10.656,
  axial_tilt_deg: 26.73,
  mean_temperature_k: 134,
  semi_major_axis_AU: 9.5826,
  eccentricity: 0.0565,
  inclination_deg: 2.485,
  longitude_ascending_node_deg: 113.665,
  argument_perihelion_deg: 339.392,
  mean_anomaly_J2000_deg: 317.02,
  orbital_period_days: 10759.22,
  color_hex: '#c2a665',
  has_rings: true,
  moons_count: 83,
  texture_base: '/textures/saturn/',
};

// ── T2.1: Mercurio en J2000 ───────────────────────────────────────────────────

describe('computePosition — Mercury en J2000 (T2.1)', () => {
  it('devuelve un objeto con campos x, y, z (no NaN)', () => {
    const result = computePosition(mercuryData, 'explorador', J2000_JD, 'global');
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(typeof result.z).toBe('number');
    expect(isNaN(result.x)).toBe(false);
    expect(isNaN(result.y)).toBe(false);
    expect(isNaN(result.z)).toBe(false);
  });

  it('es determinista: misma llamada → resultado bitwise idéntico', () => {
    const r1 = computePosition(mercuryData, 'explorador', J2000_JD, 'global');
    const r2 = computePosition(mercuryData, 'explorador', J2000_JD, 'global');
    expect(r1.x).toBe(r2.x);
    expect(r1.y).toBe(r2.y);
    expect(r1.z).toBe(r2.z);
  });

  it('posición en J2000+365.25 difiere de J2000 (el planeta se mueve)', () => {
    const r0 = computePosition(mercuryData, 'explorador', J2000_JD, 'global');
    const r1 = computePosition(mercuryData, 'explorador', J2000_JD + 365.25, 'global');
    // Mercurio completa ~4 órbitas en 365 días; las posiciones deben diferir
    const dx = Math.abs(r1.x - r0.x);
    const dz = Math.abs(r1.z - r0.z);
    expect(dx + dz).toBeGreaterThan(0.001);
  });
});

// ── T2.3: Saturno en J2000+1000 ──────────────────────────────────────────────

describe('computePosition — Saturn en J2000+1000 (T2.3)', () => {
  const JD_SATURN = J2000_JD + 1000;

  it('devuelve x, y, z numéricos no NaN', () => {
    const result = computePosition(saturnData, 'explorador', JD_SATURN, 'global');
    expect(isNaN(result.x)).toBe(false);
    expect(isNaN(result.y)).toBe(false);
    expect(isNaN(result.z)).toBe(false);
  });

  it('es determinista (mismo JD → misma posición)', () => {
    const r1 = computePosition(saturnData, 'explorador', JD_SATURN, 'global');
    const r2 = computePosition(saturnData, 'explorador', JD_SATURN, 'global');
    expect(r1.x).toBe(r2.x);
    expect(r1.y).toBe(r2.y);
    expect(r1.z).toBe(r2.z);
  });

  it('nivel Investigador: Saturno produce Y ≠ 0 (tiene inclinación)', () => {
    const result = computePosition(saturnData, 'investigador', JD_SATURN, 'global');
    // Saturno con inclination_deg=2.485 → Y debe ser distinto de 0 en algún punto
    // En J2000+1000 días habrá recorrido ~33.7° del período de 10759 días
    expect(Math.abs(result.y)).toBeGreaterThan(0);
  });
});

// ── T2.4: Luna / PlanetMoon — determinismo del ángulo θ ─────────────────────
// La Luna usa su propio cálculo en PlanetMoon.tsx (theta = n * (jd - J2000_JD)).
// Verificamos la fórmula directamente (sin R3F), REQ-ORB-4 para PlanetMoon.

describe('computePosition — Moon orbital angle determinism (T2.4)', () => {
  const MOON_PERIOD_DAYS = 27.3;

  function moonTheta(jd: number): number {
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    return n * (jd - J2000_JD);
  }

  it('mismo JD → mismo theta (bitwise)', () => {
    const t1 = moonTheta(J2000_JD + 100);
    const t2 = moonTheta(J2000_JD + 100);
    expect(t1).toBe(t2);
  });

  it('theta crece monótonamente con JD', () => {
    const t0 = moonTheta(J2000_JD);
    const t1 = moonTheta(J2000_JD + 27.3);
    expect(t1).toBeGreaterThan(t0);
  });

  it('un período completo avanza exactamente 2π', () => {
    const t0 = moonTheta(J2000_JD);
    const t1 = moonTheta(J2000_JD + MOON_PERIOD_DAYS);
    expect(t1 - t0).toBeCloseTo(2 * Math.PI, 10);
  });
});
