# Tasks: Solar System MVP

**Cambio:** `solar-system-mvp`
**Fecha:** 2026-05-06
**Estado:** Desglose de tareas
**Autor:** sdd-tasks (sub-agente)
**Basado en:** `proposal.md`, `design.md`, 14 specs (73 REQs, ~150 escenarios)

> Cada feature funcional sigue el ciclo **RED → GREEN → REFACTOR** (Strict TDD). Los pasos
> marcados `(TEST)` se completan primero y deben fallar. Los marcados `(IMPL)` los hacen pasar.
> Los marcados `(REFACTOR)` limpian sin romper tests. Para componentes R3F puramente visuales,
> el test es un mock-render o snapshot; la estrategia se indica explícitamente.

---

## Phase 1: Infraestructura y datos

> Objetivo: schema TypeScript, datos numéricos reales, funciones puras de escala y cálculo orbital,
> detección de GPU, extensión del store. Sin React ni Three.js todavía — TDD puro.

- [x] 1.1 Crear `src/scenes/data/types.ts` con interfaces `PlanetData`, `AsteroidBeltConfig` y `SolarSystemDataset` extraídas del design §2. Incluir el tipo unión `PlanetId` y `Classification`.
- [x] 1.2 (TEST) `tests/unit/scenes/data/types.test.ts` — parsear un fixture mínimo (sólo Mercury) con Zod; assertions de que todos los campos obligatorios están presentes y tienen el tipo correcto. _Esperar: test falla porque los tipos no existen aún._
- [x] 1.3 (IMPL) Crear `public/data/planets.json` con los 9 bloques completos del design §2 (valores NASA JPL J2000 + Fact Sheets): Mercury, Venus, Earth, Mars, Jupiter, Saturn (con `rings`), Uranus, Neptune, Pluto. Incluir `asteroid_belt`.
- [x] 1.4 (TEST) `tests/unit/scenes/data/planets.test.ts` — importar `planets.json` y validar con Zod contra `SolarSystemDataset`. Assertions: 9 planetas, Plutón con `classification = 'dwarf_planet'`, Saturno con `has_rings = true`, `asteroid_belt.count_high = 2000`. Verificar que no existe ninguna clave `description`, `name_es` ni `iau_note`. _Esperar: falla hasta que el JSON esté completo y los tipos correctos._
- [x] 1.5 (REFACTOR) Revisar que `types.ts` usa `readonly` donde aplica; asegurar que Zod schema y TypeScript interface son la misma fuente de verdad (inferir tipo del schema Zod con `z.infer`).
- [x] 1.6 (TEST) `tests/unit/scenes/scale.test.ts` — assertions de funciones puras de escala: `visualRadius(2439.7)` ≈ 1.072; `visualRadius(69911)` ≈ 3.976; `visualDistance(0.387098)` ≈ 8.777; `visualDistance(1.0)` ≈ 13.000; `visualDistance(30.07)` ≈ 44.660; propiedad monótonamente creciente para AU creciente. _Esperar: fallan porque `scale.ts` no existe._
- [x] 1.7 (IMPL) `src/scenes/scale.ts` — exportar `visualRadius`, `visualDistance`, `SUN_VISUAL_RADIUS`, `R_VISUAL_BASE`, `R_VISUAL_LOG_K`, `D_VISUAL_BASE`, `D_VISUAL_LOG_K` con los valores exactos del design §3.
- [x] 1.8 (REFACTOR) Añadir JSDoc con tabla de valores validados (Mercury → Pluto) como referencia; exportar constantes como `const enum` para tree-shaking.
- [x] 1.9 (TEST) `tests/unit/scenes/orbital.test.ts` — funciones puras: `solveKeplerNewtonRaphson(1.234, 0)` ≈ 1.234 (circular); Mercury `e=0.2056` converge en ≤8 iter con error <1e-6; Pluto `e=0.2488` converge; `applyOrbitalRotation` con inclinación 0 produce Y≈0; con inclinación 90° en ν=π/2 produce Y≈1. _Esperar: fallan._
- [x] 1.10 (IMPL) `src/scenes/orbital.ts` — exportar `solveKeplerNewtonRaphson`, `applyOrbitalRotation`, `degToRad`, constantes de simulación temporal (`SPEEDUP_EXPLORADOR=30`, `SPEEDUP_APRENDIZ=10`, `SPEEDUP_INVESTIGADOR=5`).
- [x] 1.11 (TEST) `tests/unit/scenes/useGpuCapability.test.ts` — mock de `sessionStorage`, `navigator.gpu`, `WEBGL_debug_renderer_info`. Assertions: cache hit retorna sin benchmark; renderer "SwiftShader" → `'low'`; renderer "NVIDIA GeForce RTX" → `'high'`; sin extensión → ejecuta benchmark; resultado guardado en `sessionStorage`. _Esperar: fallan._
- [x] 1.12 (IMPL) `src/scenes/hooks/useGpuCapability.ts` — `detectGpuCapability()` async con tabla de keywords del design §6.1, benchmark de 200 ms como fallback, cache en `sessionStorage`. Hook `useGpuCapability()` con `useState` + `useEffect`. Exportar `GpuCapability` type.
- [x] 1.13 (TEST) `tests/unit/store/useAppStore.test.ts` — extender los tests existentes con los 6 nuevos campos: `selectedPlanet`, `cameraMode`, `textureQuality`, `tourActive`, `prefersReducedMotion`, `sunShaderVariant`. Assertions de valores iniciales y acciones setter. _Esperar: fallan si el store no tiene los campos._
- [x] 1.14 (IMPL) Extender `src/store/useAppStore.ts` con los 6 nuevos campos y sus setters: `setSelectedPlanet`, `setCameraMode`, `setTextureQuality`, `setTourActive`, `setPrefersReducedMotion`, `setSunShaderVariant`.
- [x] 1.15 (REFACTOR) Asegurar que el store no tiene dependencias circulares; verificar que `pnpm test:unit` sigue en verde.

