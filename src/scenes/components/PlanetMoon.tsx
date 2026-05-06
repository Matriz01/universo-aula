/**
 * Componente <PlanetMoon> — La Luna terrestre orbitando la Tierra.
 *
 * Características:
 * - Órbita simplificada alrededor de la posición de la Tierra
 * - Radio ~0.8 unidades de escena, periodo 27.3 días simulados
 * - Textura moon/2k.jpg (lazy con Drei useTexture)
 * - Geometría SphereGeometry(0.27, 16, 16) según design §4.8
 */

import React, { useRef, useMemo, Suspense } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { SphereGeometry, MeshStandardMaterial, Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Radio de la órbita de la Luna en unidades de escena */
const MOON_ORBIT_RADIUS = 0.8;

/** Periodo orbital de la Luna en días simulados */
const MOON_PERIOD_DAYS = 27.3;

/** Radio visual de la Luna */
const MOON_VISUAL_RADIUS = 0.27;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PlanetMoonProps {
  /** Posición actual de la Tierra en la escena [x, y, z] (estática) */
  earthPosition?: [number, number, number];
  /** Ref a las posiciones runtime de los planetas; si está, prioriza sobre earthPosition */
  positionsRef?: MutableRefObject<Record<string, Vector3>>;
  /** Activar sombras — solo en modo local con Tierra seleccionada (eclipses) */
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ---------------------------------------------------------------------------
// Subcomponente con textura (dentro de Suspense)
// ---------------------------------------------------------------------------

function MoonMeshInner({
  earthPosition = [0, 0, 0],
  positionsRef,
  castShadow: cs,
  receiveShadow: rs,
}: PlanetMoonProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  const texture = useTexture('/textures/moon/2k.jpg');

  const geometry = useMemo(() => new SphereGeometry(MOON_VISUAL_RADIUS, 16, 16), []);
  const material = useMemo(() => new MeshStandardMaterial({ map: texture }), [texture]);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame((_, dt) => {
    const SPEEDUP = 10;
    elapsed.current += dt * SPEEDUP;

    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

    const live = positionsRef?.current?.earth;
    const earthPos = live ?? fallbackEarthPos;

    if (meshRef.current) {
      meshRef.current.position.set(
        earthPos.x + MOON_ORBIT_RADIUS * Math.cos(theta),
        earthPos.y,
        earthPos.z + MOON_ORBIT_RADIUS * Math.sin(theta),
      );
      // Rotación síncrona (tidal lock): misma velocidad angular que la órbita
      meshRef.current.rotation.y = theta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      name="moon"
      {...(cs ? { castShadow: true } : {})}
      {...(rs ? { receiveShadow: true } : {})}
    />
  );
}

// ---------------------------------------------------------------------------
// Fallback (color sólido)
// ---------------------------------------------------------------------------

function MoonFallback({ earthPosition = [0, 0, 0], positionsRef }: PlanetMoonProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  const geometry = useMemo(() => new SphereGeometry(MOON_VISUAL_RADIUS, 8, 8), []);
  const material = useMemo(() => new MeshStandardMaterial({ color: '#c8c8c8' }), []);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame((_, dt) => {
    const SPEEDUP = 10;
    elapsed.current += dt * SPEEDUP;
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

    const live = positionsRef?.current?.earth;
    const earthPos = live ?? fallbackEarthPos;

    if (meshRef.current) {
      meshRef.current.position.set(
        earthPos.x + MOON_ORBIT_RADIUS * Math.cos(theta),
        earthPos.y,
        earthPos.z + MOON_ORBIT_RADIUS * Math.sin(theta),
      );
      // Rotación síncrona (tidal lock)
      meshRef.current.rotation.y = theta;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} name="moon-fallback" />;
}

// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

export const PlanetMoon = React.memo(function PlanetMoon({
  earthPosition,
  positionsRef,
  castShadow,
  receiveShadow,
}: PlanetMoonProps) {
  const shared = {
    ...(earthPosition !== undefined ? { earthPosition } : {}),
    ...(positionsRef !== undefined ? { positionsRef } : {}),
    ...(castShadow !== undefined ? { castShadow } : {}),
    ...(receiveShadow !== undefined ? { receiveShadow } : {}),
  };
  return (
    <Suspense fallback={<MoonFallback {...shared} />}>
      <MoonMeshInner {...shared} />
    </Suspense>
  );
});

PlanetMoon.displayName = 'PlanetMoon';
