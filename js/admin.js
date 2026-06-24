// ============================================================
//  admin.js  -  Panel de administrador (pestana aparte).
//  - Editar tiempos y reglas (se guardan en localStorage)
//  - Tabla de balance / tier list (que unidad es mejor)
//  - Mapeo de regalos -> unidad (nombre y costo en monedas)
//  El juego (index.html) lee estos valores en cada fase.
// ============================================================

function num(v, d) { const n = parseFloat(v); return isNaN(n) ? d : n; }

const SETTING_FIELDS = [
  ['voteTime', 'Tiempo de votación (s)'],
  ['recruitTime', 'Tiempo de reclutamiento (s)'],
  ['battleTime', 'Tope de batalla (s)'],
  ['candidateCount', 'Países candidatos en votación'],
  ['spotlightMinCoin', 'Mín. monedas para enfoque (0=todos)'],
  ['likesPerUnit', 'Tap-taps (likes) por soldado'],
  ['maxPerTeam', 'Máx. unidades por ejército'],
  ['winPoints', 'Puntos por ganar'],
  ['drawPoints', 'Puntos por empate'],
];

// ---------- Ajustes ----------
function buildSettingsForm() {
  const s = loadSettings();
  const host = document.getElementById('settingsForm');
  host.innerHTML = '';
  for (const [key, label] of SETTING_FIELDS) {
    const wrap = document.createElement('label');
    wrap.className = 'fld';
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement('input');
    inp.type = 'number'; inp.id = 'set_' + key; inp.value = s[key];
    wrap.appendChild(inp);
    host.appendChild(wrap);
  }
}
function saveSettingsForm() {
  const s = loadSettings();
  for (const [key] of SETTING_FIELDS) {
    s[key] = num(document.getElementById('set_' + key).value, s[key]);
  }
  saveSettings(s);
  toast('✔ Ajustes guardados — el juego los aplica en la próxima fase');
}
function resetSettings() {
  saveSettings(Object.assign({}, SETTINGS_DEFAULTS));
  buildSettingsForm();
  toast('↺ Ajustes restaurados a valores por defecto');
}

// ---------- Mapeo de regalos ----------
function buildGiftTable() {
  const host = document.getElementById('giftRows');
  host.innerHTML = '';
  GIFTS.forEach(g => {
    const coin = giftCoin(g);
    const pool = GIFT_BRACKETS[g.bracket].pool
      .map(id => UNIT_TYPES[id].icon + UNIT_TYPES[id].name).join(', ');
    const team = g.team === 'A'
      ? '<span style="color:#ff8a6a">🔻 Abajo (A)</span>'
      : '<span style="color:#6fa8ff">🔺 Arriba (B)</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="ico">${g.icon}</td>
      <td><b>${g.name}</b></td>
      <td>${team}</td>
      <td><input data-id="${g.id}" data-f="tiktok" value="${giftTikTok(g)}" style="width:150px"></td>
      <td><input data-id="${g.id}" data-f="coin" type="number" value="${coin}" style="width:80px"></td>
      <td><small>${pool} <i>(aleatorio)</i></small></td>`;
    host.appendChild(tr);
  });
}
function saveGifts() {
  const ov = loadGiftOverrides();
  document.querySelectorAll('#giftRows input').forEach(inp => {
    const id = inp.dataset.id, f = inp.dataset.f;
    ov[id] = ov[id] || {};
    ov[id][f] = (f === 'coin') ? num(inp.value, 0) : inp.value;
  });
  saveGiftOverrides(ov);
  toast('✔ Regalos guardados — visibles en el juego al recargar la fase');
}
function resetGifts() {
  saveGiftOverrides({});
  buildGiftTable();
  toast('↺ Mapeo de regalos restaurado');
}

// ---------- Balance / Tier list ----------
function strength(t) {
  const dps = t.heal ? (t.healAmount / t.attackCD) : (t.damage / t.attackCD);
  const ehp = t.hp / (1 - t.armor);
  const rangeF = t.ranged ? 1.25 : 1;
  const splashF = t.splash > 0 ? 1.3 : 1;
  const score = dps * ehp * rangeF * splashF / 1000;
  return { dps, ehp, score };
}
function tierLetter(score, max) {
  const r = score / max;
  if (r >= 0.66) return ['S', '#ff5b7f'];
  if (r >= 0.4) return ['A', '#ffb340'];
  if (r >= 0.18) return ['B', '#5fd35f'];
  return ['C', '#9aa6c4'];
}
function buildBalanceTable() {
  const rows = UNIT_ORDER.map(id => {
    const t = UNIT_TYPES[id];
    const s = strength(t);
    return { t, ...s };
  }).sort((a, b) => b.score - a.score);
  const max = rows[0].score;

  const host = document.getElementById('balanceRows');
  host.innerHTML = '';
  rows.forEach((r, i) => {
    const t = r.t;
    const [letter, lcol] = tierLetter(r.score, max);
    const counters = t.bonusVs
      ? Object.keys(t.bonusVs).map(k => `${UNIT_TYPES[k].icon}x${t.bonusVs[k]}`).join(' ')
      : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="tier" style="background:${lcol}">${letter}</span></td>
      <td class="ico">${t.icon}</td>
      <td><b>${t.name}</b></td>
      <td>${Math.round(r.score)}</td>
      <td>${t.hp}</td>
      <td>${t.damage}</td>
      <td>${Math.round(r.dps)}</td>
      <td>${t.range}</td>
      <td>${t.speed}</td>
      <td>${Math.round(t.armor * 100)}%</td>
      <td>${t.coin}🪙</td>
      <td><small>${counters}</small></td>`;
    host.appendChild(tr);
  });
  document.getElementById('rosterCount').textContent = rows.length;
}

// ---------- util ----------
let toastT = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

window.addEventListener('load', () => {
  buildSettingsForm();
  buildGiftTable();
  buildBalanceTable();
  document.getElementById('saveSettings').onclick = saveSettingsForm;
  document.getElementById('resetSettings').onclick = resetSettings;
  document.getElementById('saveGifts').onclick = saveGifts;
  document.getElementById('resetGifts').onclick = resetGifts;
});
