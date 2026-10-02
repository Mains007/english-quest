"use strict";
/* =====================================================================
   ENGLISH QUEST — utilidades compartidas
   Matemáticas, aleatoriedad determinista, ruido, lienzos y guardado.
   ===================================================================== */
const VH = 720;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => (v - a) / (b - a);
const sm = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const sstep = (a, b, x) => sm((x - a) / (b - a));
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = t => Math.pow(clamp(t, 0, 1), 3);
const easeInOut = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; t = clamp(t, 0, 1); return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const sign = v => v < 0 ? -1 : 1;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; };

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RNG = mulberry32(12345);
const rnd = () => RNG();
const R = (a, b) => a + (b - a) * RNG();
const RI = (a, b) => Math.floor(a + (b - a + 1) * RNG());
const pick = arr => arr[Math.floor(RNG() * arr.length)];
const chance = p => RNG() < p;
function seedRNG(s) { RNG = mulberry32(s); }
function shuffle(a, r = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- ruido ---------- */
function hash2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function hash1(i) { return hash2(i, 9137); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y, oct = 4) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += vnoise(x * f, y * f) * a; n += a; a *= .5; f *= 2.03; } return s / n; }
function n1(x) { return vnoise(x, 17.3); }
function fbm1(x, oct = 4) { return fbm(x, 3.7, oct); }
/* ruido periódico (para texturas que se repiten sin costuras) */
function tileNoise(size, period, seed) {
  const r = mulberry32(seed), v = new Float32Array(period * period);
  for (let i = 0; i < v.length; i++) v[i] = r();
  const cell = size / period;
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const x0 = ((ix % period) + period) % period, x1 = (x0 + 1) % period, y0 = ((iy % period) + period) % period, y1 = (y0 + 1) % period;
    return lerp(lerp(v[y0 * period + x0], v[y0 * period + x1], sx), lerp(v[y1 * period + x0], v[y1 * period + x1], sx), sy);
  };
}

/* ---------- lienzos y color ---------- */
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function rgba(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scalec(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }

/* sprite de brillo blanco y versiones teñidas (luces y halos) */
const GLOW = (() => {
  const c = mk(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.66)'); gr.addColorStop(.5, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
})();
const _tint = new Map();
function tint(col) {
  const k = (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0); let c = _tint.get(k); if (c) return c;
  c = mk(128, 128); const g = c.getContext('2d'); g.drawImage(GLOW, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = rgba(col); g.fillRect(0, 0, 128, 128);
  _tint.set(k, c); return c;
}
function glowAt(g, col, x, y, r, a) { if (a <= 0 || r <= 0) return; const pa = g.globalAlpha; g.globalAlpha = Math.min(1, a); g.drawImage(tint(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = pa; }

/* ---------- texto ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------- guardado: localStorage + db opcional ---------- */
const Store = {
  key: 'englishquest.v1',
  data: null, remote: null, uid: null, saving: false, dirty: false, timer: 0, listeners: [],
  defaults() {
    return {
      v: 1, updatedAt: 0,
      ep: 0, crystals: 0,
      levels: {},                      // id → {done, stars, bestAcc, checkpoint}
      unlocked: { weapons: { sword: true }, skills: {} },
      weapon: 'sword',
      items: {},                       // id → {s:seen, f:firstOk(0/1), c:correct, w:wrong, sp:spelling, b:box, t:last}
      units: {},                       // unit → {ep, ok, tot}
      tags: {},                        // vocab/gramática débil → peso
      lessons: {},
      history: [],
      settings: { diff: 'normal', master: .8, music: .65, sfx: .8, voice: .9, textSize: 'L', reduced: null, shake: 1, englishMode: 'level', hints: true, padMap: null }
    };
  },
  load() {
    let d = null;
    try { const raw = localStorage.getItem(this.key); if (raw) d = JSON.parse(raw); } catch (e) { }
    this.data = Object.assign(this.defaults(), d || {});
    this.data.settings = Object.assign(this.defaults().settings, (d && d.settings) || {});
    this.data.unlocked = Object.assign(this.defaults().unlocked, (d && d.unlocked) || {});
    return this.data;
  },
  save(immediate) {
    this.data.updatedAt = Date.now();
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { }
    this.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.pushRemote(), immediate ? 50 : 2500);
  },
  async connect() {
    // Sincroniza el progreso con el almacén del artefacto si el visor lo permite.
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      this.uid = id; this.remote = db.doc('data/users/' + id + '/progress');
      const snap = await this.remote.get();
      if (snap.exists) {
        const r = snap.data();
        if (r && r.json) {
          const rd = JSON.parse(r.json);
          if ((rd.updatedAt || 0) > (this.data.updatedAt || 0)) {
            const keepSettings = this.data.settings;
            this.data = Object.assign(this.defaults(), rd);
            this.data.settings = Object.assign(this.defaults().settings, rd.settings || keepSettings);
            try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { }
            this.listeners.forEach(f => f());
          } else if ((rd.updatedAt || 0) < (this.data.updatedAt || 0)) this.pushRemote();
        }
      } else if (this.data.updatedAt) this.pushRemote();
    } catch (e) { this.remote = null; }
  },
  async pushRemote() {
    if (!this.remote || this.saving || !this.dirty) return;
    this.saving = true; this.dirty = false;
    try { await this.remote.set({ json: JSON.stringify(this.data), updatedAt: this.data.updatedAt }); }
    catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) this.remote = null; }
    this.saving = false;
    if (this.dirty) { clearTimeout(this.timer); this.timer = setTimeout(() => this.pushRemote(), 2500); }
  },
  reset() { const s = this.data.settings; this.data = this.defaults(); this.data.settings = s; this.save(true); }
};
