"use strict";
/* =====================================================================
   ARTE DE ENEMIGOS (v2) — mismo lenguaje que Lio y los jefes:
   3 tonos planos (base / sombra / luz), formas redondeadas, detalles
   legibles a tamaño de juego. El contorno lo pone drawOutlined().
   ===================================================================== */

/* ---------- Lobo Sombra ---------- */
Wolf.prototype.draw = function (g) {
  const ff = this.flashFill(g), f = this.face, run = Math.abs(this.vx) > 50, t = this.t, st = this.st;
  const C = ff || '#3e3468', S = ff || '#251d44', L = ff || '#6c5cb0', D = '#140e28';
  g.save(); g.translate(this.x, this.y); g.scale(f, 1); if (st === 'crouch') g.scale(1.06, .84);
  const bob = run ? -Math.abs(Math.sin(t * 11)) * 3 : Math.sin(t * 3) * .8;
  const leg = (x, ph, col, far) => { const a = run ? Math.sin(t * 22 + ph) * .8 : 0; g.strokeStyle = col; g.lineWidth = far ? 5 : 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, -16 + bob); g.lineTo(x + Math.sin(a) * 8, -8); g.lineTo(x + Math.sin(a) * 11 + 3, -2); g.stroke();
    g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.sin(a) * 11 + 4, -2, 4, 2.4, 0, 0, TAU); g.fill(); };
  leg(-16, 2, S, 1); leg(12, 3, S, 1);
  // cola espesa
  const tw = Math.sin(t * 6) * 4 + (run ? -4 : 0);
  g.fillStyle = C; g.beginPath(); g.moveTo(-20, -24 + bob); g.bezierCurveTo(-34, -32 + tw, -44, -26 + tw, -47, -15 + tw); g.quadraticCurveTo(-37, -20 + tw, -31, -15 + bob); g.quadraticCurveTo(-26, -14 + bob, -20, -15 + bob); g.closePath(); g.fill();
  g.fillStyle = L; g.beginPath(); g.moveTo(-47, -15 + tw); g.quadraticCurveTo(-45, -24 + tw, -38, -26 + tw); g.quadraticCurveTo(-41, -19 + tw, -47, -15 + tw); g.fill();
  // cuerpo
  g.save(); g.translate(0, bob);
  g.fillStyle = C; g.beginPath(); g.moveTo(-24, -18); g.quadraticCurveTo(-26, -30, -12, -31); g.quadraticCurveTo(4, -34, 14, -30); g.quadraticCurveTo(24, -28, 24, -18); g.quadraticCurveTo(20, -10, 12, -10); g.quadraticCurveTo(0, -13, -14, -10); g.quadraticCurveTo(-24, -10, -24, -18); g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = S; g.beginPath(); g.ellipse(0, -6, 30, 9, 0, 0, TAU); g.fill(); g.fillStyle = L; g.beginPath(); g.ellipse(-4, -35, 26, 6.5, 0, 0, TAU); g.fill(); g.restore(); }
  g.fillStyle = L; for (let i = 0; i < 4; i++) { const x = -14 + i * 7; g.beginPath(); g.moveTo(x - 3, -30.5); g.lineTo(x + 1, -36 - (i % 2) * 2); g.lineTo(x + 4, -31); g.fill(); }
  // melena
  g.fillStyle = C; g.beginPath(); g.moveTo(8, -32); for (let i = 0; i < 7; i++) { const a = -2.4 + i * .45; g.lineTo(16 + Math.cos(a) * 15, -22 + Math.sin(a) * 15); g.lineTo(16 + Math.cos(a + .22) * 10, -22 + Math.sin(a + .22) * 10); } g.lineTo(10, -12); g.closePath(); g.fill();
  g.fillStyle = L; g.beginPath(); g.moveTo(10, -31); g.lineTo(14, -38); g.lineTo(16, -31); g.lineTo(20, -36); g.lineTo(20, -30); g.closePath(); g.fill();
  g.restore();
  leg(-12, 0, C, 0); leg(16, 1, C, 0);
  // cabeza
  const open = st === 'dash' ? 1 : st === 'crouch' ? .4 : 0;
  g.save(); g.translate(24, -26 + bob + (st === 'crouch' ? 6 : 0));
  g.fillStyle = S; g.beginPath(); g.moveTo(-6, -6); g.lineTo(-9, -19); g.lineTo(-1, -8); g.fill();
  g.fillStyle = S; g.beginPath(); g.moveTo(-4, 2); g.lineTo(16, 3 + open * 5); g.lineTo(14, 6 + open * 6); g.lineTo(-2, 8); g.closePath(); g.fill();
  if (open) { g.fillStyle = '#fff'; for (const x of [6, 11]) { g.beginPath(); g.moveTo(x, 2); g.lineTo(x + 1.5, 5.5); g.lineTo(x + 3, 2); g.fill(); } }
  g.fillStyle = C; g.beginPath(); g.moveTo(-8, -6); g.quadraticCurveTo(0, -11, 8, -6); g.lineTo(19, -1); g.quadraticCurveTo(20, 2, 17, 3); g.lineTo(0, 4); g.quadraticCurveTo(-10, 2, -8, -6); g.closePath(); g.fill();
  if (!ff) { g.fillStyle = L; g.beginPath(); g.moveTo(-4, -8); g.quadraticCurveTo(4, -10, 12, -4); g.quadraticCurveTo(4, -6, -4, -6); g.fill(); }
  g.fillStyle = D; g.beginPath(); g.arc(19, 0, 2, 0, TAU); g.fill();
  g.fillStyle = C; g.beginPath(); g.moveTo(-3, -7); g.lineTo(-1, -21); g.lineTo(5, -8); g.fill();
  if (!ff) { g.fillStyle = '#8a4a7a'; g.beginPath(); g.moveTo(-1.5, -8); g.lineTo(-.5, -17); g.lineTo(3, -8.5); g.fill(); }
  const ec = st === 'crouch' || st === 'dash' ? '#ffffff' : '#ff4a6a';
  g.fillStyle = D; g.beginPath(); g.ellipse(7, -4, 4, 2.6, -.2, 0, TAU); g.fill(); g.fillStyle = ec; g.beginPath(); g.ellipse(7.5, -4.2, 2.8, 1.5, -.2, 0, TAU); g.fill();
  g.strokeStyle = D; g.lineWidth = 1.6; g.beginPath(); g.moveTo(2, -8.5); g.lineTo(11, -6); g.stroke();
  g.restore(); g.restore(); this.hpBar(g); this.drawTele(g);
};
Wolf.prototype.drawGlow = function (g) { Enemy.prototype.drawGlow.call(this, g); glowAt(g, [255, 70, 110], this.x + this.face * 31, this.y - 30, 10, .7); if (this.st === 'crouch') glowAt(g, [255, 255, 255], this.x, this.y - 20, 50, this.stT * 1.6); };

