"use strict";
/* =====================================================================
   PINTOR ILUSTRADO — una sola dirección artística para todo el juego
   Estilo de animación: formas limpias y redondeadas, luz cálida desde
   arriba a la izquierda, sombras frías, 3 tonos por objeto, ribete de luz,
   bruma por distancia. Nada de texturas "realistas".
   ===================================================================== */
const PAL = {
  leafSpring: { dark: [38, 92, 66], mid: [70, 142, 74], light: [134, 196, 92], hi: [206, 236, 140] },
  leafDeep: { dark: [24, 62, 54], mid: [44, 104, 70], light: [92, 160, 84], hi: [170, 220, 130] },
  leafAutumn: { dark: [120, 52, 46], mid: [196, 98, 58], light: [240, 160, 80], hi: [255, 214, 140] },
  leafPink: { dark: [140, 60, 100], mid: [214, 110, 150], light: [250, 170, 196], hi: [255, 222, 232] },
  leafNight: { dark: [26, 40, 70], mid: [40, 70, 100], light: [70, 120, 140], hi: [140, 210, 220] },
  bark: { dark: [62, 40, 34], mid: [104, 70, 52], light: [150, 108, 76] },
  barkGrey: { dark: [56, 54, 62], mid: [92, 90, 98], light: [140, 136, 140] },
  stoneSand: { dark: [150, 92, 76], mid: [210, 150, 104], light: [246, 200, 146], hi: [255, 232, 190] },
  stoneGrey: { dark: [66, 70, 96], mid: [112, 118, 146], light: [170, 178, 204], hi: [214, 222, 240] },
  stoneMoss: { dark: [62, 70, 74], mid: [108, 116, 108], light: [160, 166, 140], hi: [200, 210, 170] },
  brass: { dark: [110, 70, 30], mid: [190, 140, 60], light: [240, 200, 110], hi: [255, 240, 190] },
  iron: { dark: [40, 42, 54], mid: [84, 88, 104], light: [140, 146, 160], hi: [200, 206, 220] }
};
const fogMix = (c, fog, k) => fog && k ? mixc(c, fog, k) : c;
const P_ = (c, fog, k, a = 1) => rgba(fogMix(c, fog, k), a);

