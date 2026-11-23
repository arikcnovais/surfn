"""Generate the surf / fy_pool_day asset atlas in the skyblock art style.

Same 48x24 isometric footprint, same pastel-washed palette as assets/atlas.png,
drawn procedurally at native pixel resolution.

Outputs assets/surf.png and assets/surf.json.
Run:  python3 tools/gen_surf_assets.py
"""
import json
import math
import random

from PIL import Image, ImageDraw

OUT_IMG = "assets/surf.png"
OUT_JSON = "assets/surf.json"

TW, TH = 48, 24
rng = random.Random(20002010)

C = {
    "ink": (24, 28, 46), "outline": (86, 54, 40),
    "cream": (253, 242, 206), "cream2": (255, 252, 240), "sand": (220, 194, 142),
    "w0": (26, 72, 112), "w1": (44, 120, 168), "w2": (88, 176, 208), "w3": (150, 220, 236),
    "w4": (201, 238, 247), "white": (252, 253, 255),
    "d0": (58, 40, 30), "d1": (92, 64, 42), "d2": (124, 88, 56), "d3": (158, 118, 76),
    "d4": (192, 154, 106), "d5": (220, 188, 142),
    "s0": (46, 54, 68), "s1": (68, 78, 94), "s2": (96, 108, 126), "s3": (128, 140, 160),
    "s4": (162, 174, 192), "s5": (200, 210, 224), "s6": (232, 240, 248),
    "ice0": (150, 196, 220), "ice1": (190, 224, 240), "ice2": (226, 244, 252),
    "grn": (108, 162, 78), "grn2": (144, 194, 96), "grn3": (184, 218, 126),
    "red": (232, 92, 96), "org": (255, 150, 100), "yel": (255, 214, 92),
    "vio": (178, 132, 240), "pnk": (255, 160, 200), "blu": (110, 170, 240),
    "scarf": (255, 224, 102), "scarf0": (242, 197, 49),
    "grey": (128, 128, 138), "dark": (46, 52, 66),
}

MIX = (252, 242, 230)


def pastel(rgb, t=0.08, lift=2):
    r, g, b = rgb
    avg = (r + g + b) / 3
    out = []
    for i, c in enumerate((r, g, b)):
        c = c + (avg - c) * 0.12
        c = c + (MIX[i] - c) * t
        out.append(min(255, round(c + lift)))
    return tuple(out)


for k in list(C):
    if k not in ("ink", "outline", "white", "w0"):
        C[k] = pastel(C[k])


