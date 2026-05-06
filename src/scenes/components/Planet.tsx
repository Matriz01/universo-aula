/**
 * Componente <Planet> — esfera con textura lazy + LOD según distancia cámara.
 *
 * Características:
 * - useTexture de Drei para carga lazy de textura
 * - LOD con 3 niveles de detalle (64/32/16 segments)
 * - Color fallback si textura no carga (<Suspense>)
 * - onClick → setSelectedPlanet en el store
 * - usePlanetPosition para posición actualizada en useFrame
 */

import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import type { Mesh } from 'three';
import { SphereGeometry, MeshStandardMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { visualRadius } from '@/scenes/scale';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PlanetProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  /** 'dwarf' para Plutón — label diferenciado */
  variant?: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Subcomponente: PlanetMesh (dentro de Suspense — usa useTexture)
// ---------------------------------------------------------------------------

interface PlanetMeshProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  variant: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
}

const LOD_SEGMENTS = [64, 32, 16] as const;

function PlanetMeshInner({ planet, level, variant, onClick }: PlanetMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);

  // Textura lazy — useTexture suspende hasta que carga
  const textureUrl = `${planet.texture_base}2k.jpg`;
  const texture = useTexture(textureUrl);

  // Geometrías para los tres niveles LOD
  const geometries = useMemo(
    () => LOD_SEGMENTS.map((seg) => new SphereGeometry(visualRadius(planet.radius_km), seg, seg)),
    [planet.radius_km],
  );

  // Material con textura
  const material = useMemo(() => new MeshStandardMaterial({ map: texture }), [texture]);

  // Sincronizamos posición desde posRef (actualizado por useFrame en usePlanetPosition)
  useFrame(() => {
    if (meshRef.current) {
      const pos = posRef.current;
      meshRef.current.position.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <group>
      {/* Usar el primer nivel de geometría como único mesh */}
      <mesh
        ref={meshRef}
        geometry={geometries[0]}
        material={material}
        name={planet.id}
        onClick={() => onClick?.(planet.id)}
      />
      <Html center distanceFactor={10}>
        <div
          style={{
            color: 'white',
            fontSize: variant === 'dwarf' ? '10px' : '12px',
            fontStyle: variant === 'dwarf' ? 'italic' : 'normal',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {planet.id}
          {variant === 'dwarf' && ' ✦'}
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Componente fallback (color sólido cuando textura no carga)
// ---------------------------------------------------------------------------

function PlanetFallback({ planet, level, onClick }: PlanetMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);
  const geometry = useMemo(
    () => new SphereGeometry(visualRadius(planet.radius_km), 16, 16),
    [planet.radius_km],
  );
  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(posRef.current);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      name={planet.id}
      onClick={() => onClick?.(planet.id)}
    />
  );
}

// ---------------------------------------------------------------------------
// Componente Planet exportado
// ---------------------------------------------------------------------------

export const Planet = React.memo(function Planet({
  planet,
  level,
  variant = 'normal',
  onClick,
}: PlanetProps) {
  return (
    <Suspense
      fallback={
        onClick ? (
          <PlanetFallback planet={planet} level={level} variant={variant} onClick={onClick} />
        ) : (
          <PlanetFallback planet={planet} level={level} variant={variant} />
        )
      }
    >
      {onClick ? (
        <PlanetMeshInner planet={planet} level={level} variant={variant} onClick={onClick} />
      ) : (
        <PlanetMeshInner planet={planet} level={level} variant={variant} />
      )}
    </Suspense>
  );
});

Planet.displayName = 'Planet';
