/**
 * 1.6 — TEST: funciones puras de escala.
 * Valores esperados recalculados tras ajuste proporcional iter-2
 * (R_VISUAL_BASE 0.3→0.2, R_VISUAL_LOG_K 0.6→0.45).
 * El Sol usa visualRadius(SUN_RADIUS_KM) en lugar de hardcoded 2.5.
 * Las distancias (D_VISUAL_*) no cambiaron.
 */
import { describe, it, expect } from 'vitest';
import { visualRadius, visualDistance, SUN_RADIUS_KM } from '@/scenes/scale';

describe('visualRadius', () => {
  it('Mercury radius_km=2439.7 → ≈0.779', () => {
    expect(visualRadius(2439.7)).toBeCloseTo(0.779, 2);
  });

  it('Venus radius_km=6051.8 → ≈1.369', () => {
    expect(visualRadius(6051.8)).toBeCloseTo(1.369, 2);
  });

  it('Earth radius_km=6371 → ≈1.402', () => {
    expect(visualRadius(6371)).toBeCloseTo(1.402, 2);
  });

  it('Mars radius_km=3389.5 → ≈0.993', () => {
    expect(visualRadius(3389.5)).toBeCloseTo(0.993, 2);
  });

  it('Jupiter radius_km=69911 → ≈2.958', () => {
    expect(visualRadius(69911)).toBeCloseTo(2.958, 2);
  });

  it('Saturn radius_km=58232 → ≈2.839', () => {
    expect(visualRadius(58232)).toBeCloseTo(2.839, 2);
  });

  it('Uranus radius_km=25362 → ≈2.299', () => {
    expect(visualRadius(25362)).toBeCloseTo(2.299, 2);
  });

  it('Neptune radius_km=24622 → ≈2.279', () => {
    expect(visualRadius(24622)).toBeCloseTo(2.279, 2);
  });

  it('Pluto radius_km=1188.3 → ≈0.312', () => {
    expect(visualRadius(1188.3)).toBeCloseTo(0.312, 2);
  });

  it('Sun radius_km=696340 → ≈4.452', () => {
    expect(visualRadius(SUN_RADIUS_KM)).toBeCloseTo(4.452, 2);
  });

  it('Sol siempre mayor que Júpiter (garantía de proporciones)', () => {
    expect(visualRadius(SUN_RADIUS_KM)).toBeGreaterThan(visualRadius(69911));
  });
});

describe('visualDistance', () => {
  it('Mercury AU=0.387098 → ≈12.137', () => {
    expect(visualDistance(0.387098)).toBeCloseTo(12.137, 1);
  });

  it('Earth AU=1.0 → ≈19.000', () => {
    expect(visualDistance(1.0)).toBeCloseTo(19.0, 1);
  });

  it('Neptune AU=30.07 → ≈70.447', () => {
    expect(visualDistance(30.07)).toBeCloseTo(70.447, 1);
  });

  it('Venus AU=0.7233 → ≈16.207', () => {
    expect(visualDistance(0.7233)).toBeCloseTo(16.207, 1);
  });

  it('Pluto AU=39.482 → ≈75.410', () => {
    expect(visualDistance(39.482)).toBeCloseTo(75.41, 1);
  });

  it('es monótonamente creciente para AU creciente', () => {
    const aus = [0.387, 0.723, 1.0, 1.524, 5.204, 9.583, 19.22, 30.07, 39.48];
    for (let i = 1; i < aus.length; i++) {
      expect(visualDistance(aus[i])).toBeGreaterThan(visualDistance(aus[i - 1]));
    }
  });
});
