/**
 * Tests del componente <SolarSystemScene> — verifica que la escena principal
 * compone correctamente todos los componentes 3D.
 *
 * Estrategia: mock de todos los componentes hijos (Sun, Planet, Saturn, etc.)
 * para aislar la lógica de composición. Verificamos:
 *   - 8 Planets (todos los planetas excepto Saturno)
 *   - 1 Saturn
 *   - 1 Sun
 *   - 1 AsteroidBelt
 *   - 1 PlanetMoon
 *   - Canvas con dpr y gl correctos
 *
 * Task 8.1 (TEST)
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks de los componentes hijos
// ---------------------------------------------------------------------------

const { mockCounts } = vi.hoisted(() => {
  return {
    mockCounts: {
      Sun: 0,
      Planet: 0,
      Saturn: 0,
      AsteroidBelt: 0,
      PlanetMoon: 0,
      CameraController: 0,
      OrbitPath: 0,
    },
  };
});

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
  PlanetMoon: (_props: unknown) => {
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

// ---------------------------------------------------------------------------
// Mock de usePlanetsData para devolver un dataset completo
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({
    data: {
      version: '1.0',
      source: 'test',
      epoch_JD: 2451545.0,
      planets: [
        {
          id: 'mercury',
          classification: 'terrestrial',
          radius_km: 2439.7,
          mass_kg: 3.3e23,
          density_g_cm3: 5.43,
          gravity_m_s2: 3.7,
          rotation_period_h: 1407.6,
          axial_tilt_deg: 0.034,
          mean_temperature_k: 340,
          semi_major_axis_AU: 0.387,
          eccentricity: 0.2056,
          inclination_deg: 7.0,
          longitude_ascending_node_deg: 48.33,
          argument_perihelion_deg: 29.12,
          mean_anomaly_J2000_deg: 174.8,
          orbital_period_days: 87.97,
          color_hex: '#b5b5b5',
          has_rings: false,
          moons_count: 0,
          texture_base: '/textures/mercury/',
        },
        {
          id: 'venus',
          classification: 'terrestrial',
          radius_km: 6051.8,
          mass_kg: 4.87e24,
          density_g_cm3: 5.24,
          gravity_m_s2: 8.87,
          rotation_period_h: -5832.5,
          axial_tilt_deg: 177.4,
          mean_temperature_k: 735,
          semi_major_axis_AU: 0.723,
          eccentricity: 0.0067,
          inclination_deg: 3.39,
          longitude_ascending_node_deg: 76.68,
          argument_perihelion_deg: 54.88,
          mean_anomaly_J2000_deg: 50.45,
          orbital_period_days: 224.7,
          color_hex: '#e8cda0',
          has_rings: false,
          moons_count: 0,
          texture_base: '/textures/venus/',
        },
        {
          id: 'earth',
          classification: 'terrestrial',
          radius_km: 6371.0,
          mass_kg: 5.97e24,
          density_g_cm3: 5.51,
          gravity_m_s2: 9.81,
          rotation_period_h: 23.93,
          axial_tilt_deg: 23.44,
          mean_temperature_k: 288,
          semi_major_axis_AU: 1.0,
          eccentricity: 0.0167,
          inclination_deg: 0.0,
          longitude_ascending_node_deg: -11.26,
          argument_perihelion_deg: 114.21,
          mean_anomaly_J2000_deg: 358.62,
          orbital_period_days: 365.25,
          color_hex: '#4a90e2',
          has_rings: false,
          moons_count: 1,
          texture_base: '/textures/earth/',
        },
        {
          id: 'mars',
          classification: 'terrestrial',
          radius_km: 3389.5,
          mass_kg: 6.42e23,
          density_g_cm3: 3.93,
          gravity_m_s2: 3.72,
          rotation_period_h: 24.62,
          axial_tilt_deg: 25.19,
          mean_temperature_k: 210,
          semi_major_axis_AU: 1.524,
          eccentricity: 0.0935,
          inclination_deg: 1.85,
          longitude_ascending_node_deg: 49.56,
          argument_perihelion_deg: 286.5,
          mean_anomaly_J2000_deg: 19.41,
          orbital_period_days: 686.97,
          color_hex: '#c1440e',
          has_rings: false,
          moons_count: 2,
          texture_base: '/textures/mars/',
        },
        {
          id: 'jupiter',
          classification: 'gas_giant',
          radius_km: 69911.0,
          mass_kg: 1.9e27,
          density_g_cm3: 1.33,
          gravity_m_s2: 24.79,
          rotation_period_h: 9.93,
          axial_tilt_deg: 3.13,
          mean_temperature_k: 165,
          semi_major_axis_AU: 5.203,
          eccentricity: 0.0489,
          inclination_deg: 1.3,
          longitude_ascending_node_deg: 100.46,
          argument_perihelion_deg: 273.87,
          mean_anomaly_J2000_deg: 20.02,
          orbital_period_days: 4332.59,
          color_hex: '#c88b3a',
          has_rings: false,
          moons_count: 95,
          texture_base: '/textures/jupiter/',
        },
        {
          id: 'saturn',
          classification: 'gas_giant',
          radius_km: 58232.0,
          mass_kg: 5.68e26,
          density_g_cm3: 0.69,
          gravity_m_s2: 10.44,
          rotation_period_h: 10.66,
          axial_tilt_deg: 26.73,
          mean_temperature_k: 134,
          semi_major_axis_AU: 9.537,
          eccentricity: 0.0565,
          inclination_deg: 2.49,
          longitude_ascending_node_deg: 113.72,
          argument_perihelion_deg: 339.39,
          mean_anomaly_J2000_deg: 317.02,
          orbital_period_days: 10759.22,
          color_hex: '#e8d191',
          has_rings: true,
          moons_count: 146,
          texture_base: '/textures/saturn/',
          rings: {
            inner_radius_km: 74658,
            outer_radius_km: 136775,
            texture: '/textures/saturn-rings/2k.png',
          },
        },
        {
          id: 'uranus',
          classification: 'ice_giant',
          radius_km: 25362.0,
          mass_kg: 8.68e25,
          density_g_cm3: 1.27,
          gravity_m_s2: 8.87,
          rotation_period_h: -17.24,
          axial_tilt_deg: 97.77,
          mean_temperature_k: 76,
          semi_major_axis_AU: 19.191,
          eccentricity: 0.0472,
          inclination_deg: 0.77,
          longitude_ascending_node_deg: 74.01,
          argument_perihelion_deg: 96.99,
          mean_anomaly_J2000_deg: 142.26,
          orbital_period_days: 30685.4,
          color_hex: '#7de8e8',
          has_rings: false,
          moons_count: 27,
          texture_base: '/textures/uranus/',
        },
        {
          id: 'neptune',
          classification: 'ice_giant',
          radius_km: 24622.0,
          mass_kg: 1.02e26,
          density_g_cm3: 1.64,
          gravity_m_s2: 11.15,
          rotation_period_h: 16.11,
          axial_tilt_deg: 28.32,
          mean_temperature_k: 72,
          semi_major_axis_AU: 30.07,
          eccentricity: 0.0086,
          inclination_deg: 1.77,
          longitude_ascending_node_deg: 131.78,
          argument_perihelion_deg: 276.34,
          mean_anomaly_J2000_deg: 256.23,
          orbital_period_days: 60190.03,
          color_hex: '#3f54ba',
          has_rings: false,
          moons_count: 16,
          texture_base: '/textures/neptune/',
        },
        {
          id: 'pluto',
          classification: 'dwarf_planet',
          radius_km: 1188.3,
          mass_kg: 1.3e22,
          density_g_cm3: 1.85,
          gravity_m_s2: 0.62,
          rotation_period_h: -153.29,
          axial_tilt_deg: 122.53,
          mean_temperature_k: 44,
          semi_major_axis_AU: 39.482,
          eccentricity: 0.2488,
          inclination_deg: 17.16,
          longitude_ascending_node_deg: 110.3,
          argument_perihelion_deg: 113.83,
          mean_anomaly_J2000_deg: 14.53,
          orbital_period_days: 90560.0,
          color_hex: '#c9a97b',
          has_rings: false,
          moons_count: 5,
          texture_base: '/textures/pluto/',
        },
      ],
      asteroid_belt: {
        inner_AU: 2.2,
        outer_AU: 3.2,
        count_high: 2000,
        count_mid: 1000,
        count_low: 500,
        vertical_dispersion: 0.3,
        size_min: 0.5,
        size_max: 2.0,
        color_hex: '#888888',
      },
    },
    loading: false,
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Mock de useAppStore
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: unknown) => unknown) => {
    const state = {
      level: 'explorador' as const,
      selectedPlanet: null,
      prefersReducedMotion: false,
      sunShaderVariant: 'full' as const,
      setSelectedPlanet: vi.fn(),
    };
    return selector(state);
  },
  useLevel: () => 'explorador',
  useSelectedPlanet: () => null,
  usePrefersReducedMotion: () => false,
  useSunShaderVariant: () => 'full',
}));

// ---------------------------------------------------------------------------
// Mock de useGpuCapability
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => 'high',
}));

// ---------------------------------------------------------------------------
// Mock de @react-three/fiber
// ---------------------------------------------------------------------------

interface CapturedCanvasProps {
  dpr: unknown;
  gl: unknown;
}

const { capturedCanvasProps } = vi.hoisted((): { capturedCanvasProps: CapturedCanvasProps } => ({
  capturedCanvasProps: { dpr: undefined, gl: undefined },
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, dpr, gl }: { children: React.ReactNode; dpr?: unknown; gl?: unknown }) => {
    capturedCanvasProps.dpr = dpr;
    capturedCanvasProps.gl = gl;
    return <div data-testid="r3f-canvas">{children}</div>;
  },
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="effect-composer">{children}</div>
  ),
  Bloom: () => null,
}));

// ---------------------------------------------------------------------------
// Mock de @react-three/drei
// ---------------------------------------------------------------------------

vi.mock('@react-three/drei', () => ({
  Stars: () => <mesh data-testid="stars" />,
  OrbitControls: () => null,
  PerformanceMonitor: () => null,
  useProgress: () => ({ progress: 100 }),
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

// ---------------------------------------------------------------------------
// Import del componente DESPUÉS de los mocks
// ---------------------------------------------------------------------------

import { SolarSystemScene } from '@/scenes/SolarSystemScene';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockCounts.Sun = 0;
  mockCounts.Planet = 0;
  mockCounts.Saturn = 0;
  mockCounts.AsteroidBelt = 0;
  mockCounts.PlanetMoon = 0;
  mockCounts.CameraController = 0;
  mockCounts.OrbitPath = 0;
});

describe('<SolarSystemScene> — composición de componentes', () => {
  it('renderiza el canvas R3F', () => {
    render(<SolarSystemScene />);
    expect(screen.getByTestId('r3f-canvas')).toBeDefined();
  });

  it('monta exactamente 1 Sun', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.Sun).toBe(1);
  });

  it('monta exactamente 8 Planets (todos excepto Saturno)', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.Planet).toBe(8);
  });

  it('monta exactamente 1 Saturn', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.Saturn).toBe(1);
  });

  it('monta exactamente 1 AsteroidBelt', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.AsteroidBelt).toBe(1);
  });

  it('monta exactamente 1 PlanetMoon', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.PlanetMoon).toBe(1);
  });

  it('monta exactamente 1 CameraController', () => {
    render(<SolarSystemScene />);
    expect(mockCounts.CameraController).toBe(1);
  });

  it('Canvas recibe dpr=1 (reducido para performance)', () => {
    render(<SolarSystemScene />);
    expect(capturedCanvasProps.dpr).toBe(1);
  });

  it('Canvas recibe gl con powerPreference=high-performance', () => {
    render(<SolarSystemScene />);
    const gl = capturedCanvasProps.gl as Record<string, unknown>;
    expect(gl).toBeDefined();
    expect(gl['powerPreference']).toBe('high-performance');
  });
});

describe('<SolarSystemScene> — escena con datos', () => {
  it('monta sin errores cuando usePlanetsData retorna datos completos', () => {
    expect(() => {
      render(<SolarSystemScene />);
    }).not.toThrow();
  });

  it('monta OrbitPaths (uno por planeta)', () => {
    render(<SolarSystemScene />);
    // 9 planetas = 9 orbit paths
    expect(mockCounts.OrbitPath).toBe(9);
  });
});
