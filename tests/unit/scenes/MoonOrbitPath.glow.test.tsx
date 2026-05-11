/**
 * Tests de glow aditivo de MoonOrbitPath según GPU tier.
 *
 * Spec: REQ-ORB-3
 * Design: §4 MoonOrbitPath glow (ADR-4 extendido a la órbita lunar)
 *
 * Estrategia: renderizar <SolarSystemScene> en modo local con Tierra seleccionada,
 * que activa el render de MoonOrbitPath. Se espía <Line> de @react-three/drei
 * y se controla useGpuCapability para verificar:
 *   - GPU high/mid → MoonOrbitPath renderiza 2 Lines (principal + glow)
 *   - GPU low      → MoonOrbitPath renderiza 1 Line (solo principal)
 *   - La línea glow tiene blending=AdditiveBlending, opacity=0.15, lineWidth=4
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { AdditiveBlending } from 'three';

// ---------------------------------------------------------------------------
// Hoisted — lineSpy y mockGpu deben estar disponibles en vi.mock factories
// ---------------------------------------------------------------------------

const { lineSpy, mockGpu } = vi.hoisted(() => {
  const gpu = { current: 'high' as 'high' | 'mid' | 'low' | null };
  const lSpy = vi.fn().mockReturnValue(null);
  return { lineSpy: lSpy, mockGpu: gpu };
});

// ---------------------------------------------------------------------------
// Mock de @react-three/fiber
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock de @react-three/drei — Line es el spy; el resto son stubs ligeros
// ---------------------------------------------------------------------------

vi.mock('@react-three/drei', () => ({
  Stars: () => null,
  OrbitControls: () => null,
  PerformanceMonitor: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useProgress: () => ({ progress: 100 }),
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: lineSpy,
}));

// ---------------------------------------------------------------------------
// Mock de useGpuCapability — controlado por mockGpu.current
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => mockGpu.current,
}));

// ---------------------------------------------------------------------------
// Mock de @react-three/postprocessing
// ---------------------------------------------------------------------------

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Bloom: () => null,
}));

// ---------------------------------------------------------------------------
// Mock de three — passthrough (sin OOM)
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Mock de componentes hijos pesados — solo stubs, no nos interesan aquí
// ---------------------------------------------------------------------------

vi.mock('@/scenes/components/Sun', () => ({ Sun: () => null }));
vi.mock('@/scenes/components/Planet', () => ({ Planet: () => null }));
vi.mock('@/scenes/components/Saturn', () => ({ Saturn: () => null }));
vi.mock('@/scenes/components/AsteroidBelt', () => ({ AsteroidBelt: () => null }));
vi.mock('@/scenes/components/PlanetMoon', () => ({ PlanetMoon: () => null }));
vi.mock('@/scenes/components/CameraController', () => ({ CameraController: () => null }));
vi.mock('@/scenes/components/OrbitPath', () => ({ OrbitPath: () => null }));
vi.mock('@/scenes/components/DistantMarker', () => ({ DistantMarker: () => null }));
vi.mock('@/scenes/components/KnownEventsLayer', () => ({ KnownEventsLayer: () => null }));
vi.mock('@/scenes/SimulationTicker', () => ({ SimulationTicker: () => null }));
vi.mock('@/scenes/PausedBridge', () => ({ PausedBridge: () => null }));
vi.mock('@/scenes/components/RotationAxisLine', () => ({ RotationAxisLine: () => null }));
vi.mock('@/scenes/components/RimOutline', () => ({ RimOutline: () => null }));

// ---------------------------------------------------------------------------
// Mock de useAppStore — modo local con Tierra seleccionada para activar MoonOrbitPath
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      level: 'explorador' as const,
      selectedPlanet: 'earth',
      selectedBody: 'earth',
      viewMode: 'local' as const,
      prefersReducedMotion: false,
      sunShaderVariant: 'full' as const,
      goToBody: vi.fn(),
      showKnownEvents: false,
      showRotationAxes: false,
    };
    return selector(state);
  },
}));

// ---------------------------------------------------------------------------
// Mock de usePlanetsData — dataset mínimo con la Tierra
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({
    data: {
      version: '1.0',
      source: 'test',
      epoch_JD: 2451545.0,
      planets: [
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
      ],
      asteroid_belt: {
        inner_AU: 2.2,
        outer_AU: 3.2,
        count_high: 10,
        count_mid: 5,
        count_low: 2,
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
// Mock de usePlanetPosition — posición fija para la Tierra
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/usePlanetPosition', () => ({
  usePlanetPosition: vi.fn().mockReturnValue({
    current: { x: 1.0, y: 0, z: 0, set: vi.fn() },
  }),
  computePosition: vi.fn().mockReturnValue({ x: 1.0, y: 0, z: 0 }),
}));

// ---------------------------------------------------------------------------
// Mock de simulationClock
// ---------------------------------------------------------------------------

vi.mock('@/scenes/simulationClock', () => ({
  getJD: () => 2451545.0,
  J2000_JD: 2451545.0,
}));

// ---------------------------------------------------------------------------
// Mock de OriginOffsetContext — stub mínimo
// ---------------------------------------------------------------------------

vi.mock('@/scenes/contexts/OriginOffsetContext', () => ({
  OriginOffsetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useOriginOffset: () => ({ current: { x: 0, y: 0, z: 0, set: vi.fn() } }),
}));

// ---------------------------------------------------------------------------
// Import DESPUÉS de los mocks
// ---------------------------------------------------------------------------

import { SolarSystemScene } from '@/scenes/SolarSystemScene';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  lineSpy.mockReturnValue(null);
});

// ---------------------------------------------------------------------------
// Tests — REQ-ORB-3: MoonOrbitPath glow según GPU tier
// ---------------------------------------------------------------------------

describe('MoonOrbitPath — glow aditivo según GPU tier (REQ-ORB-3)', () => {
  it('gpu="high" → MoonOrbitPath renderiza 2 líneas (principal + glow)', () => {
    mockGpu.current = 'high';
    render(<SolarSystemScene />);
    // MoonOrbitPath es el único componente que llama a <Line> en este setup
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });

  it('gpu="mid" → MoonOrbitPath renderiza 2 líneas (principal + glow)', () => {
    mockGpu.current = 'mid';
    render(<SolarSystemScene />);
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });

  it('gpu="low" → MoonOrbitPath renderiza 1 línea (solo principal, sin glow)', () => {
    mockGpu.current = 'low';
    render(<SolarSystemScene />);
    expect(lineSpy).toHaveBeenCalledTimes(1);
  });

  it('gpu=null (detectando) → trata null como "mid" y renderiza 2 líneas', () => {
    mockGpu.current = null;
    render(<SolarSystemScene />);
    // null → fallback 'mid' → showMoonGlow=true → 2 líneas
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });
});

describe('MoonOrbitPath — propiedades de la línea glow (REQ-ORB-3)', () => {
  beforeEach(() => {
    mockGpu.current = 'high';
  });

  it('línea glow: blending=AdditiveBlending', () => {
    render(<SolarSystemScene />);
    // El glow se renderiza primero en el JSX (renderOrder=-1)
    const glowProps = lineSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(glowProps['blending']).toBe(AdditiveBlending);
  });

  it('línea glow: opacity=0.15', () => {
    render(<SolarSystemScene />);
    const glowProps = lineSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(glowProps['opacity']).toBe(0.15);
  });

  it('línea glow: lineWidth=4', () => {
    render(<SolarSystemScene />);
    const glowProps = lineSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(glowProps['lineWidth']).toBe(4);
  });
});
