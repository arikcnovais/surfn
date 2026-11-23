"""Slice the v1 Buizel spritesheet into per-frame pixel-art sprites.

v1 layout (measured from the sheet by content bands):
  * idle            : 4 frames, 3/4 front
  * wood chopping   : 8 frames (felling + chopping)
  * water refilling : 5 frames (with watering can)
  * mining          : 5 frames (pickaxe + rock)
  * eating          : 5 frames
  * drinking        : 5 frames
  * jump            : 4 frames
  * victory / taunt : 2 frames

v1 has no walk cycles and no back view, so the game derives walking from the
idle frames (bounce + lean + horizontal flip) — see js/game/player.js.
Frames are matted off the grey backdrop, normalised to one scale, anchored at
the feet and quantised onto the shared palette, then packed into one atlas.
"""
import json
import os
from PIL import Image
import numpy as np
from palette import pil_palette_image, COATS, shift_hex

SRC = "spritesheets/buizel spritesheet v1.jpg"
OUT = "assets"
BG = np.array([100, 110, 120])

# anim -> (cells [(x0,y0,x1,y1)...], frame ms, loop, target body height px)
IDLE_Y = (30, 175)
CHOP_Y = (219, 349)
WATER_Y = (383, 506)
MINE_Y = (537, 667)
EAT_Y = (695, 817)
DRINK_Y = (844, 974)
AIR_Y = (1002, 1195)

def cells_from_runs(xs, y0, y1, pad=2):
    return [(a - pad, y0 - pad, b + pad, y1 + pad) for a, b in xs]

idle = cells_from_runs([(0, 111), (112, 223), (224, 335), (336, 447)], *IDLE_Y)
chop = cells_from_runs([(0, 111), (112, 223), (224, 335), (336, 447),
                        (448, 559), (560, 671), (672, 753), (754, 895)], *CHOP_Y)
water = cells_from_runs([(0, 137), (138, 269), (270, 403), (404, 531), (532, 662)], *WATER_Y)
mine = cells_from_runs([(0, 136), (137, 284), (285, 447), (448, 593), (594, 746)], *MINE_Y)
eat = cells_from_runs([(0, 127), (128, 250), (251, 380), (381, 515), (516, 654)], *EAT_Y)
drink = cells_from_runs([(0, 127), (128, 250), (251, 380), (381, 515), (516, 654)], *DRINK_Y)
jump = cells_from_runs([(7, 117), (129, 242), (262, 345), (365, 474)], *AIR_Y)
victory = cells_from_runs([(549, 705), (738, 880)], *AIR_Y)

ROWS = {
    "idle": (idle, 260, True, 46),
    "chop": (chop, 90, False, 52),
    "water": (water, 110, False, 50),
    "mine": (mine, 100, False, 52),
    "eat": (eat, 170, False, 46),
    "drink": (drink, 170, False, 46),
    "jump": (jump, 95, False, 48),
    "victory": (victory, 260, False, 47),
}

CANVAS = (112, 96)
ANCHOR = (56, 84)


