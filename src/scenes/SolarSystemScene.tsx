/**
 * SolarSystemScene — escena principal R3F del Sistema Solar.
 *
 * Compone todos los componentes 3D:
 * - <Sun> con shader procedural
 * - <Planet> × 8 (todos excepto Saturno)
 * - <Saturn> con anillos
 * - <PlanetMoon> (Luna de la Tierra)
 * - <AsteroidBelt> entre Marte y Júpiter
 * - <OrbitPath> × 9 (uno por planeta)
 * - <CameraController> con OrbitControls + teclado
 * - <Stars> de Drei como fondo
 *
 * Lee el dataset de planetas con usePlanetsData.
 * Lee el nivel pedagógico activo del store.
 * Canvas configurado con dpr={[1,2]} y gl.powerPreference='high-performance'.
 *
 * Task 8.2 (IMPL)
 */

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { Vector3 } from 'three';
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
  planetPositionsRef: React.MutableRefObject<Record<string, Vector3>>;
}

function SolarSystemContent({
  level,
  gpu,
  reducedMotion,
  onSelectPlanet,
  planetPositionsRef,
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

  return (
    <>
      {/* Luz ambiental */}
      <ambientLight intensity={0.5} />

      {/* Glow cósmico sutil del fondo estelar */}
      <hemisphereLight color="#dde6ff" groundColor="#1a1142" intensity={0.15} />

      {/* Luz puntual en el Sol — intensidad 8, decay 0 para alcanzar todos los planetas */}
      <pointLight
        position={[0, 0, 0]}
        intensity={8}
        distance={0}
        decay={0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Fondo de estrellas */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

      {/* Cámara y controles */}
      <CameraController planetPositionsRef={planetPositionsRef} />

      {/* El Sol */}
      <Sun capability={gpu} reducedMotion={reducedMotion} />

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

      {/* Luna de la Tierra (sigue la posición real de la Tierra via positionsRef) */}
      <PlanetMoon positionsRef={planetPositionsRef} />

      {/* Cinturón de asteroides */}
      <AsteroidBelt config={data.asteroid_belt} />

      {/* Post-procesado: Bloom sobre el Sol (luminanceThreshold 0.85 — HDR) */}
      <EffectComposer enableNormalPass={false}>
        <Bloom intensity={0.6} luminanceThreshold={0.85} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
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
  const setSelectedPlanet = useAppStore((s) => s.setSelectedPlanet);

  const rawGpu = useGpuCapability();

  // Mapear GpuCapability → GpuCapabilityExtended (null → 'mid' como fallback)
  const gpu: GpuCapabilityExtended = rawGpu ?? 'mid';

  // Mapear sunShaderVariant a capability extendida
  const resolvedGpu: GpuCapabilityExtended = sunShaderVariant === 'texture' ? 'fallback' : gpu;

  // Ref compartido: posiciones reales de planetas (actualizadas en useFrame por Planet/Saturn)
  const planetPositionsRef = useRef<Record<string, Vector3>>({});

  return (
    <Canvas
      data-testid="solar-canvas"
      dpr={[1, 2]}
      gl={{ powerPreference: 'high-performance', antialias: true }}
      camera={{ position: [0, 35, 70], fov: 60, near: 0.1, far: 500 }}
      shadows
    >
      <Suspense fallback={null}>
        <SolarSystemContent
          level={level}
          gpu={resolvedGpu}
          reducedMotion={prefersReducedMotion}
          onSelectPlanet={setSelectedPlanet}
          planetPositionsRef={planetPositionsRef}
        />
      </Suspense>
    </Canvas>
  );
}

SolarSystemScene.displayName = 'SolarSystemScene';
