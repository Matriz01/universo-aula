# Spec: tour-automatic

**Cambio:** solar-system-mvp
**Capability:** tour-automatic
**Estado:** Especificado

## Resumen

Tour automático narrado que recorre Sol → Mercurio → … → Plutón mediante una máquina de estados (`useTour`). La duración por parada se adapta al nivel pedagógico, la narración es diferente por nivel, y el tour respeta `prefers-reduced-motion` permitiendo avance manual. El tour es interrumpible en cualquier momento.

## Requisitos

### REQ-001: Máquina de estados del tour

**Prioridad:** MUST

El hook `useTour` MUST implementar la máquina de estados: `idle → focus_planet → narration → next_planet → focus_planet (siguiente)`. Al llegar al último cuerpo (Plutón), el estado MUST volver a `idle`. Cualquier interrupción del usuario (click, Escape) MUST transicionar a `idle` desde cualquier estado.

#### Escenario: Tour completa el ciclo completo

**Given** el tour está en estado `idle`  
**When** el usuario activa el tour  
**Then** el tour pasa por todos los cuerpos en orden: Sol, Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón  
**And** al finalizar Plutón, el estado vuelve a `idle`  
**And** no se producen errores de consola durante el recorrido

#### Escenario: Interrupción por click del usuario

**Given** el tour está en estado `narration` sobre Júpiter  
**When** el usuario hace click en cualquier punto de la pantalla  
**Then** el estado pasa a `idle` inmediatamente  
**And** el TTS (si estaba hablando) se detiene

#### Escenario: Interrupción por Escape

**Given** el tour está en estado `focus_planet` hacia Saturno  
**When** el usuario pulsa `Escape`  
**Then** el estado pasa a `idle`

---

### REQ-002: Duración de parada por nivel pedagógico

**Prioridad:** MUST

El tiempo de permanencia en cada planeta MUST variar según el nivel activo:

- **Explorador**: 6 s de focus + 4 s de narración (10 s total).
- **Aprendiz**: 5 s de focus + 6 s de narración (11 s total).
- **Investigador**: 4 s de focus + 8 s de narración (12 s total).

#### Escenario: Duración correcta en nivel Explorador

**Given** el nivel activo es Explorador y el tour está activo  
**When** el tour hace focus sobre la Tierra  
**Then** el estado permanece en `focus_planet` durante ~6 s antes de pasar a `narration`  
**And** el estado permanece en `narration` durante ~4 s antes de pasar a `next_planet`

#### Escenario: Duración correcta en nivel Investigador

**Given** el nivel activo es Investigador y el tour está activo  
**When** el tour hace focus sobre Marte  
**Then** el tiempo total en `focus_planet` + `narration` es ~12 s

---

### REQ-003: Narración por nivel

**Prioridad:** MUST

La narración MUST usar el contenido i18n del namespace `solar` correspondiente al nivel activo. En nivel Explorador, la narración invoca Web Speech TTS con el nombre + descripción corta. En Aprendiz e Investigador, el texto de narración se muestra en el InfoPanel.

#### Escenario: TTS activo en Explorador durante el tour

**Given** el nivel activo es Explorador y el tour hace focus sobre Marte  
**When** el estado transiciona a `narration`  
**Then** `speakName` se invoca con el nombre "Marte" y el idioma activo  
**And** `window.speechSynthesis.speak` es llamado

#### Escenario: Texto mostrado en InfoPanel en Aprendiz

**Given** el nivel activo es Aprendiz y el tour hace focus sobre Saturno  
**When** el estado transiciona a `narration`  
**Then** el InfoPanel muestra la descripción de Aprendiz de Saturno  
**And** `window.speechSynthesis.speak` NO es invocado

---

### REQ-004: Respeto de `prefers-reduced-motion`

**Prioridad:** MUST

Cuando `prefers-reduced-motion: reduce` está activo:

- Los tweens de cámara SHALL reducirse a 0.3 s (delegado a `camera-navigation`).
- El avance automático entre planetas SHALL desactivarse.
- El usuario MUST controlar el avance manualmente mediante un botón visible "Siguiente".

#### Escenario: Botón "Siguiente" visible con prefers-reduced-motion

**Given** `prefers-reduced-motion: reduce` está activo y el tour está en estado `narration`  
**When** se inspecciona el DOM  
**Then** existe un botón con texto "Siguiente" visible y enfocable

#### Escenario: Sin avance automático con prefers-reduced-motion

**Given** `prefers-reduced-motion: reduce` está activo y el tour está en `narration` sobre Venus  
**When** transcurren 15 segundos sin interacción del usuario  
**Then** el tour permanece en `narration` sobre Venus (no avanza automáticamente)

---

### REQ-005: Controles de tour siempre visibles

**Prioridad:** MUST

Cuando el tour está activo, los botones "Pausar tour" y "Saltar tour" MUST ser visibles en el HUD en todo momento, con contraste WCAG AA.

#### Escenario: Botones de control visibles durante el tour

**Given** el tour está en cualquier estado activo (`focus_planet`, `narration`, `next_planet`)  
**When** se inspecciona el DOM  
**Then** existe un botón "Pausar tour" visible  
**And** existe un botón "Saltar tour" visible  
**And** ambos botones tienen ratio de contraste ≥ 4.5:1
