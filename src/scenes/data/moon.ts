/**
 * Datos orbitales y físicos de la Luna.
 *
 * GEOCÉNTRICOS — Elementos orbitales GEOCÉNTRICOS de la Luna referidos al plano
 * de la eclíptica, época J2000.0. Nodo ascendente y argumento del perihelio
 * estáticos (sin precesión) — suficiente para MVP.
 *
 * Fuente: NASA JPL Horizons + NASA Lunar Fact Sheet.
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
 */

/**
 * Elementos orbitales GEOCÉNTRICOS de la Luna referidos al plano de la
 * eclíptica, época J2000.0. Nodo ascendente y argumento del perihelio
 * estáticos (sin precesión) — suficiente para MVP.
 */
export const MOON_ORBITAL_ELEMENTS = {
  /** Semieje mayor de la órbita lunar en km (distancia media Tierra-Luna) */
  semi_major_axis_km: 384_400,
  /** Excentricidad orbital (órbita ligeramente elíptica) */
  eccentricity: 0.0549,
  /** Inclinación del plano orbital respecto a la eclíptica en grados */
  inclination_deg: 5.14,
  /** Longitud del nodo ascendente Ω en grados (J2000.0, sin precesión para MVP) */
  longitude_ascending_node_deg: 125.1228,
  /** Argumento del perihelio ω en grados (J2000.0, sin precesión para MVP) */
  argument_perihelion_deg: 318.0634,
  /** Anomalía media en J2000.0 en grados */
  mean_anomaly_J2000_deg: 135.27,
  /** Periodo orbital sidéreo en días */
  orbital_period_days: 27.32166,
} as const;

/** Radio volumétrico de la Luna en km (NASA Lunar Fact Sheet) */
export const MOON_VISUAL_RADIUS_KM = 1737.4;

/**
 * Inclinación axial de la Luna en grados respecto a su plano orbital.
 * ~6.7° respecto al plano orbital (~1.54° respecto a la eclíptica).
 * Se usa la inclinación respecto al plano orbital para consistencia
 * con el componente de visualización del eje de rotación.
 */
export const MOON_AXIAL_TILT_DEG = 6.7;
