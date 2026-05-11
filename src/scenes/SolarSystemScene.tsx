/**
 * SolarSystemScene — escena principal R3F del Sistema Solar.
 *
 * Compone todos los componentes 3D:
 * - <Sun> con shader procedural
 * - Modo global: <Planet> × 8 + <Saturn> + <PlanetMoon> + <AsteroidBelt> + <OrbitPath> × 9
 * - Modo local: planeta seleccionado (full detail) + <DistantMarker> para el resto +
 *   <PlanetMoon> si Tierra seleccionada + directionalLight para sombras Luna↔Tierra
 * - <CameraController> con OrbitControls + teclado
 * - <Stars> de Drei como fondo
 * - <KnownEventsLayer> cuando showKnownEvents === true (solo en modo local)
 *
 * Lee el dataset de planetas con usePlanetsData.
 * Lee el nivel pedagógico activo del store.
 * Canvas configurado con dpr={[1,2]} y gl.powerPreference='high-performance'.
 */

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Vector3, AdditiveBlending } from 'three';
import type {
  Vector3 as Vector3Type,
  Group,
  DirectionalLight as DirectionalLightType,
} from 'three';
import { useAppStore } from '@/store/useAppStore';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { usePlanetPosition, computePosition } from '@/scenes/hooks/usePlanetPosition';
import { useGpuCapability } from '@/scenes/hooks/useGpuCapability';
import { OriginOffsetProvider, useOriginOffset } from '@/scenes/contexts/OriginOffsetContext';
import { computeMoonPosition, useMoonPosition } from '@/scenes/hooks/useMoonPosition';
import { getJD } from '@/scenes/simulationClock';
import { Sun } from '@/scenes/components/Sun';
import { Planet } from '@/scenes/components/Planet';
import { Saturn } from '@/scenes/components/Saturn';
import { PlanetMoon } from '@/scenes/components/PlanetMoon';
import { AsteroidBelt } from '@/scenes/components/AsteroidBelt';
import { OrbitPath } from '@/scenes/components/OrbitPath';
import { CameraController } from '@/scenes/components/CameraController';
import { DistantMarker } from '@/scenes/components/DistantMarker';
import { BodyMarker } from '@/scenes/components/BodyMarker';
import { KnownEventsLayer } from '@/scenes/components/KnownEventsLayer';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import type { GpuCapabilityExtended } from '@/scenes/components/Sun';
import type { BodyId, PlanetId, PlanetData } from '@/scenes/data/types';
import { SimulationTicker } from '@/scenes/SimulationTicker';
import { PausedBridge } from '@/scenes/PausedBridge';
import { localVisualRadius, localVisualDistanceFromKm } from '@/scenes/scale';
import { EARTH_FALLBACK_DATA } from '@/scenes/data/earthFallback';
import { MOON_ORBITAL_ELEMENTS } from '@/scenes/data/moon';
import { applyOrbitalRotation, degToRad, solveKeplerNewtonRaphson } from '@/scenes/orbital';

// ---------------------------------------------------------------------------
// Constantes para órbita lunar
// ---------------------------------------------------------------------------

const MOON_ORBIT_SEGMENTS = 128; // Aumentado para suavidad (era 64)

/** Distancia de la luz direccional al origen (unidades de escena) */
const SHADOW_LIGHT_DISTANCE = 50;

// ---------------------------------------------------------------------------
// OriginTracker — calcula el offset del origen de referencia (Phase C)
// ---------------------------------------------------------------------------

/**
 * OriginTracker — componente interno que actualiza el OriginOffsetContext cada frame.
 *
 * Se registra en useFrame con priority -1 para ejecutarse ANTES que los renders
 * de los cuerpos celestes (que usan priority 0 por defecto). Esto garantiza que
 * todos los consumidores leen el offset correcto del frame actual (no el anterior).
 *
 * En modo global: offset = (0,0,0) — sin cambio.
 * En modo local:  offset = posición absoluta del cuerpo seleccionado.
 *   Nota: se llama computePosition / computeMoonPosition SIN offset (originOffset = 0)
 *   para obtener la posición absoluta — esto NO es recursivo.
 */
