"use strict";
/* =====================================================================
   NÚCLEO DEL JUEGO: estados, carga de niveles, actualización, combate,
   cámara, interacción, misiones, monedas, textos bilingües.
   ===================================================================== */
/* textos del juego: inglés (principal) + español (pequeño debajo) */
const TX = {
  'No te quedan frascos de luz': "You have no light flasks left",
  '¡Sin aliento!': "Out of breath!",
  'Desbloquea más armas en el Taller': "Unlock more weapons in the Workshop",
  'Runas agotadas: se recargan solas': "No runes left: they recharge by themselves",
  '¡Blindado! Golpéale por detrás o desde arriba': "Armoured! Hit it from behind or from above",
  '¡Se ha recuperado!': "It has recovered!",
  '¡Se ha recuperado! Vuelve a debilitarlo': "It has recovered! Weaken it again",
  'El reloj brilla... ¡va a PARAR EL TIEMPO!': "The clock is shining... it is going to STOP TIME!",
  '¡El núcleo está abierto! ¡Sube y golpéalo!': "The core is open! Climb up and hit it!",
  '¡Está rebobinando su tiempo! ¡Golpea el reloj de arena!': "It is rewinding its time! Hit the hourglass!",
  '¡Viene la marea! ¡Sube a las rocas o salta!': "The tide is coming! Climb the rocks or jump!",
  '¡Barrido! ¡Salta!': "Sweep! Jump!",
  '¡Sus ojos se cargan! ¡Esquiva (○) a través del rayo!': "Its eyes are charging! Dodge through the beam!",
  '¡Su cabeza está a tu alcance! ¡Ataca el cristal!': "You can reach its head! Attack the crystal!",
  '¡La lava sube! ¡Rápido!': "The lava is rising! Hurry!",
  'Carrera rúnica: ACTIVADA': "Rune sprint: ON", 'Carrera rúnica: desactivada': "Rune sprint: OFF"
};
const PHRASE_KNOWN = 3;

