/**
 * Tests de toonGradient.ts — DataTexture singleton ref-counted.
 *
 * TDD Phase A.1 (TEST) → A.2 (IMPL)
 * Spec: REQ-TOON-1, REQ-DISP-2
 * Design: Design §1 toonGradient.ts module
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NearestFilter, RedFormat } from 'three';

// ---------------------------------------------------------------------------
// Mock Three.js DataTexture — necesitamos controlar dispose()
// ---------------------------------------------------------------------------

const disposeSpy = vi.fn();

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();

  class MockDataTexture {
    image: { width: number; height: number; data: Uint8Array };
    format: number;
    minFilter: number;
    magFilter: number;
    needsUpdate = false;
    dispose = disposeSpy;

    constructor(data: Uint8Array, width: number, height: number, format: number) {
      this.image = { width, height, data };
      this.format = format;
      // Por defecto Three.js usa LinearFilter — el impl debe sobreescribirlos
      this.minFilter = 1006; // THREE.LinearFilter (valor real)
      this.magFilter = 1006;
    }
  }

  return {
    ...actual,
    DataTexture: MockDataTexture,
  };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks — resetear módulo entre tests para limpiar singleton
// ---------------------------------------------------------------------------

describe('toonGradient — createToonGradientTexture', () => {
  beforeEach(() => {
    vi.resetModules();
    disposeSpy.mockClear();
  });

  it('Scenario gradient-singleton: dos llamadas devuelven la misma instancia', async () => {
    const { createToonGradientTexture } = await import('@/scenes/data/toonGradient');
    const t1 = createToonGradientTexture();
    const t2 = createToonGradientTexture();
    expect(t1).toBe(t2);
  });

  it('Scenario gradient-formato: width=4, height=1, format=RedFormat, magFilter=NearestFilter, minFilter=NearestFilter', async () => {
    const { createToonGradientTexture } = await import('@/scenes/data/toonGradient');
    const tex = createToonGradientTexture();
    expect(tex.image.width).toBe(4);
    expect(tex.image.height).toBe(1);
    expect(tex.format).toBe(RedFormat);
    expect(tex.minFilter).toBe(NearestFilter);
    expect(tex.magFilter).toBe(NearestFilter);
  });

  it('Scenario gradient-data: datos son [0, 64, 128, 255]', async () => {
    const { createToonGradientTexture } = await import('@/scenes/data/toonGradient');
    const tex = createToonGradientTexture();
    // tex.image.data es Uint8Array según nuestro MockDataTexture
    const data = tex.image.data as Uint8Array;
    expect(Array.from(data)).toEqual([0, 64, 128, 255]);
  });

  it('Scenario gradient-needsUpdate: needsUpdate = true', async () => {
    const { createToonGradientTexture } = await import('@/scenes/data/toonGradient');
    const tex = createToonGradientTexture();
    expect(tex.needsUpdate).toBe(true);
  });
});

describe('toonGradient — acquireToonGradientTexture / releaseToonGradientTexture', () => {
  beforeEach(() => {
    vi.resetModules();
    disposeSpy.mockClear();
  });

  it('Scenario acquire-singleton: acquire × 2 devuelve la misma instancia', async () => {
    const { acquireToonGradientTexture } = await import('@/scenes/data/toonGradient');
    const t1 = acquireToonGradientTexture();
    const t2 = acquireToonGradientTexture();
    expect(t1).toBe(t2);
  });

  it('Scenario refCount-alive: acquire + acquire + release → textura NO dispuesta', async () => {
    const { acquireToonGradientTexture, releaseToonGradientTexture } =
      await import('@/scenes/data/toonGradient');
    acquireToonGradientTexture(); // refCount = 1
    acquireToonGradientTexture(); // refCount = 2
    releaseToonGradientTexture(); // refCount = 1 → NO dispose
    expect(disposeSpy).not.toHaveBeenCalled();
  });

  it('Scenario refCount-dispose: acquire × 2 + release × 2 → dispose llamado, instancia reseteada', async () => {
    const { acquireToonGradientTexture, releaseToonGradientTexture } =
      await import('@/scenes/data/toonGradient');
    acquireToonGradientTexture(); // refCount = 1
    acquireToonGradientTexture(); // refCount = 2
    releaseToonGradientTexture(); // refCount = 1
    releaseToonGradientTexture(); // refCount = 0 → dispose + instance = null
    expect(disposeSpy).toHaveBeenCalledTimes(1);

    // Tras dispose, un nuevo acquire debe crear una instancia NUEVA
    const newTex = acquireToonGradientTexture();
    // La nueva instancia no debe ser la disposed (dispose fue llamado en la anterior)
    // Verificamos que se puede adquirir sin error
    expect(newTex).toBeDefined();
    expect(newTex.image.width).toBe(4);
  });

  it('Scenario refCount-no-negative: release sin acquire previo no lanza ni produce refCount negativo', async () => {
    const { acquireToonGradientTexture, releaseToonGradientTexture } =
      await import('@/scenes/data/toonGradient');
    // Release en estado inicial (refCount = 0) no debe lanzar
    expect(() => releaseToonGradientTexture()).not.toThrow();

    // Tras eso, acquire debe funcionar normalmente
    const tex = acquireToonGradientTexture();
    expect(tex).toBeDefined();
  });
});

describe('toonGradient — disposeToonGradientTexture', () => {
  beforeEach(() => {
    vi.resetModules();
    disposeSpy.mockClear();
  });

  afterEach(() => {
    disposeSpy.mockClear();
  });

  it('dispone la textura si existe instancia', async () => {
    const { acquireToonGradientTexture, disposeToonGradientTexture } =
      await import('@/scenes/data/toonGradient');
    acquireToonGradientTexture();
    disposeToonGradientTexture();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('no lanza si no hay instancia creada', async () => {
    const { disposeToonGradientTexture } = await import('@/scenes/data/toonGradient');
    expect(() => disposeToonGradientTexture()).not.toThrow();
  });
});
