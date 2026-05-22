/**
 * Tests for src/components/hud/OortCloudToggle.tsx
 *
 * Categories covered:
 *   happy       — renders toggle button with i18n label when viewMode=global (REQ-HUD-2/4)
 *   boundary    — click fires setShowOortCloud(!showOortCloud) (REQ-HUD-3)
 *   error       — returns null when viewMode=local (ADR-005)
 *   determinism — re-render with same store state → same rendered output
 *
 * Mocking strategy (r3f-testing v1.3 §5):
 *   - react-i18next: t(key) returns the key as-is (REQ-HUD-4 verifiable via key string)
 *   - @/store/useAppStore: controllable state + spied setter
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PedagogicalLevel } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Hoisted spies
// ─────────────────────────────────────────────────────────────────────────────

const { setShowOortCloudSpy } = vi.hoisted(() => ({
  setShowOortCloudSpy: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — ABOVE SUT import
// ─────────────────────────────────────────────────────────────────────────────

// i18n mock: t returns the key (patterns.md §5)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'es' },
  }),
}));

// Store mock — controllable via storeMockState
const storeMockState = {
  viewMode: 'global' as 'global' | 'local',
  level: 'aprendiz' as PedagogicalLevel,
  showOortCloud: false,
  setShowOortCloud: setShowOortCloudSpy,
};

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof storeMockState) => unknown) => selector(storeMockState),
  useViewMode: () => storeMockState.viewMode,
  useShowOortCloud: () => storeMockState.showOortCloud,
}));

// ─────────────────────────────────────────────────────────────────────────────
// SUT import — AFTER mocks
// ─────────────────────────────────────────────────────────────────────────────

import { OortCloudToggle } from '@/components/hud/OortCloudToggle';

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  storeMockState.viewMode = 'global';
  storeMockState.showOortCloud = false;
  setShowOortCloudSpy.mockClear();
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('OortCloudToggle — happy path', () => {
  it('renders without throwing in global mode', () => {
    expect(() => render(<OortCloudToggle />)).not.toThrow();
  });

  it('renders an element with data-testid="oort-cloud-toggle" in global mode', () => {
    const { getByTestId } = render(<OortCloudToggle />);
    expect(getByTestId('oort-cloud-toggle')).toBeTruthy();
  });

  it('label text is the i18n key "hud.toggleOortCloud" (REQ-HUD-4)', () => {
    const { getByTestId, container } = render(<OortCloudToggle />);
    const toggle = getByTestId('oort-cloud-toggle');
    // data-testid is on the <input> element; the readable label text is in the
    // parent <label> element. We verify the closest ancestor label contains the key.
    const label = toggle.closest('label');
    expect(label?.textContent).toContain('hud.toggleOortCloud');
    // Also verify the outer container exists
    expect(container.firstChild).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary — click interaction (REQ-HUD-3)
// ─────────────────────────────────────────────────────────────────────────────

describe('OortCloudToggle — boundary (click interaction)', () => {
  it('clicking the toggle calls setShowOortCloud with !showOortCloud (false→true)', () => {
    storeMockState.showOortCloud = false;
    const { getByTestId } = render(<OortCloudToggle />);
    fireEvent.click(getByTestId('oort-cloud-toggle'));
    expect(setShowOortCloudSpy).toHaveBeenCalledWith(true);
  });

  it('clicking when showOortCloud=true calls setShowOortCloud(false)', () => {
    storeMockState.showOortCloud = true;
    const { getByTestId } = render(<OortCloudToggle />);
    fireEvent.click(getByTestId('oort-cloud-toggle'));
    expect(setShowOortCloudSpy).toHaveBeenCalledWith(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error — local mode returns null (ADR-005)
// ─────────────────────────────────────────────────────────────────────────────

describe('OortCloudToggle — error (local mode)', () => {
  it('returns null (renders nothing) when viewMode=local', () => {
    storeMockState.viewMode = 'local';
    const { container } = render(<OortCloudToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render the data-testid element in local mode', () => {
    storeMockState.viewMode = 'local';
    const { queryByTestId } = render(<OortCloudToggle />);
    expect(queryByTestId('oort-cloud-toggle')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism — same state → same render
// ─────────────────────────────────────────────────────────────────────────────

describe('OortCloudToggle — determinism', () => {
  it('re-rendering with same state produces same testid element', () => {
    const { getByTestId, rerender } = render(<OortCloudToggle />);
    expect(getByTestId('oort-cloud-toggle')).toBeTruthy();
    rerender(<OortCloudToggle />);
    expect(getByTestId('oort-cloud-toggle')).toBeTruthy();
  });

  it('re-rendering does not call setShowOortCloud spontaneously', () => {
    render(<OortCloudToggle />);
    expect(setShowOortCloudSpy).not.toHaveBeenCalled();
  });
});