/* círculo festoneado: borde de hojas (no un círculo liso) */
function scallop(g, x, y, rad, r, lobes) {
  const k = lobes || Math.max(7, Math.round(rad / 3.2));
  g.beginPath();
  for (let i = 0; i <= k; i++) {
    const a0 = i / k * TAU, a1 = (i + .5) / k * TAU, a2 = (i + 1) / k * TAU, j = .9 + .1 * r();
    if (i === 0) g.moveTo(x + Math.cos(a0) * rad * j, y + Math.sin(a0) * rad * j);
    g.quadraticCurveTo(x + Math.cos(a1) * rad * 1.14, y + Math.sin(a1) * rad * 1.14, x + Math.cos(a2) * rad * (.9 + .1 * r()), y + Math.sin(a2) * rad * (.9 + .1 * r()));
  }
  g.closePath(); g.fill();
}
/* masa de follaje en 3 tonos con hojas en el borde */
function paintFoliage(g, cx, cy, R, pal, r, fog, fk = 0, opt = {}) {
  const n = opt.n || Math.round(5 + R / 9), blobs = [];
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * .52; blobs.push([cx + Math.cos(a) * d * (opt.wide || 1), cy + Math.sin(a) * d * .78, R * (.34 + .22 * r())]); }
  blobs.push([cx, cy, R * .55]);
  g.fillStyle = P_(pal.dark, fog, fk); for (const [x, y, rr] of blobs) scallop(g, x + rr * .08, y + rr * .12, rr, r);
  g.fillStyle = P_(pal.mid, fog, fk); for (const [x, y, rr] of blobs) scallop(g, x - rr * .1, y - rr * .12, rr * .86, r);
  g.fillStyle = P_(pal.light, fog, fk);
  for (const [x, y, rr] of blobs) if ((x - cx) + (y - cy) * 1.2 < R * .15) scallop(g, x - rr * .26, y - rr * .3, rr * .52, r, Math.max(6, Math.round(rr / 4)));
  if (!opt.noHi && pal.hi) { g.strokeStyle = P_(pal.hi, fog, fk, .8); g.lineWidth = Math.max(1, R * .03); g.lineCap = 'round';
    for (const [x, y, rr] of blobs) if ((x - cx) + (y - cy) < 0 && r() < .7) { const a = -2.2 + r() * .8; g.beginPath(); g.arc(x - rr * .3, y - rr * .3, rr * .42, a, a + .7); g.stroke(); } }
}
/* árbol ilustrado: tronco con raíces y ramas + copa de varias masas */
function paintTree(g, x, by, h, w, opt = {}) {
  const r = opt.r || mulberry32((x * 13 + h) | 0), fog = opt.fog, fk = opt.fk || 0, B = opt.bark || PAL.bark, L = opt.leaf || PAL.leafSpring;
  const lean = (opt.lean ?? (r() - .5) * .25) * h, topX = x + lean, topY = by - h * .72;
  if (opt.kind === 'pine') return paintPine(g, x, by, h, w, opt);
  // tronco (forma cónica curva)
  const tw0 = w * .5, tw1 = w * .2;
  g.fillStyle = P_(B.mid, fog, fk);
  g.beginPath(); g.moveTo(x - tw0 * 1.8, by); g.quadraticCurveTo(x - tw0 * .9, by - h * .04, x - tw0, by - h * .12);
  g.quadraticCurveTo(x - tw0 * .6 + lean * .3, by - h * .45, topX - tw1, topY); g.lineTo(topX + tw1, topY);
  g.quadraticCurveTo(x + tw0 * .6 + lean * .3, by - h * .45, x + tw0, by - h * .12); g.quadraticCurveTo(x + tw0 * .9, by - h * .04, x + tw0 * 1.8, by); g.closePath(); g.fill();
  // lado en sombra y ribete de luz
  g.save(); g.clip();
  g.fillStyle = P_(B.dark, fog, fk); g.beginPath(); g.moveTo(x + tw0 * .15, by); g.quadraticCurveTo(x + tw0 * .2 + lean * .3, by - h * .45, topX + tw1 * .2, topY); g.lineTo(topX + w, topY); g.lineTo(x + w * 2, by); g.closePath(); g.fill();
  g.strokeStyle = P_(B.light, fog, fk, .8); g.lineWidth = Math.max(1.2, w * .08); g.beginPath(); g.moveTo(x - tw0 * .8, by - h * .05); g.quadraticCurveTo(x - tw0 * .55 + lean * .3, by - h * .45, topX - tw1 * .7, topY); g.stroke();
  g.strokeStyle = P_(B.dark, fog, fk, .6); g.lineWidth = Math.max(1, w * .05);
  for (let i = 0; i < 4; i++) { const ox = (r() - .5) * tw0, y0 = by - h * (.1 + r() * .3); g.beginPath(); g.moveTo(x + ox, y0); g.quadraticCurveTo(x + ox * .8 + lean * .2, y0 - h * .12, x + ox * .7 + lean * .3, y0 - h * .22); g.stroke(); }
  g.restore();
  // ramas
  g.strokeStyle = P_(B.mid, fog, fk); g.lineCap = 'round';
  const crowns = [];
  const nC = opt.crowns || 3 + Math.floor(r() * 3);
  for (let i = 0; i < nC; i++) { const side = i % 2 ? 1 : -1, a = topY + h * (.05 + r() * .12); const cx2 = topX + side * (h * (.12 + r() * .14)), cy2 = topY - h * (.02 + r() * .16); crowns.push([cx2, cy2, h * (.17 + r() * .07)]);
    g.lineWidth = Math.max(1.5, w * .22); g.beginPath(); g.moveTo(topX, a); g.quadraticCurveTo((topX + cx2) / 2, a - h * .02, cx2, cy2 + h * .04); g.stroke(); }
  crowns.push([topX, topY - h * .17, h * .24]);
  crowns.sort((a, b) => b[2] - a[2]);
  for (const [cx2, cy2, rr] of crowns) paintFoliage(g, cx2, cy2, rr, L, r, fog, fk);
}
function paintPine(g, x, by, h, w, opt) {
  const r = opt.r || mulberry32(x | 0), fog = opt.fog, fk = opt.fk || 0, B = opt.bark || PAL.bark, L = opt.leaf || PAL.leafDeep;
  g.fillStyle = P_(B.dark, fog, fk); g.fillRect(x - w * .18, by - h * .3, w * .36, h * .3);
  const tiers = 4 + Math.floor(r() * 2);
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, ty = by - h * (.18 + t * .78), tw = w * (2.6 - t * 1.9), th = h * .3;
    for (const [col, ox, oy, k] of [[L.dark, 2, 3, 1], [L.mid, -1, 0, .9], [L.light, -tw * .25, -th * .2, .45]]) {
      g.fillStyle = P_(col, fog, fk); g.beginPath(); g.moveTo(x + ox * k, ty - th + oy);
      for (let s = 0; s <= 6; s++) { const u = s / 6, xx = x + ox + lerp(-tw * k, tw * k, u) * (col === L.light ? .5 : 1) + (col === L.light ? -tw * .2 : 0), yy = ty + oy + Math.sin(u * Math.PI * 6) * th * .06; g.lineTo(xx, yy); }
      g.closePath(); g.fill();
    }
  }
}
/* roca ilustrada: masa + cara iluminada + cara en sombra + ribete + grietas suaves */
function paintRock(g, pts, pal, r, fog, fk = 0, opt = {}) {
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (opt.sharp) g.lineTo(b[0], b[1]); else { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; g.quadraticCurveTo(a[0], a[1], mx, my); } } g.closePath(); };
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9; for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const W = maxX - minX, H = maxY - minY;
  g.fillStyle = P_(pal.mid, fog, fk); path(); g.fill();
  g.save(); path(); g.clip();
  // cara en sombra (derecha) con borde ondulado
  g.fillStyle = P_(pal.dark, fog, fk); g.beginPath(); g.moveTo(minX + W * .62, minY - 10);
  for (let k = 0; k <= 8; k++) { const t = k / 8; g.lineTo(minX + W * (.55 + .12 * Math.sin(t * 5 + r() * 2)) + (r() - .5) * W * .06, minY + t * (H + 20)); }
  g.lineTo(maxX + 20, maxY + 20); g.lineTo(maxX + 20, minY - 10); g.closePath(); g.fill();
  // cara iluminada (arriba-izquierda)
  if (opt.sharp) { g.fillStyle = P_(pal.light, fog, fk); const cxm = minX + W * .5; g.beginPath(); for (const [px2, py2] of pts) g.lineTo(px2 < cxm ? px2 : cxm + (px2 - cxm) * .1, py2 < minY + H * .6 ? py2 : minY + H * .6); g.lineTo(minX + W * .3, minY + H * .75); g.closePath(); g.fill(); }
  else { g.fillStyle = P_(pal.light, fog, fk); g.beginPath(); g.moveTo(minX - 10, minY - 10);
  for (let k = 0; k <= 8; k++) { const t = k / 8; g.lineTo(minX + W * (.2 + .3 * t) + (r() - .5) * W * .05, minY + t * H * .55 + Math.sin(t * 6) * H * .03); }
  g.lineTo(minX - 10, minY + H * .7); g.closePath(); g.fill(); }
  // vetas y grietas suaves (sin negro)
  g.strokeStyle = P_(pal.dark, fog, fk, .55); g.lineWidth = Math.max(1, W * .012); g.lineCap = 'round';
  for (let k = 0; k < (opt.cracks ?? 4); k++) { const sx = minX + W * (.15 + r() * .7), sy = minY + H * (.15 + r() * .6); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + (r() - .5) * W * .1, sy + H * .08, sx + (r() - .5) * W * .12, sy + H * (.12 + r() * .1)); g.stroke(); }
  if (opt.strata) { g.strokeStyle = P_(pal.dark, fog, fk, .25); g.lineWidth = Math.max(1, H * .012); for (let k = 1; k < 6; k++) { const yy = minY + H * k / 6; g.beginPath(); g.moveTo(minX, yy); for (let x2 = minX; x2 <= maxX; x2 += W / 10) g.lineTo(x2, yy + Math.sin(x2 * .03 + k) * H * .01); g.stroke(); } }
  g.restore();
  // ribete de luz en el contorno superior izquierdo
  g.save(); path(); g.clip(); g.strokeStyle = P_(pal.hi || pal.light, fog, fk, .9); g.lineWidth = Math.max(1.5, W * .02);
  g.translate(W * .012, H * .012); path(); g.stroke(); g.restore();
}
/* isla flotante ilustrada */
function paintFloatIsland(g, x, y, w, opt = {}) {
  const r = opt.r || mulberry32((x * 7 + y) | 0), fog = opt.fog, fk = opt.fk || 0, S = opt.stone || PAL.stoneGrey, G = opt.grass || PAL.leafSpring, depth = w * (opt.depth || .75);
  // parte inferior (cono de roca facetado)
  const pts = [[x - w / 2, y + 4]]; const n = 9;
  for (let i = 1; i < n; i++) { const t = i / n, xx = x - w / 2 + t * w, dd = Math.sin(t * Math.PI) * depth * (.6 + .5 * r()) * (1 - Math.abs(t - .5) * .4); pts.push([xx + (r() - .5) * w * .04, y + 8 + dd]); }
  pts.push([x + w / 2, y + 4]); pts.push([x + w * .35, y - 4]); pts.push([x - w * .35, y - 4]);
  paintRock(g, pts, S, r, fog, fk, { cracks: 3 });
  // raíces colgantes
  g.strokeStyle = P_(PAL.bark.dark, fog, fk, .9); g.lineCap = 'round';
  for (let k = 0; k < Math.round(w / 40); k++) { const rx = x + (r() - .5) * w * .7, len = depth * (.3 + r() * .6), ry = y + 10 + depth * .2 * r(); g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(rx, ry); g.bezierCurveTo(rx + (r() - .5) * 20, ry + len * .4, rx + (r() - .5) * 26, ry + len * .7, rx + (r() - .5) * 14, ry + len); g.stroke(); }
  // tapa de hierba con goterones
  g.fillStyle = P_(G.dark, fog, fk); g.beginPath(); g.moveTo(x - w / 2 - 6, y + 2);
  for (let i = 0; i <= 16; i++) { const t = i / 16, xx = x - w / 2 - 6 + t * (w + 12); g.lineTo(xx, y + 6 + (i % 3 === 1 ? 10 + r() * 10 : 2 + r() * 4)); }
  g.lineTo(x + w / 2 + 6, y - 2); g.quadraticCurveTo(x, y - 14, x - w / 2 - 6, y + 2); g.fill();
  g.fillStyle = P_(G.mid, fog, fk); g.beginPath(); g.moveTo(x - w / 2 - 4, y + 1); g.quadraticCurveTo(x, y - 12, x + w / 2 + 4, y - 1); g.quadraticCurveTo(x, y + 6, x - w / 2 - 4, y + 1); g.fill();
  g.fillStyle = P_(G.light, fog, fk); g.beginPath(); g.moveTo(x - w * .44, y - 2); g.quadraticCurveTo(x - w * .1, y - 11, x + w * .2, y - 7); g.quadraticCurveTo(x - w * .1, y - 4, x - w * .44, y - 2); g.fill();
  if (opt.trees) for (let k = 0; k < opt.trees; k++) paintTree(g, x + (r() - .5) * w * .6, y - 4, w * (.35 + r() * .25), w * .05, { r, fog, fk, leaf: opt.leaf || G, crowns: 2 });
  if (opt.fall) { const fx = x + (r() - .3) * w * .3, top = y + 6; const fg2 = g.createLinearGradient(0, top, 0, top + depth * 2.4); fg2.addColorStop(0, P_([230, 245, 255], fog, fk * .6, .85)); fg2.addColorStop(1, P_([230, 245, 255], fog, fk * .6, 0)); g.fillStyle = fg2; g.fillRect(fx - 3, top, 6, depth * 2.4); }
}
/* engranaje ilustrado (latón) */
function paintGearIll(g, x, y, R, rot, pal = PAL.brass, fog, fk = 0, teeth) {
  const n = teeth || Math.max(8, Math.round(R / 7));
  g.save(); g.translate(x, y); g.rotate(rot);
  const shape = (rr) => { g.beginPath(); for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + .25) / n * TAU, a2 = (i + .5) / n * TAU, a3 = (i + .75) / n * TAU; g.lineTo(Math.cos(a0) * rr * .86, Math.sin(a0) * rr * .86); g.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); g.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr); g.lineTo(Math.cos(a3) * rr * .86, Math.sin(a3) * rr * .86); } g.closePath(); };
  g.fillStyle = P_(pal.dark, fog, fk); g.translate(R * .04, R * .05); shape(R); g.fill(); g.translate(-R * .04, -R * .05);
  g.fillStyle = P_(pal.mid, fog, fk); shape(R * .97); g.fill();
  g.save(); shape(R * .97); g.clip(); g.fillStyle = P_(pal.light, fog, fk); g.beginPath(); g.arc(-R * .25, -R * .25, R * .8, 0, TAU); g.fill(); g.restore();
  g.fillStyle = P_(pal.dark, fog, fk, .9); g.beginPath(); g.arc(0, 0, R * .62, 0, TAU); g.arc(0, 0, R * .5, 0, TAU, true); g.fill();
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.fillStyle = P_(pal.dark, fog, fk, .55); g.beginPath(); g.ellipse(Math.cos(a) * R * .34, Math.sin(a) * R * .34, R * .1, R * .07, a, 0, TAU); g.fill(); }
  g.fillStyle = P_(pal.hi || pal.light, fog, fk); g.beginPath(); g.arc(0, 0, R * .16, 0, TAU); g.fill(); g.fillStyle = P_(pal.dark, fog, fk); g.beginPath(); g.arc(0, 0, R * .07, 0, TAU); g.fill();
  g.restore();
}
/* hierba ilustrada (matas con varias hojas) para decorados estáticos */
function paintTuft(g, x, y, h, pal, r, fog, fk = 0) {
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - .5) * 1.3 + (r() - .5) * .2, len = h * (.6 + r() * .5), col = i % 3 === 0 ? pal.dark : i % 3 === 1 ? pal.mid : pal.light;
    g.fillStyle = P_(col, fog, fk); g.beginPath(); g.moveTo(x - 2.5, y); g.quadraticCurveTo(x + Math.sin(a) * len * .4, y - len * .6, x + Math.sin(a) * len, y - Math.cos(a) * len); g.quadraticCurveTo(x + Math.sin(a) * len * .35 + 1, y - len * .5, x + 2.5, y); g.fill();
  }
}

