# Spec: pedagogical-levels

**Cambio:** solar-system-mvp
**Capability:** pedagogical-levels
**Estado:** Especificado

## Resumen

Define los tres niveles pedagógicos (Explorador, Aprendiz, Investigador) y su efecto diferenciado sobre los datos mostrados, el modelo orbital empleado, la densidad del HUD y el comportamiento del InfoPanel. Un cambio de nivel NO rehace la escena 3D; únicamente actualiza los datos y el modelo de simulación en caliente.

## Requisitos

### REQ-001: Selector de nivel visible en el HUD

**Prioridad:** MUST

El componente `LevelSelector` MUST estar visible en el HUD en todo momento y permitir cambiar entre los tres niveles: Explorador, Aprendiz e Investigador. El nivel activo MUST persistir en `useAppStore`.

#### Escenario: Cambio de nivel desde Explorador a Aprendiz

**Given** el nivel activo es Explorador  
**When** el usuario selecciona Aprendiz en el `LevelSelector`  
**Then** `useAppStore.level` cambia a `'aprendiz'`  
**And** el InfoPanel del planeta seleccionado muestra datos de nivel Aprendiz  
**And** la escena 3D continúa renderizando sin desmontarse ni volver a montarse

#### Escenario: Persistencia del nivel en el store

**Given** el nivel activo es Investigador  
**When** se inspecciona `useAppStore.getState().level`  
**Then** el valor retornado es `'investigador'`

---

### REQ-002: Datos diferenciados por nivel en el InfoPanel

**Prioridad:** MUST

Los datos mostrados en `InfoPanel` MUST variar cualitativamente según el nivel activo:

- **Explorador**: pictogramas grandes, nombre del planeta, descripción corta (≤15 palabras), color y tamaño relativo.
- **Aprendiz**: panel compacto con periodo orbital, temperatura, número de lunas y descripción media (≤50 palabras).
- **Investigador**: tabla científica con parámetros orbitales completos (semieje mayor en AU, excentricidad, inclinación, periodo en días), masa, densidad, gravedad superficial.

#### Escenario: InfoPanel en nivel Explorador

**Given** el nivel activo es Explorador y el usuario selecciona Marte  
**When** se muestra el InfoPanel  
**Then** se muestran pictogramas grandes y la descripción tiene ≤15 palabras  
**And** NO se muestran valores numéricos de parámetros orbitales

#### Escenario: InfoPanel en nivel Investigador

**Given** el nivel activo es Investigador y el usuario selecciona Júpiter  
**When** se muestra el InfoPanel  
**Then** se muestra una tabla con semieje mayor, excentricidad, inclinación, periodo orbital, masa y gravedad

#### Escenario: HUD con nota de escala en Aprendiz e Investigador

**Given** el nivel activo es Aprendiz o Investigador  
**When** la escena está visible  
**Then** el HUD muestra el texto "Las distancias y tamaños no están a escala real"

---

### REQ-003: Cambio de nivel sin rehacer la escena 3D

**Prioridad:** MUST

El grafo de escena R3F NO SHALL desmontarse ni remontarse al cambiar de nivel. Únicamente los componentes de datos y UI SHALL actualizarse.

#### Escenario: Escena no se desmonta al cambiar de nivel

**Given** la escena está cargada y mostrando todos los planetas  
**When** el usuario cambia el nivel 3 veces consecutivas (Explorador → Aprendiz → Investigador → Explorador)  
**Then** el elemento `<canvas>` sigue siendo el mismo nodo del DOM (sin unmount/remount)  
**And** el contador de renders del componente `SolarSystemScene` no incrementa por el cambio de nivel

---

### REQ-004: Modelo orbital diferenciado por nivel

**Prioridad:** MUST

El hook `usePlanetPosition` MUST usar el modelo orbital correspondiente al nivel activo:

- **Explorador**: órbita circular uniforme.
- **Aprendiz**: elipse simplificada (sin anomalía verdadera de Kepler).
- **Investigador**: ecuación de Kepler real con Newton-Raphson (tolerancia 1e-6, máximo 8 iteraciones).

#### Escenario: Cambio de modelo orbital al cambiar nivel

**Given** el nivel activo es Explorador (órbita circular)  
**When** el usuario cambia a Investigador  
**Then** las posiciones de los planetas en el siguiente frame se calculan con el modelo Kepler  
**And** la transición no produce saltos visuales abruptos (la posición inicial del nuevo modelo coincide con la posición circular previa con un error máximo de 5 unidades visuales)

#### Escenario: Convergencia de Newton-Raphson en nivel Investigador

**Given** el nivel activo es Investigador  
**When** `usePlanetPosition` calcula la posición de Mercurio (excentricidad = 0.2056)  
**Then** `solveKeplerNewtonRaphson` converge en ≤8 iteraciones  
**And** el error residual `|E - e*sin(E) - M|` es menor que 1e-6

---

### REQ-005: Densidad del HUD por nivel

**Prioridad:** SHOULD

El HUD SHALL adaptar la densidad de información al nivel activo. En Explorador, los elementos del HUD deben ser grandes y con alto contraste. En Investigador, el HUD puede mostrar controles avanzados adicionales.

#### Escenario: HUD simplificado en Explorador

**Given** el nivel activo es Explorador  
**When** se inspecciona el layout del HUD  
**Then** los botones tienen un tamaño mínimo de 44×44 px (WCAG 2.5.5)  
**And** no se muestran tablas de datos numéricos
