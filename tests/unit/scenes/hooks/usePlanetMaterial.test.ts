/**
 * Tests del hook usePlanetMaterial — swap toon/standard por nivel pedagógico.
 *
 * TDD Phase A.5 (TEST) → A.6 (IMPL)
 * Spec: REQ-TOON-2, REQ-DISP-1, REQ-DISP-2
 * Design: §1 usePlanetMaterial hook
 *
 * Estrategia:
 * - renderHook con refs simulados de Mesh
 * - Spy en prototipos de MeshToonMaterial y MeshStandardMaterial (post-import)
 * - Spy en dispose() para verificar higiene de VRAM
 * - Spy en releaseToonGradientTexture para verificar ref-count
 *
 * NOTA: Three.js NO se mockea a nivel módulo para evitar OOM.
 * Se espía sobre los prototipos con vi.spyOn después de la carga.
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect, type MockInstance } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted spies — necesario porque vi.mock se eleva al top del archivo
// ---------------------------------------------------------------------------

const { acquireSpy, releaseSpy } = vi.hoisted(() => ({
  acquireSpy: vi.fn(),
  releaseSpy: vi.fn(),
}));

vi.mock('@/scenes/data/toonGradient', () => ({
  acquireToonGradientTexture: acquireSpy,
  releaseToonGradientTexture: releaseSpy,
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(),
  extend: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/scenes/contexts/OriginOffsetContext', () => ({
  useOriginOffset: vi.fn(() => ({ current: { x: 0, y: 0, z: 0 } })),
  OriginOffsetContext: {},
  OriginOffsetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks — Three.js se carga normalmente
// ---------------------------------------------------------------------------

import { usePlanetMaterial } from '@/scenes/hooks/usePlanetMaterial';
import { MeshToonMaterial, MeshStandardMaterial } from 'three';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeshRef(initialMaterial: unknown = null) {
  return { current: { material: initialMaterial } };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

// Spies en prototipo — inicializados en beforeEach, restaurados en afterEach
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let disposeToonSpy: MockInstance<() => any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let disposeStandardSpy: MockInstance<() => any>;

beforeEach(() => {
  acquireSpy.mockClear();
  releaseSpy.mockClear();
  acquireSpy.mockReturnValue({ isTexture: true });

  // Espiar sobre el prototipo para capturar TODAS las instancias
  disposeToonSpy = vi.spyOn(MeshToonMaterial.prototype, 'dispose');
  disposeStandardSpy = vi.spyOn(MeshStandardMaterial.prototype, 'dispose');
});

afterEach(() => {
  disposeToonSpy.mockRestore();
  disposeStandardSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePlanetMaterial — asignación de material por nivel', () => {
  it('level=explorador → material asignado es MeshToonMaterial', () => {
    const meshRef = makeMeshRef();

    renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'explorador',
        colorHex: '#4a90e2',
        texture: null,
      }),
    );

    expect(meshRef.current?.material).toBeInstanceOf(MeshToonMaterial);
  });

  it('level=aprendiz → material asignado es MeshStandardMaterial', () => {
    const meshRef = makeMeshRef();

    renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'aprendiz',
        colorHex: '#4a90e2',
        texture: null,
      }),
    );

    expect(meshRef.current?.material).toBeInstanceOf(MeshStandardMaterial);
  });

  it('level=investigador → material asignado es MeshStandardMaterial', () => {
    const meshRef = makeMeshRef();

    renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'investigador',
        colorHex: '#4a90e2',
        texture: null,
      }),
    );

    expect(meshRef.current?.material).toBeInstanceOf(MeshStandardMaterial);
  });
});

describe('usePlanetMaterial — acquire gradient', () => {
  it('acquireToonGradientTexture llamado cuando level=explorador', () => {
    const meshRef = makeMeshRef();

    renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'explorador',
        colorHex: '#ff0000',
        texture: null,
      }),
    );

    expect(acquireSpy).toHaveBeenCalledTimes(1);
  });

  it('acquireToonGradientTexture NO llamado cuando level=aprendiz', () => {
    const meshRef = makeMeshRef();

    renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'aprendiz',
        colorHex: '#ff0000',
        texture: null,
      }),
    );

    expect(acquireSpy).not.toHaveBeenCalled();
  });
});

describe('usePlanetMaterial — dispose en swap', () => {
  it('Scenario dispose-on-swap explorador→aprendiz: dispose del toon llamado 1×', () => {
    const meshRef = makeMeshRef();
    type Level = 'explorador' | 'aprendiz' | 'investigador';

    const { rerender } = renderHook(
      ({ level }: { level: Level }) =>
        usePlanetMaterial({
          meshRef: meshRef as never,
          level,
          colorHex: '#4a90e2',
          texture: null,
        }),
      { initialProps: { level: 'explorador' as Level } },
    );

    disposeToonSpy.mockClear();

    act(() => {
      rerender({ level: 'aprendiz' });
    });

    expect(disposeToonSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario gradient-release: explorador→aprendiz → release llamado 1×', () => {
    const meshRef = makeMeshRef();
    type Level = 'explorador' | 'aprendiz' | 'investigador';

    const { rerender } = renderHook(
      ({ level }: { level: Level }) =>
        usePlanetMaterial({
          meshRef: meshRef as never,
          level,
          colorHex: '#4a90e2',
          texture: null,
        }),
      { initialProps: { level: 'explorador' as Level } },
    );

    releaseSpy.mockClear();

    act(() => {
      rerender({ level: 'aprendiz' });
    });

    expect(releaseSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario dispose-standard-on-swap aprendiz→explorador: dispose standard llamado 1×', () => {
    const meshRef = makeMeshRef();
    type Level = 'explorador' | 'aprendiz' | 'investigador';

    const { rerender } = renderHook(
      ({ level }: { level: Level }) =>
        usePlanetMaterial({
          meshRef: meshRef as never,
          level,
          colorHex: '#4a90e2',
          texture: null,
        }),
      { initialProps: { level: 'aprendiz' as Level } },
    );

    disposeStandardSpy.mockClear();

    act(() => {
      rerender({ level: 'explorador' });
    });

    expect(disposeStandardSpy).toHaveBeenCalledTimes(1);
  });
});

describe('usePlanetMaterial — cleanup en unmount', () => {
  it('Scenario dispose-on-unmount explorador: dispose + release al desmontar', () => {
    const meshRef = makeMeshRef();

    const { unmount } = renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'explorador',
        colorHex: '#4a90e2',
        texture: null,
      }),
    );

    disposeToonSpy.mockClear();
    releaseSpy.mockClear();

    act(() => {
      unmount();
    });

    expect(disposeToonSpy).toHaveBeenCalledTimes(1);
    expect(releaseSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario dispose-on-unmount aprendiz: dispose standard al desmontar', () => {
    const meshRef = makeMeshRef();

    const { unmount } = renderHook(() =>
      usePlanetMaterial({
        meshRef: meshRef as never,
        level: 'aprendiz',
        colorHex: '#4a90e2',
        texture: null,
      }),
    );

    disposeStandardSpy.mockClear();

    act(() => {
      unmount();
    });

    expect(disposeStandardSpy).toHaveBeenCalledTimes(1);
  });
});

describe('usePlanetMaterial — null guard', () => {
  it('no lanza si meshRef.current es null', () => {
    const meshRef = { current: null };

    expect(() => {
      renderHook(() =>
        usePlanetMaterial({
          meshRef: meshRef as never,
          level: 'explorador',
          colorHex: '#4a90e2',
          texture: null,
        }),
      );
    }).not.toThrow();
  });
});
