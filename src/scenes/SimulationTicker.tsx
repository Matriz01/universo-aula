/**
 * SimulationTicker — único punto de avance del simulationClock en la escena R3F.
 *
 * INVARIANTE: Este es el ÚNICO componente que llama a simulationClock.tick().
 * Ningún otro componente o hook debe mutar el JD del reloj de simulación.
 *
 * Lee simulationSpeed de forma no-reactiva (getState()) para evitar
 * re-renders del ticker cuando el usuario cambia la velocidad. El cambio
 * se recoge en el siguiente frame (~16ms), latencia imperceptible.
 *
 * Diseño Batch 4: tick(delta, simulationSpeed) — speedup en s_sim/s_real.
 * El nivel pedagógico afecta solo al modelo orbital, no a la velocidad del reloj.
 * Diseño: §2 Wiring — montado como primer hijo de <SolarSystemContent>.
 */

import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import { tick } from '@/scenes/simulationClock';

/**
 * Componente sin render (retorna null) que avanza el simulationClock
 * exactamente una vez por frame de R3F.
 *
 * `simulationSpeed` es en s_sim/s_real (de SPEED_STOPS_SECONDS_PER_SECOND).
 * La fórmula jd += (delta × simulationSpeed) / 86400 convierte correctamente a días JD.
 */
export function SimulationTicker(): null {
  // Priority -2: garantiza que el JD avanza ANTES que OriginTracker (-1), que los
  // escritores de posición (-0.5) y que los lectores (0). Invariante por frame:
  // SimulationTicker (-2) → OriginTracker (-1) → position writers (-0.5)
  // → consumers/readers (0) → render/composer (1, SOLO quien renderiza — en R3F
  // priority > 0 implica render takeover, ver BodyMarker.tsx / bug C1).
  // Sin esto, OriginTracker computa el offset con JD del frame anterior mientras que
  // los consumers leen el JD ya avanzado para este frame → mismatch = motion-per-frame
  // de drift en la posición del cuerpo seleccionado, visible como temblor a alta velocidad.
  useFrame((_state, delta) => {
    const { simulationSpeed } = useAppStore.getState();
    tick(delta, simulationSpeed);
  }, -2);
  return null;
}

SimulationTicker.displayName = 'SimulationTicker';
