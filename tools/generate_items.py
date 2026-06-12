#!/usr/bin/env python3
"""
Dr. Muerte — gameplay item icon generator
16x16 inventory-ready icons, "Pastel Malpractice" palette (ART_STYLE.md).
No contact shadows (these live in UI slots, not the world).

Outputs (assets/items/):
  items.png      sheet, 16px grid (8 cols)
  items.json     Phaser 3 atlas (JSON hash)
  preview_x8.png zoomed contact sheet
"""
import json
import os
from PIL import Image, ImageDraw

OUT    = (0x4a, 0x3b, 0x5c, 255)
SHAD   = (0x7a, 0x68, 0x90, 255)
WHITE  = (0xff, 0xf6, 0xee, 255)
GRAY   = (0xcf, 0xc6, 0xd9, 255)
MINT   = (0xc9, 0xf0, 0xdd, 255)
CREAM2 = (0xf6, 0xe2, 0xc8, 255)
WOOD   = (0xe0, 0xb1, 0x84, 255)
WOOD_S = (0xb8, 0x83, 0x5c, 255)
BLUE   = (0xa8, 0xd8, 0xf5, 255)
BLUE_S = (0x7d, 0xb3, 0xdd, 255)
SKIN   = (0xff, 0xd9, 0xb8, 255)
PINK   = (0xff, 0xb3, 0xc6, 255)
RED    = (0xef, 0x5d, 0x6f, 255)
GREEN  = (0x6f, 0xd2, 0x93, 255)
YELLOW = (0xff, 0xd9, 0x70, 255)
GHOST  = (0xb9, 0xa8, 0xe8, 255)

T = 16
sheet = Image.new("RGBA", (8 * T, 2 * T), (0, 0, 0, 0))
d = ImageDraw.Draw(sheet)
frames = {}


def px(x, y, c): d.point((x, y), fill=c)
def rect(x, y, w, h, c):
    if w > 0 and h > 0:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
def hline(x, y, w, c): rect(x, y, w, 1, c)
def vline(x, y, h, c): rect(x, y, 1, h, c)
def rbox(x, y, w, h, fill, line=OUT):
    hline(x + 1, y, w - 2, line)
    hline(x + 1, y + h - 1, w - 2, line)
    vline(x, y + 1, h - 2, line)
    vline(x + w - 1, y + 1, h - 2, line)
    rect(x + 1, y + 1, w - 2, h - 2, fill)


# ---------------------------------------------------------------- icons
def syringe(x, y):
    hline(x + 1, y + 8, 4, GRAY)               # needle
    px(x + 1, y + 8, SHAD)
    rbox(x + 5, y + 6, 7, 5, WHITE)            # barrel
    rect(x + 6, y + 7, 3, 3, BLUE)             # dose
    vline(x + 12, y + 5, 7, OUT)               # plunger flange
    rect(x + 13, y + 7, 2, 3, GRAY)            # plunger
    px(x + 6, y + 5, OUT)                      # measure ticks
    px(x + 8, y + 5, OUT)


def poison_bottle(x, y):
    rect(x + 6, y + 1, 4, 2, WOOD_S)           # cork
    rect(x + 6, y + 3, 4, 2, GRAY)             # neck
    rbox(x + 3, y + 5, 10, 10, GREEN)          # bottle
    px(x + 4, y + 6, MINT)                     # glass shine
    px(x + 4, y + 7, MINT)
    rect(x + 5, y + 8, 6, 5, WHITE)            # label
    px(x + 6, y + 9, OUT)                      # skull eyes
    px(x + 9, y + 9, OUT)
    hline(x + 7, y + 11, 2, OUT)               # skull teeth


def pills_bottle(x, y):
    rect(x + 4, y + 1, 8, 3, WHITE)            # cap
    hline(x + 4, y + 1, 8, OUT)
    vline(x + 4, y + 1, 3, OUT); vline(x + 11, y + 1, 3, OUT)
    rbox(x + 4, y + 4, 8, 10, YELLOW)          # bottle
    rect(x + 5, y + 7, 6, 4, WHITE)            # label
    hline(x + 6, y + 8, 4, GRAY)
    hline(x + 6, y + 10, 3, GRAY)
    px(x + 13, y + 12, RED)                    # spilled capsule
    px(x + 14, y + 12, WHITE)
    px(x + 14, y + 14, OUT)
    px(x + 13, y + 14, BLUE)                   # second capsule
    px(x + 12, y + 14, WHITE)


