"use strict";
/* =====================================================================
   FÍSICA INTERACTIVA
   - Superficies de agua/lava con muelles (ondas que viajan y rebotan).
   - Cuerdas/lianas verlet que se balancean y a las que te agarras.
   - Puentes colgantes que se comban bajo tu peso.
   - Banderas de tela que ondean.
   - Objetos físicos: barriles, cajas, cocos, rocas (empujar, flotar, romper).
   - Plataformas blandas: nubes y setas trampolín.
   ===================================================================== */

/* ---------- superficie de líquido con muelles ---------- */
class LiquidSurface {
  constructor(l) {
    this.l = l; this.step = 8; this.n = Math.max(3, Math.ceil((l.x1 - l.x0) / this.step) + 1);
    this.h = new Float32Array(this.n); this.v = new Float32Array(this.n);
    this.k = l.type === 'lava' ? 0.018 : 0.03; this.damp = l.type === 'lava' ? .045 : .025; this.spread = l.type === 'lava' ? .18 : .26;
  }
  splash(x, force) { const i = Math.round((x - this.l.x0) / this.step); for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < this.n) this.v[j] += force * (1 - Math.abs(k) * .3); } }
  update(dt) {
    const steps = 2;
    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < this.n; i++) { const a = -this.k * this.h[i] - this.damp * this.v[i]; this.v[i] += a * 60 * dt; this.h[i] += this.v[i] * 60 * dt / steps; }
      for (let p = 0; p < 2; p++) for (let i = 0; i < this.n; i++) {
        if (i > 0) { const d = this.spread * (this.h[i] - this.h[i - 1]); this.v[i - 1] += d; }
        if (i < this.n - 1) { const d = this.spread * (this.h[i] - this.h[i + 1]); this.v[i + 1] += d; }
      }
    }
  }
  at(x) { const f = (x - this.l.x0) / this.step, i = clamp(Math.floor(f), 0, this.n - 2), t = clamp(f - i, 0, 1); return this.h[i] + (this.h[i + 1] - this.h[i]) * t; }
}

/* ---------- cuerda verlet ---------- */
class Rope {
  constructor(x, y, len, seg = 14, opt = {}) {
    this.ax = x; this.ay = y; this.seg = seg; this.n = Math.max(3, Math.round(len / seg)); this.p = [];
    for (let i = 0; i <= this.n; i++) this.p.push({ x, y: y + i * seg, px: x, py: y + i * seg });
    this.grabbable = !!opt.grab; this.leafy = opt.leafy; this.col = opt.col || '#2e3a22'; this.th = opt.th || 3; this.flower = opt.flower; this.kind = opt.kind || 'vine';
    this.holder = null;
  }
  update(dt, wind, bodies) {
    const p = this.p;
    p[0].x = this.ax; p[0].y = this.ay;
    for (let i = 1; i < p.length; i++) {
      const q = p[i], vx = (q.x - q.px) * .985, vy = (q.y - q.py) * .985; q.px = q.x; q.py = q.y;
      q.x += vx + wind * dt * dt * 60; q.y += vy + 900 * dt * dt;
      for (const b of bodies) { const dx = q.x - b.x, dy = q.y - b.y; if (Math.abs(dx) < b.r && Math.abs(dy) < b.h) { q.x += (dx > 0 ? 1 : -1) * Math.min(2.5, (b.r - Math.abs(dx)) * .15) + b.vx * dt * .5; } }
    }
    if (this.holder) { const last = p[p.length - 1]; last.x = this.holder.x; last.y = this.holder.y - 40; }
    for (let k = 0; k < 6; k++) for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - this.seg) / d;
      if (i === 1) { b.x -= dx * f; b.y -= dy * f; } else { a.x += dx * f * .5; a.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; }
      if (this.holder && i === p.length - 1) { b.x = this.holder.x; b.y = this.holder.y - 40; }
    }
  }
  end() { return this.p[this.p.length - 1]; }
  draw(g) {
    const p = this.p;
    g.strokeStyle = this.col; g.lineWidth = this.th; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length - 1; i++) { const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2; g.quadraticCurveTo(p[i].x, p[i].y, mx, my); } g.lineTo(p[p.length - 1].x, p[p.length - 1].y); g.stroke();
    if (this.kind === 'rope') { g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1; g.stroke(); }
    if (this.leafy) for (let i = 2; i < p.length; i += 2) { const q = p[i], s = i % 4 ? 1 : -1; g.fillStyle = i % 4 ? '#4f7a34' : '#6d9a3f'; g.beginPath(); g.ellipse(q.x + s * 4, q.y, 5.5, 2.6, s * .6, 0, TAU); g.fill(); }
    if (this.grabbable) { const e = this.end(); g.fillStyle = this.kind === 'rope' ? '#8a6a3a' : '#5a7a34'; g.beginPath(); g.arc(e.x, e.y, 5, 0, TAU); g.fill(); }
    if (this.flower) { const e = this.end(); g.fillStyle = this.flower; g.beginPath(); g.arc(e.x, e.y + 3, 3.2, 0, TAU); g.fill(); }
  }
}

