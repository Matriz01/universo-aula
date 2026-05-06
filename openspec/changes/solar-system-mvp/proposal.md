# Proposal: Solar System MVP

**Cambio:** `solar-system-mvp`
**Fecha:** 2026-05-06
**Estado:** Propuesta
**Autor:** sdd-propose (sub-agente)
**Basado en:** `openspec/changes/solar-system-mvp/exploration.md`

---

## 1. Intent (Intención)

Universo Aula nace para llevar el Sistema Solar a las aulas de forma viva, navegable y rigurosa. Este cambio construye el **MVP del Sistema Solar**: una escena 3D interactiva con el Sol, los ocho planetas, la Luna terrestre, Plutón (planeta enano) y un cinturón de asteroides representado, todo ello accesible en navegadores modernos sobre **SMART Boards 4K, tablets de aula y ordenadores personales**, sin backend, sin analíticas y bajo el umbral de RGPD by design.

La pieza pedagógica central es la **progresión por tres niveles** ya modelada en `useAppStore`: Explorador (3-6 años), Aprendiz (6-12) e Investigador (12-16+). El mismo grafo de escena R3F se reutiliza entre niveles, pero la cantidad y profundidad de la información mostrada, el modelo orbital empleado (circular → elíptica → Kepler), la densidad del HUD y los modos de cámara cambian de forma coherente con la edad y la madurez cognitiva del público objetivo.

El MVP entrega además un **tour automático narrado**, **pronunciación por voz (Web Speech TTS)** del nombre del planeta para los más pequeños y una **nota IAU 2006 sobre la reclasificación de Plutón** adaptada por nivel. Estas tres decisiones, confirmadas por el usuario tras la exploración, dan sentido a la promesa pedagógica del producto: no se trata sólo de mostrar planetas, sino de explicar cómo la ciencia evoluciona y cómo cada estudiante puede acercarse al cosmos en su propio plano.

Técnicamente, el cambio ataca también la deuda existente: el bundle actual es un único chunk de ~193 KB y la PWA necesita estrategia de cacheo de texturas. Este MVP introduce **code-splitting agresivo (`manualChunks`), `lazy(import())` del Canvas R3F, texturas en `CacheFirst` y `useTexture` con Suspense**. El resultado debe ser una primera carga sólida en 4G simulada (FCP <2s) y una experiencia offline-first en visitas posteriores.

La conexión con la misión educativa del proyecto es directa: cada decisión —escala didáctica frente a escala real, órbitas progresivas, datos en tres niveles, voz para pre-lectores— está al servicio de que un docente pueda **entrar en clase, abrir el navegador y enseñar el Sistema Solar sin fricción**, con material licenciado correctamente (AGPL-3.0 + CC BY-SA 4.0, texturas CC BY 4.0 atribuidas en pantalla) y sin extraer un solo byte de los estudiantes.

---

## 2. Scope (Alcance)

### 2.1 In-scope (lo que entra en este MVP)

- **Sol** con **shader animado de superficie** (fragment shader con simplex noise 3D + flujo radial; opcional sunspots).
- **8 planetas**: Mercurio, Venus, Tierra (con la Luna), Marte, Júpiter, Saturno (con anillos), Urano, Neptuno.
- **Plutón** como planeta enano, con etiqueta diferenciada y **nota IAU 2006** explicada por nivel pedagógico.
- **Cinturón de asteroides** entre Marte y Júpiter mediante `instancedMesh` (~500-2000 instancias según la GPU detectada al cargar).
- **Tres niveles pedagógicos** completos (Explorador / Aprendiz / Investigador) con datos, descripciones, modelo orbital y HUD diferenciados.
- **Datos científicos** en JSON estático (`/public/data/planets.json`): parámetros orbitales NASA JPL + datos físicos NASA Fact Sheets.
- **Texturas Solar System Scope (CC BY 4.0)**: 2K en carga inicial, **4K lazy** al hacer focus sobre un planeta.
- **Cámara**: `OrbitControls` (Drei) + tween de focus con **react-spring** + **tour automático** que recorre Sol → Plutón con narración por nivel.
- **Web Speech TTS** para pronunciación del nombre del planeta al hacer click en nivel Explorador (ES + EN).
- **i18n**: namespace `solar` en `src/i18n/locales/{es,en}/solar.json` con keys por nivel para los 9 cuerpos + Plutón.
- **HUD/InfoPanel** diferenciado por nivel (Explorador: pictogramas grandes; Aprendiz: panel compacto; Investigador: tabla científica).
- **Atribución Solar System Scope visible en UI de producción** (footer permanente + modal de créditos).
- **Code-splitting agresivo**: `lazy(() => import('./SolarSystemScene'))` + `manualChunks` (vendor-three, vendor-react, vendor-i18n, app-solar).
- **PWA SW cache**: `runtimeCaching` Workbox para `/textures/*` (CacheFirst) y `/data/*.json` (StaleWhileRevalidate).
- **Accesibilidad de cámara**: navegación con `Tab` (siguiente planeta), `Enter/Space` (focus), `Escape` (salir de focus), respeto de `prefers-reduced-motion` para tour y tweens.
- **Tests** (Strict TDD): unitarios Vitest para hooks de órbita y datos, E2E Playwright para carga, click en planeta, cambio de nivel, tour y atribución visible.

