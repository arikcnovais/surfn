/* =========================================================================
   Rider — arcade surf physics for Zel and his rivals.
   Carving, turbo, ollies, ramp launches, tricks, bails and AI steering.
   ========================================================================= */
import { clamp, rand, isoX, isoY, shadow, VIEW, textSize, UI_FONT } from '../engine/core.js';
import { TRICKS } from './story.js';
import { Nav } from './nav.js';

export const RIVAL_TINT = {
  zel: '#ffe066', roxo: '#b07cff', verde: '#7ee081', dourado: '#ffd24d',
  sombra: '#ff5a5f', gelo: '#d7dde3', azul: '#5fb3ff', rosa: '#ff8fc7',
  lenda: '#e6cf8e',
};

const ACCEL = 34;
const GRAV = 760;

// Each rival reads the same map with its own habits. Collectors detour for
// relics, hunters spend turbo early, and line riders hold the tightest arc.
const AI_STYLE = {
  zel: 'line', roxo: 'hunter', sombra: 'hunter', dourado: 'line',
  verde: 'collector', azul: 'collector', gelo: 'line', rosa: 'steady',
};

function baseTop(tile) {
  if (tile === 'I') return 12.5;
  if (tile === 'D' || tile === 'd') return 8.2;
  if (tile === 'G') return 8.6;
  if (tile === 'P' || tile === 'S') return 7.4;
  if (tile === 'w') return 9.2;
  if (tile === 'W') return 10.2;
  return 8.2;
}

export class Rider {
  constructor(map, opts = {}) {
    this.name = opts.name || 'Zel';
    this.variant = opts.variant || 'zel';
    this.isPlayer = !!opts.isPlayer;
    this.ai = opts.ai || 0;
    this.speedMul = opts.speedMul || 1;
    this.scoreMul = opts.scoreMul || 1;
    this.style = AI_STYLE[this.variant] || 'steady';
    this.map = map;
    this.reset(map, opts.x ?? map.spawn.x, opts.y ?? map.spawn.y);
  }

  reset(map, x, y) {
    this.map = map;
    this.nav = map.nav || (map.nav = new Nav(map));
    this.aiPath = [];
    this.aiPathT = 0;
    this.aiKey = '';
    this.aiBoostT = 0;
    this.x = x + 0.5;
    this.y = y + 0.5;
    this.vx = 0;
    this.vy = 0;
    this.z = 0;
    this.vz = 0;
    this.air = false;
    this.airT = 0;
    this.lean = 0;
    this.anim = rand(0, 4);
    this.t = 0;
    this.turbo = 45;
    this.boostT = 0;
    this.jumpCd = 0;
    this.rampCd = 0;
    this.lockT = 0;
    this.trick = null;
    this.lastTrick = null;
    this.combo = 0;
    this.comboT = 0;
    this.score = 0;
    this.gates = 0;
    this.relics = 0;
    this.pipas = 0;
    this.waves = 0;
    this.bails = 0;
    this.bestCombo = 0;
    this.topSpeed = 0;
    this.wipe = false;
    this.flash = 0;
    this.aiT = 0;
    this.aiDir = { x: 0, y: 0 };
    this.aiWander = 0;
    this.aiRelicT = 0;
    this.aiRelic = null;
    this.aiEscapeT = 0;
    this.aiEscape = null;
    this.aiPathT = (this.ai * 0.31) % 0.45;
    // rivals ride their own gate queue instead of sharing the player's buoy
    this.gatePos = null;
    this.gateIdx = -1;
    // half the pack rides the ring the other way, so they meet and fight
    this.gateDir = this.ai % 2 === 0 ? 1 : -1;
    this.gateCd = 0;
    this.gateT = 0;
    this.contestT = 0;
    this.contestKey = '';
    this.stuckT = 0;
    this.sprayT = 0;
    this.dirName = 'down';
    this.wet = false;
    this.camLead = { x: 0, y: 0 };
  }

