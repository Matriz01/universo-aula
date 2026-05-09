/**
 * src/scenes/components/Sun.tsx
 *
 * Componente React Three Fiber del Sol con shader procedural.
 * Selecciona variante de material según capacidad GPU:
 *   - 'high'     → ShaderMaterial full + sunspots
 *   - 'mid'      → ShaderMaterial full sin sunspots
 *   - 'low'      → ShaderMaterial lite (sun.lite.frag)
 *   - 'fallback' → MeshStandardMaterial (textura procedural simple)
 *
 * Si prefersReducedMotion es true, uFlowSpeed se reduce un 80%
 * (se usa el 20% del valor nominal).
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, MeshStandardMaterial, Color, SphereGeometry } from 'three';
import type { Mesh } from 'three';

// Shaders importados como strings crudos mediante Vite ?raw
import sunVertSrc from '@/scenes/shaders/sun.vert?raw';
import sunFragSrc from '@/scenes/shaders/sun.frag?raw';
import sunFragLiteSrc from '@/scenes/shaders/sun.lite.frag?raw';

import { SUN_RADIUS_KM } from '@/scenes/scale';
import { useScaledRadius } from '@/scenes/hooks/useScaledRadius';
import { useAppStore } from '@/store/useAppStore';
import { getJD, J2000_JD } from '@/scenes/simulationClock';
import { computeSunIntensityFactor } from '@/scenes/helpers/sunIntensity';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';
import { RotationAxisLine } from '@/scenes/components/RotationAxisLine';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type GpuCapabilityExtended = 'high' | 'mid' | 'low' | 'fallback';

/** Uniforms tipados del shader del Sol */
export interface SunUniforms {
  uTime: { value: number };
  uColorCore: { value: Color };
  uColorEdge: { value: Color };
  uGranulationScale: { value: number };
  uFlowScale: { value: number };
  uFlowSpeed: { value: number };
  uSunspotsEnabled: { value: boolean };
  uPerspectiveFactor: { value: number };
  uEruptColor: { value: Color };
}

export interface SunProps {
  /** Capacidad GPU detectada */
  capability: GpuCapabilityExtended;
  /** Si true, reduce uFlowSpeed un 80% (prefers-reduced-motion) */
  reducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Constantes del shader
// ---------------------------------------------------------------------------

const FLOW_SPEED_NOMINAL = 0.2;
// HDR: valores > 1.0 para superar el luminanceThreshold del Bloom (0.85).
// Aumentados para compensar la corrección de uTime (que ahora no escala con speed),
// y para que el Sol se vea brillante de forma más consistente.
const COLOR_CORE = new Color(8.0, 5.5, 2.5);
// Borde sólo ligeramente menos brillante que el núcleo — el Sol no tiene cara
// oscura (es el foco). Mantenemos un leve gradiente para evitar plano sólido.
const COLOR_EDGE = new Color(6.0, 3.8, 1.6);
const GRANULATION_SCALE = 3.0;
const FLOW_SCALE = 8.0;

// ---------------------------------------------------------------------------
// Función helper para crear los uniforms
// ---------------------------------------------------------------------------

// HDR cálido: valores >1 para que la contribución sea perceptible sobre el fondo brillante.
// vec3(4.0, 2.5, 0.8) produce un naranja/amarillo intenso — similar a una llamarada solar.
const ERUPT_COLOR = new Color(4.0, 2.5, 0.8);

function createUniforms(reducedMotion: boolean, sunspotsEnabled: boolean): SunUniforms {
  return {
    uTime: { value: 0 },
    uColorCore: { value: COLOR_CORE.clone() },
    uColorEdge: { value: COLOR_EDGE.clone() },
    uGranulationScale: { value: GRANULATION_SCALE },
    uFlowScale: { value: FLOW_SCALE },
    uFlowSpeed: { value: reducedMotion ? FLOW_SPEED_NOMINAL * 0.2 : FLOW_SPEED_NOMINAL },
    uSunspotsEnabled: { value: sunspotsEnabled },
    uPerspectiveFactor: { value: 1.0 },
    uEruptColor: { value: ERUPT_COLOR.clone() },
  };
}

// ---------------------------------------------------------------------------
// Componente Sun
// ---------------------------------------------------------------------------

/** Inclinación axial del Sol respecto a la eclíptica (grados, fuente: NASA). */
export const SUN_AXIAL_TILT_DEG = 7.25;

/** Periodo de rotación del Sol en el ecuador (días terrestres) */
const SUN_ROTATION_PERIOD_DAYS = 25;
/** Velocidad angular del Sol (rad/día simulado) */
const SUN_OMEGA = (2 * Math.PI) / SUN_ROTATION_PERIOD_DAYS;
/** Duración del lerp del factor de perspectiva (ms) — suaviza cambios de modo/planeta */
const PERSPECTIVE_LERP_MS = 500;

export const Sun = React.memo(function Sun({ capability, reducedMotion }: SunProps) {
  const materialRef = useRef<ShaderMaterial | MeshStandardMaterial | null>(null);
  const meshRef = useRef<Mesh>(null);
  const viewMode = useAppStore((s) => s.viewMode);
  const selectedBody = useAppStore((s) => s.selectedBody);
  // Para el cálculo de perspectiva del Sol: si la Luna está seleccionada, usar la
  // semi-major-axis de la Tierra (la Luna orbita la Tierra a ~1 AU del Sol).
  const selectedPlanetForPerspective = selectedBody === 'moon' ? 'earth' : selectedBody;
  const showRotationAxes = useAppStore((s) => s.showRotationAxes);
  const { data } = usePlanetsData();

  // Factor de perspectiva actual (lerpeado para evitar pops bruscos)
  const perspectiveFactorRef = useRef<number>(1.0);
  // Valor objetivo (se actualiza cuando cambia viewMode o selectedBody)
  const targetFactorRef = useRef<number>(1.0);
  // Elapsed del lerp actual
  const lerpElapsedRef = useRef<number>(0);

  // Creamos el material según la capacidad GPU
  const material = useMemo(() => {
    if (capability === 'fallback') {
      // Textura procedural simple: MeshStandardMaterial color naranja/amarillo
      const mat = new MeshStandardMaterial({
        color: new Color(1.0, 0.7, 0.1),
        emissive: new Color(1.0, 0.5, 0.05),
        emissiveIntensity: 1.0,
        roughness: 1.0,
        metalness: 0.0,
      });
      materialRef.current = mat;
      return mat;
    }

    // Selección de fragment shader: lite para 'low', full para 'mid'/'high'
    const fragmentShader = capability === 'low' ? sunFragLiteSrc : sunFragSrc;
    const sunspotsEnabled = capability === 'high';

    const uniforms = createUniforms(reducedMotion, sunspotsEnabled);

    const mat = new ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, { value: unknown }>,
      vertexShader: sunVertSrc,
      fragmentShader,
    });
    materialRef.current = mat;
    return mat;
  }, [capability, reducedMotion]);

