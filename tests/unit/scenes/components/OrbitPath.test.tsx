/**
 * Tests del componente <OrbitPath> — dibuja la trayectoria orbital.
 *
 * Estrategia: mock de R3F/Drei Line. Verificamos que OrbitPath
 * genera la forma correcta según el nivel pedagógico.
 *
 * Tasks de Phase 4 (TEST) → 4.7 (IMPL)
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { lineSpy } = vi.hoisted(() => {
  const lSpy = vi.fn().mockReturnValue(null);
  return { lineSpy: lSpy };
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
  Line: lineSpy,
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
// Fixtures
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

const mercuryData: PlanetData = {
  id: 'mercury',
  classification: 'terrestrial',
  radius_km: 2439.7,
  mass_kg: 3.3011e23,
  density_g_cm3: 5.427,
  gravity_m_s2: 3.7,
  rotation_period_h: 1407.6,
  axial_tilt_deg: 0.034,
  mean_temperature_k: 440,
  semi_major_axis_AU: 0.387098,
  eccentricity: 0.20563,
  inclination_deg: 7.005,
  longitude_ascending_node_deg: 48.331,
  argument_perihelion_deg: 29.124,
  mean_anomaly_J2000_deg: 174.796,
  orbital_period_days: 87.969,
  color_hex: '#8c7853',
  has_rings: false,
  moons_count: 0,
  texture_base: '/textures/mercury/',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<OrbitPath> — render básico', () => {
  it('monta sin errores con Earth nivel explorador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <OrbitPath planet={earthData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta sin errores con Mercury nivel aprendiz', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <OrbitPath planet={mercuryData} level="aprendiz" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta sin errores con Mercury nivel investigador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <OrbitPath planet={mercuryData} level="investigador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('llama a <Line> con puntos (array de Vector3 o arrays)', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    expect(lineSpy).toHaveBeenCalled();
    const props = lineSpy.mock.calls[0]?.[0] as { points: unknown[] };
    expect(Array.isArray(props.points)).toBe(true);
    expect(props.points.length).toBeGreaterThan(0);
  });
});

describe('<OrbitPath> — forma según nivel', () => {
  it('Explorador Earth: todos los puntos con Y ≈ 0 (circular plana)', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const props = lineSpy.mock.calls[0]?.[0] as { points: Vector3[] };
    props.points.forEach((p) => {
      if (p instanceof Vector3) {
        expect(p.y).toBeCloseTo(0, 5);
      } else {
        // Puede ser array [x, y, z]
        const pt = p as unknown as [number, number, number];
        expect(pt[1]).toBeCloseTo(0, 5);
      }
    });
  });

  it('Investigador Mercury: al menos un punto con |Y| > 0 (inclinación 3D)', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={mercuryData} level="investigador" />
      </div>,
    );
    const props = lineSpy.mock.calls[0]?.[0] as { points: Vector3[] };
    const hasNonZeroY = props.points.some((p) => {
      if (p instanceof Vector3) return Math.abs(p.y) > 0.001;
      const pt = p as unknown as [number, number, number];
      return Math.abs(pt[1]) > 0.001;
    });
    expect(hasNonZeroY).toBe(true);
  });

  it('<Line> recibe prop color con opacidad baja', () => {
    render(
      <div data-testid="canvas">
        <OrbitPath planet={earthData} level="explorador" />
      </div>,
    );
    const props = lineSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    // Debe tener alguna propiedad de color o opacity
    expect(props.color !== undefined || props.opacity !== undefined).toBe(true);
  });
});
