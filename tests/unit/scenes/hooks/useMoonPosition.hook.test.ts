/**
 * Tests para el hook useMoonPosition — actualización del ref por frame.
 *
 * REQ-MOON-POS-2 — Ref actualizado en cada frame.
 *
 * Estrategia:
 * - Mock de @react-three/fiber: useFrame captura el callback en lugar de ejecutarlo.
 * - Mock de @/scenes/simulationClock: getJD() devuelve el valor que fijamos en test.
 * - Mock de @/scenes/contexts/OriginOffsetContext: useOriginOffset devuelve ref a (0,0,0).
 * - renderHook invoca useMoonPosition; luego llamamos el callback capturado a mano.
 * - Verificamos que el ref.current cambia entre dos llamadas con earthPos/JD distintos.
 *
 * No se usa R3F canvas real: todo imperativo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Captura del callback de useFrame
// ---------------------------------------------------------------------------

/**
 * useFrame en tests no ejecuta nada; en lugar de eso almacenamos el callback
 * para poder dispararlo manualmente con la configuración que necesitemos.
 */
let capturedFrameCallback: (() => void) | null = null;
let capturedFramePriority: number | undefined;

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: () => void, priority?: number) => {
    capturedFrameCallback = cb;
    capturedFramePriority = priority;
  },
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  useThree: () => ({}),
  extend: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Control del JD desde los tests
// ---------------------------------------------------------------------------

let mockedJD = 2451545.0; // J2000 por defecto

vi.mock('@/scenes/simulationClock', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...(original as object),
    getJD: () => mockedJD,
  };
});

// ---------------------------------------------------------------------------
// OriginOffsetContext — siempre (0,0,0) para simplificar los asserts
// ---------------------------------------------------------------------------

const zeroOffsetRef = { current: new Vector3(0, 0, 0) };

