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

  useFrame(() => {
    if (!groupRef.current) return;
    const p = positionRef.current;
    groupRef.current.position.set(p.x, p.y, p.z);
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <Html center sprite style={{ pointerEvents: onClick ? 'auto' : 'none' }}>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={`Ir a ${label}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              userSelect: 'none',
              background: 'transparent',
              border: 'none',
              padding: 0,
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