### 2.2 Out-of-scope (lo que NO entra — diferido a futuros changes)

- Whisper STT + transformers.js → change `voice-mvp`.
- Lunas adicionales más allá de la Luna terrestre → change `moons-mvp`.
- Free-fly WASD → change `camera-advanced`.
- Texturas 8K → v2.0 al detectar pantallas 5K+.
- Modo escala real científica (toggle "ver a escala") → post-MVP Investigador.
- Atmósferas con shader glow → v1.2.
- Cuerpos enanos del cinturón de Kuiper (Eris, Haumea, Makemake) → post-MVP.
- Sondas históricas y trayectorias (Voyager, New Horizons) → post-MVP.
- i18next-http-backend con namespace lazy → antes de añadir el 3er locale (este MVP carga `solar.json` síncrono junto a `common.json`).

---

## 3. Affected modules / packages (Módulos afectados)

### 3.1 Nuevo código

```
src/scenes/
  SolarSystemScene.tsx                 # nuevo, reemplaza EmptyScene en App.tsx (lazy import)
  components/
    Sun.tsx                            # esfera + ShaderMaterial animado
    Planet.tsx                         # esfera + textura + LOD + label
    PlanetMoon.tsx                     # Luna terrestre orbitando Tierra
    Saturn.tsx                         # Planet + RingGeometry con alpha
    AsteroidBelt.tsx                   # instancedMesh entre Marte y Júpiter
    OrbitPath.tsx                      # línea (circular o elíptica) según nivel
    CameraController.tsx               # OrbitControls + focus + tour
    StarField.tsx                      # fondo de estrellas (Drei <Stars>)
  shaders/
    sun.vert                           # GLSL vertex (passthrough)
    sun.frag                           # GLSL fragment (simplex noise + radial flow)
  hooks/
    usePlanetPosition.ts               # devuelve [x,y,z] según level y t
    useOrbitPath.ts                    # genera puntos para OrbitPath
    useFocusCamera.ts                  # tween react-spring para focus
    useTour.ts                         # máquina de estados del tour automático
    useGpuCapability.ts                # detecta capability inicial (instances count)
  data/
    types.ts                           # Planet, OrbitalParams, AsteroidConfig, etc.

src/voice/
  speakName.ts                         # Web Speech TTS (5 líneas)

src/components/ui/
  InfoPanel.tsx                        # panel lateral por nivel
  LevelSelector.tsx                    # selector visible en HUD
  LoadingScreen.tsx                    # con barra de progreso (useProgress de Drei)
  AttributionFooter.tsx                # atribución Solar System Scope visible
  PlutoNote.tsx                        # nota IAU 2006 contextual por nivel
  CreditsModal.tsx                     # modal de créditos accesible desde HUD

public/data/
  planets.json                         # datos numéricos neutrales

public/textures/
  sun/{1k,2k,4k}.jpg
  mercury/{1k,2k,4k}.jpg
  venus/{1k,2k,4k}.jpg
  earth/{1k,2k,4k}.jpg
  moon/{1k,2k,4k}.jpg
  mars/{1k,2k,4k}.jpg
  jupiter/{1k,2k,4k}.jpg
  saturn/{1k,2k,4k}.jpg
  saturn-rings/{2k,4k}.png             # PNG con alpha
  uranus/{1k,2k,4k}.jpg
  neptune/{1k,2k,4k}.jpg
  pluto/{1k,2k,4k}.jpg
```

