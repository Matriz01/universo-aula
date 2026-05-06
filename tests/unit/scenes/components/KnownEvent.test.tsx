/**
 * Tests del componente <KnownEvent>.
 *
 * Verifica que renderiza sin errores con los datos del Cometa Halley.
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { KnownEvent as KnownEventData } from '@/scenes/data/known-events.types';

// ---------------------------------------------------------------------------
// Mocks
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
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('three', async (importOriginal) => {
  type ThreeModule = Record<string, unknown>;
  const actual = await importOriginal<ThreeModule>();
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { KnownEvent } from '@/scenes/components/KnownEvent';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const halleyData: KnownEventData = {
  id: 'halley',
  name_key: 'events.halley.name',
  type: 'comet',
  orbital_params: {
    semi_major_axis_AU: 17.834,
    eccentricity: 0.967,
    inclination_deg: 162.26,
    longitude_ascending_node_deg: 58.42,
    argument_perihelion_deg: 111.33,
    mean_anomaly_J2000_deg: 38.38,
    orbital_period_days: 27520,
  },
  color_hex: '#cdeaff',
  next_perihelion: '2061-07-28',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<KnownEvent> — render básico', () => {
  it('monta sin errores con datos del Cometa Halley', () => {
    expect(() => {
      render(
        <div data-testid="canvas">
          <KnownEvent event={halleyData} />
        </div>,
      );
    }).not.toThrow();
  });

  it('monta con un evento de tipo comet sin errores', () => {
    const cometEvent: KnownEventData = { ...halleyData, id: 'test-comet' };
    expect(() => {
      render(
        <div data-testid="canvas">
          <KnownEvent event={cometEvent} />
        </div>,
      );
    }).not.toThrow();
  });
});
