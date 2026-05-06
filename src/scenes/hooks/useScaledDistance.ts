/**
 * useScaledDistance — devuelve la distancia visual de un planeta al Sol
 * aplicando la escala correcta según el viewMode activo.
 *
 * - global → visualDistance (escala didáctica sublogarítmica)
 * - local  → localVisualDistanceFromAU (escala real: 1 unidad = 1000 km)
 */

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';

/**
 * @param au - Semieje mayor del planeta en unidades astronómicas
 * @returns Distancia en unidades de escena Three.js según el modo activo
 */
export function useScaledDistance(au: number): number {
  const viewMode = useAppStore((s) => s.viewMode);
  return useMemo(() => {
    if (viewMode === 'local') return localVisualDistanceFromAU(au);
    return visualDistance(au);
  }, [au, viewMode]);
}
