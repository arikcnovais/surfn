/* =========================================================================
   Nav — A* over the arena tiles, used by the rival bots.
   The old bots only knew how to steer around the wall directly in front of
   them, which made big maps a maze of dead ends. This grid gives every rider
   a real route: it respects walls/props, cuts corners only when safe and
   smooths the result so the steering never looks robotic.
   ========================================================================= */

const DIRS = [
  [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
  [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2],
];

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(node) {
    const a = this.a;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

export class Nav {
  constructor(map) {
    this.map = map;
    this.w = map.w;
    this.h = map.h;
    const size = map.w * map.h;
    this.walk = new Uint8Array(size);
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (!map.isSolid(x + 0.5, y + 0.5)) this.walk[y * map.w + x] = 1;
      }
    }
    // A* scratch space, reused by every call instead of three fresh typed
    // arrays per bot per second. Generations mark entries from the last search.
    this._g = new Float64Array(size);
    this._came = new Int32Array(size);
    this._seen = new Uint32Array(size);
    this._closed = new Uint32Array(size);
    this._gen = 0;
  }

  walkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return false;
    return this.walk[ty * this.w + tx] === 1;
  }

  nearest(tx, ty) {
    if (this.walkable(tx, ty)) return { x: tx, y: ty };
    for (let r = 1; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (this.walkable(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
        }
      }
    }
    return null;
  }

  lineWalkable(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(d / 0.22));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (this.map.isSolid(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }

  findPath(sx, sy, tx, ty) {
    const start = this.nearest(Math.floor(sx), Math.floor(sy));
    const goal = this.nearest(Math.floor(tx), Math.floor(ty));
    if (!start || !goal) return [];
    if (start.x === goal.x && start.y === goal.y) {
      return [{ x: tx, y: ty }];
    }
    const w = this.w, size = w * this.h;
    const startI = start.y * w + start.x, goalI = goal.y * w + goal.x;
    const g = this._g, came = this._came;
    const seen = this._seen, closed = this._closed;
    const gen = (++this._gen >>> 0) || (this._gen = 1);
    const open = new Heap();
    g[startI] = 0;
    seen[startI] = gen;
    came[startI] = -1;
    open.push({ i: startI, f: 0 });

    let found = false;
    let guard = 0;
    while (open.size && guard++ < size * 4) {
      const cur = open.pop();
      if (cur.i === goalI) { found = true; break; }
      if (closed[cur.i] === gen) continue;
      closed[cur.i] = gen;
      const cx = cur.i % w, cy = (cur.i / w) | 0;
      for (const [dx, dy, step] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.walkable(nx, ny)) continue;
        // do not cut through a corner where both sides are blocked
        if (dx && dy && (!this.walkable(cx + dx, cy) || !this.walkable(cx, cy + dy))) continue;
        const ni = ny * w + nx;
        if (closed[ni] === gen) continue;
        const ng = g[cur.i] + step;
        if (seen[ni] === gen && ng >= g[ni]) continue;
        seen[ni] = gen;
        g[ni] = ng;
        came[ni] = cur.i;
        const hx = Math.abs(nx - goal.x), hy = Math.abs(ny - goal.y);
        const h = Math.max(hx, hy) + (Math.SQRT2 - 1) * Math.min(hx, hy);
        open.push({ i: ni, f: ng + h * 1.02 });
      }
    }
    if (!found) return [];

    const raw = [];
    let n = goalI;
    while (n !== -1 && n !== startI) {
      raw.push({ x: (n % w) + 0.5, y: ((n / w) | 0) + 0.5 });
      n = came[n];
    }
    raw.reverse();
    raw.push({ x: goal.x + 0.5, y: goal.y + 0.5 });

    // string-pulling: keep only the farthest visible waypoint from the last
    // point we actually chose
    const out = [];
    let from = { x: sx, y: sy };
    let i = 0;
    while (i < raw.length) {
      let j = raw.length - 1;
      while (j > i && !this.lineWalkable(from.x, from.y, raw[j].x, raw[j].y)) j--;
      out.push(raw[j]);
      from = raw[j];
      i = j + 1;
    }
    return out;
  }
}
