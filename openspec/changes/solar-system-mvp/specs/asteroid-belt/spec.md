# Spec: asteroid-belt

**Cambio:** solar-system-mvp
**Capability:** asteroid-belt
**Estado:** Especificado

## Resumen

Cinturón de asteroides implementado con `instancedMesh` de Three.js (icosaedro de baja resolución) distribuido entre las órbitas de Marte y Júpiter (2.2–3.2 AU visuales). El número de instancias se adapta a la capacidad de GPU detectada por `useGpuCapability` (500 / 1000 / 2000).

## Requisitos

### REQ-001: Cinturón visible entre Marte y Júpiter

**Prioridad:** MUST

El componente `<AsteroidBelt>` MUST renderizar un `instancedMesh` visible entre las órbitas visuales de Marte y Júpiter. La distribución SHALL ser log-normal en radio con ángulo uniforme [0, 2π) y dispersión vertical gaussiana `N(0, 0.05)`.

#### Escenario: Cinturón visible en la escena

**Given** la escena está cargada  
**When** se inspecciona el grafo de escena  
**Then** existe un `InstancedMesh` con nombre `asteroid-belt`  
**And** todas sus instancias tienen radios visuales dentro del rango `[visualDistance(2.2), visualDistance(3.2)]`

#### Escenario: Distribución sin asteroides fuera del cinturón

**Given** las posiciones de las 2000 instancias están definidas  
**When** se verifica cada posición  
**Then** ninguna instancia tiene radio < `visualDistance(2.2)` ni > `visualDistance(3.2)`

---

### REQ-002: Count adaptado a capacidad GPU

**Prioridad:** MUST

El número de instancias del `instancedMesh` MUST corresponder al nivel de GPU detectado:

- `high` (GPU discreta de escritorio): 2000 instancias.
- `mid` (integrada de laptop / SMART Board): 1000 instancias.
- `low` (tablet): 500 instancias.

#### Escenario: 2000 asteroides en GPU high

**Given** `useGpuCapability()` retorna `'high'`  
**When** se monta `<AsteroidBelt />`  
**Then** el `instancedMesh` tiene `count = 2000`

#### Escenario: 500 asteroides en GPU low

**Given** `useGpuCapability()` retorna `'low'`  
**When** se monta `<AsteroidBelt />`  
**Then** el `instancedMesh` tiene `count = 500`

#### Escenario: No hay regresión de rendimiento en GPU low

**Given** `useGpuCapability()` retorna `'low'` y `count = 500`  
**When** la escena renderiza durante 5 segundos  
**Then** el FPS se mantiene ≥ 30 (medible con `Stats` de Drei en modo desarrollo)

---

### REQ-003: Detección de capacidad GPU

**Prioridad:** MUST

`useGpuCapability` MUST usar `WEBGL_debug_renderer_info` cuando esté disponible para clasificar la GPU. Si no está disponible, SHALL ejecutar un micro-benchmark de 200 ms al inicio de la escena. El resultado SHALL cachearse en `sessionStorage` para no repetir la detección en navegación intra-sesión.

#### Escenario: Caché de detección GPU

**Given** la detección ya se ejecutó y el resultado está en `sessionStorage`  
**When** se monta un nuevo componente que consume `useGpuCapability()`  
**Then** el valor se obtiene de `sessionStorage` sin ejecutar el benchmark nuevamente

#### Escenario: Fallback a mid cuando la detección falla

**Given** `WEBGL_debug_renderer_info` no está disponible y el benchmark no es concluyente  
**When** `useGpuCapability()` no puede clasificar la GPU  
**Then** retorna `'mid'` como valor seguro por defecto

---

### REQ-004: Geometría y material del cinturón

**Prioridad:** MUST

Cada instancia SHALL usar un `IcosahedronGeometry` de baja resolución (detalle 0, 20 caras) y un `MeshStandardMaterial` de color gris polvo (`#8a8a8a`). El tamaño por instancia SHALL ser uniforme entre `size_min` y `size_max` definidos en `asteroid_belt` de `planets.json`.

#### Escenario: Geometría de icosaedro

**Given** el `InstancedMesh` está montado  
**When** se inspecciona su `geometry`  
**Then** es una instancia de `IcosahedronGeometry` con `detail = 0`

#### Escenario: Rotaciones iniciales aleatorias

**Given** el `InstancedMesh` está inicializado  
**When** se comparan las matrices de rotación de dos instancias distintas  
**Then** las rotaciones difieren (cada instancia tiene orientación aleatoria inicial)
