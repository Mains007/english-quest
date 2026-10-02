"use strict";
/* =====================================================================
   INTERFAZ (DOM): menús, mapa, preguntas, explicaciones, marcador,
   armario, taller, biblioteca, progreso, opciones, resultados.
   Navegable con mando (cruceta/stick + ✕/○), teclado y ratón.
   ===================================================================== */
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) { const v = attrs[k]; if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const $ = s => document.querySelector(s);
/* iconos dibujados (sustituyen a los emojis): trazo fino, color heredado */
const ICONS = {
  play: '<path d="M8 5l11 7-11 7z"/>', book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', hanger: '<path d="M12 8V7a2 2 0 1 0-2-2"/><path d="M12 8L3 15.5a1 1 0 0 0 .6 1.8h16.8a1 1 0 0 0 .6-1.8z"/>',
  hammer: '<path d="M14.5 3.5l6 6-2.5 2.5-6-6z"/><path d="M12 6L3.5 14.5a2 2 0 0 0 0 2.8l.2.2a2 2 0 0 0 2.8 0L15 9"/>', chart: '<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5"/>', crystal: '<path d="M12 2.5l6.5 6.5L12 21.5 5.5 9z"/><path d="M5.5 9h13M9 9l3 12.5L15 9M9 9l3-6.5L15 9"/>',
  rune: '<path d="M8 3v18"/><path d="M8 4l8 4-8 4 8 9"/>', flame: '<path d="M12 21.5c3.9 0 6.5-2.7 6.5-6.3 0-4.6-4.5-6.4-5-11.7-2.8 2-3.8 4.6-3.8 7.3-1-.8-1.6-2-1.8-3.4-1.9 1.9-2.4 4.4-2.4 7.8 0 3.6 2.6 6.3 6.5 6.3z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  crown: '<path d="M3.5 18h17l-1.6-10-4.4 4-2.5-7-2.5 7-4.4-4z"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  speaker: '<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>', bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="1"/><path d="M3.5 13h17M12 9v11.5"/><path d="M12 9c-1.6-3.6-5.6-3.6-5.6-1 0 1.4 2.4 1 5.6 1zm0 0c1.6-3.6 5.6-3.6 5.6-1 0 1.4-2.4 1-5.6 1z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>', pad: '<path d="M7 8.5h10a4.5 4.5 0 0 1 4.4 5.4l-.4 1.9a2.8 2.8 0 0 1-4.9 1.2L14.5 15h-5l-1.6 2a2.8 2.8 0 0 1-4.9-1.2l-.4-1.9A4.5 4.5 0 0 1 7 8.5z"/><path d="M7.5 11v3M6 12.5h3"/><circle cx="16" cy="11.5" r=".6"/><circle cx="17.5" cy="13.5" r=".6"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7.5h6M9 11.5h6M9 15.5h4"/>', retry: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', flask: '<path d="M9.5 3h5M10.5 3v5L6 17a2.5 2.5 0 0 0 2.2 3.8h7.6A2.5 2.5 0 0 0 18 17l-4.5-9V3"/><path d="M7.6 14h8.8"/>',
  diamond: '<path d="M12 4l6 8-6 8-6-8z"/>', palm: '<path d="M12 21c0-5 1-9 3-12"/><path d="M15 9c-2-3-6-3-8-1 3-1 5 0 8 1zM15 9c1-3 4-4 6-3-2 0-4 1-6 3zM15 9c3-1 6 1 6 4-1-2-3-3-6-4zM15 9c-3 0-5 2-6 5 1-2 3-4 6-5z"/><path d="M5 21h14"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 3c-4 0-7 3-7 6 0 2 1 3 2 4-1 1 0 3 2 3h6c2 0 3-2 2-3 1-1 2-2 2-4 0-3-3-6-7-6z"/><path d="M8 21h8"/>',
  volcano: '<path d="M2 21l7-11h6l7 11z"/><path d="M9 10l1.5 3 1.5-2 1.5 2 1.5-3"/><path d="M10 6c0-2 2-2 2-4M14 7c1-2 3-2 3-4"/>',
  cloud: '<path d="M6 19h12a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.6A4.3 4.3 0 0 0 6 19z"/><path d="M10 13V9h1V7.5h2V9h1v4"/>',
  tower: '<path d="M8 21V9h8v12"/><path d="M7 9V5h2v2h2V5h2v2h2V5h2v4"/><path d="M11 21v-4a1 1 0 0 1 2 0v4M5 21h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.3-6.5 8-6.5s7 2 8 6.5"/>', sparkle: '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'
};
function icHTML(name) { return `<span class="ic"><svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg></span>`; }
function ic(name, cls) { const s = document.createElement('span'); s.className = 'ic' + (cls ? ' ' + cls : ''); s.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`; return s; }

const SKILLS = {
  heart: { name: 'Corazón extra', en: 'Extra heart', es: '+20 de vida máxima (hasta 3).', ep: [80, 300, 700], cost: [10, 20, 40], max: 3 },
  parry: { name: 'Parada experta', en: 'Expert parry', es: 'La ventana de parada es un 45 % más amplia.', ep: 120, cost: 10 },
  shield: { name: 'Escudo reforzado', en: 'Strong shield', es: 'Bloquear gasta un 30 % menos de aliento.', ep: 200, cost: 15 },
  flask: { name: 'Frasco extra', en: 'Extra flask', es: 'Empiezas cada nivel con un frasco de luz más.', ep: 260, cost: 20 },
  whirl: { name: 'Remolino rúnico', en: 'Rune whirl', es: 'Mantén pulsado el ataque con la espada para girar sin parar: el remolino aparta el agua y la lava y puedes cruzarlas por el fondo.', ep: 320, cost: 20 },
  triple: { name: 'Triple salto', en: 'Triple jump', es: 'Un tercer salto en el aire.', ep: 380, cost: 25 },
  fury: { name: 'Furia rúnica', en: 'Rune fury', es: 'La Palabra de Poder se carga un 25 % más rápido.', ep: 450, cost: 25 },
  phantom: { name: 'Esquiva fantasma', en: 'Phantom dash', es: 'Tu esquiva daña a los enemigos que atraviesas.', ep: 550, cost: 30 },
  power: { name: 'Filo afilado', en: 'Sharp edge', es: '+15 % de daño con todas las armas.', ep: 700, cost: 35 }
};

const UI = (() => {
  let G = null, stack = [], qState = null, navT = 0, promptEl, hudEls = {}, toastBox, modalCount = 0, menuBiome = 'beach';
  const S = () => Store.data.settings;

  /* ---------- foco y navegación ---------- */
  function focusables(root) { return [...root.querySelectorAll('[data-nav]:not([disabled])')].filter(e => e.offsetParent !== null); }
  function setFocus(el) { if (!el) return; document.querySelectorAll('.focus').forEach(e => e.classList.remove('focus')); el.classList.add('focus'); el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  function moveFocus(root, dir) {
    const list = focusables(root); if (!list.length) return; let cur = root.querySelector('.focus'); if (!cur || !list.includes(cur)) { setFocus(list[0]); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bd = 1e9;
    for (const e of list) { if (e === cur) continue; const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy;
      const ok = dir === 'up' ? dy < -4 : dir === 'down' ? dy > 4 : dir === 'left' ? dx < -4 : dx > 4; if (!ok) continue;
      const d = (dir === 'up' || dir === 'down') ? Math.abs(dy) + Math.abs(dx) * 2.2 : Math.abs(dx) + Math.abs(dy) * 2.2; if (d < bd) { bd = d; best = e; } }
    if (best) { setFocus(best); Sound.play('ui'); }
  }
  function activeRoot() { return stack.length ? stack[stack.length - 1].el : null; }
  function push(el, opts = {}) { const prev = activeRoot(); if (prev) prev.classList.add('under'); if (opts.scene && typeof MenuScene !== 'undefined') MenuScene.set(...opts.scene); $('#screens').append(el); stack.push({ el, opts }); document.body.classList.add('menu-open'); requestAnimationFrame(() => { const f = focusables(el); setFocus(opts.focus ? el.querySelector(opts.focus) : (f.find(e => !e.classList.contains('back')) || f[0])); }); return el; }
  function pop() { const s = stack.pop(); if (!stack.length) document.body.classList.remove('menu-open'); if (s) { s.el.classList.add('out'); setTimeout(() => s.el.remove(), 180); if (s.opts.onClose) s.opts.onClose(); } const r = activeRoot(); if (r) { const top = stack[stack.length - 1]; if (top && top.opts.scene && typeof MenuScene !== 'undefined') MenuScene.set(...top.opts.scene); r.classList.remove('under'); const f = r.querySelector('.focus') || focusables(r)[0]; setFocus(f); } }
  function clearScreens() { while (stack.length) { const s = stack.pop(); s.el.remove(); } document.body.classList.remove('menu-open'); }
  function screen(cls, title, sub, body, opts = {}) {
    const back = opts.noBack ? null : h('button', { class: 'back', 'data-nav': 1, onclick: () => { Sound.play('back'); opts.onBack ? opts.onBack() : pop(); } }, '◀ Volver');
    return h('section', { class: 'screen ' + cls }, h('header', { class: 'scr-head' }, back, h('div', {}, h('h2', {}, title), sub ? h('p', { class: 'sub' }, sub) : null), opts.right || null), h('div', { class: 'scr-body' }, body));
  }

  /* ---------- bucle de la interfaz ---------- */
  function update(dt) {
    Input.poll();
    const root = activeRoot();
    if (qState) { updateQuestion(dt); return; }
    if (root) {
      for (const d of Input.nav(dt)) moveFocus(root, d);
      if (Input.pressed('accept')) { const f = root.querySelector('.focus'); if (f && document.activeElement && document.activeElement.tagName !== 'INPUT') { f.click(); Sound.play('select'); } }
      if (Input.pressed('back') && !Input.typing) { const s = stack[stack.length - 1]; if (s && !s.opts.noBack) { Sound.play('back'); s.opts.onBack ? s.opts.onBack() : pop(); } }
      if (Input.pressed('pause') && G && G.mode === 'play' && stack.length && stack[stack.length - 1].opts.pause) closePause();
    }
    if (G && G.mode === 'play' && !qState && !stack.length) G.update(dt);
    else if (G && G.mode === 'play') { if (G.cinematic) G.update(0); }
    FX.update(dt * (G && G.mode === 'play' ? 0 : 1));
  }
  const modalOpen = () => !!qState || stack.length > 0;

  /* ================= TÍTULO Y MENÚ PRINCIPAL ================= */
  function title() {
    clearScreens(); menuBiome = 'title'; G.mode = 'menu';
    const el = h('section', { class: 'screen title' },
      h('div', { class: 't-logo' }, h('div', { class: 'orn' }, h('i'), h('b'), h('i')), h('h1', {}, 'ENGLISH QUEST'), h('div', { class: 't-sub' }, 'THE RUNE WORDS')),
      h('div', { class: 't-bottom' },
        h('button', { class: 't-start', 'data-nav': 1, onclick: () => { Sound.init(); Sound.resume(); Sound.setMood('menu', { force: true }); Sound.play('select'); if (!Store.data.created) creator(true); else mainMenu(); } }, 'PRESS', h('span', { class: 'gly cr' }, '✕'), 'OR ENTER'),
        h('p', { class: 't-tag' }, 'Aprende inglés jugando: cada respuesta correcta es un golpe de poder.'),
        h('p', { class: 'hint' }, 'Mando de PlayStation o Xbox recomendado · F: pantalla completa')));
    push(el, { noBack: true, scene: ['title', 'title'] });
  }
  function streakInfo() {
    const d = Store.data, today = new Date().toISOString().slice(0, 10); d.streak = d.streak || { days: 0, last: null, best: 0 };
    return d.streak;
  }
  function touchStreak() {
    const s = streakInfo(), today = new Date().toISOString().slice(0, 10); if (s.last === today) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10), y2 = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
    s.days = s.last === y ? s.days + 1 : s.last === y2 ? s.days + 1 : 1; s.last = today; s.best = Math.max(s.best, s.days); Store.save();
  }
  function mainMenu() {
    clearScreens(); G.mode = 'menu'; menuBiome = 'title'; $('#hud').classList.remove('on');
    Sound.setMood('menu');
    const d = Store.data, st = streakInfo(), cu = Learn.currentUnit();
    const item = (icon, en, es, fn, cls = '') => h('button', { class: 'm-item ' + cls, 'data-nav': 1, onclick: fn }, h('span', { class: 'm-ic' }, ic(icon)), h('span', { class: 'm-t' }, en, h('small', {}, es)));
    const el = h('section', { class: 'screen main' },
      h('div', { class: 'm-left' },
        h('div', { class: 'm-logo' }, 'ENGLISH QUEST', h('small', {}, 'THE RUNE WORDS')),
        h('nav', { class: 'm-list' },
          item('play', 'PLAY', 'Jugar · 6 mundos de 20 niveles', worldMap, 'primary'),
          item('book', 'LEARN', 'Aprender · lecciones, vocabulario y verbos', library),
          item('bolt', 'QUICK REVIEW', 'Repaso rápido · 10 preguntas', () => quickReview()),
          item('hanger', 'WARDROBE', 'Armario · personaliza a Lio', wardrobe),
          item('hammer', 'WORKSHOP', 'Taller · armas y habilidades', workshop),
          item('chart', 'PROGRESS', 'Progreso · tu inglés en números', progress),
          item('gear', 'OPTIONS', 'Opciones · dificultad, sonido, mando', options)),
        h('div', { class: 'route glass' }, h('span', { class: 'cefr ' + cu.cefr }, cu.cefr), h('div', {}, h('span', { class: 'lbl' }, 'TU RUTA'), h('b', {}, cu.title), h('div', { class: 'bar' }, h('i', { style: `width:${Learn.unitMastery(cu.id) * 100}%` })), h('small', {}, `Dominio ${Math.round(Learn.unitMastery(cu.id) * 100)} % · unidad ${UNITS.indexOf(cu) + 1} de ${UNITS.length} hasta B1`)))),
      h('div', { class: 'm-side' }, h('div', { class: 'wallet' }, chip('coin', d.coins || 0, 'monedas', 'coin'), chip('crystal', d.crystals || 0, 'cristales', 'crys'), chip('rune', d.ep || 0, 'puntos de inglés', 'ep'), chip('flame', st.days || 0, 'días seguidos', 'streak'))));
    push(el, { noBack: true, scene: ['main', 'title'] });
  }
  function chip(icon, n, label, cls) { return h('span', { class: 'chip ' + cls, title: label }, ICONS[icon] ? ic(icon) : h('b', {}, icon), String(n)); }

  /* ================= MAPA DE MUNDOS Y NIVELES ================= */
  function worldUnlocked(i) { if (i === 0) return true; const prevBoss = Store.data.levels[(i - 1) + ':' + LEVELS_PER_WORLD]; return !!(prevBoss && prevBoss.done) || !!Store.data.unlockAll; }
  function levelUnlocked(w, idx) { if (!worldUnlocked(w)) return false; if (idx === 1) return true; const p = Store.data.levels[w + ':' + (idx - 1)]; return !!(p && p.done && p.pass) || !!Store.data.unlockAll; }
  const EMBLEM = ['palm', 'tree', 'volcano', 'cloud', 'gear', 'tower'];
  function worldMap() {
    let sel = 0; for (let i = 0; i < WORLDS.length; i++) if (worldUnlocked(i)) sel = i;
    const hero = h('div', { class: 'wm-hero' }), strip = h('div', { class: 'wm-strip' });
    const info = i => {
      const w = WORLDS[i], un = worldUnlocked(i), lv = Array.from({ length: LEVELS_PER_WORLD }, (_, k) => Store.data.levels[i + ':' + (k + 1)] || {});
      const done = lv.filter(l => l.done).length, stars = lv.reduce((a, l) => a + (l.stars || 0), 0), cefr = [...new Set(w.units.map(u => UNIT_BY_ID[u].cefr))].join(' · ');
      MenuScene.set('world', w.biomes[0]); stack[stack.length - 1].opts.scene = ['world', w.biomes[0]];
      hero.innerHTML = '';
      hero.append(...[h('div', { class: 'wm-n' }, `WORLD ${w.n} · ${cefr}`), h('h3', { style: `font-family:"${w.font}",serif` }, w.en), h('div', { class: 'wm-es' }, w.name),
        h('div', { class: 'wm-meta' }, h('span', {}, ic('check'), `${done} / ${LEVELS_PER_WORLD} niveles`), h('span', {}, ic('star'), `${stars} / ${LEVELS_PER_WORLD * 3}`), h('span', {}, ic('book'), `${w.units.length} unidades`), h('span', {}, ic('crown'), w.bossName + (w.boss ? '' : ' (próximamente)'))),
        un ? null : h('div', { class: 'wm-meta' }, h('span', {}, ic('lock'), 'Derrota al jefe del mundo anterior para entrar'))].filter(Boolean));
    };
    WORLDS.forEach((w, i) => {
      const un = worldUnlocked(i);
      const b = h('button', { class: 'medal' + (un ? '' : ' locked'), style: `--wc:${w.col}`, 'data-nav': 1, onclick: () => un ? levelGrid(i) : toast('Locked', 'Derrota al jefe del mundo anterior para entrar.'), onfocus: () => info(i), onpointerenter: () => setFocus(b) },
        h('span', { class: 'md' }, ic(un ? EMBLEM[i] : 'lock')), h('span', { class: 'ml' }, w.en.toUpperCase()));
      strip.append(b);
    });
    const secrets = Object.values(SECRET_LEVELS).map(sl => { const un = Store.data.secrets && Store.data.secrets[sl.id]; return h('button', { class: 'secret-node' + (un ? '' : ' locked'), 'data-nav': 1, onclick: () => un ? startLevel({ secret: sl.id, w: 0 }) : toast('Secret', 'Encuentra al personaje que abre este portal.') }, un ? '✦ ' + sl.name : '✦ ???'); });
    push(screen('worlds', 'World Map', 'Mapa del mundo · elige un mundo', h('div', { class: 'wm' }, hero, strip, h('div', { class: 'secret-row' }, h('b', {}, 'SECRET LEVELS'), secrets))), { focus: `.medal:nth-child(${sel + 1})`, scene: ['world', WORLDS[sel].biomes[0]] });
    info(sel);
  }
  function levelGrid(w) {
    const W = WORLDS[w];
    const path = h('div', { class: 'lv-path' }), card = h('div', { class: 'lv-card glass' });
    const pos = i => { const row = i < 10 ? 0 : 1, k = row ? 19 - i : i; return [5 + k * 10, row ? 76 : 24]; };
    const P = []; for (let i = 0; i < 20; i++) P.push(pos(i));
    let d = `M ${P[0][0]} ${P[0][1]}`; for (let i = 1; i < 10; i++) d += ` Q ${(P[i - 1][0] + P[i][0]) / 2} ${P[i][1] + (i % 2 ? -6 : 6)} ${P[i][0]} ${P[i][1]}`;
    d += ` C 104 ${P[9][1]} 104 ${P[10][1]} ${P[10][0]} ${P[10][1]}`; for (let i = 11; i < 20; i++) d += ` Q ${(P[i - 1][0] + P[i][0]) / 2} ${P[i][1] + (i % 2 ? 6 : -6)} ${P[i][0]} ${P[i][1]}`;
    path.innerHTML = `<svg class="route-line" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="rgba(255,240,210,.55)" stroke-width="2.4" stroke-dasharray="6 7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
    let curDone = false;
    const show = i => {
      const L = Store.data.levels[w + ':' + i] || {}, boss = i === LEVELS_PER_WORLD, elite = i % 5 === 0 && !boss, unit = UNIT_BY_ID[levelUnit(W, i)], un = levelUnlocked(w, i);
      card.innerHTML = '';
      card.append(h('span', { class: 'k' }, boss ? 'WORLD BOSS' : elite ? `LEVEL ${i} · MINI-BOSS` : `LEVEL ${i}`), h('h3', {}, boss ? W.bossName : unit.title), h('p', {}, boss ? 'Jefe del mundo · sello final en inglés' : unit.es),
        h('p', {}, h('span', { class: 'cefr ' + unit.cefr }, unit.cefr), '  ', L.done ? `Mejor: ${Math.round((L.best || 0) * 100)} %` : un ? 'Sin completar' : 'Bloqueado'),
        h('div', { class: 'stars' }, '★'.repeat(L.stars || 0) + '☆'.repeat(3 - (L.stars || 0))), h('p', { class: 'small' }, un ? `Pulsa ${Input.glyph('accept')} para preparar el nivel` : 'Completa el anterior con ≥ 60 % a la primera'));
    };
    let focusSel = null;
    for (let i = 1; i <= LEVELS_PER_WORLD; i++) {
      const [x, y] = P[i - 1], L = Store.data.levels[w + ':' + i] || {}, un = levelUnlocked(w, i), boss = i === LEVELS_PER_WORLD, elite = i % 5 === 0 && !boss;
      const cur = un && !L.done && !curDone; if (cur) curDone = true;
      const node = h('button', { class: 'lv-node' + (L.done ? ' done' : '') + (un ? '' : ' locked') + (boss ? ' boss' : '') + (elite ? ' elite' : '') + (cur ? ' cur' : ''), style: `left:${x}%;top:${y}%`, 'data-nav': 1, onclick: () => un ? levelInfo(w, i) : toast('Locked', 'Completa el nivel anterior con al menos 60 % de aciertos a la primera.'), onfocus: () => show(i), onpointerenter: () => setFocus(node) },
        h('span', {}, boss ? ic('crown') : un ? String(i) : ic('lock')), h('span', { class: 'st' }, L.stars ? '★'.repeat(L.stars) : ''));
      if (cur || (!focusSel && i === 1)) focusSel = i;
      path.append(node);
    }
    push(screen('levels', W.en, `${W.name} · ${W.biomes.map(b => BIOMES[b].name).join(' · ')}`, h('div', { class: 'lv-wrap' }, path, card)), { focus: `.lv-node:nth-of-type(${focusSel})`, scene: ['levels', W.biomes[0]] });
    show(focusSel);
  }
  function levelInfo(w, i) {
    const W = WORLDS[w], L = Store.data.levels[w + ':' + i] || {}, boss = i === LEVELS_PER_WORLD, unit = UNIT_BY_ID[levelUnit(W, i)];
    if (boss && !W.boss) { toast('Coming soon', 'Este jefe llegará en la próxima actualización. Mientras, ¡juega los 19 niveles del mundo!'); return; }
    const segBtn = (k, opts) => h('div', { class: 'seg' }, ...opts.map(([v, t]) => h('button', { 'data-nav': 1, class: S()[k] === v ? 'on' : '', onclick: e => { S()[k] = v; Store.save(); e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, t)));
    const write = h('button', { 'data-nav': 1, class: 'toggle' + (S().writing ? ' on' : ''), onclick: e => { S().writing = !S().writing; Store.save(); e.currentTarget.classList.toggle('on', S().writing); } }, 'Modo escritura (más preguntas para escribir)');
    const body = h('div', { class: 'lvl-info glass' },
      h('div', { class: 'li-left' }, h('span', { class: 'lv-k' }, boss ? 'WORLD BOSS' : `LEVEL ${i}`), h('h3', { style: `font-family:"${W.font}",serif` }, boss ? W.bossName : `${W.en} — ${i}`), h('p', {}, boss ? 'Jefe del mundo · Sello final: aciertos a la primera según la dificultad' : (i % 5 === 0 ? 'Nivel con mini-jefe' : 'Nivel de exploración')),
        h('p', { class: 'unit-line' }, h('span', { class: 'cefr ' + unit.cefr }, unit.cefr), ' ', unit.title, ' — ', unit.es),
        h('p', {}, L.done ? `Mejor resultado: ${Math.round((L.best || 0) * 100)} % · ${'★'.repeat(L.stars || 0)}` : 'Aún no completado'),
        h('p', { class: 'small' }, 'Antes de empezar harás un CALENTAMIENTO con lo que ya has aprendido: si fallas, empiezas con desventaja; si aciertas, con ventaja.')),
      h('div', { class: 'li-right' }, h('label', {}, 'INGLÉS'), segBtn('englishMode', [['level', 'Inglés del nivel'], ['route', 'Mi ruta'], ['review', 'Solo repaso']]), h('label', {}, 'DIFICULTAD DEL COMBATE'), segBtn('diff', [['relax', 'Relajado'], ['normal', 'Normal (exigente)'], ['hard', 'Difícil'], ['night', 'Pesadilla']]), write,
        h('button', { class: 'big primary', 'data-nav': 1, onclick: () => startLevel({ w, idx: i }) }, ic('play'), 'PLAY')));
    push(screen('info', 'Prepare', 'Preparar nivel', body), { focus: '.big', scene: ['panel', W.biomes[0]] });
  }
  /* ---------- creador de personaje (primera vez) y armario rápido ---------- */
  function creator(first) {
    const prev = h('canvas', { class: 'preview', width: 640, height: 720 });
    const cats = [['skin', 'Piel'], ['hair', 'Pelo'], ['eyes', 'Ojos'], ['cloak', 'Capa y capucha'], ['scarf', 'Bufanda']];
    const rows = h('div', { class: 'cr-rows' });
    const refresh = () => {
      rows.innerHTML = ''; const look = currentLook();
      for (const [cat, label] of cats) rows.append(h('div', { class: 'cr-row' }, h('span', { class: 'cr-l' }, label), h('div', { class: 'cr-opts' }, LOOK[cat].filter(p => lookOwned(cat, p.id)).map(p => h('button', { class: 'cr-sw' + (look[cat] === p.id ? ' on' : ''), 'data-nav': 1, title: p.name, onclick: () => { Store.data.look = Object.assign(currentLook(), { [cat]: p.id }); Store.save(); Sound.play('select'); refresh(); } }, swatch(cat, p))))));
    };
    const done = () => { Store.data.created = 1; Store.save(true); Sound.play('correct'); mainMenu(); };
    push(screen('creator', first ? 'Create your hero' : 'Customize Lio', first ? 'Crea a tu héroe. Luego podrás comprar más ropa, colores y accesorios con las monedas que ganes.' : 'Personaliza a Lio', h('div', { class: 'ward-wrap' }, h('div', { class: 'ward-left' }, prev), h('div', { class: 'cr-box glass' }, rows, h('button', { class: 'big primary', 'data-nav': 1, onclick: done }, first ? 'START ADVENTURE' : 'SAVE')))), { noBack: !!first, scene: ['panel', 'title'] });
    refresh(); previewLoop(prev);
  }
  async function startLevel(ref) {
    clearScreens(); touchStreak();
    if (S().englishMode === 'review') { const st = UNITS.filter(u => Learn.unitStats(u.id).tot > 0).map(u => u.id); if (st.length) ref.units = st; }
    $('#hud').classList.remove('on');
    await G.loadLevel(ref);
  }
  function showLoading(p, ref) {
    let el = $('#loading'); if (!el) { el = h('div', { id: 'loading' }, h('div', { class: 'ld-title' }), h('div', { class: 'ld-bar' }, h('i')), h('div', { class: 'ld-tip' })); document.body.append(el); }
    el.classList.add('on'); el.querySelector('i').style.width = (p * 100) + '%';
    if (ref && !el.dataset.set) { el.dataset.set = 1; const W = WORLDS[ref.w] || WORLDS[0]; el.querySelector('.ld-title').textContent = ref.secret ? SECRET_LEVELS[ref.secret].name : `${W.en} · ${ref.idx === LEVELS_PER_WORLD ? W.bossName : 'Level ' + ref.idx}`; el.querySelector('.ld-title').style.fontFamily = `"${W.font}", serif`; const tip = pick(TIPS); el.querySelector('.ld-tip').innerHTML = `<b>${tip[0]}</b><br><small>${tip[1]}</small>`; }
    if (p >= 1) setTimeout(() => { el.classList.remove('on'); delete el.dataset.set; }, 200);
  }
  const TIPS = [['Parry = perfect block', 'Pulsa R1 justo cuando te van a golpear: PARADA y contraataque crítico.'], ['Down + attack in the air', 'Rebota sobre enemigos, pinchos y medusas con ↓ + □.'], ['Look for secret walls', 'Si una pared parece sospechosa, camina contra ella.'], ['Four golden letters', 'Cada nivel esconde 4 letras doradas que forman una palabra en inglés.'], ['Translate costs coins', 'Panel táctil / T traduce, pero cuesta 3 monedas y esa palabra volverá en tus preguntas.'], ['Spaced repetition', 'Las frases que fallas vuelven más tarde en contextos nuevos: así se recuerdan para siempre.'], ['Write it!', 'Escribir la respuesta (y no solo elegirla) fija mucho mejor la memoria.'], ['Hit the palm trees', '¡Golpea las palmeras y caerán cocos que puedes lanzar a tus enemigos!'], ['Ropes!', 'Salta hacia una cuerda para agarrarte. Balancéate y salta con impulso.']];

  /* ================= EN EL JUEGO: MARCADOR ================= */
  function enterGame(game) {
    const hud = $('#hud'); hud.classList.add('on');
    hud.querySelector('.word').innerHTML = ''; letters(game); questUpdate(null); $('#bossbar').classList.remove('on');
  }
  let portKey = '';
  function drawPortrait(cv) {
    const key = JSON.stringify(currentLook()); if (key === portKey) return; portKey = key;
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    const fg = { rt: 2, t: 2, windAt: () => 0, toast() { }, cam: { x: 0 }, inCombat: false }, Hh = new Hero(fg, 0, 0); Hh.state = 'idle'; Hh.blink = 1;
    const sc = cv.width / 30; g.translate(cv.width / 2 - 4 * sc, cv.height / 2 + 51 * sc); g.scale(sc, sc);
    drawHeroHead(g, Hh, lookPalette(), 2);
  }
  function hud(g) {
    const H = g.hero, el = hudEls;
    if (!el.hp) { for (const k of ['hp', 'hpg', 'hpl', 'st', 'ult', 'ultl', 'port', 'face', 'wallet', 'flasks', 'runes', 'weapon', 'bossfill', 'bossg', 'bossname']) el[k] = $('#h-' + k); el.cache = {}; }
    const C = el.cache, pct = v => (clamp(v, 0, 1) * 98.5) + '%';
    el.hp.style.width = pct(H.hp / H.maxHp); el.hpg.style.width = pct(H.hp / H.maxHp); el.hpl.textContent = Math.ceil(H.hp) + ' / ' + H.maxHp;
    el.st.style.width = pct(H.stamina / 100);
    drawPortrait(el.face);
    el.ult.style.strokeDashoffset = 289 * (1 - (H.ultCd > 0 ? 1 - H.ultCd / 8 : H.ult / 100));
    el.port.classList.toggle('ready', H.ult >= 100 && H.ultCd <= 0); el.port.classList.toggle('broken', H.ultCd > 0);
    el.ultl.textContent = H.ultCd > 0 ? 'RUNAS ROTAS ' + Math.ceil(H.ultCd) + 's' : H.ult >= 100 ? Input.glyph('ult') + ' · POWER WORD' : Math.floor(H.ult) + '%';
    const wc = (Store.data.coins || 0) - (typeof Juice !== 'undefined' ? Juice.inFlight : 0), wk = wc + '|' + (Store.data.crystals || 0) + '|' + (Store.data.ep || 0);
    if (C.wallet !== wk) { C.wallet = wk; el.wallet.innerHTML = ''; el.wallet.append(chip('coin', wc, 'monedas', 'coin'), chip('crystal', Store.data.crystals || 0, 'cristales', 'crys'), chip('rune', Store.data.ep || 0, 'puntos de inglés', 'ep')); if (typeof Juice !== 'undefined' && performance.now() - Juice.J.bumpT < 200) el.wallet.firstChild.classList.add('bump'); }
    const fk = H.flasks + '/' + H.maxFlasks; if (C.fl !== fk) { C.fl = fk; el.flasks.innerHTML = ''; for (let i = 0; i < H.maxFlasks; i++) el.flasks.append(ic('flask', i < H.flasks ? 'fl-on' : 'fl-off')); }
    const rk = H.runes; if (C.ru !== rk) { C.ru = rk; el.runes.innerHTML = ''; for (let i = 0; i < 3; i++) el.runes.append(ic('diamond', i < H.runes ? 'ru-on' : 'ru-off')); }
    if (C.wp !== H.weapon) { C.wp = H.weapon; el.weapon.textContent = WEAPONS[H.weapon].name; }
    const boss = g.boss || g.bossBar; const bb = $('#bossbar');
    if (boss && !boss.dead) { bb.classList.add('on'); { const nm = (boss.nameEn || boss.name) + '|' + (boss.title || ''); if (el.cache.bn !== nm) { el.cache.bn = nm; el.bossname.innerHTML = esc(boss.nameEn || boss.name) + (boss.title ? '<small>' + esc(boss.title) + '</small>' : ''); } } el.bossfill.style.width = pct(boss.hp / boss.maxHp); el.bossg.style.width = pct(boss.hp / boss.maxHp); } else bb.classList.remove('on');
    $('#hud').classList.toggle('exposed', H.exposed > 0);
    const acc = Learn.session.firstTotal ? Math.round(Learn.accuracy() * 100) + '%' : '—';
    $('#h-acc').textContent = acc; $('#h-streak').textContent = Learn.session.streak ? '× ' + Learn.session.streak + ' racha' : '';
    $('#h-tr').classList.toggle('on', g.translateT > 0);
  }
  function letters(g) {
    const word = g.meta.word[0], box = $('#hud .word'); box.innerHTML = '';
    const got = g.objects.filter(o => o instanceof Letter && o.done).map(o => o.ch);
    const pool = got.slice();
    for (const ch of word) { const has = pool.indexOf(ch); const sp = h('span', { class: has >= 0 ? 'got' : '' }, has >= 0 ? ch : '?'); if (has >= 0) pool.splice(has, 1); box.append(sp); }
  }
  function questUpdate(q) { const el = $('#quest'); if (!q) { el.classList.remove('on'); return; } el.classList.add('on'); el.innerHTML = `<b>QUEST</b> ${esc(q.en)}<small>${G.showEs(q.en) ? esc(q.es) : '• • • (traducir: panel / T)'}</small>`; G.seePhrase(q.en); }
  function areaName(name, font) { const el = $('#area'); el.textContent = name; el.style.fontFamily = `"${font}", serif`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  function toast(en, es, important) {
    const box = $('#toasts'); const showEs = !G || !G.phraseKnown || G.mode !== 'play' || G.showEs(en);
    const el = h('div', { class: 'toast' + (important ? ' imp' : '') }, h('b', {}, en), es ? h('small', {}, showEs ? es : '• • •') : null);
    box.append(el); if (G && G.seePhrase && G.mode === 'play') G.seePhrase(en);
    setTimeout(() => el.classList.add('out'), important ? 4200 : 2800); setTimeout(() => el.remove(), important ? 4700 : 3300);
    while (box.children.length > 4) box.firstChild.remove();
  }
  function banner(en, es, col = '#ffe080', big) {
    const el = $('#banner'); el.innerHTML = ''; el.append(h('div', { class: 'b-en', style: `color:${col}` }, en), es ? h('div', { class: 'b-es' }, es) : null);
    el.className = 'on' + (big ? ' bigb' : ''); clearTimeout(el._t); el._t = setTimeout(() => el.className = '', big ? 2600 : 2000);
  }
  function ultBanner(name, sub, col) {
    const el = $('#ultbanner'); if (!name) { el.className = ''; return; }
    el.innerHTML = ''; el.append(h('div', { class: 'u-name', style: `--uc:${rgba(col)}` }, name.toUpperCase()), h('div', { class: 'u-sub' }, sub));
    el.className = 'on';
  }
  function sealMarks(Sx) {
    const el = $('#seal'); if (!Sx) { el.className = ''; return; }
    el.className = 'on'; el.innerHTML = '';
    for (let i = 0; i < Sx.n; i++) { const m = Sx.marks[i]; el.append(h('span', { class: m === undefined ? '' : m ? 'ok' : 'bad' }, m === undefined ? '◯' : m ? '✔' : '✘')); }
    el.append(h('b', {}, ` ${Sx.ok}/${Sx.need}`));
  }
  function enemyCard(e) {
    const old = $('#ecard'); if (old) old.remove();
    const pc = document.createElement('canvas'); pc.width = 240; pc.height = 200; const pg = pc.getContext('2d');
    try { const sc = Math.min(2.2, 120 / Math.max(e.w, e.h, 30)); pg.translate(120, 110); pg.scale(sc, sc); pg.translate(-e.x, -(e.y - e.h / 2)); drawOutlined(pg, e.x, e.y - e.h / 2, gg => e.draw(gg)); } catch (err) { }
    const info = ENEMY_INFO[e.type];
    const card = h('div', { id: 'ecard' }, h('div', { class: 'ec-port' }, pc), h('div', { class: 'ec-txt' }, h('div', { class: 'ec-tag' }, 'NEW ENEMY · ENEMIGO NUEVO'), h('div', { class: 'ec-en' }, ENEMY_EN[e.type] || info.name), h('div', { class: 'ec-es' }, info.name), h('div', { class: 'ec-tip' }, ic('bulb'), h('span', {}, info.tip))));
    document.body.append(card); requestAnimationFrame(() => card.classList.add('on'));
    setTimeout(() => { card.classList.remove('on'); setTimeout(() => card.remove(), 500); }, 5200);
  }
  function brawlBanner(q, g, hint) {
    const el = $('#brawl'); if (!q) { el.className = ''; return; }
    const it = q.item; el.className = 'on'; el.innerHTML = '';
    el.append(h('div', { class: 'br-s', html: esc(it[0]).replace('___', '<span class="gap">___</span>') }), h('div', { class: 'br-es' }, (g.showEs(it[0]) || (it[6] || '').includes('s')) ? it[2] : '• • •'), h('div', { class: 'br-h' }, hint || 'Golpea al Wordling que lleva la palabra correcta'));
  }
  function promptAt(g, x, y, p) {
    if (!promptEl) promptEl = $('#prompt');
    if (x == null || !p) { promptEl.classList.remove('on'); return; }
    const c = g.cam, sx = (x - c.x) * g.SCALE, sy = (y - c.y) * g.SCALE, rect = g.cv.getBoundingClientRect();
    promptEl.style.transform = `translate(${rect.left + sx}px, ${rect.top + sy}px) translate(-50%,-100%)`;
    const gl = Input.glyph(p.act || 'interact');
    if (promptEl.dataset.k !== gl + p.text) { promptEl.dataset.k = gl + p.text; promptEl.innerHTML = `<span class="gly ${Input.glyphClass(p.act || 'interact')}">${gl}</span> ${esc(p.text)}`; }
    promptEl.classList.add('on');
  }

  /* ================= PREGUNTAS ================= */
  function showQuestion(q, opt, cb) {
    const it = q.item, u = q.unit, flags = it[6] || '';
    const wrap = $('#qpanel'); wrap.innerHTML = '';
    const head = h('div', { class: 'q-head' }, h('span', { class: 'q-kind' }, opt.title || 'QUESTION'), h('span', { class: 'q-unit' }, h('span', { class: 'cefr ' + u.cefr }, u.cefr), ' ', u.title));
    const instr = { choice: 'Elige la opción correcta', build: 'Ordena las palabras para formar la frase', type: 'Escribe lo que falta en el hueco' }[q.format];
    let sentence;
    if (q.format === 'build') { const b = q.build; sentence = h('div', { class: 'q-sentence build' }, b.before ? h('span', { class: 'ctx' }, b.before + ' ') : null, h('span', { class: 'line' }), b.end ? h('span', {}, b.end) : null, b.after ? h('span', { class: 'ctx' }, ' ' + b.after) : null); }
    else sentence = h('div', { class: 'q-sentence', html: esc(it[0]).replace('___', `<span class="gap">${q.format === 'type' ? '<input id="q-input" autocomplete="off" spellcheck="false" />' : '___'}</span>`) });
    const showEs = flags.includes('s') || q.format === 'build';
    const es = h('div', { class: 'q-es' + (showEs ? '' : ' hidden') }, showEs ? it[2] : '');
    const body = h('div', { class: 'q-body' });
    const foot = h('div', { class: 'q-foot' }, h('span', {}, gly('listen'), ' Escuchar'), h('span', {}, gly('hint'), ' Pista (' + (showEs ? 'primera letra' : 'traducción') + ')'), h('span', {}, gly('lesson'), ' Ver la lección'));
    wrap.append(head, h('div', { class: 'q-instr' }, instr), sentence, es, body, foot);
    qState = { q, opt, cb, idx: 0, built: [], answered: false, hintUsed: false, showEs, t: 0 };
    if (q.format === 'choice') {
      const glyphs = ['o1', 'o2', 'o3', 'o4'];
      const grid = h('div', { class: 'q-opts' });
      q.options.forEach((o, i) => grid.append(h('button', { class: 'opt', 'data-i': i, onclick: () => answer(i) }, h('span', { class: 'gly ' + Input.glyphClass(glyphs[i]) }, Input.glyph(glyphs[i])), h('span', { class: 'ot' }, o === '—' ? '∅ (nada)' : o))));
      body.append(grid); qState.btns = [...grid.children];
    } else if (q.format === 'build') {
      const tiles = h('div', { class: 'tiles' }); q.tiles.forEach((w, i) => tiles.append(h('button', { class: 'tile', 'data-i': i, onclick: () => placeTile(i) }, w)));
      const ctrl = h('div', { class: 'tile-ctrl' }, h('button', { class: 'tc', onclick: undoTile }, gly('back'), ' Quitar última'), h('button', { class: 'tc primary', onclick: checkBuild }, gly('lesson'), ' Comprobar'));
      body.append(tiles, ctrl); qState.btns = [...tiles.children]; qState.line = sentence.querySelector('.line');
    } else {
      const inp = wrap.querySelector('#q-input'); Input.setTyping(true);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) answer(inp.value); } });
      body.append(h('div', { class: 'type-hint' }, 'Escribe y pulsa Enter · contracciones y mayúsculas no importan'));
      setTimeout(() => inp.focus(), 60); qState.input = inp;
    }
    wrap.className = 'on fmt-' + q.format;
    hl(0);
    Speech.stop();
  }
  function gly(act) { return h('span', { class: 'gly ' + Input.glyphClass(act) }, Input.glyph(act)); }
  function hl(i) { if (!qState || !qState.btns) return; qState.idx = clamp(i, 0, qState.btns.length - 1); qState.btns.forEach((b, k) => b.classList.toggle('focus', k === qState.idx)); }
  function updateQuestion(dt) {
    const Q = qState; Q.t += dt; if (Q.answered) { updateFeedback(dt); return; }
    const q = Q.q;
    if (Input.pressed('listen') && !Input.typing) Speech.say(q.item[0].replace('___', '...'));
    if (Input.pressed('hint') && !Input.typing || (Input.typing && Input.pressed('hint'))) hint();
    if (Input.pressed('lesson') && !Input.typing && q.format !== 'build') showLesson(q.unit, () => { }, false, true);
    if (q.format === 'choice') {
      for (let i = 0; i < 4; i++) if (Input.pressed('o' + (i + 1))) return answer(i);
      for (const d of Input.nav(dt)) { const n = Q.btns.length, c = Q.idx; if (d === 'left') hl(c % 2 ? c - 1 : c); if (d === 'right') hl(c % 2 ? c : c + 1); if (d === 'up') hl(c - 2 >= 0 ? c - 2 : c); if (d === 'down') hl(c + 2 < n ? c + 2 : c); Sound.play('ui'); }
      if (Input.pressed('accept') && Input.device === 'keyboard') answer(Q.idx);
    } else if (q.format === 'build') {
      for (const d of Input.nav(dt)) { if (d === 'left' || d === 'up') hl(Q.idx - 1); else hl(Q.idx + 1); Sound.play('ui'); }
      if (Input.pressed('accept')) placeTile(Q.idx);
      if (Input.pressed('back')) undoTile();
      if (Input.pressed('lesson') || (Input.device === 'keyboard' && Input.pressed('accept') && Q.built.length === Q.q.answerWords.length)) checkBuild();
      for (let i = 0; i < 9; i++) if (Input.pressed('o' + (i + 1)) && i < 4) placeTile(Q.btns.findIndex(b => !b.disabled && b.dataset.order == null && +b.dataset.i === i));
    } else {
      if (Input.pressed('accept') && Q.input.value.trim()) answer(Q.input.value);
    }
  }
  function hint() {
    const Q = qState; if (!Q || Q.answered) return; Q.hintUsed = true; Q.q.hint = true;
    const es = $('#qpanel .q-es');
    if (!Q.showEs) { es.textContent = Q.q.item[2]; es.classList.remove('hidden'); Q.showEs = true; }
    else if (Q.q.format === 'type') { Q.input.value = Q.q.item[1][0][0]; Q.input.focus(); }
    else if (Q.q.format === 'choice') { const wrong = Q.btns.filter((b, i) => i !== Q.q.correctIndex && !b.disabled); if (wrong.length > 1) { const w = pick(wrong); w.disabled = true; w.classList.add('dim'); } }
    else if (Q.q.format === 'build') { const next = Q.q.answerWords[Q.built.length]; const i = Q.btns.findIndex(b => !b.disabled && b.textContent === next); if (i >= 0) hl(i); }
    Sound.play('select'); toast('Hint used', 'Pista usada: esta respuesta dará menos PI');
  }
  function placeTile(i) {
    const Q = qState; if (!Q || Q.answered || i < 0) return; const b = Q.btns[i]; if (!b || b.disabled) return;
    b.disabled = true; b.classList.add('used'); Q.built.push(i); Q.line.append(h('span', { class: 'placed' }, b.textContent)); Sound.play('ui');
    const nx = Q.btns.findIndex(x => !x.disabled); if (nx >= 0) hl(nx);
    if (Q.built.length === Q.q.answerWords.length) setTimeout(checkBuild, 250);
  }
  function undoTile() { const Q = qState; if (!Q || !Q.built.length) return; const i = Q.built.pop(); Q.btns[i].disabled = false; Q.btns[i].classList.remove('used'); Q.line.lastChild && Q.line.lastChild.remove(); hl(i); Sound.play('back'); }
  function checkBuild() { const Q = qState; if (!Q || Q.answered || !Q.built.length) return; answer(Q.built.map(i => Q.btns[i].textContent)); }
  function answer(resp) {
    const Q = qState; if (!Q || Q.answered) return; Q.answered = true; Input.setTyping(false);
    const res = Learn.check(Q.q, resp);
    if (Q.q.format === 'choice') { Q.btns.forEach((b, i) => { b.classList.toggle('right', i === Q.q.correctIndex); b.classList.toggle('wrong', i === resp && i !== Q.q.correctIndex); }); }
    const panel = $('#qpanel'); panel.classList.add(res.verdict === 'correct' ? 'v-ok' : res.verdict === 'spelling' ? 'v-sp' : 'v-bad');
    Q.res = res; setTimeout(() => Q.cb(res), 420);
  }
  function showFeedback(q, res, rec, opt, done) {
    const fb = Learn.feedback(q, res), Q = qState; const ok = res.verdict === 'correct', sp = res.verdict === 'spelling';
    const card = $('#feedback'); card.innerHTML = '';
    const vtxt = ok ? (rec.ep ? `✔ ¡Correcto!  +${rec.ep} PI` : '✔ ¡Correcto!') : sp ? `≈ Casi: error de ORTOGRAFÍA  +${rec.ep} PI` : '✘ Incorrecto (gramática / vocabulario)';
    card.append(h('div', { class: 'fb-v' }, vtxt));
    if (!ok && res.given) card.append(h('div', { class: 'fb-given' }, 'Tu respuesta: ', h('s', {}, String(res.given))));
    card.append(h('div', { class: 'fb-s' }, h('span', { html: fb.sentence }), h('button', { class: 'say', onclick: () => Speech.say(fb.plain) }, ic('speaker'))));
    card.append(h('div', { class: 'fb-es' }, fb.es));
    if (!ok || S().hints !== false) card.append(h('div', { class: 'fb-why' }, h('b', {}, 'Por qué: '), fb.why));
    if (fb.vocab.length) card.append(h('table', { class: 'fb-t' }, h('tr', {}, h('th', {}, 'EN'), h('th', {}, 'ES'), h('th', {}, 'FR')), fb.vocab.map(v => h('tr', {}, h('td', {}, v[0]), h('td', {}, v[1] || ''), h('td', {}, v[2] || '')))));
    if (fb.verbs.length && !ok) card.append(h('table', { class: 'fb-t verbs' }, h('tr', {}, h('th', {}, 'base'), h('th', {}, 'he/she'), h('th', {}, 'pasado'), h('th', {}, 'participio'), h('th', {}, 'ES')), fb.verbs.map(v => h('tr', {}, h('td', {}, v[0]), h('td', {}, v[1]), h('td', {}, v[2]), h('td', {}, v[3]), h('td', {}, v[4])))));
    if (!ok) card.append(h('div', { class: 'fb-tip', html: icHTML('bulb') + ' ' + fb.tip }));
    card.append(h('div', { class: 'fb-foot' }, gly('accept'), ' Continuar   ', gly('listen'), ' Escuchar'));
    card.className = 'on ' + (ok ? 'ok' : sp ? 'sp' : 'bad');
    Q.fbDone = done; Q.fbT = 0; Q.autoClose = ok ? 2.2 : 0;
    if (S().voice > 0 && (ok || sp)) Speech.say(fb.plain);
  }
  function updateFeedback(dt) {
    const Q = qState; if (!Q.fbDone) return; Q.fbT += dt;
    if (Input.pressed('listen')) Speech.say(Learn.fullSentence(Q.q.item, Q.q.item[1][0]));
    if ((Q.fbT > .45 && (Input.pressed('accept') || Input.pressed('o4') || Input.pressed('back'))) || (Q.autoClose && Q.fbT > Q.autoClose)) closeQuestion();
  }
  function closeQuestion() {
    const Q = qState; if (!Q) return; qState = null; Input.setTyping(false);
    $('#qpanel').className = ''; $('#feedback').className = '';
    const done = Q.fbDone; done && done();
  }
  function pinNote(fb) {
    const el = $('#note'); el.innerHTML = ''; el.append(h('b', {}, '✘ Recuerda: '), h('span', { html: fb.sentence }), h('small', {}, fb.es));
    el.className = 'on'; clearTimeout(el._t); el._t = setTimeout(() => el.className = '', 11000);
  }

  /* ================= LECCIONES ================= */
  function lessonBody(u) {
    const L = u.lesson;
    return h('div', { class: 'lesson' },
      h('ul', { class: 'l-points' }, L.points.map(p => h('li', { html: p }))),
      L.table ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'l-table' }, L.table.map((r, i) => h('tr', {}, r.map(c => h(i ? 'td' : 'th', {}, c)))))) : null,
      h('div', { class: 'l-ex' }, L.ex.map(([en, es]) => h('div', { class: 'ex' }, h('button', { class: 'say', onclick: () => Speech.say(en) }, ic('speaker')), h('b', {}, en), h('span', {}, es)))),
      h('div', { class: 'l-tip', html: icHTML('bulb') + '<span>' + L.tip + '</span>' }));
  }
  function showLesson(u, next, isNew, overlay) {
    const el = screen('lessonscr', (isNew ? 'NUEVA LECCIÓN · ' : '') + u.title, u.es + ' · ' + u.cefr, [lessonBody(u), h('button', { class: 'big primary', 'data-nav': 1, onclick: () => { pop(); next && next(); } }, isNew ? '¡Entendido! A practicar' : 'Volver')], { noBack: false, onBack: () => { pop(); next && next(); } });
    if (overlay) el.classList.add('overlay');
    push(el, { focus: '.big', onClose: () => { } });
    if (isNew) Sound.play('checkpoint');
  }
  function openQuickLesson(uid) { if (G) G.timeScale = G.timeScale; showLesson(UNIT_BY_ID[uid], null, false); }

  /* ================= CALENTAMIENTO ================= */
  function warmup(game, pool, done) {
    const results = []; const n = 3; let i = 0;
    const intro = screen('warm', 'WARM-UP · Calentamiento', 'Recuerda lo que ya has aprendido. Cada acierto te da ventaja en el nivel; cada fallo, desventaja.', [h('div', { class: 'warm-rows' }, h('div', { class: 'wrow ok' }, ic('rune'), h('div', {}, h('b', {}, '3 preguntas de repaso'), h('small', {}, 'De las unidades que ya has estudiado'))), h('div', { class: 'wrow ok' }, ic('bolt'), h('div', {}, h('b', {}, 'Acierto → ventaja'), h('small', {}, 'Más daño, escudo o pociones en este nivel'))), h('div', { class: 'wrow bad' }, ic('shield'), h('div', {}, h('b', {}, 'Fallo → desventaja'), h('small', {}, 'Niebla o enemigos más duros… ¡concéntrate!')))), h('button', { class: 'big primary', 'data-nav': 1, onclick: () => { pop(); next(); } }, 'Empezar calentamiento')], { noBack: true });
    push(intro, { focus: '.big' });
    const next = () => {
      if (i >= n) return done(results);
      i++; game.askQuestion({ kind: 'warmup', title: `WARM-UP ${i}/${n}`, units: pool, onResult: ok => { results.push(ok); setTimeout(next, 250); } });
    };
  }
  function warmupResult(lines, ok, n) {
    const el = screen('warm', `Calentamiento: ${ok}/${n}`, ok === n ? '¡Memoria de hierro!' : ok ? 'No está mal. ¡A por el nivel!' : 'Has olvidado cosas: repásalas en Aprender.', [h('ul', { class: 'wr' }, lines.map(([en, es]) => h('li', { class: /−|-|fog|Niebla/.test(en + es) && !/\+/.test(en) ? 'bad' : 'ok' }, h('b', {}, en), h('small', {}, es)))), h('button', { class: 'big primary', 'data-nav': 1, onclick: () => pop() }, '▶ ¡Vamos!')], { noBack: true });
    push(el, { focus: '.big' });
  }

  /* ================= PAUSA / CUADERNO ================= */
  function openPause() {
    if (!G || G.mode !== 'play') return; Sound.duck(true); Speech.stop();
    const b = (icon, t, fn) => h('button', { class: 'pbtn', 'data-nav': 1, onclick: fn }, ic(icon), t);
    const el = screen('pause', 'Paused', `${G.worldDef.en} · ${G.ref.secret ? 'Secret' : 'Level ' + G.ref.idx} · Aciertos a la primera: ${Learn.session.firstTotal ? Math.round(Learn.accuracy() * 100) + '%' : '—'}`,
      h('div', { class: 'pause-grid' },
        b('play', 'Continuar', closePause), b('retry', 'Volver al punto de control', () => { closePause(); G.respawnAtCheckpoint(false); }),
        b('book', 'Lección del nivel', () => showLesson(UNIT_BY_ID[G.units[0]], null, false)), b('note', 'Cuaderno de errores', openNotebook),
        b('pad', 'Controles', controlsScreen), b('gear', 'Opciones', options), b('map', 'Salir al mapa', () => { closePause(); G.mode = 'menu'; $('#hud').classList.remove('on'); Sound.stopMusic(); Sound.setMood('menu', { force: true }); mainMenu(); worldMap(); })), { onBack: closePause });
    push(el, { pause: true });
  }
  function closePause() { while (stack.length) pop(); Sound.duck(false); }
  function openNotebook() {
    const items = Learn.weakItems(30);
    const list = items.length ? items.map(x => { const it = x.it; return h('div', { class: 'nb-item' }, h('button', { class: 'say', 'data-nav': 1, onclick: () => Speech.say(Learn.fullSentence(it, it[1][0])) }, ic('speaker')), h('div', {}, h('b', { html: esc(it[0]).replace('___', `<mark>${esc(it[1][0])}</mark>`) }), h('small', {}, it[2]), h('em', {}, it[3]))); }) : [h('p', {}, '¡Todavía no tienes errores guardados! Cuando falles una pregunta aparecerá aquí para repasarla.')];
    push(screen('notebook', 'Cuaderno de errores', 'Las frases que más te cuestan. Volverán en tus preguntas hasta que las domines.', [h('div', { class: 'nb' }, list), items.length ? h('button', { class: 'big primary', 'data-nav': 1, onclick: () => { pop(); quickReview(items.map(x => x.u.id)); } }, 'Repasar estas frases') : null]));
  }

  /* ================= REPASO RÁPIDO (fuera del juego) ================= */
  function quickReview(units) {
    clearScreens(); menuBiome = 'mushroom'; Learn.resetSession();
    const n = 10; let i = 0; const g = G;
    const fake = { units: units || Learn.routeUnits() };
    const step = () => {
      if (i >= n) { const acc = Learn.accuracy(); push(screen('results', 'Repaso terminado', '', [h('div', { class: 'res-big' }, Math.round(acc * 100) + '%'), h('p', {}, `${Learn.session.firstOk} de ${Learn.session.firstTotal} a la primera · +${Learn.session.ep} PI`), h('button', { class: 'big primary', 'data-nav': 1, onclick: () => mainMenu() }, 'Volver al menú')], { noBack: true })); Store.save(true); touchStreak(); return; }
      i++;
      const canType = Input.device !== 'pad' || S().writing;
      const q = Learn.next({ kind: 'review', units: fake.units, canType }); q.first = true;
      const go = () => showQuestion(q, { title: `REVIEW ${i}/${n}` }, res => { const rec = Learn.record(q, res); Sound.play(res.verdict === 'wrong' ? 'wrong' : 'correct'); showFeedback(q, res, rec, {}, () => setTimeout(step, 150)); });
      if (!Store.data.lessons[q.unit.id]) { Store.data.lessons[q.unit.id] = 1; showLesson(q.unit, go, true); } else go();
    };
    step();
  }

  /* ================= BIBLIOTECA ================= */
  function library() {
    menuBiome = 'ruins';
    const tabs = h('div', { class: 'tabs' }); const content = h('div', { class: 'lib-content' });
    const show = k => { tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); content.innerHTML = ''; content.append(LIBTABS[k]()); };
    for (const [k, t] of [['units', 'Lecciones A1 → B1'], ['vocab', 'Vocabulario EN·ES·FR'], ['verbs', 'Verbos irregulares'], ['notebook', 'Mis errores']]) tabs.append(h('button', { 'data-nav': 1, 'data-k': k, onclick: () => show(k) }, t));
    push(screen('library', 'Learn', 'Aprender · tu diccionario y gramática de bolsillo', [tabs, content]), { scene: ['dim', 'title'] });
    show('units');
  }
  const LIBTABS = {
    units() {
      const box = h('div', { class: 'unit-list' });
      for (const lvl of ['A1', 'A2', 'B1']) {
        box.append(h('h3', { class: 'lvl-h' }, LEVELS_CEFR[lvl]));
        for (const u of UNITS.filter(x => x.cefr === lvl)) { const s = Learn.unitStats(u.id); box.append(h('button', { class: 'unit', 'data-nav': 1, onclick: () => showLesson(u, null, false) }, h('span', { class: 'cefr ' + u.cefr }, u.cefr), h('b', {}, u.title), h('small', {}, u.es), h('span', { class: 'bar' }, h('i', { style: `width:${s.mastery * 100}%` })), h('em', {}, s.tot ? `${Math.round(s.acc * 100)} % a la primera` : 'sin practicar'))); }
      }
      return box;
    },
    vocab() {
      const rows = new Map(); for (const u of UNITS) for (const it of u.items) for (const v of (it[4] || '').split(';')) { const p = v.split('=').map(x => x.trim()); if (p[0] && !rows.has(p[0])) rows.set(p[0], [p[0], p[1] || '', p[2] || '', u.cefr]); }
      const inp = h('input', { class: 'search', placeholder: 'Buscar palabra (inglés o español)…', 'data-nav': 1 });
      const tb = h('table', { class: 'vocab' });
      const fill = () => { const q = inp.value.toLowerCase(); tb.innerHTML = ''; tb.append(h('tr', {}, h('th', {}, ''), h('th', {}, 'English'), h('th', {}, 'Español'), h('th', {}, 'Français'), h('th', {}, ''))); [...rows.values()].filter(r => !q || r.join(' ').toLowerCase().includes(q)).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 400).forEach(r => tb.append(h('tr', {}, h('td', {}, h('button', { class: 'say', onclick: () => Speech.say(r[0]) }, ic('speaker'))), h('td', {}, h('b', {}, r[0])), h('td', {}, r[1]), h('td', {}, r[2]), h('td', {}, h('span', { class: 'cefr ' + r[3] }, r[3]))))); };
      inp.addEventListener('focus', () => Input.setTyping(true)); inp.addEventListener('blur', () => Input.setTyping(false)); inp.addEventListener('input', fill); fill();
      return h('div', {}, inp, h('div', { class: 'tbl-wrap' }, tb));
    },
    verbs() {
      const tb = h('table', { class: 'vocab' }, h('tr', {}, h('th', {}, ''), h('th', {}, 'Base'), h('th', {}, 'He/She'), h('th', {}, 'Pasado'), h('th', {}, 'Participio'), h('th', {}, 'Español'), h('th', {}, 'Français')));
      Object.keys(VERBS).sort().forEach(k => { const v = VERBS[k]; tb.append(h('tr', {}, h('td', {}, h('button', { class: 'say', onclick: () => Speech.say(`${v[0]}, ${v[1]}, ${v[2]}`) }, ic('speaker'))), h('td', {}, h('b', {}, v[0])), h('td', {}, thirdPerson(k)), h('td', {}, v[1]), h('td', {}, v[2]), h('td', {}, v[3]), h('td', {}, v[4]))); });
      return h('div', { class: 'tbl-wrap' }, tb);
    },
    notebook() { const items = Learn.weakItems(40); return h('div', { class: 'nb' }, items.length ? items.map(x => { const it = x.it; return h('div', { class: 'nb-item' }, h('button', { class: 'say', onclick: () => Speech.say(Learn.fullSentence(it, it[1][0])) }, ic('speaker')), h('div', {}, h('b', { html: esc(it[0]).replace('___', `<mark>${esc(it[1][0])}</mark>`) }), h('small', {}, it[2]), h('em', {}, it[3]))); }) : h('p', {}, 'Aún no hay errores guardados.')); }
  };

  /* ================= ARMARIO ================= */
  function wardrobe() {
    menuBiome = 'beach';
    const prev = h('canvas', { class: 'preview', width: 320, height: 360 });
    const wallet = h('div', { class: 'wallet' });
    const cats = { skin: 'Piel', hair: 'Pelo', cloak: 'Capa', scarf: 'Bufanda', hat: 'Cabeza', eyes: 'Ojos', back: 'Espalda', trail: 'Estela' };
    const tabs = h('div', { class: 'tabs' }), grid = h('div', { class: 'ward-grid' });
    let cat = 'cloak';
    const refresh = () => {
      wallet.innerHTML = ''; wallet.append(chip('coin', Store.data.coins || 0, 'monedas', 'coin'));
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === cat));
      grid.innerHTML = ''; const look = currentLook();
      for (const p of LOOK[cat]) {
        const own = lookOwned(cat, p.id), eq = look[cat] === p.id;
        grid.append(h('button', { class: 'ward' + (eq ? ' eq' : '') + (own ? '' : ' lockd'), 'data-nav': 1, onclick: () => { if (own) { Store.data.look = Object.assign(currentLook(), { [cat]: p.id }); Store.save(); Sound.play('select'); refresh(); } else { const r = buyPart(cat, p.id); if (r === 'ok') { FX.celebrate(160, 200); Sound.play('correct'); toast('Bought!', '¡Comprado! ' + p.name); Store.data.look = Object.assign(currentLook(), { [cat]: p.id }); Store.save(); refresh(); } else toast('Not enough coins', 'Te faltan ' + (p.price - (Store.data.coins || 0)) + ' monedas: ¡juega niveles y abre cofres!'); } } },
          swatch(cat, p), h('b', {}, p.name), h('small', {}, eq ? 'Equipado' : own ? 'Tuyo' : p.price + ' ●')));
      }
    };
    for (const k in cats) tabs.append(h('button', { 'data-nav': 1, 'data-k': k, onclick: () => { cat = k; refresh(); } }, cats[k]));
    const lucky = h('button', { class: 'big lucky', 'data-nav': 1, onclick: () => { const r = luckyChest(); if (r.res === 'poor') toast('Not enough coins', 'El cofre de la suerte cuesta 150 monedas'); else if (r.res === 'all') toast('Wow!', '¡Ya lo tienes todo!'); else { Sound.play('gate'); setTimeout(() => Sound.play('correct'), 500); toast(r.rare ? 'RARE ITEM!' : 'Lucky!', '¡Has conseguido: ' + r.part.name + '!', true); cat = r.cat; Store.data.look = Object.assign(currentLook(), { [r.cat]: r.part.id }); Store.save(); refresh(); } } }, ic('gift'), 'Cofre de la suerte · 150', ic('coin'));
    push(screen('wardrobe', 'Wardrobe', 'Armario · gana monedas en los niveles y en los cofres para desbloquear piezas', h('div', { class: 'ward' + '-wrap' }, h('div', { class: 'ward-left' }, prev, lucky), h('div', { class: 'ward-right' }, tabs, grid)), { right: wallet }), { scene: ['panel', 'title'] });
    refresh(); previewLoop(prev);
  }
  function swatch(cat, p) {
    const s = h('span', { class: 'sw' });
    if (typeof p.c === 'string') s.style.background = `radial-gradient(circle at 35% 30%, ${p.c}, ${p.s || p.c})`;
    else if (p.c && typeof p.c[0] === 'string') s.style.background = `linear-gradient(135deg, ${p.c.join(',')})`;
    else if (p.c) s.style.background = rgba(p.c);
    else s.textContent = { hood: '◓', bandana: '☠', tricorn: '⌂', flowers: '✿', wizard: '▲', cat: '◬', horns: '♉', crown: '♛', halo: '◯', pack: '▣', none: '∅', cape: '⌇', wings: '❦', runewings: 'ᛉ', sparkle: '✦', petals: '❀', bubbles: '◌', notes: '♪', flames: '♨', letters: 'ABC' }[p.id] || '?';
    return s;
  }
  function previewLoop(cv) {
    const g = cv.getContext('2d'), W = cv.width, Hh = cv.height, fakeGame = { rt: 0, t: 0, windAt: () => -25, toast() { }, cam: { x: 0 }, inCombat: false };
    const hero = new Hero(fakeGame, 0, 0); hero.onGround = true; hero.state = 'idle'; hero.bufS = 5;
    let poseT = 0;
    const loop = () => {
      if (!cv.isConnected) return; fakeGame.rt += 1 / 60; fakeGame.t = fakeGame.rt; poseT += 1 / 60;
      hero.blink -= 1 / 60; if (hero.blink < -.12) hero.blink = R(2, 4);
      hero.face = Math.sin(fakeGame.rt * .35) > -.2 ? 1 : -1; hero.x = 0; hero.y = 0; hero.updateCloth(1 / 60);
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, Hh);
      const gr = g.createRadialGradient(W / 2, Hh * .72, 10, W / 2, Hh * .72, W * .55); gr.addColorStop(0, 'rgba(255,240,200,.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(W / 2, Hh * .84, W * .16, W * .025, 0, 0, TAU); g.fill();
      const sc = W / 115; g.translate(W / 2, Hh * .84); g.scale(sc, sc); hero.draw(g); g.globalCompositeOperation = 'lighter'; hero.drawGlow(g); g.globalCompositeOperation = 'source-over';
      requestAnimationFrame(loop);
    };
    loop();
  }
  /* ================= TALLER ================= */
  function workshop() {
    menuBiome = 'lava';
    const box = h('div', { class: 'shop' }); const d = Store.data;
    const refresh = () => {
      box.innerHTML = '';
      box.append(h('h3', {}, 'Armas'));
      for (const k in WEAPONS) {
        const W = WEAPONS[k], own = d.unlocked.weapons[k], can = d.ep >= W.ep && (d.crystals || 0) >= W.cost, eq = (d.weapon || 'sword') === k;
        box.append(h('button', { class: 'shop-item' + (own ? ' own' : '') + (eq ? ' eq' : ''), 'data-nav': 1, onclick: () => { if (own) { d.weapon = k; Store.save(); refresh(); Sound.play('select'); } else if (can) { d.crystals -= W.cost; d.unlocked.weapons[k] = 1; d.weapon = k; Store.save(true); Sound.play('correct'); toast('New weapon!', '¡Nueva arma: ' + W.name + '!', true); refresh(); } else toast('Locked', `Necesitas ${W.ep} PI (tienes ${d.ep}) y ${W.cost} ◆ (tienes ${d.crystals || 0}).`); } },
          h('b', {}, W.name), h('small', {}, W.es), h('em', {}, 'Ataque definitivo: ' + W.ult), h('span', { class: 'price' }, own ? (eq ? 'Equipada' : 'Equipar') : `${W.ep} PI · ${W.cost} ◆`)));
      }
      box.append(h('h3', {}, 'Habilidades'));
      for (const k in SKILLS) {
        const Sk = SKILLS[k], lvl = d.unlocked.skills[k] || 0, max = Sk.max || 1, own = lvl >= max, ep = Array.isArray(Sk.ep) ? Sk.ep[lvl] : Sk.ep, cost = Array.isArray(Sk.cost) ? Sk.cost[lvl] : Sk.cost, can = !own && d.ep >= ep && (d.crystals || 0) >= cost;
        box.append(h('button', { class: 'shop-item' + (own ? ' own' : ''), 'data-nav': 1, onclick: () => { if (own) return; if (can) { d.crystals -= cost; d.unlocked.skills[k] = lvl + 1; Store.save(true); Sound.play('correct'); toast('Skill unlocked!', '¡' + Sk.name + ' desbloqueada!', true); refresh(); } else toast('Locked', `Necesitas ${ep} PI y ${cost} ◆.`); } },
          h('b', {}, Sk.name + (max > 1 ? ` (${lvl}/${max})` : '')), h('small', {}, Sk.es), h('span', { class: 'price' }, own ? '✔ Desbloqueada' : `${ep} PI · ${cost} ◆`)));
      }
      if (typeof TECHS !== 'undefined') {
        box.append(h('h3', {}, 'Técnicas · mantén BLOQUEO y pulsa ATAQUE'));
        for (const k in TECHS) {
          const T = TECHS[k], W = WEAPONS[k], has = (d.techs || {})[k], hasW = d.unlocked.weapons[k];
          box.append(h('button', { class: 'shop-item' + (has ? ' own' : ''), 'data-nav': 1, onclick: () => { const r = Arsenal.buyTech(k); if (r === 'ok') { Sound.play('correct'); toast(T.en + '!', '¡' + T.name + ' aprendida! Con ' + W.name + ': mantén BLOQUEO y pulsa ATAQUE.', true); refresh(); } else if (r === 'weapon') toast('Locked', 'Primero consigue el arma: ' + W.name); else if (r === 'ep') toast('Locked', `Necesitas ${T.ep} PI (tienes ${d.ep || 0}).`); else if (r === 'coins') toast('Not enough coins', `Te faltan ${T.coins - (d.coins || 0)} monedas.`); } },
            h('b', {}, T.name + ' · ' + T.en), h('small', {}, W.name + ': ' + T.es), h('span', { class: 'price' }, has ? '✔ Aprendida' : `${T.ep} PI · ${T.coins} monedas`)));
        }
      }
    };
    refresh();
    push(screen('workshop', 'Workshop', 'Taller · las armas y habilidades se desbloquean con tus PUNTOS DE INGLÉS (saber) y se pagan con CRISTALES (explorar)', box, { right: h('div', { class: 'wallet' }, chip('rune', d.ep || 0, '', 'ep'), chip('crystal', d.crystals || 0, '', 'crys'), chip('coin', d.coins || 0, '', 'coin')) }), { scene: ['dim', 'title'] });
  }

  /* ================= PROGRESO ================= */
  function progress() {
    menuBiome = 'cave'; const d = Store.data, hist = d.history || [];
    const first = hist.filter(x => x.f), acc = first.length ? first.filter(x => x.v !== 'w').length / first.length : 0;
    const spell = hist.filter(x => x.v === 's').length, gram = hist.filter(x => x.v === 'w').length;
    const rows = UNITS.map(u => { const s = Learn.unitStats(u.id); return h('tr', {}, h('td', {}, h('span', { class: 'cefr ' + u.cefr }, u.cefr)), h('td', {}, u.title), h('td', {}, s.tot ? Math.round(s.acc * 100) + ' %' : '—'), h('td', {}, `${s.ok}/${s.tot}`), h('td', {}, h('span', { class: 'bar' }, h('i', { style: `width:${s.mastery * 100}%` })))); });
    push(screen('progress', 'Progress', 'Progreso · la puntuación es práctica, no un examen oficial (TOEIC/MCER).', [
      h('div', { class: 'stats' }, stat(d.ep || 0, 'Puntos de inglés'), stat(Math.round(acc * 100) + ' %', 'Aciertos a la primera'), stat(gram, 'Errores de gramática'), stat(spell, 'Errores de ortografía'), stat(streakInfo().best || 0, 'Mejor racha (días)'), stat(Object.keys(d.items).length, 'Frases practicadas')),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'vocab' }, h('tr', {}, h('th', {}, ''), h('th', {}, 'Unidad'), h('th', {}, 'A la primera'), h('th', {}, 'Aciertos'), h('th', {}, 'Dominio')), rows)), typeof Puzzles !== 'undefined' ? Puzzles.gallery() : null]), { scene: ['dim', 'title'] });
  }
  function stat(n, l) { return h('div', { class: 'stat' }, h('b', {}, String(n)), h('small', {}, l)); }

  /* ================= OPCIONES ================= */
  function options() {
    const s = S();
    const slider = (k, label) => { const i = h('input', { type: 'range', min: 0, max: 1, step: .05, value: s[k] ?? .8, 'data-nav': 1 }); i.addEventListener('input', () => { s[k] = +i.value; Sound.setVolumes(s.master, s.music, s.sfx); Store.save(); }); i.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }); return h('label', { class: 'opt-row' }, h('span', {}, label), i); };
    const toggle = (k, label, fn) => h('button', { class: 'toggle' + (s[k] ? ' on' : ''), 'data-nav': 1, onclick: e => { s[k] = !s[k]; Store.save(); e.currentTarget.classList.toggle('on', s[k]); fn && fn(); } }, label);
    const seg = (k, label, opts) => h('div', { class: 'opt-row' }, h('span', {}, label), h('div', { class: 'seg' }, opts.map(([v, t]) => h('button', { 'data-nav': 1, class: s[k] === v ? 'on' : '', onclick: e => { s[k] = v; Store.save(); applySettings(); e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, t))));
    push(screen('options', 'Options', 'Opciones', h('div', { class: 'opts' },
      seg('diff', 'Dificultad del combate', [['relax', 'Relajado'], ['normal', 'Normal'], ['hard', 'Difícil'], ['night', 'Pesadilla']]),
      seg('textSize', 'Tamaño del texto', [['M', 'Normal'], ['L', 'Grande'], ['XL', 'Muy grande']]),
      slider('master', 'Volumen general'), slider('music', 'Música'), slider('sfx', 'Efectos'), slider('voice', 'Voz (pronunciación)'),
      toggle('reduced', 'Movimiento reducido (menos sacudidas y destellos)', applySettings),
      toggle('writing', 'Modo escritura: más preguntas para escribir'),
      toggle('noRumble', 'Desactivar vibración del mando', applySettings),
      toggle('swapXO', 'Intercambiar ✕ y ○ (si tu mando va al revés)', applySettings),
      h('button', { class: 'toggle', 'data-nav': 1, onclick: () => toggleFullscreen() }, 'Pantalla completa (F)'),
      h('button', { class: 'toggle', 'data-nav': 1, onclick: controlsScreen }, 'Ver controles y probar el mando'),
      h('p', { class: 'credits', style: 'font-size:.72em;color:var(--ink3);margin-top:10px;line-height:1.4' }, 'Música compuesta por el juego en tiempo real. Orquesta: VS Chamber Orchestra 2 Community Edition de Versilian Studios (CC0) · piano: Salamander Grand Piano de Alexander Holm (CC BY 3.0) · coro, guitarras y bajo: MusyngKite soundfont (CC BY-SA 3.0, vía midi-js-soundfonts de B. Gleitzman) · batería: web-audio-samples de Google Chrome Labs (Apache 2.0).'),
      h('button', { class: 'toggle danger', 'data-nav': 1, onclick: () => { if (s._confirmReset) { Store.reset(); toast('Progress reset', 'Progreso borrado'); mainMenu(); } else { s._confirmReset = 1; toast('Press again to confirm', 'Pulsa otra vez para borrar TODO el progreso'); setTimeout(() => s._confirmReset = 0, 3000); } } }, 'Borrar progreso'))));
  }
  function applySettings() {
    const s = S(); document.documentElement.dataset.text = s.textSize || 'L'; FX.setReduced(!!s.reduced); Input.setRumble(!s.noRumble);
    Input.setMap(s.swapXO ? { CROSS: 1, CIRCLE: 0 } : null); Sound.setVolumes(s.master ?? .8, s.music ?? .65, s.sfx ?? .8);
  }
  function controlsScreen() {
    const rows = [['Moverse', 'Stick izq. / cruceta', 'A D / ← →'], ['Saltar · doble salto · salto en pared', '✕', 'Espacio / W'], ['Atacar (mantener = cargado)', '□', 'J'], ['↓ + atacar en el aire = rebote', '↓ + □', 'S + J'], ['Esquivar (invulnerable)', '○', 'K / Shift'], ['Caída sísmica', '↓ + ✕ en el aire', 'S + Espacio'], ['Bloquear / PARADA perfecta', 'R1', 'L'], ['PALABRA DE PODER (ataque definitivo)', 'R2', 'U'], ['Interactuar / disparo rúnico', '△', 'E'], ['Curarse (mantener)', 'L1', 'H'], ['Garfio', 'L2', 'G'], ['Carrera rúnica', 'L3 (pulsar stick izq.)', 'C'], ['Grito de guerra', 'R3 (pulsar stick dcho.)', 'T'], ['Mirar alrededor', 'Stick dcho.', '—'], ['Cambiar de arma', 'Cruceta ← →', 'Q / Tab'], ['Libro rúnico (lección)', 'Cruceta ↑', 'B'], ['Cuaderno de errores', 'CREATE', 'N'], ['TRADUCIR (cuesta monedas)', 'Panel táctil', 'M'], ['Pausa', 'OPTIONS', 'Esc'], ['Preguntas: opciones 1-4', '△ □ ○ ✕', '1 2 3 4'], ['Preguntas: escuchar · pista · lección', 'L1 · L2 · R1', 'L · H · B']];
    const live = h('div', { class: 'padtest' }, 'Pulsa cualquier botón del mando…');
    const tick = () => { if (!live.isConnected) return; const i = Input.rawPadPressed(); if (i >= 0) { const name = Object.keys(Input.PAD).find(k => Input.PAD[k] === i) || '?'; live.textContent = `Botón ${i} → ${name}${Input.padId ? ' · ' + Input.padId.slice(0, 40) : ''}`; } requestAnimationFrame(tick); }; tick();
    push(screen('controls', 'Controles', 'Todos los botones del mando tienen una función. El mando vibra con golpes, paradas, aciertos y fallos.', [live, h('div', { class: 'tbl-wrap' }, h('table', { class: 'vocab' }, h('tr', {}, h('th', {}, 'Acción'), h('th', {}, 'Mando PlayStation'), h('th', {}, 'Teclado')), rows.map(r => h('tr', {}, r.map(c => h('td', {}, c))))))]));
  }
  function toggleFullscreen() { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => toast('Fullscreen not available', 'Pantalla completa no disponible aquí')); else document.exitFullscreen(); } catch (e) { } }

  /* ================= SECRETOS / RESULTADOS ================= */
  function confirmSecret(id) {
    const Sx = SECRET_LEVELS[id];
    push(screen('info', '✦ ' + Sx.name, 'Nivel secreto desbloqueado. ¿Entrar ahora? (podrás volver desde el mapa)', h('div', { class: 'pause-grid' }, h('button', { class: 'pbtn', 'data-nav': 1, onclick: () => { pop(); startLevel({ secret: id, w: 0 }); } }, '✦ Entrar ahora'), h('button', { class: 'pbtn', 'data-nav': 1, onclick: () => pop() }, 'Seguir en este nivel'))));
  }
  function showResults(r) {
    $('#hud').classList.remove('on'); promptAt(G, null);
    const missed = Learn.session.missed.slice(0, 6).map(m => h('div', { class: 'nb-item' }, h('button', { class: 'say', onclick: () => Speech.say(m.sentence) }, ic('speaker')), h('div', {}, h('b', {}, m.sentence), h('small', {}, m.es), h('em', {}, 'Tú: ' + m.given))));
    const pct = Math.round(r.acc * 100), C = 2 * Math.PI * 44;
    const starEls = [0, 1, 2].map(i => h('div', { class: 'rs-star' + (i < r.stars ? ' on' : ''), style: `animation-delay:${.35 + i * .28}s` }, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>' })));
    const word = r.word[0].toUpperCase().split('').map((ch, i) => h('span', { class: 'rw-l' + (i < r.letters ? ' got' : ''), style: `animation-delay:${1.1 + i * .08}s` }, ch));
    const ring = h('div', { class: 'rs-ring', html: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg${r.pass ? '' : ' bad'}" style="stroke-dasharray:${C};stroke-dashoffset:${C};--to:${C * (1 - r.acc)}"/></svg><b>${pct}%</b><small>a la primera</small>` });
    const big = (icon, v, l) => h('div', { class: 'rs-big' }, ic(icon), h('b', {}, v), h('small', {}, l));
    const chip = (v, l) => h('span', { class: 'rs-chip' }, h('b', {}, v), ' ', l);
    const el = screen('results', r.pass ? 'Level complete!' : 'Level finished', r.pass ? '¡Siguiente nivel desbloqueado!' : `Necesitas ≥ 60 % de aciertos a la primera para abrir el siguiente nivel (has sacado ${pct} %).`, [
      h('div', { class: 'rs-hero' }, h('div', { class: 'rs-stars' }, starEls), h('div', { class: 'rs-word' }, h('div', { class: 'rw-tiles' }, word), h('div', { class: 'rw-es' }, `${r.word[1]}${r.word[2] ? ' · ' + r.word[2] : ''}`), h('div', { class: 'rw-n' }, `${r.letters}/${r.word[0].length} letras encontradas`))),
      h('div', { class: 'rs-main' }, ring, big('sparkle', '+' + r.ep, 'Puntos de inglés'), big('coin', '+' + r.coins, 'Monedas'), big('crystal', '+' + r.crystals, 'Cristales')),
      h('div', { class: 'rs-chips' }, chip(r.spell, 'ortografía'), chip(r.gram, 'gramática'), chip(r.enemies, 'enemigos'), chip(r.secrets, 'secretos'), chip(r.chests, 'cofres'), chip(fmtTime(r.time), 'tiempo')),
      missed.length ? h('div', { class: 'rs-missed' }, h('h3', {}, 'Frases para repasar'), h('div', { class: 'nb two' }, missed)) : h('p', { class: 'perfect' }, '¡Sin errores! Increíble.'),
      h('div', { class: 'pause-grid' }, r.next ? h('button', { class: 'pbtn primary', 'data-nav': 1, onclick: () => startLevel(r.next) }, ic('play'), 'Siguiente nivel') : null, h('button', { class: 'pbtn', 'data-nav': 1, onclick: () => startLevel(G.ref) }, ic('retry'), 'Repetir (preguntas nuevas)'), h('button', { class: 'pbtn', 'data-nav': 1, onclick: () => { mainMenu(); if (!G.ref.secret) levelGrid(G.ref.w); } }, ic('map'), 'Mapa'))], { noBack: true });
    if (r.stars) setTimeout(() => { for (let i = 0; i < r.stars; i++) setTimeout(() => Sound.play('select'), i * 280); }, 350);
    push(el, { focus: '.primary' });
  }
  function fmtTime(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function init(game) {
    G = game; toastBox = $('#toasts'); applySettings();
    addEventListener('keydown', e => { if (e.code === 'KeyF' && !Input.typing) toggleFullscreen(); });
    Store.listeners.push(() => { if (G.mode === 'menu') mainMenu(); });
  }
  return { init, update, title, mainMenu, worldMap, creator, showLoading, enterGame, hud, letters, questUpdate, areaName, toast, banner, ultBanner, sealMarks, brawlBanner, enemyCard, promptAt, showQuestion, showFeedback, pinNote, showLesson, openQuickLesson, warmup, warmupResult, openPause, openNotebook, confirmSecret, showResults, modalOpen, toggleFullscreen, startLevel, get menuBiome() { return menuBiome; } };
})();

/* ---------- final de nivel ---------- */
Game.prototype.levelComplete = function () {
  const s = Learn.session, acc = Learn.accuracy(), key = this.levelKey();
  const letters = this.objects.filter(o => o instanceof Letter && o.done).length, total = this.objects.filter(o => o instanceof Letter).length;
  const pass = acc >= .6 || s.firstTotal === 0;
  const stars = !pass ? 0 : 1 + (acc >= .75 ? 1 : 0) + (acc >= .9 && letters === total ? 1 : 0);
  const L = Store.data.levels[key] || {}; L.done = true; L.pass = L.pass || pass; L.stars = Math.max(L.stars || 0, stars); L.best = Math.max(L.best || 0, acc); Store.data.levels[key] = L;
  const bonus = LEVELS_PER_WORLD && this.ref.idx === LEVELS_PER_WORLD ? 150 : 40 + (this.ref.idx || 1) * 3; Store.data.coins = (Store.data.coins || 0) + bonus;
  Store.save(true);
  this.mode = 'results'; Sound.setMood('victory', { immediate: true }); Speech.stop();
  let next = null; if (!this.ref.secret && pass) { if (this.ref.idx < LEVELS_PER_WORLD) next = { w: this.ref.w, idx: this.ref.idx + 1 }; else if (WORLDS[this.ref.w + 1]) next = { w: this.ref.w + 1, idx: 1 }; }
  UI.showResults({ stars, acc, pass, ep: s.ep, spell: s.spelling, gram: s.grammar, coins: this.stats.coins + bonus, crystals: this.stats.crystals, enemies: this.stats.enemies, secrets: this.stats.secrets, chests: this.stats.chests, time: this.stats.time, word: this.meta.word, letters, next });
};
