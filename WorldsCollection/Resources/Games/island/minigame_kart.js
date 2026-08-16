// Kart Track Mini-Game — CAD-432
// Simple lap-race countdown game triggered near the kart track.
// DOM-based overlay, no Three.js dependency.

import { getDifficulty, recordCompletion } from './job_progression.js';

const TOTAL_LAPS = 3;

export class KartMinigame {
  constructor() {
    this._active = false;
    this._container = null;
    this._lap = 0;
    this._lapTimes = [];
    this._elapsed = 0;
    this._countdownLeft = 0;
    this._counting = false;
    this._racing = false;
    this._finished = false;
    this._frameId = null;
    this._lastTime = null;
    this._keyHandler = null;
    // Track progress within a lap (0-100), player taps to accelerate
    this._progress = 0;
    this._speed = 0;
    this._bestTime = parseFloat(localStorage.getItem('island_kart_best') || '0') || 0;
    this._buildUI();
  }

  _buildUI() {
    const container = document.createElement('div');
    container.id = 'kart-minigame';
    container.style.cssText = `
      position: fixed; inset: 0; display: none;
      flex-direction: column; align-items: center; justify-content: center;
      z-index: 10000; font-family: 'Georgia', serif;
      background: radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%);
      overflow: hidden; padding: 20px; box-sizing: border-box;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `position:relative;z-index:2;width:100%;max-width:700px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;`;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `color:#ff6600;font-size:22px;font-weight:bold;text-shadow:0 1px 6px rgba(0,0,0,0.7);`;
    titleEl.textContent = '🏎️ Kart Race';

    const lapEl = document.createElement('div');
    lapEl.id = 'kart-lap';
    lapEl.style.cssText = `color:#ffd700;font-size:18px;font-weight:bold;`;
    lapEl.textContent = 'Lap 0 / 3';

    header.appendChild(titleEl);
    header.appendChild(lapEl);
    container.appendChild(header);

    // Track visual
    const trackArea = document.createElement('div');
    trackArea.style.cssText = `
      position:relative;z-index:2;width:100%;max-width:700px;
      background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 50%,#1a1a1a 100%);
      border-radius:12px;border:3px solid #444;padding:24px;box-sizing:border-box;
      min-height:260px;box-shadow:0 8px 32px rgba(0,0,0,0.8);
    `;

    // Progress bar (the "track")
    const trackBar = document.createElement('div');
    trackBar.style.cssText = `
      width:100%;height:40px;background:#333;border-radius:20px;overflow:hidden;
      border:2px solid #555;position:relative;margin-bottom:20px;
    `;
    const trackFill = document.createElement('div');
    trackFill.id = 'kart-progress';
    trackFill.style.cssText = `
      height:100%;width:0%;background:linear-gradient(90deg,#ff6600,#ffcc00);
      border-radius:20px;transition:width 0.05s linear;
    `;
    trackBar.appendChild(trackFill);

    // Kart emoji on the track
    const kartIcon = document.createElement('div');
    kartIcon.id = 'kart-icon';
    kartIcon.style.cssText = `
      position:absolute;top:-6px;left:0%;font-size:32px;
      transition:left 0.05s linear;transform:translateX(-50%);
    `;
    kartIcon.textContent = '🏎️';
    trackBar.appendChild(kartIcon);
    trackArea.appendChild(trackBar);

    // Speed / time display
    const statsRow = document.createElement('div');
    statsRow.style.cssText = `display:flex;gap:30px;justify-content:center;margin-bottom:16px;`;

    const speedEl = document.createElement('div');
    speedEl.id = 'kart-speed';
    speedEl.style.cssText = `color:#ff6600;font-size:24px;font-weight:bold;`;
    speedEl.textContent = '0 km/h';

    const timeEl = document.createElement('div');
    timeEl.id = 'kart-time';
    timeEl.style.cssText = `color:#ccc;font-size:24px;`;
    timeEl.textContent = '0.00s';

    statsRow.appendChild(speedEl);
    statsRow.appendChild(timeEl);
    trackArea.appendChild(statsRow);

    // Countdown / message
    const msgEl = document.createElement('div');
    msgEl.id = 'kart-msg';
    msgEl.style.cssText = `
      color:#fff;font-size:48px;font-weight:bold;text-align:center;
      text-shadow:0 2px 12px rgba(255,100,0,0.6);min-height:60px;
    `;
    msgEl.textContent = '';
    trackArea.appendChild(msgEl);

    // Lap times list
    const lapTimesEl = document.createElement('div');
    lapTimesEl.id = 'kart-laptimes';
    lapTimesEl.style.cssText = `color:#aaa;font-size:14px;text-align:center;min-height:50px;margin-top:8px;`;
    trackArea.appendChild(lapTimesEl);

    container.appendChild(trackArea);

    // Hint bar
    const hints = document.createElement('div');
    hints.style.cssText = `
      position:relative;z-index:2;margin-top:16px;color:rgba(255,180,100,0.6);font-size:14px;text-align:center;
    `;
    hints.innerHTML = `Tap <strong style="color:#ff6600">[Space]</strong> rapidly to accelerate! &nbsp; Press <strong style="color:#ff6600">[Esc]</strong> to quit.`;
    container.appendChild(hints);

    // Results overlay
    const results = document.createElement('div');
    results.id = 'kart-results';
    results.style.cssText = `
      display:none;position:absolute;inset:0;background:rgba(10,10,10,0.94);
      flex-direction:column;align-items:center;justify-content:center;z-index:30;
      color:#fff;text-align:center;gap:12px;
    `;
    container.appendChild(results);

    if (!document.getElementById('kart-keyframes')) {
      const style = document.createElement('style');
      style.id = 'kart-keyframes';
      style.textContent = `
        @keyframes kartPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.15);} }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(container);
    this._container = container;
  }

  start() {
    this._active = true;
    this._lap = 0;
    this._lapTimes = [];
    this._elapsed = 0;
    this._progress = 0;
    this._speed = 0;
    this._counting = true;
    this._racing = false;
    this._finished = false;
    this._countdownLeft = 3;
    this._lastTime = null;

    const results = document.getElementById('kart-results');
    if (results) results.style.display = 'none';

    this._container.style.display = 'flex';
    this._updateDisplay();

    const msg = document.getElementById('kart-msg');
    if (msg) msg.textContent = '3';

    this._keyHandler = (e) => this._onKey(e);
    window.addEventListener('keydown', this._keyHandler);

    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  _loop(now) {
    if (!this._active) return;
    const delta = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
    this._lastTime = now;
    this._update(delta);
    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }

  _update(delta) {
    if (!this._active || this._finished) return;

    const msg = document.getElementById('kart-msg');

    // Countdown phase
    if (this._counting) {
      this._countdownLeft -= delta;
      if (this._countdownLeft > 0) {
        if (msg) msg.textContent = Math.ceil(this._countdownLeft).toString();
      } else {
        this._counting = false;
        this._racing = true;
        this._elapsed = 0;
        if (msg) { msg.textContent = 'GO!'; setTimeout(() => { if (msg) msg.textContent = ''; }, 600); }
      }
      return;
    }

    // Racing phase
    if (!this._racing) return;

    this._elapsed += delta;

    // Speed decays naturally — player must keep tapping Space
    this._speed = Math.max(0, this._speed - 120 * delta);

    // Progress along the lap
    this._progress += this._speed * delta * 0.4;

    if (this._progress >= 100) {
      // Completed a lap
      this._progress -= 100;
      this._lapTimes.push(parseFloat(this._elapsed.toFixed(2)));
      this._lap++;

      if (this._lap >= TOTAL_LAPS) {
        this._endRace();
        return;
      }
      this._elapsed = 0;
      if (msg) { msg.textContent = `Lap ${this._lap}!`; setTimeout(() => { if (msg) msg.textContent = ''; }, 800); }
    }

    this._updateDisplay();
  }

  _updateDisplay() {
    const lapEl = document.getElementById('kart-lap');
    if (lapEl) lapEl.textContent = `Lap ${Math.min(this._lap + 1, TOTAL_LAPS)} / ${TOTAL_LAPS}`;

    const fill = document.getElementById('kart-progress');
    if (fill) fill.style.width = `${Math.min(100, this._progress)}%`;

    const icon = document.getElementById('kart-icon');
    if (icon) icon.style.left = `${Math.min(98, this._progress)}%`;

    const speedEl = document.getElementById('kart-speed');
    if (speedEl) speedEl.textContent = `${Math.round(this._speed)} km/h`;

    const timeEl = document.getElementById('kart-time');
    if (timeEl) timeEl.textContent = `${this._elapsed.toFixed(2)}s`;

    const ltEl = document.getElementById('kart-laptimes');
    if (ltEl) {
      ltEl.textContent = this._lapTimes.map((t, i) => `Lap ${i + 1}: ${t}s`).join('  |  ');
    }
  }

  _onKey(e) {
    if (e.code === 'Escape') { this.stop(); return; }
    if (this._finished && e.code === 'Escape') { this.stop(); return; }

    if (!this._racing || this._finished) return;

    if (e.code === 'Space') {
      e.preventDefault();
      // Each tap boosts speed
      this._speed = Math.min(280, this._speed + 35);
    }
  }

  _endRace() {
    this._racing = false;
    this._finished = true;
    cancelAnimationFrame(this._frameId);

    const totalTime = this._lapTimes.reduce((a, b) => a + b, 0);
    const bestLap = Math.min(...this._lapTimes);

    // Record best time
    if (this._bestTime === 0 || totalTime < this._bestTime) {
      this._bestTime = totalTime;
      localStorage.setItem('island_kart_best', totalTime.toString());
    }

    // Score based on speed
    const score = Math.max(10, Math.round(300 / totalTime * 10));
    recordCompletion('kart', score);

    const results = document.getElementById('kart-results');
    if (results) {
      results.style.display = 'flex';

      let rating;
      if (totalTime < 15) rating = '🏆 Lightning Fast!';
      else if (totalTime < 25) rating = '⭐ Great Race!';
      else if (totalTime < 40) rating = '🏁 Solid Run!';
      else rating = '🐢 Keep Practising!';

      results.innerHTML = `
        <div style="font-size:52px;margin-bottom:6px;">🏎️</div>
        <div style="font-size:28px;font-weight:bold;color:#ff6600;margin-bottom:4px;">Race Complete!</div>
        <div style="font-size:20px;color:#ffd700;margin:8px 0;">Total: ${totalTime.toFixed(2)}s</div>
        <div style="font-size:16px;color:#aaa;">Best lap: ${bestLap.toFixed(2)}s</div>
        <div style="font-size:16px;color:#aaa;margin-bottom:8px;">${this._lapTimes.map((t, i) => `Lap ${i + 1}: ${t.toFixed(2)}s`).join(' &nbsp;|&nbsp; ')}</div>
        ${this._bestTime < totalTime ? `<div style="font-size:14px;color:#888;">Personal best: ${this._bestTime.toFixed(2)}s</div>` : `<div style="font-size:16px;color:#7bed9f;">🎉 New Personal Best!</div>`}
        <div style="font-size:24px;font-weight:bold;color:#fff;margin:8px 0;">${score} pts</div>
        <div style="font-size:18px;color:#ffcc00;margin-bottom:20px;">${rating}</div>
        <div style="font-size:14px;color:rgba(255,180,100,0.6);">Press <strong style="color:#ff6600;">[Esc]</strong> to leave the track</div>
      `;
    }
  }

  stop() {
    this._active = false;
    this._finished = true;
    this._racing = false;
    if (this._frameId) cancelAnimationFrame(this._frameId);
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._container) this._container.style.display = 'none';
  }

  get active() {
    return this._active;
  }
}