---

## Phase 2: i18n y datos textuales

> Objetivo: namespace `solar` en ES y EN completo, registrado en i18next, con tests de keys.

- [x] 2.1 (TEST) `tests/unit/i18n/solar.test.ts` — cargar los dos JSON directamente (sin inicializar i18next completo): verificar que `es/solar.json` y `en/solar.json` tienen las mismas keys raíz; que `pluto.iau_note.explorador`, `pluto.iau_note.aprendiz`, `pluto.iau_note.investigador` existen en ambos; que `ui.scale_note` existe; que para los 10 cuerpos (sol + 9 planetas) existen las keys `{cuerpo}.name`, `{cuerpo}.explorador.description`, `{cuerpo}.aprendiz.description`, `{cuerpo}.investigador.description`. _Esperar: fallan porque los ficheros no existen._
- [x] 2.2 (IMPL) Crear `src/i18n/locales/es/solar.json` con el contenido completo del design §9.1 — UI keys, 10 cuerpos × 3 niveles, notas IAU de Plutón (3 variantes), `curiosity` por cuerpo.
- [x] 2.3 (IMPL) Crear `src/i18n/locales/en/solar.json` con el contenido completo del design §9.2 — misma estructura en inglés.
- [x] 2.4 (IMPL) Modificar `src/i18n/index.ts` para registrar el namespace `solar` con import estático de ambos JSON. Verificar que NO se usa `i18next-http-backend` para este namespace.
- [x] 2.5 (REFACTOR) Ejecutar `pnpm test:unit` y confirmar que todos los tests de `solar.test.ts` pasan. Verificar con `i18n.t('solar:mercury.name')` que retorna "Mercurio" en locale ES.

---

## Phase 3: Shader del Sol y componente Sun

> Objetivo: shaders GLSL completos, componente `<Sun>` con tres variantes, tests con mock R3F.
> Estrategia de test R3F: `@testing-library/react` + `react-three/test-utils` o mock manual de `useThree`/`useFrame`.

- [ ] 3.1 Crear `src/scenes/shaders/sun.vert` con el vertex shader passthrough del design §5.1 (expone `vNormal`, `vWorldPos`, `vUv`). Sin modificación de geometría.
- [ ] 3.2 Crear `src/scenes/shaders/sun.frag` con el fragment shader completo del design §5.2 — incluye simplex noise Ashima Arts (MIT), gradiente radial, granulación, flujo radial, sunspots condicionales.
- [ ] 3.3 Crear `src/scenes/shaders/sun.lite.frag` con la versión lite del design §5.3 — sólo capa 1 de granulación, sin sunspots.
- [ ] 3.4 (TEST) `tests/unit/scenes/Sun.test.tsx` — montar `<Sun capability="mid" reducedMotion={false} />` con mock de `useThree`/`useFrame`; assertar que el mesh tiene `ShaderMaterial`; montar con `capability="low"` y assertar `MeshStandardMaterial`. Assertar que `uFlowSpeed` es ≤20% del nominal cuando `reducedMotion={true}`. _Esperar: fallan porque `Sun.tsx` no existe._
- [ ] 3.5 (IMPL) `src/scenes/components/Sun.tsx` — importa los shaders con `?raw` (Vite), monta esfera (`SphereGeometry(SUN_VISUAL_RADIUS, 64, 64)`), `ShaderMaterial` en GPU mid/high con los uniforms del design §5.1, `MeshStandardMaterial` + textura en GPU low; `useFrame` actualiza `uTime`; respeta `reducedMotion` reduciendo `uFlowSpeed` un 80%.
- [ ] 3.6 (REFACTOR) Extraer uniforms a constante tipada `SunUniforms`; asegurar que el component no produce re-renders innecesarios con `React.memo`.

---

## Phase 4: Planetas, Luna, Saturno y cinturón

> Objetivo: componentes de cuerpos celestes. Estrategia de test: mock-render básico con `@react-three/test-renderer` o equivalente, assertions sobre props de mesh.