interface OriginTrackerProps {
  /** Datos de los planetas para poder computar posición absoluta */
  planets: readonly PlanetData[];
  level: PedagogicalLevel;
}

function OriginTracker({ planets, level }: OriginTrackerProps) {
  const offsetRef = useOriginOffset();
  const selectedBody = useAppStore((s) => s.selectedBody);
  const viewMode = useAppStore((s) => s.viewMode);

  useFrame(
    () => {
      if (viewMode !== 'local' || !selectedBody) {
        // Modo global o sin selección: offset = (0,0,0)
        offsetRef.current.set(0, 0, 0);
        return;
      }

      const jd = getJD();

      if (selectedBody === 'moon') {
        // La Luna: necesita la posición de la Tierra primero
        const earthData = planets.find((p) => p.id === 'earth');
        if (!earthData) {
          offsetRef.current.set(0, 0, 0);
          return;
        }
        const earthAbs = computePosition(earthData, level, jd, 'local');
        const earthVec = new Vector3(earthAbs.x, earthAbs.y, earthAbs.z);
        // Posición absoluta de la Luna (sin offset → no recursivo)
        const moonAbs = computeMoonPosition(earthVec, jd);
        offsetRef.current.copy(moonAbs);
      } else {
        // Planeta estándar: computePosition SIN offset → posición absoluta
        const planetData = planets.find((p) => p.id === selectedBody);
        if (!planetData) {
          offsetRef.current.set(0, 0, 0);
          return;
        }
        const abs = computePosition(planetData, level, jd, 'local');
        offsetRef.current.set(abs.x, abs.y, abs.z);
      }
    },
    -1, // Priority -1: se ejecuta ANTES que los renders (priority 0)
  );

  return null;
}

// ---------------------------------------------------------------------------
// MoonOrbitPath — círculo que representa la órbita de la Luna en modo local
// ---------------------------------------------------------------------------

/**
 * Dibuja la órbita inclinada de la Luna centrada en la posición actual de la Tierra.
 *
 * Genera N puntos usando applyOrbitalRotation con los elementos geocéntricos de
 * MOON_ORBITAL_ELEMENTS — incluye la inclinación ~5.14° respecto a la eclíptica.
 * El path se actualiza cada frame para seguir la posición de la Tierra.
 */
