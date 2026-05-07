/**
 * CameraController — integra OrbitControls con navegación por teclado y focus de cámara.
 *
 * - Monta <OrbitControls> de Drei con la ref de useFocusCamera
 * - Delega navegación por teclado a useKeyboardNavigation
 * - Lee selectedPlanet y prefersReducedMotion del store
 * - Lee posición del planeta seleccionado via useBodyPosition (time-driven)
 * - En cameraMode === 'focus': aplica delta-vector al par (camera, target) para seguir al planeta
 *   sin interferir con la rotación libre del usuario (approach de traslación rígida)
 *
 * Post-refactor-C: ya no depende de planetPositionsRef. La posición viene
 * directamente de useBodyPosition(selectedPlanetData, simulationTime, viewMode).
 */

import React, { type Ref, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';
import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';
import { computeBodyPosition } from '@/scenes/hooks/useBodyPosition';
import { usePlanetsData } from '@/scenes/hooks/usePlanetsData';

export interface CameraControllerProps {
  /** @deprecated ya no se usa; posición via useBodyPosition */
  planetPositionsRef?: React.MutableRefObject<Record<string, Vector3>>;
}

export const CameraController = React.memo(function CameraController(
  _props: CameraControllerProps,
) {
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const viewMode = useAppStore((s) => s.viewMode);

  const { camera } = useThree();
  const { data } = usePlanetsData();

  /** Posición del planeta en el frame anterior — para calcular el delta orbital */
  const lastPlanetPos = useRef<Vector3 | null>(null);

  // Datos del planeta seleccionado
  const selectedPlanetData = useMemo(
    () => (selectedPlanet && data ? data.planets.find((p) => p.id === selectedPlanet) : undefined),
    [selectedPlanet, data],
  );

  // Distancias dinámicas según viewMode:
  // - local: permite zoom muy cercano al planeta + alejarse hasta ver el Sol (~149598 u)
  // - global: rango didáctico compacto
  const distances = useMemo(() => {
    if (viewMode === 'local') {
      return { min: 5, max: 500_000 };
    }
    return { min: 2, max: 200 };
  }, [viewMode]);

  // Velocidades de orbit dinámicas según viewMode
  const orbitSpeeds = useMemo(() => {
    if (viewMode === 'local') {
      return { zoomSpeed: 2.0, rotateSpeed: 0.5, panSpeed: 1.0 };
    }
    return { zoomSpeed: 1.0, rotateSpeed: 1.0, panSpeed: 1.0 };
  }, [viewMode]);

  // Activa navegación por teclado
  useKeyboardNavigation();

  // Calculamos posición del planeta para useFocusCamera — solo si hay planeta seleccionado.
  // computeBodyPosition es puro, invocarlo aquí no provoca re-renders.
  const initialTarget = useMemo((): Vector3 | null => {
    if (!selectedPlanetData) return null;
    const time = useAppStore.getState().simulationTime;
    return computeBodyPosition(selectedPlanetData, time, viewMode);
  }, [selectedPlanetData, viewMode]);

  const controlsRef = useFocusCamera({
    target: initialTarget,
    reducedMotion: prefersReducedMotion,
  });

  // Follow mode: traslación rígida (delta-vector approach)
  useFrame(() => {
    if (cameraMode !== 'focus' || !selectedPlanetData) {
      lastPlanetPos.current = null;
      return;
    }

    // Calculamos la posición actual del planeta en este frame
    const time = useAppStore.getState().simulationTime;
    const currentPos = computeBodyPosition(selectedPlanetData, time, viewMode);
    const controls = controlsRef.current;
    if (!controls) return;

    if (lastPlanetPos.current === null) {
      lastPlanetPos.current = currentPos.clone();
      return;
    }

    const delta = new Vector3().subVectors(currentPos, lastPlanetPos.current);

    camera.position.add(delta);
    controls.target.add(delta);

    lastPlanetPos.current.copy(currentPos);
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
