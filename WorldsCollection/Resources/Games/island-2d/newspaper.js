/**
 * newspaper.js — CAD-449 — Island Newspaper
 *
 * Once per in-game week (every 7 game-days), a new edition of
 * "The Island Gazette" appears at the post office.
 *
 * Headlines are auto-generated from game state:
 *   • storm events
 *   • market days / economy
 *   • community project milestones
 *   • relationship achievements (gifting NPCs)
 *   • seasonal events (hooked from seasons.js)
 *
 * Delivered as a readable overlay. Player can keep a copy in
 * their journal (up to 10 archived editions).
 *
 * Usage:
 *   import { NewspaperSystem } from './newspaper.js';
 *   const news = new NewspaperSystem();
 *   // Each game loop tick:
 *   news.tick(simDeltaHours, gameState);   // gameState = { gameDay, storms, gifts, season, ... }
 *   // Near post office, press N or E:
 *   news.collect(gameState);               // marks as collected, shows overlay
 */

// ---------------------------------------------------------------------------
// Headline generators
// Each generator returns null or a { headline, body } object
// ---------------------------------------------------------------------------
const HEADLINE_GENERATORS = [
  // Storm / weather
  (gs) => gs.stormActive ? {
    headline: 'GALE WARNING — STAY INDOORS',
    body: 'Harbour master Old Will advises islanders to batten down the hatches. The fishing boats are moored safely. "She\'ll blow herself out by morning," Will says, squinting at the horizon.',
  } : null,

  // Market day
  (gs) => (gs.gameDay % 7 === 3) ? {
    headline: 'MARKET DAY: BUMPER HARVEST AT THE FARM',
    body: 'Eddy and Pete brought record quantities of tomatoes, carrots, and potatoes to the town square this week. "Best growing weather in years," Eddy reported. Prices remain fair.',
  } : null,

  // Seasonal: spring
  (gs) => (gs.season === 'spring') ? {
    headline: 'SPRING HAS ARRIVED ON THE ISLAND',
    body: 'Flowers are blooming along the south path and the bees have emerged from their winter hives. Jin has catalogued three new plant species on the forest trail.',
  } : null,

  // Seasonal: summer
  (gs) => (gs.season === 'summer') ? {
    headline: 'HOT SPELL — RECORD TEMPERATURES AT THE DOCK',
    body: 'Suki reports the sea is unusually warm this week. Residents are advised to swim in pairs. Nico\'s café has sold out of iced coffee three days running.',
  } : null,

  // Seasonal: autumn
  (gs) => (gs.season === 'autumn') ? {
    headline: 'HARVEST MARKET THIS WEEKEND',
    body: 'The annual harvest market returns to the town square. Expect competitions, produce stalls, and Mabel\'s famous spiced cider. Bring your best jam.',
  } : null,

  // Seasonal: winter
  (gs) => (gs.season === 'winter') ? {
    headline: 'FOG ADVISORY: LIGHTHOUSE BEAM EXTENDED',
    body: 'Lena has switched the lighthouse to extended hours through the winter fog. "If you can smell the sea but not see it, stay off the cliffs," she cautions.',
  } : null,

  // Gift / community milestone
  (gs) => (gs.giftsGiven >= 3) ? {
    headline: 'GENEROSITY IN THE AIR',
    body: 'Several islanders reported receiving unexpected gifts this week. "The newcomer brought me a freshly caught fish," said Mabel, beaming. Community spirit is thriving.',
  } : null,

  // Cooking discovery
  (gs) => (gs.recipesDiscovered >= 2) ? {
    headline: 'NEW RECIPES CIRCULATE AT THE BAKERY',
    body: 'Rosa at the bakery reports an uptick in experimental cooking. Seaweed soup and harvest pie have been spotted on several doorsteps this week. "The island eats well," she says.',
  } : null,

  // General interest — rotates by week number
  (gs) => {
    const FILLERS = [
      {
        headline: 'BIRDWATCH: RARE TERN SPOTTED OFF EAST HEADLAND',
        body: 'Wildlife enthusiasts gathered on the clifftops after Jin reported a sighting of a black-capped tern. Binoculars are available to borrow from the library.',
      },
      {
        headline: 'ANCHOR PUB QUIZ — RESULTS IN',
        body: 'Barney\'s Wednesday quiz drew its largest crowd yet. The team calling themselves "The Flounder" swept three rounds. Next week\'s theme: island geography.',
      },
      {
        headline: 'LIBRARY ACQUIRES NEW BOTANICAL COLLECTION',
        body: 'Marta has catalogued 47 new volumes on coastal flora, donated by a visiting academic. They are available to borrow with a standard library card.',
      },
      {
        headline: 'RADIO MAST REPAIRED BY OTTO',
        body: 'After two days of static, Otto completed repairs on the hill-top radio mast. Island FM is broadcasting clearly once more. Otto declined a formal thank-you.',
      },
      {
        headline: 'LIGHTHOUSE BEAM OPTIMISED',
        body: 'Lena has recalibrated the main lens after reports of dim visibility during Tuesday\'s squall. The beam is now visible at 18 nautical miles.',
      },
      {
        headline: 'SCHOOL TRIP TO THE TIDAL POOLS',
        body: 'Clara\'s class spent a morning at the east headland, cataloguing crabs, anemones, and one very startled goby. Rex carried the bucket.',
      },
    ];
    return FILLERS[(gs.edition || 0) % FILLERS.length];
  },
];

