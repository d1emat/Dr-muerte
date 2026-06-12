#!/usr/bin/env python3
"""
Dr. Muerte — Hospital tileset generator
Style: "Pastel Malpractice" (see ART_STYLE.md)
Outputs:
  assets/tileset/hospital_tileset.png   (native, 16px grid)
  assets/tileset/hospital_tileset.json  (Phaser 3 atlas, JSON hash)
  assets/tileset/preview_x4.png         (zoomed preview)
  assets/tileset/room_mockup_x4.png     (sample composed room)
"""
import json
import os
from PIL import Image, ImageDraw

# ---------------------------------------------------------------- palette
OUT    = (0x4a, 0x3b, 0x5c, 255)  # universal outline (dark purple)
SHAD   = (0x7a, 0x68, 0x90, 255)  # generic shadow purple
WHITE  = (0xff, 0xf6, 0xee, 255)  # warm white
GRAY   = (0xcf, 0xc6, 0xd9, 255)  # pastel gray (metal)
MINT   = (0xc9, 0xf0, 0xdd, 255)
MINT_S = (0x9b, 0xdb, 0xc1, 255)
CREAM  = (0xfd, 0xf2, 0xe0, 255)
CREAM2 = (0xf6, 0xe2, 0xc8, 255)
WOOD   = (0xe0, 0xb1, 0x84, 255)
WOOD_S = (0xb8, 0x83, 0x5c, 255)
BLUE   = (0xa8, 0xd8, 0xf5, 255)
BLUE_S = (0x7d, 0xb3, 0xdd, 255)
LAV    = (0xdc, 0xc8, 0xf2, 255)
LAV_S  = (0xb4, 0x9a, 0xdf, 255)
PINK   = (0xff, 0xb3, 0xc6, 255)
PINK_S = (0xef, 0x8a, 0xa8, 255)
RED    = (0xef, 0x5d, 0x6f, 255)
GREEN  = (0x6f, 0xd2, 0x93, 255)
YELLOW = (0xff, 0xd9, 0x70, 255)
GHOST  = (0xb9, 0xa8, 0xe8, 255)

T = 16  # tile size
SHEET_W, SHEET_H = 256, 128

sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
d = ImageDraw.Draw(sheet)
frames = {}


def reg(name, x, y, w, h):
    frames[name] = {"frame": {"x": x, "y": y, "w": w, "h": h},
                    "rotated": False, "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
                    "sourceSize": {"w": w, "h": h}}


# ---------------------------------------------------------------- helpers
def px(x, y, c):
    d.point((x, y), fill=c)


def rect(x, y, w, h, c):
    if w <= 0 or h <= 0:
        return
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)


def hline(x, y, w, c):
    rect(x, y, w, 1, c)


def vline(x, y, h, c):
    rect(x, y, 1, h, c)


def rbox(x, y, w, h, fill, line=OUT):
    """Filled box, 1px outline, rounded corners (corner pixels empty)."""
    hline(x + 1, y, w - 2, line)
    hline(x + 1, y + h - 1, w - 2, line)
    vline(x, y + 1, h - 2, line)
    vline(x + w - 1, y + 1, h - 2, line)
    rect(x + 1, y + 1, w - 2, h - 2, fill)


def ell(x0, y0, x1, y1, fill=None, line=None):
    d.ellipse([x0, y0, x1, y1], fill=fill, outline=line)


# ================================================================ FLOORS
def floor_white_a(x, y):
    rect(x, y, T, T, WHITE)
    hline(x, y + 15, 16, CREAM)
    vline(x + 15, y, 16, CREAM)


def floor_white_b(x, y):
    rect(x, y, T, T, CREAM)
    hline(x, y + 15, 16, CREAM2)
    vline(x + 15, y, 16, CREAM2)
    px(x + 4, y + 4, WHITE)  # waxed-floor sparkle


def floor_blue_a(x, y):
    rect(x, y, T, T, BLUE)
    hline(x, y + 15, 16, BLUE_S)
    vline(x + 15, y, 16, BLUE_S)
    px(x + 3, y + 3, WHITE)


def floor_blue_b(x, y):
    rect(x, y, T, T, WHITE)
    hline(x, y + 15, 16, BLUE)
    vline(x + 15, y, 16, BLUE)


def floor_er_a(x, y):
    rect(x, y, T, T, CREAM)
    hline(x, y + 15, 16, CREAM2)
    vline(x + 15, y, 16, CREAM2)
    # single hazard corner mark
    hline(x + 1, y + 1, 4, RED)
    vline(x + 1, y + 1, 4, RED)


def floor_er_b(x, y):
    rect(x, y, T, T, CREAM)
    hline(x, y + 15, 16, CREAM2)
    vline(x + 15, y, 16, CREAM2)
    # small red cross, center
    rect(x + 7, y + 5, 2, 6, RED)
    rect(x + 5, y + 7, 6, 2, RED)


def floor_lab_a(x, y):
    rect(x, y, T, T, MINT)
    hline(x, y + 15, 16, MINT_S)
    vline(x + 15, y, 16, MINT_S)
    px(x + 7, y + 7, MINT_S)


def floor_lab_b(x, y):
    rect(x, y, T, T, WHITE)
    hline(x, y + 15, 16, MINT)
    vline(x + 15, y, 16, MINT)
    px(x + 4, y + 4, MINT)


# ================================================================ WALLS
def wall_face_top(x, y):
    rect(x, y, T, T, MINT)
    hline(x, y, 16, MINT_S)          # shadow under the cap
    hline(x, y + 1, 16, MINT_S)


def wall_face_bottom(x, y):
    rect(x, y, T, T, MINT)
    hline(x, y + 3, 16, LAV)         # wallpaper accent stripe
    hline(x, y + 4, 16, LAV_S)
    rect(x, y + 12, 16, 3, WOOD)     # baseboard
    hline(x, y + 12, 16, WOOD_S)
    hline(x, y + 15, 16, OUT)        # meets the floor


def _cap_base(x, y):
    rect(x, y, T, T, MINT_S)


