/**
 * seasons.js — CAD-450 — Seasonal Calendar
 *
 * Divides the in-game year into 4 seasons, each ~30 game-days.
 * A central getSeason(gameDay) function is the single source of truth.
 * All other systems (sky, crops, wildlife, NPC dialogue) query it.
 *
 * Seasons
 * ───────
 *  spring (days  0–29): flowers bloom, bees appear, mild warm sky
 *  summer (days 30–59): hot sky, longer days (sun rises earlier / sets later)
 *  autumn (days 60–89): orange terrain tint, harvest market
 *  winter (days 90–119): cool pale light, thicker fog, Mabel makes spiced bread
 *
 * Year wraps at 120 days.
 *
 * Sky palette adjustments are returned as multiplier/tint objects that
 * index.html applies to the existing day/night lighting system.
 *
 * Usage (in the main game loop):
 *
 *   import { getSeason, getSeasonalSkyTint, getSeasonalFogDensity,
 *            getSeasonalCrops, getSeasonalDialogue,
 *            getSeasonalWildlife, SEASON_LABELS } from './seasons.js';
 *
 *   const season = getSeason(gameDay);
 *   const tint   = getSeasonalSkyTint(season);
 *   updateSeasonalFog(season);
 */

export const SEASON_LENGTH = 30; // game-days per season
export const YEAR_LENGTH   = 120; // game-days per year

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_LABELS = {
  spring: { name: 'Spring', emoji: '🌸' },
  summer: { name: 'Summer', emoji: '☀️' },
  autumn: { name: 'Autumn', emoji: '🍂' },
  winter: { name: 'Winter', emoji: '❄️' },
};

// ---------------------------------------------------------------------------
// Core accessor
// ---------------------------------------------------------------------------

/** Returns the current season string given the elapsed game-day count. */
export function getSeason(gameDay) {
  const dayInYear = Math.floor(gameDay) % YEAR_LENGTH;
  return SEASONS[Math.floor(dayInYear / SEASON_LENGTH)];
}

/** Returns which day within the current season (0-29). */
export function getDayInSeason(gameDay) {
  return Math.floor(gameDay) % SEASON_LENGTH;
}

/** Returns the year number (starts at 1). */
export function getYear(gameDay) {
  return Math.floor(Math.floor(gameDay) / YEAR_LENGTH) + 1;
}

// ---------------------------------------------------------------------------
// Sky / atmosphere tweaks
// Each value is a multiplier or hex offset applied on top of the base cycle.
// ---------------------------------------------------------------------------

/**
 * Returns an object describing how to bias the day/night sky colours this season.
 *
 * skyWarm    — add to red channel of sky midday colour (0-255)
 * skyCool    — add to blue channel of sky midday colour
 * fogDensity — multiplier for scene.fog.density (default 1.0)
 * fogTint    — hex colour blended 20% into fog colour
 * sunriseShift — hours to shift sunrise earlier (positive) or later (negative)
 * sunsetShift  — hours to shift sunset earlier (negative) or later (positive)
 */
export function getSeasonalAtmosphere(season) {
  switch (season) {
    case 'spring':
      return {
        skyWarm:      8,
        skyCool:      10,
        fogDensity:   0.90,
        fogTint:      0xc8e8c0,   // faint green-blue
        sunriseShift: 0.5,
        sunsetShift:  0.5,
        terrainTint:  null,
        label:        'Mild spring air',
      };
    case 'summer':
      return {
        skyWarm:      22,
        skyCool:      -8,
        fogDensity:   0.70,
        fogTint:      0xffe8c0,   // warm golden haze
        sunriseShift: 1.0,
        sunsetShift:  1.5,
        terrainTint:  null,
        label:        'Bright summer sky',
      };
    case 'autumn':
      return {
        skyWarm:      18,
        skyCool:      -12,
        fogDensity:   1.10,
        fogTint:      0xe8c090,   // amber haze
        sunriseShift: -0.5,
        sunsetShift:  -0.5,
        terrainTint:  0xd4804000, // orange overlay on terrain — apply at ~15% opacity
        label:        'Golden autumn light',
      };
    case 'winter':
      return {
        skyWarm:      -15,
        skyCool:      20,
        fogDensity:   1.55,
        fogTint:      0xc0d4e8,   // pale blue-grey
        sunriseShift: -1.5,
        sunsetShift:  -1.5,
        terrainTint:  null,
        label:        'Cold winter haze',
      };
    default:
      return { skyWarm: 0, skyCool: 0, fogDensity: 1.0, fogTint: null, sunriseShift: 0, sunsetShift: 0, terrainTint: null, label: '' };
  }
}

// ---------------------------------------------------------------------------
// Available crops / forage by season
// ---------------------------------------------------------------------------

export const SEASONAL_CROPS = {
  spring: ['carrot', 'lettuce', 'pea', 'radish'],
  summer: ['tomato', 'cucumber', 'berry', 'sunflower'],
  autumn: ['potato', 'pumpkin', 'apple', 'mushroom'],
  winter: ['kale', 'leek', 'parsnip', 'truffle'],
};

