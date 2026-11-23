/* =========================================================================
   Maps — compact fy_pool_day-flavoured surf arenas.

   Tiles are isometric 48x24 diamonds from the generated surf atlas.
     X wall        W deep water   w shallow     D/d deck      P wood deck
     G grate       S sand         I ice         R ramp (wood) M ramp (metal)
   ========================================================================= */

export const THEMES = {
  pool: {
    name: 'POOL DAY', sky: ['#2b6f9e', '#8fd3e8'], deep: '#1d5f88',
    deck: ['deck0', 'deck1'], water: ['water0', 'water1', 'water2', 'water3'],
    shallow: ['shallow0', 'shallow1', 'shallow2', 'shallow3'],
    wall: ['wall0', 'wall1'], ramp: 'ramp_wood', music: 'surfrock',
    sun: '#fff3c4', ui: '#8fd3e8',
  },
  ice: {
    name: 'ICEWORLD', sky: ['#8fb8d8', '#e8f6ff'], deep: '#2a6f9a',
    deck: ['ice'], water: ['water2', 'water3', 'water0', 'water1'],
    shallow: ['shallow2', 'shallow3'], wall: ['wall1', 'wall0'],
    ramp: 'ramp_metal', music: 'radical', sun: '#ffffff', ui: '#b6d9ef',
  },
  sun: {
    name: 'LAGOA', sky: ['#63b6d8', '#ffe9b8'], deep: '#1f7f96',
    deck: ['wood', 'sand'], water: ['water1', 'water2', 'water3', 'water0'],
    shallow: ['shallow0', 'shallow1', 'shallow2', 'shallow3'],
    wall: ['wall0', 'wall1'], ramp: 'ramp_wood', music: 'sunset',
    sun: '#ffe066', ui: '#ffe066',
  },
  dust: {
    name: 'DUST SURF', sky: ['#c89a68', '#ffe2b0'], deep: '#2f6f86',
    deck: ['sand', 'wood'], water: ['water0', 'water1', 'water2', 'water3'],
    shallow: ['shallow0', 'shallow1'], wall: ['wall0', 'wall1'],
    ramp: 'ramp_wood', music: 'radical', sun: '#ffb27a', ui: '#ffb27a',
  },
  storm: {
    name: 'TEMPESTADE', sky: ['#243a56', '#6f8fa8'], deep: '#123f5c',
    deck: ['deck0', 'deck1'], water: ['water0', 'water1', 'water2', 'water3'],
    shallow: ['shallow0', 'shallow1'], wall: ['wall1', 'wall0'],
    ramp: 'ramp_metal', music: 'storm', sun: '#9db3cb', ui: '#9db3cb',
  },
  night: {
    name: 'TEMPLO', sky: ['#0b1026', '#22356b'], deep: '#102a4a',
    deck: ['grate', 'deck1'], water: ['water3', 'water0', 'water1', 'water2'],
    shallow: ['shallow3', 'shallow2'], wall: ['wall1', 'wall0'],
    ramp: 'ramp_metal', music: 'boss', sun: '#ffe066', ui: '#b07cff',
  },
  glitch: {
    name: 'SURF.HEAVEN', sky: ['#120b22', '#3a2a66'], deep: '#1a1a4a',
    deck: ['grate', 'deck0'], water: ['water2', 'water3', 'water1', 'water0'],
    shallow: ['shallow2', 'shallow1'], wall: ['wall1', 'wall1'],
    ramp: 'ramp_metal', music: 'glitch', sun: '#7ee081', ui: '#7ee081',
  },
  town: {
    name: 'VILA 2000', sky: ['#3b7ea6', '#ffe0ad'], deep: '#1d5f88',
    deck: ['wood', 'sand'], water: ['water0', 'water1', 'water2', 'water3'],
    shallow: ['shallow0', 'shallow1'], wall: ['wall0', 'wall1'],
    ramp: 'ramp_wood', music: 'garage2000', sun: '#fff3c4', ui: '#ffd24d',
  },
};

class Builder {
  constructor(w, h, fill = 'd') {
    this.w = w;
    this.h = h;
    this.rows = [];
    for (let y = 0; y < h; y++) this.rows.push(new Array(w).fill(fill));
    this.props = [];
    this.gates = [];
    this.relics = [];
    this.spawn = { x: Math.floor(w / 2), y: h - 3 };
  }

