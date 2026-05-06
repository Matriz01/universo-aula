/**
 * Tests del componente <PlanetMoon> — Luna orbitando la Tierra.
 *
 * Tasks de Phase 4 (TEST) → 4.8 (IMPL)
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { useTextureSpy } = vi.hoisted(() => {
  return { useTextureSpy: vi.fn().mockReturnValue({}) };
});

// ---------------------------------------------------------------------------
// Mocks de R3F y Drei
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  useTexture: useTextureSpy,
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="moon-label">{children}</div>
  ),
}));

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import DESPUÉS de mocks
// ---------------------------------------------------------------------------

import { PlanetMoon } from '@/scenes/components/PlanetMoon';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<PlanetMoon> — render básico', () => {
  it('monta sin errores sin props (posición por defecto)', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con earthPosition prop sin errores', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <PlanetMoon earthPosition={[5, 0, 0]} />
        </div>,
      );
    }).not.toThrow();
  });

  it('llama a useTexture con ruta que incluye moon', () => {
    render(
      <div data-testid="canvas">
        <PlanetMoon />
      </div>,
    );
    expect(useTextureSpy).toHaveBeenCalled();
    const callArg = useTextureSpy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain('moon');
  });
});
