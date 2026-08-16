/**
 * Café Mini-Game — CAD-444
 *
 * Take orders from NPC customers and serve the correct drink or food.
 * Orders expire if not served in time. Score-based with tip system.
 */

import { getDifficulty, recordCompletion } from './job_progression.js';

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
const MENU = [
  { id: 'flat_white',    name: 'Flat White',    emoji: '☕', category: 'drink' },
  { id: 'green_tea',     name: 'Green Tea',     emoji: '🍵', category: 'drink' },
  { id: 'lemonade',      name: 'Lemonade',      emoji: '🍋', category: 'drink' },
  { id: 'hot_choc',      name: 'Hot Chocolate', emoji: '🍫', category: 'drink' },
  { id: 'toast',         name: 'Toast',         emoji: '🍞', category: 'food'  },
  { id: 'croissant',     name: 'Croissant',     emoji: '🥐', category: 'food'  },
  { id: 'soup',          name: 'Tomato Soup',   emoji: '🍲', category: 'food'  },
  { id: 'salad',         name: 'Garden Salad',  emoji: '🥗', category: 'food'  },
];

const NPC_CUSTOMERS = [
  { name: 'Mabel',   emoji: '👩‍🍳' },
  { name: 'Gus',     emoji: '📬' },
  { name: 'Rosa',    emoji: '🌹' },
  { name: 'Petra',   emoji: '🎨' },
  { name: 'Jin',     emoji: '🌿' },
  { name: 'Lena',    emoji: '🔦' },
  { name: 'Kai',     emoji: '🏄' },
  { name: 'Suki',    emoji: '🌸' },
  { name: 'Clara',   emoji: '📚' },
  { name: 'Otto',    emoji: '⚙️' },
];

