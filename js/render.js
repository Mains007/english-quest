"use strict";
/* =====================================================================
   RENDER: cielo → fondos (paralaje) → mundo → líquidos con reflejos →
   entidades → partículas → primer plano → luz dinámica → brillos →
   textos cómic, etiquetas bilingües, postprocesado.
   ===================================================================== */
const AMBIENT = {
  beach(G, c, dt) { if (chance(dt * 4)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(100, 600), vx: R(10, 30), vy: R(-6, 6), g: 0, max: R(3, 6), s: R(1, 2), add: 1 }); if (chance(dt * 2)) { const x = c.x + R(0, G.VW), y = G.world.groundY(x); if (isFinite(y)) FX.spawnRaw({ t: 'grain', x, y: y - 2, vx: R(60, 160), vy: R(-30, -5), g: 120, max: 1.2, s: 1.4, col: [240, 220, 170] }); } },
  tidecave(G, c, dt) { if (chance(dt * 5)) { const x = c.x + R(0, G.VW), cy = G.world.ceilY(x); if (cy > c.y - 50) FX.spawnRaw({ t: 'drop', x, y: cy + 4, vx: 0, vy: 0, g: 1200, max: 2, s: 1.6, col: [200, 240, 255] }); } if (chance(dt * 3)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: R(-5, 5), vy: R(-8, 0), g: 0, max: R(3, 5), s: 1.4, add: 1 }); },
  cliff(G, c, dt) { if (chance(dt * 5)) FX.spawnRaw({ t: 'leaf', x: c.x - 20, y: c.y + R(50, 600), vx: R(80, 180), vy: R(-20, 30), g: 20, drag: .2, max: 9, s: R(1.6, 2.6), col: pick([[255, 170, 200], [255, 220, 230], [255, 200, 120]]), rot: R(0, 6), vr: R(-6, 6) }); },
  forest(G, c, dt) { if (chance(dt * 3)) FX.spawnRaw({ t: 'leaf', x: c.x + R(0, G.VW), y: c.y - 10, vx: R(-20, 40), vy: R(30, 70), g: 30, drag: .6, max: 10, s: R(2, 3.5), col: pick([[96, 150, 60], [140, 170, 60], [200, 150, 60]]), rot: R(0, 6), vr: R(-5, 5) }); if (chance(dt * 6)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: R(-6, 6), vy: R(-8, 2), g: 0, max: R(3, 6), s: R(1, 2), add: 1 }); if (chance(dt * 2)) FX.spawnRaw({ t: 'firefly', x: c.x + R(0, G.VW), y: c.y + R(250, 650), vx: R(-20, 20), vy: R(-15, 15), g: 0, max: R(4, 7), s: R(0, 9), col: [220, 255, 120], add: 1 }); },
  mushroom(G, c, dt) { if (chance(dt * 8)) FX.spawnRaw({ t: 'spore', x: c.x + R(0, G.VW), y: c.y + R(300, 720), vx: R(-10, 10), vy: R(-30, -10), g: -4, drag: .2, max: R(4, 7), s: R(1.5, 3), col: pick([[120, 255, 230], [230, 140, 255], [255, 170, 230]]) }); if (chance(dt * 3)) FX.spawnRaw({ t: 'firefly', x: c.x + R(0, G.VW), y: c.y + R(200, 650), vx: R(-20, 20), vy: R(-15, 15), g: 0, max: R(4, 7), s: R(0, 9), col: [150, 255, 230], add: 1 }); },
  ruins(G, c, dt) { if (chance(dt * 6)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: R(-8, 8), vy: R(-6, 6), g: 0, max: R(3, 6), s: R(1, 2), add: 1 }); if (chance(dt * 1.5)) FX.spawnRaw({ t: 'leaf', x: c.x + R(0, G.VW), y: c.y - 10, vx: R(10, 50), vy: R(30, 60), g: 30, drag: .6, max: 10, s: 2.4, col: [130, 150, 70], rot: 0, vr: 4 }); },
  cave(G, c, dt) { if (chance(dt * 4)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: R(-4, 4), vy: R(-4, 4), g: 0, max: R(3, 6), s: R(1, 1.8), add: 1 }); if (chance(dt * 2)) { const x = c.x + R(0, G.VW), cy = G.world.ceilY(x); if (cy > c.y - 50) FX.spawnRaw({ t: 'drop', x, y: cy + 4, vx: 0, vy: 0, g: 1200, max: 2, s: 1.4, col: [190, 210, 255] }); } },
  lava(G, c, dt) { if (chance(dt * 14)) FX.spawnRaw({ t: 'ember', x: c.x + R(0, G.VW), y: c.y + VH + 10, vx: R(-20, 20), vy: R(-120, -50), g: -10, drag: .2, max: R(3, 6), s: R(1, 2.6) }); if (chance(dt * 5)) FX.spawnRaw({ t: 'leaf', x: c.x + R(0, G.VW), y: c.y - 10, vx: R(-10, 10), vy: R(20, 40), g: 10, drag: .4, max: 12, s: R(1.4, 2.2), col: [80, 72, 70], rot: R(0, 6), vr: R(-3, 3) }); },
  core(G, c, dt) { AMBIENT.lava(G, c, dt); AMBIENT.lava(G, c, dt); },
  sky(G, c, dt) { if (chance(dt * 3)) FX.spawnRaw({ t: 'leaf', x: c.x + R(0, G.VW), y: c.y - 10, vx: R(-20, 40), vy: R(20, 50), g: 10, drag: .4, max: 12, s: R(2.4, 3.4), col: [250, 250, 255], rot: R(0, 6), vr: R(-3, 3) }); if (chance(dt * 6)) FX.spawnRaw({ t: 'star', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: 0, vy: -10, g: 0, max: 1.2, s: 2, col: [255, 255, 255], rot: 0, vr: 3, add: 1 }); },
  castle(G, c, dt) { AMBIENT.lava(G, c, dt); },
  clockwork(G, c, dt) { if (chance(dt * 5)) FX.spawnRaw({ t: 'mote', x: c.x + R(0, G.VW), y: c.y + R(0, VH), vx: R(-6, 6), vy: R(-6, 6), g: 0, max: R(3, 6), s: R(1, 2), add: 1 }); if (chance(dt * 1)) FX.sparks(c.x + R(0, G.VW), c.y + R(100, 500), [255, 220, 140], 3, 0, 120); }
};
const WORLD_FONT_FALLBACK = '"Alegreya Sans", sans-serif';