  set(x, y, ch) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.rows[y][x] = ch;
  }

  at(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 'X';
    return this.rows[y][x];
  }

  rect(x0, y0, x1, y1, ch) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch);
  }

  ring(x0, y0, x1, y1, ch, t = 1) {
    for (let k = 0; k < t; k++) {
      for (let x = x0 + k; x <= x1 - k; x++) {
        this.set(x, y0 + k, ch);
        this.set(x, y1 - k, ch);
      }
      for (let y = y0 + k; y <= y1 - k; y++) {
        this.set(x0 + k, y, ch);
        this.set(x1 - k, y, ch);
      }
    }
  }

  border(ch = 'X', t = 1) {
    for (let k = 0; k < t; k++) {
      this.rect(k, k, this.w - 1 - k, k, ch);
      this.rect(k, this.h - 1 - k, this.w - 1 - k, this.h - 1 - k, ch);
      this.rect(k, k, k, this.h - 1 - k, ch);
      this.rect(this.w - 1 - k, k, this.w - 1 - k, this.h - 1 - k, ch);
    }
  }

  prop(kind, x, y, opts = {}) {
    this.props.push({ kind, gx: x, gy: y, ...opts });
  }

  gate(x, y) { this.gates.push({ x, y }); }

  relic(x, y, id) { this.relics.push({ x, y, id }); }

  ramp(x, y, metal = false) { this.set(x, y, metal ? 'M' : 'R'); }

  done(meta) {
    return { ...meta, w: this.w, h: this.h, rows: this.rows, props: this.props,
      gates: this.gates, relics: this.relics, spawn: meta.spawn || this.spawn };
  }
}

/* --------------------------------------------------------------- layouts */
function poolDay() {
  const b = new Builder(30, 30, 'd');
  b.border('X');
  b.rect(9, 9, 20, 20, 'W');
  b.ring(9, 9, 20, 20, 'w');
  // two diving boards and their launch lips
  b.rect(14, 4, 15, 8, 'P');
  b.ramp(14, 8); b.ramp(15, 8);
  b.rect(14, 21, 15, 25, 'P');
  b.ramp(14, 21); b.ramp(15, 21);
  // corner kickers on the deck
  b.ramp(5, 5); b.ramp(24, 5); b.ramp(5, 24); b.ramp(24, 24);
  b.prop('umbrella', 3, 8); b.prop('chair', 4, 8);
  b.prop('umbrella', 26, 8); b.prop('chair', 25, 8);
  b.prop('umbrella', 3, 21); b.prop('chair', 4, 21);
  b.prop('umbrella', 26, 21, { flip: true }); b.prop('chair', 25, 21);
  b.prop('crate', 2, 2, { solid: true }); b.prop('crate', 27, 2, { solid: true });
  b.prop('crate', 2, 27, { solid: true }); b.prop('barrel', 27, 27, { solid: true });
  b.prop('ladder', 9, 10); b.prop('ladder', 20, 10, { flip: true });
  b.prop('ladder', 9, 19); b.prop('ladder', 20, 19, { flip: true });
  b.prop('swan', 12, 13); b.prop('swan', 17, 16, { flip: true });
  b.prop('speaker', 7, 15, { solid: true }); b.prop('speaker', 22, 14, { solid: true });
  b.prop('floodlight', 2, 15); b.prop('floodlight', 27, 15, { flip: true });
  b.prop('buoy_red', 11, 11); b.prop('buoy_yel', 18, 18); b.prop('buoy_blu', 18, 11);
  [[15, 3], [25, 15], [15, 26], [3, 14], [9, 7], [20, 24]].forEach(([x, y]) => b.gate(x, y));
  b.relic(4, 4, 'cd'); b.relic(25, 25, 'cap'); b.relic(15, 14, 'disk'); b.relic(6, 25, 'floppy');
  b.spawn = { x: 15, y: 27 };
  return b.done({
    name: 'fy_pool_day', tagline: 'O clássico. Todo mundo já caiu nessa piscina.',
    theme: 'pool', weather: 'sun', ambient: 'pool',
  });
}

function iceWorld() {
  const b = new Builder(28, 28, 'I');
  b.border('X');
  b.rect(12, 1, 14, 26, 'W');
  b.rect(1, 12, 26, 14, 'W');
  b.ring(1, 12, 26, 14, 'w');
  b.rect(12, 12, 14, 14, 'w');
  // four ice blocks, like the real fy_iceworld
  b.rect(5, 5, 8, 8, 'X');
  b.rect(19, 5, 22, 8, 'X');
  b.rect(5, 19, 8, 22, 'X');
  b.rect(19, 19, 22, 22, 'X');
  b.ramp(9, 13, true); b.ramp(18, 13, true);
  b.ramp(13, 9, true); b.ramp(13, 18, true);
  b.ramp(4, 14, true); b.ramp(23, 13, true);
  b.prop('crate', 10, 4, { solid: true }); b.prop('crate', 17, 23, { solid: true });
  b.prop('barrel', 4, 10, { solid: true }); b.prop('barrel', 23, 17, { solid: true });
  b.prop('rail', 10, 10); b.prop('rail', 17, 17, { flip: true });
  b.prop('floodlight', 2, 2); b.prop('floodlight', 25, 2, { flip: true });
  b.prop('floodlight', 2, 25); b.prop('floodlight', 25, 25, { flip: true });
  b.prop('buoy_blu', 13, 6); b.prop('buoy_blu', 21, 13); b.prop('buoy_yel', 6, 13);
  [[13, 3], [24, 13], [13, 24], [3, 14], [9, 9], [18, 18]].forEach(([x, y]) => b.gate(x, y));
  b.relic(6, 6, 'tape'); b.relic(21, 21, 'cd'); b.relic(13, 13, 'medal'); b.relic(24, 4, 'mouse');
  b.spawn = { x: 13, y: 25 };
  return b.done({
    name: 'fy_iceworld', tagline: 'Gelo, ramp da morte e um corredor de água.',
    theme: 'ice', weather: 'snow', ambient: 'ice',
  });
}

