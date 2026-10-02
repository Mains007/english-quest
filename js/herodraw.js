"use strict";
/* =====================================================================
   LIO — dibujo del héroe (estilo de animación)
   Se pinta en un búfer a 2×, con contorno oscuro limpio alrededor de toda
   la silueta, sombreado en 2 tonos y luz de borde. Cara con ojos, cejas y
   boca que cambian según el estado. Capucha, pelo, túnica, cinturón con
   runa, guantes, pantalón y botas. Bufanda y capa con física.
   Escudo rúnico: barrera de energía con superficie de muelles (ondula
   como un fluido al recibir golpes), runas en órbita y chispas.
   ===================================================================== */
const HERO_BUFS = {}, HERO_BUF = { W: 220, H: 210, OX: 110, OY: 160 };
const HERO_COL = { tunic: '#efe2c4', tunicS: '#c9b08a', pants: '#3c4a66', pantsS: '#2a3348', boot: '#7a4a2a', bootS: '#563019', cuff: '#b07a44', glove: '#8a5632', gloveS: '#64391e', belt: '#5a3820', outline: '#1a1420' };

function heroBuffers(S = 2) {
  let B = HERO_BUFS[S]; if (!B) { B = HERO_BUFS[S] = Object.assign({ S }, HERO_BUF); B.c = mk(B.W * S, B.H * S); B.o = mk(B.W * S, B.H * S); }
  return B;
}
/* dibuja al héroe completo (capa, bufanda, cuerpo) con contorno */
function drawHeroLio(g, h, SK, opt = {}) {
  const B = heroBuffers(h.bufS || 2), bg = B.c.getContext('2d'), og = B.o.getContext('2d'), S = B.S;
  bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, B.c.width, B.c.height);
  bg.setTransform(S, 0, 0, S, B.OX * S, B.OY * S);
  // tela en coordenadas del mundo → locales
  bg.save(); bg.translate(-h.x, -h.y); drawHeroCloth(bg, h, SK); bg.restore();
  drawHeroParts(bg, h, SK);
  // destello blanco al recibir daño
  if (h.hurtFlash > 0) { bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-atop'; bg.fillStyle = `rgba(255,255,255,${Math.min(.85, h.hurtFlash * 6)})`; bg.fillRect(0, 0, B.c.width, B.c.height); bg.restore(); }
  // contorno
  og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, B.o.width, B.o.height);
  const k = 1.7 * S; for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k * .7, k * .7], [-k * .7, k * .7], [k * .7, -k * .7], [-k * .7, -k * .7]]) og.drawImage(B.c, dx, dy);
  og.globalCompositeOperation = 'source-in'; og.fillStyle = opt.outline || HERO_COL.outline; og.fillRect(0, 0, B.o.width, B.o.height); og.globalCompositeOperation = 'source-over';
  g.drawImage(B.o, h.x - B.OX, h.y - B.OY, B.W, B.H); g.drawImage(B.c, h.x - B.OX, h.y - B.OY, B.W, B.H);
  // estela del arma fuera del búfer (sin contorno)
  const P = h._pose; if (P && h.atk) { g.save(); g.translate(h.x, h.y); g.scale(P.sx * h.face, P.sy); g.translate(0, P.bob); g.rotate(P.lean); drawWeaponFX(g, h, P.ap); g.restore(); }
}
/* copia de la silueta para estelas de esquiva */
function heroSilhouette(h) {
  const B = heroBuffers(h.bufS || 2), c = mk(B.W, B.H), g = c.getContext('2d');
  g.drawImage(B.c, 0, 0, B.W, B.H); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, B.W, B.H);
  return c;
}

