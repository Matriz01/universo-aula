/**
 * Tests de <LoadingScreen>
 *
 * - Renderiza la barra de progreso con useProgress mockeado
 * - Muestra el mensaje de carga
 * - A progreso 100 el componente indica completado
 * - Después de 5s sin completar muestra un tip educativo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock @react-three/drei useProgress
// ---------------------------------------------------------------------------

let mockProgress = 0;
let mockActive = true;

vi.mock('@react-three/drei', () => ({
  useProgress: vi.fn(() => ({
    progress: mockProgress,
    active: mockActive,
    item: '',
    loaded: 0,
    total: 0,
  })),
}));

// ---------------------------------------------------------------------------
// Mock react-i18next
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { LoadingScreen } from '@/components/ui/LoadingScreen';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockProgress = 0;
  mockActive = true;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<LoadingScreen>', () => {
  it('monta sin errores con progreso 0', () => {
    mockProgress = 0;
    expect(() => render(<LoadingScreen />)).not.toThrow();
  });

  it('muestra el mensaje de carga', () => {
    mockProgress = 0;
    render(<LoadingScreen />);
    // El mensaje puede ser la clave i18n o el fallback
    const el = screen.getByTestId('loading-message');
    expect(el).toBeInTheDocument();
  });

  it('renderiza la barra de progreso', () => {
    mockProgress = 50;
    render(<LoadingScreen />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('la barra refleja el progreso 0%', () => {
    mockProgress = 0;
    render(<LoadingScreen />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('la barra refleja el progreso 50%', () => {
    mockProgress = 50;
    render(<LoadingScreen />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('la barra refleja el progreso 100%', () => {
    mockProgress = 100;
    mockActive = false;
    render(<LoadingScreen />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('después de 5s sin completar muestra un tip educativo', () => {
    mockProgress = 30;
    render(<LoadingScreen />);

    // Antes de 5s no debe haber tip
    expect(screen.queryByTestId('loading-tip')).not.toBeInTheDocument();

    // Avanzar el tiempo 5100ms
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // Ahora debe haber un tip
    expect(screen.getByTestId('loading-tip')).toBeInTheDocument();
  });

  it('tiene aria-label o aria-valuenow en la barra de progreso', () => {
    mockProgress = 75;
    render(<LoadingScreen />);
    const progressBar = screen.getByRole('progressbar');
    expect(
      progressBar.hasAttribute('aria-valuenow') || progressBar.hasAttribute('aria-label'),
    ).toBe(true);
  });
});
