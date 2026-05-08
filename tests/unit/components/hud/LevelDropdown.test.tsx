/**
 * Tests del componente <LevelDropdown> (T3.3)
 *
 * Verifica:
 * (a) <select aria-label="Nivel pedagógico"> con 3 opciones
 * (b) Cambiar a "investigador" actualiza el store
 * (c) Store nivel "explorador" → select value "explorador"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

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
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { LevelDropdown } from '@/components/hud/LevelDropdown';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockLevel = 'aprendiz';
});

describe('<LevelDropdown>', () => {
  it('T3.3a: renderiza <select> con aria-label="Nivel pedagógico"', () => {
    const { container } = render(<LevelDropdown />);
    const select = container.querySelector('select');
    expect(select).not.toBeNull();
    expect(select?.getAttribute('aria-label')).toBe('Nivel pedagógico');
  });

  it('T3.3a: tiene exactamente tres opciones: explorador, aprendiz, investigador', () => {
    const { container } = render(<LevelDropdown />);
    const options = container.querySelectorAll('option');
    expect(options).toHaveLength(3);
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    expect(values).toContain('explorador');
    expect(values).toContain('aprendiz');
    expect(values).toContain('investigador');
  });

  it('T3.3b: cambiar a "investigador" llama a setLevel("investigador")', () => {
    const { container } = render(<LevelDropdown />);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'investigador' } });
    expect(mockSetLevel).toHaveBeenCalledWith('investigador');
  });

  it('T3.3c: store nivel "explorador" → select value "explorador"', () => {
    mockLevel = 'explorador';
    const { container } = render(<LevelDropdown />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('explorador');
  });
});
