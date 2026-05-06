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
import type { Mesh, Group, Vector3 } from 'three';
import { SphereGeometry, MeshStandardMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { visualRadius } from '@/scenes/scale';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import { degToRad } from '@/scenes/orbital';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PlanetProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  /** 'dwarf' para Plutón — label diferenciado */
  variant?: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
  /** Ref al mapa de posiciones reales compartido con CameraController */
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
  /** Solo activo en modo local con Tierra seleccionada (sombras eclipses) */
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ---------------------------------------------------------------------------
// Subcomponente: PlanetMesh (dentro de Suspense — usa useTexture)
// ---------------------------------------------------------------------------

interface PlanetMeshProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  variant: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
  positionsRef?: React.MutableRefObject<Record<string, Vector3>>;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const LOD_SEGMENTS = [64, 32, 16] as const;

function PlanetMeshInner({
  planet,
  level,
  variant,
  onClick,
  positionsRef,
  castShadow: cs,
  receiveShadow: rs,
}: PlanetMeshProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);
  const elapsedDays = useRef(0);

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

  // Inclinación axial del planeta
  const tiltRad = useMemo(() => degToRad(planet.axial_tilt_deg), [planet.axial_tilt_deg]);

  // Velocidad angular de auto-rotación (rad/día simulado)
  // rotation_period_h negativo = rotación retrógrada → la dirección es correcta naturalmente
  const omega = useMemo(() => {
    const periodDays = planet.rotation_period_h / 24;
    return (2 * Math.PI) / periodDays;
  }, [planet.rotation_period_h]);

  // Sincronizamos posición y rotación en cada frame
  useFrame((_, dt) => {
    const SPEEDUP = 10; // días simulados por segundo real
    elapsedDays.current += dt * SPEEDUP;

    if (groupRef.current) {
      const pos = posRef.current;
      groupRef.current.position.set(pos.x, pos.y, pos.z);
      // Publicar posición actual para CameraController (follow mode)
      if (positionsRef) {
        positionsRef.current[planet.id] = pos.clone();
      }
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = elapsedDays.current * omega;
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      {/* Grupo con inclinación axial: la rotación self se hace sobre el eje inclinado */}
      <group rotation={[0, 0, tiltRad]}>
        {/* Usar el primer nivel de geometría como único mesh */}
        <mesh
          ref={meshRef}
          geometry={geometries[0]}
          material={material}
          name={`${planet.id}-sphere`}
          {...(cs ? { castShadow: true } : {})}
          {...(rs ? { receiveShadow: true } : {})}
        />
      </group>
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

function PlanetFallback({ planet, level, onClick, positionsRef }: PlanetMeshProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const posRef = usePlanetPosition(planet, level);
  const elapsedDays = useRef(0);

  const geometry = useMemo(
    () => new SphereGeometry(visualRadius(planet.radius_km), 16, 16),
    [planet.radius_km],
  );
  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  const tiltRad = useMemo(() => degToRad(planet.axial_tilt_deg), [planet.axial_tilt_deg]);

  const omega = useMemo(() => {
    const periodDays = planet.rotation_period_h / 24;
    return (2 * Math.PI) / periodDays;
  }, [planet.rotation_period_h]);

  useFrame((_, dt) => {
    const SPEEDUP = 10;
    elapsedDays.current += dt * SPEEDUP;

    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      if (positionsRef) {
        positionsRef.current[planet.id] = posRef.current.clone();
      }
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = elapsedDays.current * omega;
    }
  });

  return (
    <group ref={groupRef} name={planet.id} onClick={() => onClick?.(planet.id)}>
      <group rotation={[0, 0, tiltRad]}>
        <mesh ref={meshRef} geometry={geometry} material={material} name={`${planet.id}-sphere`} />
      </group>
    </group>
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
  positionsRef,
  castShadow,
  receiveShadow,
}: PlanetProps) {
  const shared = {
    planet,
    level,
    variant,
    ...(onClick !== undefined ? { onClick } : {}),
    ...(positionsRef !== undefined ? { positionsRef } : {}),
    ...(castShadow !== undefined ? { castShadow } : {}),
    ...(receiveShadow !== undefined ? { receiveShadow } : {}),
  };

  return (
    <Suspense fallback={<PlanetFallback {...shared} />}>
      <PlanetMeshInner {...shared} />
    </Suspense>
  );
});

Planet.displayName = 'Planet';
