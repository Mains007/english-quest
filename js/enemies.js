"use strict";
/* =====================================================================
   ENEMIGOS — cada uno con su mecánica y ataques TELEGRAFIADOS
   (preparación visible → ataque → recuperación).
   ===================================================================== */
const ENEMY_EN = { crab: 'Armored Crab', jelly: 'Electric Jellyfish', gull: 'Diving Gull', urchin: 'Rolling Urchin', archer: 'Pirate Archer', eel: 'Abyssal Eel', shroom: 'Hopping Mushroom', wolf: 'Shadow Wolf', beetle: 'Bomber Beetle', bat: 'Fire Bat', slime: 'Magma Slime', salamander: 'Salamander', brute: 'Armored Brute', clockmage: 'Clock Mage', mimic: 'Mimic Chest' };
const ENEMY_INFO = {
  crab: { name: 'Cangrejo Acorazado', tip: 'Su caparazón para los golpes de frente: salta por encima o golpea desde atrás.' },
  jelly: { name: 'Medusa Eléctrica', tip: 'Antes de descargar brilla. Rebota sobre ella con ↓ + ataque.' },
  gull: { name: 'Gaviota Picotazo', tip: 'Chilla y se queda quieta antes de lanzarse en picado.' },
  urchin: { name: 'Erizo Rodante', tip: 'Rueda rapidísimo. Párale con una parada perfecta.' },
  archer: { name: 'Arquero Pirata', tip: 'Tensa el arco antes de disparar. ¡Una parada devuelve la flecha!' },
  eel: { name: 'Anguila Abisal', tip: 'El agua burbujea justo antes de que salte.' },
  shroom: { name: 'Seta Saltarina', tip: 'Se hincha antes de soltar esporas venenosas.' },
  wolf: { name: 'Lobo Sombra', tip: 'Velocísimo. Finge ataques: espera el destello blanco y para.' },
  beetle: { name: 'Escarabajo Bombardero', tip: 'Lanza bombas en arco que explotan al rato.' },
  bat: { name: 'Murciélago Ígneo', tip: 'Se lanza en picado dejando fuego.' },
  slime: { name: 'Slime de Magma', tip: 'Al morir se divide en dos más pequeños.' },
  salamander: { name: 'Salamandra', tip: 'Trepa por paredes y techos y escupe fuego.' },
  brute: { name: 'Bruto Acorazado', tip: 'Rompe su armadura pieza a pieza. Cuando se tambalee, ¡remátalo con inglés!' },
  clockmage: { name: 'Mago del Reloj', tip: 'Crea burbujas que ralentizan el tiempo. Sal de ellas o rómpelas.' },
  mimic: { name: 'Cofre Mimo', tip: '¿Ese cofre respira? ...' }
};

class Enemy {
  constructor(game, x, y, o = {}) {
    this.game = game; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.face = -1; this.t = 0; this.st = 'idle'; this.stT = 0;
    this.w = 30; this.h = 30; this.hp = this.maxHp = 30; this.flying = false; this.inv = 0; this.flash = 0; this.dead = false;
    this.contact = 10; this.kbRes = 0; this.armorFront = false; this.heavy = false; this.coins = 3; this.home = x; this.aggro = 360; this.stun = 0; this.scared = 0;
    this.lastHit = -1; this.onGround = false; this.wall = 0; this.dropT = 0; this.zone = o.zone; this.elite = false;
    Object.assign(this, o);
  }
  get hero() { return this.game.hero; }
  get dx() { return this.hero.x - this.x; }
  get dist() { return Math.hypot(this.hero.x - this.x, this.hero.y - this.h / 2 - (this.y - this.h / 2)); }
  set(st) { this.st = st; this.stT = 0; }
  telegraph(pitch) { Sound.play('telegraph', pitch); this.teleT = .001; }
  update(dt) {
    if (this.dead) return;
    this.t += dt; this.stT += dt; this.inv -= dt; this.flash -= dt; this.stun -= dt; this.scared -= dt;
    if (this.pull) { this.pull.t -= dt; this.vx = (this.pull.x - this.x) * 8; this.vy = -120; if (this.pull.t <= 0) this.pull = null; }
    else if (this.stun > 0) { this.vx *= .9; }
    else this.ai(dt);
    if (!this.flying) { this.vy = Math.min(this.vy + 2000 * dt, 1100); this.justLanded = false; this.game.world.move(this, dt); }
    else { this.x += this.vx * dt; this.y += this.vy * dt; }
    if (this.game.world.liquidAt(this.x, this.y - 2) && !this.flying && !this.swims) { const L = this.game.world.liquidAt(this.x, this.y - 2); if (L.type === 'lava') { FX.splash(this.x, L.curLevel, 'lava', .8); this.die(true); } }
    if (this.y > this.game.world.bounds.y1 + 200) this.die(true);
    if (this.teleT) { this.teleT += dt; if (this.teleT > .6) this.teleT = 0; }
  }
  ai(dt) { }
  facePlayer() { this.face = Math.sign(this.dx) || this.face; }
  edgeAhead(dir) { const gx = this.x + dir * (this.w / 2 + 6), gy = this.game.world.groundY(gx); return !(gy < this.y + 30 && gy > this.y - 30) && !this.game.world.floorAt(gx, this.y - 4) < this.y + 30; }
  hurt(dmg, dir, info = {}) {
    if (this.dead || this.inv > 0) return false;
    let mul = 1;
    if (this.armorFront && Math.sign(-dir) === this.face && !info.up && !info.pogo && !(info.armor > 1.5) && this.st !== 'stunned') { mul = .15; FX.sparks(this.x - dir * 10, this.y - this.h / 2, [255, 255, 200], 6, -dir); Sound.play('block'); this.game.toast('¡Blindado! Golpéale por detrás o desde arriba'); }
    if (info.armor) mul *= this.armored ? info.armor : 1;
    dmg *= mul; this.hp -= dmg; this.flash = .12; this.inv = .06;
    if (!this.heavy) { this.vx = dir * (info.kb || 200) * (1 - this.kbRes); if (!this.flying) this.vy = info.up ? -420 : -150; else this.vy = info.up ? -200 : this.vy; }
    FX.hit(this.x, this.y - this.h / 2, dir, info.crit ? [255, 240, 120] : [255, 240, 220], info.heavy || info.crit);
    FX.text(this.x + R(-10, 10), this.y - this.h - 12, Math.round(dmg) + '', info.crit ? '#ffef70' : '#fff', info.crit ? 30 : 22, { comic: false, max: .6, vy: -70 });
    Sound.play('hit', info.heavy); Sound.play('enemyHurt');
    this.onHurt && this.onHurt(dmg, dir, info);
    if (this.hp <= 0) this.die();
    return true;
  }
  die(silent) {
    if (this.dead) return; this.dead = true;
    if (!silent) { Sound.play('die'); this.deathFX(); this.game.shake(4, .15); }
    this.game.onEnemyKilled(this);
  }
  deathFX() { FX.chunks(this.x, this.y - this.h / 2, this.col || [200, 120, 100], 6, 300); FX.smoke(this.x, this.y - this.h / 2, 5, [80, 70, 80], 8); }
  hitbox() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  attackBoxes() { return []; }
  drawGlow(g) { if (this.teleT) glowAt(g, [255, 255, 255], this.x, this.y - this.h - 18, 22, .8 * (1 - this.teleT / .6)); }
  drawTele(g) {
    if (!this.teleT) return; const k = this.teleT / .6;
    g.save(); g.translate(this.x, this.y - this.h - 22 - k * 6); g.scale(1 + (1 - k) * .4, 1 + (1 - k) * .4);
    g.fillStyle = '#ffec60'; g.strokeStyle = '#3a1a10'; g.lineWidth = 3; g.font = '900 22px "Bangers", Impact, sans-serif'; g.textAlign = 'center';
    g.strokeText('!', 0, 0); g.fillText('!', 0, 0); g.restore();
  }
  hpBar(g) {
    if (this.hp >= this.maxHp || this.elite) return;
    const w = Math.max(26, this.w), x = this.x - w / 2, y = this.y - this.h - 10;
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - 1, y - 1, w + 2, 5); g.fillStyle = '#ff6060'; g.fillRect(x, y, w * Math.max(0, this.hp / this.maxHp), 3);
  }
  flashFill(g) { return this.flash > 0 ? '#ffffff' : null; }
}
/* ayudas de dibujo */
function eyes(g, x, y, s, col = '#1a1010', look = 0, angry = false) {
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - s, y, s * .8, s, 0, 0, TAU); g.ellipse(x + s, y, s * .8, s, 0, 0, TAU); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x - s + look, y + .5, s * .45, 0, TAU); g.arc(x + s + look, y + .5, s * .45, 0, TAU); g.fill();
  if (angry) { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s * 1.8, y - s * 1.3); g.lineTo(x - s * .3, y - s * .7); g.moveTo(x + s * 1.8, y - s * 1.3); g.lineTo(x + s * .3, y - s * .7); g.stroke(); }
}

