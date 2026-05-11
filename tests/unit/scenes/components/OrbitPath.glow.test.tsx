/**
 * Tests de Phase D — OrbitPath con glow aditivo según GPU tier.
 *
 * T D.1 (TEST): verifica que:
 *   - GPU high/mid → 2 <Line> (principal + glow)
 *   - GPU low      → 1 <Line> (solo principal)
 *   - Props de la línea principal: lineWidth=2, opacity=0.5
 *   - Props de la línea glow: lineWidth=4, opacity=0.15, blending=AdditiveBlending, depthWrite=false
 *
 * Estrategia: mock de @react-three/drei Line (captura todas las llamadas),
 * mock de useGpuCapability para controlar el tier de GPU.
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';
import { AdditiveBlending } from 'three';

// ---------------------------------------------------------------------------
// Hoisted mocks — deben declararse antes de vi.mock
// ---------------------------------------------------------------------------

const { lineSpy, mockGpu } = vi.hoisted(() => {
  const gpu = { current: 'high' as 'high' | 'mid' | 'low' | null };
  // lineSpy captura cada llamada a <Line> por separado
  const lSpy = vi.fn().mockReturnValue(null);
  return { lineSpy: lSpy, mockGpu: gpu };
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
  Line: lineSpy,
}));

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => mockGpu.current,
}));

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { OrbitPath } from '@/scenes/components/OrbitPath';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const earthData: PlanetData = {
  id: 'earth',
  classification: 'terrestrial',
  radius_km: 6371.0,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<OrbitPath> — glow aditivo según GPU tier', () => {
  it('gpu="high" → renderiza 2 líneas (principal + glow)', () => {
    mockGpu.current = 'high';
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });

  it('gpu="mid" → renderiza 2 líneas (principal + glow)', () => {
    mockGpu.current = 'mid';
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });

  it('gpu="low" → renderiza 1 línea (solo la principal)', () => {
    mockGpu.current = 'low';
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    expect(lineSpy).toHaveBeenCalledTimes(1);
  });

  it('gpu=null (detecting) → renderiza 2 líneas (trata null como mid)', () => {
    mockGpu.current = null;
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    // null → fallback 'mid' → showGlow=true → 2 líneas
    expect(lineSpy).toHaveBeenCalledTimes(2);
  });
});

describe('<OrbitPath> — propiedades de la línea principal', () => {
  beforeEach(() => {
    mockGpu.current = 'high';
  });

  it('línea principal: lineWidth=2', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    // La línea principal es la segunda llamada (renderOrder=0) cuando hay glow
    // Con gpu high hay 2 calls. El orden en JSX: glow primero (renderOrder=-1), main después.
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const mainProps = calls[1][0];
    expect(mainProps['lineWidth']).toBe(2);
  });

  it('línea principal: opacity=0.5', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const mainProps = calls[1][0];
    expect(mainProps['opacity']).toBe(0.5);
  });
});

describe('<OrbitPath> — propiedades de la línea glow', () => {
  beforeEach(() => {
    mockGpu.current = 'high';
  });

  it('línea glow: lineWidth=4', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const glowProps = calls[0][0]; // glow es el primero en JSX
    expect(glowProps['lineWidth']).toBe(4);
  });

  it('línea glow: opacity=0.15', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const glowProps = calls[0][0];
    expect(glowProps['opacity']).toBe(0.15);
  });

  it('línea glow: blending=AdditiveBlending', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const glowProps = calls[0][0];
    expect(glowProps['blending']).toBe(AdditiveBlending);
  });

  it('línea glow: depthWrite=false', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const glowProps = calls[0][0];
    expect(glowProps['depthWrite']).toBe(false);
  });

  it('línea glow: renderOrder menor que la principal', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const calls = lineSpy.mock.calls as Array<[Record<string, unknown>]>;
    const glowProps = calls[0][0];
    const mainProps = calls[1][0];
    const glowOrder = (glowProps['renderOrder'] as number) ?? -1;
    const mainOrder = (mainProps['renderOrder'] as number) ?? 0;
    expect(glowOrder).toBeLessThan(mainOrder);
  });
});
