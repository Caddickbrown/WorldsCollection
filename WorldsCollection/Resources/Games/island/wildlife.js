/**
 * Wildlife — Seagulls, Rabbits, Butterflies
 *
 * Simple Three.js primitive animals that bring the island to life.
 * All movement is procedural — no physics, no external assets.
 */

import * as THREE from 'three';
import { getHeight } from './scene.js';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function sphere(r, color, seg = 8) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(color));
}

function cylinder(rt, rb, h, color, seg = 6) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
}

// ---------------------------------------------------------------------------
// Seagull
// ---------------------------------------------------------------------------

class Seagull {
  constructor(scene, cx, cz, orbitRadius, orbitHeight, phase) {
    this.cx = cx;
    this.cz = cz;
    this.orbitRadius = orbitRadius;
    this.orbitHeight = orbitHeight;
    this.phase = phase;
    this.orbitSpeed = 0.25 + Math.random() * 0.15; // rad/sec
    this.flapTime = phase;

    this.group = new THREE.Group();

    // Body
    const body = box(0.5, 0.25, 1.0, 0xf0f0f0);
    this.group.add(body);

    // Left wing (two segments — inner and outer)
    this.leftWingInner = box(1.2, 0.08, 0.45, 0xe8e8e8);
    this.leftWingInner.position.set(-0.9, 0, 0);
    this.group.add(this.leftWingInner);

    this.leftWingOuter = box(1.0, 0.06, 0.35, 0xd8d8d8);
    this.leftWingOuter.position.set(-2.0, 0, 0.05);
    this.group.add(this.leftWingOuter);

    // Right wing
    this.rightWingInner = box(1.2, 0.08, 0.45, 0xe8e8e8);
    this.rightWingInner.position.set(0.9, 0, 0);
    this.group.add(this.rightWingInner);

    this.rightWingOuter = box(1.0, 0.06, 0.35, 0xd8d8d8);
    this.rightWingOuter.position.set(2.0, 0, 0.05);
    this.group.add(this.rightWingOuter);

    // Head
    const head = sphere(0.22, 0xf0f0f0, 7);
    head.position.set(0, 0.15, -0.55);
    this.group.add(head);

    // Beak
    const beak = box(0.08, 0.08, 0.3, 0xffcc44);
    beak.position.set(0, 0.12, -0.82);
    this.group.add(beak);

    // Tail feathers
    const tail = box(0.4, 0.08, 0.4, 0xe0e0e0);
    tail.position.set(0, -0.05, 0.55);
    tail.rotation.x = 0.2;
    this.group.add(tail);

    scene.add(this.group);
  }

  update(delta) {
    this.phase += this.orbitSpeed * delta;
    this.flapTime += delta * 3.5;

    // Orbit position
    const x = this.cx + Math.cos(this.phase) * this.orbitRadius;
    const z = this.cz + Math.sin(this.phase) * this.orbitRadius;
    const y = this.orbitHeight + Math.sin(this.phase * 2.3) * 4; // gentle altitude drift

    this.group.position.set(x, y, z);

    // Face direction of travel (tangent to orbit)
    this.group.rotation.y = -(this.phase + Math.PI / 2);

    // Wing flap — rotate inner and outer segments
    const flapAngle = Math.sin(this.flapTime) * 0.45;
    this.leftWingInner.rotation.z  =  flapAngle;
    this.leftWingOuter.rotation.z  =  flapAngle * 1.4;
    this.rightWingInner.rotation.z = -flapAngle;
    this.rightWingOuter.rotation.z = -flapAngle * 1.4;

    // Slight banking into the turn
    this.group.rotation.z = Math.sin(this.flapTime * 0.5) * 0.1;
  }
}

// ---------------------------------------------------------------------------
// Rabbit
// ---------------------------------------------------------------------------

const RABBIT_ROAM_RADIUS = 18;

