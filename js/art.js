"use strict";
/* =====================================================================
   ARTE PROCEDURAL
   1. Materiales con RELIEVE real (bisel, bloques facetados, grietas con
      profundidad, normales, luz direccional, oclusión, brillo húmedo).
   2. Lava brillante y semitransparente (sin patrón de panal), agua con
      reflejos, cielos, nubes.
   3. Vegetación y decoración (hierba, palmeras, helechos, setas, algas…).
   ===================================================================== */

/* ---------- materiales (paleta de animación: colores limpios y saturados) ----------
   col/col2: tono medio (variación lenta) · lit: luz cálida · shade: sombra fría · deep: fondo de la masa */
const MATS = {
  sand:      { id: 1, col: [246, 216, 156], col2: [238, 204, 140], lit: [255, 240, 196], shade: [214, 160, 112], deep: [122, 70, 62], bevel: 9, soil: 1, ripple: 1, out: [150, 96, 70] },
  sandstone: { id: 2, col: [226, 160, 110], col2: [214, 144, 98], lit: [252, 202, 146], shade: [176, 104, 86], deep: [120, 62, 64], bevel: 14, boulder: 1, cell: 96, sx: 2.2, sy: 1, gap: 3.2, strata: 1, out: [104, 54, 52] },
  coral:     { id: 3, col: [244, 140, 128], col2: [232, 120, 132], lit: [255, 196, 170], shade: [196, 86, 112], deep: [128, 50, 86], bevel: 11, boulder: 1, cell: 46, sx: 1, sy: 1, gap: 2.6, holes: 1, out: [110, 40, 70] },
  wetrock:   { id: 4, col: [92, 124, 148], col2: [82, 112, 138], lit: [150, 196, 214], shade: [60, 78, 112], deep: [26, 36, 60], bevel: 15, boulder: 1, cell: 84, sx: 1.6, sy: 1, gap: 3, spec: .5, out: [22, 30, 50] },
  moss:      { id: 5, col: [132, 138, 124], col2: [120, 128, 116], lit: [196, 200, 170], shade: [86, 92, 104], deep: [44, 50, 62], bevel: 14, boulder: 1, cell: 88, sx: 1.5, sy: 1, gap: 3, moss: 1, out: [40, 46, 56] },
  brick:     { id: 6, col: [194, 170, 142], col2: [180, 156, 130], lit: [240, 220, 186], shade: [138, 116, 108], deep: [70, 56, 62], brick: 1, bw: 64, bh: 30, bevel: 7, gap: 2.4, moss: .6, out: [64, 50, 54] },
  rock:      { id: 7, col: [118, 122, 150], col2: [108, 112, 142], lit: [178, 186, 214], shade: [78, 78, 116], deep: [34, 34, 60], bevel: 14, boulder: 1, cell: 80, sx: 1.4, sy: 1, gap: 3, out: [30, 30, 52] },
  basalt:    { id: 8, col: [86, 70, 78], col2: [76, 62, 70], lit: [150, 118, 120], shade: [56, 42, 56], deep: [26, 18, 26], bevel: 12, boulder: 1, cell: 60, sx: .8, sy: 1.7, gap: 2.6, emissive: [255, 116, 36], out: [22, 14, 20] },
  wood:      { id: 9, col: [176, 118, 72], col2: [164, 108, 64], lit: [226, 170, 112], shade: [124, 76, 56], deep: [70, 40, 34], planks: 1, ph: 24, bevel: 6, gap: 2, out: [66, 36, 28] },
  dirt:      { id: 10, col: [156, 106, 72], col2: [146, 98, 66], lit: [204, 152, 104], shade: [110, 70, 58], deep: [46, 28, 30], bevel: 11, soil: 1, pebbles: 1, out: [52, 30, 28] },
  cap:       { id: 11, col: [226, 96, 186], col2: [210, 82, 176], lit: [255, 170, 226], shade: [158, 60, 156], deep: [96, 34, 110], bevel: 18, soil: 1, dots: 1, spec: .35, out: [86, 30, 96] },
  cloud:     { id: 12, col: [250, 248, 255], col2: [242, 244, 255], lit: [255, 255, 255], shade: [196, 210, 240], deep: [160, 178, 226], bevel: 22, soil: 1, soft: 1, out: [150, 170, 220] },
  crystal:   { id: 13, col: [150, 126, 255], col2: [110, 190, 255], lit: [220, 236, 255], shade: [92, 82, 200], deep: [50, 40, 130], bevel: 7, boulder: 1, cell: 30, sx: 1, sy: 2, gap: 1.6, spec: .9, out: [40, 30, 110] },
  metal:     { id: 14, col: [162, 168, 184], col2: [150, 156, 174], lit: [222, 228, 240], shade: [104, 108, 132], deep: [46, 48, 66], brick: 1, bw: 96, bh: 48, bevel: 5, gap: 2, spec: .6, rivets: 1, out: [40, 42, 60] }
};
const MAT_BY_ID = []; for (const k in MATS) { MATS[k].key = k; MAT_BY_ID[MATS[k].id] = MATS[k]; }
const matFill = name => `rgb(${MATS[name].id * 16},0,0)`;

/* ---------- renderizador de terreno en estilo de animación ----------
   Formas redondeadas (bisel circular), rocas como cantos rodados limpios,
   luz en 3 tonos con transiciones suaves (cel shading), oscurecimiento
   por profundidad, ribete de luz en el borde y contorno del mismo tono.
   mask: lienzo con formas pintadas en rgb(id*16,0,0); devuelve ImageData.
   ox, oy: coordenadas de mundo del píxel (M, M) de la máscara. */
