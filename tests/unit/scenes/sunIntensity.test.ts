/**
 * Tests para computeSunIntensityFactor (feature B — Sun perspective brightness).
 *
 * B1: Dado un ViewMode y una distancia en AU, devuelve el factor de intensidad correcto.
 *
 * Fórmula: factor = clamp(1 / au², 0.05, 8)
 * Modo global: siempre 1.0 (sin perspectiva)
 */

import { describe, it, expect } from 'vitest';

import { computeSunIntensityFactor } from '@/scenes/helpers/sunIntensity';

describe('computeSunIntensityFactor', () => {
  describe('modo global', () => {
    it('siempre devuelve 1.0 independientemente de la distancia', () => {
      expect(computeSunIntensityFactor('global', 1.0)).toBe(1.0);
      expect(computeSunIntensityFactor('global', 0.39)).toBe(1.0);
      expect(computeSunIntensityFactor('global', 30.0)).toBe(1.0);
    });
  });

  describe('modo local', () => {
    it('Tierra (1 AU) → factor = 1.0', () => {
      const result = computeSunIntensityFactor('local', 1.0);
      expect(result).toBeCloseTo(1.0, 4);
    });

    it('Mercurio (0.39 AU) → factor ≈ 6.57, sin clamping por debajo de 8', () => {
      // factor = 1 / 0.39² = 1 / 0.1521 ≈ 6.57
      const result = computeSunIntensityFactor('local', 0.39);
      expect(result).toBeCloseTo(1 / (0.39 * 0.39), 1);
      expect(result).toBeLessThanOrEqual(8);
      expect(result).toBeGreaterThan(1);
    });

    it('distancia muy pequeña → factor clampeado a 8', () => {
      // AU < ~0.354 → factor > 8 → se clampea
      const result = computeSunIntensityFactor('local', 0.2);
      expect(result).toBe(8);
    });

    it('Marte (1.52 AU) → factor ≈ 0.43', () => {
      // factor = 1 / 1.52² = 1 / 2.3104 ≈ 0.4329
      const result = computeSunIntensityFactor('local', 1.52);
      expect(result).toBeCloseTo(1 / (1.52 * 1.52), 3);
    });

    it('Júpiter (5.2 AU) → factor < 0.05, clampeado a 0.05', () => {
      // factor = 1 / 5.2² = 1 / 27.04 ≈ 0.037 → clamp a 0.05
      const result = computeSunIntensityFactor('local', 5.2);
      expect(result).toBe(0.05);
    });

    it('Neptuno (30 AU) → factor << 0.05, clampeado a 0.05', () => {
      // factor = 1 / 900 ≈ 0.001 → clamp a 0.05
      const result = computeSunIntensityFactor('local', 30.0);
      expect(result).toBe(0.05);
    });

    it('distancia AU=0 no rompe (devuelve max clamp 8)', () => {
      // 1/0² = Infinity → clamp a 8
      const result = computeSunIntensityFactor('local', 0);
      expect(result).toBe(8);
    });
  });
});