- [ ] 4.1 (TEST) `tests/unit/scenes/usePlanetPosition.test.ts` — crear helper `computeAt(planet, level, tDays)` que simula `elapsed` sin React. Assertions: Earth nivel Explorador t=0 tiene Y=0 y módulo (x,z) ≈ visualDistance(1.0); Mars nivel Explorador t=orbital_period completa la vuelta; Mercury nivel Aprendiz en t=period/4 satisface ecuación de elipse; Mercury nivel Investigador con inclinación produce Y≠0; `solveKeplerNewtonRaphson` ya testeada en 1.9. _Esperar: fallan porque hook no existe aún._
- [ ] 4.2 (IMPL) `src/scenes/hooks/usePlanetPosition.ts` — implementar los tres modelos del design §4.2 usando `useFrame` + `useRef`; memoizar derivados con `useMemo`; importar `solveKeplerNewtonRaphson`, `applyOrbitalRotation`, `visualDistance` de sus módulos.
- [ ] 4.3 (TEST) `tests/unit/scenes/useOrbitPath.test.ts` — nivel Explorador Earth: 128 puntos, todos con Y=0, todos con módulo ≈ visualDistance(1.0); nivel Aprendiz Mercury: puntos forman elipse (max/min radio difieren); el primer y último punto son iguales. _Esperar: fallan._
- [ ] 4.4 (IMPL) `src/scenes/hooks/useOrbitPath.ts` — genera array de `THREE.Vector3` para un periodo completo; segmentos configurables (default 128); respeta el modelo del nivel activo.
- [ ] 4.5 (TEST) `tests/unit/scenes/Planet.test.tsx` — mock-render `<Planet planet={earthData} level="aprendiz" />`: assertar que existe un mesh con textura asignada; assertar que el label visible contiene el nombre; assertar que en `variant="dwarf"` el estilo de label es distinto. _Estrategia: snapshot del grafo de escena._
- [ ] 4.6 (IMPL) `src/scenes/components/Planet.tsx` — `SphereGeometry(visualRadius(planet.radius_km), segments)`, `MeshStandardMaterial` con `useTexture` (Drei); `<Html>` de Drei para label; LOD con `<Lod>` de Drei (baja resolución cuando >50 unidades de cámara); `onClick` → `setSelectedPlanet`.
- [ ] 4.7 (IMPL) `src/scenes/components/OrbitPath.tsx` — `<Line>` de Drei con los puntos de `useOrbitPath`; visible/invisible según nivel (oculto en Explorador si se decide, configurable).
- [ ] 4.8 (IMPL) `src/scenes/components/PlanetMoon.tsx` — órbita simplificada alrededor de la Tierra (radio ~0.8 unidades, periodo 27.3 días); `SphereGeometry(0.27, 16, 16)` + textura `moon/2k.jpg`.
- [ ] 4.9 (IMPL) `src/scenes/components/Saturn.tsx` — extiende `<Planet>` añadiendo `<RingGeometry>` con `innerRadius` y `outerRadius` de `planet.rings`; material con `alphaMap` de `saturn-rings/2k.png`; `side={THREE.DoubleSide}`.
- [ ] 4.10 (TEST) `tests/unit/scenes/AsteroidBelt.test.tsx` — mock `useGpuCapability` → `'high'`, assertar `instancedMesh.count = 2000`; mock → `'low'`, assertar `count = 500`; assertar que `geometry` es `IcosahedronGeometry` con `detail = 0`; assertar que todas las posiciones de instancias están entre `visualDistance(2.2)` y `visualDistance(3.2)`. _Esperar: fallan._
- [ ] 4.11 (IMPL) `src/scenes/components/AsteroidBelt.tsx` — `<instancedMesh>` con `IcosahedronGeometry(0, 0)`, `MeshStandardMaterial({color: '#8a8a8a'})`; distribución log-normal en radio, uniforme en ángulo, gaussiana en Y; tamaños entre `size_min` y `size_max`; rotaciones aleatorias por instancia; count adaptado a `useGpuCapability()`.
- [ ] 4.12 (REFACTOR) Unificar constantes de semilla aleatoria para posiciones del cinturón en una constante exportable (facilita tests deterministas); asegurar que `instancedMesh` tiene `name="asteroid-belt"`.

---

## Phase 5: Cámara y navegación

