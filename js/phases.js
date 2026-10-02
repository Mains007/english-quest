"use strict";
/* =====================================================================
   FASES DE JEFE — cada cambio de fase es un momento:
   1) el jefe ruge, te empuja y la pantalla tiembla (cámara lenta);
   2) se protege con un ESCUDO RÚNICO que solo se rompe con inglés;
   3) acierto → el escudo estalla y el jefe queda ATURDIDO (daño ×1.6);
      fallo   → el escudo cae solo, pero el jefe se cura un poco;
   4) vuelve con ataques nuevos, más rápido y con un aura que crece.
   ===================================================================== */
const PHASE_INFO = {
  'Rey Cangrejo':  { 2: ['TIDE FURY', 'Furia de la marea: el mar entra en la arena'], 3: ['KING OF THE DEEP', 'Sin caparazón: más rápido y con más burbujas'] },
  'Guardián Cronos': { 2: ['TIME FRACTURE', 'El tiempo se rompe: péndulos y relojes por todas partes'], 3: ['REWIND', 'Puede rebobinar el tiempo: ¡no te despistes!'] },
  'Titán de Magma': { 2: ['MOLTEN CORE', 'Su núcleo hierve: rayos de fuego y golpes dobles'], 3: ['ERUPTION', 'Erupción total: géiseres de lava'] },
  'Tempestra':     { 2: ['EYE OF THE STORM', 'La tormenta crece: ráfagas de viento'], 3: ['THUNDER QUEEN', 'Rayos sin descanso'] },
  'Gearheart':     { 2: ['OVERDRIVE', 'Sobrecarga: imán y sierras extra'], 3: ['MELTDOWN', 'La cinta va a toda velocidad'] },
  'Sir Vermilion': { 2: ['BLADE OF REGRET', 'Invoca a los fantasmas de tus errores'], 3: ['THE CRIMSON COLOSSUS', 'Su armadura gigante barre la sala'] }
};
const PHASE_COL = { 2: [255, 150, 40], 3: [255, 40, 60] };

/* centro y tamaño del jefe a partir de sus zonas vulnerables (sirve para todos) */
function bossBounds(b) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  try { for (const v of b.vulnerable()) { x0 = Math.min(x0, v.x); y0 = Math.min(y0, v.y); x1 = Math.max(x1, v.x + v.w); y1 = Math.max(y1, v.y + v.h); } } catch (e) { }
  if (x0 > x1) { x0 = b.x - 60; x1 = b.x + 60; y0 = (b.y || b.arena.floor) - 160; y1 = (b.y || b.arena.floor); }
  const w = Math.min(420, x1 - x0), h = Math.min(420, y1 - y0);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, r: Math.max(70, Math.max(w, h) * .62) };
}

