# Exploración: Solar System MVP

**Cambio:** `solar-system-mvp`
**Fecha:** 2026-05-06
**Estado:** Exploración completada
**Autor:** sdd-explore (sub-agente)

---

## Contexto

Universo Aula es una aplicación web educativa 3D con stack Vite 7 + React 19 + TypeScript 6 + Tailwind 4 + React Three Fiber 9 + Drei 10 + Zustand 5 + i18next + vite-plugin-pwa. Despliegue en Cloudflare Workers como activos estáticos (no backend). Licencia AGPL-3.0 (código) y CC BY-SA 4.0 (contenido). Sin analíticas. RGPD by design.

El proyecto tiene actualmente:

- `EmptyScene.tsx`: Canvas R3F básico con `OrbitControls` y una caja gris de placeholder
- `useAppStore.ts`: Zustand con `level: PedagogicalLevel` ('explorador' | 'aprendiz' | 'investigador') y `locale`
- `PedagogicalLevel` type ya definido en `/src/types/index.ts`
- i18n con ES + EN (MVP), estructura preparada para 28 locales
- Strict TDD activo (Vitest 4.1.5 + Playwright 1.59.1), 12 tests pasando
- Bundle actual: ~193 KB JS (un solo chunk — ya necesita code-splitting)
- PWA con Workbox, tamaño máximo de caché 5 MB

El objetivo del Solar System MVP es mostrar el Sistema Solar completo (Sol + Mercurio → Neptuno), navegable e instructivo, con los 3 niveles pedagógicos adaptando la complejidad de la información mostrada.

---

## Área 1: Datos Científicos — Fuentes y Licencias

### Fuentes disponibles

| Fuente                           | Tipo de datos                                               | Licencia                                | Formato                    |
| -------------------------------- | ----------------------------------------------------------- | --------------------------------------- | -------------------------- |
| **NASA JPL Horizons**            | Efemérides, parámetros orbitales (a, e, i, Ω, ω, M), radios | Dominio público (NASA/US Gov)           | API HTTP / exportación CSV |
| **NASA Image and Video Library** | Imágenes planetarias                                        | Dominio público (salvo crédito artista) | JPEG/PNG                   |
| **Solar System Scope Textures**  | Texturas UV de planetas, Sol, lunas                         | CC BY 4.0 — atribución obligatoria      | JPG 2K/4K/8K               |
| **IAU Minor Planet Center**      | Nomenclatura oficial, lunas                                 | Citar IAU MPC                           | HTML/CSV                   |
| **NASA Planetary Fact Sheets**   | Masa, radio, densidad, gravedad, lunas, atmósfera           | Dominio público                         | HTML (scraping manual)     |

### Análisis: JSON estático vs fetch en runtime

**Decisión recomendada: JSON estático bundled en `/public/data/`**

Razones:

1. **RGPD**: Sin fetch externo en runtime, sin DNS leak, sin cookies de terceros
2. **PWA offline**: El SW puede cachear los JSON estáticos; fetch a JPL en runtime rompería el modo offline
3. **Performance**: Un `import()` dinámico o `fetch('/data/planets.json')` desde CDN propio es <1ms frente al RTT de JPL (200-800ms)
4. **Determinismo**: Los datos no cambian entre sesiones de estudiantes; Plutón no va a recuperar su estatus de planeta entre recreos
5. **Bundle**: Los datos JSON de los 9 cuerpos (~50 KB) son triviales frente al bundle Three.js

**Estructura sugerida:**

```
/public/data/
  planets.json          ← parámetros orbitales + datos físicos (todos los niveles)
  planets.es.json       ← nombres y descripciones en ES por nivel
  planets.en.json       ← nombres y descripciones en EN por nivel
```

**Alternativa descartada: JPL Horizons API en runtime**

- Viola RGPD by design (request a servidor externo)
- Añade latencia y punto de fallo
- Innecesario: los datos orbitales son suficientemente estables para MVP

---

## Área 2: Renderizado 3D — Escala, Órbitas, LOD, Texturas

### 2.1 Escala: lineal vs logarítmica vs didáctica

