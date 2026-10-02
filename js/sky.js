"use strict";
/* =====================================================================
   CIELO Y MAR
   - Nubes volumétricas pintadas una vez por bioma: densidad hecha con
     bocanadas suaves + erosión con ruido, luz del sol con auto-sombreado
     (marcha de rayos en 2D), ribete plateado, rebote de luz por debajo y
     bruma según la distancia. Tres capas con paralaje y deriva.
   - Sol con halo, corona de rayos que gira despacio.
   - Mar con perspectiva: filas de olas a escala creciente, reflejo del
     cielo cerca del horizonte, oleaje lento, columna de brillo del sol con
     destellos que titilan y bruma en el horizonte.
   ===================================================================== */
const SKY_STYLE = {
  title: {
    lit: [255, 255, 255], shade: [174, 194, 232], rim: [255, 250, 236], bounce: [214, 232, 250], haze: [200, 228, 246], light: [-.6, -.8], absorb: .55,
    layers: [
      { w: 2400, h: 260, above: 2, n: 9, size: [110, 220], band: [.74, .84], par: .012, drift: 2, alpha: .9, haze: .45, seed: 131 },
      { w: 2600, h: 440, above: 70, n: 5, size: [250, 440], band: [.72, .84], par: .03, drift: 4, alpha: 1, haze: .12, seed: 137 },
      { w: 3200, h: 600, above: 200, n: 3, size: [460, 700], band: [.74, .84], par: .05, drift: 6, alpha: 1, haze: 0, seed: 139, tall: 1.15 }
    ], cirrus: { alpha: .35, col: [255, 255, 255], y: .08 }
  },
  beach: {
    lit: [255, 255, 255], shade: [176, 196, 232], rim: [255, 250, 236], bounce: [214, 232, 250], haze: [196, 226, 246], light: [.55, -.83], absorb: .55,
    layers: [
      { w: 2400, h: 260, above: 4, n: 10, size: [100, 210], band: [.74, .84], par: .012, drift: 2, alpha: .9, haze: .45, seed: 11 },
      { w: 2600, h: 420, above: 90, n: 5, size: [240, 420], band: [.72, .84], par: .03, drift: 4.5, alpha: 1, haze: .14, seed: 23 },
      { w: 3200, h: 560, above: 250, n: 3, size: [420, 640], band: [.74, .84], par: .05, drift: 7, alpha: 1, haze: 0, seed: 37, tall: 1.1 }
    ], cirrus: { alpha: .4, col: [255, 255, 255], y: .12 }
  },
  cliff: {
    lit: [255, 200, 160], shade: [126, 92, 150], rim: [255, 236, 190], bounce: [255, 156, 140], haze: [240, 170, 165], light: [-.96, .2], absorb: .95,
    layers: [
      { w: 2400, h: 260, above: 6, n: 14, size: [160, 360], band: [.74, .84], par: .012, drift: 2, alpha: .9, haze: .45, seed: 41, flat: 1 },
      { w: 2600, h: 420, above: 100, n: 5, size: [260, 460], band: [.72, .84], par: .03, drift: 4, alpha: 1, haze: .1, seed: 53 },
      { w: 3200, h: 520, above: 260, n: 3, size: [420, 640], band: [.74, .84], par: .05, drift: 6, alpha: 1, haze: 0, seed: 67, tall: 1 }
    ], cirrus: { alpha: .5, col: [255, 190, 170], y: .1 }
  },
  ruins: {
    lit: [255, 253, 246], shade: [188, 196, 204], rim: [255, 250, 230], bounce: [220, 226, 214], haze: [214, 222, 210], light: [-.6, -.8], absorb: .7,
    layers: [
      { w: 2400, h: 300, above: 30, n: 9, size: [140, 280], band: [.72, .84], par: .012, drift: 2, alpha: .8, haze: .5, seed: 71 },
      { w: 2600, h: 420, above: 170, n: 6, size: [280, 520], band: [.7, .82], par: .03, drift: 4, alpha: .95, haze: .1, seed: 83 }
    ], cirrus: { alpha: .3, col: [255, 255, 250], y: .14 }
  },
  forest: {
    lit: [255, 255, 248], shade: [190, 212, 200], rim: [255, 255, 240], bounce: [210, 236, 210], haze: [200, 228, 205], light: [.4, -.9], absorb: .7,
    layers: [{ w: 2600, h: 400, above: 200, n: 6, size: [260, 480], band: [.7, .82], par: .03, drift: 4, alpha: .9, haze: .2, seed: 91 }]
  },
  sky: {
    lit: [255, 255, 255], shade: [184, 202, 238], rim: [255, 255, 250], bounce: [222, 236, 255], haze: [222, 238, 255], light: [.6, -.8], absorb: .75,
    layers: [
      { w: 2400, h: 320, above: 0, n: 14, size: [160, 320], band: [.72, .86], par: .012, drift: 3, alpha: .9, haze: .45, seed: 97 },
      { w: 2600, h: 440, above: 110, n: 6, size: [260, 480], band: [.72, .84], par: .03, drift: 6, alpha: 1, haze: .1, seed: 101 },
      { w: 3200, h: 560, above: 270, n: 4, size: [420, 660], band: [.74, .84], par: .055, drift: 9, alpha: 1, haze: 0, seed: 103, tall: 1.1 }
    ], cirrus: { alpha: .45, col: [255, 255, 255], y: .1 }
  },
  castle: {
    lit: [210, 110, 100], shade: [40, 14, 28], rim: [255, 150, 110], bounce: [150, 40, 40], haze: [110, 40, 50], light: [-.9, .4], absorb: .9,
    layers: [
      { w: 2400, h: 300, above: 20, n: 10, size: [200, 400], band: [.72, .84], par: .012, drift: 3, alpha: .8, haze: .45, seed: 107, flat: 1 },
      { w: 2600, h: 420, above: 200, n: 6, size: [320, 620], band: [.7, .82], par: .03, drift: 6, alpha: .85, haze: .15, seed: 109 }
    ]
  },
  clockwork: {
    lit: [255, 226, 180], shade: [70, 78, 120], rim: [255, 214, 150], bounce: [180, 150, 140], haze: [150, 150, 160], light: [-.3, .95], absorb: .6,
    layers: [
      { w: 2400, h: 280, above: 20, n: 10, size: [180, 360], band: [.72, .84], par: .012, drift: 2, alpha: .75, haze: .5, seed: 113, flat: 1 },
      { w: 2600, h: 400, above: 220, n: 5, size: [300, 560], band: [.7, .82], par: .03, drift: 4, alpha: .8, haze: .2, seed: 127 }
    ]
  }
};
const SKY_CACHE = {};

