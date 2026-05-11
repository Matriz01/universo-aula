// src/scenes/shaders/sun.frag
// Fragment shader completo del Sol procedural — GPU mid/high.
//
// Simplex 3D noise: Stefan Gustavson / Ashima Arts (MIT License)
// https://github.com/ashima/webgl-noise
// Copyright (C) 2011 by Ashima Arts (Simplex noise)
// Copyright (C) 2011-2016 by Stefan Gustavson (Classic noise and others)
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software.

precision highp float;

uniform float uTime;
uniform vec3  uColorCore;         // HDR: vec3(2.5, 2.0, 1.0) — luminancia > 0.85 para bloom
uniform vec3  uColorEdge;         // ej. vec3(1.0, 0.45, 0.10)
uniform float uGranulationScale;  // 3.0
uniform float uFlowScale;         // 8.0
uniform float uFlowSpeed;         // 0.20  (0.04 si prefers-reduced-motion)
uniform bool  uSunspotsEnabled;
uniform float uPerspectiveFactor; // 1.0 en global; ley de cuadrado inverso en local
uniform vec3  uEruptColor;        // HDR cálido: vec3(4.0, 2.5, 0.8) — erupciones solares

const float ERUPT_THRESH = 0.55;

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
  // Limb darkening muy sutil: exponente bajo para que el efecto sólo aparezca
  // en los bordes extremos del disco. El Sol no tiene cara oscura.
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 0.6);
  vec3 base = mix(uColorCore, uColorEdge, fresnel);

  // Capa 3: Sunspots con smoothstep — bordes orgánicos (REQ-SUN-2)
  if (uSunspotsEnabled) {
    float spot = snoise(n * 1.2 + vec3(uTime * uFlowSpeed * 0.1));
    float spotMask = 1.0 - smoothstep(-0.6, -0.5, spot);
    base = mix(base, base * 0.45, spotMask);
  }

  // Capa 4: Erupciones — noise de frecuencia media, desplazado en tiempo (REQ-SUN-1)
  // Escala 2.0 produce manchas de erupción de tamaño moderado (~1/4 del disco).
  // Velocidades 0.3/0.15 dan ciclos de ~10-30 s reales: visibles pero no ansiosas.
  float eruptNoise = snoise(n * 2.0 + vec3(uTime * uFlowSpeed * 0.3, uTime * uFlowSpeed * 0.15, 0.0));

  vec3 col = base * intensity;
  // bloom suave (clamp alto para HDR si está activo)
  col += vec3(0.05) * intensity;

  // Contribución aditiva de erupciones (solo cuando eruptNoise supera el umbral)
  if (eruptNoise > ERUPT_THRESH) {
    col += (eruptNoise - ERUPT_THRESH) / (1.0 - ERUPT_THRESH) * uEruptColor;
  }

  // Perspectiva: escalar el brillo según distancia del planeta al Sol (modo local)
  col *= uPerspectiveFactor;
  gl_FragColor = vec4(col, 1.0);
}
