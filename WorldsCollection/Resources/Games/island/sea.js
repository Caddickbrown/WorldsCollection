/**
 * sea.js — Jerlov water shader for Island
 *
 * Implements physically-motivated water colour using the Jerlov (1976)
 * ocean water type classification. The 10 types span from crystal-clear
 * open ocean (Type I) to turbid coastal water (Coastal 9), driven by
 * algae, silt, and CDOM (coloured dissolved organic matter) concentrations.
 *
 * The core physics: water attenuates light as exp(-K_d * depth) where K_d
 * is the diffuse attenuation coefficient — different for R, G, B channels.
 * Clear water absorbs red fastest and blue slowest (hence the blue ocean).
 * Algae/CDOM absorb blue and scatter green, shifting the colour green/brown.
 *
 * Zone-to-Jerlov mapping for Island:
 *   Open ocean     → Type II    (jt = 0.3)  — classic blue-green Atlantic
 *   Sandy bay      → Type IB    (jt = 0.2)  — bright clear turquoise, sandy
 *   Hidden beach   → Type IB    (jt = 0.2)  — clear cove
 *   Kelp cove      → Coastal 3  (jt = 0.6)  — distinct green kelp tint
 *   Salt marsh     → Coastal 7  (jt = 0.8)  — murky greenish-brown
 *   Harbour/dock   → Coastal 5  (jt = 0.7)  — moderately turbid
 *   River mouth    → Coastal 5  (jt = 0.65) — where fresh meets salt
 *
 * Usage:
 *   import { createSeaMaterial, updateSea } from './sea.js';
 *   const seaMat = createSeaMaterial({ jerlovType: 0.3 });
 *   // per frame:
 *   updateSea(seaMat, elapsedSeconds, nightBlend, jerlovType);
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Jerlov type data — 10 types encoded as RGB absorption + backscatter coeffs.
// Derived from Jerlov (1976) and Morel & Prieur (1977) spectral measurements,
// converted to approximate RGB attenuation (per metre).
//
// Format per type: [Ka_R, Ka_G, Ka_B, Kb_R, Kb_G, Kb_B]
//   Ka = absorption coeff   Kb = backscattering coeff
//   apparent colour ≈ Kb / (Ka + Kb)  (Gordon et al. 1975)
//   depth attenuation ≈ exp(-(Ka + Kb) * depth)
//
// The 10 types in order:
//   0=Type I  1=Type IA  2=Type IB  3=Type II  4=Type III
//   5=Coastal 1  6=Coastal 3  7=Coastal 5  8=Coastal 7  9=Coastal 9
// ---------------------------------------------------------------------------
const JERLOV_DATA = /* glsl */`
// Ka: absorption [R, G, B] per metre
// Kb: backscatter [R, G, B] per metre
// Stored as vec3 pairs; index by floor(uJerlovType) and fract for lerp.
// 10 entries × 2 vec3s = 20 floats.

const vec3 KA[10] = vec3[10](
  vec3(0.40, 0.030, 0.015),  // Type I      — clearest open ocean
  vec3(0.42, 0.038, 0.018),  // Type IA
  vec3(0.44, 0.048, 0.022),  // Type IB
  vec3(0.48, 0.065, 0.032),  // Type II     — typical Atlantic
  vec3(0.55, 0.090, 0.050),  // Type III    — greener ocean
  vec3(0.60, 0.130, 0.080),  // Coastal 1
  vec3(0.65, 0.200, 0.130),  // Coastal 3   — kelp green
  vec3(0.70, 0.280, 0.200),  // Coastal 5   — harbour
  vec3(0.75, 0.380, 0.300),  // Coastal 7   — salt marsh
  vec3(0.80, 0.500, 0.420)   // Coastal 9   — very turbid
);

const vec3 KB[10] = vec3[10](
  vec3(0.001, 0.002, 0.012), // Type I
  vec3(0.002, 0.003, 0.015), // Type IA
  vec3(0.003, 0.004, 0.018), // Type IB
  vec3(0.006, 0.008, 0.025), // Type II
  vec3(0.012, 0.020, 0.035), // Type III
  vec3(0.025, 0.045, 0.048), // Coastal 1
  vec3(0.045, 0.080, 0.065), // Coastal 3
  vec3(0.070, 0.120, 0.085), // Coastal 5
  vec3(0.100, 0.165, 0.105), // Coastal 7
  vec3(0.145, 0.220, 0.130)  // Coastal 9
);

vec3 jerlovKa(float jt) {
  int lo = int(clamp(jt, 0.0, 8.99));
  int hi = min(lo + 1, 9);
  return mix(KA[lo], KA[hi], fract(jt));
}

vec3 jerlovKb(float jt) {
  int lo = int(clamp(jt, 0.0, 8.99));
  int hi = min(lo + 1, 9);
  return mix(KB[lo], KB[hi], fract(jt));
}

// Apparent water body colour at a given view depth (metres).
// depth > 0 means the viewer is looking down into water.
vec3 jerlovColor(float jt, float viewDepth) {
  vec3 Ka = jerlovKa(jt);
  vec3 Kb = jerlovKb(jt);
  vec3 Ktot = Ka + Kb;
  // Scatter colour: what the water body reflects upward
  vec3 scatterCol = Kb / Ktot;
  // Attenuate with depth — deeper view = more absorption
  float d = max(0.0, viewDepth);
  vec3 attenuation = exp(-Ktot * d * 2.0);
  return scatterCol * (1.0 - attenuation) + attenuation * scatterCol * 0.4;
}
`;

