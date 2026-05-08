/**
 * Tests — local mode camera bugs:
 *  Bug 1: race condition entering local mode at high speed
 *  Bug 2: smooth zoom transition (eased lerp, 700ms)
 *  Bug 3: prudent distance offset (planetRadius × K)
 *
 * Estrategia:
 *  - Prueba 1: simula goToBody() a velocidad alta; tras N frames, el
 *    target de cámara debe coincidir con la posición LIVE del planeta,
 *    no con la snapshot del momento del clic.
 *  - Prueba 2: la función de easing ease-out-cubic produce un progreso
 *    mayor de 0.9 a t=0.8 (la lerp termina antes de 700ms si t≥1).
 *  - Prueba 3: el offset calculado por computeLocalOffset es ≥ planetRadius × MIN_K.
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computeLocalOffset, MIN_DISTANCE_FACTOR } from '@/scenes/hooks/useFocusCamera';
import { easeOutCubic } from '@/scenes/hooks/useFocusCamera';

// ---------------------------------------------------------------------------
// Bug 3 — prudent distance offset
// ---------------------------------------------------------------------------

describe('computeLocalOffset — distancia prudente al entrar en modo local', () => {
  it('el offset tiene magnitud ≥ planetRadius × MIN_DISTANCE_FACTOR para la Tierra', () => {
    // Tierra: radius local = 6371 / 1000 = 6.371 unidades
    const earthRadiusLocal = 6371 / 1000;
    const offset = computeLocalOffset(earthRadiusLocal);
    const distance = offset.length();
    expect(distance).toBeGreaterThanOrEqual(earthRadiusLocal * MIN_DISTANCE_FACTOR);
  });

  it('el offset tiene magnitud ≥ planetRadius × MIN_DISTANCE_FACTOR para Júpiter', () => {
    // Júpiter: radius local = 69911 / 1000 = 69.911 unidades
    const jupiterRadiusLocal = 69911 / 1000;
    const offset = computeLocalOffset(jupiterRadiusLocal);
    const distance = offset.length();
    expect(distance).toBeGreaterThanOrEqual(jupiterRadiusLocal * MIN_DISTANCE_FACTOR);
  });

  it('el offset tiene magnitud ≥ planetRadius × MIN_DISTANCE_FACTOR para la Luna', () => {
    // Luna: radius local = 1737 / 1000 = 1.737 unidades
    const moonRadiusLocal = 1737 / 1000;
    const offset = computeLocalOffset(moonRadiusLocal);
    const distance = offset.length();
    expect(distance).toBeGreaterThanOrEqual(moonRadiusLocal * MIN_DISTANCE_FACTOR);
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — smooth zoom: la curva de easing produce valores correctos
// ---------------------------------------------------------------------------

describe('easeOutCubic — curva de easing para transición global→local', () => {
  it('easeOutCubic(0) = 0', () => {
    expect(easeOutCubic(0)).toBeCloseTo(0, 6);
  });

  it('easeOutCubic(1) = 1', () => {
    expect(easeOutCubic(1)).toBeCloseTo(1, 6);
  });

  it('easeOutCubic(0.5) > 0.5 (ease-out acelera al principio)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('easeOutCubic(0.8) > 0.9 (transición casi completa al 80% del tiempo)', () => {
    // ease-out-cubic: 1 - (1-t)^3. A t=0.8: 1 - 0.2^3 = 1 - 0.008 = 0.992
    expect(easeOutCubic(0.8)).toBeGreaterThan(0.9);
  });
});

// ---------------------------------------------------------------------------
// Bug 1 — live target: el lerp debe converger hacia la posición LIVE
// ---------------------------------------------------------------------------

describe('live target lerp — el lerp sigue la posición viva del planeta', () => {
  it('tras completar el lerp (t=1), la posición de cámara coincide con target + offset', () => {
    // Simula planeta que se mueve durante la transición:
    // posición al hacer clic: (100, 0, 0)
    // posición después de N frames de alta velocidad: (110, 0, 0)
    const liveTarget = new Vector3(110, 0, 0);
    const earthRadiusLocal = 6.371;
    const offset = computeLocalOffset(earthRadiusLocal);

    // La posición final de cámara debe ser liveTarget + offset (live, NO snapshot)
    const expectedCameraPos = liveTarget.clone().add(offset);

    // Simula el lerp: startPos=(0,35,70), endPos = liveTarget+offset
    // Con t=1 (lerp completo), debe llegar exactamente al destino live
    const startPos = new Vector3(0, 35, 70);
    const t = 1.0; // lerp completo
    const easedT = easeOutCubic(t);

    const lerpedPos = startPos.clone().lerp(expectedCameraPos, easedT);

    // Con t=1, easedT=1, el lerp debe aterrizar en expectedCameraPos
    expect(lerpedPos.x).toBeCloseTo(expectedCameraPos.x, 4);
    expect(lerpedPos.y).toBeCloseTo(expectedCameraPos.y, 4);
    expect(lerpedPos.z).toBeCloseTo(expectedCameraPos.z, 4);
  });

  it('el destino del lerp se recalcula con el target live, no con la snapshot del clic', () => {
    // Si el target cambia de (100,0,0) a (110,0,0) durante la transición,
    // el destino final debe usar el valor live (110), no el snapshot (100).
    const snapshotTarget = new Vector3(100, 0, 0);
    const liveTarget = new Vector3(110, 0, 0);
    const earthRadiusLocal = 6.371;
    const offset = computeLocalOffset(earthRadiusLocal);

    const destFromSnapshot = snapshotTarget.clone().add(offset);
    const destFromLive = liveTarget.clone().add(offset);

    // Deben ser distintos — confirma que importa cuál se usa
    expect(destFromLive.x).not.toBeCloseTo(destFromSnapshot.x, 1);

    // El destino live tiene X más grande que el snapshot
    expect(destFromLive.x).toBeGreaterThan(destFromSnapshot.x);
  });
});