def matte(cell):
    """alpha out the grey-blue backdrop (two flat tones + a soft vignette).

    The sheet's background is desaturated (the sprites are warm orange/cream),
    so low-saturation mid/bright pixels are background. Speckles left by JPEG
    ringing are then dropped by size.
    """
    rgb = np.asarray(cell).astype(np.int16)
    hsv = np.asarray(cell.convert("HSV")).astype(np.int16)
    S, V = hsv[..., 1], hsv[..., 2]
    # The sheet paints sprites on light/dark blue-grey cards with a soft vignette,
    # plus drop shadows. Flood-fill those *connected* regions away from the cell
    # border: enclosed grey props (pickaxe head, rock) stay, since the sprite's
    # dark outline separates them from the backdrop.
    keep = S > 45
    h, w = keep.shape
    # fill eye whites / pale interior details that are not background
    outside = ~keep
    seen_bg = np.zeros_like(outside)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if outside[y, x] and not seen_bg[y, x]:
                seen_bg[y, x] = True; stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if outside[y, x] and not seen_bg[y, x]:
                seen_bg[y, x] = True; stack.append((y, x))
    while stack:
        cy, cx = stack.pop()
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < h and 0 <= nx < w and outside[ny, nx] and not seen_bg[ny, nx]:
                seen_bg[ny, nx] = True
                stack.append((ny, nx))
    holes = outside & ~seen_bg
    alpha = (keep | holes).astype(np.uint8)
    # cell borders / divider lines sit just inside the measured cells
    alpha[:, :5] = 0; alpha[:, -5:] = 0; alpha[:3, :] = 0; alpha[-3:, :] = 0

    # remove tiny isolated components (noise, stray grid dots)
    seen = np.zeros_like(alpha)
    for sy in range(h):
        for sx in range(w):
            if not alpha[sy, sx] or seen[sy, sx]:
                continue
            st = [(sy, sx)]
            seen[sy, sx] = 1
            comp = []
            while st:
                cy, cx = st.pop()
                comp.append((cy, cx))
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = 1
                        st.append((ny, nx))
            if len(comp) < 24:
                for cy, cx in comp:
                    alpha[cy, cx] = 0

    alpha = alpha * 255
    alpha[:1, :] = 0; alpha[-1:, :] = 0; alpha[:, :1] = 0; alpha[:, -1:] = 0
    return alpha


