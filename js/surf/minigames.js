/* =========================================================================
   MINIGAMES — the lan house arcade, in Counter-Strike 1.6 menu drag.
   Every frame is drawn with the game's own atlas: skyblock panels, iso floor
   tiles, the surf deck/ramp/gate sprites, Habbofont props and the Zel sprite.
   Five classics of the golden internet era: kite fighting (pipa), the CS
   1.6/Source/GO surf ramp, snake, minesweeper and breakout.
   ========================================================================= */
import { VIEW, clamp, rand, drawText, textSize, UI_FONT } from '../engine/core.js';

const PF = { x: 14, y: 56, w: 612, h: 260 };
/* after this many losses the prova offers a way past it — no XP, no record,
   no bonus: the story just keeps moving */
const SKIP_AFTER = 5;

const C = {
  cream: '#fbeec8', gold: '#ffe066', blue: '#8fd3e8', dim: '#9aa2b3',
  green: '#8ecf63', ink: '#1b1728', rose: '#ff8f6b', violet: '#b07cff',
  white: '#fffbe8', red: '#ff5a5f', olive: '#cfc9a8',
};

const RIVAL_KITE_COLORS = ['#ff8f6b', '#b07cff', '#ffe066', '#8fd3e8'];

export const MINIGAMES = [
  {
    id: 'pipa', title: 'PIPA NA LAJE', short: 'PIPA', tag: 'FLASH · 2002',
    blurb: 'Cerol, laje e vento. Suba a pipa, cruze a linha na dos rivais e corte as quatro antes que cortem a sua.',
    controls: 'A/D · W/S voa  ·  ESPAÇO puxa a linha',
    goal: 'corte 4 pipas', color: C.green,
  },
  {
    id: 'surf', title: 'SURF_CLASSIC', short: 'SURF', tag: 'CS 1.6 · 2005',
    blurb: 'A rampa clássica do surf_ski. Segure A ou D para grudar na superfície e não caia no vazio.',
    controls: 'A/D gruda na rampa  ·  ESPAÇO pula',
    goal: 'chegue ao fim da rampa', color: C.blue,
  },
  {
    id: 'cobra', title: 'JOGO DA COBRINHA', short: 'COBRINHA', tag: 'NOKIA · 1998',
    blurb: 'O tijolão voltou, agora no piso do arquipélago. Coma as frutinhas, cresça e não morda o próprio rabo.',
    controls: 'SETAS / WASD move',
    goal: 'coma 8 frutas', color: C.gold,
  },
  {
    id: 'campo', title: 'CAMPO MINADO', short: 'CAMPO', tag: 'WIN 95 · 1992',
    blurb: 'O ZEL.EXE plantou vírus no servidor. Abra os arquivos e marque as minas sem explodir a lan house.',
    controls: 'CLIQUE abre  ·  F bandeira  ·  R reinicia',
    goal: 'limpe o servidor', color: C.rose,
  },
  {
    id: 'brick', title: 'QUEBRA-BLOCO', short: 'QUEBRA-BLOCO', tag: 'ARCADE · 1997',
    blurb: 'Uma prancha, uma bolinha e 40 deck tiles de paciência. Se a bola cair, você perde uma ficha.',
    controls: 'MOUSE / A-D move a prancha',
    goal: 'quebre todos os tiles', color: C.violet,
  },
];

/* --------------------------------------------------------------- helpers */
function wrapText(ctx, text, maxW, size = 6) {
  ctx.font = `${textSize(size)}px ${UI_FONT}`;
  const out = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
    else line = test;
  }
  out.push(line);
  return out;
}

function segCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

/* =========================================================== the screen */
export class Minigames {
  constructor(game) {
    this.game = game;
    this.phase = 'menu';
    this.index = 0;
    this.id = null;
    this.s = null;
    this.result = null;
    this.chapterIndex = null;
    this.menuReturn = 'main';
    this.fails = {};
    this.t = 0;
  }

  get art() { return this.game.art; }
  get def() { return MINIGAMES.find((m) => m.id === this.id) || MINIGAMES[0]; }

  showMenu(returnTo = 'main') {
    this.phase = 'menu';
    this.id = null;
    this.s = null;
    this.result = null;
    this.chapterIndex = null;
    this.menuReturn = returnTo;
  }

  open(id, opts = {}) {
    const def = MINIGAMES.find((m) => m.id === id);
    if (!def) return;
    this.id = def.id;
    this.index = MINIGAMES.findIndex((m) => m.id === def.id);
    this.chapterIndex = opts.chapterIndex ?? null;
    if (opts.returnTo) this.menuReturn = opts.returnTo;
    this.result = null;
    this.s = this.createSession(def.id);
    this.phase = 'play';
    this.game.audio.sfx('quest');
  }

  createSession(id) {
    if (id === 'pipa') return this.createPipa();
    if (id === 'surf') return this.createSurf();
    if (id === 'cobra') return this.createCobra();
    if (id === 'campo') return this.createCampo();
    return this.createBrick();
  }

  pointer() {
    const m = this.game.input.mouse;
    return {
      x: m.x - (this.game.ui.offsetX || 0),
      y: m.y - (this.game.ui.offsetY || 0),
    };
  }

  finish(won, score) {
    if (this.phase !== 'play') return;
    this.phase = 'done';
    this.result = { won, score: Math.round(score) };
    const id = this.id;
    this.fails[id] = won ? 0 : (this.fails[id] || 0) + 1;
    this.game.audio.sfx(won ? 'quest' : 'deny');
  }

  /** five losses on a chapter prova unlock the skip; arcade play never does */
  skipReady() {
    return this.chapterIndex != null && !!this.result && !this.result.won
      && (this.fails[this.id] || 0) >= SKIP_AFTER;
  }

  commit(opts = {}) {
    const res = {
      id: this.id,
      won: !!this.result?.won,
      score: Math.round(this.result?.score || 0),
      chapterIndex: this.chapterIndex,
      returnTo: this.menuReturn,
      skip: !!opts.skip,
    };
    if (opts.skip) this.fails[this.id] = 0;
    this.showMenu(this.menuReturn === 'play' ? 'play' : 'main');
    this.game.minigameDone(res);
  }

