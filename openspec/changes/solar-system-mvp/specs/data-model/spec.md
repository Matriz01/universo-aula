# Spec: data-model

**Cambio:** solar-system-mvp
**Capability:** data-model
**Estado:** Especificado

## Resumen

Schema del fichero estático `public/data/planets.json` con parámetros orbitales NASA JPL Horizons J2000 y datos físicos NASA Fact Sheets. Define también `AsteroidBeltConfig` y el `SolarSystemDataset` raíz. Los datos son exclusivamente numéricos; los textos pedagógicos van al namespace i18n `solar`.

## Requisitos

### REQ-001: Schema `PlanetData` completo

**Prioridad:** MUST

Cada entrada del array `planets` en `planets.json` MUST cumplir el schema `PlanetData` con los campos: `id`, `classification`, `radius_km`, `mass_kg`, `density_g_cm3`, `gravity_m_s2`, `rotation_period_h`, `axial_tilt_deg`, `mean_temperature_k`, `semi_major_axis_AU`, `eccentricity`, `inclination_deg`, `longitude_ascending_node_deg`, `argument_perihelion_deg`, `mean_anomaly_J2000_deg`, `orbital_period_days`, `color_hex`, `has_rings`, `moons_count`, `texture_base`.

#### Escenario: Todos los campos obligatorios presentes

**Given** el fichero `public/data/planets.json` existe  
**When** se valida contra el schema `SolarSystemDataset` con Zod o similar  
**Then** la validación pasa sin errores para los 9 cuerpos (Mercurio a Plutón)

#### Escenario: Clasificación correcta de Plutón

**Given** el fichero `planets.json` está cargado  
**When** se inspecciona la entrada con `id = 'pluto'`  
**Then** `classification` es `'dwarf_planet'`  
**And** `has_rings` es `false`

#### Escenario: Clasificación correcta de Saturno

**Given** el fichero `planets.json` está cargado  
**When** se inspecciona la entrada con `id = 'saturn'`  
**Then** `classification` es `'gas_giant'`  
**And** `has_rings` es `true`

---

### REQ-002: Valores orbitales NASA JPL J2000

**Prioridad:** MUST

Los parámetros orbitales (`semi_major_axis_AU`, `eccentricity`, `inclination_deg`, `longitude_ascending_node_deg`, `argument_perihelion_deg`, `mean_anomaly_J2000_deg`, `orbital_period_days`) MUST corresponder a los valores publicados por NASA JPL Horizons para la época J2000 (1 de enero de 2000, 12:00 TT). La tolerancia de los valores numéricos SHALL ser ≤0.5% respecto a la fuente.

#### Escenario: Excentricidad de la Tierra dentro de tolerancia

**Given** la entrada de la Tierra en `planets.json`  
**When** se lee `eccentricity`  
**Then** el valor está en el rango [0.0165, 0.0175] (NASA JPL: 0.01671)

#### Escenario: Semieje mayor de Mercurio dentro de tolerancia

**Given** la entrada de Mercurio en `planets.json`  
**When** se lee `semi_major_axis_AU`  
**Then** el valor está en el rango [0.385, 0.392] (NASA JPL: 0.38710)

---

### REQ-003: `AsteroidBeltConfig` presente y válida

**Prioridad:** MUST

El fichero `planets.json` MUST contener la clave `asteroid_belt` con los campos: `inner_AU` (2.2), `outer_AU` (3.2), `count_high` (2000), `count_mid` (1000), `count_low` (500), `vertical_dispersion` (0.05), `size_min`, `size_max`, `color_hex`.

#### Escenario: AsteroidBeltConfig con valores correctos

**Given** el fichero `planets.json` está cargado  
**When** se lee `asteroid_belt`  
**Then** `inner_AU` es 2.2 y `outer_AU` es 3.2  
**And** `count_high` es 2000, `count_mid` es 1000 y `count_low` es 500

---

### REQ-004: Sin datos textuales en `planets.json`

**Prioridad:** MUST

El fichero `planets.json` SHALL NOT contener nombres localizados, descripciones pedagógicas ni notas IAU. Todos los textos van exclusivamente al namespace i18n `solar`.

#### Escenario: Ausencia de campos textuales localizados

**Given** el fichero `planets.json` está cargado  
**When** se inspeccionan todas las claves de cada entrada de planeta  
**Then** ninguna clave tiene nombre `description`, `name_es`, `name_en` ni `iau_note`

---

### REQ-005: Tipos TypeScript en `src/scenes/data/types.ts`

**Prioridad:** MUST

El fichero `src/scenes/data/types.ts` MUST exportar las interfaces TypeScript `PlanetData`, `AsteroidBeltConfig` y `SolarSystemDataset` que reflejen exactamente el schema de `planets.json`. Todos los hooks y componentes de la escena MUST importar estos tipos.

#### Escenario: Tipos exportados y usados

**Given** el fichero `src/scenes/data/types.ts` existe  
**When** se compilan los tipos con `tsc --noEmit`  
**Then** no hay errores de tipo en ningún fichero que importe de `types.ts`

#### Escenario: Schema consistente entre JSON y TypeScript

**Given** `planets.json` tiene los campos del schema  
**When** se parsea con el tipo `SolarSystemDataset` (por ejemplo con `zod.parse` en tests)  
**Then** la validación pasa y los tipos inferidos son correctos

---

### REQ-006: Fuente de datos en `CREDITS.md`

**Prioridad:** MUST

El fichero `CREDITS.md` MUST atribuir los datos numéricos de `planets.json` explícitamente a NASA JPL Horizons J2000 y NASA Planetary Fact Sheets, indicando que son de dominio público.

#### Escenario: Atribución NASA en CREDITS.md

**Given** el fichero `CREDITS.md` existe  
**When** se busca la sección de datos numéricos  
**Then** contiene "NASA JPL Horizons" y "NASA Planetary Fact Sheets"  
**And** se indica que los datos son de dominio público
