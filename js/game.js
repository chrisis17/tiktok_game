// ============================================================
//  game.js  -  Maquina de estados, bucle, controles e interfaz.
//  Orientacion VERTICAL 9:16 (para TikTok LIVE a pantalla completa).
//  Equipo A = ABAJO, Equipo B = ARRIBA.
// ============================================================

const W = 720, H = 1280;   // resolucion interna vertical (9:16)
let game;

// window.game para que tiktok.js / control puedan acceder (let no lo pone en window)
window.addEventListener('load', () => { window.game = game = new Game(); });

class Game {
  constructor() {
    this.canvas = document.getElementById('field');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.world = new World(W, H);
    this.settings = loadSettings();
    // Modo: ?host = corre el juego y lo emite | ?view = espejo (solo dibuja) | normal = solo
    const params = new URLSearchParams(location.search);
    this.mode = params.has('view') ? 'view' : (params.has('host') ? 'host' : 'solo');
    this.bob = 0; this.snap = null; this._prevPh = null; this._lastState = 0;
    this.phase = 'VOTING';
    this.round = 1;
    this.ranking = loadRanking();   // ranking persistente entre sesiones
    this.candidates = [];
    this.timer = 0;
    this.autofill = false;
    this.autofillT = 0;
    this.last = performance.now();

    this.dom = {
      phaseLabel: document.getElementById('phaseLabel'),
      roundLabel: document.getElementById('roundLabel'),
      timerLabel: document.getElementById('timerLabel'),
      votingPanel: document.getElementById('votingPanel'),
      candidates: document.getElementById('candidates'),
      aGifts: document.getElementById('aGifts'),
      bGifts: document.getElementById('bGifts'),
      recruitPanel: document.getElementById('recruitPanel'),
      aUnits: document.getElementById('aUnits'),
      bUnits: document.getElementById('bUnits'),
      aName: document.getElementById('aName'),
      bName: document.getElementById('bName'),
      aFlag: document.getElementById('aFlag'),
      bFlag: document.getElementById('bFlag'),
      aColFlag: document.getElementById('aColFlag'),
      bColFlag: document.getElementById('bColFlag'),
      aCount: document.getElementById('aCount'),
      bCount: document.getElementById('bCount'),
      aBar: document.getElementById('aBar'),
      bBar: document.getElementById('bBar'),
      resultPanel: document.getElementById('resultPanel'),
      resultText: document.getElementById('resultText'),
      ranking: document.getElementById('ranking'),
      topGifters: document.getElementById('topGifters'),
      topCountries: document.getElementById('topCountries'),
      ctrlBtns: document.getElementById('ctrlBtns'),
    };

    this.gifters = {};          // nombre -> monedas (Top de regalos)
    this.spotlight = null;      // enfoque activo (pausa el juego)
    this.spotlightQueue = [];   // enfoques pendientes
    this.likes = 0;             // tap-tap acumulados
    this.shakeT = 0; this.shakeMag = 0; this.shakeDur = 1;   // sacudida de pantalla

    this.buildGiftButtons();
    this.buildControls();
    if (this.mode !== 'view') this.bindKeys();
    this.renderRanking();
    this.renderGifters();
    if (this.mode === 'view') this.setupViewer();
    else this.startVoting();

    // Si cambias ajustes en admin.html (otra pestana), se aplican aqui en vivo
    window.addEventListener('storage', (e) => {
      if (e.key === LS_SETTINGS) this.settings = loadSettings();
      if (e.key === LS_GIFTS) this.buildGiftButtons();
    });

    this.startLoop();
  }

  // ---------- UI ----------
  buildGiftButtons() {
    const make = (host, gifts, team) => {
      if (!host) return;
      host.innerHTML = '';
      gifts.forEach((g, i) => {
        const coin = giftCoin(g);
        const pool = GIFT_BRACKETS[g.bracket].pool.map(id => UNIT_TYPES[id].icon).join('');
        const key = (team === 'A' ? '' : '⇧') + (i + 1);
        const b = document.createElement('button');
        b.className = 'unitBtn' + (g.bracket >= 5 ? ' tier5' : g.bracket >= 4 ? ' tier4' : '');
        b.innerHTML = `<span class="ub-key">${key}</span>
          <span class="ub-ico">${g.icon}</span>
          <span class="ub-name">${g.name}</span>
          <span class="ub-gift">${coin}🪙 → ${pool} (aleatorio)</span>`;
        b.title = `${g.name}: invoca una unidad aleatoria para el equipo ${team}`;
        b.onclick = () => this.spawnGift(g.id);
        host.appendChild(b);
      });
    };
    make(this.dom.aUnits, GIFTS_A, 'A');
    make(this.dom.bUnits, GIFTS_B, 'B');
    // Leyenda de regalos por equipo (visible en el frame del juego)
    if (this.dom.aGifts) this.dom.aGifts.textContent = '🎁 ' + GIFTS_A.map(g => g.icon).join(' ');
    if (this.dom.bGifts) this.dom.bGifts.textContent = '🎁 ' + GIFTS_B.map(g => g.icon).join(' ');
  }

