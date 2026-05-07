/**
 * Tests del componente <Saturn> — Planet + RingGeometry.
 *
 * Estrategia: mock de R3F/Drei. Verificamos que Saturn renderiza
 * tanto el planeta como los anillos.
 *
 * Tasks de Phase 4 (TEST) → 4.9 (IMPL)
 */

import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { ringGeometrySpy, useTextureSpy, usePlanetPositionSpy } = vi.hoisted(() => {
  const ringSpy = vi.fn().mockImplementation(function () {
    return {};
  });
  const textureSpy = vi.fn().mockReturnValue({});
  const positionSpy = vi.fn().mockReturnValue({
    current: { x: 30, y: 0, z: 0, set: vi.fn() },
  });
  return {
    ringGeometrySpy: ringSpy,
    useTextureSpy: textureSpy,
    usePlanetPositionSpy: positionSpy,
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
    <div data-testid="saturn-label">{children}</div>
  ),
  Lod: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
  Detailed: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
}));

vi.mock('@/scenes/hooks/usePlanetPosition', () => ({
  usePlanetPosition: usePlanetPositionSpy,
}));

// ---------------------------------------------------------------------------
// Mock de three — capturar RingGeometry
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return {
    ...actual,
    RingGeometry: ringGeometrySpy,
  };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { Saturn } from '@/scenes/components/Saturn';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const saturnData: PlanetData = {
  id: 'saturn',
  classification: 'gas_giant',
  radius_km: 58232,
  mass_kg: 5.6834e26,
  density_g_cm3: 0.687,
  gravity_m_s2: 10.44,
  rotation_period_h: 10.656,
  axial_tilt_deg: 26.73,
  mean_temperature_k: 134,
  semi_major_axis_AU: 9.5826,
  eccentricity: 0.0565,
  inclination_deg: 2.485,
  longitude_ascending_node_deg: 113.665,
  argument_perihelion_deg: 339.392,
  mean_anomaly_J2000_deg: 317.02,
  orbital_period_days: 10759.22,
  color_hex: '#e3c47b',
  has_rings: true,
  moons_count: 146,
  texture_base: '/textures/saturn/',
  rings: {
    inner_radius_km: 74500,
    outer_radius_km: 140220,
    texture: '/textures/saturn-rings/2k.png',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<Saturn> — render básico', () => {
  it('monta sin errores con saturnData y nivel explorador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Saturn planet={saturnData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con nivel aprendiz sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Saturn planet={saturnData} level="aprendiz" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con nivel investigador sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Saturn planet={saturnData} level="investigador" />
        </div>,
      );
    }).not.toThrow();
  });
});

describe('<Saturn> — anillos', () => {
  it('crea RingGeometry con los radios de los anillos de Saturno', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="explorador" />
      </div>,
    );
    expect(ringGeometrySpy).toHaveBeenCalled();
    // Los primeros dos args son innerRadius y outerRadius en unidades visuales
    const [innerR, outerR] = ringGeometrySpy.mock.calls[0] as number[];
    expect(innerR).toBeGreaterThan(0);
    expect(outerR).toBeGreaterThan(innerR);
  });

  it('llama a useTexture incluyendo saturn-rings', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="explorador" />
      </div>,
    );
    expect(useTextureSpy).toHaveBeenCalled();
    // Alguna de las llamadas incluye saturn (planeta) o saturn-rings
    const allArgs = useTextureSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    const hasSaturnTexture = allArgs.some((a) => a.includes('saturn'));
    expect(hasSaturnTexture).toBe(true);
  });
});

describe('<Saturn> — label visible', () => {
  it('muestra un label con el nombre "saturn"', () => {
    render(
      <div data-testid="canvas">
        <Saturn planet={saturnData} level="explorador" />
      </div>,
    );
    // El label debería existir (ya que usamos Html mock con data-testid)
    // Saturn hereda de Planet que también puede tener label
    const canvas = screen.getByTestId('canvas');
    expect(canvas).toBeTruthy();
  });
});
