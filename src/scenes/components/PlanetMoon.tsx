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
import { visualRadius, localVisualRadius } from '@/scenes/scale';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import { useMoonPosition } from '@/scenes/hooks/useMoonPosition';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { EARTH_FALLBACK_DATA } from '@/scenes/data/earthFallback';
import { MOON_AXIAL_TILT_DEG } from '@/scenes/data/moon';
import { RotationAxisLine } from '@/scenes/components/RotationAxisLine';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Radio real de la Luna en km */
const MOON_RADIUS_KM = 1737;

/**
 * Radio de órbita en modo global (escala didáctica compacta).
 * En modo local, la posición es calculada por computeMoonPosition con escala real.
 */
const MOON_ORBIT_RADIUS_GLOBAL = 0.8;

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
  const viewMode = useAppStore((s) => s.viewMode);
  const level = useAppStore((s) => s.level);
  const goToBody = useAppStore((s) => s.goToBody);
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);

  // Obtenemos datos de planetas para encontrar la Tierra
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK_DATA;

  // Posición de la Tierra — siempre invocado (reglas de hooks)
  const earthPosRef = usePlanetPosition(earthData, level);

  // Posición de la Luna — usa computeMoonPosition con órbita 3D inclinada
  const moonPosRef = useMoonPosition(earthPosRef);

  const texture = useTexture('/textures/moon/2k.jpg');

  // Radio real en modo local, didáctico en global
  const moonRadius = useMemo(
    () => (viewMode === 'local' ? localVisualRadius(MOON_RADIUS_KM) : visualRadius(MOON_RADIUS_KM)),
    [viewMode],
  );
  const geometry = useMemo(() => new SphereGeometry(moonRadius, 16, 16), [moonRadius]);
  const material = useMemo(() => new MeshStandardMaterial({ map: texture }), [texture]);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame(() => {
    // En modo local: posición calculada por useMoonPosition (3D inclinada, escala real)
    // En modo global: posición plana simplificada (didáctica, radio MOON_ORBIT_RADIUS_GLOBAL)
    if (viewMode === 'local') {
      if (meshRef.current) {
        meshRef.current.position.copy(moonPosRef.current);
        // Rotación síncrona aproximada (tidal lock)
        const earthPos = earthPosRef.current;
        const dx = moonPosRef.current.x - earthPos.x;
        const dz = moonPosRef.current.z - earthPos.z;
        meshRef.current.rotation.y = Math.atan2(dx, dz);
      }
    } else {
      // Modo global: órbita circular plana simplificada
      const live = positionsRef?.current?.earth;
      const earthPos = live ?? fallbackEarthPos;
      const moonPos = moonPosRef.current;
      if (meshRef.current) {
        meshRef.current.position.copy(moonPos.lengthSq() > 0 ? moonPos : earthPos);
        // En modo global mostramos la Luna cerca de la Tierra (escala compacta)
        // La posición de moonPosRef en global usa escala local, así que usamos
        // la dirección y reescalamos al radio global
        const dir = new Vector3().subVectors(moonPos, earthPosRef.current).normalize();
        meshRef.current.position.copy(earthPos).addScaledVector(dir, MOON_ORBIT_RADIUS_GLOBAL);
      }
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        name="moon"
        onClick={(e) => {
          e.stopPropagation();
          goToBody('moon');
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
        {...(cs ? { castShadow: true } : {})}
        {...(rs ? { receiveShadow: true } : {})}
      />
      {/* Eje de rotación axial de la Luna — visible solo cuando showRotationAxes=true */}
      <RotationAxisLine
        radius={moonRadius}
        tiltDeg={MOON_AXIAL_TILT_DEG}
        visible={showRotationAxes}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Fallback (color sólido)
// ---------------------------------------------------------------------------

function MoonFallback({ earthPosition = [0, 0, 0], positionsRef }: PlanetMoonProps) {
  const meshRef = useRef<Mesh>(null);
  const viewMode = useAppStore((s) => s.viewMode);
  const level = useAppStore((s) => s.level);
  const goToBody = useAppStore((s) => s.goToBody);
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);

  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK_DATA;

  // Posición de la Tierra — siempre invocado (reglas de hooks)
  const earthPosRef = usePlanetPosition(earthData, level);

  // Posición de la Luna — usa computeMoonPosition con órbita 3D inclinada
  const moonPosRef = useMoonPosition(earthPosRef);

  // Radio real en modo local, didáctico en global
  const moonRadius = useMemo(
    () => (viewMode === 'local' ? localVisualRadius(MOON_RADIUS_KM) : visualRadius(MOON_RADIUS_KM)),
    [viewMode],
  );
  const geometry = useMemo(() => new SphereGeometry(moonRadius, 8, 8), [moonRadius]);
  const material = useMemo(() => new MeshStandardMaterial({ color: '#c8c8c8' }), []);

  const fallbackEarthPos = useMemo(
    () => new Vector3(...earthPosition),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthPosition[0], earthPosition[1], earthPosition[2]],
  );

  useFrame(() => {
    if (viewMode === 'local') {
      if (meshRef.current) {
        meshRef.current.position.copy(moonPosRef.current);
        const earthPos = earthPosRef.current;
        const dx = moonPosRef.current.x - earthPos.x;
        const dz = moonPosRef.current.z - earthPos.z;
        meshRef.current.rotation.y = Math.atan2(dx, dz);
      }
    } else {
      const live = positionsRef?.current?.earth;
      const earthPos = live ?? fallbackEarthPos;
      const moonPos = moonPosRef.current;
      if (meshRef.current) {
        const dir = new Vector3().subVectors(moonPos, earthPosRef.current).normalize();
        meshRef.current.position.copy(earthPos).addScaledVector(dir, MOON_ORBIT_RADIUS_GLOBAL);
      }
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        name="moon-fallback"
        onClick={(e) => {
          e.stopPropagation();
          goToBody('moon');
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      />
      {/* Eje de rotación axial de la Luna — visible solo cuando showRotationAxes=true */}
      <RotationAxisLine
        radius={moonRadius}
        tiltDeg={MOON_AXIAL_TILT_DEG}
        visible={showRotationAxes}
      />
    </>
  );
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
