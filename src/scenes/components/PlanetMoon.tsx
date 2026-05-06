/**
 * Componente <PlanetMoon> — La Luna terrestre orbitando la Tierra.
 *
 * Características:
 * - Órbita simplificada alrededor de la posición de la Tierra
 * - Radio visual calculado con visualRadius(1737 km)
 * - Periodo 27.3 días simulados
 * - Textura moon/2k.jpg (lazy con Drei useTexture)
 * - Órbita adaptada al modo de vista:
 *   · global → 0.8 unidades (escala didáctica compacta)
 *   · local con Tierra → 6 unidades (~10× radio Tierra, refleja separación real)
 */

import React, { useRef, useMemo, Suspense } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { SphereGeometry, MeshStandardMaterial, Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { visualRadius, localVisualRadius, localVisualDistanceFromKm } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Radio real de la Luna en km */
const MOON_RADIUS_KM = 1737;

/** Periodo orbital de la Luna en días simulados */
const MOON_PERIOD_DAYS = 27.3;

/** Órbita en modo global (escala didáctica compacta) */
const MOON_ORBIT_RADIUS_GLOBAL = 0.8;

/** Distancia real Tierra-Luna en km */
const MOON_ORBIT_REAL_KM = 384_400;

/**
 * Órbita en modo local: distancia real Tierra-Luna en escala 1:1 (1 unidad = 1000 km).
 * = 384.4 unidades ≈ 60× radio Tierra real (6.37 unidades) — correcto.
 */
const MOON_ORBIT_RADIUS_LOCAL = localVisualDistanceFromKm(MOON_ORBIT_REAL_KM);

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
  const speed = useAppStore((s) => s.simulationSpeed);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);

  const texture = useTexture('/textures/moon/2k.jpg');

  // Radio real en modo local, didáctico en global
  const moonRadius = useMemo(
    () => (viewMode === 'local' ? localVisualRadius(MOON_RADIUS_KM) : visualRadius(MOON_RADIUS_KM)),
    [viewMode],
  );
  const geometry = useMemo(() => new SphereGeometry(moonRadius, 16, 16), [moonRadius]);
  const material = useMemo(() => new MeshStandardMaterial({ map: texture }), [texture]);

  const orbitRadius = useMemo(() => {
    if (viewMode === 'local' && selectedPlanet === 'earth') {
      return MOON_ORBIT_RADIUS_LOCAL;
    }
    return MOON_ORBIT_RADIUS_GLOBAL;
  }, [viewMode, selectedPlanet]);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame((_, dt) => {
    const SPEEDUP = 1; // días simulados por segundo real (base: 1 día/seg a speed=1)
    const dtScaled = dt * speed;
    elapsed.current += dtScaled * SPEEDUP;

    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

    const live = positionsRef?.current?.earth;
    const earthPos = live ?? fallbackEarthPos;

    if (meshRef.current) {
      meshRef.current.position.set(
        earthPos.x + orbitRadius * Math.cos(theta),
        earthPos.y,
        earthPos.z + orbitRadius * Math.sin(theta),
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
  const speed = useAppStore((s) => s.simulationSpeed);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);

  // Radio real en modo local, didáctico en global
  const moonRadius = useMemo(
    () => (viewMode === 'local' ? localVisualRadius(MOON_RADIUS_KM) : visualRadius(MOON_RADIUS_KM)),
    [viewMode],
  );
  const geometry = useMemo(() => new SphereGeometry(moonRadius, 8, 8), [moonRadius]);
  const material = useMemo(() => new MeshStandardMaterial({ color: '#c8c8c8' }), []);

  const orbitRadius = useMemo(() => {
    if (viewMode === 'local' && selectedPlanet === 'earth') {
      return MOON_ORBIT_RADIUS_LOCAL;
    }
    return MOON_ORBIT_RADIUS_GLOBAL;
  }, [viewMode, selectedPlanet]);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame((_, dt) => {
    const SPEEDUP = 1; // días simulados por segundo real (base: 1 día/seg a speed=1)
    const dtScaled = dt * speed;
    elapsed.current += dtScaled * SPEEDUP;
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

    const live = positionsRef?.current?.earth;
    const earthPos = live ?? fallbackEarthPos;

    if (meshRef.current) {
      meshRef.current.position.set(
        earthPos.x + orbitRadius * Math.cos(theta),
        earthPos.y,
        earthPos.z + orbitRadius * Math.sin(theta),
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
