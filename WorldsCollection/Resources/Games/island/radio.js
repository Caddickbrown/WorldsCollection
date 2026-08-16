/**
 * Radio Station — CAD-447
 *
 * In-game radio overlay: tune in for island weather, event announcements,
 * and NPC shout-outs. Triggered by pressing R near a boombox or dedicated
 * toggle. Updates content based on time of day and active events.
 */

// ---------------------------------------------------------------------------
// Station identity
// ---------------------------------------------------------------------------
const STATION_NAME = 'Island FM 88.8';
const STATION_TAGLINE = 'The Sound of the Island';

// ---------------------------------------------------------------------------
// Content pools
// ---------------------------------------------------------------------------
const WEATHER_REPORTS = [
  'Sunny skies all morning — perfect for a walk to the hilltop.',
  "Light sea breeze from the south. Great sailing conditions at the dock.",
  "Overcast with a chance of showers this afternoon. Grab a jacket!",
  "Clear blue sky today. The sea glass will be sparkling on South Beach.",
  "Warm and calm — ideal for beachcombing along the shore.",
  "Morning mist over the farm is clearing up. Beautiful day ahead.",
  "Breezy conditions near the lighthouse. Lena says all lights are on.",
];

const STORM_WEATHER = [
  "Storm warning in effect! Strong winds and heavy rain. Stay indoors if possible.",
  "Rough seas reported at the harbour. All boats should remain moored.",
  "Storm conditions continue. Captain Reed has secured the fleet.",
];

const SHOUTOUTS = [
  "A big shout-out to Mabel at the bakery — her sourdough sold out before noon!",
  "Gus wants everyone to know the post is running on time this week. Well done, Gus!",
  "Fern sends her thanks to everyone who helped at the harvest festival.",
  "Jin spotted a rare moth near the forest last night — if you see it, don't touch!",
  "Petra's new mural is up on the workshop wall. Absolutely stunning.",
  "Old Will says the hilltop sunset was the finest he's seen in forty years.",
  "Lena reports the lighthouse is running perfectly. Fair winds to all sailors.",
  "Kai sends greetings from South Beach — the surf is up!",
  "Clara has new arrivals at the library. Come browse this week.",
  "Otto finished repairs on the windmill. Power is flowing again!",
  "Barney's honey harvest is in — stop by the farm if you'd like a jar.",
  "Rosa sends birthday wishes to everyone celebrating this week.",
];

const MUSIC_SEGMENTS = [
  "Up next: a relaxing acoustic set to carry you through the afternoon.",
  "Now playing: our Sunday morning folk hour.",
  "Listener request — a song from across the water, dedicated to someone special.",
  "Sea shanty hour is coming up at two — call in your favourites!",
  "Tonight's sunset session starts at six. Tune in from the hilltop.",
];

