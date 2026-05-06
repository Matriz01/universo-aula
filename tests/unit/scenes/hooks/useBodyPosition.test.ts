import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computeBodyPosition } from '@/scenes/hooks/useBodyPosition';
import type { PlanetData } from '@/scenes/data/types';

const earthData: PlanetData = {
  id: 'earth',
  classification: 'terrestrial',
  radius_km: 6371,
  mass_kg: 5.972e24,
  density_g_cm3: 5.514,
  gravity_m_s2: 9.807,
  rotation_period_h: 23.9345,
  axial_tilt_deg: 23.4393,
  mean_temperature_k: 288,
  semi_major_axis_AU: 1.0,
  eccentricity: 0.0167,
  inclination_deg: 0.0,
  longitude_ascending_node_deg: 0.0,
  argument_perihelion_deg: 102.94719,
  mean_anomaly_J2000_deg: 100.46435,
  orbital_period_days: 365.256,
  color_hex: '#1a3d8f',
  has_rings: false,
  moons_count: 1,
  texture_base: '/textures/earth/',
};

describe('computeBodyPosition', () => {
  const J2000 = new Date('2000-01-01T12:00:00Z');

  it('devuelve un Vector3', () => {
    const pos = computeBodyPosition(earthData, J2000, 'global');
    expect(pos).toBeInstanceOf(Vector3);
  });

  it('Tierra en J2000 está aproximadamente a 1 AU del origen (escala global)', () => {
    const pos = computeBodyPosition(earthData, J2000, 'global');
    const distance = pos.length();
    // Distancia ≈ visualDistance(1.0) = 38.0 (con D_VISUAL_BASE=12, D_VISUAL_LOG_K=26)
    expect(distance).toBeCloseTo(38.0, 0);
  });

  it('escala local da distancia en el rango de 1 AU (≈149000–151000 unidades)', () => {
    const pos = computeBodyPosition(earthData, J2000, 'local');
    const distance = pos.length();
    // La distancia orbital real varía ±e*a ≈ ±2500 unidades alrededor de 1 AU (149597.87)
    // En J2000 la anomalía media de la Tierra es ~100°, por lo que no coincide con el perihelio
    expect(distance).toBeGreaterThan(148000);
    expect(distance).toBeLessThan(152000);
  });

  it('Tierra avanza en su órbita: posición distinta tras 100 días', () => {
    const pos1 = computeBodyPosition(earthData, J2000, 'global');
    const pos2 = computeBodyPosition(earthData, new Date('2000-04-10T12:00:00Z'), 'global');
    expect(pos1.distanceTo(pos2)).toBeGreaterThan(1);
  });

  it('Tierra vuelve aproximadamente a su posición tras un período orbital (365.256 días)', () => {
    const pos1 = computeBodyPosition(earthData, J2000, 'global');
    const oneYearLater = new Date(J2000.getTime() + 365.256 * 86400000);
    const pos2 = computeBodyPosition(earthData, oneYearLater, 'global');
    // Mismo lugar (con tolerancia)
    expect(pos1.distanceTo(pos2)).toBeLessThan(0.5);
  });
});
