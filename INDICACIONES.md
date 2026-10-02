# Indicaciones para seguir con English Quest

> Documento de traspaso escrito por el Claude de la nube que hizo el juego hasta aquí, para el Claude que trabaja en el ordenador del usuario. Resume lo que el usuario ha pedido, lo que queda pendiente y lo que se puede mejorar ahora que hay **programas de verdad** (3D, edición de imagen y audio, grabación, etc.) y no solo código.

---

## 1. Quién es el usuario y cómo trabaja

- Habla **español** (a menudo dictado por voz: el transcriptor escribe mal, interpreta la intención). Responde siempre en español.
- Quiere el ciclo: **mejorar → verlo funcionando (capturas o vídeo) → enseñárselo → preguntar qué sigue**. Le gusta **ver** los cambios: grabar vídeos cortos de cada mejora le ha funcionado muy bien.
- Es muy exigente con la **sensación de juego** ("los pequeños retoques que hacen que el juego se sienta bien") y con la **espectacularidad**, pero **NO quiere hiperrealismo**: le encanta la dirección artística actual (cartoon pintado, contorno suave, colores cálidos). Mejorar = más detalle, más vida, más física, dentro de ese estilo.
- Piensa mucho en **física**: que nada atraviese el suelo, que el agua se deforme, que las partículas choquen, que las cosas tengan peso y lógica (ej.: "la base del chorro debe ser más gruesa porque de ahí sale el agua").
- **No olvidar nunca: es un juego para aprender inglés (A1→B1).** Cada mecánica espectacular debería pasar por el inglés (acertar = más poder).
- Le da igual que el juego pese mucho (ha dicho que 1 GB está bien): **más peso = más contenido, animaciones y calidad**.

## 2. Cómo está hecho (resumen técnico)

- JavaScript puro + Canvas 2D, sin dependencias ni compilación. Scripts clásicos en orden desde `index.html`; los módulos nuevos amplían a los antiguos **envolviendo métodos de prototipos** (ver `README.md`). **El orden de los `<script>` importa.**
- Arrancar: `python -m http.server 8000` en la carpeta → `http://localhost:8000` (las muestras de audio no cargan desde `file://`).
- Todo el arte es **procedural** (dibujado con código en tiempo de ejecución). Es la mayor limitación de calidad: ahí es donde los programas pueden dar el gran salto.
- Las pruebas que hacía yo: Playwright sin GPU (13–25 FPS, por eso grababa fotograma a fotograma). **En el ordenador del usuario, comprobar el rendimiento real a 60 FPS** con mando.

## 3. Pendiente que el usuario pidió explícitamente

1. **Rayo del ataque imparable de los jefes** (`js/bossult.js`): al usuario le parece "un PNG que se mueve de izquierda a derecha". Necesita: nacer de la boca/arma del jefe con fogonazo, grosor que vibra y parpadea, energía turbulenta por dentro, distorsión del aire, chispas, el suelo quemándose y levantándose a su paso, y que el tajo de Lio lo parta con más impacto. Idealmente con **texturas/sprites animados hechos en un programa** (ver §5).
2. **Al menos 3 ataques básicos y 3 combos distintos por arma** (suelo, aire, corriendo…) con animaciones propias. Ahora cada arma tiene 1 combo de 3 golpes + golpe arriba + abajo + cargado + técnica + definitivo.
3. **Espectacularidad de los definitivos**: ya rehechos los 4 nuevos (`js/ultfx.js`); los de espada, lanza, martillo y guanteletes (`js/flow.js`) siguen siendo los originales. Llevarlos al mismo nivel.
4. **Rompecabezas de inglés** (`js/puzzles.js`): existen (12 piezas por mundo, cada acierto a la primera = una pieza con la palabra acertada). El usuario mencionó también preguntas tipo **"¿cómo se dice…?" / "¿cómo se escribe…?"** vinculadas a ellos. Mejorar las imágenes de los cuadros (ahora son los fondos del mundo; mejor ilustraciones dedicadas, con los objetos del vocabulario etiquetados).
5. **Consecuencias al fallar** la Palabra de Poder: hecho (versión débil + contragolpe −10 % vida + expuesto 2,5 s). Ajustar si se siente injusto o demasiado suave.

## 4. Fallos conocidos / detalles

