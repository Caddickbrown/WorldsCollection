/**
 * outline-pass.js
 * Custom edge-detect post-process pass for toon outline rendering.
 *
 * Technique: samples BOTH depth and normals simultaneously to detect edges.
 *   - Depth discontinuities → silhouette edges (object boundaries)
 *   - Normal discontinuities → surface detail edges (corners, windows, etc.)
 *
 * Much better than Three.js's built-in OutlinePass (which only catches
 * silhouettes via stencil dilation and misses interior edges entirely).
 *
 * Requires a G-buffer normal render target — see setup in composer.js.
 *
 * Usage:
 *   const outlinePass = new OutlinePass({
 *     renderer, camera, normalTarget,
 *     outlineColor: 0x1a1a1a,
 *     outlineThickness: 1.0,
 *   });
 *   composer.addPass(outlinePass);
 */
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// Fragment shader: samples depth + normals at 4 neighbours, compares
var FRAG_SHADER = /* glsl */`
  precision highp float;

  uniform sampler2D tDiffuse;   // colour buffer from previous pass
  uniform sampler2D tDepth;     // depth buffer
  uniform sampler2D tNormal;    // world-space normals (RGB = XYZ, packed 0..1)

  uniform vec2  uResolution;
  uniform float uNear;
  uniform float uFar;

  // Tuning uniforms
  uniform float uDepthThreshold;    // 0.001  — depth diff to trigger edge
  uniform float uNormalThreshold;   // 0.3    — normal diff (0..1) to trigger edge
  uniform float uThickness;         // 1.0    — outline width in pixels
  uniform vec3  uOutlineColor;      // e.g. vec3(0.1, 0.1, 0.1)
  uniform float uOutlineStrength;   // 1.0

  varying vec2 vUv;

  float linearDepth(float d) {
    return (2.0 * uNear) / (uFar + uNear - d * (uFar - uNear));
  }

  void main() {
    vec2 texel = uThickness / uResolution;

    // Sample centre
    vec4 col     = texture2D(tDiffuse, vUv);
    float d0     = linearDepth(texture2D(tDepth, vUv).r);
    vec3  n0     = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;

    // Sample 4 neighbours
    float dL = linearDepth(texture2D(tDepth, vUv + vec2(-texel.x, 0.0)).r);
    float dR = linearDepth(texture2D(tDepth, vUv + vec2( texel.x, 0.0)).r);
    float dT = linearDepth(texture2D(tDepth, vUv + vec2(0.0,  texel.y)).r);
    float dB = linearDepth(texture2D(tDepth, vUv + vec2(0.0, -texel.y)).r);

    vec3 nL = texture2D(tNormal, vUv + vec2(-texel.x, 0.0)).rgb * 2.0 - 1.0;
    vec3 nR = texture2D(tNormal, vUv + vec2( texel.x, 0.0)).rgb * 2.0 - 1.0;
    vec3 nT = texture2D(tNormal, vUv + vec2(0.0,  texel.y)).rgb * 2.0 - 1.0;
    vec3 nB = texture2D(tNormal, vUv + vec2(0.0, -texel.y)).rgb * 2.0 - 1.0;

    // Depth edge: Sobel-ish — max delta from centre to neighbours
    float depthEdge = max(
      max(abs(d0 - dL), abs(d0 - dR)),
      max(abs(d0 - dT), abs(d0 - dB))
    );

    // Normal edge: dot product divergence
    float nEdge = max(
      max(1.0 - dot(n0, nL), 1.0 - dot(n0, nR)),
      max(1.0 - dot(n0, nT), 1.0 - dot(n0, nB))
    );

    float edge = 0.0;
    edge = max(edge, step(uDepthThreshold,  depthEdge));
    edge = max(edge, step(uNormalThreshold, nEdge));

    vec3 outCol = mix(col.rgb, uOutlineColor, edge * uOutlineStrength);
    gl_FragColor = vec4(outCol, col.a);
  }
`;

var VERT_SHADER = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export class OutlinePass extends Pass {
  constructor(params) {
    super();

    params = params || {};
    this.camera      = params.camera;
    this.normalTarget = params.normalTarget; // WebGLRenderTarget with normals

    var outlineColor = new THREE.Color(params.outlineColor !== undefined ? params.outlineColor : 0x1a1a1a);

    this.uniforms = {
      tDiffuse:         { value: null },
      tDepth:           { value: null },
      tNormal:          { value: params.normalTarget ? params.normalTarget.texture : null },
      uResolution:      { value: new THREE.Vector2(1, 1) },
      uNear:            { value: params.camera ? params.camera.near : 0.1 },
      uFar:             { value: params.camera ? params.camera.far  : 1000 },
      uDepthThreshold:  { value: params.depthThreshold  !== undefined ? params.depthThreshold  : 0.002 },
      uNormalThreshold: { value: params.normalThreshold !== undefined ? params.normalThreshold : 0.3   },
      uThickness:       { value: params.thickness       !== undefined ? params.thickness       : 1.0   },
      uOutlineColor:    { value: new THREE.Vector3(outlineColor.r, outlineColor.g, outlineColor.b) },
      uOutlineStrength: { value: params.strength        !== undefined ? params.strength        : 1.0   },
    };

    this._mat = new THREE.ShaderMaterial({
      uniforms:       this.uniforms,
      vertexShader:   VERT_SHADER,
      fragmentShader: FRAG_SHADER,
    });

    this._fsq = new FullScreenQuad(this._mat);
  }

  setSize(w, h) {
    this.uniforms.uResolution.value.set(w, h);
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
    // Provide colour + depth from previous pass
    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.tDepth.value   = readBuffer.depthTexture;

    // Update near/far in case camera changed
    if (this.camera) {
      this.uniforms.uNear.value = this.camera.near;
      this.uniforms.uFar.value  = this.camera.far;
    }

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this._fsq.render(renderer);
  }

  dispose() {
    this._mat.dispose();
    this._fsq.dispose();
  }
}
