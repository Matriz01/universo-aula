/**
 * <BodyMarker> — marcador estilo NASA Eyes para cuerpos celestes pequeños/lejanos.
 *
 * Renderiza un círculo + label en pantalla, con tamaño constante en píxeles
 * independientemente del zoom o la distancia. Útil para hacer visible un cuerpo
 * (Luna, Sol desde planetas exteriores, Tierra desde Luna) que de otra forma
 * sería sub-pixel y casi imposible de localizar.
 *
 * Implementación: drei `<Html>` con CSS — overlay DOM en lugar de geometría 3D.
 * Coste irrelevante para 2-3 marcadores; legibilidad tipográfica perfecta.
 *
 * No intercepta clics si no se pasa onClick (pointer-events: none).
 */

import React, { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Vector3 } from 'three';

export interface BodyMarkerProps {
  /** Ref live a la posición del cuerpo (actualizada cada frame por el hook que la calcula). */
  positionRef: MutableRefObject<Vector3>;
  /** Texto del label (e.g. "Luna", "Sol", "Tierra"). */
  label: string;
  /** Color del ring y del texto. Default blanco. */
  color?: string;
  /** Si false, no renderiza nada. Default true. */
  visible?: boolean;
  /** Click handler opcional. Si se pasa, el marcador es interactivo. */
  onClick?: () => void;
}

export const BodyMarker = React.memo(function BodyMarker({
  positionRef,
  label,
  color = '#ffffff',
  visible = true,
  onClick,
}: BodyMarkerProps) {
  const groupRef = useRef<Group>(null);

  // Priority 1: el marker lee su posición DESPUÉS de TODOS los consumers
  // priority-0 que la escriben (el sprite del planeta calcula su posición vía
  // usePlanetPosition en priority 0). El invariante de orden por frame es
  // SimulationTicker (-2) → OriginTracker (-1) → consumers (0) → marker (1).
  // Sin esta prioridad tardía, sprite y label se leían en el mismo nivel (0)
  // sin orden garantizado → el marker podía leer el ref del frame anterior →
  // drift de 1 frame → label desplazado respecto al sprite en modo local (#44).
  useFrame(() => {
    if (!groupRef.current) return;
    const p = positionRef.current;
    groupRef.current.position.set(p.x, p.y, p.z);
  }, 1);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <Html center sprite style={{ pointerEvents: onClick ? 'auto' : 'none' }}>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            // En modo local OrbitControls está activo. Si el pointerdown/up del
            // botón se propaga al domElement de OrbitControls, un micro-jitter
            // entre down y up se interpreta como drag-rotate y cancela el click
            // nativo → la selección no dispara (#43). Cortamos la propagación DOM
            // para que OrbitControls no reciba estos eventos; onClick sigue intacto.
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            aria-label={`Ir a ${label}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              userSelect: 'none',
              background: 'transparent',
              border: 'none',
              // Padding amplía el área clicable de planetas lejanos (UX, no es
              // la causa raíz del #43). El offset visual del ring/label es
              // despreciable frente a la ganancia de alcance del hit target.
              padding: 4,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textShadow: '0 0 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textShadow: '0 0 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        )}
      </Html>
    </group>
  );
});

BodyMarker.displayName = 'BodyMarker';
