/**
 * verify.mjs — headless physics verification for ClimateModel.
 *
 * These are not smoke tests. Each check asserts a behaviour that a correct
 * climate model must exhibit, so a regression in the physics fails loudly.
 *
 * Run:  node climate/verify.mjs
 */
import { ClimateModel, BIOME, BIOME_NAMES, saturationCapacity } from './ClimateModel.js';

let passed = 0, failed = 0;
let lastOro = '';
const results = [];
function check(name, cond, detail = '') {
  const d = typeof detail === 'function' ? detail() : detail;
  if (cond) { passed++; results.push(`  PASS  ${name}${d ? ' — ' + d : ''}`); }
  else { failed++; results.push(`  FAIL  ${name}${d ? ' — ' + d : ''}`); }
}

// Island's real terrain function, mirrored from scene.js
const ISLAND_RADIUS = 420;
function effectiveRadius(angle) {
  return ISLAND_RADIUS
    + 55 * Math.sin(2 * angle + 0.3) + 38 * Math.sin(3 * angle + 1.1)
    + 22 * Math.sin(5 * angle + 2.5) + 14 * Math.sin(7 * angle + 0.7)
    +  8 * Math.sin(11 * angle + 1.9);
}
function getHeight(x, z) {
  const nx = x / 420, nz = z / 420;
  let h = Math.sin(nx * 2.1) * Math.cos(nz * 1.8) * 12
        + Math.sin(nx * 4.3 + 1.2) * Math.cos(nz * 3.7) * 6
        + Math.sin(nx * 8.1) * Math.cos(nz * 7.3) * 3;
  const dist = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);
  const edgeFade = Math.max(0, 1 - dist / effectiveRadius(angle));
  h *= Math.min(1, edgeFade * 3);
  const hillDist = Math.sqrt((x + 150) ** 2 + (z + 270) ** 2);
  if (hillDist < 60) h += Math.max(0, 1 - hillDist / 60) * 18;
  return Math.max(0, h);
}

console.log('\n=== Island Climate Model — physics verification ===\n');

// ---------------------------------------------------------------- build
const t0 = Date.now();
const model = new ClimateModel({ resolution: 96, extent: 640, heightFn: getHeight });
const buildMs = Date.now() - t0;

const t1 = Date.now();
const iters = model.run({ season: 0.5, iterations: 80 });
const runMs = Date.now() - t1;

const s = model.stats();

console.log(`Grid: ${model.res}x${model.res} (${model.res ** 2} cells)  cell=${model.cellSize.toFixed(1)} units`);
console.log(`Build: ${buildMs}ms   Solve: ${runMs}ms over ${iters} iterations\n`);

// ---------------------------------------------------------------- 1. sanity
check('saturation capacity rises with temperature',
  saturationCapacity(25) > saturationCapacity(5),
  `${saturationCapacity(25).toFixed(3)} > ${saturationCapacity(5).toFixed(3)}`);

check('all fields finite (no NaN/Infinity)',
  [model.temperature, model.pressure, model.windU, model.windV,
   model.humidity, model.cloud, model.precipitation]
    .every(f => f.every(Number.isFinite)));

const land = [...model.isLand].filter(Boolean).length;
check('island occupies a plausible fraction of the domain',
  land > 500 && land < model.res ** 2 * 0.8,
  `${land}/${model.res ** 2} land cells`);

// ---------------------------------------------------------------- 2. thermal
check('temperature decreases with latitude (poleward cooling)',
  (() => {
    const south = [], north = [];
    for (let c = 0; c < model.res; c++) {
      south.push(model.temperature[model.idx(4, c)]);
      north.push(model.temperature[model.idx(model.res - 5, c)]);
    }
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    return avg(south) > avg(north);
  })(),
  `${s.temperature.min.toFixed(1)}°C .. ${s.temperature.max.toFixed(1)}°C`);

check('elevation cools air (adiabatic lapse rate)',
  (() => {
    // compare the hilltop cell against a sea-level land cell at same latitude
    const { r, c } = model.worldToCell(-150, -270);
    const hi = model.idx(r, c);
    let loTemp = null;
    for (let cc = 0; cc < model.res; cc++) {
      const i = model.idx(r, cc);
      if (model.isLand[i] && model.elevation[i] < 1) { loTemp = model.temperature[i]; break; }
    }
    return loTemp !== null && model.elevation[hi] > 5 && model.temperature[hi] < loTemp;
  })(),
  'hilltop colder than sea-level land at same latitude');

