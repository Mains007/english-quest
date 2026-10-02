"use strict";
/* =====================================================================
   EFECTOS Y FÍSICA DE PARTÍCULAS
   - Polvo/arena/hojas/gotas/ceniza según el SUELO que pisas.
   - Escombros con física: vuelan en arco, rebotan, ruedan y se asientan.
   - Anillos de impacto, chispas, humo, brasas, runas, texto cómic (BAM!).
   - Marcas en el suelo (grietas, quemaduras) que se desvanecen.
   ===================================================================== */
const SURF = {
  sand:   { dust: [232, 208, 156], chip: [214, 182, 128], grains: 1, sound: 'sand' },
  dirt:   { dust: [150, 118, 84], chip: [120, 90, 62], sound: 'dirt' },
  grass:  { dust: [140, 120, 90], chip: [96, 150, 62], leaves: [[88, 150, 58], [120, 176, 70]], sound: 'grass' },
  moss:   { dust: [130, 128, 110], chip: [100, 120, 80], leaves: [[90, 130, 60]], sound: 'grass' },
  rock:   { dust: [150, 150, 160], chip: [110, 112, 128], pebbles: 1, sound: 'rock' },
  wet:    { dust: [190, 220, 235], chip: [96, 116, 132], drops: 1, sound: 'wet' },
  basalt: { dust: [90, 80, 80], chip: [60, 52, 56], embers: 1, sound: 'rock' },
  wood:   { dust: [170, 140, 100], chip: [140, 98, 60], sound: 'wood' },
  coral:  { dust: [240, 190, 180], chip: [232, 134, 120], pebbles: 1, sound: 'rock' },
  brick:  { dust: [180, 165, 145], chip: [160, 140, 118], pebbles: 1, sound: 'rock' },
  cap:    { dust: [255, 190, 240], chip: [214, 92, 178], spores: 1, sound: 'bounce' },
  water:  { dust: [220, 245, 255], chip: [150, 210, 230], drops: 1, sound: 'water' },
  metal:  { dust: [180, 180, 190], chip: [150, 150, 160], sparks: 1, sound: 'metal' }
};
const MAT_SURF = { sand: 'sand', sandstone: 'sand', coral: 'coral', wetrock: 'wet', moss: 'moss', brick: 'brick', rock: 'rock', basalt: 'basalt', wood: 'wood', dirt: 'dirt', cap: 'cap', metal: 'metal', crystal: 'rock', cloud: 'sand' };

