/**
 * Tests de useTour — máquina de estados del tour
 *
 * Estrategia: testar el reducer directamente (función pura exportada)
 * y el hook con mocks del store.
 */

import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock del store
// ---------------------------------------------------------------------------

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      level: 'explorador' as const,
      prefersReducedMotion: false,
      setTourActive: vi.fn(),
      setSelectedPlanet: vi.fn(),
      setTourCurrentPlanet: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// ---------------------------------------------------------------------------
// Import — sólo el reducer (función pura)
// ---------------------------------------------------------------------------

import { tourReducer, TOUR_DURATIONS, REDUCED_MOTION_DURATIONS } from '@/scenes/hooks/useTour';
import type { TourState, TourEvent } from '@/scenes/hooks/useTour';

// ---------------------------------------------------------------------------
// Tests del reducer
// ---------------------------------------------------------------------------

describe('tourReducer — transiciones de estado', () => {
  it('idle + start → focus_planet(index=0)', () => {
    const state: TourState = { kind: 'idle' };
    const event: TourEvent = { type: 'start' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'focus_planet', index: 0 });
  });

  it('focus_planet + tween_done → narration(mismo index)', () => {
    const state: TourState = { kind: 'focus_planet', index: 2 };
    const event: TourEvent = { type: 'tween_done' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'narration', index: 2 });
  });

  it('narration + tts_done → next_planet(mismo index)', () => {
    const state: TourState = { kind: 'narration', index: 3 };
    const event: TourEvent = { type: 'tts_done' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'next_planet', index: 3 });
  });

  it('next_planet + next_planet → focus_planet(index+1)', () => {
    const state: TourState = { kind: 'next_planet', index: 3 };
    const event: TourEvent = { type: 'next_planet' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'focus_planet', index: 4 });
  });

  it('next_planet + last_planet_done → idle', () => {
    const state: TourState = { kind: 'next_planet', index: 9 };
    const event: TourEvent = { type: 'last_planet_done' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'idle' });
  });

  it('cualquier estado + user_interrupt → idle', () => {
    const states: TourState[] = [
      { kind: 'focus_planet', index: 1 },
      { kind: 'narration', index: 2 },
      { kind: 'next_planet', index: 3 },
    ];
    const event: TourEvent = { type: 'user_interrupt' };
    for (const state of states) {
      expect(tourReducer(state, event)).toEqual({ kind: 'idle' });
    }
  });

  it('idle + user_interrupt → idle (no cambia)', () => {
    const state: TourState = { kind: 'idle' };
    const event: TourEvent = { type: 'user_interrupt' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'idle' });
  });

  it('idle + tween_done → idle (sin efecto)', () => {
    const state: TourState = { kind: 'idle' };
    const event: TourEvent = { type: 'tween_done' };
    const next = tourReducer(state, event);
    expect(next).toEqual({ kind: 'idle' });
  });

  it('ciclo completo Sol → Plutón (10 iteraciones)', () => {
    let state: TourState = { kind: 'idle' };

    // start
    state = tourReducer(state, { type: 'start' });
    expect(state).toEqual({ kind: 'focus_planet', index: 0 });

    for (let i = 0; i < 10; i++) {
      // tween_done
      state = tourReducer(state, { type: 'tween_done' });
      expect(state).toEqual({ kind: 'narration', index: i });

      // tts_done
      state = tourReducer(state, { type: 'tts_done' });
      expect(state).toEqual({ kind: 'next_planet', index: i });

      if (i < 9) {
        // next_planet
        state = tourReducer(state, { type: 'next_planet' });
        expect(state).toEqual({ kind: 'focus_planet', index: i + 1 });
      } else {
        // último planeta
        state = tourReducer(state, { type: 'last_planet_done' });
        expect(state).toEqual({ kind: 'idle' });
      }
    }
  });
});

describe('tourReducer — duraciones por nivel', () => {
  it('TOUR_DURATIONS exporta duraciones para los 3 niveles', () => {
    expect(TOUR_DURATIONS.explorador).toEqual({ focus_ms: 6000, narration_ms: 4000 });
    expect(TOUR_DURATIONS.aprendiz).toEqual({ focus_ms: 5000, narration_ms: 6000 });
    expect(TOUR_DURATIONS.investigador).toEqual({ focus_ms: 4000, narration_ms: 8000 });
  });

  it('REDUCED_MOTION_DURATIONS exporta focus_ms=300 y manual_advance=true', () => {
    expect(REDUCED_MOTION_DURATIONS.focus_ms).toBe(300);
    expect(REDUCED_MOTION_DURATIONS.manual_advance).toBe(true);
  });
});
