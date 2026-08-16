# Dryad + Gaia Flora Integration Plan
# Island Master — Procedural Vegetation Layer

> **For Hermes:** Discuss each phase with Dan before implementing. This touches both Island and World.

**Goal:** Integrate Dryad's procedural flora generation (trees, grass, plants from a seed + planet envelope) into Island Master's biome layer, so every biome zone grows ecologically coherent, seed-deterministic vegetation — no authored 3D models required.

**Architecture:**
- Phase 1 — Copy the **generation-only** files from Dryad (pure ESM, zero Three.js dependency) into `island-master/flora/gen/`
- Phase 2 — Write a thin **renderer** in `flora/render/` that consumes Dryad's `graph`/`foliage` typed arrays and builds Three.js `BufferGeometry` compatible with Island's r158 renderer
- Phase 3 — Wire the **ClimateModel** → `PlanetEnvelope` bridge so biome conditions drive what plants grow where
- Phase 4 — Use `biosphere.js` to stamp per-biome species families from world gen data (for World)

**Tech Stack:** Three.js r158 (WebGL2), Island Master's existing mesher/renderer, Dryad r160 generation pipeline (pure ESM, no Three.js)

---

## Context

### Source repos (already cloned)
| Repo | Path | Three.js |
|---|---|---|
| Dryad (flora/trees) | `/home/dcb/dryad/` | r160 WebGL2 |
| Gaia (grass) | `/home/dcb/gaia/` | r160 WebGL2 |
| Island Master | `/home/dcb/island-master/` | r158 WebGL2 |

### Why this works cleanly
Dryad's CLAUDE.md explicitly splits two independent pipelines:

**Generation pipeline** (pure ESM, no Three.js — safe to copy verbatim):
```
rng.js → genome.js → genomeSchema.js → allometry.js → skeleton.js →
proportions.js → foliage.js → mutate.js → biosphere.js → archetype.js
```
These files only use JS primitives and typed arrays. Node-testable. Zero renderer dependency.

**Render pipeline** (Three.js-specific — rewrite for r158):
`branchMesh.js`, `leafMesh.js`, `barkMaterial.js`, `leafTexture.js`, `viewer.js`
These are the parts we rewrite to match Island's renderer.

### Key data contracts
- **Input**: `PlanetEnvelope { gravity, light, sunAngle, wind, aridity, temperature }`
- **Output of `resolve(genome, env)`**: `{ graph, foliage, pigment, woodiness, lightDir }`
  - `graph.nodes[]` — branch skeleton with position, radius, parent index
  - `graph.bones[]` — bone pairs for the branch mesh
  - `foliage` — Structure-of-Arrays: `{ count, position(3N), normal(3N), scale(N), rotation(N), exposure(N) }`

### Island Master's existing biome zones
18 named zones from `terrain.js` → `getZone(lwx, lwz)`:
`town, village, plains, forest, highland_forest, wind_ridge, clifftops, summit, mountain, harbour, fishing_village, salt_marsh, kelp_cove, tidepools, sandy_bay, hidden_beach, coast`

Each zone maps naturally to a `PlanetEnvelope`:
- `forest` → `{ light: 0.5, wind: 0.15, aridity: 0.1 }`
- `clifftops` → `{ light: 0.8, wind: 0.85, aridity: 0.6 }`
- `summit` → `{ light: 0.7, wind: 0.9, aridity: 0.7, gravity: 1.2 }`
- `salt_marsh` → `{ light: 0.6, wind: 0.4, aridity: 0.0 }`

---

## Phase 1 — Copy Generation Pipeline
*No code changes, pure copy. Safe to do now.*

### Task 1.1: Create flora directory structure

```bash
mkdir -p /home/dcb/island-master/flora/gen
mkdir -p /home/dcb/island-master/flora/render
mkdir -p /home/dcb/island-master/flora/biomes
```

### Task 1.2: Copy generation files verbatim from Dryad

Files to copy from `/home/dcb/dryad/src/` → `/home/dcb/island-master/flora/gen/`:

```bash
# Core generation pipeline (no Three.js)
cp /home/dcb/dryad/src/rng.js              flora/gen/
cp /home/dcb/dryad/src/genome.js           flora/gen/
cp /home/dcb/dryad/src/genomeSchema.js     flora/gen/
cp /home/dcb/dryad/src/allometry.js        flora/gen/
cp /home/dcb/dryad/src/skeleton.js         flora/gen/
cp /home/dcb/dryad/src/proportions.js      flora/gen/
cp /home/dcb/dryad/src/foliage.js          flora/gen/
cp /home/dcb/dryad/src/mutate.js           flora/gen/
cp /home/dcb/dryad/src/biosphere.js        flora/gen/
cp /home/dcb/dryad/src/archetype.js        flora/gen/
cp /home/dcb/dryad/src/colorRamp.js        flora/gen/
cp /home/dcb/dryad/src/envelope.js         flora/gen/   # just a comment/doc file
```

**Do NOT copy:** `main.js`, `viewer.js`, `branchMesh.js`, `leafMesh.js`, `barkMaterial.js`, `leafTexture.js`, `environment.js`, `ground.js` — these are the r160 render layer.

### Task 1.3: Fix internal imports (path adjustment only)

All imports within the generation files use `./filename.js` — they'll just work as-is since they're all in the same `flora/gen/` directory. No changes needed.

### Task 1.4: Verify generation pipeline runs in Node

```bash
cd /home/dcb/island-master
node --input-type=module <<'EOF'
import { randomGenome, resolve } from './flora/gen/genome.js';
const env = { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
              light: 0.6, sunAngle: 0.25, wind: 0.2, aridity: 0.35, temperature: 15 };
const genome = randomGenome(env, 12345);
const result = resolve(genome, env);
console.log('Nodes:', result.graph.nodes.length);
console.log('Foliage count:', result.foliage.count);
console.log('Pigment:', result.pigment);
EOF
```

Expected output: `Nodes: 200+`, `Foliage count: 500+`, `Pigment: [float]`

---

## Phase 2 — Island-Native Renderer
*Write thin renderers that consume `graph`/`foliage` and produce r158-compatible geometry.*
*Discuss visual approach with Dan before starting — toon vs PBR vs flat.*

### Task 2.1: Write `flora/render/branchRenderer.js`

Consume `graph` → produce a merged `THREE.BufferGeometry` of tapered tubes.

**Approach:** Simplified version of Dryad's `branchMesh.js`. For each bone `{a, b}` in `graph.bones`:
- Get `nodeA.pos`, `nodeB.pos`, `nodeA.radius`, `nodeB.radius`
- Emit a tapered cylinder segment (8-sided, ~5 segments each)
- Merge all into a single `BufferGeometry` (one draw call)

**Key difference from Dryad's version:** No `onBeforeCompile` GLSL injection — use Island's existing `MeshStandardMaterial` or `toon-material.js` from `render/`. No wind bones needed for now.

```js
// flora/render/branchRenderer.js
import * as THREE from 'three'; // Island's r158 import

export function buildBranchGeometry(graph) {
  // ... tapered tube builder
  // returns { geometry: THREE.BufferGeometry, dispose() }
}
```

**Pitfall:** r158 vs r160 — Three.js API is identical for `BufferGeometry`, `BufferAttribute`, `Mesh`. No changes needed here.

### Task 2.2: Write `flora/render/foliageRenderer.js`

Consume `foliage` SoA → produce an `InstancedMesh` of leaf cards.

```js
// flora/render/foliageRenderer.js
export function buildFoliageMesh(foliage, pigment) {
  // PlaneGeometry(0.3, 0.3) leaf card
  // InstancedMesh with count = foliage.count
  // Set instanceMatrix from position[i], normal[i], rotation[i], scale[i]
  // Set instanceColor from pigment + exposure[i] (darker inner leaves)
  // returns { mesh: THREE.InstancedMesh, dispose() }
}
```

**Shortcut for v1:** Use `MeshLambertMaterial` with `vertexColors: true` — fastest, no shader. Add toon material in a later pass.

### Task 2.3: Write `flora/render/floraRenderer.js` (combinator)

```js
// flora/render/floraRenderer.js
import { buildBranchGeometry } from './branchRenderer.js';
import { buildFoliageMesh } from './foliageRenderer.js';
import { resolve } from '../gen/genome.js';

export function buildFloraInstance(genome, env) {
  const result = resolve(genome, env);
  const branch = buildBranchGeometry(result.graph);
  const foliage = buildFoliageMesh(result.foliage, result.pigment);
  const group = new THREE.Group();
  group.add(branch.mesh, foliage.mesh);
  return {
    group,
    dispose() { branch.dispose(); foliage.dispose(); }
  };
}
```

### Task 2.4: Smoke test — render one tree

Create `flora/test-render.html` — a minimal standalone viewer:

```html
<!-- Serves at localhost:8931/flora/test-render.html -->
<!-- Loads one tree from seed 12345 in the forest env -->
<!-- PerspectiveCamera, OrbitControls, one DirectionalLight -->
```

Verify visually: tree has branches, leaves, looks vaguely tree-shaped.

---

## Phase 3 — Biome → Envelope Bridge
*Wire Island's climate/zone system to Dryad's PlanetEnvelope.*

### Task 3.1: Write `flora/biomes/envelopes.js`

Map Island's 18 zone names to `PlanetEnvelope` objects:

```js
// flora/biomes/envelopes.js
// Each zone gets an envelope tuned to its ecology.
// These drive what plants Dryad generates — no explicit "plant type" selection.

export const ZONE_ENVELOPES = {
  forest:          { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.45, sunAngle: 0.35, wind: 0.15, aridity: 0.1, temperature: 12 },
  highland_forest: { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.55, sunAngle: 0.2,  wind: 0.45, aridity: 0.25, temperature: 8 },
  clifftops:       { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.8,  sunAngle: 0.15, wind: 0.85, aridity: 0.6, temperature: 10 },
  salt_marsh:      { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.7,  sunAngle: 0.3,  wind: 0.35, aridity: 0.0, temperature: 14 },
  plains:          { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.8,  sunAngle: 0.2,  wind: 0.3,  aridity: 0.35, temperature: 13 },
  coast:           { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.75, sunAngle: 0.2,  wind: 0.55, aridity: 0.45, temperature: 12 },
  wind_ridge:      { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.8,  sunAngle: 0.15, wind: 0.9,  aridity: 0.55, temperature: 9  },
  // ... remaining zones
};

// If ClimateModel provides per-tile temperature/humidity, use those instead:
export function envelopeFromClimate(climateCell) {
  return {
    gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
    light:       Math.max(0.1, 1.0 - climateCell.cloudCover),
    sunAngle:    climateCell.sunAngle ?? 0.25,
    wind:        Math.min(1.0, climateCell.windSpeed / 20),  // 20 m/s = max
    aridity:     1.0 - climateCell.moisture,
    temperature: climateCell.temperature,
  };
}
```

### Task 3.2: Write `flora/biomes/floraPlacement.js`

Poisson-disk place flora instances across a biome zone, one genome per species slot:

```js
// flora/biomes/floraPlacement.js
import { generateBiosphere } from '../gen/biosphere.js';
import { ZONE_ENVELOPES } from './envelopes.js';

// Given a zone name + world seed, return N genomes for that zone's species.
// Same zone + same worldSeed → identical species every time (deterministic).
export function getZoneSpecies(zoneName, worldSeed, count = 8) {
  const env = ZONE_ENVELOPES[zoneName] ?? ZONE_ENVELOPES.coast;
  const rootSeed = hashZone(zoneName, worldSeed);
  return generateBiosphere(env, count, rootSeed, 0.4).species;
  // 0.4 strength → related but visibly varied species
}

function hashZone(name, seed) {
  // Simple string hash XOR'd with seed
  let h = seed >>> 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x9E3779B1) >>> 0;
  return h;
}
```

### Task 3.3: Write `flora/biomes/floraLayer.js`

The top-level integration point — builds a `THREE.Group` of all flora for a given map area:

```js
// flora/biomes/floraLayer.js
import { getZoneSpecies } from './floraPlacement.js';
import { buildFloraInstance } from '../render/floraRenderer.js';
import { ZONE_ENVELOPES } from './envelopes.js';
import { randomGenome } from '../gen/genome.js';

// Build a flora Group for a chunk or biome zone.
// zonePoints = [{ x, z, zone }] — surface points with their zone classification
export function buildFloraGroup(zonePoints, worldSeed, scene) {
  const group = new THREE.Group();
  const speciesCache = {};   // zone → species[]

  for (const pt of zonePoints) {
    // Get (or cache) species for this zone
    if (!speciesCache[pt.zone]) {
      speciesCache[pt.zone] = getZoneSpecies(pt.zone, worldSeed);
    }
    const species = speciesCache[pt.zone];

    // Pick a species deterministically from position hash
    const ptSeed = posHash(pt.x, pt.z, worldSeed);
    const specIdx = ptSeed % species.length;
    const genome = { ...species[specIdx], structuralSeed: ptSeed };

    const env = ZONE_ENVELOPES[pt.zone] ?? ZONE_ENVELOPES.coast;
    const flora = buildFloraInstance(genome, env);
    flora.group.position.set(pt.x, 0, pt.z);
    group.add(flora.group);
  }

  return group;
}
```