| Estrategia                  | Descripción                                                                                                                  | Pros                                             | Contras                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| **Lineal real**             | Distancias y radios proporcionales a realidad                                                                                | Científicamente precisa                          | El Sol ocupa el 99% de la pantalla; los planetas son píxeles invisibles |
| **Logarítmica**             | `log10(distancia_real)` normalizado                                                                                          | Compresión suave, visualmente coherente          | Escala no intuitiva para niños; difícil explicar                        |
| **Didáctica (recomendada)** | Distancias y radios con curvas de escala independientes, diseñadas para que todos los planetas sean visibles y distinguibles | Pedagógicamente superior; visualmente impactante | No refleja proporciones reales; hay que anotarlo en UI                  |

**Recomendación: escala didáctica con modo "escala real" diferida al post-MVP investigador**

Los radios se escalan con una curva sublogarítmica (ej. `r_visual = C * log2(r_real + 1)`) y las distancias con otra curva diferente, garantizando que Mercurio no sea invisible junto a Júpiter. El texto puede aclarar "las distancias no están a escala real".

### 2.2 Órbitas: Keplerianas vs circulares por nivel

| Estrategia                  | Nivel pedagógico | Precisión | Complejidad                                           |
| --------------------------- | ---------------- | --------- | ----------------------------------------------------- |
| **Circulares**              | Explorador       | Baja      | Trivial: `sin/cos(θ * t)`                             |
| **Elípticas simplificadas** | Aprendiz         | Media     | Ecuación de la elipse, sin corrección de tiempo       |
| **Keplerianas reales**      | Investigador     | Alta      | Ecuación de Kepler (iterativa), posición real fechada |

**Recomendación: Progresión por nivel**

- **Explorador**: órbitas circulares, velocidad angular uniforme, animación continua
- **Aprendiz**: elipses con parámetro `e` real de JPL, pero sin calcular posición real por fecha
- **Investigador**: Kepler completo con `M`, `E` (anomalía excéntrica, Newton-Raphson), posición real

Esta progresión también sirve como herramienta didáctica: el Investigador puede ver que la órbita real de Mercurio es elipsoidal y entender por qué Copérnico se equivocó con las esferas perfectas.

**Implementación**: La posición orbital se calcula en el hook `usePlanetPosition(planet, level, t)` que devuelve `[x, y, z]` Three.js. Los parámetros orbitales vienen del JSON estático.

### 2.3 LOD (Level of Detail) por distancia

R3F + Drei proveen `<Lod>` (wrapper de `THREE.LOD`). Estrategia:

| Distancia cámara | Geometría                   | Textura           |
| ---------------- | --------------------------- | ----------------- |
| < 10 unidades    | `SphereGeometry(1, 64, 64)` | 4K                |
| 10–50 unidades   | `SphereGeometry(1, 32, 32)` | 2K                |
| > 50 unidades    | `SphereGeometry(1, 16, 16)` | 1K o color sólido |

El Sol y los planetas grandes (Júpiter, Saturno) merecen más segmentos. Neptuno en posición lejana puede ser una esfera de 8 segmentos con color sólido azul.

**Importante para SMART Board**: Las resoluciones SMART Board MX/RX son 4K (3840×2160) y los paneles IPS tienen gamut sRGB amplio. Las texturas 4K se verán bien. El presupuesto de memoria GPU es ~2 GB (sistema compartido). Total texturas 2K × 10 cuerpos ≈ 80 MB GPU. Manejable con descarga bajo demanda.

### 2.4 Texturas: peso vs calidad

| Resolución | Peso estimado (JPG 85%)    | Uso recomendado                   |
| ---------- | -------------------------- | --------------------------------- |
| 8K         | ~8-15 MB por planeta       | Excesivo para MVP; diferir        |
| 4K         | ~3-6 MB por planeta        | SMART Board; lazy-load al enfocar |
| 2K         | ~800 KB - 2 MB por planeta | Carga inicial + tablets           |
| 1K         | ~200-500 KB por planeta    | Fallback / conexión lenta         |

**Estrategia recomendada:**

- Carga inicial: texturas 2K (placeholder de color mientras cargan)
- Al enfocar un planeta (click): lazy-load textura 4K
- SMART Board detectado (media query `min-width: 3000px` o UA hint): preferir 4K desde inicio

