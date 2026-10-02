"use strict";
/* =====================================================================
   OBJETOS INTERACTIVOS DEL NIVEL
   ===================================================================== */
const NPCS = {
  mira: { name: 'Mira la exploradora', col: '#e8b030', lines: [['Hello! I am Mira. Nice to meet you!', '¡Hola! Soy Mira. ¡Encantada de conocerte!'], ['There are secret walls in this cave. Walk into them!', 'Hay paredes secretas en esta cueva. ¡Camina contra ellas!'], ['The top path is dangerous, but there is a golden letter.', 'El camino de arriba es peligroso, pero hay una letra dorada.']] },
  bram: { name: 'Bram el pescador', col: '#4ab0e8', lines: [['Ahoy! I am an old fisherman. I know a secret place.', '¡Ahoy! Soy un viejo pescador. Conozco un lugar secreto.'], ['Answer three questions and I will open a portal for you.', 'Responde tres preguntas y te abriré un portal.']], quiz: 3 },
  otto: { name: 'Otto the Baker', col: '#d89a5a', lines: [['Good morning! I bake bread every day.', '¡Buenos días! Hago pan todos los días.']] },
  nia: { name: 'Nia the Painter', col: '#c88aff', lines: [['Hi! I love colours. My favourite colour is blue.', '¡Hola! Me encantan los colores. Mi color favorito es el azul.']] },
  pip: { name: 'Pip the Little Robot', col: '#9ab0c8', lines: [['Beep! I am a small robot. I can help you.', '¡Bip! Soy un robot pequeño. Puedo ayudarte.']] },
  lyra: { name: 'Lyra, espíritu del bosque', col: '#7ae8c0', lines: [['Psst... Can you hear the trees? They are whispering.', 'Psst... ¿Oyes los árboles? Están susurrando.'], ['If you answer my questions, I will show you the cloud garden.', 'Si respondes a mis preguntas, te mostraré el jardín de las nubes.']], quiz: 3 }
};
const WONDERS = {
  giant: { name: '¡GIGANTE!', es: 'Te vuelves enorme y aplastas todo durante 20 segundos.' },
  lowgrav: { name: '¡LUNA!', es: 'La gravedad se vuelve lunar y llueven monedas.' },
  jelly: { name: '¡GELATINA!', es: 'La lava se convierte en gelatina que rebota.' }
};

class LevelObject {
  constructor(game, d) { Object.assign(this, d); this.game = game; this.t = R(0, 9); this.done = false; this.near = false; }
  get hero() { return this.game.hero; }
  heroNear(r = 80, dy = 90) { const H = this.hero; return Math.abs(H.x - this.x) < r && Math.abs(H.y - this.y) < dy; }
  update(dt) { this.t += dt; }
  draw(g) { } drawGlow(g) { } prompt() { return null; } interact() { return false; }
}

class Checkpoint extends LevelObject {
  label() { return this.active ? null : { en: 'Checkpoint', es: 'punto de control', verb: ['Touch the flag', 'Toca la bandera'] }; }
  labelY() { return this.y - 140; }
  constructor(game, d) { super(game, d); this.flag = new Flag(this.x + 2, this.y - 118, 44, 28, '#c2432f', 'ᚱ'); this.active = !!d.first; }
  update(dt) {
    super.update(dt); this.flag.update(dt, this.game.windAt(this.x, this.y), this.game.t);
    if (!this.active && this.heroNear(50, 100)) {
      this.active = true; this.game.setCheckpoint(this); Sound.play('checkpoint'); FX.runeBurst(this.x, this.y - 60, [255, 220, 120], 12); FX.text(this.x, this.y - 150, 'CHECKPOINT!', '#ffe9a0', 34);
      const H = this.hero; H.hp = Math.min(H.maxHp, H.hp + H.maxHp * .3); H.flasks = H.maxFlasks; Input.rumble(.1, .3, 120);
    }
  }
  draw(g) {
    this.flag.y = this.y - 118 + (this.active ? 0 : 70); this.flag.draw(g);
    g.fillStyle = '#6a6a7a'; g.beginPath(); g.moveTo(this.x - 20, this.y); g.lineTo(this.x - 14, this.y - 26); g.lineTo(this.x + 14, this.y - 26); g.lineTo(this.x + 20, this.y); g.fill();
    g.fillStyle = this.active ? '#ffe080' : '#9aa0b0'; g.font = '16px Georgia'; g.textAlign = 'center'; g.fillText('ᚱ', this.x, this.y - 8);
  }
  drawGlow(g) { if (this.active) glowAt(g, [255, 210, 120], this.x, this.y - 14, 40, .5 + Math.sin(this.t * 2) * .1); }
}

