"use strict";
/* =====================================================================
   ENTRADA: teclado + mando (PlayStation / Xbox, mapeo estándar) + ratón
   Ningún botón del mando queda sin función:
     ✕ saltar · □ atacar (mantener = carga) · ○ esquivar · △ interactuar / disparo rúnico
     R1 bloquear/parar · R2 PALABRA DE PODER (ataque final con pregunta)
     L1 curar (mantener) · L2 garfio · L3 carrera · R3 grito de guerra
     Stick dcho. mirar alrededor · Cruceta ←/→ cambiar arma · ↑ libro rúnico · ↓ bajar de plataforma
     OPTIONS pausa · CREATE cuaderno de errores · PANEL TÁCTIL mapa del nivel
   En preguntas: △ □ ○ ✕ = opción 1 2 3 4 · L1 escuchar · L2 pista · R1 ver lección
   ===================================================================== */
const Input = (() => {
  const PAD = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, SHARE: 8, OPTIONS: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, PS: 16, PAD: 17 };
  const keys = {}, keysPrev = {}; let hits = {}, frameHits = {};
  let padState = [], padPrev = [], padVal = [], axes = [0, 0, 0, 0];
  let lastDevice = 'keyboard', padId = '', padIsPS = true, typing = false, map = null;
  const listeners = [];

  const KB = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'KeyW', 'ArrowUp'], attack: ['KeyJ'], dash: ['KeyK', 'ShiftLeft', 'ShiftRight'],
    block: ['KeyL'], ult: ['KeyU'], interact: ['KeyE', 'KeyI'], heal: ['KeyH'], grapple: ['KeyG'],
    sprint: ['KeyC'], taunt: ['KeyT'], wprev: ['KeyQ'], wnext: ['Tab'], book: ['KeyB'], notebook: ['KeyN'], map: ['KeyM'],
    pause: ['Escape', 'KeyP'], accept: ['Enter', 'NumpadEnter'], back: ['Escape', 'Backspace'],
    o1: ['Digit1', 'Numpad1'], o2: ['Digit2', 'Numpad2'], o3: ['Digit3', 'Numpad3'], o4: ['Digit4', 'Numpad4'],
    listen: ['KeyL'], hint: ['KeyH'], lesson: ['KeyB'], fullscreen: ['KeyF']
  };
  const PADACT = {
    jump: ['CROSS'], attack: ['SQUARE'], dash: ['CIRCLE'], block: ['R1'], ult: ['R2'], interact: ['TRIANGLE'],
    heal: ['L1'], grapple: ['L2'], sprint: ['L3'], taunt: ['R3'], wprev: ['LEFT'], wnext: ['RIGHT'], book: ['UP'],
    notebook: ['SHARE'], map: ['PAD'], pause: ['OPTIONS'], accept: ['CROSS'], back: ['CIRCLE'],
    o1: ['TRIANGLE'], o2: ['SQUARE'], o3: ['CIRCLE'], o4: ['CROSS'], listen: ['L1'], hint: ['L2'], lesson: ['R1'],
    up: ['UP'], down: ['DOWN'], left: ['LEFT'], right: ['RIGHT']
  };
  const padBtn = n => (map && map[n] !== undefined) ? map[n] : PAD[n];

  function onKey(e, down) {
    if (typing && !['Enter', 'NumpadEnter', 'Escape'].includes(e.code)) { if (down) lastDevice = 'keyboard'; return; }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    // Enter sobre un botón ya lo gestiona la interfaz ('accept'): evitar el doble clic nativo
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && e.target && e.target.tagName === 'BUTTON') e.preventDefault();
    if (down && keys[e.code]) return;          // ignorar autorepetición
    keys[e.code] = down; if (down) hits[e.code] = true;
    if (down) { lastDevice = 'keyboard'; listeners.forEach(f => f('key', e)); }
  }
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('keydown', e => { if (typing && ['Enter', 'NumpadEnter', 'Escape'].includes(e.code)) hits[e.code] = true; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  addEventListener('mousedown', () => { lastDevice = 'keyboard'; });
  addEventListener('gamepadconnected', e => { padId = e.gamepad.id; padIsPS = !/xbox|xinput|microsoft|045e/i.test(padId); listeners.forEach(f => f('padconnect', e.gamepad)); });
  addEventListener('gamepaddisconnected', () => listeners.forEach(f => f('paddisconnect')));

  function poll() {
    for (const k in keys) keysPrev[k] = keys[k];
    frameHits = hits; hits = {};
    padPrev = padState.slice();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null; for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (gp) {
      padState = gp.buttons.map(b => b.pressed || b.value > .45);
      padVal = gp.buttons.map(b => b.value);
      axes = [gp.axes[0] || 0, gp.axes[1] || 0, gp.axes[2] || 0, gp.axes[3] || 0];
      if (padState.some((b, i) => b && !padPrev[i]) || Math.hypot(axes[0], axes[1]) > .5) {
        if (lastDevice !== 'pad') listeners.forEach(f => f('device', 'pad'));
        lastDevice = 'pad';
      }
      if (!padId) { padId = gp.id; padIsPS = !/xbox|xinput|microsoft|045e/i.test(padId); }
    } else { padState = []; padVal = []; axes = [0, 0, 0, 0]; }
  }
  const padDown = i => !!padState[i], padPressed = i => !!padState[i] && !padPrev[i], padReleased = i => !padState[i] && !!padPrev[i];
  const kDown = c => !!keys[c] || !!frameHits[c], kPressed = c => (!!keys[c] && !keysPrev[c]) || !!frameHits[c], kReleased = c => !keys[c] && (!!keysPrev[c] || !!frameHits[c]);

  function down(act) {
    if (typing) return false;
    if (KB[act] && KB[act].some(kDown)) return true;
    if (PADACT[act] && PADACT[act].some(n => padDown(padBtn(n)))) return true;
    if (act === 'left' && axes[0] < -.4) return true;
    if (act === 'right' && axes[0] > .4) return true;
    if (act === 'up' && axes[1] < -.6) return true;
    if (act === 'down' && axes[1] > .6) return true;
    return false;
  }
  function pressed(act) {
    if (typing && act !== 'accept' && act !== 'back') return false;
    if (KB[act] && KB[act].some(kPressed)) return true;
    if (PADACT[act] && PADACT[act].some(n => padPressed(padBtn(n)))) return true;
    return false;
  }
  function released(act) {
    if (KB[act] && KB[act].some(kReleased)) return true;
    if (PADACT[act] && PADACT[act].some(n => padReleased(padBtn(n)))) return true;
    return false;
  }
  function moveX() {
    if (typing) return 0;
    let v = 0; if (KB.left.some(kDown) || padDown(PAD.LEFT)) v -= 1; if (KB.right.some(kDown) || padDown(PAD.RIGHT)) v += 1;
    if (Math.abs(axes[0]) > .2) v = clamp((Math.abs(axes[0]) - .2) / .6, 0, 1) * Math.sign(axes[0]);
    return v;
  }
  const look = () => [Math.abs(axes[2]) > .25 ? axes[2] : 0, Math.abs(axes[3]) > .25 ? axes[3] : 0];

  const navHeld = {}, navT = {};
  function nav(dt) {
    const out = [];
    for (const d of ['up', 'down', 'left', 'right']) {
      const isDown = (!typing && KB[d].some(kDown)) || padDown(PAD[d.toUpperCase()]) ||
        (d === 'left' && axes[0] < -.6) || (d === 'right' && axes[0] > .6) || (d === 'up' && axes[1] < -.6) || (d === 'down' && axes[1] > .6);
      if (isDown) {
        if (!navHeld[d]) { out.push(d); navT[d] = .36; } else { navT[d] -= dt; if (navT[d] <= 0) { out.push(d); navT[d] = .085; } }
        navHeld[d] = 1;
      } else navHeld[d] = 0;
    }
    return out;
  }
  const PSG = { jump: '✕', attack: '□', dash: '○', block: 'R1', ult: 'R2', interact: '△', heal: 'L1', grapple: 'L2', sprint: 'L3', taunt: 'R3', wprev: '◁', wnext: '▷', book: '△↑', notebook: 'CREATE', map: 'PANEL', pause: 'OPTIONS', accept: '✕', back: '○', listen: 'L1', hint: 'L2', lesson: 'R1', o1: '△', o2: '□', o3: '○', o4: '✕', look: 'R-stick', down: '↓' };
  const XBG = { jump: 'A', attack: 'X', dash: 'B', block: 'RB', ult: 'RT', interact: 'Y', heal: 'LB', grapple: 'LT', sprint: 'LS', taunt: 'RS', wprev: '◁', wnext: '▷', book: '↑', notebook: 'VIEW', map: 'VIEW', pause: 'MENU', accept: 'A', back: 'B', listen: 'LB', hint: 'LT', lesson: 'RB', o1: 'Y', o2: 'X', o3: 'B', o4: 'A', look: 'R-stick', down: '↓' };
  const KBG = { jump: 'Espacio', attack: 'J', dash: 'K', block: 'L', ult: 'U', interact: 'E', heal: 'H', grapple: 'G', sprint: 'C', taunt: 'T', wprev: 'Q', wnext: 'Tab', book: 'B', notebook: 'N', map: 'M', pause: 'Esc', accept: 'Enter', back: 'Esc', listen: 'L', hint: 'H', lesson: 'B', o1: '1', o2: '2', o3: '3', o4: '4', look: '—', down: 'S' };
  PSG.book = '↑';
  function glyph(act) { return (lastDevice === 'pad' ? (padIsPS ? PSG : XBG) : KBG)[act] || act; }
  function glyphClass(act) {
    if (lastDevice !== 'pad' || !padIsPS) return 'key';
    return ({ o1: 'tri', o2: 'sq', o3: 'ci', o4: 'cr', interact: 'tri', attack: 'sq', dash: 'ci', jump: 'cr', accept: 'cr', back: 'ci' })[act] || 'key';
  }
  let rumbleOn = true;
  function rumble(strong, weak, ms) {
    if (!rumbleOn) return;
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.vibrationActuator && p.vibrationActuator.playEffect)
        p.vibrationActuator.playEffect('dual-rumble', { startDelay: 0, duration: ms | 0, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) }).catch(() => { });
    } catch (e) { }
  }
  return {
    PAD, poll, down, pressed, released, moveX, look, nav, glyph, glyphClass, rumble,
    get device() { return lastDevice; }, get padConnected() { return padState.length > 0; }, get padId() { return padId; }, get isPS() { return padIsPS; },
    trigger(i) { return padVal[i] || 0; },
    rawPadPressed() { for (let i = 0; i < padState.length; i++) if (padPressed(i)) return i; return -1; },
    setMap(m) { map = m; }, setTyping(v) { typing = v; if (v) for (const k in keys) keys[k] = false; }, get typing() { return typing; },
    setRumble(v) { rumbleOn = v; }, on(f) { listeners.push(f); }, clearKeys() { for (const k in keys) keys[k] = false; }
  };
})();
