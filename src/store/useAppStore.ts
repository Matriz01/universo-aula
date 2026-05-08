import { create } from 'zustand';
import type { PedagogicalLevel } from '@/types';
import type { PlanetId } from '@/scenes/data/types';
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

  /** Planeta actualmente seleccionado por el usuario. null = ninguno. */
  selectedPlanet: PlanetId | null;
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

  /**
   * Acción unificada de navegación.
   * null  → vuelve a modo global (selectedPlanet=null, viewMode='global', cameraMode='overview')
   * PlanetId → entra en modo local (selectedPlanet=id, viewMode='local', cameraMode='focus')
   */
  goToBody: (id: PlanetId | null) => void;

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
export const useAppStore = create<AppState>()((set) => ({
  // Campos originales
  level: 'aprendiz',
  locale: 'es',
  setLevel: (level) => set({ level }),
  setLocale: (locale) => set({ locale }),

  // Cámara home
  cameraHomeRequested: 0,
  requestCameraHome: () => set((s) => ({ cameraHomeRequested: s.cameraHomeRequested + 1 })),

  // Nuevos campos
  selectedPlanet: null,
  setSelectedPlanet: (selectedPlanet) => set({ selectedPlanet }),

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

  goToBody: (id) => {
    if (id === null) {
      set({ selectedPlanet: null, viewMode: 'global', cameraMode: 'overview' });
    } else {
      set({ selectedPlanet: id, viewMode: 'local', cameraMode: 'focus' });
    }
  },

  // Control de velocidad de simulación
  simulationSpeed: 1,
  lastNonZeroSpeed: 1,

  setSimulationSpeed: (speed) => {
    if (speed > 0) {
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
    const nextIdx = idx === -1 ? 1 : Math.min(idx + 1, SPEED_STOPS_SECONDS_PER_SECOND.length - 1);
    const nextSpeed = SPEED_STOPS_SECONDS_PER_SECOND[nextIdx];
    if (nextSpeed !== simulationSpeed) {
      if (nextSpeed > 0) {
        set({ simulationSpeed: nextSpeed, lastNonZeroSpeed: nextSpeed });
      } else {
        set({ simulationSpeed: nextSpeed });
      }
    }
  },

  decrementSpeedStop: () => {
    const { simulationSpeed, lastNonZeroSpeed } = useAppStore.getState();
    const idx = SPEED_STOPS_SECONDS_PER_SECOND.indexOf(simulationSpeed);
    const prevIdx = idx === -1 ? 0 : Math.max(idx - 1, 0);
    const prevSpeed = SPEED_STOPS_SECONDS_PER_SECOND[prevIdx];
    if (prevSpeed !== simulationSpeed) {
      if (prevSpeed > 0) {
        set({ simulationSpeed: prevSpeed, lastNonZeroSpeed: prevSpeed });
      } else {
        // Bajando a pausa: preservar lastNonZeroSpeed
        set({ simulationSpeed: 0, lastNonZeroSpeed: lastNonZeroSpeed });
      }
    }
  },
}));

// ---------------------------------------------------------------------------
// Selectores — hooks para suscripción a sub-estado
// ---------------------------------------------------------------------------

export const useLevel = () => useAppStore((s) => s.level);
export const useLocale = () => useAppStore((s) => s.locale);
export const useSelectedPlanet = () => useAppStore((s) => s.selectedPlanet);
export const useCameraMode = () => useAppStore((s) => s.cameraMode);
export const useTextureQuality = () => useAppStore((s) => s.textureQuality);
export const useTourActive = () => useAppStore((s) => s.tourActive);
export const useTourCurrentPlanet = () => useAppStore((s) => s.tourCurrentPlanet);
export const usePrefersReducedMotion = () => useAppStore((s) => s.prefersReducedMotion);
export const useSunShaderVariant = () => useAppStore((s) => s.sunShaderVariant);
export const useViewMode = () => useAppStore((s) => s.viewMode);
export const useShowKnownEvents = () => useAppStore((s) => s.showKnownEvents);
export const useSimulationSpeed = () => useAppStore((s) => s.simulationSpeed);
export const useLastNonZeroSpeed = () => useAppStore((s) => s.lastNonZeroSpeed);
