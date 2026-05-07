/**
 * SimulationTicker — único punto de avance del simulationClock en la escena R3F.
 *
 * INVARIANTE: Este es el ÚNICO componente que llama a simulationClock.tick().
 * Ningún otro componente o hook debe mutar el JD del reloj de simulación.
 *
 * Lee level y simulationSpeed de forma no-reactiva (getState()) para evitar
 * re-renders del ticker cuando el usuario cambia nivel o velocidad. El cambio
 * se recoge en el siguiente frame (~16ms), latencia imperceptible.
 *
 * Diseño: §2 Wiring — montado como primer hijo de <SolarSystemContent>.
 */

import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import { tick, speedupForLevel } from '@/scenes/simulationClock';

/**
 * Componente sin render (retorna null) que avanza el simulationClock
 * exactamente una vez por frame de R3F.
 */
export function SimulationTicker(): null {
  useFrame((_state, delta) => {
    const { level, simulationSpeed } = useAppStore.getState();
    tick(delta, simulationSpeed * speedupForLevel(level));
  });
  return null;
}

SimulationTicker.displayName = 'SimulationTicker';