- [ ] 5.1 (TEST) `tests/unit/hooks/useFocusCamera.test.ts` — mock de `useThree` con camera/controls; assertar que al cambiar `target`, `api.start` es invocado con la posición correcta; assertar que al `target=null` la cámara vuelve a `[0, 35, 70]`; assertar que `durationMs=300` cuando `reducedMotion=true`. _Esperar: fallan._
- [ ] 5.2 (IMPL) `src/scenes/hooks/useFocusCamera.ts` — implementar el design §8: `useSpring` de `@react-spring/three`, `onChange` actualiza `camera.position` y `controls.target`, `aborted.current` previene escritura tras unmount; respeta `prefersReducedMotion` → `durationMs=300`.
- [ ] 5.3 (TEST) `tests/unit/scenes/CameraController.test.tsx` — mock `useFocusCamera`; assertar que Tab key emitida sobre el canvas mueve `selectedBody` al siguiente en orden; que Shift+Tab retrocede; que Escape llama a `setSelectedPlanet(null)`; que T alterna `tourActive`. _Estrategia: JSDOM + eventos de teclado simulados._
- [ ] 5.4 (IMPL) `src/scenes/components/CameraController.tsx` — integra `<OrbitControls>` de Drei; escucha `keydown` en `window`; implementa lógica Tab/Shift+Tab (array ordenado Sol→Plutón), Enter/Space (focus cámara), Escape (vista general), T (toggle tour); delega animación a `useFocusCamera`; integra `<A11yLiveRegion>` anunciando el cuerpo enfocado.
- [ ] 5.5 (REFACTOR) Extraer el array de cuerpos ordenado a una constante `CELESTIAL_ORDER` en `data/types.ts`; asegurar que `CameraController` no tiene lógica duplicada con `useTour`.

---

## Phase 6: Tour automático y voz

- [ ] 6.1 (TEST) `tests/unit/hooks/useTour.test.ts` — testear el reducer directamente: `idle + start → focus_planet(0)`; `focus_planet + tween_done → narration`; `narration + tts_done → next_planet`; `next_planet + user_interrupt → idle`; `next_planet (último) + last_planet_done → idle`; testear el ciclo completo hasta Plutón (10 cuerpos, 10 iteraciones). _Esperar: fallan._
- [ ] 6.2 (IMPL) `src/scenes/hooks/useTour.ts` — reducer del design §7.3 (60 líneas); tipo `TourState`/`TourEvent`; duraciones por nivel del design §7.4; `useRef<AbortController>` para cancelar tweens y TTS; lógica de `prefers-reduced-motion` → avance manual.
- [ ] 6.3 (TEST) `tests/unit/voice/speakName.test.ts` — mock de `window.speechSynthesis`; assertar que `speakName('Marte', 'es-ES')` invoca `speak` con `text='Marte'` y `lang='es-ES'`; assertar que click en segundo planeta invoca `cancel()` antes de `speak`; assertar que cuando `speechSynthesis` es `undefined` no se lanza excepción; verificar que el fichero tiene ≤15 líneas. _Esperar: fallan._
- [ ] 6.4 (IMPL) `src/voice/speakName.ts` — implementación de 5-15 líneas usando Web Speech API nativa; `cancel()` antes de `speak()`; guarda comprobación de soporte con `if (!window.speechSynthesis) return`.
- [ ] 6.5 (IMPL) `src/components/ui/TourControls.tsx` — botones "Iniciar tour", "Pausar tour", "Saltar tour", "Siguiente" (visible sólo con `reducedMotion`); usa las keys `solar:ui.tour.*`; visibilidad condicionada al estado del tour; contraste WCAG AA.
- [ ] 6.6 (REFACTOR) Asegurar que `useTour` y `speakName` no tienen acoplamiento directo (TTS se invoca desde el componente que observa el estado `narration`, no desde el reducer).

---

## Phase 7: HUD y niveles pedagógicos

- [ ] 7.1 (TEST) `tests/unit/components/LevelSelector.test.tsx` — renderizar con nivel `'explorador'`; assertar que el botón "Explorador" tiene aria-pressed=true; hacer click en "Aprendiz"; assertar que `setLevel` fue invocado con `'aprendiz'`. _Esperar: fallan._
- [ ] 7.2 (IMPL) `src/components/ui/LevelSelector.tsx` — tres botones con roles ARIA; usa `solar:ui.level_selector.*`; dispatch a `useAppStore.setLevel`; botones de 44×44 px mínimo (WCAG 2.5.5).
- [ ] 7.3 (TEST) `tests/unit/components/InfoPanel.test.tsx` — renderizar con nivel Explorador + Marte: assertar que NO hay tabla de parámetros orbitales y que la descripción tiene ≤15 palabras; renderizar con nivel Investigador + Júpiter: assertar que existe una tabla con `semi_major_axis_AU` y `eccentricity`; renderizar con Aprendiz + Investigador: assertar presencia del texto `solar:ui.scale_note`. _Esperar: fallan._
- [ ] 7.4 (IMPL) `src/components/ui/InfoPanel.tsx` — panel lateral; variantes de contenido por nivel (pictogramas en Explorador, panel compacto en Aprendiz, tabla científica en Investigador); nota de escala en Aprendiz e Investigador; usa `useTranslation('solar')`.
- [ ] 7.5 (TEST) `tests/unit/components/PlutoNote.test.tsx` — nivel Explorador: assertar texto "Antes era el 9.º planeta" y presencia de un elemento SVG o imagen de pictograma; nivel Aprendiz: assertar texto con "2006" y enlace al modal; nivel Investigador: assertar texto con "Resoluciones 5A y 6A". _Esperar: fallan._
- [ ] 7.6 (IMPL) `src/components/ui/PlutoNote.tsx` — componente condicional (visible sólo cuando `selectedPlanet.id === 'pluto'`); texto via `solar:pluto.iau_note.{level}`; pictograma SVG inline en Explorador; enlace a `<CreditsModal>` en Aprendiz e Investigador.
- [ ] 7.7 (TEST) `tests/unit/components/AttributionFooter.test.tsx` — assertar que el texto "Solar System Scope" es visible y no tiene `display:none` ni `visibility:hidden`; assertar que no hay prop que lo oculte. _Esperar: fallan._
- [ ] 7.8 (IMPL) `src/components/ui/AttributionFooter.tsx` — footer permanente; texto `solar:ui.attribution`; enlace al `<CreditsModal>`; sin posibilidad de ocultación por usuario.
- [ ] 7.9 (IMPL) `src/components/ui/CreditsModal.tsx` — modal accesible (focus-trap, Escape para cerrar, foco de retorno); secciones: Solar System Scope (CC BY 4.0), NASA JPL Horizons (dominio público), NASA Fact Sheets, IAU 2006 Resoluciones 5A y 6A, código (AGPL-3.0), textos (CC BY-SA 4.0). Cargado lazy (`React.lazy`) en demanda.
- [ ] 7.10 (IMPL) `src/components/ui/LoadingScreen.tsx` — usa `useProgress()` de Drei; barra de progreso de 0 a 100 con porcentaje visible; estilos Tailwind.
- [ ] 7.11 (REFACTOR) Añadir `<A11yLiveRegion>` (aria-live="polite") al HUD para anunciar cambios de foco a lectores de pantalla; verificar contraste de todos los elementos HUD con herramienta de colour contrast.