  /* ---------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    const g = this.game;
    if (this.phase === 'menu') { this.updateMenu(); return; }
    if (this.phase === 'done') {
      const skip = this.skipReady();
      if (skip) {
        if (g.input.hit('KeyS')) { g.audio.sfx('ui'); this.commit({ skip: true }); return; }
        if (g.input.mouse.clicked && g.ui.hit(g.input.mouse.x, g.input.mouse.y) === 'mg:skip') {
          g.audio.sfx('ui');
          this.commit({ skip: true });
          return;
        }
      }
      if (g.input.hit('KeyE', 'Enter', 'Space', 'Escape')) { g.audio.sfx('ui'); this.commit(); return; }
      if (g.input.hit('KeyR')) { this.open(this.id, { chapterIndex: this.chapterIndex }); return; }
      return;
    }
    if (g.input.hit('Escape')) {
      g.audio.sfx('deny');
      if (this.chapterIndex != null) {
        const back = this.chapterIndex;
        this.showMenu(this.menuReturn);
        g.careerIndex = back;
        g.setScreen('career');
      } else {
        this.showMenu(this.menuReturn);
        g.setScreen(this.menuReturn === 'play' ? 'play' : 'minigames', true);
        g.ui.toast('Saiu do fliperama sem terminar.', C.dim, 2.4);
      }
      return;
    }
    if (this.id === 'pipa') this.updatePipa(dt);
    else if (this.id === 'surf') this.updateSurf(dt);
    else if (this.id === 'cobra') this.updateCobra(dt);
    else if (this.id === 'campo') this.updateCampo(dt);
    else this.updateBrick(dt);
  }

  updateMenu() {
    const g = this.game;
    const i = g.input;
    const n = MINIGAMES.length;
    if (i.hit('ArrowUp', 'KeyW')) { this.index = (this.index + n - 1) % n; g.audio.sfx('select'); }
    if (i.hit('ArrowDown', 'KeyS')) { this.index = (this.index + 1) % n; g.audio.sfx('select'); }
    for (let k = 0; k < n; k++) {
      if (i.hit('Digit' + (k + 1))) { this.index = k; this.open(MINIGAMES[k].id); return; }
    }
    if (i.hit('Enter', 'KeyE', 'Space')) { this.open(MINIGAMES[this.index].id); return; }
    if (i.hit('Escape')) { g.leaveMinigames(); return; }
    if (i.mouse.clicked) {
      const id = g.ui.hit(i.mouse.x, i.mouse.y);
      if (!id) return;
      if (id === 'mg:back') { g.leaveMinigames(); return; }
      if (id === 'mg:start') { this.open(MINIGAMES[this.index].id); return; }
      if (id.startsWith('mg:play:')) {
        const at = Number(id.split(':')[2]) || 0;
        this.index = at;
        this.open(MINIGAMES[at].id);
      }
    }
  }

  /* ------------------------------------------------------------- chrome */
  panel(ctx, x, y, w, h) {
    this.art.panel(ctx, x, y, w, h);
  }

  button(ctx, id, x, y, w, h, label, opts = {}) {
    const g = this.game;
    g.ui.rect(id, x, y, w, h);
    const hov = g.ui.hot(g, id) || opts.sel;
    this.panel(ctx, x, y, w, h);
    if (hov) {
      ctx.fillStyle = 'rgba(143,211,232,0.18)';
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.strokeStyle = C.gold;
      ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    }
    if (opts.accent) {
      ctx.fillStyle = opts.accent;
      ctx.fillRect(x, y, 3, h);
    }
    drawText(ctx, label, x + 10, y + Math.round((h - 7) / 2), {
      size: opts.size || 7, color: hov ? C.gold : C.cream,
      shadow: C.ink, weight: 'bold',
    });
    if (hov) {
      drawText(ctx, '\u25B6', x + w - 10, y + Math.round((h - 7) / 2), {
        size: 6, color: C.gold, align: 'right',
      });
    }
  }

