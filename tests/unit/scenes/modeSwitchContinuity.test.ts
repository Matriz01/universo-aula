/**
 * Tests de continuidad en cambio de modo — REQ-ORB-3
 *
 * Cubre los dos escenarios de REQ-ORB-3:
 *   1. Global→local switch preserves JD: simulationClock.getJD() NO cambia al
 *      llamar goToBody('earth') ni al volver con goToBody(null).
 *   2. Planet angular continuity across mode switch: computePosition devuelve la
 *      misma dirección angular para el mismo JD, independientemente del viewMode
 *      (solo la escala de distancia varía entre 'global' y 'local').
 *
 * Fundamento arquitectónico:
 *   simulationClock es un singleton a nivel de módulo (no React state, no Zustand).
 *   goToBody() solo muta Zustand (viewMode, selectedPlanet, cameraMode).
 *   Por construcción, ninguna acción sobre el store puede alterar getJD().
 *   Estos tests son la guardia de regresión que lo codifica explícitamente.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as clock from '../../../src/scenes/simulationClock';
import { useAppStore } from '../../../src/store/useAppStore';
import { computePosition } from '../../../src/scenes/hooks/usePlanetPosition';
import type { PlanetData } from '@/scenes/data/types';

// ── Fixture: Mercury (planeta ligero, periodo corto, fácil de razonar) ────────

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

// ── Aislamiento de estado ─────────────────────────────────────────────────────

const KNOWN_JD = clock.J2000_JD + 100; // JD arbitrario conocido

beforeEach(() => {
  // Resetear el reloj a un JD conocido antes de cada test
  clock.reset(KNOWN_JD);
  clock.setPaused(false);
  // Resetear el store a modo global
  useAppStore.getState().goToBody(null);
});

// ── REQ-ORB-3 Escenario 1: Global→local preserva el JD ───────────────────────

describe('REQ-ORB-3 — JD preservation across viewMode switch', () => {
  it('goToBody("earth") no altera simulationClock.getJD()', () => {
    const jdBefore = clock.getJD();
    expect(jdBefore).toBe(KNOWN_JD);

    // Acción: cambiar a modo local (simula click del usuario en la Tierra)
    useAppStore.getState().goToBody('earth');
    expect(useAppStore.getState().viewMode).toBe('local');

    // Aserción: el JD del reloj NO debe haber cambiado
    expect(clock.getJD()).toBe(jdBefore);
  });

  it('goToBody(null) tampoco altera simulationClock.getJD() al volver a global', () => {
    // Ir a local primero
    useAppStore.getState().goToBody('earth');
    const jdInLocal = clock.getJD();

    // Volver a global
    useAppStore.getState().goToBody(null);
    expect(useAppStore.getState().viewMode).toBe('global');

    // Aserción: JD intacto también en el retorno
    expect(clock.getJD()).toBe(jdInLocal);
  });

  it('ciclo completo global→local→global mantiene el JD inalterado', () => {
    const jdOriginal = clock.getJD();

    useAppStore.getState().goToBody('earth');
    useAppStore.getState().goToBody(null);

    expect(clock.getJD()).toBe(jdOriginal);
  });
});

// ── REQ-ORB-3 Escenario 2: Angular continuity para mismo JD ──────────────────
//
// computePosition(planet, level, jd, viewMode) calcula la posición orbital.
// La dirección angular (ángulo en el plano orbital) depende ÚNICAMENTE del JD
// a través de daysSinceJ2000 = jd - J2000_JD. El viewMode solo escala la
// distancia radial (visualDistance vs localVisualDistanceFromAU), no el ángulo.
//
// Invariante: para mismo JD, la dirección normalizada {x,y,z}/|r| es idéntica
// independientemente del viewMode.

describe('REQ-ORB-3 — angular continuity: mismo JD, distinto viewMode', () => {
  it('Mercury nivel explorador: dirección angular idéntica en global y local para mismo JD', () => {
    const jd = KNOWN_JD;
    const posGlobal = computePosition(mercuryData, 'explorador', jd, 'global');
    const posLocal = computePosition(mercuryData, 'explorador', jd, 'local');

    // Calcular magnitudes
    const magGlobal = Math.sqrt(posGlobal.x ** 2 + posGlobal.y ** 2 + posGlobal.z ** 2);
    const magLocal = Math.sqrt(posLocal.x ** 2 + posLocal.y ** 2 + posLocal.z ** 2);

    // Las magnitudes deben ser distintas (escala diferente)
    expect(Math.abs(magGlobal - magLocal)).toBeGreaterThan(0.001);

    // Las direcciones normalizadas deben ser idénticas
    const dirGlobal = {
      x: posGlobal.x / magGlobal,
      y: posGlobal.y / magGlobal,
      z: posGlobal.z / magGlobal,
    };
    const dirLocal = {
      x: posLocal.x / magLocal,
      y: posLocal.y / magLocal,
      z: posLocal.z / magLocal,
    };

    expect(dirGlobal.x).toBeCloseTo(dirLocal.x, 10);
    expect(dirGlobal.y).toBeCloseTo(dirLocal.y, 10);
    expect(dirGlobal.z).toBeCloseTo(dirLocal.z, 10);
  });

  it('Mercury nivel aprendiz: dirección angular idéntica en global y local para mismo JD', () => {
    const jd = KNOWN_JD;
    const posGlobal = computePosition(mercuryData, 'aprendiz', jd, 'global');
    const posLocal = computePosition(mercuryData, 'aprendiz', jd, 'local');

    const magGlobal = Math.sqrt(posGlobal.x ** 2 + posGlobal.y ** 2 + posGlobal.z ** 2);
    const magLocal = Math.sqrt(posLocal.x ** 2 + posLocal.y ** 2 + posLocal.z ** 2);

    const dirGlobal = {
      x: posGlobal.x / magGlobal,
      y: posGlobal.y / magGlobal,
      z: posGlobal.z / magGlobal,
    };
    const dirLocal = {
      x: posLocal.x / magLocal,
      y: posLocal.y / magLocal,
      z: posLocal.z / magLocal,
    };

    expect(dirGlobal.x).toBeCloseTo(dirLocal.x, 10);
    expect(dirGlobal.z).toBeCloseTo(dirLocal.z, 10);
  });
});
