/* =========================================================================
   Sea — layered, animated ocean: swells, foam, spray, rain, lightning,
   snow, gulls and the cinematic title screen waves.
   ========================================================================= */
import { VIEW, clamp, rand, lerp } from '../engine/core.js';

const WEATHER = {
  sun: { waves: 1, rain: 0, snow: 0, gloom: 0, bolts: 0 },
  dusk: { waves: 1.15, rain: 0, snow: 0, gloom: 0.15, bolts: 0 },
  snow: { waves: 0.85, rain: 0, snow: 1, gloom: 0.25, bolts: 0 },
  night: { waves: 0.9, rain: 0, snow: 0, gloom: 0.55, bolts: 0 },
  storm: { waves: 2.3, rain: 1, snow: 0, gloom: 0.5, bolts: 1 },
  rain: { waves: 1.35, rain: 1, snow: 0, gloom: 0.2, bolts: 0 },
  glitch: { waves: 1.5, rain: 0.3, snow: 0, gloom: 0.65, bolts: 0.5 },
};

export class Sea {
  constructor() {
    this.t = 0;
    this.weather = 'sun';
    this.cfg = WEATHER.sun;
    this.rain = [];
    this.snow = [];
    this.gulls = [];
    this.flash = 0;
    this.boltT = rand(4, 10);
    this.rogue = null;
    this.spray = [];
    this.shimmer = [];
    this.density = 1;
    this.rebuild();
  }

  /** Quality tier sets how many weather particles exist at all. */
  setDensity(d) {
    const next = Math.max(0, Math.min(1, d));
    if (next === this.density) return;
    this.density = next;
    this.rebuild();
  }

  rebuild() {
    const n = (base) => Math.max(2, Math.round(base * this.density));
    this.rain.length = 0;
    this.snow.length = 0;
    this.gulls.length = 0;
    this.shimmer.length = 0;
    for (let i = 0; i < n(46); i++) {
      this.rain.push({ x: rand(0, VIEW.W), y: rand(0, VIEW.H), s: rand(180, 340), l: rand(4, 12) });
    }
    for (let i = 0; i < n(60); i++) {
      this.snow.push({ x: rand(0, VIEW.W), y: rand(0, VIEW.H), s: rand(10, 30), r: rand(0.6, 1.8) });
    }
    for (let i = 0; i < n(5); i++) {
      this.gulls.push({ x: rand(-40, VIEW.W + 40), y: rand(30, 130), s: rand(6, 12),
        ph: rand(0, 6), sp: rand(4, 12) });
    }
    for (let i = 0; i < n(18); i++) {
      this.shimmer.push({ x: rand(0, VIEW.W), y: rand(120, VIEW.H), ph: rand(0, 6), s: rand(1, 2) });
    }
  }

  reset(weather) {
    this.setWeather(weather || 'sun');
    this.t = 0;
    this.flash = 0;
    this.rogue = null;
    this.spray.length = 0;
  }

  setWeather(w) {
    this.weather = WEATHER[w] ? w : 'sun';
    this.cfg = WEATHER[this.weather];
  }

  triggerRogue() {
    this.rogue = { t: 0, dur: 2.6, warned: true };
  }

  /** wave speed multiplier for the physics ask */
  get wavePower() { return this.cfg.waves; }

  /** gentle iso-space current, different at every point of the pool */
  forceAt(gx, gy) {
    const t = this.t;
    const a = Math.sin(gx * 0.55 + gy * 0.31 + t * 1.15);
    const b = Math.cos(gy * 0.47 - gx * 0.24 + t * 0.83);
    const k = 1.6 * this.cfg.waves;
    return { x: (a * 1.5 + b * 0.7) * k * 0.45, y: (b * 1.5 - a * 0.7) * k * 0.45 };
  }

