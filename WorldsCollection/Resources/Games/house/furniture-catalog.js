/**
 * furniture-catalog.js
 * Shared catalog of placeable furniture items.
 * Imported by both editor.html and index.html.
 *
 * Each entry: { id, label, category, color (CSS hex for swatch), build() → THREE.Group }
 * Groups are built with y=0 as the floor contact point.
 */
import * as THREE from 'three';

const _matCache = new Map();
function mat(hex, opts) {
  const key = hex + '|' + JSON.stringify(opts || {});
  if (!_matCache.has(key)) {
    _matCache.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, metalness: 0, ...opts }));
  }
  return _matCache.get(key);
}
function bx(w, h, d, hex, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, segs, hex, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat(hex, opts));
  m.castShadow = true;
  return m;
}
function sph(r, segs, hex, opts) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, Math.ceil(segs * 0.7)), mat(hex, opts));
  m.castShadow = true;
  return m;
}

export const CATALOG = [
  // ─── Seating ───────────────────────────────────────────────────────────────
  {
    id: 'dining-chair', label: 'Dining Chair', category: 'Seating', color: '#7a5535',
    build() {
      const g = new THREE.Group();
      const seat = bx(0.48, 0.05, 0.46, 0x9a7a55); seat.position.set(0, 0.46, 0); g.add(seat);
      const back = bx(0.48, 0.76, 0.05, 0x7a5535); back.position.set(0, 0.87, 0.2); g.add(back);
      [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(([x, z]) => {
        const leg = bx(0.04, 0.44, 0.04, 0x6a4525);
        leg.position.set(x, 0.22, z); g.add(leg);
      });
      return g;
    },
  },
  {
    id: 'armchair', label: 'Armchair', category: 'Seating', color: '#5a7a8a',
    build() {
      const g = new THREE.Group();
      const base = bx(0.85, 0.2, 0.82, 0x3a3e44); base.position.set(0, 0.1, 0); g.add(base);
      const seat = bx(0.82, 0.16, 0.78, 0x5a7a8a); seat.position.set(0, 0.28, 0); g.add(seat);
      const back = bx(0.82, 0.68, 0.12, 0x4a6a7a); back.position.set(0, 0.62, 0.33); g.add(back);
      const arm1 = bx(0.12, 0.32, 0.78, 0x3a5a6a); arm1.position.set(-0.35, 0.46, 0); g.add(arm1);
      const arm2 = arm1.clone(); arm2.position.set(0.35, 0.46, 0); g.add(arm2);
      return g;
    },
  },
  {
    id: 'sofa-2', label: 'Sofa (2-seat)', category: 'Seating', color: '#8a7a60',
    build() {
      const g = new THREE.Group();
      const base = bx(1.8, 0.22, 0.88, 0x4a4038); base.position.set(0, 0.11, 0); g.add(base);
      const seat = bx(1.76, 0.18, 0.84, 0x8a7a60); seat.position.set(0, 0.31, 0); g.add(seat);
      const back = bx(1.76, 0.64, 0.14, 0x7a6a50); back.position.set(0, 0.68, 0.37); g.add(back);
      const arm1 = bx(0.14, 0.44, 0.88, 0x6a5a40); arm1.position.set(-0.83, 0.44, 0); g.add(arm1);
      const arm2 = arm1.clone(); arm2.position.set(0.83, 0.44, 0); g.add(arm2);
      [-.5, .5].forEach(x => {
        const cushion = bx(0.7, 0.14, 0.6, 0x9a8a6a); cushion.position.set(x, 0.42, -0.08); g.add(cushion);
      });
      return g;
    },
  },
  {
    id: 'sofa-3', label: 'Sofa (3-seat)', category: 'Seating', color: '#5a7a8a',
    build() {
      const g = new THREE.Group();
      const base = bx(2.6, 0.22, 0.92, 0x3a3e44); base.position.set(0, 0.11, 0); g.add(base);
      const seat = bx(2.56, 0.18, 0.88, 0x5a7a8a); seat.position.set(0, 0.31, 0); g.add(seat);
      const back = bx(2.56, 0.7, 0.14, 0x4a6a7a); back.position.set(0, 0.72, 0.39); g.add(back);
      const arm1 = bx(0.14, 0.5, 0.92, 0x3a5a6a); arm1.position.set(-1.23, 0.46, 0); g.add(arm1);
      const arm2 = arm1.clone(); arm2.position.set(1.23, 0.46, 0); g.add(arm2);
      [-0.78, 0, 0.78].forEach(x => {
        const cushion = bx(0.72, 0.14, 0.62, 0x6a8a9a); cushion.position.set(x, 0.42, -0.08); g.add(cushion);
      });
      return g;
    },
  },
  {
    id: 'lounge-chair', label: 'Lounge Chair', category: 'Seating', color: '#a06830',
    build() {
      const g = new THREE.Group();
      // Eames-ish style
      const seat = bx(0.7, 0.08, 0.65, 0xa06830); seat.position.set(0, 0.36, 0); g.add(seat);
      const back = bx(0.7, 0.56, 0.08, 0xa06830); back.position.set(0, 0.64, 0.28); back.rotation.x = 0.12; g.add(back);
      const pedestal = cyl(0.06, 0.12, 0.34, 8, 0x606870); pedestal.position.set(0, 0.17, 0); g.add(pedestal);
      const base = cyl(0.28, 0.28, 0.04, 12, 0x808888); base.position.set(0, 0.02, 0); g.add(base);
      return g;
    },
  },

  // ─── Tables ────────────────────────────────────────────────────────────────
  {
    id: 'coffee-table', label: 'Coffee Table', category: 'Tables', color: '#2a4a60',
    build() {
      const g = new THREE.Group();
      const top = bx(1.4, 0.05, 0.7, 0x2a4a60, { transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.5 });
      top.position.set(0, 0.42, 0); g.add(top);
      [[-.56, -.28], [.56, -.28], [-.56, .28], [.56, .28]].forEach(([x, z]) => {
        const leg = bx(0.04, 0.4, 0.04, 0x606870); leg.position.set(x, 0.2, z); g.add(leg);
      });
      return g;
    },
  },
  {
    id: 'side-table', label: 'Side Table', category: 'Tables', color: '#c08858',
    build() {
      const g = new THREE.Group();
      const top = bx(0.55, 0.04, 0.55, 0xc09060); top.position.set(0, 0.62, 0); g.add(top);
      const shaft = cyl(0.04, 0.04, 0.58, 8, 0x808888); shaft.position.set(0, 0.32, 0); g.add(shaft);
      const foot = bx(0.4, 0.04, 0.4, 0x606868); foot.position.set(0, 0.02, 0); g.add(foot);
      return g;
    },
  },
  {
    id: 'dining-table-4', label: 'Dining Table (4)', category: 'Tables', color: '#b08858',
    build() {
      const g = new THREE.Group();
      const top = bx(1.6, 0.06, 0.9, 0xb08858); top.position.set(0, 0.76, 0); g.add(top);
      [[-.64, -.36], [.64, -.36], [-.64, .36], [.64, .36]].forEach(([x, z]) => {
        const leg = bx(0.06, 0.73, 0.06, 0x8a6838); leg.position.set(x, 0.365, z); g.add(leg);
      });
      return g;
    },
  },
  {
    id: 'dining-table-6', label: 'Dining Table (6)', category: 'Tables', color: '#9a6838',
    build() {
      const g = new THREE.Group();
      const top = bx(2.4, 0.06, 1.0, 0xb08858); top.position.set(0, 0.76, 0); g.add(top);
      [[-.98, -.4], [.98, -.4], [-.98, .4], [.98, .4], [0, -.4], [0, .4]].forEach(([x, z]) => {
        const leg = bx(0.06, 0.73, 0.06, 0x8a6838); leg.position.set(x, 0.365, z); g.add(leg);
      });
      return g;
    },
  },
  {
    id: 'desk', label: 'Desk', category: 'Tables', color: '#9a6a45',
    build() {
      const g = new THREE.Group();
      const top = bx(1.6, 0.05, 0.72, 0x9a6a45); top.position.set(0, 0.76, 0); g.add(top);
      const modesty = bx(1.58, 0.62, 0.04, 0x8a5a35); modesty.position.set(0, 0.44, 0.34); g.add(modesty);
      [[-.72, -.3], [.72, -.3]].forEach(([x, z]) => {
        const leg = bx(0.05, 0.74, 0.05, 0x7a4a28); leg.position.set(x, 0.37, z); g.add(leg);
      });
      const cross = bx(1.4, 0.04, 0.04, 0x7a4a28); cross.position.set(0, 0.22, -.3); g.add(cross);
      return g;
    },
  },
  {
    id: 'island-unit', label: 'Kitchen Island', category: 'Tables', color: '#d4cec8',
    build() {
      const g = new THREE.Group();
      const body = bx(1.8, 0.88, 0.8, 0xc4beb8); body.position.set(0, 0.44, 0); g.add(body);
      const top = bx(1.84, 0.05, 0.84, 0xe0dcd8); top.position.set(0, 0.9, 0); g.add(top);
      // drawer faces
      [-0.5, 0.5].forEach(x => {
        const drawer = bx(0.76, 0.28, 0.02, 0xd8d0c8); drawer.position.set(x, 0.48, 0.42); g.add(drawer);
        const handle = bx(0.3, 0.03, 0.03, 0x909090); handle.position.set(x, 0.48, 0.44); g.add(handle);
      });
      return g;
    },
  },

  // ─── Storage ───────────────────────────────────────────────────────────────
  {
    id: 'bookshelf', label: 'Bookshelf', category: 'Storage', color: '#6a5030',
    build() {
      const g = new THREE.Group();
      const body = bx(1.0, 1.8, 0.3, 0x7a6040); body.position.set(0, 0.9, 0); g.add(body);
      const colors = [0xb84040, 0x4060b8, 0x40a840, 0xb8b040, 0x884488, 0xa07030];
      [0.28, 0.68, 1.08, 1.48].forEach(y => {
        const shelf = bx(0.94, 0.03, 0.28, 0x9a7a50); shelf.position.set(0, y, 0); g.add(shelf);
        let xOff = -0.38;
        for (let i = 0; i < 6; i++) {
          const bkW = 0.06 + Math.random() * 0.04;
          const bkH = 0.16 + Math.random() * 0.06;
          const bk = bx(bkW, bkH, 0.22, colors[i % colors.length]);
          bk.position.set(xOff + bkW / 2, y + bkH / 2, 0);
          xOff += bkW + 0.01;
          if (xOff > 0.4) break;
          g.add(bk);
        }
      });
      return g;
    },
  },
  {
    id: 'wardrobe', label: 'Wardrobe', category: 'Storage', color: '#8a8880',
    build() {
      const g = new THREE.Group();
      const body = bx(1.8, 2.1, 0.62, 0x9a9890); body.position.set(0, 1.05, 0); g.add(body);
      const divider = bx(0.04, 2.0, 0.6, 0x7a7870); divider.position.set(0, 1.0, 0); g.add(divider);
      [-0.36, 0.36].forEach(x => {
        const handle = bx(0.04, 0.22, 0.04, 0xb0a898); handle.position.set(x, 1.05, 0.33); g.add(handle);
      });
      return g;
    },
  },
  {
    id: 'tv-unit', label: 'TV Unit', category: 'Storage', color: '#3a3e44',
    build() {
      const g = new THREE.Group();
      const body = bx(1.6, 0.48, 0.46, 0x3a3e44); body.position.set(0, 0.24, 0); g.add(body);
      const tv = bx(1.4, 0.82, 0.06, 0x1a1c1e); tv.position.set(0, 0.89, 0.18); g.add(tv);
      const screen = bx(1.3, 0.72, 0.01, 0x060e18, { emissive: 0x061020, roughness: 0.05, metalness: 0.9 });
      screen.position.set(0, 0.89, 0.21); g.add(screen);
      return g;
    },
  },
  {
    id: 'sideboard', label: 'Sideboard', category: 'Storage', color: '#a07848',
    build() {
      const g = new THREE.Group();
      const body = bx(1.8, 0.75, 0.48, 0xa07848); body.position.set(0, 0.425, 0); g.add(body);
      const top = bx(1.82, 0.04, 0.5, 0xc09050); top.position.set(0, 0.82, 0); g.add(top);
      [-0.62, 0, 0.62].forEach(x => {
        const door = bx(0.56, 0.62, 0.02, 0x907040); door.position.set(x, 0.39, 0.26); g.add(door);
        const knob = cyl(0.02, 0.02, 0.04, 6, 0xb8a070); knob.rotation.x = Math.PI / 2; knob.position.set(x, 0.39, 0.29); g.add(knob);
      });
      const leg1 = bx(0.08, 0.1, 0.48, 0x7a5a28); leg1.position.set(-0.82, 0.05, 0); g.add(leg1);
      const leg2 = leg1.clone(); leg2.position.set(0.82, 0.05, 0); g.add(leg2);
      return g;
    },
  },

  // ─── Beds ──────────────────────────────────────────────────────────────────
  {
    id: 'bed-double', label: 'Bed (Double)', category: 'Beds', color: '#9a8a70',
    build() {
      const g = new THREE.Group();
      const frame = bx(1.8, 0.26, 2.2, 0x9a8a70); frame.position.set(0, 0.13, 0); g.add(frame);
      const mattress = bx(1.66, 0.22, 2.04, 0xe8e0d0); mattress.position.set(0, 0.37, 0); g.add(mattress);
      const head = bx(1.8, 0.88, 0.1, 0x8a7a60); head.position.set(0, 0.54, 1.05); g.add(head);
      const foot = bx(1.8, 0.3, 0.08, 0x8a7a60); foot.position.set(0, 0.29, -1.06); g.add(foot);
      [-0.38, 0.38].forEach(x => {
        const pillow = bx(0.7, 0.12, 0.44, 0xf0eae0); pillow.position.set(x, 0.52, 0.74); g.add(pillow);
      });
      const duvet = bx(1.62, 0.14, 1.4, 0xd8d0c0); duvet.position.set(0, 0.52, -0.3); g.add(duvet);
      return g;
    },
  },
  {
    id: 'bed-single', label: 'Bed (Single)', category: 'Beds', color: '#9a8a70',
    build() {
      const g = new THREE.Group();
      const frame = bx(1.0, 0.24, 2.0, 0x9a8a70); frame.position.set(0, 0.12, 0); g.add(frame);
      const mattress = bx(0.9, 0.2, 1.86, 0xe8e0d0); mattress.position.set(0, 0.34, 0); g.add(mattress);
      const head = bx(1.0, 0.72, 0.08, 0x8a7a60); head.position.set(0, 0.5, 0.94); g.add(head);
      const pillow = bx(0.68, 0.1, 0.42, 0xf0eae0); pillow.position.set(0, 0.49, 0.62); g.add(pillow);
      const duvet = bx(0.9, 0.12, 1.32, 0xd0c8b8); duvet.position.set(0, 0.49, -0.22); g.add(duvet);
      return g;
    },
  },
  {
    id: 'nightstand', label: 'Nightstand', category: 'Beds', color: '#9a8a70',
    build() {
      const g = new THREE.Group();
      const body = bx(0.52, 0.55, 0.42, 0x9a8a70); body.position.set(0, 0.3, 0); g.add(body);
      const top = bx(0.54, 0.04, 0.44, 0xb0a080); top.position.set(0, 0.59, 0); g.add(top);
      const drawer = bx(0.44, 0.18, 0.02, 0x8a7a60); drawer.position.set(0, 0.22, 0.22); g.add(drawer);
      const knob = cyl(0.02, 0.02, 0.03, 6, 0xb0a080); knob.rotation.x = Math.PI / 2; knob.position.set(0, 0.22, 0.24); g.add(knob);
      return g;
    },
  },

  // ─── Lighting ──────────────────────────────────────────────────────────────
  {
    id: 'floor-lamp', label: 'Floor Lamp', category: 'Lighting', color: '#e8d8a0',
    build() {
      const g = new THREE.Group();
      const foot = bx(0.3, 0.04, 0.3, 0x4a5058); foot.position.set(0, 0.02, 0); g.add(foot);
      const stem = cyl(0.025, 0.025, 1.6, 8, 0x606870); stem.position.set(0, 0.82, 0); g.add(stem);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 0.32, 12, 1, true),
        mat(0xe8d8a0, { side: THREE.DoubleSide }),
      );
      shade.position.set(0, 1.67, 0); g.add(shade);
      const bulb = sph(0.05, 8, 0xffffee, { emissive: 0xffffaa, emissiveIntensity: 0.8 });
      bulb.position.set(0, 1.63, 0); g.add(bulb);
      const light = new THREE.PointLight(0xffe8c0, 1.0, 6);
      light.position.set(0, 1.6, 0); g.add(light);
      return g;
    },
  },
  {
    id: 'table-lamp', label: 'Table Lamp', category: 'Lighting', color: '#d8c890',
    build() {
      const g = new THREE.Group();
      const base = cyl(0.1, 0.12, 0.08, 10, 0x6a6058); base.position.set(0, 0.04, 0); g.add(base);
      const neck = cyl(0.025, 0.025, 0.3, 8, 0x8a8078); neck.position.set(0, 0.23, 0); g.add(neck);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.12, 0.28, 10, 1, true),
        mat(0xd8c890, { side: THREE.DoubleSide }),
      );
      shade.position.set(0, 0.52, 0); g.add(shade);
      const light = new THREE.PointLight(0xffe8c0, 0.6, 4);
      light.position.set(0, 0.5, 0); g.add(light);
      return g;
    },
  },
  {
    id: 'pendant', label: 'Pendant Light', category: 'Lighting', color: '#c0a840',
    build() {
      const g = new THREE.Group();
      // Hangs from ceiling — base at y=0 means it's a ceiling-mount object,
      // place it at y=0 and the shade hangs down to ~y=-0.4
      const wire = cyl(0.01, 0.01, 2.6, 6, 0x404448); wire.position.set(0, 1.3, 0); g.add(wire);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.14, 0.28, 12, 1, true),
        mat(0xc0a840, { side: THREE.DoubleSide }),
      );
      shade.position.set(0, 0.14, 0); g.add(shade);
      const light = new THREE.PointLight(0xffe8c0, 1.2, 8);
      light.position.set(0, 0.0, 0); g.add(light);
      return g;
    },
  },

  // ─── Decor ─────────────────────────────────────────────────────────────────
  {
    id: 'plant-small', label: 'Plant (Small)', category: 'Decor', color: '#4a8a3a',
    build() {
      const g = new THREE.Group();
      const pot = cyl(0.15, 0.12, 0.22, 10, 0xa06848);
      pot.position.set(0, 0.11, 0); g.add(pot);
      const soil = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), mat(0x5a3a28));
      soil.rotation.x = -Math.PI / 2; soil.position.set(0, 0.23, 0); g.add(soil);
      const canopy = sph(0.28, 8, 0x4a8a3a);
      canopy.position.set(0, 0.56, 0); g.add(canopy);
      return g;
    },
  },
  {
    id: 'plant-large', label: 'Plant (Large)', category: 'Decor', color: '#3a7a2a',
    build() {
      const g = new THREE.Group();
      const pot = cyl(0.26, 0.2, 0.36, 10, 0x887060);
      pot.position.set(0, 0.18, 0); g.add(pot);
      const trunk = cyl(0.04, 0.06, 1.1, 7, 0x7a6040);
      trunk.position.set(0, 0.9, 0); g.add(trunk);
      [[0, 0, 0], [0.22, 0.28, 0.1], [-.2, 0.22, -.12], [0.08, 0.32, -.18], [-.1, 0.1, .2]].forEach(([x, y, z]) => {
        const leaf = sph(0.3, 7, 0x3a7a2a);
        leaf.scale.set(1.2, 0.7, 1.0);
        leaf.position.set(x, 1.12 + y, z); g.add(leaf);
      });
      return g;
    },
  },
  {
    id: 'rug-med', label: 'Rug (Medium)', category: 'Decor', color: '#8a6858',
    build() {
      const g = new THREE.Group();
      const border = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.0), mat(0x6a4838));
      border.rotation.x = -Math.PI / 2; border.position.set(0, 0.002, 0); g.add(border);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), mat(0x8a6858));
      rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.003, 0); g.add(rug);
      return g;
    },
  },
  {
    id: 'rug-large', label: 'Rug (Large)', category: 'Decor', color: '#6a5840',
    build() {
      const g = new THREE.Group();
      const border = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), mat(0x4a3828));
      border.rotation.x = -Math.PI / 2; border.position.set(0, 0.002, 0); g.add(border);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.8), mat(0x6a5840));
      rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.003, 0); g.add(rug);
      return g;
    },
  },
  {
    id: 'mirror', label: 'Wall Mirror', category: 'Decor', color: '#8ec8e8',
    build() {
      const g = new THREE.Group();
      const frame = bx(0.9, 1.4, 0.06, 0x9a8a70); frame.position.set(0, 1.0, 0); g.add(frame);
      const glass = bx(0.76, 1.26, 0.02, 0x8ec8e8, { transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.9 });
      glass.position.set(0, 1.0, 0.04); g.add(glass);
      return g;
    },
  },
  {
    id: 'artwork', label: 'Artwork (Framed)', category: 'Decor', color: '#a09080',
    build() {
      const g = new THREE.Group();
      const frame = bx(1.0, 0.75, 0.06, 0x3a3028); frame.position.set(0, 1.2, 0); g.add(frame);
      const canvas2 = bx(0.88, 0.63, 0.01, 0xd4c8b0); canvas2.position.set(0, 1.2, 0.04); g.add(canvas2);
      return g;
    },
  },
  {
    id: 'fireplace', label: 'Fireplace', category: 'Decor', color: '#8a7a70',
    build() {
      const g = new THREE.Group();
      const surround = bx(1.6, 1.2, 0.3, 0xc8c0b8); surround.position.set(0, 0.6, 0); g.add(surround);
      const opening = bx(0.9, 0.7, 0.26, 0x181818); opening.position.set(0, 0.42, 0.04); g.add(opening);
      const mantle = bx(1.7, 0.08, 0.36, 0xd8d0c8); mantle.position.set(0, 1.24, -0.03); g.add(mantle);
      const light = new THREE.PointLight(0xff6020, 0.8, 4);
      light.position.set(0, 0.3, 0.1); g.add(light);
      return g;
    },
  },
];