def wall_cap_h(x, y):
    _cap_base(x, y)
    hline(x, y, 16, OUT)
    hline(x, y + 15, 16, OUT)
    hline(x, y + 1, 16, MINT)        # top highlight


def wall_cap_v(x, y):
    _cap_base(x, y)
    vline(x, y, 16, OUT)
    vline(x + 15, y, 16, OUT)
    vline(x + 1, y, 16, MINT)


def _cap_corner(x, y, top, left):
    """Outer corner cap: outline on two adjacent edges, rounded."""
    _cap_base(x, y)
    hline(x, y if top else y + 15, 16, OUT)
    vline(x if left else x + 15, y, 16, OUT)
    # opposite edges keep their straight outline too (caps read as slabs)
    hline(x, y + 15 if top else y, 16, OUT)
    vline(x + 15 if left else x, y, 16, OUT)
    # round the outer corner: clear tip, re-anchor outline
    cx = x if left else x + 15
    cy = y if top else y + 15
    px(cx, cy, (0, 0, 0, 0))
    px(cx + (1 if left else -1), cy, OUT)
    px(cx, cy + (1 if top else -1), OUT)
    px(cx + (1 if left else -1), cy + (1 if top else -1), OUT)
    hline(x + 1, y + 1, 14, MINT)


def wall_cap_corner_tl(x, y): _cap_corner(x, y, True, True)
def wall_cap_corner_tr(x, y): _cap_corner(x, y, True, False)
def wall_cap_corner_bl(x, y): _cap_corner(x, y, False, True)
def wall_cap_corner_br(x, y): _cap_corner(x, y, False, False)


def _cap_inner(x, y, top, left):
    """Inner corner: wall fills the tile, outline only notches one corner."""
    _cap_base(x, y)
    hline(x, y + 1, 16, MINT)
    cx = x if left else x + 15
    cy = y if top else y + 15
    # small L of outline at that corner
    hline(cx if left else cx - 3, cy, 4, OUT)
    vline(cx, cy if top else cy - 3, 4, OUT)


def wall_cap_inner_tl(x, y): _cap_inner(x, y, True, True)
def wall_cap_inner_tr(x, y): _cap_inner(x, y, True, False)
def wall_cap_inner_bl(x, y): _cap_inner(x, y, False, True)
def wall_cap_inner_br(x, y): _cap_inner(x, y, False, False)


def _cap_end(x, y, side):
    """Free-standing wall end: outline wraps three sides."""
    _cap_base(x, y)
    if side in ("l", "r"):
        hline(x, y, 16, OUT)
        hline(x, y + 15, 16, OUT)
        vline(x if side == "l" else x + 15, y, 16, OUT)
        hline(x + 1, y + 1, 14, MINT)
    else:
        vline(x, y, 16, OUT)
        vline(x + 15, y, 16, OUT)
        hline(x, y if side == "t" else y + 15, 16, OUT)
        vline(x + 1, y + 1, 14, MINT)


def wall_cap_end_l(x, y): _cap_end(x, y, "l")
def wall_cap_end_r(x, y): _cap_end(x, y, "r")
def wall_cap_end_t(x, y): _cap_end(x, y, "t")
def wall_cap_end_b(x, y): _cap_end(x, y, "b")


# ================================================================ DOORS
def door_normal(x, y):  # 16x32, fits a 2-tile-tall wall opening
    # frame
    vline(x, y, 32, OUT)
    vline(x + 15, y, 32, OUT)
    hline(x + 1, y, 14, OUT)
    vline(x + 1, y + 1, 31, LAV)
    vline(x + 14, y + 1, 31, LAV)
    # slab
    rbox(x + 2, y + 2, 12, 30, WOOD)
    vline(x + 12, y + 4, 26, WOOD_S)          # side shading
    # porthole window
    rbox(x + 5, y + 6, 6, 6, BLUE)
    px(x + 6, y + 7, WHITE)
    # handle
    rect(x + 11, y + 17, 2, 2, YELLOW)
    px(x + 11, y + 19, OUT)
    # kick plate
    rect(x + 4, y + 26, 8, 3, GRAY)
    hline(x + 4, y + 25, 8, WOOD_S)


def door_locked(x, y):  # 16x32, gray metal + keypad
    vline(x, y, 32, OUT)
    vline(x + 15, y, 32, OUT)
    hline(x + 1, y, 14, OUT)
    vline(x + 1, y + 1, 31, LAV)
    vline(x + 14, y + 1, 31, LAV)
    rbox(x + 2, y + 2, 12, 30, GRAY)
    vline(x + 12, y + 4, 26, SHAD)
    # vents
    hline(x + 5, y + 5, 6, SHAD)
    hline(x + 5, y + 7, 6, SHAD)
    # keypad with red light
    rbox(x + 9, y + 14, 4, 6, WHITE)
    px(x + 10, y + 15, RED)
    px(x + 10, y + 17, OUT)
    px(x + 11, y + 17, OUT)
    # padlock icon
    rect(x + 4, y + 16, 3, 3, YELLOW)
    px(x + 5, y + 15, OUT)
    px(x + 5, y + 17, OUT)
    # hazard stripe
    for i in range(6):
        rect(x + 3 + i * 2, y + 27, 2, 2, YELLOW if i % 2 == 0 else OUT)


def door_auto(x, y):  # 32x32 sliding glass double door
    # top track + sensor
    rbox(x, y, 32, 5, GRAY)
    rect(x + 14, y + 1, 4, 2, GREEN)
    px(x + 14, y + 2, OUT)
    # glass panels
    for ox in (x + 1, x + 17):
        rbox(ox, y + 4, 14, 27, BLUE)
        # shine
        px(ox + 3, y + 7, WHITE); px(ox + 4, y + 8, WHITE)
        px(ox + 2, y + 8, WHITE)
        # mid rail
        hline(ox + 1, y + 17, 12, GRAY)
        hline(ox + 1, y + 18, 12, BLUE_S)
        # red cross decal
        rect(ox + 6, y + 10, 2, 4, RED)
        rect(ox + 5, y + 11, 4, 2, RED)
        # bottom shading
        hline(ox + 1, y + 29, 12, BLUE_S)


