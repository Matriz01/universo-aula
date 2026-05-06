# Spec: camera-navigation

**Cambio:** solar-system-mvp
**Capability:** camera-navigation
**Estado:** Especificado

## Resumen

Navegación de cámara basada en `OrbitControls` de Drei con tween de focus implementado con `@react-spring/three`. Cubre el focus suave a cualquier planeta en ≤1.5 s, la navegación completa por teclado (Tab/Shift+Tab/Enter/Space/Escape/T) y el respeto de `prefers-reduced-motion`.

## Requisitos

### REQ-001: Focus de cámara en planeta en ≤1.5 s

**Prioridad:** MUST

Al hacer click sobre cualquier planeta, la cámara MUST hacer tween suave hacia el planeta seleccionado y completar la animación de focus en ≤1.5 segundos. El hook `useFocusCamera` MUST utilizar `@react-spring/three`.

#### Escenario: Click en Júpiter activa focus

**Given** la cámara está en posición inicial (vista general del sistema solar)  
**When** el usuario hace click sobre Júpiter  
**Then** la cámara inicia un tween hacia Júpiter inmediatamente  
**And** el tween completa en ≤1500 ms  
**And** la cámara queda enfocada con Júpiter centrado en la pantalla

#### Escenario: Click en Sol activa focus

**Given** la cámara está en posición de focus sobre Marte  
**When** el usuario hace click sobre el Sol  
**Then** la cámara inicia un nuevo tween desde Marte hacia el Sol  
**And** completa en ≤1500 ms

#### Escenario: Cancelación de tween anterior

**Given** la cámara está en medio de un tween hacia Neptuno  
**When** el usuario hace click sobre Mercurio  
**Then** el tween a Neptuno se cancela inmediatamente  
**And** se inicia un nuevo tween hacia Mercurio

---

### REQ-002: OrbitControls siempre activo

**Prioridad:** MUST

`OrbitControls` de Drei MUST estar activo en todo momento, permitiendo al usuario rotar, hacer zoom y desplazar la cámara con ratón/táctil. Los controles NO SHALL desactivarse durante el tour automático.

#### Escenario: Rotación de cámara con ratón

**Given** la escena está cargada  
**When** el usuario arrastra el ratón sobre el canvas  
**Then** la cámara orbita alrededor del punto de interés

#### Escenario: Zoom con rueda del ratón

**Given** la escena está cargada  
**When** el usuario usa la rueda del ratón  
**Then** la cámara hace zoom in/out

---

### REQ-003: Navegación por teclado — Tab/Shift+Tab

**Prioridad:** MUST

La tecla `Tab` MUST mover el foco lógico al siguiente cuerpo celeste en orden Sol → Mercurio → Venus → Tierra → Marte → Júpiter → Saturno → Urano → Neptuno → Plutón → (vuelta a Sol). `Shift+Tab` MUST navegar en orden inverso.

#### Escenario: Tab avanza al siguiente planeta

**Given** el foco lógico está sobre Marte  
**When** el usuario pulsa `Tab`  
**Then** el foco lógico pasa a Júpiter  
**And** el planeta enfocado recibe un indicador visual de selección

#### Escenario: Shift+Tab retrocede al planeta anterior

**Given** el foco lógico está sobre Marte  
**When** el usuario pulsa `Shift+Tab`  
**Then** el foco lógico pasa a Venus

#### Escenario: Tab envuelve de Plutón a Sol

**Given** el foco lógico está sobre Plutón  
**When** el usuario pulsa `Tab`  
**Then** el foco lógico pasa al Sol

---

### REQ-004: Navegación por teclado — Enter/Space/Escape

**Prioridad:** MUST

`Enter` o `Space` MUST aplicar el focus de cámara al cuerpo celeste con foco lógico activo. `Escape` MUST liberar el focus de cámara y devolver la vista general.

#### Escenario: Enter aplica focus de cámara

**Given** el foco lógico está sobre Saturno  
**When** el usuario pulsa `Enter`  
**Then** la cámara hace tween hacia Saturno (≤1.5 s)  
**And** el InfoPanel muestra los datos de Saturno

#### Escenario: Escape devuelve vista general

**Given** la cámara está enfocada sobre Venus  
**When** el usuario pulsa `Escape`  
**Then** la cámara hace tween de vuelta a la posición de vista general  
**And** el InfoPanel se cierra o se oculta

---

### REQ-005: Tecla T — inicio/parada del tour

**Prioridad:** MUST

La tecla `T` MUST alternar el estado del tour automático (iniciar si estaba parado, detener si estaba activo).

#### Escenario: T inicia el tour

**Given** el tour está en estado `idle`  
**When** el usuario pulsa `T`  
**Then** el tour pasa a estado `focus_planet` (Sol es el primer cuerpo)

#### Escenario: T detiene el tour en progreso

**Given** el tour está en estado `narration` sobre Marte  
**When** el usuario pulsa `T`  
**Then** el tour pasa a estado `idle`  
**And** la cámara permanece en su posición actual

---

### REQ-006: Respeto de `prefers-reduced-motion`

**Prioridad:** MUST

Cuando `prefers-reduced-motion: reduce` está activo, la duración de los tweens de focus SHALL reducirse a 0.3 s. La animación del tween SHALL ser instantánea desde la perspectiva del usuario.

#### Escenario: Tween reducido con prefers-reduced-motion

**Given** el sistema operativo tiene `prefers-reduced-motion: reduce`  
**When** el usuario hace click sobre Neptuno  
**Then** el tween de focus completa en ≤300 ms
