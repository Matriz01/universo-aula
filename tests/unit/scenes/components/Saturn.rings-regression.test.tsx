/**
 * Tests de regresión — anillos de Saturno con level=explorador.
 *
 * TDD Phase B.5 (TEST) — guarda ADR-3: los anillos mantienen MeshBasicMaterial
 * en todos los niveles pedagógicos (sin cambios en el tratamiento visual de los anillos).
 *
 * Spec: REQ-TOON-3, REQ-TOON-4 (fallback), REQ-DISP-2
 * Design: §2 Saturn.tsx wiring, ADR-3
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { useTextureSpy, usePlanetPositionSpy, ringMaterialCallsRef, acquireSpy, releaseSpy } =
  vi.hoisted(() => {
    const ringMatCalls: object[] = [];
    return {
      useTextureSpy: vi.fn().mockReturnValue({}),
      usePlanetPositionSpy: vi.fn().mockReturnValue({
        current: {
          x: 30,
          y: 0,
          z: 0,
          set: vi.fn(),
          copy: vi.fn(),
          clone: vi.fn(() => ({ x: 30, y: 0, z: 0 })),
        },
      }),
      ringMaterialCallsRef: ringMatCalls,
      acquireSpy: vi.fn().mockReturnValue({ isTexture: true }),
      releaseSpy: vi.fn(),
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
  useTexture: useTextureSpy,
}));

vi.mock('@/scenes/hooks/usePlanetPosition', () => ({
  usePlanetPosition: usePlanetPositionSpy,
}));

vi.mock('@/scenes/data/toonGradient', () => ({
  acquireToonGradientTexture: acquireSpy,
  releaseToonGradientTexture: releaseSpy,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      viewMode: 'global',
      showRotationAxes: false,
    }),
}));

vi.mock('@/scenes/simulationClock', () => ({
  getJD: () => 2451545.0,
  J2000_JD: 2451545.0,
}));

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  // Capturamos instancias de MeshBasicMaterial para verificar que los anillos lo usan
  const OriginalMeshBasicMaterial = actual['MeshBasicMaterial'] as new (params?: object) => object;

  class TrackingMeshBasicMaterial extends OriginalMeshBasicMaterial {
    constructor(params?: object) {
      super(params);
      ringMaterialCallsRef.push(this);
    }
  }

  return {
    ...actual,
    MeshBasicMaterial: TrackingMeshBasicMaterial,
  };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { Saturn } from '@/scenes/components/Saturn';
import { MeshBasicMaterial } from 'three';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const saturnData: PlanetData = {
  id: 'saturn',
  classification: 'gas_giant',
  radius_km: 58232,
  mass_kg: 5.683e26,
  density_g_cm3: 0.687,
  gravity_m_s2: 10.44,
  rotation_period_h: 10.7,
  axial_tilt_deg: 26.73,
  mean_temperature_k: 134,
  semi_major_axis_AU: 9.537,
  eccentricity: 0.0565,
  inclination_deg: 2.485,
  longitude_ascending_node_deg: 113.665,
  argument_perihelion_deg: 339.392,
  mean_anomaly_J2000_deg: 317.02,
  orbital_period_days: 10759.22,
  color_hex: '#e4d191',
  has_rings: true,
  moons_count: 83,
  texture_base: '/textures/saturn/',
  rings: {
    inner_radius_km: 74658,
    outer_radius_km: 140180,
    texture: '/textures/saturn-rings/2k.png',
  },
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  useTextureSpy.mockReturnValue({});
  usePlanetPositionSpy.mockReturnValue({
    current: {
      x: 30,
      y: 0,
      z: 0,
      set: vi.fn(),
      copy: vi.fn(),
      clone: vi.fn(() => ({ x: 30, y: 0, z: 0 })),
    },
  });
  acquireSpy.mockReturnValue({ isTexture: true });
  ringMaterialCallsRef.length = 0;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<Saturn> — regresión anillos (Phase B.5, ADR-3)', () => {
  it('Scenario anillos-material-preservado: anillos usan MeshBasicMaterial en level=explorador', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="explorador" />
      </div>,
    );

    // Al menos una instancia de MeshBasicMaterial fue creada (la del anillo)
    const ringMaterials = ringMaterialCallsRef.filter((m) => m instanceof MeshBasicMaterial);
    expect(ringMaterials.length).toBeGreaterThanOrEqual(1);
  });

  it('Scenario anillos-material-preservado aprendiz: anillos usan MeshBasicMaterial en level=aprendiz', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="aprendiz" />
      </div>,
    );

    const ringMaterials = ringMaterialCallsRef.filter((m) => m instanceof MeshBasicMaterial);
    expect(ringMaterials.length).toBeGreaterThanOrEqual(1);
  });

  it('Scenario anillos-no-crash explorador: render de Saturn en explorador no lanza errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Saturn planet={saturnData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('Scenario anillos-no-crash aprendiz: render de Saturn en aprendiz no lanza errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Saturn planet={saturnData} level="aprendiz" />
        </div>,
      );
    }).not.toThrow();
  });

  it('Scenario esfera-explorador-toon: en explorador, el gradient es adquirido (esfera usa toon)', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="explorador" />
      </div>,
    );

    // El hook usePlanetMaterial adquiere el gradient para el toon en explorador
    expect(acquireSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario esfera-aprendiz-standard: en aprendiz, gradient NO es adquirido', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="aprendiz" />
      </div>,
    );

    expect(acquireSpy).not.toHaveBeenCalled();
  });
});
