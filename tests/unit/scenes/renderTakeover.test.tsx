/**
 * Regresión C1 — render takeover de R3F por useFrame con priority > 0.
 *
 * Contexto del bug: en @react-three/fiber, CUALQUIER suscripción useFrame con
 * priority > 0 incrementa `internal.priority`, y el loop solo llama a
 * `gl.render` cuando `internal.priority === 0`:
 *
 *   internal.priority = internal.priority + (priority > 0 ? 1 : 0)
 *   if (!state.internal.priority && state.gl.render) state.gl.render(scene, camera)
 *
 * Es decir: priority > 0 = "yo renderizo manualmente". El único renderizador
 * manual del proyecto es el EffectComposer de postprocessing (priority 1), que
 * SOLO se monta con gpu === 'high'. El commit 6f93ade puso el useFrame del
 * BodyMarker en priority 1 (para leer posRef tras los escritores, #44) → en
 * GPU mid/low, al entrar en modo local (donde se montan los BodyMarkers) el
 * canvas quedaba congelado: 0 draw calls.
 *
 * Invariante de prioridades por frame (este test lo protege a nivel de escena):
 *   SimulationTicker (-2) → OriginTracker (-1) → position writers (-0.5)
 *   → consumers/readers (0) → render/composer (1, SOLO quien renderiza).
 *
 * Estrategia: render de <SolarSystemScene> en modo local (Tierra y Luna) y
 * global con fiber mockeado capturando TODAS las priorities registradas.
 * Componentes pesados mockeados; markers, hooks de posición y trackers reales.
 */
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Captura de prioridades de TODOS los useFrame registrados
// ---------------------------------------------------------------------------

const { capturedPriorities } = vi.hoisted(() => ({
  capturedPriorities: [] as (number | undefined)[],
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: (_cb: unknown, priority?: number) => {
    capturedPriorities.push(priority);
  },
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Estado del store controlable desde tests
// ---------------------------------------------------------------------------

const { storeState } = vi.hoisted(() => ({
  storeState: {
    level: 'aprendiz' as const,
    selectedBody: null as string | null,
    viewMode: 'global',
    prefersReducedMotion: false,
    sunShaderVariant: 'full' as const,
    showKnownEvents: false,
    showOortCloud: false,
    simulationSpeed: 1,
    goToBody: vi.fn(),
  },
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

// ---------------------------------------------------------------------------
// Mocks de componentes pesados (no aportan al invariante; sus hooks de posición
// se cubren en sus propios tests: usePlanetPosition / useMoonPosition / Planet)
// ---------------------------------------------------------------------------

vi.mock('@/scenes/components/Sun', () => ({ Sun: () => null }));
vi.mock('@/scenes/components/Planet', () => ({ Planet: () => null }));
vi.mock('@/scenes/components/Saturn', () => ({ Saturn: () => null }));
vi.mock('@/scenes/components/AsteroidBelt', () => ({ AsteroidBelt: () => null }));
vi.mock('@/scenes/components/PlanetMoon', () => ({ PlanetMoon: () => null }));
vi.mock('@/scenes/components/CameraController', () => ({ CameraController: () => null }));
vi.mock('@/scenes/components/OrbitPath', () => ({ OrbitPath: () => null }));
vi.mock('@/scenes/components/KnownEventsLayer', () => ({ KnownEventsLayer: () => null }));
vi.mock('@/scenes/PausedBridge', () => ({ PausedBridge: () => null }));

// i18n: los markers usan useTranslation('solar') — t devuelve la clave/fallback
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bloom: () => null,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  PerformanceMonitor: () => null,
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

// GPU mid: NO se monta el EffectComposer → no hay renderizador manual.
// Exactamente el escenario donde el takeover congelaba el canvas.
vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => 'mid',
}));

// ---------------------------------------------------------------------------
// Dataset mínimo de planetas
// ---------------------------------------------------------------------------

const MOCK_PLANETS = [
  {
    id: 'earth',
    classification: 'terrestrial',
    radius_km: 6371,
    mass_kg: 5.97e24,
    density_g_cm3: 5.51,
    gravity_m_s2: 9.81,
    rotation_period_h: 23.93,
    axial_tilt_deg: 23.44,
    mean_temperature_k: 288,
    semi_major_axis_AU: 1.0,
    eccentricity: 0.017,
    inclination_deg: 0.0,
    longitude_ascending_node_deg: -11.26,
    argument_perihelion_deg: 114.21,
    mean_anomaly_J2000_deg: 358.62,
    orbital_period_days: 365.25,
    color_hex: '#4a90e2',
    has_rings: false,
    moons_count: 1,
    texture_base: '/t/earth/',
  },
  {
    id: 'mars',
    classification: 'terrestrial',
    radius_km: 3390,
    mass_kg: 6.42e23,
    density_g_cm3: 3.93,
    gravity_m_s2: 3.72,
    rotation_period_h: 24.62,
    axial_tilt_deg: 25.19,
    mean_temperature_k: 210,
    semi_major_axis_AU: 1.524,
    eccentricity: 0.093,
    inclination_deg: 1.85,
    longitude_ascending_node_deg: 49.56,
    argument_perihelion_deg: 286.5,
    mean_anomaly_J2000_deg: 19.41,
    orbital_period_days: 687,
    color_hex: '#c1440e',
    has_rings: false,
    moons_count: 2,
    texture_base: '/t/mars/',
  },
];

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({
    data: {
      version: '1.0',
      source: 'test',
      epoch_JD: 2451545.0,
      planets: MOCK_PLANETS,
      asteroid_belt: {
        inner_AU: 2.2,
        outer_AU: 3.2,
        count_high: 200,
        count_mid: 100,
        count_low: 50,
        vertical_dispersion: 0.3,
        size_min: 0.5,
        size_max: 2.0,
        color_hex: '#888',
      },
    },
    loading: false,
    error: null,
  }),
}));

