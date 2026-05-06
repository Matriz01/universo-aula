/**
 * Validación del JSON known-events.json contra la interfaz KnownEventsDataset.
 *
 * Comprueba: versión, estructura de eventos, Cometa Halley con parámetros orbitales válidos.
 */
import { describe, it, expect } from 'vitest';
import type {
  KnownEventsDataset,
  KnownEvent,
  OrbitalParams,
} from '@/scenes/data/known-events.types';
import rawData from '../../../../public/data/known-events.json';

const data = rawData as unknown as KnownEventsDataset;

describe('known-events.json — estructura y sanity checks', () => {
  it('tiene campo version', () => {
    expect(data.version).toBeTruthy();
    expect(typeof data.version).toBe('string');
  });

  it('tiene array de eventos', () => {
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
  });

  it('contiene el Cometa Halley', () => {
    const halley = data.events.find((e: KnownEvent) => e.id === 'halley');
    expect(halley).toBeDefined();
    expect(halley?.type).toBe('comet');
    expect(halley?.name_key).toBe('events.halley.name');
  });

  it('Halley tiene parámetros orbitales completos', () => {
    const halley = data.events.find((e: KnownEvent) => e.id === 'halley');
    expect(halley).toBeDefined();

    const op = halley?.orbital_params as OrbitalParams;
    expect(typeof op.semi_major_axis_AU).toBe('number');
    expect(typeof op.eccentricity).toBe('number');
    expect(typeof op.inclination_deg).toBe('number');
    expect(typeof op.longitude_ascending_node_deg).toBe('number');
    expect(typeof op.argument_perihelion_deg).toBe('number');
    expect(typeof op.mean_anomaly_J2000_deg).toBe('number');
    expect(typeof op.orbital_period_days).toBe('number');
  });

  it('Halley tiene excentricidad alta (cometa muy elíptico)', () => {
    const halley = data.events.find((e: KnownEvent) => e.id === 'halley');
    expect(halley?.orbital_params.eccentricity).toBeGreaterThan(0.9);
  });

  it('Halley tiene semi_major_axis_AU realista (>17 UA)', () => {
    const halley = data.events.find((e: KnownEvent) => e.id === 'halley');
    expect(halley?.orbital_params.semi_major_axis_AU).toBeGreaterThan(17);
  });

  it('todos los eventos tienen color_hex en formato válido', () => {
    data.events.forEach((event: KnownEvent) => {
      expect(event.color_hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('todos los eventos tienen next_perihelion en formato fecha', () => {
    data.events.forEach((event: KnownEvent) => {
      expect(event.next_perihelion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
