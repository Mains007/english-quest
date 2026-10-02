"use strict";
/* =====================================================================
   JUICE 3 — física del entorno.
   · charcos: salpican al pisarlos (más cuanto más rápido vas o desde más alto caes),
     las gotas que vuelven a caer dentro hacen ondas, y sales con las botas mojadas
     dejando huellas húmedas; en el mundo mecánico son charcos de aceite
   · huellas en la arena que se borran con el tiempo
   · el aire se mueve: al correr, esquivar o atacar empujas el polvo, las hojas caídas
     y las piedrecitas que hay en el suelo
   · la espada siega la hierba: saltan briznas y la hierba vuelve a crecer
   ===================================================================== */
const Juice3 = (() => {
  const S = { puddles: [], cut: [], printAcc: 0, printSide: 0 };
  const PUD = { forest: 'water', cliff: 'water', ruins: 'water', castle: 'water', cave: 'water', tidecave: 'water', mushroom: 'glow', clockwork: 'oil', beach: 'water' };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  /* ---------- generación de charcos: huecos de verdad excavados en el suelo ---------- */
  const DX = 3; // ancho de cada columna de la simulación de oleaje
  function genPuddles(G) {
    S.puddles = []; S.cut = [];
    const W = G.world, B = W.bounds, rnd = mulberry32(((G.ref && (G.ref.w * 100 + (G.ref.idx || 0))) || 7) * 7919 + 13);
    for (let x = B.x0 + 520; x < B.x1 - 300; x += 170 + rnd() * 320) {
      const kind = PUD[W.biomeAt(x).a]; if (!kind || rnd() > .7) continue;
      const w = Math.round(54 + rnd() * 76), gy = W.groundY(x);
      if (!isFinite(gy)) continue;
      let flat = true;
      for (let k = -1; k <= 7; k++) { const yy = W.groundY(x + w * k / 6); if (!isFinite(yy) || Math.abs(yy - gy) > 1.5) { flat = false; break; } }
      if (!flat || W.liquidAt(x + w / 2, gy - 4) || W.liquidAt(x + w / 2, gy + 30)) continue;
      const surf = W.surfaceAt(x + w / 2, gy + 2);
      if (!surf || surf.grains || surf.spores || surf === SURF.water) continue;
      if (S.puddles.some(p => Math.abs(p.x - x) < 200)) continue;
      const seg = W.seg(x + w / 2); if (!seg || W.seg(x - 8) !== seg || W.seg(x + w + 8) !== seg || seg.seabed) continue;
      // perfil del hueco: nunca un semicírculo perfecto (piedra irregular)
      const n = Math.ceil(w / DX) + 1, D = 9 + w * .1, prof = [], nz = [];
      for (let i = 0; i < n; i++) nz.push(rnd() * 2 - 1);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), sm = (nz[Math.max(0, i - 2)] + nz[Math.max(0, i - 1)] + nz[i] + nz[Math.min(n - 1, i + 1)] + nz[Math.min(n - 1, i + 2)]) / 5;
        const skew = 1 + (rnd() < .5 ? -1 : 1) * .25 * (u - .5);
        prof.push(Math.min(22, Math.max(0, D * Math.pow(Math.sin(Math.PI * u), .65) * skew * (1 + sm * .25)) + (i === 0 || i === n - 1 ? 0 : 1)));
      }
      const pebbles = []; for (let i = 0; i < Math.round(w / 14); i++) pebbles.push([rnd(), .5 + rnd() * .5, 1.5 + rnd() * 3, rnd()]);
      const p = { x, w, y: gy, lvl: gy + 3, kind, n, prof, D, h: new Float32Array(n), v: new Float32Array(n), pebbles, ph: rnd() * 9, surf };
      S.puddles.push(p); carve(W, p); dig(seg, p);
    }
    // dentro del agua no crece nada
    const inside = (x, y) => S.puddles.some(p => x > p.x - 2 && x < p.x + p.w + 2 && Math.abs(y - p.y) < 12);
    if (G.decor) for (const k of ['grass', 'flowers', 'mushrooms']) if (G.decor[k]) G.decor[k] = G.decor[k].filter(b => !inside(b.x, b.y));
  }
  // excava el hueco también en el suelo físico (mapa de alturas cada 8 px)
  function profAt(p, x) { const f = clamp((x - p.x) / DX, 0, p.n - 1), i = Math.floor(f), t = f - i; return i >= p.n - 1 ? p.prof[p.n - 1] : p.prof[i] + (p.prof[i + 1] - p.prof[i]) * t; }
  function dig(seg, p) {
    for (let i = 0; i < seg.pts.length; i++) { const X = seg.x0 + i * seg.step; if (X > p.x && X < p.x + p.w) seg.pts[i] = p.y + profAt(p, X); }
  }
  // excava el hueco en la imagen del terreno y oscurece la pared mojada
  function carve(W, p) {
    const top = W.chunkTop;
    const path = (g, ox, oy, grow) => {
      g.beginPath();
      g.moveTo(p.x - 10 - grow - ox, p.y - 46 - oy);
      g.lineTo(p.x + p.w + 10 + grow - ox, p.y - 46 - oy);
      g.lineTo(p.x + p.w + 1 + grow - ox, p.y - 1 - oy);
      for (let i = p.n - 1; i >= 0; i--) g.lineTo(p.x + i * DX - ox, p.y + p.prof[i] + grow - oy);
      g.lineTo(p.x - 1 - grow - ox, p.y - 1 - oy);
      g.closePath();
    };
    for (const ch of W.chunks) {
      if (ch.x0 > p.x + p.w + 20 || ch.x0 + CHUNK < p.x - 20) continue;
      const g = ch.c.getContext('2d'), ox = ch.x0, oy = top;
      g.save();
      // pared mojada: oscurece el terreno alrededor del hueco
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = p.kind === 'oil' ? 'rgba(10,8,16,.55)' : 'rgba(15,22,30,.42)'; path(g, ox, oy, 5); g.fill();
      g.fillStyle = 'rgba(15,22,30,.35)'; path(g, ox, oy, 2.5); g.fill();
      // hueco
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; path(g, ox, oy, 0); g.fill();
      g.restore();
    }
  }
  function puddleAt(x, y, pad = 0) { for (const p of S.puddles) if (x > p.x - pad && x < p.x + p.w + pad && y > p.y - 10 && y < p.y + p.D * 1.4 + 10) return p; return null; }
  // perturba la superficie del agua en x
  function ripple(p, x, s) {
    const i = Math.round((x - p.x) / DX);
    for (let k = -2; k <= 2; k++) { const j = i + k; if (j > 0 && j < p.n - 1) p.v[j] += s * 70 * (1 - Math.abs(k) * .3); }
  }
  function waves(p, dt) {
    const h = p.h, v = p.v, n = p.n, steps = 3, d = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (let i = 1; i < n - 1; i++) v[i] += (-50 * h[i] + 1300 * (h[i - 1] + h[i + 1] - 2 * h[i]) / (DX * DX) * 9) * d;
      const damp = Math.exp(-2.6 * d);
      for (let i = 1; i < n - 1; i++) { v[i] *= damp; h[i] = clamp(h[i] + v[i] * d, -4, 4); }
    }
    // brisa: un oleaje muy suave
    if (chance(dt * 1.2)) p.v[1 + ((Math.random() * (n - 2)) | 0)] += R(-6, 6);
  }
  function splash(p, x, power, dir) {
    const col = p.kind === 'oil' ? [40, 36, 50] : p.kind === 'glow' ? [255, 200, 245] : [205, 232, 250];
    const n = Math.round(4 + power * 9);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + R(-1.05, 1.05) + dir * .35, v = R(.4, 1) * (150 + power * 260);
      FX.spawnRaw({ t: 'drop', x: x + R(-6, 6), y: p.lvl - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1100, max: R(.5, .9), s: R(1.3, 2.6) * (.8 + power * .3), col });
    }
    ripple(p, x, 1 + power * 1.5);
    Sound.play('puddle', power);
  }
  FX.HOOK.drop = (x, y, sz, d) => {
    const p = puddleAt(x, y); if (p) ripple(p, x, .4);
    const W = GAME && GAME.world; if (!W) return;
    // gota que cae sobre agua o lava: hace ola en la superficie
    for (const l of W.liquids) if (l.surface && x >= l.x0 && x <= l.x1 && Math.abs(y - l.curLevel) < 30) { l.surface.splash(x, (sz || 2) * .8); return; }
    // gota de lava que cae al suelo: chisporrotea y deja una quemadura
    if (d && d.lava) { FX.embers(x, y - 2, 2, 80); if (chance(.3)) FX.decal(x, y, 'scorch', 8); }
  };

  /* ---------- actores que pisan ---------- */
  function stepActor(G, a, dt, isHero) {
    if (a.dead || a.flying || !a.onGround) { a._inPud = null; return; }
    const p = puddleAt(a.x, a.y);
    if (p) {
      if (!a._inPud) { const v = isHero ? (a.landVy || 0) : 0, power = clamp(Math.abs(a.vx) / 400 + v / 700, .35, 1.6); splash(p, a.x, power, Math.sign(a.vx)); a._pT = .1; }
      else if (Math.abs(a.vx) > 40) { a._pT -= dt; if (a._pT <= 0) { a._pT = clamp(26 / Math.abs(a.vx), .1, .3); splash(p, a.x, clamp(Math.abs(a.vx) / 520, .25, 1), Math.sign(a.vx)); } }
      else if (chance(dt * .8)) ripple(p, a.x, .3);
      if (Math.abs(a.vx) > 40) ripple(p, a.x + Math.sign(a.vx) * 8, Math.min(.5, Math.abs(a.vx) / 1400));
      if (isHero) a.wetT = 2.6;
      // vadear: el agua frena según lo hondo que estés
      const depth = clamp((a.y - p.lvl) / 18, 0, 1);
      if (depth > 0 && !(a.dashT > 0)) a.vx *= Math.exp(-dt * 5 * depth);
    }
    a._inPud = p;
  }

  /* ---------- huellas ---------- */
  function prints(G, H, dt) {
    if (!H.onGround || H.dead || Math.abs(H.vx) < 30 || H._inPud || H.inLiquid) { if (!H.onGround) S.printAcc = 20; return; }
    const surf = G.world.surfaceAt(H.x, H.y + 2), sand = surf && surf.grains, wet = H.wetT > 0;
    if (!sand && !wet) return;
    S.printAcc += Math.abs(H.vx) * dt;
    if (S.printAcc > 30) {
      S.printAcc = 0; S.printSide ^= 1;
      const fx = H.x + (S.printSide ? 3 : -3);
      FX.decal(fx, H.y, 'print', Math.sign(H.vx) || H.face, { col: wet && !sand ? `rgba(20,32,44,${.18 + .25 * Math.min(1, H.wetT / 2)})` : 'rgba(150,108,60,.34)', max: sand ? 10 : 4 });
    }
  }

  /* ---------- el aire empuja las partículas ---------- */
  const PUSHABLE = new Set(['dust', 'leaf', 'smoke', 'grain', 'mote', 'spore', 'ember']);
  function wind(G, H, dt) {
    const fast = Math.abs(H.vx) > 230, dash = H.dashT > 0, atk = !!H.atk;
    const P = FX.parts, cx = H.x, cy = H.y - 24;
    for (const p of P) {
      if (!PUSHABLE.has(p.t)) continue;
      const dx = p.x - cx, dy = p.y - cy, d2 = dx * dx + dy * dy;
      // hojas y granos en reposo en el suelo: los levantas al pasar
      if (p.g === 0 && p.vx === 0 && p.vy === 0 && (p.t === 'leaf' || p.t === 'grain')) {
        if (Math.abs(dx) < 22 && Math.abs(p.y - H.y) < 14 && Math.abs(H.vx) > 90) { p.vx = H.vx * R(.4, .8); p.vy = -R(90, 200); p.g = p.t === 'leaf' ? 160 : 900; p.vr = R(-12, 12); p.max = p.life + R(1.2, 2.4); }
        continue;
      }
      if (!(fast || dash || atk)) continue;
      const R2 = dash ? 110 * 110 : atk ? 90 * 90 : 70 * 70;
      if (d2 > R2) continue;
      const k = 1 - d2 / R2, f = (dash ? 900 : atk ? 600 : 350) * k * dt;
      p.vx = (p.vx || 0) + (dash ? Math.sign(H.vx || H.face) : atk ? H.face : Math.sign(H.vx)) * f + dx * k * dt * 2;
      p.vy = (p.vy || 0) - f * .35;
    }
    // piedrecitas y trozos en reposo: les das una patada al pasar
    for (const d of FX.debrisList) {
      if (!d.rest) continue;
      if (Math.abs(d.x - H.x) < 14 + d.r && Math.abs(d.y - H.y) < 16 && Math.abs(H.vx) > 80) { d.rest = false; d.vx = H.vx * R(.5, 1); d.vy = -R(120, 260); d.vr = R(-14, 14); d.life = Math.min(d.life, d.max - 2); }
    }
  }

  /* ---------- remolino: el giro de la espada arrastra el aire ---------- */
  // el aire empieza a girar poco a poco mientras la espada gira; al acabar sigue girando
  // por inercia, se debilita y suelta lo que arrastraba, que sale despedido hacia fuera
  const SWIRL = new Set(['leaf', 'dust', 'grain', 'smoke', 'spore', 'mote', 'ember', 'drop', 'spark']);
  function vortex(G, H, dt) {
    const spinning = H.atk && H.atk.kind === 'charged' && H.weapon === 'sword';
    let V = S.vortex;
    if (spinning) {
      if (!V) V = S.vortex = { x: H.x, y: H.y - 46, str: 0, dir: H.face, a: 0 };
      V.x = H.x; V.y = H.y - 46; V.dir = H.face; V.str = Math.min(1, V.str + dt * 2.2);
      // el giro arranca material del suelo: hojas, arena, polvo
      const surf = G.world.surfaceAt(H.x, H.y + 2);
      for (let k = 0; k < 3; k++) {
        const x = H.x + R(-110, 110), gy = G.world.groundY(x); if (!isFinite(gy) || Math.abs(gy - H.y) > 40) continue;
        if (surf && surf.leaves && chance(.6)) FX.spawnRaw({ t: 'leaf', x, y: gy - 2, vx: R(-30, 30), vy: -R(60, 140), g: 160, drag: 1.4, max: R(2.5, 3.5), s: R(2, 3.4), col: pick(surf.leaves), rot: R(0, TAU), vr: R(-10, 10) });
        else if (surf && surf.grains) FX.spawnRaw({ t: 'grain', x, y: gy - 2, vx: R(-40, 40), vy: -R(80, 180), g: 900, max: R(1.5, 2.5), s: R(1, 2), col: surf.chip });
        if (chance(.5)) FX.spawnRaw({ t: 'dust', x, y: gy - 3, vx: 0, vy: -R(10, 40), g: 0, drag: 1, max: R(1, 1.6), s: R(3, 5), s1: R(10, 18), col: surf ? surf.dust : [180, 170, 150], a: .35 });
      }
      const p = puddleAt(H.x, H.y); if (p) for (let i = 1; i < p.n - 1; i++) p.v[i] += Math.sin(i * .5 + G.rt * 18) * 30 * dt * 10;
      // ¿hay agua o lava cerca? el remolino la busca
      V.liquid = null;
      for (const l of G.world.liquids) if (l.surface && !l.decorative && H.x > l.x0 - 90 && H.x < l.x1 + 90 && H.y > l.curLevel - 170 && H.y < l.curLevel + 160) { V.liquid = l; break; }
    } else if (V) { V.str *= Math.exp(-dt * 1.5); if (V.str < .04) V = S.vortex = null; }
    if (!V) return;
    V.a += dt * V.dir * (4 + V.str * 10);
    if (V.liquid) part(G, V, V.liquid, dt);
    const RAD = 190, R0 = 78, str = V.str;
    const pull = (o, gravity) => {
      // órbita ovalada (más ancha que alta) que no toca el suelo
      const dx = o.x - V.x, dy = (o.y - V.y) * 2, d = Math.hypot(dx, dy) || 1;
      if (d > RAD) return false;
      const k = 1 - d / RAD, f = str * (.35 + .65 * k);
      const tx = -dy / d * V.dir, ty = dx / d * V.dir * .5, vt = 540 * str * (.45 + .55 * k);
      const blend = Math.min(1, dt * 5 * f);                         // acelera poco a poco
      o.vx += (tx * vt - o.vx) * blend; o.vy += (ty * vt - o.vy) * blend;
      const radial = (R0 - d) * 9 * f * dt;                          // mantiene la órbita
      o.vx += dx / d * radial; o.vy += dy / d * radial * .5;
      o.vy -= gravity * dt * Math.min(1, f * 1.8);                   // el aire sostiene
      return true;
    };
    for (const p of FX.parts) {
      if (!SWIRL.has(p.t) || p.novortex) continue;
      // hojas y granos quietos en el suelo: el remolino los levanta
      if (p.g === 0 && p.vx === 0 && p.vy === 0 && (p.t === 'leaf' || p.t === 'grain')) {
        if (Math.hypot(p.x - V.x, p.y - V.y) < RAD * .8 && str > .15) { p.g = p.t === 'leaf' ? 160 : 900; p.vy = -R(60, 140); p.vr = R(-12, 12); }
        else continue;
      }
      if (pull(p, p.g || 0)) {
        p.max = Math.max(p.max, p.life + 1.2); if (p.t === 'leaf') p.vr = (p.vr || 0) + V.dir * 20 * dt;
        // el suelo frena la órbita: en vez de atravesarlo, se arrastra pegado a él
        const size = p.s1 ? lerp(p.s, p.s1, Math.min(1, p.life / p.max)) : (p.s || 2), m = size * .55 + 1;
        const gy = G.world.groundY(p.x);
        if (p.t !== 'drop' && isFinite(gy) && p.y + m > gy && p.y - m < gy + 40) {
          p.y = gy - m;
          if (p.vy > 0) { p.vx += (Math.sign(p.vx) || V.dir) * p.vy * .7; p.vy = -p.vy * .08; }
          p.vx *= Math.exp(-dt * 1.2);                               // roce con el suelo
        }
      }
    }
    for (const d of FX.debrisList) { if (d.rest) { if (Math.hypot(d.x - V.x, d.y - V.y) < RAD * .7 && str > .3) { d.rest = false; d.vy = -200; } else continue; } if (pull(d, 1300)) d.life = Math.min(d.life, d.max - 1.5); }
  }
  /* el remolino aparta el líquido: abre un paso hasta el fondo; lo apartado sube en arco
     por encima de Lio y cae detrás */
  const PART_W = 95;
  function part(G, V, L, dt) {
    const S2 = L.surface, str = V.str; if (!S2 || str < .05) return;
    let floor = G.world.groundY(V.x); if (!isFinite(floor) || floor < L.curLevel) floor = L.curLevel + 110;
    const depth = Math.min(130, floor - L.curLevel + 8) * Math.min(1, str * 1.4);
    V.partDepth = depth; V.level = L.curLevel;
    // el chorro sigue el giro de la espada: por arriba la hoja va de atrás hacia delante,
    // así que el líquido nace detrás de Lio (base gruesa), pasa por encima y cae delante
    const H = G.hero; V.flow = lerp(V.flow ?? -V.dir, -V.dir, Math.min(1, dt * 6));
    // el chorro nace siempre dentro del líquido: si la base queda sobre suelo firme, se desplaza
    { const dir = V.flow ?? -V.dir, bx = V.x + dir * PART_W * .9, cx = clamp(bx, L.x0 + 14, L.x1 - 14); V.shift = cx - bx; V.far = Math.abs(V.shift) > PART_W * 1.4; }
    shed(V, dt, G.rt);
    for (let i = 0; i < S2.n; i++) {
      const x = L.x0 + i * S2.step, dx = Math.abs(x - V.x); if (dx > PART_W) continue;
      const target = depth * Math.pow(Math.cos(dx / PART_W * Math.PI / 2), 1.3);
      if (S2.h[i] < target) { S2.h[i] = lerp(S2.h[i], target, Math.min(1, dt * 10)); S2.v[i] = 0; }
    }
    // lo que se aparta sube por los bordes del paso
    const lava = L.type === 'lava', n = Math.round(2 * str + (chance(.4) ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const side = chance(.5) ? -1 : 1, x = V.x + side * R(PART_W * .55, PART_W * .95);
      if (x < L.x0 || x > L.x1) continue;
      FX.spawnRaw({ t: 'drop', lava, novortex: 1, x, y: L.curLevel + S2.at(x) - 2, vx: -side * R(30, 90), vy: -R(200, 380), g: 1100, max: R(1, 1.6), s: R(2.6, 4.4), col: lava ? [255, R(120, 190), 40] : [190, 230, 255] });
      if (lava && chance(.4)) FX.embers(x, L.curLevel - 4, 1, 120);
    }
    if (chance(dt * 6)) Sound.play(lava ? 'splash' : 'bubble', lava);
  }
  // ¿este punto está dentro del paso abierto?
  function parted(l, x) { const V = S.vortex; return !!(V && V.liquid === l && V.str > .3 && Math.abs(x - V.x) < PART_W * .62); }
  const liq0 = World.prototype.liquidAt;
  World.prototype.liquidAt = function (x, y) { const l = liq0.call(this, x, y); return l && parted(l, x) ? null : l; };
  // chorro de líquido por encima de Lio: una cinta que ondula, cambia de grosor y suelta gotas
  function surfaceY(V, x) { const L = V.liquid; return V.level + (L && L.surface ? L.surface.at(clamp(x, L.x0, L.x1)) : 0); }
  function ribbon(V, u, t) {
    const dir = V.flow ?? -V.dir, rx = PART_W * .9, h = Math.max(70, (V.partDepth || 0) + 55) * (.92 + .08 * Math.sin(t * 2.3));
    const s = Math.sin(Math.PI * u);
    let x = V.x + (V.shift || 0) + dir * rx * Math.cos(Math.PI * u) - dir * 10 * s * Math.sin(t * 1.7);
    // la base se apoya en la superficie deformada del líquido (no en su altura de reposo)
    const surf = surfaceY(V, x);
    let y = V.level - h * Math.pow(s, .8) * (1 + .12 * Math.sin(u * 3 + t * 1.3)) + (surf - V.level) * Math.pow(1 - s, 1.5);
    // ondulación que recorre el chorro (perpendicular a la curva)
    const tx = -dir * Math.sin(Math.PI * u), ty = -Math.cos(Math.PI * u) * .8, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
    const wob = (Math.sin(u * 9 - t * 7) * 4.5 + Math.sin(u * 19 + t * 11) * 2 + Math.sin(u * 31 - t * 17) * 1) * s;
    x += nx * wob; y += ny * wob;
    const a = Math.min(1, V.str * 1.2);
    // grosor físico: muy gruesa en la base de donde sale el líquido (con un pie que se funde con la
    // superficie), se adelgaza al subir y al caer, y se ensancha un poco donde vuelve a caer
    const foot = Math.max(0, 1 - u / .1), land = Math.max(0, (u - .9) / .1);
    let w = (5 + 24 * Math.pow(1 - u, 1.5) + 22 * foot * foot + 7 * land * land) * a * (1 + .3 * Math.sin(u * 12 - t * 9) * (1 - foot) + .14 * Math.sin(u * 27 + t * 13));
    if (a < .75) w *= Math.max(0, .35 + 1.2 * Math.sin(u * 8.5 + t * 5) * (1 - a) + a * .9);  // al debilitarse se rompe
    return { x, y, w, tx: tx / tl, ty: ty / tl };
  }
  function drawLiquidArc(g, V, t) {
    if (!V.liquid || V.str < .12 || !V.level) return;
    const lava = V.liquid.type === 'lava', N = 40, all = [], W = GAME.world, L = V.liquid;
    if (V.far) return;
    for (let i = 0; i <= N; i++) all.push(ribbon(V, i / N, t));
    // el chorro no atraviesa el suelo firme: nace solo donde hay líquido y se corta al chocar
    const solidAt = (x, y) => { const gy = W.groundY(x); return isFinite(gy) && gy < V.level - 1 && y > gy; };
    let i0 = 0, i1 = N; V.hit = null;
    for (let i = Math.ceil(N / 2); i <= N; i++) { const p = all[i]; if (solidAt(p.x, p.y + p.w * .3)) { i1 = i; V.hit = { x: p.x, y: W.groundY(p.x), w: p.w }; break; } }
    const P = all.slice(i0, i1 + (V.hit ? 0 : 1));
    if (P.length < 2) return;
    // tramos continuos (donde el chorro no se ha roto)
    const runs = []; let cur = [];
    for (const p of P) { if (p.w > 1.1) cur.push(p); else if (cur.length) { runs.push(cur); cur = []; } }
    if (cur.length) runs.push(cur);
    g.save();
    // recorte: solo por encima del terreno (dentro del foso el terreno es el fondo, así que entra)
    { const xa = V.x - 320, xb = V.x + 320; g.beginPath(); g.moveTo(xa, V.level - 600); g.lineTo(xb, V.level - 600);
      for (let x = xb; x >= xa; x -= 6) { let gy = W.groundY(x); if (!isFinite(gy)) gy = V.level + 400; g.lineTo(x, gy + 1); }
      g.closePath(); g.clip(); }
    const top = V.level - 200, gr = g.createLinearGradient(0, top, 0, V.level + (V.partDepth || 0) + 10);
    if (lava) { gr.addColorStop(0, '#ffe08a'); gr.addColorStop(.4, '#ff9a30'); gr.addColorStop(.75, '#f06a22'); gr.addColorStop(1, '#d9521c'); }
    else { gr.addColorStop(0, 'rgba(225,245,255,.92)'); gr.addColorStop(1, 'rgba(80,150,200,.85)'); }
    for (const r of runs) {
      if (r.length < 2) { const p = r[0]; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.w * .6, 0, TAU); g.fill(); continue; }
      g.fillStyle = gr; g.beginPath();
      for (const p of r) g.lineTo(p.x - p.ty * p.w / 2, p.y + p.tx * p.w / 2);
      for (let i = r.length - 1; i >= 0; i--) { const p = r[i]; g.lineTo(p.x + p.ty * p.w / 2, p.y - p.tx * p.w / 2); }
      g.closePath(); g.fill();
      // extremos redondeados
      for (const p of [r[0], r[r.length - 1]]) { g.beginPath(); g.arc(p.x, p.y, p.w / 2, 0, TAU); g.fill(); }
      // montículo donde nace el chorro: el líquido se levanta desde la superficie
      if (r[0] === P[0] && i0 === 0) { const p = P[0], bw = p.w * 1.1 + 10, wb = Math.sin(t * 6) * 2; const yl = surfaceY(V, p.x - bw), yr = surfaceY(V, p.x + bw), ym = surfaceY(V, p.x); g.beginPath(); g.moveTo(p.x - bw, yl + 6); g.quadraticCurveTo(p.x - bw * .35, ym - 4 + wb, p.x, p.y - p.w * .45); g.quadraticCurveTo(p.x + bw * .35, ym - 4 - wb, p.x + bw, yr + 6); g.closePath(); g.fill(); }
      // núcleo brillante que fluye
      g.strokeStyle = lava ? 'rgba(255,245,190,.85)' : 'rgba(255,255,255,.75)'; g.lineCap = 'round';
      for (let i = 1; i < r.length; i++) { const p = r[i], q = r[i - 1], k = .5 + .5 * Math.sin(i * .9 - t * 12); if (k < .35) continue; g.lineWidth = p.w * .28 * k; g.beginPath(); g.moveTo(q.x - q.ty * q.w * .15, q.y + q.tx * q.w * .15); g.lineTo(p.x - p.ty * p.w * .15, p.y + p.tx * p.w * .15); g.stroke(); }
      // costra oscura en la lava (bordes que se enfrían)
      if (lava) { g.fillStyle = 'rgba(90,30,20,.35)'; for (let i = 2; i < r.length - 2; i += 3) { const p = r[i], k = Math.sin(i * 2.1 + t * 3); if (k > .3) { g.beginPath(); g.ellipse(p.x + p.ty * p.w * .3, p.y - p.tx * p.w * .3, p.w * .25, p.w * .14, Math.atan2(p.ty, p.tx), 0, TAU); g.fill(); } } }
    }
    if (V.hit) { const h = V.hit, sw = h.w * .9 + 9, hh = Math.max(7, h.w * .8); g.fillStyle = gr; g.beginPath(); g.ellipse(h.x, h.y + 1, sw, hh, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.ellipse(h.x, h.y - hh * .4, h.w * .6 + 3, hh * .9, 0, 0, TAU); g.fill(); }
    if (lava) { g.globalCompositeOperation = 'lighter'; for (let i = 4; i < P.length; i += 6) { const p = P[i]; if (p.w > 2) glowAt(g, [255, 140, 50], p.x, p.y, 34 + p.w * 2, .3 * Math.min(1, V.str)); } }
    g.restore();
  }
  // el chorro suelta gotas que caen detrás y gotea por debajo
  function shed(V, dt, t) {
    if (!V.liquid || V.str < .15 || !V.level || V.far) return;
    const lava = V.liquid.type === 'lava', n = Math.round(dt * 70 * V.str + (chance(.5) ? 1 : 0));
    if (V.hit && chance(dt * 30)) { const h = V.hit; for (let k = 0; k < 3; k++) FX.spawnRaw({ t: 'drop', lava, novortex: 1, x: h.x + R(-6, 6), y: h.y - 3, vx: R(-160, 160), vy: -R(120, 260), g: 1100, max: .7, s: R(1.4, 2.6), col: lava ? [255, R(110, 200), 40] : [200, 235, 255] }); if (lava && chance(.3)) FX.decal(h.x + R(-10, 10), h.y, 'scorch', 10); }
    for (let k = 0; k < n; k++) {
      const u = R(.15, 1), p = ribbon(V, u, t); if (p.w < 1.2) continue;
      { const gy = GAME.world.groundY(p.x); if (isFinite(gy) && gy < V.level - 1 && p.y > gy - 4) continue; }
      const drip = chance(.4), sp = drip ? R(10, 40) : R(120, 260);
      FX.spawnRaw({ t: 'drop', lava, x: p.x + R(-2, 2), y: p.y + (drip ? p.w * .5 : 0), vx: p.tx * sp * (drip ? .3 : 1) + R(-20, 20), vy: (drip ? 40 : p.ty * sp), g: 1100, max: R(.8, 1.4), s: R(1.6, 3.4) * (drip ? .8 : 1), col: lava ? [255, R(110, 200), 40] : [200, 235, 255], kid: drip ? 1 : 0, novortex: 1 });
    }
  }
  // giro sostenido (habilidad del Taller): mantén pulsado el ataque con la espada
  const hup0 = Hero.prototype.update;
  Hero.prototype.update = function (dt) {
    hup0.call(this, dt);
    if (!this.skills || !this.skills.whirl || this.weapon !== 'sword' || this.dead) { this.whirling = false; return; }
    if (!this.whirling && this.chargeLvl && Input.down('attack') && this.attackPressedT > 1 && this.stamina > 24 && !this.atk) {
      this.startCharged(); this.chargeLvl = 0;
      if (this.atk) { this.whirling = true; FX.text(this.x, this.y - 100, 'WHIRL!', '#bfefff', 34); Sound.play('whoosh'); }
    }
    if (this.whirling) {
      if (!Input.down('attack') || this.stamina <= 0 || !this.atk || this.atk.kind !== 'charged') { this.whirling = false; if (this.stamina <= 0) FX.text(this.x, this.y - 90, '¡Sin aliento!', '#ffb0a0', 24); }
      else { this.atk.dur = Math.max(this.atk.dur, this.atk.t / .5); this.stamina = Math.max(0, this.stamina - 17 * dt); this.staminaT = .6; if (chance(dt * 3)) Sound.play('whoosh'); }
    }
  };
  function drawVortex(g) {
    if (S.vortex) drawLiquidArc(g, S.vortex, GAME.rt);
    const V = S.vortex; if (!V || V.str < .05) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.beginPath(); g.rect(V.x - 400, V.y - 400, 800, 400 + 44); g.clip(); // las líneas de viento tampoco atraviesan el suelo
    for (let i = 0; i < 5; i++) {
      const r = 46 + i * 17, a0 = V.a * (1.2 - i * .12) + i * 1.3, len = .9 + V.str * 1.2;
      g.strokeStyle = `rgba(235,245,255,${V.str * (.22 - i * .03)})`; g.lineWidth = 3 - i * .4;
      g.beginPath(); g.ellipse(V.x, V.y, r, r * .5, 0, a0, a0 + len * V.dir, V.dir < 0); g.stroke();
    }
    g.restore();
  }

  /* ---------- la espada siega la hierba ---------- */
  function mow(G, H) {
    if (!H.atk || !G.decor || !G.decor.grass) return;
    const boxes = H.hitboxes(); if (!boxes.length) return;
    let n = 0;
    for (const bx of boxes) {
      const y0 = bx.y, y1 = bx.y + bx.h + 12;
      for (const b of G.decor.grass) {
        if (b.cutT || b.x < bx.x || b.x > bx.x + bx.w || b.y < y0 || b.y > y1) continue;
        b.cutT = 1; b.h0 = b.h; b.h *= .3; S.cut.push(b);
        if (n++ < 14) {
          const col = hex((b.cols || BIOMES[G.curBiome].grass)[b.c] || '#7fb848');
          FX.spawnRaw({ t: 'leaf', x: b.x, y: b.y - b.h0 * .6, vx: H.face * R(60, 220) + R(-40, 40), vy: -R(140, 320), g: 420, drag: 1.2, max: R(1.4, 2.4), s: R(1.4, 2.4), col, rot: R(0, TAU), vr: R(-18, 18) });
        }
      }
    }
  }
  function regrow(dt) {
    for (const b of S.cut) { b.cutT += dt; if (b.cutT > 6) b.h = Math.min(b.h0, b.h + dt * 3); if (b.h >= b.h0) b.done = 1; }
    if (S.cut.length) S.cut = S.cut.filter(b => { if (b.done) { b.cutT = 0; b.done = 0; return false; } return true; });
  }

  /* ---------- bucle ---------- */
  const upd0 = Game.prototype.update;
  Game.prototype.update = function (dt) {
    upd0.call(this, dt);
    if (this.mode !== 'play' || UI.modalOpen() || this.freezeT > 0) return;
    const gdt = dt * (this.cinematic ? (this.cinematic.worldTs ?? 0) : this.timeScale), H = this.hero;
    if (!gdt) return;
    stepActor(this, H, gdt, true);
    for (const e of this.enemies) if (Math.abs(e.x - H.x) < 900) stepActor(this, e, gdt, false);
    if (H.wetT > 0) H.wetT -= gdt;
    prints(this, H, gdt);
    wind(this, H, gdt);
    vortex(this, H, gdt);
    mow(this, H);
    regrow(gdt);
    for (const p of S.puddles) if (Math.abs(p.x - H.x) < 1600) waves(p, Math.min(gdt, 1 / 30));
  };
  const load0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) {
    S.puddles = []; S.cut = [];
    const r = load0.call(this, ref);
    const after = () => { try { genPuddles(this); } catch (e) { console.warn('charcos', e); } };
    if (r && r.then) return r.then(v => { after(); return v; });
    after(); return r;
  };

  /* ---------- dibujo ---------- */
  function waterPath(g, p) {
    g.beginPath(); g.moveTo(p.x, p.lvl);
    for (let i = 0; i < p.n; i++) g.lineTo(p.x + i * DX, p.lvl + p.h[i]);
    for (let i = p.n - 1; i >= 0; i--) g.lineTo(p.x + i * DX, p.y + p.prof[i] + .5);
    g.closePath();
  }
  function surfaceLine(g, p, a) {
    g.strokeStyle = p.kind === 'oil' ? `rgba(190,170,255,${a * .5})` : `rgba(255,255,255,${a})`; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(p.x + DX, p.lvl + p.h[1]); for (let i = 2; i < p.n - 1; i++) g.lineTo(p.x + i * DX, p.lvl + p.h[i]); g.stroke();
  }
  // agua dentro del hueco, por detrás de los personajes
  function drawPuddles(g, G, x0, x1) {
    const t = G.rt;
    for (const p of S.puddles) {
      if (p.x + p.w < x0 || p.x > x1) continue;
      const bot = p.y + p.D * 1.3;
      g.save(); waterPath(g, p); g.clip();
      const gr = g.createLinearGradient(0, p.lvl - 2, 0, bot);
      if (p.kind === 'oil') { gr.addColorStop(0, 'rgba(52,44,66,.97)'); gr.addColorStop(1, 'rgba(10,8,14,.98)'); }
      else if (p.kind === 'glow') { gr.addColorStop(0, 'rgba(255,190,245,.9)'); gr.addColorStop(1, 'rgba(90,40,110,.95)'); }
      else { gr.addColorStop(0, 'rgba(118,168,200,.93)'); gr.addColorStop(.3, 'rgba(70,118,150,.95)'); gr.addColorStop(1, 'rgba(26,44,60,.97)'); }
      g.fillStyle = gr; g.fillRect(p.x - 2, p.lvl - 6, p.w + 4, bot - p.lvl + 10);
      // fondo: piedrecitas y barro
      for (const [u, dv, r, c] of p.pebbles) {
        const i = Math.min(p.n - 1, Math.round(u * (p.n - 1))), px = p.x + i * DX, py = p.y + p.prof[i] - r * .6;
        g.fillStyle = p.kind === 'oil' ? 'rgba(0,0,0,.4)' : c < .5 ? 'rgba(40,46,52,.55)' : 'rgba(150,160,150,.45)';
        g.beginPath(); g.ellipse(px, py, r * 1.4, r * dv, 0, 0, TAU); g.fill();
      }
      // reflejo del cielo que se desliza con la cámara
      const sh = ((G.cam.x * .25 + p.ph * 40) % (p.w + 60)) - 30;
      g.fillStyle = p.kind === 'oil' ? 'rgba(150,110,255,.22)' : 'rgba(255,255,255,.28)';
      g.beginPath(); g.ellipse(p.x + sh, p.lvl + 3, p.w * .2, 2.4, 0, 0, TAU); g.fill();
      if (p.kind === 'oil') for (let i = 0; i < 3; i++) { g.strokeStyle = ['rgba(255,80,160,.3)', 'rgba(80,220,255,.3)', 'rgba(255,230,80,.26)'][i]; g.lineWidth = 1.3; g.beginPath(); g.ellipse(p.x + p.w / 2 + Math.sin(t * .4 + i) * 8, p.lvl + 2, p.w * (.14 + i * .09), 1.6 + i, 0, 0, TAU); g.stroke(); }
      // cáusticas suaves
      if (p.kind !== 'oil') { g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 8; i++) { const xx = p.x + p.w * i / 8; g.lineTo(xx, p.lvl + 6 + k * 4 + Math.sin(t * 2 + i * 1.3 + k) * 1.4); } g.stroke(); } }
      g.restore();
      surfaceLine(g, p, .75);
    }
  }
  // capa delantera: el agua tapa los pies de quien la pisa
  function drawPuddlesFront(g, G, x0, x1) {
    for (const p of S.puddles) {
      if (p.x + p.w < x0 || p.x > x1) continue;
      const H = G.hero; let any = Math.abs(H.x - p.x - p.w / 2) < p.w;
      if (!any) for (const e of G.enemies) if (e._inPud === p) { any = true; break; }
      if (!any) continue;
      g.save(); waterPath(g, p); g.clip();
      g.fillStyle = p.kind === 'oil' ? 'rgba(30,24,40,.7)' : p.kind === 'glow' ? 'rgba(220,150,230,.5)' : 'rgba(55,100,135,.5)';
      g.fillRect(p.x - 2, p.lvl - 6, p.w + 4, p.D * 1.5 + 10);
      g.restore();
      surfaceLine(g, p, .9);
    }
  }
  return { S, drawPuddles, drawPuddlesFront, drawVortex, puddleAt };
})();
