/**
 * 1.9 — TEST: funciones puras de mecánica orbital.
 * Funciones: solveKeplerNewtonRaphson, applyOrbitalRotation, degToRad.
 * Casos de test del design §4.5.
 */
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import {
  solveKeplerNewtonRaphson,
  applyOrbitalRotation,
  degToRad,
  SPEEDUP_EXPLORADOR,
  SPEEDUP_APRENDIZ,
  SPEEDUP_INVESTIGADOR,
} from '@/scenes/orbital';

describe('solveKeplerNewtonRaphson', () => {
  it('returns M when e=0 (órbita circular)', () => {
    expect(solveKeplerNewtonRaphson(1.234, 0)).toBeCloseTo(1.234, 6);
  });

  it('solveKeplerNewtonRaphson(1.234, 0) ≈ 1.234', () => {
    const E = solveKeplerNewtonRaphson(1.234, 0);
    // E - e*sin(E) = M ⟹ E - 0 = 1.234
    expect(E).toBeCloseTo(1.234, 6);
  });

  it('Mercury (e=0.20563) en M=π/2 converge — verifica ecuación de Kepler', () => {
    const e = 0.20563;
    const M = Math.PI / 2;
    const E = solveKeplerNewtonRaphson(M, e);
    // Verificar M = E - e*sin(E)
    expect(E - e * Math.sin(E)).toBeCloseTo(M, 5);
  });

  it('Mercury (e=0.20563) converge en ≤8 iteraciones con error <1e-6', () => {
    const e = 0.20563;
    const M = 1.0;
    const E = solveKeplerNewtonRaphson(M, e, 1e-6, 8);
    expect(E - e * Math.sin(E)).toBeCloseTo(M, 5);
  });

  it('Plutón (e=0.2488) en M=π converge', () => {
    const e = 0.2488;
    const M = Math.PI;
    const E = solveKeplerNewtonRaphson(M, e);
    expect(E - e * Math.sin(E)).toBeCloseTo(M, 5);
  });

  it('normaliza M fuera de [-π, π] correctamente', () => {
    const e = 0.1;
    const M = 3 * Math.PI; // fuera de rango
    const E = solveKeplerNewtonRaphson(M, e);
    const Mnorm = M % (2 * Math.PI);
    // Mn debe estar en [-π, π]
    expect(E - e * Math.sin(E)).toBeCloseTo(Mnorm, 4);
  });
});

describe('applyOrbitalRotation', () => {
  it('inclinación 0 + Ω=0 + ω=0 → vector en plano XZ (Y≈0)', () => {
    const v = new Vector3();
    applyOrbitalRotation(v, 1, 0, 0, 0, 0);
    expect(v.y).toBeCloseTo(0, 10);
    expect(v.x).toBeCloseTo(1, 5); // r=1, ν=0, ω=0, Ω=0 → xp=1, yp=0
  });

  it('inclinación 90° en ν=π/2 → vector en eje Y (Y≈1)', () => {
    const v = new Vector3();
    applyOrbitalRotation(v, 1, Math.PI / 2, 0, 0, Math.PI / 2);
    expect(v.y).toBeCloseTo(1, 5);
  });

  it('módulo del vector resultante = r (rotación no cambia la longitud)', () => {
    const v = new Vector3();
    const r = 5.3;
    applyOrbitalRotation(v, r, 1.2, 0.5, 1.0, 0.3);
    expect(v.length()).toBeCloseTo(r, 4);
  });
});

describe('degToRad', () => {
  it('0° → 0', () => expect(degToRad(0)).toBeCloseTo(0));
  it('180° → π', () => expect(degToRad(180)).toBeCloseTo(Math.PI, 10));
  it('360° → 2π', () => expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 10));
  it('90° → π/2', () => expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10));
});

describe('constantes de simulación temporal', () => {
  it('SPEEDUP_EXPLORADOR = 3', () => expect(SPEEDUP_EXPLORADOR).toBe(3));
  it('SPEEDUP_APRENDIZ = 1', () => expect(SPEEDUP_APRENDIZ).toBe(1));
  it('SPEEDUP_INVESTIGADOR = 0.3', () => expect(SPEEDUP_INVESTIGADOR).toBe(0.3));
});
