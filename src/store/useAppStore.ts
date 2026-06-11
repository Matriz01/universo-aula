import { create } from 'zustand';
import type { PedagogicalLevel } from '@/types';
import type { BodyId, PlanetId } from '@/scenes/data/types';
import { SPEED_STOPS_SECONDS_PER_SECOND } from '@/scenes/simulationClock';

export type CameraMode = 'overview' | 'focus' | 'tour';
export type TextureQuality = '1k' | '2k' | '4k';
export type SunShaderVariant = 'full' | 'lite' | 'texture';
export type ViewMode = 'global' | 'local';

interface AppState {
  // — Campos originales —
  level: PedagogicalLevel;
  locale: string;
  setLevel: (level: PedagogicalLevel) => void;
  setLocale: (locale: string) => void;

  // — Cámara home —

  /**
   * Contador que se incrementa cada vez que se solicita un reset de cámara a home.
   * El componente GlobalCameraControls lo observa para ejecutar el tween.
   * Usar contador (no booleano) garantiza que doble-pulsación rápida sigue funcionando.
   */
  cameraHomeRequested: number;
  requestCameraHome: () => void;

  // — Nuevos campos (solar-system-mvp) —

  /** Cuerpo celeste actualmente seleccionado por el usuario. null = ninguno. */
  selectedBody: BodyId | null;
  /**
   * Actualiza selectedBody con un PlanetId. Usa goToBody() para navegación completa.
   * Solo válido para PlanetId — no acepta 'moon'.
   */
  setSelectedPlanet: (planet: PlanetId | null) => void;

  /** Modo de cámara activo. */
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  /** Calidad de texturas seleccionada (adaptada por GPU o manualmente). */
  textureQuality: TextureQuality;
  setTextureQuality: (quality: TextureQuality) => void;

  /** True cuando el tour automático está en ejecución. */
  tourActive: boolean;
  setTourActive: (active: boolean) => void;

  /** Planeta activo durante el tour (para sincronia con HUD). */
  tourCurrentPlanet: PlanetId | null;
  setTourCurrentPlanet: (planet: PlanetId | null) => void;

  /** Respeta prefers-reduced-motion del usuario (tweens cortos, avance manual). */
  prefersReducedMotion: boolean;
  setPrefersReducedMotion: (value: boolean) => void;

  /** Variante del shader del Sol según capacidad GPU detectada. */
  sunShaderVariant: SunShaderVariant;
  setSunShaderVariant: (variant: SunShaderVariant) => void;

  /** Flag de emergencia: si true, renderiza EmptyScene en lugar de SolarSystemScene. */
  legacyFlag: boolean;

  // — Modo local —

  /** Modo de visualización: global (sistema completo) o local (planeta enfocado). */
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  /** Mostrar eventos conocidos (cometas, etc.) en modo local. */
  showKnownEvents: boolean;
  setShowKnownEvents: (show: boolean) => void;

  /** Mostrar la capa de la Nube de Oort en modo global. Desactivado por defecto. */
  showOortCloud: boolean;
  setShowOortCloud: (show: boolean) => void;

  /**
   * Acción unificada de navegación.
   * null    → vuelve a modo global (selectedBody=null, viewMode='global', cameraMode='overview')
   * BodyId  → entra en modo local (selectedBody=id, viewMode='local', cameraMode='focus')
   *           Acepta cualquier PlanetId o 'moon'.
   */
  goToBody: (id: BodyId | null) => void;

  /** Mostrar ejes de rotación axial en los cuerpos celestes. Desactivado por defecto. */
  showRotationAxes: boolean;
  /** Alterna la visibilidad de los ejes de rotación axial. */
  toggleRotationAxes: () => void;

  // — Control de velocidad de simulación —

  /**
   * Velocidad de simulación activa, en segundos simulados por segundo real (s_sim/s_real).
   * Debe ser uno de los valores de SPEED_STOPS_SECONDS_PER_SECOND.
   * 0 = pausa. Predeterminado: 1 (tiempo real).
   */
  simulationSpeed: number;

  /**
   * Última velocidad no-cero. Se preserva al pausar para poder reanudar
   * exactamente en el stop anterior. Predeterminado: 1.
   */
  lastNonZeroSpeed: number;

  /** Establece simulationSpeed directamente. Si value > 0, actualiza también lastNonZeroSpeed. */
  setSimulationSpeed: (speed: number) => void;

  /** Alterna pausa/play: si speed > 0 → pausa (speed=0); si speed === 0 → restaura lastNonZeroSpeed. */
  togglePause: () => void;

  /** Avanza al siguiente stop de SPEED_STOPS_SECONDS_PER_SECOND. No-op si ya está en el último. */
  incrementSpeedStop: () => void;