**Fuente: Solar System Scope (CC BY 4.0)**. Las texturas están en el CREDITS.md del proyecto. Se requiere atribución visible en la UI. Ya está documentado. Descargable en https://www.solarsystemscope.com/textures/ sin registro.

### 2.5 Anillos de Saturno

Opciones:

1. **Malla con textura alpha** (recomendada): `RingGeometry` + `MeshBasicMaterial` con `map` y `alphaMap`, `transparent: true`, `side: THREE.DoubleSide`. La textura de anillo de Solar System Scope incluye canal alpha.
2. **Shader custom**: Más control (gradientes, partículas), mayor complejidad, riesgo de rendimiento en tablets
3. **Impostor 2D billboard**: Plano orientado a cámara; no funciona con órbita libre

**Recomendación: malla con textura alpha**. Es el patrón estándar en R3F y ya funciona con las texturas CC BY 4.0 de Solar System Scope.

---

## Área 3: Performance y Bundle

### 3.1 Estado actual del bundle

- Bundle actual: ~193 KB JS (un solo chunk `index-DB6N42Cf.js`)
- Three.js + R3F ya están como dependencias declaradas pero el bundle es pequeño → probablemente tree-shaken parcialmente porque la escena no usa mucho todavía
- **Con el Sistema Solar completo: estimación ~800 KB - 1.2 MB JS** (Three.js ~500 KB, R3F ~180 KB, Drei selectivos ~80 KB, lógica propia ~100-200 KB)

### 3.2 Code-splitting R3F

**Patrón recomendado: lazy Canvas**

```tsx
// src/scenes/SolarSystemScene.tsx — lazy import
const SolarSystemScene = lazy(() => import('@/scenes/SolarSystemScene'));

// En App.tsx:
<Suspense fallback={<LoadingScreen />}>
  <SolarSystemScene />
</Suspense>;
```

Esto separa Three.js + R3F en un chunk diferente (`solar-system-HASH.js`) que solo se carga cuando el Canvas se monta. El tiempo hasta first paint del HUD mejora.

**Vite code-splitting**: configurar `build.rollupOptions.output.manualChunks`:

- `vendor-three`: `three`, `@react-three/fiber`, `@react-three/drei`
- `vendor-react`: `react`, `react-dom`
- `vendor-i18n`: `i18next`, `react-i18next`
- `app-solar`: código del Sistema Solar

### 3.3 Texturas bajo demanda

**Patrón useTexture de Drei**: `useTexture` con Suspense carga texturas asíncronamente. Combinar con `<Suspense fallback={<MeshBasicMaterial color={planetColor} />}>` para mostrar color sólido mientras carga la textura.

```tsx
function PlanetMesh({ planet }: { planet: Planet }) {
  const texture = useTexture(`/textures/${planet.id}/2k.jpg`);
  return <meshStandardMaterial map={texture} />;
}
```

Las texturas se sirven desde `/public/textures/` y Workbox las cachea con `CacheFirst` strategy en el SW.

### 3.4 Loader visual

**Estimación de primera carga:**

- JS bundle (sin texturas): ~1.2 MB → ~300ms en 4G, ~50ms en WiFi
- Texturas 2K × 10 cuerpos: ~15 MB → ~3.5s en 4G, ~600ms en WiFi
- **Total primera visita: 3-5 segundos en 4G**

**Estrategia de loader:**

1. Pantalla de carga con logo + barra de progreso R3F (`useProgress` de Drei)
2. El Sol se renderiza primero (más cercano, más visible)
3. Los planetas exteriores (Urano, Neptuno) pueden mostrar color sólido hasta que se enfoquen
4. SW cachea todo para visitas sucesivas (offline-first)

### 3.5 SW cache strategy

```js
// workbox en vite.config.ts
runtimeCaching: [
  {
    urlPattern: /\/textures\/.+\.(jpg|png|webp)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'solar-textures-v1',
      expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /\/data\/.+\.json$/,
    handler: 'StaleWhileRevalidate',
    options: { cacheName: 'solar-data-v1' },
  },
];
```

---

## Área 4: UX por Nivel Pedagógico

### 4.1 Modos por nivel