def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    master = pil_palette_image()
    anims_out = {}
    sheet_frames = []

    # the sheet is drawn at one consistent scale: normalise every animation by
    # the same factor, measured from the idle poses, so chopping/mining are not
    # silently enlarged relative to standing.
    idle_heights = []
    probe = {}
    for name, (cells, dur, loop, target) in ROWS.items():
        crops = []
        for (x0, y0, x1, y1) in cells:
            x0, y0, x1, y1 = max(0, int(x0)), max(0, int(y0)), min(im.width, int(x1)), min(im.height, int(y1))
            cell = im.crop((x0, y0, x1, y1))
            alpha = Image.fromarray(matte(cell), "L")
            bbox = alpha.getbbox()
            if not bbox:
                continue
            cell = cell.crop(bbox)
            alpha = alpha.crop(bbox)
            arr = np.array(alpha)
            arr[arr < 128] = 0
            alpha = Image.fromarray(arr, "L")
            crops.append((cell, alpha))
            if name == "idle":
                idle_heights.append(cell.height)
        probe[name] = crops
    idle_heights.sort()
    GLOBAL_SCALE = 46 / idle_heights[len(idle_heights) // 2]

    for name, (cells, dur, loop, target) in ROWS.items():
        crops = probe[name]
        s = GLOBAL_SCALE
        frames = []
        for cell, alpha in crops:
            w, h = cell.size
            nw, nh = max(1, round(w * s)), max(1, round(h * s))
            scaled = cell.resize((nw, nh), Image.LANCZOS)
            sal = alpha.resize((nw, nh), Image.LANCZOS).point(lambda v: 0 if v < 110 else 255)

            flat = Image.new("RGB", (nw, nh), (200, 180, 155))
            flat.paste(scaled, (0, 0))
            q = flat.quantize(palette=master, dither=Image.NONE).convert("RGB")
            q.putalpha(sal)

            # horizontal centring from the warm fur, vertical anchor from the
            # character's own component (so rocks / fallen logs do not drag it)
            rgb = np.asarray(cell).astype(int)
            warm = ((rgb[..., 0] - rgb[..., 2]) > 55) & (np.asarray(alpha) > 128)
            ys, xs = np.nonzero(warm)
            body_cx = (xs.min() + xs.max() + 1) / 2 * s if len(ys) > 60 else nw / 2
            body_bottom = nh

            canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
            px = round(ANCHOR[0] - body_cx)
            py = round(ANCHOR[1] - body_bottom)
            canvas.alpha_composite(q, (px, py))
            frames.append(canvas)
            sheet_frames.append((name, len(frames) - 1, canvas))
        anims_out[name] = {"duration": dur, "loop": loop, "count": len(frames),
                           "frames": [], "scale": round(s, 3)}
        print(f"{name}: {len(frames)} frames, scale {s:.3f}")

    # ---- pack atlas (8 columns) ----
    cols = 8
    rows_n = (len(sheet_frames) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * CANVAS[0], rows_n * CANVAS[1]), (0, 0, 0, 0))
    for k, (name, idx, canvas) in enumerate(sheet_frames):
        x = (k % cols) * CANVAS[0]
        y = (k // cols) * CANVAS[1]
        atlas.alpha_composite(canvas, (x, y))
        anims_out[name]["frames"].append({"x": x, "y": y})
    atlas.save(f"{OUT}/buizel_atlas.png")

    # ---- coat variants ----
    hsv = np.asarray(atlas.convert("RGB").convert("HSV")).astype(np.int16)
    Hc, Sc = hsv[..., 0], hsv[..., 1]
    fur_band = (Sc > 60) & (Hc >= 5) & (Hc <= 27)
    scarf_band = (Sc > 150) & (Hc > 27) & (Hc <= 42)
    alpha = np.array(atlas)[..., 3]
    variants = {}
    for coat, spec in COATS.items():
        if coat == "classic":
            variants[coat] = "buizel_atlas.png"
            continue
        arr = np.array(atlas.convert("RGB").convert("HSV")).astype(np.int16)
        hh, ss, vv = arr[..., 0].copy(), arr[..., 1].copy(), arr[..., 2].copy()
        for band, key in ((fur_band, "fur"), (scarf_band, "scarf")):
            if not spec[key]:
                continue
            hue, smul, vmul = spec[key]
            hh[band] = hue
            ss[band] = np.clip(ss[band] * smul, 0, 255)
            vv[band] = np.clip(vv[band] * vmul, 0, 255)
        arr[..., 0], arr[..., 1], arr[..., 2] = hh, ss, vv
        tinted = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "HSV").convert("RGB")
        extra = []
        for key in ("fur", "scarf"):
            if spec[key]:
                for base in ("b63b18", "d8551f", "e8702b", "f08a3a", "f6a755", "ffc978",
                             "f2c531", "ffe066"):
                    extra.append(shift_hex(base, spec[key]))
        q = tinted.quantize(palette=pil_palette_image(extra), dither=Image.NONE).convert("RGB")
        img = Image.new("RGBA", atlas.size, (0, 0, 0, 0))
        img.paste(q, (0, 0))
        arr_a = np.array(img)
        arr_a[..., 3] = alpha
        img = Image.fromarray(arr_a, "RGBA")
        fname = f"buizel_{coat}.png"
        img.save(OUT + "/" + fname)
        variants[coat] = fname

    out = {
        "atlas": "buizel_atlas.png", "frameW": CANVAS[0], "frameH": CANVAS[1],
        "anchor": list(ANCHOR), "variants": variants, "sheet": "v1",
        "anims": {k: {"duration": v["duration"], "loop": v["loop"], "frames": v["frames"]}
                  for k, v in anims_out.items()},
    }
    with open(OUT + "/buizel.json", "w") as fh:
        json.dump(out, fh, indent=1)

    # contact sheet
    rows_n = (len(sheet_frames) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 112, rows_n * 100), (34, 40, 56, 255))
    for k, (name, idx, canvas) in enumerate(sheet_frames):
        x = (k % cols) * 112 + 4
        y = (k // cols) * 100 + 4
        sheet.alpha_composite(canvas, (x, y))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save("/tmp/buizel_v1_frames.png")
    print("total", len(sheet_frames), "frames; atlas", atlas.size)


main()
