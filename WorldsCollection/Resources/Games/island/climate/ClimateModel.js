/**
 * ClimateModel.js — physically-motivated climate simulation for Island.
 *
 * Implements the causal chain used by real climate models, in order:
 *
 *   insolation -> temperature -> MSLP (pressure) -> wind (+Coriolis, +friction)
 *     -> moisture advection -> orographic lift -> condensation
 *     -> cloud + precipitation -> biome
 *
 * Deliberately dependency-free (no Three.js) so it can run in a Web Worker,
 * in Node for tests, or headless. Rendering layers read the fields it exposes.
 *
 * Inspired by the approach Christoph Wallura demonstrated for procedural
 * worlds: derive biomes from simulated atmosphere rather than sampling noise.
 * This is an independent implementation from published climatology — no code
 * from that project is used here.
 */

// --- physical constants (tuned for game-scale plausibility, not SI accuracy)
export const CLIMATE_CONSTANTS = {
  LAPSE_RATE: 6.5,          // °C cooled per ELEV_SCALE units of elevation
  ELEV_SCALE: 25,           // island hills are ~30 units tall, so the lapse
                            // rate must be scaled to the world, not to metres
  SEA_LEVEL_PRESSURE: 1013, // hPa baseline
  PRESSURE_PER_DEGREE: 1.2, // hPa change per °C of thermal anomaly
  LAND_SEA_PRESSURE: 0.35,  // hPa land/sea offset — kept small; a large step
                            // creates an artificial coastal gradient cliff
  GRADIENT_SCALE: 110,      // pressure-gradient force -> wind velocity
  CORIOLIS_BASE: 0.35,      // deflection strength scaled by sin(latitude)
  FRICTION_LAND: 0.42,      // wind drag over land (rough surface)
  FRICTION_SEA: 0.12,       // wind drag over water (smooth surface)
  EVAPORATION_RATE: 0.014,  // humidity gained per tick over water
  TRANSPIRATION_RATE: 0.003,// humidity gained per tick over vegetated land
  OROGRAPHIC_FACTOR: 5.0,   // condensation per unit of forced ascent
  PRECIP_EFFICIENCY: 0.62,  // fraction of condensate that reaches the ground
  RAIN_SHADOW_DECAY: 0.88,  // humidity retained after precipitating
  SATURATION_SCALE: 0.75,   // moisture capacity at the 15°C reference
  CONVERGENCE_FACTOR: 0.01, // frontal/convective rain from wind convergence
  ADVECTION_SPEED: 20,      // how far moisture travels per tick, in wind-units.
                            // Must be large enough that air crosses several
                            // grid cells per tick, otherwise maritime moisture
                            // never reaches the interior and every inland cell
                            // dries out into desert.
  CLOUD_RH_THRESHOLD: 0.62, // RH at which cloud starts forming
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Saturation vapour pressure proxy (Magnus-Tetens shape), scaled into the
 * same units as our specific-humidity field so the two are comparable.
 *
 * SATURATION_SCALE sets how much moisture air can hold at the reference
 * temperature. It must sit inside the range the moisture field actually
 * reaches, otherwise capacity always exceeds humidity, nothing ever
 * condenses, and every land cell classifies as desert.
 */
export function saturationCapacity(tempC) {
  const magnus = Math.exp((17.27 * tempC) / (tempC + 237.3));
  const ref = Math.exp((17.27 * 15) / (15 + 237.3)); // reference at 15°C
  return CLIMATE_CONSTANTS.SATURATION_SCALE * (magnus / ref);
}

export class ClimateModel {
  /**
   * @param {object} opts
   * @param {number} opts.resolution  grid cells per side
   * @param {number} opts.extent      world half-width covered (world units)
   * @param {(x:number,z:number)=>number} opts.heightFn  terrain sampler
   * @param {number} opts.seaLevel    height at/below which a cell is ocean
   * @param {number} opts.latitudeMin virtual latitude at -extent (degrees)
   * @param {number} opts.latitudeMax virtual latitude at +extent (degrees)
   */
  constructor({
    resolution = 96,
    extent = 640,
    heightFn,
    seaLevel = 0.15,
    latitudeMin = 48,
    latitudeMax = 56,
  } = {}) {
    if (typeof heightFn !== 'function') {
      throw new Error('ClimateModel requires a heightFn(x, z) sampler');
    }
    this.res = resolution;
    this.extent = extent;
    this.heightFn = heightFn;
    this.seaLevel = seaLevel;
    this.latitudeMin = latitudeMin;
    this.latitudeMax = latitudeMax;
    this.cellSize = (extent * 2) / resolution;

    const n = resolution * resolution;
    this.elevation = new Float32Array(n);
    this.isLand = new Uint8Array(n);
    this.latitude = new Float32Array(n);
    this.temperature = new Float32Array(n);
    this.seaLevelTemp = new Float32Array(n);
    this.pressure = new Float32Array(n);
    this.windU = new Float32Array(n);   // +x component
    this.windV = new Float32Array(n);   // +z component
    this.windUFree = new Float32Array(n); // geostrophic (pre-friction)
    this.windVFree = new Float32Array(n);
    this.humidity = new Float32Array(n);// specific humidity proxy 0..1+
    this.cloud = new Float32Array(n);
    this.precipitation = new Float32Array(n);
    this.accumPrecip = new Float32Array(n);
    this.biome = new Uint8Array(n);

    this._ticks = 0;
    this._buildTerrainFields();
  }

  idx(r, c) { return r * this.res + c; }

  /** Grid cell -> world coordinates (cell centre). */
  cellToWorld(r, c) {
    return {
      x: -this.extent + (c + 0.5) * this.cellSize,
      z: -this.extent + (r + 0.5) * this.cellSize,
    };
  }

  /** World coordinates -> nearest grid cell (clamped). */
  worldToCell(x, z) {
    const c = clamp(Math.floor((x + this.extent) / this.cellSize), 0, this.res - 1);
    const r = clamp(Math.floor((z + this.extent) / this.cellSize), 0, this.res - 1);
    return { r, c };
  }

  _buildTerrainFields() {
    for (let r = 0; r < this.res; r++) {
      for (let c = 0; c < this.res; c++) {
        const i = this.idx(r, c);
        const { x, z } = this.cellToWorld(r, c);
        const h = this.heightFn(x, z);
        this.elevation[i] = h;
        this.isLand[i] = h > this.seaLevel ? 1 : 0;
        this.latitude[i] = lerp(this.latitudeMin, this.latitudeMax, r / (this.res - 1));
        // seed the atmosphere as damp over water, dry over land
        this.humidity[i] = this.isLand[i] ? 0.25 : 0.55;
      }
    }
  }

  // ---------------------------------------------------------------- step 1
  /**
   * Insolation and surface temperature.
   * Latitude sets the baseline, elevation cools via the lapse rate, and
   * water bodies damp the seasonal swing (high thermal inertia).
   */
  computeTemperature(season = 0) {
    const { LAPSE_RATE, ELEV_SCALE } = CLIMATE_CONSTANTS;
    // season: 0 = midwinter, 0.5 = midsummer (wraps)
    const seasonalTilt = -Math.cos(season * Math.PI * 2); // -1..1
    for (let i = 0; i < this.temperature.length; i++) {
      const latRad = (this.latitude[i] * Math.PI) / 180;
      // insolation falls off with latitude
      const insolation = Math.cos(latRad) ** 1.15;
      let t = -6 + insolation * 26;
      // seasonal swing grows with latitude, damped over ocean
      const swing = 4 + (this.latitude[i] / 90) * 12;
      t += seasonalTilt * swing * (this.isLand[i] ? 1.0 : 0.45);
      // sea-level temperature is retained separately: MSLP is by definition
      // reduced to sea level, so terrain height must not bias the pressure
      // field (doing so invents a spurious orographic low over every hill).
      this.seaLevelTemp[i] = t;
      // surface temperature additionally cools adiabatically with height
      this.temperature[i] = t - (this.elevation[i] / ELEV_SCALE) * LAPSE_RATE;
    }
    return this;
  }

  // ---------------------------------------------------------------- step 2
  /**
   * Mean sea level pressure. Warm surfaces produce thermal lows, cold
   * surfaces thermal highs; a background subtropical ridge / subpolar
   * trough is superimposed to give realistic prevailing flow.
   */
  computeMSLP() {
    const { SEA_LEVEL_PRESSURE, PRESSURE_PER_DEGREE, LAND_SEA_PRESSURE } = CLIMATE_CONSTANTS;
    let mean = 0;
    for (let i = 0; i < this.seaLevelTemp.length; i++) mean += this.seaLevelTemp[i];
    mean /= this.seaLevelTemp.length;

    for (let i = 0; i < this.pressure.length; i++) {
      // thermal component uses the SEA-LEVEL temperature, not the surface
      // temperature — this is what "mean sea level pressure" means.
      const anomaly = this.seaLevelTemp[i] - mean;
      let p = SEA_LEVEL_PRESSURE - anomaly * PRESSURE_PER_DEGREE;
      // background planetary cells: subtropical high ~30°, subpolar low ~60°
      const lat = this.latitude[i];
      p += 7.5 * Math.cos(((lat - 30) / 30) * Math.PI);
      // gentle land/sea contrast — large steps would create a false coastal jet
      p += this.isLand[i] ? -LAND_SEA_PRESSURE : LAND_SEA_PRESSURE;
      this.pressure[i] = p;
    }
    // smooth hard enough to remove the 1-cell coastline discontinuity, so the
    // gradient reflects synoptic-scale systems rather than the land mask
    this._smooth(this.pressure, 4);
    return this;
  }

  // ---------------------------------------------------------------- step 3
  /**
   * Wind from the pressure gradient force, deflected by Coriolis and
   * slowed by surface friction. This is what produces trade-wind style
   * prevailing flow plus cyclonic/anticyclonic rotation around pressure
   * centres, rather than wind being painted on by hand.
   */
  computeWind() {
    const { CORIOLIS_BASE, FRICTION_LAND, FRICTION_SEA, GRADIENT_SCALE } = CLIMATE_CONSTANTS;
    const res = this.res;

    // Build a smoothed drag field. A hard land/sea friction step creates a
    // one-cell convergence spike at the coastline that dumps the entire
    // moisture load on the shore; real surface roughness transitions over a
    // finite distance, so blur the field before applying it.
    if (!this._drag || this._drag.length !== this.isLand.length) {
      this._drag = new Float32Array(this.isLand.length);
    }
    for (let i = 0; i < this.isLand.length; i++) {
      this._drag[i] = this.isLand[i] ? FRICTION_LAND : FRICTION_SEA;
    }
    this._smooth(this._drag, 2);

    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        const i = this.idx(r, c);
        // central-difference pressure gradient
        const cW = Math.max(0, c - 1), cE = Math.min(res - 1, c + 1);
        const rN = Math.max(0, r - 1), rS = Math.min(res - 1, r + 1);
        const dPdx = (this.pressure[this.idx(r, cE)] - this.pressure[this.idx(r, cW)]) /
                     ((cE - cW) * this.cellSize);
        const dPdz = (this.pressure[this.idx(rS, c)] - this.pressure[this.idx(rN, c)]) /
                     ((rS - rN) * this.cellSize);

        // pressure gradient force points from high to low
        const u = -dPdx * GRADIENT_SCALE;
        const v = -dPdz * GRADIENT_SCALE;

        // Coriolis: deflect right in the northern hemisphere, scaled by sin(lat)
        const f = CORIOLIS_BASE * Math.sin((this.latitude[i] * Math.PI) / 180);
        const uc = u * Math.cos(f) - v * Math.sin(f);
        const vc = u * Math.sin(f) + v * Math.cos(f);

        // record the frictionless (geostrophic) wind so the effect of surface
        // drag can be measured independently of where the pressure systems sit
        this.windUFree[i] = uc;
        this.windVFree[i] = vc;

        const drag = 1 - this._drag[i];
        this.windU[i] = uc * drag;
        this.windV[i] = vc * drag;
      }
    }
    this._smooth(this.windU, 1);
    this._smooth(this.windV, 1);
    return this;
  }

  // ---------------------------------------------------------------- step 4
  /**
   * Moisture: evaporate from water, advect downwind (semi-Lagrangian),
   * force ascent over terrain, condense the excess, and rain it out.
   * Rain shadows fall out of this for free — air that has precipitated
   * on a windward slope arrives dry on the lee side.
   */
  stepMoisture(dt = 1) {
    const K = CLIMATE_CONSTANTS;
    const res = this.res;
    const next = new Float32Array(this.humidity.length);

    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        const i = this.idx(r, c);

        // --- semi-Lagrangian back-trace: where did this air come from?
        // wind is already in world units/tick, so it must NOT be scaled by
        // cellSize again — doing so overshoots the domain and destroys the
        // upwind moisture gradient that produces rain shadows.
        const { x, z } = this.cellToWorld(r, c);
        const adv = K.ADVECTION_SPEED * dt;
        const srcX = x - this.windU[i] * adv;
        const srcZ = z - this.windV[i] * adv;
        let q = this._sampleBilinear(this.humidity, srcX, srcZ);

        // --- surface flux
        if (!this.isLand[i]) {
          // evaporation scales with temperature (warm seas are wetter)
          const warmth = clamp((this.temperature[i] + 5) / 35, 0, 1.4);
          q += K.EVAPORATION_RATE * warmth * dt;
        } else {
          q += K.TRANSPIRATION_RATE * dt;
        }

        // --- orographic forcing: wind blowing uphill lifts air.
        // Normalised by cellSize so the term is a dimensionless measure of
        // forced ascent rather than a raw slope*wind product, which would
        // vanish at coarse grid resolutions.
        const cW = Math.max(0, c - 1), cE = Math.min(res - 1, c + 1);
        const rN = Math.max(0, r - 1), rS = Math.min(res - 1, r + 1);
        const dhdx = (this.elevation[this.idx(r, cE)] - this.elevation[this.idx(r, cW)]) /
                     ((cE - cW) * this.cellSize);
        const dhdz = (this.elevation[this.idx(rS, c)] - this.elevation[this.idx(rN, c)]) /
                     ((rS - rN) * this.cellSize);
        const ascent = Math.max(0, this.windU[i] * dhdx + this.windV[i] * dhdz);

        // --- condensation: capacity falls as air is lifted and cools.
        // Elevation itself also lowers capacity (the air is simply colder up
        // there, already reflected in this.temperature), and the ascent term
        // adds the dynamic lifting component.
        const lift = clamp(ascent * K.OROGRAPHIC_FACTOR, 0, 0.9);
        const capacity = saturationCapacity(this.temperature[i]) * (1 - lift);
        let precip = 0;
        if (q > capacity) {
          const excess = q - capacity;
          precip = excess * K.PRECIP_EFFICIENCY;
          q = capacity + (excess - precip) * K.RAIN_SHADOW_DECAY;
        }

        // convergence-driven lift adds frontal/convective rain. Kept modest:
        // convergence peaks at the coastline, and a large coefficient here
        // rains the entire moisture load out on the shore before it can be
        // carried inland and lifted over the hills.
        const conv = -this._divergenceAt(r, c);
        if (conv > 0) precip += conv * q * K.CONVERGENCE_FACTOR;

        this.precipitation[i] = precip;
        this.accumPrecip[i] += precip;
        next[i] = clamp(q, 0, 3);

        // --- cloud from relative humidity
        const rh = capacity > 1e-6 ? q / capacity : 0;
        this.cloud[i] = clamp((rh - K.CLOUD_RH_THRESHOLD) / (1 - K.CLOUD_RH_THRESHOLD), 0, 1);
      }
    }
    this.humidity.set(next);
    this._ticks++;
    return this;
  }

  _divergenceAt(r, c) {
    const res = this.res;
    const cW = Math.max(0, c - 1), cE = Math.min(res - 1, c + 1);
    const rN = Math.max(0, r - 1), rS = Math.min(res - 1, r + 1);
    const dudx = (this.windU[this.idx(r, cE)] - this.windU[this.idx(r, cW)]) / ((cE - cW) * this.cellSize);
    const dvdz = (this.windV[this.idx(rS, c)] - this.windV[this.idx(rN, c)]) / ((rS - rN) * this.cellSize);
    return dudx + dvdz;
  }

  _sampleBilinear(field, x, z) {
    const fx = clamp((x + this.extent) / this.cellSize - 0.5, 0, this.res - 1.001);
    const fz = clamp((z + this.extent) / this.cellSize - 0.5, 0, this.res - 1.001);
    const c0 = Math.floor(fx), r0 = Math.floor(fz);
    const c1 = Math.min(c0 + 1, this.res - 1), r1 = Math.min(r0 + 1, this.res - 1);
    const tx = fx - c0, tz = fz - r0;
    const a = lerp(field[this.idx(r0, c0)], field[this.idx(r0, c1)], tx);
    const b = lerp(field[this.idx(r1, c0)], field[this.idx(r1, c1)], tx);
    return lerp(a, b, tz);
  }

  _smooth(field, passes = 1) {
    const res = this.res;
    for (let p = 0; p < passes; p++) {
      const copy = Float32Array.from(field);
      for (let r = 0; r < res; r++) {
        for (let c = 0; c < res; c++) {
          let sum = 0, n = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const rr = r + dr, cc = c + dc;
              if (rr < 0 || cc < 0 || rr >= res || cc >= res) continue;
              sum += copy[this.idx(rr, cc)]; n++;
            }
          }
          field[this.idx(r, c)] = sum / n;
        }
      }
    }
  }

  // ---------------------------------------------------------------- step 5
  /**
   * Spin the model up until the moisture field stops changing much.
   * Returns the number of iterations actually used.
   */
  run({ season = 0.5, iterations = 60, tolerance = 1e-4 } = {}) {
    this.computeTemperature(season).computeMSLP().computeWind();
    this.accumPrecip.fill(0);
    let prev = Float32Array.from(this.humidity);
    let used = iterations;
    for (let n = 0; n < iterations; n++) {
      this.stepMoisture(1);
      if (n % 5 === 4) {
        let delta = 0;
        for (let i = 0; i < this.humidity.length; i++) delta += Math.abs(this.humidity[i] - prev[i]);
        delta /= this.humidity.length;
        if (delta < tolerance) { used = n + 1; break; }
        prev = Float32Array.from(this.humidity);
      }
    }
    this.classifyBiomes();
    return used;
  }

  // ---------------------------------------------------------------- step 6
  /**
   * Whittaker-style biome classification from simulated temperature and
   * accumulated precipitation. Because precipitation is simulated rather
   * than sampled from noise, rain shadows, coastal wetness and poleward
   * conifer belts appear without being authored.
   */
  classifyBiomes() {
    for (let i = 0; i < this.biome.length; i++) {
      if (!this.isLand[i]) { this.biome[i] = BIOME.OCEAN; continue; }
      const t = this.temperature[i];
      const p = this.accumPrecip[i] / Math.max(1, this._ticks) * 100; // normalised
      if (t < 0)       this.biome[i] = BIOME.ICE;
      else if (t < 5)  this.biome[i] = p > 12 ? BIOME.TAIGA : BIOME.TUNDRA;
      else if (t < 12) this.biome[i] = p > 28 ? BIOME.TEMPERATE_RAINFOREST
                                     : p > 12 ? BIOME.CONIFER_FOREST : BIOME.MOOR;
      else if (t < 20) this.biome[i] = p > 30 ? BIOME.TEMPERATE_RAINFOREST
                                     : p > 14 ? BIOME.DECIDUOUS_FOREST
                                     : p > 6  ? BIOME.GRASSLAND : BIOME.SCRUB;
      else             this.biome[i] = p > 34 ? BIOME.TROPICAL_FOREST
                                     : p > 12 ? BIOME.SAVANNA
                                     : p > 4  ? BIOME.SCRUB : BIOME.DESERT;
    }
    return this;
  }

  // ---------------------------------------------------------------- queries
  /** Full climate state at a world position — used by gameplay systems. */
  sampleAt(x, z) {
    const { r, c } = this.worldToCell(x, z);
    const i = this.idx(r, c);
    return {
      temperature: this.temperature[i],
      pressure: this.pressure[i],
      windU: this.windU[i],
      windV: this.windV[i],
      windSpeed: Math.hypot(this.windU[i], this.windV[i]),
      windDirection: Math.atan2(this.windV[i], this.windU[i]),
      humidity: this.humidity[i],
      cloud: this.cloud[i],
      precipitation: this.precipitation[i],
      biome: this.biome[i],
      biomeName: BIOME_NAMES[this.biome[i]],
      isLand: !!this.isLand[i],
      elevation: this.elevation[i],
    };
  }

  /** Aggregate stats — handy for tests and the debug overlay. */
  stats() {
    const agg = (f) => {
      let min = Infinity, max = -Infinity, sum = 0;
      for (let i = 0; i < f.length; i++) { if (f[i] < min) min = f[i]; if (f[i] > max) max = f[i]; sum += f[i]; }
      return { min, max, mean: sum / f.length };
    };
    const counts = {};
    for (let i = 0; i < this.biome.length; i++) {
      const nm = BIOME_NAMES[this.biome[i]];
      counts[nm] = (counts[nm] || 0) + 1;
    }
    return {
      ticks: this._ticks,
      temperature: agg(this.temperature),
      pressure: agg(this.pressure),
      humidity: agg(this.humidity),
      cloud: agg(this.cloud),
      precipitation: agg(this.precipitation),
      windSpeed: agg(Float32Array.from(this.windU, (u, i) => Math.hypot(u, this.windV[i]))),
      biomes: counts,
    };
  }
}