# ================================================================ FURNITURE
def bed(x, y):  # 16x32 vertical hospital bed (top-down)
    rbox(x, y, 16, 5, WOOD)                    # headboard (widest part)
    hline(x + 1, y + 3, 14, WOOD_S)
    rbox(x + 1, y + 4, 14, 27, WHITE)          # mattress
    rbox(x + 4, y + 6, 8, 6, WHITE)            # pillow (own outline)
    hline(x + 5, y + 10, 6, GRAY)
    rbox(x + 1, y + 14, 14, 16, BLUE)          # blanket
    hline(x + 2, y + 15, 12, WHITE)            # turned-down sheet
    hline(x + 2, y + 16, 12, WHITE)
    hline(x + 2, y + 20, 12, BLUE_S)           # folds
    hline(x + 2, y + 24, 12, BLUE_S)
    px(x + 7, y + 26, PINK); px(x + 9, y + 26, PINK)   # tiny heart
    px(x + 8, y + 27, PINK)
    rbox(x, y + 29, 16, 3, WOOD)               # foot rail


def chair_down(x, y):
    rbox(x + 3, y + 1, 10, 5, WOOD)            # backrest
    hline(x + 4, y + 4, 8, WOOD_S)
    rbox(x + 3, y + 5, 10, 7, BLUE)            # seat
    hline(x + 4, y + 10, 8, BLUE_S)
    vline(x + 4, y + 12, 2, OUT)               # legs
    vline(x + 11, y + 12, 2, OUT)
    hline(x + 3, y + 14, 10, SHAD)             # contact shadow


def chair_left(x, y):
    rbox(x + 9, y + 1, 4, 11, WOOD)            # backrest on right side
    vline(x + 11, y + 2, 9, WOOD_S)
    rbox(x + 2, y + 4, 9, 8, BLUE)             # seat
    hline(x + 3, y + 10, 7, BLUE_S)
    vline(x + 3, y + 12, 2, OUT)
    vline(x + 10, y + 12, 2, OUT)
    hline(x + 2, y + 14, 11, SHAD)


def chair_right(x, y):
    rbox(x + 3, y + 1, 4, 11, WOOD)
    vline(x + 4, y + 2, 9, WOOD_S)
    rbox(x + 5, y + 4, 9, 8, BLUE)
    hline(x + 6, y + 10, 7, BLUE_S)
    vline(x + 5, y + 12, 2, OUT)
    vline(x + 12, y + 12, 2, OUT)
    hline(x + 3, y + 14, 11, SHAD)


def desk(x, y):  # 32x16
    rbox(x + 1, y + 2, 30, 12, WOOD)
    rect(x + 2, y + 10, 28, 3, WOOD_S)         # front face
    rbox(x + 4, y + 4, 7, 6, WHITE)            # paper
    hline(x + 5, y + 5, 4, GRAY)
    hline(x + 5, y + 7, 4, GRAY)
    rect(x + 24, y + 4, 4, 4, PINK)            # mug
    px(x + 24, y + 4, OUT); px(x + 27, y + 4, OUT)
    px(x + 28, y + 5, OUT)                      # handle
    rect(x + 15, y + 6, 1, 4, YELLOW)          # pencil
    px(x + 15, y + 5, PINK_S)
    hline(x + 2, y + 14, 28, SHAD)


def reception_desk(x, y):  # 48x32
    rbox(x + 1, y + 13, 46, 18, BLUE)          # front panel
    hline(x + 2, y + 22, 44, MINT)             # accent stripe
    hline(x + 2, y + 23, 44, BLUE_S)
    rbox(x + 1, y + 6, 46, 9, WHITE)           # counter top
    hline(x + 2, y + 13, 44, GRAY)
    # bell
    rect(x + 6, y + 9, 3, 2, YELLOW)
    px(x + 7, y + 8, YELLOW)
    hline(x + 5, y + 11, 5, OUT)
    # clipboard
    rbox(x + 36, y + 7, 6, 7, WHITE)
    rect(x + 38, y + 7, 2, 1, GRAY)
    hline(x + 37, y + 9, 4, GRAY)
    hline(x + 37, y + 11, 4, GRAY)
    # heart logo on panel
    rect(x + 21, y + 16, 2, 2, PINK)
    rect(x + 25, y + 16, 2, 2, PINK)
    rect(x + 21, y + 18, 6, 2, PINK)
    rect(x + 22, y + 20, 4, 1, PINK)
    rect(x + 23, y + 21, 2, 1, PINK)


def locker(x, y):  # 16x32
    rbox(x + 2, y + 1, 12, 30, GRAY)
    hline(x + 3, y + 2, 10, WHITE)             # top highlight
    rect(x + 3, y + 4, 10, 2, LAV)             # color band
    hline(x + 4, y + 8, 8, SHAD)               # vents
    hline(x + 4, y + 10, 8, SHAD)
    vline(x + 11, y + 14, 4, OUT)              # handle
    rect(x + 6, y + 18, 4, 3, WHITE)           # name tag
    px(x + 7, y + 19, GRAY)
    vline(x + 12, y + 3, 26, SHAD)             # side shading
    hline(x + 2, y + 31, 12, SHAD)


def cabinet(x, y):  # 16x32 wooden cabinet
    rbox(x + 2, y + 1, 12, 30, WOOD)
    hline(x + 3, y + 2, 10, CREAM)             # top counter light
    hline(x + 3, y + 5, 10, WOOD_S)            # counter edge
    vline(x + 8, y + 7, 21, WOOD_S)            # door split
    px(x + 6, y + 16, OUT)                     # knobs
    px(x + 10, y + 16, OUT)
    hline(x + 3, y + 27, 10, WOOD_S)
    vline(x + 12, y + 3, 26, WOOD_S)
    hline(x + 2, y + 31, 12, SHAD)


def table_round(x, y):  # 16x16
    ell(x + 2, y + 3, x + 13, y + 12, fill=WOOD, line=OUT)
    ell(x + 4, y + 5, x + 11, y + 8, fill=CREAM2, line=None)
    hline(x + 4, y + 14, 8, SHAD)


