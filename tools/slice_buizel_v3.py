"""Build the Buizel V3 atlas from the per-animation strips in assets/spriteBuizelV3.

V3 ships one PNG per animation, already background-free, laid out as a grid of
8 direction rows x N frame columns. Direction rows are, in order:
    0 south, 1 south-east, 2 east, 3 north-east,
    4 north, 5 north-west, 6 west, 7 south-west
(confirmed from the sprites: the muzzle shifts right on rows 1-3 and left on 5-7.)

Frames keep their position inside the cell, so the jump arc and weapon sweeps
stay intact; the whole animation is anchored by its ground line and horizontal
centre. Output: assets/buizel_atlas.png + assets/buizel.json + coat variants.
"""
import json
import os
from PIL import Image
import numpy as np
from palette import pil_palette_image, COATS, shift_hex

SRC = "assets/spriteBuizelV3"
OUT = "assets"
DIRS = 8

# name, file, columns, rows, frame ms, loop
SPECS = [
    ("idle", "Idle", 9, 8, 120, True),
    ("walk", "Walk", 4, 8, 130, True),
    ("hop", "Hop", 10, 8, 55, False),
    ("float", "Float", 4, 8, 150, True),
    ("swing", "Swing", 9, 8, 70, False),
    ("shoot", "Shoot", 10, 8, 70, False),
    ("pose", "Pose", 5, 8, 130, False),
]
# single-row clips, no direction
SINGLE = [
    ("eat", "Eat", 4, 1, 150, True),
    ("sit", "Sit", 3, 1, 220, True),
    ("sleep", "Sleep", 2, 1, 600, True),
]

CANVAS = (80, 100)
ANCHOR = (40, 96)


def pastel(img, t=0.08, lift=2):
    """Gently wash Buizel toward the pastel storybook palette; keep outlines."""
    a = np.asarray(img).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    avg = rgb.mean(axis=2, keepdims=True)
    rgb = rgb + (avg - rgb) * 0.12
    rgb = rgb + (np.array([252.0, 242.0, 230.0]) - rgb) * t + lift
    out = np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def load_strip(name, cols, rows):
    im = Image.open(f"{SRC}/{name}-Anim.png").convert("RGBA")
    cw, ch = im.width // cols, im.height // rows
    assert cw * cols == im.width and ch * rows == im.height, (name, im.size, cols, rows)
    return im, cw, ch


def frames_of(im, cw, ch, cols):
    out = []
    for r in range(im.height // ch):
        for c in range(cols):
            out.append((r, c, im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))))
    return out


def union_bbox(cells):
    x0, y0, x1, y1 = 999, 999, -1, -1
    for cell in cells:
        a = np.asarray(cell)[..., 3] > 10
        if not a.any():
            continue
        ys, xs = np.nonzero(a)
        x0 = min(x0, xs.min()); x1 = max(x1, xs.max())
        y0 = min(y0, ys.min()); y1 = max(y1, ys.max())
    return x0, y0, x1, y1


def place(cell, cx, ground):
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    dx = ANCHOR[0] - cx
    dy = ANCHOR[1] - ground
    canvas.alpha_composite(cell, (int(dx), int(dy)))
    return canvas


def main():
    anims = {}
    packed = []  # (animName, frameIndex, canvas)

    for name, file, cols, rows, dur, loop in SPECS:
        im, cw, ch = load_strip(file, cols, rows)
        for r in range(rows):
            cells = [im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)) for c in range(cols)]
            x0, y0, x1, y1 = union_bbox(cells)
            cx = (x0 + x1 + 1) / 2
            ground = y1 + 1
            key = f"{name}_{r}"
            anims[key] = {"duration": dur, "loop": loop, "frames": []}
            for i, cell in enumerate(cells):
                packed.append((key, i, place(cell, cx, ground)))

    for name, file, cols, dur, loop in [(n, f, c, d, l) for n, f, c, r, d, l in SINGLE]:
        im, cw, ch = load_strip(file, cols, 1)
        cells = [im.crop((c * cw, 0, (c + 1) * cw, ch)) for c in range(cols)]
        x0, y0, x1, y1 = union_bbox(cells)
        cx = (x0 + x1 + 1) / 2
        ground = y1 + 1
        anims[name] = {"duration": dur, "loop": loop, "frames": []}
        for i, cell in enumerate(cells):
            packed.append((name, i, place(cell, cx, ground)))

    # ---- pack ----
    cols = 10
    rows_n = (len(packed) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * CANVAS[0], rows_n * CANVAS[1]), (0, 0, 0, 0))
    for k, (key, idx, canvas) in enumerate(packed):
        x = (k % cols) * CANVAS[0]
        y = (k // cols) * CANVAS[1]
        atlas.alpha_composite(canvas, (x, y))
        anims[key]["frames"].append({"x": x, "y": y})
    atlas = pastel(atlas)
    atlas.save(f"{OUT}/buizel_atlas.png")

    # ---- coat variants (recolour fur + scarf bands) ----
    arr = np.asarray(atlas.convert("RGB"))
    hsv = np.asarray(atlas.convert("RGB").convert("HSV")).astype(np.int16)
    H, S = hsv[..., 0], hsv[..., 1]
    fur_band = (S > 70) & (H >= 3) & (H <= 30)
    scarf_band = (S > 60) & (H > 30) & (H <= 55)
    alpha = np.array(atlas)[..., 3]
    variants = {}
    for coat, spec in COATS.items():
        if coat == "classic":
            variants[coat] = "buizel_atlas.png"
            continue
        h2 = np.array(atlas.convert("RGB").convert("HSV")).astype(np.int16)
        hh, ss, vv = h2[..., 0].copy(), h2[..., 1].copy(), h2[..., 2].copy()
        for band, key in ((fur_band, "fur"), (scarf_band, "scarf")):
            if not spec[key]:
                continue
            hue, smul, vmul = spec[key]
            hh[band] = hue
            ss[band] = np.clip(ss[band] * smul, 0, 255)
            vv[band] = np.clip(vv[band] * vmul, 0, 255)
        h2[..., 0], h2[..., 1], h2[..., 2] = hh, ss, vv
        tinted = Image.fromarray(np.clip(h2, 0, 255).astype(np.uint8), "HSV").convert("RGB")
        img = Image.new("RGBA", atlas.size, (0, 0, 0, 0))
        img.paste(tinted, (0, 0))
        a = np.array(img)
        a[..., 3] = alpha
        img = Image.fromarray(a, "RGBA")
        fname = f"buizel_{coat}.png"
        img.save(f"{OUT}/{fname}")
        variants[coat] = fname

    data = {
        "atlas": "buizel_atlas.png",
        "frameW": CANVAS[0], "frameH": CANVAS[1],
        "anchor": list(ANCHOR), "variants": variants, "sheet": "v3",
        "dirs": ["S", "SE", "E", "NE", "N", "NW", "W", "SW"],
        "anims": anims,
    }
    with open(f"{OUT}/buizel.json", "w") as fh:
        json.dump(data, fh, indent=1)

    # contact sheet
    sheet_cols = 10
    sheet = Image.new("RGBA", (sheet_cols * 88, rows_n * 108), (34, 40, 56, 255))
    for k, (key, idx, canvas) in enumerate(packed):
        sheet.alpha_composite(canvas, ((k % sheet_cols) * 88 + 4, (k // sheet_cols) * 108 + 4))
    sheet.save("/tmp/buizel_v3_frames.png")
    print("frames", len(packed), "atlas", atlas.size, "anims", len(anims))


main()