  buildControls() {
    this.dom.ctrlBtns.innerHTML = '';
    const mk = (label, fn, cls) => {
      const b = document.createElement('button');
      b.textContent = label; b.className = 'ctrlBtn ' + (cls || '');
      b.onclick = () => { SFX.click(); fn(); };
      this.dom.ctrlBtns.appendChild(b); return b;
    };
    mk('⚔️ ¡PELEAR!', () => this.startBattle(), 'primary');
    mk('👍 +100 tap tap', () => this.addLikes(100));
    this.autofillBtn = mk('🎲 Relleno: OFF', () => this.toggleAutofill());
    mk('🔄 Reiniciar', () => this.resetRound());
    const initMuted = (() => { try { return localStorage.getItem('gpb_muted') === '1'; } catch (e) { return false; } })();
    this.soundBtn = mk('🔊 Sonido: ' + (initMuted ? 'OFF' : 'ON'), () => this.toggleSound());
    if (initMuted) this.soundBtn.classList.add('muted');
    const initMusic = (() => { try { return localStorage.getItem('gpb_music') === '1'; } catch (e) { return false; } })();
    this.musicBtn = mk('🎵 Música: ' + (initMusic ? 'ON' : 'OFF'), () => this.toggleMusic());
    if (initMusic) this.musicBtn.classList.add('on');
    mk('⛶ Vista OBS', () => { const s = document.getElementById('stage'); if (s.requestFullscreen) s.requestFullscreen(); });
    mk('⚙️ Admin', () => window.open('admin.html', '_blank'), 'ghost');
  }

  toggleSound() {
    const m = !SFX.isMuted();
    SFX.init(); SFX.setMuted(m);
    this.soundBtn.textContent = '🔊 Sonido: ' + (m ? 'OFF' : 'ON');
    this.soundBtn.classList.toggle('muted', m);
  }

  toggleMusic() {
    const on = SFX.music.toggle();
    this.musicBtn.textContent = '🎵 Música: ' + (on ? 'ON' : 'OFF');
    this.musicBtn.classList.toggle('on', on);
  }

  addShake(mag, dur) { this.shakeMag = mag; this.shakeDur = dur; this.shakeT = dur; }

  // Tap-tap (likes): cada N likes invocan un soldado para el equipo que va perdiendo
  addLikes(n) {
    this.likes += n;
    if (this.phase !== 'RECRUIT' && this.phase !== 'BATTLE') return;
    const per = this.settings.likesPerUnit || 100;
    let spawned = 0;
    while (this.likes >= per) {
      this.likes -= per;
      const s = this.world.getStats();
      const team = s.aliveA <= s.aliveB ? 'A' : 'B';   // ayuda al que va perdiendo
      if (this.world.countTeam(team) >= this.settings.maxPerTeam) continue;
      const b = this.world.bounds, mid = (b.y0 + b.y1) / 2;
      const zoneY = team === 'A' ? [mid + 24, b.y1 - 6] : [b.y0 + 6, mid - 24];
      this.world.spawn(team, 'soldado', rand(b.x0 + 6, b.x1 - 6), rand(zoneY[0], zoneY[1]));
      spawned++;
    }
    if (spawned) this.sfx('like');
  }

  // ---------- FASE: Votacion ----------
  startVoting() {
    this.settings = loadSettings();   // recoge cambios del admin
    this.phase = 'VOTING';
    this.timer = this.settings.voteTime;
    this.world.reset();
    this.spotlight = null; this.spotlightQueue = [];
    this.sfx('phase');
    // Por defecto: los 4 países con MÁS victorias; si hay menos, se rellena
    // con los países por defecto. El chat puede sumar más con addVoteByComment.
    const ranked = COUNTRIES
      .filter(c => (this.ranking[c.id] || 0) > 0)
      .sort((a, b) => (this.ranking[b.id] || 0) - (this.ranking[a.id] || 0));
    const list = ranked.slice(0, 4);
    for (const id of DEFAULT_COUNTRY_IDS) {
      if (list.length >= 4) break;
      const c = COUNTRIES.find(x => x.id === id);
      if (c && !list.some(x => x.id === c.id)) list.push(c);
    }
    this.candidates = list.map(c => ({ c, votes: 0 }));
    this.renderCandidates();
    this.setPanels();
  }

  // Detecta un país escrito en un comentario (bien escrito) y le suma 1 punto.
  // Si el país no estaba en la votación, lo agrega. Lo llamará el chat en Fase 2.
  addVoteByComment(text) {
    if (this.phase !== 'VOTING' || !text) return false;
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tokens = norm(text).split(/[^a-z]+/).filter(Boolean);
    for (const country of COUNTRIES) {
      if (tokens.includes(norm(country.name))) {   // solo si el nombre está bien escrito
        const cand = this.candidates.find(x => x.c.id === country.id);
        if (cand) cand.votes += 1;
        else if (this.candidates.length < 10) this.candidates.push({ c: country, votes: 1 });
        else return false;
        this.renderCandidates();
        return true;
      }
    }
    return false;
  }