function lagoon() {
  const b = new Builder(32, 32, 'S');
  b.border('X');
  b.rect(8, 8, 23, 23, 'w');
  b.rect(12, 12, 19, 19, 'W');
  b.rect(15, 24, 16, 30, 'P');
  b.ramp(15, 24); b.ramp(16, 24);
  b.rect(24, 15, 30, 16, 'P');
  b.ramp(24, 15); b.ramp(24, 16);
  b.prop('tree_palm', 4, 6); b.prop('tree_palm', 28, 7); b.prop('tree_palm', 4, 28);
  b.prop('tree_palm', 27, 28); b.prop('tree_palm', 5, 15); b.prop('tree_palm', 26, 22);
  b.prop('umbrella', 9, 6); b.prop('chair', 10, 6);
  b.prop('umbrella', 22, 6, { flip: true }); b.prop('chair', 21, 6);
  b.prop('umbrella', 6, 22); b.prop('chair', 7, 22);
  b.prop('crate', 15, 3, { solid: true }); b.prop('barrel', 24, 27, { solid: true });
  b.prop('swan', 14, 14); b.prop('swan', 18, 17, { flip: true });
  b.prop('ladder', 8, 14); b.prop('ladder', 22, 18, { flip: true });
  b.prop('speaker', 12, 29, { solid: true }); b.prop('floodlight', 28, 3);
  b.prop('buoy_red', 10, 10); b.prop('buoy_yel', 21, 21); b.prop('buoy_blu', 21, 10);
  [[16, 5], [26, 16], [16, 26], [4, 16], [11, 9], [20, 22]].forEach(([x, y]) => b.gate(x, y));
  b.relic(3, 4, 'phone'); b.relic(28, 30, 'cap'); b.relic(16, 16, 'cd'); b.relic(29, 13, 'tape');
  b.spawn = { x: 16, y: 29 };
  return b.done({
    name: 'surf_lagoon', tagline: 'Lagoa, coqueiro e filtro do Fotolog.',
    theme: 'sun', weather: 'sun', ambient: 'beach',
  });
}

function dust() {
  const b = new Builder(30, 30, 'S');
  b.border('X');
  b.rect(3, 3, 9, 8, 'X');
  b.rect(20, 3, 26, 8, 'X');
  b.rect(3, 21, 9, 26, 'X');
  b.rect(20, 21, 26, 26, 'X');
  b.rect(13, 3, 16, 5, 'X');
  b.rect(13, 24, 16, 26, 'X');
  b.rect(12, 13, 17, 17, 'W');
  b.ring(12, 13, 17, 17, 'w');
  b.rect(14, 6, 15, 12, 'P');
  b.ramp(14, 12); b.ramp(15, 12);
  b.ramp(4, 12); b.ramp(25, 12);
  b.ramp(12, 19); b.ramp(17, 19);
  b.prop('crate', 12, 8, { solid: true }); b.prop('crate', 17, 8, { solid: true });
  b.prop('crate', 8, 17, { solid: true }); b.prop('barrel', 21, 17, { solid: true });
  b.prop('umbrella', 11, 4); b.prop('chair', 12, 4);
  b.prop('umbrella', 18, 25, { flip: true }); b.prop('chair', 17, 25);
  b.prop('rail', 10, 12); b.prop('rail', 19, 18, { flip: true });
  b.prop('speaker', 3, 15, { solid: true }); b.prop('floodlight', 26, 15, { flip: true });
  b.prop('buoy_red', 14, 15); b.prop('buoy_yel', 19, 10); b.prop('buoy_blu', 10, 20);
  [[15, 11], [23, 15], [15, 22], [7, 15], [11, 7], [18, 23]].forEach(([x, y]) => b.gate(x, y));
  b.relic(5, 5, 'disk'); b.relic(24, 24, 'cd'); b.relic(15, 15, 'phone'); b.relic(24, 5, 'floppy');
  b.spawn = { x: 15, y: 28 };
  return b.done({
    name: 'de_surf_dust', tagline: 'Dust2 não tem mar. A gente deu um jeito.',
    theme: 'dust', weather: 'dusk', ambient: 'desert',
  });
}

