/**
 * House — a large, detailed designer residence.
 * Concrete, glass, timber. Brutalist-meets-warm.
 *
 * Layout:
 *   Ground floor:  Entry hall · Open kitchen/dining · Living room (double-height)
 *                  Utility · WC · Study/Library · Garage (2-car)
 *   First floor:   Gallery landing · Master suite · 2× bedrooms · 2× bathrooms
 *   Exterior:      Stone terrace · Lap pool · Main garden
 *                  Garden studio · Walled kitchen garden · Driveway
 *
 * Scale: main block ~42×22m, plot ~200×180m
 */

import * as THREE from 'three';

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  concrete:    0xd4cec8,
  concreteDk:  0xb8b0a8,
  timber:      0xa0724a,
  timberDk:    0x7a5535,
  glass:       0x8ec8e8,
  steel:       0x8a9098,
  steelDk:     0x606870,
  white:       0xf5f2ee,
  offWhite:    0xe8e2d8,
  floorWood:   0xc8a070,
  floorWoodDk: 0xa07848,
  stone:       0xb0a898,
  stoneDk:     0x887e74,
  marble:      0xe8e0d8,
  grass:       0x6a9a3a,
  gravel:      0xb8b0a0,
  water:       0x3878a8,
  soil:        0x5a4030,
};

// Materials are memoized — hundreds of meshes share a handful of materials
// instead of each allocating its own.
const _matCache = new Map();
function stdMat(color, opts = {}) {
  let key = color;
  for (const k in opts) {
    const v = opts[k];
    key += '|' + k + ':' + (v && v.isTexture ? v.uuid : v);
  }
  let m = _matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.0, ...opts });
    _matCache.set(key, m);
  }
  return m;
}

// All boxes/planes share one unit geometry, sized via mesh.scale —
// normals, raycasts and bounding boxes all handle non-uniform scale.
const _unitBox = new THREE.BoxGeometry(1, 1, 1);
const _unitPlane = new THREE.PlaneGeometry(1, 1);
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(_unitBox, stdMat(color, opts));
  m.scale.set(w, h, d);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function plane(w, d, color, opts = {}) {
  const m = new THREE.Mesh(_unitPlane, stdMat(color, opts));
  m.scale.set(w, d, 1);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  m.userData.noShadow = true; // horizontal surfaces never need to cast
  return m;
}

// ─── Procedural textures ─────────────────────────────────────────────────────
// Small canvases drawn once at load. They are kept near-white so the
// material colour still dominates (maps multiply with material.color).
function makeTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Same image, different tiling — clones share the underlying canvas.
function repTex(base, rx, ry) {
  const t = base.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

function speckleDraw(base, amp, count) {
  return (ctx, s) => {
    ctx.fillStyle = `rgb(${base},${base},${base})`;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < count; i++) {
      const v = base + (Math.random() - 0.5) * 2 * amp;
      ctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
      const r = 1 + Math.random() * 2.5;
      ctx.fillRect(Math.random() * s, Math.random() * s, r, r);
    }
  };
}

const TEX = {
  grass: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3500; i++) {
      const v = 185 + Math.random() * 70;
      ctx.strokeStyle = `rgb(${v|0},${v|0},${v|0})`;
      const x = Math.random() * s, y = Math.random() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 2 - Math.random() * 3);
      ctx.stroke();
    }
  }),
  gravel: makeTexture(256, speckleDraw(215, 55, 5000)),
  wood: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#e6e0d8';
    ctx.fillRect(0, 0, s, s);
    const plankW = s / 4;
    for (let p = 0; p < 4; p++) {
      // grain streaks
      for (let i = 0; i < 40; i++) {
        const v = 200 + Math.random() * 50;
        ctx.strokeStyle = `rgba(${v|0},${(v*0.96)|0},${(v*0.9)|0},0.5)`;
        const x = p * plankW + Math.random() * plankW;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 4, s * 0.3, x - 4, s * 0.7, x + 2, s);
        ctx.stroke();
      }
      // plank joint
      ctx.fillStyle = 'rgba(90,75,60,0.55)';
      ctx.fillRect(p * plankW, 0, 2, s);
    }
  }),
  marble: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#f2efec';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9; i++) {
      const g = 175 + Math.random() * 50;
      ctx.strokeStyle = `rgba(${g|0},${g|0},${(g+6)|0},0.55)`;
      ctx.lineWidth = 0.6 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, 0);
      ctx.bezierCurveTo(Math.random() * s, s * 0.33, Math.random() * s, s * 0.66, Math.random() * s, s);
      ctx.stroke();
    }
  }),
  paver: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#e2ded8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i++) {
      const v = 195 + Math.random() * 50;
      ctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
    ctx.fillStyle = 'rgba(70,64,58,0.7)';
    ctx.fillRect(0, 0, 3, s);
    ctx.fillRect(0, 0, s, 3);
  }),
};

// ─── Animation hook ──────────────────────────────────────────────────────────
// The viewer calls tickScene(elapsedSeconds, deltaSeconds) every frame.
const _animators = [];
export function tickScene(t, dt) {
  for (const fn of _animators) fn(t, dt);
}

// ─── Interactables ───────────────────────────────────────────────────────────
// Objects the player can inspect with [E]. The viewer raycasts against this
// list only, so it stays cheap.
export const INTERACTABLES = [];
function inspectable(mesh, name, text) {
  mesh.userData.inspect = { name, text };
  INTERACTABLES.push(mesh);
  return mesh;
}

// ─── Room zones (for HUD label detection) ───────────────────────────────────
export const ROOMS = [
  { label: 'Entry Hall',      x: 0,    z: -12,  r: 6  },
  { label: 'Living Room',     x: -14,  z: 0,    r: 10 },
  { label: 'Kitchen',         x: 10,   z: -2,   r: 8  },
  { label: 'Dining',          x: 5,    z: 8,    r: 7  },
  { label: 'Study',           x: 18,   z: 8,    r: 6  },
  { label: 'Utility Room',    x: 18,   z: -8,   r: 5  },
  { label: 'Garage',          x: 26,   z: 0,    r: 8  },
  { label: 'Master Suite',    x: -12,  z: -2,   r: 8, floor: 1 },
  { label: 'Bedroom 2',       x: 4,    z: -10,  r: 6, floor: 1 },
  { label: 'Bedroom 3',       x: 14,   z: -10,  r: 6, floor: 1 },
  { label: 'Gallery Landing', x: 0,    z: 2,    r: 6, floor: 1 },
  { label: 'Terrace',         x: -5,   z: 18,   r: 12 },
  { label: 'Pool',            x: 5,    z: 30,   r: 8  },
  { label: 'Garden',          x: 0,    z: 52,   r: 22 },
  { label: 'Studio',          x: 22,   z: 35,   r: 8  },
  { label: 'Kitchen Garden',  x: -22,  z: 40,   r: 10 },
];

export function getRoomLabel(x, z, y) {
  const floor = y > 3.8 ? 1 : 0;
  let best = null, bestDist = Infinity;
  for (const r of ROOMS) {
    if ((r.floor || 0) !== floor) continue;
    const dx = x - r.x, dz = z - r.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < r.r && dist < bestDist) { best = r.label; bestDist = dist; }
  }
  return best || '';
}

// ─── Main build ──────────────────────────────────────────────────────────────
export function buildHouse(scene) {
  buildGround(scene);
  buildMainBlock(scene);
  buildGarage(scene);
  buildFirstFloor(scene);
  buildRoof(scene);
  buildTerrace(scene);
  buildPool(scene);
  buildGarden(scene);
  buildStudio(scene);
  buildKitchenGarden(scene);
  buildDriveway(scene);
  buildTrees(scene);
}

