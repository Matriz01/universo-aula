# r3f-testing — Patrones concretos de universo-aula

Ejemplos extraídos de los tests reales del proyecto (Vitest + Testing Library +
Playwright, ~729 tests unitarios en 75 archivos). Úsalos como plantilla. Las
rutas citan archivos existentes que puedes leer para más contexto.

---

## 1. Mocking de un componente R3F

`@react-three/fiber` y `@react-three/drei` se mockean enteros: jsdom no tiene
WebGL. Patrón canónico (ver `tests/unit/scenes/components/Planet.test.tsx`):

```tsx
// 1. Spies capturables — hoisted para que existan antes de los vi.mock
const { useTextureSpy, usePlanetPositionSpy } = vi.hoisted(() => ({
  useTextureSpy: vi.fn().mockReturnValue({}),
  usePlanetPositionSpy: vi.fn().mockReturnValue({
    current: { x: 5, y: 0, z: 0, set: vi.fn() },
  }),
}));

// 2. Mock de R3F: Canvas → div, useFrame noop, useThree con stubs
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() }, near: 0.1, far: 1000 },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
}));

// 3. Mock de Drei: Html/Lod/Detailed → primitivas DOM/three
vi.mock('@react-three/drei', () => ({
  useTexture: useTextureSpy,
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="planet-label">{children}</div>
  ),
  Lod: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
  Detailed: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
}));

// 4. Mock de hooks custom para AISLAR el componente bajo test
vi.mock('@/scenes/hooks/usePlanetPosition', () => ({
  usePlanetPosition: usePlanetPositionSpy,
}));

// 5. Import del SUT DESPUÉS de los mocks
import { Planet } from '@/scenes/components/Planet';
```

Las assertions verifican **composición y llamadas**, no geometría 3D:

```tsx
it('llama a usePlanetPosition con el planeta y nivel correctos', () => {
  render(
    <div data-testid="canvas">
      <Planet planet={earthData} level="aprendiz" />
    </div>,
  );
  expect(usePlanetPositionSpy).toHaveBeenCalledWith(earthData, 'aprendiz');
});
```

### Composición de escena — conteo de hijos

Para una escena que monta muchos componentes (`SolarSystemScene.test.tsx`),
mockea cada hijo a `null` con un contador:

```tsx
const { mockCounts } = vi.hoisted(() => ({ mockCounts: { Sun: 0, Planet: 0 } }));
vi.mock('@/scenes/components/Sun', () => ({
  Sun: () => {
    mockCounts.Sun++;
    return null;
  },
}));
// ...
it('monta exactamente 8 Planets (todos excepto Saturno)', () => {
  render(<SolarSystemScene />);
  expect(mockCounts.Planet).toBe(8);
});
```

---

## 2. Testear código dentro de `useFrame`

`useFrame` NUNCA se ejecuta solo. Dos variantes según la necesidad.

### Variante A — invocar inmediatamente (un frame)

`tests/unit/scenes/SimulationTicker.test.tsx`: el mock llama al callback al
montar y captura el `priority`.

```tsx
const FAKE_DELTA = 0.016; // ~60 fps
let capturedPriority: number | undefined;

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: (s: object, dt: number) => void, priority?: number) => {
    capturedPriority = priority;
    cb({}, FAKE_DELTA); // invoca un frame
  },
}));

it('regresión: useFrame usa priority -2 (orden tick → OriginTracker → consumers)', () => {
  render(<SimulationTicker />);
  expect(capturedPriority).toBe(-2);
});
```

> **Gotcha — `priority` es crítico.** El orden por frame DEBE ser
> SimulationTicker (`-2`) → OriginTracker (`-1`) → consumers (`0`). Sin el
> `priority -2`, el JD avanza tarde y la cámara tiembla a alta velocidad.

### Variante B — loop manual de N frames

`tests/unit/scenes/hooks/usePlanetPosition.test.ts`: captura todos los
callbacks y los avanza con un helper.