function assault() {
  const b = new Builder(28, 28, 'D');
  b.border('X');
  b.rect(4, 4, 9, 6, 'X');
  b.rect(18, 4, 23, 6, 'X');
  b.rect(4, 10, 6, 16, 'X');
  b.rect(21, 10, 23, 16, 'X');
  b.rect(10, 4, 12, 9, 'X');
  b.rect(15, 18, 17, 23, 'X');
  b.rect(9, 19, 19, 25, 'W');
  b.ring(9, 19, 19, 25, 'w');
  b.ramp(9, 18, true); b.ramp(19, 18, true);
  b.ramp(8, 8, true); b.ramp(20, 13, true);
  b.ramp(13, 10, true); b.ramp(14, 26, true);
  b.prop('crate', 10, 8, { solid: true }); b.prop('crate', 7, 13, { solid: true });
  b.prop('crate', 17, 8, { solid: true }); b.prop('barrel', 20, 26, { solid: true });
  b.prop('rail', 12, 14); b.prop('rail', 16, 14, { flip: true });
  b.prop('floodlight', 2, 2); b.prop('floodlight', 25, 2, { flip: true });
  b.prop('floodlight', 2, 25); b.prop('speaker', 25, 25, { solid: true, flip: true });
  b.prop('buoy_red', 11, 21); b.prop('buoy_yel', 17, 23);
  [[14, 2], [25, 19], [14, 22], [2, 19], [7, 8], [20, 15]].forEach(([x, y]) => b.gate(x, y));
  b.relic(4, 8, 'mouse'); b.relic(23, 8, 'cap'); b.relic(14, 22, 'disk'); b.relic(2, 14, 'phone');
  b.spawn = { x: 14, y: 27 };
  return b.done({
    name: 'cs_surf_assault', tagline: 'Contêiner, chuva e uma doca alagada.',
    theme: 'storm', weather: 'storm', ambient: 'storm',
  });
}

function temple() {
  const b = new Builder(30, 30, 'G');
  b.border('X');
  b.rect(9, 9, 20, 20, 'W');
  b.ring(9, 9, 20, 20, 'w');
  b.set(9, 9, 'd'); b.set(20, 9, 'd'); b.set(9, 20, 'd'); b.set(20, 20, 'd');
  for (const [x, y] of [[6, 6], [23, 6], [6, 23], [23, 23], [12, 6], [17, 6],
    [12, 23], [17, 23]]) b.set(x, y, 'X');
  b.ramp(13, 5, true); b.ramp(16, 24, true); b.ramp(5, 14, true); b.ramp(24, 15, true);
  b.prop('disco', 15, 15);
  b.prop('floodlight', 8, 11); b.prop('floodlight', 21, 11, { flip: true });
  b.prop('floodlight', 8, 18); b.prop('floodlight', 21, 18, { flip: true });
  b.prop('speaker', 3, 15, { solid: true }); b.prop('speaker', 26, 14, { solid: true, flip: true });
  b.prop('umbrella', 4, 4); b.prop('umbrella', 25, 25, { flip: true });
  b.prop('chair', 5, 4); b.prop('chair', 24, 25);
  b.prop('swan', 12, 13); b.prop('swan', 17, 17, { flip: true });
  b.prop('buoy_red', 11, 11); b.prop('buoy_yel', 18, 18); b.prop('buoy_blu', 18, 11);
  [[15, 3], [26, 15], [15, 26], [3, 15], [10, 8], [19, 21]].forEach(([x, y]) => b.gate(x, y));
  b.relic(6, 4, 'medal'); b.relic(23, 4, 'tape'); b.relic(15, 14, 'cd'); b.relic(4, 26, 'disk');
  b.spawn = { x: 15, y: 27 };
  return b.done({
    name: 'pool_temple', tagline: 'O templo do Orkut. De noite ele brilha.',
    theme: 'night', weather: 'night', ambient: 'temple',
  });
}

function heaven() {
  const b = new Builder(32, 32, 'W');
  b.border('X');
  // floating decks over open water
  const decks = [[3, 4, 9, 9], [22, 3, 28, 9], [3, 22, 9, 28], [22, 22, 28, 28],
    [13, 13, 18, 18], [12, 3, 15, 7], [16, 24, 19, 28]];
  for (const [x0, y0, x1, y1] of decks) {
    b.rect(x0, y0, x1, y1, 'G');
    b.ring(x0, y0, x1, y1, 'deck0');
  }
  b.rect(14, 15, 17, 16, 'W');
  for (const [x, y] of [[6, 6], [25, 6], [6, 25], [15, 15]]) b.ramp(x, y, true);
  b.ramp(10, 15, true); b.ramp(21, 16, true); b.ramp(15, 10, true); b.ramp(16, 21, true);
  b.prop('disco', 15, 12);
  b.prop('floodlight', 13, 12); b.prop('floodlight', 18, 12, { flip: true });
  b.prop('speaker', 4, 12, { solid: true }); b.prop('speaker', 27, 12, { solid: true, flip: true });
  b.prop('swan', 11, 12); b.prop('swan', 20, 19, { flip: true });
  b.prop('buoy_blu', 11, 10); b.prop('buoy_blu', 21, 10); b.prop('buoy_red', 11, 21);
  b.prop('buoy_yel', 21, 21); b.prop('buoy_yel', 6, 12); b.prop('buoy_red', 25, 20);
  [[15, 2], [29, 15], [15, 29], [2, 16], [12, 5], [19, 26]].forEach(([x, y]) => b.gate(x, y));
  b.relic(4, 4, 'floppy'); b.relic(27, 27, 'cd'); b.relic(15, 16, 'phone'); b.relic(26, 4, 'mouse');
  b.spawn = { x: 15, y: 29 };
  return b.done({
    name: 'surf_heaven', tagline: 'Servidor secreto. Não conta pra ninguém.',
    theme: 'glitch', weather: 'glitch', ambient: 'glitch',
  });
}

