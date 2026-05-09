/**
 * Tests de integración del material-swap en <Planet>.
 *
 * TDD Phase B.1 (TEST) → B.2 (IMPL)
 * Spec: REQ-TOON-2, REQ-RIM-2, REQ-DISP-1
 * Design: §2 Planet.tsx wiring
 *
 * Estrategia:
 * - Spy en prototipos MeshToonMaterial.dispose y MeshStandardMaterial.dispose
 * - Verificar que el material asignado a meshRef.current.material es del tipo correcto
 * - Verificar que <RimOutline> se monta/desmonta según level
 *
 * NOTA: La integración se verifica a través del hook usePlanetMaterial.
 * El componente Planet conecta el hook con el meshRef.
 */

import { render, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect, type MockInstance } from 'vitest';
import type { PlanetData } from '@/scenes/data/types';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { useTextureSpy, usePlanetPositionSpy, acquireSpy, releaseSpy, rimOutlineSpy } = vi.hoisted(
  () => ({
    useTextureSpy: vi.fn().mockReturnValue({}),
    usePlanetPositionSpy: vi.fn().mockReturnValue({
      current: { x: 5, y: 0, z: 0, set: vi.fn(), clone: vi.fn(() => ({ x: 5, y: 0, z: 0 })) },
    }),
    acquireSpy: vi.fn().mockReturnValue({ isTexture: true }),
    releaseSpy: vi.fn(),
    rimOutlineSpy: vi.fn().mockReturnValue(null),
  }),
);

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
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="planet-label">{children}</div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'es' },
  }),
}));

vi.mock('@/scenes/hooks/usePlanetPosition', () => ({
  usePlanetPosition: usePlanetPositionSpy,
}));

vi.mock('@/scenes/data/toonGradient', () => ({
  acquireToonGradientTexture: acquireSpy,
  releaseToonGradientTexture: releaseSpy,
}));

// Mock de RimOutline — spy para contar renders (REQ-RIM-2)
vi.mock('@/scenes/components/RimOutline', () => ({
  RimOutline: rimOutlineSpy,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      viewMode: 'global',
      showRotationAxes: false,
      selectedPlanet: null,
    }),
}));

vi.mock('@/scenes/simulationClock', () => ({
  getJD: () => 2451545.0,
  J2000_JD: 2451545.0,
}));

vi.mock('@/scenes/helpers/labelHelpers', () => ({
  computeLabelOffset: () => [0, 2, 0],
}));

// ---------------------------------------------------------------------------
// Mock Three.js — solo para controlar instanceof sin OOM
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { Planet } from '@/scenes/components/Planet';
import { MeshToonMaterial, MeshStandardMaterial } from 'three';

// ---------------------------------------------------------------------------
// Spies en prototipos
// ---------------------------------------------------------------------------

let disposeToonSpy: MockInstance<() => void>;
let disposeStandardSpy: MockInstance<() => void>;

beforeEach(() => {
  vi.clearAllMocks();
  useTextureSpy.mockReturnValue({});
  usePlanetPositionSpy.mockReturnValue({
    current: { x: 5, y: 0, z: 0, set: vi.fn(), clone: vi.fn(() => ({ x: 5, y: 0, z: 0 })) },
  });
  acquireSpy.mockReturnValue({ isTexture: true });
  rimOutlineSpy.mockReturnValue(null);

  disposeToonSpy = vi.spyOn(MeshToonMaterial.prototype, 'dispose');

  disposeStandardSpy = vi.spyOn(MeshStandardMaterial.prototype, 'dispose');
});

afterEach(() => {
  disposeToonSpy.mockRestore();
  disposeStandardSpy.mockRestore();
});

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

// ---------------------------------------------------------------------------
// Wrapper para re-render con nivel controlable
// ---------------------------------------------------------------------------

function PlanetWrapper({
  initialLevel,
}: {
  initialLevel: 'explorador' | 'aprendiz' | 'investigador';
}) {
  const [level, setLevel] = useState<'explorador' | 'aprendiz' | 'investigador'>(initialLevel);

  return (
    <div>
      <button
        data-testid="toggle-btn"
        onClick={() => setLevel((l) => (l === 'explorador' ? 'aprendiz' : 'explorador'))}
      />
      <div data-testid="canvas">
        <Planet planet={earthData} level={level} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<Planet> — integración material-swap (Phase B.1)', () => {
  it('Scenario explorador-usa-toon: level=explorador → meshRef.material es MeshToonMaterial', () => {
    render(<PlanetWrapper initialLevel="explorador" />);

    // El hook usePlanetMaterial asigna el material; verificamos vía acquireSpy que
    // se ejecutó el path de explorador (acquire del gradient)
    expect(acquireSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario aprendiz-usa-standard: level=aprendiz → acquireSpy NO llamado', () => {
    render(<PlanetWrapper initialLevel="aprendiz" />);

    expect(acquireSpy).not.toHaveBeenCalled();
  });

  it('Scenario dispose-en-swap: cambio explorador→aprendiz → MeshToonMaterial.dispose llamado', () => {
    const { getByTestId } = render(<PlanetWrapper initialLevel="explorador" />);

    disposeToonSpy.mockClear();

    act(() => {
      getByTestId('toggle-btn').click();
    });

    expect(disposeToonSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario rimoutline-explorador: exactamente 1 <RimOutline> renderizado con level=explorador', () => {
    // rimOutlineSpy es el mock de @/scenes/components/RimOutline.
    // Contar llamadas garantiza que una regresión que elimine <RimOutline> del JSX sea detectada.
    render(<PlanetWrapper initialLevel="explorador" />);

    expect(rimOutlineSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario rimoutline-ausente-no-explorador: 0 <RimOutline> con level=aprendiz', () => {
    render(<PlanetWrapper initialLevel="aprendiz" />);

    expect(rimOutlineSpy).not.toHaveBeenCalled();
  });

  it('Scenario mount-sin-errores explorador: monta sin errores en explorador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="explorador" />
        </div>,
      );
    }).not.toThrow();
  });

  it('Scenario mount-sin-errores aprendiz: monta sin errores en aprendiz', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="aprendiz" />
        </div>,
      );
    }).not.toThrow();
  });

  it('Scenario mount-sin-errores investigador: monta sin errores en investigador', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <Planet planet={earthData} level="investigador" />
        </div>,
      );
    }).not.toThrow();
  });
});