/* ---------- 1. Cangrejo acorazado ---------- */
class Crab extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 46, h: 30, hp: 34, maxHp: 34, contact: 12, armorFront: true, col: [230, 110, 80], coins: 4 }, o)); this.set('walk'); }
  ai(dt) {
    const H = this.hero, d = this.dist;
    if (this.st === 'walk') {
      this.vx = this.face * 55; if (this.wall || this.edgeAhead(this.face) || Math.abs(this.x - this.home) > 140) { this.face *= -1; this.x += this.face * 2; }
      if (d < 220 && Math.abs(H.y - this.y) < 60 && this.scared <= 0) { this.facePlayer(); this.set('aim'); this.telegraph(55); }
    } else if (this.st === 'aim') { this.vx = 0; if (this.stT > .55) { this.set('lunge'); this.vx = this.face * 430; this.vy = -180; Sound.play('swing'); } }
    else if (this.st === 'lunge') { this.vx *= .96; if (this.stT > .35) { this.set('tired'); } }
    else if (this.st === 'tired') { this.vx = 0; if (this.stT > .8) this.set('walk'); }
  }
  attackBoxes() { return this.st === 'lunge' ? [{ x: this.x + (this.face > 0 ? 6 : -40), y: this.y - 30, w: 34, h: 24, dmg: 16 }] : []; }
  draw(g) {
    const t = this.t, f = this.face, aim = this.st === 'aim', ff = this.flashFill(g);
    g.save(); g.translate(this.x, this.y);
    // patas
    g.strokeStyle = ff || '#a8442e'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const ph = t * 12 * (this.st === 'walk' ? 1 : 0) + i * 2; g.beginPath(); g.moveTo(s * 10, -10); g.lineTo(s * (18 + i * 4), -14 - Math.sin(ph) * 3); g.lineTo(s * (22 + i * 4), 0); g.stroke(); }
    // caparazón
    const gr = g.createLinearGradient(0, -32, 0, -6); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#c4462c');
    g.fillStyle = ff || gr; g.beginPath(); g.ellipse(0, -16, 23, 14, 0, Math.PI, 0); g.quadraticCurveTo(0, -4, -23, -16); g.fill();
    g.strokeStyle = '#6a1e14'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,230,200,.5)'; g.beginPath(); g.ellipse(-6, -24, 7, 3, -.3, 0, TAU); g.fill();
    for (let i = -2; i <= 2; i++) { g.fillStyle = '#e0704c'; g.beginPath(); g.arc(i * 8, -14, 2, 0, TAU); g.fill(); }
    // pinzas
    const up = aim ? -14 - Math.sin(t * 30) * 2 : this.st === 'lunge' ? -4 : -8;
    for (const s of [f, -f * .6]) {
      g.fillStyle = ff || '#ff7a52'; g.save(); g.translate(s * 26, up); g.rotate(aim ? -.6 * Math.sign(s) : 0);
      g.beginPath(); g.ellipse(0, 0, 10, 7, 0, 0, TAU); g.fill(); g.strokeStyle = '#6a1e14'; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = '#6a1e14'; g.beginPath(); g.moveTo(Math.sign(s) * 3, -1); g.lineTo(Math.sign(s) * 10, -4); g.lineTo(Math.sign(s) * 8, 1); g.fill();
      if (aim) { g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 255, 220], 0, 0, 16, .5); g.globalCompositeOperation = 'source-over'; }
      g.restore();
    }
    // ojos en antenas
    for (const s of [-1, 1]) { g.strokeStyle = '#a8442e'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 5 + f * 6, -26); g.lineTo(s * 6 + f * 8, -36); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 6 + f * 8, -37, 4, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(s * 6 + f * 9.5, -37, 2, 0, TAU); g.fill(); }
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  deathFX() { FX.chunks(this.x, this.y - 15, [240, 120, 90], 8, 320, .8); FX.text(this.x, this.y - 50, 'CRACK!', '#ffb08a', 30); }
}

/* ---------- 2. Medusa eléctrica (voladora, se puede rebotar) ---------- */
class Jelly extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 34, h: 34, hp: 22, maxHp: 22, flying: true, contact: 8, col: [190, 140, 255], coins: 3, pogoable: true }, o)); this.by = y; this.set('float'); }
  ai(dt) {
    const d = this.dist;
    this.vx = Math.sin(this.t * .8) * 30 + (this.dx > 0 ? 12 : -12) * (d < 300 ? 1 : 0); this.vy = (this.by + Math.sin(this.t * 1.7) * 18 - this.y) * 3;
    if (this.st === 'float' && d < 150 && this.stT > 1.2) { this.set('charge'); this.telegraph(70); Sound.play('charge'); }
    else if (this.st === 'charge' && this.stT > .8) { this.set('zap'); Sound.play('zap'); FX.ring(this.x, this.y - 17, [200, 170, 255], 85, .3); this.game.shake(2, .1); }
    else if (this.st === 'zap' && this.stT > .35) this.set('float');
  }
  attackBoxes() { return this.st === 'zap' ? [{ x: this.x - 80, y: this.y - 95, w: 160, h: 150, dmg: 14, circle: { x: this.x, y: this.y - 17, r: 80 } }] : []; }
  draw(g) {
    const t = this.t, ff = this.flashFill(g), ch = this.st === 'charge';
    g.save(); g.translate(this.x, this.y - 17);
    for (let i = 0; i < 6; i++) { g.strokeStyle = ff || 'rgba(210,170,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-12 + i * 5, 6); for (let k = 1; k < 6; k++) g.lineTo(-12 + i * 5 + Math.sin(t * 4 + i + k) * 3, 6 + k * 6); g.stroke(); }
    const gr = g.createRadialGradient(-4, -6, 2, 0, 0, 20); gr.addColorStop(0, ch ? '#ffffff' : '#f0e0ff'); gr.addColorStop(.6, 'rgba(180,130,255,.85)'); gr.addColorStop(1, 'rgba(120,70,220,.7)');
    g.fillStyle = ff || gr; g.beginPath(); g.ellipse(0, 0, 18 + Math.sin(t * 5) * 1.5, 14, 0, Math.PI, 0); g.quadraticCurveTo(0, 10, -18, 0); g.fill();
    eyes(g, 0, -2, 3, '#3a1a6a', Math.sign(this.dx));
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); glowAt(g, [190, 140, 255], this.x, this.y - 17, this.st === 'charge' ? 60 + Math.sin(this.t * 40) * 10 : 30, this.st === 'zap' ? 1 : .45); if (this.st === 'zap') for (let i = 0; i < 6; i++) { const a = R(0, TAU); g.globalAlpha = 1; g.strokeStyle = '#e8d8ff'; g.lineWidth = 2; g.beginPath(); let px = this.x, py = this.y - 17; g.moveTo(px, py); for (let k = 0; k < 5; k++) { px += Math.cos(a) * 16 + R(-8, 8); py += Math.sin(a) * 16 + R(-8, 8); g.lineTo(px, py); } g.stroke(); } }
  deathFX() { for (let i = 0; i < 18; i++) FX.spawnRaw({ t: 'drop', x: this.x, y: this.y - 17, vx: R(-200, 200), vy: R(-300, -50), g: 800, max: .7, s: 2.5, col: [200, 160, 255] }); FX.text(this.x, this.y - 40, 'SPLASH!', '#d8b8ff', 28); }
}

