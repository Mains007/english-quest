"use strict";
/* =====================================================================
   JEFES
   - Rey Cangrejo: lateral, se entierra, embiste, marea gigante.
   - Guardián Cronos: de frente; PARA EL TIEMPO (solo el inglés te libera),
     agujas que barren, engranajes, péndulo, rebobinado.
   - Titán de Magma: de frente y gigantesco; puñetazos que ocupan un tercio
     de la pantalla, barrido, meteoritos, rayo ocular, géiseres.
   Al llegar a 0 → SELLO FINAL (preguntas de inglés: 3/5, 4/5 o 5/5).
   ===================================================================== */
class Boss {
  constructor(game, arena, o) {
    this.game = game; this.arena = arena; this.t = 0; this.st = 'intro'; this.stT = 0; this.phase = 1; this.dead = false; this.flash = 0; this.inv = 0;
    this.lastHit = -1; this.boss = true; this.queue = []; this.last = '';
    Object.assign(this, o); this.maxHp = this.hp;
  }
  get hero() { return this.game.hero; }
  set(st) { this.st = st; this.stT = 0; }
  pickAttack(list) { let a; let n = 0; do { a = pick(list); n++; } while (a === this.last && n < 6); this.last = a; return a; }
  hurt(dmg, dir, info = {}, box) {
    if (this.dead || this.st === 'sealing' || this.st === 'intro') return false;
    const mul = box ? box.mul : 1; dmg *= mul * this.dmgMul();
    if (mul < .4) { FX.sparks(info.x || this.x, info.y || this.y, [255, 255, 200], 6, -dir); Sound.play('block'); }
    this.hp -= dmg; this.flash = .1;
    FX.hit(info.x ?? this.x, info.y ?? this.y, dir, mul > 1 ? [255, 240, 120] : [255, 240, 220], mul > 1 || info.heavy);
    FX.text((info.x ?? this.x) + R(-14, 14), (info.y ?? this.y) - 30, Math.round(dmg) + '', mul > 1 ? '#ffe060' : '#fff', mul > 1 ? 34 : 24, { comic: false, max: .6, vy: -70 });
    if (mul > 1.4 && chance(.4)) FX.text(info.x ?? this.x, (info.y ?? this.y) - 70, pick(['CRITICAL!', 'WEAK SPOT!', 'BULLSEYE!']), '#ffd040', 34);
    Sound.play('hit', true); this.onHurt && this.onHurt(dmg, info);
    this.checkPhase();
    if (this.hp <= 0) { this.hp = 0; this.toSeal(); }
    return true;
  }
  dmgMul() { return 1; }
  checkPhase() {
    const f = this.hp / this.maxHp, np = f < .34 ? 3 : f < .67 ? 2 : 1;
    if (np > this.phase) { this.phase = np; Sound.setPhase(np); this.onPhase && this.onPhase(np); }
  }
  toSeal() { this.set('sealing'); this.game.startSeal(this); }
  sealResult(pass) {
    if (pass) { this.dead = true; this.set('dying'); this.game.onBossDefeated(this); }
    else { this.hp = this.maxHp * .35; this.set('recover'); this.game.toast('¡Se ha recuperado! Vuelve a debilitarlo'); Sound.play('roar', .8); }
  }
  vulnerable() { return []; }
  attackBoxes() { return []; }
  drawBack(g) { } drawFront(g) { } drawGlow(g) { }
}

