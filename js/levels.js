"use strict";
/* =====================================================================
   NIVELES — constructor + guiones de cada nivel.
   Cada nivel mezcla biomas, tiene rutas alternativas, secretos, cofres,
   4 letras doradas (forman una palabra inglesa), puertas rúnicas (inglés),
   santuarios, una Runa del Asombro, mini-jefe y jefe final.
   ===================================================================== */
class LB {
  constructor(seed) {
    seedRNG(seed); this.x = 0; this.y = 560; this.seg = null;
    this.out = { ground: [], ceils: [], solids: [], plats: [], liquids: [], zones: [], staticDecor: [], objects: [], enemies: [], props: [], ropes: [], bridges: [], flags: [], winds: [], arenas: [], lights: [], hazards: [], lavafalls: [], decorSpec: [], bounds: null };
    this.mat = 'sand'; this.cover = 'sand'; this.surf = null; this.biomeName = 'beach'; this.ceil = null;
  }
  biome(name, mat, cover) { this.out.zones.push({ x: this.x, biome: name }); this.biomeName = name; if (mat) this.material(mat, cover); return this; }
  material(mat, cover = null) { if (this.seg && this.seg.mat !== mat) { this.closeSeg(false); this.startSeg(); } this.mat = mat; this.cover = cover; if (this.seg) { this.seg.mat = mat; this.seg.cover = cover; } return this; }
  startSeg(lipL = false) { this.seg = { x0: this.x, x1: this.x, step: 8, pts: [this.y], mat: this.mat, cover: this.cover, lipL }; }
  closeSeg(lipR = true) { if (!this.seg) return; this.seg.x1 = this.x; this.seg.lipR = lipR; if (this.seg.x1 - this.seg.x0 >= 8) this.out.ground.push(this.seg); this.seg = null; }
  run(len, dy = 0, rough = 6) {
    if (!this.seg) this.startSeg(true);
    const y0 = this.y, n = Math.round(len / 8), s = this.seg;
    for (let i = 1; i <= n; i++) { const t = i / n, x = this.x + i * 8; s.pts.push(y0 + dy * sm(t) + (fbm1(x * .013 + this.x * .001) - .5) * rough * 2 * Math.sin(t * Math.PI) ** .3); }
    this.x += n * 8; this.y = y0 + dy; s.x1 = this.x; return this;
  }
  step(dy) { this.closeSeg(false); this.y += dy; this.startSeg(false); return this; }
  gap(len, liquid) {
    const lipR = true; this.closeSeg(lipR); const x0 = this.x; this.x += len;
    if (liquid) this.out.liquids.push(Object.assign({ x0: x0, x1: this.x, level: this.y + (liquid.drop ?? 30), bottom: this.y + 400, type: liquid.type || 'water' }, liquid));
    if (liquid && liquid.floor) { const n = Math.round(len / 8) + 1, pts = []; for (let i = 0; i < n; i++) pts.push(this.y + liquid.floor + (fbm1((x0 + i * 8) * .02) - .5) * 30); this.out.ground.push({ x0, x1: this.x, step: 8, pts, mat: this.mat, cover: null, lipL: false, lipR: false, seabed: true }); }
    this.startSeg(true); if (liquid && liquid.toY !== undefined) { this.y = liquid.toY; this.seg.pts = [this.y]; }
    return this;
  }
  ground() { return this.y; }
  at(dx) { return this.x + dx; }
  /* geometría extra */
  solid(x, y, w, h, mat, o = {}) { const s = Object.assign({ x, y, w, h, mat: mat || this.mat, solid: true, cover: o.cover !== undefined ? o.cover : this.cover }, o); this.out.solids.push(s); return s; }
  plat(x, y, w, o = {}) { const p = Object.assign({ x, y, w, h: 24, mat: this.mat, cover: this.cover, style: 'island' }, o); if (p.sink) { p.baseY = y; p.sink = 0; } if (p.soft) { p.baseY = y; } this.out.plats.push(p); return p; }
  move(x, y, w, x1, y1, period, o = {}) { return this.plat(x, y, w, Object.assign({ path: { x0: x, y0: y, x1, y1, period, phase: o.phase || 0 }, dynamic: true, style: 'island' }, o)); }
  ceiling(x0, x1, height, mat, o = {}) {
    const step = 8, pts = [], stal = [];
    for (let x = x0; x <= x1 + step; x += step) { const gy = this._groundAt(x) ?? this.y; const edge = Math.min(1, (x - x0) / 160, (x1 - x) / 160); pts.push(gy - height - (1 - Math.max(0, edge)) * 500 + (fbm1(x * .01 + 40) - .5) * 70); }
    for (let x = x0 + 60; x < x1 - 60; x += R(40, 110)) stal.push({ x, w: R(16, 46), h: R(24, 110), seed: RI(1, 9999) });
    this.out.ceils.push({ x0, x1, step, pts, mat: mat || this.mat, stal }); return this;
  }
  _groundAt(x) { for (const s of this.out.ground) if (x >= s.x0 && x <= s.x1) { const f = (x - s.x0) / s.step, i = Math.min(s.pts.length - 1, Math.floor(f)); return s.pts[i]; } if (this.seg && x >= this.seg.x0) { const f = (x - this.seg.x0) / 8, i = Math.min(this.seg.pts.length - 1, Math.floor(f)); return this.seg.pts[i]; } return null; }
  liquid(x0, x1, level, type, o = {}) { this.out.liquids.push(Object.assign({ x0, x1, level, bottom: level + 500, type }, o)); return this; }
  /* objetos */
  obj(type, x, y, o = {}) { const ob = Object.assign({ type, x, y }, o); this.out.objects.push(ob); return ob; }
  enemy(type, x, y, o = {}) { this.out.enemies.push(Object.assign({ type, x, y: y ?? this._groundAt(x) ?? this.y }, o)); return this; }
  prop(type, x, y, o = {}) { this.out.props.push(Object.assign({ type, x, y: y ?? (this._groundAt(x) ?? this.y) }, o)); return this; }
  coins(x, y, n, arc = 0, dx = 34) { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : .5; this.obj('coin', x + i * dx, y - Math.sin(t * Math.PI) * arc); } return this; }
  sign(x, text) { this.out.objects.push({ type: 'sign', x, y: this._groundAt(x) ?? this.y, text }); return this; }
  deco(t, x, y, o = {}) { this.out.staticDecor.push(Object.assign({ t, x, y: y ?? this._groundAt(x) ?? this.y, seed: RI(1, 99999) }, o)); return this; }
  rope(x, y, len, o = {}) { this.out.ropes.push(Object.assign({ x, y, len }, o)); return this; }
  bridge(x0, x1, y) { this.out.bridges.push({ x0, x1, y }); return this; }
  wind(x0, x1, y0, y1, force) { this.out.winds.push({ x0, x1, y0, y1, force }); return this; }
  arena(x0, x1, waves, o = {}) { this.out.arenas.push(Object.assign({ x0, x1, waves, done: false }, o)); return this; }
  finish(w) {
    this.closeSeg(true);
    const ys = [];
    for (const s of this.out.ground) for (const p of s.pts) ys.push(p);
    for (const s of this.out.solids) ys.push(s.y); for (const p of this.out.plats) ys.push(p.y, p.path ? p.path.y1 : p.y);
    const minY = Math.min(...ys) - 380, maxY = Math.max(560, ...this.out.ground.map(s => Math.max(...s.pts))) + 160;
    this.out.bounds = { x0: 0, x1: w || this.x, y0: Math.min(minY, -100), y1: maxY };
    return this.out;
  }
}