def coffee_mug(x, y):
    px(x + 7, y + 1, GRAY)                     # steam
    px(x + 8, y + 2, GRAY)
    px(x + 7, y + 3, GRAY)
    rbox(x + 3, y + 5, 9, 9, WHITE)            # mug
    rect(x + 4, y + 6, 7, 2, WOOD_S)           # coffee
    vline(x + 13, y + 7, 4, OUT)               # handle
    px(x + 12, y + 6, OUT)
    px(x + 12, y + 11, OUT)
    px(x + 4, y + 9, PINK)                     # heart print
    px(x + 6, y + 9, PINK)
    px(x + 5, y + 10, PINK)


def electric_cable(x, y):
    d.ellipse([x + 2, y + 6, x + 10, y + 14], outline=OUT)     # coil
    d.ellipse([x + 4, y + 8, x + 8, y + 12], outline=SHAD)
    px(x + 10, y + 7, OUT)                     # lead to plug
    px(x + 11, y + 6, OUT)
    px(x + 12, y + 5, OUT)
    rbox(x + 11, y + 2, 4, 4, YELLOW)          # plug body
    hline(x + 15, y + 3, 1, GRAY)              # prongs
    px(x + 15, y + 5, GRAY)
    px(x + 3, y + 9, YELLOW)                   # spark
    px(x + 1, y + 13, YELLOW)


def heart_monitor_icon(x, y):
    rbox(x + 2, y + 2, 12, 10, OUT, OUT)       # screen
    for i, dy in enumerate((7, 7, 6, 4, 8, 5, 7, 7, 6, 7)):
        px(x + 3 + i, y + dy, GREEN)           # ECG
    px(x + 12, y + 3, RED)                     # rec light
    rect(x + 6, y + 12, 4, 2, GRAY)            # foot
    hline(x + 4, y + 14, 8, GRAY)


def iv_bag(x, y):
    px(x + 7, y + 1, OUT)                      # hanger hole
    px(x + 8, y + 1, OUT)
    rbox(x + 4, y + 2, 8, 11, WHITE)           # bag
    rect(x + 5, y + 7, 6, 5, BLUE)             # fluid
    hline(x + 5, y + 4, 6, RED)                # label
    px(x + 6, y + 8, WHITE)                    # bubble
    px(x + 8, y + 13, BLUE_S)                  # tube
    px(x + 9, y + 14, BLUE_S)
    px(x + 11, y + 14, BLUE_S)


def medicine_box_icon(x, y):
    hline(x + 6, y + 2, 4, GRAY)               # handle
    px(x + 5, y + 3, GRAY); px(x + 10, y + 3, GRAY)
    rbox(x + 2, y + 4, 12, 10, WHITE)          # case
    rect(x + 7, y + 6, 2, 6, RED)              # cross
    rect(x + 5, y + 8, 6, 2, RED)
    hline(x + 3, y + 5, 10, GRAY)              # lid seam


def chemical_bottle(x, y):
    rect(x + 6, y + 1, 4, 2, WOOD)             # cork
    rect(x + 6, y + 3, 4, 4, WHITE)            # neck
    vline(x + 6, y + 3, 4, GRAY)
    rect(x + 5, y + 7, 6, 2, WHITE)            # shoulder
    rbox(x + 3, y + 8, 10, 7, GHOST)           # flask body
    px(x + 5, y + 10, WHITE)                   # bubbles
    px(x + 8, y + 12, WHITE)
    px(x + 10, y + 10, WHITE)
    px(x + 4, y + 9, MINT)                     # glass shine


