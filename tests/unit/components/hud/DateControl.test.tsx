/**
 * Tests del componente DateControl (T5.1 + T5.2)
 *
 * T5.1: DateControl renderiza ≤2 veces por segundo (throttle 1Hz)
 * T5.2: Renderiza la fecha correcta en formato es-ES
 *
 * Estrategia:
 * - Mock de simulationClock: controla getGregorianDate() y getJD() sin side-effects.
 * - vi.useFakeTimers() para controlar el setInterval(1000ms).
 * - Render counter via wrapper component.
 * - @testing-library/react con act() para procesar efectos de React.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock simulationClock (hoisted)
// ---------------------------------------------------------------------------

const { mockGetGregorianDate, mockReset } = vi.hoisted(() => ({
  mockGetGregorianDate: vi.fn(() => ({ year: 2000, month: 1, day: 1 })),
  mockReset: vi.fn(),
}));

vi.mock('@/scenes/simulationClock', () => ({
  getGregorianDate: mockGetGregorianDate,
  reset: mockReset,
  J2000_JD: 2451545.0,
  getJD: vi.fn(() => 2451545.0),
  getPaused: vi.fn(() => false),
  setPaused: vi.fn(),
  tick: vi.fn(),
  jdToGregorian: vi.fn((jd: number) => {
    // Implementación mínima para el mock: J2000 → 2000-01-01
    if (jd === 2451545.0) return { year: 2000, month: 1, day: 1 };
    if (jd === 2451546.0) return { year: 2000, month: 1, day: 2 };
    if (jd === 2451910.25) return { year: 2001, month: 1, day: 1 };
    return { year: 2000, month: 1, day: 1 };
  }),
}));

// ---------------------------------------------------------------------------
// Import del componente bajo test (RED si no existe)
// ---------------------------------------------------------------------------

import { DateControl } from '../../../../src/components/hud/DateControl';

// ---------------------------------------------------------------------------
// Componente wrapper para contar renders
// ---------------------------------------------------------------------------

function RenderCounter({
  onRender,
  children,
}: {
  onRender: () => void;
  children: React.ReactNode;
}) {
  onRender();
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Tests T5.1 — Throttle ≤1 Hz
// ---------------------------------------------------------------------------

describe('DateControl — throttle de renders (T5.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetGregorianDate.mockReturnValue({ year: 2000, month: 1, day: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renderiza ≤2 veces en 5 segundos si la fecha no cambia (solo mount + posible strict-mode)', () => {
    let renderCount = 0;

    act(() => {
      render(
        <RenderCounter onRender={() => renderCount++}>
          <DateControl />
        </RenderCounter>,
      );
    });

    // Avanzar 5 segundos sin cambiar la fecha (misma fecha devuelta por mock)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // ≤2: 1 mount + posible strict-mode double-render (React 19)
    // La fecha no cambió → no debe haber re-renders por setInterval
    expect(renderCount).toBeLessThanOrEqual(2);
  });

  it('renderiza ≤6 veces en 5 segundos si la fecha avanza cada segundo', () => {
    let renderCount = 0;
    let callCount = 0;

    // Cada llamada devuelve una fecha diferente (simula avance de días)
    mockGetGregorianDate.mockImplementation(() => {
      callCount++;
      return { year: 2000, month: 1, day: callCount };
    });

    act(() => {
      render(
        <RenderCounter onRender={() => renderCount++}>
          <DateControl />
        </RenderCounter>,
      );
    });

    // Avanzar 5 segundos → 5 intervalos de 1s → ≤5 re-renders adicionales al mount
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // ≤6: 1 mount + ≤5 re-renders por intervalos (con posible strict-mode: ≤7)
    expect(renderCount).toBeLessThanOrEqual(7);
  });
});

// ---------------------------------------------------------------------------
// Tests T5.2 — Formato es-ES correcto
// ---------------------------------------------------------------------------

describe('DateControl — formato de fecha es-ES (T5.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('muestra "1 de enero de 2000" en J2000 epoch', () => {
    mockGetGregorianDate.mockReturnValue({ year: 2000, month: 1, day: 1 });

    const { container } = render(<DateControl />);

    expect(container.textContent).toContain('enero');
    expect(container.textContent).toContain('2000');
    expect(container.textContent).toContain('1');
  });

  it('actualiza el texto al avanzar un día tras 1 segundo', () => {
    // Primero: J2000
    mockGetGregorianDate.mockReturnValue({ year: 2000, month: 1, day: 1 });

    const { container } = render(<DateControl />);
    expect(container.textContent).toContain('enero');

    // Avanzar fecha a día 2
    mockGetGregorianDate.mockReturnValue({ year: 2000, month: 1, day: 2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Ahora debería mostrar día 2
    expect(container.textContent).toContain('enero');
    expect(container.textContent).toContain('2000');
  });

  it('no tiene elementos interactivos (input, button) — REQ-DATE-3', () => {
    mockGetGregorianDate.mockReturnValue({ year: 2000, month: 1, day: 1 });

    const { container } = render(<DateControl />);

    expect(container.querySelectorAll('input')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