// ---------------------------------------------------------------------------
// CafeMinigame
// ---------------------------------------------------------------------------
export class CafeMinigame {
  constructor() {
    this.active = false;
    this._score = 0;
    this._tips = 0;
    this._orders = [];         // active orders [{npc, item, timer, maxTimer, el}]
    this._selectedItem = null;
    this._phase = 'playing';   // 'playing' | 'result'
    this._resultTimer = 0;
    this._gameTimer = 0;
    this._gameDuration = 90;   // seconds
    this._overlay = null;
    this._ordersEl = null;
    this._menuEl = null;
    this._timerEl = null;
    this._scoreEl = null;
    this._msgEl = null;
    this._nextOrderTimer = 0;
    this._nextOrderInterval = 8;
    this._maxOrders = 3;
    this._animFrame = null;
    this._lastTime = null;
    this._buildUI();
  }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'cafe-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(5, 2, 0, 0.93)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      fontFamily: "'Work Sans', system-ui, sans-serif",
      gap: '16px',
    });

    // Title bar
    const title = document.createElement('div');
    title.textContent = '☕ THE CAFÉ';
    Object.assign(title.style, {
      color: '#f0c868',
      fontSize: '24px',
      fontWeight: '600',
      letterSpacing: '4px',
    });

    // Stats bar
    const stats = document.createElement('div');
    Object.assign(stats.style, {
      display: 'flex',
      gap: '24px',
      color: '#c8a850',
      fontSize: '14px',
    });
    const scoreEl = document.createElement('div');
    scoreEl.id = 'cafe-score';
    scoreEl.textContent = 'Score: 0';
    const timerEl = document.createElement('div');
    timerEl.id = 'cafe-timer';
    timerEl.textContent = 'Time: 1:30';
    const tipsEl = document.createElement('div');
    tipsEl.id = 'cafe-tips';
    tipsEl.textContent = 'Tips: 0';
    stats.appendChild(scoreEl);
    stats.appendChild(timerEl);
    stats.appendChild(tipsEl);
    this._scoreEl = scoreEl;
    this._timerEl = timerEl;

    // Orders panel
    const ordersLabel = document.createElement('div');
    ordersLabel.textContent = 'ORDERS';
    Object.assign(ordersLabel.style, {
      color: '#8a6832',
      fontSize: '11px',
      letterSpacing: '3px',
      alignSelf: 'flex-start',
      marginLeft: '60px',
    });

    const ordersEl = document.createElement('div');
    ordersEl.id = 'cafe-orders';
    Object.assign(ordersEl.style, {
      display: 'flex',
      gap: '12px',
      minHeight: '90px',
      alignItems: 'flex-start',
      padding: '0 60px',
    });
    this._ordersEl = ordersEl;

    // Message
    const msgEl = document.createElement('div');
    msgEl.id = 'cafe-msg';
    Object.assign(msgEl.style, {
      color: '#a8e6cf',
      fontSize: '14px',
      minHeight: '20px',
      letterSpacing: '1px',
    });
    this._msgEl = msgEl;

    // Menu
    const menuLabel = document.createElement('div');
    menuLabel.textContent = 'MENU — click to serve';
    Object.assign(menuLabel.style, {
      color: '#8a6832',
      fontSize: '11px',
      letterSpacing: '3px',
    });

    const menuEl = document.createElement('div');
    menuEl.id = 'cafe-menu';
    Object.assign(menuEl.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      padding: '0 60px',
    });
    this._menuEl = menuEl;

    // Build menu buttons
    for (const item of MENU) {
      const btn = document.createElement('button');
      btn.dataset.itemId = item.id;
      btn.innerHTML = `<span style="font-size:20px">${item.emoji}</span><br><span style="font-size:11px">${item.name}</span>`;
      Object.assign(btn.style, {
        background: '#2a1a08',
        border: '2px solid #5a3a18',
        borderRadius: '8px',
        color: '#f0c868',
        padding: '10px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'border-color 0.15s, background 0.15s',
        fontFamily: 'inherit',
      });
      btn.onmouseenter = () => { btn.style.borderColor = '#f0c868'; btn.style.background = '#3a2810'; };
      btn.onmouseleave = () => { btn.style.borderColor = '#5a3a18'; btn.style.background = '#2a1a08'; };
      btn.onclick = () => this._serve(item.id);
      menuEl.appendChild(btn);
    }

    // Close hint
    const hint = document.createElement('div');
    hint.textContent = '[ ESC ] Leave';
    Object.assign(hint.style, {
      color: '#4a3a28',
      fontSize: '10px',
      letterSpacing: '3px',
      marginTop: '4px',
    });

    overlay.appendChild(title);
    overlay.appendChild(stats);
    overlay.appendChild(ordersLabel);
    overlay.appendChild(ordersEl);
    overlay.appendChild(msgEl);
    overlay.appendChild(menuLabel);
    overlay.appendChild(menuEl);
    overlay.appendChild(hint);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // ESC to close
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.active) {
        this._end();
      }
    });
  }

  _spawnOrder() {
    if (this._orders.length >= this._maxOrders) return;

    const difficulty = getDifficulty ? getDifficulty() : 1;
    const maxTime = Math.max(12, 22 - difficulty * 3);

    const npc = NPC_CUSTOMERS[Math.floor(Math.random() * NPC_CUSTOMERS.length)];
    const item = MENU[Math.floor(Math.random() * MENU.length)];

    // Build order bubble
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: '#1a0e04',
      border: '2px solid #8a5828',
      borderRadius: '10px',
      padding: '10px 14px',
      minWidth: '120px',
      position: 'relative',
      transition: 'border-color 0.3s',
    });

    const nameEl = document.createElement('div');
    nameEl.textContent = `${npc.emoji} ${npc.name}`;
    Object.assign(nameEl.style, { color: '#f0c868', fontSize: '13px', marginBottom: '4px' });

    const itemEl = document.createElement('div');
    itemEl.textContent = `${item.emoji} ${item.name}`;
    Object.assign(itemEl.style, { color: '#c8a850', fontSize: '12px' });

    const timerBar = document.createElement('div');
    Object.assign(timerBar.style, {
      height: '4px',
      background: '#a8e6cf',
      borderRadius: '2px',
      marginTop: '8px',
      width: '100%',
      transition: 'width linear',
    });

    card.appendChild(nameEl);
    card.appendChild(itemEl);
    card.appendChild(timerBar);
    this._ordersEl.appendChild(card);

    const order = { npc, item, timer: maxTime, maxTimer: maxTime, el: card, timerBar };
    this._orders.push(order);
  }

  _serve(itemId) {
    if (!this.active || this._phase !== 'playing') return;

    // Find first order matching this item
    const idx = this._orders.findIndex(o => o.item.id === itemId);
    if (idx === -1) {
      this._showMsg('No one ordered that!', '#ff8888');
      return;
    }

    const order = this._orders[idx];
    const timeRatio = order.timer / order.maxTimer;
    const tip = timeRatio > 0.6 ? 2 : timeRatio > 0.3 ? 1 : 0;

    this._score += 10 + tip * 5;
    this._tips += tip;
    this._showMsg(`${order.npc.name}: "${order.item.emoji} Perfect, thank you!"`, '#a8e6cf');
    order.el.remove();
    this._orders.splice(idx, 1);
    this._updateStats();
  }

  _showMsg(text, color = '#a8e6cf') {
    if (!this._msgEl) return;
    this._msgEl.textContent = text;
    this._msgEl.style.color = color;
    clearTimeout(this._msgTimeout);
    this._msgTimeout = setTimeout(() => { if (this._msgEl) this._msgEl.textContent = ''; }, 2500);
  }

  _updateStats() {
    if (this._scoreEl) this._scoreEl.textContent = `Score: ${this._score}`;
  }

  _tick(now) {
    if (!this.active) return;
    const delta = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
    this._lastTime = now;

    if (this._phase === 'playing') {
      this._gameTimer -= delta;
      this._nextOrderTimer -= delta;

      // Update order timers
      for (let i = this._orders.length - 1; i >= 0; i--) {
        const o = this._orders[i];
        o.timer -= delta;
        if (o.timerBar) {
          const pct = Math.max(o.timer / o.maxTimer, 0) * 100;
          o.timerBar.style.width = pct + '%';
          o.timerBar.style.background = pct > 50 ? '#a8e6cf' : pct > 25 ? '#f0c868' : '#ff8888';
        }
        if (o.timer <= 0) {
          this._showMsg(`${o.npc.name} left without their order!`, '#ff8888');
          o.el.remove();
          this._orders.splice(i, 1);
          this._score = Math.max(0, this._score - 5);
          this._updateStats();
        }
      }

      // Spawn new orders
      if (this._nextOrderTimer <= 0) {
        this._spawnOrder();
        const difficulty = getDifficulty ? getDifficulty() : 1;
        this._nextOrderTimer = Math.max(5, this._nextOrderInterval - difficulty);
      }

      // Clock display
      const remaining = Math.max(0, this._gameTimer);
      const m = Math.floor(remaining / 60);
      const s = Math.floor(remaining % 60);
      if (this._timerEl) this._timerEl.textContent = `Time: ${m}:${String(s).padStart(2,'0')}`;

      if (this._gameTimer <= 0) {
        this._phase = 'result';
        this._showResult();
      }
    } else if (this._phase === 'result') {
      this._resultTimer -= delta;
      if (this._resultTimer <= 0) {
        this._end();
        return;
      }
    }

    this._animFrame = requestAnimationFrame(t => this._tick(t));
  }

  _showResult() {
    if (this._ordersEl) this._ordersEl.innerHTML = '';
    this._orders = [];
    const grade = this._score >= 150 ? 'Excellent!' : this._score >= 80 ? 'Good shift!' : 'Keep practicing!';
    if (this._msgEl) {
      this._msgEl.textContent = `Shift over — ${grade} Score: ${this._score} | Tips: ${this._tips}`;
      this._msgEl.style.color = '#f0c868';
    }
    if (recordCompletion) recordCompletion('cafe', this._score);
    this._resultTimer = 4;
    this._animFrame = requestAnimationFrame(t => this._tick(t));
  }

  _end() {
    this.active = false;
    this._phase = 'playing';
    this._overlay.style.display = 'none';
    if (this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
  }

  start() {
    if (this.active) return;
    this.active = true;
    this._score = 0;
    this._tips = 0;
    this._gameTimer = this._gameDuration;
    this._nextOrderTimer = 2;
    this._phase = 'playing';
    this._orders.forEach(o => o.el.remove());
    this._orders = [];
    if (this._msgEl) this._msgEl.textContent = '';
    if (this._scoreEl) this._scoreEl.textContent = 'Score: 0';
    this._overlay.style.display = 'flex';
    this._lastTime = null;
    this._animFrame = requestAnimationFrame(t => this._tick(t));
  }

  update() { /* driven by rAF internally */ }
}
