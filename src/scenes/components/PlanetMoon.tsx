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
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { getJD, J2000_JD } from '@/scenes/simulationClock';

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
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const level = useAppStore((s) => s.level);

  // Obtenemos datos de planetas para encontrar la Tierra en modo local
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? null;

  // Hook de posición de la Tierra — siempre invocado (reglas de hooks).
  // Solo se usa en modo local; en global se lee positionsRef como antes.
  // Si earthData es null, pasamos un objeto mínimo que da posición (0,0,0).
  const earthPosRef = usePlanetPosition(
    earthData ?? {
      id: 'earth',
      classification: 'terrestrial' as const,
      radius_km: 6371,
      mass_kg: 5.972e24,
      density_g_cm3: 5.514,
      gravity_m_s2: 9.807,
      rotation_period_h: 23.9345,
      axial_tilt_deg: 23.4393,
      mean_temperature_k: 288,
      semi_major_axis_AU: 1.0,
      eccentricity: 0.01671,
      inclination_deg: 0.00005,
      longitude_ascending_node_deg: -11.26064,
      argument_perihelion_deg: 114.20783,
      mean_anomaly_J2000_deg: 358.617,
      orbital_period_days: 365.256,
      color_hex: '#4a90e2',
      has_rings: false,
      moons_count: 1,
      texture_base: '/textures/earth/',
    },
    level,
  );

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

  useFrame(() => {
    // Ángulo orbital derivado del JD global — sin elapsed.current local (REQ-ORB-2)
    const jd = getJD();
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * (jd - J2000_JD);

    // En modo local: usar la posición calculada directamente por usePlanetPosition
    // En modo global: usar positionsRef (actualizado por <Planet>)
    let earthPos: Vector3;
    if (viewMode === 'local') {
      earthPos = earthPosRef.current;
    } else {
      const live = positionsRef?.current?.earth;
      earthPos = live ?? fallbackEarthPos;
    }

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
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const level = useAppStore((s) => s.level);

  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? null;

  const earthPosRef = usePlanetPosition(
    earthData ?? {
      id: 'earth',
      classification: 'terrestrial' as const,
      radius_km: 6371,
      mass_kg: 5.972e24,
      density_g_cm3: 5.514,
      gravity_m_s2: 9.807,
      rotation_period_h: 23.9345,
      axial_tilt_deg: 23.4393,
      mean_temperature_k: 288,
      semi_major_axis_AU: 1.0,
      eccentricity: 0.01671,
      inclination_deg: 0.00005,
      longitude_ascending_node_deg: -11.26064,
      argument_perihelion_deg: 114.20783,
      mean_anomaly_J2000_deg: 358.617,
      orbital_period_days: 365.256,
      color_hex: '#4a90e2',
      has_rings: false,
      moons_count: 1,
      texture_base: '/textures/earth/',
    },
    level,
  );

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

  useFrame(() => {
    // Ángulo orbital derivado del JD global — sin elapsed.current local (REQ-ORB-2)
    const jd = getJD();
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * (jd - J2000_JD);

    let earthPos: Vector3;
    if (viewMode === 'local') {
      earthPos = earthPosRef.current;
    } else {
      const live = positionsRef?.current?.earth;
      earthPos = live ?? fallbackEarthPos;
    }

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
