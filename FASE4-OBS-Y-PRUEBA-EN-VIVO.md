# 🎥 Fase 4 — Guía OBS + Prueba en Vivo

Esta guía te lleva paso a paso para transmitir el juego a tu TikTok LIVE.

---

## 🧠 Primero, entiende cómo funciona (importante)

Tu sistema tiene **DOS partes que corren a la vez** mientras estás en vivo:

```
┌─ 1. VIDEO QUE SALE ────────────────┐     ┌─ 2. EVENTOS QUE ENTRAN ──────────┐
│ OBS / TikTok LIVE Studio captura   │     │ server.js lee los regalos,       │
│ el juego y lo envía a TikTok       │     │ likes y comentarios de tu LIVE   │
│ (es lo que ven los espectadores)   │     │ y los manda al juego             │
└────────────────────────────────────┘     └──────────────────────────────────┘
```

- El **video** lo manda OBS (o TikTok LIVE Studio).
- Los **eventos** los lee `server.js` usando tu **@usuario** (no necesita la clave de stream).
- Ambos funcionan en paralelo: tú vas en vivo **y** el servidor lee ese mismo live.

---

## 📋 Lo que necesitas

- [ ] **Cuenta TikTok** apta para LIVE (normalmente +1.000 seguidores y 18+).
- [ ] **OBS Studio** (gratis: https://obsproject.com) **o** **TikTok LIVE Studio** (app oficial de TikTok para PC).
- [ ] El **servidor** del juego corriendo (`iniciar-servidor.bat`).
- [ ] El **juego** abierto en Chrome/Edge.

---

## 🅰️ Opción recomendada: TikTok LIVE Studio (más fácil)

Es la app oficial de TikTok para transmitir desde PC. Ya viene lista para conectar con tu cuenta.

1. Descarga e instala **TikTok LIVE Studio** e inicia sesión con tu cuenta.
2. En la escena, pulsa **+ Añadir fuente → Captura de ventana** y elige la ventana de Chrome con el juego.
   - O usa **Captura de pantalla** si pusiste el juego en pantalla completa con **⛶ Vista OBS**.
3. Ajusta/recorta para que se vea **solo el recuadro vertical** del juego (ver "Recortar" abajo).
4. Pon el **título** del live y pulsa **Go LIVE**.

> TikTok LIVE Studio ya transmite en vertical, perfecto para tu juego 9:16.

---

## 🅱️ Opción OBS Studio (más control)

Para enviar a TikTok desde OBS necesitas la **clave de stream** de TikTok (disponible si tu cuenta
tiene acceso a "transmitir con software de terceros"; si no la ves, usa la Opción A).

### 1. Configurar el lienzo vertical
- **Ajustes → Vídeo**:
  - Resolución base (lienzo): **1080 x 1920**
  - Resolución de salida: **1080 x 1920**
  - FPS: **30** (o 60)

### 2. Agregar el juego como fuente
**La forma más simple (recomendada):**
1. En el juego pulsa **⛶ Vista OBS** (lo pone en pantalla completa, 9:16 centrado sobre negro).
2. En OBS: **Fuentes → + → Captura de pantalla/monitor** (o **Captura de ventana** del navegador).
3. Verás el juego centrado con barras negras a los lados → recórtalas (ver abajo).

**Recortar a solo el juego:**
- Selecciona la fuente y haz **Alt + arrastrar** los bordes hacia adentro hasta dejar solo el
  recuadro vertical del juego. (También: clic derecho → *Filtros → +Recortar/Rellenar*.)
- Ajusta tamaño/posición para que el juego **llene** el lienzo 1080x1920.

### 3. Audio (sonido + música del juego)
- En **Mezclador de audio**, asegúrate de que **"Audio del escritorio"** esté activo
  → así sale el sonido y la música del juego.
- Si quieres tu propia música, baja la del juego (botón 🎵) y agrega un origen de música
  libre de copyright en OBS.

### 4. Conectar OBS con TikTok
1. En TikTok, inicia un LIVE eligiendo **"Transmitir con software/terceros"** (o usa
   https://www.tiktok.com/live/producer si tienes acceso) para obtener:
   - **URL del servidor (RTMP)** y **Clave de transmisión (Stream Key)**.
2. En OBS: **Ajustes → Emisión → Servicio: Personalizado** → pega la URL y la clave.
3. Pulsa **Iniciar transmisión** en OBS. ¡Ya estás en vivo!

---

## ✂️ Recortar el juego (resumen rápido)

1. Pon el juego en **⛶ Vista OBS** (pantalla completa).
2. Captura la pantalla/ventana en OBS.
3. **Alt + arrastra** los bordes de la fuente para quitar las barras negras.
4. Estira el resultado para que llene el lienzo vertical. ✅

---

## ✅ CHECKLIST PRE-LIVE (haz esto en orden)

**Antes de ir en vivo:**
- [ ] 1. Doble clic en **`iniciar-servidor.bat`** → dice "Servidor puente… ws://localhost:8787". Deja la ventana abierta.
- [ ] 2. Abre **`index.html`** en Chrome. Verás **🟡 Servidor listo** en el recuadro TikTok.
- [ ] 3. (Opcional) Abre **`admin.html`** y revisa: tiempos, y que los **nombres de regalo de TikTok** coincidan con los reales.
- [ ] 4. Activa **🔊 Sonido** y **🎵 Música** si los quieres.
- [ ] 5. En OBS/LIVE Studio: lienzo **1080x1920**, fuente capturando el juego, recortado y centrado.
- [ ] 6. Verifica el **audio del escritorio** en el mezclador de OBS.

**Al ir en vivo:**
- [ ] 7. Inicia tu **LIVE en TikTok** (por LIVE Studio, o OBS con la clave).
- [ ] 8. En el juego, escribe tu **@usuario** y pulsa **🔴 Conectar** → debe pasar a **🟢 En vivo: @tuusuario**.
- [ ] 9. Pulsa **⛶ Vista OBS** para la captura limpia.
- [ ] 10. Avisa en el live: **"comenten su país para votar"** y **"manden 🌹 a Perú / 🎵 a Chile"** (según los 2 que estén luchando).

**Durante el live:**
- [ ] Verifica que un **comentario con un país** suma voto.
- [ ] Verifica que un **regalo** invoca su unidad / vota.
- [ ] Verifica que los **likes** sumen soldados.

---

## 🆘 Si algo falla

| Problema | Solución |
|---|---|
| 🔴 "Servidor apagado" | Abre `iniciar-servidor.bat` y deja la ventana abierta. |
| No pasa a 🟢 En vivo | Debes estar **transmitiendo** y usar tu **@usuario exacto**. |
| Un regalo no hace nada | Su nombre no está mapeado: míralo en la consola (F12) `[TikTok] regalo sin mapear: X` y agrégalo en `admin.html`. |
| El juego se ve estirado | En OBS mantén el lienzo 1080x1920 y no deformes la fuente (usa Alt+arrastrar para recortar, no para estirar). |
| No se oye el juego | Activa "Audio del escritorio" en el mezclador de OBS. |
| Va lento | Cierra pestañas/programas; baja FPS de OBS a 30. |

---

## 🎬 Cuando estés listo

Avísame y hacemos la **prueba en vivo juntos**: te guío para verificar que los regalos, likes
y comentarios lleguen bien al juego mientras transmites. 🚀
