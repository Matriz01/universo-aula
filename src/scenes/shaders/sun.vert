// src/scenes/shaders/sun.vert
// Vertex shader passthrough para el Sol procedural.
// Expone vNormal, vWorldPos y vUv al fragment shader.

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
