/**
 * Sistema de escala para el Sistema Solar MVP.
 *
 * Dos modos de escala:
 *
 * ── GLOBAL (didáctico) ──────────────────────────────────────────────────────
 * Las distancias y radios se escalan con dos curvas independientes
 * para garantizar que todos los cuerpos sean visibles simultáneamente
 * en pantalla, sin que el Sol llene la vista.
 *
 * Radios: curva potencia r = K × (km/1000)^p — más lineal que log2 en
 * el rango de gigantes; preserva mejor las proporciones reales entre
 * cuerpos similares (Júpiter/Saturno ratio visual 1.106 vs 1.04 con log2).
 *
 * Distancias: curva sublogarítmica (D_VISUAL_BASE / D_VISUAL_LOG_K).
 * NOTA: "Las distancias y tamaños no están a escala real" (i18n solar:ui.scale_note).
 *
 * @remarks
 * D_VISUAL_BASE y D_VISUAL_LOG_K fueron afinados tras revisión visual del
 * despliegue MVP (iter-2): con los valores originales (5.0 / 8.0) los planetas
 * interiores se solapaban y los exteriores quedaban demasiado juntos. Los
 * valores actuales (6.0 / 13.0) amplían la separación de forma legible.
 *
 * R_VISUAL_K y R_VISUAL_POW reemplazan a R_VISUAL_BASE/R_VISUAL_LOG_K (iter-2):
 * la curva log2 comprimía diferencias entre gigantes similares de forma inaceptable.
 *
 * ── LOCAL (escala real 1:1) ──────────────────────────────────────────────────
 * Factor: 1 unidad de escena = 1000 km.
 * En modo local con Tierra: el Sol se ve al fondo con radio angular ~16 arcmin (real),
 * la Luna orbita a 60× radio Tierra (real), otros planetas como puntos lejanos.
 *
 * Tabla de referencia (modo local):
 * - Sol      (696 340 km) → 696.34 unidades
 * - Mercurio (  2 439 km) →   2.44 unidades
 * - Tierra   (  6 371 km) →   6.37 unidades
 * - Luna     (  1 737 km) →   1.74 unidades
 * - Júpiter  ( 69 911 km) →  69.91 unidades
 * - Plutón   (  1 188 km) →   1.19 unidades
 *
 * Distancias (modo local):
 * - Tierra-Sol  (1.00 AU = 149 598 000 km) → 149 598 unidades
 * - Tierra-Luna (        =     384 400 km) →    384.4 unidades
 * - Júpiter-Sol (5.20 AU = 778 500 000 km) → 778 500 unidades
 */

// Curva potencia: r = K × (km/1000)^p
export const R_VISUAL_K = 0.21;
export const R_VISUAL_POW = 0.55;
export const SUN_RADIUS_KM = 696340;
// Distancias dobladas (iter-2 feedback): la separación entre órbitas era
// demasiado pequeña vs la real. Ahora más espaciadas para que se vean mejor
// las proporciones reales (sin ser exactas — sigue siendo escala didáctica).
export const D_VISUAL_BASE = 12.0;
export const D_VISUAL_LOG_K = 26.0;

/**
 * Radio visual de un cuerpo celeste en unidades de escena Three.js (modo global/didáctico).
 *
 * r_visual = R_VISUAL_K × (radius_km / 1000) ^ R_VISUAL_POW
 *
 * Tabla de referencia (iter-2):
 * - Mercury (2439.7 km)  → 0.343
 * - Earth   (6371 km)    → 0.582
 * - Jupiter (69911 km)   → 2.171
 * - Pluto   (1188.3 km)  → 0.231
 * - Sun     (696340 km)  → 7.687
 */
export function visualRadius(radiusKm: number): number {
  return R_VISUAL_K * Math.pow(radiusKm / 1000, R_VISUAL_POW);
}

/**
 * Distancia visual de un planeta al Sol en unidades de escena Three.js (modo global/didáctico).
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

// ─────────────────────────────────────────────────────────────────────────────
// Escala REAL (modo local): 1 unidad de escena = 1000 km
// ─────────────────────────────────────────────────────────────────────────────

/** Factor: 1 unidad de escena = 1000 km en modo local. */
export const LOCAL_SCALE_KM_PER_UNIT = 1000;

/** Kilómetros por UA (JPL) */
export const KM_PER_AU = 149_597_870.7;

/**
 * Radio visual en modo local (escala real: km / 1000).
 *
 * Ejemplos:
 * - Sol      (696 340 km) → 696.34 unidades
 * - Tierra   (  6 371 km) →   6.37 unidades
 * - Luna     (  1 737 km) →   1.74 unidades
 * - Júpiter  ( 69 911 km) →  69.91 unidades
 */
export function localVisualRadius(radiusKm: number): number {
  return radiusKm / LOCAL_SCALE_KM_PER_UNIT;
}

/**
 * Distancia visual en modo local desde unidades astronómicas (escala real).
 *
 * Ejemplos:
 * - Tierra (1.00 AU) → 149 597.87 unidades
 * - Júpiter (5.20 AU) → 777 909 unidades
 */
export function localVisualDistanceFromAU(au: number): number {
  return (au * KM_PER_AU) / LOCAL_SCALE_KM_PER_UNIT;
}

/**
 * Distancia visual en modo local directamente en km (escala real).
 *
 * Ejemplos:
 * - Tierra-Luna (384 400 km) → 384.4 unidades
 */
export function localVisualDistanceFromKm(km: number): number {
  return km / LOCAL_SCALE_KM_PER_UNIT;
}
