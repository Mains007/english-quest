"use strict";
/* =====================================================================
   ATAQUE IMPARABLE DE LOS JEFES
   Cada cierto tiempo el jefe carga un rayo gigante que cubre la pantalla y que
   no se puede esquivar ni bloquear. Justo antes de que te alcance, el tiempo se
   congela y aparece una pregunta de inglés:
   · si aciertas, Lio salta dentro del rayo y lo parte a tajos; el golpe devuelto
     aturde al jefe y le hace daño
   · si fallas, el rayo te alcanza de lleno: te quita el 40 % de la vida máxima
     (nunca te mata: te deja como mínimo con 1)
   ===================================================================== */
const BossUlt = (() => {
  const COL = { CrabKing: [255, 120, 80], ChronoGuardian: [255, 220, 120], MagmaTitan: [255, 120, 40], StormWyvern: [150, 200, 255], ClockworkColossus: [255, 200, 120], CrimsonKnight: [255, 60, 90] };
  const NAME = { CrabKing: 'TIDAL CANNON', ChronoGuardian: 'END OF TIME', MagmaTitan: 'MAGMA RAY', StormWyvern: 'SKY JUDGEMENT', ClockworkColossus: 'GEAR CANNON', CrimsonKnight: 'CRIMSON VERDICT' };
  let P = [];
  const add = o => { if (P.length < 700) P.push(Object.assign({ t: 0, life: 1, vx: 0, vy: 0, g: 0 }, o)); };
  const col = b => COL[b.constructor.name] || [200, 160, 255];

  /* ---------- carga (el mundo sigue: puedes moverte, pero no hay escapatoria) ---------- */
  function canStart(b) {
    const G = b.game;
    return G.boss === b && !b.dead && b.hp > 0 && !b.shift && !G.qActive && !G.cinematic && !G.hero.dead && !UI.modalOpen()
      && !['intro', 'dying', 'sealing', 'frozen', 'dead'].includes(b.st) && (b.t || 0) > 9;
  }
  function startCharge(b) {
    const G = b.game, B = bossBounds(b), c = col(b);
    b.doom = { stage: 'charge', t: 0, B, c, name: NAME[b.constructor.name] || 'DOOM BEAM' };
    G.banner('UNSTOPPABLE ATTACK!', '¡Ataque imparable! No se puede esquivar: responde en inglés para sobrevivir', rgba(c), true);
    Sound.play('ultCharge'); Sound.play('roar', .8); G.shake(4, 2.4); Input.rumble(.3, .6, 2000);
  }
  function updateCharge(b, dt) {
    const D = b.doom, G = b.game, B = D.B; D.t += dt;
    b.flash = Math.sin(D.t * 30) > .6 ? .03 : -1;
    // la energía de toda la arena se concentra en el jefe
    for (let k = 0; k < 6; k++) { const a = R(0, TAU), d = R(300, 700); add({ kind: 'mote', x: B.cx + Math.cos(a) * d, y: B.cy + Math.sin(a) * d * .7, life: .9, c: D.c, fn: (p, dt) => { const dx = B.cx - p.x, dy = B.cy - p.y, dd = Math.hypot(dx, dy) || 1, sp = 400 + 1400 * p.t; p.px = p.x; p.py = p.y; p.x += dx / dd * Math.min(dd, sp * dt); p.y += dy / dd * Math.min(dd, sp * dt); if (dd < 10) p.t = 99; } }); }
    if (chance(dt * 6)) G.lightning(B.cx + R(-B.r, B.r), B.cy + R(-B.r, B.r), B.cx, B.cy);
    if (D.t > 2.4) fire(b);
  }
  /* ---------- disparo: el tiempo se congela y llega la pregunta ---------- */
  function fire(b) {
    const G = b.game, H = G.hero, D = b.doom;
    D.stage = 'fire'; D.t = 0; D.hx = H.x; D.hy = H.y;
    D.ang = Math.atan2((H.y - 50) - D.B.cy, H.x - D.B.cx); D.len = Math.hypot(H.x - D.B.cx, H.y - 50 - D.B.cy) + 900;
    D.front = 0; D.stop = Math.max(60, Math.hypot(H.x - D.B.cx, H.y - 50 - D.B.cy) - 150);
    D.pieces = [{ a: 0, b: D.len, ox: 0, oy: 0, rot: 0, vx: 0, vy: 0, vr: 0, att: 1, al: 1 }];
    G.cinematic = { kind: 'doom', t: 0, dur: 99, worldTs: 0, boss: b, hits: [], targets: [] };
    Sound.play('ultFire'); Sound.play('thunder'); G.shake(14, .5); G.flashScreen(D.c, .5);
  }
  function ask(b) {
    const G = b.game, D = b.doom;
    D.asked = true;
    G.askQuestion({ kind: 'doom', title: D.name + ' · ANSWER TO SURVIVE', onResult: (ok) => { D.stage = ok ? 'cut' : 'hit'; D.t = 0; D.cuts = []; } });
  }

  /* ---------- cinemática (tiempo real; el mundo está congelado) ---------- */
  const uc0 = Game.prototype.updateCinematic;
  Game.prototype.updateCinematic = function (dt) {
    const C = this.cinematic; if (!C || C.kind !== 'doom') return uc0.call(this, dt);
    const b = C.boss, D = b.doom, H = this.hero; C.t += dt; if (!D) { this.cinematic = null; return; }
    D.t += dt;
    if (D.stage === 'fire') {
      D.front = Math.min(D.stop, D.front + dt * 2600);
      if (D.front >= D.stop && !D.asked && D.t > .45) ask(b);
      beamFx(D, dt);
    } else if (D.stage === 'cut') {
      // Lio salta dentro del rayo y lo parte a tajos, avanzando hacia el jefe
      const n = 7, step = .16;
      if (D.t > .2 && D.cuts.length < n && D.t > .2 + D.cuts.length * step) {
        const i = D.cuts.length, s = D.stop * (1 - (i + 1) / (n + 1));
        D.cuts.push({ s, t: 0, a: (i % 2 ? 1 : -1) * R(.6, 1.1) });
        cutAt(D, s); Sound.play('swing', true); Sound.play('crit'); this.shake(8, .12); Input.rumble(.5, .5, 80);
        const cx = D.B.cx + Math.cos(D.ang) * s, cy = D.B.cy + Math.sin(D.ang) * s;
        FX.afterimage(H.snapshot()); H.x = cx; H.y = cy + 50; H.face = Math.cos(D.ang) > 0 ? -1 : 1;
        for (let k = 0; k < 26; k++) { const a = R(0, TAU), v = R(200, 700); add({ kind: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 500, life: R(.3, .7), c: D.c }); }
      }
      for (const c of D.cuts) c.t += dt;
      if (D.t > .2 + n * step + .25 && !D.boom) {
        D.boom = 1; for (const p of D.pieces) if (p.att) detach(p, D);
        this.flashScreen([255, 255, 255], .9); this.shake(18, .6); Sound.play('explode'); Sound.play('ultFire');
        FX.text(D.B.cx, D.B.cy - D.B.r - 30, 'BEAM BREAKER!', '#ffffff', 72);
        b.hurt(b.maxHp * .08, Math.sign(b.x - D.hx) || 1, { x: D.B.cx, y: D.B.cy, heavy: true });
        b.breakT = 3.5; b.stun = 2.5; FX.text(D.B.cx, D.B.cy - D.B.r + 20, 'STUNNED!', '#ffe060', 40);
      }
      if (D.t > .2 + n * step + 1.3) end(this, b);
    } else if (D.stage === 'hit') {
      // el rayo te alcanza de lleno
      D.front = Math.min(D.len, D.front + dt * 3000); beamFx(D, dt);
      if (D.t > .25 && !D.hitDone) {
        D.hitDone = 1; const dmg = Math.round(H.maxHp * .4); H.hp = Math.max(1, H.hp - dmg); H.hurtFlash = .3; H.lastHurt = this.t;
        FX.text(H.x, H.y - 120, '-' + dmg, '#ff6a6a', 60); this.flashScreen(D.c, 1); this.shake(26, .9); Sound.play('hurt'); Sound.play('explode'); Input.rumble(1, 1, 600);
      }
      if (D.t > 1.5) { end(this, b); H.vx = Math.cos(D.ang) * 600; H.vy = -400; }
    }
    updParts(dt);
  };
  function end(G, b) {
    G.cinematic = null; G.hero.inv = 1.2; G.hero.vy = 0;
    if (b.doom && b.doom.stage === 'cut') { G.hero.x = b.doom.hx; G.hero.y = b.doom.hy; }
    b.doom = null; b.doomCd = [0, 30, 24, 19][Math.min(3, b.phase || 1)];
  }
  function cutAt(D, s) {
    // parte la pieza unida al jefe: lo que queda por delante del corte sale volando
    for (const p of D.pieces) if (p.att && s > p.a && s < p.b) {
      const loose = { a: s + 8, b: p.b, ox: 0, oy: 0, rot: 0, att: 0, al: 1 }; detach(loose, D);
      p.b = s - 8; D.pieces.push(loose); break;
    }
    D.front = s;
  }
  function detach(p, D) { p.att = 0; p.vx = R(-60, 60); p.vy = (chance(.5) ? -1 : 1) * R(180, 380); p.vr = R(-1.2, 1.2); }
  function beamFx(D, dt) {
    // chispas que corren por el rayo
    for (let k = 0; k < 5; k++) { const s = R(0, D.front), w = R(-80, 80), x = D.B.cx + Math.cos(D.ang) * s - Math.sin(D.ang) * w, y = D.B.cy + Math.sin(D.ang) * s + Math.cos(D.ang) * w; add({ kind: 'spark', x, y, vx: Math.cos(D.ang) * 900, vy: Math.sin(D.ang) * 900, life: .25, c: D.c }); }
  }
  function updParts(dt) {
    for (const p of P) { p.t += dt; if (p.fn) p.fn(p, dt); else { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; } }
    P = P.filter(p => p.t < p.life);
  }

  /* ---------- enganche con todos los jefes ---------- */
  for (const C of new Set(Object.values(BOSS_TYPES))) {
    const up = C.prototype.update, ab = C.prototype.attackBoxes;
    C.prototype.update = function (dt) {
      if (this.doom) { if (this.doom.stage === 'charge') { updateCharge(this, dt); updParts(dt); } return; }
      up.call(this, dt);
      if (this.game.boss === this) {
        if (this.doomCd === undefined) this.doomCd = 14;
        this.doomCd -= dt;
        if (this.doomCd <= 0 && canStart(this)) startCharge(this);
      }
    };
    C.prototype.attackBoxes = function () { return this.doom ? [] : ab.call(this); };
  }

  /* ---------- dibujo ---------- */
  function drawBeam(g, D, t) {
    const c = D.c;
    for (const p of D.pieces) {
      const a = p.att ? p.a : p.a, b = p.att ? Math.min(p.b, D.front) : p.b; if (b <= a) continue;
      if (!p.att) { p.ox += p.vx * .016; p.oy += p.vy * .016; p.rot += p.vr * .016; p.al = Math.max(0, p.al - .025); }
      if (p.al <= 0) continue;
      g.save(); g.translate(D.B.cx, D.B.cy); g.rotate(D.ang); g.translate((a + b) / 2 + p.ox, p.oy); g.rotate(p.rot); g.globalAlpha = p.al;
      const L = b - a, W = 92 * (p.att ? 1 : .8);
      g.globalCompositeOperation = 'lighter';
      for (const [w, al] of [[W * 1.5, .18], [W, .45], [W * .55, .8]]) {
        g.fillStyle = rgba(c, al); g.beginPath();
        for (let x = -L / 2; x <= L / 2; x += 16) g.lineTo(x, -w / 2 + Math.sin(x * .03 + t * 30) * 6);
        for (let x = L / 2; x >= -L / 2; x -= 16) g.lineTo(x, w / 2 + Math.sin(x * .03 - t * 30) * 6);
        g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(-L / 2, -W * .14, L, W * .28);
      // arcos eléctricos
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2;
      for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = -L / 2; x <= L / 2; x += 22) g.lineTo(x, Math.sin(x * .05 + t * 40 + k * 2) * W * .4 + R(-6, 6)); g.stroke(); }
      // bordes del corte
      if (!p.att) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(-L / 2 - 3, -W / 2, 6, W); g.fillRect(L / 2 - 3, -W / 2, 6, W); }
      g.restore();
    }
    // frente del rayo: bola de energía
    if (D.stage !== 'cut' || !D.boom) { const fx = D.B.cx + Math.cos(D.ang) * D.front, fy = D.B.cy + Math.sin(D.ang) * D.front; g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, c, fx, fy, 150, .9); glowAt(g, [255, 255, 255], fx, fy, 60, .9); g.restore(); }
  }
  function drawParts(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of P) {
      const a = Math.max(0, 1 - p.t / p.life);
      if (p.kind === 'mote' && p.px !== undefined) { g.strokeStyle = rgba(p.c, .9); g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke(); }
      else if (p.kind === 'spark') { g.fillStyle = rgba(p.c || [255, 255, 255], a); g.beginPath(); g.arc(p.x, p.y, 2.6, 0, TAU); g.fill(); }
    }
    g.restore();
  }
  function worldT(g, G) { const c = G.cam, zm = c.zoom * (1 + (c.pz || 0)); g.translate(G.VW / 2, VH / 2); g.scale(zm, zm); g.translate(-G.VW / 2, -VH / 2); g.translate(-(c.x + c.sx + (c.kx || 0)), -(c.y + c.sy + (c.ky || 0))); }
  const dco0 = Game.prototype.drawCinematicOverlay;
  Game.prototype.drawCinematicOverlay = function (g) {
    const C = this.cinematic; if (!C || C.kind !== 'doom') return dco0.call(this, g);
    const b = C.boss, D = b.doom, VW = this.VW, t = this.rt; if (!D) return;
    g.fillStyle = `rgba(10,6,20,${D.stage === 'cut' && D.boom ? .1 : .45})`; g.fillRect(0, 0, VW, VH);
    g.save(); worldT(g, this);
    drawBeam(g, D, t);
    // tajos de Lio sobre el rayo
    if (D.cuts) { g.globalCompositeOperation = 'lighter'; for (const cu of D.cuts) { const a = Math.max(0, 1 - cu.t / .45); if (!a) continue; const x = D.B.cx + Math.cos(D.ang) * cu.s, y = D.B.cy + Math.sin(D.ang) * cu.s; g.save(); g.translate(x, y); g.rotate(D.ang + Math.PI / 2 + cu.a * .4); const gr = g.createLinearGradient(0, -170, 0, 170); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-4 - 8 * a, -170, 8 + 16 * a, 340); g.restore(); } g.globalCompositeOperation = 'source-over'; }
    drawParts(g);
    g.restore();
    // golpe recibido: la pantalla se quema
    if (D.stage === 'hit' && D.t > .2) { const k = Math.max(0, 1 - (D.t - .2) / 1.1); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(D.c, .8 * k); g.fillRect(0, 0, VW, VH); g.fillStyle = `rgba(255,255,255,${.6 * k})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, 60); g.fillRect(0, VH - 60, VW, 60);
  };
  // la carga también se ve sin cinemática (encima de todo)
  const r0 = Game.prototype.render;
  Game.prototype.render = function () {
    r0.call(this);
    const b = this.boss; if (!b || !b.doom || b.doom.stage !== 'charge' || this.mode !== 'play') return;
    const g = this.ctx, D = b.doom, k = Math.min(1, D.t / .6);
    g.setTransform(this.RS, 0, 0, this.RS, 0, 0);
    g.fillStyle = `rgba(10,6,20,${.4 * k})`; g.fillRect(0, 0, this.VW, VH);
    g.save(); worldT(g, this); g.globalCompositeOperation = 'lighter';
    const r = 20 + D.t * 40; glowAt(g, D.c, D.B.cx, D.B.cy, r * 4, .9); glowAt(g, [255, 255, 255], D.B.cx, D.B.cy, r, 1);
    for (let i = 0; i < 3; i++) { const q = (D.t * 1.5 + i / 3) % 1; g.strokeStyle = rgba(D.c, (1 - q) * .8); g.lineWidth = 3; g.beginPath(); g.arc(D.B.cx, D.B.cy, r * (4 - q * 3.5), 0, TAU); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    drawParts(g);
    g.restore();
  };
  const ll0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { P = []; return ll0.call(this, ref); };
  return { startCharge, get parts() { return P; } };
})();
