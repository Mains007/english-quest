"use strict";
/* =====================================================================
   ARSENAL — armas nuevas, técnicas desbloqueables y ataques definitivos.
   · Arco de Viento, Guadaña Lunar, Chakram Solar y Báculo de Tormenta, cada uno
     con su forma de luchar, su ataque cargado y su Palabra de Poder (definitivo)
   · TÉCNICAS: una por arma; se compran en el Taller con monedas (y piden puntos de
     inglés); se lanzan manteniendo BLOQUEO y pulsando ATAQUE. Gritan su nombre en inglés.
   ===================================================================== */
Object.assign(WEAPONS, {
  bow:     { name: 'Arco de Viento', es: 'A distancia. Flechas rápidas; el tercer disparo es triple.', dmg: [9, 9, 8], reach: 40, hh: 40, speed: 1.15, hits: 3, col: [190, 255, 170], ult: 'Lluvia de Estrellas', ep: 400, cost: 40, ranged: 1 },
  scythe:  { name: 'Guadaña Lunar', es: 'Barridos enormes que cortan delante y detrás. Cada golpe te cura un poco.', dmg: [13, 13, 24], reach: 96, hh: 72, speed: .85, hits: 3, col: [205, 175, 255], ult: 'Eclipse', ep: 900, cost: 70 },
  chakram: { name: 'Chakram Solar', es: 'Un disco que vuelve a tu mano como un bumerán y golpea a la ida y a la vuelta.', dmg: [10, 10, 12], reach: 40, hh: 40, speed: 1.1, hits: 3, col: [255, 196, 90], ult: 'Sol Danzante', ep: 1400, cost: 100, ranged: 1 },
  staff:   { name: 'Báculo de Tormenta', es: 'Magia: rayos que saltan al enemigo más cercano y pinchos de hielo.', dmg: [11, 11, 16], reach: 40, hh: 40, speed: 1, hits: 3, col: [150, 205, 255], ult: 'Ojo del Huracán', ep: 2000, cost: 130, ranged: 1 }
});
// técnicas (una por arma): se compran con monedas y piden puntos de inglés
const TECHS = {
  sword:    { name: 'Tajo Celeste', en: 'SKY SPLITTER', es: 'Subes girando y lanzas a los enemigos por los aires; luego caes en picado con una onda de choque.', coins: 250, ep: 120 },
  spear:    { name: 'Colmillos de Marea', en: 'TIDE FANGS', es: 'Diez estocadas en un suspiro; cada una levanta un pincho de agua.', coins: 300, ep: 300 },
  hammer:   { name: 'Grieta de Magma', en: 'MAGMA RIFT', es: 'Golpeas el suelo y una grieta avanza haciendo brotar columnas de lava.', coins: 400, ep: 650 },
  gauntlet: { name: 'Puño del Trueno', en: 'THUNDER FIST', es: 'Cruzas la pantalla de un puñetazo y el rayo salta entre los enemigos.', coins: 450, ep: 1150 },
  bow:      { name: 'Flecha Tormenta', en: 'STORM ARROW', es: 'Una flecha gigante que se parte en seis flechas que persiguen a los enemigos.', coins: 350, ep: 450 },
  scythe:   { name: 'Danza Segadora', en: 'REAPER DANCE', es: 'Avanzas girando como un torbellino de medias lunas.', coins: 450, ep: 950 },
  chakram:  { name: 'Órbita Solar', en: 'SOLAR ORBIT', es: 'Tres discos giran a tu alrededor durante unos segundos.', coins: 500, ep: 1450 },
  staff:    { name: 'Cadena de Tormenta', en: 'CHAIN STORM', es: 'Rayos que golpean una y otra vez a todos los enemigos cercanos.', coins: 600, ep: 2050 }
};