/* ---------- capa y bufanda (coordenadas del mundo) ---------- */
function drawHeroCloth(g, h, SK) {
  const f = h.face, cp = h.cape;
  if (SK.back !== 'none') {
    const long = SK.back === 'cape', ext = long ? 1.6 : 1;
    // capa: forro + exterior con pliegues
    const pts = cp.map((s, i) => [lerp(h.x, s.x, ext) - f * 2, h.y - 42 + (s.y - (h.y - 42)) * ext]);
    const outer = (dx) => { g.beginPath(); g.moveTo(h.x - f * 6, h.y - 44); for (let i = 0; i < pts.length; i++) g.lineTo(pts[i][0] - f * (i * .8 + dx), pts[i][1]); for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i][0] + f * (10 + i * 1.6), pts[i][1] + 3); g.lineTo(h.x + f * 4, h.y - 42); g.closePath(); };
    g.fillStyle = SK.cloak[1]; outer(2); g.fill();
    g.fillStyle = SK.cloak[0]; outer(-2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.2; for (let k = 1; k < 3; k++) { g.beginPath(); for (let i = 0; i < pts.length; i++) g.lineTo(pts[i][0] + f * (k * 4 + i * .5), pts[i][1] + 2); g.stroke(); }
  }
  // bufanda: cinta con dos tonos y extremos deshilachados
  const sc = h.scarf, cols = SK.scarf;
  for (let i = sc.length - 1; i >= 1; i--) {
    const a = sc[i - 1], b = sc[i], w = lerp(7, 3.4, i / sc.length), ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang) * w / 2, ny = Math.cos(ang) * w / 2;
    g.fillStyle = cols.length > 2 ? cols[i % cols.length] : i % 2 ? cols[0] : cols[1];
    g.beginPath(); g.moveTo(a.x + nx, a.y + ny); g.lineTo(b.x + nx * .9, b.y + ny * .9); g.lineTo(b.x - nx * .9, b.y - ny * .9); g.lineTo(a.x - nx, a.y - ny); g.closePath(); g.fill();
  }
  const e = sc[sc.length - 1], p = sc[sc.length - 2], ea = Math.atan2(e.y - p.y, e.x - p.x);
  g.strokeStyle = cols[0]; g.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(e.x, e.y + k * 1.2); g.lineTo(e.x + Math.cos(ea + k * .3) * 4, e.y + Math.sin(ea + k * .3) * 4); g.stroke(); }
}

/* ---------- miembro con forma (no un palito) ---------- */
function limb(g, ax, ay, bx, by, cx, cy, w0, w1, w2, col, colS) {
  const seg = (x0, y0, x1, y1, a, b) => { const an = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(an), ny = Math.cos(an); g.beginPath(); g.moveTo(x0 + nx * a, y0 + ny * a); g.lineTo(x1 + nx * b, y1 + ny * b); g.arc(x1, y1, b, an + Math.PI / 2, an - Math.PI / 2, true); g.lineTo(x0 - nx * a, y0 - ny * a); g.arc(x0, y0, a, an - Math.PI / 2, an + Math.PI / 2, true); g.closePath(); g.fill(); };
  g.fillStyle = col; seg(ax, ay, bx, by, w0, w1); seg(bx, by, cx, cy, w1, w2);
  if (colS) { g.fillStyle = colS; g.save(); g.globalAlpha *= .55; const an = Math.atan2(cy - by, cx - bx); g.beginPath(); g.arc(bx + Math.cos(an) * .5, by + Math.sin(an) * .5, w1 * .8, an - .3, an + Math.PI - .3); g.fill(); g.restore(); }
}