Boss.prototype.checkPhase = function () {
  const f = this.hp / this.maxHp, np = f < .34 ? 3 : f < .67 ? 2 : 1;
  if (np > this.phase && this.hp > 0) { this.phase = np; Sound.setPhase(np); this.startShift(np); }
};
Boss.prototype.startShift = function (p) {
  const G = this.game, H = this.hero, info = (PHASE_INFO[this.name] || {})[p] || ['PHASE ' + p, '¡Se ha enfurecido!'], B = bossBounds(this);
  this.shift = { p, t: 0, stage: 'roar', info, B };
  G.slow(.25, .9); G.shake(16, 1); Input.rumble(1, .8, 500); G.flashScreen(PHASE_COL[p], .7);
  Sound.play('roar', p === 3 ? .7 : .9); Sound.play('slam', 1.4);
  FX.ring(B.cx, B.cy, PHASE_COL[p], B.r * 2.2, .6); FX.runeBurst(B.cx, B.cy, PHASE_COL[p], 26);
  // onda que aleja al héroe
  if (!H.dead) { H.vx = (Math.sign(H.x - B.cx) || 1) * 620; H.vy = -420; H.inv = Math.max(H.inv, .6); }
  G.projectiles = G.projectiles.filter(pr => pr.owner !== 'enemy');
  G.banner('PHASE ' + p + ' · ' + info[0], info[1], p === 3 ? '#ff6a6a' : '#ffb050', true);
};
Boss.prototype.updateShift = function (dt) {
  const s = this.shift, G = this.game; s.t += dt; this.t += dt; this.flash = s.stage === 'roar' && s.t < .8 && Math.sin(s.t * 40) > .7 ? .02 : -1;
  if (s.stage === 'roar') { if (chance(.5)) FX.embers(s.B.cx + R(-s.B.r, s.B.r) * .6, s.B.cy + R(-s.B.r, s.B.r) * .5, 2, 160); if (s.t > 1.6) { s.stage = 'shield'; s.t = 0; Sound.play('gate'); FX.text(s.B.cx, s.B.cy - s.B.r - 30, 'RUNE SHIELD!', '#9be6ff', 40); } }
  else if (s.stage === 'shield') {
    if (s.t > .9 && !s.asked && !G.qActive) {
      s.asked = true;
      G.askQuestion({ kind: 'seal', title: 'ESCUDO RÚNICO · Fase ' + s.p, onResult: ok => {
        const B = s.B;
        if (ok) { s.stage = 'break'; s.t = 0; FX.ring(B.cx, B.cy, [160, 230, 255], B.r * 2.4, .5); FX.runeBurst(B.cx, B.cy, [180, 240, 255], 30); for (let i = 0; i < 16; i++) FX.spawnRaw({ t: 'chunk', x: B.cx + R(-B.r, B.r) * .8, y: B.cy + R(-B.r, B.r) * .8, vx: R(-400, 400), vy: R(-500, -100), g: 1200, max: 1.2, s: R(3, 7), col: [170, 230, 255], rot: R(0, 6), vr: R(-10, 10) });
          FX.text(B.cx, B.cy - B.r - 110, 'SHIELD BROKEN!', '#bff0ff', 50); G.shake(12, .4); Sound.play('crumble'); Sound.play('correct'); this.breakT = 4; G.gainCrystals && G.gainCrystals(3, B.cx, B.cy);
          G.toast('¡Escudo roto! Está aturdido: ¡daño ×1.6 durante unos segundos!', 'Shield broken!'); }
        else { s.stage = 'fade'; s.t = 0; this.hp = Math.min(this.maxHp * (s.p === 2 ? .66 : .33), this.hp + this.maxHp * .06); FX.text(B.cx, B.cy - B.r - 110, 'HEALED!', '#ff9a9a', 40); Sound.play('heal');
          G.toast('El escudo se ha disuelto solo, pero el jefe se ha curado un poco. ¡Repasa esa frase!', 'The boss healed'); }
      } });
    }
  }
  else if (s.stage === 'break' || s.stage === 'fade') { if (s.t > (s.stage === 'break' ? .5 : 1)) this.endShift(); }
};
Boss.prototype.endShift = function () {
  const p = this.shift.p, broke = this.shift.stage === 'break'; this.shift = null;
  this.set('recover'); if (!broke) this.stT = 1.2; // un respiro corto si no se rompió el escudo
  this.onPhase && this.onPhase(p);
};
// el jefe no recibe daño con el escudo; tras romperlo, recibe más
(() => {
  const hurt0 = Boss.prototype.hurt;
  Boss.prototype.hurt = function (dmg, dir, info = {}, box) {
    if (this.shift) { const B = this.shift.B; FX.sparks(info.x ?? B.cx, info.y ?? B.cy, [170, 230, 255], 8, -dir); Sound.play('block'); if (!this._shTxt || this.t - this._shTxt > .6) { this._shTxt = this.t; FX.text(info.x ?? B.cx, (info.y ?? B.cy) - 30, 'SHIELDED', '#9be6ff', 22); } return false; }
    return hurt0.call(this, dmg, dir, info, box);
  };
  const dm0 = Boss.prototype.dmgMul;
  for (const C of new Set(Object.values(BOSS_TYPES))) {
    const up = C.prototype.update, ab = C.prototype.attackBoxes, dmul = C.prototype.dmgMul || dm0;
    C.prototype.update = function (dt) { if (this.breakT > 0) this.breakT -= dt; if (this.shift) return this.updateShift(dt); return up.call(this, dt); };
    C.prototype.attackBoxes = function () { return this.shift ? [] : ab.call(this); };
    C.prototype.dmgMul = function () { return dmul.call(this) * (this.breakT > 0 ? 1.6 : 1); };
  }
})();
/* aura por fase + escudo rúnico (se dibuja encima de cualquier jefe) */
function drawBossPhaseFX(g, b, G) {
  if (!b || b.dead) return;
  const t = G.t;
  if (b.phase >= 2 && b.st !== 'dying') { const B = bossBounds(b), c = PHASE_COL[Math.min(3, b.phase)];
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, c, B.cx, B.cy, B.r * (1.1 + .08 * Math.sin(t * 6)), .12 + .05 * b.phase); g.restore();
    if (chance(.25 * b.phase)) FX.embers(B.cx + R(-B.r, B.r) * .7, B.cy + B.r * .4, 1, 120); }
  if (b.breakT > 0) { const B = bossBounds(b); for (let i = 0; i < 4; i++) { const a = t * 4 + i * 1.57; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(B.cx + Math.cos(a) * B.r * .5, B.cy - B.r * .7 + Math.sin(a) * 8, 5, 0, TAU); g.fill(); }
    g.font = '900 22px "Bangers", Impact, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe060'; g.strokeStyle = '#1a0f14'; g.lineWidth = 4; const ty = B.cy - B.r - 18 + Math.sin(t * 6) * 3; g.strokeText('BREAK! ×1.6', B.cx, ty); g.fillText('BREAK! ×1.6', B.cx, ty); }
  const s = b.shift; if (!s || s.stage === 'roar' && s.t < 1.2) return;
  const B = s.B, k = s.stage === 'shield' ? Math.min(1, s.t / .4) : s.stage === 'fade' ? 1 - s.t : 1 - s.t * 2; if (k <= 0) return;
  g.save(); g.globalAlpha = k;
  const gr = g.createRadialGradient(B.cx, B.cy, B.r * .6, B.cx, B.cy, B.r); gr.addColorStop(0, 'rgba(120,200,255,0)'); gr.addColorStop(.85, 'rgba(140,215,255,.22)'); gr.addColorStop(1, 'rgba(200,240,255,.55)');
  g.fillStyle = gr; g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU + t * .3; g.lineTo(B.cx + Math.cos(a) * B.r, B.cy + Math.sin(a) * B.r); } g.fill();
  g.strokeStyle = 'rgba(190,240,255,.9)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = 'rgba(220,250,255,.95)'; g.font = '700 20px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const runes = ['A', 'B', 'C', '?', 'E', 'N', 'G', '!'];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - t * .8; g.fillText(runes[i], B.cx + Math.cos(a) * B.r * .86, B.cy + Math.sin(a) * B.r * .86); }
  if (s.stage === 'fade') { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i * 1.3; g.beginPath(); g.moveTo(B.cx + Math.cos(a) * B.r * .3, B.cy + Math.sin(a) * B.r * .3); g.lineTo(B.cx + Math.cos(a + .2) * B.r, B.cy + Math.sin(a + .2) * B.r); g.stroke(); } }
  g.restore();
}

