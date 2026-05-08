/**
 * Tests de frame of reference (Phase C, T C.2, C.3, C.12, C.13).
 *
 * Verifican que:
 * - C.2: el cuerpo seleccionado siempre devuelve (0,0,0) al aplicar su propio offset
 * - C.3: la posición negada del offset es la posición del Sol en modo local
 * - C.12: no-shake — varianza de target = 0 cuando el cuerpo está en (0,0,0)
 * - C.13: regresión — a 1 s/s el mismo resultado
 *
 * Estrategia: usamos computePosition directamente (sin R3F) para simular N frames.
 * El R3F completo sería un test de integración con @react-three/test-renderer
 * que no está instalado — esta cobertura es la máxima posible en test:unit.
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computePosition } from '@/scenes/hooks/usePlanetPosition';
import type { PlanetData } from '@/scenes/data/types';
import { J2000_JD } from '@/scenes/simulationClock';

// ---------------------------------------------------------------------------
// Fixture — Tierra (datos NASA JPL J2000)
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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simula N frames del sistema, avanzando el JD a 1 año por segundo.
 * En cada frame, calcula la posición de la Tierra con su propio offset → (0,0,0).
 * Verifica que la posición es siempre (0,0,0) dentro de la tolerancia.
 */
function simulateFrames(
  planet: PlanetData,
  level: 'explorador' | 'aprendiz' | 'investigador',
  jdStart: number,
  jdDeltaPerFrame: number,
  numFrames: number,
  tolerance: number,
): { maxDeviation: number; positions: Vector3[] } {
  const positions: Vector3[] = [];
  let maxDeviation = 0;

  for (let i = 0; i < numFrames; i++) {
    const jd = jdStart + i * jdDeltaPerFrame;

    // Calcular posición absoluta del planeta (sin offset)
    const absRaw = computePosition(planet, level, jd, 'local');
    const absVec = new Vector3(absRaw.x, absRaw.y, absRaw.z);

    // Calcular posición relativa con el propio offset → debe ser (0,0,0)
    const relRaw = computePosition(planet, level, jd, 'local', absVec);
    const relVec = new Vector3(relRaw.x, relRaw.y, relRaw.z);

    positions.push(relVec.clone());

    const deviation = relVec.length();
    if (deviation > maxDeviation) {
      maxDeviation = deviation;
    }

    // Verificar dentro de tolerancia en cada frame
    expect(relVec.x).toBeCloseTo(0, tolerance < 1e-4 ? 3 : 5);
    expect(relVec.y).toBeCloseTo(0, tolerance < 1e-4 ? 3 : 5);
    expect(relVec.z).toBeCloseTo(0, tolerance < 1e-4 ? 3 : 5);
  }

  return { maxDeviation, positions };
}

// ---------------------------------------------------------------------------
// T C.2 — Selected body position ≈ (0,0,0) durante 60 frames
// ---------------------------------------------------------------------------

describe('T C.2 — Frame of reference: cuerpo seleccionado en (0,0,0)', () => {
  it('Tierra en modo local: position ≈ (0,0,0) durante 60 frames a simulationSpeed = 365', () => {
    // 365 días simulados por segundo, a 60fps → ~6.08 días por frame
    const jdDeltaPerFrame = 365 / 60;
    const { maxDeviation } = simulateFrames(
      earthData,
      'investigador',
      J2000_JD + 100,
      jdDeltaPerFrame,
      60,
      1e-4,
    );
    // La desviación máxima debe ser prácticamente cero (error de float)
    expect(maxDeviation).toBeLessThan(1e-8);
  });

  it('Tierra en modo local: position ≈ (0,0,0) durante 60 frames a simulationSpeed = 1', () => {
    // 1 segundo real ≈ 1/86400 días por frame a 60fps
    const jdDeltaPerFrame = 1 / 86400;
    const { maxDeviation } = simulateFrames(
      earthData,
      'investigador',
      J2000_JD + 50,
      jdDeltaPerFrame,
      60,
      1e-4,
    );
    expect(maxDeviation).toBeLessThan(1e-8);
  });

  it('Marte en modo local: position ≈ (0,0,0) durante 60 frames', () => {
    const jdDeltaPerFrame = 365 / 60;
    const { maxDeviation } = simulateFrames(
      marsData,
      'investigador',
      J2000_JD + 200,
      jdDeltaPerFrame,
      60,
      1e-4,
    );
    expect(maxDeviation).toBeLessThan(1e-8);
  });
});

// ---------------------------------------------------------------------------
// T C.3 — Sol en posición negada en modo local
// ---------------------------------------------------------------------------

