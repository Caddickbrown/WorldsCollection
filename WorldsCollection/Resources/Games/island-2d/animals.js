/**
 * Farm Animals & Apiary
 *
 * Sheep, Pigs, Cows at the farm.
 * Beehives with orbiting bees near the hilltop meadow.
 */

import * as THREE from 'three';
import { getHeight } from './scene.js';

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

// ---------------------------------------------------------------------------
// Sheep
// ---------------------------------------------------------------------------

class Sheep {
  constructor(scene, x, z) {
    this.homeX = x; this.homeZ = z;
    this.tx = x; this.tz = z;
    this.state = 'idle'; this.timer = Math.random() * 3;
    this.phase = Math.random() * Math.PI * 2;
    this.group = new THREE.Group();

    // Fluffy body — cluster of spheres
    const woolMat = mat(0xf0ede8);
    const puffs = [
      [0, 0.30, 0, 0.28], [-0.20, 0.25, 0, 0.22], [0.20, 0.25, 0, 0.22],
      [0, 0.44, 0, 0.20], [-0.11, 0.38, 0.14, 0.18], [0.11, 0.38, 0.14, 0.18],
    ];
    for (const [px, py, pz, r] of puffs) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), woolMat);
      p.position.set(px, py, pz); this.group.add(p);
    }
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), mat(0xd4c8a0));
    head.position.set(0, 0.34, -0.30); this.group.add(head);
    // Eyes
    const eyeM = mat(0x111122);
    const eyeG = new THREE.SphereGeometry(0.028, 5, 4);
    const eL = new THREE.Mesh(eyeG, eyeM); eL.position.set(-0.065, 0.38, -0.42); this.group.add(eL);
    const eR = new THREE.Mesh(eyeG, eyeM); eR.position.set( 0.065, 0.38, -0.42); this.group.add(eR);
    // Legs
    const legM = mat(0xbcaa90);
    const legG = new THREE.CylinderGeometry(0.04, 0.035, 0.22, 5);
    [[-0.12,0.11,0.10],[0.12,0.11,0.10],[-0.10,0.11,-0.12],[0.10,0.11,-0.12]].forEach(([lx,ly,lz]) => {
      const l = new THREE.Mesh(legG, legM); l.position.set(lx, ly, lz); this.group.add(l);
    });

    this.group.scale.setScalar(2.5);
    this.group.position.set(x, getHeight(x, z), z);
    scene.add(this.group);
  }

  update(delta) {
    this.timer -= delta;
    if (this.timer <= 0) {
      if (this.state === 'idle') {
        const a = Math.random() * Math.PI * 2;
        const d = 3 + Math.random() * 10;
        this.tx = this.homeX + Math.cos(a) * d;
        this.tz = this.homeZ + Math.sin(a) * d;
        this.state = 'walking'; this.timer = 1.5 + Math.random() * 2;
      } else {
        this.state = 'idle'; this.timer = 2 + Math.random() * 4;
      }
    }
    if (this.state === 'walking') {
      const p = this.group.position;
      const dx = this.tx - p.x, dz = this.tz - p.z;
      const dist = Math.sqrt(dx*dx+dz*dz);
      if (dist > 0.4) {
        const s = 1.2 * delta;
        p.x += (dx/dist)*s; p.z += (dz/dist)*s;
        this.group.rotation.y = Math.atan2(dx, dz) + Math.PI;
      }
      // Gentle hop while walking
      this.phase += delta * 5;
      p.y = getHeight(p.x, p.z) + Math.max(0, Math.sin(this.phase) * 0.06);
    } else {
      this.group.position.y = getHeight(this.group.position.x, this.group.position.z);
    }
  }
}

// ---------------------------------------------------------------------------
// Pig
// ---------------------------------------------------------------------------

