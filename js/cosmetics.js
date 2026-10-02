"use strict";
/* =====================================================================
   PERSONALIZACIÓN — armario con piezas gratis y piezas que se compran
   con MONEDAS ganadas jugando. Cofre de la suerte (sorpresa garantizada).
   ===================================================================== */
const LOOK = {
  skin: [
    { id: 'peach', name: 'Melocotón', c: '#f6d2b4', s: '#e2ae8e', price: 0 },
    { id: 'honey', name: 'Miel', c: '#e8b48a', s: '#cc916a', price: 0 },
    { id: 'tan', name: 'Canela', c: '#c98a5e', s: '#a66c44', price: 0 },
    { id: 'cocoa', name: 'Cacao', c: '#9a6440', s: '#7a4a2c', price: 0 },
    { id: 'ebony', name: 'Ébano', c: '#6e452c', s: '#53311e', price: 0 },
    { id: 'frost', name: 'Escarcha (élfico)', c: '#bfe6f0', s: '#94c4d4', price: 250 },
    { id: 'sprout', name: 'Brote (dríade)', c: '#b8dc98', s: '#92b874', price: 250 }
  ],
  hair: [
    { id: 'brown', name: 'Castaño', c: '#5a3a24', price: 0 },
    { id: 'black', name: 'Negro', c: '#22202a', price: 0 },
    { id: 'blonde', name: 'Rubio', c: '#e8c060', price: 0 },
    { id: 'ginger', name: 'Pelirrojo', c: '#c4502c', price: 0 },
    { id: 'white', name: 'Plata', c: '#f0f0f8', price: 60 },
    { id: 'violet', name: 'Violeta', c: '#8a5ad8', price: 90 },
    { id: 'sky', name: 'Celeste', c: '#5ab8f0', price: 90 },
    { id: 'rose', name: 'Rosa', c: '#ff8ab8', price: 90 }
  ],
  cloak: [
    { id: 'teal', name: 'Turquesa', c: ['#3a8389', '#1b3c45'], h: ['#4da0a3', '#245159'], price: 0 },
    { id: 'navy', name: 'Marino', c: ['#2c3e6a', '#16203c'], h: ['#3b5288', '#1e2c52'], price: 0 },
    { id: 'forest', name: 'Bosque', c: ['#4f7a3a', '#2a4424'], h: ['#6a9a48', '#335428'], price: 0 },
    { id: 'wine', name: 'Vino', c: ['#7a2a3a', '#3a1018'], h: ['#9a3a4a', '#4a1a24'], price: 0 },
    { id: 'sand', name: 'Duna', c: ['#c8a46a', '#7a5a30'], h: ['#e0c088', '#8a6a3a'], price: 80 },
    { id: 'coal', name: 'Carbón', c: ['#3a2c2c', '#1a1212'], h: ['#4a3434', '#221818'], price: 120 },
    { id: 'royal', name: 'Real', c: ['#5a2a8a', '#2a104a'], h: ['#7a4aaa', '#3a1a5a'], price: 160 },
    { id: 'snow', name: 'Nieve', c: ['#e8eef4', '#9aa8b8'], h: ['#ffffff', '#b8c4d4'], price: 200 },
    { id: 'aurora', name: 'Aurora', c: ['#b8a8ff', '#5a7ad8'], h: ['#e8e0ff', '#7a8ae8'], price: 350, shimmer: 1 },
    { id: 'gold', name: 'Oro rúnico', c: ['#e8c050', '#8a6010'], h: ['#ffe080', '#a07818'], price: 600, shimmer: 1 },
    { id: 'void', name: 'Vacío', c: ['#1a1428', '#05040a'], h: ['#2a2040', '#0a0814'], price: 500, stars: 1 }
  ],
  scarf: [
    { id: 'red', name: 'Rojo', c: ['#c2432f', '#a63526'], price: 0 },
    { id: 'yellow', name: 'Mostaza', c: ['#e8b030', '#c08a18'], price: 0 },
    { id: 'blue', name: 'Celeste', c: ['#4ab0e8', '#2a80c0'], price: 0 },
    { id: 'stripes', name: 'Marinero', c: ['#f0ece0', '#c23a2e'], price: 90 },
    { id: 'mint', name: 'Menta', c: ['#7ae8c0', '#3ab08a'], price: 70 },
    { id: 'rainbow', name: 'Arcoíris', c: ['#ff5a5a', '#ffb03a', '#ffe85a', '#5ae88a', '#5ab0ff', '#a05aff'], price: 300 },
    { id: 'flame', name: 'Llama viva', c: ['#ff8a2a', '#ffd04a'], price: 450, glow: [255, 140, 40] },
    { id: 'stars', name: 'Constelación', c: ['#1a1a4a', '#2a2a6a'], price: 400, sparkle: 1 }
  ],
  hat: [
    { id: 'hood', name: 'Capucha', price: 0 },
    { id: 'bandana', name: 'Pañuelo pirata', price: 60 },
    { id: 'tricorn', name: 'Tricornio', price: 150 },
    { id: 'flowers', name: 'Corona de flores', price: 120 },
    { id: 'wizard', name: 'Sombrero de mago', price: 220 },
    { id: 'cat', name: 'Orejas de gato', price: 180 },
    { id: 'horns', name: 'Yelmo con cuernos', price: 260 },
    { id: 'crown', name: 'Corona', price: 500 },
    { id: 'halo', name: 'Aureola', price: 700 }
  ],
  eyes: [
    { id: 'amber', name: 'Ámbar', c: [196, 126, 40], price: 0 },
    { id: 'cyan', name: 'Cian', c: [40, 170, 210], price: 0 },
    { id: 'brown', name: 'Avellana', c: [120, 76, 40], price: 0 },
    { id: 'green', name: 'Esmeralda', c: [50, 160, 80], price: 40 },
    { id: 'pink', name: 'Rosa', c: [230, 90, 170], price: 40 },
    { id: 'red', name: 'Carmesí', c: [210, 40, 60], price: 100 },
    { id: 'white', name: 'Estelar', c: [150, 200, 255], price: 100 }
  ],
  back: [
    { id: 'pack', name: 'Mochila y farol', price: 0 },
    { id: 'none', name: 'Nada', price: 0 },
    { id: 'cape', name: 'Capa larga', price: 140 },
    { id: 'wings', name: 'Alas de hada', price: 450 },
    { id: 'runewings', name: 'Alas rúnicas', price: 900 }
  ],
  trail: [
    { id: 'none', name: 'Ninguna', price: 0 },
    { id: 'sparkle', name: 'Chispitas', price: 150 },
    { id: 'petals', name: 'Pétalos', price: 180 },
    { id: 'bubbles', name: 'Burbujas', price: 180 },
    { id: 'notes', name: 'Notas musicales', price: 220 },
    { id: 'flames', name: 'Llamas', price: 350 },
    { id: 'letters', name: 'Letras doradas (ABC)', price: 400 }
  ]
};
const LOOK_DEFAULT = { skin: 'honey', hair: 'brown', cloak: 'teal', scarf: 'red', hat: 'hood', eyes: 'amber', back: 'pack', trail: 'none' };
const lookPart = (cat, id) => LOOK[cat].find(p => p.id === id) || LOOK[cat][0];
function lookOwned(cat, id) { const p = lookPart(cat, id); return p.price === 0 || !!(Store.data.owned && Store.data.owned[cat + ':' + id]); }
function currentLook() { return Object.assign({}, LOOK_DEFAULT, Store.data.look || {}); }
function lookPalette(look = currentLook()) {
  const cl = lookPart('cloak', look.cloak), sc = lookPart('scarf', look.scarf), ey = lookPart('eyes', look.eyes), sk = lookPart('skin', look.skin), hr = lookPart('hair', look.hair);
  return { skin: sk.c, skinS: sk.s, hair: hr.c, cloak: cl.c, hood: cl.h, scarf: sc.c, scarfDef: sc, eye: ey.c, trim: '#5a3b22', boot: '#3e2b1f', hat: look.hat, back: look.back, trail: look.trail, cloakDef: cl };
}
function buyPart(cat, id) {
  const p = lookPart(cat, id); const d = Store.data; d.owned = d.owned || {};
  if (lookOwned(cat, id)) return 'owned';
  if ((d.coins || 0) < p.price) return 'poor';
  d.coins -= p.price; d.owned[cat + ':' + id] = 1; Store.save(true); return 'ok';
}
function luckyChest() {
  const d = Store.data, cost = 150; if ((d.coins || 0) < cost) return { res: 'poor', cost };
  const locked = []; for (const cat in LOOK) for (const p of LOOK[cat]) if (!lookOwned(cat, p.id)) locked.push([cat, p]);
  if (!locked.length) return { res: 'all' };
  // más probable lo barato, pero puede tocar algo valioso
  const w = locked.map(([c, p]) => 1 / Math.sqrt(p.price || 1)); const tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, k = 0;
  for (; k < w.length; k++) { r -= w[k]; if (r <= 0) break; }
  const [cat, p] = locked[Math.min(k, locked.length - 1)];
  d.coins -= cost; d.owned = d.owned || {}; d.owned[cat + ':' + p.id] = 1; Store.save(true);
  return { res: 'ok', cat, part: p, rare: p.price >= 400 };
}

