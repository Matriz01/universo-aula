/**
 * CameraController — integra OrbitControls con navegación por teclado y focus de cámara.
 *
 * - Monta <OrbitControls> de Drei con la ref de useFocusCamera
 * - Delega navegación por teclado a useKeyboardNavigation
 * - Lee selectedPlanet y prefersReducedMotion del store
 * - Lee posición REAL del planeta desde planetPositionsRef (actualizado por Planet/Saturn)
 * - En cameraMode === 'focus': sigue al planeta en cada frame (follow mode)
 */

import React, { type Ref, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Vector3 } from 'three';
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

  // Distancias dinámicas según viewMode:
  // - local: permite zoom muy cercano al planeta + alejarse hasta ver el Sol (~149598 u)
  // - global: rango didáctico compacto
  const distances = useMemo(() => {
    if (viewMode === 'local') {
      return { min: 5, max: 500_000 };
    }
    return { min: 2, max: 200 };
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

  // Follow mode: si cameraMode === 'focus' y hay planeta seleccionado,
  // actualizar controls.target en cada frame para seguir al planeta en órbita
  useFrame(() => {
    if (cameraMode !== 'focus') return;
    if (!selectedPlanet) return;
    const pos = planetPositionsRef?.current[selectedPlanet];
    if (!pos) return;
    const controls = controlsRef.current;
    if (!controls) return;
    // Actualizar el target de OrbitControls directamente (sin tween)
    controls.target.fromArray([pos.x, pos.y, pos.z]);
    controls.update();
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
    />
  );
});

CameraController.displayName = 'CameraController';
