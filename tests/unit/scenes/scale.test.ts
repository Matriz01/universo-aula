/**
 * 1.6 — TEST: funciones puras de escala.
 * Valores esperados recalculados tras cambio a curva potencia iter-2
 * (R_VISUAL_K=0.21, R_VISUAL_POW=0.55 — reemplazan R_VISUAL_BASE/R_VISUAL_LOG_K).
 * El Sol usa visualRadius(SUN_RADIUS_KM) en lugar de hardcoded.
 * Las distancias (D_VISUAL_*) no cambiaron.
 *
 * iter-2 (local real scale): tests añadidos para localVisualRadius,
 * localVisualDistanceFromKm y localVisualDistanceFromAU.
 */
import { describe, it, expect } from 'vitest';
import {
  visualRadius,
  visualDistance,
  SUN_RADIUS_KM,
  localVisualRadius,
  localVisualDistanceFromKm,
  localVisualDistanceFromAU,
  LOCAL_SCALE_KM_PER_UNIT,
  KM_PER_AU,
} from '@/scenes/scale';

describe('visualRadius', () => {
  it('Mercury radius_km=2439.7 → ≈0.343', () => {
    expect(visualRadius(2439.7)).toBeCloseTo(0.343, 2);
  });

  it('Venus radius_km=6051.8 → ≈0.565', () => {
    expect(visualRadius(6051.8)).toBeCloseTo(0.565, 2);
  });

  it('Earth radius_km=6371 → ≈0.582', () => {
    expect(visualRadius(6371)).toBeCloseTo(0.582, 2);
  });

  it('Mars radius_km=3389.5 → ≈0.411', () => {
    expect(visualRadius(3389.5)).toBeCloseTo(0.411, 2);
  });

  it('Jupiter radius_km=69911 → ≈2.171', () => {
    expect(visualRadius(69911)).toBeCloseTo(2.171, 2);
  });

  it('Saturn radius_km=58232 → ≈1.964', () => {
    expect(visualRadius(58232)).toBeCloseTo(1.964, 2);
  });

  it('Uranus radius_km=25362 → ≈1.243', () => {
    expect(visualRadius(25362)).toBeCloseTo(1.243, 2);
  });

  it('Neptune radius_km=24622 → ≈1.223', () => {
    expect(visualRadius(24622)).toBeCloseTo(1.223, 2);
  });

  it('Pluto radius_km=1188.3 → ≈0.231', () => {
    expect(visualRadius(1188.3)).toBeCloseTo(0.231, 2);
  });

  it('Sun radius_km=696340 → ≈7.687', () => {
    expect(visualRadius(SUN_RADIUS_KM)).toBeCloseTo(7.687, 2);
  });

  it('Sol siempre mayor que Júpiter (garantía de proporciones)', () => {
    expect(visualRadius(SUN_RADIUS_KM)).toBeGreaterThan(visualRadius(69911));
  });

  it('Júpiter visiblemente mayor que Saturno (ratio > 1.10)', () => {
    expect(visualRadius(69911) / visualRadius(58232)).toBeGreaterThan(1.1);
  });
});