def patient_records(x, y):
    rect(x + 3, y + 3, 5, 2, CREAM2)           # folder tab
    hline(x + 3, y + 2, 5, OUT)
    rbox(x + 2, y + 4, 12, 10, CREAM2)         # folder
    rect(x + 4, y + 6, 8, 6, WHITE)            # paper
    hline(x + 5, y + 7, 6, GRAY)               # text
    hline(x + 5, y + 9, 6, GRAY)
    hline(x + 5, y + 11, 4, GRAY)
    px(x + 11, y + 11, RED)                    # red flag mark
    px(x + 12, y + 13, WOOD_S)                 # folder edge


def keycard(x, y):
    rbox(x + 2, y + 4, 12, 8, BLUE)
    hline(x + 3, y + 6, 10, OUT)               # magstripe
    rect(x + 4, y + 8, 3, 2, YELLOW)           # chip
    px(x + 4, y + 8, WOOD_S)
    hline(x + 8, y + 9, 4, WHITE)              # name line
    px(x + 12, y + 5, WHITE)                   # shine


def clipboard(x, y):
    rbox(x + 3, y + 2, 10, 13, WOOD)           # board
    rect(x + 6, y + 1, 4, 3, GRAY)             # clip
    hline(x + 6, y + 1, 4, OUT)
    rect(x + 4, y + 4, 8, 9, WHITE)            # paper
    px(x + 5, y + 6, OUT)                      # checkbox 1: checked
    px(x + 5, y + 6, GREEN)
    hline(x + 7, y + 6, 4, GRAY)
    px(x + 5, y + 8, GREEN)                    # checked
    hline(x + 7, y + 8, 4, GRAY)
    px(x + 5, y + 10, RED)                     # the suspicious one
    hline(x + 7, y + 10, 4, GRAY)


def hospital_badge(x, y):
    rect(x + 6, y + 1, 4, 2, GRAY)             # lanyard clip
    rbox(x + 3, y + 3, 10, 12, WHITE)          # badge
    hline(x + 4, y + 4, 8, BLUE)               # header band
    rect(x + 4, y + 6, 4, 5, GRAY)             # photo: a familiar face
    px(x + 5, y + 7, OUT)                      # ...with dark sockets
    px(x + 7, y + 7, OUT)
    hline(x + 5, y + 9, 3, OUT)                # ...and that grin
    hline(x + 9, y + 7, 3, GRAY)               # name lines
    hline(x + 9, y + 9, 3, GRAY)
    rect(x + 5, y + 12, 6, 2, RED)             # DOCTOR stripe
    px(x + 7, y + 12, WHITE)                   # cross on stripe
    px(x + 8, y + 12, WHITE)


ITEMS = [
    ("syringe", syringe),
    ("poison_bottle", poison_bottle),
    ("pills_bottle", pills_bottle),
    ("coffee_mug", coffee_mug),
    ("electric_cable", electric_cable),
    ("heart_monitor_icon", heart_monitor_icon),
    ("iv_bag", iv_bag),
    ("medicine_box_icon", medicine_box_icon),
    ("chemical_bottle", chemical_bottle),
    ("patient_records", patient_records),
    ("keycard", keycard),
    ("clipboard", clipboard),
    ("hospital_badge", hospital_badge),
]

for i, (name, fn) in enumerate(ITEMS):
    x, y = (i % 8) * T, (i // 8) * T
    fn(x, y)
    frames[name] = {"frame": {"x": x, "y": y, "w": T, "h": T},
                    "rotated": False, "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": T, "h": T},
                    "sourceSize": {"w": T, "h": T}}

out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "items")
os.makedirs(out_dir, exist_ok=True)
sheet.save(os.path.join(out_dir, "items.png"))
with open(os.path.join(out_dir, "items.json"), "w") as f:
    json.dump({"frames": frames,
               "meta": {"image": "items.png", "format": "RGBA8888",
                        "size": {"w": 8 * T, "h": 2 * T}, "scale": "1"}},
              f, indent=1)

sheet.resize((8 * T * 8, 2 * T * 8), Image.NEAREST).save(
    os.path.join(out_dir, "preview_x8.png"))
print(f"OK: {len(ITEMS)} items -> {out_dir}")
