"""Generate every tile / prop / UI asset for the sky-island game.

Everything is drawn procedurally at native pixel-art resolution using the
palette extracted from the Buizel sheet, then packed into one atlas.
"""
import json
import math
import os
import random
from PIL import Image, ImageDraw

OUT = "assets"

# Explorers of Sky-flavoured palette: luminous yellow-greens, warm umber
# earth, cool slate stone and deep storybook blues for the UI.
C = {
    "ink": (24, 28, 46), "ink2": (52, 42, 58), "outline": (86, 54, 40),
    "fur0": (182, 59, 24), "fur1": (216, 85, 31), "fur2": (232, 112, 43),
    "fur3": (240, 138, 58), "fur4": (246, 167, 85), "fur5": (255, 201, 120),
    "cream0": (244, 226, 178), "cream1": (253, 242, 206), "cream2": (255, 252, 240),
    "scarf0": (242, 197, 49), "scarf1": (255, 224, 102),
    "blue0": (32, 62, 96), "blue1": (52, 104, 148), "blue2": (86, 154, 196),
    "blue3": (143, 211, 232), "blue4": (201, 238, 247),
    "sky0": (14, 20, 44), "sky1": (24, 38, 78), "sky2": (38, 62, 118),
    "sky3": (58, 94, 166), "sky4": (94, 146, 208), "sky5": (144, 192, 228),
    "sky6": (196, 226, 242),
    "cl0": (245, 249, 252), "cl1": (214, 229, 240), "cl2": (176, 198, 216),
    "cl3": (136, 158, 180),
    "g0": (40, 68, 46), "g1": (58, 98, 54), "g2": (80, 128, 64), "g3": (108, 162, 78),
    "g4": (144, 194, 96), "g5": (184, 218, 126), "g6": (218, 236, 164),
    "d0": (58, 40, 30), "d1": (92, 64, 42), "d2": (124, 88, 56),
    "d3": (158, 118, 76), "d4": (192, 154, 106), "d5": (220, 188, 142),
    "s0": (46, 54, 68), "s1": (68, 78, 94), "s2": (96, 108, 126),
    "s3": (128, 140, 160), "s4": (162, 174, 192), "s5": (200, 210, 224),
    "w0": (26, 72, 112), "w1": (44, 120, 168), "w2": (88, 176, 208), "w3": (150, 220, 236),
    "red": (255, 106, 106), "org": (255, 160, 120), "yel": (255, 226, 110),
    "grn": (140, 224, 140), "vio": (188, 150, 255), "pnk": (255, 176, 210),
    "white": (255, 255, 255),
}

# ------------------------------------------------------------ pastel grade
# A gentle cream wash + desaturation over the generated palette. Outlines stay
# dark so shapes keep their readability; everything else softens like a
# storybook illustration.
_PASTEL_MIX = (252, 242, 230)


def _pastel(rgb, t=0.08, lift=2):
    r, g, b = rgb
    avg = (r + g + b) / 3
    out = []
    for i, c in enumerate((r, g, b)):
        c = c + (avg - c) * 0.12
        c = c + (_PASTEL_MIX[i] - c) * t
        out.append(min(255, round(c + lift)))
    return tuple(out)


for _k in list(C):
    if _k not in ("ink", "ink2", "outline", "white"):
        C[_k] = _pastel(C[_k])

TW, TH = 48, 24          # iso tile footprint
rng = random.Random(20261115)