| Elemento        | Explorador (3-6)                                | Aprendiz (6-12)                 | Investigador (12-16+)                                       |
| --------------- | ----------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| **Nombres**     | Solo nombre propio ("Marte"), grande y colorido | Nombre + subtítulo breve        | Nombre + clasificación (planeta terrestre / gigante de gas) |
| **Números**     | Sin números                                     | Distancia (UA), número de lunas | Masa, radio, período orbital, excentricidad, temperatura    |
| **Iconos**      | Pictogramas grandes (emoji o SVG)               | Iconos pequeños con etiqueta    | Tabla de datos                                              |
| **Audio**       | Pronunciación del nombre (Web Speech TTS, MVP)  | Descripción breve leída         | Completo diferido                                           |
| **Órbita**      | Circular, animada, lenta                        | Elíptica, pausable              | Kepler, con fecha real                                      |
| **Lunas**       | Solo la Luna (Tierra)                           | Lunas principales               | Todas las lunas con nombre                                  |
| **Atmósfera**   | "Tiene anillos / no tiene anillos"              | Composición simplificada        | Datos completos de atmósfera                                |
| **Interacción** | Click → centra y narra nombre                   | Click → ficha básica            | Click → ficha completa + exploración libre                  |

### 4.2 Persistencia en useAppStore

El nivel ya está en `useAppStore`. Hay que añadir:

- `selectedPlanet: string | null` — planeta actualmente enfocado
- `cameraMode: 'orbit' | 'free' | 'tour'` — modo de cámara
- `textureQuality: '1k' | '2k' | '4k' | 'auto'` — preferencia de calidad

```ts
// Extensión de AppState
interface AppState {
  level: PedagogicalLevel;
  locale: string;
  selectedPlanet: string | null;
  cameraMode: CameraMode;
  textureQuality: TextureQuality;
  // setters...
}
```

### 4.3 Diseño visual por nivel

- **Explorador**: fondo negro profundo, planetas grandes, fuente sans-serif grande (mínimo 18px), colores saturados, sin ruido visual
- **Aprendiz**: HUD compacto con panel lateral deslizante, colores más suaves, fuente media
- **Investigador**: HUD de múltiples columnas, datos densos, estilo "terminal científico"

El cambio de nivel recarga el panel de información pero NO rehace la escena 3D (solo cambia qué datos se muestran y qué cálculo orbital se usa).

---

## Área 5: Navegación de Cámara

### 5.1 Modos de cámara

| Modo                      | Descripción                                                               | Casos de uso                     |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| **Orbit** (OrbitControls) | El usuario controla la cámara libre alrededor de un punto de pivote       | Exploración general, defecto     |
| **Focus**                 | Al hacer click en un planeta, la cámara viaja suavemente hasta él (tween) | Todos los niveles al seleccionar |
| **Tour**                  | Secuencia automática: cámara viaja de planeta en planeta con narración    | Explorador preferentemente       |
| **Free-fly**              | Cámara libre WASD + ratón                                                 | Investigador avanzado; post-MVP  |

**Recomendación MVP**: Orbit + Focus. El Tour es muy valioso para Explorador pero puede ser post-MVP o v1.1.

### 5.2 OrbitControls vs custom

**OrbitControls de Drei** es la elección correcta para MVP:

- Táctil (pinch zoom, pan) ya funciona nativo
- Ratón (drag, scroll) funciona nativo
- Pen (SMART Board stylus) funciona porque el navegador reporta eventos pointer
- **Limitación**: El pivote de órbita es fijo; al enfocar un planeta hay que actualizar `target` dinámicamente

**Implementación de Focus**:

```tsx
// gsap o react-spring para tween
const focusPlanet = (planet: Planet) => {
  // Animar camera.position hacia planet.position + offset
  // Animar controls.target hacia planet.position
  // Duración: 1.5s, easing: easeInOut
};
```

**Alternativa descartada**: `CameraControls` de Drei (más potente pero API más compleja; OrbitControls suficiente para MVP).

### 5.3 Soporte táctil / ratón / pen en SMART Board

