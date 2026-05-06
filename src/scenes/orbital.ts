/**
 * Mecánica orbital pura para el Sistema Solar MVP.
 *
 * Funciones puras (sin React, sin Three.js hooks) que implementan:
 * - Kepler por Newton-Raphson
 * - Rotaciones orbitales estándar (ω, i, Ω)
 *
 * Fuente de las fórmulas: design §4.3 y §4.4.
 */
import type { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Constantes de simulación temporal (segundos reales → días simulados)
// ---------------------------------------------------------------------------

/** 1 s real = 30 días simulados (nivel Explorador — órbitas circulares rápidas) */
export const SPEEDUP_EXPLORADOR = 30;

/** 1 s real = 10 días simulados (nivel Aprendiz — elipse simplificada) */
export const SPEEDUP_APRENDIZ = 10;

/** 1 s real = 5 días simulados (nivel Investigador — Kepler real, más lento) */
export const SPEEDUP_INVESTIGADOR = 5;

/** Época de referencia Julian Date J2000.0 */
export const J2000_JD = 2451545.0;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Convierte grados a radianes. */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// Kepler — Newton-Raphson
// ---------------------------------------------------------------------------

/**
 * Resuelve la ecuación de Kepler M = E − e·sin(E) por Newton-Raphson.
 *
 * Converge en <8 iteraciones para e < 0.5 (todos los planetas del Sistema Solar
 * incluyendo Plutón con e=0.2488).
 *
 * @param M - Anomalía media (radianes, cualquier rango — se normaliza internamente)
 * @param e - Excentricidad [0, 1)
 * @param tol - Tolerancia de convergencia (default 1e-6)
 * @param maxIter - Máximo de iteraciones (default 8)
 * @returns Anomalía excéntrica E (radianes)
 */
export function solveKeplerNewtonRaphson(M: number, e: number, tol = 1e-6, maxIter = 8): number {
  // Normalizar M a [-π, π] para mejor convergencia inicial
  let Mn = M % (2 * Math.PI);
  if (Mn > Math.PI) Mn -= 2 * Math.PI;
  if (Mn < -Math.PI) Mn += 2 * Math.PI;

  // Semilla: para e pequeño E ≈ M; para e grande E ≈ π
  let E = e < 0.8 ? Mn : Math.PI;

  for (let k = 0; k < maxIter; k++) {
    const f = E - e * Math.sin(E) - Mn;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < tol) return E;
  }
  return E;
}

// ---------------------------------------------------------------------------
// Rotaciones orbitales
// ---------------------------------------------------------------------------

/**
 * Aplica las tres rotaciones del plano orbital a un punto en coordenadas
 * planetocéntricas (r, ν) y escribe el resultado en `out`:
 *
 *   1) ω (argumento del perihelio) alrededor de Z
 *   2) i (inclinación)             alrededor de X
 *   3) Ω (longitud del nodo asc.)  alrededor de Z
 *
 * Convención astronómica estándar (eclíptica de la eclíptica J2000).
 * Three.js: Y arriba; eclíptica mapeada a plano XZ con Y = componente de inclinación.
 *
 * @param out   - Vector3 de salida (se sobreescribe)
 * @param r     - Radio vectorial (unidades visuales)
 * @param nu    - Anomalía verdadera ν (radianes)
 * @param omega - Argumento del perihelio ω (radianes)
 * @param Omega - Longitud del nodo ascendente Ω (radianes)
 * @param inc   - Inclinación i (radianes)
 */
export function applyOrbitalRotation(
  out: Vector3,
  r: number,
  nu: number,
  omega: number,
  Omega: number,
  inc: number,
): void {
  // Posición en plano orbital (x' apunta al perihelio)
  const xp = r * Math.cos(nu);
  const yp = r * Math.sin(nu);

  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosi = Math.cos(inc);
  const sini = Math.sin(inc);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);

  // Composición R_z(Ω) · R_x(i) · R_z(ω) aplicada al vector (xp, yp, 0)
  const x = (cosO * cosw - sinO * sinw * cosi) * xp + (-cosO * sinw - sinO * cosw * cosi) * yp;
  const y = sinw * sini * xp + cosw * sini * yp;
  const z = (sinO * cosw + cosO * sinw * cosi) * xp + (-sinO * sinw + cosO * cosw * cosi) * yp;

  out.set(x, y, z);
}
