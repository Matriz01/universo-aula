/**
 * cameraHelpers — funciones puras para la cámara libre en modo global.
 *
 * Separadas del componente React para facilitar testing unitario.
 *
 * Responsabilidades:
 * - Posición HOME (posición de cámara y target por defecto en modo global)
 * - Proyección de cursor/puntero a un punto del mundo sobre el plano del target
 * - Desplazar el target una fracción hacia un punto del mundo (zoom-to-cursor)
 */

import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Constantes exportadas
// ---------------------------------------------------------------------------

/**
 * Posición global "home" de la cámara (vista panorámica del sistema solar).
 * Coincide con camera.position del Canvas en SolarSystemScene.
 */
export const HOME_CAMERA_POSITION = new Vector3(0, 35, 70);

/**
 * Target "home" de OrbitControls en modo global.
 * El Sol está siempre en el origen.
 */
export const HOME_TARGET_POSITION = new Vector3(0, 0, 0);

// ---------------------------------------------------------------------------
// computeWorldPointOnTargetPlane
// ---------------------------------------------------------------------------

/**
 * Proyecta un rayo (cameraPosition + t*rayDir) sobre el plano que pasa
 * por `target` y es perpendicular a `cameraDirection`.
 *
 * El plano se define por:
 *   normal = cameraDirection (normalizado)
 *   punto  = target
 *
 * Ecuación de intersección rayo-plano:
 *   t = (target - cameraPos) · normal / (rayDir · normal)
 *   worldPoint = cameraPos + t * rayDir
 *
 * Si rayDir es paralelo al plano (denom ≈ 0), devuelve `target` sin modificar.
 *
 * @param cameraPosition - Posición de la cámara en espacio mundo
 * @param cameraDirection - Dirección de vista de la cámara (normalizada)
 * @param target - Punto del mundo por el que pasa el plano
 * @param rayDir - Dirección del rayo desde la cámara (normalizada)
 * @returns Punto de intersección en espacio mundo, o target si no hay intersección
 */
export function computeWorldPointOnTargetPlane(
  cameraPosition: Vector3,
  cameraDirection: Vector3,
  target: Vector3,
  rayDir: Vector3,
): Vector3 {
  const normal = cameraDirection.clone().normalize();
  const denom = rayDir.dot(normal);

  if (Math.abs(denom) < 1e-6) {
    // Rayo paralelo al plano — sin intersección definida: devolver target
    return target.clone();
  }

  const toTarget = target.clone().sub(cameraPosition);
  const t = toTarget.dot(normal) / denom;

  return cameraPosition.clone().add(rayDir.clone().multiplyScalar(t));
}

// ---------------------------------------------------------------------------
// moveTargetFraction
// ---------------------------------------------------------------------------

/**
 * Calcula un nuevo target desplazado una fracción `k` (0..1) desde `target`
 * hacia `worldPoint`.
 *
 * Fórmula: newTarget = target + k * (worldPoint - target)
 *          = lerp(target, worldPoint, k)
 *
 * El objeto `target` original NO se modifica — se devuelve un nuevo Vector3.
 *
 * @param target - Posición actual del target de OrbitControls
 * @param worldPoint - Punto del mundo hacia el que desplazar
 * @param k - Fracción (0 = no mover, 1 = llegar al worldPoint)
 * @returns Nuevo Vector3 con la posición desplazada
 */
export function moveTargetFraction(target: Vector3, worldPoint: Vector3, k: number): Vector3 {
  return target.clone().lerp(worldPoint, k);
}
