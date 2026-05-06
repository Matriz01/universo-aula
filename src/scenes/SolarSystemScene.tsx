/**
 * SolarSystemScene — escena principal R3F del Sistema Solar.
 *
 * Compone todos los componentes 3D:
 * - <TimeTicker> avanza simulationTime en el store (único tick central de tiempo)
 * - <Sun> con shader procedural
 * - Modo global: <Planet> × 8 + <Saturn> + <PlanetMoon> + <AsteroidBelt> + <OrbitPath> × 9
 * - Modo local: planeta seleccionado (full detail) + <DistantMarker> para el resto +
 *   <PlanetMoon> si Tierra seleccionada + directionalLight para sombras Luna↔Tierra
 * - <CameraController> con OrbitControls + teclado
 * - <Stars> de Drei como fondo
 * - <KnownEventsLayer> cuando showKnownEvents === true (solo en modo local)
 *
 * Post-refactor-C: simulationTime es la única fuente de verdad para posiciones orbitales.
 * planetPositionsRef ya no se propaga a Planet/Saturn/CameraController.
 *
 * Lee el dataset de planetas con usePlanetsData.
 * Lee el nivel pedagógico activo del store.
 * Canvas configurado con dpr={[1,2]} y gl.powerPreference='high-performance'.
 */

