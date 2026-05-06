/**
 * Tests del componente <SpeedControl>.
 *
 * Verifica:
 * - Renderizado del slider y botón pausa/reanudar
 * - El slider actualiza simulationSpeed en el store
 * - El botón pausa pone speed a 0
 * - El botón reanudar restaura el último valor no-cero
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Mock de react-i18next
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'simulation.speed_label': 'Velocidad',
        'simulation.pause': 'Pausar',
        'simulation.play': 'Reanudar',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { useAppStore } from '@/store/useAppStore';
import { SpeedControl } from '@/components/ui/SpeedControl';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState({ simulationSpeed: 1.0 });
  vi.clearAllMocks();
});

describe('<SpeedControl> — renderizado', () => {
  it('monta sin errores', () => {
    expect(() => render(<SpeedControl />)).not.toThrow();
  });

  it('renderiza el slider con type="range"', () => {
    render(<SpeedControl />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeTruthy();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('renderiza el botón de pausa/reanudar', () => {
    render(<SpeedControl />);
    const btn = screen.getByRole('button');
    expect(btn).toBeTruthy();
  });

  it('muestra "Pausar" cuando simulationSpeed > 0', () => {
    useAppStore.setState({ simulationSpeed: 1.0 });
    render(<SpeedControl />);
    expect(screen.getByRole('button').textContent).toBe('Pausar');
  });

  it('muestra "Reanudar" cuando simulationSpeed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    expect(screen.getByRole('button').textContent).toBe('Reanudar');
  });
});

describe('<SpeedControl> — interacción slider', () => {
  it('mover el slider actualiza simulationSpeed en el store', () => {
    render(<SpeedControl />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2.5' } });
    expect(useAppStore.getState().simulationSpeed).toBeCloseTo(2.5);
  });

  it('mover el slider a 0 pausa la simulación', () => {
    render(<SpeedControl />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0' } });
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('mover el slider a 5 es el valor máximo', () => {
    render(<SpeedControl />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    expect(useAppStore.getState().simulationSpeed).toBe(5);
  });
});

describe('<SpeedControl> — botón pausa/reanudar', () => {
  it('click en "Pausar" pone simulationSpeed a 0', () => {
    useAppStore.setState({ simulationSpeed: 1.0 });
    render(<SpeedControl />);
    fireEvent.click(screen.getByRole('button'));
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('click en "Reanudar" restaura un valor > 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    fireEvent.click(screen.getByRole('button'));
    expect(useAppStore.getState().simulationSpeed).toBeGreaterThan(0);
  });

  it('el botón tiene aria-pressed=true cuando está pausado', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('el botón tiene aria-pressed=false cuando está en marcha', () => {
    useAppStore.setState({ simulationSpeed: 1.0 });
    render(<SpeedControl />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});