class Gate extends LevelObject {
  constructor(game, d) { super(game, d); this.solid = { x: this.x - 22, y: this.y - 170, w: 44, h: 170, solid: true, mat: 'rock', dynamic: true, gate: this }; game.world.solids.push(this.solid); game.world._index(this.solid, this.solid.x, this.solid.x + this.solid.w); this.shake = 0; }
  prompt() { return this.done ? null : this.heroNear(110, 140) ? { act: 'interact', text: (this.format === 'type' ? 'Write to open' : this.format === 'build' ? 'Build the sentence to open' : 'Answer to open') } : null; }
  label() { return this.done ? null : { en: 'Rune door', es: 'puerta rúnica', verb: ['Open it with English', 'Ábrela con inglés'] }; }
  labelY() { return this.y - 200; }
  interact() {
    if (this.done) return false;
    this.game.askQuestion({ kind: 'gate', format: this.format, title: this.label || 'PUERTA RÚNICA', onResult: (ok, res, q) => { if (ok) this.open(); else { this.shake = .5; this.attempts = (this.attempts || 0) + 1; } } });
    return true;
  }
  open() { this.done = true; this.solid.gone = true; Sound.play('gate'); FX.chunks(this.x, this.y - 80, [150, 150, 170], 16, 400, 1.3); FX.runeBurst(this.x, this.y - 90, [140, 230, 255], 16); this.game.shake(8, .4); FX.text(this.x, this.y - 200, 'OPEN!', '#9be6ff', 54); }
  update(dt) { super.update(dt); this.shake = Math.max(0, this.shake - dt); }
  draw(g) {
    if (this.done) { g.fillStyle = '#5a5a6a'; g.fillRect(this.x - 34, this.y - 10, 68, 10); return; }
    const sx = this.shake > 0 ? Math.sin(this.t * 60) * 4 : 0;
    g.save(); g.translate(this.x + sx, this.y);
    const gr = g.createLinearGradient(-22, 0, 22, 0); gr.addColorStop(0, '#4a4a5a'); gr.addColorStop(.5, '#7a7a8c'); gr.addColorStop(1, '#3a3a48');
    g.fillStyle = gr; g.beginPath(); g.roundRect(-22, -170, 44, 170, [22, 22, 0, 0]); g.fill(); g.strokeStyle = '#2a2a34'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#5a5a6a'; g.fillRect(-34, -176, 68, 14); g.fillRect(-30, -6, 60, 6);
    const runes = this.format === 'type' ? ['W', 'R', 'I', 'T', 'E'] : this.format === 'build' ? ['A', 'B', 'C'] : ['?'];
    g.fillStyle = `rgba(150,230,255,${.6 + Math.sin(this.t * 3) * .3})`; g.font = '700 18px Georgia'; g.textAlign = 'center';
    runes.forEach((c, i) => g.fillText(c, 0, -140 + i * (110 / runes.length)));
    g.restore();
  }
  drawGlow(g) { if (!this.done) glowAt(g, [140, 220, 255], this.x, this.y - 90, 70, .35 + Math.sin(this.t * 3) * .1); }
}

class Shrine extends LevelObject {
  prompt() { return this.done ? null : this.heroNear(80, 100) ? { act: 'interact', text: 'Shrine: bonus question' } : null; }
  label() { return this.done ? null : { en: 'Shrine', es: 'santuario', verb: ['Answer for a reward', 'Responde y gana un premio'] }; }
  interact() {
    if (this.done) return false;
    this.game.askQuestion({ kind: 'shrine', title: 'SANTUARIO', onResult: ok => { if (ok) { this.done = true; const H = this.hero; H.hp = Math.min(H.maxHp, H.hp + H.maxHp * .5); H.flasks = Math.min(H.maxFlasks, H.flasks + 1); this.game.dropCoins(this.x, this.y - 60, 12); FX.runeBurst(this.x, this.y - 50, [255, 230, 140], 18); FX.text(this.x, this.y - 130, 'BLESSED!', '#ffe9a0', 44); Sound.play('heal'); } } });
    return true;
  }
  draw(g) {
    g.fillStyle = '#7a7a8a'; g.beginPath(); g.moveTo(this.x - 26, this.y); g.lineTo(this.x - 18, this.y - 30); g.lineTo(this.x + 18, this.y - 30); g.lineTo(this.x + 26, this.y); g.fill();
    const y = this.y - 56 + Math.sin(this.t * 2) * 5, c = this.done ? [120, 120, 140] : [255, 220, 120];
    g.fillStyle = rgba(c); g.beginPath(); g.moveTo(this.x, y - 22); g.lineTo(this.x + 12, y); g.lineTo(this.x, y + 22); g.lineTo(this.x - 12, y); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(this.x, y - 22); g.lineTo(this.x + 12, y); g.lineTo(this.x + 2, y - 2); g.fill();
  }
  drawGlow(g) { if (!this.done) glowAt(g, [255, 220, 120], this.x, this.y - 56, 60, .55 + Math.sin(this.t * 2) * .15); }
}

