/**
 * 1.6 — TEST: funciones puras de escala.
 * Valores esperados recalculados tras ajuste visual iter-2
 * (D_VISUAL_BASE 5.0→6.0, D_VISUAL_LOG_K 8.0→13.0).
 * Los radios (R_*) no cambiaron.
 */
import { describe, it, expect } from 'vitest';
import { visualRadius, visualDistance } from '@/scenes/scale';

describe('visualRadius', () => {
  it('Mercury radius_km=2439.7 → ≈1.072', () => {
    expect(visualRadius(2439.7)).toBeCloseTo(1.072, 2);
  });

  it('Jupiter radius_km=69911 → ≈3.976', () => {
    expect(visualRadius(69911)).toBeCloseTo(3.976, 2);
  });

  it('Earth radius_km=6371 → ≈1.903', () => {
    expect(visualRadius(6371)).toBeCloseTo(1.903, 2);
  });

  it('Pluto radius_km=1188.3 → ≈0.449', () => {
    expect(visualRadius(1188.3)).toBeCloseTo(0.449, 2);
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