  renderCandidates() {
    // Tamaño dinámico para que quepan hasta 8+ países sin salirse
    const n = this.candidates.length;
    const wpx = n <= 4 ? 124 : n <= 6 ? 104 : n <= 8 ? 92 : 82;
    const flagSize = n <= 4 ? 32 : n <= 6 ? 27 : n <= 8 ? 23 : 20;

    this.dom.candidates.innerHTML = '';
    this.candidates.forEach((cand, i) => {
      const vg = VOTE_GIFTS[i % VOTE_GIFTS.length];   // regalo asignado a este país
      cand.giftIcon = vg.icon;
      const wins = this.ranking[cand.c.id] || 0;       // veces que ha ganado
      const el = document.createElement('button');
      el.className = 'cand';
      el.style.width = wpx + 'px';
      el.innerHTML = `<div class="cand-flag" style="font-size:${flagSize}px">${cand.c.flag}</div>
        <div class="cand-name">${cand.c.name}</div>
        <div class="cand-wins">🏆 ${wins}</div>
        <div class="cand-gift">${vg.icon} +${VOTE_GIFT_POINTS}</div>
        <div class="cand-votes">${cand.votes} pts</div>`;
      el.title = `Envía ${vg.name} para votar por ${cand.c.name}`;
      el.onclick = () => this.vote(i, VOTE_GIFT_POINTS);   // simula su regalo (+10)
      this.dom.candidates.appendChild(el);
    });
  }

  vote(i, amount) { this.candidates[i].votes += amount; this.renderCandidates(); this.sfx('vote'); }

  // Un REGALO durante la votación = +10 al país que tiene ese regalo asignado
  voteByGift(giftName) {
    if (this.phase !== 'VOTING' || !giftName) return false;
    const n = giftName.toLowerCase().trim();
    const idx = VOTE_GIFTS.findIndex(v => (v.tiktok || v.name).toLowerCase() === n);
    if (idx >= 0 && idx < this.candidates.length) { this.vote(idx, VOTE_GIFT_POINTS); return true; }
    return false;
  }

  chooseTop2() {
    // Mezclar antes de ordenar => si hay empate (incluso >2 países), el
    // desempate es aleatorio entre los empatados.
    const sorted = shuffle(this.candidates).sort((a, b) => b.votes - a.votes);
    const top = sorted[0].c, second = sorted[1].c;
    // El MÁS votado va ARRIBA (equipo B) para tener la ventaja del Dragón;
    // el menos votado va ABAJO (equipo A).
    this.world.countryA = second;
    this.world.countryB = top;
    const cols = pickTeamColors(this.world.countryA, this.world.countryB);
    this.world.colorA = cols.a;
    this.world.colorB = cols.b;
    this.startRecruit();
  }

  // ---------- FASE: Reclutamiento ----------
  startRecruit() {
    this.settings = loadSettings();
    this.buildGiftButtons();          // recoge cambios de regalos del admin
    this.phase = 'RECRUIT';
    this.timer = this.settings.recruitTime;
    const A = this.world.countryA, B = this.world.countryB;
    this.setText('aFlag', A.flag); this.setText('aName', A.name);
    this.setText('bFlag', B.flag); this.setText('bName', B.name);
    this.setText('aColFlag', A.flag); this.setText('bColFlag', B.flag);
    if (this.dom.aName) this.dom.aName.style.color = this.world.colorA;
    if (this.dom.bName) this.dom.bName.style.color = this.world.colorB;
    this.sfx('phase');
    this.setPanels();
  }

  setText(id, v) { if (this.dom[id]) this.dom[id].textContent = v; }

  // Procesa un REGALO: define el equipo y aparece UNA unidad aleatoria por valor
  spawnGift(giftId, gifter, spotlight = true, realCoin = 0) {
    if (this.phase !== 'RECRUIT' && this.phase !== 'BATTLE') return;
    const g = GIFTS.find(x => x.id === giftId);
    if (!g) return;
    if (this.world.countTeam(g.team) >= this.settings.maxPerTeam) return;
    const unitId = choice(GIFT_BRACKETS[g.bracket].pool);   // unidad aleatoria del bracket
    const unit = this._spawnOne(g.team, unitId);
    // En vivo usa el costo REAL del regalo (diamantes de TikTok); si no, el del config
    const coin = realCoin > 0 ? realCoin : giftCoin(g);
    const name = gifter || 'Tú 👑';
    if (unit) { unit.gifter = name; unit.nameT = 8; }   // nombre sobre el personaje
    this.addGift(name, coin);
    if (spotlight) this.sfx('spawn');
    if (spotlight && unit) this.enqueueSpotlight({
      unit, gifter: name, gift: g.icon + ' ' + g.name,
      name: UNIT_TYPES[unitId].name, coin,
    });
  }