  update(dt, weather) {
    this.t += dt;
    if (weather) this.setWeather(weather);
    const c = this.cfg;
    for (const d of this.rain) {
      d.y += d.s * dt;
      d.x -= d.s * 0.22 * dt;
      if (d.y > VIEW.H + 12) { d.y = -12; d.x = rand(0, VIEW.W + 120); }
      if (d.x < -12) d.x = VIEW.W + 12;
    }
    for (const d of this.snow) {
      d.y += d.s * dt;
      d.x += Math.sin(this.t * 1.4 + d.r * 3) * 9 * dt;
      if (d.y > VIEW.H + 6) { d.y = -6; d.x = rand(0, VIEW.W); }
    }
    for (const g of this.gulls) {
      g.x += g.sp * dt;
      g.y += Math.sin(this.t * 0.7 + g.ph) * 5 * dt;
      if (g.x > VIEW.W + 50) g.x = -50;
    }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
    if (c.bolts) {
      this.boltT -= dt;
      if (this.boltT <= 0) {
        this.boltT = rand(3.5, 9);
        this.flash = rand(0.35, 0.9);
      }
    }
    if (this.rogue) {
      this.rogue.t += dt;
      if (this.rogue.t > this.rogue.dur) this.rogue = null;
    }
    for (let i = this.spray.length - 1; i >= 0; i--) {
      const p = this.spray[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.t > p.life) this.spray.splice(i, 1);
    }
  }

  splash(x, y, n = 5) {
    for (let i = 0; i < n; i++) {
      this.spray.push({
        x, y, vx: rand(-40, 40), vy: rand(-90, -20), t: 0,
        life: rand(0.3, 0.7), col: Math.random() < 0.5 ? '#c9eef7' : '#8fd3e8',
      });
    }
  }

  /* ------------------------------------------------------------- background */
  drawBackdrop(ctx, theme, opts = {}) {
    const sky = theme?.sky || ['#2b6f9e', '#8fd3e8'];
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
    g.addColorStop(0, sky[0]);
    g.addColorStop(0.55, sky[1]);
    g.addColorStop(1, theme?.deep || '#1d5f88');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);

    // sun / moon
    const isNight = this.weather === 'night' || this.weather === 'glitch';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = isNight ? '#e8ecff' : '#fff3c4';
    ctx.beginPath();
    ctx.arc(VIEW.W - 104, 62, isNight ? 18 : 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // skyline of slow swells on the horizon
    this.waveBand(ctx, 150, 10, 170, this.t * 0.22, 'rgba(255,255,255,0.10)', 0.6);
    this.waveBand(ctx, 182, 16, 230, this.t * 0.34, 'rgba(255,255,255,0.09)', 0.5);
    if (this.cfg.gloom) {
      ctx.fillStyle = `rgba(12,20,40,${this.cfg.gloom * 0.5})`;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }
    if (opts.foreground === false) return;
    this.waveBand(ctx, VIEW.H - 40, 22, 260, this.t * 0.7, 'rgba(28,96,140,0.25)', 0.5);
  }

