/**
 * ClimateOverlay.js — nullschool-style debug visualisation of the climate.
 *
 * Renders the simulation fields to a canvas HUD: pressure, wind, temperature,
 * cloud, precipitation and biome. Toggle with C, cycle layers with V.
 * Pure 2D canvas — no Three.js dependency, no impact on the 3D render path.
 */
import { BIOME_COLORS } from './ClimateModel.js';

const LAYERS = ['biome', 'temperature', 'pressure', 'wind', 'cloud', 'precipitation'];

export class ClimateOverlay {
  constructor(model, { size = 260 } = {}) {
    this.model = model;
    this.layer = 0;
    this.visible = false;
    this.size = size;

    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;right:16px;bottom:16px;z-index:60;display:none;
      background:rgba(0,0,0,.55);backdrop-filter:blur(6px);border-radius:12px;
      padding:10px;font-family:'JetBrains Mono',monospace;color:#fff;font-size:11px;`;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;
    this.canvas.style.cssText = 'display:block;border-radius:8px;image-rendering:pixelated;';

    this.label = document.createElement('div');
    this.label.style.cssText = 'margin-top:7px;opacity:.85;letter-spacing:.5px;';

    wrap.appendChild(this.canvas);
    wrap.appendChild(this.label);
    document.body.appendChild(wrap);
    this.wrap = wrap;
    this.ctx = this.canvas.getContext('2d');

    // offscreen buffer at grid resolution, scaled up on draw
    this.buf = document.createElement('canvas');
    this.buf.width = this.buf.height = model.res;
    this.bctx = this.buf.getContext('2d');
    this.img = this.bctx.createImageData(model.res, model.res);
  }

  toggle() { this.visible = !this.visible; this.wrap.style.display = this.visible ? 'block' : 'none'; }
  cycle() { this.layer = (this.layer + 1) % LAYERS.length; }

  _range(field) {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < field.length; i++) {
      if (field[i] < min) min = field[i];
      if (field[i] > max) max = field[i];
    }
    return [min, max === min ? min + 1 : max];
  }

  // blue -> cyan -> yellow -> red
  _ramp(t) {
    t = Math.max(0, Math.min(1, t));
    if (t < 0.33) { const u = t / 0.33; return [30 + u * 20, 60 + u * 140, 180 + u * 60]; }
    if (t < 0.66) { const u = (t - 0.33) / 0.33; return [50 + u * 200, 200 + u * 30, 240 - u * 180]; }
    const u = (t - 0.66) / 0.34; return [250, 230 - u * 160, 60 - u * 40];
  }

  draw() {
    if (!this.visible || !this.model) return;
    const m = this.model, res = m.res, d = this.img.data;
    const name = LAYERS[this.layer];

    let field = null, lo = 0, hi = 1;
    if (name === 'temperature') { field = m.temperature; [lo, hi] = this._range(field); }
    else if (name === 'pressure') { field = m.pressure; [lo, hi] = this._range(field); }
    else if (name === 'cloud') { field = m.cloud; lo = 0; hi = 1; }
    else if (name === 'precipitation') { field = m.precipitation; lo = 0; [, hi] = this._range(field); }
    else if (name === 'wind') { lo = 0; hi = 0; for (let i = 0; i < res * res; i++) hi = Math.max(hi, Math.hypot(m.windU[i], m.windV[i])); }

    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        const i = m.idx(r, c);
        // flip vertically so +z renders downward, matching the world map
        const p = ((res - 1 - r) * res + c) * 4;
        let cr, cg, cb;

        if (name === 'biome') {
          const hex = BIOME_COLORS[m.biome[i]] ?? 0x888888;
          cr = (hex >> 16) & 255; cg = (hex >> 8) & 255; cb = hex & 255;
        } else if (name === 'wind') {
          const sp = Math.hypot(m.windU[i], m.windV[i]);
          [cr, cg, cb] = this._ramp(hi ? sp / hi : 0);
        } else {
          [cr, cg, cb] = this._ramp((field[i] - lo) / (hi - lo));
        }

        // darken the sea so the coastline stays readable on every layer
        if (!m.isLand[i] && name !== 'biome') { cr *= 0.45; cg *= 0.5; cb *= 0.62; }

        d[p] = cr; d[p + 1] = cg; d[p + 2] = cb; d[p + 3] = 255;
      }
    }

    this.bctx.putImageData(this.img, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.ctx.drawImage(this.buf, 0, 0, this.size, this.size);

    if (name === 'wind') this._drawWindArrows();

    const unit = name === 'temperature' ? '°C' : name === 'pressure' ? ' hPa' : '';
    const rangeTxt = name === 'biome' ? '' : `  ${lo.toFixed(1)}${unit} → ${hi.toFixed(1)}${unit}`;
    this.label.textContent = `${name.toUpperCase()}${rangeTxt}   [C hide · V next]`;
  }

  _drawWindArrows() {
    const m = this.model, step = Math.max(3, Math.floor(m.res / 22));
    const scale = this.size / m.res;
    this.ctx.strokeStyle = 'rgba(255,255,255,.75)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let r = step >> 1; r < m.res; r += step) {
      for (let c = step >> 1; c < m.res; c += step) {
        const i = m.idx(r, c);
        const sp = Math.hypot(m.windU[i], m.windV[i]);
        if (sp < 1e-6) continue;
        const px = (c + 0.5) * scale;
        const py = (m.res - 1 - r + 0.5) * scale;
        const len = Math.min(step * scale * 0.8, sp * 3 + 2);
        const ux = (m.windU[i] / sp) * len;
        const uz = -(m.windV[i] / sp) * len; // screen y is inverted
        this.ctx.moveTo(px - ux / 2, py - uz / 2);
        this.ctx.lineTo(px + ux / 2, py + uz / 2);
        // arrowhead
        const a = Math.atan2(uz, ux);
        this.ctx.moveTo(px + ux / 2, py + uz / 2);
        this.ctx.lineTo(px + ux / 2 - 3 * Math.cos(a - 0.4), py + uz / 2 - 3 * Math.sin(a - 0.4));
        this.ctx.moveTo(px + ux / 2, py + uz / 2);
        this.ctx.lineTo(px + ux / 2 - 3 * Math.cos(a + 0.4), py + uz / 2 - 3 * Math.sin(a + 0.4));
      }
    }
    this.ctx.stroke();
  }
}