### 3.2 Modificaciones

- `src/store/useAppStore.ts` → extender estado: `selectedPlanet`, `cameraMode`, `textureQuality`, `tourActive`, `prefersReducedMotion`.
- `src/i18n/locales/es/solar.json` y `src/i18n/locales/en/solar.json` → nuevo namespace.
- `src/i18n/index.ts` → registrar namespace `solar`.
- `src/App.tsx` → reemplazar `<EmptyScene />` por `<Suspense><SolarSystemScene /></Suspense>`.
- `vite.config.ts` → `manualChunks` + `workbox.runtimeCaching` para texturas y data.
- `package.json` → añadir `@react-spring/three` (~30 KB gzip) y, si se usa, `glsl-noise` o noise inline.

### 3.3 Tests

```
tests/unit/scenes/
  Sun.test.tsx
  Planet.test.tsx
  AsteroidBelt.test.tsx
  PlutoNote.test.tsx
tests/unit/hooks/
  usePlanetPosition.test.ts            # 3 niveles × varios planetas
  useOrbitPath.test.ts
  useFocusCamera.test.ts
  useTour.test.ts
tests/unit/voice/
  speakName.test.ts                    # con mock de window.speechSynthesis
tests/e2e/
  solar-system.spec.ts                 # carga, click planeta, cambio nivel, tour, atribución
  pluto-note.spec.ts
```

---

## 4. Approach (Enfoque)

### 4.1 Modelo de datos — `planets.json`

Schema completo (TypeScript-equivalente):

```ts
interface PlanetData {
  id:
    | 'mercury'
    | 'venus'
    | 'earth'
    | 'mars'
    | 'jupiter'
    | 'saturn'
    | 'uranus'
    | 'neptune'
    | 'pluto';
  classification: 'terrestrial' | 'gas_giant' | 'ice_giant' | 'dwarf_planet';
  // Datos físicos (NASA Fact Sheets, dominio público)
  radius_km: number;
  mass_kg: number; // formato científico, ej. 3.30e23
  density_g_cm3: number;
  gravity_m_s2: number;
  rotation_period_h: number;
  axial_tilt_deg: number;
  mean_temperature_k: number;
  // Parámetros orbitales (NASA JPL Horizons J2000)
  semi_major_axis_AU: number;
  eccentricity: number;
  inclination_deg: number;
  longitude_ascending_node_deg: number;
  argument_perihelion_deg: number;
  mean_anomaly_J2000_deg: number;
  orbital_period_days: number;
  // Visual
  color_hex: string; // fallback si la textura no carga
  has_rings: boolean;
  moons_count: number;
  texture_base: string; // '/textures/{id}/'
}

interface AsteroidBeltConfig {
  inner_AU: number; // 2.2
  outer_AU: number; // 3.2
  count_high: number; // 2000 (GPU potente)
  count_mid: number; // 1000
  count_low: number; // 500
  vertical_dispersion: number; // 0.05 (en unidades visuales)
  size_min: number;
  size_max: number;
  color_hex: string; // gris polvo
}

interface SolarSystemDataset {
  version: string;
  source: 'NASA JPL Horizons J2000 + NASA Fact Sheets';
  planets: PlanetData[];
  asteroid_belt: AsteroidBeltConfig;
}
```

Las descripciones, nombres traducidos y notas IAU **NO** van aquí. Van al namespace i18next `solar`.

### 4.2 Sistema de escalado didáctico

Las distancias y radios se escalan con **dos curvas independientes**, ambas sublogarítmicas, para garantizar que Mercurio sea visible junto a Júpiter sin que el Sol llene la pantalla.

Constantes propuestas (afinables en design):

