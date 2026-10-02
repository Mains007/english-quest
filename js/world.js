"use strict";
/* =====================================================================
   MUNDO: geometría, colisiones, render del terreno con relieve (por trozos),
   líquidos, zonas de bioma y luces.
   ===================================================================== */
const CHUNK = 512, MARGIN = 40;

class World {
  constructor(def) {
    Object.assign(this, def);
    this.ground.sort((a, b) => a.x0 - b.x0);
    this.grid = new Map();
    for (const s of this.solids) this._index(s, s.x, s.x + s.w);
    for (const p of this.plats) this._index(p, Math.min(p.x, p.path ? p.path.x0 : p.x), Math.max(p.x + p.w, p.path ? p.path.x1 + p.w : p.x + p.w));
    this.chunks = []; this.ready = false; this.t = 0;
  }
  _index(o, x0, x1) { for (let k = Math.floor(x0 / 256); k <= Math.floor(x1 / 256); k++) { if (!this.grid.has(k)) this.grid.set(k, []); this.grid.get(k).push(o); } }
  near(x0, x1) {
    const out = new Set();
    for (let k = Math.floor(x0 / 256); k <= Math.floor(x1 / 256); k++) { const a = this.grid.get(k); if (a) for (const o of a) out.add(o); }
    return out;
  }
  /* ---------- consultas ---------- */
  seg(x) {
    const G = this.ground; let lo = 0, hi = G.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1, s = G[m]; if (x < s.x0) hi = m - 1; else if (x > s.x1) lo = m + 1; else return s; }
    return null;
  }
  groundY(x) {
    const s = this.seg(x); if (!s) return Infinity;
    const f = (x - s.x0) / s.step, i = Math.floor(f), t = f - i, p = s.pts;
    if (i >= p.length - 1) return p[p.length - 1];
    return p[i] + (p[i + 1] - p[i]) * t;
  }
  ceilY(x) {
    for (const c of this.ceils) if (x >= c.x0 && x <= c.x1) { const f = (x - c.x0) / c.step, i = Math.floor(f), t = f - i, p = c.pts; return i >= p.length - 1 ? p[p.length - 1] : p[i] + (p[i + 1] - p[i]) * t; }
    return -Infinity;
  }
  floorAt(x, y) {
    let best = this.groundY(x); if (best < y - 2) best = Infinity;
    for (const br of this.bridges || []) if (x >= br.x0 && x <= br.x1) { const by = br.surfaceY(x); if (by >= y - 2 && by < best) best = by; }
    for (const s of this.near(x, x)) {
      if (x < s.x || x > s.x + s.w) continue;
      if (s.y >= y - 2 && s.y < best && !s.gone) best = s.y;
    }
    for (const l of this.liquids) if (x >= l.x0 && x <= l.x1 && l.level >= y - 2 && l.level < best) best = l.level;
    return best;
  }
  surfaceAt(x, y) {
    for (const s of this.near(x, x)) if (!s.gone && x >= s.x && x <= s.x + s.w && Math.abs(s.y - y) < 10) return SURF[s.surf || MAT_SURF[s.mat] || 'rock'];
    for (const l of this.liquids) if (l.type === 'water' && x >= l.x0 && x <= l.x1 && y >= l.level - 6) return SURF.water;
    const sg = this.seg(x); if (sg && Math.abs(this.groundY(x) - y) < 14) return SURF[sg.surf || MAT_SURF[sg.mat] || 'rock'];
    return SURF.rock;
  }
  liquidAt(x, y) { for (const l of this.liquids) if (x >= l.x0 && x <= l.x1 && y > l.curLevel) return l; return null; }
  wallHit(x, y, vx) { for (const s of this.near(x, x)) if (s.solid && !s.gone && x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return s; return null; }
  biomeAt(x) {
    const Z = this.zones; let a = Z[0], b = Z[0];
    for (let i = 0; i < Z.length; i++) { if (Z[i].x <= x) { a = Z[i]; b = Z[i + 1] || Z[i]; } }
    if (a === b) return { a: a.biome, b: a.biome, t: 0 };
    const t = sstep(b.x - 260, b.x + 260, x);
    return { a: a.biome, b: b.biome, t };
  }
  /* ---------- movimiento con colisiones (héroe y enemigos) ---------- */
  move(e, dt) {
    const hw = e.w / 2;
    e.wall = 0; e.hitHead = false;
    // plataformas móviles: arrastrar
    if (e.onGround && e.plat && e.plat.dx !== undefined && !e.plat.gone) { e.x += e.plat.dx; e.y += e.plat.dy; }
    // --- horizontal
    let nx = e.x + e.vx * dt;
    const cand = this.near(Math.min(e.x, nx) - hw - 4, Math.max(e.x, nx) + hw + 4);
    for (const s of cand) {
      if (!s.solid || s.gone) continue;
      if (e.y - e.h + 2 < s.y + s.h && e.y - 2 > s.y && nx + hw > s.x && nx - hw < s.x + s.w) {
        if (e.x <= s.x + s.w / 2) { nx = s.x - hw - .01; if (e.vx >= 0) e.wall = 1; } else { nx = s.x + s.w + hw + .01; if (e.vx <= 0) e.wall = -1; }
        e.vx = 0;
      }
    }
    if (e.vx !== 0 || true) {
      for (const side of [-1, 1]) {
        const lx = nx + side * hw, gy = this.groundY(lx);
        if (gy < e.y - 20 && gy > e.y - e.h - 400) {
          // escalón alto = pared (sirve para salto de pared)
          if (side > 0 && nx > e.x - .01) { const sx = this._stepX(e.x, lx, e.y - 20); nx = sx - hw - .01; e.wall = 1; e.vx = Math.min(0, e.vx); }
          else if (side < 0 && nx < e.x + .01) { const sx = this._stepX(e.x, lx, e.y - 20); nx = sx + hw + .01; e.wall = -1; e.vx = Math.max(0, e.vx); }
        }
      }
    }
    nx = clamp(nx, this.bounds.x0 + hw, this.bounds.x1 - hw);
    if (e.lockX) nx = clamp(nx, e.lockX[0] + hw, e.lockX[1] - hw);
    e.x = nx;
    // --- vertical
    const ny = e.y + e.vy * dt; let land = null, plat = null;
    if (e.vy >= 0) {
      let gy = Math.min(this.groundY(e.x), this.groundY(e.x - hw * .6), this.groundY(e.x + hw * .6));
      if (ny >= gy && e.y <= gy + 14) land = gy;
      else if (e.onGround && !e.plat && gy - e.y >= 0 && gy - e.y < 18 && e.vy < 400) land = gy;
      e.onBridge = null;
      for (const br of this.bridges || []) {
        if (e.x < br.x0 || e.x > br.x1 || e.dropT > 0) continue; const by = br.surfaceY(e.x);
        if ((e.y <= by + 6 && ny >= by - 2) || (e.onGround && e.wasBridge === br && Math.abs(e.y - by) < 14)) { if (land === null || by < land) { land = by; plat = { bridge: br, dx: 0, dy: 0 }; e.onBridge = br; } }
      }
      e.wasBridge = e.onBridge;
      for (const s of this.near(e.x - hw, e.x + hw)) {
        if (s.gone) continue;
        if (e.x + hw * .7 < s.x || e.x - hw * .7 > s.x + s.w) continue;
        if (!s.solid && e.dropT > 0) continue;
        const top = s.y;
        if (e.y <= top + 2 + (s.dy > 0 ? s.dy + 2 : 0) && ny >= top && (land === null || top < land)) { land = top; plat = s; }
        else if (e.onGround && e.plat === s && Math.abs(e.y - top) < 8) { land = top; plat = s; }
      }
    } else {
      for (const s of this.near(e.x - hw, e.x + hw)) {
        if (!s.solid || s.gone) continue;
        if (e.x + hw * .7 < s.x || e.x - hw * .7 > s.x + s.w) continue;
        const bot = s.y + s.h;
        if (e.y - e.h >= bot - 2 && ny - e.h < bot) { e.y = bot + e.h; e.vy = 0; e.hitHead = true; }
      }
      const cy = this.ceilY(e.x);
      if (!e.hitHead && ny - e.h < cy) { e.y = cy + e.h; e.vy = 0; e.hitHead = true; }
    }
    const wasOn = e.onGround;
    if (land !== null) { e.landVy = e.vy; e.y = land; e.vy = 0; e.onGround = true; e.plat = plat; if (!wasOn) e.justLanded = true; }
    else if (!e.hitHead) { e.y = ny; e.onGround = false; e.plat = null; }
    else e.onGround = false;
    if (e.dropT > 0) e.dropT -= dt;
  }
  _stepX(x0, x1, yy) { let a = x0, b = x1; for (let i = 0; i < 10; i++) { const m = (a + b) / 2; if (this.groundY(m) < yy) b = m; else a = m; } return b; }
  /* ---------- actualización ---------- */
  update(dt, t) {
    this.t = t;
    for (const p of this.plats) if (p.path) {
      const ox = p.x, oy = p.y, ph = (t / p.path.period + (p.path.phase || 0)) % 1, k = (1 - Math.cos(ph * TAU)) / 2;
      p.x = lerp(p.path.x0, p.path.x1, k); p.y = lerp(p.path.y0, p.path.y1, k); p.dx = p.x - ox; p.dy = p.y - oy;
    } else if (p.sink !== undefined) {
      const oy = p.y; p.y = p.baseY + p.sink; p.dx = 0; p.dy = p.y - oy;
    }
    for (const l of this.liquids) {
      l.curLevel = l.level + (l.tide ? Math.sin(t * TAU / l.tide.period) * l.tide.amp : 0) + (l.rise ? l.riseOffset || 0 : 0);
    }
  }
  /* ---------- render del terreno ---------- */
  async build(progress) {
    const top = this.bounds.y0 - 60, bot = this.bounds.y1 + 60, H = bot - top;
    const n = Math.ceil(this.bounds.x1 / CHUNK);
    this.chunkTop = top; this.chunkH = H;
    for (let i = 0; i < n; i++) {
      const x0 = i * CHUNK;
      const mask = mk(CHUNK + MARGIN * 2, H + MARGIN * 2), m = mask.getContext('2d');
      m.translate(MARGIN - x0, MARGIN - top);
      this._paintMask(m, x0 - MARGIN, x0 + CHUNK + MARGIN, top, bot);
      const zone = this.biomeAt(x0 + CHUNK / 2), bio = BIOMES[zone.t > .5 ? zone.b : zone.a];
      const r = renderRelief(mask, x0, top, MARGIN, CHUNK, H, { emit: true, ambient: bio.relief.amb, sky: bio.relief.sky, skyK: bio.relief.skyK, depth: bio.relief.depth, light: bio.relief.light });
      const c = mk(CHUNK, H), g = c.getContext('2d'); g.putImageData(r.img, 0, 0);
      let em = null; if (r.emit) { em = mk(CHUNK, H); em.getContext('2d').putImageData(r.emit, 0, 0); }
      g.save(); g.translate(-x0, -top); this._paintCovers(g, x0 - 80, x0 + CHUNK + 80); g.restore();
      this.chunks.push({ x0, c, em });
      if (progress) progress((i + 1) / n);
      await new Promise(res => setTimeout(res, 0));
    }
    this.ready = true;
  }
  _paintMask(m, x0, x1, top, bot) {
    for (const s of this.ground) {
      if (s.x1 < x0 || s.x0 > x1) continue;
      m.fillStyle = matFill(s.mat); m.beginPath();
      const a = Math.max(s.x0, x0 - 40), b = Math.min(s.x1, x1 + 40);
      // continuación de otro tramo: frontera irregular en diagonal (no un corte recto)
      const prev = !s.lipL && a === s.x0 && this.ground.find(o => o !== s && Math.abs(o.x1 - s.x0) < 2 && o.mat !== s.mat);
      if (prev) {
        const y0 = this.groundY(s.x0), r = mulberry32(s.x0 | 0);
        m.moveTo(s.x0 + 30, bot + 50);
        for (let k = 0; k <= 12; k++) { const yy = lerp(bot + 50, y0 + 4, k / 12), xx = s.x0 + lerp(30, -26, k / 12) + (r() - .5) * 22 + Math.sin(k * 1.3) * 8; m.lineTo(xx, yy); }
        m.lineTo(s.x0 - 26, this.groundY(s.x0 - 26));
        for (let x = s.x0 - 22; x < a; x += 4) m.lineTo(x, this.groundY(x));
      } else
      m.moveTo(a, bot + 50);
      if (a === s.x0 && s.lipL) { const y = this.groundY(a); m.lineTo(a - 3, y + 90); m.lineTo(a + 2, y + 40); m.lineTo(a - 2, y + 10); }
      for (let x = a; x <= b; x += 4) m.lineTo(x, this.groundY(x));
      m.lineTo(b, this.groundY(b));
      if (b === s.x1 && s.lipR) { const y = this.groundY(b); m.lineTo(b + 2, y + 10); m.lineTo(b - 2, y + 40); m.lineTo(b + 3, y + 90); }
      m.lineTo(b, bot + 50); m.closePath(); m.fill();
    }
    for (const c of this.ceils) {
      if (c.x1 < x0 || c.x0 > x1) continue;
      m.fillStyle = matFill(c.mat); m.beginPath(); const a = Math.max(c.x0, x0 - 40), b = Math.min(c.x1, x1 + 40);
      m.moveTo(a, top - 50); for (let x = a; x <= b; x += 4) m.lineTo(x, this.ceilY(x)); m.lineTo(b, top - 50); m.closePath(); m.fill();
      for (const st of c.stal || []) if (st.x > x0 - 60 && st.x < x1 + 60) { const cy = this.ceilY(st.x); spikePath(m, st.x, cy - 4, st.w, st.h, 1, st.seed); m.fill(); }
    }
    for (const s of this.solids) {
      if (s.x + s.w < x0 || s.x > x1 || s.dynamic) continue;
      m.fillStyle = matFill(s.mat); this._shapeRect(m, s); m.fill();
    }

    for (const sp of this.spikesDeco || []) { }
  }
  _shapeRect(m, s) {
    const r = mulberry32((s.x * 7 + s.y * 13) | 0), j = s.mat === 'brick' || s.mat === 'metal' || s.mat === 'wood' ? 0 : 3;
    m.beginPath(); m.moveTo(s.x + r() * j, s.y + r() * j);
    for (let x = s.x + 10; x < s.x + s.w; x += 10) m.lineTo(x, s.y + (r() - .5) * j);
    m.lineTo(s.x + s.w - r() * j, s.y + r() * j);
    for (let y = s.y + 10; y < s.y + s.h; y += 10) m.lineTo(s.x + s.w + (r() - .5) * j, y);
    m.lineTo(s.x + s.w - r() * j, s.y + s.h); m.lineTo(s.x + r() * j, s.y + s.h);
    for (let y = s.y + s.h - 10; y > s.y; y -= 10) m.lineTo(s.x + (r() - .5) * j, y);
    m.closePath();
  }
  _shapePlat(m, p) {
    const r = mulberry32((p.x * 3 + p.y) | 0), th = p.h || 26;
    m.beginPath();
    if (p.style === 'island') {
      m.moveTo(p.x, p.y + 4); m.quadraticCurveTo(p.x, p.y, p.x + 8, p.y);
      m.lineTo(p.x + p.w - 8, p.y); m.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + 4);
      const steps = 7; for (let i = 1; i <= steps; i++) { const t = i / steps, x = lerp(p.x + p.w, p.x, t); const depth = Math.sin(t * Math.PI) * (th * 2.2) * (.8 + r() * .4) + 8; m.lineTo(x + (r() - .5) * 6, p.y + depth); }
      m.closePath();
    } else if (p.style === 'log') {
      m.roundRect(p.x, p.y, p.w, th, th / 2);
    } else {
      m.moveTo(p.x + 4, p.y); m.lineTo(p.x + p.w - 4, p.y); m.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + 6);
      m.lineTo(p.x + p.w - 3, p.y + th); m.lineTo(p.x + 3, p.y + th); m.lineTo(p.x, p.y + 6); m.quadraticCurveTo(p.x, p.y, p.x + 4, p.y); m.closePath();
    }
  }
  /* capas encima del relieve: hierba, arena, musgo, ceniza, decoración estática */
  _paintCovers(g, x0, x1) {
    for (const s of this.ground) {
      if (s.x1 < x0 || s.x0 > x1 || !s.cover) continue;
      const a = Math.max(s.x0, x0), b = Math.min(s.x1, x1);
      paintCover(g, s.cover, a, b, x => this.groundY(x), s.x0, s.x1);
    }
    for (const s of this.solids) if (s.cover && !s.dynamic && s.x + s.w > x0 && s.x < x1) paintCover(g, s.cover, s.x, s.x + s.w, () => s.y, s.x, s.x + s.w);
    for (const p of this.plats) if (!p.path && !p.dynamic && p.sink === undefined && !p.crumble && !p.soft && p.x + p.w > x0 - 60 && p.x < x1 + 60) { platTint(this, p); paintPlatform(g, p); if (p.cover) paintCover(g, p.cover, p.x, p.x + p.w, () => p.y, p.x, p.x + p.w); }
    for (const d of this.staticDecor) if (d.x > x0 - 60 && d.x < x1 + 60) paintStaticDecor(g, d);
  }
  drawTerrain(g, cx, cw, cy, chh) {
    const top = this.chunkTop;
    // sólo la franja visible (en vertical y horizontal) de cada trozo
    const y0 = cy === undefined ? 0 : Math.max(0, Math.floor(cy - 40 - top)), y1 = cy === undefined ? this.chunkH : Math.min(this.chunkH, Math.ceil(cy + chh + 40 - top));
    if (y1 <= y0) return;
    for (const ch of this.chunks) { if (ch.x0 + CHUNK < cx - 2 || ch.x0 > cx + cw + 2) continue;
      const sx = Math.max(0, Math.floor(cx - 2 - ch.x0)), ex = Math.min(CHUNK, Math.ceil(cx + cw + 2 - ch.x0)); if (ex <= sx) continue;
      g.drawImage(ch.c, sx, y0, ex - sx, y1 - y0, ch.x0 + sx, top + y0, ex - sx, y1 - y0); }
  }
  drawEmissive(g, cx, cw, t) {
    const top = this.chunkTop; g.globalCompositeOperation = 'lighter';
    for (const ch of this.chunks) { if (!ch.em || ch.x0 + CHUNK < cx || ch.x0 > cx + cw) continue; g.globalAlpha = .3 + .25 * Math.sin(t * 1.7 + ch.x0 * .01); g.drawImage(ch.em, ch.x0, top); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
}

/* ---------- coberturas ---------- */
function paintCover(g, type, a, b, Y, s0, s1) {
  const step = 4;
  if (type === 'grass' || type === 'moss' || type === 'darkgrass') {
    const C = type === 'grass' ? ['#3f7a2c', '#5d9a3a', '#8cc152', '#2c5a22'] : type === 'moss' ? ['#4c6e34', '#668c42', '#8fb15a', '#33502a'] : ['#2f5a3a', '#3f7448', '#5e9a5e', '#21402a'];
    // franja inferior con "goterones" de hierba colgando
    g.fillStyle = C[3]; g.beginPath(); g.moveTo(a, Y(a) + 2);
    for (let x = a; x <= b; x += step) { const d = 10 + 7 * vnoise(x * .08, 1) + (hash1(x / 12 | 0) > .82 ? 10 : 0); g.lineTo(x, Y(x) + d); }
    for (let x = b; x >= a; x -= step) g.lineTo(x, Y(x) - 1); g.closePath(); g.fill();
    g.fillStyle = C[0]; g.beginPath(); g.moveTo(a, Y(a));
    for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) + 6 + 4 * vnoise(x * .1, 3));
    for (let x = b; x >= a; x -= step) g.lineTo(x, Y(x) - 2); g.closePath(); g.fill();
    g.strokeStyle = C[2]; g.lineWidth = 2.5; g.beginPath(); for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) - 1); g.stroke();
    // matas estáticas oscuras
    g.fillStyle = C[1];
    for (let x = a; x < b; x += 3) {
      if (hash1(x * 1.7 | 0) < .45) continue; const y = Y(x), h = 5 + hash1(x | 0) * 9, l = (hash1(x * 3 | 0) - .5) * .8;
      g.beginPath(); g.moveTo(x - 1.6, y + 1); g.quadraticCurveTo(x + l * h * .3, y - h * .5, x + l * h, y - h); g.quadraticCurveTo(x + l * h * .3 + 1, y - h * .4, x + 1.6, y + 1); g.fill();
    }
    if (a <= s0 + 1) { g.fillStyle = C[3]; g.beginPath(); g.ellipse(a + 2, Y(a) + 6, 6, 10, .3, 0, TAU); g.fill(); }
    if (b >= s1 - 1) { g.fillStyle = C[3]; g.beginPath(); g.ellipse(b - 2, Y(b) + 6, 6, 10, -.3, 0, TAU); g.fill(); }
  } else if (type === 'sand') {
    g.fillStyle = 'rgba(255,238,196,.55)'; g.beginPath(); g.moveTo(a, Y(a));
    for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) + 4 + 3 * vnoise(x * .05, 7)); for (let x = b; x >= a; x -= step) g.lineTo(x, Y(x) - 1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,250,225,.9)'; g.lineWidth = 1.5; g.beginPath(); for (let x = a; x <= b; x += step) g.lineTo(x, Y(x)); g.stroke();
    for (let x = a; x < b; x += 6) if (hash1(x * 5.1 | 0) > .86) { g.fillStyle = 'rgba(140,110,70,.5)'; g.beginPath(); g.ellipse(x, Y(x) + 3, 2.4, 1.4, 0, 0, TAU); g.fill(); }
  } else if (type === 'ash') {
    g.fillStyle = 'rgba(40,32,32,.9)'; g.beginPath(); g.moveTo(a, Y(a));
    for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) + 5 + 3 * vnoise(x * .06, 9)); for (let x = b; x >= a; x -= step) g.lineTo(x, Y(x) - 1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,100,96,.7)'; g.lineWidth = 1.4; g.beginPath(); for (let x = a; x <= b; x += step) g.lineTo(x, Y(x)); g.stroke();
    for (let x = a; x < b; x += 5) if (hash1(x * 2.3 | 0) > .9) { g.fillStyle = 'rgba(255,120,40,.85)'; g.fillRect(x, Y(x) + 1, 2, 1.5); }
  } else if (type === 'wet') {
    g.strokeStyle = 'rgba(200,235,255,.55)'; g.lineWidth = 2; g.beginPath(); for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) + 1); g.stroke();
    for (let x = a; x < b; x += 7) if (hash1(x * 4.3 | 0) > .8) { g.fillStyle = 'rgba(80,190,170,.8)'; g.beginPath(); g.ellipse(x, Y(x) + 2, 4, 2, 0, 0, TAU); g.fill(); }
  } else if (type === 'cloud') {
    // borde esponjoso: bultos de distinto tamaño con sombra azul debajo y brillo arriba
    const puffs = []; for (let x = a + 6; x <= b - 4;) { const r = 9 + 9 * hash1(Math.floor(x / 7) * 3.1); puffs.push([x, r]); x += r * 1.25; }
    g.fillStyle = 'rgba(176,196,236,.55)'; for (const [x, r] of puffs) { g.beginPath(); g.arc(x + 2, Y(x) + r * .55 + 4, r * .95, 0, TAU); g.fill(); }
    g.fillStyle = '#ffffff'; for (const [x, r] of puffs) { g.beginPath(); g.arc(x, Y(x) + r * .45, r, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(214,226,250,.9)'; for (const [x, r] of puffs) { g.beginPath(); g.arc(x + r * .25, Y(x) + r * .7, r * .55, 0, Math.PI); g.fill(); }
    // remolinos suaves dentro del cuerpo de la nube
    g.strokeStyle = 'rgba(190,206,240,.6)'; g.lineWidth = 2.5; g.lineCap = 'round';
    for (let x = a + 30; x < b - 30; x += 90 + 40 * hash1(x)) { const y = Y(x) + 40 + 50 * hash1(x * 1.7), r = 14 + 10 * hash1(x * 2.3); g.beginPath(); g.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.85); g.stroke(); g.beginPath(); g.arc(x + r * 1.3, y + 6, r * .7, Math.PI * 1.1, Math.PI * 1.8); g.stroke(); }
  } else if (type === 'snowcap') {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(a, Y(a)); for (let x = a; x <= b; x += step) g.lineTo(x, Y(x) + 6 + 4 * vnoise(x * .07, 2)); for (let x = b; x >= a; x -= step) g.lineTo(x, Y(x) - 3); g.closePath(); g.fill();
  }
}
function spikePath(g, x, by, w, h, dir, seed) {
  const r = mulberry32(seed), n = 8; g.beginPath(); g.moveTo(x - w / 2, by);
  for (let i = 1; i < n; i++) { const t = i / n, ww = Math.pow(1 - t, .75) * w / 2 * (1 + (r() - .5) * .35); g.lineTo(x - ww + (r() - .5) * 5, by + dir * h * t); }
  g.lineTo(x + (r() - .5) * 4, by + dir * h);
  for (let i = n - 1; i >= 1; i--) { const t = i / n, ww = Math.pow(1 - t, .75) * w / 2 * (1 + (r() - .5) * .35); g.lineTo(x + ww + (r() - .5) * 5, by + dir * h * t); }
  g.lineTo(x + w / 2, by); g.closePath();
}
function paintStaticDecor(g, d) {
  const r = mulberry32(d.seed || 1);
  switch (d.t) {
    case 'shell': drawShell(g, d.x, d.y, d.s, d.c, d.a); break;
    case 'star': drawStarfish(g, d.x, d.y, d.s, d.a); break;
    case 'fern': drawFern(g, d.x, d.y, d.s, d.flip, d.cols || ['#2c4c25', '#3f6b30']); break;
    case 'crystal': drawCrystals(g, d.x, d.y, d.n, d.s, d.c, d.dir, d.seed); break;
    case 'pebbles': for (let i = 0; i < d.n; i++) { const x = d.x + (r() - .5) * 30, w = 3 + r() * 6; g.fillStyle = rgba(mixc(d.c, [0, 0, 0], r() * .3)); g.beginPath(); g.ellipse(x, d.y - w * .3, w, w * .6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(x - w * .3, d.y - w * .6, w * .4, w * .2, 0, 0, TAU); g.fill(); } break;
    case 'bones': g.strokeStyle = '#d8d0c0'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = r() * 3, l = 10 + r() * 10, x = d.x + (r() - .5) * 20; g.beginPath(); g.moveTo(x - Math.cos(a) * l, d.y - 2 - Math.sin(a) * 2); g.lineTo(x + Math.cos(a) * l, d.y - 2 + Math.sin(a) * 2); g.stroke(); } break;
    case 'sign': {
      g.fillStyle = '#5a3b22'; g.fillRect(d.x - 3, d.y - 64, 6, 64);
      g.save(); g.translate(d.x, d.y - 70); g.rotate(-.03);
      g.fillStyle = '#8a5f38'; g.beginPath(); g.roundRect(-58, -26, 116, 40, 5); g.fill(); g.strokeStyle = '#3a2414'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#f6e6c4'; g.font = '700 15px "Alegreya Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d.text, 0, -6); g.restore(); break;
    }
    case 'skull': g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(d.x, d.y - 8, 8, 0, TAU); g.fill(); g.fillRect(d.x - 5, d.y - 4, 10, 5); g.fillStyle = '#2a2020'; g.beginPath(); g.arc(d.x - 3, d.y - 9, 2.2, 0, TAU); g.arc(d.x + 3, d.y - 9, 2.2, 0, TAU); g.fill(); break;
    case 'column': {
      const w = d.w || 34, h = d.h || 120;
      const gr = g.createLinearGradient(d.x - w / 2, 0, d.x + w / 2, 0); gr.addColorStop(0, '#cdbfa6'); gr.addColorStop(.5, '#a8987e'); gr.addColorStop(1, '#6e6250');
      g.fillStyle = gr; g.fillRect(d.x - w / 2, d.y - h, w, h);
      g.strokeStyle = 'rgba(60,50,40,.5)'; g.lineWidth = 1.5; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(d.x - w / 2 + i * w / 4, d.y - h); g.lineTo(d.x - w / 2 + i * w / 4, d.y); g.stroke(); }
      g.fillStyle = '#b8a88e'; g.fillRect(d.x - w / 2 - 6, d.y - h - 10, w + 12, 12); g.fillRect(d.x - w / 2 - 4, d.y - 8, w + 8, 8);
      if (d.broken) { g.fillStyle = 'rgba(0,0,0,0)'; }
      break;
    }
    case 'coralclump': for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (r() - .5) * 1.4, l = 14 + r() * 20; g.strokeStyle = rgba(d.c); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(d.x, d.y); g.quadraticCurveTo(d.x + Math.cos(a) * l * .5 + 4, d.y + Math.sin(a) * l * .5, d.x + Math.cos(a) * l, d.y + Math.sin(a) * l); g.stroke(); g.fillStyle = rgba(mixc(d.c, [255, 255, 255], .3)); g.beginPath(); g.arc(d.x + Math.cos(a) * l, d.y + Math.sin(a) * l, 3, 0, TAU); g.fill(); } break;
    case 'roots': g.strokeStyle = '#4a3420'; g.lineCap = 'round'; for (let i = 0; i < d.n; i++) { let x = d.x + (r() - .5) * 40, y = d.y; g.lineWidth = 3 + r() * 3; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 10; y += 8 + r() * 8; g.lineTo(x, y); } g.stroke(); } break;
  }
}

/* plataformas en biomas oscuros: se tiñen con la bruma del bioma para no "brillar" */
function platTint(W, p) {
  if (p.tint !== undefined) return; p.tint = null;
  const B = BIOMES[W.biomeAt(p.x + p.w / 2).a]; if (!B || !B.ambient) return;
  const lum = B.ambient[0] + B.ambient[1] + B.ambient[2]; if (lum < 520) { p.tint = B.fog || [30, 30, 50]; p.tintK = clamp((520 - lum) / 500, .15, .45); }
}
