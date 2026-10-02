"use strict";
/* =====================================================================
   TEMARIO — Ruta A1 → B1
   Cada pregunta: [frase con ___, [correcta, distractores…], español, por qué, vocabulario, verbos, flags]
     vocabulario: "inglés=español=français; …"
     flags: 's' = mostrar la frase en español durante la pregunta (preposiciones, vocabulario)
            'c' = solo elección (no construir ni escribir)
   La opción correcta va SIEMPRE primero aquí; el juego las baraja.
   ===================================================================== */

/* Verbos: base, pasado, participio, español, francés */
const VERBS = {
  be: ['be', 'was / were', 'been', 'ser / estar', 'être'], have: ['have', 'had', 'had', 'tener', 'avoir'],
  do: ['do', 'did', 'done', 'hacer', 'faire'], go: ['go', 'went', 'gone', 'ir', 'aller'],
  see: ['see', 'saw', 'seen', 'ver', 'voir'], eat: ['eat', 'ate', 'eaten', 'comer', 'manger'],
  drink: ['drink', 'drank', 'drunk', 'beber', 'boire'], sleep: ['sleep', 'slept', 'slept', 'dormir', 'dormir'],
  wake: ['wake (up)', 'woke', 'woken', 'despertar(se)', '(se) réveiller'], get: ['get', 'got', 'got / gotten', 'conseguir, llegar, ponerse', 'obtenir, arriver'],
  give: ['give', 'gave', 'given', 'dar', 'donner'], take: ['take', 'took', 'taken', 'coger, llevar, tardar', 'prendre'],
  make: ['make', 'made', 'made', 'hacer, fabricar', 'faire, fabriquer'], tell: ['tell', 'told', 'told', 'decir (a alguien), contar', 'dire, raconter'],
  say: ['say', 'said', 'said', 'decir', 'dire'], speak: ['speak', 'spoke', 'spoken', 'hablar', 'parler'],
  write: ['write', 'wrote', 'written', 'escribir', 'écrire'], read: ['read', 'read (/red/)', 'read (/red/)', 'leer', 'lire'],
  run: ['run', 'ran', 'run', 'correr', 'courir'], swim: ['swim', 'swam', 'swum', 'nadar', 'nager'],
  buy: ['buy', 'bought', 'bought', 'comprar', 'acheter'], bring: ['bring', 'brought', 'brought', 'traer', 'apporter'],
  think: ['think', 'thought', 'thought', 'pensar, creer', 'penser'], know: ['know', 'knew', 'known', 'saber, conocer', 'savoir, connaître'],
  meet: ['meet', 'met', 'met', 'conocer (a alguien), quedar', 'rencontrer'], leave: ['leave', 'left', 'left', 'irse, salir, dejar', 'partir, laisser'],
  lose: ['lose', 'lost', 'lost', 'perder', 'perdre'], find: ['find', 'found', 'found', 'encontrar', 'trouver'],
  forget: ['forget', 'forgot', 'forgotten', 'olvidar', 'oublier'], forgive: ['forgive', 'forgave', 'forgiven', 'perdonar', 'pardonner'],
  come: ['come', 'came', 'come', 'venir', 'venir'], begin: ['begin', 'began', 'begun', 'empezar', 'commencer'],
  break: ['break', 'broke', 'broken', 'romper', 'casser'], build: ['build', 'built', 'built', 'construir', 'construire'],
  catch: ['catch', 'caught', 'caught', 'atrapar, coger', 'attraper'], choose: ['choose', 'chose', 'chosen', 'elegir', 'choisir'],
  drive: ['drive', 'drove', 'driven', 'conducir', 'conduire'], fall: ['fall', 'fell', 'fallen', 'caer(se)', 'tomber'],
  feel: ['feel', 'felt', 'felt', 'sentir(se)', 'sentir'], fly: ['fly', 'flew', 'flown', 'volar', 'voler'],
  grow: ['grow', 'grew', 'grown', 'crecer, cultivar', 'grandir, cultiver'], hear: ['hear', 'heard', 'heard', 'oír', 'entendre'],
  keep: ['keep', 'kept', 'kept', 'guardar, mantener', 'garder'], put: ['put', 'put', 'put', 'poner', 'mettre'],
  send: ['send', 'sent', 'sent', 'enviar', 'envoyer'], sing: ['sing', 'sang', 'sung', 'cantar', 'chanter'],
  sit: ['sit', 'sat', 'sat', 'sentarse', "s'asseoir"], spend: ['spend', 'spent', 'spent', 'gastar, pasar (tiempo)', 'dépenser, passer'],
  stand: ['stand', 'stood', 'stood', 'estar de pie', 'être debout'], steal: ['steal', 'stole', 'stolen', 'robar', 'voler'],
  teach: ['teach', 'taught', 'taught', 'enseñar', 'enseigner'], understand: ['understand', 'understood', 'understood', 'entender', 'comprendre'],
  win: ['win', 'won', 'won', 'ganar', 'gagner'], wear: ['wear', 'wore', 'worn', 'llevar puesto', 'porter'],
  pay: ['pay', 'paid', 'paid', 'pagar', 'payer'], sell: ['sell', 'sold', 'sold', 'vender', 'vendre'],
  lie: ['lie', 'lay', 'lain', 'tumbarse, estar tumbado', "s'allonger"], fight: ['fight', 'fought', 'fought', 'luchar, pelear', 'se battre'],
  ride: ['ride', 'rode', 'ridden', 'montar (bici, caballo)', 'monter'], hide: ['hide', 'hid', 'hidden', 'esconder(se)', 'cacher'],
  throw: ['throw', 'threw', 'thrown', 'lanzar, tirar', 'lancer'], draw: ['draw', 'drew', 'drawn', 'dibujar', 'dessiner'],
  hit: ['hit', 'hit', 'hit', 'golpear', 'frapper'], cut: ['cut', 'cut', 'cut', 'cortar', 'couper'],
  shoot: ['shoot', 'shot', 'shot', 'disparar', 'tirer'], light: ['light', 'lit', 'lit', 'encender (fuego)', 'allumer'],
  /* regulares (útiles para comparar) */
  work: ['work', 'worked', 'worked', 'trabajar', 'travailler'], play: ['play', 'played', 'played', 'jugar, tocar', 'jouer'],
  study: ['study', 'studied', 'studied', 'estudiar', 'étudier'], stop: ['stop', 'stopped', 'stopped', 'parar', "(s')arrêter"],
  open: ['open', 'opened', 'opened', 'abrir', 'ouvrir'], watch: ['watch', 'watched', 'watched', 'mirar, ver', 'regarder'],
  live: ['live', 'lived', 'lived', 'vivir', 'habiter, vivre'], like: ['like', 'liked', 'liked', 'gustar', 'aimer'],
  want: ['want', 'wanted', 'wanted', 'querer', 'vouloir'], call: ['call', 'called', 'called', 'llamar', 'appeler'],
  cook: ['cook', 'cooked', 'cooked', 'cocinar', 'cuisiner'], arrive: ['arrive', 'arrived', 'arrived', 'llegar', 'arriver'],
  miss: ['miss', 'missed', 'missed', 'perder (transporte), echar de menos', 'rater, manquer'], solder: ['solder', 'soldered', 'soldered', 'soldar (con estaño)', 'souder'],
  try: ['try', 'tried', 'tried', 'intentar, probar', 'essayer'], cry: ['cry', 'cried', 'cried', 'llorar', 'pleurer'],
  travel: ['travel', 'travelled', 'travelled', 'viajar', 'voyager'], repair: ['repair', 'repaired', 'repaired', 'reparar', 'réparer'],
  yawn: ['yawn', 'yawned', 'yawned', 'bostezar', 'bâiller'], use: ['use', 'used', 'used', 'usar', 'utiliser'],
  help: ['help', 'helped', 'helped', 'ayudar', 'aider'], start: ['start', 'started', 'started', 'empezar', 'commencer'],
  listen: ['listen', 'listened', 'listened', 'escuchar', 'écouter'], attend: ['attend', 'attended', 'attended', 'asistir a', 'assister à'],
  explain: ['explain', 'explained', 'explained', 'explicar', 'expliquer'], melt: ['melt', 'melted', 'melted', 'derretir(se)', 'fondre'],
  book: ['book', 'booked', 'booked', 'reservar', 'réserver'], close: ['close', 'closed', 'closed', 'cerrar', 'fermer']
};
function thirdPerson(v) {
  if (v === 'have') return 'has'; if (v === 'be') return 'is'; if (v === 'do') return 'does'; if (v === 'go') return 'goes';
  if (/(s|sh|ch|x|z|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}
function ingForm(v) {
  if (v === 'be') return 'being'; if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
  if (/[^e]e$/.test(v) && v !== 'see') return v.slice(0, -1) + 'ing';
  if (/^(run|swim|stop|sit|get|put|cut|hit|begin|shop|plan|win)$/.test(v)) return v + v.slice(-1) + 'ing';
  return v + 'ing';
}

const LEVELS_CEFR = { A1: 'A1 · Primeros pasos', A2: 'A2 · Elemental', B1: 'B1 · Intermedio' };

const UNITS = [
/* ============================== A1 ============================== */
{ id: 'be', cefr: 'A1', title: 'To be: am / is / are', es: 'El verbo «to be» (ser / estar)',
  lesson: {
    points: ['«To be» significa <b>ser</b> y también <b>estar</b>.', 'I <b>am</b> · he / she / it <b>is</b> · you / we / they <b>are</b>.', 'Contracciones: I\'m, you\'re, he\'s, she\'s, it\'s, we\'re, they\'re.', 'Edad, hambre, frío, miedo… también van con <b>to be</b>: I am 30, I am hungry.'],
    table: [['Persona', 'Afirmativa', 'Contracción'], ['I', 'am', "I'm"], ['you', 'are', "you're"], ['he / she / it', 'is', "he's / she's / it's"], ['we / they', 'are', "we're / they're"]],
    ex: [['I am tired.', 'Estoy cansado.'], ['She is a nurse.', 'Ella es enfermera.'], ['It is cold today.', 'Hoy hace frío.']],
    tip: 'Truco: <b>is</b> va con UNO (he, she, it). <b>are</b> va con VARIOS… y con <b>you</b>.'
  },
  items: [
    ['She ___ my sister.', ['is', 'are', 'am', 'be'], 'Ella es mi hermana.', 'Con she (3ª persona singular) se usa «is».', 'sister=hermana=sœur', 'be'],
    ['I ___ tired after work.', ['am', 'is', 'are', 'be'], 'Estoy cansado después del trabajo.', 'Con I siempre «am». «Tired» (cansado) es un estado: también va con to be.', 'tired=cansado=fatigué; after=después de=après', 'be'],
    ['We ___ in the kitchen.', ['are', 'is', 'am', 'be'], 'Estamos en la cocina.', 'We es plural → are.', 'kitchen=cocina=cuisine', 'be'],
    ['The dog ___ very big.', ['is', 'are', 'am', 'have'], 'El perro es muy grande.', '«The dog» equivale a «it» → is.', 'dog=perro=chien; big=grande=grand', 'be'],
    ['My friends ___ at the beach.', ['are', 'is', 'am', 'be'], 'Mis amigos están en la playa.', '«My friends» es plural (they) → are.', 'beach=playa=plage; friend=amigo=ami', 'be'],
    ['It ___ cold today.', ['is', 'are', 'am', 'has'], 'Hoy hace frío.', 'El tiempo se describe con «it is»: It is cold. Nunca «It has cold».', 'cold=frío=froid; today=hoy=aujourd\'hui', 'be'],
    ['You ___ a good teacher.', ['are', 'is', 'am', 'be'], 'Eres un buen profesor.', 'You siempre lleva «are», sea una persona o varias.', 'teacher=profesor=professeur', 'be'],
    ['I ___ 25 years old.', ['am', 'have', 'is', 'are'], 'Tengo 25 años.', 'La edad se dice con to be: I am 25 (years old). Nunca «I have 25 years».', 'years old=años (de edad)=ans', 'be'],
    ['They ___ from Spain.', ['are', 'is', 'am', 'be'], 'Son de España.', 'They → are. «From» indica el origen.', 'from=de (origen)=de', 'be'],
    ['My name ___ Leo.', ['is', 'are', 'am', 'be'], 'Me llamo Leo.', '«My name» es una cosa (it) → is.', 'name=nombre=nom', 'be'],
    ['The windows ___ open.', ['are', 'is', 'am', 'be'], 'Las ventanas están abiertas.', '«The windows» es plural → are.', 'window=ventana=fenêtre; open=abierto=ouvert', 'be'],
    ['He ___ hungry.', ['is', 'has', 'are', 'am'], 'Él tiene hambre.', 'Hambre, sed, frío o miedo van con to be: he is hungry (no «he has hungry»).', 'hungry=hambriento=affamé', 'be'],
    ['___ is important to sleep well.', ['It', 'Is', 'This is', 'There'], 'Es importante dormir bien.', 'En inglés la frase siempre necesita sujeto: «It is important…». Nunca empieces con «Is important».', 'important=importante=important; sleep=dormir=dormir', 'be,sleep', 'c'],
    ['Your keys ___ on the table.', ['are', 'is', 'am', 'be'], 'Tus llaves están en la mesa.', '«Your keys» es plural → are.', 'key=llave=clé; table=mesa=table', 'be']
  ] },
{ id: 'beq', cefr: 'A1', title: 'To be: negativas y preguntas', es: 'No soy / ¿Eres…?',
  lesson: {
    points: ['Negativa: añade <b>not</b> → I am not, she is not (<b>isn\'t</b>), they are not (<b>aren\'t</b>).', 'Pregunta: el verbo va DELANTE → <b>Are</b> you ready? <b>Is</b> she here?', 'Respuestas cortas: Yes, I am. / No, she isn\'t. (En las afirmativas cortas no se contrae: Yes, they are.)'],
    table: [['', 'Negativa', 'Pregunta'], ['I', "I'm not", 'Am I…?'], ['he / she / it', "isn't", 'Is he…?'], ['you / we / they', "aren't", 'Are you…?']],
    ex: [["She isn't at home.", 'No está en casa.'], ['Are you ready?', '¿Estás listo?'], ['Where is the bathroom?', '¿Dónde está el baño?']],
    tip: 'Para preguntar, da la vuelta: «You are» → «Are you?»'
  },
  items: [
    ['She ___ at home. She is at work.', ["isn't", "aren't", 'not is', "don't"], 'No está en casa. Está en el trabajo.', 'Negativa de «is» → is not / isn\'t.', 'at home=en casa=à la maison; work=trabajo=travail', 'be'],
    ['___ you ready?', ['Are', 'Is', 'Do', 'Am'], '¿Estás listo?', 'Pregunta con to be: el verbo va delante. You → Are you…?', 'ready=listo=prêt', 'be'],
    ['___ he your brother?', ['Is', 'Are', 'Does', 'Has'], '¿Es él tu hermano?', 'He → Is he…?', 'brother=hermano=frère', 'be'],
    ['I ___ not afraid.', ['am', 'is', 'are', 'do'], 'No tengo miedo.', 'I am not (I\'m not). «Tener miedo» = be afraid.', 'afraid=con miedo=effrayé', 'be'],
    ["We ___ late. We are on time.", ["aren't", "isn't", "don't", 'not are'], 'No llegamos tarde. Llegamos a tiempo.', 'We → are not / aren\'t.', 'late=tarde=en retard; on time=a tiempo=à l\'heure', 'be'],
    ['Is the shop open? — No, it ___.', ["isn't", "doesn't", 'not', "aren't"], '¿La tienda está abierta? — No.', 'Respuesta corta con el mismo verbo: Is it…? → No, it isn\'t.', 'shop=tienda=magasin', 'be'],
    ['Are they your parents? — Yes, they ___.', ['are', 'do', 'is', "they're"], '¿Son tus padres? — Sí.', 'En respuestas cortas afirmativas no se contrae: Yes, they are.', 'parents=padres=parents', 'be', 'c'],
    ['Where ___ the bathroom?', ['is', 'are', 'it is', 'be'], '¿Dónde está el baño?', 'Where + is + cosa singular.', 'bathroom=baño=salle de bains', 'be'],
    ['Why ___ you sad?', ['are', 'is', 'do', 'be'], '¿Por qué estás triste?', 'Why + are + you.', 'sad=triste=triste; why=por qué=pourquoi', 'be'],
    ["It ___ my phone. My phone is black.", ["isn't", "aren't", "doesn't", 'not'], 'No es mi teléfono. Mi teléfono es negro.', 'It → is not / isn\'t.', 'phone=teléfono=téléphone; black=negro=noir', 'be'],
    ['How old ___ your sister?', ['is', 'are', 'has', 'does'], '¿Cuántos años tiene tu hermana?', 'La edad se pregunta con to be: How old is she?', 'how old=cuántos años=quel âge', 'be'],
    ['Am I late? — No, you ___.', ["aren't", "isn't", "amn't", "don't"], '¿Llego tarde? — No.', 'Con you: aren\'t. («Amn\'t» no existe.)', 'late=tarde=en retard', 'be'],
    ["The children ___ in bed. They are in the garden.", ["aren't", "isn't", "don't", 'not'], 'Los niños no están en la cama. Están en el jardín.', '«Children» es plural → aren\'t.', 'children=niños=enfants; garden=jardín=jardin', 'be']
  ] },
{ id: 'there', cefr: 'A1', title: 'There is / There are', es: '«Hay»',
  lesson: {
    points: ['«Hay» en inglés = <b>there is</b> (una cosa o algo incontable) / <b>there are</b> (varias).', 'Negativa: there isn\'t / there aren\'t <b>any</b>. Pregunta: <b>Is there</b>…? <b>Are there any</b>…?', 'Nunca digas «It has» ni «Is» para decir «hay».'],
    table: [['', 'Singular / incontable', 'Plural'], ['+', 'There is a cat.', 'There are two cats.'], ['−', "There isn't any milk.", "There aren't any eggs."], ['?', 'Is there a bank?', 'Are there any shops?']],
    ex: [['There is a painting on the table.', 'Hay un cuadro sobre la mesa.'], ['There are a lot of people.', 'Hay mucha gente.']],
    tip: 'Mira lo que viene después: ¿uno o incontable? → is. ¿Varios? → are.'
  },
  items: [
    ['There ___ a painting on the table.', ['is', 'are', 'has', 'it is'], 'Hay un cuadro sobre la mesa.', 'Un solo cuadro (a painting) → there is.', 'painting=cuadro=tableau; table=mesa=table', 'be'],
    ['There ___ three cats in the garden.', ['are', 'is', 'has', 'have'], 'Hay tres gatos en el jardín.', 'Tres gatos (plural) → there are.', 'cat=gato=chat; garden=jardín=jardin', 'be'],
    ['___ a problem with my computer.', ['There is', 'It has', 'There are', 'Is'], 'Hay un problema con mi ordenador.', '«Hay» = there is. Nunca «It has» ni «Is».', 'problem=problema=problème; computer=ordenador=ordinateur', 'be'],
    ["There isn't ___ milk in the fridge.", ['any', 'some', 'a', 'many'], 'No hay leche en la nevera.', 'En negativas se usa any. «Milk» es incontable: no lleva «a» ni «many».', 'milk=leche=lait; fridge=nevera=frigo', 'be'],
    ['___ there any shops near here?', ['Are', 'Is', 'Do', 'Have'], '¿Hay tiendas cerca de aquí?', 'Shops es plural → Are there any…?', 'near here=cerca de aquí=près d\'ici; shop=tienda=magasin', 'be'],
    ['There ___ some water in the bottle.', ['is', 'are', 'have', 'be'], 'Hay algo de agua en la botella.', 'Water es incontable → there is.', 'water=agua=eau; bottle=botella=bouteille', 'be'],
    ['There are ___ people at the party.', ['a lot of', 'much', 'a', 'any'], 'Hay mucha gente en la fiesta.', 'People es plural: a lot of (o many). «Much» es para incontables.', 'people=gente=gens; party=fiesta=fête', 'be'],
    ['Is there a bank near the station? — Yes, there ___.', ['is', 'are', 'has', 'it is'], '¿Hay un banco cerca de la estación? — Sí, hay.', 'Respuesta corta: Yes, there is.', 'bank=banco=banque; station=estación=gare', 'be', 'c'],
    ["There ___ any eggs. We need to buy some.", ["aren't", "isn't", "don't", 'not are'], 'No hay huevos. Tenemos que comprar algunos.', 'Eggs es plural → there aren\'t any.', 'egg=huevo=œuf; buy=comprar=acheter', 'be,buy'],
    ['There ___ a lot of noise outside.', ['is', 'are', 'has', 'have'], 'Hay mucho ruido fuera.', 'Noise es incontable → there is.', 'noise=ruido=bruit; outside=fuera=dehors', 'be'],
    ['How many students ___ there in your class?', ['are', 'is', 'have', 'do'], '¿Cuántos estudiantes hay en tu clase?', 'How many + plural → are there.', 'student=estudiante=étudiant', 'be'],
    ['There ___ two beds in my room.', ['are', 'is', 'has', 'have'], 'Hay dos camas en mi habitación.', 'Dos camas → there are.', 'bed=cama=lit; room=habitación=chambre', 'be'],
    ['There ___ nothing in the box.', ['is', 'are', "isn't", 'has'], 'No hay nada en la caja.', '«Nothing» ya es negativo: there is nothing (no «there isn\'t nothing»).', 'nothing=nada=rien; box=caja=boîte', 'be']
  ] },
{ id: 'pron', cefr: 'A1', title: 'Pronombres y posesivos', es: 'I / me / my / mine',
  lesson: {
    points: ['Sujeto: I, you, he, she, it, we, they.', 'Objeto (detrás del verbo): me, you, him, her, it, us, them.', 'Posesivo + nombre: my, your, his, her, its, our, their. Solo: mine, yours, his, hers, ours, theirs.', '<b>His</b> o <b>her</b> depende del DUEÑO, no de la cosa: Tom loves <b>his</b> mother.'],
    table: [['Sujeto', 'Objeto', 'Posesivo', 'Pronombre'], ['I', 'me', 'my', 'mine'], ['he', 'him', 'his', 'his'], ['she', 'her', 'her', 'hers'], ['we', 'us', 'our', 'ours'], ['they', 'them', 'their', 'theirs']],
    ex: [['Can you help me?', '¿Puedes ayudarme?'], ['Maria is with her husband.', 'María está con su marido.'], ["It's mine.", 'Es mío.']],
    tip: '«Su» en español es ambiguo. En inglés pregúntate: ¿de él (his), de ella (her) o de ellos (their)?'
  },
  items: [
    ['This is Anna. ___ is my neighbour.', ['She', 'Her', 'He', 'It'], 'Esta es Anna. Es mi vecina.', 'Sujeto femenino → she.', 'neighbour=vecino/a=voisin', 'be'],
    ['Can you help ___?', ['me', 'I', 'my', 'mine'], '¿Puedes ayudarme?', 'Detrás del verbo va el pronombre objeto: me.', 'help=ayudar=aider', 'help'],
    ['Tom loves ___ mother.', ['his', 'her', 'its', 'he'], 'Tom quiere a su madre.', 'El dueño es Tom (él) → his, aunque «mother» sea femenino.', 'mother=madre=mère; love=querer, encantar=aimer', 'like'],
    ['Maria is with ___ husband.', ['her', 'his', 'she', 'hers'], 'María está con su marido.', 'La dueña es María (ella) → her.', 'husband=marido=mari', 'be'],
    ["Is this bag yours? — Yes, it's ___.", ['mine', 'my', 'me', 'I'], '¿Esta bolsa es tuya? — Sí, es mía.', 'Sin nombre detrás → pronombre posesivo: mine.', 'bag=bolsa=sac', 'be'],
    ['I see my friends every day. I talk to ___ a lot.', ['them', 'they', 'their', 'theirs'], 'Veo a mis amigos todos los días. Hablo mucho con ellos.', 'Objeto plural → them.', 'every day=todos los días=tous les jours; talk=hablar=parler', 'see'],
    ['The cat is eating ___ food.', ['its', "it's", 'his', 'it'], 'El gato está comiendo su comida.', 'Its = su (de un animal o cosa). It\'s = it is.', 'food=comida=nourriture', 'eat'],
    ['We love ___ new house.', ['our', 'us', 'we', 'ours'], 'Nos encanta nuestra casa nueva.', 'Posesivo de we → our.', 'house=casa=maison; new=nuevo=nouveau', 'like'],
    ['Please call ___ at eight.', ['me', 'I', 'my', 'mine'], 'Por favor, llámame a las ocho.', 'Detrás del verbo → me.', 'call=llamar=appeler', 'call'],
    ["That car isn't ours. It's ___.", ['theirs', 'their', 'them', 'they'], 'Ese coche no es nuestro. Es de ellos.', 'Sin nombre detrás → theirs.', 'car=coche=voiture', 'be'],
    ['My brother and ___ are going to the cinema.', ['I', 'me', 'my', 'mine'], 'Mi hermano y yo vamos al cine.', 'Es sujeto de la frase → «my brother and I».', 'cinema=cine=cinéma', 'go'],
    ['She gave ___ a present.', ['him', 'he', 'his', "he's"], 'Ella le dio un regalo (a él).', 'Detrás del verbo → him.', 'present=regalo=cadeau', 'give'],
    ["Where are ___ shoes? I can't find them.", ['my', 'me', 'mine', 'I'], '¿Dónde están mis zapatos? No los encuentro.', 'Delante de un nombre → my.', 'shoes=zapatos=chaussures; find=encontrar=trouver', 'find']
  ] },
{ id: 'pres', cefr: 'A1', title: 'Presente simple', es: 'Hábitos y verdades: I work / she works',
  lesson: {
    points: ['Se usa para rutinas, hábitos y hechos: I work every day.', 'Con <b>he / she / it</b> el verbo lleva <b>-s</b>: she work<b>s</b>.', '-es tras s, sh, ch, x, o: watch<b>es</b>, go<b>es</b>. Consonante + y → <b>-ies</b>: study → stud<b>ies</b>. have → <b>has</b>.', '<b>Do</b> = hacer tareas (homework, the dishes). <b>Make</b> = crear o fabricar (a cake, a mistake).'],
    table: [['Persona', 'work', 'go', 'study', 'have'], ['I / you / we / they', 'work', 'go', 'study', 'have'], ['he / she / it', 'works', 'goes', 'studies', 'has']],
    ex: [['She works in a hospital.', 'Trabaja en un hospital.'], ['He goes to the gym.', 'Va al gimnasio.'], ['Water boils at 100 degrees.', 'El agua hierve a 100 grados.']],
    tip: 'La <b>-s</b> de he/she/it es la letra que más se olvida. ¡Que no se te escape!'
  },
  items: [
    ['She ___ in a hospital.', ['works', 'work', 'working', 'is work'], 'Ella trabaja en un hospital.', 'She → verbo + s: works.', 'hospital=hospital=hôpital', 'work'],
    ['My father ___ coffee every morning.', ['drinks', 'drink', 'drinking', 'drinked'], 'Mi padre bebe café todas las mañanas.', 'My father = he → drinks.', 'coffee=café=café; morning=mañana=matin', 'drink'],
    ['They ___ football on Sundays.', ['play', 'plays', 'playing', 'are play'], 'Juegan al fútbol los domingos.', 'They → forma base, sin -s.', 'football=fútbol=football; Sunday=domingo=dimanche', 'play'],
    ['He ___ to the gym after work.', ['goes', 'go', 'gos', 'going'], 'Va al gimnasio después del trabajo.', 'go → goes (se añade -es).', 'gym=gimnasio=salle de sport', 'go'],
    ['The shop ___ at nine o\'clock.', ['opens', 'open', 'opening', 'to open'], 'La tienda abre a las nueve.', 'The shop = it → opens.', "o'clock=en punto=heures pile", 'open'],
    ['My sister ___ English at university.', ['studies', 'studys', 'study', 'studying'], 'Mi hermana estudia inglés en la universidad.', 'Consonante + y → ies: studies.', 'university=universidad=université', 'study'],
    ['I ___ up at seven every day.', ['get', 'gets', 'getting', 'to get'], 'Me levanto a las siete todos los días.', 'I → forma base. «Get up» = levantarse.', 'get up=levantarse=se lever', 'get'],
    ['Water ___ at 100 degrees.', ['boils', 'boil', 'boiling', 'is boil'], 'El agua hierve a 100 grados.', 'Hechos generales → presente simple. Water = it → boils.', 'boil=hervir=bouillir; degree=grado=degré', ''],
    ['She ___ two children.', ['has', 'have', 'haves', 'is'], 'Ella tiene dos hijos.', 'have → has con he/she/it.', 'children=hijos, niños=enfants', 'have'],
    ['We ___ near the sea.', ['live', 'lives', 'living', 'are live'], 'Vivimos cerca del mar.', 'We → forma base.', 'sea=mar=mer; near=cerca de=près de', 'live'],
    ['He ___ TV at night.', ['watches', 'watchs', 'watch', 'watching'], 'Él ve la tele por la noche.', 'Termina en ch → -es: watches.', 'at night=por la noche=la nuit', 'watch'],
    ['My cat ___ all day.', ['sleeps', 'sleep', 'sleeping', 'is sleep'], 'Mi gato duerme todo el día.', 'My cat = it → sleeps.', 'all day=todo el día=toute la journée', 'sleep'],
    ['The train ___ at 8:15.', ['leaves', 'leave', 'leaving', 'is leave'], 'El tren sale a las 8:15.', 'Horarios → presente simple. The train = it → leaves.', 'train=tren=train', 'leave'],
    ['I ___ my homework in the evening.', ['do', 'make', 'does', 'makes'], 'Hago los deberes por la tarde.', 'Deberes, tareas y ejercicio → do. Make = crear o fabricar (make a cake).', 'homework=deberes=devoirs; evening=tarde-noche=soir', 'do']
  ] },
{ id: 'do', cefr: 'A1', title: 'Do / Does: preguntas y negativas', es: '¿Te gusta…? / No como…',
  lesson: {
    points: ['Pregunta: <b>Do</b> I/you/we/they…? <b>Does</b> he/she/it…?', 'Negativa: <b>don\'t</b> / <b>doesn\'t</b> + verbo base.', 'Con does o doesn\'t, el verbo PIERDE la -s: She doesn\'t like (no «doesn\'t likes»).'],
    table: [['', 'I / you / we / they', 'he / she / it'], ['Pregunta', 'Do you work?', 'Does she work?'], ['Negativa', "I don't work.", "She doesn't work."], ['Corta', 'Yes, I do. / No, I don\'t.', 'Yes, she does. / No, she doesn\'t.']],
    ex: [['Do you like pizza?', '¿Te gusta la pizza?'], ["He doesn't eat meat.", 'Él no come carne.']],
    tip: 'La -s solo puede estar en un sitio: si ya está en «doe<b>s</b>», el verbo va limpio.'
  },
  items: [
    ['___ you like pizza?', ['Do', 'Does', 'Are', 'Is'], '¿Te gusta la pizza?', 'You → Do you…?', 'like=gustar=aimer', 'like'],
    ['___ she speak French?', ['Does', 'Do', 'Is', 'Speaks'], '¿Habla ella francés?', 'She → Does she + verbo base?', 'French=francés=français', 'speak'],
    ["He doesn't ___ meat.", ['eat', 'eats', 'eating', 'ate'], 'Él no come carne.', 'Después de doesn\'t, el verbo va en forma base (sin -s).', 'meat=carne=viande', 'eat'],
    ['I ___ understand this word.', ["don't", "doesn't", 'not', 'am not'], 'No entiendo esta palabra.', 'I → don\'t + verbo.', 'word=palabra=mot', 'understand'],
    ['Where ___ your parents live?', ['do', 'does', 'are', 'is'], '¿Dónde viven tus padres?', 'Your parents = they → do.', 'parents=padres=parents', 'live'],
    ['What time ___ the film start?', ['does', 'do', 'is', 'start'], '¿A qué hora empieza la película?', 'The film = it → does.', 'film=película=film; start=empezar=commencer', 'start'],
    ['My brother ___ have a car.', ["doesn't", "don't", "isn't", 'not'], 'Mi hermano no tiene coche.', 'My brother = he → doesn\'t.', 'car=coche=voiture', 'have'],
    ['Do you work here? — No, I ___.', ["don't", "doesn't", 'am not', 'not'], '¿Trabajas aquí? — No.', 'Respuesta corta con el mismo auxiliar: Do…? → No, I don\'t.', 'here=aquí=ici', 'work', 'c'],
    ['Does it rain a lot in London? — Yes, it ___.', ['does', 'do', 'is', 'rains'], '¿Llueve mucho en Londres? — Sí.', 'Does…? → Yes, it does.', 'rain=llover=pleuvoir; a lot=mucho=beaucoup', '', 'c'],
    ["We don't ___ to school on Saturdays.", ['go', 'goes', 'going', 'went'], 'No vamos al colegio los sábados.', 'Después de don\'t → forma base.', 'school=colegio=école; Saturday=sábado=samedi', 'go'],
    ['How often ___ you cook?', ['do', 'does', 'are', 'is'], '¿Con qué frecuencia cocinas?', 'You → do.', 'how often=con qué frecuencia=à quelle fréquence; cook=cocinar=cuisiner', 'cook'],
    ['She ___ want to come with us.', ["doesn't", "don't", "isn't", 'not'], 'Ella no quiere venir con nosotros.', 'She → doesn\'t + want.', 'want=querer=vouloir; with us=con nosotros=avec nous', 'want,come'],
    ['Do they know the answer? — No, they ___.', ["don't", "doesn't", "aren't", 'not'], '¿Saben la respuesta? — No.', 'They → don\'t.', 'answer=respuesta=réponse; know=saber=savoir', 'know', 'c']
  ] },
{ id: 'can', cefr: 'A1', title: 'Can / Can\'t', es: 'Poder y saber hacer',
  lesson: {
    points: ['<b>Can</b> = poder / saber hacer algo. Igual para todas las personas: she <b>can</b> (sin -s).', 'Después de can, verbo base SIN «to»: I can swim (nunca «can to swim»).', 'Negativa: <b>can\'t</b> / cannot. Pregunta: <b>Can</b> you…?'],
    table: [['', 'Ejemplo'], ['+', 'I can swim.'], ['−', "She can't drive."], ['?', 'Can you help me?']],
    ex: [['She can speak three languages.', 'Sabe hablar tres idiomas.'], ['Can I open the window?', '¿Puedo abrir la ventana?']],
    tip: 'Can es un verbo «perezoso»: nunca cambia y no quiere «to».'
  },
  items: [
    ['I can ___ very fast.', ['run', 'to run', 'runs', 'running'], 'Puedo correr muy rápido.', 'Can + verbo base, sin «to».', 'fast=rápido=vite', 'run'],
    ['She ___ speak three languages.', ['can', 'cans', 'can to', 'is can'], 'Ella sabe hablar tres idiomas.', 'Can no lleva -s ni «to».', 'language=idioma=langue', 'speak'],
    ['___ you help me with this box?', ['Can', 'Do', 'Are', 'Does'], '¿Puedes ayudarme con esta caja?', 'Pedir ayuda: Can you…?', 'box=caja=boîte', 'help'],
    ["I'm sorry, I ___ come tonight.", ["can't", "don't can", 'not can', 'no can'], 'Lo siento, no puedo venir esta noche.', 'Negativa: can\'t (cannot).', "tonight=esta noche=ce soir; sorry=lo siento=désolé", 'come'],
    ['Can he swim? — Yes, he ___.', ['can', 'cans', 'does', 'is'], '¿Sabe nadar? — Sí.', 'Can…? → Yes, he can.', 'swim=nadar=nager', 'swim', 'c'],
    ['We can ___ the sea from our window.', ['see', 'to see', 'seeing', 'sees'], 'Podemos ver el mar desde nuestra ventana.', 'Can + verbo base.', 'sea=mar=mer; window=ventana=fenêtre', 'see'],
    ['My grandmother ___ use a computer.', ["can't", "doesn't can", "isn't can", 'not can'], 'Mi abuela no sabe usar un ordenador.', 'Negativa: can\'t + verbo.', 'grandmother=abuela=grand-mère', 'use'],
    ['Can I ___ the window?', ['open', 'to open', 'opening', 'opens'], '¿Puedo abrir la ventana?', 'Can + verbo base.', 'window=ventana=fenêtre', 'open'],
    ['Where can we ___ the bus?', ['take', 'to take', 'taking', 'takes'], '¿Dónde podemos coger el autobús?', 'Coger un transporte = take.', 'take the bus=coger el autobús=prendre le bus', 'take'],
    ["You ___ park here. It's not allowed.", ["can't", 'can', "don't", "aren't"], 'No puedes aparcar aquí. No está permitido.', 'Prohibición suave: can\'t.', 'park=aparcar=se garer; allowed=permitido=autorisé', ''],
    ['Dogs can ___ very well.', ['smell', 'to smell', 'smells', 'smelling'], 'Los perros huelen muy bien.', 'Can + verbo base.', 'smell=oler=sentir', ''],
    ['___ you play the guitar? — A little.', ['Can', 'Are', 'Does', 'Is'], '¿Sabes tocar la guitarra? — Un poco.', 'Habilidad: Can you…?', 'play the guitar=tocar la guitarra=jouer de la guitare; a little=un poco=un peu', 'play']
  ] },
{ id: 'art', cefr: 'A1', title: 'A / An / The y plurales', es: 'Artículos y plurales irregulares',
  lesson: {
    points: ['<b>a</b> + sonido consonante (a car, a university). <b>an</b> + sonido vocal (an apple, an hour).', '<b>the</b> = algo concreto que ya conocemos: Pass me the salt.', 'Hablando EN GENERAL no hay artículo: Life is beautiful. I like dogs.', 'Profesiones con a/an: She is an engineer.', 'Plurales irregulares: man → men, woman → women, child → children, person → people, foot → feet, tooth → teeth, mouse → mice.'],
    table: [['Singular', 'Plural'], ['man', 'men'], ['child', 'children'], ['person', 'people'], ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice']],
    ex: [['I need an hour.', 'Necesito una hora.'], ['Life is beautiful.', 'La vida es bonita.'], ['The people are friendly.', 'La gente es amable.']],
    tip: '«People» siempre es plural: people <b>are</b>.'
  },
  items: [
    ['I eat ___ apple every day.', ['an', 'a', 'the', 'some'], 'Me como una manzana todos los días.', 'Apple empieza con sonido vocal → an.', 'apple=manzana=pomme', 'eat'],
    ['She is ___ engineer.', ['an', 'a', 'the', '—'], 'Ella es ingeniera.', 'Las profesiones llevan a/an. Engineer empieza por vocal → an.', 'engineer=ingeniero=ingénieur', 'be', 'c'],
    ['___ life is beautiful.', ['—', 'The', 'A', 'An'], 'La vida es bonita.', 'Hablando en general, sin artículo: «Life is beautiful» (no «The life»).', 'life=vida=vie; beautiful=bonito=beau', 'be', 'c'],
    ['Three ___ are waiting outside.', ['men', 'mans', 'man', 'mens'], 'Tres hombres están esperando fuera.', 'man → men (plural irregular).', 'wait=esperar=attendre; outside=fuera=dehors', ''],
    ['My ___ hurt after the long walk.', ['feet', 'foots', 'foot', 'feets'], 'Me duelen los pies después de la larga caminata.', 'foot → feet (plural irregular).', 'walk=paseo, caminata=promenade; hurt=doler=faire mal', ''],
    ['The people in this town ___ very friendly.', ['are', 'is', 'has', 'was'], 'La gente de este pueblo es muy amable.', 'People es plural → are.', 'friendly=amable=sympathique; town=pueblo, ciudad=ville', 'be'],
    ['Can you pass me ___ salt, please?', ['the', 'a', 'an', 'some of'], '¿Me pasas la sal, por favor?', 'Algo concreto que ambos vemos → the.', 'salt=sal=sel; pass=pasar=passer', ''],
    ['I need ___ hour to finish.', ['an', 'a', 'the', 'one of'], 'Necesito una hora para terminar.', 'En «hour» la h no suena → an hour.', 'hour=hora=heure; finish=terminar=finir', ''],
    ['She has two ___.', ['children', 'childs', 'child', 'childrens'], 'Ella tiene dos hijos.', 'child → children.', 'child=niño, hijo=enfant', 'have'],
    ["It's ___ university in the north.", ['a', 'an', 'the some', '—'], 'Es una universidad del norte.', 'University suena /ju/ (consonante) → a university.', 'north=norte=nord', 'be', 'c'],
    ["I like ___ dogs, but I don't like cats.", ['—', 'the', 'a', 'an'], 'Me gustan los perros, pero no me gustan los gatos.', 'Gustos en general → sin artículo.', 'dog=perro=chien', 'like', 'c'],
    ['There are some ___ in the kitchen.', ['mice', 'mouses', 'mouse', 'mices'], 'Hay algunos ratones en la cocina.', 'mouse → mice.', 'mouse=ratón=souris', 'be'],
    ['Brush your ___ before bed.', ['teeth', 'tooths', 'tooth', 'teeths'], 'Lávate los dientes antes de dormir.', 'tooth → teeth.', 'brush=cepillar=brosser; tooth=diente=dent', '']
  ] },
{ id: 'place', cefr: 'A1', title: 'Preposiciones de lugar', es: 'in / on / under / between…',
  lesson: {
    points: ['<b>in</b> = dentro · <b>on</b> = encima, tocando · <b>under</b> = debajo · <b>above</b> = por encima (sin tocar).', '<b>next to</b> = al lado de · <b>between</b> = entre (dos) · <b>behind</b> = detrás de · <b>in front of</b> = delante de · <b>opposite</b> = enfrente (al otro lado).', '<b>at</b> para puntos concretos: at the door, at home, at work.'],
    table: [['Inglés', 'Español', 'Français'], ['in', 'en, dentro de', 'dans'], ['on', 'sobre, encima de', 'sur'], ['under', 'debajo de', 'sous'], ['next to', 'al lado de', 'à côté de'], ['between', 'entre', 'entre'], ['behind', 'detrás de', 'derrière'], ['in front of', 'delante de', 'devant'], ['opposite', 'enfrente de', 'en face de']],
    ex: [['The keys are in the box.', 'Las llaves están en la caja.'], ['The bank is between the café and the pharmacy.', 'El banco está entre la cafetería y la farmacia.']],
    tip: 'Imagina una caja: in (dentro), on (encima), under (debajo), behind (detrás).'
  },
  items: [
    ['The keys are ___ the box.', ['in', 'on', 'at', 'of'], 'Las llaves están dentro de la caja.', 'Dentro de algo → in.', 'key=llave=clé; box=caja=boîte', 'be', 's'],
    ['The cat is sleeping ___ the bed.', ['under', 'on', 'in', 'behind'], 'El gato está durmiendo debajo de la cama.', 'Debajo → under.', 'bed=cama=lit', 'sleep', 's'],
    ['The bank is ___ the café and the pharmacy.', ['between', 'next', 'among', 'in'], 'El banco está entre la cafetería y la farmacia.', 'Entre dos cosas → between.', 'pharmacy=farmacia=pharmacie', 'be', 's'],
    ['Your phone is ___ the table.', ['on', 'in', 'at', 'over'], 'Tu teléfono está sobre la mesa.', 'Encima y tocando la superficie → on.', 'phone=teléfono=téléphone', 'be', 's'],
    ["I'm waiting ___ the door.", ['at', 'in', 'on', 'into'], 'Estoy esperando en la puerta.', 'Un punto concreto → at.', 'door=puerta=porte; wait=esperar=attendre', '', 's'],
    ['The car is ___ the house.', ['behind', 'in front of', 'under', 'next'], 'El coche está detrás de la casa.', 'Detrás → behind.', 'car=coche=voiture', 'be', 's'],
    ["There's a tree ___ the window.", ['in front of', 'behind', 'front of', 'before'], 'Hay un árbol delante de la ventana.', 'Delante → in front of (las tres palabras).', 'tree=árbol=arbre', 'be', 's'],
    ['She lives ___ me.', ['next to', 'next', 'near of', 'beside of'], 'Vive a mi lado.', 'Al lado de → next to (sin «of»).', 'live=vivir=habiter', 'live', 's'],
    ['The picture is ___ the sofa, on the wall.', ['above', 'on', 'in', 'at'], 'El cuadro está encima del sofá, en la pared.', 'Por encima sin tocar → above.', 'wall=pared=mur; picture=cuadro, foto=tableau, photo', 'be', 's'],
    ['We are ___ home tonight.', ['at', 'in', 'on', 'to'], 'Estamos en casa esta noche.', 'Estar en casa → at home.', 'home=casa (hogar)=maison', 'be', 's'],
    ['The supermarket is ___ the bank, on the other side of the street.', ['opposite', 'in front', 'between', 'under'], 'El supermercado está enfrente del banco, al otro lado de la calle.', 'Enfrente (al otro lado) → opposite.', 'street=calle=rue; side=lado=côté', 'be', 's'],
    ['The children are ___ the garden.', ['in', 'on', 'at', 'into'], 'Los niños están en el jardín.', 'En un espacio con límites → in.', 'garden=jardín=jardin', 'be', 's'],
    ['Put the shoes ___ the bed, not on it.', ['under', 'in', 'above', 'between'], 'Pon los zapatos debajo de la cama, no encima.', 'Debajo → under.', 'put=poner=mettre', 'put', 's']
  ] },
{ id: 'cont', cefr: 'A1', title: 'Presente continuo', es: 'Lo que pasa AHORA: I am running',
  lesson: {
    points: ['<b>am / is / are + verbo-ing</b> para lo que pasa ahora mismo.', 'Ortografía: make → mak<b>ing</b> (se va la e), run → ru<b>nn</b>ing (se dobla), lie → l<b>y</b>ing.', 'Los verbos de estado NO van en continuo: know, like, want, think (= creer), understand.'],
    table: [['Persona', 'Ejemplo'], ['I', "I'm reading."], ['he / she / it', "She's working."], ['you / we / they', "They're having dinner."]],
    ex: [['Look! It is raining.', '¡Mira! Está lloviendo.'], ['What are you doing?', '¿Qué estás haciendo?']],
    tip: 'Ahora mismo = is/are + -ing. Siempre o normalmente = presente simple.'
  },
  items: [
    ['Look! It ___ raining.', ['is', 'are', 'do', 'has'], '¡Mira! Está lloviendo.', 'It → is + -ing.', 'look=mirar=regarder', 'be'],
    ['I ___ reading a book right now.', ['am', 'is', 'are', 'do'], 'Estoy leyendo un libro ahora mismo.', 'I → am + -ing.', 'right now=ahora mismo=en ce moment', 'read'],
    ['They are ___ dinner at the moment.', ['having', 'have', 'has', 'haveing'], 'Están cenando en este momento.', 'have → having (se va la e).', 'dinner=cena=dîner', 'have'],
    ['She is ___ to the station.', ['running', 'runing', 'run', 'runs'], 'Está corriendo hacia la estación.', 'run → running: consonante + vocal + consonante → se dobla la n.', 'station=estación=gare', 'run'],
    ['What ___ you doing?', ['are', 'is', 'do', 'does'], '¿Qué estás haciendo?', 'You → are + -ing.', 'do=hacer=faire', 'do'],
    ['We ___ not working today.', ['are', 'is', 'do', 'am'], 'Hoy no estamos trabajando.', 'We → are not + -ing.', 'today=hoy=aujourd\'hui', 'work'],
    ['Why is the baby ___?', ['crying', 'cry', 'crys', 'cryed'], '¿Por qué está llorando el bebé?', 'cry → crying (la y se queda).', 'baby=bebé=bébé; cry=llorar=pleurer', 'cry'],
    ['He is ___ a cake for the party.', ['making', 'makeing', 'make', 'doing'], 'Está haciendo una tarta para la fiesta.', 'make → making. Una tarta se «make» (crear), no se «do».', 'cake=tarta=gâteau', 'make'],
    ['I ___ you are right.', ['think', 'am thinking', 'thinking', 'thinks'], 'Creo que tienes razón.', 'Think = creer (opinión) es un verbo de estado: no va en continuo.', 'be right=tener razón=avoir raison', 'think'],
    ['Listen! Someone ___ at the door.', ['is knocking', 'knocks', 'knocking', 'are knocking'], '¡Escucha! Alguien está llamando a la puerta.', 'Ahora mismo → is + -ing. Someone es singular.', 'knock=llamar (golpear)=frapper', 'listen'],
    ['Are you ___ to me?', ['listening', 'listen', 'listens', 'listenning'], '¿Me estás escuchando?', 'listen → listening (no se dobla: el acento no va al final).', 'listen=escuchar=écouter', 'listen'],
    ['The dog is ___ on the grass.', ['lying', 'lieing', 'lie', 'lays'], 'El perro está tumbado en la hierba.', 'lie → lying (ie → y).', 'grass=hierba=herbe', 'lie'],
    ['I ___ the answer.', ['know', 'am knowing', 'knowing', 'knows'], 'Sé la respuesta.', 'Know es un verbo de estado: nunca «I am knowing».', 'answer=respuesta=réponse', 'know']
  ] },
/* ============================== A2 ============================== */
{ id: 'was', cefr: 'A2', title: 'Was / Were', es: 'El pasado de «to be»',
  lesson: {
    points: ['I / he / she / it <b>was</b> · you / we / they <b>were</b>.', 'Negativa: wasn\'t / weren\'t. Pregunta: Was she…? Were you…?', 'Nacer = <b>be born</b>: I was born in 1998. Where were you born?'],
    table: [['Persona', '+', '−', '?'], ['I / he / she / it', 'was', "wasn't", 'Was he…?'], ['you / we / they', 'were', "weren't", 'Were you…?']],
    ex: [['I was at home yesterday.', 'Ayer estuve en casa.'], ['Where were you born?', '¿Dónde naciste?']],
    tip: '<b>Was</b> para uno (excepto you). <b>Were</b> para varios y para you.'
  },
  items: [
    ['I ___ at home yesterday.', ['was', 'were', 'am', 'did'], 'Ayer estuve en casa.', 'I + pasado → was.', 'yesterday=ayer=hier', 'be'],
    ['They ___ very happy at the wedding.', ['were', 'was', 'did', 'been'], 'Estaban muy felices en la boda.', 'They → were.', 'wedding=boda=mariage; happy=feliz=heureux', 'be'],
    ['___ you tired last night?', ['Were', 'Was', 'Did', 'Are'], '¿Estabas cansado anoche?', 'You → Were you…?', 'last night=anoche=hier soir', 'be'],
    ['The film ___ boring, so we left early.', ['was', 'were', 'did', 'is be'], 'La película era aburrida, así que nos fuimos pronto.', 'The film = it → was.', 'boring=aburrido=ennuyeux; early=pronto=tôt', 'be,leave'],
    ["We ___ at the beach. We were at the park.", ["weren't", "wasn't", "didn't", 'not were'], 'No estábamos en la playa. Estábamos en el parque.', 'We → weren\'t.', 'park=parque=parc', 'be'],
    ['Was the weather good? — No, it ___.', ["wasn't", "weren't", "didn't", "isn't"], '¿Hizo buen tiempo? — No.', 'Was…? → No, it wasn\'t.', 'weather=tiempo (clima)=temps', 'be', 'c'],
    ['Where ___ you born?', ['were', 'was', 'did', 'are'], '¿Dónde naciste?', 'Nacer = be born → Where were you born?', 'be born=nacer=naître', 'be'],
    ['My grandparents ___ farmers in the 1950s.', ['were', 'was', 'are', 'did'], 'Mis abuelos eran agricultores en los años 50.', 'Plural en pasado → were.', 'farmer=agricultor=agriculteur; grandparents=abuelos=grands-parents', 'be'],
    ['It ___ cold last winter.', ['was', 'were', 'did', 'had'], 'El invierno pasado hizo frío.', 'It → was. El tiempo va con to be.', 'winter=invierno=hiver', 'be'],
    ['Who ___ at the door five minutes ago?', ['was', 'were', 'did', 'is'], '¿Quién estaba en la puerta hace cinco minutos?', '«Ago» = hace (tiempo). Pasado → was.', 'ago=hace (tiempo)=il y a', 'be'],
    ["The shops ___ open on Sunday, so we stayed at home.", ["weren't", "wasn't", "didn't", "aren't"], 'Las tiendas no estaban abiertas el domingo, así que nos quedamos en casa.', 'The shops = they → weren\'t.', 'stay=quedarse=rester', 'be'],
    ['I ___ born in 1998.', ['was', 'were', 'am', 'did'], 'Nací en 1998.', 'Nacer → I was born.', 'be born=nacer=naître', 'be']
  ] },
{ id: 'past', cefr: 'A2', title: 'Pasado simple', es: 'Regulares (-ed), irregulares y did',
  lesson: {
    points: ['Regulares: + <b>-ed</b> → worked, opened. stop → sto<b>pp</b>ed, study → stud<b>ied</b>.', 'Irregulares: hay que aprenderlos (go → went, see → saw…). Mira la tabla de verbos.', 'Negativa y pregunta con <b>did</b> + verbo BASE: I didn\'t go. Did you sleep?'],
    table: [['', 'Ejemplo'], ['+', 'I went to the beach.'], ['−', "I didn't go."], ['?', 'Did you go?']],
    ex: [['We saw a great film.', 'Vimos una película genial.'], ['He woke up at six.', 'Se despertó a las seis.'], ['I missed the bus.', 'Perdí el autobús.']],
    tip: 'Did ya lleva el pasado: el verbo descansa en forma base. «Did you went?» ✘ → «Did you go?» ✔'
  },
  items: [
    ['Yesterday I ___ to the supermarket.', ['went', 'go', 'goed', 'gone'], 'Ayer fui al supermercado.', 'go → went (irregular).', 'supermarket=supermercado=supermarché', 'go'],
    ['She ___ the window because it was hot.', ['opened', 'open', 'opens', 'openned'], 'Abrió la ventana porque hacía calor.', 'Regular: open → opened.', 'hot=caluroso=chaud', 'open'],
    ['We ___ a great film last weekend.', ['saw', 'see', 'seen', 'seed'], 'Vimos una película genial el fin de semana pasado.', 'see → saw → seen.', 'weekend=fin de semana=week-end; great=genial=génial', 'see'],
    ["I didn't ___ the email.", ['send', 'sent', 'sended', 'sending'], 'No envié el correo.', 'Después de didn\'t → forma base.', 'email=correo electrónico=courriel', 'send'],
    ['___ you sleep well?', ['Did', 'Were', 'Was', 'Have'], '¿Dormiste bien?', 'Pregunta en pasado: Did + sujeto + verbo base.', 'well=bien=bien', 'sleep'],
    ['He ___ up at six this morning.', ['woke', 'waked', 'wake', 'woken'], 'Se despertó a las seis esta mañana.', 'wake → woke → woken.', 'this morning=esta mañana=ce matin', 'wake'],
    ['They ___ breakfast at the hotel yesterday.', ['had', 'haved', 'have', 'has'], 'Ayer desayunaron en el hotel.', 'have → had. «Have breakfast» = desayunar.', 'breakfast=desayuno=petit-déjeuner', 'have'],
    ['I ___ my wallet on the bus last night.', ['lost', 'losed', 'lose', 'loosed'], 'Anoche perdí la cartera en el autobús.', 'lose → lost.', 'wallet=cartera=portefeuille', 'lose'],
    ['Did she call you? — No, she ___.', ["didn't", "doesn't", "wasn't", 'not'], '¿Te llamó? — No.', 'Did…? → No, she didn\'t.', 'call=llamar=appeler', 'call', 'c'],
    ['On the way, we ___ at a small café.', ['stopped', 'stoped', 'stop', 'stopping'], 'Por el camino, paramos en una pequeña cafetería.', 'stop → stopped (se dobla la p).', 'on the way=por el camino=en chemin', 'stop'],
    ['She ___ hard for the exam last week.', ['studied', 'studyed', 'study', 'studies'], 'Estudió mucho para el examen la semana pasada.', 'study → studied (y → ied).', 'exam=examen=examen; hard=mucho, duro=dur', 'study'],
    ['I ___ my best friend in 2015.', ['met', 'meeted', 'meet', 'meat'], 'Conocí a mi mejor amigo en 2015.', 'Conocer a alguien por primera vez = meet → met.', 'best friend=mejor amigo=meilleur ami', 'meet'],
    ['What did you ___ last night?', ['do', 'did', 'done', 'does'], '¿Qué hiciste anoche?', 'Did + forma base: do.', 'last night=anoche=hier soir', 'do'],
    ['He ___ me a funny story.', ['told', 'telled', 'tell', 'said'], 'Me contó una historia divertida.', 'Tell + persona (told me). Say no lleva persona directa («said me» ✘).', 'funny=divertido=drôle; story=historia=histoire', 'tell,say'],
    ['I ___ the bus, so I was late.', ['missed', 'lost', 'miss', 'losed'], 'Perdí el autobús, así que llegué tarde.', 'Perder un transporte = miss. «Lose» es perder un objeto.', 'late=tarde=en retard', 'miss,lose']
  ] },
{ id: 'future', cefr: 'A2', title: 'Futuro: will / going to', es: 'Decisiones, planes y predicciones',
  lesson: {
    points: ['<b>will</b> + verbo: decisiones del momento, promesas, ofrecimientos y predicciones (I\'ll help you).', '<b>be going to</b> + verbo: planes ya decididos y lo que vemos venir (It\'s going to rain).', 'Negativa: <b>won\'t</b> (= will not) / I\'m not going to.'],
    table: [['', 'will', 'going to'], ['Uso', 'decidir ahora, prometer, predecir', 'planes, evidencia'], ['+', "I'll call you.", "I'm going to call her."], ['−', "I won't tell anyone.", "I'm not going to come."]],
    ex: [["Look at those clouds! It's going to rain.", '¡Mira esas nubes! Va a llover.'], ["I'm thirsty. — I'll get you some water.", 'Tengo sed. — Te traigo agua.']],
    tip: '¿Ya estaba decidido? → going to. ¿Lo decides ahora? → will.'
  },
  items: [
    ["Look at those black clouds! It's ___ rain.", ['going to', 'will', 'going', 'goes to'], '¡Mira esas nubes negras! Va a llover.', 'Evidencia que vemos ahora → going to.', 'cloud=nube=nuage', ''],
    ["I'm thirsty. — I ___ get you some water.", ['will', 'am going', 'going to', 'am will'], 'Tengo sed. — Te traigo agua.', 'Decisión en el momento / ofrecimiento → will (I\'ll).', 'thirsty=sediento=assoiffé', 'get'],
    ['We ___ visit my aunt next Sunday. We bought the tickets.', ['are going to', 'will to', 'going to', 'are go to'], 'Vamos a visitar a mi tía el próximo domingo. Compramos los billetes.', 'Plan ya decidido → be going to.', 'aunt=tía=tante; ticket=billete=billet', 'buy'],
    ["I promise I ___ tell anyone.", ["won't", "don't", 'am not going', 'not will'], 'Prometo que no se lo diré a nadie.', 'Promesa → will. Negativa: won\'t.', 'promise=prometer=promettre; anyone=nadie (en negativas)=personne', 'tell'],
    ['Do you think it ___ be sunny tomorrow?', ['will', 'is', 'does', 'going'], '¿Crees que mañana hará sol?', 'Predicción con «I think» → will.', 'sunny=soleado=ensoleillé; tomorrow=mañana=demain', 'think'],
    ['She is going to ___ a new car.', ['buy', 'buys', 'buying', 'bought'], 'Va a comprarse un coche nuevo.', 'Going to + verbo base.', 'buy=comprar=acheter', 'buy'],
    ["I ___ going to study tonight.", ['am', 'will', 'do', 'is'], 'Voy a estudiar esta noche.', 'I + am going to.', 'study=estudiar=étudier', 'study'],
    ['In the future, robots ___ do many jobs.', ['will', 'are', 'going', 'did'], 'En el futuro, los robots harán muchos trabajos.', 'Predicción general → will.', 'job=trabajo (empleo)=emploi; future=futuro=avenir', 'do'],
    ["They aren't ___ to come to the party.", ['going', 'will', 'go', 'goes'], 'No van a venir a la fiesta.', 'Negativa de going to: aren\'t going to.', 'party=fiesta=fête', 'come'],
    ["The phone is ringing. — I'll ___ it!", ['get', 'getting', 'to get', 'gets'], 'Está sonando el teléfono. — ¡Ya lo cojo yo!', 'Will (\'ll) + verbo base.', 'ring=sonar=sonner', 'get'],
    ['What ___ you going to do this summer?', ['are', 'will', 'do', 'is'], '¿Qué vas a hacer este verano?', 'Pregunta: What are you going to…?', 'summer=verano=été', 'do'],
    ["Don't worry, everything ___ be OK.", ['will', 'is going', 'going to', 'wills'], 'No te preocupes, todo irá bien.', 'Promesa / predicción → will.', 'worry=preocuparse=s\'inquiéter; everything=todo=tout', '']
  ] },
{ id: 'conn', cefr: 'A2', title: 'Conectores', es: 'and / but / because / so / then / or',
  lesson: {
    points: ['<b>and</b> = y · <b>but</b> = pero · <b>or</b> = o.', '<b>because</b> = porque (la causa) · <b>so</b> = así que (el resultado).', '<b>then</b> = luego, después · <b>so (that) I can</b> = para poder.'],
    table: [['Inglés', 'Español', 'Français'], ['and', 'y', 'et'], ['but', 'pero', 'mais'], ['or', 'o', 'ou'], ['because', 'porque', 'parce que'], ['so', 'así que', 'donc'], ['then', 'luego', 'puis, ensuite']],
    ex: [['I was tired, so I went to bed.', 'Estaba cansado, así que me fui a la cama.'], ['I went to bed because I was tired.', 'Me fui a la cama porque estaba cansado.']],
    tip: 'Causa → because. Consecuencia → so.'
  },
  items: [
    ['I was tired, ___ I went to bed early.', ['so', 'because', 'but', 'or'], 'Estaba cansado, así que me fui a la cama pronto.', 'Resultado → so.', 'tired=cansado=fatigué; early=pronto=tôt', 'go', 's'],
    ['I went to bed early ___ I was tired.', ['because', 'so', 'but', 'then'], 'Me fui a la cama pronto porque estaba cansado.', 'Causa → because.', 'bed=cama=lit', 'go', 's'],
    ['She is small ___ very strong.', ['but', 'so', 'because', 'or'], 'Es pequeña pero muy fuerte.', 'Contraste → but.', 'small=pequeño=petit; strong=fuerte=fort', '', 's'],
    ['Do you want tea ___ coffee?', ['or', 'and', 'but', 'so'], '¿Quieres té o café?', 'Elegir entre dos → or.', 'tea=té=thé', 'want', 's'],
    ['First, wash the vegetables. ___, cut them.', ['Then', 'Because', 'But', 'Or'], 'Primero, lava las verduras. Luego, córtalas.', 'Orden de pasos → then.', 'vegetables=verduras=légumes; cut=cortar=couper; wash=lavar=laver', 'cut', 's'],
    ["I'm saving money ___ I can buy a bike.", ['so', 'because', 'but', 'then'], 'Estoy ahorrando dinero para poder comprar una bici.', 'So (that) I can = para poder.', 'save money=ahorrar=économiser; bike=bici=vélo', 'buy', 's'],
    ["He didn't come ___ he was ill.", ['because', 'so', 'and', 'or'], 'No vino porque estaba enfermo.', 'Causa → because.', 'ill=enfermo=malade', 'come', 's'],
    ['I like swimming ___ running.', ['and', 'but', 'so', 'because'], 'Me gusta nadar y correr.', 'Sumar → and.', 'swimming=nadar=nager', 'like', 's'],
    ['It was raining, ___ we stayed at home.', ['so', 'because', 'but', 'or'], 'Estaba lloviendo, así que nos quedamos en casa.', 'Resultado → so.', 'stay=quedarse=rester', '', 's'],
    ["I called him, ___ he didn't answer.", ['but', 'so', 'because', 'or'], 'Le llamé, pero no contestó.', 'Contraste → but.', 'answer=contestar=répondre', 'call', 's'],
    ['We can go by bus ___ by train.', ['or', 'and', 'but', 'so'], 'Podemos ir en autobús o en tren.', 'Opciones → or.', 'by bus=en autobús=en bus', 'go', 's'],
    ['She studies a lot ___ she wants to be a doctor.', ['because', 'so', 'but', 'or'], 'Estudia mucho porque quiere ser médica.', 'Causa → because.', 'doctor=médico=médecin', 'study', 's'],
    ["I'll finish this email, ___ I'll call you.", ['then', 'because', 'but', 'or'], 'Terminaré este correo y luego te llamo.', 'Después → then.', 'finish=terminar=finir', 'call', 's']
  ] },
{ id: 'comp', cefr: 'A2', title: 'Comparativos y superlativos', es: 'taller / the tallest / more / the most',
  lesson: {
    points: ['Adjetivo corto: + <b>-er</b> / <b>the -est</b> → tall, taller, the tallest. big → bi<b>gg</b>er. easy → eas<b>ier</b>.', 'Adjetivo largo: <b>more</b> / <b>the most</b> → more interesting, the most beautiful.', 'Irregulares: good → better → the best · bad → worse → the worst · far → further.', 'Comparar: <b>than</b> (que). Igualdad: <b>as … as</b> (tan … como).'],
    table: [['Adjetivo', 'Comparativo', 'Superlativo'], ['tall', 'taller', 'the tallest'], ['hot', 'hotter', 'the hottest'], ['easy', 'easier', 'the easiest'], ['beautiful', 'more beautiful', 'the most beautiful'], ['good', 'better', 'the best'], ['bad', 'worse', 'the worst']],
    ex: [['My brother is taller than me.', 'Mi hermano es más alto que yo.'], ['She is the best student.', 'Es la mejor estudiante.']],
    tip: 'Nunca juntes los dos: «more bigger» ✘.'
  },
  items: [
    ['My brother is ___ than me.', ['taller', 'more tall', 'tallest', 'more taller'], 'Mi hermano es más alto que yo.', 'Adjetivo corto → -er.', 'tall=alto=grand', 'be'],
    ['This is the ___ day of the year.', ['hottest', 'hotest', 'most hot', 'hotter'], 'Este es el día más caluroso del año.', 'hot → the hottest (se dobla la t).', 'year=año=année', 'be'],
    ['English is ___ than Chinese.', ['easier', 'more easy', 'easyer', 'easiest'], 'El inglés es más fácil que el chino.', 'easy → easier (y → ier).', 'easy=fácil=facile', 'be'],
    ['This book is ___ interesting than the film.', ['more', 'most', 'the more', 'many'], 'Este libro es más interesante que la película.', 'Adjetivo largo → more.', 'interesting=interesante=intéressant', 'be'],
    ['She is the ___ student in the class.', ['best', 'better', 'goodest', 'most good'], 'Es la mejor estudiante de la clase.', 'good → better → the best.', 'student=estudiante=élève', 'be'],
    ['Today is ___ than yesterday.', ['worse', 'badder', 'worst', 'more bad'], 'Hoy está peor que ayer.', 'bad → worse → the worst.', 'yesterday=ayer=hier', 'be'],
    ['My house is ___ big as yours.', ['as', 'so', 'than', 'more'], 'Mi casa es tan grande como la tuya.', 'Igualdad → as … as.', 'house=casa=maison', 'be'],
    ["It's the most ___ city in the world.", ['beautiful', 'beautifullest', 'more beautiful', 'beautifuler'], 'Es la ciudad más bonita del mundo.', 'Adjetivo largo → the most + adjetivo.', 'city=ciudad=ville; world=mundo=monde', 'be'],
    ['Your car is faster ___ mine.', ['than', 'that', 'as', 'then'], 'Tu coche es más rápido que el mío.', 'Comparativo + than (no «that» ni «then»).', 'fast=rápido=rapide', 'be'],
    ['Which is the ___ river in Europe?', ['longest', 'longer', 'most long', 'more longer'], '¿Cuál es el río más largo de Europa?', 'long → the longest.', 'river=río=fleuve', 'be'],
    ['The second exam was easier. It was ___ difficult than the first.', ['less', 'least', 'fewer', 'little'], 'El segundo examen fue más fácil. Fue menos difícil que el primero.', 'Menos + adjetivo → less.', 'difficult=difícil=difficile', 'be'],
    ['He is ___ person I know.', ['the funniest', 'the funnier', 'funniest', 'the funnyest'], 'Es la persona más divertida que conozco.', 'funny → the funniest.', 'funny=divertido=drôle', 'be,know']
  ] },
{ id: 'req', cefr: 'A2', title: 'Pedir cosas', es: 'can / could / would like / want someone to',
  lesson: {
    points: ['<b>Can you…?</b> (normal) · <b>Could you…?</b> (más educado) · <b>Would you mind + -ing?</b> (muy educado).', "<b>I'd like</b> + cosa / <b>I'd like to</b> + verbo = me gustaría, quisiera.", '«Quiero que vengas» = <b>I want you to come</b>. Nunca «I want that you come».', '<b>Tell</b> + persona (tell me) · <b>say</b> sin persona (say hello).'],
    table: [['Español', 'English'], ['¿Puedes…?', 'Can you…?'], ['¿Podrías…?', 'Could you…?'], ['¿Te importaría…?', 'Would you mind + -ing?'], ['Quisiera…', "I'd like…"], ['Quiero que tú…', 'I want you to…']],
    ex: [['Could you open the door, please?', '¿Podrías abrir la puerta, por favor?'], ['My boss wants me to work on Saturday.', 'Mi jefe quiere que trabaje el sábado.']],
    tip: '«Que» + persona en español → persona + <b>to</b> en inglés: quiero que <i>tú</i> vengas → I want <i>you</i> <b>to</b> come.'
  },
  items: [
    ['I want ___ come with me.', ['you to', 'that you', 'you', 'to you'], 'Quiero que vengas conmigo.', 'Want + persona + to + verbo. Nunca «want that you».', 'come=venir=venir', 'want,come'],
    ['___ you open the door, please?', ['Could', 'Would like', 'Do', 'Are'], '¿Podrías abrir la puerta, por favor?', 'Petición educada → Could you…?', 'door=puerta=porte', 'open'],
    ["I'd like ___ coffee, please.", ['a', 'to', 'an', 'much'], 'Quisiera un café, por favor.', "I'd like + cosa: a coffee.", 'coffee=café=café', ''],
    ['Would you like ___ dance?', ['to', 'for', 'at', 'of'], '¿Te gustaría bailar?', 'Would like + to + verbo.', 'dance=bailar=danser', ''],
    ['My boss wants me ___ work on Saturday.', ['to', 'that', 'for', 'of'], 'Mi jefe quiere que trabaje el sábado.', 'Want + persona + to.', 'boss=jefe=patron', 'want,work'],
    ['Can I ___ a glass of water?', ['have', 'to have', 'having', 'had'], '¿Me pones un vaso de agua?', 'Can + verbo base. Pedir comida o bebida: Can I have…?', 'glass=vaso=verre', 'have'],
    ['Could you ___ me the way to the station?', ['tell', 'to tell', 'telling', 'say'], '¿Podría decirme cómo llegar a la estación?', 'Decir algo a alguien = tell + persona. «Say me» ✘.', 'the way to=cómo llegar a=le chemin pour', 'tell,say'],
    ['Would you mind ___ the window?', ['closing', 'to close', 'close', 'closed'], '¿Te importaría cerrar la ventana?', 'Would you mind + -ing.', 'mind=importar=gêner', 'close'],
    ['She asked me ___ her with the bags.', ['to help', 'help', 'helping', 'that I help'], 'Me pidió que la ayudara con las bolsas.', 'Ask + persona + to + verbo.', 'ask=pedir, preguntar=demander', 'help'],
    ['I would like ___ a table for two.', ['to book', 'book', 'booking', 'booked'], 'Me gustaría reservar una mesa para dos.', 'Would like + to + verbo.', 'book=reservar=réserver', 'book'],
    ['Do you want me ___ you?', ['to call', 'call', 'calling', 'that I call'], '¿Quieres que te llame?', 'Want + persona + to.', 'call=llamar=appeler', 'call'],
    ['Could I speak ___ the manager, please?', ['to', 'at', 'for', 'of'], '¿Podría hablar con el encargado, por favor?', 'Speak to (o speak with) someone.', 'manager=encargado, gerente=responsable', 'speak', 's']
  ] },
{ id: 'freq', cefr: 'A2', title: 'Frecuencia y cantidad', es: 'often, always, much, many, enough, too',
  lesson: {
    points: ['Frecuencia: <b>always</b> > usually > <b>often</b> > sometimes > rarely > <b>never</b>. Van ANTES del verbo (I often swim) pero DESPUÉS de be (She is never late).', '<b>much</b> + incontable (much money) · <b>many</b> + plural (many people) · <b>a lot of</b> con ambos.', '<b>too</b> + adjetivo = demasiado (too hot). Adjetivo + <b>enough</b> = suficiente (old enough). <b>enough</b> + nombre (enough money).', '<b>busy</b> = ocupado (persona). <b>occupied</b> = ocupado (un asiento, un baño).'],
    table: [['Inglés', 'Español', 'Français'], ['always', 'siempre', 'toujours'], ['often', 'a menudo', 'souvent'], ['sometimes', 'a veces', 'parfois'], ['never', 'nunca', 'jamais'], ['enough', 'suficiente', 'assez'], ['too', 'demasiado', 'trop'], ['busy', 'ocupado', 'occupé']],
    ex: [["I'm too busy this week.", 'Estoy demasiado ocupado esta semana.'], ["He isn't old enough to drive.", 'No tiene edad suficiente para conducir.']],
    tip: '¿Se puede contar? many. ¿No se puede contar? much.'
  },
  items: [
    ['I ___ drink coffee in the morning. Every day!', ['always', 'never', 'sometimes', 'rarely'], 'Siempre bebo café por la mañana. ¡Todos los días!', 'Todos los días → always.', 'morning=mañana=matin', 'drink', 's'],
    ['She is ___ late. She hates being late.', ['never', 'always', 'often', 'usually'], 'Nunca llega tarde. Odia llegar tarde.', 'Nunca → never (después de be).', 'hate=odiar=détester', 'be', 's'],
    ['How ___ money do you have?', ['much', 'many', 'lot', 'enough of'], '¿Cuánto dinero tienes?', 'Money es incontable → how much.', 'money=dinero=argent', 'have'],
    ['How ___ brothers do you have?', ['many', 'much', 'lot', 'a lot'], '¿Cuántos hermanos tienes?', 'Brothers se puede contar → how many.', 'brother=hermano=frère', 'have'],
    ["I can't buy it. I don't have ___ money.", ['enough', 'many', 'too', 'so'], 'No puedo comprarlo. No tengo suficiente dinero.', 'Enough + nombre = suficiente.', 'enough=suficiente=assez', 'buy'],
    ["This coffee is ___ hot. I can't drink it.", ['too', 'very much', 'enough', 'so much'], 'Este café está demasiado caliente. No me lo puedo beber.', 'Too + adjetivo = demasiado (con resultado negativo).', 'hot=caliente=chaud', 'drink'],
    ["He isn't old ___ to drive.", ['enough', 'too', 'much', 'very'], 'No tiene edad suficiente para conducir.', 'Adjetivo + enough: old enough.', 'drive=conducir=conduire; old=mayor, viejo=âgé', 'drive'],
    ['We ___ go to the cinema. About once a month.', ['sometimes', 'always', 'never', 'every'], 'A veces vamos al cine. Más o menos una vez al mes.', 'Una vez al mes → sometimes.', 'once a month=una vez al mes=une fois par mois', 'go', 's'],
    ["I'm very ___ this week. I have a lot of work.", ['busy', 'bussy', 'business', 'occupied'], 'Estoy muy ocupado esta semana. Tengo mucho trabajo.', 'Una persona ocupada = busy. «Occupied» es para sitios (un asiento, un baño).', 'busy=ocupado=occupé', 'be', 's'],
    ['There are too ___ people here.', ['many', 'much', 'lot', 'more'], 'Aquí hay demasiada gente.', 'People es plural contable → too many.', 'people=gente=gens', 'be'],
    ['Do you ___ go swimming?', ['often', 'much', 'many', 'enough'], '¿Vas a nadar a menudo?', 'A menudo → often (antes del verbo).', 'often=a menudo=souvent', 'go', 's'],
    ['She ___ eats meat. Maybe once a year.', ['rarely', 'always', 'usually', 'often'], 'Casi nunca come carne. Quizá una vez al año.', 'Muy poco → rarely.', 'rarely=rara vez=rarement', 'eat', 's'],
    ["I don't have ___ time today.", ['much', 'many', 'a lot', 'enough of'], 'Hoy no tengo mucho tiempo.', 'Time (tiempo) es incontable → much.', 'time=tiempo=temps', 'have']
  ] },
{ id: 'prep2', cefr: 'A2', title: 'Preposiciones de tiempo y movimiento', es: 'at / on / in, from / to, with / without, by, through, into',
  lesson: {
    points: ['<b>at</b> + hora (at 10) y at night · <b>on</b> + día y fecha (on Monday) · <b>in</b> + mes, año, estación (in May, in 1998) y in the morning.', '<b>from … to</b> = de … a · <b>between … and</b> = entre … y.', '<b>with</b> = con · <b>without</b> = sin · <b>from</b> = de parte de, desde.', 'Transporte: <b>by</b> bus / by car, pero <b>on foot</b>. Movimiento: <b>into</b> (hacia dentro), <b>through</b> (a través de).'],
    table: [['', 'Ejemplo'], ['at', 'at 10 o\'clock, at night'], ['on', 'on Monday, on 5 May'], ['in', 'in May, in 1998, in the morning'], ['by', 'by bus, by train'], ['into', 'She went into the room.'], ['through', 'We walked through the forest.']],
    ex: [['I work from 9 to 5.', 'Trabajo de 9 a 5.'], ['I drink coffee without sugar.', 'Tomo el café sin azúcar.']],
    tip: 'De lo pequeño a lo grande: AT la hora, ON el día, IN el mes y el año.'
  },
  items: [
    ['The meeting is ___ 10 o\'clock.', ['at', 'on', 'in', 'to'], 'La reunión es a las 10.', 'Hora → at.', 'meeting=reunión=réunion', 'be', 's'],
    ['My birthday is ___ May.', ['in', 'on', 'at', 'of'], 'Mi cumpleaños es en mayo.', 'Mes → in.', 'birthday=cumpleaños=anniversaire', 'be', 's'],
    ['See you ___ Monday!', ['on', 'in', 'at', 'the'], '¡Nos vemos el lunes!', 'Día → on.', 'Monday=lunes=lundi', 'see', 's'],
    ['I work ___ 9 to 5.', ['from', 'between', 'since', 'of'], 'Trabajo de 9 a 5.', 'De … a … → from … to.', 'work=trabajar=travailler', 'work', 's'],
    ['The shop is closed ___ 2 and 4 pm.', ['between', 'from', 'among', 'during'], 'La tienda está cerrada entre las 2 y las 4.', 'Entre … y … → between … and.', 'closed=cerrado=fermé', 'be', 's'],
    ["I drink my coffee ___ sugar. I don't like sweet things.", ['without', 'with', 'from', 'by'], 'Me tomo el café sin azúcar. No me gustan las cosas dulces.', 'Sin → without.', 'sugar=azúcar=sucre; sweet=dulce=sucré', 'drink', 's'],
    ['She lives ___ her parents.', ['with', 'without', 'between', 'by'], 'Vive con sus padres.', 'Con → with.', 'parents=padres=parents', 'live', 's'],
    ['I go to work ___ bus.', ['by', 'in', 'on', 'with'], 'Voy al trabajo en autobús.', 'Medio de transporte: by bus, by car, by train (pero on foot).', 'bus=autobús=bus', 'go', 's'],
    ['We walked ___ the forest.', ['through', 'between', 'from', 'across of'], 'Caminamos a través del bosque.', 'A través de → through.', 'forest=bosque=forêt; walk=caminar=marcher', '', 's'],
    ['This present is ___ my mother.', ['from', 'of', 'by', 'since'], 'Este regalo es de mi madre (me lo dio ella).', 'De parte de alguien → from.', 'present=regalo=cadeau', 'be', 's'],
    ['I usually read ___ night.', ['at', 'in', 'on', 'by'], 'Normalmente leo por la noche.', 'at night (pero in the morning, in the evening).', 'usually=normalmente=d\'habitude', 'read', 's'],
    ['She went ___ the room and closed the door.', ['into', 'in', 'at', 'inside of'], 'Entró en la habitación y cerró la puerta.', 'Movimiento hacia dentro → into.', 'room=habitación=pièce', 'go,close', 's'],
    ['I was born ___ 1998.', ['in', 'on', 'at', 'the'], 'Nací en 1998.', 'Año → in.', 'be born=nacer=naître', 'be', 's'],
    ["Let's meet ___ the morning.", ['in', 'on', 'at', 'by'], 'Quedemos por la mañana.', 'in the morning / in the afternoon / in the evening.', 'meet=quedar=se retrouver', 'meet', 's']
  ] },
/* ============================== B1 ============================== */
{ id: 'perf', cefr: 'B1', title: 'Presente perfecto', es: 'have done: experiencias, ya, todavía, desde',
  lesson: {
    points: ['<b>have / has + participio</b>: I have seen, she has finished.', 'Experiencias: Have you <b>ever</b> been to London? I have <b>never</b> eaten sushi.', 'Recién o con resultado: I have <b>just</b> arrived. I have lost my keys!', '<b>already</b> (ya) · <b>yet</b> (ya / todavía, en preguntas y negativas) · <b>for</b> + duración · <b>since</b> + punto de inicio.', 'Con tiempo terminado (yesterday, last year) → pasado simple, no presente perfecto.'],
    table: [['', 'Ejemplo'], ['+', 'I have seen it.'], ['−', "She hasn't finished yet."], ['?', 'Have you ever been to Paris?'], ['for', 'for ten years'], ['since', 'since 2019']],
    ex: [['We have lived here since 2019.', 'Vivimos aquí desde 2019.'], ['He has just arrived.', 'Acaba de llegar.']],
    tip: 'Since = desde un PUNTO. For = durante un TIEMPO.'
  },
  items: [
    ['Have you ever ___ to London?', ['been', 'went', 'go', 'was'], '¿Has estado alguna vez en Londres?', 'Experiencias → have + participio. be → been.', 'ever=alguna vez=déjà', 'be'],
    ['I have ___ this film three times.', ['seen', 'saw', 'see', 'seed'], 'He visto esta película tres veces.', 'see → saw → seen. Después de have → participio.', 'times=veces=fois', 'see'],
    ['She ___ already finished her homework.', ['has', 'have', 'is', 'did'], 'Ya ha terminado los deberes.', 'She → has + participio.', 'already=ya=déjà; homework=deberes=devoirs', ''],
    ['We have lived here ___ 2019.', ['since', 'for', 'from', 'during'], 'Vivimos aquí desde 2019.', 'Punto de inicio → since.', 'here=aquí=ici', 'live'],
    ['They have been married ___ ten years.', ['for', 'since', 'during', 'from'], 'Llevan diez años casados.', 'Duración → for.', 'married=casado=marié', 'be'],
    ['Have you finished ___? — No, not yet.', ['yet', 'already', 'still', 'ever'], '¿Has terminado ya? — No, todavía no.', 'Yet en preguntas y negativas, al final.', 'yet=ya, todavía=déjà, encore', ''],
    ['I have never ___ sushi.', ['eaten', 'ate', 'eat', 'eated'], 'Nunca he comido sushi.', 'eat → ate → eaten.', 'never=nunca=jamais', 'eat'],
    ['He has just ___ home.', ['arrived', 'arrive', 'arriving', 'arrives'], 'Acaba de llegar a casa.', 'Just + presente perfecto = acabar de.', 'arrive=llegar=arriver', 'arrive'],
    ["I ___ my keys! I can't open the door.", ['have lost', 'lost have', 'has lost', 'have lose'], '¡He perdido las llaves! No puedo abrir la puerta.', 'Resultado ahora → have + participio (lost).', 'key=llave=clé', 'lose'],
    ['How long ___ you known her?', ['have', 'did', 'are', 'do'], '¿Desde cuándo la conoces?', 'Duración hasta ahora → How long have you…?', 'how long=cuánto tiempo=depuis combien de temps', 'know'],
    ['I ___ to Paris last year.', ['went', 'have been', 'have gone', 'have went'], 'Fui a París el año pasado.', 'Tiempo terminado (last year) → pasado simple.', 'last year=el año pasado=l\'année dernière', 'go'],
    ['She has ___ the email to her boss.', ['written', 'wrote', 'writed', 'write'], 'Ha escrito el correo a su jefe.', 'write → wrote → written.', 'boss=jefe=patron', 'write'],
    ["I'm sorry, I have ___ your name.", ['forgotten', 'forgot', 'forget', 'forgetted'], 'Lo siento, he olvidado tu nombre.', 'forget → forgot → forgotten.', 'name=nombre=nom', 'forget'],
    ["We haven't seen him ___ Christmas.", ['since', 'for', 'from', 'ago'], 'No lo vemos desde Navidad.', 'Punto de inicio → since.', 'Christmas=Navidad=Noël', 'see']
  ] },
{ id: 'used', cefr: 'B1', title: 'Used to / Be used to / Get used to', es: 'Solía · estar acostumbrado · acostumbrarse',
  lesson: {
    points: ['<b>used to</b> + verbo = solía (algo del pasado que ya no pasa): I used to play football.', 'Negativa y pregunta con did: I didn\'t <b>use</b> to… / Did you <b>use</b> to…? (sin -d).', '<b>be used to</b> + nombre / -ing = estar acostumbrado: I\'m used to getting up early.', '<b>get used to</b> + nombre / -ing = acostumbrarse: You will get used to the cold.'],
    table: [['Forma', 'Significado', 'Ejemplo'], ['used to + verbo', 'solía', 'I used to smoke.'], ['be used to + -ing', 'estar acostumbrado', "I'm used to working at night."], ['get used to + -ing', 'acostumbrarse', "I'm getting used to driving here."]],
    ex: [['There used to be a cinema here.', 'Aquí antes había un cine.'], ['It took me a month to get used to it.', 'Me costó un mes acostumbrarme.']],
    tip: 'Detrás de «be/get used to», el «to» es preposición → va -ing.'
  },
  items: [
    ['I ___ play football when I was a child.', ['used to', 'use to', 'am used to', 'was used'], 'Solía jugar al fútbol cuando era niño.', 'Hábito del pasado → used to + verbo.', 'child=niño=enfant', 'play'],
    ["She didn't ___ like vegetables, but now she loves them.", ['use to', 'used to', 'using to', 'uses to'], 'Antes no le gustaban las verduras, pero ahora le encantan.', 'Con didn\'t → use to (sin -d).', 'vegetables=verduras=légumes', 'like'],
    ["I'm used to ___ up early.", ['getting', 'get', 'got', 'gets'], 'Estoy acostumbrado a levantarme temprano.', 'Be used to + -ing.', 'early=temprano=tôt', 'get'],
    ['You will get used ___ the cold weather.', ['to', 'at', 'with', 'for'], 'Te acostumbrarás al frío.', 'Get used TO + nombre.', 'weather=tiempo (clima)=temps', 'get'],
    ['It took me a month to get used to ___ on the left.', ['driving', 'drive', 'drove', 'to drive'], 'Me costó un mes acostumbrarme a conducir por la izquierda.', 'Get used to + -ing.', 'left=izquierda=gauche; drive=conducir=conduire', 'drive'],
    ["There ___ to be a cinema here. Now it's a bank.", ['used', 'use', 'was used', 'is used'], 'Aquí antes había un cine. Ahora es un banco.', 'There used to be = antes había.', 'cinema=cine=cinéma', 'use'],
    ['Did you ___ to live in Madrid?', ['use', 'used', 'using', 'uses'], '¿Vivías antes en Madrid?', 'Pregunta con did → use to.', 'live=vivir=habiter', 'live'],
    ["He isn't used ___ alone.", ['to living', 'to live', 'living', 'live'], 'No está acostumbrado a vivir solo.', 'Be used to + -ing.', 'alone=solo=seul', 'live'],
    ["I'm ___ used to my new job.", ['getting', 'get', 'gets', 'got'], 'Me estoy acostumbrando a mi nuevo trabajo.', 'Proceso ahora → am getting used to.', 'job=trabajo=travail', 'get'],
    ['We used to ___ to the beach every summer.', ['go', 'going', 'went', 'goes'], 'Solíamos ir a la playa cada verano.', 'Used to + verbo base.', 'summer=verano=été', 'go'],
    ["My commute is long, but I'm used to ___.", ['it', 'them', 'its', 'that it'], 'Mi trayecto al trabajo es largo, pero estoy acostumbrado.', 'Be used to + nombre o pronombre: I\'m used to it.', 'commute=trayecto diario al trabajo=trajet quotidien', 'be'],
    ['When I was young, I ___ to bed at 9.', ['used to go', 'use to go', 'was used to go', 'used going'], 'De pequeño, me iba a la cama a las 9.', 'Hábito pasado → used to + verbo.', 'young=joven=jeune', 'go']
  ] },
{ id: 'modal', cefr: 'B1', title: 'Modales: must / have to / should / might', es: 'Obligación, consejo y posibilidad',
  lesson: {
    points: ['<b>must</b> = debo (obligación que siento yo) · <b>have to</b> = tengo que (norma externa).', '<b>mustn\'t</b> = está prohibido · <b>don\'t have to</b> = no hace falta. ¡Son muy distintos!', '<b>should</b> = deberías (consejo) · <b>might</b> = puede que (posibilidad).', 'Después de must, should, might → verbo base sin «to».'],
    table: [['Modal', 'Significado', 'Français'], ['must', 'deber', 'devoir'], ["mustn't", 'no deber (prohibido)', 'ne pas devoir'], ['have to', 'tener que', 'devoir, falloir'], ["don't have to", 'no hace falta', 'ne pas être obligé'], ['should', 'deberías (consejo)', 'devrais'], ['might', 'puede que', 'pourrait']],
    ex: [["You mustn't smoke here.", 'No se puede fumar aquí.'], ["Tomorrow is Sunday. I don't have to get up early.", 'Mañana es domingo. No tengo que madrugar.']],
    tip: "Mustn't = ¡NO! · Don't have to = no hace falta, tú eliges."
  },
  items: [
    ["You ___ smoke here. It's forbidden.", ["mustn't", "don't have to", "shouldn't to", "haven't"], 'No puedes fumar aquí. Está prohibido.', 'Prohibido → mustn\'t.', 'forbidden=prohibido=interdit; smoke=fumar=fumer', '', 's'],
    ["Tomorrow is Sunday. I ___ get up early.", ["don't have to", "mustn't", "haven't", 'not must'], 'Mañana es domingo. No tengo que madrugar.', 'No es necesario → don\'t have to.', 'get up=levantarse=se lever', 'get', 's'],
    ['You look tired. You ___ go to bed.', ['should', 'must to', 'should to', 'have'], 'Pareces cansado. Deberías irte a la cama.', 'Consejo → should + verbo base.', 'look=parecer=avoir l\'air', 'go'],
    ['Take an umbrella. It ___ rain later.', ['might', 'must', 'should to', 'mights'], 'Llévate un paraguas. Puede que llueva más tarde.', 'Posibilidad → might.', 'umbrella=paraguas=parapluie; later=más tarde=plus tard', 'take', 's'],
    ["I ___ wear a uniform at work. It's the rule.", ['have to', 'has to', 'must to', 'should to'], 'Tengo que llevar uniforme en el trabajo. Es la norma.', 'Norma externa → have to.', 'rule=norma=règle; wear=llevar puesto=porter', 'wear'],
    ['She ___ work on Saturdays.', ['has to', 'have to', 'must to', 'haves to'], 'Ella tiene que trabajar los sábados.', 'She → has to.', 'Saturday=sábado=samedi', 'work'],
    ['You ___ see a doctor about that cough.', ['should', "mustn't", 'might to', "don't have to"], 'Deberías ir al médico por esa tos.', 'Consejo → should.', 'cough=tos=toux', 'see', 's'],
    ["He isn't answering. He ___ be asleep.", ['might', 'should to', "mustn't", 'has'], 'No contesta. Puede que esté dormido.', 'Posibilidad → might.', 'asleep=dormido=endormi', 'be', 's'],
    ['Do we ___ pay now?', ['have to', 'must', 'should to', 'has to'], '¿Tenemos que pagar ahora?', 'Pregunta con do → have to.', 'pay=pagar=payer', 'pay'],
    ['You ___ forget your passport!', ["mustn't", "don't have to", "shouldn't to", "haven't to"], '¡No debes olvidar el pasaporte!', 'Prohibición fuerte → mustn\'t.', 'passport=pasaporte=passeport', 'forget', 's'],
    ["Students ___ bring a calculator. It's optional.", ["don't have to", "mustn't", "haven't", 'not have to'], 'Los estudiantes no tienen que traer calculadora. Es opcional.', 'No hace falta → don\'t have to.', 'optional=opcional=facultatif; bring=traer=apporter', 'bring', 's'],
    ['I think you ___ apologize to her.', ['should', 'should to', 'must to', 'ought'], 'Creo que deberías pedirle perdón.', 'Consejo → should + verbo base.', 'apologize=pedir perdón=s\'excuser', 'think', 's']
  ] },
{ id: 'cond', cefr: 'B1', title: 'Condicionales', es: 'If it rains… / If I were…',
  lesson: {
    points: ['<b>Cero</b> (hechos): If + presente, presente → If you heat ice, it melts.', '<b>Primero</b> (futuro real): If + presente, <b>will</b> + verbo → If it rains, we will stay at home.', '<b>Segundo</b> (imaginario): If + pasado, <b>would</b> + verbo → If I had money, I would travel.', '«Yo que tú» = <b>If I were you</b>. Nunca «will» después de if: If it rains (no «If it will rain»).', '<b>unless</b> = a menos que, si no.'],
    table: [['Tipo', 'If…', 'Resultado'], ['0', 'If you heat ice,', 'it melts.'], ['1', 'If it rains,', 'we will stay home.'], ['2', 'If I were rich,', 'I would travel.']],
    ex: [['If I were you, I would take the job.', 'Yo que tú, aceptaría el trabajo.'], ['Unless you hurry, you will miss the train.', 'Si no te das prisa, perderás el tren.']],
    tip: 'La parte del «if» nunca lleva will ni would.'
  },
  items: [
    ['If you heat ice, it ___.', ['melts', 'will melts', 'melted', 'melting'], 'Si calientas hielo, se derrite.', 'Hecho general → presente en las dos partes.', 'ice=hielo=glace; heat=calentar=chauffer', 'melt'],
    ['If it ___ tomorrow, we will stay at home.', ['rains', 'will rain', 'rained', 'rain'], 'Si llueve mañana, nos quedaremos en casa.', 'Después de if → presente (nunca will).', 'stay=quedarse=rester', ''],
    ['If you study, you ___ pass the exam.', ['will', 'would', 'are', 'did'], 'Si estudias, aprobarás el examen.', 'Primer condicional → will.', 'pass an exam=aprobar un examen=réussir un examen', 'study'],
    ['If I ___ rich, I would travel the world.', ['were', 'am', 'will be', 'would be'], 'Si fuera rico, viajaría por el mundo.', 'Segundo condicional → if + were / pasado.', 'rich=rico=riche; travel=viajar=voyager', 'be,travel'],
    ['If I were you, I ___ take the job.', ['would', 'will', 'am', 'did'], 'Yo que tú, aceptaría el trabajo.', 'If I were you → I would…', 'job=trabajo=travail', 'take'],
    ['What ___ you do if you won the lottery?', ['would', 'will', 'do', 'did'], '¿Qué harías si ganaras la lotería?', 'Situación imaginaria → would.', 'lottery=lotería=loto', 'win,do'],
    ['If she ___ the bus, she will be late.', ['misses', 'will miss', 'missed', 'miss'], 'Si pierde el autobús, llegará tarde.', 'Después de if → presente: she misses.', 'late=tarde=en retard', 'miss'],
    ['I would buy a house if I ___ more money.', ['had', 'have', 'will have', 'would have'], 'Me compraría una casa si tuviera más dinero.', 'Segundo condicional → if + pasado: had.', 'money=dinero=argent', 'buy,have'],
    ['If you press this button, the machine ___.', ['starts', 'start', 'started', 'starting'], 'Si pulsas este botón, la máquina se pone en marcha.', 'Hecho que siempre ocurre → presente.', 'button=botón=bouton; press=pulsar=appuyer', 'start'],
    ['We ___ go to the beach if it is sunny.', ['will', 'would', 'are', 'did'], 'Iremos a la playa si hace sol.', 'Primer condicional → will.', 'beach=playa=plage', 'go'],
    ['If he ___ harder, he would get better marks.', ['worked', 'works', 'will work', 'work'], 'Si trabajara más, sacaría mejores notas.', 'Segundo condicional → if + pasado.', 'marks=notas=notes', 'work'],
    ['Unless you hurry, you ___ miss the train.', ['will', 'would', 'are', 'do'], 'Si no te das prisa, perderás el tren.', 'Unless (= if not) + presente, will.', 'hurry=darse prisa=se dépêcher; unless=a menos que=à moins que', 'miss']
  ] },
{ id: 'passive', cefr: 'B1', title: 'Pasiva y relativos', es: 'is made / was built · who / which / where / whose',
  lesson: {
    points: ['Pasiva: <b>be + participio</b> → English is spoken. The bridge was built in 1890.', 'Quién lo hace: <b>by</b> → written by my grandfather.', 'Relativos: <b>who</b> (personas) · <b>which</b> (cosas) · <b>that</b> (ambas) · <b>where</b> (lugares) · <b>whose</b> (cuyo).', 'El «se» impersonal español suele ser pasiva: «Se habla inglés» = English is spoken.'],
    table: [['Tiempo', 'Pasiva'], ['Presente', 'It is made.'], ['Pasado', 'It was made.'], ['Futuro', 'It will be made.'], ['Perfecto', 'It has been made.']],
    ex: [['Rice is grown in Asia.', 'El arroz se cultiva en Asia.'], ['The woman who lives next door is a doctor.', 'La mujer que vive al lado es médica.']],
    tip: 'Personas → who. Cosas → which. Lugares → where.'
  },
  items: [
    ['This bridge ___ built in 1890.', ['was', 'is', 'were', 'has'], 'Este puente fue construido en 1890.', 'Pasiva en pasado → was + participio.', 'bridge=puente=pont', 'build'],
    ['English ___ spoken in many countries.', ['is', 'are', 'has', 'does'], 'El inglés se habla en muchos países.', 'Pasiva en presente → is + participio.', 'country=país=pays', 'speak'],
    ['The letters were ___ by my grandfather.', ['written', 'wrote', 'writing', 'write'], 'Las cartas fueron escritas por mi abuelo.', 'Pasiva → participio: written.', 'letter=carta=lettre; grandfather=abuelo=grand-père', 'write'],
    ['The woman ___ lives next door is a doctor.', ['who', 'which', 'where', 'whose'], 'La mujer que vive al lado es médica.', 'Persona → who (o that).', 'next door=al lado=à côté', 'live'],
    ['This is the book ___ I told you about.', ['that', 'who', 'where', 'what'], 'Este es el libro del que te hablé.', 'Cosa → that / which.', 'book=libro=livre', 'tell'],
    ["That's the restaurant ___ we had dinner.", ['where', 'which', 'who', 'whose'], 'Ese es el restaurante donde cenamos.', 'Lugar → where.', 'restaurant=restaurante=restaurant', 'have'],
    ['My car ___ repaired yesterday.', ['was', 'is', 'has', 'were'], 'Ayer me arreglaron el coche.', 'Pasiva en pasado, singular → was.', 'repair=reparar=réparer', 'repair'],
    ['The man ___ car was stolen called the police.', ['whose', 'who', 'which', "who's"], 'El hombre al que le robaron el coche llamó a la policía.', 'Posesión (cuyo) → whose.', 'steal=robar=voler; police=policía=police', 'steal,call'],
    ['Rice ___ grown in Asia.', ['is', 'are', 'has', 'does'], 'El arroz se cultiva en Asia.', 'Pasiva en presente → is grown.', 'rice=arroz=riz', 'grow'],
    ['The thief was caught ___ the police.', ['by', 'from', 'of', 'with'], 'El ladrón fue atrapado por la policía.', 'Quien hace la acción en pasiva → by.', 'thief=ladrón=voleur', 'catch'],
    ['The new hospital will ___ opened next year.', ['be', 'been', 'being', 'is'], 'El nuevo hospital se inaugurará el año que viene.', 'Pasiva en futuro → will be + participio.', 'next year=el año que viene=l\'année prochaine', 'open'],
    ['I have a friend ___ can speak five languages.', ['who', 'which', 'where', 'whose'], 'Tengo un amigo que habla cinco idiomas.', 'Persona → who.', 'language=idioma=langue', 'speak']
  ] },
{ id: 'traps', cefr: 'B1', title: 'Trampas del hispanohablante', es: 'Falsos amigos y errores típicos',
  lesson: {
    points: ['El adjetivo va ANTES del nombre y nunca lleva -s: a <b>new car</b>, <b>nice</b> people.', 'Siempre hay sujeto: <b>It\'s</b> raining. <b>It\'s</b> important.', '<b>make</b> (crear: a mistake, a decision, money) vs <b>do</b> (tareas: homework, a favour).', 'Falsos amigos: <b>sensible</b> = sensato · <b>embarrassed</b> = avergonzado · <b>constipated</b> = estreñido · <b>actually</b> = en realidad · <b>assist</b> = ayudar · <b>attend</b> = asistir.', '<b>explain</b> something <b>to</b> someone (nunca «explain me»).'],
    table: [['Parece…', 'Pero significa…', 'Lo que buscas es…'], ['sensible', 'sensato', 'sensitive'], ['embarrassed', 'avergonzado', 'pregnant (embarazada)'], ['constipated', 'estreñido', 'have a cold (resfriado)'], ['actually', 'en realidad', 'currently (actualmente)'], ['assist', 'ayudar', 'attend (asistir)']],
    ex: [['She is very sensitive.', 'Es muy sensible.'], ['I make a lot of mistakes.', 'Cometo muchos errores.']],
    tip: 'Si una palabra se parece demasiado al español, ¡sospecha!'
  },
  items: [
    ['I bought a ___.', ['new car', 'car new', 'news car', 'car news'], 'Me compré un coche nuevo.', 'En inglés el adjetivo va ANTES del nombre.', 'new=nuevo=nouveau', 'buy', 'c'],
    ['They are very ___ people.', ['nice', 'nices', 'people nice', 'nicely'], 'Son personas muy agradables.', 'Los adjetivos nunca llevan -s.', 'nice=agradable, majo=gentil', 'be', 'c'],
    ['I ___ afraid of the dark.', ['am', 'have', 'do', 'has'], 'Tengo miedo de la oscuridad.', 'Tener miedo = be afraid.', 'dark=oscuridad=noir', 'be'],
    ['She is very ___. She cries when she watches sad films.', ['sensitive', 'sensible', 'sensibly', 'sensibility'], 'Es muy sensible. Llora cuando ve películas tristes.', 'Falso amigo: «sensible» en inglés = sensato. Sensible (español) = sensitive.', 'sensitive=sensible=sensible', 'cry,watch', 's'],
    ["I can't go to work. I ___.", ['have a cold', 'am constipated', 'am cold', 'have cold'], 'No puedo ir a trabajar. Estoy resfriado.', 'Falso amigo: constipated = estreñido. Resfriado = have a cold.', 'cold=resfriado (a cold), frío=rhume', 'have', 's'],
    ['Can you ___ me a favour?', ['do', 'make', 'give', 'take'], '¿Me haces un favor?', 'Do a favour, do homework. Make a cake, make a mistake.', 'favour=favor=service', 'do'],
    ['I ___ a lot of mistakes in English.', ['make', 'do', 'have', 'take'], 'Cometo muchos errores en inglés.', 'Cometer errores = make mistakes.', 'mistake=error=erreur', 'make'],
    ['___ raining again.', ["It's", 'Is', 'Its', 'There is'], 'Está lloviendo otra vez.', 'Siempre hay sujeto: It\'s raining.', 'again=otra vez=encore', '', 'c'],
    ['She was ___ when she fell in front of everyone.', ['embarrassed', 'pregnant', 'embarrassing', 'embarrass'], 'Le dio vergüenza cuando se cayó delante de todos.', 'Falso amigo: embarrassed = avergonzado. Embarazada = pregnant.', 'embarrassed=avergonzado=gêné', 'fall', 's'],
    ["___, I don't like this song.", ['Actually', 'Currently', 'Actual', 'Nowadays'], 'En realidad, no me gusta esta canción.', 'Falso amigo: actually = en realidad. Actualmente = currently.', 'actually=en realidad=en fait; song=canción=chanson', 'like', 's'],
    ['I ___ the class every Monday.', ['attend', 'assist', 'assist to', 'attend to'], 'Asisto a clase todos los lunes.', 'Falso amigo: assist = ayudar. Asistir a = attend.', 'attend=asistir a=assister à', 'attend', 's'],
    ['Can you ___ this word to me?', ['explain', 'explain me', 'say me', 'tell'], '¿Me puedes explicar esta palabra?', 'Explain something TO someone. Nunca «explain me».', 'explain=explicar=expliquer; word=palabra=mot', 'explain'],
    ["I've been here ___ two hours.", ['for', 'since', 'during', 'from'], 'Llevo aquí dos horas.', '«Llevar + tiempo» = have been … for + duración.', 'hour=hora=heure', 'be', 's']
  ] },
{ id: 'words', cefr: 'B1', title: 'Palabras útiles del día a día', es: 'trip / journey / commute · forget / forgive · wake / woke / woken',
  lesson: {
    points: ['<b>trip</b> = viaje corto o escapada · <b>journey</b> = trayecto (a veces largo) · <b>commute</b> = trayecto diario al trabajo.', '<b>forget</b> = olvidar (forgot, forgotten) · <b>forgive</b> = perdonar (forgave, forgiven).', '<b>wake up</b> → woke → woken = despertarse. <b>yawn</b> = bostezar.', '<b>have breakfast</b> (sin artículo) = desayunar. <b>solder</b> = soldar con estaño (soldered).', 'Olvidar algo EN un sitio = <b>leave</b>: I left my umbrella at home.'],
    table: [['Inglés', 'Español', 'Français'], ['trip', 'viaje corto, escapada', 'excursion'], ['journey', 'viaje, trayecto', 'voyage, trajet'], ['commute', 'trayecto diario al trabajo', 'trajet quotidien'], ['forgive', 'perdonar', 'pardonner'], ['yawn', 'bostezar', 'bâiller'], ['solder', 'soldar (estaño)', 'souder']],
    ex: [['Please forgive me.', 'Por favor, perdóname.'], ['I left my umbrella at home.', 'Me dejé el paraguas en casa.']],
    tip: 'forGIVE tiene «give» (dar): perdonar es dar una segunda oportunidad.'
  },
  items: [
    ['My daily ___ to work takes one hour.', ['commute', 'trip', 'travel', 'travels'], 'Mi trayecto diario al trabajo dura una hora.', 'Trayecto diario al trabajo = commute.', 'commute=trayecto diario=trajet quotidien; daily=diario=quotidien', 'take', 's'],
    ['We went on a short ___ to the mountains.', ['trip', 'commute', 'travel', 'travels'], 'Hicimos una escapada corta a la montaña.', 'Viaje corto o escapada = trip. «Travel» es el verbo o la idea general.', 'trip=viaje corto=excursion; mountain=montaña=montagne', 'go', 's'],
    ['The ___ from Madrid to Moscow took three days by train.', ['journey', 'commute', 'travel', 'travels'], 'El viaje de Madrid a Moscú duró tres días en tren.', 'Trayecto largo de un sitio a otro = journey.', 'journey=viaje, trayecto=voyage', 'take', 's'],
    ["I always ___ when I'm tired.", ['yawn', 'yown', 'jaw', 'yawning'], 'Siempre bostezo cuando estoy cansado.', 'Bostezar = yawn.', 'yawn=bostezar=bâiller', 'yawn', 's'],
    ["Please ___ me. I didn't want to hurt you.", ['forgive', 'forget', 'forgave', 'forgot'], 'Por favor, perdóname. No quería hacerte daño.', 'Perdonar = forgive. Olvidar = forget.', 'hurt=hacer daño=blesser', 'forgive', 's'],
    ["Don't ___ to lock the door.", ['forget', 'forgive', 'forgot', 'forgotten'], 'No olvides cerrar la puerta con llave.', 'Olvidar = forget. Don\'t + verbo base.', 'lock=cerrar con llave=fermer à clé', 'forget', 's'],
    ['I ___ up at 5 a.m. yesterday.', ['woke', 'waked', 'woken', 'wake'], 'Ayer me desperté a las 5 de la mañana.', 'Pasado de wake = woke.', 'wake up=despertarse=se réveiller', 'wake'],
    ['Have you ever ___ up in the middle of the night?', ['woken', 'woke', 'waked', 'wake'], '¿Te has despertado alguna vez en mitad de la noche?', 'Participio de wake = woken.', 'middle=mitad, medio=milieu', 'wake'],
    ['I had ___ at 7: toast and orange juice.', ['breakfast', 'a breakfast', 'the breakfast', 'breakfasts'], 'Desayuné a las 7: tostadas y zumo de naranja.', 'Have breakfast (sin artículo) = desayunar.', 'toast=tostada=pain grillé; juice=zumo=jus', 'have'],
    ['He ___ the two wires together.', ['soldered', 'solded', 'soldier', 'soldering'], 'Soldó los dos cables.', 'solder → soldered. ¡Ojo! «soldier» es soldado.', 'wire=cable=fil; solder=soldar=souder', 'solder', 's'],
    ['She ___ goes to the gym: three times a week.', ['often', 'enough', 'busy', 'much'], 'Va a menudo al gimnasio: tres veces por semana.', 'A menudo = often.', 'often=a menudo=souvent; gym=gimnasio=salle de sport', 'go', 's'],
    ["I can't talk now, I'm ___.", ['busy', 'often', 'enough', 'empty'], 'Ahora no puedo hablar, estoy ocupado.', 'Ocupado (persona) = busy.', 'busy=ocupado=occupé', 'be', 's'],
    ['Is the room big ___ for six people?', ['enough', 'too', 'often', 'much'], '¿La habitación es lo bastante grande para seis personas?', 'Adjetivo + enough = lo bastante.', 'enough=suficiente=assez', 'be', 's'],
    ['I ___ my umbrella at home.', ['left', 'forgot', 'forgotten', 'leaved'], 'Me dejé el paraguas en casa.', 'Olvidar algo EN un sitio = leave (left). Forget va sin lugar: I forgot my umbrella.', 'umbrella=paraguas=parapluie', 'leave,forget', 's']
  ] }
];

/* índice rápido */
const UNIT_BY_ID = {};
UNITS.forEach((u, ui) => { u.index = ui; UNIT_BY_ID[u.id] = u; u.items.forEach((it, i) => it.id = u.id + '.' + i); });
const ALL_ITEMS = []; UNITS.forEach(u => u.items.forEach((it, i) => ALL_ITEMS.push({ u, i, it })));
const ITEM_BY_ID = {}; ALL_ITEMS.forEach(x => ITEM_BY_ID[x.it.id] = x);
