#!/usr/bin/env python3
"""Compose the SURFN wallpapers, still and animated.

Everything is built from the game's own pixel art, so the chunky pixel grid the
canvas now draws into is baked into the source instead of being resampled out
of a screen capture:

* water fields: water0..3 from surf.png, shimmering in the game's iso lattice;
* Zel on the water: the same field, one hero, surfacing with a soft reflection;
* the fy_pool_day crew: pool water, foam, swans, buoys and the whole cast —
  Zel, the team (Zé, Tia) and the rivals (Kaká, Bruxinha, Rei) — together.

Every scene ships at four desktop sizes and two phone sizes. The animated cut
is a 12-frame perfect loop (water shimmer, sprite cycle and bob all divide 12,
so frame 12 is frame 0 again) in GIF and animated WebP, desktop 16:9 and phone
9:16. The stills come twice: plain (`-clean`: no watermark, no overlay, no
type) and branded with the SURFN lockup, grain, vignette and scanlines.

  python3 tools/gen_wallpapers.py              # everything
  python3 tools/gen_wallpapers.py stills       # static set only
  python3 tools/gen_wallpapers.py anim         # loops only
  python3 tools/gen_wallpapers.py zel          # one scene, stills + loops
"""
import json
import math
import os
import random
import sys
import zlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'wallpapers', 'final')
ANIM = os.path.join(ROOT, 'wallpapers', 'animated')
CACHE = os.path.join(ROOT, '.tmp', 'wallpaper-cache')

CREAM = (251, 238, 200)
CREAM_SOFT = (231, 220, 190)
GOLD = (255, 196, 74)
BLUE = (143, 211, 232)

DESKTOP = [('hd', 1280, 720), ('fhd', 1920, 1080), ('2k', 2560, 1440), ('4k', 3840, 2160)]
PHONE = [('phone', 1080, 1920), ('phone-2k', 1440, 2560)]
DESKTOP_MASTER = (3840, 2160)
PHONE_MASTER = (1080, 1920)

FRAMES = 12
FRAME_MS = 100          # 12 fps, 1.2 s loop
TEAM_RING = '#ffe066'
RIVAL_RING = '#ff8fc7'