/* ---------- puente colgante ---------- */
class Bridge {
  constructor(x0, x1, y, opt = {}) {
    this.x0 = x0; this.x1 = x1; this.y = y; this.n = Math.max(4, Math.round((x1 - x0) / 22)); this.seg = (x1 - x0) / this.n * 1.02; this.p = [];
    for (let i = 0; i <= this.n; i++) { const x = lerp(x0, x1, i / this.n); this.p.push({ x, y, px: x, py: y }); }
    this.load = null; this.mat = opt.mat || 'wood';
  }
  update(dt, bodies) {
    const p = this.p;
    for (let i = 1; i < p.length - 1; i++) { const q = p[i], vx = (q.x - q.px) * .96, vy = (q.y - q.py) * .96; q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 700 * dt * dt; }
    for (const b of bodies) {
      if (b.x < this.x0 || b.x > this.x1) continue; const f = (b.x - this.x0) / (this.x1 - this.x0) * this.n, i = Math.floor(f);
      for (const j of [i, i + 1]) if (j > 0 && j < p.length - 1 && b.onBridge === this) p[j].y += (b.weight || 1) * 2.6 * (1 - Math.abs(f - j));
    }
    for (let k = 0; k < 8; k++) for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - this.seg) / d;
      const wa = i - 1 === 0 ? 0 : .5, wb = i === p.length - 1 ? 0 : .5, tw = wa + wb || 1;
      a.x += dx * f * wa / tw; a.y += dy * f * wa / tw; b.x -= dx * f * wb / tw; b.y -= dy * f * wb / tw;
    }
    p[0].x = this.x0; p[0].y = this.y; p[p.length - 1].x = this.x1; p[p.length - 1].y = this.y;
  }
  surfaceY(x) { const f = (x - this.x0) / (this.x1 - this.x0) * this.n, i = clamp(Math.floor(f), 0, this.n - 1), t = f - i; return lerp(this.p[i].y, this.p[i + 1].y, t); }
  draw(g) {
    const p = this.p;
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p[0].x, p[0].y - 34); for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y - 30 + Math.sin(i / p.length * Math.PI) * 6); g.stroke();
    for (let i = 0; i < p.length; i += 2) { g.beginPath(); g.moveTo(p[i].x, p[i].y); g.lineTo(p[i].x, p[i].y - 30 + Math.sin(i / p.length * Math.PI) * 6); g.lineWidth = 1.5; g.stroke(); }
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], ang = Math.atan2(b.y - a.y, b.x - a.x);
      g.save(); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2 + 4); g.rotate(ang);
      g.fillStyle = i % 2 ? '#9a6a3c' : '#a8784a'; g.fillRect(-this.seg / 2 + 1, -4, this.seg - 2, 9);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-this.seg / 2 + 1, -4, this.seg - 2, 2); g.restore();
    }
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0].x, p[0].y + 2); for (const q of p) g.lineTo(q.x, q.y + 2); g.stroke();
    g.fillStyle = '#5a3a1a'; g.fillRect(this.x0 - 5, this.y - 40, 8, 46); g.fillRect(this.x1 - 3, this.y - 40, 8, 46);
  }
}

