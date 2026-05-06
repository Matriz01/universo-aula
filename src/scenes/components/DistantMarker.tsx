/**
 * <DistantMarker> — representa un planeta no seleccionado en modo local.
 *
 * Esfera muy pequeña con MeshBasicMaterial (no afectada por luz),
 * con el color propio del planeta. Se posiciona donde el planeta
 * realmente está usando positionsRef (actualizado por sus propios useFrame).
 * Si la posición no existe aún, usa usePlanetPosition como fallback.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface DistantMarkerProps {
  planet: PlanetData;
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MARKER_RADIUS = 0.15;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const DistantMarker = React.memo(function DistantMarker({
  planet,
  positionsRef,
}: DistantMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  // Fallback position si el planeta aún no tiene posición en positionsRef
  const fallbackPosRef = usePlanetPosition(planet, 'aprendiz');

  const geometry = useMemo(() => new SphereGeometry(MARKER_RADIUS, 8, 8), []);
  const material = useMemo(
    () => new MeshBasicMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  useFrame(() => {
    if (!meshRef.current) return;

    const livePos = positionsRef?.current?.[planet.id];
    const pos = livePos ?? fallbackPosRef.current;

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