// ---------------------------------------------------------------------------
// Vertex shader — multi-octave wave displacement + passing world pos to frag
// ---------------------------------------------------------------------------
const VERTEX_SHADER = /* glsl */`
uniform float uTime;
varying vec2  vUv;
varying vec3  vWorldPos;
varying vec3  vNormal;
varying float vViewDepth; // approximate optical depth for colour

// 4-octave wave displacement — each octave has different angle, freq, speed
// Based on a simple sum-of-sines approximating a Phillips wind spectrum.
float wave(vec3 pos, vec2 dir, float freq, float speed, float amp) {
  return amp * sin(dot(dir, pos.xz) * freq + uTime * speed);
}

// FBM-style normal approximation — finite differences on the wave function
vec2 waveNormalDelta(vec3 pos, float dt) {
  float h  = wave(pos,          normalize(vec2(1.0,  0.6)), 0.05, 0.80, 0.30)
           + wave(pos,          normalize(vec2(0.6,  1.0)), 0.04, 0.60, 0.25)
           + wave(pos,          normalize(vec2(-0.7, 0.8)), 0.08, 1.10, 0.12)
           + wave(pos,          normalize(vec2(0.9, -0.5)), 0.11, 1.40, 0.07)
           + wave(pos,          normalize(vec2(-0.3, -1.0)),0.19, 1.90, 0.04)
           + wave(pos,          normalize(vec2(1.0,  0.2)), 0.24, 2.30, 0.025);

  vec3 pdx = pos + vec3(dt, 0.0, 0.0);
  float hx = wave(pdx, normalize(vec2(1.0,  0.6)), 0.05, 0.80, 0.30)
           + wave(pdx, normalize(vec2(0.6,  1.0)), 0.04, 0.60, 0.25)
           + wave(pdx, normalize(vec2(-0.7, 0.8)), 0.08, 1.10, 0.12)
           + wave(pdx, normalize(vec2(0.9, -0.5)), 0.11, 1.40, 0.07);

  vec3 pdz = pos + vec3(0.0, 0.0, dt);
  float hz = wave(pdz, normalize(vec2(1.0,  0.6)), 0.05, 0.80, 0.25)
           + wave(pdz, normalize(vec2(0.6,  1.0)), 0.04, 0.60, 0.25)
           + wave(pdz, normalize(vec2(-0.7, 0.8)), 0.08, 1.10, 0.12)
           + wave(pdz, normalize(vec2(0.9, -0.5)), 0.11, 1.40, 0.07);

  return vec2(hx - h, hz - h) / dt;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // World position for zone-based colour — use UNDISPLACED XZ so it doesn't animate
  vWorldPos = position; // pre-wave position, stable each frame

  // Wave displacement (applied after vWorldPos is set)
  pos.y += wave(pos, normalize(vec2(1.0,  0.6)), 0.050, 0.80, 0.30);
  pos.y += wave(pos, normalize(vec2(0.6,  1.0)), 0.040, 0.60, 0.25);
  pos.y += wave(pos, normalize(vec2(-0.7, 0.8)), 0.080, 1.10, 0.12);
  pos.y += wave(pos, normalize(vec2(0.9, -0.5)), 0.110, 1.40, 0.07);
  pos.y += wave(pos, normalize(vec2(-0.3,-1.0)), 0.190, 1.90, 0.04);
  pos.y += wave(pos, normalize(vec2(1.0,  0.2)), 0.240, 2.30, 0.025);

  // Surface normal from finite differences on displaced pos
  vec2 nd = waveNormalDelta(pos, 0.5);
  vNormal = normalize(vec3(-nd.x, 1.0, -nd.y));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Fragment shader — Jerlov colour + Fresnel + sun glitter + night blend
// ---------------------------------------------------------------------------
// Fragment shader — visually tuned, zone-colour variation, no physics darkness
// ---------------------------------------------------------------------------
const FRAGMENT_SHADER = /* glsl */`
uniform float uTime;
uniform float uNightBlend;
uniform vec3  uSunDir;

