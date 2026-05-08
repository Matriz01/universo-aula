/**
 * sunIntensity — función pura para calcular el factor de intensidad del Sol
 * según la perspectiva del planeta seleccionado (ley de cuadrado inverso).
 *
 * Feature B: Sun brightness perspective in local mode.
 *
 * Fórmula: factor = clamp(1 / au², MIN_FACTOR, MAX_FACTOR)
 * Modo global: siempre 1.0 (sin perspectiva).
 */

import type { ViewMode } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Factor mínimo — evita oscuridad total en planetas muy lejanos. */
export const SUN_INTENSITY_MIN = 0.05;

/** Factor máximo — evita saturación en planetas muy cercanos. */
export const SUN_INTENSITY_MAX = 8;

// ---------------------------------------------------------------------------
// computeSunIntensityFactor
// ---------------------------------------------------------------------------

/**
 * Calcula el factor de intensidad del Sol según la distancia del planeta seleccionado.
 *
 * @param viewMode - 'global' | 'local'
 * @param distanceAU - Distancia en Unidades Astronómicas del planeta al Sol.
 *                     Solo se usa cuando viewMode === 'local'.
 * @returns Factor de intensidad clampeado en [SUN_INTENSITY_MIN, SUN_INTENSITY_MAX]
 *
 * Ejemplos (modo local):
 * - Mercurio (0.39 AU) → 1/0.1521 ≈ 6.57
 * - Tierra   (1.00 AU) → 1.0
 * - Marte    (1.52 AU) → 1/2.31 ≈ 0.43
 * - Júpiter  (5.20 AU) → 1/27.04 ≈ 0.037 → clamp 0.05
 * - Neptuno  (30.0 AU) → 1/900  ≈ 0.001 → clamp 0.05
 */
export function computeSunIntensityFactor(viewMode: ViewMode, distanceAU: number): number {
  if (viewMode === 'global') {
    return 1.0;
  }

  if (distanceAU <= 0) {
    return SUN_INTENSITY_MAX;
  }

  const factor = 1 / (distanceAU * distanceAU);
  return Math.min(SUN_INTENSITY_MAX, Math.max(SUN_INTENSITY_MIN, factor));
}