/* ---------- bandera de tela ---------- */
class Flag {
  constructor(x, y, w = 46, h = 30, col = '#c2432f', emblem = null) {
    this.x = x; this.y = y; this.cw = 7; this.ch = 5; this.w = w; this.h = h; this.col = col; this.emblem = emblem; this.raised = 0; this.p = [];
    for (let j = 0; j < this.ch; j++) for (let i = 0; i < this.cw; i++) { const x0 = x + i * w / (this.cw - 1), y0 = y + j * h / (this.ch - 1); this.p.push({ x: x0, y: y0, px: x0, py: y0 }); }
  }
  update(dt, wind, t) {
    const sx = this.w / (this.cw - 1), sy = this.h / (this.ch - 1);
    for (let j = 0; j < this.ch; j++) for (let i = 0; i < this.cw; i++) {
      const q = this.p[j * this.cw + i];
      if (i === 0) { q.x = this.x; q.y = this.y + j * sy; continue; }
      const vx = (q.x - q.px) * .97, vy = (q.y - q.py) * .97; q.px = q.x; q.py = q.y;
      q.x += vx + (60 + wind * .2 + Math.sin(t * 3 + j * .7 + i) * 40) * dt * dt * 20; q.y += vy + 280 * dt * dt + Math.sin(t * 4.3 + i * .9) * .12;
    }
    for (let k = 0; k < 4; k++) for (let j = 0; j < this.ch; j++) for (let i = 0; i < this.cw; i++) {
      const a = this.p[j * this.cw + i];
      if (i < this.cw - 1) this._c(a, this.p[j * this.cw + i + 1], sx, i === 0);
      if (j < this.ch - 1) this._c(a, this.p[(j + 1) * this.cw + i], sy, i === 0);
    }
  }
  _c(a, b, len, pinA) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - len) / d; if (pinA) { b.x -= dx * f; b.y -= dy * f; } else { a.x += dx * f * .5; a.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; } }
  draw(g) {
    g.fillStyle = '#5a3b22'; g.fillRect(this.x - 4, this.y - 6, 5, this.h + 120);
    for (let j = 0; j < this.ch - 1; j++) for (let i = 0; i < this.cw - 1; i++) {
      const a = this.p[j * this.cw + i], b = this.p[j * this.cw + i + 1], c = this.p[(j + 1) * this.cw + i + 1], d = this.p[(j + 1) * this.cw + i];
      const shade = .75 + .25 * Math.sin((b.y - a.y) * .3 + i);
      g.fillStyle = rgba(scalec(hex2rgb(this.col), shade)); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fill();
    }
    if (this.emblem) { const c = this.p[2 * this.cw + 3]; g.fillStyle = '#ffe9a0'; g.font = '14px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.emblem, c.x, c.y); }
  }
}

