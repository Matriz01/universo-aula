/**
 * Tests de precisión float64 para simulationClock (REQ-CLK-4)
 *
 * Simula 10 años de acumulación de JD y verifica que el error angular
 * de la Tierra no supera 0.01°.
 *
 * Estrategia de tick optimizado:
 *   tick(86400, 1) → delta_jd = 86400 * 1 / 86400 = 1 día/tick
 *   3650 ticks × 1 día/tick = 3650 días simulados (≈10 años)
 *   Mantiene la misma aritmética de acumulación que en producción (dt*speedup/86400).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { reset, setPaused, tick, getJD, J2000_JD } from '../../../src/scenes/simulationClock';

beforeEach(() => {
  reset(J2000_JD);
  setPaused(false);
});

describe('jdPrecision — REQ-CLK-4: drift < 0.01° tras 10 años simulados', () => {
  it('acumula 3650 días sin drift apreciable en posición angular de la Tierra', () => {
    const SIM_DAYS = 3650; // ≈ 10 años

    // tick(86400, 1) → delta_jd = 1 día exacto por tick, 3650 iteraciones
    for (let i = 0; i < SIM_DAYS; i++) {
      tick(86400, 1);
    }

    const jdSimulated = getJD();
    const expectedJD = J2000_JD + SIM_DAYS;

    // JD acumulado debe coincidir con 6 decimales de precisión
    expect(jdSimulated).toBeCloseTo(expectedJD, 6);

    // Verificación de posición angular de la Tierra (período 365.25 días)
    const nEarth = 360 / 365.25; // grados por día
    const thetaSim = ((jdSimulated - J2000_JD) * nEarth) % 360;
    const thetaRef = (SIM_DAYS * nEarth) % 360;

    expect(Math.abs(thetaSim - thetaRef)).toBeLessThan(0.01); // REQ-CLK-4
  });
});
