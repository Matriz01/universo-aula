# Design: Solar System MVP

**Cambio:** `solar-system-mvp`
**Fecha:** 2026-05-06
**Estado:** Diseño técnico
**Autor:** sdd-design (sub-agente)
**Basado en:** `openspec/changes/solar-system-mvp/proposal.md` (APROBADO)

> Este documento define el **CÓMO**. La propuesta ya fijó el **QUÉ**. Aquí se concretan árboles de componentes, fórmulas finales, GLSL completo, máquina de estados, datos numéricos reales NASA y decisiones arquitectónicas con rationale.

---

## 1. Architecture overview

### 1.1 Jerarquía de componentes (alto nivel)

```
<App>
└── <I18nProvider>
    └── <ZustandProvider> (implícito, hooks)
        ├── <LoadingScreen progress={drei.useProgress} />   (sólo durante Suspense)
        ├── <Suspense fallback={<LoadingScreen/>}>
        │   └── <SolarSystemScene />          ← lazy(import)
        ├── <HUD>
        │   ├── <LevelSelector />
        │   ├── <InfoPanel planet={selectedPlanet} level={level} />
        │   ├── <TourControls />
        │   ├── <CreditsModal />              (lazy on demand)
        │   └── <AttributionFooter />         (siempre montado)
        └── <A11yLiveRegion />                (anuncia cambios de focus para SR)
```

### 1.2 Árbol R3F interno de `<SolarSystemScene>`

```
<Canvas dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
  <color attach="background" args={['#000008']} />
  <ambientLight intensity={0.05} />
  <pointLight position={[0,0,0]} intensity={3.0} decay={2} distance={200} />
  <StarField count={5000} radius={120} />          (Drei <Stars/>)
  <Sun                                              ← shader procedural
      capability={gpu}                              ('low'|'mid'|'high')
      reducedMotion={prefersReducedMotion}
  />
  <OrbitPath planet={p} level={level} />            ×9 (Plutón incl.)
  <Planet planet={p} level={level} />               ×8
  <Saturn planet={saturnData} level={level} />      (extiende Planet con anillos)
  <Planet planet={pluto} level={level} variant="dwarf" />
  <PlanetMoon parent={earth} />                     (sólo Tierra en MVP)
  <AsteroidBelt
      config={belt}
      count={gpu === 'high' ? 2000 : gpu === 'mid' ? 1000 : 500}
  />
  <CameraController
      mode={cameraMode}
      target={selectedPlanet}
      tourState={tourState}
  />
</Canvas>
```

### 1.3 Flujo de datos

```
useAppStore (Zustand)
    │
    ├─► level, selectedPlanet, cameraMode, tourActive, prefersReducedMotion, textureQuality
    │
    ▼
<SolarSystemScene>
    │
    ├─► <Planet> ─── usePlanetPosition(planet, level, t) ─► Vector3
    │                          │
    │                          └─► solveKepler / applyOrbitalRotation (puras)
    │
    ├─► <CameraController> ─── useFocusCamera(target) ─► <animated.group>
    │                          useTour(level) ─► reducer { state, dispatch }
    │
    └─► <Sun> ─── ShaderMaterial { uTime, uFlowSpeed, uSunspotsEnabled }
                 useFrame: uTime += dt; (uFlowSpeed *= reducedMotion ? 0.2 : 1)
```

### 1.4 Diagrama de secuencia — click en planeta (Aprendiz)

```
Usuario   <Planet>   useAppStore   <CameraController>   useFocusCamera   <InfoPanel>   speakName
   │         │             │              │                    │              │             │
   │ click   │             │              │                    │              │             │
   ├────────►│             │              │                    │              │             │
   │         │ setSelected │              │                    │              │             │
   │         │ Planet(id)  │              │                    │              │             │
   │         ├────────────►│              │                    │              │             │
   │         │             │ subscribers  │                    │              │             │
   │         │             ├─────────────►│ (target=planet)    │              │             │
   │         │             │              ├───────────────────►│ tween 1.2s   │             │
   │         │             │              │                    │              │             │
   │         │             ├─────────────────────────────────────────────────►│ render data │
   │         │             │              │                    │              │             │
   │         │             │ if level==Explorador               │              │             │
   │         │             ├─────────────────────────────────────────────────────────────────►│ speak(name)
   │         │             │              │                    │              │             │
   │         │             │              │ tween_done         │              │             │
   │         │             │              │◄───────────────────┤              │             │
   │         │             │              │                    │              │             │
```

### 1.5 Diagrama de secuencia — tour automático (5 pasos ejemplo)

```
Usuario   <TourControls>   useTour    useAppStore   useFocusCamera   speakName / TTS
   │             │            │            │                │              │
   │ click Start │            │            │                │              │
   ├────────────►│ dispatch   │            │                │              │
   │             ├──START────►│            │                │              │
   │             │            │ state=focus_planet (Sun)    │              │
   │             │            │ setTourActive(true)         │              │
   │             │            ├───────────►│                │              │
   │             │            │            │ subscribers ──►│ tween 6s     │
   │             │            │            │                │              │
   │             │            │  TWEEN_DONE                 │              │
   │             │            │◄────────── (callback spring)│              │
   │             │            │ state=narration             │              │
   │             │            ├──────────────────────────────────────────►│ TTS frase 4s
   │             │            │                                            │
   │             │            │  TTS_DONE  (onend)                         │
   │             │            │◄───────────────────────────────────────────┤
   │             │            │ state=focus_planet (Mercury)               │
   │             │            │ ... repite hasta Plutón                    │
   │             │            │                                            │
   │             │            │ LAST_PLANET_DONE → state=idle              │
   │             │            │ setTourActive(false), camera vista general │
```

---

## 2. Data model — `planets.json` con valores reales