/* ---------- objetos físicos ---------- */
const PROP_DEFS = {
  barrel: { r: 16, h: 34, w: 30, mass: 1.2, hp: 20, col: [150, 100, 60], floats: true, coins: 4 },
  crate: { r: 18, h: 34, w: 34, mass: 1.4, hp: 16, col: [170, 130, 80], floats: true, coins: 3, box: true },
  coconut: { r: 8, h: 16, w: 16, mass: .4, hp: 4, col: [110, 70, 40], floats: true, coins: 1, rolls: true, dmg: 14 },
  rock: { r: 14, h: 28, w: 28, mass: 3, hp: 999, col: [130, 130, 140], floats: false, rolls: true, dmg: 20 },
  pot: { r: 12, h: 26, w: 24, mass: .8, hp: 6, col: [190, 120, 80], floats: false, coins: 5 },
  log: { r: 12, h: 18, w: 90, mass: 2, hp: 999, col: [130, 90, 50], floats: true, raft: true }
};
class Prop {
  constructor(game, type, x, y, o = {}) {
    const D = PROP_DEFS[type]; Object.assign(this, D, o); this.type = type; this.game = game;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.rot = 0; this.vr = 0; this.onGround = false; this.dead = false; this.dropT = 0; this.hpMax = this.hp; this.lastHit = -1; this.flash = 0;
  }
  update(dt) {
    const W = this.game.world, L = W.liquidAt(this.x, this.y - this.h * .4);
    if (L && this.floats) {
      const surf = L.curLevel + (L.surface ? L.surface.at(this.x) : 0);
      const depth = this.y - this.h * .45 - surf;
      this.vy += (-depth * 22 - this.vy * 2.2) * dt * 4; this.vx *= Math.exp(-1.2 * dt); this.vr *= .96;
      if (L.flow) this.vx += L.flow * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.rot = Math.sin(this.game.t * 1.5 + this.x * .01) * .08 + (L.surface ? (L.surface.at(this.x + 10) - L.surface.at(this.x - 10)) * .02 : 0);
      this.inLiquid = L; return;
    }
    if (L && L.type === 'lava') { FX.splash(this.x, L.curLevel, 'lava', .6); FX.smoke(this.x, L.curLevel, 6); this.dead = true; return; }
    this.vy = Math.min(this.vy + 1800 * dt, 1100); this.justLanded = false;
    const before = this.vy;
    W.move(this, dt);
    if (this.justLanded && before > 300) { FX.land(this.x, this.y, before * this.mass); Sound.play('land', Math.min(1, before / 900)); if (this.type === 'rock') this.game.shake(3, .1); if (this.vy === 0 && before > 600 && this.box) { this.vy = -before * .2; } }
    if (this.onGround) { this.vx *= Math.exp(-(this.rolls ? 1.2 : 6) * dt); if (this.rolls) this.vr = this.vx / this.r; else this.vr *= .7; }
    this.rot += this.vr * dt; if (!this.rolls && this.onGround) this.rot *= .8;
    if (this.wall) this.vx *= -.4;
    this.flash -= dt;
  }
  push(vx) { if (this.onGround) this.vx = approach(this.vx, vx, 400 * (1 / this.mass) * (1 / 60) * 20); }
  hit(dmg, dir, info) {
    this.vx += dir * (info.kb || 200) / this.mass; this.vy -= (info.up ? 400 : 160) / this.mass; this.vr += dir * 8; this.flash = .1;
    FX.sparks(this.x, this.y - this.h / 2, rgbBright(this.col), 6, dir); Sound.play('block');
    if (this.hp < 900) { this.hp -= dmg; if (this.hp <= 0) this.breakApart(); }
  }
  breakApart() {
    this.dead = true; FX.chunks(this.x, this.y - this.h / 2, this.col, this.box ? 10 : 7, 320, .9); FX.land(this.x, this.y, 400); Sound.play('crumble');
    if (this.coins) this.game.dropCoins(this.x, this.y - 20, this.coins + RI(0, 3));
    if (this.contents) this.game.dropItem(this.x, this.y - 20, this.contents);
  }
  draw(g) {
    g.save(); g.translate(this.x, this.y - this.h / 2); g.rotate(this.rot);
    const ff = this.flash > 0;
    if (this.type === 'barrel') {
      const gr = g.createLinearGradient(-15, 0, 15, 0); gr.addColorStop(0, '#6a4424'); gr.addColorStop(.4, '#b07a44'); gr.addColorStop(1, '#5a3a1e');
      g.fillStyle = ff ? '#fff' : gr; g.beginPath(); g.ellipse(0, 0, 15, 17, 0, 0, TAU); g.fill();
      g.strokeStyle = '#3a3a40'; g.lineWidth = 3; for (const y of [-9, 9]) { g.beginPath(); g.moveTo(-14, y); g.quadraticCurveTo(0, y + 2, 14, y); g.stroke(); }
    } else if (this.type === 'crate') {
      g.fillStyle = ff ? '#fff' : '#b88a50'; g.fillRect(-17, -17, 34, 34); g.strokeStyle = '#6a4a24'; g.lineWidth = 3; g.strokeRect(-15.5, -15.5, 31, 31);
      g.beginPath(); g.moveTo(-15, -15); g.lineTo(15, 15); g.moveTo(15, -15); g.lineTo(-15, 15); g.stroke();
      if (this.contents) { g.fillStyle = '#ffd040'; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill(); }
    } else if (this.type === 'coconut') {
      g.fillStyle = ff ? '#fff' : '#6a4424'; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.fillStyle = '#3a2410'; g.beginPath(); g.arc(-2, -2, 1.3, 0, TAU); g.arc(2, -2, 1.3, 0, TAU); g.arc(0, 2, 1.3, 0, TAU); g.fill();
    } else if (this.type === 'rock') {
      g.fillStyle = ff ? '#fff' : '#8a8a98'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = 14 * (.85 + hash1(i * 7) * .25); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = '#4a4a58'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-4, -6, 5, 3, -.4, 0, TAU); g.fill();
    } else if (this.type === 'pot') {
      g.fillStyle = ff ? '#fff' : '#c07848'; g.beginPath(); g.moveTo(-7, -13); g.lineTo(7, -13); g.quadraticCurveTo(14, -4, 10, 10); g.quadraticCurveTo(0, 15, -10, 10); g.quadraticCurveTo(-14, -4, -7, -13); g.fill();
      g.strokeStyle = '#7a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.stroke();
    } else if (this.type === 'log') {
      g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(-45, -9, 90, 18, 9); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.5; for (let i = -30; i < 40; i += 18) { g.beginPath(); g.moveTo(i, -7); g.quadraticCurveTo(i + 6, 0, i, 7); g.stroke(); }
      g.fillStyle = '#c89a60'; g.beginPath(); g.ellipse(44, 0, 4, 8, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
}
function rgbBright(c) { return mixc(c, [255, 255, 255], .5); }

/* ---------- plataformas blandas (nube / seta) ---------- */
function softPlatformUpdate(p, dt, heroOn, heroVy) {
  p.sv = p.sv || 0; p.sd = p.sd || 0;
  if (heroOn && !p.wasOn && heroVy > 200) p.sv += heroVy * .02;
  p.wasOn = heroOn;
  const k = p.soft === 'cap' ? 260 : 140, damp = p.soft === 'cap' ? 6 : 4.5;
  p.sv += (-k * p.sd - damp * p.sv + (heroOn ? 40 : 0)) * dt; p.sd += p.sv * dt;
  p.y = p.baseY + p.sd;
}
function drawCloudPlatform(g, p, t) {
  const sq = 1 + p.sd * .006;
  g.save(); g.translate(p.x + p.w / 2, p.baseY + p.sd * .7); g.scale(1 + (p.sd > 0 ? p.sd * .004 : 0), 1 / sq);
  const w = p.w, n = Math.max(3, Math.round(w / 26));
  g.fillStyle = 'rgba(170,190,230,.9)'; for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n; g.beginPath(); g.arc(x, 12, w / n * .7, 0, TAU); g.fill(); }
  g.fillStyle = '#fff'; for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n, r = w / n * (.72 + Math.sin(t * 1.5 + i) * .04); g.beginPath(); g.arc(x, 4, r, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < n - 1; i++) { const x = -w / 2 + (i + 1) * w / n; g.beginPath(); g.arc(x, -2, w / n * .55, 0, TAU); g.fill(); }
  g.restore();
}
function drawCapPlatform(g, p, t) {
  const sq = clamp(1 - p.sd * .012, .6, 1.3);
  g.save(); g.translate(p.x + p.w / 2, p.baseY + 4);
  g.fillStyle = '#e8e0d8'; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-14, 60, -8, 140); g.lineTo(8, 140); g.quadraticCurveTo(14, 60, 10, 0); g.fill();
  g.translate(0, p.sd * .8); g.scale(1 / sq, sq);
  const gr = g.createRadialGradient(-p.w * .2, -22, 4, 0, -10, p.w * .7); gr.addColorStop(0, '#ff9ae0'); gr.addColorStop(.6, '#d24aa8'); gr.addColorStop(1, '#7a1a6a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, p.w / 2 + 8, 26, 0, Math.PI, 0); g.quadraticCurveTo(0, 12, -p.w / 2 - 8, 0); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * p.w * .17, -14 + Math.abs(i) * 4, 4, 0, TAU); g.fill(); }
  g.restore();
}
