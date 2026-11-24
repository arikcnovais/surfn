/* =========================================================================
   SURFN 2000 — asset loader and sprite drawing on top of the Paperwing engine.
   Reuses the original skyblock atlas (panels, palms, clouds) and adds the
   sliced Zel surfing atlas plus the generated pool/sea atlas.
   ========================================================================= */
import { drawPanel, clamp } from '../engine/core.js';

/* The single-file build injects every atlas and PNG as a data URI in
   window.__SURFN_EMBED, so the same code runs from disk without a server. */
const embed = () => (typeof globalThis !== 'undefined' && globalThis.__SURFN_EMBED) || null;

function getJson(url) {
  const e = embed();
  if (e && e.json && e.json[url]) return Promise.resolve(e.json[url]);
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`404 ${url}`);
    return r.json();
  });
}

function getImg(url) {
  const e = embed();
  const src = (e && e.img && e.img[url]) || url;
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(`failed to load ${url}`));
    i.src = src;
  });
}

export class Art {
  constructor() {
    this.images = {};
    this.atlas = {};      // skyblock atlas frames (panel, palms, clouds...)
    this.surf = {};       // generated surf atlas frames
    this.zel = null;      // sliced Zel frame metadata
    this.zelImgs = {};    // variant name -> image
    this.zelTintImgs = {};
    this.zelTints = { gelo: '#e1e5ea', azul: '#5fb3ff', rosa: '#ff8fc7' };
    this.isoTiles = {};   // Habbofont textures baked into 48x24 iso diamonds
    this.isoTileSize = [48, 24];
    this.habboProps = {}; // Habbofont furni art, bottom-centre anchored
  }

  async load(onProgress) {
    onProgress?.(0.08);
    const [atlasJson, surfJson, zelJson, isoJson, propJson] = await Promise.all([
      getJson('assets/atlas.json'),
      getJson('assets/surf.json'),
      getJson('assets/zel.json'),
      getJson('assets/habbofont/iso-tiles.json'),
      getJson('assets/habbofont/props/manifest.json'),
    ]);
    this.atlas = atlasJson.frames || {};
    this.surf = surfJson.frames || {};
    this.zel = zelJson;
    this.isoTiles = isoJson.frames || {};
    this.isoTileSize = isoJson.tile || [48, 24];
    onProgress?.(0.32);

    const variants = Object.entries(zelJson.variants || { zel: zelJson.image });
    const imgs = await Promise.all([
      getImg('assets/' + atlasJson.image),
      getImg('assets/' + surfJson.image),
      ...variants.map(([, file]) => getImg('assets/' + file)),
      getImg('assets/habbofont/' + isoJson.image),
      ...(propJson.props || []).map((p) => getImg('assets/habbofont/props/' + p.file)),
    ]);
    this.images.atlas = imgs[0];
    this.images.surf = imgs[1];
    // The atlas frames are pre-cropped to one clean silhouette per pose.
    variants.forEach(([name], i) => { this.zelImgs[name] = imgs[2 + i]; });
    if (!this.zelImgs.zel) this.zelImgs.zel = imgs[2];
    this.images.isoTiles = imgs[2 + variants.length];
    (propJson.props || []).forEach((p, i) => {
      this.habboProps[p.file.replace(/\.png$/i, '')] = imgs[3 + variants.length + i];
    });
    // build only the coats that have no pre-rendered sheet (gelo/azul/rosa),
    // during the loading screen, so no dialogue ever hitches on a recolour
    for (const name of Object.keys(this.zelTints)) {
      if (!this.zelImgs[name]) this.tintedZel(name);
    }
    onProgress?.(0.9);
  }

  /* ------------------------------------------------------------- raw frames */
  surfFrame(name) { return this.surf[name]; }
  atlasFrame(name) { return this.atlas[name]; }
  has(name) { return !!(this.surf[name] || this.atlas[name]); }

