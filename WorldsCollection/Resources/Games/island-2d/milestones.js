/**
 * Relationship Milestone Scenes — CAD-396
 *
 * Special dialogue/scenes triggered when reaching Friend or Confidant level.
 * Each NPC has unique milestone content.
 */

import { addEntry } from './journal.js';

const STORAGE_KEY = 'island_milestones_seen';

// ---------------------------------------------------------------------------
// Milestone scenes per NPC
// ---------------------------------------------------------------------------
const MILESTONE_SCENES = {
  Mabel: {
    friend: {
      title: 'A Secret Recipe',
      lines: [
        "You know what? I want to show you something.",
        "My grandmother's sourdough recipe. I've never shared it before.",
        "You've been so kind — I think you should have it.",
        "Come by the bakery any morning. I'll teach you.",
      ],
    },
    confidant: {
      title: 'The Heart of the Bakery',
      lines: [
        "I want you to know something, since you're one of my closest friends now.",
        "This bakery... it was nearly a shop once. Before I came here.",
        "I saved it because bread is what holds a village together.",
        "You've reminded me of that. Thank you for being here.",
      ],
    },
  },
  Gus: {
    friend: {
      title: 'The Hidden Post Box',
      lines: [
        "Hey — I trust you enough for this.",
        "There's an old post box hidden by the forest path. Nobody else knows.",
        "Sometimes I leave things there for people to find. Little surprises.",
        "Maybe you could help with that sometime?",
      ],
    },
    confidant: {
      title: 'Letters Home',
      lines: [
        "Can I tell you something? Since we're proper friends.",
        "I write letters to my mum on the mainland every week.",
        "She can't write back — her hands aren't what they were.",
        "But I keep writing. That's what the post is for, really.",
      ],
    },
  },
  Fern: {
    friend: {
      title: 'The Sunrise Field',
      lines: [
        "Come with me tomorrow morning. Before dawn.",
        "There's a moment when the light hits the wheat just so...",
        "I've never shown anyone. But I think you'd appreciate it.",
      ],
    },
    confidant: {
      title: 'Why I Farm',
      lines: [
        "I used to work in the city, you know.",
        "One day I just... stopped. Came here. Planted something.",
        "Watching things grow — it fixed something in me.",
        "You're one of the only people I've told that to.",
      ],
    },
  },
  Jack: {
    friend: {
      title: 'The Lucky Spot',
      lines: [
        "Alright, I'll tell you — but don't go spreading it around.",
        "Past the second rock, east of the headland. That's where they run.",
        "Best fishing on the island. My secret spot. Yours too now.",
      ],
    },
    confidant: {
      title: 'The Sea at Night',
      lines: [
        "I go out at night sometimes. Just me and the water.",
        "It's not about the fish then. It's... I don't know. Peace.",
        "If you ever want to come, just say the word.",
        "I don't offer that to many people.",
      ],
    },
  },
  Petra: {
    friend: {
      title: 'The Unfinished Canvas',
      lines: [
        "I want to show you something in the treehouse.",
        "This painting — I've been working on it for months.",
        "It's the island. All of it. Everyone. But it's not done yet.",
        "I think maybe you'll see what's missing.",
      ],
    },
    confidant: {
      title: 'The Colour of Trust',
      lines: [
        "You're in the painting now, did I tell you?",
        "Not literally — but the colours changed after you came.",
        "Warmer. More gold. That's what friendship looks like, I think.",
        "Thank you for seeing me. Really seeing me.",
      ],
    },
  },
  Bea: {
    friend: {
      title: 'The Secret Den',
      lines: [
        "I've got a secret place! Do you want to see it?",
        "It's in the forest — behind the big mossy rock.",
        "I've never shown a grown-up before. But you're different.",
        "You actually listen when I talk about stuff.",
      ],
    },
    confidant: {
      title: 'Bea\'s Promise',
      lines: [
        "You're my best friend on the whole island. You know that?",
        "When I'm grown up, I'm going to make a museum.",
        "All my shells and glass and things. And you'll be in it.",
        "The sign will say 'With thanks to my friend.'",
      ],
    },
  },
};

// Default scenes for NPCs without custom content
const DEFAULT_SCENES = {
  friend: {
    title: 'Growing Closer',
    lines: [
      "You know, I really enjoy having you around.",
      "It feels like we've become proper friends.",
      "That means something on an island this small.",
    ],
  },
  confidant: {
    title: 'True Friends',
    lines: [
      "I trust you completely. You know that?",
      "On this island, that's the highest thing I can say.",
      "You're part of this place now. Part of us.",
    ],
  },
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _seen = {}; // npcName → { friend: true, confidant: true }

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_seen)); } catch {}
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _seen = JSON.parse(raw);
  } catch {}
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Check if a milestone scene should trigger. Call after a level-up.
 * Returns scene data { title, lines } or null.
 */
export function checkMilestoneScene(npcName, newLevel) {
  if (newLevel === 'acquaintance') return null;

  if (!_seen[npcName]) _seen[npcName] = {};
  if (_seen[npcName][newLevel]) return null; // already seen

  _seen[npcName][newLevel] = true;
  _save();

  const npcScenes = MILESTONE_SCENES[npcName] || {};
  const scene = npcScenes[newLevel] || DEFAULT_SCENES[newLevel];

  if (scene) {
    addEntry('milestone', `${npcName}: "${scene.title}"`);
  }

  return scene || null;
}

/**
 * Check if any milestone has been seen for an NPC at a level.
 */
export function hasMilestoneSeen(npcName, level) {
  return !!(_seen[npcName] && _seen[npcName][level]);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initMilestones() {
  _load();
}
