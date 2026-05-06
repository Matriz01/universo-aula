/**
 * Hook usePlanetsData — fetch y cache del dataset planets.json.
 *
 * Carga /data/planets.json desde el servidor (public/ en Vite) y lo cachea
 * en memoria para la vida de la sesión. Sin dependencias externas — sólo
 * useEffect + useState (instrucción explícita del design: NO añadir react-query).
 */

import { useState, useEffect } from 'react';
import type { SolarSystemDataset } from '@/scenes/data/types';

// Cache de módulo para evitar fetches duplicados entre instancias del hook
let _cachedDataset: SolarSystemDataset | null = null;
let _fetchPromise: Promise<SolarSystemDataset> | null = null;

async function fetchPlanetsData(): Promise<SolarSystemDataset> {
  if (_cachedDataset) return _cachedDataset;

  if (!_fetchPromise) {
    _fetchPromise = fetch('/data/planets.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<SolarSystemDataset>;
      })
      .then((data) => {
        _cachedDataset = data;
        return data;
      });
  }

  return _fetchPromise;
}

export interface UsePlanetsDataResult {
  data: SolarSystemDataset | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook que carga y cachea el dataset del Sistema Solar.
 *
 * @returns { data, loading, error }
 *   - data:    dataset parseado o null si aún cargando / error
 *   - loading: true mientras el fetch está en curso
 *   - error:   Error si el fetch falla, null en caso de éxito
 */
export function usePlanetsData(): UsePlanetsDataResult {
  const [data, setData] = useState<SolarSystemDataset | null>(_cachedDataset);
  const [loading, setLoading] = useState<boolean>(_cachedDataset === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (_cachedDataset) {
      setData(_cachedDataset);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchPlanetsData()
      .then((dataset) => {
        if (!cancelled) {
          setData(dataset);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

/**
 * Resetea la caché del módulo (útil para tests).
 * No debe llamarse en producción.
 */
export function _resetPlanetsDataCache(): void {
  _cachedDataset = null;
  _fetchPromise = null;
}
