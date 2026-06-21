/**
 * Job Mini-Game Difficulty Progression — CAD-397, CAD-398, CAD-399
 *
 * CAD-397: Difficulty increases after first success in each minigame
 * CAD-398: Completion rewards — relationship bump + discoverable items
 * CAD-399: NPC reaction when player covers their job
 *
 * Persisted via localStorage.
 */

import { addPoints, RELATIONSHIP_POINTS } from './relationships.js';
import { addMemory } from './npc_memory.js';
import { addEntry, hasEntry } from './journal.js';
import { BAG, ITEMS } from './bag.js';

const STORAGE_KEY = 'island_job_progression';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _state = {
  // Per-game completion counts
  fishing:  { completions: 0, bestScore: 0 },
  bakery:   { completions: 0, bestScore: 0 },
  pub:      { completions: 0, bestScore: 0 },
  school:   { completions: 0, bestScore: 0 },
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
// Difficulty scaling
// ---------------------------------------------------------------------------

// NPC associated with each job
const JOB_NPCS = {
  fishing: 'Jack',
  bakery:  'Mabel',
  pub:     'Barney',
  school:  'Clara',
};

/**
 * Get difficulty parameters for a job minigame.
 * Returns multipliers that the minigame should apply.
 */
export function getDifficulty(gameId) {
  const data = _state[gameId];
  if (!data) return { speedMult: 1, timeMult: 1, targetMult: 1 };

  const level = Math.min(data.completions, 10); // cap at level 10

  return {
    // Things move/decay faster
    speedMult: 1 + level * 0.12,
    // Less time available
    timeMult: 1 - level * 0.05,
    // Higher targets to hit
    targetMult: 1 + level * 0.1,
    level,
  };
}

/**
 * Record a minigame completion. Awards relationship points and items.
 * Returns { npcName, reward, dialogue }.
 */
export function recordCompletion(gameId, score) {
  if (!_state[gameId]) _state[gameId] = { completions: 0, bestScore: 0 };

  _state[gameId].completions++;
  if (score > _state[gameId].bestScore) {
    _state[gameId].bestScore = score;
  }

  const npcName = JOB_NPCS[gameId];

  // Relationship bump
  if (npcName) {
    addPoints(npcName, RELATIONSHIP_POINTS.subin);
    addMemory(npcName, 'subin', {});
  }

  // Reward items based on game type
  const reward = _getReward(gameId, _state[gameId].completions);
  if (reward && ITEMS[reward]) {
    BAG.add(ITEMS[reward], 1);
  }

  // Journal entry on first completion of each type
  const firstKey = `First time: ${gameId}`;
  if (!hasEntry(firstKey)) {
    addEntry('discovery', firstKey);
  }

  _save();

  // NPC reaction dialogue
  const dialogue = _getReactionDialogue(gameId, _state[gameId].completions);

  return { npcName, reward, dialogue, completions: _state[gameId].completions };
}

function _getReward(gameId, completions) {
  // Every completion gives a relevant item; special items at milestones
  switch (gameId) {
    case 'fishing':
      return 'fish';
    case 'bakery':
      return completions % 3 === 0 ? 'honey' : 'bread';
    case 'pub':
      return completions % 4 === 0 ? 'apple' : 'pastry';
    case 'school':
      return completions % 2 === 0 ? 'flower' : null;
    default:
      return null;
  }
}

// CAD-399: NPC reaction dialogue when player covers their job
const REACTION_DIALOGUE = {
  fishing: [
    "Not bad for a landlubber! The fish were biting, eh?",
    "You're getting the hang of it. Natural rhythm.",
    "Keep that up and I'll be out of a job!",
    "The sea respects you. I can tell.",
  ],
  bakery: [
    "The bread smelled wonderful — even from the clifftop!",
    "You've got flour on your nose, but the loaves are perfect.",
    "The regulars said your batch was one of the best. Well done!",
    "You're a natural baker. I always knew it.",
  ],
  pub: [
    "The punters were happy! No complaints — that's high praise here.",
    "Pulling pints is an art. You've got it.",
    "Three regulars asked if you'd come back. Take that as a compliment.",
    "The Anchor runs well in your hands.",
  ],
  school: [
    "The children loved today's lesson. They're still talking about it.",
    "You've got patience — that's half of teaching.",
    "Rex said you handled the tricky ones beautifully.",
    "Come back any time. The class adores you.",
  ],
};

function _getReactionDialogue(gameId, completions) {
  const lines = REACTION_DIALOGUE[gameId] || [];
  const idx = Math.min(completions - 1, lines.length - 1);
  return lines[idx] || lines[lines.length - 1] || "Good work out there!";
}

/** Get completion count for a game. */
export function getCompletions(gameId) {
  return _state[gameId] ? _state[gameId].completions : 0;
}

/** Get all stats. */
export function getAllStats() {
  return { ..._state };
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initJobProgression() {
  _load();
}
