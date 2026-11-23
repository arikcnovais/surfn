/* =========================================================================
   Journeys to the Skies — "Paperwing" mini engine
   A tiny component engine for 2.5D billboard sprites on an isometric island.
   ========================================================================= */

export const VIEW = { W: 640, H: 360 };

/* One UI typeface for the whole game. Comic Relief (an open Comic Sans) is
   shipped in assets/fonts and inlined into the single-file build, so the look
   never depends on the machine having Comic Sans installed. */
export const UI_FONT = '"Comic Relief", "Comic Sans MS", "Comic Sans", "Comic Neue", "Trebuchet MS", "DejaVu Sans", Verdana, sans-serif';
export const textSize = (s) => (s <= 10 ? s + 2 : s + 1);
export const TILE = { W: 48, H: 24 };

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const isoX = (gx, gy) => (gx - gy) * (TILE.W / 2);
export const isoY = (gx, gy) => (gx + gy) * (TILE.H / 2);
export function screenToIso(sx, sy) {
  const a = sx / (TILE.W / 2);
  const b = sy / (TILE.H / 2);
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}

/* --------------------------------------------------------------- renderer */
export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.buffer = document.createElement('canvas');
    this.buffer.width = VIEW.W;
    this.buffer.height = VIEW.H;
    this.ctx2 = this.buffer.getContext('2d');
    this.ctx2.imageSmoothingEnabled = false;
    this.scale = 1; this.ox = 0; this.oy = 0; this.dpr = 1;
    // Quality caps: potato phones render the 640x360 frame 1:1, strong
    // machines supersample up to 4x. game.applyPerf() sets these.
    this.dprCap = 2;
    this.maxScale = 4;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(240, window.innerHeight);
    this.w = w; this.h = h;
    this.dpr = Math.min(this.dprCap, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    // The world view follows the browser aspect ratio. The UI keeps a 360px
    // tall safe frame; on ultrawide screens (21:9, 21:6) it widens up to 960
    // logical pixels so menus use the extra space instead of floating in a
    // tiny 640px island. 16:9 stays exactly 640x360; 4:3 letterboxes vertically.
    const aspect = w / h;
    if (aspect >= 16 / 9) {
      VIEW.H = 360;
      VIEW.W = Math.max(640, Math.round(360 * aspect));
    } else {
      VIEW.W = 640;
      VIEW.H = Math.max(360, Math.round(640 / aspect));
    }
    this.uiW = aspect > 16 / 9 ? Math.min(960, Math.round(360 * aspect)) : 640;
    this.uiH = 360;
    this.uiX = Math.round((VIEW.W - this.uiW) / 2);
    this.uiY = Math.round((VIEW.H - this.uiH) / 2);
    const s = Math.min(w / VIEW.W, h / VIEW.H);
    this.scale = Math.max(0.25, Math.floor(s * 8) / 8);
    this.ox = Math.round((w - VIEW.W * this.scale) / 2);
    this.oy = Math.round((h - VIEW.H * this.scale) / 2);
    // Supersample the 640x360 stage in the backing buffer so a 1080p/1440p
    // browser is drawn at its native pixel count instead of upscaling a 640px
    // bitmap. The game still uses the same 640x360 coordinate system.
    this.renderScale = Math.max(1, Math.min(this.maxScale, Math.ceil(this.scale * this.dpr)));
    this.buffer.width = VIEW.W * this.renderScale;
    this.buffer.height = VIEW.H * this.renderScale;
    this.ctx.imageSmoothingEnabled = false;
  }
  begin() {
    const c = this.ctx2;
    c.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
    c.clearRect(0, 0, VIEW.W, VIEW.H);
    c.imageSmoothingEnabled = false;
    return c;
  }
  present() {
    // catch panel/window changes that do not fire a resize event
    if (window.innerWidth !== this.w || window.innerHeight !== this.h) this.resize();
    const c = this.ctx;
    const w = window.innerWidth, h = window.innerHeight;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Leave the letterbox transparent: the page's sky gradient shows through.
    c.clearRect(0, 0, w, h);
    // Minifying the supersampled buffer with nearest-neighbour is what made
    // text look jagged. Smooth it only when we are actually shrinking the
    // buffer (native or upscaled pixels stay crisp).
    const destW = VIEW.W * this.scale * this.dpr;
    c.imageSmoothingEnabled = this.buffer.width > destW * 1.04;
    c.drawImage(this.buffer, this.ox, this.oy, VIEW.W * this.scale, VIEW.H * this.scale);
  }
  toInternal(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - this.ox) / this.scale,
      y: (clientY - r.top - this.oy) / this.scale,
    };
  }
}