/* ---------- población automática de decoración ---------- */
function populateDecor(def, world) {
  const D = { grass: [], flowers: [], palms: [], seaweed: [], mushrooms: [], vines: [], fireflies: [] };
  const r = mulberry32(77);
  for (const s of def.ground) {
    for (let x = s.x0 + 6; x < s.x1 - 6; x += 2.4) {
      const z = world.biomeAt(x), b = BIOMES[z.t > .5 ? z.b : z.a], y = world.groundY(x);
      if (!isFinite(y)) continue;
      const cov = s.cover;
      const dens = cov === 'grass' ? .75 : cov === 'darkgrass' ? .6 : cov === 'moss' ? .45 : cov === 'sand' ? .1 : cov === 'wet' ? .08 : cov === 'ash' ? .04 : 0;
      if (r() < dens) D.grass.push({ x, y: y + 2, h: R(8, 22) * (cov === 'sand' ? .8 : 1), lean: R(-.25, .25), w: R(1.2, 1.9), c: (r() * 3) | 0, cols: b.grass });
    }
    for (let x = s.x0 + 30; x < s.x1 - 30; x += R(40, 120)) {
      const z = world.biomeAt(x), bk = z.t > .5 ? z.b : z.a, y = world.groundY(x); if (!isFinite(y)) continue;
      if ((bk === 'beach') && r() < .14 && s.cover === 'sand') D.palms.push({ x, y: y + 4, h: R(150, 230), s: R(.85, 1.15), lean: R(-.25, .25), curve: R(-.5, .5), ph: R(0, 9) });
      if ((bk === 'beach') && r() < .4) def.staticDecor.push(r() < .7 ? { t: 'shell', x, y: y + 1, s: R(.6, 1), c: pick([[255, 220, 200], [240, 190, 210], [250, 240, 220]]), a: R(-.4, .4) } : { t: 'star', x, y: y + 1, s: R(.7, 1), a: R(0, 6) });
      if ((bk === 'cliff' || bk === 'forest' || bk === 'ruins') && r() < .45) D.flowers.push({ x, y: y + 2, h: R(12, 26), ph: R(0, 9), c: pick([[255, 120, 160], [255, 220, 100], [180, 140, 255], [255, 255, 255]]) });
      if ((bk === 'forest') && r() < .35) def.staticDecor.push({ t: 'fern', x, y: y + 4, s: R(.6, 1.1), flip: r() < .5, cols: ['#2c4c25', '#3f6b30'] });
      if ((bk === 'mushroom' || bk === 'cave') && r() < .5) D.mushrooms.push({ x, y: y + 2, s: R(.6, 1.3), ph: R(0, 9), fl: r() < .5, col: bk === 'cave' ? [110, 230, 255] : pick([[90, 240, 220], [230, 120, 255], [255, 140, 220]]) });
      if ((bk === 'tidecave') && r() < .45) D.seaweed.push({ x, y: y + 3, h: R(20, 60), w: R(3, 6), ph: R(0, 9), col: pick(['#2f7a5a', '#3f9a6e', '#5ab08a']) });
      if ((bk === 'tidecave' || bk === 'cave') && r() < .16) { def.staticDecor.push({ t: 'crystal', x, y: y + 4, n: RI(3, 6), s: R(20, 40), c: bk === 'cave' ? pick([[170, 120, 255], [110, 220, 255]]) : [110, 240, 230], dir: -1, seed: RI(1, 9999) }); def.lights.push({ x, y: y - 20, r: 150, c: bk === 'cave' ? [170, 130, 255] : [110, 240, 230], i: .6, pulse: 1, ph: x }); }
      if ((bk === 'lava' || bk === 'core') && r() < .12) def.staticDecor.push({ t: r() < .5 ? 'bones' : 'pebbles', x, y: y + 2, n: 4, c: [70, 60, 60] });
      if ((bk === 'ruins') && r() < .12) def.staticDecor.push({ t: 'column', x, y: y + 4, w: R(26, 40), h: R(40, 110), broken: 1 });
      if (r() < .1 && bk !== 'lava') def.staticDecor.push({ t: 'pebbles', x, y: y + 2, n: RI(2, 5), c: [150, 140, 130] });
    }
  }
  for (const c of def.ceils) for (let x = c.x0 + 40; x < c.x1 - 40; x += R(30, 110)) {
    const z = world.biomeAt(x), bk = z.t > .5 ? z.b : z.a, y = world.ceilY(x);
    if (r() < .5) D.vines.push({ x, y: y - 4, len: R(40, 200), ph: R(0, 9), th: R(1.5, 3.2), leafy: bk !== 'lava' && bk !== 'cave', col: bk === 'lava' ? '#3a2420' : '#26321e', flower: bk === 'tidecave' && r() < .3 ? '#7af0e0' : null });
    if ((bk === 'cave' || bk === 'tidecave') && r() < .12) { def.staticDecor.push({ t: 'crystal', x, y: y - 2, n: RI(3, 5), s: R(18, 34), c: [150, 200, 255], dir: 1, seed: RI(1, 9999) }); def.lights.push({ x, y: y + 20, r: 140, c: [150, 200, 255], i: .55, pulse: 1, ph: x }); }
  }
  for (const s of def.solids) if (s.cover === 'grass' || s.cover === 'moss') for (let x = s.x + 4; x < s.x + s.w - 4; x += 3) if (r() < .6) D.grass.push({ x, y: s.y + 2, h: R(8, 18), lean: R(-.25, .25), w: 1.5, c: (r() * 3) | 0, cols: BIOMES[world.biomeAt(x).a].grass });
  return D;
}