/* ======================= REY CANGREJO ======================= */
class CrabKing extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Rey Cangrejo', title: 'Soberano de la Marea', hp: 900, x: arena.x0 + (arena.x1 - arena.x0) * .7, y: arena.floor, face: -1, music: 'boss' });
    this.claw = { x: 0, y: 0, up: 0, stuck: 0 }; this.plates = [1, 1, 1]; this.burrowX = 0; this.wave = null; this.bubbles = 0;
  }
  dmgMul() { return 1; }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt;
    const H = this.hero, A = this.arena, floor = A.floor;
    if (this.st === 'intro') { if (this.stT > 2.2) { this.set('idle'); } return; }
    if (this.st === 'sealing' || this.st === 'dying') return;
    if (this.st === 'recover') { if (this.stT > 2) this.set('idle'); return; }
    const spd = this.phase === 3 ? 1.35 : this.phase === 2 ? 1.15 : 1;
    if (this.st === 'idle') {
      this.face = Math.sign(H.x - this.x) || this.face;
      this.x += Math.sin(this.t * 1.5) * 30 * dt;
      if (this.stT > 1.1 / spd) {
        const opts = ['slam', 'slam', 'charge', 'bubbles', 'burrow']; if (this.phase >= 2) opts.push('tide', 'slam');
        const a = this.pickAttack(opts); this.set(a + 'Up');
        Sound.play('telegraph', a === 'tide' ? 40 : 52);
        if (a === 'slam') { this.tx = clamp(H.x, A.x0 + 60, A.x1 - 60); }
        if (a === 'tide') { this.game.toast('¡Viene la marea! ¡Sube a las rocas o salta!'); Sound.play('roar', .9); }
      }
    } else if (this.st === 'slamUp') {
      this.tx = lerp(this.tx, clamp(H.x, A.x0 + 60, A.x1 - 60), dt * (this.stT < .6 ? 3 : 0));
      if (this.stT > .95 / spd) { this.set('slam'); FX.slam(this.tx, floor, 1.4); Sound.play('slam', 1.2); this.game.shake(12, .35); Input.rumble(.7, .5, 220); FX.text(this.tx, floor - 120, 'BAM!', '#ffcf5a', 64); this.game.spawnShockwave(this.tx, floor, 1, 260, 12); this.game.spawnShockwave(this.tx, floor, -1, 260, 12); }
    } else if (this.st === 'slam') { if (this.stT > 1.5) this.set('idle'); }
    else if (this.st === 'chargeUp') { this.face = Math.sign(H.x - this.x) || -1; if (chance(.4)) FX.smoke(this.x + R(-60, 60), floor - 4, 1, [230, 220, 200], 6); if (this.stT > .8 / spd) { this.set('charge'); Sound.play('roar', 1.1); } }
    else if (this.st === 'charge') {
      this.x += this.face * 700 * spd * dt; if (chance(.8)) FX.footstep(this.x - this.face * 80, floor, this.face, 700);
      if (this.x < A.x0 + 120 || this.x > A.x1 - 120) { this.x = clamp(this.x, A.x0 + 120, A.x1 - 120); this.set('stunned'); this.game.shake(14, .4); FX.slam(this.x + this.face * 110, floor - 60, 1); Sound.play('slam'); FX.text(this.x, floor - 200, 'CRASH!', '#ffcf5a', 56); }
    }
    else if (this.st === 'stunned') { if (this.stT > 1.6) this.set('idle'); }
    else if (this.st === 'bubblesUp') { if (this.stT > .6) { this.set('bubbles'); this.bubbles = 0; } }
    else if (this.st === 'bubbles') {
      if (this.stT > this.bubbles * .18 && this.bubbles < (this.phase > 1 ? 8 : 5)) {
        this.bubbles++; const vx = (H.x - this.x) / 1.1 + R(-120, 120);
        this.game.spawnProjectile({ owner: 'enemy', kind: 'bubble', x: this.x + this.face * 60, y: floor - 90, vx, vy: -R(380, 520), g: 500, r: 16, dmg: 10, life: 4, poppable: true, bounce: true });
        Sound.play('bubble');
      }
      if (this.stT > 2) this.set('idle');
    }
    else if (this.st === 'burrowUp') { if (this.stT > .6) { this.set('burrow'); this.burrowX = this.x; FX.slam(this.x, floor, .9); Sound.play('crumble'); } }
    else if (this.st === 'burrow') {
      this.burrowX = approach(this.burrowX, H.x, 360 * spd * dt); if (chance(.7)) FX.footstep(this.burrowX + R(-30, 30), floor, R(-1, 1), 400);
      if (this.stT > 2.1) { this.set('eruptWarn'); this.telegraphX = this.burrowX; Sound.play('telegraph', 45); }
    }
    else if (this.st === 'eruptWarn') { if (chance(.9)) FX.footstep(this.telegraphX + R(-60, 60), floor, R(-1, 1), 600); if (this.stT > .65 / spd) { this.set('erupt'); this.x = this.telegraphX; FX.slam(this.x, floor, 1.6); Sound.play('explode'); this.game.shake(14, .4); FX.text(this.x, floor - 220, 'KABOOM!', '#ffcf5a', 60); } }
    else if (this.st === 'erupt') { if (this.stT > 1.3) this.set('idle'); }
    else if (this.st === 'tideUp') { if (this.stT > 1.4) { this.set('tide'); const fromLeft = H.x > (A.x0 + A.x1) / 2 ? 1 : 0; this.wave = { x: fromLeft ? A.x0 - 100 : A.x1 + 100, dir: fromLeft ? 1 : -1, h: 120 }; Sound.play('whoosh'); } }
    else if (this.st === 'tide') {
      const w = this.wave; w.x += w.dir * 520 * dt; if (chance(.9)) for (let i = 0; i < 3; i++) FX.spawnRaw({ t: 'drop', x: w.x + R(-20, 20), y: floor - R(0, w.h), vx: w.dir * R(100, 300), vy: -R(100, 300), g: 900, max: .6, s: 2.5, col: [220, 245, 255] });
      if ((w.dir > 0 && w.x > A.x1 + 120) || (w.dir < 0 && w.x < A.x0 - 120)) { this.wave = null; this.set('idle'); }
    }
  }
  onPhase(p) { this.plates[p - 2] = 0; FX.chunks(this.x, this.arena.floor - 100, [240, 120, 90], 14, 500, 1.4); FX.text(this.x, this.arena.floor - 240, 'SHELL BREAK!', '#ffd0b0', 44); this.game.shake(10, .4); Sound.play('roar', 1); }
  vulnerable() {
    const f = this.arena.floor, out = [];
    if (this.st === 'burrow' || this.st === 'eruptWarn') return out;
    const armorMul = this.plates.filter(Boolean).length ? .55 : 1;
    out.push({ x: this.x - 110, y: f - 130, w: 220, h: 120, mul: this.st === 'stunned' || this.st === 'erupt' ? 1.6 : armorMul });
    if (this.st === 'slam' && this.stT > .05) out.push({ x: this.tx - 70, y: f - 80, w: 140, h: 80, mul: 1.5 });
    return out;
  }
  attackBoxes() {
    const f = this.arena.floor, out = [];
    if (this.st === 'slam' && this.stT < .15) out.push({ x: this.tx - 90, y: f - 120, w: 180, h: 120, dmg: 26 });
    if (this.st === 'charge') out.push({ x: this.x - 120, y: f - 130, w: 240, h: 130, dmg: 22 });
    if (this.st === 'erupt' && this.stT < .25) out.push({ x: this.x - 130, y: f - 200, w: 260, h: 200, dmg: 26 });
    if (this.st === 'tide' && this.wave) out.push({ x: this.wave.x - 40, y: f - this.wave.h, w: 80, h: this.wave.h, dmg: 20, unblockable: true });
    if (!['burrow', 'eruptWarn', 'sealing', 'dying', 'intro'].includes(this.st)) out.push({ x: this.x - 100, y: f - 110, w: 200, h: 100, dmg: 12, contact: true });
    return out;
  }
  drawBack(g) {
    const f = this.arena.floor, t = this.t;
    if (this.st === 'slamUp') { const k = Math.min(1, this.stT / .95); g.fillStyle = `rgba(30,10,10,${.15 + k * .35})`; g.beginPath(); g.ellipse(this.tx, f, 90 * (1.4 - k * .4), 16, 0, 0, TAU); g.fill(); g.strokeStyle = `rgba(255,80,60,${k})`; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(this.tx, f, 90, 16, 0, 0, TAU); g.stroke(); g.setLineDash([]); }
    if (this.st === 'eruptWarn') { g.fillStyle = 'rgba(80,40,10,.35)'; g.beginPath(); g.ellipse(this.telegraphX, f, 130, 18, 0, 0, TAU); g.fill(); }
    if (this.st === 'burrow') { g.fillStyle = '#d8b880'; g.beginPath(); g.ellipse(this.burrowX, f + 4, 70, 26, 0, Math.PI, 0); g.fill(); g.fillStyle = '#c9a46a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(this.burrowX - 50 + i * 20, f - 10 - Math.abs(Math.sin(t * 8 + i)) * 10, 6, 0, TAU); g.fill(); } }
  }
  draw(g) {
    if (this.st === 'burrow' || this.st === 'eruptWarn') return;
    const f = this.arena.floor, t = this.t, ff = this.flash > 0, x = this.x, face = this.face;
    const bodyY = this.st === 'intro' ? f + 160 - Math.min(1, this.stT / 1.6) * 160 : this.st === 'erupt' ? f - Math.max(0, 40 - this.stT * 120) : f;
    const sway = this.st === 'charge' ? Math.sin(t * 30) * 6 : Math.sin(t * 2) * 3;
    g.save(); g.translate(x, bodyY);
    // patas
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) {
      const ph = t * (this.st === 'charge' ? 26 : 4) + i * 1.3 + (s > 0 ? .7 : 0), kx = s * (110 + i * 22), ky = -90 - Math.sin(ph) * 10, fx = s * (130 + i * 26), w = 17 - i * 1.5, far = i % 2;
      const seg = (lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(s * 60, -50); g.lineTo(kx, ky); g.lineTo(fx, -6); g.stroke(); };
      seg(w + 6, '#3a0e06'); seg(w, ff ? '#fff' : far ? '#b8442a' : '#e0603a');
      if (!ff) { g.strokeStyle = far ? '#d86a48' : '#ff9a70'; g.lineWidth = w * .3; g.beginPath(); g.moveTo(lerp(s * 60, kx, .2), lerp(-50, ky, .2) - w * .25); g.lineTo(lerp(s * 60, kx, .85), lerp(-50, ky, .85) - w * .25); g.stroke(); }
      g.fillStyle = '#3a0e06'; g.beginPath(); g.arc(kx, ky, w * .55, 0, TAU); g.fill(); g.fillStyle = ff ? '#fff' : '#ffb08a'; g.beginPath(); g.arc(kx, ky, w * .3, 0, TAU); g.fill();
      g.fillStyle = '#3a0e06'; g.beginPath(); g.moveTo(fx - w * .45, -10); g.lineTo(fx + s * 4, 2); g.lineTo(fx + w * .45, -10); g.fill();
    }
    // caparazón
    g.translate(0, sway);
    g.fillStyle = ff ? '#fff' : '#e8603a'; g.beginPath(); g.ellipse(0, -90, 130, 80, 0, Math.PI, 0); g.quadraticCurveTo(0, -20, -130, -90); g.closePath(); g.fill();
    if (!ff) { g.save(); g.clip(); g.fillStyle = '#b03c22'; g.beginPath(); g.ellipse(0, -40, 150, 46, 0, 0, TAU); g.fill(); g.fillStyle = '#ffa27a'; g.beginPath(); g.ellipse(-30, -168, 90, 22, -.08, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-60, -160, 26, 7, -.25, 0, TAU); g.fill();
      g.fillStyle = '#c24a2a'; for (const [sx, sy, sr] of [[-96, -96, 7], [-80, -70, 5], [92, -100, 8], [104, -76, 5], [70, -70, 4], [-110, -80, 4]]) { g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill(); }
      g.strokeStyle = '#8a2414'; g.lineWidth = 3; g.beginPath(); g.moveTo(-122, -82); for (let x = -110; x <= 120; x += 20) g.lineTo(x, -78 + (x / 20 % 2 ? 4 : -2)); g.stroke(); g.restore(); }
    g.strokeStyle = '#3a0e06'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, -90, 130, 80, 0, Math.PI, 0); g.quadraticCurveTo(0, -20, -130, -90); g.closePath(); g.stroke();
    // boca con burbujas
    g.fillStyle = '#5a140a'; g.beginPath(); g.ellipse(face * 40, -60, 22, 8, 0, 0, Math.PI); g.fill(); g.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(face * 40 + k * 8 - 3, -60); g.lineTo(face * 40 + k * 8, -54); g.lineTo(face * 40 + k * 8 + 3, -60); g.fill(); }
    // placas
    this.plates.forEach((p, i) => { if (!p) return; g.fillStyle = ff ? '#fff' : '#ffb08a'; g.beginPath(); g.ellipse(-60 + i * 60, -128, 34, 22, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#7a2a14'; g.lineWidth = 3; g.stroke(); for (let k = -1; k <= 1; k++) { g.fillStyle = '#e0704c'; g.beginPath(); g.arc(-60 + i * 60 + k * 12, -132, 3.5, 0, TAU); g.fill(); } });
    // corona de coral
    g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(-50, -165); for (let i = 0; i <= 6; i++) { g.lineTo(-50 + i * 16.6, -165 - (i % 2 ? 0 : 30)); } g.lineTo(50, -165); g.closePath(); g.fill(); g.strokeStyle = '#8a6a10'; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#ff5a8a', '#5ad0ff', '#7aff8a', '#ff5a8a'][i]; g.beginPath(); g.arc(-34 + i * 22.6, -172, 4, 0, TAU); g.fill(); }
    // ojos
    for (const s of [-1, 1]) { for (const [lw, c] of [[13, '#3a0e06'], [8, '#e0603a']]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(s * 26 + face * 30, -150); g.lineTo(s * 30 + face * 40, -200); g.stroke(); } g.fillStyle = '#3a0e06'; g.beginPath(); g.arc(s * 30 + face * 40, -205, 17, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 30 + face * 40, -205, 14, 0, TAU); g.fill(); g.fillStyle = this.st === 'stunned' ? '#888' : '#111'; g.beginPath(); g.arc(s * 30 + face * 45, -205, 7, 0, TAU); g.fill(); if (this.st !== 'stunned') { g.strokeStyle = '#5a140a'; g.lineWidth = 4; g.beginPath(); g.moveTo(s * 30 + face * 40 - 14, -222 - s * 4); g.lineTo(s * 30 + face * 40 + 12, -216 + s * 4); g.stroke(); } }
    if (this.st === 'stunned') for (let i = 0; i < 5; i++) { const a = t * 4 + i * 1.25; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(Math.cos(a) * 60, -240 + Math.sin(a) * 10, 5, 0, TAU); g.fill(); }
    // pinza que golpea / en reposo
    g.restore();
    this.drawClaw(g, f);
  }
  drawClaw(g, f) {
    const ff = this.flash > 0; let cx, cy, ang = 0, s = 1;
    if (this.st === 'slamUp') { const k = Math.min(1, this.stT / .95); cx = this.tx; cy = f - 380 - Math.sin(this.t * 20) * 4 * k; ang = -.2; }
    else if (this.st === 'slam') { cx = this.tx; cy = f - 50; ang = .1; }
    else { cx = this.x + this.face * 150; cy = f - 120 + Math.sin(this.t * 2) * 6; ang = -.4 * this.face; s = .85; }
    g.save(); g.translate(cx, cy); g.rotate(ang); g.scale(s * (this.st === 'slam' || this.st === 'slamUp' ? 1 : this.face), s);
    const O = '#3a0e06', C = ff ? '#fff' : '#e8603a', Sd = ff ? '#fff' : '#b03c22', Lt = '#ffa27a';
    const fingers = () => { g.beginPath(); g.moveTo(30, -20); g.quadraticCurveTo(110, -74, 124, -10); g.quadraticCurveTo(82, -26, 40, 0); g.closePath(); g.moveTo(30, 20); g.quadraticCurveTo(100, 52, 114, 8); g.quadraticCurveTo(70, 20, 40, 6); g.closePath(); };
    g.lineJoin = 'round'; g.strokeStyle = O; g.lineWidth = 10; fingers(); g.stroke(); g.beginPath(); g.ellipse(0, 0, 90, 56, 0, 0, TAU); g.stroke();
    g.fillStyle = Sd; fingers(); g.fill(); g.fillStyle = C; g.beginPath(); g.ellipse(0, 0, 90, 56, 0, 0, TAU); g.fill();
    if (!ff) { g.save(); g.beginPath(); g.ellipse(0, 0, 90, 56, 0, 0, TAU); g.clip(); g.fillStyle = Sd; g.beginPath(); g.ellipse(10, 46, 100, 30, 0, 0, TAU); g.fill(); g.fillStyle = Lt; g.beginPath(); g.ellipse(-20, -36, 60, 16, -.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-36, -38, 18, 5, -.2, 0, TAU); g.fill(); g.restore();
      g.fillStyle = '#fff3e0'; for (const [x, y] of [[64, -30], [84, -36], [100, -30], [60, 26], [80, 30]]) { g.beginPath(); g.moveTo(x - 4, y + (y < 0 ? 4 : -4)); g.lineTo(x, y + (y < 0 ? 10 : -10)); g.lineTo(x + 4, y + (y < 0 ? 4 : -4)); g.fill(); } }
    if (this.st === 'slam') { g.fillStyle = 'rgba(255,255,200,.6)'; g.beginPath(); g.arc(-10, -10, 16, 0, TAU); g.fill(); }
    g.restore();
  }
  drawFront(g) {
    const w = this.wave, f = this.arena.floor; if (!w) return;
    g.save(); const gr = g.createLinearGradient(0, f - w.h, 0, f); gr.addColorStop(0, 'rgba(230,250,255,.95)'); gr.addColorStop(.3, 'rgba(90,200,230,.85)'); gr.addColorStop(1, 'rgba(30,110,170,.9)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(w.x - w.dir * 400, f);
    for (let i = 0; i <= 20; i++) { const xx = w.x - w.dir * 400 + w.dir * i * 20, k = i / 20; g.lineTo(xx, f - w.h * Math.pow(k, 1.6) * (1 + Math.sin(this.t * 10 + i) * .05)); }
    g.quadraticCurveTo(w.x + w.dir * 40, f - w.h - 30, w.x + w.dir * 30, f - w.h + 20); g.lineTo(w.x + w.dir * 10, f); g.closePath(); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(w.x + w.dir * (10 - i * 12), f - w.h + 6 + i * 3 + Math.sin(this.t * 14 + i) * 3, 9 - i * .6, 0, TAU); g.fill(); }
    g.restore();
  }
  drawGlow(g) { const f = this.arena.floor; if (this.st === 'slamUp') glowAt(g, [255, 80, 60], this.tx, f, 120, Math.min(.6, this.stT)); if (this.st === 'chargeUp') glowAt(g, [255, 255, 255], this.x, f - 100, 150, .3); }
}

/* ======================= GUARDIÁN CRONOS ======================= */
class ChronoGuardian extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Guardián Cronos', title: 'Señor del Tiempo Detenido', hp: 1100, x: (arena.x0 + arena.x1) / 2, y: arena.floor - 330, music: 'boss' });
    this.handA = 0; this.handB = Math.PI; this.handSpd = .5; this.coreOpen = 0; this.pend = null; this.daggers = []; this.gears = []; this.rewind = 0;
  }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt; this.coreOpen = Math.max(0, this.coreOpen - dt);
    const H = this.hero, A = this.arena, f = A.floor, cx = this.x, cy = this.y;
    if (this.st === 'intro') { if (this.stT > 2.4) this.set('idle'); return; }
    if (this.st === 'sealing' || this.st === 'dying') return;
    if (this.st === 'frozen') return;   // el juego gestiona la pregunta del tiempo detenido
    const spd = 1 + (this.phase - 1) * .22;
    this.handA += dt * this.handSpd * spd; this.handB += dt * this.handSpd * .25 * spd;
    for (const gr of this.gears) { gr.x += gr.vx * dt; gr.rot += gr.vx * dt / gr.r; if (gr.x < A.x0 - 100 || gr.x > A.x1 + 100) gr.dead = true; }
    this.gears = this.gears.filter(g2 => !g2.dead);
    if (this.pend) { this.pend.a = Math.sin(this.pend.t * 1.6 * spd) * 1.05; this.pend.t += dt; if (this.pend.t > 6) this.pend = null; }
    if (this.st === 'recover') { if (this.stT > 2) this.set('idle'); return; }
    if (this.st === 'idle') {
      this.handSpd = .5;
      if (this.stT > 1.3 / spd) {
        const opts = ['sweep', 'gears', 'timestop']; if (this.phase >= 2) opts.push('pendulum', 'sweep'); if (this.phase >= 3) opts.push('rewind', 'timestop');
        const a = this.pickAttack(opts); this.set(a + 'Up'); Sound.play('telegraph', 60);
        if (a === 'timestop') { this.game.toast('El reloj brilla... ¡va a PARAR EL TIEMPO!'); }
      }
    } else if (this.st === 'sweepUp') { this.handSpd = 0; if (this.stT > .8) { this.set('sweep'); Sound.play('whoosh'); } }
    else if (this.st === 'sweep') { this.handSpd = 2.4; if (this.stT > 2.6) { this.set('open'); this.coreOpen = 3.2; Sound.play('gate'); this.game.toast('¡El núcleo está abierto! ¡Sube y golpéalo!'); } }
    else if (this.st === 'open') { if (this.stT > 3.2) this.set('idle'); }
    else if (this.st === 'gearsUp') { if (this.stT > .6) { this.set('gears'); const n = this.phase + 1; for (let i = 0; i < n; i++) { const d = i % 2 ? -1 : 1; this.gears.push({ x: d > 0 ? A.x0 - 60 - i * 260 : A.x1 + 60 + i * 260, vx: d * (260 + i * 30) * spd, r: 34 + (i % 2) * 18, rot: 0 }); } Sound.play('crumble'); } }
    else if (this.st === 'gears') { if (this.stT > 2.5) this.set('idle'); }
    else if (this.st === 'pendulumUp') { if (this.stT > .8) { this.set('pendulum'); this.pend = { t: 0, a: 0 }; } }
    else if (this.st === 'pendulum') { if (this.stT > 4) this.set('idle'); }
    else if (this.st === 'timestopUp') { if (this.stT > 1.2) { this.set('frozen'); this.daggers = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; this.daggers.push({ x: H.x + Math.cos(a) * 130, y: H.y - 40 + Math.sin(a) * 110, a: a + Math.PI, tx: H.x, ty: H.y - 30 }); } this.game.timeStop(this); } }
    else if (this.st === 'rewindUp') { if (this.stT > .6) { this.set('rewind'); this.rewind = 0; Sound.play('timeStop'); this.game.toast('¡Está rebobinando su tiempo! ¡Golpea el reloj de arena!'); } }
    else if (this.st === 'rewind') { this.rewind += dt; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .02 * dt); this.handSpd = -3; if (this.stT > 3.5) this.set('idle'); }
  }
  timeStopResult(ok) {
    // tras la pregunta: acierto → rompes el hechizo y golpeas; fallo → las dagas te alcanzan
    const H = this.hero;
    if (ok) { for (const d of this.daggers) FX.chunks(d.x, d.y, [230, 220, 160], 3, 200, .5); this.hurt(this.maxHp * .08, 1, { x: this.x, y: this.y, heavy: true }, { mul: 1 }); FX.text(H.x, H.y - 120, 'TIME BREAK!', '#ffe9a0', 52); this.coreOpen = 2.5; }
    else { this.daggers.forEach((d, i) => FX.trail(d.x, d.y, [255, 220, 140], 6)); H.inv = 0; H.hurt(22, this.x, { unblockable: true, kb: 200 }); }
    this.daggers = []; this.set('idle');
  }
  vulnerable() {
    const out = [], cx = this.x, cy = this.y;
    if (this.coreOpen > 0) out.push({ x: cx - 46, y: cy - 46, w: 92, h: 92, mul: 2 });
    if (this.st === 'rewind') out.push({ x: cx - 30, y: cy + 110, w: 60, h: 80, mul: 2.2, interrupt: true });
    out.push({ x: cx - 170, y: cy - 170, w: 340, h: 340, mul: .25 });
    for (const gr of this.gears) out.push({ x: gr.x - gr.r, y: this.arena.floor - gr.r * 2, w: gr.r * 2, h: gr.r * 2, mul: .4, gear: gr });
    return out;
  }
  onHurt(d, info) { if (this.st === 'rewind' && info && info.box && info.box.interrupt) { this.set('idle'); FX.text(this.x, this.y + 80, 'INTERRUPTED!', '#ffe060', 40); } }
  attackBoxes() {
    const out = [], cx = this.x, cy = this.y, f = this.arena.floor;
    if (this.st === 'sweep' || this.st === 'rewind') for (const [a, L] of [[this.handA, 520], [this.handB, 360]]) {
      for (let k = 2; k <= 10; k++) { const r = L * k / 10, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (y < f + 10) out.push({ x: x - 16, y: y - 16, w: 32, h: 32, dmg: 18 }); }
    }
    for (const gr of this.gears) out.push({ x: gr.x - gr.r * .8, y: f - gr.r * 2, w: gr.r * 1.6, h: gr.r * 2, dmg: 16 });
    if (this.pend) { const px = cx + Math.sin(this.pend.a) * 470, py = cy - 260 + Math.cos(this.pend.a) * 700; out.push({ x: px - 50, y: py - 50, w: 100, h: 100, dmg: 24 }); }
    return out;
  }
  drawBack(g) {
    const cx = this.x, cy = this.y, t = this.t, ff = this.flash > 0, f = this.arena.floor;
    const rise = this.st === 'intro' ? (1 - Math.min(1, this.stT / 2)) * 500 : 0;
    g.save(); g.translate(0, rise);
    // cuerpo de piedra y bronce
    const gr = g.createLinearGradient(cx - 260, 0, cx + 260, 0); gr.addColorStop(0, '#4a4a5a'); gr.addColorStop(.5, '#8a8a9a'); gr.addColorStop(1, '#3a3a48');
    g.fillStyle = ff ? '#ddd' : gr; g.beginPath(); g.moveTo(cx - 260, f + 60); g.lineTo(cx - 230, cy - 120); g.quadraticCurveTo(cx, cy - 300, cx + 230, cy - 120); g.lineTo(cx + 260, f + 60); g.fill();
    g.strokeStyle = '#2a2a34'; g.lineWidth = 4; g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = '#6a6a7a'; g.beginPath(); g.ellipse(cx + s * 250, cy - 140, 70, 50, 0, 0, TAU); g.fill(); g.strokeStyle = '#c9a23a'; g.lineWidth = 6; g.stroke(); }
    // cabeza
    g.fillStyle = '#7a7a8a'; g.beginPath(); g.roundRect(cx - 70, cy - 330, 140, 110, 30); g.fill(); g.strokeStyle = '#c9a23a'; g.lineWidth = 5; g.stroke();
    const eyeC = this.st === 'timestopUp' ? [255, 255, 255] : [140, 220, 255];
    for (const s of [-1, 1]) { g.fillStyle = rgba(eyeC); g.beginPath(); g.ellipse(cx + s * 30, cy - 280, 14, this.st === 'frozen' ? 3 : 8, 0, 0, TAU); g.fill(); }
    // esfera del reloj
    g.fillStyle = '#efe2b8'; g.beginPath(); g.arc(cx, cy, 170, 0, TAU); g.fill(); g.strokeStyle = '#c9a23a'; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#7a5a10'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 160, 0, TAU); g.stroke();
    g.fillStyle = '#3a2a10'; g.font = '700 26px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = i / 12 * TAU - Math.PI / 2; g.fillText(n, cx + Math.cos(a) * 134, cy + Math.sin(a) * 134); });
    // núcleo
    const open = this.coreOpen > 0 ? Math.min(1, this.coreOpen * 3) : 0;
    g.fillStyle = '#2a2a34'; g.beginPath(); g.arc(cx, cy, 46, 0, TAU); g.fill();
    if (open) { const cg = g.createRadialGradient(cx, cy, 2, cx, cy, 44); cg.addColorStop(0, '#fff'); cg.addColorStop(.5, '#8ae0ff'); cg.addColorStop(1, '#2a6aa8'); g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, 40 * open, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#c9a23a'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * .2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); g.stroke(); } }
    // reloj de arena (rebobinado)
    g.save(); g.translate(cx, cy + 150); g.fillStyle = '#c9a23a'; g.fillRect(-32, -4, 64, 8); g.fillRect(-32, 76, 64, 8);
    g.fillStyle = 'rgba(200,240,255,.5)'; g.beginPath(); g.moveTo(-26, 4); g.lineTo(26, 4); g.lineTo(4, 40); g.lineTo(26, 76); g.lineTo(-26, 76); g.lineTo(-4, 40); g.closePath(); g.fill();
    const sand = this.st === 'rewind' ? 1 - (this.stT % 1) : .5; g.fillStyle = '#ffd070'; g.beginPath(); g.moveTo(-26 * sand, 40 - 34 * sand); g.lineTo(26 * sand, 40 - 34 * sand); g.lineTo(0, 40); g.fill(); g.beginPath(); g.moveTo(-26 * (1 - sand), 76); g.lineTo(26 * (1 - sand), 76); g.lineTo(0, 76 - 30 * (1 - sand)); g.fill();
    g.restore();
    g.restore();
  }
  draw(g) {
    const cx = this.x, cy = this.y, f = this.arena.floor;
    // agujas del reloj (mortales cuando barren)
    for (const [a, L, w] of [[this.handA, 520, 12], [this.handB, 360, 18]]) {
      const danger = this.st === 'sweep' || this.st === 'rewind', prep = this.st === 'sweepUp';
      g.save(); g.translate(cx, cy); g.rotate(a);
      g.fillStyle = danger ? '#fff6d0' : '#2a2018'; g.strokeStyle = prep ? '#ff6060' : '#c9a23a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-30, -w / 2); g.lineTo(L - 40, -w / 2); g.lineTo(L, 0); g.lineTo(L - 40, w / 2); g.lineTo(-30, w / 2); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    g.fillStyle = '#c9a23a'; g.beginPath(); g.arc(cx, cy, 20, 0, TAU); g.fill();
    // engranajes rodantes
    for (const gr of this.gears) drawGear(g, gr.x, f - gr.r, gr.r, gr.rot);
    // péndulo
    if (this.pend) { const px = cx + Math.sin(this.pend.a) * 470, py = cy - 260 + Math.cos(this.pend.a) * 700; g.strokeStyle = '#c9a23a'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy - 260); g.lineTo(px, py); g.stroke(); const pg = g.createRadialGradient(px - 14, py - 14, 4, px, py, 54); pg.addColorStop(0, '#fff3c0'); pg.addColorStop(1, '#8a6a10'); g.fillStyle = pg; g.beginPath(); g.arc(px, py, 52, 0, TAU); g.fill(); }
    // dagas congeladas
    for (const d of this.daggers) { g.save(); g.translate(d.x, d.y); g.rotate(Math.atan2(d.ty - d.y, d.tx - d.x)); g.fillStyle = '#e8e0c0'; g.beginPath(); g.moveTo(-14, -4); g.lineTo(14, 0); g.lineTo(-14, 4); g.fill(); g.fillStyle = '#c9a23a'; g.fillRect(-20, -3, 7, 6); g.restore(); }
  }
  drawGlow(g) {
    if (this.st === 'timestopUp') glowAt(g, [255, 250, 220], this.x, this.y, 300 + this.stT * 200, Math.min(1, this.stT));
    if (this.coreOpen > 0) glowAt(g, [140, 220, 255], this.x, this.y, 120, .8);
    if (this.st === 'rewind') glowAt(g, [255, 220, 120], this.x, this.y + 190, 80, .7);
    for (const d of this.daggers) glowAt(g, [255, 230, 150], d.x, d.y, 20, .6);
  }
}
function drawGear(g, x, y, r, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const gr = g.createRadialGradient(-r * .3, -r * .3, 2, 0, 0, r); gr.addColorStop(0, '#f0d27a'); gr.addColorStop(1, '#8a6a10');
  g.fillStyle = gr; g.beginPath(); const n = Math.round(r / 5); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? r : r * .84; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
  g.strokeStyle = '#5a4008'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a4008'; g.beginPath(); g.arc(0, 0, r * .25, 0, TAU); g.fill();
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(60,40,0,.5)'; g.beginPath(); g.arc(Math.cos(i * TAU / 4) * r * .55, Math.sin(i * TAU / 4) * r * .55, r * .14, 0, TAU); g.fill(); }
  g.restore();
}

