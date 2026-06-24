# 🌐 Desplegar el juego a un link público

Así el celular y la laptop solo abren **el mismo enlace** — sin IPs ni problemas de red.

El juego y el servidor de eventos van **juntos** en un solo servicio (Node + WebSocket).
**Render** tiene plan gratis y soporta WebSockets. (Vercel NO sirve para esto porque no
mantiene conexiones WebSocket).

---

## ✅ Pasos (una sola vez, ~10 min)

### 1. Subir el código a GitHub
- Crea una cuenta en https://github.com (si no tienes).
- Crea un repositorio nuevo (botón **New**), vacío (sin README), por ejemplo `guerra-de-paises`.
- Sube el código. La forma más fácil sin instalar nada:
  - **GitHub Desktop** (https://desktop.github.com): "Add existing repository" → elige esta carpeta → Publish.
  - O por terminal (si tienes git con sesión iniciada):
    ```
    git remote add origin https://github.com/TU-USUARIO/guerra-de-paises.git
    git push -u origin main
    ```

### 2. Desplegar en Render
1. Entra a https://render.com y regístrate con tu cuenta de **GitHub**.
2. Pulsa **New +** → **Web Service**.
3. Elige tu repositorio `guerra-de-paises`.
4. Render detecta Node solo. Confirma:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Pulsa **Create Web Service** y espera a que diga **Live** (1-3 min).
6. Te dará un link público, por ejemplo: **`https://guerra-de-paises.onrender.com`**

---

## 🎮 Usarlo en vivo

Con tu link `https://TU-APP.onrender.com`:

- **Celular** (transmites): abre el link → **⛶ Vista OBS** → comparte la pantalla en tu TikTok LIVE.
- **Laptop** (controlas): abre `https://TU-APP.onrender.com/control.html` → manda los regalos.

¡Los dos abren el mismo link público, sin importar la red! ✅

---

## ⚠️ Notas

- **Plan free de Render**: el servicio se "duerme" tras ~15 min sin uso y tarda ~30-50s en
  despertar la primera vez. Mientras transmites (uso continuo) no se duerme. Tip: abre el link
  un minuto antes de empezar para "despertarlo".
- **Leer regalos reales de TikTok** (botón Conectar) puede no funcionar desde la nube (TikTok
  a veces bloquea servidores). Pero el **control manual** (lo que usarás) funciona perfecto.
- Cada vez que cambies el código: haz `git push` y Render vuelve a desplegar solo.
