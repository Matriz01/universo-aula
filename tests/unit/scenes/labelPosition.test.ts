/**
 * Tests para la posición de los labels de planetas y Luna (feature C).
 *
 * C1: El componente y-offset del label debe ser -planetRadius * 1.5.
 * Testeamos la función pura computeLabelOffset en lugar del componente React
 * (evita dependencias de jsdom con R3F/drei).
 */

import { describe, it, expect } from 'vitest';

import { computeLabelOffset } from '@/scenes/helpers/labelHelpers';

describe('computeLabelOffset', () => {
  it('para planetRadius=1, y-offset = -1.5', () => {
    const offset = computeLabelOffset(1);
    expect(offset[0]).toBe(0); // x
    expect(offset[1]).toBeCloseTo(-1.5, 5); // y
    expect(offset[2]).toBe(0); // z
  });

  it('para planetRadius=2, y-offset = -3', () => {
    const offset = computeLabelOffset(2);
    expect(offset[1]).toBeCloseTo(-3, 5);
  });

  it('para planetRadius=6.37 (Tierra), y-offset = -9.555', () => {
    const offset = computeLabelOffset(6.37);
    expect(offset[1]).toBeCloseTo(-6.37 * 1.5, 4);
  });

  it('para planetRadius=0.582 (Tierra modo global visual), y-offset = -0.873', () => {
    const offset = computeLabelOffset(0.582);
    expect(offset[1]).toBeCloseTo(-0.582 * 1.5, 4);
  });

  it('devuelve array de 3 elementos', () => {
    const offset = computeLabelOffset(5);
    expect(offset).toHaveLength(3);
  });

  it('x y z siempre son 0', () => {
    const offset = computeLabelOffset(10);
    expect(offset[0]).toBe(0);
    expect(offset[2]).toBe(0);
  });
});