def table_rect(x, y):  # 32x16 cafeteria table
    rbox(x + 1, y + 2, 30, 11, WHITE)
    hline(x + 2, y + 10, 28, GRAY)             # edge
    rect(x + 2, y + 11, 28, 2, MINT)           # apron
    vline(x + 4, y + 13, 2, OUT)
    vline(x + 27, y + 13, 2, OUT)
    hline(x + 3, y + 15, 26, SHAD)


def wheelchair(x, y):  # 16x16
    ell(x + 1, y + 5, x + 6, y + 13, fill=GRAY, line=OUT)
    ell(x + 9, y + 5, x + 14, y + 13, fill=GRAY, line=OUT)
    px(x + 3, y + 9, OUT); px(x + 12, y + 9, OUT)       # hubs
    rbox(x + 4, y + 2, 8, 9, BLUE)             # seat back (top view)
    hline(x + 5, y + 9, 6, BLUE_S)
    rect(x + 5, y, 2, 2, OUT); rect(x + 9, y, 2, 2, OUT)  # handles
    hline(x + 6, y + 13, 4, GRAY)              # footrest
    hline(x + 5, y + 15, 6, SHAD)


def bench(x, y):  # 32x16
    rbox(x + 1, y + 3, 30, 8, BLUE)
    for i in range(1, 5):
        vline(x + 1 + i * 6, y + 4, 6, BLUE_S)  # slats
    vline(x + 4, y + 11, 3, OUT)
    vline(x + 27, y + 11, 3, OUT)
    hline(x + 3, y + 14, 26, SHAD)


def vending(x, y):  # 16x32
    rbox(x + 2, y + 1, 12, 30, PINK)
    vline(x + 12, y + 3, 26, PINK_S)
    rbox(x + 3, y + 3, 8, 13, OUT, OUT)        # dark window
    # snacks
    for row, cols in enumerate(((YELLOW, GREEN), (BLUE, RED), (LAV, YELLOW))):
        for ci, c in enumerate(cols):
            rect(x + 4 + ci * 3, y + 4 + row * 4, 2, 3, c)
    px(x + 9, y + 4, WHITE)                    # glass shine
    px(x + 10, y + 5, WHITE)
    rect(x + 12, y + 6, 1, 3, OUT)             # coin slot
    px(x + 12, y + 11, GREEN)                  # button
    rbox(x + 4, y + 24, 8, 5, PINK_S)          # flap
    hline(x + 2, y + 31, 12, SHAD)


def water_dispenser(x, y):  # 16x32 (12px wide, bottom anchored)
    rbox(x + 4, y + 13, 9, 18, WHITE)          # body
    vline(x + 11, y + 15, 14, GRAY)
    rbox(x + 4, y + 2, 9, 12, BLUE)            # bottle
    rect(x + 5, y + 8, 7, 5, BLUE_S)           # water level
    vline(x + 6, y + 4, 6, WHITE)              # shine
    px(x + 6, y + 17, BLUE)                    # cold tap
    px(x + 9, y + 17, RED)                     # hot tap
    rect(x + 6, y + 19, 5, 1, GRAY)            # drip tray
    hline(x + 4, y + 31, 9, SHAD)


def plant_small(x, y):  # 16x16
    rbox(x + 5, y + 9, 6, 6, WOOD)
    hline(x + 5, y + 9, 6, WOOD_S)
    rect(x + 6, y + 3, 4, 6, GREEN)            # leaf blob
    px(x + 5, y + 4, GREEN); px(x + 10, y + 4, GREEN)
    px(x + 4, y + 5, GREEN); px(x + 11, y + 5, GREEN)
    px(x + 7, y + 2, GREEN); px(x + 8, y + 2, GREEN)
    px(x + 7, y + 3, MINT)                     # highlight
    px(x + 6, y + 2, OUT); px(x + 9, y + 2, OUT)   # partial outline
    hline(x + 5, y + 15, 6, SHAD)


def plant_wilted(x, y):  # 16x16 easter-egg plant
    rbox(x + 5, y + 9, 6, 6, WOOD)
    hline(x + 5, y + 9, 6, WOOD_S)
    # drooping stems
    px(x + 7, y + 5, WOOD_S); px(x + 7, y + 6, WOOD_S)
    px(x + 6, y + 7, WOOD_S); px(x + 5, y + 8, WOOD_S)
    px(x + 9, y + 6, WOOD_S); px(x + 10, y + 7, WOOD_S)
    px(x + 11, y + 8, WOOD_S); px(x + 12, y + 9, WOOD_S)
    px(x + 4, y + 9, YELLOW)                   # fallen leaf
    px(x + 13, y + 10, YELLOW)
    hline(x + 5, y + 15, 6, SHAD)


def plant_tall(x, y):  # 16x32
    rbox(x + 4, y + 23, 8, 8, WOOD)
    hline(x + 4, y + 23, 8, WOOD_S)
    hline(x + 5, y + 26, 6, WOOD_S)
    vline(x + 7, y + 14, 9, GREEN)             # stem
    # leaves (three blobs)
    for lx, ly, w, h in ((x + 3, y + 8, 5, 6), (x + 8, y + 5, 6, 7), (x + 5, y + 13, 6, 5)):
        ell(lx, ly, lx + w, ly + h, fill=GREEN, line=OUT)
    px(x + 10, y + 7, MINT)
    px(x + 5, y + 10, MINT)
    hline(x + 4, y + 31, 8, SHAD)


# ================================================================ MEDICAL
def iv_stand(x, y):  # 16x32
    vline(x + 8, y + 2, 27, GRAY)              # pole
    vline(x + 7, y + 2, 27, OUT)
    vline(x + 9, y + 2, 27, OUT)
    hline(x + 4, y + 2, 9, OUT)                # hook bar
    rbox(x + 2, y + 4, 6, 9, WHITE)            # bag
    rect(x + 3, y + 9, 4, 3, BLUE)             # fluid
    hline(x + 3, y + 6, 4, RED)                # label
    vline(x + 4, y + 13, 8, BLUE_S)            # tube
    px(x + 5, y + 21, BLUE_S)
    hline(x + 4, y + 29, 9, OUT)               # base
    px(x + 3, y + 30, OUT); px(x + 13, y + 30, OUT)    # casters
    hline(x + 4, y + 31, 9, SHAD)