function renderRelief(mask, ox, oy, M, outW, outH, opt = {}) {
  const W = mask.width, H = mask.height;
  const md = mask.getContext('2d').getImageData(0, 0, W, H).data;
  const N = W * H, mat = new Uint8Array(N), D = new Uint16Array(N), AIR = new Uint16Array(N);
  for (let i = 0; i < N; i++) { if (md[i * 4 + 3] > 90) mat[i] = Math.round(md[i * 4] / 16); }
  // distancia a cualquier borde (D) y distancia al aire (AIR, para el contorno)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, m = mat[i];
    if (!m) { D[i] = 0; AIR[i] = 0; continue; }
    const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
    const edge = border ? 0 : (mat[i - 1] !== m || mat[i + 1] !== m || mat[i - W] !== m || mat[i + W] !== m);
    const air = border ? 0 : (!mat[i - 1] || !mat[i + 1] || !mat[i - W] || !mat[i + W]);
    D[i] = edge ? 1 : 60000; AIR[i] = air ? 1 : 60000;
  }
  for (const A of [D, AIR]) {
    for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; let v = A[i]; if (!v) continue;
      const a = A[i - 1] + 3, b = A[i - W] + 3, c = A[i - W - 1] + 4, d = A[i - W + 1] + 4;
      if (a < v) v = a; if (b < v) v = b; if (c < v) v = c; if (d < v) v = d; A[i] = v;
    }
    for (let y = H - 2; y >= 0; y--) for (let x = W - 2; x >= 1; x--) {
      const i = y * W + x; let v = A[i]; if (!v) continue;
      const a = A[i + 1] + 3, b = A[i + W] + 3, c = A[i + W + 1] + 4, d = A[i + W - 1] + 4;
      if (a < v) v = a; if (b < v) v = b; if (c < v) v = c; if (d < v) v = d; A[i] = v;
    }
  }
  // altura (formas limpias, sin ruido fino)
  const Hh = new Float32Array(N), CR = new Float32Array(N), CID = new Float32Array(N);
  const x0 = Math.max(1, M - 1), x1 = Math.min(W - 2, M + outW), y0 = Math.max(1, M - 1), y1 = Math.min(H - 2, M + outH);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x, m = mat[i]; if (!m) continue;
    const P = MAT_BY_ID[m]; if (!P) continue;
    const wx = ox - M + x, wy = oy - M + y, d = D[i] / 3;
    const k = 1 - Math.min(1, d / P.bevel), hEdge = Math.sqrt(1 - k * k);      // bisel circular: bordes de "arcilla"
    let h = hEdge, crev = 1, cid = vnoise(wx * .004, wy * .004);
    if (P.boulder) {
      const csx = P.cell * P.sx, csy = P.cell * P.sy, X = wx / csx, Y = wy / csy, ix = Math.floor(X), iy = Math.floor(Y);
      let f1 = 1e9, f2 = 1e9, bh = 0;
      for (let jy = -1; jy <= 1; jy++) for (let jx = -1; jx <= 1; jx++) {
        const cx = ix + jx, cy = iy + jy, hh = hash2(cx * 7 + m, cy * 13 - m);
        const px = cx + .2 + .6 * hh, py = cy + .2 + .6 * hash2(cx * 3 + 101, cy * 5 + m * 7);
        const dx = (X - px) * csx, dy = (Y - py) * csy, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < f1) { f2 = f1; f1 = dd; bh = hh; } else if (dd < f2) f2 = dd;
      }
      const e = (f2 - f1) * .5;
      // grietas solo en algunas zonas (no una red de baldosas)
      const show = opt.noCrack ? 0 : sstep(.6, .72, vnoise(wx * .006 + m * 3, wy * .008));
      crev = 1 - (1 - sstep(0, P.gap * 2.2, e)) * show;
      const dome = 1 - Math.pow(Math.min(1, f1 / (P.cell * Math.max(P.sx, P.sy) * .75)), 2) * .5;
      h = Math.min(hEdge, crev * .7 + .3) * (.88 + .12 * dome * show + .06 * dome) + (bh - .5) * .04 * show;
      cid = bh * .35 * show + cid * (1 - .35 * show);
    } else if (P.brick) {
      const row = Math.floor(wy / P.bh), off = (row & 1) * P.bw * .5, col = Math.floor((wx + off) / P.bw);
      const lx = wx + off - col * P.bw, ly = wy - row * P.bh, e = Math.min(lx, P.bw - lx, ly, P.bh - ly);
      crev = sstep(0, P.gap * 2.2, e); cid = hash2(col, row);
      const rk = 1 - Math.min(1, e / (P.bevel + 2)); h = Math.min(hEdge, Math.sqrt(1 - rk * rk) * .8 + .2);
      if (P.rivets) { const rx = Math.min(lx, P.bw - lx), ry = Math.min(ly, P.bh - ly); const rd = Math.hypot(rx - 8, ry - 8); if (rd < 3.2) h += .35 * Math.sqrt(1 - (rd / 3.2) ** 2); }
    } else if (P.planks) {
      const row = Math.floor(wy / P.ph), ly = wy - row * P.ph, e = Math.min(ly, P.ph - ly);
      crev = sstep(0, P.gap * 2, e); cid = hash2(row, 3);
      const rk = 1 - Math.min(1, e / 6); h = Math.min(hEdge, Math.sqrt(1 - rk * rk) * .8 + .2);
      const seg = Math.floor((wx + cid * 300) / 150), lx = wx + cid * 300 - seg * 150; if (lx < 2) crev *= lx / 2;
    }
    if (!P.soil && !P.brick && !P.planks) h += (fbm(wx * .0055 + m, wy * .0065, 3) - .5) * .9 * hEdge + (vnoise(wx * .018, wy * .02) - .5) * .16 * hEdge;
    if (P.soil) {
      h += (vnoise(wx * .012, wy * .012) - .5) * .18 * hEdge;                   // ondulación suave
      if (P.ripple) h += Math.sin(wx * .1 + vnoise(wx * .006, wy * .02) * 8 + wy * .05) * .025 * hEdge;
    }
    if (P.pebbles || P.soil) {
      // piedrecitas incrustadas (cúpulas limpias)
      const cs = P.pebbles ? 34 : 56, gx = Math.floor(wx / cs), gy = Math.floor(wy / cs), hs = hash2(gx * 11 + m, gy * 7);
      if (hs > (P.pebbles ? .62 : .86) && d > 16) {
        const pr = 4 + hash2(gx, gy * 3) * (P.pebbles ? 7 : 5), pcx = (gx + .25 + .5 * hash2(gx * 5, gy)) * cs, pcy = (gy + .25 + .5 * hash2(gx, gy * 9)) * cs;
        const pd = Math.hypot(wx - pcx, (wy - pcy) * 1.25);
        if (pd < pr) { h += .45 * Math.sqrt(1 - (pd / pr) ** 2); cid = .9; }
      }
    }
    if (P.holes) { const hn = vnoise(wx * .12, wy * .12); if (hn > .74) h -= (hn - .74) * 1.6; }
    if (P.dots) { const dn = vnoise(wx * .03, wy * .03); if (dn > .68) h += .12; }
    Hh[i] = h; CR[i] = crev; CID[i] = cid;
  }
  // color con luz en tres tonos
  const out = new ImageData(outW, outH), od = out.data;
  const L = opt.light || [-.55, -.7, .45]; const ll = Math.hypot(L[0], L[1], L[2]); const Lx = L[0] / ll, Ly = L[1] / ll, Lz = L[2] / ll;
  const amb = opt.ambient ?? .46, sky = opt.sky || [200, 225, 255], skyK = opt.skyK ?? .2, depthK = opt.depth ?? .55;
  const emit = opt.emit ? new ImageData(outW, outH) : null, ed = emit ? emit.data : null; let anyEmit = false;
  const fog = opt.fog, fogK = opt.fogK || 0;
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
    const i = (y + M) * W + (x + M), m = mat[i], o = (y * outW + x) * 4;
    if (!m) continue; const P = MAT_BY_ID[m]; if (!P) continue;
    const wx = ox + x, wy = oy + y, d = D[i] / 3, da = AIR[i] / 3;
    let nx = (Hh[i - 1] - Hh[i + 1]) * 3.4, ny = (Hh[i - W] - Hh[i + W]) * 3.4;
    const nl = Math.sqrt(nx * nx + ny * ny + 1); nx /= nl; ny /= nl; const nz = 1 / nl;
    const ndl = nx * Lx + ny * Ly + nz * Lz, half = ndl * .5 + .5;
    const t1 = sstep(.5, .57, half), t2 = sstep(.8, .86, half);              // sombra → medio → luz
    const v = CID[i];
    let r = lerp(P.col[0], P.col2[0], v), g = lerp(P.col[1], P.col2[1], v), b = lerp(P.col[2], P.col2[2], v);
    if (P.ripple && d > 12) { const band = sstep(.55, .75, .5 + .5 * Math.sin(wy * .09 + vnoise(wx * .006, wy * .02) * 6)); r -= band * 14; g -= band * 14; b -= band * 8; }
    if (P.strata) { const band = sstep(.35, .65, .5 + .5 * Math.sin(wy * .07 + vnoise(wx * .004, wy * .01) * 5)); r -= band * 12; g -= band * 10; b -= band * 6; }
    let R = lerp(lerp(P.shade[0], r, t1), P.lit[0], t2), G = lerp(lerp(P.shade[1], g, t1), P.lit[1], t2), B = lerp(lerp(P.shade[2], b, t1), P.lit[2], t2);
    // musgo en las caras que miran arriba
    if (P.moss && ny < -.15) { const mk2 = sstep(-.15, -.45, ny) * P.moss * sstep(.4, .5, vnoise(wx * .03, wy * .05)); R = lerp(R, 104 + t2 * 40, mk2); G = lerp(G, 150 + t2 * 40, mk2); B = lerp(B, 70 + t2 * 20, mk2); }
    if (P.dots && vnoise(wx * .03, wy * .03) > .68) { R = lerp(R, 255, .75); G = lerp(G, 236, .75); B = lerp(B, 246, .75); }
    // grietas entre cantos: sombra limpia (no líneas negras)
    const crev = CR[i]; if (crev < 1) { const k = (1 - crev) * .7; R = lerp(R, P.shade[0] * .8, k); G = lerp(G, P.shade[1] * .8, k); B = lerp(B, P.shade[2] * .8, k); }
    // profundidad: la masa se hunde en tonos oscuros y fríos
    const deep = Math.min(.94, (sstep(8, 34, d) * .42 + sstep(36, 140, d) * .58) * Math.max(.92, depthK * 1.5));
    R = lerp(R, P.deep[0], deep); G = lerp(G, P.deep[1], deep); B = lerp(B, P.deep[2], deep);
    // luz del cielo en lo que mira arriba
    const top = Math.max(0, -ny) * (1 - deep); R += sky[0] * top * skyK * .35; G += sky[1] * top * skyK * .35; B += sky[2] * top * skyK * .35;
    if (opt.tint) { R *= opt.tint[0]; G *= opt.tint[1]; B *= opt.tint[2]; }
    if (P.spec) { const rz = 2 * ndl * nz - Lz; const s = sstep(.9, .94, rz) * P.spec * 200 * (1 - deep); R += s; G += s; B += s; }
    // ribete de luz en el borde iluminado + contorno del mismo tono
    if (da < 4.5 && ny < -.1) { const k = sstep(4.5, 1.5, da) * .55; R = lerp(R, P.lit[0] + 20, k); G = lerp(G, P.lit[1] + 20, k); B = lerp(B, P.lit[2] + 16, k); }
    if (da < 2.2) { const k = sstep(2.2, .6, da) * .85; R = lerp(R, P.out[0], k); G = lerp(G, P.out[1], k); B = lerp(B, P.out[2], k); }
    if (fog) { R = lerp(R, fog[0], fogK); G = lerp(G, fog[1], fogK); B = lerp(B, fog[2], fogK); }
    if (P.emissive && d > 8) {
      // vetas de lava sueltas y onduladas (isolíneas de ruido), nunca una red de celdas
      const zone = sstep(.58, .7, vnoise(wx * .004 + 7, wy * .005 + 3));
      if (zone > 0) {
        const nv = vnoise(wx * .018 + vnoise(wx * .01, wy * .01) * 2, wy * .03), line = 1 - sstep(.012, .03, Math.abs(nv - .5));
        const gl = line * zone * sstep(8, 18, d);
        if (gl > .01) { R = lerp(R, 255, gl * .85); G = lerp(G, 150, gl * .8); B = lerp(B, 60, gl * .7); if (ed) { ed[o] = P.emissive[0]; ed[o + 1] = P.emissive[1]; ed[o + 2] = P.emissive[2]; ed[o + 3] = Math.min(255, gl * 255); anyEmit = true; } }
      }
    }
    od[o] = R < 0 ? 0 : R > 255 ? 255 : R; od[o + 1] = G < 0 ? 0 : G > 255 ? 255 : G; od[o + 2] = B < 0 ? 0 : B > 255 ? 255 : B;
    od[o + 3] = md[i * 4 + 3];
  }
  return { img: out, emit: anyEmit ? emit : null };
}