// ─── Ground & plot ───────────────────────────────────────────────────────────
// Ground level: lawn sits at y=-0.22 so the concrete foundation slab (top=y=0)
// forms a clean visible plinth ~22cm above the grass. All hardscape (terrace,
// pool, driveway) is at y=0 and above — sits naturally on the plinth level.
const GROUND_Y = -0.22;

function buildGround(scene) {
  const lawn = plane(200, 200, P.grass, { map: repTex(TEX.grass, 80, 80) });
  lawn.position.set(0, GROUND_Y, 25);
  scene.add(lawn);

  const forecourt = plane(40, 20, P.gravel, { map: repTex(TEX.gravel, 20, 10) });
  forecourt.position.set(12, GROUND_Y + 0.01, -20);
  scene.add(forecourt);

  function boundaryWall(w, h, d, x, z) {
    const m = box(w, h, d, P.stone);
    m.position.set(x, GROUND_Y + h/2, z);
    scene.add(m);
  }
  boundaryWall(200, 0.8, 0.3, 0, -29);
  boundaryWall(0.3, 0.8, 220, -100, 25);
  boundaryWall(0.3, 0.8, 220, 100, 25);
}

// ─── Ground floor ────────────────────────────────────────────────────────────
function buildMainBlock(scene) {
  const FH = 3.4, WT = 0.3;

  // Foundation slab edge
  const slab = box(42, 0.3, 22, P.concreteDk);
  slab.position.set(0, -0.15, 0);
  slab.receiveShadow = true;
  scene.add(slab);

  // Interior floor
  const gFloor = plane(40, 20, P.floorWood, { map: repTex(TEX.wood, 20, 10) });
  gFloor.position.set(0, 0.01, 0);
  scene.add(gFloor);

  buildSouthFacade(scene, FH, WT);
  buildNorthFacade(scene, FH, WT);
  buildWestFacade(scene, FH, WT);
  buildEastFacade(scene, FH, WT);

  buildEntryHall(scene, FH);
  buildLivingRoom(scene, FH);
  buildKitchen(scene, FH);
  buildDining(scene, FH);
  buildStudy(scene, FH);
  buildUtility(scene, FH);
  buildWC(scene, FH);
  buildStaircase(scene, FH);
}

function buildSouthFacade(scene, fh, wt) {
  // Concrete piers flanking glazed entry
  [{ x: -18.5 }, { x: 18.5 }].forEach(({ x }) => {
    const pier = box(3, fh, wt, P.concrete);
    pier.position.set(x, fh/2, -11);
    scene.add(pier);
  });
  const lintel = box(34, 0.5, wt, P.concrete);
  lintel.position.set(0, fh - 0.25, -11);
  scene.add(lintel);
  const cladTop = box(34, 0.6, 0.1, P.timber);
  cladTop.position.set(0, fh - 0.9, -10.9);
  scene.add(cladTop);

  // Large glass panes — fixed glazing, so they block (the openable front
  // door is the way in; the north facade sliders stay passable)
  [-8, 8].forEach(x => {
    const gl = box(6, fh - 0.5, 0.08, P.glass, { transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.3 });
    gl.position.set(x, fh/2 - 0.25, -10.95);
    gl.userData.collide = 'wall';
    scene.add(gl);
  });
  // Sidelights between the door and the big panes (was an invisible gap)
  [-2.8, 2.8].forEach(x => {
    const gl = box(4.4, fh - 0.5, 0.08, P.glass, { transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.3 });
    gl.position.set(x, fh/2 - 0.25, -10.95);
    gl.userData.collide = 'wall';
    scene.add(gl);
  });
  // Front door — hinged on a group so [E] swings it open/closed.
  // Collision follows automatically: the door mesh is a tagged wall and
  // raycasts respect its animated world matrix.
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-0.55, 0, -10.93);
  const door = box(1.1, 2.4, 0.06, P.steelDk);
  door.position.set(0.55, 1.2, 0);
  door.userData.collide = 'wall';
  doorGroup.add(door);
  const handle = box(0.05, 0.35, 0.06, 0xc8a838);
  handle.position.set(1.0, 1.1, 0.05);
  handle.userData.collide = 'none';
  handle.userData.noShadow = true;
  doorGroup.add(handle);
  scene.add(doorGroup);
  const doorState = { open: false };
  inspectable(door, 'Front Door', 'Blackened steel, pivot-hung. It weighs more than it looks, and it looks heavy.');
  door.userData.inspect.action = () => { doorState.open = !doorState.open; };
  _animators.push((t, dt) => {
    const target = doorState.open ? -1.85 : 0; // swings inward, away from the steps
    doorGroup.rotation.y += (target - doorGroup.rotation.y) * Math.min(1, 6 * (dt || 0.016));
  });
  // Flanking panels
  [-14, 14].forEach(x => {
    const pan = box(6, fh, wt, P.concrete);
    pan.position.set(x, fh/2, -11);
    scene.add(pan);
  });
  // Entrance steps — 3 wide stone steps bridging lawn level (GROUND_Y ≈ -0.22) to floor (y=0)
  // Each step is ~7cm tall; steps project forward (south) from the facade
  const stepRise = 0.075;
  const stepRun  = 0.38;
  const stepW    = 5.5;
  for (let i = 0; i < 3; i++) {
    const stepH = stepRise * (i + 1);
    const st = box(stepW, stepH, stepRun, P.stone);
    st.position.set(0, GROUND_Y + stepH / 2, -11 - stepRun * (3 - i) + stepRun / 2);
    scene.add(st);
  }

  // Olive trees flanking door
  [[-3, -10.5], [3, -10.5]].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.8, 7), stdMat(0x8a7a60));
    trunk.position.set(x, 0.9, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.7, 7, 5), stdMat(0x8aaa78));
    canopy.position.set(x, 2.3, z);
    canopy.castShadow = true;
    inspectable(canopy, 'Olive Tree', 'A matched pair flanks the entry. Eighty years old, transplanted with absurd care.');
    scene.add(canopy);
  });
}

function buildNorthFacade(scene, fh, wt) {
  for (let i = 0; i < 5; i++) {
    const col = box(0.3, fh, wt, P.steelDk);
    col.position.set(-16 + i * 8, fh/2, 11);
    scene.add(col);
  }
  for (let i = 0; i < 4; i++) {
    const gp = box(7.4, fh, 0.06, P.glass, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3 });
    gp.position.set(-12 + i * 8, fh/2, 11);
    scene.add(gp);
  }
  const trackBot = box(32, 0.05, 0.06, P.steel);
  trackBot.position.set(0, 0.025, 11);
  scene.add(trackBot);
}

function buildWestFacade(scene, fh, wt) {
  const wall = box(wt, fh, 22, P.concrete);
  wall.position.set(-20, fh/2, 0);
  scene.add(wall);
  [-4, 4].forEach(z => {
    const win = box(0.09, 1.2, 0.7, P.glass, { transparent: true, opacity: 0.45 });
    win.position.set(-19.85, 2.0, z);
    scene.add(win);
  });
}

function buildEastFacade(scene, fh, wt) {
  const wall = box(wt, fh, 22, P.timberDk);
  wall.position.set(20, fh/2, 0);
  scene.add(wall);
  for (let y = 0.3; y < fh - 0.3; y += 0.35) {
    const strip = box(0.05, 0.05, 21, P.timber);
    strip.position.set(20.1, y, 0);
    strip.userData.noShadow = true;
    scene.add(strip);
  }
}

