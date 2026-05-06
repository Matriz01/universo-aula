/**
 * Componente <Saturn> — Planet extendido con anillos.
 *
 * Añade a la esfera del planeta:
 * - RingGeometry con inner/outer radii de planet.rings
 * - MeshBasicMaterial con alphaMap de la textura PNG de los anillos
 * - transparent: true + side: THREE.DoubleSide
 * - Inclinación correcta del eje (axial_tilt_deg)
 *
 * Estrategia: reutiliza la lógica de posición de usePlanetPosition.
 * Los anillos se posicionan en el mismo grupo que la esfera.
 */

import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Group, Vector3 } from 'three';
import {
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  RingGeometry,
  Color,
  DoubleSide,
} from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { visualRadius } from '@/scenes/scale';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import { degToRad } from '@/scenes/orbital';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface SaturnProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  onClick?: (id: string) => void;
  /** Ref al mapa de posiciones reales compartido con CameraController */
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

// ---------------------------------------------------------------------------
// Factor de conversión km → unidades visuales para los anillos
// Usamos la relación: ring_radius_km / planet_radius_km * visual_radius(planet)
// ---------------------------------------------------------------------------

function ringRadiusToVisual(ringKm: number, planetKm: number, planetVisual: number): number {
  return (ringKm / planetKm) * planetVisual;
}

// ---------------------------------------------------------------------------
// Subcomponente con textura (dentro de Suspense)
// ---------------------------------------------------------------------------

function SaturnMeshInner({ planet, level, onClick, positionsRef }: SaturnProps) {
  const groupRef = useRef<Group>(null);
  const posRef = usePlanetPosition(planet, level);

  const planetRadius = visualRadius(planet.radius_km);

  // Texturas lazy
  const planetTexture = useTexture(`${planet.texture_base}2k.jpg`);
  const ringTexture = useTexture(planet.rings?.texture ?? '/textures/saturn-rings/2k.png');

  // Geometría de la esfera del planeta
  const sphereGeometry = useMemo(() => new SphereGeometry(planetRadius, 64, 64), [planetRadius]);

  // Material de la esfera
  const sphereMaterial = useMemo(
    () => new MeshStandardMaterial({ map: planetTexture }),
    [planetTexture],
  );

  // Geometría de los anillos (en unidades visuales)
  const ringGeometry = useMemo(() => {
    if (!planet.rings) return null;
    const innerR = ringRadiusToVisual(planet.rings.inner_radius_km, planet.radius_km, planetRadius);
    const outerR = ringRadiusToVisual(planet.rings.outer_radius_km, planet.radius_km, planetRadius);
    return new RingGeometry(innerR, outerR, 64);
  }, [planet.rings, planet.radius_km, planetRadius]);

  // Material de los anillos
  const ringMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: ringTexture,
        alphaMap: ringTexture,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
      }),
    [ringTexture],
  );

  // Inclinación axial de Saturno
  const tiltRad = degToRad(planet.axial_tilt_deg);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      // Publicar posición actual para CameraController (follow mode)
      if (positionsRef) {
        positionsRef.current[planet.id] = posRef.current.clone();
      }
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      {/* Esfera del planeta con inclinación axial */}
      <group rotation={[0, 0, tiltRad]}>
        <mesh geometry={sphereGeometry} material={sphereMaterial} name={`${planet.id}-sphere`} />
        {/* Anillos alineados con el ecuador del planeta (ya rotados con el grupo) */}
        {ringGeometry && (
          <mesh
            geometry={ringGeometry}
            material={ringMaterial}
            rotation={[Math.PI / 2, 0, 0]}
            name={`${planet.id}-rings`}
          />
        )}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fallback (color sólido)
// ---------------------------------------------------------------------------

function SaturnFallback({ planet, level, onClick, positionsRef }: SaturnProps) {
  const groupRef = useRef<Group>(null);
  const posRef = usePlanetPosition(planet, level);

  const planetRadius = visualRadius(planet.radius_km);

  const sphereGeometry = useMemo(() => new SphereGeometry(planetRadius, 16, 16), [planetRadius]);
  const sphereMaterial = useMemo(
    () => new MeshStandardMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  const ringGeometry = useMemo(() => {
    if (!planet.rings) return null;
    const innerR = ringRadiusToVisual(planet.rings.inner_radius_km, planet.radius_km, planetRadius);
    const outerR = ringRadiusToVisual(planet.rings.outer_radius_km, planet.radius_km, planetRadius);
    return new RingGeometry(innerR, outerR, 32);
  }, [planet.rings, planet.radius_km, planetRadius]);

  const ringMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#c8a86b',
        transparent: true,
        opacity: 0.6,
        side: DoubleSide,
      }),
    [],
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      if (positionsRef) {
        positionsRef.current[planet.id] = posRef.current.clone();
      }
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      <mesh geometry={sphereGeometry} material={sphereMaterial} />
      {ringGeometry && (
        <mesh geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Componente Saturn exportado
// ---------------------------------------------------------------------------

export const Saturn = React.memo(function Saturn({
  planet,
  level,
  onClick,
  positionsRef,
}: SaturnProps) {
  const shared = {
    planet,
    level,
    ...(onClick !== undefined ? { onClick } : {}),
    ...(positionsRef !== undefined ? { positionsRef } : {}),
  };

  return (
    <Suspense fallback={<SaturnFallback {...shared} />}>
      <SaturnMeshInner {...shared} />
    </Suspense>
  );
});

Saturn.displayName = 'Saturn';
