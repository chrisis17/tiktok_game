// ============================================================
//  utils.js  -  Helpers matematicos, RNG y grilla espacial
// ============================================================

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }

// Convierte hex (#rrggbb) a {r,g,b}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

// Distancia euclidiana entre dos colores hex (0..441)
function colorDistance(c1, c2) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

// ------------------------------------------------------------
//  Grilla espacial: acelera la busqueda de vecinos (O(1) aprox)
//  en vez de comparar cada unidad contra todas (O(n^2)).
// ------------------------------------------------------------
class SpatialGrid {
  constructor(cell) {
    this.cell = cell;
    this.map = new Map();
  }
  clear() { this.map.clear(); }
  _key(cx, cy) { return cx + ',' + cy; }
  insert(u) {
    const cx = Math.floor(u.x / this.cell);
    const cy = Math.floor(u.y / this.cell);
    const k = this._key(cx, cy);
    let arr = this.map.get(k);
    if (!arr) { arr = []; this.map.set(k, arr); }
    arr.push(u);
  }
  // Devuelve todas las unidades en celdas que tocan el radio r
  queryRadius(x, y, r) {
    const res = [];
    const c0x = Math.floor((x - r) / this.cell);
    const c1x = Math.floor((x + r) / this.cell);
    const c0y = Math.floor((y - r) / this.cell);
    const c1y = Math.floor((y + r) / this.cell);
    for (let cx = c0x; cx <= c1x; cx++) {
      for (let cy = c0y; cy <= c1y; cy++) {
        const arr = this.map.get(this._key(cx, cy));
        if (arr) for (let i = 0; i < arr.length; i++) res.push(arr[i]);
      }
    }
    return res;
  }
}