class Pig {
  constructor(scene, x, z) {
    this.homeX = x; this.homeZ = z;
    this.tx = x; this.tz = z;
    this.state = 'idle'; this.timer = Math.random() * 2;
    this.group = new THREE.Group();

    const pinkM = mat(0xf4a8b8);
    const snoutM = mat(0xe89aaa);
    const eyeM = mat(0x221111);

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 6), pinkM);
    body.scale.set(1, 0.78, 1.3); body.position.y = 0.24; this.group.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), pinkM);
    head.position.set(0, 0.30, -0.28); this.group.add(head);
    // Snout
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 8), snoutM);
    snout.rotation.x = Math.PI/2; snout.position.set(0, 0.28, -0.46); this.group.add(snout);
    // Nostrils
    const nostG = new THREE.SphereGeometry(0.025, 5, 4);
    [-0.04, 0.04].forEach(ox => {
      const n = new THREE.Mesh(nostG, eyeM); n.position.set(ox, 0.28, -0.49); this.group.add(n);
    });
    // Eyes
    const eyeG = new THREE.SphereGeometry(0.030, 5, 4);
    [-0.09, 0.09].forEach(ox => {
      const e = new THREE.Mesh(eyeG, eyeM); e.position.set(ox, 0.36, -0.43); this.group.add(e);
    });
    // Ears
    const earG = new THREE.ConeGeometry(0.07, 0.10, 5);
    [-0.14, 0.14].forEach((ox, i) => {
      const ear = new THREE.Mesh(earG, pinkM);
      ear.position.set(ox, 0.48, -0.26);
      ear.rotation.z = i === 0 ? 0.4 : -0.4; this.group.add(ear);
    });
    // Curly tail
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 5, 8, Math.PI*1.5), pinkM);
    tail.position.set(0, 0.28, 0.38); tail.rotation.x = 0.5; this.group.add(tail);
    // Legs
    const legG = new THREE.CylinderGeometry(0.05, 0.04, 0.18, 5);
    [[-0.14,0.09,0.12],[0.14,0.09,0.12],[-0.12,0.09,-0.15],[0.12,0.09,-0.15]].forEach(([lx,ly,lz]) => {
      const l = new THREE.Mesh(legG, pinkM); l.position.set(lx, ly, lz); this.group.add(l);
    });

    this.group.scale.setScalar(2.2);
    this.group.position.set(x, getHeight(x, z), z);
    scene.add(this.group);
  }

  update(delta) {
    this.timer -= delta;
    if (this.timer <= 0) {
      if (this.state === 'idle') {
        const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 8;
        this.tx = this.homeX + Math.cos(a)*d; this.tz = this.homeZ + Math.sin(a)*d;
        this.state = 'walking'; this.timer = 1 + Math.random() * 1.5;
      } else { this.state = 'idle'; this.timer = 2 + Math.random() * 5; }
    }
    if (this.state === 'walking') {
      const p = this.group.position;
      const dx = this.tx - p.x, dz = this.tz - p.z;
      const dist = Math.sqrt(dx*dx+dz*dz);
      if (dist > 0.3) {
        const s = 1.5 * delta; p.x += (dx/dist)*s; p.z += (dz/dist)*s;
        this.group.rotation.y = Math.atan2(dx, dz) + Math.PI;
      }
    }
    this.group.position.y = getHeight(this.group.position.x, this.group.position.z);
  }
}

// ---------------------------------------------------------------------------
// Cow
// ---------------------------------------------------------------------------

