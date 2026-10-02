"use strict";
/* =====================================================================
   AUDIO — música adaptativa y efectos 100% sintetizados (Web Audio)
   Instrumentos: cuerdas, violín solista, coro, piano, arpa, flauta, metales,
   guitarra distorsionada, bajo, sintetizador, batería, taiko, timbales.
   La música se compone sobre la marcha (motivos, variaciones, contracanto,
   pasajes tranquilos) y cambia de ánimo: exploración → peligro → combate → jefe.
   ===================================================================== */
const Sound = (() => {
  let ctx = null, master, comp, musicBus, musicFilter, musicDuck, sfxBus, reverb, revIn, noiseBuf, distCurve;
  let started = false;
  const vol = { master: .8, music: .65, sfx: .8 };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = .005; comp.release.value = .2;
    master = ctx.createGain(); master.gain.value = vol.master; master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = vol.music;
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 20000; musicFilter.Q.value = .6;
    musicDuck = ctx.createGain(); musicDuck.gain.value = 1;
    const eqLo = ctx.createBiquadFilter(); eqLo.type = 'lowshelf'; eqLo.frequency.value = 90; eqLo.gain.value = -3.5; const eqHi = ctx.createBiquadFilter(); eqHi.type = 'highshelf'; eqHi.frequency.value = 5000; eqHi.gain.value = 4; const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 2200; eqMid.Q.value = .8; eqMid.gain.value = 3.5; const eqMud = ctx.createBiquadFilter(); eqMud.type = 'peaking'; eqMud.frequency.value = 180; eqMud.Q.value = 1; eqMud.gain.value = -2.5;
    musicBus.connect(eqLo); eqLo.connect(eqMud); eqMud.connect(eqMid); eqMid.connect(eqHi); eqHi.connect(musicFilter); musicFilter.connect(musicDuck); musicDuck.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    reverb = ctx.createConvolver(); reverb.buffer = makeIR(4.2, 2.8);
    revIn = ctx.createGain(); revIn.gain.value = .32; revIn.connect(reverb); const revOut = ctx.createGain(); revOut.gain.value = .9; const revTone = ctx.createBiquadFilter(); revTone.type = 'lowpass'; revTone.frequency.value = 5200; reverb.connect(revTone); revTone.connect(revOut); revOut.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    distCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; distCurve[i] = Math.tanh(x * 9) * .9; }
    started = true;
    if (typeof Sampler !== 'undefined') Sampler.load(ctx);
  }
  function makeIR(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1); }
    return b;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const now = () => ctx ? ctx.currentTime : 0;

  /* ---------- bloques básicos ---------- */
  function env(param, t, a, peak, d, sus, rel, dur) {
    param.cancelScheduledValues(t); param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + a);
    param.linearRampToValueAtTime(peak * sus, t + a + d);
    param.setValueAtTime(peak * sus, t + Math.max(a + d, dur));
    param.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + rel);
  }
  function out(node, dest, rev, pan) {
    let n = node;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(dest); if (rev) { const s = ctx.createGain(); s.gain.value = rev; n.connect(s); s.connect(revIn); }
  }
  function noise(t, dur, dest, f, type = 'bandpass', q = 1, gain = .5, a = .002, rel = .1, rev = 0, fEnd) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (fEnd) fl.frequency.exponentialRampToValueAtTime(fEnd, t + dur); fl.Q.value = q;
    const g = ctx.createGain(); env(g.gain, t, a, gain, dur * .3, .4, rel, dur);
    s.connect(fl); fl.connect(g); out(g, dest, rev);
    s.start(t, Math.random()); s.stop(t + dur + rel + .05);
  }
  function tone(t, freq, dur, dest, o = {}) {
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t);
    if (o.fEnd) osc.frequency.exponentialRampToValueAtTime(o.fEnd, t + (o.fT || dur));
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain(); env(g.gain, t, o.a ?? .005, o.gain ?? .3, o.d ?? .05, o.s ?? .6, o.r ?? .1, dur);
    let n = osc;
    if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.value = o.ff || 2000; f.Q.value = o.fq || 1; osc.connect(f); n = f; }
    n.connect(g); out(g, dest, o.rev, o.pan);
    osc.start(t); osc.stop(t + dur + (o.r ?? .1) + .05);
    return osc;
  }
  function vibrato(osc, t, rate, cents, delay) {
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(cents, t + delay + .3);
    l.connect(lg); lg.connect(osc.detune); l.start(t); return l;
  }

  /* ---------- instrumentos ---------- */
  // amplificadores persistentes (la distorsión se aplica al ACORDE entero, como una guitarra real)
  let AMP = null;
  function amps() {
    if (AMP) return AMP;
    const mkAmp = (pan, drive, tone, lead) => {
      const inp = ctx.createGain(); inp.gain.value = 1;
      const pre = ctx.createBiquadFilter(); pre.type = 'highpass'; pre.frequency.value = lead ? 160 : 110;
      const tight = ctx.createBiquadFilter(); tight.type = 'peaking'; tight.frequency.value = 800; tight.gain.value = lead ? 6 : 3; tight.Q.value = .8;
      const drv = ctx.createGain(); drv.gain.value = drive;
      const ws = ctx.createWaveShaper(); const c = new Float32Array(2048); for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; c[i] = Math.tanh(x * 3) * .7 + Math.tanh(x * 14) * .3; } ws.curve = c; ws.oversample = '4x';
      const cab1 = ctx.createBiquadFilter(); cab1.type = 'lowpass'; cab1.frequency.value = tone; cab1.Q.value = .9;
      const cab2 = ctx.createBiquadFilter(); cab2.type = 'peaking'; cab2.frequency.value = 2400; cab2.gain.value = 4; cab2.Q.value = 1.2;
      const scoop = ctx.createBiquadFilter(); scoop.type = 'peaking'; scoop.frequency.value = 420; scoop.gain.value = lead ? -2 : -5; scoop.Q.value = 1;
      const cab3 = ctx.createBiquadFilter(); cab3.type = 'lowpass'; cab3.frequency.value = tone * 1.6; cab3.Q.value = .5;
      const o = ctx.createGain(); o.gain.value = lead ? .1 : .085; const p = ctx.createStereoPanner(); p.pan.value = pan;
      inp.connect(pre); pre.connect(tight); tight.connect(drv); drv.connect(ws); ws.connect(cab1); cab1.connect(cab2); cab2.connect(scoop); scoop.connect(cab3); cab3.connect(o); o.connect(p); p.connect(musicBus);
      const s = ctx.createGain(); s.gain.value = lead ? .35 : .12; o.connect(s); s.connect(revIn);
      return inp;
    };
    AMP = { L: mkAmp(-.75, 9, 4400), R: mkAmp(.75, 9, 4200), lead: mkAmp(.08, 14, 5000, true) };
    return AMP;
  }
  const I = {
    strings(t, m, dur, v, dest, o = {}) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200 + v * 2800; f.Q.value = .6;
      const g = ctx.createGain(); env(g.gain, t, o.a ?? .3, .055 * v, .2, .9, o.r ?? .6, dur);
      f.connect(g); out(g, dest, .6, o.pan);
      for (const dt of [-13, -5, 4, 12]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = mtof(m); osc.detune.value = dt; const l = vibrato(osc, t, 4.6 + Math.random() * 1.4, 8, .3); osc.connect(f); osc.start(t); osc.stop(t + dur + 1.2); l.stop(t + dur + 1.2); }
    },
    spicc(t, m, v, dest, pan = 0) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200 + v * 1500, t); f.frequency.exponentialRampToValueAtTime(900, t + .12); f.Q.value = .8;
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.085 * v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
      f.connect(g); out(g, dest, .4, pan);
      for (const dt of [-8, 6]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = mtof(m); osc.detune.value = dt; osc.connect(f); osc.start(t); osc.stop(t + .2); }
      noise(t, .03, dest, 3500, 'bandpass', 2, .03 * v, .001, .02);
    },
    stacc(t, m, dur, v, dest) { I.spicc(t, m, v, dest); },
    trem(t, m, dur, v, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
      const g = ctx.createGain(); env(g.gain, t, .15, .05 * v, .1, 1, .4, dur);
      const am = ctx.createGain(); am.gain.value = .55; const l = ctx.createOscillator(); l.frequency.value = 12; const lg = ctx.createGain(); lg.gain.value = .45; l.connect(lg); lg.connect(am.gain);
      f.connect(am); am.connect(g); out(g, dest, .55);
      for (const dt of [-7, 7]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = mtof(m); osc.detune.value = dt; osc.connect(f); osc.start(t); osc.stop(t + dur + .6); }
      l.start(t); l.stop(t + dur + .6);
    },
    violin(t, m, dur, v, dest, o = {}) {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(mtof(o.from ?? m), t); if (o.from !== undefined && o.from !== m) osc.frequency.exponentialRampToValueAtTime(mtof(m), t + .08);
      const l = vibrato(osc, t, 5.4, 20, .22);
      const f1 = ctx.createBiquadFilter(); f1.type = 'peaking'; f1.frequency.value = 2800; f1.gain.value = 6; f1.Q.value = 1.3;
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.dark ? 2200 : 5000;
      const g = ctx.createGain(); env(g.gain, t, o.a ?? .09, .1 * v, .15, .85, .45, dur);
      osc.connect(f1); f1.connect(f2); f2.connect(g); out(g, dest, .65, o.pan ?? .12);
      osc.start(t); osc.stop(t + dur + .6); l.stop(t + dur + .6);
    },
    duduk(t, m, dur, v, dest, o = {}) { I.violin(t, m, dur, v * 1.1, dest, Object.assign({ dark: true, a: .12 }, o)); },
    cello(t, m, dur, v, dest, o = {}) {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(mtof(o.from !== undefined ? o.from - 12 : m), t); osc.frequency.setValueAtTime(mtof(m), t + .06); const l = vibrato(osc, t, 5, 12, .3);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1300; const g = ctx.createGain(); env(g.gain, t, .14, .12 * v, .2, .85, .5, dur);
      osc.connect(f); f.connect(g); out(g, dest, .45, -.15); osc.start(t); osc.stop(t + dur + .7); l.stop(t + dur + .7);
    },
    contra(t, m, dur, v, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = ctx.createGain(); env(g.gain, t, .06, .16 * v, .2, .8, .3, dur);
      f.connect(g); out(g, dest, .3); for (const dt of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + .4); }
    },
    choir(t, m, dur, v, dest, o = {}) {
      const vowel = o.vowel || 'a', F = { a: [760, 1150, 2500], o: [560, 850, 2400], u: [320, 800, 2250], e: [500, 1800, 2500] }[vowel];
      const g = ctx.createGain(); env(g.gain, t, o.a ?? .45, .17 * v, .3, .9, .8, dur); out(g, dest, .85, o.pan);
      const mix = ctx.createGain();
      F.forEach((fr, k) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = 8; const bg = ctx.createGain(); bg.gain.value = [1, .55, .22][k]; mix.connect(bp); bp.connect(bg); bg.connect(g); });
      for (const dt of [-16, -6, 5, 15]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = mtof(m); osc.detune.value = dt; const l = vibrato(osc, t, 4.4 + Math.random(), 13, .25); osc.connect(mix); osc.start(t); osc.stop(t + dur + 1.2); l.stop(t + dur + 1.2); }
    },
    piano(t, m, dur, v, dest, o = {}) {
      const f = mtof(m), d = Math.min(3.6, .9 + dur * 1.6), br = m > 72 ? .7 : 1;
      [[1, .5], [2, .2 * br], [3, .09 * br], [4.02, .04 * br], [5.03, .02]].forEach(([h, a]) => { const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f * h; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a * .17 * v, t + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + d / h ** .55); osc.connect(g); out(g, dest, .5, o.pan ?? (m - 64) / 60); osc.start(t); osc.stop(t + d + .1); });
      noise(t, .02, dest, 2500 + m * 20, 'bandpass', 2, .04 * v, .001, .02);
    },
    harp(t, m, dur, v, dest, o = {}) {
      const f = mtof(m);
      [[1, .5, 'triangle'], [2, .15, 'sine']].forEach(([h, a, ty]) => { const osc = ctx.createOscillator(); osc.type = ty; osc.frequency.value = f * h; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a * .2 * v, t + .003); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); osc.connect(g); out(g, dest, .55, o.pan ?? -.25); osc.start(t); osc.stop(t + 1.5); });
    },
    oud(t, m, dur, v, dest) {
      const f = mtof(m), osc = ctx.createOscillator(), o2 = ctx.createOscillator(); osc.type = 'sawtooth'; o2.type = 'triangle'; osc.frequency.setValueAtTime(f * 1.02, t); osc.frequency.exponentialRampToValueAtTime(f, t + .03); o2.frequency.value = f * 2;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f * 4, t); bp.frequency.exponentialRampToValueAtTime(f * 1.5, t + .4); bp.Q.value = 1.6;
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.22 * v, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .7);
      osc.connect(bp); o2.connect(bp); bp.connect(g); out(g, dest, .45, -.3); osc.start(t); o2.start(t); osc.stop(t + .75); o2.stop(t + .75);
    },
    bell(t, m, dur, v, dest) {
      const f = mtof(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
      car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.5);
      mod.connect(mg); mg.connect(car.frequency); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.09 * v, t + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
      car.connect(g); out(g, dest, .7, .25); car.start(t); mod.start(t); car.stop(t + 2.1); mod.stop(t + 2.1);
    },
    flute(t, m, dur, v, dest, o = {}) {
      const osc = tone(t, mtof(m), dur, dest, { type: 'sine', a: .07, gain: .13 * v, d: .1, s: .85, r: .25, rev: .55, pan: .2 });
      if (o.from !== undefined && o.from !== m) { osc.frequency.setValueAtTime(mtof(o.from), t); osc.frequency.exponentialRampToValueAtTime(mtof(m), t + .06); }
      vibrato(osc, t, 5.2, 16, .2).stop(t + dur + .4);
      noise(t, dur, dest, mtof(m) * 2, 'bandpass', 6, .025 * v, .05, .15, .3);
    },
    // sección de metales: florece (filtro que se abre) como unas trompas reales
    brass(t, m, dur, v, dest, o = {}) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; const top = (o.soft ? 900 : 1600) + v * (o.soft ? 900 : 2600);
      f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(top, t + (o.sfz ? .05 : .16)); f.frequency.linearRampToValueAtTime(top * (o.sfz ? .45 : .75), t + .6); f.Q.value = 1.2;
      const g = ctx.createGain(); env(g.gain, t, o.sfz ? .015 : .06, .12 * v, o.sfz ? .25 : .25, o.sfz ? .35 : .8, .3, dur);
      f.connect(g); out(g, dest, .55, o.pan);
      for (const dt of [-11, -3, 4, 12]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(mtof(o.from ?? m) * Math.pow(2, -.4 / 12), t); osc.frequency.linearRampToValueAtTime(mtof(m), t + .05); osc.detune.value = dt; const l = vibrato(osc, t, 4.8, 6, .35); osc.connect(f); osc.start(t); osc.stop(t + dur + .5); l.stop(t + dur + .5); }
    },
    horn(t, m, dur, v, dest, o = {}) { I.brass(t, m, dur, v, dest, Object.assign({ soft: true }, o)); },
    braam(t, m, dur, v, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(160, t); f.frequency.linearRampToValueAtTime(1100 * v, t + .25); f.frequency.exponentialRampToValueAtTime(240, t + dur); f.Q.value = 2;
      const ws = ctx.createWaveShaper(); ws.curve = distCurve; const pg = ctx.createGain(); pg.gain.value = .35;
      const g = ctx.createGain(); env(g.gain, t, .03, .2 * v, .3, .7, .6, dur);
      pg.connect(ws); ws.connect(f); f.connect(g); out(g, dest, .6);
      for (const [mm, dt] of [[m, -9], [m, 9], [m - 12, 0], [m + 7, 4]]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(mm); o.detune.value = dt; o.connect(pg); o.start(t); o.stop(t + dur + .7); }
      tone(t, mtof(m - 12), dur, dest, { type: 'sine', gain: .25 * v, a: .02, d: .2, s: .7, r: .5 });
    },
    // guitarra rítmica: acorde de quinta (raíz + 5ª + 8ª) en doble pista L/R
    gtr(t, m, dur, v, dest, o = {}) {
      const A = amps(), d = o.mute ? Math.min(dur, .11) : dur;
      for (const [side, off, dtb] of [['L', 0, -6], ['R', .009, 7]]) {
        const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t + off); g.gain.linearRampToValueAtTime((o.mute ? .55 : .8) * v, t + off + .004); g.gain.setValueAtTime((o.mute ? .3 : .6) * v, t + off + Math.min(.08, d)); g.gain.exponentialRampToValueAtTime(.0001, t + off + d + (o.mute ? .04 : .18));
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.mute ? 520 : 2400; lp.connect(g); g.connect(A[side]);
        for (const iv of o.single ? [0] : [0, 7, 12]) { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = mtof(m + iv); osc.detune.value = dtb + iv * .3; osc.connect(lp); osc.start(t + off); osc.stop(t + off + d + .25); }
      }
    },
    guitar(t, m, dur, v, dest, o = {}) { I.gtr(t, m, dur, v, dest, o); },
    // guitarra solista con vibrato y deslizamiento
    leadGtr(t, m, dur, v, dest, o = {}) {
      const A = amps(), osc = ctx.createOscillator(), o2 = ctx.createOscillator(); osc.type = 'sawtooth'; o2.type = 'square';
      const from = o.from !== undefined && Math.abs(o.from - m) <= 7 ? o.from : m;
      osc.frequency.setValueAtTime(mtof(from), t); osc.frequency.exponentialRampToValueAtTime(mtof(m), t + .05); o2.frequency.setValueAtTime(mtof(from) * 1.002, t); o2.frequency.exponentialRampToValueAtTime(mtof(m) * 1.002, t + .05);
      const l = vibrato(osc, t, 5.8, dur > .4 ? 30 : 0, .2), l2 = vibrato(o2, t, 5.8, dur > .4 ? 30 : 0, .2);
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.5 * v, t + .01); g.gain.setValueAtTime(.42 * v, t + dur * .9); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .15);
      const mix = ctx.createGain(); mix.gain.value = 1; osc.connect(mix); const g2 = ctx.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(mix); mix.connect(g); g.connect(A.lead);
      for (const n of [osc, o2, l, l2]) { n.start && 0; } osc.start(t); o2.start(t); osc.stop(t + dur + .2); o2.stop(t + dur + .2); l.stop(t + dur + .2); l2.stop(t + dur + .2);
    },
    bass(t, m, dur, v, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(320, t + .18); f.Q.value = 1.5;
      const g = ctx.createGain(); env(g.gain, t, .004, .22 * v, .1, .7, .07, dur);
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = mtof(m); const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(m - 12);
      const g2 = ctx.createGain(); g2.gain.value = .55; o1.connect(f); o2.connect(g2); g2.connect(g); f.connect(g); out(g, dest, .04); o1.start(t); o2.start(t); o1.stop(t + dur + .2); o2.stop(t + dur + .2);
    },
    pizz(t, m, dur, v, dest) { tone(t, mtof(m), .25, dest, { type: 'triangle', a: .003, gain: .22 * v, d: .08, s: .15, r: .2, rev: .35, filter: 'lowpass', ff: 1400 }); },
    arp(t, m, dur, v, dest) { tone(t, mtof(m), Math.min(dur, .12), dest, { type: 'square', a: .003, gain: .045 * v, d: .05, s: .3, r: .06, rev: .25, filter: 'lowpass', ff: 2600, pan: .3 }); },
    pad(t, m, dur, v, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 850; const g = ctx.createGain(); env(g.gain, t, .9, .05 * v, .5, 1, 1.4, dur);
      f.connect(g); out(g, dest, .85); for (const dt of [-14, 0, 13]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + 1.6); }
    },
    /* percusión */
    kick(t, v, dest) { tone(t, 140, .3, dest, { fEnd: 50, fT: .09, gain: .85 * v, a: .001, d: .1, s: .35, r: .15 }); noise(t, .012, dest, 3500, 'highpass', 1, .25 * v, .001, .01); },
    snare(t, v, dest) { noise(t, .16, dest, 1800, 'bandpass', .7, .65 * v, .001, .16, .35); noise(t, .05, dest, 5000, 'highpass', .7, .3 * v, .001, .05, .2); tone(t, 210, .09, dest, { type: 'triangle', fEnd: 160, gain: .38 * v, a: .001, d: .05, s: .2, r: .05 }); },
    hat(t, v, dest, open) { noise(t, open ? .22 : .03, dest, 8500, 'highpass', 1, .2 * v, .001, open ? .16 : .03); },
    ride(t, v, dest) { noise(t, .35, dest, 6500, 'bandpass', 3, .1 * v, .001, .35, .2); tone(t, 3200, .3, dest, { type: 'sine', gain: .015 * v, r: .3 }); },
    shaker(t, v, dest) { noise(t, .05, dest, 6000, 'bandpass', 2, .08 * v, .02, .03); },
    tom(t, v, dest, m = 45) { tone(t, mtof(m), .32, dest, { fEnd: mtof(m - 5), gain: .55 * v, a: .002, d: .1, s: .3, r: .22, rev: .25 }); noise(t, .03, dest, 900, 'lowpass', 1, .15 * v, .001, .03); },
    frame(t, v, dest, hi) { tone(t, hi ? 260 : 120, .2, dest, { fEnd: hi ? 200 : 80, gain: .35 * v, a: .001, d: .06, s: .2, r: .15, rev: .3 }); noise(t, .05, dest, hi ? 2400 : 900, 'bandpass', 1.5, .2 * v, .001, .05, .3); },
    taiko(t, v, dest) { for (const [off, k] of [[0, 1], [.012, .6]]) tone(t + off, 92, .8, dest, { fEnd: 52, fT: .3, gain: .8 * v * k, a: .002, d: .2, s: .3, r: .45, rev: .6 }); noise(t, .09, dest, 380, 'lowpass', 1, .45 * v, .001, .12, .5); },
    crash(t, v, dest) { noise(t, 1.8, dest, 5200, 'highpass', .7, .22 * v, .002, 1.4, .5); noise(t, .4, dest, 3000, 'bandpass', 1, .1 * v, .002, .4, .3); },
    swell(t, v, dest, dur = 1.5) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2 * v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .05); s.connect(f); f.connect(g); out(g, dest, .5); s.start(t); s.stop(t + dur + .1); },
    timp(t, v, dest, m = 38) { tone(t, mtof(m), .9, dest, { fEnd: mtof(m) * .95, gain: .6 * v, a: .003, d: .2, s: .3, r: .55, rev: .55 }); noise(t, .05, dest, 300, 'lowpass', 1, .2 * v, .001, .08); },
    timpRoll(t, dur, v, dest, m = 38) { const n = Math.floor(dur / .055); for (let i = 0; i < n; i++) { const k = i / n; tone(t + i * .055, mtof(m), .12, dest, { gain: (.12 + .5 * k * k) * v, a: .002, d: .05, s: .3, r: .1, rev: .5 }); } },
    heart(t, v, dest) { tone(t, 60, .2, dest, { fEnd: 40, gain: .7 * v, a: .002, d: .08, s: .2, r: .1 }); tone(t + .18, 55, .2, dest, { fEnd: 38, gain: .5 * v, a: .002, d: .08, s: .2, r: .1 }); }
  };

  /* ---------- instrumentos con grabaciones reales (sampler.js) ---------- */
  const I0 = Object.assign({}, I);
  const SM = typeof Sampler !== 'undefined' ? Sampler : null;
  const smOn = () => SM && SM.ready;
  function sn(k, t, m, dur, v, dest, o = {}) { const r = SM.note(ctx, k, t, m, dur, v, dest, o); if (r) out(r.g, dest, o.rev ?? .35, o.pan); return r; }
  function dr(d, t, v, dest, o = {}) { const g = SM.drum(ctx, d, t, v, dest, o); if (g) out(g, dest, o.rev ?? .12, o.pan); }
  function vib(src, t, rate, cents, delay, dur) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(cents, t + delay + .3); l.connect(lg); lg.connect(src.detune); l.start(t); l.stop(t + dur + .6); }
  const wrap = (name, fn) => { const f0 = I[name]; I[name] = function (...a) { return smOn() ? fn(...a) : f0(...a); }; };
  wrap('strings', (t, m, dur, v, dest, o = {}) => sn('strings', t, m, dur, v, dest, { a: o.a ?? .25, r: o.r ?? .7, rev: .55, pan: o.pan }));
  wrap('spicc', (t, m, v, dest, pan = 0) => sn(m >= 55 ? 'violin' : 'cello', t, m, .1, v * 1.1, dest, { short: true, a: .004, r: .09, rev: .35, pan }));
  wrap('trem', (t, m, dur, v, dest) => sn('trem', t, m, dur, v, dest, { a: .15, r: .5, rev: .5 }));
  wrap('violin', (t, m, dur, v, dest, o = {}) => { const r = sn('violin', t, m, dur, v, dest, { from: o.from, a: o.a ?? .06, r: .4, rev: .6, pan: o.pan ?? .12, lp: o.dark ? 2600 : undefined }); if (r && dur > .35) vib(r.src, t, 5.4, 14, .25, dur); return r; });
  wrap('duduk', (t, m, dur, v, dest, o = {}) => { const r = sn('oboe', t, m, dur, v, dest, { from: o.from, glide: .12, a: .08, r: .4, rev: .6, pan: .1 }); if (r && dur > .35) vib(r.src, t, 5, 18, .25, dur); });
  wrap('cello', (t, m, dur, v, dest, o = {}) => { const r = sn('cello', t, m, dur, v, dest, { from: o.from !== undefined ? o.from - 12 : undefined, a: .08, r: .5, rev: .5, pan: -.15 }); if (r && dur > .35) vib(r.src, t, 5, 12, .3, dur); });
  wrap('contra', (t, m, dur, v, dest) => sn('contrabass', t, m, dur, v, dest, { a: .05, r: .4, rev: .3 }));
  wrap('choir', (t, m, dur, v, dest, o = {}) => sn('choir', t, m, dur, v, dest, { a: o.a ?? .35, r: .8, rev: .8, pan: o.pan, lp: o.vowel === 'u' ? 1400 : o.vowel === 'o' ? 2400 : undefined }));
  wrap('piano', (t, m, dur, v, dest, o = {}) => sn('piano', t, m, Math.max(dur, .3), v, dest, { r: .6, rev: .45, pan: o.pan ?? (m - 64) / 60 }));
  wrap('harp', (t, m, dur, v, dest, o = {}) => sn('harp', t, m, Math.max(dur, .5), v, dest, { r: .8, rev: .55, pan: o.pan ?? -.25 }));
  wrap('oud', (t, m, dur, v, dest) => sn('nylon', t, m, Math.max(dur, .35), v, dest, { from: m + 1, glide: .05, r: .4, rev: .45, pan: -.3 }));
  wrap('bell', (t, m, dur, v, dest) => sn('celesta', t, Math.min(m, 96), 1.2, v, dest, { r: 1, rev: .7, pan: .25 }));
  wrap('flute', (t, m, dur, v, dest, o = {}) => { const r = sn('flute', t, m, dur, v, dest, { from: o.from, a: .05, r: .35, rev: .55, pan: .2 }); if (r && dur > .35) vib(r.src, t, 5.2, 12, .25, dur); });
  wrap('brass', (t, m, dur, v, dest, o = {}) => { const k = o.soft ? 'horn' : (m >= 64 ? 'trumpet' : 'brass'); sn(k, t, m, dur, v * (o.sfz ? 1.1 : 1), dest, { from: o.from, a: o.sfz ? .01 : .05, r: o.sfz ? .2 : .4, rev: .55, pan: o.pan, decay: o.sfz ? .45 : undefined, lp: 1800 + v * 5000 }); });
  wrap('horn', (t, m, dur, v, dest, o = {}) => sn('horn', t, m, dur, v, dest, { from: o.from, a: .08, r: .5, rev: .6, pan: o.pan }));
  wrap('braam', (t, m, dur, v, dest) => { sn('trombone', t, m, dur, v * 1.1, dest, { a: .03, r: .6, rev: .6, pan: -.2 }); sn('tuba', t, m - 12, dur, v, dest, { a: .03, r: .6, rev: .5, pan: .2 }); I0.braam(t, m, dur, v * .35, dest); });
  wrap('gtr', (t, m, dur, v, dest, o = {}) => { const d = o.mute ? Math.min(dur, .1) : dur; for (const [pan, off, dt] of [[-.75, 0, -7], [.75, .009, 6]]) for (const iv of o.single ? [0] : [0, 7, 12]) sn('dgtr', t + off, m + iv, d, v * (o.mute ? .85 : 1), dest, { short: true, detune: dt, a: .003, r: o.mute ? .05 : .15, rev: .12, pan, lp: o.mute ? 1300 : undefined }); });
  wrap('guitar', (...a) => I.gtr(...a));
  wrap('leadGtr', (t, m, dur, v, dest, o = {}) => { const r = sn('ogtr', t, m, dur, v, dest, { from: o.from, glide: .06, a: .005, r: .2, rev: .4, pan: .08 }); if (r && dur > .3) vib(r.src, t, 5.8, 30, .18, dur); });
  wrap('bass', (t, m, dur, v, dest) => sn('ebass', t, m, Math.max(dur, .12), v, dest, { short: true, a: .003, r: .08, rev: .03 }));
  wrap('pizz', (t, m, dur, v, dest) => sn('pizz', t, m, .25, v, dest, { r: .3, rev: .4 }));
  wrap('timp', (t, v, dest, m = 38) => { sn('timpani', t, m, .8, v, dest, { r: .8, rev: .5 }); });
  wrap('timpRoll', (t, dur, v, dest, m = 38) => { const n = Math.floor(dur / .06); for (let i = 0; i < n; i++) { const k = i / n; sn('timpani', t + i * .06, m, .1, (.15 + .6 * k * k) * v, dest, { r: .15, rev: .5 }); } });
  wrap('kick', (t, v, dest) => dr('kick', t, v, dest, { rev: .05 }));
  wrap('snare', (t, v, dest) => dr('snare', t, v * .85, dest, { rev: .25 }));
  wrap('hat', (t, v, dest, open) => dr('hihat', t, v * .5 * (open ? 1.2 : 1), dest, { rev: .1, pan: .25 }));
  wrap('tom', (t, v, dest, m = 45) => { const nm = m >= 52 ? 'tom1' : m >= 47 ? 'tom2' : 'tom3', base = m >= 52 ? 55 : m >= 47 ? 50 : 45; dr(nm, t, v * .9, dest, { rev: .3, rate: Math.pow(2, (m - base) / 24) }); });
  wrap('taiko', (t, v, dest) => { dr('tom3', t, v * 1.1, dest, { rate: .55, rev: .6 }); dr('kick', t, v * .6, dest, { rate: .8, rev: .4 }); I0.taiko(t, v * .55, dest); });

  /* ---------- orquesta real (VSCO 2 CE + piano Salamander) por encima de lo anterior ---------- */
  const has = k => SM && SM.has && SM.has(k);
  const wrap2 = (name, need, fn) => { const f0 = I[name]; I[name] = function (...a) { return smOn() && has(need) ? fn(f0, ...a) : f0(...a); }; };
  const secK = m => m >= 67 ? 'vln' : m >= 55 ? 'vla' : m >= 40 ? 'vc' : 'cb';
  wrap2('strings', 'vln', (f0, t, m, dur, v, dest, o = {}) => sn(secK(m), t, m, dur, v, dest, { a: o.a ?? .2, r: o.r ?? .7, rev: .55, pan: o.pan }));
  wrap2('spicc', 'vlnspic', (f0, t, m, v, dest, pan = 0) => sn(m >= 55 ? 'vlnspic' : 'vcspic', t, m, .16, v, dest, { short: true, a: .003, r: .12, rev: .35, pan }));
  wrap2('trem', 'vlntrem', (f0, t, m, dur, v, dest) => sn(m >= 55 ? 'vlntrem' : 'vc', t, m, dur, v, dest, { a: .1, r: .5, rev: .5 }));
  wrap2('pizz', 'vlnpizz', (f0, t, m, dur, v, dest) => sn('vlnpizz', t, m, .3, v, dest, { r: .4, rev: .4 }));
  wrap2('violin', 'solovln', (f0, t, m, dur, v, dest, o = {}) => sn('solovln', t, m, dur, v, dest, { from: o.from, glide: .09, a: o.a ?? .05, r: .45, rev: .6, pan: o.pan ?? .12, lp: o.dark ? 2600 : undefined }));
  wrap2('cello', 'vc', (f0, t, m, dur, v, dest, o = {}) => sn('vc', t, m, dur, v * 1.8, dest, { from: o.from !== undefined ? o.from - 12 : undefined, a: .07, r: .5, rev: .5, pan: -.15 }));
  wrap2('contra', 'cb', (f0, t, m, dur, v, dest) => sn('cb', t, m, dur, v, dest, { a: .05, r: .4, rev: .3 }));
  wrap2('harp', 'harp', (f0, t, m, dur, v, dest, o = {}) => sn('harp', t, m, Math.max(dur, .5), v, dest, { r: .9, rev: .55, pan: o.pan ?? -.25 }));
  wrap2('flute', 'flute', (f0, t, m, dur, v, dest, o = {}) => sn('flute', t, m, dur, v, dest, { from: o.from, a: .05, r: .35, rev: .55, pan: .2 }));
  wrap2('duduk', 'oboe', (f0, t, m, dur, v, dest, o = {}) => sn('oboe', t, m, dur, v, dest, { from: o.from, glide: .12, a: .07, r: .4, rev: .6, pan: .1 }));
  wrap2('piano', 'grand', (f0, t, m, dur, v, dest, o = {}) => sn('grand', t, m, Math.max(dur, .35), v, dest, { r: .7, rev: .45, pan: o.pan ?? (m - 64) / 60 }));
  wrap2('horn', 'horn', (f0, t, m, dur, v, dest, o = {}) => sn('horn', t, m, dur, v, dest, { from: o.from, a: .07, r: .5, rev: .6, pan: o.pan }));
  wrap2('brass', 'horn', (f0, t, m, dur, v, dest, o = {}) => {
    if (o.sfz) { sn(m >= 58 ? 'tptstac' : 'hornstac', t, m, Math.min(dur, .5), v * 1.1, dest, { short: true, a: .004, r: .25, rev: .55, pan: o.pan }); if (m < 58) sn('tbn', t, m - 12, Math.min(dur, .45), v * .8, dest, { a: .01, r: .25, rev: .5, decay: .4 }); return; }
    if (o.soft) return sn('horn', t, m, dur, v, dest, { from: o.from, a: .08, r: .5, rev: .6, pan: o.pan });
    if (m >= 62) { sn('tpt', t, m, dur, v, dest, { from: o.from, a: .03, r: .4, rev: .55, pan: o.pan }); sn('horn', t, m - 12, dur, v * .6, dest, { a: .06, r: .4, rev: .6, pan: -(o.pan || 0) }); }
    else { sn('horn', t, m, dur, v, dest, { from: o.from, a: .05, r: .45, rev: .55, pan: o.pan }); sn('tbn', t, m - 12, dur, v * .7, dest, { a: .05, r: .4, rev: .5, pan: (o.pan || 0) * -.5 }); }
  });
  wrap2('braam', 'tbn', (f0, t, m, dur, v, dest) => { sn('tbn', t, m, dur, v * 1.1, dest, { a: .03, r: .6, rev: .6, pan: -.2 }); sn('tuba', t, m - 12, dur, v, dest, { a: .03, r: .6, rev: .5, pan: .2 }); sn('horn', t, m + 12, dur, v * .7, dest, { a: .05, r: .6, rev: .6 }); });
  wrap2('timp', 'timp', (f0, t, v, dest, m = 38) => dr('timp', t, v * .95, dest, { rev: .5, rate: Math.pow(2, (m - 38) / 12) }));
  wrap2('timpRoll', 'tproll', (f0, t, dur, v, dest, m = 38) => dr('tproll', t, v * .9, dest, { rev: .5, fadeIn: dur * .9, dur, rel: .4, rate: Math.pow(2, (m - 38) / 12) }));
  wrap2('crash', 'crash', (f0, t, v, dest) => dr('crash', t, v * .75, dest, { rev: .45, pan: -.2 }));
  wrap2('swell', 'swell', (f0, t, v, dest, dur = 1.5) => { const L = SM.len('swell'); const st = t + dur - L * .92; dr('swell', st, v * .8, dest, { rev: .5, off: st < t ? 0 : 0 }); });
  wrap2('taiko', 'bdrum', (f0, t, v, dest) => { dr('bdrum', t, v * 1.05, dest, { rev: .6 }); dr('tom3', t, v * .7, dest, { rate: .6, rev: .5 }); f0 === I0.taiko || 0; I0.taiko(t, v * .3, dest); });

  /* ---------- teoría musical ---------- */
  const MODES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], phrygdom: [0, 1, 4, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
  function deg(scale, root, d) { const n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return root + scale[i] + 12 * o; }
  function chordTones(scale, root, d) { return [deg(scale, root, d), deg(scale, root, d + 2), deg(scale, root, d + 4)]; }

  /* ---------- temas compuestos (grado de la escala, duración en semicorcheas; 4 frases × 32) ---------- */
  const THEMES = {
    hero: [[[0, 6], [4, 2], [7, 8], [6, 4], [4, 4], [5, 8]], [[4, 6], [2, 2], [4, 4], [5, 4], [4, 8], [0, 8]], [[0, 6], [4, 2], [7, 8], [9, 4], [8, 4], [7, 8]], [[8, 4], [7, 4], [6, 4], [4, 4], [7, 16]]],
    lyric: [[[2, 8], [4, 4], [2, 4], [0, 8], [-1, 8]], [[0, 8], [2, 4], [4, 4], [5, 12], [4, 4]], [[7, 8], [6, 4], [4, 4], [5, 8], [2, 8]], [[4, 8], [2, 4], [1, 4], [0, 16]]],
    action: [[[0, 2], [2, 2], [4, 4], [7, 6], [6, 2], [4, 4], [5, 4], [4, 4], [2, 4]], [[4, 6], [5, 2], [4, 4], [2, 4], [0, 8], [-1, 4], [0, 4]], [[0, 2], [2, 2], [4, 4], [7, 6], [9, 2], [8, 4], [7, 4], [9, 4], [11, 4]], [[12, 8], [11, 4], [9, 4], [7, 16]]],
    ancient: [[[0, 4], [1, 2], [0, 2], [-1, 4], [0, 4], [2, 8], [1, 8]], [[2, 4], [3, 2], [2, 2], [1, 4], [2, 4], [4, 8], [3, 8]], [[4, 4], [5, 2], [4, 2], [3, 4], [4, 4], [2, 4], [1, 4], [0, 8]], [[-1, 8], [1, 8], [0, 16]]],
    fanfare: [[[0, 3], [0, 1], [4, 4], [7, 8], [4, 4], [7, 4], [9, 8]], [[7, 8], [4, 4], [5, 4], [4, 16]], [[0, 3], [0, 1], [4, 4], [7, 8], [9, 4], [11, 4], [12, 8]], [[11, 4], [9, 4], [11, 8], [12, 16]]]
  };
  const PROG = { hero: [0, 5, 2, 6, 0, 3, 5, 4], lyric: [5, 6, 2, 5, 3, 6, 0, 4], action: [0, 0, 5, 6, 0, 3, 5, 4], ancient: [0, 1, 0, 6, 0, 1, 3, 0], fanfare: [0, 3, 4, 0, 0, 3, 4, 0] };

  /* ánimos: estilo (capas) + secuencia de secciones [tipo, tema, instrumento solista, octava] */
  const MOODS = {
    menu:    { bpm: 78, root: 62, mode: 'minor', kit: ['strings', 'horns', 'choir', 'taiko', 'spicc', 'piano'], sections: [['melan', 'lyric', 'piano', 0], ['build', 'hero', 'horn', 0], ['full', 'hero', 'brass', 0], ['melan', 'lyric', 'violin', 1]] },
    beach:   { bpm: 100, mode: 'major', kit: ['strings', 'harp', 'pizz', 'shaker', 'horns'], sections: [['melan', 'lyric', 'flute', 1], ['full', 'hero', 'flute', 1], ['full', 'lyric', 'violin', 1], ['melan', 'hero', 'piano', 1]] },
    forest:  { bpm: 92, mode: 'dorian', kit: ['strings', 'harp', 'hand', 'horns'], sections: [['melan', 'lyric', 'flute', 1], ['full', 'hero', 'horn', 0], ['melan', 'lyric', 'piano', 1], ['full', 'hero', 'flute', 1]] },
    mystic:  { bpm: 76, mode: 'lydian', kit: ['pad', 'harp', 'bells', 'choir'], sections: [['intro', 'lyric', null, 0], ['melan', 'lyric', 'flute', 1], ['full', 'hero', 'violin', 1], ['melan', 'hero', 'piano', 1]] },
    sky:     { bpm: 96, mode: 'lydian', kit: ['strings', 'harp', 'choir', 'horns', 'taiko'], sections: [['melan', 'lyric', 'flute', 1], ['build', 'hero', 'horn', 0], ['full', 'hero', 'brass', 0], ['melan', 'lyric', 'violin', 1]] },
    cave:    { bpm: 72, mode: 'harm', kit: ['pad', 'choir', 'drip'], sections: [['intro', 'lyric', null, 0], ['melan', 'lyric', 'piano', 1], ['melan', 'hero', 'cello', -1], ['melan', 'lyric', 'violin', 1]] },
    ruins:   { bpm: 96, mode: 'harm', kit: ['drone', 'oud', 'frame', 'strings', 'choir', 'taiko'], sections: [['intro', 'ancient', null, 0], ['full', 'ancient', 'duduk', 1], ['melan', 'lyric', 'flute', 1], ['full', 'ancient', 'violin', 1]] },
    clock:   { bpm: 108, mode: 'minor', kit: ['strings', 'spicc', 'pizz', 'bells', 'horns'], sections: [['build', 'hero', 'horn', 0], ['full', 'hero', 'violin', 1], ['melan', 'lyric', 'piano', 1], ['full', 'action', 'brass', 0]] },
    lava:    { bpm: 100, mode: 'phrygdom', kit: ['drone', 'oud', 'taiko', 'frame', 'brass', 'choir', 'spicc'], sections: [['build', 'ancient', 'duduk', 1], ['full', 'ancient', 'brass', 0], ['climax', 'ancient', 'duduk', 1], ['melan', 'lyric', 'cello', -1]] },
    castle:  { bpm: 100, mode: 'minor', kit: ['strings', 'spicc', 'brass', 'choir', 'taiko', 'timp'], sections: [['intro', 'hero', null, 0], ['build', 'hero', 'horn', 0], ['full', 'hero', 'brass', 0], ['melan', 'lyric', 'violin', 1]] },
    // rock sinfónico (opening de anime): guitarras con cortes, piano rápido, orquesta y un respiro melancólico
    combat:  { bpm: 150, mode: 'minor', kit: ['gtr', 'bass', 'kit', 'piano16', 'strings', 'brass'], sections: [['full', 'action', 'leadGtr', 1], ['stops', 'action', 'violin', 1], ['full', 'hero', 'leadGtr', 1], ['climax', 'action', 'leadGtr', 1]] },
    elite:   { bpm: 160, mode: 'harm', kit: ['gtr', 'bass8', 'kit', 'piano16', 'brass', 'choir'], sections: [['stops', 'action', 'leadGtr', 1], ['full', 'action', 'leadGtr', 1], ['climax', 'hero', 'brass', 1], ['full', 'action', 'leadGtr', 1]] },
    boss:    { bpm: 138, mode: 'harm', kit: ['gtr', 'bass', 'kit', 'piano16', 'strings', 'spicc', 'brass', 'choir', 'taiko'], sections: [['intro', 'hero', null, 0], ['full', 'hero', 'brass', 0], ['stops', 'action', 'leadGtr', 1], ['climax', 'action', 'leadGtr', 1], ['melan', 'lyric', 'piano', 1], ['climax', 'hero', 'brass', 1]],
               sections2: [['climax', 'action', 'leadGtr', 1], ['stops', 'action', 'violin', 1], ['climax', 'hero', 'brass', 1], ['full', 'action', 'leadGtr', 1]] },
    seal:    { bpm: 70, mode: 'minor', kit: ['tension'], sections: [['tension', 'lyric', 'cello', -1]] },
    victory: { bpm: 112, mode: 'major', kit: ['strings', 'brass', 'timp', 'harp', 'choir'], sections: [['full', 'fanfare', 'brass', 0], ['melan', 'lyric', 'violin', 1]] }
  };

  /* ---------- secuenciador ---------- */
  const S = { mood: null, next: null, key: 57, bar: 0, secIdx: -1, sec: null, nextBarTime: 0, timer: 0, phase: 1, intensity: 1, rng: mulberry32(1), lastLead: null, playing: false };
  function setMood(name, opts = {}) {
    if (!ctx) return;
    if (S.mood === name && !opts.force) return;
    S.next = { name, key: opts.key, immediate: opts.immediate };
    if (!S.playing) { S.playing = true; S.nextBarTime = ctx.currentTime + .1; tick(); }
    if (opts.immediate && S.mood) { const t = ctx.currentTime + .05; I.crash(t, .8, musicBus); I.taiko(t, .9, musicBus); I.braam(t, 33, 1.2, .8, musicBus); }
  }
  function setKey(root) { S.key = root; }
  function setPhase(p) { if (p !== S.phase && S.mood === 'boss') S.secIdx = -1; S.phase = p; }
  function stopMusic() { S.playing = false; S.mood = null; clearTimeout(S.timer); }
  function tick() {
    if (!S.playing || !ctx) return;
    if (SM && !SM.ready && !SM.failed) { if (S.waitT === undefined) S.waitT = performance.now(); if (performance.now() - S.waitT < 12000) { S.nextBarTime = ctx.currentTime + .1; S.timer = setTimeout(tick, 120); return; } }
    while (S.nextBarTime < ctx.currentTime + .35) { const t0 = S.nextBarTime; try { scheduleBar(t0); } catch (e) { console.warn('música', e); } if (S.nextBarTime === t0) { S.bar++; S.nextBarTime = t0 + 2; } }
    S.timer = setTimeout(tick, 60);
  }
  function scheduleBar(t0) {
    if (S.next) { S.mood = S.next.name; if (S.next.key) S.key = S.next.key; S.next = null; S.bar = 0; S.secIdx = -1; S.rng = mulberry32((Math.random() * 1e9) | 0); S.lastLead = null; }
    const M = MOODS[S.mood]; if (!M) { S.nextBarTime = t0 + 2; return; }
    const bi = S.bar % 8;
    if (bi === 0 || !S.sec) { const list = S.mood === 'boss' && S.phase > 1 && M.sections2 ? M.sections2 : M.sections; S.secIdx = (S.secIdx + 1) % list.length; S.sec = list[S.secIdx]; }
    const [type, theme, lead, oct] = S.sec;
    const spb = 60 / M.bpm, st = spb / 4, barDur = spb * 4, at = s => t0 + s * st;
    let root = M.root ?? S.key; while (root > 64) root -= 12; while (root < 52) root += 12;
    const scale = MODES[M.mode], prog = PROG[theme] || PROG.hero, cd = prog[bi], ct = chordTones(scale, root, cd), K = new Set(M.kit), d = musicBus;
    const v = S.intensity, last = bi === 7, B = root - 12;
    const full = type === 'full' || type === 'climax', climax = type === 'climax', stops = type === 'stops', melan = type === 'melan', build = type === 'build', intro = type === 'intro';
    const rock = K.has('gtr');
    // ===== colchón armónico =====
    if (bi % 2 === 0 || melan || intro) {
      const len = (melan || intro) ? barDur - .05 : barDur * 2 - .1, ok2 = bi % 2 === 0;
      if (K.has('strings') && ok2 && !stops) ct.forEach((m, k) => I.strings(t0, m - (k ? 0 : 12), barDur * 2 - .1, (melan ? .55 : full ? .85 : .7), d, { pan: (k - 1) * .5 }));
      if ((K.has('pad') || K.has('drone') || intro) && ok2) ct.forEach(m => I.pad(t0, m - 12, barDur * 2, K.has('pad') ? 1 : .7, d));
      if (K.has('drone') && ok2) { I.pad(t0, root - 12, barDur * 2, 1.1, d); I.pad(t0, root - 5, barDur * 2, .8, d); }
      if (K.has('choir') && ok2 && (full || intro || (melan && S.mood === 'mystic'))) ct.forEach((m, k) => I.choir(t0, m - (k ? 0 : 12) + (climax ? 12 : 0), barDur * 2 - .2, (climax ? .8 : .55), d, { vowel: K.has('drone') ? 'o' : S.mood === 'mystic' || S.mood === 'cave' ? 'u' : 'a', pan: (k - 1) * .55 }));
      if (K.has('choir') && melan && S.mood === 'cave' && ok2) ct.forEach(m => I.choir(t0, m, barDur * 2, .35, d, { vowel: 'u' }));
    }
    // contrabajos: nota pedal en lo orquestal
    if (!rock && (full || build) && (K.has('strings') || K.has('drone'))) I.contra(t0, ct[0] - 24, barDur - .05, full ? 1 : .8, d);
    // ===== metales =====
    if ((K.has('brass') || K.has('horns')) && !melan && !intro) {
      if (full && !stops) { ct.forEach((m, k) => I.brass(t0 + (rock ? 0 : 0), m - 12 + (k === 0 ? 0 : 0), barDur * (rock ? .45 : .95), (climax ? .95 : .75) * (K.has('brass') ? 1 : .7), d, { soft: !K.has('brass'), pan: (k - 1) * .4 })); if (!rock && K.has('brass')) I.brass(t0, ct[0] - 24, spb * 1.5, .9, d, { sfz: true }); }
      if (build && bi % 2 === 0) ct.forEach(m => I.horn(t0, m - 12, barDur * 2 - .1, .55, d));
    }
    if (climax && last) I.braam(at(8), ct[0] - 12, spb * 2, 1, d);
    // ===== ostinato de cuerdas (3+3+2) =====
    if (K.has('spicc') && (full || build) && !stops) {
      const pat = [0, 0, 12, 0, 0, 12, 7, 12], step = full ? 1 : 2;
      for (let s = 0; s < 16; s += step) I.spicc(at(s), ct[0] - 12 + pat[s % 8], ([0, 3, 6, 8, 11, 14].includes(s) ? 1 : .6) * (full ? 1 : .8), d, s % 2 ? .3 : -.3);
    }
    if (K.has('pizz') && !stops) for (const s of melan ? [0, 8] : [0, 4, 6, 8, 12, 14]) I.pizz(at(s), (s % 8 === 6 ? ct[2] : s % 8 === 4 ? ct[1] : ct[0]) - 12, st, .9, d);
    if (K.has('oud') && !intro) for (const s of melan ? [0, 6, 8] : [0, 2, 3, 6, 8, 10, 11, 14]) I.oud(at(s), (s % 4 === 3 ? ct[1] : s === 6 || s === 14 ? ct[2] : ct[0]) - 12 + (s >= 8 && s % 4 === 2 ? 12 : 0), st, .85, d);
    if (K.has('harp')) for (let s = 0; s < 16; s += 2) I.harp(at(s), ct[[0, 1, 2, 1, 2, 0, 1, 2][s / 2]] + (s >= 8 ? 12 : 0), st * 2, (melan ? .7 : .55), d);
    if (K.has('bells') && bi % 2 === 0) [0, 6, 10].forEach((s, k) => I.bell(at(s), ct[k % 3] + 24, st * 4, .6, d));
    // ===== piano =====
    if (melan) { // arpegio melancólico
      const arp = [ct[0] - 12, ct[1] - 12, ct[2] - 12, ct[0], ct[1], ct[2], ct[0], ct[1] - 12];
      for (let s = 0; s < 16; s += 2) I.piano(at(s), arp[s / 2], st * 3, .5, d);
      I.piano(t0, ct[0] - 24, barDur, .55, d);
    } else if (K.has('piano16') && (full || stops)) { // piano rápido de opening
      const run = [ct[0], ct[1], ct[2], ct[0] + 12, ct[2], ct[1], ct[0] + 12, ct[1] + 12];
      for (let s = 0; s < 16; s++) if (!stops || s < 8 || full) I.piano(at(s), run[s % 8] + 12, st, s % 4 === 0 ? .55 : .38, d);
    } else if (K.has('piano') && build) [0, 4, 8, 12].forEach((s, k) => I.piano(at(s), ct[k % 3] + 12, st * 4, .4, d));
    // ===== guitarras y bajo =====
    if (rock && !melan && !intro) {
      const gr = ct[0] - 12;
      if (stops) { // cortes: golpe de toda la banda y silencio
        const hits = bi % 2 === 0 ? [0, 3, 6] : [0, 3, 6, 10, 12, 14];
        for (const s of hits) { I.gtr(at(s), gr, st * 1.6, 1, d); I.bass(at(s), gr, st * 1.5, 1, d); I.kick(at(s), 1, d); if (K.has('brass')) I.brass(at(s), ct[1], st * 1.4, .9, d, { sfz: true }); }
        I.crash(at(0), .7, d); if (bi % 2 === 1) for (const s of [12, 13, 14, 15]) I.snare(at(s), .5 + (s - 12) * .15, d);
      } else if (full) {
        const chug = climax || S.mood === 'elite' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] : [0, 2, 3, 4, 6, 8, 10, 11, 12, 14];
        const accents = [0, 3, 6, 10, 12];
        for (const s of chug) I.gtr(at(s), gr, st * (accents.includes(s) ? 1.8 : .9), accents.includes(s) ? 1 : .8, d, { mute: !accents.includes(s) });
        const bpat = K.has('bass8') ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] : [0, 2, 3, 4, 6, 8, 10, 11, 12, 14];
        for (const s of bpat) I.bass(at(s), gr + (K.has('bass8') && s % 2 ? 12 : 0), st * .9, .9, d);
      } else if (build) { for (const s of [0, 4, 8, 12]) I.gtr(at(s), gr, st * .8, .7, d, { mute: true }); for (const s of [0, 8]) I.bass(at(s), gr, st * 7, .8, d); }
    }
    // ===== melodía (tema compuesto) =====
    if (lead && !intro) {
      const TH = THEMES[theme], ph = TH[Math.floor(bi / 2) % 4], half = (bi % 2) * 16; let pos = 0, prev = S.lastLead;
      const center = root + 12 * (oct || 0);
      for (const [dg, len] of ph) {
        if (pos + len > half && pos < half + 16) {
          const s0 = Math.max(pos, half) - half, l = Math.min(pos + len, half + 16) - Math.max(pos, half);
          if (pos >= half) { const m = deg(scale, center, dg); I[lead](at(s0), m, l * st * .96, (melan ? .75 : stops ? .8 : .85), d, { from: prev }); prev = m;
            if (climax && K.has('choir') && lead !== 'piano') I.choir(at(s0), m - 12, l * st, .45, d, { a: .08, vowel: 'a' });
            if (climax && lead === 'leadGtr' && K.has('strings')) I.violin(at(s0), m + 12, l * st * .96, .55, d, { from: prev + 12 }); }
        }
        pos += len;
      }
      S.lastLead = prev;
    }
    // contracanto en los momentos tristes
    if (melan && (K.has('strings') || K.has('pad')) && bi % 2 === 1 && lead !== 'cello') I.cello(t0, ct[1] - 12, barDur - .1, .55, d);
    // ===== percusión =====
    drums(M, K, type, t0, st, bi, d);
    if (last && (build || (intro && S.mood !== 'cave'))) { I.swell(at(8), 1, d, spb * 2); if (K.has('taiko') || K.has('timp') || rock) I.timpRoll(at(8), spb * 2, .9, d, 38); }
    if (bi === 0 && (full || stops) && (rock || K.has('taiko') || K.has('timp'))) { I.crash(t0, .75, d); if (!rock) I.taiko(t0, 1, d); }
    if (type === 'tension') { I.heart(t0, .9, d); I.heart(at(8), .7, d); ct.forEach(m => I.trem(t0, m - 12, barDur, .7, d)); if (bi % 2 === 0) I.choir(t0, ct[0], barDur * 2, .4, d, { vowel: 'u' }); if (last) I.timpRoll(t0, barDur, .9, d, 36); }
    S.bar++; S.nextBarTime = t0 + barDur;
  }
  function drums(M, K, type, t0, st, bi, d) {
    const at = s => t0 + s * st, full = type === 'full' || type === 'climax', climax = type === 'climax';
    if (type === 'melan' || type === 'tension' || type === 'stops') { if (type === 'melan' && K.has('drip') && S.rng() < .5) I.bell(at(Math.floor(S.rng() * 16)), 84 + Math.floor(S.rng() * 8), .2, .25, d); return; }
    if (K.has('kit') && (full || type === 'build')) {
      if (type === 'build') { for (const s of [0, 8]) I.kick(at(s), .8, d); for (let s = 0; s < 16; s += 2) I.hat(at(s), .5, d); if (bi === 7) for (let s = 8; s < 16; s++) I.snare(at(s), .3 + (s - 8) * .08, d); return; }
      const kicks = climax || S.mood === 'elite' ? [0, 2, 3, 6, 8, 10, 11, 14] : [0, 3, 6, 8, 10];
      for (const s of kicks) I.kick(at(s), .95, d);
      I.snare(at(4), .95, d); I.snare(at(12), .95, d); if (bi % 2 === 1) I.snare(at(15), .4, d);
      for (let s = 0; s < 16; s += 2) (climax ? I.ride : I.hat)(at(s), s % 4 === 2 ? .9 : .6, d, s === 14);
      if (K.has('taiko')) { I.taiko(at(0), .8, d); if (climax) I.taiko(at(8), .7, d); }
      if (bi === 7) { for (const s of [12, 13, 14, 15]) I.tom(at(s), .8, d, 50 - (s - 12) * 3); }
      return;
    }
    if (K.has('taiko') && (full || type === 'build')) {
      const pat = full ? (climax ? [0, 3, 6, 8, 10, 11, 12, 14] : [0, 3, 6, 8, 10, 14]) : [0, 8];
      for (const s of pat) I.taiko(at(s), [0, 8].includes(s) ? 1 : .6, d);
      if (full) for (const s of [4, 12]) I.tom(at(s), .5, d, 48);
      if (full && bi === 7) for (const s of [12, 13, 14, 15]) I.taiko(at(s), .5 + (s - 12) * .12, d);
    }
    if (K.has('timp') && full && bi % 2 === 0) I.timp(at(0), .8, d, 38);
    if (K.has('frame') && type !== 'intro') for (const s of [0, 3, 6, 8, 10, 11, 14]) I.frame(at(s), [0, 8].includes(s) ? .9 : .55, d, ![0, 8].includes(s));
    if (K.has('hand')) { for (const s of [0, 3, 6, 10, 12]) I.tom(at(s), .35, d, s % 6 ? 57 : 52); for (let s = 2; s < 16; s += 4) I.shaker(at(s), .5, d); }
    if (K.has('shaker') && full) { for (let s = 0; s < 16; s += 2) I.shaker(at(s), s % 4 ? .6 : 1, d); I.kick(at(0), .5, d); I.kick(at(10), .35, d); I.snare(at(8), .25, d); }
    if (K.has('drip') && S.rng() < .5) I.bell(at(Math.floor(S.rng() * 16)), 84 + Math.floor(S.rng() * 8), .2, .25, d);
  }

  /* ---------- efectos de sonido ---------- */
  const lastSfx = {};
  function ok(name, gap) { const t = performance.now(); if (lastSfx[name] && t - lastSfx[name] < gap) return false; lastSfx[name] = t; return true; }
  const SFX = {
    step(surf) {
      if (!ok('step', 70)) return; const t = now(), d = sfxBus;
      if (surf === 'sand') noise(t, .06, d, 1100, 'lowpass', 1, .22, .01, .05);
      else if (surf === 'grass') noise(t, .05, d, 3200, 'bandpass', 1.5, .18, .005, .04);
      else if (surf === 'wet' || surf === 'water') { noise(t, .06, d, 1800, 'bandpass', 2, .2, .003, .05); tone(t, 900, .06, d, { fEnd: 1400, gain: .05 }); }
      else if (surf === 'wood') { tone(t, 180, .06, d, { type: 'triangle', gain: .2, fEnd: 140 }); noise(t, .03, d, 1200, 'bandpass', 2, .1); }
      else if (surf === 'metal') tone(t, 1400, .05, d, { type: 'triangle', gain: .06 });
      else if (surf === 'bounce') tone(t, 300, .1, d, { fEnd: 500, gain: .1 });
      else { noise(t, .03, d, 2600, 'bandpass', 2, .18, .001, .03); tone(t, 220, .03, d, { type: 'triangle', gain: .06 }); }
    },
    jump() { const t = now(); noise(t, .12, sfxBus, 900, 'bandpass', 1, .15, .005, .08, 0, 2400); tone(t, 260, .1, sfxBus, { type: 'triangle', fEnd: 520, gain: .08 }); },
    djump() { const t = now(); [0, 4, 7, 12].forEach((s, i) => tone(t + i * .03, mtof(76 + s), .15, sfxBus, { type: 'sine', gain: .08, rev: .4 })); noise(t, .2, sfxBus, 1500, 'bandpass', 1, .12, .005, .1, 0, 5000); },
    land(power, surf) { const t = now(); tone(t, 120, .12, sfxBus, { fEnd: 50, gain: .25 * power }); noise(t, .1, sfxBus, surf === 'sand' ? 700 : 1400, 'lowpass', 1, .3 * power, .002, .1); },
    swing(heavy) { const t = now(); noise(t, heavy ? .3 : .16, sfxBus, heavy ? 500 : 1200, 'bandpass', 1.2, heavy ? .35 : .25, .01, .08, 0, heavy ? 2200 : 5000); },
    hit(heavy) { const t = now(); tone(t, heavy ? 90 : 140, .14, sfxBus, { fEnd: 40, gain: .55 }); noise(t, .08, sfxBus, 2500, 'bandpass', 1, .45, .001, .07); noise(t, .02, sfxBus, 6000, 'highpass', 1, .3, .001, .02); },
    crit() { const t = now(); SFX.hit(true); [0, 7, 12].forEach((s, i) => tone(t + .02 * i, mtof(84 + s), .2, sfxBus, { type: 'square', gain: .04, rev: .3 })); },
    parry() { const t = now(); const car = tone(t, 1760, .6, sfxBus, { type: 'sine', gain: .25, a: .001, d: .1, s: .2, r: .4, rev: .6 }); tone(t, 2637, .4, sfxBus, { type: 'sine', gain: .12, rev: .6 }); noise(t, .05, sfxBus, 8000, 'highpass', 1, .3); tone(t, 220, .2, sfxBus, { fEnd: 110, gain: .3 }); },
    block() { const t = now(); tone(t, 300, .1, sfxBus, { type: 'triangle', fEnd: 180, gain: .3 }); noise(t, .06, sfxBus, 1500, 'bandpass', 2, .2); },
    dash() { const t = now(); noise(t, .22, sfxBus, 600, 'bandpass', .8, .3, .01, .1, 0, 4000); },
    hurt() { const t = now(); tone(t, 220, .25, sfxBus, { type: 'sawtooth', fEnd: 110, gain: .15, filter: 'lowpass', ff: 900 }); noise(t, .15, sfxBus, 800, 'lowpass', 1, .3); },
    enemyHurt() { const t = now(); tone(t, 340, .1, sfxBus, { type: 'square', fEnd: 160, gain: .06, filter: 'lowpass', ff: 1200 }); },
    die() { const t = now(); noise(t, .35, sfxBus, 1200, 'lowpass', 1, .45, .002, .3, .2, 200); tone(t, 200, .3, sfxBus, { fEnd: 50, gain: .3 }); },
    telegraph(pitch = 60) { if (!ok('tele', 120)) return; const t = now(); tone(t, mtof(pitch), .35, sfxBus, { type: 'sawtooth', fEnd: mtof(pitch + 12), gain: .07, filter: 'lowpass', ff: 1800, rev: .3 }); },
    charge() { const t = now(); tone(t, 200, .6, sfxBus, { type: 'sawtooth', fEnd: 900, gain: .06, filter: 'lowpass', ff: 2200, rev: .3 }); },
    pickup() { const t = now(); [0, 7, 12, 16].forEach((s, i) => tone(t + i * .045, mtof(81 + s), .12, sfxBus, { type: 'triangle', gain: .07, rev: .3 })); },
    heal() { const t = now(); [0, 4, 7, 11].forEach((s, i) => tone(t + i * .06, mtof(69 + s), .6, sfxBus, { type: 'sine', gain: .08, rev: .7 })); },
    correct() { const t = now(); [0, 4, 7, 12, 16].forEach((s, i) => tone(t + i * .055, mtof(72 + s), .35, sfxBus, { type: 'triangle', gain: .1, rev: .5 })); I.bell(t + .3, 96, .5, .6, sfxBus); noise(t + .1, .5, sfxBus, 9000, 'highpass', 1, .08, .1, .3, .5); },
    wrong() { const t = now(); tone(t, 155, .45, sfxBus, { type: 'sawtooth', gain: .1, filter: 'lowpass', ff: 700 }); tone(t, 165, .45, sfxBus, { type: 'sawtooth', gain: .1, filter: 'lowpass', ff: 700 }); tone(t + .15, 110, .5, sfxBus, { fEnd: 70, gain: .2 }); },
    spell() { const t = now(); [0, 4, 7].forEach((s, i) => tone(t + i * .06, mtof(67 + s), .3, sfxBus, { type: 'triangle', gain: .08, rev: .4 })); },
    ui() { if (!ok('ui', 40)) return; tone(now(), 1200, .03, sfxBus, { type: 'triangle', gain: .05 }); },
    select() { const t = now(); tone(t, 880, .08, sfxBus, { type: 'triangle', gain: .08 }); tone(t + .05, 1320, .1, sfxBus, { type: 'triangle', gain: .07 }); },
    back() { tone(now(), 600, .08, sfxBus, { type: 'triangle', fEnd: 400, gain: .07 }); },
    gate() { const t = now(); noise(t, 1.2, sfxBus, 300, 'lowpass', 1, .5, .05, .5, .3); [0, 7, 12, 19].forEach((s, i) => I.bell(t + .3 + i * .1, 72 + s, .4, .5, sfxBus)); },
    checkpoint() { const t = now(); I.bell(t, 79, .5, .8, sfxBus); I.bell(t + .15, 86, .5, .6, sfxBus); I.choir(t, 67, 1.2, .5, sfxBus, { a: .1 }); },
    slam(power = 1) { const t = now(); tone(t, 70, .6, sfxBus, { fEnd: 30, gain: .9 * power, a: .002, d: .2, s: .4, r: .4 }); noise(t, .6, sfxBus, 600, 'lowpass', 1, .7 * power, .002, .6, .3, 120); noise(t, .1, sfxBus, 3000, 'bandpass', 1, .4 * power); },
    explode() { const t = now(); noise(t, .9, sfxBus, 1800, 'lowpass', .7, .7, .002, .8, .4, 100); tone(t, 90, .5, sfxBus, { fEnd: 30, gain: .7 }); },
    arrow() { const t = now(); tone(t, 900, .08, sfxBus, { type: 'triangle', fEnd: 300, gain: .1 }); noise(t, .15, sfxBus, 3000, 'bandpass', 3, .1, .01, .1, 0, 6000); },
    zap() { const t = now(); for (let i = 0; i < 4; i++) tone(t + i * .04, 300 + Math.random() * 1200, .05, sfxBus, { type: 'square', gain: .05 }); noise(t, .2, sfxBus, 5000, 'highpass', 1, .15); },
    roar(pitch = 1) { const t = now(); const o = tone(t, 70 * pitch, 1.4, sfxBus, { type: 'sawtooth', fEnd: 50 * pitch, gain: .25, filter: 'lowpass', ff: 600, a: .1, d: .3, s: .8, r: .4, rev: .4 }); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 18; lg.gain.value = 30; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + 1.8); noise(t, 1.4, sfxBus, 500, 'lowpass', 1, .35, .1, .5, .3); },
    timeStop() { const t = now(); I.swell(t, 1, sfxBus, .5); tone(t + .5, 60, 1.2, sfxBus, { type: 'sine', gain: .3, rev: .8 }); [0, 3, 7].forEach((s, i) => I.bell(t + .5 + i * .02, 60 + s, 1, .6, sfxBus)); },
    timeResume() { const t = now(); tone(t, 400, .3, sfxBus, { fEnd: 1200, gain: .1, rev: .5 }); noise(t, .3, sfxBus, 2000, 'bandpass', 1, .2, .01, .2, .3, 8000); },
    bounce() { const t = now(); tone(t, 220, .25, sfxBus, { type: 'sine', fEnd: 660, fT: .12, gain: .25 }); },
    grapple() { const t = now(); noise(t, .25, sfxBus, 2000, 'bandpass', 4, .2, .005, .05, 0, 6000); tone(t + .2, 1200, .05, sfxBus, { type: 'square', gain: .05 }); },
    splash(lava) { const t = now(); noise(t, .5, sfxBus, lava ? 600 : 1500, 'lowpass', 1, .45, .005, .4, .3, lava ? 200 : 400); if (lava) tone(t, 80, .5, sfxBus, { fEnd: 40, gain: .3 }); },
    bubble() { if (!ok('bub', 150)) return; tone(now(), 300 + Math.random() * 300, .08, sfxBus, { fEnd: 900, gain: .04 }); },
    whoosh() { noise(now(), .5, sfxBus, 400, 'bandpass', 1, .35, .05, .2, .3, 3000); },
    ultCharge() { const t = now(); I.swell(t, 1, sfxBus, .8); tone(t, 110, .9, sfxBus, { type: 'sawtooth', fEnd: 880, gain: .08, filter: 'lowpass', ff: 3000, rev: .4 }); },
    ultFire() { const t = now(); SFX.slam(1.2); I.crash(t, 1, sfxBus); [0, 7, 12].forEach(s => I.choir(t, 57 + s, 1.6, .9, sfxBus, { a: .03 })); I.brass(t, 45, 1.2, 1, sfxBus); },
    fizzle() { const t = now(); tone(t, 600, .6, sfxBus, { type: 'sawtooth', fEnd: 80, gain: .1, filter: 'lowpass', ff: 1500 }); noise(t, .6, sfxBus, 3000, 'bandpass', 1, .15, .01, .3, 0, 300); },
    combo(n) { tone(now(), mtof(72 + Math.min(n, 12)), .06, sfxBus, { type: 'square', gain: .04 }); },
    taunt() { const t = now(); [0, 5, 7].forEach((s, i) => tone(t + i * .07, mtof(60 + s), .2, sfxBus, { type: 'sawtooth', gain: .05, filter: 'lowpass', ff: 1600 })); },
    crumble() { noise(now(), .6, sfxBus, 700, 'lowpass', 1, .35, .01, .4, .2, 200); },
    wind() { if (!ok('wind', 1800)) return; noise(now(), 1.8, sfxBus, 500, 'bandpass', .6, .15, .5, .8, .3, 900); },
    coin(n) { if (!ok('coin', 30)) return; const t = now(), k = Math.pow(2, Math.min(n || 0, 14) / 12); tone(t, 1568 * k, .05, sfxBus, { type: 'square', gain: .035 }); tone(t + .05, 2093 * k, .1, sfxBus, { type: 'square', gain: .035 }); },
    coinIn(n) { if (!ok('coinIn', 45)) return; const t = now(); tone(t, mtof(84 + Math.min(n || 0, 14)), .07, sfxBus, { type: 'triangle', gain: .05, rev: .2 }); },
    heart(a) { const t = now(), v = a || 1; tone(t, 62, .12, sfxBus, { fEnd: 38, gain: .32 * v }); tone(t + .17, 55, .14, sfxBus, { fEnd: 34, gain: .24 * v }); },
    kill(big) { const t = now(); tone(t, big ? 120 : 180, .18, sfxBus, { fEnd: 45, gain: big ? .3 : .2 }); noise(t, .22, sfxBus, big ? 900 : 1800, 'lowpass', 1, big ? .35 : .22, .002, .15, .15, 200); },
    portal() { const t = now(); tone(t, 220, .45, sfxBus, { type: 'sine', fEnd: 880, gain: .06, rev: .5 }); noise(t, .5, sfxBus, 600, 'bandpass', 2, .12, .25, .2, .4, 2400); },
    thunder() { if (!ok('thunder', 160)) return; const t = now(); noise(t, 1.2, sfxBus, 300, 'lowpass', .7, .5, .005, 1, .5, 80); noise(t, .15, sfxBus, 3000, 'bandpass', 1, .25, .001, .1, .3); tone(t, 55, .8, sfxBus, { fEnd: 30, gain: .3 }); },
    twang(big) { const t = now(); tone(t, big ? 180 : 260, .18, sfxBus, { type: 'triangle', fEnd: big ? 90 : 140, gain: .12 }); noise(t, .08, sfxBus, 3000, 'highpass', 1, .08, .001, .06); },
    whirr() { const t = now(); for (let i = 0; i < 4; i++) noise(t + i * .05, .06, sfxBus, 1200 + i * 300, 'bandpass', 3, .08, .005, .05); },
    cast() { const t = now(); tone(t, 440, .3, sfxBus, { type: 'sine', fEnd: 1320, gain: .06, rev: .5 }); noise(t, .3, sfxBus, 4000, 'highpass', 1, .06, .02, .2, .4); },
    reap() { noise(now(), .3, sfxBus, 900, 'bandpass', 1.4, .22, .01, .22, .2, 2600); },
    skid() { if (!ok('skid', 200)) return; noise(now(), .22, sfxBus, 2400, 'bandpass', 1.2, .12, .01, .12, .05, 900); },
    yawn() { const t = now(); tone(t, 330, .7, sfxBus, { type: 'triangle', fEnd: 210, gain: .035, filter: 'lowpass', ff: 900 }); },
    flutter() { const t = now(); for (let i = 0; i < 6; i++) noise(t + i * .045, .04, sfxBus, 1800 + i * 120, 'bandpass', 1.5, .07, .003, .03); },
    puddle(v) { if (!ok('puddle', 70)) return; const t = now(), k = Math.min(1.4, v || .6); noise(t, .18, sfxBus, 1600, 'bandpass', 1.4, .16 * k, .003, .12, .2, 600); tone(t + .02, 700 + Math.random() * 500, .06, sfxBus, { fEnd: 1500, gain: .03 * k }); },
    thud() { const t = now(); tone(t, 90, .2, sfxBus, { fEnd: 40, gain: .25 }); noise(t, .2, sfxBus, 500, 'lowpass', 1, .25, .002, .15, .1); },
    streak(n) { const t = now(); for (let i = 0; i < Math.min(n, 6); i++) tone(t + i * .04, mtof(79 + i * 2), .1, sfxBus, { type: 'triangle', gain: .06, rev: .3 }); }
  };
  function play(name, ...a) { if (!ctx || ctx.state !== 'running') return; try { SFX[name] && SFX[name](...a); } catch (e) { } }

  /* ---------- control ---------- */
  function duck(on) {
    if (!ctx) return; const t = ctx.currentTime;
    musicFilter.frequency.cancelScheduledValues(t); musicDuck.gain.cancelScheduledValues(t);
    musicFilter.frequency.setTargetAtTime(on ? 750 : 20000, t, on ? .15 : .4);
    musicDuck.gain.setTargetAtTime(on ? .42 : 1, t, on ? .15 : .4);
  }
  function setVolumes(m, mu, s) { vol.master = m; vol.music = mu; vol.sfx = s; if (!ctx) return; master.gain.setTargetAtTime(m, ctx.currentTime, .05); musicBus.gain.setTargetAtTime(mu, ctx.currentTime, .05); sfxBus.gain.setTargetAtTime(s, ctx.currentTime, .05); }
  function pause(p) { if (!ctx) return; if (p) ctx.suspend(); else ctx.resume(); }
  function setIntensity(v) { S.intensity = v; }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (!Sound.userPaused) ctx.resume(); });
  return { loadSamples: () => SM ? SM.load(ctx) : Promise.resolve(), init, play, setMood, setKey, setPhase, stopMusic, duck, setVolumes, pause, setIntensity, get ready() { return !!ctx && ctx.state === 'running'; }, get mood() { return S.mood; }, userPaused: false, resume() { if (ctx && ctx.state !== 'running') ctx.resume(); } };
})();
