# 🔌 Fase 2 — Conexión con TikTok LIVE

El juego se conecta a tu LIVE de TikTok mediante un **servidor puente** en Node.js
que escucha los eventos (regalos, likes, comentarios) y se los manda al navegador.

```
TikTok LIVE → server.js (TikTok-Live-Connector) → WebSocket → index.html (el juego)
```

---

## ▶️ Cómo usarlo

### 1. Iniciar el servidor (una ventana que se queda abierta)
- **Fácil:** doble clic en **`iniciar-servidor.bat`**
  (la primera vez instala dependencias solo; deja la ventana abierta).
- **Manual:** en una terminal, dentro de la carpeta:
  ```
  npm install      (solo la primera vez)
  node server.js
  ```

### 2. Abrir el juego
- Doble clic en **`index.html`**.
- Arriba a la derecha verás el recuadro de **TikTok**:
  - Escribe tu **@usuario** y pulsa **🔴 Conectar**.
  - El estado pasa a **🟢 En vivo: @usuario** cuando conecta.

> Debes estar **transmitiendo en vivo** en TikTok para conectar. (Requisitos del LIVE:
> +1.000 seguidores, 18+, etc. — ver el README principal.)

### 3. Probar sin estar en vivo
En el recuadro de TikTok hay botones **🧪 Probar**: 🎁 Regalo · 👍 Likes · 💬 Comentario.
Inyectan eventos falsos para que veas el flujo completo sin transmitir.

---

## 🎁 Qué hace cada evento

| Evento TikTok | En el juego |
|---|---|
| **Regalo** (en votación) | +10 puntos al país que tiene ese regalo asignado |
| **Regalo** (en batalla) | Invoca 1 unidad aleatoria para el equipo de ese regalo |
| **Like (tap-tap)** | Cada 100 = 1 soldado al equipo que va perdiendo |
| **Comentario** con un país bien escrito | +1 voto (y lo agrega si no estaba) |

---

## ⚙️ Configurar los regalos reales

Los nombres de regalo de TikTok varían por región/cuenta. En **`admin.html`** → tabla
**"Regalos → Equipo + Unidad"** puedes editar el **"Nombre en TikTok"** de cada regalo
para que coincida con los que aparecen en tu LIVE, y sus monedas. Se guardan solos.

Si llega un regalo **sin mapear**, el servidor lo ignora y lo anota en la consola del
navegador (F12) como `[TikTok] regalo sin mapear: <nombre>`, para que sepas cuál añadir.

---

## 🛠️ Notas técnicas

- Puerto del WebSocket: **8787** (en `server.js` y `js/tiktok.js`, cámbialo en ambos si lo necesitas).
- `TikTok-Live-Connector` es una librería no oficial (ingeniería inversa); puede requerir
  actualizarse si TikTok cambia algo. Si falla la conexión, prueba `npm update`.
- El juego funciona igual **sin** servidor (modo manual/teclado); la conexión es opcional.