class Rabbit {
  constructor(scene, homeX, homeZ) {
    this.homeX = homeX;
    this.homeZ = homeZ;

    // State machine: 'idle' | 'hopping' | 'pause'
    this.state = 'idle';
    this.stateTime = 0;
    this.stateDuration = 1.5 + Math.random() * 2;

    // Movement
    this.tx = homeX; // target x
    this.tz = homeZ; // target z
    this.angle = Math.random() * Math.PI * 2;
    this.hopPhase = 0;

    this.group = new THREE.Group();

    // Body
    const body = sphere(0.38, 0xd4c5b0, 10);
    body.scale.set(1, 0.85, 1.2);
    this.group.add(body);

    // Head
    const head = sphere(0.27, 0xd4c5b0, 9);
    head.position.set(0, 0.3, -0.32);
    this.group.add(head);

    // Ears
    const earL = cylinder(0.06, 0.05, 0.55, 0xcfb8a5, 5);
    earL.position.set(-0.12, 0.72, -0.32);
    earL.rotation.z = 0.1;
    this.group.add(earL);

    const earR = cylinder(0.06, 0.05, 0.55, 0xcfb8a5, 5);
    earR.position.set(0.12, 0.72, -0.32);
    earR.rotation.z = -0.1;
    this.group.add(earR);

    // Inner ears (pink)
    const innerEarL = cylinder(0.03, 0.025, 0.45, 0xffaaaa, 5);
    innerEarL.position.set(-0.12, 0.72, -0.32);
    innerEarL.rotation.z = 0.1;
    this.group.add(innerEarL);

    const innerEarR = cylinder(0.03, 0.025, 0.45, 0xffaaaa, 5);
    innerEarR.position.set(0.12, 0.72, -0.32);
    innerEarR.rotation.z = -0.1;
    this.group.add(innerEarR);

    // Nose
    const nose = sphere(0.05, 0xffaaaa, 5);
    nose.position.set(0, 0.28, -0.57);
    this.group.add(nose);

    // Tail
    const tail = sphere(0.14, 0xffffff, 7);
    tail.position.set(0, 0.1, 0.38);
    this.group.add(tail);

    // Hind legs
    this.legBL = cylinder(0.07, 0.07, 0.3, 0xd4c5b0, 5);
    this.legBL.position.set(-0.16, -0.22, 0.28);
    this.group.add(this.legBL);

    this.legBR = cylinder(0.07, 0.07, 0.3, 0xd4c5b0, 5);
    this.legBR.position.set(0.16, -0.22, 0.28);
    this.group.add(this.legBR);

    // Eyes
    const eyeL = sphere(0.06, 0x222222, 5);
    eyeL.position.set(-0.11, 0.38, -0.55);
    this.group.add(eyeL);

    const eyeR = sphere(0.06, 0x222222, 5);
    eyeR.position.set(0.11, 0.38, -0.55);
    this.group.add(eyeR);

    // Start on terrain
    const startY = getHeight(homeX, homeZ);
    this.group.position.set(homeX, startY, homeZ);

    scene.add(this.group);
  }