function buildEntryHall(scene, fh) {
  const partW = box(0.2, fh, 12, P.offWhite);
  partW.position.set(-6, fh/2, -5);
  scene.add(partW);
  const hallFloor = plane(14, 8, P.stoneDk, { map: repTex(TEX.paver, 12, 7) });
  hallFloor.position.set(0, 0.04, -8.5);
  scene.add(hallFloor);
  // Coat rack
  const rack = box(1.4, 0.05, 0.06, P.timber);
  rack.position.set(-4, 1.9, -10.5);
  scene.add(rack);
  [-0.5, 0, 0.5].forEach(dx => {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), stdMat(P.steel));
    hook.position.set(-4 + dx, 1.82, -10.45);
    hook.rotation.x = 0.4;
    hook.userData.noShadow = true;
    scene.add(hook);
  });
  // Console table
  const ct = box(1.2, 0.85, 0.4, P.timberDk);
  ct.position.set(4, 0.425, -10.0);
  scene.add(ct);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.3, 8), stdMat(0x5a9a60));
  vase.position.set(4, 0.95, -10.0);
  vase.userData.noShadow = true;
  inspectable(vase, 'Celadon Vase', 'Hand-thrown stoneware. The only object in the hall, which is the point.');
  scene.add(vase);
}

function buildLivingRoom(scene, fh) {
  // Double-height — ceiling is at first floor level (~3.7) but open to roof lantern
  const fw = box(0.15, fh, 20, P.timber);
  fw.position.set(-19.8, fh/2, 0);
  scene.add(fw);
  for (let y = 0.3; y < fh - 0.2; y += 0.4) {
    const g = box(0.05, 0.05, 20, P.timberDk);
    g.position.set(-19.75, y, 0);
    g.userData.noShadow = true;
    scene.add(g);
  }
  // Area rug
  const rug = plane(8, 6, 0x7a5a48);
  rug.position.set(-13, 0.06, 2);
  scene.add(rug);
  // Sofa — L-shaped
  const sofaBody = box(5, 0.7, 2.2, 0x5a7a8a);
  sofaBody.position.set(-14, 0.35, 1);
  inspectable(sofaBody, 'Sofa', 'Low, deep, wool-upholstered in storm blue. Built for whole afternoons.');
  scene.add(sofaBody);
  const sofaBack = box(5, 0.9, 0.3, 0x4a6a7a);
  sofaBack.position.set(-14, 0.8, 2.05);
  scene.add(sofaBack);
  const sofaArm = box(0.3, 0.9, 2.2, 0x4a6a7a);
  sofaArm.position.set(-16.35, 0.8, 1);
  scene.add(sofaArm);
  const sofaChaise = box(2.2, 0.7, 2.5, 0x5a7a8a);
  sofaChaise.position.set(-11.3, 0.35, -0.65);
  scene.add(sofaChaise);
  // Cushions
  [[-15, 1.5], [-14, 1.5], [-13, 1.5]].forEach(([x, z]) => {
    const c = box(0.5, 0.4, 0.35, 0xd0c8b8);
    c.position.set(x, 0.75, z);
    scene.add(c);
  });
  // Coffee table
  const ctf = box(1.6, 0.38, 0.9, P.steelDk);
  ctf.position.set(-13, 0.19, -0.5);
  scene.add(ctf);
  const ctfGlass = box(1.5, 0.05, 0.8, 0x3a5a70, { transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.5 });
  ctfGlass.position.set(-13, 0.41, -0.5);
  scene.add(ctfGlass);
  const bk = box(0.35, 0.04, 0.25, 0x8a6030);
  bk.position.set(-13.2, 0.44, -0.5);
  bk.userData.noShadow = true;
  inspectable(bk, 'Monograph', 'A heavy book on concrete houses. Bought for the photographs, kept for the spine.');
  scene.add(bk);
  // Floor lamp
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 8), stdMat(P.steelDk));
  lp.position.set(-11, 0.9, 1.5);
  scene.add(lp);
  const ls = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.35, 12, 1, true), stdMat(0xe8e0c8, { side: THREE.DoubleSide }));
  ls.position.set(-11, 1.9, 1.5);
  ls.userData.noShadow = true;
  inspectable(ls, 'Floor Lamp', 'Linen shade on a steel stem. Warm light for the cold material palette.');
  scene.add(ls);
  const ll = new THREE.PointLight(0xffe8c0, 1.2, 8);
  ll.position.set(-11, 1.85, 1.5);
  scene.add(ll);
  // TV wall unit
  const tvUnit = box(2.8, 0.5, 0.35, P.timberDk);
  tvUnit.position.set(-8, 0.8, -4.8);
  scene.add(tvUnit);
  const tv = box(2.2, 1.3, 0.06, 0x0a0a0a);
  tv.position.set(-8, 1.7, -4.75);
  inspectable(tv, 'Television', 'Mounted flush to the timber wall. Mostly off — the roof lantern is better viewing.');
  scene.add(tv);
  const tvGlow = box(2.1, 1.2, 0.02, 0x1a2030, { emissive: 0x0a1020, emissiveIntensity: 0.3 });
  tvGlow.position.set(-8, 1.7, -4.74);
  scene.add(tvGlow);
  // Bookshelf built-in
  const bsf = box(2, fh * 0.85, 0.3, P.offWhite);
  bsf.position.set(-19.5, fh * 0.425, -6);
  inspectable(bsf, 'Built-in Shelves', 'Novels, mostly. Arranged by neither colour nor author, to general distress.');
  scene.add(bsf);
  const lrBookColors = [0x8b4040, 0x406a8b, 0x5a8b40, 0x8b7040, 0x705a8b];
  const lrShelves = [0.6, 1.4, 2.2];
  const lrBooks = new THREE.InstancedMesh(_unitBox, stdMat(0xffffff), lrShelves.length * lrBookColors.length);
  let lrBi = 0;
  lrShelves.forEach(y => {
    const plank = box(1.9, 0.03, 0.28, P.timberDk);
    plank.position.set(-19.5, y, -6);
    scene.add(plank);
    lrBookColors.forEach((c, i) => {
      _dummy.position.set(-20.3 + i * 0.15, y + 0.15, -6);
      _dummy.scale.set(0.12, 0.28, 0.25);
      _dummy.updateMatrix();
      lrBooks.setMatrixAt(lrBi, _dummy.matrix);
      lrBooks.setColorAt(lrBi, _color.setHex(c));
      lrBi++;
    });
  });
  lrBooks.userData.collide = 'none';
  lrBooks.userData.noShadow = true;
  scene.add(lrBooks);
  // Large abstract artwork
  const art = box(1.8, 1.1, 0.04, 0x2a3a4a);
  art.position.set(-19.7, 2.0, 2);
  inspectable(art, 'Abstract Painting', 'Blues on slate. The artist called it "Harbour, Remembered". The owners call it "the blue one".');
  scene.add(art);
  const artInner = box(1.6, 0.9, 0.02, 0x4a6a88);
  artInner.position.set(-19.68, 2.0, 2);
  scene.add(artInner);
}

