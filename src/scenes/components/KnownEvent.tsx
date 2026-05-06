/**
 * <KnownEvent> — renderiza un evento conocido (cometa, etc.) con su órbita propia.
 *
 * Esfera pequeña blanca-azulada con posición actualizada usando
 * la mecánica orbital kepleriana del evento.
 *
 * MVP: Cometa Halley únicamente.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { SphereGeometry, MeshBasicMaterial, Color, Vector3 } from 'three';
import type { KnownEvent as KnownEventData } from '@/scenes/data/known-events.types';
import {
  solveKeplerNewtonRaphson,
  applyOrbitalRotation,
  degToRad,
  SPEEDUP_APRENDIZ,
} from '@/scenes/orbital';
import { visualDistance } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface KnownEventProps {
  event: KnownEventData;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const EVENT_RADIUS = 0.1;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const KnownEvent = React.memo(function KnownEvent({ event }: KnownEventProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const posRef = useRef(new Vector3());

  const { op } = useMemo(() => ({ op: event.orbital_params }), [event.orbital_params]);

  const { a, n, M0, omegaArg, OmegaNode, inc } = useMemo(
    () => ({
      a: visualDistance(op.semi_major_axis_AU),
      n: (2 * Math.PI) / op.orbital_period_days,
      M0: degToRad(op.mean_anomaly_J2000_deg),
      omegaArg: degToRad(op.argument_perihelion_deg),
      OmegaNode: degToRad(op.longitude_ascending_node_deg),
      inc: degToRad(op.inclination_deg),
    }),
    [op],
  );

  const geometry = useMemo(() => new SphereGeometry(EVENT_RADIUS, 8, 8), []);
  const material = useMemo(
    () => new MeshBasicMaterial({ color: new Color(event.color_hex) }),
    [event.color_hex],
  );

  useFrame((_, dt) => {
    elapsed.current += dt * SPEEDUP_APRENDIZ;

    const M = M0 + n * elapsed.current;
    const ecc = op.eccentricity;
    const E = solveKeplerNewtonRaphson(M, ecc, 1e-6, 8);
    const nu =
      2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    const r = a * (1 - ecc * Math.cos(E));
    applyOrbitalRotation(posRef.current, r, nu, omegaArg, OmegaNode, inc);

    if (meshRef.current) {
      meshRef.current.position.copy(posRef.current);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} name={`known-event-${event.id}`} />
  );
});

KnownEvent.displayName = 'KnownEvent';
