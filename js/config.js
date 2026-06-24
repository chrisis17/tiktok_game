// ============================================================
//  config.js  -  Definicion de unidades, paises y constantes
//  Aqui se balancea TODO el juego. Tocar valores aqui.
//  (Tiempos y costos de regalo tambien se editan en admin.html)
// ============================================================

const GAME_CONFIG = {
  // Valores por defecto; admin.html puede sobreescribir via settings.js
  MAX_PER_TEAM: 260,
  VOTE_TIME: 20,
  RECRUIT_TIME: 30,
  BATTLE_TIME: 75,
  WIN_POINTS: 3,
  DRAW_POINTS: 1,
};

// ------------------------------------------------------------
//  UNIDADES  (12 tipos)
//  hp        = vida
//  damage    = dano por golpe
//  range     = alcance de ataque (px). Melee ~20-34, rango >140
//  speed     = velocidad de avance (px/seg)
//  attackCD  = segundos entre ataques (menor = mas rapido)
//  ranged    = true si dispara proyectiles
//  projSpeed = velocidad del proyectil
//  splash    = radio de dano en area (0 = sin area)
//  armor     = reduccion de dano 0..1 (0.4 = -40%)
//  heal      = true si es sanador (cura en vez de atacar)
//  bonusVs   = multiplicador de dano contra ciertos tipos
//  count     = cuantas unidades aparecen por "regalo"/click
//  power     = peso para la barra de fuerza del ejercito
//  tier      = 1..5 (estrellas, que tan caro es el regalo)
//  coin      = costo aproximado del regalo en monedas TikTok
// ------------------------------------------------------------
const UNIT_TYPES = {
  soldado: {
    id: 'soldado', name: 'Soldado', icon: '⚔️',
    hp: 110, damage: 13, range: 20, speed: 46, attackCD: 0.8,
    ranged: false, splash: 0, armor: 0.05,
    count: 6, power: 1, tier: 1, size: 14, color: '#d0d0d0',
    gift: 'Rosa 🌹', coin: 1, desc: 'Tropa basica. Barato y numeroso.',
  },
  arquero: {
    id: 'arquero', name: 'Arquero', icon: '🏹',
    hp: 55, damage: 11, range: 165, speed: 44, attackCD: 1.0,
    ranged: true, projSpeed: 360, splash: 0, armor: 0,
    count: 4, power: 2, tier: 1, size: 13, color: '#5fd35f',
    gift: 'TikTok 🎵', coin: 1, desc: 'Dispara de lejos. Fragil cuerpo a cuerpo.',
  },
  lancero: {
    id: 'lancero', name: 'Lancero', icon: '🔱',
    hp: 100, damage: 15, range: 30, speed: 40, attackCD: 0.95,
    ranged: false, splash: 0, armor: 0.08,
    bonusVs: { caballeria: 2.2, leon: 1.6 },
    count: 5, power: 2, tier: 2, size: 14, color: '#caa472',
    gift: 'Mano 👋', coin: 5, desc: 'Anti-caballeria: x2.2 a jinetes, x1.6 al leon.',
  },
  escudero: {
    id: 'escudero', name: 'Escudero', icon: '🛡️',
    hp: 340, damage: 7, range: 20, speed: 28, attackCD: 1.2,
    ranged: false, splash: 0, armor: 0.4,
    count: 2, power: 4, tier: 2, size: 16, color: '#6fa8dc',
    gift: 'Sombrero 🎩', coin: 10, desc: 'Tanque. Mucha vida y blindaje, poco dano.',
  },
  sanador: {
    id: 'sanador', name: 'Sanador', icon: '✚',
    hp: 75, damage: 0, range: 120, speed: 40, attackCD: 1.0,
    ranged: false, splash: 0, armor: 0, heal: true, healAmount: 16,
    count: 2, power: 4, tier: 2, size: 13, color: '#ffffff',
    gift: 'Corazon 💖', coin: 10, desc: 'Cura a los aliados heridos cercanos.',
  },
  caballeria: {
    id: 'caballeria', name: 'Caballeria', icon: '🐎',
    hp: 175, damage: 22, range: 22, speed: 95, attackCD: 0.9,
    ranged: false, splash: 0, armor: 0.12,
    count: 3, power: 6, tier: 3, size: 19, color: '#d4a017',
    gift: 'Perfume 🌸', coin: 20, desc: 'Veloz y fuerte. Cuidado con los lanceros.',
  },
  ballestero: {
    id: 'ballestero', name: 'Ballestero', icon: '🎯',
    hp: 70, damage: 30, range: 210, speed: 30, attackCD: 2.0,
    ranged: true, projSpeed: 420, splash: 0, armor: 0.05,
    count: 2, power: 6, tier: 3, size: 14, color: '#b5651d',
    gift: 'Guantes 🥊', coin: 30, desc: 'Francotirador: mucho dano, recarga lenta.',
  },
  mago: {
    id: 'mago', name: 'Mago', icon: '🪄',
    hp: 60, damage: 26, range: 150, speed: 34, attackCD: 2.3,
    ranged: true, projSpeed: 260, splash: 34, armor: 0,
    count: 2, power: 7, tier: 3, size: 14, color: '#a371f7',
    gift: 'Galaxy 🌌', coin: 50, desc: 'Dano en area. Destroza grupos apretados.',
  },
  berserker: {
    id: 'berserker', name: 'Berserker', icon: '🪓',
    hp: 120, damage: 26, range: 20, speed: 72, attackCD: 0.5,
    ranged: false, splash: 0, armor: 0,
    count: 3, power: 8, tier: 4, size: 15, color: '#e0563f',
    gift: 'Tormenta ⛈️', coin: 99, desc: 'Golpea rapidisimo. Letal pero fragil.',
  },
  gigante: {
    id: 'gigante', name: 'Gigante', icon: '🗿',
    hp: 950, damage: 55, range: 34, speed: 24, attackCD: 1.7,
    ranged: false, splash: 40, armor: 0.2,
    count: 1, power: 22, tier: 4, size: 32, color: '#8a5a2b',
    gift: 'Gigante 🗿', coin: 500, desc: 'Coloso de piedra. Aplasta en area.',
  },
  // ----------- UNIDADES EPICAS (regalos enormes) -----------
  leon: {
    id: 'leon', name: 'Leon', icon: '🦁',
    hp: 750, damage: 70, range: 28, speed: 82, attackCD: 0.75,
    ranged: false, splash: 22, armor: 0.18, lifesteal: 0.3,
    count: 1, power: 34, tier: 5, size: 30, color: '#d9a441',
    gift: 'Leon 🦁', coin: 29999, desc: 'Bestia veloz y feroz. Roba vida al morder.',
  },
  dragon: {
    id: 'dragon', name: 'Dragon', icon: '🐉',
    hp: 1200, damage: 70, range: 250, speed: 40, attackCD: 1.6,
    ranged: true, projSpeed: 300, splash: 58, armor: 0.22, flying: true,
    count: 1, power: 45, tier: 5, size: 38, color: '#e2552f',
    gift: 'Universo 🌌🐉', coin: 34999, desc: 'Vuela y escupe fuego en area. El mas letal.',
  },
};