  waveBand(ctx, y, amp, wavelength, phase, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(-10, VIEW.H + 10);
    for (let x = -10; x <= VIEW.W + 10; x += 10) {
      const yy = y + Math.sin(x / wavelength + phase) * amp
        + Math.sin(x / (wavelength * 0.37) + phase * 1.7) * amp * 0.35;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(VIEW.W + 10, VIEW.H + 10);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------- title / menu art */
  drawCinematic(ctx, theme, t = this.t) {
    const sky = theme?.sky || ['#2b6f9e', '#8fd3e8'];
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
    g.addColorStop(0, sky[0]);
    g.addColorStop(0.46, sky[1]);
    g.addColorStop(0.62, '#4fa6c8');
    g.addColorStop(1, theme?.deep || '#1d5f88');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);

    // sun + glare
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.weather === 'night' ? '#e8ecff' : '#fff3c4';
    ctx.beginPath(); ctx.arc(468, 74, 34, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(468, 74, 52, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // big layered waves, back to front
    this.crest(ctx, 132, 12, 210, t * 0.25, '#5fbedd', 'rgba(255,255,255,0.25)');
    this.crest(ctx, 176, 18, 260, t * 0.38, '#3f9fc8', 'rgba(255,255,255,0.38)');
    this.crest(ctx, 222, 24, 320, t * 0.55, '#2f83b0', 'rgba(255,255,255,0.42)');

    // the huge hero wave
    ctx.save();
    const base = 332 + Math.sin(t * 0.8) * 5;
    ctx.beginPath();
    ctx.moveTo(-20, VIEW.H + 20);
    ctx.lineTo(-20, base);
    for (let x = -20; x <= VIEW.W + 20; x += 12) {
      const k = clamp((x - 250) / 260, -1, 1);
      const yy = base - 40 - Math.cos(k * 1.35) * 46 - Math.sin(x / 90 + t * 0.9) * 7;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(VIEW.W + 20, VIEW.H + 20);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, 230, 0, 360);
    wg.addColorStop(0, '#2a7ea8');
    wg.addColorStop(1, '#134b74');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(233,250,255,0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // foam flecks + foreground spray
    for (let i = 0; i < 40; i++) {
      const px = ((i * 97 + t * 24) % (VIEW.W + 50)) - 25;
      const py = 300 + Math.sin(i * 1.7 + t) * 22;
      ctx.globalAlpha = 0.25 + (i % 3) * 0.2;
      ctx.fillStyle = '#eafaff';
      ctx.fillRect(Math.round(px), Math.round(py), (i % 3) + 1, (i % 2) + 1);
    }
    ctx.globalAlpha = 1;

    // gull silhouettes
    for (const gl of this.gulls) {
      if (gl.y > 150) continue;
      const flap = Math.sin(t * 4 + gl.ph) > 0;
      ctx.strokeStyle = 'rgba(24,40,60,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gl.x - 5, gl.y);
      ctx.lineTo(gl.x, gl.y + (flap ? -3 : 2));
      ctx.lineTo(gl.x + 5, gl.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gl.x + 1, gl.y);
      ctx.lineTo(gl.x, gl.y + (flap ? -3 : 2));
      ctx.stroke();
    }
  }

  crest(ctx, y, amp, wavelength, phase, fill, foam) {
    ctx.beginPath();
    ctx.moveTo(-10, VIEW.H);
    for (let x = -10; x <= VIEW.W + 10; x += 8) {
      const yy = y + Math.sin(x / wavelength + phase) * amp
        + Math.sin(x / (wavelength * 0.33) - phase) * amp * 0.3;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(VIEW.W + 10, VIEW.H);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = foam;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------------------------------------------------------------- overlay */
  drawWeather(ctx, theme) {
    const c = this.cfg;
    if (c.rain) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#b6d9ef';
      ctx.lineWidth = 1;
      for (const d of this.rain) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.l * 0.4, d.y + d.l);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (c.snow) {
      ctx.globalAlpha = 0.8;
      for (const d of this.snow) {
        ctx.fillStyle = d.r > 1.3 ? '#ffffff' : '#dbeaf6';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), Math.ceil(d.r), Math.ceil(d.r));
      }
      ctx.globalAlpha = 1;
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(240,250,255,${this.flash * 0.5})`;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }
    for (const p of this.spray) {
      ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1);
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  drawRogue(ctx) {
    if (!this.rogue) return null;
    const p = clamp(this.rogue.t / this.rogue.dur, 0, 1);
    const y = VIEW.H + 80 - p * (VIEW.H + 220);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-20, VIEW.H);
    ctx.lineTo(-20, y + 30);
    for (let x = -20; x <= VIEW.W + 20; x += 12) {
      const yy = y + 30 - 70 - Math.sin(x / 55 + this.t * 3) * 16;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(VIEW.W + 20, VIEW.H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - 80, 0, VIEW.H);
    g.addColorStop(0, 'rgba(150,220,236,0.95)');
    g.addColorStop(0.35, 'rgba(56,150,190,0.9)');
    g.addColorStop(1, 'rgba(16,70,110,0.75)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    return p;
  }
}

/* --------------------------------------------------------- menu wave sparks */
export function drawSparkles(ctx, t, theme) {
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const x = (i * 83 + t * (12 + (i % 4) * 6)) % VIEW.W;
    const y = 250 + Math.sin(i + t * 0.8) * 40;
    ctx.globalAlpha = 0.25 + (Math.sin(t * 3 + i) + 1) * 0.2;
    ctx.fillStyle = i % 5 === 0 ? (theme?.ui || '#ffe066') : '#eafaff';
    ctx.fillRect(Math.round(x), Math.round(y), 1 + (i % 2), 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export { lerp };
