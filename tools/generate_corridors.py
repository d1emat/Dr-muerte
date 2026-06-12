#!/usr/bin/env python3
"""
Dr. Muerte — corridor chunk generator
Modular 8x8-tile (128x128 px) corridor pieces built from the hospital
tileset wall vocabulary. Chunks share fixed edge profiles so any two
pieces with open edges snap together seamlessly:

  open W/E edge: row0 cap, rows1-2 wall face, rows3-6 floor, row7 cap
  open N/S edge: col0 cap, cols1-6 floor, col7 cap

Outputs (assets/corridors/):
  corridor_chunks.json   all 11 chunks as 8x8 grids of atlas frame names
  chunks_x2.png          contact sheet of every piece
  demo.json / demo_x2.png  3x3-chunk sample map dressed with props
"""
import json
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
TILESET_DIR = os.path.join(ROOT, "assets", "tileset")
OUT_DIR = os.path.join(ROOT, "assets", "corridors")
os.makedirs(OUT_DIR, exist_ok=True)

sheet = Image.open(os.path.join(TILESET_DIR, "hospital_tileset.png")).convert("RGBA")
with open(os.path.join(TILESET_DIR, "hospital_tileset.json")) as f:
    FRAMES = json.load(f)["frames"]

N, T = 8, 16  # chunk is NxN tiles


def crop(name):
    f = FRAMES[name]["frame"]
    return sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))


def floor(r, c):
    return "floor_white_a" if (r + c) % 2 == 0 else "floor_white_b"


def grid():
    return [[None] * N for _ in range(N)]


def fill_floor(g, rows, cols):
    for r in rows:
        for c in cols:
            g[r][c] = floor(r, c)


# --- piece builders (see edge profiles in the docstring) -----------------
def corridor_h():
    g = grid()
    for c in range(N):
        g[0][c] = "wall_cap_h"
        g[1][c] = "wall_face_top"
        g[2][c] = "wall_face_bottom"
        g[7][c] = "wall_cap_h"
    fill_floor(g, range(3, 7), range(N))
    return g

def corridor_v():
    g = grid()
    for r in range(N):
        g[r][0] = "wall_cap_v"
        g[r][7] = "wall_cap_v"
    fill_floor(g, range(N), range(1, 7))
    return g

def corner_tl():  # open E + S
    g = grid()
    g[0][0] = "wall_cap_corner_tl"
    for c in range(1, N):
        g[0][c] = "wall_cap_h"
        g[1][c] = "wall_face_top"
        g[2][c] = "wall_face_bottom"
    for r in range(1, N):
        g[r][0] = "wall_cap_v"
    fill_floor(g, range(3, 7), range(1, N))
    fill_floor(g, (7,), range(1, 7))
    g[7][7] = "wall_cap_corner_tl"
    return g

def corner_tr():  # open W + S
    g = grid()
    g[0][7] = "wall_cap_corner_tr"
    for c in range(0, 7):
        g[0][c] = "wall_cap_h"
        g[1][c] = "wall_face_top"
        g[2][c] = "wall_face_bottom"
    for r in range(1, N):
        g[r][7] = "wall_cap_v"
    fill_floor(g, range(3, 7), range(0, 7))
    fill_floor(g, (7,), range(1, 7))
    g[7][0] = "wall_cap_corner_tr"
    return g

def corner_bl():  # open N + E
    g = grid()
    for r in range(0, 7):
        g[r][0] = "wall_cap_v"
    g[0][7] = "wall_cap_corner_bl"
    g[1][7] = "wall_face_top"
    g[2][7] = "wall_face_bottom"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(1, N))
    g[7][0] = "wall_cap_inner_tr"
    for c in range(1, N):
        g[7][c] = "wall_cap_h"
    return g

def corner_br():  # open N + W
    g = grid()
    for r in range(0, 7):
        g[r][7] = "wall_cap_v"
    g[0][0] = "wall_cap_corner_br"
    g[1][0] = "wall_face_top"
    g[2][0] = "wall_face_bottom"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(0, 7))
    g[7][7] = "wall_cap_inner_tl"
    for c in range(0, 7):
        g[7][c] = "wall_cap_h"
    return g

def t_up():  # open N + W + E
    g = grid()
    g[0][0] = "wall_cap_corner_br"
    g[1][0] = "wall_face_top"
    g[2][0] = "wall_face_bottom"
    g[0][7] = "wall_cap_corner_bl"
    g[1][7] = "wall_face_top"
    g[2][7] = "wall_face_bottom"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(N))
    for c in range(N):
        g[7][c] = "wall_cap_h"
    return g

def t_down():  # open S + W + E
    g = grid()
    for c in range(N):
        g[0][c] = "wall_cap_h"
        g[1][c] = "wall_face_top"
        g[2][c] = "wall_face_bottom"
    fill_floor(g, range(3, 7), range(N))
    fill_floor(g, (7,), range(1, 7))
    g[7][0] = "wall_cap_corner_tr"
    g[7][7] = "wall_cap_corner_tl"
    return g

def t_left():  # open N + S + W
    g = grid()
    for r in range(N):
        g[r][7] = "wall_cap_v"
    g[0][0] = "wall_cap_corner_br"
    g[1][0] = "wall_face_top"
    g[2][0] = "wall_face_bottom"
    g[7][0] = "wall_cap_corner_tr"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(0, 7))
    fill_floor(g, (7,), range(1, 7))
    return g