def new(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def diamond_mask(w=TW, h=TH):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(
        [(w // 2, 0), (w - 1, h // 2), (w // 2, h - 1), (0, h // 2)], fill=255)
    return m


MASK = diamond_mask()


def draw_diamond(img, cx, cy, w, h, fill, outline=None, inset=0):
    d = ImageDraw.Draw(img)
    pts = [(cx, cy - h // 2 + inset), (cx + w // 2 - inset, cy),
           (cx, cy + h // 2 - inset), (cx - w // 2 + inset, cy)]
    d.polygon(pts, fill=fill)
    if outline:
        d.line(pts + [pts[0]], fill=outline, width=1)
    return pts


def inside(x, y):
    return 0 <= x < TW and 0 <= y < TH and MASK.getpixel((x, y)) > 0


# ----------------------------------------------------------------- deck tiles
def tile_deck(variant=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    base = C["s4"] if variant % 2 == 0 else C["s3"]
    draw_diamond(img, 24, 12, TW, TH, base)
    # tiled slabs
    for k in range(3):
        for x in range(TW):
            top = abs(x - 24) // 2
            y = top + 3 + k * 6
            if inside(x, y):
                d.point((x, y), fill=C["s3"] if variant % 2 == 0 else C["s2"])
    for x in range(2, TW - 2, 8):
        for y in range(TH):
            if inside(x, y):
                d.point((x, y), fill=C["s2"] if variant % 2 else C["s3"])
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top):
            d.point((x, top), fill=C["s6"])
        bot = 23 - abs(x - 24) // 2
        if inside(x, bot):
            d.point((x, bot), fill=C["s2"])
    for _ in range(7):
        x, y = rng.randint(6, 41), rng.randint(5, 19)
        if inside(x, y):
            d.point((x, y), fill=C["s5"] if rng.random() < .6 else C["s3"])
    if variant == 1:
        # a wet footprint / puddle
        d.ellipse([18, 9, 29, 14], fill=C["w2"])
        d.ellipse([20, 10, 27, 13], fill=C["w3"])
    return img


def tile_wood():
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["d3"])
    for k in range(3):
        for x in range(TW):
            top = abs(x - 24) // 2
            y = top + 4 + k * 5
            if inside(x, y):
                d.point((x, y), fill=C["d2"])
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top):
            d.point((x, top), fill=C["d5"])
    for _ in range(9):
        x, y = rng.randint(5, 42), rng.randint(4, 20)
        if inside(x, y):
            d.point((x, y), fill=rng.choice([C["d2"], C["d4"], C["d1"]]))
    bot_edge = 23
    for x in range(TW):
        for y in (bot_edge - abs(x - 24) // 2, bot_edge - abs(x - 24) // 2 - 1):
            if inside(x, y):
                d.point((x, y), fill=C["d1"])
    return img


def tile_sand():
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["sand"])
    for _ in range(26):
        x, y = rng.randint(3, 44), rng.randint(3, 21)
        if inside(x, y):
            d.point((x, y), fill=rng.choice([C["d3"], C["d4"], C["d5"], C["cream"]]))
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top):
            d.point((x, top), fill=C["cream2"])
    return img


def tile_ice():
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["ice1"])
    for k in range(3):
        for x in range(TW):
            top = abs(x - 24) // 2
            y = top + 3 + k * 7
            if inside(x, y):
                d.point((x, y), fill=C["ice2"])
    for _ in range(12):
        x, y = rng.randint(5, 42), rng.randint(4, 20)
        if inside(x, y):
            d.point((x, y), fill=rng.choice([C["white"], C["ice0"], C["w3"]]))
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top):
            d.point((x, top), fill=C["white"])
    return img


def tile_water(frame=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["w1"])
    # depth: lighter centre, darker rim
    for x in range(TW):
        top = abs(x - 24) // 2
        for y in range(top, TH):
            if inside(x, y):
                if y > 23 - abs(x - 24) // 2 - 2:
                    d.point((x, y), fill=C["w0"])
    for k in range(4):
        off = 3 + k * 5
        for x in range(2, TW - 2):
            top = abs(x - 24) // 2
            y = top + off + ((frame + k) % 4)
            if inside(x, y) and (x // 4 + k + frame) % 2 == 0:
                d.point((x, y), fill=C["w2"])
                if inside(x + 1, y):
                    d.point((x + 1, y), fill=C["w2"])
    for x in range(4, TW - 4):
        top = abs(x - 24) // 2
        y = top + 5 + (frame * 3 + x // 6) % 5
        if inside(x, y) and x % 3 != 0:
            d.point((x, y), fill=C["w3"])
    # sparkle foam at the rim
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top) and (x + frame * 2) % 7 < 3:
            d.point((x, top), fill=C["w4"])
        bot = 23 - abs(x - 24) // 2
        if inside(x, bot) and (x + frame) % 9 < 2:
            d.point((x, bot), fill=C["w2"])
    return img


def tile_shallow(frame=0):
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["w2"])
    for x in range(TW):
        top = abs(x - 24) // 2
        for y in range(top, TH):
            if inside(x, y) and (x + y + frame) % 7 == 0:
                d.point((x, y), fill=C["w3"])
    for k in range(3):
        for x in range(4, TW - 4):
            top = abs(x - 24) // 2
            y = top + 4 + k * 6 + (frame % 3)
            if inside(x, y):
                d.point((x, y), fill=C["sand"])
    return img


def tile_grate():
    img = new(TW, TH)
    d = ImageDraw.Draw(img)
    draw_diamond(img, 24, 12, TW, TH, C["s2"])
    for k in range(4):
        for x in range(4, TW - 4):
            top = abs(x - 24) // 2
            y = top + 4 + k * 4
            if inside(x, y):
                d.point((x, y), fill=C["s1"])
    for x in range(TW):
        top = abs(x - 24) // 2
        if inside(x, top):
            d.point((x, top), fill=C["s5"])
    return img


def tile_wall(variant=0):
    """A solid iso block: 48x48 (top diamond + two visible faces)."""
    img = new(TW, 48)
    d = ImageDraw.Draw(img)
    top = C["s5"] if variant == 0 else C["w3"]
    draw_diamond(img, 24, 12, TW, TH, top, C["s2"])
    # left face
    pts_l = [(1, 12), (24, 23), (24, 43), (1, 31)]
    d.polygon(pts_l, fill=C["s3"])
    pts_r = [(47, 12), (24, 23), (24, 43), (47, 31)]
    d.polygon(pts_r, fill=C["s2"])
    for y in range(13, 23):
        for x in range(1, 48):
            if inside(x, y) and x > 24:
                d.point((x, y), fill=C["s4"])
    for k in range(2):
        for x in range(2, 47):
            y = 20 + k * 8
            d.point((x, y), fill=C["s1"])
    for x in range(24, 47):
        for y in range(23, 43):
            if (x + y) % 11 == 0:
                d.point((x, y), fill=C["s5"] if variant == 0 else C["w4"])
    for x in range(1, 24):
        for y in range(23, 31):
            if (x * 3 + y) % 13 == 0:
                d.point((x, y), fill=C["s4"])
    if variant:
        # pool tiling stripe
        for x in range(3, 22):
            d.point((x, 27), fill=C["w4"])
    return img


# ------------------------------------------------------------------ props
def ramp(kind="wood"):
    img = new(56, 46)
    d = ImageDraw.Draw(img)
    base = C["d3"] if kind == "wood" else C["s4"]
    dark = C["d2"] if kind == "wood" else C["s3"]
    light = C["d5"] if kind == "wood" else C["s6"]
    # quarter pipe seen from above: wide at bottom, narrowing to the lip
    d.polygon([(4, 42), (52, 42), (40, 12), (16, 12)], fill=base)
    d.polygon([(4, 42), (52, 42), (48, 36), (8, 36)], fill=dark)
    d.polygon([(16, 12), (40, 12), (44, 20), (12, 20)], fill=light)
    for k in range(3):
        y = 22 + k * 6
        d.line([(10 + k, y), (46 - k, y)], fill=dark)
    # arrows up the ramp
    for cx in (22, 28, 34):
        d.line([(cx, 32), (cx, 24)], fill=C["scarf0"], width=2)
        d.polygon([(cx - 2, 26), (cx + 2, 26), (cx, 22)], fill=C["scarf1"] if "scarf1" in C else C["scarf"])
    # side rails
    d.line([(4, 42), (16, 12)], fill=C["d1"], width=2)
    d.line([(52, 42), (40, 12)], fill=C["d1"], width=2)
    return img


def rail():
    img = new(44, 34)
    d = ImageDraw.Draw(img)
    d.line([(6, 12), (38, 22)], fill=C["s2"], width=2)
    d.line([(6, 12), (38, 22)], fill=C["s4"])
    for (x, y) in ((8, 14), (36, 24)):
        d.rectangle([x - 1, y, x + 1, y + 8], fill=C["s1"])
        d.rectangle([x, y + 8, x + 4, y + 10], fill=C["s3"])
    return img


def buoy(color=None):
    color = color or C["red"]
    img = new(30, 40)
    d = ImageDraw.Draw(img)
    d.ellipse([4, 26, 26, 38], fill=color)
    d.ellipse([6, 27, 24, 35], fill=C["cream2"])
    d.rectangle([13, 10, 17, 30], fill=C["s2"])
    d.rectangle([13, 10, 14, 30], fill=C["s4"])
    d.ellipse([8, 4, 22, 16], fill=color)
    d.ellipse([11, 7, 19, 13], fill=C["cream"])
    d.polygon([(15, 4), (24, 8), (15, 10)], fill=color)
    d.point((14, 8), fill=C["white"])
    return img


def gate():
    """Floating start/checkpoint arch, drawn bottom-anchored."""
    img = new(74, 66)
    d = ImageDraw.Draw(img)
    for x in (10, 62):
        d.rectangle([x - 3, 6, x + 3, 60], fill=C["s2"])
        d.rectangle([x - 3, 6, x - 1, 60], fill=C["s5"])
        d.ellipse([x - 4, 2, x + 4, 10], fill=C["scarf0"])
    d.polygon([(6, 10), (68, 10), (64, 4), (10, 4)], fill=C["scarf0"])
    d.polygon([(6, 10), (68, 10), (68, 14), (6, 14)], fill=C["scarf"])
    for i in range(6):
        x = 12 + i * 9
        d.polygon([(x, 14), (x + 5, 14), (x + 4, 20), (x, 20)],
                  fill=C["cream"] if i % 2 else C["scarf0"])
    d.ellipse([30, 26, 44, 40], fill=C["w2"])
    d.ellipse([32, 28, 42, 38], fill=C["w4"])
    d.point((36, 31), fill=C["white"])
    return img


def crate():
    img = new(36, 40)
    d = ImageDraw.Draw(img)
    d.polygon([(2, 12), (34, 12), (34, 34), (2, 34)], fill=C["d2"])
    d.polygon([(2, 12), (34, 12), (30, 6), (6, 6)], fill=C["d4"])
    d.rectangle([2, 12, 34, 14], fill=C["d3"])
    d.line([(2, 12), (34, 34)], fill=C["d1"], width=2)
    d.line([(34, 12), (2, 34)], fill=C["d1"], width=2)
    for x in (4, 32):
        d.line([(x, 12), (x, 34)], fill=C["d1"])
    for y in (14, 33):
        d.line([(2, y), (34, y)], fill=C["d1"])
    d.point((18, 20), fill=C["d5"])
    return img


def barrel():
    img = new(28, 42)
    d = ImageDraw.Draw(img)
    d.ellipse([3, 4, 25, 14], fill=C["s4"])
    d.rectangle([3, 9, 25, 36], fill=C["s3"])
    d.ellipse([3, 30, 25, 40], fill=C["s2"])
    for y in (16, 28):
        d.line([(3, y), (25, y)], fill=C["s1"], width=2)
    d.rectangle([8, 8, 13, 36], fill=C["s5"])
    d.ellipse([7, 5, 21, 12], fill=C["s5"])
    d.point((13, 8), fill=C["white"])
    return img


def umbrella():
    img = new(58, 62)
    d = ImageDraw.Draw(img)
    d.line([(29, 22), (27, 60)], fill=C["d2"], width=2)
    d.rectangle([26, 56, 32, 60], fill=C["d1"])
    for i in range(6):
        a0 = math.pi + i * math.pi / 6
        a1 = a0 + math.pi / 6
        col = C["red"] if i % 2 else C["cream"]
        d.pieslice([5, 4, 53, 36], int(math.degrees(a0)), int(math.degrees(a1)),
                   fill=col)
    d.ellipse([5, 4, 53, 36], outline=C["s1"])
    d.polygon([(27, 2), (32, 10), (22, 10)], fill=C["s2"])
    d.point((29, 3), fill=C["white"])
    return img


def chair():
    img = new(38, 30)
    d = ImageDraw.Draw(img)
    d.polygon([(2, 8), (30, 8), (34, 18), (6, 18)], fill=C["w3"])
    d.polygon([(6, 18), (34, 18), (30, 26), (2, 26)], fill=C["w2"])
    for x in (4, 28):
        d.line([(x, 26), (x - 2, 30)], fill=C["s2"])
    for k in range(4):
        d.line([(6 + k * 6, 9), (8 + k * 6, 17)], fill=C["cream"])
    return img


def ladder():
    img = new(30, 46)
    d = ImageDraw.Draw(img)
    for x in (6, 23):
        d.rectangle([x - 1, 2, x + 1, 42], fill=C["s5"])
        d.rectangle([x, 2, x + 1, 42], fill=C["s2"])
    for k in range(5):
        y = 8 + k * 7
        d.line([(6, y), (24, y)], fill=C["s3"], width=2)
        d.point((7, y - 1), fill=C["white"])
    return img


def float_swan():
    img = new(50, 34)
    d = ImageDraw.Draw(img)
    d.ellipse([4, 12, 42, 30], fill=C["cream"])
    d.ellipse([34, 4, 46, 18], fill=C["cream2"])
    d.polygon([(45, 10), (50, 12), (45, 15)], fill=C["org"])
    d.ellipse([37, 7, 40, 10], fill=C["ink"])
    d.ellipse([10, 16, 34, 27], fill=C["cream2"])
    for k in range(3):
        d.line([(12 + k * 7, 17), (14 + k * 7, 25)], fill=C["cream"])
    return img


def shark_fin():
    img = new(30, 24)
    d = ImageDraw.Draw(img)
    d.polygon([(4, 22), (16, 2), (26, 22)], fill=C["s2"])
    d.polygon([(16, 2), (26, 22), (18, 22)], fill=C["s1"])
    d.line([(9, 22), (27, 22)], fill=C["w2"])
    return img


def speaker():
    img = new(34, 46)
    d = ImageDraw.Draw(img)
    d.rectangle([3, 6, 31, 44], fill=C["s1"])
    d.rectangle([5, 8, 29, 20], fill=C["s0"])
    d.ellipse([9, 22, 27, 40], fill=C["s2"])
    d.ellipse([12, 25, 24, 37], fill=C["s0"])
    d.ellipse([15, 28, 21, 34], fill=C["s3"])
    d.rectangle([3, 6, 31, 8], fill=C["s4"])
    d.point((7, 11), fill=C["scarf0"])
    return img


def floodlight():
    img = new(30, 62)
    d = ImageDraw.Draw(img)
    d.rectangle([14, 20, 17, 58], fill=C["s2"])
    d.rectangle([8, 56, 23, 60], fill=C["s1"])
    d.polygon([(4, 18), (26, 18), (22, 4), (8, 4)], fill=C["s1"])
    d.polygon([(7, 16), (23, 16), (20, 7), (10, 7)], fill=C["scarf"])
    d.point((15, 10), fill=C["white"])
    return img


def disco():
    img = new(30, 34)
    d = ImageDraw.Draw(img)
    d.line([(15, 0), (15, 8)], fill=C["s2"])
    d.ellipse([4, 8, 26, 30], fill=C["s3"])
    for x in range(6, 25, 4):
        d.line([(x, 9), (x, 29)], fill=C["s1"])
    d.line([(5, 19), (25, 19)], fill=C["s1"])
    d.ellipse([9, 12, 14, 17], fill=C["white"])
    d.point((20, 24), fill=C["scarf"])
    return img


def palm_shadow():
    img = new(58, 26)
    d = ImageDraw.Draw(img)
    d.ellipse([2, 4, 56, 24], fill=(20, 40, 60, 70))
    return img


# ------------------------------------------------------------------ relics
def relic(kind):
    img = new(22, 22)
    d = ImageDraw.Draw(img)
    if kind == "cd":
        d.ellipse([2, 2, 20, 20], fill=C["s4"])
        d.ellipse([4, 4, 18, 18], fill=C["w3"])
        for k in range(4):
            d.arc([5 + k, 5 + k, 17 - k, 17 - k], 20 + k * 40, 120 + k * 40,
                  fill=C["cream2"])
        d.ellipse([9, 9, 13, 13], fill=C["s2"])
        d.point((7, 6), fill=C["white"])
    elif kind == "floppy":
        d.rectangle([1, 1, 20, 20], fill=C["s2"])
        d.rectangle([4, 2, 16, 8], fill=C["s5"])
        d.rectangle([6, 3, 14, 6], fill=C["s1"])
        d.rectangle([3, 12, 18, 20], fill=C["cream"])
        d.rectangle([4, 13, 8, 17], fill=C["w3"])
        d.point((17, 18), fill=C["red"])
    elif kind == "cap":
        d.ellipse([2, 8, 20, 20], fill=C["red"])
        d.ellipse([5, 10, 17, 18], fill=C["cream"])
        d.polygon([(2, 16), (12, 12), (14, 20)], fill=C["org"])
        d.point((9, 13), fill=C["white"])
    elif kind == "phone":
        d.rectangle([4, 1, 18, 21], fill=C["s1"])
        d.rectangle([6, 3, 16, 12], fill=C["s5"])
        d.rectangle([7, 5, 15, 10], fill=C["w3"])
        d.rectangle([6, 14, 16, 17], fill=C["s2"])
        for x in range(7, 16, 3):
            for y in range(15, 18, 2):
                d.point((x, y), fill=C["cream"])
        d.rectangle([16, 0, 18, 5], fill=C["s3"])
    elif kind == "tape":
        d.rectangle([1, 4, 20, 18], fill=C["ink"])
        d.rectangle([3, 6, 18, 16], fill=C["s2"])
        d.ellipse([5, 7, 11, 13], fill=C["cream"])
        d.ellipse([11, 7, 17, 13], fill=C["cream"])
        d.point((8, 10), fill=C["s1"])
        d.point((14, 10), fill=C["s1"])
        d.rectangle([5, 14, 17, 15], fill=C["scarf0"])
    elif kind == "mouse":
        d.ellipse([4, 4, 18, 20], fill=C["s5"])
        d.ellipse([6, 6, 16, 18], fill=C["cream"])
        d.line([(11, 6), (11, 11)], fill=C["s2"])
        d.ellipse([8, 2, 12, 6], fill=C["s1"])
        d.point((9, 9), fill=C["s3"])
    elif kind == "disk":
        d.rectangle([1, 5, 20, 17], fill=C["s1"])
        d.rectangle([2, 6, 19, 10], fill=C["s3"])
        d.rectangle([4, 7, 17, 9], fill=C["cream"])
        d.rectangle([14, 11, 19, 16], fill=C["s0"])
        d.point((6, 13), fill=C["scarf0"])
    else:
        d.ellipse([3, 3, 18, 18], fill=C["scarf0"])
        d.ellipse([6, 6, 15, 15], fill=C["scarf"])
        d.point((9, 8), fill=C["white"])
    return img


def foam():
    img = new(64, 22)
    d = ImageDraw.Draw(img)
    for k in range(4):
        y = 4 + k * 4
        d.arc([2 + k * 3, y, 62 - k * 4, y + 12], 200, 340,
              fill=C["w4"] if k % 2 == 0 else C["w3"])
    for _ in range(16):
        x = rng.randint(2, 61)
        y = rng.randint(2, 19)
        if (x + y) % 3:
            d.point((x, y), fill=C["white"])
    return img


def splash_ring(frame=0):
    img = new(40, 20)
    d = ImageDraw.Draw(img)
    rx = 12 + frame * 4
    d.ellipse([20 - rx, 10 - rx // 2, 20 + rx, 10 + rx // 2], outline=C["w4"])
    d.ellipse([20 - rx + 3, 10 - rx // 2 + 2, 20 + rx - 3, 10 + rx // 2 - 2],
              outline=C["w3"])
    return img


def icon(kind):
    img = new(18, 18)
    d = ImageDraw.Draw(img)
    if kind == "trophy":
        d.polygon([(4, 2), (14, 2), (13, 9), (9, 13), (5, 9)], fill=C["scarf0"])
        d.rectangle([8, 12, 10, 15], fill=C["scarf0"])
        d.rectangle([5, 15, 13, 17], fill=C["d2"])
        d.arc([1, 2, 7, 8], 90, 300, fill=C["scarf"])
        d.arc([11, 2, 17, 8], 240, 90, fill=C["scarf"])
        d.point((7, 5), fill=C["white"])
    elif kind == "clock":
        d.ellipse([1, 1, 16, 16], fill=C["cream"])
        d.ellipse([2, 2, 15, 15], fill=C["s1"])
        d.line([(9, 9), (9, 4)], fill=C["cream"], width=2)
        d.line([(9, 9), (13, 11)], fill=C["cream"], width=2)
        d.point((9, 9), fill=C["scarf"])
    elif kind == "combo":
        d.polygon([(9, 1), (17, 9), (9, 17), (1, 9)], fill=C["scarf0"])
        d.polygon([(9, 4), (14, 9), (9, 14), (4, 9)], fill=C["red"])
        d.point((9, 6), fill=C["white"])
    elif kind == "rank":
        pts = [(9, 1), (11, 7), (17, 7), (12, 11), (14, 17), (9, 13), (4, 17),
               (6, 11), (1, 7), (7, 7)]
        d.polygon(pts, fill=C["scarf0"])
        d.polygon([(9, 4), (10, 8), (13, 8), (10, 10), (11, 13), (9, 11),
                   (7, 13), (8, 10), (5, 8), (8, 8)], fill=C["scarf"])
    elif kind == "speed":
        for k in range(3):
            d.line([(1, 4 + k * 5), (13 - k * 3, 4 + k * 5)], fill=C["w4"], width=2)
        d.polygon([(9, 3), (17, 9), (9, 15)], fill=C["scarf0"])
    elif kind == "shark":
        d.polygon([(2, 16), (9, 2), (16, 16)], fill=C["s2"])
        d.line([(2, 16), (16, 16)], fill=C["w3"], width=2)
        d.point((10, 6), fill=C["s5"])
    elif kind == "storm":
        d.ellipse([2, 2, 12, 10], fill=C["s4"])
        d.ellipse([6, 1, 17, 11], fill=C["s5"])
        d.polygon([(9, 9), (6, 15), (9, 14), (7, 18), (13, 11), (10, 12)],
                  fill=C["scarf0"])
    elif kind == "sun":
        d.ellipse([5, 5, 13, 13], fill=C["scarf0"])
        for a in range(8):
            ang = a * math.pi / 4
            d.line([(9 + math.cos(ang) * 6, 9 + math.sin(ang) * 6),
                    (9 + math.cos(ang) * 8, 9 + math.sin(ang) * 8)],
                   fill=C["scarf"], width=1)
    elif kind == "sound":
        d.polygon([(2, 7), (7, 7), (12, 3), (12, 15), (7, 11), (2, 11)],
                  fill=C["cream"])
        d.arc([9, 4, 17, 14], 300, 60, fill=C["w3"])
    elif kind == "lock":
        d.rectangle([3, 8, 15, 17], fill=C["scarf0"])
        d.arc([5, 2, 13, 12], 180, 360, fill=C["s4"], width=2)
        d.point((9, 12), fill=C["s1"])
    else:
        d.ellipse([2, 2, 15, 15], fill=C["w3"])
        d.point((7, 6), fill=C["white"])
    return img


def p(rgb):
    return pastel(rgb)


def face(kind):
    """44x44 dialogue bust, flat pixel-art, same palette as the tiles."""
    img = new(44, 44)
    d = ImageDraw.Draw(img)
    skin = p((236, 188, 150))
    skin2 = p((210, 158, 122))
    shirt = {
        "naldo": p((70, 132, 176)), "kaka": p((226, 92, 78)),
        "bruxa": p((138, 96, 190)), "ze": p((110, 150, 96)),
        "tia": p((220, 120, 150)), "rei": p((226, 186, 92)),
        "exe": p((58, 52, 86)), "zel": p((60, 140, 180)),
    }[kind]
    # shoulders
    d.rounded_rectangle([5, 34, 38, 45], radius=5, fill=shirt)
    d.rectangle([19, 28, 25, 37], fill=skin2)
    if kind in ("zel", "exe"):
        fur = p((226, 112, 52)) if kind == "zel" else p((86, 70, 110))
        fur2 = p((246, 167, 85)) if kind == "zel" else p((120, 96, 150))
        d.polygon([(9, 14), (12, 2), (20, 11)], fill=fur)
        d.polygon([(35, 14), (32, 2), (24, 11)], fill=fur)
        d.polygon([(12, 12), (14, 6), (18, 11)], fill=p((255, 176, 160)) if kind == "zel" else p((210, 80, 120)))
        d.polygon([(32, 12), (30, 6), (26, 11)], fill=p((255, 176, 160)) if kind == "zel" else p((210, 80, 120)))
        d.ellipse([8, 8, 36, 34], fill=fur)
        d.ellipse([12, 18, 32, 32], fill=p((255, 236, 204)) if kind == "zel" else p((70, 62, 88)))
        d.ellipse([15, 20, 21, 26], fill=p((30, 26, 34)))
        d.ellipse([23, 20, 29, 26], fill=p((30, 26, 34)))
        if kind == "exe":
            d.rectangle([16, 21, 20, 23], fill=p((255, 70, 80)))
            d.rectangle([24, 21, 28, 23], fill=p((255, 70, 80)))
        d.polygon([(20, 28), (24, 28), (22, 31)], fill=p((60, 42, 40)))
        d.arc([18, 29, 26, 35], 10, 170, fill=p((60, 42, 40)))
        # goggles on the forehead
        d.rectangle([10, 11, 34, 16], fill=p((58, 66, 82)))
        d.rectangle([12, 12, 20, 15], fill=p((150, 220, 236)))
        d.rectangle([24, 12, 32, 15], fill=p((150, 220, 236)))
        d.point((13, 12), fill=p((255, 255, 255)))
        d.point((25, 12), fill=p((255, 255, 255)))
    else:
        d.ellipse([10, 7, 34, 33], fill=skin)
        d.ellipse([6, 15, 12, 24], fill=skin2)
        d.ellipse([32, 15, 38, 24], fill=skin2)
        d.ellipse([15, 20, 21, 24], fill=p((252, 246, 232)))
        d.ellipse([23, 20, 29, 24], fill=p((252, 246, 232)))
        d.ellipse([17, 21, 19, 23], fill=p((35, 36, 48)))
        d.ellipse([25, 21, 27, 23], fill=p((35, 36, 48)))
        d.line([(16, 18), (20, 17)], fill=p((60, 44, 38)))
        d.line([(24, 17), (28, 18)], fill=p((60, 44, 38)))
        d.line([(21, 25), (23, 25)], fill=skin2)
        d.line([(19, 29), (25, 29)], fill=p((150, 82, 72)))
        if kind == "naldo":
            d.ellipse([7, 3, 37, 17], fill=p((58, 96, 140)))
            d.rectangle([4, 13, 40, 18], fill=p((46, 80, 122)))
            d.rectangle([10, 16, 34, 19], fill=p((90, 150, 196)))
            d.ellipse([16, 27, 28, 35], fill=p((92, 74, 60)))
            d.rectangle([8, 19, 12, 23], fill=p((120, 200, 220)))
            d.line([(33, 20), (40, 30)], fill=p((58, 66, 82)), width=2)
            d.ellipse([39, 30, 43, 34], fill=p((58, 66, 82)))
        elif kind == "kaka":
            d.polygon([(9, 12), (13, 2), (17, 9), (22, 1), (26, 9), (31, 3), (35, 13)],
                      fill=p((96, 66, 44)))
            d.rectangle([8, 17, 36, 23], fill=p((38, 40, 52)))
            d.rectangle([10, 18, 20, 22], fill=p((70, 180, 220)))
            d.rectangle([24, 18, 34, 22], fill=p((70, 180, 220)))
            d.line([(12, 19), (17, 22)], fill=p((255, 255, 255)))
            d.line([(26, 19), (31, 22)], fill=p((255, 255, 255)))
            d.rectangle([17, 30, 27, 31], fill=p((120, 60, 56)))
        elif kind == "bruxa":
            d.ellipse([6, 6, 38, 36], fill=p((112, 76, 164)))
            d.ellipse([12, 9, 32, 31], fill=skin)
            d.ellipse([12, 6, 32, 18], fill=p((140, 96, 196)))
            d.line([(8, 20), (8, 40)], fill=p((112, 76, 164)), width=3)
            d.line([(36, 20), (36, 40)], fill=p((112, 76, 164)), width=3)
            d.polygon([(32, 6), (34, 10), (38, 10), (35, 13), (36, 17), (32, 14),
                       (28, 17), (29, 13), (26, 10), (30, 10)], fill=p((255, 224, 102)))
            d.point((14, 19), fill=p((255, 160, 200)))
        elif kind == "ze":
            d.ellipse([8, 5, 36, 18], fill=p((68, 108, 76)))
            d.rectangle([9, 14, 35, 17], fill=p((52, 88, 60)))
            d.arc([1, 12, 15, 34], 90, 270, fill=p((58, 66, 82)), width=3)
            d.arc([29, 12, 43, 34], 270, 90, fill=p((58, 66, 82)), width=3)
            d.rectangle([1, 24, 6, 32], fill=p((86, 98, 116)))
            d.rectangle([38, 24, 43, 32], fill=p((86, 98, 116)))
            d.rectangle([17, 29, 27, 31], fill=p((252, 246, 232)))
        elif kind == "tia":
            d.ellipse([5, 6, 39, 38], fill=p((110, 74, 62)))
            for cx, cy in ((10, 12), (16, 7), (24, 6), (31, 8), (36, 15), (8, 24), (38, 26)):
                d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=p((124, 84, 70)))
            d.ellipse([13, 10, 31, 30], fill=skin)
            d.ellipse([15, 20, 20, 24], fill=p((252, 246, 232)))
            d.ellipse([24, 20, 29, 24], fill=p((252, 246, 232)))
            d.ellipse([17, 21, 19, 23], fill=p((35, 36, 48)))
            d.ellipse([25, 21, 27, 23], fill=p((35, 36, 48)))
            d.arc([16, 18, 23, 23], 180, 360, fill=p((90, 66, 62)))
            d.arc([22, 18, 29, 23], 180, 360, fill=p((90, 66, 62)))
            d.ellipse([9, 26, 13, 32], fill=p((255, 214, 92)))
            d.ellipse([31, 26, 35, 32], fill=p((255, 214, 92)))
            d.line([(19, 29), (25, 29)], fill=p((200, 92, 96)))
        elif kind == "rei":
            d.polygon([(9, 6), (13, 0), (17, 6), (22, 0), (27, 6), (31, 0), (35, 6),
                       (35, 12), (9, 12)], fill=p((255, 214, 92)))
            d.ellipse([9, 10, 35, 36], fill=p((240, 206, 120)))
            d.ellipse([12, 17, 32, 30], fill=p((208, 168, 84)))
            d.rectangle([13, 20, 19, 24], fill=p((50, 40, 30)))
            d.rectangle([25, 20, 31, 24], fill=p((50, 40, 30)))
            d.line([(19, 28), (25, 28)], fill=p((70, 56, 40)))
            d.point((16, 21), fill=p((255, 255, 255)))
            d.point((28, 21), fill=p((255, 255, 255)))
        elif kind == "exe":
            pass
    # scanline / glow framing
    d.rectangle([0, 0, 43, 43], outline=p((226, 238, 246)))
    return img


def build():
    frames = {}

    def add(name, img):
        frames[name] = img

    for i in range(4):
        add(f"deck{i}", tile_deck(i % 2))
        add(f"water{i}", tile_water(i))
        add(f"shallow{i}", tile_shallow(i))
    add("wood", tile_wood())
    add("sand", tile_sand())
    add("ice", tile_ice())
    add("grate", tile_grate())
    add("wall0", tile_wall(0))
    add("wall1", tile_wall(1))
    add("ramp_wood", ramp("wood"))
    add("ramp_metal", ramp("metal"))
    add("rail", rail())
    add("buoy_red", buoy(C["red"]))
    add("buoy_yel", buoy(C["scarf0"]))
    add("buoy_blu", buoy(C["w2"]))
    add("gate", gate())
    add("crate", crate())
    add("barrel", barrel())
    add("umbrella", umbrella())
    add("chair", chair())
    add("ladder", ladder())
    add("swan", float_swan())
    add("fin", shark_fin())
    add("speaker", speaker())
    add("floodlight", floodlight())
    add("disco", disco())
    add("shade", palm_shadow())
    add("foam0", foam())
    add("foam1", foam())
    add("splash0", splash_ring(0))
    add("splash1", splash_ring(1))
    add("splash2", splash_ring(2))
    for kind in ("cd", "floppy", "cap", "phone", "tape", "mouse", "disk", "medal"):
        add("rel_" + kind, relic(kind))
    for kind in ("trophy", "clock", "combo", "rank", "speed", "shark", "storm",
                 "sun", "sound", "lock", "water"):
        add("ic_" + kind, icon(kind))
    for kind in ("naldo", "kaka", "bruxa", "ze", "tia", "rei", "exe", "zel"):
        add("face_" + kind, face(kind))

    # pack into a shelf atlas
    names = list(frames)
    pad = 2
    maxw = 512
    x = y = pad
    row_h = 0
    places = {}
    for name in names:
        im = frames[name]
        w, h = im.size
        if x + w + pad > maxw:
            x = pad
            y += row_h + pad
            row_h = 0
        places[name] = (x, y)
        x += w + pad
        row_h = max(row_h, h)
    height = y + row_h + pad
    width = maxw
    atlas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    meta = {}
    for name, im in frames.items():
        px, py = places[name]
        atlas.alpha_composite(im, (px, py))
        meta[name] = [px, py, im.size[0], im.size[1]]
    atlas.save(OUT_IMG)
    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump({"image": "surf.png", "frames": meta}, fh, indent=0)
    print("surf atlas", atlas.size, "frames", len(meta))


if __name__ == "__main__":
    build()