/* ---------- cuerpo (espacio local, pies en 0,0) ---------- */
function drawHeroParts(g, h, SK) {
  const t = h.game.rt, f = h.face, st = h.state, run = st === 'run', air = st === 'jump' || st === 'fall';
  const bob = run ? -Math.abs(Math.sin(h.phase)) * 2.8 : st === 'idle' ? Math.sin(t * 2.2) * 1 : 0;
  const sx = 1 + (1 - h.sq) * .55, sy = h.sq, C = HERO_COL;
  g.save(); g.scale(sx * f, sy);
  // ----- piernas (IK) -----
  const hipY = -18 + bob * .4, legs = [];
  for (const side of [-1, 1]) {
    let fx, fy;
    if (run) { const ph = h.phase + (side > 0 ? Math.PI : 0); fx = Math.cos(ph) * 12; fy = -Math.max(0, Math.sin(ph)) * 10; }
    else if (st === 'dash') { fx = side * 9 - 7; fy = -4 + side * 2; }
    else if (st === 'pound') { fx = side * 6; fy = -12; }
    else if (air) { fx = (side > 0 ? 8 : -4); fy = h.vy < 0 ? (side > 0 ? -11 : -4) : (side > 0 ? -2 : -9); }
    else if (st === 'wall') { fx = -6 * (side > 0 ? 1 : .2); fy = side > 0 ? -12 : -3; }
    else if (st === 'block') { fx = side * 8; fy = 0; }
    else { fx = side * 5; fy = 0; }
    legs.push([side, ik2(side * 3, hipY, fx + side * 2, fy, 9.5, 10, 1)]);
  }
  legs.sort((a, b) => a[0] - b[0]);
  for (const [side, [kx, ky, ex, ey]] of legs) {
    const back = side < 0;
    limb(g, side * 3, hipY, kx, ky, ex, ey - 2, 4.2, 3.6, 3.4, back ? C.pantsS : C.pants, null);
    // bota
    g.fillStyle = back ? C.bootS : C.boot; g.beginPath(); g.moveTo(ex - 3.6, ey - 7); g.lineTo(ex + 2.8, ey - 7); g.quadraticCurveTo(ex + 3.4, ey - 3, ex + 7.4, ey - 2.4); g.quadraticCurveTo(ex + 8.6, ey + .4, ex + 6, ey + .6); g.lineTo(ex - 3.8, ey + .6); g.closePath(); g.fill();
    g.fillStyle = back ? C.bootS : C.cuff; g.beginPath(); g.roundRect(ex - 4.2, ey - 8.6, 7.6, 3, 1.4); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(ex - 3.8, ey - .6, 11.4, 1.2);
  }
  // ----- torso -----
  const lean = (st === 'dash' ? .35 : run ? .1 : st === 'attack' ? .14 : st === 'hurt' ? -.2 : 0) + (h.poseLean || 0);
  g.translate(0, bob); g.rotate(lean);
  drawBack(g, SK.back, t, h);
  if (SK.back === 'pack') drawPack(g, h, sx, sy, bob, f);
  else h.lanternPos = null;
  const ap = armPose(h, t);
  // brazo trasero
  limb(g, -2, -37, (ap.bx - 2) / 2 - 1, (ap.by - 37) / 2 + 3, ap.bx, ap.by, 3, 2.6, 2.6, C.tunicS, null);
  g.fillStyle = C.gloveS; g.beginPath(); g.arc(ap.bx, ap.by, 3.1, 0, TAU); g.fill();
  // túnica
  g.fillStyle = C.tunic; g.beginPath(); g.moveTo(-8.5, -38); g.quadraticCurveTo(-10.5, -26, -9.5, -15); g.lineTo(-7, -12); g.lineTo(-3, -14.5); g.lineTo(1, -11.5); g.lineTo(5, -14.5); g.lineTo(9, -12); g.lineTo(10, -15); g.quadraticCurveTo(11, -26, 8.5, -38); g.closePath(); g.fill();
  g.fillStyle = C.tunicS; g.beginPath(); g.moveTo(3, -38); g.quadraticCurveTo(5, -26, 4, -14); g.lineTo(5, -14.5); g.lineTo(9, -12); g.lineTo(10, -15); g.quadraticCurveTo(11, -26, 8.5, -38); g.closePath(); g.fill();
  // cinturón con runa
  g.fillStyle = C.belt; g.fillRect(-9.6, -21, 19.6, 3.4);
  const wc = WEAPONS[h.weapon].col; g.fillStyle = rgba(wc); g.beginPath(); g.roundRect(2.5, -21.8, 5, 5, 1.2); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(3.4, -21, 1.4, 1.4);
  // manto sobre los hombros (color de la capa)
  g.fillStyle = SK.cloak[0]; g.beginPath(); g.moveTo(-10, -40); g.quadraticCurveTo(0, -44, 10, -40); g.quadraticCurveTo(12, -34, 9, -30.5); g.quadraticCurveTo(0, -27, -9, -30.5); g.quadraticCurveTo(-12, -34, -10, -40); g.fill();
  g.fillStyle = SK.cloak[1]; g.beginPath(); g.moveTo(2, -41); g.quadraticCurveTo(9, -41, 10, -38); g.quadraticCurveTo(12, -34, 9, -30.5); g.quadraticCurveTo(5, -29, 2, -29.5); g.closePath(); g.fill();
  if (SK.cloakDef.shimmer) { g.save(); g.beginPath(); g.moveTo(-10, -40); g.quadraticCurveTo(0, -44, 10, -40); g.quadraticCurveTo(12, -34, 9, -30.5); g.quadraticCurveTo(0, -27, -9, -30.5); g.closePath(); g.clip(); const sx2 = ((t * 30) % 50) - 25; g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(sx2 - 3, -45); g.lineTo(sx2 + 3, -45); g.lineTo(sx2 - 3, -26); g.lineTo(sx2 - 9, -26); g.fill(); g.restore(); }
  if (SK.cloakDef.stars) { g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.globalAlpha = .4 + .5 * Math.sin(t * 3 + i * 2) ** 2; g.fillRect(-8 + hash1(i) * 16, -40 + hash1(i * 7) * 9, 1.2, 1.2); } g.globalAlpha = 1; }
  // broche de la capa
  g.fillStyle = '#e8c060'; g.beginPath(); g.arc(-4, -37, 1.9, 0, TAU); g.fill();
  // ----- cabeza -----
  drawHeroHead(g, h, SK, t);
  // ----- brazo delantero + arma -----
  drawWeapon(g, h, ap.hx, ap.hy, ap.wa, true);
  limb(g, 4, -37, ap.ex, ap.ey, ap.hx, ap.hy, 3.2, 2.8, 2.8, C.tunic, C.tunicS);
  g.fillStyle = C.glove; g.beginPath(); g.arc(ap.hx, ap.hy, 3.3, 0, TAU); g.fill(); g.fillStyle = C.gloveS; g.beginPath(); g.arc(ap.hx + .8, ap.hy + .8, 2.2, 0, Math.PI); g.fill();
  h._pose = { sx, sy, bob, lean, ap };
  g.restore();
}
function drawPack(g, h, sx, sy, bob, f) {
  g.fillStyle = '#7a5232'; g.beginPath(); g.roundRect(-17, -40, 10, 20, 4); g.fill();
  g.fillStyle = '#5a3a20'; g.beginPath(); g.roundRect(-17, -40, 10, 6, [4, 4, 1, 1]); g.fill(); g.fillStyle = '#c9a23a'; g.fillRect(-13, -36, 2.4, 2.4);
  const la = h.lantA, lx = -15 + Math.sin(la) * 6, ly = -21 + Math.cos(la) * 6;
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-15, -25); g.lineTo(lx, ly); g.stroke();
  g.fillStyle = '#3b2c1c'; g.fillRect(lx - 3.5, ly, 7, 2); g.fillStyle = '#ffe2a0'; g.beginPath(); g.roundRect(lx - 3, ly + 2, 6, 7, 2); g.fill(); g.fillStyle = '#3b2c1c'; g.fillRect(lx - 3.5, ly + 9, 7, 1.6);
  h.lanternPos = [h.x + lx * f * sx, h.y + (ly + 5 + bob) * sy];
}
/* cabeza: capucha (o pelo con sombrero), cara con expresiones */
function drawHeroHead(g, h, SK, t) {
  const st = h.state, hood = SK.hat === 'hood', cx = 2, cy = -52;
  const hurt = st === 'hurt' || (h.inv > .6 && h.lastHurt && h.game.t - h.lastHurt < .4), dead = h.dead, atk = !!h.atk || st === 'pound', happy = h.tauntT > 0 || st === 'victory';
  const swayTip = Math.sin(t * 3 + h.x * .02) * 1.5 - clamp(h.vx * .006, -3, 3) - clamp(h.vy * .004, -3, 3);
  // capucha trasera (punta que se mueve)
  if (hood) {
    g.fillStyle = SK.hood[1]; g.beginPath(); g.moveTo(cx - 6, cy - 11); g.quadraticCurveTo(cx - 20, cy - 12 + swayTip, cx - 24 + swayTip, cy + 2 + swayTip * .5); g.quadraticCurveTo(cx - 15, cy - 2, cx - 10, cy + 6); g.closePath(); g.fill();
    g.fillStyle = SK.hood[0]; g.beginPath(); g.arc(cx - 1, cy, 13.4, 0, TAU); g.fill();
    g.fillStyle = SK.hood[1]; g.beginPath(); g.arc(cx - 1, cy, 13.4, Math.PI * .45, Math.PI * 1.15); g.lineTo(cx - 1, cy); g.closePath(); g.fill();
  }
  // cara
  g.fillStyle = SK.skin; g.beginPath(); g.ellipse(cx + 3.2, cy + 1, 9.6, 9.8, 0, 0, TAU); g.fill();
  g.fillStyle = SK.skinS; g.beginPath(); g.ellipse(cx + 3.2, cy + 1, 9.6, 9.8, 0, Math.PI * .15, Math.PI * .85); g.ellipse(cx + 2, cy + 5, 7, 4, 0, 0, Math.PI); g.fill();
  if (!hood) { // pelo completo
    g.fillStyle = SK.hair; g.beginPath(); g.moveTo(cx - 9, cy + 4); g.quadraticCurveTo(cx - 12, cy - 10, cx + 1, cy - 12); g.quadraticCurveTo(cx + 12, cy - 13, cx + 13, cy - 4); g.lineTo(cx + 9, cy - 6); g.lineTo(cx + 7, cy - 3); g.lineTo(cx + 4, cy - 7); g.lineTo(cx + 1, cy - 3); g.lineTo(cx - 3, cy - 5); g.quadraticCurveTo(cx - 4, cy + 2, cx - 9, cy + 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(cx + 2, cy - 10, 5, 1.6, -.2, 0, TAU); g.fill();
  } else { // borde de la capucha + mechón
    g.fillStyle = SK.hair; g.beginPath(); g.moveTo(cx - 1, cy - 9); g.quadraticCurveTo(cx + 7, cy - 11, cx + 11, cy - 5); g.lineTo(cx + 8, cy - 6.5); g.lineTo(cx + 7.5, cy - 3.5); g.lineTo(cx + 4.5, cy - 6.5); g.lineTo(cx + 2.5, cy - 4); g.closePath(); g.fill();
    g.strokeStyle = SK.hood[0]; g.lineWidth = 3.4; g.beginPath(); g.arc(cx + 3, cy + 1, 11, -Math.PI * .95, -Math.PI * .08); g.stroke();
    g.strokeStyle = SK.hood[1]; g.lineWidth = 1.2; g.beginPath(); g.arc(cx + 3, cy + 1, 9.6, -Math.PI * .9, -Math.PI * .12); g.stroke();
  }
  // mejillas
  g.fillStyle = 'rgba(255,120,120,.28)'; g.beginPath(); g.ellipse(cx + 6, cy + 4.5, 2.6, 1.6, 0, 0, TAU); g.fill();
  // ojos
  const ex1 = cx + 5.6, ex2 = cx + 11, ey = cy - .6, eyeC = rgba(SK.eye);
  const blink = (h.blink < 0 || h.idleEyes) && !dead && !hurt;
  if (dead) { g.strokeStyle = '#2a1a1a'; g.lineWidth = 1.4; for (const x of [ex1, ex2]) { g.beginPath(); g.moveTo(x - 1.8, ey - 1.8); g.lineTo(x + 1.8, ey + 1.8); g.moveTo(x + 1.8, ey - 1.8); g.lineTo(x - 1.8, ey + 1.8); g.stroke(); } }
  else if (hurt) { g.strokeStyle = '#2a1a1a'; g.lineWidth = 1.5; g.lineCap = 'round'; for (const [x, s] of [[ex1, 1], [ex2, -1]]) { g.beginPath(); g.moveTo(x - 2, ey - 1.6 * s); g.lineTo(x + 1.6 * s, ey); g.lineTo(x - 2, ey + 1.6 * s); g.stroke(); } }
  else if (blink || happy) { g.strokeStyle = '#2a1a1a'; g.lineWidth = 1.4; g.lineCap = 'round'; for (const x of [ex1, ex2]) { g.beginPath(); if (happy) g.arc(x, ey + 1, 2, Math.PI * 1.1, Math.PI * 1.9); else { g.moveTo(x - 2, ey); g.lineTo(x + 2, ey); } g.stroke(); } }
  else {
    const look = clamp(h.vx * .004, -.6, .8) + (atk ? .8 : 0);
    for (const [x, s] of [[ex1, .88], [ex2, 1]]) {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, 2.3 * s, (atk ? 2.6 : 3.2) * s, 0, 0, TAU); g.fill();
      g.fillStyle = eyeC; g.beginPath(); g.ellipse(x + .6 + look * .5, ey + .3, 1.7 * s, (atk ? 2.1 : 2.5) * s, 0, 0, TAU); g.fill();
      g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(x + .8 + look * .6, ey + .5, 1 * s, 1.4 * s, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + .1 + look * .3, ey - .9, .7 * s, 0, TAU); g.fill();
    }
  }
  // cejas
  g.strokeStyle = SK.hair === '#f0f0f8' ? '#8a8a98' : SK.hair; g.lineWidth = 1.3; g.lineCap = 'round';
  const bAng = atk ? .35 : hurt ? -.3 : happy ? -.15 : 0;
  for (const [x, s] of [[ex1, -1], [ex2, 1]]) { g.beginPath(); g.moveTo(x - 1.8, ey - 4.2 + bAng * s * -1.5); g.lineTo(x + 1.8, ey - 4.2 - bAng * s * -1.5 + (s < 0 ? .3 : 0)); g.stroke(); }
  // nariz y boca
  g.strokeStyle = SK.skinS; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 13.2, cy + 1); g.quadraticCurveTo(cx + 14.2, cy + 2.6, cx + 12.6, cy + 3); g.stroke();
  g.strokeStyle = '#5a2a22'; g.fillStyle = '#7a2a2a'; g.lineWidth = 1.1;
  if (h.idleMouth && !atk && !hurt && !dead) { g.beginPath(); g.ellipse(cx + 9.6, cy + 6.4, 1.6 + h.idleMouth * .6, 1.2 + h.idleMouth * 1.8, 0, 0, TAU); g.fill(); }
  else if (atk || st === 'pound') { g.beginPath(); g.ellipse(cx + 9.6, cy + 6, 1.8, 1.4, 0, 0, TAU); g.fill(); }
  else if (hurt || dead) { g.beginPath(); g.moveTo(cx + 7.6, cy + 6.6); g.quadraticCurveTo(cx + 9.6, cy + 5.4, cx + 11.4, cy + 6.6); g.stroke(); }
  else if (happy || st === 'idle') { g.beginPath(); g.moveTo(cx + 8, cy + 5.4); g.quadraticCurveTo(cx + 9.8, cy + 7, cx + 11.6, cy + 5.4); g.stroke(); }
  else { g.beginPath(); g.moveTo(cx + 8.2, cy + 5.8); g.lineTo(cx + 11.2, cy + 5.8); g.stroke(); }
  // sombrero opcional
  if (!hood) drawHat(g, SK.hat, t);
}

