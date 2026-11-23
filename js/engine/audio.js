/* =========================================================================
   Audio — a small ambient synthesizer.
   Layered oscillators, filtered noise, convolution reverb and a slow
   generative score (C418 / Lena Raine flavoured).
   ========================================================================= */
/* In the single-file build every track and sample is a data URI in
   window.__SURFN_EMBED.audio, so no fetch and no server are needed. */
const embed = () => (typeof globalThis !== 'undefined' && globalThis.__SURFN_EMBED) || null;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const aclamp = (v, a, b) => Math.max(a, Math.min(b, v));
const arand = (a, b) => a + Math.random() * (b - a);

const CHORDS = {
  cozy: [
    [0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17],
  ],
  night: [
    [0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [5, 8, 12, 15],
  ],
  wild: [
    [0, 3, 7, 10], [5, 8, 12, 15], [3, 6, 10, 13], [7, 10, 14, 17],
  ],
  bright: [
    [0, 4, 7, 9], [5, 9, 12, 16], [7, 11, 14, 16], [2, 5, 9, 12],
  ],
};

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

/* Named generative tracks, all in the same palette of sounds: slow pads, a
   sparse piano, occasional bells, filtered wind. Each only changes key, tempo,
   density and which ornaments it reaches for. */
const TRACKS = {
  hearth: { prog: 'cozy', root: 57, beat: 0.84, density: 0.46, pad: 0.040, ornament: 0.18 },
  morning: { prog: 'bright', root: 60, beat: 0.78, density: 0.52, pad: 0.038, ornament: 0.22 },
  dusk: { prog: 'cozy', root: 55, beat: 0.92, density: 0.38, pad: 0.042, ornament: 0.3 },
  night: { prog: 'night', root: 53, beat: 0.99, density: 0.3, pad: 0.032, ornament: 0.26 },
  rain: { prog: 'night', root: 50, beat: 1.02, density: 0.26, pad: 0.03, ornament: 0.18, hiss: true },
  rift: { prog: 'wild', root: 45, beat: 1.08, density: 0.3, pad: 0.036, ornament: 0.45, bells: 0.5, drone: true },
  flight: { prog: 'bright', root: 62, beat: 0.7, density: 0.56, pad: 0.034, ornament: 0.3, arp: true },
  festival: { prog: 'bright', root: 60, beat: 0.62, density: 0.6, pad: 0.03, ornament: 0.4, marimba: 0.5 },
  cabin: { prog: 'cozy', root: 52, beat: 0.96, density: 0.32, pad: 0.03, ornament: 0.34 },
  starfall: { prog: 'night', root: 48, beat: 1.05, density: 0.34, pad: 0.034, ornament: 0.4, bells: 0.6 },
  surf: { prog: 'bright', root: 62, beat: 0.58, density: 0.6, pad: 0.028, ornament: 0.5, marimba: 0.5, arp: true },
  storm: { prog: 'wild', root: 45, beat: 0.66, density: 0.48, pad: 0.042, ornament: 0.4, drone: true, hiss: true, drums: 'heavy' },
  glitch: { prog: 'wild', root: 41, beat: 0.6, density: 0.54, pad: 0.045, ornament: 0.7, bells: 0.8, drone: true, arp: true, drums: 'heavy' },
  victory: { prog: 'bright', root: 60, beat: 0.46, density: 0.7, pad: 0.032, ornament: 0.65, marimba: 0.65, arp: true },
  // rad 2000s deck: faster tempos, power chords and a drum kit
  menu2000: { prog: 'bright', root: 60, beat: 0.54, density: 0.6, pad: 0.03, ornament: 0.5, marimba: 0.5, arp: true, drums: 'pop' },
  surfrock: { prog: 'bright', root: 57, beat: 0.5, density: 0.64, pad: 0.026, ornament: 0.52, marimba: 0.4, arp: true, drums: 'surf', guitar: true },
  radical: { prog: 'wild', root: 64, beat: 0.44, density: 0.7, pad: 0.028, ornament: 0.55, marimba: 0.42, arp: true, drums: 'punk', guitar: true },
  sunset: { prog: 'cozy', root: 55, beat: 0.72, density: 0.5, pad: 0.034, ornament: 0.4, marimba: 0.3, drums: 'soft' },
  boss: { prog: 'wild', root: 43, beat: 0.56, density: 0.58, pad: 0.04, ornament: 0.6, bells: 0.5, drone: true, drums: 'heavy', guitar: true },
  // vila 2000: rock autoral de garagem, sem sample de ninguém
  garage2000: { prog: 'bright', root: 57, beat: 0.48, density: 0.64, pad: 0.026, ornament: 0.46, drums: 'punk', guitar: true },
  rocknight: { prog: 'wild', root: 50, beat: 0.56, density: 0.56, pad: 0.034, ornament: 0.5, drums: 'heavy', guitar: true },
  rain2000: { prog: 'night', root: 52, beat: 0.62, density: 0.46, pad: 0.03, ornament: 0.38, hiss: true, drums: 'soft', guitar: true },
  winter2000: { prog: 'cozy', root: 55, beat: 0.7, density: 0.44, pad: 0.034, ornament: 0.42, bells: 0.35, drums: 'soft' },
  // seasonal cassettes, all synthesized from the same original palette
  christmas2000: { prog: 'cozy', root: 57, beat: 0.74, density: 0.42, pad: 0.034, ornament: 0.34, bells: 0.65, drums: 'soft' },
  thanksgiving2000: { prog: 'cozy', root: 53, beat: 0.82, density: 0.4, pad: 0.036, ornament: 0.38, marimba: 0.35, drums: 'soft' },
  easter2000: { prog: 'bright', root: 60, beat: 0.76, density: 0.48, pad: 0.03, ornament: 0.42, bells: 0.4, arp: true },
  halloween2000: { prog: 'night', root: 46, beat: 0.9, density: 0.34, pad: 0.04, ornament: 0.5, bells: 0.55, drone: true, drums: 'soft', hiss: true },
  newyear2000: { prog: 'bright', root: 62, beat: 0.5, density: 0.66, pad: 0.028, ornament: 0.6, marimba: 0.55, arp: true, drums: 'pop' },
  carnival2000: { prog: 'bright', root: 59, beat: 0.52, density: 0.7, pad: 0.026, ornament: 0.62, marimba: 0.6, drums: 'punk', guitar: true },
  junina2000: { prog: 'cozy', root: 55, beat: 0.68, density: 0.52, pad: 0.03, ornament: 0.5, marimba: 0.45, drums: 'soft' },
  // the legend's duels: one cold theme for the pursuit, one for the decision
  omen: { prog: 'night', root: 45, beat: 0.98, density: 0.34, pad: 0.044, ornament: 0.36, bells: 0.45, drone: true, drums: 'soft' },
  finale: { prog: 'wild', root: 41, beat: 0.52, density: 0.62, pad: 0.042, ornament: 0.6, bells: 0.4, drone: true, drums: 'heavy', guitar: true },
};

export const TRACK_NAMES = Object.keys(TRACKS);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.musicOn = true;
    this.musicVol = 0.4;
    this.sfxVol = 0.5;
    this.timer = 0;
    this.beat = 0;
    this.bar = 0;
    this.chord = 0;
    this.prog = 'cozy';
    this.track = 'hearth';
    this.hour = 8;
    this.root = 57;
    this.melodyStep = 0;
    this.lastNote = 0;
    this.sampleEvents = null;
    this.sampleFiles = null;
    this.sampleTracks = new Map();
    this.samples = new Map();
    this.sampleEl = null;
    this.sampleElTrack = '';
    this.sampleQueue = [];
    this.samplePositions = new Map();
    this.trackEls = new Map();
    this.samplesLoading = false;
    this.samplesLoaded = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    // A brick-wall-ish compressor after every bus: stacked SFX used to clip
    // and turn into the famous earrape chord.
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -22;
    this.comp.knee.value = 10;
    this.comp.ratio.value = 6;
    this.comp.attack.value = 0.003;
    this.comp.release.value = 0.2;
    this.comp.connect(this.master);
    this.master.connect(ctx.destination);

    // music bus with its own reverb
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.comp);
    this.musicSend = ctx.createGain();
    this.musicSend.gain.value = 0.55;

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.comp);
    this.sfxSend = ctx.createGain();
    this.sfxSend.gain.value = 0.22;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.6, 2.4);
    this.reverbOut = ctx.createGain();
    this.reverbOut.gain.value = 0.9;
    this.reverb.connect(this.reverbOut);
    this.reverbOut.connect(this.comp);
    this.musicSend.connect(this.reverb);
    this.sfxSend.connect(this.reverb);

    this.warm = ctx.createBiquadFilter();
    this.warm.type = 'lowpass';
    this.warm.frequency.value = 5200;
    this.warm.connect(this.comp);

    this.ready = true;
    this.startWind();
    this.timer = 0.4;
    // Decoding the sample deck on the same tick as the first click caused a
    // visible freeze; give the frame a moment and then decode in small batches.
    setTimeout(() => this.loadSamples(), 700);
  }

  /* ------------------------------------------------------------- samples
     The 2000s deck is loaded from audio/manifest.json. Music streams through
     an <audio> element (long files stay out of memory); short SFX are decoded
     once and replayed through the WebAudio graph. Each theme may list several
     tracks, and the deck advances through that list when a song ends. If
     anything fails the synth below remains a complete fallback. */
  async loadSamples() {
    if (this.samplesLoading || this.samplesLoaded || !this.ctx) return;
    this.samplesLoading = true;
    try {
      const embeddedManifest = embed()?.json?.['audio/manifest.json'];
      const res = embeddedManifest ? null : await fetch('audio/manifest.json');
      if (res && !res.ok) throw new Error(`audio manifest ${res.status}`);
      const data = embeddedManifest || await res.json();
      this.sampleEvents = data.events || {};
      this.sampleFiles = data.sfx || {};
      this.themeTracks = data.themes || {};
      this.sampleTracks = new Map((data.music || []).map((m) => [m.id, m]));
      // Sequential, four at a time, yielding between batches: the base64
      // decode of 28 files at once was a two-second hitch on slow machines.
      const entries = Object.entries(this.sampleFiles);
      for (let i = 0; i < entries.length; i += 4) {
        await Promise.all(entries.slice(i, i + 4).map(async ([name, file]) => {
          try {
            const r = await fetch(embed()?.audio?.[file] || 'audio/' + file);
            if (!r.ok) throw new Error(`${file} ${r.status}`);
            const bytes = await r.arrayBuffer();
            const buf = await new Promise((resolve, reject) => {
              this.ctx.decodeAudioData(bytes, resolve, reject);
            });
            this.samples.set(name, buf);
          } catch (err) {
            console.warn('SURFN 2000: could not load sample', name, err);
          }
        }));
        await new Promise((r) => setTimeout(r, 0));
      }
      this.samplesLoaded = true;
      this.applySampleTrack();
    } catch (err) {
      console.warn('SURFN 2000: sample deck unavailable, using synth', err);
    } finally {
      this.samplesLoading = false;
    }
  }

  playSample(name, { gain = 1, rate = 1, delay = 0, offset = 0, duration = 0, send = 0.08 } = {}) {
    if (!this.ready || this.muted) return false;
    const buf = this.samples.get(name);
    if (!buf) return false;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    // samples were mastered loud for trailers; the in-game mix needs headroom
    g.gain.value = gain * 0.62;
    src.connect(g);
    this.route(g, { send });
    const t0 = ctx.currentTime + delay;
    const safeOffset = Math.max(0, Math.min(offset, Math.max(0, buf.duration - 0.01)));
    if (duration > 0) src.start(t0, safeOffset, Math.min(duration, buf.duration - safeOffset));
    else src.start(t0, safeOffset);
    return true;
  }

  playEvent(name) {
    const layers = this.sampleEvents?.[name];
    if (!layers) return false;
    let played = false;
    for (const layer of layers) played = this.playSample(layer.sample, layer) || played;
    return played;
  }

  sampleIdsForTrack() {
    const raw = this.themeTracks?.[this.track];
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list.filter((id) => this.sampleTracks.has(id));
  }

  applySampleTrack() {
    const ids = this.sampleIdsForTrack();
    if (!ids.length) { this.sampleQueue = []; this.stopSampleTrack(); return; }
    this.sampleQueue = ids;
    if (this.sampleEl && ids.includes(this.sampleElTrack)) { this.syncSampleMusic(); return; }
    // Rotate the first pick each time a theme is entered, so returning to a
    // menu or map does not always start on the same song.
    const pos = this.samplePositions.get(this.track) || 0;
    this.samplePositions.set(this.track, pos + 1);
    this.startSampleTrack(ids[pos % ids.length]);
  }

  /* One reused <audio> per track. Rebuilding the element from its data URI on
     every screen change stalled the frame for a beat and was the biggest
     cause of the game feeling janky when navigating menus. */
  trackElement(id) {
    let el = this.trackEls.get(id);
    if (el) return el;
    const def = this.sampleTracks.get(id);
    if (!def) return null;
    el = new Audio(embed()?.audio?.[def.file] || 'audio/' + def.file);
    el.loop = false; // the theme playlist advances in nextSampleTrack()
    el.preload = 'auto';
    el.addEventListener('ended', () => {
      if (this.sampleEl === el) this.nextSampleTrack();
    });
    this.trackEls.set(id, el);
    // keep the cache small: decoded audio is the heavy part
    if (this.trackEls.size > 4) {
      for (const [key, old] of this.trackEls) {
        if (key === id || key === this.sampleElTrack) continue;
        old.pause();
        old.removeAttribute('src');
        old.load();
        this.trackEls.delete(key);
        break;
      }
    }
    return el;
  }

  startSampleTrack(id) {
    if (!this.ctx || !this.sampleTracks.has(id)) { this.stopSampleTrack(); return; }
    const el = this.trackElement(id);
    if (!el) { this.stopSampleTrack(); return; }
    if (this.sampleEl && this.sampleEl !== el) this.sampleEl.pause();
    this.sampleEl = el;
    this.sampleElTrack = id;
    el.volume = this.musicVol;
    el.muted = this.muted;
    try { el.currentTime = 0; } catch { /* not seekable yet */ }
    this.syncSampleMusic();
    // Warm the next song in the playlist while this one plays, so the
    // playlist advance never has to decode a 2 MB data URI mid-frame.
    clearTimeout(this._warmT);
    if (this.sampleQueue.length > 1) {
      this._warmT = setTimeout(() => {
        const at = this.sampleQueue.indexOf(id);
        const nextId = this.sampleQueue[(at + 1) % this.sampleQueue.length];
        if (nextId && nextId !== id) this.trackElement(nextId);
      }, 2000);
    }
  }

  nextSampleTrack() {
    if (!this.sampleQueue.length) return;
    const at = this.sampleQueue.indexOf(this.sampleElTrack);
    this.startSampleTrack(this.sampleQueue[(at + 1) % this.sampleQueue.length]);
  }

  stopSampleTrack() {
    if (!this.sampleEl) return;
    this.sampleEl.pause();
    this.sampleEl = null;
    this.sampleElTrack = '';
  }

  syncSampleMusic() {
    if (!this.sampleEl) return;
    this.sampleEl.volume = this.musicVol;
    this.sampleEl.muted = this.muted;
    if (!this.ready || this.muted || !this.musicOn) {
      if (!this.sampleEl.paused) this.sampleEl.pause();
      return;
    }
    if (!this.sampleEl.paused) return;
    const p = this.sampleEl.play();
    if (p && p.catch) p.catch(() => {});
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = Math.pow(1 - t, decay);
        const n = Math.random() * 2 - 1;
        lp = lp * 0.72 + n * 0.28;
        d[i] = lp * env * (ch ? 0.92 : 1);
      }
    }
    return buf;
  }

  startWind() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0, last2 = 0;
    for (let i = 0; i < len; i++) {
      const n = Math.random() * 2 - 1;
      last = last * 0.97 + n * 0.03;
      last2 = last2 * 0.995 + last * 0.005;
      d[i] = last2 * 3.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620;
    lp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;
    const g = ctx.createGain();
    g.gain.value = 0.085;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(hp).connect(lp).connect(g).connect(this.comp);
    src.start();
    lfo.start();
    this.windGain = g;
  }

  /* ------------------------------------------------------------- primitives */
  route(node, { music = false, send = 0 } = {}) {
    const bus = music ? this.musicBus : this.sfxBus;
    const out = this.ctx.createGain();
    out.gain.value = 1;
    node.connect(out);
    out.connect(bus);
    if (send > 0) {
      const s = this.ctx.createGain();
      s.gain.value = send;
      out.connect(s);
      s.connect(music ? this.musicSend : this.sfxSend);
    }
    return out;
  }

  tone({ freq, dur = 0.3, type = 'sine', gain = 0.1, attack = 0.005, decay = null,
    slide = null, delay = 0, detune = 0, filter = null, q = 1, music = false,
    send = 0, vibrato = 0, pan = 0 }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    osc.detune.value = detune;
    const g = ctx.createGain();
    const rel = decay ?? dur;
    const lvl = music ? gain : gain * 0.62;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(lvl, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + rel);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(filter, t0);
      f.Q.value = q;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    if (pan) {
      const p = ctx.createStereoPanner?.();
      if (p) { p.pan.value = pan; g.connect(p); this.route(p, { music, send }); }
      else this.route(g, { music, send });
    } else this.route(g, { music, send });
    if (vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.8;
      const lg = ctx.createGain();
      lg.gain.value = vibrato;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + rel + 0.05);
    }
    osc.start(t0);
    osc.stop(t0 + rel + 0.06);
  }

  noise({ dur = 0.2, gain = 0.08, freq = 900, q = 1, type = 'bandpass',
    delay = 0, sweep = null, attack = 0.002, music = false, send = 0 }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t0 + dur);
    const g = ctx.createGain();
    const lvl = music ? gain : gain * 0.62;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(lvl, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g);
    this.route(g, { music, send });
    src.start(t0);
  }

  /* ------------------------------------------------------------- instruments */
  piano(note, { gain = 0.11, dur = 1.5, delay = 0, music = true, pan = 0 } = {}) {
    const f = midi(note);
    this.tone({ freq: f, dur, gain, type: 'triangle', attack: 0.004, decay: dur * 0.9, music, send: 0.5, pan });
    this.tone({ freq: f * 2, dur: dur * 0.5, gain: gain * 0.28, type: 'sine', decay: dur * 0.42, music, send: 0.4, delay, pan });
    this.tone({ freq: f * 3.01, dur: 0.12, gain: gain * 0.07, type: 'sine', music, send: 0.3, delay });
  }

  pluck(note, { gain = 0.1, delay = 0, music = false, pan = 0 } = {}) {
    const f = midi(note);
    this.tone({ freq: f, dur: 0.75, gain, type: 'sawtooth', attack: 0.003, decay: 0.6,
      filter: 3200, q: 3, music, send: 0.35, pan });
    this.tone({ freq: f * 2.005, dur: 0.3, gain: gain * 0.4, type: 'triangle', music, send: 0.25 });
  }

  bell(note, { gain = 0.07, delay = 0, music = true, pan = 0 } = {}) {
    const f = midi(note);
    this.tone({ freq: f, dur: 2.4, gain, type: 'sine', attack: 0.002, decay: 2.2, music, send: 0.9, pan });
    this.tone({ freq: f * 2.76, dur: 1.4, gain: gain * 0.4, type: 'sine', decay: 1.2, music, send: 0.8, pan });
  }

  marimba(note, { gain = 0.09, delay = 0, music = false, pan = 0 } = {}) {
    const f = midi(note);
    this.tone({ freq: f, dur: 0.5, gain, type: 'sine', attack: 0.002, decay: 0.42, music, send: 0.3, pan });
    this.tone({ freq: f * 4, dur: 0.16, gain: gain * 0.3, type: 'sine', music, send: 0.2 });
    this.noise({ dur: 0.04, gain: gain * 0.28, freq: 2400, type: 'bandpass', q: 2, music, send: 0.2 });
  }

  flute(note, { gain = 0.075, dur = 0.6, delay = 0, music = false, pan = 0 } = {}) {
    const f = midi(note);
    this.tone({ freq: f, dur, gain, type: 'sine', attack: 0.09, decay: dur, music, send: 0.55,
      vibrato: 2.2, pan });
    this.noise({ dur: dur * 0.9, gain: gain * 0.22, freq: f * 2, q: 0.8, attack: 0.08, music, send: 0.4 });
  }

  pad(notes, dur = 3.4, { gain = 0.045, music = true } = {}) {
    for (const n of notes) {
      const f = midi(n);
      this.tone({ freq: f, dur, gain, type: 'sawtooth', attack: 0.5, decay: dur,
        filter: 1100, q: 0.8, music, send: 0.7, detune: -6 });
      this.tone({ freq: f, dur, gain: gain * 0.8, type: 'sawtooth', attack: 0.6, decay: dur,
        filter: 900, q: 0.7, music, send: 0.7, detune: 7 });
    }
  }

  bass(note, dur = 2.2) {
    this.tone({ freq: midi(note - 12), dur, gain: 0.075, type: 'sine', attack: 0.03,
      decay: dur, music: true, send: 0.15 });
  }

  kick(gain = 0.09) {
    this.tone({ freq: 118, dur: 0.2, gain, type: 'sine', attack: 0.002, decay: 0.16,
      slide: 0.32, music: true, send: 0.05 });
    this.noise({ dur: 0.03, gain: gain * 0.35, freq: 160, type: 'lowpass', music: true });
  }

  snare(gain = 0.06) {
    this.noise({ dur: 0.14, gain, freq: 1900, q: 1.1, type: 'bandpass', music: true, send: 0.14 });
    this.tone({ freq: 186, dur: 0.09, gain: gain * 0.6, type: 'triangle', decay: 0.08, music: true });
  }

  hat(gain = 0.02, delay = 0) {
    this.noise({ dur: 0.045, gain, freq: 7200, type: 'highpass', delay, music: true, send: 0.08 });
  }

  clap(gain = 0.045) {
    for (let i = 0; i < 3; i++) {
      this.noise({ dur: 0.06, gain, freq: 1250, q: 1.6, type: 'bandpass', delay: i * 0.012, music: true, send: 0.2 });
    }
  }

  guitar(note, dur = 0.5) {
    [0, 7, 12].forEach((n, i) => {
      this.tone({ freq: midi(note + n), dur, gain: 0.019, type: 'sawtooth', attack: 0.008,
        decay: dur, filter: 1700, q: 1.4, detune: i * 4, music: true, send: 0.25 });
    });
    this.noise({ dur: 0.05, gain: 0.012, freq: 2600, type: 'bandpass', music: true });
  }

  drums(kit, beatLen) {
    const step = this.beat % 8;
    const kicks = {
      surf: [0, 4], punk: [0, 3, 4, 7], heavy: [0, 2, 4, 6], soft: [0, 4], pop: [0, 4],
    }[kit] || [0, 4];
    const snares = {
      surf: [2, 6], punk: [2, 6], heavy: [2, 6], soft: [4], pop: [4],
    }[kit] || [4];
    if (kicks.includes(step)) this.kick(kit === 'soft' ? 0.055 : 0.085);
    if (snares.includes(step)) this.snare(kit === 'soft' ? 0.035 : 0.06);
    if (kit !== 'soft' || step % 2 === 0) this.hat(0.016);
    this.hat(kit === 'soft' ? 0.008 : 0.012, beatLen * 0.5);
    if (kit === 'pop' && step === 4) this.clap(0.04);
    if (kit === 'heavy' && step === 7) this.kick(0.05);
  }

  /* --------------------------------------------------------------------- sfx */
  sfx(name) {
    if (!this.ready || this.muted) return;
    if (this.playEvent(name)) return;
    const r = (a, b) => arand(a, b);
    switch (name) {
      case 'blip':
        this.tone({ freq: r(560, 700), dur: 0.05, type: 'triangle', gain: 0.018, send: 0.1 });
        break;
      case 'ui':
        this.tone({ freq: 740, dur: 0.07, type: 'sine', gain: 0.07, send: 0.2 });
        this.tone({ freq: 1110, dur: 0.1, type: 'sine', gain: 0.03, delay: 0.03, send: 0.3 });
        break;
      case 'select':
        this.marimba(76, { gain: 0.05 });
        break;
      case 'chopped':
        this.noise({ dur: 0.09, gain: 0.11, freq: 1600, sweep: 0.35, type: 'lowpass' });
        this.noise({ dur: 0.22, gain: 0.06, freq: 500, sweep: 0.4, type: 'bandpass', q: 0.8, delay: 0.02 });
        this.tone({ freq: r(120, 150), dur: 0.18, type: 'sine', gain: 0.09, slide: 0.55 });
        break;
      case 'chip':
        this.noise({ dur: 0.05, gain: 0.09, freq: r(2400, 3400), sweep: 0.5, type: 'bandpass', q: 1.4 });
        break;
      case 'mine':
        this.noise({ dur: 0.08, gain: 0.17, freq: 3200, sweep: 0.4, type: 'bandpass', q: 2.4 });
        this.tone({ freq: r(430, 540), dur: 0.07, type: 'triangle', gain: 0.07, slide: 0.7 });
        this.tone({ freq: 190, dur: 0.16, type: 'sine', gain: 0.1, slide: 0.6, delay: 0.01 });
        break;
      case 'water':
        this.noise({ dur: 0.55, gain: 0.11, freq: 900, sweep: 2.6, type: 'bandpass', q: 1.1 });
        this.tone({ freq: 340, dur: 0.35, type: 'sine', gain: 0.045, slide: 1.9, send: 0.3 });
        break;
      case 'splash':
        this.noise({ dur: 0.35, gain: 0.13, freq: 1100, sweep: 2.2, type: 'bandpass', q: 0.9 });
        this.noise({ dur: 0.5, gain: 0.06, freq: 2800, sweep: 1.6, type: 'highpass', delay: 0.05 });
        break;
      case 'plant':
        this.tone({ freq: 260, dur: 0.12, type: 'sine', gain: 0.1, slide: 1.7, send: 0.2 });
        this.noise({ dur: 0.16, gain: 0.07, freq: 700, sweep: 0.6, type: 'lowpass' });
        break;
      case 'pickup':
        this.marimba(79, { gain: 0.06 });
        this.marimba(84, { gain: 0.05, delay: 0.07 });
        break;
      case 'eat':
        this.noise({ dur: 0.09, gain: 0.1, freq: 700, sweep: 0.5, type: 'lowpass' });
        this.noise({ dur: 0.1, gain: 0.09, freq: 520, sweep: 0.6, type: 'lowpass', delay: 0.13 });
        break;
      case 'drink':
        this.tone({ freq: 300, dur: 0.1, type: 'sine', gain: 0.08, slide: 0.65 });
        this.tone({ freq: 360, dur: 0.1, type: 'sine', gain: 0.07, slide: 0.7, delay: 0.14 });
        this.noise({ dur: 0.2, gain: 0.03, freq: 1200, sweep: 0.8, delay: 0.1 });
        break;
      case 'craft':
        [0, 5, 9, 12].forEach((s, i) => this.marimba(64 + s, { gain: 0.06, delay: i * 0.09 }));
        this.noise({ dur: 0.3, gain: 0.05, freq: 1600, sweep: 0.6, type: 'bandpass' });
        break;
      case 'quest':
        [72, 76, 79, 84].forEach((n, i) => this.piano(n, { gain: 0.07, dur: 2, delay: i * 0.13 }));
        this.bell(96, { gain: 0.035, delay: 0.5 });
        break;
      case 'day':
        this.pad([48, 55, 60, 64], 3.6, { gain: 0.03 });
        this.piano(72, { gain: 0.06, dur: 2.6 });
        this.bell(84, { gain: 0.03, delay: 0.7 });
        break;
      case 'sleep':
        [60, 64, 67].forEach((n, i) => this.piano(n, { gain: 0.05, dur: 2.4, delay: i * 0.22 }));
        break;
      case 'jump':
        this.tone({ freq: 260, dur: 0.13, type: 'triangle', gain: 0.05, slide: 2.1, send: 0.2 });
        break;
      case 'land':
        this.noise({ dur: 0.12, gain: 0.08, freq: 320, sweep: 0.5, type: 'lowpass' });
        break;
      case 'deny':
        this.tone({ freq: 190, dur: 0.14, type: 'triangle', gain: 0.07, slide: 0.68 });
        this.tone({ freq: 150, dur: 0.16, type: 'sine', gain: 0.05, delay: 0.07, slide: 0.8 });
        break;
      case 'fall':
        this.tone({ freq: 620, dur: 1.1, type: 'sine', gain: 0.07, slide: 0.12, send: 0.6 });
        this.noise({ dur: 1.2, gain: 0.07, freq: 1800, sweep: 0.15, type: 'lowpass', send: 0.4 });
        break;
      case 'note':
        this.pluck(72, { gain: 0.06 });
        break;
      case 'cast':
        this.noise({ dur: 0.36, gain: 0.06, freq: 600, sweep: 2.4, type: 'bandpass' });
        this.tone({ freq: 420, dur: 0.24, type: 'sine', gain: 0.03, slide: 1.8 });
        break;
      case 'bite':
        this.tone({ freq: 660, dur: 0.08, type: 'triangle', gain: 0.07 });
        this.tone({ freq: 990, dur: 0.1, type: 'triangle', gain: 0.05, delay: 0.07 });
        break;
      case 'reel':
        this.marimba(74, { gain: 0.05 });
        this.marimba(81, { gain: 0.05, delay: 0.06 });
        this.noise({ dur: 0.24, gain: 0.05, freq: 1000, sweep: 1.8, type: 'bandpass' });
        break;
      case 'magic':
        [84, 88, 91, 96].forEach((n, i) => this.bell(n, { gain: 0.03, delay: i * 0.08 }));
        this.noise({ dur: 0.7, gain: 0.04, freq: 3000, sweep: 0.5, type: 'bandpass' });
        break;
      case 'pet':
        this.tone({ freq: 720, dur: 0.1, type: 'sine', gain: 0.05, slide: 1.5 });
        this.tone({ freq: 980, dur: 0.1, type: 'sine', gain: 0.04, delay: 0.08, slide: 1.3 });
        break;
      case 'boost':
        this.noise({ dur: 0.45, gain: 0.09, freq: 500, sweep: 4.5, type: 'bandpass', q: 1.2 });
        this.tone({ freq: 160, dur: 0.4, type: 'sawtooth', gain: 0.05, slide: 3.4, filter: 1800 });
        break;
      case 'trick':
        [72, 76, 79, 84].forEach((n, k) => this.marimba(n, { gain: 0.055, delay: k * 0.045 }));
        this.noise({ dur: 0.16, gain: 0.045, freq: 2600, sweep: 1.6, type: 'bandpass' });
        break;
      case 'bail':
        this.noise({ dur: 0.4, gain: 0.1, freq: 900, sweep: 0.25, type: 'lowpass' });
        this.tone({ freq: 240, dur: 0.35, type: 'triangle', gain: 0.055, slide: 0.35 });
        break;
      case 'gate':
        this.bell(84, { gain: 0.05, music: false });
        this.marimba(88, { gain: 0.06, delay: 0.06 });
        this.noise({ dur: 0.2, gain: 0.035, freq: 3200, sweep: 2, type: 'bandpass' });
        break;
      case 'achievement':
        [72, 76, 79, 84, 88].forEach((n, i) => this.bell(n, { gain: 0.035, delay: i * 0.075 }));
        this.marimba(84, { gain: 0.07, delay: 0.3 });
        break;
      case 'unlock':
        [72, 79, 84].forEach((n, i) => this.marimba(n, { gain: 0.06, delay: i * 0.06 }));
        this.bell(91, { gain: 0.03, delay: 0.18 });
        break;
      case 'festival':
        [72, 74, 76, 79, 81, 84].forEach((n, i) => this.marimba(n, { gain: 0.05, delay: i * 0.055 }));
        this.noise({ dur: 0.6, gain: 0.03, freq: 3200, sweep: 2.2, type: 'bandpass', send: 0.3 });
        break;
      case 'tape':
        this.noise({ dur: 0.08, gain: 0.08, freq: 900, type: 'bandpass' });
        this.noise({ dur: 0.5, gain: 0.025, freq: 1400, sweep: 0.7, type: 'bandpass', delay: 0.05, send: 0.2 });
        this.marimba(72, { gain: 0.04, delay: 0.04 });
        break;
      case 'snow':
        [84, 88, 91].forEach((n, i) => this.bell(n, { gain: 0.022, delay: i * 0.1 }));
        this.noise({ dur: 0.8, gain: 0.02, freq: 4200, sweep: 1.3, type: 'highpass', send: 0.3 });
        break;
      case 'milestone':
        [60, 64, 67, 72, 76, 79].forEach((n, i) => this.piano(n, { gain: 0.055, dur: 1.4, delay: i * 0.055 }));
        this.bell(91, { gain: 0.035, delay: 0.3 });
        break;
      case 'wave':
        this.noise({ dur: 1.6, gain: 0.08, freq: 260, sweep: 0.7, type: 'lowpass', attack: 0.25 });
        this.noise({ dur: 1.2, gain: 0.03, freq: 1800, sweep: 0.5, type: 'bandpass', delay: 0.2 });
        this.tone({ freq: 70, dur: 1.8, type: 'sine', gain: 0.045, attack: 0.2 });
        break;
      default: break;
    }
  }

  /* ------------------------------------------------------------------- music */
  setMood(prog) { this.prog = CHORDS[prog] ? prog : 'cozy'; }

  forceTrack(name) {
    if (!TRACKS[name]) return;
    this.track = name;
    this.chord = 0;
    this.beat = 0;
    this.timer = 0.05;
    this.applySampleTrack();
  }

  setTrack(name) {
    if (!TRACKS[name] || name === this.track) return;
    this.forceTrack(name);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master)     this.master.gain.value = m ? 0 : 0.85;
    this.syncSampleMusic();
  }

  setMusicVolume(v) {
    this.musicVol = aclamp(v, 0, 1);
    if (this.musicBus) this.musicBus.gain.value = this.musicVol;
    if (this.sampleEl) this.sampleEl.volume = this.musicVol;
  }

  setSfxVolume(v) {
    this.sfxVol = aclamp(v, 0, 1);
    if (this.sfxBus) this.sfxBus.gain.value = this.sfxVol;
  }

  update(dt, hour = 8) {
    this.hour = hour;
    if (!this.ready) return;
    this.syncSampleMusic();
    if (this.sampleEl) return;
    if (this.muted || !this.musicOn) return;
    const T = TRACKS[this.track] || TRACKS.hearth;
    const night = T.prog === 'night' || hour >= 20 || hour < 5.2;
    const chords = CHORDS[T.prog] || CHORDS.cozy;
    const beatLen = T.beat;
    const root = T.root;
    this.root = root;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer += beatLen;

    const b = this.beat;
    const chord = chords[this.chord % chords.length];
    this.chord = Math.floor(b / 8) % chords.length;

    // pad swells every two bars
    if (b % 8 === 0) {
      const notes = chord.map((n) => root + n + 12);
      this.pad(notes, beatLen * 8.4, { gain: T.pad });
      this.bass(root + chord[0]);
    }
    if (T.drone && b % 32 === 0) {
      this.tone({ freq: midi(root - 12), dur: beatLen * 14, gain: 0.05, type: 'sine',
        attack: 1.2, decay: beatLen * 14, music: true, send: 0.4 });
    }

    // sparse piano melody, chord tones with rests
    const scalar = [...chord.map((n) => root + n + 24), ...PENTA.map((n) => root + n + 12)];
    if (Math.random() < T.density) {
      const note = scalar[Math.floor(Math.random() * scalar.length)];
      const pan = arand(-0.35, 0.35);
      if (Math.random() < (T.bells || 0.2)) this.bell(note + 12, { gain: 0.028, pan, music: true });
      else this.piano(note, { gain: night ? 0.055 : 0.07, dur: arand(1.6, 2.8), pan });
    }
    // a second voice a little late, like a duet
    if (Math.random() < T.ornament) {
      const note = scalar[Math.floor(Math.random() * scalar.length)];
      if (T.marimba && Math.random() < T.marimba) {
        this.marimba(note, { gain: 0.035, delay: beatLen * 0.5, music: true, pan: arand(-0.4, 0.4) });
      } else {
        this.piano(note + 12, { gain: 0.03, dur: 1.2, delay: beatLen * 0.5, music: true, pan: arand(-0.4, 0.4) });
      }
    }
    if (T.drums) this.drums(T.drums, beatLen);
    if (T.guitar && b % 2 === 0) {
      this.guitar(root + chord[0] - 12, beatLen * 1.15);
    }
    if (T.arp && b % 4 === 2) {
      const arp = chord.map((n) => root + n + 24);
      arp.forEach((n, i) => this.marimba(n, { gain: 0.022, delay: i * beatLen * 0.12, music: true }));
    }
    if (T.hiss && b % 8 === 0) {
      this.noise({ dur: 3.2, gain: 0.012, freq: 2600, sweep: 0.5, type: 'bandpass', music: true, send: 0.6 });
    }
    if (b % 16 === 6 && Math.random() < 0.5) {
      this.noise({ dur: 2.4, gain: 0.014, freq: 900, sweep: 0.4, type: 'bandpass', music: true, send: 0.8 });
    }
    this.beat = (b + 1) % 64;
  }

  /** a struck note for the jam mode */
  jam(note, instrument = 'lyre') {
    switch (instrument) {
      case 'koto': this.pluck(note, { gain: 0.11 }); break;
      case 'bell': this.bell(note, { gain: 0.08, music: false }); break;
      case 'flute': this.flute(note, { gain: 0.08, dur: 0.9 }); break;
      case 'drum': this.noise({ dur: 0.2, gain: 0.12, freq: 220, sweep: 0.5, type: 'lowpass' }); break;
      default: this.marimba(note, { gain: 0.1 }); break;
    }
  }
}
