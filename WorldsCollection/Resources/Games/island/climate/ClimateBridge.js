/**
 * ClimateBridge.js — connects the physical ClimateModel to Island's gameplay.
 *
 * The model itself knows nothing about Three.js or the game. This module owns
 * that translation: it builds the model from Island's real terrain, advances
 * it with the game clock, and exposes the queries gameplay systems care about
 * ("is it raining on me?", "what's the wind doing?", "what grows here?").
 *
 * Existing systems keep working unchanged — events.js still owns scripted
 * storms; this layer adds the simulated baseline underneath.
 */
import { ClimateModel, BIOME, BIOME_NAMES, BIOME_COLORS } from './ClimateModel.js';
import { getHeight, ISLAND_BOUNDS } from '../scene.js';

let model = null;
let simSeason = 0.45;          // 0 = midwinter, 0.5 = midsummer
let accum = 0;
let lastResolveDay = -1;

// Advance the climate this often (sim-seconds). The atmosphere is quasi-steady
// relative to a 2.4-minute game day, so re-solving every frame is wasted work.
const RESOLVE_INTERVAL = 8;

export function initClimate({ resolution = 96 } = {}) {
  const extent = Math.max(
    Math.abs(ISLAND_BOUNDS.minX), Math.abs(ISLAND_BOUNDS.maxX),
    Math.abs(ISLAND_BOUNDS.minZ), Math.abs(ISLAND_BOUNDS.maxZ),
  ) * 1.35;

  model = new ClimateModel({
    resolution,
    extent,
    heightFn: getHeight,
    seaLevel: 0.15,
    latitudeMin: 48,
    latitudeMax: 56,
  });
  model.run({ season: simSeason, iterations: 80 });
  return model;
}

/** Advance the climate. `day` drives the seasonal cycle. */
export function updateClimate(delta, day = 0) {
  if (!model) return;
  accum += delta;
  if (accum < RESOLVE_INTERVAL) return;
  accum = 0;

  // one in-game year = 112 days (4 seasons x 28)
  const season = ((day % 112) / 112 + 0.25) % 1;
  const seasonMoved = Math.abs(season - simSeason) > 0.004;
  simSeason = season;

  if (seasonMoved || day !== lastResolveDay) {
    lastResolveDay = day;
    model.computeTemperature(simSeason).computeMSLP().computeWind();
  }
  model.stepMoisture(1);
  model.classifyBiomes();
}

export function getClimate() { return model; }

/** Full climate record at a world position. */
export function climateAt(x, z) {
  return model ? model.sampleAt(x, z) : null;
}

/** Is simulated rain falling here? Threshold tuned to feel like real weather. */
export function isRainingAt(x, z) {
  if (!model) return false;
  return model.sampleAt(x, z).precipitation > 0.02;
}

/** Cloud cover 0..1 — drives sky tint, fog density and light intensity. */
export function cloudCoverAt(x, z) {
  return model ? model.sampleAt(x, z).cloud : 0;
}

/** Wind vector — drives grass sway, sails, smoke, flags, wave direction. */
export function windAt(x, z) {
  if (!model) return { x: 0, z: 0, speed: 0, direction: 0 };
  const s = model.sampleAt(x, z);
  return { x: s.windU, z: s.windV, speed: s.windSpeed, direction: s.windDirection };
}

/** Temperature in °C, for clothing, crop growth and NPC dialogue. */
export function temperatureAt(x, z) {
  return model ? model.sampleAt(x, z).temperature : 15;
}

export function biomeAt(x, z) {
  return model ? model.sampleAt(x, z).biome : BIOME.GRASSLAND;
}

export function biomeNameAt(x, z) {
  return model ? model.sampleAt(x, z).biomeName : 'GRASSLAND';
}

/**
 * Crop growth multiplier for the farming/garden systems. Crops like mild
 * temperatures and steady moisture; this makes the garden plot's yield a
 * consequence of the simulated climate rather than a fixed number.
 */
export function growthMultiplierAt(x, z) {
  if (!model) return 1;
  const s = model.sampleAt(x, z);
  const tempFactor = Math.exp(-((s.temperature - 18) ** 2) / 200);
  const waterFactor = Math.min(1, 0.35 + s.precipitation * 12);
  return Math.max(0.1, tempFactor * waterFactor);
}

/**
 * Fishing quality — fish bite less in heavy rain and rough wind. Feeds
 * minigame_fishing.js so the weather has a gameplay consequence.
 */
export function fishingModifierAt(x, z) {
  if (!model) return 1;
  const s = model.sampleAt(x, z);
  const windPenalty = Math.max(0.4, 1 - s.windSpeed * 0.05);
  const rainBonus = s.precipitation > 0.01 && s.precipitation < 0.08 ? 1.15 : 1.0;
  return windPenalty * rainBonus;
}

/** Human-readable weather summary for the HUD and NPC small talk. */
export function describeWeatherAt(x, z) {
  if (!model) return 'clear';
  const s = model.sampleAt(x, z);
  if (s.precipitation > 0.12) return 'heavy rain';
  if (s.precipitation > 0.04) return 'rain';
  if (s.precipitation > 0.01) return 'drizzle';
  if (s.cloud > 0.75) return 'overcast';
  if (s.cloud > 0.45) return 'cloudy';
  if (s.cloud > 0.2) return 'partly cloudy';
  return 'clear';
}

export { BIOME, BIOME_NAMES, BIOME_COLORS };
