/**
 * 1.2 — TEST: schema validation con fixture mínimo (Mercury).
 * Verifica que los tipos existen y que los campos obligatorios están presentes.
 */
import { describe, it, expect } from 'vitest';
import type {
  PlanetData,
  AsteroidBeltConfig,
  SolarSystemDataset,
  PlanetId,
  Classification,
} from '@/scenes/data/types';

describe('PlanetData — fixture Mercury', () => {
  const mercury: PlanetData = {
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

  it('PlanetId union includes all 9 bodies', () => {
    const ids: PlanetId[] = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
    ];
    expect(ids).toHaveLength(9);
  });

  it('Classification union covers all 4 types', () => {
    const classes: Classification[] = ['terrestrial', 'gas_giant', 'ice_giant', 'dwarf_planet'];
    expect(classes).toHaveLength(4);
  });

  it('fixture mercury has all required fields', () => {
    expect(mercury.id).toBe('mercury');
    expect(mercury.classification).toBe('terrestrial');
    expect(typeof mercury.radius_km).toBe('number');
    expect(typeof mercury.mass_kg).toBe('number');
    expect(typeof mercury.density_g_cm3).toBe('number');
    expect(typeof mercury.gravity_m_s2).toBe('number');
    expect(typeof mercury.rotation_period_h).toBe('number');
    expect(typeof mercury.axial_tilt_deg).toBe('number');
    expect(typeof mercury.mean_temperature_k).toBe('number');
    expect(typeof mercury.semi_major_axis_AU).toBe('number');
    expect(typeof mercury.eccentricity).toBe('number');
    expect(typeof mercury.inclination_deg).toBe('number');
    expect(typeof mercury.longitude_ascending_node_deg).toBe('number');
    expect(typeof mercury.argument_perihelion_deg).toBe('number');
    expect(typeof mercury.mean_anomaly_J2000_deg).toBe('number');
    expect(typeof mercury.orbital_period_days).toBe('number');
    expect(typeof mercury.color_hex).toBe('string');
    expect(typeof mercury.has_rings).toBe('boolean');
    expect(typeof mercury.moons_count).toBe('number');
    expect(typeof mercury.texture_base).toBe('string');
  });

  it('AsteroidBeltConfig has required fields', () => {
    const belt: AsteroidBeltConfig = {
      inner_AU: 2.2,
      outer_AU: 3.2,
      count_high: 2000,
      count_mid: 1000,
      count_low: 500,
      vertical_dispersion: 0.05,
      size_min: 0.012,
      size_max: 0.045,
      color_hex: '#7a6f5a',
    };
    expect(belt.count_high).toBe(2000);
    expect(belt.count_mid).toBe(1000);
    expect(belt.count_low).toBe(500);
  });

  it('SolarSystemDataset wraps planets array and asteroid_belt', () => {
    const dataset: SolarSystemDataset = {
      version: '1.0.0',
      source: 'NASA JPL Horizons J2000 + NASA Planetary Fact Sheets (2024)',
      epoch_JD: 2451545.0,
      planets: [mercury],
      asteroid_belt: {
        inner_AU: 2.2,
        outer_AU: 3.2,
        count_high: 2000,
        count_mid: 1000,
        count_low: 500,
        vertical_dispersion: 0.05,
        size_min: 0.012,
        size_max: 0.045,
        color_hex: '#7a6f5a',
      },
    };
    expect(dataset.planets).toHaveLength(1);
    expect(dataset.asteroid_belt.count_high).toBe(2000);
  });
});