  /** Retrocede al stop anterior de SPEED_STOPS_SECONDS_PER_SECOND. No-op si ya está en el primero. */
  decrementSpeedStop: () => void;

  // — Date picker auto-pause —

  /**
   * Abre el date picker y pausa la simulación.
   * Idempotente: si el picker ya está abierto, no hace nada.
   */
  openDatePicker: () => void;

  /**
   * Cierra el date picker y restaura la velocidad de simulación previa.
   * Idempotente: si el picker no estaba abierto, no hace nada.
   */
  closeDatePicker: () => void;
}

/**
 * Tipo interno que extiende AppState con campos privados del date picker.
 * Los campos prefijados con `_` son convención-privada.
 * Exportado para que los tests unitarios puedan acceder a ellos sin casts `any`.
 */
export interface AppStateInternal extends AppState {
  /** True mientras el date picker está visible. */
  datePickerOpen: boolean;
  /** Velocidad guardada antes de abrir el picker. null = picker cerrado. */
  _speedBeforePickerOpen: number | null;
  /** JD guardado antes de abrir el picker (para cancelar con Escape). null = picker cerrado. */
  _jdBeforePickerOpen: number | null;
}

/**
 * @invariant FRAME-RATE STATE (60Hz) NEVER belongs here.
 *
 * ✅ Correcto — en este store:
 *   level, viewMode, simulationSpeed (eventos discretos del usuario)
 *
 * ❌ Incorrecto — NUNCA añadir:
 *   simulationTime, elapsed, jd, posiciones de planetas a 60Hz
 *
 * Usa `simulationClock` (src/scenes/simulationClock.ts) para tiempo de simulación.
 * Mover tiempo a 60Hz a Zustand provocó ~17 re-renders/frame (Refactor C regression).
 * Ver: src/scenes/simulationClock.ts — invariante arquitectónica documentada allí.
 */
export const useAppStore = create<AppStateInternal>()((set) => ({
  // Campos originales
  level: 'aprendiz',
  locale: 'es',
  setLevel: (level) => set({ level }),
  setLocale: (locale) => set({ locale }),

  // Cámara home
  cameraHomeRequested: 0,
  requestCameraHome: () => set((s) => ({ cameraHomeRequested: s.cameraHomeRequested + 1 })),

  // Nuevos campos
  selectedBody: null,
  setSelectedPlanet: (planet) => set({ selectedBody: planet }),

  cameraMode: 'overview',
  setCameraMode: (cameraMode) => set({ cameraMode }),

  textureQuality: '2k',
  setTextureQuality: (textureQuality) => set({ textureQuality }),

  tourActive: false,
  setTourActive: (tourActive) => set({ tourActive }),

  tourCurrentPlanet: null,
  setTourCurrentPlanet: (tourCurrentPlanet) => set({ tourCurrentPlanet }),

  prefersReducedMotion: false,
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),

  sunShaderVariant: 'full',
  setSunShaderVariant: (sunShaderVariant) => set({ sunShaderVariant }),

  legacyFlag: false,

  // Modo local
  viewMode: 'global',
  setViewMode: (viewMode) => set({ viewMode }),

  showKnownEvents: false,
  setShowKnownEvents: (showKnownEvents) => set({ showKnownEvents }),

  showOortCloud: false,
  setShowOortCloud: (showOortCloud) => set({ showOortCloud }),

  goToBody: (id) => {
    if (id === null) {
      set({ selectedBody: null, viewMode: 'global', cameraMode: 'overview' });
    } else {
      set({ selectedBody: id, viewMode: 'local', cameraMode: 'focus' });
    }
  },

  showRotationAxes: false,
  toggleRotationAxes: () => {
    const { showRotationAxes } = useAppStore.getState();
    set({ showRotationAxes: !showRotationAxes });
  },

  // Control de velocidad de simulación
  simulationSpeed: 1,
  lastNonZeroSpeed: 1,

  setSimulationSpeed: (speed) => {
    if (speed !== 0) {
      set({ simulationSpeed: speed, lastNonZeroSpeed: speed });
    } else {
      set({ simulationSpeed: 0 });
    }
  },

  togglePause: () => {
    const { simulationSpeed, lastNonZeroSpeed } = useAppStore.getState();
    if (simulationSpeed === 0) {
      set({ simulationSpeed: lastNonZeroSpeed });
    } else {
      set({ simulationSpeed: 0 });
    }
  },

  incrementSpeedStop: () => {
    const { simulationSpeed } = useAppStore.getState();
    const idx = SPEED_STOPS_SECONDS_PER_SECOND.indexOf(simulationSpeed);
    // Fallback: si speed no está en el array, ir al stop de tiempo real (índice 13)
    const nextIdx = idx === -1 ? 13 : Math.min(idx + 1, SPEED_STOPS_SECONDS_PER_SECOND.length - 1);
    const nextSpeed = SPEED_STOPS_SECONDS_PER_SECOND[nextIdx];
    if (nextSpeed !== simulationSpeed) {
      if (nextSpeed !== 0) {
        set({ simulationSpeed: nextSpeed, lastNonZeroSpeed: nextSpeed });
      } else {
        // Transitando por la pausa: preservar lastNonZeroSpeed
        const { lastNonZeroSpeed } = useAppStore.getState();
        set({ simulationSpeed: 0, lastNonZeroSpeed: lastNonZeroSpeed });
      }
    }
  },

  decrementSpeedStop: () => {
    const { simulationSpeed } = useAppStore.getState();
    const idx = SPEED_STOPS_SECONDS_PER_SECOND.indexOf(simulationSpeed);
    // Fallback: si speed no está en el array, ir al stop de tiempo real (índice 13)
    const prevIdx = idx === -1 ? 13 : Math.max(idx - 1, 0);
    const prevSpeed = SPEED_STOPS_SECONDS_PER_SECOND[prevIdx];
    if (prevSpeed !== simulationSpeed) {
      if (prevSpeed !== 0) {
        set({ simulationSpeed: prevSpeed, lastNonZeroSpeed: prevSpeed });
      } else {
        // Transitando por la pausa: preservar lastNonZeroSpeed
        const { lastNonZeroSpeed } = useAppStore.getState();
        set({ simulationSpeed: 0, lastNonZeroSpeed: lastNonZeroSpeed });
      }
    }
  },

  // — Date picker auto-pause —
  datePickerOpen: false,
  _speedBeforePickerOpen: null,
  _jdBeforePickerOpen: null,

  openDatePicker: () => {
    const s = useAppStore.getState();
    // Idempotente: si ya está abierto (_speedBeforePickerOpen ya guardado), no-op
    if (s._speedBeforePickerOpen !== null) return;
    set({
      datePickerOpen: true,
      _speedBeforePickerOpen: s.simulationSpeed,
      simulationSpeed: 0,
    });
  },

  closeDatePicker: () => {
    const s = useAppStore.getState();
    // Idempotente: si no estaba abierto, no-op
    if (!s.datePickerOpen && s._speedBeforePickerOpen === null) return;
    const restoredSpeed = s._speedBeforePickerOpen ?? s.lastNonZeroSpeed;
    set({
      datePickerOpen: false,
      simulationSpeed: restoredSpeed,
      _speedBeforePickerOpen: null,
      _jdBeforePickerOpen: null,
    });
  },
}));