---

## Phase 8: Escena principal y App.tsx

- [ ] 8.1 (TEST) `tests/unit/scenes/SolarSystemScene.test.tsx` — mock de todos los componentes hijos (Sun, Planet, Saturn, etc.); assertar que se montan exactamente 9 Planets + 1 Saturn + 1 Sun + 1 AsteroidBelt + 1 PlanetMoon; assertar que el Canvas tiene `dpr={[1,2]}` y `gl={{ powerPreference: 'high-performance' }}`. _Estrategia: snapshot con mocks._
- [ ] 8.2 (IMPL) `src/scenes/SolarSystemScene.tsx` — árbol R3F del design §1.2; importa datos de `planets.json`; distribuye el prop `level` de `useAppStore`; coordina `<CameraController>` con `<Sun>`, `<Planet>`, `<Saturn>`, `<PlanetMoon>`, `<AsteroidBelt>`, `<OrbitPath>`, `<StarField>`.
- [ ] 8.3 (IMPL) Modificar `src/App.tsx` — reemplazar `<EmptyScene />` por `React.lazy(() => import('./scenes/SolarSystemScene'))` envuelto en `<Suspense fallback={<LoadingScreen/>}>`; añadir `ErrorBoundary` que captura fallos del chunk; leer `?legacy=1` de URL y renderizar `<EmptyScene />` como fallback de emergencia.
- [ ] 8.4 (REFACTOR) Verificar que la escena no se desmonta al cambiar de nivel (el `<canvas>` mantiene el mismo nodo DOM); añadir tests de no-remount si no existían en 8.1.

---

## Phase 9: Performance y bundling

- [ ] 9.1 (TEST — verificación manual) Ejecutar `pnpm build` y verificar que en `dist/assets/` existe un fichero `vendor-three-*.js`. Medir con `gzip -k dist/assets/vendor-three-*.js` que es <500 KB gzip. Medir chunk inicial <300 KB gzip.
- [ ] 9.2 (IMPL) Configurar `vite.config.ts` — `build.rollupOptions.output.manualChunks` separando `vendor-three` (three, @react-three/fiber, @react-three/drei, @react-spring/three), `vendor-react` (react, react-dom), `vendor-i18n` (i18next, react-i18next), `app-solar` (src/scenes/).
- [ ] 9.3 (IMPL) Configurar `vite-plugin-pwa` en `vite.config.ts` — `workbox.runtimeCaching` con regla `CacheFirst` para `/textures/*` (cache name: `solar-textures-v1`) y `StaleWhileRevalidate` para `/data/*.json`.
- [ ] 9.4 (REFACTOR) Verificar con `pnpm build && pnpm preview` que Lighthouse Performance ≥85 en localhost; ajustar si es necesario (reducir tamaño texturas 1K para low, reducir segmentos de esferas, etc.).

---

## Phase 10: Texturas y assets

> Tareas no-código de preparación de assets. Deben realizarse antes de los tests E2E.

