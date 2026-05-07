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
  it('no contiene simulationTime en el store', () => {
    expect(/simulationTime/i.test(content)).toBe(false);
  });

  it('no contiene acumuladores elapsed en el store', () => {
    expect(/\belapsed\b/i.test(content)).toBe(false);
  });

  // Esta aserción se habilita en T6.1 cuando se añade el JSDoc.
  // Por ahora existe como documentación del requisito futuro.
  it.todo('contiene el comentario JSDoc de invariante de frame-rate (habilitado en T6.1)');
});
