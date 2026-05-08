/**
 * <RotationAxisLine> — línea que visualiza el eje de rotación axial de un cuerpo celeste.
 *
 * Renderiza una línea (<Line> de drei) a lo largo del eje Y local del grupo padre,
 * envuelta en un grupo con rotación Z para aplicar la inclinación axial del cuerpo.
 *
 * La convención de inclinación sigue la de Planet.tsx: el tilt se aplica como
 * rotación Z (rotation={[0, 0, tiltRad]}). La línea está en el eje Y local del grupo
 * ya inclinado, representando el eje de giro real del cuerpo.
 *
 * Visible solo cuando prop `visible === true`.
 * Por defecto desactivado en el store (showRotationAxes = false).
 */

import { Line } from '@react-three/drei';
import { degToRad } from '@/scenes/orbital';

// ---------------------------------------------------------------------------
// Constantes exportadas (usadas en tests y componentes consumidores)
// ---------------------------------------------------------------------------

/** Factor de sobredimensionado del eje respecto al radio visual del cuerpo. */
export const AXIS_OVERSHOOT = 1.25;

/** Color por defecto del eje de rotación axial (cyan brillante). */
export const AXIS_COLOR = '#00e5ff';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RotationAxisLineProps {
  /** Radio visual del cuerpo (unidades de escena). Longitud total = radius * 2 * AXIS_OVERSHOOT. */
  radius: number;
  /** Inclinación axial en grados. Aplica rotación Z al grupo wrapper. */
  tiltDeg: number;
  /** Si false, el componente no renderiza nada. */
  visible: boolean;
  /** Color de la línea. Por defecto AXIS_COLOR. */
  color?: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Línea del eje de rotación axial.
 *
 * - La línea va de [0, -halfLen, 0] a [0, +halfLen, 0] en espacio local.
 * - El grupo wrapper aplica `rotation={[0, 0, degToRad(tiltDeg)]}` para inclinar
 *   el eje según la inclinación axial real del cuerpo (convención Z = Planet.tsx).
 * - Si el componente se sitúa DENTRO del grupo de tilt del planeta, pasar tiltDeg=0
 *   y dejar que el grupo padre aplique la inclinación.
 * - Si se sitúa fuera del grupo de tilt (p.ej. Sun.tsx), pasar tiltDeg real.
 */
export function RotationAxisLine({
  radius,
  tiltDeg,
  visible,
  color = AXIS_COLOR,
}: RotationAxisLineProps) {
  if (!visible) return null;

  const halfLen = radius * AXIS_OVERSHOOT;
  const points: [number, number, number][] = [
    [0, -halfLen, 0],
    [0, halfLen, 0],
  ];

  return (
    <group rotation={[0, 0, degToRad(tiltDeg)]}>
      <Line points={points} color={color} lineWidth={1.5} />
    </group>
  );
}

RotationAxisLine.displayName = 'RotationAxisLine';