Object.assign(Game.prototype, {
  ambientParticles(dt) { const f = AMBIENT[this.curBiome]; if (f) f(this, this.cam, dt * (Store.data.settings.reduced ? .4 : 1)); for (const l of this.world.liquids) { if (l.type === 'lava' && !this.effects.jelly && l.x1 > this.cam.x && l.x0 < this.cam.x + this.VW) { if (chance(dt * (l.x1 - l.x0) * .02)) FX.spawnRaw({ t: 'ember', x: R(l.x0, l.x1), y: l.curLevel - 4, vx: R(-12, 12), vy: R(-90, -35), g: -10, drag: .2, max: R(1.6, 3.4), s: R(1.2, 3) }); if (chance(dt * (l.x1 - l.x0) * .004)) { const x = R(l.x0, l.x1); FX.spawnRaw({ t: 'ldrop', x, y: l.curLevel, vx: R(-60, 60), vy: R(-220, -90), g: 900, max: .6, s: 2, col: [255, 170, 60], add: 1 }); if (l.surface) l.surface.splash(x, 3); Sound.play('bubble'); } } } },
  resize() {
    const iw = innerWidth, ih = innerHeight; let SC = ih / VH, VW = iw / SC;
    if (VW < 960) { VW = 960; SC = iw / 960; } if (VW > 2100) { VW = 2100; SC = iw / 2100; }
    this.SCALE = SC; this.VW = VW; this.RS = Math.min(SC * (devicePixelRatio || 1), 2);
    this.cv.width = Math.round(VW * this.RS); this.cv.height = Math.round(VH * this.RS);
    this.cv.style.width = VW * SC + 'px'; this.cv.style.height = VH * SC + 'px';
    this.lm = mk(Math.ceil(VW / 2), VH / 2); this.lg = this.lm.getContext('2d');
    this.vig = mk(VW, VH); const g = this.vig.getContext('2d'), gr = g.createRadialGradient(VW / 2, VH * .5, VH * .32, VW / 2, VH * .5, Math.max(VW, VH) * .78); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,4,10,.62)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  },
  render() {
    const g = this.ctx, RS = this.RS; g.setTransform(RS, 0, 0, RS, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (this.mode !== 'play' && this.mode !== 'paused') { this.renderMenuBg(g); return; }
    const c = this.cam, VW = this.VW, W = this.world, t = this.t, rt = this.rt;
    const z = W.biomeAt(c.x + VW / 2), A = z.a, Bk = z.b, mixT = z.t;
    // zoom alrededor del centro
    const zm = c.zoom * (1 + (c.pz || 0)); g.save(); if (zm !== 1) { g.translate(VW / 2, VH / 2); g.scale(zm, zm); g.translate(-VW / 2, -VH / 2); }
    const cx = c.x + c.sx + (c.kx || 0), cy = c.y + c.sy + (c.ky || 0);
    // ---- cielo y fondos
    const drawBG = (key, alpha) => {
      if (alpha <= 0) return; const L = buildBiomeLayers(key), B = BIOMES[key];
      const tileY = (f, oy) => clamp(-(TH - VH) * .62 - (cy - 0) * f * .5 + oy, VH - TH, 40);
      drawSky(g, key, VW, cx, cy, rt, alpha, tileY(.12, 0) + (B.sea ? B.sea.horizon : B.horizon || 560));
      const tile = (img, f, oy) => { const sx = ((cx * f) % TW + TW) % TW, y = tileY(f, oy); g.globalAlpha = alpha; for (let x = -sx; x < VW; x += TW) g.drawImage(img, x, y); return y; };
      const fy = tile(L.far, .12, 0);
      if (B.sea) drawSea(g, key, VW, fy + B.sea.horizon, rt, cx, alpha);
      tile(L.mid, .38, 30);
      g.globalAlpha = 1;
    };
    drawBG(A, 1); if (mixT > 0 && Bk !== A) drawBG(Bk, mixT);
    if (this.effects.lowgrav) { g.fillStyle = 'rgba(30,20,80,.35)'; g.fillRect(0, 0, VW, VH); for (let i = 0; i < 60; i++) { g.fillStyle = '#fff'; g.globalAlpha = .5 + .5 * Math.sin(rt * 2 + i); g.fillRect((hash1(i) * VW + rt * 10) % VW, hash1(i * 3) * VH * .6, 2, 2); } g.globalAlpha = 1; }
    // ---- mundo
    g.save(); g.translate(-cx, -cy);
    if (this.boss) this.boss.drawBack(g);
    for (const f of this.lavafalls) if (f.x > cx - 100 && f.x < cx + VW + 100) drawLavaFall(g, f.x, f.top, f.bot, f.w, t);
    // líquidos traseros (lava) antes del terreno
    for (const l of W.liquids) if (l.type === 'lava' && l.x1 > cx - 40 && l.x0 < cx + VW + 40) drawLava(g, Math.max(l.x0, cx - 20), Math.min(l.x1, cx + VW + 20), l.curLevel, t, Math.max(l.bottom, cy + VH + 20), { off: l.surface ? x => l.surface.at(x) : null, jelly: this.effects.jelly });
    { const iz = 1 / Math.min(1, zm || 1); W.drawTerrain(g, cx + VW / 2 - VW * iz / 2, VW * iz, cy + VH / 2 - VH * iz / 2, VH * iz); }
    for (const p of W.plats) if ((p.path || p.crumble || p.sink !== undefined) && !p.soft && !p.gone && p.x + p.w > cx && p.x < cx + VW) this.drawDynPlat(g, p);
    for (const p of W.plats) if (p.soft && p.x + p.w > cx - 50 && p.x < cx + VW + 50) (p.soft === 'cap' ? drawCapPlatform : drawCloudPlatform)(g, p, t);
    for (const b of this.bridges) b.draw(g);
    FX.drawDecals(g);
    const x0 = cx - 80, x1 = cx + VW + 80;
    Juice3.drawPuddles(g, this, x0, x1);
    for (const s of this.decor.seaweed) if (s.x > x0 && s.x < x1) drawSeaweed(g, s, t);
    for (const p of this.decor.palms) if (p.x > x0 - 200 && p.x < x1 + 200) drawPalm(g, p, t + (p.hitT && t - p.hitT < 1 ? Math.sin((t - p.hitT) * 30) * .3 : 0));
    for (const m of this.decor.mushrooms) if (m.x > x0 && m.x < x1) drawMushroom(g, m, t, m.col);
    for (const r of this.ropes) if (r.ax > x0 - 100 && r.ax < x1 + 100) r.draw(g);
    for (const v of this.decor.vines) if (v.x > x0 && v.x < x1) drawVine(g, v, t);
    for (const f of this.decor.flowers) if (f.x > x0 && f.x < x1) drawFlower(g, f, t);
    for (const o of this.objects) if (o.x > x0 - 200 && o.x < x1 + 200 && !(o instanceof Coin)) o.draw(g);
    for (const p of this.props) if (p.x > x0 && p.x < x1) p.draw(g);
    for (const f of this.fires) this.drawFire(g, f);
    Juice2.drawCritters(g, this);
    Juice.drawCorpses(g);
    for (const e of this.enemies) if (!e.dead && e.x > x0 - 100 && e.x < x1 + 100) Juice.drawEnemy(g, e, this);
    Juice.drawFront(g, this);
    if (this.boss) this.boss.draw(g);
    if (this.boss && typeof drawBossPhaseFX === 'function') drawBossPhaseFX(g, this.boss, this);
    if (typeof drawWarnings === 'function') drawWarnings(g, this);
    this.drawHeroAll(g);
    Juice3.drawPuddlesFront(g, this, x0, x1);
    Juice3.drawVortex(g);
    for (const o of this.objects) if (o instanceof Coin && o.x > x0 && o.x < x1) o.draw(g);
    for (const p of this.projectiles) this.drawProjectile(g, p);
    for (const w of this.waves) { g.fillStyle = 'rgba(255,240,200,.5)'; g.beginPath(); g.ellipse(w.x, w.y - 8, 18, 12, 0, 0, TAU); g.fill(); }
    // agua (translúcida, con reflejo) por delante del héroe
    g.restore();
    this.drawWaterReflections(g, cx, cy);
    g.save(); g.translate(-cx, -cy);
    for (const l of W.liquids) if (l.type === 'water' && l.x1 > cx - 40 && l.x0 < cx + VW + 40) drawWater(g, Math.max(l.x0, cx - 20), Math.min(l.x1, cx + VW + 20), l.curLevel, t, Math.max(l.bottom, cy + VH + 20), BIOMES[this.curBiome].sea ? [60, 180, 210] : [60, 150, 170], l.surface ? x => l.surface.at(x) : null);
    drawGrass(g, this.decor.grass.filter(b2 => b2.x > x0 && b2.x < x1), x0, x1, t, BIOMES[this.curBiome].grass, [this.hero, ...this.enemies.filter(e => !e.dead && Math.abs(e.x - this.hero.x) < 600)]);
    for (const o of this.objects) if (o.drawFront) o.drawFront(g);
    if (this.boss) this.boss.drawFront(g);
    FX.drawDebris(g); FX.drawNormal(g);
    for (const cl of this.clouds) { const a = (1 - cl.t / cl.life) * .45; const gr = g.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r); gr.addColorStop(0, rgba(cl.col, a)); gr.addColorStop(1, rgba(cl.col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(cl.x, cl.y, cl.r, 0, TAU); g.fill(); }
    for (const b of this.bubbles) { g.strokeStyle = `rgba(255,230,150,${.6 * (1 - b.t / b.life)})`; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,230,150,.08)'; g.fill(); g.fillStyle = 'rgba(255,240,180,.7)'; g.font = '700 14px Georgia'; g.textAlign = 'center'; g.fillText('SLOW', b.x, b.y - b.r - 6); }
    g.restore();
    // ---- primer plano (paralaje rápido)
    this.drawForeground(g, cx, cy, A);
    // ---- iluminación dinámica
    this.drawLighting(g, cx, cy, A, Bk, mixT);
    // ---- brillos aditivos
    g.save(); g.translate(-cx, -cy); g.globalCompositeOperation = 'lighter';
    W.drawEmissive(g, cx, VW, t);
    g.globalCompositeOperation = 'lighter';
    for (const l of W.liquids) if (l.type === 'lava' && l.x1 > cx && l.x0 < cx + VW) { const a = Math.max(l.x0, cx), b = Math.min(l.x1, cx + VW); const gr = g.createLinearGradient(0, l.curLevel - 150, 0, l.curLevel + 6); const J = this.effects.jelly; gr.addColorStop(0, J ? 'rgba(120,255,90,0)' : 'rgba(255,90,20,0)'); gr.addColorStop(.75, J ? 'rgba(140,255,110,.16)' : 'rgba(255,110,30,.22)'); gr.addColorStop(1, J ? 'rgba(220,255,200,.35)' : 'rgba(255,190,90,.45)'); g.fillStyle = gr; g.fillRect(a, l.curLevel - 150, b - a, 156); }
    for (const f of this.lavafalls) glowAt(g, [255, 130, 40], f.x, f.bot, 90, .8);
    for (const m of this.decor.mushrooms) if (m.x > x0 && m.x < x1) glowAt(g, m.col, m.x, m.y - 18 * m.s, 34 * m.s * (1 + .12 * Math.sin(t * 2 + m.ph)), .4);
    for (const f of this.decor.flowers) if (f.x > x0 && f.x < x1 && (this.curBiome === 'mushroom' || this.curBiome === 'cave')) glowAt(g, f.c, f.x, f.y - f.h, 10, .5);
    for (const o of this.objects) if (o.x > x0 - 200 && o.x < x1 + 200) o.drawGlow(g);
    for (const e of this.enemies) if (!e.dead && e.x > x0 && e.x < x1) e.drawGlow(g);
    if (this.boss) this.boss.drawGlow(g);
    this.hero.drawGlow(g);
    for (const p of this.projectiles) if (p.kind === 'fireball' || p.kind === 'rune' || p.kind === 'bubble' || p.kind === 'clockhand' || p.kind === 'orb' || p.kind === 'wave') glowAt(g, p.kind === 'fireball' ? [255, 130, 40] : p.kind === 'bubble' || p.kind === 'orb' ? [200, 240, 255] : p.kind === 'wave' ? [255, 60, 60] : p.kind === 'clockhand' ? [255, 220, 140] : (p.col || [150, 230, 255]), p.x, p.y, p.r * 4, .7);
    for (const f of this.fires) glowAt(g, [255, 130, 40], f.x, f.y - 10, f.w, .5 * (1 - f.t / f.life));
    if (this.bolts) { for (const b of this.bolts) { b.t += 1 / 60; g.globalAlpha = 1 - b.t / .25; g.strokeStyle = '#fff6b0'; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x0, b.y0); for (let i = 1; i < 8; i++) g.lineTo(lerp(b.x0, b.x1, i / 8) + R(-12, 12), lerp(b.y0, b.y1, i / 8) + R(-12, 12)); g.lineTo(b.x1, b.y1); g.stroke(); } this.bolts = this.bolts.filter(b => b.t < .25); g.globalAlpha = 1; }
    FX.drawAdditive(g);
    this.drawRays(g, cx, cy);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    FX.drawText(g);
    Juice2.drawLetters(g);
    this.drawBubbles(g);
    this.drawLabels(g);
    g.restore();
    g.restore();
    // ---- post
    if (this.cinematic && this.cinematic.kind === 'timestop' || (this.qActive && this.timeScale === 0 && this.boss && this.boss.st === 'frozen')) { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'hsl(0,0%,50%)'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(255,230,180,.12)'; g.fillRect(0, 0, VW, VH); }
    if (this.cinematic && this.cinematic.type === 'gauntlet' && !this.cinematic.boom) { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'hsl(0,0%,50%)'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    if (this.cinematic && this.cinematic.kind !== 'timestop') this.drawCinematicOverlay(g);
    if (this.hero.exposed > 0) { g.strokeStyle = `rgba(255,40,40,${.35 + Math.sin(rt * 10) * .15})`; g.lineWidth = 18; g.strokeRect(0, 0, VW, VH); }
    if (this.hero.hp < this.hero.maxHp * .25 && !this.hero.dead) { const a = .25 + Math.sin(rt * 5) * .12; const gr = g.createRadialGradient(VW / 2, VH / 2, VH * .3, VW / 2, VH / 2, VW * .7); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(160,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    g.drawImage(this.vig, 0, 0, VW, VH);
    if (this.flash.a > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(this.flash.col, this.flash.a * .5); g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    if (this.qActive) { g.fillStyle = 'rgba(8,6,16,.35)'; g.fillRect(0, 0, VW, VH); }
  },
  drawHeroAll(g) {
    const H = this.hero;
    if (H.giant) { g.save(); g.translate(H.x, H.y); g.scale(2, 2); g.translate(-H.x, -H.y); H.draw(g); g.restore(); } else H.draw(g);
    if (H.carry) drawQuestItem(g, H.carry.item, H.x, H.y - 80 + Math.sin(this.rt * 4) * 3, 1.2);
  },
  drawDynPlat(g, p) {
    const k = MATS[p.mat] || MATS.rock, sh = p.cr > 0 && !p.gone ? Math.sin(this.rt * 60) * 2 : 0;
    g.save(); g.translate(sh, 0);
    if (!p._c) { const H = Math.max(p.h || 26, p.w * .45) + 70; p._c = mk(p.w + 20, H); const cg = p._c.getContext('2d'); cg.translate(10 - p.x, -p.y + 4); platTint(this.world, p); paintPlatform(cg, p); if (p.cover) paintCover(cg, p.cover, p.x, p.x + p.w, () => p.y, p.x, p.x + p.w); }
    g.drawImage(p._c, p.x - 10, p.y - 4);
    if (p.sink !== undefined && p.sink > 1) { g.fillStyle = `rgba(255,120,40,${Math.min(.5, p.sink / 120)})`; g.fillRect(p.x, p.y + 4, p.w, 20); }
    g.restore();
  },
  drawFire(g, f) { const a = 1 - f.t / f.life; for (let i = 0; i < 6; i++) { const x = f.x - f.w / 2 + (i + .5) * f.w / 6, h = (14 + Math.sin(this.rt * 12 + i * 2) * 6) * a; g.fillStyle = `rgba(255,${120 + i * 15},40,${.8 * a})`; g.beginPath(); g.moveTo(x - 6, f.y); g.quadraticCurveTo(x, f.y - h * 2, x + 6, f.y); g.fill(); } },
  drawProjectile(g, p) {
    if (p.delay > 0) return;
    g.save(); g.translate(p.x, p.y);
    if (p.kind === 'arrow') { g.rotate(p.ang || 0); g.strokeStyle = '#8a5a30'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-18, 0); g.lineTo(10, 0); g.stroke(); g.fillStyle = '#ddd'; g.beginPath(); g.moveTo(10, -4); g.lineTo(18, 0); g.lineTo(10, 4); g.fill(); g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-24, -5); g.lineTo(-14, 0); g.lineTo(-24, 5); g.fill(); }
    else if (p.kind === 'fireball') { const gr = g.createRadialGradient(-2, -2, 1, 0, 0, p.r); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.5, '#ff9a2a'); gr.addColorStop(1, '#c8300c'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.r, 0, TAU); g.fill(); }
    else if (p.kind === 'bomb') { g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(0, 0, p.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(-3, -3, 3, 0, TAU); g.fill(); g.fillStyle = Math.sin(this.rt * 30) > 0 ? '#ff4a2a' : '#ffd040'; g.beginPath(); g.arc(3, -p.r - 2, 3, 0, TAU); g.fill(); }
    else if (p.kind === 'bubble') { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.fillStyle = 'rgba(160,220,255,.25)'; g.beginPath(); g.arc(0, 0, p.r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(-p.r * .35, -p.r * .35, p.r * .2, 0, TAU); g.fill(); }
    else if (p.kind === 'clockhand') { g.rotate(this.rt * 12); g.fillStyle = '#2a2018'; g.strokeStyle = '#c9a23a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -3); g.lineTo(14, 0); g.lineTo(-14, 3); g.closePath(); g.fill(); g.stroke(); }
    else if (p.kind === 'feather') { g.rotate(Math.atan2(p.vy, p.vx)); g.fillStyle = '#dfe8ff'; g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(0, -6, 14, 0); g.quadraticCurveTo(0, 6, -16, 0); g.fill(); g.strokeStyle = '#5a6aa8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-16, 0); g.lineTo(14, 0); g.stroke(); }
    else if (p.kind === 'orb') { const gr = g.createRadialGradient(0, 0, 1, 0, 0, p.r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#9be6ff'); gr.addColorStop(1, 'rgba(80,140,255,.2)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.r, 0, TAU); g.fill(); }
    else if (p.kind === 'wave') { g.scale(Math.sign(p.vx) || 1, 1); g.fillStyle = 'rgba(255,60,60,.85)'; g.beginPath(); g.moveTo(-10, 20); g.quadraticCurveTo(14, 0, -6, -34); g.quadraticCurveTo(26, -6, 6, 20); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,220,200,.9)'; g.beginPath(); g.moveTo(-2, 14); g.quadraticCurveTo(12, 0, 0, -22); g.quadraticCurveTo(16, -2, 4, 14); g.fill(); }
    else if (p.kind === 'bolt') { g.fillStyle = '#7a7e90'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + this.rt * 6; g.lineTo(Math.cos(a) * p.r, Math.sin(a) * p.r); } g.fill(); g.fillStyle = '#3a3e50'; g.beginPath(); g.arc(0, 0, p.r * .4, 0, TAU); g.fill(); }
    else if (p.kind === 'rune') { g.fillStyle = rgba(p.col || [150, 230, 255]); g.font = '700 22px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ᚱ', 0, 0); }
    g.restore();
  },
  drawWaterReflections(g, cx, cy) {
    // reflejo del mundo sobre el agua (franjas invertidas con ondulación)
    if (Store.data.settings.reduced) return;
    const RS = this.RS, cv = this.cv;
    for (const l of this.world.liquids) {
      if (l.type !== 'water' || l.x1 < cx || l.x0 > cx + this.VW) continue;
      const sx0 = Math.max(l.x0, cx) - cx, sx1 = Math.min(l.x1, cx + this.VW) - cx, sy = l.curLevel - cy;
      if (sy < 20 || sy > VH - 4) continue;
      const H = Math.min(90, VH - sy - 2, sy - 2);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .28;
      for (let k = 0; k < H; k += 3) {
        const off = Math.sin(this.rt * 3 + k * .25) * 3 * RS;
        g.drawImage(cv, sx0 * RS, (sy - k - 3) * RS, (sx1 - sx0) * RS, 3 * RS, sx0 * RS + off, (sy + k) * RS, (sx1 - sx0) * RS, 3 * RS);
      }
      g.restore(); g.setTransform(RS, 0, 0, RS, 0, 0);
    }
  },
  drawForeground(g, cx, cy, A) {
    const L = buildBiomeLayers(A), fg = L.fg; if (!fg.length) return;
    const f = 1.32, r = mulberry32(3);
    for (let i = 0; i < 40; i++) {
      const sp = fg[i % fg.length], x = i * 420 + r() * 200 - cx * f + (this.world.bounds.x0) ;
      const sx = ((x % (40 * 420)) + 40 * 420) % (40 * 420) - 300; if (sx > this.VW + 50 || sx + sp.w < -50) continue;
      const y = sp.top ? -10 : VH - sp.h * .55;
      if (sp.top && BIOMES[A].sky.length > 3 && !['tidecave', 'cave', 'lava', 'core'].includes(A)) continue;
      g.globalAlpha = .92; g.drawImage(sp.c, sx, y); g.globalAlpha = 1;
    }
  },
  drawLighting(g, cx, cy, A, Bk, t) {
    const B = BIOMES[A], B2 = BIOMES[Bk];
    let amb = mixc(B.ambient, B2.ambient, t);
    if (this.effects.lowgrav) amb = mixc(amb, [160, 150, 255], .3);
    const lw = this.lm.width, lh = this.lm.height, s = lw / this.VW, lg = this.lg;
    if (amb[0] > 245 && amb[1] > 245 && amb[2] > 240 && !this.hero.exposed) return;
    lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1; lg.fillStyle = rgba(amb); lg.fillRect(0, 0, lw, lh);
    lg.globalCompositeOperation = 'lighter';
    const L = (x, y, r, c, i) => { const sx = (x - cx) * s, sy = (y - cy) * s, rr = r * s; if (sx < -rr || sx > lw + rr || sy < -rr || sy > lh + rr) return; lg.globalAlpha = Math.min(1, i); lg.drawImage(tint(c), sx - rr, sy - rr, rr * 2, rr * 2); };
    for (const l of this.lights) { const f = l.pulse ? .85 + .15 * Math.sin(this.t * 2 + l.ph) : 1 + Math.sin(this.t * 9 + l.ph) * .06; L(l.x, l.liq ? l.liq.curLevel + 8 : l.y, l.r, l.c, l.i * f); }
    for (const rl of this.objects) if (rl instanceof RisingLava && rl.active) for (let x = rl.x; x < rl.x1; x += 80) L(x, rl.level, 280, [255, 110, 30], .9);
    const H = this.hero; if (!H.dead) { if (H.lanternPos) L(H.lanternPos[0], H.lanternPos[1], 240, [255, 200, 130], .9); else L(H.x, H.y - 30, 170, [220, 220, 255], .5); }
    for (const e of this.enemies) if (!e.dead && (e instanceof Jelly || e instanceof Slime || e instanceof Bat)) L(e.x, e.y - 15, 110, e instanceof Jelly ? [190, 140, 255] : [255, 130, 40], .6);
    for (const p of this.projectiles) if (p.kind === 'fireball' || p.kind === 'rune') L(p.x, p.y, 90, p.kind === 'fireball' ? [255, 130, 40] : [150, 220, 255], .7);
    for (const o of this.objects) if ((o instanceof Checkpoint && o.active) || o instanceof Shrine || o instanceof Letter || o instanceof Wonder || o instanceof Gate) L(o.x, o.y - 50, 140, o instanceof Gate ? [140, 220, 255] : [255, 220, 140], .5);
    for (const f of this.fires) L(f.x, f.y, 120, [255, 120, 40], .6);
    if (this.boss) { if (this.boss instanceof MagmaTitan) { const [hx, hy] = this.boss.headPos(); L(hx, hy, 500, [255, 120, 50], .8); for (const h of this.boss.hands) L(h.x, h.y, 260, [255, 120, 50], .5); } else L(this.boss.x, this.boss.y - 100, 400, [255, 230, 180], .5); }
    FX.lightsInto((x, y, r, c, i) => L(x, y, r, c, i));
    g.globalCompositeOperation = 'multiply'; g.drawImage(this.lm, 0, 0, this.VW, VH); g.globalCompositeOperation = 'source-over';
  },
  drawRays(g, cx, cy) {
    const B = BIOMES[this.curBiome]; if (!B.rays || Store.data.settings.reduced) return;
    for (let k = 0; k < 4; k++) {
      const bx = cx + ((k * 420 - cx * .3) % 1680 + 1680) % 1680 - 200, al = (.05 + .03 * Math.sin(this.rt * .5 + k));
      const gr = g.createLinearGradient(0, cy, 0, cy + VH); gr.addColorStop(0, `rgba(255,248,210,${al * 1.6})`); gr.addColorStop(1, 'rgba(255,248,210,0)'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(bx, cy - 20); g.lineTo(bx + 80, cy - 20); g.lineTo(bx + 300, cy + VH); g.lineTo(bx + 160, cy + VH); g.fill();
    }
  },
  drawBubbles(g) {
    // bocadillos de diálogo: inglés grande + español pequeño (oculto si ya lo sabes)
    for (const o of this.objects) {
      if (!o.bubble) continue; o.bubble.t += 1 / 60; if (o.bubble.t > 6) { o.bubble = null; continue; }
      const { en, es } = o.bubble, x = o.x, y = o.y - 110, showEs = this.showEs(en);
      g.font = '700 17px "Alegreya Sans", sans-serif'; const w1 = g.measureText(en).width; g.font = '13px "Alegreya Sans", sans-serif'; const w2 = showEs ? g.measureText(es).width : 120;
      const w = Math.min(420, Math.max(w1, w2) + 26), h = showEs ? 52 : 50;
      g.globalAlpha = Math.min(1, (6 - o.bubble.t) * 2);
      g.fillStyle = 'rgba(255,250,238,.96)'; g.strokeStyle = '#2a1a10'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, 10); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x, y + 12); g.lineTo(x + 8, y); g.fill();
      g.fillStyle = '#1a1020'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 17px "Alegreya Sans", sans-serif'; g.fillText(en, x, y - h + 17, 400);
      g.font = '13px "Alegreya Sans", sans-serif'; g.fillStyle = '#7a6a5a'; g.fillText(showEs ? es : '• • •  (PANEL / T: traducir)', x, y - 15, 400);
      g.globalAlpha = 1;
    }
  },
  drawLabels(g) {
    const L = this.label; if (!L || this.qActive || this.cinematic) return;
    const font = this.worldDef ? this.worldDef.font : 'Bangers', showEs = this.showEs(L.en);
    if (!L._seen) { L._seen = 1; }
    const y = L.y + Math.sin(this.rt * 3) * 2;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `28px "${font}", ${WORLD_FONT_FALLBACK}`; g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = 'rgba(20,10,10,.85)'; g.strokeText(L.en, L.x, y); g.fillStyle = '#fff6dc'; g.fillText(L.en, L.x, y);
    g.font = '600 14px "Alegreya Sans", sans-serif'; g.lineWidth = 4; const es = showEs ? L.es : '• • •'; g.strokeText(es, L.x, y + 22); g.fillStyle = '#ffd98a'; g.fillText(es, L.x, y + 22);
    if (L.verb) { g.font = '600 13px "Alegreya Sans", sans-serif'; const vt = L.verb[0] + (showEs ? '  ·  ' + L.verb[1] : ''); g.strokeText(vt, L.x, y + 40); g.fillStyle = '#c8e8ff'; g.fillText(vt, L.x, y + 40); }
    g.restore();
    if (!L._counted && this.rt - (this._lastLabelT || 0) > 1) { this._lastLabelT = this.rt; L._counted = 1; this.seePhrase(L.en); }
    // indicador de interacción
    const T = this.interactTarget; if (T) { const o = T.o, x = o.x, yy = o.y - (o.labelY ? o.y - o.labelY() + 30 : 130); UI.promptAt(this, x, yy, T.p); } else UI.promptAt(this, null);
  },
  drawCinematicOverlay(g) {
    const C = this.cinematic, VW = this.VW, k = Math.min(1, C.t * 4, (C.dur - C.t) * 4);
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, 70 * k); g.fillRect(0, VH - 70 * k, VW, 70 * k);
    // líneas de velocidad estilo anime
    if (!C.boom && !Store.data.settings.reduced) { g.save(); g.globalAlpha = .35 * k; g.strokeStyle = '#fff'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = hash1(i + Math.floor(this.rt * 20)) * TAU, r0 = 300 + hash1(i * 7) * 200; g.beginPath(); g.moveTo(VW / 2 + Math.cos(a) * r0, VH / 2 + Math.sin(a) * r0); g.lineTo(VW / 2 + Math.cos(a) * 1200, VH / 2 + Math.sin(a) * 1200); g.stroke(); } g.restore(); }
    if (C.type === 'sword' && C.hits) { g.save(); g.translate(-this.cam.x, -this.cam.y); g.globalCompositeOperation = 'lighter'; for (const h of C.hits) { g.strokeStyle = rgba(C.col, C.boom ? .2 : .9); g.lineWidth = C.boom ? 2 : 6; g.beginPath(); g.moveTo(h.x - 140 * Math.cos(h.a), h.y - 140 * Math.sin(h.a)); g.lineTo(h.x + 140 * Math.cos(h.a), h.y + 140 * Math.sin(h.a)); g.stroke(); } g.restore(); }
    if (C.type === 'spear' && C.hits) { g.save(); g.translate(-this.cam.x, -this.cam.y); for (const s of C.hits) if (!s.done) { g.fillStyle = 'rgba(150,230,255,.9)'; g.beginPath(); g.moveTo(s.x - 5, s.y - 70); g.lineTo(s.x + 5, s.y - 70); g.lineTo(s.x, s.y + 10); g.fill(); } g.restore(); }
  },
  renderMenuBg(g) { MenuScene.render(g, this); }
});
