// ============================================================
//  control.js  -  Control remoto manual. Envía regalos/likes
//  al servidor, que los reenvía al juego (en el celular u otra
//  pantalla). Útil para transmitir desde el celular y manejar
//  los regalos a mano desde la laptop.
// ============================================================

(function () {
  // WebSocket en el mismo origen que la página (https->wss, http->ws)
  const WS_URL = location.host
    ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)
    : 'ws://localhost:8080';
  let ws = null, rt = null, flashT = null;

  function setStatus(t, c) {
    const e = document.getElementById('cStatus');
    if (e) { e.textContent = t; e.className = 'cstat ' + (c || ''); }
  }
  function connect() {
    try { ws = new WebSocket(WS_URL); }
    catch (e) { setStatus('🔴 Inicia el servidor (node server.js)', 'off'); return; }
    ws.onopen = () => setStatus('🟢 Conectado al servidor', 'on');
    ws.onclose = () => { setStatus('🔴 Servidor apagado', 'off'); clearTimeout(rt); rt = setTimeout(connect, 3000); };
    ws.onerror = () => {};
    ws.onmessage = () => {};
  }
  function wsSend(o) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); flash(); return true; }
    setStatus('🔴 Inicia el servidor (node server.js)', 'off');
    return false;
  }
  function flash() {
    const b = document.getElementById('sent');
    if (!b) return;
    b.style.opacity = '1';
    clearTimeout(flashT);
    flashT = setTimeout(() => (b.style.opacity = '0'), 400);
  }
  function gifter() {
    const v = (document.getElementById('cUser') || {}).value;
    return (v && v.trim()) ? ('@' + v.trim().replace(/^@/, '')) : '🎮 Host';
  }

  function sendGift(g) {
    wsSend({ action: 'event', data: { type: 'gift', name: giftTikTok(g), diamond: giftCoin(g), repeat: 1, user: gifter() } });
  }
  function sendLike() {
    wsSend({ action: 'event', data: { type: 'like', count: 100, user: gifter() } });
  }

  function build() {
    const mk = (host, gifts) => {
      gifts.forEach(g => {
        const b = document.createElement('button');
        b.className = 'gbtn t' + g.bracket;
        b.innerHTML = `<span class="gi">${g.icon}</span><span class="gn">${g.name}</span><span class="gc">${giftCoin(g)}🪙</span>`;
        b.onclick = () => sendGift(g);
        host.appendChild(b);
      });
    };
    mk(document.getElementById('colA'), GIFTS_A);
    mk(document.getElementById('colB'), GIFTS_B);
    document.getElementById('likeBtn').onclick = sendLike;
  }

  window.addEventListener('load', () => { build(); connect(); });
})();