/* ------------------------------------------------------------------ input */
export class Input {
  constructor(screen) {
    this.screen = screen;
    this.keys = new Set();
    this.pressed = new Set();
    this.virtual = new Set();
    this.virtualPressed = new Set();
    this.typed = '';
    this.mouse = { x: -99, y: -99, down: false, clicked: false, moved: false };
    this.anyInput = false;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.key && e.key.length === 1) this.typed += e.key;
      this.anyInput = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    const move = (e) => {
      const p = this.screen.toInternal(e.clientX, e.clientY);
      this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.moved = true;
    };
    screen.canvas.addEventListener('mousemove', move);
    screen.canvas.addEventListener('mousedown', (e) => {
      move(e);
      this.mouse.down = true;
      this.mouse.clicked = true;
      this.anyInput = true;
    });
    screen.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      move(e);
      this.mouse.down = true;
      this.mouse.clicked = true;
      this.anyInput = true;
    }, { passive: false });
    window.addEventListener('mouseup', () => (this.mouse.down = false));
    screen.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  pressVirtual(code) {
    if (!this.virtual.has(code)) this.virtualPressed.add(code);
    this.virtual.add(code);
    this.anyInput = true;
  }
  releaseVirtual(code) { this.virtual.delete(code); }
  clearVirtual() { this.virtual.clear(); this.virtualPressed.clear(); }
  down(...codes) { return codes.some((c) => this.keys.has(c) || this.virtual.has(c)); }
  hit(...codes) {
    return codes.some((c) => this.pressed.has(c) || this.virtualPressed.has(c));
  }
  endFrame() {
    this.pressed.clear();
    this.virtualPressed.clear();
    this.typed = '';
    this.mouse.clicked = false;
  }
}

/* ----------------------------------------------------------------- assets */
export class Assets {
  constructor() {
    this.images = {};
    this.atlas = {};
    this.buizel = null;
  }
  async load() {
    const img = (src) => new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('failed to load ' + src));
      i.src = src;
    });
    const [atlasJson, buizelJson] = await Promise.all([
      fetch('assets/atlas.json').then((r) => r.json()),
      fetch('assets/buizel.json').then((r) => r.json()),
    ]);
    const variantNames = Object.keys(buizelJson.variants || { classic: buizelJson.atlas });
    const [atlasImg, ...coatImgs] = await Promise.all([
      img('assets/' + atlasJson.image),
      ...variantNames.map((v) => img('assets/' + buizelJson.variants[v])),
    ]);
    this.atlas = atlasJson.frames;
    this.images.atlas = atlasImg;
    this.buizel = buizelJson;
    this.coats = {};
    variantNames.forEach((name, i) => { this.coats[name] = coatImgs[i]; });
    this.images.buizel = this.coats.classic || coatImgs[0];
    this.coatNames = variantNames;
  }
  has(name) { return !!this.atlas[name]; }
  frame(name) { return this.atlas[name]; }
  /** draw an atlas frame anchored at its bottom-centre unless told otherwise */
  draw(ctx, name, x, y, opts = {}) {
    const f = this.atlas[name];
    if (!f) return;
    const { flip = false, alpha = 1, anchor = 'bottom', scale = 1 } = opts;
    let dx = Math.round(x - f[2] * scale / 2);
    let dy = Math.round(y - f[3] * scale);
    if (anchor === 'center') { dx = Math.round(x - f[2] * scale / 2); dy = Math.round(y - f[3] * scale / 2); }
    if (anchor === 'top') { dx = Math.round(x - f[2] * scale / 2); dy = Math.round(y); }
    if (flip) {
      ctx.save();
      ctx.translate(dx + f[2] * scale, dy);
      ctx.scale(-1, 1);
      if (alpha < 1) ctx.globalAlpha = alpha;
      ctx.drawImage(this.images.atlas, f[0], f[1], f[2], f[3], 0, 0,
        Math.round(f[2] * scale), Math.round(f[3] * scale));
      ctx.restore();
      return;
    }
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(this.images.atlas, f[0], f[1], f[2], f[3], dx, dy,
      Math.round(f[2] * scale), Math.round(f[3] * scale));
    if (alpha < 1) ctx.globalAlpha = 1;
  }
  /** draw a Buizel animation frame, anchored at the sheet's feet anchor */
  drawBuizel(ctx, anim, index, x, y, flip = false, alpha = 1, coat = 'classic',
    scaleX = 1, scaleY = 1) {
    const a = this.buizel.anims[anim];
    if (!a || !a.frames.length) return;
    const fr = a.frames[clamp(index, 0, a.frames.length - 1)];
    const w = this.buizel.frameW, h = this.buizel.frameH;
    const [ax, ay] = this.buizel.anchor;
    const src = this.coats[coat] || this.images.buizel;
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(src, fr.x, fr.y, w, h, -ax, -ay, w, h);
    } else {
      ctx.drawImage(src, fr.x, fr.y, w, h, -ax, -ay, w, h);
    }
    ctx.restore();
    if (alpha < 1) ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------ paper actors */