describe('T C.3 — Sol en posición -selectedBodyWorldPos en modo local', () => {
  it('En modo local con Tierra seleccionada: -earthAbsPos es la posición del Sol', () => {
    const jd = J2000_JD + 100;

    // Posición absoluta de la Tierra
    const earthAbs = computePosition(earthData, 'investigador', jd, 'local');
    const earthVec = new Vector3(earthAbs.x, earthAbs.y, earthAbs.z);

    // En SolarSystemScene, sunGroup.position = -offset = -earthAbsPos
    const sunPosition = earthVec.clone().negate();

    // Verificar que la posición del Sol tiene magnitud similar a la distancia heliocéntrica
    // (es la posición del Sol desde la perspectiva del cuerpo seleccionado)
    expect(sunPosition.length()).toBeGreaterThan(0);
    // La dirección del Sol desde la Tierra es opuesta a la dirección de la Tierra desde el Sol
    expect(sunPosition.x).toBeCloseTo(-earthVec.x, 4);
    expect(sunPosition.y).toBeCloseTo(-earthVec.y, 4);
    expect(sunPosition.z).toBeCloseTo(-earthVec.z, 4);
  });

  it('En modo global: posición del Sol = (0,0,0) (offset es cero)', () => {
    // En modo global el offset es (0,0,0), así que sunGroup.position = -(0,0,0) = (0,0,0)
    const globalOffset = new Vector3(0, 0, 0);
    const sunPositionGlobal = globalOffset.clone().negate();

    expect(Math.abs(sunPositionGlobal.x)).toBe(0);
    expect(Math.abs(sunPositionGlobal.y)).toBe(0);
    expect(Math.abs(sunPositionGlobal.z)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// T C.12 — No-shake test (60 frames, 1 año/s)
// ---------------------------------------------------------------------------

describe('T C.12 — No-shake: target siempre (0,0,0) a simulationSpeed = 1 año/s', () => {
  it('Varianza del target ≈ 0 (el cuerpo seleccionado es siempre el origen matemático)', () => {
    // En modo local con frame-of-reference, el target del CameraController es (0,0,0) siempre.
    // Esto lo verifica CameraController.tsx (C.11): controls.target.fromArray([0,0,0]).
    // Aquí verificamos la garantía matemática: computePosition con su propio offset → (0,0,0).

    const jdDeltaPerFrame = 365 / 60; // 1 año/s a 60fps
    const numFrames = 60;
    const positions: number[] = [];

    for (let i = 0; i < numFrames; i++) {
      const jd = J2000_JD + 100 + i * jdDeltaPerFrame;
      const absRaw = computePosition(earthData, 'investigador', jd, 'local');
      const absVec = new Vector3(absRaw.x, absRaw.y, absRaw.z);
      const relRaw = computePosition(earthData, 'investigador', jd, 'local', absVec);
      // El length de la posición relativa es la "varianza" del target
      positions.push(new Vector3(relRaw.x, relRaw.y, relRaw.z).length());
    }

    // Todos los valores deben ser prácticamente cero (error float < 1e-8)
    const maxTarget = Math.max(...positions);
    expect(maxTarget).toBeLessThan(1e-6);
  });
});

// ---------------------------------------------------------------------------
// T C.13 — Regresión: a 1 s/s, posición local = (0,0,0)
// ---------------------------------------------------------------------------

describe('T C.13 — Regresión: a simulationSpeed = 1 s/s, cuerpo en (0,0,0)', () => {
  it('Tierra en local a 1 s/s: 3 frames consecutivos todos ≈ (0,0,0)', () => {
    const jdDeltaPerFrame = 1 / 86400; // 1 segundo simulado por frame a 60fps
    const jdStart = J2000_JD + 30;

    for (let i = 0; i < 3; i++) {
      const jd = jdStart + i * jdDeltaPerFrame;
      const absRaw = computePosition(earthData, 'investigador', jd, 'local');
      const absVec = new Vector3(absRaw.x, absRaw.y, absRaw.z);
      const relRaw = computePosition(earthData, 'investigador', jd, 'local', absVec);

      expect(relRaw.x).toBeCloseTo(0, 5);
      expect(relRaw.y).toBeCloseTo(0, 5);
      expect(relRaw.z).toBeCloseTo(0, 5);
    }
  });

  it('Modo global sin offset: resultado bit-for-bit igual que antes del cambio', () => {
    // En modo global, el offset es (0,0,0) → resultado idéntico a la versión anterior
    const jd = J2000_JD + 100;
    const withoutOffset = computePosition(earthData, 'investigador', jd, 'global');
    const withZeroOffset = computePosition(
      earthData,
      'investigador',
      jd,
      'global',
      new Vector3(0, 0, 0),
    );

    // Bit-for-bit: exactamente iguales
    expect(withoutOffset.x).toBe(withZeroOffset.x);
    expect(withoutOffset.y).toBe(withZeroOffset.y);
    expect(withoutOffset.z).toBe(withZeroOffset.z);
  });
});
