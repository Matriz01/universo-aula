/**
 * Tests del hook useScaledRadius.
 *
 * Verifica que devuelve visualRadius en modo global
 * y localVisualRadius en modo local.
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

import { useScaledRadius } from '@/scenes/hooks/useScaledRadius';
import { visualRadius, localVisualRadius } from '@/scenes/scale';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScaledRadius', () => {
  it('en modo global devuelve visualRadius (escala didáctica)', () => {
    mockState.viewMode = 'global';
    const km = 6371; // Tierra
    const { result } = renderHook(() => useScaledRadius(km));
    expect(result.current).toBeCloseTo(visualRadius(km), 6);
  });

  it('en modo local devuelve localVisualRadius (escala real km/1000)', () => {
    mockState.viewMode = 'local';
    const km = 6371; // Tierra
    const { result } = renderHook(() => useScaledRadius(km));
    expect(result.current).toBeCloseTo(localVisualRadius(km), 6);
  });

  it('en modo local el Sol tiene radio 696.34 unidades', () => {
    mockState.viewMode = 'local';
    const { result } = renderHook(() => useScaledRadius(696_340));
    expect(result.current).toBeCloseTo(696.34, 1);
  });

  it('en modo local la Luna tiene radio ~1.737 unidades', () => {
    mockState.viewMode = 'local';
    const { result } = renderHook(() => useScaledRadius(1737));
    expect(result.current).toBeCloseTo(1.737, 3);
  });

  it('en modo global el Sol es mucho más pequeño que en local', () => {
    mockState.viewMode = 'global';
    const { result: globalResult } = renderHook(() => useScaledRadius(696_340));
    mockState.viewMode = 'local';
    const { result: localResult } = renderHook(() => useScaledRadius(696_340));
    // En local: 696.34, en global: ~7.687 — local debe ser mucho mayor
    expect(localResult.current).toBeGreaterThan(globalResult.current * 10);
  });
});
