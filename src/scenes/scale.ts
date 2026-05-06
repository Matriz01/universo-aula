/**
 * Sistema de escala didáctica sublogarítmica para el Sistema Solar MVP.
 *
 * Las distancias y radios se escalan con dos curvas independientes
 * sublogarítmicas para garantizar que todos los cuerpos sean visibles
 * simultáneamente en pantalla, sin que el Sol llene la vista.
 *
 * Valores validados en design §3.2 — tabla Mercury→Pluto.
 * NOTA: "Las distancias y tamaños no están a escala real" (i18n solar:ui.scale_note).
 *
 * @remarks
 * D_VISUAL_BASE y D_VISUAL_LOG_K fueron afinados tras revisión visual del
 * despliegue MVP (iter-2): con los valores originales (5.0 / 8.0) los planetas
 * interiores se solapaban y los exteriores quedaban demasiado juntos. Los
 * valores actuales (6.0 / 13.0) amplían la separación de forma legible.
 */

export const SUN_VISUAL_RADIUS = 2.5;
export const R_VISUAL_BASE = 0.3;
export const R_VISUAL_LOG_K = 0.6;
export const D_VISUAL_BASE = 6.0;
export const D_VISUAL_LOG_K = 13.0;

/**
 * Radio visual de un cuerpo celeste en unidades de escena Three.js.
 *
 * r_visual = R_BASE + R_LOG_K * log2(radius_km / 1000)
 *
 * Tabla de referencia (design §3.2):
 * - Mercury (2439.7 km) → 1.072
 * - Earth   (6371 km)   → 1.903
 * - Jupiter (69911 km)  → 3.976
 * - Pluto   (1188.3 km) → 0.449
 */
export function visualRadius(radiusKm: number): number {
  return R_VISUAL_BASE + R_VISUAL_LOG_K * Math.log2(radiusKm / 1000);
}

/**
 * Distancia visual de un planeta al Sol en unidades de escena Three.js.
 *
 * d_visual = D_BASE + D_LOG_K * log2(au + 1)
 *
 * Tabla de referencia (design §3.2):
 * - Mercury (0.387 AU) → 8.777
 * - Earth   (1.000 AU) → 13.000
 * - Neptune (30.07 AU) → 44.660
 * - Pluto   (39.48 AU) → 47.714
 */
export function visualDistance(au: number): number {
  return D_VISUAL_BASE + D_VISUAL_LOG_K * Math.log2(au + 1);
}
