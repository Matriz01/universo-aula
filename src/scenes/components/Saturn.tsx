/**
 * Componente <Saturn> — Planet extendido con anillos.
 *
 * Añade a la esfera del planeta:
 * - RingGeometry con inner/outer radii de planet.rings
 * - MeshBasicMaterial con alphaMap de la textura PNG de los anillos
 * - transparent: true + side: THREE.DoubleSide
 * - Inclinación correcta del eje (axial_tilt_deg)
 *
 * Usa useBodyPosition (time-driven) en lugar de usePlanetPosition (legacy).
 */

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Group, Mesh, Vector3 } from 'three';
import {
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  RingGeometry,
  Color,
  DoubleSide,
} from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { useScaledRadius } from '@/scenes/hooks/useScaledRadius';
import { useBodyPosition } from '@/scenes/hooks/useBodyPosition';
import { degToRad } from '@/scenes/orbital';
import { useAppStore } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface SaturnProps {
  planet: PlanetData;
  /** @deprecated Level is unused post-refactor-C; kept for API compatibility */
  level?: string;
  onClick?: (id: string) => void;
  /** @deprecated positionsRef ya no es necesario; useBodyPosition es la fuente de verdad */
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

// ---------------------------------------------------------------------------
// Factor de conversión km → unidades visuales para los anillos
// ---------------------------------------------------------------------------

function ringRadiusToVisual(ringKm: number, planetKm: number, planetVisual: number): number {
  return (ringKm / planetKm) * planetVisual;
}

// ---------------------------------------------------------------------------
// Subcomponente con textura (dentro de Suspense)
// ---------------------------------------------------------------------------

function SaturnMeshInner({ planet, onClick }: SaturnProps) {
  const groupRef = useRef<Group>(null);
  const sphereRef = useRef<Mesh>(null);
  const elapsedRotation = useRef(0);

  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);
  const speed = useAppStore((s) => s.simulationSpeed);

  // Posición orbital time-driven
  const pos = useBodyPosition(planet, time, viewMode);

  // Velocidad angular de auto-rotación (rad/día simulado), acotada ×0.4 para gigantes
  const omega = useMemo(() => {
    const periodDays = planet.rotation_period_h / 24;
    return ((2 * Math.PI) / periodDays) * 0.4;
  }, [planet.rotation_period_h]);

  // Radio visual según modo activo (real en local, didáctico en global)
  const planetRadius = useScaledRadius(planet.radius_km);

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

  // Aplicar posición orbital al grupo cuando cambia
  useEffect(() => {
    if (groupRef.current && 'position' in groupRef.current && groupRef.current.position) {
      groupRef.current.position.copy(pos);
    }
  }, [pos]);

  // Rotación self — local al componente
  useFrame((_, dt) => {
    elapsedRotation.current += dt * speed;
    if (sphereRef.current) {
      sphereRef.current.rotation.y = elapsedRotation.current * omega;
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      {/* Grupo con inclinación axial: esfera rota sobre su eje inclinado */}
      <group rotation={[0, 0, tiltRad]}>
        <mesh
          ref={sphereRef}
          geometry={sphereGeometry}
          material={sphereMaterial}
          name={`${planet.id}-sphere`}
        />
        {/* Anillos: no rotan con el planeta, son estructuras independientes */}
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

function SaturnFallback({ planet, onClick }: SaturnProps) {
  const groupRef = useRef<Group>(null);

  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);

  const pos = useBodyPosition(planet, time, viewMode);

  // Radio visual según modo activo (real en local, didáctico en global)
  const planetRadius = useScaledRadius(planet.radius_km);

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

  useEffect(() => {
    if (groupRef.current && 'position' in groupRef.current && groupRef.current.position) {
      groupRef.current.position.copy(pos);
    }
  }, [pos]);

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
  // level y positionsRef se ignoran post-refactor-C (kept for API compat)
  void level;
  void positionsRef;

  const shared: SaturnProps = {
    planet,
    ...(onClick !== undefined ? { onClick } : {}),
  };

  return (
    <Suspense fallback={<SaturnFallback {...shared} />}>
      <SaturnMeshInner {...shared} />
    </Suspense>
  );
});

Saturn.displayName = 'Saturn';
