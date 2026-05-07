/**
 * PausedBridge — puente entre Zustand (simulationSpeed) y simulationClock.setPaused().
 *
 * Componente sin render que suscribe a simulationSpeed del store y sincroniza
 * el flag paused del reloj de simulación. Se dispara solo en eventos discretos
 * del usuario (clic en pause/play), NO en cada frame.
 *
 * Puede montarse fuera del <Canvas> ya que no usa useFrame ni ninguna API R3F.
 * Diseño: §2 Wiring — ADR-5.
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { setPaused } from '@/scenes/simulationClock';

/**
 * Componente sin render que sincroniza simulationSpeed === 0 → clock.setPaused(true).
 * Retorna null; no produce ningún elemento DOM.
 */
export function PausedBridge(): null {
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);

  useEffect(() => {
    setPaused(simulationSpeed === 0);
  }, [simulationSpeed]);

  return null;
}

PausedBridge.displayName = 'PausedBridge';
