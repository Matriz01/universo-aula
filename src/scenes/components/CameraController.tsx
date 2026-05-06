/**
 * CameraController — integra OrbitControls con navegación por teclado y focus de cámara.
 *
 * - Monta <OrbitControls> de Drei con la ref de useFocusCamera
 * - Delega navegación por teclado a useKeyboardNavigation
 * - Lee selectedPlanet y prefersReducedMotion del store
 * - Convierte PlanetId → Vector3 para useFocusCamera
 */

import React, { type Ref } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { useFocusCamera } from '@/scenes/hooks/useFocusCamera';
import { useKeyboardNavigation } from '@/scenes/hooks/useKeyboardNavigation';

// Posiciones aproximadas de los planetas para el focus (se actualizarán con los valores reales)
// En un sistema real, estas posiciones vendrían de usePlanetPosition;
// para el MVP usamos posiciones estáticas basadas en visualDistance
const PLANET_POSITIONS: Record<string, Vector3> = {
  mercury: new Vector3(8.777, 0, 0),
  venus: new Vector3(11.282, 0, 0),
  earth: new Vector3(13.0, 0, 0),
  mars: new Vector3(16.0, 0, 0),
  jupiter: new Vector3(26.0, 0, 0),
  saturn: new Vector3(32.0, 0, 0),
  uranus: new Vector3(39.0, 0, 0),
  neptune: new Vector3(44.66, 0, 0),
  pluto: new Vector3(50.0, 0, 0),
};

export const CameraController = React.memo(function CameraController() {
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const prefersReducedMotion = useAppStore((s) => s.prefersReducedMotion);

  // Activa navegación por teclado
  useKeyboardNavigation();

  // Calcula el target de la cámara
  const target = selectedPlanet ? (PLANET_POSITIONS[selectedPlanet] ?? null) : null;

  const controlsRef = useFocusCamera({
    target,
    reducedMotion: prefersReducedMotion,
  });

  return (
    <OrbitControls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={controlsRef as Ref<any>}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={120}
    />
  );
});

CameraController.displayName = 'CameraController';
