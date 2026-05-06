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
 *   · local con Tierra → 384.4 unidades (1u = 1000 km, escala real)
 *
 * Post-refactor-C: la posición de la Tierra viene de useBodyPosition
 * (time-driven), no de positionsRef.
 */

import React, { useRef, useMemo, Suspense } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh, Vector3 } from 'three';
import { SphereGeometry, MeshStandardMaterial } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { visualRadius, localVisualRadius, localVisualDistanceFromKm } from '@/scenes/scale';
import { useBodyPosition } from '@/scenes/hooks/useBodyPosition';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import type { PlanetData } from '@/scenes/data/types';

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

// Datos mínimos de la Tierra para useBodyPosition cuando data no ha cargado
const EARTH_FALLBACK: PlanetData = {
  id: 'earth',
  classification: 'terrestrial',
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
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PlanetMoonProps {
  /** @deprecated earthPosition ya no se usa; posición viene de useBodyPosition */
  earthPosition?: [number, number, number];
  /** @deprecated positionsRef ya no se usa; posición viene de useBodyPosition */
  positionsRef?: MutableRefObject<Record<string, Vector3>>;
  /** Activar sombras — solo en modo local con Tierra seleccionada (eclipses) */
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ---------------------------------------------------------------------------
// Subcomponente con textura (dentro de Suspense)
// ---------------------------------------------------------------------------

function MoonMeshInner({ castShadow: cs, receiveShadow: rs }: PlanetMoonProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  const time = useAppStore((s) => s.simulationTime);
  const speed = useAppStore((s) => s.simulationSpeed);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);

  // Datos de la Tierra para calcular su posición
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK;

  // Posición de la Tierra time-driven (no depende de positionsRef)
  const earthPos = useBodyPosition(earthData, time, viewMode);

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

  useFrame((_, dt) => {
    elapsed.current += dt * speed;

    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

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

function MoonFallback(_props: PlanetMoonProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  const time = useAppStore((s) => s.simulationTime);
  const speed = useAppStore((s) => s.simulationSpeed);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);

  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK;
  const earthPos = useBodyPosition(earthData, time, viewMode);

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

  useFrame((_, dt) => {
    elapsed.current += dt * speed;
    const n = (2 * Math.PI) / MOON_PERIOD_DAYS;
    const theta = n * elapsed.current;

    if (meshRef.current) {
      meshRef.current.position.set(
        earthPos.x + orbitRadius * Math.cos(theta),
        earthPos.y,
        earthPos.z + orbitRadius * Math.sin(theta),
      );
      meshRef.current.rotation.y = theta;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} name="moon-fallback" />;
}

// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

export const PlanetMoon = React.memo(function PlanetMoon({
  castShadow,
  receiveShadow,
}: PlanetMoonProps) {
  const shared = {
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