/* ---------- Gaviota Picotazo ---------- */
Gull.prototype.draw = function (g) {
  const t = this.t, f = this.vx >= 0 ? 1 : -1, ff = this.flashFill(g), dive = this.st === 'dive', flap = dive ? -.6 : Math.sin(t * 16);
  const W = ff || '#f8f8f4', Ws = ff || '#d8dde4', Gr = ff || '#a8b2bc', Gd = ff || '#7a8490', B = '#22262c';
  g.save(); g.translate(this.x, this.y - 11); g.scale(f, 1); if (dive) g.rotate(Math.atan2(this.vy, Math.abs(this.vx)) * .6);
  const wing = (k, col, tip) => { const ey = -3 - 12 * flap * k, ty = -6 - 18 * flap * k;
    g.fillStyle = col; g.beginPath(); g.moveTo(5, -3); g.quadraticCurveTo(0, ey - 2, -6, ey); g.lineTo(-24 * k, ty); g.quadraticCurveTo(-14, ty * .4 + 2, -8, 1); g.closePath(); g.fill();
    g.fillStyle = tip; g.beginPath(); g.moveTo(-24 * k, ty); g.lineTo(-15 * k, ty + (ey - ty) * .45 - 1); g.lineTo(-13 * k, ty * .6 + 2); g.closePath(); g.fill(); };
  wing(.85, Gd, B);
  // cola
  g.fillStyle = W; g.beginPath(); g.moveTo(-10, -2); g.lineTo(-22, -4); g.lineTo(-21, 2); g.lineTo(-10, 3); g.fill(); g.fillStyle = B; g.fillRect(-22, -4, 3, 6);
  // cuerpo + cabeza
  g.fillStyle = W; g.beginPath(); g.ellipse(-1, 0, 15, 7.5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(10, -4, 6.5, 0, TAU); g.fill();
  if (!ff) { g.save(); g.beginPath(); g.ellipse(-1, 0, 15, 7.5, 0, 0, TAU); g.clip(); g.fillStyle = Ws; g.fillRect(-16, 3, 32, 6); g.fillStyle = Gr; g.fillRect(-16, -8, 22, 4); g.restore(); }
  // pico ganchudo con mancha roja
  g.fillStyle = ff || '#f4b83a'; g.beginPath(); g.moveTo(15, -5); g.lineTo(25, -3); g.quadraticCurveTo(26, -1, 24, 0); g.lineTo(15, -1); g.closePath(); g.fill();
  g.fillStyle = '#e04030'; g.beginPath(); g.arc(21.5, -.6, 1.3, 0, TAU); g.fill();
  // ojo
  g.fillStyle = '#fff'; g.beginPath(); g.arc(11.5, -6, 2.4, 0, TAU); g.fill(); g.fillStyle = B; g.beginPath(); g.arc(12.2, -6, 1.4, 0, TAU); g.fill();
  if (this.st === 'hover' || dive) { g.strokeStyle = B; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, -10); g.lineTo(14.5, -8); g.stroke(); }
  // patas colgando
  if (!dive) { g.strokeStyle = '#e8902a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-2, 6); g.lineTo(-5, 10); g.moveTo(2, 6); g.lineTo(0, 10); g.stroke(); }
  wing(1, Gr, B);
  g.restore(); this.hpBar(g); this.drawTele(g);
};

/* ---------- Murciélago Ígneo ---------- */
Bat.prototype.draw = function (g) {
  const ff = this.flashFill(g), t = this.t, hang = this.st === 'hang', flap = hang ? -.8 : Math.sin(t * 22);
  const M = ff || '#5a1a16', Ml = ff || '#9a3420', Bo = '#2a0a08', Bd = ff || '#7a2a20', Be = ff || '#c0502a';
  g.save(); g.translate(this.x, this.y - 10); if (hang) g.scale(1, -1);
  for (const s of [-1, 1]) {
    const ax = s * 13, ay = -10 * flap - 7, tips = [[s * 28, -6 * flap - 3], [s * 24, 5 - 2 * flap], [s * 15, 9]];
    g.fillStyle = M; g.beginPath(); g.moveTo(s * 4, -3); g.lineTo(ax, ay); g.lineTo(tips[0][0], tips[0][1]);
    for (let i = 1; i < 3; i++) { const a = tips[i - 1], b = tips[i]; g.quadraticCurveTo((a[0] + b[0]) / 2 - s * 3, (a[1] + b[1]) / 2 - 3, b[0], b[1]); }
    g.quadraticCurveTo(s * 9, 6, s * 4, 4); g.closePath(); g.fill();
    if (!ff) { g.save(); g.clip(); g.fillStyle = Ml; g.globalAlpha = .55; g.beginPath(); g.moveTo(ax, ay); g.lineTo(tips[0][0], tips[0][1]); g.lineTo(tips[1][0], tips[1][1]); g.closePath(); g.fill(); g.restore(); }
    g.strokeStyle = Bo; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 4, -3); g.lineTo(ax, ay); for (const tp of tips) { g.moveTo(ax, ay); g.lineTo(tp[0], tp[1]); } g.stroke();
    g.fillStyle = '#e8d8c8'; g.beginPath(); g.moveTo(ax, ay - 1); g.lineTo(ax - s * 2, ay - 4); g.lineTo(ax + s * 1.5, ay); g.fill();
  }
  // orejas
  for (const s of [-1, 1]) { g.fillStyle = Bd; g.beginPath(); g.moveTo(s * 2, -6); g.lineTo(s * 6, -16); g.lineTo(s * 7.5, -4); g.fill(); if (!ff) { g.fillStyle = '#e07a6a'; g.beginPath(); g.moveTo(s * 3.5, -6); g.lineTo(s * 6, -12.5); g.lineTo(s * 6.5, -5); g.fill(); } }
  // cuerpo peludo
  g.fillStyle = Bd; g.beginPath(); g.ellipse(0, 0, 8.5, 8, 0, 0, TAU); g.fill();
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = -2.6 + i * .42; g.lineTo(Math.cos(a) * 10, -1 + Math.sin(a) * 9.5); g.lineTo(Math.cos(a + .2) * 8, -1 + Math.sin(a + .2) * 8); } g.fill();
  if (!ff) { g.fillStyle = Be; g.beginPath(); g.ellipse(0, 3.5, 5, 4, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,200,120,.8)'; for (const [x, y] of [[-2, 4], [2, 2.5], [0, 6]]) { g.beginPath(); g.arc(x, y, .9, 0, TAU); g.fill(); } }
  // cara
  g.fillStyle = '#ffd040'; g.beginPath(); g.ellipse(-3, -2, 2, 1.6, .3, 0, TAU); g.ellipse(3, -2, 2, 1.6, -.3, 0, TAU); g.fill();
  g.fillStyle = '#2a0a08'; g.beginPath(); g.ellipse(-3, -2, .7, 1.3, 0, 0, TAU); g.ellipse(3, -2, .7, 1.3, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-2, 1.5); g.lineTo(-1.2, 4); g.lineTo(-.4, 1.5); g.moveTo(.4, 1.5); g.lineTo(1.2, 4); g.lineTo(2, 1.5); g.fill();
  g.restore(); this.hpBar(g); this.drawTele(g);
};

/* ---------- Salamandra ---------- */
Salamander.prototype.draw = function (g) {
  const ff = this.flashFill(g), t = this.t, st = this.st, walk = st === 'crawl';
  const C = ff || '#e8642a', S = ff || '#a83a18', L = ff || '#ffb060', Bl = ff || '#ffd890', D = '#3a1206';
  g.save(); g.translate(this.x, this.y); if (this.ceiling) g.scale(1, -1); g.scale(this.face, 1);
  const tw = Math.sin(t * 8) * 3;
  const leg = (x, ph, col) => { const a = walk ? Math.sin(t * 12 + ph) : 0; g.strokeStyle = col; g.lineWidth = 3.4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, -4); g.lineTo(x + 4 + a * 4, -7 + Math.abs(a) * 1.5); g.lineTo(x + 6 + a * 6, 0); g.stroke();
    g.lineWidth = 1.4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + 6 + a * 6, 0); g.lineTo(x + 6 + a * 6 + 2 + k * 2, .8); g.stroke(); } };
  leg(-12, 1.6, S); leg(10, 0, S);
  // cuerpo
  g.fillStyle = C; g.beginPath(); g.moveTo(-40, -3 + tw); g.quadraticCurveTo(-26, -11, -8, -10); g.quadraticCurveTo(8, -12, 16, -11); g.quadraticCurveTo(29, -11, 31, -5); g.quadraticCurveTo(28, 0, 17, -.5); g.lineTo(-8, -1); g.quadraticCurveTo(-24, 0, -40, -3 + tw); g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = Bl; g.beginPath(); g.ellipse(0, 1, 30, 4, 0, 0, TAU); g.fill(); g.fillStyle = L; g.beginPath(); g.ellipse(4, -12, 26, 3, 0, 0, TAU); g.fill(); g.restore();
    g.fillStyle = S; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-28 + i * 9, -7 + (i % 2), 2.6, 1.8, 0, 0, TAU); g.fill(); } }
  // cresta dorsal
  g.fillStyle = ff || '#ffcf50'; for (let i = 0; i < 6; i++) { const x = -22 + i * 6; g.beginPath(); g.moveTo(x - 2.5, -9.5 - (x > 8 ? 1 : 0)); g.lineTo(x, -14 - Math.sin(t * 10 + i) * 1.2); g.lineTo(x + 2.5, -10); g.fill(); }
  leg(-8, 3.2, C); leg(14, 4.8, C);
  // cabeza: ojo con pupila rasgada, mejillas hinchadas al inhalar
  const puff = st === 'inhale' ? Math.min(1, this.stT / .5) : 0;
  if (puff) { g.fillStyle = ff || '#ff9040'; g.beginPath(); g.ellipse(22, -4, 5 + puff * 3, 3 + puff * 2.5, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(21, -8.5, 3.2, 0, TAU); g.fill(); g.fillStyle = D; g.beginPath(); g.ellipse(21.8, -8.5, .9, 2.4, 0, 0, TAU); g.fill();
  g.strokeStyle = D; g.lineWidth = 1.2; g.beginPath(); g.moveTo(31, -4.5); g.quadraticCurveTo(26, -3, 20, -4); g.stroke();
  g.fillStyle = D; g.beginPath(); g.arc(29, -7.5, .8, 0, TAU); g.fill();
  // llama en la punta de la cola
  const fl = 1 + Math.sin(t * 20) * .2; g.fillStyle = ff || '#ffcc40'; g.beginPath(); g.moveTo(-38, -3 + tw); g.quadraticCurveTo(-48, -8 * fl + tw, -46, -14 * fl + tw); g.quadraticCurveTo(-42, -8 + tw, -37, -6 + tw); g.fill();
  g.restore(); this.hpBar(g); this.drawTele(g);
};
Salamander.prototype.drawGlow = function (g) { Enemy.prototype.drawGlow.call(this, g); const cy = this.ceiling ? 1 : -1; glowAt(g, [255, 170, 60], this.x - this.face * 44, this.y + cy * 8, 14, .6); if (this.st === 'inhale') glowAt(g, [255, 140, 40], this.x + this.face * 26, this.y + cy * 6, 20 + this.stT * 30, .8); };

/* ---------- Escarabajo Bombardero ---------- */
Beetle.prototype.draw = function (g) {
  const ff = this.flashFill(g), f = this.face, t = this.t, walk = this.st === 'walk';
  const Sh = ff || '#2f8a50', ShL = ff || '#7ae0a0', ShD = ff || '#14502c', Bk = ff || '#22302a', D = '#0a1a10';
  g.save(); g.translate(this.x, this.y); g.scale(f, 1);
  g.strokeStyle = D; g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { const a = Math.sin(t * 14 + i * 2) * (walk ? 3 : 0), x = -9 + i * 9; g.beginPath(); g.moveTo(x, -9); g.lineTo(x - 3 + a, -4); g.lineTo(x - 5 + a * 1.4, 0); g.stroke(); }
  // abdomen trasero visible bajo los élitros
  g.fillStyle = ff || '#b04a2a'; g.beginPath(); g.ellipse(-16, -9, 6, 5, 0, 0, TAU); g.fill();
  // élitros
  g.fillStyle = Sh; g.beginPath(); g.ellipse(-2, -15, 18, 12, 0, 0, TAU); g.fill();
  if (!ff) { g.save(); g.beginPath(); g.ellipse(-2, -15, 18, 12, 0, 0, TAU); g.clip(); g.fillStyle = ShD; g.fillRect(-22, -11, 40, 10); g.fillStyle = ShL; g.beginPath(); g.ellipse(-8, -23, 9, 4, -.3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-10, -24, 3.5, 1.5, -.3, 0, TAU); g.fill(); g.restore(); }
  g.strokeStyle = D; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-2, -27); g.quadraticCurveTo(0, -15, -2, -3); g.stroke();
  // pronoto y cabeza con cuerno
  g.fillStyle = Bk; g.beginPath(); g.ellipse(13, -14, 7, 8, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(20, -12, 5.5, 5, 0, 0, TAU); g.fill();
  if (!ff) { g.fillStyle = '#4a6a58'; g.beginPath(); g.ellipse(12, -18, 4, 2, -.3, 0, TAU); g.fill(); }
  g.fillStyle = Bk; g.beginPath(); g.moveTo(21, -15); g.quadraticCurveTo(29, -24, 27, -30); g.quadraticCurveTo(25, -22, 19, -17); g.fill();
  g.strokeStyle = D; g.lineWidth = 1.2; g.beginPath(); g.moveTo(22, -9); g.quadraticCurveTo(28, -6, 30, -9); g.stroke();
  g.fillStyle = '#ffd040'; g.beginPath(); g.arc(22, -13, 1.9, 0, TAU); g.fill(); g.fillStyle = D; g.beginPath(); g.arc(22.4, -13, .8, 0, TAU); g.fill();
  if (this.st === 'aim') { const k = this.stT; g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(-6, -32 - k * 10, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-8, -34 - k * 10, 2.4, 0, TAU); g.fill();
    g.strokeStyle = '#8a6a40'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-3, -38 - k * 10); g.lineTo(-1, -41 - k * 10); g.stroke(); g.fillStyle = '#ff8a20'; g.beginPath(); g.arc(-1, -42 - k * 10, 2 + Math.random() * 1.5, 0, TAU); g.fill(); }
  g.restore(); this.hpBar(g); this.drawTele(g);
};