  // Aparece una unidad en la mitad de la arena de su equipo (A abajo, B arriba)
  _spawnOne(team, unitId) {
    const b = this.world.bounds, mid = (b.y0 + b.y1) / 2;
    const zoneY = team === 'A' ? [mid + 24, b.y1 - 6] : [b.y0 + 6, mid - 24];
    return this.world.spawn(team, unitId, rand(b.x0 + 6, b.x1 - 6), rand(zoneY[0], zoneY[1]));
  }

  // Duración y tamaño del enfoque según el valor del regalo
  spotlightParams(coin) {
    if (coin < 5) return { dur: 0.5, size: 70, intensity: 1 };
    if (coin < 15) return { dur: 0.9, size: 80, intensity: 1 };
    if (coin < 50) return { dur: 1.3, size: 92, intensity: 2 };
    if (coin < 100) return { dur: 1.9, size: 104, intensity: 2 };
    if (coin < 1000) return { dur: 2.8, size: 118, intensity: 3 };
    if (coin < 20000) return { dur: 4.0, size: 132, intensity: 4 };
    return { dur: 5.0, size: 150, intensity: 5 };   // León / Dragón
  }

  enqueueSpotlight(item) {
    if (!item.unit) return;
    if (item.coin < this.settings.spotlightMinCoin) return;
    const p = this.spotlightParams(item.coin);
    item.t = 0; item.dur = p.dur; item.size = p.size; item.intensity = p.intensity;
    if (this.spotlight || this.spotlightQueue.length) {
      // ocupado: cola de máx 4; si está llena, el más valioso desplaza al más barato
      if (this.spotlightQueue.length >= 4) {
        let minI = 0;
        for (let i = 1; i < this.spotlightQueue.length; i++)
          if (this.spotlightQueue[i].coin < this.spotlightQueue[minI].coin) minI = i;
        if (item.coin > this.spotlightQueue[minI].coin) this.spotlightQueue.splice(minI, 1);
        else return;
      }
      this.spotlightQueue.push(item);
    } else {
      this.activateSpotlight(item);
    }
  }

  // Activa un enfoque y dispara su sonido según la importancia
  activateSpotlight(item) {
    this.spotlight = item;
    if (!item) return;
    if (item.intensity >= 4) this.sfx('epic');
    else if (item.intensity >= 3) this.sfx('spawnBig');
  }

  updateSpotlight(dt) {
    this.spotlight.t += dt;
    if (this.spotlight.t >= this.spotlight.dur) {
      if (this.spotlight.intensity >= 4) this.addShake(10, 0.45);   // golpe al aterrizar
      this.activateSpotlight(this.spotlightQueue.shift() || null);
    }
  }

  // Suma monedas a un usuario para el "Top de regalos"
  addGift(name, coins) {
    this.gifters[name] = (this.gifters[name] || 0) + coins;
    this.renderGifters();
  }

  renderGifters() {
    if (!this.dom.topGifters) return;
    const medal = ['🥇', '🥈', '🥉'];
    const rows = Object.keys(this.gifters)
      .map(n => ({ n, c: this.gifters[n] }))
      .sort((a, b) => b.c - a.c).slice(0, 3);
    this.dom.topGifters.innerHTML =
      '<div class="lb-title">🎁 TOP REGALOS</div>' +
      (rows.length ? rows.map((r, i) =>
        `<div class="lb-row"><span>${medal[i]} ${r.n}</span><b>${r.c}🪙</b></div>`
      ).join('') : '<div class="lb-empty">Envía regalos…</div>');
  }

  toggleAutofill() {
    this.autofill = !this.autofill;
    this.autofillBtn.textContent = '🎲 Relleno: ' + (this.autofill ? 'ON' : 'OFF');
    this.autofillBtn.classList.toggle('on', this.autofill);
  }

  // ---------- FASE: Batalla ----------
  startBattle() {
    if (this.phase !== 'RECRUIT') return;
    this.settings = loadSettings();
    this.phase = 'BATTLE';
    this.timer = this.settings.battleTime;
    this.sfx('battle');
    this.addShake(5, 0.3);
    this.setPanels();
  }

  endBattle(stats) {
    this.phase = 'RESULT';
    const A = this.world.countryA, B = this.world.countryB;
    let msg, winnerId = null;
    const aWins = stats.aliveA > 0 && stats.aliveB === 0;
    const bWins = stats.aliveB > 0 && stats.aliveA === 0;
    if (aWins || (!bWins && stats.hpA > stats.hpB)) {
      winnerId = A.id; msg = `${A.flag} ¡${A.name} GANA!`;
    } else if (bWins || stats.hpB > stats.hpA) {
      winnerId = B.id; msg = `${B.flag} ¡${B.name} GANA!`;
    } else { msg = '🤝 ¡EMPATE!'; }
    if (winnerId) this.addPoints(winnerId, this.settings.winPoints);
    else { this.addPoints(A.id, this.settings.drawPoints); this.addPoints(B.id, this.settings.drawPoints); }
    this.world.addConfetti(winnerId
      ? (winnerId === A.id ? this.world.colorA : this.world.colorB)
      : '#ffd34d');
    this.sfx('win');
    this.addShake(8, 0.5);
    this.setText('resultText', msg);
    this.renderRanking();
    this.setPanels();
  }

