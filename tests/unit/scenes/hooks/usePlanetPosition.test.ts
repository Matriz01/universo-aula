/**
 * Tests del hook usePlanetPosition.
 *
 * Verifica Fix C crítico: con simulationSpeed=0, la posición de la Tierra
 * NO cambia tras N frames (pausa congela TODO, incluida traslación).
 *
 * Estrategia: mock de useFrame para simular ticks manualmente.
 * El callback capturado se invoca con dt=0.016 y se comprueba
 * que la posición permanece constante cuando speed=0.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Hoisted: estado de speed y viewMode controlable por los tests
// ---------------------------------------------------------------------------

const { mockState } = vi.hoisted(() => {
  const state: { speed: number; viewMode: 'global' | 'local' } = { speed: 1.0, viewMode: 'global' };
  return { mockState: state };
});

// ---------------------------------------------------------------------------
// Captura del callback de useFrame para simularlo manualmente
// ---------------------------------------------------------------------------

type FrameCallback = (state: unknown, dt: number) => void;
let capturedFrameCallbacks: FrameCallback[] = [];

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: FrameCallback) => {
    capturedFrameCallbacks.push(cb);
  },
}));

// ---------------------------------------------------------------------------
// Mock del store — permite inyectar simulationSpeed desde mockState
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (
    selector: (s: { simulationSpeed: number; viewMode: 'global' | 'local' }) => unknown,
  ) => selector({ simulationSpeed: mockState.speed, viewMode: mockState.viewMode }),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';

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
// Helpers
// ---------------------------------------------------------------------------

function tickFrames(count: number, dt = 0.016) {
  for (let i = 0; i < count; i++) {
    capturedFrameCallbacks.forEach((cb) => cb({}, dt));
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedFrameCallbacks = [];
  mockState.speed = 1.0;
  mockState.viewMode = 'global';
  vi.clearAllMocks();
});

describe('usePlanetPosition — Fix C: pausa congela traslación', () => {
  it('con speed=0, la posición de la Tierra NO cambia tras 10 frames (nivel aprendiz)', () => {
    mockState.speed = 0;

    const { result } = renderHook(() => usePlanetPosition(earthData, 'aprendiz'));

    // Ejecutar UN frame para que la posición tome su valor inicial en órbita
    tickFrames(1, 0.016);
    const initialX = result.current.current.x;
    const initialY = result.current.current.y;
    const initialZ = result.current.current.z;

    // Simula 10 frames más con dt=0.016 y speed=0 — posición no debe avanzar
    tickFrames(10, 0.016);

    expect(result.current.current.x).toBeCloseTo(initialX, 6);
    expect(result.current.current.y).toBeCloseTo(initialY, 6);
    expect(result.current.current.z).toBeCloseTo(initialZ, 6);
  });

  it('con speed=0, la posición es idéntica antes y después de 50 frames (nivel explorador)', () => {
    mockState.speed = 0;

    const { result } = renderHook(() => usePlanetPosition(earthData, 'explorador'));

    // Ejecutar UN frame para posición inicial
    tickFrames(1, 0.016);
    const beforeX = result.current.current.x;
    const beforeZ = result.current.current.z;

    tickFrames(50, 0.016);

    expect(result.current.current.x).toBeCloseTo(beforeX, 6);
    expect(result.current.current.z).toBeCloseTo(beforeZ, 6);
  });

  it('con speed=0, nivel investigador: posición no cambia', () => {
    mockState.speed = 0;

    const { result } = renderHook(() => usePlanetPosition(earthData, 'investigador'));

    // Ejecutar UN frame para posición inicial
    tickFrames(1, 0.016);
    const initialX = result.current.current.x;
    const initialY = result.current.current.y;
    const initialZ = result.current.current.z;

    tickFrames(10, 0.016);

    expect(result.current.current.x).toBeCloseTo(initialX, 6);
    expect(result.current.current.y).toBeCloseTo(initialY, 6);
    expect(result.current.current.z).toBeCloseTo(initialZ, 6);
  });

  it('con speed=1, la posición SÍ cambia tras varios frames (sanity check)', () => {
    mockState.speed = 1.0;

    const { result } = renderHook(() => usePlanetPosition(earthData, 'aprendiz'));

    const initialX = result.current.current.x;
    const initialZ = result.current.current.z;

    // Simula 60 frames (≈1 segundo)
    tickFrames(60, 0.016);

    // La posición debe haber cambiado
    const movedX = Math.abs(result.current.current.x - initialX);
    const movedZ = Math.abs(result.current.current.z - initialZ);
    expect(movedX + movedZ).toBeGreaterThan(0);
  });
});

describe('usePlanetPosition — niveles pedagógicos', () => {
  it('monta sin errores en nivel explorador', () => {
    mockState.speed = 1.0;
    expect(() => {
      renderHook(() => usePlanetPosition(earthData, 'explorador'));
    }).not.toThrow();
  });

  it('monta sin errores en nivel aprendiz', () => {
    mockState.speed = 1.0;
    expect(() => {
      renderHook(() => usePlanetPosition(earthData, 'aprendiz'));
    }).not.toThrow();
  });

  it('monta sin errores en nivel investigador', () => {
    mockState.speed = 1.0;
    expect(() => {
      renderHook(() => usePlanetPosition(earthData, 'investigador'));
    }).not.toThrow();
  });
});
