# Spec: pwa-caching

**Cambio:** solar-system-mvp
**Capability:** pwa-caching
**Estado:** Especificado

## Resumen

Estrategia de cacheo PWA con Workbox vía `vite-plugin-pwa`. Las texturas de `/textures/*` se cachean con estrategia `CacheFirst` (cache name: `solar-textures-v1`). Los datos de `/data/*.json` se cachean con `StaleWhileRevalidate`. La aplicación MUST funcionar offline tras la primera visita.

## Requisitos

### REQ-001: Cache `CacheFirst` para texturas

**Prioridad:** MUST

Las peticiones a `/textures/*` MUST usar la estrategia Workbox `CacheFirst` con cache name `solar-textures-v1`. Una vez cacheadas, las texturas MUST servirse desde la caché sin petición de red.

#### Escenario: Texturas servidas desde caché en segunda visita

**Given** el usuario ha visitado la aplicación al menos una vez con conexión  
**And** todas las texturas 2K han sido descargadas y cacheadas  
**When** el usuario visita la aplicación sin conexión  
**Then** la escena se carga con las texturas correctas servidas desde `solar-textures-v1`  
**And** no se producen peticiones de red fallidas para texturas

#### Escenario: Cache name `solar-textures-v1`

**Given** el Service Worker está instalado  
**When** se inspecciona la lista de caches del navegador  
**Then** existe una caché con nombre `solar-textures-v1`  
**And** contiene las URLs de las texturas cargadas

---

### REQ-002: Cache `StaleWhileRevalidate` para datos JSON

**Prioridad:** MUST

Las peticiones a `/data/*.json` (incluyendo `planets.json`) MUST usar la estrategia `StaleWhileRevalidate`. La respuesta cacheada se sirve inmediatamente; en background se actualiza la caché si la red está disponible.

#### Escenario: `planets.json` disponible offline

**Given** el usuario ha visitado la aplicación al menos una vez  
**When** el usuario visita la aplicación sin conexión  
**Then** `planets.json` se carga desde la caché  
**And** la escena muestra todos los datos de planetas correctamente

#### Escenario: Actualización en background cuando hay red

**Given** el usuario abre la aplicación con conexión  
**And** `planets.json` ya está en caché  
**When** la página carga  
**Then** la versión cacheada se usa inmediatamente (respuesta rápida)  
**And** en background se hace una petición de red y se actualiza la caché con la versión más reciente

---

### REQ-003: PWA offline funcional tras primera visita

**Prioridad:** MUST

Tras la primera visita con conexión, la aplicación MUST ser completamente funcional sin conexión: carga de la escena, interacción con planetas, cambio de nivel, tour automático y lectura de datos.

#### Escenario: Aplicación funcional offline

**Given** el Service Worker está instalado y activo  
**And** el usuario visita la aplicación sin conexión  
**When** se abre la aplicación  
**Then** la escena 3D se renderiza correctamente  
**And** el InfoPanel muestra datos al hacer click en un planeta  
**And** el selector de nivel funciona

#### Escenario: Sin errores de consola offline

**Given** la aplicación está en modo offline  
**When** se navega durante 60 segundos  
**Then** no se producen errores de consola relacionados con peticiones de red fallidas

---

### REQ-004: Invalidación de caché por versión

**Prioridad:** MUST

Al actualizar el cache name (por ejemplo de `solar-textures-v1` a `solar-textures-v2`), el Service Worker MUST invalidar la caché anterior durante la activación. Los usuarios con caché vieja MUST recibir la nueva versión en la siguiente visita.

#### Escenario: Cache v1 invalidada al activar v2

**Given** el Service Worker con cache `solar-textures-v1` está instalado  
**When** se despliega un nuevo SW con cache name `solar-textures-v2`  
**Then** durante la activación del nuevo SW se elimina `solar-textures-v1`  
**And** las texturas se vuelven a descargar con el nuevo hash

---

### REQ-005: Configuración en `vite.config.ts` con `vite-plugin-pwa`

**Prioridad:** MUST

La configuración del Service Worker MUST estar en `vite.config.ts` bajo la propiedad `VitePWA({ workbox: { runtimeCaching: [...] } })`. NO SHALL usarse un SW manual.

#### Escenario: Configuración declarativa en vite.config.ts

**Given** el fichero `vite.config.ts` existe  
**When** se inspecciona la configuración de `VitePWA`  
**Then** existe la propiedad `workbox.runtimeCaching`  
**And** hay al menos dos reglas: una para `/textures/*` (`CacheFirst`) y otra para `/data/*.json` (`StaleWhileRevalidate`)
