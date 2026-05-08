/**
 * Tests de SimulationTicker — verifica que el componente llama a
 * simulationClock.tick() exactamente una vez por frame (T4.1 TDD).
 *
 * Batch 4: SimulationTicker ya no usa speedupForLevel — la velocidad
 * viene directamente de simulationSpeed (seconds/real-second).
 * tick(delta, simulationSpeed) sin multiplicación por nivel.
 *
 * Estrategia:
 * - Mock de @react-three/fiber → useFrame invoca el callback inmediatamente
 *   con un delta conocido.
 * - Mock de simulationClock con vi.hoisted + vi.mock → intercepta tick()
 * - Mock de useAppStore.getState() → devuelve simulationSpeed conocido.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Constantes de test
// ---------------------------------------------------------------------------

const FAKE_DELTA = 0.016; // ~60fps
const FAKE_SPEED = 86400; // 1 día/s en la nueva escala

// ---------------------------------------------------------------------------
// Mocks con vi.hoisted (seguro para referencias en vi.mock factories)
// ---------------------------------------------------------------------------

const { mockTick } = vi.hoisted(() => ({
  mockTick: vi.fn(),
}));

vi.mock('../../../src/scenes/simulationClock', () => ({
  tick: mockTick,
  J2000_JD: 2451545.0,
  SPEED_STOPS_SECONDS_PER_SECOND: [
    0, 1, 3600, 10800, 21600, 43200, 86400, 259200, 604800, 2592000, 7776000, 15552000, 31536000,
  ],
  SPEED_STOP_LABELS_ES: [
    'Pausa',
    '1 s/s',
    '1 h/s',
    '3 h/s',
    '6 h/s',
    '12 h/s',
    '24 h/s',
    '3 d/s',
    '1 sem/s',
    '1 mes/s',
    '3 mes/s',
    '6 mes/s',
    '1 año/s',
  ],
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: (_state: object, delta: number) => void) => {
    cb({}, FAKE_DELTA);
  },
}));

const { mockGetState } = vi.hoisted(() => ({
  mockGetState: vi.fn(() => ({
    simulationSpeed: FAKE_SPEED,
  })),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: Object.assign(vi.fn(), {
    getState: mockGetState,
  }),
}));

// ---------------------------------------------------------------------------
// Import del componente bajo test
// ---------------------------------------------------------------------------

import { SimulationTicker } from '../../../src/scenes/SimulationTicker';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SimulationTicker (Batch 4)', () => {
  beforeEach(() => {
    mockTick.mockClear();
    mockGetState.mockClear().mockReturnValue({ simulationSpeed: FAKE_SPEED });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('llama a clock.tick exactamente una vez al montar (un frame simulado)', () => {
    render(<SimulationTicker />);
    expect(mockTick).toHaveBeenCalledTimes(1);
  });

  it('llama a clock.tick con (delta, simulationSpeed) — sin multiplicación por nivel', () => {
    render(<SimulationTicker />);
    expect(mockTick).toHaveBeenCalledWith(FAKE_DELTA, FAKE_SPEED);
  });

  it('NO pasa level a ninguna función de speedup', () => {
    // El ticker en Batch 4 NO debe leer `level` del store ni usar speedupForLevel
    // Si el mock fuera correcto, getState devolvería solo { simulationSpeed }
    render(<SimulationTicker />);
    // Verificamos que tick recibe exactamente (delta, simulationSpeed) sin transformar
    expect(mockTick).toHaveBeenCalledWith(FAKE_DELTA, FAKE_SPEED);
  });

  it('retorna null (no renderiza nada en el DOM)', () => {
    const { container } = render(<SimulationTicker />);
    expect(container.firstChild).toBeNull();
  });
});