  get speed() { return Math.hypot(this.vx, this.vy); }

  dirNameFor(vx, vy) {
    const sx = (vx - vy) * 24;
    const sy = (vx + vy) * 12;
    if (Math.hypot(sx, sy) < 0.3) return this.dirName;
    if (Math.abs(sx) > Math.abs(sy) * 1.35) return sx > 0 ? 'right' : 'left';
    if (Math.abs(sy) > Math.abs(sx) * 1.35) return sy > 0 ? 'down' : 'up';
    return this.dirName; // keep the current view while crossing an axis
  }

  launch(power = 1) {
    if (this.air) return;
    this.air = true;
    this.z = 1;
    this.vz = (205 + this.speed * 7) * power;
    this.airT = 0;
    this.rampCd = 0.7;
  }

  ollie() {
    if (this.air || this.jumpCd > 0) return false;
    this.air = true;
    this.z = 1;
    this.vz = 165;
    this.jumpCd = 0.35;
    return true;
  }

  doTrick(key) {
    if (!this.air || this.trick) return null;
    const def = TRICKS[key];
    if (!def) return null;
    this.trick = { id: key, name: def.name, points: def.points, dur: def.dur,
      color: def.color, t: 0, label: def.label };
    return this.trick;
  }

  addScore(n) { this.score += n * this.scoreMul; }

  comboUp() {
    this.combo = Math.min(9, this.combo + 1);
    this.comboT = 5.5;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
  }

  bail(reason = 'wipeout') {
    if (this.lockT > 0) return;
    this.lockT = 1.05;
    this.wipe = true;
    this.bails++;
    this.combo = 0;
    this.vx *= 0.12;
    this.vy *= 0.12;
    this.trick = null;
    this.air = false;
    this.z = 0;
    this.vz = 0;
    this.flash = 1;
    this.reason = reason;
  }

  startBoost(sfx) {
    if (this.boostT > 0.2) return false;
    if (this.turbo < 12) return false;
    this.boostT = 0.9;
    this.turbo -= 10;
    sfx?.();
    return true;
  }

  /* ---------------------------------------------------------------- physics */
  update(dt, env) {
    const { map, sea, input = { x: 0, y: 0 }, canControl = true } = env;
    this.t += dt;
    this.anim += dt * Math.min(7.5, 2.6 + this.speed * 0.3);
    this.boostT = Math.max(0, this.boostT - dt);
    this.jumpCd = Math.max(0, this.jumpCd - dt);
    this.rampCd = Math.max(0, this.rampCd - dt);
    this.lockT = Math.max(0, this.lockT - dt);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }

    const controllable = canControl && this.lockT <= 0;
    const tile = map.at(this.x, this.y);
    this.wet = tile === 'W' || tile === 'w';

    // sea current nudges everyone around
    const f = sea ? sea.forceAt(this.x, this.y) : { x: 0, y: 0 };
    this.vx += f.x * dt;
    this.vy += f.y * dt;

