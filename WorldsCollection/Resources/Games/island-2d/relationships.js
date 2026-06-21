/**
 * Relationship System — CAD-393
 *
 * Tracks player relationships with NPCs across three levels:
 *   acquaintance (0–29) → friend (30–69) → confidant (70–100)
 *
 * Persisted via localStorage. Exposes functions for other systems
 * (gift giving, NPC memory, milestone scenes) to read/modify.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'island_relationships';

export const LEVELS = {
  acquaintance: { min: 0, max: 29, label: 'Acquaintance', emoji: '👋' },
  friend:       { min: 30, max: 69, label: 'Friend', emoji: '🤝' },
  confidant:    { min: 70, max: 100, label: 'Confidant', emoji: '💛' },
};

// Points awarded for various interactions
export const RELATIONSHIP_POINTS = {
  talk:       2,   // talking to an NPC
  gift_liked: 8,   // giving a gift they like
  gift_any:   3,   // giving any gift
  subin:      10,  // covering their shift
  event:      5,   // participating in shared event
};

// NPC gift preferences — items they particularly like
export const NPC_GIFT_PREFERENCES = {
  Mabel:         ['flower', 'honey'],
  Gus:           ['apple', 'bread'],
  Fern:          ['flower', 'seaweed'],
  Olive:         ['sea_glass', 'shell'],
  Rosa:          ['flower', 'shell'],
  Jack:          ['driftwood', 'seaweed'],
  Pete:          ['bread', 'apple'],
  Barney:        ['fish', 'honey'],
  Suki:          ['flower', 'pastry'],
  Clara:         ['shell', 'sea_glass'],
  Rex:           ['driftwood', 'apple'],
  Otto:          ['driftwood', 'fish'],
  Petra:         ['sea_glass', 'flower'],
  Jin:           ['seaweed', 'flower'],
  'Old Will':    ['fish', 'driftwood'],
  Lena:          ['shell', 'sea_glass'],
  Kai:           ['bread', 'pastry'],
  Bea:           ['shell', 'sea_glass'],
  'Captain Reed':['fish', 'driftwood'],
  Morwen:        ['seaweed', 'shell'],
  Corwin:        ['driftwood', 'seaweed'],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const _relationships = {}; // npcName → { points, level, interactions }

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_relationships));
  } catch { /* */ }
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(_relationships, parsed);
    }
  } catch { /* */ }
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/** Get or initialise relationship data for an NPC. */
export function getRelationship(npcName) {
  if (!_relationships[npcName]) {
    _relationships[npcName] = { points: 0, level: 'acquaintance', interactions: 0 };
  }
  return _relationships[npcName];
}

/** Get the current level object for an NPC. */
export function getLevel(npcName) {
  const rel = getRelationship(npcName);
  return LEVELS[rel.level];
}

/** Add relationship points. Returns { newLevel, levelUp } if level changed. */
export function addPoints(npcName, amount) {
  const rel = getRelationship(npcName);
  const oldLevel = rel.level;
  rel.points = Math.max(0, Math.min(100, rel.points + amount));
  rel.interactions++;

  // Determine new level
  if (rel.points >= LEVELS.confidant.min) {
    rel.level = 'confidant';
  } else if (rel.points >= LEVELS.friend.min) {
    rel.level = 'friend';
  } else {
    rel.level = 'acquaintance';
  }

  _save();

  const levelUp = oldLevel !== rel.level && rel.level !== 'acquaintance';
  return { newLevel: rel.level, levelUp, points: rel.points };
}

/** Record a talk interaction. */
export function recordTalk(npcName) {
  return addPoints(npcName, RELATIONSHIP_POINTS.talk);
}

/** Record giving a gift. Returns extra info about whether it was liked. */
export function recordGift(npcName, itemId) {
  const prefs = NPC_GIFT_PREFERENCES[npcName] || [];
  const liked = prefs.includes(itemId);
  const pts = liked ? RELATIONSHIP_POINTS.gift_liked : RELATIONSHIP_POINTS.gift_any;
  const result = addPoints(npcName, pts);
  return { ...result, liked };
}

/** Record covering an NPC's shift. */
export function recordSubIn(npcName) {
  return addPoints(npcName, RELATIONSHIP_POINTS.subin);
}

/** Get all relationships (for UI display). */
export function getAllRelationships() {
  return { ..._relationships };
}

// ---------------------------------------------------------------------------
// UI — Relationship indicator overlay (press R to toggle)
// ---------------------------------------------------------------------------
let _overlayEl = null;
let _overlayOpen = false;

function _buildUI() {
  const overlay = document.createElement('div');
  overlay.id = 'relationship-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9997',
    fontFamily: '"Courier New", Courier, monospace',
    backdropFilter: 'blur(4px)',
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#1a1410',
    border: '3px solid #8a6a3a',
    borderRadius: '12px',
    padding: '24px 32px',
    minWidth: '400px',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 0 40px rgba(138, 106, 58, 0.25)',
  });

  const title = document.createElement('div');
  title.textContent = '💛 RELATIONSHIPS';
  Object.assign(title.style, {
    color: '#ffeaa7',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    textAlign: 'center',
    marginBottom: '16px',
  });

  const list = document.createElement('div');
  list.id = 'relationship-list';

  const hint = document.createElement('div');
  hint.textContent = '[ R ] CLOSE';
  Object.assign(hint.style, {
    color: '#5a4a30',
    fontSize: '10px',
    letterSpacing: '3px',
    textAlign: 'center',
    marginTop: '12px',
  });

  panel.appendChild(title);
  panel.appendChild(list);
  panel.appendChild(hint);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  _overlayEl = overlay;
}

