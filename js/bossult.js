"use strict";
/* =====================================================================
   ATAQUE IMPARABLE DE LOS JEFES
   Cada cierto tiempo el jefe carga un rayo gigante que no se puede esquivar ni
   bloquear. Justo antes de que te alcance, el tiempo se congela y aparece una
   pregunta de inglés:
   · si aciertas, Lio salta dentro del rayo y lo parte a tajos; cada trozo se
     desintegra, el rayo se recoge hacia el jefe y le estalla en la cara
   · si fallas, el rayo te alcanza de lleno: te quita el 40 % de la vida máxima
     (nunca te mata: te deja como mínimo con 1)

   El rayo es energía viva, no una imagen: nace de la boca o el arma del jefe con
   un fogonazo, su grosor late y fluye, lleva hebras en espiral y pulsos que viajan
   hacia ti, suelta jirones de plasma por los bordes, ilumina el entorno y va
   quemando y levantando el suelo por donde pasa.
   ===================================================================== */
const BossUlt = (() => {
  const COL = { CrabKing: [255, 120, 80], ChronoGuardian: [255, 220, 120], MagmaTitan: [255, 120, 40], StormWyvern: [140, 195, 255], ClockworkColossus: [255, 200, 120], CrimsonKnight: [255, 60, 90] };
  const HOT = { CrabKing: [255, 230, 200], ChronoGuardian: [255, 250, 220], MagmaTitan: [255, 230, 150], StormWyvern: [225, 240, 255], ClockworkColossus: [255, 245, 210], CrimsonKnight: [255, 210, 220] };
  const NAME = { CrabKing: 'TIDAL CANNON', ChronoGuardian: 'END OF TIME', MagmaTitan: 'MAGMA RAY', StormWyvern: 'SKY JUDGEMENT', ClockworkColossus: 'GEAR CANNON', CrimsonKnight: 'CRIMSON VERDICT' };
  const W0 = 64; // medio grosor del rayo
  let P = [];
  const add = o => { if (P.length < 1100) P.push(Object.assign({ t: 0, life: 1, vx: 0, vy: 0, g: 0 }, o)); };
  const col = b => COL[b.constructor.name] || [200, 160, 255];
  const hot = b => HOT[b.constructor.name] || [240, 230, 255];
  const now = () => performance.now() / 1000;

  /* ---------- geometría del rayo ---------- */
  // punto a la distancia s del origen, desplazado w en perpendicular
  const at = (D, s, w = 0) => [D.M[0] + D.ux * s - D.uy * w, D.M[1] + D.uy * s + D.ux * w];
  // medio grosor del rayo en s (late, fluye hacia delante y se estrecha en la boca)
  function halfW(D, s, t, k = 1) {
    const flow = Math.sin(s * .024 - t * 26) * .16 + Math.sin(s * .057 + t * 39) * .08 + Math.sin(s * .011 - t * 9) * .1;
    const mouth = Math.min(1, .45 + s / 160);
    return W0 * k * mouth * (1 + flow) * (D.pulse || 1);
  }

  /* ---------- carga (el mundo sigue: puedes moverte, pero no hay escapatoria) ---------- */
  function canStart(b) {
    const G = b.game;
    return G.boss === b && !b.dead && b.hp > 0 && !b.shift && !G.qActive && !G.cinematic && !G.hero.dead && !UI.modalOpen()
      && !['intro', 'dying', 'sealing', 'frozen', 'dead'].includes(b.st) && (b.t || 0) > 9;
  }
  function muzzle(b, B) {
    // la boca / el arma: el lado del jefe que mira a Lio, un poco por encima del centro
    const H = b.game.hero, f = Math.sign(H.x - B.cx) || 1;
    return [B.cx + f * B.r * .5, B.cy - B.r * .12];
  }
  function startCharge(b) {
    const G = b.game, B = bossBounds(b), c = col(b);
    b.doom = { stage: 'charge', t: 0, B, c, hc: hot(b), name: NAME[b.constructor.name] || 'DOOM BEAM', M: muzzle(b, B), scorch: [] };
    G.banner('UNSTOPPABLE ATTACK!', '¡Ataque imparable! No se puede esquivar: responde en inglés para sobrevivir', rgba(c), true);
    Sound.play('ultCharge'); Sound.play('roar', .8); G.shake(3, 2.4); Input.rumble(.3, .6, 2000);
  }
  function updateCharge(b, dt) {
    const D = b.doom, G = b.game, H = G.hero; D.t += dt;
    D.B = bossBounds(b); D.M = muzzle(b, D.B);
    const [mx, my] = D.M, k = Math.min(1, D.t / 2.4);
    b.flash = Math.sin(D.t * (20 + 30 * k)) > .7 ? .03 : -1;
    // la energía de toda la arena se concentra en la boca del jefe
    for (let i = 0; i < 4 + k * 8; i++) { const a = R(0, TAU), d = R(260, 760); add({ kind: 'mote', x: mx + Math.cos(a) * d, y: my + Math.sin(a) * d * .7, life: 1, c: chance(.3) ? D.hc : D.c, w: R(1.5, 3.5), fn: (p, dt) => { const dx = D.M[0] - p.x, dy = D.M[1] - p.y, dd = Math.hypot(dx, dy) || 1, sp = 300 + 1500 * p.t; p.px = p.x; p.py = p.y; p.x += dx / dd * Math.min(dd, sp * dt) - dy / dd * 120 * dt; p.y += dy / dd * Math.min(dd, sp * dt) + dx / dd * 120 * dt; if (dd < 14) p.t = 99; } }); }
    // piedras del suelo que se levantan hacia el jefe
    if (chance(dt * 10 * k)) { const x = mx + R(-500, 500), gy = G.world.groundY(x); if (isFinite(gy)) add({ kind: 'rock', x, y: gy - 4, s: R(3, 7), rot: R(0, TAU), spin: R(-6, 6), life: 2.2, c: [90, 80, 75], fn: (p, dt) => { p.vy = Math.max(-140, (p.vy || 0) - 300 * dt); p.y += p.vy * dt; p.x += (D.M[0] - p.x) * dt * .4; p.rot += p.spin * dt; } }); }
    if (chance(dt * (4 + 10 * k))) G.lightning(mx + R(-90, 90) * (1 - k * .5), my + R(-90, 90) * (1 - k * .5), mx, my);
    // la puntería sigue a Lio en los últimos instantes
    D.aim = [H.x, H.y - 50];
    if (D.t > 2.4) fire(b);
  }

  /* ---------- disparo: el tiempo se congela y llega la pregunta ---------- */
  function fire(b) {
    const G = b.game, H = G.hero, D = b.doom;
    D.stage = 'fire'; D.t = 0; D.hx = H.x; D.hy = H.y;
    const dx = H.x - D.M[0], dy = (H.y - 50) - D.M[1], dist = Math.hypot(dx, dy) || 1;
    D.ux = dx / dist; D.uy = dy / dist; D.ang = Math.atan2(dy, dx);
    D.len = dist + 1100; D.front = 0; D.stop = Math.max(70, dist - 140);
    D.pieces = [{ a: 0, b: D.len, att: 1 }];
    D.flare = 1;
    G.cinematic = { kind: 'doom', t: 0, dur: 99, worldTs: 0, boss: b, hits: [], targets: [] };
    Sound.play('ultFire'); Sound.play('thunder'); Sound.play('explode'); G.shake(16, .5); G.flashScreen(D.c, .6); Input.rumble(1, .8, 400);
    // anillo de choque del fogonazo
    add({ kind: 'ring', x: D.M[0], y: D.M[1], life: .5, r0: 20, r1: 260, c: D.hc, flat: .55 });
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
    D.t += dt; D.flare = Math.max(0, (D.flare || 0) - dt * 2.2);
    const prev = D.front;
    if (D.stage === 'fire') {
      D.front = Math.min(D.stop, D.front + dt * 2400);
      D.pulse = 1 + Math.max(0, .35 - D.t) * 1.2;
      if (D.front >= D.stop && !D.asked && D.t > .5) ask(b);
      beamFx(this, D, dt, prev);
    } else if (D.stage === 'cut') {
      // Lio salta dentro del rayo y lo parte a tajos, avanzando hacia el jefe
      const n = 7, step = .15;
      if (D.t > .18 && D.cuts.length < n && D.t > .18 + D.cuts.length * step) {
        const i = D.cuts.length, s = D.stop * (1 - (i + 1) / (n + 1));
        D.cuts.push({ s, t: 0, a: (i % 2 ? 1 : -1) * R(.5, 1) });
        cutAt(D, s); Sound.play('swing', true); Sound.play('crit'); this.shake(9, .12); Input.rumble(.6, .5, 90);
        this.cam.pz = .05;
        const [cx, cy] = at(D, s);
        FX.afterimage(H.snapshot()); H.x = cx; H.y = cy + 50; H.face = D.ux > 0 ? -1 : 1;
        for (let k = 0; k < 34; k++) { const a = R(0, TAU), v = R(200, 800); add({ kind: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 500, life: R(.3, .7), c: chance(.5) ? D.hc : D.c }); }
      }
      this.cam.pz = Math.max(0, (this.cam.pz || 0) - dt * .3);
      for (const c of D.cuts) c.t += dt;
      // tras el último tajo, el rayo se recoge hacia la boca y le estalla al jefe
      const tEnd = .18 + n * step + .2;
      if (D.t > tEnd) { D.front = Math.max(0, D.front - dt * 2600); for (const p of D.pieces) if (p.att) p.b = Math.min(p.b, D.front); }
      if (D.t > tEnd && D.front <= 0 && !D.boom) {
        D.boom = 1; this.cam.pz = 0;
        this.flashScreen([255, 255, 255], .9); this.shake(20, .6); Sound.play('explode'); Sound.play('ultFire'); Input.rumble(1, 1, 500);
        FX.text(D.B.cx, D.B.cy - D.B.r - 30, 'BEAM BREAKER!', '#ffffff', 72);
        b.hurt(b.maxHp * .08, Math.sign(b.x - D.hx) || 1, { x: D.B.cx, y: D.B.cy, heavy: true });
        b.breakT = 3.5; b.stun = 2.5; FX.text(D.B.cx, D.B.cy - D.B.r + 20, 'STUNNED!', '#ffe060', 40);
        const [mx, my] = D.M;
        add({ kind: 'ring', x: mx, y: my, life: .6, r0: 30, r1: 420, c: D.hc, flat: .6 });
        add({ kind: 'ring', x: mx, y: my, life: .9, r0: 10, r1: 300, c: D.c, flat: .6 });
        for (let k = 0; k < 90; k++) { const a = R(0, TAU), v = R(150, 900); add({ kind: chance(.7) ? 'spark' : 'ember', x: mx, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, g: 600, life: R(.5, 1.1), c: chance(.5) ? D.hc : D.c }); }
      }
      if (D.boom && D.t > tEnd + 1.3) end(this, b);
      if (D.t > tEnd + 3) end(this, b);
    } else if (D.stage === 'hit') {
      // el rayo te alcanza de lleno y sigue de largo
      D.front = Math.min(D.len, D.front + dt * 2800); D.pulse = 1.15 + Math.sin(D.t * 40) * .05;
      beamFx(this, D, dt, prev);
      if (D.t > .22 && !D.hitDone) {
        D.hitDone = 1; const dmg = Math.round(H.maxHp * .4); H.hp = Math.max(1, H.hp - dmg); H.hurtFlash = .3; H.lastHurt = this.t;
        FX.text(H.x, H.y - 120, '-' + dmg, '#ff6a6a', 60); this.flashScreen(D.c, 1); this.shake(28, .9); Sound.play('hurt'); Sound.play('explode'); Input.rumble(1, 1, 700);
        add({ kind: 'ring', x: H.x, y: H.y - 40, life: .7, r0: 20, r1: 340, c: D.hc, flat: .5 });
        for (let k = 0; k < 40; k++) add({ kind: 'rock', x: H.x + R(-60, 60), y: H.y - 4, vx: R(-500, 500) + D.ux * 300, vy: -R(250, 700), g: 1500, s: R(3, 8), rot: R(0, TAU), spin: R(-12, 12), life: 1.4, c: [70, 60, 55] });
      }
      if (D.t > 1.6) { end(this, b); H.vx = D.ux * 600; H.vy = -400; }
    }
    updParts(dt);
  };
  function end(G, b) {
    G.cinematic = null; G.hero.inv = 1.2; G.hero.vy = 0; G.cam.pz = 0;
    if (b.doom && b.doom.stage === 'cut') { G.hero.x = b.doom.hx; G.hero.y = b.doom.hy; }
    if (b.doom) BossUlt.lastEnd = performance.now();
    b.doom = null; b.doomCd = [0, 30, 24, 19][Math.min(3, b.phase || 1)];
  }
  function cutAt(D, s) {
    // parte la pieza unida al jefe: lo que queda por delante del corte se desintegra
    for (const p of D.pieces) if (p.att && s > p.a && s < p.b) {
      const loose = { a: s + 6, b: Math.min(p.b, D.front), att: 0, t: 0, dir: chance(.5) ? -1 : 1 };
      p.b = s - 6; D.pieces.push(loose);
      // la pieza suelta se deshace en brasas de energía
      for (let x = loose.a; x < loose.b; x += 14) for (let k = 0; k < 2; k++) {
        const w = R(-1, 1) * W0 * .8, [px, py] = at(D, x, w);
        add({ kind: chance(.55) ? 'ember' : 'spark', x: px, y: py, vx: -D.uy * loose.dir * R(80, 320) + D.ux * R(-80, 80), vy: D.ux * loose.dir * R(80, 320) + R(-60, 0), g: R(-80, 120), life: R(.4, 1), c: chance(.5) ? D.hc : D.c, drag: 1.5 });
      }
      break;
    }
    D.front = s;
  }
  // efectos mientras el rayo avanza: jirones de plasma, el suelo se quema y salta en pedazos
  function beamFx(G, D, dt, prev) {
    for (let k = 0; k < 6; k++) {
      const s = R(0, D.front), side = chance(.5) ? -1 : 1, w = halfW(D, s, G.rt) * side, [x, y] = at(D, s, w);
      add({ kind: 'wisp', x, y, vx: -D.uy * side * R(60, 200) - D.ux * R(40, 160), vy: D.ux * side * R(60, 200) - D.uy * R(40, 160), life: R(.25, .5), c: D.c, s: R(6, 14), drag: 2 });
    }
    for (let s = prev; s < D.front; s += 26) {
      const [x, y] = at(D, s), gy = G.world.groundY(x);
      if (!isFinite(gy) || Math.abs(y - gy) > W0 * 1.15) continue;
      D.scorch.push({ x, y: gy, t: 0 }); FX.decal(x, gy, 'scorch', 26);
      if (chance(.6)) for (let k = 0; k < 3; k++) add({ kind: 'rock', x: x + R(-10, 10), y: gy - 4, vx: R(-120, 120) + D.ux * 200, vy: -R(200, 520), g: 1400, s: R(2.5, 6), rot: R(0, TAU), spin: R(-12, 12), life: 1.2, c: [80, 70, 64], hot: 1 });
      if (chance(.5)) add({ kind: 'smoke', x, y: gy - 6, vx: R(-30, 30), vy: -R(40, 110), life: R(.8, 1.4), s: R(14, 30), drag: .6 });
    }
  }
  function updParts(dt) {
    for (const p of P) { p.t += dt; if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; } if (p.fn) p.fn(p, dt); else { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.spin) p.rot += p.spin * dt; } }
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

  /* ================= DIBUJO ================= */
  // contorno de un tramo [a,b] del rayo con grosor variable (en coordenadas de mundo)
  function band(g, D, a, b, t, k, step = 12) {
    g.beginPath();
    for (let s = a; s <= b; s += step) { const [x, y] = at(D, s, -halfW(D, s, t, k)); g.lineTo(x, y); }
    const [ex, ey] = at(D, b, -halfW(D, b, t, k)); g.lineTo(ex, ey);
    for (let s = b; s >= a; s -= step) { const [x, y] = at(D, s, halfW(D, s, t, k)); g.lineTo(x, y); }
    g.closePath();
  }
  function drawBeam(g, D, t) {
    const c = D.c, hc = D.hc;
    g.save(); g.globalCompositeOperation = 'lighter';
    // luz que el rayo proyecta sobre el escenario
    for (let s = 0; s < D.front; s += 90) { const [x, y] = at(D, s); glowAt(g, c, x, y, 230, .22); }
    for (const p of D.pieces) {
      if (!p.att) continue;
      const a = p.a, b = Math.min(p.b, D.front); if (b - a < 4) continue;
      // capas: halo, cuerpo, interior caliente y núcleo blanco que parpadea
      g.fillStyle = rgba(c, .16); band(g, D, a, b, t, 1.75); g.fill();
      g.fillStyle = rgba(c, .5); band(g, D, a, b, t, 1.05); g.fill();
      g.fillStyle = rgba(hc, .55); band(g, D, a, b, t, .62); g.fill();
      g.fillStyle = `rgba(255,255,255,${.75 + Math.sin(t * 60) * .15})`; band(g, D, a, b, t, .26 + Math.sin(t * 47) * .03, 18); g.fill();
      // hebras en espiral que giran alrededor del núcleo (la delantera más brillante)
      for (let h = 0; h < 2; h++) {
        g.lineWidth = 2.6; g.lineCap = 'round';
        let last = null;
        for (let s = a; s <= b; s += 10) {
          const ph = s * .045 - t * 32 + h * Math.PI, w = Math.sin(ph) * halfW(D, s, t, .78), front = Math.cos(ph) > 0;
          const pt = at(D, s, w);
          if (last) { g.strokeStyle = front ? 'rgba(255,255,255,.85)' : rgba(hc, .3); g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(pt[0], pt[1]); g.stroke(); }
          last = pt;
        }
      }
      // pulsos de energía que viajan del jefe hacia delante
      for (let k = 0; k < 6; k++) {
        const s = a + ((t * 1700 + k * 260) % Math.max(1, b - a)); const [x, y] = at(D, s);
        g.save(); g.translate(x, y); g.rotate(D.ang); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(0, 0, 46, halfW(D, s, t, .9), 0, 0, TAU); g.fill(); g.restore();
      }
      // ondas de calor por fuera del rayo
      g.lineWidth = 1.4;
      for (const side of [-1, 1]) for (let r = 0; r < 2; r++) {
        g.strokeStyle = rgba(hc, .16); g.beginPath();
        for (let s = a; s <= b; s += 16) { const w = side * (halfW(D, s, t, 1.25 + r * .3) + Math.sin(s * .05 - t * 18 + r) * 6), [x, y] = at(D, s, w); g.lineTo(x, y); }
        g.stroke();
      }
      // borde del corte (chisporrotea)
      if (p.b < D.front - 2 || (D.stage === 'cut' && !D.boom)) { const [x, y] = at(D, b); glowAt(g, hc, x, y, 70, .9); glowAt(g, [255, 255, 255], x, y, 28, 1); }
    }
    // piezas cortadas: se encogen y se deshacen
    for (const p of D.pieces) {
      if (p.att) continue;
      p.t = (p.t || 0) + .016; const k = Math.max(0, 1 - p.t / .4); if (k <= 0) continue;
      g.globalAlpha = k; g.fillStyle = rgba(hc, .7); band(g, D, p.a, p.b, t, .9 * k); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; band(g, D, p.a, p.b, t, .3 * k, 18); g.fill(); g.globalAlpha = 1;
    }
    // fogonazo en la boca del jefe
    const [mx, my] = D.M, fl = D.flare || 0, beamOn = D.front > 1;
    if (beamOn || fl > 0) {
      glowAt(g, c, mx, my, 150 + fl * 260, .9); glowAt(g, [255, 255, 255], mx, my, 50 + fl * 90, 1);
      g.save(); g.translate(mx, my); g.rotate(t * 2);
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10, L = (90 + Math.sin(t * 30 + i * 3) * 30) * (1 + fl * 2); g.fillStyle = rgba(hc, .5); g.beginPath(); g.moveTo(Math.cos(a - .08) * 18, Math.sin(a - .08) * 18); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + .08) * 18, Math.sin(a + .08) * 18); g.fill(); }
      g.restore();
    }
    // cabeza del rayo: una bola que se agita contra su objetivo
    if (beamOn && !(D.stage === 'cut')) {
      const [fx, fy] = at(D, D.front), r = W0 * (1.2 + Math.sin(t * 25) * .1);
      glowAt(g, c, fx, fy, r * 3.2, .95); glowAt(g, hc, fx, fy, r * 1.6, .95); glowAt(g, [255, 255, 255], fx, fy, r * .8, 1);
      for (let i = 0; i < 3; i++) { const q = (t * 2.5 + i / 3) % 1; g.strokeStyle = rgba(hc, (1 - q) * .7); g.lineWidth = 3; g.beginPath(); g.ellipse(fx, fy, r * (1 + q * 1.8), r * (1 + q * 1.8) * .8, D.ang, 0, TAU); g.stroke(); }
    }
    g.restore();
  }
  function drawScorch(g, D, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of D.scorch) { const k = Math.max(0, 1 - (t - (s.t0 ??= t)) / 3); if (k > 0) { g.fillStyle = rgba(D.c, .35 * k); g.beginPath(); g.ellipse(s.x, s.y, 26, 5, 0, 0, TAU); g.fill(); } }
    g.restore();
  }
  function drawParts(g) {
    for (const p of P) {
      const a = Math.max(0, 1 - p.t / p.life);
      if (p.kind === 'rock') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot || 0); g.fillStyle = rgba(p.c);
        g.beginPath(); g.moveTo(-p.s, -p.s * .6); g.lineTo(p.s * .8, -p.s); g.lineTo(p.s, p.s * .5); g.lineTo(-p.s * .4, p.s); g.closePath(); g.fill();
        if (p.hot) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,150,60,${a * .8})`; g.fill(); }
        g.restore();
      } else if (p.kind === 'smoke') {
        const r = p.s * (1 + p.t), gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, `rgba(40,34,40,${.45 * a})`); gr.addColorStop(1, 'rgba(40,34,40,0)'); g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of P) {
      const a = Math.max(0, 1 - p.t / p.life);
      if (p.kind === 'mote' && p.px !== undefined) { g.strokeStyle = rgba(p.c, .9); g.lineWidth = p.w || 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke(); }
      else if (p.kind === 'spark') { g.fillStyle = rgba(p.c || [255, 255, 255], a); g.beginPath(); g.arc(p.x, p.y, 2.6, 0, TAU); g.fill(); }
      else if (p.kind === 'ember') { glowAt(g, p.c || [255, 200, 120], p.x, p.y, 10 * a + 3, a); }
      else if (p.kind === 'wisp') { glowAt(g, p.c, p.x, p.y, p.s * (1 + p.t * 3), .5 * a); }
      else if (p.kind === 'ring') { const q = p.t / p.life, r = lerp(p.r0, p.r1, 1 - Math.pow(1 - q, 2)); g.strokeStyle = rgba(p.c, (1 - q) * .9); g.lineWidth = 10 * (1 - q) + 1; g.beginPath(); g.ellipse(p.x, p.y, r, r * (p.flat || 1), 0, 0, TAU); g.stroke(); }
    }
    g.restore();
  }
  function worldT(g, G) { const c = G.cam, zm = c.zoom * (1 + (c.pz || 0)); g.translate(G.VW / 2, VH / 2); g.scale(zm, zm); g.translate(-G.VW / 2, -VH / 2); g.translate(-(c.x + c.sx + (c.kx || 0)), -(c.y + c.sy + (c.ky || 0))); }
  let lastDraw = 0;
  const dco0 = Game.prototype.drawCinematicOverlay;
  Game.prototype.drawCinematicOverlay = function (g) {
    const C = this.cinematic; if (!C || C.kind !== 'doom') return dco0.call(this, g);
    const b = C.boss, D = b.doom, VW = this.VW; if (!D) return;
    // reloj propio: el rayo sigue rugiendo (más lento) mientras respondes la pregunta
    const n = now(), rdt = lastDraw ? Math.min(.05, n - lastDraw) : 0; lastDraw = n;
    if (UI.modalOpen()) { updParts(rdt * .35); D.qt = (D.qt || 0) + rdt * .35; }
    const t = this.rt + (D.qt || 0);
    g.fillStyle = `rgba(10,6,20,${D.stage === 'cut' && D.boom ? .1 : .5})`; g.fillRect(0, 0, VW, VH);
    g.save(); worldT(g, this);
    drawScorch(g, D, t);
    drawParts(g);
    drawBeam(g, D, t);
    // tajos de Lio sobre el rayo
    if (D.cuts) {
      g.globalCompositeOperation = 'lighter';
      for (const cu of D.cuts) {
        const a = Math.max(0, 1 - cu.t / .5); if (!a) continue;
        const [x, y] = at(D, cu.s); g.save(); g.translate(x, y); g.rotate(D.ang + Math.PI / 2 + cu.a * .45);
        const L = 230, gr = g.createLinearGradient(0, -L, 0, L); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, -L); g.quadraticCurveTo(10 + 22 * a, 0, 0, L); g.quadraticCurveTo(-4, 0, 0, -L); g.fill();
        glowAt(g, D.hc, 0, 0, 60 * a, a);
        g.restore();
      }
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
    // golpe recibido: la pantalla se quema
    if (D.stage === 'hit' && D.t > .2) { const k = Math.max(0, 1 - (D.t - .2) / 1.2); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(D.c, .8 * k); g.fillRect(0, 0, VW, VH); g.fillStyle = `rgba(255,255,255,${.6 * k})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, 60); g.fillRect(0, VH - 60, VW, 60);
  };
  // la carga se ve sin cinemática (encima de todo): energía, piedras, rayos y la línea de puntería
  const r0 = Game.prototype.render;
  Game.prototype.render = function () {
    r0.call(this);
    const b = this.boss; if (!b || !b.doom || b.doom.stage !== 'charge' || this.mode !== 'play') return;
    const g = this.ctx, D = b.doom, k = Math.min(1, D.t / 2.4), t = this.rt;
    g.setTransform(this.RS, 0, 0, this.RS, 0, 0);
    g.fillStyle = `rgba(10,6,20,${.45 * Math.min(1, D.t / .6)})`; g.fillRect(0, 0, this.VW, VH);
    g.save(); worldT(g, this);
    drawParts(g);
    g.globalCompositeOperation = 'lighter';
    const [mx, my] = D.M, r = 14 + k * 46;
    glowAt(g, D.c, mx, my, r * 5, .9); glowAt(g, D.hc, mx, my, r * 2, .95); glowAt(g, [255, 255, 255], mx, my, r, 1);
    // anillos que se cierran hacia la boca (la energía se concentra)
    for (let i = 0; i < 3; i++) { const q = (D.t * 1.4 + i / 3) % 1; g.strokeStyle = rgba(D.c, q * .8); g.lineWidth = 3; g.beginPath(); g.arc(mx, my, r * (6 - q * 5.4), 0, TAU); g.stroke(); }
    // corona de picos que gira
    g.save(); g.translate(mx, my); g.rotate(t * 3);
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, L = r * (1.6 + Math.sin(t * 20 + i * 2) * .4); g.fillStyle = rgba(D.hc, .5); g.beginPath(); g.moveTo(Math.cos(a - .1) * r * .5, Math.sin(a - .1) * r * .5); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + .1) * r * .5, Math.sin(a + .1) * r * .5); g.fill(); }
    g.restore();
    // línea de puntería que sigue a Lio y una mira sobre él
    if (D.t > .9 && D.aim) {
      const blink = Math.sin(t * (12 + 20 * k)) > 0 ? 1 : .45, [ax, ay] = D.aim;
      g.strokeStyle = rgba(D.c, .55 * blink * k); g.lineWidth = 2 + k * 3; g.setLineDash([18, 12]); g.lineDashOffset = -t * 300;
      g.beginPath(); g.moveTo(mx, my); g.lineTo(ax, ay); g.stroke(); g.setLineDash([]);
      g.save(); g.translate(ax, ay); g.rotate(-t * 2); g.strokeStyle = rgba(D.hc, .9 * blink); g.lineWidth = 3;
      const s = 34 - k * 10; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(s, s * .4); g.lineTo(s, s); g.lineTo(s * .4, s); g.stroke(); }
      g.restore();
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
  const ll0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { P = []; return ll0.call(this, ref); };
  return { startCharge, lastEnd: 0, get parts() { return P; } };
})();