/* ---------- Bruto Acorazado ---------- */
Brute.prototype.draw = function (g) {
  const ff = this.flashFill(g), f = this.face, t = this.t, st = this.st;
  const Sk = ff || '#7a6e8e', SkS = ff || '#4e4462', SkL = ff || '#a898b8', St = ff || '#c8ccd8', StS = ff || '#7a8092', StL = '#f0f4ff', D = '#1a1424', Lt = ff || '#5a3a24';
  const tilt = st === 'staggered' ? Math.sin(t * 3) * .15 : st === 'charge' ? .25 : 0;
  g.save(); g.translate(this.x, this.y); g.scale(f, 1); g.rotate(tilt);
  const wob = st === 'walk' ? Math.sin(t * 8) * 2.5 : 0;
  const P = (fn, fill) => { g.beginPath(); fn(); g.fillStyle = fill; g.fill(); };
  // piernas con botas
  for (const [x, w2, col] of [[-19, wob, SkS], [5, -wob, Sk]]) { P(() => g.roundRect(x, -30, 15, 24 + w2, 5), col); P(() => g.roundRect(x - 3, -8 + w2 * .5, 21, 9, [6, 8, 2, 2]), ff || '#2a2232'); P(() => g.ellipse(x + 7, -22, 7, 5, 0, 0, TAU), this.armor[3] ? St : col); }
  // brazo trasero (puño)
  P(() => g.roundRect(-38, -80, 16, 40, 8), SkS); P(() => g.arc(-30, -38, 9, 0, TAU), SkS);
  if (this.armor[0]) { P(() => { g.moveTo(-42, -76); g.quadraticCurveTo(-44, -96, -24, -96); g.lineTo(-18, -84); g.quadraticCurveTo(-30, -82, -42, -76); }, StS); }
  // torso barril
  P(() => { g.moveTo(-28, -88); g.quadraticCurveTo(0, -98, 28, -88); g.quadraticCurveTo(36, -60, 26, -30); g.lineTo(-26, -30); g.quadraticCurveTo(-34, -60, -28, -88); }, Sk);
  if (!ff) { g.save(); g.clip(); g.fillStyle = SkS; g.beginPath(); g.ellipse(-30, -60, 14, 40, 0, 0, TAU); g.fill(); g.fillStyle = SkL; g.beginPath(); g.ellipse(14, -84, 14, 6, -.2, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = 'rgba(26,20,36,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(-6, -48, 0, -40); g.stroke(); }
  // peto
  if (this.armor[2]) { P(() => { g.moveTo(-20, -82); g.quadraticCurveTo(4, -90, 24, -80); g.lineTo(22, -54); g.quadraticCurveTo(2, -46, -20, -54); g.closePath(); }, St);
    if (!ff) { g.fillStyle = StS; g.beginPath(); g.moveTo(8, -86); g.quadraticCurveTo(18, -84, 24, -80); g.lineTo(22, -54); g.quadraticCurveTo(14, -51, 8, -50); g.closePath(); g.fill();
      g.fillStyle = StL; g.fillRect(-14, -80, 4, 20); g.strokeStyle = 'rgba(26,20,36,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, -70); g.lineTo(4, -64); g.moveTo(10, -76); g.lineTo(14, -70); g.stroke();
      g.fillStyle = D; for (const [x, y] of [[-16, -77], [18, -76], [-16, -58], [18, -58]]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } } }
  // cinturón con hebilla
  P(() => g.rect(-27, -38, 54, 9), Lt); P(() => g.roundRect(-6, -40, 14, 13, 3), ff || '#e8b850');
  if (this.armor[3]) { P(() => g.roundRect(-24, -30, 22, 12, [0, 0, 6, 6]), StS); P(() => g.roundRect(2, -30, 22, 12, [0, 0, 6, 6]), St); }
  // cabeza: casco con cuernos, ojo por la visera y colmillos
  P(() => { g.moveTo(-4, -86); g.lineTo(-6, -100); g.quadraticCurveTo(-4, -114, 10, -114); g.quadraticCurveTo(24, -114, 24, -100); g.lineTo(22, -86); g.closePath(); }, Sk);
  P(() => { g.moveTo(-8, -98); g.quadraticCurveTo(-6, -118, 10, -118); g.quadraticCurveTo(28, -118, 26, -98); g.lineTo(26, -94); g.lineTo(-8, -94); g.closePath(); }, ff || '#5a5e6e');
  P(() => { g.moveTo(-6, -108); g.quadraticCurveTo(-20, -112, -22, -126); g.quadraticCurveTo(-12, -116, -2, -114); g.closePath(); }, ff || '#e8dcc0');
  if (!ff) { g.fillStyle = '#8a8e9e'; g.beginPath(); g.moveTo(0, -114); g.quadraticCurveTo(10, -118, 20, -114); g.lineTo(18, -110); g.quadraticCurveTo(10, -113, 2, -110); g.fill(); }
  g.fillStyle = D; g.fillRect(4, -103, 20, 5);
  g.fillStyle = st === 'staggered' ? '#8a8060' : '#ffde50'; g.beginPath(); g.ellipse(16, -100.5, 4, st === 'staggered' ? .8 : 2, 0, 0, TAU); g.fill();
  g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(14, -88); g.lineTo(16, -95); g.lineTo(18, -88); g.moveTo(20, -88); g.lineTo(22.5, -94); g.lineTo(24, -88); g.fill();
  // martillo
  const ha = st === 'smashUp' ? -2.4 - Math.min(1, this.stT / .85) * .5 : st === 'smash' ? .5 : st === 'sweepUp' ? -.3 - this.stT : st === 'sweep' ? lerp(-.9, 1.2, Math.min(1, this.stT / .2)) : st === 'charge' ? -.2 : -.9 + Math.sin(t * 2) * .05;
  g.save(); g.translate(22, -66); g.rotate(ha);
  P(() => g.roundRect(-4, -4, 72, 8, 3), ff || '#6a4428'); if (!ff) { g.fillStyle = '#3a2416'; for (let k = 0; k < 3; k++) g.fillRect(6 + k * 6, -4.5, 3, 9); g.fillStyle = '#9a6a40'; g.fillRect(0, -3, 54, 2); }
  P(() => g.roundRect(54, -24, 40, 48, 7), ff || '#6a6e7e');
  if (!ff) { g.fillStyle = '#9a9eae'; g.fillRect(56, -22, 10, 44); g.fillStyle = '#44485a'; g.fillRect(84, -22, 8, 44); g.fillStyle = '#e8b850'; g.fillRect(54, -6, 40, 6); g.fillStyle = StL; g.fillRect(58, -20, 3, 12); }
  g.restore();
  // brazo delantero
  P(() => g.arc(22, -66, 11, 0, TAU), Sk); if (this.armor[1]) { P(() => { g.moveTo(8, -80); g.quadraticCurveTo(12, -98, 32, -94); g.quadraticCurveTo(40, -82, 34, -72); g.quadraticCurveTo(20, -78, 8, -80); }, St); if (!ff) { g.fillStyle = StL; g.beginPath(); g.moveTo(14, -86); g.quadraticCurveTo(18, -94, 28, -92); g.lineTo(26, -89); g.quadraticCurveTo(19, -90, 16, -84); g.fill(); } }
  if (st === 'staggered') for (let i = 0; i < 4; i++) { const a = t * 4 + i * 1.6; g.fillStyle = '#ffe060'; g.beginPath(); g.arc(8 + Math.cos(a) * 22, -128 + Math.sin(a) * 5, 3, 0, TAU); g.fill(); }
  g.restore(); this.drawTele(g);
};

/* ---------- Cangrejo Acorazado: detalles extra encima del dibujo base ---------- */
Crab.prototype.draw = function (g) {
  const t = this.t, f = this.face, aim = this.st === 'aim', ff = this.flashFill(g);
  const C = ff || '#f0704c', S = ff || '#b83e2c', L = ff || '#ffb08a', D = '#5a1810';
  g.save(); g.translate(this.x, this.y);
  // patas articuladas (las del fondo más oscuras)
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of [-1, 1]) for (let i = 2; i >= 0; i--) { const ph = t * 12 * (this.st === 'walk' ? 1 : 0) + i * 2 + (s > 0 ? 1 : 0), lift = Math.max(0, Math.sin(ph)) * 4;
    g.strokeStyle = i % 2 ? S : C; g.lineWidth = 3.6; g.beginPath(); g.moveTo(s * 9, -9); g.lineTo(s * (17 + i * 4), -15 - lift); g.lineTo(s * (21 + i * 4), -lift * .3); g.stroke(); }
  // caparazón con relieve
  g.fillStyle = C; g.beginPath(); g.moveTo(-24, -14); g.quadraticCurveTo(-22, -32, 0, -32); g.quadraticCurveTo(22, -32, 24, -14); g.quadraticCurveTo(12, -6, 0, -6); g.quadraticCurveTo(-12, -6, -24, -14); g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = S; g.beginPath(); g.ellipse(0, -6, 28, 8, 0, 0, TAU); g.fill(); g.fillStyle = L; g.beginPath(); g.ellipse(-6, -29, 13, 4, -.15, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.globalAlpha = .7; g.beginPath(); g.ellipse(-9, -29, 4, 1.6, -.15, 0, TAU); g.fill(); g.restore();
    g.fillStyle = S; for (const [x, y, r] of [[-12, -20, 2.4], [-3, -22, 2], [6, -20, 2.6], [14, -18, 1.8], [-18, -16, 1.6]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.strokeStyle = D; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-20, -12); for (let x = -16; x <= 20; x += 6) g.lineTo(x, -12 + (x / 6 % 2 ? 1.5 : 0)); g.stroke(); }
  // boca
  g.strokeStyle = D; g.lineWidth = 1.4; g.beginPath(); g.moveTo(f * 6 - 3, -10); g.quadraticCurveTo(f * 6, -8, f * 6 + 3, -10); g.stroke();
  // pinzas
  const up = aim ? -14 - Math.sin(t * 30) * 2 : this.st === 'lunge' ? -4 : -8;
  for (const s of [-f * .6, f]) { const sg = Math.sign(s), open = aim ? .5 + Math.sin(t * 30) * .2 : .2;
    g.save(); g.translate(s * 26, up); g.rotate(aim ? -.6 * sg : 0);
    g.strokeStyle = S; g.lineWidth = 4; g.beginPath(); g.moveTo(-sg * 6, 6); g.lineTo(-sg * 12, 10); g.stroke();
    g.fillStyle = Math.abs(s) < 1 ? S : C; g.beginPath(); g.ellipse(0, 1, 10, 7.5, 0, 0, TAU); g.fill();
    g.save(); g.translate(sg * 6, -1); g.rotate(-open * sg); g.fillStyle = Math.abs(s) < 1 ? S : C; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(sg * 9, -7, sg * 11, -2); g.lineTo(0, 0); g.fill(); g.restore();
    if (!ff) { g.fillStyle = L; g.beginPath(); g.ellipse(-sg * 2, -2.5, 4.5, 2, 0, 0, TAU); g.fill(); }
    if (aim) { g.globalCompositeOperation = 'lighter'; glowAt(g, [255, 255, 220], 0, 0, 16, .5); g.globalCompositeOperation = 'source-over'; }
    g.restore(); }
  // ojos en pedúnculos
  for (const s of [-1, 1]) { const ex = s * 6 + f * 8, ey = -38 + Math.sin(t * 3 + s) * .8; g.strokeStyle = S; g.lineWidth = 2.2; g.beginPath(); g.moveTo(s * 5 + f * 6, -28); g.lineTo(ex, ey + 3); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 4.2, 0, TAU); g.fill(); g.fillStyle = '#1a1010'; g.beginPath(); g.arc(ex + f * 1.4, ey + .3, 2.1, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + f * 1.4 - .8, ey - .6, .7, 0, TAU); g.fill();
    if (aim) { g.strokeStyle = D; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex - 4, ey - 6 + s * f); g.lineTo(ex + 4, ey - 4 - s * f); g.stroke(); } }
  g.restore(); this.hpBar(g); this.drawTele(g);
};