class Chest extends LevelObject {
  prompt() { return this.done ? null : this.heroNear(70, 80) ? { act: 'interact', text: this.lock ? 'Word lock: write to open' : 'Open the chest' } : null; }
  label() { return this.done ? null : { en: this.tier === 'gold' ? 'Golden chest' : this.tier === 'silver' ? 'Silver chest' : 'Chest', es: this.tier === 'gold' ? 'cofre de oro' : this.tier === 'silver' ? 'cofre de plata' : 'cofre', verb: ['Open it', 'Ábrelo'] }; }
  labelY() { return this.y - 60; }
  interact() {
    if (this.done) return false;
    if (this.lock) { this.game.askQuestion({ kind: 'chest', format: 'type', title: 'CERRADURA DE PALABRAS', onResult: ok => { if (ok) this.open(); else FX.text(this.x, this.y - 60, 'LOCKED', '#ff9a9a', 26); } }); return true; }
    this.open(); return true;
  }
  open() {
    this.done = true; this.openT = 0; Sound.play('gate'); Input.rumble(.2, .4, 200);
    const coins = { wood: RI(8, 14), silver: RI(20, 30), gold: RI(45, 70) }[this.tier]; this.game.dropCoins(this.x, this.y - 30, coins);
    if (this.tier !== 'wood') this.game.gainCrystals(this.tier === 'gold' ? 8 : 4, this.x, this.y - 40);
    if (this.tier === 'gold' || (this.tier === 'silver' && chance(.35))) this.game.giftCosmetic(this.x, this.y - 60, this.rare);
    FX.text(this.x, this.y - 90, this.tier === 'gold' ? 'TREASURE!' : 'LOOT!', '#ffd040', this.tier === 'gold' ? 52 : 38);
    this.game.stats.chests++;
  }
  update(dt) { super.update(dt); if (this.openT !== undefined) this.openT += dt; }
  draw(g) {
    const col = { wood: ['#8a5a2a', '#c9a23a'], silver: ['#6a7a8a', '#e0e8f0'], gold: ['#b8861a', '#ffe060'] }[this.tier];
    g.save(); g.translate(this.x, this.y);
    g.fillStyle = col[0]; g.beginPath(); g.roundRect(-20, -20, 40, 20, 3); g.fill(); g.strokeStyle = col[1]; g.lineWidth = 3; g.strokeRect(-20, -20, 40, 20);
    const op = this.openT !== undefined ? Math.min(1, this.openT * 4) * 1.9 : 0;
    g.save(); g.translate(-20, -20); g.rotate(-op);
    g.fillStyle = col[0]; g.beginPath(); g.roundRect(0, -14, 40, 14, [7, 7, 0, 0]); g.fill(); g.strokeStyle = col[1]; g.stroke(); g.restore();
    if (!this.done) { g.fillStyle = col[1]; g.beginPath(); g.arc(0, -18, 3.5, 0, TAU); g.fill(); if (this.lock) { g.fillStyle = '#9be6ff'; g.font = '700 11px Georgia'; g.textAlign = 'center'; g.fillText('ABC', 0, -4); } }
    g.restore();
  }
  drawGlow(g) {
    if (!this.done) glowAt(g, this.tier === 'gold' ? [255, 220, 90] : this.tier === 'silver' ? [200, 230, 255] : [255, 200, 120], this.x, this.y - 16, this.tier === 'gold' ? 60 : 34, .4 + Math.sin(this.t * 3) * .1);
    else if (this.openT < 2) { g.globalAlpha = (1 - this.openT / 2) * .7; const gr = g.createLinearGradient(0, this.y - 300, 0, this.y); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(1, 'rgba(255,240,180,.9)'); g.fillStyle = gr; g.beginPath(); g.moveTo(this.x - 14, this.y - 20); g.lineTo(this.x + 14, this.y - 20); g.lineTo(this.x + 50, this.y - 300); g.lineTo(this.x - 50, this.y - 300); g.fill(); g.globalAlpha = 1; }
  }
}

class Letter extends LevelObject {
  update(dt) { super.update(dt); if (!this.done && this.heroNear(34, 50)) { this.done = true; this.game.collectLetter(this); } }
  draw(g) {
    if (this.done) return; const y = this.y + Math.sin(this.t * 2.4) * 6, s = 1 + Math.sin(this.t * 4) * .05;
    g.save(); g.translate(this.x, y); g.scale(Math.cos(this.t * 1.5) * .3 + .7, 1); g.scale(s, s);
    g.font = '900 40px "Bangers", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = '#7a4a10'; g.strokeText(this.ch, 0, 0);
    const gr = g.createLinearGradient(0, -20, 0, 20); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.5, '#ffd040'); gr.addColorStop(1, '#c8861a'); g.fillStyle = gr; g.fillText(this.ch, 0, 0);
    g.restore();
  }
  drawGlow(g) { if (!this.done) { glowAt(g, [255, 220, 100], this.x, this.y, 50, .7); if (chance(.15)) FX.spawnRaw({ t: 'star', x: this.x + R(-20, 20), y: this.y + R(-20, 20), vx: 0, vy: -30, g: 0, max: .8, s: 3, col: [255, 240, 160], rot: 0, vr: 3, add: 1 }); } }
}

