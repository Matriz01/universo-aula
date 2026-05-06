/**
 * useFocusCamera — anima la cámara hacia un target usando @react-spring/three.
 *
 * Características:
 * - Tween de camera.position y controls.target hacia el destino
 * - Duración por defecto: 1200ms; 300ms si prefersReducedMotion
 * - Cancelación limpia al unmount o al cambiar de target
 * - aborted.current previene escritura en camera después de unmount
 */

import { useEffect, useRef } from 'react';
import { useSpring } from '@react-spring/three';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface FocusOptions {
  /** Vector3 del cuerpo a enfocar. null = vista general (0, 35, 70). */
  target: Vector3 | null;
  /** Desplazamiento relativo al target (detrás-arriba). */
  offset?: Vector3;
  /** Si true, duración reducida a 300ms. */
  reducedMotion?: boolean;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// Minimal interface for OrbitControls target usage
interface OrbitControlsLike {
  target: { fromArray: (arr: number[]) => void };
  update: () => void;
}

export function useFocusCamera({
  target,
  offset = new Vector3(0, 2, 6),
  reducedMotion = false,
}: FocusOptions): React.RefObject<OrbitControlsLike | null> {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsLike | null>(null);
  const aborted = useRef(false);

  const durationMs = reducedMotion ? 300 : 1200;

  const [, api] = useSpring(() => ({
    pos: camera.position.toArray(),
    look: [0, 0, 0],
    config: { duration: durationMs, easing: easeInOutCubic },
    onChange: ({ value }: { value: { pos: number[]; look: number[] } }) => {
      if (aborted.current) return;
      camera.position.fromArray(value.pos);
      if (controlsRef.current) {
        controlsRef.current.target.fromArray(value.look);
        controlsRef.current.update();
      }
    },
  }));

  useEffect(() => {
    aborted.current = false;
    if (target) {
      const dest = target.clone().add(offset);
      void api.start({ pos: dest.toArray(), look: target.toArray() });
    } else {
      void api.start({ pos: [0, 35, 70], look: [0, 0, 0] });
    }
    return () => {
      aborted.current = true;
      api.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.x, target?.y, target?.z]);

  return controlsRef;
}