/* ---------- textura de flujo suave para lava (sin celdas) ---------- */
const FLOWTEX = (() => {
  const S = 256, c = mk(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
  const n1 = tileNoise(S, 4, 31), n2 = tileNoise(S, 8, 32), n3 = tileNoise(S, 16, 33), w1 = tileNoise(S, 4, 34);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const wv = w1(x, y) * 70;
    const v = n1((x + wv) % S, y) * .6 + n2(x, (y + wv * .5) % S) * .3 + n3(x, y) * .1;
    const hi = sstep(.55, .78, v), lo = sstep(.42, .2, v);
    const k = (y * S + x) * 4;
    d[k] = 255; d[k + 1] = clamp(150 + hi * 95 - lo * 70, 0, 255); d[k + 2] = clamp(40 + hi * 120 - lo * 30, 0, 255);
    d[k + 3] = clamp(hi * 200 + lo * 120, 0, 255);
  }
  g.putImageData(im, 0, 0); return c;
})();
let FLOWPAT = null;

/* ---------- lava ---------- */
function lavaFront(x, lv, t) { return lv + Math.sin(x * .021 - t * 1.25) * 3.4 + Math.sin(x * .059 + t * 2.05) * 1.5 + Math.sin(x * .0085 + t * .45) * 2.2; }
function lavaBack(x, lv, t) { return lv - 7 + Math.sin(x * .017 + t * 1.05 + 1.3) * 4.2 + Math.sin(x * .041 - t * 1.6) * 2.1; }
function drawJelly(g, x0, x1, lv, t, bottom, O) {
  const st = 6, a = Math.floor(x0 / st) * st, b = Math.ceil(x1 / st) * st;
  const JF = x => lv - 4 + Math.sin(x * .03 - t * 5) * 4 * (1 + .5 * Math.sin(t * 2.3)) + Math.sin(x * .011 + t * 3.1) * 3 + O(x);
  const path = () => { g.beginPath(); g.moveTo(a, bottom); for (let x = a; x <= b; x += st) g.lineTo(x, JF(x)); g.lineTo(b, bottom); g.closePath(); };
  g.save(); path(); g.clip();
  const gr = g.createLinearGradient(0, lv - 10, 0, Math.min(bottom, lv + 260)); gr.addColorStop(0, '#f4ffd8'); gr.addColorStop(.06, '#b4f870'); gr.addColorStop(.45, '#52c040'); gr.addColorStop(1, '#14522a');
  g.fillStyle = gr; g.fillRect(a, lv - 20, b - a, bottom - lv + 20);
  // trocitos de fruta y burbujas suspendidas (se mecen)
  for (let k = Math.floor(a / 70); k <= b / 70; k++) { const h = hash1(k * 13 + 5), x = k * 70 + h * 50 + Math.sin(t * 2 + h * 7) * 3, y = lv + 26 + h * 90 + Math.sin(t * 3 + k) * 2;
    if (h > .55) { g.fillStyle = h > .8 ? 'rgba(255,120,150,.85)' : 'rgba(255,220,90,.85)'; g.save(); g.translate(x, y); g.rotate(h * 3 + Math.sin(t * 2 + k) * .2); g.fillRect(-6, -6, 12, 12); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-5, -5, 4, 3); g.restore(); }
    else { g.strokeStyle = 'rgba(240,255,220,.75)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 3 + h * 6, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 1.2, 0, TAU); g.fill(); } }
  // brillo especular
  g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, JF(x) + 7); for (let x = b; x >= a; x -= st) g.lineTo(x, JF(x) + 13 + Math.sin(x * .05) * 2); g.closePath(); g.fill();
  g.restore();
  g.lineJoin = 'round'; g.strokeStyle = '#f4ffe0'; g.lineWidth = 3; g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, JF(x)); g.stroke();
  g.strokeStyle = 'rgba(20,80,30,.6)'; g.lineWidth = 1.5; g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, JF(x) - 2); g.stroke();
}
function drawLava(g, x0, x1, lv, t, bottom, opt = {}) {
  if (opt.jelly) return drawJelly(g, x0, x1, lv, t, bottom, opt.off || (() => 0));
  if (!FLOWPAT) FLOWPAT = g.createPattern(FLOWTEX, 'repeat');
  const O = opt.off || (() => 0), LF = (x) => lavaFront(x, lv, t) + O(x), LB2 = (x) => lavaBack(x, lv, t) + O(x) * .6;
  const st = 6, a = Math.floor(x0 / st) * st, b = Math.ceil(x1 / st) * st;
  // capa trasera semitransparente (se ve entre las crestas)
  g.beginPath(); g.moveTo(a, bottom); for (let x = a; x <= b; x += st) g.lineTo(x, LB2(x)); g.lineTo(b, bottom); g.closePath();
  g.fillStyle = 'rgba(255,170,60,.55)'; g.fill();
  g.strokeStyle = 'rgba(255,236,170,.6)'; g.lineWidth = 2; g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, LB2(x)); g.stroke();
  // cuerpo
  g.save();
  g.beginPath(); g.moveTo(a, bottom); for (let x = a; x <= b; x += st) g.lineTo(x, LF(x)); g.lineTo(b, bottom); g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, lv - 6, 0, Math.min(bottom, lv + 320));
  gr.addColorStop(0, '#fff2a0'); gr.addColorStop(.025, '#ffc93c'); gr.addColorStop(.11, '#ff8e1e'); gr.addColorStop(.38, '#e8480e'); gr.addColorStop(1, '#8a1606');
  g.fillStyle = gr; g.fillRect(a, lv - 12, b - a, bottom - lv + 12);
  // flujo suave en dos capas
  g.globalAlpha = .5; FLOWPAT.setTransform(new DOMMatrix().translateSelf(t * 14, lv).scaleSelf(2.4, .8)); g.fillStyle = FLOWPAT; g.fillRect(a, lv - 10, b - a, bottom - lv + 10);
  g.globalAlpha = .3; FLOWPAT.setTransform(new DOMMatrix().translateSelf(-t * 9 + 80, lv + 30).scaleSelf(1.7, .6)); g.fillRect(a, lv - 10, b - a, bottom - lv + 10);
  g.globalAlpha = 1;
  // burbujas brillantes bajo la superficie
  g.globalCompositeOperation = 'lighter';
  for (let k = Math.floor(a / 90); k <= b / 90; k++) {
    const h = hash1(k * 31 + 7), x = k * 90 + 45 + Math.sin(t * .4 + h * 9) * 30, y = lv + 18 + h * 60 + Math.sin(t * .7 + h * 5) * 8, rr = 14 + h * 26;
    const rg = g.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, 'rgba(255,220,120,.35)'); rg.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = rg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  g.globalCompositeOperation = 'source-over';
  // costras flotantes
  for (let k = Math.floor(a / 160); k <= b / 160; k++) {
    const h = hash1(k * 17 + 3); if (h < .45) continue;
    const x = k * 160 + ((t * (8 + h * 10) + h * 160) % 160), y = LF(x) + 5 + h * 4, w = 18 + h * 26;
    g.fillStyle = 'rgba(120,30,12,.55)'; g.beginPath(); g.ellipse(x, y, w, 3.5 + h * 2, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,220,120,.7)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, w, 3.5 + h * 2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  }
  // banda superior translúcida y brillos
  const tb = g.createLinearGradient(0, lv - 8, 0, lv + 16); tb.addColorStop(0, 'rgba(255,250,200,.85)'); tb.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = tb; g.fillRect(a, lv - 10, b - a, 28);
  g.restore();
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,225,.95)'; g.lineWidth = 2.6; g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, LF(x)); g.stroke();
  g.strokeStyle = 'rgba(255,255,240,.8)'; g.lineWidth = 2;
  for (let k = Math.floor(a / 70); k <= b / 70; k++) {
    const h = hash1(k * 5 + 1), x = k * 70 + ((t * 22 * (h > .5 ? 1 : -1) + h * 70) % 70 + 70) % 70, y = LF(x) + 6 + h * 5, w = 6 + h * 14;
    g.globalAlpha = .35 + .4 * Math.sin(t * 2 + h * 9) ** 2; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke();
  }
  g.globalAlpha = 1;
}
/* cascada de lava */
function drawLavaFall(g, x, top, bot, w, t) {
  if (!FLOWPAT) FLOWPAT = g.createPattern(FLOWTEX, 'repeat');
  g.save();
  g.beginPath(); g.moveTo(x - w / 2, top);
  for (let y = top; y <= bot; y += 10) g.lineTo(x - w / 2 - (y - top) * .025 + Math.sin(y * .05 + t * 4) * 1.6, y);
  for (let y = bot; y >= top; y -= 10) g.lineTo(x + w / 2 + (y - top) * .03 + Math.sin(y * .06 + t * 3.4) * 1.6, y);
  g.closePath(); g.clip();
  const gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, '#c43a0c'); gr.addColorStop(.35, '#ff9a24'); gr.addColorStop(.5, '#ffe080'); gr.addColorStop(.65, '#ff9a24'); gr.addColorStop(1, '#c43a0c');
  g.fillStyle = gr; g.fillRect(x - w, top, w * 2, bot - top);
  g.globalAlpha = .45; FLOWPAT.setTransform(new DOMMatrix().translateSelf(x, t * 190).scaleSelf(.4, 1.8)); g.fillStyle = FLOWPAT; g.fillRect(x - w, top, w * 2, bot - top);
  g.globalAlpha = 1; g.restore();
  g.strokeStyle = 'rgba(255,250,200,.6)'; g.lineWidth = 1.5;
  for (let s = 0; s < 3; s++) { const ox = (s - 1) * w * .28; g.beginPath(); for (let y = top; y <= bot; y += 12) g.lineTo(x + ox + Math.sin(y * .04 + t * 5 + s) * 2, y); g.stroke(); }
}

