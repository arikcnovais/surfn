/* =========================================================================
   UI — HUD, dialogue, title, career, map select, gallery, results, pause.
   Everything is drawn into the 640x360 internal buffer with the original
   skyblock panel art and Courier pixel-ish type.
   ========================================================================= */
import { VIEW, clamp, drawText, isoX, isoY, textSize, UI_FONT } from '../engine/core.js';
import { CAST, RELICS, RELIC_ORDER, RANKS, CHAPTERS, POSTGAME_HEATS, NEWS,
  CREDITS, TICKER_TIPS, LEGEND_CHAPTERS, HANGOUTS, ISLANDS, WORLD_QUESTS,
  HOLIDAYS, TAPES, ACHIEVEMENTS, EVENTS, BONUS_STAGES } from './story.js';
import { MAP_ORDER, MAP_META, THEMES, getMap } from './maps.js';
import { RIVAL_TINT } from './rider.js';

const C = {
  cream: '#fbeec8', gold: '#ffe066', blue: '#8fd3e8', dim: '#9aa2b3',
  green: '#8ecf63', ink: '#1b1728', rose: '#ff8f6b', violet: '#b07cff',
  white: '#fffbe8', red: '#ff5a5f', orange: '#ff9f4d',
};

const FONT = (s, w = 'normal') => `${w} ${textSize(s)}px ${UI_FONT}`;

function comboWord(n) {
  if (n >= 9) return 'INSANO 2000';
  if (n >= 7) return 'ULTRA RADICAL';
  if (n >= 5) return 'MEGA RADICAL';
  if (n >= 3) return 'RADICAL';
  return 'COMBO';
}

/* Truncate to fit a card instead of letting the text run under icons and
   across the panel border. Uses the same font drawText() will use. */
export function fit(ctx, text, maxW, size = 8) {
  const s = String(text ?? '');
  ctx.font = FONT(size);
  if (ctx.measureText(s).width <= maxW) return s;
  let cut = s;
  while (cut.length > 1 && ctx.measureText(cut + '\u2026').width > maxW) cut = cut.slice(0, -1);
  return cut.trimEnd() + '\u2026';
}