class Cow {
  constructor(scene, x, z) {
    this.homeX = x; this.homeZ = z;
    this.tx = x; this.tz = z;
    this.state = 'idle'; this.timer = Math.random() * 5 + 2;
    this.group = new THREE.Group();

    const bodyM = mat(0xd4c8b0);
    const patchM = mat(0x3a2a1a);
    const eyeM = mat(0x0a0a0a);
    const pinkM = mat(0xe0a090);
    const hoofM = mat(0x1a1614);

    // Body — large elongated
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 6), bodyM);
    body.scale.set(1, 0.80, 1.6); body.position.y = 0.50; this.group.add(body);
    // Patches on back
    const patch1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), patchM);
    patch1.scale.set(1, 0.3, 1.2); patch1.position.set(0.1, 0.84, 0.2); this.group.add(patch1);
    const patch2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), patchM);
    patch2.scale.set(1, 0.3, 0.9); patch2.position.set(-0.2, 0.82, -0.3); this.group.add(patch2);
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.40), bodyM);
    head.position.set(0, 0.60, -0.70); this.group.add(head);
    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.14), pinkM);
    snout.position.set(0, 0.56, -0.88); this.group.add(snout);
    // Eyes
    const eyeG = new THREE.SphereGeometry(0.045, 5, 4);
    [-0.14, 0.14].forEach(ox => {
      const e = new THREE.Mesh(eyeG, eyeM); e.position.set(ox, 0.70, -0.66); this.group.add(e);
    });
    // Ears
    [-0.26, 0.26].forEach((ox, i) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 4), bodyM);
      ear.scale.set(1, 0.5, 0.7); ear.position.set(ox, 0.70, -0.58); this.group.add(ear);
    });
    // Horns
    [-0.16, 0.16].forEach(ox => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.20, 5), mat(0xd4c090));
      horn.rotation.z = ox < 0 ? -0.5 : 0.5; horn.position.set(ox, 0.82, -0.60); this.group.add(horn);
    });
    // Legs
    const legG = new THREE.CylinderGeometry(0.08, 0.07, 0.50, 6);
    [[-0.22,0.25,0.38],[0.22,0.25,0.38],[-0.20,0.25,-0.40],[0.20,0.25,-0.40]].forEach(([lx,ly,lz]) => {
      const l = new THREE.Mesh(legG, bodyM); l.position.set(lx, ly, lz); this.group.add(l);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 6), hoofM);
      h.position.set(lx, ly - 0.26, lz); this.group.add(h);
    });
    // Udder
    const udder = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), pinkM);
    udder.scale.set(1.2, 0.6, 1); udder.position.set(0, 0.22, 0.30); this.group.add(udder);
    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.45, 5), bodyM);
    tail.rotation.x = 0.3; tail.position.set(0, 0.52, 0.78); this.group.add(tail);
    const tailTuft = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), patchM);
    tailTuft.position.set(0, 0.28, 0.94); this.group.add(tailTuft);

    this.group.scale.setScalar(2.0);
    this.group.position.set(x, getHeight(x, z), z);
    scene.add(this.group);
  }

  update(delta) {
    this.timer -= delta;
    if (this.timer <= 0) {
      if (this.state === 'idle') {
        const a = Math.random() * Math.PI * 2, d = 3 + Math.random() * 12;
        this.tx = this.homeX + Math.cos(a)*d; this.tz = this.homeZ + Math.sin(a)*d;
        this.state = 'walking'; this.timer = 2 + Math.random() * 3;
      } else { this.state = 'idle'; this.timer = 4 + Math.random() * 8; }
    }
    if (this.state === 'walking') {
      const p = this.group.position;
      const dx = this.tx - p.x, dz = this.tz - p.z;
      const dist = Math.sqrt(dx*dx+dz*dz);
      if (dist > 0.5) {
        const s = 1.8 * delta; p.x += (dx/dist)*s; p.z += (dz/dist)*s;
        this.group.rotation.y = Math.atan2(dx, dz) + Math.PI;
      }
    }
    this.group.position.y = getHeight(this.group.position.x, this.group.position.z);
  }
}

// ---------------------------------------------------------------------------
// Apiary — beehives + orbiting bees
// ---------------------------------------------------------------------------