/* ---------- efectos del arma (estela) ---------- */
function drawWeaponFX(g, h, ap) {
  const atk = h.atk, W = h.weapon, col = WEAPONS[W].col; if (!atk) return;
  const p = atk.t / atk.dur;
  if (atk.kind !== 'down' && W !== 'spear' && W !== 'gauntlet' && p > .18 && p < .62) {
    g.save(); g.globalCompositeOperation = 'lighter'; const swingDir = h.combo % 2 === 0 ? 1 : -1, r = WEAPONS[W].reach * .84, k = (p - .18) / .44;
    const a0 = swingDir > 0 ? -2.3 : 1.0, a1 = lerp(a0, swingDir > 0 ? 1.0 : -2.2, Math.min(1, k * 1.7));
    for (let L = 0; L < 3; L++) {
      g.globalAlpha = (.55 - L * .15) * (1 - k * .5);
      const rr = r * (1 - L * .1), gr = g.createRadialGradient(6, -32, rr * .35, 6, -32, rr); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.75, rgba(col, .8)); gr.addColorStop(1, 'rgba(255,255,255,.95)');
      g.fillStyle = gr; g.beginPath(); g.arc(6, -32, rr, Math.min(a0, a1), Math.max(a0, a1)); g.arc(6, -32, rr * (.5 + L * .08), Math.max(a0, a1), Math.min(a0, a1), true); g.fill();
    }
    g.restore();
  }
  if (W === 'spear' && p > .2 && p < .6) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(col, .55); g.beginPath(); g.moveTo(20, -36); g.lineTo(104, -33); g.lineTo(20, -30); g.fill(); g.restore(); }
}

