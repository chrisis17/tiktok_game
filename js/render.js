// ============================================================
//  render.js  -  Dibujo pixel-art (VERTICAL 9:16).
//  La batalla se dibuja SOLO en la arena (2/3 de arriba).
//  El tercio de abajo lo ocupan el chat y los marcadores (DOM).
// ============================================================

function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function rgba(hex, a) { const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }

function orect(ctx, x, y, w, h, col, line) {
  ctx.fillStyle = line || 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';   // brillo superior
  ctx.fillRect(x, y, w, Math.max(1, h * 0.14));
}

// ---------- Fondo + arena ----------
function drawBackground(ctx, world) {
  const w = world.w, h = world.h, b = world.bounds;
  px(ctx, 0, 0, w, h, '#0e1118');

  const ax = b.x0 - 8, ay = b.y0 - 18;
  const aw = (b.x1 - b.x0) + 16, ah = (b.y1 - b.y0) + 30;
  const mid = (b.y0 + b.y1) / 2;

  // pasto con degradado
  const g = ctx.createLinearGradient(0, ay, 0, ay + ah);
  g.addColorStop(0, '#43864a'); g.addColorStop(0.5, '#367239'); g.addColorStop(1, '#2c6531');
  ctx.fillStyle = g; ctx.fillRect(ax, ay, aw, ah);

  // franjas de cancha
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let i = ay; i < ay + ah; i += 52) ctx.fillRect(ax, i, aw, 26);

  // tintes de zona (arriba B, abajo A)
  ctx.globalAlpha = 0.15;
  px(ctx, ax, ay, aw, mid - ay, world.colorB);
  px(ctx, ax, mid, aw, ay + ah - mid, world.colorA);
  ctx.globalAlpha = 1;

  // linea central (zona de choque) con resplandor
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(ax, mid - 10, aw, 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
  ctx.setLineDash([12, 9]);
  ctx.beginPath(); ctx.moveTo(ax + 4, mid); ctx.lineTo(ax + aw - 4, mid); ctx.stroke();
  ctx.setLineDash([]);

  // borde de la arena
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3;
  ctx.strokeRect(ax, ay, aw, ah);
  // vineta interior
  const vg = ctx.createLinearGradient(0, ay, 0, ay + 50);
  vg.addColorStop(0, 'rgba(0,0,0,0.30)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vg; ctx.fillRect(ax, ay, aw, 50);
}

function drawFieldBanners(ctx, world) {
  if (!world.countryA || !world.countryB) return;
  const b = world.bounds, mid = (b.y0 + b.y1) / 2, cx = (b.x0 + b.x1) / 2;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.font = '120px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(world.countryB.flag, cx, (b.y0 + mid) / 2);
  ctx.fillText(world.countryA.flag, cx, (mid + b.y1) / 2);
  ctx.restore();
}

// ---------- Una unidad ----------
function drawUnit(ctx, u) {
  let ox = 0, oy = 0;
  if (u.lunge > 0) { const k = u.lunge / 0.16; ox = u.lungeX * 7 * k; oy = u.lungeY * 7 * k; }
  else if (u.moving) { oy = -Math.abs(Math.sin(u.bob)) * 2.2; }

  const x = Math.round(u.x + ox);
  const y = Math.round(u.y + oy);
  const s = u.t.size;
  const dir = u.dir;
  const col = u.flash > 0 ? '#ffffff' : u.col;
  const ac = u.t.color;
  const sec = u.colSec;

  // aura para unidades epicas (leon / dragon)
  if (u.typeId === 'leon' || u.typeId === 'dragon') {
    const r = s * 1.4;
    const grd = ctx.createRadialGradient(x, y - s * 0.4, 2, x, y - s * 0.4, r);
    grd.addColorStop(0, rgba(ac, 0.4)); grd.addColorStop(1, rgba(ac, 0));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y - s * 0.4, r, 0, Math.PI * 2); ctx.fill();
  }

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(Math.round(u.x), Math.round(u.y) + s * 0.45, s * 0.5, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (u.typeId) {
    case 'caballeria': drawCavalry(ctx, x, y, s, dir, col, ac, sec); break;
    case 'gigante': drawGiant(ctx, x, y, s, dir, col, ac, sec); break;
    case 'leon': drawLion(ctx, x, y, s, dir, col, ac, sec); break;
    case 'dragon': drawDragon(ctx, x, y, s, dir, col, ac, sec, u.bob); break;
    default: drawHumanoid(ctx, x, y, s, dir, col, ac, sec, u.typeId);
  }

  if (u.hp < u.maxHp) {
    const bw = Math.max(12, s);
    const p = clamp(u.hp / u.maxHp, 0, 1);
    const big = (u.typeId === 'gigante' || u.typeId === 'leon' || u.typeId === 'dragon');
    const by = y - s - (big ? s * 0.6 : 5);
    px(ctx, x - bw / 2 - 1, by - 1, bw + 2, 4.5, '#000');
    px(ctx, x - bw / 2, by, bw * p, 2.5,
      p > 0.5 ? '#46d246' : (p > 0.25 ? '#e6c038' : '#e64646'));
  }
}

function drawHumanoid(ctx, x, y, s, dir, col, ac, sec, type) {
  const hw = Math.max(3, Math.round(s * 0.4));
  const bh = Math.round(s * 0.7);
  const topY = y - bh;
  const hr = Math.max(2, Math.round(s * 0.3));

  px(ctx, x - hw * 0.6, y - 2, Math.max(2, hw * 0.5), s * 0.32, '#262626');
  px(ctx, x + hw * 0.1, y - 2, Math.max(2, hw * 0.5), s * 0.32, '#262626');

  orect(ctx, x - hw, topY, hw * 2, bh, col);
  px(ctx, x - hw, topY + bh * 0.4, hw * 2, Math.max(2, bh * 0.22), ac);

  orect(ctx, x - hr, topY - hr * 2, hr * 2, hr * 2, '#e8c39e');
  px(ctx, x - hr, topY - hr * 2, hr * 2, Math.max(2, hr * 0.85), sec);
  px(ctx, x - 1, topY - hr * 2.8, 2, hr, ac);

  const side = x + dir * (hw + 1);
  if (type === 'soldado') {
    px(ctx, side, topY - hr * 2, dir * 2, bh + hr, '#dcdcdc');
    px(ctx, side - dir, topY - hr * 2, dir * 4, 3, '#aaa');
  } else if (type === 'lancero') {
    px(ctx, side, topY - hr * 3, dir * 2, bh + hr * 4, '#caa472');
    px(ctx, side + (dir > 0 ? 0 : -2), topY - hr * 3, dir * 2, hr * 1.5, '#e8e8e8');
  } else if (type === 'arquero') {
    ctx.strokeStyle = ac; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(side, topY + bh * 0.2, hr * 2.2, dir > 0 ? -1 : 2, dir > 0 ? 1 : 4);
    ctx.stroke();
  } else if (type === 'ballestero') {
    px(ctx, x - hw, topY + bh * 0.25, hw * 2 + dir * 6, 3, ac);
    px(ctx, side, topY + bh * 0.1, dir * 2, 8, '#6b4423');
  } else if (type === 'escudero') {
    orect(ctx, side, topY - 2, dir * 5, bh + 2, ac);
  } else if (type === 'sanador') {
    px(ctx, x - hr * 0.4, topY + bh * 0.2, hr * 0.8, hr * 1.6, '#e23b3b');
    px(ctx, x - hr * 0.9, topY + bh * 0.45, hr * 1.8, hr * 0.8, '#e23b3b');
  } else if (type === 'mago') {
    px(ctx, x - hr - 1, topY - hr * 3.4, hr * 2 + 2, hr * 1.6, ac);
    px(ctx, side, topY - hr * 2, dir * 2, bh + hr * 2, '#8a5a2b');
    ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(side + dir, topY - hr * 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(side + dir, topY - hr * 2, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'berserker') {
    px(ctx, side, topY - hr, dir * 3, 6, ac);
    px(ctx, x - dir * (hw + 3), topY - hr, dir * 3, 6, ac);
  }
}

function drawCavalry(ctx, x, y, s, dir, col, ac, sec) {
  const bw = s * 0.95, bh = s * 0.5;
  orect(ctx, x - bw / 2, y - bh, bw, bh, '#5b3b22');
  px(ctx, x - bw / 2, y - 2, 3, s * 0.35, '#3a2615');
  px(ctx, x + bw / 2 - 3, y - 2, 3, s * 0.35, '#3a2615');
  px(ctx, x + dir * (bw / 2 - 2), y - bh - s * 0.2, dir * 6, s * 0.3, '#5b3b22');
  const ry = y - bh;
  orect(ctx, x - 3, ry - s * 0.5, 6, s * 0.5, col);
  px(ctx, x - 3, ry - s * 0.3, 6, 3, ac);
  orect(ctx, x - 3, ry - s * 0.78, 6, 6, '#e8c39e');
  px(ctx, x - 3, ry - s * 0.78, 6, 3, sec);
  px(ctx, x + dir * 4, ry - s * 0.85, dir * 2, s * 0.95, '#caa472');
}

function drawGiant(ctx, x, y, s, dir, col, ac, sec) {
  const hw = s * 0.45, bh = s * 0.85;
  const topY = y - bh;
  px(ctx, x - hw * 0.7, y - 4, hw * 0.6, s * 0.3, '#3a2a1a');
  px(ctx, x + hw * 0.1, y - 4, hw * 0.6, s * 0.3, '#3a2a1a');
  orect(ctx, x - hw, topY, hw * 2, bh, col);
  px(ctx, x - hw, topY + bh * 0.45, hw * 2, bh * 0.18, ac);
  const hr = s * 0.28;
  orect(ctx, x - hr, topY - hr * 2, hr * 2, hr * 2, '#caa06a');
  px(ctx, x - hr, topY - hr * 2, hr * 2, hr * 0.8, sec);
  px(ctx, x - hr * 0.5, topY - hr * 1.2, 2, 2, '#000');
  px(ctx, x + hr * 0.2, topY - hr * 1.2, 2, 2, '#000');
  orect(ctx, x + dir * hw, topY - hr, dir * 4, bh, '#6b4423');
  px(ctx, x + dir * (hw + 1), topY - hr * 1.6, dir * 9, 11, '#7a4a26');
}

function drawLion(ctx, x, y, s, dir, col, ac, sec) {
  const bw = s * 1.05, bh = s * 0.5;
  const topY = y - bh;
  for (const fx of [-bw * 0.4, -bw * 0.15, bw * 0.15, bw * 0.4]) {
    px(ctx, x + fx - 2, y - 3, 4, s * 0.34, '#9c7322');
  }
  orect(ctx, x - bw / 2, topY, bw, bh, col);
  px(ctx, x - bw / 2, topY, bw, bh * 0.3, ac);
  px(ctx, x - dir * (bw / 2), topY, -dir * 5, 3, '#9c7322');
  px(ctx, x - dir * (bw / 2 + 4), topY - 4, 4, 5, ac);
  const hx = x + dir * (bw / 2 - 2);
  ctx.fillStyle = ac;
  ctx.beginPath(); ctx.arc(hx, topY - 2, s * 0.34, 0, Math.PI * 2); ctx.fill();
  orect(ctx, hx - s * 0.18, topY - s * 0.18, s * 0.36, s * 0.34, '#e6b85c');
  px(ctx, hx + dir * 2, topY - 2, 2, 2, '#000');
  px(ctx, hx + dir * s * 0.2, topY + s * 0.06, dir * 3, 2, '#3a2a1a');
}

function drawDragon(ctx, x, y, s, dir, col, ac, sec, bob) {
  const flap = Math.sin(bob) * s * 0.18;
  const bw = s * 0.7, bh = s * 0.55;
  const topY = y - bh - 4;
  ctx.fillStyle = col;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, topY + 2);
    ctx.lineTo(x + sgn * s * 0.9, topY - s * 0.3 - flap);
    ctx.lineTo(x + sgn * s * 0.5, topY + s * 0.35);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = ac; ctx.globalAlpha = 0.5;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, topY + 4);
    ctx.lineTo(x + sgn * s * 0.7, topY - s * 0.1 - flap);
    ctx.lineTo(x + sgn * s * 0.45, topY + s * 0.3);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  px(ctx, x - dir * bw * 0.5, topY + bh * 0.4, -dir * s * 0.6, 4, col);
  px(ctx, x - dir * (bw * 0.5 + s * 0.55), topY + bh * 0.4 - 3, 5, 8, ac);
  orect(ctx, x - bw / 2, topY, bw, bh, col);
  px(ctx, x - bw / 2, topY, bw, bh * 0.32, ac);
  const hx = x + dir * (bw / 2 + s * 0.18);
  px(ctx, x + dir * bw * 0.3, topY - s * 0.18, dir * s * 0.3, 5, col);
  orect(ctx, hx - s * 0.16, topY - s * 0.28, s * 0.34, s * 0.26, col);
  px(ctx, hx - 2, topY - s * 0.42, 2, s * 0.16, ac);
  px(ctx, hx + 2, topY - s * 0.42, 2, s * 0.16, ac);
  px(ctx, hx + dir * 3, topY - s * 0.2, 2, 2, '#ffec5c');
}

// ---------- Proyectiles ----------
function drawProjectile(ctx, p) {
  if (p.splash > 0) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  px(ctx, -5, -1, 8, 2, '#caa472');
  px(ctx, 3, -1, 3, 2, '#e8e8e8');
  ctx.restore();
}

// ---------- Particulas ----------
function drawParticle(ctx, pa) {
  ctx.globalAlpha = clamp(pa.life / pa.max, 0, 1);
  px(ctx, pa.x - pa.size / 2, pa.y - pa.size / 2, pa.size, pa.size, pa.color);
  ctx.globalAlpha = 1;
}

// ---------- Unidad a tamano grande (para el spotlight) ----------
function drawUnitBig(ctx, u, x, y, size, phase) {
  const dir = 1, col = u.col, ac = u.t.color, sec = u.colSec;
  switch (u.typeId) {
    case 'caballeria': drawCavalry(ctx, x, y, size, dir, col, ac, sec); break;
    case 'gigante': drawGiant(ctx, x, y, size, dir, col, ac, sec); break;
    case 'leon': drawLion(ctx, x, y, size, dir, col, ac, sec); break;
    case 'dragon': drawDragon(ctx, x, y, size, dir, col, ac, sec, phase); break;
    default: drawHumanoid(ctx, x, y, size, dir, col, ac, sec, u.typeId);
  }
}

// ---------- SPOTLIGHT: enfoque cinematografico de un regalo ----------
// sp = { unit, gifter, gift, name, coin, dur, size, intensity, t }
function drawSpotlight(ctx, sp, world) {
  const w = world.w, h = world.h;
  const t = sp.t, dur = sp.dur;
  const a = clamp(Math.min(t / 0.2, (dur - t) / 0.28), 0, 1);  // fundido entrada/salida
  const col = sp.unit.col, ac = sp.unit.t.color;
  const cx = w / 2, cy = h * 0.40;

  // oscurecer todo
  ctx.fillStyle = 'rgba(5,7,12,' + (0.74 * a) + ')';
  ctx.fillRect(0, 0, w, h);

  // foco de luz radial
  const r = sp.size * 2.6;
  const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
  g.addColorStop(0, rgba(col, 0.55 * a));
  g.addColorStop(0.6, rgba(col, 0.12 * a));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // anillo pulsante
  ctx.globalAlpha = a;
  ctx.strokeStyle = rgba(ac, 0.8); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, sp.size * (1.6 + 0.12 * Math.sin(t * 7)), 0, Math.PI * 2); ctx.stroke();

  // destellos giratorios (mas para regalos grandes)
  const n = 6 + sp.intensity * 5;
  for (let i = 0; i < n; i++) {
    const ang = t * 2.2 + i / n * Math.PI * 2;
    const rr = sp.size * 1.5 + Math.sin(t * 4 + i) * 10;
    const sx = cx + Math.cos(ang) * rr, sy = cy + Math.sin(ang) * rr * 0.85;
    const ss = 2 + sp.intensity * 0.7;
    ctx.fillStyle = i % 2 ? '#ffd34d' : ac;
    ctx.fillRect(sx - ss / 2, sy - ss / 2, ss, ss);
  }

  // unidad grande (entrada con zoom + rebote + pulso)
  const grow = clamp(t / 0.25, 0.3, 1);
  const pulse = 1 + 0.06 * Math.sin(t * 7);
  const size = sp.size * grow * pulse;
  const by = cy - Math.abs(Math.sin(t * 4)) * 7;
  drawUnitBig(ctx, sp.unit, cx, by + size * 0.4, size, t * 6);

  // textos
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.fillText(sp.gifter, cx, cy - sp.size * 1.45);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '19px "Segoe UI", sans-serif';
  ctx.fillText('envió  ' + sp.gift, cx, cy - sp.size * 1.45 + 26);
  ctx.fillStyle = ac;
  ctx.font = 'bold 26px "Segoe UI", sans-serif';
  ctx.fillText(window.STREAM_SAFE ? sp.name : (sp.name + '  ·  ' + sp.coin + '🪙'), cx, by + size + 40);
  if (sp.intensity >= 4) {
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('✨ ¡LEGENDARIO! ✨', cx, cy - sp.size * 1.45 - 30);
  }

  // barra de tiempo del enfoque
  const bw = sp.size * 2, p = 1 - t / dur;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(cx - bw / 2, cy + sp.size * 1.7, bw, 5);
  ctx.fillStyle = col; ctx.fillRect(cx - bw / 2, cy + sp.size * 1.7, bw * p, 5);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