describe('visualDistance', () => {
  it('Mercury AU=0.387098 → ≈24.27', () => {
    expect(visualDistance(0.387098)).toBeCloseTo(24.27, 1);
  });

  it('Earth AU=1.0 → ≈38.0', () => {
    expect(visualDistance(1.0)).toBeCloseTo(38.0, 1);
  });

  it('Neptune AU=30.07 → ≈140.88', () => {
    expect(visualDistance(30.07)).toBeCloseTo(140.88, 1);
  });

  it('Venus AU=0.7233 → ≈32.41', () => {
    expect(visualDistance(0.7233)).toBeCloseTo(32.41, 1);
  });

  it('Pluto AU=39.482 → ≈150.81', () => {
    expect(visualDistance(39.482)).toBeCloseTo(150.81, 1);
  });

  it('es monótonamente creciente para AU creciente', () => {
    const aus = [0.387, 0.723, 1.0, 1.524, 5.204, 9.583, 19.22, 30.07, 39.48];
    for (let i = 1; i < aus.length; i++) {
      expect(visualDistance(aus[i])).toBeGreaterThan(visualDistance(aus[i - 1]));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Escala REAL (modo local): 1 unidad = 1000 km
// ─────────────────────────────────────────────────────────────────────────────

describe('localVisualRadius (escala real: 1 unidad = 1000 km)', () => {
  it('Sol (696340 km) → 696.34 unidades', () => {
    expect(localVisualRadius(696_340)).toBeCloseTo(696.34, 1);
  });

  it('Tierra (6371 km) → 6.371 unidades', () => {
    expect(localVisualRadius(6371)).toBeCloseTo(6.371, 3);
  });

  it('Luna (1737 km) → 1.737 unidades', () => {
    expect(localVisualRadius(1737)).toBeCloseTo(1.737, 3);
  });

  it('Júpiter (69911 km) → 69.911 unidades', () => {
    expect(localVisualRadius(69_911)).toBeCloseTo(69.911, 2);
  });

  it('Mercurio (2439.7 km) → 2.4397 unidades', () => {
    expect(localVisualRadius(2439.7)).toBeCloseTo(2.4397, 3);
  });

  it('Plutón (1188.3 km) → 1.1883 unidades', () => {
    expect(localVisualRadius(1188.3)).toBeCloseTo(1.1883, 3);
  });

  it('LOCAL_SCALE_KM_PER_UNIT es 1000', () => {
    expect(LOCAL_SCALE_KM_PER_UNIT).toBe(1000);
  });

  it('es lineal (relación exacta km/1000)', () => {
    const km = 12_345;
    expect(localVisualRadius(km)).toBeCloseTo(km / 1000, 10);
  });

  it('Sol mayor que Tierra en escala real', () => {
    expect(localVisualRadius(696_340)).toBeGreaterThan(localVisualRadius(6371));
  });
});

describe('localVisualDistanceFromKm (escala real: km/1000)', () => {
  it('Tierra-Luna (384400 km) → 384.4 unidades', () => {
    expect(localVisualDistanceFromKm(384_400)).toBeCloseTo(384.4, 1);
  });

  it('1000 km → 1 unidad', () => {
    expect(localVisualDistanceFromKm(1000)).toBeCloseTo(1.0, 10);
  });

  it('500 km → 0.5 unidades', () => {
    expect(localVisualDistanceFromKm(500)).toBeCloseTo(0.5, 10);
  });

  it('distancia 0 → 0 unidades', () => {
    expect(localVisualDistanceFromKm(0)).toBe(0);
  });
});

describe('localVisualDistanceFromAU (escala real: AU → km/1000)', () => {
  it('1 AU → KM_PER_AU/1000 unidades', () => {
    expect(localVisualDistanceFromAU(1)).toBeCloseTo(KM_PER_AU / 1000, 1);
  });

  it('Tierra (1 AU) → ≈149597.87 unidades', () => {
    expect(localVisualDistanceFromAU(1.0)).toBeCloseTo(149_597.87, 0);
  });

  it('Mercurio (0.387 AU) → ≈57894 unidades', () => {
    expect(localVisualDistanceFromAU(0.387)).toBeCloseTo(149_597.87 * 0.387, 0);
  });

  it('es monótonamente creciente para AU creciente', () => {
    const aus = [0.387, 0.723, 1.0, 1.524, 5.204, 9.583, 19.22, 30.07, 39.48];
    for (let i = 1; i < aus.length; i++) {
      expect(localVisualDistanceFromAU(aus[i])).toBeGreaterThan(
        localVisualDistanceFromAU(aus[i - 1]),
      );
    }
  });

  it('0 AU → 0 unidades', () => {
    expect(localVisualDistanceFromAU(0)).toBe(0);
  });
});
