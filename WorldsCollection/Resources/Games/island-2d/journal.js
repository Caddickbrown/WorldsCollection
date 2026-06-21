/**
 * Island Journal — CAD-401
 *
 * A personal journal that collects pressed flowers, notes, and memories.
 * Toggle with J key. Entries are added automatically as the player experiences things.
 * Persisted via localStorage.
 */

const STORAGE_KEY = 'island_journal';

// ---------------------------------------------------------------------------
// Entry types
// ---------------------------------------------------------------------------
const ENTRY_ICONS = {
  flower:     '🌸',
  shell:      '🐚',
  memory:     '📝',
  milestone:  '⭐',
  discovery:  '🔍',
  event:      '🎪',
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _entries = []; // [{ type, text, timestamp, icon }]
let _overlayEl = null;
let _open = false;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_entries));
  } catch { /* */ }
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _entries = JSON.parse(raw);
  } catch { /* */ }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Add a journal entry. */
export function addEntry(type, text) {
  const entry = {
    type,
    text,
    icon: ENTRY_ICONS[type] || '📝',
    timestamp: Date.now(),
  };
  _entries.push(entry);
  // Cap at 100 entries
  if (_entries.length > 100) _entries = _entries.slice(-100);
  _save();
  _showToast(`Journal: ${entry.icon} ${text}`);
}

/** Get all entries (newest first). */
export function getEntries() {
  return [..._entries].reverse();
}

/** Check if an entry with specific text already exists (prevent duplicates). */
export function hasEntry(text) {
  return _entries.some(e => e.text === text);
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------
let _toastEl = null;
let _toastTimer = 0;

function _showToast(msg) {
  if (!_toastEl) return;
  _toastEl.textContent = msg;
  _toastEl.style.opacity = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    _toastEl.style.opacity = '0';
  }, 3000);
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function _buildUI() {
  // Toast
  const toast = document.createElement('div');
  toast.id = 'journal-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.75)',
    color: '#c9e8f5',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '13px',
    padding: '8px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(201, 232, 245, 0.3)',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.3s',
    zIndex: '9989',
    letterSpacing: '1px',
  });
  document.body.appendChild(toast);
  _toastEl = toast;

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'journal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0, 0, 0, 0.88)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9996',
    fontFamily: '"Courier New", Courier, monospace',
    backdropFilter: 'blur(4px)',
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#f8f0e0',
    border: '3px solid #c4a66a',
    borderRadius: '4px',
    padding: '28px 36px',
    minWidth: '420px',
    maxWidth: '520px',
    maxHeight: '75vh',
    overflowY: 'auto',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
  });

  const title = document.createElement('div');
  title.textContent = '📔 ISLAND JOURNAL';
  Object.assign(title.style, {
    color: '#4a3520',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    textAlign: 'center',
    marginBottom: '16px',
  });

  const list = document.createElement('div');
  list.id = 'journal-list';

  const hint = document.createElement('div');
  hint.textContent = '[ J ] CLOSE JOURNAL';
  Object.assign(hint.style, {
    color: '#a08050',
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
  const list = document.getElementById('journal-list');
  if (!list) return;
  list.innerHTML = '';

  const entries = getEntries();
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Your journal is empty. Explore the island to fill it.';
    Object.assign(empty.style, { color: '#a08050', textAlign: 'center', padding: '20px', fontStyle: 'italic' });
    list.appendChild(empty);
    return;
  }

  for (const entry of entries.slice(0, 30)) {
    const row = document.createElement('div');
    Object.assign(row.style, {
      padding: '8px 0',
      borderBottom: '1px solid rgba(160, 128, 80, 0.2)',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    });

    const icon = document.createElement('span');
    icon.textContent = entry.icon;
    icon.style.fontSize = '18px';

    const content = document.createElement('div');
    content.style.flex = '1';

    const text = document.createElement('div');
    text.textContent = entry.text;
    Object.assign(text.style, { color: '#4a3520', fontSize: '13px' });

    const time = document.createElement('div');
    const d = new Date(entry.timestamp);
    time.textContent = `Day ${Math.floor((Date.now() - entry.timestamp) / 86400000) || 'today'}`;
    Object.assign(time.style, { color: '#a08050', fontSize: '10px', marginTop: '2px' });

    content.appendChild(text);
    content.appendChild(time);
    row.appendChild(icon);
    row.appendChild(content);
    list.appendChild(row);
  }
}

export function toggleJournal() {
  _open = !_open;
  if (_overlayEl) {
    _overlayEl.style.display = _open ? 'flex' : 'none';
    if (_open) _refreshUI();
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initJournal() {
  _load();
  _buildUI();

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyJ') {
      toggleJournal();
    }
  });
}
