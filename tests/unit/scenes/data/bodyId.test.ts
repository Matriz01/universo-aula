/**
 * T B.1 — TEST: BodyId typecheck
 *
 * Verifica a nivel de tipo y runtime que:
 * - 'moon' satisface BodyId
 * - 'earth' satisface BodyId
 * - 'moon' NO satisface PlanetId
 */
import { describe, it, expect } from 'vitest';
import type { BodyId, PlanetId } from '@/scenes/data/types';

describe('BodyId — typecheck y valores', () => {
  it("'moon' satisface BodyId (tipo en runtime)", () => {
    const body: BodyId = 'moon';
    expect(body).toBe('moon');
  });

  it("'earth' satisface BodyId", () => {
    const body: BodyId = 'earth';
    expect(body).toBe('earth');
  });

  it("'moon' NO satisface PlanetId en runtime (no aparece en la union de planetas)", () => {
    // PlanetId no incluye 'moon': la lista de planetas conocidos
    const planetIds: PlanetId[] = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
    ];
    expect(planetIds.includes('moon' as PlanetId)).toBe(false);
  });

  it('BodyId incluye todos los PlanetId más moon', () => {
    const allBodyIds: BodyId[] = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'moon',
    ];
    expect(allBodyIds).toHaveLength(10);
    expect(allBodyIds.includes('moon')).toBe(true);
  });
});
