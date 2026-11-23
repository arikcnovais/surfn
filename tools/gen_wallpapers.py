#!/usr/bin/env python3
"""Compose the SURFN 2000 wallpapers.

Two sources:

* the 1920x1080 pool-day captures, which carry a small Freebuff badge in the
top-left corner. The branded set covers it with a dark corner and the
wordmark; the `-clean` set simply crops the badge away and adds nothing at all.
* the game's own tiles: a field of water0..3 only, and the same water with Zel
surfing on top (zel_atlas.png, `down` pose), rendered at 2x pixel scale.

Every wallpaper is written at 1280x720, 1920x1080, 2560x1440 and 3840x2160.

  python3 tools/gen_wallpapers.py          # everything
  python3 tools/gen_wallpapers.py tiles    # only the two tile sets
"""
import json
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'wallpapers', 'final')

CREAM = (251, 238, 200)
CREAM_SOFT = (231, 220, 190)
GOLD = (255, 196, 74)
INK = (9, 14, 32)
BLUE = (143, 211, 232)

SIZES = [('hd', 1280, 720), ('fhd', 1920, 1080), ('2k', 2560, 1440), ('4k', 3840, 2160)]


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
    w = sum(draw.textlength(c, font=fnt) for c in text) + tracking * max(0, len(text) - 1)
    return w