function buildKitchen(scene, fh) {
  const kFloor = plane(16, 16, P.marble, { map: repTex(TEX.marble, 4, 4) });
  kFloor.position.set(10, 0.04, -2);
  scene.add(kFloor);
  // Island
  const island = box(3.2, 0.9, 1.4, P.white);
  island.position.set(10, 0.45, -1);
  scene.add(island);
  const islandTop = box(3.3, 0.04, 1.5, P.marble, { map: repTex(TEX.marble, 1, 1) });
  islandTop.position.set(10, 0.92, -1);
  inspectable(islandTop, 'Kitchen Island', 'A single slab of honed marble. Breakfast happens here; so does everything else.');
  scene.add(islandTop);
  // Bar stools
  [-0.8, 0, 0.8].forEach(dx => {
    const ss = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.08, 10), stdMat(P.steelDk));
    ss.position.set(10 + dx, 0.85, -2.2);
    scene.add(ss);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.78, 8), stdMat(P.steel));
    sp.position.set(10 + dx, 0.43, -2.2);
    scene.add(sp);
  });
  // Wall units
  const wUnits = box(10, 0.7, 0.5, P.white);
  wUnits.position.set(9, 2.6, 10.5);
  scene.add(wUnits);
  // Base units
  const bUnits = box(10, 0.9, 0.6, P.white);
  bUnits.position.set(9, 0.45, 10.6);
  scene.add(bUnits);
  const worktop = box(10, 0.04, 0.62, P.stone);
  worktop.position.set(9, 0.92, 10.6);
  scene.add(worktop);
  // Hob on island
  const hob = box(0.6, 0.01, 0.5, 0x1a1a1a);
  hob.position.set(9.5, 0.93, -1);
  scene.add(hob);
  [[-0.15,-0.1],[0.15,-0.1],[-0.15,0.1],[0.15,0.1]].forEach(([dx,dz]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 16), stdMat(0x303030));
    ring.rotation.x = Math.PI/2;
    ring.position.set(9.5+dx, 0.94, -1+dz);
    ring.userData.noShadow = true;
    scene.add(ring);
  });
  // Extractor hood
  const hood = box(0.8, 0.12, 0.6, P.steelDk);
  hood.position.set(9.5, 2.2, -1);
  scene.add(hood);
  const hoodStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), stdMat(P.steel));
  hoodStem.position.set(9.5, 2.7, -1);
  scene.add(hoodStem);
  // Sink
  const sink = box(0.7, 0.12, 0.45, P.steel, { roughness: 0.2, metalness: 0.8 });
  sink.position.set(12, 0.98, 10.55);
  scene.add(sink);
  const tapBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), stdMat(P.steel, { metalness: 0.9, roughness: 0.1 }));
  tapBase.position.set(12, 1.17, 10.4);
  scene.add(tapBase);
  // Fridge
  const fridge = box(0.7, 2.0, 0.65, P.steel, { roughness: 0.3, metalness: 0.6 });
  fridge.position.set(18.5, 1.0, 10.5);
  inspectable(fridge, 'Refrigerator', 'Stainless, silent, and better stocked than it has any right to be.');
  scene.add(fridge);
  const fridgeHandle = box(0.04, 0.4, 0.06, P.steelDk);
  fridgeHandle.position.set(18.18, 1.4, 10.2);
  scene.add(fridgeHandle);
  // Light
  const kLight = new THREE.PointLight(0xffe4a0, 0.8, 12);
  kLight.position.set(9, 2.3, 8);
  scene.add(kLight);
}

function buildDining(scene, fh) {
  // Table
  const table = box(3.0, 0.06, 1.4, P.white);
  table.position.set(5, 0.75, 8);
  inspectable(table, 'Dining Table', 'Seats six comfortably, eight with goodwill. The pendants are hung exactly 76cm above it.');
  scene.add(table);
  [[-1.2,-0.5],[1.2,-0.5],[-1.2,0.5],[1.2,0.5]].forEach(([dx,dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), stdMat(P.steel));
    leg.position.set(5+dx, 0.36, 8+dz);
    scene.add(leg);
  });
  // Chairs
  [[-1.8,8],[1.8,8],[-0.6,8.9],[0.6,8.9],[-0.6,7.1],[0.6,7.1]].forEach(([dx,z]) => {
    const seat = box(0.42, 0.05, 0.42, P.offWhite);
    seat.position.set(5+dx, 0.46, z);
    scene.add(seat);
    const back = box(0.42, 0.5, 0.04, P.offWhite);
    back.position.set(5+dx, 0.7, z + (z > 8 ? 0.2 : -0.2));
    scene.add(back);
    [[-0.17,-0.17],[0.17,-0.17],[-0.17,0.17],[0.17,0.17]].forEach(([ldx,ldz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44, 6), stdMat(P.steel));
      leg.position.set(5+dx+ldx, 0.22, z+ldz);
      scene.add(leg);
    });
  });
  // Pendant lights
  [5 - 0.7, 5 + 0.7].forEach(x => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 6), stdMat(P.steelDk));
    cord.position.set(x, 3.0, 8);
    scene.add(cord);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.22, 12, 1, true), stdMat(P.marble, { side: THREE.DoubleSide }));
    shade.position.set(x, 2.45, 8);
    scene.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), stdMat(0xffe8c0, { emissive: 0xffe090, emissiveIntensity: 1.0 }));
    bulb.position.set(x, 2.45, 8);
    scene.add(bulb);
    const pl = new THREE.PointLight(0xfff0c8, 1.4, 10);
    pl.position.set(x, 2.45, 8);
    scene.add(pl);
  });
  // Sideboard
  const sb = box(2.4, 0.85, 0.45, P.timberDk);
  sb.position.set(-2, 0.425, 10.6);
  scene.add(sb);
  const decanter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.35, 8), stdMat(0x3a5a38, { transparent: true, opacity: 0.7 }));
  decanter.position.set(-2, 0.89, 10.4);
  decanter.userData.noShadow = true;
  inspectable(decanter, 'Decanter', 'Green glass, stoppered. Whatever is in it is older than the house.');
  scene.add(decanter);
}

function buildStudy(scene, fh) {
  const wallS = box(8, fh, 0.2, P.offWhite);
  wallS.position.set(18, fh/2, 4.1);
  scene.add(wallS);
  const wallW = box(0.2, fh, 7, P.offWhite);
  wallW.position.set(14.1, fh/2, 7.6);
  scene.add(wallW);
  const studyFloor = plane(6, 8, P.floorWoodDk, { map: repTex(TEX.wood, 3, 4) });
  studyFloor.position.set(18, 0.04, 8);
  scene.add(studyFloor);
  // Desk
  const deskTop = box(2.0, 0.04, 0.9, P.timberDk);
  deskTop.position.set(18, 0.76, 7.5);
  scene.add(deskTop);
  [[-0.9,-0.4],[0.9,-0.4],[-0.9,0.4],[0.9,0.4]].forEach(([dx,dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.73, 6), stdMat(P.steelDk));
    leg.position.set(18+dx, 0.365, 7.5+dz);
    scene.add(leg);
  });
  const monitor = box(0.7, 0.42, 0.04, 0x0a0a0a);
  monitor.position.set(18, 0.99, 7.1);
  inspectable(monitor, 'Study Desk', 'One monitor, one keyboard, no drawers. Clutter was designed out; it crept back in anyway.');
  scene.add(monitor);
  const kbd = box(0.45, 0.018, 0.15, P.steel);
  kbd.position.set(18, 0.79, 7.7);
  scene.add(kbd);
  // Desk lamp
  const dlBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.04, 8), stdMat(P.steelDk));
  dlBase.position.set(17.3, 0.8, 7.15);
  scene.add(dlBase);
  const dlPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 6), stdMat(P.steel));
  dlPost.position.set(17.3, 0.99, 7.15);
  dlPost.rotation.z = 0.3;
  scene.add(dlPost);
  const dlLight = new THREE.PointLight(0xfff0c0, 0.6, 5);
  dlLight.position.set(17.0, 1.18, 7.15);
  scene.add(dlLight);
  // Bookshelves
  const bsf = box(0.25, fh * 0.9, 5, P.offWhite);
  bsf.position.set(19.8, fh * 0.45, 7);
  inspectable(bsf, 'Library Wall', 'Reference, history, and one shelf of paperbacks nobody admits to.');
  scene.add(bsf);
  const stBookColors = [0x7a3a3a, 0x3a527a, 0x7a6030, 0x3a7a4a, 0x5a3a7a, 0x7a5a3a, 0x3a7a7a];
  const stShelves = [0.5, 1.2, 1.9, 2.6];
  const stBooks = new THREE.InstancedMesh(_unitBox, stdMat(0xffffff), stShelves.length * stBookColors.length);
  let stBi = 0;
  stShelves.forEach(y => {
    const plk = box(0.22, 0.03, 4.8, P.timber);
    plk.position.set(19.8, y, 7);
    scene.add(plk);
    stBookColors.forEach((c, i) => {
      _dummy.position.set(17.6 + i * 0.14, y + 0.13, 7);
      _dummy.scale.set(0.12, 0.22, 0.21);
      _dummy.updateMatrix();
      stBooks.setMatrixAt(stBi, _dummy.matrix);
      stBooks.setColorAt(stBi, _color.setHex(c));
      stBi++;
    });
  });
  stBooks.userData.collide = 'none';
  stBooks.userData.noShadow = true;
  scene.add(stBooks);
}

