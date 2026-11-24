"""Slice the Zel surfing spritesheet into one clean, seamless frame atlas.

The art in spritesheets/zel v2 spritesheet.png (the beach-shorts redraw; the
v1 sheet stays on disk for reference) is packed tighter than a 4x4 grid:
boards and spray cross the 224x300 cell seams. Cube-cropping by cell therefore
cuts board tips off and drags pieces of the neighbouring pose into a frame,
which is what made the old atlas flicker.

This version:
  1. finds every alpha island in the sheet;
  2. treats the 16 biggest islands as the 16 poses and maps each to a grid slot;
  3. strips detached slivers so a neighbour's board nose cannot float beside
     the rider;
  4. masks every frame from the pose's own silhouette only;
  5. anchors every frame on the character's torso centre and the board's
     waterline, then repacks all poses into identical frames large enough for
     the widest board. A frame change therefore never shifts or clips the
     rider: the animation is seamless.

Outputs
    assets/zel_atlas.png      16 uniform frames (4x4)
    assets/zel.json           rects, anchor, animation rows
    assets/zel_*.png          hue-shifted rival sheets (same layout)
    /tmp/zel_check.png        calibration sheet with anchors

Run:  python3 tools/slice_zel.py
"""
import colorsys
import json
import statistics
from collections import deque

from PIL import Image, ImageDraw, ImageFilter

SRC = "spritesheets/zel v2 spritesheet.png"
OUT_ATLAS = "assets/zel_atlas.png"
OUT_JSON = "assets/zel.json"

COLS, ROWS = 4, 4
CELL_W, CELL_H = 224, 300
ALPHA_MIN = 24
SOLID = 200
PAD = 16


def load_pixels(im):
    return im.load()


def find_components(px, w, h, min_size=10):
    """8-connected opaque islands, with their pixel list and bounding box."""
    mask = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > ALPHA_MIN:
                mask[y * w + x] = 1
    seen = bytearray(w * h)
    comps = []
    for start in range(w * h):
        if not mask[start] or seen[start]:
            continue
        seen[start] = 1
        q = deque([start])
        pts = []
        x0 = x1 = start % w
        y0 = y1 = start // w
        while q:
            i = q.popleft()
            x, y = i % w, i // w
            pts.append((x, y))
            x0 = min(x0, x); x1 = max(x1, x)
            y0 = min(y0, y); y1 = max(y1, y)
            for dy in (-1, 0, 1):
                yy = y + dy
                if yy < 0 or yy >= h:
                    continue
                for dx in (-1, 0, 1):
                    xx = x + dx
                    if xx < 0 or xx >= w:
                        continue
                    j = yy * w + xx
                    if mask[j] and not seen[j]:
                        seen[j] = 1
                        q.append(j)
        if len(pts) >= min_size:
            comps.append({
                "pts": pts,
                "n": len(pts),
                "bbox": (x0, y0, x1 + 1, y1 + 1),
            })
    return comps


def rect_distance(a, b):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    dx = max(bx0 - ax1, ax0 - bx1, 0)
    dy = max(by0 - ay1, ay0 - by1, 0)
    return (dx * dx + dy * dy) ** 0.5


def slot_for(bbox):
    """The 4x4 cell that holds most of this island."""
    x0, y0, x1, y1 = bbox
    best, best_area = (0, 0), -1
    for r in range(ROWS):
        for c in range(COLS):
            cx0, cy0 = c * CELL_W, r * CELL_H
            cx1, cy1 = cx0 + CELL_W, cy0 + CELL_H
            area = max(0, min(x1, cx1) - max(x0, cx0)) * max(0, min(y1, cy1) - max(y0, cy0))
            if area > best_area:
                best_area, best = area, (r, c)
    return best


def is_fur(px, x, y):
    r, g, b, a = px[x, y]
    return a > SOLID and r > 150 and 50 < g < 178 and b < 125


