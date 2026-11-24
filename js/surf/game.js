/* =========================================================================
   SURFN 2000 — game orchestration.
   Screens, career, competitive heats, the endless post-game league, waves,
   gates, relics, rivals and all the baked-in 2000s nonsense.
   ========================================================================= */
import {
  Screen, Input, Camera, Particles, AudioEngine, VIEW,
  drawText, isoX, isoY, clamp, rand, pick,
} from '../engine/core.js';
import { Art } from './art.js';
import { Sea, drawSparkles } from './sea.js';
import { Rider, RIVAL_TINT } from './rider.js';
import { UI } from './ui.js';
import {
  CAST, CHAPTERS, POSTGAME_HEATS, HEAT, RELICS, RELIC_ORDER, RANKS, NEWS,
  BAIL_LINES, COMBO_LINES, GATE_LINES, RELIC_LINES, STORM_LINES, TRICKS,
  COMP_BANTER, LEGEND_CHAPTERS, HANGOUTS, ISLANDS, WORLD_QUESTS,
  SANDBOX_NPCS, NPC_TALK, CUTSCENES, SEASONS, NPC_CHATTER,
  SANDBOX_JOBS, SANDBOX_COLLECTIBLES, EVENTS, BONUS_STAGES, COMMUNITY_LINES,
  MILESTONE_LINES, HOLIDAYS, TAPES, ACHIEVEMENTS,
} from './story.js';
import { MAPS, MAP_ORDER, MAP_META, THEMES, getMap } from './maps.js';
import { Mods } from './mods.js';
import { DIALOGUE } from './dialogues.js';
import { TEXT } from './locale_text.js';
import {
  setLocale, cycleLocale, languageLabel as localeLabel, registerLexicon,
} from '../engine/i18n.js';
import { Minigames, MINIGAMES } from './minigames.js';

const SAVE_KEY = 'surfn-2000-save-v1';

const DEFAULT_SETTINGS = {
  musicVol: 0.4, sfxVol: 0.5, muted: false, shake: true,
  scanlines: true, minimap: true, banter: true, quality: 'auto', rev: 2,
  locale: 'auto',
};

const TAUNTS = [
  'Zel: "Isso aqui é uma lan house ou um aquário?"',
  'Zel: "Meu modem discado é mais rápido que isso."',
  'Zel: "Kaká, seu nick tem cheiro de 2005."',
  'Zel: "Ó o lag batendo na porta."',
  'Zel: "Se eu cair, foi de propósito. Igual no Orkut."',
];

// Habbofont floor textures, one per map character and theme. Water, walls and
// ramps keep their animated surf art; everything walkable gets a Habbo tile.
const HABBO_FLOORS = {
  town:   { g: 'grass', r: 'stone', p: 'classic', d: 'wood', f: 'wood', G: 'metal', S: 'cork', t: 'bathroom' },
  pool:   { D: 'bathroom', d: 'bathroom', P: 'wood', f: 'wood', g: 'grass', S: 'cork', G: 'metal', r: 'stone' },
  ice:    { D: 'bathroom', d: 'bathroom', P: 'wood', f: 'wood', g: 'stone', S: 'cork', G: 'metal', r: 'stone', I: 'ice' },
  sun:    { D: 'wood', d: 'wood', P: 'wood', f: 'wood', g: 'grass', S: 'cork', G: 'metal', r: 'stone' },
  dust:   { D: 'wood', d: 'wood', P: 'wood', f: 'wood', g: 'cork', S: 'cork', G: 'metal', r: 'stone' },
  storm:  { D: 'metal', d: 'metal', P: 'wood', f: 'wood', g: 'stone', S: 'cork', G: 'metal', r: 'stone' },
  night:  { D: 'goth', d: 'goth', P: 'wood', f: 'wood', g: 'stone', S: 'cork', G: 'metal', r: 'stone' },
  glitch: { D: 'metal', d: 'metal', P: 'metal', f: 'metal', g: 'abstract', S: 'abstract', G: 'metal', r: 'abstract' },
};

const HABBO_PROPS = {
  chair: 'chair', barrel: 'barrel', crate: 'crate', tree_palm: 'palm',
  plant: 'asian-tree', hoop: 'hoop', tiki: 'tiki-lamps', hammock: 'hammock',
};

const HABBO_PROP_SCALE = {
  chair: 0.42, 'pool-chair': 0.38, barrel: 0.38, 'grunge-barrel': 0.5,
  crate: 0.33, palm: 0.45, 'asian-tree': 0.3, hoop: 0.55,
  'tiki-lamps': 0.25, hammock: 0.33,
};

export class Game {
  constructor(canvas) {
    this.screen = new Screen(canvas);
    this.input = new Input(this.screen);
    this.camera = new Camera();
    this.particles = new Particles();
    this.audio = new AudioEngine();
    this.art = new Art();
    this.sea = new Sea();
    this.ui = new UI(this.art);
    this.minigames = new Minigames(this);
    this.chapterBoost = null;

    this.screenName = 'boot';
    this.time = 0;
    this.last = performance.now();
    this.loadP = 0;
    this.crashed = null;

    this.save = this.freshSave();
    this.mods = new Mods(this);
    this.settings = { ...DEFAULT_SETTINGS };
    this.musicVol = this.settings.musicVol;
    this.sfxVol = this.settings.sfxVol;
    this.muted = false;

    this.menuIndex = 0;
    this.careerIndex = 0;
    this.mapIndex = 0;
    this.worldIndex = 0;
    this.postIndex = 0;
    this.optIndex = 0;
    this.galleryTab = 0;
    this.pauseIndex = 0;
    this.remixIndex = 0;
    this.menuRun = null;
    this.menuMapIdx = 0;
    this.tapeIndex = 0;
    this.tapePlaying = false;
    this.tapeTrack = null;
    this.typeBuf = '';
    this.pendingAchievements = [];
    this.resetConfirm = 0;
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
    const hq = q?.get('holiday');
    this.holidayOverride = HOLIDAYS.some((h) => h.id === hq) ? hq : null;
    this.dateOverride = /^\d{4}-\d{2}-\d{2}$/.test(q?.get('date') || '') ? q.get('date') : null;
    this.titleTheme = THEMES.pool;
    this.run = null;
    this.result = null;
    this.countdown = 0;
    this.tauntCd = 0;
    this.tickerCache = '';
    this.tickerAt = -99;
    this.fade = 0;
    this.league = null;
    this.clock = { day: 1, min: 18 * 60, season: 0 };
    this.sandboxChatter = 0;

    // Performance tier: 0 = potato (640x360, no weather, no menu race),
    // 1 = mid, 2 = full. 'auto' measures the first seconds and then decides.
    this.perfLevel = 2;
    this.autoLevel = null;
    this.perfSamples = [];
    this.perfChecked = false;
  }

  qualityLabel() {
    const names = { low: 'BAIXO', med: 'MÉDIO', high: 'ALTO' };
    if (this.settings.quality === 'auto') {
      return `AUTO (${names[['low', 'med', 'high'][this.perfLevel]] || 'ALTO'})`;
    }
    return names[this.settings.quality] || 'AUTO';
  }

  languageLabel() { return localeLabel(); }

  applyPerf(mode = this.settings.quality, silent = false) {
    const fixed = { low: 0, med: 1, high: 2 };
    const level = fixed[mode] !== undefined ? fixed[mode] : (this.autoLevel ?? 2);
    this.perfLevel = level;
    // The pixel-art grid is fixed now, so quality only trims the display
    // backing store plus particles and sea density on weak machines.
    this.screen.dprCap = level === 0 ? 1 : level === 1 ? 1.5 : 2;
    this.particles.cap = level === 0 ? 120 : level === 1 ? 280 : 520;
    this.sea.setDensity(level === 0 ? 0.25 : level === 1 ? 0.6 : 1);
    this.screen.resize();
    if (!silent) this.ui.toast(`Qualidade: ${this.qualityLabel()}`, '#8fd3e8');
  }

