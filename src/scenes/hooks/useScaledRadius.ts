/**
 * useScaledRadius — devuelve el radio visual de un cuerpo celeste
 * aplicando la escala correcta según el viewMode activo.
 *
 * - global → visualRadius (escala didáctica)
 * - local  → localVisualRadius (escala real: 1 unidad = 1000 km)
 */

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { visualRadius, localVisualRadius } from '@/scenes/scale';

/**
 * @param radiusKm - Radio real del cuerpo en kilómetros
 * @returns Radio en unidades de escena Three.js según el modo activo
 */
export function useScaledRadius(radiusKm: number): number {
  const viewMode = useAppStore((s) => s.viewMode);
  return useMemo(() => {
    if (viewMode === 'local') return localVisualRadius(radiusKm);
    return visualRadius(radiusKm);
  }, [radiusKm, viewMode]);
}