function buildUtility(scene, fh) {
  const wallN = box(6, fh, 0.2, P.offWhite);
  wallN.position.set(18, fh/2, -5.1);
  scene.add(wallN);
  const wallW = box(0.2, fh, 6, P.offWhite);
  wallW.position.set(14.1, fh/2, -8.1);
  scene.add(wallW);
  const wm = box(0.65, 0.85, 0.6, P.white);
  wm.position.set(18.5, 0.425, -9.5);
  inspectable(wm, 'Washing Machine', 'The least glamorous room in the house, and the most used.');
  scene.add(wm);
  const dryer = box(0.65, 0.85, 0.6, P.white);
  dryer.position.set(17.8, 0.425, -9.5);
  scene.add(dryer);
  const utilTop = box(1.5, 0.04, 0.62, P.stone);
  utilTop.position.set(18.15, 0.9, -9.5);
  scene.add(utilTop);
}

function buildWC(scene, fh) {
  const wallW = box(0.2, fh, 3, P.white);
  wallW.position.set(-4.1, fh/2, -8.5);
  scene.add(wallW);
  const wallS = box(4, fh, 0.2, P.white);
  wallS.position.set(-8.1, fh/2, -10.1);
  scene.add(wallS);
  const toilet = box(0.4, 0.42, 0.55, P.white);
  toilet.position.set(-8.5, 0.21, -8.8);
  scene.add(toilet);
  const basin = box(0.42, 0.18, 0.32, P.white);
  basin.position.set(-6.5, 0.82, -9.8);
  scene.add(basin);
}

function buildStaircase(scene, fh) {
  const stepCount = 14;
  const stepH = (fh + 0.3) / stepCount;
  const stepD = 0.32;
  for (let i = 0; i < stepCount; i++) {
    const step = box(1.4, 0.04, stepD, P.floorWood);
    step.position.set(2.5, i * stepH + stepH/2, -8.0 + i * stepD);
    scene.add(step);
  }
  // Glass balustrade — must block despite being glass
  const bal = box(0.04, 0.9, stepCount * stepD + 0.2, P.glass, { transparent: true, opacity: 0.3 });
  bal.position.set(1.8, fh * 0.5, -8.0 + stepCount * stepD / 2);
  bal.userData.collide = 'wall';
  scene.add(bal);
  const rail = box(0.04, 0.04, stepCount * stepD + 0.3, P.steelDk);
  rail.position.set(1.8, fh * 0.9, -8.0 + stepCount * stepD / 2);
  scene.add(rail);
  // Top landing
  const landing = box(2.5, 0.12, 2.5, P.floorWood);
  landing.position.set(2.5, fh + 0.06, -8 + stepCount * stepD + 1);
  scene.add(landing);
}

// ─── Garage ──────────────────────────────────────────────────────────────────
function buildGarage(scene) {
  const gw = 12, gh = 3.0, gd = 10;
  const gFloor = plane(gw, gd, P.concreteDk);
  gFloor.position.set(26, 0.01, 0);
  scene.add(gFloor);
  const wallN = box(gw, gh, 0.2, P.concrete);
  wallN.position.set(26, gh/2, 5.1);
  scene.add(wallN);
  const wallS = box(gw, gh, 0.2, P.concrete);
  wallS.position.set(26, gh/2, -5.1);
  scene.add(wallS);
  const wallW = box(0.2, gh, gd, P.concrete);
  wallW.position.set(20.1, gh/2, 0);
  scene.add(wallW);
  const roofG = box(gw, 0.3, gd, P.concreteDk);
  roofG.position.set(26, gh + 0.15, 0);
  scene.add(roofG);
  // Garage doors
  [-3, 3].forEach(dx => {
    const gd2 = box(5.6, 2.3, 0.08, P.steel, { roughness: 0.4, metalness: 0.6 });
    gd2.position.set(26 + dx, 1.15, -5);
    scene.add(gd2);
    [0.5, 1.0, 1.5, 2.0].forEach(y => {
      const rib = box(5.5, 0.04, 0.04, P.steelDk);
      rib.position.set(26 + dx, y, -4.96);
      rib.userData.noShadow = true;
      scene.add(rib);
    });
  });
  // Car
  const carBody = box(4.2, 1.3, 1.9, 0x2a2e32);
  carBody.position.set(26, 0.65, 1);
  inspectable(carBody, 'The Car', 'Graphite grey, kept washed. Driven less than the house deserves.');
  scene.add(carBody);
  const carRoof = box(2.4, 0.6, 1.85, 0x22262a);
  carRoof.position.set(25.8, 1.6, 1);
  scene.add(carRoof);
  [[-1.5,0.35,-1.0],[-1.5,0.35,1.0],[1.5,0.35,-1.0],[1.5,0.35,1.0]].forEach(([dx,y,dz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), stdMat(0x1a1a1a));
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(26+dx, y, 1+dz);
    scene.add(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 8), stdMat(P.steel, { metalness: 0.8, roughness: 0.2 }));
    rim.rotation.z = Math.PI/2;
    rim.position.set(26+dx, y, 1+dz);
    scene.add(rim);
  });
  const gLight = new THREE.PointLight(0xfff8f0, 1.0, 16);
  gLight.position.set(26, gh - 0.2, 0);
  scene.add(gLight);
}