Jelly.prototype.draw = function (g) {
  const t = this.t, ff = this.flashFill(g), ch = this.st === 'charge', zap = this.st === 'zap';
  g.save(); g.translate(this.x, this.y - 17);
  // tentáculos: brazos orales gruesos + filamentos
  for (let i = 0; i < 5; i++) { const x0 = -10 + i * 5; g.strokeStyle = ff || (i % 2 ? 'rgba(200,160,255,.75)' : 'rgba(240,210,255,.8)'); g.lineWidth = i % 2 ? 1.4 : 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, 5); for (let k = 1; k < 7; k++) g.lineTo(x0 + Math.sin(t * 4 + i * 1.3 + k * .8) * (2 + k * .6), 5 + k * 5.5); g.stroke(); }
  g.fillStyle = ff || 'rgba(230,200,255,.85)'; for (const x of [-4, 4]) { g.beginPath(); g.moveTo(x - 2.5, 4); g.quadraticCurveTo(x + Math.sin(t * 3 + x) * 4, 16, x + Math.sin(t * 2 + x) * 3, 24); g.quadraticCurveTo(x + 3, 14, x + 2.5, 4); g.fill(); }
  // campana
  const w = 18 + Math.sin(t * 5) * 1.5;
  g.fillStyle = ff || (ch || zap ? '#f4eaff' : '#c8a0ff'); g.beginPath(); g.moveTo(-w, 2); g.quadraticCurveTo(-w, -17, 0, -17); g.quadraticCurveTo(w, -17, w, 2); for (let k = 0; k <= 6; k++) g.quadraticCurveTo(w - (k + .5) * w / 3, 7, w - (k + 1) * w / 3, 2); g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = '#9a6ae8'; g.beginPath(); g.ellipse(0, 4, w + 4, 6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-7, -11, 6, 2.6, -.4, 0, TAU); g.fill(); g.restore();
    g.fillStyle = ch ? 'rgba(255,255,255,.9)' : 'rgba(255,230,255,.55)'; g.beginPath(); g.ellipse(0, -5, 8, 5, 0, 0, TAU); g.fill(); }
  eyes(g, 0, -4, 2.8, '#3a1a6a', Math.sign(this.dx), ch);
  g.restore(); this.hpBar(g); this.drawTele(g);
};

Archer.prototype.draw = function (g) {
  const f = this.face, ff = this.flashFill(g), k = this.st === 'draw' ? Math.min(1, this.stT / .9) : 0, t = this.t;
  const Bn = ff || '#ece4d2', BnS = ff || '#b8ac94', D = '#1a1010', Co = ff || '#5a2a3a', CoS = ff || '#3a1826', Sc = ff || '#c23a2e';
  g.save(); g.translate(this.x, this.y); g.scale(f, 1);
  const bob = Math.sin(t * 3) * .8;
  // piernas de hueso con pantalón roto
  g.strokeStyle = BnS; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, -20); g.lineTo(-6, -10); g.lineTo(-5, -1); g.stroke();
  g.strokeStyle = Bn; g.beginPath(); g.moveTo(3, -20); g.lineTo(6, -10); g.lineTo(6, -1); g.stroke();
  g.fillStyle = ff || '#3a2a20'; g.beginPath(); g.ellipse(-4, -1, 5, 2.2, 0, 0, TAU); g.ellipse(8, -1, 5, 2.2, 0, 0, TAU); g.fill();
  g.fillStyle = ff || '#4a5a7a'; g.beginPath(); g.moveTo(-8, -24); g.lineTo(8, -24); g.lineTo(9, -14); g.lineTo(5, -16); g.lineTo(2, -12); g.lineTo(-2, -16); g.lineTo(-6, -13); g.lineTo(-9, -16); g.closePath(); g.fill();
  g.save(); g.translate(0, bob);
  // brazo trasero (sujeta el arco)
  g.strokeStyle = BnS; g.lineWidth = 3; g.beginPath(); g.moveTo(-2, -38); g.lineTo(6, -37); g.lineTo(12, -36); g.stroke();
  // chaqueta de pirata con costillas visibles
  g.fillStyle = Co; g.beginPath(); g.moveTo(-10, -43); g.lineTo(10, -43); g.lineTo(9, -22); g.lineTo(-9, -22); g.closePath(); g.fill();
  if (!ff) { g.fillStyle = CoS; g.fillRect(4, -43, 6, 21); g.fillStyle = Bn; for (let i = 0; i < 3; i++) g.fillRect(-4, -39 + i * 5, 7, 2); g.fillStyle = '#e8b850'; g.fillRect(-10, -26, 20, 3); g.fillStyle = '#e8b850'; g.beginPath(); g.arc(-7, -36, 1.3, 0, TAU); g.arc(-7, -30, 1.3, 0, TAU); g.fill(); }
  // cráneo
  g.fillStyle = Bn; g.beginPath(); g.arc(1, -51, 9, 0, TAU); g.fill(); g.beginPath(); g.roundRect(-3, -46, 11, 6, 2); g.fill();
  if (!ff) { g.fillStyle = BnS; g.beginPath(); g.arc(-3, -49, 6, Math.PI * .5, Math.PI * 1.3); g.fill(); }
  g.fillStyle = D; g.beginPath(); g.ellipse(5, -51, 2.6, 3, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-1, -51, 2.2, 2.8, 0, 0, TAU); g.fill();
  g.fillStyle = '#ff5a3a'; g.beginPath(); g.arc(5, -51, 1, 0, TAU); g.fill();
  g.fillStyle = D; for (let i = 0; i < 3; i++) g.fillRect(-1 + i * 3, -44, 1.2, 3);
  // pañuelo pirata con nudo y parche
  g.fillStyle = Sc; g.beginPath(); g.moveTo(-9, -54); g.quadraticCurveTo(1, -64, 11, -54); g.lineTo(10, -52); g.quadraticCurveTo(1, -57, -9, -52); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-9, -54); g.lineTo(-16, -50 + Math.sin(t * 5) * 1.5); g.lineTo(-13, -48); g.lineTo(-9, -52); g.fill();
  if (!ff) { g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(-1, -58, 1, 0, TAU); g.arc(4, -58.5, 1, 0, TAU); g.fill(); }
  // arco
  g.strokeStyle = ff || '#6a4220'; g.lineWidth = 3.2; g.beginPath(); g.arc(12, -36, 16, -1.2, 1.2); g.stroke(); g.strokeStyle = '#e8b850'; g.lineWidth = 3.4; g.beginPath(); g.arc(12, -36, 16, -.12, .12); g.stroke();
  const sx = 12 + Math.cos(1.2) * 16, sy1 = -36 - Math.sin(1.2) * 16, sy2 = -36 + Math.sin(1.2) * 16, pull = 12 - k * 14;
  g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy1); g.lineTo(pull, -36); g.lineTo(sx, sy2); g.stroke();
  if (this.st === 'draw') { g.strokeStyle = '#8a5a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(pull, -36); g.lineTo(pull + 30, -36); g.stroke(); g.fillStyle = '#ccc'; g.beginPath(); g.moveTo(pull + 30, -39); g.lineTo(pull + 36, -36); g.lineTo(pull + 30, -33); g.fill(); g.fillStyle = '#e04030'; g.beginPath(); g.moveTo(pull, -36); g.lineTo(pull + 5, -39); g.lineTo(pull + 5, -33); g.fill(); }
  // brazo delantero (tira de la cuerda)
  g.strokeStyle = Bn; g.lineWidth = 3; g.beginPath(); g.moveTo(3, -39); g.lineTo((3 + pull) / 2, -33); g.lineTo(pull, -36); g.stroke();
  g.restore(); g.restore(); this.hpBar(g);
};

