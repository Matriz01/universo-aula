/**
 * Tests unitarios para simulationClock.ts (replan-2026-05)
 *
 * Cubre:
 *  - REQ-CLK-1: API pública de la instancia singleton
 *  - REQ-CLK-2: Constantes de speedup
 *  - REQ-CLK-3: Conversión JD ↔ Gregoriano
 *
 * TDD: este archivo se escribe ANTES de que exista simulationClock.ts.
 * La primera ejecución DEBE fallar con "Cannot find module …".
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as clock from '../../../src/scenes/simulationClock';

// ── Constante J2000 esperada ─────────────────────────────────────────────────

const J2000 = 2451545.0;

// ── Aislamiento de estado ────────────────────────────────────────────────────

beforeEach(() => {
  clock.reset(J2000);
  clock.setPaused(false);
});

// ── REQ-CLK-1: API de instancia ──────────────────────────────────────────────

describe('simulationClock — getJD()', () => {
  it('devuelve J2000_JD en el arranque (2451545.0)', () => {
    expect(clock.getJD()).toBe(J2000);
  });
});

describe('simulationClock — tick()', () => {
  it('avanza exactamente 1 día cuando se llama tick(1.0, 86400.0) sin pausa', () => {
    clock.tick(1.0, 86400.0);
    // deltaSeconds * speedup / 86400 = 1.0 * 86400 / 86400 = 1.0 día
    expect(clock.getJD()).toBe(J2000 + 1.0);
  });

  it('fórmula correcta: JD += deltaSeconds * speedup / 86400', () => {
    const delta = 0.5;
    const speedup = 43200; // 0.5 días
    clock.tick(delta, speedup);
    expect(clock.getJD()).toBeCloseTo(J2000 + (delta * speedup) / 86400, 10);
  });

  it('no avanza si está pausado', () => {
    clock.setPaused(true);
    clock.tick(10.0, 86400.0);
    expect(clock.getJD()).toBe(J2000);
  });

  it('reanuda la acumulación tras despausar', () => {
    clock.setPaused(true);
    clock.tick(5.0, 86400.0); // ignorado
    clock.setPaused(false);
    clock.tick(1.0, 86400.0);
    expect(clock.getJD()).toBe(J2000 + 1.0);
  });
});

describe('simulationClock — reset()', () => {
  it('establece el JD exactamente al valor proporcionado', () => {
    clock.tick(100.0, 86400.0);
    clock.reset(J2000);
    expect(clock.getJD()).toBe(J2000);
  });

  it('acepta cualquier JD arbitrario', () => {
    clock.reset(2459000.5);
    expect(clock.getJD()).toBe(2459000.5);
  });
});

describe('simulationClock — getPaused() / setPaused()', () => {
  it('devuelve false por defecto', () => {
    expect(clock.getPaused()).toBe(false);
  });

  it('devuelve true tras setPaused(true)', () => {
    clock.setPaused(true);
    expect(clock.getPaused()).toBe(true);
  });

  it('vuelve a false tras setPaused(false)', () => {
    clock.setPaused(true);
    clock.setPaused(false);
    expect(clock.getPaused()).toBe(false);
  });
});

// ── REQ-CLK-2: Constantes de speedup ─────────────────────────────────────────

describe('simulationClock — constantes SPEEDUP_*', () => {
  it('SPEEDUP_EXPLORADOR === 3', () => {
    expect(clock.SPEEDUP_EXPLORADOR).toBe(3);
  });

  it('SPEEDUP_APRENDIZ === 1', () => {
    expect(clock.SPEEDUP_APRENDIZ).toBe(1);
  });

  it('SPEEDUP_INVESTIGADOR === 0.3', () => {
    expect(clock.SPEEDUP_INVESTIGADOR).toBe(0.3);
  });

  it('J2000_JD === 2451545.0', () => {
    expect(clock.J2000_JD).toBe(2451545.0);
  });
});

describe('simulationClock — speedupForLevel()', () => {
  it('explorador → 3', () => {
    expect(clock.speedupForLevel('explorador')).toBe(3);
  });

  it('aprendiz → 1', () => {
    expect(clock.speedupForLevel('aprendiz')).toBe(1);
  });

  it('investigador → 0.3', () => {
    expect(clock.speedupForLevel('investigador')).toBe(0.3);
  });
});

// ── REQ-CLK-3: Conversión JD ↔ Gregoriano ────────────────────────────────────

describe('simulationClock — getGregorianDate()', () => {
  it('J2000.0 → { year: 2000, month: 1, day: 1 }', () => {
    clock.reset(J2000);
    expect(clock.getGregorianDate()).toEqual({ year: 2000, month: 1, day: 1 });
  });

  it('JD 2459000.5 → { year: 2020, month: 5, day: 31 }', () => {
    clock.reset(2459000.5);
    expect(clock.getGregorianDate()).toEqual({ year: 2020, month: 5, day: 31 });
  });
});

describe('simulationClock — jdToGregorian() (función pura)', () => {
  it('2451545.0 → { year: 2000, month: 1, day: 1 }', () => {
    expect(clock.jdToGregorian(2451545.0)).toEqual({ year: 2000, month: 1, day: 1 });
  });

  it('2459000.5 → { year: 2020, month: 5, day: 31 }', () => {
    expect(clock.jdToGregorian(2459000.5)).toEqual({ year: 2020, month: 5, day: 31 });
  });
});