/* ===================================================================
   NIVEL 1 — COSTA CORAL  (playa → gruta de las mareas → acantilado al ocaso → playa del jefe)
   =================================================================== */
function buildCosta() {
  const b = new LB(101); const G = () => b.y;
  b.biome('beach', 'sand', 'sand');
  b.run(420, 0, 4); b.sign(150, '← → / stick: moverse');
  b.sign(330, '✕ / Espacio: saltar');
  b.obj('checkpoint', 60, G(), { first: true });
  b.run(260, -10); b.enemy('crab', b.at(-120)); b.coins(b.at(-200), G() - 60, 5, 30);
  b.sign(b.at(-40), '□ / J: atacar');
  b.prop('barrel', b.at(-10)); b.prop('crate', b.at(26));
  b.run(300, -30); b.prop('pot', b.at(-60));
  // charca con tronco flotante
  b.gap(180, { type: 'water', drop: 26 }); b.prop('log', b.at(-90), G() + 20);
  b.run(200, 0); b.sign(b.at(-150), '✕ en el aire: DOBLE SALTO');
  // roca alta: hace falta doble salto
  const rockX = b.x; b.solid(rockX, G() - 175, 220, 175, 'sandstone', { cover: 'sand' }); b.coins(rockX + 30, G() - 230, 5, 0);
  b.run(220, 0);
  b.obj('chest', rockX + 180, G() - 175, { tier: 'wood' });
  b.run(260, 0); b.enemy('jelly', b.at(-120), G() - 150); b.enemy('jelly', b.at(-20), G() - 210);
  b.sign(b.at(-200), '↓ + □ en el aire: rebota sobre enemigos');
  b.run(200, 20);
  b.obj('checkpoint', b.at(-80), G());
  b.sign(b.at(-20), '○ / K: esquivar (invulnerable)');
  b.run(160, 0);
  b.obj('gate', b.at(-40), G(), { format: 'choice', label: 'Puerta rúnica' });
  b.sign(b.at(-110), '△ / E: abrir con inglés');
  // ARENA 1 con ruta alta secreta por encima
  const a1 = b.x; b.run(760, 0, 3);
  b.arena(a1 + 40, a1 + 740, [[['crab', a1 + 520], ['crab', a1 + 640]], [['gull', a1 + 300, G() - 260], ['gull', a1 + 600, G() - 280], ['crab', a1 + 200]]]);
  b.sign(a1 + 80, 'R1 / L: bloquear · ¡justo a tiempo = PARADA!');
  b.plat(a1 + 120, G() - 150, 90, { mat: 'coral', cover: null }); b.plat(a1 + 300, G() - 270, 80, { mat: 'coral', cover: null }); b.plat(a1 + 470, G() - 380, 100, { mat: 'coral', cover: null });
  b.plat(a1 + 640, G() - 420, 160, { mat: 'sandstone', cover: 'sand' });
  b.obj('letter', a1 + 700, G() - 470, { ch: 'W' }); b.obj('chest', a1 + 760, G() - 420, { tier: 'silver' }); b.coins(a1 + 480, G() - 430, 4, 20);
  b.run(220, 0); b.prop('barrel', b.at(-120)); b.prop('barrel', b.at(-90)); b.prop('coconut', b.at(-40));
  b.obj('shrine', b.at(-170), G());
  // ===== GRUTA DE LAS MAREAS =====
  b.biome('tidecave', 'wetrock', 'wet');
  const caveStart = b.x;
  b.run(300, 10); b.sign(b.at(-200), 'R2 / U: PALABRA DE PODER (cuando brille la barra dorada)');
  b.gap(240, { type: 'water', drop: 24 }); b.enemy('eel', b.at(-120), G() + 24, { water: G() + 24 }); b.prop('log', b.at(-150), G() + 10);
  b.run(260, 0); b.obj('hazard_stalactite', b.at(-180), null); b.obj('hazard_stalactite', b.at(-100), null); b.obj('hazard_stalactite', b.at(-30), null);
  b.run(200, 0); b.obj('checkpoint', b.at(-100), G()); b.obj('npc', b.at(-40), G(), { npc: 'mira' });
  // pozo de escalada con salto en pared (ruta ALTA) y túnel inundado (ruta BAJA)
  const shaftX = b.x;
  b.solid(shaftX + 180, G() - 690, 60, 560, 'wetrock', { cover: null });          // pared derecha del pozo
  b.solid(shaftX - 40, G() - 690, 40, 420, 'wetrock', { cover: null });          // pared izquierda
  b.sign(shaftX + 40, '¡Salta contra la pared para escalar!');
  b.solid(shaftX + 240, G() - 680, 1100, 380, 'wetrock', { cover: 'wet' });  // masa de roca: arriba ruta alta, abajo túnel
  b.coins(shaftX + 80, G() - 300, 1, 0); b.coins(shaftX + 120, G() - 420, 1, 0); b.coins(shaftX + 80, G() - 540, 1, 0);
  // ruta alta: arqueros, anillas de garfio sobre un abismo, letra A
  const up = G() - 680;
  b.enemy('archer', shaftX + 600, up); b.enemy('jelly', shaftX + 820, up - 140);
  b.obj('ring', shaftX + 1450, up - 160); b.obj('ring', shaftX + 1700, up - 180);
  b.sign(shaftX + 1250, 'L2 / G: GARFIO hacia las anillas');
  b.solid(shaftX + 1900, up, 420, 380, 'wetrock', { cover: 'wet' });
  b.obj('letter', shaftX + 2100, up - 60, { ch: 'A' }); b.enemy('archer', shaftX + 2250, up);
  b.obj('chest', shaftX + 2020, up, { tier: 'wood' });
  // ruta baja: túnel inundado con pared falsa → pescador con portal secreto
  b.run(480, 0);
  b.gap(520, { type: 'water', drop: 16, deep: true, floor: 260 }); b.enemy('eel', b.at(-380), G() + 16, { water: G() + 16 }); b.enemy('eel', b.at(-150), G() + 16, { water: G() + 16 });
  b.coins(b.at(-450), G() - 10, 8, 0, 50);
  b.obj('letter', b.at(-260), G() + 200, { ch: 'E' }); b.obj('chest', b.at(-120), G() + 260, { tier: 'silver' });
  b.run(380, 0);
  b.obj('fakewall', b.at(-120), G() - 160, { w: 60, h: 160, mat: 'wetrock' });
  b.obj('npc', b.at(-40), G(), { npc: 'bram', portal: 'perlas' });
  b.run(1000, 0);
  b.enemy('crab', b.at(-700)); b.enemy('urchin', b.at(-400)); b.enemy('crab', b.at(-200));
  b.ceiling(caveStart, shaftX - 50, 330, 'wetrock'); b.ceiling(shaftX - 50, b.x + 40, 1060, 'wetrock');
  b.obj('gate', b.at(-60), G(), { format: 'build', label: 'Puerta de las palabras' });
  const a2 = b.x; b.run(700, 0);
  b.arena(a2 + 20, a2 + 680, [[['archer', a2 + 600], ['crab', a2 + 420], ['jelly', a2 + 300, G() - 200]], [['urchin', a2 + 560], ['archer', a2 + 120], ['jelly', a2 + 500, G() - 220]]]);
  b.ceiling(a2 - 20, b.x + 200, 380, 'wetrock');
  // ===== ACANTILADO DEL OCASO =====
  b.biome('cliff', 'moss', 'grass');
  b.run(260, -40); b.obj('checkpoint', b.at(-120), G());
  // cuerdas sobre el abismo, colgando de un arco de roca
  const archX = b.x; b.gap(520);
  b.solid(archX - 60, G() - 430, 640, 70, 'sandstone', { cover: 'grass' });
  b.rope(archX + 140, G() - 360, 200, { grab: true, kind: 'rope', col: '#8a6a3a' }); b.rope(archX + 380, G() - 360, 200, { grab: true, kind: 'rope', col: '#8a6a3a' });
  b.sign(archX - 30, 'Agárrate a las cuerdas: ¡salta desde ellas con impulso!');
  b.coins(archX + 120, G() - 120, 7, 60, 50);
  b.run(260, 0);
  b.obj('flag', b.at(-40), G(), {});
  // puente colgante
  const brX = b.x; b.gap(380); b.bridge(brX, brX + 380, G());
  b.run(240, -30); b.enemy('gull', b.at(-100), G() - 200);
  // zona de viento con salientes que se desmoronan
  const wX = b.x; b.run(700, -60, 8); b.wind(wX, wX + 700, G() - 600, G() + 50, -900);
  b.sign(wX + 30, '¡Ráfagas de viento! Ojo con los salientes que se desmoronan');
  b.plat(wX + 160, G() - 140, 90, { crumble: true, mat: 'sandstone', cover: 'grass' }); b.plat(wX + 330, G() - 250, 90, { crumble: true, mat: 'sandstone', cover: 'grass' }); b.plat(wX + 520, G() - 330, 110, { crumble: true, mat: 'sandstone', cover: 'grass' });
  b.obj('chest', wX + 560, G() - 330, { tier: 'gold', lock: true });
  b.run(200, 0);
  // mini-jefe: Bruto Coralino
  const mb = b.x; b.run(760, 0, 2);
  b.arena(mb + 20, mb + 740, [[['brute', mb + 560, null, { name: 'Bruto Coralino', seal: [2, 3] }]]], { boss: true, name: 'Bruto Coralino' });
  b.run(200, 0); b.obj('checkpoint', b.at(-140), G()); b.obj('shrine', b.at(-60), G());
  // runa del asombro en un saliente alto con anémona saltarina
  b.obj('spring', b.at(40), G(), { power: 1250 });
  b.plat(b.at(-10), G() - 420, 140, { mat: 'sandstone', cover: 'grass' });
  b.obj('wonder', b.at(60), G() - 470, { effect: 'giant' });
  b.run(260, 0);
  b.obj('fakewall', b.at(-60), G() - 150, { w: 70, h: 150, mat: 'moss' });
  b.solid(b.at(-120), G() - 220, 40, 70, 'moss', { cover: 'grass' });
  b.obj('letter', b.at(-30), G() - 60, { ch: 'V' });
  b.run(240, 40);
  b.obj('gate', b.at(-80), G(), { format: 'type', label: 'Puerta del escriba' });
  // ===== JEFE: REY CANGREJO =====
  b.biome('beach', 'sand', 'sand');
  const bx = b.x; b.run(1300, 0, 2);
  b.plat(bx + 300, G() - 150, 120, { mat: 'sandstone', cover: 'sand' }); b.plat(bx + 900, G() - 150, 120, { mat: 'sandstone', cover: 'sand' });
  b.arena(bx + 40, bx + 1260, [], { bossType: 'crabking', floor: G() });
  b.run(400, 0); b.obj('exit', b.at(-200), G());
  return b.finish();
}

