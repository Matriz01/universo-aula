/**
 * Tests para las funciones helpers de cámara libre (global mode).
 *
 * A1: After calling home-reset, target ≈ (0,0,0)
 * A2: computeWorldPointUnderCursor — proyección NDC → plano mundo
 * A3: moveTargetFraction — mueve target k-fracción hacia worldPoint
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';

import {
  computeWorldPointOnTargetPlane,
  moveTargetFraction,
  HOME_CAMERA_POSITION,
  HOME_TARGET_POSITION,
} from '@/scenes/helpers/cameraHelpers';

describe('HOME constants', () => {
  it('HOME_TARGET_POSITION es (0,0,0)', () => {
    expect(HOME_TARGET_POSITION.x).toBe(0);
    expect(HOME_TARGET_POSITION.y).toBe(0);
    expect(HOME_TARGET_POSITION.z).toBe(0);
  });

  it('HOME_CAMERA_POSITION tiene y > 0 y z > 0 (perspectiva típica desde arriba)', () => {
    expect(HOME_CAMERA_POSITION.y).toBeGreaterThan(0);
    expect(HOME_CAMERA_POSITION.z).toBeGreaterThan(0);
  });
});

describe('computeWorldPointOnTargetPlane', () => {
  it('con cursor en el centro (0,0) y cámara mirando hacia el origen, devuelve target', () => {
    // Cámara en (0, 0, 10) mirando a (0,0,0) — la dirección es (0,0,-1).
    // El rayo desde (0,0) NDC va directo al centro, que es el target (0,0,0).
    // El plano pasa por target, perpendicular a la dirección de cámara.
    const cameraPosition = new Vector3(0, 0, 10);
    const cameraDirection = new Vector3(0, 0, -1); // mirando hacia -Z
    const target = new Vector3(0, 0, 0);
    // NDC (0,0) = centro de pantalla → rayo coincide con dirección de cámara
    const result = computeWorldPointOnTargetPlane(
      cameraPosition,
      cameraDirection,
      target,
      new Vector3(0, 0, 1), // rayDir = misma dirección que cámara
    );
    expect(result.x).toBeCloseTo(0, 3);
    expect(result.y).toBeCloseTo(0, 3);
    expect(result.z).toBeCloseTo(0, 3);
  });

  it('con rayo paralelo al plano (sin intersección), devuelve el target original', () => {
    const cameraPosition = new Vector3(0, 0, 10);
    const cameraDirection = new Vector3(0, 0, -1);
    const target = new Vector3(0, 0, 0);
    // rayDir paralelo al plano (perpendicular a la normal del plano)
    const rayDir = new Vector3(1, 0, 0); // perpendicular a -Z
    const result = computeWorldPointOnTargetPlane(cameraPosition, cameraDirection, target, rayDir);
    // Sin intersección → devuelve target
    expect(result.x).toBeCloseTo(target.x, 3);
    expect(result.y).toBeCloseTo(target.y, 3);
    expect(result.z).toBeCloseTo(target.z, 3);
  });

  it('con cámara desplazada, el punto resultante está en el plano del target', () => {
    // Cámara en (5, 0, 10), dirección normalizada hacia (0,0,0)
    const cameraPosition = new Vector3(5, 0, 10);
    const cameraDirection = new Vector3(-5, 0, -10).normalize();
    const target = new Vector3(0, 0, 0);
    const rayDir = cameraDirection.clone(); // cursor en el centro
    const result = computeWorldPointOnTargetPlane(cameraPosition, cameraDirection, target, rayDir);
    // El punto resultante debe cumplir: (result - target) · cameraDirection = 0
    // (está en el plano perpendicular a cameraDirection que pasa por target)
    const toResult = result.clone().sub(target);
    const dot = toResult.dot(cameraDirection);
    expect(Math.abs(dot)).toBeLessThan(0.001);
  });
});

describe('moveTargetFraction', () => {
  it('con k=0, el target no se mueve', () => {
    const target = new Vector3(1, 2, 3);
    const worldPoint = new Vector3(10, 20, 30);
    const result = moveTargetFraction(target, worldPoint, 0);
    expect(result.x).toBeCloseTo(1, 5);
    expect(result.y).toBeCloseTo(2, 5);
    expect(result.z).toBeCloseTo(3, 5);
  });

  it('con k=1, el target llega exactamente al worldPoint', () => {
    const target = new Vector3(1, 2, 3);
    const worldPoint = new Vector3(10, 20, 30);
    const result = moveTargetFraction(target, worldPoint, 1);
    expect(result.x).toBeCloseTo(10, 5);
    expect(result.y).toBeCloseTo(20, 5);
    expect(result.z).toBeCloseTo(30, 5);
  });

  it('con k=0.5, el target queda a mitad de camino entre target y worldPoint', () => {
    const target = new Vector3(0, 0, 0);
    const worldPoint = new Vector3(10, 0, 0);
    const result = moveTargetFraction(target, worldPoint, 0.5);
    expect(result.x).toBeCloseTo(5, 5);
    expect(result.y).toBeCloseTo(0, 5);
    expect(result.z).toBeCloseTo(0, 5);
  });

  it('con k=0.5 y target distinto de origen, el resultado es la interpolación correcta', () => {
    const target = new Vector3(2, 4, 6);
    const worldPoint = new Vector3(12, 4, 16);
    const result = moveTargetFraction(target, worldPoint, 0.5);
    expect(result.x).toBeCloseTo(7, 5); // 2 + 0.5*(12-2) = 7
    expect(result.y).toBeCloseTo(4, 5); // 4 + 0.5*(4-4) = 4
    expect(result.z).toBeCloseTo(11, 5); // 6 + 0.5*(16-6) = 11
  });

  it('no modifica el objeto target original (devuelve nuevo vector)', () => {
    const target = new Vector3(1, 2, 3);
    const worldPoint = new Vector3(10, 20, 30);
    moveTargetFraction(target, worldPoint, 0.5);
    // target original no debe haberse modificado
    expect(target.x).toBe(1);
    expect(target.y).toBe(2);
    expect(target.z).toBe(3);
  });
});