  _pickNewTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 4 + Math.random() * RABBIT_ROAM_RADIUS;
    this.tx = this.homeX + Math.cos(angle) * dist;
    this.tz = this.homeZ + Math.sin(angle) * dist;
    this.angle = Math.atan2(this.tz - this.group.position.z, this.tx - this.group.position.x);
    this.hopPhase = 0;
  }

  update(delta) {
    this.stateTime += delta;

    if (this.state === 'idle' && this.stateTime > this.stateDuration) {
      this.state = 'hopping';
      this.stateTime = 0;
      this.stateDuration = 0.8 + Math.random() * 1.5;
      this._pickNewTarget();
    } else if (this.state === 'hopping') {
      // Move toward target
      const px = this.group.position.x;
      const pz = this.group.position.z;
      const dx = this.tx - px;
      const dz = this.tz - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5 || this.stateTime > this.stateDuration) {
        this.state = 'pause';
        this.stateTime = 0;
        this.stateDuration = 0.5 + Math.random() * 1.0;
      } else {
        const speed = 4;
        this.group.position.x += (dx / dist) * speed * delta;
        this.group.position.z += (dz / dist) * speed * delta;
        this.group.rotation.y = -this.angle + Math.PI / 2;

        // Hopping arc
        this.hopPhase += delta * 8;
        const hop = Math.max(0, Math.sin(this.hopPhase) * 0.35);
        this.group.position.y = getHeight(this.group.position.x, this.group.position.z) + hop;
        this.group.rotation.x = Math.sin(this.hopPhase) * 0.15; // lean forward/back
      }
    } else if (this.state === 'pause' && this.stateTime > this.stateDuration) {
      this.state = 'idle';
      this.stateTime = 0;
      this.stateDuration = 1.5 + Math.random() * 3;
    }

    // Always snap to terrain when not hopping
    if (this.state !== 'hopping') {
      this.group.position.y = getHeight(this.group.position.x, this.group.position.z);
      this.group.rotation.x = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Butterfly
// ---------------------------------------------------------------------------

class Butterfly {
  constructor(scene, x, z) {
    this.baseX = x;
    this.baseZ = z;
    this.baseY = getHeight(x, z) + 1.2;

    this.driftPhase = Math.random() * Math.PI * 2;
    this.driftSpeed = 0.4 + Math.random() * 0.3;
    this.flapTime = Math.random() * Math.PI * 2;
    this.flyHeight = this.baseY + 0.5 + Math.random() * 1.5;

    this.group = new THREE.Group();

    // Wing colours — pick a random bright pair
    const palettes = [
      [0xff6b9d, 0xff9eb5],  // pink
      [0xffcc44, 0xffdd88],  // yellow
      [0x44ccff, 0x88ddff],  // blue
      [0xff7744, 0xffaa77],  // orange
      [0xaa66ff, 0xcc99ff],  // purple
    ];
    const [col1, col2] = palettes[Math.floor(Math.random() * palettes.length)];

    // Upper wings — flattened spheres
    const wingGeo = new THREE.SphereGeometry(0.22, 6, 4);

    this.wingUL = new THREE.Mesh(wingGeo, mat(col1));
    this.wingUL.scale.set(1, 0.18, 1.4);
    this.wingUL.position.set(-0.22, 0, 0);
    this.group.add(this.wingUL);

    this.wingUR = new THREE.Mesh(wingGeo, mat(col1));
    this.wingUR.scale.set(1, 0.18, 1.4);
    this.wingUR.position.set(0.22, 0, 0);
    this.group.add(this.wingUR);

    // Lower wings — smaller
    const wingGeoL = new THREE.SphereGeometry(0.15, 6, 4);

    this.wingLL = new THREE.Mesh(wingGeoL, mat(col2));
    this.wingLL.scale.set(1, 0.18, 1.0);
    this.wingLL.position.set(-0.2, 0, 0.22);
    this.group.add(this.wingLL);

    this.wingLR = new THREE.Mesh(wingGeoL, mat(col2));
    this.wingLR.scale.set(1, 0.18, 1.0);
    this.wingLR.position.set(0.2, 0, 0.22);
    this.group.add(this.wingLR);

    // Body — thin cylinder
    const body = cylinder(0.04, 0.03, 0.35, 0x333322, 5);
    body.rotation.x = Math.PI / 2;
    this.group.add(body);

    this.group.position.set(x, this.flyHeight, z);
    scene.add(this.group);
  }

  update(delta) {
    this.driftPhase += delta * this.driftSpeed;
    this.flapTime += delta * 7;

    // Lazy Lissajous drift
    const x = this.baseX + Math.sin(this.driftPhase) * 5;
    const z = this.baseZ + Math.cos(this.driftPhase * 0.7) * 5;
    const y = this.flyHeight + Math.sin(this.driftPhase * 1.3) * 0.6;

    this.group.position.set(x, y, z);
    this.group.rotation.y = this.driftPhase + Math.PI;

    // Wing flap
    const flapAngle = Math.abs(Math.sin(this.flapTime)) * 0.9;
    this.wingUL.rotation.y =  flapAngle;
    this.wingUR.rotation.y = -flapAngle;
    this.wingLL.rotation.y =  flapAngle * 0.8;
    this.wingLR.rotation.y = -flapAngle * 0.8;
  }
}

// ---------------------------------------------------------------------------
// Wildlife Manager
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// CAD-451: Deer — timed, forest zone, dawn & dusk
// ---------------------------------------------------------------------------

class Deer {
  constructor(scene, homeX, homeZ) {
    this.homeX = homeX;
    this.homeZ = homeZ;
    this.group = new THREE.Group();
    this.visible = false;
    this._t = Math.random() * Math.PI * 2;
    this._grazeTimer = 2 + Math.random() * 3;
    this._state = 'still'; // 'still' | 'graze' | 'walk'

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 1.6), new THREE.MeshLambertMaterial({ color: 0xa0623a }));
    body.position.y = 1.1;
    this.group.add(body);

    // Head
    const head = sphere(0.3, 0x9a5830, 7);
    head.position.set(0, 1.55, -0.85);
    this.group.add(head);

    // Nose
    const nose = sphere(0.1, 0x7a3818, 5);
    nose.position.set(0, 1.47, -1.1);
    this.group.add(nose);

    // Ears
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.06), new THREE.MeshLambertMaterial({ color: 0xa0623a }));
      ear.position.set(side * 0.2, 1.85, -0.82);
      ear.rotation.z = side * 0.3;
      this.group.add(ear);
    });

    // Antlers (simple Y-fork)
    [-1, 1].forEach(side => {
      const stem = cylinder(0.025, 0.02, 0.5, 0x7a5020, 4);
      stem.position.set(side * 0.12, 2.1, -0.82);
      stem.rotation.z = side * 0.2;
      this.group.add(stem);
      const branch = cylinder(0.02, 0.015, 0.3, 0x7a5020, 4);
      branch.position.set(side * (0.2), 2.35, -0.75);
      branch.rotation.z = side * 0.7;
      this.group.add(branch);
    });

    // Legs
    const legPositions = [[-0.25, 0.55, -0.45], [0.25, 0.55, -0.45], [-0.25, 0.55, 0.45], [0.25, 0.55, 0.45]];
    this._legs = [];
    for (const [lx, ly, lz] of legPositions) {
      const leg = cylinder(0.07, 0.06, 0.7, 0x8a5228, 5);
      leg.position.set(lx, ly, lz);
      this.group.add(leg);
      this._legs.push(leg);
    }

    // White tail
    const tail = sphere(0.12, 0xffffff, 5);
    tail.position.set(0, 1.1, 0.82);
    this.group.add(tail);

    this.group.visible = false;
    scene.add(this.group);
  }

  /** Show/hide based on time of day. Dawn (5-8) and dusk (17-20) in forest zones. */
  setVisible(v) {
    if (v !== this.visible) {
      this.visible = v;
      this.group.visible = v;
    }
  }

  update(delta) {
    if (!this.visible) return;
    this._t += delta;
    this._grazeTimer -= delta;

    if (this._grazeTimer <= 0) {
      this._state = this._state === 'still' ? 'walk' : 'still';
      this._grazeTimer = 2 + Math.random() * 4;
    }

    if (this._state === 'walk') {
      const angle = this._t * 0.18;
      const r = 6;
      const nx = this.homeX + Math.sin(angle) * r;
      const nz = this.homeZ + Math.cos(angle * 0.7) * r;
      this.group.position.x += (nx - this.group.position.x) * delta * 1.5;
      this.group.position.z += (nz - this.group.position.z) * delta * 1.5;
      this.group.rotation.y = Math.atan2(nx - this.group.position.x, nz - this.group.position.z);
    }

    // Leg animation when walking
    const legAnim = this._state === 'walk' ? Math.sin(this._t * 4) * 0.3 : 0;
    if (this._legs.length === 4) {
      this._legs[0].rotation.x =  legAnim;
      this._legs[1].rotation.x = -legAnim;
      this._legs[2].rotation.x = -legAnim;
      this._legs[3].rotation.x =  legAnim;
    }

    // Head dip when grazing
    if (this._state === 'still') {
      const dip = Math.sin(this._t * 1.5) * 0.08;
      const headPart = this.group.children[1];
      if (headPart) headPart.position.y = 1.55 + dip;
    }

    const groundY = getHeight(this.group.position.x, this.group.position.z);
    this.group.position.y = groundY;
  }
}