```ts
const R_VISUAL_BASE = 0.3; // factor base de radio visual
const R_VISUAL_LOG_K = 0.6; // pendiente sublogarítmica de radio
const D_VISUAL_BASE = 5.0; // distancia visual del primer planeta
const D_VISUAL_LOG_K = 8.0; // pendiente sublogarítmica de distancia
const SUN_VISUAL_RADIUS = 2.5; // fijo, no escalado (siempre el más grande)

function visualRadius(radius_km: number): number {
  // r_visual = R_BASE + R_LOG_K * log2(radius_km / 1000)
  return R_VISUAL_BASE + R_VISUAL_LOG_K * Math.log2(radius_km / 1000);
}

function visualDistance(au: number): number {
  // d_visual = D_BASE + D_LOG_K * log2(au + 1)
  return D_VISUAL_BASE + D_VISUAL_LOG_K * Math.log2(au + 1);
}
```

El HUD muestra siempre la nota "**Las distancias y tamaños no están a escala real**" en niveles Aprendiz e Investigador. En Investigador, futuro toggle "modo a escala" (post-MVP).

### 4.3 Cálculo orbital por nivel — `usePlanetPosition`

Pseudocódigo del hook unificado (devuelve `THREE.Vector3`):

```ts
function usePlanetPosition(planet: PlanetData, level: PedagogicalLevel, t: number): Vector3 {
  switch (level) {
    case 'explorador': {
      // Órbita circular uniforme. t en segundos desde el montaje.
      const angularVelocity = (2 * Math.PI) / planet.orbital_period_days;
      const theta = angularVelocity * t * SPEEDUP_EXPLORADOR;
      const r = visualDistance(planet.semi_major_axis_AU);
      return new Vector3(r * Math.cos(theta), 0, r * Math.sin(theta));
    }
    case 'aprendiz': {
      // Elipse simplificada (sin Kepler real, sin anomalía verdadera)
      const a = visualDistance(planet.semi_major_axis_AU);
      const b = a * Math.sqrt(1 - planet.eccentricity ** 2);
      const theta = (2 * Math.PI * t * SPEEDUP_APRENDIZ) / planet.orbital_period_days;
      return new Vector3(a * Math.cos(theta), 0, b * Math.sin(theta));
    }
    case 'investigador': {
      // Kepler real con Newton-Raphson para resolver E desde M
      const M = degToRad(planet.mean_anomaly_J2000_deg) + meanMotion(planet) * tEpoch(t);
      const E = solveKeplerNewtonRaphson(M, planet.eccentricity, /*tol*/ 1e-6, /*maxIter*/ 8);
      const trueAnomaly =
        2 *
        Math.atan2(
          Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
          Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2),
        );
      const r = visualDistance(planet.semi_major_axis_AU) * (1 - planet.eccentricity * Math.cos(E));
      // Aplicar inclinación, longitud nodo ascendente, argumento perihelio
      return applyOrbitalRotation(r, trueAnomaly, planet);
    }
  }
}
```

`solveKeplerNewtonRaphson` y `applyOrbitalRotation` son funciones puras y testeables en aislamiento (TDD).

### 4.4 Shader del Sol

Approach: **fragment shader procedural** con tres capas combinadas:

1. **Base color**: gradiente radial del centro (amarillo intenso) al borde (naranja-rojo).
2. **Granulación**: 3D simplex noise (`glsl-noise` o implementación inline ~50 líneas) muestreado en coordenadas esféricas con escala `~3.0` y desplazamiento temporal en `uTime`.
3. **Flujo radial**: segundo octava de noise con frecuencia mayor (`~8.0`) y velocidad mayor que la primera capa, simulando convección.
4. **Sunspots opcionales**: tercera capa con threshold sobre noise lento; si `noise < 0.15`, oscurecer fragmento. Activable por flag para GPUs débiles.

Uniforms:

```glsl
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uGranulationScale;
uniform float uFlowScale;
uniform float uFlowSpeed;
uniform bool uSunspotsEnabled;
```

Vertex shader: passthrough con `vNormal` y `vWorldPos` para el fragmento.

**Fallback** en GPUs débiles (detectado por `useGpuCapability`): material con textura solar estática + `texture.offset` animado en `useFrame`. Bandera `uSunspotsEnabled = false`.

