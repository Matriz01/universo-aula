/**
 * useTour — máquina de estados del tour automático.
 *
 * Reducer puro: 4 estados, 5 eventos (design §7.3).
 * Duraciones por nivel: §7.4
 * prefers-reduced-motion: avance manual, tweens 0.3s.
 */

import { useReducer, useRef } from 'react';
import type { PedagogicalLevel } from '@/types';

// ---------------------------------------------------------------------------
// Tipos de la máquina de estados
// ---------------------------------------------------------------------------

export type TourState =
  | { kind: 'idle' }
  | { kind: 'focus_planet'; index: number }
  | { kind: 'narration'; index: number }
  | { kind: 'next_planet'; index: number };

export type TourEvent =
  | { type: 'start' }
  | { type: 'tween_done' }
  | { type: 'tts_done' }
  | { type: 'next_planet' }
  | { type: 'last_planet_done' }
  | { type: 'user_interrupt' };

// ---------------------------------------------------------------------------
// Reducer puro (exportado para tests)
// ---------------------------------------------------------------------------

export function tourReducer(s: TourState, e: TourEvent): TourState {
  if (e.type === 'user_interrupt') return { kind: 'idle' };

  switch (s.kind) {
    case 'idle':
      return e.type === 'start' ? { kind: 'focus_planet', index: 0 } : s;

    case 'focus_planet':
      return e.type === 'tween_done' ? { kind: 'narration', index: s.index } : s;

    case 'narration':
      return e.type === 'tts_done' ? { kind: 'next_planet', index: s.index } : s;

    case 'next_planet':
      if (e.type === 'last_planet_done') return { kind: 'idle' };
      if (e.type === 'next_planet') return { kind: 'focus_planet', index: s.index + 1 };
      return s;
  }
}

// ---------------------------------------------------------------------------
// Duraciones por nivel (exportadas para tests y componentes)
// ---------------------------------------------------------------------------

export const TOUR_DURATIONS: Record<PedagogicalLevel, { focus_ms: number; narration_ms: number }> =
  {
    explorador: { focus_ms: 6000, narration_ms: 4000 },
    aprendiz: { focus_ms: 5000, narration_ms: 6000 },
    investigador: { focus_ms: 4000, narration_ms: 8000 },
  };

export const REDUCED_MOTION_DURATIONS = {
  focus_ms: 300,
  narration_ms: 0,
  manual_advance: true,
} as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseTourReturn {
  state: TourState;
  dispatch: React.Dispatch<TourEvent>;
  abortRef: React.MutableRefObject<AbortController | null>;
}

export function useTour(): UseTourReturn {
  const [state, dispatch] = useReducer(tourReducer, { kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  return { state, dispatch, abortRef };
}
