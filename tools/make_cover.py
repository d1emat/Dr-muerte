#!/usr/bin/env python3
"""
Cover / key art generator for the jam page.
Composes the pixel-art cast + a pastel hospital backdrop + a hand-coded
pixel-font title into assets/cover.png (1280x720) and assets/cover_630.png.
Run:  python3 tools/make_cover.py
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")

# --- palette -----------------------------------------------------------
MINT   = (0xc9, 0xf0, 0xdd, 255)
MINT_S = (0x9b, 0xdb, 0xc1, 255)
WALL2  = (0xb7, 0xe7, 0xd3, 255)
CREAM  = (0xfd, 0xf2, 0xe0, 255)
CREAM2 = (0xf6, 0xe2, 0xc8, 255)
LAVB   = (0xb4, 0x9a, 0xdf, 255)
INK    = (0x4a, 0x3b, 0x5c, 255)
PAPER  = (0xff, 0xf6, 0xee, 255)
RED    = (0xef, 0x5d, 0x6f, 255)
YELLOW = (0xff, 0xd9, 0x70, 255)
SHAD   = (0x7a, 0x68, 0x90, 255)
GHOST  = (0xb9, 0xa8, 0xe8, 255)

# --- 5x7 pixel font ----------------------------------------------------
F = {
 " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
 "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
 "B": ["####.", "#...#", "####.", "#...#", "#...#", "#...#", "####."],
 "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
 "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
 "E": ["#####", "#....", "####.", "#....", "#....", "#....", "#####"],
 "F": ["#####", "#....", "####.", "#....", "#....", "#....", "#...."],
 "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
 "H": ["#...#", "#...#", "#####", "#...#", "#...#", "#...#", "#...#"],
 "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
 "J": ["#####", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
 "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
 "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
 "M": ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"],
 "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
 "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
 "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
 "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
 "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
 "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
 "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
 "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
 "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
 "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
 "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
 "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
 "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
 "0": [".###.", "#..##", "#.#.#", "#.#.#", "##..#", "#...#", ".###."],
 "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
 "2": [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
 "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
 "4": ["#..#.", "#..#.", "#..#.", "#####", "...#.", "...#.", "...#."],
 "5": ["#####", "#....", "####.", "....#", "....#", "....#", "####."],
 "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
 "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
 "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
 "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
 ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
 ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
 "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
 ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
 "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
 "'": ["..#..", "..#..", "..#..", ".....", ".....", ".....", "....."],
 "?": [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."],
}


def text_img(text, scale, fill, outline=INK):
    """Render `text` in the 5x7 font with a 1px outline; returns an RGBA image."""
    text = text.upper()
    gw, gh, sp = 5, 7, 1
    cols = len(text) * (gw + sp) - sp
    grid = [[0] * (cols + 2) for _ in range(gh + 2)]      # +1 border for outline
    x = 1
    for ch in text:
        g = F.get(ch, F["?"])
        for r in range(gh):
            for c in range(gw):
                if g[r][c] == "#":
                    grid[r + 1][x + c] = 1
        x += gw + sp
    # outline pass
    H, W = len(grid), len(grid[0])
    for r in range(H):
        for c in range(W):
            if grid[r][c] == 1:
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1),
                               (-1, -1), (-1, 1), (1, -1), (1, 1)):
                    if 0 <= r + dr < H and 0 <= c + dc < W and grid[r + dr][c + dc] == 0:
                        grid[r + dr][c + dc] = 2
    img = Image.new("RGBA", (W * scale, H * scale), (0, 0, 0, 0))
    px = img.load()
    for r in range(H):
        for c in range(W):
            col = fill if grid[r][c] == 1 else outline if grid[r][c] == 2 else None
            if col:
                for yy in range(scale):
                    for xx in range(scale):
                        px[c * scale + xx, r * scale + yy] = col
    return img


def paste_center(base, overlay, cx, top):
    base.alpha_composite(overlay, (cx - overlay.width // 2, top))


def char(name, scale):
    sheet = Image.open(os.path.join(ROOT, "assets", "characters", f"{name}.png")).convert("RGBA")
    frame = sheet.crop((0, 0, 16, 24))                    # idle_down, frame 0
    return frame.resize((16 * scale, 24 * scale), Image.NEAREST)


def furniture(frame, scale):
    import json
    atlas = json.load(open(os.path.join(ROOT, "assets", "tileset", "hospital_tileset.json")))["frames"]
    sheet = Image.open(os.path.join(ROOT, "assets", "tileset", "hospital_tileset.png")).convert("RGBA")
    f = atlas[frame]["frame"]
    crop = sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    return crop.resize((f["w"] * scale, f["h"] * scale), Image.NEAREST)


def backdrop(W, H, floor_y):
    img = Image.new("RGBA", (W, H), MINT)
    d = img.load()
    # wall gradient bands
    for y in range(0, floor_y):
        c = WALL2 if y < floor_y - 80 else MINT
        for x in range(W):
            d[x, y] = c
    # baseboard
    for y in range(floor_y - 8, floor_y - 2):
        for x in range(W):
            d[x, y] = LAVB
    # checker floor
    tile = 40
    for ty, yy in enumerate(range(floor_y, H, tile)):
        for tx, xx in enumerate(range(0, W, tile)):
            c = CREAM if (tx + ty) % 2 == 0 else CREAM2
            for y in range(yy, min(yy + tile, H)):
                for x in range(xx, min(xx + tile, W)):
                    d[x, y] = c
    return img


def red_cross(img, cx, cy, arm, thick):
    d = img.load()
    for y in range(cy - arm, cy + arm):
        for x in range(cx - thick, cx + thick):
            if 0 <= x < img.width and 0 <= y < img.height:
                d[x, y] = RED
    for x in range(cx - arm, cx + arm):
        for y in range(cy - thick, cy + thick):
            if 0 <= x < img.width and 0 <= y < img.height:
                d[x, y] = RED


def shadow_under(img, cx, y, w):
    ov = Image.new("RGBA", (w, 12), (0, 0, 0, 0))
    od = ov.load()
    for yy in range(12):
        for xx in range(w):
            dx = (xx - w / 2) / (w / 2)
            dy = (yy - 6) / 6
            if dx * dx + dy * dy < 1:
                od[xx, yy] = (0x2e, 0x24, 0x38, 60)
    img.alpha_composite(ov, (cx - w // 2, y))


def build_cover(W, H, title_scale, sub_scale, tag_scale, cast_scale, with_furniture=True):
    floor_y = int(H * 0.52)
    img = backdrop(W, H, floor_y)

    # faint big cross behind the title
    red_cross_faint = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    red_cross(red_cross_faint, W // 2, int(H * 0.28), int(H * 0.16), int(H * 0.045))
    red_cross_faint.putalpha(red_cross_faint.getchannel("A").point(lambda a: a * 60 // 255))
    img.alpha_composite(red_cross_faint)

    # cast on the floor line
    cast = ["nurse", "doctor", "patient", "inspector"]
    n = len(cast)
    gap = W // (n + 1)
    base_y = floor_y + int(H * 0.30)
    for i, name in enumerate(cast):
        sc = char(name, cast_scale + (1 if name == "doctor" else 0))  # Death stands out
        cx = gap * (i + 1)
        shadow_under(img, cx, base_y - 6, int(sc.width * 0.95))
        img.alpha_composite(sc, (cx - sc.width // 2, base_y - sc.height))

    if with_furniture:
        bed = furniture("bed", cast_scale)
        img.alpha_composite(bed, (int(W * 0.04), base_y - bed.height))
        iv = furniture("iv_stand", cast_scale)
        img.alpha_composite(iv, (int(W * 0.92), base_y - iv.height))

    # title block
    t1 = text_img("DR. MUERTE", title_scale, PAPER, INK)
    paste_center(img, t1, W // 2, int(H * 0.07))
    t2 = text_img("TURNO DE NOCHE", sub_scale, RED, INK)
    paste_center(img, t2, W // 2, int(H * 0.07) + t1.height + sub_scale)

    # tagline ribbon at the bottom
    tag = text_img("ERES LA MUERTE DISFRAZADA DE MEDICO", tag_scale, PAPER, INK)
    ribbon_h = tag.height + tag_scale * 6
    rib = Image.new("RGBA", (W, ribbon_h), (0x4a, 0x3b, 0x5c, 235))
    img.alpha_composite(rib, (0, H - ribbon_h))
    paste_center(img, tag, W // 2, H - ribbon_h + tag_scale * 3)
    return img


out = os.path.join(ROOT, "assets")
build_cover(1280, 720, 11, 5, 4, 6).save(os.path.join(out, "cover.png"))
build_cover(630, 500, 6, 3, 2, 4, with_furniture=False).save(os.path.join(out, "cover_630.png"))
print("OK: assets/cover.png (1280x720) + assets/cover_630.png")
