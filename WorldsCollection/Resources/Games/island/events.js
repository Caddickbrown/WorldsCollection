/**
 * Island Events — CAD-403, CAD-404, CAD-405
 *
 * CAD-403: Storm event — island responds, NPCs go inside, some areas closed
 * CAD-404: Market day — monthly, town square comes alive
 * CAD-405: Community project — player initiates, unfolds over several days
 *
 * Events are time-driven and persist state in localStorage.
 */

import { getSimTime } from './npcs.js';
import { addEntry, hasEntry } from './journal.js';

const STORAGE_KEY = 'island_events';

// ---------------------------------------------------------------------------
// Event state
// ---------------------------------------------------------------------------
let _state = {
  storm: { active: false, timer: 0, cooldown: 0 },
  market: { active: false, dayCounter: 0, lastTriggered: 0 },
  project: { active: false, phase: 0, contributions: 0, type: null },
};

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch {}
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _state = { ..._state, ...JSON.parse(raw) };
  } catch {}
}

// ---------------------------------------------------------------------------
// STORM (CAD-403)
// ---------------------------------------------------------------------------
const STORM_DURATION = 180;      // 3 real minutes
const STORM_COOLDOWN = 600;      // 10 real minutes between storms
const STORM_CHANCE = 0.002;      // per-frame chance to trigger (checked once/sec)

const STORM_CLOSED_AREAS = ['beach', 'southBeach', 'eastBeach', 'dock', 'harbour'];

const STORM_NPC_DIALOGUE = [
  "Best stay indoors until this passes.",
  "The wind's really picking up out there.",
  "Storms don't last long here. Just hunker down.",
  "I hope the boats are tied down properly.",
  "The roof's holding. That's all that matters right now.",
];

export function isStormActive() {
  return _state.storm.active;
}

export function getStormProgress() {
  if (!_state.storm.active) return 0;
  return _state.storm.timer / STORM_DURATION;
}

export function isAreaClosedByStorm(areaKey) {
  if (!_state.storm.active) return false;
  return STORM_CLOSED_AREAS.includes(areaKey);
}

export function getStormDialogue() {
  return STORM_NPC_DIALOGUE[Math.floor(Math.random() * STORM_NPC_DIALOGUE.length)];
}

// ---------------------------------------------------------------------------
// MARKET DAY (CAD-404)
// ---------------------------------------------------------------------------
const MARKET_DURATION = 300;     // 5 real minutes
const MARKET_INTERVAL_DAYS = 7;  // every 7 in-game day cycles

const MARKET_STALLS = [
  { npc: 'Mabel', item: 'Fresh pastries', emoji: '🥐' },
  { npc: 'Fern', item: 'Farm vegetables', emoji: '🥕' },
  { npc: 'Jack', item: 'Smoked fish', emoji: '🐟' },
  { npc: 'Olive', item: 'Handmade candles', emoji: '🕯️' },
  { npc: 'Petra', item: 'Paintings', emoji: '🖼️' },
  { npc: 'Jin', item: 'Pressed flowers', emoji: '🌸' },
];

export function isMarketDay() {
  return _state.market.active;
}

export function getMarketStalls() {
  return MARKET_STALLS;
}

const MARKET_DIALOGUE = [
  "Market day! Come have a look at what I've brought.",
  "I look forward to market day all week.",
  "The square's really buzzing today, isn't it?",
  "Everyone brings their best on market day.",
];

export function getMarketDialogue() {
  return MARKET_DIALOGUE[Math.floor(Math.random() * MARKET_DIALOGUE.length)];
}

// ---------------------------------------------------------------------------
// COMMUNITY PROJECT (CAD-405)
// ---------------------------------------------------------------------------
const PROJECT_TYPES = [
  { id: 'garden', name: 'Community Garden', description: 'A shared garden in the town square', phases: 4 },
  { id: 'mural', name: 'Island Mural', description: 'A painted mural on the workshop wall', phases: 3 },
  { id: 'bench', name: 'Clifftop Bench', description: 'A carved bench with a view', phases: 3 },
];

