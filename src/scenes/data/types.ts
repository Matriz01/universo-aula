/**
 * Data model types for the Solar System MVP.
 * Source: NASA JPL Horizons J2000 + NASA Planetary Fact Sheets (domain público).
 */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

/**
 * BodyId — unión de todos los cuerpos celestes seleccionables.
 * La Luna no es un planeta; se añade como literal independiente
 * para preservar la semántica de PlanetId sin cambiarla.
 */
export type BodyId = PlanetId | 'moon';

export type Classification = 'terrestrial' | 'gas_giant' | 'ice_giant' | 'dwarf_planet';

export interface RingsData {
  readonly inner_radius_km: number;
  readonly outer_radius_km: number;
  readonly texture: string;
}

export interface PlanetData {
  readonly id: PlanetId;
  readonly classification: Classification;
  // Datos físicos (NASA Fact Sheets, dominio público)
  readonly radius_km: number;
  readonly mass_kg: number;
  readonly density_g_cm3: number;
  readonly gravity_m_s2: number;
  readonly rotation_period_h: number; // negativo = retrógrada
  readonly axial_tilt_deg: number;
  readonly mean_temperature_k: number;
  // Parámetros orbitales (NASA JPL Horizons J2000)
  readonly semi_major_axis_AU: number;
  readonly eccentricity: number;
  readonly inclination_deg: number;
  readonly longitude_ascending_node_deg: number;
  readonly argument_perihelion_deg: number;
  readonly mean_anomaly_J2000_deg: number;
  readonly orbital_period_days: number;
  // Visual
  readonly color_hex: string;
  readonly has_rings: boolean;
  readonly moons_count: number;
  readonly texture_base: string;
  readonly rings?: RingsData;
}

export interface AsteroidBeltConfig {
  readonly inner_AU: number;
  readonly outer_AU: number;
  readonly count_high: number;
  readonly count_mid: number;
  readonly count_low: number;
  readonly vertical_dispersion: number;
  readonly size_min: number;
  readonly size_max: number;
  readonly color_hex: string;
}

export interface SolarSystemDataset {
  readonly version: string;
  readonly source: string;
  readonly epoch_JD: number;
  readonly planets: readonly PlanetData[];
  readonly asteroid_belt: AsteroidBeltConfig;
}

/**
 * Orden canónico de cuerpos celestes para navegación por teclado y tour.
 * Sol (null) es el primer elemento; los planetas siguen en orden heliocéntrico.
 */
export const CELESTIAL_ORDER: Array<PlanetId | null> = [
  null, // Sol
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];