  /* ------------------------------------------------------------------ draw */
  draw(ctx) {
    this.drawBackdrop(ctx);
    if (this.phase === 'menu') { this.drawMenu(ctx); this.drawFooter(ctx, 'SETAS escolhe · E joga · ESC volta'); return; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(PF.x, PF.y, PF.w, PF.h);
    ctx.clip();
    if (this.id === 'pipa') this.drawPipa(ctx);
    else if (this.id === 'surf') this.drawSurf(ctx);
    else if (this.id === 'cobra') this.drawCobra(ctx);
    else if (this.id === 'campo') this.drawCampo(ctx);
    else this.drawBrick(ctx);
    ctx.restore();
    this.drawFieldHeader(ctx);
    if (this.phase === 'done') this.drawDone(ctx);
    else this.drawFooter(ctx, this.def.controls + '  ·  ESC sai');
  }

  drawBackdrop(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
    g.addColorStop(0, '#123252');
    g.addColorStop(0.55, '#0a1a2e');
    g.addColorStop(1, '#061020');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    // slow clouds from the skyblock atlas, washed out behind the panel
    for (let k = 0; k < 4; k++) {
      const name = ['cloud_big0', 'cloud_mid0', 'cloud_small0', 'cloud_big1'][k];
      const w = 150 + k * 40;
      const x = ((k * 211 + this.t * (4 + k * 2)) % (VIEW.W + w)) - w / 2;
      this.art.drawAtlas(ctx, name, x, 40 + k * 54, { anchor: 'center', alpha: 0.10 });
    }
  }

  drawMenu(ctx) {
    const g = this.game;
    const art = this.art;

    this.panel(ctx, 14, 8, 612, 40);
    drawText(ctx, 'MINIGAMES', 26, 14, {
      size: 20, color: C.cream, shadow: C.ink, weight: 'bold',
    });
    drawText(ctx, 'COUNTER-STRIKE 1.6 · LAN HOUSE EDITION', 614, 15, {
      size: 5, color: C.blue, align: 'right',
    });
    drawText(ctx, 'build 4554 · protocolo 48 · 1/32 jogadores', 614, 26, {
      size: 4, color: C.dim, align: 'right',
    });
    drawText(ctx, 'GOLDMINE', 614, 36, { size: 4, color: C.rose, align: 'right' });

    // left column: the server list
    this.panel(ctx, 14, 54, 250, 160);
    drawText(ctx, 'ESCOLHA O SERVIDOR', 24, 59, { size: 5, color: C.blue });
    MINIGAMES.forEach((m, i) => {
      this.button(ctx, 'mg:play:' + i, 20, 68 + i * 27, 238, 24,
        `${i + 1}. ${m.title}`, { sel: i === this.index, accent: m.color, size: 6 });
    });

    // records, with the game's own trophy
    this.panel(ctx, 14, 218, 250, 90);
    art.icon(ctx, 'trophy', 28, 226, 0.6);
    drawText(ctx, 'RECORDES DA LAN', 40, 223, { size: 5, color: C.gold });
    MINIGAMES.forEach((m, i) => {
      const rec = g.save.minigames?.[m.id] || {};
      const y = 236 + i * 13;
      drawText(ctx, m.short, 24, y, { size: 5, color: i === this.index ? C.gold : C.dim });
      drawText(ctx, rec.best ? `${rec.best}` : '---', 206, y, {
        size: 5, color: rec.best ? C.cream : '#5a6273', align: 'right',
      });
      drawText(ctx, `${rec.wins || 0}x`, 254, y, {
        size: 5, color: rec.wins ? C.green : '#48506a', align: 'right',
      });
    });

    // detail panel
    const m = MINIGAMES[this.index];
    this.panel(ctx, 274, 54, 352, 254);
    drawText(ctx, m.title, 288, 62, { size: 13, color: C.gold, shadow: C.ink, weight: 'bold' });
    drawText(ctx, m.tag, 614, 65, { size: 5, color: C.blue, align: 'right' });
    ctx.fillStyle = 'rgba(143,211,232,0.18)';
    ctx.fillRect(288, 80, 324, 1);

    const px = 288, py = 88, pw = 324, ph = 96;
    ctx.fillStyle = '#081424';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#35519c';
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    this.drawPreview(ctx, m.id, px, py, pw, ph);

    wrapText(ctx, m.blurb, 318, 6).slice(0, 3).forEach((ln, k) => {
      drawText(ctx, ln, 288, 192 + k * 9, { size: 6, color: C.cream });
    });
    drawText(ctx, 'CONTROLES', 288, 222, { size: 5, color: C.dim });
    drawText(ctx, m.controls, 288, 231, { size: 6, color: C.cream });
    drawText(ctx, 'META', 288, 244, { size: 5, color: C.dim });
    drawText(ctx, m.goal, 288, 253, { size: 6, color: C.cream });
    const rec = g.save.minigames?.[m.id] || {};
    drawText(ctx, `RECORDE ${rec.best || '---'} · VITÓRIAS ${rec.wins || 0}`, 614, 244, {
      size: 5, color: C.blue, align: 'right',
    });
    drawText(ctx, `JOGADAS ${rec.plays || 0}`, 614, 253, {
      size: 5, color: C.dim, align: 'right',
    });

    this.button(ctx, 'mg:start', 288, 268, 200, 26, 'JOGAR \u25B6', { accent: m.color, size: 8 });
    this.button(ctx, 'mg:back', 496, 268, 116, 26, 'VOLTAR', { size: 7 });
  }

  /** small dioramas built from the same atlas frames the maps use */
  drawPreview(ctx, id, x, y, w, h) {
    const art = this.art;
    const cx = x + w / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#16324f');
    sky.addColorStop(1, id === 'pipa' ? '#b57f5c' : '#0b2038');
    ctx.fillStyle = sky;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    if (id === 'pipa') {
      art.drawAtlas(ctx, 'cloud_mid1', x + 60, y + 34, { anchor: 'center', alpha: 0.8 });
      art.drawAtlas(ctx, 'cloud_small0', x + 210, y + 24, { anchor: 'center', alpha: 0.6 });
      art.drawAtlas(ctx, 'farisle0', x + 268, y + 78, { anchor: 'bottom', alpha: 0.5 });
      for (let k = 0; k < 7; k++) {
        art.drawIsoTile(ctx, k % 2 ? 'stone' : 'cork', x + 12 + k * 46, y + 76);
      }
      art.drawZel(ctx, x + 54, y + 92, 'down', this.t * 5, 'zel', { scale: 0.11 });
      art.drawAny(ctx, 'lantern', x + 22, y + 88, { scale: 0.6 });
      art.drawAny(ctx, 'chair', x + 250, y + 92, { scale: 0.7 });
      ctx.strokeStyle = 'rgba(251,238,200,0.6)';
      ctx.beginPath();
      ctx.moveTo(x + 54, y + 74);
      ctx.lineTo(cx - 12, y + 24);
      ctx.stroke();
      this.drawKite(ctx, cx - 12, y + 24, 12, C.green, { hot: true, t: this.t });
      ctx.strokeStyle = 'rgba(251,238,200,0.35)';
      ctx.beginPath();
      ctx.moveTo(x + 268, y + 74);
      ctx.lineTo(cx + 66, y + 34);
      ctx.stroke();
      this.drawKite(ctx, cx + 66, y + 34, 10, C.rose, { t: this.t + 1 });
    } else if (id === 'surf') {
      for (let k = 0; k < 8; k++) {
        art.drawSurf(ctx, 'deck' + (k % 4), x + 30 + k * 34, y + 30 + k * 8, { anchor: 'center' });
      }
      art.drawSurf(ctx, 'rail', x + 24, y + 36, { anchor: 'center', scale: 0.9 });
      art.drawZel(ctx, x + 112, y + 58, 'down', this.t * 6, 'zel', { scale: 0.11, rot: 0.14 });
      art.drawSurf(ctx, 'gate', x + 286, y + 74, { anchor: 'center', scale: 0.7 });
      art.drawSurf(ctx, 'buoy_yel', x + 246, y + 86, { anchor: 'center', scale: 0.5 });
    } else if (id === 'cobra') {
      for (let d = 0; d < 7; d++) {
        for (let gx = 0; gx <= d && gx < 5; gx++) {
          const gy = d - gx;
          if (gy > 4) continue;
          art.drawIsoTile(ctx, 'grass', cx - 120 + (gx - gy) * 24, y + 26 + (gx + gy) * 12);
        }
      }
      art.drawIsoTile(ctx, 'pool', cx - 120 + 24, y + 74);
      art.drawIsoTile(ctx, 'ice', cx - 120, y + 86);
      art.drawAtlas(ctx, 'ic_berry', cx + 24, y + 60, { anchor: 'center' });
      art.drawAtlas(ctx, 'ic_berry', cx + 72, y + 80, { anchor: 'center' });
    } else if (id === 'campo') {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          art.drawAtlas(ctx, 'slot', cx - 72 + c * 24, y + 22 + r * 24, { anchor: 'topleft' });
        }
      }
      art.drawSurf(ctx, 'ic_shark', cx - 44, y + 34, { anchor: 'center' });
      art.drawAtlas(ctx, 'ic_berry', cx + 28, y + 58, { anchor: 'center', alpha: 0.85 });
      art.drawSurf(ctx, 'buoy_red', cx - 20, y + 58, { anchor: 'center', scale: 0.4 });
    } else {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          art.drawSurf(ctx, 'deck' + ((r + c) % 4), x + 46 + c * 40, y + 22 + r * 18, { anchor: 'center' });
        }
      }
      art.drawSurf(ctx, 'deck1', cx, y + 86, { anchor: 'center', scale: 1.2 });
      art.drawAtlas(ctx, 'ic_orb', cx + 24, y + 56, { anchor: 'center' });
      art.drawSurf(ctx, 'floodlight', x + 24, y + 92, { scale: 0.6 });
    }
    ctx.restore();
  }

  drawFieldHeader(ctx) {
    const d = this.def;
    ctx.fillStyle = 'rgba(6,14,30,0.88)';
    ctx.fillRect(PF.x, PF.y, PF.w, 18);
    ctx.fillStyle = d.color;
    ctx.fillRect(PF.x, PF.y, 3, 18);
    drawText(ctx, d.title, PF.x + 10, PF.y + 5, { size: 6, color: C.cream });
    drawText(ctx, d.tag, PF.x + PF.w - 10, PF.y + 6, {
      size: 4, color: C.dim, align: 'right',
    });
  }

  drawFooter(ctx, hint) {
    this.panel(ctx, 14, 320, 612, 20);
    drawText(ctx, hint, 24, 325, { size: 5, color: C.cream });
    drawText(ctx, 'SURFN 2000 · FLIPERAMA DA LAN', 614, 325, {
      size: 4, color: C.dim, align: 'right',
    });
  }

  drawDone(ctx) {
    const res = this.result;
    const w = 340, h = 148;
    const x = PF.x + Math.round((PF.w - w) / 2);
    const y = PF.y + Math.round((PF.h - h) / 2) - 6;
    ctx.fillStyle = 'rgba(6,12,26,0.72)';
    ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    this.panel(ctx, x, y, w, h);
    drawText(ctx, res.won ? 'VOCÊ VENCEU' : 'GAME OVER', x + w / 2, y + 12, {
      size: 15, color: res.won ? C.gold : C.rose, align: 'center', weight: 'bold', shadow: C.ink,
    });
    drawText(ctx, this.def.title, x + w / 2, y + 32, {
      size: 6, color: C.blue, align: 'center',
    });
    drawText(ctx, `${res.score}`, x + w / 2, y + 46, {
      size: 22, color: C.cream, align: 'center', weight: 'bold',
    });
    drawText(ctx, 'PONTOS', x + w / 2, y + 70, { size: 4, color: C.dim, align: 'center' });
    const rec = this.game.save.minigames?.[this.id] || {};
    drawText(ctx, `RECORDE ${Math.max(rec.best || 0, res.score)}`, x + w / 2, y + 80, {
      size: 5, color: C.blue, align: 'center',
    });
    if (this.chapterIndex != null) {
      drawText(ctx, res.won ? 'PROVA DO CAPÍTULO VENCIDA' : 'A PROVA DO CAPÍTULO AINDA ESTÁ ABERTA',
        x + w / 2, y + 94, {
          size: 5, color: res.won ? C.green : C.rose, align: 'center',
        });
      if (!res.won) {
        drawText(ctx, `FALHAS ${this.fails[this.id] || 0}/${SKIP_AFTER}`, x + w - 14, y + 94, {
          size: 4, color: C.dim, align: 'right',
        });
      }
    }
    if (this.skipReady()) {
      this.button(ctx, 'mg:skip', x + 18, y + 104, w - 36, 22,
        'PULAR A PROVA  ·  S', { accent: C.blue, size: 6 });
      drawText(ctx, 'S pula sem XP, sem recorde e sem bônus', x + w / 2, y + 131, {
        size: 4, color: C.dim, align: 'center',
      });
    } else {
      drawText(ctx, 'E continua  ·  R de novo', x + w / 2, y + 116, {
        size: 6, color: C.gold, align: 'center', weight: 'bold',
      });
    }
  }

  /** kite body, tail and cross sticks — the one shape the atlas has no sprite for */
  drawKite(ctx, x, y, size, color, opts = {}) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate((opts.tilt || 0) + Math.sin((opts.t || 0) * 2.2) * 0.12);
    // paper body
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.74, 0);
    ctx.lineTo(0, size * 0.92);
    ctx.lineTo(-size * 0.74, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = opts.hot ? C.white : 'rgba(27,23,40,0.85)';
    ctx.lineWidth = opts.hot ? 1.6 : 1;
    ctx.stroke();
    // bamboo cross
    ctx.strokeStyle = 'rgba(27,23,40,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size); ctx.lineTo(0, size * 0.92);
    ctx.moveTo(-size * 0.74, 0); ctx.lineTo(size * 0.74, 0);
    ctx.stroke();
    // tail
    ctx.strokeStyle = 'rgba(251,238,200,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.92);
    ctx.quadraticCurveTo(size * 0.3, size * 1.5, size * 0.1, size * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* ============================================================ PIPA ==== */
  createPipa() {
    const ground = PF.y + PF.h - 46;
    const anchors = [0.12, 0.38, 0.78];
    return {
      x: PF.x + PF.w * 0.5, y: PF.y + 90, vx: 0, vy: 0,
      lines: 4, maxLines: 4, cuts: 0, need: 4,
      pen: 0, t: 0, hitT: 0, flash: 0, shake: 0,
      ground,
      ax: PF.x + PF.w * 0.5,
      rivals: anchors.map((a, i) => this.newKite(i, PF.x + PF.w * a)),
      parts: [],
      clouds: Array.from({ length: 7 }, (_, i) => ({
        x: rand(0, PF.w), y: rand(20, 130), k: i % 3, s: 0.5 + (i % 4) * 0.2, sp: 3 + i,
      })),
      birds: Array.from({ length: 3 }, (_, i) => ({
        x: rand(0, PF.w), y: rand(30, 90), ph: rand(0, 6), sp: 12 + i * 5,
      })),
    };
  }

  newKite(i, ax) {
    return {
      ax, x: ax + rand(-30, 30), y: PF.y + rand(40, 120),
      ph: rand(0, 6.28), sp: rand(0.8, 1.4), alive: true, resp: 0.9,
      atk: rand(3, 6), dive: 0, color: RIVAL_KITE_COLORS[i % RIVAL_KITE_COLORS.length],
    };
  }

  updatePipa(dt) {
    const s = this.s;
    const i = this.game.input;
    s.t += dt;
    const dx = (i.down('KeyD', 'ArrowRight') ? 1 : 0) - (i.down('KeyA', 'ArrowLeft') ? 1 : 0);
    const dy = (i.down('KeyS', 'ArrowDown') ? 1 : 0) - (i.down('KeyW', 'ArrowUp') ? 1 : 0);
    const pull = i.down('Space', 'ShiftLeft');
    s.pen = clamp(s.pen + (pull ? 1.9 : -0.6) * dt, 0, 1);
    s.vx += (dx * 620 + Math.sin(s.t * 0.8) * 34) * dt;
    s.vy += (dy * 620 + Math.cos(s.t * 0.6) * 18) * dt;
    s.vx *= 1 - 2.4 * dt;
    s.vy *= 1 - 2.4 * dt;
    s.x = clamp(s.x + s.vx * dt, PF.x + 16, PF.x + PF.w - 16);
    s.y = clamp(s.y + s.vy * dt, PF.y + 26, s.ground - 34);
    s.hitT = Math.max(0, s.hitT - dt);
    s.flash = Math.max(0, s.flash - dt);
    s.shake = Math.max(0, s.shake - dt * 22);

    for (const c of s.clouds) {
      c.x += c.sp * dt;
      if (c.x > PF.w + 80) c.x = -80;
    }
    for (const b of s.birds) {
      b.x += b.sp * dt;
      if (b.x > PF.w + 20) b.x = -20;
    }

    for (let k = 0; k < s.rivals.length; k++) {
      const r = s.rivals[k];
      if (!r.alive) {
        r.resp -= dt;
        if (r.resp <= 0) {
          const fresh = this.newKite(k, r.ax);
          Object.assign(r, fresh, { resp: 0 });
        }
        continue;
      }
      r.ph += dt * r.sp;
      r.atk -= dt;
      if (r.atk <= 0 && r.dive <= 0) { r.dive = 1.3; r.atk = rand(6.5, 9.5); }
      if (r.dive > 0) {
        r.dive -= dt;
        r.x += (s.x - r.x) * dt * 1.3;
        r.y += (s.y + 26 - r.y) * dt * 1.2;
        if (r.dive <= 0) r.atk = rand(7, 10);
      } else {
        r.x = r.ax + Math.sin(r.ph) * 44 + Math.cos(r.ph * 0.63) * 12;
        r.y = PF.y + 68 + Math.sin(r.ph * 1.7 + k) * 44;
      }
      const crossed = segCross(s.ax, s.ground, s.x, s.y, r.ax, s.ground, r.x, r.y);
      if (!crossed) continue;
      if (r.dive > 0) {
        s.lines--;
        s.flash = 0.5;
        s.shake = 4;
        s.hitT = 0.6;
        r.dive = 0;
        r.atk = 3.5;
        this.game.audio.sfx('deny');
        s.parts.push({ x: s.x, y: s.y, t: 0.5, max: 0.5, txt: 'LINHA CORTADA' });
        if (s.lines <= 0) { this.finish(false, s.cuts * 140); return; }
      } else if (s.pen > 0.1 || Math.hypot(s.vx, s.vy) > 30) {
        r.alive = false;
        r.resp = rand(1.4, 2.6);
        r.dive = 0;
        s.cuts++;
        s.pen = Math.max(0, s.pen - 0.45);
        s.hitT = 0.4;
        this.game.audio.sfx('chopped');
        s.parts.push({ x: r.x, y: r.y, t: 0.8, max: 0.8, txt: 'CORTEI!' });
        if (s.cuts >= s.need) { this.finish(true, 600 + s.lines * 320 + s.cuts * 140); return; }
      }
    }
    for (let k = s.parts.length - 1; k >= 0; k--) {
      s.parts[k].t -= dt;
      if (s.parts[k].t <= 0) s.parts.splice(k, 1);
    }
  }

  drawPipa(ctx) {
    const s = this.s;
    const art = this.art;
    const ox = s.shake ? rand(-s.shake, s.shake) : 0;
    ctx.save();
    ctx.translate(ox, 0);

    const sky = ctx.createLinearGradient(0, PF.y, 0, s.ground);
    sky.addColorStop(0, '#14213a');
    sky.addColorStop(0.45, '#3f6a86');
    sky.addColorStop(0.8, '#b57f5c');
    sky.addColorStop(1, '#d9a473');
    ctx.fillStyle = sky;
    ctx.fillRect(PF.x - 8, PF.y - 8, PF.w + 16, PF.h + 16);

    // far islands and clouds are the skyblock atlas frames
    art.drawAtlas(ctx, 'farisle0', PF.x + 120, s.ground + 2, { anchor: 'bottom', alpha: 0.35 });
    art.drawAtlas(ctx, 'farisle1', PF.x + 420, s.ground + 2, { anchor: 'bottom', alpha: 0.28 });
    for (const c of s.clouds) {
      const name = ['cloud_big1', 'cloud_mid1', 'cloud_small1'][c.k];
      art.drawAtlas(ctx, name, PF.x + c.x, PF.y + c.y, { anchor: 'center', alpha: 0.32 });
    }
    for (const b of s.birds) {
      art.drawAtlas(ctx, 'bird' + (Math.floor(b.ph) % 2), PF.x + b.x,
        PF.y + b.y + Math.sin(s.t * 2 + b.ph) * 4, { anchor: 'center', scale: 0.8 });
    }

    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,120,90,${s.flash * 0.35})`;
      ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    }

    // strings
    for (const r of s.rivals) {
      if (!r.alive) continue;
      ctx.strokeStyle = r.dive > 0 ? 'rgba(255,140,110,0.9)' : 'rgba(251,238,200,0.5)';
      ctx.lineWidth = r.dive > 0 ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(r.ax, s.ground);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
    }
    ctx.strokeStyle = s.pen > 0.18 ? 'rgba(255,235,150,0.95)' : 'rgba(251,238,200,0.65)';
    ctx.lineWidth = s.pen > 0.18 ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(s.ax, s.ground);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();

    // the laje: iso floor tiles from the atlas, then the building below
    for (let x = PF.x - 24; x < PF.x + PF.w + 24; x += 48) {
      art.drawIsoTile(ctx, 'stone', x, s.ground);
    }
    ctx.fillStyle = '#121a2a';
    ctx.fillRect(PF.x - 8, s.ground + 12, PF.w + 16, PF.h);
    for (let x = PF.x + 6; x < PF.x + PF.w; x += 48) {
      ctx.fillStyle = 'rgba(143,211,232,0.10)';
      ctx.fillRect(x, s.ground + 18, 2, 60);
    }
    // furniture + the kid flying the kite
    art.drawAny(ctx, 'fence_h', PF.x + 40, s.ground + 4, { scale: 0.8 });
    art.drawAny(ctx, 'fence_h', PF.x + 92, s.ground + 4, { scale: 0.8 });
    art.drawAny(ctx, 'lantern', PF.x + PF.w - 34, s.ground + 6, { scale: 0.7 });
    art.drawAny(ctx, 'chair', PF.x + 26, s.ground + 8, { scale: 0.8 });
    art.drawAny(ctx, 'umbrella', PF.x + PF.w - 108, s.ground + 12, { scale: 0.75 });
    art.drawZel(ctx, s.ax, s.ground + 14, 'down', s.t * 4, 'zel', { scale: 0.12 });

    for (const r of s.rivals) {
      if (!r.alive) continue;
      this.drawKite(ctx, r.x, r.y, 12, r.color, {
        t: s.t + r.ph, tilt: r.dive > 0 ? 0.4 : 0,
      });
    }
    this.drawKite(ctx, s.x, s.y, 14, C.green, { hot: true, t: s.t, tilt: s.vx * 0.004 });

    for (const p of s.parts) {
      drawText(ctx, p.txt, p.x, p.y - (1 - p.t / p.max) * 22, {
        size: 8, color: C.white, align: 'center', shadow: C.ink, weight: 'bold',
      });
    }
    ctx.restore();

    drawText(ctx, `PIPAS ${s.cuts}/${s.need}`, PF.x + 14, PF.y + 22, {
      size: 7, color: C.white, shadow: C.ink,
    });
    drawText(ctx, 'LINHAS', PF.x + PF.w - 14, PF.y + 23, { size: 5, color: C.dim, align: 'right' });
    for (let k = 0; k < s.maxLines; k++) {
      ctx.fillStyle = k < s.lines ? C.rose : 'rgba(90,98,115,0.6)';
      ctx.fillRect(PF.x + PF.w - s.maxLines * 16 + k * 16, PF.y + 31, 12, 3);
    }
    ctx.fillStyle = 'rgba(6,14,30,0.7)';
    ctx.fillRect(PF.x + 14, PF.y + 33, 84, 5);
    ctx.fillStyle = s.pen > 0.18 ? C.gold : C.green;
    ctx.fillRect(PF.x + 14, PF.y + 33, 84 * s.pen, 5);
    drawText(ctx, s.pen > 0.18 ? 'CEROL NO PONTO' : 'PUXE ESPAÇO', PF.x + 104, PF.y + 32, {
      size: 4, color: s.pen > 0.18 ? C.gold : C.dim,
    });
  }

  /* ============================================================ SURF ==== */
  createSurf() {
    const ramps = [
      { x0: 0, y0: 64, x1: 300, y1: 178 },
      { x0: 340, y0: 190, x1: 620, y1: 110 },
      { x0: 660, y0: 122, x1: 940, y1: 206 },
      { x0: 980, y0: 218, x1: 1260, y1: 120 },
      { x0: 1300, y0: 132, x1: 1580, y1: 214 },
      { x0: 1620, y0: 226, x1: 1900, y1: 110 },
      { x0: 1940, y0: 122, x1: 2200, y1: 220 },
    ];
    return {
      ramps, x: 6, y: 64, vy: 0, speed: 190, onRamp: true, jumpT: 0, grace: 1.2,
      cp: { x: 6, y: 64 }, falls: 0, t: 0, time: 0, finishX: 2200, cam: 0,
      landT: 0, dust: [],
    };
  }

  surfSurface(x) {
    for (const r of this.s.ramps) {
      if (x < r.x0 || x > r.x1) continue;
      const k = (x - r.x0) / (r.x1 - r.x0);
      return r.y0 + (r.y1 - r.y0) * k;
    }
    return null;
  }

  updateSurf(dt) {
    const s = this.s;
    const i = this.game.input;
    s.t += dt;
    s.time += dt;
    s.speed = clamp(s.speed + 22 * dt, 170, 430);
    s.x += s.speed * dt;
    s.jumpT = Math.max(0, s.jumpT - dt);
    s.landT = Math.max(0, s.landT - dt);
    s.grace = Math.max(0, s.grace - dt);

    const hold = i.down('KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight') || s.grace > 0;
    const surface = this.surfSurface(s.x);
    if (i.hit('Space') && s.onRamp) {
      s.vy = -300;
      s.jumpT = 0.3;
      s.onRamp = false;
      this.game.audio.sfx('jump');
    }
    if (hold && s.jumpT <= 0 && surface != null && s.y >= surface - 46 && s.y <= surface + 36) {
      if (!s.onRamp) { s.landT = 0.18; this.game.audio.sfx('land'); }
      s.y = surface;
      s.vy = 0;
      s.onRamp = true;
      s.speed = clamp(s.speed + 30 * dt, 170, 440);
      if (s.x > s.cp.x + 24) s.cp = { x: s.x, y: s.y };
    } else {
      s.onRamp = false;
      s.vy += 680 * dt;
      s.y += s.vy * dt;
    }
    for (let k = s.dust.length - 1; k >= 0; k--) {
      const d = s.dust[k];
      d.t -= dt;
      d.x -= s.speed * dt * 0.4;
      if (d.t <= 0) s.dust.splice(k, 1);
    }
    if (s.onRamp && Math.random() < 0.4) s.dust.push({ x: s.x, y: s.y, t: 0.3 });
    if (s.y > PF.h - 6) {
      s.falls++;
      s.x = s.cp.x;
      s.y = s.cp.y - 10;
      s.vy = 0;
      s.speed = 180;
      s.onRamp = false;
      s.jumpT = 0.15;
      s.grace = 1.2;
      this.game.audio.sfx('fall');
    }
    if (s.x >= s.finishX) {
      const bonus = clamp(2600 - s.time * 38 - s.falls * 90, 300, 2600);
      this.finish(true, Math.round(bonus));
      return;
    }
    s.cam = clamp(s.x - 210, 0, 2300 - PF.w);
  }

  drawSurf(ctx) {
    const s = this.s;
    const art = this.art;
    const sea = this.game.sea;

    // the game's own sky + horizon, clipped to the minigame field
    sea.drawBackdrop(ctx, this.game.titleTheme, { foreground: false });
    const haze = ctx.createLinearGradient(0, PF.y, 0, PF.y + PF.h);
    haze.addColorStop(0, 'rgba(6,14,30,0.45)');
    haze.addColorStop(0.7, 'rgba(6,14,30,0.05)');
    haze.addColorStop(1, 'rgba(6,14,30,0.55)');
    ctx.fillStyle = haze;
    ctx.fillRect(PF.x, PF.y, PF.w, PF.h);

    const toS = (wx, wy) => ({ x: PF.x + wx - s.cam, y: PF.y + wy });

    for (const r of s.ramps) {
      const a = toS(r.x0, r.y0);
      const b = toS(r.x1, r.y1);
      if (b.x < PF.x - 60 || a.x > PF.x + PF.w + 60) continue;
      // shadow under the ramp
      ctx.fillStyle = 'rgba(6,12,24,0.45)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 8);
      ctx.lineTo(b.x, b.y + 8);
      ctx.lineTo(b.x, b.y + 30);
      ctx.lineTo(a.x, a.y + 30);
      ctx.closePath();
      ctx.fill();
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.round(len / 38));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        art.drawSurf(ctx, 'deck' + (k % 4),
          a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + 10,
          { anchor: 'center', scale: 0.95 });
      }
      art.drawSurf(ctx, 'rail', a.x, a.y + 4, { anchor: 'center', scale: 0.8 });
      art.drawSurf(ctx, 'rail', b.x, b.y + 4, { anchor: 'center', scale: 0.8 });
    }

    // finish gate + buoys in the gap
    const fx = PF.x + s.finishX - s.cam;
    if (fx > PF.x - 40 && fx < PF.x + PF.w + 40) {
      art.drawSurf(ctx, 'gate', fx, PF.y + 168, { anchor: 'center', scale: 1 });
      art.drawSurf(ctx, 'buoy_red', fx - 44, PF.y + 210, { anchor: 'center', scale: 0.6 });
      art.drawSurf(ctx, 'buoy_yel', fx + 44, PF.y + 210, { anchor: 'center', scale: 0.6 });
    }
    for (const r of s.ramps) {
      const mid = toS((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
      if (mid.x < PF.x - 30 || mid.x > PF.x + PF.w + 30) continue;
      if (r === s.ramps[0]) continue;
      art.drawSurf(ctx, 'buoy_blu', mid.x, mid.y - 26, { anchor: 'center', scale: 0.45 });
    }

    for (const d of s.dust) {
      const p = toS(d.x, d.y);
      ctx.fillStyle = `rgba(200,220,235,${d.t * 1.4})`;
      ctx.fillRect(p.x - 2, p.y - 2, 3, 3);
    }

    const px = PF.x + s.x - s.cam;
    const py = PF.y + s.y;
    const s1 = this.surfSurface(s.x + 6);
    const s0 = this.surfSurface(s.x - 6);
    const tilt = s1 != null && s0 != null ? Math.atan((s1 - s0) / 12) * 0.35 : 0;
    art.drawZel(ctx, px, py + 4, 'down', s.t * 9, 'zel', {
      scale: 0.14, rot: s.onRamp ? tilt : -0.12,
    });

    // progress
    const bw = PF.w - 24;
    ctx.fillStyle = 'rgba(6,14,30,0.75)';
    ctx.fillRect(PF.x + 12, PF.y + PF.h - 12, bw, 4);
    ctx.fillStyle = C.blue;
    ctx.fillRect(PF.x + 12, PF.y + PF.h - 12, bw * clamp(s.x / s.finishX, 0, 1), 4);
    drawText(ctx, `${Math.round(clamp(s.x / s.finishX, 0, 1) * 100)}%`, PF.x + 12, PF.y + PF.h - 24, {
      size: 5, color: C.dim,
    });
    drawText(ctx, `${s.falls} QUEDAS`, PF.x + PF.w - 12, PF.y + PF.h - 24, {
      size: 5, color: s.falls ? C.rose : C.dim, align: 'right',
    });
    drawText(ctx, `${s.time.toFixed(1)}s`, PF.x + PF.w / 2, PF.y + PF.h - 24, {
      size: 5, color: C.cream, align: 'center',
    });
    if (!s.onRamp && s.jumpT <= 0) {
      drawText(ctx, 'SEGURE A OU D PRA GRUDAR', PF.x + PF.w / 2, PF.y + 26, {
        size: 6, color: C.gold, align: 'center', shadow: C.ink,
      });
    }
  }

  /* =========================================================== COBRA ==== */
  createCobra() {
    const cols = 13, rows = 7;
    const s = {
      cols, rows, tw: 48, th: 24,
      ox: PF.x + Math.round((PF.w - (cols + rows) * 24) / 2) + rows * 24,
      oy: PF.y + 18 + Math.round((PF.h - 18 - (cols + rows) * 12) / 2),
      snake: [{ x: 6, y: 3 }, { x: 5, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 3 }],
      dir: { x: 1, y: 0 }, next: { x: 1, y: 0 },
      food: { x: 9, y: 3 }, score: 0, need: 8,
      tick: 0.19, t: 0, dead: false, ate: 0,
    };
    this.placeFood(s);
    return s;
  }

  /** iso projection of a grid cell, top-left of its 48x24 diamond */
  cobraCell(s, gx, gy) {
    return { x: s.ox + (gx - gy) * 24, y: s.oy + (gx + gy) * 12 };
  }

  placeFood(s) {
    const free = [];
    for (let y = 0; y < s.rows; y++) {
      for (let x = 0; x < s.cols; x++) {
        if (!s.snake.some((p) => p.x === x && p.y === y)) free.push({ x, y });
      }
    }
    s.food = free.length ? free[Math.floor(Math.random() * free.length)] : { x: 0, y: 0 };
  }

  updateCobra(dt) {
    const s = this.s;
    const i = this.game.input;
    s.t += dt;
    s.ate = Math.max(0, s.ate - dt);
    if (!s.dead) {
      const tryDir = (x, y) => {
        if (x === -s.dir.x && y === -s.dir.y) return;
        s.next = { x, y };
      };
      if (i.hit('ArrowUp', 'KeyW')) tryDir(0, -1);
      if (i.hit('ArrowDown', 'KeyS')) tryDir(0, 1);
      if (i.hit('ArrowLeft', 'KeyA')) tryDir(-1, 0);
      if (i.hit('ArrowRight', 'KeyD')) tryDir(1, 0);
    }
    s.tick -= dt;
    if (s.tick > 0 || s.dead) return;
    s.tick = 0.19 - Math.min(0.05, s.score * 0.005);
    s.dir = { ...s.next };
    const head = {
      x: (s.snake[0].x + s.dir.x + s.cols) % s.cols,
      y: (s.snake[0].y + s.dir.y + s.rows) % s.rows,
    };
    const ate = head.x === s.food.x && head.y === s.food.y;
    const body = ate ? s.snake : s.snake.slice(0, -1);
    if (body.some((p) => p.x === head.x && p.y === head.y)) {
      this.finish(false, s.score * 140);
      return;
    }
    s.snake.unshift(head);
    if (!ate) s.snake.pop();
    else {
      s.score++;
      s.ate = 0.35;
      this.game.audio.sfx('pickup');
      if (s.score >= s.need) { this.finish(true, 500 + s.score * 90); return; }
      this.placeFood(s);
    }
  }

  drawCobra(ctx) {
    const s = this.s;
    const art = this.art;
    ctx.fillStyle = '#08131f';
    ctx.fillRect(PF.x, PF.y, PF.w, PF.h);

    // the board is a real island floor: grass tiles straight from the iso atlas
    for (let d = 0; d <= (s.cols - 1) + (s.rows - 1); d++) {
      for (let x = 0; x < s.cols; x++) {
        const y = d - x;
        if (y < 0 || y >= s.rows) continue;
        const p = this.cobraCell(s, x, y);
        art.drawIsoTile(ctx, 'grass', p.x, p.y);
      }
    }
    // snake body as pool tiles, head as ice
    for (let k = s.snake.length - 1; k >= 0; k--) {
      const p = this.cobraCell(s, s.snake[k].x, s.snake[k].y);
      art.drawIsoTile(ctx, k === 0 ? 'ice' : 'pool', p.x, p.y);
    }
    const fp = this.cobraCell(s, s.food.x, s.food.y);
    const bob = Math.sin(s.t * 4) * 2;
    art.drawAtlas(ctx, 'ic_berry', fp.x + 24, fp.y + 10 + bob, {
      anchor: 'center', scale: 1.1 + (s.ate > 0 ? s.ate * 0.3 : 0),
    });

    // a couple of palms to make it feel like the archipelago
    art.drawHabboProp(ctx, 'palm', s.ox - 26, s.oy + 40, { scale: 0.3 });
    art.drawHabboProp(ctx, 'palm', s.ox + (s.cols + 1) * 24, s.oy + (s.rows - 1) * 12, { scale: 0.24 });

    drawText(ctx, `${s.score}/${s.need}`, PF.x + 14, PF.y + 24, {
      size: 8, color: C.gold, shadow: C.ink,
    });
    drawText(ctx, 'FRUTAS', PF.x + 50, PF.y + 26, { size: 4, color: C.dim });
    drawText(ctx, 'PISO DO ARQUIPÉLAGO · MODO COBRINHA', PF.x + PF.w - 12, PF.y + 25, {
      size: 4, color: C.dim, align: 'right',
    });
  }

  /* =========================================================== CAMPO ==== */
  createCampo() {
    const n = 9, cell = 24, mines = 7;
    return {
      n, cell, mines,
      ox: PF.x + Math.round((PF.w - n * cell) / 2),
      oy: PF.y + 34,
      cells: Array.from({ length: n * n }, () => ({
        mine: false, open: false, flag: false, near: 0,
      })),
      seeded: false, flags: 0, opened: 0, t: 0,
      flagMode: false, boom: -1, hover: -1,
    };
  }

  campoIndexAt(s, p) {
    const c = Math.floor((p.x - s.ox) / s.cell);
    const r = Math.floor((p.y - s.oy) / s.cell);
    if (c < 0 || r < 0 || c >= s.n || r >= s.n) return -1;
    return r * s.n + c;
  }

  campoSeed(s, safeIndex) {
    const safe = new Set([safeIndex]);
    const sr = Math.floor(safeIndex / s.n), sc = safeIndex % s.n;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = sr + dr, c = sc + dc;
        if (r >= 0 && c >= 0 && r < s.n && c < s.n) safe.add(r * s.n + c);
      }
    }
    let placed = 0;
    while (placed < s.mines) {
      const at = Math.floor(Math.random() * s.cells.length);
      if (s.cells[at].mine || safe.has(at)) continue;
      s.cells[at].mine = true;
      placed++;
    }
    for (let r = 0; r < s.n; r++) {
      for (let c = 0; c < s.n; c++) {
        let near = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= s.n || cc >= s.n) continue;
            if (s.cells[rr * s.n + cc].mine) near++;
          }
        }
        s.cells[r * s.n + c].near = near;
      }
    }
    s.seeded = true;
  }

  campoOpen(s, at) {
    if (at < 0 || s.cells[at].open || s.cells[at].flag) return;
    const stack = [at];
    while (stack.length) {
      const k = stack.pop();
      const cell = s.cells[k];
      if (cell.open || cell.flag) continue;
      if (cell.mine) {
        cell.open = true;
        s.boom = k;
        this.game.audio.sfx('mine');
        for (const c of s.cells) if (c.mine) c.open = true;
        this.finish(false, s.opened * 70);
        return;
      }
      cell.open = true;
      s.opened++;
      this.game.audio.sfx('chip');
      if (cell.near > 0) continue;
      const r = Math.floor(k / s.n), c = k % s.n;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= s.n || cc >= s.n) continue;
          const nk = rr * s.n + cc;
          if (!s.cells[nk].open) stack.push(nk);
        }
      }
    }
    if (s.opened >= s.n * s.n - s.mines) {
      this.finish(true, 900 + Math.round(clamp(1200 - s.t * 14, 0, 1200)));
    }
  }

  updateCampo(dt) {
    const s = this.s;
    const i = this.game.input;
    s.t += dt;
    s.hover = this.campoIndexAt(s, this.pointer());
    if (i.hit('KeyF')) {
      s.flagMode = !s.flagMode;
      this.game.audio.sfx('ui');
    }
    if (i.hit('KeyR')) {
      this.s = this.createCampo();
      this.game.audio.sfx('ui');
      return;
    }
    if (i.mouse.clicked && s.hover >= 0) {
      if (!s.seeded) this.campoSeed(s, s.hover);
      const cell = s.cells[s.hover];
      if (cell.open) return;
      if (s.flagMode) {
        cell.flag = !cell.flag;
        s.flags += cell.flag ? 1 : -1;
        this.game.audio.sfx('select');
      } else {
        this.campoOpen(s, s.hover);
      }
    }
  }

  drawCampo(ctx) {
    const s = this.s;
    const art = this.art;
    ctx.fillStyle = '#08131f';
    ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    drawText(ctx, `MINAS ${Math.max(0, s.mines - s.flags)}`, PF.x + 14, PF.y + 24, {
      size: 7, color: C.cream, shadow: C.ink,
    });
    drawText(ctx, s.flagMode ? 'MODO: BANDEIRA (F)' : 'MODO: ABRIR (F)', PF.x + PF.w / 2, PF.y + 25, {
      size: 5, color: s.flagMode ? C.gold : C.dim, align: 'center',
    });
    drawText(ctx, `${Math.floor(s.t)}s`, PF.x + PF.w - 14, PF.y + 24, {
      size: 7, color: C.cream, align: 'right',
    });

    const bw = s.n * s.cell;
    this.panel(ctx, s.ox - 8, s.oy - 8, bw + 16, bw + 16);
    const nums = ['', C.blue, C.green, C.rose, C.violet, C.gold];
    for (let k = 0; k < s.cells.length; k++) {
      const cell = s.cells[k];
      const r = Math.floor(k / s.n), c = k % s.n;
      const x = s.ox + c * s.cell, y = s.oy + r * s.cell;
      if (cell.open) {
        ctx.fillStyle = cell.mine ? 'rgba(255,90,95,0.22)' : 'rgba(6,14,30,0.72)';
        ctx.fillRect(x, y, s.cell, s.cell);
        if (cell.mine) {
          art.drawSurf(ctx, 'ic_shark', x + s.cell / 2, y + s.cell / 2, { anchor: 'center' });
          if (k === s.boom) {
            ctx.strokeStyle = C.gold;
            ctx.strokeRect(x + 1.5, y + 1.5, s.cell - 3, s.cell - 3);
          }
        } else if (cell.near > 0) {
          drawText(ctx, `${cell.near}`, x + s.cell / 2, y + 7, {
            size: 10, color: nums[cell.near], align: 'center', weight: 'bold',
          });
        }
        continue;
      }
      art.drawAtlas(ctx, k === s.hover ? 'slot_sel' : 'slot', x + 1, y + 1, { anchor: 'topleft' });
      if (cell.flag) art.drawSurf(ctx, 'buoy_red', x + s.cell / 2, y + s.cell / 2 + 2, {
        anchor: 'center', scale: 0.42,
      });
    }
  }

  /* =========================================================== BRICK ==== */
  createBrick() {
    const cols = 10, rows = 4, bw = 50, bh = 26;
    const ox = PF.x + Math.round((PF.w - cols * bw) / 2);
    const oy = PF.y + 44;
    const bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: ox + c * bw + bw / 2, y: oy + r * bh + bh / 2,
          w: bw - 4, h: bh - 4, row: r, col: c, alive: true,
        });
      }
    }
    return {
      bricks,
      paddle: { x: PF.x + PF.w / 2, w: 104, h: 18, y: PF.y + PF.h - 30 },
      ball: { x: PF.x + PF.w / 2, y: PF.y + PF.h - 64, vx: 120, vy: -150, r: 5 },
      lives: 5, score: 0, t: 0, serve: 0.7, left: bricks.length,
    };
  }

  resetBrickBall(s) {
    s.ball.x = s.paddle.x;
    s.ball.y = s.paddle.y - 22;
    s.ball.vx = rand(-90, 90);
    s.ball.vy = -165;
    s.serve = 0.7;
  }

  updateBrick(dt) {
    const s = this.s;
    const i = this.game.input;
    s.t += dt;
    const p = this.pointer();
    const mouseIn = p.x > PF.x && p.x < PF.x + PF.w && p.y > PF.y && p.y < PF.y + PF.h;
    if (mouseIn) s.paddle.x += (p.x - s.paddle.x) * clamp(dt * 16, 0, 1);
    const dx = (i.down('KeyD', 'ArrowRight') ? 1 : 0) - (i.down('KeyA', 'ArrowLeft') ? 1 : 0);
    s.paddle.x += dx * 320 * dt;
    s.paddle.x = clamp(s.paddle.x, PF.x + s.paddle.w / 2 + 2, PF.x + PF.w - s.paddle.w / 2 - 2);

    if (s.serve > 0) {
      s.serve -= dt;
      s.ball.x = s.paddle.x;
      s.ball.y = s.paddle.y - 22;
      return;
    }

    s.ball.x += s.ball.vx * dt;
    s.ball.y += s.ball.vy * dt;
    if (s.ball.x < PF.x + s.ball.r) { s.ball.x = PF.x + s.ball.r; s.ball.vx = Math.abs(s.ball.vx); }
    if (s.ball.x > PF.x + PF.w - s.ball.r) {
      s.ball.x = PF.x + PF.w - s.ball.r;
      s.ball.vx = -Math.abs(s.ball.vx);
    }
    if (s.ball.y < PF.y + 18 + s.ball.r) {
      s.ball.y = PF.y + 18 + s.ball.r;
      s.ball.vy = Math.abs(s.ball.vy);
      this.game.audio.sfx('chip');
    }
    const padTop = s.paddle.y;
    if (s.ball.vy > 0 &&
        s.ball.y + s.ball.r > padTop && s.ball.y - s.ball.r < padTop + s.paddle.h &&
        Math.abs(s.ball.x - s.paddle.x) < s.paddle.w / 2 + s.ball.r) {
      const off = (s.ball.x - s.paddle.x) / (s.paddle.w / 2);
      const ang = -Math.PI / 2 + off * 1.0;
      const sp = clamp(Math.hypot(s.ball.vx, s.ball.vy) + 4, 175, 285);
      s.ball.vx = Math.cos(ang) * sp;
      s.ball.vy = Math.sin(ang) * sp;
      s.ball.y = padTop - s.ball.r - 1;
      this.game.audio.sfx('mine');
    }
    for (const b of s.bricks) {
      if (!b.alive) continue;
      if (s.ball.x + s.ball.r < b.x - b.w / 2 || s.ball.x - s.ball.r > b.x + b.w / 2) continue;
      if (s.ball.y + s.ball.r < b.y - b.h / 2 || s.ball.y - s.ball.r > b.y + b.h / 2) continue;
      b.alive = false;
      s.left--;
      s.score += 60;
      this.game.audio.sfx('chip');
      const overlapX = Math.min(s.ball.x + s.ball.r - (b.x - b.w / 2), (b.x + b.w / 2) - (s.ball.x - s.ball.r));
      const overlapY = Math.min(s.ball.y + s.ball.r - (b.y - b.h / 2), (b.y + b.h / 2) - (s.ball.y - s.ball.r));
      if (overlapX < overlapY) s.ball.vx = -s.ball.vx;
      else s.ball.vy = -s.ball.vy;
      if (s.left <= 0) { this.finish(true, s.score + s.lives * 200); return; }
      break;
    }
    if (s.ball.y > PF.y + PF.h - 4) {
      s.lives--;
      this.game.audio.sfx('fall');
      if (s.lives <= 0) { this.finish(false, s.score); return; }
      this.resetBrickBall(s);
    }
  }

  drawBrick(ctx) {
    const s = this.s;
    const art = this.art;
    this.game.sea.drawBackdrop(ctx, this.game.titleTheme, { foreground: false });
    ctx.fillStyle = 'rgba(6,14,30,0.55)';
    ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    art.drawSurf(ctx, 'floodlight', PF.x + 26, PF.y + 96, { scale: 0.9 });
    art.drawSurf(ctx, 'floodlight', PF.x + PF.w - 26, PF.y + 96, { scale: 0.9, flip: true });

    for (const b of s.bricks) {
      if (!b.alive) continue;
      art.drawSurf(ctx, 'deck' + (b.row % 4), b.x, b.y, { anchor: 'center', scale: 0.92 });
    }

    art.drawSurf(ctx, 'deck1', s.paddle.x, s.paddle.y + 9, { anchor: 'center', scale: 1.45 });
    ctx.fillStyle = 'rgba(143,211,232,0.45)';
    ctx.fillRect(s.paddle.x - s.paddle.w / 2, s.paddle.y + 2, s.paddle.w, 2);
    art.drawAtlas(ctx, 'ic_orb', s.ball.x, s.ball.y, { anchor: 'center', scale: 0.9 });

    drawText(ctx, `${s.score}`, PF.x + 14, PF.y + 24, {
      size: 8, color: C.gold, shadow: C.ink,
    });
    drawText(ctx, 'FICHAS', PF.x + PF.w - 14, PF.y + 25, { size: 5, color: C.dim, align: 'right' });
    for (let k = 0; k < s.lives; k++) {
      art.drawSurf(ctx, 'deck2', PF.x + PF.w - 22 - k * 16, PF.y + 34, { anchor: 'center', scale: 0.4 });
    }
    if (s.serve > 0) {
      drawText(ctx, 'PREPARA', PF.x + PF.w / 2, PF.y + PF.h / 2, {
        size: 12, color: C.cream, align: 'center', shadow: C.ink,
      });
    }
  }
}