  addPoints(id, n) {
    this.ranking[id] = (this.ranking[id] || 0) + n;
    saveRanking(this.ranking);   // persiste entre sesiones
  }

  resetRanking() {
    this.ranking = {};
    saveRanking(this.ranking);
    this.renderRanking();
  }

  renderRanking() {
    if (!this.dom.ranking) return;
    const rows = Object.keys(this.ranking)
      .map(id => ({ c: COUNTRIES.find(c => c.id === id), pts: this.ranking[id] }))
      .sort((a, b) => b.pts - a.pts);
    this.dom.ranking.innerHTML =
      '<div class="rk-title">🏆 RANKING GLOBAL <button class="rk-reset" onclick="game.resetRanking()" title="Reiniciar ranking">♻️</button></div>' +
      (rows.length ? rows.map((r, i) =>
        `<div class="rk-row"><span>${i + 1}. ${r.c.flag} ${r.c.name}</span><b>${r.pts}</b></div>`
      ).join('') : '<div class="rk-empty">Aun sin batallas</div>');

    // Top paises (panel inferior derecho del frame)
    if (this.dom.topCountries) {
      const medal = ['🥇', '🥈', '🥉'];
      const top = rows.slice(0, 3);
      this.dom.topCountries.innerHTML =
        '<div class="lb-title">🏆 TOP PAÍSES</div>' +
        (top.length ? top.map((r, i) =>
          `<div class="lb-row"><span>${medal[i]} ${r.c.flag} ${r.c.name}</span><b>${r.pts}</b></div>`
        ).join('') : '<div class="lb-empty">Aún sin batallas</div>');
    }
  }

  resetRound() {
    this.world.reset();
    if (this.phase === 'BATTLE' || this.phase === 'RESULT') this.startRecruit();
  }

  nextRound() { this.round++; this.startVoting(); }

  setPanels() {
    this.dom.votingPanel.classList.toggle('hidden', this.phase !== 'VOTING');
    this.dom.recruitPanel.classList.toggle('hidden', !(this.phase === 'RECRUIT' || this.phase === 'BATTLE'));
    this.dom.resultPanel.classList.toggle('hidden', this.phase !== 'RESULT');
    this.setText('roundLabel', 'Ronda ' + this.round);
  }

