"use strict";
/* =====================================================================
   JUICE — los pequeños retoques que hacen que el juego "se sienta bien".
   · los enemigos no desaparecen: salen despedidos, giran, rebotan y se desvanecen
   · cada golpe pesa: el enemigo se congela un instante, se aplasta y tiembla;
     la cámara recibe un empujón en la dirección del golpe; el golpe final congela el mundo
   · las monedas vuelan hasta el marcador, que salta y cuenta con un tono que sube
   · con poca vida late el corazón y la pantalla pulsa en rojo
   · al limpiar una arena: zoom de remate, destello y onda
   · los enemigos de las oleadas aparecen con un portal de runas
   ===================================================================== */
const Juice = (() => {
  const J = { impacts: [], corpses: [], flyers: [], inFlight: 0, streak: 0, streakT: 0, beatT: 0, pulse: 0, bumpT: 0, tgt: null, tgtT: 0, punch: 0 };
  const red = () => Store.data.settings.reduced;
  const easeBack = k => { const c = 1.9; k -= 1; return 1 + (c + 1) * k * k * k + c * k * k; };

  /* ---------- golpes a enemigos ---------- */
  const hurt0 = Enemy.prototype.hurt;
  Enemy.prototype.hurt = function (dmg, dir, info = {}) {
    const hpBefore = this.hp, r = hurt0.call(this, dmg, dir, info);
    if (!r) return r;
    const G = this.game, big = info.heavy || info.crit, killed = this.hp <= 0;
    this.hitT = big ? .09 : .06; this.sqT = .18; this.sqDir = dir || 1;
    if (killed && hpBefore > 0) {
      G.freezeT = Math.max(G.freezeT || 0, this.heavy ? .14 : big ? .1 : .07);
      Sound.play('kill', this.heavy || big);
      const cy = this.y - this.h / 2;
      FX.ring(this.x, cy, [255, 255, 255], 60 + this.w, .28);
      FX.spawnRaw({ t: 'flash', x: this.x, y: cy, max: .14, s: 70 + this.w, col: [255, 250, 230], add: 1 });
      impact(this.x, cy, 1.3 + this.w / 80);
    }
    return r;
  };
  // congelación del enemigo golpeado y aparición por portal
  const upd0 = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    if (this.sqT > 0) this.sqT -= dt;
    if (this.spawnT > 0) {
      this.spawnT -= dt; this.inv = .1;
      if (this.spawnT <= 0) { this.spawnT = 0; landSpawn(this); }
      return;
    }
    if (this.hitT > 0) { this.hitT -= dt; return; }
    upd0.call(this, dt);
  };
  // muerte: el cuerpo sale despedido
  const die0 = Enemy.prototype.die;
  Enemy.prototype.die = function (silent) {
    const was = this.dead; die0.call(this, silent);
    if (was || silent || this.noCorpse) return;
    const G = this.game, H = G.hero, dir = Math.sign(this.x - H.x) || -H.face, big = this.heavy || this.w >= 70;
    J.corpses.push({
      e: this, x: this.x, y: this.y - this.h / 2, dir, big, t: 0, rot: 0, bounces: 0,
      vx: dir * (big ? R(90, 140) : R(260, 380)), vy: big ? -R(160, 220) : -R(380, 540),
      vr: dir * (big ? 2.2 : R(9, 15)), life: big ? 1.5 : .95
    });
    if (J.corpses.length > 14) J.corpses.shift();
  };

  /* ---------- héroe herido: el mundo se detiene un instante ---------- */
  const hhurt0 = Hero.prototype.hurt;
  Hero.prototype.hurt = function (dmg, srcX, opt = {}) {
    const r = hhurt0.call(this, dmg, srcX, opt);
    if (r === 'hit') { const G = this.game; G.freezeT = Math.max(G.freezeT || 0, dmg >= 15 ? .09 : .05); kick(G, Math.sign(this.x - srcX) * 7, -4); J.pulse = 1; }
    else if (r === 'block') kick(this.game, Math.sign(this.x - srcX) * 3, 0);
    return r;
  };

  /* ---------- cada golpe del héroe: empujón de cámara y líneas de impacto ---------- */
  const onHit0 = Hero.prototype.onHit;
  Hero.prototype.onHit = function (info) {
    onHit0.call(this, info);
    const big = info.heavy || info.crit;
    if (!info.pogo) kick(this.game, this.face * (big ? 9 : 4.5), big ? -3 : -1.2);
    if (big && info.x !== undefined) impact(info.x, info.y, info.crit ? 1.2 : 1);
  };
  const land0 = Hero.prototype.onLand;
  Hero.prototype.onLand = function () { land0.call(this); const v = this.landVy || 0; if (v > 700) kick(this.game, 0, Math.min(10, (v - 600) / 70)); };
  // estallido de líneas radiales (estilo manga), dura 0.12 s
  function impact(x, y, s) { if (red()) return; J.impacts.push({ x, y, s, t: 0, rot: R(0, TAU) }); if (J.impacts.length > 8) J.impacts.shift(); }
  function drawImpacts(g, dt) {
    for (const m of J.impacts) {
      m.t += dt; const k = m.t / .13; if (k >= 1) continue;
      g.save(); g.translate(m.x, m.y); g.rotate(m.rot); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255,250,235,${(1 - k) * .9})`;
      const r0 = (18 + 40 * k) * m.s, r1 = (70 + 60 * k) * m.s;
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12 + (i % 2) * .12, len = i % 3 === 0 ? r1 * 1.25 : r1, w = (i % 3 === 0 ? 9 : 5) * m.s * (1 - k);
        g.beginPath(); g.moveTo(Math.cos(a) * r0 - Math.sin(a) * w, Math.sin(a) * r0 + Math.cos(a) * w);
        g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.lineTo(Math.cos(a) * r0 + Math.sin(a) * w, Math.sin(a) * r0 - Math.cos(a) * w); g.fill();
      }
      g.restore();
    }
    J.impacts = J.impacts.filter(m => m.t < .13);
  }
  function kick(G, x, y) { if (red()) { x *= .3; y *= .3; } const c = G.cam; c.kx = clamp((c.kx || 0) + x, -16, 16); c.ky = clamp((c.ky || 0) + y, -12, 12); }

  /* ---------- oleadas: aparecen por portales ---------- */
  const wave0 = Game.prototype.spawnWave;
  Game.prototype.spawnWave = function (a) {
    const n0 = this.enemies.length; wave0.call(this, a);
    let i = 0;
    for (const e of this.enemies.slice(n0)) {
      if (e.st === 'intro') continue; // el Bruto tiene su propia entrada
      if (!e.flying) e.y += 400;
      e.spawnMax = e.spawnT = .7 + i * .14; i++;
    }
    if (i) Sound.play('portal');
  };
  function landSpawn(e) {
    const G = e.game; Sound.play('thud');
    FX.land(e.x, e.y, 900); FX.ring(e.x, e.y - e.h / 2, [255, 170, 130], 50 + e.w, .3);
    FX.runeBurst(e.x, e.y - e.h / 2, [255, 200, 150], 8); G.shake(3, .12); e.sqT = .18; e.sqDir = 0;
  }

  /* ---------- monedas al marcador ---------- */
  Game.prototype.collectCoin = function (x, y) {
    this.stats.coins++; Store.data.coins = (Store.data.coins || 0) + 1;
    J.streak = J.streakT > 0 ? J.streak + 1 : 0; J.streakT = .55;
    Sound.play('coin', J.streak);
    FX.spawnRaw({ t: 'flash', x, y, max: .1, s: 22, col: [255, 230, 120], add: 1 });
    const c = this.cam, zm = c.zoom * (1 + (c.pz || 0)), VW = this.VW;
    const sx = (x - c.x - c.sx - (c.kx || 0) - VW / 2) * zm + VW / 2, sy = (y - c.y - c.sy - (c.ky || 0) - VH / 2) * zm + VH / 2;
    J.inFlight++;
    J.flyers.push({ x0: sx, y0: sy, t: -J.flyers.length * .025, dur: R(.42, .58), wob: R(-1, 1), n: J.streak });
  };
  function target(G) {
    if (J.tgt && G.rt - J.tgtT < .5) return J.tgt;
    J.tgtT = G.rt;
    const el = document.querySelector('#h-wallet .chip.coin'), cv = G.cv;
    if (!el || !cv) { J.tgt = { x: 120, y: 40 }; return J.tgt; }
    const r = el.getBoundingClientRect(), cr = cv.getBoundingClientRect();
    if (!r.width || !cr.width) { J.tgt = { x: 120, y: 40 }; return J.tgt; }
    J.tgt = { x: (r.left + 14 - cr.left) / cr.width * G.VW, y: (r.top + r.height / 2 - cr.top) / cr.height * VH };
    return J.tgt;
  }
  function bump() {
    J.bumpT = performance.now();
    const el = document.querySelector('#h-wallet .chip.coin');
    if (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }

  /* ---------- bucle ---------- */
  const update0 = Game.prototype.update;
  Game.prototype.update = function (dt) {
    if (this.mode === 'play' && !UI.modalOpen() && this.freezeT > 0 && !this.cinematic) {
      this.freezeT -= dt; this.rt += dt; tickCam(this, dt); tickFlyers(this, dt); return;
    }
    update0.call(this, dt);
    if (this.mode !== 'play' || UI.modalOpen()) return;
    tickCam(this, dt); tickFlyers(this, dt);
    const gdt = dt * (this.cinematic ? (this.cinematic.worldTs ?? 0) : this.timeScale);
    // cadáveres
    for (const c of J.corpses) {
      c.t += gdt; c.vy += 1500 * gdt; c.x += c.vx * gdt; c.y += c.vy * gdt; c.rot += c.vr * gdt;
      if (c.big) c.rot = clamp(c.rot, -1.45, 1.45);
      const e = c.e, half = e.h / 2, fl = this.world.floorAt(c.x, c.y - half);
      if (c.y + half * .6 > fl && c.vy > 0) {
        c.y = fl - half * .6;
        if (c.bounces < 1 && !c.big) { c.vy *= -.38; c.vx *= .55; c.vr *= .5; c.bounces++; FX.land(c.x, fl, 500); }
        else { c.vy = 0; c.vx *= Math.pow(.02, gdt); c.vr *= Math.pow(.02, gdt); if (!c.landed) { c.landed = 1; if (c.big) { FX.land(c.x, fl, 1400); this.shake(6, .2); Sound.play('thud'); } } }
      }
      if (c.t > c.life && !c.poofed) { c.poofed = 1; FX.smoke(c.x, c.y, 4, [235, 230, 240], 10); FX.runeBurst(c.x, c.y, [255, 240, 200], 4); }
    }
    J.corpses = J.corpses.filter(c => c.t < c.life + .05);
    // poca vida: latido
    const H = this.hero;
    if (!H.dead && H.hp > 0 && H.hp < H.maxHp * .3 && !this.cinematic) {
      J.beatT -= dt;
      if (J.beatT <= 0) { const crit = H.hp < H.maxHp * .15; J.beatT = crit ? .62 : .9; Sound.play('heart', crit ? 1.2 : .9); J.pulse = 1; Input.rumble(.12, 0, 60); }
    } else J.beatT = .3;
    J.pulse = Math.max(0, J.pulse - dt * 2.6);
    J.streakT -= dt;
    // zoom de remate
    if (J.punch > 0) { J.punch -= dt; const k = J.punch / .7; this.cam.pz = .09 * Math.sin(Math.min(1, (1 - k) * 4) * Math.PI / 2) * k; if (J.punch <= 0) this.cam.pz = 0; }
  };
  function tickCam(G, dt) { const c = G.cam, d = Math.exp(-dt * 16); c.kx = (c.kx || 0) * d; c.ky = (c.ky || 0) * d; }
  function tickFlyers(G, dt) {
    for (const f of J.flyers) {
      f.t += dt;
      if (f.t >= f.dur && !f.done) { f.done = 1; J.inFlight = Math.max(0, J.inFlight - 1); Sound.play('coinIn', f.n); bump(); }
    }
    J.flyers = J.flyers.filter(f => !f.done);
  }

  /* ---------- arena limpia: remate ---------- */
  const clear0 = Game.prototype.clearArena;
  Game.prototype.clearArena = function (a) {
    clear0.call(this, a);
    J.punch = .7; this.flashScreen([255, 250, 220], .4); this.freezeT = Math.max(this.freezeT || 0, .12);
    FX.ring(this.hero.x, this.hero.y - 40, [255, 240, 180], 260, .6); Sound.play('kill', true); Input.rumble(.5, .6, 200);
  };
  const load0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { J.corpses = []; J.flyers = []; J.inFlight = 0; J.punch = 0; J.pulse = 0; this.freezeT = 0; this.cam.pz = 0; this.cam.kx = this.cam.ky = 0; return load0.call(this, ref); };

  /* ---------- dibujo ---------- */
  // enemigo con aplastamiento, temblor de impacto y aparición por portal
  function drawEnemy(g, e, G) {
    const plain = !(e.w < 120 && e.h < 140 && !e.noOutline);
    const body = () => { if (plain) e.draw(g); else drawOutlined(g, e.x, e.y - e.h / 2, gg => e.draw(gg), undefined, Math.max(e.w, e.h) * 2.4 + 90, e.h * 2.2 + 90); };
    let sx = 1, sy = 1, ox = 0, oy = 0, a = 1;
    if (e.spawnT > 0) {
      const p = 1 - e.spawnT / e.spawnMax;
      drawPortal(g, e, p, G.rt);
      if (p < .55) return;
      const k = easeBack((p - .55) / .45); sx = sy = Math.max(.01, k); a = Math.min(1, (p - .55) / .2);
    }
    if (e.sqT > 0) { const k = e.sqT / .18, w = Math.sin((1 - k) * Math.PI * 2.5) * k; sx *= 1 + .22 * w; sy *= 1 - .18 * w; }
    if (e.hitT > 0) { ox = R(-3, 3); oy = R(-2, 2); }
    if (sx === 1 && sy === 1 && !ox && a === 1) { body(); return; }
    g.save(); g.globalAlpha = a; g.translate(e.x + ox, e.y + oy); g.scale(sx, sy); g.translate(-e.x, -e.y); body(); g.restore();
  }
  function drawPortal(g, e, p, rt) {
    const cx = e.x, cy = e.flying ? e.y - e.h / 2 : e.y - 2, r = 30 + e.w * .7;
    const open = Math.min(1, p / .3), close = p > .75 ? 1 - (p - .75) / .25 : 1, k = open * close;
    if (k <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    // círculo de runas en el suelo (elipse plana) o anillo en el aire
    g.translate(cx, cy); if (!e.flying) g.scale(1, .32);
    g.strokeStyle = `rgba(255,150,110,${.8 * k})`; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, r * open, 0, TAU); g.stroke();
    g.strokeStyle = `rgba(255,220,170,${.6 * k})`; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, r * open * .7, rt * 3, rt * 3 + TAU * .8); g.stroke();
    g.fillStyle = `rgba(255,210,160,${.7 * k})`; g.font = '700 13px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const RU = 'ᚠᚢᚦᚨᚱᚲᚷᚹ';
    for (let i = 0; i < 8; i++) { const an = -rt * 1.6 + i * TAU / 8; g.fillText(RU[i], Math.cos(an) * r * open * .85, Math.sin(an) * r * open * .85); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(255,180,130,${.45 * k})`); gr.addColorStop(1, 'rgba(255,120,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.restore();
    // columna de luz
    if (!e.flying && p > .3) {
      const h = 220 * Math.min(1, (p - .3) / .25), w = (14 + e.w * .5) * close;
      g.save(); g.globalCompositeOperation = 'lighter';
      const lg = g.createLinearGradient(0, cy - h, 0, cy); lg.addColorStop(0, 'rgba(255,200,150,0)'); lg.addColorStop(1, `rgba(255,210,170,${.55 * close})`);
      g.fillStyle = lg; g.fillRect(cx - w / 2, cy - h, w, h); g.restore();
    }
  }
  let lastDraw = 0;
  function drawFront(g, G) {
    const now = performance.now() / 1000, dt = lastDraw ? Math.min(.05, now - lastDraw) : 0; lastDraw = now;
    drawImpacts(g, G.freezeT > 0 ? dt * .35 : dt * (G.timeScale || 1));
  }
  function drawCorpses(g) {
    for (const c of J.corpses) {
      const e = c.e, k = c.t / c.life, a = k < .65 ? 1 : 1 - (k - .65) / .35, s = k < .8 ? 1 : 1 - (k - .8) / .2 * .5;
      if (a <= 0) continue;
      const ex = e.x, ey = e.y, ef = e.flash;
      e.x = c.x; e.y = c.y + e.h / 2; e.flash = c.t < .09 ? 1 : 0;
      g.save(); g.globalAlpha = a; g.translate(c.x, c.y); g.rotate(c.rot); g.scale(s, s); g.translate(-c.x, -c.y);
      try { e.draw(g); } catch (er) { }
      g.restore();
      e.x = ex; e.y = ey; e.flash = ef;
    }
  }
  // capa de pantalla: monedas voladoras, pulso de poca vida
  function overlay(G, g) {
    const VW = G.VW;
    if (J.pulse > 0 && G.hero.hp < G.hero.maxHp * .3) {
      const a = J.pulse * (red() ? .12 : .3);
      const gr = g.createRadialGradient(VW / 2, VH / 2, VH * .38, VW / 2, VH / 2, VW * .62);
      gr.addColorStop(0, 'rgba(180,0,10,0)'); gr.addColorStop(1, `rgba(200,10,20,${a})`);
      g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    }
    if (!J.flyers.length) return;
    const T = target(G);
    for (const f of J.flyers) {
      if (f.t < 0) continue;
      const k = Math.min(1, f.t / f.dur), e = k * k * (3 - 2 * k);
      // curva: primero sale hacia arriba y hacia fuera, luego cae al marcador
      const mx = (f.x0 + T.x) / 2 + f.wob * 120, my = Math.min(f.y0, T.y) - 120;
      const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * mx + e * e * T.x, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * my + e * e * T.y;
      const s = 1.15 - .45 * e, w = Math.abs(Math.cos(f.t * 14)) * 8 * s + 1;
      g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 210, 80], x, y, 18 * s, .5); g.restore();
      g.fillStyle = '#c8861a'; g.beginPath(); g.ellipse(x, y, w + 1, 9 * s, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffd848'; g.beginPath(); g.ellipse(x, y, w, 8 * s, 0, 0, TAU); g.fill();
      if (w > 4) { g.fillStyle = '#fff6b0'; g.fillRect(x - 1, y - 5 * s, 2, 10 * s); }
    }
  }
  const render0 = Game.prototype.render;
  Game.prototype.render = function () {
    render0.call(this);
    if (this.mode !== 'play' && this.mode !== 'paused') return;
    const g = this.ctx; g.setTransform(this.RS, 0, 0, this.RS, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    overlay(this, g);
  };

  return { J, drawEnemy, drawCorpses, drawFront, get inFlight() { return J.inFlight; } };
})();
