/**
 * cooking.js — CAD-448 — Simple Cooking / Recipe System
 *
 * Player collects ingredients (tagged items in inventory) and combines them
 * at the Kitchen (bakery or player home).  A matching recipe produces a food
 * item that can be consumed (stamina/mood), gifted to NPCs, or journalled.
 *
 * Ingredients enter the world via:
 *   • Eddy at the farm  (vegetables)
 *   • Fishing minigame  (fish)
 *   • Beachcombing      (seaweed)
 *
 * Six starter recipes:
 *   1. fish + seaweed            → seaweed soup
 *   2. tomato + flour            → flatbread
 *   3. fish + tomato             → fish stew
 *   4. carrot + potato + flour   → harvest pie
 *   5. seaweed + carrot          → island salad
 *   6. fish + potato             → chowder
 */

// ---------------------------------------------------------------------------
// Ingredient catalogue  (items tagged isIngredient:true are usable in cooking)
// ---------------------------------------------------------------------------
export const INGREDIENTS = {
  fish:    { id: 'fish',    label: 'fish',    emoji: '🐟', isIngredient: true },
  seaweed: { id: 'seaweed', label: 'seaweed', emoji: '🌿', isIngredient: true },
  tomato:  { id: 'tomato',  label: 'tomato',  emoji: '🍅', isIngredient: true },
  flour:   { id: 'flour',   label: 'flour',   emoji: '🌾', isIngredient: true },
  carrot:  { id: 'carrot',  label: 'carrot',  emoji: '🥕', isIngredient: true },
  potato:  { id: 'potato',  label: 'potato',  emoji: '🥔', isIngredient: true },
};

// New world item spots for ingredients not already in scene.js
// (fish and flour are already in ITEM_SPOTS — we add the rest here)
export const COOKING_ITEM_SPOTS = [
  { id: 'seaweed', label: 'seaweed', emoji: '🌿', isIngredient: true, x: 12,   z: -228 }, // south beach
  { id: 'seaweed', label: 'seaweed', emoji: '🌿', isIngredient: true, x: -18,  z: -222 }, // south beach
  { id: 'tomato',  label: 'tomato',  emoji: '🍅', isIngredient: true, x: -268, z: 130  }, // farm
  { id: 'carrot',  label: 'carrot',  emoji: '🥕', isIngredient: true, x: -275, z: 115  }, // farm
  { id: 'potato',  label: 'potato',  emoji: '🥔', isIngredient: true, x: -262, z: 108  }, // farm
];

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
const RECIPES = [
  {
    id: 'seaweed_soup',
    name: 'Seaweed Soup',
    emoji: '🍵',
    ingredients: ['fish', 'seaweed'],
    effect: { stamina: 15, mood: 5 },
    journalEntry: 'A bowl of briny warmth — the sea in a cup.',
  },
  {
    id: 'flatbread',
    name: 'Flatbread',
    emoji: '🫓',
    ingredients: ['tomato', 'flour'],
    effect: { stamina: 10, mood: 8 },
    journalEntry: 'Crisp edges, soft centre. Smells of the bakery.',
  },
  {
    id: 'fish_stew',
    name: 'Fish Stew',
    emoji: '🫕',
    ingredients: ['fish', 'tomato'],
    effect: { stamina: 20, mood: 10 },
    journalEntry: 'Rich and warming — island fisherman\'s staple.',
  },
  {
    id: 'harvest_pie',
    name: 'Harvest Pie',
    emoji: '🥧',
    ingredients: ['carrot', 'potato', 'flour'],
    effect: { stamina: 30, mood: 15 },
    journalEntry: 'Golden-crusted. Eddy would be proud.',
  },
  {
    id: 'island_salad',
    name: 'Island Salad',
    emoji: '🥗',
    ingredients: ['seaweed', 'carrot'],
    effect: { stamina: 8, mood: 12 },
    journalEntry: 'Crunchy, salty, unexpectedly delicious.',
  },
  {
    id: 'chowder',
    name: 'Chowder',
    emoji: '🍲',
    ingredients: ['fish', 'potato'],
    effect: { stamina: 25, mood: 12 },
    journalEntry: 'Thick and hearty. Suki definitely taught me this.',
  },
];

// ---------------------------------------------------------------------------
// Journal of discovered recipes
// ---------------------------------------------------------------------------
const discoveredRecipes = new Set();
const cookingJournal = []; // { name, emoji, entry, day }

export function getJournal() { return cookingJournal; }
export function getDiscovered() { return [...discoveredRecipes]; }

// ---------------------------------------------------------------------------
// Kitchen trigger zones (bakery + player home area near town square)
// ---------------------------------------------------------------------------
export const KITCHEN_ZONES = [
  { label: 'Bakery Kitchen', cx: -90, cz: -60, radius: 15 },
  { label: 'Home Kitchen',   cx:   0, cz:  -20, radius: 12 },
];