// ---------------------------------------------------------------------------
// Generate a newspaper edition from game state
// ---------------------------------------------------------------------------
function generateEdition(gs) {
  const articles = [];
  for (const gen of HEADLINE_GENERATORS) {
    if (articles.length >= 4) break;
    const art = gen(gs);
    if (art) articles.push(art);
  }
  // Always ensure at least 3 articles
  while (articles.length < 3) {
    articles.push({
      headline: 'ISLAND LIFE CONTINUES PEACEFULLY',
      body: 'Nothing dramatic to report this week — which is exactly how the islanders prefer it. The fountain in the town square was cleaned on Tuesday.',
    });
  }
  return {
    edition: gs.edition || 1,
    day: gs.gameDay,
    season: gs.season || 'spring',
    articles: articles.slice(0, 4),
  };
}

// ---------------------------------------------------------------------------
// Archive (up to 10 kept editions)
// ---------------------------------------------------------------------------
const _archive = [];
export function getArchive() { return [..._archive]; }

function _storeEdition(ed) {
  _archive.unshift(ed);
  if (_archive.length > 10) _archive.pop();
}

// ---------------------------------------------------------------------------
// NewspaperSystem class
// ---------------------------------------------------------------------------
export class NewspaperSystem {
  constructor() {
    this._lastEditionDay = -1;  // game-day of last published edition
    this._editionCount   = 0;
    this._pending        = false; // a new edition is at the post office
    this._currentEdition = null;
    this._overlay = null;
    this._buildUI();
  }

  // Call once per game tick with simulated hours delta and current game state
  tick(simDeltaHours, gs) {
    // gameDay increments; publish every 7 days
    const day = Math.floor(gs.gameDay || 0);
    if (day >= this._lastEditionDay + 7 && !this._pending) {
      this._editionCount++;
      gs.edition = this._editionCount;
      this._currentEdition = generateEdition(gs);
      _storeEdition(this._currentEdition);
      this._lastEditionDay = day;
      this._pending = true;
    }
  }

  // Returns true if a fresh edition is waiting at the post office
  get hasPending() { return this._pending; }

  // Collect and display the current edition
  collect(onNotify) {
    if (!this._pending && !this._currentEdition) {
      if (onNotify) onNotify('The Gazette will be out again in a few days.');
      return false;
    }
    this._pending = false;
    this._showOverlay(this._currentEdition);
    return true;
  }

  // Show a previously archived edition
  showArchived(idx) {
    const ed = _archive[idx];
    if (ed) this._showOverlay(ed);
  }

  // ── UI ──────────────────────────────────────────────────────────────────

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'newspaper-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(20, 15, 8, 0.96)',
      display: 'none',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: '9998',
      overflowY: 'auto',
      padding: '40px 20px',
    });

    const paper = document.createElement('div');
    paper.id = 'newspaper-paper';
    Object.assign(paper.style, {
      background: '#f5efd8',
      maxWidth: '600px',
      width: '100%',
      borderRadius: '4px',
      padding: '36px 40px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      fontFamily: '"Georgia", serif',
      color: '#1a1008',
      position: 'relative',
    });

    overlay.appendChild(paper);
    document.body.appendChild(overlay);
    this._overlay = overlay;
    this._paper = paper;

    // Close on click outside or ESC
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this._open) this.close();
    });
  }

  _showOverlay(ed) {
    this._open = true;
    const seasonLabel = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }[ed.season] || '';

    this._paper.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid #3a2810;padding-bottom:12px;margin-bottom:18px">
        <div style="font-size:11px;letter-spacing:3px;color:#8a6a3a;margin-bottom:4px">EST. YEAR ONE · ${seasonLabel} · Day ${ed.day}</div>
        <div style="font-size:36px;font-weight:bold;letter-spacing:2px;font-family:'Georgia',serif">The Island Gazette</div>
        <div style="font-size:11px;color:#8a6a3a;margin-top:4px;letter-spacing:1px">EDITION ${ed.edition} · YOUR WEEKLY ISLAND RECORD</div>
      </div>
      ${ed.articles.map((a, i) => `
        <div style="margin-bottom:${i < ed.articles.length - 1 ? '20px' : '0'};${i < ed.articles.length - 1 ? 'border-bottom:1px solid #c8b890;padding-bottom:18px' : ''}">
          <div style="font-size:${i === 0 ? '19px' : '15px'};font-weight:bold;line-height:1.25;margin-bottom:7px;color:#0a0604">${a.headline}</div>
          <div style="font-size:13px;line-height:1.7;color:#3a2810">${a.body}</div>
        </div>
      `).join('')}
      <div style="text-align:center;margin-top:24px;font-size:11px;color:#8a6a3a;letter-spacing:1px;border-top:1px solid #c8b890;padding-top:12px">
        Printed weekly at the post office · Press <strong>ESC</strong> or click outside to close
      </div>
    `;
    this._overlay.style.display = 'flex';
  }

  close() {
    this._open = false;
    this._overlay.style.display = 'none';
  }

  get isOpen() { return !!this._open; }
}

// Post office trigger zone
export const POST_OFFICE_ZONE = { cx: 90, cz: -60, radius: 14 };

export function isNearPostOffice(playerPos) {
  const dx = playerPos.x - POST_OFFICE_ZONE.cx;
  const dz = playerPos.z - POST_OFFICE_ZONE.cz;
  return Math.sqrt(dx * dx + dz * dz) < POST_OFFICE_ZONE.radius;
}
