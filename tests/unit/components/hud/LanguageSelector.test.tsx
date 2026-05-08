/**
 * Tests del componente <LanguageSelector> (T3.2)
 *
 * Verifica:
 * (a) <select aria-label="Idioma"> con opciones es/en
 * (b) Cambiar a "en" llama i18n.changeLanguage("en")
 * (c) Con locale "en" el select tiene valor "en"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetLocale = vi.fn();
const mockChangeLanguage = vi.fn();
let mockLocale = 'es';

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      locale: mockLocale,
      setLocale: mockSetLocale,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: mockLocale,
    },
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { LanguageSelector } from '@/components/hud/LanguageSelector';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockLocale = 'es';
});

describe('<LanguageSelector>', () => {
  it('T3.2a: renderiza <select> con aria-label="Idioma"', () => {
    const { container } = render(<LanguageSelector />);
    const select = container.querySelector('select');
    expect(select).not.toBeNull();
    expect(select?.getAttribute('aria-label')).toBe('Idioma');
  });

  it('T3.2a: tiene exactamente dos opciones: "es" y "en"', () => {
    const { container } = render(<LanguageSelector />);
    const options = container.querySelectorAll('option');
    expect(options).toHaveLength(2);
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    expect(values).toContain('es');
    expect(values).toContain('en');
  });

  it('T3.2b: cambiar a "en" llama a i18n.changeLanguage("en")', () => {
    const { container } = render(<LanguageSelector />);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'en' } });
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('T3.2b: cambiar a "en" llama a setLocale("en")', () => {
    const { container } = render(<LanguageSelector />);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'en' } });
    expect(mockSetLocale).toHaveBeenCalledWith('en');
  });

  it('T3.2c: con locale "en" el select tiene value "en"', () => {
    mockLocale = 'en';
    const { container } = render(<LanguageSelector />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });
});
