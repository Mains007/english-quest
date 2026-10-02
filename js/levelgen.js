"use strict";
/* =====================================================================
   GENERADOR DE NIVELES — 6 mundos × 20 niveles + jefe de mundo.
   Cada nivel se monta con módulos (fosos, escaladas, pozos con salto en
   pared, cuerdas, puentes, viento, lava, nubes, misiones, Wordlings…),
   con dificultad creciente, cambio de bioma sorpresa y secretos.
   ===================================================================== */
const GENKIT = {
  beach:    { mat: 'sand', cover: 'sand', alt: 'sandstone', plat: 'coral', pc: null, enemies: ['crab', 'jelly', 'gull', 'urchin'], mods: ['pits', 'water', 'climb', 'upper', 'props', 'spring'], props: ['barrel', 'crate', 'coconut', 'pot'] },
  tidecave: { mat: 'wetrock', cover: 'wet', alt: 'wetrock', plat: 'coral', pc: null, enemies: ['crab', 'eel', 'jelly', 'archer', 'urchin'], mods: ['water', 'shaft', 'stalac', 'pits', 'upper'], props: ['barrel', 'crate', 'pot'], ceil: 330 },
  cliff:    { mat: 'moss', cover: 'grass', alt: 'sandstone', plat: 'sandstone', pc: 'grass', enemies: ['gull', 'crab', 'archer', 'urchin'], mods: ['ropes', 'bridge', 'wind', 'crumble', 'climb', 'pits'], props: ['crate', 'pot', 'rock'] },
  forest:   { mat: 'dirt', cover: 'grass', alt: 'moss', plat: 'wood', pc: 'grass', ps: 'log', enemies: ['shroom', 'wolf', 'beetle', 'archer'], mods: ['ropes', 'pits', 'climb', 'bridge', 'spring', 'upper'], props: ['crate', 'pot', 'barrel'] },
  mushroom: { mat: 'moss', cover: 'darkgrass', alt: 'rock', plat: 'cap', pc: null, enemies: ['shroom', 'wolf', 'beetle', 'clockmage'], mods: ['caps', 'pits', 'spring', 'climb', 'upper'], props: ['pot', 'crate'] },
  ruins:    { mat: 'brick', cover: 'moss', alt: 'brick', plat: 'brick', pc: 'moss', ps: 'flat', enemies: ['archer', 'clockmage', 'beetle', 'wolf'], mods: ['spikes', 'crumble', 'moving', 'shaft', 'climb', 'upper'], props: ['pot', 'crate'] },
  cave:     { mat: 'rock', cover: null, alt: 'rock', plat: 'crystal', pc: null, enemies: ['bat', 'wolf', 'beetle', 'salamander'], mods: ['stalac', 'pits', 'shaft', 'climb', 'upper'], props: ['crate', 'pot', 'rock'], ceil: 360 },
  lava:     { mat: 'basalt', cover: 'ash', alt: 'basalt', plat: 'basalt', pc: 'ash', ps: 'flat', enemies: ['bat', 'slime', 'salamander'], mods: ['lava', 'geyser', 'sink', 'shaft', 'lavafall', 'whirl'], props: ['rock', 'pot'], ceil: 380 },
  sky:      { mat: 'cloud', cover: 'cloud', alt: 'cloud', plat: 'cloud', pc: null, enemies: ['gull', 'jelly', 'clockmage'], mods: ['clouds', 'wind', 'pits', 'moving', 'spring'], props: ['crate'] },
  clockwork:{ mat: 'metal', cover: null, alt: 'brick', plat: 'metal', pc: null, ps: 'flat', enemies: ['clockmage', 'archer', 'beetle', 'wolf'], mods: ['moving', 'spikes', 'crumble', 'shaft', 'upper'], props: ['crate', 'barrel'] },
  castle:   { mat: 'brick', cover: null, alt: 'brick', plat: 'brick', pc: null, ps: 'flat', enemies: ['archer', 'wolf', 'clockmage', 'slime'], mods: ['spikes', 'lava', 'shaft', 'moving', 'crumble', 'whirl'], props: ['pot', 'crate', 'barrel'] }
};
const WORLDS = [
  { id: 'w1', n: 1, name: 'Costa Coral', en: 'Coral Coast', biomes: ['beach', 'tidecave', 'cliff'], units: ['be', 'beq', 'there', 'pron'], boss: 'crabking', bossName: 'King Crab', bossBuild: () => buildCosta(), font: 'Pirata One', col: '#4ab0e8', music: 'beach', key: 65 },
  { id: 'w2', n: 2, name: 'Bosque Susurro', en: 'Whispering Woods', biomes: ['forest', 'mushroom', 'ruins'], units: ['pres', 'do', 'can', 'art', 'place', 'cont'], boss: 'chrono', bossName: 'Chrono Guardian', bossBuild: () => buildBosque(), font: 'Uncial Antiqua', col: '#7ac04a', music: 'forest', key: 64 },
  { id: 'w3', n: 3, name: 'Cueva Ígnea', en: 'Ember Caverns', biomes: ['cave', 'lava'], units: ['was', 'past', 'future', 'conn', 'comp', 'req'], boss: 'titan', bossName: 'Magma Titan', bossBuild: () => buildIgnea(), font: 'New Rocker', col: '#ff7a30', music: 'lava', key: 50 },
  { id: 'w4', n: 4, name: 'Reino de las Nubes', en: 'Cloud Kingdom', biomes: ['sky', 'cliff'], units: ['freq', 'prep2', 'perf'], boss: null, bossName: 'Storm Wyvern', font: 'Fredericka the Great', col: '#b8d8ff', music: 'mystic', key: 61 },
  { id: 'w5', n: 5, name: 'Ciudad Engranaje', en: 'Gearwork City', biomes: ['clockwork', 'ruins'], units: ['used', 'modal', 'cond'], boss: null, bossName: 'Clockwork Colossus', font: 'Cinzel Decorative', col: '#d8b860', music: 'ruins', key: 57 },
  { id: 'w6', n: 6, name: 'Fortaleza Carmesí', en: 'Crimson Fortress', biomes: ['castle', 'lava'], units: ['passive', 'traps', 'words'], boss: null, bossName: 'Crimson Knight', font: 'New Rocker', col: '#e04040', music: 'lava', key: 50 }
];
const LEVELS_PER_WORLD = 20;

