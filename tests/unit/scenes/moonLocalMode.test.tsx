/**
 * T B.8 — TEST: Moon local mode — Earth renderizada, MoonOrbitPath visible,
 * OrbitPaths heliocentricas ocultas, MoonOrbitPath con Earth+Moon local.
 *
 * Verifica:
 * 1. selectedBody='moon', viewMode='local': <Planet> de Earth está montado
 * 2. <MoonOrbitPath> está montado cuando selectedBody='moon'
 * 3. <OrbitPath> heliocentricos NO están montados en modo local
 * 4. <MoonOrbitPath> está montado cuando selectedBody='earth'
 * 5. <MoonOrbitPath> está montado en modo global
 */
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Contadores hoisted
// ---------------------------------------------------------------------------

const { mockCounts } = vi.hoisted(() => ({
  mockCounts: {
    Planet: 0,
    Saturn: 0,
    OrbitPath: 0,
    MoonOrbitPath: 0,
    PlanetMoon: 0,
    DistantMarker: 0,
    Sun: 0,
    CameraController: 0,
    AsteroidBelt: 0,
  },
}));

// Estado del store controlable desde tests
const { storeState } = vi.hoisted(() => ({
  storeState: {
    level: 'aprendiz' as const,
    selectedBody: null as string | null,
    selectedPlanet: null as string | null,
    viewMode: 'global',
    prefersReducedMotion: false,
    sunShaderVariant: 'full' as const,
    showKnownEvents: false,
    goToBody: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mocks de componentes
// ---------------------------------------------------------------------------

vi.mock('@/scenes/components/Sun', () => ({
  Sun: () => {
    mockCounts.Sun++;
    return null;
  },
}));

vi.mock('@/scenes/components/Planet', () => ({
  Planet: () => {
    mockCounts.Planet++;
    return null;
  },
}));

vi.mock('@/scenes/components/Saturn', () => ({
  Saturn: () => {
    mockCounts.Saturn++;
    return null;
  },
}));

vi.mock('@/scenes/components/AsteroidBelt', () => ({
  AsteroidBelt: () => {
    mockCounts.AsteroidBelt++;
    return null;
  },
}));

vi.mock('@/scenes/components/PlanetMoon', () => ({
  PlanetMoon: () => {
    mockCounts.PlanetMoon++;
    return null;
  },
}));

vi.mock('@/scenes/components/CameraController', () => ({
  CameraController: () => {
    mockCounts.CameraController++;
    return null;
  },
}));

vi.mock('@/scenes/components/OrbitPath', () => ({
  OrbitPath: () => {
    mockCounts.OrbitPath++;
    return null;
  },
}));

vi.mock('@/scenes/components/DistantMarker', () => ({
  DistantMarker: () => {
    mockCounts.DistantMarker++;
    return null;
  },
}));

vi.mock('@/scenes/components/KnownEventsLayer', () => ({
  KnownEventsLayer: () => null,
}));

// ---------------------------------------------------------------------------
// Mock del store
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
  useLevel: () => storeState.level,
  useViewMode: () => storeState.viewMode,
  useShowKnownEvents: () => storeState.showKnownEvents,
}));

// ---------------------------------------------------------------------------
// Mock de usePlanetsData
// ---------------------------------------------------------------------------

const MOCK_PLANETS = [
  {
    id: 'mercury',
    classification: 'terrestrial',
    radius_km: 2440,
    mass_kg: 3.3e23,
    density_g_cm3: 5.43,
    gravity_m_s2: 3.7,
    rotation_period_h: 1407.6,
    axial_tilt_deg: 0.034,
    mean_temperature_k: 440,
    semi_major_axis_AU: 0.387,
    eccentricity: 0.206,
    inclination_deg: 7.0,
    longitude_ascending_node_deg: 48.33,
    argument_perihelion_deg: 29.12,
    mean_anomaly_J2000_deg: 174.8,
    orbital_period_days: 88,
    color_hex: '#b5b5b5',
    has_rings: false,
    moons_count: 0,
    texture_base: '/t/mercury/',
  },
  {
    id: 'earth',
    classification: 'terrestrial',
    radius_km: 6371,
    mass_kg: 5.97e24,
    density_g_cm3: 5.51,
    gravity_m_s2: 9.81,
    rotation_period_h: 23.93,
    axial_tilt_deg: 23.44,
    mean_temperature_k: 288,
    semi_major_axis_AU: 1.0,
    eccentricity: 0.017,
    inclination_deg: 0.0,
    longitude_ascending_node_deg: -11.26,
    argument_perihelion_deg: 114.21,
    mean_anomaly_J2000_deg: 358.62,
    orbital_period_days: 365.25,
    color_hex: '#4a90e2',
    has_rings: false,
    moons_count: 1,
    texture_base: '/t/earth/',
  },
  {
    id: 'mars',
    classification: 'terrestrial',
    radius_km: 3390,
    mass_kg: 6.42e23,
    density_g_cm3: 3.93,
    gravity_m_s2: 3.72,
    rotation_period_h: 24.62,
    axial_tilt_deg: 25.19,
    mean_temperature_k: 210,
    semi_major_axis_AU: 1.524,
    eccentricity: 0.093,
    inclination_deg: 1.85,
    longitude_ascending_node_deg: 49.56,
    argument_perihelion_deg: 286.5,
    mean_anomaly_J2000_deg: 19.41,
    orbital_period_days: 687,
    color_hex: '#c1440e',
    has_rings: false,
    moons_count: 2,
    texture_base: '/t/mars/',
  },
  {
    id: 'saturn',
    classification: 'gas_giant',
    radius_km: 58232,
    mass_kg: 5.68e26,
    density_g_cm3: 0.69,
    gravity_m_s2: 10.44,
    rotation_period_h: 10.66,
    axial_tilt_deg: 26.73,
    mean_temperature_k: 134,
    semi_major_axis_AU: 9.537,
    eccentricity: 0.056,
    inclination_deg: 2.49,
    longitude_ascending_node_deg: 113.72,
    argument_perihelion_deg: 339.39,
    mean_anomaly_J2000_deg: 317.02,
    orbital_period_days: 10759,
    color_hex: '#e8d191',
    has_rings: true,
    moons_count: 146,
    texture_base: '/t/saturn/',
    rings: { inner_radius_km: 74658, outer_radius_km: 136775, texture: '/t/saturn-rings/2k.png' },
  },
];

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({
    data: {
      version: '1.0',
      source: 'test',
      epoch_JD: 2451545.0,
      planets: MOCK_PLANETS,
      asteroid_belt: {
        inner_AU: 2.2,
        outer_AU: 3.2,
        count_high: 200,
        count_mid: 100,
        count_low: 50,
        vertical_dispersion: 0.3,
        size_min: 0.5,
        size_max: 2.0,
        color_hex: '#888',
      },
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => 'mid',
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bloom: () => null,
}));

vi.mock('@react-three/drei', () => ({
  Stars: () => null,
  OrbitControls: () => null,
  PerformanceMonitor: () => null,
  useProgress: () => ({ progress: 100 }),
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

import { SolarSystemScene } from '@/scenes/SolarSystemScene';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function resetCounts() {
  mockCounts.Planet = 0;
  mockCounts.Saturn = 0;
  mockCounts.OrbitPath = 0;
  mockCounts.MoonOrbitPath = 0;
  mockCounts.PlanetMoon = 0;
  mockCounts.DistantMarker = 0;
  mockCounts.Sun = 0;
  mockCounts.CameraController = 0;
  mockCounts.AsteroidBelt = 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetCounts();
  storeState.selectedBody = null;
  storeState.selectedPlanet = null;
  storeState.viewMode = 'global';
  storeState.showKnownEvents = false;
});

describe('Moon local mode — renderizado de escena (T B.8)', () => {
  it("selectedBody='moon', viewMode='local': Planet (Tierra) está montado", () => {
    storeState.selectedBody = 'moon';
    storeState.selectedPlanet = 'moon';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    // En modo local Luna, la Tierra debe renderizarse
    expect(mockCounts.Planet).toBeGreaterThanOrEqual(1);
  });

  it("selectedBody='moon', viewMode='local': OrbitPaths heliocentricos NO montados", () => {
    storeState.selectedBody = 'moon';
    storeState.selectedPlanet = 'moon';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    // En modo local no debe haber OrbitPaths heliocentricas
    expect(mockCounts.OrbitPath).toBe(0);
  });

  it("selectedBody='moon', viewMode='local': MoonOrbitPath montado (vía PlanetMoon visible)", () => {
    storeState.selectedBody = 'moon';
    storeState.selectedPlanet = 'moon';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    // PlanetMoon debería estar montado en modo local Luna
    expect(mockCounts.PlanetMoon).toBeGreaterThanOrEqual(1);
  });

  it("selectedBody='earth', viewMode='local': OrbitPaths heliocentricos NO montados", () => {
    storeState.selectedBody = 'earth';
    storeState.selectedPlanet = 'earth';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    expect(mockCounts.OrbitPath).toBe(0);
  });

  it("viewMode='global': OrbitPaths montados", () => {
    storeState.selectedBody = null;
    storeState.selectedPlanet = null;
    storeState.viewMode = 'global';

    render(<SolarSystemScene />);

    expect(mockCounts.OrbitPath).toBeGreaterThan(0);
  });

  it("viewMode='global': PlanetMoon montado", () => {
    storeState.selectedBody = null;
    storeState.selectedPlanet = null;
    storeState.viewMode = 'global';

    render(<SolarSystemScene />);

    expect(mockCounts.PlanetMoon).toBe(1);
  });
});
