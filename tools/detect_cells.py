from PIL import Image
import numpy as np

im = Image.open("spritesheets/Buizel Spritesheet to Recut.jpg").convert("RGB")
a = np.asarray(im).astype(np.int16)
sat = a.max(axis=2) - a.min(axis=2)
lum = a.mean(axis=2)
cellbg = (sat < 34) & (lum > 138) & (lum < 200)

rows = [
    ("idle",    34, 174, 0, 470, 4),
    ("chop",    225, 347, 0, 896, 8),
    ("water",   384, 505, 0, 672, 5),
    ("mine",    539, 666, 0, 752, 5),
    ("eat",     697, 816, 0, 610, 5),
    ("drink",   846, 973, 0, 668, 5),
    ("jump",    1003, 1195, 0, 520, 4),
    ("victory", 1003, 1195, 530, 896, 2),
]

for name, y0, y1, x0, x1, n in rows:
    band = cellbg[y0:y1, x0:x1]
    prof = band.sum(axis=0).astype(float)
    thresh = prof.max() * 0.25
    solid = prof > thresh
    runs = []
    inrun = False
    for i, s in enumerate(solid):
        if s and not inrun:
            st = i; inrun = True
        elif not s and inrun:
            if i - st > 8:
                runs.append((st + x0, i - 1 + x0))
            inrun = False
    if inrun:
        runs.append((st + x0, len(solid) - 1 + x0))
    print(f"{name}: expected {n}, cells {len(runs)} -> {runs}")
