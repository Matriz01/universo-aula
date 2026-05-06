/**
 * Tests del hook useScaledDistance.
 *
 * Verifica que devuelve visualDistance en modo global
 * y localVisualDistanceFromAU en modo local.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted: estado de viewMode controlable por los tests
// ---------------------------------------------------------------------------

const { mockState } = vi.hoisted(() => {
  const state: { viewMode: 'global' | 'local' } = { viewMode: 'global' };
  return { mockState: state };
});

// ---------------------------------------------------------------------------
// Mock del store
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: { viewMode: 'global' | 'local' }) => unknown) =>
    selector({ viewMode: mockState.viewMode }),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { useScaledDistance } from '@/scenes/hooks/useScaledDistance';
import { visualDistance, localVisualDistanceFromAU } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScaledDistance', () => {
  it('en modo global devuelve visualDistance (escala didáctica sublogarítmica)', () => {
    mockState.viewMode = 'global';
    const au = 1.0; // Tierra
    const { result } = renderHook(() => useScaledDistance(au));
    expect(result.current).toBeCloseTo(visualDistance(au), 6);
  });

  it('en modo local devuelve localVisualDistanceFromAU (escala real)', () => {
    mockState.viewMode = 'local';
    const au = 1.0; // Tierra
    const { result } = renderHook(() => useScaledDistance(au));
    expect(result.current).toBeCloseTo(localVisualDistanceFromAU(au), 1);
  });

  it('en modo local la Tierra está a ~149597 unidades del Sol', () => {
    mockState.viewMode = 'local';
    const { result } = renderHook(() => useScaledDistance(1.0));
    expect(result.current).toBeCloseTo(149_597.87, 0);
  });

  it('en modo local Júpiter está más lejos que la Tierra', () => {
    mockState.viewMode = 'local';
    const { result: earth } = renderHook(() => useScaledDistance(1.0));
    const { result: jupiter } = renderHook(() => useScaledDistance(5.2));
    expect(jupiter.current).toBeGreaterThan(earth.current);
  });

  it('en modo global la Tierra está más cerca que en local', () => {
    mockState.viewMode = 'global';
    const { result: globalResult } = renderHook(() => useScaledDistance(1.0));
    mockState.viewMode = 'local';
    const { result: localResult } = renderHook(() => useScaledDistance(1.0));
    // En global: ~38 unidades, en local: ~149597 — local es mucho mayor
    expect(localResult.current).toBeGreaterThan(globalResult.current * 100);
  });
});
