/**
 * Tests del componente <PlanetMoon> — Luna orbitando la Tierra.
 *
 * Post-refactor-C: usa useBodyPosition (time-driven) en lugar de
 * usePlanetPosition (legacy).
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks (vi.hoisted se ejecuta antes de imports — no usar clases importadas)
// ---------------------------------------------------------------------------

const { useTextureSpy, useBodyPositionSpy, usePlanetsDataSpy } = vi.hoisted(() => {
  const mockVec3 = { x: 149598, y: 0, z: 0, copy: () => {}, set: () => {}, clone: () => mockVec3 };
  const textureSpy = vi.fn().mockReturnValue({});
  const bodyPosSpy = vi.fn().mockReturnValue(mockVec3);
  const planetsDataSpy = vi.fn().mockReturnValue({ data: null, loading: false, error: null });
  return {
    useTextureSpy: textureSpy,
    useBodyPositionSpy: bodyPosSpy,
    usePlanetsDataSpy: planetsDataSpy,
  };
});

// ---------------------------------------------------------------------------
// Mocks de R3F y Drei
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  useTexture: useTextureSpy,
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="moon-label">{children}</div>
  ),
}));

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Mocks de hooks de escena (post-refactor-C)
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/useBodyPosition', () => ({
  useBodyPosition: useBodyPositionSpy,
  computeBodyPosition: vi.fn().mockReturnValue({ x: 149598, y: 0, z: 0 }),
}));

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: usePlanetsDataSpy,
}));

// ---------------------------------------------------------------------------
// Mock del store
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      simulationTime: new Date('2000-01-01T12:00:00Z'),
      simulationSpeed: 1,
      viewMode: 'global',
      selectedPlanet: null,
      level: 'aprendiz',
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { PlanetMoon } from '@/scenes/components/PlanetMoon';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  const mockVec3 = { x: 149598, y: 0, z: 0, copy: () => {}, set: () => {}, clone: () => mockVec3 };
  useTextureSpy.mockReturnValue({});
  useBodyPositionSpy.mockReturnValue(mockVec3);
  usePlanetsDataSpy.mockReturnValue({ data: null, loading: false, error: null });
});

describe('<PlanetMoon> — render básico', () => {
  it('monta sin errores sin props (posición por defecto)', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con earthPosition prop sin errores (prop deprecated, se ignora)', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon earthPosition={[5, 0, 0]} />
        </div>,
      );
    }).not.toThrow();
  });

  it('llama a useTexture con ruta que incluye moon', () => {
    render(
      <div data-testid="canvas">
        <PlanetMoon />
      </div>,
    );
    expect(useTextureSpy).toHaveBeenCalled();
    const callArg = useTextureSpy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain('moon');
  });
});

describe('<PlanetMoon> — modo local (post-refactor-C)', () => {
  it('invoca useBodyPosition para calcular posición de la Tierra', () => {
    render(
      <div data-testid="canvas">
        <PlanetMoon />
      </div>,
    );
    // useBodyPosition debe haberse llamado (para la Tierra)
    expect(useBodyPositionSpy).toHaveBeenCalled();
  });

  it('monta sin errores cuando usePlanetsData devuelve datos de Tierra', () => {
    const earthDataMock = {
      id: 'earth',
      classification: 'terrestrial',
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
    usePlanetsDataSpy.mockReturnValue({
      data: {
        planets: [earthDataMock],
        version: '1',
        source: 'test',
        epoch_JD: 0,
        asteroid_belt: {},
      },
      loading: false,
      error: null,
    });

    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon />
        </div>,
      );
    }).not.toThrow();

    // useBodyPosition recibe los datos reales de Tierra
    expect(useBodyPositionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'earth' }),
      expect.any(Date),
      expect.any(String),
    );
  });

  it('monta sin errores cuando usePlanetsData aún está cargando (fallback)', () => {
    usePlanetsDataSpy.mockReturnValue({ data: null, loading: true, error: null });

    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon />
        </div>,
      );
    }).not.toThrow();

    // Incluso sin datos, useBodyPosition se llama con el objeto fallback de la Tierra
    expect(useBodyPositionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'earth', semi_major_axis_AU: 1.0 }),
      expect.any(Date),
      expect.any(String),
    );
  });
});