/* ===================================================================
   NIVEL 2 — BOSQUE SUSURRO  (bosque → arboleda lumínica → ruinas → santuario del tiempo)
   =================================================================== */
function buildBosque() {
  const b = new LB(202); const G = () => b.y;
  b.biome('forest', 'dirt', 'grass');
  b.run(500, 0); b.obj('checkpoint', 60, G(), { first: true });
  b.enemy('shroom', b.at(-150)); b.coins(b.at(-300), G() - 70, 5, 30);
  b.run(300, -40); b.enemy('wolf', b.at(-100));
  b.sign(b.at(-260), 'Lobo Sombra: espera el destello blanco y PARA (R1)');
  b.run(200, 0); b.obj('spring', b.at(-100), G(), { power: 1150, cap: true });
  b.plat(b.at(-200), G() - 360, 220, { mat: 'wood', cover: 'grass', style: 'log' });
  b.obj('letter', b.at(-80), G() - 410, { ch: 'L' }); b.obj('chest', b.at(-160), G() - 360, { tier: 'wood' });
  b.run(260, 0); b.prop('crate', b.at(-80), null, { contents: 'crystal' });
  b.gap(300); b.rope(b.at(-150), G() - 380, 240, { grab: true, leafy: true });
  b.run(260, 0); b.obj('checkpoint', b.at(-160), G()); b.obj('gate', b.at(-60), G(), { format: 'choice' });
  const a1 = b.x; b.run(760, 0);
  b.arena(a1 + 30, a1 + 740, [[['wolf', a1 + 600], ['shroom', a1 + 300]], [['beetle', a1 + 650], ['wolf', a1 + 100], ['shroom', a1 + 400]]]);
  b.plat(a1 + 200, G() - 180, 120, { mat: 'wood', style: 'log', cover: 'grass' }); b.plat(a1 + 460, G() - 180, 120, { mat: 'wood', style: 'log', cover: 'grass' });
  // ===== ARBOLEDA LUMÍNICA =====
  b.biome('mushroom', 'moss', 'darkgrass');
  const ms = b.x; b.run(260, 0);
  for (let i = 0; i < 4; i++) b.plat(ms + 300 + i * 230, G() - 120 - i * 70, 110, { soft: 'cap', mat: 'cap', cover: null, dynamic: true, bounce: 1050 });
  b.gap(980); b.run(220, -260);
  b.obj('letter', ms + 960, G() - 120, { ch: 'E' });
  b.enemy('shroom', b.at(-120)); b.obj('shrine', b.at(-60), G());
  b.run(300, 0); b.enemy('beetle', b.at(-100)); b.obj('checkpoint', b.at(-260), G());
  b.run(200, 260); // bajada
  b.sign(b.at(-150), 'Las nubes de esporas envenenan: ¡no te quedes dentro!');
  b.run(400, 0); b.enemy('shroom', b.at(-300)); b.enemy('shroom', b.at(-150)); b.enemy('wolf', b.at(-50));
  b.obj('fakewall', b.at(-20), G() - 140, { w: 60, h: 140, mat: 'moss' });
  b.run(120, 0); b.obj('chest', b.at(-60), G(), { tier: 'silver' }); b.obj('npc', b.at(-20), G(), { npc: 'lyra', portal: 'nubes' });
  b.solid(b.at(0), G() - 300, 60, 300, 'moss', { cover: 'darkgrass' });
  b.run(60, 0);
  // ===== RUINAS ANTIGUAS =====
  b.biome('ruins', 'brick', 'moss');
  const rs = b.x; b.run(200, 0);
  b.gap(600); b.move(rs + 260, G() - 60, 120, rs + 600, G() - 160, 4, { mat: 'brick', cover: 'moss', style: 'flat' });
  b.plat(rs + 300, G() - 300, 90, { crumble: true, mat: 'brick', cover: 'moss', style: 'flat' });
  b.obj('letter', rs + 340, G() - 350, { ch: 'A' });
  b.run(300, -80); b.enemy('archer', b.at(-80)); b.enemy('clockmage', b.at(-200), G() - 180);
  b.obj('gate', b.at(-260), G(), { format: 'build' });
  b.run(200, 0); b.obj('checkpoint', b.at(-100), G());
  b.solid(b.at(0), G() - 200, 200, 200, 'brick', { cover: 'moss' }); b.run(200, 0); b.step(-200); b.run(300, 0);
  b.enemy('archer', b.at(-60)); b.coins(b.at(-260), G() - 60, 5, 20);
  b.obj('hazard_spikes', b.at(20), G(), { w: 160 }); b.gap(220); b.run(320, 0);
  b.plat(b.at(-460), G() - 110, 120, { mat: 'brick', style: 'flat', cover: 'moss' });
  b.step(200); b.run(300, 0); b.enemy('beetle', b.at(-120)); b.enemy('clockmage', b.at(-60), G() - 200);
  b.obj('wonder', b.at(-200), G() - 260, { effect: 'lowgrav' }); b.plat(b.at(-260), G() - 210, 120, { mat: 'brick', style: 'flat', cover: 'moss' });
  // mini-jefe: Guardián de piedra (bruto gigante)
  const mb = b.x; b.run(700, 0);
  b.arena(mb + 20, mb + 680, [[['brute', mb + 500, null, { name: 'Gólem de las Ruinas', seal: [2, 3], hp: 320, maxHp: 320 }]]], { boss: true, name: 'Gólem de las Ruinas' });
  b.run(200, 0); b.obj('checkpoint', b.at(-100), G()); b.obj('shrine', b.at(-40), G());
  b.obj('letter', b.at(-170), G() - 220, { ch: 'F' }); b.plat(b.at(-210), G() - 170, 90, { mat: 'brick', style: 'flat', cover: 'moss' });
  b.obj('gate', b.at(-10), G(), { format: 'type' });
  // ===== SANTUARIO DEL TIEMPO (jefe) =====
  b.biome('clockwork', 'brick', 'moss');
  const bx = b.x; b.run(1300, 0, 1);
  b.plat(bx + 260, G() - 170, 140, { mat: 'brick', style: 'flat', cover: 'moss' }); b.plat(bx + 900, G() - 170, 140, { mat: 'brick', style: 'flat', cover: 'moss' });
  b.plat(bx + 560, G() - 300, 180, { mat: 'brick', style: 'flat', cover: 'moss' });
  b.arena(bx + 40, bx + 1260, [], { bossType: 'chrono', floor: G() });
  b.run(400, 0); b.obj('exit', b.at(-200), G());
  return b.finish();
}