class Apiary {
  constructor(scene, x, z) {
    this.x = x; this.z = z;
    this.bees = [];
    this.time = 0;

    const base = getHeight(x, z);
    const hiveM = mat(0xc8a060);
    const roofM = mat(0x8b6914);
    const stripeM = mat(0xe8c880);

    // 3 hive boxes stacked
    const hiveSpots = [[x, z], [x+2.5, z+0.5], [x-0.5, z+2]];
    hiveSpots.forEach(([hx, hz], i) => {
      const hy = getHeight(hx, hz);
      // Base stand
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 6), mat(0x8b6914));
      stand.position.set(hx, hy + 0.2, hz); scene.add(stand);
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.85), hiveM);
      body.position.set(hx, hy + 0.85, hz); scene.add(body);
      // Stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.12, 0.87), stripeM);
      stripe.position.set(hx, hy + 0.65, hz); scene.add(stripe);
      // Entrance
      const entrance = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.08), mat(0x2a1a0a));
      entrance.position.set(hx, hy + 0.45, hz + 0.45); scene.add(entrance);
      // Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.25, 1.0), roofM);
      roof.position.set(hx, hy + 1.38, hz); scene.add(roof);

      // Bees per hive
      for (let b = 0; b < 5; b++) {
        const bee = this._makeBee(scene);
        this.bees.push({ mesh: bee, hx, hz, hy: hy + 1.0, phase: (b / 5) * Math.PI * 2 + i * 1.1, speed: 0.8 + Math.random() * 0.6, r: 1.2 + Math.random() * 1.5, yOff: Math.random() * 0.8 });
      }
    });
  }

  _makeBee(scene) {
    const g = new THREE.Group();
    const bodyM = new THREE.MeshLambertMaterial({ color: 0xd4860a });
    const wingM = new THREE.MeshLambertMaterial({ color: 0xddf4ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const eyeM = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    const stripeM = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), bodyM);
    body.scale.z = 1.6; g.add(body);
    // Stripes
    [-0.03, 0.03].forEach(bz => {
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 4, 8), stripeM);
      s.rotation.x = Math.PI/2; s.position.z = bz; g.add(s);
    });
    // Wings
    const wingG = new THREE.CircleGeometry(0.07, 6);
    [-1, 1].forEach(side => {
      const w = new THREE.Mesh(wingG, wingM);
      w.position.set(side * 0.07, 0.04, 0);
      w.rotation.z = side * 0.4; g.add(w);
    });
    // Eyes
    [-0.025, 0.025].forEach(ox => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 3), eyeM);
      e.position.set(ox, 0.02, -0.07); g.add(e);
    });
    scene.add(g);
    return g;
  }

  update(delta) {
    this.time += delta;
    for (const b of this.bees) {
      b.phase += delta * b.speed;
      const x = b.hx + Math.cos(b.phase) * b.r;
      const z = b.hz + Math.sin(b.phase) * b.r;
      const y = b.hy + b.yOff + Math.sin(b.phase * 2.3) * 0.3;
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.y = -b.phase + Math.PI / 2;
      // Wing flap
      b.mesh.children[3].rotation.z =  0.4 + Math.sin(this.time * 20) * 0.3;
      b.mesh.children[4].rotation.z = -0.4 - Math.sin(this.time * 20) * 0.3;
    }
  }
}

// ---------------------------------------------------------------------------
// Animal Manager
// ---------------------------------------------------------------------------

export class AnimalManager {
  constructor(scene) {
    this.animals = [];

    // Sheep at farm
    const sheepSpots = [[-190,85],[-175,95],[-200,100],[-185,110],[-170,80],[-195,75]];
    for (const [x, z] of sheepSpots) this.animals.push(new Sheep(scene, x, z));

    // Pigs near the barn
    const pigSpots = [[-185,68],[-178,72],[-190,78],[-182,60]];
    for (const [x, z] of pigSpots) this.animals.push(new Pig(scene, x, z));

    // Cows on the far field
    const cowSpots = [[-205,100],[-198,115],[-215,90]];
    for (const [x, z] of cowSpots) this.animals.push(new Cow(scene, x, z));

    // Apiary — meadow between hilltop and workshop
    this.apiary = new Apiary(scene, -90, 60);
    this.animals.push(this.apiary);
  }

  update(delta) {
    for (const a of this.animals) a.update(delta);
  }
}