function _refreshUI() {
  const list = document.getElementById('relationship-list');
  if (!list) return;
  list.innerHTML = '';

  const entries = Object.entries(_relationships)
    .filter(([_, r]) => r.interactions > 0)
    .sort((a, b) => b[1].points - a[1].points);

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Talk to islanders to build relationships.';
    Object.assign(empty.style, { color: '#8a6a3a', textAlign: 'center', padding: '20px' });
    list.appendChild(empty);
    return;
  }

  for (const [name, rel] of entries) {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      borderBottom: '1px solid rgba(138, 106, 58, 0.2)',
    });

    const levelInfo = LEVELS[rel.level];
    const nameEl = document.createElement('div');
    nameEl.textContent = `${levelInfo.emoji} ${name}`;
    Object.assign(nameEl.style, {
      color: '#ffeaa7',
      fontSize: '14px',
      fontWeight: 'bold',
      minWidth: '140px',
    });

    const barWrap = document.createElement('div');
    Object.assign(barWrap.style, {
      flex: '1',
      height: '8px',
      background: 'rgba(138, 106, 58, 0.2)',
      borderRadius: '4px',
      overflow: 'hidden',
    });

    const barFill = document.createElement('div');
    const colors = { acquaintance: '#8a6a3a', friend: '#4a9e8e', confidant: '#ffeaa7' };
    Object.assign(barFill.style, {
      height: '100%',
      width: `${rel.points}%`,
      background: colors[rel.level] || '#8a6a3a',
      borderRadius: '4px',
      transition: 'width 0.3s',
    });
    barWrap.appendChild(barFill);

    const levelLabel = document.createElement('div');
    levelLabel.textContent = levelInfo.label;
    Object.assign(levelLabel.style, {
      color: '#8a6a3a',
      fontSize: '10px',
      letterSpacing: '1px',
      minWidth: '90px',
      textAlign: 'right',
    });

    row.appendChild(nameEl);
    row.appendChild(barWrap);
    row.appendChild(levelLabel);
    list.appendChild(row);
  }
}

export function toggleRelationshipUI() {
  _overlayOpen = !_overlayOpen;
  if (_overlayEl) {
    _overlayEl.style.display = _overlayOpen ? 'flex' : 'none';
    if (_overlayOpen) _refreshUI();
  }
}

// ---------------------------------------------------------------------------
// CAD-446: Gift Giving Prompt UI
// ---------------------------------------------------------------------------
let _giftPromptEl = null;
let _giftPromptTimer = 0;

function _buildGiftPromptUI() {
  const el = document.createElement('div');
  el.id = 'gift-prompt';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '140px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10, 5, 0, 0.92)',
    border: '2px solid #8a6a3a',
    borderRadius: '12px',
    padding: '14px 22px',
    color: '#ffeaa7',
    fontFamily: "'Work Sans', system-ui, sans-serif",
    fontSize: '14px',
    textAlign: 'center',
    display: 'none',
    flexDirection: 'column',
    gap: '6px',
    zIndex: '9994',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    minWidth: '200px',
  });

  const main = document.createElement('div');
  main.id = 'gift-prompt-text';
  main.textContent = '';

  const sub = document.createElement('div');
  sub.id = 'gift-prompt-sub';
  Object.assign(sub.style, { color: '#8a6a3a', fontSize: '11px', letterSpacing: '1px' });
  sub.textContent = 'Press E to give';

  el.appendChild(main);
  el.appendChild(sub);
  document.body.appendChild(el);
  _giftPromptEl = el;
}

/**
 * Show the "Give gift?" prompt near an NPC when the player has items they'd like.
 * Call each frame when near an NPC with items in the bag.
 * @param {string} npcName
 * @param {string[]} bagItemIds - item IDs currently in player's bag
 */
export function updateGiftPrompt(npcName, bagItemIds) {
  if (!_giftPromptEl) return;
  if (!npcName || !bagItemIds || bagItemIds.length === 0) {
    _giftPromptEl.style.display = 'none';
    return;
  }
  const prefs = NPC_GIFT_PREFERENCES[npcName] || [];
  const likedItems = bagItemIds.filter(id => prefs.includes(id));

  const textEl = document.getElementById('gift-prompt-text');
  if (textEl) {
    if (likedItems.length > 0) {
      textEl.textContent = `🎁 ${npcName} would love a gift!`;
    } else {
      textEl.textContent = `🎁 Give a gift to ${npcName}?`;
    }
  }
  _giftPromptEl.style.display = 'flex';
}

export function hideGiftPrompt() {
  if (_giftPromptEl) _giftPromptEl.style.display = 'none';
}

/**
 * Returns the NPC's gift preference sentiment for a given item.
 * 'loved' | 'liked' | 'neutral' | 'disliked'
 */
export function getGiftSentiment(npcName, itemId) {
  const prefs = NPC_GIFT_PREFERENCES[npcName] || [];
  if (prefs.includes(itemId)) return 'loved';
  return 'neutral';
}

/**
 * Get a personalised gift reaction line.
 */
export function getGiftReaction(npcName, itemId, itemName) {
  const sentiment = getGiftSentiment(npcName, itemId);
  if (sentiment === 'loved') {
    const lines = [
      `${itemName}! You remembered — this is exactly what I love!`,
      `Oh! A ${itemName}! You're too kind, truly.`,
      `I can't believe you brought me ${itemName}. This made my day!`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  const lines = [
    `A ${itemName}? That's thoughtful, thank you.`,
    `How kind of you to bring ${itemName}. I'll make good use of it.`,
    `Thank you for the ${itemName}!`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------
export function initRelationships() {
  _load();
  _buildUI();
  _buildGiftPromptUI();

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
      toggleRelationshipUI();
    }
  });
}
