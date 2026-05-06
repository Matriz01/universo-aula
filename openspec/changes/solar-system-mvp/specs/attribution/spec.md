# Spec: attribution

**Cambio:** solar-system-mvp
**Capability:** attribution
**Estado:** Especificado

## Resumen

Atribución visible y permanente de las texturas Solar System Scope (CC BY 4.0) en la UI de producción, mediante `<AttributionFooter>` siempre montado y `<CreditsModal>` accesible desde el HUD. También cubre la atribución de los datos numéricos NASA JPL + Fact Sheets en `CREDITS.md` y en el modal.

## Requisitos

### REQ-001: Footer de atribución siempre visible

**Prioridad:** MUST

El componente `<AttributionFooter>` MUST estar siempre montado en el HUD, no ocultable por el usuario, con el texto "Texturas cortesía de Solar System Scope (CC BY 4.0)" visible en el DOM en build de producción.

#### Escenario: Footer visible en build de producción

**Given** la aplicación está desplegada en producción  
**When** se carga la página y la escena está montada  
**Then** existe en el DOM un elemento con el texto "Solar System Scope" visible  
**And** el elemento no está oculto (`visibility: hidden` o `display: none`)

#### Escenario: Footer no ocultable por usuario

**Given** el `<AttributionFooter>` está montado  
**When** el usuario interactúa con cualquier control del HUD (abrir InfoPanel, iniciar tour, cambiar nivel)  
**Then** el `<AttributionFooter>` permanece visible en el DOM

---

### REQ-002: Test E2E verifica atribución en producción

**Prioridad:** MUST

El test E2E `solar-system.spec.ts` MUST incluir un caso que verifique que el texto "Solar System Scope" es visible en el DOM en el entorno de test de producción.

#### Escenario: Playwright detecta texto de atribución

**Given** la aplicación está corriendo en modo producción bajo Playwright  
**When** se carga la página  
**Then** el locator `text=Solar System Scope` existe y es visible en el DOM

---

### REQ-003: Modal de créditos accesible desde el HUD

**Prioridad:** MUST

El `<CreditsModal>` MUST ser accesible desde un botón o enlace en el HUD (por ejemplo, desde el `<AttributionFooter>`). El modal MUST mostrar la lista completa de fuentes: texturas Solar System Scope (CC BY 4.0), datos NASA JPL Horizons J2000 y NASA Fact Sheets (dominio público), y resoluciones IAU 2006.

#### Escenario: Apertura del modal de créditos

**Given** la escena está cargada  
**When** el usuario hace click en el enlace de créditos del footer  
**Then** el `<CreditsModal>` se abre  
**And** el modal contiene el texto "Solar System Scope (CC BY 4.0)"  
**And** el modal contiene el texto "NASA JPL Horizons"

#### Escenario: Modal cerrable con Escape

**Given** el `<CreditsModal>` está abierto  
**When** el usuario pulsa `Escape`  
**Then** el modal se cierra  
**And** el foco vuelve al elemento que lo abrió

---

### REQ-004: Atribución en `CREDITS.md`

**Prioridad:** MUST

El fichero `CREDITS.md` en la raíz del repositorio MUST contener secciones para Solar System Scope (con URL y licencia CC BY 4.0), NASA JPL Horizons (dominio público) y NASA Fact Sheets (dominio público).

#### Escenario: CREDITS.md con secciones obligatorias

**Given** el fichero `CREDITS.md` existe en la raíz del repositorio  
**When** se inspecciona su contenido  
**Then** contiene la cadena "Solar System Scope"  
**And** contiene la cadena "CC BY 4.0"  
**And** contiene la cadena "NASA JPL"

---

### REQ-005: Licencia de la aplicación en HUD

**Prioridad:** SHOULD

El HUD SHALL mostrar de forma legible que el código de la aplicación es AGPL-3.0 y que los textos pedagógicos son CC BY-SA 4.0, diferenciando claramente las licencias de las texturas (CC BY 4.0 de terceros).

#### Escenario: Licencias diferenciadas en el modal de créditos

**Given** el `<CreditsModal>` está abierto  
**When** el usuario lee la sección de licencias  
**Then** se distinguen: código (AGPL-3.0), textos propios (CC BY-SA 4.0) y texturas (CC BY 4.0)