/* plataforma ilustrada según material y estilo (isla flotante, losa o tronco) */
function matPal(mat) { const P = MATS[mat] || MATS.rock; return { hi: mixc(P.lit, [255, 255, 255], .35), light: P.lit, mid: P.col, dark: P.shade, deep: P.deep, out: P.out }; }
function paintPlatform(g, p) {
  const r = mulberry32((p.x * 3 + p.y * 7) | 0), th = p.h || 26, x = p.x, y = p.y, w = p.w;
  let pal = matPal(p.mat); if (p.tint) { const T = p.tint, k = p.tintK || .3; pal = Object.fromEntries(Object.entries(pal).map(([n, c]) => [n, mixc(c, T, n === 'out' ? 0 : k)])); }
  if (p.style === 'log') {
    g.fillStyle = rgba(pal.mid); g.beginPath(); g.roundRect(x, y, w, th, th / 2); g.fill();
    g.fillStyle = rgba(pal.dark); g.beginPath(); g.roundRect(x, y + th * .55, w, th * .45, [0, 0, th / 2, th / 2]); g.fill();
    g.strokeStyle = rgba(pal.light); g.lineWidth = 2; g.beginPath(); g.moveTo(x + th / 2, y + 3); g.lineTo(x + w - th / 2, y + 3); g.stroke();
    g.strokeStyle = rgba(pal.dark, .7); g.lineWidth = 1.4; for (let k = 0; k < w / 26; k++) { const xx = x + 12 + k * 26 + r() * 8; g.beginPath(); g.moveTo(xx, y + 6); g.lineTo(xx + 10, y + 7); g.stroke(); }
    g.fillStyle = rgba(pal.light); g.beginPath(); g.ellipse(x + w - th * .25, y + th / 2, th * .25, th / 2 - 1, 0, 0, TAU); g.fill();
    g.strokeStyle = rgba(pal.dark); g.lineWidth = 1.2; for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(x + w - th * .25, y + th / 2, th * .25 * k / 4, (th / 2 - 1) * k / 4, 0, 0, TAU); g.stroke(); }
    return;
  }
  if (p.style === 'flat' || MATS[p.mat] && (MATS[p.mat].brick || MATS[p.mat].planks)) {
    const P = MATS[p.mat] || MATS.rock;
    g.fillStyle = rgba(pal.out); g.beginPath(); g.roundRect(x - 1, y - 1, w + 2, th + 2, 6); g.fill();
    g.fillStyle = rgba(pal.mid); g.beginPath(); g.roundRect(x, y, w, th, 5); g.fill();
    g.fillStyle = rgba(pal.dark); g.beginPath(); g.roundRect(x, y + th * .62, w, th * .38, [0, 0, 5, 5]); g.fill();
    g.fillStyle = rgba(pal.light); g.beginPath(); g.roundRect(x + 2, y + 1, w - 4, 5, 3); g.fill();
    if (P.brick || P.planks) { g.strokeStyle = rgba(pal.deep, .55); g.lineWidth = 1.6; const step = P.planks ? 44 : 32; for (let xx = x + step - (y % 7); xx < x + w - 6; xx += step) { g.beginPath(); g.moveTo(xx, y + 6); g.lineTo(xx, y + th - 2); g.stroke(); } }
    if (P.rivets) { g.fillStyle = rgba(pal.hi); for (let xx = x + 8; xx < x + w - 4; xx += 22) { g.beginPath(); g.arc(xx, y + th * .4, 2, 0, TAU); g.fill(); } }
    if (P.emissive) { g.strokeStyle = 'rgba(255,140,50,.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w * .2, y + th); g.lineTo(x + w * .3, y + th * .55); g.lineTo(x + w * .42, y + th * .8); g.stroke(); }
    return;
  }
  // isla flotante: cuerpo de roca facetada que se estrecha hacia abajo + raíces
  // fondo con lóbulos y goterones de roca (no un único triángulo)
  const depth = Math.min(Math.max(th * 1.8, w * .3), 46 + th * 1.6), pts = [[x - 2, y + 2], [x + w + 2, y + 2]];
  const n = Math.max(6, Math.round(w / 26)), lobes = Math.max(1, Math.round(w / 120));
  for (let i = 1; i < n; i++) { const t = 1 - i / n, xx = x + t * w, env = Math.pow(Math.sin(t * Math.PI), .6), lob = .55 + .45 * Math.abs(Math.sin(t * Math.PI * lobes + r() * .3));
    pts.push([xx + (r() - .5) * w / n * .5, y + 6 + env * depth * lob * (.8 + .35 * r())]); }
  pts.push([x + 4, y + 10]);
  const sorted = [pts[0], pts[1], ...pts.slice(2)];
  paintRock(g, sorted, pal, r, null, 0, { sharp: 1, cracks: 2 });
  g.strokeStyle = rgba(pal.out); g.lineWidth = 1.5; g.beginPath(); g.moveTo(sorted[0][0], sorted[0][1]); for (const q of sorted) g.lineTo(q[0], q[1]); g.closePath(); g.stroke();
  if (p.cover === 'grass' || p.cover === 'moss' || p.cover === 'darkgrass') {
    g.strokeStyle = 'rgba(70,46,34,.9)'; g.lineCap = 'round';
    for (let k = 0; k < Math.max(2, Math.round(w / 30)); k++) { const rx = x + 10 + r() * (w - 20), len = 12 + r() * depth * .7; g.lineWidth = 1 + r() * 1.4; g.beginPath(); g.moveTo(rx, y + 8); g.bezierCurveTo(rx + (r() - .5) * 10, y + len * .4, rx + (r() - .5) * 14, y + len * .7, rx + (r() - .5) * 8, y + len); g.stroke(); }
  }
}