def oxygen(x, y):  # 16x32
    # tank
    rbox(x + 2, y + 4, 5, 18, BLUE)
    hline(x + 3, y + 3, 3, OUT)
    px(x + 4, y + 2, OUT)                      # valve
    vline(x + 3, y + 6, 12, WHITE)             # shine
    px(x + 4, y + 7, GREEN)                    # gauge
    # machine
    rbox(x + 8, y + 9, 7, 22, WHITE)
    rect(x + 9, y + 11, 3, 3, GREEN)           # dial
    px(x + 12, y + 12, YELLOW)
    hline(x + 9, y + 17, 5, SHAD)              # vents
    hline(x + 9, y + 19, 5, SHAD)
    hline(x + 9, y + 21, 5, SHAD)
    px(x + 7, y + 8, BLUE_S)                   # tube
    px(x + 6, y + 7, BLUE_S)
    hline(x + 2, y + 31, 13, SHAD)


def heart_monitor(x, y):  # 16x32
    rbox(x + 2, y + 1, 12, 11, OUT, OUT)       # screen (dark)
    # ECG trace
    for i, dy in enumerate((6, 6, 5, 3, 7, 5, 6, 6, 6, 5)):
        px(x + 3 + i, y + dy, GREEN)
    px(x + 12, y + 2, RED)                     # rec light
    rbox(x + 2, y + 12, 12, 5, GRAY)           # button panel
    px(x + 4, y + 14, YELLOW)
    px(x + 6, y + 14, GREEN)
    px(x + 8, y + 14, RED)
    vline(x + 7, y + 17, 11, OUT)              # pole
    vline(x + 8, y + 17, 11, GRAY)
    hline(x + 4, y + 28, 9, OUT)               # base
    px(x + 3, y + 29, OUT); px(x + 13, y + 29, OUT)
    hline(x + 4, y + 31, 9, SHAD)


def surgery_table(x, y):  # 16x32
    rbox(x + 2, y + 2, 12, 28, GRAY)
    rbox(x + 3, y + 4, 10, 22, MINT)           # padded top
    rbox(x + 4, y + 5, 8, 5, LAV)              # head pad
    hline(x + 4, y + 20, 8, MINT_S)            # crease
    vline(x + 2, y + 8, 16, WHITE)             # side rails
    vline(x + 13, y + 8, 16, WHITE)
    hline(x + 3, y + 31, 10, SHAD)


def surgery_lamp(x, y):  # 32x32
    vline(x + 15, y + 1, 7, OUT)               # arm from ceiling mount
    vline(x + 16, y + 1, 7, GRAY)
    vline(x + 17, y + 1, 7, OUT)
    hline(x + 13, y, 6, OUT)                   # mount
    ell(x + 7, y + 8, x + 24, y + 25, fill=GRAY, line=OUT)   # lamp head
    ell(x + 10, y + 11, x + 21, y + 22, fill=YELLOW, line=None)
    rect(x + 14, y + 15, 3, 3, WHITE)          # hot spot
    px(x + 6, y + 16, YELLOW)                  # glow ticks
    px(x + 25, y + 16, YELLOW)
    px(x + 15, y + 27, YELLOW)


def medicine_shelf(x, y):  # 32x32
    rbox(x + 1, y + 1, 30, 30, WHITE)
    # red cross plate
    rect(x + 14, y + 3, 4, 2, RED)
    rect(x + 15, y + 2, 2, 4, RED)
    # shelf boards + bottles
    for sy in (y + 13, y + 22):
        hline(x + 2, sy, 28, GRAY)
        hline(x + 2, sy + 1, 28, SHAD)
    cols = (RED, GREEN, YELLOW, BLUE, PINK, LAV_S)
    for i, c in enumerate(cols):
        rect(x + 3 + i * 5, y + 8, 3, 5, c)
        px(x + 4 + i * 5, y + 7, OUT)
    for i, c in enumerate((BLUE, PINK, GREEN, LAV_S, YELLOW, RED)):
        rect(x + 3 + i * 5, y + 17, 3, 5, c)
        px(x + 4 + i * 5, y + 16, OUT)
    # glass doors shine
    px(x + 4, y + 26, GRAY); px(x + 5, y + 27, GRAY)
    vline(x + 16, y + 24, 6, GRAY)             # door split
    hline(x + 2, y + 31, 28, SHAD)


def ct_scanner(x, y):  # 48x32
    rbox(x + 2, y + 25, 44, 6, GRAY)           # base pad
    hline(x + 3, y + 26, 42, WHITE)
    # patient bed sliding out
    rbox(x + 22, y + 12, 24, 9, WHITE)
    rbox(x + 39, y + 13, 6, 7, LAV)            # pillow end
    # gantry donut
    ell(x + 1, y + 1, x + 23, y + 27, fill=LAV, line=OUT)
    ell(x + 5, y + 6, x + 19, y + 22, fill=LAV_S, line=None)
    ell(x + 7, y + 8, x + 17, y + 20, fill=OUT, line=None)   # bore
    px(x + 11, y + 3, GREEN)                   # status light
    px(x + 13, y + 3, GREEN)
    rect(x + 26, y + 22, 6, 3, YELLOW)         # control strip
    px(x + 33, y + 23, GREEN)


def lab_machine(x, y):  # 32x32
    # vial rack on top
    hline(x + 5, y + 5, 14, OUT)
    for i, c in enumerate((RED, GREEN, YELLOW, BLUE)):
        rect(x + 6 + i * 3, y + 1, 2, 4, c)
    rbox(x + 1, y + 6, 30, 25, WHITE)
    rbox(x + 4, y + 9, 13, 10, BLUE)           # screen
    for i, dy in enumerate((15, 14, 13, 14, 12, 13, 11, 12, 10, 11)):
        px(x + 6 + i, y + dy - 1, GREEN)       # graph
    # knobs / buttons
    rect(x + 21, y + 10, 3, 3, YELLOW)
    rect(x + 26, y + 10, 3, 3, RED)
    rect(x + 21, y + 15, 8, 2, GRAY)
    hline(x + 4, y + 24, 24, SHAD)             # vents
    hline(x + 4, y + 26, 24, SHAD)
    vline(x + 29, y + 8, 22, GRAY)
    hline(x + 2, y + 31, 28, SHAD)