export function getSeasonalCrops(season) {
  return SEASONAL_CROPS[season] || [];
}

// ---------------------------------------------------------------------------
// Wildlife sightings by season
// ---------------------------------------------------------------------------

export const SEASONAL_WILDLIFE = {
  spring: ['robin', 'bee', 'butterfly', 'hedgehog'],
  summer: ['seabird', 'dragonfly', 'rabbit', 'heron'],
  autumn: ['fox', 'owl', 'migrating geese', 'squirrel'],
  winter: ['wren', 'seal', 'snipe', 'grey heron'],
};

export function getSeasonalWildlife(season) {
  return SEASONAL_WILDLIFE[season] || [];
}

// ---------------------------------------------------------------------------
// NPC outfit / dialogue cues by season
// ---------------------------------------------------------------------------

export const SEASONAL_NPC_CUES = {
  spring: {
    outfitHint: 'light layers',
    dialogueLines: [
      "The blossom is out early this year — Jin says it\'s a good sign.",
      "I planted the first carrots this morning. Fingers crossed!",
      "The bees are back! Eddy\'s ecstatic.",
      "Spring always makes the island smell like honey and grass.",
    ],
  },
  summer: {
    outfitHint: 'short sleeves',
    dialogueLines: [
      "Too hot to be indoors. I\'m practically living on the beach.",
      "Nico has run out of iced coffee three times this week.",
      "The days are so long — I barely know when to stop working.",
      "Suki says the fishing is exceptional right now.",
    ],
  },
  autumn: {
    outfitHint: 'warm jacket',
    dialogueLines: [
      "The harvest market is nearly here. I\'ve been practising my jam all month.",
      "The leaves turned overnight. The forest looks like it\'s on fire.",
      "Eddy brought an absolute mountain of potatoes to the square today.",
      "There\'s a chill in the air now. Time for Mabel\'s spiced bread.",
    ],
  },
  winter: {
    outfitHint: 'heavy coat and scarf',
    dialogueLines: [
      "I can barely see the dock in this fog. Lena\'s been working overtime.",
      "Mabel\'s spiced bread is the only thing getting me through the cold.",
      "The days are short now. I light the lamp by four o\'clock.",
      "Winter on the island is quiet, but I rather like it.",
    ],
  },
};

export function getSeasonalDialogue(season) {
  const cues = SEASONAL_NPC_CUES[season];
  if (!cues) return null;
  const idx = Math.floor(Math.random() * cues.dialogueLines.length);
  return cues.dialogueLines[idx];
}

// ---------------------------------------------------------------------------
// Special seasonal events
// ---------------------------------------------------------------------------

/**
 * Returns a list of active events for this season+day combination.
 * Each event: { id, label, description }
 */
export function getSeasonalEvents(season, dayInSeason) {
  const events = [];

  if (season === 'spring' && dayInSeason >= 0 && dayInSeason < 5) {
    events.push({ id: 'bee_emergence', label: 'Bees Emerge', description: 'The hive at the farm is buzzing with fresh activity.' });
  }
  if (season === 'spring' && dayInSeason >= 10) {
    events.push({ id: 'flower_bloom', label: 'Wildflowers Bloom', description: 'The south path is carpeted in yellow and white.' });
  }
  if (season === 'summer' && dayInSeason >= 15 && dayInSeason < 20) {
    events.push({ id: 'solstice_bonfire', label: 'Solstice Bonfire', description: 'The islanders gather at the beach for the midsummer fire.' });
  }
  if (season === 'autumn' && dayInSeason >= 20) {
    events.push({ id: 'harvest_market', label: 'Harvest Market', description: 'Stalls fill the town square. Produce, pies, and prizes.' });
  }
  if (season === 'winter' && dayInSeason >= 5) {
    events.push({ id: 'mabel_bread', label: "Mabel's Spiced Bread", description: "Mabel is baking her famous winter loaf. The whole village smells wonderful." });
  }
  if (season === 'winter' && dayInSeason >= 25) {
    events.push({ id: 'year_end', label: 'Year End Gathering', description: 'The islanders mark the turning of the year with lanterns and song.' });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Fog density helper — returns actual Three.js FogExp2 density value
// ---------------------------------------------------------------------------
export function getSeasonalFogDensity(season) {
  const base = 0.0015;
  const atm = getSeasonalAtmosphere(season);
  return base * atm.fogDensity;
}

// ---------------------------------------------------------------------------
// Season HUD string helper
// ---------------------------------------------------------------------------
export function seasonHudText(gameDay) {
  const season = getSeason(gameDay);
  const dis = getDayInSeason(gameDay);
  const year = getYear(gameDay);
  const label = SEASON_LABELS[season];
  return `${label.emoji} ${label.name} · Day ${dis + 1} · Year ${year}`;
}
