"use strict";
/* =====================================================================
   BIOMAS: cielos, fondos con paralaje (con relieve), primer plano,
   decoración, luz ambiente y música de cada lugar.
   ===================================================================== */
const TW = 1600, TH = 1000;

const BIOMES = {
  title: {
    name: 'English Quest', sky: [['#2a86dc', 0], ['#5fb0ec', .38], ['#b6def6', .72], ['#f4efd8', 1]], sun: { x: .2, y: .17, r: 44, col: [255, 246, 220] }, clouds: 1, sea: { col: [38, 140, 192], deep: [18, 78, 128], horizon: 545 },
    ambient: [255, 251, 245], relief: { amb: .5, sky: [210, 235, 255], skyK: .22, depth: .5 }, fog: [200, 228, 246],
    far: 'sea', mid: 'seastacks', fg: 'beach', music: 'menu', particles: 'beach', cover: 'grass', grass: ['#5f9a3a', '#7fb848', '#a8d468'], lightK: 0
  },
  beach: {
    name: 'Playa', sky: [['#3d9be8', 0], ['#7cc6f2', .45], ['#c9ecf7', .72], ['#fde9c2', 1]], sun: { x: .78, y: .14, r: 46, col: [255, 246, 214] }, clouds: 1, sea: { col: [46, 150, 205], deep: [20, 90, 150], horizon: 545 },
    ambient: [255, 251, 245], relief: { amb: .5, sky: [210, 235, 255], skyK: .22, depth: .5 }, fog: [190, 225, 245],
    far: 'sea', mid: 'seastacks', fg: 'beach', music: 'beach', particles: 'beach', cover: 'sand', grass: ['#7fa64a', '#9cc05a', '#bcd77a'], lightK: 0
  },
  tidecave: {
    name: 'Gruta de las Mareas', sky: [['#0b1e2a', 0], ['#123342', 1]], ambient: [86, 116, 146], relief: { amb: .44, sky: [120, 200, 220], skyK: .25, depth: .6 }, fog: [30, 70, 90],
    far: 'cavewall', farTint: [60, 110, 130], mid: 'stalag', midMat: 'wetrock', fg: 'cave', music: 'cave', particles: 'drips', cover: 'wet', grass: ['#2f6a5a', '#3f8a6e', '#5aa88a'], lightK: 1
  },
  cliff: {
    name: 'Acantilado del Ocaso', sky: [['#2c2a6a', 0], ['#7a4c8c', .3], ['#ef8a6a', .62], ['#ffd08a', .85], ['#ffe6b0', 1]], sun: { x: .3, y: .5, r: 70, col: [255, 214, 150] }, clouds: 1, sea: { col: [190, 110, 120], deep: [70, 50, 110], horizon: 600 },
    ambient: [255, 218, 196], relief: { amb: .48, sky: [255, 190, 170], skyK: .3, depth: .5, light: [.6, -.55, .5] }, fog: [240, 170, 160],
    far: 'mountains', mid: 'cliffs', fg: 'meadow', music: 'beach', particles: 'petals', cover: 'grass', grass: ['#4f7a3a', '#6e9a46', '#a4c060'], lightK: 0
  },
  forest: {
    name: 'Bosque Susurro', sky: [['#9fd3b8', 0], ['#d6efc8', .6], ['#f4f0c8', 1]], sun: { x: .7, y: .08, r: 40, col: [255, 252, 220] },
    ambient: [214, 230, 196], relief: { amb: .48, sky: [200, 240, 190], skyK: .2, depth: .55 }, fog: [170, 210, 170],
    far: 'trees', mid: 'trunks', fg: 'ferns', music: 'forest', particles: 'forest', cover: 'grass', grass: ['#3f7a2c', '#5d9a3a', '#8cc152'], lightK: .3, rays: 1
  },
  mushroom: {
    name: 'Arboleda Lumínica', sky: [['#141030', 0], ['#2c2058', .5], ['#58408a', 1]], stars: 1,
    ambient: [120, 108, 176], relief: { amb: .42, sky: [190, 160, 255], skyK: .25, depth: .6 }, fog: [70, 50, 110],
    far: 'giantshrooms', mid: 'shrooms', fg: 'ferns_dark', music: 'mystic', particles: 'spores', cover: 'darkgrass', grass: ['#2f5a5a', '#3f7470', '#5e9a90'], lightK: 1
  },
  ruins: {
    name: 'Ruinas Antiguas', sky: [['#a6c2c8', 0], ['#d8e2d6', .6], ['#efe6cc', 1]], sun: { x: .2, y: .1, r: 38, col: [255, 250, 230] }, clouds: 1,
    ambient: [214, 214, 202], relief: { amb: .48, sky: [220, 230, 230], skyK: .2, depth: .55 }, fog: [190, 200, 190],
    far: 'temples', mid: 'columns', fg: 'vines', music: 'ruins', particles: 'dust', cover: 'moss', grass: ['#4c6e34', '#668c42', '#8fb15a'], lightK: .2, rays: 1
  },
  cave: {
    name: 'Cuevas de Cristal', sky: [['#0a0a14', 0], ['#141424', 1]], ambient: [72, 74, 108], relief: { amb: .42, sky: [150, 160, 220], skyK: .18, depth: .62 }, fog: [26, 26, 44],
    far: 'cavewall', farTint: [70, 70, 110], mid: 'stalag', midMat: 'rock', fg: 'cave', music: 'cave', particles: 'cavedust', cover: null, grass: ['#3c4c5a', '#4c5e6e', '#647888'], lightK: 1
  },
  lava: {
    name: 'Cueva Ígnea', sky: [['#120808', 0], ['#2a0e0a', 1]], ambient: [100, 70, 66], relief: { amb: .42, sky: [255, 140, 90], skyK: .22, depth: .6 }, fog: [60, 20, 14],
    far: 'lavawall', farTint: [110, 50, 40], mid: 'stalag', midMat: 'basalt', fg: 'lavarocks', music: 'lava', particles: 'embers', cover: 'ash', grass: ['#4a3a30', '#5a4636', '#6e5640'], lightK: 1
  },
  core: {
    name: 'Corazón de Magma', sky: [['#2a0806', 0], ['#5a1408', .6], ['#a83010', 1]], ambient: [130, 74, 60], relief: { amb: .44, sky: [255, 120, 70], skyK: .3, depth: .55 }, fog: [120, 30, 10],
    far: 'lavawall', farTint: [150, 50, 30], mid: 'stalag', midMat: 'basalt', fg: 'lavarocks', music: 'boss', particles: 'embers', cover: 'ash', grass: ['#4a3a30', '#5a4636', '#6e5640'], lightK: 1
  },
  sky: {
    name: 'Reino de las Nubes', sky: [['#5aa8f0', 0], ['#9ad0f8', .5], ['#e8f4ff', 1]], sun: { x: .82, y: .12, r: 50, col: [255, 250, 230] }, clouds: 1,
    ambient: [255, 252, 250], relief: { amb: .55, sky: [230, 240, 255], skyK: .3, depth: .35 }, fog: [210, 230, 250],
    far: 'skyislands', mid: 'cloudbanks', fg: 'clouds', music: 'sky', particles: 'feathers', cover: 'cloud', grass: ['#8ac06a', '#a8d880', '#c8ec9a'], lightK: 0
  },
  castle: {
    name: 'Fortaleza Carmesí', sky: [['#1a0810', 0], ['#5a1420', .55], ['#c04030', 1]], sun: { x: .15, y: .3, r: 60, col: [255, 120, 90] }, stars: 1,
    ambient: [200, 140, 140], relief: { amb: .46, sky: [255, 150, 130], skyK: .25, depth: .55 }, fog: [110, 40, 50],
    far: 'castle', mid: 'battlements', fg: 'lavarocks', music: 'castle', particles: 'embers', cover: null, grass: ['#4a3a30', '#5a4636', '#6e5640'], lightK: .6
  },
  clockwork: {
    name: 'Santuario del Tiempo', sky: [['#1c2440', 0], ['#3c4e78', .5], ['#c8b88a', 1]], stars: 1,
    ambient: [190, 186, 200], relief: { amb: .46, sky: [200, 210, 255], skyK: .25, depth: .55 }, fog: [90, 100, 130],
    far: 'clocktowers', mid: 'gears', fg: 'pipes', music: 'clock', particles: 'dust', cover: 'moss', grass: ['#4c6e34', '#668c42', '#8fb15a'], lightK: .5
  }
};

