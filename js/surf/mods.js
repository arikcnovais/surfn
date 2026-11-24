/* =========================================================================
   Local mods. A mod is plain data, never code loaded from the network:
   built-ins live here, community packs come from window.SURFN_MODS or the
   localStorage key below. This keeps sharing a mod pack as harmless as
   sharing a text file, and still lets people remix runs.
   ========================================================================= */

export const BUILTIN_MODS = [
  {
    id: 'noHud', title: 'SEM HUD', desc: 'Esconde o HUD inteiro. Só a água e você.',
    settings: { noHud: true },
  },
  {
    id: 'longHaul', title: 'MARATONA', desc: 'Runs 35% mais longas, meta 15% maior.',
    settings: { durationFactor: 1.35, goalFactor: 1.15 },
  },
  {
    id: 'ruthless', title: 'IA SEM DÓ', desc: 'Rivais mais rápidos e caçadores de gates.',
    settings: { aiBonus: 1 },
  },
  {
    id: 'nightTown', title: 'VILA NOTURNA', desc: 'A vila começa depois da meia-noite.',
    settings: { sandboxWeather: 'night', sandboxMin: 23 * 60 + 30 },
  },
  {
    id: 'scrapEconomy', title: 'ECONOMIA DE SUCATA', desc: 'Trabalhos pagam materiais em dobro.',
    settings: { materialFactor: 2 },
  },
  {
    id: 'semPressao', title: 'SEM PRESSÃO', desc: 'Mais tempo e metas mais leves. Joga pela vibe, não pelo placar.',
    settings: { durationFactor: 2.2, goalFactor: 0.7 },
  },
  {
    id: 'radical', title: 'MODO RADICAL', desc: 'Dois níveis de IA a mais, relógio curto e pontos em 1,5x.',
    settings: { aiBonus: 2, durationFactor: 0.85, scoreFactor: 1.5 },
  },
  {
    id: 'pontosLoucos', title: 'PONTOS LOUCOS', desc: 'Tudo que você faz vale 2,5x. Placar de fliperama.',
    settings: { scoreFactor: 2.5 },
  },
  // ---------------------------------------------------- temas caóticos 2000
  {
    id: 'caos2000', title: 'CAOS 2000', desc: 'Tubarões, IA nervosa e placar de fliperama. O servidor caiu.',
    settings: { sharks: true, aiBonus: 2, scoreFactor: 1.8 },
  },
  {
    id: 'inversao', title: 'INVERSÃO TOTAL', desc: 'A/D e W/S trocados. O teclado do PC 4 tá assim desde 2004.',
    settings: { invertControls: true },
  },
  {
    id: 'turboEterno', title: 'TURBO ETERNO', desc: 'O turbo nunca acaba. Só não bate na parede.',
    settings: { turboEternal: true },
  },
  {
    id: 'lanVazia', title: 'LAN VAZIA', desc: 'Sem rivais: só você, o mar e o modem discando.',
    settings: { soloRun: true },
  },
  {
    id: 'prorrogacao', title: 'PRORROGAÇÃO', desc: 'Cinco tempos em vez de três. O juiz não tem relógio.',
    settings: { periods: 5 },
  },
  {
    id: 'chuvaDePipa', title: 'CHUVA DE PIPA', desc: 'Pipas por toda a ilha, mesmo fora do festival.',
    settings: { kiteStorm: true },
  },
  {
    id: 'maratonaCaotica', title: 'MARATONA CAÓTICA', desc: 'Três vezes mais tempo, tubarões e pontos em dobro.',
    settings: { durationFactor: 3, sharks: true, scoreFactor: 2 },
  },
];