- [ ] 10.1 (ASSETS) Descargar texturas Solar System Scope para los 11 cuerpos (Sol, 8 planetas, Luna, anillos de Saturno) en resoluciones 1K, 2K y 4K:
  - URL base: https://www.solarsystemscope.com/textures/
  - Formato: `.jpg` para todos excepto anillos de Saturno (`.png` con alpha canal)
  - Estructura destino: `public/textures/{id}/{1k,2k,4k}.jpg` y `public/textures/saturn-rings/{2k,4k}.png`
  - Licencia: CC BY 4.0 — OBLIGATORIO atribuir en UI y CREDITS.md
  - 11 cuerpos: sun, mercury, venus, earth, moon, mars, jupiter, saturn, saturn-rings, uranus, neptune, pluto
- [ ] 10.2 (ASSETS) Optimizar texturas descargadas:
  - `.jpg`: `find public/textures -name "*.jpg" -exec mozcjpeg -quality 85 -outfile {} {} \;` (o `squoosh-cli`)
  - `.png`: `oxipng -o 4 public/textures/saturn-rings/*.png`
  - Verificar que el total de texturas 2K es <20 MB (objetivo primera carga)
- [ ] 10.3 (DOCS) Actualizar `CREDITS.md` en la raíz del repositorio con secciones obligatorias:
  - Solar System Scope (CC BY 4.0, URL, accedido en 2026)
  - NASA JPL Horizons J2000 (dominio público, URL)
  - NASA Planetary Fact Sheets (dominio público, URL)
  - IAU Resoluciones 5A y 6A de 2006 (URL a iau.org)
  - Código: AGPL-3.0
  - Textos pedagógicos: CC BY-SA 4.0
- [ ] 10.4 (VERIFICAR) Confirmar que `<AttributionFooter>` y `<CreditsModal>` muestran la atribución correcta en `pnpm preview`.

---

## Phase 11: Tests E2E

> Playwright. Todos los tests deben pasar en modo producción (`pnpm build && pnpm preview`).

- [ ] 11.1 (TEST E2E) `tests/e2e/solar-system.spec.ts`:
  - Escenario: carga inicial — `<canvas>` presente en DOM; `LoadingScreen` ya no está; progreso llegó a 100.
  - Escenario: click en Júpiter — `InfoPanel` aparece con datos de Júpiter; tween completa en ≤1500 ms.
  - Escenario: cambio de nivel Explorador → Investigador — `<canvas>` es el mismo nodo DOM; tabla de parámetros orbitales visible; nota de escala visible.
  - Escenario: atribución — locator `text=Solar System Scope` visible en DOM.
  - Escenario: 0 errores de consola durante 60 s de interacción normal.
- [ ] 11.2 (TEST E2E) `tests/e2e/pluto-note.spec.ts`:
  - Seleccionar Plutón en los 3 niveles; assertar texto IAU correspondiente en cada nivel.
  - En Explorador: assertar pictograma visible (elemento img/svg).
  - En Aprendiz: assertar enlace que abre `<CreditsModal>` con texto "5A".
  - Etiqueta "planeta enano" visible en la escena junto a Plutón.
- [ ] 11.3 (TEST E2E) `tests/e2e/accessibility.spec.ts`:
  - Navegación por teclado: Tab × 10 recorre Sol → Plutón; Shift+Tab retrocede; Enter aplica focus; Escape devuelve vista general; T inicia tour.
  - `prefers-reduced-motion`: emular con Playwright (`page.emulateMedia`); assertar que tween de focus completa en ≤300 ms; assertar que botón "Siguiente" es visible durante el tour; assertar que el tour no avanza automáticamente.
  - axe-core: importar `@axe-core/playwright`; assertar 0 violaciones WCAG AA en la página principal.
- [ ] 11.4 (TEST E2E) `tests/e2e/performance.spec.ts`:
  - Ejecutar Lighthouse CI vía `playwright-lighthouse` o equivalente; assertar Performance ≥85.
  - Medir TTI <5000 ms en 4G simulada.
  - Verificar que el chunk inicial descargado NO contiene "three" en su contenido (búsqueda en bundle).
- [ ] 11.5 (TEST E2E) `tests/e2e/pwa-offline.spec.ts`:
  - Primera visita con red: Service Worker instalado; cache `solar-textures-v1` existe.
  - Segunda visita offline (`await context.setOffline(true)`): escena se renderiza; `InfoPanel` funciona; 0 errores de red en consola.
  - Verificar que `planets.json` se sirve desde cache en modo offline.

---

## Phase 12: Cleanup y release

- [ ] 12.1 (AUDIT) Audit de accesibilidad manual con axe DevTools en Chrome en la build de producción. Verificar que no hay violaciones WCAG AA en:
  - HUD con el nivel Explorador activo (botones grandes, contraste)
  - InfoPanel Investigador (tabla científica, contraste de datos)
  - `<CreditsModal>` (foco, escape, retorno de foco)
- [ ] 12.2 (VERIFICAR) Confirmar 0 errores de `console.error` en la build de producción durante: carga inicial, click en cada planeta, tour completo Sol→Plutón, cambio entre los 3 niveles.
- [ ] 12.3 (DOCS) Actualizar `README.md` con:
  - Screenshot o GIF del Sistema Solar renderizado
  - Instrucciones de development (`pnpm install`, `pnpm dev`)
  - Atribución de texturas Solar System Scope (CC BY 4.0) visible en el README
  - Licencias: AGPL-3.0 (código), CC BY-SA 4.0 (textos), CC BY 4.0 (texturas Solar System Scope)
