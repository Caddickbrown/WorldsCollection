/**
 * Sleep Mechanic — CAD-443
 *
 * Player home with a bed. Pressing E near the bed triggers a
 * fade-to-black transition that advances time to 6:00 AM next morning.
 * Adds an energy/stamina bonus after sleeping.
 */

// ---------------------------------------------------------------------------
// Bed location — the player's home, south of Town Square
// ---------------------------------------------------------------------------
export const BED_LOCATION = { x: -30, z: -20, radius: 5 };

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _sleeping = false;
let _fadeProgress = 0;    // 0 = clear, 1 = black
let _phase = 'idle';      // 'idle' | 'fadein' | 'hold' | 'fadeout'
let _phaseTimer = 0;
let _overlayEl = null;
let _textEl = null;
let _onWakeCallback = null; // called with targetHour=6 when waking

// ---------------------------------------------------------------------------
// Overlay DOM
// ---------------------------------------------------------------------------
function _buildOverlay() {
  const el = document.createElement('div');
  el.id = 'sleep-overlay';
  Object.assign(el.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: '#000',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '9998',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'none',
  });

  const text = document.createElement('div');
  text.id = 'sleep-text';
  Object.assign(text.style, {
    color: '#ffeaa7',
    fontFamily: "'Instrument Serif', 'Georgia', serif",
    fontSize: '28px',
    fontStyle: 'italic',
    letterSpacing: '3px',
    opacity: '0',
    transition: 'opacity 0.8s',
    textAlign: 'center',
  });
  text.textContent = 'Sweet dreams...';

  const subtext = document.createElement('div');
  subtext.id = 'sleep-subtext';
  Object.assign(subtext.style, {
    color: '#a0a0c0',
    fontFamily: "'Work Sans', system-ui, sans-serif",
    fontSize: '14px',
    letterSpacing: '2px',
    marginTop: '10px',
    opacity: '0',
    transition: 'opacity 0.8s',
  });
  subtext.textContent = 'Morning will come soon';

  el.appendChild(text);
  el.appendChild(subtext);
  document.body.appendChild(el);
  _overlayEl = el;
  _textEl = text;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns true if the player is near the bed. */
export function isNearBed(playerPos) {
  const dx = playerPos.x - BED_LOCATION.x;
  const dz = playerPos.z - BED_LOCATION.z;
  return Math.sqrt(dx*dx + dz*dz) < BED_LOCATION.radius;
}

/** Begin sleep sequence. onWake(targetHour) called when done. */
export function sleep(onWake) {
  if (_sleeping) return;
  _sleeping = true;
  _phase = 'fadein';
  _phaseTimer = 0;
  _fadeProgress = 0;
  _onWakeCallback = onWake;
  if (_overlayEl) _overlayEl.style.pointerEvents = 'all';
}

export function isSleeping() {
  return _sleeping;
}

/**
 * Update the sleep sequence each frame.
 * @param {number} delta - seconds elapsed
 */
export function updateSleep(delta) {
  if (!_sleeping || !_overlayEl) return;

  if (_phase === 'fadein') {
    _phaseTimer += delta;
    _fadeProgress = Math.min(_phaseTimer / 1.2, 1);
    _overlayEl.style.opacity = _fadeProgress.toString();
    if (_fadeProgress >= 1) {
      _phase = 'hold';
      _phaseTimer = 0;
      // Show text
      if (_textEl) {
        _textEl.style.opacity = '1';
        const sub = document.getElementById('sleep-subtext');
        if (sub) sub.style.opacity = '1';
      }
    }
  } else if (_phase === 'hold') {
    _phaseTimer += delta;
    if (_phaseTimer >= 2.5) {
      _phase = 'fadeout';
      _phaseTimer = 0;
      if (_textEl) {
        _textEl.style.opacity = '0';
        const sub = document.getElementById('sleep-subtext');
        if (sub) sub.style.opacity = '0';
      }
      // Trigger the time skip — advance to 6am
      if (_onWakeCallback) _onWakeCallback(6);
    }
  } else if (_phase === 'fadeout') {
    _phaseTimer += delta;
    _fadeProgress = Math.max(1 - _phaseTimer / 1.5, 0);
    _overlayEl.style.opacity = _fadeProgress.toString();
    if (_fadeProgress <= 0) {
      _phase = 'idle';
      _sleeping = false;
      if (_overlayEl) _overlayEl.style.pointerEvents = 'none';
    }
  }
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------
export function initSleep() {
  _buildOverlay();
}