/* ---------- agua ---------- */
function waterFront(x, lv, t) { return lv + Math.sin(x * .025 - t * 1.6) * 2.2 + Math.sin(x * .07 + t * 2.4) * 1 + Math.sin(x * .011 + t * .8) * 1.6; }
function drawWater(g, x0, x1, lv, t, bottom, col = [70, 190, 210], off) {
  const O = off || (() => 0), WF = x => waterFront(x, lv, t) + O(x);
  const st = 6, a = Math.floor(x0 / st) * st, b = Math.ceil(x1 / st) * st;
  g.beginPath(); g.moveTo(a, bottom); for (let x = a; x <= b; x += st) g.lineTo(x, lv - 4 + Math.sin(x * .02 + t * 1.2 + 2) * 2.5); g.lineTo(b, bottom); g.closePath();
  g.fillStyle = rgba(mixc(col, [255, 255, 255], .4), .28); g.fill();
  g.save(); g.beginPath(); g.moveTo(a, bottom); for (let x = a; x <= b; x += st) g.lineTo(x, WF(x)); g.lineTo(b, bottom); g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, lv, 0, Math.min(bottom, lv + 260));
  gr.addColorStop(0, rgba(mixc(col, [255, 255, 255], .3), .5)); gr.addColorStop(.25, rgba(col, .62)); gr.addColorStop(1, rgba(scalec(col, .35), .92));
  g.fillStyle = gr; g.fillRect(a, lv - 8, b - a, bottom - lv + 8);
  // cáusticas
  g.globalCompositeOperation = 'lighter';
  for (let k = Math.floor(a / 40); k <= b / 40; k++) for (let j = 0; j < 4; j++) {
    const h = hash2(k, j), x = k * 40 + h * 40 + Math.sin(t * .9 + h * 9) * 10, y = lv + 16 + j * 26 + h * 14, w = 10 + h * 22;
    g.globalAlpha = (.05 + .1 * Math.sin(t * 1.3 + h * 20) ** 2) * (1 - j * .2); g.strokeStyle = '#d8ffff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y - 4 + Math.sin(t * 2 + h * 7) * 3, x + w / 2, y); g.stroke();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over'; g.restore();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); for (let x = a; x <= b; x += st) g.lineTo(x, WF(x)); g.stroke();
  for (let k = Math.floor(a / 50); k <= b / 50; k++) {
    const h = hash1(k * 13 + 2), x = k * 50 + ((t * 12 + h * 50) % 50), y = WF(x) + 4 + h * 6;
    g.globalAlpha = .3 + .4 * Math.sin(t * 1.7 + h * 7) ** 2; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.stroke();
  }
  g.globalAlpha = 1;
}

