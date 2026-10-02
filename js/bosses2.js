"use strict";
/* =====================================================================
   JEFES DE LOS MUNDOS 4, 5 Y 6
   - Tempestra, la Wyvern de la Tormenta: vuela al fondo y se lanza en
     picado; rayos, plumas de acero, ráfagas. INGLÉS: 4 pararrayos con
     palabras; golpea el correcto y el rayo la derriba.
   - Gearheart, el Coloso de Engranajes: gigante de perfil, prensa con su
     garra, sierras (devuélvelas a golpes), imán, láser, cinta
     transportadora. INGLÉS: cajas con palabras; mételas en su horno EN
     ORDEN para abrir su núcleo.
   - Sir Vermilion, el Caballero Carmesí: duelista rápido con guardia que
     contraataca. INGLÉS: choque de espadas con pregunta; fantasmas de tus
     propios errores; forma de armadura gigante.
   ===================================================================== */

/* palabra elegida golpeando objetos (pararrayos / cajas) */
function wordChoice(boss, q, choice, okFx) {
  const G = boss.game, wrongFirst = boss.wrongWord;
  const rec = Learn.record(q, wrongFirst ? { verdict: 'wrong', given: wrongFirst } : { verdict: 'correct', given: choice });
  if (!wrongFirst) G.answerFX(true, 'correct', rec); else { Sound.play('correct'); UI.pinNote(Learn.feedback(q, { verdict: 'wrong', given: wrongFirst })); }
  UI.brawlBanner(null); okFx(!wrongFirst);
}
const optLabel = o => o === '—' ? '∅ (nothing)' : o;

