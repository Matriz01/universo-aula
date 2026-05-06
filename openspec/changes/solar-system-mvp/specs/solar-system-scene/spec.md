# Spec: solar-system-scene

**Cambio:** solar-system-mvp
**Capability:** solar-system-scene
**Estado:** Especificado

## Resumen

Escena principal R3F que integra el Sol, los ocho planetas, la Luna terrestre, Plutón y el cinturón de asteroides. Se carga de forma diferida mediante `lazy(import())` y `<Suspense>` para no bloquear el bundle inicial. Cubre los criterios de ausencia de errores de consola en producción y la visibilidad de los anillos de Saturno.

## Requisitos

### REQ-001: Lazy loading de la escena principal

**Prioridad:** MUST

La escena `SolarSystemScene` MUST cargarse con `React.lazy(() => import('./SolarSystemScene'))` y estar envuelta en `<Suspense fallback={<LoadingScreen />}>` en `App.tsx`. El bundle inicial no SHALL incluir Three.js en el chunk principal.

#### Escenario: Carga diferida en navegador frío

**Given** el usuario abre la aplicación por primera vez  
**When** el navegador descarga el bundle inicial  
**Then** el chunk `vendor-three` NO aparece en el bundle inicial descargado  
**And** `LoadingScreen` con barra de progreso se muestra mientras el chunk `app-solar` se carga

#### Escenario: Suspense resuelto correctamente

**Given** la escena está cargada y el canvas R3F es visible  
**When** se inspecciona el DOM  
**Then** el `<canvas>` de WebGL está presente en el árbol  
**And** no existe ningún elemento `<LoadingScreen>` en el DOM

#### Escenario: Error de red al cargar el chunk

**Given** el usuario tiene conexión intermitente  
**When** falla la descarga del chunk `app-solar`  
**Then** React ErrorBoundary captura el error y muestra un mensaje de reintento  
**And** la consola NO registra errores no capturados

---

### REQ-002: Composición de cuerpos celestes

**Prioridad:** MUST

La escena MUST renderizar el Sol, Mercurio, Venus, Tierra (con Luna), Marte, Júpiter, Saturno (con anillos), Urano, Neptuno y Plutón. Cada cuerpo SHALL ser un componente independiente con su textura y geometría propias.

#### Escenario: Todos los planetas visibles al cargar

**Given** la escena está completamente cargada  
**When** se inspecciona el grafo de escena Three.js  
**Then** existen exactamente 9 objetos de tipo `Planet` (excluida la Luna) más el Sol  
**And** cada planeta tiene su textura 2K aplicada en el material

#### Escenario: Anillos de Saturno con textura alpha

**Given** la escena está cargada y Saturno está a menos de 80 unidades de la cámara  
**When** se renderiza el frame  
**Then** `RingGeometry` de Saturno está montada y su material usa `alphaMap` con la textura `saturn-rings/2k.png`  
**And** la transparencia del anillo es visible (alpha < 1 en zonas no ocupadas por el anillo)

#### Escenario: Luna orbitando la Tierra

**Given** la escena está cargada  
**When** transcurren más de 0 segundos de simulación  
**Then** la Luna se desplaza en órbita alrededor de la Tierra visible en el canvas

---

### REQ-003: Fondo de estrellas

**Prioridad:** SHOULD

El componente `<StarField>` usando `<Stars>` de Drei SHOULD estar siempre presente como fondo de la escena, con al menos 3000 estrellas visibles.

#### Escenario: Estrellas visibles en la escena

**Given** la escena está cargada  
**When** la cámara mira hacia cualquier dirección fuera de la eclíptica  
**Then** el fondo muestra puntos de luz distribuidos esféricamente

---

### REQ-004: Cero errores de consola en producción

**Prioridad:** MUST

La escena en build de producción SHALL producir 0 errores de consola (`console.error`) durante la carga inicial y durante la interacción normal (click en planeta, cambio de nivel, tour automático).

#### Escenario: Carga limpia en producción

**Given** la aplicación está desplegada en producción  
**When** se abre la aplicación y se navega durante 60 segundos sin acciones del usuario  
**Then** `console.error` no registra ninguna llamada

#### Escenario: Click en planeta sin errores

**Given** la aplicación está en producción  
**When** el usuario hace click sobre cualquier planeta  
**Then** no se producen errores de consola  
**And** el InfoPanel muestra la información del planeta seleccionado

---

### REQ-005: Pantalla de carga con progreso

**Prioridad:** MUST

`LoadingScreen` MUST usar `useProgress()` de Drei para mostrar el progreso real de carga de texturas, con un valor numérico visible entre 0 y 100.

#### Escenario: Progreso visible durante la carga

**Given** el usuario abre la aplicación con caché vacía  
**When** el chunk `app-solar` se está descargando y las texturas se están cargando  
**Then** `LoadingScreen` muestra un valor de progreso entre 0 y 100  
**And** la barra de progreso avanza monotónicamente hasta llegar a 100
