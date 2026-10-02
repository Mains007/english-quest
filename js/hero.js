"use strict";
/* =====================================================================
   HÉROE — «Lio», caballero rúnico explorador
   Movimiento: correr, sprint, salto variable, doble salto, deslizarse y
   saltar en paredes, esquiva con invulnerabilidad, golpe sísmico, garfio.
   Combate: combo, ataque cargado, golpe abajo (rebote), golpe arriba,
   bloqueo, parada perfecta + contraataque, disparo rúnico, grito,
   PALABRA DE PODER (ataque definitivo con pregunta de inglés).
   ===================================================================== */
const WEAPONS = {
  sword:    { name: 'Espada Rúnica', es: 'Equilibrada. Combo rápido y giro cargado.', dmg: [12, 12, 22], reach: 66, hh: 46, speed: 1, hits: 3, col: [150, 230, 255], ult: 'Tajo del Alba', ep: 0, cost: 0 },
  spear:    { name: 'Lanza de Marea', es: 'Gran alcance. Atraviesa a varios enemigos.', dmg: [10, 10, 19], reach: 100, hh: 26, speed: .95, hits: 3, pierce: 1, col: [110, 220, 255], ult: 'Diluvio de Lanzas', ep: 250, cost: 30 },
  hammer:   { name: 'Martillo de Brasa', es: 'Lento pero brutal. Rompe armaduras.', dmg: [24, 24, 42], reach: 74, hh: 58, speed: .7, hits: 3, armor: 2.2, col: [255, 150, 60], ult: 'Meteoro Forjado', ep: 600, cost: 60 },
  gauntlet: { name: 'Guanteletes del Rayo', es: 'Ráfagas veloces de 4 golpes eléctricos.', dmg: [7, 7, 7, 15], reach: 50, hh: 40, speed: 1.55, hits: 4, col: [255, 240, 120], ult: 'Mil Relámpagos', ep: 1100, cost: 90 }
};
const SKINS = {
  explorer: { name: 'Explorador', cloak: ['#3a8389', '#1b3c45'], hood: ['#4da0a3', '#245159'], scarf: ['#c2432f', '#a63526'], trim: '#5a3b22', eye: [255, 227, 154], boot: '#3e2b1f' },
  corsair:  { name: 'Corsario', cloak: ['#2c3e6a', '#16203c'], hood: ['#3b5288', '#1e2c52'], scarf: ['#e8e2d6', '#c23a2e'], trim: '#c9a23a', eye: [255, 240, 200], boot: '#2a1a12', hat: 'tricorn' },
  ranger:   { name: 'Guardabosques', cloak: ['#4f7a3a', '#2a4424'], hood: ['#6a9a48', '#335428'], scarf: ['#8a5a2a', '#6a4220'], trim: '#3e2a18', eye: [210, 255, 170], boot: '#3a2a1a', leaf: 1 },
  forge:    { name: 'Herrero de Magma', cloak: ['#3a2c2c', '#1a1212'], hood: ['#4a3434', '#221818'], scarf: ['#ff8a2a', '#d4521a'], trim: '#ff6a20', eye: [255, 150, 60], boot: '#1a1010', glowTrim: 1 },
  aurora:   { name: 'Aurora', cloak: ['#e8e6ff', '#8a7ad8'], hood: ['#ffffff', '#a698e8'], scarf: ['#7af0ff', '#4ab0e8'], trim: '#ffd86a', eye: [140, 240, 255], boot: '#5a4a8a', halo: 1 },
  shadow:   { name: 'Sombra', cloak: ['#2a2434', '#0e0c14'], hood: ['#3a3248', '#16121e'], scarf: ['#8a3ad8', '#5a1a9a'], trim: '#8a3ad8', eye: [255, 70, 90], boot: '#120e18' }
};

class Hero {
  constructor(game, x, y) {
    this.game = game; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = 24; this.h = 58;
    this.face = 1; this.onGround = false; this.wall = 0;
    this.maxHp = 100 + (Store.data.unlocked.skills.heart || 0) * 20; this.hp = this.maxHp;
    this.stamina = 100; this.staminaT = 0; this.ult = 0; this.ultCd = 0; this.exposed = 0;
    this.flasks = 3 + (Store.data.unlocked.skills.flask ? 1 : 0); this.maxFlasks = this.flasks; this.runes = 3; this.runeT = 0;
    this.coyote = 0; this.buf = 0; this.jumps = 0; this.airDash = 1; this.dashT = 0; this.dashCd = 0; this.inv = 0; this.ctrlLock = 0;
    this.state = 'idle'; this.stT = 0; this.phase = 0; this.sq = 1;
    this.atk = null; this.combo = 0; this.comboT = 0; this.swing = 0; this.charge = 0; this.chargeLvl = 0;
    this.blocking = false; this.blockT = 0; this.parryCd = 0; this.counterT = 0;
    this.healT = 0; this.tauntCd = 0; this.sprint = false; this.grapple = null; this.pound = false;
    this.weapon = Store.data.weapon || 'sword'; this.skin = Store.data.skin || 'explorer';
    this.hitstop = 0; this.dropT = 0; this.landVy = 0; this.lantA = 0; this.lantV = 0; this.blink = 3;
    this.scarf = []; for (let i = 0; i < 7; i++) this.scarf.push({ x: x - i * 6, y: y - 44, px: x - i * 6, py: y - 44 });
    this.cape = []; for (let i = 0; i < 5; i++) this.cape.push({ x: x - 4, y: y - 40 + i * 6, px: x - 4, py: y - 40 + i * 6 });
    this.stepAcc = 0; this.dead = false; this.lookX = 0; this.lookY = 0; this.comboCount = 0; this.comboTimer = 0; this.ghostT = 0;
    this.skills = Store.data.unlocked.skills;
  }
  get W() { return WEAPONS[this.weapon]; }
  get canAct() { return !this.dead && this.ctrlLock <= 0 && !this.game.cinematic; }