  // ---------- Teclado ----------
  bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.phase === 'VOTING') this.chooseTop2();
        else if (this.phase === 'RECRUIT') this.startBattle();
        else if (this.phase === 'RESULT') this.nextRound();
        return;
      }
      // Teclas 1-6 = regalos del equipo A · ⇧+1-6 = equipo B
      const m = e.code.match(/^Digit([1-6])$/);
      if (m) {
        const g = giftByKey(+m[1] - 1, e.shiftKey ? 'B' : 'A');
        if (g) this.spawnGift(g.id);
      }
    });
  }

  // ---------- Bucle ----------
  // Se mueve con un Web Worker que "late" ~60 veces/seg. Los navegadores NO
  // pausan los timers de un Worker como sí pausan requestAnimationFrame cuando
  // la pestaña pasa a segundo plano. Así el juego SIGUE corriendo aunque
  // cambies de ventana/pestaña (clave para transmitir sin tener el juego al frente).
  startLoop() {
    this.last = performance.now();
    const tick = () => {
      const now = performance.now();
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.1) dt = 0.1;          // evita saltos enormes si hubo throttling
      if (this.mode === 'view') { this.viewerFrame(dt); return; }
      this.update(dt);
      this.render();
      if (this.mode === 'host') this.maybeSendState(now);
    };
    try {
      const src = 'var t=setInterval(function(){postMessage(0);},16);' +
        'onmessage=function(e){if(e.data==="stop"){clearInterval(t);}};';
      const blob = new Blob([src], { type: 'application/javascript' });
      this.loopWorker = new Worker(URL.createObjectURL(blob));
      this.loopWorker.onmessage = tick;
    } catch (e) {
      // Respaldo: si el navegador no permite Workers, usa setInterval normal
      setInterval(tick, 16);
    }
  }

  update(dt) {
    // Si hay un enfoque activo, se PAUSA todo el juego y solo corre el enfoque
    if (this.spotlight) { this.updateSpotlight(dt); this.updateHUD(); return; }

    if (this.shakeT > 0) this.shakeT -= dt;
    this.world.battleActive = (this.phase === 'BATTLE');
    this.world.update(dt);

    if (this.phase === 'VOTING') {
      this.timer -= dt;
      if (this.timer <= 0) this.chooseTop2();
    } else if (this.phase === 'RECRUIT') {
      this.timer -= dt;
      if (this.autofill) {
        this.autofillT -= dt;
        if (this.autofillT <= 0) {
          this.autofillT = 0.25;
          // El relleno automático NO dispara enfoques (es solo para probar batallas)
          this.spawnGift(this.weightedGift(), choice(FAKE_GIFTERS), false);
        }
      }
      if (this.timer <= 0) this.startBattle();
    } else if (this.phase === 'BATTLE') {
      this.timer -= dt;
      const s = this.world.getStats();
      if (s.aliveA === 0 || s.aliveB === 0 || this.timer <= 0) this.endBattle(s);
    }
    this.updateHUD();
  }

  weightedGift() {
    // regalos baratos más probables (como en un live real)
    const pool = ['rosa', 'tiktok', 'rosa', 'tiktok', 'mano', 'estrella',
      'helado', 'sombrero', 'perfume', 'guantes', 'galaxy', 'tormenta',
      'leongift', 'universo'];
    return choice(pool);
  }

  updateHUD() {
    const names = { VOTING: '🗳️ VOTACIÓN', RECRUIT: '🛡️ RECLUTAMIENTO', BATTLE: '⚔️ BATALLA', RESULT: '🏁 RESULTADO' };
    this.setText('phaseLabel', names[this.phase]);
    this.setText('timerLabel', (this.phase === 'RESULT') ? '' : '⏱ ' + Math.max(0, Math.ceil(this.timer)) + 's');
    const s = this.world.getStats();
    this.setText('aCount', s.aliveA);
    this.setText('bCount', s.aliveB);
    const tot = Math.max(1, s.powerA + s.powerB);
    if (this.dom.aBar) { this.dom.aBar.style.width = (s.powerA / tot * 100) + '%'; this.dom.aBar.style.background = this.world.colorA; }
    if (this.dom.bBar) { this.dom.bBar.style.width = (s.powerB / tot * 100) + '%'; this.dom.bBar.style.background = this.world.colorB; }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0e1118'; ctx.fillRect(0, 0, W, H);   // limpia (evita huecos por el shake)
    const sm = this.shakeT > 0 ? this.shakeMag * (this.shakeT / this.shakeDur) : 0;
    const sx = sm ? (Math.random() * 2 - 1) * sm : 0;
    const sy = sm ? (Math.random() * 2 - 1) * sm : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawBackground(ctx, this.world);
    drawFieldBanners(ctx, this.world);
    const us = this.world.units.slice().sort((a, b) => a.y - b.y);
    for (let i = 0; i < us.length; i++) if (!us[i].dead) drawUnit(ctx, us[i]);
    for (let i = 0; i < this.world.projectiles.length; i++) drawProjectile(ctx, this.world.projectiles[i]);
    for (let i = 0; i < this.world.particles.length; i++) drawParticle(ctx, this.world.particles[i]);
    this.drawNames(ctx, us);
    ctx.restore();
    if (this.spotlight) drawSpotlight(ctx, this.spotlight, this.world);   // el enfoque no se sacude
  }

  // Nombre del usuario sobre su personaje (en batallas enormes, solo los recientes)
  drawNames(ctx, us) {
    const showAll = us.length <= 150;
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.lineWidth = 3; ctx.lineJoin = 'round';
    for (let i = 0; i < us.length; i++) {
      const u = us[i];
      if (u.dead || !u.gifter) continue;
      if (!showAll && u.nameT <= 0) continue;
      let nm = u.gifter;
      if (nm.length > 12) nm = nm.slice(0, 11) + '…';
      const yy = u.y - u.t.size - (u.hp < u.maxHp ? 8 : 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(nm, u.x, yy);
      ctx.fillStyle = '#fff'; ctx.fillText(nm, u.x, yy);
    }
    ctx.textAlign = 'left';
  }

  // Reproduce un efecto local y, si es host, lo envía al espejo
  sfx(name) {
    if (typeof SFX !== 'undefined' && SFX[name]) SFX[name]();
    if (this.mode === 'host' && window.TikTok && TikTok.event) TikTok.event({ type: 'sfx', name });
  }

  // ====================== HOST: emitir el estado ======================
  maybeSendState(now) {
    if (now - this._lastState < 66) return;   // ~15 veces/seg
    this._lastState = now;
    if (window.TikTok && TikTok.event) TikTok.event(this.serializeState());
  }

  serializeState() {
    const w = this.world, s = w.getStats();
    const u = [];
    for (let i = 0; i < w.units.length; i++) {
      const x = w.units[i];
      if (x.dead) continue;
      u.push([Math.round(x.x), Math.round(x.y), UNIT_ORDER.indexOf(x.typeId),
        x.team === 'A' ? 0 : 1, Math.max(0, Math.min(255, Math.round(x.hp / x.maxHp * 255))),
        x.dir > 0 ? 1 : 0, (x.nameT > 0 && x.gifter) ? x.gifter : 0]);
    }
    const pr = [];
    for (let i = 0; i < w.projectiles.length; i++) {
      const p = w.projectiles[i];
      pr.push([Math.round(p.x), Math.round(p.y), Math.round((p.angle || 0) * 100) / 100, p.splash > 0 ? 1 : 0]);
    }
    let sp = 0;
    if (this.spotlight) {
      const sl = this.spotlight;
      sp = { g: sl.gift, nm: sl.name, co: sl.coin, gf: sl.gifter, t: Math.round(sl.t * 100) / 100,
        du: sl.dur, sz: sl.size, in: sl.intensity, ut: UNIT_ORDER.indexOf(sl.unit.typeId),
        col: sl.unit.col, sec: sl.unit.colSec };
    }
    const rk = Object.keys(this.ranking).map(id => [id, this.ranking[id]]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const gf = Object.keys(this.gifters).map(n => [n, this.gifters[n]]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const cn = this.candidates.map(c => [c.c.id, c.votes, this.ranking[c.c.id] || 0]);
    return {
      type: 'state', ph: this.phase, rd: this.round, tm: Math.max(0, Math.ceil(this.timer)),
      aId: w.countryA ? w.countryA.id : null, bId: w.countryB ? w.countryB.id : null,
      colA: w.colorA, colB: w.colorB, na: s.aliveA, nb: s.aliveB, pa: s.powerA, pb: s.powerB,
      u, pr, sp, rk, gf, cn,
      res: this.phase === 'RESULT' && this.dom.resultText ? this.dom.resultText.textContent : '',
    };
  }

  // ====================== ESPEJO: recibir y dibujar ======================
  setupViewer() {
    document.body.classList.add('viewer');
    const hint = document.getElementById('viewerStart');
    if (hint) hint.classList.remove('hidden');
    const startAll = () => {
      if (typeof SFX !== 'undefined') { SFX.init(); SFX.resume(); SFX.music.start(); }
      const st = document.getElementById('stage');
      if (st && st.requestFullscreen) st.requestFullscreen().catch(() => {});
      if (hint) hint.classList.add('hidden');
    };
    window.addEventListener('pointerdown', startAll, { once: true });
    this.setText('phaseLabel', 'Esperando…');
  }

  applySnapshot(snap) {
    this.snap = snap;
    if (snap.ph === 'RESULT' && this._prevPh !== 'RESULT') this.world.addConfetti('#ffd34d');
    this._prevPh = snap.ph;
    this.viewerApplyHUD(snap);
  }

  viewerFrame(dt) {
    // anima el confeti local
    const ps = this.world.particles;
    for (let i = 0; i < ps.length; i++) { const p = ps[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; }
    this.world.particles = ps.filter(p => p.life > 0);
    this.bob += dt * 9;
    this.renderSnapshot();
  }

  viewerApplyHUD(snap) {
    const A = COUNTRIES.find(c => c.id === snap.aId), B = COUNTRIES.find(c => c.id === snap.bId);
    const names = { VOTING: '🗳️ VOTACIÓN', RECRUIT: '🛡️ RECLUTAMIENTO', BATTLE: '⚔️ BATALLA', RESULT: '🏁 RESULTADO' };
    this.setText('phaseLabel', names[snap.ph] || snap.ph);
    this.setText('timerLabel', snap.ph === 'RESULT' ? '' : '⏱ ' + snap.tm + 's');
    this.setText('roundLabel', 'Ronda ' + snap.rd);
    if (A) { this.setText('aFlag', A.flag); this.setText('aName', A.name); if (this.dom.aName) this.dom.aName.style.color = snap.colA; }
    if (B) { this.setText('bFlag', B.flag); this.setText('bName', B.name); if (this.dom.bName) this.dom.bName.style.color = snap.colB; }
    this.setText('aCount', snap.na); this.setText('bCount', snap.nb);
    const tot = Math.max(1, snap.pa + snap.pb);
    if (this.dom.aBar) { this.dom.aBar.style.width = (snap.pa / tot * 100) + '%'; this.dom.aBar.style.background = snap.colA; }
    if (this.dom.bBar) { this.dom.bBar.style.width = (snap.pb / tot * 100) + '%'; this.dom.bBar.style.background = snap.colB; }
    if (this.dom.aGifts) this.dom.aGifts.textContent = '🎁 ' + GIFTS_A.map(g => g.icon).join(' ');
    if (this.dom.bGifts) this.dom.bGifts.textContent = '🎁 ' + GIFTS_B.map(g => g.icon).join(' ');
    this.dom.votingPanel.classList.toggle('hidden', snap.ph !== 'VOTING');
    this.dom.resultPanel.classList.toggle('hidden', snap.ph !== 'RESULT');
    if (this.dom.recruitPanel) this.dom.recruitPanel.classList.add('hidden');
    if (snap.ph === 'RESULT') this.setText('resultText', snap.res || '¡Fin!');
    if (snap.ph === 'VOTING') this.viewerRenderCandidates(snap.cn);
    this.viewerLeaderboards(snap.gf, snap.rk);
  }

  viewerRenderCandidates(cn) {
    if (!this.dom.candidates) return;
    const n = cn.length;
    const wpx = n <= 4 ? 124 : n <= 6 ? 104 : n <= 8 ? 92 : 82;
    const fs = n <= 4 ? 34 : n <= 6 ? 28 : n <= 8 ? 24 : 21;
    this.dom.candidates.innerHTML = '';
    cn.forEach((c, i) => {
      const country = COUNTRIES.find(x => x.id === c[0]);
      if (!country) return;
      const vg = VOTE_GIFTS[i % VOTE_GIFTS.length];
      const el = document.createElement('div');
      el.className = 'cand'; el.style.width = wpx + 'px';
      el.innerHTML = `<div class="cand-flag" style="font-size:${fs}px">${country.flag}</div>
        <div class="cand-name">${country.name}</div>
        <div class="cand-wins">🏆 ${c[2]}</div>
        <div class="cand-gift">${vg.icon} +${VOTE_GIFT_POINTS}</div>
        <div class="cand-votes">${c[1]} pts</div>`;
      this.dom.candidates.appendChild(el);
    });
  }

  viewerLeaderboards(gf, rk) {
    const medal = ['🥇', '🥈', '🥉'];
    if (this.dom.topGifters) {
      this.dom.topGifters.innerHTML = '<div class="lb-title">🎁 TOP REGALOS</div>' +
        (gf.length ? gf.map((r, i) => `<div class="lb-row"><span>${medal[i]} ${r[0]}</span><b>${r[1]}🪙</b></div>`).join('') : '<div class="lb-empty">Envía regalos…</div>');
    }
    if (this.dom.topCountries) {
      this.dom.topCountries.innerHTML = '<div class="lb-title">🏆 TOP PAÍSES</div>' +
        (rk.length ? rk.map((r, i) => { const c = COUNTRIES.find(x => x.id === r[0]); return `<div class="lb-row"><span>${medal[i]} ${c ? c.flag + ' ' + c.name : r[0]}</span><b>${r[1]}</b></div>`; }).join('') : '<div class="lb-empty">Aún sin batallas</div>');
    }
  }

  renderSnapshot() {
    const ctx = this.ctx, snap = this.snap, w = this.world;
    ctx.fillStyle = '#0e1118'; ctx.fillRect(0, 0, W, H);
    if (!snap) {
      ctx.fillStyle = '#9aa6c4'; ctx.font = '22px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Esperando al juego…', W / 2, H / 2); ctx.textAlign = 'left'; return;
    }
    w.colorA = snap.colA; w.colorB = snap.colB;
    w.countryA = COUNTRIES.find(c => c.id === snap.aId) || null;
    w.countryB = COUNTRIES.find(c => c.id === snap.bId) || null;
    drawBackground(ctx, w); drawFieldBanners(ctx, w);
    const secA = w.countryA ? w.countryA.secondary : '#222';
    const secB = w.countryB ? w.countryB.secondary : '#222';
    const us = snap.u.map(a => {
      const id = UNIT_ORDER[a[2]]; const t = UNIT_TYPES[id];
      return { x: a[0], y: a[1], typeId: id, t, team: a[3] ? 'B' : 'A',
        col: a[3] ? snap.colB : snap.colA, colSec: a[3] ? secB : secA,
        hp: a[4] / 255 * t.hp, maxHp: t.hp, dir: a[5] ? 1 : -1,
        gifter: a[6] || null, nameT: a[6] ? 1 : 0, flash: 0, lunge: 0,
        moving: snap.ph === 'BATTLE', bob: this.bob };
    });
    us.sort((p, q) => p.y - q.y);
    for (let i = 0; i < us.length; i++) drawUnit(ctx, us[i]);
    for (let i = 0; i < snap.pr.length; i++) { const p = snap.pr[i]; drawProjectile(ctx, { x: p[0], y: p[1], angle: p[2], splash: p[3], color: '#e2552f' }); }
    for (let i = 0; i < w.particles.length; i++) drawParticle(ctx, w.particles[i]);
    if (snap.sp) {
      const sp = snap.sp; const id = UNIT_ORDER[sp.ut];
      const fu = { typeId: id, t: UNIT_TYPES[id], col: sp.col, colSec: sp.sec, bob: this.bob };
      drawSpotlight(ctx, { unit: fu, gifter: sp.gf, gift: sp.g, name: sp.nm, coin: sp.co, t: sp.t, dur: sp.du, size: sp.sz, intensity: sp.in }, w);
    }
    this.drawNames(ctx, us);
  }
}