const PROJECT_PHASE_DIALOGUE = {
  garden: [
    "The soil's been turned — good start on the garden.",
    "Seeds are in! Now we wait and water.",
    "The first shoots are coming through. How exciting!",
    "The community garden is flourishing! Everyone did their part.",
  ],
  mural: [
    "Petra's sketched out the design. We need paint.",
    "Colours are going on — it's coming to life!",
    "The mural is finished! It looks wonderful.",
  ],
  bench: [
    "Otto's cut the wood. We need to assemble it.",
    "The bench is taking shape up on the clifftop.",
    "Done! Best seat on the island, I reckon.",
  ],
};

export function isProjectActive() {
  return _state.project.active;
}

export function getProjectState() {
  return { ..._state.project };
}

/** Start a community project. Returns the project info or null if one is active. */
export function startProject() {
  if (_state.project.active) return null;
  const type = PROJECT_TYPES[Math.floor(Math.random() * PROJECT_TYPES.length)];
  _state.project = { active: true, phase: 0, contributions: 0, type: type.id, maxPhases: type.phases };
  _save();
  addEntry('event', `Started community project: ${type.name}`);
  return type;
}

/** Contribute to the current project. Returns phase dialogue or null. */
export function contributeToProject() {
  if (!_state.project.active) return null;
  _state.project.contributions++;
  const needed = 3; // contributions needed per phase
  if (_state.project.contributions >= needed) {
    _state.project.contributions = 0;
    _state.project.phase++;
    const dialogues = PROJECT_PHASE_DIALOGUE[_state.project.type] || [];
    const line = dialogues[_state.project.phase - 1] || 'Progress!';

    if (_state.project.phase >= _state.project.maxPhases) {
      // Project complete
      _state.project.active = false;
      _save();
      addEntry('event', `Completed community project: ${_state.project.type}`);
      return { complete: true, line: dialogues[dialogues.length - 1] || 'Project complete!' };
    }
    _save();
    return { complete: false, line };
  }
  _save();
  return null;
}

export function getProjectDialogue() {
  if (!_state.project.active) return null;
  const dialogues = PROJECT_PHASE_DIALOGUE[_state.project.type] || [];
  return dialogues[_state.project.phase] || "The project is coming along nicely.";
}

// ---------------------------------------------------------------------------
// Update loop
// ---------------------------------------------------------------------------
let _dayAccum = 0;
let _stormCheckTimer = 0;

export function updateEvents(delta, gameHour) {
  // Day tracking for market
  _dayAccum += delta / 20; // same sim scalar as main loop
  if (_dayAccum >= 24) {
    _dayAccum -= 24;
    _state.market.dayCounter++;
  }

  // --- Storm logic ---
  if (_state.storm.active) {
    _state.storm.timer += delta;
    if (_state.storm.timer >= STORM_DURATION) {
      _state.storm.active = false;
      _state.storm.timer = 0;
      _state.storm.cooldown = STORM_COOLDOWN;
      _save();
    }
  } else {
    if (_state.storm.cooldown > 0) {
      _state.storm.cooldown -= delta;
    } else {
      _stormCheckTimer += delta;
      if (_stormCheckTimer >= 1) {
        _stormCheckTimer = 0;
        if (Math.random() < STORM_CHANCE) {
          _state.storm.active = true;
          _state.storm.timer = 0;
          _save();
          if (!hasEntry('First storm on the island')) {
            addEntry('event', 'First storm on the island');
          }
        }
      }
    }
  }

  // --- Market day logic ---
  if (_state.market.active) {
    _state.market.timer = (_state.market.timer || 0) + delta;
    if (_state.market.timer >= MARKET_DURATION) {
      _state.market.active = false;
      _state.market.timer = 0;
      _save();
    }
  } else {
    // Trigger market at 9am on every Nth day
    if (_state.market.dayCounter >= MARKET_INTERVAL_DAYS && gameHour >= 9 && gameHour < 10) {
      _state.market.active = true;
      _state.market.timer = 0;
      _state.market.dayCounter = 0;
      _save();
      if (!hasEntry('First market day')) {
        addEntry('event', 'First market day');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initEvents() {
  _load();
}
