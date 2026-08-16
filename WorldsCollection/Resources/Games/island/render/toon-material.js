/**
 * toon-material.js
 * Drop-in toon materials for Island Voxel Engine chunk meshes.
 *
 * Replaces MeshStandardMaterial (PBR) with MeshToonMaterial (cel-shaded).
 * MeshToonMaterial does NOT use roughness/metalness — those are ignored.
 *
 * Usage:
 *   import { toonMaterial, toonMaterialFor } from './toon-material.js';
 *   // Replace chunk material in renderer.js:
 *   mesh.material = toonMaterialFor(VCOLOR[chunkVoxelType]);
 */
import * as THREE from 'three';
import { GRAD3 } from './gradient.js';

// Cache materials by hex colour to avoid creating a new material per chunk
var _cache = new Map();

/**
 * Return a MeshToonMaterial for the given hex colour.
 * Materials are cached — same colour → same instance (safe for many chunks).
 */
export function toonMaterialFor(hexColor, gradientMap) {
  if (!gradientMap) gradientMap = GRAD3;
  var key = hexColor + '_' + gradientMap.uuid;
  if (_cache.has(key)) return _cache.get(key);

  var mat = new THREE.MeshToonMaterial({
    color: hexColor,
    gradientMap: gradientMap,
    // Side: FrontSide is correct for face-culled voxel meshes
    side: THREE.FrontSide,
  });

  _cache.set(key, mat);
  return mat;
}

/**
 * Dispose all cached toon materials.
 * Call when the scene is torn down.
 */
export function disposeToonMaterials() {
  _cache.forEach(function(mat) { mat.dispose(); });
  _cache.clear();
}
