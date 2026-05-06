/**
 * 1.11 — TEST: useGpuCapability — detección de GPU y cache en sessionStorage.
 * Mock de sessionStorage, WEBGL_debug_renderer_info.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectGpuCapability } from '@/scenes/hooks/useGpuCapability';

// ---------------------------------------------------------------------------
// Helpers para mockear el contexto WebGL
// ---------------------------------------------------------------------------

function createWebGLMock(rendererString: string) {
  return {
    getExtension: (name: string) => {
      if (name === 'WEBGL_debug_renderer_info') {
        return { UNMASKED_RENDERER_WEBGL: 0x9246 };
      }
      return null;
    },
    getParameter: (_param: number) => rendererString,
  };
}

// ---------------------------------------------------------------------------
// Mock sessionStorage
// ---------------------------------------------------------------------------

let sessionStorageStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem: (key: string) => sessionStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    sessionStorageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete sessionStorageStore[key];
  },
  clear: () => {
    sessionStorageStore = {};
  },
};

beforeEach(() => {
  sessionStorageStore = {};
  vi.stubGlobal('sessionStorage', sessionStorageMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectGpuCapability — cache hit', () => {
  it('retorna el valor cacheado sin inicializar WebGL', async () => {
    sessionStorageMock.setItem('gpu_capability', 'high');

    // No necesitamos mock de document.createElement porque el cache ya existe
    const createElementSpy = vi.spyOn(document, 'createElement');
    const result = await detectGpuCapability();

    expect(result).toBe('high');
    expect(createElementSpy).not.toHaveBeenCalled();
  });
});

describe('detectGpuCapability — renderer string matching', () => {
  it('renderer "SwiftShader" → low', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () =>
        createWebGLMock('ANGLE (Google, Vulkan 1.1.0 (SwiftShader Device), SwiftShader)'),
    } as unknown as HTMLCanvasElement);

    const result = await detectGpuCapability();
    expect(result).toBe('low');
    expect(sessionStorageMock.getItem('gpu_capability')).toBe('low');
  });

  it('renderer "NVIDIA GeForce RTX 3080" → high', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => createWebGLMock('ANGLE (NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)'),
    } as unknown as HTMLCanvasElement);

    const result = await detectGpuCapability();
    expect(result).toBe('high');
    expect(sessionStorageMock.getItem('gpu_capability')).toBe('high');
  });

  it('renderer "Intel Iris Xe" → mid', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => createWebGLMock('ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, D3D11)'),
    } as unknown as HTMLCanvasElement);

    const result = await detectGpuCapability();
    expect(result).toBe('mid');
  });

  it('guarda el resultado en sessionStorage', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => createWebGLMock('NVIDIA GeForce GTX 1060'),
    } as unknown as HTMLCanvasElement);

    await detectGpuCapability();
    expect(['low', 'mid', 'high']).toContain(sessionStorageMock.getItem('gpu_capability'));
  });
});

describe('detectGpuCapability — sin extensión (fallback benchmark)', () => {
  it('sin WEBGL_debug_renderer_info y renderer vacío → ejecuta benchmark y retorna valor válido', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => ({
        getExtension: () => null,
        getParameter: () => '',
      }),
    } as unknown as HTMLCanvasElement);

    const result = await detectGpuCapability();
    expect(['low', 'mid', 'high']).toContain(result);
  });

  it('sin contexto WebGL → low', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => null,
    } as unknown as HTMLCanvasElement);

    const result = await detectGpuCapability();
    expect(result).toBe('low');
  });
});
