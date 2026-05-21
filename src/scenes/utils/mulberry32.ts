/**
 * Deterministic PRNG — Mulberry32.
 *
 * Same algorithm extracted from AsteroidBelt.tsx so geometry layers can share
 * it without duplicating code (ADR-001).
 *
 * @param seed - Any 32-bit unsigned integer seed. Same seed → identical sequence.
 * @returns A zero-argument function that returns successive pseudo-random
 *          numbers uniformly distributed in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