// ---------------------------------------------------------------------------
// CAD-451: Owl — night only, forest zone
// ---------------------------------------------------------------------------
class Owl {
  constructor(scene, cx, cz) {
    this.cx = cx; this.cz = cz;
    this.group = new THREE.Group();
    this.visible = false;
    this._t = Math.random() * Math.PI * 2;
    this._perchTimer = 3 + Math.random() * 5;
    this._perching = true;

    // Body
    const body = sphere(0.28, 0x8a7048, 8);
    body.scale.set(1, 1.4, 1);
    this.group.add(body);
    // Head
    const head = sphere(0.22, 0x8a7048, 7);
    head.position.set(0, 0.5, 0);
    this.group.add(head);
    // Eye discs
    [-1, 1].forEach(s => {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), new THREE.MeshLambertMaterial({ color: 0xf5e040 }));
      disc.position.set(s * 0.1, 0.5, -0.2);
      disc.rotation.y = s * 0.2;
      this.group.add(disc);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      pupil.position.set(s * 0.1, 0.5, -0.22);
      pupil.rotation.y = s * 0.2;
      this.group.add(pupil);
    });
    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 5), new THREE.MeshLambertMaterial({ color: 0xd4a030 }));
    beak.position.set(0, 0.46, -0.23);
    beak.rotation.x = Math.PI / 2;
    this.group.add(beak);
    // Ear tufts
    [-1, 1].forEach(s => {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), new THREE.MeshLambertMaterial({ color: 0x7a6038 }));
      tuft.position.set(s * 0.1, 0.72, 0);
      this.group.add(tuft);
    });
    // Wings
    [-1, 1].forEach(s => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.5), new THREE.MeshLambertMaterial({ color: 0x786040 }));
      wing.position.set(s * 0.3, 0.05, 0);
      this.group.add(wing);
    });

    this.group.visible = false;
    // Perch the owl on a branch-height
    const groundY = getHeight(cx, cz);
    this.group.position.set(cx, groundY + 5, cz);
    scene.add(this.group);
  }

  setVisible(v) {
    if (v !== this.visible) {
      this.visible = v;
      this.group.visible = v;
    }
  }

  update(delta) {
    if (!this.visible) return;
    this._t += delta;
    this._perchTimer -= delta;

    if (this._perchTimer <= 0) {
      this._perching = !this._perching;
      this._perchTimer = this._perching ? 4 + Math.random() * 6 : 2 + Math.random() * 3;
    }

    if (!this._perching) {
      // Short glide arc
      const angle = this._t * 0.3;
      const r = 12;
      this.group.position.x = this.cx + Math.cos(angle) * r;
      this.group.position.z = this.cz + Math.sin(angle) * r;
      const groundY = getHeight(this.group.position.x, this.group.position.z);
      this.group.position.y = groundY + 5 + Math.sin(this._t) * 1.5;
      this.group.rotation.y = -(angle + Math.PI / 2);
    } else {
      // Head rotation bob
      this.group.children[1].rotation.y = Math.sin(this._t * 0.5) * 0.4;
    }
  }
}

