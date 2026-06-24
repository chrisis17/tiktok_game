# 📱 Transmitir desde el celular (control desde la laptop)

Mientras esperas TikTok LIVE Studio (PC), puedes ir en vivo **desde el celular** mostrando el
juego, y manejar los regalos **manualmente desde la laptop**. Todo por tu red Wi-Fi.

```
┌─ LAPTOP ───────────────────────────┐        ┌─ CELULAR ──────────────────┐
│ • server.js (sirve el juego + WS)  │  Wi-Fi │ • Abre el juego en el       │
│ • control.html (mandas regalos)    │ ─────► │   navegador (pantalla        │
│                                    │        │   completa) y lo transmites  │
└────────────────────────────────────┘        │   en tu TikTok LIVE          │
                                               └──────────────────────────────┘
```

> La laptop y el celular deben estar en la **MISMA red Wi-Fi**.

---

## ▶️ Pasos

### 1. En la laptop: inicia el servidor
- Doble clic en **`iniciar-servidor.bat`**. Verás algo así:
  ```
  Juego desde CELULAR:   http://192.168.x.x:8080
  Control remoto (PC):   http://localhost:8080/control.html
  ```
- **Anota la dirección "desde CELULAR"** (la IP de tu laptop).

> Si esa IP no carga en el celular, abre `cmd` en la laptop, escribe **`ipconfig`** y usa la
> **"Dirección IPv4"** de tu adaptador Wi-Fi (normalmente empieza con `192.168.`).

### 2. En el celular: abre el juego
- En el navegador del celular entra a **`http://LA-IP-DE-TU-LAPTOP:8080`**.
- Debe cargar el juego. Pulsa **⛶ Vista OBS** para verlo a pantalla completa y limpio.

### 3. En la laptop: abre el control
- Entra a **`http://localhost:8080/control.html`**.
- Debe decir **🟢 Conectado al servidor**.

### 4. Ve en vivo desde el celular
- En la app de TikTok, inicia un **LIVE** y comparte la **pantalla** (mostrando el navegador con el juego).

### 5. ¡A jugar!
- Desde el **control** (laptop) pulsa los regalos 🎁 y el **👍 +100 Tap-Tap**.
- En **votación**: pulsa el regalo que el juego muestra junto a cada país (ej. 🇵🇪 Perú 🌹 → botón **Rosa**).
- En **batalla**: cada regalo invoca su tropa para su equipo.
- El juego en el celular responde al instante. ✅

---

## 💡 Notas

- **No necesitas conectar tu @usuario** para esto: los regalos son manuales desde el control.
- Si además quieres leer los **regalos reales** de tu live, puedes — pero estando en vivo desde el
  celular, TikTok-Live-Connector también puede leerte por tu @usuario (opcional).
- El celular debe quedarse con el juego **visible** (no minimices el navegador) durante el live.
- ¿No carga en el celular? Suele ser el **firewall de Windows**: permite el acceso de Node cuando
  Windows lo pregunte la primera vez, o permite los puertos 8080/8787 en la red privada.
