"use strict";
/* =====================================================================
   SAMPLER — instrumentos con grabaciones reales.
   Muestras: MusyngKite soundfont (CC BY-SA 3.0, vía midi-js-soundfonts de
   gleitz) y batería acústica de web-audio-samples (Apache 2.0).
   Se instala sobre Sound: si las muestras no cargan, sigue sonando el
   sintetizador de audio.js.
   ===================================================================== */
const Sampler = (() => {
  const S = { man: null, buf: {}, drum: {}, ready: false, failed: false, loading: null, base: 'samples/' };
  // volumen relativo de cada instrumento (las muestras vienen normalizadas)
  const K = { piano: 1.2, strings: .28, choir: .33, horn: .53, brass: .68, trumpet: .6, trombone: .6, tuba: .6, violin: .8, cello: .82, contrabass: .5, flute: 1.15, harp: .54, pizz: .7, dgtr: .21, ogtr: 1.2, ebass: .35, oboe: 1.1, nylon: .78, timpani: .9, celesta: .4, trem: .3,
    vln: .3, vla: .3, vc: .34, cb: .63, vlnspic: 1.1, vcspic: 1.2, vlntrem: .3, vlnpizz: 1.1, solovln: .75, horn2: .5, hornstac: .55, tpt: .5, tptstac: .5, tbn: .5, tuba2: .55, flute2: .7, oboe2: .8, clar: .7, grand: .9 };
  // bancos que se cargan (VSCO 2 CE + Salamander para lo orquestal; MusyngKite para coro, guitarras y bajo)
  const USE = ['choir', 'dgtr', 'ogtr', 'ebass', 'nylon', 'celesta', 'vln', 'vla', 'vc', 'cb', 'vlnspic', 'vcspic', 'vlntrem', 'vlnpizz', 'solovln', 'harp', 'horn', 'hornstac', 'tpt', 'tptstac', 'tbn', 'tuba', 'flute', 'oboe', 'clar', 'grand'];
  const PERC = ['bdrum', 'osnare', 'tproll', 'crash', 'swell', 'gong', 'timp'];
  const SUSTAIN = new Set(['strings', 'choir', 'horn', 'brass', 'trumpet', 'trombone', 'tuba', 'violin', 'cello', 'contrabass', 'flute', 'oboe', 'trem', 'ogtr', 'dgtr', 'vln', 'vla', 'vc', 'cb', 'vlntrem', 'solovln', 'tpt', 'tbn', 'clar']);
  async function load(ctx) {
    if (S.loading) return S.loading;
    S.loading = (async () => {
      try {
        const r = await fetch(S.base + 'manifest.json'); if (!r.ok) throw new Error('manifest'); S.man = await r.json();
        const get = async (url) => { const rr = await fetch(url); if (!rr.ok) throw new Error(url); return await ctx.decodeAudioData(await rr.arrayBuffer()); };
        const keys = Object.keys(S.man).filter(k => USE.includes(k));
        await Promise.all([
          ...keys.map(async k => { S.buf[k] = await get(S.base + k + '.mp3'); }),
          ...['kick', 'snare', 'hihat', 'tom1', 'tom2', 'tom3'].map(async d => { S.drum[d] = await get(S.base + 'drum_' + d + '.mp3'); }),
          ...PERC.map(async d => { try { S.drum[d] = await get(S.base + 'perc_' + d + '.mp3'); } catch (e) { } })
        ]);
        S.ready = true;
      } catch (e) { S.failed = true; console.warn('Samples no disponibles, se usa el sintetizador', e); }
    })();
    return S.loading;
  }
  // reproduce una nota del instrumento k
  function note(ctx, k, t, m, dur, v, dest, o = {}) {
    const man = S.man[k], b = S.buf[k]; if (!b) return null;
    let best = man.notes[0]; for (const n of man.notes) if (Math.abs(n - m) < Math.abs(best - m)) best = n;
    const idx = man.notes.indexOf(best), off = idx * man.slot + man.lead - .012, usable = man.slot - man.lead - .12;
    const rate = Math.pow(2, (m - best) / 12);
    const src = ctx.createBufferSource(); src.buffer = b;
    if (o.from !== undefined && o.from !== m && Math.abs(o.from - m) <= 7) { src.playbackRate.setValueAtTime(rate * Math.pow(2, (o.from - m) / 12), t); src.playbackRate.exponentialRampToValueAtTime(rate, t + (o.glide || .07)); }
    else src.playbackRate.setValueAtTime(rate, t);
    if (o.detune) src.detune.value = o.detune;
    const rel = o.r ?? (SUSTAIN.has(k) ? .35 : .5), total = dur + rel;
    const sustain = SUSTAIN.has(k) && !o.short;
    if (sustain && total * rate > usable - .1) { src.loop = true; src.loopStart = off + Math.min(.9, usable * .35); src.loopEnd = off + usable - .05; }
    let n = src;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = .5; n.connect(f); n = f; }
    const g = ctx.createGain(), pk = (K[k] || .4) * v, a = o.a ?? (sustain ? .04 : .003);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a);
    if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(.0001, pk * o.decay), t + a + .25);
    g.gain.setValueAtTime(o.decay ? Math.max(.0001, pk * o.decay) : pk, t + Math.max(a, dur)); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(a, dur) + rel);
    n.connect(g);
    src.start(t, off); src.stop(t + Math.max(a, dur) + rel + .05);
    return { src, g };
  }
  function drum(ctx, d, t, v, dest, o = {}) {
    const b = S.drum[d]; if (!b) return;
    const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = o.rate || 1;
    const g = ctx.createGain(); g.gain.value = v * (o.k || 1); src.connect(g);
    if (o.fadeIn) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v * (o.k || 1), t + o.fadeIn); }
    src.start(Math.max(0, t), o.off || 0);
    if (o.dur) { g.gain.setValueAtTime(v * (o.k || 1), t + o.dur); g.gain.exponentialRampToValueAtTime(.0001, t + o.dur + (o.rel || .3)); src.stop(t + o.dur + (o.rel || .3) + .05); }
    return g;
  }
  return { len: d => S.drum[d] ? S.drum[d].duration : 0, S, load, note, drum, has: k => !!S.buf[k] || !!S.drum[k], get ready() { return S.ready; }, get failed() { return S.failed; } };
})();