/* ===================================================================
   NIVEL 3 — CUEVA ÍGNEA  (linde del bosque → cuevas de cristal → lava → corazón de magma)
   =================================================================== */
function buildIgnea() {
  const b = new LB(303); const G = () => b.y;
  b.biome('forest', 'dirt', 'grass');
  b.run(400, 0); b.obj('checkpoint', 60, G(), { first: true });
  b.run(200, 30);
  b.biome('cave', 'rock', null); const cs = b.x;
  b.run(500, 20); b.enemy('bat', b.at(-200), G() - 260); b.enemy('bat', b.at(-60), G() - 280);
  b.run(300, 0); b.obj('hazard_stalactite', b.at(-200)); b.obj('hazard_stalactite', b.at(-120));
  b.obj('gate', b.at(-40), G(), { format: 'choice' });
  b.run(400, -60); b.enemy('wolf', b.at(-200)); b.obj('chest', b.at(-60), G(), { tier: 'wood' });
  b.plat(b.at(-260), G() - 200, 100, { mat: 'crystal', cover: null }); b.obj('letter', b.at(-210), G() - 250, { ch: 'F' });
  b.run(200, 0); b.obj('checkpoint', b.at(-100), G());
  b.ceiling(cs, b.x + 60, 360, 'rock');
  // ===== LAVA =====
  b.biome('lava', 'basalt', 'ash');
  const ls = b.x; b.run(300, 20);
  b.sign(b.at(-200), 'La lava quema mucho: ¡no te caigas!');
  b.gap(300, { type: 'lava', drop: 60 }); b.plat(b.at(-200), G() - 20, 100, { sink: true, mat: 'basalt', cover: 'ash', style: 'flat' });
  b.run(240, 0); b.enemy('slime', b.at(-120));
  b.gap(520, { type: 'lava', drop: 60 });
  b.plat(b.at(-420), G() - 30, 90, { mat: 'basalt', cover: 'ash' }); b.move(b.at(-300), G() - 50, 100, b.at(-160), G() - 120, 3.5, { mat: 'basalt', cover: 'ash', style: 'flat' });
  b.out.lavafalls.push({ x: b.at(-260), top: G() - 420, bot: G() + 60, w: 40 });
  b.run(260, 0); b.obj('checkpoint', b.at(-160), G()); b.obj('shrine', b.at(-80), G());
  b.enemy('salamander', b.at(-120), G() - 300, { ceiling: true });
  b.run(300, 0); b.obj('hazard_geyser', b.at(-200), G()); b.obj('hazard_geyser', b.at(-80), G());
  b.obj('gate', b.at(-20), G(), { format: 'build' });
  b.ceiling(ls, b.x, 380, 'basalt');
  // persecución: la lava sube en un pozo vertical
  const cx = b.x; b.run(160, 0);
  b.solid(cx + 160, G() - 900, 60, 900, 'basalt', { cover: null }); b.solid(cx - 60, G() - 900, 40, 760, 'basalt', { cover: null });
  for (let i = 0; i < 6; i++) b.plat(cx + (i % 2 ? 90 : 10), G() - 130 - i * 125, 70, { mat: 'basalt', cover: 'ash', style: 'flat' });
  b.obj('risingLava', cx - 20, G() + 40, { x1: cx + 160, top: G() - 900, speed: 60, trigger: cx + 40 });
  b.sign(cx - 10, '¡La lava sube! ¡Escala rápido!');
  b.plat(cx + 220, G() - 900, 900, { mat: 'basalt', cover: 'ash', style: 'flat', h: 60 });
  const top = G() - 900;
  b.obj('checkpoint', cx + 320, top); b.enemy('slime', cx + 600, top); b.enemy('bat', cx + 800, top - 200);
  b.obj('letter', cx + 1050, top - 80, { ch: 'I' }); b.obj('chest', cx + 950, top, { tier: 'gold', lock: true });
  b.run(1200, 0); b.gap(300, { type: 'lava', drop: 60 }); b.run(200, 0);
  b.enemy('brute', b.at(-80), null, { name: 'Bruto de Basalto', seal: [2, 3] });
  b.obj('fakewall', b.at(-20), G() - 150, { w: 60, h: 150, mat: 'basalt' }); b.run(100, 0); b.obj('letter', b.at(-50), G() - 40, { ch: 'R' });
  b.run(300, 0); b.obj('wonder', b.at(-150), G() - 80, { effect: 'jelly' });
  b.enemy('salamander', b.at(-200), G() - 330, { ceiling: true }); b.enemy('slime', b.at(-60));
  b.obj('letter', b.at(-260), G() - 200, { ch: 'E' }); b.plat(b.at(-300), G() - 150, 90, { mat: 'basalt', cover: 'ash' });
  b.run(200, 0); b.obj('checkpoint', b.at(-100), G()); b.obj('gate', b.at(-30), G(), { format: 'type' });
  b.ceiling(cx + 200, b.x, 420, 'basalt');
  // ===== CORAZÓN DE MAGMA (jefe) =====
  b.biome('core', 'basalt', 'ash');
  const bx = b.x; b.run(1300, 0, 1);
  b.liquid(bx - 200, bx + 1500, G() + 140, 'lava', { decorative: true });
  b.arena(bx + 40, bx + 1260, [], { bossType: 'titan', floor: G() });
  b.run(400, 0); b.obj('exit', b.at(-200), G());
  return b.finish();
}