/* ======================= TEMPESTRA ======================= */
class StormWyvern extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Tempestra', nameEn: 'Tempestra, the Storm Wyvern', title: 'Wyvern de la Tormenta', hp: 1600, x: (arena.x0 + arena.x1) / 2, y: arena.floor - 420 });
    const f = arena.floor; this.hx = this.x + 600; this.hy = f - 700; this.hvx = 0; this.hvy = 0;
    this.seg = []; for (let i = 0; i < 18; i++) this.seg.push({ x: this.hx + i * 24, y: this.hy, r: lerp(26, 5, Math.pow(i / 17, .8)) * (i < 2 ? .8 : 1) });
    this.strikes = []; this.rods = []; this.count = 0; this.wing = 0; this.rain = 0;
  }
  get head() { return this.seg[0]; }
  steer(tx, ty, k, dt) { this.hvx += ((tx - this.hx) * k - this.hvx * Math.sqrt(k) * 1.6) * dt; this.hvy += ((ty - this.hy) * k - this.hvy * Math.sqrt(k) * 1.6) * dt; this.hx += this.hvx * dt; this.hy += this.hvy * dt; }
  follow(dt, grav) {
    const s = this.seg; s[0].x = this.hx; s[0].y = this.hy;
    for (let i = 1; i < s.length; i++) { const a = s[i - 1], b = s[i]; if (grav) { b.y += 260 * dt; b.y = Math.min(b.y, this.arena.floor - b.r); } else b.y += 30 * dt * (i / s.length); const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; b.x = a.x + dx / d * 24; b.y = a.y + dy / d * 24; if (grav) b.y = Math.min(b.y, this.arena.floor - b.r); }
  }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt; this.wing += dt * (this.st === 'downed' ? 2 : 7);
    const A = this.arena, f = A.floor, H = this.hero, cx = (A.x0 + A.x1) / 2, G = this.game, spd = 1 + (this.phase - 1) * .2;
    this.rain = approach(this.rain, this.st === 'rods' ? 1 : .5, dt);
    if (chance(dt * 40 * this.rain)) FX.spawnRaw({ t: 'drop', x: G.cam.x + R(0, G.VW + 200), y: G.cam.y - 10, vx: -120 + (G.heroPush || 0) * .3, vy: 900, g: 300, max: 1, s: 1.4, col: [190, 210, 255] });
    for (const s of this.strikes) { s.t += dt; if (s.t >= 0 && !s.hit) { s.hit = true; Sound.play('zap'); G.shake(6, .2); FX.sparks(s.x, f, [200, 230, 255], 14, 0, 400); FX.decal(s.x, f, 'scorch', 34); G.flashScreen([220, 235, 255], .2); } if (s.t > 0 && s.t < .25) G.dealAreaToHero(s.x, f - 200, 34, 20, true); }
    this.strikes = this.strikes.filter(s => s.t < .5);
    for (const r of this.rods) { r.rise = approach(r.rise, r.broken ? 0 : 1, dt * 2); }
    if (this.st === 'intro') { this.steer(cx + Math.sin(this.t) * 300, f - 360, 6, dt); this.follow(dt); if (this.stT > 3) this.set('circle'); return; }
    if (this.st === 'sealing') { this.steer(cx, f - 120, 8, dt); this.follow(dt); return; }
    if (this.st === 'dying') { this.hy += 200 * dt; this.follow(dt, true); if (chance(.5)) FX.smoke(this.hx, this.hy, 1, [80, 90, 120], 10); return; }
    if (this.st === 'recover') { this.steer(cx, f - 380, 6, dt); this.follow(dt); if (this.stT > 2) this.set('circle'); return; }
    if (this.st === 'circle') {
      this.steer(cx + Math.sin(this.t * .7) * 480, f - 380 + Math.sin(this.t * 1.4) * 90, 7, dt); this.follow(dt);
      if (this.stT > 1.6 / spd) {
        this.count++;
        if (this.count % 4 === 0 || this.forceRods) { this.forceRods = false; this.startRods(); return; }
        const opts = ['bolts', 'swoop', 'feathers']; if (this.phase >= 2) opts.push('gust', 'swoop'); if (this.phase >= 3) opts.push('bolts', 'gust');
        const a = this.pickAttack(opts); this.set(a + 'Up'); Sound.play('roar', a === 'gust' ? .8 : 1.1);
        if (a === 'swoop') { this.dir = H.x > cx ? -1 : 1; Sound.play('telegraph', 44); }
      }
    } else if (this.st === 'boltsUp') { this.steer(cx, f - 460, 6, dt); this.follow(dt); if (this.stT > .5) { this.set('bolts'); const n = 3 + this.phase; for (let i = 0; i < n; i++) this.strikes.push({ x: i === 0 ? H.x : R(A.x0 + 60, A.x1 - 60), t: -.95 - i * .18 }); } }
    else if (this.st === 'bolts') { this.steer(cx + Math.sin(this.t) * 200, f - 460, 6, dt); this.follow(dt); if (this.stT > 2.2) this.set('circle'); }
    else if (this.st === 'swoopUp') { this.steer(cx - this.dir * 760, f - 420, 9, dt); this.follow(dt); if (this.stT > 1.1) { this.set('swoop'); Sound.play('whoosh'); } }
    else if (this.st === 'swoop') {
      const u = Math.min(1, this.stT / (1.25 / spd)); this.hx = lerp(cx - this.dir * 760, cx + this.dir * 760, u); this.hy = f - 46 - (1 - Math.sin(u * Math.PI)) * 380; this.hvx = this.hvy = 0; this.follow(dt);
      if (chance(.7)) FX.footstep(this.hx, f, this.dir, 700);
      if (u >= 1) this.set(this.phase >= 2 && chance(.5) ? 'feathersUp' : 'circle');
    } else if (this.st === 'feathersUp') { this.side = H.x > cx ? -1 : 1; this.steer(cx + this.side * 430, f - 230, 9, dt); this.follow(dt); if (this.stT > 1) { this.set('feathers'); this.volley = 0; } }
    else if (this.st === 'feathers') {
      this.steer(cx + this.side * 430, f - 230, 9, dt); this.follow(dt);
      if (this.stT > this.volley * .55 && this.volley < (this.phase > 1 ? 3 : 2)) {
        this.volley++; Sound.play('whoosh'); const base = Math.atan2(H.y - 30 - this.hy, H.x - this.hx);
        for (let k = -3; k <= 3; k++) { const a = base + k * .14; G.spawnProjectile({ owner: 'enemy', kind: 'feather', x: this.hx, y: this.hy, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 8, dmg: 12, life: 3 }); }
      }
      if (this.stT > 2.4) this.set('circle');
    } else if (this.st === 'gustUp') { this.steer(cx, f - 520, 6, dt); this.follow(dt); if (this.stT > .8) { this.set('gust'); this.gdir = H.x > cx ? 1 : -1; G.toast('A strong wind! Run against it!', '¡Viento fuerte! ¡Corre contra él!'); } }
    else if (this.st === 'gust') {
      this.steer(cx, f - 520, 6, dt); this.follow(dt); G.heroPush = this.gdir * 210; G.heroPushAir = true;
      if (chance(.6)) FX.spawnRaw({ t: 'leaf', x: this.gdir > 0 ? G.cam.x - 10 : G.cam.x + G.VW + 10, y: G.cam.y + R(100, 700), vx: this.gdir * R(500, 800), vy: R(-40, 40), g: 0, max: 2, s: 2.5, col: [230, 240, 255], rot: 0, vr: 8 });
      if (this.stT > 1 && this.strikes.length < 2 && chance(dt * 2)) this.strikes.push({ x: H.x + R(-80, 80), t: -.9 });
      if (this.stT > 3.4) { G.heroPush = 0; G.heroPushAir = false; this.set('circle'); }
    } else if (this.st === 'rods') { this.steer(cx + Math.sin(this.t * .6) * 300, f - 470, 5, dt); this.follow(dt); }
    else if (this.st === 'struck') { this.steer(cx, f - 300, 4, dt); this.follow(dt); if (this.stT > .6) { this.set('fall'); } }
    else if (this.st === 'fall') { this.hvy += 2200 * dt; this.hy = Math.min(f - 24, this.hy + this.hvy * dt); this.follow(dt, true); if (this.hy >= f - 24) { this.set('downed'); FX.slam(this.hx, f, 2); Sound.play('slam', 1.6); G.shake(18, .6); Input.rumble(1, .8, 400); FX.text(this.hx, f - 200, 'CRASH!', '#bfe0ff', 70); } }
    else if (this.st === 'downed') { this.follow(dt, true); if (chance(.3)) FX.sparks(this.hx + R(-40, 40), f - 20, [180, 220, 255], 2, 0, 160); if (this.stT > this.downT) { this.set('circle'); Sound.play('roar', 1); } }
  }
  startRods() {
    const A = this.arena, G = this.game, q = Learn.next({ kind: 'brawl', units: G.units, format: 'choice' }); q.first = true; this.q = q; this.wrongWord = null;
    this.rods = q.options.map((w, i) => ({ x: A.x0 + 170 + i * (A.x1 - A.x0 - 340) / 3, word: w, correct: i === q.correctIndex, rise: 0, broken: false }));
    this.set('rods'); Sound.play('roar', .7); G.banner('THE STORM ASKS!', 'Golpea el pararrayos con la palabra correcta', '#bfe0ff', true);
    setTimeout(() => { if (this.st === 'rods' && G.boss === this) UI.brawlBanner(q, G, 'Golpea el PARARRAYOS con la palabra correcta: el rayo derribará a la wyvern'); }, 900);
  }
  hitRod(r) {
    const G = this.game, f = this.arena.floor;
    if (r.broken || this.st !== 'rods') return;
    if (r.correct) {
      G.lightning(r.x, G.cam.y - 20, r.x, f - 170); setTimeout(() => G.lightning(r.x, f - 170, this.hx, this.hy), 160);
      FX.text(r.x, f - 230, optLabel(r.word).toUpperCase() + '!', '#bfe0ff', 50);
      wordChoice(this, this.q, r.word, clean => { this.downT = clean ? 5 : 3; this.set('struck'); this.flash = .3; G.flashScreen([220, 240, 255], .7); this.hurt(this.maxHp * .05, 1, { x: this.hx, y: this.hy, heavy: true }, { mul: 1 }); });
      for (const o of this.rods) o.broken = true;
    } else {
      r.broken = true; if (!this.wrongWord) this.wrongWord = r.word;
      G.lightning(r.x, G.cam.y - 20, r.x, f - 170); setTimeout(() => G.lightning(r.x, f - 170, this.hero.x, this.hero.y - 30), 150);
      const H = this.hero; H.inv = 0; H.hurt(16, r.x, { unblockable: true, kup: 300 }); Sound.play('wrong'); FX.text(r.x, f - 220, 'WRONG WORD!', '#ff8a8a', 34);
    }
  }
  hurt(dmg, dir, info, box) { if (box && box.rod) { this.hitRod(box.rod); return true; } return super.hurt(dmg, dir, info, box); }
  onPhase() { this.forceRods = true; }
  vulnerable() {
    const out = [], f = this.arena.floor;
    for (const r of this.rods) if (!r.broken && r.rise > .8) out.push({ x: r.x - 26, y: f - 190, w: 52, h: 190, rod: r, mul: 1 });
    if (this.st === 'downed') { out.push({ x: this.hx - 46, y: this.hy - 36, w: 92, h: 66, mul: 2.6 }); for (let i = 3; i < this.seg.length; i += 3) { const s = this.seg[i]; out.push({ x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2, mul: 1 }); } }
    else if (this.hy > f - 300 && this.st !== 'intro') out.push({ x: this.hx - 38, y: this.hy - 30, w: 76, h: 60, mul: 1.1 });
    return out;
  }
  attackBoxes() {
    const out = [];
    if (this.st === 'swoop') for (let i = 0; i < this.seg.length; i += 2) { const s = this.seg[i]; out.push({ x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2, dmg: 22 }); }
    return out;
  }
  drawBack(g) {
    const G = this.game, f = this.arena.floor;
    g.fillStyle = `rgba(20,30,60,${.25 * this.rain})`; g.fillRect(G.cam.x - 50, G.cam.y - 50, G.VW + 100, VH + 100);
    if (chance(.01)) G.flashScreen([200, 220, 255], .15);
    for (const s of this.strikes) if (s.t < 0) { const k = 1 + s.t / 1; g.strokeStyle = `rgba(190,220,255,${.2 + .6 * k * (Math.sin(this.t * 40) * .5 + .5)})`; g.lineWidth = 2; g.setLineDash([8, 10]); g.beginPath(); g.moveTo(s.x, G.cam.y); g.lineTo(s.x, f); g.stroke(); g.setLineDash([]); g.fillStyle = `rgba(160,200,255,${.25 * k})`; g.beginPath(); g.ellipse(s.x, f, 40, 9, 0, 0, TAU); g.fill(); }
    if (this.st === 'swoopUp') { const cx = (this.arena.x0 + this.arena.x1) / 2; g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = 3; g.setLineDash([14, 12]); g.beginPath(); for (let u = 0; u <= 1; u += .05) g.lineTo(lerp(cx - this.dir * 760, cx + this.dir * 760, u), f - 46 - (1 - Math.sin(u * Math.PI)) * 380); g.stroke(); g.setLineDash([]); }
    // pararrayos
    for (const r of this.rods) { if (r.rise < .02) continue; const top = f - 180 * easeOut(r.rise);
      g.fillStyle = '#5a6278'; g.fillRect(r.x - 5, top, 10, f - top); g.fillStyle = '#c98a4a'; for (let y = top + 40; y < f - 10; y += 22) g.fillRect(r.x - 7, y, 14, 6);
      g.fillStyle = '#e8ecf6'; g.beginPath(); g.moveTo(r.x - 7, top); g.lineTo(r.x, top - 26); g.lineTo(r.x + 7, top); g.fill();
      g.font = '800 19px "Alegreya Sans", sans-serif'; const w = Math.max(56, g.measureText(optLabel(r.word)).width + 22);
      g.fillStyle = r.broken ? 'rgba(60,40,40,.85)' : 'rgba(250,246,232,.97)'; g.strokeStyle = '#1a1420'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(r.x - w / 2, top + 30, w, 30, 8); g.fill(); g.stroke();
      g.fillStyle = r.broken ? '#aa7777' : '#1a1020'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(optLabel(r.word), r.x, top + 46); }
  }
  draw(g) {
    const s = this.seg, ff = this.flash > 0, face = Math.sign(s[0].x - s[1].x) || 1;
    // ala trasera
    this.drawWing(g, face, .82, '#262a5c');
    // cuerpo: cinta que se estrecha
    const L = [], Rr = [];
    for (let i = 0; i < s.length; i++) { const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)], an = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(an), ny = Math.cos(an); L.push([s[i].x + nx * s[i].r, s[i].y + ny * s[i].r]); Rr.push([s[i].x - nx * s[i].r, s[i].y - ny * s[i].r]); }
    g.fillStyle = ff ? '#fff' : '#2c3c78'; g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath(); g.fill();
    g.strokeStyle = '#141a34'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
    if (!ff) { // lomo iluminado (cel)
      g.save(); g.clip(); g.strokeStyle = '#4d68bc'; g.lineCap = 'round';
      for (let i = 1; i < s.length - 1; i++) { const p = L[i], q2 = L[i + 1]; g.lineWidth = Math.max(2, s[i].r * .9); g.beginPath(); g.moveTo(lerp(p[0], s[i].x, .3), lerp(p[1], s[i].y, .3)); g.lineTo(lerp(q2[0], s[i + 1].x, .3), lerp(q2[1], s[i + 1].y, .3)); g.stroke(); }
      g.fillStyle = 'rgba(10,16,40,.35)'; for (let i = 2; i < s.length - 2; i++) { const p = Rr[i]; g.beginPath(); g.arc(p[0], p[1], s[i].r * .7, 0, TAU); g.fill(); }
      g.restore();
    }
    // aleta de la cola
    { const t = s[s.length - 1], t2 = s[s.length - 2], ta = Math.atan2(t.y - t2.y, t.x - t2.x);
      g.save(); g.translate(t.x, t.y); g.rotate(ta); g.fillStyle = ff ? '#fff' : '#9be6ff'; g.strokeStyle = '#141a34'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(-6, 0); g.lineTo(14, -16); g.lineTo(34, 0); g.lineTo(14, 16); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(2, 0); g.lineTo(14, -9); g.lineTo(22, 0); g.closePath(); g.fill(); g.restore(); }
    // patas con garras
    if (s.length > 6) for (const [si, ph] of [[4, 0], [6, 1.3]]) { const b = s[si], up = this.st === 'swoop' ? -1 : 1, sw = Math.sin(this.wing * .5 + ph) * 4;
      g.strokeStyle = '#141a34'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + sw, b.y + 22 * up); g.lineTo(b.x + sw + 10 * face, b.y + 34 * up); g.stroke();
      g.strokeStyle = ff ? '#fff' : '#2c3c78'; g.lineWidth = 5; g.stroke();
      g.strokeStyle = '#e8eefc'; g.lineWidth = 2.5; for (let c = -1; c <= 1; c++) { g.beginPath(); g.moveTo(b.x + sw + 10 * face, b.y + 34 * up); g.lineTo(b.x + sw + (16 + c * 2) * face, b.y + (40 + c * 4) * up); g.stroke(); } }
    // vientre claro y púas eléctricas
    g.strokeStyle = ff ? '#fff' : '#a8b8e8'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); for (let i = 1; i < s.length - 2; i++) { const p = Rr[i]; g.lineTo(lerp(p[0], s[i].x, .35), lerp(p[1], s[i].y, .35)); } g.stroke();
    g.fillStyle = '#9be6ff'; for (let i = 2; i < s.length - 2; i += 2) { const p = L[i], q2 = s[i]; const dx = p[0] - q2.x, dy = p[1] - q2.y; g.beginPath(); g.moveTo(p[0] - dy * .2, p[1] + dx * .2); g.lineTo(p[0] + dx * .7, p[1] + dy * .7); g.lineTo(p[0] + dy * .2, p[1] - dx * .2); g.fill(); }
    // cabeza
    const h = s[0], an = Math.atan2(s[0].y - s[1].y, s[0].x - s[1].x);
    g.save(); g.translate(h.x, h.y); g.rotate(an); if (Math.cos(an) < 0) g.scale(1, -1);
    const jaw = this.st === 'feathers' || this.st === 'rods' || this.st.endsWith('Up') ? .5 : .12;
    g.fillStyle = ff ? '#fff' : '#26346a'; g.beginPath(); g.moveTo(-26, 16); g.lineTo(30, 10 + jaw * 26); g.lineTo(54, 6 + jaw * 18); g.lineTo(0, 22); g.closePath(); g.fill();
    g.fillStyle = ff ? '#fff' : '#33478e'; g.beginPath(); g.moveTo(-30, -18); g.quadraticCurveTo(10, -26, 58, -4); g.lineTo(60, 4); g.quadraticCurveTo(20, 14, -28, 18); g.closePath(); g.fill(); g.strokeStyle = '#141a34'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#d8e0f4'; for (const [hx, hl] of [[-18, 46], [-6, 38]]) { g.beginPath(); g.moveTo(hx, -16); g.quadraticCurveTo(hx - 30, -32, hx - hl, -24); g.quadraticCurveTo(hx - 24, -20, hx + 6, -10); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(20, -6, 7, 4.5, -.2, 0, TAU); g.fill(); g.fillStyle = this.st === 'downed' ? '#556' : '#4ad8ff'; g.beginPath(); g.ellipse(22, -6, 3.4, 3.8, 0, 0, TAU); g.fill();
    g.restore();
    this.drawWing(g, face, 1, '#3e4590');
  }
  drawWing(g, face, k, col) {
    const s = this.seg[k < 1 ? 4 : 3], flap = this.st === 'downed' ? .4 : Math.sin(this.wing + (k < 1 ? .5 : 0)) * .8, ff = this.flash > 0;
    g.save(); g.translate(s.x, s.y); g.scale(-face, 1);
    const a1 = -1.9 + flap * .6, ex = Math.cos(a1) * 110 * k, ey = Math.sin(a1) * 110 * k, a2 = a1 + .9, wx = ex + Math.cos(a2) * 100 * k, wy = ey + Math.sin(a2) * 100 * k;
    const tips = []; for (let i = 0; i < 4; i++) { const fa = a2 + .35 + i * .45, fl = (175 - i * 28) * k; tips.push([wx + Math.cos(fa) * fl, wy + Math.sin(fa) * fl]); }
    const root = [46 * k, 14];
    // membrana con borde festoneado
    g.fillStyle = ff ? 'rgba(255,255,255,.85)' : col; g.beginPath(); g.moveTo(0, 0); g.lineTo(ex, ey); g.lineTo(wx, wy); g.lineTo(tips[0][0], tips[0][1]);
    for (let i = 1; i < tips.length; i++) { const a = tips[i - 1], b = tips[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; g.quadraticCurveTo(lerp(mx, wx, .32), lerp(my, wy, .32), b[0], b[1]); }
    g.quadraticCurveTo(lerp(tips[3][0], root[0], .5) - 10, lerp(tips[3][1], root[1], .5) - 18, root[0], root[1]); g.closePath(); g.fill();
    if (!ff) { // paneles claros entre dedos
      g.save(); g.clip(); g.fillStyle = 'rgba(160,190,255,.22)';
      for (let i = 0; i < tips.length - 1; i += 2) { g.beginPath(); g.moveTo(wx, wy); g.lineTo(tips[i][0], tips[i][1]); g.lineTo(tips[i + 1][0], tips[i + 1][1]); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(10,14,40,.28)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(ex, ey); g.lineTo(wx, wy); g.lineTo(root[0], root[1]); g.closePath(); g.fill(); g.restore(); }
    g.strokeStyle = '#141a34'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = '#141a34'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(ex, ey); g.lineTo(wx, wy); g.stroke();
    g.strokeStyle = ff ? '#fff' : '#5a6cc0'; g.lineWidth = 3.5; g.stroke();
    for (const t of tips) { g.strokeStyle = '#141a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(wx, wy); g.lineTo(t[0], t[1]); g.stroke(); }
    g.fillStyle = '#e8eefc'; g.beginPath(); g.moveTo(ex - 4, ey); g.lineTo(ex - 14, ey - 14); g.lineTo(ex + 4, ey - 4); g.fill();
    g.restore();
  }
  drawGlow(g) { const f = this.arena.floor; glowAt(g, [120, 210, 255], this.hx, this.hy, 70, .5); for (const s of this.strikes) if (s.t >= 0 && s.t < .25) { glowAt(g, [200, 230, 255], s.x, f - 100, 160, .9); } for (const s of this.strikes) if (s.t >= 0 && s.t < .25) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); let x = s.x; g.moveTo(x, this.game.cam.y); for (let y = this.game.cam.y; y < f; y += 40) { x = s.x + R(-18, 18); g.lineTo(x, y); } g.lineTo(s.x, f); g.stroke(); } }
}