export function wrap(ctx, text, maxW, size = 8) {
  ctx.font = FONT(size);
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export class UI {
  constructor(art) {
    this.art = art;
    this.t = 0;
    this.rects = [];
    this.dialog = null;
    this.toasts = [];
    this.banner = null;
    this.popup = null;
    this.blip = 0;
    this.mapCanvas = null;
    this.mapKey = '';
    this.shakeText = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.stageW = VIEW.W;
    this.stageH = VIEW.H;
  }

  /* ------------------------------------------------------------- primitives */
  begin() { this.rects.length = 0; }
  rect(id, x, y, w, h) { this.rects.push({ id, x, y, w, h }); }
  hit(x, y) {
    x -= this.offsetX;
    y -= this.offsetY;
    for (let i = this.rects.length - 1; i >= 0; i--) {
      const r = this.rects[i];
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return r.id;
    }
    return null;
  }
  hot(game, id) {
    const r = this.rects.find((q) => q.id === id);
    if (!r) return false;
    const m = game.input.mouse;
    return m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h;
  }
  panel(ctx, x, y, w, h, alpha = 1) {
    ctx.globalAlpha = alpha;
    this.art.panel(ctx, x, y, w, h);
    ctx.globalAlpha = 1;
  }
  shade(ctx, a = 0.55) {
    ctx.fillStyle = `rgba(6,12,26,${a})`;
    // Cover the whole stage, not just the centred UI safe frame: on 4:3 and
    // ultrawide screens the letterbox/pillarbox should still feel intentional.
    ctx.fillRect(-(this.offsetX || 0), -(this.offsetY || 0),
      this.stageW || VIEW.W, this.stageH || VIEW.H);
  }

  button(ctx, game, id, x, y, w, h, label, opts = {}) {
    const hov = this.hot(game, id) || opts.selected;
    this.rect(id, x, y, w, h);
    this.panel(ctx, x, y, w, h, opts.alpha ?? 1);
    if (hov) {
      ctx.fillStyle = 'rgba(143,211,232,0.16)';
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.strokeStyle = C.gold;
      ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    }
    drawText(ctx, label, x + w / 2, y + h / 2 - 5, {
      size: opts.size ?? 9, color: opts.color || (hov ? C.gold : C.cream),
      align: 'center', shadow: C.ink,
    });
    if (opts.sub) {
      drawText(ctx, opts.sub, x + w / 2, y + h / 2 + 8, {
        size: 6, color: C.dim, align: 'center',
      });
    }
  }

  /* --------------------------------------------------------------- dialogue */
  say(pages, onDone, onChoice) {
    if (typeof pages === 'string') pages = [{ text: pages }];
    this.dialog = {
      pages: pages.map((p) => ({
        who: p.who || 'zel', text: p.text,
        choices: p.choices || null, picked: false,
      })),
      i: 0, chars: 0, onDone: onDone || null, onChoice: onChoice || null, t: 0,
    };
  }
  get active() { return !!this.dialog; }
  currentPage() { return this.dialog ? this.dialog.pages[this.dialog.i] : null; }

  advance() {
    const d = this.dialog;
    if (!d) return;
    const page = d.pages[d.i];
    if (d.chars < page.text.length) { d.chars = page.text.length; return; }
    if (page.choices && !page.picked) return;
    if (d.i + 1 < d.pages.length) { d.i++; d.chars = 0; return; }
    const cb = d.onDone;
    this.dialog = null;
    this.onChoice = null;
    cb?.();
  }

  choose(i) {
    const d = this.dialog;
    if (!d) return;
    const page = d.pages[d.i];
    const ch = page.choices?.[i];
    if (!ch || page.picked) return;
    page.picked = true;
    page.text = ch.reply || ch.label;
    page.chars = 0;
    d.onChoice?.(ch);
  }

  updateDialog(dt, input, audio, onChoice) {
    const d = this.dialog;
    if (!d) return;
    const page = d.pages[d.i];
    d.t += dt;
    if (d.chars < page.text.length) {
      const before = Math.floor(d.chars);
      d.chars = Math.min(page.text.length, d.chars + dt * 58);
      if (Math.floor(d.chars) > before && Math.floor(d.chars) % 6 === 0) {
        audio?.sfx('blip');
      }
    }
    if (onChoice) d.onChoice = onChoice;
    if (d.chars >= page.text.length && page.choices && !page.picked) {
      let pick = -1;
      if (input.hit('Digit1', 'Numpad1')) pick = 0;
      if (input.hit('Digit2', 'Numpad2')) pick = 1;
      if (input.mouse.clicked) {
        for (let k = 0; k < page.choices.length; k++) {
          if (this.hit(input.mouse.x, input.mouse.y) === 'dlg:' + k) pick = k;
        }
      }
      if (pick >= 0) {
        audio?.sfx('ui');
        this.choose(pick);
      }
      return;
    }
    if (input.hit('KeyE', 'Enter', 'Space') || input.mouse.clicked) {
      audio?.sfx('ui');
      this.advance();
    }
  }

  /* ----------------------------------------------------------------- toasts */
  toast(text, color = C.cream, life = 2.6) {
    this.toasts.push({ text, color, life, max: life });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  showBanner(text, sub = '', color = C.gold, life = 1.6) {
    this.banner = { text, sub, color, life, max: life };
  }

  showPopup(text, color = C.gold, life = 1.1) {
    this.popup = { text, color, life, max: life };
  }

  update(dt) {
    this.t += dt;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].life -= dt;
      if (this.toasts[i].life <= 0) this.toasts.splice(i, 1);
    }
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    if (this.popup) {
      this.popup.life -= dt;
      if (this.popup.life <= 0) this.popup = null;
    }
  }

  drawToasts(ctx) {
    let y = 66;
    for (const t of this.toasts) {
      const a = clamp(t.life / 0.5, 0, 1);
      ctx.globalAlpha = a;
      const lines = wrap(ctx, t.text, 300, 7);
      lines.forEach((ln, i) => {
        drawText(ctx, ln, 18, y + i * 10, { size: 7, color: t.color, shadow: C.ink });
      });
      ctx.globalAlpha = 1;
      y += lines.length * 10 + 3;
    }
  }

  drawBanner(ctx) {
    const b = this.banner;
    if (!b) return;
    const a = clamp(b.life / 0.35, 0, 1);
    ctx.globalAlpha = a;
    drawText(ctx, b.text, VIEW.W / 2, 118, {
      size: 20, color: b.color, align: 'center', shadow: C.ink, weight: 'bold',
    });
    if (b.sub) {
      drawText(ctx, b.sub, VIEW.W / 2, 144, {
        size: 8, color: C.cream, align: 'center', shadow: C.ink,
      });
    }
    ctx.globalAlpha = 1;
  }

  drawPopup(ctx) {
    const p = this.popup;
    if (!p) return;
    const k = 1 - p.life / p.max;
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    drawText(ctx, p.text, VIEW.W / 2, 172 - k * 18, {
      size: 13, color: p.color, align: 'center', shadow: C.ink, weight: 'bold',
    });
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------- HUD */
  drawHUD(ctx, game) {
    const run = game.run;
    if (!run) return;
    if (run.def.flow === 'sandbox') { this.drawSandboxHUD(ctx, game); return; }
    const p = run.player;
    if (run.holiday) {
      drawText(ctx, run.holiday.name, 320, 6, {
        size: 5, color: run.holiday.color, align: 'center', shadow: C.ink,
      });
    } else if (run.daily) {
      drawText(ctx, 'DESAFIO DO DIA', 320, 6, {
        size: 5, color: C.blue, align: 'center', shadow: C.ink,
      });
    }
    const time = Math.max(0, run.time);
    const board = run.board();
    const pos = board.findIndex((r) => r.isPlayer) + 1;
    const free = run.def.flow === 'explore';
    const mapQuests = free ? WORLD_QUESTS.filter((q) => q.map === run.map.id) : [];
    const mapQuestsDone = mapQuests.filter((q) => (game.save.quests[q.id] || 0) >= q.target).length;

    // score panel — tall enough for the bigger type, with every row on its own
    // baseline so nothing collides with the timer any more
    this.panel(ctx, 8, 8, 208, 58);
    this.art.icon(ctx, 'trophy', 22, 20, 0.9);
    drawText(ctx, `${Math.round(p.score)}`, 34, 9, { size: 15, color: C.gold, shadow: C.ink });
    drawText(ctx, 'PONTOS', 35, 28, { size: 5, color: C.blue });
    const nextMile = (Math.floor(p.score / 1000) + 1) * 1000;
    drawText(ctx, `MILESTONE ${nextMile}`, 35, 37, {
      size: 4, color: p.score >= 1000 ? C.violet : C.dim,
    });
    const goal = run.def.goal;
    const isPlace = goal.type === 'place';
    const goalNow = this.goalValue(game, run);
    const goalMet = isPlace ? pos <= goal.value : goalNow >= goal.value;
    drawText(ctx, free ? 'MISSÕES' : isPlace ? 'POSIÇÃO' : `${run.goalLabel}`, 196, 14, {
      size: 5, color: free ? C.violet : goalMet ? C.green : C.blue, align: 'right',
    });
    drawText(ctx, fit(ctx, free ? `${mapQuestsDone}/${mapQuests.length}`
      : isPlace ? `${pos}º / ${goal.value}º`
        : `${Math.round(Math.min(goalNow, goal.value))}/${goal.value}`, 100, 7),
      196, 23, {
        size: 7, color: free ? C.violet : goalMet ? C.green : C.cream, align: 'right',
      });
    // timer
    const mm = Math.floor(time / 60);
    const ss = Math.floor(time % 60);
    drawText(ctx, free ? 'LIVRE' : `${mm}:${String(ss).padStart(2, '0')}`, 196, 34, {
      size: free ? 9 : 11, color: free ? C.green : time < 15 ? C.red : C.cream,
      align: 'right', shadow: C.ink,
    });
    if (run.flags) {
      drawText(ctx, `BANDEIRA ${run.flags.score.player} × ${run.flags.score.rival}`, 196, 48, {
        size: 4, color: C.cream, align: 'right',
      });
    } else if (run.team) {
      drawText(ctx, `TIME ${Math.round(run.teamScore || p.score)}`, 196, 48, {
        size: 4, color: C.green, align: 'right',
      });
    }

    // position / rivals
    this.panel(ctx, VIEW.W - 170, 8, 162, 20 + board.length * 10);
    drawText(ctx, `${pos}º LUGAR`, VIEW.W - 158, 11, { size: 8, color: pos === 1 ? C.gold : C.cream });
    drawText(ctx, `${run.modeLabel}`, VIEW.W - 18, 12, { size: 5, color: C.blue, align: 'right' });
    board.forEach((r, i) => {
      const y = 24 + i * 10;
      if (r.isPlayer) {
        ctx.fillStyle = 'rgba(143,211,232,0.15)';
        ctx.fillRect(VIEW.W - 164, y - 2, 150, 10);
      }
      drawText(ctx, `${i + 1}.`, VIEW.W - 160, y, { size: 6, color: C.dim });
      if (!r.isPlayer) {
        ctx.fillStyle = RIVAL_TINT[r.variant] || C.rose;
        ctx.fillRect(VIEW.W - 152, y + 1, 3, 5);
      }
      drawText(ctx, r.name.length > 15 ? r.name.slice(0, 15) + '.' : r.name,
        VIEW.W - 146, y, { size: 6, color: r.isPlayer ? C.gold : C.cream });
      drawText(ctx, `${Math.round(r.score)}`, VIEW.W - 20, y, {
        size: 6, color: r.isPlayer ? C.gold : C.dim, align: 'right',
      });
    });

    // turbo + speed
    this.panel(ctx, 8, VIEW.H - 46, 196, 38);
    drawText(ctx, 'TURBO', 18, VIEW.H - 40, { size: 5, color: C.blue });

    ctx.fillStyle = '#11203c';
    ctx.fillRect(52, VIEW.H - 39, 140, 8);
    const tg = p.turbo / 100;
    const grad = ctx.createLinearGradient(52, 0, 192, 0);
    grad.addColorStop(0, '#5aa6cd');
    grad.addColorStop(0.6, C.gold);
    grad.addColorStop(1, C.rose);
    ctx.fillStyle = grad;
    ctx.fillRect(52, VIEW.H - 39, 140 * tg, 8);
    if (p.boostT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(52, VIEW.H - 39, 140 * tg, 2);
    }
    drawText(ctx, `${Math.round(p.turbo)}%`, 192, VIEW.H - 41, { size: 6, color: C.cream, align: 'right' });
    drawText(ctx, `SHIFT`, 18, VIEW.H - 28, { size: 5, color: C.dim });
    drawText(ctx, `${Math.round(p.speed * 8)} km/h`, 88, VIEW.H - 30, {
      size: 8, color: p.speed > 9 ? C.gold : C.cream,
    });
    drawText(ctx, `COMBO x${Math.max(1, p.combo)}`, 192, VIEW.H - 30, {
      size: 7, color: p.combo > 1 ? C.gold : C.dim, align: 'right',
    });

    // weather / map tag (the icon follows the measured label width instead of
    // sitting on top of the first letter)
    const mapLabel = fit(ctx, run.map.name.toUpperCase(), 240, 6);
    drawText(ctx, mapLabel, VIEW.W / 2, 8, {
      size: 6, color: 'rgba(251,238,200,0.62)', align: 'center', shadow: C.ink,
    });
    ctx.font = FONT(6);
    const labelW = ctx.measureText(mapLabel).width;
    this.art.icon(ctx, run.map.weather === 'storm' ? 'storm'
      : run.map.weather === 'night' ? 'water' : 'sun',
    Math.round(VIEW.W / 2 - labelW / 2 - 10), 10, 0.7);
    drawText(ctx, run.objective, VIEW.W / 2, 20, {
      size: 7, color: C.cream, align: 'center', shadow: C.ink,
    });

    // combo meter
    if (p.combo > 1) {
      const pulse = 1 + Math.sin(this.t * 8) * 0.06;
      ctx.save();
      ctx.translate(VIEW.W / 2, 52);
      ctx.scale(pulse, pulse);
      drawText(ctx, `x${p.combo}`, 0, -10, {
        size: 18, color: C.gold, align: 'center', shadow: C.ink, weight: 'bold',
      });
      drawText(ctx, comboWord(p.combo), 0, 8, {
        size: p.combo >= 9 ? 4 : 5,
        color: p.combo >= 7 ? C.rose : p.combo >= 5 ? C.gold : C.cream,
        align: 'center',
      });
      ctx.restore();
      ctx.fillStyle = '#11203c';
      ctx.fillRect(VIEW.W / 2 - 26, 64, 52, 3);
      ctx.fillStyle = C.gold;
      ctx.fillRect(VIEW.W / 2 - 26, 64, 52 * clamp(p.comboT / 5.5, 0, 1), 3);
    }

    this.drawMinimap(ctx, game);
    this.drawToasts(ctx);
    this.drawPopup(ctx);

    // bottom hint strip — centred in the gap between the turbo panel and the
    // minimap so it does not run underneath either of them
    const hint = fit(ctx, free
      ? 'F no cais volta pro arquipélago · ESC pausar · SHIFT turbo · J/K/L manobra'
      : 'E interagir · ESC pausar · SHIFT turbo · ESPAÇO ollie · J/K/L manobra', 312, 4);
    ctx.fillStyle = 'rgba(6,12,26,0.58)';
    ctx.fillRect(212, VIEW.H - 20, 332, 14);
    drawText(ctx, hint, VIEW.W / 2 + 58, VIEW.H - 17, {
      size: 4, color: free ? 'rgba(143,211,232,0.95)' : 'rgba(231,240,248,0.82)',
      align: 'center',
    });
  }

  drawSandboxHUD(ctx, game) {
    const run = game.run;
    const n = run.needs || { energy: 0, food: 0, water: 0 };
    const season = game.seasonDef();
    const weather = (run.weather || 'dusk').toUpperCase();
    const w = game.save.world;

    this.panel(ctx, 8, 8, 198, 66);
    drawText(ctx, 'VILA 2000', 20, 15, { size: 10, color: C.gold, shadow: C.ink });
    drawText(ctx, `DIA ${game.clock.day} · ${season.name}`, 20, 29, { size: 6, color: season.color });
    drawText(ctx, game.clockLabel(), 192, 14, { size: 14, color: C.cream, align: 'right', shadow: C.ink });
    drawText(ctx, `${weather} · R$${w.money || 0}`, 192, 31, { size: 5, color: C.blue, align: 'right' });
    drawText(ctx, 'E interage · ESC pausa · SHIFT turbo', 20, 64, { size: 4, color: C.dim });

    this.panel(ctx, VIEW.W - 166, 8, 158, 66);
    const bars = [
      ['ENERGIA', n.energy, C.gold], ['FOME', n.food, C.green], ['SEDE', n.water, C.blue],
    ];
    bars.forEach(([label, v, color], i) => {
      const y = 18 + i * 15;
      drawText(ctx, label, VIEW.W - 156, y, { size: 5, color: C.dim });
      ctx.fillStyle = '#11203c';
      ctx.fillRect(VIEW.W - 104, y - 1, 88, 6);
      ctx.fillStyle = v < 20 ? C.red : color;
      ctx.fillRect(VIEW.W - 104, y - 1, 88 * clamp(v / 100, 0, 1), 6);
      drawText(ctx, `${Math.round(v)}`, VIEW.W - 18, y, { size: 5, color: C.cream, align: 'right' });
    });

    const rels = run.npcs || [];
    this.panel(ctx, 8, 80, 198, 16 + rels.length * 10);
    drawText(ctx, 'RELAÇÕES', 18, 86, { size: 5, color: C.violet });
    rels.forEach((npc, i) => {
      const y = 98 + i * 10;
      const rel = clamp(game.save.relationships[npc.key] || 0, -5, 10);
      drawText(ctx, npc.name.length > 20 ? npc.name.slice(0, 19) + '.' : npc.name, 18, y, {
        size: 5, color: npc.rider.hidden ? '#5a6273' : C.cream,
      });
      drawText(ctx, `${npc.rider.hidden ? 'OFF' : 'ON'}  ${'\u2665'.repeat(Math.max(0, rel))}`, 198, y, {
        size: 5, color: npc.rider.hidden ? C.dim : C.rose, align: 'right',
      });
    });

    const prompt = game.sandboxPrompt();
    if (prompt) {
      this.panel(ctx, VIEW.W / 2 - 158, VIEW.H - 54, 316, 24);
      drawText(ctx, prompt, VIEW.W / 2, VIEW.H - 46, {
        size: 7, color: C.gold, align: 'center', shadow: C.ink,
      });
    } else {
      this.panel(ctx, VIEW.W / 2 - 150, VIEW.H - 50, 300, 18);
      drawText(ctx, 'Aproxime-se de NPCs, da van, do bar ou da lan house.', VIEW.W / 2, VIEW.H - 44, {
        size: 5, color: C.cream, align: 'center',
      });
    }

    this.drawMinimap(ctx, game);
    this.drawToasts(ctx);
    this.drawPopup(ctx);
    drawText(ctx, 'VIDA 2000 · O servidor tem horário, a galera também.',
      VIEW.W / 2, VIEW.H - 9, { size: 4, color: 'rgba(200,214,230,0.45)', align: 'center' });
  }

  drawCutscene(ctx, game) {
    const run = game.run;
    const cs = run?.cutscene;
    if (!cs) return;
    const shot = cs.shots[cs.i];
    if (!shot) return;
    ctx.fillStyle = 'rgba(4,8,18,0.88)';
    ctx.fillRect(0, 0, VIEW.W, 38);
    ctx.fillRect(0, VIEW.H - 78, VIEW.W, 78);
    ctx.fillStyle = 'rgba(255,224,102,0.35)';
    ctx.fillRect(0, 38, VIEW.W, 1);
    ctx.fillRect(0, VIEW.H - 79, VIEW.W, 1);

    const who = CAST[shot.who] || CAST.zel;
    ctx.strokeStyle = who.color;
    ctx.strokeRect(18.5, VIEW.H - 67.5, 43, 43);
    this.art.face(ctx, shot.who, 40, VIEW.H - 46, 40, who.rider);
    drawText(ctx, who.name.toUpperCase(), 72, VIEW.H - 68, {
      size: 6, color: who.color, shadow: C.ink,
    });
    const lines = wrap(ctx, shot.text, 500, 8);
    lines.slice(0, 3).forEach((ln, i) => drawText(ctx, ln, 72, VIEW.H - 55 + i * 11, {
      size: 8, color: C.cream,
    }));
    drawText(ctx, 'E / ESPAÇO · pular cutscene', VIEW.W - 18, 18, {
      size: 5, color: 'rgba(200,214,230,0.55)', align: 'right',
    });
    for (let i = 0; i < cs.shots.length; i++) {
      ctx.fillStyle = i === cs.i ? C.gold : 'rgba(154,162,179,0.35)';
      ctx.fillRect(18 + i * 9, 24, 5, 3);
    }
  }

  goalValue(game, run) {
    if (run.def.goal.type === 'score') return run.player.score;
    if (run.def.goal.type === 'gates') return run.player.gates;
    if (run.def.goal.type === 'relics') return run.player.relics;
    if (run.def.goal.type === 'pipa') return run.player.pipas || 0;
    if (run.def.goal.type === 'surf') return run.player.waves || 0;
    if (run.def.goal.type === 'flags') return run.flags?.score.player || 0;
    if (run.def.goal.type === 'team') return Math.round(run.teamScore || 0);
    return run.player.score;
  }

  /* --------------------------------------------------------------- minimap */
  bakeMap(map, theme) {
    const s = 2;
    const W = map.w * s, H = map.h * s;
    const cv = this.mapCanvas || document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const colors = {
      D: '#748aa6', d: '#6c829e', P: '#9a6840', G: '#5a6273', S: '#dcb282',
      I: '#c9eef7', W: '#2f7fa8', w: '#59a9c9', R: '#ffe066', M: '#ffe066',
      X: '#1b2236', deck0: '#8fd3e8', g: '#3f6b46', r: '#48546a',
      p: '#a8987e', f: '#8a5a34', t: '#6f8aa6',
    };
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        let ch = map.rows[y][x];
        if (ch === 'X') ch = 'X';
        g.fillStyle = colors[ch] || '#748aa6';
        g.fillRect(x * s, y * s, s, s);
        if (ch === 'W' && (x + y) % 5 === 0) {
          g.fillStyle = 'rgba(201,238,247,0.35)';
          g.fillRect(x * s, y * s, s, 1);
        }
      }
    }
    this.mapCanvas = cv;
    this.mapKey = `${map.id}:${map.w}:${map.h}`;
    void theme;
  }

  drawMinimap(ctx, game) {
    const run = game.run;
    if (!run) return;
    const map = run.map;
    if (this.mapKey !== `${map.id}:${map.w}:${map.h}`) this.bakeMap(map, map.themeDef);
    const W = 84, H = 66;
    const x = VIEW.W - W - 16, y = VIEW.H - H - 26;
    this.panel(ctx, x - 6, y - 16, W + 12, H + 22);
    drawText(ctx, fit(ctx, map.name, W * 0.56, 4), x, y - 12, { size: 4, color: C.dim });
    drawText(ctx, fit(ctx, map.themeDef.name, W * 0.4, 4), x + W, y - 12, {
      size: 4, color: map.themeDef.ui, align: 'right',
    });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.mapCanvas, x, y, W, H);
    const px = x + (run.player.x / map.w) * W;
    const py = y + (run.player.y / map.h) * H;
    // gates + relics
    if (run.gatePos) {
      ctx.fillStyle = C.gold;
      ctx.fillRect(x + (run.gatePos.x / map.w) * W - 1, y + (run.gatePos.y / map.h) * H - 1, 3, 3);
    }
    for (const r of run.map.relics) {
      if (run.collected.includes(r.id)) continue;
      ctx.fillStyle = C.violet;
      ctx.fillRect(x + (r.x / map.w) * W, y + (r.y / map.h) * H, 2, 2);
    }
    for (const k of run.kites || []) {
      if (k.taken) continue;
      ctx.fillStyle = '#8ee58e';
      ctx.fillRect(x + (k.x / map.w) * W, y + (k.y / map.h) * H, 2, 2);
    }
    if (run.modem) {
      ctx.fillStyle = C.gold;
      ctx.fillRect(x + (run.modem.x / map.w) * W - 1, y + (run.modem.y / map.h) * H - 1, 3, 3);
    }
    for (const w of run.waves || []) {
      ctx.fillStyle = '#dff6ff';
      ctx.fillRect(x + (w.x / map.w) * W - 1, y + (w.y / map.h) * H - 1, 3, 3);
    }
    if (run.flags) {
      ctx.fillStyle = '#8ee58e';
      ctx.fillRect(x + (run.flags.player.x / map.w) * W - 1, y + (run.flags.player.y / map.h) * H - 1, 3, 3);
      ctx.fillStyle = '#ff8f6b';
      ctx.fillRect(x + (run.flags.rival.x / map.w) * W - 1, y + (run.flags.rival.y / map.h) * H - 1, 3, 3);
    }
    for (const o of run.rivals) {
      if (o.hidden) continue;
      ctx.fillStyle = RIVAL_TINT[o.variant] || C.rose;
      ctx.fillRect(x + (o.x / map.w) * W, y + (o.y / map.h) * H, 2, 2);
    }
    ctx.fillStyle = C.white;
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
    ctx.fillStyle = C.gold;
    ctx.fillRect(Math.round(px), Math.round(py) - 3, 1, 1);
  }

  /* ---------------------------------------------------------------- dialogue */
  drawDialog(ctx, game) {
    const d = this.dialog;
    if (!d) return;
    const page = d.pages[d.i];
    const bw = Math.min(608, VIEW.W - 32);
    const box = { x: Math.round((VIEW.W - bw) / 2), y: 236, w: bw, h: 108 };
    ctx.fillStyle = 'rgba(6,12,26,0.35)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    this.panel(ctx, box.x, box.y, box.w, box.h);

    // portrait
    const who = CAST[page.who] || CAST.zel;
    ctx.strokeStyle = who.color;
    ctx.strokeRect(box.x + 10.5, box.y + 12.5, 57, 57);
    if (page.who === 'exe') {
      ctx.globalAlpha = 0.85 + Math.sin(this.t * 18) * 0.15;
      this.art.face(ctx, 'exe', box.x + 39, box.y + 41, 54, who.rider);
      ctx.globalAlpha = 1;
      if (Math.sin(this.t * 9) > 0.7) {
        ctx.fillStyle = 'rgba(143,123,216,0.3)';
        ctx.fillRect(box.x + 12, box.y + 20 + (this.t * 60) % 40, 54, 2);
      }
    } else {
      this.art.face(ctx, page.who, box.x + 39, box.y + 41, 54, who.rider);
    }

    drawText(ctx, who.name.toUpperCase(), box.x + 78, box.y + 8, {
      size: 8, color: who.color, shadow: C.ink,
    });

    const textX = box.x + 78;
    const lines = wrap(ctx, page.text, box.w - 96, 9);
    const visible = page.text.slice(0, Math.floor(d.chars));
    let remaining = visible;
    let y = box.y + 24;
    for (const line of lines) {
      const slice = remaining.slice(0, line.length);
      drawText(ctx, slice, textX, y, { size: 9, color: C.cream });
      remaining = remaining.slice(line.length + (remaining[line.length] === ' ' ? 1 : 0));
      y += 14;
      if (!remaining) break;
    }
    const full = d.chars >= page.text.length;
    if (full && page.choices && !page.picked) {
      const bw = (box.w - 104) / 2;
      page.choices.slice(0, 2).forEach((ch, k) => {
        this.button(ctx, game, 'dlg:' + k, textX + k * (bw + 8), box.y + box.h - 34,
          bw, 24, `${k + 1}. ${ch.label}`, { size: 6, color: k === 0 ? C.gold : C.blue });
      });
    } else if (full) {
      const blink = Math.sin(this.t * 6) > -0.2;
      if (blink) drawText(ctx, '\u25BC', box.x + box.w - 22, box.y + box.h - 20, {
        size: 9, color: C.gold,
      });
    }
    for (let i = 0; i < d.pages.length; i++) {
      ctx.fillStyle = i === d.i ? C.gold : 'rgba(154,162,179,0.4)';
      ctx.fillRect(box.x + box.w - 24 - (d.pages.length - i) * 8, box.y + 10, 4, 4);
    }
    if (!(full && page.choices && !page.picked)) {
      drawText(ctx, '[E] continuar', box.x + box.w - 22, box.y + box.h - 14, {
        size: 5, color: 'rgba(231,240,248,0.5)', align: 'right',
      });
    }
  }

  /* ------------------------------------------------------------------ title */
  drawTitle(ctx, game) {
    // The attract race is already running underneath; keep a soft scrim so
    // the logo stays readable while the riders do the demo in the middle.
    this.shade(ctx, 0.34);

    const bob = Math.sin(this.t * 1.3) * 4;
    drawText(ctx, 'SURFN', VIEW.W / 2, 34 + bob, {
      size: 46, color: C.cream, align: 'center', shadow: '#5a2a1c', weight: 'bold',
    });
    drawText(ctx, '2 0 0 0', VIEW.W / 2, 82 + bob, {
      size: 17, color: C.gold, align: 'center', shadow: C.ink,
    });
    drawText(ctx, 'surfe, zoeira e internet discada', VIEW.W / 2, 105 + bob, {
      size: 8, color: C.blue, align: 'center', shadow: C.ink,
    });

    const hasSave = game.save.chapters > 0;
    const blink = Math.sin(this.t * 4) > -0.35;
    if (blink) {
      drawText(ctx, hasSave ? 'PRESSIONE  E  PARA CONTINUAR' : 'PRESSIONE  E  PARA COMEÇAR',
        VIEW.W / 2, 196, {
        size: 10, color: C.gold, align: 'center', shadow: C.ink,
      });
    }
    drawText(ctx, 'ou clique em qualquer lugar', VIEW.W / 2, 212, {
      size: 6, color: 'rgba(251,238,200,0.6)', align: 'center',
    });
    drawText(ctx, '7 mapas · 8 festas · 30 fitas · 22 conquistas · pós-game',
      VIEW.W / 2, VIEW.H - 30, { size: 6, color: 'rgba(231,240,248,0.45)', align: 'center' });
    this.drawTicker(ctx, game);
  }

  /* --------------------------------------------------------- seasonal weather */
  drawHolidayFX(ctx, game) {
    const h = game.activeHoliday();
    if (!h) return;
    const t = this.t;
    ctx.save();
    if (h.id === 'christmas') {
      for (let i = 0; i < 34; i++) {
        const x = (i * 89 + t * (8 + (i % 5) * 2)) % VIEW.W;
        const y = (i * 53 + t * (15 + (i % 7) * 3)) % VIEW.H;
        ctx.globalAlpha = 0.25 + (i % 4) * 0.12;
        ctx.fillStyle = i % 5 === 0 ? C.gold : C.white;
        ctx.fillRect(Math.round(x), Math.round(y), i % 6 === 0 ? 3 : 2, 2);
      }
    } else if (h.id === 'halloween') {
      ctx.globalAlpha = 0.10;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#7a4dbb';
        ctx.fillRect(0, 120 + i * 48 + Math.sin(t * 0.6 + i) * 9, VIEW.W, 24);
      }
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#1b1728';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x = (i * 181 + t * 24) % (VIEW.W + 60) - 30;
        const y = 60 + ((i * 71 + t * 13) % 200);
        const w = Math.sin(t * 5 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - 7, y - 7 - w, x - 13, y + 2);
        ctx.quadraticCurveTo(x - 7, y - 1, x, y + 3);
        ctx.quadraticCurveTo(x + 7, y - 1, x + 13, y + 2);
        ctx.quadraticCurveTo(x + 7, y - 7 - w, x, y);
        ctx.stroke();
      }
    } else if (h.id === 'thanksgiving') {
      for (let i = 0; i < 22; i++) {
        const x = (i * 113 + t * (12 + (i % 4) * 3)) % VIEW.W;
        const y = (i * 47 + t * (9 + (i % 5) * 2)) % VIEW.H;
        ctx.globalAlpha = 0.22 + (i % 3) * 0.1;
        ctx.fillStyle = [C.orange, C.rose, C.gold][i % 3];
        ctx.beginPath();
        ctx.ellipse(x, y, 3, 1.5, i + t * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (h.id === 'easter') {
      for (let i = 0; i < 14; i++) {
        const x = (i * 101 + Math.sin(t * 0.7 + i) * 14 + 40) % VIEW.W;
        const y = (i * 59 + t * 8) % VIEW.H;
        ctx.globalAlpha = 0.30 + (i % 3) * 0.1;
        ctx.fillStyle = [C.green, C.gold, C.rose, C.violet][i % 4];
        ctx.beginPath();
        ctx.ellipse(x, y, 2.6, 3.4, Math.sin(t + i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (h.id === 'festajunina') {
      for (let i = 0; i < 10; i++) {
        const x = 300 + i * 34;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = [C.gold, C.rose, C.green, C.violet][i % 4];
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x + 13, 2);
        ctx.lineTo(x + 6.5, 11);
        ctx.closePath();
        ctx.fill();
      }
      for (let i = 0; i < 16; i++) {
        const x = (i * 97 + t * 10) % VIEW.W;
        const y = 120 + (i * 43 + t * 7) % 200;
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = [C.orange, C.gold, C.rose][i % 3];
        ctx.fillRect(x, y, 2, 4);
      }
    } else {
      const colors = h.id === 'newyear' ? [C.gold, C.white, C.blue] : [C.rose, C.gold, C.green, C.violet];
      for (let i = 0; i < 30; i++) {
        const x = (i * 83 + t * (16 + (i % 5) * 4)) % VIEW.W;
        const y = (i * 61 + t * (20 + (i % 6) * 5)) % VIEW.H;
        ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x, y, 3, 2);
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------- main */
  drawMain(ctx, game) {
    const sea = game.sea;
    const live = game.menuRun;
    if (!live) {
      sea.drawCinematic(ctx, game.titleTheme, sea.t);
      this.shade(ctx, 0.5);
    } else {
      // The island is actually running behind the menu. A soft scrim keeps
      // the menu type readable while leaving the race in the middle visible.
      const lg = ctx.createLinearGradient(0, 0, 310, 0);
      lg.addColorStop(0, 'rgba(4,10,22,0.94)');
      lg.addColorStop(0.68, 'rgba(4,10,22,0.66)');
      lg.addColorStop(1, 'rgba(4,10,22,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, 310, VIEW.H);
      const tg = ctx.createLinearGradient(0, 0, 0, 104);
      tg.addColorStop(0, 'rgba(4,10,22,0.68)');
      tg.addColorStop(1, 'rgba(4,10,22,0)');
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, VIEW.W, 104);
    }

    this.drawHolidayFX(ctx, game);
    const fest = game.activeHoliday();
    const nextFest = game.nextHoliday();
    if (fest) {
      drawText(ctx, `FESTA: ${fest.name}`, VIEW.W - 30, 103, {
        size: 4, color: fest.color, align: 'right', shadow: C.ink,
      });
    } else if (nextFest) {
      drawText(ctx, `PRÓXIMA FESTA: ${nextFest.holiday.name} EM ${nextFest.days}D`, VIEW.W - 30, 103, {
        size: 4, color: C.dim, align: 'right', shadow: C.ink,
      });
    }

    drawText(ctx, 'SURFN 2000', 22, 12, {
      size: 22, color: C.cream, shadow: '#5a2a1c', weight: 'bold',
    });
    drawText(ctx, 'o campeonato mais 2007 da sua vida', 24, 35, {
      size: 7, color: C.blue, shadow: C.ink,
    });
    drawText(ctx, 'software livre de zoeira · remixa à vontade', 24, 46, {
      size: 5, color: 'rgba(251,238,200,0.5)',
    });

    const items = [
      { id: 'career', label: 'HISTÓRIA / CARREIRA', sub: 'a jornada do Zel', color: C.gold },
      { id: 'world', label: 'ARQUIPÉLAGO 2000', sub: game.save.chapters >= 1 || game.save.postgame ? 'modo livre entre as ilhas' : 'termine o capítulo 1', color: C.violet },
      { id: 'comp', label: 'COMPETITIVO', sub: 'bate e volta no pool day', color: C.blue },
      { id: 'minigames', label: 'MINIGAMES', sub: 'o fliperama da lan house', color: '#cfc9a8' },
      { id: 'post', label: 'PÓS-GAME: A LENDA ZEL', sub: game.save.postgame ? 'lenda + rolês + liga' : 'vença a história', color: C.violet },
      { id: 'life', label: 'VILA 2000 · MODO VIDA', sub: game.save.postgame ? 'rotina, NPCs, comida e sono' : 'termine o capítulo 10', color: C.orange },
      { id: 'bonus', label: 'BÔNUS & ARQUIVO', sub: 'fases bônus, modems e segredos', color: C.green },
      { id: 'remix', label: 'REMIX 2000', sub: 'liga, desliga e joga do seu jeito', color: C.rose },
      { id: 'options', label: 'OPÇÕES', sub: 'som, CRT, tela', color: C.dim },
    ];
    const bx = 20, by = 55, bw = 236, bh = 29, step = 30;
    items.forEach((it, i) => {
      const y = by + i * step;
      const sel = i === game.menuIndex;
      const hov = sel || this.hot(game, 'main:' + it.id);
      const locked = ['post', 'life'].includes(it.id) && !game.save.postgame;
      this.rect('main:' + it.id, bx, y, bw, bh);
      this.panel(ctx, bx, y, bw, bh, hov ? 0.98 : 0.74);
      if (hov) {
        ctx.fillStyle = 'rgba(143,211,232,0.14)';
        ctx.fillRect(bx + 4, y + 4, bw - 8, bh - 8);
      }
      ctx.fillStyle = locked ? '#5a6273' : it.color;
      ctx.fillRect(bx, y, 3, bh);
      drawText(ctx, (sel ? '\u2665 ' : '') + it.label, bx + 12, y + 3, {
        size: 8, color: locked ? '#5a6273' : sel ? C.gold : hov ? C.white : it.color, shadow: C.ink,
      });
      drawText(ctx, fit(ctx, it.sub, bw - 26, 4), bx + 12, y + 15, {
        size: 4, color: locked ? '#48506a' : C.dim,
      });
      if (sel) drawText(ctx, '\u25C0', bx + bw - 10, y + 10, {
        size: 6, color: C.gold, align: 'right',
      });
    });

    const cx = VIEW.W - 188;
    if (live) {
      // standings from the real race behind the menu
      const board = [live.player, ...live.rivals].sort((a, b) => b.score - a.score);
      const py = 116;
      this.panel(ctx, cx + 14, py, 154, 26 + board.length * 13);
      const pulse = 0.55 + Math.sin(this.t * 4) * 0.35;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(476, py + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawText(ctx, 'PLACAR DA ILHA', cx + 32, py + 5, { size: 5, color: C.cream });
      drawText(ctx, live.map.name, cx + 158, py + 5, {
        size: 4, color: C.blue, align: 'right',
      });
      board.forEach((r, i) => {
        const y = py + 18 + i * 13;
        if (r === live.player) {
          ctx.fillStyle = 'rgba(143,211,232,0.14)';
          ctx.fillRect(cx + 19, y - 2, 144, 12);
        }
        drawText(ctx, `${i + 1}.`, cx + 20, y, { size: 5, color: C.dim });
        if (r !== live.player) {
          ctx.fillStyle = RIVAL_TINT[r.variant] || C.rose;
          ctx.fillRect(cx + 34, y + 1, 3, 5);
        }
        const name = r === live.player ? 'ZEL (VOCÊ)' : r.name.toUpperCase();
        drawText(ctx, fit(ctx, name, 78, 5), cx + 41, y, {
          size: 5, color: r === live.player ? C.gold : C.cream,
        });
        drawText(ctx, `${Math.round(r.score)}`, cx + 158, y, {
          size: 5, color: r === live.player ? C.gold : C.dim, align: 'right',
        });
      });
    }

    // compact athlete card
    const cy = 200, cw = 168, ch = 118;
    this.panel(ctx, cx, cy, cw, ch);
    drawText(ctx, 'PERFIL DO ATLETA', cx + 10, cy + 7, { size: 6, color: C.gold });
    drawText(ctx, game.rankName(), cx + 10, cy + 19, { size: 8, color: C.cream });
    drawText(ctx, `XP ${game.save.xp}`, cx + cw - 10, cy + 20, {
      size: 6, color: C.blue, align: 'right',
    });
    ctx.fillStyle = '#11203c';
    ctx.fillRect(cx + 10, cy + 31, cw - 20, 5);
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx + 10, cy + 31, (cw - 20) * game.rankProgress(), 5);
    const rows = [
      ['CAPÍTULOS', `${Math.min(game.save.chapters, CHAPTERS.length)}/${CHAPTERS.length}`],
      ['MILESTONES', `${game.save.milestones || 0}`],
      ['MELHOR COMBO', `x${game.save.bestCombo || 0}`],
      ['RELÍQUIAS', `${game.save.relics.length}/${RELIC_ORDER.length}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = cy + 44 + i * 13;
      drawText(ctx, k, cx + 10, y, { size: 5, color: C.dim });
      drawText(ctx, v, cx + cw - 10, y, { size: 6, color: C.cream, align: 'right' });
    });
    const tipLines = wrap(ctx, TICKER_TIPS[Math.floor(this.t / 4) % TICKER_TIPS.length],
      cw - 34, 4).slice(0, 2);
    tipLines.forEach((ln, i) => drawText(ctx, ln, cx + cw / 2, cy + ch - 24 + i * 9, {
      size: 4, color: C.blue, align: 'center',
    }));

    const my = 322;
    this.button(ctx, game, 'main:daily', cx, my, 52, 18, 'D DIA', {
      size: 4, color: game.dailyDone() ? C.green : C.gold,
    });
    this.button(ctx, game, 'main:holiday', cx + 56, my, 52, 18, 'F FESTA', {
      size: 4, color: game.activeHoliday() ? game.activeHoliday().color : C.dim,
    });
    this.button(ctx, game, 'main:tape', cx + 112, my, 54, 18, 'C FITAS', {
      size: 4, color: C.gold,
    });

    drawText(ctx, 'W/S navega · E escolhe · M minigames · R zoeira · D dia · F festa · C fitas',
      20, VIEW.H - 20, { size: 4, color: 'rgba(231,240,248,0.6)' });
    this.drawTicker(ctx, game);
  }

  /* ----------------------------------------------------------------- career */
  drawCareer(ctx, game) {
    this.shade(ctx, 0.62);
    drawText(ctx, 'HISTÓRIA / CARREIRA', 24, 14, { size: 13, color: C.gold, shadow: C.ink });
    drawText(ctx, 'Do PC 4 da lan house até o dono do arquipélago.', 24, 31, {
      size: 6, color: C.blue,
    });
    drawText(ctx, `progresso ${Math.min(game.save.chapters, CHAPTERS.length)}/${CHAPTERS.length}`, VIEW.W - 24, 16, {
      size: 7, color: C.dim, align: 'right',
    });

    const cols = 5, cw = 118, chh = 62, gx = 6, gy = 7;
    const x0 = Math.round((VIEW.W - (cols * cw + (cols - 1) * gx)) / 2), y0 = 48;
    CHAPTERS.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = x0 + col * (cw + gx);
      const y = y0 + row * (chh + gy);
      const unlocked = game.chapterUnlocked(i);
      const sel = i === game.careerIndex;
      this.rect('career:' + i, x, y, cw, chh);
      this.panel(ctx, x, y, cw, chh, unlocked ? 1 : 0.55);
      if (sel) {
        ctx.fillStyle = 'rgba(143,211,232,0.18)';
        ctx.fillRect(x + 4, y + 4, cw - 8, chh - 8);
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x + 4.5, y + 4.5, cw - 9, chh - 9);
      }
      if (!unlocked) {
        ctx.globalAlpha = 0.4;
        this.art.drawSurf(ctx, 'ic_lock', x + cw - 12, y + 10, { anchor: 'center', scale: 0.55 });
        ctx.globalAlpha = 1;
      }
      drawText(ctx, fit(ctx, c.tag, cw - 30, 4), x + 7, y + 5, {
        size: 4, color: unlocked ? C.blue : '#5a6273',
      });
      drawText(ctx, fit(ctx, c.title, cw - 14, 6),
        x + 7, y + 14, { size: 6, color: unlocked ? C.cream : '#5a6273', shadow: C.ink });
      drawText(ctx, fit(ctx, `${MAP_META[c.map].note} · ${c.duration}s`, cw - 14, 4),
        x + 7, y + 27, {
          size: 4, color: unlocked ? C.dim : '#48506a',
        });
      drawText(ctx, fit(ctx, game.goalText(c), cw - 14, 5), x + 7, y + 36, {
        size: 5, color: unlocked ? C.gold : '#48506a',
      });
      const stars = game.starsFor(c.id);
      for (let s = 0; s < 3; s++) {
        ctx.globalAlpha = s < stars ? 1 : 0.22;
        this.art.drawSurf(ctx, 'ic_rank', x + 10 + s * 10, y + 54, { anchor: 'center', scale: 0.5 });
      }
      ctx.globalAlpha = 1;
      drawText(ctx, `${game.bestOf(c.id)}`, x + cw - 7, y + 51, {
        size: 4, color: unlocked ? C.dim : '#48506a', align: 'right',
      });
    });

    // details strip
    const sel = CHAPTERS[game.careerIndex];
    this.panel(ctx, 24, 190, 420, 86);
    drawText(ctx, sel.title, 36, 196, { size: 9, color: C.gold });
    drawText(ctx, sel.tips || 'Bora surfar.', 36, 210, { size: 5, color: C.blue });
    const intro = sel.intro?.[0]?.text || '';
    ctx.font = FONT(5);
    const lines = wrap(ctx, intro, 390, 5).slice(0, 3);
    lines.forEach((ln, i) => drawText(ctx, ln, 36, 223 + i * 8, { size: 5, color: C.cream }));
    drawText(ctx, `ESCOLHA SALVA: ${game.save.choices?.[sel.id] || 'nenhuma ainda'}`, 36, 255, {
      size: 5, color: C.violet,
    });
    if (!game.chapterUnlocked(game.careerIndex)) {
      drawText(ctx, 'BLOQUEADO', 36, 264, { size: 6, color: C.red });
    } else if (sel.minigame) {
      const cleared = game.minigameCleared(sel.id);
      drawText(ctx, `PROVA DA LAN: ${sel.minigame.name} — ${cleared ? 'VENCIDA' : 'PENDENTE'}`, 36, 264, {
        size: 5, color: cleared ? C.green : C.gold,
      });
    }

    const can = game.chapterUnlocked(game.careerIndex);
    this.button(ctx, game, 'career:start', VIEW.W - 184, 196, 160, 26, can ? 'SURFAR \u25B6' : 'BLOQUEADO', {
      color: can ? C.gold : '#5a6273', size: 8,
    });
    this.button(ctx, game, 'career:back', VIEW.W - 184, 230, 160, 22, 'VOLTAR', { size: 7 });
    this.drawTicker(ctx, game);
  }

  /* ------------------------------------------------------------------- maps */
  drawMaps(ctx, game) {
    this.shade(ctx, 0.62);
    drawText(ctx, 'COMPETITIVO', 24, 16, { size: 13, color: C.gold, shadow: C.ink });
    drawText(ctx, 'Partida rápida: 3 minutos, 3 rivais, quem fizer mais pontos leva.', 24, 33, {
      size: 6, color: C.blue,
    });

    const cols = 2, cw = 286, chh = 54, gx = 12, gy = 8;
    const x0 = Math.round((VIEW.W - (cols * cw + (cols - 1) * gx)) / 2);
    MAP_ORDER.forEach((id, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = x0 + col * (cw + gx);
      const y = 50 + row * (chh + gy);
      const m = getMap(id);
      const unlocked = game.mapUnlocked(id);
      const sel = i === game.mapIndex;
      this.rect('map:' + id, x, y, cw, chh);
      this.panel(ctx, x, y, cw, chh, unlocked ? 1 : 0.5);
      if (sel) {
        ctx.fillStyle = 'rgba(143,211,232,0.16)';
        ctx.fillRect(x + 5, y + 5, cw - 10, chh - 10);
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x + 5.5, y + 5.5, cw - 11, chh - 11);
      }
      if (!unlocked) {
        ctx.globalAlpha = 0.4;
        this.art.drawSurf(ctx, 'ic_lock', x + cw - 18, y + 16, { anchor: 'center' });
        ctx.globalAlpha = 1;
      }
      drawText(ctx, fit(ctx, m.name, cw - 130, 9), x + 12, y + 8, {
        size: 9, color: unlocked ? C.cream : '#5a6273', shadow: C.ink,
      });
      drawText(ctx, fit(ctx, m.themeDef.name, cw - 120, 6), x + 12, y + 21, {
        size: 6, color: unlocked ? m.themeDef.ui : '#48506a',
      });
      drawText(ctx, fit(ctx, m.tagline, cw - 130, 5), x + 12, y + 31, {
        size: 5, color: unlocked ? C.dim : '#48506a',
      });
      for (let s = 0; s < 5; s++) {
        ctx.globalAlpha = (unlocked && s < MAP_META[id].stars) ? 1 : 0.18;
        this.art.drawSurf(ctx, 'ic_rank', x + cw - 16 - (4 - s) * 11, y + 13,
          { anchor: 'center', scale: 0.5 });
      }
      ctx.globalAlpha = 1;
      drawText(ctx, `recorde ${game.mapBest(id)}`, x + cw - 12, y + 40, {
        size: 6, color: unlocked ? C.gold : '#48506a', align: 'right',
      });
    });

    this.button(ctx, game, 'maps:start', x0, 318, 200, 24, 'ENTRAR NA PARTIDA \u25B6', {
      color: game.mapUnlocked(getMap(MAP_ORDER[game.mapIndex]).id) ? C.gold : '#5a6273',
      size: 8,
    });
    this.button(ctx, game, 'maps:back', x0 + 212, 318, 120, 24, 'VOLTAR', { size: 7 });
    this.drawTicker(ctx, game);
  }

  /* ---------------------------------------------------------------- world */
  drawWorld(ctx, game) {
    this.shade(ctx, 0.58);
    drawText(ctx, 'ARQUIPÉLAGO 2000', 24, 14, { size: 15, color: C.gold, shadow: C.ink });
    drawText(ctx, 'Sete ilhas, um servidor. F no cais de qualquer mapa volta pra cá.', 24, 32, {
      size: 5, color: C.blue,
    });
    const done = WORLD_QUESTS.filter((q) => (game.save.quests[q.id] || 0) >= q.target).length;
    drawText(ctx, `MISSÕES ${done}/${WORLD_QUESTS.length}`, VIEW.W - 24, 18, {
      size: 6, color: C.green, align: 'right',
    });

    const x0 = Math.round((VIEW.W - 616) / 2);
    // route pins: a visible chain connecting every map
    ctx.strokeStyle = 'rgba(143,211,232,0.22)';
    ctx.beginPath();
    ctx.moveTo(x0 + 10, 45); ctx.lineTo(x0 + 606, 45);
    ctx.stroke();
    ISLANDS.forEach((isl, i) => {
      const x = x0 + 10 + i * 96;
      ctx.fillStyle = i === game.worldIndex ? C.gold : 'rgba(143,211,232,0.35)';
      ctx.beginPath();
      ctx.arc(x, 45, i === game.worldIndex ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const y0 = 60, cw = 272, rh = 28, gap = 3;
    ISLANDS.forEach((isl, i) => {
      const m = getMap(isl.map);
      const y = y0 + i * (rh + gap);
      const unlocked = game.mapUnlocked(isl.map);
      const sel = i === game.worldIndex;
      this.rect('world:map:' + i, x0, y, cw, rh);
      this.panel(ctx, x0, y, cw, rh, unlocked ? 1 : 0.5);
      if (sel) {
        ctx.fillStyle = 'rgba(143,211,232,0.16)';
        ctx.fillRect(x0 + 4, y + 4, cw - 8, rh - 8);
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x0 + 4.5, y + 4.5, cw - 9, rh - 9);
      }
      drawText(ctx, unlocked ? isl.name : '???', x0 + 10, y + 6, {
        size: 7, color: unlocked ? (sel ? C.gold : C.cream) : '#5a6273',
      });
      drawText(ctx, unlocked ? isl.note : 'ilha bloqueada', x0 + 10, y + 17, {
        size: 4, color: unlocked ? C.dim : '#48506a',
      });
      const total = WORLD_QUESTS.filter((q) => q.map === isl.map).length;
      const got = WORLD_QUESTS.filter((q) => q.map === isl.map && (game.save.quests[q.id] || 0) >= q.target).length;
      drawText(ctx, `${got}/${total} missões`, x0 + cw - 10, y + 10, {
        size: 4, color: got === total ? C.green : C.dim, align: 'right',
      });
      drawText(ctx, m.themeDef.name, x0 + cw - 10, y + 18, {
        size: 4, color: unlocked ? m.themeDef.ui : '#48506a', align: 'right',
      });
    });

    const isl = ISLANDS[game.worldIndex];
    const map = getMap(isl.map);
    const px = x0 + 284, py = 60, pw = 312, ph = 232;
    this.panel(ctx, px, py, pw, ph);
    drawText(ctx, map.name, px + 12, py + 9, { size: 9, color: C.gold, shadow: C.ink });
    drawText(ctx, map.tagline, px + 12, py + 23, { size: 5, color: C.blue });
    drawText(ctx, `${map.w}×${map.h} tiles · ${map.gates.length} gates · ${map.relics.length} relíquias`, px + 12, py + 34, {
      size: 4, color: C.dim,
    });
    const quests = WORLD_QUESTS.filter((q) => q.map === isl.map);
    quests.forEach((q, qi) => {
      const qy = py + 50 + qi * 60;
      const cur = Math.min(q.target, game.save.quests[q.id] || 0);
      const complete = cur >= q.target;
      this.panel(ctx, px + 10, qy, pw - 20, 52, complete ? 0.9 : 0.65);
      drawText(ctx, `${complete ? '\u2713 ' : ''}${q.title}`, px + 18, qy + 7, {
        size: 6, color: complete ? C.green : C.cream,
      });
      drawText(ctx, q.desc, px + 18, qy + 18, { size: 4, color: C.dim });
      drawText(ctx, `${cur}/${q.target}`, px + pw - 20, qy + 7, {
        size: 5, color: complete ? C.green : C.gold, align: 'right',
      });
      ctx.fillStyle = '#11203c';
      ctx.fillRect(px + 18, qy + 29, pw - 48, 5);
      ctx.fillStyle = complete ? C.green : C.blue;
      ctx.fillRect(px + 18, qy + 29, (pw - 48) * clamp(cur / q.target, 0, 1), 5);
      drawText(ctx, `+${q.reward} XP`, px + pw - 20, qy + 39, { size: 4, color: C.violet, align: 'right' });
    });
    drawText(ctx, 'DICA: os bots também procuram os gates. Corre.', px + pw / 2, py + ph - 40, {
      size: 4, color: 'rgba(251,238,200,0.5)', align: 'center',
    });

    this.button(ctx, game, 'world:start', px, 300, 190, 24,
      game.mapUnlocked(isl.map) ? 'EXPLORAR ILHA \u25B6' : 'ILHA BLOQUEADA', {
        color: game.mapUnlocked(isl.map) ? C.gold : '#5a6273', size: 7,
      });
    this.button(ctx, game, 'world:back', px + 202, 300, 110, 24, 'VOLTAR', { size: 6 });
    this.drawTicker(ctx, game);
  }

  /* --------------------------------------------------------------- postgame */
  drawPostgame(ctx, game) {
    this.shade(ctx, 0.55);
    drawText(ctx, 'PÓS-GAME: A LENDA ZEL', 24, 14, { size: 16, color: C.violet, shadow: C.ink });
    drawText(ctx, 'O primeiro Zel te desafiou. Depois do título, chama a galera pro rolê.', 24, 33, {
      size: 5, color: C.blue,
    });
    const acts = game.postActions();
    const card = (a, x, y, w, h, small = false) => {
      const selected = acts[game.postIndex]?.id === a.id;
      this.rect(a.id, x, y, w, h);
      this.panel(ctx, x, y, w, h, a.locked ? 0.45 : 1);
      if (selected) {
        ctx.fillStyle = 'rgba(176,124,255,0.16)';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
      }
      const title = fit(ctx, a.title, w - (small ? 58 : 76), small ? 5 : 6);
      drawText(ctx, title, x + 9, y + 7, {
        size: small ? 5 : 6, color: a.locked ? '#5a6273' : a.done ? C.green : C.cream,
      });
      drawText(ctx, a.sub, x + 9, y + 19, { size: 4, color: a.locked ? '#48506a' : C.dim });
      if (a.done) drawText(ctx, small ? '\u2713' : '\u2713 VENCIDO', x + w - 9, y + 8, {
        size: 4, color: C.green, align: 'right',
      });
      else if (a.locked) drawText(ctx, small ? 'X' : 'BLOQUEADO', x + w - 9, y + 8, {
        size: 4, color: C.red, align: 'right',
      });
    };

    const legends = acts.filter((a) => a.kind === 'legend');
    const hangs = acts.filter((a) => a.kind === 'hangout');
    const events = acts.filter((a) => a.kind === 'event');
    const league = acts.find((a) => a.kind === 'league');
    const back = acts.find((a) => a.kind === 'back');
    drawText(ctx, `A LENDA · ${game.save.legend || 0}/${LEGEND_CHAPTERS.length}`, 20, 48, {
      size: 5, color: C.gold,
    });
    const lx = Math.max(20, Math.round((VIEW.W - legends.length * 116) / 2));
    const hx = Math.max(14, Math.round((VIEW.W - hangs.length * 204) / 2));
    legends.forEach((a, i) => card(a, lx + i * 116, 56, 108, 46, true));
    drawText(ctx, 'ROLÊ COM OS AMIGOS', hx, 108, { size: 5, color: C.green });
    hangs.forEach((a, i) => card(a, hx + i * 204, 116, 196, 38));

    const backX = VIEW.W - 220;
    if (league) {
      this.rect(league.id, 20, 158, backX - 28, 22);
      this.panel(ctx, 20, 158, backX - 28, 22);
      if (acts[game.postIndex]?.id === league.id) {
        ctx.fillStyle = 'rgba(176,124,255,0.16)';
        ctx.fillRect(24, 162, backX - 36, 14);
      }
      drawText(ctx, league.title, 28, 161, { size: 5, color: C.cream });
      drawText(ctx, `LIGA: ${game.save.leagueBest || 0} pts · ${game.save.leagueWins || 0} vitórias · streak ${game.save.leagueStreak || 0}`, 28, 171, {
        size: 4, color: C.violet,
      });
    }
    if (back) card(back, backX, 158, 196, 22);

    drawText(ctx, 'EVENTOS DA COMUNIDADE · BANDEIRA, TIME, PIPAS, SURF', 20, 186, {
      size: 5, color: C.blue,
    });
    events.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 20 + col * 196, y = 194 + row * 20, w = 190, h = 18;
      const selected = acts[game.postIndex]?.id === a.id;
      this.rect(a.id, x, y, w, h);
      this.panel(ctx, x, y, w, h);
      if (selected) {
        ctx.fillStyle = 'rgba(176,124,255,0.18)';
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      }
      drawText(ctx, fit(ctx, a.title, w - 96, 4),
        x + 7, y + 6, { size: 4, color: selected ? C.gold : C.cream });
      const g = a.goal || { type: 'score', value: 0 };
      const tag = g.type === 'flags' ? `BANDEIRA ${g.value}`
        : g.type === 'team' ? `TIME ${g.value}`
          : g.type === 'pipa' ? `PIPAS ${g.value}`
            : g.type === 'surf' || g.type === 'waves' ? `ONDAS ${g.value}`
              : g.type === 'hunt' ? `PISTAS ${g.value}`
                : `${g.type === 'relics' ? 'RELÍQUIAS' : 'PONTOS'} ${g.value}`;
      drawText(ctx, tag, x + w - 7, y + 6, { size: 4, color: C.dim, align: 'right' });
    });

    this.panel(ctx, backX, 186, 196, 110);
    drawText(ctx, 'SEU LEGADO', 432, 192, { size: 6, color: C.gold });
    drawText(ctx, `LENDA ${game.save.legend || 0}/${LEGEND_CHAPTERS.length}`, backX + 12, 206, { size: 5, color: C.cream });
    drawText(ctx, `ROLÊS ${Object.keys(game.save.hangouts || {}).length}/3`, backX + 12, 218, { size: 5, color: C.cream });
    drawText(ctx, `RELÍQUIAS ${game.save.relics.length}/${RELIC_ORDER.length}`, backX + 12, 230, { size: 5, color: C.cream });
    drawText(ctx, `MISSÕES ${WORLD_QUESTS.filter((q) => (game.save.quests[q.id] || 0) >= q.target).length}/${WORLD_QUESTS.length}`, backX + 12, 242, { size: 5, color: C.cream });
    drawText(ctx, `EVENTOS ${Math.max(0, game.save.eventsDone || 0)}/${EVENTS.length}`, backX + 12, 254, { size: 5, color: C.cream });
    drawText(ctx, game.save.legendDone ? 'O arquipélago é seu.' : 'A lenda ainda espera.', backX + 98, 272, {
      size: 4, color: game.save.legendDone ? C.green : C.dim, align: 'center',
    });
    drawText(ctx, 'W/S navega · E entra · clique também', 320, 330, {
      size: 4, color: 'rgba(231,240,248,0.45)', align: 'center',
    });
    this.drawTicker(ctx, game);
  }

  /* ------------------------------------------------------------------ fitas */
  drawTape(ctx, game) {
    this.shade(ctx, 0.70);
    const lx = Math.round((VIEW.W - 600) / 2), rx = lx + 380;
    drawText(ctx, 'FITA 2000', lx, 10, { size: 18, color: C.gold, shadow: C.ink, weight: 'bold' });
    drawText(ctx, 'a discoteca da lan house · OST original gerada no navegador', lx, 30, {
      size: 6, color: C.blue,
    });
    drawText(ctx, '100% ORIGINAL · SEM COPYRIGHT', VIEW.W - 24, 14, {
      size: 4, color: C.green, align: 'right',
    });
    const list = TAPES;
    const sel = list[game.tapeIndex] || list[0];
    const unlocked = sel && game.tapeUnlocked(sel.id);

    this.panel(ctx, lx, 44, 368, 278);
    drawText(ctx, 'LADO A · 30 FAIXAS', lx + 8, 49, { size: 4, color: C.gold });
    list.forEach((tr, i) => {
      const col = Math.floor(i / 15), row = i % 15;
      const x = lx + 8 + col * 184;
      const y = 58 + row * 17;
      const got = game.tapeUnlocked(tr.id);
      const current = i === game.tapeIndex;
      this.rect('tape:track:' + i, x - 3, y - 1, 176, 15);
      if (current) {
        ctx.fillStyle = 'rgba(143,211,232,0.16)';
        ctx.fillRect(x - 3, y - 1, 176, 15);
      }
      drawText(ctx, `${String(i + 1).padStart(2, '0')} ${tr.title}`, x, y + 3, {
        size: 4, color: current ? C.gold : got ? C.cream : '#4a5268',
      });
      if (!got) drawText(ctx, '[X]', x + 168, y + 3, { size: 4, color: '#4a5268', align: 'right' });
      else if (game.tapeTrack === tr.track && game.tapePlaying) {
        drawText(ctx, '\u266A', x + 168, y + 2, { size: 5, color: C.green, align: 'right' });
      }
    });

    this.panel(ctx, rx, 44, 220, 278);
    const sx = rx + 14, sy = 56, sw = 192, sh = 108;
    ctx.fillStyle = '#202a45';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#0b1220';
    ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
    ctx.fillStyle = '#0b1226';
    ctx.fillRect(sx + 16, sy + 30, sw - 32, 42);
    drawText(ctx, 'SURFN 2000', sx + 24, sy + 36, { size: 4, color: C.blue });
    drawText(ctx, 'LADO A', sx + sw - 24, sy + 36, { size: 4, color: C.dim, align: 'right' });
    const spin = game.tapePlaying ? this.t * 3.2 : this.t * 0.16;
    [sx + 50, sx + sw - 50].forEach((rx) => {
      ctx.fillStyle = '#0e1830';
      ctx.beginPath();
      ctx.arc(rx, sy + 58, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = unlocked ? C.blue : '#3b465c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rx, sy + 58, 10, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = spin + k * 2.09;
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(a) * 3, sy + 58 + Math.sin(a) * 3);
        ctx.lineTo(rx + Math.cos(a) * 10, sy + 58 + Math.sin(a) * 10);
        ctx.stroke();
      }
    });
    ctx.fillStyle = '#111a30';
    ctx.fillRect(sx + 30, sy + 86, sw - 60, 10);
    ctx.fillStyle = unlocked ? C.gold : '#3b465c';
    ctx.fillRect(sx + 34, sy + 89, sw - 68, 4);

    drawText(ctx, unlocked ? sel.title : 'FITA BLOQUEADA', rx + 12, 174, {
      size: 7, color: unlocked ? C.gold : C.dim, shadow: C.ink,
    });
    drawText(ctx, unlocked ? 'FAIXA ORIGINAL · SINTETIZADA AQUI' : game.tapeUnlockText(sel?.unlock),
      rx + 12, 187, { size: 4, color: unlocked ? C.blue : C.rose });
    drawText(ctx, unlocked ? (game.tapePlaying ? 'TOCANDO' : 'PAUSADA') : 'BLOQUEADA',
      rx + 206, 176, { size: 4, color: unlocked ? C.green : C.red, align: 'right' });

    this.button(ctx, game, 'tape:play', rx + 14, 204, 96, 24, unlocked ? (game.tapePlaying ? 'II PAUSAR' : '\u25B6 TOCAR') : 'BLOQUEADA', {
      size: 5, color: unlocked ? C.gold : C.dim,
    });
    this.button(ctx, game, 'tape:track:' + ((game.tapeIndex + list.length - 1) % list.length), rx + 114, 204, 38, 24, '<<', { size: 6 });
    this.button(ctx, game, 'tape:track:' + ((game.tapeIndex + 1) % list.length), rx + 156, 204, 38, 24, '>>', { size: 6 });
    drawText(ctx, `FITAS ${game.save.tapes.length}/${list.length}`, rx + 14, 238, {
      size: 5, color: C.cream,
    });
    drawText(ctx, `SEGREDOS ${game.save.eggs.length}`, rx + 206, 238, {
      size: 5, color: C.violet, align: 'right',
    });
    drawText(ctx, 'DICA: DIGITE 2000 NO TECLADO', rx + 14, 250, {
      size: 4, color: 'rgba(231,240,248,0.38)',
    });
    drawText(ctx, 'A OST RODA OFFLINE. NENHUM ARQUIVO DE ÁUDIO EXTERNO.', rx + 14, 262, {
      size: 3, color: 'rgba(231,240,248,0.32)',
    });
    drawText(ctx, '\u2191\u2193 escolhe · ESPAÇO toca · ESC volta', rx + 14, 280, {
      size: 4, color: C.dim,
    });
    this.button(ctx, game, 'tape:back', lx, 326, 100, 16, 'VOLTAR', { size: 5 });
    drawText(ctx, 'cada fita destrava com história, festas, relíquias, streaks ou segredos',
      lx + 110, 330, { size: 4, color: 'rgba(231,240,248,0.45)' });
    this.drawTicker(ctx, game);
  }

  /* ------------------------------------------------------------------ bônus */
  drawGallery(ctx, game) {
    this.shade(ctx, 0.58);
    drawText(ctx, 'ARQUIVO 2000', 24, 14, { size: 13, color: C.gold, shadow: C.ink });
    drawText(ctx, 'o museu das coisas que a internet esqueceu', 24, 31, {
      size: 6, color: C.blue,
    });

    drawText(ctx, `XP ${game.save.xp}`, VIEW.W - 24, 16, {
      size: 6, color: C.blue, align: 'right',
    });
    const tabs = ['RELÍQUIAS', 'ELENCO', 'CRÉDITOS', 'FESTAS', 'CONQUISTAS', 'BÔNUS'];
    const tabW = 96;
    const tabsX = Math.round((VIEW.W - tabs.length * tabW) / 2);
    tabs.forEach((t, i) => {
      const x = tabsX + i * tabW;
      this.rect('gallery:tab:' + i, x, 44, tabW - 4, 18);
      this.panel(ctx, x, 44, tabW - 4, 18, i === game.galleryTab ? 1 : 0.5);
      if (i === game.galleryTab) {
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x + 4.5, 48.5, tabW - 13, 9);
      }
      drawText(ctx, `${i + 1} ${t}`, x + (tabW - 4) / 2, 49, {
        size: 4, color: i === game.galleryTab ? C.gold : C.dim, align: 'center',
      });
    });

    const gridX = Math.round((VIEW.W - 600) / 2);
    if (game.galleryTab === 0) {
      RELIC_ORDER.forEach((id, i) => {
        const r = RELICS[id];
        const col = i % 4, row = Math.floor(i / 4);
        const x = gridX + col * 150, y = 72 + row * 100;
        const got = game.save.relics.includes(id);
        this.panel(ctx, x, y, 140, 92, got ? 1 : 0.55);
        ctx.fillStyle = 'rgba(16,32,60,0.9)';
        ctx.fillRect(x + 8, y + 8, 34, 34);
        ctx.globalAlpha = got ? 1 : 0.25;
        this.art.drawSurf(ctx, 'rel_' + id, x + 25, y + 25, { anchor: 'center', scale: 1.4 });
        ctx.globalAlpha = 1;
        drawText(ctx, got ? fit(ctx, r.name, 82, 7) : '???', x + 48, y + 10, {
          size: 7, color: got ? C.gold : C.dim,
        });
        const lines = wrap(ctx, got ? r.desc : 'Ainda perdida em algum servidor de 2007.', 124, 6);
        lines.slice(0, 5).forEach((ln, k) => {
          drawText(ctx, ln, x + 9, y + 48 + k * 8, { size: 6, color: got ? C.cream : '#5a6273' });
        });
      });
    } else if (game.galleryTab === 1) {
      Object.entries(CAST).forEach(([id, c], i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = gridX + col * 200, y = 70 + row * 62;
        this.panel(ctx, x, y, 190, 56);
        ctx.fillStyle = '#0b1026';
        ctx.fillRect(x + 8, y + 6, 40, 40);
        this.art.face(ctx, id, x + 28, y + 26, 36, c.rider);
        drawText(ctx, c.name, x + 54, y + 6, { size: 6, color: c.color });
        const lines = wrap(ctx, c.bio, 128, 5).slice(0, 4);
        lines.forEach((ln, k) => drawText(ctx, ln, x + 54, y + 17 + k * 7, {
          size: 5, color: C.cream,
        }));
      });
    } else if (game.galleryTab === 3) {
      const active = game.activeHoliday();
      HOLIDAYS.forEach((h, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = gridX - 2 + col * 298, y = 70 + row * 62;
        const isActive = active?.id === h.id;
        const done = game.holidayDone(h);
        this.rect('gallery:holiday:' + h.id, x, y, 288, 58);
        this.panel(ctx, x, y, 288, 58, isActive ? 1 : done ? 0.9 : 0.55);
        ctx.fillStyle = h.color;
        ctx.fillRect(x, y, 3, 58);
        drawText(ctx, h.name, x + 9, y + 5, {
          size: 6, color: isActive ? h.color : done ? C.green : C.cream, shadow: C.ink,
        });
        drawText(ctx, done ? '\u2713 FEITO' : h.label, x + 280, y + 6, {
          size: 4, color: done ? C.green : C.dim, align: 'right',
        });
        const lines = wrap(ctx, h.desc, 260, 4).slice(0, 2);
        lines.forEach((ln, k) => drawText(ctx, ln, x + 9, y + 17 + k * 8, {
          size: 4, color: isActive ? C.cream : 'rgba(251,238,200,0.55)',
        }));
        drawText(ctx, isActive ? 'JOGAR AGORA \u25B6' : 'FORA DE TEMPORADA', x + 9, y + 44, {
          size: 4, color: isActive ? C.gold : C.dim,
        });
      });
    } else if (game.galleryTab === 4) {
      ACHIEVEMENTS.forEach((a, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = gridX + col * 200, y = 66 + row * 24.5;
        const got = game.save.achievements.includes(a.id);
        this.panel(ctx, x, y, 190, 21, got ? 1 : 0.5);
        ctx.fillStyle = got ? C.green : '#3b465c';
        ctx.fillRect(x, y, 2, 21);
        drawText(ctx, got ? '\u2713' : '\u00B7', x + 7, y + 2, {
          size: 6, color: got ? C.green : C.dim,
        });
        drawText(ctx, fit(ctx, a.title, 146, 5), x + 18, y + 2, {
          size: 5, color: got ? C.cream : C.dim,
        });
        drawText(ctx, fit(ctx, a.desc, 146, 4), x + 18, y + 11, {
          size: 4, color: got ? C.blue : '#48506a',
        });
        drawText(ctx, `+${a.xp}`, x + 184, y + 3, {
          size: 4, color: got ? C.gold : '#48506a', align: 'right',
        });
      });
      drawText(ctx, `CONQUISTAS ${game.save.achievements.length}/${ACHIEVEMENTS.length}`,
        VIEW.W - 24, 34, { size: 4, color: C.green, align: 'right' });
    } else if (game.galleryTab === 5) {
      const doneCount = Object.keys(game.save.bonus || {}).length;
      drawText(ctx, `FASES ${doneCount}/${BONUS_STAGES.length} · MODEMS ${(game.save.modems || []).length}/7 · SEGREDOS ${game.save.eggs.length}`,
        VIEW.W / 2, 63, { size: 4, color: C.green, align: 'center' });
      BONUS_STAGES.forEach((st, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = gridX - 2 + col * 300, y = 72 + row * 78;
        const unlocked = game.bonusUnlocked(i);
        const done = game.bonusDone(i);
        const stars = done ? (game.save.bonus[st.id] || 0) : 0;
        const sel = (game.bonusIndex || 0) === i;
        this.rect('gallery:bonus:' + i, x, y, 292, 72);
        this.panel(ctx, x, y, 292, 72, unlocked ? 1 : 0.48);
        if (sel) {
          ctx.strokeStyle = C.gold;
          ctx.strokeRect(x + 4.5, y + 4.5, 283, 63);
        }
        ctx.fillStyle = unlocked ? st.color : '#3b465c';
        ctx.fillRect(x, y, 3, 72);
        drawText(ctx, unlocked ? fit(ctx, st.title, 190, 6) : '???', x + 9, y + 5, {
          size: 6, color: unlocked ? (done ? C.green : C.cream) : C.dim, shadow: C.ink,
        });
        drawText(ctx, unlocked ? MAP_META[st.map].label : 'FASE SECRETA', x + 283, y + 6, {
          size: 4, color: unlocked ? C.dim : C.rose, align: 'right',
        });
        const desc = unlocked ? st.desc : game.bonusUnlockText(i);
        wrap(ctx, desc, 268, 4).slice(0, 2).forEach((ln, k) => drawText(ctx, ln, x + 9, y + 18 + k * 8, {
          size: 4, color: unlocked ? C.cream : '#5a6273',
        }));
        drawText(ctx, unlocked ? `META ${st.goal.value} · ${String(st.goal.type).toUpperCase()}` : 'BLOQUEADA',
          x + 9, y + 38, { size: 4, color: unlocked ? st.color : '#5a6273' });
        drawText(ctx, done ? 'MELHOR' : unlocked ? 'JOGAR \u25B6' : game.bonusUnlockText(i),
          x + 9, y + 52, {
            size: 5, color: done ? C.gold : unlocked ? C.cream : C.dim,
          });
        if (done) {
          for (let s = 0; s < 3; s++) {
            ctx.globalAlpha = s < stars ? 1 : 0.2;
            this.art.drawSurf(ctx, 'ic_rank', x + 232 + s * 18, y + 56, {
              anchor: 'center', scale: 0.9,
            });
          }
          ctx.globalAlpha = 1;
        }
      });
      drawText(ctx, '\u2191\u2193 escolhe · E/clique joga · \u2190\u2192 troca aba', VIEW.W / 2, 314, {
        size: 4, color: C.dim, align: 'center',
      });
    } else {
      this.panel(ctx, 24, 72, VIEW.W - 48, 250);
      CREDITS.forEach((line, i) => {
        drawText(ctx, line, 40, 84 + i * 15, {
          size: i < 3 ? 7 : 5, color: i === 0 ? C.gold : C.cream,
        });
      });
      drawText(ctx, 'Obrigado por jogar. Não esqueça de repassar para 10 amigos.',
        VIEW.W / 2, 288, { size: 7, color: C.blue, align: 'center' });
      drawText(ctx, 'SURFN 2000', VIEW.W - 24, 288, { size: 7, color: C.dim, align: 'right' });
    }

    this.button(ctx, game, 'gallery:back', 24, 326, 120, 22, 'VOLTAR', { size: 7 });
    this.drawTicker(ctx, game);
  }

  /* ------------------------------------------------------------------ remix */
  drawRemix(ctx, game) {
    this.shade(ctx, 0.66);
    drawText(ctx, 'REMIX 2000', 24, 12, { size: 15, color: C.gold, shadow: C.ink });
    drawText(ctx, 'O jogo é seu. Liga, desliga e remixa — diversão primeiro.', 24, 31, {
      size: 6, color: C.blue,
    });
    drawText(ctx, 'sem login · sem passe · sem loot box · mods são só dados', 24, 42, {
      size: 5, color: 'rgba(251,238,200,0.45)',
    });
    const list = game.remixMods();
    const onCount = list.filter((m) => game.mods.isOn(m.id)).length;
    drawText(ctx, `${onCount}/${list.length} LIGADOS`, VIEW.W - 24, 16, {
      size: 6, color: onCount ? C.green : C.dim, align: 'right',
    });
    const cw = 286, chh = 40, gx = 12, gy = 4, y0 = 54;
    const x0 = Math.round((VIEW.W - (2 * cw + gx)) / 2);
    list.forEach((m, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (cw + gx);
      const y = y0 + row * (chh + gy);
      const on = game.mods.isOn(m.id);
      const sel = i === game.remixIndex;
      this.rect('remix:toggle:' + m.id, x, y, cw, chh);
      this.panel(ctx, x, y, cw, chh, on ? 0.98 : 0.72);
      if (sel) {
        ctx.fillStyle = 'rgba(143,211,232,0.14)';
        ctx.fillRect(x + 4, y + 4, cw - 8, chh - 8);
        ctx.strokeStyle = C.gold;
        ctx.strokeRect(x + 4.5, y + 4.5, cw - 9, chh - 9);
      }
      ctx.fillStyle = on ? C.gold : '#3b465c';
      ctx.fillRect(x, y, 3, chh);
      drawText(ctx, `${on ? '[ON]' : '[  ]'} ${m.title}`, x + 10, y + 7, {
        size: 7, color: on ? C.gold : C.cream, shadow: C.ink,
      });
      drawText(ctx, on ? 'LIGADO' : 'DESLIGADO', x + cw - 10, y + 8, {
        size: 4, color: on ? C.green : C.dim, align: 'right',
      });
      const lines = wrap(ctx, m.desc, cw - 20, 5).slice(0, 2);
      lines.forEach((ln, k) => drawText(ctx, ln, x + 10, y + 19 + k * 8, {
        size: 5, color: on ? C.cream : 'rgba(251,238,200,0.55)',
      }));
    });

    this.button(ctx, game, 'remix:preset', 24, 290, 250, 24,
      game.zoeiraOn() ? 'ZOEIRA TOTAL: LIGADA' : 'ZOEIRA TOTAL', {
        size: 7, selected: game.zoeiraOn(), color: C.gold,
        sub: undefined,
      });
    this.button(ctx, game, 'remix:back', VIEW.W - 144, 290, 120, 24, 'VOLTAR', { size: 7 });
    drawText(ctx, 'W/A/S/D navega · E liga/desliga · R zoeira total · ESC volta', x0 + 262, 300, {
      size: 4, color: C.dim,
    });
    drawText(ctx, 'carregue mods da comunidade em window.SURFN_MODS ou no localStorage',
      VIEW.W / 2, 322, { size: 4, color: 'rgba(231,240,248,0.4)', align: 'center' });
    this.drawTicker(ctx, game);
  }

  /* ---------------------------------------------------------------- options */
  drawOptions(ctx, game) {
    this.shade(ctx, 0.62);
    drawText(ctx, 'OPÇÕES', 24, 18, { size: 14, color: C.gold, shadow: C.ink });
    drawText(ctx, 'Ajuste o som e o nível de nostalgia.', 24, 37, { size: 6, color: C.blue });

    const s = game.settings;
    const ox = Math.round((VIEW.W - 592) / 2);
    const rows = [
      ['Música', `${Math.round(game.musicVol * 100)}%`, 'music'],
      ['Efeitos', `${Math.round(game.sfxVol * 100)}%`, 'sfx'],
      ['Qualidade', game.qualityLabel(), 'quality'],
      ['Tremor de tela', s.shake ? 'LIGADO' : 'DESLIGADO', 'shake'],
      ['Scanlines CRT', s.scanlines ? 'LIGADO' : 'DESLIGADO', 'scan'],
      ['Minimapa', s.minimap === false ? 'DESLIGADO' : 'LIGADO', 'map'],
      ['Textos de zoeira', s.banter === false ? 'DESLIGADO' : 'LIGADO', 'banter'],
    ];
    rows.forEach(([k, v, id], i) => {
      const y = 62 + i * 34;
      const sel = i === game.optIndex;
      this.rect('opt:' + id, ox, y, 400, 26);
      this.panel(ctx, ox, y, 400, 26, sel ? 1 : 0.6);
      if (sel) {
        ctx.fillStyle = 'rgba(143,211,232,0.15)';
        ctx.fillRect(ox + 5, y + 5, 390, 16);
      }
      drawText(ctx, (sel ? '\u2665 ' : '   ') + k, ox + 16, y + 9, {
        size: 8, color: sel ? C.gold : C.cream,
      });
      drawText(ctx, `<  ${v}  >`, ox + 380, y + 8, {
        size: 8, color: sel ? C.blue : C.dim, align: 'right',
      });
    });

    this.panel(ctx, ox + 416, 62, 176, 202);
    drawText(ctx, 'DICA DO NALDO', ox + 428, 72, { size: 7, color: C.gold });
    const tips = [
      'Se o jogo travar, culpe o modem.',
      'Shift gasta turbo, mas vale cada centavo.',
      'Manobra no ar enche o combo.',
      'A parede de água machuca. Pule.',
      'Não existe lag: existe emoção.',
      'Se cair, aperte E e finja que foi de propósito.',
    ];
    tips.forEach((tip, i) => {
      const lines = wrap(ctx, '\u00B7 ' + tip, 150, 6);
      let y = 88 + i * 28;
      lines.forEach((ln) => {
        drawText(ctx, ln, ox + 428, y, { size: 6, color: C.cream });
        y += 8;
      });
    });

    this.button(ctx, game, 'opt:back', ox, 320, 120, 24, 'VOLTAR', { size: 7 });
    this.button(ctx, game, 'opt:reset', ox + 136, 320, 160, 24, 'ZERAR PROGRESSO', { size: 7, color: '#ff9f9f' });
    drawText(ctx, game.resetConfirm ? 'Aperte de novo pra confirmar.' : '',
      ox + 312, 326, { size: 6, color: C.red });
    this.drawTicker(ctx, game);
  }

  /* ---------------------------------------------------------------- results */
  drawResults(ctx, game) {
    const res = game.result;
    if (!res) return;
    this.shade(ctx, 0.62);
    const win = res.win;
    const px = Math.round((VIEW.W - 484) / 2);
    this.panel(ctx, px, 34, 484, 274);
    drawText(ctx, win ? 'VITÓRIA!' : 'QUASE LÁ...', VIEW.W / 2, 48, {
      size: 24, color: win ? C.gold : C.rose, align: 'center', shadow: C.ink, weight: 'bold',
    });
    drawText(ctx, res.title, VIEW.W / 2, 78, {
      size: 7, color: C.blue, align: 'center',
    });

    const rows = [
      ['PONTOS', `${Math.round(res.score)}`, C.gold],
      ['LUGAR', `${res.pos}º de ${res.total}`, C.blue],
      ['MELHOR COMBO', `x${res.bestCombo}`, C.orange],
      ['GATES', `${res.gates}`, C.green],
      ['RELÍQUIAS', `${res.relics}`, C.violet],
      ['QUEDAS', `${res.bails}`, C.rose],
    ];
    rows.forEach(([k, v, col], i) => {
      const x = px + 30 + (i % 3) * 142;
      const y = 100 + Math.floor(i / 3) * 40;
      drawText(ctx, k, x, y, { size: 6, color: C.dim });
      drawText(ctx, v, x, y + 12, { size: 14, color: col, shadow: C.ink });
    });

    drawText(ctx, res.goalLine, VIEW.W / 2, 186, {
      size: 8, color: win ? C.green : C.rose, align: 'center',
    });
    if (res.reward) {
      drawText(ctx, res.reward, VIEW.W / 2, 202, {
        size: 8, color: C.gold, align: 'center', shadow: C.ink,
      });
    }
    for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = s < res.stars ? 1 : 0.22;
      this.art.drawSurf(ctx, 'ic_rank', VIEW.W / 2 - 26 + s * 26, 236, {
        anchor: 'center', scale: 1.5,
      });
    }
    ctx.globalAlpha = 1;
    drawText(ctx, `recorde ${res.best}`, VIEW.W / 2, 254, {
      size: 6, color: C.dim, align: 'center',
    });
    drawText(ctx, `milestones nesta run: ${res.milestones || 0}`, VIEW.W / 2, 266, {
      size: 5, color: C.violet, align: 'center',
    });
    drawText(ctx, 'PRESSIONE  E  PARA CONTINUAR', VIEW.W / 2, 282, {
      size: 9, color: Math.sin(this.t * 4) > -0.3 ? C.gold : C.cream,
      align: 'center', shadow: C.ink,
    });
  }

  /* ------------------------------------------------------------------ pause */
  drawPause(ctx, game) {
    this.shade(ctx, 0.66);
    const px = Math.round((VIEW.W - 260) / 2);
    this.panel(ctx, px, 78, 260, 204);
    drawText(ctx, 'PAUSA', VIEW.W / 2, 92, { size: 16, color: C.gold, align: 'center' });
    drawText(ctx, 'respira. o mar espera.', VIEW.W / 2, 114, {
      size: 6, color: C.dim, align: 'center',
    });
    const items = [['Continuar', 'pause:resume'], ['Reiniciar', 'pause:restart'], ['Sair', 'pause:quit']];
    items.forEach(([label, id], i) => {
      this.button(ctx, game, id, px + 24, 132 + i * 38, 212, 30, label, {
        size: 9, selected: game.pauseIndex === i,
      });
    });
    drawText(ctx, 'WASD desliza · SHIFT turbo · ESPAÇO ollie · J/K/L manobra', VIEW.W / 2, 252, {
      size: 5, color: C.dim, align: 'center',
    });
    drawText(ctx, 'ESC volta ao jogo', VIEW.W / 2, 262, {
      size: 5, color: C.dim, align: 'center',
    });
  }

  /* -------------------------------------------------------------- countdown */
  drawCountdown(ctx, game) {
    const cd = game.countdown;
    if (cd <= 0) return;
    ctx.fillStyle = 'rgba(6,12,26,0.28)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    const n = Math.ceil(cd);
    const label = n > 3 ? 'PREPARA' : n > 0 ? `${n}` : 'VAI!';
    const pulse = 1 + (1 - (cd % 1)) * 0.18;
    ctx.save();
    ctx.translate(VIEW.W / 2, VIEW.H / 2 - 20);
    ctx.scale(pulse, pulse);
    drawText(ctx, label, 0, -22, {
      size: 40, color: C.gold, align: 'center', shadow: C.ink, weight: 'bold',
    });
    ctx.restore();
    drawText(ctx, 'WASD · SHIFT · ESPAÇO · J/K/L', VIEW.W / 2, VIEW.H / 2 + 34, {
      size: 8, color: C.cream, align: 'center', shadow: C.ink,
    });
  }

  /* ----------------------------------------------------------------- ticker */
  drawTicker(ctx, game) {
    const h = 14;
    const y = VIEW.H - h;
    ctx.fillStyle = 'rgba(6,12,26,0.82)';
    ctx.fillRect(0, y, VIEW.W, h);
    ctx.fillStyle = C.rose;
    ctx.fillRect(0, y, 54, h);
    drawText(ctx, 'PLANTÃO', 27, y + 4, { size: 5, color: C.white, align: 'center' });
    ctx.save();
    ctx.beginPath();
    ctx.rect(58, y, VIEW.W - 58, h);
    ctx.clip();
    const feed = game.tickerFeed();
    // measure with the real proportional font: fixed 4px/char spacing made
    // neighbouring headlines collide after the typeface change
    ctx.font = FONT(6);
    const widths = feed.map((s) => Math.ceil(ctx.measureText(s).width) + 40);
    const total = widths.reduce((a, b) => a + b, 0);
    const feedCols = [C.cream, C.gold, C.blue, C.green, C.orange];
    let x = VIEW.W - ((this.t * 46) % (total + 200));
    feed.forEach((s, i) => {
      drawText(ctx, s, x, y + 4, { size: 6, color: feedCols[i % feedCols.length] });
      x += widths[i];
    });
    ctx.restore();
  }

  /* -------------------------------------------------------------- CRT lines */
  drawCRT(ctx, game, world = true) {
    if (world) {
      ctx.fillStyle = 'rgba(6,14,30,0.10)';
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }
    // on the potato tier the scanline pass is pure overhead: skip the 120
    // fillRects and keep only the vignette
    if (game.settings.scanlines && game.perfLevel > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let y = 0; y < VIEW.H; y += 3) ctx.fillRect(0, y, VIEW.W, 1);
      const g = ctx.createRadialGradient(VIEW.W / 2, VIEW.H / 2, 120,
        VIEW.W / 2, VIEW.H / 2, 360);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    }
  }

  /* ------------------------------------------------------------ loading card */
  drawLoading(ctx, p) {
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    for (let i = 0; i < 6; i++) {
      const y = 220 + i * 18;
      ctx.globalAlpha = 0.1 + i * 0.02;
      ctx.fillStyle = '#8fd3e8';
      ctx.beginPath();
      ctx.arc(320, y, 160 - i * 12, Math.PI, 0);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawText(ctx, 'SURFN 2000', VIEW.W / 2, 118, {
      size: 26, color: C.cream, align: 'center', shadow: '#5a2a1c', weight: 'bold',
    });
    drawText(ctx, 'calibrando a prancha e o modem...', VIEW.W / 2, 154, {
      size: 7, color: C.blue, align: 'center',
    });
    ctx.fillStyle = '#11203c';
    ctx.fillRect(200, 176, 240, 6);
    ctx.fillStyle = C.gold;
    ctx.fillRect(200, 176, 240 * clamp(p, 0, 1), 6);
    drawText(ctx, `${Math.round(p * 100)}%`, VIEW.W / 2, 188, {
      size: 6, color: C.dim, align: 'center',
    });
  }
}
