/**
 * NPC Memory System — CAD-394
 *
 * NPCs remember things you've done together and comment on them.
 * Memories are stored per-NPC and surface as dialogue when talking.
 */

const STORAGE_KEY = 'island_npc_memories';

// ---------------------------------------------------------------------------
// Memory types and templates
// ---------------------------------------------------------------------------
const MEMORY_TEMPLATES = {
  gift_liked: [
    "That {item} you gave me was lovely — thank you!",
    "I still have the {item} you brought me. Brightened my day.",
    "Remember when you gave me that {item}? I think about it sometimes.",
  ],
  gift_any: [
    "Thanks again for the gift the other day.",
    "You're always so thoughtful with your gifts.",
  ],
  subin: [
    "I still owe you for covering my shift that day.",
    "The islanders said you did brilliantly when you filled in for me.",
    "It meant a lot that you stepped in when I needed a break.",
  ],
  talked_many: [
    "We've had some good chats, haven't we?",
    "I always enjoy our conversations.",
    "You know, you're one of my favourite people to talk to.",
  ],
  level_up_friend: [
    "I feel like we've become real friends, you and me.",
    "It's nice — having someone you can count on.",
  ],
  level_up_confidant: [
    "I trust you completely, you know that?",
    "You're one of the closest people to me on this island.",
    "I'm glad you're here. Truly.",
  ],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _memories = {}; // npcName → [{ type, data, timestamp }]

function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_memories));
  } catch { /* */ }
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _memories = JSON.parse(raw);
  } catch { /* */ }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Record a memory for an NPC. */
export function addMemory(npcName, type, data = {}) {
  if (!_memories[npcName]) _memories[npcName] = [];
  // Don't add duplicate types within a short window (prevent spam)
  const recent = _memories[npcName].filter(m => m.type === type && Date.now() - m.timestamp < 60000);
  if (recent.length > 0 && type !== 'level_up_friend' && type !== 'level_up_confidant') return;

  _memories[npcName].push({ type, data, timestamp: Date.now() });
  // Keep max 20 memories per NPC
  if (_memories[npcName].length > 20) {
    _memories[npcName] = _memories[npcName].slice(-20);
  }
  _save();
}

/**
 * Get a memory-based dialogue line for an NPC.
 * Returns null if no memories, or a string if they have something to say.
 * Only returns a line ~40% of the time to keep it feeling natural.
 */
export function getMemoryDialogue(npcName) {
  const mems = _memories[npcName];
  if (!mems || mems.length === 0) return null;

  // 40% chance to surface a memory
  if (Math.random() > 0.4) return null;

  // Pick a random memory, preferring recent ones
  const idx = Math.max(0, mems.length - 1 - Math.floor(Math.random() * Math.min(5, mems.length)));
  const mem = mems[idx];

  const templates = MEMORY_TEMPLATES[mem.type];
  if (!templates) return null;

  let line = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders
  if (mem.data.itemName) {
    line = line.replace('{item}', mem.data.itemName);
  }

  return line;
}

/** Get all memories for an NPC (for journal/debug). */
export function getMemories(npcName) {
  return _memories[npcName] || [];
}

/** Initialise the memory system. */
export function initNPCMemory() {
  _load();
}