- SMART Board MX/RX reporta toques como `PointerEvent` con `pointerType: 'touch'` o `'pen'`
- OrbitControls de Three.js ≥ r140 maneja PointerEvents nativamente
- El Canvas de R3F pasa el `eventSource` correcto para SMART Board
- **Recomendación**: probar en SMART Board con Playwright + emulación táctil (Playwright soporta `touchscreen` en sus devices)

### 5.4 Accesibilidad de cámara

- Añadir teclas de teclado: `Tab` para ir al siguiente planeta, `Enter/Space` para enfocar, `Escape` para soltar foco
- Esto también cubre el caso de uso de SMART Board con teclado físico conectado

---

## Área 6: Voz — ¿MVP o diferir?

### Análisis

El proyecto tiene `/src/voice/README.md` que sugiere que la integración de voz (Whisper via transformers.js + Web Speech TTS) está planificada pero vacía.

El bundle estimado de transformers.js + modelo all-MiniLM-L6-v2 es **~50-80 MB**. Añadir eso al Solar System MVP:

1. Aumentaría la primera carga de ~15-17 MB a ~65-95 MB
2. Requeriría un loader específico para el modelo NLP
3. Añadiría complejidad de test significativa

**Mínimo viable de voz para MVP**: Solo pronunciación del nombre del planeta con `window.speechSynthesis` (Web Speech API, zero bundle cost, sin privacidad issues).

```ts
const speakName = (name: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
};
```

Esto es trivial de implementar, no requiere modelos ML, y cubre la necesidad de Explorador (niños de 3-6 escuchan el nombre al hacer click).

**Recomendación: diferir la integración Whisper a `voice-mvp` change separado**. Incluir en el Solar System MVP SOLO el Web Speech TTS para pronunciación de nombres (nivel Explorador). Esto es una sola función de 5 líneas, no un sistema.

---

## Área 7: i18n — Keys vs JSON traducido

### Análisis

El proyecto ya tiene i18next configurado con `common.json` por locale. Para el Sistema Solar, los datos tienen dos naturalezas:

**Datos fijos (no i18n)**: valores numéricos (radio, masa, período), ID del planeta, parámetros orbitales. Estos van en el JSON de datos (`/public/data/planets.json`) y son iguales en todos los idiomas.

**Datos localizables (i18n)**: nombres, descripciones por nivel, curiosidades, etiquetas de UI.

### Opción A: JSON traducido en `/public/data/`

```
/public/data/
  planets.json           ← datos numéricos (neutral)
  planets.es.json        ← nombres + descripciones en ES
  planets.en.json        ← nombres + descripciones en EN
```

**Pros**: Carga bajo demanda por locale; puede crecer sin tocar el bundle  
**Contras**: Dos `fetch` en lugar de uno; más ficheros a mantener

### Opción B: Keys de i18next en el namespace `solar`

```json
// locales/es/solar.json
{
  "mercury": {
    "name": "Mercurio",
    "explorador": "El planeta más cercano al Sol.",
    "aprendiz": "Mercurio tarda 88 días en orbitar el Sol.",
    "investigador": "Mercurio tiene una excentricidad orbital de 0,206..."
  }
}
```

**Pros**: Integra con el sistema i18next existente; `t('mercury.explorador')` es limpio  
**Contras**: El namespace `solar` se carga siempre aunque el usuario no visite el sistema solar; las descripciones largas inflaman el bundle JS

### Recomendación: **Opción B (keys i18next) para el MVP**

La razón es que i18next ya soporta lazy-loading de namespaces (`i18next-http-backend`). El namespace `solar` se puede cargar on-demand cuando el usuario entra a la escena del Sistema Solar. Las traducciones van a `locales/es/solar.json` y `locales/en/solar.json`. Los datos numéricos van a un JSON estático separado.

Para el MVP (solo ES + EN) el peso adicional es despreciable (~10-20 KB por locale). La integración con i18next es más limpia y mantenible que manejar JSONs de datos separados.

**Estructura de keys por nivel**:

```json
{
  "planets.mercury.name": "Mercurio",
  "planets.mercury.explorador.description": "El planeta más pequeño del Sistema Solar.",
  "planets.mercury.aprendiz.description": "Mercurio completa una órbita alrededor del Sol en solo 88 días terrestres.",
  "planets.mercury.investigador.description": "Con una excentricidad orbital de 0,2056, Mercurio tiene la órbita más elíptica..."
}
```

