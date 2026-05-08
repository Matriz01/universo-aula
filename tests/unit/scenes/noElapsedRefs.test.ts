/**
 * Tests de guardia: ningún consumidor orbital debe tener elapsed.current (REQ-ORB-2)
 *
 * Verifica a nivel de código fuente que los archivos de componentes que
 * consumen tiempo de simulación NO tienen acumuladores elapsed.current locales.
 *
 * TDD:
 * - T3A.1: usePlanetPosition.ts → RED (ya migrado en T2.5, GREEN inmediato)
 * - T3B.1: Planet.tsx         → RED (tiene elapsedDays.current)
 * - T3C.1: Saturn.tsx         → RED (tiene elapsedDays.current)
 * - T3D.1: PlanetMoon.tsx     → RED (tiene elapsed.current)
 * - T3E.1: Sun.tsx            → RED (tiene elapsedDays.current)
 *
 * Nota Sun.tsx: se busca "elapsedDays.current" específicamente.
 * El acumulador uTime (shader visual, real-dt) NO se toca — no es estado orbital.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '../../..');

function read(relPath: string): string {
  return readFileSync(resolve(root, relPath), 'utf8');
}

// ── T3A.1: usePlanetPosition.ts ──────────────────────────────────────────────

describe('noElapsedRefs — usePlanetPosition.ts (T3A.1)', () => {
  const content = read('src/scenes/hooks/usePlanetPosition.ts');

  it('no contiene elapsed.current (acumulador local eliminado)', () => {
    // Solo buscamos el patrón de variable de acumulación, no referencias genéricas
    expect(/\belapsed\b.*=.*useRef/i.test(content)).toBe(false);
  });
});

// ── T3B.1: Planet.tsx ────────────────────────────────────────────────────────

describe('noElapsedRefs — Planet.tsx (T3B.1)', () => {
  const content = read('src/scenes/components/Planet.tsx');

  it('no contiene elapsedDays.current ni elapsedDays = useRef', () => {
    expect(/elapsedDays/.test(content)).toBe(false);
  });
});

// ── T3C.1: Saturn.tsx ────────────────────────────────────────────────────────

describe('noElapsedRefs — Saturn.tsx (T3C.1)', () => {
  const content = read('src/scenes/components/Saturn.tsx');

  it('no contiene elapsedDays.current ni elapsedDays = useRef', () => {
    expect(/elapsedDays/.test(content)).toBe(false);
  });
});

// ── T3D.1: PlanetMoon.tsx ────────────────────────────────────────────────────

describe('noElapsedRefs — PlanetMoon.tsx (T3D.1)', () => {
  const content = read('src/scenes/components/PlanetMoon.tsx');

  it('no contiene elapsed.current (acumulador local de tiempo orbital)', () => {
    // Buscamos el patrón de declaración del acumulador
    expect(/\belapsed\b.*=.*useRef/.test(content)).toBe(false);
  });
});

// ── T3E.1: Sun.tsx ───────────────────────────────────────────────────────────

describe('noElapsedRefs — Sun.tsx (T3E.1)', () => {
  const content = read('src/scenes/components/Sun.tsx');

  it('no contiene elapsedDays.current (rotación orbital migrada a JD)', () => {
    // Solo buscamos el acumulador de rotación orbital (elapsedDays).
    // El acumulador uTime (shader visual, usa real-dt) es PERMITIDO y no se toca.
    expect(/elapsedDays/.test(content)).toBe(false);
  });
});

// ── T4.3 structural: SolarSystemScene contiene PausedBridge ──────────────────

describe('noElapsedRefs — SolarSystemScene.tsx contiene PausedBridge (T4.3)', () => {
  const content = read('src/scenes/SolarSystemScene.tsx');

  it('importa PausedBridge', () => {
    expect(/PausedBridge/.test(content)).toBe(true);
  });

  it('renderiza <PausedBridge />', () => {
    expect(/<PausedBridge/.test(content)).toBe(true);
  });
});
