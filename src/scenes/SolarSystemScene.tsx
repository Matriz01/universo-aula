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

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import type { Vector3 as Vector3Type } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
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
import type { PlanetId } from '@/scenes/data/types';

// ---------------------------------------------------------------------------
// Subcomponente interno — el árbol R3F (dentro del Canvas)
// ---------------------------------------------------------------------------

interface SolarSystemContentProps {
  level: PedagogicalLevel;
  gpu: GpuCapabilityExtended;
  reducedMotion: boolean;
  onSelectPlanet: (id: PlanetId | null) => void;
  planetPositionsRef: React.MutableRefObject<Record<string, Vector3Type>>;
  viewMode: 'global' | 'local';
  selectedPlanet: PlanetId | null;
  showKnownEvents: boolean;
}

function SolarSystemContent({
  level,
  gpu,
  reducedMotion,
  onSelectPlanet,
  planetPositionsRef,
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
      {/* Luz ambiental — baja para conservar contraste claro/oscuro natural */}
      <ambientLight intensity={0.18} />

      {/* Glow cósmico sutil del fondo estelar */}
      <hemisphereLight color="#dde6ff" groundColor="#1a1142" intensity={0.1} />

      {/* Luz puntual en el Sol — decay 0 alcanza Plutón; sin shadows (irreales + caros) */}
      <pointLight position={[0, 0, 0]} intensity={6} distance={0} decay={0} />

      {/* Luz direccional para sombras Luna↔Tierra — solo en modo local con Tierra */}
      {isLocal && isEarthSelected && (
        <directionalLight
          position={shadowLightPos.toArray()}
          intensity={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0005}
        />
      )}

      {/* Fondo de estrellas */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

      {/* Cámara y controles */}
      <CameraController planetPositionsRef={planetPositionsRef} />

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
        </>
      )}

      {/* ——————————————————————————————— MODO LOCAL ——————————————————————————————— */}
      {isLocal && selectedPlanet && (
        <>
          {/* Planeta seleccionado (full detail) */}
          {selectedPlanet === 'saturn' && saturnData ? (
            <>
              <Saturn
                planet={saturnData}
                level={level}
                onClick={handlePlanetClick}
                positionsRef={planetPositionsRef}
              />
              <OrbitPath planet={saturnData} level={level} />
            </>
          ) : (
            (() => {
              const selectedData = planets.find((p) => p.id === selectedPlanet);
              if (!selectedData) return null;
              return (
                <>
                  <Planet
                    planet={selectedData}
                    level={level}
                    variant={selectedData.classification === 'dwarf_planet' ? 'dwarf' : 'normal'}
                    onClick={handlePlanetClick}
                    positionsRef={planetPositionsRef}
                    castShadow={isEarthSelected}
                    receiveShadow={isEarthSelected}
                  />
                  <OrbitPath planet={selectedData} level={level} />
                </>
              );
            })()
          )}

          {/* Luna de la Tierra — solo si Tierra seleccionada */}
          {isEarthSelected && (
            <PlanetMoon positionsRef={planetPositionsRef} castShadow receiveShadow />
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
            <DistantMarker key="dm-saturn" planet={saturnData} positionsRef={planetPositionsRef} />
          )}

          {/* Eventos conocidos (cometa Halley, etc.) */}
          {showKnownEvents && <KnownEventsLayer />}
        </>
      )}

      {/* Post-procesado: Bloom sobre el Sol — mipmapBlur eliminado (caro); skip en GPU low */}
      {gpu !== 'low' && (
        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.3} />
        </EffectComposer>
      )}
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

  // Ref compartido: posiciones reales de planetas (actualizadas en useFrame por Planet/Saturn)
  const planetPositionsRef = useRef<Record<string, Vector3Type>>({});

  // Shadows solo relevantes en modo local con Tierra seleccionada
  const shadowsEnabled = viewMode === 'local' && selectedPlanet === 'earth';

  return (
    <Canvas
      data-testid="solar-canvas"
      dpr={1.5}
      gl={{ powerPreference: 'high-performance', antialias: true, stencil: false }}
      camera={{ position: [0, 35, 70], fov: 60, near: 0.1, far: 500 }}
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
          selectedPlanet={selectedPlanet}
          showKnownEvents={showKnownEvents}
        />
      </Suspense>
    </Canvas>
  );
}

SolarSystemScene.displayName = 'SolarSystemScene';
