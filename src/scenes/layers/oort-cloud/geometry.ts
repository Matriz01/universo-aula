/**
 * Pure geometry generator for the Oort cloud spherical shell.
 *
 * No React, no R3F — just math. Returns a Float32Array of XYZ coordinates
 * representing `count` uniformly-distributed points in the spherical shell
 * [innerRadius, outerRadius].
 *
 * Algorithm: spherical coordinate uniform distribution.
 *   - cos(theta) is sampled uniformly in [-1, 1] (not theta itself) to avoid
 *     polar clustering. This is the standard area-preserving mapping for
 *     uniform distribution on a sphere surface (Archimedes' theorem).
 *   - phi is sampled uniformly in [0, 2π).
 *   - r is sampled uniformly in [innerRadius, outerRadius]. For a thick shell
 *     this slightly under-populates the outer regions (true uniformity in
 *     volume requires sampling r^(1/3)), but for a visually thin Oort shell
 *     the difference is imperceptible and the simpler approach is preferred
 *     (design §7 — open to tuning at visual prototype gate REQ-GATE-1).
 *
 * Determinism: uses mulberry32 PRNG seeded by opts.seed (ADR-001 / REQ-GEO-3).
 */

import { mulberry32 } from '@/scenes/utils/mulberry32';

export interface OortCloudGeometryOptions {
  /** Number of points to generate. Must be >= 0 and finite. */
  count: number;
  /** Inner shell radius (scene units). Must be >= 0. */
  innerRadius: number;
  /** Outer shell radius (scene units). Must be >= innerRadius. */
  outerRadius: number;
  /** PRNG seed. Must be finite. Same seed → identical output (REQ-GEO-3). */
  seed: number;
}

export interface OortCloudGeometryResult {
  /** Flat XYZ buffer of length count * 3. */
  positions: Float32Array;
  /** Echo of the input count for downstream assertion convenience. */
  count: number;
}

/**
 * Generates `count` uniformly-distributed points in the spherical shell
 * [innerRadius, outerRadius]. Deterministic — same input → same output.
 *
 * Throws when:
 *   - count < 0 or non-finite
 *   - innerRadius < 0
 *   - outerRadius < innerRadius
 *   - seed is not finite
 */
export function generateOortCloudGeometry(opts: OortCloudGeometryOptions): OortCloudGeometryResult {
  const { count, innerRadius, outerRadius, seed } = opts;

  // — Input validation —
  if (!isFinite(count) || count < 0) {
    throw new Error(
      `[generateOortCloudGeometry] count must be a non-negative finite number, got: ${String(count)}`,
    );
  }
  if (innerRadius < 0) {
    throw new Error(
      `[generateOortCloudGeometry] innerRadius must be >= 0, got: ${String(innerRadius)}`,
    );
  }
  if (outerRadius < innerRadius) {
    throw new Error(
      `[generateOortCloudGeometry] outerRadius (${String(outerRadius)}) must be >= innerRadius (${String(innerRadius)})`,
    );
  }
  if (!isFinite(seed)) {
    throw new Error(
      `[generateOortCloudGeometry] seed must be a finite number, got: ${String(seed)}`,
    );
  }

  const n = Math.floor(count);
  const positions = new Float32Array(n * 3);

  if (n === 0) {
    return { positions, count: 0 };
  }

  const rand = mulberry32(seed);
  const shellThickness = outerRadius - innerRadius;

  for (let i = 0; i < n; i++) {
    // Uniform radius in [innerRadius, outerRadius]
    const r = innerRadius + rand() * shellThickness;

    // Uniform distribution on sphere surface via cos(theta) sampling
    // (avoids clustering at poles — Archimedes' theorem)
    const cosTheta = 2 * rand() - 1; // in [-1, 1]
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    const phi = rand() * 2 * Math.PI;

    positions[i * 3] = r * sinTheta * Math.cos(phi);
    positions[i * 3 + 1] = r * cosTheta;
    positions[i * 3 + 2] = r * sinTheta * Math.sin(phi);
  }

  return { positions, count: n };
}
