"use strict";
/* =====================================================================
   JUICE 2 — vida alrededor del héroe.
   · animaciones de reposo: se estira, se rasca la cabeza, hace girar la espada,
     bosteza y, si le dejas mucho rato, da cabezadas (Zzz)
   · frenadas con polvo e inclinación; arrancadas con impulso
   · pajaritos que picotean y huyen volando, mariposas y polillas que se espantan
   · estela y salpicaduras al correr por el agua
   · los aciertos de inglés: la palabra correcta vuela letra a letra hasta el héroe
     y le da poder; con racha de 3 o más, aura de fuego
   ===================================================================== */
const Juice2 = (() => {
  const S = { critters: [], spawnT: 0, letters: [], pending: null, wakeT: 0 };
  const IDLE = ['stretch', 'scratch', 'twirl', 'yawn', 'twirl', 'stretch'];

  /* ---------- reposo ---------- */
  const hupd0 = Hero.prototype.update;
  Hero.prototype.update = function (dt) {
    const prevVx = this.vx, prevSt = this.state;
    hupd0.call(this, dt);
    const G = this.game;
    if (this.hitstop > 0 || this.dead) return;
    // --- reposo
    const quiet = this.state === 'idle' && this.onGround && !G.cinematic && !G.qActive && !this.carry && Math.abs(Input.moveX()) < .1;
    if (quiet) this.idleT = (this.idleT || 0) + dt; else { this.idleT = 0; this.idleAct = null; }
    this.idleEyes = false; this.idleMouth = 0;
    let lean = 0;
    if (this.idleT > 4 && !this.idleAct) {
      this.idleAct = this.idleT > 22 ? 'doze' : IDLE[(this.idleN = (this.idleN || 0) + 1) % IDLE.length];
      this.idleActT = 0; this.idleDur = { stretch: 2, scratch: 1.8, twirl: 1.4, yawn: 2.2, doze: 99 }[this.idleAct];
    }
    if (this.idleAct) {
      const a = this.idleAct, k = (this.idleActT += dt) / this.idleDur;
      if (a === 'stretch') { const e = Math.sin(Math.min(1, k) * Math.PI); lean = -.12 * e; this.sq = 1 + .1 * e; this.idleEyes = e > .5; this.idleMouth = e > .6 ? .5 : 0; }
      else if (a === 'yawn') { const e = Math.sin(Math.min(1, k) * Math.PI); this.idleEyes = e > .3; this.idleMouth = e; lean = -.06 * e; if (k > .2 && k < .22) Sound.play('yawn'); }
      else if (a === 'doze') { this.idleEyes = true; lean = .08 + Math.sin(G.rt * 1.2) * .04; this.sq = 1 + Math.sin(G.rt * 1.2) * .03; this.zT = (this.zT || 0) - dt; if (this.zT <= 0) { this.zT = 1.1; FX.text(this.x + this.face * 14, this.y - 70, pick(['z', 'Z', 'z']), '#cfe6ff', R(16, 24), { comic: false, max: 1.6, vy: -35, rot: R(-.3, .3) }); } }
      else if (a === 'twirl' && k > .2 && k < .23 && !this.twirled) { this.twirled = 1; Sound.play('whoosh'); }
      if (k >= 1) { this.idleAct = null; this.idleT = 2.5 + R(0, 2); this.twirled = 0; }
    }
    // --- frenada: input contrario a la velocidad
    const mx = Input.moveX();
    if (this.onGround && !this.atk && !(this.dashT > 0) && mx && Math.sign(mx) !== Math.sign(this.vx) && Math.abs(this.vx) > 170) {
      if (!this.skidT || this.skidT <= 0) { Sound.play('skid'); FX.land(this.x, this.y, 500); }
      this.skidT = .14; lean = Math.sign(mx) === this.face ? .26 : -.26;
      if (chance(.7)) FX.footstep(this.x + Math.sign(this.vx) * 6, this.y, -Math.sign(this.vx), 420);
    } else if (this.skidT > 0) { this.skidT -= dt; lean = .18 * (this.skidT / .14) * (Math.sign(mx || this.face) === this.face ? 1 : -1); }
    // --- arrancada
    if (this.onGround && this.state === 'run' && prevSt === 'idle' && Math.abs(this.vx) > 60) { FX.footstep(this.x - this.face * 6, this.y, this.face, 500); FX.footstep(this.x - this.face * 10, this.y, this.face, 500); }
    this.poseLean = lerp(this.poseLean || 0, lean, Math.min(1, dt * 14));
    // --- agua: estela al correr o nadar en la superficie
    const L = this.inLiquid;
    if (L && L.type === 'water' && Math.abs(this.vx) > 90 && this.y - L.curLevel < 70) {
      S.wakeT -= dt;
      if (S.wakeT <= 0) {
        S.wakeT = .07; const d = -Math.sign(this.vx), sp = Math.min(1.4, Math.abs(this.vx) / 300);
        for (let i = 0; i < 4; i++) FX.spawnRaw({ t: 'drop', x: this.x + d * R(4, 14), y: L.curLevel - 2, vx: d * R(40, 160) * sp + R(-30, 30), vy: -R(120, 300) * sp, g: 900, max: R(.35, .6), s: R(1.4, 2.6), col: [215, 240, 255] });
        if (chance(.35)) FX.ring(this.x + d * 10, L.curLevel, [220, 245, 255], 26 * sp + 10, .5, true);
        if (chance(.25)) Sound.play('bubble');
      }
    }
    // --- aura de racha
    if (this.fireT > 0) {
      this.fireT -= dt;
      if (chance(dt * 40)) FX.spawnRaw({ t: 'ember', x: this.x + R(-14, 14), y: this.y - R(4, 50), vx: R(-20, 20), vy: R(-140, -60), g: -40, drag: 1, max: R(.4, .8), s: R(1.4, 2.6) });
    }
  };
  // poses de brazos para el reposo
  const arm0 = armPose;
  armPose = function (h, t) {
    const ap = arm0(h, t);
    if (h.state !== 'idle' || !h.idleAct) return ap;
    const k = Math.min(1, h.idleActT / h.idleDur), e = Math.sin(k * Math.PI);
    if (h.idleAct === 'stretch') { ap.hx = lerp(ap.hx, 6, e); ap.hy = lerp(ap.hy, -66, e); ap.bx = lerp(ap.bx, -4, e); ap.by = lerp(ap.by, -66, e); ap.wa = lerp(ap.wa, -1.62, e); }
    else if (h.idleAct === 'scratch') { const j = Math.sin(t * 34) * 1.6 * e; ap.hx = lerp(ap.hx, 7, e); ap.hy = lerp(ap.hy, -60 + j, e); ap.wa = lerp(ap.wa, -2.9, e); }
    else if (h.idleAct === 'twirl') { ap.hx = lerp(ap.hx, 13, e); ap.hy = lerp(ap.hy, -34, e); ap.wa = ap.wa + k * TAU * 2; }
    else if (h.idleAct === 'yawn') { ap.bx = lerp(ap.bx, 6, e); ap.by = lerp(ap.by, -48, e); }
    else if (h.idleAct === 'doze') { ap.hy += 4; ap.wa = 1.9; }
    ap.ex = (3 + ap.hx) / 2 + 1; ap.ey = (-39 + ap.hy) / 2 + 3;
    return ap;
  };
  const glow0 = Hero.prototype.drawGlow;
  Hero.prototype.drawGlow = function (g) { glow0.call(this, g); if (this.fireT > 0) glowAt(g, [255, 140, 50], this.x, this.y - 30, 70 + Math.sin(this.game.rt * 9) * 6, .45 * Math.min(1, this.fireT)); };

  /* ---------- fauna que reacciona ---------- */
  const FAUNA = {
    beach: [['bird', [236, 236, 240], [150, 150, 160]], ['bird', [210, 196, 170], [120, 100, 80]]],
    cliff: [['bird', [150, 110, 80], [90, 60, 40]], ['fly', [255, 220, 90]], ['fly', [140, 200, 255]]],
    forest: [['bird', [150, 110, 80], [90, 60, 40]], ['bird', [90, 130, 200], [200, 120, 80]], ['fly', [255, 160, 60]], ['fly', [250, 250, 250]]],
    ruins: [['bird', [120, 120, 130], [70, 70, 80]], ['fly', [230, 200, 255]]],
    mushroom: [['moth', [255, 170, 240]], ['moth', [150, 230, 255]]],
    cave: [['moth', [200, 255, 200]]],
    castle: [['bird', [60, 60, 70], [30, 30, 36]]]
  };
  function spawnCritter(G) {
    const B = FAUNA[G.curBiome]; if (!B) return;
    const c = G.cam, H = G.hero, side = Math.abs(H.vx) > 50 ? Math.sign(H.vx) : pick([-1, 1]);
    const x = side > 0 ? c.x + G.VW + R(20, 160) : c.x - R(20, 160), gy = G.world.groundY(x);
    if (!isFinite(gy) || gy < c.y - 100 || gy > c.y + VH + 200 || G.world.liquidAt(x, gy - 4)) return;
    const [kind, col, col2] = pick(B), n = kind === 'bird' ? (chance(.5) ? 3 : 2) : 1;
    for (let i = 0; i < n; i++) {
      const cx = x + R(-50, 50), cy = G.world.groundY(cx); if (!isFinite(cy) || Math.abs(cy - gy) > 40) continue;
      S.critters.push({ kind, col, col2, x: cx, y: kind === 'bird' ? cy : cy - R(30, 90), gy: cy, ax: cx, ay: cy - R(30, 90), vx: 0, vy: 0, t: R(0, 9), face: pick([-1, 1]), st: 'idle', stT: R(0, 2), ph: R(0, TAU) });
    }
  }
  function updateCritters(G, dt) {
    const H = G.hero, c = G.cam;
    S.spawnT -= dt;
    if (S.spawnT <= 0) { S.spawnT = R(2.5, 5); if (S.critters.length < 8) spawnCritter(G); }
    for (const b of S.critters) {
      b.t += dt; b.stT += dt;
      const dx = b.x - H.x, dy = b.y - (H.y - 20), d = Math.hypot(dx, dy);
      const scare = d < (Math.abs(H.vx) > 250 || H.atk ? 230 : 150) || (G.inCombat && d < 400);
      if (b.kind === 'bird') {
        if (b.st !== 'fly' && scare) { b.st = 'fly'; b.vx = (Math.sign(dx) || 1) * R(160, 260); b.vy = -R(260, 360); b.face = Math.sign(b.vx); if (!S.flutT || G.rt - S.flutT > .3) { S.flutT = G.rt; Sound.play('flutter'); } for (let i = 0; i < 2; i++) FX.spawnRaw({ t: 'leaf', x: b.x, y: b.y - 6, vx: R(-60, 60), vy: R(-80, -20), g: 160, drag: 1.6, max: R(.6, 1), s: R(1.5, 2.2), col: b.col, rot: R(0, TAU), vr: R(-8, 8) }); }
        if (b.st === 'fly') { b.vy = Math.max(-420, b.vy - 260 * dt); b.x += b.vx * dt; b.y += b.vy * dt; }
        else if (b.st === 'idle' && b.stT > 1.2 && chance(dt * 1.5)) { b.st = chance(.5) ? 'hop' : 'peck'; b.stT = 0; if (chance(.4)) b.face *= -1; }
        else if (b.st === 'hop') { b.x += b.face * 40 * dt; const gy = G.world.groundY(b.x); b.y = (isFinite(gy) ? gy : b.y) - Math.abs(Math.sin(b.stT * 9)) * 5; if (b.stT > .35) { b.st = 'idle'; b.stT = 0; } }
        else if (b.st === 'peck' && b.stT > .6) { b.st = 'idle'; b.stT = 0; }
      } else {
        // mariposa / polilla: revolotea alrededor de su ancla
        if (scare && !b.fleeing) { b.fleeing = 1; b.ax += (Math.sign(dx) || 1) * 260; b.ay -= 180; }
        const sp = b.fleeing ? 3 : 1.2;
        const tx = b.ax + Math.sin(b.t * .9 + b.ph) * 40, ty = b.ay + Math.sin(b.t * 1.7 + b.ph) * 18;
        b.vx = lerp(b.vx, (tx - b.x) * sp, Math.min(1, dt * 3)); b.vy = lerp(b.vy, (ty - b.y) * sp + Math.sin(b.t * 9) * 30, Math.min(1, dt * 3));
        b.x += b.vx * dt; b.y += b.vy * dt; if (Math.abs(b.vx) > 5) b.face = Math.sign(b.vx);
        if (b.fleeing && b.t > 30) b.gone = 1;
      }
      if (b.x < c.x - 700 || b.x > c.x + G.VW + 700 || b.y < c.y - 500) b.gone = 1;
    }
    S.critters = S.critters.filter(b => !b.gone);
  }
  function drawCritters(g, G) {
    const t = G.rt;
    for (const b of S.critters) {
      g.save(); g.translate(b.x, b.y); g.scale(b.face, 1);
      if (b.kind === 'bird') {
        const fly = b.st === 'fly', peck = b.st === 'peck' ? Math.max(0, Math.sin(b.stT * 18)) : 0;
        if (!fly) { g.strokeStyle = '#5a4030'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -3); g.lineTo(-2, 0); g.moveTo(2, -3); g.lineTo(2, 0); g.stroke(); }
        g.rotate(fly ? -.25 : peck * .5);
        g.fillStyle = rgba(b.col2); g.beginPath(); g.moveTo(-6, -6); g.lineTo(-11, -9); g.lineTo(-10, -5); g.fill(); // cola
        g.fillStyle = rgba(b.col); g.beginPath(); g.ellipse(0, -6, 6.5, 4.2, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(5, -10 + peck * 4, 3.4, 0, TAU); g.fill();
        g.fillStyle = '#e8a030'; g.beginPath(); g.moveTo(8, -10.5 + peck * 4); g.lineTo(11.5, -9.5 + peck * 4); g.lineTo(8, -8.6 + peck * 4); g.fill();
        g.fillStyle = '#1a1420'; g.beginPath(); g.arc(6, -10.8 + peck * 4, .9, 0, TAU); g.fill();
        // ala
        const wa = fly ? Math.sin(t * 34 + b.ph) * 1.1 : 0;
        g.fillStyle = rgba(b.col2); g.save(); g.translate(-1, -7); g.rotate(-.2 + wa); g.beginPath(); g.ellipse(-3, 0, 5.5, 2.6, fly ? -.6 : .1, 0, TAU); g.fill(); g.restore();
      } else {
        const w = Math.abs(Math.sin(t * (b.kind === 'moth' ? 16 : 20) + b.ph));
        if (b.kind === 'moth') { g.globalCompositeOperation = 'lighter'; glowAt(g, b.col, 0, 0, 16, .5); g.globalCompositeOperation = 'source-over'; }
        g.fillStyle = rgba(b.col); g.save(); g.scale(1, .3 + w * .7);
        g.beginPath(); g.ellipse(-3, -4, 4.5, 5, -.5, 0, TAU); g.ellipse(3, -4, 4.5, 5, .5, 0, TAU); g.fill();
        g.fillStyle = rgba(b.col.map(v => v * .75)); g.beginPath(); g.ellipse(-2.4, 3, 3, 3.4, .4, 0, TAU); g.ellipse(2.4, 3, 3, 3.4, -.4, 0, TAU); g.fill();
        g.restore(); g.fillStyle = '#2a1a20'; g.fillRect(-.7, -5, 1.4, 9);
      }
      g.restore();
    }
  }

  /* ---------- aciertos de inglés: la palabra vuela hasta el héroe ---------- */
  const fx0 = Game.prototype.answerFX;
  Game.prototype.answerFX = function (ok, verdict, rec) {
    fx0.call(this, ok, verdict, rec);
    if (ok) S.pending = { word: String(S.lastGiven || 'GREAT').toUpperCase().slice(0, 18), streak: rec && rec.streak || 0, wait: .15 };
  };
  const sq0 = UI.showQuestion;
  UI.showQuestion = function (q, opt, cb) { return sq0.call(this, q, opt, res => { S.lastGiven = res && typeof res.given === 'string' ? res.given : (q && q.answerWords ? q.answerWords.join(' ') : ''); cb(res); }); };
  function releaseWord(G) {
    const P = S.pending; S.pending = null;
    const c = G.cam, H = G.hero, chars = P.word.split(''), n = chars.length;
    const zm = c.zoom * (1 + (c.pz || 0)), sx = G.VW / 2, sy = VH * .3;
    const wx = (sx - G.VW / 2) / zm + G.VW / 2 + c.x, wy = (sy - VH / 2) / zm + VH / 2 + c.y;
    chars.forEach((ch, i) => { if (ch === ' ') return; S.letters.push({ ch, x: wx + (i - n / 2) * 26, y: wy, vx: (i - n / 2) * 30, vy: -R(80, 160), t: -i * .05, n: i }); });
    S.fire = P.streak >= 3;
  }
  function updateLetters(G, dt) {
    const H = G.hero, tx = H.x, ty = H.y - 34;
    for (const l of S.letters) {
      l.t += dt; if (l.t < 0) continue;
      const dx = tx - l.x, dy = ty - l.y, d = Math.hypot(dx, dy), pull = Math.min(1, l.t * 1.6) * 2600;
      l.vx += dx / (d || 1) * pull * dt; l.vy += dy / (d || 1) * pull * dt; l.vx *= Math.pow(.12, dt); l.vy *= Math.pow(.12, dt);
      l.x += l.vx * dt; l.y += l.vy * dt;
      if (chance(.5)) FX.spawnRaw({ t: 'mote', x: l.x, y: l.y, vx: R(-20, 20), vy: R(-20, 20), g: 0, max: .4, s: R(1.2, 2.2), col: [255, 230, 140], add: 1 });
      if (d < 22 || l.t > 2.2) {
        l.done = 1; Sound.play('coinIn', l.n); FX.runeBurst(tx, ty, [255, 230, 140], 4);
        if (!S.letters.some(o => !o.done)) { FX.ring(tx, ty, [255, 235, 160], 90, .45); H.sq = 1.25; Sound.play('streak', 3); G.flashScreen([255, 235, 170], .15); if (S.fire) { S.fire = false; H.fireT = 10; FX.text(H.x, H.y - 110, 'ON FIRE!', '#ffb050', 40); Sound.play('ultCharge'); } }
      }
    }
    S.letters = S.letters.filter(l => !l.done);
  }
  function drawLetters(g) {
    if (!S.letters.length) return;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 30px "Bangers", Impact, sans-serif'; g.lineWidth = 5; g.strokeStyle = '#3a2410';
    for (const l of S.letters) {
      if (l.t < 0) continue;
      const s = 1 + .3 * Math.max(0, 1 - l.t * 4);
      g.save(); g.translate(l.x, l.y); g.scale(s, s); g.rotate(Math.sin(l.t * 8 + l.n) * .2);
      g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 210, 90], 0, 0, 26, .55); g.globalCompositeOperation = 'source-over';
      g.strokeText(l.ch, 0, 0); g.fillStyle = '#ffe58a'; g.fillText(l.ch, 0, 0); g.restore();
    }
    g.restore();
  }

  /* ---------- bucle ---------- */
  const upd0 = Game.prototype.update;
  Game.prototype.update = function (dt) {
    upd0.call(this, dt);
    if (this.mode !== 'play' || UI.modalOpen() || this.freezeT > 0) return;
    const gdt = dt * (this.cinematic ? (this.cinematic.worldTs ?? 0) : this.timeScale);
    updateCritters(this, gdt);
    if (S.pending && !this.qActive) { S.pending.wait -= dt; if (S.pending.wait <= 0) releaseWord(this); }
    updateLetters(this, dt);
  };
  const load0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { S.critters = []; S.letters = []; S.pending = null; S.spawnT = 1; if (this.hero) { this.hero.fireT = 0; this.hero.idleT = 0; this.hero.idleAct = null; } return load0.call(this, ref); };

  return { S, drawCritters, drawLetters };
})();
