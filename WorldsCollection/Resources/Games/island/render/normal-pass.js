/**
 * normal-pass.js
 * Renders the scene to a normal buffer (G-buffer) for the outline pass.
 *
 * The outline shader needs world-space normals packed into [0..1] RGB.
 * We do this with a single extra render pass using a MeshNormalMaterial
 * override, then feed the result into OutlinePass as tNormal.
 *
 * Usage: see composer.js
 */
import * as THREE from 'three';

var _normalMat = new THREE.MeshNormalMaterial();

/**
 * Render scene normals into a WebGLRenderTarget.
 * Call this BEFORE the main EffectComposer render each frame.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene}         scene
 * @param {THREE.Camera}        camera
 * @param {THREE.WebGLRenderTarget} normalTarget
 */
export function renderNormals(renderer, scene, camera, normalTarget) {
  // Override all scene materials with MeshNormalMaterial for this pass
  scene.overrideMaterial = _normalMat;
  renderer.setRenderTarget(normalTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  scene.overrideMaterial = null;
}

/**
 * Create a normal render target matching current renderer size.
 * @param {THREE.WebGLRenderer} renderer
 */
export function createNormalTarget(renderer) {
  var size = renderer.getSize(new THREE.Vector2());
  var target = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format:    THREE.RGBAFormat,
    type:      THREE.UnsignedByteType,
  });
  return target;
}
