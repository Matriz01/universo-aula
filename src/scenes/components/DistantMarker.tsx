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

const MARKER_RADIUS = 0.15;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const DistantMarker = React.memo(function DistantMarker({ planet }: DistantMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const level = useAppStore((s) => s.level);

  // Calcula la posición propia en cada frame, igual que <Planet>.
  // Esto garantiza movimiento correcto en modo local (donde <Planet> no está montado).
  const posRef = usePlanetPosition(planet, level);

  const geometry = useMemo(() => new SphereGeometry(MARKER_RADIUS, 8, 8), []);
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