---

## Recomendaciones Consolidadas

### Opción preferida por área

| Área               | Decisión recomendada                                          | Justificación principal                     |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------- |
| **Datos**          | JSON estático en `/public/data/`                              | RGPD + offline PWA + determinismo           |
| **Escala**         | Didáctica con curva sublogarítmica                            | Pedagógicamente superior; planetas visibles |
| **Órbitas**        | Circulares (Explorador) → elípticas → Kepler (Investigador)   | Progresión pedagógica natural               |
| **Texturas**       | Solar System Scope CC BY 4.0, 2K inicial + 4K lazy al enfocar | Equilibrio calidad/rendimiento              |
| **Anillos**        | RingGeometry + textura alpha (Solar System Scope)             | Patrón estándar R3F, sin shader complejo    |
| **Code-splitting** | `lazy(() => import('./SolarSystemScene'))` + manualChunks     | Bundle inicial <300 KB sin Three.js         |
| **Cámara**         | OrbitControls + Focus tween (gsap o react-spring)             | Táctil nativo, SMART Board compatible       |
| **Tour**           | Diferir a v1.1                                                | Reduce complejidad MVP                      |
| **Voz**            | Solo Web Speech TTS (nombre del planeta) en MVP               | Zero bundle; Whisper diferido a voice-mvp   |
| **i18n**           | Keys i18next, namespace `solar` lazy-loaded                   | Integración limpia con sistema existente    |
| **LOD**            | `<Lod>` de Drei con 3 niveles de geometría                    | GPU budget controlado en tablets            |

---

## Riesgos

### Riesgo 1 (ALTO): Bundle y memoria GPU en tablets

**Descripción**: Three.js + todas las texturas 2K pueden superar los 150 MB de memoria GPU en tablets antiguas (iPad Air 2, Samsung Tab A 2019). Estos dispositivos tienen GPU compartida con CPU y límites de ~256 MB para WebGL.

**Mitigación**:

- Texturas 1K para tablets detectadas por media query o User Agent
- LOD agresivo: planetas lejanos como puntos de luz sin textura
- Liberar texturas de planetas no visibles con `texture.dispose()`
- Test en Playwright con `--device='iPad Air'` para detectar problemas temprano

**Probabilidad**: Alta (el proyecto lista tablets como target primario)  
**Impacto**: Alto (puede hacer la app inutilizable en clase)

### Riesgo 2 (MEDIO): Atribución Solar System Scope

**Descripción**: La licencia CC BY 4.0 exige atribución visible y explícita. Si se incluyen las texturas sin mostrar "Textures courtesy of Solar System Scope" en la UI, se violaría la licencia y podría obligar a retirar las texturas.

**Mitigación**:

- Ya documentado en `CREDITS.md`
- Añadir texto de atribución visible en el footer o en un modal de créditos accesible desde la escena 3D
- Verificar que la atribución aparece en la build de producción antes del lanzamiento

**Probabilidad**: Baja (es un paso de implementación claro)  
**Impacto**: Medio-alto (obliga a cambiar texturas si no se hace)

### Riesgo 3 (MEDIO): SMART Board — eventos táctiles y pointer

**Descripción**: Los modelos SMART Board MX/RX más antiguos pueden tener comportamientos peculiares con PointerEvents en Chromium embebido. OrbitControls maneja táctil, pero el firmware del SMART Board puede interferir.

**Mitigación**:

- Añadir test de aceptación en Playwright con emulación táctil
- Tener fallback a click de ratón si la rotación táctil falla
- Documentar versión mínima de firmware SMART Board testada

**Probabilidad**: Media  
**Impacto**: Medio (afecta el target principal del proyecto)

### Riesgo 4 (BAJO): Licencia de datos numéricos

**Descripción**: Los datos numéricos (masa, radio, períodos) extraídos de NASA JPL/Fact Sheets son dominio público, pero si se copian textos descriptivos de la web de NASA se activaría la política de derechos de autor de NASA (no CC).

**Mitigación**:

