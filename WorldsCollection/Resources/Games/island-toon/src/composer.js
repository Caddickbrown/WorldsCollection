/**
 * composer.js
 * EffectComposer setup: toon outlines + optional FXAA.
 *
 * Call order each frame:
 *   1. renderNormals(renderer, scene, camera, normalTarget)  ← normal G-buffer
 *   2. composer.render(dt)                                   ← main pipeline
 *
 * Passes:
 *   RenderPass → OutlinePass → OutputPass
 *
 * Usage:
 *   import { createComposer, renderFrame } from './composer.js';
 *   const { composer, normalTarget } = createComposer(renderer, scene, camera, {
 *     outlineColor: 0x1a1a1a,
 *     outlineThickness: 1.0,
 *     depthThreshold: 0.002,
 *     normalThreshold: 0.3,
 *   });
 *
 *   // In your render loop:
 *   renderFrame(renderer, composer, scene, camera, normalTarget);
 */
import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { OutlinePass }     from './outline-pass.js';
import { renderNormals, createNormalTarget } from './normal-pass.js';

export function createComposer(renderer, scene, camera, opts) {
  opts = opts || {};

  // Normal G-buffer target
  var normalTarget = createNormalTarget(renderer);

  // Depth texture on the main render target so OutlinePass can sample it
  var depthTexture = new THREE.DepthTexture();
  depthTexture.type   = THREE.UnsignedShortType;
  depthTexture.format = THREE.DepthFormat;

  var size = renderer.getSize(new THREE.Vector2());
  var renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter:    THREE.NearestFilter,
    magFilter:    THREE.NearestFilter,
    format:       THREE.RGBAFormat,
    depthTexture: depthTexture,
  });

  var composer = new EffectComposer(renderer, renderTarget);

  // 1. Render the scene normally
  var renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. Outline edge-detect pass
  var outlinePass = new OutlinePass({
    camera,
    normalTarget,
    outlineColor:     opts.outlineColor     !== undefined ? opts.outlineColor     : 0x1a1a1a,
    thickness:        opts.outlineThickness !== undefined ? opts.outlineThickness : 1.0,
    depthThreshold:   opts.depthThreshold   !== undefined ? opts.depthThreshold   : 0.002,
    normalThreshold:  opts.normalThreshold  !== undefined ? opts.normalThreshold  : 0.3,
    strength:         opts.outlineStrength  !== undefined ? opts.outlineStrength  : 1.0,
  });
  outlinePass.renderToScreen = false;
  composer.addPass(outlinePass);

  // 3. Tone-map + output (handles sRGB conversion for correct colours)
  var outputPass = new OutputPass();
  outputPass.renderToScreen = true;
  composer.addPass(outputPass);

  // Handle resize
  function onResize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    normalTarget.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return { composer, normalTarget, outlinePass };
}

/**
 * Call this instead of renderer.render(scene, camera) each frame.
 */
export function renderFrame(renderer, composer, scene, camera, normalTarget) {
  renderNormals(renderer, scene, camera, normalTarget);
  composer.render();
}
