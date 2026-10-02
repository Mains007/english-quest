"use strict";
/* =====================================================================
   ESCENA DE LOS MENÚS — un cuadro vivo pintado
   Título y menú principal: cielo con cúmulos, luna rúnica, mar con brillo,
   colinas con arboledas, acantilado con relieve donde Lio mira el
   horizonte con la capa al viento, pradera en primer plano, pájaros,
   polen y rayos de luz. Paralaje suave con el ratón.
   Mapa y niveles: el paisaje real del bioma de cada mundo, con fundido.
   ===================================================================== */
const MenuScene = (() => {
  let type = 'title', biome = 'beach', prevBiome = null, fade = 1, A = null, t = 0, lastRt = 0, dim = 0, dimT = 0;
  const cam = { x: 0, y: 0, tx: 0, ty: 0 }, mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  const motes = [];

  function set(tp, bio) {
    type = tp; dimT = tp === 'dim' ? .62 : tp === 'panel' ? .4 : 0;
    if (bio && bio !== biome) { prevBiome = biome; biome = bio; fade = 0; }
  }

  /* ---------- recursos pintados una sola vez ---------- */
  function paintCliff() {
    const w = 640, h = 470, c = mk(w, h), g = c.getContext('2d'), r = mulberry32(21);
    const pal = { dark: [44, 52, 86], mid: [86, 96, 132], light: [138, 150, 182], hi: [190, 200, 226] };
    paintRock(g, [[34, 58], [64, 30], [260, 26], [640, 22], [640, h], [170, h], [150, 400], [112, 330], [126, 262], [86, 200], [100, 140], [62, 104], [70, 76]], pal, r, null, 0, { sharp: 1, cracks: 6 });
    paintCover(g, 'grass', 50, 640, x => lerp(32, 22, (x - 50) / 590), 50, 640);
    for (let k = 0; k < 9; k++) paintTuft(g, 80 + k * 64 + r() * 20, lerp(32, 22, (80 + k * 64) / 640) + 2, 16 + r() * 10, PAL.leafSpring, r);
    g.globalCompositeOperation = 'source-atop';
    const sg = g.createLinearGradient(0, 60, 0, h); sg.addColorStop(0, 'rgba(20,30,60,0)'); sg.addColorStop(1, 'rgba(14,20,40,.55)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    return c;
  }
  function paintHills() {
    const W = 1500, H = 320, c = mk(W, H), g = c.getContext('2d'), r = mulberry32(77), fog = BIOMES.title.fog;
    const top = (x, k) => { const u = x / W; return 40 + 130 * u + 46 * (fbm1(u * 3.2 + k * 1.7, 3) - .5) + 22 * Math.sin(u * 8 + k) + sstep(.72, 1, u) * 210; };
    for (let layer = 0; layer < 2; layer++) {
      const fk = layer ? .1 : .42, off = layer ? 46 : 0, Y = x => Math.min(H - 14, top(x * (layer ? 1.08 : 1), layer * 2) + off);
      const base = mixc([74, 132, 70], fog, fk), dark = mixc([30, 76, 50], fog, fk), lit = mixc([158, 206, 104], fog, fk * .8);
      g.fillStyle = rgba(base); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 6) g.lineTo(x, Y(x)); g.lineTo(W, H); g.closePath(); g.fill();
      const pal = layer ? PAL.leafSpring : { dark: mixc(PAL.leafSpring.dark, fog, fk), mid: mixc(PAL.leafSpring.mid, fog, fk), light: mixc(PAL.leafSpring.light, fog, fk), hi: mixc(PAL.leafSpring.hi, fog, fk) };
      const clumps = [];
      for (let i = 0; i < (layer ? 70 : 55); i++) { const x = (i + r() * .8) / (layer ? 70 : 55) * W, y0 = Y(x); if (y0 > H - 30) continue; const d = Math.pow(r(), 1.5); clumps.push([x, y0 + 8 + d * (H - 30 - y0) * .7, (layer ? 16 : 12) + r() * (layer ? 16 : 12)]); }
      clumps.sort((a, b) => a[1] - b[1]);
      for (const [x, y, rad] of clumps) paintFoliage(g, x, y, rad, pal, r, null, 0, { n: 4, noHi: layer === 0 });
      const hg = g.createLinearGradient(0, 0, 0, H); hg.addColorStop(0, rgba(fog, layer ? .05 : .25)); hg.addColorStop(1, rgba(fog, layer ? .18 : .4));
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = hg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    }
    // orilla: arena y espuma
    g.fillStyle = 'rgba(236,216,172,.95)'; g.fillRect(0, H - 14, W, 8);
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let x = 0; x < W; x += 4) g.fillRect(x, H - 6 + Math.sin(x * .05) * 1.5, 4, 2);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, H - 4, W, 4); g.globalCompositeOperation = 'source-over';
    return c;
  }
  function build() {
    if (A) return A;
    A = {};
    A.cliff = paintCliff(); A.hills = paintHills();
    A.fg = { rt: 0, t: 0, windAt: () => -60, toast() { }, cam: { x: 0 }, inCombat: false };
    A.hero = new Hero(A.fg, 0, 0); A.hero.onGround = true; A.hero.state = 'idle'; A.hero.face = -1; A.hero.bufS = 3;
    const r = mulberry32(9); A.blades = []; A.flowers = [];
    for (let x = -100; x < 2300; x += 2.6) { const y = meadowY(x); A.blades.push({ x, y: y + 3, h: 10 + r() * 26, lean: -.1 + (r() - .5) * .3, w: 1.3 + r() * .8, c: (r() * 3) | 0 }); }
    for (let x = -60; x < 2300; x += 30 + r() * 70) A.flowers.push({ x, y: meadowY(x) + 4, h: 14 + r() * 18, ph: r() * 9, c: pick([[255, 255, 255], [255, 220, 110], [255, 150, 190], [190, 170, 255]]) });
    A.birds = []; for (let i = 0; i < 6; i++) A.birds.push({ x: r() * 1800, y: 120 + r() * 160, s: 5 + r() * 5, sp: 18 + r() * 22, ph: r() * 9 });
    return A;
  }
  const meadowY = x => 628 + 18 * Math.sin(x * .004 + 1) + 10 * Math.sin(x * .011) + 6 * fbm1(x * .01, 3);

  /* ---------- diorama del título ---------- */
  function drawDiorama(g, VW, dt) {
    const S = build(), B = BIOMES.title, px = mouse.sx, py = mouse.sy;
    const hz = 474 + py * 6, camX = cam.x + px * 60;
    // cielo + luna rúnica entre el sol y las nubes
    drawSky(g, 'title', VW, camX, py * 30, t, 1, hz, gg => drawRuneMoon(gg, VW * .8 - px * 10, 118 - py * 6));
    // islas lejanas y mar
    const L = buildBiomeLayers('title'), fsx = ((camX * .12) % TW + TW) % TW;
    for (let x = -fsx; x < VW; x += TW) g.drawImage(L.far, x, hz - B.sea.horizon);
    drawSea(g, 'title', VW, hz, t, camX, 1);
    // rayos de sol
    drawRays(g, B.sun.x * VW - camX * .01, B.sun.y * VH, VW);
    // colinas con arboleda (plano medio)
    g.drawImage(S.hills, -120 - px * 40 - cam.x * .3, hz - S.hills.height + 46);
    // pájaros
    g.strokeStyle = 'rgba(40,52,70,.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
    for (const b of S.birds) {
      b.x -= b.sp * dt; if (b.x < -60) { b.x = VW + 60 + Math.random() * 400; b.y = 110 + Math.random() * 180; }
      const f = Math.sin(t * 7 + b.ph) * b.s * .7, x = b.x - px * 30, y = b.y + Math.sin(t * .8 + b.ph) * 6;
      g.beginPath(); g.moveTo(x - b.s, y - f); g.quadraticCurveTo(x - b.s * .4, y - b.s * .3, x, y); g.quadraticCurveTo(x + b.s * .4, y - b.s * .3, x + b.s, y - f); g.stroke();
    }
    // acantilado y Lio
    const cx = VW - 600 - px * 90 - cam.x * .6, cy = 408 - py * 14;
    g.drawImage(S.cliff, cx, cy);
    const H = S.hero, hx = cx + 230, hy = cy + 30;
    S.fg.rt += dt; S.fg.t = S.fg.rt; H.x = 0; H.y = 0; H.face = -1; H.blink -= dt; if (H.blink < -.12) H.blink = R(2, 5); H.updateCloth(dt);
    g.save(); g.translate(hx, hy); g.scale(1.5, 1.5); H.draw(g); g.globalCompositeOperation = 'lighter'; H.drawGlow(g); g.restore();
    // pradera en primer plano
    const ox = -px * 140 - cam.x;
    g.save(); g.translate(ox, -py * 22);
    const mg = g.createLinearGradient(0, 600, 0, VH + 30); mg.addColorStop(0, '#3f7a34'); mg.addColorStop(.35, '#24502a'); mg.addColorStop(1, '#0e2214');
    g.fillStyle = mg; g.beginPath(); g.moveTo(-200, VH + 40); for (let x = -200; x <= VW + 400; x += 10) g.lineTo(x, meadowY(x)); g.lineTo(VW + 400, VH + 40); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(190,230,130,.55)'; g.lineWidth = 2; g.beginPath(); for (let x = -200; x <= VW + 400; x += 10) g.lineTo(x, meadowY(x) + 1); g.stroke();
    drawGrass(g, S.blades, -ox - 60, -ox + VW + 60, t, ['#3c7a2e', '#5f9e3c', '#9cd260'], null);
    for (const f of S.flowers) if (f.x > -ox - 40 && f.x < -ox + VW + 40) drawFlower(g, f, t);
    g.restore();
    // polen y motas de luz
    if (motes.length < 70 && Math.random() < dt * 30) motes.push({ x: VW + 20, y: Math.random() * VH * .9, vx: -(20 + Math.random() * 50), vy: (Math.random() - .5) * 10, s: 1 + Math.random() * 2.4, ph: Math.random() * 9, life: 0 });
    g.globalCompositeOperation = 'lighter';
    for (const m of motes) { m.life += dt; m.x += m.vx * dt; m.y += (m.vy + Math.sin(t * 1.3 + m.ph) * 12) * dt; g.globalAlpha = .55 * Math.min(1, m.life) * (.6 + .4 * Math.sin(t * 3 + m.ph)); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(m.x, m.y, m.s, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (let i = motes.length - 1; i >= 0; i--) if (motes[i].x < -20) motes.splice(i, 1);
  }
  function drawRuneMoon(g, x, y) {
    const R = 74;
    g.save(); g.globalAlpha = .55;
    const mg = g.createRadialGradient(x - R * .3, y - R * .3, R * .1, x, y, R); mg.addColorStop(0, 'rgba(255,255,255,.75)'); mg.addColorStop(1, 'rgba(220,236,255,.28)');
    g.fillStyle = mg; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    g.fillStyle = 'rgba(170,196,230,.25)'; for (const [a, b, rr] of [[-.3, .2, 14], [.35, -.25, 9], [.1, .45, 11], [-.45, -.4, 7]]) { g.beginPath(); g.arc(x + a * R, y + b * R, rr, 0, TAU); g.fill(); }
    // anillo rúnico
    g.translate(x, y); g.rotate(-.28); g.scale(1, .28);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, R * 1.9, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, R * 1.72, 0, TAU); g.stroke();
    g.restore();
  }
  function drawRays(g, sx, sy, VW) {
    if (Store.data.settings.reduced) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const a = .55 + k * .16 + Math.sin(t * .2 + k) * .03, len = 1300, w = .035 + (k % 2) * .025;
      const gr = g.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len); gr.addColorStop(0, `rgba(255,246,214,${.1 + .04 * Math.sin(t * .5 + k * 2)})`); gr.addColorStop(1, 'rgba(255,246,214,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len); g.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len); g.closePath(); g.fill();
    }
    g.restore();
  }

  /* ---------- paisaje de un bioma (mapa y niveles) ---------- */
  function drawBiome(g, VW, key, alpha) {
    if (alpha <= 0) return;
    const B = BIOMES[key], L = buildBiomeLayers(key), cx = t * 18 + mouse.sx * 50, cy = mouse.sy * 30;
    const tileY = (f, oy) => clamp(-(TH - VH) * .62 - cy * f * .5 + oy, VH - TH, 40);
    drawSky(g, key, VW, cx, cy, t, alpha, tileY(.12, 0) + (B.sea ? B.sea.horizon : B.horizon || 560));
    const tile = (img, f, oy) => { const sx = ((cx * f) % TW + TW) % TW, y = tileY(f, oy); g.globalAlpha = alpha; for (let x = -sx; x < VW; x += TW) g.drawImage(img, x, y); return y; };
    const fy = tile(L.far, .12, 0);
    if (B.sea) drawSea(g, key, VW, fy + B.sea.horizon, t, cx, alpha);
    tile(L.mid, .38, 30);
    g.globalAlpha = 1;
  }

  function render(g, G) {
    const now = performance.now() / 1000, VW = G.VW, dt = lastRt ? clamp(now - lastRt, 0, .05) : 0; lastRt = now; t += dt;
    mouse.sx = lerp(mouse.sx, mouse.x, Math.min(1, dt * 2.5)); mouse.sy = lerp(mouse.sy, mouse.y, Math.min(1, dt * 2.5));
    cam.tx = type === 'main' ? 60 : 0; cam.x = lerp(cam.x, cam.tx, Math.min(1, dt * 1.6));
    dim = lerp(dim, dimT, Math.min(1, dt * 4)); fade = Math.min(1, fade + dt * 1.6);
    if (type === 'title' || type === 'main' || ((type === 'dim' || type === 'panel') && biome === 'title')) drawDiorama(g, VW, dt);
    else { if (prevBiome && fade < 1) drawBiome(g, VW, prevBiome, 1); drawBiome(g, VW, biome, prevBiome && fade < 1 ? fade : 1); }
    // gradación: vineta suave y oscurecido para paneles
    g.drawImage(G.vig, 0, 0, VW, VH);
    if (dim > .01) { g.fillStyle = `rgba(8,10,20,${dim})`; g.fillRect(0, 0, VW, VH); }
  }
  // pre-pintar en ratos libres los paisajes de los mundos para que el mapa no se atasque
  function warm() {
    const keys = ['title', ...new Set(WORLDS.map(w => w.biomes[0]))]; let i = 0;
    const step = () => { if (i >= keys.length) return; const k = keys[i++]; try { buildBiomeLayers(k); skyAssets(k); } catch (e) { } (window.requestIdleCallback || setTimeout)(step, 120); };
    (window.requestIdleCallback || setTimeout)(step, 400);
  }
  return { set, render, warm, get type() { return type; }, get biome() { return biome; } };
})();
