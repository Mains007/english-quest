"use strict";
/* =====================================================================
   MOTOR DE APRENDIZAJE
   - Elige preguntas (repetición espaciada tipo Leitner + palabras débiles
     reintroducidas en frases nuevas).
   - Tres formatos: elegir (△□○✕), construir la frase con fichas, escribir.
   - Corrige con tolerancia: contracciones, mayúsculas, puntuación,
     y distingue ORTOGRAFÍA de GRAMÁTICA.
   - Puntos de inglés (PI), rachas y estadísticas por unidad.
   ===================================================================== */
const MOVABLE = /\b(yesterday|today|tomorrow|tonight|now|sometimes|usually|later|soon|last|next|ago|every|already|still|then|maybe|again)\b/i;

const Learn = (() => {
  const S = () => Store.data;
  const session = { asked: 0, firstOk: 0, firstTotal: 0, spelling: 0, grammar: 0, hints: 0, ep: 0, streak: 0, best: 0, recent: [], missed: [], log: [] };

  function resetSession() { Object.assign(session, { asked: 0, firstOk: 0, firstTotal: 0, spelling: 0, grammar: 0, hints: 0, ep: 0, streak: 0, best: 0, recent: [], missed: [], log: [] }); }

  /* ---------- texto ---------- */
  function norm(s) {
    return (' ' + String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?;:"«»()¿¡]/g, ' ') + ' ')
      .replace(/\s+/g, ' ');
  }
  function expand(s) {
    s = norm(s);
    s = s.replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not').replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
      .replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will').replace(/'d\b/g, ' would')
      .replace(/\b(it|he|she|that|there|what|who|where|here|this)'s\b/g, '$1 is');
    return s.replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }
  const ENDINGS = ['s', 'es', 'ed', 'd', 'ing', 'ies', 'ied', 'er', 'est'];
  function morphological(a, b) {
    // diferencia de terminación gramatical (works / work, studied / study…) → es gramática, no ortografía
    for (const e of ENDINGS) { if (a + e === b || b + e === a) return true; }
    const stem = x => x.replace(/(ies|ied|ing|es|ed|s|d)$/, '');
    return a !== b && stem(a) === stem(b) && stem(a).length > 2;
  }

  /* ---------- datos de una pregunta ---------- */
  function vocabRows(it) { return (it[4] || '').split(';').map(s => s.trim()).filter(Boolean).map(s => s.split('=').map(x => x.trim())); }
  function verbRows(it) {
    return (it[5] || '').split(',').map(s => s.trim()).filter(v => VERBS[v]).map(v => { const r = VERBS[v]; return [r[0], thirdPerson(v), r[1], r[2], r[3], r[4]]; });
  }
  function flags(it) { return it[6] || ''; }
  function fullSentence(it, ans) { return it[0].replace('___', ans === '—' ? '' : ans).replace(/\s+/g, ' ').replace(/\s([.,?!])/g, '$1').trim(); }

  function buildable(it) {
    if (flags(it).includes('c') || it[1][0] === '—') return null;
    // tomar solo la frase que contiene el hueco
    const parts = it[0].split(/(?<=[.?!])\s+(?=[A-Z—])/);
    const idx = parts.findIndex(p => p.includes('___'));
    if (idx < 0) return null;
    const target = parts[idx];
    if (/—|:/.test(target)) return null;
    const sent = target.replace('___', it[1][0]).trim();
    const end = (sent.match(/[.?!]$/) || [''])[0];
    const core = sent.replace(/[.?!]$/, '');
    if (core.includes(',')) return null;
    const words = core.split(/\s+/);
    if (words.length < 3 || words.length > 10) return null;
    if (MOVABLE.test(core)) return null;
    return { words, end, before: parts.slice(0, idx).join(' '), after: parts.slice(idx + 1).join(' ') };
  }
  function isProper(w) { return /^(I|I'm|I'd|I'll|I've|London|Madrid|Moscow|Paris|Spain|Europe|Asia|English|French|Chinese|Monday|Saturday|Saturdays|Sunday|Sundays|Christmas|May|Leo|Anna|Maria|Tom|OK)$/.test(w.replace(/[.,?!]/g, '')); }
  function typeable(it) { return !flags(it).includes('c') && it[1][0] !== '—' && it[1][0].split(' ').length <= 3; }

  /* ---------- selección ---------- */
  function unitMastery(uid) { const u = S().units[uid]; return u ? Math.min(1, (u.ep || 0) / 100) : 0; }
  function routeUnits() {
    // unidad actual = la primera sin dominar; repaso = las dos anteriores
    let cur = UNITS.findIndex(u => unitMastery(u.id) < 1); if (cur < 0) cur = UNITS.length - 1;
    const list = [UNITS[cur].id]; if (cur > 0) list.push(UNITS[cur - 1].id); if (cur > 1) list.push(UNITS[cur - 2].id);
    return list;
  }
  function currentUnit() { const r = routeUnits(); return UNIT_BY_ID[r[0]]; }

  function pickItem(units, opts = {}) {
    const st = S().items, tags = S().tags; const pool = [];
    units.forEach((uid, k) => {
      const u = UNIT_BY_ID[uid]; if (!u) return;
      const unitW = opts.weights ? opts.weights[k] : 1;
      u.items.forEach(it => {
        const s = st[it.id]; let w;
        if (!s) w = 2.2; else w = [0, 4.2, 2.2, 1.2, .6, .35][clamp(s.b || 1, 1, 5)];
        for (const v of vocabRows(it)) if (tags[v[0]] > 0) w += .7 * Math.min(3, tags[v[0]]);
        if (session.recent.includes(it.id)) w *= .01;
        if (opts.notIds && opts.notIds.includes(it.id)) w = 0;
        if (opts.needBuild && !buildable(it)) w *= .05;
        pool.push([it, w * unitW]);
      });
    });
    let tot = pool.reduce((a, p) => a + p[1], 0), r = Math.random() * tot;
    for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
    return pool.length ? pool[pool.length - 1][0] : UNITS[0].items[0];
  }

  /* ctx: {kind:'ult'|'gate'|'shrine'|'seal'|'review'|'counter', units:[…], format:'auto'|'choice'|'build'|'type', canType:bool} */
  function next(ctx) {
    let units = ctx.units && ctx.units.length ? ctx.units : routeUnits();
    let weights = units.map((_, i) => i === 0 ? 1 : .55);
    const it = pickItem(units, { weights, notIds: ctx.notIds });
    const u = UNIT_BY_ID[it.id.split('.')[0]];
    const s = S().items[it.id];
    const box = s ? s.b || 1 : 0;
    let format = ctx.format || 'auto';
    const b = buildable(it), canType = ctx.canType && typeable(it);
    if (format === 'auto') {
      if (!s) format = 'choice';
      else if (box >= 3 && canType && (S().settings.writing || Math.random() < .35)) format = 'type';
      else if (box >= 2 && b && Math.random() < .6) format = 'build';
      else format = 'choice';
      if (S().settings.writing && canType && s && Math.random() < .6) format = 'type';
    }
    if (format === 'type' && !canType) format = b ? 'build' : 'choice';
    if (format === 'build' && !b) format = 'choice';
    const q = { item: it, unit: u, kind: ctx.kind, format, hint: false, startedAt: Date.now(), first: true };
    if (format === 'choice') {
      const order = shuffle([0, 1, 2, 3]);
      q.options = order.map(i => it[1][i]); q.correctIndex = order.indexOf(0);
    } else if (format === 'build') {
      q.build = b;
      const tiles = b.words.map(w => isProper(w) ? w : w.toLowerCase());
      // ficha trampa: una opción incorrecta de una sola palabra que no esté ya en la frase
      const trap = it[1].slice(1).find(o => !o.includes(' ') && o !== '—' && !tiles.includes(o.toLowerCase()));
      q.answerWords = tiles.slice();
      q.tiles = shuffle(tiles.concat(trap && Math.random() < .8 ? [trap.toLowerCase()] : []));
    }
    session.recent.push(it.id); if (session.recent.length > 10) session.recent.shift();
    return q;
  }

  /* ---------- corrección ---------- */
  function check(q, resp) {
    const it = q.item, ans = it[1][0];
    if (q.format === 'choice') {
      const ok = resp === q.correctIndex;
      return { verdict: ok ? 'correct' : 'wrong', given: q.options[resp] };
    }
    if (q.format === 'build') {
      const given = resp.join(' ');
      const ok = expand(given) === expand(q.answerWords.join(' '));
      return { verdict: ok ? 'correct' : 'wrong', given };
    }
    // escribir
    const g = expand(resp), a = expand(ans);
    if (!g) return { verdict: 'wrong', given: resp };
    if (g === a) return { verdict: 'correct', given: resp };
    // ¿escribió una de las opciones incorrectas? → gramática
    if (it[1].slice(1).some(o => expand(o) === g)) return { verdict: 'wrong', given: resp, why: 'grammar' };
    const gw = g.split(' '), aw = a.split(' ');
    if (gw.length === aw.length) {
      let spell = 0, gram = 0;
      for (let i = 0; i < gw.length; i++) {
        if (gw[i] === aw[i]) continue;
        if (morphological(gw[i], aw[i])) { gram++; continue; }
        const L = aw[i].length, d = lev(gw[i], aw[i]);
        if ((L >= 4 && d <= 1) || (L >= 8 && d <= 2)) spell++; else gram++;
      }
      if (!gram && spell) return { verdict: 'spelling', given: resp };
    }
    return { verdict: 'wrong', given: resp };
  }

  /* ---------- registro ---------- */
  function record(q, res) {
    const d = S(), it = q.item, id = it.id, uid = q.unit.id;
    const st = d.items[id] || (d.items[id] = { s: 0, f: -1, c: 0, w: 0, sp: 0, b: 1, t: 0 });
    const us = d.units[uid] || (d.units[uid] = { ep: 0, ok: 0, tot: 0 });
    st.s++; st.t = Date.now();
    if (st.f < 0) st.f = res.verdict === 'wrong' ? 0 : 1;
    let ep = 0;
    if (q.first) { session.firstTotal++; us.tot++; }
    session.asked++;
    if (res.verdict === 'correct') {
      st.c++; st.b = Math.min(5, (st.b || 1) + 1);
      if (q.first) {
        session.firstOk++; us.ok++; session.streak++; session.best = Math.max(session.best, session.streak);
        ep = 10 + Math.min(5, session.streak - 1) + (q.format === 'type' ? 4 : q.format === 'build' ? 2 : 0);
      } else ep = 3;
      for (const v of vocabRows(it)) if (d.tags[v[0]]) d.tags[v[0]] = Math.max(0, d.tags[v[0]] - 1);
    } else if (res.verdict === 'spelling') {
      st.sp++; session.spelling++; if (q.first) { session.firstOk++; us.ok++; }
      ep = 6; session.streak = 0;
    } else {
      st.w++; st.b = 1; session.grammar++; session.streak = 0;
      for (const v of vocabRows(it)) d.tags[v[0]] = Math.min(5, (d.tags[v[0]] || 0) + 1);
      session.missed.push({ id, sentence: fullSentence(it, it[1][0]), es: it[2], given: res.given, why: it[3] });
    }
    if (q.hint && ep > 0) { ep = Math.max(1, ep - 3); }
    d.ep += ep; us.ep += ep; session.ep += ep;
    d.history.push({ id, v: res.verdict[0], f: q.first ? 1 : 0, t: Date.now(), k: q.kind, fm: q.format[0] });
    if (d.history.length > 400) d.history.splice(0, d.history.length - 400);
    session.log.push({ id, verdict: res.verdict, first: q.first, kind: q.kind });
    Store.save();
    return { ep, streak: session.streak };
  }

  /* ---------- contenido para la explicación ---------- */
  function feedback(q, res) {
    const it = q.item, ans = it[1][0];
    const full = esc(it[0]).replace('___', `<mark>${esc(ans === '—' ? '∅' : ans)}</mark>`);
    return {
      verdict: res.verdict, given: res.given,
      sentence: full, plain: fullSentence(it, ans), es: it[2], why: it[3],
      vocab: vocabRows(it), verbs: verbRows(it), unit: q.unit,
      tip: q.unit.lesson.tip
    };
  }
  function accuracy() { return session.firstTotal ? session.firstOk / session.firstTotal : 0; }
  function unitStats(uid) { const u = S().units[uid] || { ep: 0, ok: 0, tot: 0 }; return { ep: u.ep, ok: u.ok, tot: u.tot, acc: u.tot ? u.ok / u.tot : 0, mastery: unitMastery(uid) }; }
  function weakItems(n = 12) {
    const st = S().items;
    return Object.keys(st).filter(id => ITEM_BY_ID[id] && st[id].w > 0 && st[id].b <= 2).sort((a, b) => (st[b].w - st[b].c * .5) - (st[a].w - st[a].c * .5)).slice(0, n).map(id => ITEM_BY_ID[id]);
  }
  return { session, resetSession, next, check, record, feedback, accuracy, unitStats, unitMastery, routeUnits, currentUnit, expand, fullSentence, vocabRows, verbRows, weakItems, buildable };
})();

/* ---------- voz (pronunciación) ---------- */
const Speech = (() => {
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en[-_]GB/i.test(v.lang) && /female|libby|sonia|serena|kate/i.test(v.name)) || vs.find(v => /en[-_](US|GB)/i.test(v.lang) && /natural|neural|google/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  return {
    available: () => 'speechSynthesis' in window,
    say(text, rate = .92) {
      try {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/—/g, ',').replace(/___/g, '...'));
        u.lang = voice ? voice.lang : 'en-GB'; if (voice) u.voice = voice;
        u.rate = rate; u.volume = (Store.data.settings.voice ?? .9) * (Store.data.settings.master ?? .8);
        speechSynthesis.speak(u);
      } catch (e) { }
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) { } }
  };
})();