/* ---------- 3. Gaviota ---------- */
class Gull extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 36, h: 22, hp: 16, maxHp: 16, flying: true, contact: 10, col: [240, 240, 240], coins: 3 }, o)); this.by = y; this.set('patrol'); }
  ai(dt) {
    const H = this.hero;
    if (this.st === 'patrol') { this.vx = this.face * 120; this.vy = (this.by + Math.sin(this.t * 2) * 12 - this.y) * 2; if (Math.abs(this.x - this.home) > 220) this.face = -Math.sign(this.x - this.home); if (Math.abs(this.dx) < 260 && H.y > this.y) { this.set('hover'); Sound.play('telegraph', 84); this.telegraph(84); } }
    else if (this.st === 'hover') { this.facePlayer(); this.vx = (H.x - this.x - this.face * 160) * 2; this.vy = (H.y - 220 - this.y) * 2; if (this.stT > .75) { this.set('dive'); const a = Math.atan2(H.y - 20 - this.y, H.x - this.x); this.vx = Math.cos(a) * 640; this.vy = Math.sin(a) * 640; Sound.play('whoosh'); } }
    else if (this.st === 'dive') { if (this.stT > .7 || this.y > H.y + 20) { this.set('rise'); } }
    else if (this.st === 'rise') { this.vy = -260; this.vx *= .97; if (this.y < this.by) { this.set('patrol'); } }
  }
  attackBoxes() { return this.st === 'dive' ? [{ x: this.x - 16, y: this.y - 22, w: 32, h: 24, dmg: 12 }] : []; }
  draw(g) {
    const t = this.t, f = this.vx >= 0 ? 1 : -1, ff = this.flashFill(g), flap = this.st === 'dive' ? .2 : Math.sin(t * 16);
    g.save(); g.translate(this.x, this.y - 11); g.scale(f, 1); if (this.st === 'dive') g.rotate(Math.atan2(this.vy, Math.abs(this.vx)) * .6);
    g.fillStyle = ff || '#f4f4f0'; g.beginPath(); g.ellipse(0, 0, 16, 8, 0, 0, TAU); g.fill();
    g.fillStyle = ff || '#9aa4ae'; g.beginPath(); g.moveTo(-4, -2); g.quadraticCurveTo(-10, -18 * flap - 4, -26, -14 * flap - 6); g.quadraticCurveTo(-12, -2, -4, 2); g.fill();
    g.beginPath(); g.moveTo(2, -2); g.quadraticCurveTo(8, -20 * flap - 4, 22, -16 * flap - 4); g.quadraticCurveTo(10, -2, 4, 2); g.fill();
    g.fillStyle = '#f4b03a'; g.beginPath(); g.moveTo(14, -1); g.lineTo(24, 1); g.lineTo(14, 3); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(10, -3, 1.8, 0, TAU); g.fill();
    if (this.st === 'hover') { g.strokeStyle = '#111'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(7, -7); g.lineTo(12, -5); g.stroke(); }
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  deathFX() { for (let i = 0; i < 12; i++) FX.spawnRaw({ t: 'leaf', x: this.x, y: this.y - 10, vx: R(-120, 120), vy: R(-200, -40), g: 200, drag: 1.4, max: R(1, 1.8), s: R(2, 3.5), col: pick([[250, 250, 250], [190, 196, 204]]), rot: R(0, TAU), vr: R(-10, 10) }); }
}

/* ---------- 4. Erizo rodante ---------- */
class Urchin extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 28, h: 26, hp: 26, maxHp: 26, contact: 14, col: [90, 60, 120], coins: 4, spiky: true }, o)); this.set('idle'); this.rot = 0; }
  ai(dt) {
    const d = this.dist;
    if (this.st === 'idle') { this.vx *= .9; if (d < 330 && Math.abs(this.hero.y - this.y) < 80 && this.stT > .8) { this.facePlayer(); this.set('curl'); this.telegraph(48); } }
    else if (this.st === 'curl') { this.rot += dt * 30 * this.stT; if (this.stT > .6) { this.set('roll'); Sound.play('dash'); } }
    else if (this.st === 'roll') { this.vx = this.face * 560; this.rot += this.face * dt * 22; if (chance(.5)) FX.footstep(this.x, this.y, -this.face, 500); if (this.wall) { this.face *= -1; this.game.shake(2, .1); FX.sparks(this.x, this.y - 13, [255, 255, 200], 6); } if (this.stT > 1.6) this.set('dizzy'); }
    else if (this.st === 'dizzy') { this.vx *= .9; if (this.stT > 1.2) this.set('idle'); }
  }
  onParried() { this.set('dizzy'); this.stun = 1.5; this.vx = -this.face * 200; }
  attackBoxes() { return this.st === 'roll' ? [{ x: this.x - 16, y: this.y - 28, w: 32, h: 28, dmg: 14, parryable: true }] : []; }
  draw(g) {
    const ff = this.flashFill(g); g.save(); g.translate(this.x, this.y - 13); g.rotate(this.st === 'roll' || this.st === 'curl' ? this.rot : 0);
    g.fillStyle = ff || '#4a2a6a'; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.beginPath(); g.moveTo(Math.cos(a - .15) * 10, Math.sin(a - .15) * 10); g.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); g.lineTo(Math.cos(a + .15) * 10, Math.sin(a + .15) * 10); g.fill(); }
    const gr = g.createRadialGradient(-3, -3, 1, 0, 0, 12); gr.addColorStop(0, '#a888d0'); gr.addColorStop(1, '#5a3a80'); g.fillStyle = ff || gr; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
    if (this.st !== 'roll' && this.st !== 'curl') eyes(g, this.face * 3, -1, 2.6, '#200a30', this.face, true);
    if (this.st === 'dizzy') { g.rotate(0); for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(Math.cos(a) * 14, -20 + Math.sin(a) * 4, 2.5, 0, TAU); g.fill(); } }
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
}