/* ---------- escudo rúnico (barrera de energía con superficie de muelles) ---------- */
const SHIELD_N = 18;
function shieldState(h) {
  if (!h.shield) h.shield = { y: new Float32Array(SHIELD_N), v: new Float32Array(SHIELD_N), on: 0, pop: 0, hits: [], runeA: 0, crack: 0 };
  return h.shield;
}
function shieldImpact(h, srcY, power, parry) {
  const S = shieldState(h); const rel = clamp(((srcY ?? (h.y - 34)) - (h.y - 64)) / 60, 0, 1), i = Math.round(rel * (SHIELD_N - 1));
  for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < SHIELD_N) S.v[j] -= (parry ? 260 : 160) * power * (1 - Math.abs(k) * .3); }
  S.hits.push({ i, t: 0, parry }); if (parry) S.pop = 1; else S.crack = Math.min(1, S.crack + .25 * power);
}
function updateShield(h, dt) {
  const S = shieldState(h); S.on = approach(S.on, h.blocking ? 1 : 0, dt * (h.blocking ? 9 : 6)); S.pop = Math.max(0, S.pop - dt * 2.5); S.runeA += dt * 2.2;
  S.crack = h.blocking ? Math.max(S.crack, 1 - h.stamina / 100 - .35) : Math.max(0, S.crack - dt);
  // muelles con propagación (como una superficie de agua)
  for (let k = 0; k < 2; k++) for (let i = 0; i < SHIELD_N; i++) {
    const l = i > 0 ? S.y[i - 1] : 0, r = i < SHIELD_N - 1 ? S.y[i + 1] : 0;
    S.v[i] += ((l + r - 2 * S.y[i]) * 180 - S.y[i] * 90 - S.v[i] * 4.5) * dt * .5;
  }
  for (let i = 0; i < SHIELD_N; i++) S.y[i] += S.v[i] * dt;
  for (const hh of S.hits) hh.t += dt; S.hits = S.hits.filter(hh => hh.t < .5);
}
function drawShield(g, h) {
  const S = h.shield; if (!S || S.on < .02) return;
  const t = h.game.rt, f = h.face, on = easeOut(S.on), parry = h.blocking && h.blockT < (h.skills && h.skills.parry ? .26 : .18);
  const cx = h.x + f * 8, cy = h.y - 34, R = (30 + S.pop * 10) * (.6 + .4 * on);
  const low = S.crack > .4, base = low ? [255, 120, 90] : parry ? [255, 255, 255] : [130, 220, 255];
  // puntos del arco deformado por los muelles + ondulación viva
  const pts = [];
  for (let i = 0; i < SHIELD_N; i++) { const a = -Math.PI * .5 + i / (SHIELD_N - 1) * Math.PI, wob = Math.sin(t * 7 + i * .8) * 1.2 + Math.sin(t * 13 - i * 1.3) * .6; const rr = R + S.y[i] + wob; pts.push([cx + Math.cos(a) * rr * .78 * f, cy + Math.sin(a) * rr]); }
  g.save(); g.globalCompositeOperation = 'lighter';
  // cuerpo: lámina translúcida con degradado
  const gr = g.createRadialGradient(cx - f * 6, cy, R * .2, cx + f * 8, cy, R * 1.1); gr.addColorStop(0, rgba(base, 0)); gr.addColorStop(.6, rgba(base, .12 * on)); gr.addColorStop(1, rgba(base, .42 * on));
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - f * 4, cy - R * .95); for (const p of pts) g.lineTo(p[0], p[1]); g.lineTo(cx - f * 4, cy + R * .95); g.quadraticCurveTo(cx + f * 6, cy, cx - f * 4, cy - R * .95); g.fill();
  // borde brillante (doble trazo)
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = rgba(base, .5 * on); g.lineWidth = 6; g.beginPath(); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke();
  g.strokeStyle = rgba(mixc(base, [255, 255, 255], .6), .95 * on); g.lineWidth = 2; g.beginPath(); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke();
  // hexágonos sutiles de energía que fluyen
  g.strokeStyle = rgba(base, .22 * on); g.lineWidth = 1;
  for (let k = 0; k < 3; k++) { const ph = (t * .8 + k / 3) % 1; g.beginPath(); for (let i = 0; i < SHIELD_N; i++) { const p = pts[i]; g.lineTo(lerp(cx, p[0], .55 + ph * .4), lerp(cy, p[1], .55 + ph * .4)); } g.stroke(); }
  // ondas de impacto
  for (const hh of S.hits) { const p = pts[hh.i], k = hh.t / .5; g.strokeStyle = rgba(hh.parry ? [255, 255, 255] : base, (1 - k) * .9); g.lineWidth = 2.5; g.beginPath(); g.arc(p[0], p[1], 4 + k * 26, 0, TAU); g.stroke(); }
  // runas en órbita
  g.font = '700 10px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = rgba(mixc(base, [255, 255, 255], .5), .9 * on);
  const RUNES = 'ᚱᚢᚾᛖ';
  for (let k = 0; k < 4; k++) { const u = (S.runeA * .25 + k / 4) % 1, i = Math.min(SHIELD_N - 1, Math.floor(u * SHIELD_N)), p = pts[i]; g.fillText(RUNES[k], p[0] - f * 3, p[1]); }
  // grietas cuando falta aliento
  if (S.crack > .4) { g.strokeStyle = `rgba(255,190,150,${(S.crack - .4) * 1.5 * on})`; g.lineWidth = 1.4; const mid = pts[SHIELD_N >> 1]; g.beginPath(); g.moveTo(mid[0], mid[1]); g.lineTo(mid[0] - f * 8, mid[1] - 6); g.lineTo(mid[0] - f * 5, mid[1] - 14); g.moveTo(mid[0] - f * 8, mid[1] - 6); g.lineTo(mid[0] - f * 14, mid[1] + 2); g.moveTo(mid[0], mid[1]); g.lineTo(mid[0] - f * 6, mid[1] + 10); g.stroke(); }
  g.restore();
  glowAt(g, base, cx + f * 10, cy, R * 1.6 + S.pop * 30, (parry ? .55 : .32) * on + S.pop * .5);
  // chispas que recorren la superficie
  if (on > .5 && chance(.5)) { const p = pts[RI(0, SHIELD_N - 1)]; FX.spawnRaw({ t: 'spark', x: p[0], y: p[1], vx: f * R(20, 80), vy: R(-60, 60), g: 0, drag: 3, max: .3, s: 1.6, col: base, add: 1 }); }
}