/* ======================= TITÁN DE MAGMA ======================= */
let TITAN_SPR = null;
function titanSprites() {
  if (TITAN_SPR) return TITAN_SPR;
  const rel = (w, h, draw) => {
    const M = 26, mask = mk(w + M * 2, h + M * 2), m = mask.getContext('2d'); m.translate(M, M); m.fillStyle = matFill('basalt'); draw(m);
    const r = renderRelief(mask, 1000, 1000, M, w, h, { emit: true, ambient: .55, sky: [255, 150, 100], skyK: .35, depth: .3, light: [-.35, -.8, .55] });
    const c = mk(w, h), g = c.getContext('2d'); g.putImageData(r.img, 0, 0);
    if (r.emit) { const e = mk(w, h); e.getContext('2d').putImageData(r.emit, 0, 0); g.globalCompositeOperation = 'lighter'; g.drawImage(e, 0, 0); g.drawImage(e, 0, 0); }
    return c;
  };
  const torso = rel(780, 560, m => { m.beginPath(); m.moveTo(60, 560); m.quadraticCurveTo(30, 240, 200, 120); m.quadraticCurveTo(390, 40, 580, 120); m.quadraticCurveTo(750, 240, 720, 560); m.closePath(); m.fill(); m.beginPath(); m.ellipse(120, 180, 120, 86, -.35, 0, TAU); m.fill(); m.beginPath(); m.ellipse(660, 180, 120, 86, .35, 0, TAU); m.fill(); });
  const head = rel(320, 340, m => {
    m.beginPath(); m.moveTo(50, 230); m.lineTo(40, 120); m.lineTo(100, 70); m.lineTo(220, 70); m.lineTo(280, 120); m.lineTo(270, 230); m.quadraticCurveTo(160, 300, 50, 230); m.fill();
    for (const s2 of [-1, 1]) { const x = 160 + s2 * 90; m.beginPath(); m.moveTo(x, 110); m.quadraticCurveTo(x + s2 * 90, 40, x + s2 * 70, -60 + 70); m.quadraticCurveTo(x + s2 * 40, 60, x - s2 * 30, 90); m.fill(); }
  });
  const fist = rel(360, 230, m => { m.beginPath(); m.roundRect(10, 50, 340, 170, 60); m.fill(); for (let i = 0; i < 4; i++) { m.beginPath(); m.roundRect(28 + i * 78, 20, 70, 80, 26); m.fill(); } m.beginPath(); m.ellipse(330, 150, 40, 60, .3, 0, TAU); m.fill(); });
  const hand = rel(340, 200, m => { m.beginPath(); m.ellipse(170, 70, 150, 66, -.15, 0, TAU); m.fill(); for (let i = 0; i < 4; i++) { m.beginPath(); m.ellipse(70 + i * 62, 140 + (i % 2) * 6, 24, 46, .1, 0, TAU); m.fill(); } m.beginPath(); m.ellipse(320, 60, 26, 50, -.8, 0, TAU); m.fill(); });
  TITAN_SPR = { torso, head, fist, hand }; return TITAN_SPR;
}
class MagmaTitan extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Titán de Magma', title: 'El Corazón del Volcán', hp: 1500, x: (arena.x0 + arena.x1) / 2, y: arena.floor, music: 'boss' });
    this.hands = [{ side: -1, x: 0, y: 0, st: 'rest', t: 0, crack: 0 }, { side: 1, x: 0, y: 0, st: 'rest', t: 0, crack: 0 }];
    this.headY = 0; this.slump = 0; this.meteors = []; this.beam = null; this.geysers = []; this.eyeCharge = 0;
    this.resetHands(); this.spr = titanSprites();
  }
  resetHands() { for (const h of this.hands) { h.st = 'rest'; h.t = 0; } }
  restPos(h) { return [this.x + h.side * 330, this.arena.floor - 280 + Math.sin(this.t * 1.3 + h.side) * 14]; }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt;
    const H = this.hero, A = this.arena, f = A.floor;
    for (const h of this.hands) this.updateHand(h, dt);
    for (const m of this.meteors) { m.t += dt; if (m.t > m.delay) { m.y += m.vy * dt; m.vy += 1400 * dt; if (chance(.9)) { FX.embers(m.x, m.y, 1, 60); FX.smoke(m.x, m.y - 10, 1, [60, 40, 40], 8); } if (m.y >= f) { m.dead = true; FX.slam(m.x, f, 1); Sound.play('explode'); FX.decal(m.x, f, 'scorch', 50); this.game.shake(6, .2); this.game.spawnFire(m.x, f, 50, 2.5); this.game.dealAreaToHero(m.x, f - 30, 70, 18); } } }
    this.meteors = this.meteors.filter(m => !m.dead);
    for (const gy of this.geysers) { gy.t += dt; if (gy.t > 1 && !gy.fired) { gy.fired = true; Sound.play('explode'); FX.splash(gy.x, f, 'lava', 1.6); } if (gy.t > 1 && gy.t < 1.7) this.game.dealAreaToHero(gy.x, f - 120, 50, 20, true); }
    this.geysers = this.geysers.filter(gy => gy.t < 2);
    if (this.beam) this.updateBeam(dt);
    if (this.st === 'intro') { if (this.stT > 3) { this.set('idle'); } return; }
    if (this.st === 'sealing' || this.st === 'dying') return;
    if (this.st === 'recover') { if (this.stT > 2.5) this.set('idle'); return; }
    if (this.st === 'slump') { this.slump = approach(this.slump, 1, dt * 2); if (this.stT > 5.5) { this.set('rise'); } return; }
    if (this.st === 'rise') { this.slump = approach(this.slump, 0, dt * 1.2); if (this.slump <= 0) this.set('idle'); return; }
    const spd = 1 + (this.phase - 1) * .25;
    if (this.st === 'idle') {
      if (this.stT > 1.4 / spd && this.hands.every(h => h.st === 'rest')) {
        const opts = ['slam', 'slam', 'sweep', 'meteors']; if (this.phase >= 2) opts.push('beam', 'double'); if (this.phase >= 3) opts.push('geysers', 'double');
        const a = this.pickAttack(opts); this.set(a);
        if (a === 'slam') this.startSlam(H.x > this.x ? 1 : 0);
        if (a === 'double') { this.startSlam(0); setTimeout(() => this.startSlam(1), 700 / spd); }
        if (a === 'sweep') { const h = this.hands[H.x > this.x ? 0 : 1]; h.st = 'sweepUp'; h.t = 0; Sound.play('telegraph', 40); this.game.toast('¡Barrido! ¡Salta!'); }
        if (a === 'meteors') { Sound.play('roar', .8); this.game.shake(6, 1); for (let i = 0; i < 6 + this.phase * 3; i++) this.meteors.push({ x: R(A.x0 + 40, A.x1 - 40), y: -300 - R(0, 400), vy: 300, t: 0, delay: i * .22 + .6 }); }
        if (a === 'beam') { this.eyeCharge = .001; Sound.play('charge'); this.game.toast('¡Sus ojos se cargan! ¡Esquiva (○) a través del rayo!'); }
        if (a === 'geysers') { for (let i = 0; i < 4; i++) this.geysers.push({ x: H.x + (i - 1.5) * 150, t: -i * .25 }); }
      }
      if (this.st !== 'idle' && this.stT > 4) this.set('idle');
    } else if (this.stT > 4.5) this.set('idle');
    if (this.eyeCharge) { this.eyeCharge += dt; if (this.eyeCharge > 1.3) { this.eyeCharge = 0; const fromLeft = H.x > this.x; this.beam = { x: fromLeft ? A.x0 : A.x1, dir: fromLeft ? 1 : -1, t: 0 }; Sound.play('ultFire'); } }
  }
  startSlam(i) {
    const h = this.hands[i]; if (h.st !== 'rest') return;
    h.st = 'rise'; h.t = 0; h.tx = clamp(this.hero.x, this.arena.x0 + 170, this.arena.x1 - 170); Sound.play('telegraph', 38);
  }
  updateHand(h, dt) {
    h.t += dt; const f = this.arena.floor, H = this.hero, spd = 1 + (this.phase - 1) * .2;
    const [rx, ry] = this.restPos(h);
    if (h.st === 'rest') { h.x = lerp(h.x || rx, rx, dt * 4); h.y = lerp(h.y || ry, ry, dt * 4); }
    else if (h.st === 'rise') { h.x = lerp(h.x, h.tx, dt * 3); h.y = lerp(h.y, f - 720, dt * 4); h.tx = lerp(h.tx, clamp(H.x, this.arena.x0 + 170, this.arena.x1 - 170), dt * (h.t < .7 ? 2.5 : 0)); if (h.t > 1.15 / spd) { h.st = 'fall'; h.t = 0; } }
    else if (h.st === 'fall') { h.x = h.tx; h.y += 2600 * dt; if (h.y >= f - 90) { h.y = f - 90; h.st = 'stuck'; h.t = 0; FX.slam(h.x, f, 2); Sound.play('slam', 1.5); this.game.shake(18, .5); Input.rumble(1, .8, 350); FX.text(h.x, f - 260, pick(['BOOOM!', 'KRA-KOOM!', 'SMASH!']), '#ffb040', 80); this.game.spawnShockwave(h.x + 170, f, 1, 420, 14); this.game.spawnShockwave(h.x - 170, f, -1, 420, 14); this.game.dealAreaToHero(h.x, f - 80, 175, 30, true); } }
    else if (h.st === 'stuck') { if (chance(.3)) FX.embers(h.x + R(-120, 120), f - R(0, 100), 1, 80); if (h.t > 1.8 / spd) { h.st = 'back'; h.t = 0; } }
    else if (h.st === 'back') { h.x = lerp(h.x, rx, dt * 3); h.y = lerp(h.y, ry, dt * 3); if (h.t > .8) h.st = 'rest'; }
    else if (h.st === 'sweepUp') { const sx = h.side < 0 ? this.arena.x0 - 200 : this.arena.x1 + 200; h.x = lerp(h.x, sx, dt * 3); h.y = lerp(h.y, f - 80, dt * 3); if (h.t > 1.1) { h.st = 'sweep'; h.t = 0; Sound.play('whoosh'); } }
    else if (h.st === 'sweep') { h.x += -h.side * 1200 * spd * dt; h.y = f - 70; if (chance(.9)) FX.footstep(h.x, f, h.side, 800); if ((h.side < 0 && h.x > this.arena.x1 + 220) || (h.side > 0 && h.x < this.arena.x0 - 220)) { h.st = 'back'; h.t = 0; } }
  }
  updateBeam(dt) {
    const b = this.beam, A = this.arena; b.t += dt; b.x += b.dir * 620 * dt;
    this.game.shake(4, .1); if (chance(.9)) { FX.embers(b.x, A.floor - 10, 2, 200); FX.smoke(b.x, A.floor - 10, 1, [80, 40, 30], 10); }
    this.game.dealAreaToHero(b.x, A.floor - 40, 40, 22, true, 'beam');
    if (b.x < A.x0 - 50 || b.x > A.x1 + 50) this.beam = null;
  }
  onHurt(d, info) {
    const h = info && info.box && info.box.hand; if (h) { h.crack = Math.min(4, h.crack + d / 60); }
    // al cruzar umbrales: se desploma y expone la cabeza
  }
  onPhase(p) { this.set('slump'); this.resetHands(); this.meteors = []; this.beam = null; this.eyeCharge = 0; Sound.play('roar', .7); this.game.shake(16, 1); FX.text(this.x, this.arena.floor - 300, '¡SE DESPLOMA!', '#ffe060', 54, { comic: false }); this.game.toast('¡Su cabeza está a tu alcance! ¡Ataca el cristal!'); }
  headPos() { const f = this.arena.floor; return [this.x, lerp(f - 455, f - 170, this.slump) + Math.sin(this.t * 1.1) * 6]; }
  vulnerable() {
    const out = [];
    for (const h of this.hands) if (h.st === 'stuck') out.push({ x: h.x - 170, y: h.y - 90, w: 340, h: 180, mul: 1, hand: h });
    const [hx, hy] = this.headPos();
    if (this.slump > .6) out.push({ x: hx - 90, y: hy - 90, w: 180, h: 150, mul: 2.6 });
    return out;
  }
  attackBoxes() {
    const out = [];
    for (const h of this.hands) {
      if (h.st === 'fall') out.push({ x: h.x - 170, y: h.y - 90, w: 340, h: 180, dmg: 30, unblockable: true });
      if (h.st === 'sweep') out.push({ x: h.x - 130, y: h.y - 70, w: 260, h: 130, dmg: 24 });
    }
    return out;
  }
  drawBack(g) {
    const f = this.arena.floor, t = this.t, ff = this.flash > 0, cx = this.x, S = this.spr;
    const rise = this.st === 'intro' ? (1 - easeOut(Math.min(1, this.stT / 2.6))) * 700 : 0;
    const [hx, hy0] = this.headPos(); const hy = hy0 + rise;
    const ty = lerp(f - 330, f - 70, this.slump) + rise + Math.sin(t * 1.1) * 4;
    g.drawImage(S.torso, cx - 390, ty - 130);
    if (ff) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(S.torso, cx - 390, ty - 130); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // pecho: núcleo de magma latiendo
    const pulse = .6 + .4 * Math.sin(t * 3);
    const cg = g.createRadialGradient(cx, ty + 120, 4, cx, ty + 120, 70); cg.addColorStop(0, `rgba(255,240,170,${pulse})`); cg.addColorStop(.5, `rgba(255,120,30,${pulse * .8})`); cg.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = cg; g.beginPath(); g.arc(cx, ty + 120, 70, 0, TAU); g.fill();
    // cabeza
    g.save(); g.translate(hx, hy); g.rotate(Math.sin(t * .7) * .03 + this.slump * .08);
    g.drawImage(S.head, -160, -190);
    if (ff) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(S.head, -160, -190); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const ec = this.eyeCharge ? [255, 255, 220] : [255, 150, 50], er = this.eyeCharge ? 22 + this.eyeCharge * 14 : 15;
    for (const s2 of [-1, 1]) { g.fillStyle = '#1a0806'; g.beginPath(); g.ellipse(s2 * 52, -40, 30, 20, s2 * .25, 0, TAU); g.fill(); g.fillStyle = rgba(ec); g.beginPath(); g.ellipse(s2 * 52, -40, er, this.st === 'slump' ? 5 : 11, s2 * .2, 0, TAU); g.fill(); }
    g.fillStyle = '#1a0806'; g.beginPath(); g.moveTo(-70, 26); g.quadraticCurveTo(0, 60, 70, 26); g.lineTo(60, 52); g.quadraticCurveTo(0, 80, -60, 52); g.closePath(); g.fill();
    g.fillStyle = `rgba(255,${150 + Math.sin(t * 6) * 40 | 0},40,.95)`; g.beginPath(); g.moveTo(-58, 34); g.quadraticCurveTo(0, 64, 58, 34); g.quadraticCurveTo(0, 50, -58, 34); g.fill();
    const kg = g.createLinearGradient(0, -130, 0, -80); kg.addColorStop(0, '#fffbd0'); kg.addColorStop(1, '#ff7a20'); g.fillStyle = kg;
    g.beginPath(); g.moveTo(0, -136); g.lineTo(26, -102); g.lineTo(0, -70); g.lineTo(-26, -102); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.stroke();
    g.restore();
    // sombras de los puños sobre el suelo
    for (const h of this.hands) if (h.st === 'rise' || h.st === 'fall') { const k = h.st === 'fall' ? 1 : Math.min(1, h.t / 1.1); g.fillStyle = `rgba(20,0,0,${.2 + k * .4})`; g.beginPath(); g.ellipse(h.tx ?? h.x, f, 175, 26, 0, 0, TAU); g.fill(); g.strokeStyle = `rgba(255,70,40,${.4 + k * .6})`; g.lineWidth = 4; g.setLineDash([16, 10]); g.beginPath(); g.ellipse(h.tx ?? h.x, f, 175, 26, 0, 0, TAU); g.stroke(); g.setLineDash([]); }
    for (const m of this.meteors) if (m.t > m.delay - .6) { g.strokeStyle = 'rgba(255,90,40,.8)'; g.lineWidth = 3; g.beginPath(); g.ellipse(m.x, f, 40, 8, 0, 0, TAU); g.stroke(); }
    for (const gy of this.geysers) if (gy.t > 0 && gy.t < 1) { g.fillStyle = `rgba(255,120,40,${gy.t * .6})`; g.beginPath(); g.ellipse(gy.x, f, 46, 9, 0, 0, TAU); g.fill(); }
  }
  draw(g) {
    const f = this.arena.floor;
    for (const m of this.meteors) if (m.t > m.delay) { g.fillStyle = '#3a2420'; g.beginPath(); g.arc(m.x, m.y, 22, 0, TAU); g.fill(); g.fillStyle = '#ff9a3a'; g.beginPath(); g.arc(m.x - 4, m.y + 6, 12, 0, TAU); g.fill(); }
    for (const gy of this.geysers) if (gy.t > 1 && gy.t < 1.8) { const hh = Math.sin((gy.t - 1) / .8 * Math.PI) * 260; drawLavaFall(g, gy.x, f - hh, f, 46, this.t); }
    if (this.beam) { const b = this.beam, [hx, hy] = this.headPos(); g.save(); g.globalCompositeOperation = 'lighter'; for (const s of [-1, 1]) { g.strokeStyle = 'rgba(255,200,120,.9)'; g.lineWidth = 18; g.beginPath(); g.moveTo(hx + s * 48, hy - 40); g.lineTo(b.x + s * 10, f - 20); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); } g.restore(); }
  }
  drawFront(g) {
    const t = this.t, ff = this.flash > 0, S = this.spr;
    for (const h of this.hands) {
      g.save(); g.translate(h.x, h.y); g.scale(h.side, 1);
      const fist = h.st === 'rise' || h.st === 'fall' || h.st === 'stuck' || h.st === 'sweep' || h.st === 'sweepUp';
      const img = fist ? S.fist : S.hand;
      if (h.st === 'fall') g.scale(1, 1.08);
      g.drawImage(img, -img.width / 2, -img.height / 2 - (fist ? 10 : 0));
      if (ff) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45; g.drawImage(img, -img.width / 2, -img.height / 2 - (fist ? 10 : 0)); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      if (fist) for (let i = 0; i < 4; i++) { const x = -150 + i * 78 + 33, y = -img.height / 2 - 10 + 18; g.fillStyle = h.st === 'stuck' ? '#fff6b0' : '#ff8a30'; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 11, y + 2); g.lineTo(x, y + 16); g.lineTo(x - 11, y + 2); g.closePath(); g.fill(); }
      if (h.crack > .5) { g.strokeStyle = 'rgba(255,200,120,.95)'; g.lineWidth = 3; for (let k = 0; k < Math.min(4, h.crack | 0); k++) { g.beginPath(); g.moveTo(-110 + k * 60, -40); g.lineTo(-90 + k * 60, 0); g.lineTo(-118 + k * 60, 40); g.stroke(); } }
      g.restore();
    }
  }
  drawGlow(g) {
    const [hx, hy] = this.headPos(), f = this.arena.floor;
    glowAt(g, [255, 140, 40], hx, hy - 40, this.eyeCharge ? 120 + this.eyeCharge * 140 : 70, this.eyeCharge ? .9 : .5);
    glowAt(g, [255, 220, 120], hx, hy - 92, this.slump > .6 ? 90 + Math.sin(this.t * 8) * 20 : 40, this.slump > .6 ? .9 : .4);
    for (const h of this.hands) if (h.st === 'stuck') glowAt(g, [255, 230, 140], h.x, h.y - 100, 120, .45 + Math.sin(this.t * 10) * .1);
    for (const m of this.meteors) if (m.t > m.delay) glowAt(g, [255, 130, 40], m.x, m.y, 60, .8);
    if (this.beam) glowAt(g, [255, 220, 150], this.beam.x, f - 20, 120, 1);
  }
}

const BOSS_TYPES = { crabking: CrabKing, chrono: ChronoGuardian, titan: MagmaTitan };