import React, { Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { useBodyPosition } from '@/scenes/hooks/useBodyPosition';
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
import type { GpuCapabilityExtended } from '@/scenes/components/Sun';
import type { PlanetId, PlanetData } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Constantes para el tick de tiempo central
// ---------------------------------------------------------------------------

/** A speed=1, avanzamos 1 día simulado por segundo real */
const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// TimeTicker — único useFrame que avanza simulationTime
// Debe montarse una sola vez dentro del Canvas
// ---------------------------------------------------------------------------

function TimeTicker() {
  useFrame((_, dt) => {
    const speed = useAppStore.getState().simulationSpeed;
    if (speed === 0) return;
    const current = useAppStore.getState().simulationTime;
    const advanceMs = dt * speed * MS_PER_DAY;
    useAppStore.getState().setSimulationTime(new Date(current.getTime() + advanceMs));
  });
  return null;
}

// ---------------------------------------------------------------------------
// Constantes para órbita lunar
// ---------------------------------------------------------------------------

const MOON_ORBIT_RADIUS_LOCAL = 384_400 / 1000; // 384.4 unidades (1 u = 1000 km)
const MOON_ORBIT_SEGMENTS = 64;

// Objeto Earth mínimo de fallback para useBodyPosition (cuando data aún no carga)
const EARTH_FALLBACK_DATA: PlanetData = {
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
// MoonOrbitPath — círculo que representa la órbita de la Luna en modo local
// ---------------------------------------------------------------------------

/**
 * Dibuja la órbita de la Luna centrada en la posición actual de la Tierra.
 * Solo se usa en modo local cuando la Tierra está seleccionada.
 * Calcula la posición de la Tierra con useBodyPosition (time-driven).
 */
function MoonOrbitPath() {
  const time = useAppStore((s) => s.simulationTime);
  const viewMode = useAppStore((s) => s.viewMode);
  const { data } = usePlanetsData();
  const earthData = data?.planets.find((p) => p.id === 'earth') ?? EARTH_FALLBACK_DATA;

  // Posición de la Tierra time-driven
  const earthPos = useBodyPosition(earthData, time, viewMode);

  // Pre-computamos los puntos del círculo (radio = 384.4 unidades)
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= MOON_ORBIT_SEGMENTS; i++) {
      const theta = (i / MOON_ORBIT_SEGMENTS) * Math.PI * 2;
      pts.push([
        MOON_ORBIT_RADIUS_LOCAL * Math.cos(theta),
        0,
        MOON_ORBIT_RADIUS_LOCAL * Math.sin(theta),
      ]);
    }
    return pts;
  }, []);

  // Calcular centro del grupo con la posición actual de la Tierra
  const groupPos = new Vector3(earthPos.x, earthPos.y, earthPos.z);

  return (
    <group position={groupPos}>
      <Line points={points} color="#aaccff" lineWidth={1} transparent opacity={0.5} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Subcomponente interno — el árbol R3F (dentro del Canvas)
// ---------------------------------------------------------------------------

interface SolarSystemContentProps {
  level: 'explorador' | 'aprendiz' | 'investigador';
  gpu: GpuCapabilityExtended;
  reducedMotion: boolean;
  onSelectPlanet: (id: PlanetId | null) => void;
  viewMode: 'global' | 'local';
  selectedPlanet: PlanetId | null;
  showKnownEvents: boolean;
}

function SolarSystemContent({
  level,
  gpu,
  reducedMotion,
  onSelectPlanet,
  viewMode,
  selectedPlanet,
  showKnownEvents,
}: SolarSystemContentProps) {
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
  const isEarthSelected = selectedPlanet === 'earth';

  return (
    <>
      {/* Tick central de tiempo — único en la escena */}
      <TimeTicker />

      {/* Luz ambiental — baja para conservar contraste claro/oscuro natural */}
      <ambientLight intensity={0.18} />

      {/* Glow cósmico sutil del fondo estelar */}
      <hemisphereLight color="#dde6ff" groundColor="#1a1142" intensity={0.1} />

      {/* Luz puntual en el Sol — decay 0 alcanza Plutón; sin shadows (irreales + caros) */}
      <pointLight position={[0, 0, 0]} intensity={6} distance={0} decay={0} />

      {/* Luz direccional para sombras Luna↔Tierra — solo en modo local con Tierra */}
      {isLocal && isEarthSelected && (
        <directionalLight
          position={[0, 10, 0]}
          intensity={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0005}
        />
      )}

      {/* Cámara y controles */}
      <CameraController />

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
                variant={planet.classification === 'dwarf_planet' ? 'dwarf' : 'normal'}
                onClick={handlePlanetClick}
              />
              <OrbitPath planet={planet} level={level} />
            </React.Fragment>
          ))}

          {/* Saturno con anillos */}
          {saturnData && (
            <>
              <Saturn planet={saturnData} onClick={handlePlanetClick} />
              <OrbitPath planet={saturnData} level="aprendiz" />
            </>
          )}

          {/* Luna de la Tierra */}
          <PlanetMoon />

          {/* Cinturón de asteroides */}
          <AsteroidBelt config={data.asteroid_belt} />
        </>
      )}

      {/* ——————————————————————————————— MODO LOCAL ——————————————————————————————— */}
      {isLocal && selectedPlanet && (
        <>
          {/* Planeta seleccionado (full detail) */}
          {selectedPlanet === 'saturn' && saturnData ? (
            <>
              <Saturn planet={saturnData} onClick={handlePlanetClick} />
              <OrbitPath planet={saturnData} level="aprendiz" />
            </>
          ) : (
            (() => {
              const selectedData = planets.find((p) => p.id === selectedPlanet);
              if (!selectedData) return null;
              return (
                <>
                  <Planet
                    planet={selectedData}
                    variant={selectedData.classification === 'dwarf_planet' ? 'dwarf' : 'normal'}
                    onClick={handlePlanetClick}
                    castShadow={isEarthSelected}
                    receiveShadow={isEarthSelected}
                  />
                  <OrbitPath planet={selectedData} level="aprendiz" />
                </>
              );
            })()
          )}

          {/* Luna de la Tierra — solo si Tierra seleccionada */}
          {isEarthSelected && (
            <>
              <PlanetMoon castShadow receiveShadow />
              <MoonOrbitPath />
            </>
          )}

          {/* DistantMarker para cada planeta no seleccionado */}
          {nonSaturnPlanets
            .filter((p) => p.id !== selectedPlanet)
            .map((planet) => (
              <DistantMarker key={`dm-${planet.id}`} planet={planet} />
            ))}
          {saturnData && selectedPlanet !== 'saturn' && (
            <DistantMarker key="dm-saturn" planet={saturnData} />
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
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const showKnownEvents = useAppStore((s) => s.showKnownEvents);

  const rawGpu = useGpuCapability();

  // Mapear GpuCapability → GpuCapabilityExtended (null → 'mid' como fallback)
  const gpu: GpuCapabilityExtended = rawGpu ?? 'mid';

  // Mapear sunShaderVariant a capability extendida
  const resolvedGpu: GpuCapabilityExtended = sunShaderVariant === 'texture' ? 'fallback' : gpu;

  // Shadows solo relevantes en modo local con Tierra seleccionada
  const shadowsEnabled = viewMode === 'local' && selectedPlanet === 'earth';

  return (
    <Canvas
      data-testid="solar-canvas"
      dpr={1}
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        stencil: false,
        logarithmicDepthBuffer: true,
      }}
      camera={{ position: [0, 35, 70], fov: 60, near: 0.1, far: 1_000_000 }}
      shadows={shadowsEnabled}
    >
      <Suspense fallback={null}>
        <SolarSystemContent
          level={level}
          gpu={resolvedGpu}
          reducedMotion={prefersReducedMotion}
          onSelectPlanet={goToBody}
          viewMode={viewMode}
          selectedPlanet={selectedPlanet}
          showKnownEvents={showKnownEvents}
        />
      </Suspense>
    </Canvas>
  );
}

SolarSystemScene.displayName = 'SolarSystemScene';