/* ---------- pintor de nubes volumétricas ---------- */
function paintCloudStrip(L, S) {
  const s = .6, W = Math.round(L.w * s), H = Math.round(L.h * s);
  const den = mk(W, H), dg = den.getContext('2d'); dg.globalCompositeOperation = 'lighter';
  const tmp = mk(W, H), tg = tmp.getContext('2d');
  const r = mulberry32(L.seed);
  const puff = (x, y, rad, a) => {
    for (const ox of [-W, 0, W]) {
      if (x + ox + rad < 0 || x + ox - rad > W) continue;
      const gr = tg.createRadialGradient(x + ox, y, 0, x + ox, y, rad);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.62, `rgba(255,255,255,${a * .88})`); gr.addColorStop(.86, `rgba(255,255,255,${a * .42})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      tg.fillStyle = gr; tg.fillRect(x + ox - rad, y - rad, rad * 2, rad * 2);
    }
  };
  for (let c = 0; c < L.n; c++) {
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.globalCompositeOperation = 'lighter';
    const cw = lerp(L.size[0], L.size[1], r()) * s;
    const ch = cw * (L.flat ? lerp(.12, .2, r()) : lerp(.4, .62, r()) * (L.tall || 1));
    const cx = (c + .15 + r() * .7) / L.n * W, by = H * lerp(L.band[0], L.band[1], r());
    // perfil superior: cúpula + 1-3 torres (cúmulo de coliflor)
    const towers = []; for (let k = 0, nk = L.flat ? 0 : 1 + Math.floor(r() * 3); k < nk; k++) towers.push([lerp(-.55, .55, r()), lerp(.75, 1.25, r()), lerp(.03, .09, r())]);
    const Hf = u => { let h = Math.pow(Math.max(0, 1 - u * u), .7) * (L.flat ? 1 : .72); for (const [tu, th, tw] of towers) h = Math.max(h, th * Math.exp(-((u - tu) ** 2) / tw)); return Math.min(1.3, h); };
    // relleno interior
    const nIn = 10 + Math.round(cw / 9);
    for (let j = 0; j < nIn; j++) {
      const u = r() * 2 - 1, hh = Hf(u) * ch, v = r();
      const rad = Math.max(4, (.3 + .25 * r()) * Math.min(hh + ch * .2, ch * .9));
      puff(cx + u * cw * .46, by - rad * .45 - v * Math.max(0, hh - rad), rad, .55);
    }
    // lóbulos del contorno: el borde de coliflor que atrapa la luz
    const nEdge = 14 + Math.round(cw / 6);
    for (let j = 0; j < nEdge; j++) {
      const u = -1 + 2 * (j + r() * .8) / nEdge, hh = Hf(u) * ch;
      if (hh < ch * .08) continue;
      const rad = Math.max(3, ch * (.1 + .13 * r()) * (.55 + .45 * Math.min(1, hh / ch)));
      puff(cx + u * cw * .48, by - hh + rad * .55, rad, .62);
      if (r() < .5) puff(cx + u * cw * .48 + (r() - .5) * rad, by - hh + rad * 1.3, rad * .8, .5);
    }
    // jirones laterales
    for (let j = 0; j < 5; j++) { const u = (r() < .5 ? -1 : 1) * lerp(.5, .75, r()); puff(cx + u * cw * .5, by - ch * .1 * r(), ch * lerp(.08, .16, r()) + 3, .35); }
    // base plana con borde suave
    tg.globalCompositeOperation = 'destination-out';
    const bg = tg.createLinearGradient(0, by - ch * .06, 0, by + ch * .1 + 2); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,1)');
    tg.fillStyle = bg; tg.fillRect(0, by - ch * .06, W, H);
    dg.drawImage(tmp, 0, 0);
  }
  // densidad + erosión fina con ruido periódico (sin costuras en X)
  const data = dg.getImageData(0, 0, W, H).data, N = W * H, D = new Float32Array(N);
  const n1 = tileNoise(W, Math.max(8, Math.round(W / 40)), L.seed + 3), n2 = tileNoise(W, Math.max(16, Math.round(W / 12)), L.seed + 5), n3 = tileNoise(W, Math.max(32, Math.round(W / 5)), L.seed + 9);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let a = data[i * 4 + 3] / 255; if (a < .015) continue;
    const yy = y * 1.3, n = n1(x, yy) * .3 + n2(x, yy) * .4 + n3(x, yy) * .3;
    a = a * (.78 + .44 * n) - .06;
    D[i] = a <= 0 ? 0 : Math.min(1.4, a * 1.8);
  }
  // luz: marcha hacia el sol (auto-sombreado), rebote del cielo por abajo, ribete
  const out = dg.createImageData(W, H), o = out.data;
  const [lx, ly] = S.light, step = 2.4, K = 12;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, d = D[i]; if (d <= 0) continue;
    let acc = 0;
    for (let k = 1; k <= K; k++) { const sy = Math.round(y + ly * step * k); if (sy < 0 || sy >= H) break; let sx = Math.round(x + lx * step * k) % W; if (sx < 0) sx += W; acc += D[sy * W + sx] * (1 - k / (K + 3)); }
    const T = Math.exp(-acc * S.absorb);
    let below = 0; for (let k = 1; k <= 5; k++) { const sy = y + k * 3; if (sy < H) below += D[sy * W + x]; }
    const bounce = clamp(1 - below / 3, 0, 1) * (1 - T) * .6;
    const edge = 1 - sstep(0, .45, d), rimK = edge * T * T;
    const lt = sstep(.22, .36, T) * .55 + sstep(.55, .68, T) * .45;
    let R = lerp(S.shade[0], S.lit[0], lt), Gc = lerp(S.shade[1], S.lit[1], lt), Bc = lerp(S.shade[2], S.lit[2], lt);
    R = lerp(R, S.bounce[0], bounce); Gc = lerp(Gc, S.bounce[1], bounce); Bc = lerp(Bc, S.bounce[2], bounce);
    R += (S.rim[0] - R) * rimK * .6; Gc += (S.rim[1] - Gc) * rimK * .6; Bc += (S.rim[2] - Bc) * rimK * .6;
    R = lerp(R, S.haze[0], L.haze); Gc = lerp(Gc, S.haze[1], L.haze); Bc = lerp(Bc, S.haze[2], L.haze);
    const j = i * 4; o[j] = R; o[j + 1] = Gc; o[j + 2] = Bc; o[j + 3] = 255 * sstep(.1, .2, d) * L.alpha;
  }
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.putImageData(out, 0, 0);
  const c = mk(L.w, L.h), cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high'; cg.drawImage(den, 0, 0, L.w, L.h);
  return c;
}
/* cirros: velos altos estirados por el viento */
function paintCirrus(Cf, seed) {
  const W = 3200, H = 220, c = mk(W, H), g = c.getContext('2d'), r = mulberry32(seed);
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = 30 + r() * (H - 70), len = 160 + r() * 420, th = 3 + r() * 9, a = .06 + r() * .12, ang = (r() - .5) * .12;
    for (const ox of [-W, 0, W]) {
      g.save(); g.translate(x + ox, y); g.rotate(ang); g.scale(len / th, 1);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, th); gr.addColorStop(0, rgba(Cf.col, a)); gr.addColorStop(1, rgba(Cf.col, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, th, 0, TAU); g.fill(); g.restore();
    }
  }
  return c;
}
function skyAssets(key) {
  if (SKY_CACHE[key] !== undefined) return SKY_CACHE[key];
  const S = SKY_STYLE[key]; if (!S) return SKY_CACHE[key] = null;
  const res = { layers: S.layers.map(L => ({ L, c: paintCloudStrip(L, S) })), cirrus: S.cirrus ? paintCirrus(S.cirrus, key.length * 7 + 1) : null };
  return SKY_CACHE[key] = res;
}

/* ---------- sol ---------- */
function drawSun(g, B, sx, sy, t, alpha) {
  const c = B.sun.col, r = B.sun.r;
  glowAt(g, c, sx, sy, r * 11, alpha * .32); glowAt(g, c, sx, sy, r * 5, alpha * .5); glowAt(g, mixc(c, [255, 255, 255], .6), sx, sy, r * 2.2, alpha * .9);
  if (!Store.data.settings.reduced) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(sx, sy); g.rotate(t * .015);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU + Math.sin(t * .25 + i * 2.1) * .04, len = r * (5 + 4 * hash1(i * 5 + 1)), w = .035 + .03 * hash1(i * 3 + 2);
      g.globalAlpha = alpha * (.018 + .028 * hash1(i * 7 + 3)) * (.75 + .25 * Math.sin(t * .6 + i));
      const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len); g.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len); g.closePath(); g.fill();
    }
    g.restore();
  }
  g.globalAlpha = alpha;
  const dg = g.createRadialGradient(sx, sy, 0, sx, sy, r * 1.08); dg.addColorStop(0, '#ffffff'); dg.addColorStop(.72, rgba(mixc(c, [255, 255, 255], .7))); dg.addColorStop(.92, rgba(mixc(c, [255, 255, 255], .35), .85)); dg.addColorStop(1, rgba(c, 0));
  g.fillStyle = dg; g.beginPath(); g.arc(sx, sy, r * 1.08, 0, TAU); g.fill();
}

/* ---------- cielo dinámico ---------- */
function drawSky(g, key, VW, camX, camY, t, alpha = 1, hz = 560, beforeClouds) {
  const B = BIOMES[key]; g.globalAlpha = alpha;
  const gr = g.createLinearGradient(0, 0, 0, VH); for (const [c, s] of B.sky) gr.addColorStop(s, c); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  // resplandor del horizonte
  const hg = g.createLinearGradient(0, hz - 220, 0, hz + 20); hg.addColorStop(0, rgba(B.fog, 0)); hg.addColorStop(1, rgba(B.fog, .45)); g.fillStyle = hg; g.fillRect(0, hz - 220, VW, 240);
  if (B.stars) {
    for (let i = 0; i < 140; i++) {
      const x = ((hash1(i) * 2400 - camX * .015) % VW + VW) % VW, y = hash1(i * 3) * Math.min(hz - 40, 460), s = hash1(i * 5) < .1 ? 2.4 : 1.4;
      g.globalAlpha = alpha * (.25 + .6 * Math.sin(t * (1 + hash1(i * 9) * 2) + i) ** 2) * (1 - y / 520); g.fillStyle = '#fff'; g.fillRect(x, y, s, s);
      if (s > 2) { glowAt(g, [200, 220, 255], x + 1, y + 1, 7, g.globalAlpha * .6); }
    }
    g.globalAlpha = alpha;
  }
  const A = skyAssets(key);
  if (A && A.cirrus) { const C = A.cirrus, Cf = SKY_STYLE[key].cirrus, x = -(((camX * .006 + t * 1.5) % C.width + C.width) % C.width), y = VH * Cf.y - camY * .01; g.globalAlpha = alpha * Cf.alpha; for (let xx = x; xx < VW; xx += C.width) g.drawImage(C, xx, y); g.globalAlpha = alpha; }
  if (B.sun) drawSun(g, B, B.sun.x * VW - camX * .01, B.sun.y * VH - camY * .05, t, alpha);
  if (beforeClouds) beforeClouds(g);
  if (A) for (const { L, c } of A.layers) {
    const x = -(((camX * L.par + t * L.drift) % L.w + L.w) % L.w), y = hz - L.above - L.h * .8 - camY * L.par * .5;
    if (y > VH || y + L.h < 0) continue;
    for (let xx = x; xx < VW; xx += L.w) g.drawImage(c, xx, y);
  }
  g.globalAlpha = 1;
}

/* ---------- mar ---------- */
const SEA_TILES = {};
function seaTile(key) {
  if (SEA_TILES[key]) return SEA_TILES[key];
  const B = BIOMES[key], S = B.sea, W = 512, H = 72, c = mk(W, H), g = c.getContext('2d'), r = mulberry32(key.length * 31 + 9);
  const hi = mixc([255, 255, 255], B.sun ? B.sun.col : [255, 255, 255], .35), lo = scalec(S.deep, .7);
  g.lineCap = 'round';
  for (let i = 0; i < 120; i++) {
    const x = r() * W, y = 5 + r() * (H - 10), len = 12 + r() * 40, th = .6 + r() * 1.1, k = r();
    for (const ox of [-W, 0, W]) {
      if (ox + x + len < 0 || ox + x > W) continue;
      g.strokeStyle = rgba(lo, .18 + k * .22); g.lineWidth = th * 1.6; g.beginPath(); g.moveTo(ox + x - len * .1, y + 3); g.quadraticCurveTo(ox + x + len * .5, y + 3 + len * .07, ox + x + len * 1.1, y + 3); g.stroke();
      g.strokeStyle = rgba(hi, .16 + k * .4); g.lineWidth = th; g.beginPath(); g.moveTo(ox + x, y); g.quadraticCurveTo(ox + x + len * .5, y - len * .13, ox + x + len, y); g.stroke();
    }
  }
  return SEA_TILES[key] = c;
}
function drawSea(g, key, VW, hz, t, camX, alpha = 1) {
  const B = BIOMES[key], S = B.sea; if (!S || hz >= VH) return;
  const span = VH - hz, skyHz = hex2rgb(B.sky[B.sky.length - 1][0]);
  g.globalAlpha = alpha;
  const gr = g.createLinearGradient(0, hz, 0, VH);
  gr.addColorStop(0, rgba(mixc(skyHz, S.col, .35))); gr.addColorStop(.07, rgba(mixc(S.col, skyHz, .28))); gr.addColorStop(.38, rgba(S.col)); gr.addColorStop(1, rgba(S.deep));
  g.fillStyle = gr; g.fillRect(0, hz, VW, span);
  // oleaje lento: bandas anchas que avanzan hacia la orilla
  for (let k = 0; k < 4; k++) {
    const v = ((t * .045 + k / 4) % 1), y = hz + v * v * span, h = 6 + v * v * 70;
    g.globalAlpha = alpha * .07 * Math.sin(v * Math.PI); g.fillStyle = rgba(scalec(S.deep, .6)); g.fillRect(0, y, VW, h);
  }
  // sombras de nubes que se deslizan por el agua
  for (let k = 0; k < 5; k++) {
    const v = .08 + hash1(k * 31) * .8, y = hz + v * v * span, w = (180 + hash1(k * 17) * 380) * (.3 + v * 1.4), x = ((hash1(k * 7) * 2600 - camX * (.02 + .3 * v * v) - t * 5) % 2600 + 2600) % 2600 - 600;
    const sg = g.createRadialGradient(x, y, 0, x, y, w); sg.addColorStop(0, rgba(scalec(S.deep, .55), .16)); sg.addColorStop(1, rgba(S.deep, 0));
    g.globalAlpha = alpha; g.fillStyle = sg; g.save(); g.translate(x, y); g.scale(1, .12 + v * .25); g.translate(-x, -y); g.beginPath(); g.arc(x, y, w, 0, TAU); g.fill(); g.restore();
  }
  // filas de olas con perspectiva
  const tile = seaTile(key), tw0 = tile.width, th0 = tile.height, rows = 24;
  for (let k = 0; k < rows; k++) {
    const v0 = (k / rows) ** 2, v1 = ((k + 1) / rows) ** 2, y0 = hz + v0 * span, h = (v1 - v0) * span; if (h < .5) continue;
    const sc = .16 + v1 * 1.9, tw = tw0 * sc;
    const off = ((t * (5 + 26 * v1) + camX * (.015 + .3 * v1) + k * 131) % tw + tw) % tw;
    g.globalAlpha = alpha * (.34 + .34 * Math.min(1, v1 * 1.6));
    for (let x = -off; x < VW; x += tw) g.drawImage(tile, 0, 0, tw0, th0, x, y0, tw + .5, h + .6);
  }
  // columna de brillo del sol con destellos
  if (B.sun) {
    const sx = B.sun.x * VW - camX * .01, sc = B.sun.col;
    g.globalCompositeOperation = 'lighter';
    const cg = g.createLinearGradient(0, hz, 0, VH); cg.addColorStop(0, rgba(sc, .5)); cg.addColorStop(.4, rgba(sc, .14)); cg.addColorStop(1, rgba(sc, 0));
    g.globalAlpha = alpha; g.fillStyle = cg; g.beginPath(); g.moveTo(sx - 14, hz); g.lineTo(sx + 14, hz); g.lineTo(sx + 300, VH); g.lineTo(sx - 300, VH); g.closePath(); g.fill();
    const sparkle = rgba(mixc(sc, [255, 255, 255], .65));
    g.fillStyle = sparkle;
    for (let i = 0; i < 260; i++) {
      const v = hash1(i * 13 + 1) ** 1.8, y = hz + 1 + v * span * .96, w = 18 + v * 600;
      const x = sx + (hash1(i * 7 + 3) - .5) * w * (.55 + .45 * hash1(i * 11 + 5)) + Math.sin(t * .8 + i) * v * 6;
      const tw = Math.sin(t * (4 + hash1(i * 5) * 8) + i * 1.7); if (tw < .5) continue;
      const a = (tw - .5) / .5, l = 1.4 + v * 16;
      g.globalAlpha = alpha * a * (.95 - v * .45); g.fillRect(x - l / 2, y, l, .7 + v * 1.8);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // línea del horizonte y bruma
  g.globalAlpha = alpha * .55; g.fillStyle = rgba(mixc(skyHz, [255, 255, 255], .5)); g.fillRect(0, hz - .5, VW, 1.3);
  const hg = g.createLinearGradient(0, hz - 26, 0, hz + 22); hg.addColorStop(0, rgba(B.fog, 0)); hg.addColorStop(.55, rgba(B.fog, .4)); hg.addColorStop(1, rgba(B.fog, 0));
  g.globalAlpha = alpha; g.fillStyle = hg; g.fillRect(0, hz - 26, VW, 48);
  g.globalAlpha = 1;
}
