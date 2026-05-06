/**
 * Tests de useFocusCamera
 *
 * Estrategia: mock de @react-three/fiber y @react-spring/three.
 * Verificamos que api.start se invoca con los parámetros correctos
 * según el target y prefersReducedMotion.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Mocks — hoisted para que los spies estén disponibles en vi.mock
// ---------------------------------------------------------------------------

const { mockApiStart, mockUseSpring, capturedConfigs } = vi.hoisted(() => {
  const start = vi.fn();
  const stop = vi.fn();
  const configs: unknown[] = [];

  const useSpringMock = vi.fn((fn: () => unknown) => {
    const result = fn();
    configs.push(result);
    return [null, { start, stop }];
  });

  return {
    mockApiStart: start,
    _mockApiStop: stop,
    mockUseSpring: useSpringMock,
    capturedConfigs: configs,
  };
});

vi.mock('@react-spring/three', () => ({
  useSpring: mockUseSpring,
}));

const mockCamera = {
  position: {
    toArray: () => [0, 35, 70] as [number, number, number],
    fromArray: vi.fn(),
  },
};

vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn(() => ({ camera: mockCamera })),
  useFrame: vi.fn(),
  Canvas: ({ children }: { children: unknown }) => children,
  extend: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  capturedConfigs.length = 0;
});

describe('useFocusCamera', () => {
  it('devuelve una ref (controlsRef)', () => {
    const { result } = renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('current');
  });

  it('cuando target=null, llama api.start con pos=[0,35,70] y look=[0,0,0]', () => {
    renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    expect(mockApiStart).toHaveBeenCalledWith(
      expect.objectContaining({
        pos: [0, 35, 70],
        look: [0, 0, 0],
      }),
    );
  });

  it('cuando target=Vector3, llama api.start con pos = target+offset y look = target', () => {
    const target = new Vector3(10, 0, 5);
    const offset = new Vector3(0, 2, 6);
    const expectedLook = target.toArray();
    const expectedPos = target.clone().add(offset).toArray();

    renderHook(() => useFocusCamera({ target, offset, reducedMotion: false }));

    expect(mockApiStart).toHaveBeenCalledWith(
      expect.objectContaining({
        pos: expectedPos,
        look: expectedLook,
      }),
    );
  });

  it('cuando reducedMotion=true, la duración del config es 300ms', () => {
    renderHook(() => useFocusCamera({ target: null, reducedMotion: true }));
    expect(capturedConfigs.length).toBeGreaterThan(0);
    const config = (capturedConfigs[0] as { config?: { duration?: number } })?.config;
    expect(config?.duration).toBe(300);
  });

  it('cuando reducedMotion=false, la duración del config es 1200ms', () => {
    renderHook(() => useFocusCamera({ target: null, reducedMotion: false }));
    expect(capturedConfigs.length).toBeGreaterThan(0);
    const config = (capturedConfigs[0] as { config?: { duration?: number } })?.config;
    expect(config?.duration).toBe(1200);
  });
});
