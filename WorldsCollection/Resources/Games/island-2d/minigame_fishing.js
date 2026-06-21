import { BAG, ITEMS } from './bag.js';
import { getDifficulty, recordCompletion } from './job_progression.js';

export class FishingMinigame {
  constructor(scene, camera) {
    this._scene = scene;
    this._camera = camera;
    this._active = false;
    this._score = 0;
    this._fishCaught = 0;
    this._difficulty = getDifficulty('fishing');
    this._phase = 'idle'; // idle | casting | waiting | catching | result
    this._castPower = 0;
    this._castHeld = false;
    this._waitTimer = 0;
    this._catchTimer = 0;
    this._catchPresses = 0;
    this._resultTimer = 0;
    this._lastResult = null;
    this._floatBob = 0;
    this._floatBobDir = 1;
    this._biteFlash = 0;
    this._lineLength = 0;
    this._targetLineLength = 0.5;
    this._flashText = '';
    this._flashTimer = 0;
    this._overlay = null;
    this._canvas = null;
    this._ctx = null;
    this._keyDownHandler = null;
    this._keyUpHandler = null;
    this._buildUI();
  }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'fishing-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0, 10, 30, 0.93)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      fontFamily: '"Courier New", Courier, monospace',
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    });

    // Title
    const title = document.createElement('div');
    title.textContent = '🎣 DOCK FISHING';
    Object.assign(title.style, {
      color: '#44ccff',
      fontSize: '24px',
      fontWeight: 'bold',
      letterSpacing: '6px',
      textShadow: '0 0 12px #0088ff, 0 0 28px #0044ff',
    });

    // Canvas for fishing scene
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    Object.assign(canvas.style, {
      border: '3px solid #0055aa',
      borderRadius: '10px',
      boxShadow: '0 0 30px #0044ff44',
      display: 'block',
    });
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');

    // Power bar (casting)
    const powerWrap = document.createElement('div');
    Object.assign(powerWrap.style, {
      width: '500px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    });
    const powerLabel = document.createElement('div');
    Object.assign(powerLabel.style, {
      color: '#44aaff',
      fontSize: '10px',
      letterSpacing: '3px',
      textAlign: 'center',
    });
    this._powerLabel = powerLabel;

    const powerTrack = document.createElement('div');
    Object.assign(powerTrack.style, {
      width: '100%',
      height: '20px',
      background: '#001030',
      border: '2px solid #0055aa',
      borderRadius: '4px',
      position: 'relative',
      overflow: 'hidden',
    });
    const powerFill = document.createElement('div');
    Object.assign(powerFill.style, {
      position: 'absolute',
      left: '0', top: '0', bottom: '0',
      width: '0%',
      background: 'linear-gradient(to right, #0055ff, #00ccff, #ffffff)',
      borderRadius: '2px',
    });
    this._powerFill = powerFill;
    powerTrack.appendChild(powerFill);
    powerWrap.appendChild(powerLabel);
    powerWrap.appendChild(powerTrack);

    // Catch bar (rapid press)
    const catchWrap = document.createElement('div');
    Object.assign(catchWrap.style, {
      width: '500px',
      display: 'none',
      flexDirection: 'column',
      gap: '4px',
    });
    const catchLabel = document.createElement('div');
    Object.assign(catchLabel.style, {
      color: '#ffcc00',
      fontSize: '10px',
      letterSpacing: '3px',
      textAlign: 'center',
    });
    this._catchLabel = catchLabel;
    const catchTrack = document.createElement('div');
    Object.assign(catchTrack.style, {
      width: '100%',
      height: '20px',
      background: '#001030',
      border: '2px solid #aa5500',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    });
    const catchFill = document.createElement('div');
    Object.assign(catchFill.style, {
      position: 'absolute',
      left: '0', top: '0', bottom: '0',
      width: '0%',
      background: 'linear-gradient(to right, #ff6600, #ffcc00, #ffffff)',
      borderRadius: '2px',
      transition: 'width 0.1s',
    });
    this._catchFill = catchFill;
    catchTrack.appendChild(catchFill);
    catchWrap.appendChild(catchLabel);
    catchWrap.appendChild(catchTrack);
    this._catchWrap = catchWrap;

    // Status / result message
    const statusMsg = document.createElement('div');
    Object.assign(statusMsg.style, {
      minHeight: '32px',
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: '3px',
      color: '#44ccff',
      textShadow: '0 0 8px currentColor',
    });
    this._statusMsg = statusMsg;

    // Stats row
    const statsRow = document.createElement('div');
    Object.assign(statsRow.style, {
      display: 'flex',
      gap: '24px',
      justifyContent: 'center',
    });

    const makeStatBox = (label) => {
      const box = document.createElement('div');
      Object.assign(box.style, {
        background: '#001030',
        border: '2px solid #0055aa',
        borderRadius: '6px',
        padding: '8px 18px',
        textAlign: 'center',
        minWidth: '90px',
      });
      const lbl = document.createElement('div');
      lbl.textContent = label;
      Object.assign(lbl.style, {
        color: '#4488cc',
        fontSize: '9px',
        letterSpacing: '2px',
        marginBottom: '4px',
      });
      const val = document.createElement('div');
      Object.assign(val.style, {
        color: '#44ccff',
        fontSize: '22px',
        fontWeight: 'bold',
      });
      box.appendChild(lbl);
      box.appendChild(val);
      return { box, val };
    };

    const fishStat = makeStatBox('CAUGHT TODAY');
    this._fishVal = fishStat.val;
    const scoreStat = makeStatBox('SCORE');
    this._scoreVal = scoreStat.val;
    statsRow.appendChild(fishStat.box);
    statsRow.appendChild(scoreStat.box);

    // ESC hint
    const escHint = document.createElement('div');
    escHint.textContent = '[ ESC ] LEAVE DOCK';
    Object.assign(escHint.style, {
      color: '#224466',
      fontSize: '10px',
      letterSpacing: '3px',
    });

    panel.appendChild(title);
    panel.appendChild(canvas);
    panel.appendChild(powerWrap);
    panel.appendChild(catchWrap);
    panel.appendChild(statusMsg);
    panel.appendChild(statsRow);
    panel.appendChild(escHint);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  get active() {
    return this._active;
  }

  start() {
    this._active = true;
    this._phase = 'casting';
    this._castPower = 0;
    this._castHeld = false;
    this._lineLength = 0;
    this._targetLineLength = 0.5;
    this._biteFlash = 0;
    this._floatBob = 0;
    this._floatBobDir = 1;
    this._flashText = '';
    this._flashTimer = 0;
    this._difficulty = getDifficulty('fishing'); // CAD-397: refresh difficulty
    this._overlay.style.display = 'flex';
    this._updateStats();
    this._setStatus('Hold [ SPACE ] to charge cast, release to cast!');
    this._powerLabel.textContent = 'CAST POWER';
    this._catchWrap.style.display = 'none';

    this._keyDownHandler = (e) => {
      if (!this._active) return;
      if (e.code === 'Escape') {
        this.stop();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this._onSpaceDown();
      }
    };
    this._keyUpHandler = (e) => {
      if (!this._active) return;
      if (e.code === 'Space') {
        this._onSpaceUp();
      }
    };
    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('keyup', this._keyUpHandler);
  }

  _onSpaceDown() {
    if (this._phase === 'casting') {
      this._castHeld = true;
    } else if (this._phase === 'catching') {
      this._catchPresses += 1;
      const target = this._catchTarget || 5;
      this._catchFill.style.width = `${(this._catchPresses / target) * 100}%`;
      this._catchLabel.textContent = `REEL IT IN! ${target - this._catchPresses} MORE PULLS!`;
      if (this._catchPresses >= target) {
        this._reelSuccess();
      }
    }
  }

  _onSpaceUp() {
    if (this._phase === 'casting' && this._castHeld) {
      this._castHeld = false;
      this._cast();
    }
  }

  _cast() {
    const power = this._castPower;
    this._targetLineLength = 0.3 + power * 0.65;
    this._lineLength = 0.05;
    this._phase = 'waiting';
    const waitTime = 3 + Math.random() * 5;
    this._waitTimer = waitTime;
    this._castPower = 0;
    this._powerFill.style.width = '0%';
    this._catchWrap.style.display = 'none';
    const castPct = Math.round(power * 100);
    this._setStatus(`Cast ${castPct}% power! Waiting for a bite...`);
    this._flashText = '';
  }

  _bite() {
    this._phase = 'catching';
    this._catchPresses = 0;
    // CAD-397: less time at higher difficulty
    this._catchTimer = 2.0 * this._difficulty.timeMult;
    // CAD-397: more presses needed at higher difficulty
    this._catchTarget = Math.ceil(5 * this._difficulty.targetMult);
    this._catchFill.style.width = '0%';
    this._catchWrap.style.display = 'flex';
    this._catchLabel.textContent = `REEL IT IN! ${this._catchTarget} MORE PULLS!`;
    this._biteFlash = 0.5;
    this._flashText = 'BITE!';
    this._flashTimer = 0.8;
    this._setStatus('');
  }

  _reelSuccess() {
    this._phase = 'result';
    this._resultTimer = 2.5;
    const fish = this._rollFish();
    this._lastResult = fish;
    this._score += fish.points;
    this._fishCaught += 1;
    this._updateStats();
    this._catchWrap.style.display = 'none';
    this._flashText = fish.emoji;
    this._flashTimer = 2.5;
    this._setStatus(`${fish.name}! +${fish.points} pts`);
    this._statusMsg.style.color = fish.color;
    BAG.add(ITEMS.fish, 1);
    // CAD-398: record completion for progression rewards
    recordCompletion('fishing', this._score);
  }

  _reelFail() {
    this._phase = 'casting';
    this._lineLength = 0;
    this._catchWrap.style.display = 'none';
    this._flashText = '💨';
    this._flashTimer = 1.0;
    this._setStatus('It got away! Hold [ SPACE ] to cast again.');
    this._statusMsg.style.color = '#ff6644';
    this._powerLabel.textContent = 'CAST POWER';
  }

  _rollFish() {
    const r = Math.random();
    if (r < 0.03) return { name: 'RARE GOLDEN FISH', emoji: '✨🐟✨', points: 50, color: '#ffd700' };
    if (r < 0.15) return { name: 'TUNA', emoji: '🐠', points: 25, color: '#ff6644' };
    if (r < 0.45) return { name: 'BASS', emoji: '🐟', points: 12, color: '#44ccff' };
    return { name: 'MACKEREL', emoji: '🐡', points: 5, color: '#88ddaa' };
  }

  _setStatus(text) {
    this._statusMsg.textContent = text;
    this._statusMsg.style.color = '#44ccff';
  }

  _updateStats() {
    this._fishVal.textContent = this._fishCaught;
    this._scoreVal.textContent = this._score;
  }

  update(delta) {
    if (!this._active) return;

    // Flash timer
    if (this._flashTimer > 0) {
      this._flashTimer -= delta;
      if (this._flashTimer <= 0) this._flashText = '';
    }

    // Bite flash
    if (this._biteFlash > 0) {
      this._biteFlash -= delta;
    }

    // Phase logic
    if (this._phase === 'casting') {
      if (this._castHeld) {
        this._castPower = Math.min(1, this._castPower + delta * 0.7);
        this._powerFill.style.width = `${this._castPower * 100}%`;
        this._powerLabel.textContent = `CAST POWER — ${Math.round(this._castPower * 100)}%`;
      }
    } else if (this._phase === 'waiting') {
      // Line extends toward target
      if (this._lineLength < this._targetLineLength) {
        this._lineLength = Math.min(this._targetLineLength, this._lineLength + delta * 1.2);
      }
      // Float bob
      this._floatBob += this._floatBobDir * delta * 1.8;
      if (this._floatBob > 1) this._floatBobDir = -1;
      if (this._floatBob < 0) this._floatBobDir = 1;
      // Wait for bite
      this._waitTimer -= delta;
      if (this._waitTimer <= 0) {
        this._bite();
      }
    } else if (this._phase === 'catching') {
      this._catchTimer -= delta;
      const timeLeft = Math.max(0, this._catchTimer);
      const target = this._catchTarget || 5;
      this._catchLabel.textContent = `REEL IT IN! ${Math.max(0, target - this._catchPresses)} MORE PULLS! (${timeLeft.toFixed(1)}s)`;
      // Dramatic float dip
      this._floatBob = -0.5;
      if (this._catchTimer <= 0) {
        this._reelFail();
      }
    } else if (this._phase === 'result') {
      this._resultTimer -= delta;
      if (this._resultTimer <= 0) {
        this._phase = 'casting';
        this._lineLength = 0;
        this._castPower = 0;
        this._powerFill.style.width = '0%';
        this._powerLabel.textContent = 'CAST POWER';
        this._setStatus('Hold [ SPACE ] to charge cast, release to cast!');
        this._flashText = '';
      }
    }

    this._drawScene();
  }

  _drawScene() {
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    sky.addColorStop(0, '#050a1a');
    sky.addColorStop(1, '#0a1f3a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const stars = [
      [30, 20], [80, 45], [140, 15], [200, 35], [260, 10],
      [320, 28], [380, 18], [440, 40], [470, 12], [110, 50],
    ];
    for (const [sx, sy] of stars) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath();
    ctx.arc(420, 38, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a1f3a';
    ctx.beginPath();
    ctx.arc(427, 33, 16, 0, Math.PI * 2);
    ctx.fill();

    // Water gradient
    const waterTop = H * 0.52;
    const water = ctx.createLinearGradient(0, waterTop, 0, H);
    water.addColorStop(0, '#0a2244');
    water.addColorStop(1, '#050f22');
    ctx.fillStyle = water;
    ctx.fillRect(0, waterTop, W, H - waterTop);

    // Water shimmer lines
    ctx.strokeStyle = 'rgba(100,180,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const wy = waterTop + 20 + i * 30;
      const wox = (Date.now() * 0.0003 + i * 0.7) % 1;
      ctx.beginPath();
      ctx.moveTo(wox * W, wy);
      ctx.lineTo(wox * W + 80, wy);
      ctx.stroke();
    }

    // Horizon glow
    const glow = ctx.createLinearGradient(0, waterTop - 10, 0, waterTop + 20);
    glow.addColorStop(0, 'rgba(30,100,180,0.0)');
    glow.addColorStop(0.5, 'rgba(30,100,180,0.18)');
    glow.addColorStop(1, 'rgba(30,100,180,0.0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, waterTop - 10, W, 30);

    // Dock
    ctx.fillStyle = '#4a2e10';
    ctx.fillRect(0, H * 0.5 - 12, 120, 20);
    // Dock planks
    ctx.strokeStyle = '#3a2008';
    ctx.lineWidth = 1.5;
    for (let pi = 10; pi < 120; pi += 18) {
      ctx.beginPath();
      ctx.moveTo(pi, H * 0.5 - 12);
      ctx.lineTo(pi, H * 0.5 + 8);
      ctx.stroke();
    }
    // Dock posts
    ctx.fillStyle = '#3a2008';
    ctx.fillRect(20, H * 0.5 + 8, 8, 30);
    ctx.fillRect(80, H * 0.5 + 8, 8, 30);

    // Fishing rod — from dock edge
    const rodBaseX = 100;
    const rodBaseY = H * 0.5 - 8;
    const rodTipX = 180;
    const rodTipY = H * 0.5 - 90;

    ctx.strokeStyle = '#8a5c20';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rodBaseX, rodBaseY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();

    // Rod guide rings
    ctx.strokeStyle = '#ccaa44';
    ctx.lineWidth = 2;
    for (let ri = 0; ri < 3; ri++) {
      const t = (ri + 1) / 4;
      const gx = rodBaseX + (rodTipX - rodBaseX) * t;
      const gy = rodBaseY + (rodTipY - rodBaseY) * t;
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fishing line and float
    if (this._phase !== 'casting' || this._lineLength > 0) {
      const lineLen = this._lineLength;

      // Float position based on cast power/target
      const horizDist = lineLen * (W - rodTipX - 20);
      const floatX = rodTipX + horizDist;
      const waterY = waterTop + 8;

      // Bob animation
      const bobOffset = this._phase === 'catching' ? -10 : Math.sin(this._floatBob * Math.PI) * 5 - 3;
      const floatY = waterY + bobOffset;

      // Draw line from tip to float
      ctx.strokeStyle = '#ccddff88';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);

      // Catenary-ish curve
      const midX = (rodTipX + floatX) / 2;
      const midY = Math.max(rodTipY, floatY) + 20;
      ctx.quadraticCurveTo(midX, midY, floatX, floatY);
      ctx.stroke();

      // Float
      const floatGlow = this._biteFlash > 0 ? `rgba(255,60,0,${this._biteFlash * 2})` : 'rgba(255,80,0,0)';
      if (this._biteFlash > 0) {
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 20;
      }

      // Float body
      ctx.fillStyle = '#dd2200';
      ctx.beginPath();
      ctx.ellipse(floatX, floatY + 4, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Float top (white)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(floatX, floatY - 4, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Underwater line (if line extends deep)
      if (lineLen > 0.1) {
        ctx.strokeStyle = '#ccddff44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(floatX, floatY + 10);
        ctx.lineTo(floatX + 5, floatY + 40);
        ctx.stroke();

        // Hook
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(floatX + 5, floatY + 44, 5, Math.PI * 0.1, Math.PI * 1.1);
        ctx.stroke();
      }
    }

    // Flash text (BITE!, emoji, etc.)
    if (this._flashText && this._flashTimer > 0) {
      const alpha = Math.min(1, this._flashTimer * 2);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 36px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (this._flashText === 'BITE!') {
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        // Bounce scale
        const scale = 1 + Math.sin(this._flashTimer * 20) * 0.1;
        ctx.save();
        ctx.translate(W / 2, H / 2 - 20);
        ctx.scale(scale, scale);
        ctx.fillText('BITE!', 0, 0);
        ctx.restore();
      } else {
        ctx.font = '48px serif';
        ctx.shadowBlur = 0;
        ctx.fillText(this._flashText, W / 2, H / 2 - 10);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Phase-specific overlays
    if (this._phase === 'casting' && !this._castHeld && this._lineLength === 0) {
      ctx.fillStyle = 'rgba(0,20,60,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#4488ff';
      ctx.font = '14px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOLD [SPACE] TO CHARGE — RELEASE TO CAST', W / 2, H / 2);
    }

    // Caught fish result display
    if (this._phase === 'result' && this._lastResult) {
      ctx.fillStyle = `rgba(0,0,0,0.55)`;
      ctx.fillRect(W / 2 - 140, H / 2 - 40, 280, 80);
      ctx.strokeStyle = this._lastResult.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - 140, H / 2 - 40, 280, 80);
      ctx.fillStyle = this._lastResult.color;
      ctx.font = 'bold 20px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this._lastResult.name}!`, W / 2, H / 2 - 12);
      ctx.font = '14px "Courier New"';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`+${this._lastResult.points} points`, W / 2, H / 2 + 14);
    }
  }

  stop() {
    this._active = false;
    this._overlay.style.display = 'none';
    if (this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
      this._keyDownHandler = null;
    }
    if (this._keyUpHandler) {
      window.removeEventListener('keyup', this._keyUpHandler);
      this._keyUpHandler = null;
    }
  }
}