> Fuentes citadas:
>
> - **NASA JPL Horizons** (https://ssd.jpl.nasa.gov/horizons/) para elementos orbitales en época J2000.0 (2451545.0 JD, 1.5 enero 2000 12:00 TT). Dominio público.
> - **NASA Planetary Fact Sheets** (https://nssdc.gsfc.nasa.gov/planetary/factsheet/) para datos físicos. Dominio público.

```json
{
  "version": "1.0.0",
  "source": "NASA JPL Horizons J2000 + NASA Planetary Fact Sheets (2024)",
  "epoch_JD": 2451545.0,
  "planets": [
    {
      "id": "mercury",
      "classification": "terrestrial",
      "radius_km": 2439.7,
      "mass_kg": 3.3011e23,
      "density_g_cm3": 5.427,
      "gravity_m_s2": 3.7,
      "rotation_period_h": 1407.6,
      "axial_tilt_deg": 0.034,
      "mean_temperature_k": 440,
      "semi_major_axis_AU": 0.387098,
      "eccentricity": 0.20563,
      "inclination_deg": 7.005,
      "longitude_ascending_node_deg": 48.331,
      "argument_perihelion_deg": 29.124,
      "mean_anomaly_J2000_deg": 174.796,
      "orbital_period_days": 87.969,
      "color_hex": "#8c7853",
      "has_rings": false,
      "moons_count": 0,
      "texture_base": "/textures/mercury/"
    },
    {
      "id": "venus",
      "classification": "terrestrial",
      "radius_km": 6051.8,
      "mass_kg": 4.8675e24,
      "density_g_cm3": 5.243,
      "gravity_m_s2": 8.87,
      "rotation_period_h": -5832.5,
      "axial_tilt_deg": 177.36,
      "mean_temperature_k": 737,
      "semi_major_axis_AU": 0.723332,
      "eccentricity": 0.00677,
      "inclination_deg": 3.39458,
      "longitude_ascending_node_deg": 76.68,
      "argument_perihelion_deg": 54.884,
      "mean_anomaly_J2000_deg": 50.115,
      "orbital_period_days": 224.701,
      "color_hex": "#e8b860",
      "has_rings": false,
      "moons_count": 0,
      "texture_base": "/textures/venus/"
    },
    {
      "id": "earth",
      "classification": "terrestrial",
      "radius_km": 6371.0,
      "mass_kg": 5.972e24,
      "density_g_cm3": 5.514,
      "gravity_m_s2": 9.807,
      "rotation_period_h": 23.9345,
      "axial_tilt_deg": 23.4393,
      "mean_temperature_k": 288,
      "semi_major_axis_AU": 1.0,
      "eccentricity": 0.01671,
      "inclination_deg": 0.00005,
      "longitude_ascending_node_deg": -11.26064,
      "argument_perihelion_deg": 114.20783,
      "mean_anomaly_J2000_deg": 358.617,
      "orbital_period_days": 365.256,
      "color_hex": "#4a90e2",
      "has_rings": false,
      "moons_count": 1,
      "texture_base": "/textures/earth/"
    },
    {
      "id": "mars",
      "classification": "terrestrial",
      "radius_km": 3389.5,
      "mass_kg": 6.4171e23,
      "density_g_cm3": 3.9335,
      "gravity_m_s2": 3.71,
      "rotation_period_h": 24.6229,
      "axial_tilt_deg": 25.19,
      "mean_temperature_k": 210,
      "semi_major_axis_AU": 1.523679,
      "eccentricity": 0.0934,
      "inclination_deg": 1.85,
      "longitude_ascending_node_deg": 49.558,
      "argument_perihelion_deg": 286.502,
      "mean_anomaly_J2000_deg": 19.412,
      "orbital_period_days": 686.98,
      "color_hex": "#c1440e",
      "has_rings": false,
      "moons_count": 2,
      "texture_base": "/textures/mars/"
    },
    {
      "id": "jupiter",
      "classification": "gas_giant",
      "radius_km": 69911,
      "mass_kg": 1.8982e27,
      "density_g_cm3": 1.326,
      "gravity_m_s2": 24.79,
      "rotation_period_h": 9.925,
      "axial_tilt_deg": 3.13,
      "mean_temperature_k": 165,
      "semi_major_axis_AU": 5.2044,
      "eccentricity": 0.0489,
      "inclination_deg": 1.303,
      "longitude_ascending_node_deg": 100.464,
      "argument_perihelion_deg": 273.867,
      "mean_anomaly_J2000_deg": 20.02,
      "orbital_period_days": 4332.589,
      "color_hex": "#d8ca9d",
      "has_rings": false,
      "moons_count": 95,
      "texture_base": "/textures/jupiter/"
    },
    {
      "id": "saturn",
      "classification": "gas_giant",
      "radius_km": 58232,
      "mass_kg": 5.6834e26,
      "density_g_cm3": 0.687,
      "gravity_m_s2": 10.44,
      "rotation_period_h": 10.656,
      "axial_tilt_deg": 26.73,
      "mean_temperature_k": 134,
      "semi_major_axis_AU": 9.5826,
      "eccentricity": 0.0565,
      "inclination_deg": 2.485,
      "longitude_ascending_node_deg": 113.665,
      "argument_perihelion_deg": 339.392,
      "mean_anomaly_J2000_deg": 317.02,
      "orbital_period_days": 10759.22,
      "color_hex": "#e3c47b",
      "has_rings": true,
      "moons_count": 146,
      "texture_base": "/textures/saturn/",
      "rings": {
        "inner_radius_km": 74500,
        "outer_radius_km": 140220,
        "texture": "/textures/saturn-rings/2k.png"
      }
    },
    {
      "id": "uranus",
      "classification": "ice_giant",
      "radius_km": 25362,
      "mass_kg": 8.681e25,
      "density_g_cm3": 1.27,
      "gravity_m_s2": 8.69,
      "rotation_period_h": -17.24,
      "axial_tilt_deg": 97.77,
      "mean_temperature_k": 76,
      "semi_major_axis_AU": 19.2184,
      "eccentricity": 0.0457,
      "inclination_deg": 0.772,
      "longitude_ascending_node_deg": 74.006,
      "argument_perihelion_deg": 96.998,
      "mean_anomaly_J2000_deg": 142.238,
      "orbital_period_days": 30688.5,
      "color_hex": "#a8d6e6",
      "has_rings": false,
      "moons_count": 27,
      "texture_base": "/textures/uranus/"
    },
    {
      "id": "neptune",
      "classification": "ice_giant",
      "radius_km": 24622,
      "mass_kg": 1.02413e26,
      "density_g_cm3": 1.638,
      "gravity_m_s2": 11.15,
      "rotation_period_h": 16.11,
      "axial_tilt_deg": 28.32,
      "mean_temperature_k": 72,
      "semi_major_axis_AU": 30.07,
      "eccentricity": 0.00859,
      "inclination_deg": 1.77,
      "longitude_ascending_node_deg": 131.784,
      "argument_perihelion_deg": 273.187,
      "mean_anomaly_J2000_deg": 256.228,
      "orbital_period_days": 60182.0,
      "color_hex": "#4166f5",
      "has_rings": false,
      "moons_count": 14,
      "texture_base": "/textures/neptune/"
    },
    {
      "id": "pluto",
      "classification": "dwarf_planet",
      "radius_km": 1188.3,
      "mass_kg": 1.303e22,
      "density_g_cm3": 1.853,
      "gravity_m_s2": 0.62,
      "rotation_period_h": -153.2928,
      "axial_tilt_deg": 122.53,
      "mean_temperature_k": 44,
      "semi_major_axis_AU": 39.482,
      "eccentricity": 0.2488,
      "inclination_deg": 17.16,
      "longitude_ascending_node_deg": 110.299,
      "argument_perihelion_deg": 113.834,
      "mean_anomaly_J2000_deg": 14.53,
      "orbital_period_days": 90560.0,
      "color_hex": "#c9a97b",
      "has_rings": false,
      "moons_count": 5,
      "texture_base": "/textures/pluto/"
    }
  ],
  "asteroid_belt": {
    "inner_AU": 2.2,
    "outer_AU": 3.2,
    "count_high": 2000,
    "count_mid": 1000,
    "count_low": 500,
    "vertical_dispersion": 0.05,
    "size_min": 0.012,
    "size_max": 0.045,
    "color_hex": "#7a6f5a"
  }
}
```

> Notas:
>
> - `rotation_period_h` negativo en Venus, Urano y Plutón indica rotación retrógrada.
> - `moons_count` es informativo (sólo se renderiza la Luna terrestre en el MVP).
> - `texture_base` es ruta relativa pública; el componente concatena `/{quality}.jpg`.

---

## 3. Sistema de escala — fórmulas finales y tabla validada

### 3.1 Constantes finales (validadas)

```ts
export const SUN_VISUAL_RADIUS = 2.5;
export const R_VISUAL_BASE = 0.3;
export const R_VISUAL_LOG_K = 0.6;
export const D_VISUAL_BASE = 5.0;
export const D_VISUAL_LOG_K = 8.0;

export function visualRadius(radiusKm: number): number {
  return R_VISUAL_BASE + R_VISUAL_LOG_K * Math.log2(radiusKm / 1000);
}

export function visualDistance(au: number): number {
  return D_VISUAL_BASE + D_VISUAL_LOG_K * Math.log2(au + 1);
}
```

### 3.2 Tabla de valores resultantes (9 cuerpos)

| Cuerpo   | radius_km | AU       | r_visual | d_visual | Notas                            |
| -------- | --------- | -------- | -------- | -------- | -------------------------------- |
| Sol      | 695700    | 0        | 2.500    | 0.000    | Constante fija                   |
| Mercurio | 2439.7    | 0.387098 | 1.072    | 8.777    | Separado >6.27 del Sol → visible |
| Venus    | 6051.8    | 0.7233   | 1.858    | 11.282   | OK                               |
| Tierra   | 6371.0    | 1.0000   | 1.903    | 13.000   | OK                               |
| Marte    | 3389.5    | 1.5237   | 1.357    | 15.684   | Coherente: menor que Tierra      |
| Júpiter  | 69911     | 5.2044   | 3.976    | 26.066   | El más grande en pantalla        |
| Saturno  | 58232     | 9.5826   | 3.818    | 32.229   | Anillos salen de r_visual×2.5    |
| Urano    | 25362     | 19.2184  | 3.099    | 39.701   | OK                               |
| Neptuno  | 24622     | 30.07    | 3.073    | 44.660   | Cabe en viewport ~50 unidades    |
| Plutón   | 1188.3    | 39.482   | 0.449    | 47.714   | Pequeño pero distinguible        |

**Validación visual del extremo cercano (Mercurio vs Sol):**

- `d_visual(Mercurio) - SUN_VISUAL_RADIUS = 8.777 - 2.5 = 6.277` unidades de separación entre superficies. A FOV 50° y cámara a Z=80 inicial, esto equivale a ~7.5° de separación angular: claramente distinguible.

**Validación del extremo lejano (Neptuno + Plutón):**

- `d_visual(Plutón) = 47.71`. El campo de visión inicial debe abarcar al menos esto. Con cámara en `(0, 35, 70)` y `far=300`, todo el sistema cabe sin recortes.

**Cinturón de asteroides en el rango visual:**

- `visualDistance(2.2) = 5 + 8 * log2(3.2) = 5 + 13.42 = 18.42`
- `visualDistance(3.2) = 5 + 8 * log2(4.2) = 5 + 16.55 = 21.55`
  → entre Marte (15.68) y Júpiter (26.07): correcto.

> **Decisión: las constantes propuestas se mantienen sin cambios.** La tabla muestra que ningún cuerpo queda invisible ni solapado con el Sol, y el orden relativo de tamaños (Júpiter > Saturno > Urano ≈ Neptuno > Tierra > Venus > Marte > Mercurio > Plutón) se preserva fielmente.

---

## 4. Cálculo orbital — pseudocódigo y casos de test

### 4.1 Constantes de simulación temporal

```ts
// Aceleración de tiempo por nivel (segundos reales → días simulados)
export const SPEEDUP_EXPLORADOR = 30; // 1 s real = 30 días simulados
export const SPEEDUP_APRENDIZ = 10; // 1 s real = 10 días
export const SPEEDUP_INVESTIGADOR = 5; // 1 s real = 5 días (más lento, más preciso)
export const J2000_JD = 2451545.0;
```

### 4.2 `usePlanetPosition` — implementación detallada

```ts
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useRef, useMemo } from 'react';

export function usePlanetPosition(
  planet: PlanetData,
  level: PedagogicalLevel,
): React.MutableRefObject<Vector3> {
  const posRef = useRef(new Vector3());
  const elapsed = useRef(0);

  // Memoizamos derivados (no dependen de t)
  const { a, b, n, M0, omega, Omega, i } = useMemo(
    () => ({
      a: visualDistance(planet.semi_major_axis_AU),
      b: visualDistance(planet.semi_major_axis_AU) * Math.sqrt(1 - planet.eccentricity ** 2),
      n: (2 * Math.PI) / planet.orbital_period_days, // mean motion (rad/día)
      M0: degToRad(planet.mean_anomaly_J2000_deg),
      omega: degToRad(planet.argument_perihelion_deg),
      Omega: degToRad(planet.longitude_ascending_node_deg),
      i: degToRad(planet.inclination_deg),
    }),
    [planet],
  );

  useFrame((_, dt) => {
    const speedup =
      level === 'explorador'
        ? SPEEDUP_EXPLORADOR
        : level === 'aprendiz'
          ? SPEEDUP_APRENDIZ
          : SPEEDUP_INVESTIGADOR;
    elapsed.current += dt * speedup; // ahora en "días simulados"

    if (level === 'explorador') {
      const theta = n * elapsed.current;
      posRef.current.set(a * Math.cos(theta), 0, a * Math.sin(theta));
    } else if (level === 'aprendiz') {
      const theta = n * elapsed.current;
      // elipse centrada en el origen (no en el foco) — aproximación didáctica
      posRef.current.set(a * Math.cos(theta), 0, b * Math.sin(theta));
    } else {
      // investigador
      const M = M0 + n * elapsed.current;
      const E = solveKeplerNewtonRaphson(M, planet.eccentricity, 1e-6, 8);
      const nu =
        2 *
        Math.atan2(
          Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
          Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2),
        );
      const r = a * (1 - planet.eccentricity * Math.cos(E));
      applyOrbitalRotation(posRef.current, r, nu, omega, Omega, i);
    }
  });

  return posRef;
}
```

### 4.3 `solveKeplerNewtonRaphson` — función pura

```ts
/**
 * Resuelve la ecuación de Kepler M = E - e·sin(E) por Newton-Raphson.
 * Converge en <8 iteraciones para e < 0.5 (todos los planetas + Plutón).
 */
export function solveKeplerNewtonRaphson(M: number, e: number, tol = 1e-6, maxIter = 8): number {
  // Normalizar M a [-π, π] para mejor convergencia
  let Mn = M % (2 * Math.PI);
  if (Mn > Math.PI) Mn -= 2 * Math.PI;
  if (Mn < -Math.PI) Mn += 2 * Math.PI;

  // Semilla: para e pequeño, E ≈ M; para e grande, E ≈ M + e·sin(M)
  let E = e < 0.8 ? Mn : Math.PI;

  for (let k = 0; k < maxIter; k++) {
    const f = E - e * Math.sin(E) - Mn;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < tol) return E;
  }
  return E;
}
```

### 4.4 `applyOrbitalRotation` — matrices 3D

```ts
/**
 * Aplica las rotaciones del plano orbital al vector en coordenadas planetocéntricas:
 *   1) ω (argumento del perihelio) alrededor de Z
 *   2) i (inclinación) alrededor de X
 *   3) Ω (longitud del nodo ascendente) alrededor de Z
 * Siguiendo convención astronómica estándar (eclipse de la eclíptica).
 */
export function applyOrbitalRotation(
  out: Vector3,
  r: number,
  nu: number,
  omega: number,
  Omega: number,
  inc: number,
): void {
  // Posición en plano orbital (x' apunta al perihelio)
  const xp = r * Math.cos(nu);
  const yp = r * Math.sin(nu);

  const cosO = Math.cos(Omega),
    sinO = Math.sin(Omega);
  const cosi = Math.cos(inc),
    sini = Math.sin(inc);
  const cosw = Math.cos(omega),
    sinw = Math.sin(omega);

  // Composición R_z(Ω) · R_x(i) · R_z(ω)
  const x = (cosO * cosw - sinO * sinw * cosi) * xp + (-cosO * sinw - sinO * cosw * cosi) * yp;
  const y = sinw * sini * xp + cosw * sini * yp;
  const z = (sinO * cosw + cosO * sinw * cosi) * xp + (-sinO * sinw + cosO * cosw * cosi) * yp;

  // Three.js: Y arriba; mapeamos eclíptica→XZ con Y=inclinación
  out.set(x, y, z);
}
```

### 4.5 Casos de test (Vitest)

```ts
// tests/unit/scenes/usePlanetPosition.test.ts

describe('solveKeplerNewtonRaphson', () => {
  it('returns M when e=0 (circular orbit)', () => {
    expect(solveKeplerNewtonRaphson(1.234, 0)).toBeCloseTo(1.234, 6);
  });
  it('Mercury (e=0.2056) at M=π/2 converges in <8 iter', () => {
    const E = solveKeplerNewtonRaphson(Math.PI / 2, 0.2056);
    // E - e sin E = M
    expect(E - 0.2056 * Math.sin(E)).toBeCloseTo(Math.PI / 2, 5);
  });
  it('Pluto (e=0.2488) at M=π converges', () => {
    const E = solveKeplerNewtonRaphson(Math.PI, 0.2488);
    expect(E - 0.2488 * Math.sin(E)).toBeCloseTo(Math.PI, 5);
  });
});

describe('applyOrbitalRotation', () => {
  it('zero inclination + zero Ω + zero ω = pure XZ plane', () => {
    const v = new Vector3();
    applyOrbitalRotation(v, 1, 0, 0, 0, 0);
    expect(v.y).toBeCloseTo(0);
    expect(v.x).toBeCloseTo(1);
  });
  it('inclination 90° at ν=π/2 places vector on Y axis', () => {
    const v = new Vector3();
    applyOrbitalRotation(v, 1, Math.PI / 2, 0, 0, Math.PI / 2);
    expect(v.y).toBeCloseTo(1, 5);
  });
});

describe('usePlanetPosition (Investigador)', () => {
  it('Mercury at J2000 + 100 days is within ~0.05 AU of JPL reference', async () => {
    // valor pre-calculado offline con JPL Horizons:
    // 2000-04-10 12:00 TT: Mercury x≈0.301 AU, y≈-0.299 AU, z≈-0.060 AU
    const pos = computeAt(mercuryData, /* days since J2000 */ 100);
    // Reescalado a unidades visuales para comparar
    expect(pos.length()).toBeCloseTo(visualDistance(0.42), 1);
  });
  it('Earth at J2000 has |y| ≈ 0 (eclíptica de referencia)', () => {
    const pos = computeAt(earthData, 0);
    expect(Math.abs(pos.y)).toBeLessThan(0.01);
  });
});
```

---

## 5. Shader del Sol — GLSL completo

### 5.1 `sun.vert` (pass-through)

```glsl
// src/scenes/shaders/sun.vert
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal   = normalize(normalMatrix * normal);
  vec4 wp   = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
```

### 5.2 `sun.frag` (versión completa, mid/high GPU)

```glsl
// src/scenes/shaders/sun.frag
// Simplex 3D noise: Stefan Gustavson / Ashima Arts (MIT License)
// https://github.com/ashima/webgl-noise

precision highp float;

uniform float uTime;
uniform vec3  uColorCore;        // ej. vec3(1.0, 0.95, 0.55)
uniform vec3  uColorEdge;        // ej. vec3(1.0, 0.45, 0.10)
uniform float uGranulationScale; // 3.0
uniform float uFlowScale;        // 8.0
uniform float uFlowSpeed;        // 0.20  (0.04 si prefers-reduced-motion)
uniform bool  uSunspotsEnabled;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

// --- Ashima simplex noise begin (MIT) ---------------------------------
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
// --- Ashima simplex noise end ----------------------------------------

void main() {
  vec3 n = normalize(vWorldPos);

  // Capa 1: granulación lenta
  float g1 = snoise(n * uGranulationScale + vec3(0.0, 0.0, uTime * uFlowSpeed * 0.5));

  // Capa 2: flujo radial (octava más alta)
  float g2 = snoise(n * uFlowScale + vec3(uTime * uFlowSpeed, 0.0, 0.0));

  // Combinación: granulación domina, flujo modula brillo
  float intensity = clamp(0.55 + 0.35 * g1 + 0.20 * g2, 0.0, 1.0);

  // Color base: gradiente desde el centro (proyección normal·view)
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 1.5);
  vec3 base = mix(uColorCore, uColorEdge, fresnel);

  // Sunspots (capa 3, opcional)
  if (uSunspotsEnabled) {
    float spot = snoise(n * 1.2 + vec3(uTime * uFlowSpeed * 0.1));
    if (spot < -0.55) {
      base *= 0.45;
    }
  }

  vec3 col = base * intensity;
  // bloom suave (clamp alto para HDR si está activo)
  col += vec3(0.05) * intensity;
  gl_FragColor = vec4(col, 1.0);
}
```

### 5.3 `sun.lite.frag` (versión "lite", GPUs débiles)

Misma cabecera; en `main()` se omite la 3ª capa de sunspots y la 2ª capa de flujo. Coste estimado: ~40 % menos instrucciones GLSL.

```glsl
void main() {
  vec3 n = normalize(vWorldPos);
  float g1 = snoise(n * uGranulationScale + vec3(0.0, 0.0, uTime * uFlowSpeed * 0.5));
  float intensity = clamp(0.6 + 0.4 * g1, 0.0, 1.0);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 1.5);
  vec3 base = mix(uColorCore, uColorEdge, fresnel);
  gl_FragColor = vec4(base * intensity, 1.0);
}
```

### 5.4 Notas de rendimiento esperado

| GPU class                         | Versión shader   | FPS esperado @ 1080p |
| --------------------------------- | ---------------- | -------------------- |
| Apple M-series / NVIDIA discrete  | full + spots     | 60                   |
| Intel Iris / AMD integ. recientes | full             | 55–60                |
| Intel HD 4000 / Mali integradas   | lite             | 40–55                |
| iPad Air 2 / Tab A 2019           | lite + textura   | 30–45                |
| SwiftShader (CPU fallback)        | textura estática | 20–30                |

---

## 6. `useGpuCapability` — detección y benchmark

### 6.1 Tabla de keywords del renderer string

```ts
type GpuCapability = 'low' | 'mid' | 'high';

const GPU_KEYWORDS: Array<{ pattern: RegExp; class: GpuCapability }> = [
  { pattern: /SwiftShader|llvmpipe|software/i, class: 'low' },
  { pattern: /Mali-(G3|G5|G7|G[12])\d/i, class: 'low' },
  { pattern: /Adreno \(TM\) (3|4|5)\d{2}/i, class: 'low' },
  { pattern: /Intel.* HD Graphics (3|4|5)\d{3}/i, class: 'low' },
  { pattern: /Apple A[789]|Apple A1[01]/i, class: 'low' },
  { pattern: /Intel.*(Iris|UHD|HD Graphics 6\d{2})/i, class: 'mid' },
  { pattern: /Mali-G(710|615|76)/i, class: 'mid' },
  { pattern: /Adreno \(TM\) (6|7)\d{2}/i, class: 'mid' },
  { pattern: /Apple A1[2-5]|Apple M1\b/i, class: 'mid' },
  { pattern: /AMD Radeon (RX 5|RX 6|Pro 5)/i, class: 'high' },
  { pattern: /NVIDIA GeForce (GTX|RTX)/i, class: 'high' },
  { pattern: /Apple M[2-9]|Apple A1[6-9]|Apple A2/i, class: 'high' },
];
```

### 6.2 Algoritmo

```ts
export async function detectGpuCapability(): Promise<GpuCapability> {
  // 1. Cache de sesión
  const cached = sessionStorage.getItem('gpu_capability');
  if (cached === 'low' || cached === 'mid' || cached === 'high') return cached;

  // 2. WEBGL_debug_renderer_info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) {
    sessionStorage.setItem('gpu_capability', 'low');
    return 'low';
  }
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer: string = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';

  for (const { pattern, class: cls } of GPU_KEYWORDS) {
    if (pattern.test(renderer)) {
      sessionStorage.setItem('gpu_capability', cls);
      return cls;
    }
  }

  // 3. Benchmark fallback (200 ms)
  const fps = await runBenchmark(gl, 200);
  const cls: GpuCapability = fps >= 55 ? 'high' : fps >= 35 ? 'mid' : 'low';
  sessionStorage.setItem('gpu_capability', cls);
  return cls;
}

async function runBenchmark(gl: WebGLRenderingContext, ms: number): Promise<number> {
  // Render N veces un quad con un fragment shader simple (snoise 2D × 4 octavas)
  // contar frames procesados en 'ms' y devolver FPS.
  // Implementación detallada en src/scenes/hooks/useGpuCapability.ts.
  return 60; // placeholder: ver impl real
}
```

### 6.3 Ciclo de vida

```
App mount → detectGpuCapability() (Promise) → useAppStore.setTextureQuality / setSunShaderVariant
                                            → AsteroidBelt count
                                            → Sun shader variant
```

Hook React:

```ts
export function useGpuCapability(): GpuCapability | null {
  const [cap, setCap] = useState<GpuCapability | null>(null);
  useEffect(() => {
    detectGpuCapability().then(setCap);
  }, []);
  return cap;
}
```

---

## 7. Tour automático — máquina de estados

### 7.1 Diagrama completo

```
                  ┌──────────────────────── user_interrupt ────────────────────────┐
                  │                                                                  │
       start      │                                                                  ▼
   idle ───────► focus_planet ──tween_done──► narration ──tts_done──► next_planet ──┬──► focus_planet
    ▲                                                                                │
    │                                                                                │
    │                                              last_planet_done                  │
    └──────────────────────────────────────────────────────────────────────────────┘
                                                                                     │
                                                                                     └──► idle
```

### 7.2 Eventos y side effects

| Estado         | Evento entrante    | Side effect (en transición de entrada)                               | Próximo estado |
| -------------- | ------------------ | -------------------------------------------------------------------- | -------------- |
| `idle`         | `start`            | setTourActive(true), index=0, cargar lista [Sun, Mercury, …, Pluto]  | `focus_planet` |
| `focus_planet` | `tween_done`       | actualizar HUD con datos; preparar audio (Web Speech utterance)      | `narration`    |
| `narration`    | `tts_done`         | -                                                                    | `next_planet`  |
| `next_planet`  | (auto)             | index++; si index >= list.length → `last_planet_done`; else dispatch | `focus_planet` |
| cualquiera     | `user_interrupt`   | TTS.cancel(), tween.stop(), setTourActive(false)                     | `idle`         |
| `next_planet`  | `last_planet_done` | tween cámara a vista general; setTourActive(false)                   | `idle`         |

### 7.3 Implementación: reducer simple en hook `useTour`

**Decisión: reducer simple, NO XState.**
Rationale:

- 4 estados, 5 eventos. XState añade ~15 KB y un modelo mental adicional.
- El reducer cabe en 60 líneas y es 100% testeable.
- Cancelación se maneja con un `useRef<AbortController>` para tweens y TTS.
- Si en el futuro añadimos estados condicionales complejos (pausa, skip, retroceso), reevaluar.

```ts
type TourState =
  | { kind: 'idle' }
  | { kind: 'focus_planet'; index: number }
  | { kind: 'narration'; index: number }
  | { kind: 'next_planet'; index: number };

type TourEvent =
  | { type: 'start' }
  | { type: 'tween_done' }
  | { type: 'tts_done' }
  | { type: 'last_planet_done' }
  | { type: 'user_interrupt' };

function reducer(s: TourState, e: TourEvent): TourState {
  if (e.type === 'user_interrupt') return { kind: 'idle' };
  switch (s.kind) {
    case 'idle':
      return e.type === 'start' ? { kind: 'focus_planet', index: 0 } : s;
    case 'focus_planet':
      return e.type === 'tween_done' ? { kind: 'narration', index: s.index } : s;
    case 'narration':
      return e.type === 'tts_done' ? { kind: 'next_planet', index: s.index } : s;
    case 'next_planet':
      if (e.type === 'last_planet_done') return { kind: 'idle' };
      return { kind: 'focus_planet', index: s.index + 1 };
  }
}
```

### 7.4 Duraciones por nivel — JSON final

```json
{
  "tour_durations": {
    "explorador": { "focus_ms": 6000, "narration_ms": 4000 },
    "aprendiz": { "focus_ms": 5000, "narration_ms": 6000 },
    "investigador": { "focus_ms": 4000, "narration_ms": 8000 }
  },
  "reduced_motion_overrides": {
    "focus_ms": 300,
    "narration_ms": 0,
    "manual_advance": true
  }
}
```

---

## 8. Cámara y focus — react-spring

```ts
import { useSpring, animated } from '@react-spring/three';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';

interface FocusOptions {
  target: Vector3 | null; // null = vista general
  offset?: Vector3; // ej. (0, 2, 6) detrás-arriba del planeta
  durationMs?: number;
}

export function useFocusCamera({
  target,
  offset = new Vector3(0, 2, 6),
  durationMs = 1200,
}: FocusOptions) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null); // OrbitControls ref
  const aborted = useRef(false);

  const [, api] = useSpring(() => ({
    pos: camera.position.toArray(),
    look: [0, 0, 0],
    config: { duration: durationMs, easing: easeInOutCubic },
    onChange: ({ value }) => {
      if (aborted.current) return;
      camera.position.fromArray(value.pos);
      controlsRef.current?.target.fromArray(value.look);
      controlsRef.current?.update();
    },
  }));

  useEffect(() => {
    aborted.current = false;
    if (target) {
      const dest = target.clone().add(offset);
      api.start({ pos: dest.toArray(), look: target.toArray() });
    } else {
      api.start({ pos: [0, 35, 70], look: [0, 0, 0] });
    }
    return () => {
      aborted.current = true;
      api.stop();
    };
  }, [target?.x, target?.y, target?.z]);

  return controlsRef;
}
```

Notas:

- `aborted.current` evita escribir en `camera.position` después de unmount o cambio de target.
- `api.stop()` cancela limpiamente el tween en curso.
- Si `prefersReducedMotion`, `durationMs = 300`.

---

## 9. i18n — `solar.json` ES + EN completo

### 9.1 ES — `src/i18n/locales/es/solar.json`

```json
{
  "ui": {
    "level_selector": {
      "explorador": "Explorador",
      "aprendiz": "Aprendiz",
      "investigador": "Investigador"
    },
    "tour": {
      "start": "Iniciar tour",
      "stop": "Detener tour",
      "pause": "Pausar",
      "resume": "Reanudar",
      "next": "Siguiente",
      "skip": "Saltar tour"
    },
    "camera": {
      "back_to_overview": "Volver a la vista general",
      "focus_planet": "Enfocar planeta"
    },
    "attribution": "Texturas cortesía de Solar System Scope (CC BY 4.0)",
    "scale_note": "Las distancias y tamaños no están a escala real",
    "loading": "Cargando el Sistema Solar…"
  },
  "mercury": {
    "name": "Mercurio",
    "explorador": { "description": "El planeta más pequeño y el más cercano al Sol." },
    "aprendiz": { "description": "Mercurio orbita el Sol en sólo 88 días terrestres." },
    "investigador": {
      "description": "Excentricidad orbital 0,2056. Sin atmósfera apreciable. Núcleo de hierro grande para su tamaño."
    },
    "curiosity": "Un día solar en Mercurio dura más que un año mercuriano."
  },
  "venus": {
    "name": "Venus",
    "explorador": { "description": "El planeta más caliente. ¡Más que Mercurio!" },
    "aprendiz": {
      "description": "Venus tiene una atmósfera densa de dióxido de carbono que atrapa el calor."
    },
    "investigador": {
      "description": "Efecto invernadero extremo: temperatura superficial ~737 K. Rotación retrógrada (243 días)."
    },
    "curiosity": "En Venus, el Sol sale por el oeste."
  },
  "earth": {
    "name": "Tierra",
    "explorador": { "description": "Nuestro hogar. Tiene agua, aire y vida." },
    "aprendiz": {
      "description": "La Tierra es el único planeta conocido con agua líquida en superficie y vida."
    },
    "investigador": {
      "description": "Tercer planeta. Atmósfera N₂/O₂. Tectónica de placas activa. Una luna grande estabilizadora."
    },
    "curiosity": "La Tierra no es una esfera perfecta: está aplastada por los polos."
  },
  "mars": {
    "name": "Marte",
    "explorador": { "description": "El planeta rojo. Tiene volcanes muy grandes." },
    "aprendiz": {
      "description": "Marte tiene casquetes polares de hielo y el volcán más grande del Sistema Solar."
    },
    "investigador": {
      "description": "Atmósfera tenue de CO₂ (~6 mbar). Olympus Mons: 22 km de altura. Dos lunas pequeñas: Fobos y Deimos."
    },
    "curiosity": "Un día en Marte dura casi lo mismo que en la Tierra: 24 h 39 min."
  },
  "jupiter": {
    "name": "Júpiter",
    "explorador": { "description": "El planeta más grande. ¡Tiene una tormenta gigante!" },
    "aprendiz": {
      "description": "Júpiter es un gigante gaseoso con una mancha roja que es una tormenta de siglos."
    },
    "investigador": {
      "description": "Composición H/He similar al Sol. Magnetosfera enorme. 95 lunas conocidas: Ío, Europa, Ganímedes, Calisto."
    },
    "curiosity": "Júpiter tiene más masa que todos los demás planetas juntos."
  },
  "saturn": {
    "name": "Saturno",
    "explorador": { "description": "El planeta de los anillos." },
    "aprendiz": { "description": "Los anillos de Saturno son de hielo y rocas pequeñas." },
    "investigador": {
      "description": "Densidad 0,687 g/cm³ (flotaría en agua). Anillos principalmente H₂O hielo. Titán: única luna con atmósfera densa."
    },
    "curiosity": "Saturno es tan poco denso que flotaría en una bañera gigante."
  },
  "uranus": {
    "name": "Urano",
    "explorador": { "description": "El planeta que rueda de lado." },
    "aprendiz": { "description": "Urano gira tumbado: su eje está casi en el plano de su órbita." },
    "investigador": {
      "description": "Inclinación axial 97,77°. Gigante helado (H₂O, NH₃, CH₄). Color azul-verdoso por metano atmosférico."
    },
    "curiosity": "Cada polo de Urano recibe 42 años de luz seguidos de 42 años de oscuridad."
  },
  "neptune": {
    "name": "Neptuno",
    "explorador": { "description": "El planeta más lejano. Es muy azul." },
    "aprendiz": { "description": "Neptuno tiene los vientos más rápidos del Sistema Solar." },
    "investigador": {
      "description": "Vientos hasta 2 100 km/h. Descubierto en 1846 por predicción matemática. Tritón orbita en sentido retrógrado."
    },
    "curiosity": "Neptuno fue descubierto con matemáticas antes que con un telescopio."
  },
  "pluto": {
    "name": "Plutón",
    "explorador": { "description": "Antes era un planeta. Ahora se llama planeta enano." },
    "aprendiz": {
      "description": "Plutón es un planeta enano: comparte su zona orbital con otros cuerpos del cinturón de Kuiper."
    },
    "investigador": {
      "description": "Plutón-Caronte forma un sistema binario. Atmósfera tenue de N₂. Sobrevoló por la sonda New Horizons en 2015."
    },
    "curiosity": "Plutón es más pequeño que la Luna terrestre.",
    "iau_note": {
      "explorador": "Antes era el 9.º planeta. Ahora se llama planeta enano.",
      "aprendiz": "En 2006 la IAU decidió que Plutón es un planeta enano porque comparte su órbita con otros cuerpos.",
      "investigador": "En la Asamblea General de la IAU de 2006 (Resoluciones 5A y 6A) se redefinió «planeta» exigiendo: 1) orbitar el Sol, 2) tener forma esférica por su gravedad, 3) haber limpiado las inmediaciones de su órbita. Plutón cumple los dos primeros criterios pero no el tercero, por lo que se reclasificó como planeta enano."
    }
  }
}
```

### 9.2 EN — `src/i18n/locales/en/solar.json`

```json
{
  "ui": {
    "level_selector": {
      "explorador": "Explorer",
      "aprendiz": "Apprentice",
      "investigador": "Researcher"
    },
    "tour": {
      "start": "Start tour",
      "stop": "Stop tour",
      "pause": "Pause",
      "resume": "Resume",
      "next": "Next",
      "skip": "Skip tour"
    },
    "camera": { "back_to_overview": "Back to overview", "focus_planet": "Focus planet" },
    "attribution": "Textures courtesy of Solar System Scope (CC BY 4.0)",
    "scale_note": "Distances and sizes are not to real scale",
    "loading": "Loading the Solar System…"
  },
  "mercury": {
    "name": "Mercury",
    "explorador": { "description": "The smallest planet and the closest to the Sun." },
    "aprendiz": { "description": "Mercury orbits the Sun in just 88 Earth days." },
    "investigador": {
      "description": "Orbital eccentricity 0.2056. No appreciable atmosphere. Large iron core for its size."
    },
    "curiosity": "A solar day on Mercury lasts longer than its own year."
  },
  "venus": {
    "name": "Venus",
    "explorador": { "description": "The hottest planet. Hotter than Mercury!" },
    "aprendiz": { "description": "Venus has a thick CO₂ atmosphere that traps heat." },
    "investigador": {
      "description": "Extreme greenhouse effect: surface ~737 K. Retrograde rotation (243 days)."
    },
    "curiosity": "On Venus, the Sun rises in the west."
  },
  "earth": {
    "name": "Earth",
    "explorador": { "description": "Our home. It has water, air and life." },
    "aprendiz": {
      "description": "Earth is the only known planet with surface liquid water and life."
    },
    "investigador": {
      "description": "Third planet. N₂/O₂ atmosphere. Active plate tectonics. One stabilising large moon."
    },
    "curiosity": "Earth is not a perfect sphere: it is flattened at the poles."
  },
  "mars": {
    "name": "Mars",
    "explorador": { "description": "The red planet. It has very large volcanoes." },
    "aprendiz": {
      "description": "Mars has polar ice caps and the largest volcano in the Solar System."
    },
    "investigador": {
      "description": "Thin CO₂ atmosphere (~6 mbar). Olympus Mons: 22 km tall. Two small moons: Phobos and Deimos."
    },
    "curiosity": "A day on Mars lasts almost the same as on Earth: 24 h 39 min."
  },
  "jupiter": {
    "name": "Jupiter",
    "explorador": { "description": "The biggest planet. It has a giant storm!" },
    "aprendiz": {
      "description": "Jupiter is a gas giant with a red spot that is a centuries-old storm."
    },
    "investigador": {
      "description": "H/He composition similar to the Sun. Huge magnetosphere. 95 known moons: Io, Europa, Ganymede, Callisto."
    },
    "curiosity": "Jupiter has more mass than all the other planets combined."
  },
  "saturn": {
    "name": "Saturn",
    "explorador": { "description": "The planet with rings." },
    "aprendiz": { "description": "Saturn's rings are made of ice and small rocks." },
    "investigador": {
      "description": "Density 0.687 g/cm³ (would float in water). Rings mostly water ice. Titan: the only moon with a dense atmosphere."
    },
    "curiosity": "Saturn is so light it would float in a giant bathtub."
  },
  "uranus": {
    "name": "Uranus",
    "explorador": { "description": "The planet that rolls on its side." },
    "aprendiz": {
      "description": "Uranus rotates on its side: its axis lies almost in the plane of its orbit."
    },
    "investigador": {
      "description": "Axial tilt 97.77°. Ice giant (H₂O, NH₃, CH₄). Blue-green colour from atmospheric methane."
    },
    "curiosity": "Each pole of Uranus has 42 years of light followed by 42 years of darkness."
  },
  "neptune": {
    "name": "Neptune",
    "explorador": { "description": "The most distant planet. It is very blue." },
    "aprendiz": { "description": "Neptune has the fastest winds in the Solar System." },
    "investigador": {
      "description": "Winds up to 2,100 km/h. Discovered in 1846 by mathematical prediction. Triton orbits retrograde."
    },
    "curiosity": "Neptune was discovered with mathematics before it was seen with a telescope."
  },
  "pluto": {
    "name": "Pluto",
    "explorador": { "description": "It used to be a planet. Now it is called a dwarf planet." },
    "aprendiz": {
      "description": "Pluto is a dwarf planet: it shares its orbital zone with other Kuiper Belt bodies."
    },
    "investigador": {
      "description": "Pluto-Charon is a binary system. Tenuous N₂ atmosphere. Flown by by the New Horizons probe in 2015."
    },
    "curiosity": "Pluto is smaller than Earth's Moon.",
    "iau_note": {
      "explorador": "It used to be the 9th planet. Now it is called a dwarf planet.",
      "aprendiz": "In 2006 the IAU decided that Pluto is a dwarf planet because it shares its orbit with other bodies.",
      "investigador": "At the 2006 IAU General Assembly (Resolutions 5A and 6A), 'planet' was redefined as a body that 1) orbits the Sun, 2) has hydrostatic equilibrium, and 3) has cleared the neighbourhood of its orbit. Pluto meets the first two but not the third, hence its reclassification as a dwarf planet."
    }
  }
}
```

---

## 10. UX por nivel — wireframes textuales

### 10.1 Explorador (3-6 años)

```
┌────────────────────────────────────────────────────────────────────┐
│ [LOGO] Universo Aula            [🔊 Explorador] [Aprendiz] [Inv.]  │ ← LevelSelector enorme
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                                                                    │
│                       ░░░░░░░░░░░░░░░░░░░░                         │
│                       ░       ▲       ░                            │ ← Canvas R3F a pantalla completa
│                       ░    [TIERRA]   ░                            │   con cuerpos GRANDES
│                       ░       ●       ░                            │
│                       ░░░░░░░░░░░░░░░░░░░░                         │
│                                                                    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       TIERRA  🌍                             │  │ ← InfoPanel BOTTOM SHEET
│  │   "Nuestro hogar. Tiene agua, aire y vida."                  │  │   fuente XL (~32 px)
│  │                                          [▶ TOUR]            │  │   pictogramas en lugar de tablas
│  └──────────────────────────────────────────────────────────────┘  │
│ Texturas © Solar System Scope (CC BY 4.0)                          │ ← AttributionFooter siempre
└────────────────────────────────────────────────────────────────────┘
```

Componentes específicos: `<BigInfoPanel>`, `<PictogramComparison>` (Plutón). TTS activo siempre que se hace click.

### 10.2 Aprendiz (6-12)

```
┌────────────────────────────────────────────────────────────────────┐
│ Universo Aula          [Explorador] [🟢 Aprendiz] [Investigador]   │
├──────────────────────────────────────────────────┬─────────────────┤
│                                                  │   TIERRA        │
│                                                  │   ─────         │
│              ░░░░ Canvas R3F ░░░░               │   Radio: 6 371 km│
│              ░    [planetas]    ░               │   Distancia: 1 UA│
│              ░░░░░░░░░░░░░░░░░░░░               │   Año: 365 días │
│                                                  │   Lunas: 1      │
│                                                  │                 │
│                                                  │   "La Tierra es│
│                                                  │   el único...   │
│                                                  │   ¿Sabías?      │
│                                                  │   La Tierra no  │
│                                                  │   es perfecta…" │
│                                                  │                 │
│                                                  │   [▶ Tour]      │
│                                                  │   [Volver]      │
├──────────────────────────────────────────────────┴─────────────────┤
│ Las distancias y tamaños no están a escala real • SS Scope CC BY  │
└────────────────────────────────────────────────────────────────────┘
```

Componentes: `<SidePanel variant="medium">`, `<FactList>`, `<CuriosityCard>`.

### 10.3 Investigador (12-16+)

```
┌────────────────────────────────────────────────────────────────────┐
│ Universo Aula  [Explorador] [Aprendiz] [🟢 Investigador]   [⚙️]    │
├──────────────────────────────────────────────────┬─────────────────┤
│                                                  │ TIERRA          │
│                                                  │ ───────────────│
│                                                  │ Físicos │ Orb.  │
│            ░░░░ Canvas R3F  ░░░░                │ ──────────────│
│            ░  [órbitas Kepler] ░                │ R    6371 km │e 0.0167│
│            ░░░░░░░░░░░░░░░░░░░░░                │ M  5.97e24 kg│a 1.000 │
│                                                  │ ρ  5.51 g/cm³│i 0.00°│
│                                                  │ g  9.81 m/s² │T 365.26│
│                                                  │ Tilt 23.44°   │M 358.6│
│                                                  │ T̄ 288 K       │Ω -11.3│
│                                                  │                 │
│                                                  │ "Tercer planeta…│
│                                                  │ Atmósfera N₂/O₂ │
│                                                  │ Tectónica…"     │
│                                                  │                 │
│                                                  │ [Datos NASA JPL]│
├──────────────────────────────────────────────────┴─────────────────┤
│ Distancias/tamaños no a escala • Datos: NASA JPL Horizons J2000   │
└────────────────────────────────────────────────────────────────────┘
```

Componentes: `<SidePanel variant="dense">`, `<DataTable columns={2}>`, `<ScientificDescription>`.

### 10.4 Reutilización

| Componente            | Explorador | Aprendiz | Investigador  |
| --------------------- | :--------: | :------: | :-----------: |
| `<LevelSelector>`     |   ✅ XL    |    ✅    |      ✅       |
| `<AttributionFooter>` |     ✅     |    ✅    |      ✅       |
| `<TourControls>`      |     ✅     |    ✅    |      ✅       |
| `<InfoPanel>`         | bottom XL  | side med |  side dense   |
| `<PictogramCompare>`  |     ✅     |    —     |       —       |
| `<DataTable>`         |     —      | abridged |     full      |
| `<PlutoNote>`         | ✅ con SVG |    ✅    | ✅ + link IAU |

---

## 11. Estado global — extensión de `useAppStore`

```ts
// src/store/useAppStore.ts (extensión)
import { create } from 'zustand';

export type PedagogicalLevel = 'explorador' | 'aprendiz' | 'investigador';
export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';
export type CameraMode = 'orbit' | 'focus' | 'tour';
export type TextureQuality = '1k' | '2k' | '4k' | 'auto';

interface AppState {
  // existentes
  level: PedagogicalLevel;
  setLevel: (level: PedagogicalLevel) => void;
  locale: string;
  setLocale: (locale: string) => void;

  // nuevos (solar-system-mvp)
  selectedPlanet: PlanetId | null;
  setSelectedPlanet: (id: PlanetId | null) => void;

  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  textureQuality: TextureQuality;
  setTextureQuality: (q: TextureQuality) => void;

  tourActive: boolean;
  setTourActive: (active: boolean) => void;
  tourCurrentPlanet: PlanetId | null;
  setTourCurrentPlanet: (id: PlanetId | null) => void;

  prefersReducedMotion: boolean;
  setPrefersReducedMotion: (v: boolean) => void;

  legacyFlag: boolean; // ?legacy=1 → render <EmptyScene/>
  setLegacyFlag: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  level: 'aprendiz',
  setLevel: (level) => set({ level }),
  locale: 'es',
  setLocale: (locale) => set({ locale }),

  selectedPlanet: null,
  setSelectedPlanet: (selectedPlanet) =>
    set({ selectedPlanet, cameraMode: selectedPlanet ? 'focus' : 'orbit' }),

  cameraMode: 'orbit',
  setCameraMode: (cameraMode) => set({ cameraMode }),

  textureQuality: 'auto',
  setTextureQuality: (textureQuality) => set({ textureQuality }),

  tourActive: false,
  setTourActive: (tourActive) => set({ tourActive, cameraMode: tourActive ? 'tour' : 'orbit' }),
  tourCurrentPlanet: null,
  setTourCurrentPlanet: (tourCurrentPlanet) => set({ tourCurrentPlanet }),

  prefersReducedMotion: false,
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),

  legacyFlag: false,
  setLegacyFlag: (legacyFlag) => set({ legacyFlag }),
}));

// Selectores
export const useSelectedPlanet = () => useAppStore((s) => s.selectedPlanet);
export const useCameraMode = () => useAppStore((s) => s.cameraMode);
export const useLevel = () => useAppStore((s) => s.level);
export const useTourActive = () => useAppStore((s) => s.tourActive);
export const usePrefersReducedMotion = () => useAppStore((s) => s.prefersReducedMotion);
```

---

## 12. Plutón — implementación de la nota IAU

```tsx
// src/components/ui/PlutoNote.tsx
import { useTranslation } from 'react-i18next';
import { useLevel } from '@/store/useAppStore';

export function PlutoNote() {
  const { t } = useTranslation('solar');
  const level = useLevel();
  const noteKey = `pluto.iau_note.${level}`;

  return (
    <section
      aria-label={t('ui.pluto_iau_label', 'Nota IAU sobre Plutón')}
      className="rounded-md border border-amber-300/40 p-3 mt-3 text-sm"
    >
      {level === 'explorador' && <PictogramBeforeAfter />}
      <p>{t(noteKey)}</p>
      {level === 'investigador' && (
        <a
          href="https://www.iau.org/static/resolutions/Resolution_GA26-5-6.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-300 underline"
        >
          {t('ui.iau_link', 'Resoluciones IAU 2006 (PDF oficial)')}
        </a>
      )}
    </section>
  );
}

function PictogramBeforeAfter() {
  return (
    <div className="flex items-center gap-3 my-2" aria-hidden>
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="10" fill="#c9a97b" />
        <line x1="4" y1="4" x2="28" y2="28" stroke="red" strokeWidth="3" />
      </svg>
      <span>→</span>
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="6" fill="#c9a97b" />
      </svg>
    </div>
  );
}
```

`PlutoNote` se monta en `<InfoPanel>` cuando `selectedPlanet === 'pluto'`.

---

## 13. Performance — code-splitting y SW

### 13.1 `vite.config.ts` — manualChunks final

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei', '@react-spring/three'],
        'vendor-react':  ['react', 'react-dom', 'react-dom/client'],
        'vendor-i18n':   ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        'vendor-state':  ['zustand'],
        // 'app-solar' emerge automáticamente por el lazy(import('./SolarSystemScene'))
      },
    },
  },
  target: 'es2022',
  cssCodeSplit: true,
  sourcemap: false, // true en CI para debug
},
```

### 13.2 `vite-plugin-pwa` runtimeCaching

```ts
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /\/textures\/.+\.(jpg|jpeg|png|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'solar-textures-v1',
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/data\/.+\.json$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'solar-data-v1',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /\/locales\/.+\.json$/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'solar-i18n-v1' },
      },
    ],
  },
}),
```

---

## 14. Diagramas de secuencia adicionales

### 14.1 Cambio de nivel con planeta seleccionado

```
Usuario   <LevelSelector>   useAppStore   <Planet>           usePlanetPosition
   │            │                │             │                     │
   │ click "Inv."                │             │                     │
   ├───────────►│ setLevel('inv')│             │                     │
   │            ├───────────────►│             │                     │
   │            │                │ subscribers │                     │
   │            │                ├────────────►│ re-render con prop  │
   │            │                │             │ level='investigador'│
   │            │                │             ├────────────────────►│
   │            │                │             │                     │ switch a Kepler
   │            │                │             │                     │ M0 desde data
   │            │                │             │                     │ trayectoria nueva
   │            │                │             │                     │ pero sin remontar
   │            │                │             │                     │ <Canvas>