const FX = (() => {
  const P = [], DEB = [], DEC = [], TXT = [], RINGS = [], HOOK = { drop: null };
  let world = null, reduced = false, quality = 1;
  const MAXP = 1400, MAXD = 220;

  function setWorld(w) { world = w; P.length = 0; DEB.length = 0; DEC.length = 0; TXT.length = 0; RINGS.length = 0; }
  function setReduced(v) { reduced = v; }
  function add(o) { if (P.length >= MAXP) P.shift(); o.life = 0; P.push(o); return o; }
  function n(k) { return Math.max(1, Math.round(k * quality * (reduced ? .5 : 1))); }

  /* ---------- emisores de alto nivel ---------- */
  function surfAt(x, y) { return world ? world.surfaceAt(x, y) : SURF.rock; }
  function footstep(x, y, dir, speed) {
    const s = surfAt(x, y + 2);
    const k = speed > 250 ? 3 : 2;
    for (let i = 0; i < n(k); i++) add({ t: 'dust', x: x + R(-4, 4), y: y - 1, vx: -dir * R(10, 60) + R(-15, 15), vy: R(-40, -8), g: 60, drag: 2.2, max: R(.35, .7), s: R(2, 4.5), s1: R(5, 9), col: s.dust, a: .45 });
    if (s.grains) for (let i = 0; i < n(3); i++) add({ t: 'grain', x, y: y - 2, vx: -dir * R(30, 110), vy: R(-140, -60), g: 900, max: R(.4, .7), s: R(1, 2), col: s.chip, bounce: 0 });
    if (s.leaves && chance(.35)) add({ t: 'leaf', x, y: y - 4, vx: -dir * R(20, 70), vy: R(-120, -50), g: 260, drag: 1.5, max: R(.6, 1.1), s: R(2, 3.5), col: pick(s.leaves), rot: R(0, TAU), vr: R(-10, 10) });
    if (s.drops) for (let i = 0; i < n(3); i++) add({ t: 'drop', x, y: y - 2, vx: -dir * R(20, 90) + R(-20, 20), vy: R(-180, -80), g: 900, max: R(.35, .6), s: R(1.2, 2.2), col: [200, 235, 255] });
    if (s.embers && chance(.5)) add({ t: 'ember', x, y: y - 3, vx: R(-30, 30), vy: R(-90, -40), g: -20, drag: 1, max: R(.6, 1.1), s: R(1, 2) });
    if (s.pebbles && speed > 260 && chance(.3)) debris(x, y - 3, s.chip, 1, 120, .5);
    if (s.spores) for (let i = 0; i < n(2); i++) add({ t: 'spore', x, y: y - 4, vx: R(-20, 20), vy: R(-40, -10), g: -5, drag: .8, max: R(1, 2), s: R(1.5, 3), col: [255, 190, 240] });
    return s.sound;
  }
  function land(x, y, impact) {
    const s = surfAt(x, y + 2), big = impact > 900;
    const cnt = clamp(impact / 70, 4, 18);
    for (let i = 0; i < n(cnt); i++) {
      const dir = i % 2 ? 1 : -1;
      add({ t: 'dust', x: x + dir * R(2, 12), y: y - 2, vx: dir * R(40, 190) * (impact / 900), vy: R(-50, -5), g: 30, drag: 3, max: R(.45, .9), s: R(3, 6), s1: R(8, 16), col: s.dust, a: .5 });
    }
    if (s.grains) for (let i = 0; i < n(cnt * .8); i++) add({ t: 'grain', x: x + R(-8, 8), y: y - 2, vx: R(-160, 160), vy: R(-220, -60), g: 900, max: R(.4, .8), s: R(1, 2.2), col: s.chip });
    if (s.drops) for (let i = 0; i < n(cnt); i++) add({ t: 'drop', x: x + R(-8, 8), y: y - 2, vx: R(-150, 150), vy: R(-260, -80), g: 900, max: R(.4, .7), s: R(1.4, 2.6), col: [210, 240, 255] });
    if (s.leaves) for (let i = 0; i < n(cnt * .3); i++) add({ t: 'leaf', x, y: y - 4, vx: R(-90, 90), vy: R(-160, -60), g: 240, drag: 1.4, max: R(.7, 1.3), s: R(2, 3.5), col: pick(s.leaves), rot: R(0, TAU), vr: R(-12, 12) });
    if (s.spores) for (let i = 0; i < n(cnt * .6); i++) add({ t: 'spore', x: x + R(-10, 10), y: y - 4, vx: R(-60, 60), vy: R(-90, -20), g: -6, drag: .9, max: R(1.2, 2.4), s: R(1.5, 3.2), col: [255, 190, 240] });
    if (big) { debris(x, y - 4, s.chip, n(4), 260, .7); ring(x, y, s.dust, 70, .4, true); decal(x, y, 'crack', 26); }
    return s.sound;
  }
  /* impacto fuerte contra el suelo (golpe sísmico, puñetazo del titán, meteoro) */
  function slam(x, y, power, col) {
    const s = surfAt(x, y + 2), dcol = col || s.dust;
    for (let i = 0; i < n(18 * power); i++) {
      const a = R(-Math.PI, 0);
      add({ t: 'dust', x: x + R(-20, 20) * power, y: y - 4, vx: Math.cos(a) * R(80, 320) * power, vy: Math.sin(a) * R(30, 140) * power, g: 40, drag: 2.4, max: R(.7, 1.4), s: R(6, 12), s1: R(18, 34) * power, col: dcol, a: .55 });
    }
    debris(x, y - 6, s.chip, n(7 * power), 420 * power, 1);
    if (s.grains) for (let i = 0; i < n(26 * power); i++) add({ t: 'grain', x: x + R(-14, 14), y: y - 2, vx: R(-320, 320), vy: R(-420, -120), g: 950, max: R(.6, 1), s: R(1.2, 2.6), col: s.chip });
    if (s.embers) for (let i = 0; i < n(16 * power); i++) add({ t: 'ember', x: x + R(-20, 20), y: y - 4, vx: R(-200, 200), vy: R(-340, -80), g: 300, drag: .6, max: R(.8, 1.6), s: R(1.2, 2.8) });
    ring(x, y, [255, 255, 255], 120 * power, .45, true);
    ring(x, y, dcol, 200 * power, .7, true);
    decal(x, y, 'crack', 40 * power);
  }
  function debris(x, y, col, cnt, pow, life = 1) {
    for (let i = 0; i < cnt; i++) {
      if (DEB.length >= MAXD) DEB.shift();
      const sides = RI(4, 7), r = R(2.5, 6.5) * (pow > 300 ? 1.4 : 1), pts = [];
      for (let k = 0; k < sides; k++) { const a = k / sides * TAU + R(-.3, .3); pts.push([Math.cos(a) * r * R(.6, 1.2), Math.sin(a) * r * R(.6, 1.2)]); }
      DEB.push({ x: x + R(-6, 6), y, vx: R(-1, 1) * pow * .7, vy: -R(.4, 1) * pow, rot: R(0, TAU), vr: R(-14, 14), pts, r, col: mixc(col, [0, 0, 0], R(0, .25)), life: 0, max: R(3, 5.5) * life, rest: false, glow: col === 'ember' });
    }
  }
  function chunks(x, y, col, cnt, pow, size = 1) {
    for (let i = 0; i < cnt; i++) {
      if (DEB.length >= MAXD) DEB.shift();
      const sides = RI(3, 6), r = R(4, 10) * size, pts = [];
      for (let k = 0; k < sides; k++) { const a = k / sides * TAU + R(-.4, .4); pts.push([Math.cos(a) * r * R(.5, 1.2), Math.sin(a) * r * R(.5, 1.2)]); }
      DEB.push({ x: x + R(-10, 10) * size, y: y + R(-10, 10) * size, vx: R(-1, 1) * pow, vy: -R(.3, 1.1) * pow, rot: R(0, TAU), vr: R(-10, 10), pts, r, col: mixc(col, [255, 255, 255], R(0, .15)), life: 0, max: R(4, 7), rest: false });
    }
  }
  function sparks(x, y, col, cnt, dir = 0, spd = 300) {
    for (let i = 0; i < n(cnt); i++) {
      const a = dir ? (dir > 0 ? 0 : Math.PI) + R(-1, 1) : R(0, TAU), v = R(.4, 1) * spd;
      add({ t: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 600, drag: 2.5, max: R(.18, .4), s: R(1.2, 2.4), col, add: 1 });
    }
  }
  function hit(x, y, dir, col = [255, 240, 200], big = false) {
    sparks(x, y, col, big ? 16 : 9, dir, big ? 520 : 360);
    add({ t: 'flash', x, y, max: .12, s: big ? 46 : 30, col, add: 1 });
    add({ t: 'slash', x, y, ang: R(-.6, .6) + (dir < 0 ? Math.PI : 0), max: .16, s: big ? 60 : 40, col, add: 1 });
  }
  function ring(x, y, col, r, life = .4, flat = false, add_ = 1) { RINGS.push({ x, y, col, r, life: 0, max: life, flat, add: add_ }); }
  function smoke(x, y, cnt = 4, col = [70, 66, 70], s = 10) { for (let i = 0; i < n(cnt); i++) add({ t: 'smoke', x: x + R(-6, 6), y: y + R(-6, 6), vx: R(-20, 20), vy: R(-50, -20), g: -10, drag: .8, max: R(1, 2), s, s1: s * 3, col, a: .4 }); }
  function embers(x, y, cnt = 6, spd = 120) { for (let i = 0; i < n(cnt); i++) add({ t: 'ember', x: x + R(-6, 6), y: y + R(-6, 6), vx: R(-1, 1) * spd, vy: -R(.4, 1.2) * spd, g: -30, drag: .8, max: R(.8, 1.8), s: R(1, 2.6) }); }
  function splash(x, y, kind, power = 1) {
    const col = kind === 'lava' ? [255, 170, 60] : [210, 240, 255];
    for (let i = 0; i < n(16 * power); i++) add({ t: kind === 'lava' ? 'ldrop' : 'drop', x: x + R(-10, 10), y, vx: R(-180, 180) * power, vy: -R(150, 480) * power, g: 950, max: R(.5, 1), s: R(1.5, 3.5), col, add: kind === 'lava' ? 1 : 0 });
    ring(x, y, col, 60 * power, .5, true);
  }
  function runeBurst(x, y, col = [140, 230, 255], cnt = 10) {
    for (let i = 0; i < n(cnt); i++) { const a = i / cnt * TAU; add({ t: 'rune', x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 * .5, g: 0, drag: 3, max: .55, s: R(5, 8), col, add: 1, ch: pick(['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛃ', 'ᛇ', 'ᛉ', 'ᛊ', 'A', 'E', 'I', 'O']), rot: R(-.4, .4) }); }
    ring(x, y, col, 50, .35, true);
  }
  function celebrate(x, y) {
    // efecto de respuesta correcta: lluvia de chispas doradas, runas y estrellas
    for (let i = 0; i < n(36); i++) { const a = R(0, TAU), v = R(120, 520); add({ t: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 380, drag: 1.4, max: R(.8, 1.5), s: R(3, 7), col: pick([[255, 230, 120], [255, 255, 255], [140, 230, 255], [255, 170, 80]]), rot: R(0, TAU), vr: R(-8, 8), add: 1 }); }
    runeBurst(x, y, [255, 225, 130], 14);
    ring(x, y, [255, 230, 140], 160, .6);
    ring(x, y, [255, 255, 255], 90, .35);
  }
  function text(x, y, str, col = '#fff', size = 46, opt = {}) { TXT.push({ x, y, str, col, size, life: 0, max: opt.max || .9, vy: opt.vy ?? -40, rot: opt.rot ?? R(-.12, .12), stroke: opt.stroke || '#1a0f14', comic: opt.comic !== false }); }
  function decal(x, y, type, size, o) { if (DEC.length > 70) DEC.shift(); DEC.push(Object.assign({ x, y, type, size, life: 0, max: type === 'wet' ? 4 : 9, seed: RI(1, 1e6) }, o)); }
  function leaves(x, y, cnt, cols) { for (let i = 0; i < n(cnt); i++) add({ t: 'leaf', x: x + R(-14, 14), y: y + R(-14, 4), vx: R(-80, 80), vy: R(-140, -20), g: 160, drag: 1.4, max: R(1, 2), s: R(2.2, 4), col: pick(cols), rot: R(0, TAU), vr: R(-10, 10) }); }
  function afterimage(snap) { add({ t: 'ghost', x: snap.x, y: snap.y, max: .28, snap }); }
  function trail(x, y, col, s = 3) { add({ t: 'trail', x, y, vx: 0, vy: 0, g: 0, max: .3, s, col, add: 1 }); }
  function spawnRaw(o) { return add(o); }

  /* ---------- actualización ---------- */
  function update(dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt; if (p.life >= p.max) { P.splice(i, 1); continue; }
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      p.vy = (p.vy || 0) + (p.g || 0) * dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.vr) p.rot += p.vr * dt;
      if (p.t === 'leaf') p.vx += Math.sin(p.life * 4 + p.rot) * 60 * dt;
      if ((p.t === 'grain' || p.t === 'drop' || p.t === 'leaf' || p.t === 'ldrop') && world && p.vy > 0) {
        const gy = world.floorAt(p.x, p.y - 4);
        if (p.y >= gy) {
          if (p.t === 'leaf') { p.y = gy - 1; p.vx = p.vy = 0; p.g = 0; p.vr = 0; p.max = Math.min(p.max, p.life + 2.5); }
          else if (p.t === 'grain') { p.y = gy - 1; p.vy *= -.25; p.vx *= .5; if (Math.abs(p.vy) < 30) { p.g = 0; p.vy = 0; p.vx = 0; p.max = Math.min(p.max, p.life + .8); } }
          else {
            // la gota choca: salpica en gotitas más pequeñas y deja una mancha húmeda
            if (p.t === 'drop' && !p.kid && p.s > 1.1 && P.length < MAXP - 4) {
              for (let k = 0; k < 2; k++) add({ t: 'drop', kid: 1, x: p.x, y: gy - 2, vx: R(-70, 70) + p.vx * .2, vy: -R(60, 140), g: 900, max: .3, s: p.s * .5, col: p.col });
              if (chance(.3)) decal(p.x, gy, 'wet', p.s * 3);
            }
            if (p.t === 'drop' && HOOK.drop) HOOK.drop(p.x, gy, p.s, p);
            P.splice(i, 1); continue;
          }
        }
      }
    }
    for (let i = DEB.length - 1; i >= 0; i--) {
      const d = DEB[i]; d.life += dt; if (d.life >= d.max) { DEB.splice(i, 1); continue; }
      if (d.rest) continue;
      d.vy += 1300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
      if (world) {
        const gy = world.floorAt(d.x, d.y - d.r - 6);
        if (d.y + d.r * .6 >= gy && d.vy > 0) {
          d.y = gy - d.r * .6;
          if (d.vy > 140) { d.vy *= -.38; d.vx *= .62; d.vr *= .6; if (chance(.4)) add({ t: 'dust', x: d.x, y: gy - 1, vx: R(-20, 20), vy: -10, g: 0, drag: 3, max: .4, s: 2, s1: 6, col: [170, 160, 150], a: .3 }); }
          else { d.vy = 0; d.vx *= .82; d.vr = d.vx * .08; if (Math.abs(d.vx) < 8) { d.rest = true; d.vx = 0; d.vr = 0; } }
        }
        if (world.liquidAt(d.x, d.y)) { DEB.splice(i, 1); continue; }
        const w = world.wallHit(d.x, d.y, d.vx); if (w) { d.vx *= -.4; }
      }
    }
    for (let i = TXT.length - 1; i >= 0; i--) { const t = TXT[i]; t.life += dt; t.y += t.vy * dt; t.vy *= Math.exp(-3 * dt); if (t.life >= t.max) TXT.splice(i, 1); }
    for (let i = RINGS.length - 1; i >= 0; i--) { const r = RINGS[i]; r.life += dt; if (r.life >= r.max) RINGS.splice(i, 1); }
    for (let i = DEC.length - 1; i >= 0; i--) { const d = DEC[i]; d.life += dt; if (d.life >= d.max) DEC.splice(i, 1); }
  }

  /* ---------- dibujo ---------- */
  function drawDecals(g) {
    for (const d of DEC) {
      const a = 1 - sstep(d.max * .6, d.max, d.life); const r = mulberry32(d.seed);
      g.globalAlpha = a * .7;
      if (d.type === 'crack') {
        g.strokeStyle = 'rgba(20,14,12,.75)'; g.lineWidth = 2; g.lineCap = 'round';
        for (let k = 0; k < 5; k++) { let x = d.x, y = d.y; const dir = k % 2 ? 1 : -1; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += dir * R(4, 10) * d.size / 30; y += R(-1, 3); g.lineTo(x, y); } g.stroke(); }
      } else if (d.type === 'wet') {
        g.fillStyle = 'rgba(20,30,40,.35)'; g.beginPath(); g.ellipse(d.x, d.y + 1, d.size, d.size * .28, 0, 0, TAU); g.fill();
      } else if (d.type === 'print') {
        g.fillStyle = d.col || 'rgba(60,40,30,.32)'; g.save(); g.translate(d.x, d.y + 1); g.scale(d.size, 1);
        g.beginPath(); g.ellipse(0, 0, 4.6, 1.5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-5.6, 0, 2.2, 1.2, 0, 0, TAU); g.fill(); g.restore();
      } else if (d.type === 'scorch') {
        const rg = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size); rg.addColorStop(0, 'rgba(20,10,8,.8)'); rg.addColorStop(1, 'rgba(20,10,8,0)');
        g.fillStyle = rg; g.beginPath(); g.ellipse(d.x, d.y, d.size, d.size * .3, 0, 0, TAU); g.fill();
      }
      r();
    }
    g.globalAlpha = 1;
  }
  function drawDebris(g) {
    for (const d of DEB) {
      const a = 1 - sstep(d.max - .6, d.max, d.life);
      g.globalAlpha = a; g.save(); g.translate(d.x, d.y); g.rotate(d.rot);
      g.fillStyle = rgba(d.col); g.beginPath(); g.moveTo(d.pts[0][0], d.pts[0][1]); for (const p of d.pts) g.lineTo(p[0], p[1]); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(d.pts[0][0], d.pts[0][1]); g.lineTo(d.pts[1][0], d.pts[1][1]); g.lineTo(0, 0); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
  }
  function drawNormal(g) {
    for (const p of P) {
      if (p.add) continue;
      const k = p.life / p.max, a = (p.a ?? 1) * (1 - k);
      if (p.t === 'dust' || p.t === 'smoke') {
        const s = lerp(p.s, p.s1 || p.s, easeOut(k)); g.globalAlpha = a * (p.t === 'smoke' ? Math.sin(k * Math.PI) * 1.3 : 1);
        g.fillStyle = rgba(p.col); g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.fill();
      } else if (p.t === 'grain') { g.globalAlpha = 1 - k * k; g.fillStyle = rgba(p.col); g.fillRect(p.x, p.y, p.s, p.s); }
      else if (p.t === 'drop') { g.globalAlpha = .9 * (1 - k); g.fillStyle = rgba(p.col); g.beginPath(); g.ellipse(p.x, p.y, p.s * .8, p.s * 1.3, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, TAU); g.fill(); }
      else if (p.t === 'leaf') { g.globalAlpha = Math.min(1, (p.max - p.life) * 2); g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = rgba(p.col); g.beginPath(); g.ellipse(0, 0, p.s * 1.6, p.s * .7, 0, 0, TAU); g.fill(); g.restore(); }
      else if (p.t === 'ghost') { g.globalAlpha = .45 * (1 - k); if (p.snap && p.snap.draw) p.snap.draw(g, p.snap, 1 - k); }
      else if (p.t === 'spore') { g.globalAlpha = .7 * Math.sin(k * Math.PI); g.fillStyle = rgba(p.col); g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  function drawAdditive(g) {
    g.globalCompositeOperation = 'lighter';
    for (const p of P) {
      const k = p.life / p.max;
      if (p.t === 'ember') { const a = (1 - k) * Math.min(1, p.life * 5), s = p.s * 6; glowAt(g, [255, 120, 40], p.x, p.y, s, a * .7); g.globalAlpha = a; g.fillStyle = '#ffe0a0'; g.fillRect(p.x - p.s * .4, p.y - p.s * .4, p.s * .8, p.s * .8); }
      else if (p.t === 'spark') { g.globalAlpha = 1 - k; g.strokeStyle = rgba(p.col); g.lineWidth = p.s; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); g.stroke(); }
      else if (p.t === 'ldrop') { glowAt(g, [255, 140, 40], p.x, p.y, p.s * 4, (1 - k) * .8); g.globalAlpha = 1 - k; g.fillStyle = '#ffd890'; g.beginPath(); g.arc(p.x, p.y, p.s * .7, 0, TAU); g.fill(); }
      else if (p.t === 'flash') { glowAt(g, p.col, p.x, p.y, p.s * (1 + k), (1 - k) * 1.1); }
      else if (p.t === 'slash') { g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.globalAlpha = 1 - k; g.fillStyle = rgba(p.col); g.beginPath(); g.ellipse(0, 0, p.s * (.6 + k), 2.5 * (1 - k) + .5, 0, 0, TAU); g.fill(); g.restore(); }
      else if (p.t === 'rune') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = 1 - k; g.fillStyle = rgba(p.col); g.font = `${p.s * 2.4 | 0}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.ch, 0, 0); g.restore(); }
      else if (p.t === 'star') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = 1 - k; g.fillStyle = rgba(p.col); g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? p.s * .35 : p.s; const a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
      else if (p.t === 'trail') { glowAt(g, p.col, p.x, p.y, p.s * 3, (1 - k) * .5); }
      else if (p.t === 'mote') { g.globalAlpha = .55 * Math.sin(k * Math.PI); g.fillStyle = '#fff6d8'; g.fillRect(p.x, p.y, p.s, p.s); }
      else if (p.t === 'firefly') { glowAt(g, p.col, p.x, p.y, 8, Math.max(0, Math.sin(p.life * 3 + p.s)) * .9); }
    }
    for (const r of RINGS) {
      const k = r.life / r.max, rr = r.r * easeOut(k);
      g.globalAlpha = (1 - k) * .8; g.strokeStyle = rgba(r.col); g.lineWidth = 4 * (1 - k) + 1;
      g.beginPath(); if (r.flat) g.ellipse(r.x, r.y, rr, rr * .22, 0, 0, TAU); else g.arc(r.x, r.y, rr, 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function drawText(g) {
    for (const t of TXT) {
      const k = t.life / t.max, pop = k < .15 ? easeOutBack(k / .15) : 1, a = 1 - sstep(.7, 1, k);
      g.save(); g.translate(t.x, t.y); g.rotate(t.rot); g.scale(pop, pop); g.globalAlpha = a;
      g.font = `${t.size}px ${t.comic ? '"Bangers", "Impact", sans-serif' : '"Alegreya Sans", sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = t.size * .16; g.strokeStyle = t.stroke; g.strokeText(t.str, 0, 0);
      g.fillStyle = t.col; g.fillText(t.str, 0, 0);
      g.restore();
    }
    g.globalAlpha = 1;
  }
  function lightsInto(fn) { for (const p of P) { if (p.t === 'ember' || p.t === 'ldrop') fn(p.x, p.y, 40, [255, 130, 40], .25); } }
  return { HOOK, parts: P, debrisList: DEB, setWorld, setReduced, footstep, land, slam, debris, chunks, sparks, hit, ring, smoke, embers, splash, runeBurst, celebrate, text, decal, leaves, afterimage, trail, spawnRaw, update, drawDecals, drawDebris, drawNormal, drawAdditive, drawText, lightsInto, get count() { return P.length; }, set quality(v) { quality = v; } };
})();