### 4.5 Cinturón de asteroides

`<instancedMesh>` con un único `BufferGeometry` (icosaedro de baja resolución, 20 caras) y `MeshStandardMaterial` gris polvo. Distribución:

- **Radio**: distribución log-normal entre `inner_AU` y `outer_AU` para concentrar más asteroides hacia el centro del cinturón.
- **Ángulo**: uniforme `[0, 2π)`.
- **Y** (vertical): gaussiana `N(0, vertical_dispersion)` para dispersión orbital pequeña.
- **Tamaño**: uniforme `[size_min, size_max]` con bias hacia tamaños pequeños.
- **Rotación inicial**: aleatoria por instancia.

Cantidad adaptada por `useGpuCapability()`:

- `high` (desktop discrete GPU): `count_high = 2000`.
- `mid` (laptops integradas, SMART Board): `count_mid = 1000`.
- `low` (tablets): `count_low = 500`.

La detección inicial usa `WEBGL_debug_renderer_info` cuando esté disponible, y un benchmark mínimo de 200 ms al arrancar la escena. Resultado cacheado en `sessionStorage`.

### 4.6 Tour automático — máquina de estados

```
idle ──start──▶ focus_planet ──tween_done──▶ narration
                                              │
                                              ├── tts_done ──▶ next_planet ──▶ focus_planet (siguiente)
                                              │                    │
                                              │                    └── última ──▶ idle (vuelta a vista general)
                                              │
                                              └── user_interrupt ──▶ idle
```

Duración por planeta según nivel:

- **Explorador**: 6 s focus + 4 s narración (Web Speech TTS pronuncia nombre + frase corta).
- **Aprendiz**: 5 s focus + 6 s narración.
- **Investigador**: 4 s focus + 8 s narración.

Si `prefersReducedMotion` está activo, los tweens se reducen a 0.3 s y el usuario controla el avance manualmente (botón "siguiente"). El tour es **siempre interrumpible** con click o `Escape`.

### 4.7 Cámara y focus — react-spring sobre gsap

**Justificación de react-spring**:

- `@react-spring/three` añade ~30 KB gzip (sólo el sub-paquete necesario).
- gsap completo añade ~70 KB gzip + plugin para Three.js.
- react-spring se integra nativamente con R3F mediante `<animated.group>` y se cancela limpiamente al unmount.
- gsap es más potente para timelines complejas, pero el tour del MVP es secuencial y simple — no justifica el coste.

Implementación de focus (resumen):

```ts
function useFocusCamera(target: Vector3 | null) {
  const { camera, controls } = useThree();
  const [props] = useSpring(() => ({
    cameraPos: camera.position.toArray(),
    targetPos: controls?.target.toArray() ?? [0, 0, 0],
    config: { tension: 120, friction: 26 }, // ~1.2 s easing
  }));
  // useEffect: cuando target cambia, animar a target + offset
}
```

### 4.8 Performance budget

| Métrica                                              | Target MVP   |
| ---------------------------------------------------- | ------------ |
| FCP (4G simulada)                                    | <2 s         |
| LCP (4G simulada)                                    | <3 s         |
| TTI (4G simulada)                                    | <5 s         |
| Bundle inicial JS sin Three.js                       | <300 KB gzip |
| Bundle `vendor-three` chunk (lazy)                   | <500 KB gzip |
| Bundle `app-solar` chunk (lazy)                      | <200 KB gzip |
| Total assets primera carga (JS + texturas 2K + data) | <20 MB       |
| Lighthouse Performance (producción)                  | ≥85          |
| Memoria GPU pico (10 cuerpos 2K)                     | <150 MB      |

Estos números se validan en `sdd-verify` con `pnpm build && du -sh dist/` y Lighthouse CI.

### 4.9 i18n — keys del namespace `solar`

Estructura formal:

