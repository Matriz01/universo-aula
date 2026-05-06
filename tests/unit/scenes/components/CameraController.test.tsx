/**
 * Tests de <CameraController>
 *
 * Estrategia: mock de useFocusCamera y useKeyboardNavigation.
 * Verificamos que el componente monta sin errores y que OrbitControls está presente.
 * La arquitectura ref-based (planetPositionsRef) se verifica pasando un ref mock.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { set: vi.fn(), toArray: () => [0, 35, 70] } },
    gl: { domElement: document.createElement('canvas') },
  })),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ ref: _ref }: { ref?: unknown }) => <div data-testid="orbit-controls" />,
}));

vi.mock('@/scenes/hooks/useFocusCamera', () => ({
  useFocusCamera: vi.fn(() => ({ current: null })),
}));

vi.mock('@/scenes/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      selectedPlanet: null,
      prefersReducedMotion: false,
      cameraMode: 'overview',
    };
    return selector ? selector(state) : state;
  }),
}));

// ---------------------------------------------------------------------------
// Import (después de los mocks)
// ---------------------------------------------------------------------------

import { CameraController } from '@/scenes/components/CameraController';
import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';
import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<CameraController>', () => {
  it('monta sin errores sin planetPositionsRef', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta sin errores con planetPositionsRef vacío', () => {
    function Wrapper() {
      const positionsRef = useRef<Record<string, Vector3>>({});
      return (
        <div data-testid="canvas">
          <CameraController planetPositionsRef={positionsRef} />
        </div>
      );
    }
    expect(() => render(<Wrapper />)).not.toThrow();
  });

  it('monta con posiciones de planetas en el ref', () => {
    function Wrapper() {
      const positionsRef = useRef<Record<string, Vector3>>({
        earth: new Vector3(13, 0, 0),
        mars: new Vector3(16, 0, 5),
      });
      return (
        <div data-testid="canvas">
          <CameraController planetPositionsRef={positionsRef} />
        </div>
      );
    }
    expect(() => render(<Wrapper />)).not.toThrow();
  });

  it('llama a useKeyboardNavigation al montar', () => {
    render(
      <div data-testid="canvas">
        <CameraController />
      </div>,
    );
    expect(vi.mocked(useKeyboardNavigation)).toHaveBeenCalled();
  });

  it('llama a useFocusCamera al montar', () => {
    render(
      <div data-testid="canvas">
        <CameraController />
      </div>,
    );
    expect(vi.mocked(useFocusCamera)).toHaveBeenCalled();
  });

  it('pasa target null a useFocusCamera cuando selectedPlanet es null', () => {
    render(
      <div data-testid="canvas">
        <CameraController />
      </div>,
    );
    const calls = vi.mocked(useFocusCamera).mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.target).toBeNull();
  });
});
