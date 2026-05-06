/**
 * Componente <Planet> — esfera con textura lazy + LOD según distancia cámara.
 *
 * Características:
 * - useTexture de Drei para carga lazy de textura
 * - LOD con 3 niveles de detalle (64/32/16 segments)
 * - Color fallback si textura no carga (<Suspense>)
 * - onClick → setSelectedPlanet en el store
 * - useBodyPosition para posición kepleriana time-driven
 * - Rotación self en useFrame (local al componente)
 */

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import type { Mesh, Group, Vector3 } from 'three';
import { SphereGeometry, MeshStandardMaterial, Color } from 'three';
import type { PlanetData } from '@/scenes/data/types';
import { useScaledRadius } from '@/scenes/hooks/useScaledRadius';
import { useBodyPosition } from '@/scenes/hooks/useBodyPosition';
import { degToRad } from '@/scenes/orbital';
import { useAppStore } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PlanetProps {
  planet: PlanetData;
  /** @deprecated Level is unused post-refactor-C; kept for API compatibility */
  level?: string;
  /** 'dwarf' para Plutón — label diferenciado */
  variant?: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
  /** @deprecated positionsRef ya no es necesario; useBodyPosition es la fuente de verdad */
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
  variant: 'normal' | 'dwarf';
  onClick?: (id: string) => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const LOD_SEGMENTS = [64, 32, 16] as const;

function PlanetMeshInner({
  planet,
  variant,
  onClick,
  castShadow: cs,
  receiveShadow: rs,
}: PlanetMeshProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const elapsedRotation = useRef(0);

  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);
  const speed = useAppStore((s) => s.simulationSpeed);
  const { t } = useTranslation('solar');

  // Posición orbital time-driven (fuente única de verdad)
  const pos = useBodyPosition(planet, time, viewMode);

  // Textura lazy — useTexture suspende hasta que carga
  const textureUrl = `${planet.texture_base}2k.jpg`;
  const texture = useTexture(textureUrl);

  // Radio visual según modo activo (real en local, didáctico en global)
  const planetRadius = useScaledRadius(planet.radius_km);

  // Geometrías para los tres niveles LOD
  const geometries = useMemo(
    () => LOD_SEGMENTS.map((seg) => new SphereGeometry(planetRadius, seg, seg)),
    [planetRadius],
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

  // Aplicar posición orbital al grupo cuando cambia pos
  useEffect(() => {
    if (groupRef.current && 'position' in groupRef.current && groupRef.current.position) {
      groupRef.current.position.copy(pos);
    }
  }, [pos]);

  // Rotación self — local al componente (necesita useFrame para animar continuo)
  useFrame((_, dt) => {
    elapsedRotation.current += dt * speed;
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsedRotation.current * omega;
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
      <Html
        center
        distanceFactor={viewMode === 'local' ? 500 : 8}
        position={[0, planetRadius * 1.5, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: 'white',
            fontSize: variant === 'dwarf' ? '12px' : '14px',
            fontWeight: 600,
            fontStyle: variant === 'dwarf' ? 'italic' : 'normal',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)',
            letterSpacing: '0.02em',
          }}
        >
          {t(`${planet.id}.name`, { defaultValue: planet.id })}
          {variant === 'dwarf' && ' ✦'}
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Componente fallback (color sólido cuando textura no carga)
// ---------------------------------------------------------------------------

function PlanetFallback({ planet, onClick }: PlanetMeshProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const elapsedRotation = useRef(0);

  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);
  const speed = useAppStore((s) => s.simulationSpeed);

  const pos = useBodyPosition(planet, time, viewMode);

  const planetRadius = useScaledRadius(planet.radius_km);
  const geometry = useMemo(() => new SphereGeometry(planetRadius, 16, 16), [planetRadius]);
  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color(planet.color_hex) }),
    [planet.color_hex],
  );

  const tiltRad = useMemo(() => degToRad(planet.axial_tilt_deg), [planet.axial_tilt_deg]);

  const omega = useMemo(() => {
    const periodDays = planet.rotation_period_h / 24;
    return (2 * Math.PI) / periodDays;
  }, [planet.rotation_period_h]);

  useEffect(() => {
    if (groupRef.current && 'position' in groupRef.current && groupRef.current.position) {
      groupRef.current.position.copy(pos);
    }
  }, [pos]);

  useFrame((_, dt) => {
    elapsedRotation.current += dt * speed;
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsedRotation.current * omega;
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
  variant = 'normal',
  onClick,
  castShadow,
  receiveShadow,
}: PlanetProps) {
  const shared: PlanetMeshProps = {
    planet,
    variant,
    ...(onClick !== undefined ? { onClick } : {}),
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