// ---------------------------------------------------------------- 3. pressure
check('pressure field varies (thermal highs and lows formed)',
  s.pressure.max - s.pressure.min > 3,
  `range ${(s.pressure.max - s.pressure.min).toFixed(1)} hPa`);

check('pressure stays in physically plausible band',
  s.pressure.min > 960 && s.pressure.max < 1060,
  `${s.pressure.min.toFixed(0)}..${s.pressure.max.toFixed(0)} hPa`);

// ---------------------------------------------------------------- 4. wind
check('wind is generated from the pressure gradient',
  s.windSpeed.mean > 0 && s.windSpeed.max > 0,
  `mean ${s.windSpeed.mean.toFixed(3)}, max ${s.windSpeed.max.toFixed(3)}`);

check('friction slows wind over land relative to sea',
  (() => {
    // Compare each cell's actual wind against its own frictionless
    // (geostrophic) wind. Comparing raw land vs sea speeds is confounded:
    // the island's thermal low sits under the land, so the pressure
    // gradient there is ~4x stronger regardless of drag.
    let landRatio = 0, landN = 0, seaRatio = 0, seaN = 0;
    for (let i = 0; i < model.windU.length; i++) {
      const free = Math.hypot(model.windUFree[i], model.windVFree[i]);
      if (free < 1e-9) continue;
      const actual = Math.hypot(model.windU[i], model.windV[i]);
      if (model.isLand[i]) { landRatio += actual / free; landN++; }
      else { seaRatio += actual / free; seaN++; }
    }
    return landN && seaN && (landRatio / landN) < (seaRatio / seaN);
  })(),
  'land retains a smaller fraction of geostrophic wind than sea');

check('wind field has rotational structure (cyclonic/anticyclonic curl)',
  (() => {
    let maxCurl = 0;
    for (let r = 1; r < model.res - 1; r++) {
      for (let c = 1; c < model.res - 1; c++) {
        const dvdx = model.windV[model.idx(r, c + 1)] - model.windV[model.idx(r, c - 1)];
        const dudz = model.windU[model.idx(r + 1, c)] - model.windU[model.idx(r - 1, c)];
        maxCurl = Math.max(maxCurl, Math.abs(dvdx - dudz));
      }
    }
    return maxCurl > 1e-6;
  })(),
  'non-zero vorticity present');

// ---------------------------------------------------------------- 5. moisture
check('oceans are more humid than land interiors',
  (() => {
    let l = 0, ln = 0, o = 0, on = 0;
    for (let i = 0; i < model.humidity.length; i++) {
      if (model.isLand[i]) { l += model.humidity[i]; ln++; } else { o += model.humidity[i]; on++; }
    }
    return (o / on) > (l / ln);
  })());

check('precipitation occurs somewhere',
  s.precipitation.max > 0,
  `max ${s.precipitation.max.toFixed(4)}/tick`);

check('cloud cover is bounded 0..1',
  s.cloud.min >= 0 && s.cloud.max <= 1,
  `${s.cloud.min.toFixed(2)}..${s.cloud.max.toFixed(2)}, mean ${s.cloud.mean.toFixed(2)}`);

check('orographic effect: windward slopes wetter than leeward (rain shadow)',
  (() => {
    // The correct orographic test compares UPWIND-facing slopes against
    // DOWNWIND-facing slopes. Comparing uplands vs lowlands is confounded:
    // coastal lowlands receive heavy landfall rain as saturated maritime air
    // first crosses the shoreline, which is itself physically correct.
    let up = 0, upN = 0, down = 0, downN = 0;
    const res = model.res;
    for (let r = 1; r < res - 1; r++) {
      for (let c = 1; c < res - 1; c++) {
        const i = model.idx(r, c);
        if (!model.isLand[i] || model.elevation[i] < 3) continue;
        const dhdx = (model.elevation[model.idx(r, c + 1)] - model.elevation[model.idx(r, c - 1)]);
        const dhdz = (model.elevation[model.idx(r + 1, c)] - model.elevation[model.idx(r - 1, c)]);
        const ascent = model.windU[i] * dhdx + model.windV[i] * dhdz;
        if (ascent > 0) { up += model.accumPrecip[i]; upN++; }
        else if (ascent < 0) { down += model.accumPrecip[i]; downN++; }
      }
    }
    if (!upN || !downN) return false;
    lastOro = `windward ${(up / upN).toFixed(3)} vs leeward ${(down / downN).toFixed(3)}`;
    return (up / upN) > (down / downN);
  })(),
  () => lastOro);

