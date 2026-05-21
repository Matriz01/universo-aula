/**
 * Tests del rango de zoom del CameraController en modo global.
 *
 * Motivación: la nube de Oort cae ~198u (outer edge) en visualDistance global.
 * El usuario debe poder alejarse lo suficiente para verla "desde fuera", esté
 * o no la capa visible. Pedagógicamente, exploración cósmica libre.
 *
 * Decisión: NO condicionar maxDistance al toggle de la nube. Un único rango
 * 2u..1000u en modo global, ~5× el outer edge de la Oort. Cámara far=1_000_000.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// State + capture (hoisted, antes de los mocks)
// ---------------------------------------------------------------------------

const { capturedCameraControlsProps, mockState } = vi.hoisted(() => {
  const mockState = {
    selectedPlanet: null as string | null,
    prefersReducedMotion: false,
    cameraMode: 'overview' as const,
    viewMode: 'global' as 'global' | 'local',
    showOortCloud: false,
    cameraHomeRequested: 0,
  };
  const capturedCameraControlsProps: Record<string, unknown>[] = [];
  return { capturedCameraControlsProps, mockState };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { set: vi.fn(), toArray: () => [0, 35, 70], add: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
  })),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  CameraControls: (props: Record<string, unknown>) => {
    capturedCameraControlsProps.push(props);
    return <div data-testid="camera-controls" />;
  },
}));

vi.mock('@/scenes/hooks/useFocusCamera', () => ({
  useFocusCamera: vi.fn(() => ({ current: null })),
}));

vi.mock('@/scenes/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof mockState) => unknown) =>
    selector ? selector(mockState) : mockState,
}));

// ---------------------------------------------------------------------------
// SUT — después de los mocks
// ---------------------------------------------------------------------------

import { CameraController } from '@/scenes/components/CameraController';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedCameraControlsProps.length = 0;
  mockState.viewMode = 'global';
  mockState.showOortCloud = false;
  mockState.cameraHomeRequested = 0;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<CameraController> — rango de zoom en modo global', () => {
  // ── happy path ────────────────────────────────────────────────────────────
  describe('happy path', () => {
    it('en modo global, maxDistance=1000 (suficiente para verlo todo)', () => {
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps).toHaveLength(1);
      expect(capturedCameraControlsProps[0].maxDistance).toBe(1000);
    });

    it('en modo global, minDistance=2', () => {
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps[0].minDistance).toBe(2);
    });

    it('maxDistance NO depende del toggle de la nube de Oort', () => {
      // Render con Oort apagada
      mockState.showOortCloud = false;
      const { unmount } = render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const withoutOort = capturedCameraControlsProps[0].maxDistance;
      unmount();
      capturedCameraControlsProps.length = 0;

      // Render con Oort encendida
      mockState.showOortCloud = true;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const withOort = capturedCameraControlsProps[0].maxDistance;

      expect(withOort).toBe(withoutOort);
      expect(withOort).toBe(1000);
    });
  });

  // ── boundary / invariante de escala ──────────────────────────────────────
  describe('boundary — alcance respecto al outer edge de Oort', () => {
    it('maxDistance supera 5× el outer edge (~198u) — sistema solar como un punto', () => {
      // visualDistance(100 000 AU) ≈ 198u. 5× para verlo claramente.
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const max = capturedCameraControlsProps[0].maxDistance as number;
      expect(max).toBeGreaterThanOrEqual(198 * 5);
    });

    it('maxDistance se mantiene por debajo del far plane (1_000_000)', () => {
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const max = capturedCameraControlsProps[0].maxDistance as number;
      expect(max).toBeLessThan(1_000_000);
    });
  });

  // ── error / paths inválidos ──────────────────────────────────────────────
  describe('error path', () => {
    it('en modo local, no se monta GlobalCameraControls (no captura props)', () => {
      mockState.viewMode = 'local';
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps).toHaveLength(0);
    });
  });

  // ── determinismo ─────────────────────────────────────────────────────────
  describe('determinismo', () => {
    it('dos renders independientes en modo global devuelven el mismo rango', () => {
      const { unmount } = render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const firstMax = capturedCameraControlsProps[0].maxDistance;
      const firstMin = capturedCameraControlsProps[0].minDistance;
      unmount();
      capturedCameraControlsProps.length = 0;

      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps[0].maxDistance).toBe(firstMax);
      expect(capturedCameraControlsProps[0].minDistance).toBe(firstMin);
    });
  });
});