class Game {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.mode = 'menu'; this.t = 0; this.rt = 0; this.timeScale = 1; this.slowT = 0; this.cinematic = null; this.paused = false;
    this.cam = { x: 0, y: 0, zoom: 1, tz: 1, shake: 0, shakeT: 0, sx: 0, sy: 0, fx: 0, fy: 0 };
    this.flash = { a: 0, col: [255, 255, 255] }; this.translateT = 0; this.toasts = [];
    this.VW = 1280; this.RS = 1; this.SCALE = 1;
    this.lm = null; this.vig = null; this.fxReady = false;
    this.effects = {};
  }
  get inCombat() { return !!this.arena || this.enemies && this.enemies.some(e => !e.dead && Math.abs(e.x - this.hero.x) < 520 && Math.abs(e.y - this.hero.y) < 300 && e.st !== 'hang' && e.st !== 'sleep' && e.st !== 'under'); }
  /* ================= CARGA DE NIVEL ================= */
  async loadLevel(ref) {
    this.mode = 'loading'; this.ref = ref; Sound.stopMusic(); UI.brawlBanner(null); this.heroPush = 0; UI.showLoading(0, ref);
    await new Promise(r => setTimeout(r, 30));
    let def, worldDef = WORLDS[ref.w] || WORLDS[0], meta;
    seedRNG((ref.w || 0) * 9999 + (ref.idx || 0) * 77 + 5);
    if (ref.secret) { const S = SECRET_LEVELS[ref.secret]; def = S.build(); meta = { unit: S.units[0], word: [S.word === 'P' ? 'PEARL' : 'SKY', S.word === 'P' ? 'perla' : 'cielo', S.word === 'P' ? 'perle' : 'ciel'], secret: true }; }
    else if (ref.idx === LEVELS_PER_WORLD && worldDef.bossBuild) { def = worldDef.bossBuild(); const u = worldDef.units[worldDef.units.length - 1]; const legacy = LEVELS.find(l => l.boss && l.id && def); meta = { unit: u, word: [(LEVELS[ref.w] && LEVELS[ref.w].word) || 'HERO', (LEVELS[ref.w] && LEVELS[ref.w].wordEs) || 'héroe', ''], boss: true }; }
    else { def = generateLevel(worldDef, ref.idx); meta = def.meta; }
    this.meta = meta; this.worldDef = worldDef;
    // inglés del nivel: unidad del nivel + repaso de las anteriores del mismo mundo
    const ui = worldDef.units.indexOf(meta.unit);
    this.units = [meta.unit].concat(worldDef.units.slice(Math.max(0, ui - 2), ui).reverse());
    if (Store.data.settings.englishMode === 'route') this.units = Learn.routeUnits();
    if (ref.units) this.units = ref.units;
    Learn.resetSession();
    // mundo
    const W = new World(def); this.world = W; W.staticDecor = def.staticDecor || []; W.bridges = [];
    for (const l of W.liquids) { l.curLevel = l.level; if (!l.decorative) l.surface = new LiquidSurface(l); }
    FX.setWorld(W);
    this.decor = populateDecor(def, W);
    const biomes = [...new Set(def.zones.map(z => z.biome))];
    for (let i = 0; i < biomes.length; i++) { buildBiomeLayers(biomes[i]); UI.showLoading((i + 1) / (biomes.length + 4) * .3, ref); await new Promise(r => setTimeout(r, 0)); }
    await W.build(p => UI.showLoading(.3 + p * .65, ref));
    // entidades
    this.hero = null; this.enemies = []; this.projectiles = []; this.props = []; this.objects = []; this.clouds = []; this.fires = []; this.bubbles = []; this.waves = [];
    this.ropes = (def.ropes || []).map(r => new Rope(r.x, r.y, r.len, 14, r));
    W.bridges = this.bridges = (def.bridges || []).map(b => new Bridge(b.x0, b.x1, b.y));
    this.lavafalls = def.lavafalls || [];
    this.arenas = def.arenas || []; this.arena = null; this.boss = null; this.bossArena = null;
    this.enemySpawns = def.enemies.map((e, i) => Object.assign({ id: i }, e));
    for (const s of this.enemySpawns) this.spawnEnemyDef(s);
    for (const p of def.props) this.props.push(new Prop(this, p.type, p.x, p.y, p));
    let spawn = { x: 80, y: W.groundY(80) };
    for (const o of def.objects) { const C = OBJECT_TYPES[o.type] || (o.type === 'qitem' ? QuestItem : o.type === 'qtarget' ? QuestTarget : null); if (!C) continue; const ob = new C(this, o); this.objects.push(ob); if (o.type === 'checkpoint' && o.first) { spawn = { x: o.x + 30, y: o.y }; this.checkpoint = ob; } }
    for (const p of W.plats) { if (p.soft) p.baseY = p.baseY ?? p.y; if (p.crumble) { p.dynamic = true; p.cr = 0; p.base = { y: p.y }; } if (p.sink !== undefined) p.baseY = p.baseY ?? p.y; }
    this.lights = (def.lights || []).slice();
    for (const l of W.liquids) if (l.type === 'lava') for (let x = l.x0 + 30; x < l.x1; x += 90) this.lights.push({ x, y: l.level + 10, r: 290, c: [255, 104, 30], i: .85, ph: R(0, 9), liq: l });
    for (const f of this.lavafalls) for (let y = f.top; y < f.bot; y += 90) this.lights.push({ x: f.x, y, r: 200, c: [255, 130, 40], i: .6, ph: R(0, 9) });
    for (const m of this.decor.mushrooms) this.lights.push({ x: m.x, y: m.y - 16 * m.s, r: 110 * m.s, c: m.col, i: .55, ph: m.ph, pulse: 1 });
    this.hero = new Hero(this, spawn.x, spawn.y);
    this.spawn = spawn; this.cpPos = { x: spawn.x, y: spawn.y };
    this.stats = { coins: 0, crystals: 0, letters: new Set(), enemies: 0, chests: 0, secrets: 0, deaths: 0, time: 0, translations: 0, quests: 0, start: performance.now() };
    this.wordFound = new Set((Store.data.levels[this.levelKey()] || {}).letters || []);
    this.quest = null; this.questsDone = new Set();
    this.t = 0; this.timeScale = 1; this.cinematic = null; this.effects = {}; this.seal = null; this.exposedFx = 0;
    if ((def.arenas || []).some(a => a.bossType === 'titan')) titanSprites();
    this.snapCamera();
    // ambiente y música
    const z0 = W.biomeAt(spawn.x); this.curBiome = z0.a;
    Sound.setMood(BIOMES[this.curBiome].music || 'beach', { key: worldDef.key || 60, force: true });
    UI.showLoading(1, ref); await new Promise(r => setTimeout(r, 120));
    this.mode = 'play'; UI.enterGame(this); UI.hud(this);
    this.startWarmup();
  }
  levelKey() { return this.ref.secret ? 's:' + this.ref.secret : this.ref.w + ':' + this.ref.idx; }
  spawnEnemyDef(s) {
    const C = ENEMY_TYPES[s.type]; if (!C) return;
    const e = new C(this, s.x, s.y ?? this.world.groundY(s.x), Object.assign({ spawnId: s.id }, s));
    if (s.type === 'eel') e.water = s.water ?? s.y;
    this.enemies.push(e); return e;
  }
  addEnemy(e) { this.enemies.push(e); }
  /* ================= ACTUALIZACIÓN ================= */
  update(dt) {
    this.rt += dt;
    if (this.mode !== 'play') return;
    const H = this.hero;
    // botones globales
    if (!this.cinematic && !UI.modalOpen()) {
      if (Input.pressed('pause')) { UI.openPause(); return; }
      if (Input.pressed('notebook')) { UI.openNotebook(); return; }
      if (Input.pressed('book')) { UI.openQuickLesson(this.units[0]); return; }
      if (Input.pressed('map')) this.translatePressed();
    }
    if (UI.modalOpen()) return;
    // tiempo de juego (cámara lenta, cinemáticas)
    if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) this.timeScale = 1; }
    let ts = this.timeScale; if (this.cinematic) ts = this.cinematic.worldTs ?? 0;
    const gdt = dt * ts;
    this.t += gdt; this.stats.time += dt;
    if (this.cinematic) this.updateCinematic(dt);
    this.translateT = Math.max(0, this.translateT - dt);
    const W = this.world; W.update(gdt, this.t);
    // efectos de la Runa del Asombro
    this.updateWonder(dt);
    // plataformas especiales
    for (const p of W.plats) {
      if (p.soft) { const on = H.onGround && H.plat === p; softPlatformUpdate(p, gdt, on, H.landVy || 0); if (on && H.justLanded && p.bounce) { H.vy = -p.bounce; H.onGround = false; H.y -= 2; Sound.play('bounce'); FX.land(H.x, H.y, 700); H.sq = 1.4; Input.rumble(.1, .4, 80); } else if (on && H.justLanded) { Sound.play('bounce'); for (let i = 0; i < 8; i++) FX.spawnRaw({ t: 'dust', x: H.x + R(-20, 20), y: p.y + 4, vx: R(-60, 60), vy: R(-30, 10), g: 0, drag: 2, max: .8, s: 5, s1: 12, col: p.soft === 'cap' ? [255, 190, 240] : [255, 255, 255], a: .6 }); } }
      if (p.crumble) {
        if (p.cr === 0 && H.onGround && H.plat === p) { p.cr = .001; Sound.play('crumble'); }
        if (p.cr > 0 && !p.gone) { p.cr += gdt; if (chance(.3)) FX.spawnRaw({ t: 'dust', x: p.x + R(0, p.w), y: p.y + 10, vx: 0, vy: 40, g: 200, drag: 1, max: .5, s: 2, s1: 4, col: [180, 170, 150], a: .6 }); if (p.cr > .65) { p.gone = true; FX.chunks(p.x + p.w / 2, p.y + 8, MATS[p.mat] ? MATS[p.mat].col : [150, 140, 120], 8, 200, .8); Sound.play('crumble'); } }
        if (p.gone) { p.cr += gdt; if (p.cr > 4.5 && !(H.x > p.x - 20 && H.x < p.x + p.w + 20 && Math.abs(H.y - p.base.y) < 60)) { p.gone = false; p.cr = 0; FX.runeBurst(p.x + p.w / 2, p.y, [200, 200, 200], 6); } }
      }
      if (p.sink !== undefined) { const on = H.onGround && H.plat === p; p.sink = on ? Math.min(90, p.sink + 38 * gdt) : Math.max(0, p.sink - 25 * gdt); if (on && chance(.2)) FX.embers(p.x + R(0, p.w), p.y + 10, 1, 60); }
    }
    for (const l of W.liquids) if (l.surface) l.surface.update(gdt);
    // héroe
    H.update(gdt);
    if (this.heroPush && !H.dead && (H.onGround || this.heroPushAir)) H.x += this.heroPush * gdt;
    this.updateRope(gdt);
    if (H.y > W.bounds.y1 + 120 && !H.dead) this.fallDeath();
    // objetos, enemigos, accesorios
    for (const o of this.objects) o.update(gdt);
    this.objects = this.objects.filter(o => !(o.done && (o instanceof Coin)));
    for (const e of this.enemies) e.update(gdt);
    this.enemies = this.enemies.filter(e => !e.dead || e.keep);
    if (this.boss) this.boss.update(gdt);
    for (const p of this.props) { p.update(gdt); if (H.onGround && p.onGround && Math.abs(H.y - p.y) < 20 && Math.abs(H.x - p.x) < (p.w / 2 + H.w / 2 + 2) && Math.sign(p.x - H.x) === Math.sign(H.vx) && !p.raft) { p.push(H.vx * .55); H.vx *= .7; } }
    this.props = this.props.filter(p => !p.dead);
    this.updateProjectiles(gdt);
    this.updateHazards(gdt);
    for (const r of this.ropes) r.update(gdt, this.windAt(r.ax, r.ay) * .3, [{ x: H.x, y: H.y - 30, r: 18, h: 40, vx: H.vx }]);
    for (const b of this.bridges) b.update(gdt, [{ x: H.x, onBridge: H.onBridge, weight: 1 }]);
    this.combat();
    this.updateArenas(gdt);
    this.updateQuest();
    this.ambientParticles(dt);
    FX.update(gdt);
    this.updateBiome();
    this.updateCamera(dt);
    this.updateInteract();
    this.checkNewEnemies(dt);
    UI.hud(this);
  }
  /* presentación de enemigos nuevos: cámara lenta + ficha con retrato y consejo */
  checkNewEnemies(dt) {
    this.neT = (this.neT || 0) - dt; if (this.neT > 0 || this.boss) return; this.neT = .3;
    const seen = Store.data.seenEnemies || (Store.data.seenEnemies = {}), H = this.hero;
    for (const e of this.enemies) { if (e.dead || !e.type || seen[e.type] || !ENEMY_INFO[e.type] || e.type === 'mimic') continue;
      if (Math.abs(e.x - H.x) > 560 || Math.abs(e.y - H.y) > 380 || e.x < this.cam.x + 40 || e.x > this.cam.x + this.VW - 40) continue;
      seen[e.type] = 1; Store.save(); this.slow(.2, .5); Sound.play('telegraph', 30);
      UI.enemyCard(e); break; }
  }
  /* ================= COMBATE ================= */
  combat() {
    const H = this.hero; if (H.dead) return;
    const hb = H.hitboxes(), hbox = { x: H.x - H.w / 2, y: H.y - H.h, w: H.w, h: H.h };
    for (const b of hb) {
      for (const e of this.enemies) {
        if (e.dead || e.lastHit === b.id || e.spawnT > 0) continue;
        if (!overlap(b, e.hitbox())) continue;
        if (e.st === 'under' || e.st === 'bubble') continue;
        e.lastHit = b.id; if (b.multi) setTimeout(() => { if (e.lastHit === b.id) e.lastHit = -1; }, b.multi * 1000);
        const dir = Math.sign(e.x - H.x) || H.face;
        const hit = e.hurt(b.dmg, dir, { kb: b.kb, up: b.up, pogo: b.pogo, armor: b.armor, crit: b.crit, heavy: b.heavy });
        if (hit) H.onHit({ x: e.x, y: e.y - e.h / 2, heavy: b.heavy, crit: b.crit, pogo: b.pogo });
        if (b.shock && chance(.5)) { const n = this.nearestEnemy(e.x, e.y - 20, 180, 0, e); if (n) { n.hurt(b.dmg * .5, Math.sign(n.x - e.x), { kb: 80 }); this.lightning(e.x, e.y - e.h / 2, n.x, n.y - n.h / 2); } }
      }
      if (this.boss && !this.boss.dead) for (const v of this.boss.vulnerable()) {
        if (this.boss.lastHit === b.id + ':' + v.x) continue;
        if (!overlap(b, v)) continue;
        this.boss.lastHit = b.id + ':' + v.x;
        if (v.gear) { v.gear.vx *= -1; FX.sparks(v.gear.x, this.boss.arena.floor - v.gear.r, [255, 220, 120], 10); Sound.play('block'); H.onHit({ x: v.gear.x, y: v.gear.y, pogo: b.pogo }); continue; }
        const cx = clamp(H.x + H.face * 40, v.x, v.x + v.w), cy = clamp(H.y - 30, v.y, v.y + v.h);
        if (this.boss.hurt(b.dmg, H.face, { x: cx, y: cy, heavy: b.heavy, crit: b.crit, box: v }, v)) H.onHit({ x: cx, y: cy, heavy: b.heavy, crit: b.crit, pogo: b.pogo });
        break;
      }
      for (const p of this.props) { if (p.lastHit === b.id || !overlap(b, { x: p.x - p.w / 2, y: p.y - p.h, w: p.w, h: p.h })) continue; p.lastHit = b.id; p.hit(b.dmg, Math.sign(p.x - H.x) || H.face, b); H.onHit({ x: p.x, y: p.y - p.h / 2, pogo: b.pogo }); }
      for (const pr of this.projectiles) if (pr.owner === 'enemy' && !pr.dead && overlap(b, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) { if (pr.poppable || pr.kind === 'bubble') { pr.dead = true; FX.splash(pr.x, pr.y, 'water', .6); H.addUlt(5); Sound.play('bubble'); } else if (pr.kind === 'bomb') { pr.vx = H.face * 500; pr.vy = -300; pr.owner = 'hero'; Sound.play('block'); } else { pr.vx *= -1.4; pr.vy = -Math.abs(pr.vy) * .5; pr.owner = 'hero'; FX.sparks(pr.x, pr.y, [255, 255, 255], 6); Sound.play('block'); FX.text(pr.x, pr.y - 20, 'DEFLECT!', '#fff', 22); } }
      if (b.pogo) for (const o of this.objects) if (o instanceof Spring && Math.abs(o.x - H.x) < 30 && Math.abs(o.y - H.y) < 40) { H.vy = -900; }
    }
    // daño al héroe
    const dealt = (dmg, srcX, opt, src, box) => { const r = H.hurt(dmg, srcX, Object.assign({ src }, opt)); if (r === 'parry' && src && src.onParried && (!box || box.parryable !== false)) src.onParried(); return r; };
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      for (const a of e.attackBoxes()) if (a.circle ? circleRect(a.circle, hbox) : overlap(a, hbox)) { dealt(a.dmg, e.x, { unblockable: a.unblockable }, e, a); break; }
      if (e.contact > 0 && e.st !== 'sleep' && e.st !== 'hang' && e.st !== 'under' && e.st !== 'bubble' && e.stun <= 0 && overlap(e.hitbox(), hbox)) {
        if (e.pogoable && H.vy > 0 && H.y < e.y - e.h + 12) { H.vy = -560; e.hurt(6, 0, { pogo: true }); H.jumps = 0; H.airDash = 1; Sound.play('bounce'); }
        else if (e.spiky && H.atk && H.atk.kind === 'down') { }
        else dealt(e.contact, e.x, { kb: 260 }, e);
      }
    }
    if (this.boss && !this.boss.dead && this.boss.st !== 'sealing') for (const a of this.boss.attackBoxes()) if (overlap(a, hbox)) { dealt(a.dmg, a.contact ? this.boss.x : a.x + a.w / 2, { unblockable: a.unblockable, kb: 380, kup: 420 }, this.boss); break; }
    // fuego en el suelo y nubes de esporas
    for (const f of this.fires) if (Math.abs(H.x - f.x) < f.w / 2 && Math.abs(H.y - f.y) < 20 && H.onGround) H.hurt(8, f.x, { kb: 150, kup: 300 });
    for (const c of this.clouds) if (Math.hypot(H.x - c.x, H.y - 30 - c.y) < c.r) { if (!c.tick || this.t - c.tick > .6) { c.tick = this.t; if (H.inv <= 0) { H.hp -= 4 * this.dmgMul(); FX.text(H.x, H.y - 70, 'POISON', '#d88aff', 20); Sound.play('hurt'); if (H.hp <= 0) { H.hp = 0; H.die(); } } } }
    // burbujas de tiempo (ralentizan al héroe)
    this.timeSlowHero = 1; for (const tb of this.bubbles) if (Math.hypot(H.x - tb.x, H.y - 30 - tb.y) < tb.r) this.timeSlowHero = .4;
  }
  updateProjectiles(dt) {
    const H = this.hero, W = this.world;
    for (const p of this.projectiles) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life -= dt; if (p.life <= 0) p.dead = true;
      if (p.g) p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'fireball' && chance(.6)) FX.embers(p.x, p.y, 1, 40);
      if (p.kind === 'rune' && chance(.8)) FX.trail(p.x, p.y, p.col || [150, 230, 255], 5);
      if (p.kind === 'arrow') p.ang = Math.atan2(p.vy, p.vx);
      const floor = W.floorAt(p.x, p.y - p.r);
      if (p.y + p.r * .5 >= floor && !p.stuck) {
        if (p.onLand) { p.onLand(this, p, floor); p.dead = true; continue; }
        if (p.kind === 'arrow') { p.stuck = true; p.vx = p.vy = 0; p.g = 0; p.life = 3; FX.footstep(p.x, floor, 0, 300); }
        else if (p.bounce && p.kind === 'bomb') { p.vy *= -.45; p.vx *= .6; p.y = floor - p.r; }
        else if (p.bounce) { p.vy *= -.6; p.y = floor - p.r; }
        else { p.dead = true; if (p.kind === 'fireball') { FX.embers(p.x, floor, 8, 120); this.spawnFire(p.x, floor, 30, 1); } }
      }
      if (W.wallHit(p.x, p.y, p.vx) && !p.stuck) { if (p.kind === 'arrow') { p.stuck = true; p.vx = p.vy = 0; p.g = 0; p.life = 3; } else p.dead = true; }
      if (p.kind === 'bomb') { p.fuse -= dt; if (p.fuse <= 0) { p.dead = true; this.explosion(p.x, p.y, 80, p.dmg, p.owner); } }
      if (p.stuck) continue;
      if (p.owner === 'enemy' && !H.dead && !p.dead) {
        if (circleRect({ x: p.x, y: p.y, r: p.r }, { x: H.x - H.w / 2, y: H.y - H.h, w: H.w, h: H.h })) {
          const r = H.hurt(p.dmg, p.x - p.vx * .01, { src: p });
          if (r === 'parry' && p.parryable !== false) { p.owner = 'hero'; p.vx *= -1.5; p.vy = -Math.abs(p.vy) * .3; p.life = 2; FX.text(p.x, p.y - 20, 'REFLECT!', '#fff', 26); }
          else if (r !== 'miss') { if (p.kind === 'bubble') FX.splash(p.x, p.y, 'water', .5); p.dead = true; }
        }
      } else if (p.owner === 'hero' && !p.dead) {
        for (const e of this.enemies) if (!e.dead && overlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, e.hitbox())) { e.hurt(p.dmg || 9, Math.sign(p.vx) || 1, { kb: 160 }); H.addUlt(2); p.dead = true; FX.runeBurst(p.x, p.y, p.col || [150, 230, 255], 5); break; }
        if (!p.dead && this.boss && !this.boss.dead) for (const v of this.boss.vulnerable()) if (overlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, v)) { this.boss.hurt(p.dmg || 9, Math.sign(p.vx) || 1, { x: p.x, y: p.y, box: v }, v); p.dead = true; break; }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }
  updateHazards(dt) {
    for (const f of this.fires) { f.t += dt; if (chance(.4)) FX.embers(f.x + R(-f.w / 2, f.w / 2), f.y, 1, 70); }
    this.fires = this.fires.filter(f => f.t < f.life);
    for (const c of this.clouds) { c.t += dt; c.r = c.r0 * (1 + c.t * .2); if (chance(.6)) FX.spawnRaw({ t: 'spore', x: c.x + R(-c.r, c.r) * .7, y: c.y + R(-c.r, c.r) * .5, vx: R(-10, 10), vy: R(-20, 0), g: 0, drag: 1, max: 1, s: R(3, 6), col: c.col }); }
    this.clouds = this.clouds.filter(c => c.t < c.life);
    for (const b of this.bubbles) b.t += dt; this.bubbles = this.bubbles.filter(b => b.t < b.life);
    for (const w of this.waves) { w.x += w.dir * 520 * dt; w.t += dt; const H = this.hero; if (Math.abs(H.x - w.x) < 20 && H.onGround && Math.abs(H.y - w.y) < 20) H.hurt(w.dmg, w.x - w.dir * 10, { kup: 420 }); if (chance(.8)) FX.footstep(w.x, w.y, w.dir, 600); }
    this.waves = this.waves.filter(w => w.t < w.range / 520 && isFinite(this.world.groundY(w.x)));
  }
  /* ================= CUERDAS ================= */
  updateRope(dt) {
    const H = this.hero;
    if (H.rope) {
      const r = H.rope, e = r.end(), p = r.p[r.p.length - 2];
      const mx = Input.moveX(); e.x += mx * 520 * dt * dt * 60 * .5;
      H.x = e.x; H.y = e.y + 40; H.vx = (e.x - e.px) / dt; H.vy = (e.y - e.py) / dt; H.onGround = false; H.jumps = 0; H.airDash = 1;
      if (mx) H.face = Math.sign(mx);
      if (Input.pressed('jump') || H.dead) { r.holder = null; H.rope = null; H.vx = clamp(H.vx * 1.5, -700, 700) + H.face * 120; H.vy = Math.min(-560, H.vy * 1.2 - 300); H.ropeCd = .35; Sound.play('djump'); FX.runeBurst(H.x, H.y - 30, [255, 230, 160], 6); }
      return;
    }
    H.ropeCd = (H.ropeCd || 0) - dt;
    if (H.onGround || H.ropeCd > 0) return;
    for (const r of this.ropes) {
      if (!r.grabbable) continue; const e = r.end();
      if (Math.hypot(H.x - e.x, H.y - 40 - e.y) < 34) { H.rope = r; r.holder = H; e.px = e.x - H.vx * dt; Sound.play('grapple'); Input.rumble(0, .2, 50); break; }
    }
  }
  /* ================= ARENAS Y JEFES ================= */
  updateArenas(dt) {
    const H = this.hero;
    if (!this.arena) {
      for (const a of this.arenas) {
        if (a.done || H.x < a.x0 + 60 || H.x > a.x1 - 60) continue;
        this.arena = a; a.wave = 0; H.lockX = [a.x0, a.x1];
        if (a.bossType) this.startBoss(a);
        else if (a.wordbrawl) this.startWordBrawl(a);
        else { this.spawnWave(a); Sound.setMood(a.boss ? 'elite' : 'combat', { immediate: true }); this.banner(a.boss ? a.name : 'AMBUSH!', a.boss ? 'Mini-jefe' : '¡Emboscada!', a.boss ? '#ffb040' : '#ff6a5a'); }
        break;
      }
      return;
    }
    const a = this.arena;
    if (a.bossType) { if (this.boss && this.boss.dead && this.boss.st === 'dying' && !a.done) { } return; }
    if (a.wordbrawl) { this.updateWordBrawl(a, dt); return; }
    const alive = this.enemies.filter(e => !e.dead && e.arena === a).length;
    if (!alive) {
      a.wave++;
      if (a.wave < a.waves.length) { this.spawnWave(a); FX.text(H.x, H.y - 120, 'WAVE ' + (a.wave + 1), '#ffd25a', 40); }
      else this.clearArena(a);
    }
  }
  spawnWave(a) {
    for (const [type, x, y, o] of a.waves[a.wave] || []) {
      const gy = y ?? this.world.groundY(x); const C = ENEMY_TYPES[type]; if (!C) continue;
      const e = new C(this, x, gy - (y == null ? 0 : 0), Object.assign({ type }, o || {}, { arena: a }));
      if (type === 'brute') { e.st = 'intro'; this.bossBar = e; }
      e.y -= 400; e.vy = 0; if (e.flying) e.y += 400;
      FX.runeBurst(x, gy - 30, [255, 120, 100], 10); this.enemies.push(e);
    }
  }
  clearArena(a) {
    a.done = true; this.arena = null; this.hero.lockX = null; this.bossBar = null;
    Sound.setMood(BIOMES[this.curBiome].music, { key: this.worldDef.key });
    FX.text(this.hero.x, this.hero.y - 140, 'CLEAR!', '#9bffb0', 64); Sound.play('checkpoint');
    this.dropCoins(this.hero.x, this.hero.y - 80, 10 + (a.boss ? 25 : 0));
    this.slow(.25, .6);
  }
  startBoss(a) {
    const C = BOSS_TYPES[a.bossType]; const arena = { x0: a.x0, x1: a.x1, floor: a.floor ?? this.world.groundY((a.x0 + a.x1) / 2) };
    this.heroPush = 0; this.heroPushAir = false; this.boss = new C(this, arena); this.bossArena = a;
    Sound.setMood('boss', { immediate: true, key: this.worldDef.key - 12 }); Sound.setPhase(1);
    Sound.play('roar', a.bossType === 'titan' ? .6 : 1); this.shake(10, 2);
    this.banner(this.boss.nameEn || this.boss.name, this.boss.title, '#ff6a40', true);
  }
  onBossDefeated(b) {
    this.shake(20, 1.4); this.slow(.2, 2.2); Sound.play('explode'); Sound.play('ultFire');
    for (let i = 0; i < 6; i++) setTimeout(() => { FX.slam(b.x + R(-200, 200), (b.arena.floor) - R(0, 200), 1.6); FX.embers(b.x + R(-200, 200), b.arena.floor - R(0, 300), 20, 300); }, i * 220);
    FX.text(this.hero.x, this.hero.y - 160, 'VICTORY!', '#ffe060', 90);
    this.dropCoins(b.x, b.arena.floor - 120, 60); this.gainCrystals(15, b.x, b.arena.floor - 140);
    this.heroPush = 0; UI.brawlBanner(null); setTimeout(() => { this.boss = null; if (this.bossArena) { this.bossArena.done = true; } this.arena = null; this.hero.lockX = null; Sound.setMood('victory', { immediate: true }); }, 2600);
  }
  onEnemyKilled(e) {
    this.stats.enemies++; this.hero.addUlt(7); if (e.coins) this.dropCoins(e.x, e.y - e.h / 2, Math.max(1, Math.round(e.coins * R(.7, 1.3))));
    if (chance(.06)) this.dropItem(e.x, e.y - 20, 'crystal');
    if (!Store.data.seenEnemies) Store.data.seenEnemies = {};
    if (e === this.bossBar) this.bossBar = null;
  }
  /* ================= MUERTE Y RESPAWN ================= */
  fallDeath() { const H = this.hero; H.hp -= 20 * this.dmgMul(); FX.text(H.x, H.y - 200, 'OUCH!', '#ff8080', 40); if (H.hp <= 0) { H.hp = 0; H.die(); } else this.respawnAtCheckpoint(true); }
  heroInLava(L) {
    const H = this.hero; if (H.dead) return;
    if (this.effects.jelly) { H.vy = -900; Sound.play('bounce'); FX.splash(H.x, L.curLevel, 'water', 1); return; }
    H.inv = 0; H.hp -= 35 * this.dmgMul(); FX.splash(H.x, L.curLevel, 'lava', 1.4); Sound.play('splash', true); this.flashScreen([255, 120, 40], .5);
    if (H.hp <= 0) { H.hp = 0; H.die(); } else { FX.text(H.x, H.y - 120, 'HOT HOT HOT!', '#ffb040', 40); this.respawnAtCheckpoint(true); }
  }
  respawnAtCheckpoint(keepHp) {
    const H = this.hero, hp = H.hp; H.respawn(this.cpPos.x, this.world.groundY(this.cpPos.x) < 1e5 ? this.world.groundY(this.cpPos.x) : this.cpPos.y);
    if (keepHp) H.hp = hp; for (const o of this.objects) if (o.reset) o.reset();
    this.snapCamera();
  }
  onHeroDeath() {
    this.stats.deaths++; Sound.play('die'); this.slow(.25, 1.2); Input.rumble(1, 1, 400);
    FX.text(this.hero.x, this.hero.y - 100, 'K.O.', '#ff5a5a', 70);
    setTimeout(() => {
      if (this.mode !== 'play') return;
      if (this.arena && !this.arena.bossType) { for (const e of this.enemies) if (e.arena === this.arena) e.dead = true; this.arena.wave = 0; this.arena = null; }
      if (this.boss) { const a = this.bossArena; this.boss = null; a.done = false; this.arena = null; this.heroPush = 0; UI.brawlBanner(null); }
      // reaparecen los enemigos por delante del punto de control
      const alive = new Set(this.enemies.filter(e => !e.dead).map(e => e.spawnId));
      for (const s of this.enemySpawns) if (!alive.has(s.id) && s.x > this.cpPos.x + 200) this.spawnEnemyDef(s);
      this.hero.lockX = null; this.respawnAtCheckpoint(false);
      Sound.setMood(BIOMES[this.curBiome].music, { key: this.worldDef.key, force: true });
      UI.toast('Try again! You can do it.', '¡Inténtalo de nuevo! Tú puedes.');
    }, 1600);
  }
  setCheckpoint(cp) { this.checkpoint = cp; this.cpPos = { x: cp.x + 30, y: cp.y }; }
  /* ================= INTERACCIÓN ================= */
  updateInteract() {
    const H = this.hero; let best = null, bd = 1e9;
    for (const o of this.objects) { const p = o.prompt && o.prompt(); if (!p) continue; const d = Math.abs(o.x - H.x); if (d < bd) { bd = d; best = { o, p }; } }
    this.interactTarget = best;
    // etiquetas de objetos cercanos (aprender el nombre en inglés)
    let lab = null, ld = 110;
    for (const p of this.props) { const d = Math.hypot(p.x - H.x, p.y - H.y); if (d < ld) { ld = d; lab = { x: p.x, y: p.y - p.h - 10, en: PROP_NAMES[p.type][0], es: PROP_NAMES[p.type][1], verb: ['Hit it', 'Golpéalo'] }; } }
    for (const o of this.objects) if (typeof o.label === "function" && Math.abs(o.x - H.x) < 120 && Math.abs(o.y - H.y) < 140) { const L = o.label(); if (!L) continue; const d = Math.abs(o.x - H.x); if (d < ld) { ld = d; lab = Object.assign({ x: o.x, y: (o.labelY ? o.labelY() : o.y - 100) }, L); } }
    for (const r of this.ropes) if (r.grabbable) { const e = r.end(); const d = Math.hypot(e.x - H.x, e.y - H.y); if (d < ld) { ld = d; lab = { x: e.x, y: e.y - 30, en: 'Rope', es: 'cuerda', verb: ['Jump and grab it', 'Salta y agárrala'] }; } }
    if (this.decor) for (const p of this.decor.palms) if (Math.abs(p.x - H.x) < 50 && ld > 60) { ld = 60; lab = { x: p.x, y: H.y - 120, en: 'Palm tree', es: 'palmera', verb: ['Hit it: coconuts!', '¡Golpéala: cocos!'] }; }
    this.label = lab;
  }
  tryInteract() {
    const t = this.interactTarget; if (!t || this.cinematic) return false;
    return t.o.interact();
  }
  /* ================= MISIONES ================= */
  updateQuest() {
    const H = this.hero; if (!H.carry) return;
    H.carry.bob = (H.carry.bob || 0) + 1 / 60;
  }
  startQuest(npc, q) {
    if (this.questsDone.has(q.id)) return;
    this.quest = Object.assign({ npc }, q);
    const it = QUEST_ITEMS[q.item], tg = q.target ? QUEST_TARGETS[q.target] : null, who = NPCS[q.giver || npc.npc].name;
    this.quest.en = q.kind === 'bring' ? `Find the ${it[0]} and bring it to me.` : `Find the ${it[0]} and put it in the ${tg[0]}.`;
    this.quest.es = q.kind === 'bring' ? `Encuentra el/la ${it[1]} y tráemelo/a.` : `Encuentra el/la ${it[1]} y ponlo/a en el/la ${tg[1]}.`;
    this.quest.short = q.kind === 'bring' ? [`Bring the ${it[0]} to ${who.split(' ')[0]}`, `Lleva: ${it[1]} → ${who.split(' ')[0]}`] : [`Put the ${it[0]} in the ${tg[0]}`, `Pon: ${it[1]} → ${tg[1]}`];
    Sound.play('select'); UI.questUpdate(this.quest);
  }
  completeQuest() {
    const q = this.quest; if (!q) return; this.questsDone.add(q.id); this.quest = null; this.hero.carry = null; this.stats.quests++;
    Sound.play('correct'); FX.celebrate(this.hero.x, this.hero.y - 60); FX.text(this.hero.x, this.hero.y - 150, 'QUEST COMPLETE!', '#9bffb0', 46);
    this.dropCoins(this.hero.x, this.hero.y - 80, 25); this.gainCrystals(3, this.hero.x, this.hero.y - 90); if (chance(.3)) this.giftCosmetic(this.hero.x, this.hero.y - 100);
    UI.questUpdate(null); Input.rumble(.3, .5, 300);
  }
  /* ================= RECOMPENSAS ================= */
  dropCoins(x, y, n) { for (let i = 0; i < n; i++) { const c = new Coin(this, { x, y, vx: R(-260, 260), vy: R(-520, -200), free: true }); this.objects.push(c); } }
  dropItem(x, y, type) { if (type === 'crystal') { const c = new Crystal(this, { x, y, vx: R(-120, 120), vy: R(-400, -200), free: true }); this.objects.push(c); } }
  collectCoin(x, y) { this.stats.coins++; Store.data.coins = (Store.data.coins || 0) + 1; Sound.play('coin'); if (chance(.3)) FX.spawnRaw({ t: 'star', x, y, vx: R(-40, 40), vy: -80, g: 0, max: .4, s: 3, col: [255, 230, 120], rot: 0, vr: 6, add: 1 }); }
  gainCrystals(n, x, y) { this.stats.crystals += n; Store.data.crystals = (Store.data.crystals || 0) + n; if (x !== undefined) FX.text(x, y, '+' + n + ' ◆', '#9be6ff', 30); Sound.play('pickup'); Store.save(); }
  giftCosmetic(x, y, rare) {
    const locked = []; for (const cat in LOOK) for (const p of LOOK[cat]) if (!lookOwned(cat, p.id) && (rare ? p.price >= 300 : p.price < 400)) locked.push([cat, p]);
    if (!locked.length) { this.dropCoins(x, y, 30); return; }
    const [cat, p] = pick(locked); Store.data.owned = Store.data.owned || {}; Store.data.owned[cat + ':' + p.id] = 1; Store.save();
    FX.celebrate(x, y); UI.toast('New outfit piece: ' + p.name + '!', '¡Nueva pieza para tu armario: ' + p.name + '! (Menú → Armario)', true);
  }
  collectLetter(l) {
    this.stats.letters.add(l.ch + ':' + l.x); this.wordFound.add(l.x + '');
    Sound.play('correct'); FX.celebrate(l.x, l.y); FX.text(l.x, l.y - 60, l.ch, '#ffd040', 80); Input.rumble(.2, .5, 200);
    const total = this.objects.filter(o => o instanceof Letter).length, got = this.objects.filter(o => o instanceof Letter && o.done).length;
    UI.letters(this);
    if (got === total) { const w = this.meta.word; setTimeout(() => { this.banner(w[0], `= ${w[1]}${w[2] ? ' · ' + w[2] : ''}`, '#ffd040'); Speech.say(w[0].toLowerCase(), .8); this.gainCrystals(5); }, 400); }
  }
  unlockSecret(id, x, y) {
    if (!id) return; Store.data.secrets = Store.data.secrets || {}; Store.data.secrets[id] = 1; Store.save(true);
    const P = new Portal(this, { x, y, level: id }); this.objects.push(P); Sound.play('gate'); FX.celebrate(x, y - 60);
    this.banner('SECRET LEVEL!', 'Nivel secreto desbloqueado: ' + SECRET_LEVELS[id].name, '#c88aff');
  }
  enterSecret(id) { UI.confirmSecret(id); }
  levelClearReady() { return !this.boss && !(this.arena && this.arena.bossType && !this.arena.done); }
  /* ================= UTILIDADES ================= */
  windAt(x, y) { let f = 0; for (const w of this.world ? this.world.winds || [] : []) if (x > w.x0 && x < w.x1 && y > w.y0 && y < w.y1) f += w.force * (.6 + .4 * Math.sin(this.t * 1.3 + x * .002)) * (Math.sin(this.t * .5) > -.3 ? 1 : .2); return f; }
  dmgMul() { return { relax: .5, normal: 1, hard: 1.4, night: 2 }[Store.data.settings.diff] || 1; }
  shake(a, t) { if (Store.data.settings.reduced) a *= .25; a *= Store.data.settings.shake ?? 1; this.cam.shake = Math.max(this.cam.shake, a); this.cam.shakeT = Math.max(this.cam.shakeT, t); }
  slow(scale, t) { this.timeScale = scale; this.slowT = t; }
  flashScreen(col, a) { if (Store.data.settings.reduced) a *= .4; this.flash = { col, a }; }
  flashGlint(x, y) { FX.spawnRaw({ t: 'flash', x, y, max: .15, s: 40, col: [255, 255, 255], add: 1 }); }
  toast(es, en) { UI.toast(en || TX[es] || es, TX[es] ? es : (en ? es : '')); }
  banner(en, es, col, big) { UI.banner(en, es, col, big); }
  say(npc, en, es) { npc.bubble = { en, es, t: 0 }; this.seePhrase(en); }
  phraseKnown(en) { return ((Store.data.phr || {})[en] || 0) >= PHRASE_KNOWN; }
  seePhrase(en) { const d = Store.data; d.phr = d.phr || {}; d.phr[en] = (d.phr[en] || 0) + 1; }
  showEs(en) { return this.translateT > 0 || !this.phraseKnown(en); }
  translatePressed() {
    if (this.translateT > 0) return;
    const cost = 3; if ((Store.data.coins || 0) < cost) { UI.toast('Not enough coins to translate', 'No tienes monedas para traducir'); return; }
    Store.data.coins -= cost; this.translateT = 6; this.stats.translations++; Sound.play('select');
    UI.toast('TRANSLATE: -3 coins', 'Traducción activada 6 s (−3 monedas). Las palabras que traduzcas volverán en tus preguntas.');
    if (this.label) { Store.data.tags[this.label.en.toLowerCase()] = (Store.data.tags[this.label.en.toLowerCase()] || 0) + 1; }
  }
  spawnProjectile(o) { this.projectiles.push(Object.assign({ delay: 0, life: 3, r: 8 }, o)); }
  spawnCloud(x, y, r, life, col) { this.clouds.push({ x, y, r, r0: r, life, t: 0, col }); }
  spawnFire(x, y, w, life) { this.fires.push({ x, y, w, life, t: 0 }); }
  spawnTimeBubble(x, y, r, life) { this.bubbles.push({ x, y, r, life, t: 0 }); }
  spawnShockwave(x, y, dir, range, dmg) { this.waves.push({ x, y, dir, range, dmg, t: 0 }); }
  explosion(x, y, r, dmg, owner) {
    FX.slam(x, y, 1); FX.embers(x, y, 14, 260); Sound.play('explode'); this.shake(8, .3); FX.text(x, y - 40, 'BOOM!', '#ffb040', 40);
    const H = this.hero; if (Math.hypot(H.x - x, H.y - 30 - y) < r) H.hurt(dmg, x);
    for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - e.h / 2 - y) < r) e.hurt(dmg * (owner === 'hero' ? 1.5 : .5), Math.sign(e.x - x) || 1, { kb: 300, up: true });
    for (const p of this.props) if (Math.hypot(p.x - x, p.y - y) < r) p.hit(20, Math.sign(p.x - x) || 1, { kb: 400, up: true });
  }
  areaDamage(x, y, r, dmg, info = {}) {
    for (const e of this.enemies) if (!e.dead && Math.abs(e.x - x) < r && Math.abs(e.y - e.h / 2 - y) < r * .6) { e.hurt(dmg, Math.sign(e.x - x) || 1, Object.assign({ kb: 280, up: info.up }, info)); }
    if (this.boss) for (const v of this.boss.vulnerable()) if (overlap({ x: x - r, y: y - r * .6, w: r * 2, h: r * 1.2 }, v)) { this.boss.hurt(dmg, 1, { x, y, heavy: true, box: v }, v); break; }
    for (const p of this.props) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r * .6) p.hit(dmg, Math.sign(p.x - x) || 1, { kb: 300, up: true });
    if (this.decor) for (const p of this.decor.palms) if (Math.abs(p.x - x) < r) this.shakePalm(p);
  }
  dealAreaToHero(x, y, r, dmg, unblockable, kind) { const H = this.hero; if (Math.abs(H.x - x) < r && Math.abs(H.y - 30 - y) < r * .8) { if (kind === 'beam' && H.dashT > 0) return; H.hurt(dmg, x, { unblockable, kup: 480 }); } }
  shakePalm(p) { if (p.cd > this.t) return; p.cd = this.t + 2; p.hitT = this.t; const c = new Prop(this, 'coconut', p.x + R(-10, 10), p.y - p.h * p.s); c.vy = 50; this.props.push(c); FX.leaves(p.x, p.y - p.h * p.s, 8, [[80, 150, 60], [110, 170, 70]]); }
  scareEnemies(x, y, r) { let n = 0; for (const e of this.enemies) if (!e.dead && Math.abs(e.x - x) < r && Math.abs(e.y - y) < 160) { n++; e.scared = 1; if (!e.heavy) { e.vx = Math.sign(e.x - x) * 260; e.stun = .4; } } return n; }
  nearestEnemy(x, y, r, face, not) { let best = null, bd = r; for (const e of this.enemies) { if (e.dead || e === not) continue; if (face && Math.sign(e.x - x) !== face) continue; const d = Math.hypot(e.x - x, e.y - e.h / 2 - y); if (d < bd) { bd = d; best = e; } } return best; }
  findGrapple(h) { let best = null, bd = 300; for (const o of this.objects) if (o instanceof Ring) { const d = Math.hypot(o.x - h.x, o.y - (h.y - 30)); if (d < bd && o.y < h.y - 20 && Math.sign(o.x - h.x) !== -h.face * 1 || (d < bd && Math.abs(o.x - h.x) < 60)) { bd = d; best = o; } } return best; }
  lightning(x0, y0, x1, y1) { this.bolts = this.bolts || []; this.bolts.push({ x0, y0, x1, y1, t: 0 }); Sound.play('zap'); }
  onParry(h, src) {
    Sound.play('parry'); Input.rumble(.6, .8, 120); this.flashScreen([255, 255, 255], .35);
    h.hitstop = .12; if (src && src.inv !== undefined) src.stun = Math.max(src.stun || 0, .5);
    FX.ring(h.x + h.face * 20, h.y - 34, [255, 255, 255], 70, .3, false); FX.sparks(h.x + h.face * 20, h.y - 34, [255, 255, 220], 18, h.face, 500);
    FX.text(h.x, h.y - 100, 'PARRY!', '#ffffff', 46); this.slow(.3, .35);
    if (src && src.boss) src.hurt(25, h.face, { x: h.x + h.face * 40, y: h.y - 40, heavy: true }, { mul: 1 });
  }
  /* ================= BIOMA / CÁMARA ================= */
  updateBiome() {
    const z = this.world.biomeAt(this.hero.x), cur = z.t > .5 ? z.b : z.a;
    if (cur !== this.curBiome) {
      this.curBiome = cur; const B = BIOMES[cur];
      UI.areaName(B.name, this.worldDef.font);
      if (!this.arena && !this.boss) Sound.setMood(B.music || 'beach', { key: this.worldDef.key });
    }
    // intensidad musical según peligro
    Sound.setIntensity(this.inCombat ? 1 : .8);
  }
  snapCamera() { const H = this.hero; this.cam.x = H.x - this.VW * .45; this.cam.y = H.y - VH * .62; this.clampCam(); this.cam.fx = this.cam.x; this.cam.fy = this.cam.y; }
  clampCam() { const B = this.world.bounds; this.cam.x = clamp(this.cam.x, B.x0, B.x1 - this.VW); this.cam.y = clamp(this.cam.y, B.y0, B.y1 - VH); }
  updateCamera(dt) {
    const H = this.hero, c = this.cam;
    let tx = H.x - this.VW * .45 + H.face * 70 + H.lookX + clamp(H.vx * .18, -90, 90), ty = H.y - VH * .6 + H.lookY;
    if (H.vy > 600) ty += 80;
    const lockA = this.arena && (this.arena.bossType || this.arena.boss);
    if (lockA) { const a = this.arena; tx = (a.x0 + a.x1) / 2 - this.VW / 2; if (a.bossType) ty = (a.floor ?? H.y) - VH * .78; }
    if (this.arena && !lockA) tx = clamp(tx, this.arena.x0 - 60, this.arena.x1 + 60 - this.VW);
    c.fx = lerp(c.fx, tx, Math.min(1, dt * 5)); c.fy = lerp(c.fy, ty, Math.min(1, dt * (H.onGround ? 4 : 2.2)));
    c.x = c.fx; c.y = c.fy; this.clampCam(); c.fx = c.x; c.fy = c.y;
    if (c.shakeT > 0) { c.shakeT -= dt; c.sx = (Math.random() - .5) * c.shake; c.sy = (Math.random() - .5) * c.shake; if (c.shakeT <= 0) c.shake = 0; } else { c.sx = c.sy = 0; }
    c.zoom = lerp(c.zoom, c.tz, Math.min(1, dt * 6));
    this.flash.a = Math.max(0, this.flash.a - dt * 1.8);
  }
}
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function circleRect(c, r) { const x = clamp(c.x, r.x, r.x + r.w), y = clamp(c.y, r.y, r.y + r.h); return (c.x - x) ** 2 + (c.y - y) ** 2 < c.r * c.r; }
const PROP_NAMES = { barrel: ['Barrel', 'barril'], crate: ['Box', 'caja'], coconut: ['Coconut', 'coco'], rock: ['Rock', 'roca'], pot: ['Pot', 'vasija'], log: ['Log', 'tronco'] };

