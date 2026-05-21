/**
 * i18n tests — Oort Cloud pedagogical copy keys.
 *
 * REQ-HUD-4: hud.toggleOortCloud + hud.toggleOortCloudTooltip in es + en.
 * REQ-PEDA-1: layers.oort.{title,body} per level in es + en.
 * REQ-PEDA-2: Sedna mentioned in investigador body text.
 *
 * Loads JSON directly without initialising i18next — pure key-presence checks.
 */
import { describe, it, expect } from 'vitest';
import esSolar from '../../../src/i18n/locales/es/solar.json';
import enSolar from '../../../src/i18n/locales/en/solar.json';

const LEVELS = ['explorador', 'aprendiz', 'investigador'] as const;

function getNestedKey(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ---------------------------------------------------------------------------
// REQ-HUD-4 — toggle label keys (added in PR 1 — regression guard)
// ---------------------------------------------------------------------------

describe('solar.json — hud.toggleOortCloud (REQ-HUD-4)', () => {
  it('ES: hud.toggleOortCloud is a non-empty string', () => {
    const val = getNestedKey(esSolar, 'hud.toggleOortCloud');
    expect(typeof val).toBe('string');
    expect(val).toBeTruthy();
  });

  it('EN: hud.toggleOortCloud is a non-empty string', () => {
    const val = getNestedKey(enSolar, 'hud.toggleOortCloud');
    expect(typeof val).toBe('string');
    expect(val).toBeTruthy();
  });

  it('ES: hud.toggleOortCloudTooltip is a non-empty string', () => {
    const val = getNestedKey(esSolar, 'hud.toggleOortCloudTooltip');
    expect(typeof val).toBe('string');
    expect(val).toBeTruthy();
  });

  it('EN: hud.toggleOortCloudTooltip is a non-empty string', () => {
    const val = getNestedKey(enSolar, 'hud.toggleOortCloudTooltip');
    expect(typeof val).toBe('string');
    expect(val).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// REQ-PEDA-1 — layers.oort.{title,body}.{level} per locale
// ---------------------------------------------------------------------------

describe('solar.json — layers.oort pedagogical copy (REQ-PEDA-1)', () => {
  for (const level of LEVELS) {
    it(`ES: layers.oort.title.${level} is a non-empty string`, () => {
      const val = getNestedKey(esSolar, `layers.oort.title.${level}`);
      expect(typeof val, `ES layers.oort.title.${level} missing`).toBe('string');
      expect(val, `ES layers.oort.title.${level} empty`).toBeTruthy();
    });

    it(`ES: layers.oort.body.${level} is a non-empty string`, () => {
      const val = getNestedKey(esSolar, `layers.oort.body.${level}`);
      expect(typeof val, `ES layers.oort.body.${level} missing`).toBe('string');
      expect(val, `ES layers.oort.body.${level} empty`).toBeTruthy();
    });

    it(`EN: layers.oort.title.${level} is a non-empty string`, () => {
      const val = getNestedKey(enSolar, `layers.oort.title.${level}`);
      expect(typeof val, `EN layers.oort.title.${level} missing`).toBe('string');
      expect(val, `EN layers.oort.title.${level} empty`).toBeTruthy();
    });

    it(`EN: layers.oort.body.${level} is a non-empty string`, () => {
      const val = getNestedKey(enSolar, `layers.oort.body.${level}`);
      expect(typeof val, `EN layers.oort.body.${level} missing`).toBe('string');
      expect(val, `EN layers.oort.body.${level} empty`).toBeTruthy();
    });
  }
});

// ---------------------------------------------------------------------------
// REQ-PEDA-1 — explorador title must be "Nube de cometas" in ES
// ---------------------------------------------------------------------------

describe('solar.json — explorador label (REQ-PEDA-1)', () => {
  it('ES: layers.oort.title.explorador === "Nube de cometas"', () => {
    expect(getNestedKey(esSolar, 'layers.oort.title.explorador')).toBe('Nube de cometas');
  });
});

// ---------------------------------------------------------------------------
// REQ-PEDA-2 — Sedna mentioned in investigador body text
// ---------------------------------------------------------------------------

describe('solar.json — Sedna in investigador copy (REQ-PEDA-2)', () => {
  it('ES: layers.oort.body.investigador contains "Sedna"', () => {
    const val = getNestedKey(esSolar, 'layers.oort.body.investigador');
    expect(typeof val).toBe('string');
    expect(val as string).toContain('Sedna');
  });

  it('EN: layers.oort.body.investigador contains "Sedna"', () => {
    const val = getNestedKey(enSolar, 'layers.oort.body.investigador');
    expect(typeof val).toBe('string');
    expect(val as string).toContain('Sedna');
  });
});

// ---------------------------------------------------------------------------
// REQ-PEDA-3 — ES ↔ EN structural parity for oort keys
// ---------------------------------------------------------------------------

describe('solar.json — oort key parity ES ↔ EN (REQ-PEDA-3)', () => {
  for (const level of LEVELS) {
    it(`layers.oort.title.${level} present in both locales`, () => {
      expect(getNestedKey(esSolar, `layers.oort.title.${level}`)).toBeTruthy();
      expect(getNestedKey(enSolar, `layers.oort.title.${level}`)).toBeTruthy();
    });

    it(`layers.oort.body.${level} present in both locales`, () => {
      expect(getNestedKey(esSolar, `layers.oort.body.${level}`)).toBeTruthy();
      expect(getNestedKey(enSolar, `layers.oort.body.${level}`)).toBeTruthy();
    });
  }
});