def t_right():  # open N + S + E
    g = grid()
    for r in range(N):
        g[r][0] = "wall_cap_v"
    g[0][7] = "wall_cap_corner_bl"
    g[1][7] = "wall_face_top"
    g[2][7] = "wall_face_bottom"
    g[7][7] = "wall_cap_corner_tl"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(1, N))
    fill_floor(g, (7,), range(1, 7))
    return g

def cross():  # open all sides
    g = grid()
    for r, c in ((0, 0), (0, 7), (7, 0), (7, 7)):
        pass
    g[0][0] = "wall_cap_corner_br"
    g[1][0] = "wall_face_top"
    g[2][0] = "wall_face_bottom"
    g[0][7] = "wall_cap_corner_bl"
    g[1][7] = "wall_face_top"
    g[2][7] = "wall_face_bottom"
    g[7][0] = "wall_cap_corner_tr"
    g[7][7] = "wall_cap_corner_tl"
    fill_floor(g, range(0, 3), range(1, 7))
    fill_floor(g, range(3, 7), range(N))
    fill_floor(g, (7,), range(1, 7))
    return g


CHUNKS = {
    "corridor_h": corridor_h(),
    "corridor_v": corridor_v(),
    "corner_tl": corner_tl(),
    "corner_tr": corner_tr(),
    "corner_bl": corner_bl(),
    "corner_br": corner_br(),
    "t_up": t_up(),
    "t_down": t_down(),
    "t_left": t_left(),
    "t_right": t_right(),
    "cross": cross(),
}


def render_chunk(g):
    img = Image.new("RGBA", (N * T, N * T), (0x4a, 0x3b, 0x5c, 255))
    for r in range(N):
        for c in range(N):
            if g[r][c]:
                img.alpha_composite(crop(g[r][c]), (c * T, r * T))
    return img


# ---------------- contact sheet of all pieces
GAP = 8
cols_n = 4
rows_n = 3
cw = N * T * 2
contact = Image.new("RGBA", (cols_n * (cw + GAP) + GAP, rows_n * (cw + GAP) + GAP),
                    (0x4a, 0x3b, 0x5c, 255))
for i, (name, g) in enumerate(CHUNKS.items()):
    img = render_chunk(g).resize((cw, cw), Image.NEAREST)
    contact.alpha_composite(img, (GAP + (i % cols_n) * (cw + GAP),
                                  GAP + (i // cols_n) * (cw + GAP)))
contact.save(os.path.join(OUT_DIR, "chunks_x2.png"))

with open(os.path.join(OUT_DIR, "corridor_chunks.json"), "w") as f:
    json.dump({"chunkSize": N, "tileSize": T, "chunks": CHUNKS,
               "meta": {"tileset": "../tileset/hospital_tileset.png",
                        "atlas": "../tileset/hospital_tileset.json",
                        "edges": {"WE": "row0 cap, rows1-2 face, rows3-6 floor, row7 cap",
                                  "NS": "col0 cap, cols1-6 floor, col7 cap"}}},
              f, indent=1)

# ---------------- demo map: 3x3 chunks, all junction types, dressed
LAYOUT = [
    ["corner_tl", "t_down", "corner_tr"],
    ["t_right",  "cross",  "t_left"],
    ["corner_bl", "t_up",  "corner_br"],
]
DW, DH = 3 * N * T, 3 * N * T
demo = Image.new("RGBA", (DW, DH), (0x4a, 0x3b, 0x5c, 255))
for cr, row in enumerate(LAYOUT):
    for cc, name in enumerate(row):
        demo.alpha_composite(render_chunk(CHUNKS[name]), (cc * N * T, cr * N * T))

PROPS = [  # (frame, x, y) — pixel coords in the 384x384 demo
    # signs + alarm on the north wall faces
    ("sign_cross", 40, 18),
    ("sign_arrow_right", 152, 18),
    ("emergency_light", 200, 18),
    ("sign_arrow_left", 248, 18),
    ("sign_exit", 320, 18),
    # corridor dressing
    ("plant_tall", 20, 64),
    ("cleaning_cart", 88, 56),
    ("bench", 240, 64),
    ("wheelchair", 338, 168),
    ("vending_machine", 16, 160),
    ("water_dispenser", 32, 160),
    ("plant_small", 196, 196),
    ("emergency_light", 240, 274),     # on t_up's east face column
    ("plant_wilted", 352, 296),
    ("bench", 144, 320),
]
for frame, x, y in sorted(PROPS, key=lambda p: p[2] + FRAMES[p[0]]["frame"]["h"]):
    demo.alpha_composite(crop(frame), (x, y))

demo.resize((DW * 2, DH * 2), Image.NEAREST).save(os.path.join(OUT_DIR, "demo_x2.png"))
with open(os.path.join(OUT_DIR, "demo.json"), "w") as f:
    json.dump({"chunkLayout": LAYOUT,
               "objects": [{"frame": fr, "x": x, "y": y} for fr, x, y in PROPS]},
              f, indent=1)

print(f"OK: {len(CHUNKS)} chunks + demo -> {OUT_DIR}")
