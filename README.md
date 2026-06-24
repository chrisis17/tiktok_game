# ⚔️ Guerra de Países — Juego interactivo para TikTok Live

Auto-battler 2D **vertical (9:16)** donde los **espectadores representan a su país**: votan
qué naciones luchan, mandan regalos para reclutar tropas, y el país ganador suma puntos en
un ranking global. Pensado para TikTok LIVE a pantalla completa (los regalos = tropas).

> **Estado: Fase 1 (Prototipo jugable).** Funciona 100% con botones y teclado,
> **todavía sin conexión a TikTok** — eso es la Fase 2.

---

## ▶️ Cómo ejecutarlo

- **Juego:** doble clic en `index.html` (se abre en el navegador). No instala nada.
- **Panel admin:** `admin.html` (o el botón ⚙️ Admin dentro del juego). Pestaña privada
  para configurar tiempos, regalos y ver la tier list. **No la transmitas.**

En OBS: captura **solo el recuadro vertical** del juego (el resto es panel de control).

> Si un navegador bloqueara algo por `file://`, levanta un server local en la carpeta:
> `npx serve` o `python -m http.server`, y abre `http://localhost:8000`.

---

## 🎮 El bucle de juego

1. **🗳️ Votación** — Aparecen países; vota (`+1`/`+10`). Salen los 2 más votados. (`ESPACIO` salta).
2. **🛡️ Reclutamiento** — Cada país es un ejército (abajo 🆚 arriba). Recluta tropas con
   botones (cada uno = "un regalo") o teclado.
3. **⚔️ Batalla** — `⚔️ ¡PELEAR!` (o `ESPACIO`). Los ejércitos chocan solos.
4. **🏁 Resultado** — El país ganador suma al ranking. `ESPACIO` = siguiente ronda.

**Teclado:** `1-0 Q W` = ejército de abajo · `Shift`+tecla = arriba · `ESPACIO` = avanzar fase.

---

## 🪖 Las 12 unidades (mapeo a regalos)

| Tecla | Unidad | Rol | Regalo (monedas) |
|---|---|---|---|
| 1 | ⚔️ Soldado | Melee básico, numeroso | Rosa (1) |
| 2 | 🏹 Arquero | Daño a distancia | TikTok (1) |
| 3 | 🔱 Lancero | Anti-caballería x2.2 / anti-león x1.6 | Mano (5) |
| 4 | 🛡️ Escudero | Tanque (vida + blindaje) | Sombrero (10) |
| 5 | ✚ Sanador | Cura aliados | Corazón (10) |
| 6 | 🐎 Caballería | Veloz, fuerte | Perfume (20) |
| 7 | 🎯 Ballestero | Francotirador lento | Guantes (30) |
| 8 | 🪄 Mago | Daño en área | Galaxy (50) |
| 9 | 🪓 Berserker | DPS rapidísimo, frágil | Tormenta (99) |
| 0 | 🗿 Gigante | Coloso de piedra (área) | Gigante (500) |
| Q | 🦁 León | Bestia veloz, roba vida | **Lion (29.999)** |
| W | 🐉 Dragón | Vuela y escupe fuego en área | **Universe (34.999)** |

Los costos en monedas y nombres de regalo se **editan en `admin.html`**.

---

## 🗂️ Estructura del código

```
index.html        Juego (vertical) + panel de control lateral
admin.html        Panel admin: ajustes, regalos, tier list
js/
  utils.js        Helpers (RNG, colores) y grilla espacial (rendimiento)
  config.js       ⭐ BALANCE: stats de 12 unidades, 10 países. Tocar aquí.
  settings.js     Config compartida (localStorage) entre juego y admin
  projectile.js   Flechas / fuego / proyectiles mágicos
  unit.js         Una unidad y su IA (buscar, atacar, curar, lifesteal)
  world.js        Campo de batalla: unidades, colisiones, victoria
  render.js       Dibujo pixel-art (vertical, contornos, animaciones)
  game.js         Máquina de estados, bucle, controles, UI
  admin.js        Lógica del panel admin
```

---

## 🗺️ Roadmap

- [x] **Fase 1** — Prototipo: auto-battler vertical + 12 unidades + países + bucle + panel admin.
- [x] **Fase 2** — Conexión TikTok (`server.js` + `js/tiktok.js`): regalos→tropas/votos, likes→soldados, comentarios→votos. Ver **[FASE2-TIKTOK.md](FASE2-TIKTOK.md)**.
- [x] **Fase 3** — Sonidos, música de fondo, persistir ranking, screen shake.
- [~] **Fase 4** — Guía OBS + checklist listos (**[FASE4-OBS-Y-PRUEBA-EN-VIVO.md](FASE4-OBS-Y-PRUEBA-EN-VIVO.md)**); falta la prueba en vivo real.

---

## 🔌 Próximo paso: conectar TikTok (Fase 2)

Un pequeño servidor Node con **TikTok-Live-Connector** escucha el LIVE y traduce eventos a
funciones que el juego ya expone:

```
gift  ->  game.spawnUnit(teamDelPais, unidadSegunValorDelRegalo)
comment "Perú" (en votación)  ->  game.vote(indiceDelPais, 1)
```