/* ======================= GEARHEART ======================= */
class ClockworkColossus extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Gearheart', nameEn: 'Gearheart, the Clockwork Colossus', title: 'Coloso de Engranajes', hp: 1800, x: arena.x1 - 150, y: arena.floor });
    this.door = arena.x1 - 290; game.hero.lockX = [arena.x0, this.door - 20];
    this.claw = { x: this.door - 300, y: arena.floor - 420, st: 'rest', t: 0 }; this.saws = []; this.crates = []; this.belt = 0; this.beltT = 0; this.count = 0; this.core = 0; this.gearA = 0; this.laser = null;
  }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt; this.gearA += dt; this.core = Math.max(0, this.core - dt);
    const A = this.arena, f = A.floor, H = this.hero, G = this.game, spd = 1 + (this.phase - 1) * .2;
    // cinta transportadora
    this.beltT -= dt; if (this.beltT <= 0 && this.st !== 'furnace') { this.belt = this.belt ? -this.belt : 90; if (this.phase >= 3) this.belt *= 1.6; this.beltT = 5; }
    G.heroPush = this.st === 'furnace' ? 0 : this.belt; G.heroPushAir = false;
    this.updateClaw(dt, spd);
    for (const s of this.saws) { s.x += s.vx * dt; s.rot += s.vx * dt / s.r; if (chance(.5)) FX.sparks(s.x, f, [255, 220, 140], 1, -Math.sign(s.vx), 200);
      if (s.vx > 0 && s.x > this.door - 10) { s.dead = true; this.hurt(70, 1, { x: this.door, y: f - 60, heavy: true }, { mul: 1 }); FX.text(this.door, f - 140, 'RICOCHET!', '#ffe080', 46); G.shake(10, .3); }
      if (s.x < A.x0 - 80) s.dead = true; }
    this.saws = this.saws.filter(s => !s.dead);
    if (this.laser) { const L = this.laser; L.x += L.v * dt; G.shake(3, .1); if (chance(.9)) FX.embers(L.x, f - 6, 2, 160); G.dealAreaToHero(L.x, f - 40, 30, 20, true, 'beam'); if (L.x < A.x0 - 40) this.laser = null; }
    this.updateCrates(dt);
    if (this.st === 'intro') { if (this.stT > 3) this.set('idle'); return; }
    if (this.st === 'sealing' || this.st === 'dying') { G.heroPush = 0; return; }
    if (this.st === 'recover') { if (this.stT > 2) this.set('idle'); return; }
    if (this.st === 'idle') {
      if (this.stT > 1.5 / spd && this.claw.st === 'rest') {
        this.count++;
        if (this.count % 4 === 0 || this.forceFurnace) { this.forceFurnace = false; this.startFurnace(); return; }
        const opts = ['press', 'saws', 'press', 'laser']; if (this.phase >= 2) opts.push('magnet', 'saws'); if (this.phase >= 3) opts.push('press', 'laser');
        const a = this.pickAttack(opts); this.set(a); Sound.play('telegraph', 40);
        if (a === 'press') { this.claw.st = 'rise'; this.claw.t = 0; }
        if (a === 'saws') { const n = 2 + (this.phase > 1 ? 1 : 0); for (let i = 0; i < n; i++) this.saws.push({ x: this.door - 20 + i * 60, vx: -(260 + i * 40) * spd, r: 30, rot: 0, delay: i }); Sound.play('crumble'); G.toast('Hit the saws back at him!', '¡Golpea las sierras para devolvérselas!'); }
        if (a === 'laser') { this.laserCharge = .001; Sound.play('charge'); }
        if (a === 'magnet') { G.toast('MAGNET! Run away from him!', '¡IMÁN! ¡Corre en dirección contraria!'); this.boltT = 0; }
      }
    } else if (this.st === 'press') { if (this.claw.st === 'rest' && this.stT > 1) this.set('idle'); }
    else if (this.st === 'saws') { if (this.stT > 3) this.set('idle'); }
    else if (this.st === 'laser') { if (this.laserCharge) { this.laserCharge += dt; if (this.laserCharge > 1.2) { this.laserCharge = 0; this.laser = { x: this.door - 20, v: -620 * spd }; Sound.play('ultFire'); } } if (this.stT > 3.4) this.set('idle'); }
    else if (this.st === 'magnet') { G.heroPush = 260; G.heroPushAir = true; this.boltT -= dt; if (this.boltT <= 0) { this.boltT = .45; G.spawnProjectile({ owner: 'enemy', kind: 'bolt', x: A.x0 - 20, y: f - R(20, 120), vx: R(380, 520), vy: 0, r: 9, dmg: 10, life: 4, poppable: true }); } if (this.stT > 4) { G.heroPushAir = false; this.set('idle'); } }
  }
  updateClaw(dt, spd) {
    const c = this.claw, f = this.arena.floor, H = this.hero; c.t += dt;
    const rx = this.door - 260, ry = f - 380;
    if (c.st === 'rest') { c.x = lerp(c.x, rx, dt * 3); c.y = lerp(c.y, ry + Math.sin(this.t * 1.5) * 10, dt * 3); }
    else if (c.st === 'rise') { c.tx = clamp(lerp(c.tx ?? H.x, H.x, dt * (c.t < .8 ? 4 : 0)), this.arena.x0 + 80, this.door - 80); c.x = lerp(c.x, c.tx, dt * 5); c.y = lerp(c.y, f - 430, dt * 4); if (c.t > 1.2 / spd) { c.st = 'fall'; c.t = 0; } }
    else if (c.st === 'fall') { c.y += 2400 * dt; if (c.y >= f - 50) { c.y = f - 50; c.st = 'stuck'; c.t = 0; FX.slam(c.x, f, 1.8); Sound.play('slam', 1.4); this.game.shake(14, .4); Input.rumble(.9, .7, 300); FX.text(c.x, f - 200, 'CLANG!', '#ffd27a', 64); this.game.dealAreaToHero(c.x, f - 60, 90, 28, true); this.game.spawnShockwave(c.x + 90, f, 1, 300, 12); this.game.spawnShockwave(c.x - 90, f, -1, 300, 12); } }
    else if (c.st === 'stuck') { if (chance(.3)) FX.smoke(c.x + R(-40, 40), f - 30, 1, [220, 220, 230], 10); if (c.t > 1.5) { c.st = 'rest'; c.t = 0; c.tx = undefined; } }
  }
  startFurnace() {
    const A = this.arena, G = this.game; this.wrongWord = null; this.errors = 0; this.belt = 0;
    let q = Learn.next({ kind: 'build', units: G.units, format: 'build' });
    if (q.format !== 'build' || q.answerWords.length > 6) q = Learn.next({ kind: 'brawl', units: G.units, format: 'choice' });
    q.first = true; this.q = q; this.need = 0;
    const words = q.format === 'build' ? q.tiles : q.options.map(optLabel);
    this.crates = shuffle(words.map((w, i) => ({ word: w, ok: q.format === 'build' ? null : i === q.correctIndex, x: 0, y: A.floor - 500 - i * 60, vx: 0, vy: 0, burnt: false })));
    const span = this.door - 120 - (A.x0 + 80); this.crates.forEach((c, i) => c.x = A.x0 + 80 + span * (i + .5) / this.crates.length);
    this.filled = [];
    this.set('furnace'); Sound.play('gate');
    G.banner('FEED THE FURNACE!', q.format === 'build' ? 'Mete las cajas en el horno EN ORDEN para formar la frase' : 'Mete en el horno la caja con la palabra correcta', '#ffd27a', true);
    setTimeout(() => { if (this.st !== 'furnace' || G.boss !== this) return; if (q.format === 'build') UI.brawlBanner({ item: [q.item[2] + '  →  ' + (q.build.before ? q.build.before + ' ' : '') + '______' + (q.build.end || ''), 0, q.item[2], 0, 0, 0, 's'] }, G, 'Golpea las cajas hacia el HORNO (derecha) en el orden de la frase en inglés'); else UI.brawlBanner(q, G, 'Golpea la caja correcta hacia el HORNO (derecha)'); }, 900);
  }
  updateCrates(dt) {
    const f = this.arena.floor, G = this.game;
    for (const c of this.crates) {
      if (c.gone) continue; c.vy += 1600 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.y > f - 26) { c.y = f - 26; c.vy = c.vy > 200 ? -c.vy * .3 : 0; c.vx *= .86; }
      c.x = Math.max(this.arena.x0 + 30, c.x);
      if (c.x > this.door - 10 && !c.gone) {
        if (c.burnt) { c.vx = -400; c.vy = -300; continue; }
        const q = this.q;
        let right = q.format === 'build' ? c.word === q.tiles.find(w => w === q.answerWords[this.need]) && c.word === q.answerWords[this.need] : c.ok;
        if (right) { c.gone = true; this.filled.push(c.word); this.need++; Sound.play('select'); FX.embers(this.door, f - 60, 14, 200); FX.text(this.door - 40, f - 120, c.word, '#ffe080', 36);
          const done = q.format === 'build' ? this.need >= q.answerWords.length : true;
          if (done) { wordChoice(this, q, this.filled.join(' '), clean => { this.core = clean ? 6 : 3.5; this.set('idle'); this.stT = -this.core + 1; Sound.play('ultFire'); G.shake(16, .8); FX.slam(this.door, f, 2); FX.text(this.door - 60, f - 260, 'OVERHEAT!', '#ff9a40', 70); G.toast('The core is open! Hit it!', '¡El núcleo está abierto! ¡Golpéalo!'); }); for (const o of this.crates) o.gone = true; }
        } else { c.burnt = true; c.vx = -480; c.vy = -380; this.errors++; if (!this.wrongWord) this.wrongWord = q.format === 'build' ? this.filled.concat(c.word).join(' ') : c.word; Sound.play('wrong'); FX.text(this.door - 40, f - 120, q.format === 'build' ? 'WRONG ORDER!' : 'WRONG WORD!', '#ff8a8a', 32); FX.embers(this.door, f - 40, 10, 200); }
      }
    }
    if (this.st === 'furnace' && this.crates.every(c => c.gone)) this.crates = [];
  }
  hurt(dmg, dir, info, box) {
    if (box && box.crate) { const c = box.crate, H = this.hero; c.vx = H.face * (H.weapon === 'hammer' ? 820 : 640); c.vy = -360; Sound.play('hit'); FX.hit(c.x, c.y, H.face); return true; }
    if (box && box.gear) return false;
    return super.hurt(dmg, dir, info, box);
  }
  onPhase() { this.forceFurnace = true; }
  vulnerable() {
    const out = [], f = this.arena.floor;
    for (const c of this.crates) if (!c.gone) out.push({ x: c.x - 28, y: c.y - 30, w: 56, h: 58, crate: c, mul: 1 });
    for (const s of this.saws) if (s.vx < 0) out.push({ x: s.x - s.r, y: f - s.r * 2, w: s.r * 2, h: s.r * 2, gear: s, mul: 0 });
    if (this.core > 0) out.push({ x: this.door - 30, y: f - 150, w: 120, h: 150, mul: 2.6 });
    if (this.claw.st === 'stuck') out.push({ x: this.claw.x - 60, y: this.claw.y - 50, w: 120, h: 70, mul: 1 });
    out.push({ x: this.door - 20, y: f - 120, w: 60, h: 120, mul: .35 });
    return out;
  }
  attackBoxes() {
    const out = [], f = this.arena.floor, c = this.claw;
    if (c.st === 'fall') out.push({ x: c.x - 70, y: c.y - 60, w: 140, h: 90, dmg: 28, unblockable: true });
    for (const s of this.saws) if (s.vx < 0) out.push({ x: s.x - s.r * .8, y: f - s.r * 2, w: s.r * 1.6, h: s.r * 2, dmg: 16 });
    return out;
  }
  drawBack(g) {
    const A = this.arena, f = A.floor, G = this.game, x = this.x, t = this.t, ff = this.flash > 0;
    // cinta transportadora
    g.fillStyle = '#2a2c38'; g.fillRect(A.x0 - 40, f, this.door - A.x0 + 60, 20); g.fillStyle = '#555a6e'; g.fillRect(A.x0 - 40, f, this.door - A.x0 + 60, 5);
    if (this.belt) { g.fillStyle = 'rgba(255,200,90,.85)'; const d = Math.sign(this.belt), off = (t * this.belt) % 60; for (let bx = A.x0 + off; bx < this.door; bx += 60) { g.beginPath(); g.moveTo(bx, f + 9); g.lineTo(bx + d * 12, f + 13); g.lineTo(bx, f + 17); g.fill(); } }
    // cuerpo: coloso arrodillado, todo dentro de pantalla
    const O = '#24160a', B = ff ? '#fff' : '#b08a4a', BS = ff ? '#fff' : '#7a5a2e', BL = '#ecc97e', IR = ff ? '#fff' : '#5a6070', IRS = '#383c48';
    const bob = Math.sin(t * 1.4) * 4, ty = f - 470 + bob;
    const shp = (fn, fill, lw = 4) => { g.beginPath(); fn(); g.fillStyle = fill; g.fill(); g.strokeStyle = O; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); };
    // piernas (pistones)
    for (const [lx, k] of [[x + 110, 1], [x - 10, .9]]) {
      shp(() => g.roundRect(lx - 34, f - 230, 68, 150, 14), IR); g.fillStyle = IRS; g.fillRect(lx + 10, f - 226, 20, 142);
      g.fillStyle = '#c8ccd8'; g.fillRect(lx - 12, f - 90, 24, 40); shp(() => g.roundRect(lx - 52, f - 56, 104, 56, [18, 18, 4, 4]), BS);
      g.fillStyle = BL; g.fillRect(lx - 44, f - 50, 40, 6); }
    // chimeneas con humo
    for (const cx of [x + 60, x + 120]) { shp(() => g.rect(cx - 14, ty - 70, 28, 80), IR); shp(() => g.rect(cx - 19, ty - 80, 38, 14), BS); if (chance(.12)) FX.smoke(cx, ty - 84, 1, [200, 200, 210], 14); }
    // torso
    const tw = 340, tx0 = x - tw / 2;
    shp(() => { g.moveTo(tx0 + 30, ty); g.lineTo(tx0 + tw - 30, ty); g.quadraticCurveTo(tx0 + tw, ty, tx0 + tw, ty + 40); g.lineTo(tx0 + tw - 20, f - 140); g.lineTo(tx0 + 20, f - 140); g.lineTo(tx0, ty + 40); g.quadraticCurveTo(tx0, ty, tx0 + 30, ty); g.closePath(); }, B, 5);
    if (!ff) { g.save(); g.clip(); g.fillStyle = BS; g.beginPath(); g.moveTo(x + 60, ty); g.lineTo(tx0 + tw + 10, ty); g.lineTo(tx0 + tw + 10, f - 130); g.lineTo(x + 20, f - 130); g.closePath(); g.fill();
      g.fillStyle = BL; g.fillRect(tx0, ty + 10, 16, 300); g.fillRect(tx0 + 30, ty + 2, tw - 120, 8); g.restore(); }
    // remaches y placas
    g.fillStyle = '#f4e2b0'; for (let ry = ty + 26; ry < f - 150; ry += 36) for (const rx of [tx0 + 26, tx0 + tw - 26]) { g.beginPath(); g.arc(rx, ry, 4, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(36,22,10,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx0 + 10, ty + 150); g.lineTo(tx0 + tw - 10, ty + 150); g.stroke();
    // ventana con engranajes vivos
    g.save(); g.beginPath(); g.arc(x + 70, ty + 100, 62, 0, TAU); g.fillStyle = '#1a1410'; g.fill(); g.clip();
    paintGearIll(g, x + 50, ty + 90, 46, this.gearA * .8, PAL.brass); paintGearIll(g, x + 112, ty + 130, 30, -this.gearA * 1.25, PAL.iron);
    g.fillStyle = 'rgba(180,220,255,.12)'; g.fillRect(x, ty + 30, 140, 40); g.restore();
    g.strokeStyle = O; g.lineWidth = 5; g.beginPath(); g.arc(x + 70, ty + 100, 62, 0, TAU); g.stroke(); g.strokeStyle = BL; g.lineWidth = 3; g.beginPath(); g.arc(x + 70, ty + 100, 56, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    // cara: visera, ojo-láser y rejilla
    this.eyeX = x - 90; this.eyeY = ty + 62;
    shp(() => g.roundRect(tx0 + 24, ty + 26, 150, 76, 16), IR);
    const eyeC = this.laserCharge ? [255, 255, 210] : this.st === 'furnace' ? [255, 200, 90] : [255, 90, 60];
    glowAt(g, eyeC, this.eyeX, this.eyeY, 46, .55);
    g.fillStyle = '#120c08'; g.beginPath(); g.arc(this.eyeX, this.eyeY, 24, 0, TAU); g.fill();
    g.fillStyle = rgba(eyeC); g.beginPath(); g.arc(this.eyeX, this.eyeY, 12 + (this.laserCharge || 0) * 9, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(this.eyeX - 4, this.eyeY - 4, 4, 0, TAU); g.fill();
    g.fillStyle = '#120c08'; g.beginPath(); g.arc(x - 34, ty + 62, 11, 0, TAU); g.fill(); g.fillStyle = rgba(eyeC, .8); g.beginPath(); g.arc(x - 34, ty + 62, 5, 0, TAU); g.fill();
    // ceja metálica (expresión)
    const angry = this.st !== 'idle' && this.st !== 'intro' ? 1 : 0;
    g.fillStyle = BS; g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.moveTo(tx0 + 30, ty + 30 - angry * 2); g.lineTo(x - 64, ty + 40 + angry * 8); g.lineTo(x - 64, ty + 30); g.lineTo(tx0 + 34, ty + 20); g.closePath(); g.fill(); g.stroke();
    shp(() => g.roundRect(tx0 + 50, ty + 112, 110, 30, 8), '#2a2420', 3); g.fillStyle = '#ff9a40'; for (let k = 0; k < 6; k++) g.fillRect(tx0 + 60 + k * 16, ty + 118, 8, 18 * (.5 + .5 * Math.abs(Math.sin(t * 4 + k))));
    // horno / puerta al nivel del suelo
    const open = this.st === 'furnace' || this.core > 0;
    g.fillStyle = '#3a3030'; g.beginPath(); g.roundRect(this.door - 30, f - 160, 140, 160, [60, 60, 0, 0]); g.fill(); g.strokeStyle = '#24160a'; g.lineWidth = 5; g.stroke();
    const fg2 = g.createRadialGradient(this.door + 40, f - 50, 10, this.door + 40, f - 50, 110); fg2.addColorStop(0, open ? '#fff2b0' : '#ff9a40'); fg2.addColorStop(.6, open ? '#ff7a20' : '#a83a10'); fg2.addColorStop(1, '#4a1008'); g.fillStyle = fg2; g.beginPath(); g.roundRect(this.door - 14, f - 140, 108, 140, [50, 50, 0, 0]); g.fill();
    if (!open) { g.fillStyle = '#2a2424'; for (let k = 0; k < 5; k++) g.fillRect(this.door - 10 + k * 22, f - 136, 8, 136); }
    if (this.core > 0) { glowAt(g, [255, 200, 120], this.door + 40, f - 60, 160 + Math.sin(t * 10) * 20, .7); }
    // brazo y garra
    const c = this.claw, sx = x - 160, sy = ty + 50, ex = (sx + c.x) / 2 + 30, ey = Math.max(f - 540, Math.min(sy, c.y) - 70);
    g.strokeStyle = O; g.lineCap = 'round'; g.lineWidth = 44; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(c.x, c.y - 50); g.stroke();
    g.strokeStyle = ff ? '#fff' : '#8a6a3a'; g.lineCap = 'round'; g.lineWidth = 34; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(c.x, c.y - 50); g.stroke();
    g.strokeStyle = BL; g.lineWidth = 6; g.beginPath(); g.moveTo(sx, sy - 12); g.lineTo(ex, ey - 12); g.lineTo(c.x - 10, c.y - 58); g.stroke();
    paintGearIll(g, ex, ey, 26, this.gearA * 2, PAL.iron);
    // garra-prensa: placa con franjas de peligro y pinzas
    shp(() => g.roundRect(c.x - 74, c.y - 64, 148, 50, 10), ff ? '#fff' : '#e0a830', 4);
    if (!ff) { g.save(); g.beginPath(); g.roundRect(c.x - 66, c.y - 40, 132, 18, 4); g.clip(); g.fillStyle = '#1e1a16'; g.fillRect(c.x - 66, c.y - 40, 132, 18); g.fillStyle = '#ffd040';
      for (let k = -6; k < 8; k++) { g.beginPath(); g.moveTo(c.x - 66 + k * 22, c.y - 22); g.lineTo(c.x - 66 + k * 22 + 11, c.y - 22); g.lineTo(c.x - 66 + k * 22 + 29, c.y - 40); g.lineTo(c.x - 66 + k * 22 + 18, c.y - 40); g.closePath(); g.fill(); } g.restore();
      g.fillStyle = '#fff2c0'; g.fillRect(c.x - 66, c.y - 60, 100, 5); }
    for (const sd of [-1, 1]) shp(() => { g.moveTo(c.x + sd * 56, c.y - 18); g.lineTo(c.x + sd * 74, c.y + 24); g.lineTo(c.x + sd * 50, c.y + 14); g.lineTo(c.x + sd * 40, c.y - 18); g.closePath(); }, IR, 3);
    shp(() => g.arc(c.x, c.y - 70, 14, 0, TAU), IR, 3);
    if (c.st === 'rise') { g.fillStyle = 'rgba(30,10,10,.35)'; g.beginPath(); g.ellipse(c.tx ?? c.x, f, 80, 14, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,200,60,.9)'; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.ellipse(c.tx ?? c.x, f, 80, 14, 0, 0, TAU); g.stroke(); g.setLineDash([]); }
    if (this.laserCharge) { g.strokeStyle = `rgba(255,80,60,${.4 + Math.sin(t * 40) * .3})`; g.lineWidth = 2; g.beginPath(); g.moveTo(this.eyeX, this.eyeY); g.lineTo(this.door - 20, f); g.stroke(); }
  }
  draw(g) {
    const f = this.arena.floor;
    for (const s of this.saws) paintGearIll(g, s.x, f - s.r, s.r, s.rot, s.vx > 0 ? { dark: [60, 80, 120], mid: [140, 190, 240], light: [210, 235, 255], hi: [255, 255, 255] } : PAL.iron, null, 0, 14);
    for (const c of this.crates) if (!c.gone) {
      g.save(); g.translate(c.x, c.y); g.fillStyle = c.burnt ? '#4a3020' : '#b8864a'; g.strokeStyle = '#3a2410'; g.lineWidth = 3; g.beginPath(); g.roundRect(-28, -28, 56, 56, 5); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(58,36,16,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-28, -28); g.lineTo(28, 28); g.stroke();
      g.font = '800 17px "Alegreya Sans", sans-serif'; const w = Math.max(48, g.measureText(c.word).width + 16); g.fillStyle = c.burnt ? 'rgba(80,40,40,.9)' : 'rgba(255,250,236,.97)'; g.beginPath(); g.roundRect(-w / 2, -50, w, 26, 6); g.fill(); g.strokeStyle = '#1a1020'; g.lineWidth = 2; g.stroke();
      g.fillStyle = c.burnt ? '#c88' : '#1a1020'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.word, 0, -37); g.restore();
    }
  }
  drawGlow(g) { const f = this.arena.floor; glowAt(g, [255, 150, 60], this.door + 40, f - 70, 120, .6); if (this.laser) { const lx = this.laser.x, ex = this.eyeX, ey = this.eyeY, fl = Math.sin(this.t * 60) * 2;
      glowAt(g, [255, 120, 80], lx, f - 20, 150, 1); glowAt(g, [255, 140, 90], ex, ey, 70, 1);
      g.lineCap = 'round'; for (const [w, c] of [[30 + fl, 'rgba(255,60,40,.25)'], [18 + fl, 'rgba(255,90,50,.6)'], [9, '#ffd0a0'], [4, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(ex, ey); g.lineTo(lx, f - 8); g.stroke(); }
      g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.ellipse(lx, f - 4, 30 + fl * 3, 8, 0, 0, TAU); g.fill(); } }
}

/* ======================= SIR VERMILION ======================= */
class CrimsonKnight extends Boss {
  constructor(game, arena) {
    super(game, arena, { name: 'Sir Vermilion', nameEn: 'Sir Vermilion, the Crimson Knight', title: 'El Caballero Carmesí', hp: 1500, x: arena.x0 + (arena.x1 - arena.x0) * .72, y: arena.floor });
    this.vx = 0; this.vy = 0; this.face = -1; this.count = 0; this.phantoms = []; this.giant = 0; this.sweep = null; this.stagger = 0; this.cape = [];
    for (let i = 0; i < 6; i++) this.cape.push({ x: this.x, y: this.y - 60 + i * 8, px: this.x, py: this.y - 60 + i * 8 });
  }
  update(dt) {
    this.t += dt; this.stT += dt; this.flash -= dt; this.stagger = Math.max(0, this.stagger - dt);
    const A = this.arena, f = A.floor, H = this.hero, G = this.game, spd = 1 + (this.phase - 1) * .22, dx = H.x - this.x;
    // física simple
    this.vy += 2200 * dt; this.y += this.vy * dt; if (this.y >= f) { if (this.vy > 600) { FX.land(this.x, f, this.vy); } this.y = f; this.vy = 0; } this.x = clamp(this.x + this.vx * dt, A.x0 + 40, A.x1 - 40); this.vx *= .9;
    // capa
    const cp = this.cape; cp[0].x = this.x - this.face * 6; cp[0].y = this.y - 62;
    for (let i = 1; i < cp.length; i++) { const s = cp[i], vx = (s.x - s.px) * .9, vy = (s.y - s.py) * .9; s.px = s.x; s.py = s.y; s.x += vx - this.face * .3; s.y += vy + 500 * dt * dt; }
    for (let k = 0; k < 3; k++) for (let i = 1; i < cp.length; i++) { const a = cp[i - 1], b = cp[i], ddx = b.x - a.x, ddy = b.y - a.y, d = Math.hypot(ddx, ddy) || 1, fr = (d - 9) / d; b.x -= ddx * fr; b.y -= ddy * fr; }
    // fantasmas de errores
    for (const p of this.phantoms) { p.t += dt; p.x += Math.sign(H.x - p.x) * 60 * dt; p.y = f - 50 + Math.sin(p.t * 2) * 12; }
    // forma gigante: barridos
    this.giant = approach(this.giant, this.phase >= 3 && this.st !== 'sealing' && this.st !== 'dying' ? 1 : 0, dt * .5);
    if (this.giant > .9 && !this.sweep && chance(dt * .35)) { this.sweep = { t: 0, dir: chance(.5) ? 1 : -1, hy: chance(.5) ? f - 30 : f - 110 }; Sound.play('telegraph', 36); G.toast(this.sweep.hy > f - 60 ? 'Giant sword: JUMP!' : 'Giant sword: stay DOWN!', this.sweep.hy > f - 60 ? '¡Espada gigante: SALTA!' : '¡Espada gigante: quédate ABAJO!'); }
    if (this.sweep) { const s = this.sweep; s.t += dt; if (s.t > 1 && s.t < 1.8) { s.x = lerp(s.dir > 0 ? A.x0 - 100 : A.x1 + 100, s.dir > 0 ? A.x1 + 100 : A.x0 - 100, (s.t - 1) / .8); if (Math.abs(H.x - s.x) < 40 && Math.abs(H.y - 25 - s.hy) < 40) { H.hurt(22, s.x - s.dir * 10, { unblockable: true }); } } if (s.t > 2) this.sweep = null; }
    if (this.st === 'intro') { this.face = Math.sign(dx) || -1; if (this.stT > 2.4) this.set('idle'); return; }
    if (this.st === 'sealing' || this.st === 'dying' || this.st === 'lock') return;
    if (this.st === 'recover' || this.st === 'stagger') { if (this.stT > (this.st === 'stagger' ? 3 : 1.5)) this.set('idle'); return; }
    if (this.st === 'idle') {
      this.face = Math.sign(dx) || this.face;
      if (Math.abs(dx) > 160) this.vx = this.face * 200 * spd;
      if (this.stT > .9 / spd) {
        this.count++;
        if (this.count % 5 === 0) { this.startLock(); return; }
        const opts = Math.abs(dx) < 220 ? ['combo', 'combo', 'guard', 'leap'] : ['lunge', 'crescent', 'leap']; if (this.phase >= 2 && this.phantoms.length < 2 && chance(.4)) opts.push('phantoms');
        const a = this.pickAttack(opts); this.set(a + 'Up'); this.hits = 0;
        if (a !== 'guard') Sound.play('telegraph', 60);
      }
    } else if (this.st === 'comboUp') { if (this.stT > .4 / spd) { this.set('combo'); } }
    else if (this.st === 'combo') { const step = .32 / spd, k = Math.floor(this.stT / step); if (k > this.hits && this.hits < 3) { this.hits++; this.vx = this.face * 320; Sound.play('swing', true); } if (this.stT > step * 3.4) this.set('idle'); }
    else if (this.st === 'lungeUp') { this.face = Math.sign(dx) || this.face; if (this.stT > .55 / spd) { this.set('lunge'); Sound.play('whoosh'); } }
    else if (this.st === 'lunge') { this.vx = this.face * 900 * spd; if (chance(.9)) FX.afterimage({ x: this.x, y: this.y, draw: (g2, s, a) => { g2.save(); g2.globalAlpha = .4 * a; g2.fillStyle = '#ff4040'; g2.fillRect(s.x - 14, s.y - 76, 28, 76); g2.restore(); } }); if (this.stT > .5) this.set('idle'); }
    else if (this.st === 'guardUp') { this.set('guard'); }
    else if (this.st === 'guard') { this.vx = 0; if (this.stT > 1.6) this.set('idle'); }
    else if (this.st === 'crescentUp') { if (this.stT > .5) { this.set('crescent'); for (let i = 0; i < (this.phase > 1 ? 2 : 1); i++) setTimeout(() => G.spawnProjectile({ owner: 'enemy', kind: 'wave', x: this.x + this.face * 30, y: f - 22, vx: this.face * 520, vy: 0, r: 20, dmg: 16, life: 3 }), i * 350); Sound.play('swing', true); } }
    else if (this.st === 'crescent') { if (this.stT > 1.1) this.set('idle'); }
    else if (this.st === 'leapUp') { if (this.stT > .35) { this.set('leap'); this.vy = -1100; this.tx = H.x; Sound.play('djump'); } }
    else if (this.st === 'leap') { this.x = lerp(this.x, this.tx, dt * 3); if (this.stT > .3 && this.y >= f) { this.set('idle'); FX.slam(this.x, f, 1.4); Sound.play('slam'); G.shake(10, .3); G.spawnShockwave(this.x + 40, f, 1, 260, 12); G.spawnShockwave(this.x - 40, f, -1, 260, 12); G.dealAreaToHero(this.x, f - 40, 70, 20); } }
    else if (this.st === 'phantomsUp') { if (this.stT > .6) { this.set('idle'); this.spawnPhantoms(); } }
  }
  spawnPhantoms() {
    const G = this.game, src = Learn.session.missed.length ? Learn.session.missed : Learn.weakItems(4).map(it => ({ sentence: Learn.fullSentence(it, it[1][0]), given: it[1][1], es: it[2] }));
    const A = this.arena;
    for (let i = 0; i < 2; i++) { const m = src.length ? src[i % src.length] : { sentence: 'I am ready.', given: 'I is ready', es: 'Estoy listo.' }; this.phantoms.push({ x: i ? A.x0 + 80 : A.x1 - 80, y: A.floor - 50, t: i, hp: 3, wrong: m.given ? String(m.given) : '???', right: m.sentence }); }
    G.banner('PHANTOMS OF MISTAKES', 'Tus errores toman forma: ¡derrótalos para recordar la forma correcta!', '#ff9a9a', true);
  }
  startLock() {
    const G = this.game, H = this.hero; this.set('lock'); this.x = H.x + H.face * 46; this.face = -H.face; this.vx = 0;
    G.cam.tz = 1.25; G.slow(.15, 99); Sound.play('parry'); G.flashScreen([255, 200, 200], .5); FX.sparks((H.x + this.x) / 2, H.y - 40, [255, 220, 180], 30, 0, 500); FX.text(H.x, H.y - 120, 'BLADE LOCK!', '#ffd0d0', 56);
    setTimeout(() => G.askQuestion({ kind: 'lock', title: 'BLADE LOCK · CHOQUE DE ESPADAS', onResult: ok => {
      G.cam.tz = 1; G.timeScale = 1; G.slowT = 0;
      if (ok) { this.set('stagger'); this.vx = -H.face * -700; this.vx = (this.x > H.x ? 1 : -1) * 700; FX.text(this.x, this.y - 120, 'STAGGERED!', '#ffe080', 56); Sound.play('crit'); G.shake(14, .4); this.hurt(this.maxHp * .05, 1, { x: this.x, y: this.y - 50, heavy: true }, { mul: 1 }); }
      else { H.inv = 0; H.hurt(20, this.x, { unblockable: true, kb: 500, kup: 500 }); this.set('idle'); FX.text(this.x, this.y - 120, 'TOO WEAK!', '#ff7a7a', 46); }
    } }), 500);
  }
  hurt(dmg, dir, info, box) {
    if (box && box.phantom) { const p = box.phantom; p.hp--; FX.hit(p.x, p.y, dir); Sound.play('hit'); if (p.hp <= 0) { p.dead = true; FX.celebrate(p.x, p.y - 20); FX.text(p.x, p.y - 90, p.right, '#9bffb0', 26, { comic: false, max: 2.4, vy: -20 }); Sound.play('correct'); } this.phantoms = this.phantoms.filter(q => !q.dead); return true; }
    if (this.st === 'guard') { const H = this.hero; FX.sparks(this.x + this.face * 20, this.y - 50, [255, 255, 255], 14, -dir); Sound.play('parry'); H.inv = 0; H.hurt(12, this.x, { unblockable: true, kb: 380 }); H.ctrlLock = .6; FX.text(this.x, this.y - 110, 'COUNTER!', '#ff8080', 40); this.set('idle'); return false; }
    return super.hurt(dmg, dir, info, box);
  }
  onPhase(p) { if (p === 3) this.game.banner('THE CRIMSON COLOSSUS AWAKES', 'Su armadura gigante barre la sala: salta o agáchate', '#ff6a6a', true); }
  vulnerable() {
    const out = [];
    for (const p of this.phantoms) out.push({ x: p.x - 20, y: p.y - 40, w: 40, h: 70, phantom: p, mul: 1 });
    if (this.st !== 'intro' && this.st !== 'lock') out.push({ x: this.x - 22, y: this.y - 80, w: 44, h: 80, mul: this.st === 'stagger' ? 2.6 : this.st === 'guard' ? 1 : 1 });
    return out;
  }
  attackBoxes() {
    const out = [], f = this.arena.floor;
    if (this.st === 'combo' && (this.stT % (.32 / (1 + (this.phase - 1) * .22))) < .12) out.push({ x: this.face > 0 ? this.x : this.x - 80, y: this.y - 70, w: 80, h: 60, dmg: 14 });
    if (this.st === 'lunge') out.push({ x: this.x - 30, y: this.y - 70, w: 60, h: 70, dmg: 18 });
    for (const p of this.phantoms) out.push({ x: p.x - 16, y: p.y - 30, w: 32, h: 50, dmg: 10, contact: true });
    return out;
  }
  drawBack(g) {
    const A = this.arena, f = A.floor, k = this.giant; if (k < .02) return;
    const cx = (A.x0 + A.x1) / 2, t = this.t;
    g.save(); g.globalAlpha = .55 * k;
    g.fillStyle = '#5a0e18'; g.beginPath(); g.moveTo(cx - 260, f); g.lineTo(cx - 200, f - 420); g.quadraticCurveTo(cx, f - 520, cx + 200, f - 420); g.lineTo(cx + 260, f); g.fill();
    g.fillStyle = '#7a1a24'; g.beginPath(); g.roundRect(cx - 110, f - 690, 220, 220, 60); g.fill();
    g.fillStyle = `rgba(255,${60 + Math.sin(t * 6) * 40 | 0},60,1)`; g.fillRect(cx - 80, f - 600, 160, 18);
    g.restore();
    if (this.sweep && this.sweep.t < 1) { const s = this.sweep; g.strokeStyle = `rgba(255,60,60,${.4 + Math.sin(t * 30) * .3})`; g.lineWidth = 3; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(A.x0, s.hy); g.lineTo(A.x1, s.hy); g.stroke(); g.setLineDash([]); }
  }
  draw(g) {
    const ff = this.flash > 0, f = this.arena.floor;
    if (this.sweep && this.sweep.x !== undefined && this.sweep.t > 1) { const s = this.sweep; g.save(); g.translate(s.x, s.hy); g.fillStyle = '#e8e0e8'; g.fillRect(-500 * s.dir, -14, 500 * s.dir, 28); g.fillStyle = '#ff5050'; g.fillRect(-500 * s.dir, -4, 500 * s.dir, 8); g.restore(); }
    for (const p of this.phantoms) {
      drawOutlined(g, p.x, p.y - 20, gg => { gg.globalAlpha = .85; gg.fillStyle = '#3a1a3a'; gg.beginPath(); gg.moveTo(p.x - 20, p.y + 20); gg.quadraticCurveTo(p.x - 24, p.y - 40, p.x, p.y - 46); gg.quadraticCurveTo(p.x + 24, p.y - 40, p.x + 20, p.y + 20); for (let i = 0; i < 4; i++) gg.lineTo(p.x + 20 - i * 13 - 6, p.y + 12 + (i % 2) * 8); gg.fill(); gg.fillStyle = '#ff6a8a'; gg.beginPath(); gg.arc(p.x - 6, p.y - 28, 3, 0, TAU); gg.arc(p.x + 6, p.y - 28, 3, 0, TAU); gg.fill(); }, '#120612');
      g.font = '700 15px "Alegreya Sans", sans-serif'; const w = g.measureText(p.wrong).width + 18; g.fillStyle = 'rgba(60,10,20,.9)'; g.beginPath(); g.roundRect(p.x - w / 2, p.y - 86, w, 24, 6); g.fill(); g.fillStyle = '#ffb0b0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.wrong, p.x, p.y - 74);
      g.strokeStyle = '#ff5a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - w / 2 + 6, p.y - 74); g.lineTo(p.x + w / 2 - 6, p.y - 74); g.stroke();
    }
    const self = this;
    drawOutlined(g, this.x, this.y - 60, gg => self.drawKnight(gg, ff), '#140808');
  }
  drawKnight(g, ff) {
    const x = this.x, y = this.y, fc = this.face, t = this.t, st = this.st, K = 1.28;
    const O = '#140808', arm = ff ? '#fff' : '#b0303c', armL = ff ? '#fff' : '#e0585e', armS = ff ? '#fff' : '#6a1622', steel = ff ? '#fff' : '#c4c8d6', steelS = ff ? '#fff' : '#7a7e92', gold = ff ? '#fff' : '#e8b850', goldS = '#9a6a20';
    // capa (física por puntos), con forro oscuro
    g.fillStyle = ff ? '#fff' : '#5a0c16'; g.beginPath(); g.moveTo(x - fc * 6, y - 64 * K); for (const s of this.cape) g.lineTo(s.x - fc * 6, s.y); for (let i = this.cape.length - 1; i >= 0; i--) g.lineTo(this.cape[i].x + fc * (14 + i * 3), this.cape[i].y + 4); g.closePath(); g.fill();
    g.fillStyle = ff ? '#fff' : '#9a1826'; g.beginPath(); g.moveTo(x - fc * 6, y - 64 * K); for (const s of this.cape) g.lineTo(s.x - fc * 6, s.y); for (let i = this.cape.length - 1; i >= 0; i--) g.lineTo(this.cape[i].x + fc * (4 + i * 1.5), this.cape[i].y + 2); g.closePath(); g.fill();
    g.save(); g.translate(x, y); g.scale(fc * K, K);
    const crouch = st === 'stagger' ? 8 : st === 'guard' ? 4 : 0, lunge = st === 'lunge' ? .3 : st === 'combo' ? .15 : 0;
    const P = (fn, fill, lw = 2) => { g.beginPath(); fn(); g.fillStyle = fill; g.fill(); if (!ff) { g.strokeStyle = O; g.lineWidth = lw; g.stroke(); } };
    // piernas con grebas
    const ph = Math.abs(this.vx) > 40 ? Math.sin(t * 14) * 8 : 0;
    for (const sd of [1, -1]) { const o = sd * 7 + sd * ph * .4;
      P(() => g.roundRect(o - 5.5, -30 + crouch, 11, 26 - crouch, 3), sd > 0 ? steel : steelS);
      P(() => g.ellipse(o, -17 + crouch * .5, 6, 4, 0, 0, TAU), gold, 1.4);
      P(() => g.roundRect(o - 6, -7, 15, 8, [4, 6, 2, 2]), sd > 0 ? '#3a3a48' : '#2a2a34'); }
    g.rotate(lunge);
    // brazo trasero con escudo pequeño
    P(() => { g.moveTo(-14, -62 + crouch); g.lineTo(-22, -40 + crouch); g.lineTo(-16, -38 + crouch); g.closePath(); }, steelS);
    P(() => { g.moveTo(-30, -60 + crouch); g.lineTo(-12, -60 + crouch); g.lineTo(-12, -40 + crouch); g.quadraticCurveTo(-21, -30 + crouch, -30, -40 + crouch); g.closePath(); }, armS);
    g.fillStyle = gold; g.fillRect(-23, -57 + crouch, 4, 16); g.fillRect(-28, -51 + crouch, 14, 4);
    // faldones
    P(() => { g.moveTo(-14, -34 + crouch); g.lineTo(14, -34 + crouch); g.lineTo(17, -22 + crouch); g.lineTo(-15, -22 + crouch); g.closePath(); }, armS);
    g.fillStyle = gold; g.fillRect(-15, -25 + crouch, 32, 2.5);
    // torso / peto
    P(() => g.roundRect(-15, -68 + crouch, 31, 38, [10, 10, 6, 6]), arm, 2.4);
    if (!ff) { g.fillStyle = armS; g.beginPath(); g.roundRect(5, -66 + crouch, 10, 34, [0, 8, 6, 0]); g.fill(); g.fillStyle = armL; g.beginPath(); g.roundRect(-12, -64 + crouch, 6, 22, 3); g.fill();
      g.strokeStyle = goldS; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -66 + crouch); g.lineTo(0, -36 + crouch); g.stroke();
      // emblema
      g.fillStyle = gold; g.beginPath(); g.moveTo(-2, -58 + crouch); g.lineTo(4, -54 + crouch); g.lineTo(-2, -46 + crouch); g.lineTo(-8, -54 + crouch); g.closePath(); g.fill(); }
    P(() => g.rect(-16, -36 + crouch, 32, 5), gold, 1.6); g.fillStyle = '#3a2016'; g.fillRect(-2, -36 + crouch, 5, 5);
    // hombrera delantera
    P(() => { g.moveTo(4, -70 + crouch); g.quadraticCurveTo(24, -74 + crouch, 26, -56 + crouch); g.lineTo(6, -54 + crouch); g.closePath(); }, steel);
    if (!ff) { g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(8, -58 + crouch); g.quadraticCurveTo(18, -60 + crouch, 24, -58 + crouch); g.stroke(); }
    // gorjal + casco
    P(() => g.roundRect(-8, -74 + crouch, 18, 8, 3), steelS);
    P(() => { g.moveTo(-13, -76 + crouch); g.lineTo(-13, -92 + crouch); g.quadraticCurveTo(-12, -104 + crouch, 1, -104 + crouch); g.quadraticCurveTo(16, -104 + crouch, 16, -90 + crouch); g.lineTo(18, -80 + crouch); g.lineTo(10, -74 + crouch); g.lineTo(-10, -74 + crouch); g.closePath(); }, steel, 2.4);
    if (!ff) { g.fillStyle = steelS; g.beginPath(); g.moveTo(-13, -90 + crouch); g.quadraticCurveTo(-12, -102 + crouch, -4, -103 + crouch); g.lineTo(-6, -76 + crouch); g.lineTo(-13, -76 + crouch); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha = .7; g.fillRect(4, -100 + crouch, 7, 2.5); g.globalAlpha = 1; }
    // visera con ojo brillante
    g.fillStyle = '#16121c'; g.beginPath(); g.roundRect(0, -90 + crouch, 17, 6, 2); g.fill();
    g.fillStyle = st === 'guard' || st.endsWith('Up') ? '#fff060' : '#ff3a3a'; g.fillRect(6, -88.5 + crouch, 9, 3);
    g.fillStyle = '#16121c'; for (let k = 0; k < 3; k++) g.fillRect(6 + k * 4, -81 + crouch, 2, 4);
    // cresta + penacho ondulante
    P(() => g.rect(-4, -108 + crouch, 6, 6), gold, 1.4);
    const pw = Math.sin(t * 5) * 3;
    P(() => { g.moveTo(0, -108 + crouch); g.bezierCurveTo(-16, -126 + pw, -38, -116 + pw, -44, -92 + crouch + pw); g.quadraticCurveTo(-34, -100 + crouch, -26, -96 + crouch); g.quadraticCurveTo(-30, -88 + crouch, -36, -80 + crouch); g.quadraticCurveTo(-18, -92 + crouch, -4, -102 + crouch); g.closePath(); }, ff ? '#fff' : '#e0202e', 2);
    if (!ff) { g.strokeStyle = '#ff7a7a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-4, -110 + crouch); g.quadraticCurveTo(-22, -118 + pw, -36, -100 + pw); g.stroke(); }
    // espada (con guantelete)
    let sa = -.6; if (st === 'combo') sa = [-.9, .9, -.2][Math.min(2, this.hits - 1)] ?? -.6; if (st === 'comboUp' || st === 'lungeUp') sa = -2.3; if (st === 'guard') sa = -1.45; if (st === 'lunge') sa = 0; if (st === 'crescentUp') sa = -2.6; if (st === 'stagger') sa = .9;
    P(() => { g.moveTo(8, -60 + crouch); g.lineTo(14, -50 + crouch); g.lineTo(10, -48 + crouch); g.closePath(); }, steel);
    g.save(); g.translate(13, -50 + crouch); g.rotate(sa);
    P(() => g.rect(-14, -3, 12, 6), '#3a2016', 1.4); P(() => g.arc(-15, 0, 3.5, 0, TAU), gold, 1.2);
    P(() => g.roundRect(-4, -11, 6, 22, 2), gold, 1.4);
    P(() => { g.moveTo(2, -4.5); g.lineTo(58, -3); g.lineTo(70, 0); g.lineTo(58, 3); g.lineTo(2, 4.5); g.closePath(); }, steel, 1.8);
    if (!ff) { g.fillStyle = steelS; g.beginPath(); g.moveTo(2, 0); g.lineTo(70, 0); g.lineTo(58, 3); g.lineTo(2, 4.5); g.closePath(); g.fill();
      g.strokeStyle = '#ff4a5a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, 0); g.lineTo(52, 0); g.stroke(); }
    P(() => g.roundRect(-6, -6, 10, 12, 4), steelS, 1.6);
    g.restore();
    if (st === 'guard') { g.strokeStyle = 'rgba(255,80,80,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(20, -50, 34, -1.2, 1.2); g.stroke(); }
    g.restore();
  }
  drawGlow(g) { if (this.st === 'guard' || this.st.endsWith('Up')) glowAt(g, this.st === 'guard' ? [255, 60, 60] : [255, 240, 160], this.x + this.face * 30, this.y - 60, 40, .7); for (const p of this.phantoms) glowAt(g, [255, 80, 120], p.x, p.y - 20, 60, .4); if (this.giant > .1) glowAt(g, [255, 40, 40], (this.arena.x0 + this.arena.x1) / 2, this.arena.floor - 590, 160, .4 * this.giant); }
}

Object.assign(BOSS_TYPES, { wyvern: StormWyvern, colossus: ClockworkColossus, knight: CrimsonKnight });

/* ---------- niveles de jefe de los mundos 4-6 ---------- */
function buildBossLevel(seed, biome, mat, cover, bossType, deco) {
  const b = new LB(seed); const G = () => b.y;
  b.biome(biome, mat, cover);
  b.run(500, 0, 2); b.obj('checkpoint', 60, G(), { first: true }); b.coins(200, G() - 70, 6, 30);
  b.obj('shrine', 380, G());
  b.run(400, -20, 3); deco && deco(b, G);
  b.obj('checkpoint', b.at(-100), G());
  const bx = b.x; b.run(1300, 0, 1);
  b.arena(bx + 40, bx + 1260, [], { bossType, floor: G() });
  b.run(400, 0); b.obj('exit', b.at(-200), G());
  return b.finish();
}
function buildStormBoss() { return buildBossLevel(606, 'sky', 'cloud', 'cloud', 'wyvern', (b, G) => { b.plat(b.at(-260), G() - 150, 110, { soft: 'cloud', mat: 'cloud', cover: null, dynamic: true }); }); }
function buildGearBoss() { return buildBossLevel(707, 'clockwork', 'metal', null, 'colossus', (b, G) => { b.obj('chest', b.at(-200), G(), { tier: 'silver' }); }); }
function buildCrimsonBoss() { return buildBossLevel(808, 'castle', 'brick', null, 'knight', (b, G) => { b.obj('chest', b.at(-200), G(), { tier: 'gold' }); }); }
WORLDS[3].boss = 'wyvern'; WORLDS[3].bossBuild = buildStormBoss;
WORLDS[4].boss = 'colossus'; WORLDS[4].bossBuild = buildGearBoss;
WORLDS[5].boss = 'knight'; WORLDS[5].bossBuild = buildCrimsonBoss;
