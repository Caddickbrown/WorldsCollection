/**
 * The Bag — Island Town Inventory System (CAD-431)
 *
 * A simple inventory with item stacking, persistence via localStorage,
 * and a DOM overlay UI toggled with the B key.
 */

// ---------------------------------------------------------------------------
// Item catalogue
// ---------------------------------------------------------------------------
export const ITEMS = {
  bread:      { id: 'bread',      name: 'Fresh Bread',    emoji: '🍞', category: 'produce' },
  fish:       { id: 'fish',       name: 'Fresh Fish',     emoji: '🐟', category: 'produce' },
  pastry:     { id: 'pastry',     name: 'Pastry',         emoji: '🥐', category: 'produce' },
  honey:      { id: 'honey',      name: 'Honey',          emoji: '🍯', category: 'produce' },
  apple:      { id: 'apple',      name: 'Apple',          emoji: '🍎', category: 'produce' },
  shell:      { id: 'shell',      name: 'Shell',          emoji: '🐚', category: 'found'   },
  sea_glass:  { id: 'sea_glass',  name: 'Sea Glass',      emoji: '💎', category: 'found'   },
  driftwood:  { id: 'driftwood',  name: 'Driftwood',      emoji: '🪵', category: 'found'   },
  flower:     { id: 'flower',     name: 'Wildflower',     emoji: '🌸', category: 'gift'    },
  seaweed:    { id: 'seaweed',    name: 'Seaweed',        emoji: '🌿', category: 'found'   },
};

// ---------------------------------------------------------------------------
// Bag (inventory) singleton
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'island_bag';

export const BAG = {
  items: [],       // [{ id, name, emoji, quantity, category }]
  maxSlots: 20,

  /** Add an item (from ITEMS catalogue or custom). Stacks if already present. */
  add(itemDef, quantity = 1) {
    const existing = this.items.find(i => i.id === itemDef.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      if (this.items.length >= this.maxSlots) return false; // bag full
      this.items.push({
        id: itemDef.id,
        name: itemDef.name,
        emoji: itemDef.emoji,
        quantity,
        category: itemDef.category,
      });
    }
    this._save();
    this._refreshUI();
    this._showToast(`+${quantity} ${itemDef.emoji} ${itemDef.name}`);
    return true;
  },

  /** Remove quantity of an item. Returns false if not enough. */
  remove(itemId, quantity = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    const item = this.items[idx];
    if (item.quantity < quantity) return false;
    item.quantity -= quantity;
    if (item.quantity <= 0) this.items.splice(idx, 1);
    this._save();
    this._refreshUI();
    return true;
  },

  /** Check if the bag has at least `quantity` of an item. */
  has(itemId, quantity = 1) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.quantity >= quantity : false;
  },

  /** Empty the bag. */
  clear() {
    this.items = [];
    this._save();
    this._refreshUI();
  },

  /** Serialise for localStorage. */
  toJSON() {
    return JSON.stringify(this.items);
  },

  /** Restore from localStorage data. */
  fromJSON(json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) this.items = parsed;
    } catch { /* ignore bad data */ }
    this._refreshUI();
  },

  // -- persistence helpers --
  _save() {
    try { localStorage.setItem(STORAGE_KEY, this.toJSON()); } catch { /* */ }
  },

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.fromJSON(raw);
    } catch { /* */ }
  },

  // -- UI references (set by _buildUI) --
  _overlay: null,
  _grid: null,
  _countEl: null,
  _toastEl: null,
  _toastTimer: 0,
  _open: false,

  _refreshUI() {
    if (!this._grid) return;
    this._grid.innerHTML = '';
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'bag-slot';
      if (i < this.items.length) {
        const item = this.items[i];
        const emoji = document.createElement('span');
        emoji.className = 'bag-slot__emoji';
        emoji.textContent = item.emoji;
        const qty = document.createElement('span');
        qty.className = 'bag-slot__qty';
        qty.textContent = item.quantity > 1 ? `×${item.quantity}` : '';
        slot.appendChild(emoji);
        slot.appendChild(qty);
        slot.title = `${item.name} (${item.category})`;
      }
      this._grid.appendChild(slot);
    }
    if (this._countEl) {
      this._countEl.textContent = `${this.items.length} / ${this.maxSlots}`;
    }
  },

  _showToast(msg) {
    if (!this._toastEl) return;
    this._toastEl.textContent = msg;
    this._toastEl.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toastEl.style.opacity = '0';
    }, 2000);
  },

  toggle() {
    this._open = !this._open;
    if (this._overlay) {
      this._overlay.style.display = this._open ? 'flex' : 'none';
      if (this._open) this._refreshUI();
    }
  },
};

// ---------------------------------------------------------------------------
// Build the bag UI overlay (call once on load)
// ---------------------------------------------------------------------------
export function initBagUI() {
  // -- Toast (floating notification for item pickups) --
  const toast = document.createElement('div');
  toast.id = 'bag-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.75)',
    color: '#ffeaa7',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '14px',
    padding: '8px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 234, 167, 0.3)',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.3s',
    zIndex: '9990',
    letterSpacing: '1px',
  });
  document.body.appendChild(toast);
  BAG._toastEl = toast;

  // -- Overlay --
  const overlay = document.createElement('div');
  overlay.id = 'bag-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0, 0, 0, 0.82)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9998',
    fontFamily: '"Courier New", Courier, monospace',
    backdropFilter: 'blur(4px)',
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#1a1410',
    border: '3px solid #8a6a3a',
    borderRadius: '12px',
    padding: '28px 32px 20px',
    minWidth: '380px',
    maxWidth: '440px',
    boxShadow: '0 0 40px rgba(138, 106, 58, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  });

  // Title
  const title = document.createElement('div');
  title.textContent = '🎒 THE BAG';
  Object.assign(title.style, {
    color: '#ffeaa7',
    fontSize: '22px',
    fontWeight: 'bold',
    letterSpacing: '6px',
    textShadow: '0 0 12px rgba(255, 234, 167, 0.4)',
  });

  // Item count
  const countEl = document.createElement('div');
  Object.assign(countEl.style, {
    color: '#8a6a3a',
    fontSize: '11px',
    letterSpacing: '3px',
  });
  BAG._countEl = countEl;

  // Grid
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 64px)',
    gridAutoRows: '64px',
    gap: '6px',
  });
  BAG._grid = grid;

  // Close hint
  const hint = document.createElement('div');
  hint.textContent = '[ B ] CLOSE BAG';
  Object.assign(hint.style, {
    color: '#5a4a30',
    fontSize: '10px',
    letterSpacing: '3px',
    marginTop: '4px',
  });

  panel.appendChild(title);
  panel.appendChild(countEl);
  panel.appendChild(grid);
  panel.appendChild(hint);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  BAG._overlay = overlay;

  // -- Inject slot styles --
  const style = document.createElement('style');
  style.textContent = `
    .bag-slot {
      width: 64px; height: 64px;
      background: rgba(255, 244, 217, 0.06);
      border: 1px solid rgba(138, 106, 58, 0.35);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background 0.15s;
    }
    .bag-slot:hover {
      background: rgba(255, 244, 217, 0.12);
      border-color: #8a6a3a;
    }
    .bag-slot__emoji {
      font-size: 28px;
      line-height: 1;
    }
    .bag-slot__qty {
      font-size: 11px;
      color: #ffeaa7;
      margin-top: 2px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  // Load persisted inventory
  BAG._load();
  BAG._refreshUI();
}