ClockMage.prototype.draw = function (g) {
  const ff = this.flashFill(g), t = this.t, f = this.face, cast = this.st === 'cast' || this.st === 'blades';
  const R1 = ff || '#3a2e5a', R2 = ff || '#241c3c', R3 = ff || '#5a4a88', Gd = ff || '#e8c060';
  g.save(); g.translate(this.x, this.y);
  // túnica con bajo deshilachado que flota
  g.fillStyle = R1; g.beginPath(); g.moveTo(-15, -40); g.quadraticCurveTo(-20, -18, -18, 0);
  for (let i = 0; i < 6; i++) { const x = -18 + (i + 1) * 6, y = (i % 2 ? 2 : 7) + Math.sin(t * 4 + i) * 2.5; g.lineTo(x - 3, y); g.lineTo(x, (i % 2 ? 6 : 1)); }
  g.quadraticCurveTo(20, -18, 15, -40); g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = R2; g.fillRect(f > 0 ? -20 : 4, -44, 16, 54); g.fillStyle = R3; g.fillRect(f > 0 ? 6 : -10, -40, 4, 40); g.restore();
    g.strokeStyle = Gd; g.lineWidth = 2; g.beginPath(); g.moveTo(-17, -6); g.quadraticCurveTo(0, -2, 17, -6); g.stroke();
    // runas de reloj bordadas
    g.fillStyle = Gd; for (const [x, y] of [[-9, -14], [0, -11], [9, -14], [-5, -24], [5, -24]]) { g.beginPath(); g.moveTo(x, y - 2.4); g.lineTo(x + .8, y - .8); g.lineTo(x + 2.4, y); g.lineTo(x + .8, y + .8); g.lineTo(x, y + 2.4); g.lineTo(x - .8, y + .8); g.lineTo(x - 2.4, y); g.lineTo(x - .8, y - .8); g.closePath(); g.fill(); } }
  // capucha
  g.fillStyle = R2; g.beginPath(); g.moveTo(-14, -38); g.quadraticCurveTo(-16, -60, 0, -78 + Math.sin(t * 2) * 1.5); g.quadraticCurveTo(16, -60, 14, -38); g.closePath(); g.fill();
  if (!ff) { g.fillStyle = R3; g.beginPath(); g.moveTo(0, -78 + Math.sin(t * 2) * 1.5); g.quadraticCurveTo(-10, -60, -12, -42); g.lineTo(-8, -42); g.quadraticCurveTo(-6, -60, 0, -76); g.fill(); }
  g.strokeStyle = Gd; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-13, -39); g.quadraticCurveTo(0, -35, 13, -39); g.stroke();
  // rostro en sombra con ojos brillantes
  g.fillStyle = '#07050c'; g.beginPath(); g.ellipse(f * 1.5, -47, 8, 7, 0, 0, TAU); g.fill();
  g.fillStyle = cast ? '#ffffff' : '#ffe080'; g.beginPath(); g.ellipse(f * 1.5 - 3, -47, 1.8, 1.2, 0, 0, TAU); g.ellipse(f * 1.5 + 3, -47, 1.8, 1.2, 0, 0, TAU); g.fill();
  // mano y reloj de bolsillo con cadena
  const hx = f * 20, hy = -30 + (cast ? -6 : 0);
  g.strokeStyle = Gd; g.lineWidth = 1.2; g.beginPath(); g.moveTo(f * 8, -24); g.quadraticCurveTo(f * 14, -18, hx, hy + 8); g.stroke();
  g.fillStyle = R1; g.beginPath(); g.ellipse(f * 13, -28, 5, 4, f * .5, 0, TAU); g.fill();
  g.save(); g.translate(hx, hy); g.fillStyle = Gd; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill(); g.fillStyle = '#f6ecd0'; g.beginPath(); g.arc(0, 0, 8.5, 0, TAU); g.fill();
  g.fillStyle = Gd; g.fillRect(-1.5, -14, 3, 3); g.fillStyle = '#8a6a20'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillRect(Math.cos(a) * 7 - .5, Math.sin(a) * 7 - .5, 1, 1); }
  g.strokeStyle = '#222'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t * 3) * 6, Math.sin(t * 3) * 6); g.moveTo(0, 0); g.lineTo(Math.cos(t * .5) * 4, Math.sin(t * .5) * 4); g.stroke();
  g.restore();
  g.restore(); this.hpBar(g); this.drawTele(g);
};

Mimic.prototype.draw = function (g) {
  const ff = this.flashFill(g), sleep = this.st === 'sleep', open = sleep ? Math.max(0, Math.sin(this.t * 1.2)) * .06 : .5 + Math.sin(this.t * 14) * .2;
  const W = ff || '#9a6232', Ws = ff || '#6a3e1e', Wl = ff || '#c88a4a', Fe = ff || '#c9a23a', D = '#2a1608';
  g.save(); g.translate(this.x, this.y);
  const box = (y, h, rad) => { g.fillStyle = W; g.beginPath(); g.roundRect(-20, y, 40, h, rad); g.fill(); if (!ff) { g.fillStyle = Ws; g.fillRect(-20, y + h - 4, 40, 4); g.fillStyle = Wl; g.fillRect(-18, y + 1.5, 36, 2); g.strokeStyle = 'rgba(42,22,8,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-20, y + h / 2); g.lineTo(20, y + h / 2); g.stroke(); } g.fillStyle = Fe; g.fillRect(-14, y, 4, h); g.fillRect(10, y, 4, h); };
  box(-18, 18, [0, 0, 3, 3]);
  if (open > .2) { g.fillStyle = '#5a0a1a'; g.fillRect(-18, -19, 36, 6); g.fillStyle = '#ff6a8a'; g.beginPath(); g.moveTo(-8, -17); g.quadraticCurveTo(0, -24 - Math.sin(this.t * 10) * 3, 10, -16); g.quadraticCurveTo(0, -14, -8, -17); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-17 + i * 6, -18); g.lineTo(-14 + i * 6, -23); g.lineTo(-11 + i * 6, -18); g.fill(); } }
  g.save(); g.translate(-20, -18); g.rotate(-open);
  g.fillStyle = W; g.beginPath(); g.roundRect(0, -14, 40, 14, [7, 7, 0, 0]); g.fill(); if (!ff) { g.fillStyle = Wl; g.beginPath(); g.roundRect(2, -13, 36, 4, [5, 5, 0, 0]); g.fill(); } g.fillStyle = Fe; g.fillRect(6, -14, 4, 14); g.fillRect(30, -14, 4, 14);
  if (open > .2) { g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(3 + i * 6, 0); g.lineTo(6 + i * 6, 5); g.lineTo(9 + i * 6, 0); g.fill(); }
    g.fillStyle = '#ffe060'; g.beginPath(); g.arc(12, -7, 2.4, 0, TAU); g.arc(28, -7, 2.4, 0, TAU); g.fill(); g.fillStyle = D; g.beginPath(); g.ellipse(12, -7, .8, 2, 0, 0, TAU); g.ellipse(28, -7, .8, 2, 0, 0, TAU); g.fill(); }
  g.restore();
  g.fillStyle = Fe; g.beginPath(); g.roundRect(-4, -20, 8, 9, 2); g.fill(); g.fillStyle = D; g.beginPath(); g.arc(0, -16.5, 1.4, 0, TAU); g.fill(); g.fillRect(-.6, -16, 1.2, 3);
  if (sleep && Math.sin(this.t * 1.2) > .7) { g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 9px sans-serif'; g.fillText('z', 14, -30 - (this.t % 2) * 4); }
  g.restore(); if (!sleep) this.hpBar(g);
};

