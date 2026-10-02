"use strict";
/* =====================================================================
   ULT FX — los ataques definitivos de las armas nuevas, a lo grande.
   Durante la cinemática el mundo está congelado, así que estos efectos tienen
   su propio sistema de partículas que se mueve con el tiempo real.
   · Ojo del Huracán (báculo): nubes de tormenta que se cierran, viento que barre
     la pantalla, lluvia, un tornado de verdad hecho de polvo y escombros que gira
     en 3D, rayos que caen y enemigos girando dentro hasta que se estrellan.
   · Lluvia de Estrellas (arco): se hace de noche con aurora, la luz de todo el
     cielo se acumula en un orbe, estalla, forma constelaciones y cae en cometas.
   · Eclipse (guadaña): corona solar, la pantalla se parte con cada tajo.
   · Sol Danzante (chakram): mandala solar de geometría dorada y estallido solar.
   ===================================================================== */
const UltFX = (() => {
  const TYPES = new Set(['bow', 'scythe', 'chakram', 'staff']);
  const DUR = { bow: 3.7, scythe: 3.2, chakram: 3.1, staff: 3.8 };
  let P = [];   // partículas propias (coordenadas de mundo)
  const add = o => { if (P.length < 900) P.push(Object.assign({ t: 0, life: 1, vx: 0, vy: 0, g: 0, drag: 0 }, o)); };

  const su0 = Game.prototype.startUltCinematic;
  Game.prototype.startUltCinematic = function (weapon, power) {
    su0.call(this, weapon, power);
    const C = this.cinematic; if (!C) return;
    if (this.ultWeak) {
      // respuesta incorrecta: versión sencilla y más floja del definitivo
      const W = WEAPONS[weapon]; UI.ultBanner(W.ult + ' · versión débil', 'Respuesta incorrecta: acierta para verlo con toda su fuerza', [180, 180, 190]);
      if (!TYPES.has(weapon)) { C.weakv = true; C.dur = 1.5; C.x0 = this.hero.x; C.y0 = this.hero.y; this.cam.tz = 1.08; }
      return;
    }
    if (!TYPES.has(weapon)) return;
    const H = this.hero;
    P = []; C.dur = DUR[weapon]; C.fxv = true; C.x0 = H.x; C.y0 = H.y; C.cx = H.x + H.face * 40; C.ground = H.y;
    C.T = C.targets.filter(e => !e.dead).slice(0, 10);
    C.T.forEach((e, i) => { e._uy = e.y; e._ux = e.x; e._ua = i * 2.1; e._uh = .25 + (i % 4) * .17; });
    C.bolts = []; C.flash = 0; C.shake = 0;
  };

  /* ================= ACTUALIZACIÓN ================= */
  const uc0 = Game.prototype.updateCinematic;
  Game.prototype.updateCinematic = function (dt) {
    const C = this.cinematic;
    if (C && C.weakv) {
      // un único corte de luz que cruza la pantalla
      C.t += dt; const H = this.hero;
      if (C.t > .55 && !C.boom) { C.boom = 1; this.ultDamage(150 * C.power); Sound.play('swing', true); this.shake(8, .3); FX.text(H.x, H.y - 140, WEAPONS[H.weapon].ult.toUpperCase() + '…', '#d8d8e0', 40); }
      if (C.t >= C.dur) { this.cinematic = null; this.cam.tz = 1; H.inv = .8; H.vy = 0; UI.ultBanner(null); }
      return;
    }
    if (!C || !C.fxv) return uc0.call(this, dt);
    const H = this.hero, c = this.cam, VW = this.VW; C.t += dt; const t = C.t;
    C.flash = Math.max(0, C.flash - dt * 3);
    ({ staff: storm, bow: starfall, scythe: eclipse, chakram: sun })[C.type].call(this, C, H, dt, t, c, VW);
    // partículas propias
    for (const p of P) {
      p.t += dt; if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      if (p.fn) p.fn(p, dt, t); else { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    }
    P = P.filter(p => p.t < p.life);
    if (C.shake) this.shake(C.shake, .05);
    if (t >= C.dur) {
      for (const e of C.T) { if (e._uy !== undefined && !e.dead) { e.vy = 300; } delete e._uy; }
      this.cinematic = null; this.cam.tz = 1; H.inv = .8; H.vy = 0; H.x = C.x0; H.y = C.y0; UI.ultBanner(null); P = [];
    }
  };

  // ---------- OJO DEL HURACÁN ----------
  function funnel(C, h, t) { // posición de un punto del embudo a la altura h (0 suelo · 1 cielo)
    const r = 26 + 210 * Math.pow(h, 1.5), sway = Math.sin(t * 1.7 + h * 3) * 26 * h;
    return { r, cx: C.cx + sway, y: C.ground - h * 560 };
  }
  function storm(C, H, dt, t, c, VW) {
    const grow = clamp((t - .55) / .7, 0, 1) * (t > 2.9 ? clamp(1 - (t - 2.9) / .35, 0, 1) : 1);
    C.grow = grow;
    // Lio alza el báculo; rayo de su orbe al cielo
    if (t < .5) H.y = lerp(C.y0, C.y0 - 30, t / .5);
    if (t > .25 && !C.beam) { C.beam = 1; C.flash = .6; C.bolts.push(bolt(H.x + H.face * 12, H.y - 64, H.x + H.face * 12, c.y - 40, .35)); Sound.play('thunder'); }
    // viento que barre la pantalla hacia el tornado
    if (t > .2 && t < 3) for (let k = 0; k < 3; k++) { const side = chance(.5) ? -1 : 1, y = c.y + R(80, 680); add({ kind: 'wind', x: C.cx + side * R(500, 900), y, vx: -side * R(900, 1500), vy: R(-40, 40), life: .7, len: R(60, 180), w: R(1, 2.4) }); }
    // lluvia
    if (t > .35) for (let k = 0; k < 6; k++) add({ kind: 'rain', x: c.x + R(-100, VW + 100), y: c.y - 20, vx: -260, vy: R(1300, 1700), life: .7 });
    // polvo y escombros del embudo (giran en 3D y suben)
    if (grow > 0) {
      for (let k = 0; k < 7; k++) {
        const big = chance(.55);
        add({ kind: big ? 'dust' : (chance(.6) ? 'rock' : 'leaf'), h: R(0, .15), a: R(0, TAU), w: R(3.5, 6), up: R(.18, .34), s: big ? R(18, 46) : R(3, 7), col: big ? [R(150, 190), R(150, 185), R(160, 200)] : pick([[90, 80, 70], [70, 60, 55], [120, 150, 70]]), rot: R(0, TAU), life: R(2.2, 3.4),
          fn: (p, dt, tt) => { p.h += p.up * dt * (1 + p.h); p.a += p.w * dt * (1.6 - p.h); p.rot += dt * 8; const F = funnel(C, Math.min(1.1, p.h), tt); const rr = F.r * (C.grow || 0); p.x = F.cx + Math.cos(p.a) * rr; p.y = F.y; p.z = Math.sin(p.a); } });
      }
      // escombros del suelo arrastrados hacia el tornado
      if (chance(.8)) { const side = chance(.5) ? -1 : 1, x = C.cx + side * R(150, 520); add({ kind: chance(.5) ? 'rock' : 'leaf', x, y: C.ground - 4, vx: -side * R(250, 420), vy: -R(80, 260), g: -60, life: 1.2, s: R(3, 6), col: pick([[90, 80, 70], [110, 140, 60], [140, 110, 70]]), rot: 0, spin: R(-10, 10) }); }
      // anillo de polvo en la base
      if (chance(.9)) { const a = R(0, TAU); add({ kind: 'dust', x: C.cx + Math.cos(a) * R(60, 200), y: C.ground - R(0, 20), vx: -Math.sin(a) * 300, vy: -R(20, 70), drag: .8, life: 1, s: R(26, 60), col: [170, 165, 160] }); }
    }
    // enemigos atrapados: giran dentro del embudo y suben
    const lift = clamp((t - .8) / 1.4, 0, 1);
    for (const e of C.T) {
      if (t < 2.95) { e._ua += dt * (4 - e._uh * 2); const F = funnel(C, e._uh * lift, t), rr = F.r * .75 * Math.min(1, grow * 1.3); e.x = lerp(e._ux, F.cx + Math.cos(e._ua) * rr, Math.min(1, lift * 1.6)); e.y = lerp(e._uy, F.y + e.h / 2, Math.min(1, lift * 1.6)); e.face = Math.cos(e._ua) > 0 ? 1 : -1; e.flash = Math.sin(t * 30) > .7 ? .05 : 0; }
      else if (!e._slam) { e._slam = 1; e.x = e._ux + (e._ux - C.cx) * .2; e.y = e._uy; }
    }
    // rayos dentro de la tormenta
    if (t > .9 && t < 2.9 && chance(dt * 7)) {
      const e = C.T.length && chance(.7) ? pick(C.T) : null, x = e ? e.x : C.cx + R(-300, 300), y = e ? e.y - e.h / 2 : C.ground;
      C.bolts.push(bolt(x + R(-60, 60), c.y - 30, x, y, .22)); C.flash = Math.max(C.flash, .45); C.lit = .4; Sound.play('thunder');
      if (e) FX.hit(e.x, e.y - e.h / 2, 1, [200, 230, 255], true);
      for (let k = 0; k < 10; k++) add({ kind: 'spark', x, y, vx: R(-400, 400), vy: R(-400, 100), g: 900, life: .4, col: [210, 235, 255] });
    }
    C.lit = Math.max(0, (C.lit || 0) - dt * 2.5);
    C.shake = 2 + grow * 6;
    // final: el tornado se derrumba y los estrella contra el suelo
    if (t > 2.95 && !C.boom) {
      C.boom = 1; this.ultDamage(160 * C.power); C.flash = 1; C.shake = 22; this.shake(24, .8); Sound.play('slam', 2); Sound.play('explode');
      FX.text(H.x, C.y0 - 200, 'EYE OF THE STORM!', '#cfe8ff', 72);
      for (const e of C.T) for (let k = 0; k < 14; k++) add({ kind: 'dust', x: e._ux + R(-30, 30), y: e._uy - R(0, 20), vx: R(-320, 320), vy: -R(40, 200), drag: 2, life: 1, s: R(20, 50), col: [170, 165, 160] });
      for (let k = 0; k < 40; k++) add({ kind: 'rock', x: C.cx + R(-60, 60), y: C.ground - R(100, 500), vx: R(-700, 700), vy: R(-500, 200), g: 1400, life: 1.4, s: R(3, 7), col: [90, 80, 70], rot: 0, spin: R(-12, 12) });
    }
    for (const B of C.bolts) B.t += dt; C.bolts = C.bolts.filter(B => B.t < B.life);
  }
  function bolt(x0, y0, x1, y1, life) {
    const pts = [[x0, y0]], n = 12; for (let i = 1; i < n; i++) { const k = i / n; pts.push([lerp(x0, x1, k) + R(-34, 34) * Math.sin(k * Math.PI), lerp(y0, y1, k)]); } pts.push([x1, y1]);
    const br = []; for (let j = 0; j < 3; j++) { const s = pts[2 + ((Math.random() * (n - 4)) | 0)], b = [[s[0], s[1]]]; let x = s[0], y = s[1]; for (let i = 0; i < 4; i++) { x += R(-40, 40); y += R(20, 50); b.push([x, y]); } br.push(b); }
    return { pts, br, t: 0, life };
  }

  // ---------- LLUVIA DE ESTRELLAS ----------
  function starfall(C, H, dt, t, c, VW) {
    const gx = C.x0 + H.face * 30, gy = C.y0 - 330; C.gx = gx; C.gy = gy;
    if (t < .5) H.y = lerp(C.y0, C.y0 - 150, easeOut(t / .5)); else if (t < 2.9) H.y = C.y0 - 150 + Math.sin(t * 3) * 6;
    // la luz de todo el cielo se acumula en un orbe
    C.orb = t < .45 ? 0 : t < 1.55 ? easeOut((t - .45) / 1.1) : t < 1.7 ? 1 + (t - 1.55) * 3 : 0;
    if (t > .4 && t < 1.55) for (let k = 0; k < 9; k++) { const a = R(0, TAU), d = R(420, 900); add({ kind: 'mote', x: gx + Math.cos(a) * d, y: gy + Math.sin(a) * d * .7, life: 1.2, col: pick([[255, 250, 220], [200, 255, 210], [190, 220, 255]]), s: R(1.5, 3.5), fn: (p, dt) => { const dx = gx - p.x, dy = gy - p.y, dd = Math.hypot(dx, dy) || 1, sp = 300 + 1600 * (p.t / 1.2); p.px = p.x; p.py = p.y; p.x += dx / dd * Math.min(dd, sp * dt); p.y += dy / dd * Math.min(dd, sp * dt); if (dd < 12) p.t = 99; } }); }
    if (t > .45 && !C.hum) { C.hum = 1; Sound.play('ultCharge'); }
    // estalla y forma constelaciones encima de cada enemigo
    if (t > 1.6 && !C.burst) {
      C.burst = 1; C.flash = .9; Sound.play('ultFire'); this.shake(10, .3);
      C.stars = (C.T.length ? C.T : [{ x: gx - 200, y: C.y0, h: 20 }, { x: gx + 200, y: C.y0, h: 20 }]).map((e, i) => ({ x: e.x + R(-40, 40), y: c.y + R(90, 210), tx: e.x, ty: e.y - (e.h || 20) / 2, t0: 1.65 + i * .06, fired: 0 }));
      for (let k = 0; k < 80; k++) { const a = R(0, TAU), s = R(200, 900); add({ kind: 'spark', x: gx, y: gy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 1.5, life: R(.5, 1), col: [230, 255, 220] }); }
    }
    // la luz empieza a caer: cometas desde cada estrella
    if (C.stars) for (const s of C.stars) {
      if (!s.fired && t > s.t0 + .45) { s.fired = 1; for (let k = 0; k < 3; k++) add({ kind: 'comet', x: s.x + R(-20, 20), y: s.y, sx: s.x, sy: s.y, tx: s.tx + R(-14, 14), ty: s.ty, life: .42 + k * .1, delay: k * .1, fn: (p) => { const q = clamp((p.t - p.delay) / (p.life - p.delay), 0, 1), e = q * q; p.px = p.x; p.py = p.y; p.x = lerp(p.sx, p.tx, e); p.y = lerp(p.sy, p.ty, e); if (q >= 1 && !p.hit) { p.hit = 1; impact(p.tx, p.ty); } } }); }
    }
    if (t > 2.85 && !C.boom) {
      C.boom = 1; this.ultDamage(150 * C.power); C.flash = 1; this.shake(18, .7); Sound.play('explode');
      FX.text(H.x, C.y0 - 220, 'STARFALL!', '#d8ffc8', 80);
      C.pillars = (C.stars || []).map(s => ({ x: s.tx, t: 0 }));
    }
    if (C.pillars) for (const p of C.pillars) p.t += dt;
    C.shake = C.orb > 0 ? C.orb * 3 : 0;
  }
  function impact(x, y) {
    Sound.play('crit');
    for (let k = 0; k < 16; k++) { const a = R(0, TAU), s = R(150, 520); add({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, g: 700, life: R(.4, .8), col: [225, 255, 215] }); }
    add({ kind: 'ring', x, y, life: .45, r0: 10, r1: 110, col: [220, 255, 210] });
    for (let k = 0; k < 4; k++) add({ kind: 'shard', x, y, vx: R(-260, 260), vy: -R(200, 500), g: 1300, life: .9, s: R(4, 7), rot: R(0, TAU), spin: R(-12, 12) });
  }

  // ---------- ECLIPSE ----------
  function eclipse(C, H, dt, t, c, VW) {
    C.ecl = clamp((t - .15) / .6, 0, 1);
    if (t > .8 && t < 2.3 && Math.floor((t - .8) / .17) >= (C.n || 0)) {
      const i = C.n = (C.n || 0) + 1, e = C.T.length ? C.T[(i - 1) % C.T.length] : null;
      const x = e ? e.x : C.x0 + (i % 2 ? 220 : -220), y = e ? e.y - e.h / 2 : C.y0 - 60, a = R(-.8, .8) + (i % 2 ? Math.PI : 0);
      C.cut = { x, y, a, t: 0 }; C.cuts = C.cuts || []; C.cuts.push(C.cut); C.inv = .09; Sound.play('reap'); this.shake(8, .1);
      FX.afterimage(H.snapshot()); H.x = x - Math.cos(a) * 80; H.y = (e ? e.y : C.y0); H.face = Math.cos(a) > 0 ? 1 : -1;
      for (let k = 0; k < 18; k++) add({ kind: 'petal', x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-200, 200), vy: R(-200, 0), g: 120, drag: 1.2, life: R(1.2, 2), s: R(3, 6), rot: R(0, TAU), spin: R(-8, 8), col: pick([[220, 200, 255], [255, 255, 255], [170, 140, 255]]) });
    }
    if (C.cuts) for (const s of C.cuts) s.t += dt;
    C.inv = Math.max(0, (C.inv || 0) - dt);
    if (t > .3) for (let k = 0; k < 2; k++) add({ kind: 'petal', x: c.x + R(0, VW), y: c.y - 10, vx: R(-40, 40), vy: R(40, 120), drag: .3, life: 3, s: R(2.5, 5), rot: R(0, TAU), spin: R(-4, 4), col: pick([[200, 180, 255], [240, 230, 255]]), fn: (p, dt, tt) => { p.x += (p.vx + Math.sin(tt * 2 + p.s) * 40) * dt; p.y += p.vy * dt; p.rot += p.spin * dt; } });
    if (t > 2.4 && !C.boom) { C.boom = 1; H.x = C.x0; H.y = C.y0; this.ultDamage(160 * C.power); C.flash = 1; this.shake(20, .8); FX.text(H.x, H.y - 180, 'ECLIPSE!', '#e6d8ff', 86); Sound.play('ultFire'); }
  }

  // ---------- SOL DANZANTE ----------
  function sun(C, H, dt, t, c, VW) {
    if (t > .2 && !C.discs) { C.discs = []; for (let i = 0; i < 8; i++) C.discs.push({ a: i * TAU / 8, r: 0, x: H.x, y: H.y - 60, tgt: C.T.length ? C.T[i % C.T.length] : null }); Sound.play('whirr'); }
    if (C.discs) for (const d of C.discs) {
      d.px = d.x; d.py = d.y;
      if (t < 1.25) { d.r = Math.min(170, d.r + dt * 320); d.a += dt * (5 + t * 3); d.x = H.x + Math.cos(d.a) * d.r; d.y = H.y - 70 + Math.sin(d.a) * d.r * .75; }
      else if (t < 2.3) { const e = d.tgt, tx = e ? e.x + Math.cos(t * 10 + d.a) * 46 : H.x + Math.cos(d.a + t * 4) * 280, ty = e ? e.y - e.h / 2 + Math.sin(t * 10 + d.a) * 34 : H.y - 70; d.x = lerp(d.x, tx, Math.min(1, dt * 10)); d.y = lerp(d.y, ty, Math.min(1, dt * 10)); if (chance(dt * 8)) { Sound.play('crit'); for (let k = 0; k < 6; k++) add({ kind: 'ember', x: d.x, y: d.y, vx: R(-300, 300), vy: R(-300, 100), g: 400, life: .6, s: R(2, 4) }); } }
      else { d.x = lerp(d.x, H.x, Math.min(1, dt * 9)); d.y = lerp(d.y, H.y - 80, Math.min(1, dt * 9)); }
      add({ kind: 'fire', x: d.x, y: d.y, vx: R(-20, 20), vy: R(-60, -20), life: .35, s: R(5, 9) });
    }
    C.core = t < 2.3 ? clamp(t / 1.2, 0, 1) : 1 + (t - 2.3) * 3;
    if (t > 2.4 && !C.boom) { C.boom = 1; this.ultDamage(150 * C.power); C.flash = 1; this.shake(18, .7); Sound.play('explode'); FX.text(H.x, H.y - 180, 'DANCING SUN!', '#ffe08a', 82); for (let k = 0; k < 90; k++) { const a = R(0, TAU), s = R(200, 900); add({ kind: 'ember', x: H.x, y: H.y - 80, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 1.2, g: 200, life: R(.6, 1.3), s: R(2, 5) }); } }
  }

  /* ================= DIBUJO ================= */
  const dco0 = Game.prototype.drawCinematicOverlay;
  Game.prototype.drawCinematicOverlay = function (g) {
    const C = this.cinematic;
    if (C && C.weakv) {
      const VW = this.VW, k = Math.min(1, C.t * 4, (C.dur - C.t) * 4), p = clamp((C.t - .35) / .35, 0, 1), col = WEAPONS[this.hero.weapon].col;
      g.fillStyle = `rgba(0,0,0,${.25 * k})`; g.fillRect(0, 0, VW, VH);
      if (p > 0 && p < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const x = lerp(-200, VW + 200, p), y = VH * .55; const gr = g.createLinearGradient(x - 260, 0, x, 0); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, 'rgba(255,255,255,.9)'); g.fillStyle = gr; g.fillRect(x - 260, y - 6, 260, 12); g.restore(); }
      g.fillStyle = '#000'; g.fillRect(0, 0, VW, 50 * k); g.fillRect(0, VH - 50 * k, VW, 50 * k);
      return;
    }
    if (!C || !C.fxv) return dco0.call(this, g);
    const VW = this.VW, t = C.t, c = this.cam, H = this.hero, k = Math.min(1, t * 3, (C.dur - t) * 3);
    const zm = c.zoom * (1 + (c.pz || 0));
    const world = () => { g.translate(VW / 2, VH / 2); g.scale(zm, zm); g.translate(-VW / 2, -VH / 2); g.translate(-(c.x + c.sx + (c.kx || 0)), -(c.y + c.sy + (c.ky || 0))); };
    g.save();
    ({ staff: drawStorm, bow: drawStarfall, scythe: drawEclipse, chakram: drawSun }[C.type]).call(this, g, C, H, t, k, VW, world, c);
    g.restore();
    // destello
    if (C.flash > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,255,255,${C.flash * .6})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    // franjas de cine
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, 70 * k); g.fillRect(0, VH - 70 * k, VW, 70 * k);
  };
  function drawParts(g, filter) {
    for (const p of P) {
      if (filter && !filter(p)) continue;
      const a = Math.max(0, 1 - p.t / p.life);
      if (p.kind === 'wind') { g.strokeStyle = `rgba(230,240,255,${a * .5})`; g.lineWidth = p.w; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - Math.sign(p.vx) * p.len, p.y - p.vy * .05); g.stroke(); }
      else if (p.kind === 'rain') { g.strokeStyle = 'rgba(190,210,240,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 7, p.y - 30); g.stroke(); }
      else if (p.kind === 'dust') { const al = (p.z !== undefined ? .14 + .14 * (p.z + 1) / 2 : .3) * Math.min(1, p.t * 4) * a; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); gr.addColorStop(0, `rgba(${p.col[0] | 0},${p.col[1] | 0},${p.col[2] | 0},${al})`); gr.addColorStop(1, `rgba(${p.col[0] | 0},${p.col[1] | 0},${p.col[2] | 0},0)`); g.fillStyle = gr; g.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); }
      else if (p.kind === 'rock' || p.kind === 'leaf' || p.kind === 'shard' || p.kind === 'petal') {
        if (p.spin) p.rot = (p.rot || 0) + p.spin * .016;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot || 0); g.globalAlpha = Math.min(1, a * 2) * (p.z !== undefined ? .55 + .45 * (p.z + 1) / 2 : 1);
        if (p.kind === 'rock') { g.fillStyle = rgba(p.col); g.beginPath(); g.moveTo(-p.s, -p.s * .6); g.lineTo(p.s * .8, -p.s); g.lineTo(p.s, p.s * .5); g.lineTo(-p.s * .4, p.s); g.fill(); }
        else if (p.kind === 'leaf') { g.fillStyle = rgba(p.col); g.beginPath(); g.ellipse(0, 0, p.s * 1.4, p.s * .6, 0, 0, TAU); g.fill(); }
        else if (p.kind === 'shard') { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(230,255,220,.95)'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? p.s * .4 : p.s, an = i * Math.PI / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.fill(); }
        else { g.fillStyle = rgba(p.col, .9); g.beginPath(); g.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); g.fill(); }
        g.restore();
      }
      else if (p.kind === 'spark' || p.kind === 'ember' || p.kind === 'fire' || p.kind === 'mote') {
        g.globalCompositeOperation = 'lighter';
        const col = p.kind === 'ember' || p.kind === 'fire' ? [255, 170, 60] : p.col;
        if (p.kind === 'fire') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 2); gr.addColorStop(0, `rgba(255,220,140,${a})`); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(p.x - p.s * 2, p.y - p.s * 2, p.s * 4, p.s * 4); }
        else if (p.kind === 'mote' && p.px !== undefined) { g.strokeStyle = rgba(col, .8); g.lineWidth = p.s; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke(); }
        else { g.fillStyle = rgba(col, a); g.beginPath(); g.arc(p.x, p.y, p.s || 2.2, 0, TAU); g.fill(); }
        g.globalCompositeOperation = 'source-over';
      }
      else if (p.kind === 'ring') { const q = p.t / p.life; g.strokeStyle = rgba(p.col, 1 - q); g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.ellipse(p.x, p.y, lerp(p.r0, p.r1, q), lerp(p.r0, p.r1, q) * .4, 0, 0, TAU); g.stroke(); }
      else if (p.kind === 'comet') {
        if (p.t < p.delay || p.px === undefined) continue; const q = clamp((p.t - p.delay) / (p.life - p.delay), 0, 1); if (q >= 1) continue;
        g.globalCompositeOperation = 'lighter';
        const tx = p.x - (p.tx - p.sx) * .35, ty = p.y - (p.ty - p.sy) * .35, gr = g.createLinearGradient(tx, ty, p.x, p.y); gr.addColorStop(0, 'rgba(180,255,190,0)'); gr.addColorStop(1, 'rgba(250,255,240,1)');
        g.strokeStyle = gr; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(p.x, p.y); g.stroke();
        glowAt(g, [220, 255, 210], p.x, p.y, 30, 1); g.globalCompositeOperation = 'source-over';
      }
    }
  }
  function drawBolts(g, C) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const B of C.bolts) { const a = 1 - B.t / B.life; for (const [w, col] of [[12, `rgba(120,170,255,${a * .35})`], [5, `rgba(200,225,255,${a * .8})`], [2, `rgba(255,255,255,${a})`]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (const [x, y] of B.pts) g.lineTo(x, y); g.stroke(); g.lineWidth = w * .5; for (const b of B.br) { g.beginPath(); for (const [x, y] of b) g.lineTo(x, y); g.stroke(); } } }
    g.restore();
  }

  function drawStorm(g, C, H, t, k, VW, world, c) {
    // cielo de tormenta que se oscurece, con nubes que se cierran desde los lados
    const dark = clamp(t / .6, 0, 1) * k;
    g.fillStyle = `rgba(14,18,30,${.5 * dark})`; g.fillRect(0, 0, VW, VH);
    const lit = C.lit || 0;
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? -1 : 1, close = clamp(t / 1.1, 0, 1), x = VW / 2 + side * (VW * .65 - close * VW * .35) + Math.sin(i * 7.3) * VW * .3 + Math.sin(t * .8 + i) * 30, y = 40 + (i % 5) * 34 + Math.sin(t + i) * 8, r = 110 + (i % 4) * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${50 + lit * 160},${56 + lit * 160},${74 + lit * 160},${.85 * dark})`); gr.addColorStop(1, 'rgba(30,34,48,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.save(); world();
    // embudo: primero la parte trasera, luego los enemigos ya están dibujados, luego la delantera
    drawParts(g, p => (p.z !== undefined && p.z < 0) || p.kind === 'rain');
    // núcleo del tornado: bandas de viento que giran
    const grow = C.grow || 0;
    if (grow > 0) for (let i = 0; i < 22; i++) {
      const h = i / 22, F = funnel(C, h, t), rr = F.r * grow, ph = t * (9 - h * 4) + i * .7;
      g.strokeStyle = `rgba(225,232,245,${(.12 + .2 * (1 - h)) * grow})`; g.lineWidth = 3 + h * 6;
      g.beginPath(); g.ellipse(F.cx, F.y, rr, 6 + rr * .14, 0, ph % TAU, ph % TAU + 2.6); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${.25 * grow})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(F.cx, F.y, rr * .92, 5 + rr * .12, 0, (ph + 3) % TAU, (ph + 3) % TAU + 1.2); g.stroke();
    }
    drawParts(g, p => !((p.z !== undefined && p.z < 0) || p.kind === 'rain'));
    drawBolts(g, C);
    // ojo del huracán: luz en lo alto del embudo
    if (grow > 0) { g.globalCompositeOperation = 'lighter'; const F = funnel(C, 1, t); glowAt(g, [170, 210, 255], F.cx, F.y + 40, 160, .35 * grow); g.globalCompositeOperation = 'source-over'; }
    g.restore();
  }
  function drawStarfall(g, C, H, t, k, VW, world, c) {
    // noche con aurora
    const night = clamp(t / .5, 0, 1) * k;
    const sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, `rgba(6,8,28,${.85 * night})`); sky.addColorStop(1, `rgba(20,14,50,${.55 * night})`); g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) { g.beginPath(); for (let x = 0; x <= VW; x += 30) g.lineTo(x, 120 + b * 40 + Math.sin(x * .006 + t * 1.3 + b) * 40); for (let x = VW; x >= 0; x -= 30) g.lineTo(x, 200 + b * 40 + Math.sin(x * .006 + t * 1.3 + b + .6) * 50); g.closePath(); g.fillStyle = `rgba(${80 + b * 40},255,${170 + b * 30},${.07 * night})`; g.fill(); }
    for (let i = 0; i < 110; i++) { g.fillStyle = `rgba(255,255,255,${(.3 + .7 * Math.abs(Math.sin(t * 2 + i * 1.7))) * night})`; g.fillRect(hash1(i) * VW, hash1(i * 5) * VH * .75, i % 9 ? 1.5 : 2.6, i % 9 ? 1.5 : 2.6); }
    g.restore();
    g.save(); world();
    // rayo de luz del arco al orbe
    if (C.orb > 0 && t < 1.7) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(210,255,200,${.5 * Math.min(1, C.orb)})`; g.lineWidth = 3 + C.orb * 4; g.beginPath(); g.moveTo(H.x + H.face * 16, H.y - 46); g.lineTo(C.gx, C.gy); g.stroke(); g.globalCompositeOperation = 'source-over'; }
    drawParts(g, p => p.kind === 'mote');
    // orbe de luz acumulada
    if (C.orb > 0) {
      const r = 14 + C.orb * 46, gx = C.gx, gy = C.gy;
      g.globalCompositeOperation = 'lighter';
      glowAt(g, [200, 255, 210], gx, gy, r * 4, .8);
      const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(220,255,220,.9)'); gr.addColorStop(1, 'rgba(160,255,190,0)'); g.fillStyle = gr; g.beginPath(); g.arc(gx, gy, r, 0, TAU); g.fill();
      for (let i = 0; i < 3; i++) { const q = (t * 1.6 + i / 3) % 1; g.strokeStyle = `rgba(220,255,220,${(1 - q) * .7})`; g.lineWidth = 2; g.beginPath(); g.arc(gx, gy, r * (1 + q * 2.5), 0, TAU); g.stroke(); }
      // destellos anamórficos
      g.fillStyle = 'rgba(220,255,230,.55)'; g.fillRect(gx - r * 8, gy - 1.5, r * 16, 3); g.fillRect(gx - 1.5, gy - r * 4, 3, r * 8);
      // círculo de runas
      g.save(); g.translate(gx, gy); g.rotate(t * 1.5); g.strokeStyle = 'rgba(200,255,200,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 1.8, 0, TAU); g.stroke(); g.fillStyle = 'rgba(220,255,220,.8)'; g.font = '700 14px Georgia'; g.textAlign = 'center'; for (let i = 0; i < 10; i++) { const a = i * TAU / 10; g.fillText('ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾ'[i], Math.cos(a) * r * 1.8, Math.sin(a) * r * 1.8 + 5); } g.restore();
      g.globalCompositeOperation = 'source-over';
    }
    // constelaciones
    if (C.stars) {
      g.globalCompositeOperation = 'lighter';
      const vis = C.stars.filter(s => t >= s.t0);
      g.strokeStyle = 'rgba(200,255,200,.65)'; g.lineWidth = 2; g.beginPath(); vis.forEach((s, i) => { if (i) g.lineTo(s.x, s.y); else g.moveTo(s.x, s.y); }); g.stroke();
      for (const s of vis) { glowAt(g, [210, 255, 210], s.x, s.y, 40, .9); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 12, a = i * Math.PI / 5 - Math.PI / 2 + t; g.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r); } g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }
    drawParts(g, p => p.kind !== 'mote');
    // columnas de luz finales
    if (C.pillars) { g.globalCompositeOperation = 'lighter'; for (const p of C.pillars) { const a = Math.max(0, 1 - p.t / .8), w = 40 + p.t * 60; const gr = g.createLinearGradient(p.x - w, 0, p.x + w, 0); gr.addColorStop(0, 'rgba(200,255,200,0)'); gr.addColorStop(.5, `rgba(240,255,235,${a})`); gr.addColorStop(1, 'rgba(200,255,200,0)'); g.fillStyle = gr; g.fillRect(p.x - w, c.y - 100, w * 2, VH + 200); } g.globalCompositeOperation = 'source-over'; }
    g.restore();
  }
  function drawEclipse(g, C, H, t, k, VW, world, c) {
    const e = C.ecl || 0;
    g.fillStyle = `rgba(16,8,30,${.6 * k * e})`; g.fillRect(0, 0, VW, VH);
    // sol, luna y corona
    const mx = VW / 2, my = 160;
    g.save(); g.globalCompositeOperation = 'lighter';
    glowAt(g, [255, 240, 210], mx, my, 200 + (C.boom ? 500 : 0) * k, .9 * k);
    if (e > .9) { g.translate(mx, my); g.rotate(t * .3); for (let i = 0; i < 24; i++) { const a = i * TAU / 24, L = 120 + Math.sin(t * 4 + i * 2) * 40 + (C.boom ? 300 : 0); const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); gr.addColorStop(.4, 'rgba(255,240,220,.7)'); gr.addColorStop(1, 'rgba(200,170,255,0)'); g.strokeStyle = gr; g.lineWidth = 4 + (i % 3) * 3; g.beginPath(); g.moveTo(Math.cos(a) * 60, Math.sin(a) * 60); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke(); } }
    g.restore();
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(mx, my, 62, 0, TAU); g.fill();
    g.fillStyle = '#0c0814'; g.beginPath(); g.arc(mx + (1 - e) * 150, my, 63, 0, TAU); g.fill();
    if (e > .9) { g.strokeStyle = 'rgba(255,245,225,.95)'; g.lineWidth = 3; g.beginPath(); g.arc(mx, my, 64, 0, TAU); g.stroke(); }
    g.save(); world();
    // tajos gigantes: la pantalla se parte por la línea del corte
    g.globalCompositeOperation = 'lighter';
    for (const s of C.cuts || []) {
      const a = Math.max(0, 1 - s.t / .6); if (a <= 0) continue;
      g.save(); g.translate(s.x, s.y); g.rotate(s.a);
      const gr = g.createLinearGradient(-500, 0, 500, 0); gr.addColorStop(0, 'rgba(150,110,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(150,110,255,0)');
      g.fillStyle = gr; g.fillRect(-600, -3 - 10 * a, 1200, 6 + 20 * a);
      g.globalAlpha = a; const g2 = g.createLinearGradient(-220, 0, 220, 0); g2.addColorStop(0, 'rgba(150,110,255,0)'); g2.addColorStop(.6, 'rgba(225,205,255,.95)'); g2.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = g2; g.beginPath(); g.arc(0, 60, 230, -2.3, -.84); g.arc(0, 110, 240, -.9, -2.24, true); g.fill();
      g.restore();
    }
    g.globalCompositeOperation = 'source-over';
    drawParts(g);
    g.restore();
    // fotograma invertido en cada tajo
    if (C.inv > 0) { g.globalCompositeOperation = 'difference'; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
  }
  function drawSun(g, C, H, t, k, VW, world, c) {
    g.fillStyle = `rgba(60,24,0,${.35 * k})`; g.fillRect(0, 0, VW, VH);
    g.save(); world();
    const cx = H.x, cy = H.y - 70, core = C.core || 0;
    g.globalCompositeOperation = 'lighter';
    // mandala de geometría solar
    if (t < 2.5) {
      const s = Math.min(1, t * 1.4);
      for (let ring = 0; ring < 4; ring++) {
        g.save(); g.translate(cx, cy); g.rotate((ring % 2 ? -1 : 1) * t * (0.6 + ring * .3));
        const R0 = (60 + ring * 60) * s, n = 6 + ring * 3;
        g.strokeStyle = `rgba(255,${200 - ring * 20},${110 - ring * 20},${.55 * k})`; g.lineWidth = 2;
        g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.stroke();
        g.beginPath(); for (let i = 0; i <= n; i++) { const a = i * TAU / n; g.lineTo(Math.cos(a) * R0, Math.sin(a) * R0); g.lineTo(Math.cos(a + Math.PI / n) * R0 * 1.18, Math.sin(a + Math.PI / n) * R0 * 1.18); } g.stroke();
        for (let i = 0; i < n; i++) { const a = i * TAU / n; g.beginPath(); g.arc(Math.cos(a) * R0, Math.sin(a) * R0, 4 + ring, 0, TAU); g.fillStyle = 'rgba(255,230,160,.8)'; g.fill(); }
        g.restore();
      }
    }
    // núcleo solar
    const r = 20 + Math.min(1, core) * 50 + Math.max(0, core - 1) * 400;
    glowAt(g, [255, 200, 90], cx, cy, r * 3, Math.min(1, .8 * k * (core > 1 ? Math.max(0, 2.2 - core) : 1)));
    // rayos de sol
    g.save(); g.translate(cx, cy); g.rotate(t * .5);
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18, L = r * (2 + Math.sin(t * 6 + i) * .4); g.fillStyle = `rgba(255,220,140,${.25 * k})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - .05) * L, Math.sin(a - .05) * L); g.lineTo(Math.cos(a + .05) * L, Math.sin(a + .05) * L); g.fill(); }
    g.restore();
    drawParts(g);
    // discos
    if (C.discs) for (const d of C.discs) { g.save(); g.translate(d.x, d.y); g.rotate(t * 26); glowAt(g, [255, 190, 80], 0, 0, 40, .7); g.restore(); if (d.px !== undefined) { g.strokeStyle = 'rgba(255,200,100,.6)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(d.px, d.py); g.lineTo(d.x, d.y); g.stroke(); } }
    g.globalCompositeOperation = 'source-over';
    if (C.discs) for (const d of C.discs) { g.save(); g.translate(d.x, d.y); g.rotate(t * 26); g.scale(1.7, 1.7); g.fillStyle = '#e8a030'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); g.lineTo(Math.cos(a + .39) * 8, Math.sin(a + .39) * 8); } g.closePath(); g.fill(); g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.restore(); }
    g.restore();
  }
  Game.prototype.ultFizzle = function () {
    const H = this.hero; this.ultWeak = true;
    try { this.startUltCinematic(H.weapon, .4); } finally { this.ultWeak = false; }
    H.ultCd = 3; Sound.play('fizzle'); H.backlash = true;
  };
  // contragolpe: al terminar la versión débil, la Palabra de Poder fallida te explota en las manos
  const upB = Game.prototype.update;
  Game.prototype.update = function (dt) {
    upB.call(this, dt);
    const H = this.hero;
    if (H && H.backlash && !this.cinematic && this.mode === 'play' && !UI.modalOpen()) {
      H.backlash = false; const dmg = Math.round(H.maxHp * .1);
      H.hp = Math.max(1, H.hp - dmg); H.exposed = 2.5; H.vx = -H.face * 260; H.vy = -320; H.hurtFlash = .2;
      FX.text(H.x, H.y - 110, 'BACKLASH! -' + dmg, '#ff8a8a', 40); FX.sparks(H.x, H.y - 40, [255, 90, 90], 24, 0, 420); FX.ring(H.x, H.y - 40, [255, 80, 80], 120, .4);
      Sound.play('hurt'); this.shake(10, .35); this.flashScreen([255, 60, 60], .45); Input.rumble(.8, .5, 250);
      UI.toast('Backlash! You are EXPOSED for 2.5 s', 'Contragolpe: la Palabra de Poder fallida te ha herido y estás EXPUESTO 2,5 s (sin bloqueo, +60 % de daño). ¡Acierta la próxima!', true);
    }
  };
  return { get parts() { return P; } };
})();