```json
{
  "ui": {
    "level_selector": {
      "explorador": "Explorador",
      "aprendiz": "Aprendiz",
      "investigador": "Investigador"
    },
    "tour": { "start": "Iniciar tour", "stop": "Detener tour", "next": "Siguiente" },
    "attribution": "Texturas cortesía de Solar System Scope (CC BY 4.0)",
    "scale_note": "Las distancias y tamaños no están a escala real"
  },
  "mercury": {
    "name": "Mercurio",
    "explorador": { "description": "El planeta más pequeño del Sistema Solar." },
    "aprendiz": { "description": "Mercurio orbita el Sol en sólo 88 días." },
    "investigador": { "description": "Excentricidad orbital de 0,2056..." },
    "curiosity": "Un día en Mercurio dura más que un año."
  },
  "...": "...",
  "pluto": {
    "name": "Plutón",
    "iau_note": {
      "explorador": "Antes era el 9.º planeta. Ahora se llama planeta enano.",
      "aprendiz": "En 2006 la IAU decidió que Plutón es un planeta enano porque comparte su órbita con otros cuerpos.",
      "investigador": "En la Asamblea General de la IAU de 2006 (Resoluciones 5A y 6A) se redefinió 'planeta' exigiendo haber limpiado su órbita; Plutón cumple los dos primeros criterios pero no el tercero."
    }
  }
}
```

Las keys se cargan **junto a `common.json`** en el bootstrap de i18next (sin `i18next-http-backend` en el MVP; ~10-20 KB por locale es asumible). Migración a lazy namespace cuando se añada el 3er locale.

### 4.10 Plutón — nota IAU adaptada por nivel

La nota se muestra **siempre** que Plutón esté seleccionado, dentro del `<InfoPanel>`, con el texto correspondiente al nivel activo (ver keys arriba). En nivel Explorador se acompaña de un pictograma "antes / ahora" con el icono de planeta tachado y el icono de planeta enano. En Aprendiz e Investigador, además, hay un enlace al **modal de créditos** que lista las resoluciones IAU citadas y el link oficial a iau.org/resolutions/.

### 4.11 Accesibilidad de cámara

- `Tab` enfoca el siguiente cuerpo en orden Sol → Mercurio → … → Plutón.
- `Shift+Tab` enfoca el anterior.
- `Enter` o `Space` aplica focus de cámara al cuerpo enfocado.
- `Escape` libera el focus y devuelve la cámara a vista general.
- `T` arranca/detiene el tour automático.
- `prefers-reduced-motion: reduce` reduce duración de tweens a 0.3 s y desactiva animación continua del tour (avance manual).
- Todo el HUD es navegable con teclado y respeta contraste WCAG AA (verificable con axe-core en E2E).

---

## 5. Rollback plan (Plan de reversión)

1. **Tag de seguridad antes del deploy**: `git tag v0.0.1-bootstrap` ya existe (estado pre-MVP). Si el deploy en Cloudflare Workers falla, `git checkout v0.0.1-bootstrap && pnpm build && wrangler deploy` restaura la app vacía funcional en <2 minutos.
2. **Feature flag de emergencia**: `?legacy=1` en la URL hace que `App.tsx` renderice `<EmptyScene />` en lugar de `<SolarSystemScene />`. Útil si una GPU concreta crashea pero el resto del bundle es estable. La flag se lee en `useAppStore` durante el bootstrap.
3. **SW cache versionada**: `solar-textures-v1` en Workbox. Si una textura corrupta o un schema de datos roto se cuela en producción, bumping a `solar-textures-v2` invalida cachés stale en la próxima visita; usuarios con cache viejo reciben el nuevo hash automáticamente.
4. **Datos**: `planets.json` es fichero estático versionado en git. Rollback de datos = revert del commit que los modificó.
5. **Namespace i18n**: si una traducción rompe runtime (key faltante), i18next muestra la key como fallback y un warning en consola; no rompe la app.

---

## 6. Tradeoffs explícitos