/* ---------------------------------------------------------------- VILA 2000
   The post-game town. 210x210 of roads, beach, plaza and four walk-in
   interiors (bar, hotel, lan house and lighthouse). It is deliberately not in
   MAP_ORDER: it is a sandbox, not a competitive arena. */
function village2000() {
  const w = 210, h = 210;
  const b = new Builder(w, h, 'g');
  b.border('X');

  // harbor and beach on the east edge
  b.rect(168, 58, 208, 208, 'W');
  b.rect(160, 58, 167, 208, 'S');
  b.rect(158, 58, 159, 208, 'g');

  // main roads, outer loop and sidewalks
  b.rect(8, 100, 201, 108, 'r');
  b.rect(100, 8, 108, 201, 'r');
  b.rect(28, 78, 181, 86, 'r');
  b.rect(28, 130, 181, 138, 'r');
  b.rect(54, 18, 62, 192, 'r');
  b.rect(146, 18, 154, 192, 'r');
  b.rect(8, 94, 201, 99, 'p');
  b.rect(8, 109, 201, 114, 'p');
  b.rect(94, 8, 99, 201, 'p');
  b.rect(109, 8, 114, 201, 'p');

  // central plaza + fountain
  b.rect(84, 90, 126, 124, 'p');
  b.rect(98, 96, 112, 112, 'p');
  b.rect(101, 100, 109, 108, 'W');
  b.rect(100, 99, 110, 109, 'p');
  b.rect(102, 101, 108, 107, 'W');
  b.rect(96, 94, 114, 96, 'p');
  b.rect(96, 114, 114, 116, 'p');

  // small walled building helper (south-facing two-tile doorway)
  const shell = (x0, y0, x1, y1, floor, doorX) => {
    b.rect(x0, y0, x1, y1, 'X');
    b.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, floor);
    b.set(doorX, y1, floor);
    b.set(doorX + 1, y1, floor);
    b.rect(doorX, y1 + 1, doorX + 1, y1 + 2, 'p');
    // A real frontage: tiled awning, a roof cap and a couple of street props.
    b.prop('awning', doorX + 0.5, y1 + 1, { w: 4, color: floor === 'G' ? '#b07cff' : '#ff9f6b' });
    b.prop('roof', (x0 + x1) / 2, y0, { w: x1 - x0, color: floor === 'G' ? '#4c3b70' : '#6b3f35' });
  };

  // BAR DO NALDO (wood floor, counter, jukebox)
  shell(32, 42, 58, 60, 'f', 43);
  b.rect(36, 50, 50, 51, 'X');
  b.prop('speaker', 54, 46, { solid: true, flip: true });
  for (const [x, y] of [[38, 55], [43, 56], [48, 55], [53, 56]]) b.prop('chair', x, y);
  b.prop('umbrella', 36, 46);
  b.prop('crate', 55, 56, { solid: true });

  // HOTEL 2000 (corridor + four rooms)
  shell(124, 28, 160, 58, 'f', 138);
  b.rect(125, 43, 159, 44, 'X');
  b.set(132, 43, 'f'); b.set(133, 43, 'f');
  b.set(150, 43, 'f'); b.set(151, 43, 'f');
  b.set(132, 44, 'f'); b.set(133, 44, 'f');
  b.set(150, 44, 'f'); b.set(151, 44, 'f');
  for (const x of [130, 143, 156]) {
    b.rect(x, 29, x, 42, 'X');
    b.rect(x, 45, x, 57, 'X');
  }
  for (const [x, y] of [[128, 34], [137, 34], [149, 34], [157, 34],
    [128, 51], [137, 51], [149, 51], [157, 51]]) b.prop('chair', x, y);
  b.prop('speaker', 142, 52, { solid: true });
  b.prop('shade', 127, 40); b.prop('shade', 157, 40);

  // LAN HOUSE (rows of machines, energy station)
  shell(144, 74, 170, 95, 'G', 155);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 148 + col * 5, y = 80 + row * 4;
      b.prop('speaker', x, y, { solid: true, flip: row % 2 === 1 });
      b.prop('chair', x, y + 2);
    }
  }
  b.prop('floodlight', 167, 78, { flip: true });

  // lighthouse: walk-in tower with a rotating beacon
  shell(157, 151, 169, 164, 't', 162);
  b.prop('ladder', 161, 155);
  b.prop('floodlight', 164, 156);
  b.prop('barrel', 166, 161, { solid: true });

  // town hall / arcade / radio station / two houses
  shell(78, 26, 96, 48, 'p', 85);
  shell(66, 56, 86, 72, 'G', 74);
  b.prop('speaker', 80, 60, { solid: true });
  b.prop('chair', 78, 66); b.prop('chair', 82, 66);
  shell(132, 146, 148, 162, 'p', 139);
  b.prop('floodlight', 136, 150);
  shell(70, 152, 82, 164, 'f', 75);
  b.prop('chair', 76, 157);
  shell(116, 148, 128, 160, 'f', 121);
  b.prop('chair', 122, 153);

  // open market, skate park and pier
  b.rect(18, 116, 50, 136, 'd');
  for (const [x, y] of [[23, 120], [30, 120], [38, 120], [45, 120],
    [25, 131], [34, 131], [44, 131]]) {
    b.prop('umbrella', x, y);
    b.prop('crate', x + 1, y + 1, { solid: true });
  }
  b.prop('barrel', 20, 133, { solid: true });
  b.prop('barrel', 48, 133, { solid: true });
  b.rect(18, 150, 54, 184, 'G');
  b.ramp(26, 158); b.ramp(34, 172, true); b.ramp(46, 160);
  b.prop('rail', 22, 168); b.prop('rail', 50, 168);
  b.prop('crate', 44, 154, { solid: true });
  b.prop('hoop', 30, 164); b.prop('hoop', 42, 176);
  b.rect(160, 140, 180, 144, 'P');
  b.rect(180, 140, 182, 144, 'P');
  b.prop('buoy_red', 177, 146); b.prop('buoy_yel', 178, 148);
  b.prop('tiki', 165, 142); b.prop('tiki', 176, 142);

  // beach furniture from the Habbofont furni art
  b.prop('hammock', 164, 84); b.prop('hammock', 165, 188);
  b.prop('tiki', 90, 92); b.prop('tiki', 120, 92);

  // street furniture, trees and lamps
  for (let x = 12; x < 202; x += 14) {
    b.prop('floodlight', x, 101, { flip: x > 105 });
    b.prop('barrel', x + 4, 112, { solid: true });
  }
  for (let y = 12; y < 202; y += 16) {
    b.prop('floodlight', 101, y, { flip: y > 105 });
  }
  const treeSpots = [];
  for (const [x, y] of [[14, 20], [24, 28], [44, 24], [88, 78], [120, 76],
    [180, 24], [190, 42], [196, 72], [188, 92], [194, 120], [184, 132],
    [12, 70], [18, 90], [14, 146], [40, 142], [60, 146], [90, 156],
    [104, 152], [130, 140], [144, 140], [118, 86], [74, 90], [86, 130],
    [122, 130], [136, 100], [166, 100], [12, 188], [90, 188], [140, 188]]) {
    if (b.at(x, y) === 'g') { b.prop('tree_palm', x, y); treeSpots.push([x, y]); }
  }
  for (const [x, y] of [[90, 100], [120, 100], [90, 112], [120, 112]]) b.prop('chair', x, y);
  b.prop('swan', 103, 103);
  b.prop('disco', 104, 106);
  // street-level texture: benches, planters, a cart and arcade cabinets
  for (const [x, y] of [[88, 106], [122, 106], [88, 116], [122, 116]]) b.prop('bench', x, y);
  for (const [x, y] of [[80, 100], [130, 100], [80, 122], [130, 122]]) b.prop('plant', x, y, { solid: true });
  b.prop('cart', 30, 124, { solid: true });
  b.prop('pallet', 160, 132, { solid: true });
  b.prop('ac', 99, 30, { solid: true }); b.prop('ac', 154, 30, { solid: true });
  b.prop('poster', 34, 43); b.prop('poster', 144, 30); b.prop('poster', 80, 57);
  b.prop('roofvent', 87, 27); b.prop('roofvent', 155, 147); b.prop('roofvent', 75, 57);
  b.prop('sign', 84, 101, { text: 'PRAÇA' }); b.prop('sign', 172, 140, { text: 'ORLA' });

  // labels and interactive spots (POIs)
  const pois = [
    { id: 'bar', kind: 'bar', x: 45, y: 52, name: 'BAR DO NALDO' },
    { id: 'hotel', kind: 'hotel', x: 140, y: 35, name: 'HOTEL 2000' },
    { id: 'lan', kind: 'lan', x: 156, y: 87, name: 'LAN HOUSE' },
    { id: 'lighthouse', kind: 'light', x: 163, y: 158, name: 'FAROL' },
    { id: 'market', kind: 'market', x: 35, y: 127, name: 'MERCADO' },
    { id: 'plaza', kind: 'plaza', x: 105, y: 110, name: 'PRAÇA DO MODEM' },
    { id: 'skate', kind: 'skate', x: 36, y: 166, name: 'SKATE PARK' },
    { id: 'pier', kind: 'pier', x: 170, y: 142, name: 'ORLA' },
    { id: 'arcade', kind: 'arcade', x: 76, y: 63, name: 'ARCADE' },
    { id: 'radio', kind: 'radio', x: 140, y: 153, name: 'RÁDIO' },
    { id: 'jobs', kind: 'jobs', x: 88, y: 43, name: 'PREFEITURA · MURAL DE TRABALHO' },
    { id: 'mural', kind: 'mural', x: 114, y: 109, name: 'MURAL DA COMUNIDADE' },
  ];
  const labels = [
    { x: 45, y: 50, text: 'BAR DO NALDO', color: '#ffd24d' },
    { x: 140, y: 32, text: 'HOTEL 2000', color: '#8fd3e8' },
    { x: 156, y: 76, text: 'LAN HOUSE', color: '#8ee58e' },
    { x: 163, y: 148, text: 'FAROL', color: '#ffe066' },
    { x: 105, y: 94, text: 'PRAÇA DO MODEM', color: '#b07cff' },
    { x: 35, y: 113, text: 'MERCADO', color: '#ff9f6b' },
    { x: 36, y: 147, text: 'SKATE PARK', color: '#8fd3e8' },
    { x: 170, y: 136, text: 'ORLA', color: '#8fd3e8' },
    { x: 76, y: 54, text: 'ARCADE', color: '#b07cff' },
    { x: 140, y: 143, text: 'RÁDIO', color: '#8ee58e' },
    { x: 88, y: 38, text: 'TRABALHO', color: '#ffe066' },
    { x: 114, y: 105, text: 'MURAL', color: '#b07cff' },
  ];
  b.spawn = { x: 105, y: 113 };
  b.done = b.done.bind(b);
  const built = b.done({
    name: 'vila2000', theme: 'town', noExpand: true, pois, labels,
    beacon: { x: 163, y: 157 }, dock: { x: 170, y: 142 },
  });
  void treeSpots;
  return built;
}

