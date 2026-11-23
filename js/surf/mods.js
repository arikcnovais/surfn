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
    const out = { noHud: false, durationFactor: 1, goalFactor: 1, aiBonus: 0, scoreFactor: 1, sandboxWeather: '', sandboxMin: 0, materialFactor: 1 };
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
    }
    return out;
  }
}