/* ===================================================================
   NIVELES SECRETOS
   =================================================================== */
function buildPerlas() {
  const b = new LB(404); const G = () => b.y;
  b.biome('tidecave', 'coral', 'wet'); b.run(300, 0); b.obj('checkpoint', 60, G(), { first: true });
  b.sign(180, 'Gruta de las Perlas: ¡recoge todas las monedas!');
  for (let i = 0; i < 6; i++) { b.gap(180, { type: 'water', drop: 30 }); b.plat(b.at(-120), G() - 80 - (i % 3) * 60, 80, { mat: 'coral', cover: null }); b.coins(b.at(-140), G() - 160 - (i % 3) * 60, 3, 10, 30); b.run(140, (i % 2 ? -1 : 1) * 30); }
  b.obj('letter', b.at(-80), G() - 200, { ch: 'P' }); b.plat(b.at(-120), G() - 150, 80, { mat: 'coral', cover: null });
  b.run(300, 0); b.obj('chest', b.at(-150), G(), { tier: 'gold', lock: true, rare: true });
  b.ceiling(0, b.x + 40, 340, 'wetrock'); b.run(200, 0); b.obj('exit', b.at(-100), G());
  return b.finish();
}
function buildNubes() {
  const b = new LB(505); const G = () => b.y;
  b.biome('beach', 'cloud', 'cloud'); b.out.zones[0].biome = 'beach';
  b.run(300, 0); b.obj('checkpoint', 60, G(), { first: true }); b.sign(200, 'Jardín de las Nubes: las nubes rebotan, ¡disfruta!');
  b.gap(2400);
  for (let i = 0; i < 12; i++) { const x = b.at(-2300) + i * 190, y = G() - 60 - Math.sin(i * .8) * 140; b.plat(x, y, 120, { soft: 'cloud', mat: 'cloud', cover: null, dynamic: true, bounce: i % 4 === 3 ? 1150 : 0 }); b.coins(x + 20, y - 60, 3, 10, 30); }
  b.obj('letter', b.at(-1200), G() - 380, { ch: 'S' }); b.enemy('gull', b.at(-1500), G() - 300); b.enemy('gull', b.at(-700), G() - 260);
  b.run(300, 0); b.obj('chest', b.at(-150), G(), { tier: 'gold', lock: true, rare: true }); b.run(200, 0); b.obj('exit', b.at(-100), G());
  return b.finish();
}