export const MAPS = {
  fy_pool_day: poolDay,
  fy_iceworld: iceWorld,
  surf_lagoon: lagoon,
  de_surf_dust: dust,
  cs_surf_assault: assault,
  pool_temple: temple,
  surf_heaven: heaven,
};

export const MAP_ORDER = Object.keys(MAPS);

const cache = new Map();

export function mapInfo(id) {
  return MAPS[id] ? { id, ...themes(MAPS[id]) } : null;
}

function themes(fn) {
  const built = fn();
  return built;
}

/* ------------------------------------------------------------ expansion
   Every arena gets a themed outer ring: the original layout is scaled up and
   its old border opened, so the map roughly triples in area without anyone
   having to redraw seven layouts by hand. */
const MAP_SCALE = 1.45;
const RING = 8;

function surfaceFor(theme) {
  if (theme === 'ice') return 'I';
  if (theme === 'sun' || theme === 'dust') return 'S';
  if (theme === 'storm') return 'D';
  if (theme === 'night') return 'G';
  if (theme === 'glitch') return 'W';
  return 'd';
}

function clampInt(v, a, b) { return v < a ? a : v > b ? b : v; }

function expandArena(base) {
  const S = MAP_SCALE, M = RING;
  const coreW = Math.round(base.w * S), coreH = Math.round(base.h * S);
  const w = coreW + M * 2, h = coreH + M * 2;
  const surface = surfaceFor(base.theme);
  const b = new Builder(w, h, surface);

  for (let y = 0; y < coreH; y++) {
    const sy = clampInt(Math.floor(y / S), 0, base.h - 1);
    for (let x = 0; x < coreW; x++) {
      const sx = clampInt(Math.floor(x / S), 0, base.w - 1);
      let ch = base.rows[sy][sx];
      const oldRim = sx === 0 || sy === 0 || sx === base.w - 1 || sy === base.h - 1;
      if (ch === 'X' && oldRim) ch = surface;
      b.set(x + M, y + M, ch);
    }
  }
  b.border('X');

  // old props/gates/relics follow the scaling
  for (const p of base.props) {
    b.prop(p.kind, M + Math.round(p.gx * S), M + Math.round(p.gy * S),
      p.solid ? { solid: true, flip: p.flip } : { flip: p.flip });
  }
  // Scaling can round a gate onto an ice block or another wall. Keep the
  // original spot when it is open, otherwise use the nearest open tile so a
  // gate can never become an inaccessible target.
  const gateTaken = new Set();
  const gateSpot = (x, y) => {
    for (let r = 0; r < Math.max(w, h); r++) {
      let best = null;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 1 || ny < 1 || nx >= w - 1 || ny >= h - 1) continue;
          if (b.at(nx, ny) === 'X') continue;
          const k = nx + ',' + ny;
          if (gateTaken.has(k)) continue;
          const d = dx * dx + dy * dy;
          if (!best || d < best.d) best = { x: nx, y: ny, d, k };
        }
      }
      if (best) { gateTaken.add(best.k); return best; }
    }
    return { x, y };
  };
  for (const g of base.gates) {
    const p = gateSpot(M + Math.round(g.x * S), M + Math.round(g.y * S));
    b.gate(p.x, p.y);
  }
  for (const r of base.relics) b.relic(M + Math.round(r.x * S), M + Math.round(r.y * S), r.id);

  // ring furniture: new routes, new jump lines, new corners to explore
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  const rim = [
    { x: M + 3, y: cy }, { x: w - M - 4, y: cy },
    { x: cx, y: M + 3 }, { x: cx, y: h - M - 4 },
    { x: M + 3, y: M + 3 }, { x: w - M - 4, y: h - M - 4 },
    { x: w - M - 4, y: M + 3 }, { x: M + 3, y: h - M - 4 },
  ];
  for (const g of rim) {
    const k = g.x + ',' + g.y;
    if (b.at(g.x, g.y) !== 'X' && !gateTaken.has(k)) {
      b.gate(g.x, g.y);
      gateTaken.add(k);
    }
  }

  const palms = base.theme === 'sun' || base.theme === 'dust';
  const iced = base.theme === 'ice';
  rim.forEach((p, i) => {
    if (palms && i % 2 === 0) b.prop('tree_palm', p.x, p.y + 1);
    if (iced) b.prop('buoy_blu', p.x, p.y + 1);
  });
  for (const [x, y] of [[M + 1, M + 1], [w - M - 2, M + 1], [M + 1, h - M - 2], [w - M - 2, h - M - 2]]) {
    b.prop('floodlight', x, y, { flip: x > cx });
    b.prop('barrel', x + (x > cx ? -1 : 1), y, { solid: true });
  }
  for (const [x, y] of [[cx - 4, M + 2], [cx + 4, h - M - 3], [M + 2, cy + 4], [w - M - 3, cy - 4]]) {
    b.prop('speaker', x, y, { solid: true, flip: x > cx });
    b.prop('umbrella', x + 2, y + (y > cy ? -1 : 1));
    b.prop('chair', x + 1, y + (y > cy ? -1 : 1));
  }
  b.ramp(M + 1, cy, true); b.ramp(w - M - 2, cy, true);
  b.ramp(cx, M + 1, true); b.ramp(cx, h - M - 2, true);

  // two extra collectibles live out in the new ring
  b.relic(M + 2, h - M - 4, 'cd');
  b.relic(w - M - 3, M + 4, 'cap');

  const spawn = { x: cx, y: h - M + 1 };
  b.prop('ladder', spawn.x - 1, spawn.y - 1);
  b.prop('ladder', spawn.x + 2, spawn.y - 1, { flip: true });

  return b.done({
    ...base,
    w, h, rows: b.rows, props: b.props, gates: b.gates, relics: b.relics,
    spawn,
    dock: { x: spawn.x, y: spawn.y - 1 },
    baseSize: { w: base.w, h: base.h },
  });
}

