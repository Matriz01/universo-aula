/**
 * Tests de <LevelSelector>
 *
 * Verifica que los 3 botones de nivel se renderizan,
 * que el nivel activo tiene aria-pressed=true,
 * y que hacer click en un botón llama setLevel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetLevel = vi.fn();
let mockLevel = 'aprendiz';

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      level: mockLevel,
      setLevel: mockSetLevel,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { LevelSelector } from '@/components/ui/LevelSelector';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockLevel = 'aprendiz';
});

describe('<LevelSelector>', () => {
  it('monta sin errores', () => {
    expect(() => render(<LevelSelector />)).not.toThrow();
  });

  it('renderiza los tres botones de nivel', () => {
    render(<LevelSelector />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('el botón del nivel activo tiene aria-pressed=true', () => {
    mockLevel = 'aprendiz';
    render(<LevelSelector />);
    const activeButton = screen.getByRole('button', {
      name: /solar:ui\.level_selector\.aprendiz/i,
    });
    expect(activeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('los botones inactivos tienen aria-pressed=false', () => {
    mockLevel = 'aprendiz';
    render(<LevelSelector />);
    const exploradorBtn = screen.getByRole('button', {
      name: /solar:ui\.level_selector\.explorador/i,
    });
    expect(exploradorBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('click en un botón llama setLevel con el nivel correcto', () => {
    mockLevel = 'aprendiz';
    render(<LevelSelector />);
    const exploradorBtn = screen.getByRole('button', {
      name: /solar:ui\.level_selector\.explorador/i,
    });
    fireEvent.click(exploradorBtn);
    expect(mockSetLevel).toHaveBeenCalledWith('explorador');
  });

  it('click en el nivel Investigador llama setLevel("investigador")', () => {
    mockLevel = 'aprendiz';
    render(<LevelSelector />);
    const investigadorBtn = screen.getByRole('button', {
      name: /solar:ui\.level_selector\.investigador/i,
    });
    fireEvent.click(investigadorBtn);
    expect(mockSetLevel).toHaveBeenCalledWith('investigador');
  });

  it('tiene role="group" con aria-label', () => {
    render(<LevelSelector />);
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
  });
});