vi.mock('@/scenes/contexts/OriginOffsetContext', () => ({
  useOriginOffset: () => zeroOffsetRef,
  OriginOffsetContext: {},
  OriginOffsetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Import bajo test (DESPUÉS de los mocks)
// ---------------------------------------------------------------------------

import { useMoonPosition } from '@/scenes/hooks/useMoonPosition';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMoonPosition — hook (ref actualizado por frame)', () => {
  beforeEach(() => {
    capturedFrameCallback = null;
    capturedFramePriority = undefined;
    mockedJD = 2451545.0;
    zeroOffsetRef.current.set(0, 0, 0);
  });

  it('registra un callback de frame al montar el hook', () => {
    const earthPosRef = { current: new Vector3(0, 0, 0) };
    renderHook(() => useMoonPosition(earthPosRef));
    expect(capturedFrameCallback).toBeTypeOf('function');
  });

  // Regresión C1 — useMoonPosition ESCRIBE moonPosRef (consumido por PlanetMoon
  // y MoonMarker→BodyMarker), así que pertenece a la banda de escritores -0.5.
  // No puede usar priority > 0: en R3F eso activa el render takeover y congela
  // el canvas cuando no hay EffectComposer (GPU mid/low).
  // Cadena writer→writer: este hook LEE earthPosRef escrito por usePlanetPosition
  // (también -0.5). El orden intra-banda lo da el orden de montaje (sort estable
  // de R3F): usePlanetPosition se invoca antes que useMoonPosition en todos los
  // componentes que los combinan (MoonMarker, PlanetMoon) — igual que ocurría
  // cuando ambos estaban en priority 0.
  it('regresión C1: registra su useFrame con priority -0.5 (escritor de posición)', () => {
    const earthPosRef = { current: new Vector3(0, 0, 0) };
    renderHook(() => useMoonPosition(earthPosRef));
    expect(capturedFramePriority).toBe(-0.5);
  });

  it('el ref devuelto tiene un Vector3 con length > 0 tras el primer frame', () => {
    mockedJD = 2451545.0;
    const earthPosRef = { current: new Vector3(0, 0, 0) };

    const { result } = renderHook(() => useMoonPosition(earthPosRef));

    // Disparar un frame
    capturedFrameCallback!();

    expect(result.current.current.length()).toBeGreaterThan(0);
  });

  it('distintas earthPos producen distintos valores de ref tras el frame', () => {
    mockedJD = 2451545.0;

    // Frame 1 — Tierra en el origen
    const earthPosRef1 = { current: new Vector3(0, 0, 0) };
    const { result: result1 } = renderHook(() => useMoonPosition(earthPosRef1));
    capturedFrameCallback!();
    const pos1 = result1.current.current.clone();

    // Frame 2 — Tierra desplazada 1000 unidades en X
    capturedFrameCallback = null;
    const earthPosRef2 = { current: new Vector3(1000, 0, 0) };
    const { result: result2 } = renderHook(() => useMoonPosition(earthPosRef2));
    capturedFrameCallback!();
    const pos2 = result2.current.current.clone();

    // La diferencia debe ser exactamente el desplazamiento de la Tierra
    expect(pos1.distanceTo(pos2)).toBeGreaterThan(100);
  });

  it('distintos valores de JD producen distintos valores de ref', () => {
    const earthPosRef = { current: new Vector3(0, 0, 0) };

    // Primer frame con JD = J2000
    mockedJD = 2451545.0;
    const { result } = renderHook(() => useMoonPosition(earthPosRef));
    capturedFrameCallback!();
    const posJD1 = result.current.current.clone();

    // Segundo frame con JD = J2000 + 7 días (≈ cuarto de órbita lunar)
    mockedJD = 2451545.0 + 7;
    capturedFrameCallback!();
    const posJD2 = result.current.current.clone();

    // En 7 días la Luna recorre ~90° de su órbita → posición muy diferente
    expect(posJD1.distanceTo(posJD2)).toBeGreaterThan(10);
  });

  it('el ref se actualiza in-place (mismo objeto ref, distinto current)', () => {
    const earthPosRef = { current: new Vector3(0, 0, 0) };
    mockedJD = 2451545.0;

    const { result } = renderHook(() => useMoonPosition(earthPosRef));
    const refObject = result.current; // referencia al MutableRefObject

    capturedFrameCallback!();
    const posA = refObject.current.clone();

    mockedJD = 2451545.0 + 14; // 2 semanas después
    capturedFrameCallback!();
    const posB = refObject.current.clone();

    // El objeto ref es el mismo (no se reemplaza), pero current ha cambiado
    expect(result.current).toBe(refObject);
    expect(posA.distanceTo(posB)).toBeGreaterThan(10);
  });

  // ---------------------------------------------------------------------------
  // Regresión: bug de doble-offset
  // ---------------------------------------------------------------------------
  //
  // Antes del fix, useMoonPosition restaba el originOffset incluso cuando
  // earthPosRef ya venía con el offset aplicado (por usePlanetPosition).
  // Resultado: Moon position = moonRelative − earthWorldPos, dejando la Luna
  // fuera de cámara (~150 000 unidades) en local Tierra.
  //
  // En el frame del cuerpo seleccionado, earthPosRef.current = (0,0,0) cuando
  // Tierra está seleccionada. computeMoonPosition con (0,0,0) retorna
  // exactamente moonRelative. La posición resultante DEBE estar a ~300-500
  // unidades de escena local (Luna a ~384 000 km / 1000 = 384 unidades).
  //
  // Si alguien restaura el .sub(originOffset) erróneamente, este test falla.

  it('regresión: con earthPosRef=(0,0,0) la Luna queda dentro del rango orbital lunar', () => {
    const earthPosRef = { current: new Vector3(0, 0, 0) };
    mockedJD = 2451545.0;

    const { result } = renderHook(() => useMoonPosition(earthPosRef));
    capturedFrameCallback!();

    // Distancia esperada: ~384 unidades (semieje mayor lunar a escala 1u=1000km)
    // Con eccentricidad 0.0549 → rango aproximado 326 a 446 unidades
    const distance = result.current.current.length();
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(500);
  });
});
