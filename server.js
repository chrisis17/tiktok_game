// ============================================================
//  server.js  -  Sirve el juego + puente de eventos (WebSocket)
//  en UN SOLO puerto. Funciona local (localhost:8080) y
//  desplegado (Render/Railway usan process.env.PORT).
//
//  Local:  npm install  &&  node server.js   -> http://localhost:8080
//  Nube:   se despliega tal cual (start: node server.js)
// ============================================================

const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Librería de TikTok (opcional: para leer regalos reales de un live)
let TLC = null;
try { TLC = require('tiktok-live-connector'); } catch (e) { /* sin conector: solo modo manual */ }
const ConnClass = TLC && (TLC.WebcastPushConnection || TLC.TikTokLiveConnection || TLC.default);

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

let tk = null, currentUser = null, connected = false;

// ---------------- Servidor web (archivos del juego) ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const httpServer = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/') url = '/index.html';
  const filePath = path.join(ROOT, path.normalize(url));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---------------- WebSocket en el MISMO puerto ----------------
const wss = new WebSocketServer({ server: httpServer });

function broadcast(obj) {
  const s = JSON.stringify(obj);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(s); });
}

function disconnectCurrent() {
  if (tk) { try { tk.disconnect(); } catch (e) {} tk = null; }
  connected = false;
}

function connectTo(username) {
  username = String(username || '').replace(/^@/, '').trim();
  if (!username) return;
  if (!ConnClass) { broadcast({ type: 'status', connected: false, user: username, error: 'Conector TikTok no disponible (usa el control manual)' }); return; }
  disconnectCurrent();
  currentUser = username;
  console.log('→ Conectando a @' + username + ' ...');
  try { tk = new ConnClass(username); }
  catch (e) { broadcast({ type: 'status', connected: false, user: username, error: String(e.message || e) }); return; }

  tk.connect().then(state => {
    const viewers = (state && (state.viewerCount || (state.roomInfo && state.roomInfo.viewerCount))) || 0;
    console.log('✅ Conectado a @' + username + (viewers ? ('  (' + viewers + ' espectadores)') : ''));
    connected = true;
    broadcast({ type: 'status', connected: true, user: username, viewers });
  }).catch(err => {
    console.error('❌ Error al conectar:', err.message || err);
    connected = false; tk = null;
    broadcast({ type: 'status', connected: false, user: username, error: String(err.message || err) });
  });

  tk.on('gift', d => {
    if (d.giftType === 1 && !d.repeatEnd) return;
    broadcast({ type: 'gift', name: d.giftName, giftId: d.giftId, diamond: d.diamondCount, repeat: d.repeatCount || 1, user: d.uniqueId || d.nickname || 'anon' });
  });
  tk.on('like', d => broadcast({ type: 'like', count: d.likeCount || 1, total: d.totalLikeCount, user: d.uniqueId }));
  tk.on('chat', d => broadcast({ type: 'chat', comment: d.comment, user: d.uniqueId || d.nickname }));
  tk.on('streamEnd', () => { connected = false; broadcast({ type: 'status', connected: false, user: username, ended: true }); });
  tk.on('disconnected', () => { connected = false; broadcast({ type: 'status', connected: false, user: username }); });
  tk.on('error', err => console.error('⚠️', err && (err.message || err)));
}

// Simulador de eventos (probar sin estar en vivo)
function simulate(kind) {
  const users = ['@maria_07', '@juancho', '@kevincito', '@laflaca', '@dani.rose', '@elpro_99'];
  const u = users[Math.floor(Math.random() * users.length)];
  if (kind === 'gift') {
    const COST = { Rose: 1, TikTok: 1, 'Finger Heart': 5, Perfume: 99, Galaxy: 500, Lion: 29999, Universe: 34999 };
    const names = Object.keys(COST);
    const name = names[Math.floor(Math.random() * names.length)];
    broadcast({ type: 'gift', name, diamond: COST[name], repeat: 1, user: u });
  } else if (kind === 'like') {
    broadcast({ type: 'like', count: 50, user: u });
  } else if (kind === 'chat') {
    const c = ['vamos peru', 'arriba chile', 'mexico', 'argentina campeon', 'bolivia'];
    broadcast({ type: 'chat', comment: c[Math.floor(Math.random() * c.length)], user: u });
  }
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'hello', connected: connected, user: connected ? currentUser : null }));
  ws.on('message', msg => {
    try {
      const m = JSON.parse(msg);
      if (m.action === 'connect') connectTo(m.username);
      else if (m.action === 'sim') simulate(m.kind);
      else if (m.action === 'event' && m.data) broadcast(m.data);   // control remoto manual
    } catch (e) {}
  });
});

// ---------------- Arranque ----------------
function lanIP() {
  const ifs = os.networkInterfaces();
  const out = [];
  for (const name in ifs) {
    if (/tailscale|wsl|vethernet|loopback|virtual|docker|vmware|hyper-v/i.test(name)) continue;
    for (const a of ifs[name]) {
      const fam = a.family;
      if ((fam !== 'IPv4' && fam !== 4) || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue;
      out.push(a.address);
    }
  }
  return out[0] || 'localhost';
}

httpServer.on('error', err => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('\n⚠️  El puerto ' + PORT + ' ya está en uso. Cierra el otro servidor y reintenta.\n');
  } else { console.error('Error del servidor:', err && (err.message || err)); }
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log('========================================================');
  console.log('  Guerra de Países — servidor listo (puerto ' + PORT + ')');
  console.log('  Local:           http://localhost:' + PORT);
  console.log('  En tu red:       http://' + lanIP() + ':' + PORT);
  console.log('  Control remoto:  http://localhost:' + PORT + '/control.html');
  console.log('========================================================');
});
