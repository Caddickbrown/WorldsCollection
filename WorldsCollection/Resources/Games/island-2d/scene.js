/**
 * Island Scene v2 — Solarpunk Town (Big Island with Topology)
 *
 * A ~600x600 island with rolling hills, distinct named areas,
 * path network, and surrounding sea. Built from simple Three.js
 * primitives with warm, cheerful colours. No textures.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------
const C = {
  sea:        0x3a9fbf,
  seaDeep:    0x2d7d9a,
  sand:       0xe8d5a3,
  grass:      0x6ab04c,
  grassDark:  0x4a8a30,
  path:       0xb89e5c,
  pathDark:   0xa68b4b,
  dock:       0x8b6914,
  // buildings
  bakery:     0xe17055,
  postOffice: 0xcc2222,
  house1:     0xffeaa7,
  house2:     0xfdcb6e,
  house3:     0xf8e8d0,
  house4:     0xdfe6e9,
  house5:     0xfab1a0,
  library:    0xa29bfe,
  greenhouse: 0x55efc4,
  workshop:   0xb2bec3,
  barn:       0x8b4513,
  barnRoof:   0x6b3410,
  // details
  roof:       0xd63031,
  roofDark:   0x9b2226,
  door:       0x6d4c3d,
  solar:      0x2d3436,
  solarFrame: 0x636e72,
  trunk:      0x8b6914,
  foliage:    0x27ae60,
  foliageDark:0x1e8449,
  windmill:   0xf0f0f0,
  blade:      0xe0e0e0,
  field:      0x7dcea0,
  fieldRows:  0x5dae80,
  water:      0x74b9ff,
  white:      0xffffff,
  fence:      0x9e8a6e,
  cycleShop:  0x2d9e8f,
  sportsCourt:0x3aad5c,
  fitnessCtr: 0x4a90d9,
  scienceCtr: 0xf5f5f5,
  fishery:    0x4a5568,
  maintenance:0x718096,
  boat:       0xc0392b,
  boatHull:   0xf5f0e8,
};

// ---------------------------------------------------------------------------
// Areas — named locations NPCs and player navigate between
// ---------------------------------------------------------------------------
export const AREAS = {
  KART_TRACK:     { x: 297,  z: -222, label: 'Kart Track' },
  TOWN_SQUARE:    { x: 0,    z: 0,    label: 'Town Square' },
  VILLAGE:        { x: 0,    z: -72,  label: 'Village' },
  BAKERY:         { x: -90,  z: -60,  label: 'Bakery' },
  POST_OFFICE:    { x: 90,   z: -60,  label: 'Post Office' },
  CAFE:           { x: 8,    z: -83,  label: 'The Café' },
  DOCK:           { x: 0,    z: 370,  label: 'The Dock' },
  FARM:           { x: -270, z: 120,  label: 'The Farm' },
  FOREST:         { x: 270,  z: 180,  label: 'Forest Path' },
  TREEHOUSE:      { x: 282,  z: 192,  label: "Petra's Treehouse" },
  HILLTOP:        { x: -150, z: -270, label: 'The Hilltop' },
  BEACH_SOUTH:    { x: 0,    z: -330, label: 'South Beach' },
  LIBRARY:        { x: 120,  z: 60,   label: 'Library' },
  WORKSHOP:       { x: -120, z: 60,   label: 'Workshop' },
  PUB:            { x: -45,  z: -105, label: 'The Anchor' },
  SCHOOL:         { x: 60,   z: -105, label: 'School' },
  SOUTH_QUARTER:  { x: 12,   z: -102, label: 'South Quarter' },
  AQUARIUM:       { x: 225,  z: -120, label: "Elliot's Aquarium" },
  MILL:           { x: -180, z: 60,   label: 'The Mill' },
  GENERAL_STORE:  { x: -30,  z: -72,  label: 'General Store' },
  CYCLE_SHOP:     { x: -45,  z: -135, label: 'Cycle Shop' },
  SPORTS_COURTS:  { x: 165,  z: -45,  label: 'Sports Courts' },
  FITNESS_CENTER: { x: 165,  z: -83,  label: 'Fitness Center' },
  SCIENCE_CENTER: { x: -120, z: -225, label: 'Science Center' },
  FISHERY_AREA:   { x: 45,   z: 345,  label: 'Fishery' },
  MAINTENANCE:    { x: -158, z: 105,  label: 'Maintenance' },
  LIGHTHOUSE:     { x: 63,   z: 372,  label: 'The Lighthouse' },
  RADIO_STATION:  { x: 165,  z: 75,   label: 'Radio Station' },
  CLIFFTOPS:      { x: -150, z: -270, label: 'The Clifftops' },
  EAST_BEACH:     { x: 225,  z: -233, label: 'East Beach' },
  HARBOUR:        { x: 0,    z: 355,  label: 'The Harbour' },
  MARKET_TOWN:    { x: -60,  z: -150, label: 'Market Town' },
  SANDY_BAY:      { x: 150,  z: -330, label: 'Sandy Bay' },
  TIDEPOOLS:      { x: -200, z: -350, label: 'Tidepools' },
  FISHING_VILLAGE:{ x: 80,   z: 300,  label: 'Fishing Village' },
  KELP_COVE:      { x: -180, z: 340,  label: 'Kelp Cove' },
  SALT_MARSH:     { x: -300, z: -50,  label: 'Salt Marsh' },
  RIVER_MOUTH:    { x: -200, z: 280,  label: 'River Mouth' },
  HIGHLAND_FOREST:{ x: -300, z: -200, label: 'Highland Forest' },
  WIND_RIDGE:     { x: 0,    z: -200, label: 'Wind Ridge' },
  THE_SUMMIT:     { x: -150, z: -320, label: 'The Summit' },
  COMMUNITY_FARM: { x: -330, z: 60,   label: 'Community Farm' },
  ORCHARD:        { x: -250, z: 200,  label: 'Orchard' },
  RIVER_VALLEY:   { x: 200,  z: 100,  label: 'River Valley' },
  THE_COMMONS:    { x: 50,   z: 50,   label: 'The Commons' },
  CLIFFTOP_PATH:  { x: -250, z: -300, label: 'Clifftop Path' },
  HIDDEN_BEACH:   { x: 300,  z: -350, label: 'Hidden Beach' },
};

// ---------------------------------------------------------------------------
// Walkable island bounds
// ---------------------------------------------------------------------------
export const ISLAND_BOUNDS = {
  minX: -392,
  maxX:  392,
  minZ: -392,
  maxZ:  392,
};

// ---------------------------------------------------------------------------
// Terrain height function
// ---------------------------------------------------------------------------
const ISLAND_RADIUS = 420;

function effectiveRadius(angle) {
  return ISLAND_RADIUS
    + 55 * Math.sin(2 * angle + 0.3)
    + 38 * Math.sin(3 * angle + 1.1)
    + 22 * Math.sin(5 * angle + 2.5)
    + 14 * Math.sin(7 * angle + 0.7)
    +  8 * Math.sin(11 * angle + 1.9);
}

export function getHeight(x, z) {
  const nx = x / 420;
  const nz = z / 420;

  // Base rolling hills
  let h = (
    Math.sin(nx * 2.1) * Math.cos(nz * 1.8) * 12 +
    Math.sin(nx * 4.3 + 1.2) * Math.cos(nz * 3.7) * 6 +
    Math.sin(nx * 8.1) * Math.cos(nz * 7.3) * 3
  );

  // Fade to 0 near edges (beach)
  const dist = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);
  const edgeFade = Math.max(0, 1 - dist / effectiveRadius(angle));
  const fade = Math.min(1, edgeFade * 3); // sharper transition
  h *= fade;

  // Flatten the dock area (near water level)
  const dockDist = Math.sqrt(x * x + (z - 355) * (z - 355));
  if (dockDist < 55) {
    const dockFade = Math.max(0, 1 - dockDist / 55);
    h *= (1 - dockFade * 0.95);
  }

  // Flatten town square area slightly
  const townDist = Math.sqrt(x * x + z * z);
  if (townDist < 30) {
    const townFade = Math.max(0, 1 - townDist / 30);
    h *= (1 - townFade * 0.6);
  }

  // Boost hilltop area
  const hillDist = Math.sqrt((x + 150) * (x + 150) + (z + 270) * (z + 270));
  if (hillDist < 60) {
    const hillBoost = Math.max(0, 1 - hillDist / 60);
    h += hillBoost * 18;
  }

  // Flatten beach south
  const beachDist = Math.sqrt(x * x + (z + 330) * (z + 330));
  if (beachDist < 50) {
    const beachFade = Math.max(0, 1 - beachDist / 50);
    h *= (1 - beachFade * 0.85);
  }

  return Math.max(0, h); // never below sea level
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function cylinder(rTop, rBot, h, color, segs = 8) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat(color));
}

function cone(r, h, color, segs = 8) {
  return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), mat(color));
}

function flatPlane(w, d, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// ---------------------------------------------------------------------------
// Building factory
// ---------------------------------------------------------------------------

function makeBuilding(w, h, d, wallColor, roofColor = C.roof, { solarPanels = false, label = '', signText = '', signBg = 0xfde8c9, signColor = 0x4a2800, hollow = false } = {}) {
  const group = new THREE.Group();

  if (hollow) {
    const wt = 0.4; // wall thickness
    const doorW = Math.min(w * 0.25, 2);
    // Left wall (full depth)
    const lWall = box(wt, h, d + wt, wallColor);
    lWall.position.set(-w/2, h/2, 0);
    group.add(lWall);
    // Right wall
    const rWall = box(wt, h, d + wt, wallColor);
    rWall.position.set(w/2, h/2, 0);
    group.add(rWall);
    // Back wall
    const bkWall = box(w - wt, h, wt, wallColor);
    bkWall.position.set(0, h/2, -d/2);
    group.add(bkWall);
    // Front panels flanking the door gap
    const panelW = (w/2 - doorW/2 - wt);
    const panelCX = doorW/2 + wt/2 + panelW/2;
    const lPanel = box(panelW, h, wt, wallColor);
    lPanel.position.set(-panelCX, h/2, d/2);
    group.add(lPanel);
    const rPanel = box(panelW, h, wt, wallColor);
    rPanel.position.set(panelCX, h/2, d/2);
    group.add(rPanel);
    // Interior floor (slightly raised to avoid z-fighting with terrain)
    const iFloor = box(w - wt*2, 0.2, d - wt*2, 0x9b8060);
    iFloor.position.set(0, 0.1, 0);
    group.add(iFloor);
  } else {
    const walls = box(w, h, d, wallColor);
    walls.position.y = h / 2;
    group.add(walls);
  }

  // Roof — always created so we can hide it when player enters (hollow buildings store ref)
  const roofH = h * 0.35;
  const roof = box(w + 1, roofH, d + 1, roofColor);
  roof.position.y = h + roofH / 2 - 0.3;
  group.add(roof);
  group.userData.roofMesh = roof; // toggled visible/invisible by interior zone system

  const doorW = Math.min(w * 0.25, 2);
  const doorH = Math.min(h * 0.5, 3);
  if (hollow) {
    // Wood door frame trim — looks much better than a solid door in the gap
    const fCol = 0x6b4c2a;
    const frameSideL = box(0.22, doorH + 0.3, 0.45, fCol);
    frameSideL.position.set(-doorW / 2 - 0.11, doorH / 2 + 0.15, d / 2);
    group.add(frameSideL);
    const frameSideR = box(0.22, doorH + 0.3, 0.45, fCol);
    frameSideR.position.set( doorW / 2 + 0.11, doorH / 2 + 0.15, d / 2);
    group.add(frameSideR);
    const frameTop = box(doorW + 0.7, 0.35, 0.45, fCol);
    frameTop.position.set(0, doorH + 0.17, d / 2);
    group.add(frameTop);
    const step = box(doorW + 0.5, 0.18, 0.65, fCol);
    step.position.set(0, 0.09, d / 2 + 0.32);
    group.add(step);
  } else {
    const door = box(doorW, doorH, 0.3, C.door);
    door.position.set(0, doorH / 2, d / 2 + 0.15);
    group.add(door);
  }

  if (solarPanels) {
    const panelW = w * 0.4;
    const panelD = d * 0.3;
    for (let i = -1; i <= 1; i += 2) {
      const panel = box(panelW, 0.2, panelD, C.solar);
      panel.position.set(i * w * 0.2, h + roofH + 0.1, 0);
      panel.rotation.x = -0.3;
      const frame = box(panelW + 0.4, 0.1, panelD + 0.4, C.solarFrame);
      frame.position.copy(panel.position);
      frame.position.y -= 0.1;
      frame.rotation.x = -0.3;
      group.add(panel, frame);
    }
  }

  // Wall-mounted sign — flush on the front face, below the roof line
  if (signText) {
    const signW = Math.min(w * 0.72, 5.5);
    const signH = 0.85;
    const signY = h * 0.8; // well above door, safely below roofline
    const signZ = d / 2 + 0.12;

    // Backing board
    const backing = box(signW + 0.3, signH + 0.3, 0.12, signColor);
    backing.position.set(0, signY, signZ - 0.03);
    group.add(backing);

    const board = box(signW, signH, 0.15, signBg);
    board.position.set(0, signY, signZ);
    group.add(board);

    // Canvas text — rendered as a sprite ON the board face
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const r = (signBg >> 16) & 0xff, g = (signBg >> 8) & 0xff, b = signBg & 0xff;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 512, 128);
    const tr = (signColor >> 16) & 0xff, tg = (signColor >> 8) & 0xff, tb = signColor & 0xff;
    ctx.fillStyle = `rgb(${tr},${tg},${tb})`;
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signText, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    // Use a PlaneGeometry (not Sprite) so the sign rotates with the building
    const planeMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), planeMat);
    plane.position.set(0, signY, signZ + 0.09);
    group.add(plane);
  }

  group.userData.label = label;
  return group;
}

// ---------------------------------------------------------------------------
// Tree factory
// ---------------------------------------------------------------------------

function makeTree(height = 6, foliageColor = C.foliage) {
  const group = new THREE.Group();
  const trunkH = height * 0.4;
  const trunk = cylinder(0.3, 0.5, trunkH, C.trunk);
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const crownH = height * 0.65;
  const crown = cone(height * 0.35, crownH, foliageColor, 6);
  crown.position.y = trunkH + crownH / 2 - 0.5;
  group.add(crown);

  const crown2 = cone(height * 0.25, crownH * 0.6, foliageColor, 6);
  crown2.position.y = trunkH + crownH * 0.7;
  group.add(crown2);

  return group;
}

// ---------------------------------------------------------------------------
// Windmill
// ---------------------------------------------------------------------------

function makeWindmill() {
  const group = new THREE.Group();

  const tower = cylinder(1.5, 2.5, 14, C.windmill, 6);
  tower.position.y = 7;
  group.add(tower);

  const hub = cylinder(0.6, 0.6, 1, C.solarFrame, 8);
  hub.position.set(0, 14, 1.8);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  // All blades share one spinner group — rotate the spinner for animation
  const spinner = new THREE.Group();
  spinner.position.set(0, 14, 2.3);
  for (let i = 0; i < 4; i++) {
    const blade = box(1, 7, 0.15, C.blade);
    blade.position.set(0, 3.5, 0);
    const pivot = new THREE.Group();
    pivot.add(blade);
    pivot.rotation.z = (Math.PI / 2) * i;
    spinner.add(pivot);
  }
  group.add(spinner);
  group.userData.spinner = spinner;

  return group;
}

// ---------------------------------------------------------------------------
// Postbox — classic large red British pillar box (Post Office only)
// ---------------------------------------------------------------------------

function makePostbox() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 10), mat(0xcc1111));
  body.position.y = 0.75;
  group.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.55, 0.35, 10), mat(0xaa0000));
  top.position.y = 1.68;
  group.add(top);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.08), mat(0x333333));
  slot.position.set(0, 1.0, 0.48);
  group.add(slot);
  // Royal cipher plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.06), mat(0xbb0000));
  plate.position.set(0, 0.55, 0.5);
  group.add(plate);
  return group;
}

// ---------------------------------------------------------------------------
// Mailbox — small American-style box on a post (residential delivery)
// ---------------------------------------------------------------------------

function makeMailbox() {
  const group = new THREE.Group();

  // Post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), mat(0x888888));
  post.position.y = 0.6;
  group.add(post);

  // Box body — rounded rectangular shape
  const boxBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.9), mat(0x446688));
  boxBody.position.y = 1.38;
  group.add(boxBody);

  // Rounded top (half-cylinder)
  const topGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.55, 8, 1, false, 0, Math.PI);
  const topCap = new THREE.Mesh(topGeo, mat(0x446688));
  topCap.rotation.z = Math.PI / 2;
  topCap.position.set(0, 1.57, 0);
  group.add(topCap);

  // Door flap (front face, slightly darker)
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.04), mat(0x335577));
  flap.position.set(0, 1.38, 0.47);
  group.add(flap);

  // Flag — small red flag on the side
  const flagPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), mat(0x888888));
  flagPost.position.set(0.28, 1.55, 0);
  group.add(flagPost);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.03), mat(0xcc2222));
  flag.position.set(0.38, 1.68, 0);
  group.add(flag);

  return group;
}

// ---------------------------------------------------------------------------
// Dock
// ---------------------------------------------------------------------------

function makeDock() {
  const group = new THREE.Group();

  const platform = box(8, 0.5, 30, C.dock);
  platform.position.set(0, 1.5, 0);
  group.add(platform);

  for (let z = -12; z <= 12; z += 4) {
    for (let x = -3; x <= 3; x += 6) {
      const post = cylinder(0.3, 0.3, 5.5, C.trunk, 6);
      post.position.set(x, -1, z);
      group.add(post);
    }
  }

  for (let z = -10; z <= 10; z += 5) {
    const bollard = cylinder(0.3, 0.4, 1.2, C.solarFrame, 8);
    bollard.position.set(4.5, 2.0, z);
    group.add(bollard);
  }

  return group;
}

// ---------------------------------------------------------------------------
// Boat
// ---------------------------------------------------------------------------

function makeBoat(size = 1) {
  const group = new THREE.Group();
  const hull = box(3 * size, 1.2 * size, 7 * size, C.boatHull);
  hull.position.y = 0.6 * size;
  group.add(hull);
  const trim = box(3.2 * size, 0.3 * size, 7.2 * size, C.boat);
  trim.position.y = 1.1 * size;
  group.add(trim);
  const mast = cylinder(0.15, 0.15, 5 * size, C.trunk, 6);
  mast.position.set(0, 3.5 * size, 0);
  group.add(mast);
  return group;
}

// ---------------------------------------------------------------------------
// Field / farm
// ---------------------------------------------------------------------------

function makeField(w, d) {
  const group = new THREE.Group();
  const base = flatPlane(w, d, C.field);
  base.position.y = 0.15;
  group.add(base);

  const rows = Math.floor(d / 2);
  for (let i = 0; i < rows; i++) {
    const row = box(w * 0.85, 0.4, 0.6, C.fieldRows);
    row.position.set(0, 0.35, -d / 2 + 1.5 + i * 2);
    group.add(row);
  }

  return group;
}

// ---------------------------------------------------------------------------
// Barn
// ---------------------------------------------------------------------------

function makeBarn() {
  const group = new THREE.Group();

  const walls = box(14, 8, 10, C.barn);
  walls.position.y = 4;
  group.add(walls);

  // Peaked roof
  const roofL = box(8, 0.4, 11, C.barnRoof);
  roofL.position.set(-2.5, 8.5, 0);
  roofL.rotation.z = 0.4;
  group.add(roofL);

  const roofR = box(8, 0.4, 11, C.barnRoof);
  roofR.position.set(2.5, 8.5, 0);
  roofR.rotation.z = -0.4;
  group.add(roofR);

  // Barn door
  const barnDoor = box(4, 5, 0.3, C.door);
  barnDoor.position.set(0, 2.5, 5.15);
  group.add(barnDoor);

  group.userData.label = 'Barn';
  return group;
}

// ---------------------------------------------------------------------------
// Mill — stone grinding mill with rotating windmill sails (CAD-365)
// ---------------------------------------------------------------------------

export let millSails = null; // exported so main loop can rotate it each frame

function buildMill() {
  const group = new THREE.Group();

  // Stone base — slightly wider than tall, grey-tan
  const base = box(6, 5, 6, 0xb0a090);
  base.position.y = 2.5;
  group.add(base);

  // Second stone tier — narrower
  const mid = box(5, 3, 5, 0xa09080);
  mid.position.y = 6.5;
  group.add(mid);

  // Conical/pyramid roof — dark brown
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
  const roofGeo = new THREE.ConeGeometry(3.8, 3.5, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 9.75;
  roof.rotation.y = Math.PI / 4; // align to box
  group.add(roof);

  // Door
  const door = box(1.4, 2.4, 0.3, C.door);
  door.position.set(0, 1.2, 3.15);
  group.add(door);

  // Window — small square
  const win = box(1.0, 1.0, 0.3, 0x7fb3d3);
  win.position.set(0, 5.0, 3.15);
  group.add(win);

  // Millstone wheel visible at the side — flattened torus
  const stoneGeo = new THREE.TorusGeometry(1.4, 0.35, 6, 14);
  const stoneMesh = new THREE.Mesh(stoneGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
  stoneMesh.position.set(3.4, 1.5, 0);
  stoneMesh.rotation.y = Math.PI / 2;
  group.add(stoneMesh);

  // Windmill sails — 4 rectangular blades on a central axle
  const sailHub = cylinder(0.25, 0.25, 0.5, 0x9e8a6e, 8);
  sailHub.position.set(0, 7.5, 3.4);
  sailHub.rotation.x = Math.PI / 2;
  group.add(sailHub);

  const spinner = new THREE.Group();
  spinner.position.set(0, 7.5, 3.8);
  for (let i = 0; i < 4; i++) {
    const sail = box(0.7, 5, 0.12, 0xd4b896);
    sail.position.set(0, 2.5, 0);
    const pivot = new THREE.Group();
    pivot.add(sail);
    pivot.rotation.z = (Math.PI / 2) * i;
    spinner.add(pivot);
  }
  group.add(spinner);
  group.userData.spinner = spinner;
  millSails = spinner; // export ref for animation loop

  // Sign: "The Mill"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256; signCanvas.height = 64;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = '#fde8c9';
  sctx.fillRect(0, 0, 256, 64);
  sctx.fillStyle = '#4a2800';
  sctx.font = 'bold 28px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('The Mill', 128, 32);
  const signPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.6),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(signCanvas), transparent: true })
  );
  signPlane.position.set(0, 3.8, 3.18);
  group.add(signPlane);

  group.userData.label = 'The Mill';
  return group;
}

// ---------------------------------------------------------------------------
// Delivery van — small wooden van mesh (moves with Felix NPC)  (CAD-365)
// ---------------------------------------------------------------------------

export let deliveryVanMesh = null; // exported; position is set by Felix each frame

export function buildDeliveryVan(scene) {
  const group = new THREE.Group();

  // Van body
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xc8a85e }); // warm wood-tan
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 3.2), bodyMat);
  body.position.y = 1.1;
  group.add(body);

  // Cab (front section, slightly darker)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.4),
    new THREE.MeshLambertMaterial({ color: 0xb09040 }));
  cab.position.set(0, 1.9, -1.6);
  group.add(cab);

  // Windscreen
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x7fb3d3, transparent: true, opacity: 0.6 }));
  glass.position.set(0, 1.9, -2.28);
  group.add(glass);

  // Wheels (4)
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const hubMat   = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
  for (const [wx, wz] of [[-1.1, 0.9], [1.1, 0.9], [-1.1, -0.9], [1.1, -0.9]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 8), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.38, wz);
    group.add(w);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.30, 6), hubMat);
    h.rotation.z = Math.PI / 2;
    h.position.set(wx, 0.38, wz);
    group.add(h);
  }

  group.visible = true;
  scene.add(group);
  deliveryVanMesh = group;
  return group;
}

// ---------------------------------------------------------------------------
// Fence
// ---------------------------------------------------------------------------

function makeFence(length, posts = 6) {
  const group = new THREE.Group();
  const spacing = length / (posts - 1);
  for (let i = 0; i < posts; i++) {
    const post = cylinder(0.15, 0.15, 1.5, C.fence, 4);
    post.position.set(i * spacing - length / 2, 0.75, 0);
    group.add(post);
  }
  // Rails
  const rail1 = box(length, 0.1, 0.1, C.fence);
  rail1.position.set(0, 0.5, 0);
  group.add(rail1);
  const rail2 = box(length, 0.1, 0.1, C.fence);
  rail2.position.set(0, 1.0, 0);
  group.add(rail2);
  return group;
}

// ---------------------------------------------------------------------------
// Bike rack
// ---------------------------------------------------------------------------

function makeBikeRack() {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const frame = box(0.1, 1, 1.5, C.solarFrame);
    frame.position.set(i * 1.2, 0.5, 0);
    group.add(frame);
  }
  const bar = box(3.5, 0.15, 0.15, C.solarFrame);
  bar.position.set(1.2, 0.08, 0);
  group.add(bar);
  return group;
}

// ---------------------------------------------------------------------------
// Garden patch
// ---------------------------------------------------------------------------

function makeGarden(size = 4) {
  const group = new THREE.Group();
  const colors = [0xe17055, 0xfdcb6e, 0xa29bfe, 0x55efc4, 0xfab1a0];
  const half = size / 2;
  for (let x = -half; x <= half; x += 1.2) {
    for (let z = -half; z <= half; z += 1.2) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 6, 5),
        mat(colors[Math.floor(Math.random() * colors.length)])
      );
      bush.position.set(x + Math.random() * 0.4, 0.4, z + Math.random() * 0.4);
      group.add(bush);
    }
  }
  return group;
}

// ---------------------------------------------------------------------------
// Bench
// ---------------------------------------------------------------------------

function makeBench() {
  const group = new THREE.Group();
  const seat = box(3, 0.2, 1, C.dock);
  seat.position.y = 0.8;
  group.add(seat);
  const leg1 = box(0.2, 0.8, 0.2, C.trunk);
  leg1.position.set(-1.2, 0.4, 0);
  group.add(leg1);
  const leg2 = box(0.2, 0.8, 0.2, C.trunk);
  leg2.position.set(1.2, 0.4, 0);
  group.add(leg2);
  return group;
}

// ---------------------------------------------------------------------------
// Café table — round pedestal with 2 chairs
// ---------------------------------------------------------------------------

function makeCafeTable() {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 10), mat(0xd4a870));
  top.position.y = 1.05;
  group.add(top);
  const leg = cylinder(0.07, 0.1, 1.0, C.trunk, 6);
  leg.position.y = 0.5;
  group.add(leg);
  for (let i = 0; i < 2; i++) {
    const a = (i / 2) * Math.PI * 2;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), mat(0xa87050));
    seat.position.set(Math.cos(a) * 1.0, 0.75, Math.sin(a) * 1.0);
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.07), mat(0xa87050));
    back.position.set(Math.cos(a) * 1.25, 1.15, Math.sin(a) * 1.25);
    back.rotation.y = a;
    group.add(back);
  }
  return group;
}

// ---------------------------------------------------------------------------
// Home nameplate — short post with a painted name plaque
// ---------------------------------------------------------------------------

function makeHomePlaque(name) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 5), mat(C.fence));
  post.position.y = 0.45;
  group.add(post);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fde8c9';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 60);
  ctx.fillStyle = '#4a2800';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🏠 ${name}`, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const planeMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), planeMat);
  plane.position.y = 1.02;
  group.add(plane);
  return group;
}

// ---------------------------------------------------------------------------
// Cloud system — drifting fluffy puffs (adapted from Laila's World)
// ---------------------------------------------------------------------------

function buildClouds(scene) {
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const cloudList = [];
  for (let i = 0; i < 22; i++) {
    const group = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 5);
    const scaleX = 0.7 + Math.random() * 1.4;
    const scaleZ = 0.5 + Math.random() * 0.8;
    for (let j = 0; j < puffs; j++) {
      const r = 7 + Math.random() * 12;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), cloudMat);
      mesh.position.set(
        j === 0 ? 0 : (Math.random() - 0.5) * 32 * scaleX,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 14 * scaleZ,
      );
      group.add(mesh);
    }
    group.position.set(
      (Math.random() - 0.5) * 700,
      90 + Math.random() * 45,
      (Math.random() - 0.5) * 700,
    );
    const speed = 4 + Math.random() * 7;
    const angle = (Math.random() - 0.5) * 0.6;
    group.userData.vx = Math.cos(angle) * speed;
    group.userData.vz = Math.sin(angle) * speed;
    scene.add(group);
    cloudList.push(group);
  }
  return cloudList;
}

// ---------------------------------------------------------------------------
// Sun disc — warm glowing orb (adapted from Laila's World)
// ---------------------------------------------------------------------------

function makeSunDisc(scene) {
  const group = new THREE.Group();
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xfff8b0,
    fog: false,
    depthTest: false,
    depthWrite: false,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffcc44,
    transparent: true,
    opacity: 0.22,
    fog: false,
    depthTest: false,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), coreMat);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12), glowMat);
  group.add(core, glow);
  group.position.set(280, 270, 200); // matches sunLight direction
  group.renderOrder = -1;
  scene.add(group);
  return group;
}

// ---------------------------------------------------------------------------
// Elliot's Aquarium — blue-glass building with fish tanks and a small pond
// ---------------------------------------------------------------------------

function makeAquarium() {
  const group = new THREE.Group();
  const AW = 20, AH = 9, AD = 15;
  const T = 0.5;   // wall/pillar thickness
  const PW = 1.4;  // corner pillar width
  const SILL = 1.6; // height of solid base below glass
  const HEAD = 1.4; // height of solid header above glass
  const GH = AH - SILL - HEAD; // glass panel height

  const solidMat  = new THREE.MeshLambertMaterial({ color: 0x1565c0 });
  const glassMat  = new THREE.MeshLambertMaterial({
    color: 0x4dd0e1, transparent: true, opacity: 0.28,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const roofMat   = new THREE.MeshLambertMaterial({ color: 0x0097a7 });
  const floorMat  = new THREE.MeshLambertMaterial({ color: 0x1a3a5c });

  // Floor slab
  const floor = new THREE.Mesh(new THREE.BoxGeometry(AW, 0.35, AD), floorMat);
  floor.position.y = 0.17;
  group.add(floor);

  // 4 corner pillars — full height
  for (const [sx, sz] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(PW, AH, PW), solidMat);
    pillar.position.set(sx * (AW/2 - PW/2), AH/2, sz * (AD/2 - PW/2));
    group.add(pillar);
  }

  // Helper — build one glass wall with solid sill + header + glass panel(s)
  function addGlassWall(isXAxis, sign, wallSpan, wallZ, doorCutout = false) {
    const halfSpan = wallSpan / 2;
    // Sill (solid base strip)
    const sillGeo = isXAxis
      ? new THREE.BoxGeometry(T, SILL, wallSpan - 2*PW)
      : new THREE.BoxGeometry(wallSpan - 2*PW, SILL, T);
    const sillMesh = new THREE.Mesh(sillGeo, solidMat);
    sillMesh.position.set(isXAxis ? sign*(AW/2) : 0, SILL/2, isXAxis ? 0 : sign*(AD/2));
    group.add(sillMesh);

    // Header (solid top strip)
    const headGeo = isXAxis
      ? new THREE.BoxGeometry(T, HEAD, wallSpan - 2*PW)
      : new THREE.BoxGeometry(wallSpan - 2*PW, HEAD, T);
    const headMesh = new THREE.Mesh(headGeo, solidMat);
    headMesh.position.set(isXAxis ? sign*(AW/2) : 0, AH - HEAD/2, isXAxis ? 0 : sign*(AD/2));
    group.add(headMesh);

    if (doorCutout) {
      // Front wall: two glass panels flanking central door gap (3.5 wide)
      const doorW  = 3.5;
      const panelW = (wallSpan - 2*PW - doorW) / 2;
      const offsets = [-(doorW/2 + panelW/2), (doorW/2 + panelW/2)];
      offsets.forEach(ox => {
        const g = new THREE.Mesh(new THREE.BoxGeometry(panelW, GH, T*0.25), glassMat);
        g.position.set(ox, SILL + GH/2, sign*(AD/2));
        group.add(g);
      });
      // Solid door frame pillars
      for (const dx of [-doorW/2, doorW/2]) {
        const dp = new THREE.Mesh(new THREE.BoxGeometry(0.3, AH, T), solidMat);
        dp.position.set(dx, AH/2, sign*(AD/2));
        group.add(dp);
      }
    } else {
      // Full glass panel
      const glassGeo = isXAxis
        ? new THREE.BoxGeometry(T*0.25, GH, wallSpan - 2*PW)
        : new THREE.BoxGeometry(wallSpan - 2*PW, GH, T*0.25);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(isXAxis ? sign*(AW/2) : 0, SILL + GH/2, isXAxis ? 0 : sign*(AD/2));
      group.add(glassMesh);
    }
  }

  // Left wall (local -x)
  addGlassWall(true, -1, AD, 0);
  // Right wall (local +x)
  addGlassWall(true,  1, AD, 0);
  // Back wall (local -z)
  addGlassWall(false, -1, AW, 0);
  // Front wall (local +z) — with door cutout
  addGlassWall(false,  1, AW, 0, true);

  // Roof
  const roofH = AH * 0.25;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(AW + 1.4, roofH, AD + 1.4), roofMat);
  roof.position.y = AH + roofH/2 - 0.2;
  group.add(roof);
  // White ridge strip
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(AW + 1.6, 0.22, 1.0),
    new THREE.MeshLambertMaterial({ color: 0xffffff }));
  ridge.position.y = AH + roofH - 0.06;
  group.add(ridge);

  // ── Animated Fish ─────────────────────────────────────────────────────
  // Each fish is a Group (body + tail children) so they can be moved as one.
  // Positions are in aquarium local space.  rangeX/Y/Z control orbit size.
  // [homeX, homeY, homeZ, color, rangeX, rangeY, rangeZ, speed, phase]
  const fishData = [
    [-5,  3.5,  3,  0xff6b6b, 2.5, 0.6, 2.0, 0.80, 0.0],
    [-5,  5.0, -2,  0xffd93d, 2.0, 0.5, 2.5, 0.60, 1.0],
    [-6,  4.0,  0,  0x4d96ff, 3.0, 0.8, 1.5, 0.90, 2.1],
    [-5,  6.2,  2,  0xf97316, 1.5, 0.4, 2.0, 0.70, 3.5],
    [-5,  3.0, -4,  0xa855f7, 2.5, 0.7, 1.8, 1.10, 0.8],
    [ 5,  3.5, -3,  0x6bcb77, 2.0, 0.6, 2.2, 0.80, 4.2],
    [ 5,  5.0,  3,  0xec4899, 2.5, 0.5, 2.0, 0.70, 1.5],
    [ 6,  3.0,  0,  0x06b6d4, 2.0, 0.8, 2.5, 1.00, 2.8],
    [ 5,  6.0, -1,  0xff6b6b, 1.8, 0.4, 1.5, 0.60, 5.0],
    [ 5,  4.0,  4,  0xffd93d, 2.2, 0.7, 2.0, 0.90, 3.2],
    [ 0,  3.5, -4,  0x4d96ff, 2.0, 0.6, 1.5, 0.80, 1.8],
    [-2,  6.0,  3,  0xf97316, 1.5, 0.5, 2.0, 0.60, 0.5],
    [ 2,  4.5,  5,  0x6bcb77, 2.0, 0.6, 1.5, 0.70, 4.0],
    [-6,  3.5, -5,  0x26c6da, 1.8, 0.5, 1.5, 0.80, 2.5],
    [ 6,  5.5,  5,  0xff8a65, 2.2, 0.7, 1.8, 0.90, 1.2],
  ];
  const fishList = [];
  fishData.forEach(([hx, hy, hz, col, rX, rY, rZ, spd, phase]) => {
    const fm = new THREE.MeshLambertMaterial({ color: col });
    const fishGroup = new THREE.Group();
    fishGroup.position.set(hx, hy, hz);

    // Body — elongated along local +z (the facing direction)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 7, 5), fm);
    body.scale.set(1.0, 0.7, 2.0);
    fishGroup.add(body);

    // Tail — cone in local -z (behind body), flat end at body
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.38, 4), fm);
    tail.rotation.x = -Math.PI / 2; // tip points -z away from body
    tail.position.set(0, 0, -0.62);
    fishGroup.add(tail);

    fishGroup.userData = { hx, hy, hz, rX, rY, rZ, spd, phase, t: phase, tail };
    group.add(fishGroup);
    fishList.push(fishGroup);
  });
  group.userData.fish = fishList;

  // Door — teal panel at front gap
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x004d5e });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.18), doorMat);
  door.position.set(0, 2.1, AD/2 + 0.08);
  group.add(door);

  // Door arch
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.22, 6, 12, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0x0097a7 })
  );
  arch.rotation.z = Math.PI;
  arch.position.set(0, 4.3, AD/2 + 0.08);
  group.add(arch);

  // Sign above door
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512; signCanvas.height = 96;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = '#002533';
  sctx.fillRect(0, 0, 512, 96);
  sctx.font = 'bold 38px sans-serif';
  sctx.fillStyle = '#4dd0e1';
  sctx.textAlign = 'center';
  sctx.fillText("🐟  Elliot's Aquarium", 256, 62);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 1.4),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(signCanvas), transparent: true })
  );
  signMesh.position.set(0, AH - HEAD/2, AD/2 + 0.35);
  signMesh.renderOrder = 1;
  group.add(signMesh);

  // Interior lighting — blue-tinted warm glow
  const aquaLight = new THREE.PointLight(0x4dd0e1, 1.4, 26);
  aquaLight.position.set(0, 6, 0);
  group.add(aquaLight);

  group.userData.label = "Elliot's Aquarium";
  return group;
}

// ---------------------------------------------------------------------------
// Campfire — stone ring, crossed logs, animated flame cones + warm light
// ---------------------------------------------------------------------------

function makeCampfire() {
  const group = new THREE.Group();

  // Stone ring
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.SphereGeometry(0.28, 5, 4), stoneMat);
    stone.position.set(Math.cos(angle) * 0.95, 0.18, Math.sin(angle) * 0.95);
    stone.scale.set(1.3, 0.65, 0.9);
    group.add(stone);
  }

  // Crossed logs
  const logMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
  [-0.45, 0.45].forEach(ry => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 2.6, 6), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = ry;
    log.position.y = 0.16;
    group.add(log);
  });

  // Flame group (animated via userData.flames)
  const flames = new THREE.Group();
  flames.position.y = 0.35;
  // Outer base — red
  const flameBase = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 8), new THREE.MeshBasicMaterial({ color: 0xcc2200 }));
  flameBase.position.set(0, 0.27, 0); flames.add(flameBase);
  // Mid — orange
  const flameMid = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.0, 8), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
  flameMid.position.set(0, 0.5, 0); flames.add(flameMid);
  // Tip — yellow
  const flameTip = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
  flameTip.position.set(0, 0.7, 0); flames.add(flameTip);
  group.add(flames);
  group.userData.flames = flames;

  // Warm fire light
  const fireLight = new THREE.PointLight(0xff7722, 2.0, 22);
  fireLight.position.y = 1.5;
  group.add(fireLight);
  group.userData.fireLight = fireLight;

  return group;
}

// ---------------------------------------------------------------------------
// Open garage — 3-wall corrugated shed, open front, truck + workbench inside
// ---------------------------------------------------------------------------

function makeOpenGarage() {
  const GW = 18, GH = 7, GD = 16;
  const T = 0.5;
  const group = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x7d8fa0, side: THREE.DoubleSide });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x5a6e7d });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
  const postMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 });

  // Concrete floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.06;
  group.add(floor);

  // Left wall
  const gWallL = new THREE.Mesh(new THREE.BoxGeometry(T, GH, GD), wallMat);
  gWallL.position.set(-GW/2, GH/2, 0); group.add(gWallL);
  // Right wall
  const gWallR = new THREE.Mesh(new THREE.BoxGeometry(T, GH, GD), wallMat);
  gWallR.position.set(GW/2, GH/2, 0); group.add(gWallR);
  // Back wall
  const gWallB = new THREE.Mesh(new THREE.BoxGeometry(GW + T, GH, T), wallMat);
  gWallB.position.set(0, GH/2, GD/2); group.add(gWallB);

  // Roof (with front overhang)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(GW + 1.5, 0.55, GD + 3.5), roofMat);
  roof.position.set(0, GH + 0.27, -0.8);
  group.add(roof);

  // Front support posts
  [-GW/2 + 0.5, GW/2 - 0.5].forEach(px => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, GH, 0.45), postMat);
    post.position.set(px, GH/2, -GD/2);
    group.add(post);
  });

  // Workbench along back wall
  const benchMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(GW - 3, 0.14, 2.0), benchMat);
  bench.position.set(0, 4.2, GD/2 - 1.5);
  group.add(bench);
  // Bench legs
  for (const bx of [-GW/2 + 2.5, GW/2 - 2.5]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.2, 0.18), benchMat);
    leg.position.set(bx, 2.1, GD/2 - 1.5);
    group.add(leg);
  }

  // Tool rack — hooks on back wall
  const hookMat = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
  for (let i = -3; i <= 3; i++) {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 5), hookMat);
    hook.rotation.z = Math.PI / 2;
    hook.position.set(i * 1.9, 5.8, GD/2 - 0.5);
    group.add(hook);
  }

  // Oil drums in right corner
  const drumMat = new THREE.MeshLambertMaterial({ color: 0x2c5282 });
  [[GW/2 - 1.5, GD/2 - 2.2], [GW/2 - 3.5, GD/2 - 2.2]].forEach(([dx, dz]) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.1, 8), drumMat);
    drum.position.set(dx, 1.05, dz);
    group.add(drum);
  });

  // Red pickup truck (body + cab + wheels)
  const truckBodyMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
  const truckBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.0, 8.0), truckBodyMat);
  truckBody.position.set(-4.5, 1.85, 1.5);
  group.add(truckBody);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 4.2),
    new THREE.MeshLambertMaterial({ color: 0xa93226 }));
  cab.position.set(-4.5, 3.5, -2.0);
  group.add(cab);
  // Windscreen tint
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.6, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x7fb3d3, transparent: true, opacity: 0.6 }));
  glass.position.set(-4.5, 3.5, -4.05);
  group.add(glass);
  // Wheels
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const hubMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
  [[-1.8, 0.5], [1.8, 0.5], [-1.8, -5.5], [1.8, -5.5]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.65, 10), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-4.5 + wx, 0.9, 1.5 + wz);
    group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.68, 6), hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(-4.5 + wx, 0.9, 1.5 + wz);
    group.add(hub);
  });

  // "GARAGE" sign spanning the open front entrance
  const sc = document.createElement('canvas');
  sc.width = 512; sc.height = 80;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#2d3748';
  sctx.fillRect(0, 0, 512, 80);
  sctx.fillStyle = '#fbbf24';
  sctx.font = 'bold 52px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('🔧 GARAGE', 256, 40);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1.1),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, side: THREE.DoubleSide })
  );
  signMesh.position.set(0, GH - 0.55, -GD/2 - 0.05);
  signMesh.scale.x = -1; // flip so canvas text reads correctly from outside
  group.add(signMesh);

  group.userData.roofMesh = roof;
  group.userData.label = 'Garage';
  return group;
}

// ---------------------------------------------------------------------------
// Explorable library — hollow building with door gap, rich interior
// Door is on the -z face so after rotation y=1.1 it faces the town path
// ---------------------------------------------------------------------------

function makeLibraryBuilding() {
  const LW = 28, LH = 10, LD = 24;
  const DOOR_W = 5, DOOR_H = 4.8;
  const T = 0.5;
  const group = new THREE.Group();

  const wallMat  = new THREE.MeshLambertMaterial({ color: C.library, side: THREE.DoubleSide });
  const roofMat  = new THREE.MeshLambertMaterial({ color: C.roofDark });
  const shelfMat = new THREE.MeshLambertMaterial({ color: 0x7b4d2a });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xc09060 });
  const deskMat  = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x6b3d1a });
  const bookCols = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
                    0x1abc9c, 0xe67e22, 0x2c3e50, 0xc0392b, 0x27ae60,
                    0xd35400, 0x2980b9, 0x8e44ad, 0x16a085];

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LW - T, LD - T), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.06;
  group.add(floor);

  // ── Walls (DoubleSide so inside faces are visible) ──
  // Left wall (-x)
  const lWallL = new THREE.Mesh(new THREE.BoxGeometry(T, LH, LD), wallMat);
  lWallL.position.set(-LW/2, LH/2, 0); group.add(lWallL);
  // Right wall (+x)
  const lWallR = new THREE.Mesh(new THREE.BoxGeometry(T, LH, LD), wallMat);
  lWallR.position.set(LW/2, LH/2, 0); group.add(lWallR);
  // Back wall (+z face, solid — window decor only)
  const lWallB = new THREE.Mesh(new THREE.BoxGeometry(LW + T, LH, T), wallMat);
  lWallB.position.set(0, LH/2, LD/2); group.add(lWallB);
  // Front wall (-z face) — TWO panels flanking door + lintel
  const sideW = (LW - DOOR_W) / 2;
  [-1, 1].forEach(side => {
    const fw = new THREE.Mesh(new THREE.BoxGeometry(sideW, LH, T), wallMat);
    fw.position.set(side * (DOOR_W/2 + sideW/2), LH/2, -LD/2);
    group.add(fw);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + T, LH - DOOR_H, T), wallMat);
  lintel.position.set(0, DOOR_H + (LH - DOOR_H)/2, -LD/2);
  group.add(lintel);

  // Door frame (wood trim)
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.5, 0.3, 0.7), frameMat);
  fTop.position.set(0, DOOR_H + 0.15, -LD/2);
  group.add(fTop);
  [-DOOR_W/2 - 0.2, DOOR_W/2 + 0.2].forEach(fx => {
    const fSide = new THREE.Mesh(new THREE.BoxGeometry(0.3, DOOR_H, 0.7), frameMat);
    fSide.position.set(fx, DOOR_H/2, -LD/2);
    group.add(fSide);
  });

  // Roof (flat with slight overhang)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(LW + 2, 1.0, LD + 2), roofMat);
  roof.position.set(0, LH + 0.5, 0);
  group.add(roof);
  group.userData.roofMesh = roof; // hidden when player is inside

  // Exterior sign above door (outside the -z face)
  const sc = document.createElement('canvas');
  sc.width = 640; sc.height = 96;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#a29bfe';
  sctx.fillRect(0, 0, 640, 96);
  sctx.fillStyle = '#ffffff';
  sctx.font = 'bold 58px serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('📚  LIBRARY', 320, 48);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1.05),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, side: THREE.BackSide })
  );
  signMesh.position.set(0, LH - 0.9, -LD/2 - 0.12);
  group.add(signMesh);

  // ── Interior ──

  // Checkout desk near entrance (-z side)
  const deskBase = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 2.2), deskMat);
  deskBase.position.set(0, 1.7, -LD/2 + 5);
  group.add(deskBase);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.2, 2.5), new THREE.MeshLambertMaterial({ color: 0x9b6a3d }));
  deskTop.position.set(0, 3.5, -LD/2 + 5);
  group.add(deskTop);

  // Back wall bookshelves (at +z)
  for (let sx = -10; sx <= 10; sx += 5) {
    const ws = new THREE.Mesh(new THREE.BoxGeometry(4.6, 7.5, 0.6), shelfMat);
    ws.position.set(sx, 4.5, LD/2 - 1);
    group.add(ws);
    for (let b = 0; b < 10; b++) {
      const bk = new THREE.Mesh(
        new THREE.BoxGeometry(0.33, 5.8, 0.5),
        new THREE.MeshLambertMaterial({ color: bookCols[(b + sx + 14) % bookCols.length] })
      );
      bk.position.set(sx - 2.0 + b * 0.44, 4.5, LD/2 - 0.75);
      group.add(bk);
    }
  }

  // Left wall shelves
  for (let sz = -7; sz <= 6; sz += 3.5) {
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 3.2), shelfMat);
    ws.position.set(-LW/2 + 1, 4, sz);
    group.add(ws);
    for (let b = 0; b < 6; b++) {
      const bk = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 4.5, 0.5),
        new THREE.MeshLambertMaterial({ color: bookCols[Math.abs(Math.floor(b + sz + 20)) % bookCols.length] })
      );
      bk.position.set(-LW/2 + 0.9, 4, sz - 1.4 + b * 0.55);
      group.add(bk);
    }
  }

  // Right wall shelves
  for (let sz = -7; sz <= 6; sz += 3.5) {
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 3.2), shelfMat);
    ws.position.set(LW/2 - 1, 4, sz);
    group.add(ws);
    for (let b = 0; b < 6; b++) {
      const bk = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 4.5, 0.5),
        new THREE.MeshLambertMaterial({ color: bookCols[Math.abs(Math.floor(b + sz + 7)) % bookCols.length] })
      );
      bk.position.set(LW/2 - 0.9, 4, sz - 1.4 + b * 0.55);
      group.add(bk);
    }
  }

  // Free-standing shelf stacks creating aisles (back half)
  for (const sz of [2, 6]) {
    for (let sx = -9; sx <= 9; sx += 4.5) {
      const stack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7, 3.8), shelfMat);
      stack.position.set(sx, 4, sz);
      group.add(stack);
      for (let b = 0; b < 8; b++) {
        const bc = bookCols[(b + sx * 2 + sz + 25) % bookCols.length];
        for (const face of [-0.27, 0.27]) {
          const bk = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 5, 0.45),
            new THREE.MeshLambertMaterial({ color: bc })
          );
          bk.position.set(sx + face, 4.2, sz + (b - 3.5) * 0.5);
          group.add(bk);
        }
      }
    }
  }

  // Reading tables (middle section)
  const tblMat2 = new THREE.MeshLambertMaterial({ color: 0xc8a870 });
  const seatMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });
  for (const [tx, tz] of [[-6, -2], [6, -2]]) {
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.14, 2.5), tblMat2);
    tbl.position.set(tx, 3.5, tz);
    group.add(tbl);
    // Table legs
    for (const [lx, lz] of [[-2.3,-1],[2.3,-1],[-2.3,1],[2.3,1]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), shelfMat);
      leg.position.set(tx + lx, 1.75, tz + lz);
      group.add(leg);
    }
    // Chairs
    for (const [cx, cz, ry] of [[-3,0,Math.PI/2],[3,0,-Math.PI/2],[0,-1.6,0],[0,1.6,Math.PI]]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.85), seatMat);
      seat.position.set(tx + cx, 2.85, tz + cz);
      group.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.1), seatMat);
      back.position.set(tx + cx * 1.2, 3.3, tz + cz * 1.25);
      back.rotation.y = ry;
      group.add(back);
    }
  }

  // Cosy armchair in back-right corner
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x8e44ad });
  const armBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), chairMat);
  armBody.position.set(LW/2 - 3.5, 1.4, LD/2 - 4.5);
  group.add(armBody);
  const armBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.45), new THREE.MeshLambertMaterial({ color: 0x9b59b6 }));
  armBack.position.set(LW/2 - 3.5, 2.5, LD/2 - 3.3);
  group.add(armBack);
  [-1.0, 1.0].forEach(ax => {
    const ar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 2.2), new THREE.MeshLambertMaterial({ color: 0x9b59b6 }));
    ar.position.set(LW/2 - 3.5 + ax, 2.25, LD/2 - 4.5);
    group.add(ar);
  });
  // Side table by armchair
  const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 10), tblMat2);
  sideTable.position.set(LW/2 - 1.5, 3.0, LD/2 - 4.5);
  group.add(sideTable);

  // Floor lamps (warm pools of light)
  [[-LW/4, -3], [LW/4, -3], [0, 4]].forEach(([lx, lz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.2, 6), new THREE.MeshLambertMaterial({ color: 0x999999 }));
    post.position.set(lx, 3.2, lz);
    group.add(post);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.3, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff8d0, side: THREE.BackSide }));
    shade.position.set(lx, 6.5, lz);
    group.add(shade);
    const pl = new THREE.PointLight(0xfff8d0, 1.1, 26);
    pl.position.set(lx, 7, lz);
    group.add(pl);
  });

  group.userData.label = 'Library';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-153: Cycle Shop — green/teal building, bike racks, repair stand
// ---------------------------------------------------------------------------

function makeCycleShop() {
  const group = new THREE.Group();
  const CW = 10, CH = 6, CD = 8;

  const walls = box(CW, CH, CD, C.cycleShop);
  walls.position.y = CH / 2;
  group.add(walls);

  const roofH = CH * 0.3;
  const roof = box(CW + 1, roofH, CD + 1, 0x1a7a6e);
  roof.position.y = CH + roofH / 2 - 0.2;
  group.add(roof);

  const door = box(1.8, 2.6, 0.3, C.door);
  door.position.set(0, 1.3, CD / 2 + 0.15);
  group.add(door);

  const sc = document.createElement('canvas');
  sc.width = 512; sc.height = 96;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#1a7a6e';
  sctx.fillRect(0, 0, 512, 96);
  sctx.fillStyle = '#ffffff';
  sctx.font = 'bold 46px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('🚲 Cycle Shop', 256, 48);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.1),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc), transparent: true })
  );
  signMesh.position.set(0, CH * 0.8, CD / 2 + 0.18);
  group.add(signMesh);

  for (let i = 0; i < 3; i++) {
    const post1 = cylinder(0.08, 0.08, 1.1, C.solarFrame, 6);
    post1.position.set(-2.5 + i * 2.0, 0.55, CD / 2 + 2.0);
    const post2 = cylinder(0.08, 0.08, 1.1, C.solarFrame, 6);
    post2.position.set(-2.5 + i * 2.0 + 0.8, 0.55, CD / 2 + 2.0);
    const bar = box(0.9, 0.1, 0.1, C.solarFrame);
    bar.position.set(-2.5 + i * 2.0 + 0.4, 1.1, CD / 2 + 2.0);
    group.add(post1, post2, bar);
  }

  for (let i = 0; i < 2; i++) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 6, 14), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(-1.5 + i * 2.6, 0.5, CD / 2 + 1.6);
    group.add(wheel);
  }

  const rsPost = cylinder(0.08, 0.08, 1.5, 0x888888, 6);
  rsPost.position.set(-CW / 2 - 1.5, 0.75, 0);
  group.add(rsPost);
  const rsArm = box(0.9, 0.1, 0.1, 0x888888);
  rsArm.position.set(-CW / 2 - 1.05, 1.5, 0);
  group.add(rsArm);

  const hookMat2 = new THREE.MeshLambertMaterial({ color: 0x555555 });
  for (let i = 0; i < 3; i++) {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), hookMat2);
    hook.rotation.z = Math.PI / 2;
    hook.position.set(-CW / 2 - 0.05, 3.0, -1.5 + i * 1.5);
    group.add(hook);
  }

  group.userData.label = 'Cycle Shop';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-152: Sports Courts — flat court surface, net, seating
// ---------------------------------------------------------------------------

function makeSportsCourts() {
  const group = new THREE.Group();

  const court = flatPlane(22, 14, 0x3aad5c);
  court.position.y = 0.06;
  group.add(court);

  const lineCol = 0xffffff;
  const borderN = box(22.2, 0.05, 0.18, lineCol); borderN.position.set(0, 0.07, -7);  group.add(borderN);
  const borderS = box(22.2, 0.05, 0.18, lineCol); borderS.position.set(0, 0.07,  7);  group.add(borderS);
  const borderW = box(0.18, 0.05, 14.2, lineCol); borderW.position.set(-11, 0.07, 0); group.add(borderW);
  const borderE = box(0.18, 0.05, 14.2, lineCol); borderE.position.set( 11, 0.07, 0); group.add(borderE);
  const centreLine = box(0.18, 0.05, 14.2, lineCol); centreLine.position.set(0, 0.07, 0); group.add(centreLine);
  const svc1 = box(11, 0.05, 0.18, lineCol); svc1.position.set(-5.5, 0.07, -3.5); group.add(svc1);
  const svc2 = box(11, 0.05, 0.18, lineCol); svc2.position.set(-5.5, 0.07,  3.5); group.add(svc2);

  const netPostL = cylinder(0.12, 0.12, 1.6, 0xcccccc, 6); netPostL.position.set(-0.1, 0.8, -7.5); group.add(netPostL);
  const netPostR = cylinder(0.12, 0.12, 1.6, 0xcccccc, 6); netPostR.position.set(-0.1, 0.8,  7.5); group.add(netPostR);
  const netMesh = box(0.08, 0.8, 15, 0xffffff);
  netMesh.material = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  netMesh.position.set(-0.1, 1.05, 0);
  group.add(netMesh);

  const bench1 = makeBench();
  bench1.position.set(-14, 0, -2);
  bench1.rotation.y = Math.PI / 2;
  group.add(bench1);
  const bench2 = makeBench();
  bench2.position.set(-14, 0, 2);
  bench2.rotation.y = Math.PI / 2;
  group.add(bench2);

  const signPost = cylinder(0.1, 0.1, 3.0, C.solarFrame, 6);
  signPost.position.set(-12, 1.5, -8);
  group.add(signPost);
  const sc2 = document.createElement('canvas');
  sc2.width = 384; sc2.height = 80;
  const sctx2 = sc2.getContext('2d');
  sctx2.fillStyle = '#3aad5c';
  sctx2.fillRect(0, 0, 384, 80);
  sctx2.fillStyle = '#ffffff';
  sctx2.font = 'bold 38px sans-serif';
  sctx2.textAlign = 'center';
  sctx2.textBaseline = 'middle';
  sctx2.fillText('🎾 Sports Courts', 192, 40);
  const signPlaneMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 0.95),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc2), transparent: true })
  );
  signPlaneMesh.position.set(-12, 3.3, -8);
  group.add(signPlaneMesh);

  group.userData.label = 'Sports Courts';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-150: Fitness Center — large windows, exercise equipment, modern look
// ---------------------------------------------------------------------------

function makeFitnessCenter() {
  const group = new THREE.Group();
  const FW = 14, FH = 7, FD = 10;

  const walls = box(FW, FH, FD, C.fitnessCtr);
  walls.position.y = FH / 2;
  group.add(walls);

  const roofH = FH * 0.25;
  const roof = box(FW + 1.2, roofH, FD + 1.2, 0x2d6aaa);
  roof.position.y = FH + roofH / 2 - 0.15;
  group.add(roof);

  const glassMat = new THREE.MeshLambertMaterial({ color: 0x7fb3d3, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  for (const wx of [-3, 3]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(4.5, FH * 0.55, 0.15), glassMat);
    win.position.set(wx, FH * 0.55, FD / 2 + 0.05);
    group.add(win);
  }

  const door = box(2.0, 2.8, 0.3, C.door);
  door.position.set(0, 1.4, FD / 2 + 0.15);
  group.add(door);

  const sc3 = document.createElement('canvas');
  sc3.width = 512; sc3.height = 80;
  const sctx3 = sc3.getContext('2d');
  sctx3.fillStyle = '#2d6aaa';
  sctx3.fillRect(0, 0, 512, 80);
  sctx3.fillStyle = '#ffffff';
  sctx3.font = 'bold 42px sans-serif';
  sctx3.textAlign = 'center';
  sctx3.textBaseline = 'middle';
  sctx3.fillText('💪 Fitness Center', 256, 40);
  const signMesh3 = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 1.0),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc3), transparent: true })
  );
  signMesh3.position.set(0, FH * 0.82, FD / 2 + 0.2);
  group.add(signMesh3);

  for (let i = 0; i < 4; i++) {
    const dbell = box(0.3, 0.18, 0.9, 0x444444);
    dbell.position.set(-FW/2 + 1.5 + i * 1.2, 1.0, -FD/2 + 1.5);
    group.add(dbell);
  }
  const bpBench = box(3.2, 0.22, 0.8, 0x333333);
  bpBench.position.set(FW/2 - 2.5, 0.8, -FD/2 + 2.5);
  group.add(bpBench);
  const bpPost1 = cylinder(0.12, 0.12, 1.8, 0x555555, 6);
  bpPost1.position.set(FW/2 - 3.5, 1.8, -FD/2 + 2.5);
  const bpPost2 = cylinder(0.12, 0.12, 1.8, 0x555555, 6);
  bpPost2.position.set(FW/2 - 1.5, 1.8, -FD/2 + 2.5);
  group.add(bpPost1, bpPost2);
  const bpBar = box(2.5, 0.12, 0.12, 0x888888);
  bpBar.position.set(FW/2 - 2.5, 2.7, -FD/2 + 2.5);
  group.add(bpBar);
  const tread = box(1.5, 0.4, 3.5, 0x222222);
  tread.position.set(0, 0.4, -FD/2 + 2.5);
  group.add(tread);

  group.userData.label = 'Fitness Center';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-151: Science Center — white walls, dome roof, telescope on top
// ---------------------------------------------------------------------------

function makeScienceCenter() {
  const group = new THREE.Group();
  const SW = 13, SH = 8, SD = 11;

  const walls = box(SW, SH, SD, C.scienceCtr);
  walls.position.y = SH / 2;
  group.add(walls);

  const frontRoof = box(SW * 0.55, 0.5, SD, 0xd0d0d0);
  frontRoof.position.set(SW * 0.225, SH + 0.25, 0);
  group.add(frontRoof);

  const domeBase = cylinder(3.5, 3.5, 0.5, 0xe0e0e0, 16);
  domeBase.position.set(-2, SH + 0.25, 0);
  group.add(domeBase);
  const domeMat = new THREE.MeshLambertMaterial({ color: 0xc8d8e8 });
  const domeGeo = new THREE.SphereGeometry(3.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const sciDome = new THREE.Mesh(domeGeo, domeMat);
  sciDome.position.set(-2, SH + 0.5, 0);
  group.add(sciDome);

  const teleBase = cylinder(0.35, 0.4, 0.8, 0x666666, 8);
  teleBase.position.set(-2, SH + 4.3, 0);
  group.add(teleBase);
  const teleScope = cylinder(0.3, 0.28, 2.5, 0x444444, 8);
  teleScope.rotation.z = 0.5;
  teleScope.position.set(-1.4, SH + 5.5, 0);
  group.add(teleScope);
  const teleEye = cylinder(0.28, 0.34, 0.4, 0x555555, 8);
  teleEye.rotation.z = 0.5;
  teleEye.position.set(-0.8, SH + 6.5, 0);
  group.add(teleEye);

  const door = box(1.8, 2.8, 0.3, C.door);
  door.position.set(2.5, 1.4, SD / 2 + 0.15);
  group.add(door);

  const wMatSci = new THREE.MeshLambertMaterial({ color: 0x7fb3d3, transparent: true, opacity: 0.5 });
  for (const wx of [-4, -1, 5]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.0, 0.15), wMatSci);
    win.position.set(wx, SH * 0.55, SD / 2);
    group.add(win);
  }

  const sc4 = document.createElement('canvas');
  sc4.width = 512; sc4.height = 80;
  const sctx4 = sc4.getContext('2d');
  sctx4.fillStyle = '#1a5276';
  sctx4.fillRect(0, 0, 512, 80);
  sctx4.fillStyle = '#ffffff';
  sctx4.font = 'bold 38px sans-serif';
  sctx4.textAlign = 'center';
  sctx4.textBaseline = 'middle';
  sctx4.fillText('🔭 Science Center', 256, 40);
  const signMesh4 = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 1.0),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc4), transparent: true })
  );
  signMesh4.position.set(2.5, SH * 0.82, SD / 2 + 0.2);
  group.add(signMesh4);

  for (let i = 0; i < 2; i++) {
    const labBench = box(5, 0.15, 1.2, 0x2d6a4f);
    labBench.position.set(-2.5 + i * 5, 3.2, -SD/2 + 2.5);
    group.add(labBench);
    for (let j = 0; j < 4; j++) {
      const jar = cylinder(0.15, 0.13, 0.4, 0xaaddff, 8);
      jar.position.set(-4 + i * 5 + j * 0.8, 3.5, -SD/2 + 2.5);
      group.add(jar);
    }
  }

  group.userData.label = 'Science Center';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-139: Fishery — harbour building, fish drying racks, ice chest
// ---------------------------------------------------------------------------

function makeFishery() {
  const group = new THREE.Group();
  const FHW = 12, FHH = 6, FHD = 8;

  const walls = box(FHW, FHH, FHD, C.fishery);
  walls.position.y = FHH / 2;
  group.add(walls);

  for (let i = 0; i < 5; i++) {
    const corrStrip = box(FHW + 1.5, 0.22, FHD / 5, 0x5a6e7d);
    corrStrip.position.set(0, FHH + 0.11, -FHD/2 + i * (FHD/5) + 0.5);
    corrStrip.rotation.x = -0.06;
    group.add(corrStrip);
  }

  const fishDoor = box(2.0, 2.8, 0.3, 0x5a3a1a);
  fishDoor.position.set(0, 1.4, FHD / 2 + 0.15);
  group.add(fishDoor);

  const sc5 = document.createElement('canvas');
  sc5.width = 512; sc5.height = 80;
  const sctx5 = sc5.getContext('2d');
  sctx5.fillStyle = '#2c3e50';
  sctx5.fillRect(0, 0, 512, 80);
  sctx5.fillStyle = '#7fb3d3';
  sctx5.font = 'bold 44px sans-serif';
  sctx5.textAlign = 'center';
  sctx5.textBaseline = 'middle';
  sctx5.fillText('🐟 Fishery', 256, 40);
  const signMesh5 = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 0.9),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc5), transparent: true })
  );
  signMesh5.position.set(0, FHH * 0.82, FHD / 2 + 0.2);
  group.add(signMesh5);

  for (let r = 0; r < 2; r++) {
    const rackPost1 = cylinder(0.1, 0.1, 2.2, C.trunk, 5);
    rackPost1.position.set(-FHW/2 - 2.5, 1.1, -1.5 + r * 3.5);
    const rackPost2 = cylinder(0.1, 0.1, 2.2, C.trunk, 5);
    rackPost2.position.set(-FHW/2 - 0.5, 1.1, -1.5 + r * 3.5);
    const rackBar = box(2.1, 0.1, 0.1, C.trunk);
    rackBar.position.set(-FHW/2 - 1.5, 2.1, -1.5 + r * 3.5);
    group.add(rackPost1, rackPost2, rackBar);
    for (let f = 0; f < 4; f++) {
      const fishShape = box(0.5, 0.18, 0.08, 0xc8a870);
      fishShape.position.set(-FHW/2 - 2.2 + f * 0.55, 1.85 - f * 0.03, -1.5 + r * 3.5 + 0.1);
      fishShape.rotation.z = -0.12;
      group.add(fishShape);
    }
  }

  const iceChest = box(1.5, 0.8, 0.9, 0xddeeff);
  iceChest.position.set(FHW / 2 + 1.2, 0.4, FHD / 2 - 0.5);
  group.add(iceChest);
  const iceLid = box(1.55, 0.12, 0.95, 0xc8e8ff);
  iceLid.position.set(FHW / 2 + 1.2, 0.86, FHD / 2 - 0.5);
  group.add(iceLid);

  const ropeGeo = new THREE.TorusGeometry(0.38, 0.07, 5, 12);
  const ropeM = new THREE.Mesh(ropeGeo, new THREE.MeshLambertMaterial({ color: 0xb89e5c }));
  ropeM.rotation.x = Math.PI / 2;
  ropeM.position.set(-2, 0.1, FHD / 2 + 1.5);
  group.add(ropeM);

  group.userData.label = 'Fishery';
  return group;
}

// ---------------------------------------------------------------------------
// Lighthouse — tower, lantern room, keeper's cottage, light beam
// ---------------------------------------------------------------------------

function makeLighthouse() {
  const group = new THREE.Group();

  // Main tower — tapered cylinder
  const towerMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
  const towerGeo = new THREE.CylinderGeometry(1.2, 1.8, 14, 12);
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 7;
  group.add(tower);

  // Red stripe band near the top
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 1.2, 12), stripeMat);
  stripe.position.y = 10.5;
  group.add(stripe);

  // Lantern room platform
  const platformMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.6, 0.3, 12), platformMat);
  platform.position.y = 14.15;
  group.add(platform);

  // Lantern room glass walls
  const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffd700, transparent: true, opacity: 0.7 });
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.0, 8), lanternMat);
  lanternRoom.position.y = 15.3;
  group.add(lanternRoom);

  // Lantern room roof (conical)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const roofGeo = new THREE.ConeGeometry(1.3, 1.5, 8);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 17.05;
  group.add(roof);

  // Railing around platform
  const railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4), railMat);
    post.position.set(Math.cos(angle) * 1.6, 14.7, Math.sin(angle) * 1.6);
    group.add(post);
  }
  const railRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 4, 16), railMat);
  railRing.rotation.x = Math.PI / 2;
  railRing.position.y = 15.1;
  group.add(railRing);

  // Door
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a2800 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.2), doorMat);
  door.position.set(0, 0.8, 1.82);
  group.add(door);

  // Keeper's cottage attached to the side
  const cottageMat = new THREE.MeshLambertMaterial({ color: 0xe8ddd0 });
  const cottage = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.0, 4.0), cottageMat);
  cottage.position.set(-3.8, 1.5, 0);
  group.add(cottage);

  // Cottage roof
  const cottageRoofGeo = new THREE.ConeGeometry(3.5, 1.5, 4);
  const cottageRoof = new THREE.Mesh(cottageRoofGeo, new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
  cottageRoof.rotation.y = Math.PI / 4;
  cottageRoof.position.set(-3.8, 3.75, 0);
  group.add(cottageRoof);

  // Cottage door
  const cottageDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.15), doorMat);
  cottageDoor.position.set(-3.8, 0.75, 2.08);
  group.add(cottageDoor);

  // Cottage window
  const winMat = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.12), winMat);
  win.position.set(-5.32, 1.8, 0);
  group.add(win);

  group.userData.label = 'Lighthouse';
  return group;
}

// ---------------------------------------------------------------------------
// Radio Station building — concrete block, antenna mast, satellite dish
// ---------------------------------------------------------------------------

function makeRadioStation() {
  const group = new THREE.Group();
  const RSW = 8, RSH = 5, RSD = 7;

  // Main building
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(RSW, RSH, RSD),
    new THREE.MeshLambertMaterial({ color: 0xb0b8c8 })
  );
  walls.position.y = RSH / 2;
  group.add(walls);

  // Flat roof with slight overhang
  const roofTop = new THREE.Mesh(
    new THREE.BoxGeometry(RSW + 0.6, 0.25, RSD + 0.6),
    new THREE.MeshLambertMaterial({ color: 0x8899aa })
  );
  roofTop.position.y = RSH + 0.12;
  group.add(roofTop);

  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x2d3a4a })
  );
  door.position.set(-1.5, 1.1, RSD / 2 + 0.1);
  group.add(door);

  // Sign
  const sc = document.createElement('canvas');
  sc.width = 512; sc.height = 80;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#1a2a3a';
  sctx.fillRect(0, 0, 512, 80);
  sctx.fillStyle = '#7ec8e3';
  sctx.font = 'bold 40px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('📻 Island Radio', 256, 40);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.0, 0.85),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc), transparent: true })
  );
  signMesh.position.set(1.0, RSH * 0.82, RSD / 2 + 0.15);
  group.add(signMesh);

  // Antenna mast on roof
  const mastMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 6.5, 6), mastMat);
  mast.position.set(2.5, RSH + 3.5, 0);
  group.add(mast);

  // Crossarms on mast
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4 - i * 0.5, 0.08, 0.08), mastMat);
    arm.position.set(2.5, RSH + 1.5 + i * 1.8, 0);
    group.add(arm);
  }

  // Satellite dish
  const dishGeo = new THREE.SphereGeometry(0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const dish = new THREE.Mesh(dishGeo, new THREE.MeshLambertMaterial({ color: 0xdddddd }));
  dish.rotation.x = Math.PI * 0.35;
  dish.position.set(-2.5, RSH + 1.2, RSD / 2 - 0.5);
  group.add(dish);

  // Window
  const winMat = new THREE.MeshLambertMaterial({ color: 0xaaccee, transparent: true, opacity: 0.6 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.12), winMat);
  win.position.set(2.0, RSH * 0.6, RSD / 2 + 0.06);
  group.add(win);

  group.userData.label = 'Radio Station';
  return group;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// CAD-134: Centralised Maintenance — grey corrugated, garage door, solar rigs
// ---------------------------------------------------------------------------

function makeMaintenanceBuilding() {
  const group = new THREE.Group();
  const MW = 16, MH = 8, MD = 12;

  const mWalls = box(MW, MH, MD, C.maintenance);
  mWalls.position.y = MH / 2;
  group.add(mWalls);

  for (let i = 0; i < 6; i++) {
    const strip = box(MW + 2, 0.25, MD / 6, 0x4a5568);
    strip.position.set(0, MH + 0.12, -MD/2 + i * (MD/6) + 0.8);
    strip.rotation.x = -0.04;
    group.add(strip);
  }

  const garageDoor = box(6.5, 4.2, 0.3, 0x2d3748);
  garageDoor.position.set(-3, 2.1, MD / 2 + 0.15);
  group.add(garageDoor);
  for (let i = 1; i <= 3; i++) {
    const panel = box(6.5, 0.12, 0.15, 0x1a202c);
    panel.position.set(-3, i * 1.05, MD / 2 + 0.32);
    group.add(panel);
  }

  const persoDoor = box(1.5, 2.6, 0.3, C.door);
  persoDoor.position.set(4.5, 1.3, MD / 2 + 0.15);
  group.add(persoDoor);

  const sc7 = document.createElement('canvas');
  sc7.width = 512; sc7.height = 80;
  const sctx7 = sc7.getContext('2d');
  sctx7.fillStyle = '#2d3748';
  sctx7.fillRect(0, 0, 512, 80);
  sctx7.fillStyle = '#fbbf24';
  sctx7.font = 'bold 38px sans-serif';
  sctx7.textAlign = 'center';
  sctx7.textBaseline = 'middle';
  sctx7.fillText('🔧 Maintenance', 256, 40);
  const signMesh7 = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 1.0),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(sc7), transparent: true })
  );
  signMesh7.position.set(1, MH * 0.78, MD / 2 + 0.2);
  group.add(signMesh7);

  const mBench = box(MW - 4, 0.14, 1.8, 0x8b6914);
  mBench.position.set(0, 4.5, MD / 2 - 1.2);
  group.add(mBench);
  for (const bxPos of [-5.5, 5.5]) {
    const leg = box(0.18, 4.5, 0.18, 0x7a5230);
    leg.position.set(bxPos, 2.25, MD/2-1.2);
    group.add(leg);
  }

  const hookMatM = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
  for (let i = -4; i <= 4; i++) {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 5), hookMatM);
    hook.rotation.z = Math.PI / 2;
    hook.position.set(i * 1.6, 6.5, MD / 2 - 0.4);
    group.add(hook);
  }

  for (let i = 0; i < 3; i++) {
    const testPanel = box(3.2, 0.15, 2.5, C.solar);
    testPanel.position.set(-MW/2 - 2 - i * 4.5, 2.0, 1.5);
    testPanel.rotation.x = -0.4;
    const testPole = cylinder(0.12, 0.12, 2.0, C.solarFrame, 4);
    testPole.position.set(-MW/2 - 2 - i * 4.5, 1.0, 1.5);
    group.add(testPanel, testPole);
  }

  for (let i = 0; i < 3; i++) {
    const pipe = cylinder(0.12, 0.12, MH * 0.7, 0x718096, 8);
    pipe.position.set(MW / 2 + 0.3, MH * 0.35, -MD/2 + 2 + i * 4);
    group.add(pipe);
  }

  group.userData.label = 'Maintenance';
  return group;
}

// ---------------------------------------------------------------------------
// CAD-146: VR Experience — curved pod, glowing accents, queue line
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Place helper — sets position at terrain height
// ---------------------------------------------------------------------------

function placeOnTerrain(obj, x, z, yOffset = 0) {
  obj.position.set(x, getHeight(x, z) + yOffset, z);
}

// ---------------------------------------------------------------------------
// Path strip — a flat plane along a line between two points
// ---------------------------------------------------------------------------

function makePath(scene, x1, z1, x2, z2, width = 4) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  // Use segments to follow terrain
  const segs = Math.max(2, Math.floor(length / 8));
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const tm = (t0 + t1) / 2;
    const mx = x1 + dx * tm;
    const mz = z1 + dz * tm;
    const segLen = length / segs;

    const strip = flatPlane(width, segLen + 0.5, C.path);
    strip.position.set(mx, getHeight(mx, mz) + 0.15, mz);
    strip.rotation.z = -angle;
    scene.add(strip);
  }
}

// ---------------------------------------------------------------------------
// Zone builders (CAD-406 to CAD-422)
// ---------------------------------------------------------------------------

function makeHarbourZone(scene) {
  // CAD-406: The Harbour (0, 355) — formalises the dock/harbour area
  const hx = 0, hz = 355;

  // Harbour master's office — small building
  const office = makeBuilding(8, 6, 6, 0x4a7a8a, 0x2d5a6a, { label: 'Harbour Master' });
  placeOnTerrain(office, hx - 20, hz);
  scene.add(office);

  // Crane — tall cylinder with arm
  const craneBase = cylinder(1.2, 1.5, 12, 0xcc8800, 6);
  placeOnTerrain(craneBase, hx + 15, hz - 5, 6);
  scene.add(craneBase);
  const craneArm = box(12, 0.6, 0.6, 0xcc8800);
  placeOnTerrain(craneArm, hx + 20, hz - 5, 12.5);
  scene.add(craneArm);

  // Signal flags — thin poles with coloured blocks
  for (let i = 0; i < 3; i++) {
    const pole = cylinder(0.1, 0.1, 5, 0x666666, 4);
    placeOnTerrain(pole, hx - 12 + i * 4, hz + 10, 2.5);
    scene.add(pole);
    const flag = box(1.2, 0.8, 0.05, [0xcc2222, 0x2266cc, 0xccaa00][i]);
    placeOnTerrain(flag, hx - 12 + i * 4, hz + 10, 4.8);
    scene.add(flag);
  }

  // Anchor decoration
  const anchorRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.15, 6, 12),
    mat(0x4a4a4a)
  );
  placeOnTerrain(anchorRing, hx - 18, hz + 5, 1.2);
  scene.add(anchorRing);

  // CAD-437: Solar Charging Station — canopy with solar panel and charging post
  {
    const scx = hx + 25, scz = hz - 8;
    // Support poles
    for (const [px, pz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
      const pole = cylinder(0.1, 0.1, 3.2, C.solarFrame, 6);
      placeOnTerrain(pole, scx + px, scz + pz, 1.6);
      scene.add(pole);
    }
    // Solar canopy panel
    const canopy = box(4, 0.15, 4, C.solar);
    placeOnTerrain(canopy, scx, scz, 3.3);
    canopy.rotation.x = 0.15; // slight tilt for solar efficiency
    scene.add(canopy);
    // Canopy frame
    const frame = box(4.2, 0.08, 4.2, C.solarFrame);
    placeOnTerrain(frame, scx, scz, 3.22);
    frame.rotation.x = 0.15;
    scene.add(frame);
    // Charging post (bollard)
    const post = cylinder(0.2, 0.2, 1.2, 0x2ecc71, 8);
    placeOnTerrain(post, scx, scz - 1.2, 0.6);
    scene.add(post);
    // Green indicator light on top of post
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff44, emissiveIntensity: 0.5 })
    );
    placeOnTerrain(light, scx, scz - 1.2, 1.3);
    scene.add(light);
    // Label sign
    const signPost = cylinder(0.08, 0.08, 2.2, C.solarFrame, 4);
    placeOnTerrain(signPost, scx + 2.8, scz, 1.1);
    scene.add(signPost);
    const signBoard = box(2.5, 0.8, 0.08, 0xffffff);
    placeOnTerrain(signBoard, scx + 2.8, scz, 2.5);
    scene.add(signBoard);
  }
}

function makeMarketTown(scene) {
  // CAD-407: Market Town (-60, -150) — bustling market area
  const mx = -60, mz = -150;

  // Market stalls — open-sided structures with canopies
  const stallColours = [0xcc4444, 0x44aa44, 0x4488cc, 0xccaa22];
  for (let i = 0; i < 4; i++) {
    const sx = mx + (i % 2) * 16 - 8;
    const sz = mz + Math.floor(i / 2) * 14 - 7;
    // Counter
    const counter = box(5, 1.2, 2.5, 0x8b6914);
    placeOnTerrain(counter, sx, sz, 0.6);
    scene.add(counter);
    // Canopy pole
    const pole1 = cylinder(0.15, 0.15, 4, 0x666666, 4);
    placeOnTerrain(pole1, sx - 2.2, sz - 1, 2);
    scene.add(pole1);
    const pole2 = cylinder(0.15, 0.15, 4, 0x666666, 4);
    placeOnTerrain(pole2, sx + 2.2, sz - 1, 2);
    scene.add(pole2);
    // Canopy top
    const canopy = box(6, 0.15, 3.5, stallColours[i]);
    placeOnTerrain(canopy, sx, sz, 4.2);
    canopy.rotation.x = 0.1;
    scene.add(canopy);
  }

  // Central market well
  const well = cylinder(1.5, 1.5, 1.0, 0x888888, 10);
  placeOnTerrain(well, mx, mz, 0.5);
  scene.add(well);

  // Bunting between stalls — thin horizontal lines
  const bunting = box(20, 0.05, 0.05, 0xcc4444);
  placeOnTerrain(bunting, mx, mz, 4.5);
  scene.add(bunting);
}

function makeSandyBay(scene) {
  // CAD-408: Sandy Bay (150, -330) — sandy beach area
  const sx = 150, sz = -330;

  // Sand-coloured ground patch
  const sandPatch = flatPlane(40, 35, 0xe8d5a3);
  sandPatch.position.set(sx, 0.2, sz);
  scene.add(sandPatch);

  // Beach huts — small colourful cabins
  const hutColours = [0xcc4444, 0x44aacc, 0xffcc44, 0x88cc44];
  for (let i = 0; i < 4; i++) {
    const hut = box(3, 3, 3, hutColours[i]);
    placeOnTerrain(hut, sx - 12 + i * 8, sz + 12, 1.5);
    scene.add(hut);
    const hutRoof = box(3.5, 0.3, 3.5, 0x6b4e1a);
    placeOnTerrain(hutRoof, sx - 12 + i * 8, sz + 12, 3.2);
    scene.add(hutRoof);
  }

  // Driftwood logs
  for (const [dx, dz] of [[8, -5], [-6, -8], [12, -10]]) {
    const log = cylinder(0.3, 0.25, 4, 0x9e8a6e, 5);
    log.rotation.z = Math.PI / 2;
    placeOnTerrain(log, sx + dx, sz + dz, 0.3);
    scene.add(log);
  }

  // Parasol
  const parasol = cylinder(0.15, 0.15, 4, 0x8b6914, 4);
  placeOnTerrain(parasol, sx + 3, sz - 2, 2);
  scene.add(parasol);
  const parasolTop = cone(2.5, 1, 0xcc4444, 8);
  placeOnTerrain(parasolTop, sx + 3, sz - 2, 4.3);
  scene.add(parasolTop);
}

function makeTidepools(scene) {
  // CAD-409: Tidepools (-200, -350) — rocky tidal area
  const tx = -200, tz = -350;

  // Dark rocky ground
  const rockGround = flatPlane(30, 25, 0x5a5a5a);
  rockGround.position.set(tx, 0.15, tz);
  scene.add(rockGround);

  // Pool shapes — flat blue discs
  const poolPositions = [[0, 0], [5, -4], [-6, 3], [8, 5], [-4, -6]];
  for (const [px, pz] of poolPositions) {
    const poolSize = 1.5 + Math.random() * 2;
    const pool = cylinder(poolSize, poolSize, 0.3, 0x3a8fbf, 8);
    pool.position.set(tx + px, 0.1, tz + pz);
    scene.add(pool);
  }

  // Scattered rocks
  for (let i = 0; i < 8; i++) {
    const rx = tx + (Math.random() - 0.5) * 24;
    const rz = tz + (Math.random() - 0.5) * 20;
    const rock = box(
      0.8 + Math.random() * 1.5,
      0.5 + Math.random() * 1,
      0.8 + Math.random() * 1.5,
      0x4a4a4a + Math.floor(Math.random() * 20) * 0x010101
    );
    placeOnTerrain(rock, rx, rz, 0.3);
    rock.rotation.y = Math.random() * Math.PI;
    scene.add(rock);
  }

  // Warning sign
  const signPost = cylinder(0.1, 0.1, 2.5, 0x6b4e1a, 4);
  placeOnTerrain(signPost, tx + 10, tz + 8, 1.25);
  scene.add(signPost);
  const signBoard = box(2, 1.2, 0.1, 0xffcc00);
  placeOnTerrain(signBoard, tx + 10, tz + 8, 2.8);
  scene.add(signBoard);
}

function makeFishingVillage(scene) {
  // CAD-410: Fishing Village (80, 300) — small coastal settlement
  const fvx = 80, fvz = 300;

  // Small cottages
  const cottagePositions = [[0, 0], [12, -5], [-10, 6], [8, 10]];
  for (let i = 0; i < cottagePositions.length; i++) {
    const [cx, cz] = cottagePositions[i];
    const cottage = makeBuilding(6, 5, 5, 0xf8e8d0, 0x4a7a5a);
    placeOnTerrain(cottage, fvx + cx, fvz + cz);
    cottage.rotation.y = i * 0.8;
    scene.add(cottage);
  }

  // Boat on shore — beached rowing boat
  const boatHull = box(5, 1.2, 2.2, 0x6b4e1a);
  placeOnTerrain(boatHull, fvx - 8, fvz - 8, 0.6);
  boatHull.rotation.y = 0.3;
  scene.add(boatHull);

  // Fish drying rack
  const rackPole1 = cylinder(0.12, 0.12, 3, 0x6b4e1a, 4);
  placeOnTerrain(rackPole1, fvx + 15, fvz, 1.5);
  scene.add(rackPole1);
  const rackPole2 = cylinder(0.12, 0.12, 3, 0x6b4e1a, 4);
  placeOnTerrain(rackPole2, fvx + 19, fvz, 1.5);
  scene.add(rackPole2);
  const rackBar = box(4.5, 0.1, 0.1, 0x6b4e1a);
  placeOnTerrain(rackBar, fvx + 17, fvz, 2.8);
  scene.add(rackBar);
}

function makeKelpCove(scene) {
  // CAD-411: Kelp Cove (-180, 340) — sheltered cove with kelp
  const kx = -180, kz = 340;

  // Sandy cove floor
  const coveFloor = flatPlane(30, 25, 0xd4c094);
  coveFloor.position.set(kx, 0.1, kz);
  scene.add(coveFloor);

  // Kelp fronds — tall thin green cylinders
  for (let i = 0; i < 12; i++) {
    const fx = kx + (Math.random() - 0.5) * 25;
    const fz = kz + (Math.random() - 0.5) * 20;
    const frond = cylinder(0.15, 0.1, 2 + Math.random() * 2, 0x2d6b2d, 4);
    frond.position.set(fx, 0.5 + Math.random(), fz);
    frond.rotation.x = (Math.random() - 0.5) * 0.4;
    frond.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(frond);
  }

  // Rocky outcrop sheltering the cove
  const outcrop1 = box(5, 4, 6, 0x5a5a5a);
  placeOnTerrain(outcrop1, kx - 12, kz + 8, 2);
  outcrop1.rotation.y = 0.5;
  scene.add(outcrop1);
  const outcrop2 = box(4, 3, 5, 0x4a4a4a);
  placeOnTerrain(outcrop2, kx - 14, kz + 5, 1.5);
  scene.add(outcrop2);

  // Small wooden jetty
  const jetty = box(12, 0.3, 2.5, 0x8b6914);
  placeOnTerrain(jetty, kx + 5, kz + 10, 0.8);
  jetty.rotation.y = 0.3;
  scene.add(jetty);
}

function makeSaltMarsh(scene) {
  // CAD-412: Salt Marsh (-300, -50) — wetland area
  const smx = -300, smz = -50;

  // Marshy ground — green-brown
  const marshGround = flatPlane(35, 30, 0x6a8a4a);
  marshGround.position.set(smx, 0.2, smz);
  scene.add(marshGround);

  // Shallow pools
  for (const [px, pz] of [[4, 3], [-8, -5], [6, -8], [-3, 7], [10, 6]]) {
    const pool = cylinder(1.2 + Math.random(), 1.2 + Math.random(), 0.15, 0x5a9aaa, 6);
    pool.position.set(smx + px, 0.18, smz + pz);
    scene.add(pool);
  }

  // Reeds — thin tall cylinders
  for (let i = 0; i < 20; i++) {
    const rx = smx + (Math.random() - 0.5) * 30;
    const rz = smz + (Math.random() - 0.5) * 25;
    const reed = cylinder(0.05, 0.05, 1.5 + Math.random() * 1.5, 0x5a7a3a, 3);
    placeOnTerrain(reed, rx, rz, 1);
    scene.add(reed);
  }

  // Bird hide — small wooden structure
  const hide = box(5, 3, 3, 0x6b4e1a);
  placeOnTerrain(hide, smx + 12, smz - 10, 1.5);
  scene.add(hide);
  const hideRoof = box(6, 0.3, 4, 0x4a3a1a);
  placeOnTerrain(hideRoof, smx + 12, smz - 10, 3.2);
  scene.add(hideRoof);
}

function makeRiverMouth(scene) {
  // CAD-413: River Mouth (-200, 280) — where river meets sea
  const rmx = -200, rmz = 280;

  // River channel — blue flat strip
  const river = flatPlane(8, 30, 0x4a9abf);
  river.position.set(rmx, 0.15, rmz);
  river.rotation.z = 0.2;
  scene.add(river);

  // Muddy banks
  const bank1 = flatPlane(6, 25, 0x8a7a5a);
  bank1.position.set(rmx - 6, 0.12, rmz);
  scene.add(bank1);
  const bank2 = flatPlane(6, 25, 0x8a7a5a);
  bank2.position.set(rmx + 6, 0.12, rmz);
  scene.add(bank2);

  // Wooden footbridge
  const bridge = box(10, 0.4, 2.5, 0x8b6914);
  placeOnTerrain(bridge, rmx, rmz - 5, 1.5);
  bridge.rotation.y = Math.PI / 2 + 0.2;
  scene.add(bridge);
  // Bridge railings
  const rail1 = box(10, 0.8, 0.1, 0x6b4e1a);
  placeOnTerrain(rail1, rmx, rmz - 6.2, 2.2);
  rail1.rotation.y = Math.PI / 2 + 0.2;
  scene.add(rail1);
  const rail2 = box(10, 0.8, 0.1, 0x6b4e1a);
  placeOnTerrain(rail2, rmx, rmz - 3.8, 2.2);
  rail2.rotation.y = Math.PI / 2 + 0.2;
  scene.add(rail2);

  // Reeds along banks
  for (let i = 0; i < 10; i++) {
    const rx = rmx + (Math.random() - 0.5) * 6 + (Math.random() > 0.5 ? 7 : -7);
    const rz = rmz + (Math.random() - 0.5) * 25;
    const reed = cylinder(0.05, 0.05, 1.5 + Math.random(), 0x5a7a3a, 3);
    placeOnTerrain(reed, rx, rz, 0.8);
    scene.add(reed);
  }
}

function makeHighlandForest(scene) {
  // CAD-414: Highland Forest (-300, -200) — dense elevated forest
  const hfx = -300, hfz = -200;

  // Dense tree cluster
  for (let i = 0; i < 15; i++) {
    const tx = hfx + (Math.random() - 0.5) * 40;
    const tz = hfz + (Math.random() - 0.5) * 35;
    const tree = makeTree(7 + Math.random() * 5, Math.random() > 0.5 ? C.foliage : C.foliageDark);
    placeOnTerrain(tree, tx, tz);
    scene.add(tree);
  }

  // Fallen log
  const fallenLog = cylinder(0.6, 0.5, 8, 0x6b4e1a, 6);
  fallenLog.rotation.z = Math.PI / 2;
  placeOnTerrain(fallenLog, hfx + 5, hfz + 3, 0.4);
  scene.add(fallenLog);

  // Mushrooms — small coloured cones
  for (let i = 0; i < 6; i++) {
    const mx = hfx + (Math.random() - 0.5) * 30;
    const mz = hfz + (Math.random() - 0.5) * 25;
    const mushroom = cone(0.3, 0.4, 0xcc4444, 6);
    placeOnTerrain(mushroom, mx, mz, 0.3);
    scene.add(mushroom);
    const stem = cylinder(0.1, 0.1, 0.3, 0xf0f0e0, 4);
    placeOnTerrain(stem, mx, mz, 0.15);
    scene.add(stem);
  }

  // Mossy boulder
  const boulder = box(3, 2.5, 3, 0x4a6a4a);
  placeOnTerrain(boulder, hfx - 8, hfz - 6, 1.2);
  boulder.rotation.y = 0.7;
  scene.add(boulder);
}

function makeWindRidge(scene) {
  // CAD-415: Wind Ridge (0, -200) — exposed windy hilltop
  const wrx = 0, wrz = -200;

  // Wind turbines — smaller versions of the main windmill
  for (let i = 0; i < 3; i++) {
    const wx = wrx - 12 + i * 12;
    const wz = wrz + (i % 2) * 6;
    const turbinePole = cylinder(0.4, 0.5, 10, 0xe0e0e0, 6);
    placeOnTerrain(turbinePole, wx, wz, 5);
    scene.add(turbinePole);
    // Nacelle
    const nacelle = box(1.5, 1, 1, 0xd0d0d0);
    placeOnTerrain(nacelle, wx, wz, 10.5);
    scene.add(nacelle);
    // Blades (simplified as thin boxes)
    for (let b = 0; b < 3; b++) {
      const blade = box(0.4, 4, 0.1, C.blade);
      placeOnTerrain(blade, wx, wz, 10.5);
      blade.rotation.z = (b * Math.PI * 2) / 3 + i * 0.5;
      scene.add(blade);
    }
  }

  // Wind-blown grass tufts
  for (let i = 0; i < 8; i++) {
    const gx = wrx + (Math.random() - 0.5) * 30;
    const gz = wrz + (Math.random() - 0.5) * 20;
    const tuft = cone(0.4, 0.8, 0x8aaa5a, 4);
    placeOnTerrain(tuft, gx, gz, 0.3);
    tuft.rotation.x = 0.2; // leaning in wind
    scene.add(tuft);
  }

  // Weather station — small equipment box on pole
  const wsPost = cylinder(0.12, 0.12, 3, 0x888888, 4);
  placeOnTerrain(wsPost, wrx + 15, wrz - 5, 1.5);
  scene.add(wsPost);
  const wsBox = box(1, 0.8, 0.8, 0xf0f0f0);
  placeOnTerrain(wsBox, wrx + 15, wrz - 5, 3.4);
  scene.add(wsBox);
}

function makeTheSummit(scene) {
  // CAD-416: The Summit (-150, -320) — highest point on the island
  const sx = -150, sz = -320;

  // Cairn — stacked rocks
  const cairnStones = [
    [0, 0, 2.5, 2.5], [0, 0.8, 2, 2], [0, 1.5, 1.5, 1.5], [0, 2.1, 1, 1], [0, 2.5, 0.6, 0.6]
  ];
  for (const [dx, dy, rTop, rBot] of cairnStones) {
    const stone = cylinder(rTop * 0.4, rBot * 0.45, 0.5, 0x7a7a7a, 6);
    placeOnTerrain(stone, sx + dx, sz, dy + 0.25);
    scene.add(stone);
  }

  // Viewpoint bench
  const bench = makeBench();
  placeOnTerrain(bench, sx + 8, sz - 3);
  bench.rotation.y = -0.5;
  scene.add(bench);

  // Triangulation pillar — concrete cylinder
  const trigPillar = cylinder(0.5, 0.6, 1.5, 0xd0d0d0, 6);
  placeOnTerrain(trigPillar, sx - 5, sz + 3, 0.75);
  scene.add(trigPillar);
  const trigTop = cylinder(0.7, 0.7, 0.15, 0xc0c0c0, 6);
  placeOnTerrain(trigTop, sx - 5, sz + 3, 1.58);
  scene.add(trigTop);

  // Wind-shaped tree
  const stuntedTree = makeTree(4, 0x4a8a30);
  placeOnTerrain(stuntedTree, sx + 12, sz + 5);
  stuntedTree.rotation.z = 0.15; // wind-shaped lean
  scene.add(stuntedTree);
}

function makeCommunityFarm(scene) {
  // CAD-417: Community Farm (-330, 60) — allotments and polytunnels
  const cfx = -330, cfz = 60;

  // Allotment plots — small raised beds
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const plotX = cfx + col * 8 - 8;
      const plotZ = cfz + row * 7 - 7;
      const bed = box(6, 0.5, 5, 0x5a3a1a);
      placeOnTerrain(bed, plotX, plotZ, 0.25);
      scene.add(bed);
      // Crops growing
      const crops = box(5, 0.6, 4, 0x4a9a3a);
      placeOnTerrain(crops, plotX, plotZ, 0.6);
      scene.add(crops);
    }
  }

  // Polytunnel — half-cylinder shape using a box (simplified)
  const tunnel = cylinder(3, 3, 10, 0xffffff, 8);
  tunnel.rotation.z = Math.PI / 2;
  placeOnTerrain(tunnel, cfx + 18, cfz, 2);
  tunnel.material = mat(0xffffff, { transparent: true, opacity: 0.4 });
  scene.add(tunnel);

  // Compost bins
  const compost1 = box(2.5, 2, 2.5, 0x4a3a1a);
  placeOnTerrain(compost1, cfx - 15, cfz + 8, 1);
  scene.add(compost1);
  const compost2 = box(2.5, 2, 2.5, 0x5a4a2a);
  placeOnTerrain(compost2, cfx - 12, cfz + 8, 1);
  scene.add(compost2);

  // Tool shed
  const shed = box(4, 3, 3, 0x6b4e1a);
  placeOnTerrain(shed, cfx - 15, cfz - 8, 1.5);
  scene.add(shed);
  const shedRoof = box(5, 0.3, 4, 0x4a3a1a);
  placeOnTerrain(shedRoof, cfx - 15, cfz - 8, 3.2);
  scene.add(shedRoof);
}

function makeOrchard(scene) {
  // CAD-418: Orchard (-250, 200) — fruit trees in neat rows
  const ox = -250, oz = 200;

  // Fruit trees in grid pattern
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const tx = ox + col * 8 - 12;
      const tz = oz + row * 8 - 12;
      const tree = makeTree(5 + Math.random() * 2, 0x3a9a3a);
      placeOnTerrain(tree, tx, tz);
      scene.add(tree);
      // Fruit (small spheres in the canopy)
      if (Math.random() > 0.4) {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 6, 6),
          mat(Math.random() > 0.5 ? 0xcc3333 : 0xffaa00)
        );
        placeOnTerrain(fruit, tx + (Math.random() - 0.5) * 2, tz + (Math.random() - 0.5) * 2, 4 + Math.random());
        scene.add(fruit);
      }
    }
  }

  // Wooden gate at entrance
  const gatePost1 = cylinder(0.2, 0.2, 2.5, 0x6b4e1a, 4);
  placeOnTerrain(gatePost1, ox - 15, oz, 1.25);
  scene.add(gatePost1);
  const gatePost2 = cylinder(0.2, 0.2, 2.5, 0x6b4e1a, 4);
  placeOnTerrain(gatePost2, ox - 15, oz + 3, 1.25);
  scene.add(gatePost2);
  const gateBar = box(0.1, 0.1, 3, 0x6b4e1a);
  placeOnTerrain(gateBar, ox - 15, oz + 1.5, 2.4);
  scene.add(gateBar);
}

function makeRiverValley(scene) {
  // CAD-419: River Valley (200, 100) — gentle valley with stream
  const rvx = 200, rvz = 100;

  // Stream — blue strip
  const stream = flatPlane(5, 35, 0x5aaacf);
  stream.position.set(rvx, 0.2, rvz);
  stream.rotation.z = 0.3;
  scene.add(stream);

  // Stepping stones across stream
  for (let i = 0; i < 5; i++) {
    const stone = cylinder(0.5, 0.6, 0.3, 0x8a8a8a, 6);
    stone.position.set(rvx - 2 + i * 1.2, 0.35, rvz + 2);
    scene.add(stone);
  }

  // Wildflower patches
  const flowerColours = [0xff88aa, 0xffdd44, 0xaa88ff, 0xff6644];
  for (let i = 0; i < 10; i++) {
    const fx = rvx + (Math.random() - 0.5) * 30;
    const fz = rvz + (Math.random() - 0.5) * 30;
    const flower = cone(0.3, 0.5, flowerColours[i % 4], 5);
    placeOnTerrain(flower, fx, fz, 0.4);
    scene.add(flower);
  }

  // Willow tree — tall with drooping foliage
  const willowTrunk = cylinder(0.4, 0.5, 6, C.trunk, 6);
  placeOnTerrain(willowTrunk, rvx - 5, rvz - 8, 3);
  scene.add(willowTrunk);
  const willowCanopy = new THREE.Mesh(
    new THREE.SphereGeometry(4, 8, 6),
    mat(0x3a8a3a)
  );
  placeOnTerrain(willowCanopy, rvx - 5, rvz - 8, 7);
  willowCanopy.scale.y = 1.3;
  scene.add(willowCanopy);
}

function makeTheCommons(scene) {
  // CAD-420: The Commons (50, 50) — open public green space
  const cx = 50, cz = 50;

  // Green lawn patch
  const lawn = flatPlane(30, 25, 0x5aaa3a);
  lawn.position.set(cx, 0.18, cz);
  scene.add(lawn);

  // Bandstand — octagonal platform with pillars and roof
  const platform = cylinder(5, 5, 0.5, 0xd0d0d0, 8);
  placeOnTerrain(platform, cx, cz, 0.25);
  scene.add(platform);
  // Pillars
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const px = cx + Math.cos(angle) * 4.2;
    const pz = cz + Math.sin(angle) * 4.2;
    const pillar = cylinder(0.2, 0.2, 4, 0xe0e0e0, 6);
    placeOnTerrain(pillar, px, pz, 2.5);
    scene.add(pillar);
  }
  // Bandstand roof
  const bsRoof = cone(6, 2, 0x6b8a5a, 8);
  placeOnTerrain(bsRoof, cx, cz, 5.5);
  scene.add(bsRoof);

  // Park benches around commons
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI * 2) / 4 + 0.4;
    const bx = cx + Math.cos(angle) * 12;
    const bz = cz + Math.sin(angle) * 12;
    const bench = makeBench();
    placeOnTerrain(bench, bx, bz);
    bench.rotation.y = angle + Math.PI;
    scene.add(bench);
  }
}

function makeClifftopPath(scene) {
  // CAD-421: Clifftop Path (-250, -300) — dramatic cliff edge walkway
  const cpx = -250, cpz = -300;

  // Path surface
  makePath(scene, cpx + 15, cpz + 15, cpx - 15, cpz - 15, 3);

  // Cliff edge fence — safety railing
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const fx = cpx + 15 - t * 30;
    const fz = cpz + 15 - t * 30;
    const fencePost = cylinder(0.1, 0.1, 1.5, 0x6b4e1a, 4);
    placeOnTerrain(fencePost, fx - 2, fz - 2, 0.75);
    scene.add(fencePost);
  }
  // Fence rail
  const rail = box(0.08, 0.08, 32, 0x6b4e1a);
  placeOnTerrain(rail, cpx - 2, cpz - 2, 1.3);
  rail.rotation.y = Math.PI / 4;
  scene.add(rail);

  // Dramatic cliff rocks
  for (let i = 0; i < 5; i++) {
    const rx = cpx - 4 + (Math.random() - 0.5) * 8;
    const rz = cpz - 4 + (Math.random() - 0.5) * 8;
    const cliffRock = box(
      2 + Math.random() * 3,
      1 + Math.random() * 2,
      2 + Math.random() * 3,
      0x5a5a5a
    );
    placeOnTerrain(cliffRock, rx, rz, 0.8);
    cliffRock.rotation.y = Math.random() * Math.PI;
    scene.add(cliffRock);
  }

  // Viewpoint marker
  const viewMarker = cylinder(0.6, 0.6, 0.3, 0xd0d0d0, 8);
  placeOnTerrain(viewMarker, cpx, cpz, 0.15);
  scene.add(viewMarker);
}

function makeHiddenBeach(scene) {
  // CAD-422: Hidden Beach (300, -350) — secluded eastern beach
  const hbx = 300, hbz = -350;

  // Sand area
  const sand = flatPlane(25, 20, 0xe8d5a3);
  sand.position.set(hbx, 0.15, hbz);
  scene.add(sand);

  // Rocky entrance — boulders forming a narrow gap
  const entranceRock1 = box(4, 4, 5, 0x6a6a6a);
  placeOnTerrain(entranceRock1, hbx - 8, hbz + 8, 2);
  scene.add(entranceRock1);
  const entranceRock2 = box(3.5, 3.5, 4, 0x5a5a5a);
  placeOnTerrain(entranceRock2, hbx + 6, hbz + 8, 1.75);
  scene.add(entranceRock2);

  // Washed-up treasures — coloured boxes
  const treasureColours = [0xffcc00, 0x44aacc, 0xcc66aa];
  for (let i = 0; i < 3; i++) {
    const treasure = box(0.8, 0.6, 0.8, treasureColours[i]);
    placeOnTerrain(treasure, hbx - 4 + i * 5, hbz - 5 + (Math.random() - 0.5) * 6, 0.3);
    treasure.rotation.y = Math.random() * Math.PI;
    scene.add(treasure);
  }

  // Sea-smoothed rocks scattered on sand
  for (let i = 0; i < 6; i++) {
    const rx = hbx + (Math.random() - 0.5) * 20;
    const rz = hbz + (Math.random() - 0.5) * 15;
    const smoothRock = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 6, 5),
      mat(0x8a8a8a)
    );
    smoothRock.position.set(rx, 0.3, rz);
    smoothRock.scale.y = 0.5;
    scene.add(smoothRock);
  }

  // Old rope tied to rock
  const ropeRock = box(1.5, 1, 1.5, 0x6a6a6a);
  placeOnTerrain(ropeRock, hbx + 8, hbz - 3, 0.5);
  scene.add(ropeRock);
}

// ---------------------------------------------------------------------------
// Terrain mesh builder
// ---------------------------------------------------------------------------

function buildTerrain(scene) {
  // Main island terrain — subdivided plane with height
  const size = 620;
  const segs = 100;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position;
  const colors = [];

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    const angle = Math.atan2(z, x);

    let y;
    if (dist > effectiveRadius(angle)) {
      y = -0.5; // underwater
    } else {
      y = getHeight(x, z);
    }
    positions.setY(i, y);

    // Vertex colours: sand at edges, grass inland, darker grass on hills
    const edgeFactor = Math.max(0, 1 - dist / effectiveRadius(angle));
    if (dist > effectiveRadius(angle) - 15) {
      // Sand beach
      colors.push(0.91, 0.84, 0.64);
    } else if (y < 1) {
      // Low areas — lighter grass
      colors.push(0.42, 0.69, 0.30);
    } else if (y > 12) {
      // High areas — darker grass
      colors.push(0.29, 0.54, 0.19);
    } else {
      // Normal grass
      const t = y / 12;
      colors.push(
        0.42 - t * 0.13,
        0.69 - t * 0.15,
        0.30 - t * 0.11,
      );
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const terrain = new THREE.Mesh(geo, terrainMat);
  scene.add(terrain);

  // Beach ring removed — terrain vertex colouring handles the beach look
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Main scene builder
// ---------------------------------------------------------------------------

export function buildScene(scene) {

  // BUILDING COLLIDERS — initialized early so sections below can push into it
  const colliders = [];

  // === Lighting ===
  // Hemisphere light: warm peach sky + cool blue ground = soft natural outdoor look
  const hemiLight = new THREE.HemisphereLight(0xffebd6, 0x99cfff, 0.85);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
  sunLight.position.set(200, 250, 150);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width  = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.left   = -500;
  sunLight.shadow.camera.right  =  500;
  sunLight.shadow.camera.top    =  500;
  sunLight.shadow.camera.bottom = -500;
  sunLight.shadow.camera.near   = 0.5;
  sunLight.shadow.camera.far    = 1000;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
  fillLight.position.set(-150, 100, -200);
  scene.add(fillLight);

  // === Sky ===
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0xc9e8f5, 0.0015);

  // === Sea ===
  const seaGeo = new THREE.PlaneGeometry(1680, 1680, 64, 64);
  seaGeo.rotateX(-Math.PI / 2);
  const seaMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    uniforms: { uTime: { value: 0 }, uNightBlend: { value: 0.0 } },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.05 + uTime * 0.8) * 0.3;
        float wave2 = cos(pos.z * 0.04 + uTime * 0.6) * 0.25;
        pos.y += wave1 + wave2;
        vDepth = pos.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uNightBlend;
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        // Day colours
        vec3 deep    = vec3(0.04, 0.18, 0.35);
        vec3 shallow = vec3(0.12, 0.45, 0.58);
        // Night colours — dark navy
        vec3 deepN   = vec3(0.01, 0.04, 0.12);
        vec3 shallowN = vec3(0.02, 0.08, 0.20);

        vec3 dCol = mix(deep, shallow, clamp(vDepth * 2.0 + 0.5, 0.0, 1.0));
        vec3 nCol = mix(deepN, shallowN, clamp(vDepth * 2.0 + 0.5, 0.0, 1.0));
        vec3 col = mix(dCol, nCol, uNightBlend);

        // Sparkle only during day
        float sparkle1 = fract(sin(dot(vUv * 80.0 + uTime * 0.3, vec2(127.1, 311.7))) * 43758.5);
        sparkle1 = step(0.97, sparkle1) * (1.0 - uNightBlend * 0.9);

        vec2 glintUv = vUv * 12.0 + vec2(uTime * 0.08, uTime * 0.05);
        float glint = sin(glintUv.x * 3.0) * sin(glintUv.y * 2.5);
        glint = pow(max(0.0, glint), 6.0) * 0.35 * (1.0 - uNightBlend * 0.8);

        col += sparkle1 * 0.3 + glint;
        gl_FragColor = vec4(col, 0.90);
      }
    `,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.position.y = -0.8;
  scene.add(sea);

  const seaDeep = new THREE.Mesh(
    new THREE.PlaneGeometry(2240, 2240),
    mat(C.seaDeep)
  );
  seaDeep.rotation.x = -Math.PI / 2;
  seaDeep.position.y = -1.2;
  scene.add(seaDeep);

  // === Terrain ===
  buildTerrain(scene);

  // === Path network ===
  // Central hub
  makePath(scene, 0, 0, -90, -60, 4);    // Town → Bakery
  makePath(scene, 0, 0, 90, -60, 4);     // Town → Post Office
  makePath(scene, 0, 0, 120, 60, 4);     // Town → Library
  makePath(scene, 0, 0, -120, 60, 4);    // Town → Workshop
  makePath(scene, 0, 0, 0, 330, 4);      // Town → Dock (long south)
  // Outer ring & branches
  makePath(scene, -120, 60, -180, 60, 3); // Workshop → Mill
  makePath(scene, -180, 60, -270, 120, 3); // Mill → Farm
  makePath(scene, 120, 60, 195, 168, 3);  // Library → Forest entrance
  makePath(scene, -90, -60, -150, -270, 3); // Bakery → Hilltop
  makePath(scene, 90, -60, 0, -330, 3);  // Post Office → South Beach
  makePath(scene, -90, -60, 0, -330, 3); // Bakery → South Beach
  // Cross paths
  makePath(scene, -90, -60, 90, -60, 3); // Bakery ↔ Post Office
  makePath(scene, -120, 60, 120, 60, 3); // Workshop ↔ Library

  // =====================================================================
  // TOWN SQUARE (0, 0)
  // =====================================================================
  // Central fountain / well
  const fountain = cylinder(3, 3, 1.5, 0xb0b0b0, 12);
  placeOnTerrain(fountain, 0, 0, 0.75);
  scene.add(fountain);
  const waterTop = cylinder(2.5, 2.5, 0.3, C.water, 12);
  placeOnTerrain(waterTop, 0, 0, 1.6);
  scene.add(waterTop);

  // Benches around square
  for (let a = 0; a < 4; a++) {
    const bx = Math.cos(a * Math.PI / 2) * 18;
    const bz = Math.sin(a * Math.PI / 2) * 18;
    const bench = makeBench();
    placeOnTerrain(bench, bx, bz);
    bench.rotation.y = a * Math.PI / 2;
    scene.add(bench);
  }

  // Bike racks near town square
  const bikeRack1 = makeBikeRack();
  placeOnTerrain(bikeRack1, -12, 12);
  scene.add(bikeRack1);

  const bikeRack2 = makeBikeRack();
  placeOnTerrain(bikeRack2, 15, -9);
  bikeRack2.rotation.y = Math.PI / 2;
  scene.add(bikeRack2);

  // A few trees near square
  const squareTrees = [[23, 23], [-23, 18], [18, -23], [-18, -18]];
  squareTrees.forEach(([x, z]) => {
    const tree = makeTree(6 + Math.random() * 2);
    placeOnTerrain(tree, x, z);
    scene.add(tree);
  });

  // Gardens near square
  const garden1 = makeGarden(3);
  placeOnTerrain(garden1, -27, 0);
  scene.add(garden1);

  const garden2 = makeGarden(3);
  placeOnTerrain(garden2, 27, 8);
  scene.add(garden2);

  // =====================================================================
  // BAKERY (-90, -60)
  // =====================================================================
  const bakery = makeBuilding(12, 8, 9, C.bakery, C.roofDark, { solarPanels: true, label: 'Bakery', signText: '🍞 Bakery', signBg: 0xfde8c9, signColor: 0x6b2f00, hollow: true });
  placeOnTerrain(bakery, -90, -60);
  bakery.rotation.y = 0.3;
  scene.add(bakery);

  // ─── Bakery Interior ───────────────────────────────────────────────
  {
    const bx = -90, bz = -60;
    const bBase = getHeight(bx, bz);

    // Wooden counter along back wall (z+3.5 inside 9-deep building)
    const bCounter = box(7, 1.1, 0.8, 0x8b5e3c);
    bCounter.position.set(bx, bBase + 0.55, bz + 3);
    scene.add(bCounter);
    const bCounterTop = box(7.2, 0.12, 0.9, 0xa0714a);
    bCounterTop.position.set(bx, bBase + 1.12, bz + 3);
    scene.add(bCounterTop);

    // Large oven — dark grey box at back-left
    const bOven = box(2.4, 2.2, 1.5, 0x444444);
    bOven.position.set(bx - 3.5, bBase + 1.1, bz + 3.5);
    scene.add(bOven);
    const bOvenDoor = box(1.4, 1.0, 0.12, 0x222222);
    bOvenDoor.position.set(bx - 3.5, bBase + 0.9, bz + 2.76);
    scene.add(bOvenDoor);

    // Bread shelves — long thin horizontal slabs along right wall
    for (let si = 0; si < 3; si++) {
      const bShelf = box(0.2, 0.1, 5.5, 0x9b6a3d);
      bShelf.position.set(bx + 5.5, bBase + 1.0 + si * 0.9, bz + 0.5);
      scene.add(bShelf);
      // Loaves of bread on each shelf (small rounded boxes, warm brown)
      for (let li = 0; li < 4; li++) {
        const loaf = box(0.55, 0.35, 0.6, 0xc47c2b);
        loaf.position.set(bx + 5.38, bBase + 1.22 + si * 0.9, bz - 1.5 + li * 1.1);
        scene.add(loaf);
      }
    }

    // Flour sacks — small white cylinders near oven
    for (const [fx, fz] of [[-4.5, 2.0], [-5.2, 2.5], [-4.0, 2.7]]) {
      const sack = cylinder(0.35, 0.4, 0.75, 0xf0ede0, 8);
      sack.position.set(bx + fx, bBase + 0.38, bz + fz);
      scene.add(sack);
    }

    // Chalkboard menu sign on back wall
    const bChalk = box(2.8, 1.6, 0.1, 0x2d4a3e);
    bChalk.position.set(bx + 1.5, bBase + 2.5, bz + 4.25);
    scene.add(bChalk);
    const bChalkFrame = box(3.0, 1.8, 0.08, 0x6b4226);
    bChalkFrame.position.set(bx + 1.5, bBase + 2.5, bz + 4.22);
    scene.add(bChalkFrame);

    // Serving table in centre
    const bTable = box(3.5, 0.1, 1.8, 0xa0714a);
    bTable.position.set(bx, bBase + 1.1, bz - 0.5);
    scene.add(bTable);
    for (const [tx, tz] of [[-1.5,-0.7],[1.5,-0.7],[-1.5,0.7],[1.5,0.7]]) {
      const leg = box(0.12, 1.1, 0.12, 0x7a5230);
      leg.position.set(bx + tx, bBase + 0.55, bz - 0.5 + tz);
      scene.add(leg);
    }
  }

  // Bakery chimney — tall brick stack with animated smoke handled in main loop
  const bakeryBase = getHeight(-90, -60);
  const chimneyStack = cylinder(0.45, 0.55, 6, 0x8b4513, 8);
  chimneyStack.position.set(-86.5, bakeryBase + 8 + 3, -63);
  scene.add(chimneyStack);
  const chimneyTop = cylinder(0.6, 0.45, 0.6, 0x6b3410, 8);
  chimneyTop.position.set(-86.5, bakeryBase + 11.3, -63);
  scene.add(chimneyTop);

  // Bakery awning — wide striped canopy over door (kept low, below sign)
  const awningL = box(6.5, 0.18, 2.2, 0xe17055);
  awningL.position.set(-90, bakeryBase + 3.8, -54);
  awningL.rotation.x = -0.28;
  scene.add(awningL);
  for (let i = -2; i <= 2; i++) {
    const stripe = box(0.6, 0.19, 2.2, 0xffffff);
    stripe.position.set(-90 + i * 1.1, bakeryBase + 3.82, -54);
    stripe.rotation.x = -0.28;
    scene.add(stripe);
  }
  for (const sx of [-93, -87]) {
    const pole = cylinder(0.1, 0.1, 1.5, 0x8b6914, 5);
    pole.position.set(sx, bakeryBase + 3.05, -54.6);
    scene.add(pole);
  }


  // Small awning / outdoor seating
  const bakeryBench = makeBench();
  placeOnTerrain(bakeryBench, -78, -54);
  scene.add(bakeryBench);

  // Garden beside bakery
  const bakeryGarden = makeGarden(3);
  placeOnTerrain(bakeryGarden, -105, -53);
  scene.add(bakeryGarden);

  // =====================================================================
  // POST OFFICE (90, -60)
  // =====================================================================
  const postOffice = makeBuilding(10, 7, 8, C.postOffice, C.roofDark, { solarPanels: false, label: 'Post Office', signText: '📮 Post Office', signBg: 0xffffff, signColor: 0xcc2222, hollow: true });
  placeOnTerrain(postOffice, 90, -60);
  postOffice.rotation.y = -0.2;
  scene.add(postOffice);

  // ─── Post Office Interior ──────────────────────────────────────────
  {
    const px = 90, pz = -60;
    const pBase = getHeight(px, pz);

    // Wooden counter with glass panel on top
    const pCounter = box(6, 1.2, 0.9, 0x8b5e3c);
    pCounter.position.set(px, pBase + 0.6, pz + 2.5);
    scene.add(pCounter);
    const pCounterTop = box(6.2, 0.08, 1.0, 0xa0714a);
    pCounterTop.position.set(px, pBase + 1.25, pz + 2.5);
    scene.add(pCounterTop);
    // Glass screen on counter
    const pGlass = box(5.5, 1.0, 0.08, 0xaaddff);
    pGlass.material = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.45 });
    pGlass.position.set(px, pBase + 1.75, pz + 2.5);
    scene.add(pGlass);

    // Postal scales on counter
    const pScaleBase = box(0.5, 0.12, 0.5, 0x888888);
    pScaleBase.position.set(px + 2.2, pBase + 1.35, pz + 2.2);
    scene.add(pScaleBase);
    const pScalePan = cylinder(0.25, 0.22, 0.06, 0xbbbbbb, 8);
    pScalePan.position.set(px + 2.2, pBase + 1.52, pz + 2.2);
    scene.add(pScalePan);

    // PO boxes along left wall — 4 columns × 4 rows
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const pb = box(0.85, 0.7, 0.5, row % 2 === 0 ? 0x888888 : 0x777777);
        pb.position.set(px - 4.5 + col * 0.95, pBase + 0.6 + row * 0.78, pz + 3.4);
        scene.add(pb);
        // Small handle dot
        const handle = box(0.06, 0.06, 0.1, 0xccaa44);
        handle.position.set(px - 4.5 + col * 0.95, pBase + 0.6 + row * 0.78, pz + 3.16);
        scene.add(handle);
      }
    }

    // Sorting table in back area
    const sortTop = box(4.5, 0.1, 2.0, 0x9b6a3d);
    sortTop.position.set(px + 1.5, pBase + 1.15, pz - 0.5);
    scene.add(sortTop);
    for (const [lx, lz] of [[-1.9,-0.8],[1.9,-0.8],[-1.9,0.8],[1.9,0.8]]) {
      const leg = box(0.12, 1.15, 0.12, 0x7a5230);
      leg.position.set(px + 1.5 + lx, pBase + 0.58, pz - 0.5 + lz);
      scene.add(leg);
    }

    // Notice board on front wall (inside)
    const nBoard = box(2.5, 1.8, 0.1, 0xc8a850);
    nBoard.position.set(px - 2.5, pBase + 2.4, pz - 3.4);
    scene.add(nBoard);
    // Pinned notices — small coloured rectangles
    for (const [nx, ny, nc] of [[-0.7,0.3,0xff6666],[0.3,0.5,0x66aaff],[-0.3,-0.3,0xffcc44],[0.6,-0.4,0x88dd88]]) {
      const note = box(0.55, 0.4, 0.08, nc);
      note.position.set(px - 2.5 + nx, pBase + 2.4 + ny, pz - 3.36);
      scene.add(note);
    }
  }

  const poBase = getHeight(90, -60);

  // Flagpole
  const flagPole = cylinder(0.12, 0.12, 9, 0xd0d0d0, 6);
  flagPole.position.set(101, poBase + 4.5, -56);
  scene.add(flagPole);
  // Flag — red/white
  const flagMain = box(3.2, 1.8, 0.08, 0xdd2233);
  flagMain.position.set(103, poBase + 8.4, -56);
  scene.add(flagMain);
  const flagStripe = box(3.2, 0.55, 0.09, 0xffffff);
  flagStripe.position.set(103, poBase + 8.6, -56);
  scene.add(flagStripe);

  // One large red pillar box at the Post Office entrance
  const pillarBox = makePostbox();
  placeOnTerrain(pillarBox, 78, -54);
  scene.add(pillarBox);

  // Small American-style mailboxes at residential/delivery spots around the island
  const mailboxSpots = [
    [-78, -54],   // Bakery side
    [0,   18],    // Town Square north
    [-18, -12],   // Town Square west
    [120,  75],   // Library
    [-120, 78],   // Workshop
    [-263, 108],  // Farm entrance
    [8,   323],   // Dock
    [-38, -323],  // South Beach
    [38,  -102],  // Residential east
    [-53, -108],  // Residential west
    [53,  27],    // Near post office path junction
    [-98, -30],   // Near bakery
    [120,  30],   // Near library
    [-120, 30],   // Near workshop
    [-45, -120],  // Residential area
    [45,  -120],  // Residential area
    [-255, 105],  // Near farm
    [45,  300],   // Near Jack's cottage
    [-63, -120],  // Near Barney's home
  ];
  for (const [px, pz] of mailboxSpots) {
    const mb = makeMailbox();
    placeOnTerrain(mb, px, pz);
    mb.rotation.y = Math.random() * Math.PI * 2;
    scene.add(mb);
  }

  // =====================================================================
  // LIBRARY (120, 60)
  // =====================================================================
  const library = makeLibraryBuilding();
  placeOnTerrain(library, 120, 60);
  library.rotation.y = 1.1;
  scene.add(library);

  // ─── Library Interior ──────────────────────────────────────────────
  {
    const lx = 120, lz = 60;
    const libBase = getHeight(lx, lz);

    // Wooden plank floor — long strips
    for (let fi = 0; fi < 6; fi++) {
      const plank = box(14, 0.06, 1.6, 0xc8a878);
      plank.position.set(lx, libBase + 0.03, lz - 4 + fi * 1.7);
      scene.add(plank);
    }

    // 4 tall bookshelves along walls
    // Back wall (z+5)
    for (let bi = 0; bi < 2; bi++) {
      const shelfBody = box(3.2, 3.8, 0.5, 0x8b6040);
      shelfBody.position.set(lx - 3.5 + bi * 7, libBase + 1.9, lz + 5);
      scene.add(shelfBody);
      // Books on back-wall shelves — 3 rows
      const bookColours = [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad, 0xc0392b, 0x2980b9];
      for (let row = 0; row < 3; row++) {
        for (let bk = 0; bk < 5; bk++) {
          const book = box(0.42, 0.75, 0.38, bookColours[(bi * 15 + row * 5 + bk) % bookColours.length]);
          book.position.set(lx - 3.5 + bi * 7 - 1.2 + bk * 0.6, libBase + 0.55 + row * 1.0, lz + 4.76);
          scene.add(book);
        }
      }
    }
    // Left wall (x-7)
    for (let bi = 0; bi < 2; bi++) {
      const shelfBody = box(0.5, 3.8, 3.2, 0x8b6040);
      shelfBody.position.set(lx - 7, libBase + 1.9, lz - 1.5 + bi * 3.5);
      scene.add(shelfBody);
      const bookColours2 = [0x27ae60, 0xf39c12, 0x8e44ad, 0xc0392b, 0x2980b9];
      for (let row = 0; row < 3; row++) {
        for (let bk = 0; bk < 4; bk++) {
          const book = box(0.38, 0.75, 0.44, bookColours2[(bi * 12 + row * 4 + bk) % bookColours2.length]);
          book.position.set(lx - 6.76, libBase + 0.55 + row * 1.0, lz - 1.5 + bi * 3.5 - 1.1 + bk * 0.72);
          scene.add(book);
        }
      }
    }

    // 2 reading tables in centre with 4 chairs each
    for (let ti = 0; ti < 2; ti++) {
      const tblX = lx - 2.5 + ti * 5;
      const tblZ = lz;
      // Table top
      const tTop = box(3.0, 0.1, 1.5, 0xd4b483);
      tTop.position.set(tblX, libBase + 1.1, tblZ);
      scene.add(tTop);
      // Legs
      for (const [dx, dz] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]]) {
        const tLeg = box(0.1, 1.1, 0.1, 0xb8925a);
        tLeg.position.set(tblX + dx, libBase + 0.55, tblZ + dz);
        scene.add(tLeg);
      }
      // 4 chairs — one on each side
      for (const [cx2, cz2, rotY] of [
        [tblX, tblZ - 1.1, 0],
        [tblX, tblZ + 1.1, Math.PI],
        [tblX - 1.8, tblZ, Math.PI / 2],
        [tblX + 1.8, tblZ, -Math.PI / 2],
      ]) {
        const seat = box(0.7, 0.08, 0.7, 0x9b6a3d);
        seat.position.set(cx2, libBase + 0.78, cz2);
        scene.add(seat);
        const back = box(0.7, 0.55, 0.08, 0x9b6a3d);
        back.rotation.y = rotY;
        back.position.set(cx2 + Math.sin(rotY) * 0.35, libBase + 1.06, cz2 + Math.cos(rotY) * 0.35);
        scene.add(back);
      }
    }

    // Librarian's desk near door (front, z-4)
    const libDesk = box(2.8, 1.0, 1.2, 0xb8925a);
    libDesk.position.set(lx + 2, libBase + 0.5, lz - 3.8);
    scene.add(libDesk);
    const libDeskTop = box(3.0, 0.08, 1.3, 0xd4b483);
    libDeskTop.position.set(lx + 2, libBase + 1.05, lz - 3.8);
    scene.add(libDeskTop);
    // Small lamp on desk
    const lampBase2 = cylinder(0.12, 0.15, 0.08, 0x888888, 6);
    lampBase2.position.set(lx + 2.8, libBase + 1.13, lz - 3.8);
    scene.add(lampBase2);
    const lampPole2 = cylinder(0.04, 0.04, 0.6, 0xaaaaaa, 5);
    lampPole2.position.set(lx + 2.8, libBase + 1.43, lz - 3.8);
    scene.add(lampPole2);
    const lampShade2 = cone(0.22, 0.3, 0xf5c842, 8);
    lampShade2.position.set(lx + 2.8, libBase + 1.88, lz - 3.8);
    scene.add(lampShade2);
    // Librarian chair
    const libChairSeat = box(0.7, 0.08, 0.7, 0x5c4033);
    libChairSeat.position.set(lx + 2, libBase + 0.75, lz - 3.0);
    scene.add(libChairSeat);
    const libChairBack = box(0.7, 0.6, 0.08, 0x5c4033);
    libChairBack.position.set(lx + 2, libBase + 1.1, lz - 2.65);
    scene.add(libChairBack);

    // Comfy corner armchair (0x8b4513, left front corner)
    const armSeat = box(1.1, 0.25, 1.0, 0x8b4513);
    armSeat.position.set(lx - 5.5, libBase + 0.62, lz - 3.5);
    scene.add(armSeat);
    const armBack = box(1.1, 0.9, 0.2, 0x8b4513);
    armBack.position.set(lx - 5.5, libBase + 1.12, lz - 3.98);
    scene.add(armBack);
    const armL = box(0.2, 0.35, 1.0, 0x7a3d10);
    armL.position.set(lx - 6.05, libBase + 0.82, lz - 3.5);
    scene.add(armL);
    const armR = box(0.2, 0.35, 1.0, 0x7a3d10);
    armR.position.set(lx - 4.95, libBase + 0.82, lz - 3.5);
    scene.add(armR);

    // Potted plant near window (right wall)
    const potBody = cylinder(0.22, 0.28, 0.45, 0xa0522d, 8);
    potBody.position.set(lx + 6.5, libBase + 0.23, lz - 3.5);
    scene.add(potBody);
    const plantStem = cylinder(0.08, 0.08, 0.6, 0x3a7d2c, 5);
    plantStem.position.set(lx + 6.5, libBase + 0.75, lz - 3.5);
    scene.add(plantStem);
    const plantLeaves = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 5), mat(0x27ae60));
    plantLeaves.position.set(lx + 6.5, libBase + 1.2, lz - 3.5);
    scene.add(plantLeaves);

    // Notice board on back wall — flat box with pinned papers
    const noticeBoard = box(3.0, 1.8, 0.12, 0xf5deb3);
    noticeBoard.position.set(lx - 2.5, libBase + 2.8, lz + 5.1);
    scene.add(noticeBoard);
    const noticeFr = box(3.2, 2.0, 0.1, 0x8b6040);
    noticeFr.position.set(lx - 2.5, libBase + 2.8, lz + 5.08);
    scene.add(noticeFr);
    // Pinned paper rectangles
    for (const [nx, ny, nc] of [
      [-0.9, 0.4, 0xee4444], [0.1, 0.5, 0x4499ee], [0.9, 0.2, 0x44cc88],
      [-0.4, -0.4, 0xffcc22], [0.7, -0.5, 0xcc66cc], [-0.8, -0.1, 0xff8844],
    ]) {
      const paper = box(0.5, 0.38, 0.08, nc);
      paper.position.set(lx - 2.5 + nx, libBase + 2.8 + ny, lz + 5.18);
      scene.add(paper);
    }
  }

  // Reading garden
  const readingGarden = makeGarden(4);
  placeOnTerrain(readingGarden, 138, 75);
  scene.add(readingGarden);

  const libBench = makeBench();
  placeOnTerrain(libBench, 108, 75);
  libBench.rotation.y = 0.5;
  scene.add(libBench);

  // Trees near library
  [[105, 45], [135, 45], [143, 83]].forEach(([x, z]) => {
    const tree = makeTree(5 + Math.random() * 3);
    placeOnTerrain(tree, x, z);
    scene.add(tree);
  });

  // =====================================================================
  // WORKSHOP (-120, 60)
  // =====================================================================
  // GARAGE / WORKSHOP (-120, 60) — open-front shed with truck inside
  // =====================================================================
  const workshop = makeOpenGarage();
  placeOnTerrain(workshop, -120, 60);
  workshop.rotation.y = 0.3;
  scene.add(workshop);

  // ─── Workshop Interior ─────────────────────────────────────────────
  {
    const wx = -120, wz = 60;
    const wBase = getHeight(wx, wz);

    // Concrete floor — large grey slab
    const concreteFloor = box(13, 0.06, 9, 0x999999);
    concreteFloor.position.set(wx, wBase + 0.03, wz);
    scene.add(concreteFloor);

    // Large workbench along back wall (z+3.5)
    const workbench = box(10, 0.15, 1.5, 0x8b7355);
    workbench.position.set(wx, wBase + 1.05, wz + 3.5);
    scene.add(workbench);
    // Workbench legs
    for (const dx of [-4.5, -1.5, 1.5, 4.5]) {
      const wbLeg = box(0.12, 1.05, 0.12, 0x6b5840);
      wbLeg.position.set(wx + dx, wBase + 0.53, wz + 3.5);
      scene.add(wbLeg);
    }
    // Tools on workbench — small box shapes
    const toolData = [
      [-4, 0x888888, 0.35, 0.25, 0.12],  // hammer head
      [-2.8, 0x666666, 0.12, 0.3, 0.6],  // screwdriver
      [-1.5, 0xaa4400, 0.5, 0.18, 0.18], // pliers body
      [0.2, 0x444444, 0.9, 0.18, 0.25],  // wrench
      [1.5, 0x999999, 0.18, 0.35, 0.18], // bolt/nut
      [2.8, 0x555555, 0.6, 0.25, 0.18],  // drill body
      [4.0, 0xff0000, 0.22, 0.22, 0.22], // small tool box
    ];
    for (const [dx, col, tw, th, td] of toolData) {
      const tool = box(tw, th, td, col);
      tool.position.set(wx + dx, wBase + 1.2, wz + 3.4);
      scene.add(tool);
    }

    // Stool in front of workbench
    const wStoolSeat = cylinder(0.32, 0.32, 0.08, 0x6b5840, 10);
    wStoolSeat.position.set(wx - 1, wBase + 0.88, wz + 2.3);
    scene.add(wStoolSeat);
    const wStoolLeg = cylinder(0.07, 0.09, 0.88, 0x8b7355, 5);
    wStoolLeg.position.set(wx - 1, wBase + 0.44, wz + 2.3);
    scene.add(wStoolLeg);

    // 3D printer / CNC machine — boxy with a moving arm
    const printerBase = box(1.8, 0.2, 1.5, 0x555555);
    printerBase.position.set(wx + 4, wBase + 0.1, wz - 1.5);
    scene.add(printerBase);
    const printerBody = box(1.6, 1.5, 1.3, 0x444444);
    printerBody.position.set(wx + 4, wBase + 0.95, wz - 1.5);
    scene.add(printerBody);
    const printerArm = box(1.4, 0.14, 0.14, 0x888888);
    printerArm.position.set(wx + 4, wBase + 1.7, wz - 1.5);
    scene.add(printerArm);
    const printerHead = box(0.25, 0.25, 0.25, 0x2980b9);
    printerHead.position.set(wx + 4, wBase + 1.55, wz - 1.5);
    scene.add(printerHead);
    // Light on printer
    const printerLight = box(0.18, 0.1, 0.1, 0x00ee44);
    printerLight.material = new THREE.MeshLambertMaterial({ color: 0x00ee44, emissive: 0x00aa22, emissiveIntensity: 0.7 });
    printerLight.position.set(wx + 4.55, wBase + 0.75, wz - 0.88);
    scene.add(printerLight);

    // Pegboard on left wall (x-6) with hanging tools
    const pegboard = box(0.1, 2.5, 5.0, 0xd4a96a);
    pegboard.position.set(wx - 6.1, wBase + 2.0, wz + 0.5);
    scene.add(pegboard);
    // Hanging tools on pegboard — small cylinders and boxes
    const pegTools = [
      [0, 0.8, 0.18, 0.04, 0.55, 0x888888, 'cyl'],  // screwdriver
      [0, -0.3, 0.18, 0.04, 0.6, 0x666666, 'cyl'],  // drill bit
      [0, 1.5, 0.3, 0.04, 0.45, 0xaa5500, 'cyl'],   // chisel handle
      [0, -0.9, 0.14, 0.3, 0.12, 0x444444, 'box'],  // box spanner
      [0, 0.2, 0.45, 0.1, 0.1, 0x777777, 'box'],    // small wrench
      [0, -1.5, 0.15, 0.05, 0.7, 0x999999, 'cyl'],  // file/rasp
    ];
    for (const [, dz, a, b, c, col, type] of pegTools) {
      if (type === 'cyl') {
        const t = cylinder(a, b, c, col, 6);
        t.rotation.z = Math.PI / 2;
        t.position.set(wx - 6.02, wBase + 2.1, wz + 0.5 + dz);
        scene.add(t);
      } else {
        const t = box(0.12, a, b, col);
        t.position.set(wx - 6.02, wBase + 2.1 + a / 2, wz + 0.5 + dz);
        scene.add(t);
      }
    }

    // Safety cabinet — tall narrow red box
    const safetyCAB = box(0.7, 2.0, 0.6, 0xff0000);
    safetyCAB.position.set(wx - 5.5, wBase + 1.0, wz + 3.5);
    scene.add(safetyCAB);
    const cabDoor = box(0.06, 1.7, 0.55, 0xcc0000);
    cabDoor.position.set(wx - 5.15, wBase + 1.0, wz + 3.5);
    scene.add(cabDoor);
    const cabHandle = box(0.1, 0.08, 0.08, 0xdddddd);
    cabHandle.position.set(wx - 5.1, wBase + 1.0, wz + 3.5);
    scene.add(cabHandle);

    // Bike repair stand with a wheel (torus)
    const bikeStand = box(0.12, 1.2, 0.12, 0x666666);
    bikeStand.position.set(wx + 1, wBase + 0.6, wz - 3.5);
    scene.add(bikeStand);
    const bikeStandArm = box(0.8, 0.1, 0.1, 0x888888);
    bikeStandArm.position.set(wx + 1, wBase + 1.25, wz - 3.5);
    scene.add(bikeStandArm);
    // Wheel — torus
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.07, 8, 20),
      mat(0x333333)
    );
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(wx + 1, wBase + 1.2, wz - 3.5);
    scene.add(wheel);
    // Wheel spokes — thin cylinders across diameter
    for (let s = 0; s < 6; s++) {
      const spokeAngle = (s / 6) * Math.PI;
      const spoke = cylinder(0.02, 0.02, 1.2, 0x888888, 4);
      spoke.rotation.z = spokeAngle;
      spoke.rotation.y = Math.PI / 2;
      spoke.position.set(wx + 1, wBase + 1.2, wz - 3.5);
      scene.add(spoke);
    }
  }

  // Solar panel array near workshop
  for (let i = 0; i < 4; i++) {
    const panel = box(4, 0.15, 3, C.solar);
    placeOnTerrain(panel, -143 + i * 8, 83, 2);
    panel.rotation.x = -0.5;
    const pole = cylinder(0.15, 0.15, 2, C.solarFrame, 4);
    placeOnTerrain(pole, -143 + i * 8, 83, 1);
    scene.add(panel, pole);
  }

  // Bike rack at workshop
  const workshopBikes = makeBikeRack();
  placeOnTerrain(workshopBikes, -108, 72);
  workshopBikes.rotation.y = 0.3;
  scene.add(workshopBikes);

  // =====================================================================
  // THE DOCK (0, 330)
  // =====================================================================
  const dock = makeDock();
  dock.position.set(0, 0.2, 370); // sit just above sea level
  dock.rotation.y = 0;
  scene.add(dock);

  // Boats
  const boat1 = makeBoat(1.2);
  boat1.position.set(12, -0.3, 348);
  boat1.rotation.y = 0.3;
  scene.add(boat1);

  const boat2 = makeBoat(0.8);
  boat2.position.set(-10, -0.3, 353);
  boat2.rotation.y = -0.5;
  scene.add(boat2);

  // Dock bollard lights / crates
  const crate1 = box(2, 2, 2, C.dock);
  crate1.position.set(5, 1, 338);
  scene.add(crate1);
  const crate2 = box(1.5, 1.5, 1.5, C.dock);
  crate2.position.set(6.5, 0.75, 337);
  scene.add(crate2);

  // =====================================================================
  // CAD-430: HARBOUR AMBIENT DETAIL PASS — crates, barrels, nets, ropes, mooring posts
  // =====================================================================

  // Extra crates — weathered wood brown stacked near dock
  const crate3 = box(1.8, 1.8, 1.8, 0x8b6914);
  crate3.position.set(-6, 0.9, 340);
  crate3.rotation.y = 0.4;
  scene.add(crate3);
  const crate4 = box(1.2, 1.2, 1.2, 0x7a5c12);
  crate4.position.set(-5.2, 0.6, 341.5);
  crate4.rotation.y = -0.3;
  scene.add(crate4);
  const crate5 = box(1.4, 1.4, 1.4, 0x8b6914);
  crate5.position.set(-5.8, 1.9, 340.3);
  crate5.rotation.y = 0.7;
  scene.add(crate5);

  // Barrels — dark wood near the fishery
  const barrelMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
  for (const [bx, bz, bRot] of [[8, 342, 0], [9.5, 343, 0.2], [10.2, 341, -0.15]]) {
    const barrel = cylinder(0.6, 0.65, 1.6, 0x5a3a1a, 8);
    barrel.position.set(bx, 0.8, bz);
    barrel.rotation.z = bRot;
    scene.add(barrel);
    // Barrel rim bands
    const band1 = cylinder(0.66, 0.66, 0.08, 0x4a4a4a, 8);
    band1.position.set(bx, 0.3, bz);
    band1.rotation.z = bRot;
    scene.add(band1);
    const band2 = cylinder(0.66, 0.66, 0.08, 0x4a4a4a, 8);
    band2.position.set(bx, 1.3, bz);
    band2.rotation.z = bRot;
    scene.add(band2);
  }

  // Mooring posts — thick stumpy bollards along the dock edge
  for (const [mx, mz] of [[-5, 365], [-5, 375], [5, 365], [5, 375]]) {
    const moorPost = cylinder(0.35, 0.45, 1.8, 0x6b4e1a, 6);
    moorPost.position.set(mx, 1.1, mz);
    scene.add(moorPost);
    // Top cap
    const moorCap = cylinder(0.48, 0.48, 0.15, 0x5a3a1a, 6);
    moorCap.position.set(mx, 2.05, mz);
    scene.add(moorCap);
  }

  // Rope coils on the ground near mooring posts
  for (const [rx, rz] of [[-3, 366], [3, 376]]) {
    const ropeCoil = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.08, 5, 12),
      new THREE.MeshLambertMaterial({ color: 0xb89e5c })
    );
    ropeCoil.rotation.x = Math.PI / 2;
    ropeCoil.position.set(rx, 0.15, rz);
    scene.add(ropeCoil);
  }

  // Fishing nets — flat plane meshes draped near the fishery drying area
  const netMat = new THREE.MeshLambertMaterial({ color: 0x8aaa7a, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const net1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), netMat);
  net1.position.set(35, 1.5, 348);
  net1.rotation.x = -0.3;
  net1.rotation.y = 0.5;
  scene.add(net1);
  const net2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.5), netMat);
  net2.position.set(37, 1.2, 350);
  net2.rotation.x = -0.2;
  net2.rotation.y = -0.3;
  scene.add(net2);

  // Rope lines between mooring posts (simple thin cylinders)
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0xb89e5c });
  const ropeLine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 10, 4), ropeMat);
  ropeLine1.position.set(-5, 1.8, 370);
  ropeLine1.rotation.x = Math.PI / 2;
  scene.add(ropeLine1);
  const ropeLine2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 10, 4), ropeMat);
  ropeLine2.position.set(5, 1.8, 370);
  ropeLine2.rotation.x = Math.PI / 2;
  scene.add(ropeLine2);

  // Fish market stall area — simple wooden tables near the fishery
  const stallTable1 = box(4, 0.15, 2, 0x8b6914);
  stallTable1.position.set(30, 1.0, 355);
  scene.add(stallTable1);
  const stallLeg1a = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg1a.position.set(28.5, 0.5, 354); scene.add(stallLeg1a);
  const stallLeg1b = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg1b.position.set(31.5, 0.5, 354); scene.add(stallLeg1b);
  const stallLeg1c = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg1c.position.set(28.5, 0.5, 356); scene.add(stallLeg1c);
  const stallLeg1d = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg1d.position.set(31.5, 0.5, 356); scene.add(stallLeg1d);

  const stallTable2 = box(3.5, 0.15, 2, 0x7a5c12);
  stallTable2.position.set(25, 1.0, 355);
  scene.add(stallTable2);
  const stallLeg2a = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg2a.position.set(23.5, 0.5, 354); scene.add(stallLeg2a);
  const stallLeg2b = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg2b.position.set(26.5, 0.5, 354); scene.add(stallLeg2b);
  const stallLeg2c = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg2c.position.set(23.5, 0.5, 356); scene.add(stallLeg2c);
  const stallLeg2d = cylinder(0.08, 0.08, 1.0, 0x6b4e1a, 4);
  stallLeg2d.position.set(26.5, 0.5, 356); scene.add(stallLeg2d);

  // =====================================================================
  // THE MILL (-180, 60) — between workshop and farm  (CAD-365)
  // =====================================================================
  const millGroup = buildMill();
  placeOnTerrain(millGroup, -180, 60);
  millGroup.rotation.y = 0.4;
  scene.add(millGroup);

  // A couple of trees around the mill
  [[-195, 45], [-165, 78]].forEach(([x, z]) => {
    const t = makeTree(5 + Math.random() * 2);
    placeOnTerrain(t, x, z);
    scene.add(t);
  });

  // Delivery van (Felix drives this — position updated by Felix NPC each frame)
  buildDeliveryVan(scene);

  // =====================================================================
  // THE FARM (-270, 120)
  // =====================================================================
  // Barn
  const barn = makeBarn();
  placeOnTerrain(barn, -270, 105);
  barn.rotation.y = 0.2;
  scene.add(barn);

  // Fields
  const field1 = makeField(25, 18);
  placeOnTerrain(field1, -300, 150);
  scene.add(field1);

  const field2 = makeField(20, 15);
  placeOnTerrain(field2, -248, 158);
  field2.rotation.y = 0.3;
  scene.add(field2);

  const field3 = makeField(18, 12);
  placeOnTerrain(field3, -293, 98);
  field3.rotation.y = -0.2;
  scene.add(field3);

  // Greenhouse
  const greenhouse = makeBuilding(10, 5, 14, C.greenhouse, 0x2ecc71, { solarPanels: false, label: 'Greenhouse' });
  placeOnTerrain(greenhouse, -240, 135);
  greenhouse.rotation.y = 0.2;
  greenhouse.children[0].material = new THREE.MeshLambertMaterial({ color: C.greenhouse, transparent: true, opacity: 0.6 });
  scene.add(greenhouse);

  // Fences around farm
  const fence1 = makeFence(30, 8);
  placeOnTerrain(fence1, -293, 128);
  scene.add(fence1);

  const fence2 = makeFence(25, 6);
  placeOnTerrain(fence2, -263, 173);
  fence2.rotation.y = Math.PI / 2;
  scene.add(fence2);

  // Scattered farm trees
  [[-308, 83], [-225, 113], [-315, 165]].forEach(([x, z]) => {
    const tree = makeTree(5 + Math.random() * 3);
    placeOnTerrain(tree, x, z);
    scene.add(tree);
  });

  // =====================================================================
  // FOREST (270, 180) — dense enclosed wood, discoveries inside
  // =====================================================================

  // --- Outer canopy wall — tall dark trees forming a barrier ---
  const outerWall = [
    // North edge
    [245,135],[258,133],[272,132],[286,133],[300,136],[313,140],[323,148],
    // East edge
    [330,158],[333,170],[335,183],[334,196],[330,208],[325,218],[318,227],
    // South edge
    [308,233],[295,237],[281,238],[267,237],[253,234],[241,228],[231,220],
    // West edge — gap around x:215,z:175 for the path entrance
    [223,210],[217,198],[214,185],[215,172],[218,158],[224,147],[233,140],
  ];
  outerWall.forEach(([x, z]) => {
    const height = 11 + Math.random() * 4;
    const tree = makeTree(height, C.foliageDark);
    placeOnTerrain(tree, x + Math.random() * 3 - 1.5, z + Math.random() * 3 - 1.5);
    tree.rotation.y = Math.random() * Math.PI;
    scene.add(tree);
  });

  // --- Mid-ring — mixed height trees, still dense ---
  const midRing = [
    [250,148],[262,144],[276,145],[290,148],[302,154],[312,163],
    [317,175],[316,188],[312,200],[304,211],[292,218],[279,221],
    [265,220],[252,216],[242,208],[235,196],[233,183],[235,170],
    [240,159],[247,152],
    // Extra fill around the inner area
    [258,160],[272,156],[286,160],[298,167],[305,180],[302,193],
    [290,204],[276,208],[262,206],[250,200],[244,189],[243,176],
  ];
  midRing.forEach(([x, z]) => {
    const height = 8 + Math.random() * 5;
    const color = Math.random() > 0.4 ? C.foliageDark : C.foliage;
    const tree = makeTree(height, color);
    placeOnTerrain(tree, x + Math.random() * 4 - 2, z + Math.random() * 4 - 2);
    tree.rotation.y = Math.random() * Math.PI;
    scene.add(tree);
  });

  // --- Extra forest trees: gap-fill mid-ring, sentinel corners, entrance scatter ---
  const extraForestTrees = [
    // Fill gaps in mid-ring interior
    [255,155],[263,150],[270,153],[279,150],[288,154],[296,160],
    [310,170],[313,182],[310,195],[306,205],[298,214],[285,220],
    [272,222],[259,219],[248,213],[239,204],[234,192],[233,178],
    [236,164],[241,155],[248,160],[258,168],[267,162],[277,166],
    [287,162],[296,170],[303,177],[305,190],[299,200],[288,207],
    [275,212],[261,210],[251,204],[243,196],[239,185],[240,172],
    // Sentinel trees at forest corners (taller, darker)
    [243,133],[327,145],[337,215],[227,225],
    // Scattered just outside the forest entrance path (west side)
    [208,180],[210,168],[212,158],[206,193],[204,172],
  ];
  extraForestTrees.forEach(([x, z]) => {
    const height = 8 + Math.random() * 5;
    const color = Math.random() > 0.3 ? C.foliageDark : C.foliage;
    const tree = makeTree(height, color);
    placeOnTerrain(tree, x + Math.random() * 3 - 1.5, z + Math.random() * 3 - 1.5);
    tree.rotation.y = Math.random() * Math.PI;
    scene.add(tree);
  });

  // --- Undergrowth: ferns scattered between the trunks ---
  const fernSpots = [
    [253,163],[260,170],[268,165],[275,171],[284,165],[291,173],
    [298,179],[305,186],[296,193],[287,199],[279,205],[269,202],
    [258,198],[249,193],[243,185],[245,175],[252,170],[259,179],
    [270,188],[282,178],[270,198],[255,186],[264,193],[248,180],
    [278,185],[290,185],[264,172],[283,193],
  ];
  const fernMat = new THREE.MeshLambertMaterial({ color: 0x2d7a3a });
  fernSpots.forEach(([fx, fz]) => {
    for (let f = 0; f < 3; f++) {
      const bx = fx + (Math.random() - 0.5) * 4;
      const bz = fz + (Math.random() - 0.5) * 4;
      const h = getHeight(bx, bz);
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55 + Math.random() * 0.3, 0.7, 5), fernMat);
      frond.position.set(bx, h + 0.25, bz);
      frond.rotation.x = 0.5 + Math.random() * 0.4;
      frond.rotation.y = Math.random() * Math.PI * 2;
      scene.add(frond);
    }
  });

  // --- Mushroom clusters ---
  const mushroomCapM = new THREE.MeshLambertMaterial({ color: 0xb03020 });
  const mushroomStemM = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
  [[258,183],[271,175],[284,197],[295,183],[262,196],[275,163]].forEach(([mx,mz]) => {
    for (let m = 0; m < 4; m++) {
      const bx = mx + (Math.random() - 0.5) * 3;
      const bz = mz + (Math.random() - 0.5) * 3;
      const h = getHeight(bx, bz);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6), mushroomStemM);
      stem.position.set(bx, h + 0.11, bz);
      scene.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random()*0.06, 7, 5, 0, Math.PI*2, 0, Math.PI*0.6), mushroomCapM);
      cap.position.set(bx, h + 0.25, bz);
      scene.add(cap);
    }
  });

  // --- Fallen log ---
  const forestLogMat = mat(0x5a3a1a);
  const forestFallenLog = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 4.5, 8), forestLogMat);
  forestFallenLog.rotation.z = Math.PI / 2;
  forestFallenLog.rotation.y = 0.7;
  placeOnTerrain(forestFallenLog, 268, 190, 0.3);
  scene.add(forestFallenLog);

  // --- Log seats around campfire ---
  makePath(scene, 195, 168, 222, 172, 3.5);   // approach from outside
  makePath(scene, 222, 172, 238, 178, 3);       // enter the canopy
  makePath(scene, 238, 178, 253, 181, 2.5);     // bend right
  makePath(scene, 253, 181, 264, 183, 2.5);     // reach the clearing

  // Fork: left to Jin's station
  makePath(scene, 264, 183, 262, 165, 2);

  // Fork: right deeper to treehouse
  makePath(scene, 264, 183, 278, 188, 2);

  // --- Campfire clearing — central heart of the forest ---
  const campfire = makeCampfire();
  placeOnTerrain(campfire, 272, 183);
  scene.add(campfire);

  // A log-seat ring around the fire
  [[268,180],[276,180],[280,185],[268,187]].forEach(([bx,bz],i) => {
    const logSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 2.2, 6), forestLogMat);
    logSeat.rotation.z = Math.PI / 2;
    logSeat.rotation.y = i * (Math.PI / 2) + 0.3;
    placeOnTerrain(logSeat, bx, bz, 0.25);
    scene.add(logSeat);
  });

  // A small clearing bench beside the campfire
  const forestBench = makeBench();
  placeOnTerrain(forestBench, 265, 177);
  forestBench.rotation.y = 2.4; // face the fire
  scene.add(forestBench);

  // =====================================================================
  // JIN'S RESEARCH STATION (262, 158) — botanist's field camp
  // Folding table with specimen jars, notebook, stool, and field stake
  // =====================================================================
  {
    const jinBase = getHeight(262, 158);
    const jinMat = color => new THREE.MeshLambertMaterial({ color });

    // Folding table — thin plywood top, metal legs
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), jinMat(0xd4b483));
    tableTop.position.set(262, jinBase + 0.88, 158);
    scene.add(tableTop);

    // Table legs (4)
    [[0.95, 0.48], [-0.95, 0.48], [0.95, -0.48], [-0.95, -0.48]].forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.84, 4), jinMat(0x888888));
      leg.position.set(262 + ox, jinBase + 0.42, 158 + oz);
      scene.add(leg);
    });

    // Specimen jars (3 small glass cylinders on the table)
    [[-0.6, 0], [0, 0.1], [0.55, -0.05]].forEach(([ox, oz], i) => {
      const jarH = 0.22 + i * 0.06;
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, jarH, 7),
        new THREE.MeshLambertMaterial({ color: 0x99ddf0, transparent: true, opacity: 0.55 })
      );
      jar.position.set(262 + ox, jinBase + 0.88 + jarH / 2 + 0.04, 158 + oz);
      scene.add(jar);
      // Lid
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 7), jinMat(0xb0b0b0));
      lid.position.set(262 + ox, jinBase + 0.88 + jarH + 0.06, 158 + oz);
      scene.add(lid);
    });

    // Notebook (flat book on table)
    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.65), jinMat(0x2e7d32));
    notebook.position.set(262 + 0.6, jinBase + 0.92, 158 - 0.25);
    notebook.rotation.y = 0.15;
    scene.add(notebook);

    // Stool beside the table
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.08, 8), jinMat(0xb87c44));
    stoolTop.position.set(262 - 1.5, jinBase + 0.56, 158 + 0.2);
    scene.add(stoolTop);
    [[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]].forEach(([ox, oz]) => {
      const sleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.54, 4), jinMat(0x666666));
      sleg.position.set(262 - 1.5 + ox, jinBase + 0.27, 158 + 0.2 + oz);
      scene.add(sleg);
    });

    // Field stake with flag — marks the research plot
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 5), jinMat(0x8b4513));
    stake.position.set(262 + 1.4, jinBase + 0.8, 158 - 0.7);
    scene.add(stake);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.02), jinMat(0xf5c518));
    flag.position.set(262 + 1.67, jinBase + 1.38, 158 - 0.69);
    scene.add(flag);
  }

  // =====================================================================
  // PETRA'S TREEHOUSE (282, 192) — raised platform in the forest canopy
  // =====================================================================
  {
    const thBase = getHeight(282, 192);
    const stiltsH = 5.5;
    const platformY = thBase + stiltsH;
    const stiltM = mat(0x6b4c2a);
    const planksM = mat(0xc8a878);

    // Four stilts
    [[279, 189], [285, 189], [279, 195], [285, 195]].forEach(([sx, sz]) => {
      const h = getHeight(sx, sz);
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, stiltsH + (thBase - h) + 0.3, 6), stiltM);
      stilt.position.set(sx, h + (stiltsH + (thBase - h)) / 2, sz);
      scene.add(stilt);
    });

    // Platform floor
    const platform = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 5.5), planksM);
    platform.position.set(282, platformY, 192);
    scene.add(platform);

    // Railing posts
    const railingPts = [
      [277.5, 189], [280.5, 189], [282.5, 189], [285.5, 189],
      [277.5, 195], [285.5, 195],
    ];
    railingPts.forEach(([rx, rz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 4), stiltM);
      post.position.set(rx, platformY + 0.57, rz);
      scene.add(post);
    });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.06, 0.06), stiltM);
    rail1.position.set(282, platformY + 0.9, 189); scene.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6.5), stiltM);
    rail2.position.set(277.5, platformY + 0.9, 192); scene.add(rail2);
    const rail3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6.5), stiltM);
    rail3.position.set(285.5, platformY + 0.9, 192); scene.add(rail3);

    // Cabin on the platform
    const cabin = makeBuilding(4.5, 3.5, 4, 0xb8936a, 0x7a5030, { label: "Petra's Treehouse" });
    cabin.position.set(282, platformY + 0.13, 192.5);
    cabin.rotation.y = 0.4;
    scene.add(cabin);
    cabin.userData.buildingId = 'petras-treehouse';

    // Rope ladder from ground to platform
    const ladderSideM = mat(0x8a6840);
    const rungM = mat(0x7a5830);
    [-0.18, 0.18].forEach(ox => {
      const side = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, stiltsH + 0.5, 4), ladderSideM);
      side.position.set(280.5 + ox, thBase + (stiltsH / 2), 187.5);
      scene.add(side);
    });
    for (let ri = 0; ri < 8; ri++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.36, 4), rungM);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(280.5, thBase + 0.6 + ri * 0.72, 187.5);
      scene.add(rung);
    }

    // Petra's paint canvas on the railing
    const canvasFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.04), mat(0x6b4c2a));
    canvasFrame.position.set(285, platformY + 1.1, 191);
    canvasFrame.rotation.y = -0.8;
    scene.add(canvasFrame);
    const painting = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xfff5e0 }));
    painting.position.set(285, platformY + 1.1, 191.02);
    painting.rotation.y = -0.8;
    scene.add(painting);
  }

  // =====================================================================
  // THE HILLTOP (-150, -270)
  // =====================================================================
  const windmillGroup = makeWindmill();
  placeOnTerrain(windmillGroup, -150, -270);
  scene.add(windmillGroup);

  // Viewpoint bench
  const hilltopBench = makeBench();
  placeOnTerrain(hilltopBench, -135, -263);
  hilltopBench.rotation.y = 0.8;
  scene.add(hilltopBench);

  // A few trees on the hill
  [[-165, -255], [-173, -285], [-128, -285]].forEach(([x, z]) => {
    const tree = makeTree(4 + Math.random() * 2);
    placeOnTerrain(tree, x, z);
    scene.add(tree);
  });

  // Solar panel cluster on hilltop
  for (let i = 0; i < 3; i++) {
    const panel = box(5, 0.15, 3.5, C.solar);
    placeOnTerrain(panel, -180 + i * 12, -278, 2.5);
    panel.rotation.x = -0.5;
    const pole = cylinder(0.15, 0.15, 2.5, C.solarFrame, 4);
    placeOnTerrain(pole, -180 + i * 12, -278, 1.25);
    scene.add(panel, pole);
  }

  // =====================================================================
  // SOUTH BEACH (0, -330)
  // =====================================================================
  // Extra sand strip
  const sandStrip = flatPlane(80, 30, C.sand);
  sandStrip.position.set(0, 0.05, -338);
  scene.add(sandStrip);

  // Beach umbrellas (simple cone + pole)
  const umbrellaPositions = [[-23, -323], [0, -330], [23, -327], [38, -338]];
  umbrellaPositions.forEach(([x, z]) => {
    const pole = cylinder(0.15, 0.15, 3, C.trunk, 4);
    pole.position.set(x, 1.5, z);
    scene.add(pole);
    const shade = cone(2.5, 1, [0xe17055, 0x4a90d9, 0xfdcb6e, 0xa29bfe][Math.floor(Math.random() * 4)], 6);
    shade.position.set(x, 3.2, z);
    scene.add(shade);
  });

  // Driftwood / logs
  const log1 = cylinder(0.3, 0.25, 4, 0x9e8a6e, 5);
  log1.rotation.z = Math.PI / 2;
  log1.position.set(-38, 0.3, -345);
  log1.rotation.y = 0.4;
  scene.add(log1);

  // =====================================================================
  // Scattered houses around town
  // =====================================================================
  const houses = [
    { pos: [-45, -30], color: C.house1, rot: 0.3, label: 'House' },
    { pos: [-60, 15],  color: C.house2, rot: -0.2, label: 'House' },
    { pos: [53, 23],   color: C.house3, rot: 0.5, label: 'House' },
    { pos: [60, -23],  color: C.house4, rot: -0.4, label: 'House' },
    { pos: [-23, -90], color: C.house5, rot: 0.1, label: 'House' },
    { pos: [38, -98],  color: C.house1, rot: -0.3, label: 'House' },
    { pos: [-68, -90], color: C.house3, rot: 0.4, label: 'House' },
    { pos: [68, 90],   color: C.house2, rot: -0.6, label: 'House' },
    { pos: [-75, 105], color: C.house4, rot: 0.2, label: 'House' },
    { pos: [-180, -90], color: C.house5, rot: -0.1, label: 'House' },
    { pos: [180, -30], color: C.house1, rot: 0.5, label: 'House' },
    { pos: [-45, 180], color: C.house2, rot: -0.3, label: 'House' },
  ];
  houses.forEach(cfg => {
    const house = makeBuilding(8, 5.5, 7, cfg.color, C.roof, { solarPanels: Math.random() > 0.3, label: cfg.label });
    placeOnTerrain(house, cfg.pos[0], cfg.pos[1]);
    house.rotation.y = cfg.rot;
    scene.add(house);
  });

  // =====================================================================
  // Scattered trees across the island
  // =====================================================================
  const scatteredTrees = [
    // Along paths / midpoints
    [0, 60], [0, 120], [0, 180], [0, 240], [0, 293],
    [-45, 90], [45, 105], [-150, 90], [150, 120],
    // Northern area
    [-60, -150], [30, -180], [-120, -150], [120, -150],
    [-210, -180], [210, -120], [-90, -210], [90, -195],
    // Southern scatter
    [60, 270], [-60, 255], [120, 255], [-120, 240],
    // East/west scatter
    [210, 30], [-210, 45], [180, 90], [-180, 75],
    [240, 75], [-240, 60],
    // Edge of island
    [-300, -150], [300, -120], [-330, 0], [330, 45],
    [0, -270], [-270, -60], [270, -45],
    [-360, 60], [360, 90], [0, 390],
    [-225, 240], [225, 255], [-345, 150], [345, 120],
  ];
  scatteredTrees.forEach(([x, z]) => {
    const dist = Math.sqrt(x * x + z * z);
    const angle = Math.atan2(z, x);
    if (dist > effectiveRadius(angle) - 10) return; // skip if off the island
    const height = 5 + Math.random() * 4;
    const color = Math.random() > 0.3 ? C.foliage : C.foliageDark;
    const tree = makeTree(height, color);
    placeOnTerrain(tree, x + Math.random() * 3 - 1.5, z + Math.random() * 3 - 1.5);
    tree.rotation.y = Math.random() * Math.PI;
    scene.add(tree);
  });

  // =====================================================================
  // Extra details — gardens, bike racks
  // =====================================================================
  // Garden near workshop
  const workshopGarden = makeGarden(5);
  placeOnTerrain(workshopGarden, -105, 83);
  scene.add(workshopGarden);

  // Garden near farm
  const farmGarden = makeGarden(4);
  placeOnTerrain(farmGarden, -248, 90);
  scene.add(farmGarden);

  // Extra benches along paths
  const benchSpots = [[-45, 0], [45, -8], [0, 150], [0, 225], [-60, -120]];
  benchSpots.forEach(([x, z]) => {
    const b = makeBench();
    placeOnTerrain(b, x, z);
    b.rotation.y = Math.random() * Math.PI;
    scene.add(b);
  });

  // =====================================================================
  // THE ANCHOR — Pub/Inn (-45, -105)
  // =====================================================================
  const pub = makeBuilding(13, 7, 10, 0xc8a56e, 0x5c3d1e, { solarPanels: false, label: 'The Anchor', signText: '⚓ The Anchor', signBg: 0x1a1a2e, signColor: 0xffd700, hollow: true });
  placeOnTerrain(pub, -45, -105);
  pub.rotation.y = 0.1;
  scene.add(pub);

  // ─── The Anchor Interior ───────────────────────────────────────────
  {
    const ax = -45, az = -105;
    const anchorBase = getHeight(ax, az);

    // Stone floor tiles — grey boxes in a grid
    for (let fi = 0; fi < 5; fi++) {
      for (let fj = 0; fj < 4; fj++) {
        const tile = box(2.2, 0.05, 2.2, fi % 2 === fj % 2 ? 0x888888 : 0x777777);
        tile.position.set(ax - 4.4 + fi * 2.2, anchorBase + 0.025, az - 3.3 + fj * 2.2);
        scene.add(tile);
      }
    }

    // Long bar counter along back wall (z+4)
    const barCounter = box(9, 1.15, 0.85, 0x5c3d1e);
    barCounter.position.set(ax, anchorBase + 0.58, az + 4);
    scene.add(barCounter);
    const barTop = box(9.2, 0.1, 1.0, 0x8b6040);
    barTop.position.set(ax, anchorBase + 1.2, az + 4);
    scene.add(barTop);

    // Bottle shelves behind bar — on back wall
    for (let row = 0; row < 3; row++) {
      const shelf = box(8.5, 0.08, 0.3, 0x6b4226);
      shelf.position.set(ax, anchorBase + 1.8 + row * 0.7, az + 4.7);
      scene.add(shelf);
      // Bottles — thin cylinders in amber/green
      for (let b = 0; b < 10; b++) {
        const bottleCol = b % 3 === 0 ? 0x2e7d32 : b % 3 === 1 ? 0xc47c2b : 0x5d4037;
        const bottle = cylinder(0.07, 0.09, 0.45, bottleCol, 6);
        bottle.position.set(ax - 4 + b * 0.88, anchorBase + 2.05 + row * 0.7, az + 4.72);
        scene.add(bottle);
      }
    }

    // 5 bar stools in front of bar
    for (let s = 0; s < 5; s++) {
      const stoolSeat = cylinder(0.28, 0.28, 0.08, 0x8b4513, 10);
      stoolSeat.position.set(ax - 4 + s * 2, anchorBase + 0.9, az + 2.9);
      scene.add(stoolSeat);
      const stoolLeg = cylinder(0.06, 0.08, 0.9, 0x5c3d1e, 5);
      stoolLeg.position.set(ax - 4 + s * 2, anchorBase + 0.45, az + 2.9);
      scene.add(stoolLeg);
    }

    // 4 round pub tables with stools
    for (const [tx, tz, ns] of [
      [ax - 3, az - 2.5, 3],
      [ax + 3, az - 2.5, 4],
      [ax - 3, az + 0.5, 3],
      [ax + 3, az + 0.5, 4],
    ]) {
      const ptTop = cylinder(0.7, 0.7, 0.1, 0x9b6a3d, 12);
      ptTop.position.set(tx, anchorBase + 0.95, tz);
      scene.add(ptTop);
      const ptLeg = cylinder(0.08, 0.12, 0.95, 0x6b4226, 6);
      ptLeg.position.set(tx, anchorBase + 0.48, tz);
      scene.add(ptLeg);
      // Stools around each table
      for (let s = 0; s < ns; s++) {
        const angle = (s / ns) * Math.PI * 2;
        const sx = tx + Math.cos(angle) * 1.1;
        const sz2 = tz + Math.sin(angle) * 1.1;
        const pSeat = cylinder(0.25, 0.25, 0.07, 0x8b4513, 8);
        pSeat.position.set(sx, anchorBase + 0.82, sz2);
        scene.add(pSeat);
        const pLeg = cylinder(0.05, 0.07, 0.82, 0x5c3d1e, 5);
        pLeg.position.set(sx, anchorBase + 0.41, sz2);
        scene.add(pLeg);
      }
    }

    // Dartboard on right wall (x+6)
    const dartOuter = cylinder(0.55, 0.55, 0.08, 0x2c3e50, 20);
    dartOuter.rotation.z = Math.PI / 2;
    dartOuter.position.set(ax + 6.1, anchorBase + 2.4, az + 1.5);
    scene.add(dartOuter);
    const dartRing1 = cylinder(0.42, 0.42, 0.09, 0xe74c3c, 20);
    dartRing1.rotation.z = Math.PI / 2;
    dartRing1.position.set(ax + 6.12, anchorBase + 2.4, az + 1.5);
    scene.add(dartRing1);
    const dartRing2 = cylinder(0.28, 0.28, 0.1, 0xecf0f1, 20);
    dartRing2.rotation.z = Math.PI / 2;
    dartRing2.position.set(ax + 6.14, anchorBase + 2.4, az + 1.5);
    scene.add(dartRing2);
    const dartBull = cylinder(0.1, 0.1, 0.11, 0x2c3e50, 12);
    dartBull.rotation.z = Math.PI / 2;
    dartBull.position.set(ax + 6.16, anchorBase + 2.4, az + 1.5);
    scene.add(dartBull);

    // Fireplace (left wall, x-6) — stone surround with fire glow
    const fireBase = box(1.6, 0.2, 1.2, 0x555555);
    fireBase.position.set(ax - 6, anchorBase + 0.1, az - 0.5);
    scene.add(fireBase);
    const fireSurround = box(2.0, 2.5, 0.3, 0x666666);
    fireSurround.position.set(ax - 6.1, anchorBase + 1.25, az - 1.0);
    scene.add(fireSurround);
    const fireBack = box(1.5, 1.8, 0.2, 0x333333);
    fireBack.position.set(ax - 6.1, anchorBase + 0.9, az - 0.82);
    scene.add(fireBack);
    // Fire — emissive cone
    const fireMesh = cone(0.35, 0.75, 0xff6600, 6);
    fireMesh.material = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8 });
    fireMesh.position.set(ax - 6.1, anchorBase + 0.58, az - 0.9);
    scene.add(fireMesh);
    const fireInner = cone(0.18, 0.5, 0xffdd00, 5);
    fireInner.material = new THREE.MeshLambertMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 1.0 });
    fireInner.position.set(ax - 6.1, anchorBase + 0.62, az - 0.9);
    scene.add(fireInner);

    // Small stage area in back-right corner with microphone stand
    const stageRiser = box(3.0, 0.22, 2.5, 0x6b4226);
    stageRiser.position.set(ax + 4.5, anchorBase + 0.11, az - 2.8);
    scene.add(stageRiser);
    // Microphone stand
    const micBase2 = cylinder(0.28, 0.32, 0.06, 0x444444, 8);
    micBase2.position.set(ax + 4.5, anchorBase + 0.35, az - 2.8);
    scene.add(micBase2);
    const micPole2 = cylinder(0.04, 0.04, 1.2, 0x888888, 5);
    micPole2.position.set(ax + 4.5, anchorBase + 0.95, az - 2.8);
    scene.add(micPole2);
    const micHead = cylinder(0.1, 0.1, 0.2, 0x333333, 8);
    micHead.position.set(ax + 4.5, anchorBase + 1.65, az - 2.8);
    scene.add(micHead);
  }

  // =====================================================================
  // SCHOOL (60, -105)
  // =====================================================================
  const school = makeBuilding(18, 7, 12, 0xf9ca24, 0x6ab04c, { solarPanels: true, label: 'School', signText: '🏫 School', signBg: 0xffffff, signColor: 0x333333, hollow: true });
  placeOnTerrain(school, 60, -105);
  school.rotation.y = -0.15;
  scene.add(school);

  // ─── School Interior ──────────────────────────────────────────────
  {
    const sx2 = 60, sz2 = -105;
    const sBase = getHeight(sx2, sz2);
    const deskMat2 = new THREE.MeshLambertMaterial({ color: 0xc8a850 });
    const seatMat2 = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });

    // Blackboard on front wall (+z inside)
    const blackboard = box(9, 3.2, 0.2, 0x1a3a2a);
    blackboard.position.set(sx2, sBase + 3.5, sz2 + 5.6);
    scene.add(blackboard);
    const bbFrame = box(9.3, 3.5, 0.15, 0x6b4226);
    bbFrame.position.set(sx2, sBase + 3.5, sz2 + 5.55);
    scene.add(bbFrame);

    // Chalk tray below board
    const chalkTray = box(9, 0.15, 0.3, 0x8b6914);
    chalkTray.position.set(sx2, sBase + 1.82, sz2 + 5.55);
    scene.add(chalkTray);

    // Teacher's desk at front (near blackboard)
    const tDesk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.8), deskMat2);
    tDesk.position.set(sx2, sBase + 1.22, sz2 + 3.5);
    scene.add(tDesk);
    for (const [lx, lz] of [[-1.7,-0.75],[1.7,-0.75],[-1.7,0.75],[1.7,0.75]]) {
      const leg = box(0.14, 1.22, 0.14, 0x9b6a3d);
      leg.position.set(sx2 + lx, sBase + 0.61, sz2 + 3.5 + lz);
      scene.add(leg);
    }
    // Teacher's chair
    const tChairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), seatMat2);
    tChairSeat.position.set(sx2, sBase + 0.88, sz2 + 2.4);
    scene.add(tChairSeat);
    const tChairBack = box(0.9, 0.8, 0.1, 0x6b8e23);
    tChairBack.position.set(sx2, sBase + 1.32, sz2 + 1.97);
    scene.add(tChairBack);

    // Globe on teacher's desk
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2980b9 }));
    globe.position.set(sx2 + 1.5, sBase + 1.45, sz2 + 3.5);
    scene.add(globe);
    const globeStand = cylinder(0.06, 0.08, 0.3, 0x888888, 6);
    globeStand.position.set(sx2 + 1.5, sBase + 1.27, sz2 + 3.5);
    scene.add(globeStand);

    // Rows of student desks — 3 columns × 3 rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dX = sx2 - 5 + col * 4.5;
        const dZ = sz2 - 3.5 + row * 2.8;
        // Desk top
        const sDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.0), deskMat2);
        sDesk.position.set(dX, sBase + 1.0, dZ);
        scene.add(sDesk);
        // Desk leg
        const dLeg = box(0.1, 1.0, 0.1, 0x9b6a3d);
        dLeg.position.set(dX, sBase + 0.5, dZ + 0.2);
        scene.add(dLeg);
        // Student chair (seat only for performance)
        const sSeat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), seatMat2);
        sSeat.position.set(dX, sBase + 0.72, dZ - 1.0);
        scene.add(sSeat);
        const sBack = box(0.75, 0.55, 0.08, 0x6b8e23);
        sBack.position.set(dX, sBase + 1.02, dZ - 1.35);
        scene.add(sBack);
      }
    }

    // Bookshelves along back wall (-z)
    for (let bi = 0; bi < 3; bi++) {
      const shelf = box(4.5, 3.5, 0.4, 0x9b6a3d);
      shelf.position.set(sx2 - 7 + bi * 6, sBase + 1.75, sz2 - 5.6);
      scene.add(shelf);
      // Books on each shelf unit
      for (let b = 0; b < 6; b++) {
        const bkCol = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c][b];
        const bk = box(0.5, 2.6, 0.35, bkCol);
        bk.position.set(sx2 - 7 + bi * 6 - 1.8 + b * 0.65, sBase + 1.75, sz2 - 5.42);
        scene.add(bk);
      }
    }
  }

  // =====================================================================
  // THE CAFÉ (8, -83)
  // =====================================================================
  const cafeBuilding = makeBuilding(10, 6, 8, 0xf0e6d3, 0x5c3d1e, {
    solarPanels: false,
    label: 'The Café',
    signText: '☕ The Café',
    signBg: 0x2d1a0e,
    signColor: 0xffd700,
    hollow: true,
  });
  placeOnTerrain(cafeBuilding, 8, -83);
  cafeBuilding.rotation.y = 0.15;
  scene.add(cafeBuilding);

  // ─── Café Interior ────────────────────────────────────────────────
  {
    const cx = 8, cz = -83;
    const cBase = getHeight(cx, cz);

    // Counter along back wall with coffee machine
    const cCounter = box(6, 1.1, 0.9, 0x7b4d2a);
    cCounter.position.set(cx, cBase + 0.55, cz + 2.8);
    scene.add(cCounter);
    const cCounterTop = box(6.2, 0.1, 1.0, 0x5c3d1e);
    cCounterTop.position.set(cx, cBase + 1.12, cz + 2.8);
    scene.add(cCounterTop);

    // Coffee machine — boxy appliance on counter
    const machine = box(0.9, 1.0, 0.6, 0x222222);
    machine.position.set(cx - 1.5, cBase + 1.62, cz + 2.5);
    scene.add(machine);
    const machineTop = box(0.9, 0.12, 0.6, 0x444444);
    machineTop.position.set(cx - 1.5, cBase + 2.18, cz + 2.5);
    scene.add(machineTop);
    // Coffee machine light
    const mLight = box(0.2, 0.12, 0.1, 0x00cc44);
    mLight.position.set(cx - 1.5, cBase + 1.85, cz + 2.22);
    scene.add(mLight);

    // Chalkboard menu
    const ccChalk = box(2.4, 1.5, 0.1, 0x2d4a3e);
    ccChalk.position.set(cx + 1.5, cBase + 2.5, cz + 3.4);
    scene.add(ccChalk);
    const ccFrame = box(2.6, 1.7, 0.08, 0x4a2800);
    ccFrame.position.set(cx + 1.5, cBase + 2.5, cz + 3.38);
    scene.add(ccFrame);

    // 3 small round tables inside with chairs
    for (const [tx, tz] of [[-2.5, -1.5],[2.0, -1.0],[-1.0, 1.0]]) {
      // Table top — cylinder
      const tTop = cylinder(0.65, 0.65, 0.1, 0x9b6a3d, 12);
      tTop.position.set(cx + tx, cBase + 1.05, cz + tz);
      scene.add(tTop);
      // Pedestal
      const tPed = cylinder(0.1, 0.15, 1.05, 0x7b4d2a, 6);
      tPed.position.set(cx + tx, cBase + 0.53, cz + tz);
      scene.add(tPed);
      // 2 chairs per table (simple seat + backrest)
      for (const [angle] of [[-Math.PI/3],[Math.PI * 2/3]]) {
        const chX = cx + tx + Math.cos(angle) * 1.05;
        const chZ = cz + tz + Math.sin(angle) * 1.05;
        const seat = cylinder(0.32, 0.32, 0.08, 0x5c3d1e, 8);
        seat.position.set(chX, cBase + 0.8, chZ);
        scene.add(seat);
        const back = box(0.55, 0.55, 0.08, 0x5c3d1e);
        back.position.set(chX + Math.cos(angle) * 0.25, cBase + 1.1, chZ + Math.sin(angle) * 0.25);
        back.rotation.y = angle + Math.PI / 2;
        scene.add(back);
      }
    }

    // Potted plants in two inside corners
    for (const [px2, pz2] of [[-4.2,-3.2],[3.8,-3.2]]) {
      const pot2 = cylinder(0.32, 0.38, 0.55, 0x8b6914, 8);
      pot2.position.set(cx + px2, cBase + 0.28, cz + pz2);
      scene.add(pot2);
      const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(0.48, 6, 5), mat(C.foliage));
      foliage2.position.set(cx + px2, cBase + 0.85, cz + pz2);
      scene.add(foliage2);
    }
  }

  // Outdoor café seating
  for (const [tx, tz] of [[21, -75], [24, -84], [21, -93]]) {
    const ct = makeCafeTable();
    placeOnTerrain(ct, tx, tz);
    scene.add(ct);
  }
  // Potted plants flanking café door
  for (const [px, pz] of [[14, -78], [3, -78]]) {
    const pot = cylinder(0.5, 0.6, 0.8, 0x8b6914, 8);
    placeOnTerrain(pot, px, pz, 0.4);
    scene.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.65, 6, 5), mat(C.foliage));
    placeOnTerrain(plant, px, pz, 1.3);
    scene.add(plant);
  }
  // Café paths
  makePath(scene, 0, 0, 8, -83, 3);
  makePath(scene, 8, -83, -45, -105, 3);
  makePath(scene, 8, -83, 60, -105, 3);

  // =====================================================================
  // GENERAL STORE (-30, -72) — CAD-242
  // A small village shop near the café and bakery cluster
  // =====================================================================
  {
    const GSX = -30, GSZ = -72;
    const gsBuilding = makeBuilding(9, 5, 7, 0xe8d5b7, 0x6b3d12, {
      solarPanels: false,
      label: 'General Store',
      signText: '🛒 General Store',
      signBg: 0x2b5e2b,
      signColor: 0xffd700,
    });
    placeOnTerrain(gsBuilding, GSX, GSZ);
    gsBuilding.rotation.y = -0.1;
    scene.add(gsBuilding);

    const gsBase = getHeight(GSX, GSZ);

    // ── Interior: wooden shelves along sides ──
    // Left-wall shelf unit
    for (let si = 0; si < 2; si++) {
      const shelfBody = box(3.5, 0.12, 0.9, 0x8b5e3c);
      shelfBody.position.set(GSX - 3.2, gsBase + 0.8 + si * 1.1, GSZ + 2.0);
      scene.add(shelfBody);
      // shelf supports
      for (const sx2 of [-1.5, 1.5]) {
        const sup = box(0.12, 0.9, 0.85, 0x7a4e30);
        sup.position.set(GSX - 3.2 + sx2, gsBase + 0.42 + si * 1.1, GSZ + 2.0);
        scene.add(sup);
      }
      // items on shelf — coloured boxes representing stock
      const stockColors = [0xee4444, 0x44aaee, 0xeecc22, 0x44cc66, 0xee8833];
      for (let item = 0; item < 4; item++) {
        const stock = box(0.5, 0.45, 0.4, stockColors[item % stockColors.length]);
        stock.position.set(GSX - 3.2 - 1.0 + item * 0.72, gsBase + 1.05 + si * 1.1, GSZ + 1.62);
        scene.add(stock);
      }
    }
    // Right-wall shelf unit
    for (let si = 0; si < 2; si++) {
      const shelfBody = box(3.5, 0.12, 0.9, 0x8b5e3c);
      shelfBody.position.set(GSX + 3.2, gsBase + 0.8 + si * 1.1, GSZ + 2.0);
      scene.add(shelfBody);
      for (const sx2 of [-1.5, 1.5]) {
        const sup = box(0.12, 0.9, 0.85, 0x7a4e30);
        sup.position.set(GSX + 3.2 + sx2, gsBase + 0.42 + si * 1.1, GSZ + 2.0);
        scene.add(sup);
      }
      const stockColors2 = [0xcc44cc, 0xaaccff, 0xffaa44, 0x88ddaa];
      for (let item = 0; item < 4; item++) {
        const stock = box(0.5, 0.45, 0.4, stockColors2[item % stockColors2.length]);
        stock.position.set(GSX + 3.2 - 1.0 + item * 0.72, gsBase + 1.05 + si * 1.1, GSZ + 1.62);
        scene.add(stock);
      }
    }

    // Service counter at the back
    const gsCounter = box(4, 1.0, 0.8, 0x7b4d2a);
    gsCounter.position.set(GSX, gsBase + 0.5, GSZ + 2.6);
    scene.add(gsCounter);
    const gsCounterTop = box(4.2, 0.1, 0.9, 0x5c3d1e);
    gsCounterTop.position.set(GSX, gsBase + 1.05, GSZ + 2.6);
    scene.add(gsCounterTop);

    // Potted plant by door
    const gsPot = cylinder(0.35, 0.42, 0.6, 0x7a6038, 8);
    placeOnTerrain(gsPot, GSX + 3.8, GSZ - 2.8, 0.3);
    scene.add(gsPot);
    const gsPlant = new THREE.Mesh(new THREE.SphereGeometry(0.52, 6, 5), mat(C.foliage));
    placeOnTerrain(gsPlant, GSX + 3.8, GSZ - 2.8, 1.1);
    scene.add(gsPlant);

    // Path connecting General Store to the nearby café/bakery network
    makePath(scene, 0, 0, -30, -72, 3);

    // Collider for General Store building
    colliders.push({ cx: -30, cz: -72, hw: 4.5, hd: 3.5, rot: -0.1 });
  }

  // =====================================================================
  // ELLIOT'S AQUARIUM (225, -120)
  // =====================================================================
  const aquarium = makeAquarium();
  placeOnTerrain(aquarium, 225, -120);
  aquarium.rotation.y = -0.6;  // faces roughly toward town
  scene.add(aquarium);

  // Small decorative pond outside aquarium entrance
  const pondGeo = new THREE.CircleGeometry(3.5, 14);
  pondGeo.rotateX(-Math.PI / 2);
  const pond = new THREE.Mesh(pondGeo, mat(C.water));
  placeOnTerrain(pond, 245, -138, 0.15);
  scene.add(pond);

  // Potted sea-plants flanking aquarium entrance
  for (const [px, pz] of [[237, -141], [252, -135]]) {
    const potA = cylinder(0.55, 0.65, 0.85, 0x1a6fa8, 8);
    placeOnTerrain(potA, px, pz, 0.42);
    scene.add(potA);
    const topA = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), mat(0x4dd0e1));
    placeOnTerrain(topA, px, pz, 1.35);
    scene.add(topA);
  }

  // Path: Post Office → Aquarium
  makePath(scene, 90, -60, 225, -120, 3);

  // =====================================================================
  // HOME PLAQUES — nameplate sign next to each NPC's front door
  // =====================================================================
  const homePlaqueData = [
    [-107, -84, "Mabel's"],
    [110,  -84, "Gus's"],
    [-291, 138, "Fern's"],
    [-17,   15, "Olive's"],
    [137,   84, "Rosa's"],
    [47,   303, "Jack's"],
    [-291, 101, "Pete's"],
    [-60,  -114, "Barney's"],
    [-6,   -92, "Suki's"],
    [80,   -120, "Clara's"],
    [86,   -87, "Rex's"],
    [-138,  45, "Otto's"],
  ];
  for (const [px, pz, name] of homePlaqueData) {
    const plaque = makeHomePlaque(name);
    placeOnTerrain(plaque, px, pz);
    scene.add(plaque);
  }

  // =====================================================================
  // CLOUDS & SUN
  // =====================================================================
  const cloudList = buildClouds(scene);
  makeSunDisc(scene);


  // =====================================================================
  // CAD-153: CYCLE SHOP (-45, -135) — near south quarter / pub
  // =====================================================================
  const cycleShop = makeCycleShop();
  placeOnTerrain(cycleShop, -45, -135);
  cycleShop.rotation.y = 0.2;
  scene.add(cycleShop);
  makePath(scene, -45, -105, -45, -135, 3);

  // =====================================================================
  // CAD-150: FITNESS CENTER (165, -83) — east side, near aquarium area
  // =====================================================================
  const fitnessCenter = makeFitnessCenter();
  placeOnTerrain(fitnessCenter, 165, -83);
  fitnessCenter.rotation.y = -0.4;
  scene.add(fitnessCenter);

  // =====================================================================
  // CAD-152: SPORTS COURTS (165, -45) — adjacent to fitness center
  // =====================================================================
  const sportsCourts = makeSportsCourts();
  placeOnTerrain(sportsCourts, 165, -45);
  sportsCourts.rotation.y = -0.1;
  scene.add(sportsCourts);
  makePath(scene, 225, -120, 165, -75, 3);

  // =====================================================================
  // CAD-151: SCIENCE CENTER (-120, -225) — elevated hilltop area
  // =====================================================================
  const scienceCenter = makeScienceCenter();
  placeOnTerrain(scienceCenter, -120, -225);
  scienceCenter.rotation.y = 0.6;
  scene.add(scienceCenter);
  makePath(scene, -150, -270, -120, -225, 3);

  // =====================================================================
  // CAD-139: FISHERY (45, 345) — harbour/dock area
  // =====================================================================
  const fishery = makeFishery();
  placeOnTerrain(fishery, 45, 345);
  fishery.rotation.y = -0.3;
  scene.add(fishery);

  // =====================================================================
  // LIGHTHOUSE (63, 372) — near the dock, harbour beacon
  // =====================================================================
  const lighthouse = makeLighthouse();
  placeOnTerrain(lighthouse, 63, 372);
  lighthouse.rotation.y = -0.8;
  scene.add(lighthouse);

  // =====================================================================
  // RADIO STATION (165, 75) — forest-edge broadcast building
  // =====================================================================
  const radioStation = makeRadioStation();
  placeOnTerrain(radioStation, 165, 75);
  radioStation.rotation.y = 0.6;
  scene.add(radioStation);

  // =====================================================================
  // CAD-134: MAINTENANCE BUILDING (-158, 105) — near workshop/mill edge
  // =====================================================================
  const maintenanceBuilding = makeMaintenanceBuilding();
  placeOnTerrain(maintenanceBuilding, -158, 105);
  maintenanceBuilding.rotation.y = 0.5;
  scene.add(maintenanceBuilding);
  makePath(scene, -120, 60, -158, 105, 3);

  // =====================================================================
  // ZONES (CAD-406 to CAD-422)
  // =====================================================================
  makeHarbourZone(scene);
  makeMarketTown(scene);
  makeSandyBay(scene);
  makeTidepools(scene);
  makeFishingVillage(scene);
  makeKelpCove(scene);
  makeSaltMarsh(scene);
  makeRiverMouth(scene);
  makeHighlandForest(scene);
  makeWindRidge(scene);
  makeTheSummit(scene);
  makeCommunityFarm(scene);
  makeOrchard(scene);
  makeRiverValley(scene);
  makeTheCommons(scene);
  makeClifftopPath(scene);
  makeHiddenBeach(scene);

  // =====================================================================
  // BUILDING COLLIDERS — OBB rectangles { cx, cz, hw, hd, rot }
  // hw = half-width (local x), hd = half-depth (local z), rot = world rot
  // Library uses per-wall segments so player can walk through the door gap.
  // The open garage has no front wall so is intentionally not listed.
  // =====================================================================
  // Push the standard building colliders into the array initialised at the top of buildScene
  colliders.push(
    // The Anchor pub (-45, -105)  13×10, rot 0.1
    { cx: -45, cz: -105, hw: 6.5, hd: 5,   rot: 0.1  },

    // Bakery (-90, -60) 12×9, rot 0.3 — per-wall colliders (hollow building)
    { cx: -95.73, cz: -58.23, hw: 0.5, hd: 4.5, rot: 0.3 },  // left wall
    { cx: -84.27, cz: -61.77, hw: 0.5, hd: 4.5, rot: 0.3 },  // right wall
    { cx: -91.33, cz: -64.30, hw: 6.2, hd: 0.5, rot: 0.3 },  // back wall
    { cx: -92.01, cz: -54.67, hw: 2.5, hd: 0.5, rot: 0.3 },  // front-left panel
    { cx: -85.33, cz: -56.74, hw: 2.5, hd: 0.5, rot: 0.3 },  // front-right panel

    // Post Office (90, -60) 10×8, rot -0.2 — per-wall colliders (hollow building)
    { cx:  85.10, cz: -60.99, hw: 0.5, hd: 4.0, rot: -0.2 }, // left wall
    { cx:  94.90, cz: -59.01, hw: 0.5, hd: 4.0, rot: -0.2 }, // right wall
    { cx:  90.79, cz: -63.92, hw: 5.2, hd: 0.5, rot: -0.2 }, // back wall
    { cx:  86.27, cz: -56.68, hw: 2.0, hd: 0.5, rot: -0.2 }, // front-left panel
    { cx:  92.15, cz: -55.48, hw: 2.0, hd: 0.5, rot: -0.2 }, // front-right panel

    // School (60, -105) 18×12, rot -0.15 — per-wall colliders (hollow building)
    { cx:  51.10, cz: -106.34, hw: 0.5, hd: 6.0,  rot: -0.15 }, // left wall
    { cx:  68.90, cz: -103.66, hw: 0.5, hd: 6.0,  rot: -0.15 }, // right wall
    { cx:  60.90, cz: -110.93, hw: 9.2, hd: 0.5,  rot: -0.15 }, // back wall
    { cx:  54.16, cz:  -99.81, hw: 4.0, hd: 0.5,  rot: -0.15 }, // front-left panel
    { cx:  64.05, cz:  -98.32, hw: 4.0, hd: 0.5,  rot: -0.15 }, // front-right panel

    // Café (8, -83) 10×8, rot 0.15 — per-wall colliders (hollow building)
    { cx:   3.06, cz: -82.25, hw: 0.5, hd: 4.0, rot: 0.15 }, // left wall
    { cx:  12.94, cz: -83.75, hw: 0.5, hd: 4.0, rot: 0.15 }, // right wall
    { cx:   7.40, cz: -86.96, hw: 5.2, hd: 0.5, rot: 0.15 }, // back wall
    { cx:   5.63, cz: -78.60, hw: 2.0, hd: 0.5, rot: 0.15 }, // front-left panel
    { cx:  11.56, cz: -79.49, hw: 2.0, hd: 0.5, rot: 0.15 }, // front-right panel
    // Barn (-270, 105)  approx 14×10, rot 0.2
    { cx: -270, cz: 105, hw: 7,   hd: 5,   rot: 0.2  },
    // Greenhouse (-240, 135)  10×14, rot 0.2
    { cx: -240, cz: 135, hw: 5,   hd: 7,   rot: 0.2  },
    // Windmill tower (-150, -270)  approx radius 3.5
    { cx: -150, cz: -270, hw: 3.5, hd: 3.5, rot: 0  },
    // Elliot's Aquarium (225, -120)  20×15, rot -0.6
    { cx: 225,  cz: -120,  hw: 10,  hd: 7.5, rot: -0.6 },
    // The Mill (-180, 60)  6×6 base, rot 0.4  (CAD-365)
    { cx: -180, cz: 60,   hw: 3.5, hd: 3.5, rot: 0.4  },

    // Library — per-wall colliders (hollow building, player enters through door gap)
    // Local positions transformed to world using Three.js rotation.y = 1.1:
    //   wx = libX + cos(rot)*lx + sin(rot)*lz
    //   wz = libZ - sin(rot)*lx + cos(rot)*lz
    // cos(1.1)≈0.4536, sin(1.1)≈0.8912, libX=120, libZ=60
    // Left wall local (-14, 0):   wx=113.650, wz=72.477
    { cx: 113.65, cz: 72.48, hw: 0.5, hd: 12,  rot: 1.1 },
    // Right wall local (14, 0):   wx=126.350, wz=47.523
    { cx: 126.35, cz: 47.52, hw: 0.5, hd: 12,  rot: 1.1 },
    // Back wall local (0, 12):    wx=130.694, wz=65.443
    { cx: 130.69, cz: 65.44, hw: 14.5, hd: 0.5, rot: 1.1 },
    // Front-left panel local (-8.25, -12):  wx=105.564, wz=61.909
    { cx: 105.56, cz: 61.91, hw: 5.8, hd: 0.5, rot: 1.1 },
    // Front-right panel local (8.25, -12):  wx=113.048, wz=47.205
    { cx: 113.05, cz: 47.21, hw: 5.8, hd: 0.5, rot: 1.1 }
  );


  // =====================================================================
  // GO-KART TRACK — east of the aquarium, near the coast
  // =====================================================================
  {
    const MAT_ASPHALT = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const MAT_INFIELD = new THREE.MeshLambertMaterial({ color: 0x4a9951 });
    const MAT_KERB_R  = new THREE.MeshLambertMaterial({ color: 0xee2222 });
    const MAT_KERB_W  = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const MAT_STRIPE  = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const MAT_METAL   = new THREE.MeshLambertMaterial({ color: 0x999999 });
    const MAT_TIRE    = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const MAT_BANNER  = new THREE.MeshLambertMaterial({ color: 0xcc1111, side: THREE.DoubleSide });

    const KX = 297, KZ = -222;
    const trackBase = getHeight(KX, KZ) + 0.12;
    const tg = new THREE.Group();
    tg.position.set(KX, trackBase, KZ);

    const SEGS = 64;
    const RX_O = 30, RZ_O = 18;
    const RX_I = 20, RZ_I = 8;

    // Track surface (oval ring)
    const tv = [], ti = [];
    for (let i = 0; i <= SEGS; i++) {
      const t = (i / SEGS) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      tv.push(c * RX_O, 0.05, s * RZ_O,  c * RX_I, 0.05, s * RZ_I);
    }
    for (let i = 0; i < SEGS; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      ti.push(a, c, b,  b, c, d);
    }
    const trkGeo = new THREE.BufferGeometry();
    trkGeo.setAttribute('position', new THREE.Float32BufferAttribute(tv, 3));
    trkGeo.setIndex(ti);
    trkGeo.computeVertexNormals();
    tg.add(new THREE.Mesh(trkGeo, MAT_ASPHALT));

    // Infield grass fan
    const iv = [0, 0.04, 0];
    for (let i = 0; i <= SEGS; i++) {
      const t = (i / SEGS) * Math.PI * 2;
      iv.push(Math.cos(t) * (RX_I - 0.8), 0.04, Math.sin(t) * (RZ_I - 0.8));
    }
    const ii = [];
    for (let i = 0; i < SEGS; i++) ii.push(0, i + 1, i + 2);
    const infGeo = new THREE.BufferGeometry();
    infGeo.setAttribute('position', new THREE.Float32BufferAttribute(iv, 3));
    infGeo.setIndex(ii);
    infGeo.computeVertexNormals();
    tg.add(new THREE.Mesh(infGeo, MAT_INFIELD));

    // Red/white kerb barriers around outer and inner edges
    const N_B = 48;
    for (let i = 0; i < N_B; i++) {
      const t = (i + 0.5) / N_B * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      const kMat = (i % 2 === 0) ? MAT_KERB_R : MAT_KERB_W;
      const ry = -Math.atan2(s * RX_O, c * RZ_O);
      const ob = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.3), kMat);
      ob.position.set(c * (RX_O + 0.6), 0.25, s * (RZ_O + 0.6));
      ob.rotation.y = ry;
      tg.add(ob);
      const ib = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.3), kMat);
      ib.position.set(c * (RX_I - 0.6), 0.25, s * (RZ_I - 0.6));
      ib.rotation.y = ry;
      tg.add(ib);
    }

    // Starting line stripe
    const gantryX = (RX_O + RX_I) / 2;
    const startW = RX_O - RX_I;
    const sl = new THREE.Mesh(new THREE.BoxGeometry(startW, 0.01, 0.7), MAT_STRIPE);
    sl.position.set(gantryX, 0.06, 0);
    tg.add(sl);

    // Finish gantry
    for (const px of [RX_I - 0.4, RX_O + 0.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8), MAT_METAL);
      post.position.set(px, 2.25, -2);
      tg.add(post);
    }
    const gBar = new THREE.Mesh(new THREE.BoxGeometry(startW + 2.5, 0.25, 0.25), MAT_METAL);
    gBar.position.set(gantryX, 4.5, -2);
    tg.add(gBar);
    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(startW + 2, 1.2, 0.06), MAT_BANNER);
    bannerMesh.position.set(gantryX, 3.6, -2);
    tg.add(bannerMesh);

    // 🏎️ Three go-karts in the pit area
    const kartColors = [0xff6600, 0x2266ee, 0xffcc00];
    kartColors.forEach((kc, ki) => {
      const kg = new THREE.Group();
      const kMat = new THREE.MeshLambertMaterial({ color: kc });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 1.7), kMat);
      body.position.set(0, 0.42, 0); kg.add(body);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.52), kMat);
      nose.position.set(0, 0.35, -0.9); kg.add(nose);
      const seatBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), MAT_METAL);
      seatBox.position.set(0, 0.62, 0.2); kg.add(seatBox);
      [[-0.6, 0.52], [0.6, 0.52], [-0.6, -0.52], [0.6, -0.52]].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10), MAT_TIRE);
        w.rotation.z = Math.PI / 2; w.position.set(wx, 0.2, wz); kg.add(w);
      });
      const sw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 10), MAT_METAL);
      sw.rotation.x = -0.4; sw.position.set(0, 0.82, -0.08); kg.add(sw);
      kg.position.set(gantryX + (ki - 1) * 3.2, 0.01, -5 - ki * 1.5);
      kg.rotation.y = ki === 1 ? 0.15 : (ki === 2 ? -0.12 : 0);
      tg.add(kg);
    });

    // Tire stack at inner corner
    for (let i = 0; i < 4; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.14, 6, 10), MAT_TIRE);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(-(RX_O + 0.8), 0.28 + (i % 2) * 0.12, (i < 2 ? 0.42 : -0.42));
      tg.add(tire);
    }

    // Track label sign
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), MAT_METAL);
    signPole.position.set(RX_O + 2.5, 1.5, 5);
    tg.add(signPole);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 0.1), MAT_KERB_R);
    signBoard.position.set(RX_O + 2.5, 3.3, 5);
    tg.add(signBoard);

    scene.add(tg);

    // Path connecting aquarium to kart track
    makePath(scene, 233, -132, KX - 38, KZ + 9, 3);

    // Collider for the gantry
    colliders.push({ cx: KX + gantryX, cz: KZ - 2, hw: startW / 2 + 1.5, hd: 0.5, rot: 0 });

    // Cycle Shop (-45, -135)  10x8, rot 0.2
    colliders.push({ cx: -45,  cz: -135, hw: 5,   hd: 4,   rot: 0.2  });
    // Fitness Center (165, -83)  14x10, rot -0.4
    colliders.push({ cx: 165,  cz: -83,  hw: 7,   hd: 5,   rot: -0.4 });
    // Science Center (-120, -225)  13x11, rot 0.6
    colliders.push({ cx: -120, cz: -225, hw: 6.5, hd: 5.5, rot: 0.6  });
    // Fishery (45, 345)  12x8, rot -0.3
    colliders.push({ cx:  45,  cz: 345,  hw: 6,   hd: 4,   rot: -0.3 });
    // Maintenance (-158, 105)  16x12, rot 0.5
    colliders.push({ cx: -158, cz: 105,  hw: 8,   hd: 6,   rot: 0.5  });
    // Lighthouse (63, 372)  tower r=1.8, rot -0.8
    colliders.push({ cx:  63,  cz: 372,  hw: 1.8, hd: 1.8, rot: 0    });
    // Lighthouse keeper's cottage (63-3.8, 372)  4.5x4, rot -0.8
    colliders.push({ cx:  59,  cz: 372,  hw: 2.3, hd: 2.0, rot: -0.8 });
    // Radio Station (165, 75)  8x7, rot 0.6
    colliders.push({ cx: 165,  cz:  75,  hw: 4,   hd: 3.5, rot: 0.6  });
  }

  const fish = aquarium.userData.fish || [];

  // CAD-252 — Island Radio boombox
  const boombox = initRadio(scene);

  // CAD-251 — Supply chain background simulation
  initSupplyChain(scene);

  // === Fireflies ===
  // Ambient glowing particles that drift near the treeline at dusk and night
  const FIREFLY_COUNT = 200;
  const ffPos   = new Float32Array(FIREFLY_COUNT * 3);
  const ffPhase = new Float32Array(FIREFLY_COUNT);
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 15 + Math.random() * 140;
    ffPos[i*3]   = Math.cos(angle) * r;
    ffPos[i*3+1] = 0.5 + Math.random() * 5;
    ffPos[i*3+2] = Math.sin(angle) * r;
    ffPhase[i] = Math.random() * Math.PI * 2;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.Float32BufferAttribute(ffPos, 3));
  ffGeo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ffPhase, 1));
  const fireflies = new THREE.Points(ffGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aPhase;
      uniform float uTime;
      varying float vPhase;
      void main() {
        vPhase = aPhase;
        vec3 pos = position;
        pos.x += sin(uTime * 0.4 + aPhase * 3.7) * 2.0;
        pos.y += sin(uTime * 0.7 + aPhase * 2.1) * 1.0;
        pos.z += cos(uTime * 0.5 + aPhase * 4.3) * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 5.0;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying float vPhase;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float flicker = 0.5 + 0.5 * sin(uTime * 2.8 + vPhase * 6.1);
        float alpha = flicker * smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(0.55, 1.0, 0.45, alpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }));
  scene.add(fireflies);

  return { windmill: windmillGroup, mill: millGroup, clouds: cloudList, campfire, colliders, fish, boombox, fireflies, sea, sunLight, hemiLight, ambientLight,
    buildings: { cafe: cafeBuilding, bakery, postOffice, school, pub, library, workshop } };
}


// ===========================================================================
// CAD-250 — Economy System (gentle barter/gift economy)
// ===========================================================================

export const inventory = []; // max 3 items
const MAX_INV = 3;

// Pickupable item spots in the world: { id, label, emoji, x, z, npcGiver }
export const ITEM_SPOTS = [
  { id: 'bread',  label: 'bread',  emoji: '🍞', x: -55,  z: -36,  npcGiver: null },
  { id: 'fish',   label: 'fish',   emoji: '🐟', x: 2,    z: -57,  npcGiver: 'Suki' },
  { id: 'eggs',   label: 'eggs',   emoji: '🥚', x: -185, z: 85,   npcGiver: null },
  { id: 'flour',  label: 'flour',  emoji: '🌾', x: -195, z: 100,  npcGiver: null },
  { id: 'coffee', label: 'coffee', emoji: '☕', x: 8,    z: -52,  npcGiver: null },
];

// NPC gift responses when you give them something
const GIFT_RESPONSES = {
  Mabel:  { receives: ['fish','eggs','flour'], gives: 'bread',  giveEmoji: '🍞', line: "Oh, how lovely! Here, take a fresh loaf." },
  Suki:   { receives: ['bread','eggs'],        gives: 'coffee', giveEmoji: '☕', line: "That's so kind! A coffee for you." },
  Fern:   { receives: ['bread','coffee'],      gives: 'eggs',   giveEmoji: '🥚', line: "Wonderful! Take some eggs from the hens." },
  Jack:   { receives: ['bread','coffee'],      gives: 'fish',   giveEmoji: '🐟', line: "Cheers! Here's a fresh catch for you." },
  default: { line: "Thank you, that's so thoughtful!" },
};

let _inventoryOverlayEl = null;

export function getInventoryOverlay() { return _inventoryOverlayEl; }

export function initEconomy() {
  // Build DOM overlay
  const el = document.createElement('div');
  el.id = 'inventory-overlay';
  el.style.cssText = [
    'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(0,0,0,0.55)', 'color:#fff', 'padding:10px 22px',
    'border-radius:24px', 'font-size:18px', 'font-family:sans-serif',
    'pointer-events:none', 'z-index:100', 'display:none',
    'backdrop-filter:blur(4px)', 'letter-spacing:0.03em',
  ].join(';');
  document.body.appendChild(el);
  _inventoryOverlayEl = el;
  _refreshInventoryUI();
}

function _refreshInventoryUI() {
  if (!_inventoryOverlayEl) return;
  if (inventory.length === 0) {
    _inventoryOverlayEl.style.display = 'none';
    return;
  }
  _inventoryOverlayEl.style.display = 'block';
  _inventoryOverlayEl.textContent = 'carrying: ' + inventory.map(i => `${i.emoji} ${i.label}`).join('  ·  ');
}

export function tryPickupItem(playerPos) {
  if (inventory.length >= MAX_INV) {
    showNotification("Your hands are full!");
    return false;
  }
  for (const spot of ITEM_SPOTS) {
    const dx = playerPos.x - spot.x;
    const dz = playerPos.z - spot.z;
    if (Math.sqrt(dx*dx + dz*dz) < 5) {
      inventory.push({ id: spot.id, label: spot.label, emoji: spot.emoji });
      _refreshInventoryUI();
      showNotification(`You picked up ${spot.emoji} ${spot.label}`);
      return true;
    }
  }
  return false;
}

export function tryGiveItem(npcName, npcPos, playerPos) {
  if (inventory.length === 0) return false;
  const dx = playerPos.x - npcPos.x;
  const dz = playerPos.z - npcPos.z;
  if (Math.sqrt(dx*dx + dz*dz) > 8) return false;

  const resp = GIFT_RESPONSES[npcName] || GIFT_RESPONSES.default;
  const item = inventory[inventory.length - 1]; // give most recently picked up

  // Remove item from inventory
  inventory.splice(inventory.indexOf(item), 1);

  // NPC gives something back?
  if (resp.receives && resp.receives.includes(item.id) && resp.gives) {
    if (inventory.length < MAX_INV) {
      inventory.push({ id: resp.gives, label: resp.gives, emoji: resp.giveEmoji });
      showNotification(`${npcName}: "${resp.line}"\nYou received ${resp.giveEmoji} ${resp.gives}!`);
    } else {
      showNotification(`${npcName}: "${resp.line}"`);
    }
  } else {
    showNotification(`${npcName}: "${(resp.line || GIFT_RESPONSES.default.line)}"`);
  }

  _refreshInventoryUI();
  return true;
}

// ===========================================================================
// CAD-251 / CAD-365 — Supply Chain (Eddy's farm → mill → bakery/café)
// ===========================================================================
// Background simulation: every 5 "game minutes" Eddy harvests (wheat bundle
// appears briefly) and every 10 "game minutes" Rosa bakes (chimney smoke).
// CAD-365 extends this with visible goods packages that travel with Felix.
// ===========================================================================

let _supplyChainScene = null;
let _smokeParticles = null;
let _smokeClock = 0;
let _harvestClock = 0;
let _wheatBundle = null;
let _wheatTimer = 0;
let _smokeActive = false;

// CAD-365 goods packages — small coloured boxes that follow Felix's van
export let goodsWheatMesh = null;  // yellow wheat bundle (farm → mill)
export let goodsFlourMesh = null;  // white flour sack (mill → bakery)

// We expose the smoke group so the main loop can animate it
export function getSupplyChain() {
  return { smokeParticles: _smokeParticles, wheatBundle: _wheatBundle };
}

export function initSupplyChain(scene) {
  _supplyChainScene = scene;

  // --- Chimney smoke particle system (Three.js Points) ---
  const PARTICLE_COUNT = 60;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const opacities = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = -57.5 + (Math.random() - 0.5) * 0.6;
    positions[i * 3 + 1] = getHeight(-57.5, -43) + 12 + Math.random() * 6;
    positions[i * 3 + 2] = -43 + (Math.random() - 0.5) * 0.6;
    opacities[i] = 0;
    sizes[i] = 1.2 + Math.random() * 2;
  }

  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  smokeGeo.setAttribute('alpha', new THREE.Float32BufferAttribute(opacities, 1));
  smokeGeo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  // Custom shader material for opacity-per-particle
  const smokeMat = new THREE.PointsMaterial({
    color: 0xdddddd,
    size: 1.8,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  _smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  _smokeParticles.userData.particles = { positions, opacities, sizes, count: PARTICLE_COUNT };
  _smokeParticles.visible = false;
  scene.add(_smokeParticles);

  // --- Wheat bundle (harvest indicator) ---
  const wGroup = new THREE.Group();
  const wMat = new THREE.MeshLambertMaterial({ color: 0xe8c04a });
  // 5 stalks bundled together
  for (let i = 0; i < 5; i++) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.2, 5),
      wMat
    );
    stalk.position.set((Math.random() - 0.5) * 0.4, 0.6, (Math.random() - 0.5) * 0.4);
    stalk.rotation.z = (Math.random() - 0.5) * 0.3;
    wGroup.add(stalk);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.08), wMat);
    head.position.copy(stalk.position);
    head.position.y = 1.4;
    wGroup.add(head);
  }
  const farmBase = getHeight(-195, 100);
  wGroup.position.set(-195, farmBase, 100);
  wGroup.visible = false;
  scene.add(wGroup);
  _wheatBundle = wGroup;

  // CAD-365 — Goods packages: wheat bundle (yellow) and flour sack (white)
  // These small boxes travel with Felix's van, hidden when not in use.
  const wPkg = box(0.4, 0.4, 0.4, 0xe8c04a); // golden wheat
  wPkg.position.set(-200, getHeight(-200, 100) + 1.2, 100);
  wPkg.visible = false;
  scene.add(wPkg);
  goodsWheatMesh = wPkg;

  const fPkg = box(0.4, 0.5, 0.4, 0xf5f5f5); // white flour sack
  fPkg.position.set(-200, getHeight(-200, 100) + 1.2, 100);
  fPkg.visible = false;
  scene.add(fPkg);
  goodsFlourMesh = fPkg;
}

// Called from main animation loop with delta (real seconds) and simDelta (sim hours per tick)
export function updateSupplyChain(deltaSec, simDeltaHours) {
  // Sim: 5 game-minutes = 5/60 sim-hours
  const SIM_MIN = 1 / 60;

  _harvestClock += simDeltaHours;
  _smokeClock += simDeltaHours;

  // Harvest event every 5 sim-minutes
  if (_harvestClock >= 5 * SIM_MIN) {
    _harvestClock = 0;
    if (_wheatBundle) {
      _wheatBundle.visible = true;
      _wheatTimer = 8; // show for 8 real seconds
    }
  }

  // Baking event every 10 sim-minutes → smoke for 30 real seconds
  if (_smokeClock >= 10 * SIM_MIN) {
    _smokeClock = 0;
    if (_smokeParticles) {
      _smokeParticles.visible = true;
      _smokeParticles.material.opacity = 0.55;
      _smokeActive = true;
      // Auto-hide after 30s via userData timer
      _smokeParticles.userData.hideTimer = 30;
    }
  }

  // Wheat bundle timeout
  if (_wheatTimer > 0) {
    _wheatTimer -= deltaSec;
    if (_wheatTimer <= 0 && _wheatBundle) {
      _wheatBundle.visible = false;
    }
  }

  // Animate smoke particles (drift upward)
  if (_smokeParticles && _smokeParticles.visible) {
    _smokeParticles.userData.hideTimer -= deltaSec;
    if (_smokeParticles.userData.hideTimer <= 0) {
      _smokeParticles.visible = false;
      _smokeActive = false;
    } else {
      const geo = _smokeParticles.geometry;
      const pos = geo.attributes.position.array;
      const N = _smokeParticles.userData.particles.count;
      const chimneyY = getHeight(-57.5, -43) + 12;
      for (let i = 0; i < N; i++) {
        pos[i * 3 + 1] += deltaSec * (0.4 + Math.random() * 0.2); // drift up
        pos[i * 3]     += deltaSec * (Math.random() - 0.5) * 0.15; // slight sway
        // Reset particle if it drifts too high
        if (pos[i * 3 + 1] > chimneyY + 10) {
          pos[i * 3]     = -57.5 + (Math.random() - 0.5) * 0.6;
          pos[i * 3 + 1] = chimneyY;
          pos[i * 3 + 2] = -43 + (Math.random() - 0.5) * 0.6;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  }

  // CAD-365: goods package positions are updated directly by Felix in npcs.js
}

// ===========================================================================
// CAD-252 — Island Radio
// ===========================================================================

const RADIO_TRACKS = [
  "Morning on the Headland",
  "Low Tide",
  "The Ferry Comes at Three",
  "Garden Hours",
  "Salt & Fog",
];
const TRACK_DURATION_REAL_SEC = 180; // 3 real minutes per track

let _radioOn = false;
let _audioCtx = null;
let _radioNodes = null;
let _radioOverlayEl = null;
let _trackIndex = 0;
let _trackTimer = 0;
let _radioToggleCooldown = 0;

// Boombox 3D object position (town square)
export const BOOMBOX_POS = { x: -8, z: 8 };

export function initRadio(scene) {
  // 3D boombox object
  const bGroup = new THREE.Group();
  const bBase = getHeight(BOOMBOX_POS.x, BOOMBOX_POS.z);

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
  const speakerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const knobMat = new THREE.MeshLambertMaterial({ color: 0xf0c040 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.7), bodyMat);
  body.position.set(BOOMBOX_POS.x, bBase + 1.35, BOOMBOX_POS.z);
  bGroup.add(body);

  // Speakers (left + right)
  for (const ox of [-0.72, 0.72]) {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10), speakerMat);
    sp.rotation.x = Math.PI / 2;
    sp.position.set(BOOMBOX_POS.x + ox, bBase + 1.35, BOOMBOX_POS.z + 0.31);
    bGroup.add(sp);
  }

  // Antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5), new THREE.MeshLambertMaterial({ color: 0x888888 }));
  ant.position.set(BOOMBOX_POS.x + 0.9, bBase + 2.3, BOOMBOX_POS.z);
  ant.rotation.z = 0.15;
  bGroup.add(ant);

  // Accent stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.14, 0.72), accentMat);
  stripe.position.set(BOOMBOX_POS.x, bBase + 1.7, BOOMBOX_POS.z);
  bGroup.add(stripe);

  // Knob
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), knobMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(BOOMBOX_POS.x, bBase + 1.35, BOOMBOX_POS.z + 0.32);
  bGroup.add(knob);

  scene.add(bGroup);

  // DOM overlay
  const el = document.createElement('div');
  el.id = 'radio-overlay';
  el.style.cssText = [
    'position:fixed', 'top:24px', 'right:24px',
    'background:rgba(0,0,0,0.60)', 'color:#fff',
    'padding:12px 20px', 'border-radius:16px',
    'font-size:16px', 'font-family:sans-serif',
    'pointer-events:none', 'z-index:100', 'display:none',
    'backdrop-filter:blur(4px)',
  ].join(';');
  document.body.appendChild(el);
  _radioOverlayEl = el;

  return bGroup;
}

function _startAudio() {
  if (_audioCtx) return;
  _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const master = _audioCtx.createGain();
  master.gain.value = 0.18;
  master.connect(_audioCtx.destination);

  // Pleasant lo-fi chord: layered oscillators (Fmaj-ish)
  const freqs = [174.6, 220, 261.6, 329.6, 392, 440, 523.2];
  const oscs = freqs.map((f, i) => {
    const osc = _audioCtx.createOscillator();
    const g = _audioCtx.createGain();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = f;
    // Slow gentle tremolo
    const lfo = _audioCtx.createOscillator();
    lfo.frequency.value = 0.18 + i * 0.03;
    const lfoGain = _audioCtx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    g.gain.value = 0.055 - i * 0.005;
    osc.connect(g);
    g.connect(master);
    osc.start();
    return { osc, lfo };
  });
  _radioNodes = { master, oscs };
}

function _stopAudio() {
  if (!_radioNodes) return;
  _radioNodes.oscs.forEach(({ osc, lfo }) => { try { osc.stop(); lfo.stop(); } catch(e){} });
  _radioNodes = null;
  if (_audioCtx) { _audioCtx.close(); _audioCtx = null; }
}

function _updateRadioOverlay() {
  if (!_radioOverlayEl) return;
  if (!_radioOn) { _radioOverlayEl.style.display = 'none'; return; }
  _radioOverlayEl.style.display = 'block';
  _radioOverlayEl.innerHTML = `📻 <b>Island Radio</b><br><span style="font-size:13px;opacity:0.8">♪ ${RADIO_TRACKS[_trackIndex]}</span>`;
}

export function toggleRadio() {
  if (_radioToggleCooldown > 0) return;
  _radioToggleCooldown = 0.5;
  _radioOn = !_radioOn;
  if (_radioOn) {
    _startAudio();
    _trackTimer = 0;
    showNotification('📻 Island Radio — on');
  } else {
    _stopAudio();
    showNotification('📻 Island Radio — off');
  }
  _updateRadioOverlay();
}

export function updateRadio(deltaSec) {
  if (_radioToggleCooldown > 0) _radioToggleCooldown -= deltaSec;
  if (!_radioOn) return;
  _trackTimer += deltaSec;
  if (_trackTimer >= TRACK_DURATION_REAL_SEC) {
    _trackTimer = 0;
    _trackIndex = (_trackIndex + 1) % RADIO_TRACKS.length;
    _updateRadioOverlay();
  }
}

export function isNearBoombox(playerPos) {
  const dx = playerPos.x - BOOMBOX_POS.x;
  const dz = playerPos.z - BOOMBOX_POS.z;
  return Math.sqrt(dx*dx + dz*dz) < 6;
}

// ===========================================================================
// Shared notification helper (used by Economy & Radio)
// ===========================================================================

let _notifEl = null;
let _notifTimer = 0;

export function showNotification(msg) {
  if (!_notifEl) {
    _notifEl = document.createElement('div');
    _notifEl.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.70)', 'color:#fff', 'padding:14px 28px',
      'border-radius:20px', 'font-size:17px', 'font-family:sans-serif',
      'pointer-events:none', 'z-index:200', 'text-align:center',
      'white-space:pre-line', 'max-width:460px',
      'backdrop-filter:blur(4px)',
    ].join(';');
    document.body.appendChild(_notifEl);
  }
  _notifEl.textContent = msg;
  _notifEl.style.display = 'block';
  _notifEl.style.opacity = '1';
  _notifTimer = 3.5;
}

export function updateNotification(deltaSec) {
  if (!_notifEl || _notifTimer <= 0) return;
  _notifTimer -= deltaSec;
  if (_notifTimer <= 0) {
    _notifEl.style.opacity = '0';
    setTimeout(() => { if (_notifEl) _notifEl.style.display = 'none'; }, 400);
  }
}

// ===========================================================================
// CAD-269 — Café Help Mini-Game
// Three-stage cosy mini-game triggered near the café counter (Mabel / counter).
// Stage 1: Take order  — press E to acknowledge customer
// Stage 2: Make coffee — press E (grind) → F (tamp) → Space (brew + progress bar)
// Stage 3: Table service — walk to the shown table number and press E to deliver
// 5 orders per shift; wrong steps get a gentle "Oops" with no penalty.
// ===========================================================================

const CAFE_TRIGGER_POS  = { x: 8,  z: -83 }; // near café counter (scaled 1.5x)
const CAFE_TRIGGER_DIST = 10;                  // proximity to start

const CAFE_ORDERS = [
  'One flat white, please!',
  'A large cappuccino, if you could.',
  'Two oat lattes — one with an extra shot.',
  'Could I get a cortado? Thanks!',
  'One filter coffee, black please.',
  'A chai latte — not too hot!',
  'Could I get a mocha to take away?',
];

// Table positions in the 3D world — matches outdoor & indoor seating roughly
const CAFE_TABLES = [
  { label: 'Table 1', x: 14,  z: -50 },
  { label: 'Table 2', x: 16,  z: -56 },
  { label: 'Table 3', x: 14,  z: -62 },
  { label: 'Table 4', x:  2,  z: -48 }, // indoor-ish
  { label: 'Table 5', x:  7,  z: -53 }, // indoor-ish
];

export class CafeHelpMiniGame {
  constructor() {
    this._active   = false; // mini-game currently running
    this._stage    = 0;     // 0=take-order, 1=make-coffee, 2=table-service
    this._coffeeStep = 0;   // 0=grind, 1=tamp, 2=brew
    this._brewing  = false;
    this._brewProgress = 0;
    this._ordersLeft = 5;
    this._currentOrder = null;
    this._currentTable = null;
    this._overlay  = null;
    this._progressBar = null;
    this._progressFill = null;
    this._keyHandler = null;
    this._keyFHandler = null;
    this._keySpaceHandler = null;
  }

  // Called from index.html E-key handler
  tryOpen(playerPos) {
    if (this._active) return false;
    const dx = playerPos.x - CAFE_TRIGGER_POS.x;
    const dz = playerPos.z - CAFE_TRIGGER_POS.z;
    if (Math.sqrt(dx*dx + dz*dz) > CAFE_TRIGGER_DIST) return false;
    this._start();
    return true;
  }

  // Called each frame with delta + player position
  update(delta, playerPos) {
    if (!this._active) return;
    if (this._stage === 2 && !this._brewing) {
      // Table service — check proximity to target table
      const t = this._currentTable;
      const dx = playerPos.x - t.x;
      const dz = playerPos.z - t.z;
      if (Math.sqrt(dx*dx + dz*dz) < 5) {
        this._showInstruction(`You're near ${t.label}! Press E to deliver.`);
      }
    }
    if (this._brewing) {
      this._brewProgress += delta / 3.0; // 3-second brew
      if (this._brewProgress >= 1) {
        this._brewProgress = 1;
        this._brewing = false;
        this._showInstruction('Coffee ready! ☕ Now deliver it.');
        this._advanceToTableService();
      }
      if (this._progressFill) {
        this._progressFill.style.width = `${Math.round(this._brewProgress * 100)}%`;
      }
    }
  }

  _start() {
    this._active = true;
    this._ordersLeft = 5;
    this._buildOverlay();
    this._nextOrder();
  }

  _nextOrder() {
    if (this._ordersLeft <= 0) {
      this._finish();
      return;
    }
    this._stage = 0;
    this._coffeeStep = 0;
    this._brewing = false;
    this._brewProgress = 0;
    this._currentOrder = CAFE_ORDERS[Math.floor(Math.random() * CAFE_ORDERS.length)];
    this._currentTable = CAFE_TABLES[Math.floor(Math.random() * CAFE_TABLES.length)];
    this._showOverlay();
    this._showInstruction(`Customer: "${this._currentOrder}"\nPress E to take the order.`);
    this._setProgressVisible(false);

    // Wire up key handlers
    this._removeKeyHandlers();
    this._keyHandler = (e) => {
      if (!this._active) return;
      if (e.code === 'KeyE')     this._onKeyE();
      if (e.code === 'KeyF')     this._onKeyF();
      if (e.code === 'Space')    this._onKeySpace();
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  _onKeyE() {
    if (this._stage === 0) {
      // Take order — acknowledge
      showNotification('Order taken! Head to the counter. ☕');
      this._stage = 1;
      this._coffeeStep = 0;
      this._showInstruction('Making coffee:\nStep 1 — Press E to grind the beans.');
    } else if (this._stage === 1 && this._coffeeStep === 0) {
      // Grind
      showNotification('Grind! ⚙️');
      this._coffeeStep = 1;
      this._showInstruction('Making coffee:\nStep 2 — Press F to tamp.');
    } else if (this._stage === 1 && this._coffeeStep > 1) {
      // Wrong step in coffee-making
      this._oops('Oops! Press F to tamp first, then Space to brew.');
    } else if (this._stage === 2) {
      // Table delivery — check if we're near the right table (done via update loop)
      this._deliverAttempt();
    }
  }

  _onKeyF() {
    if (this._stage === 1 && this._coffeeStep === 1) {
      // Tamp
      showNotification('Tamp! 💪');
      this._coffeeStep = 2;
      this._showInstruction('Making coffee:\nStep 3 — Press Space to brew.');
    } else if (this._stage === 1) {
      this._oops('Oops! First press E to grind.');
    }
  }

  _onKeySpace() {
    if (this._stage === 1 && this._coffeeStep === 2) {
      // Start brew
      showNotification('Brewing... ☕');
      this._brewing = true;
      this._brewProgress = 0;
      this._setProgressVisible(true);
      this._showInstruction('Brewing… watch the progress bar!');
    } else if (this._stage === 1) {
      this._oops('Oops! Grind (E) and tamp (F) first.');
    }
  }

  _advanceToTableService() {
    this._stage = 2;
    this._setProgressVisible(false);
    this._showInstruction(`Deliver to ${this._currentTable.label}!\nWalk there and press E.`);
  }

  _deliverAttempt() {
    // Use last known player position — stored via update(); fallback: accept anyway
    // We rely on the update() proximity check to set a flag
    this._ordersLeft--;
    const remaining = this._ordersLeft;
    if (remaining > 0) {
      showNotification(`Delivered! Great work! 🌟 (${remaining} order${remaining !== 1 ? 's' : ''} left this shift)`);
      this._nextOrder();
    } else {
      showNotification('Last order delivered! Shift complete! ✨');
      this._finish();
    }
  }

  _oops(msg) {
    showNotification(`${msg}`);
    this._showInstruction(this._currentStageHint());
  }

  _currentStageHint() {
    if (this._stage === 0) return `Customer: "${this._currentOrder}"\nPress E to take the order.`;
    if (this._stage === 1) {
      if (this._coffeeStep === 0) return 'Making coffee:\nPress E to grind.';
      if (this._coffeeStep === 1) return 'Making coffee:\nPress F to tamp.';
      return 'Making coffee:\nPress Space to brew.';
    }
    return `Deliver to ${this._currentTable.label}! Walk there and press E.`;
  }

  _finish() {
    this._active = false;
    this._removeKeyHandlers();
    this._hideOverlay();
    showNotification("Shift over! Thanks for helping at the café. ☕✨");
  }

  _removeKeyHandlers() {
    if (this._keyHandler) { window.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
  }

  _buildOverlay() {
    if (this._overlay) return;
    const el = document.createElement('div');
    el.id = 'cafe-minigame-overlay';
    el.style.cssText = [
      'position:fixed', 'top:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(44,26,10,0.88)', 'color:#ffeedd',
      'padding:20px 32px', 'border-radius:18px',
      'font-size:16px', 'font-family:sans-serif', 'line-height:1.7',
      'pointer-events:none', 'z-index:300', 'text-align:center',
      'max-width:420px', 'display:none',
      'backdrop-filter:blur(6px)',
      'border:1.5px solid rgba(255,210,120,0.35)',
    ].join(';');
    document.body.appendChild(el);
    this._overlay = el;

    // Progress bar container
    const barWrap = document.createElement('div');
    barWrap.style.cssText = [
      'width:100%', 'height:10px', 'background:rgba(255,255,255,0.2)',
      'border-radius:6px', 'margin-top:12px', 'overflow:hidden', 'display:none',
    ].join(';');
    const fill = document.createElement('div');
    fill.style.cssText = [
      'height:100%', 'width:0%', 'background:#f0a030',
      'border-radius:6px', 'transition:width 0.1s linear',
    ].join(';');
    barWrap.appendChild(fill);
    el.appendChild(barWrap);
    this._progressBar = barWrap;
    this._progressFill = fill;
  }

  _showOverlay() {
    if (this._overlay) this._overlay.style.display = 'block';
  }

  _hideOverlay() {
    if (this._overlay) this._overlay.style.display = 'none';
  }

  _showInstruction(text) {
    if (!this._overlay) return;
    // Replace text content preserving the progress bar child
    const lines = text.split('\n');
    // Clear text nodes only
    Array.from(this._overlay.childNodes).forEach(n => {
      if (n !== this._progressBar) this._overlay.removeChild(n);
    });
    const title = document.createElement('div');
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:6px;color:#ffd080;';
    title.textContent = `☕ Café Help  (${this._ordersLeft} order${this._ordersLeft !== 1 ? 's' : ''} left)`;
    this._overlay.insertBefore(title, this._progressBar);
    lines.forEach(line => {
      const p = document.createElement('div');
      p.textContent = line;
      this._overlay.insertBefore(p, this._progressBar);
    });
  }

  _setProgressVisible(visible) {
    if (this._progressBar) this._progressBar.style.display = visible ? 'block' : 'none';
    if (this._progressFill) this._progressFill.style.width = '0%';
  }
}

export function createCafeHelpMiniGame() {
  return new CafeHelpMiniGame();
}