```ts
type FrameCallback = (state: unknown, dt: number) => void;
let capturedFrameCallbacks: FrameCallback[] = [];

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: FrameCallback) => {
    capturedFrameCallbacks.push(cb);
  },
}));

function tickFrames(count: number, dt = 0.016) {
  for (let i = 0; i < count; i++) {
    capturedFrameCallbacks.forEach((cb) => cb({}, dt));
  }
}

it('con speed=0, la posición NO cambia tras 10 frames', () => {
  mockState.speed = 0;
  const { result } = renderHook(() => usePlanetPosition(earthData, 'aprendiz'));
  tickFrames(1);
  const x0 = result.current.current.x;
  tickFrames(10);
  expect(result.current.current.x).toBeCloseTo(x0, 6);
});
```

Inyecta estado mutante (`mockState.speed`) ANTES de renderizar/tickear.

### Variante C — efecto del callback sobre un objeto Three.js

El caso difícil: el callback muta `groupRef.current.position` o
`meshRef.current.rotation`.

**Comprobado ejecutando los tests, no suponiendo:** en jsdom, con
`@react-three/fiber` mockeado, el elemento `<group>` / `<mesh>` se renderiza como
un nodo DOM corriente. El `ref` apunta a ese nodo DOM — un `HTMLElement` SIN
`.position` ni `.rotation`. Consecuencias:

- El efecto de mutar un objeto Three.js **NO es unit-testable** en jsdom.
- `vi.spyOn(React, 'useRef')` **NO sirve**: el componente importa `useRef` como
  named import (`import { useRef } from 'react'`), una binding ya resuelta;
  espiar `React.useRef` no la afecta. Verificado: produce tests que crashean
  (`Cannot read properties of undefined (reading 'set')`).

**Única vía robusta — extrae el cálculo a una función pura.** El callback solo
debe contener la asignación al objeto three; el resto se extrae y se testea como
función pura, sin mocks de R3F ni refs:

```ts
// ❌ lógica enterrada en useFrame — no testeable
useFrame(() => {
  mesh.current.rotation.y = computeSpin(getJD(), period);
});

// ✅ computeSpin es pura → test directo, 100% de las 4 categorías
export function computeSpin(jd: number, period: number): number {
  /* ... */
}
useFrame(() => {
  if (mesh.current) mesh.current.rotation.y = computeSpin(getJD(), period);
});
```

**El borde no testeable** (la asignación `.position.set(...)` / `.rotation.y =`):

- Unit test: verifica que el callback se REGISTRA —
  `expect(capturedFrameCallback).toBeDefined()`.
- Documenta la omisión: `// efecto de posición sobre el Group: cubierto en e2e`.
- El efecto visible se cubre en Playwright e2e.
- **Nunca** dejes pasar "el callback se registra" como si fuera cobertura de lo
  que el callback HACE. Si la lógica importa, extráela. Si el callback es una
  asignación trivial sin cálculo (como en `BodyMarker`), no hay nada que
  extraer: el unit test verifica el registro y el efecto queda en e2e — pero
  dilo explícitamente en un comentario.

---

## 3. `simulationClock`

Módulo singleton con estado. Resetéalo siempre en `beforeEach`
(`tests/unit/scenes/simulationClock.test.ts`):

```ts
beforeEach(() => {
  clock.reset(J2000);
  clock.setPaused(false);
});
```

Cubre las cuatro categorías obligatorias:

```ts
// happy path — fórmula JD += dt * speedup / 86400
it('avanza 1 día con tick(1.0, 86400.0)', () => {
  clock.tick(1.0, 86400.0);
  expect(clock.getJD()).toBe(J2000 + 1.0);
});

// boundary — pausa
it('no avanza si está pausado', () => {
  clock.setPaused(true);
  clock.tick(10.0, 86400.0);
  expect(clock.getJD()).toBe(J2000);
});

// determinismo / precisión a framerate real
it('60 frames a dt=1/60, speedup=86400 → exactamente 1 día', () => {
  for (let i = 0; i < 60; i++) clock.tick(1 / 60, 86400);
  expect(clock.getJD()).toBeCloseTo(J2000 + 1.0, 6);
});

// round-trip de conversión (caso límite: año bisiesto)
it('round-trip {2000,2,29}', () => {
  const d = { year: 2000, month: 2, day: 29 };
  expect(clock.jdToGregorian(clock.gregorianToJD(d))).toEqual(d);
});
```

---

## 4. Store Zustand

No hay función `reset()`. Restablece el slice relevante con `setState` en
`beforeEach` y consulta con `getState()` (`tests/unit/store/useAppStore.test.ts`):

