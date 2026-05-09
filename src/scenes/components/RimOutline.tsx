/**
 * Componente <RimOutline> — outline cartoon via mesh BackSide escalado.
 *
 * Técnica estándar de outline sin postprocesado en Three.js:
 * - La misma geometría del planeta padre se renderiza con BackSide
 * - Escalada al 1.05× (configurable) respecto al planeta
 * - MeshBasicMaterial oscuro + depthWrite=false para evitar z-fighting
 *
 * Montado solo cuando level === 'explorador' (responsabilidad del padre).
 *
 * Spec: REQ-RIM-1, REQ-RIM-2
 * Design: §1 RimOutline.tsx module, ADR-2
 */

import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import { BackSide } from 'three';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface RimOutlineProps {
  /** Geometría del planeta padre — se reutiliza por referencia (no se clona). */
  geometry: BufferGeometry;
  /** Color del outline (por defecto negro). Debe ser oscuro para efecto cartoon. */
  color?: string;
  /** Factor de escala uniforme (por defecto 1.05). */
  scale?: number;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function RimOutline({ geometry, color = '#000000', scale = 1.05 }: RimOutlineProps) {
  const scaleVec: [number, number, number] = useMemo(() => [scale, scale, scale], [scale]);

  return (
    <mesh geometry={geometry} scale={scaleVec}>
      <meshBasicMaterial color={color} side={BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
