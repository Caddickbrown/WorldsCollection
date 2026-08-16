/**
 * Beachcombing System — CAD-400
 *
 * Shells, sea glass, and driftwood spawn along beach areas.
 * Player walks near them and presses E to collect.
 * Items go into the bag. Spawn refreshes periodically.
 */

import * as THREE from 'three';
import { getHeight } from './scene.js';
import { BAG, ITEMS } from './bag.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BEACH_ZONES = [
  { cx: 45, cz: -300, radius: 60 },   // beach
  { cx: 0, cz: -330, radius: 50 },    // south beach
  { cx: 225, cz: -233, radius: 40 },  // east beach
];

const SPAWN_ITEMS = [
  { id: 'shell', weight: 0.45, mesh: createShellMesh },
  { id: 'sea_glass', weight: 0.30, mesh: createSeaGlassMesh },
  { id: 'driftwood', weight: 0.25, mesh: createDriftwoodMesh },
];

const MAX_ITEMS = 12;
const RESPAWN_INTERVAL = 60; // seconds between spawns
const PICKUP_RADIUS = 4;

// ---------------------------------------------------------------------------
// Mesh factories
// ---------------------------------------------------------------------------
function createShellMesh() {
  const geo = new THREE.SphereGeometry(0.3, 6, 4);
  geo.scale(1, 0.4, 1.2);
  const mat = new THREE.MeshLambertMaterial({ color: 0xfff0d0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function createSeaGlassMesh() {
  const geo = new THREE.BoxGeometry(0.3, 0.12, 0.25);
  const colors = [0x88ccaa, 0xaaddff, 0xddffee, 0x99eebb];
  const mat = new THREE.MeshLambertMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    transparent: true,
    opacity: 0.7,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = true;
  return mesh;
}

function createDriftwoodMesh() {
  const geo = new THREE.CylinderGeometry(0.08, 0.06, 1.2, 5);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Beachcombing manager
// ---------------------------------------------------------------------------
export class BeachcombingManager {
  constructor(scene) {
    this._scene = scene;
    this._items = []; // { mesh, itemId, position }
    this._respawnTimer = 0;
    this._initialSpawn();
  }

  _initialSpawn() {
    for (let i = 0; i < 8; i++) {
      this._spawnOne();
    }
  }

  _spawnOne() {
    if (this._items.length >= MAX_ITEMS) return;

    // Pick random beach zone
    const zone = BEACH_ZONES[Math.floor(Math.random() * BEACH_ZONES.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * zone.radius * 0.8;
    const x = zone.cx + Math.cos(angle) * dist;
    const z = zone.cz + Math.sin(angle) * dist;
    const y = getHeight(x, z);

    // Pick item type by weight
    const roll = Math.random();
    let cumWeight = 0;
    let chosen = SPAWN_ITEMS[0];
    for (const item of SPAWN_ITEMS) {
      cumWeight += item.weight;
      if (roll < cumWeight) { chosen = item; break; }
    }

    const mesh = chosen.mesh();
    mesh.position.set(x, y + 0.15, z);
    this._scene.add(mesh);
    this._items.push({ mesh, itemId: chosen.id, position: mesh.position });
  }

  /** Try to pick up a nearby beachcombing item. Returns true if picked up. */
  tryPickup(playerPos) {
    for (let i = this._items.length - 1; i >= 0; i--) {
      const item = this._items[i];
      const dx = playerPos.x - item.position.x;
      const dz = playerPos.z - item.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < PICKUP_RADIUS) {
        const itemDef = ITEMS[item.itemId];
        if (itemDef) {
          BAG.add(itemDef, 1);
        }
        this._scene.remove(item.mesh);
        this._items.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  update(delta) {
    this._respawnTimer += delta;
    if (this._respawnTimer >= RESPAWN_INTERVAL) {
      this._respawnTimer = 0;
      this._spawnOne();
    }

    // Gentle bob animation for items
    const t = performance.now() * 0.001;
    for (const item of this._items) {
      const baseY = getHeight(item.position.x, item.position.z) + 0.15;
      item.mesh.position.y = baseY + Math.sin(t * 1.5 + item.position.x) * 0.05;
    }
  }
}
