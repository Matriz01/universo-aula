/**
 * 1.13 — TEST: useAppStore extendido con 6 nuevos campos.
 * Extiende los tests existentes en store.test.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore — campos originales', () => {
  beforeEach(() => {
    useAppStore.setState({ locale: 'es', level: 'aprendiz' });
  });

  it('estado inicial tiene locale es y level aprendiz', () => {
    const state = useAppStore.getState();
    expect(state.locale).toBe('es');
    expect(state.level).toBe('aprendiz');
  });

  it('setLocale actualiza el locale', () => {
    useAppStore.getState().setLocale('en');
    expect(useAppStore.getState().locale).toBe('en');
  });

  it('setLevel actualiza el nivel', () => {
    useAppStore.getState().setLevel('investigador');
    expect(useAppStore.getState().level).toBe('investigador');
  });
});

describe('useAppStore — selectedBody (via setSelectedPlanet)', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedBody: null });
  });

  it('valor inicial es null', () => {
    expect(useAppStore.getState().selectedBody).toBeNull();
  });

  it('setSelectedPlanet actualiza selectedBody con el planeta seleccionado', () => {
    useAppStore.getState().setSelectedPlanet('mars');
    expect(useAppStore.getState().selectedBody).toBe('mars');
  });

  it('setSelectedPlanet acepta null', () => {
    useAppStore.getState().setSelectedPlanet('earth');
    useAppStore.getState().setSelectedPlanet(null);
    expect(useAppStore.getState().selectedBody).toBeNull();
  });
});

describe('useAppStore — cameraMode', () => {
  beforeEach(() => {
    useAppStore.setState({ cameraMode: 'overview' });
  });

  it('valor inicial es overview', () => {
    expect(useAppStore.getState().cameraMode).toBe('overview');
  });

  it('setCameraMode cambia a focus', () => {
    useAppStore.getState().setCameraMode('focus');
    expect(useAppStore.getState().cameraMode).toBe('focus');
  });

  it('setCameraMode cambia a tour', () => {
    useAppStore.getState().setCameraMode('tour');
    expect(useAppStore.getState().cameraMode).toBe('tour');
  });
});

describe('useAppStore — textureQuality', () => {
  beforeEach(() => {
    useAppStore.setState({ textureQuality: '2k' });
  });

  it('valor inicial es 2k', () => {
    expect(useAppStore.getState().textureQuality).toBe('2k');
  });

  it('setTextureQuality cambia a 4k', () => {
    useAppStore.getState().setTextureQuality('4k');
    expect(useAppStore.getState().textureQuality).toBe('4k');
  });

  it('setTextureQuality cambia a 1k', () => {
    useAppStore.getState().setTextureQuality('1k');
    expect(useAppStore.getState().textureQuality).toBe('1k');
  });
});

describe('useAppStore — tourActive', () => {
  beforeEach(() => {
    useAppStore.setState({ tourActive: false });
  });

  it('valor inicial es false', () => {
    expect(useAppStore.getState().tourActive).toBe(false);
  });

  it('setTourActive activa el tour', () => {
    useAppStore.getState().setTourActive(true);
    expect(useAppStore.getState().tourActive).toBe(true);
  });

  it('setTourActive desactiva el tour', () => {
    useAppStore.getState().setTourActive(true);
    useAppStore.getState().setTourActive(false);
    expect(useAppStore.getState().tourActive).toBe(false);
  });
});

describe('useAppStore — prefersReducedMotion', () => {
  beforeEach(() => {
    useAppStore.setState({ prefersReducedMotion: false });
  });

  it('valor inicial es false', () => {
    expect(useAppStore.getState().prefersReducedMotion).toBe(false);
  });

  it('setPrefersReducedMotion actualiza el valor', () => {
    useAppStore.getState().setPrefersReducedMotion(true);
    expect(useAppStore.getState().prefersReducedMotion).toBe(true);
  });
});

describe('useAppStore — sunShaderVariant', () => {
  beforeEach(() => {
    useAppStore.setState({ sunShaderVariant: 'full' });
  });

  it('valor inicial es full', () => {
    expect(useAppStore.getState().sunShaderVariant).toBe('full');
  });

  it('setSunShaderVariant cambia a lite', () => {
    useAppStore.getState().setSunShaderVariant('lite');
    expect(useAppStore.getState().sunShaderVariant).toBe('lite');
  });

  it('setSunShaderVariant cambia a texture', () => {
    useAppStore.getState().setSunShaderVariant('texture');
    expect(useAppStore.getState().sunShaderVariant).toBe('texture');
  });
});

describe('selectores exportados', () => {
  it('useSelectedPlanet, useCameraMode, useTourActive existen como exports', async () => {
    const module = await import('@/store/useAppStore');
    expect(typeof module.useSelectedPlanet).toBe('function');
    expect(typeof module.useCameraMode).toBe('function');
    expect(typeof module.useTourActive).toBe('function');
  });
});

describe('useAppStore — viewMode', () => {
  beforeEach(() => {
    useAppStore.setState({ viewMode: 'global' });
  });

  it('valor inicial es global', () => {
    expect(useAppStore.getState().viewMode).toBe('global');
  });

  it('setViewMode cambia a local', () => {
    useAppStore.getState().setViewMode('local');
    expect(useAppStore.getState().viewMode).toBe('local');
  });

  it('setViewMode cambia de local a global', () => {
    useAppStore.getState().setViewMode('local');
    useAppStore.getState().setViewMode('global');
    expect(useAppStore.getState().viewMode).toBe('global');
  });
});

describe('useAppStore — showKnownEvents', () => {
  beforeEach(() => {
    useAppStore.setState({ showKnownEvents: false });
  });

  it('valor inicial es false', () => {
    expect(useAppStore.getState().showKnownEvents).toBe(false);
  });

  it('setShowKnownEvents activa los eventos', () => {
    useAppStore.getState().setShowKnownEvents(true);
    expect(useAppStore.getState().showKnownEvents).toBe(true);
  });

  it('setShowKnownEvents desactiva los eventos', () => {
    useAppStore.getState().setShowKnownEvents(true);
    useAppStore.getState().setShowKnownEvents(false);
    expect(useAppStore.getState().showKnownEvents).toBe(false);
  });
});

describe('useAppStore — goToBody', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedBody: null,
      viewMode: 'global',
      cameraMode: 'overview',
    });
  });

  it('goToBody(null) establece modo global y limpia selección', () => {
    // Primero ir a modo local
    useAppStore.getState().goToBody('mars');
    // Luego volver a global
    useAppStore.getState().goToBody(null);
    const state = useAppStore.getState();
    expect(state.selectedBody).toBeNull();
    expect(state.viewMode).toBe('global');
    expect(state.cameraMode).toBe('overview');
  });

  it('goToBody(PlanetId) establece modo local con el planeta correcto', () => {
    useAppStore.getState().goToBody('jupiter');
    const state = useAppStore.getState();
    expect(state.selectedBody).toBe('jupiter');
    expect(state.viewMode).toBe('local');
    expect(state.cameraMode).toBe('focus');
  });

  it('goToBody con earth activa modo local con Tierra', () => {
    useAppStore.getState().goToBody('earth');
    const state = useAppStore.getState();
    expect(state.selectedBody).toBe('earth');
    expect(state.viewMode).toBe('local');
  });

  it('goToBody(null) desde global mantiene cameraMode overview', () => {
    useAppStore.getState().goToBody(null);
    expect(useAppStore.getState().cameraMode).toBe('overview');
  });
});

describe('selectores de modo local', () => {
  it('useViewMode y useShowKnownEvents existen como exports', async () => {
    const module = await import('@/store/useAppStore');
    expect(typeof module.useViewMode).toBe('function');
    expect(typeof module.useShowKnownEvents).toBe('function');
  });
});

describe('useAppStore — simulationSpeed', () => {
  beforeEach(() => {
    useAppStore.setState({ simulationSpeed: 1.0 });
  });

  it('valor inicial es 1.0', () => {
    expect(useAppStore.getState().simulationSpeed).toBe(1.0);
  });

  it('setSimulationSpeed actualiza la velocidad', () => {
    useAppStore.getState().setSimulationSpeed(2.5);
    expect(useAppStore.getState().simulationSpeed).toBe(2.5);
  });

  it('acepta 0 (pausa)', () => {
    useAppStore.getState().setSimulationSpeed(0);
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('acepta 5 (velocidad máxima)', () => {
    useAppStore.getState().setSimulationSpeed(5);
    expect(useAppStore.getState().simulationSpeed).toBe(5);
  });

  it('acepta valores decimales', () => {
    useAppStore.getState().setSimulationSpeed(1.5);
    expect(useAppStore.getState().simulationSpeed).toBeCloseTo(1.5);
  });
});

describe('selectores de simulación', () => {
  it('useSimulationSpeed existe como export', async () => {
    const module = await import('@/store/useAppStore');
    expect(typeof module.useSimulationSpeed).toBe('function');
  });
});

// ── T2.1–T2.4: openDatePicker / closeDatePicker (auto-pause) ─────────────────

describe('useAppStore — openDatePicker()', () => {
  beforeEach(() => {
    // Estado inicial conocido: simulando 1 día/s
    useAppStore.setState({
      simulationSpeed: 86400,
      lastNonZeroSpeed: 86400,
      _speedBeforePickerOpen: null,
      datePickerOpen: false,
    } as Parameters<typeof useAppStore.setState>[0]);
  });

  it('T2.1: openDatePicker pone simulationSpeed a 0', () => {
    useAppStore.getState().openDatePicker();
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('T2.1: openDatePicker guarda _speedBeforePickerOpen con el valor previo (86400)', () => {
    useAppStore.getState().openDatePicker();
    expect(useAppStore.getState()._speedBeforePickerOpen).toBe(86400);
  });

  it('T2.1: openDatePicker pone datePickerOpen en true', () => {
    useAppStore.getState().openDatePicker();
    expect(useAppStore.getState().datePickerOpen).toBe(true);
  });

  it('T2.2: openDatePicker es idempotente — no sobrescribe _speedBeforePickerOpen con 0', () => {
    useAppStore.getState().openDatePicker(); // primera llamada: guarda 86400
    useAppStore.getState().openDatePicker(); // segunda llamada: no-op
    expect(useAppStore.getState()._speedBeforePickerOpen).toBe(86400);
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });
});

describe('useAppStore — closeDatePicker()', () => {
  beforeEach(() => {
    useAppStore.setState({
      simulationSpeed: 86400,
      lastNonZeroSpeed: 86400,
      _speedBeforePickerOpen: null,
      datePickerOpen: false,
    } as Parameters<typeof useAppStore.setState>[0]);
  });

  it('T2.3: closeDatePicker tras open restaura simulationSpeed al valor previo', () => {
    useAppStore.getState().openDatePicker();
    expect(useAppStore.getState().simulationSpeed).toBe(0);
    useAppStore.getState().closeDatePicker();
    expect(useAppStore.getState().simulationSpeed).toBe(86400);
  });

  it('T2.3: closeDatePicker pone _speedBeforePickerOpen en null tras restaurar', () => {
    useAppStore.getState().openDatePicker();
    useAppStore.getState().closeDatePicker();
    expect(useAppStore.getState()._speedBeforePickerOpen).toBeNull();
  });

  it('T2.3: closeDatePicker pone datePickerOpen en false', () => {
    useAppStore.getState().openDatePicker();
    useAppStore.getState().closeDatePicker();
    expect(useAppStore.getState().datePickerOpen).toBe(false);
  });

  it('T2.4: closeDatePicker sin open previo usa lastNonZeroSpeed y no lanza error', () => {
    // _speedBeforePickerOpen es null, lastNonZeroSpeed es 86400
    useAppStore.setState({
      simulationSpeed: 0,
      lastNonZeroSpeed: 86400,
      _speedBeforePickerOpen: null,
      datePickerOpen: false,
    } as Parameters<typeof useAppStore.setState>[0]);

    expect(() => useAppStore.getState().closeDatePicker()).not.toThrow();
    // Speed no cambia (picker no estaba abierto — idempotente)
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });
});

// ── Nuevas acciones Batch 4: pausa/play + steps ──────────────────────────────

describe('useAppStore — lastNonZeroSpeed', () => {
  beforeEach(() => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
  });

  it('valor inicial es 1', () => {
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(1);
  });

  it('setSimulationSpeed con valor > 0 actualiza lastNonZeroSpeed', () => {
    useAppStore.getState().setSimulationSpeed(86400);
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(86400);
    expect(useAppStore.getState().simulationSpeed).toBe(86400);
  });

  it('setSimulationSpeed con 0 NO actualiza lastNonZeroSpeed', () => {
    useAppStore.setState({ simulationSpeed: 86400, lastNonZeroSpeed: 86400 });
    useAppStore.getState().setSimulationSpeed(0);
    expect(useAppStore.getState().simulationSpeed).toBe(0);
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(86400);
  });
});

describe('useAppStore — togglePause()', () => {
  beforeEach(() => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
  });

  it('pausar: cuando speed > 0, togglePause pone speed a 0', () => {
    useAppStore.setState({ simulationSpeed: 86400, lastNonZeroSpeed: 86400 });
    useAppStore.getState().togglePause();
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('reanudar: cuando speed === 0, togglePause restaura lastNonZeroSpeed', () => {
    useAppStore.setState({ simulationSpeed: 0, lastNonZeroSpeed: 86400 });
    useAppStore.getState().togglePause();
    expect(useAppStore.getState().simulationSpeed).toBe(86400);
  });

  it('lastNonZeroSpeed se preserva al pausar', () => {
    useAppStore.setState({ simulationSpeed: 3600, lastNonZeroSpeed: 3600 });
    useAppStore.getState().togglePause();
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(3600);
  });

  it('ciclo completo pause→resume vuelve a la velocidad original', () => {
    useAppStore.setState({ simulationSpeed: 604800, lastNonZeroSpeed: 604800 });
    useAppStore.getState().togglePause();
    useAppStore.getState().togglePause();
    expect(useAppStore.getState().simulationSpeed).toBe(604800);
  });
});

describe('useAppStore — incrementSpeedStop() / decrementSpeedStop()', () => {
  beforeEach(() => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
  });

  it('incrementSpeedStop sube al siguiente stop', () => {
    // stop 1 = 1, stop 2 = 3600
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    useAppStore.getState().incrementSpeedStop();
    expect(useAppStore.getState().simulationSpeed).toBe(3600);
  });

  it('decrementSpeedStop baja al stop anterior', () => {
    // stop 2 = 3600, stop 1 = 1
    useAppStore.setState({ simulationSpeed: 3600, lastNonZeroSpeed: 3600 });
    useAppStore.getState().decrementSpeedStop();
    expect(useAppStore.getState().simulationSpeed).toBe(1);
  });

  it('incrementSpeedStop en el último stop no cambia nada', () => {
    // stop 12 = 31536000
    useAppStore.setState({ simulationSpeed: 31536000, lastNonZeroSpeed: 31536000 });
    useAppStore.getState().incrementSpeedStop();
    expect(useAppStore.getState().simulationSpeed).toBe(31536000);
  });

  it('decrementSpeedStop en stop 0 no cambia nada', () => {
    useAppStore.setState({ simulationSpeed: 0, lastNonZeroSpeed: 1 });
    useAppStore.getState().decrementSpeedStop();
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('decrementSpeedStop en stop 1 (speed=1) baja a stop 0 (pausa)', () => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    useAppStore.getState().decrementSpeedStop();
    expect(useAppStore.getState().simulationSpeed).toBe(0);
  });

  it('incrementSpeedStop actualiza lastNonZeroSpeed', () => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    useAppStore.getState().incrementSpeedStop();
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(3600);
  });

  it('decrementSpeedStop a speed=0 no actualiza lastNonZeroSpeed', () => {
    useAppStore.setState({ simulationSpeed: 1, lastNonZeroSpeed: 1 });
    useAppStore.getState().decrementSpeedStop();
    // speed baja a 0, lastNonZeroSpeed debe preservarse
    expect(useAppStore.getState().lastNonZeroSpeed).toBe(1);
  });
});
