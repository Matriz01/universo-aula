import { describe, it, expect } from 'vitest';
import {
  J2000_MS,
  daysSinceJ2000,
  solveKepler,
  trueAnomalyFromEccentric,
} from '@/scenes/orbital/keplerTime';

describe('daysSinceJ2000', () => {
  it('devuelve 0 en J2000 epoch', () => {
    expect(daysSinceJ2000(new Date(J2000_MS))).toBeCloseTo(0, 6);
  });
  it('devuelve 1 un día después de J2000', () => {
    expect(daysSinceJ2000(new Date(J2000_MS + 86_400_000))).toBeCloseTo(1, 6);
  });
  it('devuelve negativo antes de J2000', () => {
    expect(daysSinceJ2000(new Date(J2000_MS - 86_400_000))).toBeCloseTo(-1, 6);
  });
});

describe('solveKepler', () => {
  it('M=0 → E=0', () => {
    expect(solveKepler(0, 0.5)).toBeCloseTo(0, 6);
  });
  it('M=π → E=π (independiente de e)', () => {
    expect(solveKepler(Math.PI, 0.3)).toBeCloseTo(Math.PI, 6);
  });
  it('e=0 → E=M (órbita circular)', () => {
    expect(solveKepler(1.234, 0)).toBeCloseTo(1.234, 6);
  });
  it('converge para excentricidades extremas tipo Halley (e=0.967)', () => {
    const M = 1.5;
    const E = solveKepler(M, 0.967);
    expect(E - 0.967 * Math.sin(E)).toBeCloseTo(M, 4);
  });
});

describe('trueAnomalyFromEccentric', () => {
  it('E=0 → ν=0', () => {
    expect(trueAnomalyFromEccentric(0, 0.5)).toBeCloseTo(0, 6);
  });
  it('E=π → ν=π', () => {
    expect(trueAnomalyFromEccentric(Math.PI, 0.5)).toBeCloseTo(Math.PI, 6);
  });
});