def microscope(x, y):  # 16x16
    rbox(x + 3, y + 12, 10, 3, GRAY)           # base
    vline(x + 9, y + 3, 9, SHAD)               # arm
    vline(x + 10, y + 3, 9, OUT)
    rbox(x + 6, y + 1, 5, 4, GRAY)             # eyepiece head
    px(x + 7, y + 5, OUT)                      # lens
    px(x + 7, y + 6, OUT)
    hline(x + 4, y + 9, 6, GRAY)               # stage
    px(x + 6, y + 8, YELLOW)                   # slide
    hline(x + 4, y + 15, 9, SHAD)


# ================================================================ PROPS (room dressing)
def computer(x, y):  # 16x16, sits on desks/counters
    rbox(x + 3, y + 1, 10, 9, GRAY)            # monitor shell
    rect(x + 4, y + 2, 8, 6, BLUE)             # screen
    hline(x + 5, y + 3, 4, GREEN)              # text lines
    hline(x + 5, y + 5, 6, GREEN)
    px(x + 11, y + 2, WHITE)                   # shine
    rect(x + 7, y + 10, 2, 2, OUT)             # stand
    rbox(x + 2, y + 12, 12, 4, WHITE)          # keyboard
    hline(x + 4, y + 13, 8, GRAY)


def coffee_machine(x, y):  # 16x16 counter-top
    px(x + 7, y, GRAY)                         # steam
    px(x + 8, y + 1, GRAY)
    rbox(x + 3, y + 2, 10, 13, PINK)
    hline(x + 4, y + 3, 8, PINK_S)
    rect(x + 5, y + 6, 6, 5, OUT)              # brew opening
    rect(x + 6, y + 8, 4, 3, WOOD_S)           # pot
    px(x + 11, y + 4, GREEN)                   # buttons
    px(x + 11, y + 6, RED)
    hline(x + 5, y + 12, 6, GRAY)              # drip tray
    hline(x + 4, y + 15, 8, SHAD)


def microwave(x, y):  # 16x16 counter-top
    rbox(x + 1, y + 4, 14, 9, WHITE)
    rect(x + 3, y + 6, 7, 5, OUT)              # window
    rect(x + 5, y + 8, 3, 2, YELLOW)           # food
    px(x + 12, y + 6, GREEN)                   # buttons
    px(x + 12, y + 8, RED)
    hline(x + 11, y + 10, 3, GRAY)
    px(x + 2, y + 13, OUT)                     # feet
    px(x + 13, y + 13, OUT)
    hline(x + 2, y + 14, 12, SHAD)


def medicine_box(x, y):  # 16x16 stacked supply boxes
    rbox(x + 1, y + 7, 10, 8, WHITE)           # bottom box
    rect(x + 5, y + 9, 2, 4, RED)              # cross
    rect(x + 4, y + 10, 4, 2, RED)
    rbox(x + 6, y + 1, 9, 7, BLUE)             # top box
    vline(x + 10, y + 2, 5, WHITE)             # tape
    hline(x + 2, y + 15, 12, SHAD)


def flask_set(x, y):  # 16x16 chemical bottles
    rbox(x + 2, y + 8, 8, 6, GREEN)            # erlenmeyer body
    rbox(x + 4, y + 2, 4, 7, WHITE)            # glass neck
    px(x + 4, y + 10, WHITE)                   # bubble
    px(x + 7, y + 11, WHITE)
    rbox(x + 11, y + 4, 4, 9, BLUE)            # test tube
    rect(x + 12, y + 5, 2, 3, WHITE)           # empty top
    hline(x + 2, y + 14, 12, SHAD)


def test_tubes(x, y):  # 16x16 rack of tubes
    hline(x + 2, y + 8, 12, WOOD)              # rack top bar
    vline(x + 2, y + 8, 5, WOOD_S)             # posts
    vline(x + 13, y + 8, 5, WOOD_S)
    for i, c in enumerate((RED, GREEN, YELLOW)):
        rect(x + 4 + i * 3, y + 4, 2, 9, c)
        hline(x + 4 + i * 3, y + 3, 2, GRAY)   # glass rim
    hline(x + 2, y + 13, 12, WOOD)             # base
    hline(x + 3, y + 15, 10, SHAD)


def surgery_tools(x, y):  # 16x16 instrument tray
    rbox(x + 1, y + 3, 14, 11, GRAY)
    hline(x + 2, y + 4, 12, WHITE)             # rim light
    vline(x + 4, y + 6, 4, WHITE)              # scalpel blade
    vline(x + 4, y + 10, 2, OUT)               # handle
    px(x + 8, y + 6, OUT); px(x + 9, y + 7, OUT)       # scissors
    px(x + 10, y + 8, OUT); px(x + 10, y + 6, OUT)
    px(x + 8, y + 8, OUT)
    vline(x + 12, y + 6, 5, WHITE)             # forceps
    px(x + 12, y + 6, OUT)
    hline(x + 2, y + 14, 12, SHAD)


def refrigerator(x, y):  # 16x32
    rbox(x + 2, y + 1, 12, 30, WHITE)
    vline(x + 12, y + 3, 26, GRAY)             # side shading
    hline(x + 3, y + 11, 10, GRAY)             # door split
    vline(x + 4, y + 4, 4, OUT)                # freezer handle
    vline(x + 4, y + 14, 6, OUT)               # main handle
    px(x + 9, y + 5, BLUE)                     # snowflake
    px(x + 8, y + 6, BLUE); px(x + 10, y + 6, BLUE)
    px(x + 9, y + 7, BLUE)
    rect(x + 8, y + 17, 2, 4, RED)             # pharma cross
    rect(x + 7, y + 18, 4, 2, RED)
    hline(x + 2, y + 31, 12, SHAD)


# ================================================================ CORRIDOR PROPS
def _sign_chains(x, y):
    vline(x + 4, y + 1, 2, OUT)
    vline(x + 11, y + 1, 2, OUT)


