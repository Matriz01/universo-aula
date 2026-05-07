/**
 * Tests de SimulationTicker — verifica que el componente llama a
 * simulationClock.tick() exactamente una vez por frame (T4.1 TDD).
 *
 * Estrategia:
 * - Mock de @react-three/fiber → useFrame invoca el callback inmediatamente
 *   con un delta conocido.
 * - Mock de simulationClock con vi.hoisted + vi.mock → intercepta tick()
 * - Mock de useAppStore.getState() → devuelve level y simulationSpeed conocidos.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Constantes de test
// ---------------------------------------------------------------------------

const FAKE_DELTA = 0.016; // ~60fps
const FAKE_LEVEL = 'aprendiz' as const;
const FAKE_SPEED = 2.0;
// speedupForLevel('aprendiz') === 1, por tanto tick esperará (0.016, 2.0)
const EXPECTED_SPEEDUP = 1;

// ---------------------------------------------------------------------------
// Mocks con vi.hoisted (seguro para referencias en vi.mock factories)
// ---------------------------------------------------------------------------

const { mockTick, mockSpeedupForLevel } = vi.hoisted(() => ({
  mockTick: vi.fn(),
  mockSpeedupForLevel: vi.fn((_level: string) => 1),
}));

vi.mock('../../../src/scenes/simulationClock', () => ({
  tick: mockTick,
  speedupForLevel: mockSpeedupForLevel,
  J2000_JD: 2451545.0,
  SPEEDUP_EXPLORADOR: 3,
  SPEEDUP_APRENDIZ: 1,
  SPEEDUP_INVESTIGADOR: 0.3,
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: (_state: object, delta: number) => void) => {
    cb({}, FAKE_DELTA);
  },
}));

const { mockGetState } = vi.hoisted(() => ({
  mockGetState: vi.fn(() => ({
    level: FAKE_LEVEL,
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

describe('SimulationTicker (T4.1)', () => {
  beforeEach(() => {
    mockTick.mockClear();
    mockSpeedupForLevel.mockClear().mockImplementation(() => EXPECTED_SPEEDUP);
    mockGetState.mockClear().mockReturnValue({ level: FAKE_LEVEL, simulationSpeed: FAKE_SPEED });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('llama a clock.tick exactamente una vez al montar (un frame simulado)', () => {
    render(<SimulationTicker />);
    expect(mockTick).toHaveBeenCalledTimes(1);
  });

  it('llama a clock.tick con (delta, simulationSpeed * speedupForLevel(level))', () => {
    render(<SimulationTicker />);

    const expectedSecondArg = FAKE_SPEED * EXPECTED_SPEEDUP;
    expect(mockTick).toHaveBeenCalledWith(FAKE_DELTA, expectedSecondArg);
  });

  it('pasa el level correcto a speedupForLevel', () => {
    render(<SimulationTicker />);
    expect(mockSpeedupForLevel).toHaveBeenCalledWith(FAKE_LEVEL);
  });

  it('retorna null (no renderiza nada en el DOM)', () => {
    const { container } = render(<SimulationTicker />);
    expect(container.firstChild).toBeNull();
  });
});
