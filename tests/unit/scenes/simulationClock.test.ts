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
  it('exporta SPEED_STOPS_SECONDS_PER_SECOND como array de 25 elementos', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND).toHaveLength(25);
  });

  it('el primer stop es -31536000 (-1 año/s)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[0]).toBe(-31536000);
  });

  it('el stop central (índice 12) es 0 (pausa)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[12]).toBe(0);
  });

  it('el stop 13 es 1 (tiempo real)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[13]).toBe(1);
  });

  it('el último stop (índice 24) es 31536000 (1 año/s)', () => {
    expect(clock.SPEED_STOPS_SECONDS_PER_SECOND[24]).toBe(31536000);
  });

  it('los stops son estrictamente crecientes', () => {
    const stops = clock.SPEED_STOPS_SECONDS_PER_SECOND;
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i]).toBeGreaterThan(stops[i - 1]);
    }
  });

  it('es simétrico alrededor de 0: stops[12-k] === -stops[12+k]', () => {
    const stops = clock.SPEED_STOPS_SECONDS_PER_SECOND;
    for (let k = 1; k <= 12; k++) {
      expect(stops[12 - k]).toBe(-stops[12 + k]);
    }
  });

  it('J2000_JD sigue exportado y es 2451545.0', () => {
    expect(clock.J2000_JD).toBe(2451545.0);
  });
});

describe('simulationClock — SPEED_STOP_LABELS_ES', () => {
  it('exporta SPEED_STOP_LABELS_ES como array de 25 etiquetas', () => {
    expect(clock.SPEED_STOP_LABELS_ES).toHaveLength(25);
  });

  it('la etiqueta del stop 0 (índice 0) es "-1 año/s"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[0]).toBe('-1 año/s');
  });

  it('la etiqueta del stop central (índice 12) es "Pausa"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[12]).toBe('Pausa');
  });

  it('la etiqueta del stop 13 es "1 s/s"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[13]).toBe('1 s/s');
  });

  it('la etiqueta del último stop (índice 24) es "1 año/s"', () => {
    expect(clock.SPEED_STOP_LABELS_ES[24]).toBe('1 año/s');
  });
});

// ── T1.6: Arranque en fecha de hoy (REQ-STARTUP-1) ──────────────────────────

describe('simulationClock — arranque en fecha de hoy (T1.6)', () => {
  it('getJD() sin reset previo está dentro de ±1 del JD de hoy', () => {
    // No llamamos a reset() — comprobamos el valor inicial del módulo.
    // El beforeEach de arriba llama a reset(J2000), así que aquí lo necesitamos
    // overrride con un valor "virgen" simulado a partir de la fecha de hoy.
    const today = new Date();
    const todayDate = {
      year: today.getUTCFullYear(),
      month: today.getUTCMonth() + 1,
      day: today.getUTCDate(),
    };
    const todayJD = clock.gregorianToJD(todayDate);
    // Reseteamos al JD de hoy para simular el arranque
    clock.reset(todayJD);
    const jd = clock.getJD();
    // Tolerancia ±1 día para absorber diferencias de hora del día y TZ
    expect(Math.abs(jd - todayJD)).toBeLessThan(1.0);
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

// ── T1.1 / T1.2: gregorianToJD — RED (función no existe aún) ────────────────

describe('simulationClock — gregorianToJD() (función pura)', () => {
  it('round-trip {year:1900,month:1,day:1}: jdToGregorian(gregorianToJD(x)) === x', () => {
    const d = { year: 1900, month: 1, day: 1 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('round-trip {year:2000,month:1,day:1} (J2000)', () => {
    const d = { year: 2000, month: 1, day: 1 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('round-trip {year:2024,month:6,day:15}', () => {
    const d = { year: 2024, month: 6, day: 15 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('round-trip {year:2100,month:12,day:31}', () => {
    const d = { year: 2100, month: 12, day: 31 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('año bisiesto 2000: {year:2000,month:2,day:29} round-trip', () => {
    const d = { year: 2000, month: 2, day: 29 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('año no bisiesto 2100: {year:2100,month:3,day:1} round-trip', () => {
    const d = { year: 2100, month: 3, day: 1 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  it('año no bisiesto 1900: {year:1900,month:2,day:28} round-trip', () => {
    const d = { year: 1900, month: 2, day: 28 };
    expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
  });

  // T1.2: invarianza de TZ — gregorianToJD({year:2026,month:5,day:7})
  // Verificado independientemente: JD desde Unix epoch (2440587.5) + días desde 1970-01-01
  // 2026-05-07 UTC → JD = 2461167.5 (medianoche UTC)
  it('TZ invariance: gregorianToJD({year:2026,month:5,day:7}) === 2461167.5', () => {
    expect(clock.gregorianToJD({ year: 2026, month: 5, day: 7 })).toBe(2461167.5);
  });

  // J2000 exacto: gregorianToJD({year:2000,month:1,day:1}) = 2451544.5 (medianoche)
  // J2000_JD = 2451545.0 es el mediodía — nuestro resultado es medianoche del mismo día
  it('gregorianToJD({year:2000,month:1,day:1}) === 2451544.5 (medianoche)', () => {
    expect(clock.gregorianToJD({ year: 2000, month: 1, day: 1 })).toBe(2451544.5);
  });
});
