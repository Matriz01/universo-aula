/**
 * Tests for src/scenes/layers/oort-cloud/levelParams.ts
 *
 * Categories covered:
 *   happy       — each level returns correct count/size/opacity per REQ-LEVEL-3
 *   boundary    — getOortParamsForLevel called twice with same level returns
 *                 consistent count (no mutation between calls)
 *   error       — passing an invalid level throws at runtime (TypeScript handles
 *                 exhaustiveness; we add a runtime guard for safety)
 *                 // justified: PedagogicalLevel is an exhaustive enum at TS level;
 *                 // runtime guard protects against JS callers passing bad strings
 *   determinism — OORT_LEVEL_PARAMS[level].count equals
 *                 getOortParamsForLevel(level).count for all levels
 */

import { describe, it, expect } from 'vitest';
import type { PedagogicalLevel } from '@/types';
import { OORT_LEVEL_PARAMS, getOortParamsForLevel } from '@/scenes/layers/oort-cloud/levelParams';

describe('levelParams — happy path (REQ-LEVEL-3)', () => {
  it('explorador: count=1500, size=4.0, opacity=0.35', () => {
    const params = getOortParamsForLevel('explorador');
    expect(params.count).toBe(1500);
    expect(params.size).toBe(4.0);
    expect(params.opacity).toBe(0.35);
  });

  it('aprendiz: count=4000, size=2.0, opacity=0.55', () => {
    const params = getOortParamsForLevel('aprendiz');
    expect(params.count).toBe(4000);
    expect(params.size).toBe(2.0);
    expect(params.opacity).toBe(0.55);
  });

  it('investigador: count=8000, size=1.2, opacity=0.75', () => {
    const params = getOortParamsForLevel('investigador');
    expect(params.count).toBe(8000);
    expect(params.size).toBe(1.2);
    expect(params.opacity).toBe(0.75);
  });

  it('each level has a color string (non-empty)', () => {
    for (const level of ['explorador', 'aprendiz', 'investigador'] as const) {
      const params = getOortParamsForLevel(level);
      expect(typeof params.color).toBe('string');
      expect(params.color.length).toBeGreaterThan(0);
    }
  });

  it('each level has positive innerVisual and outerVisual radii', () => {
    for (const level of ['explorador', 'aprendiz', 'investigador'] as const) {
      const params = getOortParamsForLevel(level);
      expect(params.innerVisual).toBeGreaterThan(0);
      expect(params.outerVisual).toBeGreaterThan(params.innerVisual);
    }
  });

  it('each level has a finite seed', () => {
    for (const level of ['explorador', 'aprendiz', 'investigador'] as const) {
      const params = getOortParamsForLevel(level);
      expect(isFinite(params.seed)).toBe(true);
    }
  });
});

describe('levelParams — boundary', () => {
  it('getOortParamsForLevel called twice returns same count (no mutation)', () => {
    const p1 = getOortParamsForLevel('aprendiz');
    const p2 = getOortParamsForLevel('aprendiz');
    expect(p1.count).toBe(p2.count);
  });

  it('modifying the returned object does not mutate OORT_LEVEL_PARAMS', () => {
    const params = getOortParamsForLevel('explorador');
    const originalCount = params.count;
    // Mutating the returned object should not affect the source record
    (params as Record<string, unknown>).count = 9999;
    expect(getOortParamsForLevel('explorador').count).toBe(originalCount);
  });
});

describe('levelParams — error', () => {
  it('throws when called with an invalid level string', () => {
    // TypeScript prevents this at compile time; runtime guard needed for JS safety
    // justified: exhaustive enum at TS level; runtime guard is a defensive layer
    expect(() => getOortParamsForLevel('unknown-level' as unknown as PedagogicalLevel)).toThrow();
  });
});

describe('levelParams — determinism', () => {
  it('OORT_LEVEL_PARAMS.explorador.count equals getOortParamsForLevel("explorador").count', () => {
    expect(OORT_LEVEL_PARAMS['explorador'].count).toBe(getOortParamsForLevel('explorador').count);
  });

  it('OORT_LEVEL_PARAMS.aprendiz.count equals getOortParamsForLevel("aprendiz").count', () => {
    expect(OORT_LEVEL_PARAMS['aprendiz'].count).toBe(getOortParamsForLevel('aprendiz').count);
  });

  it('OORT_LEVEL_PARAMS.investigador.count equals getOortParamsForLevel("investigador").count', () => {
    expect(OORT_LEVEL_PARAMS['investigador'].count).toBe(
      getOortParamsForLevel('investigador').count,
    );
  });
});