export function isNearKitchen(playerPos) {
  for (const kz of KITCHEN_ZONES) {
    const dx = playerPos.x - kz.cx;
    const dz = playerPos.z - kz.cz;
    if (Math.sqrt(dx * dx + dz * dz) < kz.radius) return kz;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core: attempt to cook from inventory
// Returns { success, food, message } or null if no match
// ---------------------------------------------------------------------------
export function tryCook(inventory, gameDay, onNotify) {
  const held = inventory.map(i => i.id);

  for (const recipe of RECIPES) {
    const needed = [...recipe.ingredients];
    const usable = [...held];
    let match = true;
    for (const req of needed) {
      const idx = usable.indexOf(req);
      if (idx === -1) { match = false; break; }
      usable.splice(idx, 1);
    }
    if (!match) continue;

    // Remove used ingredients from inventory
    for (const req of recipe.ingredients) {
      const idx = inventory.findIndex(i => i.id === req);
      if (idx !== -1) inventory.splice(idx, 1);
    }

    // Add food to inventory (if space)
    const food = { id: recipe.id, label: recipe.name, emoji: recipe.emoji, isFood: true, effect: recipe.effect };
    inventory.push(food);

    // Record discovery
    if (!discoveredRecipes.has(recipe.id)) {
      discoveredRecipes.add(recipe.id);
      cookingJournal.push({ name: recipe.name, emoji: recipe.emoji, entry: recipe.journalEntry, day: gameDay });
    }

    if (onNotify) onNotify(`You cooked ${recipe.emoji} ${recipe.name}!\n"${recipe.journalEntry}"`);
    return { success: true, food, recipe };
  }

  if (onNotify) onNotify('No recipe matches your ingredients. Try different combinations!');
  return { success: false };
}

// ---------------------------------------------------------------------------
// Consume a food item from inventory
// ---------------------------------------------------------------------------
export function tryEatFood(inventory, onNotify) {
  const idx = inventory.findIndex(i => i.isFood);
  if (idx === -1) {
    if (onNotify) onNotify('You have nothing to eat.');
    return false;
  }
  const food = inventory[idx];
  inventory.splice(idx, 1);
  if (onNotify) onNotify(`You ate ${food.emoji} ${food.label}. (+${food.effect?.stamina || 0} stamina, +${food.effect?.mood || 0} mood)`);
  return true;
}

// ---------------------------------------------------------------------------
// UI Overlay — kitchen cooking panel
// ---------------------------------------------------------------------------
export class CookingSystem {
  constructor() {
    this._overlay = null;
    this._keyHandler = null;
    this._active = false;
    this._buildUI();
  }

  get active() { return this._active; }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'cooking-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(12, 6, 0, 0.93)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      fontFamily: '"Courier New", Courier, monospace',
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: '#1a0e04',
      border: '3px solid #c87840',
      borderRadius: '14px',
      padding: '32px 40px',
      minWidth: '480px',
      maxWidth: '560px',
      boxShadow: '0 0 40px #c8784044, inset 0 0 20px #00000088',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
    });

    const title = document.createElement('div');
    title.textContent = '🍳  ISLAND KITCHEN';
    Object.assign(title.style, {
      color: '#ffbb66',
      fontSize: '22px',
      fontWeight: 'bold',
      letterSpacing: '4px',
      textShadow: '0 0 10px #ff8800',
    });

    const subtitle = document.createElement('div');
    subtitle.id = 'cook-subtitle';
    subtitle.textContent = 'Hold ingredients, then press C to cook · ESC to leave';
    Object.assign(subtitle.style, {
      color: '#aa8866',
      fontSize: '12px',
      letterSpacing: '1px',
      textAlign: 'center',
    });

    const recipeList = document.createElement('div');
    recipeList.id = 'cook-recipe-list';
    Object.assign(recipeList.style, {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    });

    // Build recipe rows
    for (const r of RECIPES) {
      const row = document.createElement('div');
      row.dataset.recipeId = r.id;
      Object.assign(row.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#2a1608',
        border: '1px solid #5a3010',
        borderRadius: '8px',
        padding: '8px 14px',
        color: '#ccaa88',
        fontSize: '13px',
      });
      row.innerHTML = `
        <span>${r.emoji} <strong style="color:#ffcc88">${r.name}</strong></span>
        <span style="color:#886644">${r.ingredients.map(i => INGREDIENTS[i]?.emoji || i).join(' + ')}</span>
        <span style="color:#557744;font-size:11px">+${r.effect.stamina}stam +${r.effect.mood}mood</span>
      `;
      recipeList.appendChild(row);
    }

    const journalBtn = document.createElement('div');
    journalBtn.id = 'cook-journal';
    Object.assign(journalBtn.style, {
      color: '#887755',
      fontSize: '12px',
      letterSpacing: '1px',
      marginTop: '4px',
    });

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(recipeList);
    panel.appendChild(journalBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlay = overlay;
    this._recipeList = recipeList;
    this._journalEl = journalBtn;
  }

  _refreshRecipeHighlights(inventory) {
    const held = inventory.map(i => i.id);
    for (const row of this._recipeList.children) {
      const recipe = RECIPES.find(r => r.id === row.dataset.recipeId);
      if (!recipe) continue;
      const needed = [...recipe.ingredients];
      const usable = [...held];
      let match = true;
      for (const req of needed) {
        const idx = usable.indexOf(req);
        if (idx === -1) { match = false; break; }
        usable.splice(idx, 1);
      }
      row.style.borderColor = match ? '#aa7722' : '#3a1a08';
      row.style.background  = match ? '#3a1e08' : '#2a1608';
      const disc = discoveredRecipes.has(recipe.id);
      row.style.opacity = disc ? '1' : '0.7';
    }
    // Journal count
    this._journalEl.textContent = `📓 Recipes discovered: ${discoveredRecipes.size} / ${RECIPES.length}`;
  }

  open(inventory) {
    this._active = true;
    this._refreshRecipeHighlights(inventory);
    this._overlay.style.display = 'flex';
  }

  close() {
    this._active = false;
    this._overlay.style.display = 'none';
  }

  toggle(inventory) {
    if (this._active) this.close();
    else this.open(inventory);
  }
}
