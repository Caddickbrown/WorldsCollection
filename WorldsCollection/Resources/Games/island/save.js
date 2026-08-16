/**
 * Unified Save/Load System — CAD-442
 *
 * Single saveGame()/loadGame() that snapshots all module state.
 * Auto-saves every in-game day. HUD indicator shows save status.
 *
 * Modules integrated: player position, bag, relationships, journal,
 * milestones, npc_memory, job_progression, events, game time.
 */

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------
const SAVE_KEY = 'island_save_v1';
const AUTO_SAVE_INTERVAL = 24; // save every N in-game hours (one full day)

// ---------------------------------------------------------------------------
// HUD indicator
// ---------------------------------------------------------------------------
let _hudEl = null;
let _hudTimer = 0;

function _buildHUD() {
  const el = document.createElement('div');
  el.id = 'save-indicator';
  Object.assign(el.style, {
    position: 'fixed',
    top: '16px',
    left: '16px',
    color: '#a8e6cf',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    letterSpacing: '1px',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '4px 10px',
    borderRadius: '6px',
    backdropFilter: 'blur(4px)',
    opacity: '0',
    transition: 'opacity 0.4s',
    pointerEvents: 'none',
    zIndex: '9990',
  });
  document.body.appendChild(el);
  _hudEl = el;
}

function _flashHUD(text) {
  if (!_hudEl) return;
  _hudEl.textContent = text;
  _hudEl.style.opacity = '1';
  _hudTimer = 3.0;
}

/** Call each frame with delta to fade the HUD indicator. */
export function updateSaveHUD(delta) {
  if (_hudTimer > 0) {
    _hudTimer -= delta;
    if (_hudTimer <= 0 && _hudEl) {
      _hudEl.style.opacity = '0';
    }
  }
}

// ---------------------------------------------------------------------------
// Module state collectors — each module exposes getState/setState
// We read directly from localStorage keys each module already owns,
// so save.js works as a unified snapshot layer on top.
// ---------------------------------------------------------------------------

const MODULE_KEYS = [
  'island_bag',
  'island_relationships',
  'island_journal',
  'island_milestones_seen',
  'island_npc_memory',
  'island_job_progression',
  'island_events',
];

// ---------------------------------------------------------------------------
// Core save/load
// ---------------------------------------------------------------------------

/**
 * Capture all module state + player position + game hour into one snapshot.
 * @param {number} gameHour - current in-game hour (float 0-24)
 * @param {{ x, y, z }} playerPos - player world position
 */
export function saveGame(gameHour, playerPos) {
  const snapshot = {
    version: 1,
    savedAt: Date.now(),
    gameHour,
    playerPos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
    modules: {},
  };

  for (const key of MODULE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      snapshot.modules[key] = raw ? JSON.parse(raw) : null;
    } catch {
      snapshot.modules[key] = null;
    }
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    _flashHUD('✦ Saved');
    return true;
  } catch {
    _flashHUD('⚠ Save failed');
    return false;
  }
}

/**
 * Restore all module state from the saved snapshot.
 * Returns { gameHour, playerPos } or null if no save found.
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw);
    if (!snapshot || snapshot.version !== 1) return null;

    // Restore each module's localStorage entry
    for (const [key, value] of Object.entries(snapshot.modules)) {
      if (value !== null && value !== undefined) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch { /* */ }
      }
    }

    _flashHUD('✦ Loaded');
    return {
      gameHour: snapshot.gameHour ?? 8,
      playerPos: snapshot.playerPos ?? { x: 0, y: 0, z: 0 },
      savedAt: snapshot.savedAt,
    };
  } catch {
    return null;
  }
}

/** True if a save file exists. */
export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/** Delete the save file. */
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  _flashHUD('✦ Save deleted');
}

// ---------------------------------------------------------------------------
// Auto-save tracker
// ---------------------------------------------------------------------------
let _hoursSinceLastSave = 0;

/**
 * Call each game tick. Triggers an auto-save once per in-game day.
 * @param {number} simHoursDelta - how many in-game hours passed this tick
 * @param {number} gameHour - current game hour
 * @param {{ x, y, z }} playerPos - player world position
 */
export function tickAutoSave(simHoursDelta, gameHour, playerPos) {
  _hoursSinceLastSave += simHoursDelta;
  if (_hoursSinceLastSave >= AUTO_SAVE_INTERVAL) {
    _hoursSinceLastSave = 0;
    saveGame(gameHour, playerPos);
  }
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------
export function initSaveSystem() {
  _buildHUD();

  // Bind Ctrl+S for manual save (set from outside after game vars initialised)
  // The main loop will wire up actual keybind once gameHour & playerPos are available
}