/* ---------- vegetación dinámica ---------- */
function drawGrass(g, blades, x0, x1, t, cols, push) {
  for (let c = 0; c < cols.length; c++) {
    g.fillStyle = cols[c]; g.beginPath();
    for (const b of blades) {
      if (b.c !== c || b.x < x0 || b.x > x1) continue;
      let sw = Math.sin(t * 1.7 + b.x * .045) * .2 + Math.sin(t * .55 + b.x * .009) * .14;
      if (push) for (const p of push) { const dx = b.x - p.x; if (Math.abs(dx) < 30 && Math.abs(p.y - b.y) < 40) sw += Math.sign(dx || 1) * (1 - Math.abs(dx) / 30) * .95; }
      const l = b.lean + sw, tx = b.x + l * b.h, ty = b.y - b.h * Math.cos(l * .8), cx = b.x + l * b.h * .3, cy = b.y - b.h * .55;
      g.moveTo(b.x - b.w, b.y); g.quadraticCurveTo(cx, cy, tx, ty); g.quadraticCurveTo(cx + 1, cy + 1, b.x + b.w, b.y);
    }
    g.fill();
  }
}
function drawPalm(g, p, t) {
  const sway = Math.sin(t * .8 + p.ph) * .04, S = p.s;
  g.save(); g.translate(p.x, p.y);
  // tronco curvo y cónico
  const segs = 12; let px = 0, py = 0, ang = -Math.PI / 2 + p.lean; const pts = [[0, 0, ang]];
  for (let i = 0; i < segs; i++) { ang += p.curve / segs + sway * (i / segs); px += Math.cos(ang) * p.h / segs; py += Math.sin(ang) * p.h / segs; pts.push([px, py, ang]); }
  const L = [], Rr = [];
  for (let i = 0; i <= segs; i++) { const [x, y, a] = pts[i], w = lerp(8.5, 4.6, i / segs) * S * (i === 0 ? 1.5 : 1), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2); L.push([x - nx * w, y - ny * w]); Rr.push([x + nx * w, y + ny * w]); }
  const trunk = () => { g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const q of L) g.lineTo(q[0], q[1]); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath(); };
  g.fillStyle = '#a8784a'; trunk(); g.fill();
  g.save(); trunk(); g.clip();
  g.fillStyle = '#7a5232'; g.beginPath(); for (let i = 0; i <= segs; i++) { const m = pts[i]; g.lineTo((m[0] + Rr[i][0]) / 2 + 1, (m[1] + Rr[i][1]) / 2); } for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0] + 4, Rr[i][1]); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(70,44,26,.55)'; g.lineWidth = 1.3 * S;
  for (let i = 1; i < segs; i++) { const a = L[i], b2 = Rr[i], m = pts[i]; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0] + Math.cos(m[2]) * 3, m[1] + Math.sin(m[2]) * 3, b2[0], b2[1]); g.stroke(); }
  g.strokeStyle = 'rgba(255,226,170,.55)'; g.lineWidth = 2 * S; g.beginPath(); for (let i = 0; i <= segs; i++) g.lineTo(L[i][0] + (pts[i][0] - L[i][0]) * .25, L[i][1] + (pts[i][1] - L[i][1]) * .25); g.stroke();
  g.restore();
  const top = pts[segs];
  // frondas traseras, cocos, frondas delanteras
  const frond = (base, len, droop, front) => {
    g.save(); g.translate(top[0], top[1]); g.rotate(base);
    const N = 12, up = [], dn = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = u * len, y = len * .38 * droop * u * u - len * .07 * Math.sin(u * Math.PI);
      const w = len * .2 * Math.sin(Math.pow(u, .55) * Math.PI) * (i % 2 ? 1 : .55);
      up.push([x + len * .03, y - w]); dn.push([x + len * .03, y + w * .9]);
    }
    const sp = i => [i / N * len, len * .38 * droop * (i / N) ** 2 - len * .07 * Math.sin(i / N * Math.PI)];
    g.fillStyle = front ? '#2f7a3c' : '#24603a'; g.beginPath(); g.moveTo(0, 0); for (const q of up) g.lineTo(q[0], q[1]); for (let i = dn.length - 1; i >= 0; i--) g.lineTo(dn[i][0], dn[i][1]); g.closePath(); g.fill();
    g.fillStyle = front ? '#55a84a' : '#3f8a44'; g.beginPath(); g.moveTo(0, 0); for (const q of up) g.lineTo(q[0], q[1]); for (let i = N; i >= 0; i--) { const q = sp(i); g.lineTo(q[0], q[1]); } g.closePath(); g.fill();
    g.strokeStyle = front ? '#a4d870' : '#7ab65e'; g.lineWidth = 1.6 * S; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= N; i++) { const q = sp(i); g.lineTo(q[0], q[1]); } g.stroke();
    g.restore();
  };
  for (let f = 0; f < 4; f++) frond(-Math.PI / 2 + (f - 1.5) * .9 + Math.sin(t * 1.3 + p.ph + f) * .05 + sway * 2, (78 + (f % 2) * 16) * S, 1.1 + Math.abs(f - 1.5) * .2, false);
  for (let k = 0; k < 3; k++) { const cx = top[0] - 6 * S + k * 6 * S, cy = top[1] + 7 * S; g.fillStyle = '#5a3a1c'; g.beginPath(); g.arc(cx, cy, 5.6 * S, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,220,170,.35)'; g.beginPath(); g.arc(cx - 1.6 * S, cy - 1.8 * S, 2 * S, 0, TAU); g.fill(); }
  for (let f = 0; f < 5; f++) frond(-Math.PI / 2 + (f - 2) * .62 + Math.sin(t * 1.3 + p.ph + f * 2) * .06 + sway * 2, (86 + (f % 2) * 20) * S, .9 + Math.abs(f - 2) * .28, true);
  g.restore();
}
function drawSeaweed(g, s, t) {
  g.strokeStyle = s.col; g.lineWidth = s.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.x, s.y);
  let x = s.x, y = s.y; for (let i = 1; i <= 8; i++) { x += Math.sin(t * 1.4 + s.ph + i * .6) * 2.2 * (i / 8); y -= s.h / 8; g.lineTo(x, y); }
  g.stroke();
}
function drawMushroom(g, m, t, glowCol) {
  const s = m.s, y = m.y, sw = Math.sin(t * 1.1 + m.ph) * .05;
  g.save(); g.translate(m.x, y); g.rotate(sw); g.scale(m.fl ? -s : s, s);
  g.fillStyle = '#e4ece6'; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(-5, -11, -2, -19); g.lineTo(2.5, -19); g.quadraticCurveTo(1, -10, 3.5, 0); g.fill();
  const pu = .8 + Math.sin(t * 2 + m.ph) * .2, cg = g.createRadialGradient(-3, -25, 1, 0, -20, 15);
  cg.addColorStop(0, rgba(mixc(glowCol, [255, 255, 255], .6 * pu))); cg.addColorStop(.6, rgba(glowCol)); cg.addColorStop(1, rgba(scalec(glowCol, .4)));
  g.fillStyle = cg; g.beginPath(); g.ellipse(0, -19, 13, 9, 0, Math.PI, 0); g.quadraticCurveTo(0, -15, -13, -19); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-5, -23, 1.7, 0, TAU); g.arc(3, -25, 1.3, 0, TAU); g.arc(7, -21, 1, 0, TAU); g.fill();
  g.restore();
}
function drawFern(g, x, y, s, flip, cols, t = 0) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  for (let f = 0; f < 5; f++) {
    const a = -1.95 + f * .42 + Math.sin(t * 1.2 + x * .01 + f) * .03, L = 46 + f % 2 * 14, ex = Math.cos(a) * L, ey = Math.sin(a) * L * 1.1;
    g.strokeStyle = cols[0]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(ex * .4, ey * .9, ex, ey + L * .25); g.stroke();
    for (let i = 1; i < 10; i++) {
      const tt = i / 10, px = ex * tt * .98, py = ey * tt + tt * tt * L * .25, len = (1 - tt) * 12 + 3;
      g.fillStyle = cols[i % 2]; g.beginPath(); g.ellipse(px, py, len, 2.4, a + 1.2, 0, TAU); g.fill(); g.beginPath(); g.ellipse(px, py, len, 2.4, a - 1.2 + Math.PI, 0, TAU); g.fill();
    }
  }
  g.restore();
}
function drawVine(g, v, t) {
  const n = Math.max(3, v.len / 14 | 0); let px = v.x, py = v.y; const pts = [[px, py]];
  for (let i = 1; i <= n; i++) { const a = Math.sin(t * .9 + v.ph + i * .25) * .035 * i; px += Math.sin(a) * 14; py += Math.cos(a) * 14; pts.push([px, py]); }
  g.strokeStyle = v.col || '#26321e'; g.lineWidth = v.th; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts) g.lineTo(q[0], q[1]); g.stroke();
  if (v.leafy) for (let i = 2; i < pts.length; i += 2) { const q = pts[i], s = i % 4 ? 1 : -1; g.fillStyle = i % 4 ? '#4f7a34' : '#6d9a3f'; g.beginPath(); g.ellipse(q[0] + s * 4, q[1], 5, 2.4, s * .6, 0, TAU); g.fill(); }
  if (v.flower) { const q = pts[pts.length - 1]; g.fillStyle = v.flower; g.beginPath(); g.arc(q[0], q[1] + 3, 3, 0, TAU); g.fill(); }
  return pts[pts.length - 1];
}
function drawCrystals(g, x, y, n, s, col, dir = -1, seed = 1) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const L = (16 + r() * s) * (i === 0 ? 1.35 : 1), w = 5 + r() * 7, a = (r() - .5) * 1.1, px = x + (r() - .5) * s * .6;
    g.save(); g.translate(px, y); g.rotate(a); g.scale(1, -dir);
    g.fillStyle = rgba(scalec(col, .5)); g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -L * .75); g.lineTo(0, -L); g.lineTo(0, 0); g.fill();
    g.fillStyle = rgba(col); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L); g.lineTo(w / 2, -L * .75); g.lineTo(w / 2, 0); g.fill();
    g.fillStyle = rgba(mixc(col, [255, 255, 255], .6)); g.beginPath(); g.moveTo(0, -L); g.lineTo(w / 2, -L * .75); g.lineTo(w * .1, -L * .7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * .25, -2); g.lineTo(w * .25, -L * .72); g.stroke();
    g.restore();
  }
}
function drawShell(g, x, y, s, col, a) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  g.fillStyle = rgba(col); g.beginPath(); g.moveTo(-8, 0); g.quadraticCurveTo(-9, -10, 0, -11); g.quadraticCurveTo(9, -10, 8, 0); g.closePath(); g.fill();
  g.strokeStyle = rgba(scalec(col, .7)); g.lineWidth = 1; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(0, -1); g.lineTo(k * 2.6, -10 + Math.abs(k) * .8); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-3, -7, 2, 1.2, -.4, 0, TAU); g.fill();
  g.restore();
}
function drawStarfish(g, x, y, s, a) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s * .55);
  g.fillStyle = '#ef7a52'; g.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 11, an = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
  g.closePath(); g.fill(); g.fillStyle = '#ffd0a8'; for (let i = 0; i < 5; i++) { const an = i * Math.PI * 2 / 5 - Math.PI / 2; g.beginPath(); g.arc(Math.cos(an) * 5, Math.sin(an) * 5, 1.1, 0, TAU); g.fill(); }
  g.restore();
}
function drawFlower(g, f, t) {
  const sw = Math.sin(t * 1.5 + f.ph) * 4, y = f.y;
  g.strokeStyle = '#3c6a2b'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(f.x, y); g.quadraticCurveTo(f.x + sw * .3, y - f.h * .6, f.x + sw, y - f.h); g.stroke();
  g.fillStyle = rgba(f.c); for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + f.ph; g.beginPath(); g.ellipse(f.x + sw + Math.cos(a) * 3, y - f.h + Math.sin(a) * 3, 2.6, 1.6, a, 0, TAU); g.fill(); }
  g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(f.x + sw, y - f.h, 1.6, 0, TAU); g.fill();
}