/* ---------- Wordling: criatura de tinta que sostiene un pergamino con su palabra ---------- */
Wordling.prototype.draw = function (g) {
  const ff = this.flash > 0, t = this.t, sq = this.onGround ? 1 + Math.sin(t * 10) * .04 : 1.12, hu = this.angry ? 350 : this.hue;
  const C = ff ? '#fff' : `hsl(${hu},42%,30%)`, L = ff ? '#fff' : `hsl(${hu},55%,50%)`, D = `hsl(${hu},40%,14%)`;
  const sy = -58 + Math.sin(t * 3) * 2;
  g.save(); g.translate(this.x, this.y);
  // palo del cartel sujeto con dos manitas
  g.strokeStyle = '#6a4424'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, sy + 14); g.lineTo(0, -22); g.stroke();
  g.save(); g.scale(2 - sq, sq);
  // cuerpo de tinta con goterones
  g.fillStyle = C; g.beginPath(); g.moveTo(-16, -2); g.quadraticCurveTo(-21, -30, 0, -34); g.quadraticCurveTo(21, -30, 16, -2);
  for (let i = 0; i < 4; i++) { const x = 16 - (i + 1) * 8, d = 3 + ((i * 7 + Math.floor(t * 2)) % 3) * 1.5; g.quadraticCurveTo(x + 4, 2 + d, x, 0); }
  g.closePath(); g.fill();
  if (!ff) { g.save(); g.clip(); g.fillStyle = L; g.beginPath(); g.ellipse(-5, -30, 13, 7, -.2, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-8, -27, 4, 2.2, -.5, 0, TAU); g.fill(); }
  // ojos y boca
  eyes(g, this.face * 2, -18, 3.2, D, this.face, this.angry);
  g.strokeStyle = D; g.lineWidth = 1.6; g.beginPath(); if (this.angry) { g.moveTo(this.face * 2 - 3, -9); g.lineTo(this.face * 2 + 3, -10); } else g.arc(this.face * 2, -11, 3, .2, Math.PI - .2); g.stroke();
  // manitas
  g.fillStyle = C; g.beginPath(); g.arc(-4, -24, 3.2, 0, TAU); g.arc(4, -28, 3.2, 0, TAU); g.fill();
  g.restore();
  // gota que cae a veces
  if (Math.sin(t * 1.7 + this.hue) > .9) { g.fillStyle = C; g.beginPath(); g.ellipse(-10, 4 + (t * 40 % 10), 1.6, 2.4, 0, 0, TAU); g.fill(); }
  // pergamino
  g.translate(0, sy);
  g.font = '700 20px "Alegreya Sans", sans-serif'; const w = Math.max(44, g.measureText(this.word).width + 18);
  const pc = this.angry ? '#ffd8d0' : '#fbf0d4';
  g.fillStyle = pc; g.strokeStyle = '#3a2614'; g.lineWidth = 2.4; g.beginPath(); g.roundRect(-w / 2, -16, w, 30, 4); g.fill(); g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = '#e2cfa0'; g.beginPath(); g.ellipse(s * w / 2, -1, 5, 17, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c8ae78'; g.beginPath(); g.ellipse(s * w / 2, -1, 2, 15, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#1a1020'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.word, 0, 0);
  if (this.angry) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 2; i++) { const k = (t * 1.5 + i * .5) % 1; g.globalAlpha = 1 - k; g.beginPath(); g.arc(-w / 2 - 8 + i * (w + 16), -20 - k * 16, 3 + k * 4, 0, TAU); g.fill(); } g.globalAlpha = 1; }
  g.restore();
};

/* =====================================================================
   PNJ — mismo estilo chibi que Lio: cabeza grande, ojos con brillo,
   3 tonos y un accesorio que cuenta quién es cada uno.
   ===================================================================== */