// Orden para botones y teclas (1..0, luego Q, W)
const UNIT_ORDER = [
  'soldado', 'arquero', 'lancero', 'escudero', 'sanador',
  'caballeria', 'ballestero', 'mago', 'berserker', 'gigante',
  'leon', 'dragon',
];

// Mapa de teclas: e.code -> indice en UNIT_ORDER
const KEY_TO_INDEX = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
  Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9,
  KeyQ: 10, KeyW: 11,
};
const INDEX_TO_KEYLABEL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W'];

// ------------------------------------------------------------
//  REGALOS  ->  EQUIPO + UNIDAD ALEATORIA
//  Cada regalo pertenece SIEMPRE a un equipo (A=abajo, B=arriba).
//  Al enviarlo, aparece una unidad ALEATORIA de su "bracket" de valor.
//  Así el espectador sabe siempre qué regalo apoya a cada país.
// ------------------------------------------------------------
const GIFT_BRACKETS = [
  { pool: ['soldado', 'arquero'] },              // 0 · valor 1
  { pool: ['lancero', 'sanador'] },              // 1 · valor 5
  { pool: ['escudero', 'sanador'] },             // 2 · valor 15
  { pool: ['caballeria', 'ballestero'] },        // 3 · valor 40
  { pool: ['mago', 'berserker', 'gigante'] },    // 4 · valor 120 (incluye Gigante)
  { pool: ['leon', 'dragon'] },                  // 5 · épico (solo León/Dragón)
];

