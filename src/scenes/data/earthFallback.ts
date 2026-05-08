/**
 * Datos de fallback de la Tierra para usePlanetPosition.
 *
 * Se usa cuando usePlanetsData aún no ha terminado de cargar los datos del servidor.
 * Extraído de las 3 definiciones duplicadas en:
 * - SolarSystemScene.tsx
 * - PlanetMoon.tsx (×2, en MoonMeshInner y MoonFallback)
 *
 * Fuente: NASA JPL Horizons J2000, NASA Planetary Fact Sheet.
 */

import type { PlanetData } from '@/scenes/data/types';

export const EARTH_FALLBACK_DATA: PlanetData = {
  id: 'earth' as const,
  classification: 'terrestrial' as const,
  radius_km: 6371,
  mass_kg: 5.972e24,
  density_g_cm3: 5.514,
  gravity_m_s2: 9.807,
  rotation_period_h: 23.9345,
  axial_tilt_deg: 23.4393,
  mean_temperature_k: 288,
  semi_major_axis_AU: 1.0,
  eccentricity: 0.01671,
  inclination_deg: 0.00005,
  longitude_ascending_node_deg: -11.26064,
  argument_perihelion_deg: 114.20783,
  mean_anomaly_J2000_deg: 358.617,
  orbital_period_days: 365.256,
  color_hex: '#4a90e2',
  has_rings: false,
  moons_count: 1,
  texture_base: '/textures/earth/',
};