| Decisión                                 | Alternativa descartada                        | Razón                                                                                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shader Sol procedural**                | Textura estática animada con `texture.offset` | Calidad visual superior (granulación 3D real) y mejor escalabilidad a 4K; el coste extra en GPU se mitiga con fallback en tablets.                                                                              |
| **react-spring** (`@react-spring/three`) | gsap completo + plugin Three.js               | Bundle 30 KB vs 70 KB; integración R3F nativa; tour del MVP no necesita timelines complejas.                                                                                                                    |
| **Plutón incluido**                      | Excluir Plutón                                | Valor pedagógico altísimo: la reclasificación IAU 2006 es una lección excelente sobre cómo evoluciona la ciencia y cómo las definiciones cambian con el conocimiento.                                           |
| **Tour automático en MVP**               | Diferir a `camera-tour`                       | Para nivel Explorador es **el** modo principal de uso (niños no usan ratón con OrbitControls); diferirlo dejaría el nivel cojo.                                                                                 |
| **Web Speech TTS**                       | Whisper STT + transformers.js                 | Web Speech: 0 KB de bundle, soporte nativo en todos los navegadores target; cubre la necesidad de pronunciación en Explorador. Whisper aporta valor en otro vector (input por voz) que se trata en `voice-mvp`. |
| **i18next namespace `solar`**            | JSON traducido separado en `/public/data/`    | Integración limpia con el sistema existente; un único mecanismo de fallbacks; traducciones colocalizadas con el resto del UI.                                                                                   |
| **Cinturón con `instancedMesh`**         | Particle system con shader custom             | `instancedMesh` es estándar Three.js, testeable, y permite raycast individual (futuro: click sobre asteroide). Particles son más baratos pero menos extensibles.                                                |
| **JSON estático bundled**                | Fetch a NASA JPL en runtime                   | RGPD by design (sin requests externos), PWA offline real, determinismo entre sesiones.                                                                                                                          |
| **Escala didáctica sublogarítmica**      | Escala lineal real                            | Lineal real hace los planetas invisibles (Sol ocupa ~99% pantalla). La nota explícita de "no a escala" educa al estudiante en la lectura crítica de visualizaciones.                                            |
| **Anillos con `RingGeometry` + alpha**   | Shader custom para anillos                    | Patrón estándar R3F, textura Solar System Scope ya incluye alpha, sin riesgo de rendimiento.                                                                                                                    |

---

## 7. Risks (Riesgos)

### Riesgo 1 (ALTO): Bundle y memoria GPU en tablets antiguas

**Descripción**: Three.js + texturas 2K × 10 cuerpos pueden superar los 150 MB de GPU compartida en iPad Air 2 o Samsung Tab A 2019 (límite WebGL ~256 MB).

**Mitigación**:

- `useGpuCapability` detecta la clase del dispositivo y sirve texturas 1K en `low`.
- LOD agresivo con `<Lod>` de Drei: planetas a >50 unidades como esfera de 16 segmentos sin textura.
- `texture.dispose()` automático al salir de focus en planetas no visibles más allá de cierta distancia.
- Test E2E Playwright con `--device='iPad Air'` antes de cada release.

### Riesgo 2 (MEDIO): Atribución Solar System Scope

**Descripción**: Sin atribución visible y permanente en la UI, se viola CC BY 4.0.

**Mitigación**:

- `<AttributionFooter>` siempre montado en el HUD, no ocultable.
- E2E test verifica que el texto "Solar System Scope" es visible en el DOM en producción.
- `CREDITS.md` ya existente se cita desde el modal de créditos.

### Riesgo 3 (MEDIO): SMART Board — eventos táctiles y pointer

**Descripción**: Modelos SMART Board con Chromium embebido viejo pueden tener PointerEvents inconsistentes con OrbitControls.

**Mitigación**:

- E2E Playwright con `touchscreen` emulado en device profile específico.
- Fallback documentado: si la rotación táctil falla, los botones del HUD permiten seleccionar planeta (no se requiere arrastrar para usar la app).
- Documentar firmware mínimo testado.

### Riesgo 4 (BAJO): Licencia de datos numéricos vs textuales

**Descripción**: Datos numéricos NASA son dominio público; copiar texto descriptivo de la web NASA activa políticas de copyright.

**Mitigación**:

- Sólo se copian valores numéricos.
- Todas las descripciones están redactadas en castellano desde cero (CC BY-SA 4.0 propias del proyecto).
- Code review de los textos antes de mergear `tasks` finales.

### Riesgo 5 (NUEVO, MEDIO): Shader del Sol en GPUs débiles

