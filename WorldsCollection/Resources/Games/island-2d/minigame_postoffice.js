/**
 * Post Office Mini-Game — CAD-445
 *
 * Sort incoming letters into the correct pigeonholes by clicking
 * the right slot. Works on a timer with score and mistake tracking.
 */

import { getDifficulty, recordCompletion } from './job_progression.js';

// ---------------------------------------------------------------------------
// Recipients — one slot per person
// ---------------------------------------------------------------------------
const RECIPIENTS = [
  { name: 'Mabel',     emoji: '👩‍🍳', color: '#e17055' },
  { name: 'Gus',       emoji: '📬', color: '#5b9bd5'  },
  { name: 'Fern',      emoji: '🌿', color: '#6ab04c'  },
  { name: 'Olive',     emoji: '🕯️', color: '#a29bfe'  },
  { name: 'Rosa',      emoji: '🌹', color: '#e8a87c'  },
  { name: 'Jack',      emoji: '⚓', color: '#4a5568'  },
  { name: 'Petra',     emoji: '🎨', color: '#fdcb6e'  },
  { name: 'Jin',       emoji: '🔬', color: '#55efc4'  },
  { name: 'Lena',      emoji: '🔦', color: '#74b9ff'  },
  { name: 'Old Will',  emoji: '🌲', color: '#b2bec3'  },
];