/* objetos cotidianos para misiones (inglés / español) */
const QUEST_ITEMS = {
  shell: ['shell', 'concha'], apple: ['apple', 'manzana'], key: ['key', 'llave'], book: ['book', 'libro'], fish: ['fish', 'pez'], flower: ['flower', 'flor'],
  lamp: ['lamp', 'lámpara'], map: ['map', 'mapa'], ring: ['ring', 'anillo'], cup: ['cup', 'taza'], hat: ['hat', 'sombrero'], letter: ['letter', 'carta'],
  bottle: ['bottle', 'botella'], egg: ['egg', 'huevo'], bell: ['bell', 'campana'], feather: ['feather', 'pluma'], stone: ['stone', 'piedra'], candle: ['candle', 'vela']
};
const QUEST_TARGETS = { basket: ['basket', 'cesta'], box: ['box', 'caja'], nest: ['nest', 'nido'], altar: ['altar', 'altar'], table: ['table', 'mesa'], bag: ['bag', 'bolsa'] };
const QUEST_GIVERS = ['mira', 'bram', 'lyra', 'otto', 'nia', 'pip'];

/* palabra secreta del nivel: sale del vocabulario de su unidad */
function levelWord(unitId, seed) {
  const u = UNIT_BY_ID[unitId]; const words = [];
  for (const it of u.items) for (const v of (it[4] || '').split(';')) { const w = v.split('=')[0].trim(); if (/^[a-z]{3,6}$/i.test(w)) words.push([w.toUpperCase(), v.split('=')[1].trim(), v.split('=')[2] ? v.split('=')[2].trim() : '']); }
  if (!words.length) return ['WORD', 'palabra', 'mot'];
  return words[seed % words.length];
}
function levelUnit(world, idx) { const u = world.units; return u[Math.min(u.length - 1, Math.floor((idx - 1) / LEVELS_PER_WORLD * u.length))]; }

