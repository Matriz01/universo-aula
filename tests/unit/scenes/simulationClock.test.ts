/**
 * Tests unitarios para simulationClock.ts (replan-2026-05 — Batch 4)
 *
 * Cubre:
 *  - REQ-CLK-1: API pública de la instancia singleton
 *  - REQ-CLK-2: Constantes de escala de velocidad (SPEED_STOPS_SECONDS_PER_SECOND)
 *  - REQ-CLK-3: Conversión JD ↔ Gregoriano
 *  - REQ-CLK-4: Test de precisión a framerate real que habría capturado el bug de unidades
 *
 * TDD: este archivo se actualiza ANTES de modificar simulationClock.ts (Batch 4).
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

// ── REQ-CLK-2: Escala de velocidad SPEED_STOPS_SECONDS_PER_SECOND ───────────

describe('simulationClock — SPEED_STOPS_SECONDS_PER_SECOND', () => {
  it('exporta SPEED_STOPS_SECONDS_PER_SECOND como array de 13 elementos', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND).toHaveLength(13);
  });

  it('el primer stop es 0 (pausa)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[0]).toBe(0);
  });

  it('el segundo stop es 1 (tiempo real)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[1]).toBe(1);
  });

  it('el último stop es 31536000 (1 año/s)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[12]).toBe(31536000);
  });

  it('los stops son estrictamente crecientes (excepto el primero que es 0)', () => {
    const stops = clock.SPEED_STOPS_SECONDS_PER_SECOND;
    for (let i = 2; i < stops.length; i++) {
      expect(stops[i]).toBeGreaterThan(stops[i - 1]);
    }
  });

  it('J2000_JD sigue exportado y es 2451545.0', () => {
    expect(clock.J2000_JD).toBe(2451545.0);
  });
});

describe('simulationClock — SPEED_STOP_LABELS_ES', () => {
  it('exporta SPEED_STOP_LABELS_ES como array de 13 etiquetas', () => {
    expect(clock.SPEED_STOP_LABELS_ES).toHaveLength(13);
  });

  it('la etiqueta del stop 0 es "Pausa"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[0]).toBe('Pausa');
  });

  it('la etiqueta del stop 1 es "1 s/s"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[1]).toBe('1 s/s');
  });

  it('la etiqueta del último stop es "1 año/s"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[12]).toBe('1 año/s');
  });
});

// ── REQ-CLK-4: Test de precisión a framerate real ───────────────────────────
//
// Este test simula 1 segundo real a 60 fps con speedup=86400 (1 día/s).
// Con la fórmula correcta: jd += (1/60 * 86400) / 86400 = 1/60 días/frame
// 60 frames × 1/60 días/frame = 1.0 día exacto.
//
// Si alguien restaura el antiguo bug (speedup como "días/s" pero
// multiplicado por nivel pedagógico × 86400 inside the formula),
// este test fallará porque el JD avanzaría 86400 días en lugar de 1.
//
// Este test HABRÍA capturado el bug original donde speedup = 3 (días/s)
// pero se usaba tick(delta, simulationSpeed * speedupForLevel(level))
// y speedupForLevel devolvía días/s — el avance era ~3.47e-5 días/frame,
// necesitando 122 días reales para que la Tierra completara una órbita.

describe('simulationClock — precisión a framerate real (REQ-CLK-4)', () => {
  it('1 segundo real a 60 fps con speedup=86400 avanza exactamente 1 día', () => {
    const FRAMES = 60;
    const DELTA_PER_FRAME = 1 / 60; // segundos reales por frame
    const SPEEDUP = 86400; // 1 día de simulación por segundo real

    for (let i = 0; i < FRAMES; i++) {
      clock.tick(DELTA_PER_FRAME, SPEEDUP);
    }

    // Debe haber avanzado ~1 día (con tolerancia a acumulación float64 sobre 60 frames)
    // toBeCloseTo(x, 6) → precisión ±5e-7, suficiente para verificar la fórmula
    // y capturar el bug original (que avanzaría ~3.47e-5 días en lugar de 1.0)
    expect(clock.getJD()).toBeCloseTo(J2000 + 1.0, 6);
  });

  it('con speedup=1 (tiempo real), 1 segundo real avanza 1/86400 días', () => {
    const FRAMES = 60;
    const DELTA_PER_FRAME = 1 / 60;
    const SPEEDUP = 1; // tiempo real

    for (let i = 0; i < FRAMES; i++) {
      clock.tick(DELTA_PER_FRAME, SPEEDUP);
    }

    // 60 frames × (1/60 * 1 / 86400) = 1/86400 días ≈ 1.157e-5
    const expectedDelta = 1.0 / 86400;
    expect(clock.getJD()).toBeCloseTo(J2000 + expectedDelta, 6);
  });

  it('con speedup=31536000 (1 año/s), 1 segundo real avanza 365.25 días', () => {
    const FRAMES = 60;
    const DELTA_PER_FRAME = 1 / 60;
    const SPEEDUP = 31536000; // 1 año/s = 365.25 días/s

    for (let i = 0; i < FRAMES; i++) {
      clock.tick(DELTA_PER_FRAME, SPEEDUP);
    }

    // 60 × (1/60 × 31536000 / 86400) = 31536000 / 86400 = 365.0 días
    const expectedDelta = 31536000 / 86400;
    expect(clock.getJD()).toBeCloseTo(J2000 + expectedDelta, 6);
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
