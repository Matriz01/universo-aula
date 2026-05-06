# Spec: i18n-solar

**Cambio:** solar-system-mvp
**Capability:** i18n-solar
**Estado:** Especificado

## Resumen

Namespace `solar` en i18next con ficheros JSON para ES y EN. Contiene keys de UI generales, nombres y descripciones de los 9 cuerpos principales (+ Plutón) a tres niveles de profundidad pedagógica, y las notas IAU de Plutón adaptadas por nivel. Los ficheros se cargan síncronamente junto a `common.json` en el bootstrap de i18next.

## Requisitos

### REQ-001: Ficheros de namespace `solar` en ES y EN

**Prioridad:** MUST

MUST existir los ficheros `src/i18n/locales/es/solar.json` y `src/i18n/locales/en/solar.json`. El namespace `solar` MUST registrarse en `src/i18n/index.ts` y cargarse de forma síncrona junto a `common.json`.

#### Escenario: Ficheros existentes y registrados

**Given** el proyecto está configurado  
**When** se inspecciona `src/i18n/index.ts`  
**Then** el namespace `solar` aparece en la lista de namespaces cargados  
**And** existen `src/i18n/locales/es/solar.json` y `src/i18n/locales/en/solar.json`

#### Escenario: Keys disponibles al arrancar

**Given** la aplicación está cargada en locale `es`  
**When** se llama a `i18n.t('solar:mercury.name')`  
**Then** retorna `'Mercurio'` (no la clave)

---

### REQ-002: Keys de UI generales

**Prioridad:** MUST

El namespace `solar` MUST contener las keys de UI bajo el prefijo `ui`:

- `ui.level_selector.explorador`, `ui.level_selector.aprendiz`, `ui.level_selector.investigador`
- `ui.tour.start`, `ui.tour.stop`, `ui.tour.next`
- `ui.attribution`
- `ui.scale_note`

#### Escenario: Key `ui.scale_note` correcta en ES

**Given** el locale activo es `es`  
**When** se llama a `i18n.t('solar:ui.scale_note')`  
**Then** retorna `'Las distancias y tamaños no están a escala real'`

#### Escenario: Keys de tour disponibles en EN

**Given** el locale activo es `en`  
**When** se llaman a `i18n.t('solar:ui.tour.start')`, `...tour.stop` y `...tour.next`  
**Then** las tres retornan cadenas no vacías y distintas de la clave

---

### REQ-003: Keys de cuerpos celestes a tres niveles

**Prioridad:** MUST

Para cada cuerpo (sol, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto) MUST existir en ambos locales:

- `{cuerpo}.name`
- `{cuerpo}.explorador.description`
- `{cuerpo}.aprendiz.description`
- `{cuerpo}.investigador.description`
- `{cuerpo}.curiosity` (SHOULD, puede omitirse en la primera versión de los datos EN)

#### Escenario: Descripción por nivel de Tierra en ES

**Given** el locale activo es `es`  
**When** se llama a `i18n.t('solar:earth.explorador.description')`  
**Then** retorna una descripción en castellano de ≤15 palabras

**When** se llama a `i18n.t('solar:earth.investigador.description')`  
**Then** retorna una descripción científica de la Tierra en castellano

#### Escenario: Consistencia entre ES y EN

**Given** los dos ficheros de locale existen  
**When** se comparan las keys de primer nivel (nombres de cuerpos)  
**Then** ambos ficheros tienen exactamente las mismas keys raíz

---

### REQ-004: Keys de nota IAU de Plutón por nivel

**Prioridad:** MUST

El namespace `solar` MUST contener las keys:

- `pluto.iau_note.explorador`
- `pluto.iau_note.aprendiz`
- `pluto.iau_note.investigador`

en ambos locales, con el contenido diferenciado descrito en el proposal §4.10.

#### Escenario: Nota IAU Explorador en ES

**Given** el locale activo es `es`  
**When** se llama a `i18n.t('solar:pluto.iau_note.explorador')`  
**Then** retorna el texto "Antes era el 9.º planeta. Ahora se llama planeta enano."

#### Escenario: Nota IAU Investigador en ES

**Given** el locale activo es `es`  
**When** se llama a `i18n.t('solar:pluto.iau_note.investigador')`  
**Then** el texto retornado menciona "Resoluciones 5A y 6A" y "IAU"

---

### REQ-005: Sin `i18next-http-backend` en el MVP

**Prioridad:** MUST

Los ficheros `solar.json` NO SHALL cargarse con `i18next-http-backend`. Ambos locales MUST importarse directamente en `src/i18n/index.ts` como objetos JSON estáticos (import estático de TypeScript).

#### Escenario: Import estático de solar.json

**Given** el fichero `src/i18n/index.ts` existe  
**When** se inspeccionan sus imports  
**Then** `solar.json` de ambos locales se importa directamente (sin `backend.loadPath`)  
**And** no hay dependencia de `i18next-http-backend` para el namespace `solar`
