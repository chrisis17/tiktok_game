// ============================================================
//  settings.js  -  Configuracion compartida entre el JUEGO y
//  el panel ADMIN, persistida en localStorage del navegador.
//  Asi puedes editar tiempos / regalos en la pestana admin y
//  el juego los aplica en vivo.
// ============================================================

const SETTINGS_DEFAULTS = {
  voteTime: 20,
  recruitTime: 30,
  battleTime: 75,
  maxPerTeam: 260,
  winPoints: 1,        // el país ganador suma 1 punto (= 1 victoria)
  drawPoints: 0,
  candidateCount: 6,
  spotlightMinCoin: 1,   // monedas mínimas para activar el enfoque (0 = todos)
  likesPerUnit: 100,     // cuántos tap-tap (likes) invocan un soldado
};

const LS_SETTINGS = 'gpb_settings';
const LS_GIFTS = 'gpb_gifts';
const LS_RANKING = 'gpb_ranking';

// Ranking global de países (persiste entre sesiones)
function loadRanking() {
  try { return JSON.parse(localStorage.getItem(LS_RANKING) || '{}'); }
  catch (e) { return {}; }
}
function saveRanking(r) {
  try { localStorage.setItem(LS_RANKING, JSON.stringify(r)); } catch (e) {}
}

function loadSettings() {
  try {
    return Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}'));
  } catch (e) { return Object.assign({}, SETTINGS_DEFAULTS); }
}
function saveSettings(s) { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); }

// Overrides de regalos por unidad: { soldado: { gift:'Rosa', coin:1 }, ... }
function loadGiftOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_GIFTS) || '{}'); }
  catch (e) { return {}; }
}
function saveGiftOverrides(o) { localStorage.setItem(LS_GIFTS, JSON.stringify(o)); }

// Monedas efectivas de un REGALO (override del admin o el default del config)
function giftCoin(g) {
  const ov = loadGiftOverrides()[g.id] || {};
  return ov.coin != null ? ov.coin : g.coin;
}

// Nombre REAL del regalo en TikTok (override del admin o el default del config)
function giftTikTok(g) {
  const ov = loadGiftOverrides()[g.id] || {};
  return ov.tiktok != null && ov.tiktok !== '' ? ov.tiktok : (g.tiktok || g.name);
}
