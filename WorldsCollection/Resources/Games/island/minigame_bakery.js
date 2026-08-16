import { BAG, ITEMS } from './bag.js';
import { getDifficulty, recordCompletion } from './job_progression.js';

export class BakeryMinigame {
  constructor(scene, camera) {
    this._scene = scene;
    this._camera = camera;
    this._active = false;
    this._score = 0;
    this._highScore = 0;
    this._loavesBaked = 0;
    this._temperature = 0;
    this._baseTempSpeed = 0.12;
    this._tempSpeed = 0.12; // % per second
    this._phase = 'baking'; // 'baking' | 'result'
    this._resultTimer = 0;
    this._resultMessage = '';
    this._resultClass = '';
    this._animFrame = null;
    this._lastTime = null;
    this._overlay = null;
    this._keyHandler = null;
    this._buildUI();
  }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'bakery-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(10, 5, 0, 0.92)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      fontFamily: '"Courier New", Courier, monospace',
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: '#1a0e00',
      border: '4px solid #c86400',
      borderRadius: '12px',
      padding: '32px 40px',
      minWidth: '420px',
      boxShadow: '0 0 40px #c8640055, inset 0 0 20px #00000088',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
    });

    // Title
    const title = document.createElement('div');
    title.textContent = "MABEL'S BAKERY";
    Object.assign(title.style, {
      color: '#ffaa33',
      fontSize: '26px',
      fontWeight: 'bold',
      letterSpacing: '6px',
      textShadow: '0 0 12px #ff8800, 0 0 24px #ff4400',
    });

    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.textContent = '🍞 BREAD TIMING CHALLENGE 🍞';
    Object.assign(subtitle.style, {
      color: '#cc7722',
      fontSize: '13px',
      letterSpacing: '2px',
    });

    // Oven body
    const ovenBody = document.createElement('div');
    Object.assign(ovenBody.style, {
      background: '#2a1500',
      border: '3px solid #804010',
      borderRadius: '10px',
      padding: '16px 20px',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    });

    // Oven window
    const ovenWindowWrap = document.createElement('div');
    Object.assign(ovenWindowWrap.style, {
      display: 'flex',
      justifyContent: 'center',
    });
    const ovenWindow = document.createElement('div');
    Object.assign(ovenWindow.style, {
      width: '120px',
      height: '80px',
      background: '#0a0500',
      border: '3px solid #804010',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '36px',
      position: 'relative',
      overflow: 'hidden',
    });
    this._ovenWindow = ovenWindow;
    const ovenGlow = document.createElement('div');
    Object.assign(ovenGlow.style, {
      position: 'absolute',
      bottom: '0', left: '0', right: '0',
      height: '0%',
      background: 'linear-gradient(to top, #ff6600aa, transparent)',
      transition: 'height 0.1s',
    });
    this._ovenGlow = ovenGlow;
    const breadEmoji = document.createElement('div');
    breadEmoji.textContent = '🍞';
    breadEmoji.style.position = 'relative';
    breadEmoji.style.zIndex = '1';
    breadEmoji.style.fontSize = '40px';
    this._breadEmoji = breadEmoji;
    ovenWindow.appendChild(ovenGlow);
    ovenWindow.appendChild(breadEmoji);
    ovenWindowWrap.appendChild(ovenWindow);

    // Temperature label
    const tempLabel = document.createElement('div');
    tempLabel.textContent = 'TEMPERATURE';
    Object.assign(tempLabel.style, {
      color: '#cc7722',
      fontSize: '11px',
      letterSpacing: '3px',
      textAlign: 'center',
    });

    // Gauge track
    const gaugeTrack = document.createElement('div');
    Object.assign(gaugeTrack.style, {
      width: '100%',
      height: '28px',
      background: '#0a0500',
      border: '2px solid #804010',
      borderRadius: '4px',
      position: 'relative',
      overflow: 'hidden',
    });

    // Green zone marker (65-80%)
    const greenZone = document.createElement('div');
    Object.assign(greenZone.style, {
      position: 'absolute',
      left: '65%',
      width: '15%',
      top: '0', bottom: '0',
      background: '#00aa4433',
      borderLeft: '2px solid #00dd55',
      borderRight: '2px solid #00dd55',
    });
    const greenLabel = document.createElement('div');
    Object.assign(greenLabel.style, {
      position: 'absolute',
      left: '0', right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      textAlign: 'center',
      color: '#00dd55',
      fontSize: '8px',
      fontWeight: 'bold',
      letterSpacing: '1px',
    });
    greenLabel.textContent = 'PERFECT';
    greenZone.appendChild(greenLabel);

    // Gauge fill
    const gaugeFill = document.createElement('div');
    Object.assign(gaugeFill.style, {
      position: 'absolute',
      left: '0', top: '0', bottom: '0',
      width: '0%',
      background: 'linear-gradient(to right, #cc4400, #ff6600, #ffcc00)',
      borderRadius: '2px',
      transition: 'background 0.1s',
    });
    this._gaugeFill = gaugeFill;

    // Tick marks
    for (let i = 1; i < 10; i++) {
      const tick = document.createElement('div');
      Object.assign(tick.style, {
        position: 'absolute',
        left: `${i * 10}%`,
        top: '0', bottom: '0',
        width: '1px',
        background: '#80401044',
      });
      gaugeTrack.appendChild(tick);
    }

    gaugeTrack.appendChild(greenZone);
    gaugeTrack.appendChild(gaugeFill);

    // Gauge percent label
    const gaugePct = document.createElement('div');
    Object.assign(gaugePct.style, {
      textAlign: 'right',
      color: '#cc7722',
      fontSize: '11px',
    });
    this._gaugePct = gaugePct;

    ovenBody.appendChild(ovenWindowWrap);
    ovenBody.appendChild(tempLabel);
    ovenBody.appendChild(gaugeTrack);
    ovenBody.appendChild(gaugePct);

    // Result message
    const resultMsg = document.createElement('div');
    Object.assign(resultMsg.style, {
      minHeight: '36px',
      fontSize: '22px',
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: '2px',
      textShadow: '0 0 10px currentColor',
      transition: 'opacity 0.3s',
    });
    this._resultMsg = resultMsg;

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
        background: '#0a0500',
        border: '2px solid #804010',
        borderRadius: '6px',
        padding: '8px 14px',
        textAlign: 'center',
        minWidth: '80px',
      });
      const lbl = document.createElement('div');
      lbl.textContent = label;
      Object.assign(lbl.style, {
        color: '#cc7722',
        fontSize: '9px',
        letterSpacing: '2px',
        marginBottom: '4px',
      });
      const val = document.createElement('div');
      Object.assign(val.style, {
        color: '#ffaa33',
        fontSize: '22px',
        fontWeight: 'bold',
      });
      box.appendChild(lbl);
      box.appendChild(val);
      return { box, val };
    };

    const scoreStat = makeStatBox('SCORE');
    this._scoreVal = scoreStat.val;
    const highStat = makeStatBox('BEST');
    this._highVal = highStat.val;
    const loavesStat = makeStatBox('LOAVES');
    this._loavesVal = loavesStat.val;

    statsRow.appendChild(scoreStat.box);
    statsRow.appendChild(highStat.box);
    statsRow.appendChild(loavesStat.box);

    // Instructions
    const instructions = document.createElement('div');
    Object.assign(instructions.style, {
      color: '#806030',
      fontSize: '11px',
      letterSpacing: '2px',
      textAlign: 'center',
    });
    this._instructions = instructions;

    // ESC hint
    const escHint = document.createElement('div');
    escHint.textContent = '[ ESC ] LEAVE BAKERY';
    Object.assign(escHint.style, {
      color: '#5a3a10',
      fontSize: '10px',
      letterSpacing: '3px',
      marginTop: '4px',
    });

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(ovenBody);
    panel.appendChild(resultMsg);
    panel.appendChild(statsRow);
    panel.appendChild(instructions);
    panel.appendChild(escHint);
    overlay.appendChild(panel);

    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  _updateStats() {
    this._scoreVal.textContent = this._score;
    this._highVal.textContent = this._highScore;
    this._loavesVal.textContent = this._loavesBaked;
  }

  _setInstruction(text) {
    this._instructions.textContent = text;
  }

  _showResult(msg, color) {
    this._resultMsg.textContent = msg;
    this._resultMsg.style.color = color;
  }

  _clearResult() {
    this._resultMsg.textContent = '';
  }

  get active() {
    return this._active;
  }

  start() {
    this._active = true;
    this._temperature = 0;
    this._phase = 'baking';
    this._resultTimer = 0;
    // CAD-397: difficulty progression — temperature rises faster
    const diff = getDifficulty('bakery');
    this._tempSpeed = this._baseTempSpeed * diff.speedMult;
    this._clearResult();
    this._updateStats();
    this._setInstruction('[ SPACE ] BAKE AT THE RIGHT MOMENT!');
    this._overlay.style.display = 'flex';

    this._keyHandler = (e) => {
      if (!this._active) return;
      if (e.code === 'Escape') {
        this.stop();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (this._phase === 'baking') {
          this._pressBake();
        }
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  _pressBake() {
    const pct = this._temperature;
    let msg, color, points;
    if (pct < 65) {
      msg = 'Underbaked 😬';
      color = '#ffcc00';
      points = 3;
    } else if (pct <= 80) {
      msg = 'Perfect Bake! 🍞';
      color = '#00dd55';
      points = 10;
    } else {
      msg = 'Burnt! 🔥';
      color = '#ff4422';
      points = 0;
    }

    this._score += points;
    if (this._score > this._highScore) this._highScore = this._score;
    this._loavesBaked += 1;
    if (points > 0) {
      BAG.add(ITEMS.bread, 1);
      // CAD-398: record completion for rewards
      recordCompletion('bakery', this._score);
    }
    this._phase = 'result';
    this._resultTimer = 2.0;
    this._showResult(msg + (points > 0 ? `  +${points}` : ''), color);
    this._setInstruction('');
    this._updateStats();
  }

  update(delta) {
    if (!this._active) return;

    if (this._phase === 'result') {
      this._resultTimer -= delta;
      if (this._resultTimer <= 0) {
        this._temperature = 0;
        this._phase = 'baking';
        this._clearResult();
        this._setInstruction('[ SPACE ] BAKE AT THE RIGHT MOMENT!');
      }
      return;
    }

    // Advance temperature
    this._temperature += this._tempSpeed * delta * 100;
    if (this._temperature >= 100) {
      this._temperature = 100;
      // Auto-burnt if they didn't press in time
      this._pressBake();
      return;
    }

    const pct = this._temperature;
    this._gaugeFill.style.width = `${pct}%`;
    this._gaugePct.textContent = `${Math.round(pct)}°C`;

    // Oven glow based on temperature
    this._ovenGlow.style.height = `${pct * 0.7}%`;

    // Colour the fill based on zone
    if (pct < 65) {
      this._gaugeFill.style.background = 'linear-gradient(to right, #cc4400, #ff6600)';
    } else if (pct <= 80) {
      this._gaugeFill.style.background = 'linear-gradient(to right, #cc4400, #ff6600, #00dd55)';
    } else {
      this._gaugeFill.style.background = 'linear-gradient(to right, #cc4400, #ff4400, #ff0000)';
    }

    // Bread emoji reacts
    if (pct < 65) {
      this._breadEmoji.textContent = '🍞';
    } else if (pct <= 80) {
      this._breadEmoji.textContent = '😋';
    } else {
      this._breadEmoji.textContent = '💀';
    }
  }

  stop() {
    this._active = false;
    this._overlay.style.display = 'none';
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }
}