// 6 regalos para el equipo A (abajo) y 6 para el B (arriba).
// 'tiktok' = nombre REAL del regalo en TikTok (editable en admin.html).
const GIFTS = [
  { id: 'rosa',     icon: '🌹', name: 'Rosa',     team: 'A', bracket: 0, coin: 1,     tiktok: 'Rose' },
  { id: 'tiktok',   icon: '🎵', name: 'TikTok',   team: 'B', bracket: 0, coin: 1,     tiktok: 'TikTok' },
  { id: 'mano',     icon: '👋', name: 'Mano',     team: 'A', bracket: 1, coin: 5,     tiktok: 'Finger Heart' },
  { id: 'estrella', icon: '⭐', name: 'Estrella', team: 'B', bracket: 1, coin: 10,    tiktok: 'Star' },
  { id: 'helado',   icon: '🍦', name: 'Helado',   team: 'A', bracket: 2, coin: 20,    tiktok: 'Ice Cream Cone' },
  { id: 'sombrero', icon: '🎩', name: 'Sombrero', team: 'B', bracket: 2, coin: 30,    tiktok: 'Hat and Mustache' },
  { id: 'perfume',  icon: '🌸', name: 'Perfume',  team: 'A', bracket: 3, coin: 99,    tiktok: 'Perfume' },
  { id: 'guantes',  icon: '🥊', name: 'Guantes',  team: 'B', bracket: 3, coin: 199,   tiktok: 'Boxing Gloves' },
  { id: 'galaxy',   icon: '🌌', name: 'Galaxy',   team: 'A', bracket: 4, coin: 500,   tiktok: 'Galaxy' },
  { id: 'tormenta', icon: '⛈️', name: 'Tormenta', team: 'B', bracket: 4, coin: 1000,  tiktok: 'Storm' },
  { id: 'leongift', icon: '🦁', name: 'León',     team: 'A', bracket: 5, coin: 29999, tiktok: 'Lion' },
  { id: 'universo', icon: '🐉', name: 'Universo', team: 'B', bracket: 5, coin: 34999, tiktok: 'Universe' },
];

const GIFTS_A = GIFTS.filter(g => g.team === 'A');   // en orden de bracket
const GIFTS_B = GIFTS.filter(g => g.team === 'B');

function giftByKey(bracket, team) {
  return GIFTS.find(g => g.bracket === bracket && g.team === team);
}

// ------------------------------------------------------------
//  VOTACION: cada país candidato recibe un regalo distinto de 1
//  moneda. Enviar ese regalo = +10 puntos a ese país. Así el
//  espectador sabe qué regalo manda para votar por cada país.
// ------------------------------------------------------------
const VOTE_GIFTS = [
  { icon: '🌹', name: 'Rosa',     tiktok: 'Rose' },
  { icon: '🎵', name: 'TikTok',   tiktok: 'TikTok' },
  { icon: '👋', name: 'Mano',     tiktok: 'Finger Heart' },
  { icon: '⭐', name: 'Estrella', tiktok: 'Star' },
  { icon: '🍦', name: 'Helado',   tiktok: 'Ice Cream Cone' },
  { icon: '🎩', name: 'Sombrero', tiktok: 'Hat and Mustache' },
  { icon: '🌸', name: 'Perfume',  tiktok: 'Perfume' },
  { icon: '🥊', name: 'Guantes',  tiktok: 'Boxing Gloves' },
  { icon: '🌌', name: 'Galaxy',   tiktok: 'Galaxy' },
  { icon: '⛈️', name: 'Tormenta', tiktok: 'Storm' },
];
const VOTE_GIFT_POINTS = 10;   // puntos por enviar el regalo del país