    if (controllable) {
      const ix = input.x || 0;
      const iy = input.y || 0;
      const il = Math.hypot(ix, iy);
      if (il > 0.05) {
        const nx = ix / il;
        const ny = iy / il;
        const ice = tile === 'I';
        this.vx += nx * ACCEL * dt * (ice ? 0.55 : 1) * (this.air ? 0.35 : 1);
        this.vy += ny * ACCEL * dt * (ice ? 0.55 : 1) * (this.air ? 0.35 : 1);
        // carving on a curved line fills the turbo
        const sp = this.speed;
        if (sp > 3.5 && !this.air) {
          const va = Math.atan2(this.vy, this.vx);
          const ia = Math.atan2(ny, nx);
          let diff = Math.abs(((ia - va + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (diff > 0.75) {
            this.turbo = clamp(this.turbo + 16 * dt, 0, 100);
            this.lean = clamp(this.lean + (diff - 0.7) * dt * 2.4, -0.34, 0.34);
          } else {
            this.lean *= 1 - dt * 4;
          }
          if (diff > 1.6 && sp > 6 && !this.air) this.vx *= 1 + 0.25 * dt;
        }
        this.sprayT += dt;
      } else {
        this.lean *= 1 - Math.min(1, dt * 5);
        const drag = tile === 'I' ? 0.55 : 1.9;
        this.vx *= Math.exp(-drag * dt);
        this.vy *= Math.exp(-drag * dt);
      }
      if (this.boostT > 0) {
        const sp = this.speed;
        if (sp > 0.1) {
          this.vx *= 1 + 2.3 * dt;
          this.vy *= 1 + 2.3 * dt;
        }
      }
    } else if (this.lockT <= 0) {
      this.vx *= Math.exp(-2.6 * dt);
      this.vy *= Math.exp(-2.6 * dt);
    }

    // speed cap by terrain
    const top = baseTop(tile) * this.speedMul * (this.boostT > 0 ? 1.62 : 1);
    let sp = this.speed;
    if (sp > top) {
      this.vx *= top / sp;
      this.vy *= top / sp;
      sp = top;
    }
    this.topSpeed = Math.max(this.topSpeed, this.speed);
    if (this.isPlayer) {
      if (this.boostT > 0) this.turbo = clamp(this.turbo - dt * 30, 0, 100);
      else this.turbo = clamp(this.turbo + dt * 5.5, 0, 100);
    }

    // ramp launches
    if (!this.air && this.rampCd <= 0 && map.isRamp(this.x, this.y) && this.speed > 4.4) {
      this.launch(1);
      if (this.isPlayer) this.justLaunched = true;
    }

    // jump / air time
    if (this.air) {
      this.airT += dt;
      this.z += this.vz * dt;
      this.vz -= GRAV * dt;
      if (this.z <= 0) this.land(env);
    }

    // movement with wall sliding
    this.move(map, dt);
    this.dirName = this.dirNameFor(this.vx, this.vy);

    // solid props: a soft bump, only a very fast hit wipes you out
    for (const p of map.solidProps) {
      const dx = this.x - (p.x + 0.5);
      const dy = this.y - (p.y + 0.5);
      const d = Math.hypot(dx, dy);
      if (d < 0.68) {
        if (this.speed > 10.5 && this.lockT <= 0) {
          this.bail('crate');
          if (env.onBail) env.onBail('crate');
        }
        const push = (0.68 - d) / Math.max(0.01, d);
        this.x += dx * push;
        this.y += dy * push;
        this.vx *= 0.82;
        this.vy *= 0.82;
      }
    }

    this.stuckT = this.speed < 0.8 ? this.stuckT + dt : 0;
  }

  move(map, dt) {
    const r = 0.34;
    // substep so fast boards never skip a tile or pop through a corner
    const travel = Math.hypot(this.vx, this.vy) * dt;
    const steps = Math.max(1, Math.ceil(travel / 0.16));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      let blockedX = false;
      let blockedY = false;
      const nx = this.x + this.vx * sdt;
      if (!map.isSolid(nx + Math.sign(this.vx) * r, this.y)) this.x = nx;
      else { this.vx = 0; blockedX = true; }
      const ny = this.y + this.vy * sdt;
      if (!map.isSolid(this.x, ny + Math.sign(this.vy) * r)) this.y = ny;
      else { this.vy = 0; blockedY = true; }
      // glide along the wall instead of bouncing back like a bumper
      if (blockedX && blockedY) break;
    }
    this.x = clamp(this.x, 0.6, map.w - 1.6);
    this.y = clamp(this.y, 0.6, map.h - 1.6);
  }

  land(env) {
    this.z = 0;
    this.vz = 0;
    this.air = false;
    const t = this.trick;
    this.trick = null;
    if (t) {
      const left = t.dur - t.t;
      if (left > 0.09) {
        this.bail('trick');
        env.onBail?.('trick');
      } else {
        this.comboUp();
        const pts = t.points * this.combo;
        this.addScore(pts);
        this.turbo = clamp(this.turbo + 10, 0, 100);
        this.landedTrick = { name: t.name, points: pts, combo: this.combo, color: t.color };
        env.onTrick?.(t, pts, this.combo);
      }
    }
    env.onLand?.(this);
  }

  /* ------------------------------------------------------------ race gates */
  // Every rider chases its own buoy. Sharing the player's gate left the bots
  // orbiting one ring until the player moved, so gates are picked per rider:
  // bank one and the next is already queued on the ring.
  pickGate(run, skip, minDist = 1.6) {
    const gates = run?.map?.gates;
    if (!gates || !gates.length) { this.gatePos = null; return null; }
    // First gate is the closest buoy. After that the rider laps the island's
    // gate ring instead of hopping between whichever two are nearest, which
    // is what kept the old bots circling one corner forever.
    if (!Number.isFinite(this.gateIdx) || this.gateIdx < 0) {
      let bestI = 0, bestD = Infinity;
      for (let i = 0; i < gates.length; i++) {
        const d = Math.hypot(gates[i].x - this.x, gates[i].y - this.y);
        if (d < bestD) { bestD = d; bestI = i; }
      }
      this.gateIdx = bestI;
    }
    const dir = this.gateDir || 1;
    for (let k = 1; k <= gates.length; k++) {
      const i = ((this.gateIdx + dir * k) % gates.length + gates.length) % gates.length;
      const g = gates[i];
      if (skip && g.x === skip.x && g.y === skip.y) continue;
      if (Math.hypot(g.x - this.x, g.y - this.y) < minDist) continue;
      this.gateIdx = i;
      this.gatePos = { x: g.x, y: g.y };
      this.aiPathT = 0;
      this.aiKey = '';
      return this.gatePos;
    }
    this.gatePos = null;
    this.aiPathT = 0;
    this.aiKey = '';
    return null;
  }

  raceTarget(run) {
    if (!this.gatePos) this.pickGate(run);
    return this.gatePos || run?.gatePos || null;
  }

  bankGate(run, gate) {
    this.gates++;
    this.comboUp();
    const pts = Math.round((110 + this.ai * 20) * Math.max(1, this.combo * 0.8));
    this.addScore(pts);
    this.turbo = clamp(this.turbo + 12, 0, 100);
    this.gateCd = this.style === 'hunter' ? 1.2 : 1.6;
    this.pickGate(run, gate, 2.2);
    return pts;
  }

  /* ------------------------------------------------------------------- AI */
  think(dt, map, target, world) {
    if (this.lockT > 0) return { x: 0, y: 0 };
    this.aiT -= dt;
    this.aiWander -= dt;
    this.aiEscapeT = Math.max(0, this.aiEscapeT - dt);

    // Outsmarting: hunters read the race, not just the buoy. If the player is
    // lining up a gate this rider can reach first, they cut in and take it.
    this.contestT -= dt;
    if (this.contestT <= 0 && this.ai >= 2 && this.style === 'hunter' &&
      world?.player && world.gatePos && !this.air) {
      this.contestT = 0.8 + Math.random() * 0.7;
      const g = world.gatePos;
      const key = g.x + ',' + g.y;
      const mine = Math.hypot(g.x - this.x, g.y - this.y);
      const theirs = Math.hypot(g.x - world.player.x, g.y - world.player.y);
      // only steal a gate once: hovering over the same buoy the player never
      // leaves is the old orbit bug wearing a different hat
      if (key !== this.contestKey && mine < 8 && mine < theirs - 0.7) {
        this.contestKey = key;
        this.contestT = 4.5 + Math.random() * 2.5;
        this.gatePos = { x: g.x, y: g.y };
        const idx = world.map?.gates?.findIndex((q) => q.x === g.x && q.y === g.y);
        if (idx >= 0) this.gateIdx = idx;
        this.aiPathT = 0;
        this.aiKey = '';
        target = this.gatePos;
      }
    }

    // Relic heats make everyone a collector. Outside them, only the collector
    // personalities take the scenic detour.
    this.aiRelicT -= dt;
    let relicTarget = null;
    if (world?.relics && (world.def?.goal?.type === 'relics'
      ? this.ai >= 2 : this.style === 'collector' && this.ai >= 3)) {
      if (this.aiRelicT <= 0 || (this.aiRelic && this.aiRelic.taken)) {
        this.aiRelicT = 0.85 + Math.random() * 0.4;
        let best = null, bestD = Infinity;
        for (const rel of world.relics) {
          if (rel.taken) continue;
          const dd = (rel.x - this.x) ** 2 + (rel.y - this.y) ** 2;
          if (dd < bestD) { bestD = dd; best = rel; }
        }
        this.aiRelic = best;
      }
      if (this.aiRelic) relicTarget = this.aiRelic;
    }

    let tx = relicTarget?.x ?? target?.x;
    let ty = relicTarget?.y ?? target?.y;
    if (tx === undefined || (this.aiWander > 0 && !relicTarget)) {
      if (!this.aiTarget || this.aiWander <= 0) {
        let gx = 0, gy = 0, tries = 0;
        do {
          gx = rand(2, map.w - 3);
          gy = rand(2, map.h - 3);
          tries++;
        } while (map.isSolid(gx, gy) && tries < 40);
        this.aiTarget = { x: gx, y: gy };
      }
      tx = this.aiTarget.x;
      ty = this.aiTarget.y;
      if (Math.hypot(tx - this.x, ty - this.y) < 1.2) this.aiWander = rand(0.4, 1.4);
    }
    // A* route to the current goal. Better riders replan sooner and keep more
    // of their speed through corners; everyone reuses the same nav buffers.
    if (Number.isFinite(tx) && Number.isFinite(ty)) {
      this.aiPathT -= dt;
      const key = `${Math.floor(tx)},${Math.floor(ty)}`;
      if (this.aiPathT <= 0 || key !== this.aiKey) {
        this.aiPath = this.nav.findPath(this.x, this.y, tx, ty);
        this.aiKey = key;
        this.aiPathT = Math.max(0.3, 0.72 - this.ai * 0.05 + Math.random() * 0.16);
      }
      while (this.aiPath && this.aiPath.length) {
        const wp = this.aiPath[0];
        if (Math.hypot(wp.x - this.x, wp.y - this.y) < 0.7) this.aiPath.shift();
        else break;
      }
      if (this.aiPath && this.aiPath.length) {
        // fast riders look one waypoint ahead when the line is already clear
        if (this.ai >= 4 && this.aiPath.length > 1 &&
          this.nav.lineWalkable(this.x, this.y, this.aiPath[1].x, this.aiPath[1].y)) {
          this.aiPath.shift();
        }
        tx = this.aiPath[0].x;
        ty = this.aiPath[0].y;
      }
    }
    let dx = tx - this.x;
    let dy = ty - this.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;

    // steer around the wall directly ahead
    const aheadX = this.x + dx * 1.25;
    const aheadY = this.y + dy * 1.25;
    if (map.isSolid(aheadX, aheadY)) {
      const options = [
        { x: -dy, y: dx }, { x: dy, y: -dx }, { x: -dx, y: -dy },
      ];
      let best = options[0], bestScore = 1e9;
      for (const o of options) {
        for (let k = 1; k <= 3; k++) {
          if (!map.isSolid(this.x + o.x * k * 0.9, this.y + o.y * k * 0.9)) {
            if (k < bestScore) { bestScore = k; best = o; }
            break;
          }
        }
      }
      dx = best.x;
      dy = best.y;
    }

    // wedge yourself into a corner and a good rider slides out instead of
    // humming against the wall forever
    if (this.stuckT > 0.55 && !this.air && this.aiEscapeT <= 0) {
      this.aiEscapeT = 0.6;
      this.aiEscape = Math.random() < 0.5
        ? { x: -dy, y: dx } : { x: dy, y: -dx };
      this.aiPath = [];
      this.aiPathT = 0;
    }
    if (this.aiEscapeT > 0 && this.aiEscape) {
      dx = this.aiEscape.x;
      dy = this.aiEscape.y;
    }

    // bots spend turbo on clear straights, and hunters spend it sooner
    this.aiBoostT = Math.max(0, this.aiBoostT - dt);
    const boostAt = this.ai >= 3 ? (this.style === 'hunter' ? 26 : 32) : 40;
    if (!this.air && this.aiBoostT <= 0 && this.turbo > boostAt && d > 3.0 &&
      this.nav.lineWalkable(this.x, this.y, this.x + dx * 4.5, this.y + dy * 4.5) &&
      this.startBoost(null)) {
      const styleBonus = this.ai >= 3 && this.style === 'hunter' ? 0.7 : 0;
      this.aiBoostT = Math.max(0.9, 3.1 + Math.random() * 1.8 - this.ai * 0.22 - styleBonus);
    }

    // slight wobble so rivals feel human, less of it as they get better
    const wobAmp = this.style === 'line' ? 0.05 : this.style === 'hunter' ? 0.08 : 0.11;
    const wob = Math.sin(this.t * (1.4 + this.ai * 0.1) + this.ai)
      * Math.max(0.03, wobAmp - this.ai * 0.007);
    const cs = Math.cos(wob), sn = Math.sin(wob);
    const rx = dx * cs - dy * sn;
    const ry = dx * sn + dy * cs;

    // Time the trick against the actual landing instead of bailing half the
    // time: better riders pick bigger tricks with less air to work with.
    if (this.air) {
      if (!this.trick) {
        const landIn = (this.vz + Math.sqrt(Math.max(0, this.vz * this.vz + 2 * GRAV * this.z))) / GRAV;
        const pool = [];
        if (landIn > TRICKS.grab.dur + 0.12) pool.push('grab');
        if (landIn > TRICKS.spin.dur + 0.14) pool.push('spin');
        if (landIn > TRICKS.flip.dur + 0.16) pool.push('flip');
        if (pool.length) {
          const skill = clamp(0.28 + this.ai * 0.105, 0.28, 1);
          if (Math.random() < dt * (1.1 + this.ai * 0.38) * skill) {
            const span = Math.max(1, Math.min(pool.length, 1 + Math.floor(skill * pool.length)));
            this.doTrick(pool[Math.min(pool.length - 1, Math.floor(Math.random() * span))]);
          }
        }
      }
      if (this.trick) this.trick.t += dt;
    }
    return { x: rx, y: ry };
  }

  /* ------------------------------------------------------------------ draw */
  draw(ctx, art, t, cam) {
    const wx = isoX(this.x, this.y);
    const wy = isoY(this.x, this.y);
    const sx = Math.round(wx - (cam ? cam.x - VIEW.W / 2 - cam.ox : 0));
    const sy = Math.round(wy - (cam ? cam.y - VIEW.H / 2 - cam.oy : 0));
    const tint = RIVAL_TINT[this.variant] || '#ffe066';
    const frame = this.air ? Math.floor(t * 6) % 4 : this.anim;
    const hump = this.air ? this.z : 0;
    const rot = this.air && this.trick
      ? (this.trick.id === 'spin' ? (this.trick.t / this.trick.dur) * Math.PI * 2
        : this.trick.id === 'flip' ? Math.sin(this.trick.t * 18) * 0.5
          : 0.2)
      : this.lean * 0.5;
    const squash = this.trick?.id === 'grab' ? 0.82 : 1;
    const scale = 0.34;

    // Wet reflection + foam wake make the board feel planted in the water.
    // The reflection is cut into offset horizontal bands so it ripples with
    // the surface instead of looking like a solid upside-down sprite.
    if (this.wet && !this.air) {
      const baseY = sy + 4;
      for (let b = 0; b < 4; b++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx - 36, baseY + b * 8, 72, 8);
        ctx.clip();
        ctx.globalAlpha = 0.17 - b * 0.028;
        ctx.filter = 'saturate(0.62) brightness(1.18) hue-rotate(145deg) blur(0.6px)';
        ctx.translate(
          sx + Math.sin(t * 2.4 + b * 1.7) * (1.1 + b * 0.35),
          baseY,
        );
        ctx.scale(1, -0.38 + b * 0.012);
        art.drawZel(ctx, 0, 0, this.dirName, frame, this.variant, {
          scale, rot: -rot * 0.7, squash,
        });
        ctx.restore();
      }

      // Expanding contact rings sell the refraction at the waterline.
      ctx.save();
      ctx.strokeStyle = 'rgba(223,246,255,0.7)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.85 + i / 3) % 1;
        ctx.globalAlpha = (1 - k) * 0.24;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 3, 11 + k * 25, 3.5 + k * 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      const foam = Math.min(1.15, 0.7 + this.speed * 0.05);
      art.drawSurf(ctx, 'foam' + ((Math.floor(t * 8) + 1) % 2), sx, sy + 3, {
        anchor: 'center', alpha: 0.16 + Math.min(0.16, this.speed * 0.015), scale: foam,
      });
    }
    shadow(ctx, sx, sy + 2, 21, 7, 0.26);
    if (!this.isPlayer) {
      ctx.save();
      ctx.globalAlpha = 0.30 + Math.sin(t * 3 + this.ai) * 0.08;
      ctx.strokeStyle = tint;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 20, 8.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    art.drawZel(ctx, sx, sy - hump, this.dirName, frame, this.variant, {
      scale,
      rot,
      alpha: this.lockT > 0 ? 0.85 : 1,
      squash,
    });

    // board spray trail
    if (!this.air && this.speed > 3.5) {
      this.trailT = (this.trailT || 0) + 0.016;
      if (this.trailT > 0.05) {
        this.trailT = 0;
        const bx = sx - (this.vx - this.vy) * 7;
        const by = sy - (this.vx + this.vy) * 7;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#dff6ff';
        ctx.fillRect(Math.round(bx + rand(-5, 5)), Math.round(by + rand(-2, 2)), 2, 1);
        ctx.globalAlpha = 1;
      }
    }
    if (this.trick) {
      ctx.globalAlpha = 0.9;
      const p = clamp(this.trick.t / this.trick.dur, 0, 1);
      for (let i = 0; i < 4; i++) {
        const a = p * 10 + i * 1.6;
        ctx.fillStyle = i % 2 ? '#ffffff' : this.trick.color;
        ctx.fillRect(Math.round(sx + Math.cos(a) * 18), Math.round(sy - 26 - hump + Math.sin(a) * 8), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.6;
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(Math.round(sx - 20), Math.round(sy - 42), 40, 40);
      ctx.globalAlpha = 1;
    }
    if (!this.isPlayer) {
      // tiny name tag above rivals
      ctx.font = `bold ${textSize(6)}px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const w = ctx.measureText(this.name).width + 8;
      const top = Math.round(sy - hump - (art.zel?.cellH || 296) * scale - 2);
      ctx.fillStyle = 'rgba(8,16,30,0.72)';
      ctx.fillRect(Math.round(sx - w / 2), top, w, 9);
      ctx.fillStyle = tint;
      ctx.fillText(this.name, Math.round(sx), top + 1);
    }
  }
}
