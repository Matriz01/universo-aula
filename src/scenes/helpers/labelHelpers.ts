/**
 * labelHelpers — funciones puras para posicionamiento de labels de planetas.
 *
 * Feature C: Planet labels positioned below the sphere.
 *
 * El label se posiciona en [0, -planetRadius * 1.5, 0] en coordenadas locales
 * del grupo del planeta.
 */

// ---------------------------------------------------------------------------
// Constante
// ---------------------------------------------------------------------------

/** Factor de desplazamiento del label por debajo del radio del planeta. */
export const LABEL_Y_FACTOR = 1.5;

// ---------------------------------------------------------------------------
// computeLabelOffset
// ---------------------------------------------------------------------------

/**
 * Calcula el vector de posición del label en coordenadas locales del planeta.
 *
 * @param planetRadius - Radio visual del planeta en unidades de escena
 * @returns [x, y, z] donde y = -planetRadius * LABEL_Y_FACTOR
 */
export function computeLabelOffset(planetRadius: number): [number, number, number] {
  return [0, -planetRadius * LABEL_Y_FACTOR, 0];
}