// ------------------------------------------------------------
//  PAISES  (bandera + colores [primario, secundario])
// ------------------------------------------------------------
const COUNTRIES = [
  { id: 'pe', name: 'Peru',      flag: '🇵🇪', primary: '#D91023', secondary: '#ffffff' },
  { id: 'br', name: 'Brasil',    flag: '🇧🇷', primary: '#009C3B', secondary: '#FFDF00' },
  { id: 'mx', name: 'Mexico',    flag: '🇲🇽', primary: '#006847', secondary: '#CE1126' },
  { id: 'ar', name: 'Argentina', flag: '🇦🇷', primary: '#75AADB', secondary: '#ffffff' },
  { id: 'co', name: 'Colombia',  flag: '🇨🇴', primary: '#FCD116', secondary: '#003893' },
  { id: 'cl', name: 'Chile',     flag: '🇨🇱', primary: '#0039A6', secondary: '#D52B1E' },
  { id: 'us', name: 'USA',       flag: '🇺🇸', primary: '#3C3B6E', secondary: '#B22234' },
  { id: 'es', name: 'Espana',    flag: '🇪🇸', primary: '#AA151B', secondary: '#F1BF00' },
  { id: 've', name: 'Venezuela', flag: '🇻🇪', primary: '#CF142B', secondary: '#FFCC00' },
  { id: 'ec', name: 'Ecuador',   flag: '🇪🇨', primary: '#034EA2', secondary: '#FFDD00' },
  { id: 'bo', name: 'Bolivia',   flag: '🇧🇴', primary: '#007934', secondary: '#D52B1E' },
  { id: 'uy', name: 'Uruguay',   flag: '🇺🇾', primary: '#0038A8', secondary: '#FCD116' },
  { id: 'py', name: 'Paraguay',  flag: '🇵🇾', primary: '#D52B1E', secondary: '#0038A8' },
];

// Países que aparecen por defecto en la votación.
// Si el chat escribe más países, se agregan (game.addVoteByComment).
const DEFAULT_COUNTRY_IDS = ['pe', 'cl', 'ar', 'bo'];

// ------------------------------------------------------------
//  VOTACION: 5 niveles de puntaje (un regalo grande pesa mas,
//  pero muchos pequenos tambien suman).
// ------------------------------------------------------------
const VOTE_TIERS = [
  { label: '💬', name: 'Comentario', value: 1 },
  { label: '🌹', name: 'Rosa', value: 5 },
  { label: '🎁', name: 'Regalo', value: 15 },
  { label: '💎', name: 'Grande', value: 50 },
  { label: '🦁', name: 'Enorme', value: 200 },
];

// Nombres falsos para simular el "Top de regalos" en el prototipo
// (en la Fase 2 se reemplazan por los usuarios reales de TikTok).
const FAKE_GIFTERS = [
  '@maria_07', '@juancho', '@kevincito', '@laflaca', '@elpro_99',
  '@dani.rose', '@xXkillerXx', '@sofi_g', '@tito_22', '@reyna_b',
  '@cami.uwu', '@bruno_tk', '@luchito', '@nenita', '@gonza_10',
];

// Elige colores con buen contraste para los dos ejercitos.
function pickTeamColors(cA, cB) {
  let colA = cA.primary;
  let colB = cB.primary;
  if (colorDistance(colA, colB) < 120) {
    colB = cB.secondary;
    if (colorDistance(colA, colB) < 120) colB = '#222222';
  }
  return { a: colA, b: colB };
}
