/**
 * Módulo toonGradient — DataTexture singleton ref-counted para MeshToonMaterial.
 *
 * La textura contiene 4 escalones de luminancia ([0, 64, 128, 255]) en formato
 * RedFormat (canal único), sin interpolación bilineal (NearestFilter), que produce
 * el aspecto cel-shading de 4 pasos en MeshToonMaterial.
 *
 * API pública:
 *  - createToonGradientTexture(): DataTexture  — crea o devuelve el singleton (sin ref-count)
 *  - acquireToonGradientTexture(): DataTexture  — incrementa ref-count, devuelve singleton
 *  - releaseToonGradientTexture(): void         — decrementa ref-count, dispone cuando llega a 0
 *  - disposeToonGradientTexture(): void         — dispose de emergencia sin contar refs
 *
 * Spec: REQ-TOON-1 (singleton), REQ-DISP-2 (dispose en último consumer)
 * Design: §1 toonGradient.ts module, ADR-1
 */

import { DataTexture, NearestFilter, RedFormat } from 'three';

let instance: DataTexture | null = null;
let refCount = 0;

/**
 * Crea la DataTexture singleton si no existe, o la devuelve si ya está creada.
 * No modifica el ref-count — usar acquireToonGradientTexture para gestión de ciclo de vida.
 */
export function createToonGradientTexture(): DataTexture {
  if (!instance) {
    const data = new Uint8Array([0, 64, 128, 255]);
    const tex = new DataTexture(data, 4, 1, RedFormat);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    tex.needsUpdate = true;
    instance = tex;
  }
  return instance;
}

/**
 * Incrementa el ref-count y devuelve la textura singleton.
 * Cada llamada a acquireToonGradientTexture debe tener una llamada correspondiente
 * a releaseToonGradientTexture cuando el consumer se desmonta.
 */
export function acquireToonGradientTexture(): DataTexture {
  const tex = createToonGradientTexture();
  refCount++;
  return tex;
}

/**
 * Decrementa el ref-count. Cuando llega a 0 (o menos), dispone la textura
 * y resetea el singleton para permitir una nueva creación si se necesita.
 */
export function releaseToonGradientTexture(): void {
  refCount--;
  if (refCount <= 0) {
    instance?.dispose();
    instance = null;
    refCount = 0;
  }
}

/**
 * Dispone la textura de emergencia sin consultar el ref-count.
 * Útil en teardown de módulo o pruebas.
 */
export function disposeToonGradientTexture(): void {
  instance?.dispose();
  instance = null;
  refCount = 0;
}