/* ---------- capas de fondo (se construyen una vez por nivel) ---------- */
const BG_CACHE = {};
function buildBiomeLayers(key) {
  if (BG_CACHE[key]) return BG_CACHE[key];
  const B = BIOMES[key], out = { far: null, mid: null, fg: [] };
  out.far = paintFar(B.far, B);
  out.mid = paintMid(B.mid, B);
  out.fg = paintFG(B.fg);
  BG_CACHE[key] = out; return out;
}
function wrapDraw(W, fn) { fn(0); fn(-W); fn(W); }

/* dibuja cerca de los bordes también desplazado ±TW para que el mosaico no tenga costuras */
function wrapNear(x, span, fn) { fn(0); if (x - span < 0) fn(TW); if (x + span > TW) fn(-TW); }

/* =================== CAPA LEJANA =================== */
function paintFar(type, B) {
  const c = mk(TW, TH), g = c.getContext('2d'), r = mulberry32(type.length * 977 + 3), fog = B.fog;
  if (type === 'sea' || type === 'mountains') {
    const hz = B.sea.horizon;
    if (type === 'mountains') paintRanges(g, hz + 4, 3, [[96, 70, 130], [150, 96, 140], [200, 120, 130]], [[255, 190, 150], [255, 200, 160], [255, 210, 170]], fog, [.62, .42, .25], r, -1);
    else for (let layer = 0; layer < 2; layer++) {
      const col = mixc([96, 140, 170], fog, .72 - layer * .12);
      g.fillStyle = rgba(col); g.beginPath(); g.moveTo(0, hz + 2);
      for (let x = 0; x <= TW; x += 10) { const u = x / TW; const hh = (18 + 46 * fbm1(u * 6 + layer * 3.3, 4) + 26 * Math.max(0, Math.sin(u * TAU * 2 + layer))) * (layer ? 1.25 : .8); g.lineTo(x, hz - hh * (layer ? .7 : .5)); }
      g.lineTo(TW, hz + 2); g.closePath(); g.fill();
    }
    const isl = type === 'sea' ? [[.1, 300, 92, .5], [.42, 210, 64, .6], [.78, 360, 120, .42]] : [[.15, 260, 70, .55], [.6, 240, 60, .6]];
    for (const [fx, w, h, fk] of isl) wrapNear(fx * TW, w, ox => paintIsland(g, ox + fx * TW, hz, w, h, fk, fog, mulberry32((fx * 1000) | 0), type === 'sea'));
    if (type === 'sea') paintSeaProps(g, hz, fog, r);
  } else if (type === 'trees') {
    const base = 790;
    for (let layer = 0; layer < 3; layer++) {
      const fk = .66 - layer * .2, rr = mulberry32(layer * 31 + 5);
      for (let x = -40; x < TW + 40; x += 64 + rr() * 80) {
        const h = 230 + rr() * 220 - layer * 30, w = 14 + rr() * 10 + layer * 5, kind = rr() < .28 ? 'pine' : 'round', seed = (x | 0) + layer * 1000;
        wrapNear(x, 160, ox => paintTree(g, ox + x, base + layer * 46, h, w, { r: mulberry32(seed), fog, fk, kind, leaf: layer === 2 ? PAL.leafSpring : PAL.leafDeep, lean: 0 }));
      }
      const mg = g.createLinearGradient(0, base + layer * 46 - 160, 0, base + layer * 46 + 30); mg.addColorStop(0, rgba(fog, 0)); mg.addColorStop(1, rgba(fog, .5 - layer * .12));
      g.fillStyle = mg; g.fillRect(0, base + layer * 46 - 160, TW, 190);
    }
    g.fillStyle = rgba(mixc([46, 90, 60], fog, .35)); g.fillRect(0, base + 120, TW, TH);
  } else if (type === 'temples') {
    paintRanges(g, 700, 2, [[130, 150, 150], [150, 166, 160]], [[230, 236, 220], [236, 240, 226]], fog, [.6, .45], r, 1);
    for (let k = 0; k < 6; k++) {
      const x = 120 + k * 270 + r() * 80, base = 760 + r() * 30, fk = .5;
      wrapNear(x, 160, ox => paintTemple(g, ox + x, base, 80 + r() * 90, mulberry32(k * 17 + 3), fog, fk));
      for (let j = 0; j < 2; j++) { const tx = x + (r() - .5) * 260; wrapNear(tx, 120, ox => paintTree(g, ox + tx, base + 30, 120 + r() * 80, 10, { r: mulberry32(k * 9 + j), fog, fk: .55, leaf: PAL.leafSpring })); }
    }
    const mg = g.createLinearGradient(0, 640, 0, 860); mg.addColorStop(0, rgba(fog, 0)); mg.addColorStop(1, rgba(fog, .6)); g.fillStyle = mg; g.fillRect(0, 640, TW, 220);
    g.fillStyle = rgba(mixc([90, 120, 90], fog, .45)); g.fillRect(0, 850, TW, TH);
  } else if (type === 'giantshrooms') {
    for (let layer = 0; layer < 2; layer++) {
      const fk = .5 - layer * .2;
      for (let k = 0; k < 6; k++) {
        const x = r() * TW, h = 300 + r() * 300, w = 18 + r() * 18, cw = 110 + r() * 130, base = 830 + layer * 50, capc = pick([[90, 220, 230], [230, 120, 220], [150, 140, 255]]);
        wrapNear(x, cw, ox => paintShroom(g, ox + x, base, h, w, cw, capc, fog, fk, mulberry32(k * 7 + layer)));
      }
    }
    g.fillStyle = rgba(mixc([30, 20, 60], fog, .3)); g.fillRect(0, 860, TW, TH);
  } else if (type === 'skyislands') {
    for (let layer = 0; layer < 3; layer++) {
      const fk = .7 - layer * .22;
      for (let k = 0; k < 4 + layer; k++) {
        const x = r() * TW, y = 380 + r() * 260 + layer * 70, w = (90 + r() * 150) * (.6 + layer * .3);
        wrapNear(x, w, ox => paintFloatIsland(g, ox + x, y, w, { r: mulberry32(k * 13 + layer * 7), fog, fk, trees: w > 140 ? 2 : 1, fall: r() < .5, stone: PAL.stoneGrey }));
      }
    }
    // mar de nubes
    for (let k = 0; k < 40; k++) { const x = r() * TW, y = 860 + r() * 80, rr = 50 + r() * 70; wrapNear(x, rr, ox => { g.fillStyle = rgba(mixc([255, 255, 255], fog, .2)); g.beginPath(); g.arc(ox + x, y, rr, 0, TAU); g.fill(); }); }
    g.fillStyle = rgba(mixc([255, 255, 255], fog, .2)); g.fillRect(0, 900, TW, TH);
  } else if (type === 'castle') {
    paintRanges(g, 820, 2, [[50, 16, 30], [70, 22, 36]], [[160, 60, 60], [190, 70, 60]], fog, [.35, .22], r, -1);
    const col = mixc([34, 10, 22], fog, .25), lit = mixc([140, 50, 50], fog, .25);
    for (let k = 0; k < 7; k++) { const x = 110 + k * 230 + r() * 80, w = 40 + r() * 50, h = 180 + r() * 300; wrapNear(x, w * 2, ox => paintTower(g, ox + x, 820, w, h, col, lit, mulberry32(k * 31))); }
    g.fillStyle = rgba(col); g.fillRect(0, 760, TW, TH); for (let x = 0; x < TW; x += 34) g.fillRect(x, 742, 20, 20); g.fillStyle = rgba(lit, .45); g.fillRect(0, 760, TW, 3);
  } else if (type === 'clocktowers') {
    paintRanges(g, 780, 2, [[60, 66, 100], [80, 84, 116]], [[200, 180, 150], [220, 196, 160]], fog, [.5, .35], r, 1);
    const col = mixc([44, 46, 70], fog, .3), lit = mixc([210, 170, 110], fog, .3);
    for (let k = 0; k < 4; k++) { const x = 200 + k * 400 + r() * 100, R = 90 + r() * 120; wrapNear(x, R, ox => paintGearIll(g, ox + x, 560 + r() * 140, R, r() * 3, PAL.iron, fog, .55)); }
    for (let k = 0; k < 14; k++) { const x = r() * TW, w = 40 + r() * 70, h = 160 + r() * 260; wrapNear(x, w, ox => paintCityBlock(g, ox + x, 820, w, h, col, lit, mulberry32(k * 19))); }
    wrapNear(TW * .55, 120, ox => paintClockTower(g, ox + TW * .55, 820, 110, 520, col, lit, fog));
    g.fillStyle = rgba(col); g.fillRect(0, 810, TW, TH);
  } else if (type === 'cavewall' || type === 'lavawall') {
    const t = B.farTint || [60, 60, 90];
    const gr = g.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, rgba(scalec(t, .18))); gr.addColorStop(.6, rgba(scalec(t, .3))); gr.addColorStop(1, rgba(scalec(t, type === 'lavawall' ? .55 : .22)));
    g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
    for (let i = 0; i < 60; i++) { const x = r() * TW, y = r() * TH, rr = 60 + r() * 200; const rg = g.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, i % 3 ? 'rgba(0,0,0,.22)' : rgba(scalec(t, .5), .18)); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (let x = 0; x < TW; x += 90 + r() * 140) { const w = 50 + r() * 130, h = 220 + r() * 480; wrapDraw(TW, ox => { spikePath(g, ox + x, TH + 10, w, h, -1, x | 0); g.fillStyle = rgba(scalec(t, .26)); g.fill(); }); }
    for (let x = 0; x < TW; x += 60 + r() * 120) { const w = 30 + r() * 90, h = 80 + r() * 260; wrapDraw(TW, ox => { spikePath(g, ox + x, -10, w, h, 1, (x * 3) | 0); g.fillStyle = rgba(scalec(t, .16)); g.fill(); }); }
    if (type === 'lavawall') {
      for (const lx of [TW * .2, TW * .55, TW * .85]) {
        const top = 220 + r() * 200; g.fillStyle = 'rgba(255,150,60,.85)'; g.beginPath(); g.moveTo(lx - 3, top); for (let y = top; y < TH; y += 14) g.lineTo(lx - 3 - (y - top) * .01 + Math.sin(y * .07) * 1.2, y); for (let y = TH; y > top; y -= 14) g.lineTo(lx + 3 + (y - top) * .012, y); g.fill();
        const hg = g.createLinearGradient(lx - 30, 0, lx + 30, 0); hg.addColorStop(0, 'rgba(255,90,20,0)'); hg.addColorStop(.5, 'rgba(255,90,20,.25)'); hg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = hg; g.fillRect(lx - 30, top, 60, TH);
      }
      const lg = g.createLinearGradient(0, TH, 0, TH - 360); lg.addColorStop(0, 'rgba(255,110,30,.55)'); lg.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = lg; g.fillRect(0, TH - 360, TW, 360);
    } else {
      for (let i = 0; i < 40; i++) { const x = r() * TW, y = 200 + r() * 600; g.fillStyle = rgba(mixc(t, [200, 230, 255], .6), .5); g.fillRect(x, y, 2, 2); }
    }
  }
  return c;
}
/* cordilleras con caras iluminadas por pico (dir: -1 sol a la izquierda, 1 a la derecha) */
function paintRanges(g, base, n, cols, lits, fog, fks, r, dir) {
  for (let layer = 0; layer < n; layer++) {
    const col = mixc(cols[layer], fog, fks[layer]), lit = mixc(lits[layer], fog, fks[layer] + .1), pts = [];
    const amp = 140 + 70 * layer, seed = layer * 5.3 + 1;
    for (let x = -60; x <= TW + 60; x += 30) { const u = x / TW; pts.push([x, base + layer * 20 - (amp * .35 + amp * fbm1(u * 3 + seed, 4) + amp * .5 * Math.max(0, Math.sin(u * TAU * (2 + layer) + seed)))]); }
    const shape = () => { g.beginPath(); g.moveTo(-60, base + 260); for (const p of pts) g.lineTo(p[0], p[1]); g.lineTo(TW + 60, base + 260); g.closePath(); };
    g.fillStyle = rgba(col); shape(); g.fill();
    g.save(); shape(); g.clip();
    for (let i = 1; i < pts.length - 1; i++) {
      if (!(pts[i][1] < pts[i - 1][1] && pts[i][1] <= pts[i + 1][1])) continue;      // cima
      let j = i; if (dir < 0) { while (j > 0 && pts[j - 1][1] > pts[j][1]) j--; } else { while (j < pts.length - 1 && pts[j + 1][1] > pts[j][1]) j++; }
      const P = pts[i], V = pts[j], C = [lerp(P[0], V[0], .3), Math.max(V[1], P[1]) + (base - P[1]) * .9];
      const gr = g.createLinearGradient(0, P[1], 0, C[1]); gr.addColorStop(0, rgba(lit, .9)); gr.addColorStop(1, rgba(lit, .2));
      g.fillStyle = gr; g.beginPath(); g.moveTo(P[0], P[1]);
      for (let k = i; k !== j; k += (dir < 0 ? -1 : 1)) g.lineTo(pts[k][0], pts[k][1]);
      g.lineTo(V[0], V[1]); g.lineTo(C[0], C[1]); g.closePath(); g.fill();
      g.strokeStyle = rgba(mixc(lit, [255, 255, 255], .3), .7); g.lineWidth = 2; g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(pts[i + (dir < 0 ? -1 : 1)][0], pts[i + (dir < 0 ? -1 : 1)][1]); g.stroke();
    }
    g.restore();
  }
}
function paintSeaProps(g, hz, fog, r) {
  // faro sobre su peñón
  const lx = TW * .64, base = hz - 4;
  g.fillStyle = rgba(mixc([92, 96, 104], fog, .5)); g.beginPath(); g.moveTo(lx - 70, hz + 2); g.quadraticCurveTo(lx - 50, base - 30, lx - 10, base - 34); g.quadraticCurveTo(lx + 40, base - 30, lx + 70, hz + 2); g.fill();
  const tw = mixc([238, 232, 222], fog, .3), tr = mixc([200, 70, 64], fog, .3), top = base - 128;
  g.fillStyle = rgba(tw); g.beginPath(); g.moveTo(lx - 11, base - 30); g.lineTo(lx - 7, top + 18); g.lineTo(lx + 7, top + 18); g.lineTo(lx + 11, base - 30); g.closePath(); g.fill();
  g.save(); g.clip(); g.fillStyle = rgba(tr); for (let k = 0; k < 4; k++) g.fillRect(lx - 14, base - 46 - k * 22, 28, 11); g.fillStyle = rgba(mixc([120, 120, 130], fog, .3), .35); g.fillRect(lx + 2, base - 140, 12, 120); g.restore();
  g.fillStyle = rgba(mixc([60, 64, 70], fog, .3)); g.fillRect(lx - 11, top + 14, 22, 4); g.fillRect(lx - 6, top - 2, 12, 16);
  g.fillStyle = 'rgba(255,236,170,.95)'; g.fillRect(lx - 4, top + 1, 8, 10);
  g.fillStyle = rgba(mixc([170, 60, 50], fog, .3)); g.beginPath(); g.moveTo(lx - 8, top - 2); g.lineTo(lx, top - 12); g.lineTo(lx + 8, top - 2); g.fill();
  g.fillStyle = rgba(mixc([210, 200, 190], fog, .35)); g.fillRect(lx + 14, base - 46, 26, 16); g.fillStyle = rgba(mixc([150, 70, 60], fog, .35)); g.beginPath(); g.moveTo(lx + 11, base - 46); g.lineTo(lx + 27, base - 58); g.lineTo(lx + 43, base - 46); g.fill();
  // velero
  const sx = TW * .23, sy = hz - 3, hullC = rgba(mixc([70, 50, 44], fog, .4)), sail = mixc([250, 244, 230], fog, .25);
  g.fillStyle = hullC; g.beginPath(); g.moveTo(sx - 46, sy - 12); g.lineTo(sx + 50, sy - 12); g.quadraticCurveTo(sx + 40, sy, sx + 30, sy); g.lineTo(sx - 34, sy); g.quadraticCurveTo(sx - 42, sy - 4, sx - 46, sy - 12); g.fill();
  g.fillRect(sx - 1, sy - 84, 2.4, 74); g.fillRect(sx - 24, sy - 62, 2, 52); g.fillRect(sx + 22, sy - 56, 2, 46);
  const sailP = (x, y0, y1, bw) => { const sg = g.createLinearGradient(x, 0, x + bw, 0); sg.addColorStop(0, rgba(scalec(sail, .82))); sg.addColorStop(1, rgba(sail)); g.fillStyle = sg; g.beginPath(); g.moveTo(x + 2, y0); g.quadraticCurveTo(x + bw * 1.15, (y0 + y1) / 2, x + 2, y1); g.closePath(); g.fill(); };
  sailP(sx, sy - 82, sy - 50, 24); sailP(sx, sy - 48, sy - 16, 30); sailP(sx - 23, sy - 60, sy - 18, 22); sailP(sx + 23, sy - 54, sy - 18, 22);
  g.fillStyle = 'rgba(200,60,50,.9)'; g.beginPath(); g.moveTo(sx, sy - 86); g.lineTo(sx + 14, sy - 82); g.lineTo(sx, sy - 79); g.fill();
  g.strokeStyle = rgba(mixc([60, 70, 90], fog, .4)); g.lineWidth = 1.4;
  for (let k = 0; k < 7; k++) { const bx = TW * (.3 + r() * .5), by = hz - 220 - r() * 160, bs = 4 + r() * 4; g.beginPath(); g.moveTo(bx - bs, by); g.quadraticCurveTo(bx - bs * .5, by - bs * .6, bx, by); g.quadraticCurveTo(bx + bs * .5, by - bs * .6, bx + bs, by); g.stroke(); }
}
/* isla tropical lejana: roca, playa, arboleda ilustrada, palmeras, bruma */
function paintIsland(g, x, hz, w, h, fk, fog, r, palms) {
  const pts = []; const n = 28;
  for (let i = 0; i <= n; i++) { const u = i / n, e = Math.sin(u * Math.PI); pts.push([x - w / 2 + u * w, hz - h * Math.pow(e, .8) * (.75 + .5 * fbm1(u * 4 + x * .01, 3))]); }
  g.fillStyle = rgba(mixc([110, 104, 92], fog, fk)); g.beginPath(); g.moveTo(x - w / 2 - 20, hz + 2); for (const p of pts) g.lineTo(p[0], p[1] + h * .1); g.lineTo(x + w / 2 + 20, hz + 2); g.closePath(); g.fill();
  g.fillStyle = rgba(mixc([236, 214, 170], fog, fk * .8)); g.beginPath(); g.moveTo(x - w / 2 - 26, hz + 2); g.quadraticCurveTo(x, hz - 12, x + w / 2 + 26, hz + 2); g.closePath(); g.fill();
  const clumps = [];
  for (let i = 0; i < Math.round(w / 26); i++) { const u = (i + r() * .8) / Math.round(w / 26), p = pts[Math.min(n, Math.round(u * n))]; clumps.push([p[0], p[1] + h * .2 + r() * h * .25, h * (.16 + r() * .14)]); }
  clumps.sort((a, b) => a[1] - b[1]);
  for (const [cx, cy, rr] of clumps) paintFoliage(g, cx, cy, rr, PAL.leafSpring, r, fog, fk, { noHi: true, n: 4 });
  if (palms) for (let k = 0; k < 3; k++) {
    const px = x + (r() - .5) * w * .7, py = hz - 6 - r() * 6, ph = 30 + r() * 26, lean = (r() - .5) * .5, col = rgba(mixc([46, 70, 52], fog, fk * .9));
    g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + lean * ph * .4, py - ph * .6, px + lean * ph, py - ph); g.stroke();
    g.fillStyle = col; for (let f = 0; f < 6; f++) { const a = -Math.PI / 2 + (f - 2.5) * .55, L = 16 + r() * 8; g.beginPath(); g.moveTo(px + lean * ph, py - ph); g.quadraticCurveTo(px + lean * ph + Math.cos(a) * L * .6, py - ph + Math.sin(a) * L * .6 - 4, px + lean * ph + Math.cos(a) * L, py - ph + Math.sin(a) * L + 6); g.quadraticCurveTo(px + lean * ph + Math.cos(a) * L * .5, py - ph + Math.sin(a) * L * .5, px + lean * ph, py - ph); g.fill(); }
  }
  const mg = g.createLinearGradient(0, hz - h * .5, 0, hz + 2); mg.addColorStop(0, rgba(fog, 0)); mg.addColorStop(1, rgba(fog, .55)); g.fillStyle = mg; g.fillRect(x - w / 2 - 30, hz - h * .5, w + 60, h * .5 + 2);
}
function paintTemple(g, x, base, s, r, fog, fk) {
  const dark = P_([96, 112, 104], fog, fk), mid = P_([140, 156, 140], fog, fk), lit = P_([196, 206, 180], fog, fk), steps = 4;
  for (let i = 0; i < steps; i++) {
    const w = s * (2.2 - i * .42), h = s * .3, y = base - (i + 1) * h;
    g.fillStyle = mid; g.fillRect(x - w / 2, y, w, h + 1);
    g.fillStyle = dark; g.fillRect(x + w * .18, y, w * .32, h + 1);
    g.fillStyle = lit; g.fillRect(x - w / 2, y, w, 3);
  }
  const top = base - steps * s * .3, tw = s * .5;
  g.fillStyle = mid; g.fillRect(x - tw / 2, top - s * .45, tw, s * .45);
  g.fillStyle = dark; g.fillRect(x - tw * .15, top - s * .32, tw * .3, s * .32);
  g.fillStyle = lit; g.fillRect(x - tw / 2 - 4, top - s * .5, tw + 8, 6);
  g.fillStyle = mid; g.fillRect(x - s * .03, base - s * 1.2 - steps * s * .3 + s * .3, s * .06, s * .08);
}
function paintShroom(g, x, base, h, w, cw, capc, fog, fk, r) {
  const stem = mixc([200, 190, 230], [40, 30, 80], .5);
  g.fillStyle = P_(stem, fog, fk); g.beginPath(); g.moveTo(x - w, base); g.quadraticCurveTo(x - w * .3, base - h * .5, x - w * .45, base - h); g.lineTo(x + w * .45, base - h); g.quadraticCurveTo(x + w * .3, base - h * .5, x + w, base); g.fill();
  g.fillStyle = P_(scalec(stem, .7), fog, fk); g.beginPath(); g.moveTo(x + w * .1, base); g.quadraticCurveTo(x + w * .1, base - h * .5, x + w * .05, base - h); g.lineTo(x + w * .45, base - h); g.quadraticCurveTo(x + w * .3, base - h * .5, x + w, base); g.fill();
  const cy = base - h;
  g.fillStyle = P_(scalec(capc, .5), fog, fk); g.beginPath(); g.ellipse(x, cy, cw, cw * .2, 0, 0, Math.PI); g.fill();
  g.fillStyle = P_(capc, fog, fk); g.beginPath(); g.ellipse(x, cy, cw, cw * .5, 0, Math.PI, 0); g.quadraticCurveTo(x, cy + cw * .12, x - cw, cy); g.fill();
  g.fillStyle = P_(mixc(capc, [255, 255, 255], .35), fog, fk); g.beginPath(); g.ellipse(x - cw * .25, cy - cw * .28, cw * .5, cw * .18, -.15, 0, TAU); g.fill();
  g.fillStyle = P_(mixc(capc, [255, 255, 255], .6), fog, fk, .85); for (let d = 0; d < 7; d++) { g.beginPath(); g.ellipse(x + (d - 3) * cw * .26, cy - cw * .22 - (3 - Math.abs(d - 3)) * cw * .05, cw * .06, cw * .045, 0, 0, TAU); g.fill(); }
}
function paintTower(g, x, base, w, h, col, lit, r) {
  const kind = Math.floor(r() * 3), roofH = w * (kind === 0 ? 1.5 : kind === 1 ? .9 : .3);
  g.fillStyle = rgba(col); g.fillRect(x - w / 2, base - h, w, h + 10);
  g.fillStyle = rgba(lit, .5); g.fillRect(x - w / 2, base - h, w * .14, h);
  g.fillStyle = rgba(scalec(col, .7)); g.fillRect(x + w * .2, base - h, w * .3, h);
  // corbeles
  g.fillStyle = rgba(col); g.fillRect(x - w * .62, base - h - 8, w * 1.24, 14);
  if (kind === 2) { for (let k = 0; k < 5; k++) g.fillRect(x - w * .62 + k * w * .27, base - h - 22, w * .16, 16); }
  else { g.beginPath(); g.moveTo(x - w * .66, base - h - 8); g.lineTo(x, base - h - 8 - roofH); g.lineTo(x + w * .66, base - h - 8); g.closePath(); g.fill();
    g.strokeStyle = rgba(lit, .75); g.lineWidth = 2; g.beginPath(); g.moveTo(x - w * .66, base - h - 8); g.lineTo(x, base - h - 8 - roofH); g.stroke();
    g.strokeStyle = rgba(col); g.beginPath(); g.moveTo(x, base - h - 8 - roofH); g.lineTo(x, base - h - 34 - roofH); g.stroke();
    const fy = base - h - 34 - roofH; g.fillStyle = 'rgba(200,40,40,.95)'; g.beginPath(); g.moveTo(x, fy); g.quadraticCurveTo(x + 10, fy + 2, x + 20, fy + 6 + Math.sin(x) * 2); g.lineTo(x, fy + 12); g.fill(); }
  for (let i = 0; i < 5; i++) { const wy = base - h + 30 + i * (h / 5.5); if (wy > base - 30) break; if (r() < .65) { g.fillStyle = 'rgba(255,190,110,.95)'; g.beginPath(); g.roundRect(x - 4, wy, 8, 14, [4, 4, 0, 0]); g.fill(); glowAt(g, [255, 160, 80], x, wy + 7, 18, .55); } }
}
function paintCityBlock(g, x, base, w, h, col, lit, r) {
  g.fillStyle = rgba(col); g.fillRect(x - w / 2, base - h, w, h + 10);
  if (r() < .5) { g.beginPath(); g.arc(x, base - h, w * .45, Math.PI, 0); g.fill(); } else { g.fillRect(x - w * .1, base - h - 40, w * .2, 40); }
  g.fillStyle = rgba(lit, .35); g.fillRect(x - w / 2, base - h, w * .12, h);
  for (let yy = base - h + 24; yy < base - 20; yy += 26) for (let xx = x - w / 2 + 10; xx < x + w / 2 - 8; xx += 16) if (r() < .35) { g.fillStyle = 'rgba(255,214,140,.9)'; g.fillRect(xx, yy, 6, 9); }
  if (r() < .5) { const cx = x + w * .25; g.fillStyle = rgba(col); g.fillRect(cx - 4, base - h - 50, 8, 50); for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(230,230,240,${.25 - k * .05})`; g.beginPath(); g.arc(cx + k * 10, base - h - 60 - k * 18, 8 + k * 5, 0, TAU); g.fill(); } }
}
function paintClockTower(g, x, base, w, h, col, lit, fog) {
  g.fillStyle = rgba(col); g.fillRect(x - w / 2, base - h, w, h + 10); g.fillRect(x - w * .62, base - h - 20, w * 1.24, 24);
  g.beginPath(); g.moveTo(x - w * .6, base - h - 20); g.lineTo(x, base - h - w * 1.3); g.lineTo(x + w * .6, base - h - 20); g.fill();
  g.fillStyle = rgba(lit, .45); g.fillRect(x - w / 2, base - h, w * .14, h);
  const cy = base - h + w * .75, R = w * .4;
  glowAt(g, [255, 220, 150], x, cy, R * 2.4, .6);
  g.fillStyle = '#f6e2b0'; g.beginPath(); g.arc(x, cy, R, 0, TAU); g.fill(); g.strokeStyle = rgba(mixc([120, 80, 30], fog, .2)); g.lineWidth = 4; g.stroke();
  g.strokeStyle = '#3a2a14'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, cy); g.lineTo(x + R * .5, cy - R * .4); g.moveTo(x, cy); g.lineTo(x - R * .1, cy - R * .75); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillStyle = '#3a2a14'; g.fillRect(x + Math.cos(a) * R * .82 - 1.5, cy + Math.sin(a) * R * .82 - 1.5, 3, 3); }
}

/* =================== CAPA MEDIA =================== */
function paintMid(type, B) {
  const c = mk(TW, TH), g = c.getContext('2d'), r = mulberry32(type.length * 131 + 17), fog = B.fog, fk = .3;
  if (type === 'seastacks') {
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 400 + r() * 120, w = 90 + r() * 110, h = 280 + r() * 220, base = 960;
      const pts = [[x - w * .8, base], [x - w * .62, base - h * .22], [x - w * .5, base - h * .4], [x - w * .62, base - h * .58], [x - w * .5, base - h * .8], [x - w * .36, base - h * .97], [x - w * .05, base - h * 1.02], [x + w * .32, base - h * .96], [x + w * .44, base - h * .74], [x + w * .38, base - h * .55], [x + w * .55, base - h * .36], [x + w * .5, base - h * .16], [x + w * .9, base]];
      wrapNear(x, w * 2, ox => {
        const P2 = pts.map(([a, b]) => [a + ox, b]);
        paintRock(g, P2, PAL.stoneSand, mulberry32(i * 7), fog, fk, { cracks: 5, sharp: 1 });
        g.fillStyle = P_(PAL.leafSpring.mid, fog, fk); g.beginPath(); g.moveTo(ox + x - w * .4, base - h * .99); g.quadraticCurveTo(ox + x, base - h * 1.06, ox + x + w * .34, base - h * .99); for (let k = 0; k <= 8; k++) { const xx = ox + x + w * .34 - k * w * .74 / 8; g.lineTo(xx, base - h * .99 + (k % 2 ? 12 : 4)); } g.fill();
        drawPalm(g, { x: ox + x - w * .05, y: base - h * .99, h: 70 + (i % 2) * 30, s: .75, lean: .15 * (i % 2 ? 1 : -1), curve: .3, ph: i }, 0);
      });
    }
  } else if (type === 'cliffs') {
    for (let i = 0; i < 5; i++) {
      const x = r() * TW, w = 240 + r() * 260, h = 220 + r() * 200, base = 980, pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([x - w / 2 + w * t + (r() - .5) * 20, base - h + Math.sin(t * Math.PI) * -30 + (r() - .5) * 26 + (k === 0 || k === 8 ? h * .6 : 0)]); }
      pts.push([x + w / 2, base]); pts.unshift([x - w / 2, base]);
      wrapNear(x, w, ox => {
        const P2 = pts.map(([a, b]) => [a + ox, b]); paintRock(g, P2, PAL.stoneMoss, mulberry32(i * 13), fog, fk + .1, { cracks: 4, sharp: 1 });
        for (let k = 1; k < 8; k++) { const [px, py] = P2[k + 1]; paintTuft(g, px, py + 4, 18, PAL.leafSpring, r, fog, fk); }
        if (r() < .7) paintTree(g, ox + x + (r() - .5) * w * .4, pts[4][1] + 6, 140 + r() * 60, 12, { r: mulberry32(i * 3 + 1), fog, fk, leaf: PAL.leafPink });
      });
    }
  } else if (type === 'trunks') {
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 270 + r() * 80, w = 46 + r() * 50;
      wrapNear(x, w * 2, ox => paintTrunk(g, ox + x, w, mulberry32(i * 5 + 2), fog, fk));
    }
    for (let k = 0; k < 18; k++) { const x = r() * TW; wrapNear(x, 60, ox => drawFern(g, ox + x, TH - 10, 1.4 + r(), r() < .5, [P_(PAL.leafDeep.dark, fog, fk), P_(PAL.leafDeep.mid, fog, fk)])); }
  } else if (type === 'shrooms') {
    for (let i = 0; i < 6; i++) { const x = r() * TW, h = 200 + r() * 260, w = 16 + r() * 16, cw = 70 + r() * 90; wrapNear(x, cw, ox => paintShroom(g, ox + x, 980, h, w, cw, pick([[90, 230, 220], [230, 120, 220], [170, 150, 255]]), fog, fk, mulberry32(i))); }
  } else if (type === 'columns') {
    const S = B === BIOMES.castle ? { dark: [70, 30, 40], mid: [120, 60, 66], light: [180, 100, 96], hi: [220, 150, 130] } : PAL.stoneMoss;
    for (let i = 0; i < 6; i++) {
      const x = 100 + i * 270 + r() * 60, w = 46 + r() * 20, h = 240 + r() * 320, base = 980, broken = r() < .5;
      wrapNear(x, 300, ox => {
        const X = ox + x, top = base - h + (broken ? 0 : 0);
        paintRock(g, [[X - w / 2, base], [X - w / 2, top], [X - w * .2, top - (broken ? 18 : 0)], [X + w * .1, top + (broken ? 10 : 0)], [X + w / 2, top], [X + w / 2, base]], S, mulberry32(i * 9), fog, fk, { cracks: 2 });
        if (!broken) paintRock(g, [[X - w / 2 - 12, top], [X - w / 2 - 12, top - 22], [X + w / 2 + 12, top - 22], [X + w / 2 + 12, top]], S, mulberry32(i * 9 + 1), fog, fk, { cracks: 0 });
        if (i % 2 === 0) { const ax0 = X + w / 2, ax1 = X + 270 - w / 2; g.lineWidth = 26; g.strokeStyle = P_(S.mid, fog, fk); g.beginPath(); g.moveTo(ax0, top + 30); g.quadraticCurveTo((ax0 + ax1) / 2, top - 90, ax1, top + 30); g.stroke(); g.lineWidth = 4; g.strokeStyle = P_(S.light, fog, fk); g.beginPath(); g.moveTo(ax0, top + 18); g.quadraticCurveTo((ax0 + ax1) / 2, top - 102, ax1, top + 18); g.stroke(); }
        for (let k = 0; k < 4; k++) paintFoliage(g, X + (r() - .5) * w, top + 10 + k * 40 * r(), 8 + r() * 8, PAL.leafSpring, r, fog, fk, { noHi: true, n: 3 });
        drawVine(g, { x: X + (r() - .5) * w, y: top, len: 60 + r() * 120, ph: 0, th: 2.5, leafy: 1 }, 0);
      });
    }
  } else if (type === 'cloudbanks') {
    const S = SKY_STYLE.sky || SKY_STYLE.beach;
    const strip = paintCloudStrip({ w: TW, h: 520, n: 9, size: [240, 460], band: [.8, .9], alpha: 1, haze: .25, seed: 151 }, S);
    g.drawImage(strip, 0, TH - 560); g.fillStyle = rgba(mixc([250, 252, 255], fog, .2)); g.fillRect(0, TH - 70, TW, 70);
  } else if (type === 'stalag') {
    const pal = B.midMat === 'basalt' ? { dark: [40, 26, 30], mid: [82, 56, 60], light: [140, 90, 80], hi: [200, 120, 90] } : B.midMat === 'wetrock' ? { dark: [28, 50, 66], mid: [56, 92, 112], light: [100, 150, 168], hi: [150, 200, 214] } : { dark: [40, 40, 66], mid: [74, 76, 108], light: [120, 124, 160], hi: [170, 176, 210] };
    const f2 = B.fog, k2 = .35;
    for (let x = 0; x < TW; x += 110 + r() * 160) { const w = 50 + r() * 110, h = 180 + r() * 360; wrapNear(x, w, ox => paintRock(g, [[ox + x - w / 2, TH + 10], [ox + x - w * .3, TH - h * .5], [ox + x - w * .08, TH - h], [ox + x + w * .1, TH - h * .96], [ox + x + w * .3, TH - h * .45], [ox + x + w / 2, TH + 10]], pal, mulberry32(x | 0), f2, k2, { cracks: 2 })); }
    for (let x = 40; x < TW; x += 90 + r() * 150) { const w = 40 + r() * 90, h = 90 + r() * 240; wrapNear(x, w, ox => paintRock(g, [[ox + x - w / 2, -10], [ox + x - w * .25, h * .5], [ox + x, h], [ox + x + w * .25, h * .45], [ox + x + w / 2, -10]], pal, mulberry32((x * 3) | 0), f2, k2 + .1, { cracks: 1 })); }
    if (B.midMat === 'basalt') { const lg = g.createLinearGradient(0, TH, 0, TH - 300); lg.addColorStop(0, 'rgba(255,110,30,.35)'); lg.addColorStop(1, 'rgba(255,80,20,0)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = lg; g.fillRect(0, TH - 300, TW, 300); g.globalCompositeOperation = 'source-over'; }
  } else if (type === 'gears') {
    for (let i = 0; i < 5; i++) { const x = 140 + i * 330 + r() * 60, R = 70 + r() * 90, y = 640 + r() * 200; wrapNear(x, R, ox => paintGearIll(g, ox + x, y, R, r() * 3, PAL.brass, fog, fk + .1)); }
    for (let i = 0; i < 2; i++) { const y = 760 + i * 110 + r() * 40; g.fillStyle = P_(PAL.iron.mid, fog, fk); g.fillRect(0, y, TW, 22); g.fillStyle = P_(PAL.iron.light, fog, fk); g.fillRect(0, y, TW, 5); for (let x = 30; x < TW; x += 120) { g.fillStyle = P_(PAL.brass.mid, fog, fk); g.fillRect(x, y - 4, 16, 30); } }
    for (let i = 0; i < 2; i++) { const x = 300 + i * 800 + r() * 100; wrapNear(x, 40, ox => { g.fillStyle = P_(PAL.iron.dark, fog, fk); g.fillRect(ox + x - 12, 520, 24, TH); g.fillStyle = P_(PAL.iron.light, fog, fk); g.fillRect(ox + x - 12, 520, 6, TH); for (let y = 560; y < TH; y += 90) { g.fillStyle = P_(PAL.brass.mid, fog, fk); g.fillRect(ox + x - 16, y, 32, 10); } }); }
  } else if (type === 'battlements') {
    const col = [70, 26, 34], lit = [190, 80, 70];
    for (let i = 0; i < 4; i++) { const x = 200 + i * 400 + r() * 80, w = 90 + r() * 40, h = 380 + r() * 200; wrapNear(x, w, ox => paintTower(g, ox + x, 980, w, h, mixc(col, fog, fk), mixc(lit, fog, fk), mulberry32(i * 5))); }
    g.fillStyle = P_(col, fog, fk); g.fillRect(0, 820, TW, TH); for (let x = 0; x < TW; x += 40) g.fillRect(x, 796, 24, 26);
    g.fillStyle = P_(lit, fog, fk, .5); g.fillRect(0, 820, TW, 4);
  }
  return c;
}
/* tronco gigante ilustrado (bosque) */
function paintTrunk(g, x, w, r, fog, fk) {
  const B = PAL.bark;
  g.fillStyle = P_(B.mid, fog, fk); g.beginPath(); g.moveTo(x - w * 1.5, TH); g.quadraticCurveTo(x - w * .7, TH - 70, x - w / 2, TH - 200); g.lineTo(x - w * .44, -20); g.lineTo(x + w * .44, -20); g.lineTo(x + w / 2, TH - 200); g.quadraticCurveTo(x + w * .7, TH - 70, x + w * 1.5, TH); g.closePath(); g.fill();
  g.save(); g.clip();
  g.fillStyle = P_(B.dark, fog, fk); g.beginPath(); g.moveTo(x + w * .08, -20); for (let y = 0; y <= TH; y += 50) g.lineTo(x + w * .08 + Math.sin(y * .01) * 4, y); g.lineTo(x + w * 2, TH); g.lineTo(x + w * 2, -20); g.fill();
  g.strokeStyle = P_(B.light, fog, fk, .9); g.lineWidth = w * .1; g.beginPath(); g.moveTo(x - w * .38, -20); g.lineTo(x - w * .42, TH - 200); g.quadraticCurveTo(x - w * .6, TH - 70, x - w * 1.3, TH); g.stroke();
  g.strokeStyle = P_(B.dark, fog, fk, .55); g.lineWidth = Math.max(1.5, w * .05); g.lineCap = 'round';
  for (let k = 0; k < 10; k++) { const ox = (r() - .5) * w * .7, y0 = r() * TH; g.beginPath(); g.moveTo(x + ox, y0); g.quadraticCurveTo(x + ox + 3, y0 + 40, x + ox - 2, y0 + 80 + r() * 60); g.stroke(); }
  for (let k = 0; k < 3; k++) { const ky = 150 + r() * 600; g.fillStyle = P_(B.dark, fog, fk); g.beginPath(); g.ellipse(x - w * .1, ky, w * .12, w * .18, 0, 0, TAU); g.fill(); g.strokeStyle = P_(B.light, fog, fk, .7); g.lineWidth = 2; g.beginPath(); g.ellipse(x - w * .1, ky, w * .15, w * .22, 0, Math.PI * .9, Math.PI * 1.6); g.stroke(); }
  g.restore();
  // musgo y lianas
  for (let k = 0; k < 3; k++) paintFoliage(g, x + (r() - .5) * w * .6, TH - 220 - r() * 400, 14 + r() * 10, PAL.leafDeep, r, fog, fk, { noHi: true, n: 3 });
  for (let k = 0; k < 2; k++) drawVine(g, { x: x + (r() - .5) * w * .8, y: 60 + r() * 200, len: 140 + r() * 220, ph: 0, th: 2.6, leafy: 1 }, 0);
}
/* capa media con relieve (cuevas): mismo motor de terreno, con bruma */
function paintMidRelief(type, B) {
  const M = MARGIN, mask = mk(TW + 2 * M, TH + 2 * M), m = mask.getContext('2d'); m.translate(M, M);
  const r = mulberry32(type.length * 131 + 17);
  const fillShape = (mat, fn) => { m.fillStyle = matFill(mat); wrapDraw(TW, ox => { m.save(); m.translate(ox, 0); fn(m); m.fill(); m.restore(); }); };
  const mat = B.midMat || 'rock';
  for (let x = 0; x < TW; x += 110 + r() * 160) { const w = 60 + r() * 120, h = 160 + r() * 360; fillShape(mat, g => spikePath(g, x, TH + 10, w, h, -1, (x * 7) | 0)); }
  for (let x = 40; x < TW; x += 90 + r() * 150) { const w = 40 + r() * 100, h = 80 + r() * 240; fillShape(mat, g => spikePath(g, x, -10, w, h, 1, (x * 13) | 0)); }
  const res = renderRelief(mask, 0, 0, M, TW, TH, { ambient: B.relief.amb, sky: B.relief.sky, skyK: B.relief.skyK, depth: .4, light: B.relief.light, noCrack: 1, fog: B.fog, fogK: .35 });
  const c = mk(TW, TH), g = c.getContext('2d'); g.putImageData(res.img, 0, 0);
  return c;
}

function paintFG(type) {
  const out = [], dark = type === 'lavarocks' ? '#0a0504' : type === 'beach' || type === 'meadow' ? '#0b1410' : '#06060a';
  for (let k = 0; k < 5; k++) {
    const w = 240 + k * 50, h = 120 + (k % 3) * 40, c = mk(w, h), g = c.getContext('2d'), r = mulberry32(k * 77 + type.length);
    g.fillStyle = dark;
    if (type === 'beach' || type === 'meadow') {
      for (let i = 0; i < 40; i++) { const x = r() * w, l = 30 + r() * (h - 20), a = (r() - .5) * .9; g.beginPath(); g.moveTo(x - 3, h); g.quadraticCurveTo(x + a * l * .4, h - l * .6, x + a * l, h - l); g.quadraticCurveTo(x + a * l * .4 + 2, h - l * .5, x + 3, h); g.fill(); }
    } else if (type === 'ferns' || type === 'ferns_dark' || type === 'vines') {
      g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 12) g.lineTo(x, h - 20 - fbm1(x * .02 + k) * 30); g.lineTo(w, h); g.fill();
      for (let i = 0; i < 4; i++) drawFern(g, r() * w, h - 10, 1 + r() * .8, r() < .5, [dark, dark]);
    } else if (type === 'pipes') {
      const gx = w * (.3 + r() * .4), gr = h * .55; g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, rr = gr * ((i % 4) < 2 ? 1 : .84); g.lineTo(gx + Math.cos(a) * rr, h + 10 + Math.sin(a) * rr); } g.fill();
      g.fillRect(0, h - 22, w, 22); g.fillRect(w * .1, h - 34, 18, 34); g.fillRect(w * .82, h - 30, 18, 30);
      g.beginPath(); g.roundRect(w * .05, h - 60 - r() * 30, 26, 120, 6); g.fill(); g.fillRect(w * .05 - 6, h - 70, 38, 10);
    } else {
      g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 10) { const t = x / w; g.lineTo(x, h - Math.sin(t * Math.PI) * h * (.5 + fbm1(x * .03 + k * 9) * .5)); } g.lineTo(w, h); g.fill();
      if (type === 'lavarocks') { g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(255,90,30,.35)'); lg.addColorStop(.3, 'rgba(255,90,30,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
    }
    out.push({ c, w, h, top: false });
  }
  if (type === 'cave' || type === 'lavarocks' || type === 'vines' || type === 'pipes') {
    for (let k = 0; k < 3; k++) {
      const w = 180 + k * 60, h = 110 + k * 30, c = mk(w, h), g = c.getContext('2d'); g.fillStyle = dark; g.fillRect(0, 0, w, 14);
      if (type === 'pipes') { g.fillRect(0, 0, w, 18); for (let x = 30; x < w; x += 60 + hash1(x) * 50) { const L = 30 + hash1(x * 5) * (h - 50); g.strokeStyle = dark; g.lineWidth = 4;
          for (let y = 14; y < L; y += 14) { g.beginPath(); if ((y / 14 | 0) % 2) g.ellipse(x, y + 7, 5, 9, 0, 0, TAU); else g.rect(x - 1.5, y, 3, 14); g.stroke(); }
          g.lineWidth = 5; g.beginPath(); g.arc(x, L + 12, 9, -Math.PI / 2, Math.PI * .9); g.stroke(); } }
      else if (type === 'vines') {
        // masa de follaje arriba + lianas con hojas alternas (silueta legible, no "espaguetis")
        g.fillStyle = dark; for (let x = 0; x < w; x += 16) { g.beginPath(); g.arc(x, 10 + hash1(x * 1.3) * 8, 12 + hash1(x) * 8, 0, TAU); g.fill(); }
        for (let x = 20 + k * 9; x < w - 10; x += 46 + hash1(x * k + 1) * 40) {
          const L = h * (.35 + hash1(x * 3.3 + k) * .6), sw = (hash1(x * 7) - .5) * 26;
          g.strokeStyle = dark; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 12); g.quadraticCurveTo(x + sw, L * .55, x + sw * .3, L); g.stroke();
          for (let t2 = .18; t2 < 1; t2 += .13) { const px = x + sw * 2 * t2 * (1 - t2) + sw * .3 * t2 * t2, py = 12 + (L - 12) * t2, sd = (Math.round(t2 * 20) % 2) ? 1 : -1, ls = 7 - t2 * 3;
            g.beginPath(); g.ellipse(px + sd * ls * .8, py + 2, ls, ls * .45, sd * .7, 0, TAU); g.fill(); }
          g.beginPath(); g.ellipse(x + sw * .3, L + 4, 4, 6, 0, 0, TAU); g.fill();
        }
      }
      else for (let x = 10; x < w; x += 22 + hash1(x) * 20) { spikePath(g, x, 8, 16 + hash1(x * 3) * 26, 30 + hash1(x * 7) * (h - 40), 1, x * k | 0); g.fill(); }
      out.push({ c, w, h, top: true });
    }
  }
  return out;
}