function npcFace(g, x, y, r, skin, opt = {}) {
  g.fillStyle = skin; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(120,60,40,.18)'; g.beginPath(); g.arc(x - r * .35, y + r * .1, r * .85, Math.PI * .55, Math.PI * 1.45); g.fill();
  const blink = opt.t !== undefined && (opt.t % 4) < .12;
  for (const ex of [x + r * .12, x + r * .58]) { if (blink) { g.strokeStyle = '#2a1a10'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - 2.4, y - 1); g.lineTo(ex + 2.4, y - 1); g.stroke(); continue; }
    g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(ex, y - 1, 2.3, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + .8, y - 2.2, .9, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,120,120,.4)'; g.beginPath(); g.ellipse(x + r * .5, y + r * .38, 2.6, 1.6, 0, 0, TAU); g.fill();
  g.strokeStyle = '#6a2a1a'; g.lineWidth = 1.4; g.beginPath(); g.arc(x + r * .38, y + r * .35, 2.6, .2, Math.PI - .4); g.stroke();
}
function npcBody(g, coat, coatS, legs, t, opt = {}) {
  const b = Math.sin(t * 2) * .8;
  g.fillStyle = legs; g.beginPath(); g.roundRect(-8, -17, 6, 17, 2); g.roundRect(2, -17, 6, 17, 2); g.fill();
  g.fillStyle = '#3a2a1e'; g.beginPath(); g.roundRect(-10, -4, 9, 5, [3, 3, 1, 1]); g.roundRect(1, -4, 10, 5, [3, 3, 1, 1]); g.fill();
  g.fillStyle = coat; g.beginPath(); g.moveTo(-13, -14 + b * .3); g.quadraticCurveTo(-15, -38, -7, -44 + b); g.lineTo(9, -44 + b); g.quadraticCurveTo(16, -38, 14, -14 + b * .3); g.closePath(); g.fill();
  g.fillStyle = coatS; g.beginPath(); g.moveTo(-13, -14 + b * .3); g.quadraticCurveTo(-15, -38, -7, -44 + b); g.lineTo(-3, -44 + b); g.quadraticCurveTo(-8, -30, -6, -14); g.closePath(); g.fill();
  return b;
}
const NPC_ART = {
  mira(g, t) { // exploradora: sombrero, mochila, prismáticos
    g.fillStyle = '#7a5a30'; g.beginPath(); g.roundRect(-20, -42, 10, 22, 4); g.fill(); g.fillStyle = '#5a4020'; g.fillRect(-20, -34, 10, 3);
    const b = npcBody(g, '#e8b030', '#b8801a', '#5a6a3a', t);
    g.fillStyle = '#5a3a20'; g.fillRect(-12, -20 + b, 26, 4);
    g.strokeStyle = '#3a2a1e'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -44 + b); g.lineTo(6, -24 + b); g.stroke(); g.fillStyle = '#2a2a34'; g.beginPath(); g.roundRect(3, -27 + b, 8, 6, 2); g.fill();
    g.fillStyle = '#6a3a1e'; g.beginPath(); g.moveTo(-10, -60); g.quadraticCurveTo(-24, -52 + Math.sin(t * 3) * 2, -20, -40); g.quadraticCurveTo(-14, -50, -8, -54); g.fill();
    npcFace(g, 1, -56 + b, 13, '#f0c49a', { t });
    g.fillStyle = '#6a3a1e'; g.beginPath(); g.arc(1, -59 + b, 13.5, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = '#c8a060'; g.beginPath(); g.ellipse(1, -66 + b, 19, 4.5, 0, 0, TAU); g.fill(); g.beginPath(); g.roundRect(-9, -78 + b, 20, 13, [8, 8, 2, 2]); g.fill();
    g.fillStyle = '#8a5a2a'; g.fillRect(-9, -70 + b, 20, 3);
  },
  bram(g, t) { // pescador: chubasquero, gorro, barba blanca, caña
    g.strokeStyle = '#6a4424'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(10, -26); g.quadraticCurveTo(26, -70, 34, -96); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.beginPath(); g.moveTo(34, -96); g.quadraticCurveTo(44, -60, 42, -20 + Math.sin(t * 2) * 3); g.stroke();
    const b = npcBody(g, '#f0c030', '#c8901a', '#3a4a6a', t);
    g.fillStyle = '#e8e0d0'; for (const y of [-38, -30, -22]) { g.beginPath(); g.arc(2, y + b, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = '#d8b090'; g.beginPath(); g.arc(12, -26 + b, 4, 0, TAU); g.fill();
    npcFace(g, 1, -56 + b, 13, '#e8b48a', { t });
    g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(-10, -54 + b); g.quadraticCurveTo(-6, -36 + b, 4, -38 + b); g.quadraticCurveTo(14, -38 + b, 14, -52 + b); g.quadraticCurveTo(8, -46 + b, 2, -48 + b); g.quadraticCurveTo(-4, -46 + b, -10, -54 + b); g.fill();
    g.fillStyle = '#f4f0e8'; g.beginPath(); g.ellipse(6, -50 + b, 6, 2.4, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#f0c030'; g.beginPath(); g.moveTo(-15, -60 + b); g.quadraticCurveTo(1, -82 + b, 16, -62 + b); g.lineTo(20, -56 + b); g.lineTo(-18, -56 + b); g.closePath(); g.fill(); g.fillStyle = '#c8901a'; g.fillRect(-18, -59 + b, 38, 3);
  },
  otto(g, t) { // panadero: gorro alto, delantal, bigote, barra de pan
    const b = npcBody(g, '#f4efe4', '#d0c8b8', '#5a4a3a', t);
    g.fillStyle = '#f8f8f8'; g.beginPath(); g.ellipse(1, -24 + b, 15, 12, 0, 0, TAU); g.fill(); g.fillStyle = '#e0dcd0'; g.beginPath(); g.ellipse(-3, -22 + b, 9, 9, 0, Math.PI * .5, Math.PI * 1.5); g.fill();
    g.fillStyle = '#d89a5a'; g.save(); g.translate(13, -28 + b); g.rotate(-.5); g.beginPath(); g.roundRect(-4, -14, 9, 28, 4.5); g.fill(); g.strokeStyle = '#a86a30'; g.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-2, i * 7 - 2); g.lineTo(3, i * 7 + 1); g.stroke(); } g.restore();
    npcFace(g, 1, -56 + b, 13, '#f0c49a', { t });
    g.fillStyle = '#5a3a20'; g.beginPath(); g.ellipse(-1, -50 + b, 4.5, 2, .3, 0, TAU); g.ellipse(9, -50 + b, 4.5, 2, -.3, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-10, -74 + b, 22, 10, 2); g.fill(); for (const [x, y, r] of [[-6, -78, 7], [2, -82, 8], [9, -77, 6]]) { g.beginPath(); g.arc(x, y + b, r, 0, TAU); g.fill(); }
    g.fillStyle = '#e4e4e4'; g.fillRect(-10, -67 + b, 22, 3);
  },
  nia(g, t) { // pintora: boina, bata con manchas, paleta y pincel
    const b = npcBody(g, '#c88aff', '#9a5ad8', '#3a3a5a', t);
    for (const [x, y, c] of [[-6, -34, '#ff6a6a'], [6, -26, '#ffd040'], [-2, -20, '#5ad0ff']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y + b, 2.2, 0, TAU); g.fill(); }
    g.save(); g.translate(14, -30 + b); g.rotate(.2); g.fillStyle = '#e8c890'; g.beginPath(); g.ellipse(0, 0, 9, 6.5, 0, 0, TAU); g.fill();
    for (const [x, y, c] of [[-4, -2, '#ff5050'], [0, -3.5, '#ffd040'], [4, -1, '#40a0ff'], [2, 2.5, '#50d070']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } g.restore();
    g.strokeStyle = '#6a4424'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-10, -26 + b); g.lineTo(-18, -44 + b); g.stroke(); g.fillStyle = '#ff5050'; g.beginPath(); g.arc(-18, -45 + b, 2, 0, TAU); g.fill();
    g.fillStyle = '#2a1a2a'; g.beginPath(); g.moveTo(-12, -60); g.quadraticCurveTo(-16, -44, -10, -40); g.lineTo(-6, -50); g.fill();
    npcFace(g, 1, -56 + b, 13, '#c8906a', { t });
    g.fillStyle = '#2a1a2a'; g.beginPath(); g.arc(1, -59 + b, 13.5, Math.PI * 1.0, Math.PI * 1.9); g.fill();
    g.fillStyle = '#e04050'; g.beginPath(); g.ellipse(-1, -68 + b, 15, 6, -.15, 0, TAU); g.fill(); g.beginPath(); g.arc(-1, -73 + b, 2, 0, TAU); g.fill();
  },
  pip(g, t) { // robotito: cuerpo de caja, antena, cara-pantalla, ruedas
    const hov = Math.sin(t * 4) * 1.2;
    g.fillStyle = '#4a5468'; for (const x of [-7, 7]) { g.beginPath(); g.arc(x, -5, 5, 0, TAU); g.fill(); g.fillStyle = '#8a94a8'; g.beginPath(); g.arc(x, -5, 2, 0, TAU); g.fill(); g.fillStyle = '#4a5468'; }
    g.fillStyle = '#9ab0c8'; g.beginPath(); g.roundRect(-13, -32 + hov, 26, 24, 6); g.fill(); g.fillStyle = '#6a80a0'; g.beginPath(); g.roundRect(-13, -32 + hov, 8, 24, [6, 0, 0, 6]); g.fill();
    g.fillStyle = '#ffd040'; g.beginPath(); g.arc(4, -22 + hov, 3, 0, TAU); g.fill(); g.fillStyle = '#ff6a6a'; g.fillRect(-2, -15 + hov, 10, 2);
    g.strokeStyle = '#6a80a0'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(13, -24 + hov); g.lineTo(19, -20 + Math.sin(t * 5) * 4 + hov); g.stroke();
    g.fillStyle = '#b8cce0'; g.beginPath(); g.roundRect(-15, -58 + hov, 30, 24, 8); g.fill(); g.fillStyle = '#1a2a3a'; g.beginPath(); g.roundRect(-10, -54 + hov, 22, 15, 5); g.fill();
    const bl = (t % 3) < .15; g.fillStyle = '#7af0ff'; if (bl) { g.fillRect(-4, -47 + hov, 5, 1.5); g.fillRect(5, -47 + hov, 5, 1.5); } else { g.beginPath(); g.arc(-1.5, -47 + hov, 2.4, 0, TAU); g.arc(7.5, -47 + hov, 2.4, 0, TAU); g.fill(); }
    g.strokeStyle = '#7af0ff'; g.lineWidth = 1.2; g.beginPath(); g.arc(3, -43 + hov, 3, .3, Math.PI - .3); g.stroke();
    g.strokeStyle = '#6a80a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, -58 + hov); g.lineTo(1, -68 + hov); g.stroke(); g.fillStyle = (t % 1) < .5 ? '#ff5050' : '#ffb0b0'; g.beginPath(); g.arc(1, -70 + hov, 3, 0, TAU); g.fill();
  },
  lyra(g, t) { // espíritu del bosque: translúcido, pelo de hojas, flota
    const fl = Math.sin(t * 2) * 3; g.translate(0, -6 + fl); g.globalAlpha = .9;
    g.fillStyle = '#5ad0a0'; g.beginPath(); g.moveTo(-12, -40); g.quadraticCurveTo(-18, -14, -14, 4); for (let i = 0; i < 5; i++) g.quadraticCurveTo(-14 + i * 7 + 3.5, 10 + Math.sin(t * 4 + i) * 2, -14 + (i + 1) * 7, 4); g.quadraticCurveTo(18, -14, 12, -40); g.closePath(); g.fill();
    g.fillStyle = '#3aa880'; g.beginPath(); g.moveTo(-12, -40); g.quadraticCurveTo(-18, -14, -14, 4); g.lineTo(-7, 4); g.quadraticCurveTo(-10, -20, -6, -40); g.closePath(); g.fill();
    npcFace(g, 1, -52, 13, '#d8fff0', { t });
    g.fillStyle = '#3aa880'; for (let i = 0; i < 7; i++) { const a = Math.PI * (1.0 + i * .14); g.beginPath(); g.ellipse(1 + Math.cos(a) * 14, -54 + Math.sin(a) * 14, 4, 8, a + Math.PI / 2 + Math.sin(t * 3 + i) * .15, 0, TAU); g.fill(); }
    g.fillStyle = '#ffe0f0'; g.beginPath(); g.arc(-8, -66, 3, 0, TAU); g.fill(); g.fillStyle = '#ffd040'; g.beginPath(); g.arc(-8, -66, 1.2, 0, TAU); g.fill();
    g.globalAlpha = 1;
  }
};
NPC.prototype.draw = function (g) {
  const t = this.t, art = NPC_ART[this.npc], f = Math.sign(this.hero.x - this.x) || 1, self = this;
  if (art) drawOutlined(g, this.x, this.y - 40, gg => { gg.save(); gg.translate(self.x, self.y); gg.scale(f, 1); art(gg, t); gg.restore(); }, '#1a1420', 120, 140);
  if (this.heroNear(140, 100) && !this.solved) { g.save(); g.translate(this.x, this.y); const by = -100 + Math.sin(t * 4) * 3;
    g.fillStyle = 'rgba(10,14,26,.8)'; g.beginPath(); g.ellipse(0, by, 13, 12, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-4, by + 10); g.lineTo(0, by + 17); g.lineTo(4, by + 10); g.fill();
    g.fillStyle = this.def.quiz ? '#ffd25a' : '#fff'; g.font = '900 18px "Bangers", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.def.quiz ? '!' : '…', 0, by + 1); g.restore(); }
};

/* =====================================================================
   OBJETOS DEL MUNDO — piedra tallada, madera con herrajes, contorno
   ===================================================================== */
const STONE = { base: '#8a8a9c', shade: '#5e5e72', lit: '#b8b8cc', deep: '#3e3e50', moss: '#5a8a3a', mossL: '#8ab858' };
function stoneBlock(g, x, y, w, h, r = 4, S = STONE) {
  g.fillStyle = S.base; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
  g.fillStyle = S.shade; g.beginPath(); g.roundRect(x + w * .62, y, w * .38, h, [0, r, r, 0]); g.fill();
  g.fillStyle = S.lit; g.beginPath(); g.roundRect(x + 2, y + 1.5, w * .55, Math.min(4, h * .2), 2); g.fill();
}
Checkpoint.prototype.draw = function (g) {
  this.flag.y = this.y - 118 + (this.active ? 0 : 70); this.flag.draw(g);
  const x = this.x, y = this.y, on = this.active, self = this;
  drawOutlined(g, x, y - 20, gg => {
    // piedra rúnica con musgo
    gg.fillStyle = STONE.base; gg.beginPath(); gg.moveTo(x - 20, y); gg.lineTo(x - 16, y - 24); gg.quadraticCurveTo(x - 10, y - 34, x, y - 34); gg.quadraticCurveTo(x + 10, y - 34, x + 16, y - 24); gg.lineTo(x + 20, y); gg.closePath(); gg.fill();
    gg.fillStyle = STONE.shade; gg.beginPath(); gg.moveTo(x + 6, y - 33); gg.quadraticCurveTo(x + 12, y - 30, x + 16, y - 24); gg.lineTo(x + 20, y); gg.lineTo(x + 8, y); gg.closePath(); gg.fill();
    gg.fillStyle = STONE.lit; gg.beginPath(); gg.moveTo(x - 14, y - 26); gg.quadraticCurveTo(x - 8, y - 32, x, y - 32); gg.lineTo(x - 2, y - 29); gg.quadraticCurveTo(x - 8, y - 29, x - 12, y - 24); gg.fill();
    gg.fillStyle = STONE.moss; gg.beginPath(); gg.ellipse(x - 12, y - 2, 9, 3.5, 0, 0, TAU); gg.ellipse(x + 12, y - 1, 6, 2.5, 0, 0, TAU); gg.fill();
    gg.strokeStyle = on ? '#ffe080' : STONE.deep; gg.lineWidth = 2.2; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(x - 3, y - 6); gg.lineTo(x - 3, y - 25); gg.lineTo(x + 4, y - 20); gg.lineTo(x - 3, y - 15); gg.lineTo(x + 5, y - 6); gg.stroke();
  }, '#1a1420', 70, 80);
};
Gate.prototype.draw = function (g) {
  const x = this.x, y = this.y;
  if (this.done) { drawOutlined(g, x, y - 10, gg => { stoneBlock(gg, x - 34, y - 10, 22, 10, 3); stoneBlock(gg, x + 10, y - 9, 24, 9, 3); gg.fillStyle = STONE.shade; gg.beginPath(); gg.arc(x, y - 3, 5, 0, TAU); gg.fill(); }, '#1a1420', 90, 40); return; }
  const sx = this.shake > 0 ? Math.sin(this.t * 60) * 4 : 0, t = this.t, fmt = this.format;
  const runes = fmt === 'type' ? ['W', 'R', 'I', 'T', 'E'] : fmt === 'build' ? ['A', 'B', 'C'] : ['?'];
  // pilar dibujado en dos partes (alto: 176 px) con el contorno genérico
  const drawPillar = gg => { gg.save(); gg.translate(x + sx, y);
    stoneBlock(gg, -30, -8, 60, 8, 2);
    gg.fillStyle = STONE.base; gg.beginPath(); gg.roundRect(-22, -168, 44, 162, [22, 22, 0, 0]); gg.fill();
    gg.fillStyle = STONE.shade; gg.beginPath(); gg.roundRect(6, -166, 16, 160, [0, 18, 0, 0]); gg.fill();
    gg.fillStyle = STONE.lit; gg.fillRect(-19, -150, 5, 140);
    // juntas de sillería
    gg.strokeStyle = 'rgba(40,40,56,.45)'; gg.lineWidth = 1.4; for (let k = 0; k < 5; k++) { const yy = -30 - k * 28; gg.beginPath(); gg.moveTo(-22, yy); gg.lineTo(22, yy); gg.stroke(); gg.beginPath(); gg.moveTo(k % 2 ? -6 : 8, yy); gg.lineTo(k % 2 ? -6 : 8, yy - 28); gg.stroke(); }
    // panel tallado con la runa brillante
    gg.fillStyle = '#2a2a3c'; gg.beginPath(); gg.roundRect(-12, -150, 24, 128, 12); gg.fill();
    gg.fillStyle = `rgba(150,230,255,${.75 + Math.sin(t * 3) * .25})`; gg.font = '700 17px Georgia'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
    runes.forEach((c, i) => gg.fillText(c, 0, -136 + (i + .5) * (110 / runes.length)));
    // capitel con musgo y hiedra
    stoneBlock(gg, -32, -180, 64, 14, 4); gg.fillStyle = STONE.moss; gg.beginPath(); gg.ellipse(-20, -181, 12, 4, 0, 0, TAU); gg.fill(); gg.fillStyle = STONE.mossL; gg.beginPath(); gg.ellipse(-22, -183, 6, 2, 0, 0, TAU); gg.fill();
    gg.strokeStyle = '#3a6a2a'; gg.lineWidth = 1.6; gg.beginPath(); gg.moveTo(-28, -170); gg.quadraticCurveTo(-30, -140, -24, -118); gg.stroke(); gg.fillStyle = STONE.moss; for (let k = 0; k < 4; k++) { gg.beginPath(); gg.ellipse(-28 + (k % 2) * 4, -162 + k * 12, 3.5, 2, k % 2 ? .6 : -.6, 0, TAU); gg.fill(); }
    gg.restore(); };
  drawOutlined(g, x, y - 52, drawPillar, '#1a1420', 90, 222);
};
Shrine.prototype.draw = function (g) {
  const x = this.x, y = this.y, t = this.t, done = this.done;
  drawOutlined(g, x, y - 20, gg => {
    stoneBlock(gg, x - 28, y - 8, 56, 8, 2); stoneBlock(gg, x - 22, y - 16, 44, 9, 2);
    gg.fillStyle = STONE.base; gg.beginPath(); gg.moveTo(x - 14, y - 15); gg.lineTo(x - 11, y - 34); gg.lineTo(x + 11, y - 34); gg.lineTo(x + 14, y - 15); gg.closePath(); gg.fill();
    gg.fillStyle = STONE.shade; gg.beginPath(); gg.moveTo(x + 4, y - 34); gg.lineTo(x + 11, y - 34); gg.lineTo(x + 14, y - 15); gg.lineTo(x + 6, y - 15); gg.closePath(); gg.fill();
    stoneBlock(gg, x - 18, y - 40, 36, 7, 3);
    gg.fillStyle = done ? '#7a7a8a' : '#e8b850'; gg.beginPath(); gg.arc(x, y - 25, 3.5, 0, TAU); gg.fill();
  }, '#1a1420', 80, 70);
  const cy = y - 62 + Math.sin(t * 2) * 5, c = done ? ['#9a9aae', '#6a6a7e', '#c8c8d8'] : ['#ffd25a', '#e09a20', '#fff4c0'];
  drawOutlined(g, x, cy, gg => { gg.save(); gg.translate(x, cy); gg.rotate(Math.sin(t) * .08);
    gg.fillStyle = c[0]; gg.beginPath(); gg.moveTo(0, -22); gg.lineTo(12, -4); gg.lineTo(0, 22); gg.lineTo(-12, -4); gg.closePath(); gg.fill();
    gg.fillStyle = c[1]; gg.beginPath(); gg.moveTo(0, -22); gg.lineTo(12, -4); gg.lineTo(0, 22); gg.lineTo(2, -4); gg.closePath(); gg.fill();
    gg.fillStyle = c[2]; gg.beginPath(); gg.moveTo(0, -22); gg.lineTo(-12, -4); gg.lineTo(-5, -4); gg.closePath(); gg.fill();
    gg.restore(); }, '#3a2410', 60, 70);
  if (!done) for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * TAU / 3; g.fillStyle = `rgba(255,236,170,${.5 + .4 * Math.sin(a * 2)})`; g.beginPath(); g.arc(x + Math.cos(a) * 22, cy + Math.sin(a) * 8, 2, 0, TAU); g.fill(); }
};
Chest.prototype.draw = function (g) {
  const P = { wood: ['#9a6232', '#6a3e1e', '#c88a4a', '#c9a23a'], silver: ['#6a7a90', '#46546a', '#9aaac0', '#e8eef8'], gold: ['#a8641e', '#704010', '#d08a3a', '#ffd84a'] }[this.tier] || ['#9a6232', '#6a3e1e', '#c88a4a', '#c9a23a'];
  const x = this.x, y = this.y, op = this.openT !== undefined ? Math.min(1, this.openT * 4) * 1.9 : 0, self = this;
  drawOutlined(g, x, y - 20, gg => { gg.save(); gg.translate(x, y);
    if (op > .3) { gg.fillStyle = '#2a1608'; gg.fillRect(-18, -21, 36, 5); gg.fillStyle = '#ffe080'; gg.beginPath(); gg.ellipse(0, -19, 14, 3, 0, 0, TAU); gg.fill(); }
    // caja
    gg.fillStyle = P[0]; gg.beginPath(); gg.roundRect(-21, -21, 42, 21, [0, 0, 3, 3]); gg.fill();
    gg.fillStyle = P[1]; gg.fillRect(-21, -6, 42, 6); gg.fillStyle = 'rgba(0,0,0,.18)'; gg.fillRect(-21, -14, 42, 1.4);
    gg.fillStyle = P[3]; gg.fillRect(-16, -21, 5, 21); gg.fillRect(11, -21, 5, 21);
    // tapa (gira al abrir)
    gg.save(); gg.translate(-21, -21); gg.rotate(-op);
    gg.fillStyle = P[0]; gg.beginPath(); gg.roundRect(0, -15, 42, 15, [9, 9, 0, 0]); gg.fill(); gg.fillStyle = P[2]; gg.beginPath(); gg.roundRect(3, -13, 36, 4, [6, 6, 0, 0]); gg.fill();
    gg.fillStyle = P[3]; gg.fillRect(5, -15, 5, 15); gg.fillRect(32, -15, 5, 15);
    gg.restore();
    if (!self.done) { gg.fillStyle = P[3]; gg.beginPath(); gg.roundRect(-5, -24, 10, 11, 2); gg.fill(); gg.fillStyle = '#2a1608'; gg.beginPath(); gg.arc(0, -20, 1.6, 0, TAU); gg.fill(); gg.fillRect(-.7, -20, 1.4, 4);
      if (self.lock) { gg.fillStyle = '#9be6ff'; gg.font = '700 9px Georgia'; gg.textAlign = 'center'; gg.fillText('ABC', 0, -8); } }
    if (self.tier === 'gold' && !self.done) { gg.fillStyle = '#fff'; const k = (self.t * .8) % 1; gg.globalAlpha = 1 - k; gg.beginPath(); gg.arc(-10 + k * 20, -30 + Math.sin(k * 6) * 2, 1.6, 0, TAU); gg.fill(); gg.globalAlpha = 1; }
    gg.restore(); }, '#1a1008', 80, 70);
};
