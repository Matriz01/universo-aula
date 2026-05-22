/**
 * Per-level point-cloud parameters for the Oort cloud layer.
 *
 * Count / size / opacity values come from spec REQ-LEVEL-3.
 * Color hex values are placeholders for the visual prototype gate (REQ-GATE-1);
 * final tints are confirmed after screenshots at each level (ADR-009).
 *
 * innerVisual / outerVisual are computed from canonical AU bounds via
 * visualDistance(au) from @/scenes/scale. Values in design §7:
 *   inner ~2000 AU → visualDistance(2000) ≈ 297.1
 *   outer ~100000 AU → visualDistance(100000) ≈ 443.9
 * These are open to tuning in the visual prototype gate (REQ-GATE-1).
 */

import type { PedagogicalLevel } from '@/types';
import { visualDistance } from '@/scenes/scale';

export interface OortLevelParams {
  /** Number of point cloud particles. */
  count: number;
  /** PointsMaterial size (pixel-space with sizeAttenuation). */
  size: number;
  /** PointsMaterial opacity. transparent must be true. */
  opacity: number;
  /** Hex color string, e.g. '#cfd8ff'. */
  color: string;
  /** Inner shell visual radius (scene units). */
  innerVisual: number;
  /** Outer shell visual radius (scene units). */
  outerVisual: number;
  /** Stable PRNG seed per level — guarantees reproducibility across mounts. */
  seed: number;
}

/**
 * Canonical inner/outer Oort cloud bounds in AU.
 * Inner Oort cloud: ~2 000 AU; outer Oort cloud: ~100 000 AU.
 * Mapped through visualDistance for didactic scene scale.
 */
const INNER_AU = 2000;
const OUTER_AU = 100000;

/**
 * Per-level parameter table.
 * count/size/opacity: spec REQ-LEVEL-3.
 * color: visual prototype placeholder — confirmed at REQ-GATE-1 review.
 * innerVisual/outerVisual: computed from AU constants via visualDistance.
 * seed: fixed per level for determinism across page reloads.
 */
export const OORT_LEVEL_PARAMS: Record<PedagogicalLevel, OortLevelParams> = {
  explorador: {
    count: 1500,
    size: 4.0,
    opacity: 0.35,
    // Soft blue-white; final tint confirmed at visual prototype review (REQ-GATE-1)
    color: '#cfd8ff',
    innerVisual: visualDistance(INNER_AU),
    outerVisual: visualDistance(OUTER_AU),
    seed: 0xdeadc0de,
  },
  aprendiz: {
    count: 4000,
    size: 2.0,
    opacity: 0.55,
    // Cool white; final tint confirmed at visual prototype review (REQ-GATE-1)
    color: '#dde8ff',
    innerVisual: visualDistance(INNER_AU),
    outerVisual: visualDistance(OUTER_AU),
    seed: 0xcafebabe,
  },
  investigador: {
    count: 8000,
    size: 1.2,
    opacity: 0.75,
    // Near-white with slight blue tint; final tint confirmed at visual prototype review
    color: '#e4eeff',
    innerVisual: visualDistance(INNER_AU),
    outerVisual: visualDistance(OUTER_AU),
    seed: 0xf00d1234,
  },
};

/**
 * Returns a copy of the level parameters for the given pedagogical level.
 * Throws for unknown level strings (runtime guard for JS callers).
 */
export function getOortParamsForLevel(level: PedagogicalLevel): OortLevelParams {
  const params = OORT_LEVEL_PARAMS[level];
  if (!params) {
    throw new Error(`[getOortParamsForLevel] Unknown level: "${String(level)}"`);
  }
  // Return a shallow copy so callers cannot mutate the source record
  return { ...params };
}
