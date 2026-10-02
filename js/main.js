"use strict";
/* =====================================================================
   ARRANQUE
   ===================================================================== */
Store.load();
const GAME = new Game(document.getElementById('game'));
UI.init(GAME);
GAME.resize();
addEventListener('resize', () => GAME.resize());
let __last = performance.now();
function __frame(now) {
  const dt = Math.min(.033, (now - __last) / 1000); __last = now;
  try { UI.update(dt); GAME.render(); } catch (e) { console.error(e); }
  requestAnimationFrame(__frame);
}
UI.title();
requestAnimationFrame(__frame);
Store.connect();
// la primera interacción activa el audio
addEventListener('pointerdown', () => { Sound.init(); Sound.resume(); }, { once: true });
addEventListener('keydown', () => { Sound.init(); Sound.resume(); }, { once: true });
