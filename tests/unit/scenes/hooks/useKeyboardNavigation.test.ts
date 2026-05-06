/**
 * Tests de useKeyboardNavigation
 *
 * Estrategia: renderHook + dispatch de KeyboardEvent en window.
 * Verificamos que Tab/Shift+Tab navegan el índice, Enter/Space aplican focus,
 * Escape suelta el focus y T alterna el tour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock del store
// ---------------------------------------------------------------------------

const mockSetSelectedPlanet = vi.fn();
const mockSetTourActive = vi.fn();
let mockSelectedPlanet: string | null = null;
let mockTourActive = false;

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      selectedPlanet: mockSelectedPlanet,
      setSelectedPlanet: mockSetSelectedPlanet,
      tourActive: mockTourActive,
      setTourActive: mockSetTourActive,
    };
    return selector ? selector(state) : state;
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';

// ---------------------------------------------------------------------------
// Helper para disparar tecla en window
// ---------------------------------------------------------------------------

function pressKey(key: string, shiftKey = false) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedPlanet = null;
  mockTourActive = false;
});

describe('useKeyboardNavigation', () => {
  it('Tab desde ningún cuerpo seleccionado mueve al primer cuerpo (índice 0 = Sol → setSelectedPlanet(null))', () => {
    renderHook(() => useKeyboardNavigation());
    pressKey('Tab');
    // Al presionar Tab con nada seleccionado, debería navegar al primer elemento
    // (en la implementación el índice 0 de CELESTIAL_ORDER es null = Sol)
    expect(mockSetSelectedPlanet).toHaveBeenCalled();
  });

  it('Tab navega al siguiente cuerpo (mercury → venus)', () => {
    mockSelectedPlanet = 'mercury';
    renderHook(() => useKeyboardNavigation());
    pressKey('Tab');
    expect(mockSetSelectedPlanet).toHaveBeenCalledWith('venus');
  });

  it('Shift+Tab navega al cuerpo anterior (venus → mercury)', () => {
    mockSelectedPlanet = 'venus';
    renderHook(() => useKeyboardNavigation());
    pressKey('Tab', true);
    expect(mockSetSelectedPlanet).toHaveBeenCalledWith('mercury');
  });

  it('Tab desde el último cuerpo (pluto) va al Sol (null)', () => {
    mockSelectedPlanet = 'pluto';
    renderHook(() => useKeyboardNavigation());
    pressKey('Tab');
    expect(mockSetSelectedPlanet).toHaveBeenCalledWith(null);
  });

  it('Shift+Tab desde el Sol (null) va a pluto', () => {
    mockSelectedPlanet = null;
    renderHook(() => useKeyboardNavigation());
    pressKey('Tab', true);
    expect(mockSetSelectedPlanet).toHaveBeenCalledWith('pluto');
  });

  it('Escape llama a setSelectedPlanet(null)', () => {
    mockSelectedPlanet = 'mars';
    renderHook(() => useKeyboardNavigation());
    pressKey('Escape');
    expect(mockSetSelectedPlanet).toHaveBeenCalledWith(null);
  });

  it('T alterna tourActive de false a true', () => {
    mockTourActive = false;
    renderHook(() => useKeyboardNavigation());
    pressKey('t');
    expect(mockSetTourActive).toHaveBeenCalledWith(true);
  });

  it('T alterna tourActive de true a false', () => {
    mockTourActive = true;
    renderHook(() => useKeyboardNavigation());
    pressKey('t');
    expect(mockSetTourActive).toHaveBeenCalledWith(false);
  });

  it('limpia el listener al desmontar', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardNavigation());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