// ---------------------------------------------------------------------------
// Selectores — hooks para suscripción a sub-estado
// ---------------------------------------------------------------------------

export const useLevel = () => useAppStore((s) => s.level);
export const useLocale = () => useAppStore((s) => s.locale);
export const useSelectedBody = () => useAppStore((s) => s.selectedBody);
/**
 * @deprecated Usa useSelectedBody(). Devuelve selectedBody como PlanetId | null
 * (null cuando el cuerpo seleccionado es 'moon').
 */
export const useSelectedPlanet = (): PlanetId | null => {
  const body = useAppStore((s) => s.selectedBody);
  return body !== 'moon' ? body : null;
};
export const useCameraMode = () => useAppStore((s) => s.cameraMode);
export const useTextureQuality = () => useAppStore((s) => s.textureQuality);
export const useTourActive = () => useAppStore((s) => s.tourActive);
export const useTourCurrentPlanet = () => useAppStore((s) => s.tourCurrentPlanet);
export const usePrefersReducedMotion = () => useAppStore((s) => s.prefersReducedMotion);
export const useSunShaderVariant = () => useAppStore((s) => s.sunShaderVariant);
export const useViewMode = () => useAppStore((s) => s.viewMode);
export const useShowKnownEvents = () => useAppStore((s) => s.showKnownEvents);
export const useShowOortCloud = () => useAppStore((s) => s.showOortCloud);
export const useSimulationSpeed = () => useAppStore((s) => s.simulationSpeed);
export const useLastNonZeroSpeed = () => useAppStore((s) => s.lastNonZeroSpeed);

// ---------------------------------------------------------------------------
// Exposición para e2e (Playwright)
// ---------------------------------------------------------------------------

/**
 * Los specs e2e necesitan entrar en modo local de forma determinista
 * (goToBody) sin depender de un raycast WebGL sobre el canvas, que es frágil
 * en headless (posición en pantalla del planeta desconocida y variable).
 *
 * Exponer el store es inocuo: es estado de UI puramente cliente, ya accesible
 * vía React DevTools; no hay datos sensibles ni superficie de seguridad nueva.
 */
declare global {
  interface Window {
    __APP_STORE__?: typeof useAppStore;
  }
}

if (typeof window !== 'undefined') {
  window.__APP_STORE__ = useAppStore;
}
