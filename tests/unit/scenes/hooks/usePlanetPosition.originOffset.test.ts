/**
 * Tests para computePosition con el parámetro originOffset (Phase C, T C.1).
 *
 * REQ-FRAME-1: el cuerpo seleccionado recibe su propia posición como originOffset
 * y obtiene (0,0,0) como resultado. Otros planetas obtienen la posición relativa.
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computePosition } from '@/scenes/hooks/usePlanetPosition';
import type { PlanetData } from '@/scenes/data/types';
import { J2000_JD } from '@/scenes/simulationClock';

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

// ---------------------------------------------------------------------------
// T C.1 — computePosition con originOffset
// ---------------------------------------------------------------------------

describe('computePosition — originOffset (REQ-FRAME-1)', () => {
  const jd = J2000_JD + 100; // 100 días desde J2000

  it('Cuerpo seleccionado retorna (0,0,0) cuando originOffset === su posición absoluta', () => {
    // Calcular posición absoluta de la Tierra primero (sin offset)
    const absPos = computePosition(earthData, 'investigador', jd, 'local');
    const absVec = new Vector3(absPos.x, absPos.y, absPos.z);

    // Con originOffset = posición absoluta → debe ser (0,0,0)
    const relPos = computePosition(earthData, 'investigador', jd, 'local', absVec);
    expect(relPos.x).toBeCloseTo(0, 5);
    expect(relPos.y).toBeCloseTo(0, 5);
    expect(relPos.z).toBeCloseTo(0, 5);
  });

  it('Otro planeta retorna posición relativa (marsAbsPos - earthAbsPos)', () => {
    const earthAbs = computePosition(earthData, 'investigador', jd, 'local');
    const marsAbs = computePosition(marsData, 'investigador', jd, 'local');

    const earthVec = new Vector3(earthAbs.x, earthAbs.y, earthAbs.z);
    const marsVec = new Vector3(marsAbs.x, marsAbs.y, marsAbs.z);

    // Mars con earthOffset
    const marsRel = computePosition(marsData, 'investigador', jd, 'local', earthVec);
    const marsRelVec = new Vector3(marsRel.x, marsRel.y, marsRel.z);

    // Debería ser marsAbsPos - earthAbsPos
    const expectedRel = marsVec.clone().sub(earthVec);
    expect(marsRelVec.x).toBeCloseTo(expectedRel.x, 4);
    expect(marsRelVec.y).toBeCloseTo(expectedRel.y, 4);
    expect(marsRelVec.z).toBeCloseTo(expectedRel.z, 4);
  });

  it('originOffset omitido en modo global → resultado idéntico a sin offset (regresión)', () => {
    // Modo global con y sin offset omitido debe ser igual
    const withoutOffset = computePosition(earthData, 'investigador', jd, 'global');
    const withZeroOffset = computePosition(
      earthData,
      'investigador',
      jd,
      'global',
      new Vector3(0, 0, 0),
    );

    expect(withoutOffset.x).toBeCloseTo(withZeroOffset.x, 8);
    expect(withoutOffset.y).toBeCloseTo(withZeroOffset.y, 8);
    expect(withoutOffset.z).toBeCloseTo(withZeroOffset.z, 8);
  });

  it('originOffset omitido en modo local → posición absoluta (offset (0,0,0) implícito)', () => {
    // Sin offset, el resultado en modo local es la posición absoluta
    const absPos = computePosition(earthData, 'investigador', jd, 'local');
    const withZeroOffset = computePosition(
      earthData,
      'investigador',
      jd,
      'local',
      new Vector3(0, 0, 0),
    );

    expect(absPos.x).toBeCloseTo(withZeroOffset.x, 8);
    expect(absPos.y).toBeCloseTo(withZeroOffset.y, 8);
    expect(absPos.z).toBeCloseTo(withZeroOffset.z, 8);
  });

  it('resultado es distinto si el originOffset es distinto', () => {
    const earthAbs = computePosition(earthData, 'investigador', jd, 'local');
    const marsAbs = computePosition(marsData, 'investigador', jd, 'local');

    const earthVec = new Vector3(earthAbs.x, earthAbs.y, earthAbs.z);
    const marsVec = new Vector3(marsAbs.x, marsAbs.y, marsAbs.z);

    // Mars relativo a Tierra vs Mars relativo a sí mismo
    const marsRelToEarth = computePosition(marsData, 'investigador', jd, 'local', earthVec);
    const marsRelToMars = computePosition(marsData, 'investigador', jd, 'local', marsVec);

    const relToEarthVec = new Vector3(marsRelToEarth.x, marsRelToEarth.y, marsRelToEarth.z);
    const relToMarsVec = new Vector3(marsRelToMars.x, marsRelToMars.y, marsRelToMars.z);

    // relToMars debe ser ~(0,0,0), relToEarth debe ser != (0,0,0)
    expect(relToMarsVec.length()).toBeLessThan(1e-5);
    expect(relToEarthVec.length()).toBeGreaterThan(0.1);
  });
});
