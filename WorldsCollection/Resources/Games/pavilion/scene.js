/**
 * Bungalow — a single-storey modernist residence on a generous plot.
 *
 * The philosophical premise: land is not a constraint.
 * Therefore: no stairs, no first floor, no dead circulation space.
 * Every room is on the ground. Every room opens to the outside.
 *
 * Layout (all at y = 0):
 *   Main pavilion:   Living · Dining · Kitchen (open-plan, 22×11m)
 *   Bedroom wing:    Glazed link → Bedroom 2 · Bedroom 3 · Master suite (east)
 *   Study pavilion:  Separate, west, connected by covered walkway
 *   Utility room:    Behind kitchen, tucked north-east
 *   WC:              Near entry
 *   Terrace:         North of main pavilion, wrapping to east
 *   Lap pool:        Beyond terrace
 *   Entry forecourt: South approach
 *   Kitchen garden:  Walled, south-east
 *   Plot:            ~160×120m, mature trees, grass
 *
 * Scale: main block ~22×11m · total footprint ~50×35m · plot ~160×120m
 * Ceiling height: 3.2m throughout (lower, more intimate)
 */

import * as THREE from 'three';

// ─── Palette ─────────────────────────────────────────────────────────────────
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
  limestone:   0xe4dcd0,
  rammedEarth: 0xc4a882,
  ipe:         0x7a5a30,     // dark hardwood decking
  floorWood:   0xc8a070,
  floorWoodDk: 0xa07848,
  floorStone:  0xc8beb4,
  stone:       0xb0a898,
  stoneDk:     0x887e74,
  terracotta:  0xc86840,
  grass:       0x6a9a3a,
  gravel:      0xb8b0a0,
  water:       0x3878a8,
  soil:        0x5a4030,
};

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
  m.userData.noShadow = true;
  return m;
}

