/**
 * CameraController — integra controles de cámara con navegación por teclado y focus.
 *
 * Modo GLOBAL (viewMode === 'global'):
 *   Usa <CameraControls> de Drei (wraps camera-controls@3.x, MIT).
 *   - dollyToCursor = true → zoom hacia cursor (mouse) y hacia midpoint del pinch (touch/stylus)
 *   - Pan activado: un dedo orbit, dos dedos pan, pinch zoom
 *   - Teclado H / h → reset a vista home (target=0,0,0 + cámara en posición panorámica)
 *   - Botón "Centrar en Sol" expuesto vía ref del componente (controlado desde HUD)
 *
 * Modo LOCAL (viewMode === 'local'):
 *   Usa <OrbitControls> con la lógica de follow de PR#15 intacta:
 *   - useFocusCamera (lerp suave hacia el planeta)
 *   - Traslación rígida delta-vector en useFrame (follow mode)
 *   - enablePan = false (en local, la cámara sigue al planeta)
 *
 * Decisión de fork documentada: CameraControls en global (dollyToCursor nativo + multi-touch)
 * vs extender OrbitControls manualmente (requeriría interceptar wheel/touch, mucho más código
 * y frágil con damping). CameraControls ya tiene todo lo necesario sin nueva dependencia
 * (camera-controls ya estaba en node_modules como dep transitiva de @react-three/drei).
 *
 * Multi-input (Pointer Events API):
 * camera-controls usa internamente PointerEvents — compatible con mouse, touch y stylus (SMART board).
 */

import React, { type Ref, useEffect, useMemo, useRef } from 'react';
import { OrbitControls, CameraControls, type CameraControlsImpl } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';
import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';
import { HOME_CAMERA_POSITION, HOME_TARGET_POSITION } from '@/scenes/helpers/cameraHelpers';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Duración del tween home (ms) — mismo orden que useFocusCamera (TRANSITION_MS=700ms) */
const HOME_DURATION_S = 0.6;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CameraControllerProps {
  /** Ref al mapa de posiciones reales de planetas (actualizado por Planet/Saturn en useFrame) */
  planetPositionsRef?: React.MutableRefObject<Record<string, Vector3>>;
  /**
   * Radio visual del planeta seleccionado en unidades de escena (modo local).
   * Se usa para calcular el offset prudente al entrar en modo local (Bug 3).
   * Si no se provee, se usa el offset legacy (0, 2, 6).
   */
  planetRadius?: number;
}

// ---------------------------------------------------------------------------
// Subcomponente: controles en modo global (CameraControls con dollyToCursor)
// ---------------------------------------------------------------------------

function GlobalCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const cameraHomeRequested = useAppStore((s) => s.cameraHomeRequested);

  // maxDistance fijo a 1000u: ~5× el outer edge de la Oort (~198u en
  // visualDistance global). El alumno puede explorar todo el Sistema Solar
  // como un punto distante, esté o no la nube visible. Cámara far=1_000_000.

  /**
   * Ejecuta el tween de reset a vista home en DOS FASES encadenadas:
   *   1. Rotación: la cámara mira al Sol manteniendo su posición.
   *   2. Traslación: la cámara viaja a la posición home mirando al Sol.
   *
   * Esto da sensación de viaje cuando el usuario está lejos (fuera de la nube
   * de Oort): primero ve a dónde va, luego siente el desplazamiento.
   *
   * Implementación: las promesas que devuelve camera-controls al pasar
   * enableTransition=true pueden quedar pendientes hasta el siguiente input
   * del usuario, lo que rompía la cadena (la fase 2 no arrancaba sola). Usamos
   * un timer deterministic en lugar de `await` sobre la promesa: la fase 1
   * arranca, dejamos correr el tween durante PHASE_DURATION_MS, y enseguida
   * arrancamos la fase 2. smoothTime se sube a 0.4s para que el tween termine
   * dentro de la ventana de 500ms con margen.
   */
  async function doHomeReset() {
    const controls = controlsRef.current;
    if (!controls) return;

    const PHASE_DURATION_MS = 500;
    const prevSmoothTime = controls.smoothTime;
    controls.smoothTime = 0.4;

    try {
      // Fase 1 — rotación. Descartamos la promesa: avanzamos por tiempo.
      void controls.setTarget(
        HOME_TARGET_POSITION.x,
        HOME_TARGET_POSITION.y,
        HOME_TARGET_POSITION.z,
        true,
      );
      await new Promise<void>((resolve) => setTimeout(resolve, PHASE_DURATION_MS));

      // Fase 2 — traslación. La cámara sigue mirando al Sol mientras viaja.
      void controls.setPosition(
        HOME_CAMERA_POSITION.x,
        HOME_CAMERA_POSITION.y,
        HOME_CAMERA_POSITION.z,
        true,
      );
      await new Promise<void>((resolve) => setTimeout(resolve, PHASE_DURATION_MS));
    } finally {
      controls.smoothTime = prevSmoothTime;
    }
  }

  // Shortcut H: reset a vista home
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'h' || event.key === 'H') {
        void doHomeReset(); // fire-and-forget: doHomeReset es async (2 fases)
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Botón HUD: reset a vista home (vía store counter)
  useEffect(() => {
    if (cameraHomeRequested > 0) {
      void doHomeReset(); // fire-and-forget: doHomeReset es async (2 fases)
    }
  }, [cameraHomeRequested]);

  return (
    <CameraControls
      ref={controlsRef}
      dollyToCursor
      // Velocidades calibradas para exploración cómoda del sistema solar
      dollySpeed={1.0}
      truckSpeed={2.0}
      // Límites de distancia en modo global (didáctico)
      minDistance={2}
      maxDistance={1000}
      // smoothTime: amortiguación (segundos) — similar a OrbitControls dampingFactor=0.05
      smoothTime={0.15}
      draggingSmoothTime={0.05}
      // Duración del tween home
      dampingFactor={HOME_DURATION_S}
      // CameraControls usa PointerEvents internamente (compatible mouse/touch/stylus)
      makeDefault={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export const CameraController = React.memo(function CameraController({
  planetPositionsRef,
  planetRadius,
}: CameraControllerProps) {
  const selectedBody = useAppStore((s) => s.selectedBody);
  // CameraController solo hace follow de planetas (PlanetId), no de la Luna.
  // La Luna usa frame-of-reference (origin offset) — no delta-vector follow.
  const selectedPlanet = selectedBody !== 'moon' ? selectedBody : null;
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const viewMode = useAppStore((s) => s.viewMode);

  const { camera } = useThree();
  /** Posición del planeta en el frame anterior — para calcular el delta orbital */
  const lastPlanetPos = useRef<Vector3 | null>(null);

  // Distancias dinámicas para OrbitControls en modo local
  const distances = useMemo(() => {
    if (viewMode === 'local') {
      return { min: 5, max: 500_000 };
    }
    return { min: 2, max: 200 };
  }, [viewMode]);

  // Velocidades de orbit dinámicas en modo local
  const orbitSpeeds = useMemo(() => {
    if (viewMode === 'local') {
      return { zoomSpeed: 2.0, rotateSpeed: 0.5, panSpeed: 1.0 };
    }
    return { zoomSpeed: 1.0, rotateSpeed: 1.0, panSpeed: 1.0 };
  }, [viewMode]);

  // Activa navegación por teclado (Tab, Escape, T, K) — siempre activa
  useKeyboardNavigation();

  // Obtener la posición REAL del planeta seleccionado desde el ref compartido
  const target =
    selectedPlanet && planetPositionsRef?.current[selectedPlanet]
      ? planetPositionsRef.current[selectedPlanet]
      : null;

  // Ref live al Vector3 del planeta seleccionado
  const livePlanetPosRef = useRef<Vector3 | null>(null);

  // useFocusCamera: solo activo en modo local (lerp hacia el planeta)
  const controlsRef = useFocusCamera({
    target,
    targetRef: livePlanetPosRef,
    ...(viewMode === 'local' && planetRadius !== undefined ? { planetRadius } : {}),
    reducedMotion: prefersReducedMotion,
  });

  // Follow mode:
  // - En modo local: frame-of-reference garantiza que el cuerpo seleccionado está en (0,0,0).
  //   Solo fijamos controls.target = (0,0,0). No hay delta-vector follow → no hay shake.
  // - En modo global: traslación rígida (delta-vector approach) — el planeta se mueve en el
  //   espacio y la cámara le sigue manteniendo el offset relativo.
  useFrame(() => {
    const controls = controlsRef.current;

    if (viewMode === 'local') {
      // Modo local: cuerpo seleccionado siempre en (0,0,0) por frame-of-reference (C.11)
      if (controls && cameraMode === 'focus') {
        controls.target.fromArray([0, 0, 0]);
      }
      // Limpiar refs para evitar salto al volver a modo global
      lastPlanetPos.current = null;
      livePlanetPosRef.current = null;
      return;
    }

    // Modo global: delta-vector follow
    const currentPos = planetPositionsRef?.current?.[selectedPlanet ?? ''];

    if (currentPos && selectedPlanet) {
      if (!livePlanetPosRef.current) {
        livePlanetPosRef.current = currentPos.clone();
      } else {
        livePlanetPosRef.current.copy(currentPos);
      }
    } else {
      livePlanetPosRef.current = null;
    }

    if (cameraMode !== 'focus' || !selectedPlanet) {
      lastPlanetPos.current = null;
      return;
    }

    if (!currentPos || !controls) return;

    if (lastPlanetPos.current === null) {
      lastPlanetPos.current = currentPos.clone();
      return;
    }

    const delta = new Vector3().subVectors(currentPos, lastPlanetPos.current);

    camera.position.add(delta);
    controls.target.add(delta);

    lastPlanetPos.current.copy(currentPos);
  });

  // En modo global: CameraControls con dollyToCursor
  if (viewMode === 'global') {
    return <GlobalCameraControls />;
  }

  // En modo local: OrbitControls + useFocusCamera (comportamiento PR#15 intacto)
  return (
    <OrbitControls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={controlsRef as Ref<any>}
      enableDamping
      dampingFactor={0.05}
      minDistance={distances.min}
      maxDistance={distances.max}
      enableRotate={true}
      enableZoom={true}
      enablePan={false}
      zoomSpeed={orbitSpeeds.zoomSpeed}
      rotateSpeed={orbitSpeeds.rotateSpeed}
    />
  );
});

CameraController.displayName = 'CameraController';
