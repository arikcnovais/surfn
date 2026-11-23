"""Shared pixel-art palette for Buizel + Skyblock assets.

Colours were lifted from the Buizel spritesheet (orange fur, cream belly,
yellow float sac, blue tail fin, brown outlines) and extended into a cohesive
sky-island palette so generated tiles read as the same art style.
"""

HEX = [
    # deep / outline
    "1b1728", "35202a", "5a2a1c",
    # buizel fur
    "b63b18", "d8551f", "e8702b", "f08a3a", "f6a755", "ffc978",
    # cream / scarf
    "f4dfa4", "fbeec8", "fffbeb", "f2c531", "ffe066",
    # tail / water blues
    "2f4d66", "3f7ba6", "5aa6cd", "8fd3e8", "c9eef7",
    # sky
    "0b1026", "152046", "22356b", "35519c", "5480c4", "7fb0dd", "b6d9ef",
    # clouds
    "e7f0f8", "c6d8e9", "9db3cb", "748aa6",
    # grass
    "2f4a2c", "3d6b3a", "4f8a4a", "68ab50", "8ecf63", "b7e07a", "d9f0a0",
    # dirt / wood
    "3d2418", "5a3722", "7a4d2f", "9a6840", "bd8b5c", "dcb282",
    # stone
    "2b303d", "414857", "5a6273", "767e91", "9aa2b3", "c2c9d6",
    # water
    "1d4f78", "2f7fa8", "59a9c9", "92d2e4",
    # accents
    "ff5a5f", "ff8f6b", "ffe14d", "7ee081", "b07cff", "ff9fd0", "ffffff",
]


def rgb_list():
    out = []
    for h in HEX:
        out.append(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
    unique = []
    for c in out:
        if c not in unique:
            unique.append(c)
    return unique


def pil_palette_image(extra=None):
    """A 1-row P-mode image holding the master palette (for quantize())."""
    from PIL import Image
    cols = rgb_list()
    if extra:
        for c in extra:
            if c not in cols:
                cols.append(c)
    im = Image.new("P", (len(cols), 1))
    flat = []
    for c in cols:
        flat.extend(c)
    im.putpalette(flat + [0] * (768 - len(flat)))
    return im


# coat variants: hue targets in PIL 0-255 hue space, plus sat/val multipliers
COATS = {
    "classic": dict(fur=None, scarf=None),
    "ash": dict(fur=(150, 0.30, 1.04), scarf=(128, 0.85, 1.0)),
    "ember": dict(fur=(247, 1.05, 0.94), scarf=(30, 1.0, 1.05)),
    "mint": dict(fur=(96, 0.80, 1.0), scarf=(222, 0.75, 1.05)),
    "dusk": dict(fur=(196, 0.85, 0.98), scarf=(210, 0.45, 1.15)),
}


def shift_hex(h, spec):
    """apply a coat hue/sat/val shift to one hex colour"""
    import colorsys
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    hue, smul, vmul = spec
    hh = hue / 255.0
    ss = min(1.0, ss * smul)
    ll = min(1.0, ll * vmul)
    r, g, b = colorsys.hls_to_rgb(hh, ll, ss)
    return (round(r * 255), round(g * 255), round(b * 255))
