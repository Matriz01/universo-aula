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

import { SUN_VISUAL_RADIUS } from '@/scenes/scale';

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
// HDR: valores > 1.0 para superar el luminanceThreshold del Bloom (0.85)
const COLOR_CORE = new Color(2.5, 2.0, 1.0);
const COLOR_EDGE = new Color(1.2, 0.5, 0.1);
const GRANULATION_SCALE = 3.0;
const FLOW_SCALE = 8.0;

// ---------------------------------------------------------------------------
// Función helper para crear los uniforms
// ---------------------------------------------------------------------------

function createUniforms(reducedMotion: boolean, sunspotsEnabled: boolean): SunUniforms {
  return {
    uTime: { value: 0 },
    uColorCore: { value: COLOR_CORE.clone() },
    uColorEdge: { value: COLOR_EDGE.clone() },
    uGranulationScale: { value: GRANULATION_SCALE },
    uFlowScale: { value: FLOW_SCALE },
    uFlowSpeed: { value: reducedMotion ? FLOW_SPEED_NOMINAL * 0.2 : FLOW_SPEED_NOMINAL },
    uSunspotsEnabled: { value: sunspotsEnabled },
  };
}

// ---------------------------------------------------------------------------
// Componente Sun
// ---------------------------------------------------------------------------

/** Periodo de rotación del Sol en el ecuador (días terrestres) */
const SUN_ROTATION_PERIOD_DAYS = 25;
/** Velocidad angular del Sol (rad/día simulado) */
const SUN_OMEGA = (2 * Math.PI) / SUN_ROTATION_PERIOD_DAYS;
/** Días simulados por segundo real (mismo SPEEDUP que usan los planetas) */
const SUN_SPEEDUP = 10;

export const Sun = React.memo(function Sun({ capability, reducedMotion }: SunProps) {
  const materialRef = useRef<ShaderMaterial | MeshStandardMaterial | null>(null);
  const meshRef = useRef<Mesh>(null);
  const elapsedDays = useRef(0);

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
    elapsedDays.current += dt * SUN_SPEEDUP;

    if (materialRef.current instanceof ShaderMaterial) {
      const uniforms = materialRef.current.uniforms as unknown as SunUniforms;
      if (uniforms.uTime) {
        uniforms.uTime.value += dt;
      }
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = elapsedDays.current * SUN_OMEGA;
    }
  });

  const geometry = useMemo(() => new SphereGeometry(SUN_VISUAL_RADIUS, 64, 64), []);

  return <mesh ref={meshRef} geometry={geometry} material={material} name="sun" />;
});

Sun.displayName = 'Sun';