import { SolarSystemScene } from '@/scenes/SolarSystemScene';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedPriorities.length = 0;
  storeState.selectedBody = null;
  storeState.viewMode = 'global';
});

describe('Regresión C1 — invariante de prioridades de useFrame (sin render takeover)', () => {
  it('modo local (Tierra, GPU mid): NINGÚN useFrame registra priority > 0', () => {
    storeState.selectedBody = 'earth';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    // Con gpu='mid' no hay EffectComposer: si cualquier suscripción usara
    // priority > 0, R3F dejaría de llamar gl.render → canvas congelado.
    const positives = capturedPriorities.filter((p) => (p ?? 0) > 0);
    expect(positives).toEqual([]);
  });

  it('modo local (Tierra): la banda de escritores -0.5 está poblada y el orden global se mantiene', () => {
    storeState.selectedBody = 'earth';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    // Ticker y OriginTracker conservan sus bandas
    expect(capturedPriorities).toContain(-2);
    expect(capturedPriorities).toContain(-1);

    // Escritores de posición en -0.5: usePlanetPosition (markers, MoonOrbitPath),
    // useMoonPosition (MoonMarker) y el escritor de sunPosRef (SunMarker).
    const writers = capturedPriorities.filter((p) => p === -0.5);
    expect(writers.length).toBeGreaterThanOrEqual(3);
  });

  it('modo local (Luna, GPU mid): NINGÚN useFrame registra priority > 0', () => {
    storeState.selectedBody = 'moon';
    storeState.viewMode = 'local';

    render(<SolarSystemScene />);

    const positives = capturedPriorities.filter((p) => (p ?? 0) > 0);
    expect(positives).toEqual([]);
    expect(capturedPriorities.filter((p) => p === -0.5).length).toBeGreaterThanOrEqual(3);
  });

  it('modo global (GPU mid): NINGÚN useFrame registra priority > 0', () => {
    render(<SolarSystemScene />);

    const positives = capturedPriorities.filter((p) => (p ?? 0) > 0);
    expect(positives).toEqual([]);
  });
});