export const BIOME = {
  OCEAN: 0, ICE: 1, TUNDRA: 2, TAIGA: 3, CONIFER_FOREST: 4, MOOR: 5,
  DECIDUOUS_FOREST: 6, TEMPERATE_RAINFOREST: 7, GRASSLAND: 8, SCRUB: 9,
  SAVANNA: 10, TROPICAL_FOREST: 11, DESERT: 12,
};

export const BIOME_NAMES = Object.keys(BIOME);

export const BIOME_COLORS = {
  [BIOME.OCEAN]: 0x2c5f8a, [BIOME.ICE]: 0xe8f4f8, [BIOME.TUNDRA]: 0x9aa88c,
  [BIOME.TAIGA]: 0x4a6b52, [BIOME.CONIFER_FOREST]: 0x2f5d3f, [BIOME.MOOR]: 0x7d7a5a,
  [BIOME.DECIDUOUS_FOREST]: 0x4f8a3d, [BIOME.TEMPERATE_RAINFOREST]: 0x2d6b3a,
  [BIOME.GRASSLAND]: 0x8fae5a, [BIOME.SCRUB]: 0xa8a065, [BIOME.SAVANNA]: 0xc0b06a,
  [BIOME.TROPICAL_FOREST]: 0x2f7d4f, [BIOME.DESERT]: 0xd9c9a3,
};