// ---------------------------------------------------------------------------
// CAD-451: Fox — crepuscular, beach/south zones at dawn & dusk
// ---------------------------------------------------------------------------
class Fox {
  constructor(scene, homeX, homeZ) {
    this.homeX = homeX; this.homeZ = homeZ;
    this.group = new THREE.Group();
    this.visible = false;
    this._t = Math.random() * Math.PI * 2;

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 1.1), new THREE.MeshLambertMaterial({ color: 0xd4621a }));
    body.position.y = 0.55;
    this.group.add(body);
    // Head
    const head = sphere(0.22, 0xd4621a, 7);
    head.position.set(0, 0.85, -0.55);
    this.group.add(head);
    // Snout (elongated)
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.28), new THREE.MeshLambertMaterial({ color: 0xeea060 }));
    snout.position.set(0, 0.76, -0.74);
    this.group.add(snout);
    // Ears
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), new THREE.MeshLambertMaterial({ color: 0xd4621a }));
      ear.position.set(s * 0.13, 1.1, -0.5);
      this.group.add(ear);
    });
    // Tail (bushy)
    const tailGroup = new THREE.Group();
    const tailBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.5), new THREE.MeshLambertMaterial({ color: 0xd4621a }));
    tailBase.position.set(0, 0.55, 0.55);
    tailBase.rotation.x = -0.5;
    tailGroup.add(tailBase);
    const tailTip = sphere(0.16, 0xffffff, 6);
    tailTip.position.set(0, 0.65, 0.85);
    tailGroup.add(tailTip);
    this.group.add(tailGroup);
    this._tailGroup = tailGroup;
    // Legs
    const legPos = [[-0.15, 0.28, -0.35], [0.15, 0.28, -0.35], [-0.15, 0.28, 0.3], [0.15, 0.28, 0.3]];
    this._legs = [];
    for (const [lx, ly, lz] of legPos) {
      const leg = cylinder(0.05, 0.04, 0.42, 0xc05010, 5);
      leg.position.set(lx, ly, lz);
      this.group.add(leg);
      this._legs.push(leg);
    }

    this.group.visible = false;
    const groundY = getHeight(homeX, homeZ);
    this.group.position.set(homeX, groundY, homeZ);
    scene.add(this.group);
  }

  setVisible(v) {
    if (v !== this.visible) { this.visible = v; this.group.visible = v; }
  }

  update(delta) {
    if (!this.visible) return;
    this._t += delta;
    const angle = this._t * 0.22;
    const r = 10;
    const nx = this.homeX + Math.sin(angle) * r;
    const nz = this.homeZ + Math.cos(angle * 0.6) * r;
    this.group.position.x += (nx - this.group.position.x) * delta * 2;
    this.group.position.z += (nz - this.group.position.z) * delta * 2;
    const groundY = getHeight(this.group.position.x, this.group.position.z);
    this.group.position.y = groundY;
    this.group.rotation.y = Math.atan2(nx - this.group.position.x, nz - this.group.position.z);

    const legAnim = Math.sin(this._t * 5) * 0.35;
    if (this._legs.length === 4) {
      this._legs[0].rotation.x =  legAnim;
      this._legs[1].rotation.x = -legAnim;
      this._legs[2].rotation.x = -legAnim;
      this._legs[3].rotation.x =  legAnim;
    }
    if (this._tailGroup) {
      this._tailGroup.rotation.x = Math.sin(this._t * 1.5) * 0.15;
    }
  }
}