const LEVELS = [
  { id: 'costa', name: 'Costa Coral', sub: 'Playa · Gruta de las Mareas · Acantilado', build: buildCosta, units: ['be', 'beq', 'there', 'pron'], word: 'WAVE', wordEs: 'ola', boss: 'Rey Cangrejo', diff: 1, needEp: 0, map: [.12, .72], music: 'beach', key: 65, coinsBase: 60 },
  { id: 'bosque', name: 'Bosque Susurro', sub: 'Bosque · Arboleda Lumínica · Ruinas', build: buildBosque, units: ['pres', 'do', 'can', 'art', 'place', 'cont'], word: 'LEAF', wordEs: 'hoja', boss: 'Guardián Cronos', diff: 2, needEp: 120, map: [.38, .5], music: 'forest', key: 64, coinsBase: 80 },
  { id: 'ignea', name: 'Cueva Ígnea', sub: 'Cuevas de Cristal · Lava · Corazón de Magma', build: buildIgnea, units: ['was', 'past', 'future', 'conn', 'comp', 'req'], word: 'FIRE', wordEs: 'fuego', boss: 'Titán de Magma', diff: 3, needEp: 350, map: [.62, .66], music: 'lava', key: 50, coinsBase: 110 },
  { id: 'nubes4', name: 'Reino de las Nubes', sub: 'En construcción · próxima actualización', build: null, units: ['freq', 'prep2', 'perf'], diff: 4, needEp: 700, map: [.8, .3], soon: true },
  { id: 'engranaje', name: 'Ciudad Engranaje', sub: 'En construcción', build: null, units: ['used', 'modal', 'cond'], diff: 5, needEp: 1100, map: [.9, .55], soon: true },
  { id: 'carmesi', name: 'Fortaleza Carmesí', sub: 'En construcción', build: null, units: ['passive', 'traps', 'words'], diff: 6, needEp: 1600, map: [.72, .15], soon: true }
];
const SECRET_LEVELS = {
  perlas: { id: 'perlas', name: 'Gruta de las Perlas', sub: 'Nivel secreto', build: buildPerlas, units: ['be', 'there', 'pron'], word: 'P', secret: true, music: 'cave', key: 59, coinsBase: 100, map: [.2, .88] },
  nubes: { id: 'nubes', name: 'Jardín de las Nubes', sub: 'Nivel secreto', build: buildNubes, units: ['pres', 'can', 'cont'], word: 'S', secret: true, music: 'mystic', key: 61, coinsBase: 120, map: [.46, .2] }
};
const LEVEL_BY_ID = {}; LEVELS.forEach(l => LEVEL_BY_ID[l.id] = l); Object.values(SECRET_LEVELS).forEach(l => LEVEL_BY_ID[l.id] = l);