// ---------------------------------------------------------------------------
// PostOfficeMinigame
// ---------------------------------------------------------------------------
export class PostOfficeMinigame {
  constructor() {
    this.active = false;
    this._score = 0;
    this._mistakes = 0;
    this._sorted = 0;
    this._currentLetter = null;
    this._phase = 'playing';   // 'playing' | 'result'
    this._gameTimer = 60;
    this._gameDuration = 60;
    this._resultTimer = 0;
    this._overlay = null;
    this._letterEl = null;
    this._timerEl = null;
    this._scoreEl = null;
    this._msgEl = null;
    this._slotsEl = null;
    this._animFrame = null;
    this._lastTime = null;
    this._buildUI();
  }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'postoffice-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(5, 0, 0, 0.93)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      fontFamily: "'Work Sans', system-ui, sans-serif",
      gap: '14px',
    });

    // Title
    const title = document.createElement('div');
    title.textContent = '📮 POST OFFICE';
    Object.assign(title.style, {
      color: '#ff6b6b',
      fontSize: '24px',
      fontWeight: '600',
      letterSpacing: '4px',
    });

    // Stats
    const stats = document.createElement('div');
    Object.assign(stats.style, { display: 'flex', gap: '24px', color: '#cc8888', fontSize: '14px' });
    const scoreEl = document.createElement('div');
    scoreEl.id = 'po-score';
    scoreEl.textContent = 'Score: 0';
    const timerEl = document.createElement('div');
    timerEl.id = 'po-timer';
    timerEl.textContent = 'Time: 1:00';
    const mistakesEl = document.createElement('div');
    mistakesEl.id = 'po-mistakes';
    mistakesEl.textContent = 'Mistakes: 0';
    stats.appendChild(scoreEl);
    stats.appendChild(timerEl);
    stats.appendChild(mistakesEl);
    this._scoreEl = scoreEl;
    this._timerEl = timerEl;

    // Current letter panel
    const letterWrap = document.createElement('div');
    Object.assign(letterWrap.style, {
      background: '#fff8f0',
      border: '3px solid #cc4444',
      borderRadius: '8px',
      padding: '16px 28px',
      textAlign: 'center',
      minWidth: '200px',
    });
    const letterLabel = document.createElement('div');
    letterLabel.textContent = 'NEXT LETTER';
    Object.assign(letterLabel.style, { color: '#994444', fontSize: '10px', letterSpacing: '3px', marginBottom: '6px' });
    const letterEl = document.createElement('div');
    letterEl.id = 'po-letter';
    Object.assign(letterEl.style, { color: '#331111', fontSize: '20px', fontWeight: '600' });
    letterWrap.appendChild(letterLabel);
    letterWrap.appendChild(letterEl);
    this._letterEl = letterEl;

    // Instruction
    const instrEl = document.createElement('div');
    instrEl.textContent = 'Click the correct pigeonhole';
    Object.assign(instrEl.style, { color: '#885555', fontSize: '12px', letterSpacing: '1px' });

    // Message
    const msgEl = document.createElement('div');
    msgEl.id = 'po-msg';
    Object.assign(msgEl.style, { color: '#a8e6cf', fontSize: '13px', minHeight: '18px', letterSpacing: '1px' });
    this._msgEl = msgEl;

    // Pigeonhole grid
    const slotsEl = document.createElement('div');
    slotsEl.id = 'po-slots';
    Object.assign(slotsEl.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '8px',
      padding: '0 40px',
    });
    this._slotsEl = slotsEl;

    for (const r of RECIPIENTS) {
      const slot = document.createElement('button');
      slot.dataset.name = r.name;
      slot.innerHTML = `<span style="font-size:18px">${r.emoji}</span><br><span style="font-size:10px">${r.name}</span>`;
      Object.assign(slot.style, {
        background: '#2a0808',
        border: `2px solid ${r.color}55`,
        borderRadius: '8px',
        color: r.color,
        padding: '8px',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
        minWidth: '80px',
      });
      slot.onmouseenter = () => { slot.style.borderColor = r.color; slot.style.background = '#3a1010'; };
      slot.onmouseleave = () => { slot.style.borderColor = r.color + '55'; slot.style.background = '#2a0808'; };
      slot.onclick = () => this._sort(r.name, slot);
      slotsEl.appendChild(slot);
    }

    // Hint
    const hint = document.createElement('div');
    hint.textContent = '[ ESC ] Leave';
    Object.assign(hint.style, { color: '#441a1a', fontSize: '10px', letterSpacing: '3px', marginTop: '4px' });

    overlay.appendChild(title);
    overlay.appendChild(stats);
    overlay.appendChild(letterWrap);
    overlay.appendChild(instrEl);
    overlay.appendChild(msgEl);
    overlay.appendChild(slotsEl);
    overlay.appendChild(hint);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.active) this._end();
    });
  }

  _nextLetter() {
    const r = RECIPIENTS[Math.floor(Math.random() * RECIPIENTS.length)];
    this._currentLetter = r;
    if (this._letterEl) {
      this._letterEl.textContent = `${r.emoji} To: ${r.name}`;
    }
  }

  _sort(name, slotEl) {
    if (!this.active || this._phase !== 'playing' || !this._currentLetter) return;

    if (name === this._currentLetter.name) {
      this._score += 10;
      this._sorted++;
      this._showMsg('Correct! ✓', '#a8e6cf');
      // Brief highlight
      const prev = slotEl.style.background;
      slotEl.style.background = '#0a3a1a';
      setTimeout(() => { slotEl.style.background = prev; }, 300);
    } else {
      this._mistakes++;
      this._score = Math.max(0, this._score - 3);
      this._showMsg(`Wrong slot! That goes to ${this._currentLetter.name}.`, '#ff8888');
      // Highlight correct slot
      const correct = this._slotsEl.querySelector(`[data-name="${this._currentLetter.name}"]`);
      if (correct) {
        const prev = correct.style.background;
        correct.style.background = '#3a0a0a';
        setTimeout(() => { correct.style.background = prev; }, 400);
      }
    }

    const mistakesEl = document.getElementById('po-mistakes');
    if (mistakesEl) mistakesEl.textContent = `Mistakes: ${this._mistakes}`;
    if (this._scoreEl) this._scoreEl.textContent = `Score: ${this._score}`;
    this._nextLetter();
  }

  _showMsg(text, color = '#a8e6cf') {
    if (!this._msgEl) return;
    this._msgEl.textContent = text;
    this._msgEl.style.color = color;
    clearTimeout(this._msgTimeout);
    this._msgTimeout = setTimeout(() => { if (this._msgEl) this._msgEl.textContent = ''; }, 2000);
  }

  _tick(now) {
    if (!this.active) return;
    const delta = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
    this._lastTime = now;

    if (this._phase === 'playing') {
      this._gameTimer -= delta;
      const remaining = Math.max(0, this._gameTimer);
      const m = Math.floor(remaining / 60);
      const s = Math.floor(remaining % 60);
      if (this._timerEl) this._timerEl.textContent = `Time: ${m}:${String(s).padStart(2,'0')}`;

      if (this._gameTimer <= 0) {
        this._phase = 'result';
        this._showResult();
        return;
      }
    } else if (this._phase === 'result') {
      this._resultTimer -= delta;
      if (this._resultTimer <= 0) { this._end(); return; }
    }

    this._animFrame = requestAnimationFrame(t => this._tick(t));
  }

  _showResult() {
    const accuracy = this._sorted > 0 ? Math.round((this._sorted / (this._sorted + this._mistakes)) * 100) : 0;
    const grade = accuracy >= 90 ? 'Perfect sorting!' : accuracy >= 70 ? 'Good job!' : 'Needs work!';
    if (this._msgEl) {
      this._msgEl.textContent = `Done! ${grade} Sorted: ${this._sorted} | Accuracy: ${accuracy}%`;
      this._msgEl.style.color = '#f0c868';
    }
    if (this._letterEl) this._letterEl.textContent = '📬 Mail delivered!';
    if (recordCompletion) recordCompletion('postOffice', this._score);
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
    this._mistakes = 0;
    this._sorted = 0;
    this._gameTimer = this._gameDuration;
    this._phase = 'playing';
    if (this._scoreEl) this._scoreEl.textContent = 'Score: 0';
    const mistakesEl = document.getElementById('po-mistakes');
    if (mistakesEl) mistakesEl.textContent = 'Mistakes: 0';
    if (this._msgEl) this._msgEl.textContent = '';
    this._overlay.style.display = 'flex';
    this._nextLetter();
    this._lastTime = null;
    this._animFrame = requestAnimationFrame(t => this._tick(t));
  }

  update() { /* driven by rAF internally */ }
}
