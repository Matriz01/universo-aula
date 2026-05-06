/**
 * Tests del componente <Planet> — verifica render básico con mocks R3F.
 *
 * Estrategia: mock de @react-three/fiber y @react-three/drei.
 * Verificamos que el componente monta sin errores, llama a useTexture
 * y usa useBodyPosition (post-refactor-C).
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Hoisted mocks (vi.hoisted se ejecuta antes de imports — no usar clases importadas)
// ---------------------------------------------------------------------------

const { useTextureSpy, useBodyPositionSpy } = vi.hoisted(() => {
  const mockVec3 = { x: 5, y: 0, z: 0, copy: () => {}, set: () => {}, clone: () => mockVec3 };
  const textureSpy = vi.fn().mockReturnValue({});
  const bodyPosSpy = vi.fn().mockReturnValue(mockVec3);
  return {
    useTextureSpy: textureSpy,
    useBodyPositionSpy: bodyPosSpy,
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
    camera: { position: { set: vi.fn() }, near: 0.1, far: 1000 },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  useTexture: useTextureSpy,
  Html: ({ children, distanceFactor }: { children: React.ReactNode; distanceFactor?: number }) => (
    <div data-testid="planet-label" data-distance-factor={distanceFactor}>
      {children}
    </div>
  ),
  Lod: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
  Detailed: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
}));

// ---------------------------------------------------------------------------
// Mock de react-i18next
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Mock de useBodyPosition (post-refactor-C)
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/useBodyPosition', () => ({
  useBodyPosition: useBodyPositionSpy,
  computeBodyPosition: vi.fn().mockReturnValue({ x: 5, y: 0, z: 0 }),
}));

// ---------------------------------------------------------------------------
// Mock del store — simulationTime y viewMode
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock de three (sólo para capturar mesh)
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import del componente DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { Planet } from '@/scenes/components/Planet';

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

const plutoData: PlanetData = {
  id: 'pluto',
  classification: 'dwarf_planet',
  radius_km: 1188.3,
  mass_kg: 1.303e22,
  density_g_cm3: 1.853,
  gravity_m_s2: 0.62,
  rotation_period_h: -153.2928,
  axial_tilt_deg: 122.53,
  mean_temperature_k: 44,
  semi_major_axis_AU: 39.482,
  eccentricity: 0.2488,
  inclination_deg: 17.16,
  longitude_ascending_node_deg: 110.299,
  argument_perihelion_deg: 113.834,
  mean_anomaly_J2000_deg: 14.53,
  orbital_period_days: 90560.0,
  color_hex: '#c9a97b',
  has_rings: false,
  moons_count: 5,
  texture_base: '/textures/pluto/',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  useTextureSpy.mockReturnValue({});
  useBodyPositionSpy.mockReturnValue({
    x: 5,
    y: 0,
    z: 0,
    copy: () => {},
    set: () => {},
    clone: () => ({}),
  });
});

describe('<Planet> — render básico', () => {
  it('monta sin errores con earthData y nivel explorador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('llama a useTexture con la ruta de textura correcta', () => {
    render(
      <div data-testid="canvas">
        <Planet planet={earthData} level="aprendiz" />
      </div>,
    );
    expect(useTextureSpy).toHaveBeenCalled();
    const callArg = useTextureSpy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain('earth');
  });

  it('llama a useBodyPosition con el planeta correcto', () => {
    render(
      <div data-testid="canvas">
        <Planet planet={earthData} level="aprendiz" />
      </div>,
    );
    expect(useBodyPositionSpy).toHaveBeenCalledWith(
      earthData,
      expect.any(Date),
      expect.any(String),
    );
  });

  it('monta con plutoData en variant="dwarf" sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={plutoData} level="explorador" variant="dwarf" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con nivel investigador sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="investigador" />
        </div>,
      );
    }).not.toThrow();
  });
});

describe('<Planet> — variante dwarf', () => {
  it('acepta prop variant="dwarf" sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={plutoData} level="explorador" variant="dwarf" />
        </div>,
      );
    }).not.toThrow();
  });

  it('acepta prop variant="normal" sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="explorador" variant="normal" />
        </div>,
      );
    }).not.toThrow();
  });
});

describe('<Planet> — label i18n y distanceFactor', () => {
  it('monta con label sin errores (react-i18next mockeado)', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con variant dwarf sin errores con i18n', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={plutoData} level="explorador" variant="dwarf" />
        </div>,
      );
    }).not.toThrow();
  });
});