def sign_cross(x, y):  # 16x16 hanging ward sign
    _sign_chains(x, y)
    rbox(x + 2, y + 3, 12, 10, WHITE)
    rect(x + 7, y + 5, 2, 6, RED)
    rect(x + 5, y + 7, 6, 2, RED)


def sign_arrow_right(x, y):  # 16x16 directional sign
    _sign_chains(x, y)
    rbox(x + 2, y + 3, 12, 10, BLUE)
    hline(x + 4, y + 8, 7, WHITE)
    px(x + 9, y + 6, WHITE); px(x + 10, y + 7, WHITE)
    px(x + 9, y + 10, WHITE); px(x + 10, y + 9, WHITE)


def sign_arrow_left(x, y):
    _sign_chains(x, y)
    rbox(x + 2, y + 3, 12, 10, BLUE)
    hline(x + 5, y + 8, 7, WHITE)
    px(x + 6, y + 6, WHITE); px(x + 5, y + 7, WHITE)
    px(x + 6, y + 10, WHITE); px(x + 5, y + 9, WHITE)


def sign_exit(x, y):  # 16x16 green exit sign
    _sign_chains(x, y)
    rbox(x + 2, y + 3, 12, 10, GREEN)
    rect(x + 4, y + 5, 4, 6, WHITE)            # door
    rect(x + 5, y + 6, 2, 4, OUT)              # opening
    hline(x + 9, y + 8, 3, WHITE)              # arrow out
    px(x + 10, y + 7, WHITE); px(x + 10, y + 9, WHITE)


def emergency_light(x, y):  # 16x16 wall-mounted alarm light
    rbox(x + 4, y + 9, 8, 4, GRAY)             # base plate
    rbox(x + 5, y + 4, 6, 6, RED)              # dome
    px(x + 6, y + 5, PINK)                     # shine
    px(x + 3, y + 5, YELLOW)                   # glow ticks
    px(x + 12, y + 5, YELLOW)
    px(x + 7, y + 1, YELLOW); px(x + 8, y + 1, YELLOW)


def cleaning_cart(x, y):  # 16x32 janitor cart with mop
    # mop (leaning, head up)
    rbox(x + 10, y + 1, 5, 4, GRAY)            # mop head
    vline(x + 11, y + 4, 2, GRAY)              # strands
    vline(x + 13, y + 4, 2, GRAY)
    for i, (dx, dy) in enumerate(((13, 5), (12, 6), (12, 7), (11, 8),
                                  (11, 9), (10, 10), (10, 11), (9, 12),
                                  (9, 13), (8, 14), (8, 15))):
        px(x + dx, y + dy, WOOD_S)             # handle
    # bucket on top
    rbox(x + 2, y + 11, 7, 7, GRAY)
    rect(x + 3, y + 12, 5, 2, BLUE)            # water
    # spray bottle
    rect(x + 11, y + 14, 2, 3, PINK)
    px(x + 11, y + 13, OUT)
    # cart body
    rbox(x + 1, y + 17, 14, 11, YELLOW)
    hline(x + 2, y + 18, 12, WHITE)
    for i in range(4):                         # caution dashes
        px(x + 3 + i * 3, y + 23, OUT)
    px(x + 3, y + 28, OUT)                     # wheels
    px(x + 12, y + 28, OUT)
    hline(x + 2, y + 30, 12, SHAD)


# ================================================================ layout
ASSETS = [
    # name, draw_fn, x, y, w, h
    ("floor_white_a",      floor_white_a,      0,   0, 16, 16),
    ("floor_white_b",      floor_white_b,      16,  0, 16, 16),
    ("floor_blue_a",       floor_blue_a,       32,  0, 16, 16),
    ("floor_blue_b",       floor_blue_b,       48,  0, 16, 16),
    ("floor_er_a",         floor_er_a,         64,  0, 16, 16),
    ("floor_er_b",         floor_er_b,         80,  0, 16, 16),
    ("floor_lab_a",        floor_lab_a,        96,  0, 16, 16),
    ("floor_lab_b",        floor_lab_b,        112, 0, 16, 16),
    ("wall_face_top",      wall_face_top,      128, 0, 16, 16),
    ("wall_face_bottom",   wall_face_bottom,   144, 0, 16, 16),
    ("wall_cap_h",         wall_cap_h,         160, 0, 16, 16),
    ("wall_cap_v",         wall_cap_v,         176, 0, 16, 16),
    ("wall_cap_corner_tl", wall_cap_corner_tl, 192, 0, 16, 16),
    ("wall_cap_corner_tr", wall_cap_corner_tr, 208, 0, 16, 16),
    ("wall_cap_corner_bl", wall_cap_corner_bl, 224, 0, 16, 16),
    ("wall_cap_corner_br", wall_cap_corner_br, 240, 0, 16, 16),

    ("wall_cap_inner_tl",  wall_cap_inner_tl,  0,   16, 16, 16),
    ("wall_cap_inner_tr",  wall_cap_inner_tr,  16,  16, 16, 16),
    ("wall_cap_inner_bl",  wall_cap_inner_bl,  32,  16, 16, 16),
    ("wall_cap_inner_br",  wall_cap_inner_br,  48,  16, 16, 16),
    ("wall_cap_end_l",     wall_cap_end_l,     64,  16, 16, 16),
    ("wall_cap_end_r",     wall_cap_end_r,     80,  16, 16, 16),
    ("wall_cap_end_t",     wall_cap_end_t,     96,  16, 16, 16),
    ("wall_cap_end_b",     wall_cap_end_b,     112, 16, 16, 16),
    ("chair_down",         chair_down,         128, 16, 16, 16),
    ("chair_left",         chair_left,         144, 16, 16, 16),
    ("chair_right",        chair_right,        160, 16, 16, 16),
    ("wheelchair",         wheelchair,         176, 16, 16, 16),
    ("microscope",         microscope,         192, 16, 16, 16),
    ("plant_small",        plant_small,        208, 16, 16, 16),
    ("plant_wilted",       plant_wilted,       224, 16, 16, 16),
    ("table_round",        table_round,        240, 16, 16, 16),

    ("door_normal",        door_normal,        0,   32, 16, 32),
    ("door_locked",        door_locked,        16,  32, 16, 32),
    ("door_auto",          door_auto,          32,  32, 32, 32),
    ("bed",                bed,                64,  32, 16, 32),
    ("locker",             locker,             80,  32, 16, 32),
    ("cabinet",            cabinet,            96,  32, 16, 32),
    ("vending_machine",    vending,            112, 32, 16, 32),
    ("water_dispenser",    water_dispenser,    128, 32, 16, 32),
    ("iv_stand",           iv_stand,           144, 32, 16, 32),
    ("oxygen_machine",     oxygen,             160, 32, 16, 32),
    ("heart_monitor",      heart_monitor,      176, 32, 16, 32),
    ("plant_tall",         plant_tall,         192, 32, 16, 32),
    ("surgery_table",      surgery_table,      208, 32, 16, 32),
    ("medicine_shelf",     medicine_shelf,     224, 32, 32, 32),

    ("surgery_lamp",       surgery_lamp,       0,   64, 32, 32),
    ("reception_desk",     reception_desk,     32,  64, 48, 32),
    ("ct_scanner",         ct_scanner,         80,  64, 48, 32),
    ("lab_machine",        lab_machine,        128, 64, 32, 32),
    ("desk",               desk,               160, 64, 32, 16),
    ("bench",              bench,              160, 80, 32, 16),
    ("table_rect",         table_rect,         192, 64, 32, 16),

    ("computer",           computer,           0,   96, 16, 16),
    ("coffee_machine",     coffee_machine,     16,  96, 16, 16),
    ("microwave",          microwave,          32,  96, 16, 16),
    ("medicine_box",       medicine_box,       48,  96, 16, 16),
    ("flask_set",          flask_set,          64,  96, 16, 16),
    ("test_tubes",         test_tubes,         80,  96, 16, 16),
    ("surgery_tools",      surgery_tools,      96,  96, 16, 16),
    ("refrigerator",       refrigerator,       112, 96, 16, 32),

    ("sign_cross",         sign_cross,         128, 96, 16, 16),
    ("sign_arrow_right",   sign_arrow_right,   144, 96, 16, 16),
    ("sign_arrow_left",    sign_arrow_left,    160, 96, 16, 16),
    ("sign_exit",          sign_exit,          176, 96, 16, 16),
    ("emergency_light",    emergency_light,    192, 96, 16, 16),
    ("cleaning_cart",      cleaning_cart,      208, 96, 16, 32),
]