- Textos grandes de los definitivos (ej. "EYE OF THE STORM!") se quedan en pantalla porque las partículas de texto de `FX` se congelan durante cinemáticas y preguntas. Dibujarlos con tiempo real.
- La ventana del rompecabezas y algunos rótulos aparecen encima justo al terminar el ataque imparable.
- El contador de monedas del Taller no se refresca tras comprar.
- Con el Chakram, mientras el disco está fuera, el ataque es un puñetazo corto.
- Charcos: pocos por nivel (solo en suelo totalmente llano); no los hay en arena. Las gotas que caen en el charco atraviesan la superficie y salpican en el fondo.
- **Nada está equilibrado con mando real**: daño de armas, técnicas, definitivos (100 % / 70 % / 40 %), ataque imparable (−40 % vida, cada 30/24/19 s), precios del Taller. Jugar y ajustar.
- El ataque imparable solo se ha probado con Rey Cangrejo y Wyvern; probar los otros 4 jefes.

## 5. Lo que ahora SÍ se puede hacer con programas (y yo no podía)

**Arte y animación**
- **Sprites animados de verdad** para Lio, enemigos y jefes: modelar en **Blender** (o pintar en Krita/Aseprite) y **renderizar hojas de sprites** con estilo cartoon (toon shader + contorno) que respeten el look actual. Animaciones de ataque, golpes recibidos, muertes, reposo… con muchos más fotogramas que el dibujo por código.
- **Fondos pintados en alta resolución** por bioma (capas de parallax), con más profundidad y detalle, manteniendo la paleta.
- **Efectos (VFX) pre-renderizados**: rayos, explosiones, tornado, agua, lava, fuego, chispas, como hojas de sprites o vídeos con transparencia. Lo más impactante para el rayo de los jefes y los definitivos.
- **Cinemáticas**: intros de jefes, final de cada mundo, presentación del juego.
- Opcional: pasar el dibujo a **WebGL** (por ejemplo PixiJS) para iluminación, distorsión, bloom, sombreados y miles de partículas sin perder FPS.

**Audio**
- **Efectos de sonido reales** (grabados o de bibliotecas libres: Freesound, Sonniss GDC): golpes, espadas, pasos según el suelo, agua, lava, viento, rayos… Ahora casi todo está sintetizado.
- **Voces en inglés reales** para pronunciación: que cada frase se pueda escuchar con voz natural (grabada o TTS de calidad) y que los personajes la digan.
- **Música pre-renderizada o producida** en un DAW, con la referencia del usuario: épica y cinematográfica, rock sinfónico de opening de anime, guitarras con cortes, piano, orquesta y contraste melancólico (Infinity War, Megalovania, Magi, Contra, Saint Seiya, Dragon Ball). Ahora se compone en tiempo real con instrumentos sampleados.
- **Reconocimiento de voz** (micrófono) para practicar la pronunciación: decir la respuesta en voz alta.

**Distribución**
- **Versión para PC descargable** (Electron o Tauri): sin límite de tamaño, se puede jugar sin conexión, se pueden añadir logros…

## 6. Ideas de mejora (alineadas con lo que le gusta al usuario)

**Combate y espectáculo**
- Segunda técnica por arma (más cara y más espectacular), mejoras de cada arma (daño, efectos elementales) y un arma exclusiva por jefe derrotado.
- El ataque imparable también en algunos enemigos de élite.
- Ataque imparable distinto por jefe (no solo rayo): lluvia de meteoros, ola gigante, parada del tiempo… siempre resuelto respondiendo en inglés.
- Remolino rúnico: que desvíe también las cascadas de lava; algún muro de lava obligatorio que solo se cruce con él.

**Física y mundo vivo**
- Lluvia en algunos niveles: gotas que rebotan, charcos que se llenan, personajes empapados.
- Objetos con física: barriles y cajas que vuelcan, ruedan y se rompen en astillas.
- Telas, banderas y lianas que reaccionan al pasar y al viento de los golpes.
- Barro donde te hundes un poco, nieve que se marca, hierba que se aplasta.

**Aprender inglés**
- Más tipos de pregunta: escuchar y escribir (dictado), "¿cómo se dice…?", "¿cómo se escribe…?", ordenar frases con voz, pronunciar con micrófono.
- Más contenido por unidad y personajes que hablen inglés con voz.
- Galería de rompecabezas con ilustraciones dedicadas y vocabulario etiquetado.

## 7. Cómo coordinarnos

- Repositorio: **github.com/Mains007/english-quest** (rama `main`).
- Antes de empezar: `git pull`. Al terminar cada mejora: commit con mensaje claro y `git push`.
- El Claude de la nube **no tocará el repositorio** hasta que el usuario lo pida, y cuando lo haga, empezará siempre con `git pull` para trabajar sobre tu versión.
- Si cambiáis la estructura (por ejemplo, de Canvas a WebGL o con sprites en archivos), actualizad `README.md` para que el otro se oriente.