// ─── Textures ─────────────────────────────────────────────────────────────────
function makeTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function repTex(base, rx, ry) {
  const t = base.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

const TEX = {
  grass: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3500; i++) {
      const v = 185 + Math.random() * 70;
      ctx.strokeStyle = `rgb(${v|0},${v|0},${v|0})`;
      const x = Math.random() * s, y = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 2 - Math.random() * 3);
      ctx.stroke();
    }
  }),
  gravel: makeTexture(256, (ctx, s) => {
    const b = 215;
    ctx.fillStyle = `rgb(${b},${b},${b})`; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      const v = b + (Math.random() - 0.5) * 110;
      ctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }),
  wood: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#e6e0d8'; ctx.fillRect(0, 0, s, s);
    const plankW = s / 4;
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 40; i++) {
        const v = 200 + Math.random() * 50;
        ctx.strokeStyle = `rgba(${v|0},${(v*0.96)|0},${(v*0.9)|0},0.5)`;
        const x = p * plankW + Math.random() * plankW;
        ctx.beginPath(); ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 4, s * 0.3, x - 4, s * 0.7, x + 2, s);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(90,75,60,0.55)';
      ctx.fillRect(p * plankW, 0, 2, s);
    }
  }),
  ipe: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#c8b898'; ctx.fillRect(0, 0, s, s);
    for (let p = 0; p < 8; p++) {
      const pw = s / 8;
      for (let i = 0; i < 20; i++) {
        const v = 160 + Math.random() * 40;
        ctx.strokeStyle = `rgba(${v|0},${(v*0.92)|0},${(v*0.82)|0},0.5)`;
        const x = p * pw + Math.random() * pw;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, s); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(60,45,28,0.6)';
      ctx.fillRect(p * pw, 0, 2, s);
    }
  }),
  limestone: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#eeebe6'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2000; i++) {
      const v = 210 + Math.random() * 38;
      ctx.fillStyle = `rgba(${v|0},${(v-4)|0},${(v-8)|0},0.4)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
    ctx.strokeStyle = 'rgba(140,128,118,0.5)'; ctx.lineWidth = 1.5;
    for (let y = 0; y < s; y += s / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
    }
  }),
  paver: makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#e2ded8'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i++) {
      const v = 195 + Math.random() * 50;
      ctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
    ctx.fillStyle = 'rgba(70,64,58,0.6)';
    ctx.fillRect(0, 0, 3, s); ctx.fillRect(0, 0, s, 3);
  }),
};

// ─── Animation & interactables ───────────────────────────────────────────────
const _animators = [];
export function tickScene(t, dt) {
  for (const fn of _animators) fn(t, dt);
}

export const INTERACTABLES = [];
function inspectable(mesh, name, text) {
  mesh.userData.inspect = { name, text };
  INTERACTABLES.push(mesh);
  return mesh;
}

// ─── Room zones ──────────────────────────────────────────────────────────────
export const ROOMS = [
  { label: 'Entry Court',    x: 0,    z: -9,   r: 6  },
  { label: 'Living Room',    x: -7,   z: 0,    r: 8  },
  { label: 'Dining',         x: 1,    z: 0,    r: 5  },
  { label: 'Kitchen',        x: 8,    z: 2,    r: 6  },
  { label: 'Utility Room',   x: 8,    z: -3,   r: 4  },
  { label: 'WC',             x: -9,   z: -4,   r: 3  },
  { label: 'Bedroom 2',      x: 17,   z: 3,    r: 5  },
  { label: 'Bedroom 3',      x: 23,   z: 3,    r: 5  },
  { label: 'Master Suite',   x: 28,   z: 0,    r: 6  },
  { label: 'Study',          x: -17,  z: 0,    r: 5  },
  { label: 'Terrace',        x: -3,   z: 9,    r: 8  },
  { label: 'Pool',           x: 0,    z: 16,   r: 7  },
  { label: 'Garden',         x: 0,    z: 40,   r: 20 },
  { label: 'Kitchen Garden', x: 21,   z: -11,  r: 7  },
];

export function getRoomLabel(x, z) {
  let best = null, bestDist = Infinity;
  for (const r of ROOMS) {
    const dx = x - r.x, dz = z - r.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < r.r && dist < bestDist) { best = r.label; bestDist = dist; }
  }
  return best || '';
}

// ─── Main build ──────────────────────────────────────────────────────────────
export function buildBungalow(scene) {
  buildGround(scene);
  buildMainPavilion(scene);
  buildBedroomWing(scene);
  buildStudyPavilion(scene);
  buildTerrace(scene);
  buildPool(scene);
  buildEntryCourt(scene);
  buildKitchenGarden(scene);
  buildTrees(scene);
}

// ─── Ground ──────────────────────────────────────────────────────────────────
const GROUND_Y = -0.18;

function buildGround(scene) {
  const lawn = plane(200, 200, P.grass, { map: repTex(TEX.grass, 80, 80) });
  lawn.position.set(0, GROUND_Y, 20);
  scene.add(lawn);

  // Boundary walls — low, ramped-earth render
  [
    [200, 0.7, 0.3,  0, 0.35, -30],
    [0.3, 0.7, 220, -80, 0.35, 20],
    [0.3, 0.7, 220,  80, 0.35, 20],
  ].forEach(([w, h, d, x, hy, z]) => {
    const wall = box(w, h, d, P.stoneDk);
    wall.position.set(x, GROUND_Y + hy, z);
    scene.add(wall);
  });
}

// ─── Main pavilion: Living · Dining · Kitchen ────────────────────────────────
// Footprint: x -11 to 11, z -5.5 to 5.5. Ceiling: FH = 3.2m.
const FH = 3.2;
const WT = 0.28; // wall thickness

function buildMainPavilion(scene) {
  // Foundation slab
  const slab = box(22, 0.22, 11, P.concreteDk);
  slab.position.set(0, -0.11, 0);
  scene.add(slab);

  // Limestone floor throughout (warmer than wood — single-storey gets more sunlight)
  const floor = plane(21.4, 10.4, P.limestone, { map: repTex(TEX.limestone, 12, 6) });
  floor.position.set(0, 0.01, 0);
  scene.add(floor);

  // South facade — rammed-earth render panels + entry opening
  buildSouthFacade(scene);

  // North facade — floor-to-ceiling sliding glass, full width
  buildNorthFacade(scene);

  // West wall — solid, concrete
  const wWall = box(WT, FH, 11, P.concrete);
  wWall.position.set(-11, FH / 2, 0);
  scene.add(wWall);

  // East wall — partial (kitchen/utility divide), east face is open to link corridor
  const eWallN = box(WT, FH, 7, P.rammedEarth);
  eWallN.position.set(11, FH / 2, 1.75);
  scene.add(eWallN);
  const eWallS = box(WT, FH, 4, P.rammedEarth);
  eWallS.position.set(11, FH / 2, -3.5);
  scene.add(eWallS);

  // Roof slab — generous overhang on all sides (+0.8m)
  const roof = box(23.6, 0.32, 12.6, P.concreteDk);
  roof.position.set(0, FH + 0.16, 0);
  scene.add(roof);

  // Fascia strip — dark timber, underside of overhang
  const fasciaS = box(23.6, 0.22, 0.1, P.timberDk);
  fasciaS.position.set(0, FH, -6.1);
  scene.add(fasciaS);
  const fasciaN = fasciaS.clone(); fasciaN.position.z = 6.1; scene.add(fasciaN);
  const fasciaW = box(0.1, 0.22, 12.6, P.timberDk);
  fasciaW.position.set(-11.8, FH, 0);
  scene.add(fasciaW);

  // Interior divisions
  buildLiving(scene);
  buildDining(scene);
  buildKitchen(scene);
  buildUtility(scene);
  buildWC(scene);
}

function buildSouthFacade(scene) {
  const RH = FH - 0.6; // glazed opening height
  // East and west solid panels (rammed earth)
  [-7, 7].forEach(x => {
    const panel = box(6, FH, WT, P.rammedEarth);
    panel.position.set(x, FH / 2, -5.5);
    scene.add(panel);
  });
  // Lintel over entry
  const lintel = box(22, 0.6, WT, P.concrete);
  lintel.position.set(0, FH - 0.3, -5.5);
  scene.add(lintel);
  // Entry glazing either side of door
  [-3.5, 3.5].forEach(x => {
    const gl = box(2.8, RH, 0.06, P.glass, { transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.3 });
    gl.position.set(x, RH / 2 + 0.02, -5.47);
    gl.userData.collide = 'wall';
    scene.add(gl);
  });
  // Front door — pivot, single wide leaf
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-0.65, 0, -5.46);
  const door = box(1.3, 2.5, 0.06, P.timberDk);
  door.position.set(0.65, 1.25, 0);
  door.userData.collide = 'wall';
  doorGroup.add(door);
  const handle = box(0.04, 0.3, 0.06, P.steel);
  handle.position.set(1.2, 1.2, 0.06);
  handle.userData.collide = 'none';
  doorGroup.add(handle);
  scene.add(doorGroup);
  const doorState = { open: false };
  inspectable(door, 'Front Door', 'Solid oak, pivot-hung on a central axis. Heavier than it looks. The whole south facade is watching you arrive.');
  door.userData.inspect.action = () => { doorState.open = !doorState.open; };
  _animators.push((t, dt) => {
    const target = doorState.open ? -1.6 : 0;
    doorGroup.rotation.y += (target - doorGroup.rotation.y) * Math.min(1, 6 * (dt || 0.016));
  });

  // Entry steps — two low limestone steps
  [0.1, 0.2].forEach((h, i) => {
    const step = box(5, h, 0.5, P.limestone);
    step.position.set(0, GROUND_Y + h / 2, -5.5 - 0.5 * (2 - i));
    scene.add(step);
  });
}

function buildNorthFacade(scene) {
  // Structural columns (visible between glass panels)
  [-9, -3, 3, 9].forEach(x => {
    const col = box(0.2, FH, WT, P.steelDk);
    col.position.set(x, FH / 2, 5.5);
    scene.add(col);
  });
  // Full-height sliding glass — 3 bays
  [-6, 0, 6].forEach(x => {
    const gl = box(5.6, FH - 0.04, 0.06, P.glass, { transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.25 });
    gl.position.set(x, FH / 2, 5.5);
    scene.add(gl);
  });
  const track = box(22, 0.04, 0.06, P.steelDk);
  track.position.set(0, 0.02, 5.5);
  scene.add(track);
}

function buildLiving(scene) {
  // Living room: x -11 to -1.5, z -5.5 to 5.5
  // Partial divider (low wall / bench height) east edge, not ceiling height
  const divider = box(0.2, 1.1, 11, P.concrete);
  divider.position.set(-1.5, 0.55, 0);
  scene.add(divider);

  // Area rug
  const rug = plane(7, 5.5, 0x7a6050);
  rug.position.set(-6, 0.05, 0.5);
  scene.add(rug);

  // Sofa — deep, low, south-facing (looks at garden through north wall)
  const sofaBase = box(3.2, 0.65, 1.0, 0x5a7a8a);
  sofaBase.position.set(-6.5, 0.325, 1.5);
  scene.add(sofaBase);
  const sofaBack = box(3.2, 0.7, 0.2, 0x4a6a7a);
  sofaBack.position.set(-6.5, 0.7, 2.4);
  scene.add(sofaBack);
  const sofaArmL = box(0.2, 0.7, 1.0, 0x4a6a7a);
  sofaArmL.position.set(-7.95, 0.7, 1.5);
  scene.add(sofaArmL);
  const sofaArmR = sofaArmL.clone(); sofaArmR.position.x = -5.05; scene.add(sofaArmR);
  [-7.2, -6.5, -5.8].forEach(x => {
    const cushion = box(0.62, 0.14, 0.7, 0xd0c8b8);
    cushion.position.set(x, 0.72, 1.5);
    scene.add(cushion);
  });
  inspectable(sofaBase, 'Sofa', 'Long, low, wool in slate. Faces the garden through six metres of glass. The television is somewhere it can\'t win.');

  // Coffee table — large flat slab, travertine-look
  const ct = box(1.4, 0.32, 0.8, P.limestone, { map: repTex(TEX.limestone, 1, 1), roughness: 0.5 });
  ct.position.set(-6.5, 0.16, 0.2);
  scene.add(ct);

  // Low credenza along west wall
  const cred = box(2.2, 0.6, 0.45, P.timberDk);
  cred.position.set(-10.5, 0.3, 2);
  scene.add(cred);
  const credTop = box(2.3, 0.04, 0.5, P.ipe);
  credTop.position.set(-10.5, 0.62, 2);
  scene.add(credTop);
  inspectable(credTop, 'Credenza', 'Walnut and blackened steel. One pair of speakers. The vinyl is in the cupboard below.');

  // Concrete fireplace — west wall feature
  const fSurround = box(2.8, 1.6, 0.22, P.concrete);
  fSurround.position.set(-10.5, 0.8, -2);
  scene.add(fSurround);
  const fOpening = box(1.4, 0.9, 0.2, 0x111111);
  fOpening.position.set(-10.5, 0.52, -1.9);
  scene.add(fOpening);
  const fMantle = box(3.0, 0.1, 0.3, P.limestone);
  fMantle.position.set(-10.5, 1.65, -1.9);
  scene.add(fMantle);
  const fLight = new THREE.PointLight(0xff6020, 0.9, 6);
  fLight.position.set(-10.5, 0.4, -1.8);
  scene.add(fLight);
  inspectable(fSurround, 'Fireplace', 'Board-formed concrete. The only source of heat in winter that matters. The underfloor is there too, just less honest about it.');

  // Floor lamp
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), stdMat(P.steelDk));
  stem.position.set(-4.5, 0.95, 2.2);
  scene.add(stem);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.32, 12, 1, true), stdMat(0xe8e0c8, { side: THREE.DoubleSide }));
  shade.position.set(-4.5, 1.96, 2.2);
  scene.add(shade);
  const ll = new THREE.PointLight(0xffe8c0, 1.1, 7);
  ll.position.set(-4.5, 1.9, 2.2);
  scene.add(ll);
}

function buildDining(scene) {
  // Dining: centre of pavilion, deliberately undefined — bleeds into living and kitchen
  const table = box(2.8, 0.06, 1.2, P.limestone, { roughness: 0.45 });
  table.position.set(1, 0.74, -1.5);
  inspectable(table, 'Dining Table', 'One limestone slab on two concrete trestles. Seats eight without crowding. The garden is the ninth guest, always present through the north wall.');
  scene.add(table);
  // Trestle legs
  [-0.8, 0.8].forEach(dx => {
    const trestle = box(0.1, 0.72, 1.0, P.concreteDk);
    trestle.position.set(1 + dx, 0.36, -1.5);
    scene.add(trestle);
  });
  // Chairs — bentwood-style
  [[-1.5,-2.3],[-0.5,-2.3],[0.5,-2.3],[1.5,-2.3],
   [-1.5,-0.7],[-0.5,-0.7],[0.5,-0.7],[1.5,-0.7]].forEach(([dx, z]) => {
    const seat = box(0.44, 0.04, 0.42, P.offWhite);
    seat.position.set(1 + dx, 0.46, z);
    scene.add(seat);
    const back = box(0.44, 0.48, 0.04, P.offWhite);
    back.position.set(1 + dx, 0.7, z + (z < -1.5 ? 0.2 : -0.2));
    scene.add(back);
    [[-0.17,-0.16],[0.17,-0.16],[-0.17,0.16],[0.17,0.16]].forEach(([ldx,ldz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44, 6), stdMat(P.steel));
      leg.position.set(1 + dx + ldx, 0.22, z + ldz);
      scene.add(leg);
    });
  });
  // Pendant light — single long concrete cylinder
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 6), stdMat(P.steelDk));
  cord.position.set(1, FH - 0.35, -1.5);
  scene.add(cord);
  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 0.4, 12), stdMat(P.concrete));
  pendant.position.set(1, FH - 0.9, -1.5);
  scene.add(pendant);
  const pBulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), stdMat(0xffe8c0, { emissive: 0xffe090, emissiveIntensity: 1 }));
  pBulb.position.set(1, FH - 1.1, -1.5);
  scene.add(pBulb);
  const pLight = new THREE.PointLight(0xfff0c8, 1.6, 9);
  pLight.position.set(1, FH - 1.1, -1.5);
  scene.add(pLight);
}

function buildKitchen(scene) {
  // Kitchen: x 4 to 11, z 0 to 5.5
  const kFloor = plane(7, 5.5, P.floorStone, { map: repTex(TEX.limestone, 3.5, 2.8) });
  kFloor.position.set(7.5, 0.04, 2.75);
  scene.add(kFloor);

  // North wall units (below the sliding glass)
  const wUnits = box(6.5, 0.7, 0.48, P.white);
  wUnits.position.set(7.25, 2.6, 5.2);
  scene.add(wUnits);
  const bUnits = box(6.5, 0.9, 0.58, P.white);
  bUnits.position.set(7.25, 0.45, 5.15);
  scene.add(bUnits);
  const worktop = box(6.5, 0.04, 0.6, P.stone);
  worktop.position.set(7.25, 0.92, 5.15);
  scene.add(worktop);

  // Sink
  const sink = box(0.7, 0.1, 0.42, P.steel, { roughness: 0.2, metalness: 0.8 });
  sink.position.set(6.5, 0.97, 5.1);
  scene.add(sink);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 6), stdMat(P.steel, { metalness: 0.9, roughness: 0.1 }));
  tap.position.set(6.5, 1.14, 4.95);
  scene.add(tap);

  // Freestanding island — the centrepiece
  const island = box(2.4, 0.88, 1.1, P.concrete);
  island.position.set(7, 0.44, 2);
  scene.add(island);
  const islandTop = box(2.5, 0.04, 1.2, P.limestone, { roughness: 0.35 });
  islandTop.position.set(7, 0.9, 2);
  inspectable(islandTop, 'Kitchen Island', 'Honed limestone on a poured concrete base. Everything happens here. The dining table is an overflow.');
  scene.add(islandTop);

  // Bar stools
  [-0.8, 0.8].forEach(dx => {
    const ss = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.08, 10), stdMat(P.steelDk));
    ss.position.set(7 + dx, 0.84, 0.7);
    scene.add(ss);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 8), stdMat(P.steel));
    sp.position.set(7 + dx, 0.43, 0.7);
    scene.add(sp);
  });

  // Hob
  const hob = box(0.6, 0.01, 0.5, 0x1a1a1a);
  hob.position.set(7, 0.92, 1.95);
  scene.add(hob);

  // Extractor
  const hood = box(0.7, 0.1, 0.52, P.steelDk);
  hood.position.set(7, 2.1, 1.95);
  scene.add(hood);
  const hoodStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), stdMat(P.steel));
  hoodStem.position.set(7, 2.6, 1.95);
  scene.add(hoodStem);

  // Fridge — integrated, flush to units
  const fridge = box(0.65, 2.0, 0.58, P.steel, { roughness: 0.3, metalness: 0.6 });
  fridge.position.set(10.5, 1.0, 5.1);
  inspectable(fridge, 'Refrigerator', 'Column fridge, handleless. Part of the wall when closed. Suspiciously well-stocked.');
  scene.add(fridge);

  // Light
  const kLight = new THREE.PointLight(0xffe4a0, 0.9, 10);
  kLight.position.set(8, 2.5, 3);
  scene.add(kLight);
}

function buildUtility(scene) {
  // Utility: x 4 to 11, z -5.5 to 0 — south side behind kitchen
  const uWall = box(7, FH, WT, P.offWhite);
  uWall.position.set(7.5, FH / 2, 0);
  scene.add(uWall);
  const wm = box(0.65, 0.85, 0.6, P.white);
  wm.position.set(5, 0.425, -3);
  inspectable(wm, 'Washing Machine', 'Utility room. Not glamorous. Essential.');
  scene.add(wm);
  const dryer = box(0.65, 0.85, 0.6, P.white);
  dryer.position.set(5.7, 0.425, -3);
  scene.add(dryer);
  const uTop = box(1.5, 0.04, 0.62, P.stone);
  uTop.position.set(5.35, 0.9, -3);
  scene.add(uTop);
  const sink2 = box(0.55, 0.1, 0.42, P.steel, { roughness: 0.2, metalness: 0.7 });
  sink2.position.set(9.5, 0.95, -3);
  scene.add(sink2);
}

function buildWC(scene) {
  // WC: small, off entry hall, west side
  const wWall = box(WT, FH, 3, P.offWhite);
  wWall.position.set(-9, FH / 2, -3.5);
  scene.add(wWall);
  const sWall = box(2, FH, WT, P.offWhite);
  sWall.position.set(-10, FH / 2, -5.2);
  scene.add(sWall);
  const toilet = box(0.38, 0.42, 0.55, P.white);
  toilet.position.set(-10, 0.21, -4);
  scene.add(toilet);
  const basin = box(0.42, 0.18, 0.32, P.white);
  basin.position.set(-9.4, 0.82, -4.8);
  scene.add(basin);
}

// ─── Bedroom wing ─────────────────────────────────────────────────────────────
// Glazed link: x 11 to 13.5. Wing body: x 13.5 to 32.
function buildBedroomWing(scene) {
  // Glazed link corridor
  const linkFloor = plane(2.5, 11, P.limestone, { map: repTex(TEX.limestone, 1.5, 6) });
  linkFloor.position.set(12.25, 0.01, 0);
  scene.add(linkFloor);
  const linkRoof = box(2.5, 0.28, 11, P.concreteDk);
  linkRoof.position.set(12.25, FH + 0.14, 0);
  scene.add(linkRoof);
  // Glazed north and south sides of link
  ['n', 's'].forEach(side => {
    const z = side === 'n' ? 5.5 : -5.5;
    const gl = box(2.5, FH, 0.06, P.glass, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.25 });
    gl.position.set(12.25, FH / 2, z);
    gl.userData.collide = 'wall';
    scene.add(gl);
  });

  // Wing slab and floor
  const wingSlab = box(18.5, 0.22, 11, P.concreteDk);
  wingSlab.position.set(22.25, -0.11, 0);
  scene.add(wingSlab);
  const wingFloor = plane(18.4, 10.8, P.floorWood, { map: repTex(TEX.wood, 9, 5) });
  wingFloor.position.set(22.25, 0.01, 0);
  scene.add(wingFloor);

  // Wing roof
  const wingRoof = box(18.5, 0.28, 11.8, P.concreteDk);
  wingRoof.position.set(22.25, FH + 0.14, 0);
  scene.add(wingRoof);

  // North and south external walls (rammed earth render)
  const wingN = box(18.5, FH, WT, P.rammedEarth);
  wingN.position.set(22.25, FH / 2, 5.5);
  scene.add(wingN);
  // South wall — full length, but each bedroom has a garden door
  const wingS1 = box(3, FH, WT, P.rammedEarth);
  wingS1.position.set(15, FH / 2, -5.5);
  scene.add(wingS1);
  const wingS2 = box(3, FH, WT, P.rammedEarth);
  wingS2.position.set(21, FH / 2, -5.5);
  scene.add(wingS2);
  const wingS3 = box(5.5, FH, WT, P.rammedEarth);
  wingS3.position.set(28.75, FH / 2, -5.5);
  scene.add(wingS3);

  // East end wall
  const wingE = box(WT, FH, 11, P.concrete);
  wingE.position.set(32, FH / 2, 0);
  scene.add(wingE);

  // Garden doors on south wall (each bedroom)
  [17, 23].forEach(x => {
    const glDoor = box(1.6, 2.6, 0.06, P.glass, { transparent: true, opacity: 0.35, roughness: 0.05 });
    glDoor.position.set(x, 1.3, -5.47);
    scene.add(glDoor);
  });
  // Master east-facing glass door
  const masterDoor = box(1.8, 2.6, 0.06, P.glass, { transparent: true, opacity: 0.35, roughness: 0.05 });
  masterDoor.position.set(31.97, 1.3, -1);
  scene.add(masterDoor);

  // Internal partitions
  buildBedroom2(scene);
  buildBedroom3(scene);
  buildMasterSuite(scene);
}

function buildBedroom2(scene) {
  // Bed 2: x 13.5 to 20, z 0 to 5.5
  const partS = box(6.5, FH, WT, P.offWhite);
  partS.position.set(16.75, FH / 2, 0);
  scene.add(partS);
  // Bed
  const bed = box(1.6, 0.38, 2.1, P.timberDk);
  bed.position.set(17, 0.19, 3);
  scene.add(bed);
  const mattress = box(1.5, 0.22, 2.0, P.offWhite);
  mattress.position.set(17, 0.48, 3);
  scene.add(mattress);
  const duvet = box(1.46, 0.12, 1.8, 0xd8d0c8);
  duvet.position.set(17, 0.54, 3.1);
  inspectable(duvet, 'Bedroom 2', 'Quiet. South garden light through the door. Nothing between the bed and the outside except glass.');
  scene.add(duvet);
  const hboard = box(1.6, 0.58, 0.1, P.timberDk);
  hboard.position.set(17, 0.55, 1.95);
  scene.add(hboard);
  // Wardrobe
  const ward = box(1.2, FH * 0.9, 0.55, P.white);
  ward.position.set(19.3, FH * 0.45, 4.8);
  scene.add(ward);
  // Bedside lamp
  const bst = box(0.44, 0.52, 0.38, P.timber);
  bst.position.set(15.8, 0.26, 2.5);
  scene.add(bst);
  const bl = new THREE.PointLight(0xffe8c0, 0.5, 4);
  bl.position.set(15.8, 0.65, 2.5);
  scene.add(bl);
  // Bathroom between beds 2 & 3
  buildSharedBath(scene, 16.75, -2);
}

function buildBedroom3(scene) {
  // Bed 3: x 20 to 26, z 0 to 5.5
  const partS = box(6, FH, WT, P.offWhite);
  partS.position.set(23, FH / 2, 0);
  scene.add(partS);
  const partM = box(WT, FH, 5.5, P.offWhite);
  partM.position.set(20, FH / 2, 2.75);
  scene.add(partM);
  const bed = box(1.6, 0.38, 2.0, P.timberDk);
  bed.position.set(23, 0.19, 3.2);
  scene.add(bed);
  const mattress = box(1.5, 0.22, 1.9, P.offWhite);
  mattress.position.set(23, 0.48, 3.2);
  scene.add(mattress);
  const duvet = box(1.46, 0.12, 1.7, 0xe0d8cc);
  duvet.position.set(23, 0.54, 3.3);
  inspectable(duvet, 'Bedroom 3', 'Same light as bedroom 2, different view. The garden studio is visible from here at an angle.');
  scene.add(duvet);
  const hboard = box(1.6, 0.54, 0.1, P.timberDk);
  hboard.position.set(23, 0.53, 2.2);
  scene.add(hboard);
  const ward = box(1.1, FH * 0.9, 0.55, P.white);
  ward.position.set(25.3, FH * 0.45, 4.8);
  scene.add(ward);
  const bst = box(0.44, 0.52, 0.38, P.timber);
  bst.position.set(21.8, 0.26, 2.8);
  scene.add(bst);
  const bl = new THREE.PointLight(0xffe8c0, 0.5, 4);
  bl.position.set(21.8, 0.65, 2.8);
  scene.add(bl);
}

function buildSharedBath(scene, x, z) {
  // Shared bathroom between bed 2 & 3, south side of wing
  const bath = box(1.4, 0.48, 0.68, P.white);
  bath.position.set(x, 0.24, z);
  scene.add(bath);
  const bathRim = box(1.42, 0.05, 0.7, P.limestone);
  bathRim.position.set(x, 0.5, z);
  scene.add(bathRim);
  const basin = box(0.48, 0.18, 0.36, P.white);
  basin.position.set(x + 2.5, 0.82, z);
  scene.add(basin);
  const toilet = box(0.38, 0.4, 0.52, P.white);
  toilet.position.set(x + 2.5, 0.2, z - 1.5);
  scene.add(toilet);
  const shower = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), stdMat(P.stone));
  shower.rotation.x = -Math.PI / 2;
  shower.position.set(x - 2.5, 0.02, z);
  scene.add(shower);
}

function buildMasterSuite(scene) {
  // Master: x 26 to 32, z -5.5 to 5.5 (full width of wing)
  const partW = box(WT, FH, 11, P.offWhite);
  partW.position.set(26, FH / 2, 0);
  scene.add(partW);
  // Floor — warmer in master
  const mFloor = plane(6, 10.8, P.floorWoodDk, { map: repTex(TEX.wood, 3, 5) });
  mFloor.position.set(29, 0.03, 0);
  scene.add(mFloor);
  // Bed — centred, king
  const bedBase = box(2.2, 0.4, 2.6, P.timberDk);
  bedBase.position.set(28.5, 0.2, 1);
  scene.add(bedBase);
  const mattress = box(2.0, 0.26, 2.45, P.offWhite);
  mattress.position.set(28.5, 0.47, 1);
  scene.add(mattress);
  const duvet = box(1.9, 0.14, 2.25, P.white);
  duvet.position.set(28.5, 0.54, 1.1);
  inspectable(duvet, 'Master Bedroom', 'The east wall is mostly glass. You wake up to the kitchen garden. No stairs to come down. The house is all on your level.');
  scene.add(duvet);
  [29.4, 27.6].forEach(x => {
    const pillow = box(0.72, 0.14, 0.55, P.white);
    pillow.position.set(x, 0.65, -0.2);
    scene.add(pillow);
  });
  const hboard = box(2.2, 0.82, 0.12, P.timberDk);
  hboard.position.set(28.5, 0.61, -0.3);
  scene.add(hboard);
  // Bedside
  [-0.85, 0.85].forEach(dx => {
    const ns = box(0.46, 0.52, 0.4, P.timber);
    ns.position.set(28.5 + dx * 1.6, 0.26, 0.1);
    scene.add(ns);
    const bl = new THREE.PointLight(0xffe8c0, 0.6, 5);
    bl.position.set(28.5 + dx * 1.6, 0.68, 0.1);
    scene.add(bl);
  });
  // Dressing wall
  const wardrobe = box(5.5, FH * 0.92, 0.62, P.white);
  wardrobe.position.set(29.25, FH * 0.46, 4.8);
  scene.add(wardrobe);
  [-1, 0, 1].forEach(dx => {
    const door = box(1.7, FH * 0.9, 0.04, P.offWhite);
    door.position.set(29.25 + dx * 1.8, FH * 0.45, 4.5);
    scene.add(door);
  });
  // En-suite (west end)
  const esBath = box(1.5, 0.5, 0.72, P.white);
  esBath.position.set(27, 0.25, -4.2);
  scene.add(esBath);
  const esShower = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), stdMat(P.stone));
  esShower.rotation.x = -Math.PI / 2;
  esShower.position.set(29.5, 0.02, -4.2);
  scene.add(esShower);
  const esGlass = box(0.04, 2.0, 1.2, P.glass, { transparent: true, opacity: 0.3 });
  esGlass.position.set(28.7, 1.0, -4.2);
  scene.add(esGlass);
  const esBasin = box(0.5, 0.18, 0.38, P.white);
  esBasin.position.set(31.3, 0.82, -4);
  scene.add(esBasin);
  // Mirror on east wall
  const mirror = box(1.4, 0.9, 0.04, P.glass, { transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.9 });
  mirror.position.set(31.9, 1.5, -3.5);
  scene.add(mirror);
  inspectable(mirror, 'En-suite', 'Wet room, limestone, walk-in. The east wall is translucent, not transparent — morning light diffuses through without a view. Chosen deliberately.');
}

// ─── Study pavilion ───────────────────────────────────────────────────────────
// Separate west pavilion. x -20 to -14, z -4 to 4. Connected by covered walkway.
function buildStudyPavilion(scene) {
  // Covered walkway: x -14 to -11, z -1.5 to 1.5
  const walkRoof = box(3, 0.2, 3, P.concreteDk);
  walkRoof.position.set(-12.5, FH + 0.1, 0);
  scene.add(walkRoof);
  // Walkway columns
  [[-14, 1.2], [-14, -1.2], [-11.2, 1.2], [-11.2, -1.2]].forEach(([x, z]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, FH, 8), stdMat(P.steelDk));
    col.position.set(x, FH / 2, z);
    scene.add(col);
  });
  const walkFloor = plane(3, 3, P.limestone, { map: repTex(TEX.limestone, 2, 2) });
  walkFloor.position.set(-12.5, 0.01, 0);
  scene.add(walkFloor);

  // Study pavilion slab
  const studySlab = box(6, 0.22, 8, P.concreteDk);
  studySlab.position.set(-17, -0.11, 0);
  scene.add(studySlab);
  // Floor — dark timber (different from living spaces, deliberately)
  const studyFloor = plane(5.8, 7.8, P.floorWoodDk, { map: repTex(TEX.wood, 3, 4) });
  studyFloor.position.set(-17, 0.01, 0);
  scene.add(studyFloor);
  // Walls: north and south solid, east has door opening, west is full glazing to garden
  const sWall = box(6, FH, WT, P.concrete);
  sWall.position.set(-17, FH / 2, -4);
  scene.add(sWall);
  const nWall = box(6, FH, WT, P.concrete);
  nWall.position.set(-17, FH / 2, 4);
  scene.add(nWall);
  const eWall = box(WT, FH, 8, P.concrete);
  eWall.position.set(-14, FH / 2, 0);
  scene.add(eWall);
  // Door opening in east wall
  const eDoor = box(1.1, 2.4, 0.06, P.timberDk);
  eDoor.position.set(-13.97, 1.2, 0);
  scene.add(eDoor);
  // West: mostly glazed — the view from the desk
  const wGlass = box(0.06, FH * 0.85, 7.6, P.glass, { transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.2 });
  wGlass.position.set(-20, FH * 0.45, 0);
  wGlass.userData.collide = 'wall';
  scene.add(wGlass);
  const wFrame = box(WT, FH, 8, P.steelDk);
  wFrame.position.set(-20, FH / 2, 0);
  scene.add(wFrame);
  // Roof
  const studyRoof = box(6.4, 0.28, 8.4, P.concreteDk);
  studyRoof.position.set(-17, FH + 0.14, 0);
  scene.add(studyRoof);
  // Contents
  const desk = box(1.8, 0.04, 0.82, P.timberDk);
  desk.position.set(-16.5, 0.74, 0);
  inspectable(desk, 'Writing Desk', 'Far enough from the house that nobody asks how the work is going. The garden is west. The bungalow is east. This is where the line is.');
  scene.add(desk);
  [[-0.7, -0.36], [0.7, -0.36], [-0.7, 0.36], [0.7, 0.36]].forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6), stdMat(P.steelDk));
    leg.position.set(-16.5 + dx, 0.36, dz);
    scene.add(leg);
  });
  const monitor = box(0.65, 0.38, 0.04, 0x0a0a0a);
  monitor.position.set(-16.5, 0.95, -0.38);
  scene.add(monitor);
  const chair = box(0.72, 0.44, 0.7, 0x3a4a3a);
  chair.position.set(-16.5, 0.22, 0.68);
  scene.add(chair);
  const chairBack = box(0.72, 0.66, 0.1, 0x3a4a3a);
  chairBack.position.set(-16.5, 0.66, 1.05);
  scene.add(chairBack);
  // Bookshelf on north wall
  const shelf = box(0.28, FH * 0.88, 3.6, P.offWhite);
  shelf.position.set(-19.8, FH * 0.44, 2);
  inspectable(shelf, 'Shelves', 'Floor to ceiling, three rows, north wall. Reference books, mostly. One row of novels. An attempt at a plant.');
  scene.add(shelf);
  const bkColors = [0x7a3040, 0x304878, 0x507838, 0x786028, 0x583870];
  [0.5, 1.2, 1.9, 2.5].forEach(y => {
    const plank = box(0.24, 0.03, 3.5, P.timber);
    plank.position.set(-19.8, y, 2);
    scene.add(plank);
    let xp = -21.4;
    for (let i = 0; i < 8; i++) {
      const bkW = 0.1 + Math.random() * 0.06;
      const bkH = 0.2 + Math.random() * 0.08;
      const bk = box(0.22, bkH, bkW, bkColors[i % bkColors.length]);
      bk.position.set(-19.8, y + bkH / 2, xp + bkW / 2);
      xp += bkW + 0.015;
      if (xp > -18.7) break;
      scene.add(bk);
    }
  });
  // Study lamp
  const sl = new THREE.PointLight(0xfff0c0, 0.8, 6);
  sl.position.set(-16.5, 1.8, 0);
  scene.add(sl);
}

// ─── Terrace ──────────────────────────────────────────────────────────────────
// Ipe decking between main pavilion and pool, z 5.5 to 9.5, x -13 to 13
function buildTerrace(scene) {
  const deck = plane(26, 4, P.ipe, { map: repTex(TEX.ipe, 26, 2) });
  deck.position.set(0, 0.04, 7.5);
  scene.add(deck);

  // Outdoor dining cluster
  const oTable = box(2.0, 0.04, 1.1, P.steelDk, { metalness: 0.7, roughness: 0.3 });
  oTable.position.set(-7, 0.74, 7.5);
  inspectable(oTable, 'Outdoor Table', 'Steel and glass. Set for two most mornings, four on weekends. The north garden is the dining room wall.');
  scene.add(oTable);
  [[-0.8,-0.45],[0.8,-0.45],[-0.8,0.45],[0.8,0.45]].forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6), stdMat(P.steelDk));
    leg.position.set(-7 + dx, 0.36, 7.5 + dz);
    scene.add(leg);
  });
  [[-7.5, 7.0],[-6.5, 7.0],[-7.5, 8.0],[-6.5, 8.0]].forEach(([x, z]) => {
    const s = box(0.42, 0.04, 0.42, P.steel, { metalness: 0.6 });
    s.position.set(x, 0.46, z);
    scene.add(s);
  });

  // Concrete bench along facade
  const bench = box(8, 0.42, 0.52, P.concrete);
  bench.position.set(4, 0.21, 6.1);
  scene.add(bench);
  const benchSeat = box(8.1, 0.06, 0.54, P.limestone);
  benchSeat.position.set(4, 0.45, 6.1);
  scene.add(benchSeat);
  inspectable(benchSeat, 'Bench', 'Poured in place against the facade. Morning coffee. Evening wine. The glass behind reflects the garden at dusk.');

  // Planters
  [-11, 11].forEach(x => {
    const planter = box(0.7, 0.55, 4, P.concreteDk);
    planter.position.set(x, 0.275, 7.5);
    scene.add(planter);
    [6.5, 7.5, 8.5].forEach(z => {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.35, 7, 5), stdMat(P.grass));
      shrub.position.set(x, 0.85, z);
      shrub.castShadow = true;
      scene.add(shrub);
    });
    // Terracotta pots
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.35, 10), stdMat(P.terracotta));
    pot.position.set(x, 0.175, 9);
    scene.add(pot);
  });
}

// ─── Pool ─────────────────────────────────────────────────────────────────────
// Lap pool: x -6 to 6, z 10 to 19.  Surround: x -9 to 9, z 9.5 to 21.
function buildPool(scene) {
  const surround = plane(18, 11.5, P.limestone, { map: repTex(TEX.limestone, 9, 6) });
  surround.position.set(0, 0.02, 15.25);
  scene.add(surround);

  const waterGeo = new THREE.PlaneGeometry(11.8, 8.8, 40, 16);
  const poolWater = new THREE.Mesh(waterGeo, stdMat(P.water, {
    roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.88,
  }));
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.set(0, -0.06, 14.9);
  poolWater.receiveShadow = true;
  poolWater.userData.noShadow = true;
  poolWater.userData.collide = 'floor';
  inspectable(poolWater, 'Lap Pool', 'Twelve metres, unheated. The decision not to heat it was aesthetic as much as anything — it keeps the swims honest.');
  scene.add(poolWater);

  const wPos = waterGeo.attributes.position;
  _animators.push(t => {
    for (let i = 0; i < wPos.count; i++) {
      const x = wPos.getX(i), y = wPos.getY(i);
      wPos.setZ(i,
        Math.sin(x * 1.8 + t * 1.6) * 0.022 +
        Math.cos((y + x * 0.4) * 2.6 + t * 2.1) * 0.016
      );
    }
    wPos.needsUpdate = true;
    waterGeo.computeVertexNormals();
  });

  // Pool coping — limestone lip
  [[0, 10.55, 12, 0.12], [0, 19.25, 12, 0.12]].forEach(([x, z, w, d]) => {
    const lip = box(w, 0.1, d, P.limestone);
    lip.position.set(x, 0.05, z);
    scene.add(lip);
  });
  [[6.1, 14.9, 0.12, 9], [-6.1, 14.9, 0.12, 9]].forEach(([x, z, w, d]) => {
    const lip = box(w, 0.1, d, P.limestone);
    lip.position.set(x, 0.05, z);
    scene.add(lip);
  });

  // Sun loungers
  [-3, 3].forEach(x => {
    const lounger = box(1.85, 0.07, 0.66, P.offWhite);
    lounger.position.set(x, 0.04, 20.5);
    scene.add(lounger);
    const headEnd = box(1.85, 0.28, 0.06, P.offWhite);
    headEnd.position.set(x, 0.18, 20.2);
    headEnd.rotation.x = -0.38;
    scene.add(headEnd);
    const towel = box(1.6, 0.03, 0.52, 0x9ab8d8);
    towel.position.set(x, 0.1, 20.5);
    scene.add(towel);
  });
}

// ─── Entry forecourt ──────────────────────────────────────────────────────────
function buildEntryCourt(scene) {
  // Gravel forecourt south of facade
  const court = plane(16, 9, P.gravel, { map: repTex(TEX.gravel, 8, 4.5) });
  court.position.set(0, GROUND_Y + 0.01, -9.5);
  scene.add(court);

  // Driveway — narrow, stone-set, pedestrian-scale (no need for sweep)
  const drive = plane(5, 18, P.gravel, { map: repTex(TEX.gravel, 2.5, 9) });
  drive.position.set(0, GROUND_Y + 0.01, -22);
  scene.add(drive);

  // Entry gate pillars
  [-3, 3].forEach(x => {
    const pillar = box(0.45, 1.1, 0.45, P.limestone);
    pillar.position.set(x, GROUND_Y + 0.55, -29.5);
    scene.add(pillar);
    const cap = box(0.6, 0.1, 0.6, P.stoneDk);
    cap.position.set(x, GROUND_Y + 1.15, -29.5);
    scene.add(cap);
  });

  // Olive trees flanking door
  [[-2.2, -5.4], [2.2, -5.4]].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.9, 7), stdMat(0x8a7a60));
    trunk.position.set(x, 0.95, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.75, 7, 5), stdMat(0x8aaa78));
    canopy.position.set(x, 2.4, z);
    canopy.castShadow = true;
    inspectable(canopy, 'Olive Tree', 'A matched pair. Moved here from a Tuscan farmyard. They look like they\'ve always been here. That was the intention.');
    scene.add(canopy);
  });
}

// ─── Kitchen garden ───────────────────────────────────────────────────────────
// Walled, south-east. x 14 to 28, z -8 to -14.
function buildKitchenGarden(scene) {
  const kgx = 21, kgz = -11;
  // Walls
  [[kgx, kgz - 4.5, 14, 0.65, 0.25], [kgx, kgz + 4.5, 14, 0.65, 0.25],
   [kgx - 7, kgz, 0.25, 0.65, 9], [kgx + 7, kgz, 0.25, 0.65, 9]].forEach(([x, z, w, h, d]) => {
    const wall = box(w, h, d, P.stoneDk);
    wall.position.set(x, GROUND_Y + h / 2, z);
    scene.add(wall);
  });
  // Raised beds
  const beds = [[-3, -2], [3, -2], [-3, 2], [3, 2]];
  const ROWS = 4, COLS = 5;
  const plants = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.06, 1, 5), stdMat(0x4a8a30),
    beds.length * ROWS * COLS
  );
  let pi = 0;
  beds.forEach(([dx, dz]) => {
    const bed = box(2.6, 0.32, 1.8, P.stoneDk);
    bed.position.set(kgx + dx, 0.16, kgz + dz);
    scene.add(bed);
    const soil = plane(2.4, 1.6, P.soil);
    soil.position.set(kgx + dx, 0.34, kgz + dz);
    scene.add(soil);
    for (let ri = 0; ri < ROWS; ri++) {
      for (let ci = 0; ci < COLS; ci++) {
        _dummy.position.set(kgx + dx - 0.8 + ci * 0.35, 0.42, kgz + dz - 0.55 + ri * 0.32);
        _dummy.scale.set(1, 0.16 + Math.random() * 0.1, 1);
        _dummy.updateMatrix();
        plants.setMatrixAt(pi++, _dummy.matrix);
      }
    }
  });
  plants.userData.collide = 'none';
  plants.userData.noShadow = true;
  scene.add(plants);

  // Gravel path
  const path = plane(2, 9, P.gravel, { map: repTex(TEX.gravel, 1, 4.5) });
  path.position.set(kgx, 0.02, kgz);
  scene.add(path);

  // Water butt
  const butt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.8, 10), stdMat(P.steelDk));
  butt.position.set(kgx + 6, 0.4, kgz - 3);
  inspectable(butt, 'Water Butt', 'Off the bedroom wing gutter. The tomatoes prefer it to tap water. They\'ve been right every year.');
  scene.add(butt);
}

// ─── Trees ────────────────────────────────────────────────────────────────────
function buildTrees(scene) {
  const treeData = [
    // [x, z, scale]
    [-22, 15, 1.0], [-25, 5, 0.85], [-22, -5, 0.9], [-26, -15, 0.75],
    [18, 22, 0.9],  [25, 18, 1.1],  [22, 28, 0.8],
    [-5, 38, 1.2],  [8, 42, 1.0],   [-14, 44, 0.95],
    [12, -20, 0.6], [8, -24, 0.55], [4, -28, 0.5],  // avenue along drive
    [-10, -20, 0.7], [-8, -25, 0.65],
    [35, 5, 0.8], [34, -5, 0.75], [36, -10, 0.9],
  ];

  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1, 8), stdMat(P.timberDk), treeData.length
  );
  const canopies = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 7, 5), stdMat(P.grass), treeData.length * 3
  );
  let ti = 0, ci = 0;
  treeData.forEach(([x, z, scale]) => {
    const trunkH = 3.8 * scale;
    _dummy.position.set(x, trunkH / 2, z);
    _dummy.scale.set(scale, trunkH, scale);
    _dummy.updateMatrix();
    trunks.setMatrixAt(ti++, _dummy.matrix);
    [[0, trunkH + 1.3*scale, 0, 2.1*scale],
     [-0.5*scale, trunkH + 0.8*scale, 0.4*scale, 1.4*scale],
     [0.6*scale, trunkH + 1.0*scale, -0.3*scale, 1.6*scale]].forEach(([dx, dy, dz, r]) => {
      _dummy.position.set(x + dx, dy, z + dz);
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
