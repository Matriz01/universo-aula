# Spec: orbital-mechanics

**Cambio:** solar-system-mvp
**Capability:** orbital-mechanics
**Estado:** Especificado

## Resumen

Implementa los hooks `usePlanetPosition` y `useOrbitPath` que calculan la posición tridimensional de cada planeta y generan los puntos de la línea orbital visible en escena. Cubre los tres modelos orbitales (circular, elipse simplificada, Kepler con Newton-Raphson) según el nivel pedagógico activo.

## Requisitos

### REQ-001: Hook `usePlanetPosition` — modelo circular (Explorador)

**Prioridad:** MUST

`usePlanetPosition` MUST calcular la posición de un planeta en órbita circular uniforme cuando el nivel es `'explorador'`, usando velocidad angular proporcional al periodo orbital y la distancia visual sublogarítmica de `visualDistance(semi_major_axis_AU)`.

#### Escenario: Posición circular de la Tierra en t=0

**Given** `level = 'explorador'`, `planet = Earth` y `t = 0`  
**When** se llama a `usePlanetPosition`  
**Then** la posición retornada tiene `y = 0`  
**And** el módulo del vector `(x, z)` coincide con `visualDistance(1.0)` con error máximo de 0.001

#### Escenario: Periodo orbital correcto en nivel Explorador

**Given** `level = 'explorador'`, `planet = Mars` y `t = orbital_period_days * SPEEDUP_EXPLORADOR`  
**When** se llama a `usePlanetPosition`  
**Then** la posición retornada es igual a la posición en `t = 0` con error máximo de 0.001

---

### REQ-002: Hook `usePlanetPosition` — elipse simplificada (Aprendiz)

**Prioridad:** MUST

`usePlanetPosition` MUST calcular la posición en una elipse donde el semieje mayor `a = visualDistance(semi_major_axis_AU)` y el semieje menor `b = a * sqrt(1 - e²)`. El ángulo progresa linealmente con el tiempo, sin resolver la anomalía verdadera de Kepler.

#### Escenario: Posición elíptica de Mercurio (alta excentricidad)

**Given** `level = 'aprendiz'`, `planet = Mercury` (e = 0.2056) y `t = orbital_period_days / 4`  
**When** se llama a `usePlanetPosition`  
**Then** la posición retornada satisface `x²/a² + z²/b² ≈ 1` con error máximo de 0.01  
**And** `y = 0`

#### Escenario: Distinción entre Explorador y Aprendiz para planeta excéntrico

**Given** `planet = Mercury` y el mismo `t`  
**When** se comparan las posiciones en nivel `'explorador'` y nivel `'aprendiz'`  
**Then** las posiciones difieren (la órbita elíptica tiene a ≠ b para e > 0)

---

### REQ-003: Hook `usePlanetPosition` — Kepler con Newton-Raphson (Investigador)

**Prioridad:** MUST

`usePlanetPosition` MUST resolver la ecuación de Kepler `M = E - e*sin(E)` mediante Newton-Raphson con tolerancia 1e-6 y máximo 8 iteraciones. El resultado MUST aplicar las rotaciones orbitales (inclinación, longitud del nodo ascendente, argumento del perihelio).

#### Escenario: Convergencia para Mercurio (máxima excentricidad del sistema)

**Given** `level = 'investigador'`, `planet = Mercury` (e = 0.2056)  
**When** se invoca `solveKeplerNewtonRaphson(M, 0.2056, 1e-6, 8)` para cualquier M en [0, 2π]  
**Then** la función converge en ≤8 iteraciones  
**And** `|E - 0.2056*sin(E) - M| < 1e-6`

#### Escenario: Posición con inclinación orbital aplicada

**Given** `level = 'investigador'`, `planet = Mercury` (inclinación ≈ 7°)  
**When** se calcula la posición  
**Then** `y ≠ 0` (la inclinación orbital produce desplazamiento fuera del plano eclíptico)

#### Escenario: Función pura y determinista

**Given** los mismos parámetros de entrada (`planet`, `level`, `t`)  
**When** se llama a `usePlanetPosition` en dos momentos distintos  
**Then** ambas llamadas retornan el mismo `Vector3` (sin estado mutable interno en la función de cálculo)

---

### REQ-004: Hook `useOrbitPath` — generación de puntos de trayectoria

**Prioridad:** MUST

`useOrbitPath` MUST generar un array de `THREE.Vector3` formando la trayectoria completa del planeta (un periodo orbital completo). El número de segmentos SHALL ser configurable (por defecto 128). La trayectoria MUST corresponder al modelo del nivel activo.

#### Escenario: Órbita circular genera círculo

**Given** `level = 'explorador'`, `planet = Earth`, `segments = 128`  
**When** se llama a `useOrbitPath`  
**Then** se retornan 128 puntos equidistantes angularmente  
**And** todos los puntos tienen `y = 0`  
**And** todos los puntos tienen módulo `(x, z)` igual a `visualDistance(1.0)` con error ≤ 0.001

#### Escenario: Órbita elíptica genera elipse

**Given** `level = 'aprendiz'`, `planet = Mercury` (e = 0.2056)  
**When** se llama a `useOrbitPath`  
**Then** los puntos forman una elipse (la distancia al origen varía entre aMin y aMax)  
**And** el primer y el último punto son el mismo (trayectoria cerrada)

---

### REQ-005: Escala didáctica sublogarítmica

**Prioridad:** MUST

Las funciones `visualRadius(radius_km)` y `visualDistance(au)` MUST implementar escalado sublogarítmico. Ambas funciones MUST ser puras y exportables de forma independiente para facilitar los tests unitarios.

#### Escenario: `visualDistance` es monótonamente creciente

**Given** dos planetas con `au1 < au2`  
**When** se comparan `visualDistance(au1)` y `visualDistance(au2)`  
**Then** `visualDistance(au1) < visualDistance(au2)`

#### Escenario: `visualRadius` produce tamaños coherentes

**Given** Júpiter (`radius_km = 71492`) y Mercurio (`radius_km = 2439`)  
**When** se comparan `visualRadius(71492)` y `visualRadius(2439)`  
**Then** el radio visual de Júpiter es mayor que el de Mercurio  
**And** la diferencia visual es menor que la diferencia real (efecto compresión logarítmica)