- Usar solo los valores numéricos de JPL (dominio público)
- Redactar todas las descripciones en castellano desde cero (CC BY-SA 4.0 propias)
- No copiar texto de wikipedia sin verificar la licencia CC

---

## Decisiones Diferidas

| Decisión                                        | Razón del diferimiento                                                  | Dónde tratar               |
| ----------------------------------------------- | ----------------------------------------------------------------------- | -------------------------- |
| **Tour automático de cámara**                   | Aumenta complejidad del MVP; buen candidato para v1.1                   | Change `camera-tour`       |
| **Integración Whisper / NLP**                   | +50-80 MB bundle; requiere UX propia                                    | Change `voice-mvp`         |
| **Escala real (modo científico)**               | Útil para Investigador pero educativamente confuso para MVP             | Post-MVP Investigador      |
| **Texturas 8K**                                 | Solo justificado en pantallas 5K+; SMART Board MX es 4K                 | v2.0 si se detecta 5K      |
| **Lunas completas** (salvo Luna terrestre)      | Las lunas de Júpiter/Saturno (67+) añaden complejidad de datos y render | Change `moons-mvp`         |
| **Modo atmósferas** (shader glow)               | Valioso pero no crítico para MVP                                        | v1.2                       |
| **i18next-http-backend** lazy namespace loading | MVP solo ES+EN, carga síncrona aceptable                                | Antes de añadir 3er locale |
| **Free-fly WASD**                               | Cámara libre es un modo avanzado; OrbitControls es suficiente           | Change `camera-advanced`   |
| **Plutón y cuerpos enanos**                     | Controvertido pedagógicamente; requiere explicación extra               | Post-MVP con nota IAU      |

---

## Próximos Pasos para `proposal.md`

1. **Confirmar datos de entrada**: Definir el JSON schema de `planets.json` (campos mínimos para el MVP: id, name_key, radius_km, mass_kg, distance_AU, orbital_period_days, eccentricity, inclination_deg, moons_count, has_rings, color_hex)

2. **Arquitectura de componentes**: Definir árbol de componentes R3F:
   - `<SolarSystemScene>` (Canvas + Suspense)
   - `<Sun />`, `<Planet name="mercury" />` (8 instancias)
   - `<OrbitPath />` (línea elíptica / circular según nivel)
   - `<PlanetLabel />` (HUD superpuesto, HTML overlay)
   - `<InfoPanel />` (panel lateral por nivel pedagógico)
   - `<CameraController />` (OrbitControls + focus logic)

3. **Stratеgia de testing TDD**:
   - Unitarios: `usePlanetPosition(planet, level, t)`, `useOrbitPath(planet, level)`, data transformers
   - Integración: `<Planet />` renderiza textura, `<InfoPanel />` muestra datos correctos por nivel
   - E2E: click en planeta → foco, cambio de nivel → datos cambian, SMART Board táctil

4. **Phasing de implementación**:
   - Fase 1: Estructura datos (JSON) + tipos TypeScript + tests unitarios del modelo
   - Fase 2: Sol + un planeta (Tierra) funcionando con nivel Aprendiz
   - Fase 3: Los 8 planetas restantes
   - Fase 4: Diferenciación por los 3 niveles
   - Fase 5: Performance (LOD, code-splitting, SW cache)
   - Fase 6: Accesibilidad y SMART Board

5. **Decisiones que necesitan confirmación del usuario**:
   - ¿Incluir Plutón con nota pedagógica IAU, o excluirlo?
   - ¿Tour automático en MVP o diferir?
   - ¿Textura del Sol animada (shader de superficie solar) o textura estática?
   - ¿Mostrar cinturón de asteroides como representación visual o excluir?

---

## Conclusión

El Solar System MVP es técnicamente factible con el stack actual. Los mayores riesgos son rendimiento en tablets y la correcta gestión de la atribución de texturas CC BY 4.0. La progresión pedagógica de los tres niveles (Explorador → Aprendiz → Investigador) se puede implementar de forma elegante reutilizando los mismos componentes R3F y variando los datos y el modo orbital según `useAppStore().level`.

La decisión más importante del MVP es el sistema de escala: una escala didáctica bien diseñada puede ser la diferencia entre una experiencia educativa impactante y una pantalla negra con un punto blanco en el centro.
