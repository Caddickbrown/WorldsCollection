// World Voxel — Agent Renderer
// Renders World simulation agents as Island-Voxel-style blocky humanoids.
// Consumes agent DTOs from SimulationWorker STATE messages.

import * as THREE from '../vendor/three.module.js';
import { buildHumanoid, animateHumanoid, HUMANOID_HEIGHT } from './character.js';

const VS = 0.5; // voxels to Three.js units (matches Island Voxel)
const TILE_VOXELS = 4;

// Life-stage → scale
const STAGE_SCALE = { infant: 0.45, child: 0.7, adult: 1.0, elder: 0.95 };

// Agent state → shirt colour tint
const STATE_COLOR = {
  WANDERING:    0x8ecae6,
  GATHERING:    0x52b788,
  SLEEPING:     0x9b72aa,
  SOCIALIZING:  0xffd166,
  DISCOVERING:  0xef476f,
  FISHING:      0x43b0f1,
  PERFORMING:   0xf4a261,
  TRADING:      0xe9c46a,
  RITUAL:       0xc77dff,
};

const SICK_TINT   = 0x90ee70;
const DEAD_TINT   = 0x888888;
const FLASH_COLOR = 0xffffff;

export class AgentRenderer {
  constructor(scene) {
    this._scene   = scene;
    this._meshes  = new Map();   // agentId → { group, parts, anim, label }
    this._labelCanvas = document.createElement('canvas');
  }

  // Update all humanoid meshes from latest agent DTO array + current tile data.
  // surfaceYFn(tx, tz) → voxel Y of surface at tile coords
  update(agents, surfaceYFn, dt) {
    const seen = new Set();

    for (const ag of agents) {
      if (ag.isDead) { this._remove(ag.id); continue; }
      seen.add(ag.id);

      let entry = this._meshes.get(ag.id);
      if (!entry) {
        entry = this._create(ag);
        this._meshes.set(ag.id, entry);
      }

      // Position: tile-grid → voxel → Three.js units
      const vx  = ag.x * TILE_VOXELS + TILE_VOXELS / 2;
      const vz  = ag.z * TILE_VOXELS + TILE_VOXELS / 2;
      const vy  = surfaceYFn(Math.floor(ag.x), Math.floor(ag.z));
      entry.group.position.set(vx * VS, vy * VS, vz * VS);

      // Facing direction
      if (ag.facingX !== 0 || ag.facingZ !== 0) {
        entry.group.rotation.y = Math.atan2(ag.facingX, ag.facingZ);
      }

      // Scale for life stage
      const sc = STAGE_SCALE[ag.lifeStage] ?? 1;
      entry.group.scale.setScalar(sc);

      // Recolour shirt by state
      this._tintBody(entry.parts, ag);

      // Walk animation (speed proportional to movement)
      const moving = (ag.state === 'WANDERING' || ag.state === 'GATHERING' ||
                      ag.state === 'FISHING'   || ag.state === 'TRADING');
      animateHumanoid(entry.parts, entry.anim, dt, {
        speed: moving ? 3 * VS : 0,
        grounded: true,
      });

      // Discovery flash
      if (ag.discoveryFlash) {
        entry.parts.body.material.emissive.setHex(FLASH_COLOR);
        entry.parts.body.material.emissiveIntensity = 1;
      } else {
        entry.parts.body.material.emissiveIntensity = 0;
      }

      // Speech bubble label
      if (ag.speechBubble) {
        this._updateLabel(entry, ag.speechBubble);
        entry.label.visible = true;
      } else {
        entry.label.visible = false;
      }
    }

    // Remove meshes for gone agents
    for (const [id] of this._meshes) {
      if (!seen.has(id)) this._remove(id);
    }
  }

  _create(ag) {
    const shirtColor = STATE_COLOR[ag.state] ?? 0x8ecae6;
    const { group, parts } = buildHumanoid({
      skinTone:   this._skinFromRole(ag.role),
      hairColor:  this._hairFromName(ag.name),
      shirtColor,
      pantsColor: 0x4a4e69,
      castShadow: false,
    });
    this._scene.add(group);

    // Label sprite
    const label = this._makeLabel(ag.name);
    label.position.set(0, HUMANOID_HEIGHT + 0.3, 0);
    label.visible = false;
    group.add(label);

    return { group, parts, anim: { walkPhase: Math.random() * Math.PI * 2 }, label };
  }

  _remove(id) {
    const entry = this._meshes.get(id);
    if (!entry) return;
    this._scene.remove(entry.group);
    entry.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this._meshes.delete(id);
  }

  _tintBody(parts, ag) {
    if (!parts.body?.material) return;
    const color = ag.isSick  ? SICK_TINT :
                  ag.isDead  ? DEAD_TINT :
                  (STATE_COLOR[ag.state] ?? 0x8ecae6);
    parts.body.material.color.setHex(color);
    if (parts.armL) parts.armL.material.color.setHex(color);
    if (parts.armR) parts.armR.material.color.setHex(color);
  }

  _skinFromRole(role) {
    const tones = [0xffd5b2, 0xe8b38a, 0xc68642, 0x8d5524, 0x6b3f2a];
    let h = 0;
    if (role) for (let i = 0; i < role.length; i++) h = (h * 31 + role.charCodeAt(i)) | 0;
    return tones[Math.abs(h) % tones.length];
  }

  _hairFromName(name) {
    const colors = [0x2c1810, 0x8b5e3c, 0xf4c430, 0xa0522d, 0xd2b48c, 0x808080];
    let h = 0;
    if (name) for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return colors[Math.abs(h) % colors.length];
  }

  _makeLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.roundRect(0, 4, 128, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text || '', 64, 20);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.3, 1);
    return sprite;
  }

  _updateLabel(entry, text) {
    const sprite = entry.label;
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 4, 256, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text.slice(0, 40), 128, 28);
    sprite.material.map = new THREE.CanvasTexture(canvas);
    sprite.material.needsUpdate = true;
    sprite.scale.set(2.0, 0.5, 1);
  }

  get count() { return this._meshes.size; }
}