export class Entity {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; this.components = {}; }
  add(name, comp) { comp.entity = this; this.components[name] = comp; return comp; }
  get(name) { return this.components[name]; }
  update(dt) { for (const k in this.components) this.components[k].update?.(dt, this); }
}

export class Animator {
  constructor(clips, start = 'idle') {
    this.clips = clips;
    this.name = start;
    this.time = 0;
    this.index = 0;
    this.playing = true;
    this.onEnd = null;
  }
  play(name, { restart = false } = {}) {
    if (this.name === name && !restart) return;
    this.name = name; this.time = 0; this.index = 0; this.playing = true;
  }
  get clip() { return this.clips[this.name]; }
  update(dt) {
    const c = this.clip;
    if (!c || !this.playing) return;
    this.time += dt;
    const step = c.duration / 1000;
    const count = c.frames.length;
    while (this.time >= step) {
      this.time -= step;
      if (this.index + 1 >= count) {
        if (c.loop) this.index = 0;
        else { this.playing = false; this.onEnd?.(); return; }
      } else this.index++;
    }
  }
}

/* ----------------------------------------------------------------- camera */
export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
    this.tx = 0; this.ty = 0;
    this.shake = 0;
    this.ox = 0; this.oy = 0;
    this.bounds = null;
  }
  snapTo(x, y) { this.x = this.tx = x; this.y = this.ty = y; }
  follow(x, y, dt) {
    this.tx = x; this.ty = y;
    const k = 1 - Math.pow(0.0008, dt);
    this.x = lerp(this.x, this.tx, k);
    this.y = lerp(this.y, this.ty, k);
    if (this.bounds) {
      const b = this.bounds;
      this.x = clamp(this.x, b.minX, b.maxX);
      this.y = clamp(this.y, b.minY, b.maxY);
    }
    this.shake = Math.max(0, this.shake - dt * 26);
    if (this.shakeEnabled === false) this.shake = 0;
    // A decaying two-tone wobble reads as an impact. Per-frame randomness
    // (the old rand(-shake, shake)) just looked like a broken picture.
    this.shakeT = (this.shakeT || 0) + dt;
    this.ox = this.shake ? Math.sin(this.shakeT * 41) * this.shake : 0;
    this.oy = this.shake ? Math.cos(this.shakeT * 29) * this.shake * 0.7 : 0;
  }
  toScreen(wx, wy) {
    return { x: Math.round(wx - this.x + VIEW.W / 2 + this.ox), y: Math.round(wy - this.y + VIEW.H / 2 + this.oy) };
  }
  toWorld(sx, sy) {
    return { x: sx + this.x - VIEW.W / 2, y: sy + this.y - VIEW.H / 2 };
  }
  kick(n) { this.shake = Math.min(6, this.shake + n); }
}

/* --------------------------------------------------------------- particles */
const P_COLORS = {
  leaf: ['#3d6b3a', '#4f8a4a', '#68ab50', '#8ecf63'],
  wood: ['#7a4d2f', '#9a6840', '#bd8b5c'],
  stone: ['#5a6273', '#767e91', '#9aa2b3'],
  water: ['#59a9c9', '#92d2e4', '#c9eef7'],
  spark: ['#ffe066', '#ffc978', '#fffbe8'],
  dust: ['#dcb282', '#bd8b5c', '#9a6840'],
  fiber: ['#8ecf63', '#b7e07a', '#3d6b3a'],
  heart: ['#ff5a5f', '#ff8f6b'],
  star: ['#ffe14d', '#fffbe8', '#f2c531'],
  ember: ['#ff8f6b', '#ffe066', '#e8702b'],
};