/* --- dibujo de sombreros, espalda y estelas sobre el héroe (espacio local mirando a la derecha) --- */
function drawHat(g, hat, t) {
  if (hat === 'tricorn') { g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(-16, -60); g.quadraticCurveTo(1, -80, 18, -60); g.quadraticCurveTo(1, -66, -16, -60); g.fill(); g.fillStyle = '#c9a23a'; g.fillRect(-8, -64, 16, 2); g.fillStyle = '#fff'; g.font = '8px sans-serif'; g.fillText('☠', -3, -66); }
  else if (hat === 'bandana') { g.fillStyle = '#c23a2e'; g.beginPath(); g.arc(1, -56, 13.5, Math.PI * 1.05, Math.PI * 1.95); g.fill(); g.beginPath(); g.moveTo(-12, -58); g.lineTo(-22, -54 + Math.sin(t * 6) * 2); g.lineTo(-20, -50); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-6 + i * 5, -62, 1.2, 0, TAU); g.fill(); } }
  else if (hat === 'flowers') { const C = ['#ff7ab0', '#ffe060', '#8ae0ff', '#ff9a5a', '#c88aff']; for (let i = 0; i < 5; i++) { const a = Math.PI + .3 + i * .6; g.fillStyle = C[i]; g.beginPath(); g.arc(1 + Math.cos(a) * 13, -55 + Math.sin(a) * 12, 3.6, 0, TAU); g.fill(); g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(1 + Math.cos(a) * 13, -55 + Math.sin(a) * 12, 1.2, 0, TAU); g.fill(); } }
  else if (hat === 'wizard') { g.fillStyle = '#3a2a8a'; g.beginPath(); g.moveTo(-15, -60); g.lineTo(18, -60); g.lineTo(6 + Math.sin(t * 2) * 2, -96); g.closePath(); g.fill(); g.fillStyle = '#ffe060'; g.beginPath(); g.arc(4, -76, 2.2, 0, TAU); g.arc(-2, -66, 1.5, 0, TAU); g.fill(); g.fillStyle = '#2a1a6a'; g.fillRect(-17, -62, 37, 4); }
  else if (hat === 'cat') { g.fillStyle = '#2a2430'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(1 + s * 4, -63); g.lineTo(1 + s * 12, -76); g.lineTo(1 + s * 13, -60); g.fill(); g.fillStyle = '#ff9ac0'; g.beginPath(); g.moveTo(1 + s * 6, -64); g.lineTo(1 + s * 11, -71); g.lineTo(1 + s * 11, -62); g.fill(); g.fillStyle = '#2a2430'; } }
  else if (hat === 'horns') { g.fillStyle = '#9aa0b0'; g.beginPath(); g.arc(1, -56, 14, Math.PI, 0); g.fill(); g.fillStyle = '#e8e0d0'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(1 + s * 10, -62); g.quadraticCurveTo(1 + s * 24, -66, 1 + s * 22, -82); g.quadraticCurveTo(1 + s * 18, -70, 1 + s * 6, -66); g.fill(); } }
  else if (hat === 'crown') { g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(-10, -64); g.lineTo(-11, -76); g.lineTo(-5, -70); g.lineTo(1, -80); g.lineTo(7, -70); g.lineTo(13, -76); g.lineTo(12, -64); g.closePath(); g.fill(); g.strokeStyle = '#a07818'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#ff4a6a'; g.beginPath(); g.arc(1, -69, 2, 0, TAU); g.fill(); }
  else if (hat === 'halo') { g.strokeStyle = '#fff3a0'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(1, -74 + Math.sin(t * 2) * 1.5, 12, 3.5, 0, 0, TAU); g.stroke(); }
}
function drawBack(g, back, t, h) {
  if (back === 'wings' || back === 'runewings') {
    const flap = Math.sin(t * (h && !h.onGround ? 14 : 3)) * .25;
    for (const s of [1, .7]) {
      g.save(); g.translate(-8, -38); g.rotate(-.5 - flap * s);
      g.fillStyle = back === 'wings' ? 'rgba(200,240,255,.55)' : 'rgba(150,220,255,.35)'; g.strokeStyle = back === 'wings' ? 'rgba(255,255,255,.8)' : '#8ae0ff'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-30 * s, -30, -42 * s, -6); g.quadraticCurveTo(-26 * s, 4, 0, 0); g.fill(); g.stroke();
      if (back === 'runewings') { g.fillStyle = '#bff2ff'; g.font = '8px Georgia'; g.fillText('ᚠ', -26 * s, -10); }
      g.restore();
    }
  }
}
function trailParticle(trail, x, y) {
  if (trail === 'none') return;
  const T = {
    sparkle: { t: 'star', col: [255, 240, 160], s: 2.5, add: 1, g: -20 }, petals: { t: 'leaf', col: [255, 160, 200], s: 2.5, g: 120 }, bubbles: { t: 'spore', col: [180, 230, 255], s: 3, g: -40 },
    notes: { t: 'rune', col: [255, 255, 255], s: 5, add: 1, ch: '♪', g: -30 }, flames: { t: 'ember', s: 2.4, g: -40 }, letters: { t: 'rune', col: [255, 220, 120], s: 5, add: 1, ch: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[RI(0, 25)], g: -20 }
  }[trail]; if (!T) return;
  FX.spawnRaw(Object.assign({ x: x + R(-6, 6), y: y + R(-6, 6), vx: R(-20, 20), vy: R(-30, 10), drag: 1, max: R(.6, 1), rot: R(0, TAU), vr: R(-4, 4) }, T));
}
