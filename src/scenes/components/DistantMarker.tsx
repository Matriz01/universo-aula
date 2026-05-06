/**
 * <DistantMarker> — representa un planeta no seleccionado en modo local.
 *
 * Esfera muy pequeña con MeshBasicMaterial (no afectada por luz),
 * con el color propio del planeta. Calcula su propia posición usando
 * usePlanetPosition (igual que <Planet>), de modo que funciona
 * correctamente en modo local donde <Planet> no se monta.
 *
 * positionsRef se mantiene como prop opcional (compatibilidad hacia atrás)
 * pero ya no se usa: la posición propia tiene prioridad siempre.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import { useAppStore } from '@/store/useAppStore';
import { localVisualRadius } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface DistantMarkerProps {
  planet: PlanetData;
  /** @deprecated ya no se usa; la posición se calcula internamente */
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Radio del marker en modo global (escala didáctica) */
const MARKER_RADIUS_GLOBAL = 0.15;

/**
 * Factor de sobredimensionado en modo local para que el punto sea perceptible.
 * Sin esto, el planeta real en escala a distancias de millones de unidades
 * sería invisible (sub-píxel). ×50 mantiene la apariencia de "punto de referencia".
 * Nota: no es físicamente exacto, es un truco de visibilidad.
 */
const MARKER_LOCAL_OVERSIZE_FACTOR = 50;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const DistantMarker = React.memo(function DistantMarker({ planet }: DistantMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const level = useAppStore((s) => s.level);
  const viewMode = useAppStore((s) => s.viewMode);

  // Calcula la posición propia en cada frame, igual que <Planet>.
  // Esto garantiza movimiento correcto en modo local (donde <Planet> no está montado).
  const posRef = usePlanetPosition(planet, level);

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

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = posRef.current;
    meshRef.current.position.set(pos.x, pos.y, pos.z);
  });

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