export class Particles {
  constructor() { this.list = []; this.texts = []; this.cap = 520; }
  burst(x, y, type, n = 8, opts = {}) {
    const cols = P_COLORS[type] || P_COLORS.dust;
    for (let i = 0; i < n; i++) {
      const a = opts.angle !== undefined
        ? opts.angle + rand(-(opts.spread ?? 1.2), opts.spread ?? 1.2)
        : rand(0, Math.PI * 2);
      const sp = rand(opts.speed?.[0] ?? 12, opts.speed?.[1] ?? 46);
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift ?? 14),
        life: rand(opts.life?.[0] ?? 0.35, opts.life?.[1] ?? 0.8), max: 1,
        size: rand(1, opts.big ? 3.4 : 2.4), color: pick(cols),
        grav: opts.grav ?? 90, glow: opts.glow ?? false, type,
      });
    }
    for (const p of this.list) p.max = p.life;
    // A hard ceiling keeps a long combo from turning into a frame drop.
    if (this.list.length > this.cap) this.list.splice(0, this.list.length - this.cap);
  }
  text(x, y, str, color = '#fbeec8') {
    this.texts.push({ x, y, str, color, life: 1.1, max: 1.1 });
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        // swap-pop: no splice shifting the whole list on every dead spark
        this.list[i] = this.list[this.list.length - 1];
        this.list.pop();
        continue;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.vx *= 1 - 1.6 * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt; t.y -= 16 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s));
    }
    ctx.globalAlpha = 1;
  }
  drawTexts(ctx) {
    for (const t of this.texts) {
      const a = clamp(t.life / t.max, 0, 1);
      ctx.globalAlpha = a;
      drawText(ctx, t.str, t.x, t.y, { size: 7, color: t.color, align: 'center', shadow: '#1b1728' });
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------- audio */
export { AudioEngine } from './audio.js';

/* ---------------------------------------------------------------- drawing */
export function drawText(ctx, str, x, y, opts = {}) {
  const { size = 8, color = '#fbeec8', align = 'left', weight = 'normal' } = opts;
  // Small type sits on the striped panel art, so it always gets a 1px ink
  // drop shadow unless the caller asks for something else.
  // A 1px shadow is opt-in: at these sizes a translucent copy just reads as
  // double-struck text, and the panel art already gives enough contrast.
  const shadow = opts.shadow === undefined ? null : opts.shadow;
  ctx.font = `${weight} ${textSize(size)}px ${UI_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, Math.round(x), Math.round(y));
}

/** 9-slice a 24x24 panel frame for a w x h box */
export function drawPanel(ctx, img, rect, x, y, w, h, border = 6) {
  const [fx, fy, fw, fh] = rect;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const b = border;
  const sw = fw - b * 2, sh = fh - b * 2;
  const dw = w - b * 2, dh = h - b * 2;
  // corners
  ctx.drawImage(img, fx, fy, b, b, x, y, b, b);
  ctx.drawImage(img, fx + fw - b, fy, b, b, x + w - b, y, b, b);
  ctx.drawImage(img, fx, fy + fh - b, b, b, x, y + h - b, b, b);
  ctx.drawImage(img, fx + fw - b, fy + fh - b, b, b, x + w - b, y + h - b, b, b);
  // edges
  ctx.drawImage(img, fx + b, fy, sw, b, x + b, y, dw, b);
  ctx.drawImage(img, fx + b, fy + fh - b, sw, b, x + b, y + h - b, dw, b);
  ctx.drawImage(img, fx, fy + b, b, sh, x, y + b, b, dh);
  ctx.drawImage(img, fx + fw - b, fy + b, b, sh, x + w - b, y + b, b, dh);
  // middle
  ctx.drawImage(img, fx + b, fy + b, sw, sh, x + b, y + b, dw, dh);
}

export function shadow(ctx, x, y, rx = 13, ry = 5, alpha = 0.28) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1b1728';
  // dithered pixel ellipse for a paper-cutout shadow
  for (let i = -rx; i <= rx; i++) {
    const t = 1 - (i / rx) ** 2;
    if (t <= 0) continue;
    const h = Math.round(ry * Math.sqrt(t));
    if ((i + Math.round(y)) % 2 === 0) {
      ctx.fillRect(Math.round(x + i), Math.round(y - h), 1, Math.max(1, h * 2));
    }
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