for name, fn, x, y, w, h in ASSETS:
    fn(x, y)
    reg(name, x, y, w, h)

# ---------------------------------------------------------------- output
out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "tileset")
os.makedirs(out_dir, exist_ok=True)

png_path = os.path.join(out_dir, "hospital_tileset.png")
sheet.save(png_path)

atlas = {
    "frames": frames,
    "meta": {
        "app": "generate_tileset.py",
        "image": "hospital_tileset.png",
        "format": "RGBA8888",
        "size": {"w": SHEET_W, "h": SHEET_H},
        "scale": "1",
        "tileSize": 16,
        "note": "Rows y=0..31 are pure 16x16 tilemap tiles (16 columns; "
                "index = row*16 + col). Larger frames are furniture/equipment "
                "sprites — place them as objects, not tiles.",
    },
}
with open(os.path.join(out_dir, "hospital_tileset.json"), "w") as f:
    json.dump(atlas, f, indent=1)

# zoomed preview
sheet.resize((SHEET_W * 4, SHEET_H * 4), Image.NEAREST) \
     .save(os.path.join(out_dir, "preview_x4.png"))


# ---------------------------------------------------------------- mockup
def build_mockup():
    room = Image.new("RGBA", (320, 176), (0, 0, 0, 255))

    def stamp(name, tx, ty):
        f = frames[name]["frame"]
        tile = sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
        room.alpha_composite(tile, (tx, ty))

    # floor: white checker, lab corner
    for ty in range(2, 11):
        for tx in range(0, 20):
            if tx >= 14 and ty >= 6:
                name = "floor_lab_a" if (tx + ty) % 2 == 0 else "floor_lab_b"
            else:
                name = "floor_white_a" if (tx + ty) % 2 == 0 else "floor_white_b"
            stamp(name, tx * 16, ty * 16)
    # back wall (2 tiles tall) + cap
    for tx in range(0, 20):
        stamp("wall_cap_h", tx * 16, 0)
        stamp("wall_face_top", tx * 16, 16)
        stamp("wall_face_bottom", tx * 16, 32)
    stamp("wall_cap_corner_tl", 0, 0)
    stamp("wall_cap_corner_tr", 304, 0)
    # door in back wall
    stamp("door_auto", 128, 16)
    stamp("door_locked", 272, 16)
    # furniture
    stamp("bed", 16, 48)
    stamp("iv_stand", 34, 48)
    stamp("heart_monitor", 52, 48)
    stamp("bed", 72, 48)
    stamp("oxygen_machine", 90, 48)
    stamp("medicine_shelf", 184, 48)
    stamp("locker", 160, 48)
    stamp("cabinet", 144, 48)
    stamp("desk", 216, 96)
    stamp("microscope", 224, 84)
    stamp("chair_down", 224, 114)
    stamp("reception_desk", 112, 96)
    stamp("chair_down", 120, 132)
    stamp("chair_down", 140, 132)
    stamp("wheelchair", 168, 132)
    stamp("vending_machine", 8, 120)
    stamp("water_dispenser", 28, 120)
    stamp("plant_tall", 296, 48)
    stamp("ct_scanner", 224, 128)
    stamp("lab_machine", 280, 96)
    stamp("surgery_table", 48, 104)
    stamp("surgery_lamp", 40, 88)
    stamp("bench", 96, 152)
    stamp("table_round", 144, 156)
    stamp("plant_small", 132, 152)
    stamp("plant_wilted", 304, 152)

    room.resize((320 * 4, 176 * 4), Image.NEAREST) \
        .save(os.path.join(out_dir, "room_mockup_x4.png"))


build_mockup()
print(f"OK: {len(frames)} frames -> {png_path}")
