/**
 * Tests del comportamiento Oort-cloud-aware del CameraController.
 *
 * Cuando showOortCloud=true en modo global, el maxDistance del control de
 * cámara crece para permitir al usuario hacer zoom out manualmente hasta
 * atravesar la esfera de la nube de Oort (outer edge ~198u en visualDistance).
 *
 * Decisión: NO mover la cámara automáticamente al activar el toggle (rechaza
 * ADR-009). En su lugar, ampliar el rango de zoom para que el usuario
 * descubra la nube por exploración.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// State + capture, hoisted antes de los mocks
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
// Mocks (orden: fiber/drei + hooks + store antes del SUT)
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
// SUT — import después de los mocks
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

describe('<CameraController> — maxDistance dinámico según showOortCloud', () => {
  // ── happy path ────────────────────────────────────────────────────────────
  describe('happy path', () => {
    it('por defecto (showOortCloud=false), maxDistance=200 en modo global', () => {
      mockState.showOortCloud = false;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps).toHaveLength(1);
      expect(capturedCameraControlsProps[0].maxDistance).toBe(200);
    });

    it('con showOortCloud=true, maxDistance crece para permitir salir de la nube', () => {
      mockState.showOortCloud = true;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps).toHaveLength(1);
      expect(capturedCameraControlsProps[0].maxDistance).toBe(400);
    });

    it('minDistance se mantiene en 2 independientemente de showOortCloud', () => {
      mockState.showOortCloud = true;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps[0].minDistance).toBe(2);
    });
  });

  // ── boundary / invariante de escala ──────────────────────────────────────
  describe('boundary — alcance de zoom respecto al outer edge de Oort', () => {
    it('maxDistance con Oort activo supera 1.5× el outer edge (~198u) — visión clara desde fuera', () => {
      // El outer edge de la nube de Oort en visualDistance global es ~198u
      // (visualDistance(100000 AU)). Para que el alumno pueda hacer zoom out
      // hasta verse FUERA de la nube con margen, exigimos >=1.5× ese valor.
      mockState.showOortCloud = true;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const max = capturedCameraControlsProps[0].maxDistance as number;
      expect(max).toBeGreaterThanOrEqual(198 * 1.5);
    });

    it('maxDistance sin Oort se mantiene compacto (<=250u) para no perder al usuario en vacío', () => {
      mockState.showOortCloud = false;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const max = capturedCameraControlsProps[0].maxDistance as number;
      expect(max).toBeLessThanOrEqual(250);
    });
  });

  // ── error / paths inválidos ──────────────────────────────────────────────
  describe('error path', () => {
    it('en modo local, no se monta GlobalCameraControls (no captura props)', () => {
      mockState.viewMode = 'local';
      mockState.showOortCloud = true; // irrelevante en local
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps).toHaveLength(0);
    });
  });

  // ── determinismo ─────────────────────────────────────────────────────────
  describe('determinismo — mismo showOortCloud → mismo maxDistance', () => {
    it('dos renders independientes con showOortCloud=true devuelven el mismo maxDistance', () => {
      mockState.showOortCloud = true;

      const { unmount } = render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const first = capturedCameraControlsProps[0].maxDistance;
      unmount();
      capturedCameraControlsProps.length = 0;

      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      const second = capturedCameraControlsProps[0].maxDistance;

      expect(first).toBe(second);
      expect(first).toBe(400);
    });

    it('alternar showOortCloud entre dos renders refleja el nuevo maxDistance', () => {
      mockState.showOortCloud = false;
      const { unmount } = render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps[0].maxDistance).toBe(200);
      unmount();
      capturedCameraControlsProps.length = 0;

      mockState.showOortCloud = true;
      render(
        <div data-testid="canvas">
          <CameraController />
        </div>,
      );
      expect(capturedCameraControlsProps[0].maxDistance).toBe(400);
    });
  });
});