def grain(img, strength=5, seed=7):
    rnd = random.Random(seed)
    noise = Image.new('L', (img.width // 2, img.height // 2))
    noise.putdata([128 + rnd.randint(-strength, strength) for _ in range(noise.width * noise.height)])
    noise = noise.resize(img.size, Image.BILINEAR)
    return Image.blend(img, Image.merge('RGB', (noise, noise, noise)), 0.05)


def corner_shade(img, scale):
    """Dark gradient over the top-left corner, fully opaque where the capture
    badge sits (the Freebuff pill must not survive into the wallpaper)."""
    w, h = img.size
    radius = max(3, int(760 * scale))
    small = Image.new('L', (radius, radius), 0)
    sp = small.load()
    for y in range(radius):
        for x in range(radius):
            d = ((x * x + y * y) ** 0.5) / radius
            # solid core (covers the badge), then a soft long falloff
            k = 1.0 if d < 0.22 else max(0.0, (1.0 - d) / 0.78)
            sp[x, y] = int(255 * (k ** 1.45))
    mask = Image.new('L', (w, h), 0)
    mask.paste(small, (0, 0))
    mask = mask.filter(ImageFilter.GaussianBlur(max(1, int(26 * scale))))
    dark = Image.new('RGB', (w, h), (7, 12, 28))
    return Image.composite(dark, img, mask)


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
    big = font('DejaVuSans-Bold.ttf', int(132 * scale))
    mid = font('DejaVuSans-Bold.ttf', int(66 * scale))
    kick = font('DejaVuSans-Bold.ttf', int(19 * scale))
    small = font('DejaVuSans.ttf', int(17 * scale))

    y = pad + int(6 * scale)
    tracked(d, (pad, y), 'SURFE  ·  ZOEIRA  ·  INTERNET DISCADA', kick,
            BLUE, tracking=int(5.5 * scale), shadow=(6, 10, 24), offset=(1, 1))
    y += int(34 * scale)

    x = tracked(d, (pad, y), 'SURFN', big, CREAM,
                tracking=int(3 * scale), shadow=(10, 18, 40), offset=(3, 3))
    tracked(d, (x + int(10 * scale), y + int(52 * scale)), '2000', mid, GOLD,
            tracking=int(2 * scale), shadow=(10, 18, 40), offset=(2, 2))

    rule_y = y + int(150 * scale)
    d.rectangle((pad, rule_y, pad + int(410 * scale), rule_y + int(4 * scale)), fill=GOLD)

    title = scene['title']
    sub = scene['sub']
    tracked(d, (pad, rule_y + int(20 * scale)), title, kick, CREAM_SOFT,
            tracking=int(4 * scale), shadow=(6, 10, 24), offset=(1, 1))
    tracked(d, (pad, rule_y + int(50 * scale)), sub, small, (200, 214, 230),
            tracking=int(1.6 * scale), shadow=(6, 10, 24), offset=(1, 1))

    # bottom-right episode chip
    chip = scene['chip']
    cw = track_width(d, chip, small, int(3 * scale)) + int(34 * scale)
    cx, cy = w - pad - cw, h - pad - int(24 * scale)
    d.rounded_rectangle((cx, cy, w - pad, cy + int(34 * scale)), radius=int(6 * scale),
                        fill=(8, 14, 30), outline=GOLD, width=max(1, int(1.5 * scale)))
    tracked(d, (cx + int(16 * scale), cy + int(8 * scale)), chip, small, GOLD,
            tracking=int(3 * scale))
    return img


# ---------------------------------------------------------------- tile art
# wallpapers built from the game's own tiles instead of a screen capture:
# water0..3 from surf.png and Zel from zel_atlas.png.
SURF_CACHE = {}
WATER_INDEX = [0, 1, 2, 3]


def surf_parts():
    if not SURF_CACHE:
        img = Image.open(os.path.join(ROOT, 'assets', 'surf.png')).convert('RGBA')
        frames = json.load(open(os.path.join(ROOT, 'assets', 'surf.json')))['frames']
        SURF_CACHE['img'] = img
        SURF_CACHE['frames'] = frames
        SURF_CACHE['zel'] = (Image.open(os.path.join(ROOT, 'assets', 'zel_atlas.png')).convert('RGBA'),
                             json.load(open(os.path.join(ROOT, 'assets', 'zel.json'))))
    return SURF_CACHE['img'], SURF_CACHE['frames'], SURF_CACHE['zel']


def crop_frame(sheet, rect):
    x, y, w, h = rect
    return sheet.crop((x, y, x + w, y + h))


def water_tiles(w, h, units):
    """A field of nothing but pool water tiles, iso grid, 4-phase shimmer."""
    atlas, frames, _ = surf_parts()
    tile_w, tile_h = 48 * units, 24 * units
    tiles = [crop_frame(atlas, frames[f'water{i}']).resize((tile_w, tile_h), Image.NEAREST)
             for i in WATER_INDEX]
    # the diamond art leaves the corners empty, so the fill has to read as water
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
            # cheap spatial hash: the four shimmer frames mix without banding
            idx = (((a * 73856093) ^ (b * 19349663)) >> 3) % len(tiles)
            px = w // 2 + a * half_w - half_w
            py = h // 2 + b * half_h - half_h
            img.paste(tiles[idx].convert('RGB'), (px, py),
                      tiles[idx].split()[3])
    return img


def with_zel(img, height_px):
    """Drop Zel (surfing, facing the camera) on the water, grounded by a shadow."""
    _, _, (sheet, meta) = surf_parts()
    fr = meta['frames'][meta['anims']['down'][0]]
    cell = crop_frame(sheet, (fr['x'], fr['y'], fr['w'], fr['h']))
    s = height_px / fr['h']
    cell = cell.resize((max(1, round(fr['w'] * s)), max(1, round(fr['h'] * s))), Image.LANCZOS)
    # the sprite is upscaled past its source resolution; unsharp keeps the
    # outline from going mushy next to the crisp pixel tiles
    cell = cell.filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=0))
    cx, cy = img.width // 2, int(img.height * 0.62)
    shadow_w, shadow_h = int(fr['w'] * s * 0.42), max(6, int(fr['h'] * s * 0.07))
    shade = Image.new('RGBA', (shadow_w * 2, shadow_h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(shade)
    d.ellipse((0, 0, shadow_w * 2 - 1, shadow_h * 2 - 1), fill=(4, 16, 34, 90))
    shade = shade.filter(ImageFilter.GaussianBlur(shadow_h * 0.5))
    img = img.convert('RGBA')
    img.alpha_composite(shade, (cx - shadow_w, cy - shadow_h // 2))
    img.alpha_composite(cell, (round(cx - fr['ax'] * s), round(cy - fr['ay'] * s)))
    return img.convert('RGB')


SCENES = [
    {
        'raw': 'wallpapers/raw/zel-fy_pool_day.png',
        'name': 'zel-pool-day',
        'title': 'FY_POOL_DAY  ·  CAPÍTULO 1',
        'sub': 'Zel cai na água, Kaká Pentelho filma. Clássico.',
        'chip': 'SURFN 2000',
    },
    {
        'raw': 'wallpapers/raw/solo-fy_pool_day.png',
        'name': 'lobby-pool-day',
        'title': 'A LAN HOUSE DEPOIS DA AULA',
        'sub': 'Cadeira de plástico, cooler de 12cm e um sonho.',
        'chip': 'VILA 2000',
    },
]


# The pill sits at (12,11)-(75,31) of the 1920x1080 capture; cropping it away
# leaves a 1832x1031 frame, which is 16:9 to within a pixel.
CROP_BOX = (88, 40, 1920, 1071)


def clean(scene, w, h):
    """No badge, no overlay: just the render (tighter than the branded crop,
    so the character and the lobby fill more of the frame)."""
    base = Image.open(os.path.join(ROOT, scene['raw'])).convert('RGB')
    return base.crop(CROP_BOX).resize((w, h), Image.LANCZOS)


def build(scene, size_name, w, h, watermark_free=False):
    scale = w / 1920
    if watermark_free:
        img = clean(scene, w, h)
    else:
        base = Image.open(os.path.join(ROOT, scene['raw'])).convert('RGB')
        img = base.resize((w, h), Image.LANCZOS) if (w, h) != base.size else base.copy()
        img = grain(img, seed=hash(scene['name']) % 999)
        img = corner_shade(img, scale)
        img = vignette(img, scale)
        img = lockup(img, scale, scene)
        img = scanlines(img, scale)
    suffix = '-clean' if watermark_free else ''
    out = os.path.join(OUT, f"surfn-2000-{scene['name']}-{size_name}{suffix}.png")
    img.save(out, optimize=True)
    return out, os.path.getsize(out)


def tile_sets():
    """Render the tile wallpapers once at 4K (2x pixel scale, crisp) and
    downsample for the smaller sizes."""
    master_w, master_h = 3840, 2160
    plain = water_tiles(master_w, master_h, 2)
    hero = with_zel(plain.copy(), int(master_h * 0.32))
    for label, master in (('water-tiles', plain), ('water-zel', hero)):
        for size_name, w, h in SIZES:
            img = master if (w, h) == (master_w, master_h) else master.resize((w, h), Image.LANCZOS)
            out = os.path.join(OUT, f'surfn-2000-{label}-{size_name}.png')
            img.save(out, optimize=True)
            print(f'  {os.path.basename(out):50s} {w}x{h}  '
                  f'{os.path.getsize(out) / 1048576:.1f} MB')
    hero.resize((900, 506), Image.LANCZOS).save(
        os.path.join(ROOT, '.tmp', 'water-zel-preview.jpg'), quality=88)
    plain.resize((900, 506), Image.LANCZOS).save(
        os.path.join(ROOT, '.tmp', 'water-tiles-preview.jpg'), quality=88)


def main():
    os.makedirs(OUT, exist_ok=True)
    if 'tiles' in sys.argv:
        tile_sets()
        print('  tile previews -> .tmp/water-*.jpg')
        return
    for scene in SCENES:
        for size_name, w, h in SIZES:
            for clean_version in (False, True):
                out, size = build(scene, size_name, w, h, clean_version)
                print(f'  {os.path.basename(out):50s} {w}x{h}  {size / 1048576:.1f} MB')
    for scene in SCENES:
        clean(scene, 900, 506).save(os.path.join(
            ROOT, '.tmp', f"clean-{scene['name']}.jpg"), quality=88)
    print('  clean previews -> .tmp/clean-*.jpg')
    tile_sets()
    print('  tile previews -> .tmp/water-*.jpg')


if __name__ == '__main__':
    main()
