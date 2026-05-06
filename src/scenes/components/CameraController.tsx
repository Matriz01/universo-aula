/**
 * CameraController — integra OrbitControls con navegación por teclado y focus de cámara.
 *
 * - Monta <OrbitControls> de Drei con la ref de useFocusCamera
 * - Delega navegación por teclado a useKeyboardNavigation
 * - Lee selectedPlanet y prefersReducedMotion del store
 * - Lee posición REAL del planeta desde planetPositionsRef (actualizado por Planet/Saturn)
 * - En cameraMode === 'focus': aplica delta-vector al par (camera, target) para seguir al planeta
 *   sin interferir con la rotación libre del usuario (approach de traslación rígida)
 */

import React, { type Ref, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';
import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';

export interface CameraControllerProps {
  /** Ref al mapa de posiciones reales de planetas (actualizado por Planet/Saturn en useFrame) */
  planetPositionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

export const CameraController = React.memo(function CameraController({
  planetPositionsRef,
}: CameraControllerProps) {
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const viewMode = useAppStore((s) => s.viewMode);

  const { camera } = useThree();
  /** Posición del planeta en el frame anterior — para calcular el delta orbital */
  const lastPlanetPos = useRef<Vector3 | null>(null);

  // Distancias dinámicas según viewMode:
  // - local: permite zoom muy cercano al planeta + alejarse hasta ver el Sol (~149598 u)
  // - global: rango didáctico compacto
  const distances = useMemo(() => {
    if (viewMode === 'local') {
      return { min: 5, max: 500_000 };
    }
    return { min: 2, max: 200 };
  }, [viewMode]);

  // Velocidades de orbit dinámicas según viewMode:
  // - local: zoomSpeed agresivo (escala enorme), rotateSpeed suave
  // - global: valores por defecto
  const orbitSpeeds = useMemo(() => {
    if (viewMode === 'local') {
      return { zoomSpeed: 2.0, rotateSpeed: 0.5, panSpeed: 1.0 };
    }
    return { zoomSpeed: 1.0, rotateSpeed: 1.0, panSpeed: 1.0 };
  }, [viewMode]);

  // Activa navegación por teclado
  useKeyboardNavigation();

  // Obtener la posición REAL del planeta seleccionado desde el ref compartido
  // Si el ref no tiene la posición aún (primera frame), target será null → no tween
  const target =
    selectedPlanet && planetPositionsRef?.current[selectedPlanet]
      ? planetPositionsRef.current[selectedPlanet]
      : null;

  const controlsRef = useFocusCamera({
    target,
    reducedMotion: prefersReducedMotion,
  });

  // Follow mode: traslación rígida (delta-vector approach)
  // En lugar de reasignar controls.target = planetPos (lo que causa lucha con el damping de
  // OrbitControls y bloquea la rotación del usuario), aplicamos el DELTA de movimiento orbital
  // del planeta al par (camera.position, controls.target) como traslación rígida.
  // OrbitControls ve el target estable (planeta siempre "arriba") → la rotación del usuario persiste.
  useFrame(() => {
    if (cameraMode !== 'focus' || !selectedPlanet) {
      // Reset al salir de follow mode para que la próxima entrada inicialice sin salto
      lastPlanetPos.current = null;
      return;
    }

    const currentPos = planetPositionsRef?.current?.[selectedPlanet];
    if (!currentPos) return;

    const controls = controlsRef.current;
    if (!controls) return;

    if (lastPlanetPos.current === null) {
      // Primera frame de follow: inicializar sin mover la cámara
      lastPlanetPos.current = currentPos.clone();
      return;
    }

    // Delta del movimiento orbital del planeta este frame
    const delta = new Vector3().subVectors(currentPos, lastPlanetPos.current);

    // Traslación rígida: cámara y target se mueven JUNTOS con el planeta
    // El offset relativo (camera.position - controls.target) queda intacto → rotación preservada
    camera.position.add(delta);
    controls.target.add(delta);

    lastPlanetPos.current.copy(currentPos);

    // NO llamar controls.update() — Drei OrbitControls lo hace internamente cada frame
  });

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
