/**
 * Tests del componente <DistantMarker>.
 *
 * Post-refactor-C: usa useBodyPosition (time-driven) en lugar de usePlanetPosition (legacy).
 * Verifica que renderiza sin errores y usa useBodyPosition para calcular la posición.
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';
import type { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Hoisted mocks (vi.hoisted se ejecuta antes de imports — no usar clases importadas)
// ---------------------------------------------------------------------------

const { useBodyPositionSpy } = vi.hoisted(() => {
  const mockVec3 = { x: 10, y: 0, z: 5, copy: () => {}, set: () => {}, clone: () => mockVec3 };
  return {
    useBodyPositionSpy: vi.fn().mockReturnValue(mockVec3),
  };
});

// ---------------------------------------------------------------------------
// Mocks
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
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/scenes/hooks/useBodyPosition', () => ({
  useBodyPosition: useBodyPositionSpy,
  computeBodyPosition: vi.fn().mockReturnValue({ x: 10, y: 0, z: 5 }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      simulationTime: new Date('2000-01-01T12:00:00Z'),
      simulationSpeed: 1,
      viewMode: 'global',
      level: 'aprendiz',
    }),
  ),
}));

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { DistantMarker } from '@/scenes/components/DistantMarker';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const marsData: PlanetData = {
  id: 'mars',
  classification: 'terrestrial',
  radius_km: 3389.5,
  mass_kg: 6.39e23,
  density_g_cm3: 3.933,
  gravity_m_s2: 3.72,
  rotation_period_h: 24.6229,
  axial_tilt_deg: 25.19,
  mean_temperature_k: 210,
  semi_major_axis_AU: 1.524,
  eccentricity: 0.0934,
  inclination_deg: 1.85,
  longitude_ascending_node_deg: 49.558,
  argument_perihelion_deg: 286.502,
  mean_anomaly_J2000_deg: 19.412,
  orbital_period_days: 686.971,
  color_hex: '#c1440e',
  has_rings: false,
  moons_count: 2,
  texture_base: '/textures/mars/',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  useBodyPositionSpy.mockReturnValue({
    x: 10,
    y: 0,
    z: 5,
    copy: () => {},
    set: () => {},
    clone: () => ({}),
  });
});

describe('<DistantMarker> — render básico', () => {
  it('monta sin errores con datos de Marte', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <DistantMarker planet={marsData} />
        </div>,
      );
    }).not.toThrow();
  });

  it('usa useBodyPosition para calcular posición (post-refactor-C)', () => {
    render(
      <div data-testid="canvas">
        <DistantMarker planet={marsData} />
      </div>,
    );
    expect(useBodyPositionSpy).toHaveBeenCalledWith(marsData, expect.any(Date), expect.any(String));
  });

  it('monta con positionsRef sin errores (prop deprecated ignorada)', () => {
    const ref = { current: { mars: { x: 10, y: 0, z: 5 } as unknown as Vector3 } };
    expect(() => {
      render(
        <div data-testid="canvas">
          <DistantMarker planet={marsData} positionsRef={ref} />
        </div>,
      );
    }).not.toThrow();
  });
});