/* ---------- contorno limpio para cualquier personaje (enemigos, PNJ) ---------- */
const OUTLINE_BUF = { S: 2, W: 260, H: 300 };
function drawOutlined(g, cx, cy, fn, col = '#1a1420', rw, rh) {
  const B = OUTLINE_BUF, S = B.S; if (!B.c) { B.c = mk(B.W * S, B.H * S); B.o = mk(B.W * S, B.H * S); }
  // región de trabajo (en px del búfer): sólo alrededor de la figura → mucho menos relleno
  const W2 = Math.min(B.W, rw || B.W), H2 = Math.min(B.H, rh || B.H);
  const rx = Math.max(0, Math.floor((B.W / 2 - W2 / 2) * S)), ry = Math.max(0, Math.floor((B.H * .7 - H2 * .62) * S)), rW = Math.min(B.c.width - rx, Math.ceil(W2 * S)), rH = Math.min(B.c.height - ry, Math.ceil(H2 * S));
  const bg = B.c.getContext('2d'), og = B.o.getContext('2d');
  bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(rx - 6, ry - 6, rW + 12, rH + 12);
  bg.save(); bg.beginPath(); bg.rect(rx, ry, rW, rH); bg.clip();
  bg.setTransform(S, 0, 0, S, (B.W / 2 - cx) * S, (B.H * .7 - cy) * S); fn(bg); bg.restore();
  og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.clearRect(rx - 6, ry - 6, rW + 12, rH + 12);
  const k = 1.5 * S; for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k * .7, k * .7], [-k * .7, k * .7], [k * .7, -k * .7], [-k * .7, -k * .7]]) og.drawImage(B.c, rx, ry, rW, rH, rx + dx, ry + dy, rW, rH);
  og.globalCompositeOperation = 'source-in'; og.fillStyle = col; og.fillRect(rx, ry, rW, rH); og.globalCompositeOperation = 'source-over';
  const x = cx - B.W / 2, y = cy - B.H * .7;
  g.drawImage(B.o, rx, ry, rW, rH, x + rx / S, y + ry / S, rW / S, rH / S); g.drawImage(B.c, rx, ry, rW, rH, x + rx / S, y + ry / S, rW / S, rH / S);
}