  /* =================== ACTUALIZACIÓN =================== */
  update(dt) {
    const G = this.game, world = G.world, In = Input;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.hurtFlash = Math.max(0, (this.hurtFlash || 0) - dt); updateShield(this, dt);
    this.stT += dt; this.inv = Math.max(0, this.inv - dt); this.ctrlLock -= dt; this.dashCd -= dt; this.parryCd -= dt; this.counterT -= dt;
    this.tauntCd -= dt; this.ultCd = Math.max(0, this.ultCd - dt); this.exposed = Math.max(0, this.exposed - dt); this.comboTimer -= dt; if (this.comboTimer <= 0) this.comboCount = 0;
    this.staminaT -= dt; if (this.staminaT <= 0) this.stamina = Math.min(100, this.stamina + 42 * dt);
    this.runeT += dt; if (this.runeT > 4 && this.runes < 3) { this.runes++; this.runeT = 0; }
    const [lx, ly] = In.look(); this.lookX = lerp(this.lookX, lx * 220, Math.min(1, dt * 5)); this.lookY = lerp(this.lookY, ly * 160, Math.min(1, dt * 5));
    if (this.dead) { this.vx *= .9; this.vy += 2000 * dt; world.move(this, dt); return; }

    const mx = this.canAct ? In.moveX() : 0;
    const wantDown = this.canAct && In.down('down');
    // --- entradas instantáneas
    if (this.canAct) {
      if (In.pressed('jump')) this.buf = .13;
      if (In.pressed('dash')) this.tryDash(mx);
      if (In.pressed('attack')) { this.attackPressedT = 0; this.atkQueued = true; }
      if (In.down('attack') && this.atkQueued !== undefined) { this.attackPressedT = (this.attackPressedT || 0) + dt; if (this.attackPressedT > .42 && !this.atk && !this.chargeLvl) { this.chargeLvl = 1; Sound.play('charge'); } }
      if (In.released('attack')) { if (this.chargeLvl) this.startCharged(); this.attackPressedT = 0; }
      if (In.pressed('interact')) { if (!G.tryInteract()) this.runeShot(); }
      if (In.pressed('ult')) G.requestUlt();
      if (In.pressed('heal')) this.healT = .001;
      if (In.pressed('grapple')) this.tryGrapple();
      if (In.pressed('sprint')) { this.sprint = !this.sprint; G.toast(this.sprint ? 'Carrera rúnica: ACTIVADA' : 'Carrera rúnica: desactivada'); }
      if (In.pressed('taunt')) this.taunt();
      if (In.pressed('wprev')) this.cycleWeapon(-1);
      if (In.pressed('wnext')) this.cycleWeapon(1);
    }
    // --- bloqueo / parada
    const blockHeld = this.canAct && In.down('block') && !this.dashT && this.exposed <= 0;
    if (blockHeld && !this.blocking) { this.blocking = true; this.blockT = 0; }
    if (!blockHeld) this.blocking = false;
    if (this.blocking) this.blockT += dt;
    // --- curar (mantener)
    if (this.healT > 0) {
      if (!this.canAct || !In.down('heal') || this.flasks <= 0 || this.hp >= this.maxHp || !this.onGround) { if (this.flasks <= 0 && this.healT < .05) G.toast('No te quedan frascos de luz'); this.healT = 0; }
      else { this.healT += dt; if (chance(dt * 30)) FX.spawnRaw({ t: 'trail', x: this.x + R(-14, 14), y: this.y - R(0, 60), vx: 0, vy: -60, g: 0, max: .6, s: 4, col: [255, 230, 140], add: 1 });
        if (this.healT > .9) { this.flasks--; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .45); this.healT = 0; Sound.play('heal'); FX.runeBurst(this.x, this.y - 30, [255, 230, 140], 12); FX.text(this.x, this.y - 80, '+VIDA', '#ffe9a0', 34); Input.rumble(.1, .3, 120); } }
    }
    // --- garfio
    if (this.grapple) { this.updateGrapple(dt); }
    // --- esquiva
    if (this.dashT > 0) {
      this.dashT -= dt; this.vy = this.pound ? this.vy : 0;
      this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = .03; FX.afterimage(this.snapshot()); }
      if (this.dashT <= 0) { this.vx *= .45; }
    } else if (!this.grapple) {
      // --- movimiento horizontal
      const sprintK = this.sprint && !G.inCombat ? 1.32 : 1;
      let max = 292 * sprintK * (this.blocking ? .42 : 1) * (this.healT > 0 ? .2 : 1) * (this.atk && this.onGround ? (this.whirling ? .72 : .35) : 1) * (G.timeSlowHero || 1);
      const liq = world.liquidAt(this.x, this.y - 10); if (liq && liq.type === 'water') max *= .62;
      const wind = G.windAt(this.x, this.y);
      const accel = this.onGround ? 2700 : 1750;
      if (this.ctrlLock <= 0) {
        if (mx) { this.vx = approach(this.vx, mx * max, accel * dt * (Math.sign(mx) !== Math.sign(this.vx) ? 1.6 : 1)); if (!this.atk) this.face = Math.sign(mx); }
        else this.vx = approach(this.vx, 0, (this.onGround ? 3200 : 900) * dt);
      }
      this.vx += wind * dt;
      // --- gravedad
      let grav = 2050; const held = this.canAct && In.down('jump');
      if (this.vy > 0) grav *= 1.62; else if (!held) grav *= 2.2;
      if (Math.abs(this.vy) < 95 && held && !this.onGround) grav *= .5;  // flotar en el ápice
      if (liq && liq.type === 'water') grav *= .35;
      if (this.pound) grav = 0;
      this.vy = Math.min(this.vy + grav * dt, liq && liq.type === 'water' ? 160 : 1150);
      // deslizarse por la pared
      this.wallSliding = false;
      if (!this.onGround && this.wall && mx === this.wall && this.vy > 0 && !this.pound) {
        this.vy = Math.min(this.vy, 135); this.wallSliding = true; this.face = -this.wall; this.jumps = 0; this.airDash = 1;
        if (chance(dt * 18)) FX.spawnRaw({ t: 'dust', x: this.x + this.wall * 12, y: this.y - 40, vx: -this.wall * 20, vy: -20, g: 0, drag: 3, max: .4, s: 2, s1: 6, col: [200, 190, 170], a: .5 });
      }
    }
    // --- saltos
    this.coyote = this.onGround ? .1 : this.coyote - dt; this.buf -= dt;
    if (this.buf > 0 && this.canAct) {
      if (this.onGround && wantDown && this.plat && !this.plat.solid) { this.dropT = .25; this.buf = 0; this.onGround = false; this.y += 2; }
      else if (this.coyote > 0) { this.doJump(820, false); }
      else if (this.wallSliding || (this.wall && !this.onGround)) { this.doWallJump(); }
      else if (wantDown && !this.pound && !this.atk) { this.startPound(); this.buf = 0; }
      else if (this.jumps < (this.skills.triple ? 2 : 1)) { this.doJump(740, true); }
    }
    const liq2 = world.liquidAt(this.x, this.y - 20); if (liq2 && liq2.type === 'water' && this.buf > 0 && this.canAct) this.doJump(560, false);
    this.dropT = Math.max(this.dropT, 0);
    // --- ataques
    if (this.atkQueued && this.canAct && !this.blocking && this.dashT <= 0 && this.healT <= 0) {
      if (!this.atk || (this.atk.t > this.atk.dur * .55 && this.atk.kind === 'combo' && this.combo < this.W.hits)) this.startAttack(wantDown, In.down('up'));
      this.atkQueued = false;
    }
    if (this.atk) this.updateAttack(dt);
    // --- física
    const prevGround = this.onGround;
    this.justLanded = false;
    world.move(this, dt);
    if (this.justLanded) this.onLand();
    if (this.onGround) { this.jumps = 0; this.airDash = 1; if (this.pound) this.endPound(); }
    if (!prevGround && !this.onGround && this.stT > .2 && this.vy > 900) { }
    // pasos
    if (this.onGround && Math.abs(this.vx) > 60 && !this.dashT) {
      this.phase += Math.abs(this.vx) * dt * .046;
      this.stepAcc += Math.abs(this.vx) * dt;
      if (this.stepAcc > (this.sprint ? 58 : 46)) { this.stepAcc = 0; const s = FX.footstep(this.x - this.face * 6, this.y, this.face, Math.abs(this.vx)); Sound.play('step', s); }
      if (this.sprint && !G.inCombat && chance(dt * 30)) FX.trail(this.x - this.face * 10, this.y - 20, [140, 230, 255], 4);
    }
    // líquidos
    const L = world.liquidAt(this.x, this.y - 4);
    if (L && !this.inLiquid) { this.inLiquid = L; FX.splash(this.x, L.curLevel, L.type, Math.min(1.5, Math.abs(this.vy) / 600 + .4)); Sound.play('splash', L.type === 'lava'); }
    if (!L) this.inLiquid = null;
    if (L && L.type === 'lava') G.heroInLava(L);
    this.sq += (1 - this.sq) * Math.min(1, dt * 12);
    this.blink -= dt; if (this.blink < -.12) this.blink = R(2, 5);
    this.updateCloth(dt);
    if (Math.abs(this.vx) + Math.abs(this.vy) > 120 && chance(dt * 22)) trailParticle(lookPalette().trail, this.x - this.face * 8, this.y - 30);
    // estado de animación
    this.state = this.dead ? 'dead' : this.grapple ? 'grapple' : this.dashT > 0 ? (this.pound ? 'pound' : 'dash') : this.atk ? 'attack' : this.blocking ? 'block' : this.healT > 0 ? 'heal' : this.wallSliding ? 'wall' : !this.onGround ? (this.vy < 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 40 ? 'run' : 'idle';
  }
  doJump(v, dbl) {
    this.vy = -v; this.onGround = false; this.coyote = 0; this.buf = 0; this.sq = dbl ? 1.15 : 1.28; this.plat = null;
    if (dbl) { this.jumps++; FX.runeBurst(this.x, this.y, [150, 230, 255], 8); Sound.play('djump'); Input.rumble(0, .2, 60); }
    else { FX.land(this.x, this.y, 300); Sound.play('jump'); }
  }
  doWallJump() {
    const d = this.wall || -this.face;
    this.vx = -d * 360; this.vy = -770; this.face = -d; this.ctrlLock = .15; this.buf = 0; this.jumps = 0; this.airDash = 1; this.sq = 1.2;
    FX.land(this.x + d * 12, this.y - 30, 400); Sound.play('jump'); Input.rumble(0, .15, 50);
  }
  tryDash(mx) {
    if (this.dashCd > 0 || this.blocking || this.healT > 0) return;
    if (!this.onGround && this.airDash <= 0) return;
    if (this.stamina < 15) { this.game.toast('¡Sin aliento!'); return; }
    this.stamina -= 18; this.staminaT = .55;
    if (mx) this.face = Math.sign(mx);
    this.dashT = .17; this.dashCd = .42; this.inv = Math.max(this.inv, .21); this.vx = this.face * 760; this.vy = 0; this.atk = null; this.pound = false;
    if (!this.onGround) this.airDash--;
    FX.land(this.x, this.y, 260); Sound.play('dash'); Input.rumble(0, .12, 40);
    if (this.skills.phantom) this.phantomDash = true;
  }
  startPound() { this.pound = true; this.dashT = 1.2; this.vx = 0; this.vy = 1350; this.inv = Math.max(this.inv, .25); Sound.play('whoosh'); }
  endPound() {
    this.pound = false; this.dashT = 0; this.vx = 0;
    const p = this.weapon === 'hammer' ? 1.5 : 1;
    FX.slam(this.x, this.y, p); Sound.play('slam', p); this.game.shake(10 * p, .35); Input.rumble(.7, .5, 200);
    FX.text(this.x, this.y - 70, 'BAM!', '#ffd25a', 52);
    this.game.areaDamage(this.x, this.y - 10, 120 * p, 18 * p, { kind: 'slam', up: true });
    this.ctrlLock = .18;
  }
  onLand() {
    const v = this.landVy || 0;
    if (v > 420) { const s = FX.land(this.x, this.y, v); Sound.play('land', Math.min(1, v / 1100), s); this.sq = .7; if (v > 950) { this.game.shake(4, .2); Input.rumble(.25, .2, 90); } }
  }
  cycleWeapon(dir) {
    const owned = Object.keys(WEAPONS).filter(k => Store.data.unlocked.weapons[k]);
    if (owned.length < 2) { this.game.toast('Desbloquea más armas en el Taller'); return; }
    const i = owned.indexOf(this.weapon); this.weapon = owned[(i + dir + owned.length) % owned.length];
    Store.data.weapon = this.weapon; FX.runeBurst(this.x, this.y - 40, this.W.col, 8); Sound.play('select');
    this.game.toast(this.W.name);
  }
  taunt() {
    if (this.tauntCd > 0) return; this.tauntCd = 8; this.tauntT = .7;
    Sound.play('taunt'); FX.text(this.x, this.y - 90, pick(['COME ON!', "LET'S GO!", 'BRING IT!', 'TRY ME!']), '#fff', 34);
    FX.ring(this.x, this.y - 30, [255, 255, 255], 160, .5);
    const n = this.game.scareEnemies(this.x, this.y, 320);
    if (n) { this.addUlt(6 + n * 2); }
    Input.rumble(.2, .2, 150);
  }
  runeShot() {
    if (this.runes <= 0) { this.game.toast('Runas agotadas: se recargan solas'); return; }
    this.runes--; this.runeT = 0;
    this.game.spawnProjectile({ owner: 'hero', x: this.x + this.face * 20, y: this.y - 36, vx: this.face * 720, vy: 0, r: 9, dmg: 9, kind: 'rune', life: 1.1, col: this.W.col });
    Sound.play('zap'); this.vx -= this.face * 60;
  }
  tryGrapple() {
    const ring = this.game.findGrapple(this);
    if (ring) { this.grapple = { ring, t: 0, phase: 'shoot' }; this.dashT = 0; Sound.play('grapple'); return; }
    // sin anilla: el garfio atrae al enemigo pequeño más cercano
    const e = this.game.nearestEnemy(this.x, this.y - 30, 280, this.face);
    if (e && !e.heavy) { e.pull = { x: this.x + this.face * 30, t: .25 }; Sound.play('grapple'); FX.trail(e.x, e.y - 20, [200, 220, 255], 6); this.grappleLine = { x: e.x, y: e.y - e.h / 2, t: .25 }; }
    else { this.grappleLine = { x: this.x + this.face * 240, y: this.y - 60, t: .2 }; Sound.play('grapple'); }
  }
  updateGrapple(dt) {
    const g = this.grapple, r = g.ring; g.t += dt;
    if (g.phase === 'shoot') { if (g.t > .09) { g.phase = 'pull'; g.t = 0; } this.vy *= .5; return; }
    const dx = r.x - this.x, dy = (r.y + 40) - (this.y), d = Math.hypot(dx, dy);
    this.vx = dx / d * 900; this.vy = dy / d * 900;
    if (chance(.6)) FX.trail(this.x, this.y - 30, [200, 240, 255], 4);
    if (d < 40 || g.t > .8 || Input.pressed('jump')) { this.grapple = null; this.vx = Math.sign(dx || this.face) * 420; this.vy = -620; this.jumps = 0; this.airDash = 1; FX.runeBurst(this.x, this.y - 30, [200, 240, 255], 6); Sound.play('djump'); }
  }
  /* ---------- ataques ---------- */
  startAttack(down, up) {
    const W = this.W, air = !this.onGround;
    let kind = 'combo';
    if (air && down) kind = 'down'; else if (up) kind = 'up'; else if (air) kind = 'air';
    if (kind === 'combo') { if (this.atk && this.atk.kind === 'combo') this.combo++; else this.combo = 0; if (this.combo >= W.hits) this.combo = 0; }
    const heavyLast = kind === 'combo' && this.combo === W.hits - 1;
    const dur = (heavyLast ? .4 : .27) / W.speed;
    this.atk = { kind, t: 0, dur, id: ++this.swing, hitDone: new Set(), heavy: heavyLast, crit: this.counterT > 0 };
    if (this.counterT > 0) { this.counterT = 0; }
    Sound.play('swing', this.weapon === 'hammer' || heavyLast);
    if (kind === 'combo' && this.onGround) this.vx += this.face * (heavyLast ? 260 : 120);
    if (kind === 'down') this.vy = Math.max(this.vy, 200);
  }
  startCharged() {
    this.chargeLvl = 0; if (this.stamina < 22) { this.game.toast('¡Sin aliento!'); return; }
    this.stamina -= 26; this.staminaT = .6;
    const dur = { sword: .5, spear: .42, hammer: .62, gauntlet: .5 }[this.weapon];
    this.atk = { kind: 'charged', t: 0, dur, id: ++this.swing, hitDone: new Set(), heavy: true, crit: this.counterT > 0 };
    Sound.play('swing', true); Input.rumble(.3, .3, 120);
    if (this.weapon === 'spear') { this.vx = this.face * 900; this.inv = .25; }
    if (this.weapon === 'gauntlet') { this.vy = -620; }
    if (this.weapon === 'hammer' && !this.onGround) { this.vy = 1200; }
  }
  updateAttack(dt) {
    const a = this.atk; a.t += dt; const p = a.t / a.dur;
    if (a.kind === 'charged' && this.weapon === 'sword' && chance(.8)) FX.trail(this.x + Math.cos(a.t * 30) * 50, this.y - 30 + Math.sin(a.t * 30) * 20, this.W.col, 5);
    if (a.kind === 'charged' && this.weapon === 'hammer' && p > .55 && !a.slammed && this.onGround) { a.slammed = true; FX.slam(this.x + this.face * 50, this.y, 1.6); Sound.play('slam', 1.3); this.game.shake(12, .4); this.game.areaDamage(this.x + this.face * 50, this.y - 10, 170, this.W.dmg[2] * 1.4, { kind: 'slam', armor: 2.5 }); Input.rumble(.8, .6, 250); FX.text(this.x + this.face * 50, this.y - 80, 'KRAKOOM!', '#ff9a40', 56); }
    if (p >= 1) { this.atk = null; }
  }
  /* cajas de golpe activas este frame */
  hitboxes() {
    const a = this.atk; if (!a) return [];
    const W = this.W, p = a.t / a.dur, out = [];
    const crit = a.crit ? 2.5 : 1;
    const dmgBase = a.kind === 'combo' ? W.dmg[Math.min(this.combo, W.dmg.length - 1)] : a.kind === 'charged' ? W.dmg[W.dmg.length - 1] * 1.6 : W.dmg[0] * 1.1;
    const dmg = dmgBase * crit * (this.skills.power ? 1.15 : 1);
    if (a.kind === 'charged') {
      if (this.weapon === 'sword' && p > .1 && p < .9) out.push({ x: this.x - 90, y: this.y - 80, w: 180, h: 90, dmg, kb: 380, multi: .12 });
      else if (this.weapon === 'spear' && p < .7) out.push({ x: this.x + (this.face > 0 ? 0 : -130), y: this.y - 48, w: 130, h: 30, dmg, kb: 420, pierce: 1 });
      else if (this.weapon === 'gauntlet' && p < .8) out.push({ x: this.x - 40, y: this.y - 110, w: 80, h: 110, dmg, kb: 200, up: 1, shock: 1 });
      return out;
    }
    if (p < .22 || p > .62) return out;
    const reach = W.reach * (a.heavy ? 1.2 : 1);
    if (a.kind === 'down') out.push({ x: this.x - 22, y: this.y - 10, w: 44, h: 60, dmg, kb: 120, pogo: 1 });
    else if (a.kind === 'up') out.push({ x: this.x - 34, y: this.y - this.h - reach * .9, w: 68, h: reach, dmg, kb: 150, up: 1 });
    else out.push({ x: this.face > 0 ? this.x : this.x - reach, y: this.y - this.h + 4 - (W.hh - 40) / 2, w: reach, h: W.hh, dmg, kb: a.heavy ? 360 : 170, pierce: W.pierce, armor: W.armor, shock: this.weapon === 'gauntlet' });
    for (const b of out) { b.id = a.id; b.crit = a.crit; b.heavy = a.heavy; }
    return out;
  }
  onHit(info) {
    // llamado por el juego cuando un golpe conecta
    const big = info.heavy || info.crit;
    this.hitstop = big ? .085 : .045; this.addUlt(info.crit ? 9 : 4 + (big ? 2 : 0));
    this.comboCount++; this.comboTimer = 1.6; if (this.comboCount >= 3) Sound.play('combo', this.comboCount);
    Input.rumble(big ? .45 : .15, big ? .3 : .25, big ? 110 : 50);
    if (info.pogo) { this.vy = -640; this.jumps = 0; this.airDash = 1; this.atk = null; FX.runeBurst(this.x, this.y, [150, 230, 255], 6); }
    if (this.weapon === 'hammer') this.game.shake(big ? 7 : 3, .15);
    if (info.crit) FX.text(info.x, info.y - 40, 'CONTRA!', '#ffef80', 44);
  }
  addUlt(v) { const before = this.ult; this.ult = Math.min(100, this.ult + v * (this.skills.fury ? 1.25 : 1)); if (before < 100 && this.ult >= 100) { this.game.ultReady(); } }
  /* ---------- recibir daño ---------- */
  hurt(dmg, srcX, opt = {}) {
    if (this.dead || this.inv > 0 || this.game.cinematic) return 'miss';
    const dir = Math.sign(this.x - srcX) || -this.face;
    // bloqueo y parada
    if (this.blocking && !opt.unblockable && Math.sign(srcX - this.x) === this.face) {
      if (this.blockT < (this.skills.parry ? .26 : .18) && this.parryCd <= 0) {
        this.counterT = .7; this.parryCd = .3; this.addUlt(18); this.inv = .35;
        shieldImpact(this, opt.src && opt.src.y !== undefined ? opt.src.y - (opt.src.h || 30) / 2 : undefined, 1, true); this.game.onParry(this, opt.src); return 'parry';
      }
      const cost = dmg * 1.3 * (this.skills.shield ? .7 : 1);
      if (this.stamina >= cost) {
        this.stamina -= cost; this.staminaT = .7; this.vx = dir * 240; Sound.play('block'); FX.sparks(this.x + this.face * 16, this.y - 34, [180, 220, 255], 8, -dir);
        shieldImpact(this, opt.src && opt.src.y !== undefined ? opt.src.y - (opt.src.h || 30) / 2 : undefined, clamp(dmg / 18, .4, 1.6), false); Input.rumble(.2, .2, 70); this.addUlt(2); return 'block';
      }
      this.stamina = 0; this.blocking = false; this.ctrlLock = .5; FX.text(this.x, this.y - 80, '¡GUARDIA ROTA!', '#ff8080', 30); dmg *= .6;
    }
    const k = this.game.dmgMul() * (this.exposed > 0 ? 1.6 : 1);
    dmg = Math.round(dmg * k);
    this.hp -= dmg; this.inv = opt.inv ?? 1; this.vx = dir * (opt.kb ?? 300); this.vy = -(opt.kup ?? 380); this.atk = null; this.healT = 0; this.ctrlLock = .22; this.grapple = null; this.pound = false; this.dashT = 0;
    this.hitstop = .07; this.addUlt(3); this.hurtFlash = .14; this.lastHurt = this.game.t;
    FX.hit(this.x, this.y - 30, dir, [255, 120, 110], true); FX.text(this.x, this.y - 70, '-' + dmg, '#ff7b7b', 30, { comic: false });
    Sound.play('hurt'); this.game.shake(7, .25); this.game.flashScreen([255, 60, 60], .25); Input.rumble(.8, .5, 180);
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    return 'hit';
  }
  die() { this.dead = true; this.inv = 99; this.game.onHeroDeath(); }
  respawn(x, y) {
    this.x = x; this.y = y; this.vx = this.vy = 0; this.dead = false; this.hp = this.maxHp; this.inv = 1.5; this.flasks = this.maxFlasks; this.atk = null; this.exposed = 0; this.ultCd = 0; this.grapple = null; this.pound = false; this.dashT = 0;
    for (const s of this.scarf) { s.x = s.px = x; s.y = s.py = y - 44; } for (const s of this.cape) { s.x = s.px = x; s.y = s.py = y - 40; }
  }
  /* ---------- tela (bufanda y capa) ---------- */
  updateCloth(dt) {
    const bob = this.state === 'run' ? Math.abs(Math.sin(this.phase)) * -2.5 : 0;
    const ax = this.x - this.face * 5, ay = this.y - 43 + bob;
    const sc = this.scarf, wind = this.game.windAt(this.x, this.y) * .00002;
    // salto brusco de posición (teletransporte, reaparición): la tela se recoloca en vez de estirarse
    if (Math.abs(sc[0].x - ax) > 120 || Math.abs(sc[0].y - ay) > 120) { for (const s of sc) { s.x = s.px = ax; s.y = s.py = ay; } for (const s of this.cape) { s.x = s.px = this.x; s.y = s.py = this.y - 40; } }
    sc[0].x = ax; sc[0].y = ay;
    for (let i = 1; i < sc.length; i++) { const s = sc[i], vx = (s.x - s.px) * .9, vy = (s.y - s.py) * .9; s.px = s.x; s.py = s.y; s.x += vx + Math.sin(this.game.t * 3 + i * .9) * .1 - this.face * .08 + wind * 400; s.y += vy + 620 * dt * dt; }
    for (let k = 0; k < 4; k++) for (let i = 1; i < sc.length; i++) { const a = sc[i - 1], b = sc[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 6.5) / d; if (i > 1) { a.x += dx * f * .5; a.y += dy * f * .5; } b.x -= dx * f * (i > 1 ? .5 : 1); b.y -= dy * f * (i > 1 ? .5 : 1); }
    const cp = this.cape; cp[0].x = this.x - this.face * 3; cp[0].y = this.y - 42 + bob;
    for (let i = 1; i < cp.length; i++) { const s = cp[i], vx = (s.x - s.px) * .86, vy = (s.y - s.py) * .86; s.px = s.x; s.py = s.y; s.x += vx - this.face * .12 + Math.sin(this.game.t * 2.4 + i) * .06; s.y += vy + 760 * dt * dt; }
    for (let k = 0; k < 4; k++) for (let i = 1; i < cp.length; i++) { const a = cp[i - 1], b = cp[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 7) / d; if (i > 1) { a.x += dx * f * .5; a.y += dy * f * .5; } b.x -= dx * f * (i > 1 ? .5 : 1); b.y -= dy * f * (i > 1 ? .5 : 1); }
    // farol de la espalda (péndulo)
    const acc = this.vx - (this.pvx || 0); this.pvx = this.vx;
    this.lantV += (-26 * Math.sin(this.lantA) - acc * .02 - this.lantV * 3) * dt; this.lantA += this.lantV * dt;
  }
  snapshot() { return { x: this.x, y: this.y, face: this.face, img: heroSilhouette(this), draw: drawHeroGhost }; }

  /* =================== DIBUJO =================== */
  draw(g) {
    if (this.inv > 0 && this.inv < 5 && !this.dead && Math.floor(this.game.rt * 16) % 2 && this.game.t - (this.lastHurtT || 0) < 2) { }
    const SK = lookPalette();
    const blinkOut = this.inv > 0 && !this.dashT && Math.floor(this.game.rt * 18) % 3 === 0 && !this.dead;
    if (blinkOut) g.globalAlpha = .45;
    // garfio
    if (this.grapple || (this.grappleLine && this.grappleLine.t > 0)) {
      const tx = this.grapple ? this.grapple.ring.x : this.grappleLine.x, ty = this.grapple ? this.grapple.ring.y : this.grappleLine.y;
      g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(this.x + this.face * 10, this.y - 36); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
      if (this.grappleLine) this.grappleLine.t -= 1 / 60;
    }
    drawHeroLio(g, this, SK);
    g.globalAlpha = 1;
  }
  drawGlow(g) {
    const SK = lookPalette(), t = this.game.rt;
    drawShield(g, this);
    if (this.chargeLvl) glowAt(g, this.W.col, this.x + this.face * 14, this.y - 30, 30 + Math.sin(t * 30) * 6, .8);
    if (this.ult >= 100 && this.ultCd <= 0) { glowAt(g, [255, 220, 120], this.x, this.y - 30, 60 + Math.sin(t * 6) * 8, .35); if (chance(.3)) FX.trail(this.x + R(-16, 16), this.y - R(0, 60), [255, 220, 120], 3); }
    if (this.exposed > 0) glowAt(g, [255, 60, 60], this.x, this.y - 30, 50, .3 + Math.sin(t * 12) * .1);
    if (SK.hat === 'halo') glowAt(g, [255, 245, 180], this.x, this.y - 74, 18, .6);
    if (SK.scarfDef.glow) for (const s of this.scarf) glowAt(g, SK.scarfDef.glow, s.x, s.y, 9, .35);
    if (SK.back === 'runewings') glowAt(g, [140, 220, 255], this.x - this.face * 20, this.y - 46, 30, .4);
    // farol
    if (this.lanternPos) glowAt(g, [255, 200, 110], this.lanternPos[0], this.lanternPos[1], 26, .8);
  }
}

