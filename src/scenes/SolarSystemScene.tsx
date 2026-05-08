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
import { Vector3 } from 'three';
import type { Vector3 as Vector3Type, Group } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { usePlanetPosition } from '@/scenes/hooks/usePlanetPosition';
import { useGpuCapability } from '@/scenes/hooks/useGpuCapability';
import { Sun } from '@/scenes/components/Sun';
import { Planet } from '@/scenes/components/Planet';
import { Saturn } from '@/scenes/components/Saturn';
import { PlanetMoon } from '@/scenes/components/PlanetMoon';
import { AsteroidBelt } from '@/scenes/components/AsteroidBelt';
import { OrbitPath } from '@/scenes/components/OrbitPath';
import { CameraController } from '@/scenes/components/CameraController';
import { DistantMarker } from '@/scenes/components/DistantMarker';
import { KnownEventsLayer } from '@/scenes/components/KnownEventsLayer';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import type { GpuCapabilityExtended } from '@/scenes/components/Sun';
import type { BodyId, PlanetId } from '@/scenes/data/types';
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
    const pos = earthPosRef.current;
    groupRef.current.position.set(pos.x, pos.y, pos.z);
  });

  return (
    <group ref={groupRef}>
      <Line points={points} color="#aaccff" lineWidth={1} transparent opacity={0.5} />
    </group>
  );
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
  // Para la Luna usamos su propio radio.
  const selectedPlanetData = selectedPlanet ? planets.find((p) => p.id === selectedPlanet) : null;
  const selectedPlanetRadius =
    isLocal && selectedPlanetData ? localVisualRadius(selectedPlanetData.radius_km) : undefined;

  // En modo local: posición del Sol (0,0,0) hacia el planeta seleccionado
  // La luz direccional sigue al planeta seleccionado para simular sombras desde el Sol
  const shadowLightPos = new Vector3(0, 10, 0); // posición por defecto
  if (isLocal && selectedPlanet && planetPositionsRef.current[selectedPlanet]) {
    const pPos = planetPositionsRef.current[selectedPlanet];
    if (pPos) {
      // Dirección de la luz: desde el Sol (0,0,0) hacia el planeta, pero invertida
      // para que la luz LLEGUE al planeta desde el Sol
      const dir = pPos.clone().normalize();
      shadowLightPos.copy(dir.multiplyScalar(50));
    }
  }

  return (
    <>
      {/* Único punto de avance del simulationClock — debe ser el primer hijo */}
      <SimulationTicker />

      {/* Luz ambiental — baja para conservar contraste claro/oscuro natural */}
      <ambientLight intensity={0.18} />

      {/* Glow cósmico sutil del fondo estelar */}
      <hemisphereLight color="#dde6ff" groundColor="#1a1142" intensity={0.1} />

      {/* Luz puntual en el Sol — decay 0 alcanza Plutón; sin shadows (irreales + caros) */}
      <pointLight position={[0, 0, 0]} intensity={6} distance={0} decay={0} />

      {/* Luz direccional para sombras Luna↔Tierra — solo en modo local con Tierra o Luna */}
      {isLocal && (isEarthSelected || isMoonSelected) && (
        <directionalLight
          position={shadowLightPos.toArray()}
          intensity={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0005}
        />
      )}

      {/* Cámara y controles */}
      <CameraController
        planetPositionsRef={planetPositionsRef}
        {...(selectedPlanetRadius !== undefined ? { planetRadius: selectedPlanetRadius } : {})}
      />

      {/* El Sol — siempre presente */}
      <Sun capability={gpu} reducedMotion={reducedMotion} />

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

          {/* MoonOrbitPath en modo global */}
          <MoonOrbitPath />
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
        </Suspense>
      </Canvas>
    </>
  );
}

SolarSystemScene.displayName = 'SolarSystemScene';