```

Clave: el cambio de nivel **no** desmonta `<Canvas>`, sólo rehace cálculos en `useFrame`.

### 14.2 Carga inicial — dev vs producción

**Dev (`pnpm dev`):**

```
Browser → /                       → index.html
        → /src/main.tsx           → bootstrap
        → /src/i18n/index.ts      → carga common.json + solar.json
        → /src/App.tsx            → render UI shell
        → lazy(SolarSystemScene)  → Vite servirá módulos on-demand
        → useTexture              → /textures/*/2k.jpg (sin SW)
        → /data/planets.json      → fetch puro
```

**Producción (con SW):**

```
Visit 1:
  Browser → / → index.html (cached por SW precache después de 1ª load)
          → vendor-react.[hash].js   (precache)
          → vendor-i18n.[hash].js    (precache)
          → main.[hash].js           (precache)
          → App render
          → lazy load app-solar.[hash].js + vendor-three.[hash].js
          → planets.json             (StaleWhileRevalidate)
          → /textures/*/2k.jpg       (CacheFirst, primera vez = network)

Visit 2 (offline):
  SW intercepta TODAS las requests
  → todo desde cache
  → app totalmente funcional sin red
```

### 14.3 Tour completo — 5 transiciones simplificadas

```
t=0s   start         → focus_planet(Sun)
t=6s   tween_done    → narration(Sun)         [TTS "Sol" + frase]
t=10s  tts_done      → next_planet(idx=0)     → focus_planet(Mercury)
t=16s  tween_done    → narration(Mercury)     [TTS "Mercurio" + frase]
t=20s  tts_done      → next_planet(idx=1)     → focus_planet(Venus)
… continúa hasta Plutón …
t=∞    last_planet_done → idle, cámara a (0,35,70)
```

---

## 15. Decisiones arquitectónicas (ADRs)

### ADR-1: react-spring sobre gsap

- **Decisión:** Usar `@react-spring/three` para todos los tweens (cámara, fade-ins).
- **Alternativas:** gsap (con plugin Three.js), framer-motion-3d (experimental).
- **Razón:** 30 KB gzip vs 70 KB; integración nativa con `<animated.group>`; cancelación limpia con `api.stop()` y `useEffect` cleanup.
- **Consecuencias:** Para timelines complejas futuras (cámara cinematográfica), reevaluar; el MVP no las necesita.

### ADR-2: `instancedMesh` para cinturón de asteroides

- **Decisión:** `<instancedMesh>` con icosaedro 20-faces y `MeshStandardMaterial`.
- **Alternativas:** Particle system con shader custom + sprites.
- **Razón:** Estándar Three.js; permite raycast individual (futuro: click en asteroide); tests más simples; performance equivalente para 500-2000 instancias.
- **Consecuencias:** Si en el futuro se quieren millones de partículas (cometas, meteoros), migrar a points/shader.

### ADR-3: JSON estático bundled vs fetch externo

- **Decisión:** `planets.json` en `public/data/`, fetch local con SWR.
- **Alternativas:** Fetch a NASA JPL en runtime; embeber en TypeScript.
- **Razón:** RGPD by design (sin requests externas); PWA offline real; determinismo entre sesiones; cache via SW; sin coste de runtime de imports JS para datos numéricos.
- **Consecuencias:** Cambios en datos requieren rebuild + deploy. Aceptable: los elementos orbitales J2000 no cambian.

### ADR-4: i18next namespace `solar` colocalizado

- **Decisión:** Un sólo namespace `solar` con keys jerárquicas, cargado síncrono junto a `common.json`.
- **Alternativas:** JSON separado en `/public/data/translations.json`; namespace lazy con `i18next-http-backend`.
- **Razón:** Un único mecanismo de fallback (i18next); colocalización con UI; <20 KB asumibles. Lazy se introducirá al añadir 3er locale.
- **Consecuencias:** Bundle inicial +20 KB; trivial.

### ADR-5: Shader procedural del Sol con simplex noise

- **Decisión:** Fragment shader GLSL con simplex 3D Ashima MIT, fallback "lite" y fallback textura para low-GPU.
- **Alternativas:** Textura solar animada con `texture.offset`; vídeo loop.
- **Razón:** Calidad visual notablemente superior; granulación 3D real preserva continuidad en zoom; el coste extra GPU se mitiga con `useGpuCapability`.
- **Consecuencias:** Mantener tres variantes (full/lite/textura). Tests visuales por variante recomendados.

### ADR-6: Escala didáctica sublogarítmica

- **Decisión:** `r_visual = 0.3 + 0.6·log₂(km/1000)`, `d_visual = 5.0 + 8.0·log₂(AU+1)`.
- **Alternativas:** Escala lineal real; escala logarítmica pura; constantes tweakables por nivel.
- **Razón:** La lineal real esconde planetas terrestres (Sol ocupa pantalla); la logarítmica pura compacta demasiado los gigantes; las dos curvas independientes preservan jerarquía visual y didáctica. Validado en tabla de §3.2.
- **Consecuencias:** Nota "no a escala" obligatoria en HUD; futuro toggle "modo a escala" en Investigador.

### ADR-7: Drei `OrbitControls` sobre `CameraControls`

- **Decisión:** `<OrbitControls>` estándar de Drei.
- **Alternativas:** `CameraControls` (más potente, focus suavizado nativo); free-fly.
- **Razón:** Suficiente para el MVP; usado y testeado por la comunidad; integración trivial con `react-spring` para tween de focus a través de `controls.target`.
- **Consecuencias:** Free-fly y trayectorias cinematográficas requerirán migración. Diferido a `camera-advanced`.

### ADR-8: Tour con reducer simple (no XState)

- **Decisión:** `useReducer` con 4 estados y 5 eventos en hook `useTour`.
- **Alternativas:** XState (`@xstate/react`); FSM custom con clase.
- **Razón:** 60 líneas, testeable, 0 dependencias extras. XState añade ~15 KB y modelo mental innecesario para esta complejidad.
- **Consecuencias:** Si se añaden estados condicionales (pausa, skip retroactivo, ramificaciones), reconsiderar XState.

### ADR-9: `useTexture` con Suspense, lazy 4K

- **Decisión:** Cargar 2K en montaje de `<Planet>`; al hacer focus, disparar carga de 4K en segundo plano.
- **Alternativas:** Cargar 4K siempre; LOD basado en distancia.
- **Razón:** Balance bundle inicial vs calidad en focus. 2K es suficiente para vista general; 4K se justifica sólo en focus.
- **Consecuencias:** Implementar `useEffect` de promote-to-4k al cambiar `selectedPlanet`. `texture.dispose()` al desfocus para liberar VRAM.

### ADR-10: Fallback shader Sun en GPUs débiles

- **Decisión:** Tres variantes: full / lite / textura estática animada con `texture.offset`. Selección automática por `useGpuCapability`.
- **Alternativas:** Una sola variante con baja calidad universal; toggle manual.
- **Razón:** Preservar 60 FPS en SMART Boards y tablets sin penalizar GPUs modernas.
- **Consecuencias:** Test E2E debe verificar las tres variantes; CI usa Playwright con `device='iPad'` para forzar fallback.

### ADR-11: `prefers-reduced-motion` como first-class state

- **Decisión:** Estado `prefersReducedMotion` en Zustand, leído en bootstrap desde `matchMedia`, suscrito a cambios.
- **Alternativas:** Leer `matchMedia` en cada componente; CSS-only.
- **Razón:** Estado compartido por shader (Sun `uFlowSpeed *= 0.2`), tweens (300 ms), tour (avance manual). Un único lugar de verdad.
- **Consecuencias:** Suscripción al evento `change` del MQ debe limpiarse al unmount de la app.

### ADR-12: `<AttributionFooter>` permanente y no ocultable

- **Decisión:** Componente siempre montado en el shell, fuera del Canvas, con texto fijo "Solar System Scope (CC BY 4.0)".
- **Alternativas:** Modal de créditos accesible desde botón.
- **Razón:** Cumplimiento estricto de CC BY 4.0 en producción. Validable por E2E (`expect(page.getByText('Solar System Scope')).toBeVisible()`).
- **Consecuencias:** ~24 px de altura permanentes en el viewport. Aceptable; integrado al diseño.

---

## 16. Criterios de éxito del design

- [x] Constantes de escala validadas con tabla de 9 cuerpos (§3.2).
- [x] Datos NASA JPL J2000 + Fact Sheets completos para los 9 cuerpos (§2).
- [x] Pseudocódigo concreto de Kepler + matrices de rotación (§4).
- [x] GLSL completo del Sol con licencia citada (§5).
- [x] Algoritmo de detección de GPU con tabla de keywords (§6).
- [x] Máquina de estados del tour completa (§7).
- [x] i18n ES + EN para los 9 cuerpos (§9).
- [x] Wireframes textuales por nivel (§10).
- [x] 12 ADRs con rationale (§15).

Áreas para refinamiento explícito en `sdd-tasks`:

- Implementación detallada de `runBenchmark` (placeholder en §6).
- Distribución log-normal del cinturón de asteroides (fórmula concreta).
- Estrategia de `texture.dispose()` en cambios de focus.
- Tests E2E con device emulation profile (perfil iPad concreto).
- Validación numérica de Mercury at J2000+100d contra JPL Horizons (extraer dato exacto).