const Arsenal = (() => {
  const A = { proj: [], orbit: null };
  const NEW = new Set(['bow', 'scythe', 'chakram', 'staff']);
  const owned = k => !!(Store.data.techs && Store.data.techs[k]);

  /* ================= PROYECTILES DEL HÉROE ================= */
  function shoot(o) { A.proj.push(Object.assign({ t: 0, life: 1.6, r: 8, hit: new Set(), pierce: 0, g: 0 }, o)); }
  function hitEnemy(G, p, e) {
    if (p.hit.has(e)) return false;
    p.hit.add(e); const dir = Math.sign(p.vx) || G.hero.face;
    const ok = e.hurt(p.dmg, dir, { kb: p.kb || 160, up: p.up, heavy: p.heavy, armor: p.armor });
    if (ok) { G.hero.addUlt(p.ult ?? 3); if (G.hero.weapon === 'scythe') G.hero.hp = Math.min(G.hero.maxHp, G.hero.hp + 1); }
    return ok;
  }
  function updateProj(G, dt) {
    const H = G.hero, W = G.world;
    for (const p of A.proj) {
      p.t += dt;
      if (p.stuck) { if (p.t > p.life) p.dead = 1; continue; }
      // comportamiento según tipo
      if (p.kind === 'disc') {
        // bumerán: va, se frena y vuelve a la mano
        if (!p.back && p.t > p.out) p.back = 1;
        if (p.back) { const dx = H.x - p.x, dy = H.y - 36 - p.y, d = Math.hypot(dx, dy) || 1; const sp = Math.min(1100, 400 + p.t * 600); p.vx = lerp(p.vx, dx / d * sp, Math.min(1, dt * 8)); p.vy = lerp(p.vy, dy / d * sp, Math.min(1, dt * 8)); if (d < 26) { p.dead = 1; H.discs = Math.max(0, (H.discs || 1) - 1); Sound.play('pickup'); continue; } if (p.t > 4) { p.dead = 1; H.discs = 0; } }
        else { p.vx *= Math.exp(-dt * 2.2); }
        if (p.bounce && p.hit.size && !p.retarget) { /* rebote entre enemigos */ }
        if (chance(.6)) FX.trail(p.x, p.y, [255, 200, 90], 5);
      } else if (p.kind === 'homing') {
        if (!p.tgt || p.tgt.dead) p.tgt = G.nearestEnemy(p.x, p.y, 500, 0);
        if (p.tgt) { const dx = p.tgt.x - p.x, dy = p.tgt.y - p.tgt.h / 2 - p.y, d = Math.hypot(dx, dy) || 1, sp = 900; p.vx = lerp(p.vx, dx / d * sp, Math.min(1, dt * 6)); p.vy = lerp(p.vy, dy / d * sp, Math.min(1, dt * 6)); }
        if (chance(.8)) FX.trail(p.x, p.y, [190, 255, 170], 4);
      } else if (p.kind === 'bigarrow') {
        if (chance(.9)) FX.trail(p.x - p.vx * .02, p.y, [200, 255, 190], 8);
        if (p.t > .32 && !p.split) { p.split = 1; p.dead = 1; FX.ring(p.x, p.y, [200, 255, 180], 70, .35); Sound.play('zap'); for (let i = 0; i < 6; i++) { const a = (i - 2.5) * .35; shoot({ kind: 'homing', x: p.x, y: p.y, vx: Math.cos(a) * 500 * Math.sign(p.vx), vy: Math.sin(a) * 500 - 120, dmg: 14, life: 2, r: 7 }); } continue; }
      } else if (p.kind === 'crescent') {
        if (chance(.7)) FX.trail(p.x, p.y + R(-20, 20), [205, 175, 255], 6);
      } else if (p.kind === 'spike') {
        // pincho de hielo: brota del suelo con retraso
        if (p.t < p.delay) continue;
        if (!p.up2) { p.up2 = 1; FX.chunks(p.x, p.y - 10, [200, 235, 255], 4, 220, .6); Sound.play('crumble'); G.areaDamage(p.x, p.y - 30, 34, p.dmg, { up: true, kb: 200 }); }
        if (p.t > p.delay + .7) p.dead = 1;
        continue;
      } else if (p.kind === 'arrow') { if (chance(.4)) FX.trail(p.x, p.y, [200, 255, 190], 3); }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'arrow' || p.kind === 'homing' || p.kind === 'bigarrow') p.ang = Math.atan2(p.vy, p.vx);
      if (p.t > p.life) { p.dead = 1; continue; }
      // golpes
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || p.hit.has(e)) continue;
        const b = e.hitbox(); if (!circleRect({ x: p.x, y: p.y, r: p.r }, b)) continue;
        if (hitEnemy(G, p, e)) {
          FX.hit(p.x, p.y, Math.sign(p.vx) || 1, p.col || [255, 255, 220], !!p.heavy);
          if (p.kind === 'disc' && p.bounce > 0) { p.bounce--; const n = G.nearestEnemy(p.x, p.y, 380, 0, e); if (n && !p.hit.has(n)) { const dx = n.x - p.x, dy = n.y - n.h / 2 - p.y, d = Math.hypot(dx, dy) || 1; p.vx = dx / d * 900; p.vy = dy / d * 900; p.t = Math.min(p.t, p.out - .15); } }
          if (!p.pierce && p.kind !== 'disc') { p.dead = 1; break; }
        }
      }
      if (p.dead) continue;
      if (G.boss && !G.boss.dead && !p.bossHit) for (const v of G.boss.vulnerable()) if (circleRect({ x: p.x, y: p.y, r: p.r }, v)) { if (G.boss.hurt(p.dmg, Math.sign(p.vx) || 1, { x: p.x, y: p.y, heavy: p.heavy, box: v }, v)) H.addUlt(3); p.bossHit = 1; if (!p.pierce && p.kind !== 'disc') p.dead = 1; break; }
      for (const pr of G.props) if (!p.dead && Math.abs(pr.x - p.x) < pr.w / 2 + p.r && p.y > pr.y - pr.h && p.y < pr.y) { pr.hit(p.dmg, Math.sign(p.vx) || 1, { kb: 200 }); if (!p.pierce && p.kind !== 'disc') p.dead = 1; }
      // suelo: las flechas se clavan
      if (!p.dead && p.kind !== 'disc' && p.kind !== 'crescent') {
        const gy = W.groundY(p.x);
        if ((isFinite(gy) && p.y > gy - 2) || W.wallHit(p.x, p.y, p.vx)) { if (p.kind === 'arrow') { p.stuck = 1; p.t = 0; p.life = .9; p.y = Math.min(p.y, gy - 2); FX.chunks(p.x, p.y, [160, 140, 110], 2, 120, .4); } else p.dead = 1; }
      }
    }
    A.proj = A.proj.filter(p => !p.dead);
    // órbita solar (técnica del chakram)
    if (A.orbit) {
      const O = A.orbit; O.t += dt;
      for (let i = 0; i < 3; i++) {
        const a = O.t * 7 + i * TAU / 3, x = H.x + Math.cos(a) * 64, y = H.y - 36 + Math.sin(a) * 40;
        if (chance(.5)) FX.trail(x, y, [255, 200, 90], 5);
        for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const k = 'o' + i; if ((e._orbT || 0) > G.t) continue; if (circleRect({ x, y, r: 14 }, e.hitbox())) { e._orbT = G.t + .25; e.hurt(9, Math.sign(e.x - H.x) || 1, { kb: 220 }); H.addUlt(2); } }
      }
      if (O.t > 4.2) A.orbit = null;
    }
  }
  function drawProj(g, G) {
    const t = G.rt;
    for (const p of A.proj) {
      g.save(); g.translate(p.x, p.y);
      if (p.kind === 'arrow' || p.kind === 'homing' || p.kind === 'bigarrow') {
        const s = p.kind === 'bigarrow' ? 2.4 : 1;
        g.rotate(p.ang || 0); g.scale(s, s);
        g.strokeStyle = '#6a4a28'; g.lineWidth = 2; g.beginPath(); g.moveTo(-18, 0); g.lineTo(8, 0); g.stroke();
        g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(14, 0); g.lineTo(6, -4); g.lineTo(6, 4); g.fill();
        g.fillStyle = '#9be870'; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-24, -4); g.lineTo(-20, 0); g.lineTo(-24, 4); g.fill();
        if (p.kind !== 'arrow') { g.globalCompositeOperation = 'lighter'; glowAt(g, [190, 255, 170], 0, 0, 16, .6); }
      } else if (p.kind === 'disc') {
        g.rotate(t * 24); drawDisc(g, 1.1);
        g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 190, 80], 0, 0, 22, .5);
      } else if (p.kind === 'crescent') {
        g.scale(Math.sign(p.vx) || 1, 1); g.globalCompositeOperation = 'lighter';
        const gr = g.createLinearGradient(-30, 0, 30, 0); gr.addColorStop(0, 'rgba(160,120,255,0)'); gr.addColorStop(1, 'rgba(235,220,255,.95)');
        g.fillStyle = gr; g.beginPath(); g.arc(-10, 0, 46, -1.2, 1.2); g.arc(-26, 0, 40, 1.15, -1.15, true); g.fill();
      } else if (p.kind === 'spike') {
        if (p.t >= p.delay) { const k = Math.min(1, (p.t - p.delay) / .1), fade = p.t > p.delay + .45 ? 1 - (p.t - p.delay - .45) / .25 : 1, h = 70 * k;
          g.globalAlpha = Math.max(0, fade); const gr = g.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, '#f4fdff'); gr.addColorStop(1, '#7ab8e8');
          g.fillStyle = gr; g.beginPath(); g.moveTo(-14, 0); g.lineTo(-3, -h); g.lineTo(4, -h * .7); g.lineTo(12, 0); g.fill();
          g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-3, -h); g.lineTo(-1, 0); g.fill(); }
      } else if (p.kind === 'spark') {
        g.globalCompositeOperation = 'lighter'; glowAt(g, [170, 220, 255], 0, 0, 16, .9); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      }
      g.restore();
    }
    if (A.orbit) {
      const H = G.hero;
      for (let i = 0; i < 3; i++) { const a = A.orbit.t * 7 + i * TAU / 3; g.save(); g.translate(H.x + Math.cos(a) * 64, H.y - 36 + Math.sin(a) * 40); g.rotate(t * 20); drawDisc(g, 1); g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 190, 80], 0, 0, 20, .5); g.restore(); }
    }
  }
  function drawDisc(g, s) {
    g.save(); g.scale(s, s);
    g.fillStyle = '#e8a030'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); g.lineTo(Math.cos(a + .39) * 8, Math.sin(a + .39) * 8); } g.closePath(); g.fill();
    g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
    g.fillStyle = '#7a4a10'; g.beginPath(); g.arc(0, 0, 3.2, 0, TAU); g.fill();
    g.restore();
  }

  /* ================= ATAQUES DE LAS ARMAS NUEVAS ================= */
  function fire(H, a) {
    const G = H.game, W = H.W, f = H.face, x = H.x + f * 22, y = H.y - 36;
    const dmg = W.dmg[Math.min(H.combo, W.dmg.length - 1)] * (a.crit ? 2.5 : 1) * (H.skills.power ? 1.15 : 1);
    if (H.weapon === 'bow') {
      const ang = a.kind === 'up' ? -1.0 : a.kind === 'air' ? .45 : -.04;
      const n = a.heavy ? 3 : 1;
      for (let i = 0; i < n; i++) { const s = ang + (i - (n - 1) / 2) * .16; shoot({ kind: 'arrow', x, y, vx: Math.cos(s) * 1150 * f, vy: Math.sin(s) * 1150, g: 300, dmg, r: 7, life: 1.2, col: W.col, crit: a.crit }); }
      Sound.play('twang', a.heavy); H.vx -= f * 40;
    } else if (H.weapon === 'chakram') {
      if ((H.discs || 0) >= (a.heavy ? 2 : 1)) { // disco fuera: golpe corto con el puño
        G.areaDamage(H.x + f * 30, H.y - 34, 30, dmg * .6, { kb: 140 }); Sound.play('swing'); return;
      }
      const ang = a.kind === 'up' ? -1.1 : a.kind === 'air' ? .5 : 0;
      H.discs = (H.discs || 0) + 1;
      shoot({ kind: 'disc', x, y, vx: Math.cos(ang) * 900 * f, vy: Math.sin(ang) * 900, dmg, r: 13, out: .38, life: 5, pierce: 1, col: W.col, kb: 120 });
      Sound.play('whirr');
    } else if (H.weapon === 'staff') {
      // rayo que salta al enemigo más cercano por delante
      const e = G.nearestEnemy(H.x, H.y - 30, a.heavy ? 340 : 270, a.kind === 'up' ? 0 : f);
      if (e) {
        G.lightning(x, y, e.x, e.y - e.h / 2); e.hurt(dmg, f, { kb: 120, shock: 1 }); H.addUlt(3);
        if (a.heavy) { let last = e; for (let k = 0; k < 2; k++) { const n = G.nearestEnemy(last.x, last.y - 20, 220, 0, last); if (!n) break; G.lightning(last.x, last.y - last.h / 2, n.x, n.y - n.h / 2); n.hurt(dmg * .6, Math.sign(n.x - last.x) || 1, { kb: 80 }); last = n; } }
      } else if (G.boss && !G.boss.dead) { const v = G.boss.vulnerable()[0]; if (v && Math.abs(v.x + v.w / 2 - H.x) < 340) { G.lightning(x, y, v.x + v.w / 2, v.y + v.h / 2); G.boss.hurt(dmg, f, { x: v.x + v.w / 2, y: v.y + v.h / 2 }, v); } else shoot({ kind: 'spark', x, y, vx: f * 700, vy: 0, dmg, r: 7, life: .5 }); }
      else shoot({ kind: 'spark', x, y, vx: f * 700, vy: a.kind === 'up' ? -500 : 0, dmg, r: 7, life: .5, col: W.col });
      Sound.play('zap'); FX.runeBurst(x, y, W.col, 4);
    }
  }
  const sa0 = Hero.prototype.startAttack;
  Hero.prototype.startAttack = function (down, up) { sa0.call(this, down, up); if (this.atk && WEAPONS[this.weapon].ranged && this.atk.kind !== 'down') this.atk.toFire = true; };
  const ua0 = Hero.prototype.updateAttack;
  Hero.prototype.updateAttack = function (dt) {
    const a = this.atk;
    if (a && a.toFire && a.t / a.dur > .2) { a.toFire = false; fire(this, a); }
    if (a && a.kind === 'charged' && this.weapon === 'scythe' && chance(.8)) FX.trail(this.x + Math.cos(a.t * 26) * 70, this.y - 34 + Math.sin(a.t * 26) * 30, this.W.col, 6);
    ua0.call(this, dt);
  };
  const hb0 = Hero.prototype.hitboxes;
  Hero.prototype.hitboxes = function () {
    const a = this.atk; if (!a) return [];
    if (this.art) return artBoxes(this);
    const W = this.W;
    if (W.ranged && a.kind !== 'down') return [];
    if (this.weapon === 'scythe' && a.kind === 'combo') {
      // la guadaña corta delante y, en el golpe fuerte, también detrás
      const out = hb0.call(this); for (const b of out) { b.y -= 10; b.h += 20; }
      if (a.heavy && out.length) { const b = out[0]; out.push(Object.assign({}, b, { x: this.face > 0 ? this.x - b.w : this.x })); }
      return out;
    }
    if (this.weapon === 'scythe' && a.kind === 'charged') return [];
    return hb0.call(this);
  };
  const sc0 = Hero.prototype.startCharged;
  Hero.prototype.startCharged = function () {
    if (!NEW.has(this.weapon)) return sc0.call(this);
    this.chargeLvl = 0; if (this.stamina < 22) { this.game.toast('¡Sin aliento!'); return; }
    this.stamina -= 26; this.staminaT = .6;
    this.atk = { kind: 'charged', t: 0, dur: .45, id: ++this.swing, hitDone: new Set(), heavy: true, crit: this.counterT > 0 };
    const G = this.game, f = this.face, x = this.x + f * 24, y = this.y - 36, W = this.W, dmg = W.dmg[W.dmg.length - 1] * 1.7;
    Input.rumble(.3, .3, 120);
    if (this.weapon === 'bow') { shoot({ kind: 'arrow', x, y, vx: f * 1500, vy: -20, g: 60, dmg: dmg * 1.3, r: 10, life: 1.4, pierce: 1, heavy: 1, kb: 380, col: W.col }); for (let i = 0; i < 10; i++) FX.trail(x + f * i * 14, y, [220, 255, 210], 8); Sound.play('twang', true); this.vx -= f * 200; }
    else if (this.weapon === 'scythe') { shoot({ kind: 'crescent', x, y: y - 4, vx: f * 760, vy: 0, dmg: dmg * 1.1, r: 34, life: .9, pierce: 1, heavy: 1, kb: 300 }); Sound.play('reap'); }
    else if (this.weapon === 'chakram') { this.discs = (this.discs || 0) + 1; shoot({ kind: 'disc', x, y, vx: f * 1000, vy: 0, dmg: dmg * .8, r: 15, out: .55, life: 6, pierce: 1, bounce: 5, heavy: 1, kb: 200 }); Sound.play('whirr'); }
    else if (this.weapon === 'staff') { const gy = this.y; for (let i = 0; i < 6; i++) { const sx = this.x + f * (60 + i * 52), sy = G.world.groundY(sx); if (!isFinite(sy) || Math.abs(sy - gy) > 90) break; shoot({ kind: 'spike', x: sx, y: sy, delay: .08 + i * .07, dmg: dmg * .8, life: 2 }); } Sound.play('cast'); FX.runeBurst(x, y, W.col, 10); }
  };

  /* ================= TÉCNICAS (BLOQUEO + ATAQUE) ================= */
  const hu0 = Hero.prototype.update;
  Hero.prototype.update = function (dt) {
    const T = TECHS[this.weapon];
    const want = T && owned(this.weapon) && this.canAct && !this.art && !this.atk && Input.down('block') && Input.pressed('attack') && !this.game.qActive;
    if (want) {
      if ((this.artCd || 0) > 0) { this.game.toast('Técnica recargándose…'); }
      else if (this.stamina < 30) this.game.toast('¡Sin aliento!');
      else { startArt(this); }
    }
    if (want || this.art) {
      // durante la técnica el ataque normal no se lanza
      const p0 = Input.pressed; Input.pressed = a => a === 'attack' ? false : p0(a);
      try { hu0.call(this, dt); } finally { Input.pressed = p0; }
    } else hu0.call(this, dt);
    if (this.artCd > 0) this.artCd -= dt;
    if (this.art) updateArt(this, dt);
  };
  function shout(H, T) {
    const G = H.game; FX.text(H.x, H.y - 120, T.en + '!', rgba(H.W.col.map(v => Math.min(255, v + 40))), 46);
    Sound.play('ultCharge'); G.flashScreen(H.W.col, .25); Input.rumble(.5, .5, 200);
  }
  function startArt(H) {
    const k = H.weapon, T = TECHS[k], G = H.game;
    H.stamina -= 30; H.staminaT = .8; H.artCd = 5;
    H.blocking = false;
    H.art = { k, t: 0, id: ++H.swing, x0: H.x, y0: H.y, n: 0 };
    H.atk = { kind: 'art', t: 0, dur: 99, id: H.art.id, hitDone: new Set(), heavy: true, crit: false };
    shout(H, T);
    if (k === 'chakram') { A.orbit = { t: 0 }; H.art.dur = .35; }
    if (k === 'bow') { H.art.dur = .45; }
    if (k === 'staff') { H.art.dur = 1.3; }
    if (k === 'sword') { H.vy = -820; H.onGround = false; H.art.dur = 1.6; }
    if (k === 'spear') { H.art.dur = .9; }
    if (k === 'hammer') { H.art.dur = 1.1; }
    if (k === 'gauntlet') { H.art.dur = .8; H.inv = .5; }
    if (k === 'scythe') { H.art.dur = .9; H.inv = .4; }
  }
  function endArt(H) { H.art = null; if (H.atk && H.atk.kind === 'art') H.atk = null; }
  function updateArt(H, dt) {
    const R0 = H.art, G = H.game, f = H.face, k = R0.k; R0.t += dt; const t = R0.t;
    const dmgB = H.W.dmg[H.W.dmg.length - 1];
    if (H.atk) H.atk.t = t;
    H.ctrlLock = Math.max(H.ctrlLock, .06); // durante la técnica, el movimiento lo lleva la técnica
    if (k === 'sword') {
      // sube girando, luego picado y onda de choque
      if (!R0.dive) { H.vx = f * 60; if (chance(.9)) FX.trail(H.x + Math.cos(t * 30) * 46, H.y - 30 + Math.sin(t * 30) * 30, H.W.col, 6); if (H.vy > -40 || t > .6) { R0.dive = 1; H.vy = 1500; Sound.play('whoosh'); G.slow(.4, .12); } }
      else { if (chance(.9)) FX.afterimage(H.snapshot()); if (H.onGround && !R0.boom) { R0.boom = 1; FX.slam(H.x, H.y, 1.6); Sound.play('slam', 1.4); G.shake(12, .4); G.areaDamage(H.x, H.y - 20, 150, dmgB * 1.5, { up: true, kb: 420, heavy: true }); FX.ring(H.x, H.y - 10, H.W.col, 160, .5, true); R0.t = Math.max(R0.t, R0.dur - .25); } }
    } else if (k === 'spear') {
      H.vx = f * 30; H.ctrlLock = .1;
      if (t > R0.n * .085 && R0.n < 10) { R0.n++; H.art.stab = 1; Sound.play('swing'); const sx = H.x + f * R(70, 140), gy = G.world.groundY(sx); FX.splash(sx, isFinite(gy) ? gy : H.y, 'water', .5); FX.trail(H.x + f * 110, H.y - 36 + R(-14, 14), [120, 220, 255], 8); H.atk.id = ++H.swing; }
    } else if (k === 'hammer') {
      H.vx = 0; H.ctrlLock = .1;
      if (t > .2 && !R0.slam) { R0.slam = 1; FX.slam(H.x + f * 50, H.y, 1.6); Sound.play('slam', 1.4); G.shake(12, .4); R0.cx = H.x + f * 50; }
      if (R0.slam && t > .25 + R0.n * .1 && R0.n < 7) {
        R0.n++; const x = R0.cx + f * R0.n * 70, gy = G.world.groundY(x);
        if (isFinite(gy) && Math.abs(gy - H.y) < 80) { FX.embers(x, gy - 4, 16, 380); FX.chunks(x, gy - 4, [90, 60, 50], 4, 300, .7); FX.decal(x, gy, 'crack', 30); FX.decal(x, gy, 'scorch', 20); G.areaDamage(x, gy - 40, 60, dmgB * .7, { up: true, kb: 300, armor: 2.5 }); Sound.play('explode'); G.shake(5, .15); }
      }
    } else if (k === 'gauntlet') {
      if (t < .28) { H.vx = f * 1100; H.vy = 0; if (chance(.95)) FX.afterimage(H.snapshot()); FX.sparks(H.x, H.y - 34, [255, 240, 140], 3, -f, 300); }
      else { H.vx *= .8; if (!R0.chain) { R0.chain = 1; let last = { x: H.x, y: H.y - 34 }; const hitS = new Set(); for (let i = 0; i < 5; i++) { const e = G.nearestEnemy(last.x, last.y, 360, 0); if (!e || hitS.has(e)) break; hitS.add(e); G.lightning(last.x, last.y, e.x, e.y - e.h / 2); e.inv = 0; e.hurt(dmgB * 1.4, Math.sign(e.x - H.x) || 1, { kb: 300, heavy: true, shock: 1 }); last = { x: e.x, y: e.y - e.h / 2 }; } G.flashScreen([255, 250, 170], .4); G.shake(8, .3); } }
    } else if (k === 'scythe') {
      H.vx = f * 420; if (chance(.9)) FX.afterimage(H.snapshot()); if (chance(.8)) FX.trail(H.x + Math.cos(t * 28) * 70, H.y - 34 + Math.sin(t * 28) * 34, H.W.col, 7);
      if (Math.floor(t / .12) > R0.n) { R0.n++; H.atk.id = ++H.swing; Sound.play('reap'); }
    } else if (k === 'bow') {
      if (t > .25 && !R0.shot) { R0.shot = 1; shoot({ kind: 'bigarrow', x: H.x + f * 30, y: H.y - 40, vx: f * 1300, vy: -40, dmg: dmgB * 2, r: 14, life: 1, pierce: 1, heavy: 1, kb: 420 }); Sound.play('twang', true); G.shake(6, .2); H.vx = -f * 260; }
    } else if (k === 'staff') {
      H.vx = 0; H.ctrlLock = .1;
      if (t > .15 + R0.n * .38 && R0.n < 3) {
        R0.n++; Sound.play('zap'); G.flashScreen([180, 220, 255], .2);
        for (const e of G.enemies) if (!e.dead && Math.abs(e.x - H.x) < 420 && Math.abs(e.y - H.y) < 260) { G.lightning(e.x + R(-40, 40), e.y - 400, e.x, e.y - e.h / 2); e.inv = 0; e.hurt(dmgB * .9, Math.sign(e.x - H.x) || 1, { kb: 140, shock: 1 }); }
        if (G.boss && !G.boss.dead) { const v = G.boss.vulnerable()[0]; if (v) { G.lightning(v.x + v.w / 2, v.y - 300, v.x + v.w / 2, v.y + v.h / 2); G.boss.hurt(dmgB, 1, { x: v.x + v.w / 2, y: v.y + v.h / 2 }, v); } }
      }
    }
    if (t >= R0.dur) endArt(H);
  }
  function artBoxes(H) {
    const R0 = H.art, k = R0.k, dmgB = H.W.dmg[H.W.dmg.length - 1], out = [], f = H.face, id = H.atk ? H.atk.id : 0;
    if (k === 'sword' && !R0.dive) out.push({ x: H.x - 70, y: H.y - 110, w: 140, h: 120, dmg: dmgB * .8, kb: 120, up: 1, multi: .14 });
    if (k === 'sword' && R0.dive) out.push({ x: H.x - 40, y: H.y - 60, w: 80, h: 80, dmg: dmgB, kb: 200 });
    if (k === 'spear') out.push({ x: f > 0 ? H.x : H.x - 150, y: H.y - 50, w: 150, h: 34, dmg: dmgB * .45, kb: 90, pierce: 1 });
    if (k === 'gauntlet' && R0.t < .28) out.push({ x: H.x - 40, y: H.y - 70, w: 80, h: 70, dmg: dmgB * 1.2, kb: 380, heavy: 1, shock: 1 });
    if (k === 'scythe') out.push({ x: H.x - 100, y: H.y - 100, w: 200, h: 110, dmg: dmgB * .6, kb: 220 });
    for (const b of out) { b.id = id; b.heavy = true; }
    return out;
  }

  /* ================= DIBUJO DE LAS ARMAS NUEVAS ================= */
  const dw0 = drawWeapon;
  drawWeapon = function (g, h, x, y, a, noFx) {
    const W = h.weapon; if (!NEW.has(W)) return dw0(g, h, x, y, a, noFx);
    const col = WEAPONS[W].col, t = h.game.rt;
    g.save(); g.translate(x, y); g.rotate(a);
    if (W === 'bow') {
      // el arco se sostiene en vertical (perpendicular a la mano)
      g.strokeStyle = '#6a4424'; g.lineWidth = 3.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-2, -26); g.quadraticCurveTo(14, 0, -2, 26); g.stroke();
      g.strokeStyle = rgba(col); g.lineWidth = 1.4; g.beginPath(); g.moveTo(1, -16); g.quadraticCurveTo(9, 0, 1, 16); g.stroke();
      const pull = h.atk && h.atk.toFire ? 10 : 0;
      g.strokeStyle = 'rgba(240,240,230,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-2, -26); g.lineTo(-2 - pull, 0); g.lineTo(-2, 26); g.stroke();
      g.fillStyle = '#c9a23a'; g.fillRect(4, -3, 5, 6);
    } else if (W === 'scythe') {
      g.fillStyle = '#3a2a3a'; g.fillRect(-26, -2.2, 80, 4.4);
      g.fillStyle = '#c9a23a'; g.fillRect(46, -3.5, 6, 7);
      const gr = g.createLinearGradient(50, -30, 80, 10); gr.addColorStop(0, '#f4f0ff'); gr.addColorStop(1, '#8a78c8');
      g.fillStyle = gr; g.beginPath(); g.moveTo(52, -2); g.quadraticCurveTo(70, -34, 30, -42); g.quadraticCurveTo(62, -24, 46, 2); g.closePath(); g.fill();
      g.strokeStyle = rgba(col, .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(50, -6); g.quadraticCurveTo(62, -26, 36, -36); g.stroke();
    } else if (W === 'chakram') {
      if ((h.discs || 0) < 1 || (h.atk && h.atk.heavy && (h.discs || 0) < 2)) { g.translate(8, 0); g.rotate(t * 3); drawDisc(g, .9); }
    } else if (W === 'staff') {
      g.fillStyle = '#4a3a5a'; g.fillRect(-30, -2.2, 76, 4.4);
      g.strokeStyle = '#c9a23a'; g.lineWidth = 1.6; g.beginPath(); g.arc(50, 0, 7, 0, TAU); g.stroke();
      g.fillStyle = '#dff2ff'; g.beginPath(); g.moveTo(50, -9); g.lineTo(56, 0); g.lineTo(50, 9); g.lineTo(44, 0); g.fill();
      g.globalCompositeOperation = 'lighter'; glowAt(g, col, 50, 0, 16 + Math.sin(t * 6) * 3, .7);
    }
    g.restore();
    // estela de la guadaña
    const atk = noFx ? null : h.atk;
    if (W === 'scythe' && atk && atk.kind === 'combo') {
      const p = atk.t / atk.dur; if (p > .2 && p < .62) {
        g.save(); g.globalCompositeOperation = 'lighter'; const sd = h.combo % 2 === 0 ? 1 : -1, r = 88, k = (p - .2) / .42;
        const a0 = sd > 0 ? -2.6 : 1.3, a1 = lerp(a0, sd > 0 ? 1.3 : -2.6, Math.min(1, k * 1.5));
        const gr2 = g.createRadialGradient(6, -32, r * .4, 6, -32, r); gr2.addColorStop(0, 'rgba(160,120,255,0)'); gr2.addColorStop(.85, rgba(col, .9)); gr2.addColorStop(1, 'rgba(255,255,255,.95)');
        g.globalAlpha = .7 * (1 - k * .5); g.fillStyle = gr2; g.beginPath(); g.arc(6, -32, r, Math.min(a0, a1), Math.max(a0, a1)); g.arc(6, -32, r * .5, Math.max(a0, a1), Math.min(a0, a1), true); g.fill();
        g.restore();
      }
    }
  };
  // posturas de brazos para las armas nuevas
  const ap0 = armPose;
  armPose = function (h, t) {
    const ap = ap0(h, t), W = h.weapon, a = h.atk;
    if (h.art) {
      const k = h.art.k;
      if (k === 'spear' || k === 'gauntlet') { ap.wa = 0; ap.hx = 18 + Math.sin(t * 60) * 8; ap.hy = -34; }
      else if (k === 'sword' || k === 'scythe') { ap.wa = t * 30; ap.hx = 10; ap.hy = -34; }
      else if (k === 'hammer') { ap.wa = h.art.slam ? .9 : -2.4; ap.hx = 10; ap.hy = h.art.slam ? -24 : -44; }
      else if (k === 'staff') { ap.wa = -1.57; ap.hx = 8; ap.hy = -58; }
      ap.ex = (3 + ap.hx) / 2 + 1; ap.ey = (-39 + ap.hy) / 2 + 3; return ap;
    }
    if (!NEW.has(W)) return ap;
    if (W === 'bow') {
      ap.wa = 0; ap.hx = 15; ap.hy = a && a.kind === 'up' ? -46 : -36;
      if (a && a.toFire) { ap.bx = 2; ap.by = -36; }
      if (!a && h.state !== 'run') { ap.hx = 10; ap.hy = -28; ap.wa = .3; }
    } else if (W === 'staff') {
      if (a && a.kind !== 'down') { ap.wa = a.kind === 'up' ? -1.4 : -.25; ap.hx = 15; ap.hy = -40; }
      else if (!a) { ap.wa = -1.45; ap.hx = 10; ap.hy = -30; }
    } else if (W === 'chakram') {
      if (a && a.kind !== 'down') { const p = clamp(a.t / a.dur, 0, 1); ap.wa = 0; ap.hx = lerp(-6, 20, Math.min(1, p * 3)); ap.hy = -38; }
    }
    ap.ex = (3 + ap.hx) / 2 + 1; ap.ey = (-39 + ap.hy) / 2 + 3;
    return ap;
  };

  /* ================= PALABRAS DE PODER (DEFINITIVOS) ================= */
  const DUR = { bow: 3.1, scythe: 3.0, chakram: 2.9, staff: 3.1 };
  const su0 = Game.prototype.startUltCinematic;
  Game.prototype.startUltCinematic = function (weapon, power) {
    su0.call(this, weapon, power);
    if (NEW.has(weapon) && this.cinematic) { const C = this.cinematic; C.dur = DUR[weapon]; C.y0 = this.hero.y; C.x0 = this.hero.x; C.fx = []; }
  };
  const uc0 = Game.prototype.updateCinematic;
  Game.prototype.updateCinematic = function (dt) {
    const C = this.cinematic; if (!C || !NEW.has(C.type) || C.kind === 'timestop') return uc0.call(this, dt);
    const H = this.hero, c = this.cam; C.t += dt; const t = C.t, VW = this.VW, T = C.targets.filter(e => !e.dead);
    const sx = x => x, top = c.y;
    if (C.type === 'bow') {
      // salta al cielo nocturno, una constelación une a los enemigos y llueven estrellas
      if (t < .55) H.y = lerp(C.y0, C.y0 - 230, easeOut(t / .55));
      if (t > .6 && !C.stars) { C.stars = T.slice(0, 10).map((e, i) => ({ x: e.x, y: e.y - e.h / 2, sx: e.x + R(-60, 60), sy: top + R(60, 200), t0: .6 + i * .08 })); Sound.play('ultCharge'); }
      if (t > 1.35 && t < 2.3 && chance(.95)) { const tgt = pick(C.stars || [{ x: H.x + R(-300, 300), y: H.y }]); C.fx.push({ x: tgt.x + R(-80, 80) - 240, y: top - 40, tx: tgt.x + R(-20, 20), ty: tgt.y, t: 0 }); }
      for (const s of C.fx) { s.t += dt; if (!s.done && s.t > .28) { s.done = 1; FX.runeBurst(s.tx, s.ty, [220, 255, 200], 3); FX.sparks(s.tx, s.ty, [230, 255, 220], 5, 0, 300); if (chance(.3)) Sound.play('zap'); } }
      if (t > 2.35 && !C.boom) { C.boom = 1; this.ultDamage(150 * C.power); this.flashScreen([220, 255, 210], .9); this.shake(16, .6); FX.text(H.x, C.y0 - 200, 'STARFALL!', '#d8ffc8', 80); for (const s of C.stars || []) FX.slam(s.x, s.y + 20, .7); }
      if (t > 2.4) H.y = lerp(H.y, C.y0, Math.min(1, dt * 10));
    } else if (C.type === 'scythe') {
      // eclipse: la luna tapa el sol y Lio cruza la pantalla con medias lunas gigantes
      if (t > .7 && t < 2.0 && Math.floor((t - .7) / .2) >= C.fx.length) {
        const i = C.fx.length, tgt = T.length ? T[i % T.length] : null, x = tgt ? tgt.x : H.x + (i % 2 ? 200 : -200), y = tgt ? tgt.y - tgt.h / 2 : H.y - 60;
        C.fx.push({ x, y, a: R(-.9, .9) + (i % 2 ? Math.PI : 0), t: 0 }); FX.afterimage(H.snapshot()); H.x = x - (i % 2 ? -1 : 1) * 60; H.face = i % 2 ? -1 : 1; Sound.play('reap'); FX.hit(x, y, 1, [220, 200, 255], true);
      }
      for (const s of C.fx) s.t += dt;
      if (t > 2.05 && !C.boom) { C.boom = 1; H.x = C.x0; H.y = C.y0; this.ultDamage(160 * C.power); this.flashScreen([235, 220, 255], 1); this.shake(18, .7); FX.text(H.x, H.y - 180, 'ECLIPSE!', '#e6d8ff', 86); Sound.play('ultFire'); }
    } else if (C.type === 'chakram') {
      // ocho discos forman un mandala solar y luego se lanzan contra todos
      if (t > .25 && !C.discs) { C.discs = []; for (let i = 0; i < 8; i++) C.discs.push({ a: i * TAU / 8, r: 0, x: H.x, y: H.y - 40, tgt: T.length ? T[i % T.length] : null, phase: 0 }); Sound.play('whirr'); }
      if (C.discs) for (const d of C.discs) {
        if (t < 1.1) { d.r = Math.min(140, d.r + dt * 300); d.a += dt * 6; d.x = H.x + Math.cos(d.a) * d.r; d.y = H.y - 60 + Math.sin(d.a) * d.r * .7; }
        else if (t < 2.1) { const e = d.tgt; const tx = e ? e.x + Math.cos(t * 9 + d.a) * 40 : H.x + Math.cos(d.a + t * 4) * 260, ty = e ? e.y - e.h / 2 + Math.sin(t * 9 + d.a) * 30 : H.y - 60; d.x = lerp(d.x, tx, Math.min(1, dt * 9)); d.y = lerp(d.y, ty, Math.min(1, dt * 9)); if (chance(.25)) { FX.sparks(d.x, d.y, [255, 210, 110], 4, 0, 260); if (chance(.3)) Sound.play('crit'); } }
        else { d.x = lerp(d.x, H.x, Math.min(1, dt * 8)); d.y = lerp(d.y, H.y - 60, Math.min(1, dt * 8)); }
        FX.trail(d.x, d.y, [255, 200, 90], 6);
      }
      if (t > 2.2 && !C.boom) { C.boom = 1; this.ultDamage(150 * C.power); this.flashScreen([255, 230, 150], 1); this.shake(16, .6); FX.text(H.x, H.y - 180, 'DANCING SUN!', '#ffe08a', 82); FX.ring(H.x, H.y - 60, [255, 220, 120], 420, .7); FX.slam(H.x, H.y, 1.8); }
    } else if (C.type === 'staff') {
      // ojo del huracán: un tornado eleva a los enemigos entre rayos y luego los estrella
      if (!C.lift) { C.lift = T.slice(0, 10).map(e => ({ e, y0: e.y, x0: e.x })); }
      const k = clamp((t - .6) / .9, 0, 1);
      for (const L of C.lift) {
        if (t < 2.05) { L.e.y = L.y0 - easeInOut(k) * (180 + (L.x0 % 60)); L.e.x = lerp(L.x0, H.x + Math.sin(t * 6 + L.x0) * 70, easeInOut(k) * .7); }
        if (t > 1.1 && t < 2 && chance(.08)) { this.lightning(L.e.x + R(-30, 30), top - 20, L.e.x, L.e.y - L.e.h / 2); FX.hit(L.e.x, L.e.y - L.e.h / 2, 1, [200, 230, 255], true); }
      }
      if (t > .4 && t < 2.2 && chance(.6)) FX.spawnRaw({ t: 'dust', x: H.x + R(-90, 90), y: H.y - R(0, 30), vx: R(-60, 60), vy: -R(200, 400), g: 0, drag: .5, max: 1, s: 6, s1: 20, col: [170, 180, 200], a: .4 });
      if (t > 2.05 && !C.boom) { C.boom = 1; for (const L of C.lift) { L.e.y = L.y0 - 40; } this.ultDamage(160 * C.power); this.flashScreen([200, 230, 255], 1); this.shake(20, .8); FX.text(H.x, H.y - 200, 'EYE OF THE STORM!', '#cfe8ff', 72); Sound.play('slam', 2); for (const L of C.lift) FX.slam(L.e.x, L.y0, 1); }
    }
    if (t >= C.dur) { this.cinematic = null; this.cam.tz = 1; H.inv = .8; H.vy = 0; UI.ultBanner(null); if (C.type === 'bow') H.y = C.y0; }
  };
  const dco0 = Game.prototype.drawCinematicOverlay;
  Game.prototype.drawCinematicOverlay = function (g) {
    const C = this.cinematic; if (!C || !NEW.has(C.type)) return dco0.call(this, g);
    const VW = this.VW, t = C.t, c = this.cam, H = this.hero, k = Math.min(1, t * 4, (C.dur - t) * 4);
    // tinte de ambiente propio de cada definitivo
    const tint = { bow: [10, 14, 40, .55], scythe: [20, 8, 30, .6], chakram: [60, 30, 0, .25], staff: [20, 30, 50, .45] }[C.type];
    g.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${tint[3] * k * (C.boom ? .5 : 1)})`; g.fillRect(0, 0, VW, VH);
    g.save(); g.translate(-c.x, -c.y);
    if (C.type === 'bow') {
      // estrellas de fondo y constelación
      g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { g.globalAlpha = (.3 + .7 * Math.abs(Math.sin(t * 3 + i))) * k; g.fillRect(c.x + hash1(i) * VW, c.y + hash1(i * 5) * VH * .7, 2, 2); }
      g.globalAlpha = k;
      if (C.stars) {
        g.strokeStyle = 'rgba(200,255,200,.7)'; g.lineWidth = 2; g.beginPath(); let first = true;
        for (const s of C.stars) { if (t < s.t0) continue; if (first) { g.moveTo(s.sx, s.sy); first = false; } else g.lineTo(s.sx, s.sy); } g.stroke();
        g.globalCompositeOperation = 'lighter';
        for (const s of C.stars) if (t >= s.t0) { glowAt(g, [200, 255, 200], s.sx, s.sy, 30, .9); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(s.sx + Math.cos(a) * r, s.sy + Math.sin(a) * r); } g.fill(); g.strokeStyle = 'rgba(200,255,200,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s.sx, s.sy); g.lineTo(s.x, s.y); g.stroke(); }
        g.globalCompositeOperation = 'source-over';
      }
      g.globalCompositeOperation = 'lighter';
      for (const s of C.fx) if (!s.done) { const p = s.t / .28, x = lerp(s.x, s.tx, p), y = lerp(s.y, s.ty, p); const gr = g.createLinearGradient(x - 60, y - 90, x, y); gr.addColorStop(0, 'rgba(200,255,200,0)'); gr.addColorStop(1, 'rgba(240,255,230,.95)'); g.strokeStyle = gr; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 60, y - 90); g.lineTo(x, y); g.stroke(); glowAt(g, [220, 255, 210], x, y, 14, .9); }
    } else if (C.type === 'scythe') {
      // la luna eclipsa al sol
      const mx = c.x + VW / 2, my = c.y + 150, e = clamp((t - .1) / .6, 0, 1);
      g.globalAlpha = k; g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 240, 200], mx, my, 160 + (C.boom ? 200 : 0), .8);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(mx, my, 60, 0, TAU); g.fill();
      g.fillStyle = '#120c1c'; g.beginPath(); g.arc(mx + (1 - e) * 140, my, 61, 0, TAU); g.fill();
      if (e >= 1) { g.strokeStyle = 'rgba(255,240,210,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(mx, my, 63, 0, TAU); g.stroke(); }
      // medias lunas gigantes
      g.globalCompositeOperation = 'lighter';
      for (const s of C.fx) { const a = Math.max(0, 1 - s.t / .7); if (a <= 0) continue; g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.globalAlpha = a; const gr = g.createLinearGradient(-200, 0, 200, 0); gr.addColorStop(0, 'rgba(150,110,255,0)'); gr.addColorStop(.6, 'rgba(220,200,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 60, 220, -2.3, -.84); g.arc(0, 110, 230, -.9, -2.24, true); g.fill(); g.restore(); }
    } else if (C.type === 'chakram') {
      g.globalCompositeOperation = 'lighter';
      if (C.discs) {
        if (t < 1.15) { g.strokeStyle = `rgba(255,210,120,${.6 * k})`; g.lineWidth = 2; g.beginPath(); C.discs.forEach((d, i) => { const n = C.discs[(i + 3) % 8]; g.moveTo(d.x, d.y); g.lineTo(n.x, n.y); }); g.stroke(); glowAt(g, [255, 210, 110], H.x, H.y - 60, 150, .5 * k); }
        for (const d of C.discs) { g.save(); g.translate(d.x, d.y); g.rotate(t * 26); drawDisc(g, 1.6); glowAt(g, [255, 190, 80], 0, 0, 34, .7); g.restore(); }
      }
      if (C.boom) { const p = clamp((t - 2.2) / .6, 0, 1); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.strokeStyle = `rgba(255,220,140,${(1 - p) * .8})`; g.lineWidth = 6; g.beginPath(); g.moveTo(H.x + Math.cos(a) * 60, H.y - 60 + Math.sin(a) * 60); g.lineTo(H.x + Math.cos(a) * (120 + p * 600), H.y - 60 + Math.sin(a) * (120 + p * 600)); g.stroke(); } }
    } else if (C.type === 'staff') {
      // embudo del tornado
      const grow = clamp((t - .3) / .6, 0, 1) * (C.boom ? Math.max(0, 1 - (t - 2.05) * 2) : 1);
      if (grow > 0) for (let i = 0; i < 14; i++) {
        const yy = H.y - i * 34, w = (20 + i * 14) * grow, ph = t * 9 + i * .8;
        g.strokeStyle = `rgba(210,225,240,${.5 * grow})`; g.lineWidth = 5;
        g.beginPath(); g.ellipse(H.x + Math.sin(t * 2 + i * .3) * i * 2, yy, w, 8 + i * .8, 0, ph % TAU, (ph % TAU) + 4.2); g.stroke();
      }
      g.globalCompositeOperation = 'lighter'; glowAt(g, [180, 220, 255], H.x, H.y - 200, 220, .25 * k);
    }
    g.restore();
    // franjas de cine
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, 70 * k); g.fillRect(0, VH - 70 * k, VW, 70 * k);
  };

  /* ================= BUCLE Y DIBUJO ================= */
  const up0 = Game.prototype.update;
  Game.prototype.update = function (dt) {
    up0.call(this, dt);
    if (this.mode !== 'play' || UI.modalOpen() || this.freezeT > 0 || this.cinematic) return;
    updateProj(this, dt * this.timeScale);
  };
  const dh0 = Game.prototype.drawHeroAll;
  Game.prototype.drawHeroAll = function (g) { dh0.call(this, g); drawProj(g, this); };
  const ll0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { A.proj = []; A.orbit = null; if (this.hero) { this.hero.discs = 0; this.hero.art = null; } return ll0.call(this, ref); };

  return { A, TECHS, owned, buyTech(k) {
    const d = Store.data, T = TECHS[k]; d.techs = d.techs || {};
    if (d.techs[k]) return 'own';
    if (!d.unlocked.weapons[k]) return 'weapon';
    if ((d.ep || 0) < T.ep) return 'ep';
    if ((d.coins || 0) < T.coins) return 'coins';
    d.coins -= T.coins; d.techs[k] = 1; Store.save(true); return 'ok';
  } };
})();