// ─── First floor ─────────────────────────────────────────────────────────────
function buildFirstFloor(scene) {
  const GFH = 3.4, FFH = 3.0;
  const FY = GFH + 0.3;

  // First floor slab — split into 4 pieces to leave a stairwell opening.
  // Staircase runs x:0.5–4.5, z:-9 to -1 (opening matches stair footprint + margin).
  // Full slab would be box(28,0.3,22) centred at (4, FY-0.15, 0)
  //   → x: -10 to 18,  z: -11 to 11
  const SY = FY - 0.15;
  const slabPieces = [
    // West of stairwell (x: -10 → 0.5, full z)
    [10.5, 22, -4.75, 0],
    // East of stairwell (x: 4.5 → 18, full z)
    [13.5, 22, 11.25, 0],
    // South bridge above stairwell (x: 0.5 → 4.5, z: -11 → -9)
    [4,    2,  2.5,   -10],
    // North of stairwell opening (x: 0.5 → 4.5, z: -1 → 11)
    [4,    12, 2.5,   5],
  ];
  slabPieces.forEach(([sw, sd, cx, cz]) => {
    const s = box(sw, 0.3, sd, P.concreteDk);
    s.position.set(cx, SY, cz);
    scene.add(s);
  });

  // Matching timber floor overlay — same 4-piece split
  const ffFloorPieces = [
    [10.5, 22, -4.75, 0],
    [13.5, 22, 11.25, 0],
    [4,    2,  2.5,   -10],
    [4,    12, 2.5,   5],
  ];
  ffFloorPieces.forEach(([fw, fd, cx, cz]) => {
    const f = plane(fw, fd, P.floorWood, { map: repTex(TEX.wood, fw / 2, fd / 2) });
    f.position.set(cx, FY + 0.01, cz);
    scene.add(f);
  });
  // Gallery balustrade overlooking living room — must block despite being glass
  const bal = box(0.04, 0.9, 6, P.glass, { transparent: true, opacity: 0.35 });
  bal.position.set(-2, FY + 0.45, 0);
  bal.userData.collide = 'wall';
  scene.add(bal);
  const rail = box(0.04, 0.04, 6.1, P.steelDk);
  rail.position.set(-2, FY + 0.9, 0);
  scene.add(rail);

  buildMasterSuite(scene, FY, FFH);
  buildBedroom(scene, FY, FFH, 4, -8);
  buildBedroom(scene, FY, FFH, 14, -8);
  buildBathroom(scene, FY, -6, -8);

  // South facade first floor
  const ffS = box(32, FFH, 0.25, P.concrete);
  ffS.position.set(4, FY + FFH/2, -11);
  scene.add(ffS);
  [0, 8, 16].forEach(dx => {
    const win = box(6, 0.8, 0.08, P.glass, { transparent: true, opacity: 0.4 });
    win.position.set(-10 + dx, FY + 2.0, -10.96);
    scene.add(win);
  });
  // North facade first floor
  const ffN = box(32, FFH, 0.25, P.concrete);
  ffN.position.set(4, FY + FFH/2, 11);
  scene.add(ffN);
  [[-12, 11], [0, 11], [12, 11]].forEach(([x, z]) => {
    const wd = box(3.8, FFH * 0.85, 0.08, P.glass, { transparent: true, opacity: 0.4 });
    wd.position.set(x, FY + FFH * 0.5, z);
    scene.add(wd);
  });
}

function buildMasterSuite(scene, FY, FFH) {
  // Partition walls
  const p1 = box(0.2, FFH, 14, P.offWhite);
  p1.position.set(-6, FY + FFH/2, -4);
  scene.add(p1);
  const p2 = box(14, FFH, 0.2, P.offWhite);
  p2.position.set(-13, FY + FFH/2, 4.1);
  scene.add(p2);
  // Bed
  const bedBase = box(2.2, 0.42, 2.6, P.timberDk);
  bedBase.position.set(-14, FY + 0.21, 0);
  scene.add(bedBase);
  const mattress = box(2.0, 0.28, 2.4, P.offWhite);
  mattress.position.set(-14, FY + 0.49, 0);
  scene.add(mattress);
  const duvet = box(1.9, 0.14, 2.2, P.white);
  duvet.position.set(-14, FY + 0.56, 0.1);
  inspectable(duvet, 'Master Bed', 'White linen, timber headboard, and the best view in the house from horizontal.');
  scene.add(duvet);
  const pillowL = box(0.7, 0.15, 0.55, P.white);
  pillowL.position.set(-14.55, FY + 0.64, -0.95);
  scene.add(pillowL);
  const pillowR = box(0.7, 0.15, 0.55, P.white);
  pillowR.position.set(-13.45, FY + 0.64, -0.95);
  scene.add(pillowR);
  const headboard = box(2.2, 0.7, 0.12, P.timberDk);
  headboard.position.set(-14, FY + 0.66, -1.35);
  scene.add(headboard);
  // Bedside lamps
  [-14.9, -13.1].forEach(x => {
    const bst = box(0.45, 0.5, 0.4, P.timber);
    bst.position.set(x, FY + 0.25, -0.5);
    scene.add(bst);
    const ls = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 8, 1, true), stdMat(0xe8e0c0, { side: THREE.DoubleSide }));
    ls.position.set(x, FY + 0.65, -0.5);
    scene.add(ls);
    const bl = new THREE.PointLight(0xffe8c0, 0.5, 5);
    bl.position.set(x, FY + 0.65, -0.5);
    scene.add(bl);
  });
  // Wardrobe
  const wrdr = box(8, FFH * 0.9, 0.65, P.white);
  wrdr.position.set(-14, FY + FFH * 0.45, 3.7);
  scene.add(wrdr);
  [-17,-15.5,-14,-12.5,-11].forEach(x => {
    const wd = box(1.35, FFH * 0.88, 0.04, P.offWhite);
    wd.position.set(x, FY + FFH * 0.44, 3.4);
    scene.add(wd);
  });
  // Armchair
  const armSeat = box(0.8, 0.45, 0.8, 0x7a6a5a);
  armSeat.position.set(-18, FY + 0.225, 2);
  scene.add(armSeat);
  const armBack = box(0.8, 0.65, 0.12, 0x7a6a5a);
  armBack.position.set(-18, FY + 0.72, 2.38);
  scene.add(armBack);
}

function buildBedroom(scene, FY, FFH, x, z) {
  const pw = box(0.2, FFH, 8, P.offWhite);
  pw.position.set(x - 3, FY + FFH/2, z + 2);
  scene.add(pw);
  const bedBase = box(1.6, 0.4, 2.0, P.timber);
  bedBase.position.set(x, FY + 0.2, z + 0.5);
  scene.add(bedBase);
  const mattress = box(1.5, 0.22, 1.85, P.offWhite);
  mattress.position.set(x, FY + 0.41, z + 0.5);
  scene.add(mattress);
  const duvet = box(1.45, 0.12, 1.7, 0xd8d0c8);
  duvet.position.set(x, FY + 0.47, z + 0.6);
  scene.add(duvet);
  const headboard = box(1.6, 0.55, 0.1, P.timberDk);
  headboard.position.set(x, FY + 0.55, z - 0.45);
  scene.add(headboard);
  const wrdr = box(1.2, FFH * 0.85, 0.55, P.white);
  wrdr.position.set(x + 2.5, FY + FFH * 0.425, z - 3.0);
  scene.add(wrdr);
}

function buildBathroom(scene, FY, x, z) {
  const bath = box(1.5, 0.5, 0.7, P.white);
  bath.position.set(x - 1, FY + 0.25, z - 2);
  scene.add(bath);
  const bathRim = box(1.52, 0.05, 0.72, P.marble);
  bathRim.position.set(x - 1, FY + 0.51, z - 2);
  scene.add(bathRim);
  const showerBase = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), stdMat(P.stone));
  showerBase.rotation.x = -Math.PI/2;
  showerBase.position.set(x + 1.5, FY + 0.02, z - 2);
  scene.add(showerBase);
  const shGlass = box(0.04, 2.0, 1.0, P.glass, { transparent: true, opacity: 0.3 });
  shGlass.position.set(x + 1.0, FY + 1.0, z - 2);
  scene.add(shGlass);
  const basin = box(0.5, 0.18, 0.38, P.white);
  basin.position.set(x + 0.5, FY + 0.82, z + 1.5);
  scene.add(basin);
  const toilet = box(0.38, 0.4, 0.52, P.white);
  toilet.position.set(x - 2, FY + 0.2, z + 1.5);
  scene.add(toilet);
}