export class WildlifeManager {
  constructor(scene) {
    this.animals = [];
    this._timedAnimals = []; // { animal, zones, hourStart, hourEnd }
    this._currentHour = 8;

    // Seagulls — orbiting dock and south beach
    const seagullDefs = [
      { cx: 0,   cz: 220,  r: 35, h: 18, phase: 0 },
      { cx: 0,   cz: 220,  r: 25, h: 24, phase: 2.1 },
      { cx: 0,   cz: 220,  r: 45, h: 14, phase: 4.2 },
      { cx: 20,  cz: -200, r: 30, h: 16, phase: 1.0 },
      { cx: -15, cz: -200, r: 20, h: 22, phase: 3.5 },
      { cx: 0,   cz: 0,    r: 50, h: 30, phase: 1.7 }, // high one over town
      // CAD-430: extra harbour seagulls
      { cx: 10,  cz: 360,  r: 20, h: 12, phase: 0.8 },
      { cx: -5,  cz: 355,  r: 28, h: 16, phase: 3.2 },
    ];
    for (const d of seagullDefs) {
      this.animals.push(new Seagull(scene, d.cx, d.cz, d.r, d.h, d.phase));
    }

    // Rabbits — in grassy areas away from the beach
    const rabbitSpots = [
      [-155, 90],   // near farm
      [-140, 70],
      [-165, 110],
      [160, 100],   // forest side
      [170, 130],
      [150, 115],
      [-20, -100],  // hilltop area
      [10,  -90],
      [-50, -60],
      [30,  -50],
    ];
    for (const [x, z] of rabbitSpots) {
      this.animals.push(new Rabbit(scene, x, z));
    }

    // Butterflies — near gardens and flowers
    const butterflySpots = [
      [-70, 55],   // workshop garden
      [-75, 60],
      [-60, 50],
      [-165, 60],  // farm garden
      [-160, 65],
      [0, 10],     // town square
      [5, -5],
      [-10, 8],
      [80, 40],    // library gardens
      [85, 35],
    ];
    for (const [x, z] of butterflySpots) {
      this.animals.push(new Butterfly(scene, x, z));
    }

    // CAD-451: Timed zone-specific encounters

    // Deer — dawn (5-9) and dusk (17-21) in forest zone
    const deerSpots = [
      [258, 170], [272, 195], [285, 180], [262, 210],
    ];
    for (const [x, z] of deerSpots) {
      const deer = new Deer(scene, x, z);
      this._timedAnimals.push({
        animal: deer,
        hourRanges: [[5, 9], [17, 21]],
      });
    }

    // Owls — night (20-6) in forest zone
    const owlSpots = [
      [268, 178], [280, 200],
    ];
    for (const [x, z] of owlSpots) {
      const owl = new Owl(scene, x, z);
      this._timedAnimals.push({
        animal: owl,
        hourRanges: [[20, 24], [0, 6]],
      });
    }

    // Foxes — dawn (5-8) and dusk (18-21) near beach/south quarter
    const foxSpots = [
      [30, -280], [-20, -290], [50, -260],
    ];
    for (const [x, z] of foxSpots) {
      const fox = new Fox(scene, x, z);
      this._timedAnimals.push({
        animal: fox,
        hourRanges: [[5, 8], [18, 21]],
      });
    }
  }

  /** Update game hour so timed animals show/hide correctly. */
  setGameHour(hour) {
    this._currentHour = ((hour % 24) + 24) % 24;
    for (const entry of this._timedAnimals) {
      const hr = this._currentHour;
      const active = entry.hourRanges.some(([start, end]) => {
        if (start < end) return hr >= start && hr < end;
        // Wraps midnight: e.g. [20, 6] means 20-24 and 0-6
        return hr >= start || hr < end;
      });
      entry.animal.setVisible(active);
    }
  }

  update(delta) {
    for (const animal of this.animals) {
      animal.update(delta);
    }
    for (const entry of this._timedAnimals) {
      entry.animal.update(delta);
    }
  }
}
