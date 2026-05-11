/**
 * Componente <OrbitPath> — línea que dibuja la trayectoria orbital del planeta.
 *
 * Forma según nivel pedagógico:
 *   - Explorador:    círculo (Y=0)
 *   - Aprendiz:      elipse plana (Y=0)
 *   - Investigador:  elipse con inclinación 3D (Kepler real)
 *
 * Usa <Line> de Drei con lineWidth=2 / opacity=0.5 para visibilidad mejorada.
 * En GPU mid/high añade una segunda línea aditiva (glow) sin postprocesado.
 */

import React from 'react';
import { AdditiveBlending } from 'three';
import { Line } from '@react-three/drei';
import type { PlanetData } from '@/scenes/data/types';
import { computeOrbitPoints } from '@/scenes/hooks/useOrbitPath';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import { useAppStore } from '@/store/useAppStore';
import { useGpuCapability } from '@/scenes/hooks/useGpuCapability';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface OrbitPathProps {
  planet: PlanetData;
  level: PedagogicalLevel;
  /** Número de segmentos de la línea (default 128) */
  segments?: number;
  /** Color de la línea (default: color del planeta) */
  color?: string;
  /** Opacidad de la línea principal (default 0.5) */
  opacity?: number;
  /** Si false, no renderiza (default true) */
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// Componente OrbitPath
// ---------------------------------------------------------------------------

export const OrbitPath = React.memo(function OrbitPath({
  planet,
  level,
  segments = 128,
  color,
  opacity = 0.5,
  visible = true,
}: OrbitPathProps) {
  const viewMode = useAppStore((s) => s.viewMode);
  const gpuRaw = useGpuCapability();

  if (!visible) return null;

  // Calculamos los puntos — useMemo interno en computeOrbitPoints es puro,
  // React.memo de OrbitPath evita recalcular si props no cambian.
  const points = computeOrbitPoints(planet, level, segments, viewMode);

  const lineColor = color ?? planet.color_hex;

  // null mientras se detecta → tratar como 'mid' (fallback conservador que sí muestra glow)
  const gpuCap = gpuRaw ?? 'mid';
  const showGlow = gpuCap !== 'low';

  return (
    <group>
      {/* Línea de glow aditivo — solo en GPU mid/high. Queda detrás (renderOrder=-1). */}
      {showGlow && (
        <Line
          points={points}
          color={lineColor}
          lineWidth={4}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
          depthWrite={false}
          renderOrder={-1}
        />
      )}
      {/* Línea principal — siempre visible */}
      <Line
        points={points}
        color={lineColor}
        lineWidth={2}
        transparent
        opacity={opacity}
        renderOrder={0}
      />
    </group>
  );
});

OrbitPath.displayName = 'OrbitPath';