def new(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def draw_diamond(img, cx, cy, w, h, fill, outline=None, inset=0):
    d = ImageDraw.Draw(img)
    pts = [(cx, cy - h // 2 + inset), (cx + w // 2 - inset, cy),
           (cx, cy + h // 2 - inset), (cx - w // 2 + inset, cy)]
    d.polygon(pts, fill=fill)
    if outline:
        d.line(pts + [pts[0]], fill=outline, width=1)
    return pts


def diamond_mask(w=TW, h=TH):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(
        [(w // 2, 0), (w - 1, h // 2), (w // 2, h - 1), (0, h // 2)], fill=255)
    return m


MASK = diamond_mask()


def dither(img, box, color, step=2, phase=0):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x + y + phase) % step == 0:
                d.point((x, y), fill=color)


def tuft(img, x, y, col, size=2):
    d = ImageDraw.Draw(img)
    d.point((x, y - size), fill=col)
    d.point((x, y - size + 1), fill=col)
    d.point((x - 1, y - 1), fill=col)
    d.point((x + 1, y - 1), fill=col)


# ---------------------------------------------------------------- ground tiles
def tile_grass(variant=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    base = C["g2"] if variant % 2 == 0 else C["g1"]
    draw_diamond(img, TW // 2, TH // 2, TW, TH, base)
    # top-left light band
    for x in range(TW):
        top = abs(x - 24) // 2
        for y in range(top, min(top + 4, 24)):
            if MASK.getpixel((x, y)):
                d.point((x, y), fill=C["g3"] if variant != 2 else C["g4"])
    # soft sunlit cap: a lit rim along the upper faces, like PMD grass
    for x in range(TW):
        top = abs(x - 24) // 2
        if 0 <= top < TH and MASK.getpixel((x, top)):
            d.point((x, top), fill=C["g5"] if x % 5 == 0 else C["g4"])
    # rim shading: soft, broken edge so the field reads as one lawn
    for x in range(TW):
        bot = 23 - abs(x - 24) // 2
        if 0 <= bot < TH and MASK.getpixel((x, bot)):
            d.point((x, bot), fill=C["g1"] if (x + variant) % 3 else C["g0"])
        if 0 <= bot - 1 < TH and MASK.getpixel((x, bot - 1)):
            d.point((x, bot - 1), fill=C["g1"] if (x + variant) % 4 else C["g2"])
    # small rounded leaf clumps scattered across the top face
    for _ in range(5):
        x = rng.randint(7, TW - 8)
        y = rng.randint(5, TH - 7)
        if not MASK.getpixel((x, y)):
            continue
        d.point((x, y), fill=C["g4"])
        d.point((x + 1, y), fill=C["g3"])
        d.point((x, y + 1), fill=C["g3"])
        if MASK.getpixel((x + 1, y + 1)):
            d.point((x + 1, y + 1), fill=C["g2"])
    for _ in range(10):
        x = rng.randint(6, TW - 7)
        y = rng.randint(4, TH - 5)
        if MASK.getpixel((x, y)):
            tuft(img, x, y, C["g1"] if variant % 2 == 0 else C["g3"], rng.choice([2, 3]))
    if variant == 1:
        for _ in range(3):
            x, y = rng.randint(10, 36), rng.randint(6, 18)
            d.point((x, y), fill=C["white"])
            d.point((x - 1, y), fill=C["scarf1"])
            d.point((x, y + 1), fill=C["scarf0"])
    if variant == 2:
        for _ in range(4):
            x, y = rng.randint(9, 37), rng.randint(6, 18)
            d.ellipse([x - 1, y - 2, x + 1, y], fill=C["pnk"])
            d.point((x, y - 2), fill=C["white"])
    if variant == 3:
        for _ in range(2):
            x, y = rng.randint(10, 36), rng.randint(5, 17)
            d.polygon([(x, y - 3), (x + 2, y), (x, y + 2), (x - 2, y)], fill=C["s3"])
            d.point((x - 1, y - 1), fill=C["s5"])
    return img


def tile_soil(wet=False, plain=False):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    base = C["d1"] if wet else C["d2"]
    draw_diamond(img, TW // 2, TH // 2, TW, TH, base)
    dark = C["d0"] if wet else C["d1"]
    light = C["d3"] if not wet else C["d2"]
    if not plain:
        for k in range(3):
            off = 4 + k * 5
            for x in range(TW):
                top = abs(x - 24) // 2
                y = top + off
                if 0 <= y < TH and MASK.getpixel((x, y)):
                    d.point((x, y), fill=dark)
                    if MASK.getpixel((x, min(TH - 1, y + 2))):
                        d.point((x, y + 2), fill=light)
    for _ in range(16):
        x, y = rng.randint(6, TW - 7), rng.randint(4, TH - 5)
        if MASK.getpixel((x, y)):
            d.point((x, y), fill=dark if rng.random() < .6 else light)
    if wet:
        for _ in range(5):
            x, y = rng.randint(8, 38), rng.randint(5, 18)
            if MASK.getpixel((x, y)):
                d.point((x, y), fill=C["w2"])
                d.point((x + 1, y), fill=C["w3"])
    for x in range(TW):
        bot = 23 - abs(x - 24) // 2
        for y in (bot, bot - 1):
            if 0 <= y < TH and MASK.getpixel((x, y)):
                d.point((x, y), fill=C["d0"])
    return img


def tile_stone(variant=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, TW // 2, TH // 2, TW, TH, C["s2"])
    for _ in range(14):
        x, y = rng.randint(4, TW - 5), rng.randint(2, TH - 3)
        if MASK.getpixel((x, y)):
            d.point((x, y), fill=C["s3"] if rng.random() < .7 else C["s1"])
    for _ in range(5):
        x, y = rng.randint(6, TW - 7), rng.randint(3, TH - 4)
        d.line([(x, y), (x + rng.randint(3, 6), y + rng.randint(0, 2))], fill=C["s1"])
    if variant:
        for _ in range(4):
            x, y = rng.randint(9, 37), rng.randint(5, 17)
            d.point((x, y), fill=C["g2"])
    for x in range(TW):
        top = abs(x - 24) // 2
        for y in range(top, top + 2):
            if MASK.getpixel((x, y)):
                d.point((x, y), fill=C["s4"])
    return img


def tile_water(frame=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, TW // 2, TH // 2, TW, TH, C["w1"])
    for k in range(3):
        off = 5 + k * 6
        for x in range(TW):
            top = abs(x - 24) // 2
            y = top + off + (frame * 2 + k) % 4
            if 0 <= y < TH - 1 and MASK.getpixel((x, y)):
                d.point((x, y), fill=C["w2"])
        for x in range(3, TW - 3):
            top = abs(x - 24) // 2
            y = top + off + 2 + (frame + k * 2) % 5
            if 0 <= y < TH - 2 and MASK.getpixel((x, y)) and (x // 3) % 2 == 0:
                d.point((x, y), fill=C["w3"])
    for x in range(TW):
        top = abs(x - 24) // 2
        if MASK.getpixel((x, top)):
            d.point((x, top), fill=C["w3"])
    return img


def tile_cloudpad(variant=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, TW // 2, TH // 2, TW, TH, C["cl0"])
    for x in range(TW):
        top = abs(x - 24) // 2
        for y in range(top, top + 5):
            if MASK.getpixel((x, y)):
                d.point((x, y), fill=C["white"] if (x + y) % 3 else C["cl0"])
    for _ in range(9):
        x, y = rng.randint(7, 40), rng.randint(6, 19)
        if MASK.getpixel((x, y)):
            d.ellipse([x - 2, y - 1, x + 2, y + 1], fill=C["cl1"])
    for x in range(TW):
        bot = 23 - abs(x - 24) // 2
        for y in (bot, bot - 1):
            if 0 <= y < TH and MASK.getpixel((x, y)):
                d.point((x, y), fill=C["cl2"])
    if variant:
        for _ in range(3):
            x, y = rng.randint(12, 34), rng.randint(8, 16)
            d.point((x, y), fill=C["scarf0"])
            d.point((x - 1, y), fill=C["scarf1"])
    return img


def clay_rim(img, color, depth=2):
    d = ImageDraw.Draw(img)
    for x in range(TW):
        bot = 23 - abs(x - 24) // 2
        for y in range(bot - depth + 1, bot + 1):
            if 0 <= y < TH and MASK.getpixel((x, y)):
                d.point((x, y), fill=color)


# ---------------------------------------------------------------- cliff sides
def cliff_band(tip=False, variant=0):
    """One 24px-tall wall segment whose top edge follows the tile's bottom V.

    Row 0 of the image lines up with the tile's top vertex, so the renderer can
    just draw it at tileTop + k*24 to build a cliff of any depth.
    """
    h = 48
    img = new(TW, h)
    d = ImageDraw.Draw(img)
    for x in range(TW):
        top = 24 - abs(x - 24) // 2
        bottom = top + 22
        if tip:
            shrink = int(abs(x - 24) / 24 * 12)
            bottom = top + 22 - shrink
        for y in range(top, bottom + 1):
            band = (y - top) // 3
            if tip:
                col = [C["s1"], C["s0"], C["d1"]][min(2, band // 2)]
            else:
                col = [C["d2"], C["d1"], C["d3"], C["d2"], C["s2"], C["s1"]][band % 6]
            d.point((x, y), fill=col)
    # strata flecks / embedded stones
    for _ in range(26):
        x = rng.randint(0, TW - 1)
        top = abs(x - 24) // 2
        y = rng.randint(top + 1, min(top + 21, h - 2))
        d.point((x, y), fill=rng.choice([C["d0"], C["s3"], C["d4"], C["s2"]]))
    # grass lip on the top edge
    for x in range(TW):
        top = abs(x - 24) // 2
        d.point((x, top), fill=C["g2"])
        d.point((x, top + 1), fill=C["g1"])
        if x % 4 == 0:
            d.point((x, top + 2), fill=C["g0"])
    if variant % 2:
        for _ in range(3):
            x = rng.randint(6, 40)
            top = abs(x - 24) // 2
            for k in range(3):
                d.point((x, min(h - 1, top + 6 + k)), fill=C["g2"] if k == 0 else C["g1"])
    return img


# ---------------------------------------------------------------- props
def tree(chopped=False):
    w, h = 76, 104
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # shadow-less billboard, anchored bottom centre
    trunk_top = 62
    for i in range(trunk_top, h - 4):
        t = (i - trunk_top) / max(1, h - 4 - trunk_top)
        half = 4 + int(t * 4)
        for x in range(w // 2 - half, w // 2 + half):
            col = C["d2"] if (x - w // 2 + half) > half else C["d3"]
            d.point((x, i), fill=col)
            if x < w // 2 - half + 2:
                d.point((x, i), fill=C["d1"])
    d.rectangle([w // 2 - 8, h - 6, w // 2 + 7, h - 3], fill=C["d1"])
    d.rectangle([w // 2 - 8, h - 6, w // 2 + 7, h - 5], fill=C["d2"])
    # roots
    d.line([(w // 2 - 8, h - 6), (w // 2 - 13, h - 2)], fill=C["d1"])
    d.line([(w // 2 + 8, h - 6), (w // 2 + 13, h - 2)], fill=C["d1"])

    if not chopped:
        blobs = [(38, 30, 26, 20), (20, 40, 16, 13), (56, 40, 16, 13),
                 (30, 18, 16, 12), (48, 20, 15, 11), (38, 44, 20, 13)]
        for (cx, cy, rx, ry) in blobs:
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=C["g1"])
        for (cx, cy, rx, ry) in blobs:
            d.ellipse([cx - rx + 2, cy - ry + 1, cx + rx - 3, cy + ry - 4], fill=C["g2"])
        for (cx, cy, rx, ry) in blobs:
            d.ellipse([cx - rx + 5, cy - ry + 3, cx + rx - 7, cy + ry - 6], fill=C["g3"])
        # leafy texture
        for _ in range(55):
            x = rng.randint(6, w - 7)
            y = rng.randint(6, 56)
            if img.getpixel((x, y))[3] and img.getpixel((x, y))[1] > 90:
                img.putpixel((x, y), rng.choice([C["g0"], C["g1"], C["g3"], C["g4"]]))
        # highlight crests + warm rim light on the upper-left of each clump
        for _ in range(30):
            x = rng.randint(10, w - 11)
            y = rng.randint(8, 34)
            if img.getpixel((x, y))[3] and img.getpixel((x, y))[1] > 100:
                img.putpixel((x, y), C["g4"])
        # soft clustered highlights on the sunlit side of each leaf clump
        for (cx, cy, rx, ry) in blobs:
            hx = int(cx - rx * 0.28)
            hy = int(cy - ry * 0.4)
            d.ellipse([hx - int(rx * 0.4), hy - int(ry * 0.36),
                       hx + int(rx * 0.4), hy + int(ry * 0.36)], fill=C["g4"])
        for _ in range(26):
            x = rng.randint(10, w - 11)
            y = rng.randint(10, 38)
            if img.getpixel((x, y))[3] and img.getpixel((x, y))[1] > 130:
                img.putpixel((x, y), C["g5"])
                if rng.random() < 0.35:
                    img.putpixel((x, y - 1), C["g6"])
        # Oran fruit
        for (fx, fy) in [(22, 34), (52, 30), (40, 46), (58, 46), (16, 46)]:
            d.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=C["fur1"])
            d.ellipse([fx - 2, fy - 3, fx + 2, fy + 1], fill=C["fur2"])
            d.point((fx - 1, fy - 2), fill=C["fur5"])
            d.point((fx + 1, fy - 4), fill=C["g2"])
    else:
        # bare trunk + a couple of branches
        d.line([(w // 2, 30), (w // 2 - 14, 20)], fill=C["d2"], width=3)
        d.line([(w // 2, 34), (w // 2 + 15, 24)], fill=C["d2"], width=3)
        d.rectangle([w // 2 - 6, 40, w // 2 + 5, 52], fill=C["d1"])
        # axe cut
        d.polygon([(w // 2 - 6, 44), (w // 2 + 5, 40), (w // 2 + 5, 47), (w // 2 - 6, 50)],
                  fill=C["cream1"])
    return img


def stump():
    img = new(44, 30)
    d = ImageDraw.Draw(img)
    d.ellipse([4, 12, 40, 28], fill=C["d1"])
    d.rectangle([6, 10, 38, 22], fill=C["d2"])
    d.ellipse([6, 4, 38, 20], fill=C["d3"])
    d.ellipse([12, 8, 32, 17], fill=C["d4"])
    d.ellipse([17, 10, 27, 15], fill=C["d3"])
    for x in range(8, 38, 3):
        d.point((x, 23), fill=C["d1"])
    return img


def rock(size="big"):
    dims = {"big": (52, 40), "mid": (38, 30), "small": (26, 20)}[size]
    w, h = dims
    img = new(w, h)
    d = ImageDraw.Draw(img)
    base = [(w // 2, 2), (w - 4, h // 3), (w - 8, h - 4), (w // 2 + 4, h - 2),
            (6, h - 5), (2, h // 3)]
    d.polygon(base, fill=C["s2"])
    d.polygon([(w // 2, 2), (w - 4, h // 3), (w // 2, h // 2), (8, h // 3)], fill=C["s3"])
    d.polygon([(w // 2, h // 2), (w - 8, h - 4), (w // 2 + 4, h - 2)], fill=C["s1"])
    d.polygon([(w // 2, h // 2), (6, h - 5), (w // 2 + 4, h - 2)], fill=C["s1"])
    for _ in range(w * h // 12):
        x, y = rng.randint(3, w - 4), rng.randint(4, h - 3)
        if img.getpixel((x, y))[3]:
            img.putpixel((x, y), rng.choice([C["s1"], C["s3"], C["s4"]]))
    d.line([(w // 2 - 6, 10), (w // 2 + 2, 18)], fill=C["s1"])
    d.line([(w // 2 + 4, 16), (w - 10, h - 8)], fill=C["s0"])
    for _ in range(4):
        x = rng.randint(6, w - 8)
        d.point((x, h - 3), fill=C["g2"] if rng.random() < .5 else C["d2"])
    return img


def crop(kind, stage):
    """stage 0..3, anchored at bottom centre."""
    w, h = 34, 44
    img = new(w, h)
    d = ImageDraw.Draw(img)
    base_y = h - 4
    grow = [0.35, 0.6, 0.85, 1.0][stage]
    if kind == "oran":
        d.ellipse([w // 2 - 9, base_y - 3, w // 2 + 9, base_y + 3], fill=C["d1"])
        stem_h = int(16 * grow)
        d.line([(w // 2, base_y), (w // 2, base_y - stem_h)], fill=C["g1"], width=2)
        r = max(2, int(7 * grow))
        for dx in (-1, 1):
            cx = w // 2 + dx * r
            d.ellipse([cx - r, base_y - stem_h - r, cx + r, base_y - stem_h + r - 2],
                      fill=C["g2"])
            if r >= 3:
                d.ellipse([cx - r + 2, base_y - stem_h - r + 1,
                           cx + r - 2, base_y - stem_h + r - 4], fill=C["g3"])
        if stage == 3:
            for (fx, fy) in ((w // 2 - 7, base_y - 18), (w // 2 + 6, base_y - 14),
                             (w // 2 - 2, base_y - 24)):
                d.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=C["fur1"])
                d.ellipse([fx - 2, fy - 3, fx + 2, fy + 1], fill=C["fur2"])
                d.point((fx - 1, fy - 2), fill=C["fur5"])
    elif kind == "wheat":
        d.ellipse([w // 2 - 10, base_y - 3, w // 2 + 10, base_y + 3], fill=C["d1"])
        n = 3 + stage
        for i in range(n):
            x = w // 2 + (i - n // 2) * 4
            hh = int((10 + stage * 5) * (0.75 + rng.random() * .5))
            d.line([(x, base_y), (x, base_y - hh)], fill=C["g2"])
            if stage >= 2:
                col = C["scarf1"] if stage == 3 else C["g4"]
                for k in range(3):
                    d.point((x, base_y - hh - k), fill=col)
                    d.point((x - 1, base_y - hh - k + 1), fill=C["scarf0"] if stage == 3 else C["g3"])
                    d.point((x + 1, base_y - hh - k + 1), fill=C["scarf0"] if stage == 3 else C["g3"])
    elif kind == "sun":
        d.ellipse([w // 2 - 10, base_y - 3, w // 2 + 10, base_y + 3], fill=C["d1"])
        stem_h = int(14 * grow)
        d.line([(w // 2, base_y), (w // 2, base_y - stem_h)], fill=C["g1"], width=2)
        for dx in (-1, 1):
            d.ellipse([w // 2 + dx * 8 - 5, base_y - 7, w // 2 + dx * 8 + 5, base_y - 1], fill=C["g2"])
        r = int(3 + stage * 2.6)
        if stage < 3:
            d.ellipse([w // 2 - r, base_y - stem_h - r, w // 2 + r, base_y - stem_h + r], fill=C["g3"])
            d.ellipse([w // 2 - r + 2, base_y - stem_h - r + 1, w // 2 + r - 2, base_y - stem_h + r - 3], fill=C["g4"])
        else:
            d.ellipse([w // 2 - 10, base_y - stem_h - 20, w // 2 + 10, base_y - stem_h], fill=C["fur1"])
            d.ellipse([w // 2 - 9, base_y - stem_h - 19, w // 2 + 6, base_y - stem_h - 4], fill=C["fur2"])
            d.ellipse([w // 2 - 6, base_y - stem_h - 17, w // 2 + 2, base_y - stem_h - 11], fill=C["fur5"])
            for k in range(3):
                d.line([(w // 2 - 8 + k * 7, base_y - stem_h - 19),
                        (w // 2 - 4 + k * 6, base_y - stem_h - 1)], fill=C["fur0"])
            d.line([(w // 2, base_y - stem_h - 20), (w // 2 + 2, base_y - stem_h - 24)], fill=C["g2"])
    elif kind == "moon":
        d.ellipse([w // 2 - 9, base_y - 3, w // 2 + 9, base_y + 3], fill=C["d1"])
        grow_h = int(10 + stage * 6)
        d.rectangle([w // 2 - 2, base_y - grow_h, w // 2 + 2, base_y], fill=C["cream1"])
        r = int(3 + stage * 2.2)
        if stage >= 1:
            d.ellipse([w // 2 - r - 2, base_y - grow_h - r, w // 2 + r + 2, base_y - grow_h + r],
                      fill=C["blue2"] if stage < 3 else C["vio"])
            d.ellipse([w // 2 - r, base_y - grow_h - r + 1, w // 2 + r - 3, base_y - grow_h + r - 3],
                      fill=C["blue3"] if stage < 3 else C["pnk"])
            for p in ((w // 2 - 2, base_y - grow_h - 2), (w // 2 + 3, base_y - grow_h + 1)):
                d.point(p, fill=C["white"] if stage == 3 else C["blue4"])
        if stage == 3:
            for _ in range(5):
                d.point((w // 2 + rng.randint(-10, 10), base_y - grow_h + rng.randint(-8, 8)), fill=C["blue4"])
    else:  # glowflower
        d.ellipse([w // 2 - 9, base_y - 3, w // 2 + 9, base_y + 3], fill=C["d1"])
        stem_h = int(18 * grow)
        d.line([(w // 2, base_y), (w // 2, base_y - stem_h)], fill=C["g1"])
        d.ellipse([w // 2 - 5, base_y - stem_h - 4, w // 2 - 1, base_y - stem_h + 2], fill=C["g2"])
        if stage >= 1:
            r = 2 + stage * 2
            col = C["vio"] if stage < 3 else C["pnk"]
            for a in range(5):
                ang = a / 5 * math.tau
                fx = w // 2 + math.cos(ang) * r
                fy = base_y - stem_h - 2 + math.sin(ang) * r
                d.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=col)
            d.ellipse([w // 2 - 2, base_y - stem_h - 4, w // 2 + 2, base_y - stem_h],
                      fill=C["yel"] if stage == 3 else C["cream1"])
            if stage == 3:
                for _ in range(6):
                    x = w // 2 + rng.randint(-8, 8)
                    y = base_y - stem_h + rng.randint(-9, 6)
                    d.point((x, y), fill=C["white"])
    # soil mound
    for x in range(w // 2 - 11, w // 2 + 11):
        for y in range(base_y - 1, base_y + 3):
            d.point((x, y), fill=C["d2"] if (x + y) % 3 else C["d1"])
    return img


def fence(kind="h"):
    img = new(44, 36)
    d = ImageDraw.Draw(img)
    if kind == "h":
        d.rectangle([2, 12, 42, 15], fill=C["d3"])
        d.rectangle([2, 12, 42, 13], fill=C["d4"])
        d.rectangle([2, 22, 42, 25], fill=C["d3"])
        d.rectangle([2, 22, 42, 23], fill=C["d4"])
        for x in (4, 22, 40):
            d.rectangle([x - 2, 6, x + 2, 34], fill=C["d2"])
            d.rectangle([x - 2, 6, x - 1, 34], fill=C["d4"])
            d.polygon([(x - 2, 6), (x + 2, 6), (x, 2)], fill=C["d3"])
    else:
        for x in (14, 26):
            d.rectangle([x - 3, 8, x + 3, 34], fill=C["d2"])
            d.rectangle([x - 3, 8, x - 1, 34], fill=C["d4"])
        d.line([(4, 14), (40, 26)], fill=C["d3"], width=3)
        d.line([(4, 26), (40, 14)], fill=C["d3"], width=3)
    return img


def lantern():
    img = new(28, 66)
    d = ImageDraw.Draw(img)
    d.rectangle([11, 24, 16, 64], fill=C["d2"])
    d.rectangle([11, 24, 12, 64], fill=C["d3"])
    d.ellipse([8, 60, 19, 65], fill=C["d1"])
    d.rectangle([6, 14, 21, 26], fill=C["s1"])
    d.rectangle([7, 15, 20, 25], fill=C["scarf1"])
    d.rectangle([9, 17, 18, 23], fill=C["white"])
    d.rectangle([5, 12, 22, 15], fill=C["s2"])
    d.rectangle([8, 9, 19, 12], fill=C["s1"])
    d.point((14, 8), fill=C["s3"])
    return img


def campfire(frame=0):
    img = new(44, 40)
    d = ImageDraw.Draw(img)
    for i, (x0, x1) in enumerate([(4, 40), (10, 34)]):
        d.rectangle([x0, 26 + i * 6, x1, 30 + i * 6], fill=C["d2"])
        d.rectangle([x0, 26 + i * 6, x1, 27 + i * 6], fill=C["d4"])
    d.ellipse([6, 28, 38, 38], fill=C["d1"])
    h = 20 + (frame % 2) * 4
    flame = [(22, 26 - h), (30, 20), (28, 27), (34, 22), (30, 32), (14, 30),
             (16, 24), (10, 27), (18, 19)]
    d.polygon(flame, fill=C["fur1"])
    d.polygon([(22, 24 - h + 4), (28, 22), (26, 28), (30, 26), (26, 32), (18, 30),
               (20, 25), (17, 26)], fill=C["scarf0"])
    d.polygon([(22, 22 - h + 8), (25, 24), (23, 30), (20, 26)], fill=C["cream1"])
    for _ in range(5):
        d.point((rng.randint(14, 32), rng.randint(6, 18)), fill=C["yel"])
    return img


def tent():
    img = new(96, 72)
    d = ImageDraw.Draw(img)
    d.polygon([(48, 2), (94, 60), (2, 60)], fill=C["fur2"])
    d.polygon([(48, 2), (48, 60), (2, 60)], fill=C["fur3"])
    d.polygon([(48, 12), (80, 60), (48, 60)], fill=C["cream0"])
    d.polygon([(48, 12), (48, 60), (16, 60)], fill=C["cream1"])
    d.line([(48, 2), (94, 60)], fill=C["fur0"], width=2)
    d.line([(48, 2), (2, 60)], fill=C["fur1"], width=2)
    d.rectangle([0, 58, 95, 63], fill=C["d2"])
    d.rectangle([0, 58, 95, 59], fill=C["d4"])
    d.rectangle([46, 40, 52, 60], fill=C["fur1"])
    d.point((58, 26), fill=C["scarf1"])
    d.point((60, 30), fill=C["scarf0"])
    return img


def bench():
    img = new(56, 46)
    d = ImageDraw.Draw(img)
    d.rectangle([4, 6, 52, 22], fill=C["d3"])
    d.rectangle([4, 6, 52, 9], fill=C["d4"])
    d.rectangle([6, 22, 50, 26], fill=C["d2"])
    for x in (8, 46):
        d.rectangle([x - 2, 24, x + 2, 44], fill=C["d2"])
        d.rectangle([x - 2, 24, x - 1, 44], fill=C["d3"])
    # hammer + plank detail on top
    d.rectangle([14, 2, 32, 6], fill=C["d4"])
    d.rectangle([34, 0, 40, 8], fill=C["s2"])
    d.rectangle([34, 0, 40, 2], fill=C["s4"])
    d.rectangle([40, 3, 47, 5], fill=C["d2"])
    return img


def chest():
    img = new(40, 34)
    d = ImageDraw.Draw(img)
    d.rectangle([2, 6, 38, 32], fill=C["d2"])
    d.rectangle([2, 6, 38, 12], fill=C["d3"])
    for x in (4, 34):
        d.rectangle([x, 6, x + 4, 32], fill=C["s2"])
    d.rectangle([16, 12, 24, 22], fill=C["scarf0"])
    d.rectangle([18, 14, 22, 20], fill=C["scarf1"])
    d.rectangle([2, 4, 38, 7], fill=C["d4"])
    d.point((20, 30), fill=C["d0"])
    return img


def sign():
    img = new(34, 44)
    d = ImageDraw.Draw(img)
    d.rectangle([15, 20, 20, 42], fill=C["d2"])
    d.rectangle([2, 4, 32, 24], fill=C["d3"])
    d.rectangle([2, 4, 32, 7], fill=C["d4"])
    d.rectangle([3, 7, 31, 23], fill=C["d2"])
    d.line([(6, 11), (26, 11)], fill=C["d4"])
    d.line([(6, 15), (22, 15)], fill=C["d4"])
    d.line([(6, 19), (18, 19)], fill=C["d4"])
    d.rectangle([15, 0, 21, 5], fill=C["d1"])
    return img


def well():
    img = new(48, 52)
    d = ImageDraw.Draw(img)
    d.ellipse([6, 30, 42, 48], fill=C["s2"])
    d.ellipse([8, 28, 40, 42], fill=C["s3"])
    d.ellipse([12, 30, 36, 40], fill=C["w1"])
    d.ellipse([15, 32, 33, 38], fill=C["w2"])
    for x in (8, 38):
        d.rectangle([x - 2, 8, x + 2, 34], fill=C["d2"])
        d.rectangle([x - 2, 8, x - 1, 34], fill=C["d3"])
    d.polygon([(2, 10), (46, 10), (24, 0)], fill=C["d1"])
    d.line([(24, 12), (24, 22)], fill=C["cream0"])
    d.rectangle([20, 20, 28, 28], fill=C["d2"])
    d.rectangle([20, 20, 28, 22], fill=C["d4"])
    return img


def sprinkler():
    img = new(38, 30)
    d = ImageDraw.Draw(img)
    d.ellipse([6, 20, 32, 28], fill=C["s2"])
    d.rectangle([16, 8, 22, 22], fill=C["s3"])
    d.rectangle([10, 4, 28, 10], fill=C["s2"])
    d.rectangle([11, 5, 27, 7], fill=C["s4"])
    for x in (6, 30):
        d.ellipse([x - 3, 6, x + 3, 12], fill=C["s2"])
        d.point((x, 7), fill=C["w3"])
    d.point((19, 11), fill=C["scarf1"])
    return img


def scarecrow():
    img = new(44, 62)
    d = ImageDraw.Draw(img)
    d.rectangle([20, 16, 24, 60], fill=C["d2"])
    d.rectangle([4, 20, 40, 24], fill=C["d2"])
    d.rectangle([4, 20, 40, 21], fill=C["d4"])
    d.rectangle([12, 24, 32, 44], fill=C["fur2"])
    d.rectangle([12, 24, 16, 44], fill=C["fur3"])
    d.rectangle([26, 24, 32, 44], fill=C["fur1"])
    d.ellipse([13, 6, 31, 26], fill=C["cream0"])
    d.ellipse([16, 9, 28, 24], fill=C["cream1"])
    d.point((19, 15), fill=C["ink"])
    d.point((25, 15), fill=C["ink"])
    d.line([(20, 20), (24, 20)], fill=C["outline"])
    d.rectangle([13, 4, 31, 9], fill=C["scarf0"])
    d.rectangle([13, 4, 31, 5], fill=C["scarf1"])
    d.polygon([(22, 0), (36, 6), (22, 8)], fill=C["scarf0"])
    return img


def pet(frame=0):
    """Pip — a little cloud critter companion."""
    img = new(26, 24)
    d = ImageDraw.Draw(img)
    bob = [0, -1, 0, 1][frame % 4]
    cx, cy = 13, 13 + bob
    d.ellipse([cx - 9, cy - 6, cx + 9, cy + 7], fill=C["cl1"])
    d.ellipse([cx - 8, cy - 6, cx + 8, cy + 3], fill=C["cl0"])
    d.ellipse([cx - 6, cy - 10, cx + 6, cy + 1], fill=C["white"])
    for x in (cx - 10, cx + 10):
        d.ellipse([x - 2, cy - 2, x + 2, cy + 2], fill=C["cl1"])
    d.point((cx - 3, cy - 1), fill=C["ink"])
    d.point((cx + 3, cy - 1), fill=C["ink"])
    d.point((cx - 4, cy - 2), fill=C["white"])
    d.point((cx + 2, cy - 2), fill=C["white"])
    d.line([(cx - 2, cy + 2), (cx + 2, cy + 2)], fill=C["cl3"])
    d.point((cx - 6, cy + 2), fill=C["pnk"])
    d.point((cx + 6, cy + 2), fill=C["pnk"])
    return img


def lyre():
    img = new(34, 40)
    d = ImageDraw.Draw(img)
    d.arc([2, 2, 32, 34], start=200, end=340, fill=C["d3"], width=3)
    d.line([(4, 8), (10, 36)], fill=C["d2"], width=3)
    d.line([(30, 8), (24, 36)], fill=C["d2"], width=3)
    d.rectangle([8, 32, 26, 37], fill=C["d3"])
    d.rectangle([8, 32, 26, 33], fill=C["d5"])
    for i in range(5):
        x = 11 + i * 3
        d.line([(x, 9), (x, 33)], fill=C["cream1"])
    d.rectangle([12, 0, 22, 4], fill=C["d2"])
    d.point((17, 2), fill=C["scarf1"])
    return img


def chime():
    img = new(26, 44)
    d = ImageDraw.Draw(img)
    d.line([(3, 2), (23, 2)], fill=C["d2"], width=2)
    d.line([(13, 2), (13, 8)], fill=C["d1"])
    for i, x in enumerate((6, 13, 20)):
        ln = 12 + i * 5
        d.line([(x, 6), (x, 6 + ln)], fill=C["cream0"])
        d.ellipse([x - 2, 4 + ln, x + 2, 10 + ln], fill=C["scarf0"] if i % 2 else C["blue3"])
        d.point((x, 6 + ln // 2), fill=C["d3"])
    return img


def shrine():
    img = new(58, 78)
    d = ImageDraw.Draw(img)
    d.ellipse([2, 66, 56, 77], fill=C["s1"])
    d.rectangle([6, 44, 22, 68], fill=C["s2"])
    d.rectangle([36, 44, 52, 68], fill=C["s2"])
    d.rectangle([6, 44, 10, 68], fill=C["s4"])
    d.rectangle([36, 44, 40, 68], fill=C["s4"])
    d.rectangle([2, 36, 56, 46], fill=C["s3"])
    d.rectangle([2, 36, 56, 39], fill=C["s5"])
    d.polygon([(4, 36), (54, 36), (44, 24), (14, 24)], fill=C["s2"])
    d.polygon([(4, 36), (54, 36), (48, 31), (10, 31)], fill=C["s4"])
    for _ in range(14):
        x, y = rng.randint(6, 52), rng.randint(40, 67)
        d.point((x, y), fill=rng.choice([C["s1"], C["s3"], C["g1"]]))
    # crystal
    d.rectangle([26, 22, 32, 40], fill=C["blue1"])
    d.polygon([(26, 22), (29, 8), (32, 22)], fill=C["blue2"])
    d.polygon([(29, 8), (32, 22), (30, 26)], fill=C["blue3"])
    d.point((29, 14), fill=C["white"])
    d.point((29, 30), fill=C["blue4"])
    return img


def hive():
    img = new(30, 36)
    d = ImageDraw.Draw(img)
    d.line([(15, 0), (15, 10)], fill=C["d2"], width=2)
    d.ellipse([3, 8, 27, 34], fill=C["scarf0"])
    d.ellipse([5, 10, 25, 28], fill=C["scarf1"])
    for y in (15, 20, 25):
        d.arc([5, y - 4, 25, y + 4], start=0, end=180, fill=C["d3"])
    d.ellipse([11, 24, 19, 32], fill=C["d2"])
    for _ in range(3):
        d.point((rng.randint(6, 24), rng.randint(10, 22)), fill=C["d4"])
    return img


def shard():
    img = new(16, 20)
    d = ImageDraw.Draw(img)
    d.polygon([(8, 0), (14, 9), (8, 19), (2, 9)], fill=C["scarf0"])
    d.polygon([(8, 0), (14, 9), (8, 9)], fill=C["scarf1"])
    d.line([(8, 2), (8, 15)], fill=C["cream2"])
    return img


def deco_flower(kind=0):
    img = new(20, 22)
    d = ImageDraw.Draw(img)
    cols = [C["pnk"], C["scarf1"], C["vio"]]
    d.line([(10, 12), (10, 20)], fill=C["g2"])
    d.point((8, 16), fill=C["g3"])
    d.point((11, 18), fill=C["g3"])
    col = cols[kind % 3]
    d.ellipse([5, 4, 15, 14], fill=col)
    d.ellipse([7, 6, 13, 12], fill=C["cream2"] if kind != 1 else C["yel"])
    d.point((10, 9), fill=C["scarf0"])
    return img


def deco_mushroom():
    img = new(18, 18)
    d = ImageDraw.Draw(img)
    d.rectangle([7, 9, 11, 17], fill=C["cream0"])
    d.ellipse([1, 2, 17, 12], fill=C["red"])
    d.ellipse([3, 4, 15, 10], fill=C["org"])
    for p in [(5, 6), (12, 5), (9, 8)]:
        d.point(p, fill=C["cream2"])
    return img


def deco_pebbles():
    img = new(22, 12)
    d = ImageDraw.Draw(img)
    d.ellipse([1, 4, 8, 11], fill=C["s3"])
    d.ellipse([2, 5, 7, 9], fill=C["s4"])
    d.ellipse([10, 6, 20, 11], fill=C["s2"])
    return img


def cloud(size="big", variant=0):
    dims = {"big": (168, 64), "mid": (112, 44), "small": (68, 28)}[size]
    w, h = dims
    img = new(w, h)
    d = ImageDraw.Draw(img)
    bumps = {"big": [(46, 34, 30), (86, 26, 34), (124, 34, 26), (24, 40, 18)],
             "mid": [(34, 22, 22), (66, 18, 26), (92, 24, 16)],
             "small": [(22, 14, 14), (46, 12, 16)]}[size]
    for (cx, cy, r) in bumps:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=C["cl1"])
    d.rectangle([10, h // 2, w - 10, h - 6], fill=C["cl1"])
    for (cx, cy, r) in bumps:
        d.ellipse([cx - r + 3, cy - r + 1, cx + r - 4, cy + r - 8], fill=C["cl0"])
    d.rectangle([16, h // 2 + 2, w - 16, h - 10], fill=C["cl0"])
    for _ in range(w // 3):
        x = rng.randint(6, w - 7)
        y = rng.randint(h // 3, h - 7)
        if img.getpixel((x, y))[3]:
            img.putpixel((x, y), C["white"] if (x + y) % 5 == 0 else C["cl0"])
    # soft underside
    for x in range(w):
        for y in (h - 7, h - 6):
            if img.getpixel((x, y))[3]:
                img.putpixel((x, y), C["cl2"])
    if variant:
        for _ in range(3):
            x = rng.randint(14, w - 15)
            img.putpixel((x, h - 8), C["cl3"])
    return img


def far_island(variant=0):
    """Distant floating island, silhouetted for atmospheric depth."""
    w, h = 140, 96
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # grassy top
    top = [(10, 44), (26, 34), (48, 30), (74, 27), (98, 31), (120, 38),
           (130, 46), (118, 50), (96, 53), (66, 55), (34, 52), (14, 49)]
    d.polygon(top, fill=C["sky4"])
    d.polygon([(24, 40), (46, 33), (72, 30), (96, 34), (114, 41), (92, 43),
               (64, 45), (40, 44)], fill=C["sky5"])
    # rocky underside tapering to a ragged point
    body = [(14, 48), (34, 52), (66, 55), (96, 53), (118, 50), (108, 64),
            (92, 76), (72, 88), (54, 78), (38, 68), (22, 58)]
    d.polygon(body, fill=C["sky3"])
    d.polygon([(66, 55), (96, 53), (118, 50), (108, 64), (90, 74), (72, 82)],
              fill=C["sky2"])
    for _ in range(26):
        x = rng.randint(20, 112)
        y = rng.randint(56, 82)
        if img.getpixel((x, y))[3]:
            img.putpixel((x, y), C["sky1"])
    # tiny tree silhouettes on top
    for tx, th in ((40, 12), (60, 17), (84, 13), (104, 9)):
        d.rectangle([tx - 1, 44 - th // 2, tx + 1, 46], fill=C["sky2"])
        d.polygon([(tx, 30 - th // 2), (tx + 7, 44), (tx - 7, 44)], fill=C["sky2"])
        d.polygon([(tx, 34 - th // 2), (tx + 6, 44), (tx - 6, 44)], fill=C["sky3"])
    if variant == 1:
        # tiny hut with a smoking chimney
        d.rectangle([64, 34, 78, 46], fill=C["sky2"])
        d.polygon([(62, 35), (71, 27), (80, 35)], fill=C["sky3"])
        d.rectangle([74, 26, 77, 32], fill=C["sky2"])
        for k in range(3):
            d.point((76 + k % 2, 26 - k * 2), fill=C["cl3"])
    # waterfalls spilling off the rim
    for wx in ((58,) if variant == 0 else (92,)):
        for k in range(22):
            d.point((wx + (k % 2), 52 + k), fill=C["sky5"] if k % 4 else C["sky6"])
    return img


def bird(frame=0):
    img = new(18, 10)
    d = ImageDraw.Draw(img)
    if frame % 2 == 0:
        d.line([(1, 6), (5, 2), (9, 6)], fill=C["sky1"])
        d.line([(9, 6), (13, 2), (17, 6)], fill=C["sky1"])
    else:
        d.line([(1, 4), (5, 7), (9, 4)], fill=C["sky1"])
        d.line([(9, 4), (13, 7), (17, 4)], fill=C["sky1"])
    return img


# ---------------------------------------------------------------- UI
def blend(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def panel():
    """PMD Explorers-style box: rounded deep-blue plate with a pale double rim."""
    w = h = 32
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # rounded silhouette, outer dark edge and pale storybook border
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=6, fill=(18, 24, 42))
    d.rounded_rectangle([1, 1, w - 2, h - 2], radius=5, fill=(226, 238, 246))
    d.rounded_rectangle([2, 2, w - 3, h - 3], radius=5, fill=(120, 156, 196))
    d.rounded_rectangle([3, 3, w - 4, h - 4], radius=4, fill=(28, 44, 76))
    # body: soft vertical gradient with a faint dither so it reads painted
    top, bot = (41, 68, 112), (26, 42, 74)
    for y in range(5, h - 5):
        t = (y - 5) / max(1, h - 11)
        d.line([(5, y), (w - 6, y)], fill=blend(top, bot, t))
    dither(img, (6, 6, w - 6, h - 6), (56, 88, 138), step=5)
    # inner highlight + shadow rims
    d.line([(7, 5), (w - 8, 5)], fill=(112, 156, 204))
    d.line([(7, h - 6), (w - 8, h - 6)], fill=(20, 32, 58))
    # little corner studs, PMD menu flavour
    for (cx, cy) in [(5, 5), (w - 6, 5), (5, h - 6), (w - 6, h - 6)]:
        d.point((cx, cy), fill=(196, 216, 232))
    return img


def slot(selected=False):
    img = new(22, 22)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 21, 21], radius=4, fill=(18, 24, 42))
    d.rounded_rectangle([1, 1, 20, 20], radius=3,
                        fill=(240, 216, 152) if selected else (150, 182, 214))
    d.rounded_rectangle([2, 2, 19, 19], radius=3,
                        fill=(38, 64, 108) if not selected else (58, 94, 148))
    if selected:
        d.rounded_rectangle([3, 3, 18, 18], radius=2, fill=(74, 116, 172))
    else:
        d.line([(4, 3), (17, 3)], fill=(70, 104, 154))
    return img


def tile_highlight():
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    pts = [(TW // 2, 1), (TW - 2, TH // 2), (TW // 2, TH - 2), (2, TH // 2)]
    d.line(pts + [pts[0]], fill=C["cream1"], width=1)
    d.point((TW // 2, 1), fill=C["white"])
    d.point((TW - 2, TH // 2), fill=C["white"])
    d.point((TW // 2, TH - 2), fill=C["white"])
    d.point((2, TH // 2), fill=C["white"])
    return img


def icon(kind):
    img = new(16, 16)
    d = ImageDraw.Draw(img)
    if kind == "heart":
        d.ellipse([1, 2, 8, 9], fill=C["red"])
        d.ellipse([7, 2, 14, 9], fill=C["red"])
        d.polygon([(1, 6), (14, 6), (8, 14)], fill=C["red"])
        d.ellipse([3, 3, 6, 6], fill=C["org"])
        d.point((4, 4), fill=C["cream2"])
    elif kind == "food":
        d.ellipse([3, 1, 13, 15], fill=C["fur1"])
        d.ellipse([4, 2, 9, 8], fill=C["fur2"])
        d.point((6, 4), fill=C["fur5"])
        d.line([(8, 1), (8, 0)], fill=C["g1"])
        d.ellipse([9, 0, 13, 4], fill=C["g2"])
    elif kind == "water":
        d.polygon([(8, 1), (13, 9), (8, 15), (3, 9)], fill=C["w2"])
        d.polygon([(8, 3), (11, 9), (8, 13), (5, 9)], fill=C["w3"])
        d.point((7, 6), fill=C["white"])
    elif kind == "energy":
        d.polygon([(9, 0), (3, 9), (8, 9), (6, 15), (13, 5), (8, 5)], fill=C["yel"])
        d.polygon([(8, 2), (5, 8), (8, 8), (7, 12)], fill=C["cream1"])
    elif kind == "wood":
        d.ellipse([1, 4, 7, 12], fill=C["d4"])
        d.ellipse([3, 6, 6, 10], fill=C["d2"])
        d.rectangle([5, 4, 14, 12], fill=C["d2"])
        d.rectangle([5, 4, 14, 6], fill=C["d3"])
        d.ellipse([11, 4, 15, 12], fill=C["d3"])
    elif kind == "stone":
        d.polygon([(4, 2), (13, 4), (14, 11), (7, 14), (2, 10)], fill=C["s2"])
        d.polygon([(4, 2), (13, 4), (8, 8), (2, 7)], fill=C["s4"])
        d.polygon([(8, 8), (14, 11), (7, 14)], fill=C["s1"])
    elif kind == "fiber":
        for i, x in enumerate((4, 8, 12)):
            d.line([(x, 15), (x - 2 + i * 2, 3)], fill=C["g2"])
            d.point((x - 1 + i, 5), fill=C["g4"])
    elif kind == "berry":
        d.ellipse([2, 4, 9, 12], fill=C["fur1"])
        d.ellipse([7, 3, 14, 11], fill=C["fur2"])
        d.ellipse([5, 8, 12, 15], fill=C["fur0"])
        d.point((4, 6), fill=C["fur5"])
        d.point((10, 5), fill=C["fur5"])
        d.ellipse([7, 0, 12, 4], fill=C["g2"])
    elif kind == "seed":
        d.rectangle([2, 4, 14, 15], fill=C["d3"])
        d.rectangle([2, 4, 14, 6], fill=C["d4"])
        d.ellipse([5, 2, 11, 8], fill=C["d2"])
        d.ellipse([6, 3, 10, 7], fill=C["fur2"])
    elif kind == "orb":
        d.ellipse([1, 1, 14, 14], fill=C["scarf0"])
        d.ellipse([3, 3, 12, 12], fill=C["scarf1"])
        d.ellipse([5, 4, 9, 8], fill=C["cream2"])
    elif kind == "fish":
        d.ellipse([2, 4, 11, 12], fill=C["blue2"])
        d.ellipse([3, 5, 9, 9], fill=C["blue3"])
        d.polygon([(10, 8), (15, 3), (15, 13)], fill=C["blue1"])
        d.point((5, 7), fill=C["ink"])
        d.point((4, 6), fill=C["white"])
    elif kind == "shard":
        d.polygon([(8, 0), (14, 8), (8, 15), (2, 8)], fill=C["scarf0"])
        d.polygon([(8, 0), (14, 8), (8, 8)], fill=C["scarf1"])
        d.line([(8, 2), (8, 12)], fill=C["cream2"])
    elif kind == "note":
        d.ellipse([3, 9, 9, 14], fill=C["cream1"])
        d.rectangle([8, 2, 9, 12], fill=C["cream1"])
        d.line([(8, 2), (13, 1)], fill=C["cream1"], width=2)
    elif kind == "lyre":
        d.arc([2, 2, 14, 15], start=200, end=340, fill=C["d4"], width=2)
        d.line([(4, 5), (7, 14)], fill=C["d3"], width=2)
        d.line([(12, 5), (9, 14)], fill=C["d3"], width=2)
        for i in range(3):
            d.line([(6 + i * 2, 5), (6 + i * 2, 13)], fill=C["cream1"])
    elif kind == "moonberry":
        d.ellipse([2, 4, 13, 14], fill=C["vio"])
        d.ellipse([4, 3, 11, 9], fill=C["blue3"])
        d.point((5, 4), fill=C["white"])
    return img


def btn():
    img = new(24, 14)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 23, 13], fill=C["ink"])
    d.rectangle([1, 1, 22, 12], fill=C["cream0"])
    d.rectangle([2, 2, 21, 11], fill=C["sky2"])
    d.rectangle([2, 2, 21, 3], fill=C["sky3"])
    d.rectangle([2, 10, 21, 11], fill=C["ink"])
    return img


def star_icon():
    img = new(18, 18)
    d = ImageDraw.Draw(img)
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        r = 8 if i % 2 == 0 else 3.4
        pts.append((9 + math.cos(ang) * r, 9 + math.sin(ang) * r))
    d.polygon(pts, fill=C["scarf0"])
    d.polygon([(9 + (x[0] - 9) * .6, 9 + (x[1] - 9) * .6) for x in pts], fill=C["scarf1"])
    return img


# ---------------------------------------------------------------- packing
# ------------------------------------------------------------ biome palettes
AUTUMN_GRASS = {
    "g0": (94, 60, 40), "g1": (124, 80, 46), "g2": (156, 104, 54),
    "g3": (188, 134, 64), "g4": (214, 164, 86), "g5": (236, 198, 126),
}
BIRCH_GRASS = {
    "g0": (66, 90, 56), "g1": (88, 120, 66), "g2": (112, 148, 78),
    "g3": (142, 174, 90), "g4": (174, 202, 112), "g5": (202, 224, 146),
}
TAIGA_GRASS = {
    "g0": (40, 64, 58), "g1": (54, 84, 72), "g2": (70, 106, 86),
    "g3": (92, 130, 100), "g4": (120, 154, 114), "g5": (152, 180, 136),
}
SAND_GRASS = {
    "g0": (170, 138, 98), "g1": (198, 168, 122), "g2": (220, 194, 146),
    "g3": (236, 214, 166), "g4": (246, 230, 188), "g5": (252, 244, 214),
}
AUTUMN_CANOPY = {
    "g0": (108, 58, 34), "g1": (148, 78, 34), "g2": (186, 104, 40),
    "g3": (214, 136, 52), "g4": (234, 172, 82), "g5": (250, 208, 124),
}
BIRCH_TREE = {
    "d1": (96, 88, 88), "d2": (214, 206, 196), "d3": (240, 234, 226),
    "g0": (72, 100, 66), "g1": (96, 126, 74), "g2": (126, 156, 84),
    "g3": (158, 186, 98), "g4": (192, 214, 120), "g5": (220, 234, 156),
}


def with_palette(pal, fn, *args, **kwargs):
    old = {k: C[k] for k in pal if k in C}
    C.update(pal)
    try:
        return fn(*args, **kwargs)
    finally:
        C.update(old)


def tree_pine():
    w, h = 74, 116
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # trunk
    d.rectangle([w // 2 - 4, h - 26, w // 2 + 3, h - 4], fill=C["d2"])
    d.rectangle([w // 2 - 4, h - 26, w // 2 - 1, h - 4], fill=C["d3"])
    d.rectangle([w // 2 - 7, h - 6, w // 2 + 6, h - 3], fill=C["d1"])
    # stacked triangular tiers, bottom to top
    tiers = [(104, 30), (86, 27), (68, 23), (50, 18), (34, 12)]
    for (base_y, half) in tiers:
        top = base_y - 34
        for y in range(top, base_y + 1):
            t = (y - top) / max(1, base_y - top)
            hw = max(1, int(1 + t * half))
            shade = C["g1"] if t > 0.42 else C["g2"]
            d.line([(w // 2 - hw, y), (w // 2 + hw, y)], fill=shade)
            if hw > 2:
                d.line([(w // 2 - hw + 1, y), (w // 2 - hw + 3, y)], fill=C["g3"])
        for x in range(w // 2 - half, w // 2 + half, 3):
            d.point((x, base_y), fill=C["g0"])
    # snow-dusted tips
    for (bx, by) in [(w // 2, 0), (w // 2 - 9, 36), (w // 2 + 9, 36)]:
        d.point((bx, by), fill=C["g5"])
        d.point((bx + 1, by + 1), fill=C["g4"])
    return img


def tree_palm():
    w, h = 88, 108
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # curved trunk
    for y in range(40, h - 4):
        t = (y - 40) / max(1, h - 44)
        x = w // 2 + int(math.sin(t * 1.5) * 9)
        half = 3 + int(t * 2)
        d.line([(x - half, y), (x + half, y)], fill=C["d2"])
        d.line([(x - half, y), (x - 1, y)], fill=C["d3"])
        if y % 7 == 0:
            d.point((x + half - 1, y), fill=C["d1"])
    cx, cy = w // 2, 40
    # fronds
    for i in range(7):
        ang = -2.9 + i * 0.62
        length = 24 + (i % 3) * 4
        for k in range(2, length):
            t = k / length
            x = cx + math.cos(ang) * k * 0.95
            y = cy + math.sin(ang) * k * 0.6 + t * t * 4
            col = C["g3"] if k < length * 0.6 else C["g2"]
            px, py = int(x), int(y)
            if 0 <= px < w and 0 <= py < h:
                d.point((px, py), fill=col)
                if k % 4 == 0 and px + 1 < w:
                    d.point((px + 1, py + 1), fill=C["g1"])
    # coconuts
    for (ox, oy) in [(-4, 3), (3, 5), (0, 8)]:
        d.ellipse([cx + ox - 2, cy + oy - 2, cx + ox + 2, cy + oy + 1], fill=C["d1"])
        d.point((cx + ox - 1, cy + oy - 1), fill=C["d3"])
    return img


def build():
    os.makedirs(OUT, exist_ok=True)
    assets = {}

    def add(name, img):
        assets[name] = img

    for i in range(4):
        add(f"grass{i}", tile_grass(i))
        add(f"water{i % 3}", tile_water(i % 3))
    add("soil", tile_soil())
    add("soil_wet", tile_soil(wet=True))
    add("soil_plain", tile_soil(plain=True))
    add("stone0", tile_stone(0))
    add("stone1", tile_stone(1))
    add("cloudpad0", tile_cloudpad(0))
    add("cloudpad1", tile_cloudpad(1))
    add("cliff0", cliff_band(variant=0))
    add("cliff1", cliff_band(variant=1))
    add("cliff_tip", cliff_band(tip=True))

    add("tree", tree(False))
    add("tree_bare", tree(True))
    add("tree_autumn", with_palette(AUTUMN_CANOPY, tree, False))
    add("tree_birch", with_palette(BIRCH_TREE, tree, False))
    add("tree_pine", tree_pine())
    add("tree_palm", tree_palm())
    for i in range(4):
        add(f"grass_autumn{i}", with_palette(AUTUMN_GRASS, tile_grass, i))
        add(f"grass_birch{i}", with_palette(BIRCH_GRASS, tile_grass, i))
        add(f"grass_taiga{i}", with_palette(TAIGA_GRASS, tile_grass, i))
        add(f"sand{i}", with_palette(SAND_GRASS, tile_grass, i))
    add("stump", stump())
    add("rock_big", rock("big"))
    add("rock_mid", rock("mid"))
    add("rock_small", rock("small"))
    for kind in ("oran", "wheat", "glow", "sun", "moon"):
        for s in range(4):
            add(f"crop_{kind}_{s}", crop(kind, s))
    for i in range(4):
        add(f"pet{i}", pet(i))
    add("lyre", lyre())
    add("chime", chime())
    add("shrine", shrine())
    add("hive", hive())
    add("shard", shard())
    add("fence_h", fence("h"))
    add("fence_v", fence("v"))
    add("lantern", lantern())
    add("campfire0", campfire(0))
    add("campfire1", campfire(1))
    add("tent", tent())
    add("bench", bench())
    add("chest", chest())
    add("sign", sign())
    add("well", well())
    add("sprinkler", sprinkler())
    add("scarecrow", scarecrow())
    for i in range(3):
        add(f"flower{i}", deco_flower(i))
    add("mushroom", deco_mushroom())
    add("pebbles", deco_pebbles())

    for i in range(3):
        add(f"cloud_big{i}", cloud("big", i))
        add(f"cloud_mid{i}", cloud("mid", i))
        add(f"cloud_small{i}", cloud("small", i))
        add(f"farisle{i % 2}", far_island(i % 2))
    add("bird0", bird(0))
    add("bird1", bird(1))

    add("panel", panel())
    add("slot", slot(False))
    add("slot_sel", slot(True))
    add("highlight", tile_highlight())
    add("btn", btn())
    add("star", star_icon())
    for k in ("heart", "food", "water", "energy", "wood", "stone", "fiber",
              "berry", "seed", "orb", "fish", "shard", "note", "lyre"):
        add(f"ic_{k}", icon(k))

    # shelf pack
    pad = 2
    maxw = 512
    x = y = pad
    shelf_h = 0
    rects = {}
    for name, img in assets.items():
        w, h = img.size
        if x + w + pad > maxw:
            x = pad
            y += shelf_h + pad
            shelf_h = 0
        rects[name] = (x, y, w, h)
        x += w + pad
        shelf_h = max(shelf_h, h)
    atlas_h = y + shelf_h + pad
    atlas = Image.new("RGBA", (maxw, atlas_h), (0, 0, 0, 0))
    for name, img in assets.items():
        rx, ry, _, _ = rects[name]
        atlas.alpha_composite(img, (rx, ry))
    atlas.save(f"{OUT}/atlas.png")
    with open(f"{OUT}/atlas.json", "w") as fh:
        json.dump({"image": "atlas.png", "frames": rects}, fh, indent=0)
    print("atlas", atlas.size, len(assets), "assets")

    # review sheet on a sky background
    sheet = Image.new("RGBA", (maxw, atlas_h), (34, 53, 107, 255))
    sheet.alpha_composite(atlas)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save("/tmp/atlas_sheet.png")


build()