class Coin extends LevelObject {
  constructor(game, d) { super(game, d); this.vx = d.vx || 0; this.vy = d.vy || 0; this.free = !!d.free; this.life = d.life || 0; }
  update(dt) {
    super.update(dt); const H = this.hero, dx = H.x - this.x, dy = H.y - 30 - this.y, d = Math.hypot(dx, dy);
    if (this.free) { this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; const gy = this.game.world.floorAt(this.x, this.y - 6); if (this.y > gy - 8 && this.vy > 0) { this.y = gy - 8; this.vy *= -.45; this.vx *= .7; } this.life += dt; }
    const mag = (this.free && this.life > .4) || d < 90 ? 1 : 0;
    if (mag && d < 160) { this.x += dx / d * Math.min(d, 900 * dt); this.y += dy / d * Math.min(d, 900 * dt); this.free = false; }
    if (d < 22) { this.done = true; this.game.collectCoin(this.x, this.y); }
  }
  draw(g) { const w = Math.abs(Math.cos(this.t * 4)) * 8 + 1; g.fillStyle = '#c8861a'; g.beginPath(); g.ellipse(this.x, this.y, w + 1, 9, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd848'; g.beginPath(); g.ellipse(this.x, this.y, w, 8, 0, 0, TAU); g.fill(); if (w > 4) { g.fillStyle = '#fff6b0'; g.fillRect(this.x - 1, this.y - 5, 2, 10); } }
  drawGlow(g) { glowAt(g, [255, 210, 80], this.x, this.y, 14, .35); }
}
class Crystal extends Coin {
  update(dt) { LevelObject.prototype.update.call(this, dt); const H = this.hero, dx = H.x - this.x, dy = H.y - 30 - this.y, d = Math.hypot(dx, dy); if (this.free) { this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; const gy = this.game.world.floorAt(this.x, this.y - 6); if (this.y > gy - 10 && this.vy > 0) { this.y = gy - 10; this.vy *= -.4; this.vx *= .6; } this.life += dt; } if ((this.life > .5 || d < 90) && d < 180) { this.free = false; this.x += dx / d * Math.min(d, 800 * dt); this.y += dy / d * Math.min(d, 800 * dt); } if (d < 24) { this.done = true; this.game.gainCrystals(1); Sound.play('pickup'); } }
  draw(g) { const y = this.y; g.fillStyle = '#7ae8ff'; g.beginPath(); g.moveTo(this.x, y - 11); g.lineTo(this.x + 7, y); g.lineTo(this.x, y + 11); g.lineTo(this.x - 7, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(this.x, y - 11); g.lineTo(this.x + 7, y); g.lineTo(this.x + 1, y - 1); g.fill(); }
  drawGlow(g) { glowAt(g, [120, 230, 255], this.x, this.y, 22, .55); }
}

class NPC extends LevelObject {
  constructor(game, d) { super(game, d); this.def = NPCS[d.npc]; this.line = 0; this.solved = false; }
  prompt() { return this.heroNear(90, 90) ? { act: 'interact', text: 'Talk to ' + this.def.name.split(' ')[0] } : null; }
  label() { return { en: this.def.name.split(',')[0], es: '', verb: ['Talk', 'Hablar'] }; }
  labelY() { return this.y - 100; }
  interact() {
    const G = this.game;
    if (this.quest) {
      const q = this.quest;
      if (G.questsDone.has(q.id)) { G.say(this, 'Thank you so much! You are very kind.', '¡Muchísimas gracias! Eres muy amable.'); return true; }
      if (q.kind === 'bring' && G.hero.carry && G.hero.carry.qid === q.id) { G.say(this, `My ${QUEST_ITEMS[q.item][0]}! Thank you!`, `¡Mi ${QUEST_ITEMS[q.item][1]}! ¡Gracias!`); G.completeQuest(); return true; }
      if (!G.quest || G.quest.id !== q.id) { G.startQuest(this, Object.assign({ giver: this.npc }, q)); G.say(this, G.quest.en, G.quest.es); Speech.say(G.quest.en, .9); return true; }
      G.say(this, G.quest.en, G.quest.es); Speech.say(G.quest.en, .9); return true;
    }
    const L = this.def.lines; const ln = L[Math.min(this.line, L.length - 1)];
    this.game.say(this, ln[0], ln[1]); Speech.say(ln[0], .9);
    this.line++;
    if (this.line >= L.length && this.def.quiz && !this.solved) {
      setTimeout(() => this.game.npcQuiz(this, this.def.quiz, ok => { if (ok) { this.solved = true; this.game.unlockSecret(this.portal, this.x + 80, this.y); } }), 600);
    }
    return true;
  }
  draw(g) {
    const t = this.t, c = this.def.col; g.save(); g.translate(this.x, this.y); g.scale(Math.sign(this.hero.x - this.x) || 1, 1);
    g.fillStyle = '#2a2a34'; g.fillRect(-8, -16, 6, 16); g.fillRect(2, -16, 6, 16);
    g.fillStyle = c; g.beginPath(); g.moveTo(-14, -14); g.quadraticCurveTo(-16, -40, -8, -48); g.lineTo(8, -48); g.quadraticCurveTo(16, -40, 14, -14); g.closePath(); g.fill();
    g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(1, -58, 11, 0, TAU); g.fill();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(4, -59, 1.6, 0, TAU); g.arc(-2, -59, 1.6, 0, TAU); g.fill();
    if (this.npc === 'bram') { g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(1, -50, 9, 6, 0, 0, Math.PI); g.fill(); g.fillStyle = '#c9a23a'; g.beginPath(); g.ellipse(1, -67, 15, 4, 0, 0, TAU); g.fill(); g.fillRect(-7, -76, 16, 10); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, -30); g.lineTo(40, -90); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(40, -90); g.lineTo(50, -20 + Math.sin(t * 2) * 4); g.stroke(); }
    else if (this.npc === 'lyra') { g.globalAlpha = .85 + Math.sin(t * 3) * .1; g.fillStyle = '#bff8e0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-12 + i * 6, -70, 3, 6, i - 2, 0, TAU); g.fill(); } g.globalAlpha = 1; }
    else { g.fillStyle = '#7a4a20'; g.beginPath(); g.ellipse(1, -66, 13, 5, 0, 0, TAU); g.fill(); g.fillRect(-6, -74, 14, 8); }
    if (this.heroNear(140, 100) && !this.solved) { g.fillStyle = '#fff'; g.font = '900 22px "Bangers", Impact, sans-serif'; g.textAlign = 'center'; g.fillText(this.def.quiz ? '!' : '…', 1, -84 + Math.sin(t * 4) * 3); }
    g.restore();
  }
  drawGlow(g) { if (this.npc === 'lyra') glowAt(g, [120, 255, 200], this.x, this.y - 40, 50, .4); }
}

class Portal extends LevelObject {
  update(dt) { super.update(dt); if (this.heroNear(40, 70) && !this.used) { this.used = true; this.game.enterSecret(this.level); } }
  draw(g) { }
  drawGlow(g) {
    const t = this.t; for (let i = 0; i < 4; i++) { g.globalAlpha = .6; g.strokeStyle = ['#8ae0ff', '#c88aff', '#ffffff', '#7affc8'][i]; g.lineWidth = 4; g.beginPath(); g.ellipse(this.x, this.y - 60, 34 - i * 6, 60 - i * 10, 0, t * (2 + i) % TAU, t * (2 + i) % TAU + 4.4); g.stroke(); }
    glowAt(g, [180, 200, 255], this.x, this.y - 60, 90, .6);
  }
}

class Wonder extends LevelObject {
  prompt() { return this.done ? null : this.heroNear(70, 90) ? { act: 'interact', text: 'Wonder Rune: answer and see!' } : null; }
  label() { return this.done ? null : { en: 'Wonder Rune', es: 'runa del asombro', verb: ['Something amazing will happen...', 'Pasará algo increíble...'] }; }
  interact() { if (this.done) return false; this.game.askQuestion({ kind: 'wonder', title: 'RUNA DEL ASOMBRO', onResult: ok => { if (ok) { this.done = true; this.game.startWonder(this.effect, this.x, this.y); } } }); return true; }
  draw(g) {
    if (this.done) return; const y = this.y + Math.sin(this.t * 2) * 6;
    for (let i = 0; i < 6; i++) { const a = this.t * .8 + i * TAU / 6; g.fillStyle = ['#ff7ab0', '#ffe060', '#7ae8ff', '#a0ff8a', '#c88aff', '#ffb050'][i]; g.beginPath(); g.ellipse(this.x + Math.cos(a) * 14, y + Math.sin(a) * 14, 9, 5, a, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(this.x, y, 8, 0, TAU); g.fill(); g.fillStyle = '#c8861a'; g.font = '700 12px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', this.x, y + 1);
  }
  drawGlow(g) { if (!this.done) { glowAt(g, [255, 220, 255], this.x, this.y, 70 + Math.sin(this.t * 3) * 10, .6); if (chance(.2)) FX.spawnRaw({ t: 'star', x: this.x + R(-30, 30), y: this.y + R(-30, 30), vx: 0, vy: -20, g: 0, max: 1, s: 3, col: pick([[255, 160, 220], [160, 230, 255], [255, 240, 140]]), rot: 0, vr: 4, add: 1 }); } }
}

class Ring extends LevelObject {
  label() { return { en: 'Ring', es: 'anilla', verb: ['Use your hook: L2 / G', 'Usa tu garfio: L2 / G'] }; }
  labelY() { return this.y - 50; }
  draw(g) { g.strokeStyle = '#c9a23a'; g.lineWidth = 5; g.beginPath(); g.arc(this.x, this.y, 13, 0, TAU); g.stroke(); g.strokeStyle = '#fff3b0'; g.lineWidth = 1.5; g.beginPath(); g.arc(this.x, this.y, 13, -2.5, -1.2); g.stroke(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(this.x, this.y - 13); g.lineTo(this.x, this.y - 40); g.stroke(); }
  drawGlow(g) { const H = this.hero, d = Math.hypot(H.x - this.x, H.y - 30 - this.y); if (d < 300) glowAt(g, [255, 230, 140], this.x, this.y, 30, .6 * (1 - d / 300)); }
}

class Spring extends LevelObject {
  label() { return { en: this.cap ? 'Mushroom' : 'Sea anemone', es: this.cap ? 'seta' : 'anémona', verb: ['Jump on it!', '¡Salta encima!'] }; }
  labelY() { return this.y - 60; }
  update(dt) {
    super.update(dt); this.sq = Math.max(0, (this.sq || 0) - dt * 4);
    const H = this.hero;
    if (H.onGround === false && H.vy > 0 && Math.abs(H.x - this.x) < 30 && H.y > this.y - 26 && H.y < this.y + 4) {
      H.vy = -(this.power || 1150); H.y = this.y - 27; H.jumps = 0; H.airDash = 1; this.sq = 1; Sound.play('bounce'); FX.land(this.x, this.y - 10, 600); H.sq = 1.35; Input.rumble(.1, .4, 80);
    }
  }
  draw(g) {
    const sq = this.sq || 0, h = 24 - sq * 12;
    g.save(); g.translate(this.x, this.y);
    g.fillStyle = '#3f8a6e'; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-12, -h * .5, -6, -h); g.lineTo(6, -h); g.quadraticCurveTo(12, -h * .5, 10, 0); g.fill();
    g.fillStyle = this.cap ? '#d24aa8' : '#ff7ab0'; g.beginPath(); g.ellipse(0, -h, 26 + sq * 8, 10 - sq * 3, 0, Math.PI, 0); g.fill();
    for (let i = -2; i <= 2; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(i * 8, -h - 4 + Math.abs(i), 2, 0, TAU); g.fill(); }
    g.restore();
  }
  drawGlow(g) { glowAt(g, [255, 140, 220], this.x, this.y - 24, 34, .35); }
}

class FakeWall extends LevelObject {
  constructor(game, d) {
    super(game, d); this.alpha = 1;
    const M = 20, mask = mk(this.w + M * 2, this.h + M * 2), m = mask.getContext('2d'); m.fillStyle = matFill(this.mat || 'rock'); m.beginPath(); m.roundRect(M, M, this.w, this.h, 6); m.fill();
    const r = renderRelief(mask, this.x, this.y, M, this.w, this.h, {}); this.c = mk(this.w, this.h); this.c.getContext('2d').putImageData(r.img, 0, 0);
  }
  update(dt) { super.update(dt); const H = this.hero, inside = H.x > this.x - 10 && H.x < this.x + this.w + 10 && H.y > this.y && H.y - H.h < this.y + this.h; if (inside && !this.found) { this.found = true; Sound.play('pickup'); FX.text(this.x + this.w / 2, this.y - 20, 'SECRET!', '#ffe9a0', 40); this.game.stats.secrets++; } this.alpha = approach(this.alpha, inside || this.found ? .12 : 1, dt * 3); }
  drawFront(g) { g.globalAlpha = this.alpha; g.drawImage(this.c, this.x, this.y); g.globalAlpha = 1; }
}

class Stalactite extends LevelObject {
  constructor(game, d) { super(game, d); this.cy = game.world.ceilY(this.x); this.y0 = this.cy; this.y = this.cy + 30; this.st = 'hang'; this.vy = 0; }
  update(dt) {
    super.update(dt); const H = this.hero;
    if (this.st === 'hang' && Math.abs(H.x - this.x) < 70 && H.y > this.y) { this.st = 'shake'; this.sT = 0; Sound.play('crumble'); }
    if (this.st === 'shake') { this.sT += dt; if (chance(.4)) FX.spawnRaw({ t: 'dust', x: this.x + R(-6, 6), y: this.y0 + 4, vx: 0, vy: 60, g: 200, drag: 1, max: .5, s: 2, s1: 3, col: [180, 180, 180], a: .6 }); if (this.sT > .55) this.st = 'fall'; }
    if (this.st === 'fall') { this.vy += 2200 * dt; this.y += this.vy * dt; if (Math.abs(H.x - this.x) < 20 && H.y - H.h < this.y && H.y > this.y - 40) H.hurt(18, this.x, { kup: 200 }); const gy = this.game.world.floorAt(this.x, this.y - 10); if (this.y >= gy) { this.st = 'gone'; FX.chunks(this.x, gy - 10, [140, 150, 170], 8, 300); Sound.play('crumble'); this.game.shake(3, .1); } }
  }
  draw(g) { if (this.st === 'gone') return; const sx = this.st === 'shake' ? Math.sin(this.t * 60) * 2 : 0; g.fillStyle = '#7a8aa0'; g.beginPath(); g.moveTo(this.x - 12 + sx, this.y - 40); g.lineTo(this.x + 12 + sx, this.y - 40); g.lineTo(this.x + sx, this.y + 20); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(this.x - 8 + sx, this.y - 40); g.lineTo(this.x - 2 + sx, this.y - 40); g.lineTo(this.x + sx, this.y + 14); g.fill(); }
}

class Spikes extends LevelObject {
  update(dt) { super.update(dt); const H = this.hero; if (H.x > this.x && H.x < this.x + this.w && H.y > this.y - 22 && H.y <= this.y + 4) { if (H.atk && H.atk.kind === 'down') { H.vy = -620; H.jumps = 0; H.airDash = 1; FX.sparks(H.x, this.y - 18, [255, 255, 255], 8); Sound.play('block'); } else H.hurt(15, H.x - H.face * 10, { kup: 520, kb: 120 }); } }
  draw(g) { for (let x = this.x; x < this.x + this.w; x += 16) { g.fillStyle = '#9aa0b0'; g.beginPath(); g.moveTo(x, this.y); g.lineTo(x + 8, this.y - 22); g.lineTo(x + 16, this.y); g.fill(); g.fillStyle = '#e8ecf4'; g.beginPath(); g.moveTo(x + 8, this.y - 22); g.lineTo(x + 10, this.y - 8); g.lineTo(x + 8, this.y); g.fill(); } }
}

class Geyser extends LevelObject {
  update(dt) {
    super.update(dt); const p = this.t % 4;
    if (p > 2 && p < 3 && chance(.4)) FX.embers(this.x + R(-14, 14), this.y - 4, 1, 80);
    if (p > 3 && !this.fired) { this.fired = true; Sound.play('explode'); FX.splash(this.x, this.y, 'lava', 1.2); }
    if (p < 2) this.fired = false;
    if (p > 3) { const H = this.hero; if (Math.abs(H.x - this.x) < 26 && H.y > this.y - 240) H.hurt(18, this.x, { kup: 600 }); }
  }
  draw(g) { const p = this.t % 4; g.fillStyle = '#2a1a18'; g.beginPath(); g.ellipse(this.x, this.y, 24, 7, 0, 0, TAU); g.fill(); g.fillStyle = p > 2 ? '#ff9a3a' : '#a83a10'; g.beginPath(); g.ellipse(this.x, this.y, 14, 4, 0, 0, TAU); g.fill(); if (p > 3) { const h = Math.sin((p - 3) * Math.PI) * 240; drawLavaFall(g, this.x, this.y - h, this.y, 30, this.t); } }
  drawGlow(g) { const p = this.t % 4; glowAt(g, [255, 130, 40], this.x, this.y - (p > 3 ? 100 : 6), p > 3 ? 120 : 30, p > 2 ? .8 : .4); }
}

class RisingLava extends LevelObject {
  constructor(game, d) { super(game, d); this.level = this.y; this.y0 = this.y; this.active = false; this.liq = { x0: this.x, x1: this.x1, level: this.y, curLevel: this.y, type: 'lava', bottom: this.y + 400, rising: true }; game.world.liquids.push(this.liq); }
  update(dt) {
    super.update(dt); const H = this.hero;
    if (!this.active && H.x > this.trigger && H.x < this.x1 && !H.dead) { this.active = true; Sound.play('roar', .6); this.game.toast('¡La lava sube! ¡Rápido!'); this.game.shake(6, 1); }
    if (this.active) { this.level = Math.max(this.top + 80, this.level - this.speed * dt * (H.y < this.level - 300 ? .7 : 1)); if (chance(.5)) FX.embers(R(this.x, this.x1), this.level, 1, 120); }
    this.liq.level = this.liq.curLevel = this.level;
  }
  reset() { this.active = false; this.level = this.y0; this.liq.level = this.liq.curLevel = this.y0; }
}
class FlagDeco extends LevelObject { constructor(game, d) { super(game, d); this.flag = new Flag(this.x + 2, this.y - 118, 50, 30, '#4ab0e8', '≈'); } update(dt) { super.update(dt); this.flag.update(dt, this.game.windAt(this.x, this.y), this.game.t); } draw(g) { this.flag.draw(g); } }
class Exit extends LevelObject {
  update(dt) { super.update(dt); if (!this.used && this.game.levelClearReady() && this.heroNear(40, 80)) { this.used = true; this.game.levelComplete(); } }
  drawGlow(g) {
    const ready = this.game.levelClearReady(); if (!ready) return; const t = this.t;
    for (let i = 0; i < 5; i++) { g.globalAlpha = .7; g.strokeStyle = ['#ffe080', '#ffffff', '#ffd040', '#fff0b0', '#ffb040'][i]; g.lineWidth = 4; g.beginPath(); g.ellipse(this.x, this.y - 70, 40 - i * 6, 72 - i * 10, 0, t * (2 + i) % TAU, t * (2 + i) % TAU + 4.6); g.stroke(); }
    glowAt(g, [255, 230, 150], this.x, this.y - 70, 110, .7);
  }
}

const SIGN_TX = {
  '← → / stick: moverse': 'Move: ← → or the left stick', '✕ / Espacio: saltar': 'Jump: ✕ or Space', '□ / J: atacar': 'Attack: □ or J',
  '✕ en el aire: DOBLE SALTO': 'Press ✕ in the air: DOUBLE JUMP', '↓ + □ en el aire: rebota sobre enemigos': 'Down + □ in the air: bounce on enemies',
  '○ / K: esquivar (invulnerable)': 'Dodge: ○ or K (you are invincible!)', '△ / E: abrir con inglés': 'Open doors with English: △ or E',
  'R1 / L: bloquear · ¡justo a tiempo = PARADA!': 'Block: R1 or L · just in time = PARRY!', 'R2 / U: PALABRA DE PODER (cuando brille la barra dorada)': 'Power Word: R2 or U (when the gold bar shines)',
  '¡Salta contra la pared para escalar!': 'Jump against the wall to climb!', 'L2 / G: GARFIO hacia las anillas': 'Grappling hook: L2 or G (aim at the rings)',
  'Agárrate a las cuerdas: ¡salta desde ellas con impulso!': 'Grab the ropes and jump off with speed!', '¡Ráfagas de viento! Ojo con los salientes que se desmoronan': 'Strong wind! Careful: the ledges fall',
  'Lobo Sombra: espera el destello blanco y PARA (R1)': 'Shadow Wolf: wait for the white flash and PARRY (R1)', 'Las nubes de esporas envenenan: ¡no te quedes dentro!': "Spore clouds are poisonous: don't stay inside!",
  'La lava quema mucho: ¡no te caigas!': "Lava is very hot: don't fall in!", '¡La lava sube! ¡Escala rápido!': 'The lava is rising! Climb fast!',
  'Gruta de las Perlas: ¡recoge todas las monedas!': 'Pearl Grotto: collect all the coins!', 'Jardín de las Nubes: las nubes rebotan, ¡disfruta!': 'Cloud Garden: the clouds bounce. Enjoy!'
};
class Sign extends LevelObject {
  constructor(game, d) { super(game, d); this.en = d.en || SIGN_TX[d.text] || d.text; this.es = d.es || d.text; this.shown = false; }
  label() { return { en: this.en, es: this.es, verb: null }; }
  labelY() { return this.y - 118; }
  update(dt) { super.update(dt); if (!this.shown && this.heroNear(90, 100)) { this.shown = true; this.game.seePhrase(this.en); } }
  draw(g) {
    g.fillStyle = '#5a3b22'; g.fillRect(this.x - 3, this.y - 64, 6, 64);
    g.save(); g.translate(this.x, this.y - 70); g.rotate(-.03);
    g.fillStyle = '#8a5f38'; g.beginPath(); g.roundRect(-34, -24, 68, 36, 5); g.fill(); g.strokeStyle = '#3a2414'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#f6e6c4'; g.font = '900 24px "Bangers", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.title ? '★' : '!', 0, -5); g.restore();
  }
}
const OBJECT_TYPES = { sign: Sign, levelsign: Sign, checkpoint: Checkpoint, gate: Gate, shrine: Shrine, chest: Chest, letter: Letter, coin: Coin, crystal: Crystal, npc: NPC, portal: Portal, wonder: Wonder, ring: Ring, spring: Spring, fakewall: FakeWall, hazard_stalactite: Stalactite, hazard_spikes: Spikes, hazard_geyser: Geyser, risingLava: RisingLava, flag: FlagDeco, exit: Exit };
