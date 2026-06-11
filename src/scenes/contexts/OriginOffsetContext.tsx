/**
 * OriginOffsetContext — contexto React que distribuye el offset del origen de referencia.
 *
 * ADR-1: Se usa un ref (no state) para evitar re-renders en consumidores.
 * El ref se actualiza en OriginTracker (useFrame priority -1) ANTES que los
 * escritores de posición (-0.5) y que los lectores (0). Consumidores leen el
 * valor actual en su propio useFrame. Invariante por frame:
 * SimulationTicker (-2) → OriginTracker (-1) → position writers (-0.5)
 * → consumers/readers (0) → render/composer (1, solo quien renderiza).
 *
 * En modo global: offset = (0,0,0) → sin cambio en posiciones.
 * En modo local:  offset = posición absoluta del cuerpo seleccionado →
 *                 ese cuerpo es siempre el origen matemático (REQ-FRAME-1).
 */

import React, { createContext, useContext, useRef } from 'react';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Tipo y valor por defecto
// ---------------------------------------------------------------------------

export type OriginOffsetRef = React.MutableRefObject<Vector3>;

// Valor por defecto: ref a (0,0,0) — se usa si no hay Provider en el árbol
const defaultRef: OriginOffsetRef = { current: new Vector3(0, 0, 0) };

export const OriginOffsetContext = createContext<OriginOffsetRef>(defaultRef);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * OriginOffsetProvider — provee un MutableRefObject<Vector3> compartido
 * a todos los consumidores del árbol.
 *
 * Debe envolver el árbol de la escena (dentro del Canvas).
 * El OriginTracker actualiza el ref cada frame con priority -1.
 */
export function OriginOffsetProvider({ children }: { children: React.ReactNode }) {
  const offsetRef = useRef<Vector3>(new Vector3(0, 0, 0));

  return <OriginOffsetContext.Provider value={offsetRef}>{children}</OriginOffsetContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook consumidor
// ---------------------------------------------------------------------------

/**
 * useOriginOffset — hook para leer el ref del offset de origen.
 *
 * No provoca re-renders: el ref se actualiza de forma imperativa en useFrame.
 * Los consumidores deben leer `ref.current` dentro de su propio useFrame.
 */
export function useOriginOffset(): OriginOffsetRef {
  return useContext(OriginOffsetContext);
}
