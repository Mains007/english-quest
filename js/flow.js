"use strict";
/* =====================================================================
   FLUJO DEL INGLÉS DENTRO DEL JUEGO
   Preguntas (sin límite de tiempo: el mundo se congela), ataques
   definitivos cinematográficos, sellos de jefe, tiempo detenido, remates,
   calentamiento previo, Wordlings y Runa del Asombro.
   ===================================================================== */
Object.assign(Game.prototype, {
  /* ---------- pregunta genérica ---------- */
  askQuestion(opt) {
    // opt: {kind, title, format, units, onResult(ok, res, q), canRetry}
    if (this.qActive) return; this.qActive = true;
    const canType = Input.device !== 'pad' || Store.data.settings.writing;
    const q = Learn.next({ kind: opt.kind, units: opt.units || this.units, format: opt.format || 'auto', canType });
    q.first = opt.first !== false;
    Sound.duck(true); this.prevTs = this.timeScale; this.timeScale = 0;
    this.lessonIfNew(q.unit, () => {
      UI.showQuestion(q, opt, (res) => {
        const rec = Learn.record(q, res);
        const ok = res.verdict !== 'wrong';
        this.answerFX(ok, res.verdict, rec);
        UI.showFeedback(q, res, rec, opt, () => {
          this.qActive = false; Sound.duck(false); this.timeScale = this.prevTs || 1;
          if (!ok) UI.pinNote(Learn.feedback(q, res));
          opt.onResult && opt.onResult(ok, res, q);
        });
      });
    });
  },
  lessonIfNew(unit, next) {
    const L = Store.data.lessons; if (L[unit.id]) return next();
    L[unit.id] = 1; Store.save(); UI.showLesson(unit, next, true);
  },
  answerFX(ok, verdict, rec) {
    const H = this.hero;
    if (ok) {
      Sound.play(verdict === 'spelling' ? 'spell' : 'correct'); FX.celebrate(H.x, H.y - 40); Input.rumble(.15, .6, 160); setTimeout(() => Input.rumble(.1, .5, 120), 200);
      const words = verdict === 'spelling' ? ['ALMOST!', 'NEARLY!'] : rec.streak >= 5 ? ['UNSTOPPABLE!', 'LEGENDARY!'] : rec.streak >= 3 ? ['ON FIRE!', 'BRILLIANT!'] : ['PERFECT!', 'GREAT!', 'CORRECT!', 'NICE!', 'AWESOME!'];
      FX.text(H.x, H.y - 130, pick(words), verdict === 'spelling' ? '#ffd27a' : '#ffe9a0', 54);
      if (rec.streak >= 2) { FX.text(H.x, H.y - 180, 'STREAK x' + rec.streak, '#ff9a40', 34); Sound.play('streak', rec.streak); }
      this.flashScreen([255, 230, 140], .3); H.addUlt(8);
    } else {
      Sound.play('wrong'); Input.rumble(.6, .2, 260); this.flashScreen([255, 60, 60], .25); this.shake(4, .2);
      FX.text(H.x, H.y - 130, pick(['OOPS!', 'NOT QUITE...', 'MISSED!']), '#ff8a8a', 44);
    }
  },
  /* ---------- PALABRA DE PODER (ataque definitivo) ---------- */
  ultReady() { Sound.play('ultCharge'); FX.text(this.hero.x, this.hero.y - 110, 'POWER WORD READY!', '#ffe080', 34); UI.toast('Power Word ready! Press R2 / U', '¡Palabra de Poder lista! Pulsa R2 / U', true); Input.rumble(.2, .4, 200); },
  requestUlt() {
    const H = this.hero;
    if (this.qActive || this.cinematic || H.dead) return;
    if (this.finisherTarget) { this.startFinisher(); return; }
    if (H.ultCd > 0) { UI.toast('Your runes are still broken... wait ' + Math.ceil(H.ultCd) + 's', 'Tus runas siguen rotas... espera ' + Math.ceil(H.ultCd) + ' s'); return; }
    if (H.ult < 100) { UI.toast('Charge the gold bar first: hit, parry, defeat enemies', 'Carga antes la barra dorada: golpea, para, derrota enemigos'); return; }
    // cámara lenta dramática antes de la pregunta
    this.cam.tz = 1.18; this.slow(.15, 99); Sound.play('ultCharge'); FX.runeBurst(H.x, H.y - 40, [255, 220, 120], 16); this.flashScreen([255, 230, 160], .3);
    setTimeout(() => {
      this.askQuestion({ kind: 'ult', title: 'POWER WORD · ' + WEAPONS[H.weapon].ult.toUpperCase(), onResult: (ok, res) => {
        this.cam.tz = 1; this.timeScale = 1; this.slowT = 0;
        if (ok) this.startUltCinematic(H.weapon, res.verdict === 'spelling' ? .7 : 1);
        else this.ultFizzle();
      } });
    }, 380);
  },
  ultFizzle() {
    const H = this.hero; H.ult = 30; H.ultCd = 8; H.exposed = 4;
    Sound.play('fizzle'); FX.sparks(H.x, H.y - 40, [255, 80, 80], 24, 0, 400); FX.text(H.x, H.y - 120, 'FIZZLE!', '#ff6a6a', 60);
    UI.toast('The Power Word failed! You are EXPOSED: no block, +60% damage for 4 s', '¡La Palabra de Poder falló! Estás EXPUESTO: sin bloqueo y +60 % de daño durante 4 s', true);
    this.shake(6, .3); Input.rumble(.8, .3, 300);
  },
  startUltCinematic(weapon, power) {
    const H = this.hero; H.ult = 0;
    const W = WEAPONS[weapon];
    this.cinematic = { type: weapon, t: 0, dur: { sword: 2.4, spear: 2.6, hammer: 2.8, gauntlet: 2.6 }[weapon], power, name: W.ult, worldTs: 0, hits: [], col: W.col };
    this.cam.tz = 1.25; Sound.play('ultFire'); Input.rumble(1, 1, 500); this.flashScreen([255, 255, 255], .8);
    UI.ultBanner(W.ult, W.name, W.col);
    // objetivos: todos los enemigos en pantalla
    const c = this.cam; this.cinematic.targets = this.enemies.filter(e => !e.dead && e.x > c.x - 40 && e.x < c.x + this.VW + 40);
  },
  updateCinematic(dt) {
    const C = this.cinematic, H = this.hero; C.t += dt; const k = C.t / C.dur;
    if (C.kind === 'timestop') return this.updateTimeStopFx(dt);
    if (C.type === 'sword') {
      if (C.t > .45 && !C.dash) { C.dash = 1; C.x0 = H.x; FX.afterimage(H.snapshot()); }
      if (C.t > .45 && C.t < 1.1) { const p = (C.t - .45) / .65; H.x = lerp(C.x0, C.x0 + H.face * 520, easeInOut(p)); if (chance(.9)) FX.afterimage(H.snapshot()); if (Math.floor(p * 7) > C.hits.length) { C.hits.push({ x: H.x, y: H.y - 40 - R(-60, 60), a: R(-1, 1), t: 0 }); Sound.play('swing', true); } }
      if (C.t > 1.4 && !C.boom) { C.boom = 1; this.ultDamage(150 * C.power); Sound.play('ultFire'); this.flashScreen([255, 255, 255], .9); this.shake(16, .6); for (const h of C.hits) FX.slam(h.x, h.y, .6); FX.text(H.x, H.y - 160, 'DAWN SLASH!', '#bff2ff', 80); }
    } else if (C.type === 'spear') {
      if (C.t < .5) H.y -= 300 * dt;
      if (C.t > .6 && C.t < 1.8 && chance(.7)) { const x = this.cam.x + R(40, this.VW - 40); C.hits.push({ x, y: this.cam.y - 40, vy: 1600, t: 0 }); }
      for (const s of C.hits) { s.y += s.vy * dt; if (!s.done && s.y > this.world.floorAt(s.x, s.y - 20)) { s.done = 1; FX.splash(s.x, s.y, 'water', 1); Sound.play('splash'); this.areaDamage(s.x, s.y - 20, 70, 0); } }
      if (C.t > 1.9 && !C.boom) { C.boom = 1; this.ultDamage(140 * C.power); this.flashScreen([150, 230, 255], .7); this.shake(12, .5); FX.text(H.x, H.y - 160, 'SPEAR DELUGE!', '#9be6ff', 76); }
    } else if (C.type === 'hammer') {
      if (C.t < .6) { H.y -= 900 * dt; }
      else if (C.t < 1.2) { if (!C.fall) { C.fall = 1; H.y = this.cam.y - 100; } H.y += 1600 * dt; FX.embers(H.x, H.y - 20, 4, 200); FX.smoke(H.x, H.y - 30, 1, [60, 40, 40], 14); const gy = this.world.floorAt(H.x, H.y - 40); if (H.y >= gy) { H.y = gy; } }
      if (C.t > 1.2 && !C.boom) { C.boom = 1; this.ultDamage(170 * C.power); FX.slam(H.x, H.y, 3); for (let i = 0; i < 8; i++) FX.slam(H.x + (i - 3.5) * 120, H.y, 1.2); Sound.play('slam', 2); this.shake(24, .9); this.flashScreen([255, 160, 60], .9); FX.text(H.x, H.y - 200, 'FORGED METEOR!', '#ffb040', 84); for (let i = 0; i < 6; i++) this.spawnFire(H.x + (i - 2.5) * 90, H.y, 60, 2); }
    } else if (C.type === 'gauntlet') {
      if (!C.order) { C.order = C.targets.slice(0, 8); C.i = 0; C.x0 = H.x; C.y0 = H.y; }
      const step = .18;
      if (C.t > .4 && C.i < C.order.length && C.t > .4 + C.i * step) { const e = C.order[C.i++]; FX.afterimage(H.snapshot()); this.lightning(H.x, H.y - 30, e.x, e.y - e.h / 2); H.x = e.x - H.face * 30; H.y = e.y; FX.hit(e.x, e.y - e.h / 2, H.face, [255, 240, 120], true); Sound.play('crit'); }
      if (C.t > .4 + Math.max(1, C.order.length) * step + .3 && !C.boom) { C.boom = 1; H.x = C.x0; H.y = C.y0; this.ultDamage(150 * C.power); this.flashScreen([255, 250, 160], .9); this.shake(14, .5); FX.text(H.x, H.y - 160, 'THOUSAND BOLTS!', '#ffef80', 76); }
    }
    if (C.t >= C.dur) { this.cinematic = null; this.cam.tz = 1; H.inv = .8; H.vy = 0; UI.ultBanner(null); }
  },
  ultDamage(dmg) {
    const C = this.cinematic, c = this.cam;
    for (const e of this.enemies) if (!e.dead && e.x > c.x - 60 && e.x < c.x + this.VW + 60) { e.inv = 0; e.hurt(dmg, Math.sign(e.x - this.hero.x) || 1, { kb: 500, up: true, heavy: true, armor: 3 }); }
    if (this.boss && !this.boss.dead && this.boss.st !== 'sealing') { const v = this.boss.vulnerable()[0]; this.boss.hurt(this.boss.maxHp * .1 * (C ? C.power : 1), 1, { x: this.boss.x, y: (this.boss.arena.floor) - 200, heavy: true }, { mul: 1 }); }
    for (const p of this.props) p.hit(60, Math.sign(p.x - this.hero.x) || 1, { kb: 600, up: true });
  },
  /* ---------- SELLO FINAL DEL JEFE ---------- */
  startSeal(boss) {
    const need = { relax: 2, normal: 3, hard: 4, night: 5 }[Store.data.settings.diff] || 3;
    this.seal = { boss, n: 5, need, i: 0, ok: 0, marks: [] };
    Sound.setMood('seal', { immediate: true }); this.shake(10, .6); this.slow(.3, 1.2);
    this.banner('FINAL SEAL', `Responde ${need} de 5 a la primera para derrotarlo`, '#ffe080', true);
    setTimeout(() => this.nextSealQuestion(), 2800);
  },
  nextSealQuestion() {
    const S = this.seal; if (!S) return;
    if (S.i >= S.n || S.ok >= S.need || S.n - S.i + S.ok < S.need) return this.endSeal(S.ok >= S.need);
    S.i++;
    this.askQuestion({ kind: 'seal', title: `FINAL SEAL ${S.i}/${S.n} · ${S.ok}/${S.need}`, seal: S, onResult: (ok) => {
      const H = this.hero, b = S.boss;
      S.marks.push(ok);
      if (ok) { S.ok++; this.sealStrike(b); }
      else { H.inv = 0; const dmg = Math.min(H.hp - 1, 18 * this.dmgMul()); if (dmg > 0) { H.hp -= dmg; FX.text(H.x, H.y - 80, '-' + Math.round(dmg), '#ff7b7b', 32, { comic: false }); } FX.hit(H.x, H.y - 30, -1, [255, 120, 110], true); Sound.play('hurt'); this.shake(10, .3); FX.text(b.x, (b.arena.floor) - 260, pick(['HA HA HA!', 'TOO SLOW!', 'WRONG!']), '#ff6a6a', 48); }
      UI.sealMarks(S);
      setTimeout(() => this.nextSealQuestion(), 1100);
    } });
  },
  sealStrike(b) {
    const H = this.hero, x = b.x + R(-60, 60), y = (b.arena.floor) - R(140, 300);
    H.vy = -500; FX.afterimage(H.snapshot()); FX.slam(x, y, 1.4); FX.hit(x, y, 1, [255, 240, 120], true); Sound.play('crit'); this.shake(14, .4); this.flashScreen([255, 255, 220], .5);
    FX.text(x, y - 60, pick(['SEALED!', 'SMASH!', 'POW!', 'KABOOM!']), '#ffe060', 60); b.flash = .2; Input.rumble(.9, .6, 250);
  },
  endSeal(pass) {
    const S = this.seal; this.seal = null; UI.sealMarks(null);
    if (pass) { S.boss.sealResult(true); }
    else { S.boss.sealResult(false); Sound.setMood('boss', { immediate: true }); this.banner('THE SEAL BROKE!', `Necesitabas ${S.need} aciertos a la primera. ¡Inténtalo otra vez!`, '#ff7a6a'); }
  },
  /* ---------- REMATE (élites como el Bruto: 2 de 3) ---------- */
  offerFinisher(e) {
    this.finisherTarget = e; this.finT = 4.5;
    UI.toast('FINISH HIM! Press R2 / U for an English finisher (2 of 3)', '¡REMÁTALO! Pulsa R2 / U para un remate en inglés (2 de 3)', true);
    const tick = () => { if (!this.finisherTarget) return; this.finT -= .1; if (this.finT <= 0 || e.dead || e.st !== 'staggered') { this.finisherTarget = null; return; } setTimeout(tick, 100); }; tick();
  },
  startFinisher() {
    const e = this.finisherTarget; this.finisherTarget = null; if (!e || e.dead) return;
    const need = e.sealsNeeded ? e.sealsNeeded[0] : 2, n = e.sealsNeeded ? e.sealsNeeded[1] : 3;
    const S = { n, need, i: 0, ok: 0, marks: [] }; this.cam.tz = 1.15;
    const ask = () => {
      if (S.i >= n || S.ok >= need || n - S.i + S.ok < need) { this.cam.tz = 1; UI.sealMarks(null); const pass = S.ok >= need; if (pass) { FX.text(e.x, e.y - 140, 'FINISHER!', '#ffe060', 70); this.shake(18, .6); } e.hurtFinisher(pass); return; }
      S.i++; this.askQuestion({ kind: 'finisher', title: `FINISHER ${S.i}/${n} · ${S.ok}/${need}`, seal: S, onResult: ok => { S.marks.push(ok); if (ok) { S.ok++; FX.slam(e.x, e.y - 40, 1); FX.hit(e.x, e.y - 50, 1, [255, 240, 120], true); Sound.play('crit'); this.shake(10, .3); } else { const H = this.hero; H.inv = 0; H.hurt(14, e.x, { unblockable: true }); } UI.sealMarks(S); setTimeout(ask, 900); } });
    };
    ask();
  },
  /* ---------- TIEMPO DETENIDO (Guardián Cronos) ---------- */
  timeStop(boss) {
    this.cinematic = { kind: 'timestop', t: 0, worldTs: 0, boss }; Sound.play('timeStop'); this.flashScreen([255, 250, 220], .7);
    this.banner('TIME STOP!', 'El tiempo se ha detenido. ¡Solo el inglés puede liberarte!', '#ffe9a0', true);
    setTimeout(() => this.askQuestion({ kind: 'timestop', title: 'BREAK THE TIME STOP', onResult: ok => { this.cinematic = null; Sound.play('timeResume'); boss.timeStopResult(ok); } }), 900);
  },
  updateTimeStopFx(dt) { },
  /* ---------- CALENTAMIENTO ANTES DEL NIVEL ---------- */
  startWarmup() {
    const studied = UNITS.filter(u => Store.data.lessons[u.id] && Learn.unitStats(u.id).tot > 0).map(u => u.id);
    const lvlUnit = UNIT_BY_ID[this.units[0]];
    this.buffs = { dmg: 1, hp: 0, flask: 0, ult: 0 };
    const go = () => {
      const pool = studied.length ? studied : [lvlUnit.id];
      UI.warmup(this, pool, results => this.applyWarmup(results, studied.length > 0));
    };
    if (!Store.data.lessons[lvlUnit.id]) { Store.data.lessons[lvlUnit.id] = 1; Store.save(); UI.showLesson(lvlUnit, go, true); }
    else go();
  },
  applyWarmup(results, real) {
    const H = this.hero; let ok = results.filter(Boolean).length, bad = results.length - ok;
    const out = [];
    if (!real) { out.push(['Warm-up done!', '¡Calentamiento hecho! (primera vez: sin penalización)']); }
    else {
      if (ok >= 1) { H.ult = Math.min(100, H.ult + 25); out.push(['+25% Power Word', '+25 % de Palabra de Poder']); }
      if (ok >= 2) { this.buffs.dmg = 1.15; out.push(['+15% damage', '+15 % de daño en este nivel']); }
      if (ok >= 3) { H.flasks++; H.maxFlasks++; out.push(['+1 light flask', '+1 frasco de luz']); }
      if (bad >= 1) { H.maxHp = Math.round(H.maxHp * .85); H.hp = Math.min(H.hp, H.maxHp); out.push(['-15% max health: you forgot something!', '−15 % de vida máxima: ¡has olvidado algo!']); }
      if (bad >= 2) { H.flasks = Math.max(1, H.flasks - 1); out.push(['-1 light flask', '−1 frasco de luz']); }
      if (bad >= 3) { this.buffs.fog = 1; out.push(['Mental fog: weaker runes', 'Niebla mental: runas más débiles']); }
    }
    UI.warmupResult(out, ok, results.length);
    this.banner(this.ref.secret ? SECRET_LEVELS[this.ref.secret].name : `${this.worldDef.en} · ${this.ref.idx}`, this.ref.secret ? 'Nivel secreto' : `${this.worldDef.name} · Nivel ${this.ref.idx}`, this.worldDef.col, true);
  },
  /* ---------- PREGUNTAS DE PERSONAJES (portal secreto) ---------- */
  npcQuiz(npc, n, done) {
    let i = 0, ok = 0;
    const ask = () => { if (i >= n) { done(ok >= n - 1); if (ok < n - 1) UI.toast('Try again later!', '¡Inténtalo más tarde! Necesitas ' + (n - 1) + ' aciertos.'); return; } i++; this.askQuestion({ kind: 'npc', title: npc.def.name.toUpperCase() + ` · ${i}/${n}`, onResult: r => { if (r) ok++; setTimeout(ask, 500); } }); };
    ask();
  },
  /* ---------- RUNA DEL ASOMBRO ---------- */
  startWonder(effect, x, y) {
    const W = WONDERS[effect]; this.effects[effect] = 20; Sound.play('ultFire'); this.flashScreen([255, 200, 255], .9); this.shake(10, .6);
    FX.celebrate(x, y); this.banner(W.name, W.es, '#ff9ae0', true);
    if (effect === 'giant') { this.hero.giant = 1; }
  },
  updateWonder(dt) {
    const E = this.effects, H = this.hero;
    for (const k in E) { E[k] -= dt; if (E[k] <= 0) { delete E[k]; if (k === 'giant') H.giant = 0; UI.toast('The wonder is over...', 'La maravilla ha terminado...'); } }
    if (E.giant) { H.w = 48; H.h = 116; if (H.onGround && Math.abs(H.vx) > 50 && chance(dt * 5)) { this.shake(5, .15); FX.land(H.x, H.y, 900); } for (const e of this.enemies) if (!e.dead && !e.heavy && overlap(e.hitbox(), { x: H.x - 24, y: H.y - 116, w: 48, h: 116 })) e.hurt(999, Math.sign(e.x - H.x), { kb: 600, up: true }); }
    else if (H) { H.w = 24; H.h = 58; }
    if (E.lowgrav && H && !H.onGround) H.vy -= 1300 * dt;
    if (E.lowgrav && chance(dt * 8)) { const c = new Coin(this, { x: this.cam.x + R(0, this.VW), y: this.cam.y - 20, vx: 0, vy: 0, free: true }); this.objects.push(c); }
  },
  /* ---------- WORDLINGS: golpea la palabra correcta ---------- */
  startWordBrawl(a) {
    a.round = 0; a.rounds = 2; this.nextWordRound(a);
    Sound.setMood('combat', { immediate: true });
    this.banner('WORD BRAWL!', 'Golpea al Wordling con la palabra correcta', '#9be6ff', true);
  },
  nextWordRound(a) {
    const q = Learn.next({ kind: 'brawl', units: this.units, format: 'choice' }); q.first = true; a.q = q; a.wrongHit = false;
    for (let i = 0; i < 4; i++) { const w = new Wordling(this, a.x0 + 140 + i * (a.x1 - a.x0 - 280) / 3, this.world.groundY(a.x0 + 140 + i * 150), { word: q.options[i], correct: i === q.correctIndex, arena: a }); this.enemies.push(w); }
    UI.brawlBanner(q, this);
  },
  wordHit(w) {
    const a = w.arena, q = a.q; if (!q || a.solved) return;
    if (w.correct) {
      a.solved = true; const res = { verdict: a.wrongHit ? 'wrong' : 'correct', given: w.word };
      q.first = true; const rec = Learn.record(q, a.wrongHit ? { verdict: 'wrong', given: a.wrongGiven } : res);
      if (!a.wrongHit) this.answerFX(true, 'correct', rec); else { Sound.play('correct'); UI.pinNote(Learn.feedback(q, { verdict: 'wrong', given: a.wrongGiven })); }
      FX.celebrate(w.x, w.y - 40); FX.text(w.x, w.y - 100, w.word.toUpperCase() + '!', '#9bffb0', 56);
      for (const e of this.enemies) if (e instanceof Wordling && e.arena === a && !e.dead) { e.die(); }
      UI.brawlBanner(null); a.round++;
      setTimeout(() => { a.solved = false; if (a.round < a.rounds) this.nextWordRound(a); else this.clearArena(a); }, 1400);
    } else {
      if (!a.wrongHit) { a.wrongHit = true; a.wrongGiven = w.word; Sound.play('wrong'); }
      FX.text(w.x, w.y - 80, 'WRONG WORD!', '#ff8a8a', 34);
      // la palabra equivocada se divide
      if (this.enemies.filter(e => e instanceof Wordling && !e.dead).length < 9) { const c = new Wordling(this, w.x + 20, w.y, { word: w.word, correct: false, arena: a, angry: true }); c.vx = 200; c.vy = -400; this.enemies.push(c); w.angry = true; }
    }
  },
  updateWordBrawl(a) { }
});

