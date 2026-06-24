// ============================================================
//  audio.js  -  Sonido por código (Web Audio API), sin archivos.
//  - SFX: efectos de los eventos del juego.
//  - SFX.music: música de fondo en bucle (libre de derechos).
//  Se activa tras el primer clic/tecla (política de autoplay).
// ============================================================

const SFX = (function () {
  let ctx = null, master = null, muted = false;
  const VOL = 0.35;

  // --- música ---
  let musicGain = null, musicOn = false, musicTimer = null, mStep = 0, mChord = 0;
  const BPM = 100;
  // Progresión heroica Am – F – C – G (un compás cada una)
  const PROG = [
    { bass: 110.00, arp: [220.00, 261.63, 329.63] }, // Am
    { bass: 87.31,  arp: [174.61, 220.00, 261.63] }, // F
    { bass: 130.81, arp: [261.63, 329.63, 392.00] }, // C
    { bass: 98.00,  arp: [196.00, 246.94, 293.66] }, // G
  ];

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOL;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.22;
      musicGain.connect(ctx.destination);   // independiente del mute de efectos
    } catch (e) { ctx = null; }
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('gpb_muted', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = m ? 0 : VOL;
  }
  function isMuted() { return muted; }

  function env(node, t0, dur, peak, dest) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g); g.connect(dest || master);
  }
  function tone(freq, dur, type, peak, slideTo, dest) {
    if (!ctx) return;
    const bus = dest || master;
    if (bus === master && muted) return;   // el mute solo afecta a los efectos
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    env(o, t0, dur, peak || 0.3, bus);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, peak, filtFreq, dest) {
    if (!ctx) return;
    const bus = dest || master;
    if (bus === master && muted) return;
    const t0 = ctx.currentTime;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filtFreq || 1000;
    n.connect(f); env(f, t0, dur, peak || 0.3, bus);
    n.start(t0); n.stop(t0 + dur);
  }
  function chord(freqs, dur, type, peak) { freqs.forEach(f => tone(f, dur, type, peak)); }
  function seq(notes, gap, dur, type, peak) {
    notes.forEach((f, i) => setTimeout(() => tone(f, dur, type, peak), i * gap));
  }

  // --- secuenciador de la música de fondo ---
  function musicStep() {
    if (!ctx || !musicOn) return;
    const ch = PROG[mChord];
    if (mStep % 4 === 0) {                       // bombo + bajo en los tiempos fuertes
      tone(ch.bass, 0.42, 'triangle', 0.55, null, musicGain);
      noise(0.06, 0.3, 180, musicGain);
    }
    tone(ch.arp[mStep % ch.arp.length], 0.22, 'square', 0.13, null, musicGain); // arpegio
    if (mStep % 2 === 1) noise(0.03, 0.05, 7000, musicGain);                     // hi-hat
    mStep++;
    if (mStep >= 8) { mStep = 0; mChord = (mChord + 1) % PROG.length; }
  }
  function musicStart() {
    init();
    if (musicOn) return;
    musicOn = true;
    try { localStorage.setItem('gpb_music', '1'); } catch (e) {}
    const stepMs = (60 / BPM) / 2 * 1000;        // corcheas
    clearInterval(musicTimer);
    musicTimer = setInterval(musicStep, stepMs);
  }
  function musicStop() {
    musicOn = false;
    try { localStorage.setItem('gpb_music', '0'); } catch (e) {}
    clearInterval(musicTimer); musicTimer = null;
  }

  return {
    init, resume, setMuted, isMuted,
    click() { tone(660, 0.05, 'square', 0.1); },
    vote() { tone(520, 0.12, 'triangle', 0.18, 760); },
    spawn() { tone(360, 0.09, 'sine', 0.14, 520); },
    spawnBig() { tone(150, 0.25, 'sawtooth', 0.25, 90); noise(0.18, 0.12, 500); },
    like() { tone(900, 0.07, 'sine', 0.10, 1300); },
    phase() { chord([392, 523], 0.22, 'triangle', 0.13); },
    battle() { tone(196, 0.5, 'sawtooth', 0.24, 294); noise(0.3, 0.18, 700); },
    win() { seq([523, 659, 784, 1047], 110, 0.24, 'triangle', 0.24); },
    epic() { tone(98, 0.7, 'sawtooth', 0.3, 150); chord([196, 247, 294], 0.7, 'sawtooth', 0.1); noise(0.4, 0.18, 420); },
    music: {
      start: musicStart, stop: musicStop,
      toggle() { musicOn ? musicStop() : musicStart(); return musicOn; },
      isOn() { return musicOn; },
    },
  };
})();

// Arranca el audio tras el primer gesto del usuario
window.addEventListener('load', () => {
  try { SFX.setMuted(localStorage.getItem('gpb_muted') === '1'); } catch (e) {}
  const start = () => {
    SFX.init(); SFX.resume();
    if (localStorage.getItem('gpb_music') === '1') SFX.music.start();
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);
});
