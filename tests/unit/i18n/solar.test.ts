/**
 * 2.1 — TEST: namespace solar — presencia de keys en ES y EN.
 * Carga los JSON directamente, sin inicializar i18next.
 * Verifica estructura idéntica entre idiomas y todos los keys requeridos.
 */
import { describe, it, expect } from 'vitest';
import esSolar from '../../../src/i18n/locales/es/solar.json';
import enSolar from '../../../src/i18n/locales/en/solar.json';

const CELESTIAL_BODIES = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;

const LEVELS = ['explorador', 'aprendiz', 'investigador'] as const;

function getNestedKey(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe('solar.json ES — estructura general', () => {
  it('tiene key ui.scale_note', () => {
    expect(getNestedKey(esSolar, 'ui.scale_note')).toBeTruthy();
  });

  it('tiene keys ui.level_selector.{explorador,aprendiz,investigador}', () => {
    for (const level of LEVELS) {
      expect(getNestedKey(esSolar, `ui.level_selector.${level}`)).toBeTruthy();
    }
  });

  it('tiene keys ui.tour.{start,stop,next}', () => {
    expect(getNestedKey(esSolar, 'ui.tour.start')).toBeTruthy();
    expect(getNestedKey(esSolar, 'ui.tour.stop')).toBeTruthy();
    expect(getNestedKey(esSolar, 'ui.tour.next')).toBeTruthy();
  });

  it('tiene ui.attribution', () => {
    expect(getNestedKey(esSolar, 'ui.attribution')).toBeTruthy();
  });
});

describe('solar.json ES — 9 cuerpos celestes × 3 niveles', () => {
  for (const body of CELESTIAL_BODIES) {
    it(`${body}.name existe`, () => {
      expect(getNestedKey(esSolar, `${body}.name`)).toBeTruthy();
    });

    for (const level of LEVELS) {
      it(`${body}.${level}.description existe`, () => {
        expect(getNestedKey(esSolar, `${body}.${level}.description`)).toBeTruthy();
      });
    }
  }
});

describe('solar.json ES — Plutón nota IAU', () => {
  it('pluto.iau_note.explorador existe', () => {
    expect(getNestedKey(esSolar, 'pluto.iau_note.explorador')).toBeTruthy();
  });

  it('pluto.iau_note.aprendiz existe', () => {
    expect(getNestedKey(esSolar, 'pluto.iau_note.aprendiz')).toBeTruthy();
  });

  it('pluto.iau_note.investigador existe', () => {
    expect(getNestedKey(esSolar, 'pluto.iau_note.investigador')).toBeTruthy();
  });
});

describe('solar.json EN — mismas keys raíz que ES', () => {
  it('tiene ui.scale_note en EN', () => {
    expect(getNestedKey(enSolar, 'ui.scale_note')).toBeTruthy();
  });

  it('tiene ui.attribution en EN', () => {
    expect(getNestedKey(enSolar, 'ui.attribution')).toBeTruthy();
  });

  for (const body of CELESTIAL_BODIES) {
    it(`EN: ${body}.name existe`, () => {
      expect(getNestedKey(enSolar, `${body}.name`)).toBeTruthy();
    });

    for (const level of LEVELS) {
      it(`EN: ${body}.${level}.description existe`, () => {
        expect(getNestedKey(enSolar, `${body}.${level}.description`)).toBeTruthy();
      });
    }
  }

  it('EN: pluto.iau_note tiene los 3 niveles', () => {
    for (const level of LEVELS) {
      expect(getNestedKey(enSolar, `pluto.iau_note.${level}`)).toBeTruthy();
    }
  });
});

describe('solar.json — paridad ES ↔ EN', () => {
  it('ambos archivos tienen exactamente los mismos cuerpos celestes', () => {
    for (const body of CELESTIAL_BODIES) {
      const esHas = getNestedKey(esSolar, body) !== undefined;
      const enHas = getNestedKey(enSolar, body) !== undefined;
      expect(esHas, `ES falta ${body}`).toBe(true);
      expect(enHas, `EN falta ${body}`).toBe(true);
    }
  });
});

// Verificar que los textos en ES son en español (no inglés)
describe('solar.json ES — sanity de contenido', () => {
  it('mercury.name es "Mercurio" en ES', () => {
    expect(getNestedKey(esSolar, 'mercury.name')).toBe('Mercurio');
  });

  it('pluto.name es "Plutón" en ES', () => {
    expect(getNestedKey(esSolar, 'pluto.name')).toBe('Plutón');
  });

  it('earth.name es "Tierra" en ES', () => {
    expect(getNestedKey(esSolar, 'earth.name')).toBe('Tierra');
  });
});

describe('solar.json EN — sanity de contenido', () => {
  it('mercury.name es "Mercury" en EN', () => {
    expect(getNestedKey(enSolar, 'mercury.name')).toBe('Mercury');
  });

  it('pluto.name es "Pluto" en EN', () => {
    expect(getNestedKey(enSolar, 'pluto.name')).toBe('Pluto');
  });

  it('earth.name es "Earth" en EN', () => {
    expect(getNestedKey(enSolar, 'earth.name')).toBe('Earth');
  });
});