  // useFrame actualiza uTime en cada frame (sólo para ShaderMaterial) y rota el Sol
  useFrame((_state, dt) => {
    // Calcular factor de perspectiva objetivo
    let newTargetFactor = 1.0;
    if (viewMode === 'local' && selectedPlanetForPerspective && data) {
      const planetData = data.planets.find((p) => p.id === selectedPlanetForPerspective);
      if (planetData) {
        newTargetFactor = computeSunIntensityFactor('local', planetData.semi_major_axis_AU);
      }
    }

    // Si el objetivo cambió, reiniciar el lerp
    if (Math.abs(newTargetFactor - targetFactorRef.current) > 0.001) {
      targetFactorRef.current = newTargetFactor;
      lerpElapsedRef.current = 0;
    }

    // Lerp del factor de perspectiva
    if (Math.abs(perspectiveFactorRef.current - targetFactorRef.current) > 0.0001) {
      lerpElapsedRef.current += dt * 1000;
      const t = Math.min(lerpElapsedRef.current / PERSPECTIVE_LERP_MS, 1);
      perspectiveFactorRef.current =
        perspectiveFactorRef.current + (targetFactorRef.current - perspectiveFactorRef.current) * t;
    }

    if (materialRef.current instanceof ShaderMaterial) {
      const uniforms = materialRef.current.uniforms as unknown as SunUniforms;
      if (uniforms.uTime) {
        // uTime: animación visual del shader — usa real-dt (NO simulationSpeed).
        // La granulación solar es flair visual: debe animar al mismo ritmo visual
        // independientemente de cuán rápido corran los planetas.
        uniforms.uTime.value += dt;
      }
      if (uniforms.uPerspectiveFactor) {
        uniforms.uPerspectiveFactor.value = perspectiveFactorRef.current;
      }
    }

    if (meshRef.current) {
      // Rotación axial: derivada del JD (días desde J2000) × velocidad angular.
      // El reloj global garantiza continuidad en cambios de modo (REQ-ORB-2).
      const jd = getJD();
      meshRef.current.rotation.y = (jd - J2000_JD) * SUN_OMEGA;
    }
  });

  const radius = useScaledRadius(SUN_RADIUS_KM);
  const geometry = useMemo(() => new SphereGeometry(radius, 64, 64), [radius]);

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={material} name="sun" />
      {/* Eje de rotación axial del Sol — visible solo cuando showRotationAxes=true */}
      {/* forceOnTop: la malla del Sol (bloom/shader) ocluye la línea sin depthTest=false */}
      <RotationAxisLine
        radius={radius}
        tiltDeg={SUN_AXIAL_TILT_DEG}
        visible={showRotationAxes}
        forceOnTop
      />
    </>
  );
});

Sun.displayName = 'Sun';