**Descripción**: Fragment shader con simplex noise 3D + dos octavas + temporal puede saturar GPUs móviles integradas y bajar de 60 FPS a 15-20 FPS.

**Mitigación**:

- `useGpuCapability` decide entre shader completo (mid/high) y fallback con textura animada por `texture.offset` (low).
- Uniform `uSunspotsEnabled` desactivable para reducir el coste del fragment.
- Profiling con Chrome DevTools Performance en device emulation antes del lanzamiento.

### Riesgo 6 (NUEVO, MEDIO): Tour automático y accesibilidad fotosensible

**Descripción**: Estudiantes con epilepsia fotosensible o trastornos vestibulares pueden verse afectados por tweens de cámara largos y por la animación continua del shader del Sol.

**Mitigación**:

- Respeto estricto de `prefers-reduced-motion` (tweens 0.3 s, avance manual).
- Botón "Pausar tour" siempre visible cuando el tour está activo.
- Botón "Saltar tour" para volver a vista general inmediatamente.
- El shader del Sol reduce su `uFlowSpeed` un 80 % cuando `prefers-reduced-motion` está activo.
- Test E2E con `prefers-reduced-motion` emulado.

---

## 8. Acceptance criteria (Criterios de aceptación de alto nivel)

Las specs detallarán cada uno con escenarios. A nivel proposal, lo que debe cumplirse:

- [ ] La escena carga en <5 s en 4G simulada (Lighthouse CI).
- [ ] Lighthouse Performance ≥85 en producción (https://universo-aula.pedrovicente.workers.dev/).
- [ ] Bundle inicial JS sin Three.js <300 KB gzip (verificable con `pnpm build`).
- [ ] Los 3 niveles muestran datos diferenciados al cambiar (validado por E2E).
- [ ] El cambio de nivel **no** rehace la escena 3D (sólo actualiza datos y modelo orbital).
- [ ] Click en cualquier planeta lo enfoca con animación suave (≤1.5 s).
- [ ] Tour automático recorre Sol → Plutón sin errores y respeta `prefers-reduced-motion`.
- [ ] Web Speech TTS pronuncia nombres en ES y EN al hacer click en nivel Explorador.
- [ ] Plutón muestra nota IAU adaptada por nivel.
- [ ] Cinturón de asteroides visible entre Marte y Júpiter (count adaptado a GPU).
- [ ] Anillos de Saturno visibles con textura alpha.
- [ ] Atribución "Solar System Scope (CC BY 4.0)" visible en el footer en build de producción.
- [ ] Navegación completa por teclado (Tab/Enter/Space/Escape/T).
- [ ] PWA offline funcional tras primera visita (texturas y datos cacheados).
- [ ] 0 errores de consola en producción.
- [ ] Tests unitarios Vitest verdes (incluye los 12 actuales + nuevos).
- [ ] Tests E2E Playwright verdes: carga, click planeta, cambio nivel, tour, atribución visible, Plutón nota, prefers-reduced-motion.
- [ ] Atribución NASA JPL + Fact Sheets en `CREDITS.md` y modal de créditos.

---

## 9. Próximas fases

Tras la aprobación de esta propuesta:

1. **`sdd-spec`**: detallar cada acceptance criterion como spec con escenarios Given/When/Then.
2. **`sdd-design`**: profundizar en
   - schema definitivo de `planets.json` con valores reales NASA JPL J2000,
   - implementación concreta del shader (GLSL completo con licencia y origen),
   - `useGpuCapability` (criterios de detección y benchmarks),
   - máquina de estados del tour,
   - estructura de keys i18next final.
3. **`sdd-tasks`**: descomponer en tareas atómicas TDD-driven (test fail → impl → green → refactor).

Áreas que solicitan refinamiento explícito en spec/design:

- **Constantes de escala** (`R_VISUAL_BASE`, `D_VISUAL_LOG_K`, etc.): los valores propuestos son punto de partida; el design debe validarlos visualmente.
- **Detección de GPU capability**: criterios concretos del benchmark inicial y umbrales `low/mid/high`.
- **Duración exacta del tour por nivel**: validar con docente real si es posible.
