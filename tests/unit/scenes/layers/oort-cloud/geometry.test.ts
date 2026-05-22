/**
 * Tests for src/scenes/layers/oort-cloud/geometry.ts
 *
 * Categories covered:
 *   happy       — length === count*3, all finite, radial bounds satisfied (REQ-GEO-1, REQ-GEO-2)
 *   boundary    — degenerate shell (inner===outer), count=0, count=1
 *   error       — negative count throws, outer<inner throws, non-finite seed throws (REQ-GEO guards)
 *   determinism — same input → identical output (REQ-GEO-3); different seed → different output
 *                 (REQ-GEO-4)
 */

import { describe, it, expect } from 'vitest';
import { generateOortCloudGeometry } from '@/scenes/layers/oort-cloud/geometry';

// ─────────────────────────────────────────────────────────────────────────────
// Error category (B.1)
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOortCloudGeometry — error', () => {
  it('throws when count < 0', () => {
    expect(() =>
      generateOortCloudGeometry({ count: -1, innerRadius: 10, outerRadius: 20, seed: 1 }),
    ).toThrow();
  });

  it('throws when count is non-finite (NaN)', () => {
    expect(() =>
      generateOortCloudGeometry({ count: NaN, innerRadius: 10, outerRadius: 20, seed: 1 }),
    ).toThrow();
  });

  it('throws when innerRadius < 0', () => {
    expect(() =>
      generateOortCloudGeometry({ count: 10, innerRadius: -1, outerRadius: 20, seed: 1 }),
    ).toThrow();
  });

  it('throws when outerRadius < innerRadius', () => {
    expect(() =>
      generateOortCloudGeometry({ count: 10, innerRadius: 20, outerRadius: 10, seed: 1 }),
    ).toThrow();
  });

  it('throws when seed is non-finite (Infinity)', () => {
    expect(() =>
      generateOortCloudGeometry({ count: 10, innerRadius: 10, outerRadius: 20, seed: Infinity }),
    ).toThrow();
  });

  it('throws when seed is NaN', () => {
    expect(() =>
      generateOortCloudGeometry({ count: 10, innerRadius: 10, outerRadius: 20, seed: NaN }),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path (B.2)
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOortCloudGeometry — happy path (REQ-GEO-1)', () => {
  it('returns an object with positions Float32Array and correct count (N=100)', () => {
    const result = generateOortCloudGeometry({
      count: 100,
      innerRadius: 10,
      outerRadius: 20,
      seed: 1,
    });
    expect(result.positions).toBeInstanceOf(Float32Array);
    expect(result.count).toBe(100);
    expect(result.positions.length).toBe(300); // 100 * 3
  });

  it('all positions are finite numbers (REQ-GEO-1)', () => {
    const result = generateOortCloudGeometry({
      count: 100,
      innerRadius: 10,
      outerRadius: 20,
      seed: 42,
    });
    for (let i = 0; i < result.positions.length; i++) {
      expect(isFinite(result.positions[i])).toBe(true);
    }
  });

  it('all points lie within spherical shell [innerRadius, outerRadius] (REQ-GEO-2)', () => {
    // Use spec illustrative values: inner=144, outer=198
    const inner = 144;
    const outer = 198;
    const result = generateOortCloudGeometry({
      count: 1000,
      innerRadius: inner,
      outerRadius: outer,
      seed: 42,
    });
    const pos = result.positions;
    for (let i = 0; i < result.count; i++) {
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const d = Math.sqrt(x * x + y * y + z * z);
      // Allow floating-point tolerance of 1e-4
      expect(d).toBeGreaterThanOrEqual(inner - 1e-4);
      expect(d).toBeLessThanOrEqual(outer + 1e-4);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary (B.2)
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOortCloudGeometry — boundary', () => {
  it('count=0 returns empty positions Float32Array', () => {
    const result = generateOortCloudGeometry({
      count: 0,
      innerRadius: 10,
      outerRadius: 20,
      seed: 1,
    });
    expect(result.positions.length).toBe(0);
    expect(result.count).toBe(0);
  });

  it('count=1 returns positions.length===3; single point within radial bounds', () => {
    const inner = 10;
    const outer = 20;
    const result = generateOortCloudGeometry({
      count: 1,
      innerRadius: inner,
      outerRadius: outer,
      seed: 77,
    });
    expect(result.positions.length).toBe(3);
    expect(result.count).toBe(1);
    const x = result.positions[0];
    const y = result.positions[1];
    const z = result.positions[2];
    const d = Math.sqrt(x * x + y * y + z * z);
    expect(d).toBeGreaterThanOrEqual(inner - 1e-4);
    expect(d).toBeLessThanOrEqual(outer + 1e-4);
  });

  it('degenerate shell (innerRadius === outerRadius): all points at exactly that radius', () => {
    // When inner === outer, every point must be on the shell surface
    const r = 50;
    const result = generateOortCloudGeometry({
      count: 20,
      innerRadius: r,
      outerRadius: r,
      seed: 5,
    });
    for (let i = 0; i < result.count; i++) {
      const x = result.positions[i * 3];
      const y = result.positions[i * 3 + 1];
      const z = result.positions[i * 3 + 2];
      const d = Math.sqrt(x * x + y * y + z * z);
      // Tolerance 1e-4 to account for float32 precision loss
      expect(d).toBeCloseTo(r, 3);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism (B.2) — REQ-GEO-3 + REQ-GEO-4
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOortCloudGeometry — determinism (REQ-GEO-3)', () => {
  it('two calls with identical opts produce element-by-element identical positions', () => {
    const opts = { count: 200, innerRadius: 30, outerRadius: 60, seed: 123 };
    const r1 = generateOortCloudGeometry(opts);
    const r2 = generateOortCloudGeometry(opts);
    expect(r1.positions.length).toBe(r2.positions.length);
    for (let i = 0; i < r1.positions.length; i++) {
      expect(r1.positions[i]).toBe(r2.positions[i]);
    }
  });
});

describe('generateOortCloudGeometry — seed isolation (REQ-GEO-4)', () => {
  it('seed=1 vs seed=2 (all else equal): at least one element differs', () => {
    const base = { count: 100, innerRadius: 10, outerRadius: 20 };
    const r1 = generateOortCloudGeometry({ ...base, seed: 1 });
    const r2 = generateOortCloudGeometry({ ...base, seed: 2 });
    let anyDiff = false;
    for (let i = 0; i < r1.positions.length; i++) {
      if (r1.positions[i] !== r2.positions[i]) {
        anyDiff = true;
        break;
      }
    }
    expect(anyDiff).toBe(true);
  });
});
