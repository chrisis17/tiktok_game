// ============================================================
//  unit.js  -  Una unidad y su IA de auto-battler
//  IA: busca al enemigo mas cercano, avanza y ataca.
//  Sanadores buscan aliados heridos. Lanceros pegan x2 a jinetes.
// ============================================================

class Unit {
  constructor(team, typeId, x, y, country) {
    const t = UNIT_TYPES[typeId];
    this.team = team;          // 'A' o 'B'
    this.typeId = typeId;
    this.t = t;                // definicion (stats)
    this.x = x; this.y = y;
    this.hp = t.hp;
    this.maxHp = t.hp;
    this.dead = false;
    this.target = null;
    this.country = country;
    // Orientacion VERTICAL: equipo A abajo (avanza hacia arriba),
    // equipo B arriba (avanza hacia abajo). fwd = vector de avance.
    this.fwdX = 0;
    this.fwdY = team === 'A' ? -1 : 1;
    this.dir = 1;              // hacia donde mira el sprite (1 der / -1 izq)
    this.atkTimer = Math.random() * t.attackCD;     // desfase inicial
    this.retargetTimer = Math.random() * 0.3;
    this.flash = 0;            // parpadeo blanco al recibir dano
    this.col = '#fff';         // color de equipo/pais (se asigna al spawnear)
    this.colSec = '#222';      // color secundario del pais
    this.bob = Math.random() * Math.PI * 2; // animacion caminar
    this.moving = false;       // se movio este frame?
    this.lunge = 0;            // animacion de embestida al atacar
    this.lungeX = 0; this.lungeY = 0;
    this.gifter = null;        // usuario que invocó esta unidad (se muestra encima)
    this.nameT = 0;            // tiempo restante para resaltar el nombre
  }

  bonusVs(target) {
    const b = this.t.bonusVs;
    if (b && b[target.typeId]) return b[target.typeId];
    return 1;
  }

  takeDamage(dmg, src, world) {
    dmg *= (1 - this.t.armor);
    this.hp -= dmg;
    this.flash = 0.08;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      world.onUnitDeath(this);
    }
  }

  update(dt, world) {
    if (this.dead) return;
    if (this.flash > 0) this.flash -= dt;
    if (this.lunge > 0) this.lunge -= dt;
    if (this.nameT > 0) this.nameT -= dt;
    this.atkTimer -= dt;
    this.retargetTimer -= dt;
    this.bob += dt * 9;
    this.moving = false;

    // Sanador: logica propia
    if (this.t.heal) { this.updateHealer(dt, world); return; }

    // Antes de la batalla: las tropas esperan en su lado
    if (!world.battleActive) { this.idle(dt, world); return; }

    // Adquirir / refrescar objetivo
    if (!this.target || this.target.dead || this.retargetTimer <= 0) {
      this.target = world.findNearestEnemy(this);
      this.retargetTimer = 0.25 + Math.random() * 0.15;
    }

    const tg = this.target;
    if (!tg) { this.advance(dt, world); return; }

    const dx = tg.x - this.x, dy = tg.y - this.y;
    const d = Math.hypot(dx, dy) || 0.001;
    this.dir = dx >= 0 ? 1 : -1;

    if (d > this.t.range) {
      const sp = this.t.speed * dt;
      this.x += dx / d * sp;
      this.y += dy / d * sp;
      this.moving = true;
    } else if (this.atkTimer <= 0) {
      this.lungeX = dx / d; this.lungeY = dy / d;
      this.lunge = 0.16;
      this.attack(tg, world);
      this.atkTimer = this.t.attackCD;
    }
    this.separate(dt, world);
    this.clamp(world);
  }

  attack(tg, world) {
    if (this.t.ranged) { world.spawnProjectile(this, tg); return; }
    // Melee: dano directo
    const dmg = this.t.damage * this.bonusVs(tg);
    tg.takeDamage(dmg, this, world);
    world.spawnHit(tg.x, tg.y, this.team);
    // Robo de vida (leon)
    if (this.t.lifesteal && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + dmg * this.t.lifesteal);
    }
    // Melee con area (gigante / leon)
    if (this.t.splash > 0) {
      const near = world.grid.queryRadius(tg.x, tg.y, this.t.splash);
      for (let i = 0; i < near.length; i++) {
        const o = near[i];
        if (!o.dead && o.team !== this.team && o !== tg) {
          o.takeDamage(dmg * 0.6, this, world);
        }
      }
    }
  }

  updateHealer(dt, world) {
    if (!world.battleActive) { this.idle(dt, world); return; }
    const ally = world.findWoundedAlly(this);
    if (ally) {
      const dx = ally.x - this.x, dy = ally.y - this.y;
      const d = Math.hypot(dx, dy) || 0.001;
      this.dir = dx >= 0 ? 1 : -1;
      if (d > this.t.range) {
        const sp = this.t.speed * dt;
        this.x += dx / d * sp;
        this.y += dy / d * sp;
        this.moving = true;
      } else if (this.atkTimer <= 0) {
        ally.hp = Math.min(ally.maxHp, ally.hp + this.t.healAmount);
        world.spawnHeal(ally.x, ally.y);
        this.atkTimer = this.t.attackCD;
      }
    } else {
      this.advance(dt, world);
    }
    this.separate(dt, world);
    this.clamp(world);
  }

  // Sin objetivo: avanzar hacia el lado enemigo (vertical)
  advance(dt, world) {
    const sp = this.t.speed * 0.6 * dt;
    this.x += this.fwdX * sp;
    this.y += this.fwdY * sp;
    this.moving = true;
    this.separate(dt, world);
    this.clamp(world);
  }

  // Esperando: solo se separan para no encimarse
  idle(dt, world) {
    this.separate(dt * 0.6, world);
    this.clamp(world);
  }

  // Empuje suave para que las unidades no se apilen
  separate(dt, world) {
    const near = world.grid.queryRadius(this.x, this.y, this.t.size + 6);
    let px = 0, py = 0, n = 0;
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if (o === this || o.dead) continue;
      const dx = this.x - o.x, dy = this.y - o.y;
      const d2 = dx * dx + dy * dy;
      const min = (this.t.size + o.t.size) * 0.45;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        px += dx / d; py += dy / d; n++;
      }
    }
    if (n > 0) { this.x += px / n * 30 * dt; this.y += py / n * 30 * dt; }
  }

  clamp(world) {
    const b = world.bounds;
    this.x = clamp(this.x, b.x0, b.x1);
    this.y = clamp(this.y, b.y0, b.y1);
  }
}