/* objetos adicionales: cartel del nivel, objetos de misión */
class LevelSign extends LevelObject { draw(g) { } }
class QuestItem extends LevelObject {
  label() { return this.done ? null : { en: QUEST_ITEMS[this.item][0], es: QUEST_ITEMS[this.item][1], verb: ['Pick it up', 'Recógelo'] }; }
  labelY() { return this.y - 40; }
  prompt() { return !this.done && this.heroNear(60, 80) ? { act: 'interact', text: 'Pick up' } : null; }
  interact() {
    if (this.done) return false; const G = this.game;
    if (G.hero.carry) { G.toast('Ya llevas algo en las manos', 'Your hands are full'); return true; }
    this.done = true; G.hero.carry = { item: this.item, qid: this.qid }; Sound.play('pickup'); FX.runeBurst(this.x, this.y, [255, 230, 160], 8);
    FX.text(this.x, this.y - 50, QUEST_ITEMS[this.item][0].toUpperCase() + '!', '#fff', 30);
    if (!G.quest || G.quest.id !== this.qid) G.toast(`You found a ${QUEST_ITEMS[this.item][0]}. Someone needs it...`, `Has encontrado: ${QUEST_ITEMS[this.item][1]}. Alguien lo necesita...`);
    return true;
  }
  draw(g) { if (!this.done) drawQuestItem(g, this.item, this.x, this.y + Math.sin(this.t * 2.4) * 4, 1); }
  drawGlow(g) { if (!this.done) glowAt(g, [255, 240, 180], this.x, this.y, 36, .5); }
}
class QuestTarget extends LevelObject {
  label() { return { en: QUEST_TARGETS[this.target][0], es: QUEST_TARGETS[this.target][1], verb: ['Put something in it', 'Pon algo dentro'] }; }
  labelY() { return this.y - 60; }
  prompt() { const H = this.hero; return !this.done && H.carry && H.carry.qid === this.qid && this.heroNear(70, 80) ? { act: 'interact', text: 'Put it in' } : null; }
  interact() { const G = this.game, H = G.hero; if (this.done || !H.carry || H.carry.qid !== this.qid) return false; this.done = true; this.filled = H.carry.item; G.completeQuest(); return true; }
  draw(g) {
    const t = this.target, x = this.x, y = this.y; g.save(); g.translate(x, y);
    if (t === 'basket') { g.fillStyle = '#b8864a'; g.beginPath(); g.moveTo(-22, -26); g.lineTo(22, -26); g.lineTo(16, 0); g.lineTo(-16, 0); g.fill(); g.strokeStyle = '#7a5428'; g.lineWidth = 2; for (let i = -18; i < 20; i += 6) { g.beginPath(); g.moveTo(i, -26); g.lineTo(i * .75, 0); g.stroke(); } g.beginPath(); g.arc(0, -26, 20, Math.PI, 0); g.stroke(); }
    else if (t === 'nest') { g.fillStyle = '#8a6a3a'; g.beginPath(); g.ellipse(0, -8, 24, 10, 0, 0, TAU); g.fill(); g.strokeStyle = '#5a4020'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(-24 + i * 6, -4); g.lineTo(-18 + i * 6, -14); g.stroke(); } }
    else if (t === 'altar') { g.fillStyle = '#8a8a9a'; g.fillRect(-22, -30, 44, 30); g.fillStyle = '#aaaab8'; g.fillRect(-26, -34, 52, 6); }
    else if (t === 'table') { g.fillStyle = '#8a5a2a'; g.fillRect(-26, -30, 52, 6); g.fillRect(-22, -24, 5, 24); g.fillRect(17, -24, 5, 24); }
    else { g.fillStyle = t === 'bag' ? '#a86a3a' : '#b88a50'; g.beginPath(); g.roundRect(-20, -32, 40, 32, 4); g.fill(); g.strokeStyle = '#6a4a24'; g.lineWidth = 2; g.stroke(); }
    if (this.filled) drawQuestItem(g, this.filled, 0, -36, .9);
    g.restore();
  }
  drawGlow(g) { const H = this.hero; if (!this.done && H.carry && H.carry.qid === this.qid) glowAt(g, [160, 255, 180], this.x, this.y - 20, 60, .5 + Math.sin(this.t * 4) * .2); }
}
function drawQuestItem(g, item, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const C = { shell: '#ffd8c8', apple: '#e83a3a', key: '#ffd040', book: '#5a7ad8', fish: '#7ab8e8', flower: '#ff7ab0', lamp: '#ffd27a', map: '#e8d8a8', ring: '#ffd040', cup: '#f0f0f0', hat: '#5a3a8a', letter: '#f8f0e0', bottle: '#7ae8a0', egg: '#fff6e0', bell: '#e8c050', feather: '#e8f0ff', stone: '#9aa0b0', candle: '#fff0d0' }[item] || '#fff';
  g.fillStyle = C; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.5;
  if (item === 'key') { g.beginPath(); g.arc(-6, 0, 5, 0, TAU); g.fill(); g.fillRect(-2, -1.5, 14, 3); g.fillRect(8, 0, 2, 5); g.fillRect(4, 0, 2, 4); }
  else if (item === 'book' || item === 'map' || item === 'letter') { g.fillRect(-9, -7, 18, 14); g.strokeRect(-9, -7, 18, 14); g.beginPath(); g.moveTo(0, -7); g.lineTo(0, 7); g.stroke(); }
  else if (item === 'fish') { g.beginPath(); g.ellipse(0, 0, 10, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-8, 0); g.lineTo(-15, -5); g.lineTo(-15, 5); g.fill(); }
  else if (item === 'flower') { for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(Math.cos(i * 1.256) * 4, Math.sin(i * 1.256) * 4 - 4, 3, 0, TAU); g.fill(); } g.fillStyle = '#3c6a2b'; g.fillRect(-1, 0, 2, 9); }
  else if (item === 'apple') { g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.fillStyle = '#3c6a2b'; g.fillRect(-1, -10, 2, 4); }
  else if (item === 'feather') { g.beginPath(); g.ellipse(0, 0, 3, 10, .5, 0, TAU); g.fill(); }
  else { g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.stroke(); }
  g.restore();
}
