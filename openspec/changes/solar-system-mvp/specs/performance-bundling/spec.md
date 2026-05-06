# Spec: performance-bundling

**Cambio:** solar-system-mvp
**Capability:** performance-bundling
**Estado:** Especificado

## Resumen

Code-splitting agresivo con `manualChunks` en Vite para separar Three.js, React, i18next y el código solar en chunks independientes. El bundle inicial JS sin Three.js debe ser <300 KB gzip. La escena carga en <5 s en 4G simulada y Lighthouse Performance ≥85 en producción.

## Requisitos

### REQ-001: Bundle inicial JS sin Three.js <300 KB gzip

**Prioridad:** MUST

El chunk descargado en la carga inicial (sin el chunk `vendor-three`) SHALL ser inferior a 300 KB en gzip. La configuración `manualChunks` en `vite.config.ts` MUST separar Three.js en un chunk `vendor-three` cargado de forma diferida junto con `SolarSystemScene`.

#### Escenario: Bundle inicial bajo 300 KB gzip

**Given** `pnpm build` produce los assets en `dist/`  
**When** se mide el tamaño gzip de los chunks iniciales (excluido `vendor-three` y `app-solar`)  
**Then** la suma total es inferior a 300 KB

#### Escenario: Three.js en chunk separado

**Given** el build de producción está completo  
**When** se listan los chunks en `dist/assets/`  
**Then** existe un fichero `vendor-three-*.js` que contiene `three`  
**And** el bundle inicial `index-*.js` NO contiene código de Three.js

---

### REQ-002: Chunk `vendor-three` <500 KB gzip y `app-solar` <200 KB gzip

**Prioridad:** MUST

El chunk `vendor-three` SHALL ser inferior a 500 KB en gzip. El chunk `app-solar` (código de la escena solar) SHALL ser inferior a 200 KB en gzip.

#### Escenario: Tamaño de vendor-three

**Given** el build de producción está completo  
**When** se mide el tamaño gzip del chunk `vendor-three-*.js`  
**Then** el tamaño es inferior a 500 KB

#### Escenario: Tamaño de app-solar

**Given** el build de producción está completo  
**When** se mide el tamaño gzip del chunk `app-solar-*.js`  
**Then** el tamaño es inferior a 200 KB

---

### REQ-003: Carga <5 s en 4G simulada (TTI)

**Prioridad:** MUST

El Time to Interactive (TTI) en 4G simulada (20 Mbps down, 20 ms RTT según Lighthouse) SHALL ser inferior a 5 segundos. FCP SHALL ser inferior a 2 s y LCP inferior a 3 s.

#### Escenario: TTI bajo 5 s en Lighthouse CI

**Given** la aplicación está desplegada en producción  
**When** se ejecuta Lighthouse con preset `4G simulada`  
**Then** el valor de TTI es inferior a 5000 ms  
**And** FCP es inferior a 2000 ms  
**And** LCP es inferior a 3000 ms

---

### REQ-004: Lighthouse Performance ≥85

**Prioridad:** MUST

La puntuación de Lighthouse Performance en el build de producción (https://universo-aula.pedrovicente.workers.dev/) SHALL ser igual o superior a 85.

#### Escenario: Puntuación Lighthouse ≥85

**Given** la aplicación está desplegada en producción  
**When** se ejecuta Lighthouse Performance audit  
**Then** la puntuación es ≥85

---

### REQ-005: Total assets primera carga <20 MB

**Prioridad:** SHOULD

El total de assets descargados en la primera visita (JS + texturas 2K + data JSON) SHALL ser inferior a 20 MB.

#### Escenario: Assets totales bajo 20 MB

**Given** el usuario visita la aplicación por primera vez con caché vacía  
**When** se contabilizan todos los bytes transferidos hasta que la escena es interactiva  
**Then** el total transferido es inferior a 20 MB

---

### REQ-006: `manualChunks` configurado en `vite.config.ts`

**Prioridad:** MUST

`vite.config.ts` MUST incluir la configuración `build.rollupOptions.output.manualChunks` separando al menos: `vendor-three` (three, @react-three/fiber, @react-three/drei), `vendor-react` (react, react-dom), `vendor-i18n` (i18next, react-i18next) y `app-solar` (código bajo `src/scenes/`).

#### Escenario: Chunks definidos en vite.config.ts

**Given** el fichero `vite.config.ts` existe  
**When** se inspecciona la propiedad `build.rollupOptions.output.manualChunks`  
**Then** están definidas las claves `vendor-three`, `vendor-react`, `vendor-i18n` y `app-solar`

---

### REQ-007: Memoria GPU pico <150 MB

**Prioridad:** SHOULD

El uso de memoria GPU al renderizar los 10 cuerpos con texturas 2K SHALL ser inferior a 150 MB (medible con Chrome DevTools Memory > GPU).

#### Escenario: Memoria GPU bajo 150 MB

**Given** la escena está completamente cargada con texturas 2K  
**When** se mide el uso de memoria GPU en Chrome DevTools  
**Then** el uso es inferior a 150 MB
