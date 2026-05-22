/**
 * Tests for src/scenes/utils/mulberry32.ts
 *
 * Categories covered:
 *   happy     — calling mulberry32(seed) returns a function; values in [0, 1)
 *   boundary  — seed=0 works; 1000 consecutive calls stay in [0, 1)
 *   determinism — same seed → identical sequence across two independent factory calls
 *   seed-isolation — different seed → different first output
 *
 * Error category: mulberry32 is a pure numeric bitwise function — no invalid
 * input path exists (all 32-bit seeds are valid by design). Omitted with
 * justification: the algorithm accepts any number (bit-truncated to uint32).
 */

import { describe, it, expect } from 'vitest';
import { mulberry32 } from '@/scenes/utils/mulberry32';

describe('mulberry32 — happy path', () => {
  it('returns a function when called with a seed', () => {
    const rand = mulberry32(42);
    expect(typeof rand).toBe('function');
  });

  it('calling the returned function returns a number in [0, 1)', () => {
    const rand = mulberry32(42);
    const value = rand();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it('returns a finite number', () => {
    const rand = mulberry32(123456);
    expect(isFinite(rand())).toBe(true);
  });
});

describe('mulberry32 — boundary', () => {
  it('seed=0 produces a valid generator without throwing', () => {
    expect(() => mulberry32(0)).not.toThrow();
    const rand = mulberry32(0);
    expect(typeof rand()).toBe('number');
  });

  it('seed=0 generator produces values in [0, 1)', () => {
    const rand = mulberry32(0);
    const value = rand();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it('1000 consecutive calls with seed=7 all stay in [0, 1)', () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('seed=2^32-1 (max uint32) produces a valid generator', () => {
    // 2^32 - 1 = 4294967295
    const rand = mulberry32(4294967295);
    const value = rand();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe('mulberry32 — determinism', () => {
  it('two independent factories with same seed produce identical sequences (first 10 values)', () => {
    const rand1 = mulberry32(7);
    const rand2 = mulberry32(7);
    for (let i = 0; i < 10; i++) {
      expect(rand1()).toBe(rand2());
    }
  });

  it('same seed produces identical first value on separate factory calls', () => {
    const v1 = mulberry32(999)();
    const v2 = mulberry32(999)();
    expect(v1).toBe(v2);
  });
});

describe('mulberry32 — seed isolation', () => {
  it('seed=1 and seed=2 produce different first values', () => {
    const v1 = mulberry32(1)();
    const v2 = mulberry32(2)();
    expect(v1).not.toBe(v2);
  });

  it('seed=0 and seed=1 produce different first values', () => {
    const v0 = mulberry32(0)();
    const v1 = mulberry32(1)();
    expect(v0).not.toBe(v1);
  });
});
