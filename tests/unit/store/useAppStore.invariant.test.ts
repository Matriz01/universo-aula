/**
 * Tests de guardia de invariante arquitectónica — useAppStore (REQ-DOC-1)
 *
 * Verifica que useAppStore.ts NO contiene campos prohibidos (simulationTime,
 * elapsed) que romperían el invariante de no poner estado a 60Hz en Zustand.
 *
 * Este test actúa como regresión: fallará si alguien vuelve a añadir
 * simulationTime al store (reproduciendo la regresión de Refactor C).
 *
 * También verifica que el JSDoc de invariante existe (añadido en T6.1).
 * En T1.5 la aserción del JSDoc está comentada; se habilita en T6.1.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

// Resolver ruta portable: tests corren desde la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const storePath = resolve(__dirname, '../../../src/store/useAppStore.ts');

const content = readFileSync(storePath, 'utf8');

describe('useAppStore — invariante arquitectónica (REQ-DOC-1)', () => {
  it('no contiene simulationTime como campo del store (solo en comentarios)', () => {
    // Patrones prohibidos: simulationTime?: ..., simulationTime: ..., simulationTime =
    // El JSDoc usa "simulationTime" para documentar qué NO hacer — eso es correcto.
    const forbiddenFieldPattern = /^\s+simulationTime\s*[?:]|setSimulationTime\s*[?:]/m;
    expect(forbiddenFieldPattern.test(content)).toBe(false);
  });

  it('no contiene acumuladores elapsed como campo del store (solo en comentarios)', () => {
    // Busca "elapsed" como campo TypeScript (fuera de comentarios y strings)
    // Patrones prohibidos: elapsed?: ..., elapsed: ..., elapsed =
    // El JSDoc usa "elapsed" para documentar qué NO hacer — eso es correcto.
    const forbiddenFieldPattern = /^\s+elapsed\s*[?:]|elapsed\s*=\s*useRef/m;
    expect(forbiddenFieldPattern.test(content)).toBe(false);
  });

  // T6.1: JSDoc invariant añadido a useAppStore. Aserción habilitada.
  it('contiene el comentario JSDoc de invariante de frame-rate', () => {
    // El JSDoc debe contener al menos una de las palabras clave del invariante
    const hasInvariant =
      /frame-rate/i.test(content) || /60Hz/i.test(content) || /FRAME-RATE/i.test(content);
    expect(hasInvariant).toBe(true);
  });

  it('el JSDoc menciona simulationClock como solución correcta', () => {
    expect(/simulationClock/i.test(content)).toBe(true);
  });
});
