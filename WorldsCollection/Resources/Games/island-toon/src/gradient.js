/**
 * gradient.js
 * Creates DataTexture gradient maps for MeshToonMaterial.
 *
 * CRITICAL: gradientMap MUST use NearestFilter.
 * Linear filtering blends between steps and destroys the toon banding effect.
 */
import * as THREE from 'three';

/**
 * Make a gradient map from an array of brightness steps [0..1].
 * e.g. [0.3, 1.0]  → 2-step harsh cartoon
 *      [0.25, 0.6, 1.0] → 3-step standard toon
 */
export function makeGradient(steps) {
  var n = steps.length;
  var data = new Uint8Array(n * 4);
  for (var i = 0; i < n; i++) {
    var v = Math.round(steps[i] * 255);
    data[i * 4]     = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  var tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// Pre-baked presets — created at module load (DataTexture is pure JS, no GL context needed yet)

// 2-step: harsh, graphic (shadow / lit)
export var GRAD2 = makeGradient([0.3, 1.0]);

// 3-step: standard toon look (shadow / mid / lit)
export var GRAD3 = makeGradient([0.25, 0.6, 1.0]);

// 4-step: softer, more gradual
export var GRAD4 = makeGradient([0.2, 0.45, 0.7, 1.0]);
