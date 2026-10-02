"use strict";
/* =====================================================================
   COMBATE DE ENEMIGOS (v2) — repertorios de ataques variados.
   Regla de diseño: todo golpe fuerte se AVISA (zona roja + sonido + pose)
   para que el jugador pueda leerlo; los enemigos eligen el ataque según la
   distancia, no repiten el mismo dos veces seguidas y se enfurecen al
   quedarles poca vida.
   ===================================================================== */

/* ---------- zonas de peligro ---------- */
function warn(G, o) { (G.warnings || (G.warnings = [])).push(Object.assign({ t0: G.t, life: .6, col: [255, 60, 50] }, o)); }
function drawWarnings(g, G) {
  if (!G.warnings || !G.warnings.length) return;
  G.warnings = G.warnings.filter(w => G.t - w.t0 < w.life);
  for (const w of G.warnings) {
    const k = (G.t - w.t0) / w.life, a = .18 + .22 * Math.abs(Math.sin(G.t * 18)) * (1 - k * .3), c = w.col;
    g.save();
    if (w.type === 'circle') {
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`; g.beginPath(); g.ellipse(w.x, w.y, w.r, w.r * (w.flat ?? .22), 0, 0, TAU); g.fill();
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},.9)`; g.lineWidth = 2.5; g.setLineDash([10, 7]); g.lineDashOffset = -G.t * 40; g.stroke(); g.setLineDash([]);
      g.beginPath(); g.ellipse(w.x, w.y, w.r * k, w.r * (w.flat ?? .22) * k, 0, 0, TAU); g.stroke();
    } else {
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`; g.fillRect(w.x, w.y, w.w, w.h);
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},.9)`; g.lineWidth = 2.5; g.setLineDash([12, 8]); g.lineDashOffset = -G.t * 50; g.strokeRect(w.x, w.y, w.w, w.h); g.setLineDash([]);
      // barra de "carga" del aviso
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.55)`; g.fillRect(w.x, w.y + w.h - 4, w.w * k, 4);
    }
    g.restore();
  }
}
const gY = (e, x) => { const y = e.game.world.groundY(x), ref = e.hero.onGround ? e.hero.y : e.game.world.groundY(e.hero.x); return isFinite(y) && Math.abs(y - ref) < 220 ? y : (isFinite(ref) ? ref : e.y); };
const tierOf = e => (e.game.worldDef && e.game.worldDef.n) || 1;
const diffK = () => ({ relax: .6, normal: 1, hard: 1.2, night: 1.4 })[Store.data.settings.diff] || 1;
/* elige un ataque: [nombre, peso, condición] sin repetir el anterior y con enfriamientos */
function pickMove(e, list) {
  e.cd = e.cd || {};
  const ok = list.filter(m => m[1] > 0 && (m[2] === undefined || m[2]) && !(e.cd[m[0]] > e.t));
  if (!ok.length) return null;
  let tot = 0; const w = ok.map(m => { const v = m[1] * (m[0] === e.lastMove ? .25 : 1); tot += v; return v; });
  let r = rnd() * tot; for (let i = 0; i < ok.length; i++) { r -= w[i]; if (r <= 0) { e.lastMove = ok[i][0]; return ok[i][0]; } }
  return ok[0][0];
}
const rageOf = e => e.hp < e.maxHp * .4;
function enrage(e) { if (!e.enraged && rageOf(e)) { e.enraged = true; FX.text(e.x, e.y - e.h - 30, 'RAGE!', '#ff5050', 30); Sound.play('roar', 1.6); e.game.shake(4, .2); } }
function rageGlow(g, e) { if (e.enraged) glowAt(g, [255, 60, 40], e.x, e.y - e.h / 2, Math.max(e.w, e.h) * 1.1, .25 + Math.sin(e.t * 10) * .08); }

/* =================== 1. CANGREJO ACORAZADO =================== */
Crab.prototype.ai = function (dt) {
  const H = this.hero, d = Math.abs(this.dx), dy = Math.abs(H.y - this.y), G = this.game, T = tierOf(this); enrage(this);
  const spd = (this.enraged ? 1.35 : 1) * diffK(), st = this.st;
  this.armorFront = !['tired', 'dizzy'].includes(st);
  if (st === 'walk') {
    this.vx = this.face * 55 * spd; if (this.wall || this.edgeAhead(this.face) || Math.abs(this.x - this.home) > 140) { this.face *= -1; this.x += this.face * 2; }
    if (dy < 90 && d < 440 && this.stT > (this.enraged ? .45 : .9) / diffK() && this.scared <= 0) {
      this.facePlayer();
      const m = pickMove(this, [['lunge', d < 280 ? 3 : 1], ['slam', d < 200 ? 2.5 : .5], ['spray', d > 160 ? 2 : .4], ['spin', (T >= 2 || this.enraged) && d > 120 ? 1.6 : 0]]);
      if (m === 'lunge') { this.set('aim'); this.telegraph(55); warn(G, { x: this.face > 0 ? this.x : this.x - 190, y: this.y - 26, w: 190, h: 26, life: .55 / spd }); }
      if (m === 'slam') { this.set('slamUp'); this.telegraph(48); for (const s of [-1, 1]) warn(G, { x: s > 0 ? this.x + 20 : this.x - 280, y: this.y - 16, w: 260, h: 16, life: .7 / spd }); }
      if (m === 'spray') { this.set('spray'); Sound.play('bubble'); }
      if (m === 'spin') { this.set('spinUp'); this.telegraph(62); }
    }
  } else if (st === 'aim') { this.vx = 0; if (this.stT > .55 / spd) { this.set('lunge'); this.vx = this.face * 470 * spd; this.vy = -180; Sound.play('swing'); } }
  else if (st === 'lunge') { this.vx *= .96; if (this.stT > .35) this.set('tired'); }
  else if (st === 'tired') { this.vx *= .85; if (this.stT > .8 / spd) this.set('walk'); }
  else if (st === 'slamUp') { this.vx = 0; if (this.stT > .7 / spd) { this.set('slam'); const y = this.y; FX.slam(this.x, y, 1); Sound.play('slam', .8); G.shake(8, .25); Input.rumble(.4, .3, 150); FX.text(this.x, y - 60, 'CLANG!', '#ffd27a', 30); G.spawnShockwave(this.x + 20, y, 1, 280, 12); G.spawnShockwave(this.x - 20, y, -1, 280, 12); } }
  else if (st === 'slam') { if (this.stT > .55) this.set('tired'); }
  else if (st === 'spray') {
    this.vx = 0; this.facePlayer(); this.shots = this.shots || 0;
    const n = this.enraged ? 5 : 3, k = Math.floor((this.stT - .25) / .18);
    if (this.stT > .25 && k >= this.shots && this.shots < n) { this.shots++; G.spawnProjectile({ owner: 'enemy', kind: 'bubble', x: this.x + this.face * 20, y: this.y - 26, vx: this.face * R(170, 300), vy: -R(260, 420), g: 700, r: 10, dmg: 9, life: 3.5, bounce: true, poppable: true }); Sound.play('bubble'); }
    if (this.stT > .4 + n * .18) { this.shots = 0; this.set('walk'); }
  }
  else if (st === 'spinUp') { this.vx = 0; this.rot = (this.rot || 0) + dt * 30 * this.stT; if (this.stT > .5 / spd) { this.set('spin'); Sound.play('dash'); this.armorFront = false; } }
  else if (st === 'spin') {
    this.rot += dt * 26 * this.face; this.vx = approach(this.vx, Math.sign(this.dx) * 430 * spd, 900 * dt); this.face = Math.sign(this.vx) || this.face;
    if (chance(.5)) FX.footstep(this.x, this.y, -this.face, 500); if (this.wall) { this.vx *= -1; G.shake(3, .1); FX.sparks(this.x, this.y - 14, [255, 230, 200], 8); }
    if (this.stT > 2) { this.set('dizzy'); this.vx = 0; }
  }
  else if (st === 'dizzy') { this.vx *= .85; if (this.stT > 1.3) this.set('walk'); }
};
Crab.prototype.attackBoxes = function () {
  const st = this.st;
  if (st === 'lunge') return [{ x: this.x + (this.face > 0 ? 6 : -46), y: this.y - 30, w: 40, h: 26, dmg: 16 }];
  if (st === 'slam' && this.stT < .12) return [{ x: this.x - 70, y: this.y - 50, w: 140, h: 50, dmg: 16 }];
  if (st === 'spin') return [{ x: this.x - 26, y: this.y - 30, w: 52, h: 30, dmg: 14, parryable: true }];
  return [];
};
Crab.prototype.onParried = function () { if (this.st === 'spin' || this.st === 'lunge') { this.set('dizzy'); this.stun = 1.2; this.vx = -this.face * 260; FX.text(this.x, this.y - 50, 'STUNNED!', '#c8e0ff', 24); } };
(() => { const d0 = Crab.prototype.draw; Crab.prototype.draw = function (g) {
  if (this.st === 'spin' || this.st === 'spinUp') { // se esconde en el caparazón y gira
    const ff = this.flashFill(g); g.save(); g.translate(this.x, this.y - 16); g.rotate(this.rot || 0);
    g.fillStyle = ff || '#e8603a'; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); g.fillStyle = ff || '#b03c22'; g.beginPath(); g.arc(0, 0, 20, .2, Math.PI - .2); g.fill();
    g.strokeStyle = '#ffb08a'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 12, i * 2.1, i * 2.1 + 1); g.stroke(); }
    g.restore(); if (this.st === 'spin' && chance(.6)) FX.afterimage({ x: this.x, y: this.y, draw: (gg, s, a) => { gg.fillStyle = `rgba(255,140,100,${.35 * a})`; gg.beginPath(); gg.arc(s.x, s.y - 16, 20, 0, TAU); gg.fill(); } });
    this.hpBar(g); this.drawTele(g); return;
  }
  const keep = this.st; if (keep === 'slamUp' || keep === 'spray') this.st = 'aim'; d0.call(this, g); this.st = keep;
  if (keep === 'dizzy' || keep === 'tired') for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(this.x + Math.cos(a) * 16, this.y - 46 + Math.sin(a) * 4, 2.5, 0, TAU); g.fill(); }
}; })();
Crab.prototype.drawGlow = function (g) { Enemy.prototype.drawGlow.call(this, g); rageGlow(g, this); if (this.st === 'slamUp') glowAt(g, [255, 220, 160], this.x, this.y - 50, 40 + this.stT * 50, .5); };

/* =================== 2. MEDUSA ELÉCTRICA =================== */
Jelly.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK();
  const st = this.st;
  if (st === 'float') {
    this.vx = Math.sin(this.t * .8) * 30 + Math.sign(this.dx) * (d < 360 ? 26 : 0); this.vy = (this.by + Math.sin(this.t * 1.7) * 18 - this.y) * 3;
    if (this.stT > 1.3 / spd && d < 420) {
      const m = pickMove(this, [['zap', d < 150 ? 3 : .3], ['strike', d > 90 ? 2 : .5], ['orbs', d > 140 && T >= 1 ? 1.6 : 0], ['dive', H.y > this.y + 40 && Math.abs(this.dx) < 160 ? 1.5 : 0]]);
      if (m === 'zap') { this.set('charge'); this.telegraph(70); Sound.play('charge'); warn(G, { type: 'circle', x: this.x, y: this.y - 17, r: 85, flat: 1, life: .8 / spd, col: [190, 140, 255] }); }
      if (m === 'strike') { this.set('strikeUp'); this.tx = H.x; Sound.play('charge'); warn(G, { x: H.x - 34, y: gY(this, H.x) - 260, w: 68, h: 260, life: .85 / spd, col: [200, 160, 255] }); }
      if (m === 'orbs') { this.set('orbs'); this.shots = 0; }
      if (m === 'dive') { this.set('diveUp'); this.telegraph(80); }
    }
  }
  else if (st === 'charge') { this.vx *= .9; this.vy *= .9; if (this.stT > .8 / spd) { this.set('zap'); Sound.play('zap'); FX.ring(this.x, this.y - 17, [200, 170, 255], 85, .3); G.shake(2, .1); } }
  else if (st === 'zap') { if (this.stT > .35) this.set('float'); }
  else if (st === 'strikeUp') { this.vx = (this.tx - this.x) * .8; this.vy = (this.by - 20 - this.y) * 2; if (this.stT > .85 / spd) { this.set('strike'); const y = gY(this, this.tx); G.lightning(this.tx, y - 300, this.tx, y); G.dealAreaToHero(this.tx, y - 60, 40, 14, false); FX.sparks(this.tx, y, [220, 200, 255], 14, 0, 400); G.shake(5, .2); } }
  else if (st === 'strike') { if (this.stT > .5) this.set('float'); }
  else if (st === 'orbs') {
    this.vx *= .9; this.vy = (this.by - this.y) * 2; const n = this.enraged ? 5 : 3;
    if (this.stT > .3 + this.shots * .25 && this.shots < n) { this.shots++; const a = Math.atan2(H.y - 30 - this.y, H.x - this.x) + R(-.25, .25); G.spawnProjectile({ owner: 'enemy', kind: 'orb', x: this.x, y: this.y - 17, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 9, dmg: 9, life: 3.5, parryable: true, poppable: true }); Sound.play('zap'); }
    if (this.stT > .6 + n * .25) this.set('float');
  }
  else if (st === 'diveUp') { this.vy = -60; this.vx = 0; if (this.stT > .5 / spd) { this.set('dive'); const a = Math.atan2(H.y - 20 - this.y, H.x - this.x); this.vx = Math.cos(a) * 520; this.vy = Math.sin(a) * 520; Sound.play('whoosh'); } }
  else if (st === 'dive') { this.vx *= .97; this.vy *= .97; if (this.stT > .7) { this.set('float'); } }
};
Jelly.prototype.attackBoxes = function () {
  if (this.st === 'zap') return [{ x: this.x - 85, y: this.y - 100, w: 170, h: 170, dmg: 14, circle: { x: this.x, y: this.y - 17, r: 85 } }];
  if (this.st === 'dive') return [{ x: this.x - 18, y: this.y - 36, w: 36, h: 40, dmg: 12 }];
  return [];
};

/* =================== 3. GAVIOTA =================== */
Gull.prototype.ai = function (dt) {
  const H = this.hero, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'patrol') {
    this.vx = this.face * 120; this.vy = (this.by + Math.sin(this.t * 2) * 12 - this.y) * 2; if (Math.abs(this.x - this.home) > 220) this.face = -Math.sign(this.x - this.home);
    if (Math.abs(this.dx) < 380 && H.y > this.y && this.stT > 1.1 / spd) {
      const m = pickMove(this, [['dive', 3], ['feathers', T >= 1 ? 2 : .8], ['egg', Math.abs(this.dx) < 220 ? 1.6 : .4]]);
      if (m === 'dive') { this.set('hover'); this.telegraph(84); }
      if (m === 'feathers') { this.set('fanUp'); this.telegraph(90); }
      if (m === 'egg') { this.set('eggRun'); Sound.play('telegraph', 96); }
    }
  }
  else if (st === 'hover') { this.facePlayer(); this.vx = (H.x - this.x - this.face * 160) * 2; this.vy = (H.y - 220 - this.y) * 2; if (this.stT > .75 / spd) { this.set('dive'); const a = Math.atan2(H.y - 20 - this.y, H.x - this.x); this.vx = Math.cos(a) * 640 * spd; this.vy = Math.sin(a) * 640 * spd; Sound.play('whoosh'); } else if (this.stT > .4) { const a = Math.atan2(H.y - 20 - this.y, H.x - this.x), L = 260; this._aim = a; } }
  else if (st === 'dive') { if (this.stT > .7 || this.y > H.y + 20) this.set('rise'); }
  else if (st === 'rise') { this.vy = -260; this.vx *= .97; if (this.y < this.by) this.set('patrol'); }
  else if (st === 'fanUp') { this.facePlayer(); this.vx = (H.x - this.x - this.face * 220) * 1.5; this.vy = (H.y - 200 - this.y) * 2;
    if (this.stT > .6 / spd) { const n = this.enraged ? 5 : 3, base = Math.atan2(H.y - 30 - this.y, H.x - this.x); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * .2; G.spawnProjectile({ owner: 'enemy', kind: 'feather', x: this.x, y: this.y - 10, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 7, dmg: 8, life: 2.5, parryable: true, delay: i * .05 }); } Sound.play('arrow'); this.set('rise'); } }
  else if (st === 'eggRun') { // pasa por encima y suelta un huevo-bomba
    this.facePlayer(); this.vx = this.face * 260; this.vy = (H.y - 240 - this.y) * 2;
    if (Math.abs(this.dx) < 30 || this.stT > 1.6) { G.spawnProjectile({ owner: 'enemy', kind: 'bomb', x: this.x, y: this.y, vx: this.vx * .3, vy: 0, g: 900, r: 9, dmg: 16, life: 3, fuse: .9, bounce: true }); warn(G, { type: 'circle', x: this.x + this.vx * .2, y: gY(this, this.x), r: 80, life: .9 }); Sound.play('swing'); this.set('rise'); }
  }
};
Gull.prototype.attackBoxes = function () { return this.st === 'dive' ? [{ x: this.x - 16, y: this.y - 22, w: 32, h: 24, dmg: 12 }] : []; };

/* =================== 4. ERIZO RODANTE =================== */
Urchin.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'idle') {
    this.vx *= .9;
    if (d < 380 && Math.abs(H.y - this.y) < 100 && this.stT > .8 / spd) {
      this.facePlayer(); const m = pickMove(this, [['roll', 3], ['burst', d < 200 && T >= 1 ? 2 : .6], ['bounce', d > 140 && T >= 2 ? 1.5 : 0]]);
      if (m === 'roll') { this.set('curl'); this.telegraph(48); warn(G, { x: this.face > 0 ? this.x : this.x - 320, y: this.y - 26, w: 320, h: 26, life: .6 / spd }); }
      if (m === 'burst') { this.set('swell'); this.telegraph(40); warn(G, { type: 'circle', x: this.x, y: this.y - 13, r: 120, flat: .9, life: .8 / spd }); }
      if (m === 'bounce') { this.set('curl2'); this.telegraph(52); }
    }
  }
  else if (st === 'curl' || st === 'curl2') { this.rot += dt * 30 * this.stT; if (this.stT > .6 / spd) { if (st === 'curl') { this.set('roll'); Sound.play('dash'); } else { this.set('bounce'); this.hops = 0; } } }
  else if (st === 'roll') { this.vx = this.face * 560 * spd; this.rot += this.face * dt * 22; if (chance(.5)) FX.footstep(this.x, this.y, -this.face, 500); if (this.wall) { this.face *= -1; G.shake(2, .1); FX.sparks(this.x, this.y - 13, [255, 255, 200], 6); } if (this.stT > 1.6) this.set('dizzy'); }
  else if (st === 'bounce') { // rebota hacia el héroe en saltos que aplastan
    this.rot += this.face * dt * 18;
    if (this.onGround && this.stT > .15) { if (this.hops >= 3) { this.set('dizzy'); return; } this.hops++; this.facePlayer(); this.vy = -620; this.vx = clamp(this.dx * 1.3, -380, 380); this.stT = 0; Sound.play('bounce'); warn(G, { type: 'circle', x: this.x + this.vx * .62, y: gY(this, this.x + this.vx * .62), r: 50, life: .6 }); if (this.hops > 1) { FX.slam(this.x, this.y, .5); G.spawnShockwave(this.x, this.y, 1, 120, 8); G.spawnShockwave(this.x, this.y, -1, 120, 8); } }
  }
  else if (st === 'swell') { this.vx = 0; if (this.stT > .8 / spd) { const n = this.enraged ? 12 : 8; for (let i = 0; i < n; i++) { const a = -Math.PI + i / (n - 1) * Math.PI; G.spawnProjectile({ owner: 'enemy', kind: 'feather', col: [120, 70, 170], x: this.x, y: this.y - 13, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 6, dmg: 8, life: .55, parryable: false }); } Sound.play('arrow'); FX.ring(this.x, this.y - 13, [200, 150, 255], 60, .2); this.set('dizzy'); } }
  else if (st === 'dizzy') { this.vx *= .9; if (this.stT > 1.2) this.set('idle'); }
};
Urchin.prototype.attackBoxes = function () { return this.st === 'roll' || this.st === 'bounce' ? [{ x: this.x - 16, y: this.y - 28, w: 32, h: 28, dmg: 14, parryable: this.st === 'roll' }] : []; };
(() => { const d0 = Urchin.prototype.draw; Urchin.prototype.draw = function (g) { const k = this.st, sw = k === 'swell' ? 1 + this.stT * .5 : 1; if (k === 'curl2' || k === 'bounce') this.st = 'roll'; if (sw > 1) { g.save(); g.translate(this.x, this.y - 13); g.scale(sw, sw); g.translate(-this.x, -this.y + 13); } d0.call(this, g); if (sw > 1) g.restore(); this.st = k; }; })();

/* =================== 5. ARQUERO PIRATA =================== */
Archer.prototype.ai = function (dt) {
  const H = this.hero, d = Math.abs(this.dx), G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  this.vx *= .8;
  if (st === 'idle') {
    if (d < 70 && this.stT > .3) { this.facePlayer(); this.set('kick'); this.telegraph(70); return; }
    if (d < 680 && this.stT > 1 / spd) {
      this.facePlayer(); const m = pickMove(this, [['draw', 3], ['volley', T >= 1 && d > 160 ? 2 : 0], ['rain', T >= 2 && d > 200 ? 1.5 : (T >= 1 ? .5 : 0)], ['hop', d < 180 ? 2 : 0]]);
      if (m === 'draw') { this.set('draw'); Sound.play('telegraph', 64); }
      if (m === 'volley') { this.set('draw'); this.volley = true; Sound.play('telegraph', 70); }
      if (m === 'rain') { this.set('rainUp'); Sound.play('telegraph', 76); this.rainX = []; for (let i = 0; i < (this.enraged ? 6 : 4); i++) { const x = H.x + (i - 1.5) * 70 + R(-15, 15); this.rainX.push(x); warn(G, { type: 'circle', x, y: gY(this, x), r: 34, life: 1.3 / spd }); } }
      if (m === 'hop') { this.vx = -this.face * 300; this.vy = -420; this.set('idle'); this.stT = .6; }
    }
  }
  else if (st === 'draw') { this.facePlayer(); if (this.stT > .95 / spd) { if (this.volley) { for (let i = -1; i <= 1; i++) this.fire(i * .12); this.volley = false; } else this.fire(0); this.set('reload'); } }
  else if (st === 'reload') { if (this.stT > 1.2 / spd) this.set('idle'); if (d < 90) { this.vx = -this.face * 240; this.vy = -360; this.set('idle'); } }
  else if (st === 'kick') { if (this.stT > .32 / spd && !this.kicked) { this.kicked = true; Sound.play('swing'); } if (this.stT > .6) { this.kicked = false; this.set('idle'); } }
  else if (st === 'rainUp') { this.facePlayer(); if (this.stT > .5 / spd && !this.shotUp) { this.shotUp = true; Sound.play('arrow'); for (let i = 0; i < 3; i++) G.spawnProjectile({ owner: 'fx', kind: 'arrow', x: this.x, y: this.y - 50, vx: this.face * 40, vy: -700, g: 0, r: 5, dmg: 0, life: .35 }); }
    if (this.stT > 1.3 / spd) { for (const [i, x] of (this.rainX || []).entries()) G.spawnProjectile({ owner: 'enemy', kind: 'arrow', x: x + R(-6, 6), y: gY(this, x) - 520, vx: 0, vy: 900, g: 300, r: 6, dmg: 11, life: 2, parryable: true, delay: i * .06 }); this.shotUp = false; this.set('reload'); } }
};
Archer.prototype.fire = function (spread = 0) {
  const H = this.hero, sx = this.x + this.face * 18, sy = this.y - 36, tx = H.x, ty = H.y - 30;
  const dx = tx - sx, T = Math.max(.35, Math.abs(dx) / 600), vx = dx / T, vy = (ty - sy) / T - 600 * T * .5 - spread * 600;
  this.game.spawnProjectile({ owner: 'enemy', kind: 'arrow', x: sx, y: sy, vx, vy, g: 600, r: 6, dmg: 12, life: 3, parryable: true }); Sound.play('arrow');
};
Archer.prototype.attackBoxes = function () { return this.st === 'kick' && this.stT > .32 && this.stT < .45 ? [{ x: this.x + (this.face > 0 ? 4 : -40), y: this.y - 34, w: 36, h: 26, dmg: 9 }] : []; };

/* =================== 6. ANGUILA =================== */
Eel.prototype.ai = function (dt) {
  const G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'under') {
    this.vx = 0; this.vy = 0; this.y = this.water + 30; this.inv = .1;
    if (Math.abs(this.dx) < 340 && this.stT > 1.3 / spd) {
      const m = pickMove(this, [['leap', 3], ['jet', T >= 1 && Math.abs(this.dx) > 100 ? 2 : 0], ['double', this.enraged || T >= 3 ? 1.5 : 0]]);
      this.tx = this.hero.x; this.leaps = m === 'double' ? 2 : 1;
      if (m === 'jet') { this.set('jetUp'); Sound.play('bubble'); } else { this.set('bubble'); Sound.play('bubble'); warn(G, { x: this.tx - 30, y: this.water - 220, w: 60, h: 220, life: .7 / spd, col: [80, 200, 255] }); }
    }
  }
  else if (st === 'bubble') { this.x = lerp(this.x, this.tx, dt * 2); if (chance(dt * 30)) FX.spawnRaw({ t: 'drop', x: this.x + R(-10, 10), y: this.water, vx: R(-20, 20), vy: R(-200, -80), g: 900, max: .4, s: 2, col: [200, 240, 255] }); if (this.stT > .7 / spd) { this.set('jump'); this.vy = -900; this.vx = Math.sign(this.dx) * 120; FX.splash(this.x, this.water, 'water', 1); Sound.play('splash'); } }
  else if (st === 'jump') { this.vy += 1600 * dt; if (this.vy > 0 && this.y > this.water + 10) { FX.splash(this.x, this.water, 'water', .8); this.leaps--; if (this.leaps > 0) { this.tx = this.hero.x; this.set('bubble'); this.stT = .35; } else this.set('under'); } }
  else if (st === 'jetUp') { this.y = this.water + 8; this.inv = 0; this.face = Math.sign(this.dx) || 1; if (this.stT > .5 / spd) { this.set('jet'); this.shots = 0; } }
  else if (st === 'jet') { this.y = this.water + 4; const n = this.enraged ? 7 : 5; if (this.stT > this.shots * .09 && this.shots < n) { this.shots++; const H = this.hero, a = Math.atan2(H.y - 30 - this.water, H.x - this.x); G.spawnProjectile({ owner: 'enemy', kind: 'bubble', x: this.x, y: this.water - 6, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, g: 200, r: 8, dmg: 7, life: 1.6, poppable: true }); Sound.play('bubble'); } if (this.stT > .4 + n * .09) this.set('under'); }
};
(() => { const d0 = Eel.prototype.draw; Eel.prototype.draw = function (g) { if (this.st === 'jetUp' || this.st === 'jet') { const k = this.st; this.st = 'jump'; const vy = this.vy, vx = this.vx; this.vy = -1; this.vx = this.face * .3; d0.call(this, g); this.st = k; this.vy = vy; this.vx = vx; return; } d0.call(this, g); }; })();

/* =================== 7. SETA SALTARINA =================== */
Shroom.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'hop') {
    if (this.onGround && this.stT > .7 / spd) { this.facePlayer(); this.vy = -380; this.vx = this.face * 110; this.stT = 0; this.hopsN = (this.hopsN || 0) + 1; }
    if (this.onGround) this.vx *= .85;
    if (this.onGround && this.hopsN >= 2 && d < 420) {
      this.hopsN = 0; const m = pickMove(this, [['puff', d < 160 ? 3 : .3], ['mortar', d > 140 && T >= 1 ? 2.2 : (d > 140 ? .8 : 0)], ['stomp', d < 300 && T >= 2 ? 1.6 : 0]]);
      if (m === 'puff') { this.set('swell'); this.telegraph(58); warn(G, { type: 'circle', x: this.x, y: this.y - 20, r: 70, flat: .8, life: .7 / spd, col: [200, 110, 230] }); }
      if (m === 'mortar') { this.set('aim'); this.telegraph(62); this.marks = []; for (let i = 0; i < (this.enraged ? 4 : 3); i++) { const x = H.x + (i - 1) * 90 + R(-20, 20); this.marks.push(x); warn(G, { type: 'circle', x, y: gY(this, x), r: 46, life: 1.4 / spd, col: [200, 110, 230] }); } }
      if (m === 'stomp') { this.set('crouch'); this.telegraph(50); this.tx = H.x; warn(G, { type: 'circle', x: H.x, y: gY(this, H.x), r: 90, life: 1.1 / spd }); }
    }
  }
  else if (st === 'swell') { this.vx = 0; if (this.stT > .7 / spd) { this.set('puff'); G.spawnCloud(this.x, this.y - 20, 70, 2.4, [200, 120, 220]); Sound.play('whoosh'); } }
  else if (st === 'puff') { if (this.stT > 1.2) this.set('hop'); }
  else if (st === 'aim') { this.vx = 0; if (this.stT > .55 / spd) { for (const [i, x] of this.marks.entries()) { const dx = x - this.x, T2 = .85; G.spawnProjectile({ owner: 'enemy', kind: 'bubble', x: this.x, y: this.y - 30, vx: dx / T2, vy: -(gY(this, x) - this.y + 30) / T2 - 900 * T2 * .5 - 60, g: 900, r: 9, dmg: 8, life: 3, delay: i * .12, poppable: true, onLand: (G2, p, fy) => { G2.spawnCloud(p.x, fy - 20, 52, 2, [200, 120, 220]); FX.splash(p.x, fy, 'water', .4); Sound.play('whoosh'); } }); } Sound.play('swing'); this.set('puff'); } }
  else if (st === 'crouch') { this.vx = 0; if (this.stT > .45 / spd) { this.set('leap'); const dx = this.tx - this.x; this.vy = -760; this.vx = clamp(dx / .9, -420, 420); Sound.play('jump'); } }
  else if (st === 'leap') { if (this.onGround && this.stT > .15) { FX.slam(this.x, this.y, .8); G.shake(6, .2); Sound.play('slam', .7); G.spawnShockwave(this.x, this.y, 1, 200, 10); G.spawnShockwave(this.x, this.y, -1, 200, 10); G.spawnCloud(this.x, this.y - 20, 60, 1.6, [200, 120, 220]); this.set('puff'); } }
};
Shroom.prototype.attackBoxes = function () { return this.st === 'leap' && this.vy > 0 ? [{ x: this.x - 20, y: this.y - 36, w: 40, h: 36, dmg: 14 }] : []; };
(() => { const d0 = Shroom.prototype.draw; Shroom.prototype.draw = function (g) { const k = this.st; if (k === 'aim' || k === 'crouch') { this.st = 'swell'; const t = this.stT; this.stT = Math.min(.5, t); d0.call(this, g); this.stT = t; this.st = k; } else d0.call(this, g); }; })();

/* =================== 8. LOBO SOMBRA =================== */
Wolf.prototype.ai = function (dt) {
  const H = this.hero, d = Math.abs(this.dx), G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.25 : 1) * diffK(), st = this.st;
  if (st === 'stalk') {
    this.facePlayer(); const want = 200; this.vx = approach(this.vx, Math.sign(d - want) * this.face * 140, 800 * dt);
    if (this.stT > R(.8, 1.4) / spd && Math.abs(H.y - this.y) < 140) {
      const m = pickMove(this, [['feint', this.feints < 2 ? 1.2 : 0], ['dash', 2.5], ['pounce', d > 120 ? 1.8 : .4], ['claws', T >= 1 && d > 160 ? 1.6 : 0], ['combo', d < 110 ? 3 : 0]]);
      this.set(m === 'dash' ? 'crouch' : m === 'pounce' ? 'pounceUp' : m === 'claws' ? 'clawUp' : m);
      if (m === 'dash') { this.telegraph(60); warn(G, { x: this.face > 0 ? this.x : this.x - 320, y: this.y - 34, w: 320, h: 34, life: .5 / spd, col: [190, 120, 255] }); }
      if (m === 'pounce') { this.telegraph(66); this.tx = H.x; warn(G, { type: 'circle', x: H.x, y: gY(this, H.x), r: 56, life: .6 / spd, col: [190, 120, 255] }); }
      if (m === 'claws') { this.telegraph(72); }
      if (m === 'combo') { this.hits = 0; this.telegraph(78); }
    }
  }
  else if (st === 'feint') { this.vx = this.face * 300; if (this.stT > .15) { this.feints++; this.vx = -this.face * 200; this.set('stalk'); FX.afterimage({ x: this.x, y: this.y, draw: (gg, s, a) => this.ghost(gg, s, a) }); } }
  else if (st === 'crouch') { this.vx = 0; if (this.stT > .5 / spd) { this.set('dash'); this.feints = 0; Sound.play('dash'); G.flashGlint(this.x, this.y - 20); } }
  else if (st === 'dash') { this.vx = this.face * 980 * spd; if (chance(.7)) FX.afterimage({ x: this.x, y: this.y, draw: (gg, s, a) => this.ghost(gg, s, a) }); if (this.stT > .32 || this.wall) this.set('skid'); }
  else if (st === 'skid') { this.vx *= .88; if (chance(.6)) FX.footstep(this.x, this.y, this.face, 500); if (this.stT > .6 / spd) this.set('stalk'); }
  else if (st === 'pounceUp') { this.vx = 0; if (this.stT > .45 / spd) { this.set('pounce'); this.vy = -620; this.vx = clamp((this.tx - this.x) / .75, -560, 560); Sound.play('whoosh'); } }
  else if (st === 'pounce') { if (this.onGround && this.stT > .15) { FX.slam(this.x, this.y, .6); G.shake(4, .15); this.set('skid'); } }
  else if (st === 'clawUp') { this.vx = 0; if (this.stT > .55 / spd) { const n = this.enraged ? 3 : 2; for (let i = 0; i < n; i++) G.spawnProjectile({ owner: 'enemy', kind: 'wave', x: this.x + this.face * 30, y: this.y - 22, vx: this.face * (520 + i * 90), vy: 0, r: 16, dmg: 12, life: 1.1, parryable: true, delay: i * .18, ang: 0 }); Sound.play('swing', true); this.set('skid'); } }
  else if (st === 'combo') { // tres zarpazos seguidos
    this.vx = this.face * 80; const k = Math.floor(this.stT / (.28 / spd));
    if (k > this.hits && this.hits < 3) { this.hits = k; Sound.play('swing'); this.facePlayer(); }
    if (this.stT > .95 / spd) this.set('skid');
  }
};
Wolf.prototype.attackBoxes = function () {
  if (this.st === 'dash') return [{ x: this.x - 26, y: this.y - 34, w: 52, h: 32, dmg: 15, parryable: true }];
  if (this.st === 'pounce' && this.vy > 0) return [{ x: this.x - 26, y: this.y - 36, w: 52, h: 36, dmg: 16 }];
  if (this.st === 'combo' && (this.stT % (.28 / ((this.enraged ? 1.25 : 1) * diffK()))) < .1) return [{ x: this.x + (this.face > 0 ? 10 : -56), y: this.y - 40, w: 46, h: 36, dmg: 8, parryable: true }];
  return [];
};

/* =================== 9. ESCARABAJO BOMBARDERO =================== */
Beetle.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  this.armorFront = st === 'charge';
  if (st === 'walk') {
    this.vx = this.face * 40; if (this.wall || this.edgeAhead(this.face) || Math.abs(this.x - this.home) > 120) this.face *= -1;
    if (d < 520 && this.stT > 1.5 / spd) {
      this.facePlayer(); const m = pickMove(this, [['aim', 3], ['carpet', T >= 1 && d > 160 ? 2 : 0], ['charge', d < 300 && T >= 2 ? 1.6 : (d < 200 ? .5 : 0)]]);
      if (m === 'aim') { this.set('aim'); this.telegraph(52); }
      if (m === 'carpet') { this.set('aim'); this.carpet = true; this.telegraph(56); this.marks = []; for (let i = 0; i < 3; i++) { const x = H.x + (i - 1) * 110; this.marks.push(x); warn(G, { type: 'circle', x, y: gY(this, x), r: 80, life: 1.9 / spd, col: [255, 150, 40] }); } }
      if (m === 'charge') { this.set('chargeUp'); this.telegraph(44); warn(G, { x: this.face > 0 ? this.x : this.x - 300, y: this.y - 28, w: 300, h: 28, life: .6 / spd }); }
    }
  }
  else if (st === 'aim') { this.vx = 0; if (this.stT > .6 / spd) { if (this.carpet) { for (const [i, x] of this.marks.entries()) this.throwBombAt(x, i * .22); this.carpet = false; } else this.throwBomb(); this.set('walk'); } }
  else if (st === 'chargeUp') { this.vx = -this.face * 30; if (chance(.4)) FX.footstep(this.x, this.y, -this.face, 300); if (this.stT > .6 / spd) { this.set('charge'); Sound.play('dash'); } }
  else if (st === 'charge') { this.vx = this.face * 420 * spd; if (chance(.6)) FX.footstep(this.x, this.y, -this.face, 500); if (this.wall || this.stT > 1) { if (this.wall) { G.shake(5, .2); FX.slam(this.x + this.face * 20, this.y - 10, .5); this.stun = 1; } this.set('walk'); } }
};
Beetle.prototype.throwBombAt = function (x, delay) { const dx = x - this.x, T = clamp(Math.abs(dx) / 380, .6, 1.3); this.game.spawnProjectile({ owner: 'enemy', kind: 'bomb', x: this.x, y: this.y - 30, vx: dx / T, vy: -500, g: 900, r: 9, dmg: 18, life: 3, fuse: 1.6, bounce: true, delay }); Sound.play('swing'); };
Beetle.prototype.attackBoxes = function () { return this.st === 'charge' ? [{ x: this.x - 22, y: this.y - 28, w: 44, h: 28, dmg: 14, parryable: true }] : []; };
Beetle.prototype.onParried = function () { if (this.st === 'charge') { this.set('walk'); this.stun = 1.4; this.vx = -this.face * 200; FX.text(this.x, this.y - 40, 'FLIPPED!', '#c8e0ff', 24); } };

/* =================== 10. MURCIÉLAGO ÍGNEO =================== */
Bat.prototype.ai = function (dt) {
  const H = this.hero, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'hang') { this.vx = this.vy = 0; if (this.dist < 300) { this.set('wake'); Sound.play('telegraph', 90); this.telegraph(90); } }
  else if (st === 'wake') { this.vy = 60; if (this.stT > .45 / spd) this.next(); }
  else if (st === 'swoop') { const k = this.stT / .9; const x = lerp(this.sx, this.tx + (this.tx - this.sx), k), y = this.sy + Math.sin(k * Math.PI) * (this.ty - this.sy) * 1.1; this.vx = (x - this.x) / dt; this.vy = (y - this.y) / dt; if (chance(.6)) FX.embers(this.x, this.y - 10, 1, 40); if (k >= 1) { this.set('flutter'); this.vx = this.vy = 0; } }
  else if (st === 'flutter') { this.vx = Math.sin(this.t * 3) * 60; this.vy = (this.by + 40 - this.y) * 1.5; if (this.stT > 1.2 / spd) this.next(); }
  else if (st === 'breathUp') { this.vx = (H.x - this.x) * .6; this.vy = (H.y - 190 - this.y) * 2; if (this.stT > .6 / spd) { this.set('breath'); this.shots = 0; } }
  else if (st === 'breath') { this.vx *= .9; this.vy *= .9; const n = this.enraged ? 5 : 3; if (this.stT > this.shots * .14 && this.shots < n) { const a = Math.atan2(H.y - 20 - this.y, H.x - this.x) + (this.shots - (n - 1) / 2) * .18; this.shots++; G.spawnProjectile({ owner: 'enemy', kind: 'fireball', x: this.x, y: this.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 8, dmg: 10, life: 2.5, parryable: true }); Sound.play('explode'); } if (this.stT > .3 + n * .14) this.set('flutter'); }
  else if (st === 'bombUp') { this.vx = (this.tx - this.x) * 3; this.vy = (this.ty - this.y) * 3; if (this.stT > .55 / spd) { this.set('bomb'); this.vx = 0; this.vy = 780; Sound.play('whoosh'); } }
  else if (st === 'bomb') { if (chance(.8)) FX.embers(this.x, this.y - 10, 1, 60); const fy = gY(this, this.x); if (this.y >= fy - 12) { this.y = fy - 12; G.explosion(this.x, fy - 10, 70, 14, 'enemy'); G.spawnFire(this.x, fy, 70, 2.2); this.set('flutter'); this.vy = -300; } }
};
Bat.prototype.next = function () {
  const H = this.hero, G = this.game, T = tierOf(this);
  const m = pickMove(this, [['swoop', 3], ['breath', T >= 1 ? 2 : .7], ['bomb', T >= 2 || this.enraged ? 1.5 : 0]]);
  if (m === 'swoop') { this.set('swoop'); this.tx = H.x; this.ty = H.y - 24; this.sx = this.x; this.sy = this.y; Sound.play('whoosh'); }
  if (m === 'breath') { this.set('breathUp'); this.telegraph(94); }
  if (m === 'bomb') { this.set('bombUp'); this.tx = H.x; this.ty = H.y - 230; this.telegraph(40); warn(G, { type: 'circle', x: H.x, y: gY(this, H.x), r: 70, life: .9, col: [255, 120, 40] }); }
};
Bat.prototype.attackBoxes = function () { return this.st === 'swoop' || this.st === 'bomb' ? [{ x: this.x - 15, y: this.y - 20, w: 30, h: 22, dmg: 11 }] : []; };

/* =================== 11. SLIME DE MAGMA =================== */
Slime.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (this.onGround) this.vx *= .8;
  if (st === 'wait' && this.onGround && this.stT > (this.size < 1 ? .5 : .9) / spd) {
    this.facePlayer();
    const m = this.size < 1 ? 'hop' : pickMove(this, [['hop', 3], ['mega', T >= 1 && d < 420 ? 1.6 : 0], ['spit', d > 150 ? 1.6 : .3]]);
    if (m === 'hop') this.set('squash');
    if (m === 'mega') { this.set('megaUp'); this.telegraph(40); this.tx = H.x; warn(G, { type: 'circle', x: H.x, y: gY(this, H.x), r: 110, life: 1.25 / spd, col: [255, 120, 30] }); }
    if (m === 'spit') { this.set('spit'); this.telegraph(70); }
  }
  else if (st === 'squash' && this.stT > .25) { this.vy = -460 - (d < 200 ? 120 : 0); this.vx = this.face * (this.size < 1 ? 260 : 190); this.set('air'); }
  else if (st === 'air' && this.onGround && this.stT > .1) { this.set('wait'); FX.embers(this.x, this.y, 4, 100); G.spawnFire(this.x, this.y, 30 * this.size, 1.2); }
  else if (st === 'megaUp') { this.vx = 0; if (this.stT > .55 / spd) { this.set('mega'); this.vy = -980; this.vx = clamp((this.tx - this.x) / 1.15, -420, 420); Sound.play('jump'); } }
  else if (st === 'mega') { if (this.onGround && this.stT > .2) { FX.slam(this.x, this.y, 1.2); FX.splash(this.x, this.y - 6, 'lava', .9); G.shake(10, .3); Sound.play('slam', 1); G.spawnShockwave(this.x, this.y, 1, 260, 12); G.spawnShockwave(this.x, this.y, -1, 260, 12); G.spawnFire(this.x - 60, this.y, 60, 2.4); G.spawnFire(this.x + 60, this.y, 60, 2.4); this.set('wait'); } }
  else if (st === 'spit') { this.vx = 0; if (this.stT > .5 / spd && !this.spat) { this.spat = true; for (let i = 0; i < (this.enraged ? 3 : 2); i++) { const dx = H.x - this.x + (i - .5) * 80, T2 = .9; G.spawnProjectile({ owner: 'enemy', kind: 'fireball', x: this.x, y: this.y - 24, vx: dx / T2, vy: -500, g: 900, r: 9, dmg: 11, life: 3, parryable: true, delay: i * .12 }); } Sound.play('explode'); } if (this.stT > .9) { this.spat = false; this.set('wait'); } }
};
Slime.prototype.attackBoxes = function () { return this.st === 'mega' && this.vy > 0 ? [{ x: this.x - 22 * this.size, y: this.y - 30 * this.size, w: 44 * this.size, h: 30 * this.size, dmg: 18 }] : []; };
(() => { const d0 = Slime.prototype.draw; Slime.prototype.draw = function (g) { const k = this.st; if (k === 'megaUp' || k === 'spit') this.st = 'squash'; if (k === 'mega') this.st = 'air'; d0.call(this, g); this.st = k; }; })();
Slime.prototype.drawGlow = function (g) { glowAt(g, [255, 130, 40], this.x, this.y - 12 * this.size, 40 * this.size, .5); rageGlow(g, this); };

/* =================== 12. SALAMANDRA =================== */
Salamander.prototype.ai = function (dt) {
  const H = this.hero, d = this.dist, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  this.y = this.cy; this.vy = 0;
  if (st === 'crawl') {
    this.vx = this.face * 70; if (Math.abs(this.x - this.home) > 130) this.face = -Math.sign(this.x - this.home);
    if (d < 520 && this.stT > 1.4 / spd) {
      const m = pickMove(this, [['inhale', 3], ['sweep', T >= 1 ? 2 : .6], ['rain', T >= 2 ? 1.5 : 0]]);
      this.facePlayer();
      if (m === 'inhale') { this.set('inhale'); this.telegraph(66); }
      if (m === 'sweep') { this.set('sweepUp'); this.telegraph(58); const a0 = Math.atan2(H.y - 30 - this.y, H.x - this.x); this.sweepA = a0 - .55 * this.face; }
      if (m === 'rain') { this.set('rainUp'); this.telegraph(76); this.marks = []; for (let i = 0; i < (this.enraged ? 6 : 4); i++) { const x = H.x + (i - 1.5) * 80 + R(-20, 20); this.marks.push(x); warn(G, { type: 'circle', x, y: gY(this, x), r: 38, life: 1.3 / spd, col: [255, 140, 40] }); } }
    }
  }
  else if (st === 'inhale') { this.vx = 0; if (this.stT > .7 / spd) { this.spit(); this.set('crawl'); } }
  else if (st === 'sweepUp') { this.vx = 0; if (this.stT > .6 / spd) { this.set('sweep'); this.shots = 0; } }
  else if (st === 'sweep') { // chorro de fuego que barre el suelo
    this.vx = 0; const n = this.enraged ? 12 : 9;
    if (this.stT > this.shots * .07 && this.shots < n) { const a = this.sweepA + this.face * this.shots * .12; this.shots++; G.spawnProjectile({ owner: 'enemy', kind: 'fireball', x: this.x + this.face * 26, y: this.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, r: 8, dmg: 9, life: 1.6, parryable: false }); if (this.shots % 3 === 0) Sound.play('explode'); }
    if (this.stT > .3 + n * .07) this.set('crawl');
  }
  else if (st === 'rainUp') { this.vx = 0; if (this.stT > .55 / spd && !this.shotUp) { this.shotUp = true; for (let i = 0; i < 3; i++) G.spawnProjectile({ owner: 'fx', kind: 'fireball', x: this.x, y: this.y, vx: R(-60, 60), vy: this.ceiling ? 200 : -600, g: 0, r: 7, dmg: 0, life: .3 }); Sound.play('explode'); }
    if (this.stT > 1.3 / spd) { for (const [i, x] of this.marks.entries()) G.spawnProjectile({ owner: 'enemy', kind: 'fireball', x: x + R(-5, 5), y: gY(this, x) - 480, vx: 0, vy: 520, g: 400, r: 10, dmg: 12, life: 2.5, delay: i * .08 }); this.shotUp = false; this.set('crawl'); } }
};

/* =================== 13. BRUTO ACORAZADO (élite) =================== */
Brute.prototype.ai = function (dt) {
  const H = this.hero, d = Math.abs(this.dx), G = this.game; enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (this.hammer) this.updateHammer(dt);
  if (st === 'intro') { this.facePlayer(); if (this.stT > 1) { this.set('walk'); Sound.play('roar', 1.2); } return; }
  if (st === 'staggered') { this.vx = 0; if (this.stT > 4.5) { this.set('walk'); this.poise = 100; G.toast('¡Se ha recuperado!'); } return; }
  if (st === 'walk') {
    this.facePlayer(); this.vx = this.face * (d > 110 ? 90 : 0) * spd;
    if (this.stT > 1.1 / spd) {
      const m = pickMove(this, [['smashUp', d < 200 ? 3 : .8], ['sweepUp', d < 170 ? 2 : 0], ['chargeUp', d > 180 ? 2 : .3], ['quakeUp', this.p2 ? (d > 120 ? 2.2 : .8) : 0], ['throwUp', this.p2 && d > 200 && !this.hammer ? 2 : 0]]);
      this.set(m);
      if (m === 'smashUp') { this.telegraph(44); const sx = this.x + this.face * 70; warn(G, { x: sx - 50, y: this.y - 70, w: 100, h: 70, life: .85 / spd }); warn(G, { x: this.face > 0 ? sx : sx - 360, y: this.y - 14, w: 360, h: 14, life: .85 / spd }); }
      if (m === 'sweepUp') { this.telegraph(46); warn(G, { x: this.face > 0 ? this.x : this.x - 130, y: this.y - 60, w: 130, h: 50, life: .6 / spd }); }
      if (m === 'chargeUp') { this.telegraph(50); warn(G, { x: this.face > 0 ? this.x : this.x - 520, y: this.y - 80, w: 520, h: 80, life: .7 / spd }); }
      if (m === 'quakeUp') { this.telegraph(38); this.tx = H.x; warn(G, { type: 'circle', x: H.x, y: gY(this, H.x), r: 120, life: 1.1 / spd }); this.rocks = []; for (let i = 0; i < 4; i++) { const x = H.x + (i - 1.5) * 120 + R(-30, 30); this.rocks.push(x); } }
      if (m === 'throwUp') { this.telegraph(56); }
    }
  }
  else if (st === 'smashUp') { this.vx = 0; if (this.stT > .85 / spd) { this.set('smash'); const sx = this.x + this.face * 70; FX.slam(sx, this.y, 1.2); Sound.play('slam', 1); G.shake(10, .3); Input.rumble(.6, .4, 200); FX.text(sx, this.y - 60, 'BOOM!', '#ffd25a', 50); G.spawnShockwave(sx, this.y, this.face, 360, 14); G.spawnShockwave(sx, this.y, -this.face, 200, 14); } }
  else if (st === 'smash') { if (this.stT > (this.enraged ? .45 : .8)) { if (this.enraged && !this.chained) { this.chained = true; this.set('sweepUp'); this.stT = .3; } else { this.chained = false; this.set('walk'); } } }
  else if (st === 'sweepUp') { this.vx = 0; if (this.stT > .6 / spd) { this.set('sweep'); Sound.play('swing', true); } }
  else if (st === 'sweep') { if (this.stT > .45) this.set('walk'); }
  else if (st === 'chargeUp') { this.vx = -this.face * 30; if (this.stT > .7 / spd) { this.set('charge'); Sound.play('roar', 1.5); } }
  else if (st === 'charge') { this.vx = this.face * 520 * spd; if (chance(.6)) FX.footstep(this.x, this.y, this.face, 600); if (this.wall || this.stT > 1.1) { if (this.wall) { G.shake(12, .4); FX.slam(this.x + this.face * 30, this.y - 40, .8); this.stun = 1.2; Sound.play('slam'); FX.text(this.x, this.y - 100, 'DIZZY!', '#ffe060', 32); } this.set('walk'); } }
  else if (st === 'quakeUp') { this.vx = 0; if (this.stT > .5 / spd) { this.set('quake'); this.vy = -900; this.vx = clamp((this.tx - this.x) / 1.0, -480, 480); Sound.play('jump'); } }
  else if (st === 'quake') {
    if (this.onGround && this.stT > .2) {
      FX.slam(this.x, this.y, 1.6); G.shake(14, .45); Sound.play('slam', 1.3); Input.rumble(.8, .6, 300); FX.text(this.x, this.y - 120, 'QUAKE!', '#ffb040', 54);
      G.spawnShockwave(this.x, this.y, 1, 420, 14); G.spawnShockwave(this.x, this.y, -1, 420, 14);
      for (const [i, x] of (this.rocks || []).entries()) { warn(G, { type: 'circle', x, y: gY(this, x), r: 36, life: .5 + i * .1 }); G.spawnProjectile({ owner: 'enemy', kind: 'bomb', x, y: gY(this, x) - 520, vx: 0, vy: 200, g: 1400, r: 12, dmg: 14, life: 3, fuse: 9, delay: .2 + i * .1, onLand: (G2, p, fy) => { FX.chunks(p.x, fy - 10, [130, 120, 120], 8, 260); FX.slam(p.x, fy, .5); Sound.play('crumble'); G2.dealAreaToHero(p.x, fy - 30, 44, 14, false); } }); }
      this.set('smash'); this.stT = .2;
    }
  }
  else if (st === 'throwUp') { this.vx = 0; if (this.stT > .7 / spd) { this.set('throw'); this.hammer = { x: this.x + this.face * 40, y: this.y - 70, vx: this.face * 640, t: 0, dir: this.face, rot: 0 }; Sound.play('whoosh'); } }
  else if (st === 'throw') { this.vx = 0; if (!this.hammer) this.set('walk'); }
};
Brute.prototype.updateHammer = function (dt) { // boomerang: va, frena y vuelve
  const h = this.hammer; h.t += dt; h.rot += dt * 18; h.vx -= h.dir * 900 * dt; h.x += h.vx * dt; h.y = lerp(h.y, this.y - 70, dt * 2);
  if (chance(.5)) FX.afterimage({ x: h.x, y: h.y, draw: (gg, s, a) => { gg.fillStyle = `rgba(200,200,220,${.3 * a})`; gg.beginPath(); gg.arc(s.x, s.y, 22, 0, TAU); gg.fill(); } });
  if (h.t > .3 && Math.abs(h.x - this.x) < 40) { this.hammer = null; Sound.play('block'); }
};
Brute.prototype.attackBoxes = function () {
  const out = [];
  if (this.hammer) out.push({ x: this.hammer.x - 26, y: this.hammer.y - 26, w: 52, h: 52, dmg: 16, parryable: false });
  if (this.st === 'smash' && this.stT < .12) out.push({ x: this.x + this.face * 70 - 50, y: this.y - 70, w: 100, h: 70, dmg: 24 });
  if (this.st === 'sweep' && this.stT < .3) out.push({ x: this.face > 0 ? this.x : this.x - 120, y: this.y - 60, w: 120, h: 50, dmg: 18 });
  if (this.st === 'charge') out.push({ x: this.x - 34, y: this.y - 80, w: 68, h: 76, dmg: 20 });
  if (this.st === 'quake' && this.vy > 0) out.push({ x: this.x - 40, y: this.y - 90, w: 80, h: 90, dmg: 22 });
  return out;
};
(() => { const d0 = Brute.prototype.draw; Brute.prototype.draw = function (g) {
  const k = this.st; if (k === 'quakeUp' || k === 'throwUp') this.st = 'smashUp'; if (k === 'quake') this.st = 'charge'; if (k === 'throw') this.st = 'sweep';
  const hidden = !!this.hammer; d0.call(this, g); this.st = k;
  if (hidden) { const h = this.hammer; g.save(); g.translate(h.x, h.y); g.rotate(h.rot); g.fillStyle = '#6a4428'; g.fillRect(-32, -4, 50, 8); g.fillStyle = '#6a6e7e'; g.beginPath(); g.roundRect(14, -22, 30, 44, 6); g.fill(); g.strokeStyle = '#1a1424'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#e8b850'; g.fillRect(14, -4, 30, 6); g.restore(); }
}; })();
Brute.prototype.drawGlow = function (g) { Enemy.prototype.drawGlow.call(this, g); rageGlow(g, this); if (['smashUp', 'chargeUp', 'sweepUp', 'quakeUp', 'throwUp'].includes(this.st)) glowAt(g, [255, 240, 200], this.x + this.face * 50, this.y - 90, 40 + this.stT * 40, .6); if (this.st === 'staggered') glowAt(g, [255, 230, 120], this.x, this.y - 50, 90, .35 + Math.sin(this.t * 8) * .1); };

/* =================== 14. MAGO DEL RELOJ =================== */
ClockMage.prototype.ai = function (dt) {
  const H = this.hero, G = this.game, T = tierOf(this); enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  this.vy = (this.by + Math.sin(this.t * 1.5) * 10 - this.y) * 2; this.facePlayer();
  if (st === 'float') {
    this.vx = 0;
    if (this.stT > 1.6 / spd && this.dist < 640) {
      const m = pickMove(this, [['cast', 2], ['blades', 2], ['gears', T >= 3 ? 1.6 : .8], ['pendulum', T >= 4 || this.enraged ? 1.5 : 0]]);
      this.set(m); this.telegraph(76);
      if (m === 'cast') warn(G, { type: 'circle', x: H.x, y: H.y - 40, r: 110, flat: 1, life: .8 / spd, col: [255, 220, 120] });
      if (m === 'gears') { this.marks = []; for (let i = 0; i < (this.enraged ? 5 : 3); i++) { const x = H.x + (i - 1) * 100 + R(-25, 25); this.marks.push(x); warn(G, { type: 'circle', x, y: gY(this, x), r: 40, life: 1.2 / spd, col: [255, 210, 120] }); } }
      if (m === 'pendulum') { this.px = H.x; warn(G, { x: H.x - 230, y: gY(this, H.x) - 90, w: 460, h: 90, life: 1.1 / spd, col: [255, 210, 120] }); }
    }
  }
  else if (st === 'cast') { if (this.stT > .8 / spd) { G.spawnTimeBubble(H.x, H.y - 40, 110, 4); this.set('float'); Sound.play('timeStop'); } }
  else if (st === 'blades') { if (this.stT > .7 / spd) { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .35; G.spawnProjectile({ owner: 'enemy', kind: 'clockhand', x: this.x, y: this.y - 30, vx: Math.cos(a + (this.face > 0 ? .9 : -.9) * 1.2) * 340 * this.face, vy: Math.sin(a) * 200 + 160, r: 9, dmg: 10, life: 2.4, delay: i * .08, parryable: true }); } Sound.play('zap'); this.set('teleport'); } }
  else if (st === 'gears') { if (this.stT > 1.2 / spd) { for (const [i, x] of this.marks.entries()) G.spawnProjectile({ owner: 'enemy', kind: 'clockhand', x, y: gY(this, x) - 500, vx: 0, vy: 600, g: 300, r: 12, dmg: 12, life: 2, delay: i * .1, parryable: false }); Sound.play('zap'); this.set('float'); } }
  else if (st === 'pendulum') { if (this.stT > 1.1 / spd && !this.pend) { this.pend = { x: this.px, t: 0 }; Sound.play('whoosh'); } if (this.pend) { this.pend.t += dt; if (this.pend.t > 1.3) { this.pend = null; this.set('teleport'); } } }
  else if (st === 'teleport') { if (this.stT > .5) { FX.runeBurst(this.x, this.y - 30, [255, 230, 150], 10); this.x = this.home + R(-200, 200); this.by = this.y = this.by + R(-30, 30); FX.runeBurst(this.x, this.y - 30, [255, 230, 150], 10); this.set('float'); } }
};
ClockMage.prototype.pendPos = function () { const p = this.pend, a = Math.sin(p.t / 1.3 * Math.PI - Math.PI / 2) * 1.2, L = 260, py = gY(this, p.x) - 320; return { cx: p.x, cy: py, bx: p.x + Math.sin(a) * L, by: py + Math.cos(a) * L }; };
ClockMage.prototype.attackBoxes = function () { if (!this.pend) return []; const P = this.pendPos(); return [{ x: P.bx - 34, y: P.by - 30, w: 68, h: 60, dmg: 16 }]; };
(() => { const d0 = ClockMage.prototype.draw; ClockMage.prototype.draw = function (g) { d0.call(this, g); if (this.pend) { const P = this.pendPos(); g.strokeStyle = '#c9a23a'; g.lineWidth = 4; g.beginPath(); g.moveTo(P.cx, P.cy); g.lineTo(P.bx, P.by); g.stroke(); g.fillStyle = '#e8c060'; g.strokeStyle = '#3a2a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(P.bx - 40, P.by - 6); g.quadraticCurveTo(P.bx, P.by + 40, P.bx + 40, P.by - 6); g.lineTo(P.bx, P.by - 18); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(P.bx - 30, P.by + 2, 60, 3); } }; })();

/* =================== 15. COFRE MIMO =================== */
Mimic.prototype.ai = function (dt) {
  const H = this.hero, d = Math.abs(this.dx), G = this.game; enrage(this); const spd = (this.enraged ? 1.3 : 1) * diffK(), st = this.st;
  if (st === 'sleep') { this.vx = 0; this.inv = .1; if (this.dist < 70) { this.set('wake'); Sound.play('roar', 2); FX.text(this.x, this.y - 60, '!?', '#ffe060', 40); this.contact = 12; } }
  else if (st === 'wake') { if (this.stT > .4) this.set('chase'); }
  else if (st === 'chase') {
    this.facePlayer();
    if (this.onGround && this.stT > .45 / spd) {
      const m = pickMove(this, [['hop', 2.5], ['tongue', d < 230 && d > 50 ? 2 : 0], ['coins', d > 160 ? 1.6 : 0], ['chomp', d < 90 ? 2.5 : 0]]);
      if (m === 'hop') { this.vy = -420; this.vx = this.face * 260 * spd; this.stT = 0; Sound.play('swing'); }
      if (m === 'tongue') { this.set('tongueUp'); this.telegraph(60); warn(G, { x: this.face > 0 ? this.x : this.x - 230, y: this.y - 26, w: 230, h: 18, life: .5 / spd, col: [255, 90, 140] }); }
      if (m === 'coins') { this.set('coins'); this.shots = 0; this.telegraph(80); }
      if (m === 'chomp') { this.set('chomp'); this.hits = 0; }
    }
  }
  else if (st === 'tongueUp') { this.vx = 0; if (this.stT > .5 / spd) this.set('tongue'); }
  else if (st === 'tongue') { if (this.stT > .45) this.set('chase'); }
  else if (st === 'coins') { this.vx = 0; const n = this.enraged ? 6 : 4; if (this.stT > .3 + this.shots * .1 && this.shots < n) { this.shots++; G.spawnProjectile({ owner: 'enemy', kind: 'bomb', x: this.x, y: this.y - 24, vx: this.face * R(200, 420), vy: -R(300, 520), g: 900, r: 7, dmg: 9, life: 2.2, fuse: 1.1 + R(0, .3), bounce: true }); Sound.play('coin'); } if (this.stT > .6 + n * .1) this.set('chase'); }
  else if (st === 'chomp') { this.vx = this.face * 140; const k = Math.floor(this.stT / .22); if (k > this.hits && this.hits < 3) { this.hits = k; Sound.play('hit'); } if (this.stT > .8) this.set('chase'); }
};
Mimic.prototype.attackBoxes = function () {
  if (this.st === 'chase' && !this.onGround) return [{ x: this.x - 22, y: this.y - 36, w: 44, h: 36, dmg: 16 }];
  if (this.st === 'tongue') { const L = Math.min(1, this.stT / .12) * 230; return [{ x: this.face > 0 ? this.x : this.x - L, y: this.y - 26, w: L, h: 16, dmg: 12 }]; }
  if (this.st === 'chomp' && (this.stT % .22) < .1) return [{ x: this.x + (this.face > 0 ? 6 : -46), y: this.y - 34, w: 40, h: 34, dmg: 9 }];
  return [];
};
(() => { const d0 = Mimic.prototype.draw; Mimic.prototype.draw = function (g) {
  const k = this.st; if (['tongueUp', 'tongue', 'coins', 'chomp'].includes(k)) this.st = 'chase'; d0.call(this, g); this.st = k;
  if (k === 'tongue') { const L = Math.min(1, this.stT / .12) * 230 * (1 - Math.max(0, this.stT - .3) / .15); g.strokeStyle = '#ff6a8a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(this.x, this.y - 18); g.quadraticCurveTo(this.x + this.face * L * .5, this.y - 30, this.x + this.face * L, this.y - 18); g.stroke(); g.strokeStyle = '#c02a50'; g.lineWidth = 3; g.stroke(); }
}; })();
