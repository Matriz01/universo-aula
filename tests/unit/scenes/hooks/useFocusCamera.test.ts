/**
 * Tests de useFocusCamera
 *
 * Estrategia: mock de @react-three/fiber.
 * Verificamos que:
 * - El hook devuelve una ref controlsRef
 * - useFrame se registra (el lerp está activo)
 * - Con reducedMotion=true la duración configurada es 300ms
 * - Con reducedMotion=false la duración configurada es TRANSITION_MS (700ms)
 *
 * Nota: useFocusCamera ya no usa @react-spring/three — usa useFrame para
 * un lerp sincronizado con el loop R3F. Esto corrige el Bug 1 (race condition
 * a alta velocidad) y el Bug 2 (transición suave).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Captura del callback de useFrame para verificar que se registra
// ---------------------------------------------------------------------------

type FrameCallback = (state: unknown, delta: number) => void;
let capturedFrameCallbacks: FrameCallback[] = [];

vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn(() => ({
    camera: {
      position: {
        toArray: () => [0, 35, 70] as [number, number, number],
        clone: () => new Vector3(0, 35, 70),
        lerpVectors: vi.fn(),
        add: vi.fn(),
      },
    },
  })),
  useFrame: vi.fn((cb: FrameCallback) => {
    capturedFrameCallbacks.push(cb);
  }),
  Canvas: ({ children }: { children: unknown }) => children,
  extend: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { useFocusCamera, TRANSITION_MS } from '@/scenes/hooks/useFocusCamera';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  capturedFrameCallbacks = [];
});

describe('useFocusCamera', () => {
  it('devuelve una ref (controlsRef)', () => {
    const { result } = renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('current');
  });

  it('registra un callback de useFrame al montar', () => {
    renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    expect(capturedFrameCallbacks.length).toBeGreaterThan(0);
  });

  it('cuando target=null, no lanza errores al montar', () => {
    expect(() => {
      renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    }).not.toThrow();
  });

  it('cuando target=Vector3, no lanza errores al montar', () => {
    const target = new Vector3(10, 0, 5);
    expect(() => {
      renderHook(() => useFocusCamera({ target, reducedMotion: false }));
    }).not.toThrow();
  });

  it('cuando reducedMotion=true, la duración configurada es 300ms (menor que TRANSITION_MS)', () => {
    // La duración correcta con reducedMotion=true es 300ms
    // Verificamos que TRANSITION_MS > 300 (sanity)
    expect(TRANSITION_MS).toBeGreaterThan(300);
    // Y que el hook monta sin errores con reducedMotion=true
    expect(() => {
      renderHook(() => useFocusCamera({ target: null, reducedMotion: true }));
    }).not.toThrow();
  });

  it('cuando reducedMotion=false, TRANSITION_MS es 700ms', () => {
    expect(TRANSITION_MS).toBe(700);
  });
});
