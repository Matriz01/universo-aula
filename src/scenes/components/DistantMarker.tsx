/**
 * <DistantMarker> — representa un planeta no seleccionado en modo local.
 *
 * Esfera muy pequeña con MeshBasicMaterial (no afectada por luz),
 * con el color propio del planeta. Calcula su propia posición usando
 * useBodyPosition (time-driven), de modo que funciona
 * correctamente en modo local donde <Planet> no está montado.
 *
 * positionsRef se mantiene como prop opcional @deprecated (compatibilidad hacia atrás)
 * pero ya no se usa: la posición viene de useBodyPosition.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import type { Mesh, Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { useBodyPosition } from '@/scenes/hooks/useBodyPosition';
import { useAppStore } from '@/store/useAppStore';
import { localVisualRadius } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface DistantMarkerProps {
  planet: PlanetData;
  /** @deprecated ya no se usa; la posición se calcula internamente via useBodyPosition */
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Radio del marker en modo global (escala didáctica) */
const MARKER_RADIUS_GLOBAL = 0.15;

/**
 * Factor de sobredimensionado en modo local para que el punto sea perceptible.
 */
const MARKER_LOCAL_OVERSIZE_FACTOR = 50;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const DistantMarker = React.memo(function DistantMarker({ planet }: DistantMarkerProps) {
  const meshRef = useRef<Mesh>(null);

  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);

  // Posición orbital time-driven
  const pos = useBodyPosition(planet, time, viewMode);

  // En modo local: radio real ×50 para visibilidad como punto de referencia.
  // En modo global: radio fijo didáctico.
  const markerRadius = useMemo(
    () =>
      viewMode === 'local'
        ? localVisualRadius(planet.radius_km) * MARKER_LOCAL_OVERSIZE_FACTOR
        : MARKER_RADIUS_GLOBAL,
    [viewMode, planet.radius_km],
  );

  const geometry = useMemo(() => new SphereGeometry(markerRadius, 8, 8), [markerRadius]);
  const material = useMemo(
    () => new MeshBasicMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  // Aplicar posición cuando cambia el tiempo
  useEffect(() => {
    if (!meshRef.current) return;
    if (!('position' in meshRef.current) || !meshRef.current.position) return;
    meshRef.current.position.set(pos.x, pos.y, pos.z);
  }, [pos]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      name={`distant-marker-${planet.id}`}
    />
  );
});

DistantMarker.displayName = 'DistantMarker';