// ─── Roof ────────────────────────────────────────────────────────────────────
function buildRoof(scene) {
  const GFH = 3.4, FFH = 3.0;
  const FY = GFH + 0.3;
  const roofY = FY + FFH;

  const roofSlab = box(42, 0.35, 24, P.concreteDk);
  roofSlab.position.set(0, roofY + 0.17, 0);
  scene.add(roofSlab);
  // Parapets
  [
    [0, roofY + 0.7, 12.1, 42, 0.8, 0.25],
    [0, roofY + 0.7, -12.1, 42, 0.8, 0.25],
    [-21, roofY + 0.7, 0, 0.25, 0.8, 24],
    [21, roofY + 0.7, 0, 0.25, 0.8, 24],
  ].forEach(([x,y,z,w,h,d]) => {
    const p = box(w, h, d, P.concrete);
    p.position.set(x, y, z);
    scene.add(p);
  });
  // Roof lantern over living room (double-height zone)
  const lantern = box(10, 0.35, 8, P.glass, { transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.3 });
  lantern.position.set(-13, roofY + 0.17, 2);
  scene.add(lantern);
  const lFrame = box(10.2, 0.08, 8.2, P.steelDk);
  lFrame.position.set(-13, roofY + 0.04, 2);
  scene.add(lFrame);
  [-4, 0, 4].forEach(dx => {
    const bar = box(0.05, 0.35, 8, P.steelDk);
    bar.position.set(-13 + dx, roofY + 0.17, 2);
    scene.add(bar);
  });
  // Skylights over landing
  [0, 5].forEach(dx => {
    const sky = box(1.2, 0.12, 0.8, P.glass, { transparent: true, opacity: 0.55, roughness: 0.05 });
    sky.position.set(2 + dx, roofY + 0.18, -4);
    scene.add(sky);
  });
}

// ─── Terrace ─────────────────────────────────────────────────────────────────
function buildTerrace(scene) {
  // Paver pattern comes from the texture — replaces 35 separate joint meshes
  const terrace = plane(42, 12, P.stone, { map: repTex(TEX.paver, 35, 10) });
  terrace.position.set(0, 0.02, 17);
  scene.add(terrace);
  // Steps down
  const step1 = box(40, 0.15, 0.5, P.stoneDk);
  step1.position.set(0, 0.075, 23.2);
  scene.add(step1);
  const step2 = box(40, 0.15, 0.5, P.stone);
  step2.position.set(0, -0.05, 23.7);
  scene.add(step2);
  // Outdoor dining
  const oTable = box(2.0, 0.04, 1.0, P.steelDk, { metalness: 0.7, roughness: 0.3 });
  oTable.position.set(-8, 0.76, 17);
  scene.add(oTable);
  [[-0.8,-0.4],[0.8,-0.4],[-0.8,0.4],[0.8,0.4]].forEach(([dx,dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.73, 6), stdMat(P.steelDk));
    leg.position.set(-8+dx, 0.365, 17+dz);
    scene.add(leg);
  });
  [[-9.3,16.4],[-6.7,16.4],[-9.3,17.6],[-6.7,17.6]].forEach(([x,z]) => {
    const s = box(0.4, 0.04, 0.4, P.steel, { metalness: 0.6 });
    s.position.set(x, 0.46, z);
    scene.add(s);
  });
  // Concrete bench
  const bench = box(10, 0.4, 0.5, P.concrete);
  bench.position.set(8, 0.2, 12.5);
  scene.add(bench);
  const benchSeat = box(10, 0.06, 0.5, P.timber);
  benchSeat.position.set(8, 0.43, 12.5);
  scene.add(benchSeat);
  // Planters with shrubs
  [-18, 18].forEach(x => {
    const planter = box(1.2, 0.6, 8, P.concreteDk);
    planter.position.set(x, 0.3, 17);
    scene.add(planter);
    [-2.5, 0, 2.5].forEach(dz => {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.38, 7, 5), stdMat(P.grass));
      shrub.position.set(x, 1.1, 17 + dz);
      shrub.castShadow = true;
      scene.add(shrub);
    });
  });
}

// ─── Pool ────────────────────────────────────────────────────────────────────
function buildPool(scene) {
  const poolSurround = plane(18, 7, P.stone, { map: repTex(TEX.paver, 15, 6) });
  poolSurround.position.set(5, 0.01, 30);
  scene.add(poolSurround);
  // Walkable on purpose: with 0.55m step-up the player could never climb out
  // of the 1.4m-deep pool, so the surface is treated as floor.
  const waterGeo = new THREE.PlaneGeometry(13.8, 3.4, 48, 16);
  const poolWater = new THREE.Mesh(waterGeo, stdMat(P.water, {
    roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.85,
  }));
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.set(5, -0.08, 30);
  poolWater.receiveShadow = true;
  poolWater.userData.noShadow = true;
  poolWater.userData.collide = 'floor';
  inspectable(poolWater, 'Lap Pool', 'Fourteen metres, unheated. Bracing in May, character-building in October.');
  scene.add(poolWater);
  // Gentle two-wave surface wobble (local z = world up after the rotation)
  const wPos = waterGeo.attributes.position;
  _animators.push(t => {
    for (let i = 0; i < wPos.count; i++) {
      const x = wPos.getX(i), y = wPos.getY(i);
      wPos.setZ(i,
        Math.sin(x * 1.6 + t * 1.7) * 0.025 +
        Math.cos((y + x * 0.5) * 2.4 + t * 2.3) * 0.018
      );
    }
    wPos.needsUpdate = true;
    waterGeo.computeVertexNormals();
  });
  // Perimeter lip
  [[5, 30+1.75, 14.3, 0.12, 0.12], [5, 30-1.75, 14.3, 0.12, 0.12]].forEach(([x,z,w,h,d]) => {
    const lip = box(w, h, d, P.marble);
    lip.position.set(x, 0.06, z);
    scene.add(lip);
  });
  [[5+7, 30, 0.12, 0.12, 3.5], [5-7, 30, 0.12, 0.12, 3.5]].forEach(([x,z,w,h,d]) => {
    const lip = box(w, h, d, P.marble);
    lip.position.set(x, 0.06, z);
    scene.add(lip);
  });
  // Pool walls below water
  const pBottom = plane(14, 3.5, 0x2a6080);
  pBottom.position.set(5, -1.4, 30);
  scene.add(pBottom);
  // Sun loungers
  [28, 32].forEach(z => {
    const lounger = box(1.8, 0.08, 0.65, P.offWhite);
    lounger.position.set(14, 0.04, z);
    scene.add(lounger);
    const headEnd = box(1.8, 0.3, 0.08, P.offWhite);
    headEnd.position.set(14, 0.19, z - 0.38);
    headEnd.rotation.x = -0.4;
    scene.add(headEnd);
    const towel = box(1.5, 0.03, 0.5, 0x8ab8d8);
    towel.position.set(14, 0.14, z);
    scene.add(towel);
  });
}

// ─── Garden ──────────────────────────────────────────────────────────────────
function buildGarden(scene) {
  const meadow = plane(30, 20, 0x7aaa40, { map: repTex(TEX.grass, 12, 8) });
  meadow.position.set(-5, 0.02, 58);
  scene.add(meadow);
  // Wildflower patches
  [[-8,52],[5,60],[10,54],[-3,58]].forEach(([x,z]) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1.4, 8), stdMat(0xc88040));
    patch.rotation.x = -Math.PI/2;
    patch.position.set(x, 0.03, z);
    patch.userData.noShadow = true;
    scene.add(patch);
  });
  // Retaining wall
  const retWall = box(40, 0.5, 0.3, P.stoneDk);
  retWall.position.set(0, 0.25, 44);
  scene.add(retWall);
}

