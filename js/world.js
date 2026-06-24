// ============================================================
//  world.js  -  El campo de batalla: unidades, proyectiles,
//  particulas, grilla espacial y deteccion de victoria.
// ============================================================

class World {
  constructor(w, h) {
    this.w = w; this.h = h;
    // El campo de batalla ocupa los ~2/3 de ARRIBA. El tercio de abajo
    // queda para el chat de TikTok (izq) y los marcadores (der).
    this.arenaBottom = Math.round(h * 0.60);
    this.bounds = { x0: 22, y0: 130, x1: w - 22, y1: this.arenaBottom - 10 };
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.grid = new SpatialGrid(46);
    this.battleActive = false;
    this.countryA = null;
    this.countryB = null;
    this.colorA = '#d91023';
    this.colorB = '#0039a6';
  }

  reset() {
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.battleActive = false;
  }

  spawn(team, typeId, x, y) {
    const country = team === 'A' ? this.countryA : this.countryB;
    const u = new Unit(team, typeId, x, y, country);
    u.col = team === 'A' ? this.colorA : this.colorB;
    u.colSec = country ? country.secondary : '#222';
    this.units.push(u);
    // polvo al aparecer
    this.addParticles(x, y + u.t.size * 0.4, '#d8c9a8', 4, 26, 0.35);
    return u;
  }

  // Confeti de victoria (cae desde arriba del campo)
  addConfetti(color) {
    const cols = [color, '#ffd34d', '#ffffff', '#ff5b7f', '#5fd35f'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: rand(this.bounds.x0, this.bounds.x1),
        y: rand(this.bounds.y0 - 40, this.bounds.y0 + 60),
        vx: rand(-30, 30), vy: rand(30, 120),
        life: rand(1.2, 2.4), max: 2.4,
        color: choice(cols), size: 3 + Math.random() * 3,
      });
    }
  }

  countTeam(team) {
    let n = 0;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.team === team && !u.dead) n++;
    }
    return n;
  }

  onUnitDeath(u) { this.spawnDeath(u.x, u.y, u.team); }

  spawnProjectile(src, tg) { this.projectiles.push(new Projectile(src, tg)); }

  spawnHit(x, y, team) {
    this.addParticles(x, y, team === 'A' ? this.colorA : this.colorB, 3, 45, 0.22);
  }
  spawnHeal(x, y) { this.addParticles(x, y, '#39e66a', 4, 35, 0.5); }
  spawnDeath(x, y, team) {
    this.addParticles(x, y, '#7a5230', 6, 70, 0.6);
    this.addParticles(x, y, team === 'A' ? this.colorA : this.colorB, 4, 60, 0.5);
  }

  addParticles(x, y, color, count, spd, life) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spd;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 12,
        life, max: life, color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  findNearestEnemy(u) {
    let best = null, bd = Infinity;
    const cands = this.grid.queryRadius(u.x, u.y, 300);
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      if (c.dead || c.team === u.team) continue;
      const dx = c.x - u.x, dy = c.y - u.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = c; }
    }
    if (best) return best;
    // Respaldo: barrido completo si no hay nadie cerca
    for (let i = 0; i < this.units.length; i++) {
      const c = this.units[i];
      if (c.dead || c.team === u.team) continue;
      const dx = c.x - u.x, dy = c.y - u.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  findWoundedAlly(u) {
    let best = null, bd = Infinity;
    const cands = this.grid.queryRadius(u.x, u.y, 340);
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      if (c.dead || c.team !== u.team || c === u || c.t.heal) continue;
      if (c.hp >= c.maxHp) continue;
      const dx = c.x - u.x, dy = c.y - u.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  update(dt) {
    // Reconstruir grilla
    this.grid.clear();
    for (let i = 0; i < this.units.length; i++) {
      if (!this.units[i].dead) this.grid.insert(this.units[i]);
    }
    // Actualizar unidades
    for (let i = 0; i < this.units.length; i++) {
      if (!this.units[i].dead) this.units[i].update(dt, this);
    }
    // Proyectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].update(dt, this);
    }
    this.projectiles = this.projectiles.filter(p => !p.done);
    // Particulas
    for (let i = 0; i < this.particles.length; i++) {
      const pa = this.particles[i];
      pa.life -= dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.vy += 140 * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    // Quitar muertos
    this.units = this.units.filter(u => !u.dead);
  }

  getStats() {
    let aA = 0, aB = 0, hA = 0, hB = 0, pA = 0, pB = 0;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.dead) continue;
      if (u.team === 'A') { aA++; hA += u.hp; pA += u.t.power; }
      else { aB++; hB += u.hp; pB += u.t.power; }
    }
    return { aliveA: aA, aliveB: aB, hpA: hA, hpB: hB, powerA: pA, powerB: pB };
  }
}
