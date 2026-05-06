/**
 * Tests del shader del Sol — verifican que los archivos GLSL contienen
 * los uniforms esperados y las palabras clave del diseño.
 *
 * Estrategia: importar los shaders como strings (Vite ?raw) y hacer
 * assertions sobre su contenido textual.
 */

import sunVert from '@/scenes/shaders/sun.vert?raw';
import sunFrag from '@/scenes/shaders/sun.frag?raw';
import sunFragLite from '@/scenes/shaders/sun.lite.frag?raw';

// ---------------------------------------------------------------------------
// sun.vert
// ---------------------------------------------------------------------------

describe('sun.vert — vertex shader passthrough', () => {
  it('expone el varying vNormal', () => {
    expect(sunVert).toContain('vNormal');
  });

  it('expone el varying vWorldPos', () => {
    expect(sunVert).toContain('vWorldPos');
  });

  it('expone el varying vUv', () => {
    expect(sunVert).toContain('vUv');
  });

  it('escribe gl_Position', () => {
    expect(sunVert).toContain('gl_Position');
  });

  it('usa normalMatrix para transformar la normal', () => {
    expect(sunVert).toContain('normalMatrix');
  });

  it('usa modelMatrix para calcular la posición en mundo', () => {
    expect(sunVert).toContain('modelMatrix');
  });
});

// ---------------------------------------------------------------------------
// sun.frag — versión completa (mid/high GPU)
// ---------------------------------------------------------------------------

describe('sun.frag — fragment shader completo', () => {
  it('declara uniform uTime', () => {
    expect(sunFrag).toContain('uTime');
  });

  it('declara uniform uColorCore', () => {
    expect(sunFrag).toContain('uColorCore');
  });

  it('declara uniform uColorEdge', () => {
    expect(sunFrag).toContain('uColorEdge');
  });

  it('declara uniform uGranulationScale', () => {
    expect(sunFrag).toContain('uGranulationScale');
  });

  it('declara uniform uFlowScale', () => {
    expect(sunFrag).toContain('uFlowScale');
  });

  it('declara uniform uFlowSpeed', () => {
    expect(sunFrag).toContain('uFlowSpeed');
  });

  it('declara uniform uSunspotsEnabled', () => {
    expect(sunFrag).toContain('uSunspotsEnabled');
  });

  it('escribe gl_FragColor', () => {
    expect(sunFrag).toContain('gl_FragColor');
  });

  it('contiene la función snoise (simplex noise)', () => {
    expect(sunFrag).toContain('snoise');
  });

  it('incluye crédito de licencia MIT Ashima Arts', () => {
    expect(sunFrag).toContain('MIT');
    expect(sunFrag).toContain('Ashima');
  });

  it('implementa condicional uSunspotsEnabled', () => {
    expect(sunFrag).toContain('uSunspotsEnabled');
  });

  it('usa fresnel / gradiente radial (dot vNormal viewDir)', () => {
    expect(sunFrag).toContain('fresnel');
  });

  it('usa cameraPosition en el cálculo', () => {
    expect(sunFrag).toContain('cameraPosition');
  });
});

// ---------------------------------------------------------------------------
// sun.lite.frag — versión lite (low GPU)
// ---------------------------------------------------------------------------

describe('sun.lite.frag — fragment shader lite', () => {
  it('declara uniform uTime', () => {
    expect(sunFragLite).toContain('uTime');
  });

  it('declara uniform uColorCore', () => {
    expect(sunFragLite).toContain('uColorCore');
  });

  it('declara uniform uColorEdge', () => {
    expect(sunFragLite).toContain('uColorEdge');
  });

  it('declara uniform uGranulationScale', () => {
    expect(sunFragLite).toContain('uGranulationScale');
  });

  it('declara uniform uFlowSpeed', () => {
    expect(sunFragLite).toContain('uFlowSpeed');
  });

  it('escribe gl_FragColor', () => {
    expect(sunFragLite).toContain('gl_FragColor');
  });

  it('contiene snoise (simplex noise necesario aunque sea lite)', () => {
    expect(sunFragLite).toContain('snoise');
  });

  it('NO contiene uSunspotsEnabled (variante lite sin sunspots)', () => {
    // La variante lite no tiene sunspots en absoluto
    expect(sunFragLite).not.toContain('uSunspotsEnabled');
  });

  it('NO contiene uFlowScale (variante lite sin segunda capa de flujo)', () => {
    expect(sunFragLite).not.toContain('uFlowScale');
  });
});
