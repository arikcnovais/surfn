#!/usr/bin/env python3
"""Recrop Zel's head out of the game atlas and build the browser favicon.

The game already has one Zel sprite sheet (assets/zel_atlas.png, cut by
tools/slice_zel.py). This takes the down-facing frame, crops just the head —
ears, goggles, snout, collar — and drops it on a small navy badge so it still
reads at 16x16 in a browser tab.

  python3 tools/gen_favicon.py

Output: assets/favicon.png (256x256) — tools/build_single.py inlines it as a
data URI so the single-file build stays self-contained.
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS = os.path.join(ROOT, 'assets', 'zel_atlas.png')
JSON = os.path.join(ROOT, 'assets', 'zel.json')
OUT = os.path.join(ROOT, 'assets', 'favicon.png')

SIZE = 256
RADIUS = 52
RING = (98, 214, 232)

# Head box inside the down-facing frame (frame 4): ears at the top, collar at
# the bottom, the tail on the left and the arms are left out. These pixels are
# the v2 sheet's cell (292x307, anchor 142/291); the old 248x288 cell framed
# the head about 46px further left.
HEAD_BOX = (104, 28, 212, 140)
HEAD_SCALE = 2            # 108x112 -> 216x224, nearest, keeps the pixels hard


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def badge(size=SIZE, radius=RADIUS):
    """Rounded square, vertical navy->teal gradient, supersampled edge."""
    top, bottom = (10, 22, 36), (18, 70, 100)
    grad = Image.new('RGB', (size, size))
    px = grad.load()
    for y in range(size):
        c = lerp(top, bottom, (y / (size - 1)) ** 0.9)
        for x in range(size):
            px[x, y] = c
    ss = 4
    mask = Image.new('L', (size * ss, size * ss), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size * ss - 1, size * ss - 1), radius=radius * ss, fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out, mask


def head():
    frames = json.load(open(JSON, encoding='utf-8'))['frames']
    atlas = Image.open(ATLAS).convert('RGBA')
    f = frames[4]                                   # 'down', facing the player
    frame = atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    x0, y0, x1, y1 = HEAD_BOX
    h = frame.crop((x0, y0, x1, y1))
    # Zel's tail floats behind the head on the left edge; a head crop doesn't
    # want a stray flame, so clear those columns before scaling (below the
    # ears only, the ear tuft itself reaches the edge).
    clear = ImageDraw.Draw(h)
    clear.rectangle((-1, 30, 24, h.height + 1), fill=(0, 0, 0, 0))
    return h.resize((h.width * HEAD_SCALE, h.height * HEAD_SCALE), Image.NEAREST)


def build():
    canvas, mask = badge()
    h = head()
    x = (SIZE - h.width) // 2
    y = SIZE - 18 - h.height                      # collar sits near the bottom
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    layer.paste(h, (x, y), h)
    canvas = Image.composite(layer, canvas, Image.composite(layer.split()[3], mask, mask))
    # the head must not spill past the rounded edge: clip it with the badge mask
    clipped = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    clipped.paste(canvas, (0, 0), mask)

    d = ImageDraw.Draw(clipped)
    d.rounded_rectangle((5, 5, SIZE - 6, SIZE - 6), radius=RADIUS - 4,
                        outline=RING + (235,), width=5)

    clipped.save(OUT)
    clipped.resize((32, 32), Image.LANCZOS).save(os.path.join(ROOT, '.tmp', 'favicon32.png'))
    clipped.save(os.path.join(ROOT, '.tmp', 'favicon256.png'))
    print(f'assets/favicon.png: {os.path.getsize(OUT) / 1024:.1f} KB')


if __name__ == '__main__':
    build()