- [ ] 12.4 (RELEASE) Crear tag de release:
  ```bash
  rtk git tag -a v0.1.0-solar-system-mvp -m "feat: Solar System MVP — escena 3D interactiva con 9 cuerpos, 3 niveles pedagógicos, tour narrado y PWA offline"
  rtk git push origin v0.1.0-solar-system-mvp
  ```
- [ ] 12.5 (VERIFICAR) Deploy en Cloudflare Workers (`wrangler deploy`) y verificar Lighthouse Performance ≥85 en https://universo-aula.pedrovicente.workers.dev/.

---

## Mapping REQs → Tareas

| Spec                 | REQ     | Descripción                                | Tarea(s)                |
| -------------------- | ------- | ------------------------------------------ | ----------------------- |
| data-model           | REQ-001 | Schema `PlanetData` completo               | 1.1, 1.2, 1.3, 1.4      |
| data-model           | REQ-002 | Valores orbitales NASA JPL J2000           | 1.3, 1.4                |
| data-model           | REQ-003 | `AsteroidBeltConfig` presente y válida     | 1.3, 1.4                |
| data-model           | REQ-004 | Sin datos textuales en `planets.json`      | 1.4                     |
| data-model           | REQ-005 | Tipos TypeScript en `types.ts`             | 1.1, 1.2                |
| data-model           | REQ-006 | Fuente de datos en `CREDITS.md`            | 10.3                    |
| orbital-mechanics    | REQ-001 | `usePlanetPosition` circular (Explorador)  | 4.1, 4.2                |
| orbital-mechanics    | REQ-002 | `usePlanetPosition` elipse (Aprendiz)      | 4.1, 4.2                |
| orbital-mechanics    | REQ-003 | `usePlanetPosition` Kepler (Investigador)  | 1.9, 1.10, 4.1, 4.2     |
| orbital-mechanics    | REQ-004 | `useOrbitPath` puntos de trayectoria       | 4.3, 4.4                |
| orbital-mechanics    | REQ-005 | Escala didáctica sublogarítmica            | 1.6, 1.7                |
| sun-shader           | REQ-001 | Shader procedural en GPU mid/high          | 3.1, 3.2, 3.4, 3.5      |
| sun-shader           | REQ-002 | Fallback textura en GPU low                | 3.4, 3.5                |
| sun-shader           | REQ-003 | Uniform `uSunspotsEnabled`                 | 3.2, 3.4, 3.5           |
| sun-shader           | REQ-004 | Respeto `prefers-reduced-motion` (Sun)     | 3.4, 3.5                |
| sun-shader           | REQ-005 | Vertex shader passthrough                  | 3.1                     |
| solar-system-scene   | REQ-001 | Lazy loading de la escena                  | 8.3                     |
| solar-system-scene   | REQ-002 | Composición de cuerpos celestes            | 8.1, 8.2, 4.6, 4.8, 4.9 |
| solar-system-scene   | REQ-003 | Fondo de estrellas                         | 8.2                     |
| solar-system-scene   | REQ-004 | Cero errores de consola en producción      | 12.2, 11.1              |
| solar-system-scene   | REQ-005 | Pantalla de carga con progreso             | 7.10                    |
| pedagogical-levels   | REQ-001 | Selector de nivel visible en HUD           | 7.1, 7.2                |
| pedagogical-levels   | REQ-002 | Datos diferenciados por nivel en InfoPanel | 7.3, 7.4                |
| pedagogical-levels   | REQ-003 | Cambio de nivel sin rehacer escena 3D      | 8.3, 8.4                |
| pedagogical-levels   | REQ-004 | Modelo orbital diferenciado por nivel      | 4.1, 4.2, 1.9, 1.10     |
| pedagogical-levels   | REQ-005 | Densidad del HUD por nivel                 | 7.4, 7.11               |
| asteroid-belt        | REQ-001 | Cinturón visible entre Marte y Júpiter     | 4.10, 4.11              |
| asteroid-belt        | REQ-002 | Count adaptado a capacidad GPU             | 4.10, 4.11              |
| asteroid-belt        | REQ-003 | Detección de capacidad GPU                 | 1.11, 1.12              |
| asteroid-belt        | REQ-004 | Geometría y material del cinturón          | 4.11, 4.12              |
| camera-navigation    | REQ-001 | Focus de cámara en planeta ≤1.5 s          | 5.1, 5.2                |
| camera-navigation    | REQ-002 | OrbitControls siempre activo               | 5.4                     |
| camera-navigation    | REQ-003 | Tab/Shift+Tab — navegación por teclado     | 5.3, 5.4                |
| camera-navigation    | REQ-004 | Enter/Space/Escape                         | 5.3, 5.4                |
| camera-navigation    | REQ-005 | Tecla T — inicio/parada del tour           | 5.3, 5.4                |
| camera-navigation    | REQ-006 | Respeto `prefers-reduced-motion` (cámara)  | 5.1, 5.2, 11.3          |
| tour-automatic       | REQ-001 | Máquina de estados del tour                | 6.1, 6.2                |
| tour-automatic       | REQ-002 | Duración de parada por nivel pedagógico    | 6.1, 6.2                |
| tour-automatic       | REQ-003 | Narración por nivel                        | 6.2, 6.3, 6.4           |
| tour-automatic       | REQ-004 | Respeto `prefers-reduced-motion` (tour)    | 6.2, 11.3               |
| tour-automatic       | REQ-005 | Controles de tour siempre visibles         | 6.5                     |
| voice-tts            | REQ-001 | TTS al hacer click en nivel Explorador     | 6.3, 6.4                |
| voice-tts            | REQ-002 | Cancelación de utterance anterior          | 6.3, 6.4                |
| voice-tts            | REQ-003 | Cero bytes de bundle adicional             | 6.4                     |
| voice-tts            | REQ-004 | Graceful degradation sin TTS               | 6.3, 6.4                |
| voice-tts            | REQ-005 | Pronunciación correcta del Sol             | 6.3, 6.4                |
| pluto-iau-note       | REQ-001 | Nota IAU visible al seleccionar Plutón     | 7.5, 7.6                |
| pluto-iau-note       | REQ-002 | Nota adaptada al cambiar nivel             | 7.5, 7.6                |
| pluto-iau-note       | REQ-003 | Etiqueta diferenciada de Plutón            | 4.5, 4.6                |
| pluto-iau-note       | REQ-004 | Enlace a modal resoluciones IAU            | 7.6, 7.9                |
| pluto-iau-note       | REQ-005 | Tests E2E de Plutón                        | 11.2                    |
| attribution          | REQ-001 | Footer de atribución siempre visible       | 7.7, 7.8                |
| attribution          | REQ-002 | Test E2E verifica atribución               | 11.1                    |
| attribution          | REQ-003 | Modal de créditos accesible                | 7.9                     |
| attribution          | REQ-004 | Atribución en `CREDITS.md`                 | 10.3                    |
| attribution          | REQ-005 | Licencias diferenciadas en modal           | 7.9                     |
| performance-bundling | REQ-001 | Bundle inicial <300 KB gzip                | 9.1, 9.2                |
| performance-bundling | REQ-002 | vendor-three <500 KB, app-solar <200 KB    | 9.1, 9.2                |
| performance-bundling | REQ-003 | Carga <5 s en 4G simulada                  | 9.4, 11.4               |
| performance-bundling | REQ-004 | Lighthouse Performance ≥85                 | 9.4, 11.4, 12.5         |
| performance-bundling | REQ-005 | Assets primera carga <20 MB                | 10.2, 9.4               |
| performance-bundling | REQ-006 | `manualChunks` en `vite.config.ts`         | 9.2                     |
| performance-bundling | REQ-007 | Memoria GPU pico <150 MB                   | 9.4                     |
| pwa-caching          | REQ-001 | CacheFirst para texturas                   | 9.3, 11.5               |
| pwa-caching          | REQ-002 | StaleWhileRevalidate para JSON             | 9.3, 11.5               |
| pwa-caching          | REQ-003 | PWA offline funcional                      | 11.5                    |
| pwa-caching          | REQ-004 | Invalidación de caché por versión          | 9.3                     |
| pwa-caching          | REQ-005 | Configuración en `vite.config.ts`          | 9.3                     |
| i18n-solar           | REQ-001 | Ficheros namespace `solar` ES + EN         | 2.1, 2.2, 2.3, 2.4      |
| i18n-solar           | REQ-002 | Keys de UI generales                       | 2.1, 2.2, 2.3           |
| i18n-solar           | REQ-003 | Keys de cuerpos celestes a tres niveles    | 2.1, 2.2, 2.3           |
| i18n-solar           | REQ-004 | Keys nota IAU Plutón por nivel             | 2.1, 2.2, 2.3           |
| i18n-solar           | REQ-005 | Sin `i18next-http-backend` en MVP          | 2.4                     |

**Total REQs cubiertos: 73 / 73**

---

## Resumen de contadores

| Phase                                 | Tareas |
| ------------------------------------- | ------ |
| 1 — Infraestructura y datos           | 15     |
| 2 — i18n y datos textuales            | 5      |
| 3 — Shader del Sol y Sun              | 6      |
| 4 — Planetas, Luna, Saturno, cinturón | 12     |
| 5 — Cámara y navegación               | 5      |
| 6 — Tour automático y voz             | 6      |
| 7 — HUD y niveles pedagógicos         | 11     |
| 8 — Escena principal y App.tsx        | 4      |
| 9 — Performance y bundling            | 4      |
| 10 — Texturas y assets                | 4      |
| 11 — Tests E2E                        | 5      |
| 12 — Cleanup y release                | 5      |
| **TOTAL**                             | **82** |
