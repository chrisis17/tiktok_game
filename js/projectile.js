// ============================================================
//  projectile.js  -  Flechas, virotes y proyectiles magicos
// ============================================================

class Projectile {
  constructor(src, target) {
    this.x = src.x;
    this.y = src.y - 6;
    this.target = target;
    this.team = src.team;
    this.damage = src.t.damage * src.bonusVs(target);
    this.splash = src.t.splash;
    this.speed = src.t.projSpeed || 320;
    this.color = src.t.color;
    this.src = src;
    this.done = false;
    this.angle = 0;
  }

  update(dt, world) {
    const tg = this.target;
    if (!tg || tg.dead) { this.done = true; return; }

    const dx = tg.x - this.x;
    const dy = tg.y - this.y;
    const d = Math.hypot(dx, dy) || 0.001;
    this.angle = Math.atan2(dy, dx);
    const step = this.speed * dt;

    // Impacto
    if (d <= step + tg.t.size * 0.5 + 3) {
      tg.takeDamage(this.damage, this.src, world);
      world.spawnHit(tg.x, tg.y, this.team);
      if (this.splash > 0) {
        const near = world.grid.queryRadius(tg.x, tg.y, this.splash);
        for (let i = 0; i < near.length; i++) {
          const o = near[i];
          if (!o.dead && o.team !== this.team && o !== tg) {
            o.takeDamage(this.damage * 0.6, this.src, world);
          }
        }
        world.addParticles(tg.x, tg.y, this.color, 8, 90, 0.4);
      }
      this.done = true;
      return;
    }

    this.x += dx / d * step;
    this.y += dy / d * step;
  }
}
