/**
 * Tests del hook usePlanetsData — fetch y cache de planets.json.
 *
 * Estrategia: mock de fetch global. Verificamos que el hook
 * retorna el dataset parseado correctamente.
 *
 * Tasks de Phase 4 — usePlanetsData hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlanetsData, _resetPlanetsDataCache } from '@/scenes/hooks/usePlanetsData';

// ---------------------------------------------------------------------------
// Fixture de respuesta mock
// ---------------------------------------------------------------------------

const mockDataset = {
  version: '1.0.0',
  source: 'NASA JPL Horizons J2000 + NASA Planetary Fact Sheets (2024)',
  epoch_JD: 2451545.0,
  planets: [
    {
      id: 'mercury',
      classification: 'terrestrial',
      radius_km: 2439.7,
      mass_kg: 3.3011e23,
      density_g_cm3: 5.427,
      gravity_m_s2: 3.7,
      rotation_period_h: 1407.6,
      axial_tilt_deg: 0.034,
      mean_temperature_k: 440,
      semi_major_axis_AU: 0.387098,
      eccentricity: 0.20563,
      inclination_deg: 7.005,
      longitude_ascending_node_deg: 48.331,
      argument_perihelion_deg: 29.124,
      mean_anomaly_J2000_deg: 174.796,
      orbital_period_days: 87.969,
      color_hex: '#8c7853',
      has_rings: false,
      moons_count: 0,
      texture_base: '/textures/mercury/',
    },
  ],
  asteroid_belt: {
    inner_AU: 2.2,
    outer_AU: 3.2,
    count_high: 2000,
    count_mid: 1000,
    count_low: 500,
    vertical_dispersion: 0.05,
    size_min: 0.012,
    size_max: 0.045,
    color_hex: '#7a6f5a',
  },
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Resetear caché del módulo para aislar cada test
  _resetPlanetsDataCache();

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDataset),
    }),
  );
});

afterEach(() => {
  _resetPlanetsDataCache();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePlanetsData — fetch y parseo', () => {
  it('retorna null inicialmente (cargando)', () => {
    const { result } = renderHook(() => usePlanetsData());
    // El estado inicial debe ser null o loading
    const initialData = result.current.data;
    const initialLoading = result.current.loading;
    expect(initialData === null || initialLoading === true).toBe(true);
  });

  it('retorna el dataset parseado una vez cargado', async () => {
    const { result } = renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
    expect(result.current.data?.version).toBe('1.0.0');
    expect(result.current.data?.planets).toHaveLength(1);
    expect(result.current.data?.planets[0]?.id).toBe('mercury');
  });

  it('retorna asteroid_belt correctamente', async () => {
    const { result } = renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
    expect(result.current.data?.asteroid_belt.count_high).toBe(2000);
    expect(result.current.data?.asteroid_belt.inner_AU).toBe(2.2);
  });

  it('fetch se invoca con /data/planets.json', async () => {
    renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const fetchMock = vi.mocked(fetch);
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('planets.json');
  });

  it('loading es false después de la carga', async () => {
    const { result } = renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('error es null en caso de éxito', async () => {
    const { result } = renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBeNull();
  });

  it('retorna error cuando fetch falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { result } = renderHook(() => usePlanetsData());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });
});
