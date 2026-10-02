"use strict";
/* =====================================================================
   ROMPECABEZAS DE INGLÉS
   Cada mundo tiene un cuadro partido en 12 piezas. Cada respuesta correcta a la
   primera te da una pieza con la palabra que has acertado escrita encima; al
   completarlo se revela el cuadro entero con todas tus palabras y ganas un premio.
   ===================================================================== */
const Puzzles = (() => {
  const COLS = 4, ROWS = 3, N = COLS * ROWS, IW = 640, IH = 360, PW = IW / COLS, PH = IH / ROWS;
  const IMG = {}, P = { queue: [], cur: null, el: null, cv: null };
  const data = () => { const d = Store.data; d.puzzles = d.puzzles || {}; return d.puzzles; };
  const pz = w => { const D = data(); D[w] = D[w] || { pieces: {} }; return D[w]; };

  /* ---------- el cuadro de cada mundo: cielo y fondos del propio mundo ---------- */
  function image(w) {
    if (IMG[w]) return IMG[w];
    const W = WORLDS[w], key = W.biomes[0], c = mk(1280, 720), g = c.getContext('2d');
    try {
      const B = BIOMES[key], L = buildBiomeLayers(key), y0 = -(TH - 720) * .62;
      drawSky(g, key, 1280, 0, 0, 3, 1, y0 + (B.sea ? B.sea.horizon : B.horizon || 560));
      g.drawImage(L.far, 0, y0);
      if (B.sea && typeof drawSea === 'function') drawSea(g, key, 1280, y0 + B.sea.horizon, 3, 0, 1);
      g.drawImage(L.mid, -200, y0 + 30);
      // un segundo bioma del mundo asoma por la derecha, para que cada cuadro sea distinto
      if (W.biomes[1]) { const L2 = buildBiomeLayers(W.biomes[1]); g.save(); g.beginPath(); g.moveTo(900, 0); g.lineTo(1280, 0); g.lineTo(1280, 720); g.lineTo(760, 720); g.closePath(); g.clip(); g.globalAlpha = .9; g.drawImage(L2.mid, -500, y0 + 60); g.restore(); }
    } catch (e) { const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, '#6ab0e0'); gr.addColorStop(1, '#2a4a6a'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); }
    // viñeta y título del mundo
    const vg = g.createRadialGradient(640, 360, 250, 640, 360, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, 1280, 720);
    g.font = `64px "${W.font || 'Cinzel Decorative'}", Georgia, serif`; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = 'rgba(20,12,10,.8)'; g.strokeText(W.en, 640, 110); g.fillStyle = '#fff4d8'; g.fillText(W.en, 640, 110);
    const out = mk(IW, IH); out.getContext('2d').drawImage(c, 0, 0, IW, IH);
    return IMG[w] = out;
  }

  /* ---------- forma de pieza de puzle (con pestañas) ---------- */
  // dirección de la pestaña de cada borde interior (+1 sale, -1 entra), fija para siempre
  const tabH = (c, r) => (hash1(c * 7 + r * 13 + 1) > .5 ? 1 : -1);  // borde vertical a la derecha de (c,r)
  const tabV = (c, r) => (hash1(c * 11 + r * 5 + 3) > .5 ? 1 : -1);  // borde horizontal bajo (c,r)
  function edge(g, x0, y0, x1, y1, s) {
    // borde de (x0,y0) a (x1,y1) con una pestaña en el centro hacia la normal * s
    if (!s) { g.lineTo(x1, y1); return; }
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * s, ny = ux * s;
    const P2 = (a, b) => [x0 + ux * L * a + nx * L * b, y0 + uy * L * a + ny * L * b];
    const a = P2(.36, 0), b = P2(.32, .2), c = P2(.5, .3), d = P2(.68, .2), e = P2(.64, 0);
    g.lineTo(...a); g.bezierCurveTo(...P2(.4, .08), ...P2(.22, .26), ...c); g.bezierCurveTo(...P2(.78, .26), ...P2(.6, .08), ...e); g.lineTo(x1, y1);
  }
  function piecePath(g, i, sx = 1, sy = 1, ox = 0, oy = 0) {
    const c = i % COLS, r = (i / COLS) | 0, x = ox + c * PW * sx, y = oy + r * PH * sy, w = PW * sx, h = PH * sy;
    g.beginPath(); g.moveTo(x, y);
    edge(g, x, y, x + w, y, r > 0 ? -tabV(c, r - 1) : 0);            // arriba (la pestaña de la pieza de encima, invertida)
    edge(g, x + w, y, x + w, y + h, c < COLS - 1 ? tabH(c, r) : 0);  // derecha
    edge(g, x + w, y + h, x, y + h, r < ROWS - 1 ? tabV(c, r) : 0);  // abajo
    edge(g, x, y + h, x, y, c > 0 ? -tabH(c - 1, r) : 0);             // izquierda
    g.closePath();
  }
  // dibuja el puzle (piezas puestas y huecos) en un canvas de tamaño cw x ch
  function drawBoard(g, w, cw, ch, opt = {}) {
    const sx = cw / IW, sy = ch / IH, img = image(w), have = pz(w).pieces;
    g.fillStyle = '#14101c'; g.fillRect(0, 0, cw, ch);
    // huecos: el cuadro en sombra muy tenue
    g.save(); g.globalAlpha = .13; g.filter = 'grayscale(1)'; g.drawImage(img, 0, 0, cw, ch); g.restore();
    for (let i = 0; i < N; i++) {
      if (!have[i] || i === opt.skip) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; piecePath(g, i, sx, sy); g.stroke(); continue; }
      g.save(); piecePath(g, i, sx, sy); g.clip(); g.drawImage(img, 0, 0, cw, ch); g.restore();
      g.strokeStyle = 'rgba(30,20,10,.55)'; g.lineWidth = 1.2; piecePath(g, i, sx, sy); g.stroke();
      if (opt.words) label(g, have[i].w, (i % COLS + .5) * PW * sx, (((i / COLS) | 0) + .5) * PH * sy, sx);
    }
  }
  function label(g, word, x, y, s) {
    g.save(); g.font = `700 ${Math.max(10, 17 * s)}px "Alegreya Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(word).width + 12 * s; g.fillStyle = 'rgba(15,10,20,.72)'; g.beginPath(); g.roundRect(x - tw / 2, y - 12 * s, tw, 24 * s, 8 * s); g.fill();
    g.fillStyle = '#ffe9a0'; g.fillText(word, x, y + 1); g.restore();
  }

  /* ---------- ganar piezas ---------- */
  function award(G, word, sentence) {
    if (!G || !G.ref || G.ref.w === undefined || !WORLDS[G.ref.w]) return;
    const w = G.ref.w, P0 = pz(w), have = P0.pieces, free = [];
    for (let i = 0; i < N; i++) if (!have[i]) free.push(i);
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    have[i] = { w: word || '?', s: sentence || '' }; Store.save();
    P.queue.push({ w, i, word, done: free.length === 1 });
  }
  const ans0 = Game.prototype.answerFX;
  Game.prototype.answerFX = function (ok, verdict, rec) {
    ans0.call(this, ok, verdict, rec);
    if (ok && verdict === 'correct' && P.lastQ) { const q = P.lastQ; award(this, (P.lastGiven || '').trim(), (() => { try { return Learn.fullSentence(q.item, q.item[1][0]); } catch (e) { return ''; } })()); }
  };
  const sq0 = UI.showQuestion;
  UI.showQuestion = function (q, opt, cb) { P.lastQ = q; return sq0.call(this, q, opt, res => { P.lastGiven = res && typeof res.given === 'string' ? res.given : (q.answerWords ? q.answerWords.join(' ') : ''); cb(res); }); };

  /* ---------- ventana emergente: la pieza vuela a su sitio ---------- */
  function ensureEl() {
    if (P.el) return;
    P.el = document.createElement('div'); P.el.id = 'puzzle-pop';
    P.el.innerHTML = '<div class="pz-head"><b>PUZZLE</b><span></span></div><canvas width="384" height="216"></canvas><div class="pz-word"></div>';
    document.body.append(P.el); P.cv = P.el.querySelector('canvas');
  }
  function tick(G, dt) {
    if (!P.cur && P.queue.length && !UI.modalOpen() && !G.qActive && !G.cinematic) { P.cur = Object.assign(P.queue.shift(), { t: 0 }); ensureEl(); P.el.classList.add('on'); Sound.play('pickup'); }
    const C = P.cur; if (!C) return;
    C.t += dt;
    const g = P.cv.getContext('2d'), cw = P.cv.width, ch = P.cv.height, sx = cw / IW, sy = ch / IH;
    const fly = clamp((C.t - .25) / .7, 0, 1), e = 1 - Math.pow(1 - fly, 3);
    drawBoard(g, C.w, cw, ch, { skip: fly < 1 ? C.i : -1, words: C.done && C.t > 1.3 });
    // la pieza nueva: aparece grande en el centro y encaja en su sitio
    const c = C.i % COLS, r = (C.i / COLS) | 0, tx = c * PW * sx, ty = r * PH * sy, cx0 = cw / 2 - PW * sx * .9, cy0 = ch / 2 - PH * sy * .9;
    if (fly < 1) {
      const s = lerp(1.8, 1, e), x = lerp(cx0, tx, e), y = lerp(cy0, ty, e);
      g.save(); g.translate(x, y); g.scale(s, s); g.translate(-tx, -ty);
      g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 18; piecePath(g, C.i, sx, sy); g.fillStyle = '#000'; g.fill(); g.shadowBlur = 0;
      g.save(); piecePath(g, C.i, sx, sy); g.clip(); g.drawImage(image(C.w), 0, 0, cw, ch); g.restore();
      g.strokeStyle = '#ffe08a'; g.lineWidth = 2 / s; piecePath(g, C.i, sx, sy); g.stroke();
      label(g, C.word, (c + .5) * PW * sx, (r + .5) * PH * sy, sx * 1.1);
      g.restore();
    } else {
      // destello al encajar
      const k = clamp(1 - (C.t - .95) / .5, 0, 1);
      if (k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.fillStyle = 'rgba(255,230,150,.6)'; piecePath(g, C.i, sx, sy); g.fill(); g.restore(); if (!C.snd) { C.snd = 1; Sound.play('coinIn', 8); } }
      if (!C.done) label(g, C.word, (c + .5) * PW * sx, (r + .5) * PH * sy, sx * 1.1);
    }
    const have = Object.keys(pz(C.w).pieces).length;
    P.el.querySelector('.pz-head span').textContent = `${WORLDS[C.w].en} · ${have}/${N}`;
    P.el.querySelector('.pz-word').innerHTML = C.done ? 'PUZZLE COMPLETE! <small>¡Rompecabezas completado! +15 ◆</small>' : `+1 pieza: <b>${esc(C.word)}</b>`;
    if (C.done && !C.rew && C.t > 1.2) { C.rew = 1; G.gainCrystals(15); FX.celebrate(G.hero.x, G.hero.y - 80); Sound.play('streak', 6); G.giftCosmetic && G.giftCosmetic(G.hero.x, G.hero.y - 100); }
    if (C.t > (C.done ? 5 : 2.8)) { P.cur = null; P.el.classList.remove('on'); }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const up0 = Game.prototype.update;
  Game.prototype.update = function (dt) { up0.call(this, dt); if (this.mode === 'play') tick(this, dt); };
  const ll0 = Game.prototype.loadLevel;
  Game.prototype.loadLevel = function (ref) { P.queue = []; P.cur = null; if (P.el) P.el.classList.remove('on'); return ll0.call(this, ref); };

  /* ---------- galería (en Progreso) ---------- */
  function gallery() {
    const wrap = document.createElement('div'); wrap.className = 'pz-gallery';
    wrap.innerHTML = '<h3>Rompecabezas · cada respuesta correcta a la primera te da una pieza con la palabra que has acertado</h3>';
    WORLDS.forEach((W, w) => {
      const have = pz(w).pieces, n = Object.keys(have).length;
      const card = document.createElement('div'); card.className = 'pz-card' + (n === N ? ' done' : '');
      const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; drawBoard(cv.getContext('2d'), w, 320, 180, { words: true });
      const words = Object.values(have).map(p => `<span title="${esc(p.s)}">${esc(p.w)}</span>`).join('');
      card.innerHTML = `<div class="pz-t"><b>${esc(W.name)}</b><small>${n}/${N}${n === N ? ' · ¡completo!' : ''}</small></div>`;
      card.append(cv);
      const wl = document.createElement('div'); wl.className = 'pz-words'; wl.innerHTML = words || '<em>Aún no tienes piezas de este mundo</em>'; card.append(wl);
      wrap.append(card);
    });
    return wrap;
  }
  return { P, award, gallery, image, drawBoard, N };
})();
