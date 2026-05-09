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
import type { Group, Mesh, Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, RingGeometry, DoubleSide } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { useScaledRadius } from '@/scenes/hooks/useScaledRadius';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import { degToRad } from '@/scenes/orbital';
import { getJD, J2000_JD } from '@/scenes/simulationClock';
import { useAppStore } from '@/store/useAppStore';
import { RotationAxisLine } from '@/scenes/components/RotationAxisLine';
import { usePlanetMaterial } from '@/scenes/hooks/usePlanetMaterial';
import { RimOutline } from '@/scenes/components/RimOutline';

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
  const sphereRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);

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

  // Hook de swap de material: toon en explorador, standard (textura) en otros niveles
  // ADR-3: los anillos NO reciben tratamiento toon, solo la esfera
  usePlanetMaterial({
    meshRef: sphereRef,
    level,
    colorHex: planet.color_hex,
    texture: planetTexture,
  });

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
    const jd = getJD();

    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      // Publicar posición actual para CameraController (follow mode)
      if (positionsRef) {
        positionsRef.current[planet.id] = posRef.current.clone();
      }
    }

    // Solo la esfera rota; los anillos son independientes (partículas)
    if (sphereRef.current) {
      // Rotación axial: derivada del JD (días desde J2000) × velocidad angular
      sphereRef.current.rotation.y = (jd - J2000_JD) * omega;
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      {/* Grupo con inclinación axial: esfera rota sobre su eje inclinado */}
      <group rotation={[0, 0, tiltRad]}>
        <mesh ref={sphereRef} geometry={sphereGeometry} name={`${planet.id}-sphere`} />
        {/* Outline cartoon — solo en nivel explorador (ADR-3: solo esfera, no anillos) */}
        {level === 'explorador' && <RimOutline geometry={sphereGeometry} />}
        {/* Anillos: no rotan con el planeta, son estructuras independientes */}
        {/* ADR-3: los anillos mantienen MeshBasicMaterial en todos los niveles */}
        {ringGeometry && (
          <mesh
            geometry={ringGeometry}
            material={ringMaterial}
            rotation={[Math.PI / 2, 0, 0]}
            name={`${planet.id}-rings`}
          />
        )}
        {/* Eje de rotación axial — visible solo cuando showRotationAxes=true */}
        <RotationAxisLine radius={planetRadius} tiltDeg={0} visible={showRotationAxes} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fallback (color sólido)
// ---------------------------------------------------------------------------

function SaturnFallback({ planet, level, onClick, positionsRef }: SaturnProps) {
  const groupRef = useRef<Group>(null);
  const sphereRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);

  // Radio visual según modo activo (real en local, didáctico en global)
  const planetRadius = useScaledRadius(planet.radius_km);

  const sphereGeometry = useMemo(() => new SphereGeometry(planetRadius, 16, 16), [planetRadius]);

  // Hook de swap de material: toon en explorador, color sólido en otros niveles
  usePlanetMaterial({ meshRef: sphereRef, level, colorHex: planet.color_hex, texture: null });

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

  const tiltRad = degToRad(planet.axial_tilt_deg);

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      <group rotation={[0, 0, tiltRad]}>
        <mesh ref={sphereRef} geometry={sphereGeometry} />
        {/* Outline cartoon — solo en nivel explorador */}
        {level === 'explorador' && <RimOutline geometry={sphereGeometry} />}
        {/* ADR-3: anillos mantienen MeshBasicMaterial en todos los niveles */}
        {ringGeometry && (
          <mesh geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
        )}
        <RotationAxisLine radius={planetRadius} tiltDeg={0} visible={showRotationAxes} />
      </group>
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