const STORAGE_KEY = 'surfn-2000-mods-v1';

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter((m) => {
    if (!m || typeof m.id !== 'string' || !m.id.trim() || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).map((m) => ({
    id: m.id.trim().slice(0, 40),
    title: String(m.title || m.id).slice(0, 40),
    desc: String(m.desc || 'mod local').slice(0, 120),
    settings: m.settings && typeof m.settings === 'object' ? {
      noHud: !!m.settings.noHud,
      durationFactor: Math.max(0.5, Math.min(3, Number(m.settings.durationFactor) || 1)),
      goalFactor: Math.max(0.5, Math.min(3, Number(m.settings.goalFactor) || 1)),
      aiBonus: Math.max(0, Math.min(4, Number(m.settings.aiBonus) || 0)),
      scoreFactor: Math.max(0.5, Math.min(4, Number(m.settings.scoreFactor) || 1)),
      sandboxWeather: typeof m.settings.sandboxWeather === 'string' ? m.settings.sandboxWeather : '',
      sandboxMin: Number(m.settings.sandboxMin) || 0,
      materialFactor: Math.max(1, Math.min(5, Number(m.settings.materialFactor) || 1)),
      invertControls: !!m.settings.invertControls,
      turboEternal: !!m.settings.turboEternal,
      soloRun: !!m.settings.soloRun,
      sharks: !!m.settings.sharks,
      kiteStorm: !!m.settings.kiteStorm,
      periods: Math.max(1, Math.min(5, Number(m.settings.periods) || 0)),
    } : {},
  }));
}

export class Mods {
  constructor(game) {
    this.game = game;
    this.external = [];
    this.enabled = new Set(game.save?.mods || []);
  }

  load() {
    let external = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) external = sanitize(JSON.parse(raw));
    } catch { /* ignore broken packs */ }
    if (Array.isArray(globalThis.SURFN_MODS)) external = sanitize([...external, ...globalThis.SURFN_MODS]);
    this.external = external;
    this.enabled = new Set((this.game.save?.mods || []).filter((id) => this.all().some((m) => m.id === id)));
    return this.external;
  }

  all() { return [...BUILTIN_MODS, ...this.external]; }
  isOn(id) { return this.enabled.has(id); }
  toggle(id) {
    if (!this.all().some((m) => m.id === id)) return;
    if (this.enabled.has(id)) this.enabled.delete(id);
    else this.enabled.add(id);
    this.game.save.mods = [...this.enabled];
    this.game.persist();
  }

  activeSettings() {
    const out = {
      noHud: false, durationFactor: 1, goalFactor: 1, aiBonus: 0, scoreFactor: 1,
      sandboxWeather: '', sandboxMin: 0, materialFactor: 1,
      invertControls: false, turboEternal: false, soloRun: false, sharks: false,
      kiteStorm: false, periods: 3,
    };
    for (const mod of this.all()) {
      if (!this.enabled.has(mod.id)) continue;
      const s = mod.settings || {};
      if (s.noHud) out.noHud = true;
      out.durationFactor *= s.durationFactor || 1;
      out.goalFactor *= s.goalFactor || 1;
      out.aiBonus += s.aiBonus || 0;
      out.scoreFactor *= s.scoreFactor || 1;
      if (s.sandboxWeather) out.sandboxWeather = s.sandboxWeather;
      if (s.sandboxMin) out.sandboxMin = s.sandboxMin;
      out.materialFactor = Math.max(out.materialFactor, s.materialFactor || 1);
      if (s.invertControls) out.invertControls = true;
      if (s.turboEternal) out.turboEternal = true;
      if (s.soloRun) out.soloRun = true;
      if (s.sharks) out.sharks = true;
      if (s.kiteStorm) out.kiteStorm = true;
      if (s.periods > 1) out.periods = s.periods;
    }
    return out;
  }
}

/* ------------------------------------------------------- community mods
   Anyone can publish a pack from the console or a userscript:
     SURFN_MODS.push({ id: 'meuMod', title: 'MEU MOD', desc: '...', settings: { scoreFactor: 2 } })
   or install it for good with SURFN_MOD.add({...}), which writes the same
   localStorage pack the Remix screen loads on boot.
   A mod is plain JSON data (no code runs from a pack), and only the fields
   sanitized above are read. */
export function addCommunityMod(mod) {
  const [clean] = sanitize([mod]);
  if (!clean) return false;
  let list = [];
  try { list = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { list = []; }
  const next = sanitize([...list.filter((m) => m.id !== clean.id), clean]);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { return false; }
  return clean;
}

if (typeof globalThis !== 'undefined') {
  globalThis.SURFN_MOD = { add: addCommunityMod, builtins: BUILTIN_MODS };
}