/* ---------- Wordling (minion de palabras) ---------- */
class Wordling extends Enemy {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 34, h: 40, hp: 9999, maxHp: 9999, contact: 6, col: [60, 60, 90], coins: 1 }, o)); this.set('hop'); this.hue = R(0, 360); }
  ai(dt) { const spd = this.angry ? 1.6 : 1; if (this.onGround && this.stT > R(.5, 1.1) / spd) { this.facePlayer(); this.vy = -R(300, 480); this.vx = this.face * R(60, 200) * spd; this.stT = 0; } if (this.onGround) this.vx *= .85; }
  hurt(dmg, dir, info) { if (this.inv > 0 || this.dead) return false; this.inv = .4; this.flash = .15; this.vx = dir * 260; this.vy = -300; FX.hit(this.x, this.y - 20, dir); Sound.play('hit'); this.game.wordHit(this); return true; }
  attackBoxes() { return []; }
  die() { if (this.dead) return; this.dead = true; FX.spawnRaw({ t: 'flash', x: this.x, y: this.y - 20, max: .2, s: 40, col: [200, 220, 255], add: 1 }); for (let i = 0; i < 12; i++) FX.spawnRaw({ t: 'drop', x: this.x, y: this.y - 20, vx: R(-200, 200), vy: R(-300, -50), g: 800, max: .6, s: 3, col: [40, 40, 70] }); }
  draw(g) {
    const ff = this.flash > 0, t = this.t, sq = this.onGround ? 1 + Math.sin(t * 10) * .04 : 1.12;
    g.save(); g.translate(this.x, this.y); g.scale(2 - sq, sq);
    g.fillStyle = ff ? '#fff' : this.angry ? '#5a1a2a' : '#22223a'; g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-20, -30, 0, -34); g.quadraticCurveTo(20, -30, 16, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.ellipse(-6, -24, 5, 3, -.4, 0, TAU); g.fill();
    eyes(g, this.face * 2, -18, 3, '#111', this.face, this.angry);
    g.restore();
    // cartel con la palabra
    g.save(); g.translate(this.x, this.y - 58 + Math.sin(t * 3) * 2);
    g.font = '700 20px "Alegreya Sans", sans-serif'; const w = Math.max(44, g.measureText(this.word).width + 18);
    g.fillStyle = this.angry ? '#ffd0d0' : '#fff8e8'; g.strokeStyle = '#2a1a10'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(-w / 2, -16, w, 30, 7); g.fill(); g.stroke();
    g.fillStyle = '#1a1020'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.word, 0, 0);
    g.strokeStyle = '#2a1a10'; g.beginPath(); g.moveTo(0, 14); g.lineTo(0, 26); g.stroke();
    g.restore();
  }
}
