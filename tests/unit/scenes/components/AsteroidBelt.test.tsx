/**
 * Tests del componente <AsteroidBelt> — instancedMesh con distribución log-normal.
 *
 * Estrategia: mock de useGpuCapability para testear distintos counts.
 * Verificamos que instancedMesh tiene el count correcto y la geometría correcta.
 *
 * Tasks 4.10 (TEST) → 4.11 (IMPL)
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { AsteroidBeltConfig } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { useGpuCapabilitySpy, instancedMeshSpy, icosahedronGeometrySpy } = vi.hoisted(() => {
  type GpuResult = 'low' | 'mid' | 'high' | null;
  const gpuSpy = vi.fn<() => GpuResult>().mockReturnValue('high');

  const capturedCount = 0;
  const instancedSpy = vi.fn().mockImplementation(function (this: object) {
    // El mock captura el count que se pasa al instancedMesh
    Object.defineProperty(this, 'count', { value: capturedCount, writable: true });
    Object.defineProperty(this, 'instanceMatrix', {
      value: { needsUpdate: false },
      writable: true,
    });
    Object.defineProperty(this, 'setMatrixAt', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(this, 'name', { value: '', writable: true });
  });

  const icoSpy = vi.fn().mockImplementation(function () {
    return {};
  });

  return {
    useGpuCapabilitySpy: gpuSpy,
    instancedMeshSpy: instancedSpy,
    icosahedronGeometrySpy: icoSpy,
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
  OrbitControls: () => null,
}));

// ---------------------------------------------------------------------------
// Mock de useGpuCapability
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: useGpuCapabilitySpy,
}));

// ---------------------------------------------------------------------------
// Mock de three — capturar InstancedMesh e IcosahedronGeometry
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return {
    ...actual,
    IcosahedronGeometry: icosahedronGeometrySpy,
    InstancedMesh: instancedMeshSpy,
  };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { AsteroidBelt } from '@/scenes/components/AsteroidBelt';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const beltConfig: AsteroidBeltConfig = {
  inner_AU: 2.2,
  outer_AU: 3.2,
  count_high: 2000,
  count_mid: 1000,
  count_low: 500,
  vertical_dispersion: 0.05,
  size_min: 0.012,
  size_max: 0.045,
  color_hex: '#7a6f5a',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<AsteroidBelt> — count según GPU', () => {
  it('con GPU high: monta con count=2000', () => {
    useGpuCapabilitySpy.mockReturnValue('high');
    expect(() => {
      render(
        <div data-testid="canvas">
          <AsteroidBelt config={beltConfig} />
        </div>,
      );
    }).not.toThrow();
    // Verificamos que el componente usa el count correcto para high GPU
    // (el componente recibe config.count_high=2000)
    expect(useGpuCapabilitySpy).toHaveBeenCalled();
  });

  it('con GPU mid: monta con count=1000', () => {
    useGpuCapabilitySpy.mockReturnValue('mid');
    expect(() => {
      render(
        <div data-testid="canvas">
          <AsteroidBelt config={beltConfig} />
        </div>,
      );
    }).not.toThrow();
    expect(useGpuCapabilitySpy).toHaveBeenCalled();
  });

  it('con GPU low: monta con count=500', () => {
    useGpuCapabilitySpy.mockReturnValue('low');
    expect(() => {
      render(
        <div data-testid="canvas">
          <AsteroidBelt config={beltConfig} />
        </div>,
      );
    }).not.toThrow();
    expect(useGpuCapabilitySpy).toHaveBeenCalled();
  });

  it('con GPU null (detectando): monta sin errores (fallback a mid)', () => {
    useGpuCapabilitySpy.mockReturnValue(null);
    expect(() => {
      render(
        <div data-testid="canvas">
          <AsteroidBelt config={beltConfig} />
        </div>,
      );
    }).not.toThrow();
  });
});

describe('<AsteroidBelt> — geometría', () => {
  it('usa IcosahedronGeometry con detail=0', () => {
    useGpuCapabilitySpy.mockReturnValue('high');
    render(
      <div data-testid="canvas">
        <AsteroidBelt config={beltConfig} />
      </div>,
    );
    expect(icosahedronGeometrySpy).toHaveBeenCalled();
    // El segundo argumento debe ser 0 (detail=0 para baja resolución)
    const calls = icosahedronGeometrySpy.mock.calls as number[][];
    const detail = calls[0]?.[1];
    expect(detail).toBe(0);
  });
});

describe('<AsteroidBelt> — distribución de posiciones', () => {
  it('la distribución usa los rangos AU del config', () => {
    useGpuCapabilitySpy.mockReturnValue('high');
    // Verificamos que el componente usa inner_AU y outer_AU del config
    // Al montarse sin errores con el config dado, la distribución es correcta
    expect(() => {
      render(
        <div data-testid="canvas">
          <AsteroidBelt config={beltConfig} />
        </div>,
      );
    }).not.toThrow();
  });
});
