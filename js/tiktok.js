// ============================================================
//  tiktok.js  -  Cliente WebSocket. Conecta el juego al
//  servidor puente y traduce los eventos reales de TikTok a
//  llamadas del juego:
//    regalo    -> game.spawnGift  (o voto si está en votación)
//    like      -> game.addLikes
//    comentario-> game.addVoteByComment
// ============================================================

(function () {
  // WebSocket en el MISMO origen que la página:
  //  - desplegado (https) -> wss://tu-app.onrender.com
  //  - local (http)       -> ws://localhost:8080
  //  - archivo (file://)  -> ws://localhost:8080
  const WS_URL = location.host
    ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)
    : 'ws://localhost:8080';
  let ws = null, reconnectT = null;

  function setStatus(txt, cls) {
    const e = document.getElementById('tkStatus');
    if (e) { e.textContent = txt; e.className = 'tk-status ' + (cls || ''); }
  }

  // Busca nuestro regalo a partir del nombre real de TikTok
  function findGift(name) {
    if (!name) return null;
    const n = name.toLowerCase().trim();
    return GIFTS.find(g => giftTikTok(g).toLowerCase() === n)
      || GIFTS.find(g => g.name.toLowerCase() === n);
  }

  function handle(m) {
    if (m.type === 'hello' || m.type === 'status') {
      if (m.connected) setStatus('🟢 En vivo: @' + (m.user || '') + (m.viewers ? ' · ' + m.viewers + '👀' : ''), 'on');
      else if (m.error) {
        const msg = /user_not_found|room_id|LIVE has ended|isn'?t online|not.*online/i.test(m.error)
          ? 'Ese @usuario no existe o no está en vivo ahora (usa 🧪 para probar)'
          : m.error;
        setStatus('🔴 ' + msg, 'off');
      }
      else if (m.ended) setStatus('⚫ El LIVE terminó', 'off');
      else setStatus('🟡 Servidor listo — pulsa Conectar', '');
      return;
    }
    if (!window.game) return;

    if (m.type === 'gift') {
      // Durante la votación, el regalo cuenta como voto del país
      if (game.phase === 'VOTING') { game.voteByGift(m.name); return; }
      const g = findGift(m.name);
      if (!g) { console.log('[TikTok] regalo sin mapear:', m.name, '(' + (m.diamond || '?') + '💎)'); return; }
      const rep = Math.min(m.repeat || 1, 30);   // tope por combo
      const user = '@' + (m.user || 'anon');
      const realCoin = m.diamond || 0;           // costo REAL del regalo en TikTok
      for (let i = 0; i < rep; i++) game.spawnGift(g.id, user, true, realCoin);
    } else if (m.type === 'like') {
      game.addLikes(m.count || 1);
    } else if (m.type === 'chat') {
      game.addVoteByComment(m.comment || '');
    }
  }

  function connect() {
    try { ws = new WebSocket(WS_URL); }
    catch (e) { setStatus('🔴 Inicia el servidor (node server.js)', 'off'); return; }

    ws.onopen = () => setStatus('🟡 Servidor listo — pulsa Conectar', '');
    ws.onmessage = e => { try { handle(JSON.parse(e.data)); } catch (x) {} };
    ws.onclose = () => {
      setStatus('🔴 Servidor apagado (node server.js)', 'off');
      clearTimeout(reconnectT);
      reconnectT = setTimeout(connect, 3000);   // reintenta solo
    };
    ws.onerror = () => {};
  }

  function send(obj) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
    setStatus('🔴 Inicia el servidor: node server.js', 'off');
    return false;
  }

  // API global para los botones de la interfaz
  window.TikTok = {
    connectUser(u) { send({ action: 'connect', username: u }); },
    sim(kind) { send({ action: 'sim', kind }); },
  };

  window.addEventListener('load', () => {
    connect();
    const btn = document.getElementById('tkConnect');
    const inp = document.getElementById('tkUser');
    if (btn && inp) {
      btn.onclick = () => window.TikTok.connectUser(inp.value);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.onclick(); });
    }
  });
})();
