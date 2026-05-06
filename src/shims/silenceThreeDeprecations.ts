/**
 * Silencia warnings de deprecación de Three.js que vienen de dependencias upstream
 * (React Three Fiber, Drei, postprocessing) y que no podemos arreglar nosotros.
 *
 * Ahora mismo solo filtra el aviso de THREE.Clock (deprecado en favor de
 * THREE.Timer en three@0.184). R3F 9.x sigue usando Clock internamente.
 *
 * Cuando R3F migre a Timer, esta función deja de tener efecto y puede borrarse.
 *
 * Importar UNA SOLA VEZ en main.tsx, antes que cualquier otro import de scenes.
 */

const SILENCED_PREFIXES = ['THREE.Clock: This module has been deprecated'];

export function silenceThreeDeprecations(): void {
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && SILENCED_PREFIXES.some((p) => first.startsWith(p))) {
      return;
    }
    originalWarn(...args);
  };
}