```ts
beforeEach(() => {
  useAppStore.setState({ selectedBody: null });
});

it('setSelectedPlanet actualiza selectedBody', () => {
  useAppStore.getState().setSelectedPlanet('mars');
  expect(useAppStore.getState().selectedBody).toBe('mars');
});
```

> **Invariante de arquitectura.** Estado a 60 Hz (tiempo de simulación,
> transforms) NUNCA va en el store — eso causa ~17 re-renders/frame. El tiempo
> vive solo en `simulationClock`. Un test que añada `simulationTime` al store
> está violando el diseño.

---

## 5. i18n

Mock mínimo de `useTranslation`; `t()` devuelve la `key`. Sin provider, sin
JSON real:

```tsx
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'es' },
  }),
}));
```

Para la lógica de i18n pura (cadena de fallback) se testea la función directa,
sin mocks (`tests/unit/i18n.test.ts`).

---

## 6. Cross-checks astronómicos (en vez de snapshots)

El proyecto NO usa `toMatchSnapshot()`. Para valores físicos se verifica un
**rango con tolerancia justificada y fuente citada**
(`tests/unit/scenes/hooks/useMoonPosition.test.ts`):

```ts
/**
 * JD 2460408.5 = eclipse solar 2024-04-08.
 * Fuente: NASA JPL Horizons — Target 301 (Moon), Observer 399 (Earth).
 * Modelo MVP estático (sin precesión de nodos): tolerancia ±10 %.
 */
it('eclipse 2024-04-08: distancia geocéntrica en rango lunar', () => {
  const pos = computeMoonPosition(EARTH_ORIGIN, 2460408.5);
  expect(pos.length()).toBeGreaterThan(326); // 363300 km * 0.9 / 1000
  expect(pos.length()).toBeLessThan(446); // 405500 km * 1.1 / 1000
});
```

Regla: toda tolerancia lleva en comentario **el porqué** y **la fuente**. Si un
test diverge, investiga el modelo — no amplíes la tolerancia para taparlo.

---

## 7. Tests de regresión

Cada bug arreglado deja un test que lo habría capturado. Pueden requerir mocks
sofisticados — p.ej. rastrear instanciaciones de un material
(`tests/unit/scenes/components/Saturn.rings-regression.test.tsx`):

```ts
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Base = actual['MeshBasicMaterial'] as new (p?: object) => object;
  class Tracking extends Base {
    constructor(p?: object) {
      super(p);
      ringMaterialCallsRef.push(this);
    }
  }
  return { ...actual, MeshBasicMaterial: Tracking };
});
```

Nombra el archivo `*.regression.test.tsx` o `*.<bug>.test.tsx` y documenta en
comentario el bug que cubre.

---

## 8. Playwright e2e

Contra el servidor `pnpm preview` (`tests/e2e/*.spec.ts`). Locators por
`data-testid`, timeouts largos para esperar el canvas R3F:

```ts
test('el canvas está presente', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="solar-canvas"]')).toBeVisible({
    timeout: 15_000,
  });
});
```

> **Gotcha — WebGL headless.** En CI headless, Chromium emite errores de
> consola de GPU que NO son de la app. El test de "0 errores de consola" está
> `test.skip` por eso; reactívalo solo con `--headed`.

---

## 9. Plantilla — test de componente R3F

Copia y adapta:

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const { depSpy } = vi.hoisted(() => ({ depSpy: vi.fn() }));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
}));
vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/scenes/hooks/useMyHook', () => ({ useMyHook: depSpy }));

import { MyComponent } from '@/scenes/components/MyComponent';

describe('<MyComponent>', () => {
  // happy path
  it('monta sin errores con props válidas', () => {
    expect(() =>
      render(
        <div data-testid="canvas">
          <MyComponent prop={validProp} />
        </div>,
      ),
    ).not.toThrow();
  });

  // límite
  it('maneja la prop en su valor límite', () => {
    /* ... */
  });

  // error / entrada inválida
  it('no rompe con prop ausente o inválida', () => {
    /* ... */
  });

  // determinismo
  it('mismo input → misma llamada a la dependencia', () => {
    render(
      <div data-testid="canvas">
        <MyComponent prop={validProp} />
      </div>,
    );
    expect(depSpy).toHaveBeenCalledWith(validProp);
  });
});
```
