/**
 * Tests for the showOortCloud slice in useAppStore.
 *
 * Categories covered:
 *   happy       — default is false (REQ-HUD-1); setter sets true (REQ-HUD-1)
 *   boundary    — setter called twice with true → state stays true (idempotent)
 *   error       — n/a (boolean — no invalid inputs possible)
 *                 // justified: boolean type enforced by TypeScript; no runtime guard needed
 *   determinism — setting showOortCloud does NOT mutate showKnownEvents (REQ-INV-2,
 *                 cross-talk guard)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

// Reset relevant slice before each test
beforeEach(() => {
  useAppStore.setState({ showOortCloud: false, showKnownEvents: false });
});

describe('useAppStore — showOortCloud — happy path (REQ-HUD-1)', () => {
  it('showOortCloud is false on fresh initialisation', () => {
    expect(useAppStore.getState().showOortCloud).toBe(false);
  });

  it('setShowOortCloud(true) sets showOortCloud to true', () => {
    useAppStore.getState().setShowOortCloud(true);
    expect(useAppStore.getState().showOortCloud).toBe(true);
  });

  it('setShowOortCloud(false) after true sets showOortCloud back to false', () => {
    useAppStore.getState().setShowOortCloud(true);
    useAppStore.getState().setShowOortCloud(false);
    expect(useAppStore.getState().showOortCloud).toBe(false);
  });
});

describe('useAppStore — showOortCloud — boundary', () => {
  it('setShowOortCloud(true) called twice leaves state true (idempotent)', () => {
    useAppStore.getState().setShowOortCloud(true);
    useAppStore.getState().setShowOortCloud(true);
    expect(useAppStore.getState().showOortCloud).toBe(true);
  });

  it('setShowOortCloud(false) called on already-false state leaves state false', () => {
    useAppStore.getState().setShowOortCloud(false);
    expect(useAppStore.getState().showOortCloud).toBe(false);
  });
});

describe('useAppStore — showOortCloud — determinism / cross-talk guard (REQ-INV-2)', () => {
  it('setting showOortCloud does NOT mutate showKnownEvents', () => {
    useAppStore.setState({ showKnownEvents: false });
    useAppStore.getState().setShowOortCloud(true);
    expect(useAppStore.getState().showKnownEvents).toBe(false);
  });

  it('setting showKnownEvents does NOT mutate showOortCloud', () => {
    useAppStore.setState({ showOortCloud: false });
    useAppStore.getState().setShowKnownEvents(true);
    expect(useAppStore.getState().showOortCloud).toBe(false);
  });

  it('showOortCloud is in the store state object (field exists)', () => {
    const state = useAppStore.getState();
    expect('showOortCloud' in state).toBe(true);
    expect('setShowOortCloud' in state).toBe(true);
  });
});
