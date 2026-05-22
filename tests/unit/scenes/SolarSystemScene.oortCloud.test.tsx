/**
 * Integration tests — OortCloudLayer wiring in SolarSystemScene (Phase F).
 *
 * REQ-LAZY-1/2: OortCloudLayer is lazy-imported and rendered conditionally.
 * REQ-LEVEL-1: Layer NOT mounted when showOortCloud=false (default).
 * REQ-LEVEL-2: Layer mounted when showOortCloud=true AND viewMode=global.
 *
 * Strategy: mock the OortCloudLayer module directly (the lazy import resolves
 * to this path). Track render calls via a hoisted counter.
 * Mock all other heavy children to avoid R3F Canvas complexity.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted state — must precede all vi.mock() calls
// ---------------------------------------------------------------------------

const { renderCount, storeState } = vi.hoisted(() => {
  const renderCount = { value: 0 };
  const storeState = { showOortCloud: false, viewMode: 'global' as 'global' | 'local' };
  return { renderCount, storeState };
});

// ---------------------------------------------------------------------------
// Mock the OortCloudLayer module (resolved by the React.lazy dynamic import)
// ---------------------------------------------------------------------------

vi.mock('@/scenes/layers/oort-cloud/OortCloudLayer', () => ({
  default: function MockOortCloudLayer() {
    renderCount.value++;
    return null;
  },
}));

// ---------------------------------------------------------------------------
// Mock useAppStore
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      level: 'aprendiz',
      prefersReducedMotion: false,
      sunShaderVariant: 'procedural',
      goToBody: vi.fn(),
      viewMode: storeState.viewMode,
      selectedBody: null,
      showKnownEvents: false,
      showOortCloud: storeState.showOortCloud,
      setShowOortCloud: vi.fn(),
      legacyFlag: false,
      showRotationAxes: false,
      toggleRotationAxes: vi.fn(),
    }),
  useViewMode: () => storeState.viewMode,
  useShowKnownEvents: () => false,
  useSelectedBody: () => null,
  useShowOortCloud: () => storeState.showOortCloud,
}));

// ---------------------------------------------------------------------------
// Mock all heavy scene children
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({
    data: {
      version: '1.0',
      source: 'test',
      epoch_JD: 2451545.0,
      planets: [],
      asteroid_belt: { inner_radius_AU: 2.2, outer_radius_AU: 3.2, count: 100, seed: 42 },
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('@/scenes/hooks/useGpuCapability', () => ({ useGpuCapability: () => 'mid' }));
vi.mock('@/scenes/components/Sun', () => ({ Sun: () => null }));
vi.mock('@/scenes/components/Planet', () => ({ Planet: () => null }));
vi.mock('@/scenes/components/Saturn', () => ({ Saturn: () => null }));
vi.mock('@/scenes/components/AsteroidBelt', () => ({ AsteroidBelt: () => null }));
vi.mock('@/scenes/components/PlanetMoon', () => ({ PlanetMoon: () => null }));
vi.mock('@/scenes/components/CameraController', () => ({ CameraController: () => null }));
vi.mock('@/scenes/components/OrbitPath', () => ({ OrbitPath: () => null }));
vi.mock('@/scenes/components/BodyMarker', () => ({ BodyMarker: () => null }));
vi.mock('@/scenes/components/KnownEventsLayer', () => ({ KnownEventsLayer: () => null }));
vi.mock('@/scenes/SimulationTicker', () => ({ SimulationTicker: () => null }));
vi.mock('@/scenes/PausedBridge', () => ({ PausedBridge: () => null }));
vi.mock('@/scenes/contexts/OriginOffsetContext', () => ({
  OriginOffsetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useOriginOffset: () => ({ current: { set: vi.fn(), copy: vi.fn() } }),
}));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({ camera: {}, gl: { domElement: document.createElement('canvas') }, scene: {} }),
}));
vi.mock('@react-three/drei', () => ({
  Stars: () => null,
  PerformanceMonitor: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Line: () => null,
}));
vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Bloom: () => null,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { SolarSystemScene } from '@/scenes/SolarSystemScene';

describe('SolarSystemScene — OortCloudLayer wiring (Phase F)', () => {
  beforeEach(() => {
    renderCount.value = 0;
  });

  it('does NOT mount OortCloudLayer when showOortCloud=false (default)', async () => {
    storeState.showOortCloud = false;
    storeState.viewMode = 'global';
    render(
      <React.Suspense fallback={null}>
        <SolarSystemScene />
      </React.Suspense>,
    );
    // Flush any pending lazy resolutions
    await new Promise((r) => setTimeout(r, 50));
    expect(renderCount.value).toBe(0);
  });

  it('mounts OortCloudLayer when showOortCloud=true and viewMode=global', async () => {
    storeState.showOortCloud = true;
    storeState.viewMode = 'global';
    render(
      <React.Suspense fallback={null}>
        <SolarSystemScene />
      </React.Suspense>,
    );
    // Flush pending lazy chunk resolution
    await new Promise((r) => setTimeout(r, 50));
    expect(renderCount.value).toBeGreaterThanOrEqual(1);
  });
});
