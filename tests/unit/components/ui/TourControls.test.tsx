/**
 * Tests de <TourControls>
 *
 * Estrategia: render con mocks del store y react-i18next.
 * Verificamos botones, handlers y visibilidad condicionada.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetTourActive = vi.fn();
const mockDispatch = vi.fn();
let mockTourActive = false;
let mockPrefersReducedMotion = false;
let mockTourKind = 'idle';

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      tourActive: mockTourActive,
      setTourActive: mockSetTourActive,
      prefersReducedMotion: mockPrefersReducedMotion,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/scenes/hooks/useTour', () => ({
  useTour: vi.fn(() => ({
    state: { kind: mockTourKind },
    dispatch: mockDispatch,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { TourControls } from '@/components/ui/TourControls';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockTourActive = false;
  mockPrefersReducedMotion = false;
  mockTourKind = 'idle';
});

describe('<TourControls>', () => {
  it('monta sin errores', () => {
    expect(() => render(<TourControls />)).not.toThrow();
  });

  it('muestra botón de iniciar tour cuando el tour está inactivo', () => {
    mockTourActive = false;
    render(<TourControls />);
    const button = screen.getByRole('button', { name: /solar:ui\.tour\.start/i });
    expect(button).toBeInTheDocument();
  });

  it('click en iniciar tour llama dispatch({type:"start"})', () => {
    mockTourActive = false;
    render(<TourControls />);
    const button = screen.getByRole('button', { name: /solar:ui\.tour\.start/i });
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'start' });
  });

  it('muestra botón de detener cuando el tour está activo', () => {
    mockTourActive = true;
    mockTourKind = 'narration';
    render(<TourControls />);
    const button = screen.getByRole('button', { name: /solar:ui\.tour\.stop/i });
    expect(button).toBeInTheDocument();
  });

  it('click en detener tour llama dispatch({type:"user_interrupt"})', () => {
    mockTourActive = true;
    mockTourKind = 'focus_planet';
    render(<TourControls />);
    const button = screen.getByRole('button', { name: /solar:ui\.tour\.stop/i });
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'user_interrupt' });
  });

  it('botón "Siguiente" visible sólo con reducedMotion=true y tour activo', () => {
    mockTourActive = true;
    mockPrefersReducedMotion = true;
    mockTourKind = 'narration';
    render(<TourControls />);
    const button = screen.getByRole('button', { name: /solar:ui\.tour\.next/i });
    expect(button).toBeInTheDocument();
  });

  it('botón "Siguiente" NO visible cuando reducedMotion=false', () => {
    mockTourActive = true;
    mockPrefersReducedMotion = false;
    mockTourKind = 'narration';
    render(<TourControls />);
    const button = screen.queryByRole('button', { name: /solar:ui\.tour\.next/i });
    expect(button).not.toBeInTheDocument();
  });
});
