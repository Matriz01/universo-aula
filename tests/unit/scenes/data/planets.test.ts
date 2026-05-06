/**
 * 1.4 — TEST: validación del JSON planets.json contra SolarSystemDataset.
 * Assertions: 9 planetas, Plutón dwarf_planet, Saturno has_rings, belt.count_high=2000.
 * Sin keys de texto (description, name_es, iau_note).
 */
import { describe, it, expect } from 'vitest';
import type { SolarSystemDataset, PlanetData } from '@/scenes/data/types';
import rawData from '../../../../public/data/planets.json';

const data = rawData as unknown as SolarSystemDataset;

describe('planets.json — estructura y sanity checks', () => {
  it('tiene exactamente 9 planetas', () => {
    expect(data.planets).toHaveLength(9);
  });

  it('tiene versión y fuente', () => {
    expect(data.version).toBeTruthy();
    expect(data.source).toMatch(/NASA/);
    expect(typeof data.epoch_JD).toBe('number');
  });

  it('Plutón tiene classification = dwarf_planet', () => {
    const pluto = data.planets.find((p: PlanetData) => p.id === 'pluto');
    expect(pluto).toBeDefined();
    expect(pluto?.classification).toBe('dwarf_planet');
  });

  it('Saturno tiene has_rings = true y rings config', () => {
    const saturn = data.planets.find((p: PlanetData) => p.id === 'saturn');
    expect(saturn?.has_rings).toBe(true);
    expect(saturn?.rings).toBeDefined();
    expect(saturn?.rings?.inner_radius_km).toBeGreaterThan(0);
  });

  it('asteroid_belt counts (iter-2c perf-tuned)', () => {
    expect(data.asteroid_belt.count_high).toBe(500);
    expect(data.asteroid_belt.count_mid).toBe(200);
    expect(data.asteroid_belt.count_low).toBe(100);
  });

  it('ningún planeta tiene claves textuales (description, name_es, iau_note)', () => {
    for (const planet of data.planets) {
      const raw = planet as unknown as Record<string, unknown>;
      expect(raw['description']).toBeUndefined();
      expect(raw['name_es']).toBeUndefined();
      expect(raw['iau_note']).toBeUndefined();
    }
  });

  it('excentricidades están entre 0 y 1', () => {
    for (const planet of data.planets) {
      expect(planet.eccentricity).toBeGreaterThanOrEqual(0);
      expect(planet.eccentricity).toBeLessThan(1);
    }
  });

  it('semi_major_axis_AU es monótonamente creciente de Mercurio a Plutón', () => {
    // Los planetas deben estar en orden de distancia al Sol
    const expectedOrder = [
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
    const sorted = [...data.planets].sort(
      (a: PlanetData, b: PlanetData) => a.semi_major_axis_AU - b.semi_major_axis_AU,
    );
    const sortedIds = sorted.map((p: PlanetData) => p.id);
    expect(sortedIds).toEqual(expectedOrder);
  });

  it('todos los planetas tienen los campos obligatorios', () => {
    const requiredFields: (keyof PlanetData)[] = [
      'id',
      'classification',
      'radius_km',
      'mass_kg',
      'density_g_cm3',
      'gravity_m_s2',
      'rotation_period_h',
      'axial_tilt_deg',
      'mean_temperature_k',
      'semi_major_axis_AU',
      'eccentricity',
      'inclination_deg',
      'longitude_ascending_node_deg',
      'argument_perihelion_deg',
      'mean_anomaly_J2000_deg',
      'orbital_period_days',
      'color_hex',
      'has_rings',
      'moons_count',
      'texture_base',
    ];
    for (const planet of data.planets) {
      for (const field of requiredFields) {
        expect(planet[field], `${planet.id} falta campo ${field}`).toBeDefined();
      }
    }
  });

  it('mercurio tiene los valores exactos del design §2', () => {
    const mercury = data.planets.find((p: PlanetData) => p.id === 'mercury')!;
    expect(mercury.radius_km).toBeCloseTo(2439.7, 1);
    expect(mercury.semi_major_axis_AU).toBeCloseTo(0.387098, 5);
    expect(mercury.eccentricity).toBeCloseTo(0.20563, 4);
    expect(mercury.orbital_period_days).toBeCloseTo(87.969, 2);
  });
});
