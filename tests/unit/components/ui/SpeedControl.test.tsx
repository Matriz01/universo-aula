/**
 * Tests del componente <SpeedControl> — presets táctiles.
 *
 * Verifica:
 * - Renderizado de los 6 botones de preset (Pausa + 5 velocidades)
 * - Click en cada preset actualiza simulationSpeed en el store
 * - aria-pressed correcto para el preset activo
 * - Pausa y Reanudar funcionan correctamente
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
        'simulation.preset.pause': 'Pausa',
        'simulation.preset.slow': 'Muy lento',
        'simulation.preset.half': 'Lento',
        'simulation.preset.normal': 'Normal',
        'simulation.preset.fast': 'Rápido',
        'simulation.preset.turbo': 'Turbo',
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
// Helpers
// ---------------------------------------------------------------------------

/** Devuelve todos los botones del componente */
function getAllButtons() {
  return screen.getAllByRole('button');
}

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

  it('renderiza exactamente 6 botones (Pausa + 5 presets)', () => {
    render(<SpeedControl />);
    const buttons = getAllButtons();
    expect(buttons).toHaveLength(6);
  });

  it('NO renderiza input type="range" (slider eliminado)', () => {
    render(<SpeedControl />);
    const sliders = screen.queryAllByRole('slider');
    expect(sliders).toHaveLength(0);
  });

  it('muestra el botón de pausa con texto "Pausa" cuando speed > 0', () => {
    useAppStore.setState({ simulationSpeed: 1.0 });
    render(<SpeedControl />);
    const pauseBtn = screen.getByText(/Pausa/);
    expect(pauseBtn).toBeTruthy();
  });

  it('muestra "▶ Pausa" (reanudar) cuando simulationSpeed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    const resumeBtn = screen.getByText(/▶/);
    expect(resumeBtn).toBeTruthy();
  });
});

describe('<SpeedControl> — presets de velocidad', () => {
  it('click en 0.1× pone simulationSpeed a 0.1', () => {
    render(<SpeedControl />);
    fireEvent.click(screen.getByText('0.1×'));
    expect(useAppStore.getState().simulationSpeed).toBeCloseTo(0.1);
  });

  it('click en 0.5× pone simulationSpeed a 0.5', () => {
    render(<SpeedControl />);
    fireEvent.click(screen.getByText('0.5×'));
    expect(useAppStore.getState().simulationSpeed).toBeCloseTo(0.5);
  });

  it('click en 1× pone simulationSpeed a 1', () => {
    render(<SpeedControl />);
    fireEvent.click(screen.getByText('1×'));
    expect(useAppStore.getState().simulationSpeed).toBe(1);
  });

  it('click en 2× pone simulationSpeed a 2', () => {
    render(<SpeedControl />);
    fireEvent.click(screen.getByText('2×'));
    expect(useAppStore.getState().simulationSpeed).toBe(2);
  });

  it('click en 5× pone simulationSpeed a 5', () => {
    render(<SpeedControl />);
    fireEvent.click(screen.getByText('5×'));
    expect(useAppStore.getState().simulationSpeed).toBe(5);
  });
});

describe('<SpeedControl> — pausa y reanudar', () => {
  it('el botón pausa pone simulationSpeed a 0', () => {
    useAppStore.setState({ simulationSpeed: 1.0 });
    render(<SpeedControl />);
    // El botón pausa es el que tiene texto "⏸ Pausa"
    const pauseBtn = screen.getByText(/⏸/);
    fireEvent.click(pauseBtn);
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('el botón reanudar pone simulationSpeed a 1', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    const resumeBtn = screen.getByText(/▶/);
    fireEvent.click(resumeBtn);
    expect(useAppStore.getState().simulationSpeed).toBe(1);
  });
});

describe('<SpeedControl> — aria-pressed', () => {
  it('el preset 1× tiene aria-pressed=true cuando speed === 1', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    render(<SpeedControl />);
    const btn = screen.getByText('1×');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('el preset 0.1× tiene aria-pressed=false cuando speed === 1', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    render(<SpeedControl />);
    const btn = screen.getByText('0.1×');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('el botón pausa tiene aria-pressed=true cuando speed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    // Cuando pausado, el botón es el de reanudar con aria-pressed=true
    const resumeBtn = screen.getByText(/▶/);
    expect(resumeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('el botón pausa tiene aria-pressed=false cuando speed > 0', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    render(<SpeedControl />);
    const pauseBtn = screen.getByText(/⏸/);
    expect(pauseBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('ningún preset tiene aria-pressed=true cuando speed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    render(<SpeedControl />);
    // Los 5 presets deben tener aria-pressed=false
    ['0.1×', '0.5×', '1×', '2×', '5×'].forEach((label) => {
      const btn = screen.getByText(label);
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