varying vec2  vUv;
varying vec3  vWorldPos;   // undisplaced — stable XZ, no swimming shadow
varying vec3  vNormal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // --- Zone-based colour (XZ only, never moves) ---
  // Base: bright Atlantic blue-green
  vec3 shallow = vec3(0.18, 0.58, 0.72);
  vec3 deep    = vec3(0.06, 0.28, 0.52);

  // Sandy bay (SE): lighter turquoise
  float sandyBay = smoothstep(200.0, 40.0, length(vWorldPos.xz - vec2(150.0, 280.0)));
  shallow = mix(shallow, vec3(0.28, 0.72, 0.78), sandyBay * 0.6);

  // Kelp cove (SW): green tint
  float kelpCove = smoothstep(180.0, 40.0, length(vWorldPos.xz - vec2(-200.0, 100.0)));
  shallow = mix(shallow, vec3(0.10, 0.55, 0.42), kelpCove * 0.5);
  deep    = mix(deep,    vec3(0.04, 0.28, 0.22), kelpCove * 0.4);

  // Harbour (N, z≈370): slightly murkier
  float harbour = smoothstep(90.0, 20.0, length(vWorldPos.xz - vec2(0.0, 370.0)));
  shallow = mix(shallow, vec3(0.14, 0.44, 0.52), harbour * 0.4);

  // Shore proximity: lighten water near the island edge (NOT based on wave Y)
  float distFromIsland = max(0.0, length(vWorldPos.xz) - 350.0);
  float shoreFactor = smoothstep(80.0, 0.0, distFromIsland); // 1 = near shore
  vec3 waterCol = mix(deep, shallow, 0.5 + shoreFactor * 0.5);

  // --- Surface lighting ---
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);

  // Fresnel — graze angle gets sky reflection
  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.5);
  fresnel = mix(0.02, 0.55, fresnel);

  vec3 skyDay   = vec3(0.60, 0.82, 0.96);
  vec3 skyNight = vec3(0.01, 0.03, 0.09);
  vec3 skyRefl  = mix(skyDay, skyNight, uNightBlend);

  waterCol = mix(waterCol, skyRefl, fresnel);

  // --- Sun specular — tight highlight, not blown out ---
  vec3 sunDir = normalize(uSunDir);
  vec3 H = normalize(sunDir + V);
  float spec = pow(max(0.0, dot(N, H)), 280.0) * 0.45; // tight & dim
  waterCol += spec * (1.0 - uNightBlend);

  // --- Fine glitter — scattered sparkles, not blobs ---
  vec2 glitUv = vWorldPos.xz * 0.35 + uTime * vec2(0.03, 0.02);
  float sparkle = hash(floor(glitUv * 18.0) + floor(uTime * 6.0));
  sparkle = step(0.94, sparkle) * max(0.0, dot(N, sunDir)) * 0.35 * (1.0 - uNightBlend);
  waterCol += sparkle;

  // --- Night ---
  waterCol = mix(waterCol, vec3(0.01, 0.03, 0.08), uNightBlend * 0.88);

  gl_FragColor = vec4(waterCol, 0.92);
}
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create the sea ShaderMaterial.
 * @param {object} opts
 * @param {number} [opts.jerlovType=0.3]  0=clear open ocean, 9=very turbid
 * @param {THREE.Vector3} [opts.sunDir]   initial sun direction
 */
export function createSeaMaterial({ sunDir } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    uniforms: {
      uTime:       { value: 0 },
      uNightBlend: { value: 0 },
      uSunDir:     { value: sunDir ? sunDir.clone() : new THREE.Vector3(0.6, 0.8, 0.4) },
    },
    vertexShader:   VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });
}

/**
 * Update per-frame uniforms. Call in your render/animate loop.
 * @param {THREE.ShaderMaterial} mat
 * @param {number} time          elapsed seconds
 * @param {number} nightBlend    0=day 1=night
 * @param {THREE.Vector3} [sunDir]  optional, update sun direction
 */
export function updateSea(mat, time, nightBlend, sunDir) {
  mat.uniforms.uTime.value       = time;
  mat.uniforms.uNightBlend.value = nightBlend;
  if (sunDir) mat.uniforms.uSunDir.value.copy(sunDir);
}
