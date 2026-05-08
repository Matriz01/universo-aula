/**
 * useFocusCamera — anima la cámara hacia un target usando useFrame (lerp eased).
 *
 * Características:
 * - Lerp de camera.position y controls.target hacia el destino
 * - Duración: TRANSITION_MS (700ms); reducida a 300ms si prefersReducedMotion
 * - Re-lee el target LIVE cada frame durante el tween (corrige race condition
 *   Bug 1: a alta velocidad el planeta se mueve varios grados durante la transición)
 * - Offset prudente: planetRadius × K para que el planeta quede bien encuadrado
 *   (Bug 3: offset fijo de 6 unidades dejaba la cámara dentro del planeta en modo local)
 * - Cancelación limpia al unmount o al cambiar de target
 *
 * Por qué useFrame en vez de @react-spring/three:
 * - react-spring anima con un ticker propio (RAF separado del loop R3F).
 *   Eso crea una carrera de frames: la posición del planeta se actualiza en el
 *   loop R3F, pero el spring puede leer/escribir en otro momento → snapshot stale.
 * - Con useFrame el lerp está sincronizado con el renderizado R3F, lee la
 *   posición live del planeta en el mismo tick y escribe la cámara en el mismo.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Constantes exportadas (usadas en tests)
// ---------------------------------------------------------------------------

/** Duración de la transición global→local en milisegundos. */
export const TRANSITION_MS = 700;

/**
 * Factor mínimo de distancia prudente al entrar en modo local.
 * offset.length() ≥ planetRadius × MIN_DISTANCE_FACTOR.
 * Valor 4 enmarca el planeta con margen visual cómodo sin alejarse en exceso.
 */
export const MIN_DISTANCE_FACTOR = 4;

/** Factor real usado (K = 5 — un planeta bien encuadrado con cielo visible). */
const K_DISTANCE_FACTOR = 5;

// ---------------------------------------------------------------------------
// Easing — exportada para tests (Bug 2)
// ---------------------------------------------------------------------------

/**
 * Curva ease-out-cubic: desaceleración suave al final.
 * f(t) = 1 - (1-t)^3
 * A t=0.8 → 0.992 (la transición está casi completa al 80% del tiempo).
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ---------------------------------------------------------------------------
// computeLocalOffset — exportada para tests (Bug 3)
// ---------------------------------------------------------------------------

/**
 * Calcula el vector de offset relativo al planeta para la cámara en modo local.
 * Dirección: ligeramente elevada (30°) y detrás (eje Z positivo en el plano orbital).
 * Magnitud: planetRadius × K_DISTANCE_FACTOR.
 *
 * @param planetRadius - Radio visual del planeta en unidades de escena (modo local)
 * @returns Offset Vector3 tal que camera.position = planet.position + offset
 */