function MoonOrbitPath() {
  const groupRef = useRef<Group>(null);
  const level = useAppStore((s) => s.level);
  const gpuRaw = useGpuCapability();
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK_DATA;
  const earthPosRef = usePlanetPosition(earthData, level);

  // Calcular los puntos de la órbita inclinada usando applyOrbitalRotation
  // Muestreamos la anomalía media uniformemente en [0, 2π] — geometría estática
  const points = useMemo(() => {
    const {
      semi_major_axis_km,
      eccentricity,
      inclination_deg,
      longitude_ascending_node_deg,
      argument_perihelion_deg,
      orbital_period_days,
      mean_anomaly_J2000_deg,
    } = MOON_ORBITAL_ELEMENTS;

    const a = localVisualDistanceFromKm(semi_major_axis_km);
    const omega = degToRad(argument_perihelion_deg);
    const Omega = degToRad(longitude_ascending_node_deg);
    const inc = degToRad(inclination_deg);
    const e = eccentricity;
    const n = (2 * Math.PI) / orbital_period_days;
    const M0 = degToRad(mean_anomaly_J2000_deg);

    const pts: [number, number, number][] = [];
    const out = new Vector3();

    for (let i = 0; i <= MOON_ORBIT_SEGMENTS; i++) {
      // Distribuir uniformemente en anomalía media a lo largo de una órbita
      const M = M0 + n * (i / MOON_ORBIT_SEGMENTS) * orbital_period_days;
      const E = solveKeplerNewtonRaphson(M, e, 1e-6, 8);
      const nu =
        2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
      const r = a * (1 - e * Math.cos(E));
      applyOrbitalRotation(out, r, nu, omega, Omega, inc);
      pts.push([out.x, out.y, out.z]);
    }

    return pts;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    // earthPosRef.current ya tiene aplicado el originOffset (desde usePlanetPosition via contexto).
    // En modo local: es la posición de la Tierra relativa al cuerpo seleccionado.
    // En modo global: es la posición heliocéntrica absoluta.
    const pos = earthPosRef.current;
    groupRef.current.position.set(pos.x, pos.y, pos.z);
  });

  // null mientras detecta → tratar como 'mid' (muestra glow como fallback)
  const gpuCap = gpuRaw ?? 'mid';
  const showMoonGlow = gpuCap !== 'low';

  return (
    <group ref={groupRef}>
      {/* Glow aditivo — solo GPU mid/high */}
      {showMoonGlow && (
        <Line
          points={points}
          color="#aaccff"
          lineWidth={4}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
          depthWrite={false}
          renderOrder={-1}
        />
      )}
      {/* Línea principal */}
      <Line
        points={points}
        color="#aaccff"
        lineWidth={2}
        transparent
        opacity={0.5}
        renderOrder={0}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// MoonMarker — marcador estilo NASA Eyes para localizar la Luna en local Tierra
// ---------------------------------------------------------------------------

/**
 * MoonMarker — círculo + label "Luna" siempre visible sobre la Luna real.
 *
 * En local Tierra la Luna mide ~1.74u y orbita a ~384u: con cualquier zoom
 * razonable queda como un punto sub-pixel, casi imposible de localizar.
 * Este marcador resuelve esa fricción visual sin tocar la posición real
 * (el clic sigue funcionando sobre el mesh de la Luna).
 *
 * Computa su propia posición (duplica useMoonPosition con PlanetMoon, coste
 * irrelevante: dos resoluciones de Kepler por frame).
 */
function MoonMarker() {
  const level = useAppStore((s) => s.level);
  const goToBody = useAppStore((s) => s.goToBody);
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK_DATA;
  const earthPosRef = usePlanetPosition(earthData, level);
  const moonPosRef = useMoonPosition(earthPosRef);

  return (
    <BodyMarker
      positionRef={moonPosRef}
      label="Luna"
      color="#aaccff"
      onClick={() => goToBody('moon')}
    />
  );
}

// ---------------------------------------------------------------------------
// LocalOrbitPaths — órbitas heliocentricas traducidas al frame local
// ---------------------------------------------------------------------------

interface LocalOrbitPathsProps {
  planets: readonly PlanetData[];
  level: PedagogicalLevel;
}

/**
 * Renderiza todas las órbitas heliocentricas en modo local, trasladas por -offset
 * para que coincidan con la posición real del Sol en el frame del cuerpo seleccionado.
 *
 * Las órbitas se calculan en espacio heliocéntrico (Sun at origin).
 * En modo local el Sol está en -offset. Un grupo posicionado en (-offset)
 * alinea las órbitas correctamente con el Sol visible.
 */
function LocalOrbitPaths({ planets, level }: LocalOrbitPathsProps) {
  const groupRef = useRef<Group>(null);
  const originOffsetRef = useOriginOffset();

  useFrame(() => {
    if (!groupRef.current) return;
    const offset = originOffsetRef.current;
    groupRef.current.position.set(-offset.x, -offset.y, -offset.z);
  });

  return (
    <group ref={groupRef}>
      {planets.map((planet) => (
        <OrbitPath key={`local-orbit-${planet.id}`} planet={planet} level={level} opacity={0.2} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// SunAndLightUpdater — actualiza posición del Sol y de la luz en useFrame
// ---------------------------------------------------------------------------

interface SunAndLightUpdaterProps {
  sunGroupRef: React.MutableRefObject<Group | null>;
  shadowLightRef: React.MutableRefObject<DirectionalLightType | null>;
  originOffsetRef: React.MutableRefObject<Vector3>;
  viewMode: 'global' | 'local';
  showShadowLight: boolean;
}

/**
 * SunAndLightUpdater — componente nulo que gestiona actualizaciones imperativas
 * de la posición del Sol y la luz direccional basándose en el OriginOffset.
 *
 * - En modo local: sunGroup.position = -offset (Sol aparece en su posición relativa)
 * - En modo local con luz activa: directionalLight.position = -offset.normalized() * 50
 * - En modo global: sunGroup.position = (0,0,0)
 */
function SunAndLightUpdater({
  sunGroupRef,
  shadowLightRef,
  originOffsetRef,
  viewMode,
  showShadowLight,
}: SunAndLightUpdaterProps) {
  useFrame(() => {
    const offset = originOffsetRef.current;
    const sunGroup = sunGroupRef.current;
    const light = shadowLightRef.current;

    if (viewMode === 'local') {
      // Sol: posicionado en -offset (el Sol está en la dirección opuesta al cuerpo seleccionado)
      if (sunGroup) {
        sunGroup.position.set(-offset.x, -offset.y, -offset.z);
      }

      // Luz direccional: apunta desde la dirección del Sol hacia el origen
      if (light && showShadowLight) {
        const len = offset.length();
        if (len > 1e-6) {
          // Dirección: desde el Sol (en -offset) hacia el origen (0,0,0)
          // La luz está en la posición del Sol, iluminando hacia el origen
          light.position.set(
            (-offset.x / len) * SHADOW_LIGHT_DISTANCE,
            (-offset.y / len) * SHADOW_LIGHT_DISTANCE,
            (-offset.z / len) * SHADOW_LIGHT_DISTANCE,
          );
        } else {
          // Fallback: offset casi cero (no debería ocurrir en modo local)
          light.position.set(1, 0, 0).multiplyScalar(SHADOW_LIGHT_DISTANCE);
        }
      }
    } else {
      // Modo global: Sol en el origen
      if (sunGroup) {
        sunGroup.position.set(0, 0, 0);
      }
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Subcomponente interno — el árbol R3F (dentro del Canvas)
// ---------------------------------------------------------------------------

interface SolarSystemContentProps {
  level: PedagogicalLevel;
  gpu: GpuCapabilityExtended;
  reducedMotion: boolean;
  onSelectPlanet: (id: BodyId | null) => void;
  planetPositionsRef: React.MutableRefObject<Record<string, Vector3Type>>;
  viewMode: 'global' | 'local';
  selectedBody: BodyId | null;
  showKnownEvents: boolean;
}

function SolarSystemContent({
  level,
  gpu,
  reducedMotion,
  onSelectPlanet,
  planetPositionsRef,
  viewMode,
  selectedBody,
  showKnownEvents,
}: SolarSystemContentProps) {
  // selectedPlanet: PlanetId | null — extraído de selectedBody excluyendo 'moon'
  const selectedPlanet = selectedBody !== 'moon' ? selectedBody : null;
  const { data } = usePlanetsData();
  // Ref al grupo que envuelve al Sol — su posición es -offset en modo local
  const sunGroupRef = useRef<Group>(null);
  // Ref a la luz direccional — se reposiciona en modo local
  const shadowLightRef = useRef<DirectionalLightType>(null);
  // Offset del origen: leer del context para actualizar el Sol y la luz
  const originOffsetRef = useOriginOffset();

  if (!data) return null;

  const planets = data.planets;
  const saturnData = planets.find((p) => p.id === 'saturn');
  const nonSaturnPlanets = planets.filter((p) => p.id !== 'saturn');

  // Wrapper tipado como (string) → void para compatibilidad con Planet/Saturn
  const handlePlanetClick = (id: string): void => {
    onSelectPlanet(id as PlanetId);
  };

  const isLocal = viewMode === 'local';
  const isEarthSelected = selectedBody === 'earth';
  const isMoonSelected = selectedBody === 'moon';

  // Radio visual del planeta seleccionado en modo local (escala real: 1 u = 1000 km).
  // Se pasa a CameraController para calcular el offset prudente al entrar en modo local.
  const selectedPlanetData = selectedPlanet ? planets.find((p) => p.id === selectedPlanet) : null;
  const selectedPlanetRadius =
    isLocal && selectedPlanetData ? localVisualRadius(selectedPlanetData.radius_km) : undefined;

  return (
    <>
      {/* Único punto de avance del simulationClock — debe ser el primer hijo */}
      <SimulationTicker />

      {/* OriginTracker — calcula el offset del origen ANTES que los renders (priority -1) */}
      <OriginTracker planets={planets} level={level} />

      {/* Sun + directionalLight updater — actualiza en useFrame DESPUÉS de OriginTracker */}
      <SunAndLightUpdater
        sunGroupRef={sunGroupRef}
        shadowLightRef={shadowLightRef}
        originOffsetRef={originOffsetRef}
        viewMode={viewMode}
        showShadowLight={isLocal && (isEarthSelected || isMoonSelected)}
      />

      {/* Luz ambiental — baja para conservar contraste claro/oscuro natural */}
      <ambientLight intensity={0.18} />

      {/* Glow cósmico sutil del fondo estelar */}
      <hemisphereLight color="#dde6ff" groundColor="#1a1142" intensity={0.1} />

      {/* Luz direccional para sombras Luna↔Tierra — solo en modo local con Tierra o Luna */}
      {isLocal && (isEarthSelected || isMoonSelected) && (
        <directionalLight
          ref={shadowLightRef}
          position={[0, SHADOW_LIGHT_DISTANCE, 0]}
          intensity={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0005}
        />
      )}

      {/* Cámara y controles — en modo local el CameraController no hace follow (target = origin) */}
      <CameraController
        planetPositionsRef={planetPositionsRef}
        {...(selectedPlanetRadius !== undefined && !isLocal
          ? { planetRadius: selectedPlanetRadius }
          : {})}
      />

      {/* El Sol — envuelto en grupo cuya posición se actualiza en SunAndLightUpdater.
          La pointLight vive DENTRO del grupo para que en modo local (cuando el grupo
          se desplaza a -offset) la luz acompañe al Sol automáticamente. */}
      <group ref={sunGroupRef}>
        <Sun capability={gpu} reducedMotion={reducedMotion} />
        {/* decay=0 alcanza Plutón en modo global; en modo local ilumina desde la posición real del Sol */}
        <pointLight intensity={6} distance={0} decay={0} />
      </group>

      {/* ——————————————————————————————— MODO GLOBAL ——————————————————————————————— */}
      {!isLocal && (
        <>
          {/* Planetas (excepto Saturno) */}
          {nonSaturnPlanets.map((planet) => (
            <React.Fragment key={planet.id}>
              <Planet
                planet={planet}
                level={level}
                variant={planet.classification === 'dwarf_planet' ? 'dwarf' : 'normal'}
                onClick={handlePlanetClick}
                positionsRef={planetPositionsRef}
              />
              <OrbitPath planet={planet} level={level} />
            </React.Fragment>
          ))}

          {/* Saturno con anillos */}
          {saturnData && (
            <>
              <Saturn
                planet={saturnData}
                level={level}
                onClick={handlePlanetClick}
                positionsRef={planetPositionsRef}
              />
              <OrbitPath planet={saturnData} level={level} />
            </>
          )}

          {/* Luna de la Tierra */}
          <PlanetMoon positionsRef={planetPositionsRef} />

          {/* Cinturón de asteroides */}
          <AsteroidBelt config={data.asteroid_belt} />

          {/* Nota: MoonOrbitPath NO se muestra en global — usa escala real (~384 u),
              que en escala didáctica global queda más allá de todos los planetas.
              La órbita lunar es visible en modo local (Tierra o Luna seleccionados). */}
        </>
      )}

      {/* ——————————————————————————————— MODO LOCAL ——————————————————————————————— */}
      {isLocal && selectedBody && (
        <>
          {/* ——— Caso: Luna seleccionada ——— */}
          {isMoonSelected && (
            <>
              {/* Luna como cuerpo central */}
              <PlanetMoon positionsRef={planetPositionsRef} castShadow receiveShadow />

              {/* Tierra visible con textura (referencia visual desde la Luna) */}
              {(() => {
                const earthData = planets.find((p) => p.id === 'earth');
                if (!earthData) return null;
                return (
                  <Planet
                    planet={earthData}
                    level={level}
                    variant="normal"
                    onClick={handlePlanetClick}
                    positionsRef={planetPositionsRef}
                    castShadow
                    receiveShadow
                  />
                );
              })()}

              {/* Órbita de la Luna (geocéntrica) — visible en modo local Luna */}
              <MoonOrbitPath />

              {/* DistantMarkers para Sol + otros planetas */}
              {nonSaturnPlanets
                .filter((p) => p.id !== 'earth')
                .map((planet) => (
                  <DistantMarker
                    key={`dm-${planet.id}`}
                    planet={planet}
                    positionsRef={planetPositionsRef}
                  />
                ))}
              {saturnData && (
                <DistantMarker
                  key="dm-saturn"
                  planet={saturnData}
                  positionsRef={planetPositionsRef}
                />
              )}
            </>
          )}

          {/* ——— Caso: Planeta seleccionado (no Luna) ——— */}
          {!isMoonSelected && selectedPlanet && (
            <>
              {/* Planeta seleccionado (full detail) — sin OrbitPath heliocéntrica en modo local */}
              {selectedPlanet === 'saturn' && saturnData ? (
                <Saturn
                  planet={saturnData}
                  level={level}
                  onClick={handlePlanetClick}
                  positionsRef={planetPositionsRef}
                />
              ) : (
                (() => {
                  const selectedData = planets.find((p) => p.id === selectedPlanet);
                  if (!selectedData) return null;
                  return (
                    <Planet
                      planet={selectedData}
                      level={level}
                      variant={selectedData.classification === 'dwarf_planet' ? 'dwarf' : 'normal'}
                      onClick={handlePlanetClick}
                      positionsRef={planetPositionsRef}
                      castShadow={isEarthSelected}
                      receiveShadow={isEarthSelected}
                    />
                  );
                })()
              )}

              {/* Luna de la Tierra — si Tierra seleccionada */}
              {isEarthSelected && (
                <>
                  <PlanetMoon positionsRef={planetPositionsRef} castShadow receiveShadow />
                  <MoonOrbitPath />
                  <MoonMarker />
                </>
              )}

              {/* DistantMarker para cada planeta no seleccionado */}
              {nonSaturnPlanets
                .filter((p) => p.id !== selectedPlanet)
                .map((planet) => (
                  <DistantMarker
                    key={`dm-${planet.id}`}
                    planet={planet}
                    positionsRef={planetPositionsRef}
                  />
                ))}
              {saturnData && selectedPlanet !== 'saturn' && (
                <DistantMarker
                  key="dm-saturn"
                  planet={saturnData}
                  positionsRef={planetPositionsRef}
                />
              )}
            </>
          )}

          {/* Órbitas heliocentricas en modo local — grupo posicionado en -offset
              para que las líneas se alineen con el Sol (que también está en -offset).
              Opacidad reducida para no competir visualmente con el cuerpo central. */}
          <LocalOrbitPaths planets={planets} level={level} />

          {/* Eventos conocidos (cometa Halley, etc.) */}
          {showKnownEvents && <KnownEventsLayer />}
        </>
      )}

      {/* Post-procesado: Bloom sobre el Sol — solo en GPU high, sin multisampling (caro en iGPU) */}
      {gpu === 'high' && (
        <EffectComposer enableNormalPass={false}>
          <Bloom intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.3} />
        </EffectComposer>
      )}

      {/* Monitor de rendimiento adaptativo — telemetría FPS, sin acción automática aún */}
      <PerformanceMonitor
        bounds={() => [45, 60]}
        flipflops={3}
        onDecline={() => {
          // En iteración futura: bajar dpr o desactivar bloom automáticamente
          console.warn('[perf] FPS bajo detectado, considerar adaptar calidad');
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente principal exportado
// ---------------------------------------------------------------------------

export function SolarSystemScene() {
  const level = useAppStore((s) => s.level);
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);
  const sunShaderVariant = useAppStore((s) => s.sunShaderVariant);
  const goToBody = useAppStore((s) => s.goToBody);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedBody = useAppStore((s) => s.selectedBody);
  const showKnownEvents = useAppStore((s) => s.showKnownEvents);

  const rawGpu = useGpuCapability();

  // Mapear GpuCapability → GpuCapabilityExtended (null → 'mid' como fallback)
  const gpu: GpuCapabilityExtended = rawGpu ?? 'mid';

  // Mapear sunShaderVariant a capability extendida
  const resolvedGpu: GpuCapabilityExtended = sunShaderVariant === 'texture' ? 'fallback' : gpu;

  // Ref compartido: posiciones reales de planetas (actualizadas en useFrame por Planet/Saturn)
  const planetPositionsRef = useRef<Record<string, Vector3Type>>({});

  // Shadows solo relevantes en modo local con Tierra o Luna seleccionada
  const shadowsEnabled =
    viewMode === 'local' && (selectedBody === 'earth' || selectedBody === 'moon');

  return (
    <>
      {/* PausedBridge: fuera del Canvas (no necesita useFrame/R3F).
          Sincroniza simulationSpeed === 0 → simulationClock.setPaused(). */}
      <PausedBridge />

      <Canvas
        data-testid="solar-canvas"
        dpr={1}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          // logarithmicDepthBuffer necesario en modo local: la escena abarca desde
          // ~6 unidades (radio Tierra) hasta ~5,900,000 unidades (Plutón).
          // Sin él, el Z-fighting entre objetos a distintas distancias es grave.
          logarithmicDepthBuffer: true,
        }}
        // far: 1_000_000 — cubre hasta Júpiter (778,500 u) en escala real con margen.
        // Para ver Plutón en local se necesitarían ~6M unidades, pero en modo local
        // el planeta enfocado siempre está próximo a la cámara.
        camera={{ position: [0, 35, 70], fov: 60, near: 0.1, far: 1_000_000 }}
        shadows={shadowsEnabled}
      >
        <Suspense fallback={null}>
          {/* OriginOffsetProvider: context que distribuye el offset del origen a todos
              los consumidores (Planet, Saturn, PlanetMoon, Sun group, directionalLight).
              Debe estar DENTRO del Canvas para que useFrame funcione en sus hijos. */}
          <OriginOffsetProvider>
            <SolarSystemContent
              level={level}
              gpu={resolvedGpu}
              reducedMotion={prefersReducedMotion}
              onSelectPlanet={goToBody}
              planetPositionsRef={planetPositionsRef}
              viewMode={viewMode}
              selectedBody={selectedBody}
              showKnownEvents={showKnownEvents}
            />
          </OriginOffsetProvider>
        </Suspense>
      </Canvas>
    </>
  );
}

SolarSystemScene.displayName = 'SolarSystemScene';
