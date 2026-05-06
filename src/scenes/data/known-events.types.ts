/**
 * Tipos para eventos conocidos del Sistema Solar (cometas, etc.)
 * Corresponden a la estructura de public/data/known-events.json
 */

export type KnownEventType = 'comet' | 'asteroid' | 'other';

export interface OrbitalParams {
  readonly semi_major_axis_AU: number;
  readonly eccentricity: number;
  readonly inclination_deg: number;
  readonly longitude_ascending_node_deg: number;
  readonly argument_perihelion_deg: number;
  readonly mean_anomaly_J2000_deg: number;
  readonly orbital_period_days: number;
}

export interface KnownEvent {
  readonly id: string;
  readonly name_key: string;
  readonly type: KnownEventType;
  readonly orbital_params: OrbitalParams;
  readonly color_hex: string;
  readonly next_perihelion: string;
}

export interface KnownEventsDataset {
  readonly version: string;
  readonly events: readonly KnownEvent[];
}