/* =================== BRUTO ACORAZADO: dos fases =================== */
(() => {
  const onHurt0 = Brute.prototype.onHurt;
  Brute.prototype.onHurt = function (dmg, dir, info) {
    onHurt0.call(this, dmg, dir, info);
    if (!this.p2 && this.hp > 0 && this.hp < this.maxHp * .5 && this.st !== 'staggered') {
      this.p2 = true; this.enraged = true; const G = this.game, H = this.hero;
      this.set('p2'); G.slow(.3, .7); G.shake(14, .7); Sound.play('roar', .8); G.flashScreen([255, 120, 40], .5);
      if (!H.dead) { H.vx = (Math.sign(H.x - this.x) || 1) * 560; H.vy = -380; }
      FX.ring(this.x, this.y - 50, [255, 140, 60], 160, .5); G.banner('PHASE 2 · BERSERK', 'Se arranca la armadura: más rápido, terremotos y martillo bumerán', '#ffb050', true);
    }
  };
  const ai0 = Brute.prototype.ai;
  Brute.prototype.ai = function (dt) {
    if (this.st === 'p2') { this.vx = 0; this.inv = .1; if (this.stT > 1.4) { this.armor = [0, 0, 0, 0]; this.armored = false; FX.chunks(this.x, this.y - 60, [150, 150, 165], 16, 450, 1.3); Sound.play('crumble'); this.set('walk'); } return; }
    return ai0.call(this, dt);
  };
})();