def pose_anchor(px, pose):
    """(torso centre x, board waterline y) for one pose."""
    x0, y0, x1, y1 = pose["bbox"]
    h = y1 - y0
    # torso/head only: ignore the swaying tail when centring the body
    band = y0 + int(h * 0.52)
    xs = [x for (x, y) in pose["pts"] if y <= band and is_fur(px, x, y)]
    if len(xs) > 40:
        ax = statistics.median(xs)
    else:
        ax = (x0 + x1) / 2
    # the board's lowest opaque pixel is its contact line with the water
    ay = max(y for (_, y) in pose["pts"]) + 1
    return ax, ay


def keep_largest_island(im):
    """Drop any detached sliver (a neighbour's board nose can survive the cell
    crop); a pose must be one solid silhouette."""
    w, h = im.size
    px = im.load()
    raw = Image.new("L", im.size, 0)
    rp = raw.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 24:
                rp[x, y] = 255
    # pinch off the hair-thin bridge that sometimes joins a neighbour's board
    # tip to this pose before choosing the silhouette to keep
    solid = raw.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(3))
    mask = bytearray(w * h)
    sp = solid.load()
    for y in range(h):
        for x in range(w):
            if sp[x, y] > 24:
                mask[y * w + x] = 1
    seen = bytearray(w * h)
    best = []
    for start in range(w * h):
        if not mask[start] or seen[start]:
            continue
        seen[start] = 1
        q = deque([start])
        pts = []
        while q:
            i = q.popleft()
            pts.append((i % w, i // w))
            x, y = i % w, i // w
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < w and 0 <= yy < h:
                        j = yy * w + xx
                        if mask[j] and not seen[j]:
                            seen[j] = 1
                            q.append(j)
        if len(pts) > len(best):
            best = pts
    keep = Image.new("L", im.size, 0)
    kp = keep.load()
    for (x, y) in best:
        kp[x, y] = 255
    keep = keep.filter(ImageFilter.MaxFilter(3))
    kept_alpha = Image.composite(im.getchannel("A"), Image.new("L", im.size, 0), keep)
    out = im.copy()
    out.putalpha(kept_alpha)
    return out


def build():
    sheet = Image.open(SRC).convert("RGBA")
    w, h = sheet.size
    px = load_pixels(sheet)
    comps = find_components(px, w, h)

    comps.sort(key=lambda c: -c["n"])
    big = comps[:16]
    if len(big) < 16:
        raise SystemExit(f"only found {len(big)} poses in the sheet")

    slots = {}
    for comp in big:
        slot = slot_for(comp["bbox"])
        while slot in slots:  # safety: never drop a pose
            slot = ((slot[0] + 1) % ROWS, (slot[1] + 1) % COLS)
        slots[slot] = {"big": comp, "extra": []}

    # Spray droplets are deliberately not glued back on: several of them are
    # fragments of the neighbouring pose's board (the sheet overlaps poses),
    # and they read as floating pieces in game. The rider draws live spray
    # instead, so every frame stays clean.

    # per-pose mask + anchor, then normalise the anchor into a uniform frame
    frames = []
    layers = []
    for slot in sorted(slots):
        pose = slots[slot]
        all_comps = [pose["big"]]
        pts = [p for c in all_comps for p in c["pts"]]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        ax, ay = pose_anchor(px, {"pts": pts, "bbox": box})
        frames.append({"slot": slot, "box": box, "ax": ax, "ay": ay, "pts": pts,
                       "all": all_comps})
        layers.append((box, all_comps))

    # every pose must fit: the frame extends to the FURTHEST content on each
    # side of the shared anchor
    left = max(f["ax"] - f["box"][0] for f in frames)
    right = max(f["box"][2] - f["ax"] for f in frames)
    top = max(f["ay"] - f["box"][1] for f in frames)
    bottom = max(f["box"][3] - f["ay"] for f in frames)
    fw = int(round(left + right)) + PAD * 2
    fh = int(round(top + bottom)) + PAD * 2
    anchor_x = int(round(left)) + PAD
    anchor_y = int(round(top)) + PAD

    atlas = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    decoded = [None] * 16
    for f in frames:
        r, c = f["slot"]
        bx0, by0, bx1, by1 = f["box"]
        local = sheet.crop((bx0, by0, bx1, by1))
        # keep only this pose's islands (drop any neighbour that shares the crop)
        mask = Image.new("L", local.size, 0)
        mp = mask.load()
        for comp in f["all"]:
            for (x, y) in comp["pts"]:
                mp[x - bx0, y - by0] = 255
        local.putalpha(Image.composite(local.getchannel("A"), Image.new("L", local.size, 0), mask))
        local = keep_largest_island(local)

        dst_x = c * fw + anchor_x - (f["ax"] - bx0)
        dst_y = r * fh + anchor_y - (f["ay"] - by0)
        atlas.alpha_composite(local, (int(round(dst_x)), int(round(dst_y))))
        decoded[r * COLS + c] = {
            "x": c * fw, "y": r * fh, "w": fw, "h": fh,
            "ax": anchor_x, "ay": anchor_y,
        }

    # one last sliver sweep per finished cell: a neighbour's board nose can be
    # flush against ours and survive the earlier mask
    for i, fr in enumerate(decoded):
        cell = atlas.crop((fr["x"], fr["y"], fr["x"] + fr["w"], fr["y"] + fr["h"]))
        cleaned = keep_largest_island(cell)
        atlas.paste(cleaned, (fr["x"], fr["y"]))

    # The v2 art already draws its own thin outline around every pose. No
    # contour is dilated on top of it: that doubled the edge into a fat sticker
    # ring, so the atlas is saved exactly as the sheet was drawn.
    atlas.save(OUT_ATLAS)

    def anim(row):
        return list(range(row * COLS, row * COLS + COLS))

    data = {
        "image": "zel_atlas.png",
        "cellW": fw, "cellH": fh,
        "frames": decoded,
        "anims": {
            "up": anim(0),
            "down": anim(1),
            "left": anim(2),
            "right": anim(3),
        },
        "variants": {
            "zel": "zel_atlas.png",
            "roxo": "zel_roxo.png",
            "verde": "zel_verde.png",
            "dourado": "zel_dourado.png",
            "sombra": "zel_sombra.png",
        },
    }
    with open(OUT_JSON, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=1)
    print("atlas", atlas.size, "frame", fw, fh, "anchor", anchor_x, anchor_y)

    # ------------------------------------------------ rival colour variants
    def tint(hue_shift, sat=1.0, val=1.0, darken=1.0, all_pixels=False):
        """Recolour the rider, not the ocean-blue board, unless all_pixels."""
        out = atlas.copy()
        op = out.load()
        for y in range(out.size[1]):
            for x in range(out.size[0]):
                r, g, b, a = op[x, y]
                if a == 0:
                    continue
                hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
                warm = (hh < 0.18 or hh > 0.90) and ss > 0.20 and ll > 0.16
                if not all_pixels and not warm:
                    continue  # board, water and outline keep their palette
                if ss < 0.12 or max(r, g, b) < 58:
                    op[x, y] = (int(r * darken), int(g * darken), int(b * darken), a)
                    continue
                hh = (hh + hue_shift / 360.0) % 1.0
                ss = min(1.0, ss * sat)
                ll = min(0.94, ll * val * darken)
                rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss)
                op[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
        return out

    tint(268, 1.15, 1.02).save("assets/zel_roxo.png")
    tint(118, 1.1, 1.02).save("assets/zel_verde.png")
    tint(38, 1.45, 1.2).save("assets/zel_dourado.png")
    tint(185, 0.55, 0.72, 0.72, all_pixels=True).save("assets/zel_sombra.png")

    # calibration sheet: roomy gutters so nothing looks clipped
    check = Image.new("RGBA", (fw * 4, fh * 4), (22, 34, 54, 255))
    check.alpha_composite(atlas)
    d = ImageDraw.Draw(check)
    for i, fr in enumerate(decoded):
        ax = fr["x"] + fr["ax"]
        ay = fr["y"] + fr["ay"]
        d.line([(ax - 6, ay), (ax + 6, ay)], fill=(255, 70, 70, 255))
        d.line([(ax, ay - 6), (ax, ay + 6)], fill=(255, 70, 70, 255))
        d.text((fr["x"] + 4, fr["y"] + 3), str(i), fill=(240, 246, 255, 255))
    check.save("/tmp/zel_check.png")
    print("wrote /tmp/zel_check.png")


if __name__ == "__main__":
    build()