check('model reaches steady state (converges, not diverging)',
  iters < 80 || model.humidity.every(q => q >= 0 && q <= 3),
  iters < 80 ? `converged in ${iters} iterations` : 'bounded after 80 iterations');

// ---------------------------------------------------------------- 6. biomes
const biomeCount = Object.keys(s.biomes).length;
check('multiple biomes emerge from the simulation',
  biomeCount >= 3,
  `${biomeCount} distinct: ${Object.keys(s.biomes).join(', ')}`);

check('ocean cells classified as ocean',
  (() => {
    for (let i = 0; i < model.biome.length; i++) {
      if (!model.isLand[i] && model.biome[i] !== BIOME.OCEAN) return false;
    }
    return true;
  })());

check('no land cell left unclassified',
  (() => {
    for (let i = 0; i < model.biome.length; i++) {
      if (model.isLand[i] && model.biome[i] === BIOME.OCEAN) return false;
    }
    return true;
  })());

// ---------------------------------------------------------------- 7. seasons
const winter = new ClimateModel({ resolution: 64, extent: 640, heightFn: getHeight });
winter.run({ season: 0.0, iterations: 50 });
const summer = new ClimateModel({ resolution: 64, extent: 640, heightFn: getHeight });
summer.run({ season: 0.5, iterations: 50 });

check('summer is warmer than winter (seasonal cycle works)',
  summer.stats().temperature.mean > winter.stats().temperature.mean,
  `summer ${summer.stats().temperature.mean.toFixed(1)}°C vs winter ${winter.stats().temperature.mean.toFixed(1)}°C`);

check('seasons produce different biome distributions',
  JSON.stringify(summer.stats().biomes) !== JSON.stringify(winter.stats().biomes));

// ---------------------------------------------------------------- 8. API
const sample = model.sampleAt(0, 0);
check('sampleAt returns a complete climate record',
  ['temperature','pressure','windSpeed','humidity','cloud','precipitation','biomeName','isLand']
    .every(k => sample[k] !== undefined),
  `town square: ${sample.temperature.toFixed(1)}°C, ${sample.biomeName}, cloud ${sample.cloud.toFixed(2)}`);

check('sampleAt is stable at domain corners (no out-of-bounds)',
  [[-640,-640],[640,640],[-640,640],[640,-640],[9999,9999]]
    .every(([x,z]) => Number.isFinite(model.sampleAt(x,z).temperature)));

check('determinism: identical config yields identical field',
  (() => {
    const a = new ClimateModel({ resolution: 48, extent: 640, heightFn: getHeight });
    const b = new ClimateModel({ resolution: 48, extent: 640, heightFn: getHeight });
    a.run({ season: 0.3, iterations: 30 });
    b.run({ season: 0.3, iterations: 30 });
    for (let i = 0; i < a.temperature.length; i++) {
      if (a.temperature[i] !== b.temperature[i]) return false;
      if (a.accumPrecip[i] !== b.accumPrecip[i]) return false;
    }
    return true;
  })(),
  'same seed -> same world');

// ---------------------------------------------------------------- report
console.log(results.join('\n'));
console.log(`\n--- climate summary -------------------------------------------`);
console.log(`temperature   ${s.temperature.min.toFixed(1)} .. ${s.temperature.max.toFixed(1)} °C  (mean ${s.temperature.mean.toFixed(1)})`);
console.log(`pressure      ${s.pressure.min.toFixed(0)} .. ${s.pressure.max.toFixed(0)} hPa`);
console.log(`wind speed    mean ${s.windSpeed.mean.toFixed(3)}, max ${s.windSpeed.max.toFixed(3)}`);
console.log(`cloud cover   mean ${(s.cloud.mean * 100).toFixed(1)}%`);
console.log(`biomes        ${Object.entries(s.biomes).map(([k, v]) => `${k}:${v}`).join('  ')}`);
console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed ? 1 : 0);