### Task 3.4: Verification — populate forest zone

In `integration.mjs`, add assertions:
```js
// Flora layer generates without errors
import { getZoneSpecies } from './flora/biomes/floraPlacement.js';
const species = getZoneSpecies('forest', 42, 6);
assert(species.length === 6, 'biosphere returns 6 species');
assert(species[0].branchiness !== undefined, 'genomes are valid');
// All species from same zone should have some phenotypic similarity
```

Run: `node integration.mjs` — expect all assertions pass.

---

## Phase 4 — World Integration (Future)
*Demiurge → Dryad pipeline for World's planet-scale ecology.*

### Concept

World has a 128×128 tile grid with `ClimateModel` providing per-tile data. Each tile already has `elevation`, `temperature`, `moisture`, `biome`. With the envelope bridge in place:

```
World tile → envelopeFromClimate(tile) → generateBiosphere(env, 12, tileSeed) → species[]
```

This gives World a per-tile species family — a forest tile and a neighbouring grassland tile share an ancestor (they're geographically related) but diverge based on their climate envelope.

### When Demiurge matters

Demiurge's WebGPU pipeline bakes full planet geology (tectonics → erosion → climate → biomes). Its output could replace ClimateModel entirely for World, giving:
- Actual river valleys with riparian vegetation
- Rain shadow effects (arid species on the leeward mountain side)
- Volcanic soil zones (different mineral composition → different flora)

**This is a longer-term goal** — Demiurge is WebGPU (r182) and would need a data-extraction layer to feed into World's existing JS simulation. Worth revisiting when World's simulation layer needs grounding in real planetary geography.

### Gaia (grass)

Gaia's genome space covers grass as a region of Dryad's continuous morphospace (low branchiness, high tillering, low trunk height). The existing `flora/gen/` pipeline already generates grass — it's the same `randomGenome` + `resolve` call with a grass-biome envelope. No separate Gaia integration needed.

**Grass-specific envelope tuning:**
```js
const MEADOW_ENV = { gravity: 1.0, medium: 'air', energy: 'photo', biochem: 'carbon',
                     light: 0.9, sunAngle: 0.2, wind: 0.3, aridity: 0.4, temperature: 13 };
// Produces short, tillered, wind-streamlined plants — reads as grass
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| r158/r160 API diff in renderer | Low | Medium | BufferGeometry API is stable; only `onBeforeCompile` GLSL differs (we're not using it) |
| Generation files import each other in unexpected ways | Low | Low | All imports are relative `./file.js` — copy the whole set together |
| Performance — too many flora instances | Medium | High | Start with ≤50 per chunk, use InstancedMesh, cull by frustum |
| `resolve()` is slow for many plants | Low | Medium | Generation is fast (~1ms per plant); cache resolved results per species+seed |
| Grass as InstancedMesh (100k blades) | High | Medium | Phase 4 problem — start with tree-scale flora only |

---

## Decisions (confirmed)

| Decision | Choice |
|---|---|
| **Renderer** | PBR — `MeshStandardMaterial` |
| **Collision** | Separate collision list (no voxel grid stamps) |
| **Existing trees** | Replace all `makeTree()` calls in `scene.js` |
| **Scope** | Island only first |
| **Wind animation** | Wire Dryad's GPU bone solver now |
| **Density** | 8–15 trees per chunk (moderate) — forest 15, plains 5, clifftops 3 |

---

## File Summary

```
island-master/
  flora/
    gen/              ← Copied verbatim from Dryad (pure ESM, no Three.js)
      rng.js
      genome.js
      genomeSchema.js
      allometry.js
      skeleton.js
      proportions.js
      foliage.js
      mutate.js
      biosphere.js
      archetype.js
      colorRamp.js
      envelope.js     (doc only)
    render/           ← Written fresh for r158
      branchRenderer.js
      foliageRenderer.js
      floraRenderer.js
    biomes/           ← The bridge layer
      envelopes.js    ← Zone name → PlanetEnvelope
      floraPlacement.js  ← Zone + worldSeed → species[]
      floraLayer.js   ← Build THREE.Group for a chunk
  integration.mjs     ← Add flora assertions here
```

Total new code: ~400 LOC across 5 files (plus the copied gen files).
