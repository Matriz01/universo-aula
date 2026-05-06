/**
 * Componente <OrbitPath> — línea que dibuja la trayectoria orbital del planeta.
 *
 * Forma según nivel pedagógico:
 *   - Explorador:    círculo (Y=0)
 *   - Aprendiz:      elipse plana (Y=0)
 *   - Investigador:  elipse con inclinación 3D (Kepler real)
 *
 * Usa <Line> de Drei con opacidad ~0.3 para que sea tenue.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import type { PlanetData } from '@/scenes/data/types';
import { computeOrbitPoints } from '@/scenes/hooks/useOrbitPath';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';

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
  /** Opacidad de la línea (default 0.3) */
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
  opacity = 0.3,
  visible = true,
}: OrbitPathProps) {
  if (!visible) return null;

  // Calculamos los puntos — useMemo interno en computeOrbitPoints es puro,
  // React.memo de OrbitPath evita recalcular si props no cambian.
  const points = computeOrbitPoints(planet, level, segments);

  const lineColor = color ?? planet.color_hex;

  return <Line points={points} color={lineColor} lineWidth={1} transparent opacity={opacity} />;
});

OrbitPath.displayName = 'OrbitPath';