export function computeLocalOffset(planetRadius: number): Vector3 {
  const dist = planetRadius * K_DISTANCE_FACTOR;
  // Dirección: 30° de elevación sobre el plano orbital, detrás del planeta (Z+)
  const elevation = Math.PI / 6; // 30°
  return new Vector3(
    0,
    dist * Math.sin(elevation), // componente Y (altura)
    dist * Math.cos(elevation), // componente Z (profundidad)
  );
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface FocusOptions {
  /**
   * Vector3 del cuerpo a enfocar (snapshot para arrancar la transición).
   * null = vista general (0, 35, 70).
   */
  target: Vector3 | null;
  /**
   * Ref al Vector3 live del planeta (actualizado cada frame por Planet/Saturn).
   * Si se provee, el lerp re-lee este valor cada frame en lugar del snapshot de target.
   * Esto corrige el Bug 1: la cámara aterriza en la posición ACTUAL, no en la del clic.
   */
  targetRef?: React.RefObject<Vector3 | null>;
  /**
   * Radio visual del planeta en modo local (unidades de escena).
   * Si se provee, el offset se calcula como planetRadius × K.
   * Si no se provee, se usa el offset legacy fijo.
   */
  planetRadius?: number;
  /** Desplazamiento relativo al target (legacy — se usa si planetRadius no está). */
  offset?: Vector3;
  /** Si true, duración reducida a 300ms. */
  reducedMotion?: boolean;
}

// Minimal interface for OrbitControls target usage
interface OrbitControlsLike {
  target: {
    fromArray: (arr: number[]) => void;
    copy: (v: Vector3) => void;
    add: (v: { x: number; y: number; z: number }) => void;
  };
  update: () => void;
}

// ---------------------------------------------------------------------------
// Estado del lerp (tipado)
// ---------------------------------------------------------------------------

interface LerpState {
  active: boolean;
  startPos: Vector3;
  startLook: Vector3;
  elapsed: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFocusCamera({
  target,
  targetRef,
  planetRadius,
  offset = new Vector3(0, 2, 6),
  reducedMotion = false,
}: FocusOptions): React.RefObject<OrbitControlsLike | null> {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsLike | null>(null);

  const durationMs = reducedMotion ? 300 : TRANSITION_MS;

  // Estado del lerp — todo en refs para no provocar re-renders
  const lerpState = useRef<LerpState | null>(null);

  // Offset efectivo (actualizado al arrancar cada transición)
  const offsetRef = useRef<Vector3>(offset.clone());

  // Vectores reutilizables para el lerp (evitar GC en el hot path)
  const _liveTarget = useRef(new Vector3());
  const _destPos = useRef(new Vector3());
  const _destLook = useRef(new Vector3());

  // Arrancar o reiniciar el lerp cuando cambia el target
  useEffect(() => {
    // Calcular offset: si se provee planetRadius, usar computeLocalOffset; si no, legacy
    const effectiveOffset =
      planetRadius !== undefined ? computeLocalOffset(planetRadius) : offset.clone();

    // Snapshot del punto de partida: posición actual de la cámara
    const startLook = new Vector3();
    if (controlsRef.current) {
      const t = controlsRef.current.target as unknown as { x?: number; y?: number; z?: number };
      startLook.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
    }

    lerpState.current = {
      active: true,
      startPos: camera.position.clone(),
      startLook,
      elapsed: 0,
      duration: durationMs,
    };

    offsetRef.current = effectiveOffset;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.x, target?.y, target?.z]);

  useFrame((_, delta) => {
    const state = lerpState.current;
    if (!state?.active) return;

    state.elapsed += delta * 1000; // delta en segundos → elapsed en ms
    const rawT = Math.min(state.elapsed / state.duration, 1);
    const easedT = easeOutCubic(rawT);

    // Leer el target LIVE si se provee targetRef (Bug 1), sino usar snapshot
    let liveTarget: Vector3;
    if (targetRef?.current) {
      _liveTarget.current.copy(targetRef.current);
      liveTarget = _liveTarget.current;
    } else if (target) {
      _liveTarget.current.copy(target);
      liveTarget = _liveTarget.current;
    } else {
      // Vista general (target=null)
      _liveTarget.current.set(0, 0, 0);
      liveTarget = _liveTarget.current;
    }

    // Destino de cámara: liveTarget + offset (recalculado con posición live cada frame)
    if (target !== null || targetRef?.current) {
      _destPos.current.copy(liveTarget).add(offsetRef.current);
    } else {
      _destPos.current.set(0, 35, 70);
    }

    // Lerp de posición de cámara (de startPos hacia destPos)
    camera.position.lerpVectors(state.startPos, _destPos.current, easedT);

    // Lerp del look-at (target de OrbitControls): de startLook hacia liveTarget
    if (controlsRef.current) {
      _destLook.current.lerpVectors(state.startLook, liveTarget, easedT);
      controlsRef.current.target.fromArray(_destLook.current.toArray());
      controlsRef.current.update();
    }

    if (rawT >= 1) {
      state.active = false;
    }
  });

  return controlsRef;
}