def font(name, size):
    for base in ('/usr/share/fonts/truetype/dejavu', '/usr/share/fonts/truetype/liberation'):
        path = os.path.join(base, name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def tracked(draw, xy, text, fnt, fill, tracking=0, shadow=None, offset=(0, 0)):
    """Letter-spaced text; PIL has no tracking, so place glyph by glyph."""
    x, y = xy
    for ch in text:
        if shadow:
            draw.text((x + offset[0], y + offset[1]), ch, font=fnt, fill=shadow)
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def track_width(draw, text, fnt, tracking):
    return sum(draw.textlength(c, font=fnt) for c in text) + tracking * max(0, len(text) - 1)


def grain(img, strength=5, seed=7):
    rnd = random.Random(seed)
    noise = Image.new('L', (img.width // 2, img.height // 2))
    noise.putdata([128 + rnd.randint(-strength, strength) for _ in range(noise.width * noise.height)])
    noise = noise.resize(img.size, Image.BILINEAR)
    return Image.blend(img, Image.merge('RGB', (noise, noise, noise)), 0.05)


def vignette(img, scale, amount=0.34):
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    for i in range(48):
        t = i / 48
        d.ellipse((-w * 0.45 * t, -h * 0.45 * t, w + w * 0.45 * t, h + h * 0.45 * t),
                  outline=None, fill=int(255 * (1 - t)))
    mask = mask.filter(ImageFilter.GaussianBlur(int(120 * scale)))
    dark = Image.new('RGB', (w, h), (6, 10, 24))
    return Image.blend(img, Image.composite(dark, img, mask), amount)


def scanlines(img, scale):
    w, h = img.size
    line = Image.new('RGB', (w, max(1, int(round(2 * scale)))), (0, 0, 0))
    layer = Image.new('RGB', (w, h))
    step = max(3, int(round(4 * scale)))
    for y in range(0, h, step):
        layer.paste(line, (0, y))
    return Image.blend(img, layer, 0.06)


def lockup(img, scale, scene):
    """Wordmark, rule and tagline. Same relative placement at every size."""
    w, h = img.size
    d = ImageDraw.Draw(img)
    pad = int(96 * scale)
    big = font('DejaVuSans-Bold.ttf', int(150 * scale))
    kick = font('DejaVuSans-Bold.ttf', int(19 * scale))
    small = font('DejaVuSans.ttf', int(17 * scale))

    y = pad + int(6 * scale)
    tracked(d, (pad, y), 'SURFE  ·  ZOEIRA  ·  INTERNET DISCADA', kick,
            BLUE, tracking=int(5.5 * scale), shadow=(6, 10, 24), offset=(1, 1))
    y += int(38 * scale)

    tracked(d, (pad, y), 'SURFN', big, CREAM,
            tracking=int(5 * scale), shadow=(10, 18, 40), offset=(3, 3))

    rule_y = y + int(178 * scale)
    d.rectangle((pad, rule_y, pad + int(410 * scale), rule_y + int(4 * scale)), fill=GOLD)

    tracked(d, (pad, rule_y + int(26 * scale)), scene['title'], kick, CREAM,
            tracking=int(4 * scale), shadow=(6, 10, 24), offset=(1, 1))
    tracked(d, (pad, rule_y + int(58 * scale)), scene['sub'], small, (206, 220, 236),
            tracking=int(1.6 * scale), shadow=(6, 10, 24), offset=(1, 1))

    chip = scene['chip']
    cw = track_width(d, chip, small, int(3 * scale)) + int(34 * scale)
    cx, cy = w - pad - cw, h - pad - int(24 * scale)
    d.rounded_rectangle((cx, cy, w - pad, cy + int(34 * scale)), radius=int(6 * scale),
                        fill=(8, 14, 30), outline=GOLD, width=max(1, int(1.5 * scale)))
    tracked(d, (cx + int(16 * scale), cy + int(8 * scale)), chip, small, GOLD,
            tracking=int(3 * scale))
    return img


# ---------------------------------------------------------------- pixel art
SURF_CACHE = {}
WATER_INDEX = [0, 1, 2, 3]
ZEL_FILES = {
    'zel': 'zel_atlas.png', 'roxo': 'zel_roxo.png', 'verde': 'zel_verde.png',
    'dourado': 'zel_dourado.png', 'sombra': 'zel_sombra.png',
}
ZEL_TINTS = {'gelo': '#e1e5ea', 'azul': '#5fb3ff', 'rosa': '#ff8fc7'}
WATER_CACHE = {}
PROP_CACHE = {}


def surf_parts():
    if not SURF_CACHE:
        SURF_CACHE['img'] = Image.open(os.path.join(ROOT, 'assets', 'surf.png')).convert('RGBA')
        SURF_CACHE['frames'] = json.load(open(os.path.join(ROOT, 'assets', 'surf.json')))['frames']
        SURF_CACHE['zel'] = json.load(open(os.path.join(ROOT, 'assets', 'zel.json')))
    return SURF_CACHE['img'], SURF_CACHE['frames'], SURF_CACHE['zel']


def crop_frame(sheet, rect):
    x, y, w, h = rect
    return sheet.crop((x, y, x + w, y + h))


def surf_art(name):
    atlas, frames, _ = surf_parts()
    return crop_frame(atlas, frames[name])


def water_tiles(w, h, units, phase=None):
    """A field of pool water tiles, iso grid. `phase` 0..3 shifts the shimmer."""
    key = (w, h, units, phase)
    if key in WATER_CACHE:
        return WATER_CACHE[key].copy()
    atlas, frames, _ = surf_parts()
    tile_w, tile_h = 48 * units, 24 * units
    tiles = [crop_frame(atlas, frames[f'water{i}']).resize((tile_w, tile_h), Image.NEAREST)
             for i in WATER_INDEX]
    colors = tiles[0].convert('RGB').getcolors(maxcolors=1 << 20) or [((1,), (0, 120, 160))]
    flood = max(colors)[1]
    img = Image.new('RGB', (w, h), flood)
    half_w, half_h = tile_w // 2, tile_h // 2
    a_span = w // tile_w + 4
    b_span = h // tile_h + 4
    for a in range(-a_span, a_span + 1):
        for b in range(-b_span, b_span + 1):
            if (a + b) % 2:
                continue  # keeps the lattice aligned with the game's iso grid
            # spatial hash: neighbouring tiles never share the same shimmer
            idx = (((a * 73856093) ^ (b * 19349663)) >> 3) % len(tiles)
            if phase is not None:
                idx = (idx + phase) % len(tiles)
            px = w // 2 + a * half_w - half_w
            py = h // 2 + b * half_h - half_h
            img.paste(tiles[idx].convert('RGB'), (px, py), tiles[idx].split()[3])
    WATER_CACHE[key] = img
    return img.copy()


def zel_sheet(variant):
    """Pre-rendered coat when the atlas ships one, otherwise the game's recolour."""
    if variant in ZEL_FILES:
        return Image.open(os.path.join(ROOT, 'assets', ZEL_FILES[variant])).convert('RGBA')
    os.makedirs(CACHE, exist_ok=True)
    cached = os.path.join(CACHE, f'zel_{variant}.png')
    if os.path.exists(cached):
        return Image.open(cached).convert('RGBA')
    base = Image.open(os.path.join(ROOT, 'assets', 'zel_atlas.png')).convert('RGBA')
    hexv = ZEL_TINTS[variant]
    tr, tg, tb = int(hexv[1:3], 16), int(hexv[3:5], 16), int(hexv[5:7], 16)
    px = base.load()
    for y in range(base.height):
        for x in range(base.width):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            v = mx / 255
            sat = (mx - mn) / mx if mx else 0
            if v < 0.18:
                continue
            if b > r * 1.06 and b > g * 0.95:
                continue
            if v > 0.94 and sat < 0.08:
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            shade = 0.55 + lum * 0.6
            px[x, y] = (min(255, round(tr * shade)), min(255, round(tg * shade)),
                        min(255, round(tb * shade)), a)
    base.save(cached)
    return base


def zel_frame(variant, pose='down', frame=1, scale=2):
    """One surf frame of the cast, nearest-scaled so the pixels stay square."""
    _, _, meta = surf_parts()
    anim = meta['anims'][pose]
    idx = anim[frame % len(anim)]
    fr = meta['frames'][idx]
    cell = crop_frame(zel_sheet(variant), (fr['x'], fr['y'], fr['w'], fr['h']))
    cell = cell.resize((fr['w'] * scale, fr['h'] * scale), Image.NEAREST)
    return cell, fr['ax'] * scale, fr['ay'] * scale


def paste_center(img, art, x, y):
    img.alpha_composite(art, (round(x - art.width / 2), round(y - art.height / 2)))


def pool_props(w, h, units):
    """Swans, buoys and foam so the field reads as the pool day, not open sea."""
    key = (w, h, units)
    if key in PROP_CACHE:
        return PROP_CACHE[key].copy()
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    foam = surf_art('foam0')
    foam = foam.resize((foam.width * units, foam.height * units), Image.NEAREST)
    rnd = random.Random(2000)
    for _ in range(16):
        f = foam.copy()
        k = rnd.uniform(0.7, 1.5)
        f = f.resize((max(1, int(f.width * k)), max(1, int(f.height * k))), Image.LANCZOS)
        f.putalpha(f.split()[3].point(lambda a: int(a * 0.22)))
        paste_center(img, f, rnd.uniform(0, w), rnd.uniform(0, h))
    for name, x, y, k in (
        ('swan', 0.12, 0.31, 3.4), ('swan', 0.87, 0.75, 3.8),
        ('buoy_red', 0.17, 0.80, 4.2), ('buoy_blu', 0.81, 0.25, 4.2),
        ('buoy_yel', 0.63, 0.92, 3.8),
    ):
        art = surf_art(name)
        art = art.resize((int(art.width * units * k / 2), int(art.height * units * k / 2)), Image.LANCZOS)
        paste_center(img, art, w * x, h * y)
    PROP_CACHE[key] = img
    return img.copy()


def team_crew(w, h):
    """Team on the left, rivals on the right — same pool, same wave."""
    portrait = h > w
    if portrait:
        return [
            ('verde', 0.31, 0.400, 2, 0, False),   # Bruxinha
            ('dourado', 0.69, 0.400, 0, 0, False), # Rei
            ('azul', 0.27, 0.565, 1, -4, True),    # Zé
            ('rosa', 0.73, 0.565, 3, 4, True),     # Tia
            ('zel', 0.39, 0.735, 1, 0, True),      # Zel
            ('roxo', 0.65, 0.735, 2, 0, False),    # Kaká
        ]
    return [
        ('azul', 0.300, 0.600, 1, -6, True),
        ('verde', 0.500, 0.575, 2, 0, False),
        ('rosa', 0.700, 0.600, 3, 6, True),
        ('dourado', 0.335, 0.800, 0, -4, False),
        ('zel', 0.500, 0.835, 1, 0, True),
        ('roxo', 0.665, 0.800, 2, 4, False),
    ]


def reflected(cell, alpha=0.10):
    """Mirrored lower half of the sprite, squashed, for the wet-water read."""
    part = cell.crop((0, int(cell.height * 0.55), cell.width, cell.height))
    part = part.transpose(Image.FLIP_TOP_BOTTOM)
    part = part.resize((part.width, max(1, int(part.height * 0.42))), Image.NEAREST)
    part.putalpha(part.split()[3].point(lambda v: int(v * alpha)))
    return part


def draw_zel(img, x, y, cell, ax, ay, scale=2, reflect=False):
    """Board shadow and foam sized to the sprite, then the sprite itself."""
    layer = Image.new('RGBA', (img.width, img.height), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rx, ry = cell.width * 0.32, max(4.0, cell.height * 0.052)
    d.ellipse((x - rx, y - ry * 1.5, x + rx, y + ry * 1.5), fill=(5, 16, 34, 78))
    fw = max(8, int(cell.width * 0.20))
    foam = surf_art('foam0').resize((fw, max(4, fw // 4)), Image.NEAREST)
    foam.putalpha(foam.split()[3].point(lambda a: int(a * 0.5)))
    layer.alpha_composite(foam, (round(x - fw / 2), round(y - fw / 8)))
    layer = layer.filter(ImageFilter.GaussianBlur(max(1, scale)))
    img.alpha_composite(layer)
    if reflect:
        img.alpha_composite(reflected(cell), (round(x - ax), round(y)))
    img.alpha_composite(cell, (round(x - ax), round(y - ay)))


def crew_image(w, h, frame=None):
    units = 2 if w >= 1600 else 1
    scale = 2 if w >= 1600 else 1
    img = water_tiles(w, h, units, None if frame is None else frame % 4).convert('RGBA')
    img.alpha_composite(pool_props(w, h, units))
    rings = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rings)
    riders = []
    for i, (variant, fx, fy, pose, tilt, team) in enumerate(team_crew(w, h)):
        cx, cy = int(w * fx), int(h * fy)
        f = pose if frame is None else (pose + frame + i) % 4
        rd.ellipse((cx - 88 * scale, cy - 6 * scale, cx + 88 * scale, cy + 17 * scale),
                   outline=TEAM_RING if team else RIVAL_RING, width=max(2, 3 * scale))
        riders.append((cy, variant, f, tilt, cx, cy))
    img.alpha_composite(rings)
    for cy, variant, f, tilt, cx, cy2 in sorted(riders, key=lambda r: r[0]):
        cell, ax, ay = zel_frame(variant, 'down', f, scale)
        if tilt:
            cell = cell.rotate(tilt, resample=Image.NEAREST, expand=False)
        draw_zel(img, cx, cy2, cell, ax, ay, scale)
    return img.convert('RGB')


def zel_image(w, h, frame=None):
    units = 2 if w >= 1600 else 1
    img = water_tiles(w, h, units, None if frame is None else (frame // 3) % 4).convert('RGBA')
    img.alpha_composite(pool_props(w, h, units))
    scale = 2 if w >= 1600 else 1
    f = 1 if frame is None else frame % 4
    cell, ax, ay = zel_frame('zel', 'down', f, scale * 2)
    target = int(h * (0.56 if h <= w else 0.40))
    k = target / cell.height
    cell = cell.resize((round(cell.width * k), target), Image.LANCZOS)
    ax, ay = ax * k, ay * k
    bob = 0 if frame is None else round(-6 * (1 + math.sin(2 * math.pi * frame / FRAMES)))
    cx, cy = w // 2, int(h * 0.60) + bob
    # calm halo so the single rider owns the frame
    halo = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((cx - 210 * scale, cy - 40 * scale, cx + 210 * scale, cy + 70 * scale),
               fill=(255, 243, 196, 26))
    halo = halo.filter(ImageFilter.GaussianBlur(30 * scale))
    img.alpha_composite(halo)
    draw_zel(img, cx, cy, cell, ax, ay, scale, reflect=True)
    return img.convert('RGB')


def scene_image(kind, w, h, frame=None):
    if kind == 'tiles':
        units = 2 if w >= 1600 else 1
        img = water_tiles(w, h, units, None if frame is None else frame % 4).convert('RGBA')
        img.alpha_composite(pool_props(w, h, units))
        return img.convert('RGB')
    if kind == 'zel':
        return zel_image(w, h, frame)
    return crew_image(w, h, frame)


SCENES = [
    {
        'name': 'water-tiles', 'kind': 'tiles',
        'title': 'ÁGUA EM 8 BITS', 'sub': 'O mar do arquipélago, tile por tile.',
        'chip': 'WATER',
    },
    {
        'name': 'zel-solo', 'kind': 'zel',
        'title': 'ZEL  ·  PRANCHA NA ÁGUA', 'sub': 'Um herói, uma prancha e o modem longe.',
        'chip': 'ZEL',
    },
    {
        'name': 'pool-day-crew', 'kind': 'crew',
        'title': 'FY_POOL_DAY  ·  TODO MUNDO NA ÁGUA',
        'sub': 'Zel, o time do Zé e da Tia e os rivais na mesma piscina.',
        'chip': 'FY_POOL_DAY',
    },
]


def scrim(img, scale):
    """Soft dark wash in the top-left corner so the lockup reads on water."""
    w, h = img.size
    n = 192
    small = Image.new('L', (n, n), 0)
    sp = small.load()
    for y in range(n):
        for x in range(n):
            d = (((x / n) ** 2) + ((y / n) ** 2)) ** 0.5
            sp[x, y] = int(255 * max(0.0, 1.0 - d) ** 2.1)
    mask = Image.new('L', (w, h), 0)
    mask.paste(small.resize((int(w * 0.68), int(h * 1.05)), Image.BILINEAR), (0, 0))
    mask = mask.filter(ImageFilter.GaussianBlur(max(1, int(48 * scale))))
    dark = Image.new('RGB', (w, h), (7, 12, 28))
    return Image.composite(dark, img, mask.point(lambda v: int(v * 0.86)))


def still(scene, size_name, w, h, watermark_free=False, master=None):
    base = master if master is not None else scene_image(scene['kind'], w, h)
    img = base if base.size == (w, h) else base.resize((w, h), Image.LANCZOS)
    if not watermark_free:
        scale = w / 1920
        img = scrim(img, scale)
        img = grain(img, seed=zlib.crc32(scene['name'].encode()) % 999)
        img = vignette(img, scale)
        img = lockup(img, scale, scene)
        img = scanlines(img, scale)
    suffix = '-clean' if watermark_free else ''
    out = os.path.join(OUT, f"surfn-{scene['name']}-{size_name}{suffix}.png")
    img.save(out, optimize=True)
    return out, os.path.getsize(out)


def animation(scene, label, w, h):
    """A perfect 12-frame loop: frame 12 is frame 0 again."""
    frames = [scene_image(scene['kind'], w, h, i).convert('RGB') for i in range(FRAMES)]
    out = {}
    # GIF: one shared palette, no dither, so the shimmer never crawls
    pal = frames[0].quantize(colors=255, method=Image.MEDIANCUT)
    gif = [f.quantize(palette=pal, dither=Image.NONE) for f in frames]
    gif_path = os.path.join(ANIM, f"surfn-{scene['name']}-loop-{label}.gif")
    gif[0].save(gif_path, save_all=True, append_images=gif[1:], duration=FRAME_MS,
                loop=0, optimize=True, disposal=2)
    out['gif'] = (gif_path, os.path.getsize(gif_path))
    # animated WebP: full colour, much lighter than a 4K GIF, loops forever
    webp_path = os.path.join(ANIM, f"surfn-{scene['name']}-loop-{label}.webp")
    frames[0].save(webp_path, save_all=True, append_images=frames[1:], duration=FRAME_MS,
                   loop=0, quality=82, method=6)
    out['webp'] = (webp_path, os.path.getsize(webp_path))
    return out


def main():
    args = set(sys.argv[1:])
    want_stills = 'anim' not in args
    want_anim = 'stills' not in args
    scenes = [s for s in SCENES if not (args & {'zel', 'crew', 'tiles'}) or s['kind'] in args]
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(ANIM, exist_ok=True)
    os.makedirs(os.path.join(ROOT, '.tmp'), exist_ok=True)

    for scene in scenes:
        if want_stills:
            for master_size, sizes in ((DESKTOP_MASTER, DESKTOP), (PHONE_MASTER, PHONE)):
                master = scene_image(scene['kind'], *master_size)
                for size_name, w, h in sizes:
                    for clean_version in (False, True):
                        out, size = still(scene, size_name, w, h, clean_version, master)
                        print(f'  {os.path.basename(out):52s} {w}x{h}  {size / 1048576:.1f} MB')
            master = scene_image(scene['kind'], *DESKTOP_MASTER)
            master.resize((900, 506), Image.LANCZOS).save(
                os.path.join(ROOT, '.tmp', f"{scene['name']}-clean-preview.jpg"), quality=90)
            print(f"  previews -> .tmp/{scene['name']}-clean-preview.jpg")
        if want_anim:
            for label, w, h in (('desktop', 1920, 1080), ('phone', 1080, 1920)):
                out = animation(scene, label, w, h)
                for kind, (path, size) in out.items():
                    print(f'  {os.path.basename(path):52s} {w}x{h}  {size / 1048576:.2f} MB')


if __name__ == '__main__':
    main()
