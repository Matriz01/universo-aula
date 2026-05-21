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

  // Regresión: el orden de los niveles refleja la progresión pedagógica
  // (básico → medio → avanzado). Si alguien reordena el array LEVELS,
  // este test falla y obliga a justificarlo.
  it('orden: las opciones aparecen como básico → medio → avanzado (explorador, aprendiz, investigador)', () => {
    const { container } = render(<LevelDropdown />);
    const options = container.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    expect(values).toEqual(['explorador', 'aprendiz', 'investigador']);
  });
});

// ---------------------------------------------------------------------------
// Regresión del bloque "hud" duplicado en los locales.
//
// Históricamente solar.json tenía DOS bloques "hud" en el mismo objeto JSON:
// el segundo aplastaba al primero al parsear, dejando las claves del primero
// (incluidos los labels de nivel) huérfanas y forzando el fallback de t().
// Resultado visible: el dropdown mostraba "explorador / aprendiz / investigador"
// en minúsculas en vez de los labels con etiqueta.
//
// Importamos el JSON resuelto y verificamos que las claves siguen accesibles
// tras el parse. Si alguien vuelve a introducir un bloque "hud" duplicado,
// estos assert fallan.
// ---------------------------------------------------------------------------

import esSolar from '@/i18n/locales/es/solar.json';
import enSolar from '@/i18n/locales/en/solar.json';

describe('locales — claves "hud.level*" alcanzables tras el parse (regresión)', () => {
  it('es: hud.levelExplorador llega como "Explorador (básico)"', () => {
    expect(esSolar.hud.levelExplorador).toBe('Explorador (básico)');
  });

  it('es: hud.levelAprendiz llega como "Aprendiz (medio)"', () => {
    expect(esSolar.hud.levelAprendiz).toBe('Aprendiz (medio)');
  });

  it('es: hud.levelInvestigador llega como "Investigador (avanzado)"', () => {
    expect(esSolar.hud.levelInvestigador).toBe('Investigador (avanzado)');
  });

  it('en: hud.levelExplorador llega como "Explorer (basic)"', () => {
    expect(enSolar.hud.levelExplorador).toBe('Explorer (basic)');
  });

  it('en: hud.levelAprendiz llega como "Apprentice (intermediate)"', () => {
    expect(enSolar.hud.levelAprendiz).toBe('Apprentice (intermediate)');
  });

  it('en: hud.levelInvestigador llega como "Researcher (advanced)"', () => {
    expect(enSolar.hud.levelInvestigador).toBe('Researcher (advanced)');
  });

  it('es: hud.showAxes y hud.hideAxes siguen alcanzables tras consolidar', () => {
    expect(esSolar.hud.showAxes).toBe('Mostrar ejes');
    expect(esSolar.hud.hideAxes).toBe('Ocultar ejes');
  });

  it('en: hud.showAxes y hud.hideAxes siguen alcanzables tras consolidar', () => {
    expect(enSolar.hud.showAxes).toBe('Show axes');
    expect(enSolar.hud.hideAxes).toBe('Hide axes');
  });
});