// ─── Garden Studio ───────────────────────────────────────────────────────────
function buildStudio(scene) {
  const sx = 22, sz = 35, sw = 7, sh = 2.8, sd = 5;
  const sFloor = plane(sw, sd, P.floorWood, { map: repTex(TEX.wood, 3.5, 2.5) });
  sFloor.position.set(sx, 0.01, sz);
  scene.add(sFloor);
  const wallS = box(sw, sh, 0.2, P.timber);
  wallS.position.set(sx, sh/2, sz - sd/2);
  scene.add(wallS);
  const wallN = box(sw, sh, 0.2, P.timber);
  wallN.position.set(sx, sh/2, sz + sd/2);
  scene.add(wallN);
  const wallW = box(0.2, sh, sd, P.timber);
  wallW.position.set(sx - sw/2, sh/2, sz);
  scene.add(wallW);
  // East wall — mostly glass
  const sGlass = box(sw * 0.85, sh * 0.8, 0.06, P.glass, { transparent: true, opacity: 0.4, roughness: 0.05 });
  sGlass.position.set(sx, sh * 0.45, sz + sd/2);
  scene.add(sGlass);
  const sRoof = box(sw + 0.4, 0.2, sd + 0.4, P.timberDk);
  sRoof.position.set(sx, sh + 0.1, sz);
  scene.add(sRoof);
  // Desk inside
  const stDesk = box(1.5, 0.05, 0.7, P.timberDk);
  stDesk.position.set(sx, 0.73, sz + 1.5);
  inspectable(stDesk, 'Studio Desk', 'Far enough from the house that nobody asks how the work is going.');
  scene.add(stDesk);
  // Path
  const stPath = plane(1.2, 6, P.gravel, { map: repTex(TEX.gravel, 0.6, 3) });
  stPath.position.set(sx - sw/2 - 0.6, 0.02, sz - 1);
  scene.add(stPath);
}

// ─── Kitchen Garden ──────────────────────────────────────────────────────────
function buildKitchenGarden(scene) {
  const kgx = -22, kgz = 40;
  // Walls
  [
    [kgx, kgz - 8, 14, 0.7, 0.25],
    [kgx, kgz + 8, 14, 0.7, 0.25],
    [kgx - 7, kgz, 0.25, 0.7, 14],
    [kgx + 7, kgz, 0.25, 0.7, 14],
  ].forEach(([x,z,w,h,d]) => {
    const wall = box(w, h, d, P.stoneDk);
    wall.position.set(x, h/2, z);
    scene.add(wall);
  });
  // Raised beds — all 120 plants in a single InstancedMesh (unit-height
  // cylinder, randomized per-instance Y scale)
  const beds = [[-2,-3],[2,-3],[-2,2],[2,2]];
  const ROWS = 5, COLS = 6;
  const plants = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.06, 1, 5),
    stdMat(0x4a8a30),
    beds.length * ROWS * COLS
  );
  let pi = 0;
  beds.forEach(([dx,dz]) => {
    const bed = box(2.8, 0.35, 2.2, P.stoneDk);
    bed.position.set(kgx+dx, 0.175, kgz+dz);
    scene.add(bed);
    const soil = plane(2.6, 2.0, P.soil);
    soil.position.set(kgx+dx, 0.36, kgz+dz);
    scene.add(soil);
    for (let ri = 0; ri < ROWS; ri++) {
      for (let ci = 0; ci < COLS; ci++) {
        _dummy.position.set(kgx+dx-0.8+ci*0.3, 0.48, kgz+dz-0.7+ri*0.35);
        _dummy.scale.set(1, 0.18 + Math.random()*0.12, 1);
        _dummy.updateMatrix();
        plants.setMatrixAt(pi++, _dummy.matrix);
      }
    }
  });
  plants.userData.collide = 'none';
  plants.userData.noShadow = true;
  scene.add(plants);
  const kgPath = plane(1.0, 16, P.gravel, { map: repTex(TEX.gravel, 0.5, 8) });
  kgPath.position.set(kgx, 0.02, kgz);
  scene.add(kgPath);
  const butt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.8, 10), stdMat(P.steelDk));
  butt.position.set(kgx + 6, 0.4, kgz - 6);
  inspectable(butt, 'Water Butt', 'Rainwater off the studio roof. The vegetables prefer it, apparently.');
  scene.add(butt);
}

// ─── Driveway ────────────────────────────────────────────────────────────────
function buildDriveway(scene) {
  const drive = plane(14, 28, P.gravel, { map: repTex(TEX.gravel, 7, 14) });
  drive.position.set(18, 0.02, -14);
  scene.add(drive);
  [-4, 4].forEach(dx => {
    const pillar = box(0.5, 1.2, 0.5, P.stone);
    pillar.position.set(18+dx, 0.6, -27.5);
    scene.add(pillar);
    const cap = box(0.65, 0.12, 0.65, P.stoneDk);
    cap.position.set(18+dx, 1.26, -27.5);
    scene.add(cap);
  });
  [-25, -22, -19].forEach(z => {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), stdMat(P.steelDk));
    bollard.position.set(22, 0.3, z);
    bollard.userData.noShadow = true;
    scene.add(bollard);
    const bl = new THREE.PointLight(0xffee88, 0.4, 4);
    bl.position.set(22, 0.65, z);
    scene.add(bl);
  });
}

// ─── Trees ───────────────────────────────────────────────────────────────────
function buildTrees(scene) {
  const treeData = [
    [-30, 45, 0.9], [-30, 28, 0.7], [30, 52, 1.0], [25, 42, 0.8],
    [-10, 65, 1.1], [15, 62, 0.9], [-22, 58, 0.85], [5, 72, 1.2],
    [-35, 60, 0.95], [35, 35, 0.7],
    [12, -16, 0.5], [12, -20, 0.5], [12, -24, 0.5], // avenue
    [-25, 15, 0.75], [-28, 5, 0.7],
  ];
  // Two draw calls for all trees: instanced trunks + instanced canopies.
  // Trunks are tagged 'wall' — raycasting against InstancedMesh respects
  // instance matrices, so each trunk still blocks movement individually.
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1, 8), stdMat(P.timberDk), treeData.length
  );
  const canopies = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 7, 5), stdMat(P.grass), treeData.length * 3
  );
  let ti = 0, ci = 0;
  treeData.forEach(([x, z, scale]) => {
    const trunkH = 3.5 * scale;
    _dummy.position.set(x, trunkH/2, z);
    _dummy.scale.set(scale, trunkH, scale);
    _dummy.updateMatrix();
    trunks.setMatrixAt(ti++, _dummy.matrix);
    [[0, trunkH + 1.2*scale, 0, 2.0*scale],
     [-0.6*scale, trunkH + 0.7*scale, 0.4*scale, 1.4*scale],
     [0.5*scale, trunkH + 0.9*scale, -0.3*scale, 1.5*scale]].forEach(([dx,dy,dz,r]) => {
      _dummy.position.set(x+dx, dy, z+dz);
      _dummy.scale.set(r, r, r);
      _dummy.updateMatrix();
      canopies.setMatrixAt(ci++, _dummy.matrix);
    });
  });
  trunks.userData.collide = 'wall';
  canopies.userData.collide = 'none';
  scene.add(trunks);
  scene.add(canopies);
}
