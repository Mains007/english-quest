# English Quest · The Rune Words

Juego de plataformas y acción en 2D (Canvas, JavaScript puro, sin dependencias) para aprender inglés de A1 a B1.
Cada respuesta correcta en inglés es poder: Palabra de Poder (ataque definitivo), rompecabezas, sellos de los jefes, ataques imparables…

## Cómo jugar en local

La música usa muestras reales (carpeta `samples/`), que el navegador solo carga a través de un servidor:

```bash
cd english-quest
python -m http.server 8000
# abre http://localhost:8000
```

Con doble clic en `index.html` también funciona, pero suena la versión sintetizada de la música.
Mando de PlayStation/Xbox recomendado (teclado también funciona).

## Estructura

Todo son scripts clásicos (sin módulos ni bundler) cargados en orden desde `index.html`; comparten el ámbito global.
Los módulos posteriores amplían a los anteriores envolviendo métodos de sus prototipos (`const f0 = X.prototype.f; X.prototype.f = function () { ... f0.call(this) ... }`), así que **el orden de los `<script>` importa**.

| Archivo | Qué hace |
|---|---|
| `util.js`, `input.js` | utilidades, guardado (`Store`), teclado y mando |
| `curriculum.js`, `learning.js` | temario A1→B1 y motor de preguntas (repetición espaciada) |
| `art.js`, `painter.js`, `fx.js`, `world.js`, `biomes.js`, `sky.js` | arte pintado procedural, partículas, terreno, fondos, cielos |
| `physics.js` | superficies de líquidos, cuerdas, puentes |
| `hero.js`, `herodraw.js`, `cosmetics.js` | Lio (el héroe), su dibujo y su ropa |
| `enemies.js`, `enemyart.js`, `enemyai.js` | enemigos, su arte y sus ataques |
| `bosses.js`, `bosses2.js`, `phases.js` | los 6 jefes y sus fases |
| `objects.js`, `levels.js`, `levelgen.js` | objetos, constructor de niveles y generador (6 mundos × 20 niveles) |
| `sampler.js`, `audio.js` | música compuesta en tiempo real con instrumentos reales y efectos de sonido |
| `game.js`, `flow.js`, `render.js` | bucle de juego, preguntas/definitivos, dibujo |
| `juice.js`, `juice2.js`, `juice3.js` | "sensación de juego": impactos, muertes, monedas, charcos físicos, remolino, fauna, reposo… |
| `arsenal.js` | armas nuevas (arco, guadaña, chakram, báculo) y técnicas (BLOQUEO + ATAQUE) |
| `ultfx.js` | ataques definitivos espectaculares; versión débil + contragolpe si fallas la pregunta |
| `bossult.js` | ataque imparable de los jefes (solo se para respondiendo en inglés) |
| `puzzles.js` | rompecabezas por mundo que se completan con respuestas correctas |
| `menuscene.js`, `ui.js`, `main.js` | escena del menú, interfaz, arranque |

## Créditos de sonido

Orquesta: VS Chamber Orchestra 2 Community Edition (Versilian Studios, CC0) · piano: Salamander Grand Piano (Alexander Holm, CC BY 3.0) · coro, guitarras y bajo: MusyngKite soundfont (CC BY-SA 3.0, vía midi-js-soundfonts de B. Gleitzman) · batería: web-audio-samples de Google Chrome Labs (Apache 2.0).