function generateLevel(world, idx) {
  const seed = world.n * 1000 + idx * 37; const b = new LB(seed);
  const d = clamp((idx - 1) / 19, 0, 1);               // dificultad 0..1 dentro del mundo
  const D = d * .7 + (world.n - 1) * .1;                 // dificultad global
  const length = 3200 + idx * 210;
  const biomes = world.biomes; let bi = (idx - 1) % biomes.length;
  const unit = levelUnit(world, idx); const word = levelWord(unit, seed);
  let K = GENKIT[biomes[bi]];
  const G = () => b.y;
  const setBiome = (k) => { const name = biomes[k % biomes.length]; K = GENKIT[name]; b.biome(name, K.mat, K.cover); };
  setBiome(bi);
  b.run(380, 0, 3); b.obj('checkpoint', 60, G(), { first: true });
  b.obj('levelsign', 200, G(), { en: `${world.en} · Level ${idx}`, es: `${world.name} · Nivel ${idx}` });
  const special = [];
  // reparto de elementos clave a lo largo del nivel
  const gates = 2 + Math.floor(idx / 7), letters = word[0].split('');
  const plan = [];
  for (let i = 0; i < gates; i++) plan.push({ at: (i + .6) / (gates + .4), t: 'gate', format: i === gates - 1 && idx > 4 ? (idx % 2 ? 'type' : 'build') : i === 1 ? 'build' : 'choice' });
  plan.push({ at: .3, t: 'shrine' });
  if (idx >= 3) plan.push({ at: .45 + (idx % 3) * .08, t: 'quest' });
  if (idx >= 4 && idx % 3 !== 0) plan.push({ at: .55, t: 'wordbrawl' });
  if (idx % 5 === 0 && idx < 20) plan.push({ at: .8, t: 'elite' });
  plan.push({ at: .2, t: 'arena' }); if (idx > 6) plan.push({ at: .65, t: 'arena' });
  if (idx % 4 === 2) plan.push({ at: .7, t: 'wonder' });
  plan.push({ at: .35, t: 'secret' }); if (idx > 8) plan.push({ at: .75, t: 'secret' });
  plan.sort((a, b2) => a.at - b2.at);
  let pi = 0, lastMod = '', sinceCp = 0, letterI = 0, switched = 0;
  const placeLetter = (x, y) => { if (letterI < letters.length) { b.obj('letter', x, y, { ch: letters[letterI++] }); return true; } return false; };
  while (b.x < length) {
    const prog = b.x / length;
    // cambio de bioma sorpresa
    if (biomes.length > 1 && ((switched === 0 && prog > .36) || (switched === 1 && prog > .72))) { switched++; bi++; setBiome(bi); b.run(120, 0); if (K.ceil) b.out.ceilPending = b.x; }
    // elementos del plan
    if (pi < plan.length && prog >= plan[pi].at) {
      const p = plan[pi++]; const x = b.x;
      if (p.t === 'gate') { b.run(180, 0); b.obj('gate', b.at(-60), G(), { format: p.format }); }
      else if (p.t === 'shrine') { b.run(160, 0); b.obj('shrine', b.at(-80), G()); }
      else if (p.t === 'quest') modQuest(b, K, seed + pi);
      else if (p.t === 'wordbrawl') { const a = b.x; b.run(620, 0, 2); b.arena(a + 20, a + 600, [], { wordbrawl: true, unit, n: 3 + Math.round(D * 2) }); }
      else if (p.t === 'elite') { const a = b.x; b.run(720, 0, 2); b.arena(a + 20, a + 700, [[['brute', a + 520, null, { name: eliteName(K), seal: [2, 3], hp: 220 + D * 220, maxHp: 220 + D * 220 }]]], { boss: true, name: eliteName(K) }); }
      else if (p.t === 'arena') { const a = b.x; b.run(640, 0, 2); b.arena(a + 20, a + 620, makeWaves(K, D, a, G())); }
      else if (p.t === 'wonder') { b.run(200, 0); b.plat(b.at(-150), G() - 190, 110, platOpt(K)); b.obj('wonder', b.at(-95), G() - 240, { effect: pick(['giant', 'lowgrav', 'jelly']) }); }
      else if (p.t === 'secret') { modSecret(b, K, () => placeLetter(b.at(-60), G() - 60)); }
      continue;
    }
    // módulo normal
    let opts = K.mods.slice(); opts.push('flat', 'flat', 'hills', 'props');
    opts = opts.filter(m => m !== lastMod);
    const m = pick(opts); lastMod = m;
    const before = b.x;
    MODS[m](b, K, D, () => placeLetter);
    // enemigos sueltos
    if (b.x - before > 200 && chance(.45 + D * .4)) { const n = 1 + (chance(D) ? 1 : 0); for (let i = 0; i < n; i++) spawnEnemyFor(b, K, D, R(before + 60, b.x - 40)); }
    if (chance(.5)) b.coins(R(before + 40, Math.max(before + 50, b.x - 200)), G() - 70, RI(3, 6), R(10, 40));
    sinceCp += b.x - before;
    if (sinceCp > 1500) { b.run(140, 0); b.obj('checkpoint', b.at(-70), G()); sinceCp = 0; }
  }
  // letras que falten: en lugares difíciles al final
  while (letterI < letters.length) { b.run(220, 0); b.plat(b.at(-160), G() - 170 - letterI * 30, 90, platOpt(K)); placeLetter(b.at(-115), G() - 220 - letterI * 30); }
  b.run(260, 0); b.obj('chest', b.at(-200), G(), { tier: idx % 5 === 0 ? 'silver' : 'wood' });
  b.run(240, 0); b.obj('exit', b.at(-120), G());
  const def = b.finish();
  // techos de cueva para tramos con biomas subterráneos
  for (const z of zoneRanges(def)) { const k = GENKIT[z.biome]; if (k && k.ceil) def.ceils.push(...makeCeil(def, z.x0, z.x1, k.ceil, k.alt)); }
  def.meta = { world: world.id, idx, unit, word, D };
  return def;
}
function zoneRanges(def) { const Z = def.zones, out = []; for (let i = 0; i < Z.length; i++) out.push({ biome: Z[i].biome, x0: Z[i].x, x1: (Z[i + 1] ? Z[i + 1].x : def.bounds.x1) }); return out; }
function makeCeil(def, x0, x1, height, mat) {
  const step = 8, pts = [], stal = [], gAt = x => { for (const s of def.ground) if (x >= s.x0 && x <= s.x1) return s.pts[Math.min(s.pts.length - 1, Math.floor((x - s.x0) / s.step))]; return null; };
  let last = 560;
  for (let x = x0; x <= x1 + step; x += step) { const gy = gAt(x) ?? last; last = gy; const edge = Math.min(1, (x - x0) / 140, (x1 - x) / 140); pts.push(gy - height - (1 - Math.max(0, edge)) * 500 + (fbm1(x * .01 + 40) - .5) * 70); }
  for (let x = x0 + 80; x < x1 - 80; x += R(40, 110)) stal.push({ x, w: R(16, 46), h: R(24, 100), seed: RI(1, 9999) });
  return [{ x0, x1, step, pts, mat, stal }];
}
function platOpt(K) { return { mat: K.plat, cover: K.pc, style: K.ps || 'island' }; }
function eliteName(K) { return K.mat === 'basalt' ? 'Basalt Brute' : K.mat === 'brick' ? 'Ruin Golem' : K.mat === 'cloud' ? 'Thunder Brute' : K.mat === 'metal' ? 'Iron Brute' : 'Coral Brute'; }
function spawnEnemyFor(b, K, D, x) {
  const pool = K.enemies.slice(0, 2 + Math.round(D * (K.enemies.length - 2)));
  const t = pick(pool), gy = b._groundAt(x) ?? b.y;
  if (t === 'eel') return;
  if (['jelly', 'gull', 'clockmage'].includes(t)) b.enemy(t, x, gy - R(140, 220));
  else if (t === 'bat') b.enemy(t, x, gy - R(220, 280));
  else if (t === 'salamander') b.enemy(t, x, gy - 300, { ceiling: true });
  else b.enemy(t, x, gy);
}
function makeWaves(K, D, a, gy) {
  const waves = [], n = 1 + (D > .35 ? 1 : 0) + (D > .7 ? 1 : 0);
  for (let w = 0; w < n; w++) {
    const wave = [], cnt = 2 + Math.round(D * 2) + w;
    for (let i = 0; i < cnt; i++) {
      const t = pick(K.enemies.filter(e => e !== 'eel')), x = a + 100 + R(0, 420);
      wave.push([t, x, ['jelly', 'gull', 'clockmage', 'bat'].includes(t) ? gy - R(160, 240) : (t === 'salamander' ? gy - 300 : null), t === 'salamander' ? { ceiling: true } : {}]);
    }
    waves.push(wave);
  }
  return waves;
}
/* ---------- módulos ---------- */
const MODS = {
  flat(b, K) { b.run(R(260, 440), R(-30, 30), 5); },
  hills(b, K) { b.run(R(200, 300), R(-90, -40), 8); b.run(R(200, 300), R(40, 90), 8); },
  props(b, K) { b.run(300, 0, 3); for (let i = 0; i < RI(2, 4); i++) b.prop(pick(K.props), b.at(-260 + i * 60)); },
  pits(b, K, D) { const n = RI(2, 3 + Math.round(D * 2)); for (let i = 0; i < n; i++) { b.run(R(120, 200), R(-30, 30)); const w = R(110, 160 + D * 90); b.gap(w); if (w > 190) b.plat(b.at(-w / 2 - 40), b.y - R(10, 50), 80, platOpt(K)); } b.run(160, 0); },
  water(b, K) { b.run(160, 0); const w = R(200, 320); b.gap(w, { type: 'water', drop: 26, floor: chance(.5) ? 140 : 0 }); b.prop('log', b.at(-w / 2), b.y + 10); b.run(160, 0); },
  climb(b, K, D, L) { b.run(120, 0); const x0 = b.x; let y = b.y; for (let i = 0; i < 3; i++) { y -= R(90, 130); b.plat(x0 + i * 150, y, 110, platOpt(K)); } const top = y; if (chance(.6)) { const lp = L(); lp(x0 + 380, top - 60); } else b.obj('chest', x0 + 340, top, { tier: 'wood' }); b.coins(x0 + 20, top - 50, 4, 10, 40); b.run(480, 0); },
  upper(b, K, D, L) { const x0 = b.x; b.run(700, 0, 4); b.plat(x0 + 60, b.y - 160, 90, platOpt(K)); b.plat(x0 + 220, b.y - 300, 400, platOpt(K)); spawnEnemyFor(b, K, D, x0 + 420); b.enemy(pick(K.enemies.filter(e => !['eel', 'salamander', 'bat', 'gull', 'jelly', 'clockmage'].includes(e))) || 'crab', x0 + 480, b.y - 300); const lp = L(); if (!lp(x0 + 560, b.y - 360)) b.obj('chest', x0 + 580, b.y - 300, { tier: 'silver' }); b.coins(x0 + 240, b.y - 360, 6, 0, 40); },
  shaft(b, K, D, L) { b.run(120, 0); const sx = b.x, gy = b.y, h = 420 + D * 160; b.solid(sx + 160, gy - h, 50, h - 120, K.alt, { cover: K.cover }); b.solid(sx - 40, gy - h, 40, h - 160, K.alt, { cover: K.cover }); b.solid(sx + 210, gy - h, 360, 50, K.alt, { cover: K.cover }); b.obj('chest', sx + 420, gy - h, { tier: 'silver' }); b.coins(sx + 60, gy - h + 120, 3, 0, 40); b.run(600, 0); },
  stalac(b, K) { b.run(420, 0); for (let i = 0; i < 3; i++) b.obj('hazard_stalactite', b.at(-360 + i * 110)); },
  ropes(b, K) { b.run(120, 0); const x0 = b.x, w = 440; b.gap(w); b.solid(x0 - 40, b.y - 430, w + 80, 60, K.alt, { cover: K.cover }); b.rope(x0 + 130, b.y - 370, 210, { grab: true, kind: 'rope', col: '#8a6a3a' }); b.rope(x0 + 320, b.y - 370, 210, { grab: true, kind: 'rope', col: '#8a6a3a' }); b.coins(x0 + 100, b.y - 140, 6, 50, 50); b.run(160, 0); },
  bridge(b, K) { b.run(120, 0); const x0 = b.x, w = R(300, 420); b.gap(w); b.bridge(x0, x0 + w, b.y); b.run(160, 0); },
  wind(b, K) { const x0 = b.x; b.run(600, R(-60, 20), 6); b.wind(x0, x0 + 600, b.y - 600, b.y + 60, chance(.5) ? -850 : 650); b.plat(x0 + 200, b.y - 150, 90, Object.assign(platOpt(K), { crumble: true })); b.coins(x0 + 160, b.y - 220, 4, 20, 40); },
  crumble(b, K, D) { b.run(120, 0); const w = 420; b.gap(w); for (let i = 0; i < 3; i++) b.plat(b.at(-w + 40 + i * 130), b.y - 20 - i * 20, 90, Object.assign(platOpt(K), { crumble: true })); b.run(160, 0); },
  moving(b, K, D) { b.run(120, 0); const w = 460; b.gap(w); b.move(b.at(-w + 30), b.y - 30, 110, b.at(-140), b.y - 30 - R(0, 120), R(3, 4.5), platOpt(K)); b.run(160, 0); },
  spring(b, K) { b.run(260, 0); b.obj('spring', b.at(-200), b.y, { power: 1150, cap: K.mat === 'moss' }); b.plat(b.at(-260), b.y - 420, 160, platOpt(K)); b.obj('chest', b.at(-180), b.y - 420, { tier: chance(.3) ? 'silver' : 'wood' }); b.coins(b.at(-250), b.y - 480, 4, 10, 36); b.run(140, 0); },
  caps(b, K) { b.run(120, 0); const w = 720; b.gap(w); for (let i = 0; i < 4; i++) b.plat(b.at(-w + 40 + i * 175), b.y - 60 - (i % 2) * 70, 100, { soft: 'cap', mat: 'cap', cover: null, dynamic: true, bounce: 1000 }); b.run(160, 0); },
  clouds(b, K) { b.run(100, 0); const w = 760; b.gap(w); for (let i = 0; i < 5; i++) b.plat(b.at(-w + 30 + i * 150), b.y - 20 - Math.sin(i) * 80, 110, { soft: 'cloud', mat: 'cloud', cover: null, dynamic: true, bounce: i === 3 ? 1100 : 0 }); b.run(140, 0); },
  lava(b, K, D) { b.run(140, 0); const w = R(260, 380); b.gap(w, { type: 'lava', drop: 60 }); b.plat(b.at(-w / 2 - 50), b.y - 20, 100, { sink: true, mat: 'basalt', cover: 'ash', style: 'flat' }); b.run(160, 0); },
  sink(b, K) { b.run(120, 0); const w = 520; b.gap(w, { type: 'lava', drop: 60 }); for (let i = 0; i < 3; i++) b.plat(b.at(-w + 40 + i * 160), b.y - 10, 90, { sink: true, mat: 'basalt', cover: 'ash', style: 'flat' }); b.run(160, 0); },
  whirl(b, K) {
    // foso de lava con fondo: se puede saltar por la plataforma, o cruzar por abajo con el Remolino rúnico
    b.run(200, 0); b.sign(b.at(-140), 'Lava con fondo: con el Remolino rúnico (Taller) puedes cruzarla por abajo');
    const w = R(300, 380), x0 = b.x, y0 = b.y; b.gap(w, { type: 'lava', drop: 24, floor: 104 });
    b.plat(b.at(-w / 2 - 50), y0 - 30, 100, { sink: true, mat: 'basalt', cover: 'ash', style: 'flat' });
    b.coins(x0 + 50, y0 + 84, Math.floor((w - 80) / 34), 0, 34); b.run(160, 0);
  },
  geyser(b, K) { b.run(420, 0); b.obj('hazard_geyser', b.at(-320), b.y); b.obj('hazard_geyser', b.at(-150), b.y); },
  lavafall(b, K) { b.run(140, 0); const w = 360; b.gap(w, { type: 'lava', drop: 60 }); b.out.lavafalls.push({ x: b.at(-w / 2), top: b.y - 440, bot: b.y + 60, w: 36 }); b.move(b.at(-w + 20), b.y - 40, 100, b.at(-120), b.y - 40, 3.2, { mat: 'basalt', cover: 'ash', style: 'flat' }); b.run(160, 0); },
  spikes(b, K) { b.run(160, 0); b.obj('hazard_spikes', b.x, b.y, { w: 128 }); b.run(128, 0); b.plat(b.at(-110), b.y - 120, 100, platOpt(K)); b.run(160, 0); }
};
function modSecret(b, K, placeLetter) {
  b.run(260, 0); const x = b.at(-140);
  b.obj('fakewall', x, b.y - 150, { w: 70, h: 150, mat: K.alt });
  b.run(160, 0); b.obj('chest', b.at(-80), b.y, { tier: chance(.25) ? 'gold' : 'silver', lock: chance(.3) });
  placeLetter(); b.run(80, 0);
}
function modQuest(b, K, seed) {
  const r = mulberry32(seed), keys = Object.keys(QUEST_ITEMS), tk = Object.keys(QUEST_TARGETS);
  const item = keys[Math.floor(r() * keys.length)], target = tk[Math.floor(r() * tk.length)], giver = QUEST_GIVERS[Math.floor(r() * QUEST_GIVERS.length)];
  const kind = r() < .5 ? 'bring' : 'put';
  b.run(200, 0); const gx = b.at(-100);
  const qid = 'q' + seed;
  if (kind === 'bring') b.obj('npc', gx, b.y, { npc: giver, quest: { id: qid, kind, item, giver } });
  else { b.obj('npc', gx, b.y, { npc: giver, quest: { id: qid, kind, item, target } }); b.obj('qtarget', gx + 70, b.y, { qid, target }); }
  b.run(R(500, 800), R(-40, 40), 5);
  b.plat(b.at(-260), b.y - 160, 100, platOpt(K));
  b.obj('qitem', b.at(-210), b.y - 190, { qid, item });
  b.run(100, 0);
}