/* ---------- 5. Arquero pirata (esqueleto) ---------- */
class Archer extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 26, h: 54, hp: 30, maxHp: 30, contact: 8, col: [230, 224, 210], coins: 5 }, o)); this.set('idle'); this.draw_ = 0; }
  ai(dt) {
    const d = this.dist; this.vx *= .8;
    if (this.st === 'idle') { if (d < 620 && this.stT > 1) { this.facePlayer(); this.set('draw'); Sound.play('telegraph', 64); } }
    else if (this.st === 'draw') { this.facePlayer(); if (this.stT > .95) { this.fire(); this.set('reload'); } }
    else if (this.st === 'reload') { if (this.stT > 1.4) this.set('idle'); if (d < 90) { this.vx = -this.face * 220; this.vy = -360; this.set('idle'); } }
  }
  fire() {
    const H = this.hero, sx = this.x + this.face * 18, sy = this.y - 36, tx = H.x, ty = H.y - 30;
    const dx = tx - sx, T = Math.max(.35, Math.abs(dx) / 600), vx = dx / T, vy = (ty - sy) / T - 600 * T * .5;
    this.game.spawnProjectile({ owner: 'enemy', kind: 'arrow', x: sx, y: sy, vx, vy, g: 600, r: 6, dmg: 12, life: 3, parryable: true });
    Sound.play('arrow');
  }
  draw(g) {
    const f = this.face, ff = this.flashFill(g), k = this.st === 'draw' ? Math.min(1, this.stT / .9) : 0;
    g.save(); g.translate(this.x, this.y); g.scale(f, 1);
    const bone = ff || '#ece4d2';
    g.strokeStyle = bone; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-4, -20); g.lineTo(-6, 0); g.moveTo(4, -20); g.lineTo(6, 0); g.stroke();
    g.fillStyle = '#5a2a3a'; g.beginPath(); g.moveTo(-10, -42); g.lineTo(10, -42); g.lineTo(8, -18); g.lineTo(-8, -18); g.fill();
    g.strokeStyle = '#3a1a26'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-8, -36 + i * 6); g.lineTo(8, -36 + i * 6); g.stroke(); }
    g.fillStyle = bone; g.beginPath(); g.arc(0, -50, 9, 0, TAU); g.fill(); g.fillRect(-5, -44, 10, 5);
    g.fillStyle = '#1a1010'; g.beginPath(); g.arc(3, -51, 2.6, 0, TAU); g.arc(-3, -51, 2.6, 0, TAU); g.fill();
    g.fillStyle = '#c23a2e'; g.beginPath(); g.moveTo(-10, -55); g.quadraticCurveTo(0, -64, 10, -55); g.lineTo(-10, -55); g.fill(); g.fillRect(-12, -56, 3, 10);
    // arco
    g.strokeStyle = '#6a4220'; g.lineWidth = 3; g.beginPath(); g.arc(12, -36, 16, -1.2, 1.2); g.stroke();
    const sx = 12 + Math.cos(1.2) * 16, sy1 = -36 - Math.sin(1.2) * 16, sy2 = -36 + Math.sin(1.2) * 16, pull = 12 - k * 14;
    g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy1); g.lineTo(pull, -36); g.lineTo(sx, sy2); g.stroke();
    if (this.st === 'draw') { g.strokeStyle = '#8a5a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(pull, -36); g.lineTo(pull + 30, -36); g.stroke(); g.fillStyle = '#ccc'; g.beginPath(); g.moveTo(pull + 30, -39); g.lineTo(pull + 36, -36); g.lineTo(pull + 30, -33); g.fill(); }
    g.strokeStyle = bone; g.lineWidth = 3; g.beginPath(); g.moveTo(-2, -38); g.lineTo(12, -36); g.moveTo(2, -38); g.lineTo(pull, -36); g.stroke();
    g.restore(); this.hpBar(g);
  }
  drawGlow(g) { super.drawGlow(g); if (this.st === 'draw' && this.stT > .6) glowAt(g, [255, 255, 255], this.x + this.face * 30, this.y - 36, 16, (this.stT - .6) * 2); }
  deathFX() { FX.chunks(this.x, this.y - 30, [236, 228, 210], 9, 300, .7); FX.text(this.x, this.y - 70, 'CLATTER!', '#f0e8d0', 26); }
}

/* ---------- 6. Anguila abisal (salta desde el agua) ---------- */
class Eel extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 22, h: 22, hp: 24, maxHp: 24, flying: true, contact: 12, col: [80, 150, 140], coins: 4, swims: true }, o)); this.set('under'); this.water = y; }
  ai(dt) {
    if (this.st === 'under') { this.vx = 0; this.vy = 0; this.y = this.water + 30; this.inv = .1; if (Math.abs(this.dx) < 260 && this.stT > 1.4) { this.set('bubble'); this.tx = this.hero.x; Sound.play('bubble'); } }
    else if (this.st === 'bubble') { this.x = lerp(this.x, this.tx, dt * 2); if (chance(dt * 30)) FX.spawnRaw({ t: 'drop', x: this.x + R(-10, 10), y: this.water, vx: R(-20, 20), vy: R(-200, -80), g: 900, max: .4, s: 2, col: [200, 240, 255] }); if (this.stT > .7) { this.set('jump'); this.vy = -900; this.vx = Math.sign(this.dx) * 120; FX.splash(this.x, this.water, 'water', 1); Sound.play('splash'); } }
    else if (this.st === 'jump') { this.vy += 1600 * dt; if (this.vy > 0 && this.y > this.water + 10) { FX.splash(this.x, this.water, 'water', .8); this.set('under'); } }
  }
  attackBoxes() { return this.st === 'jump' ? [{ x: this.x - 14, y: this.y - 40, w: 28, h: 50, dmg: 13 }] : []; }
  draw(g) {
    if (this.st === 'under' || this.st === 'bubble') return;
    const ff = this.flashFill(g); g.save(); g.translate(this.x, this.y); g.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
    g.fillStyle = ff || '#3f8a7e'; g.beginPath(); g.moveTo(0, -26); for (let i = 0; i <= 10; i++) { const tt = i / 10; g.lineTo(Math.sin(tt * 6 + this.t * 10) * 4 + 8 * (1 - tt), -26 + tt * 56); } for (let i = 10; i >= 0; i--) { const tt = i / 10; g.lineTo(Math.sin(tt * 6 + this.t * 10) * 4 - 8 * (1 - tt), -26 + tt * 56); } g.fill();
    g.fillStyle = '#a8f0d8'; g.beginPath(); g.arc(4, -18, 3, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(4.5, -18, 1.6, 0, TAU); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-5 + i * 3, -26); g.lineTo(-4 + i * 3, -21); g.lineTo(-3 + i * 3, -26); g.fill(); }
    g.restore(); this.hpBar(g);
  }
  drawGlow(g) { if (this.st === 'bubble') glowAt(g, [180, 240, 255], this.x, this.water, 40, .5 + Math.sin(this.t * 20) * .2); }
}

/* ---------- 7. Seta saltarina ---------- */
class Shroom extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 30, h: 34, hp: 28, maxHp: 28, contact: 9, col: [230, 90, 160], coins: 4, pogoable: true }, o)); this.set('hop'); }
  ai(dt) {
    if (this.st === 'hop') { if (this.onGround && this.stT > .7) { this.facePlayer(); this.vy = -380; this.vx = this.face * 110; this.stT = 0; } if (this.onGround) this.vx *= .85; if (this.dist < 150 && this.onGround && this.t > 2) { this.set('swell'); this.telegraph(58); } }
    else if (this.st === 'swell') { this.vx = 0; if (this.stT > .7) { this.set('puff'); this.game.spawnCloud(this.x, this.y - 20, 70, 2.4, [200, 120, 220]); Sound.play('whoosh'); } }
    else if (this.st === 'puff') { if (this.stT > 1.2) { this.set('hop'); this.t = 0; } }
  }
  draw(g) {
    const ff = this.flashFill(g), sw = this.st === 'swell' ? 1 + this.stT * .35 : 1, sq = this.onGround ? 1 : 1.1;
    g.save(); g.translate(this.x, this.y); g.scale(sw, sw * sq);
    g.fillStyle = ff || '#f2e6d8'; g.beginPath(); g.roundRect(-8, -18, 16, 18, 5); g.fill();
    eyes(g, this.face * 2, -10, 2.4, '#3a1a20', this.face, this.st !== 'hop');
    const gr = g.createRadialGradient(-5, -30, 2, 0, -24, 20); gr.addColorStop(0, '#ff9ad0'); gr.addColorStop(1, '#b02a7a');
    g.fillStyle = ff || gr; g.beginPath(); g.ellipse(0, -20, 17, 13, 0, Math.PI, 0); g.quadraticCurveTo(0, -14, -17, -20); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-7, -27, 3, 0, TAU); g.arc(5, -29, 2.4, 0, TAU); g.arc(10, -22, 2, 0, TAU); g.fill();
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  deathFX() { this.game.spawnCloud(this.x, this.y - 20, 50, 1.2, [220, 140, 230]); FX.chunks(this.x, this.y - 20, [230, 90, 160], 6, 250); FX.text(this.x, this.y - 50, 'POOF!', '#ffb0e0', 28); }
}

