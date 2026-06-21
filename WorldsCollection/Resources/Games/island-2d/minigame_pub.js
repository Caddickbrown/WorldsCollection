// Pub Serving Minigame — Run The Anchor
// Self-contained DOM-based minigame. No Three.js required.

import { getDifficulty, recordCompletion } from './job_progression.js';

export class PubMinigame {
  constructor() {
    this._active = false;
    this._container = null;
    this._score = 0;
    this._streak = 0;
    this._timeLeft = 60;
    this._customers = [];
    this._nextCustomerId = 0;
    this._spawnTimer = 0;
    this._spawnInterval = 4 + Math.random() * 2;
    this._gameTimer = null;
    this._frameId = null;
    this._lastTime = null;
    this._gameOver = false;
    this._keyHandler = null;

    this._drinkTypes = [
      { key: '1', label: 'Pint of Ale', emoji: '🍺' },
      { key: '2', label: 'Glass of Wine', emoji: '🍷' },
      { key: '3', label: 'Cup of Tea', emoji: '☕' },
    ];

    this._portraits = ['👨', '👩', '🧔', '👱', '🧓', '👴', '👵', '🧕'];
    this._buildUI();
  }

  _buildUI() {
    const container = document.createElement('div');
    container.id = 'pub-minigame';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      z-index: 10000;
      font-family: 'Georgia', serif;
      background: radial-gradient(ellipse at top, #3d1c02 0%, #1a0a00 60%, #0d0500 100%);
      overflow: hidden;
    `;

    // Wooden plank overlay at bottom (bar counter)
    const counter = document.createElement('div');
    counter.style.cssText = `
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 28%;
      background: linear-gradient(180deg, #5c3410 0%, #3d200a 40%, #2a1405 100%);
      border-top: 6px solid #7a4a1e;
      box-shadow: 0 -4px 30px rgba(0,0,0,0.7);
    `;
    // Plank lines
    for (let i = 0; i < 6; i++) {
      const plank = document.createElement('div');
      plank.style.cssText = `
        position: absolute;
        top: ${8 + i * 16}%;
        left: 0; right: 0;
        height: 1px;
        background: rgba(0,0,0,0.3);
      `;
      counter.appendChild(plank);
    }
    container.appendChild(counter);

    // Ambient candlelight glow
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      bottom: 25%; left: 50%;
      transform: translateX(-50%);
      width: 300px; height: 80px;
      background: radial-gradient(ellipse, rgba(255,160,40,0.18) 0%, transparent 70%);
      pointer-events: none;
    `;
    container.appendChild(glow);

    // Header bar
    const header = document.createElement('div');
    header.style.cssText = `
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px 10px;
      box-sizing: border-box;
      background: linear-gradient(180deg, rgba(80,30,5,0.95) 0%, rgba(40,15,2,0.85) 100%);
      border-bottom: 3px solid #7a4a1e;
      z-index: 2;
    `;

    const title = document.createElement('div');
    title.textContent = '🍺 The Anchor';
    title.style.cssText = `
      font-size: 22px;
      font-weight: bold;
      color: #f5c842;
      text-shadow: 0 2px 8px rgba(200,100,0,0.8);
      letter-spacing: 1px;
    `;

    const stats = document.createElement('div');
    stats.style.cssText = `
      display: flex;
      gap: 24px;
      align-items: center;
    `;

    const scoreEl = document.createElement('div');
    scoreEl.id = 'pub-score';
    scoreEl.style.cssText = `color: #f5c842; font-size: 18px; font-weight: bold;`;
    scoreEl.textContent = 'Score: 0';

    const streakEl = document.createElement('div');
    streakEl.id = 'pub-streak';
    streakEl.style.cssText = `color: #ff9f43; font-size: 16px;`;
    streakEl.textContent = '🔥 Streak: 0';

    const timerEl = document.createElement('div');
    timerEl.id = 'pub-timer';
    timerEl.style.cssText = `color: #ffeaa7; font-size: 20px; font-weight: bold; min-width: 80px; text-align: right;`;
    timerEl.textContent = '⏱ 60s';

    stats.appendChild(scoreEl);
    stats.appendChild(streakEl);
    stats.appendChild(timerEl);
    header.appendChild(title);
    header.appendChild(stats);
    container.appendChild(header);

    // Customer area
    const customerArea = document.createElement('div');
    customerArea.id = 'pub-customers';
    customerArea.style.cssText = `
      position: relative;
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 30px;
      padding: 20px 20px 12px;
      box-sizing: border-box;
      z-index: 2;
    `;
    container.appendChild(customerArea);

    // Drink shortcuts bar
    const drinksBar = document.createElement('div');
    drinksBar.style.cssText = `
      position: relative;
      z-index: 2;
      display: flex;
      gap: 16px;
      justify-content: center;
      padding: 12px 0 8px;
      background: rgba(0,0,0,0.3);
      width: 100%;
      border-top: 2px solid rgba(122,74,30,0.6);
    `;

    this._drinkTypes.forEach(drink => {
      const btn = document.createElement('div');
      btn.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(180deg, #5c3410 0%, #3a1f08 100%);
        border: 2px solid #7a4a1e;
        border-radius: 10px;
        padding: 8px 18px;
        color: #f5c842;
        font-size: 14px;
        cursor: default;
        min-width: 90px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,100,0.1);
        transition: transform 0.1s;
      `;
      btn.innerHTML = `
        <span style="font-size:28px">${drink.emoji}</span>
        <span style="font-size:11px; margin-top:2px; color:#ffeaa7">${drink.label}</span>
        <span style="font-size:16px; font-weight:bold; margin-top:2px; background:#3a1f08; border-radius:4px; padding:2px 8px; border:1px solid #7a4a1e;">[${drink.key}]</span>
      `;
      btn.id = `pub-btn-${drink.key}`;
      drinksBar.appendChild(btn);
    });

    container.appendChild(drinksBar);

    // Feedback flash
    const feedback = document.createElement('div');
    feedback.id = 'pub-feedback';
    feedback.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 32px;
      font-weight: bold;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 20;
      text-shadow: 0 2px 12px rgba(0,0,0,0.8);
    `;
    container.appendChild(feedback);

    // Results overlay
    const results = document.createElement('div');
    results.id = 'pub-results';
    results.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(10,4,0,0.92);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 30;
      color: #f5c842;
      font-size: 20px;
      text-align: center;
      gap: 16px;
    `;
    container.appendChild(results);

    document.body.appendChild(container);
    this._container = container;
  }

  start() {
    this._active = true;
    this._score = 0;
    this._streak = 0;
    // CAD-397: difficulty reduces time and speeds up spawns
    const diff = getDifficulty('pub');
    this._timeLeft = Math.max(30, Math.floor(60 * diff.timeMult));
    this._customers = [];
    this._nextCustomerId = 0;
    this._spawnTimer = 0;
    this._baseSpawnInterval = (4 + Math.random() * 2) / diff.speedMult;
    this._spawnInterval = this._baseSpawnInterval;
    this._gameOver = false;
    this._lastTime = null;

    // Clear customer area
    const area = document.getElementById('pub-customers');
    area.innerHTML = '';

    // Hide results
    const results = document.getElementById('pub-results');
    results.style.display = 'none';

    this._container.style.display = 'flex';
    this._updateHUD();

    // Key handler
    this._keyHandler = (e) => this._onKey(e.key);
    window.addEventListener('keydown', this._keyHandler);

    // Spawn first customer immediately
    this._spawnCustomer();

    // Start loop
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  _loop(now) {
    if (!this._active) return;
    const delta = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
    this._lastTime = now;
    this.update(delta);
    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }

  update(delta) {
    if (!this._active || this._gameOver) return;

    // Countdown
    this._timeLeft -= delta;
    if (this._timeLeft <= 0) {
      this._timeLeft = 0;
      this._endGame();
      return;
    }

    // Spawn timer
    this._spawnTimer += delta;
    if (this._spawnTimer >= this._spawnInterval && this._customers.length < 3) {
      this._spawnTimer = 0;
      this._spawnInterval = 4 + Math.random() * 2;
      this._spawnCustomer();
    }

    // Update customers
    const toRemove = [];
    this._customers.forEach(c => {
      c.timeLeft -= delta;
      if (c.timeLeft <= 0) {
        // Customer leaves unhappy
        this._score = Math.max(0, this._score - 5);
        this._streak = 0;
        this._showFeedback('😤 -5', '#ff6b6b');
        toRemove.push(c.id);
        this._removeCustomerEl(c.id, false);
      } else {
        // Update timer display
        const timerEl = document.getElementById(`cust-timer-${c.id}`);
        if (timerEl) {
          const pct = c.timeLeft / 8;
          timerEl.textContent = `⏳ ${c.timeLeft.toFixed(1)}s`;
          timerEl.style.color = pct > 0.5 ? '#7bed9f' : pct > 0.25 ? '#ffa502' : '#ff4757';
          // Update progress bar
          const bar = document.getElementById(`cust-bar-${c.id}`);
          if (bar) bar.style.width = `${Math.max(0, pct * 100)}%`;
        }
      }
    });
    toRemove.forEach(id => {
      this._customers = this._customers.filter(c => c.id !== id);
    });

    this._updateHUD();
  }

  _spawnCustomer() {
    const id = this._nextCustomerId++;
    const drink = this._drinkTypes[Math.floor(Math.random() * this._drinkTypes.length)];
    const portrait = this._portraits[Math.floor(Math.random() * this._portraits.length)];

    const customer = { id, drink, portrait, timeLeft: 8 };
    this._customers.push(customer);

    const area = document.getElementById('pub-customers');
    const el = document.createElement('div');
    el.id = `cust-${id}`;
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      animation: custSlideIn 0.4s ease-out;
    `;

    el.innerHTML = `
      <div id="cust-order-${id}" style="
        background: rgba(245,200,66,0.15);
        border: 2px solid #f5c842;
        border-radius: 12px;
        padding: 6px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 12px rgba(245,200,66,0.2);
      ">
        <span style="font-size: 28px">${drink.emoji}</span>
        <span style="font-size: 11px; color: #ffeaa7; white-space: nowrap;">${drink.label}</span>
        <div id="cust-timer-${id}" style="font-size: 12px; color: #7bed9f; font-weight: bold;">⏳ 8.0s</div>
        <div style="width: 80px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden;">
          <div id="cust-bar-${id}" style="height: 100%; width: 100%; background: #7bed9f; transition: background 0.5s;"></div>
        </div>
      </div>
      <div style="font-size: 44px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">${portrait}</div>
      <div style="
        height: 10px;
        width: 60px;
        background: linear-gradient(180deg, rgba(92,52,16,0.8) 0%, rgba(58,32,8,0.4) 100%);
        border-radius: 50%;
        margin-top: -4px;
      "></div>
    `;

    area.appendChild(el);

    // Inject keyframe animation if not already
    if (!document.getElementById('pub-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pub-keyframes';
      style.textContent = `
        @keyframes custSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes custShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes custExit {
          to { opacity: 0; transform: scale(0.7) translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  _removeCustomerEl(id, happy) {
    const el = document.getElementById(`cust-${id}`);
    if (!el) return;
    el.style.animation = 'custExit 0.4s ease-in forwards';
    setTimeout(() => el.remove(), 420);
  }

  _onKey(key) {
    if (this._gameOver) {
      if (key === 'Escape') this.stop();
      return;
    }
    const drink = this._drinkTypes.find(d => d.key === key);
    if (!drink) return;

    // Flash button
    const btn = document.getElementById(`pub-btn-${key}`);
    if (btn) {
      btn.style.transform = 'scale(0.92)';
      btn.style.borderColor = '#f5c842';
      setTimeout(() => {
        btn.style.transform = '';
        btn.style.borderColor = '#7a4a1e';
      }, 180);
    }

    if (this._customers.length === 0) return;

    // Find oldest customer waiting for this drink
    const match = this._customers.find(c => c.drink.key === key);
    if (match) {
      this._score += 10;
      this._streak++;
      this._showFeedback(`${drink.emoji} +10${this._streak > 1 ? ` 🔥x${this._streak}` : ''}`, '#7bed9f');
      this._customers = this._customers.filter(c => c.id !== match.id);
      this._removeCustomerEl(match.id, true);
    } else {
      // Wrong drink — penalise, shake all customers
      this._score = Math.max(0, this._score - 2);
      this._streak = 0;
      this._showFeedback('❌ -2', '#ff4757');
      this._customers.forEach(c => {
        const el = document.getElementById(`cust-${c.id}`);
        if (el) {
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = 'custShake 0.4s ease';
        }
      });
    }
    this._updateHUD();
  }

  _showFeedback(text, color) {
    const fb = document.getElementById('pub-feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.style.color = color;
    fb.style.opacity = '1';
    fb.style.transition = 'none';
    clearTimeout(this._fbTimeout);
    this._fbTimeout = setTimeout(() => {
      fb.style.transition = 'opacity 0.6s';
      fb.style.opacity = '0';
    }, 700);
  }

  _updateHUD() {
    const scoreEl = document.getElementById('pub-score');
    const streakEl = document.getElementById('pub-streak');
    const timerEl = document.getElementById('pub-timer');
    if (scoreEl) scoreEl.textContent = `Score: ${this._score}`;
    if (streakEl) streakEl.textContent = `🔥 Streak: ${this._streak}`;
    if (timerEl) {
      const t = Math.ceil(this._timeLeft);
      timerEl.textContent = `⏱ ${t}s`;
      timerEl.style.color = t <= 10 ? '#ff4757' : '#ffeaa7';
    }
  }

  _endGame() {
    this._gameOver = true;
    cancelAnimationFrame(this._frameId);
    // CAD-398: record completion for rewards
    if (this._score > 0) recordCompletion('pub', this._score);

    const results = document.getElementById('pub-results');
    results.style.display = 'flex';

    let rating = '';
    if (this._score >= 100) rating = '🏆 Legendary Landlord!';
    else if (this._score >= 60) rating = '⭐ Solid Shift!';
    else if (this._score >= 30) rating = '🍺 Getting the Hang of It';
    else rating = '😅 Rough Night...';

    results.innerHTML = `
      <div style="font-size:48px; margin-bottom:8px;">🍺</div>
      <div style="font-size:26px; font-weight:bold; color:#f5c842; margin-bottom:4px;">Last Orders!</div>
      <div style="font-size:42px; font-weight:bold; color:#fff; margin:8px 0;">${this._score} pts</div>
      <div style="font-size:20px; color:#ff9f43; margin-bottom:4px;">${rating}</div>
      <div style="font-size:16px; color:#dfe6e9; margin-bottom:20px;">Best streak: ${this._streak} 🔥</div>
      <div style="font-size:14px; color:#b2bec3;">Press <strong style="color:#f5c842;">[Esc]</strong> to leave the bar</div>
    `;
  }

  stop() {
    this._active = false;
    this._gameOver = true;
    if (this._frameId) cancelAnimationFrame(this._frameId);
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._container) this._container.style.display = 'none';
    // Clear customers
    this._customers = [];
  }

  get active() {
    return this._active;
  }
}