  /** draw one surf-atlas frame (bottom-centre anchored by default) */
  drawSurf(ctx, name, x, y, opts = {}) {
    const f = this.surf[name];
    if (!f) return;
    const s = opts.scale ?? 1;
    const w = Math.max(1, Math.round(f[2] * s));
    const h = Math.max(1, Math.round(f[3] * s));
    let dx = Math.round(x - w / 2);
    let dy = Math.round(y - h);
    if (opts.anchor === 'center') { dx = Math.round(x - w / 2); dy = Math.round(y - h / 2); }
    if (opts.anchor === 'top') { dx = Math.round(x - w / 2); dy = Math.round(y); }
    if (opts.anchor === 'topleft') { dx = Math.round(x); dy = Math.round(y); }
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.rot) {
      ctx.translate(dx + w / 2, dy + h);
      ctx.rotate(opts.rot);
      ctx.drawImage(this.images.surf, f[0], f[1], f[2], f[3], -w / 2, -h, w, h);
    } else if (opts.flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.images.surf, f[0], f[1], f[2], f[3], 0, 0, w, h);
    } else {
      ctx.drawImage(this.images.surf, f[0], f[1], f[2], f[3], dx, dy, w, h);
    }
    ctx.restore();
  }

  drawAtlas(ctx, name, x, y, opts = {}) {
    const f = this.atlas[name];
    if (!f) return;
    const s = opts.scale ?? 1;
    const w = Math.max(1, Math.round(f[2] * s));
    const h = Math.max(1, Math.round(f[3] * s));
    let dx = Math.round(x - w / 2);
    let dy = Math.round(y - h);
    if (opts.anchor === 'center') { dx = Math.round(x - w / 2); dy = Math.round(y - h / 2); }
    if (opts.anchor === 'top') { dx = Math.round(x - w / 2); dy = Math.round(y); }
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.images.atlas, f[0], f[1], f[2], f[3], 0, 0, w, h);
    } else {
      ctx.drawImage(this.images.atlas, f[0], f[1], f[2], f[3], dx, dy, w, h);
    }
    ctx.restore();
  }

  drawAny(ctx, name, x, y, opts = {}) {
    if (this.surf[name]) this.drawSurf(ctx, name, x, y, opts);
    else this.drawAtlas(ctx, name, x, y, opts);
  }

  /** Habbofont floor texture baked into an isometric diamond, top-left anchored. */
  drawIsoTile(ctx, name, x, y, opts = {}) {
    const f = this.isoTiles[name];
    if (!f || !this.images.isoTiles) return false;
    const s = opts.scale ?? 1;
    const w = Math.max(1, Math.round(this.isoTileSize[0] * s));
    const h = Math.max(1, Math.round(this.isoTileSize[1] * s));
    // maps draw hundreds of these per frame at 1:1 with no alpha: skip the
    // save/smoothing/restore dance on the hot path.
    if (s === 1 && opts.alpha === undefined) {
      ctx.drawImage(this.images.isoTiles, f[0], f[1], f[2], f[3],
        Math.round(x), Math.round(y), w, h);
      return true;
    }
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.images.isoTiles, f[0], f[1], f[2], f[3],
      Math.round(x), Math.round(y), w, h);
    ctx.restore();
    return true;
  }

  /** Habbofont furni art, bottom-centre anchored by default. */
  drawHabboProp(ctx, name, x, y, opts = {}) {
    const img = this.habboProps[name];
    if (!img) return false;
    const s = opts.scale ?? 0.4;
    const w = Math.max(1, Math.round(img.width * s));
    const h = Math.max(1, Math.round(img.height * s));
    let dx = Math.round(x - w / 2);
    let dy = Math.round(y - h);
    if (opts.anchor === 'center') { dx = Math.round(x - w / 2); dy = Math.round(y - h / 2); }
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (opts.flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
    } else {
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, w, h);
    }
    ctx.restore();
    return true;
  }

  /** 9-slice UI panel from the original atlas */
  panel(ctx, x, y, w, h) {
    drawPanel(ctx, this.images.atlas, this.atlas.panel, x, y, w, h);
  }

  /** dialogue portrait
   * Not a separate portrait drawing: this crops the actual in-game Zel
   * sprite (down-facing frame) into the dialogue box and uses the recoloured
   * atlas variant for the character. Same sprite you see surfing.
   */
  face(ctx, who, x, y, size = 48, variant = 'zel') {
    const boxX = Math.round(x - size / 2);
    const boxY = Math.round(y - size / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, size, size);
    ctx.clip();
    // 126 fits the v2 frame's margin: at 108 the ears clipped into the box
    this.drawZel(ctx, x, boxY + size * 2.15, 'down', 4, variant, {
      scale: size / 126,
    });
    ctx.restore();
  }

  /** recolour the in-game Zel atlas once per new coat, at runtime */
  tintedZel(variant) {
    if (this.zelTintImgs[variant]) return this.zelTintImgs[variant];
    const hex = this.zelTints[variant];
    const base = this.zelImgs.zel;
    if (!hex || !base) return null;
    const cv = document.createElement('canvas');
    cv.width = base.width;
    cv.height = base.height;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(base, 0, 0);
    const tr = parseInt(hex.slice(1, 3), 16);
    const tg = parseInt(hex.slice(3, 5), 16);
    const tb = parseInt(hex.slice(5, 7), 16);
    try {
      const img = c.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const v = max / 255;
        const sat = max ? (max - min) / max : 0;
        if (v < 0.18) continue;
        if (b > r * 1.06 && b > g * 0.95) continue;
        if (v > 0.94 && sat < 0.08) continue;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const shade = 0.55 + lum * 0.6;
        d[i] = Math.min(255, Math.round(tr * shade));
        d[i + 1] = Math.min(255, Math.round(tg * shade));
        d[i + 2] = Math.min(255, Math.round(tb * shade));
      }
      c.putImageData(img, 0, 0);
    } catch { /* file:// can taint the canvas; fall back to the base atlas */ }
    this.zelTintImgs[variant] = cv;
    return cv;
  }

  /**
   * Draw Zel. (x,y) is the surfboard's contact point with the water.
   * dir: 'up' | 'down' | 'left' | 'right'; frame can be fractional.
   */
  drawZel(ctx, x, y, dir, frame, variant = 'zel', opts = {}) {
    if (!this.zel) return;
    const anim = this.zel.anims[dir] || this.zel.anims.down;
    const idx = anim[((Math.floor(frame) % anim.length) + anim.length) % anim.length];
    const fr = this.zel.frames[idx];
    const img = this.zelImgs[variant] || this.tintedZel(variant) || this.zelImgs.zel;
    if (!fr || !img) return;
    const s = opts.scale ?? 0.24;
    const w = Math.max(1, fr.w * s);
    const h = Math.max(1, fr.h * s);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.rot) ctx.rotate(opts.rot);
    if (opts.flip) ctx.scale(-1, 1);
    if (opts.squash) ctx.scale(1, clamp(opts.squash, 0.5, 1.5));
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    // the art is high-res; a quality downsample keeps the 40px sprite crisp
    // and, unlike nearest-neighbour, stops it shimmering while it animates
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, fr.x, fr.y, fr.w, fr.h,
      Math.round(-fr.ax * s), Math.round(-fr.ay * s), w, h);
    ctx.restore();
  }

  icon(ctx, name, x, y, scale = 1) {
    this.drawSurf(ctx, 'ic_' + name, x, y, { anchor: 'center', scale });
  }
}
