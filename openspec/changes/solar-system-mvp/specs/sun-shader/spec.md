# Spec: sun-shader

**Cambio:** solar-system-mvp
**Capability:** sun-shader
**Estado:** Especificado

## Resumen

Shader procedural del Sol basado en fragment shader GLSL con simplex noise 3D, gradiente radial, granulación y flujo radial (convección). Incluye un fallback de textura estática animada para GPUs débiles (`low` según `useGpuCapability`) y respeto estricto de `prefers-reduced-motion`.

## Requisitos

### REQ-001: Shader procedural activo en GPUs mid/high

**Prioridad:** MUST

En dispositivos detectados como `mid` o `high` por `useGpuCapability`, el Sol MUST usar `ShaderMaterial` con los uniforms `uTime`, `uColorCore`, `uColorEdge`, `uGranulationScale`, `uFlowScale`, `uFlowSpeed` y `uSunspotsEnabled`. El shader MUST animar el uniform `uTime` en cada `useFrame`.

#### Escenario: ShaderMaterial aplicado en GPU mid/high

**Given** `useGpuCapability()` retorna `'mid'` o `'high'`  
**When** se monta el componente `<Sun />`  
**Then** el material del mesh del Sol es una instancia de `THREE.ShaderMaterial`  
**And** el uniform `uTime` se actualiza en cada frame

#### Escenario: Animación visible del shader

**Given** el shader procedural está activo  
**When** transcurren 30 frames  
**Then** los valores de píxel del canvas cambian entre frames (la superficie solar se anima)

---

### REQ-002: Fallback con textura estática en GPU low

**Prioridad:** MUST

En dispositivos `low`, el Sol SHALL usar `MeshStandardMaterial` con la textura `sun/2k.jpg` y animación del offset de textura mediante `texture.offset` en `useFrame`. El `ShaderMaterial` NO SHALL cargarse en dispositivos `low`.

#### Escenario: Fallback activado en GPU low

**Given** `useGpuCapability()` retorna `'low'`  
**When** se monta el componente `<Sun />`  
**Then** el material del mesh del Sol es `MeshStandardMaterial` (no `ShaderMaterial`)  
**And** la textura solar está aplicada

#### Escenario: Animación de textura en fallback

**Given** el fallback está activo  
**When** transcurren 60 frames  
**Then** `texture.offset` ha cambiado al menos una vez (animación de rotación de superficie)

---

### REQ-003: Uniform `uSunspotsEnabled`

**Prioridad:** SHOULD

El shader SHOULD soportar el uniform `uSunspotsEnabled` (booleano). Cuando está en `false`, la capa de manchas solares (tercera capa de noise) SHALL omitirse en el fragment shader, reduciendo el coste de GPU.

#### Escenario: Sunspots desactivados en GPU mid

**Given** `useGpuCapability()` retorna `'mid'`  
**When** se monta `<Sun uSunspotsEnabled={false} />`  
**Then** el uniform `uSunspotsEnabled` tiene valor `false`  
**And** el FPS no cae por debajo de 30 en device emulation de laptop integrada

---

### REQ-004: Respeto de `prefers-reduced-motion`

**Prioridad:** MUST

Cuando `prefers-reduced-motion: reduce` está activo, el uniform `uFlowSpeed` SHALL reducirse un 80% respecto al valor por defecto. En el fallback, la animación de `texture.offset` SHALL detenerse.

#### Escenario: Velocidad de animación reducida con prefers-reduced-motion

**Given** el sistema operativo tiene `prefers-reduced-motion: reduce`  
**When** se monta `<Sun />`  
**Then** `uFlowSpeed` es ≤ 20% del valor de `uFlowSpeed` en modo normal

#### Escenario: Fallback detenido con prefers-reduced-motion

**Given** el fallback está activo y `prefers-reduced-motion: reduce`  
**When** transcurren 60 frames  
**Then** `texture.offset` no cambia

---

### REQ-005: Vertex shader passthrough

**Prioridad:** MUST

El vertex shader (`sun.vert`) MUST ser un passthrough que exponga `vNormal` y `vWorldPos` al fragment shader. No SHALL modificar la geometría.

#### Escenario: Geometría no distorsionada

**Given** el shader procedural está activo  
**When** se renderiza el Sol  
**Then** la esfera del Sol mantiene su forma esférica (sin distorsión de vértices)