const COMMUNITY_NOTICES = [
  "Market Day is coming up. All vendors, register at Town Hall by Friday.",
  "The community garden needs volunteers on Saturday morning.",
  "Lost: one wicker basket near the docks. Please return to Mabel at the bakery.",
  "Reminder: the book swap at the library is every Thursday.",
  "The Anchor is hosting a quiz night. Teams of four, sign up at the bar.",
  "Nature walk with Jin — meet at the forest path, 8am Sunday.",
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _overlayEl = null;
let _open = false;
let _contentTimer = 0;
const CONTENT_INTERVAL = 12; // seconds between content rotation
let _currentSegment = null;

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------
function _pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _generateBroadcast(gameHour, isStorm, isMarket) {
  const segments = [];

  // Always open with the station ID and weather
  const weather = isStorm
    ? _pick(STORM_WEATHER)
    : _pick(WEATHER_REPORTS);
  segments.push({ icon: '🌤️', text: weather, label: 'WEATHER' });

  // NPC shout-out
  segments.push({ icon: '📢', text: _pick(SHOUTOUTS), label: 'SHOUT-OUT' });

  // Event notice
  if (isMarket) {
    segments.push({ icon: '🛒', text: 'Market Day is on today in Town Square! Browse stalls and meet islanders.', label: 'EVENT' });
  } else {
    segments.push({ icon: '📋', text: _pick(COMMUNITY_NOTICES), label: 'NOTICE' });
  }

  // Time-based music segment
  const hr = ((gameHour % 24) + 24) % 24;
  let musicNote = '';
  if (hr >= 6 && hr < 9) musicNote = 'Morning show — good day, island!';
  else if (hr >= 9 && hr < 12) musicNote = 'Mid-morning mix — keep it easy.';
  else if (hr >= 12 && hr < 14) musicNote = 'Lunchtime classics on Island FM.';
  else if (hr >= 14 && hr < 17) musicNote = 'Afternoon session — wind down gently.';
  else if (hr >= 17 && hr < 20) musicNote = 'Evening show — the day is golden.';
  else musicNote = 'Late night — quiet music for dreamers.';

  segments.push({ icon: '🎵', text: musicNote + ' ' + _pick(MUSIC_SEGMENTS), label: 'MUSIC' });

  return segments;
}

// ---------------------------------------------------------------------------
// DOM overlay
// ---------------------------------------------------------------------------
function _buildOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'radio-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    width: '300px',
    background: 'rgba(5, 8, 18, 0.96)',
    border: '2px solid #3a5a8a',
    borderRadius: '12px',
    padding: '16px 18px',
    display: 'none',
    flexDirection: 'column',
    gap: '10px',
    zIndex: '9995',
    fontFamily: "'Work Sans', system-ui, sans-serif",
    backdropFilter: 'blur(8px)',
    boxShadow: '0 0 30px rgba(74, 130, 200, 0.15)',
    pointerEvents: 'none',
  });

  // Header
  const header = document.createElement('div');
  Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: '8px' });

  const icon = document.createElement('div');
  icon.textContent = '📻';
  icon.style.fontSize = '18px';

  const nameEl = document.createElement('div');
  Object.assign(nameEl.style, { flex: '1' });
  const stationName = document.createElement('div');
  stationName.textContent = STATION_NAME;
  Object.assign(stationName.style, {
    color: '#74b9ff',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '1px',
  });
  const tagline = document.createElement('div');
  tagline.textContent = STATION_TAGLINE;
  Object.assign(tagline.style, { color: '#4a6a9a', fontSize: '10px', letterSpacing: '1px' });
  nameEl.appendChild(stationName);
  nameEl.appendChild(tagline);

  // Animated signal bars
  const signal = document.createElement('div');
  signal.id = 'radio-signal';
  Object.assign(signal.style, { display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px' });
  for (let i = 1; i <= 4; i++) {
    const bar = document.createElement('div');
    Object.assign(bar.style, {
      width: '3px',
      height: `${i * 4}px`,
      background: '#74b9ff',
      borderRadius: '1px',
      animation: `radio-pulse ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
    });
    signal.appendChild(bar);
  }

  header.appendChild(icon);
  header.appendChild(nameEl);
  header.appendChild(signal);
  overlay.appendChild(header);

  // Divider
  const divider = document.createElement('div');
  Object.assign(divider.style, { borderTop: '1px solid #1a3a6a', margin: '2px 0' });
  overlay.appendChild(divider);

  // Content area
  const content = document.createElement('div');
  content.id = 'radio-content';
  Object.assign(content.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
  overlay.appendChild(content);

  // Hint
  const hint = document.createElement('div');
  hint.textContent = 'E near boombox to tune out';
  Object.assign(hint.style, { color: '#2a4a7a', fontSize: '9px', letterSpacing: '1px', textAlign: 'center', marginTop: '4px' });
  overlay.appendChild(hint);

  // Keyframe injection
  if (!document.getElementById('radio-style')) {
    const style = document.createElement('style');
    style.id = 'radio-style';
    style.textContent = `
      @keyframes radio-pulse {
        from { opacity: 0.4; }
        to   { opacity: 1.0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);
  _overlayEl = overlay;
}

function _renderContent(segments) {
  const content = document.getElementById('radio-content');
  if (!content) return;
  content.innerHTML = '';
  for (const seg of segments) {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '8px', alignItems: 'flex-start' });

    const iconEl = document.createElement('div');
    iconEl.textContent = seg.icon;
    iconEl.style.fontSize = '14px';
    iconEl.style.flexShrink = '0';

    const textWrap = document.createElement('div');
    const label = document.createElement('div');
    label.textContent = seg.label;
    Object.assign(label.style, { color: '#3a6a9a', fontSize: '9px', letterSpacing: '2px' });
    const text = document.createElement('div');
    text.textContent = seg.text;
    Object.assign(text.style, { color: '#c8d8f0', fontSize: '12px', lineHeight: '1.4' });
    textWrap.appendChild(label);
    textWrap.appendChild(text);

    row.appendChild(iconEl);
    row.appendChild(textWrap);
    content.appendChild(row);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initRadioStation() {
  _buildOverlay();
}

/** Toggle the radio overlay on/off. */
export function toggleRadioStation() {
  _open = !_open;
  if (_overlayEl) {
    _overlayEl.style.display = _open ? 'flex' : 'none';
  }
}

export function isRadioOpen() {
  return _open;
}

/**
 * Update the radio (called each game tick).
 * @param {number} delta
 * @param {number} gameHour
 * @param {boolean} isStorm
 * @param {boolean} isMarket
 */
export function updateRadioStation(delta, gameHour, isStorm, isMarket) {
  if (!_open) return;
  _contentTimer -= delta;
  if (_contentTimer <= 0) {
    _contentTimer = CONTENT_INTERVAL;
    const segments = _generateBroadcast(gameHour, isStorm, isMarket);
    _renderContent(segments);
  }
}