/* ---------- cuerpo del héroe (pose procedural) ---------- */
function ik2(hx, hy, tx, ty, l1, l2, bend) {
  let dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy); const maxd = l1 + l2 - .01; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c) * bend;
  const kx = hx + Math.cos(a - b) * l1, ky = hy + Math.sin(a - b) * l1;
  return [kx, ky, hx + dx, hy + dy];
}
function armPose(h, t) {
  // devuelve codo/mano/ángulo del arma en espacio local (mirando a la derecha)
  let wa = .55, hx = 9, hy = -26, bx = -6, by = -26;
  const a = h.atk;
  if (a) {
    const p = clamp(a.t / a.dur, 0, 1), e = p < .22 ? -easeOut(p / .22) : easeInOut((p - .22) / .5);
    if (a.kind === 'down') { wa = Math.PI / 2; hx = 6; hy = -18; }
    else if (a.kind === 'up') { wa = lerp(-.4, -Math.PI / 2 - .9, clamp(e, 0, 1)); hx = 4; hy = -44; }
    else if (a.kind === 'charged' && h.weapon === 'sword') { wa = a.t * 30; hx = 10; hy = -32; }
    else if (a.kind === 'charged' && h.weapon === 'spear') { wa = 0; hx = 20; hy = -34; }
    else if (a.kind === 'charged' && h.weapon === 'gauntlet') { wa = -Math.PI / 2; hx = 6; hy = -60; }
    else {
      const swingDir = (h.combo % 2 === 0) ? 1 : -1;
      const from = swingDir > 0 ? -2.4 : 1.1, to = swingDir > 0 ? 1.1 : -2.3;
      wa = e < 0 ? lerp(from, from - .4, -e) : lerp(from, to, clamp(e, 0, 1));
      if (h.weapon === 'spear') { wa = 0; hx = lerp(4, 24, clamp(e, 0, 1)); hy = -33; }
      else if (h.weapon === 'gauntlet') { wa = 0; hx = lerp(6, 22, Math.sin(clamp(e, 0, 1) * Math.PI)); hy = -33 + (h.combo % 2 ? 4 : -4); }
      else { hx = 6 + Math.cos(wa) * 6; hy = -32 + Math.sin(wa) * 6; }
    }
  } else if (h.state === 'block') { wa = -1.2; hx = 14; hy = -36; }
  else if (h.chargeLvl) { wa = -2.8 + Math.sin(t * 40) * .05; hx = -2; hy = -40; }
  else if (h.state === 'run') { wa = 2.75 + Math.sin(h.phase) * .12; hx = 7 + Math.cos(h.phase) * 4; hy = -27; bx = -7 - Math.cos(h.phase) * 5; by = -26; }
  else if (h.state === 'jump' || h.state === 'fall') { wa = -2.6; hx = 9; hy = -36; bx = -10; by = -40; }
  else if (h.state === 'heal') { wa = -2.4; hx = 4; hy = -40; bx = -4; by = -40; }
  else if (h.tauntT > 0) { wa = -1.6; hx = 8; hy = -58; }
  if (h.tauntT > 0) h.tauntT -= 1 / 60;
  const ex = (3 + hx) / 2 + 1, ey = (-39 + hy) / 2 + 3;
  return { wa, hx, hy, ex, ey, bx, by };
}
function drawWeapon(g, h, x, y, a, noFx) {
  const W = h.weapon, col = WEAPONS[W].col;
  g.save(); g.translate(x, y); g.rotate(a);
  if (W === 'sword') {
    const gr = g.createLinearGradient(0, -3, 0, 3); gr.addColorStop(0, '#f4fbff'); gr.addColorStop(.5, '#b8c8d4'); gr.addColorStop(1, '#6e8090');
    g.fillStyle = '#4a3020'; g.fillRect(-9, -2, 9, 4);
    g.fillStyle = '#c9a23a'; g.fillRect(-1, -7, 4, 14);
    g.fillStyle = gr; g.beginPath(); g.moveTo(3, -3.2); g.lineTo(36, -2.4); g.lineTo(42, 0); g.lineTo(36, 2.4); g.lineTo(3, 3.2); g.fill();
    g.strokeStyle = rgba(col, .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(8, 0); g.lineTo(33, 0); g.stroke();
  } else if (W === 'spear') {
    g.fillStyle = '#5a3a20'; g.fillRect(-30, -2, 86, 4);
    g.fillStyle = '#cfe8f4'; g.beginPath(); g.moveTo(56, -5); g.lineTo(76, 0); g.lineTo(56, 5); g.lineTo(52, 0); g.fill();
    g.fillStyle = rgba(col); g.beginPath(); g.arc(50, 0, 3.4, 0, TAU); g.fill();
    g.strokeStyle = '#2a6a8a'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-24 + i * 6, -2); g.lineTo(-22 + i * 6, 2); g.stroke(); }
  } else if (W === 'hammer') {
    g.fillStyle = '#4a3020'; g.fillRect(-6, -2.4, 44, 4.8);
    const gr = g.createLinearGradient(30, -14, 52, 14); gr.addColorStop(0, '#6a5a5a'); gr.addColorStop(1, '#2a2020');
    g.fillStyle = gr; g.beginPath(); g.roundRect(32, -14, 22, 28, 4); g.fill();
    g.strokeStyle = 'rgba(255,140,50,.95)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(36, -10); g.lineTo(42, -2); g.lineTo(38, 6); g.lineTo(46, 11); g.stroke();
  } else {
    g.fillStyle = '#c9a23a'; g.beginPath(); g.roundRect(-2, -7, 14, 14, 4); g.fill();
    g.fillStyle = rgba(col); g.beginPath(); g.arc(12, 0, 3.5, 0, TAU); g.fill();
    g.strokeStyle = '#7a5a10'; g.lineWidth = 1; g.stroke();
  }
  g.restore();
  // estela del golpe
  const atk = noFx ? null : h.atk;
  if (atk && atk.kind !== 'down' && W !== 'spear' && W !== 'gauntlet') {
    const p = atk.t / atk.dur; if (p > .2 && p < .6) {
      g.save(); g.globalCompositeOperation = 'lighter'; const swingDir = h.combo % 2 === 0 ? 1 : -1, r = WEAPONS[W].reach * .82, k = (p - .2) / .4;
      g.globalAlpha = .65 * (1 - k * .6);
      const a0 = swingDir > 0 ? -2.3 : 1.0, a1 = lerp(a0, swingDir > 0 ? 1.0 : -2.2, Math.min(1, k * 1.6));
      const gr2 = g.createRadialGradient(6, -32, r * .4, 6, -32, r); gr2.addColorStop(0, rgba(col, 0)); gr2.addColorStop(.8, rgba(col, .85)); gr2.addColorStop(1, 'rgba(255,255,255,.95)');
      g.fillStyle = gr2; g.beginPath(); g.arc(6, -32, r, Math.min(a0, a1), Math.max(a0, a1)); g.arc(6, -32, r * .55, Math.max(a0, a1), Math.min(a0, a1), true); g.fill();
      g.restore();
    }
  }
  if (atk && W === 'spear' && atk.t / atk.dur > .2 && atk.t / atk.dur < .6) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(col, .5); g.beginPath(); g.moveTo(20, -36); g.lineTo(100, -33); g.lineTo(20, -30); g.fill(); g.restore(); }
}
function drawHeroGhost(g, s, a) {
  if (!s.img) return; const B = HERO_BUF;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5 * a;
  if (!s.tinted) { const c = mk(s.img.width, s.img.height), cg = c.getContext('2d'); cg.drawImage(s.img, 0, 0); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = 'rgb(120,210,255)'; cg.fillRect(0, 0, c.width, c.height); s.tinted = c; }
  g.drawImage(s.tinted, s.x - B.OX, s.y - B.OY, B.W, B.H); g.restore();
}