  /* ------------------------------------------------------------------ save */
  freshSave() {
    return {
      v: 1,
      chapters: 0,
      best: {},
      relics: [],
      xp: 0,
      runs: 0,
      bestCombo: 0,
      milestones: 0,
      bestMilestone: 0,
      postgame: false,
      leagueBest: 0,
      leagueStreak: 0,
      leagueWins: 0,
      quests: {},
      hangouts: {},
      events: {},
      eventsDone: 0,
      bonus: {},
      bonusDaily: '',
      modems: [],
      legend: 0,
      legendDone: false,
      choices: {},
      visited: [],
      relationships: { naldo: 0, bruxa: 0, kaka: 0, ze: 0 },
      world: {
        day: 1, min: 18 * 60, season: 0, energy: 100, food: 100, water: 100,
        money: 25, weather: 'dusk', hours: 0,
      },
      sandbox: {
        x: null, y: null, job: null, completedJobs: [], collectibles: [],
        materials: { wood: 0, metal: 0, cloth: 0, chips: 0 },
        arcadeHigh: 0, arcadePlays: 0, searches: [], days: 1,
      },
      community: { board: [], best: {}, challenge: '' },
      mods: [],
      holidays: {},
      achievements: [],
      tapes: [],
      eggs: [],
      minigames: {},
      minigameClears: {},
      lifetime: { gates: 0, relics: 0, bails: 0, score: 0 },
      daily: { key: '', done: false, last: '', streak: 0, best: 0 },
      settings: {},
    };
  }

  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      this.save = { ...this.freshSave(), ...s };
      this.save.best = s.best || {};
      this.save.relics = Array.isArray(s.relics) ? s.relics : [];
      this.save.quests = s.quests && typeof s.quests === 'object' ? s.quests : {};
      this.save.hangouts = s.hangouts && typeof s.hangouts === 'object' ? s.hangouts : {};
      this.save.choices = s.choices && typeof s.choices === 'object' ? s.choices : {};
      this.save.visited = Array.isArray(s.visited) ? s.visited : [];
      const defaults = this.freshSave();
      this.save.holidays = s.holidays && typeof s.holidays === 'object' ? s.holidays : {};
      this.save.achievements = Array.isArray(s.achievements) ? s.achievements : [];
      this.save.tapes = Array.isArray(s.tapes) ? s.tapes : [];
      this.save.eggs = Array.isArray(s.eggs) ? s.eggs : [];
      this.save.minigames = s.minigames && typeof s.minigames === 'object' ? s.minigames : {};
      this.save.minigameClears = s.minigameClears && typeof s.minigameClears === 'object'
        ? s.minigameClears : {};
      this.save.lifetime = { ...defaults.lifetime, ...(s.lifetime || {}) };
      this.save.daily = { ...defaults.daily, ...(s.daily || {}) };
      this.save.relationships = { ...defaults.relationships, ...(s.relationships || {}) };
      this.save.world = { ...defaults.world, ...(s.world || {}) };
      this.save.sandbox = { ...defaults.sandbox, ...(s.sandbox || {}) };
      this.save.sandbox.materials = { ...defaults.sandbox.materials, ...(s.sandbox?.materials || {}) };
      this.save.sandbox.collectibles = Array.isArray(s.sandbox?.collectibles) ? s.sandbox.collectibles : [];
      this.save.sandbox.completedJobs = Array.isArray(s.sandbox?.completedJobs) ? s.sandbox.completedJobs : [];
      this.save.sandbox.searches = Array.isArray(s.sandbox?.searches) ? s.sandbox.searches : [];
      this.save.community = { ...defaults.community, ...(s.community || {}) };
      this.save.community.board = Array.isArray(s.community?.board) ? s.community.board.slice(0, 12) : [];
      this.save.mods = Array.isArray(s.mods) ? s.mods : [];
      const w = this.save.world;
      this.clock = {
        day: Math.max(1, w.day || 1),
        min: Number.isFinite(w.min) ? w.min : 18 * 60,
        season: w.season || 0,
      };
      this.save.legend = Number(s.legend) || 0;
      this.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
      // v1 shipped a painfully loud mix; quietly pull legacy saves down once.
      if ((s.settings?.rev || 1) < 2) {
        this.settings.musicVol = Math.min(this.settings.musicVol, 0.4);
        this.settings.sfxVol = Math.min(this.settings.sfxVol, 0.5);
      }
      this.settings.rev = 2;
    } catch { /* corrupted save, start fresh */ }
  }

  persist() {
    this.save.settings = {
      musicVol: this.musicVol, sfxVol: this.sfxVol, muted: this.muted, rev: 2,
      shake: this.settings.shake, scanlines: this.settings.scanlines,
      minimap: this.settings.minimap, banter: this.settings.banter,
      quality: this.settings.quality, locale: this.settings.locale || 'auto',
    };
    if (this.run?.def?.flow === 'sandbox' && this.run.needs) {
      const w = this.save.world;
      w.day = this.clock.day;
      w.min = Math.round(this.clock.min);
      w.season = this.clock.season;
      w.energy = Math.round(this.run.needs.energy);
      w.food = Math.round(this.run.needs.food);
      w.water = Math.round(this.run.needs.water);
      w.weather = this.run.weather || w.weather;
      const sb = this.save.sandbox;
      if (this.run.player) { sb.x = this.run.player.x; sb.y = this.run.player.y; }
      sb.job = this.run.job
        ? { id: this.run.job.id, progress: this.run.job.progress }
        : null;
      if (this.run.hunt) sb.collectibles = this.run.hunt.filter((c) => c.taken).map((c) => c.id);
      sb.days = this.clock.day;
    }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch { /* private mode */ }
  }

  resetProgress() {
    this.save = this.freshSave();
    this.mods = new Mods(this);
    this.mods.load();
    this.clock = { day: 1, min: 18 * 60, season: 0 };
    this.persist();
    this.menuIndex = 0;
    this.careerIndex = 0;
    this.worldIndex = 0;
    this.postIndex = 0;
    this.ui.toast('Progresso zerado. A internet agradece.', '#ff9f9f');
    this.setScreen('main');
  }

  /* -------------------------------------------------------------- lifecycle */
  async boot() {
    this.loadSave();
    registerLexicon(DIALOGUE);
    registerLexicon(TEXT);
    setLocale(this.settings.locale || 'auto');
    this.mods = new Mods(this);
    this.mods.load();
    this.musicVol = this.settings.musicVol;
    this.sfxVol = this.settings.sfxVol;
    this.muted = !!this.settings.muted;
    this.audio.setMusicVolume(this.musicVol);
    this.audio.setSfxVolume(this.sfxVol);
    this.audio.setMuted(this.muted);
    await this.art.load((p) => { this.loadP = p; });
    this.loadP = 1;
    this.careerIndex = clamp(this.save.chapters, 0, CHAPTERS.length - 1);
    this.syncTapes(true);
    this.checkAchievements({}, true);
    if (this.save.daily.key !== this.todayKey()) this.save.daily.done = false;
    this.setScreen('title', true);
    this.sea.reset('sun');
    window.addEventListener('keydown', () => this.audio.ensure(), { once: true });
    window.addEventListener('mousedown', () => this.audio.ensure(), { once: true });
    this.applyPerf(this.settings.quality, true);
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0);
    this.last = now;
    this.samplePerf(dt);
    try {
      if (!this.crashed) {
        this.time += dt;
        this.update(dt);
        this.render();
      } else {
        this.drawCrash(this.screen.ctx2);
      }
    } catch (err) {
      if (!this.crashed) console.error(err);
      this.crashed = String((err && err.stack) || err);
    }
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  /* Watch the first ~90 frames once and drop the quality tier if the machine
     cannot hold the target. A manual choice in OPÇÕES always wins. */
  samplePerf(dt) {
    if (this.perfChecked || this.screenName === 'boot') return;
    this.perfWarm = (this.perfWarm || 0) + 1;
    if (this.perfWarm < 15) return; // ignore the first paints and the GC spike
    this.perfSamples.push(dt);
    if (this.perfSamples.length < 100) return;
    this.perfChecked = true;
    // median, not mean: one 2-second stall must not condemn a good machine
    const sorted = this.perfSamples.slice().sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.perfSamples.length = 0;
    this.autoLevel = median > 0.040 ? 0 : median > 0.026 ? 1 : 2;
    if (this.settings.quality === 'auto') this.applyPerf('auto', true);
  }

  drawCrash(ctx) {
    ctx.fillStyle = 'rgba(11,16,38,0.95)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    drawText(ctx, 'O MODEM CAIU', VIEW.W / 2, 60, {
      size: 16, color: '#ff8f6b', align: 'center', shadow: '#1b1728',
    });
    drawText(ctx, 'Seu save está safe. Recarregue a página (F5).', VIEW.W / 2, 88, {
      size: 8, color: '#fbeec8', align: 'center',
    });
    const msg = (this.crashed || '').split('\n').slice(0, 4).join(' ').slice(0, 220);
    drawText(ctx, msg, VIEW.W / 2, 120, { size: 6, color: '#9aa2b3', align: 'center' });
  }

  /* Only the title and the main menu show the live demo race. Every other
     menu used to simulate a whole island behind a 60%-opaque shade, which is
     where most of the menu stutter came from. */
  demoScreen(name = this.screenName) {
    return name === 'title' || name === 'main';
  }

  cinematicScreen(name = this.screenName) {
    return !['boot', 'play', 'paused', 'results', 'wallpaper', 'minigames'].includes(name);
  }

  setScreen(name, silent) {
    if (this.screenName === 'tape' && name !== 'tape') {
      this.tapePlaying = false;
      this.audio.musicOn = true;
    }
    this.screenName = name;
    this.screenT = 0;
    if (this.demoScreen(name)) this.startMenuRun();
    if (name === 'tape') this.openTape();
    if (!silent) this.audio.sfx('ui');
    if (name === 'career') this.careerIndex = clamp(this.careerIndex, 0, CHAPTERS.length - 1);
    if (name === 'world') this.worldIndex = clamp(this.worldIndex, 0, ISLANDS.length - 1);
    if (name === 'post') this.postIndex = clamp(this.postIndex, 0, this.postActions().length - 1);
    if (name === 'options') this.resetConfirm = 0;
  }

  /* --------------------------------------------------------------- utilities */
  chapterUnlocked(i) { return i >= 0 && i <= this.save.chapters; }
  minigameCleared(chapterId) { return !!(this.save.minigameClears || {})[chapterId]; }

  openMinigame(id, opts = {}) {
    this.setScreen('minigames', true);
    this.minigames.open(id, opts);
  }

  leaveMinigames() {
    const back = this.minigames.menuReturn === 'play' ? 'play' : 'main';
    this.setScreen(back);
  }

  /** Called by the arcade when a session ends: records, XP and story routing. */
  minigameDone(res) {
    if (!res || !res.id) return;
    // the skip leaves every counter, record and bonus untouched: it only opens
    // the chapter, so clearing or failing later still reads the same as before
    if (res.skip) {
      const skipped = res.chapterIndex != null ? CHAPTERS[res.chapterIndex] : null;
      this.minigames.showMenu(res.returnTo === 'play' ? 'play' : 'main');
      this.chapterBoost = null;
      if (skipped) {
        this.careerIndex = res.chapterIndex;
        this.ui.toast('Prova pulada. Sem XP, sem recorde, sem bônus — o mar continua.', '#8fd3e8', 4.4);
        this.startChapter(res.chapterIndex);
      } else {
        this.setScreen(res.returnTo === 'play' ? 'play' : 'minigames', true);
      }
      return;
    }
    const def = MINIGAMES.find((m) => m.id === res.id);
    this.save.minigames = this.save.minigames || {};
    this.save.minigameClears = this.save.minigameClears || {};
    const rec = this.save.minigames[res.id]
      || (this.save.minigames[res.id] = { best: 0, wins: 0, plays: 0 });
    rec.plays = (rec.plays || 0) + 1;
    rec.best = Math.max(rec.best || 0, res.score || 0);
    let xp = 0;
    if (res.won) {
      rec.wins = (rec.wins || 0) + 1;
      xp = rec.wins === 1 ? 120 : 45;
      this.save.xp += xp;
    }
    this.persist();
    const chapter = res.chapterIndex != null ? CHAPTERS[res.chapterIndex] : null;
    const mg = chapter?.minigame;
    if (chapter && mg) {
      if (res.won) {
        this.save.minigameClears[chapter.id] = true;
        this.chapterBoost = {
          chapter: res.chapterIndex, kind: mg.bonus || 'score', value: mg.value || 600,
        };
        this.careerIndex = res.chapterIndex;
        this.persist();
        this.audio.sfx('quest');
        this.ui.toast(`PROVA VENCIDA: ${mg.name} · +${xp} XP. Agora o mar.`, '#8ecf63', 4.5);
        this.startChapter(res.chapterIndex);
        return;
      }
      this.careerIndex = res.chapterIndex;
      this.setScreen('career', true);
      this.ui.toast(`A prova (${mg.name}) não caiu. Tenta de novo.`, '#ff9f9f', 4);
      return;
    }
    const back = res.returnTo === 'play' ? 'play' : 'minigames';
    this.minigames.showMenu(res.returnTo === 'play' ? 'play' : 'main');
    this.setScreen(back, true);
    this.ui.toast(res.won
      ? `${def?.title || 'MINIGAME'} VENCIDO · +${xp} XP`
      : `${def?.title || 'MINIGAME'}: ${res.score} pts. Tenta de novo.`,
    res.won ? '#8ecf63' : '#9aa2b3', 4);
  }
  mapUnlocked(id) { return MAP_ORDER.indexOf(id) <= this.save.chapters; }
  rankIndex() {
    let idx = 0;
    RANKS.forEach((r, i) => { if (this.save.xp >= r.xp) idx = i; });
    return idx;
  }
  rankName() { return RANKS[this.rankIndex()].name; }
  rankProgress() {
    const idx = this.rankIndex();
    if (idx >= RANKS.length - 1) return 1;
    const a = RANKS[idx].xp, b = RANKS[idx + 1].xp;
    return clamp((this.save.xp - a) / (b - a), 0, 1);
  }
  nextRankText() {
    const idx = this.rankIndex();
    if (idx >= RANKS.length - 1) return 'ranking máximo';
    return `${RANKS[idx + 1].xp - this.save.xp} XP pro próximo`;
  }
  goalText(c, suffix = '') {
    const g = c.goal;
    let text = 'Sobreviva';
    if (g.type === 'score') text = `Faça ${g.value} pontos`;
    else if (g.type === 'gates') text = `Passe ${g.value} gates`;
    else if (g.type === 'relics') text = `Colete ${g.value} relíquias`;
    else if (g.type === 'pipa') text = `Corte ${g.value} pipas rivais`;
    else if (g.type === 'surf') text = `Surfe ${g.value} ondas clássicas`;
    else if (g.type === 'flags') text = `Capture ${g.value} bandeiras`;
    else if (g.type === 'team') text = `Faça ${g.value} pontos com o time`;
    else if (g.type === 'place') text = 'Termine em 1º lugar';
    if (suffix && g.type !== 'place') text += suffix;
    if (c.minigame) text += ` · ${c.minigame.short}`;
    return text;
  }
  starsFor(id) { return this.save.best['ch:' + id]?.stars || 0; }
  bestOf(id) { return this.save.best['ch:' + id]?.score || 0; }
  mapBest(id) { return this.save.best['map:' + id]?.score || 0; }
  heatBest(i) { return this.save.best['heat:' + i]?.score || 0; }

  tickerFeed() {
    if (this.time - this.tickerAt < 24 && this.tickerCache) return this.tickerCache;
    this.tickerAt = this.time;
    const seed = Math.floor(this.time / 24);
    const out = [];
    for (let i = 0; i < 4; i++) out.push(NEWS[(seed * 7 + i * 3) % NEWS.length]);
    this.tickerCache = out;
    return out;
  }

  milestoneTitle(k) {
    const titles = ['RADICAL!', 'MEGA RADICAL!', 'ULTRA RADICAL!', 'INSANO!',
      'SEM FREIO!', 'LENDÁRIO 2000!', 'ALÉM DO MODEM!'];
    return titles[Math.min(Math.max(0, k - 1), titles.length - 1)];
  }

  /* --------------------------------------------------------- long-term play */
  currentDate() {
    if (this.dateOverride) {
      const d = new Date(this.dateOverride + 'T12:00:00');
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }

  dateKey(d = this.currentDate()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  todayKey() { return this.dateKey(this.currentDate()); }

  yesterdayKey() {
    const d = this.currentDate();
    d.setDate(d.getDate() - 1);
    return this.dateKey(d);
  }

  easterDate(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 304);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month, day };
  }

  nthWeekday(year, month, weekday, nth) {
    const first = new Date(year, month, 1);
    const delta = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + delta + (nth - 1) * 7);
  }

  holidayOn(date = this.currentDate()) {
    const y = date.getFullYear();
    for (const h of HOLIDAYS) {
      if (h.easter) {
        const e = this.easterDate(y);
        const span = h.span || 3;
        const start = new Date(y, e.month, e.day - span);
        const end = new Date(y, e.month, e.day + span);
        if (date >= start && date <= end) return h;
        continue;
      }
      if (h.nth) {
        const base = this.nthWeekday(y, h.nth.month, h.nth.weekday, h.nth.nth);
        const span = h.nth.span || 3;
        const start = new Date(y, base.getMonth(), base.getDate() - span);
        const end = new Date(y, base.getMonth(), base.getDate() + span);
        if (date >= start && date <= end) return h;
        continue;
      }
      if (!h.range) continue;
      const [[sm, sd], [em, ed]] = h.range;
      for (const yy of [y, y - 1]) {
        const start = new Date(yy, sm, sd);
        let end = new Date(yy, em, ed);
        if (end < start) end = new Date(yy + 1, em, ed);
        if (date >= start && date <= end) return h;
      }
    }
    return null;
  }

  activeHoliday() {
    if (this.holidayOverride) return HOLIDAYS.find((h) => h.id === this.holidayOverride) || null;
    return this.holidayOn(this.currentDate());
  }

  nextHoliday() {
    const now = this.currentDate();
    for (let i = 0; i <= 370; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const h = this.holidayOn(d);
      if (h) return { holiday: h, days: i };
    }
    return null;
  }

  holidayDone(h) {
    return this.save.holidays?.[h.id] === String(this.currentDate().getFullYear());
  }

  dailyDone() {
    return !!this.save.daily?.done && this.save.daily.key === this.todayKey();
  }

  dailyDef() {
    const key = this.todayKey();
    let seed = 2166136261;
    for (const ch of key) {
      seed ^= ch.charCodeAt(0);
      seed = Math.imul(seed, 16777619) >>> 0;
    }
    const maps = ['fy_pool_day', 'surf_lagoon', 'fy_iceworld', 'de_surf_dust',
      'pool_temple', 'cs_surf_assault', 'surf_heaven'];
    const modes = [
      { id: 'score', tag: 'PONTOS', goal: (v) => ({ type: 'score', value: 3500 + (v % 18) * 250 }) },
      { id: 'gates', tag: 'GATES', goal: (v) => ({ type: 'gates', value: 10 + (v % 10) }) },
      { id: 'relics', tag: 'RELÍQUIAS', goal: (v) => ({ type: 'relics', value: 6 + (v % 4) }) },
      { id: 'pipa', tag: 'PIPAS', goal: (v) => ({ type: 'pipa', value: 4 + (v % 4) }) },
      { id: 'surf', tag: 'SURF CLÁSSICO', goal: (v) => ({ type: 'surf', value: 6 + (v % 4) }) },
    ];
    const modPool = [[], ['rogue'], ['chaos'], ['glitch'], ['rogue', 'chaos']];
    const map = maps[seed % maps.length];
    const mode = modes[(seed >>> 3) % modes.length];
    return {
      key, map, mode: mode.id, tag: mode.tag, goal: mode.goal(seed >>> 5),
      duration: 130 + ((seed >>> 7) % 50),
      mods: modPool[(seed >>> 9) % modPool.length],
      ai: 2 + ((seed >>> 11) % 4),
      rivals: 2 + ((seed >>> 15) % 2),
      xp: 250 + ((seed >>> 13) % 160),
    };
  }

  tapeList() { return TAPES; }
  tapeUnlocked(id) { return (this.save.tapes || []).includes(id); }

  tapeUnlockMet(u) {
    if (!u) return false;
    if (u.free) return true;
    if (u.chapters !== undefined) return (this.save.chapters || 0) >= u.chapters;
    if (u.relics !== undefined) return this.save.relics.length >= u.relics;
    if (u.runs !== undefined) return (this.save.runs || 0) >= u.runs;
    if (u.combo !== undefined) return (this.save.bestCombo || 0) >= u.combo;
    if (u.legend !== undefined) return (this.save.legend || 0) >= u.legend;
    if (u.dailyStreak !== undefined) return (this.save.daily?.streak || 0) >= u.dailyStreak;
    if (u.holiday) return !!this.save.holidays?.[u.holiday];
    if (u.secret) return (this.save.eggs || []).includes('tape');
    return false;
  }

  tapeUnlockText(u) {
    if (!u) return '???'; // easter egg
    if (u.free) return 'já destravada';
    if (u.chapters !== undefined) return `vença ${u.chapters} capítulos`;
    if (u.relics !== undefined) return `ache ${u.relics} relíquias`;
    if (u.runs !== undefined) return `termine ${u.runs} runs`;
    if (u.combo !== undefined) return `combo x${u.combo}`;
    if (u.legend !== undefined) return `vença a lenda ${u.legend}`;
    if (u.dailyStreak !== undefined) return `${u.dailyStreak} dias de desafio`;
    if (u.holiday) {
      const h = HOLIDAYS.find((x) => x.id === u.holiday);
      return h ? `complete ${h.name}` : 'complete uma festa';
    }
    if (u.secret) return '??? escondido no jogo';
    return '???'; // easter egg
  }

  unlockTape(id, silent = false) {
    const t = TAPES.find((x) => x.id === id);
    if (!t || this.save.tapes.includes(id)) return false;
    this.save.tapes.push(id);
    if (!silent) {
      this.ui.toast(`FITA DESBLOQUEADA: ${t.title}`, '#ffe066', 4);
      this.ui.showBanner('NOVA FITA', t.title, '#ffe066', 2.2);
      this.audio.sfx('unlock');
    }
    this.persist();
    return true;
  }

  syncTapes(silent = false) {
    let changed = false;
    for (const t of TAPES) {
      if (this.save.tapes.includes(t.id)) continue;
      if (!this.tapeUnlockMet(t.unlock)) continue;
      this.save.tapes.push(t.id);
      changed = true;
      if (!silent) {
        this.ui.toast(`FITA DESBLOQUEADA: ${t.title}`, '#ffe066', 4);
        this.audio.sfx('unlock');
      }
    }
    if (changed) this.persist();
    return changed;
  }

  achievementMet(a, ctx = {}) {
    switch (a.kind) {
      case 'runs': return (this.save.runs || 0) >= a.value;
      case 'combo': return Math.max(this.save.bestCombo || 0, ctx.combo || 0) >= a.value;
      case 'milestone': return (this.save.bestMilestone || 0) >= a.value;
      case 'gates': return (this.save.lifetime?.gates || 0) >= a.value;
      case 'relics': return this.save.relics.length >= a.value;
      case 'chapters': return (this.save.chapters || 0) >= a.value;
      case 'legend': return (this.save.legend || 0) >= a.value;
      case 'dailyStreak': return (this.save.daily?.streak || 0) >= a.value;
      case 'holidays': return Object.keys(this.save.holidays || {}).length >= a.value;
      case 'tapes': return this.save.tapes.length >= a.value;
      case 'eggs': return (this.save.eggs || []).length >= a.value;
      case 'bonus': return Object.keys(this.save.bonus || {}).length >= a.value;
      case 'modems': return (this.save.modems || []).length >= a.value;
      case 'events': return Object.keys(this.save.events || {}).length >= a.value;
      case 'score': return (ctx.score || 0) >= a.value;
      default: return false;
    }
  }

  checkAchievements(ctx = {}, silent = false) {
    const got = [];
    for (const a of ACHIEVEMENTS) {
      if (this.save.achievements.includes(a.id)) continue;
      if (!this.achievementMet(a, ctx)) continue;
      this.save.achievements.push(a.id);
      this.save.xp += a.xp || 50;
      got.push(a);
    }
    if (got.length) {
      if (!silent) {
        this.ui.showBanner('CONQUISTA', got[0].title, '#8ecf63', 2.4);
        this.ui.toast(`CONQUISTA: ${got[0].title} +${got[0].xp} XP`, '#8ecf63', 4);
        for (const g of got.slice(1)) this.ui.toast(`+ ${g.title}`, '#8ecf63', 3);
        this.audio.sfx('achievement');
      }
      this.persist();
    }
    return got;
  }

  typedWord(word) {
    this.typeBuf = ((this.typeBuf || '') + (this.input.typed || '')).slice(-24).toUpperCase();
    return this.typeBuf.includes(word);
  }

  foundEgg(id) {
    this.save.eggs = this.save.eggs || [];
    if (this.save.eggs.includes(id)) return false;
    this.save.eggs.push(id);
    this.save.xp += 200;
    this.ui.showBanner('SEGREDO 2000', 'ovo de páscoa encontrado', '#b07cff', 2.4);
    this.ui.toast('Você achou um segredo escondido. +200 XP.', '#b07cff', 4);
    this.audio.sfx('achievement');
    if (id === 'tape') this.unlockTape('tape_secret');
    if (id === 'bonus') {
      this.save.xp += 300;
      this.ui.showBanner('FASE SECRETA', 'A FASE QUE NÃO EXISTE', '#ff8f6b', 3.6);
      this.ui.toast('BÔNUS: a fase escondida abriu no ARQUIVO 2000.', '#ff8f6b', 5);
    }
    this.checkAchievements();
    this.persist();
    return true;
  }

  openTape() {
    this.syncTapes(true);
    const list = TAPES;
    if (!list.length) return;
    if (!this.tapeUnlocked(list[this.tapeIndex]?.id)) {
      const at = list.findIndex((t) => this.tapeUnlocked(t.id));
      this.tapeIndex = at >= 0 ? at : 0;
    }
    const t = list[this.tapeIndex];
    this.tapeTrack = t && this.tapeUnlocked(t.id) ? t.track : null;
    this.tapePlaying = !!this.tapeTrack;
    this.audio.ensure();
    if (this.tapeTrack) this.audio.forceTrack(this.tapeTrack);
    this.audio.sfx('tape');
  }

  selectTape(i) {
    const list = TAPES;
    if (!list.length) return;
    this.tapeIndex = ((i % list.length) + list.length) % list.length;
    const t = list[this.tapeIndex];
    if (!t || !this.tapeUnlocked(t.id)) { this.audio.sfx('deny'); return; }
    this.tapeTrack = t.track;
    if (this.tapePlaying) this.audio.forceTrack(t.track);
    this.audio.sfx('reel');
  }

  toggleTape() {
    const t = TAPES[this.tapeIndex];
    if (!t || !this.tapeUnlocked(t.id)) { this.audio.sfx('deny'); return; }
    this.tapePlaying = !this.tapePlaying;
    this.audio.musicOn = this.tapePlaying;
    if (this.tapePlaying) {
      this.audio.ensure();
      this.audio.forceTrack(t.track);
      this.audio.sfx('tape');
    } else this.audio.sfx('ui');
  }

  updateTape() {
    const i = this.input;
    if (i.hit('ArrowUp', 'ArrowLeft', 'KeyA')) this.selectTape(this.tapeIndex - 1);
    if (i.hit('ArrowDown', 'ArrowRight', 'KeyD', 'KeyN')) this.selectTape(this.tapeIndex + 1);
    if (i.hit('Enter', 'Space')) this.toggleTape();
    if (this.typedWord('2000')) this.foundEgg('tape');
    if (i.hit('Escape', 'KeyE')) { this.setScreen('main'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (!id) return;
      if (id === 'tape:back') { this.setScreen('main'); return; }
      if (id === 'tape:play') { this.toggleTape(); return; }
      if (id.startsWith('tape:track:')) {
        const at = Number(id.split(':')[2]);
        this.selectTape(at);
        if (this.tapeUnlocked(TAPES[at]?.id) && !this.tapePlaying) this.toggleTape();
      }
    }
  }

  startDaily() {
    if (this.dailyDone()) {
      this.ui.toast('O desafio de hoje já foi pago. Volta amanhã.', '#9aa2b3', 3);
      this.audio.sfx('deny');
      return;
    }
    const def = this.dailyDef();
    const rivals = HEAT.rivals.slice(0, def.rivals).map((r, k) => ({
      ...r, ai: clamp(def.ai + (k === 0 ? 0 : 1), 1, 7),
    }));
    this.startConfig({
      id: 'daily', title: `DESAFIO DO DIA · ${def.tag}`, mapId: def.map, mode: def.mode,
      duration: def.duration, goal: def.goal, rivals, weather: getMap(def.map).weather,
      mods: def.mods, intro: null, flow: 'daily',
    });
    if (!this.run) return;
    this.run.daily = def;
    this.ui.showBanner('DESAFIO DO DIA', `${def.tag} · ${MAP_META[def.map].label}`, '#8fd3e8', 3);
    this.audio.sfx('festival');
    this.persist();
  }

  startHoliday(id) {
    const h = id ? HOLIDAYS.find((x) => x.id === id) : this.activeHoliday();
    if (!h) {
      this.galleryTab = 3;
      this.setScreen('gallery');
      this.ui.toast('Sem festa hoje. O calendário mostra a próxima.', '#8fd3e8', 4);
      return;
    }
    const rivals = HEAT.rivals.slice(0, h.rivals).map((r, k) => ({
      ...r, ai: clamp(h.ai + (k === 0 ? 0 : 1), 1, 7),
    }));
    this.startConfig({
      id: 'holiday:' + h.id, title: h.name, mapId: h.map, mode: h.mode,
      duration: h.duration, goal: h.goal, rivals, weather: h.weather,
      mods: h.mods, intro: h.intro, flow: 'holiday', tips: h.desc,
    });
    if (!this.run) return;
    this.run.holiday = h;
    this.audio.forceTrack(h.track);
    this.audio.sfx('festival');
    this.ui.showBanner(h.name, h.label, h.color, 3.4);
    this.persist();
  }

  /* ----------------------------------------------------------------- update */
  update(dt) {
    this.screenT += dt;
    const touchOn = this.screenName === 'play' || this.screenName === 'paused';
    if (this._touchOn !== touchOn) {
      this._touchOn = touchOn;
      document.documentElement.classList.toggle('show-touch', touchOn);
    }
    this.sea.update(dt, this.weatherForScreen());
    this.ui.update(dt);
    this.ui.offsetX = this.screen.uiX || 0;
    this.ui.offsetY = this.screen.uiY || 0;
    this.particles.update(dt);
    this.tauntCd = Math.max(0, this.tauntCd - dt);
    if (this.resetConfirm > 0) this.resetConfirm -= dt;
    this.audio.update(dt, this.hourNow());

    if (this.screenName === 'boot') return;
    // Wallpaper captures are intentionally frozen: no HUD, no AI, no input.
    if (this.screenName === 'wallpaper') return;

    if (this.ui.active && this.screenName !== 'play') {
      this.ui.updateDialog(dt, this.input, this.audio);
      return;
    }

    switch (this.screenName) {
      case 'title': this.updateTitle(dt); break;
      case 'main': this.updateMain(dt); break;
      case 'career': this.updateCareer(dt); break;
      case 'maps': this.updateMaps(dt); break;
      case 'world': this.updateWorld(dt); break;
      case 'post': this.updatePost(dt); break;
      case 'gallery': this.updateGallery(dt); break;
      case 'tape': this.updateTape(); break;
      case 'minigames': this.minigames.update(dt); break;
      case 'remix': this.updateRemix(); break;
      case 'options': this.updateOptions(dt); break;
      case 'play': this.updatePlay(dt); break;
      case 'paused': this.updatePaused(dt); break;
      case 'results': this.updateResults(dt); break;
      default: break;
    }
    if (this.demoScreen() && this.perfLevel > 0) this.updateMenuRun(dt);
    this.updateMusic();
  }

  weatherForScreen() {
    if (this.screenName === 'play' || this.screenName === 'paused' ||
        (this.screenName === 'results' && this.run)) {
      return this.run?.weather || this.run?.map?.weather || 'sun';
    }
    if (this.demoScreen() && this.menuRun) return this.menuRun.weather;
    if (this.screenName === 'post' || this.screenName === 'world') return 'glitch';
    return 'sun';
  }

  updateMusic() {
    if (this.screenName === 'tape') {
      this.audio.musicOn = this.tapePlaying;
      if (this.tapeTrack) this.audio.setTrack(this.tapeTrack);
      return;
    }
    const map = {
      title: 'menu2000', main: 'menu2000', career: 'menu2000', maps: 'menu2000',
      world: 'sunset', post: 'boss', gallery: 'sunset', options: 'sunset',
      minigames: 'surfrock', results: 'victory',
    };
    const inRun = (this.screenName === 'play' || this.screenName === 'paused') && this.run;
    const hour = this.hourNow();
    const weather = this.run?.weather || this.run?.map?.weather || 'sun';
    let dynamic = null;
    if (this.screenName === 'main' && this.menuRun) {
      dynamic = this.menuRun.map.themeDef.music || 'surfrock';
    } else if (inRun && this.run.cutscene?.music) {
      dynamic = this.run.cutscene.music;
    } else if (inRun && this.run.def.flow === 'sandbox') {
      if (weather === 'snow') dynamic = 'winter2000';
      else if (weather === 'storm' || weather === 'rain') dynamic = 'rain2000';
      else if (hour >= 20 || hour < 6) dynamic = 'rocknight';
      else dynamic = 'garage2000';
    } else if (inRun && this.run.def.flow === 'holiday' && this.run.holiday) {
      dynamic = this.run.holiday.track;
    } else if (inRun && this.run.def.flow === 'explore') {
      dynamic = weather === 'storm' ? 'storm' : hour >= 20 || hour < 6 ? 'rocknight' : 'surfrock';
    }
    const track = dynamic || (inRun
      ? (this.run.track || this.run.map.themeDef.music || 'surfrock')
      : (map[this.screenName] || 'menu2000'));
    this.audio.setTrack(track);
    this.audio.setMood(this.screenName === 'post' ? 'wild'
      : inRun && (hour >= 20 || hour < 6) ? 'night' : 'bright');
  }

  hourNow() {
    if (this.run && this.run.def.flow === 'sandbox') {
      return ((this.clock.min / 60) % 24 + 24) % 24;
    }
    const w = this.run?.weather || this.run?.map?.weather;
    if (w === 'night' || w === 'glitch') return 22;
    if (w === 'dusk') return 18.5;
    if (w === 'snow') return 15;
    if (w === 'storm') return 17;
    return 12;
  }

  seasonDef() {
    return SEASONS[((this.clock.season % 4) + 4) % 4];
  }

  clockLabel() {
    const h = Math.floor((this.clock.min / 60) % 24);
    const m = Math.floor(this.clock.min % 60 / 10) * 10;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  rollSandboxWeather() {
    const season = this.seasonDef();
    return pick(season.weather) || 'sun';
  }

  /* ---------------------------------------------------------- live menu run */
  // The main menu is not a backdrop: four riders are actually racing the
  // selected island behind the buttons, gates and all.
  startMenuRun() {
    if (this.menuRun) return;
    // potato tier: the menus get the cheap cinematic backdrop, not four
    // live riders racing a whole island behind the buttons
    if (this.perfLevel === 0) return;
    const ids = ['fy_pool_day', 'surf_lagoon', 'fy_iceworld', 'pool_temple',
      'de_surf_dust', 'surf_heaven'];
    const map = getMap(ids[this.menuMapIdx++ % ids.length]);
    const taken = [];
    const spawn = this.findSpawn(map, map.spawn.x, map.spawn.y, taken);
    taken.push(spawn);
    const player = new Rider(map, {
      isPlayer: true, name: 'Zel', variant: 'zel', ai: 4,
      x: spawn.x, y: spawn.y,
    });
    const cast = [
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 5 },
      { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 4 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 6 },
    ];
    const rivals = cast.map((r, i) => {
      const ang = (i / cast.length) * Math.PI * 2;
      const s = this.findSpawn(map,
        clamp(Math.round(spawn.x + Math.cos(ang) * (4 + i)), 2, map.w - 3),
        clamp(Math.round(spawn.y + Math.sin(ang) * (3 + i)), 2, map.h - 3), taken);
      taken.push(s);
      return new Rider(map, { ...r, x: s.x, y: s.y });
    });
    this.menuRun = {
      map, player, rivals,
      def: { flow: 'menu', goal: { type: 'score', value: 99999 }, title: 'SURFN' },
      time: 9999, phase: 'race', gateIdx: 0,
      gatePos: map.gates[0] || { x: spawn.x, y: spawn.y },
      gateT: 0,
      relics: map.relics.map((r) => ({ ...r, taken: false, respawn: 0 })),
      fins: [], elapsed: 0, weather: map.weather, mods: [],
      camLead: { x: 0, y: 0 }, life: 46,
    };
    this.menuRun.camBounds = this.cameraBounds(map);
    this.camera.bounds = this.menuRun.camBounds;
    this.camera.snapTo(isoX(player.x, player.y), isoY(player.x, player.y) - 18);
  }

  updateMenuRun(dt) {
    const d = this.menuRun;
    if (!d) { this.startMenuRun(); return; }
    d.elapsed += dt;
    d.life -= dt;
    if (d.life <= 0) {
      // rotate the island after a while so the menu shows more of the game
      this.menuRun = null;
      this.startMenuRun();
      return;
    }
    d.gateT += dt;
    d.gatePos.bob = Math.sin(d.gateT * 3);
    for (const r of [d.player, ...d.rivals]) {
      const gate = r.isPlayer ? d.gatePos : r.raceTarget(d);
      const dir = r.think(dt, d.map, gate, d);
      r.update(dt, { map: d.map, sea: this.sea, input: dir, canControl: true });
      r.gateCd = Math.max(0, (r.gateCd || 0) - dt);
      const gdx = r.x - gate.x, gdy = r.y - gate.y;
      if (gdx * gdx + gdy * gdy < 1.21 && r.gateCd <= 0) {
        if (r.isPlayer) {
          r.gates++;
          r.gateCd = 2.4;
          r.comboUp();
          r.addScore(110 + r.ai * 18);
          this.advanceMenuGate(d);
        } else {
          r.bankGate(d, gate);
        }
      }
      for (const rel of d.relics) {
        if (rel.taken) {
          rel.respawn -= dt;
          if (rel.respawn <= 0) rel.taken = false;
          continue;
        }
        const rdx = r.x - rel.x, rdy = r.y - rel.y;
        if (rdx * rdx + rdy * rdy > 1.0) continue;
        rel.taken = true;
        rel.respawn = 14;
        r.comboUp();
        r.addScore(260 * Math.max(2, r.combo));
        if (r === d.player) {
          this.particles.burst(isoX(rel.x, rel.y), isoY(rel.x, rel.y) - 8,
            'star', 10, { grav: -20 });
        }
      }
    }
    const p = d.player;
    const k = 1 - Math.pow(0.02, dt);
    d.camLead.x += (p.vx - d.camLead.x) * k;
    d.camLead.y += (p.vy - d.camLead.y) * k;
    const lx = p.x + clamp(d.camLead.x * 0.09, -0.85, 0.85);
    const ly = p.y + clamp(d.camLead.y * 0.09, -0.85, 0.85);
    this.camera.bounds = d.camBounds;
    // shift the action into the clear strip between the menu and the cards
    this.camera.follow(isoX(lx, ly) - 44, isoY(lx, ly) - 18, dt);
  }

  advanceMenuGate(d) {
    const gates = d.map.gates;
    if (!gates || !gates.length) return;
    d.gateIdx = (d.gateIdx + 1) % gates.length;
    d.gatePos = gates[d.gateIdx];
    d.gateT = 0;
  }

  renderMenuRun(ctx) {
    const d = this.menuRun;
    if (!d) return false;
    const theme = d.map.themeDef;
    this.sea.drawBackdrop(ctx, theme);
    this.drawMap(ctx, d.map, theme, this.time, d, false);
    this.sea.drawWeather(ctx, theme);
    this.drawAtmosphere(ctx, d);
    return true;
  }

  /* --------------------------------------------------------------- remix */
  remixMods() { return this.mods.all(); }

  zoeiraOn() {
    const list = this.remixMods();
    return list.length > 0 && list.every((m) => this.mods.isOn(m.id));
  }

  updateRemix() {
    const i = this.input;
    const list = this.remixMods();
    const n = list.length;
    if (n) {
      if (i.hit('ArrowLeft', 'KeyA')) { this.remixIndex = (this.remixIndex + n - 1) % n; this.audio.sfx('select'); }
      if (i.hit('ArrowRight', 'KeyD')) { this.remixIndex = (this.remixIndex + 1) % n; this.audio.sfx('select'); }
      if (i.hit('ArrowUp', 'KeyW')) { this.remixIndex = (this.remixIndex + n - 2) % n; this.audio.sfx('select'); }
      if (i.hit('ArrowDown', 'KeyS')) { this.remixIndex = (this.remixIndex + 2) % n; this.audio.sfx('select'); }
      if (i.hit('Enter', 'KeyE', 'Space')) this.toggleRemix(list[this.remixIndex]?.id);
    }
    if (i.hit('KeyR')) this.toggleZoeira();
    if (i.hit('Escape')) { this.activate('remix:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (!id) return;
      if (id === 'remix:back') { this.activate('remix:back'); return; }
      if (id === 'remix:preset') { this.toggleZoeira(); return; }
      if (id.startsWith('remix:toggle:')) {
        const modId = id.slice(13);
        const at = list.findIndex((m) => m.id === modId);
        if (at >= 0) this.remixIndex = at;
        this.toggleRemix(modId);
      }
    }
  }

  toggleRemix(id) {
    if (!id) return;
    this.mods.toggle(id);
    const on = this.mods.isOn(id);
    this.audio.sfx(on ? 'quest' : 'deny');
    const mod = this.mods.all().find((m) => m.id === id);
    this.ui.toast(`${on ? 'LIGADO' : 'DESLIGADO'}: ${mod?.title || id}`,
      on ? '#8ecf63' : '#9aa2b3', 2.4);
  }

  toggleZoeira() {
    const list = this.remixMods();
    const turnOn = !this.zoeiraOn();
    for (const m of list) {
      if (this.mods.isOn(m.id) !== turnOn) this.mods.toggle(m.id);
    }
    this.audio.sfx(turnOn ? 'quest' : 'ui');
    this.ui.toast(turnOn
      ? 'ZOEIRA TOTAL: tudo ligado. Reza pro modem.'
      : 'Zoeira desligada. O modem agradece.', turnOn ? '#ffe066' : '#9aa2b3', 3);
  }

  /* ---------------------------------------------------------------- screens */
  updateTitle() {
    const i = this.input;
    if (i.hit('KeyE', 'Enter', 'Space') || i.mouse.clicked) {
      this.audio.ensure();
      this.audio.sfx('quest');
      this.menuIndex = 0;
      this.setScreen('main', true);
    }
  }

  mainItems() {
    return [
      { id: 'career' }, { id: 'world' }, { id: 'comp' }, { id: 'minigames' },
      { id: 'post' }, { id: 'life' }, { id: 'bonus' }, { id: 'remix' }, { id: 'options' },
    ];
  }

  updateMain(dt) {
    const i = this.input;
    const n = this.mainItems().length;
    if (i.hit('ArrowUp', 'KeyW')) { this.menuIndex = (this.menuIndex + n - 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.menuIndex = (this.menuIndex + 1) % n; this.audio.sfx('select'); }
    if (i.hit('KeyD')) { this.activate('main:daily'); return; }
    if (i.hit('KeyF')) { this.activate('main:holiday'); return; }
    if (i.hit('KeyC', 'KeyT')) { this.activate('main:tape'); return; }
    if (i.hit('KeyM')) { this.activate('main:minigames'); return; }
    if (this.typedWord('ORKUT')) this.foundEgg('orkut');
    if (this.typedWord('BONUS')) this.foundEgg('bonus');
    if (this.typedWord('MODEM')) this.foundEgg('modemcode');
    if (i.hit('Enter', 'KeyE', 'Space')) {
      this.activate('main:' + this.mainItems()[this.menuIndex].id);
      return;
    }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) this.activate(id);
    }
  }

  updateCareer() {
    const i = this.input;
    const n = CHAPTERS.length;
    if (i.hit('ArrowLeft', 'KeyA')) { this.careerIndex = (this.careerIndex + n - 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowRight', 'KeyD')) { this.careerIndex = (this.careerIndex + 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowUp', 'KeyW')) { this.careerIndex = (this.careerIndex + n - 3) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.careerIndex = (this.careerIndex + 3) % n; this.audio.sfx('select'); }
    if (i.hit('Enter', 'KeyE', 'Space')) { this.activate('career:start'); return; }
    if (i.hit('Escape')) { this.activate('career:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) {
        if (id.startsWith('career:') && /^\d+$/.test(id.split(':')[1])) {
          this.careerIndex = Number(id.split(':')[1]);
          this.audio.sfx('select');
        } else this.activate(id);
      }
    }
  }

  updateMaps() {
    const i = this.input;
    const n = MAP_ORDER.length;
    if (i.hit('ArrowLeft', 'KeyA')) { this.mapIndex = (this.mapIndex + n - 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowRight', 'KeyD')) { this.mapIndex = (this.mapIndex + 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowUp', 'KeyW')) { this.mapIndex = (this.mapIndex + n - 2) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.mapIndex = (this.mapIndex + 2) % n; this.audio.sfx('select'); }
    if (i.hit('Enter', 'KeyE', 'Space')) { this.activate('maps:start'); return; }
    if (i.hit('Escape')) { this.activate('maps:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) {
        if (id.startsWith('map:')) {
          this.mapIndex = Math.max(0, MAP_ORDER.indexOf(id.slice(4)));
          this.audio.sfx('select');
        } else this.activate(id);
      }
    }
  }

  updateWorld() {
    const i = this.input;
    const n = ISLANDS.length;
    if (i.hit('ArrowUp', 'KeyW')) { this.worldIndex = (this.worldIndex + n - 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.worldIndex = (this.worldIndex + 1) % n; this.audio.sfx('select'); }
    if (i.hit('Enter', 'KeyE', 'Space')) { this.activate('world:start'); return; }
    if (i.hit('Escape')) { this.activate('world:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) {
        if (id.startsWith('world:map:')) {
          this.worldIndex = clamp(Number(id.split(':')[2]) || 0, 0, n - 1);
          this.audio.sfx('select');
        } else this.activate(id);
      }
    }
  }

  postActions() {
    const legend = LEGEND_CHAPTERS.map((c, i) => ({
      id: 'post:legend:' + i, kind: 'legend', index: i,
      title: c.title, sub: `${i + 1}/${LEGEND_CHAPTERS.length} · ${MAP_META[c.map].label}`,
      locked: i > this.save.legend,
      done: this.save.legend > i,
    }));
    const hangs = HANGOUTS.map((h, i) => ({
      id: 'post:hangout:' + i, kind: 'hangout', index: i,
      title: h.title,
      sub: `${MAP_META[h.map].label} · afinidade ${this.save.relationships?.[h.id.replace('hang_', '')] || 0}/${h.req || 0}`,
      locked: (this.save.relationships?.[h.id.replace('hang_', '')] || 0) < (h.req || 0),
      done: !!this.save.hangouts[h.id],
    }));
    const events = EVENTS.map((ev, i) => ({
      id: 'post:event:' + i, kind: 'event', index: i,
      title: ev.title, sub: `${MAP_META[ev.map].label} · ${ev.desc}`,
      goal: ev.goal,
    }));
    return [
      ...legend, ...hangs, ...events,
      { id: 'post:league', kind: 'league', title: 'LIGA 2010 ETERNA', sub: 'heats sem fim' },
      { id: 'post:back', kind: 'back', title: 'VOLTAR', sub: 'menu principal' },
    ];
  }

  updatePost() {
    const i = this.input;
    const acts = this.postActions();
    this.postIndex = clamp(this.postIndex, 0, acts.length - 1);
    if (i.hit('ArrowUp', 'KeyW')) { this.postIndex = (this.postIndex + acts.length - 1) % acts.length; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.postIndex = (this.postIndex + 1) % acts.length; this.audio.sfx('select'); }
    if (i.hit('Enter', 'KeyE', 'Space')) { this.activate(acts[this.postIndex].id); return; }
    if (i.hit('Escape')) { this.activate('post:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) {
        const at = acts.findIndex((a) => a.id === id);
        if (at >= 0) this.postIndex = at;
        this.activate(id);
      }
    }
  }

  updateGallery() {
    const i = this.input;
    if (i.hit('Digit1')) { this.galleryTab = 0; this.audio.sfx('select'); }
    if (i.hit('Digit2')) { this.galleryTab = 1; this.audio.sfx('select'); }
    if (i.hit('Digit3')) { this.galleryTab = 2; this.audio.sfx('select'); }
    if (i.hit('Digit4')) { this.galleryTab = 3; this.audio.sfx('select'); }
    if (i.hit('Digit5')) { this.galleryTab = 4; this.audio.sfx('select'); }
    if (i.hit('Digit6')) { this.galleryTab = 5; this.audio.sfx('select'); }
    if (i.hit('ArrowLeft', 'KeyA')) { this.galleryTab = (this.galleryTab + 5) % 6; this.audio.sfx('select'); }
    if (i.hit('ArrowRight', 'KeyD')) { this.galleryTab = (this.galleryTab + 1) % 6; this.audio.sfx('select'); }
    if (this.galleryTab === 5 && BONUS_STAGES.length) {
      const n = BONUS_STAGES.length;
      this.bonusIndex = clamp(this.bonusIndex || 0, 0, n - 1);
      if (i.hit('ArrowUp', 'KeyW')) { this.bonusIndex = (this.bonusIndex + n - 2) % n; this.audio.sfx('select'); }
      if (i.hit('ArrowDown', 'KeyS')) { this.bonusIndex = (this.bonusIndex + 2) % n; this.audio.sfx('select'); }
      if (i.hit('Enter', 'KeyE', 'Space')) {
        this.activate('gallery:bonus:' + this.bonusIndex);
        return;
      }
    }
    if (i.hit('Escape', 'KeyE')) { this.activate('gallery:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) {
        if (id.startsWith('gallery:tab:')) {
          this.galleryTab = Number(id.split(':')[2]);
          this.audio.sfx('select');
        } else this.activate(id);
      }
    }
  }

  updateOptions() {
    const i = this.input;
    const n = 8;
    if (i.hit('ArrowUp', 'KeyW')) { this.optIndex = (this.optIndex + n - 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.optIndex = (this.optIndex + 1) % n; this.audio.sfx('select'); }
    if (i.hit('ArrowLeft', 'KeyA')) this.adjustOption(this.optIndex, -1);
    if (i.hit('ArrowRight', 'KeyD')) this.adjustOption(this.optIndex, 1);
    if (i.hit('Enter', 'KeyE', 'Space')) this.adjustOption(this.optIndex, 1);
    if (i.hit('Escape')) { this.activate('opt:back'); return; }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (!id) return;
      if (id.startsWith('opt:')) {
        const key = id.slice(4);
        if (key === 'back') { this.activate('opt:back'); return; }
        if (key === 'reset') { this.activate('opt:reset'); return; }
        const idx = ['music', 'sfx', 'quality', 'lang', 'shake', 'scan', 'map', 'banter'].indexOf(key);
        if (idx >= 0) { this.optIndex = idx; this.adjustOption(idx, 1); }
      }
    }
  }

  adjustOption(idx, dir) {
    const s = this.settings;
    switch (idx) {
      case 0:
        this.musicVol = clamp(Math.round((this.musicVol + dir * 0.1) * 10) / 10, 0, 1);
        this.audio.setMusicVolume(this.musicVol);
        this.audio.sfx('select');
        break;
      case 1:
        this.sfxVol = clamp(Math.round((this.sfxVol + dir * 0.1) * 10) / 10, 0, 1);
        this.audio.setSfxVolume(this.sfxVol);
        this.audio.sfx('select');
        break;
      case 2: {
        const order = ['auto', 'low', 'med', 'high'];
        const at = Math.max(0, order.indexOf(s.quality));
        s.quality = order[(at + (dir > 0 ? 1 : order.length - 1)) % order.length];
        this.perfChecked = true;
        this.applyPerf(s.quality);
        this.audio.sfx('ui');
        break;
      }
      case 3:
        s.locale = cycleLocale(dir >= 0 ? 1 : -1);
        setLocale(s.locale);
        this.ui.toast(`${this.languageLabel()}`, '#8fd3e8');
        this.audio.sfx('ui');
        break;
      case 4: s.shake = dir > 0 ? !s.shake : s.shake; this.audio.sfx('ui'); break;
      case 5: s.scanlines = !s.scanlines; this.audio.sfx('ui'); break;
      case 6: s.minimap = s.minimap === false; this.audio.sfx('ui'); break;
      case 7: s.banter = s.banter === false; this.audio.sfx('ui'); break;
      default: break;
    }
    this.persist();
  }

  /* ----------------------------------------------------------- menu actions */
  activate(id) {
    if (!id) return;
    if (id.startsWith('main:')) {
      const key = id.slice(5);
      if (key === 'career') { this.careerIndex = clamp(this.save.chapters, 0, CHAPTERS.length - 1); this.setScreen('career'); }
      else if (key === 'world') {
        if (this.save.chapters >= 1 || this.save.postgame) this.setScreen('world');
        else { this.ui.toast('Termine o capítulo 1 pra abrir o arquipélago.', '#ff9f9f'); this.audio.sfx('deny'); }
      }
      else if (key === 'comp') { this.setScreen('maps'); }
      else if (key === 'minigames') {
        this.minigames.showMenu('main');
        this.setScreen('minigames');
      }
      else if (key === 'post') {
        if (this.save.postgame) this.setScreen('post');
        else { this.ui.toast('Termine a história primeiro, muleque.', '#ff9f9f'); this.audio.sfx('deny'); }
      } else if (key === 'life') {
        if (this.save.postgame) this.startSandbox();
        else { this.ui.toast('A vila abre depois do capítulo 10.', '#ff9f9f'); this.audio.sfx('deny'); }
      } else if (key === 'bonus') { this.galleryTab = 0; this.setScreen('gallery'); }
      else if (key === 'daily') { this.startDaily(); }
      else if (key === 'holiday') { this.startHoliday(); }
      else if (key === 'tape') { this.setScreen('tape'); }
      else if (key === 'remix') { this.setScreen('remix'); }
      else if (key === 'options') { this.setScreen('options'); }
      return;
    }
    if (id.startsWith('gallery:bonus:')) {
      const i = Number(id.split(':')[2]) || 0;
      this.bonusIndex = clamp(i, 0, BONUS_STAGES.length - 1);
      this.startBonus(this.bonusIndex);
      return;
    }
    if (id.startsWith('gallery:holiday:')) {
      const hid = id.split(':')[2];
      const h = HOLIDAYS.find((x) => x.id === hid);
      if (!h) return;
      if (this.activeHoliday()?.id === h.id) this.startHoliday(h.id);
      else {
        this.ui.toast(`${h.name}: ${h.label}. Fora da janela, mas o calendário guarda.`, h.color, 4);
        this.audio.sfx('deny');
      }
      return;
    }
    if (id === 'career:start') {
      const c = CHAPTERS[this.careerIndex];
      const mg = c?.minigame;
      if (mg && !this.minigameCleared(c.id)) {
        this.openMinigame(mg.id, { chapterIndex: this.careerIndex });
        this.ui.toast(`PROVA DO CAPÍTULO: ${mg.name}. Vence primeiro, surfa depois.`, '#e9d489', 4);
        return;
      }
      this.startChapter(this.careerIndex);
      return;
    }
    if (id === 'career:back') { this.setScreen('main'); return; }
    if (id === 'maps:start') {
      const mapId = MAP_ORDER[this.mapIndex];
      if (!this.mapUnlocked(mapId)) {
        this.ui.toast('Esse mapa ainda tá baixando. (99%)', '#ff9f9f');
        this.audio.sfx('deny');
        return;
      }
      this.startHeat(mapId);
      return;
    }
    if (id === 'maps:back') { this.setScreen('main'); return; }
    if (id === 'minigames:back') { this.leaveMinigames(); return; }
    if (id === 'world:start') {
      const mapId = ISLANDS[this.worldIndex]?.map;
      if (!mapId) return;
      if (!this.mapUnlocked(mapId)) {
        this.ui.toast('Essa ilha ainda tá baixando. (99%)', '#ff9f9f');
        this.audio.sfx('deny');
        return;
      }
      this.startExplore(mapId);
      return;
    }
    if (id === 'world:back') { this.setScreen('main'); return; }
    if (id.startsWith('post:legend:')) {
      const n = Number(id.split(':')[2]) || 0;
      if (n > (this.save.legend || 0)) {
        this.ui.toast('Derrote a lenda anterior primeiro.', '#ff9f9f');
        this.audio.sfx('deny');
        return;
      }
      this.startLegend(n);
      return;
    }
    if (id.startsWith('post:hangout:')) {
      this.startHangout(Number(id.split(':')[2]) || 0);
      return;
    }
    if (id.startsWith('post:event:')) {
      const ev = EVENTS[Number(id.split(':')[2]) || 0];
      if (ev) this.startEvent(ev.id);
      return;
    }
    if (id === 'post:start') { this.startLegend(0); return; }
    if (id === 'post:league') { this.startLeague(); return; }
    if (id === 'post:back') { this.setScreen('main'); return; }
    if (id === 'gallery:back') { this.setScreen('main'); return; }
    if (id === 'remix:back') { this.setScreen('main'); return; }
    if (id === 'opt:back') { this.setScreen('main'); return; }
    if (id === 'opt:reset') {
      if (this.resetConfirm > 0) { this.resetProgress(); return; }
      this.resetConfirm = 4;
      this.ui.toast('Clique de novo pra apagar tudo. Sem voltainha.', '#ff9f9f');
      this.audio.sfx('deny');
      return;
    }
    if (id === 'pause:resume') { this.screenName = 'play'; this.audio.sfx('ui'); return; }
    if (id === 'pause:restart') { this.restartRun(); return; }
    if (id === 'pause:quit') { this.quitRun(); return; }
  }

  /* ------------------------------------------------------------------ run */
  startChapter(index) {
    const c = CHAPTERS[index];
    if (!c) return;
    if (!this.chapterUnlocked(index)) {
      this.ui.toast('Capítulo bloqueado. Faz o anterior primeiro.', '#ff9f9f');
      this.audio.sfx('deny');
      return;
    }
    const mods = [...(c.mods || [])];
    if (c.weather === 'storm' && !mods.includes('rogue')) mods.push('rogue');
    if (c.id === 'ch7') {
      if (!mods.includes('rogue')) mods.push('rogue');
      if (!mods.includes('glitch')) mods.push('glitch');
    }
    this.startConfig({
      id: c.id, title: c.title, mapId: c.map, mode: c.mode,
      duration: c.duration, goal: c.goal, rivals: c.rivals, allies: c.allies || [],
      weather: c.weather, mods, intro: c.intro, flow: 'career', music: c.music,
      cutscene: index === 0 ? CUTSCENES.ch1 : index === 7 ? CUTSCENES.ch8
        : index === 9 ? CUTSCENES.ch10 : null,
      chapterIndex: index, tips: c.tips,
    });
    const run = this.run;
    const boost = this.chapterBoost;
    if (run && boost && boost.chapter === index) {
      this.chapterBoost = null;
      if (boost.kind === 'turbo') {
        run.player.turbo = 100;
        this.ui.toast('AQUECIMENTO DA LAN: turbo cheio na largada.', '#ffe066', 3.4);
      } else {
        run.player.addScore(boost.value);
        this.ui.toast(`AQUECIMENTO DA LAN: +${boost.value} pontos de vantagem.`, '#ffe066', 3.4);
      }
    }
  }

  startHeat(mapId) {
    const map = getMap(mapId);
    const pool = HEAT.rivals.slice();
    const rivals = [];
    for (let i = 0; i < 3; i++) {
      const r = pool[(i + this.mapIndex) % pool.length];
      rivals.push({ ...r, ai: HEAT.ai + (i === 0 ? 1 : 0) });
    }
    this.startConfig({
      id: 'comp', title: `PARTIDA RÁPIDA · ${map.name}`, mapId,
      mode: 'score', duration: HEAT.duration, goal: { type: 'place', value: 1 },
      rivals, weather: map.weather,
      mods: map.weather === 'storm' ? ['rogue'] : [],
      intro: null, flow: 'heat',
    });
  }

  startLeague() {
    if (!this.save.postgame) return;
    this.league = { heat: 0, total: 0, streak: 0, wins: 0 };
    this.startLeagueHeat(0);
  }

  startLeagueHeat(i) {
    const base = POSTGAME_HEATS[i % POSTGAME_HEATS.length];
    const loop = Math.floor(i / POSTGAME_HEATS.length);
    const mapId = base.map;
    const allies = base.allies || [];
    const allyNames = allies.map((a) => a.name);
    const rivals = HEAT.rivals.filter((r) => !allyNames.includes(r.name)).map((r, k) => ({
      ...r,
      variant: k === 0 && loop > 0 ? 'sombra' : r.variant,
      ai: clamp(base.ai + loop - (k > 1 ? 1 : 0), 1, 7),
    })).slice(0, base.rivals);
    const mods = [...base.mods];
    if (loop > 0) mods.push('chaos');
    this.startConfig({
      id: 'league', title: `${base.title}${loop > 0 ? ` +${loop}` : ''}`,
      mapId, mode: base.mode || 'score', duration: Math.max(75, base.duration - loop * 5),
      goal: base.goal ? { ...base.goal } : { type: 'place', value: 1 },
      rivals, allies, weather: getMap(mapId).weather, mods,
      intro: i === 0 ? POSTGAME_HEATS[0].intro : (loop === 0 ? base.intro : null),
      flow: 'league', leagueHeat: i, music: base.music,
    });
  }

  startExplore(mapId) {
    const map = getMap(mapId);
    this.save.visited = this.save.visited || [];
    if (!this.save.visited.includes(mapId)) this.save.visited.push(mapId);
    this.startConfig({
      id: 'explore', title: `MODO LIVRE · ${map.name}`, mapId, mode: 'explore',
      duration: 9999, goal: { type: 'explore', value: 0 },
      rivals: [
        { name: 'Naldo da Lan', variant: 'gelo', ai: 1 },
        { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 1 },
      ],
      weather: map.weather, mods: [], intro: null, flow: 'explore',
    });
    this.spawnModem(this.run, mapId);
    this.ui.toast('Modo livre. F no cais volta pro arquipélago.', '#8fd3e8', 4.5);
  }

  /* one golden modem per island, once ever: the reason to revisit the map */
  spawnModem(run, mapId) {
    if (!run) return;
    this.save.modems = this.save.modems || [];
    if (this.save.modems.includes(mapId)) return;
    const map = run.map;
    let spot = null;
    for (let k = 0; k < 90; k++) {
      const x = rand(3, map.w - 4);
      const y = rand(3, map.h - 4);
      if (!map.isSolid(x, y)) { spot = { x, y }; break; }
    }
    if (spot) run.modem = { ...spot, ph: rand(0, 6.28), mapId };
  }

  startLegend(i) {
    const c = LEGEND_CHAPTERS[i];
    if (!c) return;
    this.startConfig({
      id: c.id, title: c.title, mapId: c.map, mode: c.mode,
      duration: c.duration, goal: c.goal, rivals: c.rivals,
      weather: c.weather, mods: c.mods || [], intro: c.intro, music: c.music,
      cutscene: i === 0 ? CUTSCENES.legend1 : null,
      flow: 'legend', legendIndex: i, tips: c.tips,
    });
  }

  startHangout(i) {
    const h = HANGOUTS[i];
    if (!h) return;
    const relKey = h.id.replace('hang_', '');
    const rel = this.save.relationships?.[relKey] || 0;
    if (rel < (h.req || 0)) {
      this.ui.toast(`${h.friend} ainda não tá nesse nível. Converse na vila (${rel}/${h.req || 0}).`, '#ff9f9f', 4);
      this.audio.sfx('deny');
      return;
    }
    const others = HEAT.rivals.filter((r) => r.name !== h.friend).slice(0, 2)
      .map((r) => ({ ...r, ai: 2 }));
    this.startConfig({
      id: h.id, title: h.title, mapId: h.map, mode: h.mode,
      duration: h.duration, goal: h.goal,
      rivals: others,
      allies: [{ name: h.friend, variant: h.variant, ai: 2 }],
      weather: getMap(h.map).weather, mods: [], intro: h.intro,
      flow: 'hangout', hangoutIndex: i, tips: h.tips,
    });
  }

  startEvent(eventId) {
    const ev = EVENTS.find((e) => e.id === eventId);
    if (!ev) return;
    const pool = HEAT.rivals.slice();
    const rivals = [];
    for (let i = 0; i < (ev.rivals || 2); i++) {
      rivals.push({ ...pool[(i + 1) % pool.length], ai: Math.min(6, 2 + i + (ev.id === 'hunt' ? 1 : 0)) });
    }
    this.startConfig({
      id: 'event:' + ev.id, title: ev.title, mapId: ev.map,
      mode: ev.id, duration: ev.duration, goal: { ...ev.goal },
      rivals, allies: ev.allies || [], weather: ev.weather, mods: [...(ev.mods || [])],
      intro: null, flow: 'event', eventId: ev.id,
      cutscene: ev.id === 'hunt' ? CUTSCENES.ch8 : CUTSCENES.event,
    });
    const run = this.run;
    if (!run) return;
    run.event = ev;
    run.noHud = run.noHud || !!ev.noHud;
    if (ev.team) run.team = true;
    if (ev.hunt) {
      const spots = [...run.map.relics, ...run.map.gates].slice(0, ev.goal.value);
      run.hunt = spots.map((r, i) => ({
        id: 'hunt' + i, name: `PISTA ${i + 1}`, x: r.x, y: r.y,
        color: '#b07cff', taken: false,
      }));
    }
    if (ev.id === 'waverush') { run.wavesCleared = 0; run.waveT = 7; run.waveActive = false; }
    if (ev.id === 'arcade') run.noHud = true;
    this.camera.snapTo(isoX(run.player.x, run.player.y), isoY(run.player.x, run.player.y) - 18);
    this.ui.showBanner(ev.title, 'evento da comunidade', ev.color || '#ffe066', 3.2);
    this.persist();
  }

  /* ----------------------------------------------------------- fases bônus */
  bonusUnlocked(i) {
    const st = BONUS_STAGES[i];
    if (!st) return false;
    const u = st.unlock || {};
    if (u.egg) return (this.save.eggs || []).includes(u.egg);
    if (u.legend !== undefined) return (this.save.legend || 0) >= u.legend;
    if (u.postgame) return !!this.save.postgame;
    if (u.chapters !== undefined) return (this.save.chapters || 0) >= u.chapters;
    if (u.relics !== undefined) return this.save.relics.length >= u.relics;
    return true;
  }

  bonusUnlockText(i) {
    const st = BONUS_STAGES[i];
    if (!st) return '???'; // easter egg
    const u = st.unlock || {};
    if (u.egg) return '??? um segredo no teclado';
    if (u.legend !== undefined) return `vença ${u.legend} provas da lenda`;
    if (u.postgame) return 'vença a história';
    if (u.chapters !== undefined) return `vença ${u.chapters} capítulos`;
    if (u.relics !== undefined) return `ache ${u.relics} relíquias`;
    return 'aberta';
  }

  bonusDone(i) {
    const st = BONUS_STAGES[i];
    return !!(st && (this.save.bonus || {})[st.id]);
  }

  bonusGoalText(g) {
    if (g.type === 'score') return `faça ${g.value} pontos`;
    if (g.type === 'gates') return `passe ${g.value} gates`;
    if (g.type === 'relics') return `ache ${g.value} relíquias`;
    if (g.type === 'pipa') return `corte ${g.value} pipas`;
    if (g.type === 'surf') return `surfe ${g.value} cristas`;
    if (g.type === 'flags') return `capture ${g.value} bandeiras`;
    if (g.type === 'team') return `leve o time a ${g.value} pontos`;
    return 'sobreviva';
  }

  startBonus(i) {
    const st = BONUS_STAGES[i];
    if (!st) return;
    if (!this.bonusUnlocked(i)) {
      this.ui.toast(`Fase bônus trancada: ${this.bonusUnlockText(i)}.`, '#ff9f9f', 4);
      this.audio.sfx('deny');
      return;
    }
    this.startConfig({
      id: 'bonus:' + st.id, title: st.title, mapId: st.map, mode: st.mode,
      duration: st.duration, goal: { ...st.goal }, rivals: st.rivals,
      allies: st.allies || [], weather: st.weather, mods: [...(st.mods || [])],
      intro: null, flow: 'bonus', bonusIndex: i, tips: st.tips,
    });
    const run = this.run;
    if (!run) return;
    run.bonusStage = st;
    this.audio.sfx('festival');
    this.ui.showBanner(st.title, 'FASE BÔNUS', st.color || '#ffe066', 3);
    this.persist();
  }

  startSandbox() {
    if (!this.save.postgame) {
      this.ui.toast('A vila abre depois do capítulo 10.', '#ff9f9f');
      this.audio.sfx('deny');
      return;
    }
    const w = this.save.world;
    const sb = this.save.sandbox;
    const fx = this.mods.activeSettings();
    if (fx.sandboxMin) w.min = fx.sandboxMin;
    if (fx.sandboxWeather) w.weather = fx.sandboxWeather;
    this.clock = {
      day: Math.max(1, w.day || 1), min: w.min ?? 18 * 60, season: w.season || 0,
    };
    const npcs = SANDBOX_NPCS.map((n) => ({
      name: n.name, variant: n.variant, ai: n.ai, key: n.key, online: n.online,
    }));
    this.startConfig({
      id: 'sandbox', title: 'VILA 2000 · MODO VIDA', mapId: 'vila2000',
      mode: 'explore', duration: 99999, goal: { type: 'life', value: 0 },
      rivals: npcs, weather: w.weather || 'dusk', mods: [], intro: null,
      cutscene: CUTSCENES.sandbox, flow: 'sandbox',
    });
    const run = this.run;
    if (!run) return;
    run.needs = {
      energy: clamp(Number(w.energy) || 0, 0, 100),
      food: clamp(Number(w.food) || 0, 0, 100),
      water: clamp(Number(w.water) || 0, 0, 100),
    };
    run.gatePos = { x: -50, y: -50 };
    run.relics = [];
    run.npcs = run.rivals.map((r, i) => ({
      ...SANDBOX_NPCS[i], rider: r, wasOnline: null,
    }));
    run.rivals.forEach((r, i) => { r.npcKey = SANDBOX_NPCS[i]?.key; });
    run.saveT = 8;
    run.weatherT = 110;
    run.warnT = 0;
    run.noHud = fx.noHud;
    run.hunt = SANDBOX_COLLECTIBLES.map((c) => ({
      ...c, taken: sb.collectibles.includes(c.id),
    }));
    const savedJob = sb.job ? SANDBOX_JOBS.find((j) => j.id === sb.job.id) : null;
    run.job = savedJob ? { ...savedJob, ...sb.job, def: savedJob } : null;
    if (Number.isFinite(sb.x) && Number.isFinite(sb.y)) {
      const px = clamp(Math.round(sb.x), 2, run.map.w - 3);
      const py = clamp(Math.round(sb.y), 2, run.map.h - 3);
      if (!run.map.isSolid(px, py)) { run.player.x = px; run.player.y = py; }
      this.camera.snapTo(isoX(run.player.x, run.player.y), isoY(run.player.x, run.player.y) - 18);
    }
    this.sandboxChatter = rand(10, 18);
    this.syncNpcSchedules(true);
    this.persist();
    this.ui.showBanner('VILA 2000', sb.job ? `turno salvo: ${sb.job.title}` : 'a vida depois do título', '#ffe066', 3);
  }

  updateSandbox(dt) {
    const run = this.run;
    if (!run || !run.needs) return;
    const before = this.clock.min;
    this.clock.min += dt * 3;
    if (this.clock.min >= 24 * 60) {
      this.clock.min -= 24 * 60;
      this.clock.day++;
      if (this.clock.day % 7 === 0) {
        this.clock.season = (this.clock.season + 1) % 4;
        run.weather = this.rollSandboxWeather();
        this.ui.toast(`Nova estação: ${this.seasonDef().name}`, this.seasonDef().color, 4);
      }
      this.ui.toast(`Dia ${this.clock.day}. O sol nasceu no servidor.`, '#ffd24d', 3);
    }
    void before;
    const n = run.needs;
    n.energy = clamp(n.energy - dt * 0.19, 0, 100);
    n.food = clamp(n.food - dt * 0.11, 0, 100);
    n.water = clamp(n.water - dt * 0.14, 0, 100);
    run.warnT -= dt;
    if (run.warnT <= 0 && (n.energy <= 8 || n.food <= 8 || n.water <= 8)) {
      run.warnT = 22;
      const need = n.energy <= 8 ? 'ENERGIA' : n.food <= 8 ? 'FOME' : 'SEDE';
      this.ui.toast(`${need} no vermelho. Acha a lan, o bar ou a van.`, '#ff9f9f', 3.5);
    }
    this.syncNpcSchedules(false);
    this.sandboxChatter -= dt;
    if (this.sandboxChatter <= 0) {
      this.sandboxChatter = rand(18, 32);
      if (this.settings.banter !== false) this.npcChatter();
    }
    run.weatherT -= dt;
    if (run.weatherT <= 0) {
      run.weatherT = rand(90, 150);
      const nw = this.rollSandboxWeather();
      if (nw !== run.weather) {
        run.weather = nw;
        const name = nw === 'rain' ? 'CHUVA' : nw.toUpperCase();
        this.ui.toast(`O tempo virou: ${name}.`, '#8fd3e8', 3);
      }
    }
    // The eight village collectibles are physical objects: walk close and
    // they pop, no menu required. This also works while a job is active.
    for (const c of run.hunt || []) {
      if (c.taken) continue;
      if (Math.hypot(run.player.x - c.x, run.player.y - c.y) > 1.15) continue;
      c.taken = true;
      if (!this.save.sandbox.collectibles.includes(c.id)) this.save.sandbox.collectibles.push(c.id);
      this.save.sandbox.materials.chips += 1;
      this.ui.showPopup(`ACHOU: ${c.name}`, c.color || '#ffe066', 1.8);
      this.ui.toast(`CAÇA ${this.save.sandbox.collectibles.length}/${SANDBOX_COLLECTIBLES.length} · +1 chip`, '#b07cff', 3);
      this.audio.sfx('pickup');
      this.persist();
      if (this.save.sandbox.collectibles.length >= SANDBOX_COLLECTIBLES.length) {
        this.save.xp += 500;
        this.save.world.money = (this.save.world.money || 0) + 50;
        this.publishCommunity('CAÇA COMPLETA', 500);
        this.ui.showBanner('CAÇA COMPLETA', 'a vila inteira foi vasculhada', '#b07cff', 4);
        this.audio.sfx('quest');
      }
    }
    run.saveT -= dt;
    if (run.saveT <= 0) { run.saveT = 10; this.persist(); }
  }

  syncNpcSchedules(initial) {
    const run = this.run;
    if (!run || !run.npcs) return;
    const hour = this.hourNow();
    for (const npc of run.npcs) {
      const online = this.isNpcOnline(npc.online, hour);
      npc.rider.hidden = !online;
      if (npc.wasOnline !== null && npc.wasOnline !== online && !initial) {
        this.ui.toast(online ? `${npc.name} entrou no MSN.` : `${npc.name} deslogou.`, online ? '#8ee58e' : '#9aa2b3', 2.2);
      }
      npc.wasOnline = online;
    }
  }

  isNpcOnline(schedule, hour) {
    if (!schedule) return true;
    const [a, b] = schedule;
    if (b > 24) return hour >= a || hour < b - 24;
    return hour >= a && hour < b;
  }

  npcChatter() {
    const run = this.run;
    if (!run?.npcs) return;
    const online = run.npcs.filter((n) => !n.rider.hidden);
    for (const [a, b, text] of NPC_CHATTER) {
      const na = online.find((n) => n.key === a);
      const nb = online.find((n) => n.key === b);
      if (!na || !nb) continue;
      if (Math.hypot(na.rider.x - nb.rider.x, na.rider.y - nb.rider.y) > 9) continue;
      this.ui.toast(`${na.name}: ${text}`, '#b07cff', 4.5);
      return;
    }
  }

  npcRoutineTarget(rider) {
    const run = this.run;
    if (!run) return null;
    const hour = this.hourNow();
    const npc = (run.npcs || []).find((n) => n.key === rider.npcKey);
    const routine = npc?.routine || [[0, 'plaza']];
    let poiId = routine[0][1];
    for (const [at, id] of routine) if (hour >= at) poiId = id;
    const poi = (run.map.pois || []).find((p) => p.id === poiId)
      || (run.map.pois || []).find((p) => p.id === 'plaza');
    if (!poi) return null;
    const hash = rider.npcKey?.charCodeAt(0) || 0;
    const tx = poi.x + (hash % 5) - 2;
    const ty = poi.y + (hash % 3) - 1;
    if (!run.map.isSolid(tx, ty)) return { x: tx, y: ty };
    return { x: poi.x, y: poi.y };
  }

  nearestSandboxInteract() {
    const run = this.run;
    if (!run) return null;
    const p = run.player;
    let bestNpc = null;
    for (const npc of run.npcs || []) {
      if (npc.rider.hidden) continue;
      const d = Math.hypot(p.x - npc.rider.x, p.y - npc.rider.y);
      if (d < 3.2 && (!bestNpc || d < bestNpc.d)) bestNpc = { kind: 'npc', npc, d };
    }
    if (bestNpc) return bestNpc;
    let bestPoi = null;
    for (const poi of run.map.pois || []) {
      const d = Math.hypot(p.x - poi.x, p.y - poi.y);
      if (d < 4.5 && (!bestPoi || d < bestPoi.d)) bestPoi = { kind: 'poi', poi, d };
    }
    if (bestPoi) return bestPoi;
    let best = null;
    for (const prop of run.map.props) {
      if (!['ladder', 'umbrella', 'speaker', 'chair', 'crate', 'barrel', 'pallet', 'cart'].includes(prop.kind)) continue;
      const d = Math.hypot(p.x - prop.gx, p.y - prop.gy);
      if (d > 5.0) continue;
      if (!best || d < best.d) best = { kind: prop.kind, d, prop };
    }
    return best;
  }

  sandboxPrompt() {
    const it = this.nearestSandboxInteract();
    if (!it) return null;
    if (it.kind === 'npc') return `E · conversar com ${it.npc.name}`;
    if (it.kind === 'poi') {
      const p = it.poi;
      if (p.kind === 'bar') return 'E · BAR DO NALDO: comer / beber';
      if (p.kind === 'hotel') return 'E · HOTEL 2000: dormir (R$8)';
      if (p.kind === 'lan') return 'E · LAN HOUSE: energia por R$3';
      if (p.kind === 'light') return 'E · FAROL: subir e acender a luz';
      if (p.kind === 'market') return 'E · MERCADO: lanche da vila';
      if (p.kind === 'skate') return 'E · SKATE PARK: sessão de 45 min';
      if (p.kind === 'arcade') return 'E · ARCADE: fliperama por R$2';
      if (p.kind === 'radio') return 'E · RÁDIO: pedir uma música';
      if (p.kind === 'pier') return 'E · ORLA: pescar e ouvir o mar';
      if (p.kind === 'plaza') return 'E · PRAÇA: jogar uma moeda na fonte';
      if (p.kind === 'jobs') return this.run.job
        ? `E · TRABALHO: ${this.run.job.title} (${this.run.job.progress}/${this.run.job.target})`
        : 'E · PREFEITURA: pegar um trabalho';
      if (p.kind === 'mural') return 'E · MURAL: recados e recordes da comunidade';
    }
    if (it.kind === 'ladder') return 'E · dormir na van (grátis) · 07:00';
    if (it.kind === 'umbrella' || it.kind === 'chair') return 'E · bar do Naldo: comer / beber';
    if (['crate', 'barrel', 'pallet', 'cart'].includes(it.kind)) return `E · vasculhar ${it.kind} por material`;
    return 'E · lan house: energia por R$3';
  }

  interactSandbox() {
    const run = this.run;
    if (!run) return;
    const it = this.nearestSandboxInteract();
    if (!it) { this.ui.toast('Chega perto de um NPC, da van, do bar ou da lan.', '#8fd3e8', 2.5); return; }
    if (it.kind === 'npc') { this.talkNpc(it.npc); return; }
    if (it.kind === 'poi') {
      const k = it.poi.kind;
      if (k === 'jobs') { this.openJobBoard(); return; }
      if (k === 'mural') { this.openMural(); return; }
      if (this.trySandboxJob(k)) return;
      if (k === 'bar' || k === 'market') { this.barSandbox(it.poi.name); return; }
      if (k === 'hotel') { this.sleepSandbox('hotel'); return; }
      if (k === 'lan') { this.lanSandbox(); return; }
      if (k === 'light') { this.lightSandbox(); return; }
      if (k === 'skate') { this.skateSandbox(); return; }
      if (k === 'arcade') { this.arcadeSandbox(); return; }
      if (k === 'radio') { this.radioSandbox(); return; }
      if (k === 'pier') { this.pierSandbox(); return; }
      this.plazaSandbox(); return;
    }
    if (it.kind === 'ladder') { this.sleepSandbox(); return; }
    if (it.kind === 'umbrella' || it.kind === 'chair') { this.barSandbox(); return; }
    if (['crate', 'barrel', 'pallet', 'cart'].includes(it.kind)) { this.searchSandboxProp(it.prop); return; }
    this.lanSandbox();
  }

  talkNpc(npc) {
    const t = NPC_TALK[npc.key];
    if (!t) return;
    const rel = this.save.relationships[npc.key] || 0;
    const base = rel >= 2 ? t.warm : t.cool;
    const greet = { who: npc.key, text: t.greet };
    const question = {
      who: npc.key,
      text: rel >= 2 ? 'A gente já é quase da mesma lan. O que você quer fazer hoje?'
        : 'Fala logo. A hora da lan tá correndo.',
      choices: t.choices.map((c) => ({
        label: c.label, reply: c.reply,
        effect: { type: 'relation', npc: npc.key, value: c.value },
      })),
    };
    this.ui.say([greet, ...base, question], null, (choice) => this.applyChoice(choice));
  }

  barSandbox(place = 'BAR DO NALDO') {
    const w = this.save.world;
    this.ui.say([
      { who: 'naldo', text: `${place}. X-TUDO R$5, GUARANÁ R$3. Seu saldo: R$${w.money || 0}.` },
      { who: 'zel', text: 'A fome de 2007 voltou.', choices: [
        { label: 'COMER X-TUDO (R$5)', reply: 'X-TUDO na mesa. O teclado agradece.', effect: { type: 'eat' } },
        { label: 'BEBER GUARANÁ (R$3)', reply: 'Gelado. Igual ao do campinho.', effect: { type: 'drink' } },
      ] },
    ], null, (choice) => this.applyChoice(choice));
  }

  lanSandbox() {
    const w = this.save.world;
    if ((w.money || 0) < 3) { this.ui.toast('Sem grana pra lan. Vende um CD no bar.', '#ff9f9f'); return; }
    w.money -= 3;
    this.run.needs.energy = clamp(this.run.needs.energy + 25, 0, 100);
    this.advanceMinutes(45);
    this.ui.toast('45 min de lan house. Energia +25, saldo -R$3.', '#8fd3e8', 3);
    this.audio.sfx('select');
    this.persist();
  }

  sleepSandbox(place = 'van') {
    const n = this.run.needs;
    const w = this.save.world;
    if (place === 'hotel') {
      if ((w.money || 0) < 8) { this.ui.toast('Hotel custa R$8. A van é de graça.', '#ff9f9f'); return; }
      w.money -= 8;
    }
    this.advanceMinutes((7 * 60 - (this.clock.min % 1440) + 1440) % 1440 || 1440);
    n.energy = 100;
    n.food = clamp(n.food - 10, 0, 100);
    n.water = clamp(n.water - 10, 0, 100);
    this.run.weather = this.rollSandboxWeather();
    this.syncNpcSchedules(false);
    this.ui.toast(`Dormiu ${place === 'hotel' ? 'no Hotel 2000' : 'na van'}. Dia ${this.clock.day}, ${this.seasonDef().name.toLowerCase()}.`, '#b07cff', 4);
    this.audio.sfx('quest');
    this.persist();
  }

  lightSandbox() {
    this.advanceMinutes(30);
    this.run.needs.energy = clamp(this.run.needs.energy + 10, 0, 100);
    this.run.weather = this.clock.min / 60 >= 18 || this.clock.min / 60 < 6 ? 'night' : this.run.weather;
    this.ui.toast('O farol acendeu. Dá pra ver a vila inteira daqui.', '#ffe066', 4);
    this.audio.sfx('gate');
    this.persist();
  }

  skateSandbox() {
    this.advanceMinutes(45);
    this.run.needs.energy = clamp(this.run.needs.energy - 12, 0, 100);
    this.run.player.addScore(500);
    this.ui.showPopup('SESSÃO DE SKATE +500', '#8fd3e8', 1.8);
    this.ui.toast('45 min de skate. A energia foi, a linha ficou.', '#8fd3e8', 3);
    this.audio.sfx('trick');
    this.persist();
  }

  arcadeSandbox() {
    const w = this.save.world;
    if ((w.money || 0) < 2) { this.ui.toast('O fliperama engoliu sua ficha. Sem grana.', '#ff9f9f'); return; }
    w.money -= 2;
    this.advanceMinutes(30);
    this.run.needs.energy = clamp(this.run.needs.energy - 5, 0, 100);
    this.persist();
    this.minigames.showMenu('play');
    this.setScreen('minigames', true);
    this.ui.toast('Ficha na máquina: o fliperama da lan abriu. ESC volta pra vila.', '#b07cff', 3.4);
    this.audio.sfx('trick');
  }

  radioSandbox() {
    this.advanceMinutes(20);
    this.audio.setTrack('garage2000');
    this.ui.toast('RÁDIO VILA 2000: "MODEM DE GARAGEM" na trilha.', '#ffd24d', 4);
    this.persist();
  }

  pierSandbox() {
    this.advanceMinutes(45);
    this.run.needs.food = clamp(this.run.needs.food + 22, 0, 100);
    this.run.needs.water = clamp(this.run.needs.water + 8, 0, 100);
    this.ui.toast('Pescou um peixe de 2003. Fome +22.', '#8fd3e8', 3);
    this.persist();
  }

  plazaSandbox() {
    this.advanceMinutes(15);
    this.run.needs.water = clamp(this.run.needs.water + 6, 0, 100);
    this.ui.toast('Você jogou uma moeda na fonte. O modem agradece.', '#b07cff', 3);
    this.persist();
  }

  startSandboxJob(def) {
    if (!def || !this.run) return;
    this.run.job = {
      id: def.id, title: def.title, pay: def.pay, target: def.target,
      route: def.route.slice(), material: def.material, progress: 0, def,
    };
    this.ui.toast(`TRABALHO: ${def.title}. ${def.desc}`, '#ffe066', 4.5);
    this.ui.showPopup('TURNO ACEITO', '#ffe066', 1.6);
    this.audio.sfx('quest');
    this.persist();
  }

  trySandboxJob(poiKind) {
    const run = this.run;
    const job = run?.job;
    if (!job) return false;
    const def = job.def || SANDBOX_JOBS.find((j) => j.id === job.id);
    if (!def) { run.job = null; return false; }
    const step = def.route[Math.min(job.progress, def.route.length - 1)];
    if (step !== poiKind) return false;
    job.progress++;
    this.advanceMinutes(20);
    this.run.needs.energy = clamp(this.run.needs.energy - 4, 0, 100);
    this.audio.sfx('select');
    if (job.progress < job.target) {
      this.ui.showPopup(`TRABALHO ${job.progress}/${job.target}`, '#8fd3e8', 1.4);
      this.ui.toast(`Etapa feita. ${def.route[Math.min(job.progress, def.route.length - 1)].toUpperCase()} é o próximo.`, '#8fd3e8', 3);
      this.persist();
      return true;
    }
    const fx = this.mods.activeSettings();
    const mat = Math.max(1, Math.round((def.material === 'wood' ? 3 : 2) * fx.materialFactor));
    this.save.world.money = (this.save.world.money || 0) + def.pay;
    this.save.sandbox.materials[def.material] = (this.save.sandbox.materials[def.material] || 0) + mat;
    this.save.sandbox.completedJobs.push(def.id);
    this.save.xp += 45;
    this.run.job = null;
    this.ui.showBanner('TURNO PAGO', `R$${def.pay} + ${mat} ${def.material}`, '#8ecf63', 3);
    this.ui.toast(`Trabalho concluído: ${def.title}. O Naldo anotou no caderno.`, '#8ecf63', 4.5);
    this.audio.sfx('quest');
    this.publishCommunity(def.title, 45, `R$${def.pay}`);
    this.persist();
    return true;
  }

  openJobBoard() {
    const active = this.run?.job;
    if (active) {
      const def = active.def || SANDBOX_JOBS.find((j) => j.id === active.id);
      const next = def?.route?.[Math.min(active.progress, def.route.length - 1)] || '?';
      this.ui.say([
        { who: 'naldo', text: `Turno em aberto: ${active.title}. ${active.progress}/${active.target}. Próxima parada: ${next.toUpperCase()}.` },
        { who: 'zel', text: 'Aceito terminar. Mas se o modem cair, a culpa não é minha.', choices: [
          { label: 'CONTINUAR O TURNO', reply: 'Segue o mapa. O material tá contando.' },
          { label: 'ABANDONAR (perde o adiantamento)', reply: 'Sem drama. O mural aceita de novo amanhã.', effect: { type: 'abandonJob' } },
        ] },
      ], null, (ch) => {
        if (ch.effect?.type === 'abandonJob') {
          this.run.job = null;
          this.ui.toast('Turno abandonado. O mural não julga. Muito.', '#9aa2b3', 3);
          this.persist();
        }
        this.ui.dialog = null;
      });
      return;
    }
    const offset = (this.clock.day * 2) % SANDBOX_JOBS.length;
    const offers = [SANDBOX_JOBS[offset], SANDBOX_JOBS[(offset + 3) % SANDBOX_JOBS.length]];
    this.ui.say([
      { who: 'naldo', text: `Mural de trabalho do dia ${this.clock.day}. Paga pouco, mas paga em 2007.` },
      { who: 'zel', text: `${offers[0].title}: ${offers[0].desc} (R$${offers[0].pay})\n${offers[1].title}: ${offers[1].desc} (R$${offers[1].pay})`, choices: [
        { label: `${offers[0].title} · R$${offers[0].pay}`, reply: 'Aceito. Onde é mesmo?', effect: { type: 'startJob', job: offers[0].id } },
        { label: `${offers[1].title} · R$${offers[1].pay}`, reply: 'Aceito. Onde é mesmo?', effect: { type: 'startJob', job: offers[1].id } },
      ] },
    ], null, (ch) => {
      if (ch.effect?.type === 'startJob') {
        const def = SANDBOX_JOBS.find((j) => j.id === ch.effect.job);
        this.ui.dialog = null;
        this.startSandboxJob(def);
      }
    });
  }

  searchSandboxProp(prop) {
    if (!prop || !this.run) return;
    const key = `${prop.gx},${prop.gy},${this.clock.day}`;
    const sb = this.save.sandbox;
    if (sb.searches.includes(key)) {
      this.ui.toast('Já vasculhei esse aqui hoje. O cupim levou.', '#9aa2b3', 2.5);
      this.audio.sfx('deny');
      return;
    }
    sb.searches.push(key);
    if (sb.searches.length > 60) sb.searches.splice(0, sb.searches.length - 60);
    const table = { crate: 'wood', barrel: 'metal', pallet: 'wood', cart: 'cloth' };
    const mat = table[prop.kind] || 'chips';
    const amount = 1 + (prop.kind === 'pallet' ? 1 : 0);
    sb.materials[mat] = (sb.materials[mat] || 0) + amount;
    this.advanceMinutes(8);
    this.ui.showPopup(`+${amount} ${mat.toUpperCase()}`, '#8ee58e', 1.4);
    this.ui.toast('Material guardado no inventário da vila.', '#8ee58e', 2.5);
    this.audio.sfx('pickup');
    this.persist();
  }

  openMural() {
    const board = this.save.community.board || [];
    const lines = board.length
      ? board.slice(0, 4).map((b, i) => `${i + 1}. ${b.title} · ${b.score} pts`).join('\n')
      : COMMUNITY_LINES.slice(0, 3).join('\n');
    this.ui.say([
      { who: 'bruxa', text: `MURAL DA COMUNIDADE\n${lines}\n\nCAÇA: ${this.save.sandbox.collectibles.length}/${SANDBOX_COLLECTIBLES.length} · TRABALHOS: ${this.save.sandbox.completedJobs.length}` },
      { who: 'zel', text: 'O arquipélago tá pequeno, mas o mural é grande. Eventos ficam no menu principal.' },
    ], null, null);
    this.audio.sfx('ui');
  }

  publishCommunity(title, score, note = '') {
    const c = this.save.community;
    c.board.unshift({ title: String(title).slice(0, 40), score: Math.round(score), note: String(note).slice(0, 30), day: this.clock.day });
    c.board = c.board.slice(0, 12);
    c.best = c.best || {};
    c.best[title] = Math.max(c.best[title] || 0, Math.round(score));
    this.persist();
  }

  advanceMinutes(mins) {
    this.clock.min += mins;
    while (this.clock.min >= 24 * 60) {
      this.clock.min -= 24 * 60;
      this.clock.day++;
      if (this.clock.day % 7 === 0) {
        this.clock.season = (this.clock.season + 1) % 4;
        this.ui.toast(`Nova estação: ${this.seasonDef().name}`, this.seasonDef().color, 4);
      }
    }
  }

  applyChoice(choice) {
    const run = this.run;
    if (!run) return;
    const e = choice.effect || {};
    if (e.type === 'turbo') {
      run.player.turbo = 100;
      this.ui.showPopup('TURBO CHEIO!', '#ffe066', 1.4);
    } else if (e.type === 'time') {
      run.time += e.value || 15;
      this.ui.showPopup(`+${e.value || 15}s`, '#8fd3e8', 1.4);
    } else if (e.type === 'score') {
      run.player.addScore(e.value || 600);
      this.ui.showPopup(`+${e.value || 600} PTS`, '#ffe066', 1.4);
    } else if (e.type === 'combo') {
      run.player.combo = Math.max(run.player.combo, e.value || 2);
      run.player.comboT = 6;
      this.ui.showPopup(`COMBO x${run.player.combo}`, '#b07cff', 1.4);
    } else if (e.type === 'relation') {
      const key = e.npc;
      if (key) {
        this.save.relationships[key] = clamp((this.save.relationships[key] || 0) + (e.value || 0), -5, 10);
        const hearts = Math.max(0, this.save.relationships[key]);
        this.ui.showPopup(`\u2665 ${hearts}`, e.value > 0 ? '#b07cff' : '#ff9f9f', 1.6);
        this.ui.toast(e.value > 0 ? 'A amizade subiu. O rolê fica mais fácil.' : 'Clima estranho. Talvez amanhã melhore.', e.value > 0 ? '#b07cff' : '#ff9f9f', 2.4);
      }
    } else if (e.type === 'eat') {
      const w = this.save.world;
      if ((w.money || 0) < 5) { this.ui.toast('Sem grana pro x-tudo. A fome não espera.', '#ff9f9f'); return; }
      w.money -= 5;
      run.needs.food = clamp(run.needs.food + 38, 0, 100);
      run.needs.energy = clamp(run.needs.energy + 8, 0, 100);
      this.advanceMinutes(30);
      this.ui.toast('X-TUDO de 2007. Fome +38.', '#8ee58e', 3);
    } else if (e.type === 'drink') {
      const w = this.save.world;
      if ((w.money || 0) < 3) { this.ui.toast('Sem grana pro guaraná.', '#ff9f9f'); return; }
      w.money -= 3;
      run.needs.water = clamp(run.needs.water + 42, 0, 100);
      this.advanceMinutes(20);
      this.ui.toast('Guaraná gelado. Sede +42.', '#8fd3e8', 3);
    }
    this.save.choices[run.def.id] = choice.label;
    this.persist();
  }

  questEvent(kind, amount = 1, mapId) {
    const mid = mapId || this.run?.map.id;
    if (!mid) return;
    let changed = false;
    for (const q of WORLD_QUESTS) {
      if (q.map !== mid || q.type !== kind) continue;
      const cur = this.save.quests[q.id] || 0;
      if (cur >= q.target) continue;
      const nv = Math.min(q.target, cur + amount);
      this.save.quests[q.id] = nv;
      changed = true;
      if (nv >= q.target) {
        this.save.xp += q.reward;
        this.ui.toast(`MISSÃO: ${q.title} +${q.reward} XP`, '#8ecf63', 4);
        this.audio.sfx('quest');
      }
    }
    if (changed) this.persist();
  }

  exitExplore() {
    if (!this.run || this.run.def.flow !== 'explore') return;
    this.persist();
    this.run = null;
    this.setScreen('world');
    this.ui.toast('De volta ao arquipélago.', '#8fd3e8');
  }

  startConfig(cfg) {
    cfg = { ...cfg, goal: { ...cfg.goal }, mods: [...(cfg.mods || [])] };
    const fx = this.mods.activeSettings();
    cfg.duration = Math.max(20, Math.round(cfg.duration * fx.durationFactor));
    if (cfg.goal.type !== 'place') cfg.goal.value = Math.round(cfg.goal.value * fx.goalFactor);
    if (fx.aiBonus) cfg.rivals = (cfg.rivals || []).map((r) => ({ ...r, ai: Math.min(7, (r.ai || 1) + fx.aiBonus) }));
    if (fx.soloRun) cfg.rivals = [];
    // Career levels are played in periods (first half, half-time, second half)
    // and were stretched to three times the stage the goal was tuned for, so
    // each period asks the full authored meta and the deciding period asks a
    // quarter more: the target never gets thin before the final whistle.
    // Shorter runs (bonus, daily, parties, events, league, legend) stay one
    // continuous lap, so their authored target holds for the whole clock.
    const splitGoal = ['score', 'gates', 'relics', 'pipa', 'surf', 'flags', 'team']
      .includes(cfg.goal.type);
    cfg.periods = (cfg.flow === 'career' && splitGoal)
      ? clamp(Math.round(fx.periods || 3), 1, 5) : 1;
    if (cfg.periods > 1) {
      // extra periods (mod) share the same bar, so they get a proportional base
      const base = cfg.goal.value * (cfg.periods > 3 ? 3 / cfg.periods : 1);
      const per = [];
      for (let k = 0; k < cfg.periods; k++) {
        const mul = k === cfg.periods - 1 ? 1.25 : 1;
        per.push(Math.max(1, Math.round(base * mul)));
      }
      cfg.goal.per = per;
      cfg.goal.value = per.reduce((a, b) => a + b, 0);
    }
    if (!cfg.cutscene && cfg.flow === 'heat') cfg.cutscene = CUTSCENES.squad;
    if (!cfg.cutscene && cfg.flow === 'league') cfg.cutscene = CUTSCENES.squad;
    if (!cfg.cutscene && cfg.flow === 'event') cfg.cutscene = CUTSCENES.event;
    const map = getMap(cfg.mapId);
    const taken = [];
    const spawn = this.findSpawn(map, map.spawn.x, map.spawn.y, taken);
    taken.push(spawn);
    const player = new Rider(map, {
      isPlayer: true, name: 'Zel', variant: 'zel',
      scoreMul: fx.scoreFactor,
      x: spawn.x, y: spawn.y,
    });
    const rivals = (cfg.rivals || []).map((r, i) => {
      const ang = (i / Math.max(1, cfg.rivals.length)) * Math.PI * 2;
      const rx = clamp(Math.round(spawn.x + Math.cos(ang) * (4 + i)), 2, map.w - 3);
      const ry = clamp(Math.round(spawn.y + Math.sin(ang) * (3 + i)), 2, map.h - 3);
      const s = this.findSpawn(map, rx, ry, taken);
      taken.push(s);
      const rider = new Rider(map, {
        name: r.name, variant: r.variant || 'roxo', ai: r.ai || 1,
        x: s.x, y: s.y,
      });
      // the legend runs flat out: no easing off when ahead, faster gates
      rider.legend = !!r.legend;
      return rider;
    });
    // teammates ride the same island and score for the same team
    const allies = (cfg.allies || []).map((a, i) => {
      const ang = ((i + rivals.length) / Math.max(1, (cfg.rivals || []).length + (cfg.allies || []).length)) * Math.PI * 2;
      const ax = clamp(Math.round(spawn.x + Math.cos(ang) * 3), 2, map.w - 3);
      const ay = clamp(Math.round(spawn.y + Math.sin(ang) * 3), 2, map.h - 3);
      const s = this.findSpawn(map, ax, ay, taken);
      taken.push(s);
      const rider = new Rider(map, {
        name: a.name, variant: a.variant || 'azul', ai: a.ai || 2,
        x: s.x, y: s.y,
      });
      rider.team = 'player';
      rider.ally = true;
      return rider;
    });
    rivals.push(...allies);
    this.run = {
      def: cfg,
      map,
      player,
      rivals,
      periods: cfg.periods || 1,
      period: 0,
      periodLen: cfg.duration / (cfg.periods || 1),
      time: cfg.duration / (cfg.periods || 1),
      periodWins: [],
      periodBase: 0,
      lastGain: 0,
      lastTarget: 0,
      lastWon: false,
      goalHit: false,
      breakT: 0,
      invert: !!fx.invertControls,
      turboEternal: !!fx.turboEternal,
      phase: cfg.cutscene?.shots?.length ? 'cutscene'
        : cfg.intro && cfg.intro.length ? 'dialog' : 'countdown',
      gateIdx: 0,
      gatePos: map.gates[0] || { x: map.w / 2, y: map.h / 2 },
      gateT: 0,
      relics: map.relics.map((r) => ({ ...r, taken: false, respawn: 0 })),
      collected: [],
      gatesPassed: 0,
      relicsTaken: 0,
      worst: 0,
      banterT: rand(10, 16),
      rogueCd: rand(12, 18),
      rogueDone: false,
      winPending: 0,
      mods: cfg.mods || [],
      track: cfg.music || null,
      fins: [],
      elapsed: 0,
      milestone: 0,
      modeLabel: cfg.flow === 'career' ? 'HISTÓRIA' : cfg.flow === 'league' ? 'LIGA'
        : cfg.flow === 'legend' ? 'A LENDA' : cfg.flow === 'hangout' ? 'ROLÊ'
          : cfg.flow === 'holiday' ? 'FESTA DO ANO' : cfg.flow === 'daily' ? 'DESAFIO DO DIA'
            : cfg.flow === 'explore' ? 'MODO LIVRE'
              : cfg.flow === 'bonus' ? 'BÔNUS'
                : cfg.flow === 'sandbox' ? 'VIDA 2000' : 'COMPETITIVO',
      objective: this.objectiveFor(cfg),
      goalLabel: cfg.goal.type === 'place' ? 'LUGAR'
        : cfg.goal.type === 'flags' ? 'CAPTURAS'
          : cfg.goal.type === 'team' ? 'TIME'
            : cfg.goal.type === 'pipa' ? 'PIPAS'
              : cfg.goal.type === 'surf' ? 'ONDAS' : 'META',
      team: !!cfg.allies?.length || cfg.goal.type === 'team' || cfg.goal.type === 'flags',
      teamScore: 0,
      board: () => {
        const list = [player, ...rivals];
        return list.slice().sort((a, b) => b.score - a.score || b.gates - a.gates);
      },
      cutscene: cfg.cutscene?.shots?.length
        ? { shots: cfg.cutscene.shots, i: 0, t: 0, music: cfg.cutscene.music }
        : null,
    };
    this.run.camBounds = this.cameraBounds(map);
    this.run.noHud = !!fx.noHud;
    this.run.weather = cfg.weather || map.weather || 'sun';
    if (cfg.goal.type === 'pipa') this.spawnKites(this.run);
    if (cfg.goal.type === 'surf') this.spawnWaves(this.run);
    if (cfg.goal.type === 'flags') this.setupFlags(this.run);
    if (fx.sharks || (cfg.mods && cfg.mods.includes('chaos'))) {
      for (let i = 0; i < 2 + (fx.sharks ? 2 : 0); i++) {
        this.run.fins.push({ x: rand(4, map.w - 4), y: rand(4, map.h - 4), ph: rand(0, 6) });
      }
    }
    // chaotic community mod: kites all over the map, whatever the goal is
    if (fx.kiteStorm) {
      this.spawnKites(this.run);
      const base = this.run.kites.slice();
      for (let i = 0; i < 8; i++) {
        const k = base[i % base.length];
        this.run.kites.push({ ...k, ph: rand(0, 6.28) });
      }
    }
    this.countdown = 3.4;
    this.tauntCd = 0;
    this.screenName = 'play';
    this.screenT = 0;
    this.audio.ensure();
    this.audio.sfx('quest');
    this.camera.snapTo(isoX(player.x, player.y), isoY(player.x, player.y) - 18);
    this.camera.bounds = this.cameraBounds(map);
    this.ui.toasts.length = 0;
    this.ui.showBanner(cfg.title, '', '#ffe066', 2.4);
    if (this.run.weather === 'snow') this.audio.sfx('snow');
    if (this.run.phase === 'dialog') {
      this.ui.say(cfg.intro, () => {
        this.run.phase = 'countdown';
        this.countdown = 3.2;
      }, (choice) => this.applyChoice(choice));
    } else {
      this.ui.dialog = null;
    }
    this.persist();
  }

  findSpawn(map, cx, cy, taken) {
    for (let r = 0; r < Math.max(map.w, map.h); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const x = clamp(cx + dx, 1, map.w - 2);
          const y = clamp(cy + dy, 1, map.h - 2);
          if (map.isSolid(x, y)) continue;
          if (taken.some((s) => Math.hypot(s.x - x, s.y - y) < 2)) continue;
          return { x, y };
        }
      }
    }
    return { x: clamp(cx, 1, map.w - 2), y: clamp(cy, 1, map.h - 2) };
  }

  updateCutscene(dt) {
    const run = this.run;
    const cs = run?.cutscene;
    if (!cs) return;
    if (this.input.hit('KeyE', 'Enter', 'Space', 'Escape')) {
      this.endCutscene();
      return;
    }
    const shot = cs.shots[cs.i];
    if (!shot) { this.endCutscene(); return; }
    let tx = run.player.x, ty = run.player.y;
    if (shot.target === 'center') { tx = run.map.w / 2; ty = run.map.h / 2; }
    else if (shot.target === 'gate' && run.map.gates?.[0]) {
      tx = run.map.gates[0].x; ty = run.map.gates[0].y;
    } else if (shot.target === 'dock' && run.map.dock) {
      tx = run.map.dock.x; ty = run.map.dock.y;
    }
    const gx = isoX(tx, ty), gy = isoY(tx, ty) - 24;
    const k = Math.min(1, dt * 2.2);
    this.camera.x += (gx - this.camera.x) * k;
    this.camera.y += (gy - this.camera.y) * k;
    cs.t += dt;
    if (cs.t >= (shot.dur || 4.5)) {
      cs.i++;
      cs.t = 0;
      if (cs.i >= cs.shots.length) this.endCutscene();
    }
  }

  endCutscene() {
    const run = this.run;
    if (!run) return;
    const cfg = run.def;
    run.cutscene = null;
    if (cfg.intro && cfg.intro.length) {
      run.phase = 'dialog';
      this.ui.say(cfg.intro, () => {
        run.phase = 'countdown';
        this.countdown = 3.2;
      }, (choice) => this.applyChoice(choice));
    } else {
      run.phase = 'countdown';
      this.countdown = 3.2;
      this.ui.dialog = null;
    }
    this.audio.sfx('select');
  }

  cameraBounds(map) {
    // leave a two-tile sea apron visible past the arena walls
    const minX = isoX(-2, map.h + 1) + VIEW.W / 2;
    const maxX = isoX(map.w + 1, -2) - VIEW.W / 2;
    const minY = isoY(-2, -2) + VIEW.H / 2;
    const maxY = isoY(map.w + 1, map.h + 1) - VIEW.H / 2;
    const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    return {
      minX: minX > maxX ? midX : minX,
      maxX: minX > maxX ? midX : maxX,
      minY: minY > maxY ? midY : minY,
      maxY: minY > maxY ? midY : maxY,
    };
  }

  objectiveFor(cfg) {
    const g = cfg.goal;
    if (cfg.flow === 'explore') return 'Explore a ilha · F no cais volta pro arquipélago';
    if (cfg.flow === 'sandbox') return 'Vila 2000 · E interage · coma, beba, durma e converse';
    if (cfg.flow === 'bonus') return `Bônus: ${this.bonusGoalText(g)}`;
    if (g.type === 'flags') return `Capture ${g.value} bandeiras rivais e leve pra sua base`;
    if (g.type === 'team') return `Time: faça ${g.value.toLocaleString('pt-BR')} pontos com seu parceiro`;
    if (g.type === 'pipa') return `Corte ${g.value} pipas rivais na velocidade`;
    if (g.type === 'surf') return `Surfe ${g.value} ondas clássicas`;
    if (cfg.flow === 'hangout') {
      if (g.type === 'gates') return `Rolê: passe ${g.value} gates com a galera`;
      if (g.type === 'relics') return `Rolê: colete ${g.value} relíquias com a galera`;
      return 'Rolê livre com os amigos';
    }
    if (cfg.flow === 'legend') {
      if (g.type === 'place') return 'Vença a lenda em uma partida';
      if (g.type === 'score') return `Faça ${g.value.toLocaleString('pt-BR')} pontos`;
      if (g.type === 'gates') return `Passe ${g.value} gates`;
      if (g.type === 'relics') return `Colete ${g.value} relíquias`;
      return 'Vença a lenda';
    }
    if (cfg.flow === 'career') {
      if (g.type === 'score') return `Faça ${g.value} pontos antes do tempo acabar`;
      if (g.type === 'gates') return `Passe por ${g.value} gates`;
      if (g.type === 'relics') return `Colete ${g.value} relíquias`;
    }
    if (cfg.flow === 'league') return 'Vença o heat pra continuar na liga';
    return 'Termine em 1º lugar contra 3 rivais';
  }

  /* ------------------------------------------------- pipa / surf / bandeira */
  spawnKites(run) {
    const map = run.map;
    const total = Math.max(5, (run.def.goal.value || 5) + 3);
    const palette = ['#ff8f6b', '#b07cff', '#ffe066', '#8fd3e8', '#8ee58e'];
    run.kites = [];
    for (let i = 0; i < total; i++) {
      let x = map.spawn.x, y = map.spawn.y, tries = 0;
      do {
        x = rand(2, map.w - 3);
        y = rand(2, map.h - 3);
        tries++;
      } while ((map.isSolid(x, y) || map.at(x, y) === 'X') && tries < 80);
      run.kites.push({
        x, y, taken: false, respawn: 0, ph: rand(0, 6.28),
        color: palette[i % palette.length],
      });
    }
  }

  spawnWaves(run) {
    run.waves = [];
    for (let i = 0; i < 2; i++) run.waves.push(this.freshWave(run.map, i));
  }

  freshWave(map, id = 0) {
    let best = null, bestScore = -1;
    for (let k = 0; k < 36; k++) {
      const x = rand(2, map.w - 3), y = rand(2, map.h - 3);
      if (map.isSolid(x, y)) continue;
      const wet = map.at(x, y) === 'W' || map.at(x, y) === 'w';
      const sc = (wet ? 2 : 0) + Math.random();
      if (sc > bestScore) { bestScore = sc; best = { x, y }; }
    }
    return {
      x: best?.x ?? map.spawn.x, y: best?.y ?? map.spawn.y,
      ph: rand(0, 6.28), id, cool: 0,
    };
  }

  setupFlags(run) {
    const map = run.map;
    const base = map.spawn;
    const home = { x: base.x, y: base.y };
    const away = { x: map.w - 1 - base.x, y: map.h - 1 - base.y };
    run.flags = {
      player: { ...home, homeX: home.x, homeY: home.y, carried: false },
      rival: { ...away, homeX: away.x, homeY: away.y, carried: false },
      score: { player: 0, rival: 0 }, carry: null, cooldown: 0,
    };
    run.team = true;
  }

  restartRun() {
    if (!this.run) { this.screenName = 'main'; return; }
    if (this.run.def.flow === 'sandbox') { this.startSandbox(); return; }
    const cfg = this.run.def;
    this.startConfig(cfg);
  }

  quitRun() {
    const flow = this.run?.def.flow;
    if (flow === 'sandbox' || flow === 'explore') this.persist();
    this.run = null;
    this.screenName = flow === 'explore' ? 'world'
      : (flow === 'legend' || flow === 'hangout') ? 'post' : 'main';
    this.audio.sfx('ui');
  }

  /* ------------------------------------------------------------- play update */
  updatePlay(dt) {
    this.screenT += 0;
    const run = this.run;
    if (!run) { this.screenName = 'main'; return; }
    const i = this.input;

    if (this.ui.active) {
      this.ui.updateDialog(dt, i, this.audio, (choice) => this.applyChoice(choice));
      this.updateCamera(dt);
      return;
    }

    if (i.hit('Escape')) {
      this.pauseIndex = 0;
      this.screenName = 'paused';
      this.audio.sfx('ui');
      return;
    }

    if (run.phase === 'cutscene') {
      this.updateCutscene(dt);
      return;
    }

    if (run.phase === 'epilogue' || run.phase === 'done') {
      this.updateCamera(dt);
      return;
    }

    if (run.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        run.phase = 'race';
        this.ui.showBanner('VAI!', 'cai dentro', '#ffe066', 0.9);
        this.audio.sfx('gate');
      }
      this.updateCamera(dt);
      return;
    }

    // half-time: the sea freezes for a beat, the board reads out the period
    if (run.phase === 'break') {
      run.breakT -= dt;
      if (run.breakT <= 0) {
        run.period++;
        run.time = run.periodLen;
        run.phase = 'race';
        this.ui.showBanner(`${run.period + 1}º TEMPO`, 'segue o jogo', '#ffe066', 2.2);
        this.audio.sfx('gate');
      }
      this.updateCamera(dt);
      return;
    }

    if (i.hit('KeyM')) {
      this.muted = !this.muted;
      this.audio.setMuted(this.muted);
      this.persist();
      this.ui.toast(this.muted ? 'Som mutado.' : 'Som de volta.', '#8fd3e8');
    }
    if (i.hit('KeyH')) {
      this.settings.noHud = !this.settings.noHud;
      this.persist();
      this.ui.toast(this.settings.noHud ? 'HUD desligado. Só a onda.' : 'HUD de volta.', '#b07cff');
    }

    const player = run.player;
    run.elapsed += dt;
    const sandbox = run.def.flow === 'sandbox';
    if (run.def.flow !== 'explore' && !sandbox) run.time -= dt;
    if (sandbox) this.updateSandbox(dt);

    if (sandbox && i.hit('KeyE')) {
      this.interactSandbox();
      if (this.ui.active) return;
    }

    // the dock is the door back to the archipelago
    if (run.def.flow === 'explore' && i.hit('KeyF')) {
      const dock = run.map.dock || run.map.spawn;
      if (Math.hypot(player.x - dock.x, player.y - dock.y) < 3.4) {
        this.exitExplore();
        return;
      }
      this.ui.toast('Volta pro cais pra viajar entre as ilhas.', '#8fd3e8');
    }

    // input: screen WASD -> iso grid directions
    let ix = 0, iy = 0;
    if (i.down('KeyW', 'ArrowUp')) { ix -= 1; iy -= 1; }
    if (i.down('KeyS', 'ArrowDown')) { ix += 1; iy += 1; }
    if (i.down('KeyA', 'ArrowLeft')) { ix -= 1; iy += 1; }
    if (i.down('KeyD', 'ArrowRight')) { ix += 1; iy -= 1; }
    const dir = { x: ix, y: iy };
    if (run.invert) { dir.x = -dir.x; dir.y = -dir.y; }
    const canControl = player.lockT <= 0;
    player.speedMul = sandbox && (run.needs.energy <= 10 || run.needs.food <= 4) ? 0.72 : 1;
    if (player.boostT <= 0 && i.down('ShiftLeft', 'ShiftRight')) {
      if (player.turbo >= 12) {
        player.startBoost(() => this.audio.sfx('boost'));
        this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y) - 8,
          'water', 10, { speed: [20, 80], grav: 30, angle: Math.PI * 1.4, spread: 0.7 });
      }
    }
    if (i.hit('Space')) {
      if (player.ollie()) {
        this.audio.sfx('jump');
        this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y), 'water', 8);
      }
    }
    let trickKey = null;
    if (i.hit('KeyJ')) trickKey = 'grab';
    if (i.hit('KeyK')) trickKey = 'spin';
    if (i.hit('KeyL')) trickKey = 'flip';
    if (trickKey) {
      const tr = player.doTrick(trickKey);
      if (tr) {
        this.audio.sfx('trick');
        this.ui.showPopup(tr.name.toUpperCase() + '!', tr.color, 0.55);
      }
    }
    if (i.hit('KeyE') && this.tauntCd <= 0 && this.settings.banter !== false) {
      this.tauntCd = 4;
      this.ui.toast(pick(TAUNTS), '#8fd3e8');
      this.audio.sfx('select');
    }

    const env = {
      onBail: (reason) => {
        this.audio.sfx('bail');
        this.camera.kick(3);
        this.spheres(player);
        this.ui.showPopup('WIPEOUT!', '#ff8f6f', 1.4);
        if (this.settings.banter !== false) this.ui.toast(pick(BAIL_LINES), '#ff9f9f');
        void reason;
      },
      onTrick: (tr, pts, combo) => {
        this.audio.sfx('trick');
        this.ui.showPopup(`${tr.label} +${pts}`, tr.color, 1.1);
        if (combo >= 3) this.ui.toast(`COMBO x${combo}! ${pick(COMBO_LINES)}`, '#ffe066');
        if (run.def.flow === 'explore') this.questEvent('tricks', 1);
        this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y) - 20,
          'star', 12, { grav: -30 });
        this.camera.kick(1.2);
      },
      onLand: () => {
        this.audio.sfx('splash');
        this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y),
          'water', 8, { grav: 120 });
      },
    };

    // player's trick timer
    if (player.trick) player.trick.t += dt;
    player.update(dt, { map: run.map, sea: this.sea, input: dir, canControl, ...env });
    if (run.turboEternal) player.turbo = 100;
    if (player.justLaunched) {
      player.justLaunched = false;
      this.audio.sfx('jump');
      this.camera.kick(1.6);
      this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y),
        'water', 14, { speed: [30, 110], grav: 120 });
    }
    // wake spray behind the board
    run.wakeT = (run.wakeT || 0) - dt;
    if (!player.air && player.speed > 5 && run.wakeT <= 0) {
      run.wakeT = 0.045;
      this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y) + 2,
        'water', 2, { speed: [12, 46], life: [0.2, 0.45], grav: 90, spread: 0.5 });
    }
    // tiny flow score for going fast
    if (player.speed > 5.5) player.addScore(dt * player.speed * 0.9);

    // Every 1.000 points the run pops a milestone: turbo refill, fireworks and
    // a permanent count on the athlete profile.
    const mile = Math.floor(player.score / 1000);
    if (mile > run.milestone) {
      run.milestone = mile;
      player.turbo = 100;
      this.ui.showBanner(`MILESTONE ${mile * 1000}`, this.milestoneTitle(mile), '#ffe066', 1.8);
      this.ui.showPopup('TURBO CHEIO!', '#8fd3e8', 1.1);
      if (this.settings.banter !== false) this.ui.toast(pick(MILESTONE_LINES), '#ffe066', 3);
      this.audio.sfx('milestone');
      this.camera.kick(2.4);
      this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y) - 18,
        'star', 26, { grav: -35 });
      this.save.milestones = (this.save.milestones || 0) + 1;
      this.save.bestMilestone = Math.max(this.save.bestMilestone || 0, mile * 1000);
    }

    // rivals
    for (const r of run.rivals) {
      if (r.hidden) continue;
      // rubber-band: rivals behind push a little harder, leaders ease off —
      // except the legend, who never eases off and pushes hardest when behind
      const gap = run.player.score - r.score;
      // A rival in front keeps the pedal down: only a light band, so a bot
      // that earned a lead can actually hold it instead of waiting for you.
      const band = r.legend
        ? 1 + Math.max(0, Math.min(gap, 5000)) / 5000 * 0.08
        : clamp(1 + gap / 12000, 0.94, 1.16);
      r.speedMul = (0.84 + r.ai * 0.045) * band;
      let target = sandbox ? this.npcRoutineTarget(r)
        : r.ai >= 1 ? r.raceTarget(run) : null;
      if (run.flags) {
        const flag = r.team === 'player' ? run.flags.rival : run.flags.player;
        const home = r.team === 'player' ? run.flags.player : run.flags.rival;
        target = r.carryFlag ? home : flag;
      } else if (run.event?.hunt) {
        let best = null, bestD = Infinity;
        for (const c of run.hunt || []) {
          if (c.taken) continue;
          const d = Math.hypot(r.x - c.x, r.y - c.y);
          if (d < bestD) { bestD = d; best = c; }
        }
        if (best) target = best;
      } else if (run.def.goal.type === 'pipa' && run.kites) {
        let best = null, bestD = Infinity;
        for (const k of run.kites) {
          if (k.taken) continue;
          const d = (r.x - k.x) ** 2 + (r.y - k.y) ** 2;
          if (d < bestD) { bestD = d; best = k; }
        }
        if (best) target = best;
      }
      const aiDir = r.think(dt, run.map, target, run);
      r.update(dt, {
        map: run.map, sea: this.sea, input: aiDir, canControl: true,
        onBail: () => {},
        onTrick: () => {},
        onLand: () => {},
      });
      if (r.justLaunched) r.justLaunched = false;
      r.gateCd = Math.max(0, (r.gateCd || 0) - dt);
      const gate = r.gatePos || run.gatePos;
      const gdx = r.x - gate.x, gdy = r.y - gate.y;
      if (gdx * gdx + gdy * gdy < 1.21 && r.gateCd <= 0) {
        // rivals bank their own gates, so a fast bot can pull ahead on gates
        // while the player is still lining up the same buoy
        const pts = r.bankGate(run, gate);
        if (gate.x === run.gatePos.x && gate.y === run.gatePos.y) {
          this.ui.toast(`${r.name} passou o gate que era seu. +${pts} pra ele.`, '#ff9f9f', 2.4);
          this.audio.sfx('gate');
        }
      }
      r.turbo = clamp(r.turbo + dt * (r.legend ? 7 : 4), 0, 100);
    }
    if (run.team || run.flags) {
      run.teamScore = Math.round(run.player.score + run.rivals
        .filter((r) => r.team === 'player')
        .reduce((sum, r) => sum + r.score, 0));
    }

    // Someone taking the lead is the point of a race: call it out so the
    // scoreboard is not the only place a rival can win.
    run.leadCallT = Math.max(0, (run.leadCallT || 0) - dt);
    if (run.leadCallT <= 0 && !sandbox &&
      (run.def.goal.type === 'place' || ['heat', 'league', 'legend'].includes(run.def.flow))) {
      const top = run.board()[0];
      if (top && !top.isPlayer && top.score > player.score + 1) {
        run.leadCallT = 20;
        this.ui.toast(`${top.name} assumiu a ponta: ${Math.round(top.score)} × ${Math.round(player.score)}.`, RIVAL_TINT[top.variant] || '#ffe066', 3);
      }
    }

    // In relic heats the rivals actually race for the pickups, not just gates.
    if (run.def.goal.type === 'relics') {
      for (const r of run.rivals) {
        if (r.hidden) continue;
        for (const rel of run.relics) {
          if (rel.taken) continue;
          const rdx = r.x - rel.x, rdy = r.y - rel.y;
          if (rdx * rdx + rdy * rdy > 1.0) continue;
          rel.taken = true;
          rel.respawn = 24;
          rel.by = r.name;
          run.relicsTaken++;
          r.relics++;
          r.comboUp();
          r.addScore(240 * Math.max(2, r.combo));
          r.turbo = clamp(r.turbo + 18, 0, 100);
          this.ui.toast(`${r.name} pegou uma relíquia. Corre.`, '#ff9f9f', 2.2);
          break;
        }
      }
    }

    if (run.def.flow === 'event' || run.flags || run.team || run.hunt) this.updateEventWorld(dt);

    // gates
    run.gateT += dt;
    run.gatePos.bob = Math.sin(run.gateT * 3);
    const pgx = player.x - run.gatePos.x, pgy = player.y - run.gatePos.y;
    if (pgx * pgx + pgy * pgy < 1.1025) {
      this.passGate();
    }

    // relics
    run.relics.forEach((rel, idx) => {
      if (rel.taken) {
        rel.respawn -= dt;
        if (rel.respawn <= 0) rel.taken = false;
        return;
      }
      const rdx = player.x - rel.x, rdy = player.y - rel.y;
      if (rdx * rdx + rdy * rdy < 0.9025) {
        rel.taken = true;
        rel.respawn = 20;
        run.relicsTaken++;
        player.relics++;
        player.comboUp();
        player.addScore(320 * Math.max(2, player.combo));
        player.turbo = clamp(player.turbo + 22, 0, 100);
        if (!this.save.relics.includes(rel.id)) this.save.relics.push(rel.id);
        run.collected.push(rel.id);
        if (run.def.flow === 'explore') this.questEvent('relics', 1);
        this.ui.showPopup(RELICS[rel.id]?.name || 'RELÍQUIA', '#b07cff', 1.5);
        if (this.settings.banter !== false) this.ui.toast(pick(RELIC_LINES), '#b07cff');
        this.audio.sfx('pickup');
        this.particles.burst(isoX(rel.x, rel.y), isoY(rel.x, rel.y) - 8,
          'star', 16, { grav: -20 });
        this.audio.sfx('quest');
      }
      void idx;
    });

    // golden modem hunt: one per island, pays XP and counts as a secret
    if (run.modem) {
      run.modem.ph += dt;
      if (Math.hypot(player.x - run.modem.x, player.y - run.modem.y) < 1.2) {
        const m = run.modem;
        run.modem = null;
        this.save.modems = this.save.modems || [];
        if (!this.save.modems.includes(m.mapId)) this.save.modems.push(m.mapId);
        this.save.xp += 500;
        const eggs = this.save.eggs = this.save.eggs || [];
        const fresh = !eggs.includes('modem');
        if (fresh) eggs.push('modem');
        this.ui.showBanner('MODEM DOURADO', `${this.save.modems.length}/${ISLANDS.length} ilhas`, '#ffe066', 3.6);
        this.ui.toast(`MODEM DOURADO: +500 XP (${this.save.modems.length}/${ISLANDS.length})`, '#ffe066', 4);
        this.audio.sfx('achievement');
        if (this.save.modems.length >= ISLANDS.length) {
          this.save.xp += 1500;
          this.ui.showBanner('CAÇA COMPLETA', 'os sete modems são seus', '#ffd24d', 4.5);
          this.audio.sfx('unlock');
        }
        this.checkAchievements();
        this.persist();
      }
    }

    // festival kites: cross their line at speed to cut them
    if (run.kites) {
      for (const k of run.kites) {
        if (k.taken) {
          k.respawn -= dt;
          if (k.respawn <= 0) k.taken = false;
          continue;
        }
        if (Math.hypot(player.x - k.x, player.y - k.y) < 1.05 &&
          (player.speed > 4 || player.air)) {
          k.taken = true;
          k.respawn = 12;
          player.pipas++;
          player.comboUp();
          player.addScore(380 * Math.max(2, player.combo));
          this.ui.showPopup(`PIPA CORTADA ${player.pipas}/${run.def.goal.value}`, '#8ee58e', 1.2);
          this.audio.sfx('chopped');
          this.particles.burst(isoX(k.x, k.y), isoY(k.x, k.y) - 14, 'star', 12, { grav: -20 });
          continue;
        }
        for (const r of run.rivals) {
          if (r.hidden || r.speed < 3.5) continue;
          if (Math.hypot(r.x - k.x, r.y - k.y) > 1.0) continue;
          k.taken = true;
          k.respawn = 14;
          r.pipas++;
          r.addScore(260);
          this.ui.toast(`${r.name} cortou uma pipa. Não deixa abrir vantagem.`, '#ff9f9f', 2.2);
          break;
        }
      }
    }

    // classic surf: ride the crest while fast, then it reforms elsewhere
    if (run.waves) {
      for (const w of run.waves) {
        if (w.cool > 0) { w.cool -= dt; continue; }
        const dx = player.x - w.x, dy = player.y - w.y;
        if (dx * dx + dy * dy > 1.69 || player.speed < 4.5) continue;
        player.waves++;
        player.comboUp();
        player.addScore(300 * Math.max(2, player.combo));
        player.turbo = clamp(player.turbo + 14, 0, 100);
        this.ui.showPopup(`ONDA CLÁSSICA ${player.waves}/${run.def.goal.value}`, '#8fd3e8', 1.2);
        this.audio.sfx('splash');
        this.particles.burst(isoX(w.x, w.y), isoY(w.x, w.y), 'water', 14, { grav: 90 });
        Object.assign(w, this.freshWave(run.map, w.id));
        w.cool = 0.6;
      }
    }

    // banter
    if (this.settings.banter !== false) {
      run.banterT -= dt;
      if (run.banterT <= 0) {
        run.banterT = rand(14, 23);
        const line = pick(COMP_BANTER);
        this.ui.toast(line.text, line.text.includes('Tia') ? '#ff9fd0' : '#8fd3e8', 3.4);
      }
    }

    // rogue waves
    if ((run.mods.includes('rogue') || run.map.weather === 'storm') && run.def.eventId !== 'waverush') {
      run.rogueCd -= dt;
      if (run.rogueCd <= 0 && !this.sea.rogue) {
        run.rogueCd = rand(17, 26);
        run.rogueDone = false;
        this.sea.triggerRogue();
        this.ui.showBanner('PAREDE DE ÁGUA!', 'pule pra sobreviver', '#ff8f6f', 2.3);
        this.ui.toast(pick(STORM_LINES), '#ff9f9f');
        this.audio.sfx('wave');
      }
      if (this.sea.rogue && !run.rogueDone && this.sea.rogue.t / this.sea.rogue.dur > 0.52) {
        run.rogueDone = true;
        if (!player.air) {
          player.bail('wave');
          this.ui.showPopup('A ONDA TE LEVOU!', '#ff8f6f', 1.5);
        } else {
          player.comboUp();
          player.addScore(450 * player.combo);
          this.ui.showPopup(`SALTO ÉPICO +${450 * player.combo}`, '#ffe066', 1.4);
          this.audio.sfx('trick');
        }
      }
    }

    // sharks in chaos mode
    for (const fin of run.fins) {
      fin.ph += dt;
      const ang = Math.atan2(player.y - fin.y, player.x - fin.x);
      fin.x += Math.cos(ang) * dt * 1.9 + Math.sin(fin.ph * 2) * dt * 0.5;
      fin.y += Math.sin(ang) * dt * 1.9 + Math.cos(fin.ph * 1.7) * dt * 0.5;
      if (Math.hypot(fin.x - player.x, fin.y - player.y) < 0.8 && !player.air) {
        player.bail('shark');
        this.ui.showPopup('TUBARÃO!', '#ff8f6f', 1.3);
        this.audio.sfx('bail');
        fin.x -= 3;
        fin.y -= 3;
      }
    }

    // ambient spray from the sea
    if (Math.random() < dt * 3) {
      this.sea.splash(rand(0, VIEW.W), rand(120, VIEW.H), 1);
    }

    // update camera, particles, goal
    this.updateCamera(dt);
    this.camera.shakeEnabled = this.settings.shake !== false;

    // combo milestone popups
    if (player.combo > 1 && player.combo > (run.lastCombo || 0)) {
      run.lastCombo = player.combo;
      if (player.combo >= 3) {
        this.ui.showBanner(`COMBO x${player.combo}`, pick(COMBO_LINES), '#ffe066', 1.1);
      }
    }

    // free roam never ends on its own
    if (run.def.flow === 'explore') return;

    if (run.winPending > 0) {
      run.winPending -= dt;
      if (run.winPending <= 0) this.finishRun(true);
      return;
    }
    // Hitting the goal clears the meta, but the match runs to the whistle:
    // the level is played in periods, so an early goal cannot cut it short.
    if (!run.goalHit && run.def.goal.type !== 'place' && run.elapsed > 6 && this.goalDone(run)) {
      run.goalHit = true;
      this.ui.showBanner('META BATIDA!', run.periods > 1
        ? 'agora soma nos tempos' : 'segura o ritmo até o apito', '#8ecf63', 2.2);
      this.audio.sfx('quest');
    }
    if (run.time <= 0) {
      run.time = 0;
      this.endPeriod();
    }
  }

  updateEventWorld(dt) {
    const run = this.run;
    if (!run) return;
    const p = run.player;

    if (run.flags) {
      const f = run.flags;
      f.cooldown = Math.max(0, (f.cooldown || 0) - dt);
      // player grabs the rival flag (unless an ally already has it)
      if (!f.carry && Math.hypot(p.x - f.rival.x, p.y - f.rival.y) < 1.5) {
        f.carry = 'rival'; f.rival.carried = true;
        this.ui.showPopup('BANDEIRA PEGA!', '#ff9f6b', 1.5);
        this.audio.sfx('pickup');
      }
      if (f.carry === 'rival') {
        f.rival.x = p.x; f.rival.y = p.y;
        if (Math.hypot(p.x - f.player.homeX, p.y - f.player.homeY) < 1.5 && f.cooldown <= 0) {
          f.score.player++;
          f.cooldown = 2.2; f.carry = null; f.rival.carried = false;
          f.rival.x = f.rival.homeX; f.rival.y = f.rival.homeY;
          this.ui.showBanner('CAPTURA!', `${f.score.player}/${run.def.goal.value}`, '#8ecf63', 2.2);
          this.audio.sfx('quest');
          this.persist();
        }
      }
      // teammates grab the enemy flag and carry it home too
      for (const r of run.rivals) {
        if (r.team !== 'player' || r.hidden) continue;
        if (!r.carryFlag && !f.carry && Math.hypot(r.x - f.rival.x, r.y - f.rival.y) < 1.4) {
          r.carryFlag = true;
          f.rival.carried = true;
          f.carry = 'ally';
          this.ui.toast(`${r.name} pegou a bandeira. Abre caminho pra ele.`, '#8ee58e', 2.4);
        }
        if (!r.carryFlag) continue;
        f.rival.x = r.x; f.rival.y = r.y;
        if (Math.hypot(r.x - f.player.homeX, r.y - f.player.homeY) < 1.4 && f.cooldown <= 0) {
          f.score.player++;
          r.carryFlag = false;
          f.rival.carried = false;
          f.carry = null;
          f.rival.x = f.rival.homeX; f.rival.y = f.rival.homeY;
          f.cooldown = 2.2;
          this.ui.showBanner('CAPTURA DO TIME!', `${f.score.player}/${run.def.goal.value}`, '#8ee58e', 2.2);
          this.audio.sfx('quest');
          this.persist();
        }
      }
      // rivals try to steal the player's flag and run it home
      for (const r of run.rivals) {
        if (r.team === 'player' || r.hidden) continue;
        if (!r.carryFlag && Math.hypot(r.x - f.player.x, r.y - f.player.y) < 1.4) {
          r.carryFlag = true; f.player.carried = true;
          this.ui.toast(`${r.name} pegou a bandeira. Corre.`, '#ff9f9f', 2.5);
          this.audio.sfx('bail');
        }
        if (r.carryFlag) {
          f.player.x = r.x; f.player.y = r.y;
          if (Math.hypot(r.x - f.rival.homeX, r.y - f.rival.homeY) < 1.4 && f.cooldown <= 0) {
            f.score.rival++; r.carryFlag = false; f.player.carried = false;
            f.player.x = f.player.homeX; f.player.y = f.player.homeY;
            f.cooldown = 2.2;
            this.ui.toast(`${r.name} capturou. O time do modem tá na frente.`, '#ff9f9f', 3);
          }
        }
      }
    }

    if (run.hunt) {
      for (const c of run.hunt) {
        if (c.taken) continue;
        if (Math.hypot(p.x - c.x, p.y - c.y) < 1.15) {
          c.taken = true; c.by = 'zel'; run.huntTaken = (run.huntTaken || 0) + 1;
          p.addScore(260); p.turbo = clamp(p.turbo + 18, 0, 100);
          this.ui.showPopup(`PISTA ${run.huntTaken}/${run.def.goal.value}`, c.color || '#b07cff', 1.4);
          this.audio.sfx('pickup');
          continue;
        }
        for (const r of run.rivals) {
          if (r.team === 'player' || r.hidden) continue;
          if (Math.hypot(r.x - c.x, r.y - c.y) < 1.1) {
            c.taken = true; c.by = r.name;
            this.ui.toast(`${r.name} achou uma pista primeiro. Ele tá caçando.`, '#ff9f9f', 2.5);
            break;
          }
        }
      }
    }

    if (run.event?.id === 'waverush') {
      run.waveT = (run.waveT ?? 7) - dt;
      if (run.waveT <= 0 && !run.waveActive) {
        run.waveT = 11; run.waveActive = true; run.waveResolved = false;
        this.sea.triggerRogue();
        this.ui.showBanner(`ONDA ${run.wavesCleared + 1}/${run.def.goal.value}`, 'pula ou vira peixe', '#ff8f6f', 2);
        this.audio.sfx('wave');
      }
      if (run.waveActive && this.sea.rogue && !run.waveResolved &&
        this.sea.rogue.t / this.sea.rogue.dur > 0.52) {
        run.waveResolved = true;
        if (p.air) {
          run.wavesCleared++;
          p.addScore(520 * Math.max(1, p.combo));
          this.ui.showPopup(`ONDA ${run.wavesCleared} SOBREVIVIDA`, '#ffe066', 1.6);
        } else {
          p.bail('wave');
          this.ui.showPopup('A ONDA TE LEVOU', '#ff8f6f', 1.6);
        }
        run.waveActive = false;
      }
    }

    if (run.team) {
      run.teamScore = Math.round(run.player.score + run.rivals
        .filter((r) => r.team === 'player')
        .reduce((sum, r) => sum + r.score, 0));
    }

    for (const o of run.obstacles || []) {
      if (o.hitCd > 0) { o.hitCd -= dt; continue; }
      if (!p.air && Math.hypot(p.x - o.x, p.y - o.y) < 0.7) {
        o.hitCd = 3;
        p.bail('rock');
        this.ui.showPopup('BATEU NO ENTULHO!', '#ff8f6f', 1.3);
        this.audio.sfx('bail');
      }
    }
  }

  updateCamera(dt) {
    const run = this.run;
    if (!run) return;
    const p = run.player;
    this.camera.bounds = run.camBounds || (run.camBounds = this.cameraBounds(run.map));
    // damped lead: the camera reads ahead without twitching on every carve
    const lead = run.camLead || (run.camLead = { x: 0, y: 0 });
    const k = 1 - Math.pow(0.02, dt);
    lead.x += (p.vx - lead.x) * k;
    lead.y += (p.vy - lead.y) * k;
    const lx = p.x + clamp(lead.x * 0.09, -0.85, 0.85);
    const ly = p.y + clamp(lead.y * 0.09, -0.85, 0.85);
    this.camera.follow(isoX(lx, ly), isoY(lx, ly) - 18, dt);
  }

  passGate() {
    const run = this.run;
    const p = run.player;
    p.gates++;
    run.gatesPassed++;
    if (run.def.flow === 'explore') this.questEvent('gates', 1);
    p.comboUp();
    p.turbo = clamp(p.turbo + 16, 0, 100);
    const pts = 140 * p.combo;
    p.addScore(pts);
    this.ui.showPopup(`GATE +${pts}`, '#8fd3e8', 0.9);
    if (this.settings.banter !== false && Math.random() < 0.5) {
      this.ui.toast(pick(GATE_LINES), '#8fd3e8');
    }
    this.audio.sfx('gate');
    this.particles.burst(isoX(run.gatePos.x, run.gatePos.y), isoY(run.gatePos.x, run.gatePos.y),
      'star', 14, { grav: -20 });
    // move the gate somewhere else
    const gates = run.map.gates;
    if (gates && gates.length) {
      for (let k = 0; k < 8; k++) {
        run.gateIdx = (run.gateIdx + 1) % gates.length;
        const g = gates[run.gateIdx];
        if (Math.hypot(g.x - p.x, g.y - p.y) > 3) { run.gatePos = g; break; }
      }
    }
    this.audio.sfx('pickup');
  }

  spheres(player) {
    this.particles.burst(isoX(player.x, player.y), isoY(player.x, player.y) - 6,
      'water', 22, { speed: [30, 120], grav: 140 });
  }

  goalDone(run) {
    const g = run.def.goal;
    if (g.type === 'score') return run.player.score >= g.value;
    if (g.type === 'gates') return run.player.gates >= g.value;
    if (g.type === 'relics') return run.player.relics >= g.value;
    if (g.type === 'pipa') return run.player.pipas >= g.value;
    if (g.type === 'surf') return run.player.waves >= g.value;
    if (g.type === 'flags') return (run.flags?.score.player || 0) >= g.value;
    if (g.type === 'team') return (run.teamScore || 0) >= g.value;
    if (g.type === 'place') {
      const board = run.board();
      return board.findIndex((r) => r.isPlayer) + 1 <= g.value;
    }
    return false;
  }

  /* accumulated goal progress — the same numbers the HUD shows */
  periodProgress(run) {
    const g = run.def.goal;
    if (g.type === 'score') return run.player.score;
    if (g.type === 'gates') return run.player.gates;
    if (g.type === 'relics') return run.player.relics;
    if (g.type === 'pipa') return run.player.pipas || 0;
    if (g.type === 'surf') return run.player.waves || 0;
    if (g.type === 'flags') return run.flags?.score.player || 0;
    if (g.type === 'team') return Math.round(run.teamScore || 0);
    return run.player.score;
  }

  /* the whistle: close the period, bank the partial and open half-time */
  endPeriod() {
    const run = this.run;
    if (!run) return;
    const goal = run.def.goal;
    // a single run has no whistle in the middle: the clock simply ends it
    if (run.periods <= 1) { this.finishRun(); return; }
    const now = this.periodProgress(run);
    const gain = Math.max(0, now - run.periodBase);
    const target = Math.max(1, goal.per?.[run.period]
      ?? Math.ceil(goal.value / run.periods));
    const won = gain >= target;
    run.periodWins.push(won);
    run.periodBase = now;
    run.lastGain = Math.round(gain);
    run.lastTarget = target;
    run.lastWon = won;
    this.audio.sfx(won ? 'quest' : 'deny');
    this.ui.showBanner(`${run.period + 1}º TEMPO FECHADO`,
      `${run.lastGain} / ${target} ${run.goalLabel}`, won ? '#8ecf63' : '#ff9f9f', 3);
    if (run.period + 1 < run.periods) {
      run.phase = 'break';
      run.breakT = 3.4;
    } else {
      this.finishRun(run.periodWins.filter(Boolean).length >= Math.ceil(run.periods / 2));
    }
  }

  /* ---------------------------------------------------------------- results */
  finishRun(winOverride) {
    const run = this.run;
    if (!run || run.phase === 'done') return;
    run.phase = 'done';
    const p = run.player;
    const board = run.board();
    const pos = board.findIndex((r) => r.isPlayer) + 1;
    const total = board.length;
    const goal = run.def.goal;
    const wonPeriods = run.periodWins.filter(Boolean).length;
    let win = winOverride;
    if (goal.type === 'place') win = pos <= goal.value;
    else if (run.periods > 1) win = wonPeriods >= Math.ceil(run.periods / 2);
    else win = this.goalDone(run);
    const def = run.def;
    const id = def.id;

    // stars / records
    let stars = 0;
    if (goal.type === 'score') {
      const r = p.score / goal.value;
      stars = r >= 2.2 ? 3 : r >= 1.5 ? 2 : r >= 1 ? 1 : 0;
    } else if (goal.type === 'gates') {
      const r = p.gates / goal.value;
      stars = r >= 1.8 ? 3 : r >= 1.3 ? 2 : r >= 1 ? 1 : 0;
    } else if (goal.type === 'relics') {
      const r = p.relics / goal.value;
      stars = r >= 1.6 ? 3 : r >= 1.2 ? 2 : r >= 1 ? 1 : 0;
    } else if (goal.type === 'pipa' || goal.type === 'surf') {
      const got = goal.type === 'pipa' ? p.pipas : p.waves;
      const r = got / goal.value;
      stars = r >= 1.8 ? 3 : r >= 1.3 ? 2 : r >= 1 ? 1 : 0;
    } else if (goal.type === 'flags') {
      const r = (run.flags?.score.player || 0) / goal.value;
      stars = r >= 1.8 ? 3 : r >= 1.3 ? 2 : r >= 1 ? 1 : 0;
    } else if (goal.type === 'team') {
      const r = (run.teamScore || p.score) / goal.value;
      stars = r >= 1.6 ? 3 : r >= 1.25 ? 2 : r >= 1 ? 1 : 0;
    } else {
      stars = win ? (p.score > 4500 ? 3 : 2) : pos === 2 ? 1 : 0;
    }
    // in a match of periods the stars are the periods you actually won
    if (goal.type !== 'place' && run.periods > 1) stars = wonPeriods;
    if (!win) stars = Math.min(stars, 1);

    let reward = '';
    let xp = 0;
    if (def.flow === 'career') {
      const c = CHAPTERS[def.chapterIndex];
      const key = 'ch:' + c.id;
      const prev = this.save.best[key] || { score: 0, stars: 0, combo: 0 };
      this.save.best[key] = {
        score: Math.max(prev.score, Math.round(p.score)),
        stars: Math.max(prev.stars, stars),
        combo: Math.max(prev.combo || 0, p.bestCombo),
      };
      if (win) {
        xp += 140 + stars * 40;
        if (def.chapterIndex === this.save.chapters) {
          this.save.chapters = Math.min(CHAPTERS.length, def.chapterIndex + 1);
          if (this.save.chapters >= CHAPTERS.length && !this.save.postgame) {
            this.save.postgame = true;
            reward = 'PÓS-GAME LIBERADO: A LENDA ZEL';
          } else if (def.chapterIndex + 1 < CHAPTERS.length) {
            reward = `CAPÍTULO ${def.chapterIndex + 2} DESBLOQUEADO`;
          }
        } else {
          reward = 'CAPÍTULO REJOGADO. AINDA CONTA.';
        }
        if (def.chapterIndex === CHAPTERS.length - 1) {
          this.save.postgame = true;
          reward = 'PÓS-GAME LIBERADO: A LENDA ZEL';
        }
      } else {
        reward = 'Tenta de novo. O mar não julga.';
      }
    } else if (def.flow === 'heat') {
      const key = 'map:' + run.map.id;
      const prev = this.save.best[key] || { score: 0, stars: 0, combo: 0 };
      this.save.best[key] = {
        score: Math.max(prev.score, Math.round(p.score)),
        stars: Math.max(prev.stars, stars),
        combo: Math.max(prev.combo || 0, p.bestCombo),
      };
      xp += [180, 100, 60, 20][clamp(pos - 1, 0, 3)] || 20;
      reward = pos === 1 ? 'PRIMEIRO LUGAR! MANDA PRO ORKUT.' : `Terminou em ${pos}º. Treina mais.`;
    } else if (def.flow === 'legend') {
      const i = def.legendIndex || 0;
      const key = 'legend:' + i;
      const prev = this.save.best[key] || { score: 0, stars: 0 };
      this.save.best[key] = {
        score: Math.max(prev.score, Math.round(p.score)),
        stars: Math.max(prev.stars, stars),
      };
      if (win) {
        xp += 420 + stars * 60;
        this.save.legend = Math.max(this.save.legend || 0, i + 1);
        if (i >= LEGEND_CHAPTERS.length - 1) this.save.legendDone = true;
        reward = i >= LEGEND_CHAPTERS.length - 1
          ? 'A LENDA FOI DERRUBADA. O ARQUIPÉLAGO É SEU.'
          : `LENDA ${i + 1}/${LEGEND_CHAPTERS.length} VENCIDA. A PRÓXIMA PROVA ABRIU.`;
      } else {
        reward = 'A lenda ainda tá no topo. Respira e tenta de novo.';
      }
    } else if (def.flow === 'hangout') {
      const i = def.hangoutIndex || 0;
      const h = HANGOUTS[i];
      const key = 'hangout:' + i;
      const prev = this.save.best[key] || { score: 0, stars: 0 };
      this.save.best[key] = {
        score: Math.max(prev.score, Math.round(p.score)),
        stars: Math.max(prev.stars, stars),
      };
      if (win) {
        this.save.hangouts[h.id] = true;
        xp += 240;
        reward = `ROLÊ COMPLETO COM ${h.friend.toUpperCase()}.`;
      } else {
        reward = 'O rolê terminou cedo. Chama a galera de novo.';
      }
    } else if (def.flow === 'daily') {
      const d = this.save.daily;
      const key = this.todayKey();
      const prev = this.save.best['daily:' + key] || { score: 0 };
      this.save.best['daily:' + key] = { score: Math.max(prev.score, Math.round(p.score)) };
      if (win) {
        if (!d.done || d.key !== key) {
          const streak = d.last === this.yesterdayKey() ? (d.streak || 0) + 1 : 1;
          d.key = key;
          d.done = true;
          d.last = key;
          d.streak = streak;
          d.best = Math.max(d.best || 0, Math.round(p.score));
          xp += run.daily?.xp || 300;
          reward = `DESAFIO COMPLETO · STREAK ${streak}${streak > 1 ? ' DIAS' : ''}`;
          this.publishCommunity('DESAFIO DO DIA', Math.round(p.score), `streak ${streak}`);
          if (streak === 3) this.unlockTape('tape_rocknight');
          if (streak === 7) this.unlockTape('tape_rainradio');
        } else reward = 'DESAFIO JÁ PAGO HOJE. AMANHÃ TEM OUTRO.';
      } else reward = 'O desafio de hoje continua aberto. Tenta de novo.';
    } else if (def.flow === 'bonus') {
      const st = run.bonusStage || BONUS_STAGES[def.bonusIndex] || BONUS_STAGES[0];
      const key = 'bonus:' + st.id;
      const prev = this.save.best[key] || { score: 0, stars: 0 };
      this.save.best[key] = {
        score: Math.max(prev.score, Math.round(p.score)),
        stars: Math.max(prev.stars || 0, stars),
      };
      this.save.bonus = this.save.bonus || {};
      if (win) {
        const first = !this.save.bonus[st.id];
        this.save.bonus[st.id] = Math.max(this.save.bonus[st.id] || 0, stars || 1);
        let gain = first ? (st.xp || 400) : Math.round((st.xp || 400) * 0.3);
        const dailyFirst = this.save.bonusDaily !== this.todayKey();
        if (dailyFirst) {
          this.save.bonusDaily = this.todayKey();
          gain += 150;
        }
        xp += gain;
        reward = `${first ? 'FASE BÔNUS COMPLETA' : 'BÔNUS REJOGADO'} · +${gain} XP`;
        if (dailyFirst) reward += ' · BÔNUS DO DIA';
        if (Object.keys(this.save.bonus).length >= BONUS_STAGES.length) {
          reward += ' · ARQUIVO INTEIRO!';
        }
      } else reward = 'Bônus não fechou. O arquivo continua aberto.';
    } else if (def.flow === 'event') {
      const ev = run.event;
      if (ev) {
        this.save.events = this.save.events || {};
        this.save.events[ev.id] = Math.max(this.save.events[ev.id] || 0, Math.round(p.score));
        this.save.eventsDone = Object.keys(this.save.events).length;
        if (win) {
          xp += 220;
          reward = `${ev.title} COMPLETO · +220 XP`;
        } else {
          reward = `${ev.title} não fechou. Tenta de novo.`;
        }
      }
    } else if (def.flow === 'holiday') {
      const h = run.holiday || HOLIDAYS[0];
      const prev = this.save.best['holiday:' + h.id] || { score: 0 };
      this.save.best['holiday:' + h.id] = { score: Math.max(prev.score, Math.round(p.score)) };
      if (win) {
        xp += h.xp || 500;
        const year = String(this.currentDate().getFullYear());
        if (this.save.holidays[h.id] !== year) {
          this.save.holidays[h.id] = year;
          reward = `${h.name} COMPLETO · +${h.xp || 500} XP`;
          this.publishCommunity(h.name, Math.round(p.score), 'festa do ano');
        } else reward = `${h.name} DE NOVO. TRADIÇÃO É TRADIÇÃO.`;
      } else reward = 'A festa continua. Tenta de novo.';
    } else if (def.flow === 'league') {
      const i = def.leagueHeat;
      const prev = this.save.best['heat:' + i] || { score: 0 };
      this.save.best['heat:' + i] = { score: Math.max(prev.score, Math.round(p.score)) };
      if (win) {
        xp += 260;
        this.league.wins++;
        this.league.streak++;
        this.league.total += Math.round(p.score);
        this.save.leagueWins = (this.save.leagueWins || 0) + 1;
        this.save.leagueStreak = Math.max(this.save.leagueStreak || 0, this.league.streak);
        this.save.leagueBest = Math.max(this.save.leagueBest || 0, this.league.total);
        reward = `HEAT VENCIDO! TOTAL ${this.league.total} PONTOS`;
      } else {
        reward = `A LIGA ACABOU NO HEAT ${i + 1}. TOTAL ${this.league.total + Math.round(p.score)} PONTOS.`;
        this.save.leagueBest = Math.max(this.save.leagueBest || 0, this.league.total + Math.round(p.score));
        this.league.streak = 0;
      }
    }

    this.save.xp += xp;
    this.save.runs = (this.save.runs || 0) + 1;
    this.save.bestCombo = Math.max(this.save.bestCombo || 0, p.bestCombo);
    const lt = this.save.lifetime;
    lt.gates += p.gates;
    lt.relics += p.relics;
    lt.bails += p.bails;
    lt.score += Math.round(p.score);
    this.persist();
    this.syncTapes(true);
    const newAch = this.checkAchievements({ score: p.score, combo: p.bestCombo }, true);
    if (newAch.length) {
      this.pendingAchievements = newAch;
      reward += ` · ${newAch.length} CONQUISTA${newAch.length > 1 ? 'S' : ''}`;
    }

    this.result = {
      win, title: def.title, score: Math.round(p.score), pos, total,
      bestCombo: p.bestCombo, gates: p.gates, relics: p.relics, bails: p.bails,
      pipas: p.pipas, waves: p.waves,
      flags: run.flags ? { ...run.flags.score } : null,
      milestones: run.milestone || 0,
      goalLine: win ? 'Objetivo cumprido.' : `Objetivo: ${this.goalText({
        goal,
      })}`.replace('Faça', 'fazer').replace('Passe', 'passar')
        .replace('Colete', 'coletar').replace('Capture', 'capturar')
        .replace('Corte', 'cortar').replace('Surfe', 'surfar'),
      reward, stars,
      best: def.flow === 'career'
        ? this.bestOf(CHAPTERS[def.chapterIndex].id)
        : def.flow === 'heat' ? this.mapBest(run.map.id)
          : def.flow === 'legend' ? (this.save.best['legend:' + (def.legendIndex || 0)]?.score || 0)
            : def.flow === 'hangout' ? (this.save.best['hangout:' + (def.hangoutIndex || 0)]?.score || 0)
              : def.flow === 'holiday' ? (this.save.best['holiday:' + (run.holiday?.id || '')]?.score || 0)
                : def.flow === 'daily' ? (this.save.daily.best || 0)
                  : def.flow === 'bonus' ? (this.save.best['bonus:' + (run.bonusStage?.id || '')]?.score || 0)
                    : (this.save.leagueBest || 0),
      flow: def.flow,
      chapterIndex: def.chapterIndex,
      leagueHeat: def.leagueHeat,
      legendIndex: def.legendIndex,
      hangoutIndex: def.hangoutIndex,
      bonusIndex: def.bonusIndex,
      holiday: run.holiday?.id || null,
      winHeat: win,
    };
    this.screenName = 'results';
    this.screenT = 0;
    this.ui.dialog = null;
    this.audio.sfx(win ? 'quest' : 'deny');
    if (win) this.camera.kick(2);
  }

  updatePaused() {
    const i = this.input;
    if (i.hit('Escape')) { this.screenName = 'play'; this.audio.sfx('ui'); return; }
    if (i.hit('ArrowUp', 'KeyW')) { this.pauseIndex = (this.pauseIndex + 2) % 3; this.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.pauseIndex = (this.pauseIndex + 1) % 3; this.audio.sfx('select'); }
    if (i.hit('Enter', 'KeyE', 'Space')) {
      this.activate(['pause:resume', 'pause:restart', 'pause:quit'][this.pauseIndex]);
      return;
    }
    if (i.mouse.clicked) {
      const id = this.ui.hit(i.mouse.x, i.mouse.y);
      if (id) this.activate(id);
    }
  }

  updateResults(dt) {
    const i = this.input;
    if (i.hit('KeyE', 'Enter', 'Space', 'Escape') || i.mouse.clicked) {
      this.continueAfterResult();
      return;
    }
    void dt;
  }

  continueAfterResult() {
    const res = this.result;
    if (!res) { this.setScreen('main'); return; }
    this.result = null;
    if (this.pendingAchievements?.length) {
      const got = this.pendingAchievements;
      this.pendingAchievements = null;
      this.ui.showBanner('CONQUISTA', got[0].title, '#8ecf63', 2.4);
      for (const a of got) this.ui.toast(`CONQUISTA: ${a.title}`, '#8ecf63', 4);
      this.audio.sfx('achievement');
    }
    if (res.flow === 'daily') {
      this.run = null;
      this.setScreen('main');
      this.ui.toast('Novo desafio amanhã. A sequência tá salva.', '#8fd3e8', 4);
      return;
    }
    if (res.flow === 'holiday') {
      const h = HOLIDAYS.find((x) => x.id === res.holiday) || this.activeHoliday();
      if (!h) { this.run = null; this.setScreen('main'); return; }
      const pages = res.win ? h.outro : [
        { who: 'zel', text: 'A festa não acabou. Só deu uma pausa pra areia secar.' },
        { who: 'naldo', text: 'Bora de novo. O modem tá no clima.' },
      ];
      this.screenName = 'play';
      if (this.run) this.run.phase = 'epilogue';
      this.ui.say(pages, () => {
        this.run = null;
        this.setScreen('main');
      });
      return;
    }
    if (res.flow === 'career') {
      const c = CHAPTERS[res.chapterIndex];
      const pages = res.win ? c.outro : [
        { who: 'naldo', text: 'Relaxa, muleque. Caiu quem tentou. Bora de novo?' },
        { who: 'zel', text: 'Bora. Mas dessa vez eu não vou errar a manobra.' },
        { who: 'kaka', text: 'kkk dessa vez eu acredito.' },
      ];
      this.screenName = 'play';
      if (this.run) this.run.phase = 'epilogue';
      this.ui.say(pages, () => {
        this.run = null;
        this.screenName = 'career';
        this.careerIndex = clamp(Math.max(res.chapterIndex,
          this.save.chapters), 0, CHAPTERS.length - 1);
        if (res.win && res.reward.includes('PÓS-GAME')) {
          this.ui.toast('Pós-game liberado no menu principal!', '#b07cff', 4);
        }
      });
      return;
    }
    if (res.flow === 'heat') {
      this.run = null;
      this.screenName = 'maps';
      return;
    }
    if (res.flow === 'legend') {
      const c = LEGEND_CHAPTERS[res.legendIndex] || LEGEND_CHAPTERS[0];
      const pages = res.win ? c.outro : [
        { who: 'lenda', text: 'Ainda não. O arquipélago te conhece, mas o título ainda é meu.' },
        { who: 'zel', text: 'Então me dá mais uma chance. Eu não vim até aqui pra desistir.' },
        { who: 'naldo', text: 'Bora treinar. A lan abre em 10 minutos.' },
      ];
      this.screenName = 'play';
      if (this.run) this.run.phase = 'epilogue';
      this.ui.say(pages, () => {
        if (res.win && res.legendIndex + 1 < LEGEND_CHAPTERS.length) {
          this.ui.toast('Próxima prova da lenda liberada!', '#ffd24d', 4);
        }
        this.run = null;
        this.screenName = 'post';
      });
      return;
    }
    if (res.flow === 'hangout') {
      const h = HANGOUTS[res.hangoutIndex] || HANGOUTS[0];
      const pages = res.win ? h.outro : [
        { who: 'zel', text: 'Hoje não deu. Mas o rolê foi bom do mesmo jeito.' },
        { who: 'naldo', text: 'Sem pressa. A gente volta quando o modem colaborar.' },
      ];
      this.screenName = 'play';
      if (this.run) this.run.phase = 'epilogue';
      this.ui.say(pages, () => {
        this.run = null;
        this.screenName = 'post';
      });
      return;
    }
    if (res.flow === 'explore') {
      this.run = null;
      this.screenName = 'world';
      return;
    }
    if (res.flow === 'league') {
      this.run = null;
      if (res.winHeat && this.league) {
        this.league.heat++;
        this.startLeagueHeat(this.league.heat);
      } else {
        this.league = null;
        this.screenName = 'post';
        this.ui.toast('A liga terminou. O modem agradece a participação.', '#b07cff');
      }
    }
  }

  /* ----------------------------------------------------------------- render */
  render() {
    const wctx = this.screen.begin();
    this.ui.begin();
    const live = ['play', 'paused', 'results', 'wallpaper'].includes(this.screenName);
    if (this.screenName === 'minigames') {
      // The arcade used to draw everything on the world layer and never touch
      // the UI layer, so the previous screen's menu stayed frozen on top of it
      // and showed through every panel. Keep the backdrop and the games on the
      // chunky layer, but paint the menu chrome on the crisp layer, and always
      // clear that layer before presenting.
      const menu = this.minigames.phase === 'menu';
      if (menu) this.minigames.drawBackdrop(wctx);
      else this.minigames.draw(wctx);
      const ctx = this.screen.beginUI();
      if (menu) {
        this.uiBegin(ctx);
        this.minigames.drawMenu(ctx);
        this.minigames.drawFooter(ctx, 'SETAS escolhe · E joga · ESC volta');
        this.uiEnd(ctx);
      }
      this.ui.drawCRT(wctx, this, false);
      this.screen.present();
      return;
    }
    if (!live) {
      if (this.demoScreen()) {
        // the potato tier keeps no live island behind the menus, so the static
        // cinematic stands in — otherwise those screens would sit on black
        if (!this.renderMenuRun(wctx) && this.screenName !== 'main') {
          this.sea.drawCinematic(wctx, this.titleTheme, this.sea.t);
        }
      } else if (this.cinematicScreen()) {
        // menus that never show the race get the painted ocean instead of a
        // simulated island nobody can see through the shade
        this.sea.drawCinematic(wctx, this.titleTheme, this.sea.t);
      }
    }
    if (live) this.renderWorld(wctx, this.screenName !== 'play');

    // Everything from here on is type and panels: draw it on the sharp layer.
    const ctx = this.screen.beginUI();
    const vignette = !live && this.screenName !== 'main';
    if (vignette) this.uiBegin(ctx);
    switch (this.screenName) {
      case 'boot':
        this.ui.drawLoading(ctx, this.loadP);
        break;
      case 'title':
        this.ui.drawTitle(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'main':
        // world fills the whole stage; the menu sits in the 640x360 safe frame
        this.uiBegin(ctx);
        this.ui.drawMain(ctx, this);
        this.uiEnd(ctx);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'career':
        this.ui.drawCareer(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'maps':
        this.ui.drawMaps(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'world':
        this.ui.drawWorld(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'post':
        this.ui.drawPostgame(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'gallery':
        this.ui.drawGallery(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'tape':
        this.ui.drawTape(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'remix':
        this.ui.drawRemix(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'options':
        this.ui.drawOptions(ctx, this);
        this.ui.drawCRT(wctx, this, false);
        break;
      case 'play': this.renderWorldUI(ctx, false); break;
      case 'wallpaper': break;
      case 'paused':
        this.uiBegin(ctx); this.ui.drawPause(ctx, this); this.uiEnd(ctx);
        break;
      case 'results':
        this.uiBegin(ctx); this.ui.drawResults(ctx, this); this.uiEnd(ctx);
        break;
      default:
        this.ui.drawMain(ctx, this);
        break;
    }
    if (vignette) this.uiEnd(ctx);
    this.screen.present();
  }

  uiBegin(ctx) {
    this._viewSave = { w: VIEW.W, h: VIEW.H };
    this.ui.stageW = VIEW.W;
    this.ui.stageH = VIEW.H;
    ctx.save();
    ctx.translate(this.screen.uiX || 0, this.screen.uiY || 0);
    VIEW.W = this.screen.uiW || 640;
    VIEW.H = this.screen.uiH || 360;
  }

  uiEnd(ctx) {
    VIEW.W = this._viewSave?.w || VIEW.W;
    VIEW.H = this._viewSave?.h || VIEW.H;
    ctx.restore();
  }

  renderWorld(ctx, frozen) {
    const run = this.run;
    if (!run) { this.uiBegin(ctx); this.ui.drawMain(ctx, this); this.uiEnd(ctx); return; }
    const map = run.map;
    const theme = map.themeDef;
    const t = frozen ? this.time * 0.4 : this.time;
    this.sea.drawBackdrop(ctx, theme);
    this.drawMap(ctx, map, theme, t, run, frozen);
    this.sea.drawWeather(ctx, theme);
    this.drawAtmosphere(ctx, run);
    if (!frozen && run.phase !== 'epilogue') this.drawSpeedFX(ctx, run.player);
    if (!frozen) this.sea.drawRogue(ctx);
    this.ui.drawCRT(ctx, this, !frozen);
  }

  // HUD, countdown, banners and dialogue go on the crisp layer, after the
  // world has been flattened into the pixel buffer.
  renderWorldUI(ctx, frozen) {
    const run = this.run;
    if (!run || frozen) return;
    this.uiBegin(ctx);
    if (run.phase === 'cutscene') this.ui.drawCutscene(ctx, this);
    else if (run.phase !== 'epilogue') this.ui.drawHUD(ctx, this);
    if (run.phase === 'countdown') this.ui.drawCountdown(ctx, this);
    if ((run.phase === 'race' || run.phase === 'countdown') && run.def.flow !== 'sandbox') {
      this.drawEdgeArrows(ctx, run);
    }
    this.ui.drawBanner(ctx);
    if (this.ui.active) this.ui.drawDialog(ctx, this);
    this.uiEnd(ctx);
  }

  visibleTileRange(map, cam, padPx = 96) {
    const pts = [[-padPx, -padPx], [VIEW.W + padPx, -padPx],
      [-padPx, VIEW.H + padPx], [VIEW.W + padPx, VIEW.H + padPx]];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [sx, sy] of pts) {
      const wx = sx + cam.x - VIEW.W / 2;
      const wy = sy + cam.y - VIEW.H / 2;
      const gx = wx / 48 + wy / 24;
      const gy = wy / 24 - wx / 48;
      x0 = Math.min(x0, gx); x1 = Math.max(x1, gx);
      y0 = Math.min(y0, gy); y1 = Math.max(y1, gy);
    }
    return {
      x0: clamp(Math.floor(x0) - 2, 0, map.w),
      x1: clamp(Math.ceil(x1) + 2, 0, map.w),
      y0: clamp(Math.floor(y0) - 2, 0, map.h),
      y1: clamp(Math.ceil(y1) + 2, 0, map.h),
    };
  }

  drawMap(ctx, map, theme, t, run, frozen) {
    const cam = this.camera;
    const vis = this.visibleTileRange(map, cam, 96);
    const water = theme.water;
    const shallow = theme.shallow;
    const deck = theme.deck;

    // open sea apron: keeps the arena floating in water instead of ending in the void
    const pad = 3;
    const ay0 = Math.max(-pad, vis.y0 - 2), ay1 = Math.min(map.h + pad, vis.y1 + 2);
    const ax0 = Math.max(-pad, vis.x0 - 2), ax1 = Math.min(map.w + pad, vis.x1 + 2);
    for (let y = ay0; y < ay1; y++) {
      for (let x = ax0; x < ax1; x++) {
        if (x >= 0 && y >= 0 && x < map.w && y < map.h) continue;
        const sx = isoX(x, y) - cam.x + VIEW.W / 2 + cam.ox;
        const sy = isoY(x, y) - cam.y + VIEW.H / 2 + cam.oy;
        if (sx < -60 || sx > VIEW.W + 60 || sy < -70 || sy > VIEW.H + 70) continue;
        const name = water[Math.floor(t * 3 + (x * 2 + y * 3)) % water.length];
        this.art.drawSurf(ctx, name, sx - 24, sy - 12, { anchor: 'topleft' });
        // deeper, colder water outside the deck (no save/restore: this runs
        // for every apron tile every frame)
        ctx.fillStyle = 'rgba(5,18,42,0.30)';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 12);
        ctx.lineTo(sx + 24, sy);
        ctx.lineTo(sx, sy + 12);
        ctx.lineTo(sx - 24, sy);
        ctx.closePath();
        ctx.fill();
        const shore = x === -1 || y === -1 || x === map.w || y === map.h;
        if (shore || (x * 11 + y * 7 + Math.floor(t * 1.2)) % 17 === 0) {
          this.art.drawSurf(ctx, 'foam' + ((x + y) % 2), sx, sy + 2, {
            anchor: 'center', alpha: shore ? 0.42 : 0.28, scale: 0.85,
          });
        }
      }
    }

    // ground pass
    for (let y = vis.y0; y < vis.y1; y++) {
      const row = map.rows[y];
      for (let x = vis.x0; x < vis.x1; x++) {
        const ch = row[x];
        const wx = isoX(x, y);
        const wy = isoY(x, y);
        const sx = wx - cam.x + VIEW.W / 2 + cam.ox;
        const sy = wy - cam.y + VIEW.H / 2 + cam.oy;
        if (sx < -70 || sx > VIEW.W + 70 || sy < -90 || sy > VIEW.H + 90) continue;
        let name = null;
        if (ch === 'W') name = water[Math.floor(t * 4 + (x * 2 + y * 3)) % water.length];
        else if (ch === 'w') name = shallow[Math.floor(t * 3 + (x + y)) % shallow.length];
        else if (ch === 'D' || ch === 'd') name = deck[(x + y) % deck.length];
        else if (ch === 'P') name = 'wood';
        else if (ch === 'G') name = 'grate';
        else if (ch === 'S') name = 'sand';
        else if (ch === 'I') name = 'ice';
        else if (ch === 'g') name = 'deck0';
        else if (ch === 'r') name = 'deck1';
        else if (ch === 'p') name = 'grate';
        else if (ch === 'f') name = 'wood';
        else if (ch === 't') name = 'deck0';
        else if (ch === 'R' || ch === 'M') name = theme.deck[0];
        const habboName = (ch === 'R' || ch === 'M') ? null : (HABBO_FLOORS[map.theme] || {})[ch];
        if (name) {
          if (!(habboName && this.art.drawIsoTile(ctx, habboName, sx - 24, sy - 12))) {
            this.art.drawSurf(ctx, name, sx - 24, sy - 12, { anchor: 'topleft' });
          }
        } else if (ch === 'X') {
          this.art.drawSurf(ctx, theme.deck[0], sx - 24, sy - 12, { anchor: 'topleft' });
        }
        const tint = ch === 'g' ? 'rgba(54,112,62,0.38)' : ch === 'r' ? 'rgba(62,70,86,0.46)'
          : ch === 'p' ? 'rgba(168,150,126,0.24)' : ch === 'f' ? 'rgba(126,78,42,0.26)'
            : ch === 't' ? 'rgba(92,134,170,0.22)' : null;
        if (tint) {
          ctx.fillStyle = tint;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 12); ctx.lineTo(sx + 24, sy);
          ctx.lineTo(sx, sy + 12); ctx.lineTo(sx - 24, sy);
          ctx.closePath();
          ctx.fill();
        }
        // moving swell lines + foam sparkle on the water. Shallow tiles get
        // stronger caustics; deep tiles get a cold depth wash underneath.
        if (ch === 'W' || ch === 'w') {
          const phase = t * 1.35 + x * 0.61 + y * 0.43;
          if (ch === 'W') {
            ctx.fillStyle = 'rgba(3,18,42,0.10)';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 12); ctx.lineTo(sx + 24, sy);
            ctx.lineTo(sx, sy + 12); ctx.lineTo(sx - 24, sy);
            ctx.closePath(); ctx.fill();
          }
          // Constant fill plus an alpha change: building a fresh rgba() string
          // for every tile every frame was pure garbage-collector food.
          const glint = Math.max(0.012, (ch === 'w' ? 0.055 : 0.036)
            + Math.sin(phase * 1.8) * (ch === 'w' ? 0.022 : 0.014));
          ctx.fillStyle = '#e4faff';
          ctx.globalAlpha = glint;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 12); ctx.lineTo(sx + 24, sy);
          ctx.lineTo(sx, sy + 12); ctx.lineTo(sx - 24, sy);
          ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
          // thin caustic arcs drift across the tile (skipped on the potato tier)
          const caustic = Math.sin(phase * 2.1);
          if (caustic > 0.25 && this.perfLevel > 0) {
            ctx.globalAlpha = 0.08 + caustic * 0.10;
            ctx.strokeStyle = '#e9fbff';
            ctx.beginPath();
            ctx.ellipse(sx - 4, sy + 1, 9, 3, -0.12, 0.1, Math.PI * 0.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(sx + 5, sy - 2, 6, 2, 0.18, Math.PI * 0.15, Math.PI * 0.85);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          const swell = Math.sin(x * 0.62 + y * 0.31 - t * 1.7)
            + Math.sin(y * 0.5 - t * 0.9 + x * 0.1) * 0.6;
          if (swell > 1.18) {
            this.art.drawSurf(ctx, 'foam' + ((x + y) % 2), sx, sy + 2, {
              anchor: 'center', alpha: 0.5, scale: 0.9,
            });
          } else if ((x * 7 + y * 13 + Math.floor(t * 1.4)) % 29 === 0) {
            this.art.drawSurf(ctx, 'foam' + ((x + y) % 2), sx, sy + 3, {
              anchor: 'center', alpha: 0.28, scale: 0.7,
            });
          }
        }
      }
    }

    // depth-sorted props, walls and riders. Reuse the sort buffer so a busy
    // frame does not allocate a fresh array every tick.
    const items = run._items || (run._items = []);
    items.length = 0;
    for (let y = vis.y0; y < vis.y1; y++) {
      for (let x = vis.x0; x < vis.x1; x++) {
        if (map.rows[y][x] !== 'X') continue;
        const wx = isoX(x, y);
        const wy = isoY(x, y);
        const sx = wx - cam.x + VIEW.W / 2 + cam.ox;
        const sy = wy - cam.y + VIEW.H / 2 + cam.oy;
        if (sx < -80 || sx > VIEW.W + 80 || sy < -100 || sy > VIEW.H + 100) continue;
        items.push({
          d: x + y,
          draw: () => this.art.drawSurf(ctx, theme.wall[(x + y) % theme.wall.length],
            sx - 24, sy - 12, { anchor: 'topleft' }),
        });
      }
    }
    for (const p of map.props) {
      const wx = isoX(p.gx, p.gy);
      const wy = isoY(p.gx, p.gy);
      const sx = wx - cam.x + VIEW.W / 2 + cam.ox;
      const sy = wy - cam.y + VIEW.H / 2 + cam.oy;
      if (sx < -120 || sx > VIEW.W + 120 || sy < -160 || sy > VIEW.H + 120) continue;
      items.push({
        d: p.gx + p.gy + 0.25,
        draw: () => {
          if (p.solid) this.drawShadow(ctx, sx, sy + 2, 11, 4);
          const bob = (p.kind === 'swan' || p.kind.startsWith('buoy'))
            ? Math.sin(t * 2 + p.gx * 1.3) * 2 : 0;
          if (p.kind === 'ramp' || p.kind === 'ramp_wood') this.art.drawSurf(ctx, theme.ramp,
            sx, sy + 7, { anchor: 'bottom', flip: !!p.flip });
          else if (this.drawTownProp(ctx, p, sx, sy, t, map.theme)) { /* painted here */ }
          else this.art.drawAny(ctx, p.kind, sx, sy + 7 + bob, {
            anchor: 'bottom', flip: !!p.flip, scale: p.scale || 1,
          });
        },
      });
    }
    // ramps are tiles, add them as props in depth order
    for (let y = vis.y0; y < vis.y1; y++) {
      for (let x = vis.x0; x < vis.x1; x++) {
        const ch = map.rows[y][x];
        if (ch !== 'R' && ch !== 'M') continue;
        const wx = isoX(x, y);
        const wy = isoY(x, y);
        const sx = wx - cam.x + VIEW.W / 2 + cam.ox;
        const sy = wy - cam.y + VIEW.H / 2 + cam.oy;
        items.push({
          d: x + y + 0.3,
          draw: () => this.art.drawSurf(ctx, ch === 'M' ? 'ramp_metal' : theme.ramp,
            sx, sy + 8, { anchor: 'bottom', scale: 0.92 }),
        });
      }
    }

    // active gate
    if (run.gatePos) {
      const g = run.gatePos;
      const sx = isoX(g.x, g.y) - cam.x + VIEW.W / 2 + cam.ox;
      const sy = isoY(g.x, g.y) - cam.y + VIEW.H / 2 + cam.oy;
      items.push({
        d: g.x + g.y + 0.2,
        draw: () => {
          const pulse = 0.5 + Math.sin(t * 4) * 0.2;
          ctx.strokeStyle = `rgba(255,224,102,${pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(Math.round(sx), Math.round(sy), 24, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(143,211,232,0.6)';
          ctx.beginPath();
          ctx.ellipse(Math.round(sx), Math.round(sy), 16, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          this.art.drawSurf(ctx, 'gate', sx, sy + 4, { anchor: 'bottom', alpha: 0.98 });
        },
      });
    }

    // relics
    if (!frozen) {
      for (const r of run.relics) {
        if (r.taken) continue;
        const sx = isoX(r.x, r.y) - cam.x + VIEW.W / 2 + cam.ox;
        const sy = isoY(r.x, r.y) - cam.y + VIEW.H / 2 + cam.oy + Math.sin(t * 2.4 + r.x) * 3;
        items.push({
          d: r.x + r.y + 0.35,
          draw: () => {
            ctx.globalAlpha = 0.5 + Math.sin(t * 3 + r.y) * 0.2;
            ctx.fillStyle = '#b07cff';
            ctx.beginPath();
            ctx.ellipse(Math.round(isoX(r.x, r.y) - cam.x + VIEW.W / 2 + cam.ox),
              Math.round(isoY(r.x, r.y) - cam.y + VIEW.H / 2 + cam.oy), 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            this.art.drawSurf(ctx, 'rel_' + r.id, sx, sy - 6, { anchor: 'center', scale: 1.35 });
          },
        });
      }
    }

    // golden modem: a tiny gold tower with an antenna, hidden on the island
    if (run.modem) {
      const m = run.modem;
      const sx = isoX(m.x, m.y) - cam.x + VIEW.W / 2 + cam.ox;
      const sy = isoY(m.x, m.y) - cam.y + VIEW.H / 2 + cam.oy;
      items.push({
        d: m.x + m.y + 0.36,
        draw: () => {
          const bob = Math.sin(t * 2.4 + m.ph) * 2;
          ctx.globalAlpha = 0.3 + Math.sin(t * 3 + m.ph) * 0.12;
          ctx.fillStyle = '#ffe066';
          ctx.beginPath();
          ctx.ellipse(sx, sy + 3, 13, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#c9a03c';
          ctx.fillRect(sx - 5, sy - 14 + bob, 10, 14);
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(sx - 3, sy - 12 + bob, 6, 8);
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 14 + bob);
          ctx.lineTo(sx, sy - 24 + bob);
          ctx.stroke();
          ctx.fillStyle = '#ff8f6b';
          ctx.fillRect(sx - 1, sy - 25 + bob, 2, 2);
          ctx.fillStyle = '#e7f0f8';
          ctx.fillRect(sx - 4, sy - 16 + bob, 8, 1);
        },
      });
    }

    // festival kites ride the wind above the water
    if (run.kites) {
      for (const k of run.kites) {
        if (k.taken) continue;
        const sx = isoX(k.x, k.y) - cam.x + VIEW.W / 2 + cam.ox;
        const sy = isoY(k.x, k.y) - cam.y + VIEW.H / 2 + cam.oy;
        const kx = sx + Math.sin(t + k.ph) * 10;
        const ky = sy - 30 + Math.sin(t * 2 + k.ph) * 4;
        items.push({
          d: k.x + k.y + 0.32,
          draw: () => {
            ctx.strokeStyle = 'rgba(251,238,200,0.32)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, sy + 3);
            ctx.lineTo(kx, ky);
            ctx.stroke();
            this.minigames.drawKite(ctx, kx, ky, 8, k.color, { t: t + k.ph });
          },
        });
      }
    }

    // classic surf crests
    if (run.waves) {
      for (const w of run.waves) {
        if (w.cool > 0.35) continue;
        const sx = isoX(w.x, w.y) - cam.x + VIEW.W / 2 + cam.ox;
        const sy = isoY(w.x, w.y) - cam.y + VIEW.H / 2 + cam.oy;
        items.push({
          d: w.x + w.y + 0.28,
          draw: () => {
            const pulse = 0.5 + Math.sin(t * 3 + w.ph) * 0.22;
            ctx.strokeStyle = `rgba(223,246,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 25, 11, 0, Math.PI * 0.05, Math.PI * 0.95);
            ctx.stroke();
            this.art.drawSurf(ctx, 'foam0', sx, sy + 4, { anchor: 'center', alpha: 0.55, scale: 1.1 });
            this.art.drawSurf(ctx, 'foam1', sx + 8, sy - 4, { anchor: 'center', alpha: 0.42, scale: 0.85 });
          },
        });
      }
    }

    // team flags (ctf): bases, or the rider carrying them
    if (run.flags) {
      for (const side of [
        { f: run.flags.player, color: '#8ee58e' },
        { f: run.flags.rival, color: '#ff8f6b' },
      ]) {
        const f = side.f;
        const sx = isoX(f.x, f.y) - cam.x + VIEW.W / 2 + cam.ox;
        const sy = isoY(f.x, f.y) - cam.y + VIEW.H / 2 + cam.oy;
        items.push({
          d: f.x + f.y + 0.34,
          draw: () => {
            ctx.fillStyle = 'rgba(9,14,24,0.3)';
            ctx.beginPath();
            ctx.ellipse(sx, sy + 2, 9, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e7f0f8';
            ctx.fillRect(sx - 1, sy - 26, 2, 27);
            ctx.fillStyle = side.color;
            const wave = Math.sin(t * 4 + (f.carried ? 2 : 0)) * 2;
            ctx.beginPath();
            ctx.moveTo(sx + 1, sy - 25);
            ctx.lineTo(sx + 16 + wave, sy - 21);
            ctx.lineTo(sx + 1, sy - 15);
            ctx.closePath();
            ctx.fill();
          },
        });
      }
    }

    // sharks
    for (const fin of run.fins) {
      const sx = isoX(fin.x, fin.y) - cam.x + VIEW.W / 2 + cam.ox;
      const sy = isoY(fin.x, fin.y) - cam.y + VIEW.H / 2 + cam.oy;
      items.push({
        d: fin.x + fin.y + 0.4,
        draw: () => {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = '#c9eef7';
          ctx.beginPath();
          ctx.ellipse(sx, sy + 2, 12, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          this.art.drawSurf(ctx, 'fin', sx, sy + 4, { anchor: 'bottom', scale: 1.2 });
        },
      });
    }

    // riders (rivals + player)
    for (const r of run.rivals) {
      if (r.hidden) continue;
      items.push({ d: r.x + r.y + 0.1, draw: () => r.draw(ctx, this.art, t, cam) });
    }
    items.push({ d: run.player.x + run.player.y + 0.15, draw: () => run.player.draw(ctx, this.art, t, cam) });

    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.draw();

    // painted names over the town so the 210x210 streets read as places
    for (const label of map.labels || []) {
      const lx = isoX(label.x, label.y) - cam.x + VIEW.W / 2 + cam.ox;
      const ly = isoY(label.x, label.y) - cam.y + VIEW.H / 2 + cam.oy;
      if (lx < -90 || lx > VIEW.W + 90 || ly < 40 || ly > VIEW.H + 20) continue;
      drawText(ctx, label.text, lx, ly - 14, {
        size: 6, color: label.color || '#ffe066', align: 'center',
        shadow: '#1b1728', weight: 'bold',
      });
    }

    // particles live in iso/world space, so shift them with the camera
    ctx.save();
    ctx.translate(Math.round(VIEW.W / 2 - cam.x + cam.ox), Math.round(VIEW.H / 2 - cam.y + cam.oy));
    this.particles.draw(ctx);
    this.particles.drawTexts(ctx);
    ctx.restore();
    void frozen;
    // drifting cloud shadows pass over the whole arena
    if (!frozen) {
      const drift = (t * 7 + 200) % (VIEW.W + 460) - 230;
      this.art.drawAtlas(ctx, 'cloud_big0', drift, 62, { anchor: 'center', alpha: 0.07, scale: 1.8 });
      this.art.drawAtlas(ctx, 'cloud_big1', VIEW.W - drift * 0.75, 148, { anchor: 'center', alpha: 0.05, scale: 1.4 });
    }
    // sparkles on water around the camera, cheap ambient
    if (!frozen) drawSparkles(ctx, t, theme);
  }

  /* Procedural town props: no extra atlas frames, but real depth cues.
     Returns true when the prop was painted here. */
  drawTownProp(ctx, p, sx, sy, t, themeId = 'town') {
    const kind = p.kind;
    const y = sy + 7 + (p.kind === 'swan' ? Math.sin(t * 2) * 2 : 0);
    ctx.save();
    let habbo = HABBO_PROPS[kind];
    if (kind === 'chair' && (themeId === 'pool' || themeId === 'sun' || themeId === 'ice')) habbo = 'pool-chair';
    if (kind === 'barrel' && (themeId === 'storm' || themeId === 'dust')) habbo = 'grunge-barrel';
    if (habbo && !p.solid) this.drawShadow(ctx, sx, y, 9, 3);
    if (habbo && this.art.drawHabboProp(ctx, habbo, sx, y, {
      scale: p.scale || HABBO_PROP_SCALE[habbo] || 0.4, flip: !!p.flip,
    })) {
      ctx.restore();
      return true;
    }
    if (kind === 'awning') {
      const w = (p.w || 3) * 15;
      ctx.fillStyle = 'rgba(9,14,24,0.22)';
      ctx.fillRect(sx - w / 2 + 3, y - 2, w, 4);
      ctx.fillStyle = p.color || '#ff9f6b';
      ctx.fillRect(sx - w / 2, y - 17, w, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      for (let i = 0; i < (p.w || 3) * 2; i += 2) ctx.fillRect(sx - w / 2 + i * 8, y - 17, 8, 3);
      ctx.fillStyle = 'rgba(20,20,28,0.6)';
      ctx.fillRect(sx - w / 2, y - 9, w, 2);
      ctx.restore(); return true;
    }
    if (kind === 'roof') {
      const w = (p.w || 4) * 15;
      ctx.fillStyle = p.color || '#6b3f35';
      ctx.fillRect(sx - w / 2, y - 28, w, 9);
      ctx.fillStyle = 'rgba(255,224,160,0.18)';
      for (let i = 0; i < (p.w || 4) * 3; i++) ctx.fillRect(sx - w / 2 + i * 8, y - 27, 4, 1);
      ctx.fillStyle = 'rgba(8,10,18,0.35)';
      ctx.fillRect(sx - w / 2, y - 19, w, 2);
      ctx.restore(); return true;
    }
    if (kind === 'bench') {
      ctx.fillStyle = '#70452c'; ctx.fillRect(sx - 15, y - 8, 30, 4);
      ctx.fillStyle = '#9b6a42'; ctx.fillRect(sx - 14, y - 10, 28, 2);
      ctx.fillStyle = '#3b2a23'; ctx.fillRect(sx - 11, y - 4, 3, 6); ctx.fillRect(sx + 8, y - 4, 3, 6);
      ctx.restore(); return true;
    }
    if (kind === 'plant') {
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(sx - 7, y - 8, 14, 9);
      ctx.fillStyle = '#3f7d43';
      for (const [dx, dy, r] of [[-5, -14, 7], [5, -16, 6], [0, -21, 7], [-9, -19, 5], [9, -21, 5]]) {
        ctx.beginPath(); ctx.arc(sx + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(143,211,232,0.18)'; ctx.beginPath(); ctx.arc(sx - 2, y - 19, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return true;
    }
    if (kind === 'sign') {
      ctx.fillStyle = '#3d2a20'; ctx.fillRect(sx - 2, y - 22, 4, 22);
      ctx.fillStyle = '#1b2a42'; ctx.fillRect(sx - 25, y - 35, 50, 15);
      ctx.strokeStyle = '#8fd3e8'; ctx.strokeRect(sx - 24.5, y - 34.5, 49, 14);
      drawText(ctx, p.text || 'VILA', sx, y - 31, { size: 5, color: '#ffe066', align: 'center', shadow: '#101524' });
      ctx.restore(); return true;
    }
    if (kind === 'pallet') {
      ctx.fillStyle = '#80552f'; ctx.fillRect(sx - 14, y - 8, 28, 8);
      ctx.fillStyle = '#b07a45'; for (let i = 0; i < 4; i++) ctx.fillRect(sx - 13 + i * 7, y - 8, 4, 7);
      ctx.fillStyle = '#3b2a23'; ctx.fillRect(sx - 13, y - 3, 26, 2);
      ctx.restore(); return true;
    }
    if (kind === 'ac') {
      ctx.fillStyle = '#8fa4b8'; ctx.fillRect(sx - 13, y - 18, 26, 14);
      ctx.fillStyle = '#53677c'; ctx.fillRect(sx - 11, y - 17, 22, 2);
      ctx.strokeStyle = '#d6e8f2'; ctx.beginPath(); ctx.arc(sx, y - 10, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore(); return true;
    }
    if (kind === 'poster') {
      ctx.fillStyle = '#f1ddb8'; ctx.fillRect(sx - 10, y - 22, 20, 17);
      ctx.fillStyle = '#ff9f6b'; ctx.fillRect(sx - 8, y - 20, 16, 9);
      ctx.fillStyle = '#1b2a42'; ctx.fillRect(sx - 7, y - 9, 11, 1); ctx.fillRect(sx - 7, y - 7, 7, 1);
      ctx.restore(); return true;
    }
    if (kind === 'roofvent') {
      ctx.fillStyle = '#596b7d'; ctx.fillRect(sx - 7, y - 8, 14, 7);
      ctx.fillStyle = '#2b3a4c'; ctx.fillRect(sx - 5, y - 7, 10, 2);
      ctx.fillStyle = '#b8d6e4'; ctx.fillRect(sx - 4, y - 3, 8, 1);
      ctx.restore(); return true;
    }
    if (kind === 'cart') {
      ctx.fillStyle = '#6d462c'; ctx.fillRect(sx - 18, y - 15, 36, 12);
      ctx.fillStyle = '#c9a06b'; ctx.fillRect(sx - 17, y - 18, 34, 4);
      ctx.fillStyle = '#2b2a2a'; ctx.beginPath(); ctx.arc(sx - 11, y - 3, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(sx + 11, y - 3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8ee58e'; ctx.fillRect(sx - 10, y - 16, 6, 5); ctx.fillStyle = '#ffd24d'; ctx.fillRect(sx - 1, y - 16, 6, 5); ctx.fillStyle = '#ff9f6b'; ctx.fillRect(sx + 8, y - 16, 6, 5);
      ctx.restore(); return true;
    }
    if (kind === 'roofvent') { ctx.restore(); return true; }
    ctx.restore();
    return false;
  }

  drawAtmosphere(ctx, run) {
    if (!run) return;
    const sandbox = run.def.flow === 'sandbox';
    const weather = run.weather || run.map.weather;
    let hour = 12;
    if (sandbox) hour = this.hourNow();
    else if (weather === 'night' || weather === 'glitch') hour = 22;
    else if (weather === 'dusk') hour = 18.5;
    else if (weather === 'snow') hour = 15;
    else if (weather === 'storm') hour = 17;
    const night = hour >= 19.6 || hour < 5.2;
    const dusk = hour >= 17.2 && hour < 19.6;
    const dawn = hour >= 5.2 && hour < 7.2;
    const t = this.time;

    if (night) {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
      g.addColorStop(0, 'rgba(8,14,46,0.52)');
      g.addColorStop(0.6, 'rgba(12,24,64,0.34)');
      g.addColorStop(1, 'rgba(18,12,42,0.46)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
      ctx.fillStyle = 'rgba(220,232,255,0.75)';
      for (let i = 0; i < 34; i++) {
        const sx = (i * 137 + 41) % VIEW.W;
        const sy = (i * 61 + 13) % 148;
        const a = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + i));
        ctx.globalAlpha = a;
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(240,244,255,0.8)';
      ctx.beginPath(); ctx.arc(548, 54, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(220,230,255,0.14)';
      ctx.beginPath(); ctx.arc(548, 54, 25, 0, Math.PI * 2); ctx.fill();
    } else if (dusk || dawn) {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
      g.addColorStop(0, dusk ? 'rgba(255,108,64,0.20)' : 'rgba(255,170,120,0.14)');
      g.addColorStop(0.65, 'rgba(255,160,90,0.07)');
      g.addColorStop(1, 'rgba(40,40,80,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
      const sg = ctx.createRadialGradient(470, 86, 2, 470, 86, 100);
      sg.addColorStop(0, 'rgba(255,242,190,0.55)');
      sg.addColorStop(1, 'rgba(255,130,80,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }

    if (weather === 'rain' || weather === 'storm') {
      ctx.fillStyle = 'rgba(25,40,72,0.13)';
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }
    if (weather === 'snow' || this.clock.season === 2) {
      ctx.fillStyle = 'rgba(210,236,255,0.06)';
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }

    // refração: faixas de luz que deslizam sobre a água, sem pós-processador
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = 110 + i * 31 + Math.sin(t * 0.5 + i) * 8;
      ctx.strokeStyle = night ? 'rgba(120,170,255,0.07)' : 'rgba(200,250,255,0.055)';
      ctx.beginPath();
      for (let x = -20; x <= VIEW.W + 20; x += 24) {
        const yy = y + Math.sin(x * 0.02 + t * 1.4 + i * 0.8) * 4;
        if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // luzes quentes da vila ao anoitecer
    if (night || dusk) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 5; i++) {
        const lx = 70 + i * 130 + Math.sin(t * 0.4 + i) * 6;
        const ly = 210 + (i % 2) * 54;
        const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46);
        glow.addColorStop(0, 'rgba(255,204,110,0.15)');
        glow.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(lx - 48, ly - 48, 96, 96);
      }
      ctx.restore();
    }

    const beacon = run.map.beacon;
    if (beacon && (night || dusk)) {
      const bx = isoX(beacon.x, beacon.y) - this.camera.x + VIEW.W / 2 + this.camera.ox;
      const by = isoY(beacon.x, beacon.y) - this.camera.y + VIEW.H / 2 + this.camera.oy - 34;
      const a = this.time * 0.75;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(bx, by);
      ctx.rotate(a);
      const cone = ctx.createLinearGradient(0, 0, 210, 0);
      cone.addColorStop(0, 'rgba(255,238,170,0.26)');
      cone.addColorStop(1, 'rgba(255,238,170,0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(210, -36); ctx.lineTo(210, 36);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,244,190,0.8)';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawEdgeArrows(ctx, run) {
    const cam = this.camera;
    const arrow = (sx, sy, color) => {
      if (sx > 22 && sx < VIEW.W - 22 && sy > 74 && sy < VIEW.H - 48) return;
      const px = clamp(sx, 22, VIEW.W - 22);
      const py = clamp(sy, 74, VIEW.H - 48);
      const a = Math.atan2(sy - py, sx - px);
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(-4, 5); ctx.lineTo(-4, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    for (const r of run.rivals) {
      if (r.hidden) continue;
      const sx = isoX(r.x, r.y) - cam.x + VIEW.W / 2 + cam.ox;
      const sy = isoY(r.x, r.y) - cam.y + VIEW.H / 2 + cam.oy;
      arrow(sx, sy - 24, RIVAL_TINT[r.variant] || '#ffe066');
    }
    if (run.gatePos) {
      const sx = isoX(run.gatePos.x, run.gatePos.y) - cam.x + VIEW.W / 2 + cam.ox;
      const sy = isoY(run.gatePos.x, run.gatePos.y) - cam.y + VIEW.H / 2 + cam.oy;
      arrow(sx, sy, '#8fd3e8');
    }
  }

  drawSpeedFX(ctx, p) {
    if (!p) return;
    const k = clamp((p.speed - 7) / 5 + (p.boostT > 0 ? 0.55 : 0), 0, 1.35);
    if (k < 0.08) return;
    ctx.save();
    ctx.globalAlpha = 0.16 + k * 0.22;
    ctx.strokeStyle = '#e8fbff';
    ctx.lineWidth = 1;
    const cx = VIEW.W / 2, cy = VIEW.H / 2;
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.4;
      const r0 = 190 + ((this.time * 320 + i * 47) % 150);
      const r1 = r0 + 28 + k * 34;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.55);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawShadow(ctx, x, y, rx, ry) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#0b1026';
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export { THEMES, TRICKS, CAST, MAPS, MAP_META, RELIC_ORDER };