export function getMap(id) {
  if (cache.has(id)) return cache.get(id);
  const raw = id === 'vila2000' ? village2000() : (MAPS[id] || MAPS.fy_pool_day)();
  const built = raw.noExpand ? raw : expandArena(raw);
  built.id = id;
  built.themeDef = THEMES[built.theme] || THEMES.pool;
  built.solidProps = built.props
    .filter((p) => p.solid)
    .map((p) => ({ x: p.gx, y: p.gy, r: 0.42 }));
  // movement helpers
  built.at = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= built.w || iy >= built.h) return 'X';
    return built.rows[iy][ix];
  };
  built.isWall = (x, y) => built.at(x, y) === 'X';
  built.isWater = (x, y) => {
    const t = built.at(x, y);
    return t === 'W' || t === 'w';
  };
  built.isShallow = (x, y) => built.at(x, y) === 'w';
  built.isRamp = (x, y) => built.at(x, y) === 'R' || built.at(x, y) === 'M';
  built.isSolid = (x, y) => {
    if (built.isWall(x, y)) return true;
    for (const p of built.solidProps) {
      if (Math.hypot(p.x + 0.5 - x, p.y + 0.5 - y) < p.r) return true;
    }
    return false;
  };
  cache.set(id, built);
  return built;
}

export const MAP_META = {
  fy_pool_day: { label: 'fy_pool_day', note: 'clássico', stars: 1 },
  fy_iceworld: { label: 'fy_iceworld', note: 'gelo', stars: 2 },
  surf_lagoon: { label: 'surf_lagoon', note: 'lagoa', stars: 2 },
  de_surf_dust: { label: 'de_surf_dust', note: 'deserto', stars: 3 },
  cs_surf_assault: { label: 'cs_surf_assault', note: 'tempestade', stars: 4 },
  pool_temple: { label: 'pool_temple', note: 'noite', stars: 4 },
  surf_heaven: { label: 'surf_heaven', note: '???', stars: 5 },
  vila2000: { label: 'vila2000', note: 'vila', stars: 5 },
};