/* ---------- 8. Lobo sombra (ultrarrápido, finge) ---------- */
class Wolf extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 50, h: 34, hp: 40, maxHp: 40, contact: 10, col: [60, 50, 90], coins: 7 }, o)); this.set('stalk'); this.feints = 0; }
  ai(dt) {
    const H = this.hero, d = Math.abs(this.dx);
    if (this.st === 'stalk') { this.facePlayer(); const want = 200; this.vx = approach(this.vx, Math.sign(d - want) * this.face * 140, 800 * dt); if (this.stT > R(.9, 1.6) && Math.abs(H.y - this.y) < 100) { this.set(chance(.4) && this.feints < 2 ? 'feint' : 'crouch'); if (this.st === 'crouch') this.telegraph(60); } }
    else if (this.st === 'feint') { this.vx = this.face * 300; if (this.stT > .15) { this.feints++; this.vx = -this.face * 200; this.set('stalk'); FX.afterimage({ x: this.x, y: this.y, draw: (gg, s, a) => this.ghost(gg, s, a) }); } }
    else if (this.st === 'crouch') { this.vx = 0; if (this.stT > .5) { this.set('dash'); this.feints = 0; Sound.play('dash'); this.game.flashGlint(this.x, this.y - 20); } }
    else if (this.st === 'dash') { this.vx = this.face * 980; if (chance(.7)) FX.afterimage({ x: this.x, y: this.y, draw: (gg, s, a) => this.ghost(gg, s, a) }); if (this.stT > .32 || this.wall) { this.set('skid'); } }
    else if (this.st === 'skid') { this.vx *= .88; if (chance(.6)) FX.footstep(this.x, this.y, this.face, 500); if (this.stT > .6) this.set('stalk'); }
  }
  onParried() { this.set('skid'); this.stun = 1.4; this.vx = -this.face * 300; FX.text(this.x, this.y - 50, 'STUNNED!', '#c8b8ff', 26); }
  attackBoxes() { return this.st === 'dash' ? [{ x: this.x - 26, y: this.y - 34, w: 52, h: 32, dmg: 15, parryable: true }] : []; }
  ghost(g, s, a) { g.save(); g.translate(s.x, s.y); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(140,110,255,${.4 * a})`; g.beginPath(); g.ellipse(0, -16, 24, 12, 0, 0, TAU); g.fill(); g.restore(); }
  draw(g) {
    const ff = this.flashFill(g), f = this.face, run = Math.abs(this.vx) > 50, t = this.t;
    g.save(); g.translate(this.x, this.y); g.scale(f, 1); if (this.st === 'crouch') g.scale(1.05, .82);
    g.strokeStyle = ff || '#2a2240'; g.lineWidth = 5; g.lineCap = 'round';
    for (const [lx, ph] of [[-14, 0], [-8, 2], [10, 1], [16, 3]]) { const a = run ? Math.sin(t * 22 + ph) * .7 : 0; g.beginPath(); g.moveTo(lx, -14); g.lineTo(lx + Math.sin(a) * 9, -2); g.stroke(); }
    const gr = g.createLinearGradient(0, -34, 0, -8); gr.addColorStop(0, '#4a3e78'); gr.addColorStop(1, '#221a3a');
    g.fillStyle = ff || gr; g.beginPath(); g.ellipse(0, -18, 22, 11, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-20, -20); g.quadraticCurveTo(-36, -30 - Math.sin(t * 8) * 4, -34, -14); g.quadraticCurveTo(-28, -18, -20, -14); g.fill();
    g.beginPath(); g.ellipse(20, -24, 11, 9, -.2, 0, TAU); g.fill(); g.beginPath(); g.moveTo(26, -26); g.lineTo(38, -22); g.lineTo(26, -18); g.fill();
    g.beginPath(); g.moveTo(15, -30); g.lineTo(18, -42); g.lineTo(23, -31); g.fill();
    g.fillStyle = this.st === 'crouch' || this.st === 'dash' ? '#ffffff' : '#ff4a6a'; g.beginPath(); g.ellipse(24, -26, 2.6, 1.6, 0, 0, TAU); g.fill();
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); glowAt(g, [255, 70, 110], this.x + this.face * 24, this.y - 26, 10, .7); if (this.st === 'crouch') glowAt(g, [255, 255, 255], this.x, this.y - 20, 50, this.stT * 1.6); }
  deathFX() { for (let i = 0; i < 20; i++) FX.spawnRaw({ t: 'smoke', x: this.x + R(-20, 20), y: this.y - 18, vx: R(-60, 60), vy: R(-80, -10), g: -10, drag: 1, max: 1.2, s: 6, s1: 16, col: [60, 40, 100], a: .5 }); FX.text(this.x, this.y - 50, 'FADE...', '#b8a8ff', 24); }
}

/* ---------- 9. Escarabajo bombardero ---------- */
class Beetle extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 40, h: 28, hp: 34, maxHp: 34, contact: 9, col: [60, 140, 90], coins: 5 }, o)); this.set('walk'); }
  ai(dt) {
    if (this.st === 'walk') { this.vx = this.face * 40; if (this.wall || this.edgeAhead(this.face) || Math.abs(this.x - this.home) > 120) this.face *= -1; if (this.dist < 480 && this.stT > 1.6) { this.facePlayer(); this.set('aim'); this.telegraph(52); } }
    else if (this.st === 'aim') { this.vx = 0; if (this.stT > .6) { this.throwBomb(); this.set('walk'); } }
  }
  throwBomb() {
    const H = this.hero, dx = H.x - this.x, T = clamp(Math.abs(dx) / 380, .6, 1.3);
    this.game.spawnProjectile({ owner: 'enemy', kind: 'bomb', x: this.x, y: this.y - 30, vx: dx / T, vy: -500, g: 900, r: 9, dmg: 18, life: 3, fuse: 1.6, bounce: true });
    Sound.play('swing');
  }
  draw(g) {
    const ff = this.flashFill(g), f = this.face, t = this.t;
    g.save(); g.translate(this.x, this.y); g.scale(f, 1);
    g.strokeStyle = '#1a2a1a'; g.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const a = Math.sin(t * 14 + i * 2) * (this.st === 'walk' ? 3 : 0); g.beginPath(); g.moveTo(-8 + i * 8, -8); g.lineTo(-12 + i * 10 + a, 0); g.stroke(); }
    const gr = g.createLinearGradient(0, -30, 0, -6); gr.addColorStop(0, '#7ad89a'); gr.addColorStop(1, '#1e6a3a');
    g.fillStyle = ff || gr; g.beginPath(); g.ellipse(-2, -15, 18, 12, 0, 0, TAU); g.fill(); g.strokeStyle = '#0e3a1e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-2, -27); g.lineTo(-2, -4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-8, -22, 6, 3, -.4, 0, TAU); g.fill();
    g.fillStyle = ff || '#2a3a2a'; g.beginPath(); g.ellipse(16, -13, 8, 7, 0, 0, TAU); g.fill();
    g.strokeStyle = '#2a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, -18); g.quadraticCurveTo(26, -28, 30, -24); g.stroke();
    g.fillStyle = '#ffd040'; g.beginPath(); g.arc(19, -15, 2, 0, TAU); g.fill();
    if (this.st === 'aim') { g.fillStyle = '#333'; g.beginPath(); g.arc(-4, -32 - this.stT * 10, 7, 0, TAU); g.fill(); g.fillStyle = '#ff8a20'; g.beginPath(); g.arc(-1, -40 - this.stT * 10, 2 + Math.random() * 1.5, 0, TAU); g.fill(); }
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
}

/* ---------- 10. Murciélago ígneo ---------- */
class Bat extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 30, h: 20, hp: 16, maxHp: 16, flying: true, contact: 10, col: [120, 50, 40], coins: 3 }, o)); this.set('hang'); this.by = y; }
  ai(dt) {
    const H = this.hero;
    if (this.st === 'hang') { this.vx = this.vy = 0; if (this.dist < 280) { this.set('wake'); Sound.play('telegraph', 90); this.telegraph(90); } }
    else if (this.st === 'wake') { this.vy = 60; if (this.stT > .45) { this.set('swoop'); this.tx = H.x; this.ty = H.y - 24; this.sx = this.x; this.sy = this.y; Sound.play('whoosh'); } }
    else if (this.st === 'swoop') { const k = this.stT / .9; const x = lerp(this.sx, this.tx + (this.tx - this.sx), k), y = this.sy + Math.sin(k * Math.PI) * (this.ty - this.sy) * 1.1; this.vx = (x - this.x) / dt; this.vy = (y - this.y) / dt; if (chance(.6)) FX.embers(this.x, this.y - 10, 1, 40); if (k >= 1) { this.set('flutter'); this.vx = this.vy = 0; } }
    else if (this.st === 'flutter') { this.vx = Math.sin(this.t * 3) * 60; this.vy = (this.by + 40 - this.y) * 1.5; if (this.stT > 1.3) { this.set('wake'); this.stT = .3; } }
  }
  attackBoxes() { return this.st === 'swoop' ? [{ x: this.x - 15, y: this.y - 20, w: 30, h: 20, dmg: 11 }] : []; }
  draw(g) {
    const ff = this.flashFill(g), t = this.t, hang = this.st === 'hang', flap = hang ? 0 : Math.sin(t * 22);
    g.save(); g.translate(this.x, this.y - 10); if (hang) g.scale(1, -1);
    g.fillStyle = ff || '#5a1e18';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 14, -14 * flap - 6, s * 26, -6 * flap); g.lineTo(s * 20, 2); g.lineTo(s * 14, -1); g.lineTo(s * 8, 4); g.closePath(); g.fill(); }
    g.fillStyle = ff || '#8a2e22'; g.beginPath(); g.ellipse(0, 0, 8, 7, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-5, -5); g.lineTo(-3, -11); g.lineTo(-1, -5); g.moveTo(5, -5); g.lineTo(3, -11); g.lineTo(1, -5); g.fill();
    g.fillStyle = '#ffd040'; g.beginPath(); g.arc(-2.5, -1, 1.5, 0, TAU); g.arc(2.5, -1, 1.5, 0, TAU); g.fill();
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); glowAt(g, [255, 120, 40], this.x, this.y - 10, 22, .4); }
  deathFX() { FX.embers(this.x, this.y - 10, 14, 200); FX.smoke(this.x, this.y - 10, 4); }
}

/* ---------- 11. Slime de magma (se divide) ---------- */
class Slime extends Enemy {
  constructor(g, x, y, o) { const s = (o && o.size) || 1; super(g, x, y, Object.assign({ w: 40 * s, h: 30 * s, hp: 36 * s, maxHp: 36 * s, contact: 12, col: [255, 120, 40], coins: 3, size: s }, o)); this.set('wait'); }
  ai(dt) {
    if (this.onGround) this.vx *= .8;
    if (this.st === 'wait' && this.onGround && this.stT > (this.size < 1 ? .5 : .9)) { this.facePlayer(); this.set('squash'); }
    else if (this.st === 'squash' && this.stT > .25) { this.vy = -460 - (this.dist < 200 ? 120 : 0); this.vx = this.face * (this.size < 1 ? 260 : 190); this.set('air'); }
    else if (this.st === 'air' && this.onGround && this.stT > .1) { this.set('wait'); FX.embers(this.x, this.y, 4, 100); this.game.spawnFire(this.x, this.y, 30 * this.size, 1.2); }
  }
  die(silent) {
    super.die(silent);
    if (!silent && this.size >= 1) { for (const s of [-1, 1]) { const e = new Slime(this.game, this.x + s * 12, this.y - 4, { size: .55, zone: this.zone }); e.vx = s * 200; e.vy = -300; this.game.addEnemy(e); } }
  }
  draw(g) {
    const ff = this.flashFill(g), sq = this.st === 'squash' ? .7 : this.st === 'air' ? 1.15 : 1 + Math.sin(this.t * 6) * .04;
    g.save(); g.translate(this.x, this.y); g.scale(this.size * (2 - sq), this.size * sq);
    const gr = g.createRadialGradient(-6, -20, 2, 0, -12, 26); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(.4, '#ff9a2a'); gr.addColorStop(1, '#b8300c');
    g.fillStyle = ff || gr; g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-22, -26, 0, -28); g.quadraticCurveTo(22, -26, 20, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(80,20,10,.5)'; g.beginPath(); g.ellipse(6, -8, 5, 3, 0, 0, TAU); g.fill();
    eyes(g, this.face * 3, -14, 3.2, '#3a0a00', this.face, true);
    g.restore(); this.hpBar(g);
  }
  drawGlow(g) { glowAt(g, [255, 130, 40], this.x, this.y - 12 * this.size, 40 * this.size, .5); }
  deathFX() { FX.splash(this.x, this.y - 10, 'lava', .7 * this.size); FX.text(this.x, this.y - 40, 'SPLAT!', '#ffb050', 26 * this.size + 6); }
}

/* ---------- 12. Salamandra (trepa paredes/techos, escupe fuego) ---------- */
class Salamander extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 40, h: 18, hp: 30, maxHp: 30, flying: true, contact: 10, col: [230, 100, 40], coins: 5, ceiling: false }, o)); this.set('crawl'); this.cy = y; }
  ai(dt) {
    this.y = this.cy; this.vy = 0;
    if (this.st === 'crawl') { this.vx = this.face * 70; if (Math.abs(this.x - this.home) > 130) this.face = -Math.sign(this.x - this.home); if (this.dist < 460 && this.stT > 1.5) { this.set('inhale'); this.telegraph(66); } }
    else if (this.st === 'inhale') { this.vx = 0; if (this.stT > .7) { this.spit(); this.set('crawl'); } }
  }
  spit() { const H = this.hero, a = Math.atan2(H.y - 30 - this.y, H.x - this.x); for (let i = -1; i <= 1; i++) this.game.spawnProjectile({ owner: 'enemy', kind: 'fireball', x: this.x, y: this.y, vx: Math.cos(a + i * .2) * 300, vy: Math.sin(a + i * .2) * 300, r: 8, dmg: 11, life: 2.5, parryable: true }); Sound.play('explode'); }
  draw(g) {
    const ff = this.flashFill(g), t = this.t; g.save(); g.translate(this.x, this.y); if (this.ceiling) g.scale(1, -1); g.scale(this.face, 1);
    g.fillStyle = ff || '#e0602a'; g.beginPath(); g.moveTo(-34, 0); g.quadraticCurveTo(-20, -6 + Math.sin(t * 8) * 2, 0, -8); g.quadraticCurveTo(18, -12, 26, -6); g.quadraticCurveTo(18, 0, 0, 0); g.closePath(); g.fill();
    g.strokeStyle = '#7a2a10'; g.lineWidth = 3; for (const lx of [-10, 10]) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(lx, -2); g.lineTo(lx + s * 6 + Math.sin(t * 10 + lx) * 3, 4); g.stroke(); }
    g.fillStyle = '#ffd040'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-20 + i * 9, -6, 2, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -8, 2.6, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(19, -8, 1.3, 0, TAU); g.fill();
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); if (this.st === 'inhale') glowAt(g, [255, 140, 40], this.x + this.face * 26, this.y + (this.ceiling ? 6 : -6), 20 + this.stT * 30, .8); }
}

/* ---------- 13. Bruto acorazado (élite, armadura por piezas, remate con inglés) ---------- */
class Brute extends Enemy {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 64, h: 92, hp: 260, maxHp: 260, contact: 14, heavy: true, kbRes: 1, col: [120, 110, 130], coins: 30, elite: true, armored: true, skin: 'iron', name: 'Bruto Acorazado' }, o));
    this.set('intro'); this.armor = [1, 1, 1, 1]; this.poise = 100; this.sealsNeeded = o && o.seal || [2, 3];
  }
  ai(dt) {
    const H = this.hero, d = Math.abs(this.dx);
    if (this.st === 'intro') { this.facePlayer(); if (this.stT > 1) { this.set('walk'); Sound.play('roar', 1.2); } return; }
    if (this.st === 'staggered') { this.vx = 0; if (this.stT > 4.5) { this.set('walk'); this.poise = 100; this.game.toast('¡Se ha recuperado!'); } return; }
    if (this.st === 'walk') { this.facePlayer(); this.vx = this.face * (d > 110 ? 90 : 0); if (this.stT > 1.2) { const r = rnd(); this.set(d < 170 ? (r < .6 ? 'smashUp' : 'sweepUp') : (r < .55 ? 'chargeUp' : 'smashUp')); this.telegraph(this.st === 'chargeUp' ? 50 : 44); } }
    else if (this.st === 'smashUp') { this.vx = 0; if (this.stT > .85) { this.set('smash'); const sx = this.x + this.face * 70; FX.slam(sx, this.y, 1.2); Sound.play('slam', 1); this.game.shake(10, .3); Input.rumble(.6, .4, 200); FX.text(sx, this.y - 60, 'BOOM!', '#ffd25a', 50); this.game.spawnShockwave(sx, this.y, this.face, 360, 14); this.game.spawnShockwave(sx, this.y, -this.face, 200, 14); } }
    else if (this.st === 'smash') { if (this.stT > .8) this.set('walk'); }
    else if (this.st === 'sweepUp') { this.vx = 0; if (this.stT > .6) { this.set('sweep'); Sound.play('swing', true); } }
    else if (this.st === 'sweep') { if (this.stT > .45) this.set('walk'); }
    else if (this.st === 'chargeUp') { this.vx = -this.face * 30; if (this.stT > .7) { this.set('charge'); Sound.play('roar', 1.5); } }
    else if (this.st === 'charge') { this.vx = this.face * 520; if (chance(.6)) FX.footstep(this.x, this.y, this.face, 600); if (this.wall || this.stT > 1.1) { if (this.wall) { this.game.shake(12, .4); FX.slam(this.x + this.face * 30, this.y - 40, .8); this.stun = 1.2; Sound.play('slam'); FX.text(this.x, this.y - 100, 'DIZZY!', '#ffe060', 32); } this.set('walk'); } }
  }
  attackBoxes() {
    if (this.st === 'smash' && this.stT < .12) return [{ x: this.x + this.face * 70 - 50, y: this.y - 70, w: 100, h: 70, dmg: 24, unblockable: false }];
    if (this.st === 'sweep' && this.stT < .3) return [{ x: this.face > 0 ? this.x : this.x - 120, y: this.y - 60, w: 120, h: 50, dmg: 18 }];
    if (this.st === 'charge') return [{ x: this.x - 34, y: this.y - 80, w: 68, h: 76, dmg: 20 }];
    return [];
  }
  onHurt(dmg, dir, info) {
    // la armadura se rompe por piezas
    const frac = this.hp / this.maxHp, idx = frac < .25 ? 3 : frac < .5 ? 2 : frac < .75 ? 1 : 0;
    for (let i = 0; i <= idx; i++) if (this.armor[i]) { this.armor[i] = 0; FX.chunks(this.x, this.y - 50 - i * 8, [150, 150, 165], 6, 380, 1.2); Sound.play('crumble'); FX.text(this.x, this.y - 110, 'ARMOR BREAK!', '#d8e0ff', 28); this.armored = this.armor.some(a => a); }
    this.poise -= dmg * (info.heavy ? 1.6 : 1) * (info.armor || 1);
    if (this.poise <= 0 && this.st !== 'staggered') this.stagger();
  }
  onParried() { this.poise -= 45; this.stun = .6; if (this.poise <= 0) this.stagger(); }
  stagger() { this.set('staggered'); this.vx = 0; FX.text(this.x, this.y - 120, '¡TAMBALEÁNDOSE!', '#ffe080', 30, { comic: false }); this.game.offerFinisher(this); Sound.play('crumble'); }
  hurtFinisher(ok) { if (ok) { this.hp -= this.maxHp * .45; this.armor = [0, 0, 0, 0]; this.armored = false; FX.slam(this.x, this.y, 1.4); if (this.hp <= 0) this.die(); else { this.set('walk'); this.poise = 100; } } else { this.set('smashUp'); this.stT = .5; this.poise = 100; } }
  draw(g) {
    const ff = this.flashFill(g), f = this.face, t = this.t, st = this.st;
    const tilt = st === 'staggered' ? Math.sin(t * 3) * .15 : st === 'charge' ? .25 : 0;
    g.save(); g.translate(this.x, this.y); g.scale(f, 1); g.rotate(tilt);
    const wob = st === 'walk' ? Math.sin(t * 8) * 2 : 0;
    // piernas
    g.fillStyle = ff || '#3a3442'; g.fillRect(-20, -26, 14, 26 + wob); g.fillRect(6, -26, 14, 26 - wob);
    // cuerpo
    const gr = g.createLinearGradient(0, -92, 0, -20); gr.addColorStop(0, '#8a7e98'); gr.addColorStop(1, '#4a4258');
    g.fillStyle = ff || gr; g.beginPath(); g.roundRect(-30, -86, 60, 64, 16); g.fill();
    // placas de armadura
    const plates = [[-30, -86, 26, 26], [4, -86, 26, 26], [-30, -56, 60, 16], [-22, -38, 44, 12]];
    plates.forEach((p, i) => { if (!this.armor[i]) return; const pg = g.createLinearGradient(p[0], p[1], p[0], p[1] + p[3]); pg.addColorStop(0, '#d8dce8'); pg.addColorStop(1, '#7a8090'); g.fillStyle = ff || pg; g.beginPath(); g.roundRect(p[0], p[1], p[2], p[3], 5); g.fill(); g.strokeStyle = '#3a3e4a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a5e6a'; g.beginPath(); g.arc(p[0] + 4, p[1] + 4, 1.6, 0, TAU); g.arc(p[0] + p[2] - 4, p[1] + 4, 1.6, 0, TAU); g.fill(); });
    // cabeza
    g.fillStyle = ff || '#6a6278'; g.beginPath(); g.roundRect(-14, -108, 30, 26, 8); g.fill();
    g.fillStyle = '#ffde50'; g.beginPath(); g.ellipse(6, -96, 4, st === 'staggered' ? 1 : 2.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#2a2430'; g.beginPath(); g.moveTo(-14, -104); g.lineTo(-24, -114); g.lineTo(-10, -108); g.fill();
    // martillo
    const ha = st === 'smashUp' ? -2.4 - Math.min(1, this.stT / .85) * .5 : st === 'smash' ? .5 : st === 'sweepUp' ? -.3 - this.stT : st === 'sweep' ? lerp(-.9, 1.2, Math.min(1, this.stT / .2)) : st === 'charge' ? -.2 : -.9 + Math.sin(t * 2) * .05;
    g.save(); g.translate(22, -66); g.rotate(ha); g.fillStyle = '#4a3020'; g.fillRect(0, -4, 70, 8);
    const hg = g.createLinearGradient(56, -22, 92, 22); hg.addColorStop(0, '#9a9aa8'); hg.addColorStop(1, '#3a3a48'); g.fillStyle = ff || hg; g.beginPath(); g.roundRect(56, -22, 36, 44, 6); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 2; g.stroke();
    g.restore();
    g.fillStyle = ff || '#6a6278'; g.beginPath(); g.arc(22, -66, 10, 0, TAU); g.fill();
    if (st === 'staggered') for (let i = 0; i < 4; i++) { const a = t * 4 + i * 1.6; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(Math.cos(a) * 22, -122 + Math.sin(a) * 5, 3, 0, TAU); g.fill(); }
    g.restore(); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); if (this.st === 'smashUp' || this.st === 'chargeUp' || this.st === 'sweepUp') glowAt(g, [255, 240, 200], this.x + this.face * 50, this.y - 90, 40 + this.stT * 40, .6); if (this.st === 'staggered') glowAt(g, [255, 230, 120], this.x, this.y - 50, 90, .35 + Math.sin(this.t * 8) * .1); }
  deathFX() { FX.chunks(this.x, this.y - 50, [140, 130, 150], 18, 500, 1.5); FX.slam(this.x, this.y, 1.5); FX.text(this.x, this.y - 120, 'K.O.!', '#ffd040', 64); this.game.shake(14, .5); }
}

/* ---------- 14. Mago del reloj (burbujas de tiempo lento) ---------- */
class ClockMage extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 28, h: 56, hp: 46, maxHp: 46, flying: true, contact: 8, col: [200, 180, 120], coins: 9 }, o)); this.set('float'); this.by = y; }
  ai(dt) {
    this.vy = (this.by + Math.sin(this.t * 1.5) * 10 - this.y) * 2; this.facePlayer();
    if (this.st === 'float') { this.vx = 0; if (this.stT > 1.8 && this.dist < 600) { this.set(chance(.5) ? 'cast' : 'blades'); this.telegraph(76); } }
    else if (this.st === 'cast') { if (this.stT > .8) { this.game.spawnTimeBubble(this.hero.x, this.hero.y - 40, 110, 4); this.set('float'); Sound.play('timeStop'); } }
    else if (this.st === 'blades') { if (this.stT > .7) { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .35 + (this.face < 0 ? 0 : 0); this.game.spawnProjectile({ owner: 'enemy', kind: 'clockhand', x: this.x, y: this.y - 30, vx: Math.cos(a + (this.face > 0 ? .9 : -.9) * 1.2) * 340 * this.face, vy: Math.sin(a) * 200 + 160, r: 9, dmg: 10, life: 2.4, delay: i * .08, parryable: true }); } Sound.play('zap'); this.set('teleport'); } }
    else if (this.st === 'teleport') { if (this.stT > .5) { FX.runeBurst(this.x, this.y - 30, [255, 230, 150], 10); this.x = this.home + R(-200, 200); this.by = this.y = this.by + R(-30, 30); FX.runeBurst(this.x, this.y - 30, [255, 230, 150], 10); this.set('float'); } }
  }
  draw(g) {
    const ff = this.flashFill(g), t = this.t;
    g.save(); g.translate(this.x, this.y);
    g.fillStyle = ff || '#3a2e5a'; g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-18, -30, -8, -44); g.lineTo(8, -44); g.quadraticCurveTo(18, -30, 16, 0); g.quadraticCurveTo(0, 6 + Math.sin(t * 4) * 3, -16, 0); g.fill();
    g.strokeStyle = '#d8b860'; g.lineWidth = 2; g.stroke();
    g.fillStyle = ff || '#2a2040'; g.beginPath(); g.moveTo(-12, -42); g.lineTo(0, -76); g.lineTo(12, -42); g.fill();
    g.fillStyle = '#0a0810'; g.beginPath(); g.ellipse(0, -46, 8, 6, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffe080'; g.beginPath(); g.arc(-3, -46, 1.6, 0, TAU); g.arc(3, -46, 1.6, 0, TAU); g.fill();
    // reloj en la mano
    g.save(); g.translate(this.face * 20, -30); g.fillStyle = '#f0e0b0'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill(); g.strokeStyle = '#8a6a20'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = '#222'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t * 3) * 7, Math.sin(t * 3) * 7); g.moveTo(0, 0); g.lineTo(Math.cos(t * .5) * 5, Math.sin(t * .5) * 5); g.stroke(); g.restore();
    g.restore(); this.hpBar(g); this.drawTele(g);
  }
  drawGlow(g) { super.drawGlow(g); glowAt(g, [255, 220, 120], this.x + this.face * 20, this.y - 30, this.st === 'cast' ? 50 : 22, .6); }
  deathFX() { for (let i = 0; i < 10; i++) FX.spawnRaw({ t: 'rune', x: this.x, y: this.y - 30, vx: R(-200, 200), vy: R(-200, 100), g: 200, drag: 1, max: 1, s: 7, col: [255, 230, 140], add: 1, ch: pick(['XII', 'III', 'VI', 'IX']), rot: 0 }); FX.text(this.x, this.y - 60, 'TICK... TOCK!', '#ffe8a0', 26); }
}

/* ---------- 15. Cofre mimo ---------- */
class Mimic extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 40, h: 32, hp: 60, maxHp: 60, contact: 0, col: [160, 110, 60], coins: 40 }, o)); this.set('sleep'); }
  ai(dt) {
    if (this.st === 'sleep') { this.vx = 0; this.inv = .1; if (this.dist < 70) { this.set('wake'); Sound.play('roar', 2); FX.text(this.x, this.y - 60, '!?', '#ffe060', 40); this.contact = 12; } }
    else if (this.st === 'wake') { if (this.stT > .4) this.set('chase'); }
    else if (this.st === 'chase') { this.facePlayer(); if (this.onGround && this.stT > .45) { this.vy = -420; this.vx = this.face * 260; this.stT = 0; Sound.play('swing'); } }
  }
  attackBoxes() { return this.st === 'chase' && !this.onGround ? [{ x: this.x - 22, y: this.y - 36, w: 44, h: 36, dmg: 16 }] : []; }
  draw(g) {
    const ff = this.flashFill(g), open = this.st === 'sleep' ? Math.max(0, Math.sin(this.t * 1.2)) * .06 : .5 + Math.sin(this.t * 14) * .2;
    g.save(); g.translate(this.x, this.y);
    g.fillStyle = ff || '#8a5a2a'; g.beginPath(); g.roundRect(-20, -18, 40, 18, 3); g.fill(); g.strokeStyle = '#c9a23a'; g.lineWidth = 3; g.strokeRect(-20, -18, 40, 18);
    g.save(); g.translate(-20, -18); g.rotate(-open);
    g.fillStyle = ff || '#9a6a32'; g.beginPath(); g.roundRect(0, -14, 40, 14, [6, 6, 0, 0]); g.fill(); g.strokeStyle = '#c9a23a'; g.stroke();
    if (open > .2) { g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(3 + i * 6, 0); g.lineTo(6 + i * 6, 5); g.lineTo(9 + i * 6, 0); g.fill(); } }
    g.restore();
    if (open > .2) { g.fillStyle = '#5a0a1a'; g.fillRect(-18, -18, 36, 5); g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(0, -16, 8, 3, 0, 0, TAU); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-17 + i * 6, -18); g.lineTo(-14 + i * 6, -23); g.lineTo(-11 + i * 6, -18); g.fill(); } }
    g.fillStyle = '#ffd040'; g.beginPath(); g.arc(0, -16, 3, 0, TAU); g.fill();
    g.restore(); if (this.st !== 'sleep') this.hpBar(g);
  }
  deathFX() { FX.chunks(this.x, this.y - 20, [150, 100, 50], 10, 380); FX.text(this.x, this.y - 60, 'JACKPOT!', '#ffd040', 40); }
}

const ENEMY_TYPES = { crab: Crab, jelly: Jelly, gull: Gull, urchin: Urchin, archer: Archer, eel: Eel, shroom: Shroom, wolf: Wolf, beetle: Beetle, bat: Bat, slime: Slime, salamander: Salamander, brute: Brute, clockmage: ClockMage, mimic: Mimic };
