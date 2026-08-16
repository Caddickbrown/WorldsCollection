/**
 * Bea's Found-Things Collection — CAD-402
 *
 * Bea collects shells, sea glass, and driftwood. The player can trade
 * found items with her or give them as gifts. She has a collection
 * that grows and she'll comment on what she has.
 */

import { getRelationship, addPoints, RELATIONSHIP_POINTS } from './relationships.js';
import { addMemory } from './npc_memory.js';
import { addEntry } from './journal.js';
import { BAG } from './bag.js';

const STORAGE_KEY = 'island_bea_collection';

// Items Bea is interested in
const BEA_WANTS = ['shell', 'sea_glass', 'driftwood'];

// Bea's responses when you give her something she collects
const BEA_RESPONSES = {
  shell: [
    "A shell! I've been looking for one this colour!",
    "This one's got a spiral inside — look!",
    "My shell jar is getting really full now.",
  ],
  sea_glass: [
    "Sea glass! This is my favourite kind — so smooth.",
    "I'm going to put this one in the light. It'll glow.",
    "Where did you find this? The south beach?",
  ],
  driftwood: [
    "Driftwood! I'm building something with these. Secret.",
    "This one looks like a tiny boat. Can you see it?",
    "I bet this came from really far away.",
  ],
};

// Bea's responses when she offers something back
const BEA_TRADE_OFFERS = [
  "Here — I found this earlier. You can have it!",
  "Swap? I've got something for you too.",
  "Fair trade! Here's something from my collection.",
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _collection = { shell: 0, sea_glass: 0, driftwood: 0 };
let _tradeCount = 0;

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ collection: _collection, tradeCount: _tradeCount })); } catch {}
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      _collection = data.collection || _collection;
      _tradeCount = data.tradeCount || 0;
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Check if an item is something Bea wants. */
export function beaWantsItem(itemId) {
  return BEA_WANTS.includes(itemId);
}

/**
 * Give an item to Bea. Returns { response, tradeItem } or null.
 * tradeItem is what Bea gives back (she sometimes trades).
 */
export function giveItemToBea(itemId) {
  if (!beaWantsItem(itemId)) return null;

  // Remove from player bag
  if (!BAG.remove(itemId, 1)) return null;

  // Add to Bea's collection
  _collection[itemId] = (_collection[itemId] || 0) + 1;
  _tradeCount++;

  // Relationship boost
  addPoints('Bea', RELATIONSHIP_POINTS.gift_liked);
  addMemory('Bea', 'gift_liked', { itemName: itemId.replace('_', ' ') });

  // Get response
  const responses = BEA_RESPONSES[itemId] || ['Thanks!'];
  const response = responses[Math.floor(Math.random() * responses.length)];

  // Sometimes Bea trades back (30% chance)
  let tradeItem = null;
  if (Math.random() < 0.3 && _tradeCount > 2) {
    const options = BEA_WANTS.filter(id => id !== itemId && _collection[id] > 0);
    if (options.length > 0) {
      tradeItem = options[Math.floor(Math.random() * options.length)];
      _collection[tradeItem]--;
    }
  }

  // Journal entry on first trade
  if (_tradeCount === 1) {
    addEntry('discovery', 'Started trading found things with Bea');
  }

  _save();
  return { response, tradeItem };
}

/** Get Bea's collection status (for dialogue). */
export function getBeaCollectionDialogue() {
  const total = Object.values(_collection).reduce((a, b) => a + b, 0);
  if (total === 0) return "I'm collecting things from the beach. Shells, glass, driftwood. Bring me some?";
  if (total < 5) return `I've got ${total} things in my collection so far. Want to see?`;
  if (total < 15) return "My collection's getting bigger! I've got a whole shelf now.";
  return "My collection's amazing — everyone comes to look at it. Thanks to you!";
}

/** Get collection counts. */
export function getBeaCollection() {
  return { ..._collection };
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initBeaCollection() {
  _load();
}
