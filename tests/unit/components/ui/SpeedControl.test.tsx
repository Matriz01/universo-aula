/**
 * Tests del componente <SpeedControl> — nueva implementación Batch 4.
 *
 * Diseño: top-center HUD con flechas ◀/▶, botón pause/play central y leyenda.
 * Usa store actions: incrementSpeedStop, decrementSpeedStop, togglePause.
 *
 * Verifica:
 * - Renderizado: 3 botones (◀ play/pause ▶) + leyenda
 * - Leyenda muestra la etiqueta correcta para el stop actual
 * - Botón central muestra icono pausa cuando speed != 0, play cuando speed === 0
 * - Flechas invocan las acciones correctas del store
 * - Flecha izquierda deshabilitada en stop 0 (speed === -31536000)
 * - Flecha derecha deshabilitada en stop 24 (speed === 31536000, último)
 * - Velocidades negativas muestran etiqueta correcta
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Import tras mocks
// ---------------------------------------------------------------------------

import { useAppStore } from '@/store/useAppStore';
import { SpeedControl } from '@/components/ui/SpeedControl';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSpeedControl() {
  return render(<SpeedControl />);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Resetear el store a estado conocido: stop 1 (1 s/s)
  useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<SpeedControl> — renderizado básico', () => {
  it('monta sin errores', () => {
    expect(() => renderSpeedControl()).not.toThrow();
  });

  it('renderiza exactamente 3 botones (◀, pause/play, ▶)', () => {
    renderSpeedControl();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('NO renderiza input type="range"', () => {
    renderSpeedControl();
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});

describe('<SpeedControl> — leyenda', () => {
  it('muestra "1 s/s" cuando simulationSpeed === 1', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    renderSpeedControl();
    expect(screen.getByText('1 s/s')).toBeTruthy();
  });

  it('muestra "Pausa" cuando simulationSpeed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    renderSpeedControl();
    expect(screen.getByText('Pausa')).toBeTruthy();
  });

  it('muestra "1 h/s" cuando simulationSpeed === 3600', () => {
    useAppStore.setState({ simulationSpeed: 3600 });
    renderSpeedControl();
    expect(screen.getByText('1 h/s')).toBeTruthy();
  });

  it('muestra "1 año/s" cuando simulationSpeed === 31536000', () => {
    useAppStore.setState({ simulationSpeed: 31536000 });
    renderSpeedControl();
    expect(screen.getByText('1 año/s')).toBeTruthy();
  });

  it('muestra "-1 año/s" cuando simulationSpeed === -31536000', () => {
    useAppStore.setState({ simulationSpeed: -31536000 });
    renderSpeedControl();
    expect(screen.getByText('-1 año/s')).toBeTruthy();
  });

  it('muestra "-1 h/s" cuando simulationSpeed === -3600', () => {
    useAppStore.setState({ simulationSpeed: -3600 });
    renderSpeedControl();
    expect(screen.getByText('-1 h/s')).toBeTruthy();
  });
});

describe('<SpeedControl> — botón pause/play', () => {
  it('muestra aria-label de pausar cuando speed > 0', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    renderSpeedControl();
    const btn = screen.getByRole('button', { name: /pausar/i });
    expect(btn).toBeTruthy();
  });

  it('muestra aria-label de pausar cuando speed < 0 (velocidad negativa activa)', () => {
    useAppStore.setState({ simulationSpeed: -3600 });
    renderSpeedControl();
    const btn = screen.getByRole('button', { name: /pausar/i });
    expect(btn).toBeTruthy();
  });

  it('muestra aria-label de reanudar cuando speed === 0', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    renderSpeedControl();
    const btn = screen.getByRole('button', { name: /reanudar/i });
    expect(btn).toBeTruthy();
  });

  it('clic en botón pausar llama a togglePause del store', () => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    const spyToggle = vi.spyOn(useAppStore.getState(), 'togglePause');
    renderSpeedControl();
    const btn = screen.getByRole('button', { name: /pausar/i });
    fireEvent.click(btn);
    // Verificar que la velocidad cambió a 0 (togglePause funcionó)
    expect(useAppStore.getState().simulationSpeed).toBe(0);
    spyToggle.mockRestore();
  });

  it('clic en botón reanudar restaura lastNonZeroSpeed', () => {
    useAppStore.setState({ simulationSpeed: 0, lastNonZeroSpeed: 3600 });
    renderSpeedControl();
    const btn = screen.getByRole('button', { name: /reanudar/i });
    fireEvent.click(btn);
    // togglePause restaura lastNonZeroSpeed
    expect(useAppStore.getState().simulationSpeed).toBe(3600);
  });
});

describe('<SpeedControl> — flechas', () => {
  it('clic en flecha derecha sube al stop siguiente', () => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    renderSpeedControl();
    const rightBtn = screen.getByRole('button', { name: /aumentar velocidad/i });
    fireEvent.click(rightBtn);
    expect(useAppStore.getState().simulationSpeed).toBe(3600);
  });

  it('clic en flecha izquierda baja al stop anterior', () => {
    useAppStore.setState({ simulationSpeed: 3600, lastNonZeroSpeed: 3600 });
    renderSpeedControl();
    const leftBtn = screen.getByRole('button', { name: /reducir velocidad/i });
    fireEvent.click(leftBtn);
    expect(useAppStore.getState().simulationSpeed).toBe(1);
  });

  it('flecha izquierda deshabilitada en el primer stop (speed === -31536000)', () => {
    useAppStore.setState({ simulationSpeed: -31536000 });
    renderSpeedControl();
    const leftBtn = screen.getByRole('button', { name: /reducir velocidad/i });
    expect(leftBtn).toBeDisabled();
  });

  it('flecha derecha deshabilitada en el último stop (speed === 31536000)', () => {
    useAppStore.setState({ simulationSpeed: 31536000 });
    renderSpeedControl();
    const rightBtn = screen.getByRole('button', { name: /aumentar velocidad/i });
    expect(rightBtn).toBeDisabled();
  });

  it('flecha izquierda habilitada cuando speed > -31536000', () => {
    useAppStore.setState({ simulationSpeed: 3600 });
    renderSpeedControl();
    const leftBtn = screen.getByRole('button', { name: /reducir velocidad/i });
    expect(leftBtn).not.toBeDisabled();
  });

  it('flecha derecha habilitada cuando speed < 31536000', () => {
    useAppStore.setState({ simulationSpeed: 1 });
    renderSpeedControl();
    const rightBtn = screen.getByRole('button', { name: /aumentar velocidad/i });
    expect(rightBtn).not.toBeDisabled();
  });

  it('flecha izquierda habilitada en speed === 0 (pausa no es el primer stop)', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    renderSpeedControl();
    const leftBtn = screen.getByRole('button', { name: /reducir velocidad/i });
    expect(leftBtn).not.toBeDisabled();
  });

  it('flecha derecha habilitada en speed === 0 (pausa no es el último stop)', () => {
    useAppStore.setState({ simulationSpeed: 0 });
    renderSpeedControl();
    const rightBtn = screen.getByRole('button', { name: /aumentar velocidad/i });
    expect(rightBtn).not.toBeDisabled();
  });
});
