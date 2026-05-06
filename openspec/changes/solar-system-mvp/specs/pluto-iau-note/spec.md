# Spec: pluto-iau-note

**Cambio:** solar-system-mvp
**Capability:** pluto-iau-note
**Estado:** Especificado

## Resumen

Nota sobre la reclasificación de Plutón por la IAU en 2006, adaptada al nivel pedagógico activo y mostrada siempre que Plutón esté seleccionado. En nivel Explorador incluye pictograma "antes / ahora". En Aprendiz e Investigador incluye enlace al modal con las resoluciones IAU.

## Requisitos

### REQ-001: Nota IAU visible al seleccionar Plutón

**Prioridad:** MUST

Cuando el usuario selecciona Plutón (por click o por teclado), el componente `<PlutoNote>` MUST mostrarse dentro del `InfoPanel` con el texto correspondiente al nivel activo. La nota MUST mostrarse sin necesidad de interacción adicional del usuario.

#### Escenario: Nota visible en nivel Explorador

**Given** el nivel activo es Explorador  
**When** el usuario selecciona Plutón  
**Then** el `InfoPanel` muestra el texto "Antes era el 9.º planeta. Ahora se llama planeta enano."  
**And** se muestra un pictograma "antes / ahora" (icono planeta tachado + icono planeta enano)

#### Escenario: Nota visible en nivel Aprendiz

**Given** el nivel activo es Aprendiz  
**When** el usuario selecciona Plutón  
**Then** el `InfoPanel` muestra el texto "En 2006 la IAU decidió que Plutón es un planeta enano porque comparte su órbita con otros cuerpos."  
**And** hay un enlace que abre el modal de créditos con las resoluciones IAU

#### Escenario: Nota visible en nivel Investigador

**Given** el nivel activo es Investigador  
**When** el usuario selecciona Plutón  
**Then** el `InfoPanel` muestra la descripción completa de las Resoluciones 5A y 6A de la IAU de 2006  
**And** hay un enlace a `iau.org/resolutions/`

---

### REQ-002: Nota adaptada al cambiar de nivel con Plutón seleccionado

**Prioridad:** MUST

Si el usuario cambia de nivel mientras Plutón está seleccionado, el texto de la nota IAU SHALL actualizarse sin necesidad de reseleccionar Plutón.

#### Escenario: Actualización de nota al cambiar nivel

**Given** Plutón está seleccionado y el nivel activo es Explorador  
**When** el usuario cambia a nivel Investigador  
**Then** el texto del `<PlutoNote>` cambia a la descripción completa de las resoluciones IAU  
**And** el pictograma desaparece (no existe en niveles Aprendiz/Investigador)

---

### REQ-003: Etiqueta diferenciada de Plutón en la escena

**Prioridad:** MUST

Plutón SHALL tener una etiqueta visual en la escena que lo distinga como "planeta enano" (no como planeta). La etiqueta SHALL ser visible desde la distancia y legible con contraste WCAG AA.

#### Escenario: Etiqueta de planeta enano visible

**Given** la escena está cargada y la cámara tiene vista general  
**When** se inspecciona el DOM de las etiquetas de planetas  
**Then** Plutón muestra la etiqueta "Plutón (planeta enano)" o similar  
**And** el estilo de la etiqueta es visualmente distinto al de los ocho planetas principales

---

### REQ-004: Enlace a modal de resoluciones IAU en Aprendiz e Investigador

**Prioridad:** SHOULD

El `<PlutoNote>` en niveles Aprendiz e Investigador SHALL incluir un enlace que abre `<CreditsModal>` mostrando las resoluciones IAU 5A y 6A y el link a `iau.org`.

#### Escenario: Click en enlace abre el modal de créditos

**Given** el nivel activo es Aprendiz y Plutón está seleccionado  
**When** el usuario hace click en el enlace de resoluciones IAU  
**Then** el `<CreditsModal>` se abre con foco en la sección de resoluciones IAU  
**And** el modal es cerrable con Escape o con un botón de cierre

#### Escenario: Modal accesible por teclado

**Given** el `<CreditsModal>` está abierto  
**When** el usuario pulsa `Tab`  
**Then** el foco se mueve entre los elementos interactivos del modal (enlace IAU, botón cerrar)  
**And** al pulsar `Escape` el modal se cierra y el foco vuelve al enlace que lo abrió

---

### REQ-005: Tests E2E de Plutón

**Prioridad:** MUST

El fichero `tests/e2e/pluto-note.spec.ts` MUST verificar en un navegador real (Playwright) que la nota IAU aparece en los tres niveles al seleccionar Plutón.

#### Escenario: Test E2E detecta nota en los tres niveles

**Given** la aplicación está corriendo en modo de test  
**When** Playwright selecciona Plutón en nivel Explorador, Aprendiz e Investigador  
**Then** en cada nivel el selector del texto de la nota IAU correspondiente existe en el DOM y es visible
