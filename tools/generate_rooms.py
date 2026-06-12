#!/usr/bin/env python3
"""
Dr. Muerte — hospital room layout generator
Builds 6 rooms from assets/tileset/hospital_tileset.png following ART_STYLE.md.

Each room is one fixed-camera screen: 20x11 tiles of 16px = 320x176
(leaves 4px for HUD inside the 320x180 logical resolution).

Outputs (assets/rooms/):
  <room>.json        tilemap data: floor + wall layers (frame names) + objects
  <room>_x4.png      rendered preview
  all_rooms_x2.png   contact sheet of all six rooms
"""
import json
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
TILESET_DIR = os.path.join(ROOT, "assets", "tileset")
OUT_DIR = os.path.join(ROOT, "assets", "rooms")
os.makedirs(OUT_DIR, exist_ok=True)

sheet = Image.open(os.path.join(TILESET_DIR, "hospital_tileset.png")).convert("RGBA")
with open(os.path.join(TILESET_DIR, "hospital_tileset.json")) as f:
    FRAMES = json.load(f)["frames"]

COLS, ROWS, T = 20, 11, 16
W, H = COLS * T, ROWS * T


def crop(name):
    f = FRAMES[name]["frame"]
    return sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))


def base_layers(floor_a, floor_b, overrides=()):
    """Perimeter walls + checkered floor. South wall has a 2-tile door gap."""
    floor = [[None] * COLS for _ in range(ROWS)]
    walls = [[None] * COLS for _ in range(ROWS)]

    for r in range(3, 10):
        for c in range(1, COLS - 1):
            floor[r][c] = floor_a if (r + c) % 2 == 0 else floor_b
    # floor showing through the south door gap
    floor[10][9] = floor_a if (10 + 9) % 2 == 0 else floor_b
    floor[10][10] = floor_a if (10 + 10) % 2 == 0 else floor_b

    for c, r, name in overrides:
        floor[r][c] = name

    # north wall: cap + 2-tile face
    for c in range(1, COLS - 1):
        walls[0][c] = "wall_cap_h"
        walls[1][c] = "wall_face_top"
        walls[2][c] = "wall_face_bottom"
    # side caps
    for r in range(1, 10):
        walls[r][0] = "wall_cap_v"
        walls[r][COLS - 1] = "wall_cap_v"
    # south wall with door gap (cols 9-10)
    for c in range(1, COLS - 1):
        walls[10][c] = "wall_cap_h"
    walls[10][8] = "wall_cap_end_r"
    walls[10][9] = None
    walls[10][10] = None
    walls[10][11] = "wall_cap_end_l"
    # corners
    walls[0][0] = "wall_cap_corner_tl"
    walls[0][COLS - 1] = "wall_cap_corner_tr"
    walls[10][0] = "wall_cap_corner_bl"
    walls[10][COLS - 1] = "wall_cap_corner_br"
    return floor, walls


# ---------------------------------------------------------------- rooms
# objects: (frame_name, x_px, y_px) — drawn sorted by bottom edge
ROOMS = {
    "room1_reception": {
        "floor": ("floor_white_a", "floor_white_b"),
        "objects": [
            ("door_auto", 144, 16),            # main entrance, north
            ("plant_tall", 16, 48),
            ("vending_machine", 240, 48),
            ("water_dispenser", 256, 48),
            ("plant_tall", 288, 48),
            ("reception_desk", 96, 72),
            ("computer", 102, 66),             # on the counter
            ("chair_down", 208, 112),          # waiting area
            ("chair_down", 232, 112),
            ("chair_down", 256, 112),
            ("bench", 216, 144),
            ("table_round", 176, 140),
            ("plant_small", 152, 144),
            ("chair_right", 32, 120),
            ("plant_wilted", 288, 148),        # easter egg
        ],
    },
    "room2_icu": {
        "floor": ("floor_blue_a", "floor_blue_b"),
        "objects": [
            ("door_locked", 272, 16),
            ("bed", 32, 48), ("heart_monitor", 48, 48),
            ("bed", 96, 48), ("iv_stand", 112, 48),
            ("bed", 160, 48), ("oxygen_machine", 176, 48),
            ("bed", 224, 48), ("heart_monitor", 240, 48),
            ("desk", 32, 128),                 # nurse station
            ("computer", 38, 118),
            ("chair_down", 64, 130),
            ("iv_stand", 288, 96),
            ("bench", 240, 144),
            ("plant_small", 288, 148),
        ],
    },
    "room3_pharmacy": {
        "floor": ("floor_white_a", "floor_white_b"),
        "objects": [
            ("door_locked", 256, 16),
            ("medicine_shelf", 32, 48),
            ("medicine_shelf", 80, 48),
            ("medicine_shelf", 128, 48),
            ("refrigerator", 176, 48),
            ("cabinet", 200, 48),
            ("cabinet", 216, 48),
            ("medicine_box", 40, 96),
            ("medicine_box", 96, 100),
            ("medicine_box", 240, 96),
            ("desk", 128, 120),                # dispensing counter
            ("computer", 134, 110),
            ("medicine_box", 150, 112),
            ("chair_down", 88, 132),
            ("plant_small", 288, 148),
        ],
    },
    "room4_laboratory": {
        "floor": ("floor_lab_a", "floor_lab_b"),
        "objects": [
            ("door_auto", 144, 16),
            ("lab_machine", 24, 48),
            ("lab_machine", 56, 48),
            ("medicine_shelf", 104, 48),       # chemical shelf
            ("cabinet", 200, 48),
            ("medicine_shelf", 224, 48),
            ("table_rect", 88, 104),
            ("microscope", 92, 94),
            ("test_tubes", 110, 94),
            ("table_rect", 184, 104),
            ("flask_set", 188, 94),
            ("test_tubes", 206, 94),
            ("table_rect", 136, 144),
            ("microscope", 140, 134),
            ("flask_set", 158, 134),
            ("chair_left", 70, 100),
            ("chair_right", 218, 100),
            ("plant_wilted", 288, 148),        # even the plants die here
        ],
    },
    "room5_operating": {
        "floor": ("floor_white_a", "floor_white_b"),
        "floor_overrides": [
            (7, 4, "floor_er_b"), (12, 4, "floor_er_b"),
            (7, 8, "floor_er_b"), (12, 8, "floor_er_b"),
            (8, 4, "floor_er_a"), (11, 4, "floor_er_a"),
        ],
        "objects": [
            ("door_locked", 48, 16),
            ("cabinet", 208, 48),
            ("medicine_shelf", 224, 48),
            ("locker", 16, 48),
            ("oxygen_machine", 32, 48),
            ("surgery_lamp", 128, 56),
            ("surgery_table", 152, 80),
            ("iv_stand", 132, 84),
            ("heart_monitor", 172, 80),
            ("table_round", 196, 116),
            ("surgery_tools", 196, 108),       # instrument tray on table
            ("table_rect", 80, 128),
            ("surgery_tools", 84, 118),
            ("flask_set", 100, 118),
            ("oxygen_machine", 252, 112),
        ],
    },
    "room6_staff": {
        "floor": ("floor_white_b", "floor_white_a"),
        "objects": [
            ("door_normal", 256, 16),
            ("locker", 24, 48), ("locker", 40, 48),
            ("locker", 56, 48), ("locker", 72, 48),
            ("refrigerator", 112, 48),
            ("desk", 168, 56),                 # kitchen counter
            ("coffee_machine", 170, 47),
            ("microwave", 186, 47),
            ("vending_machine", 288, 48),
            ("water_dispenser", 288, 88),
            ("table_rect", 120, 112),
            ("chair_down", 124, 96),
            ("chair_down", 140, 96),
            ("chair_right", 102, 110),
            ("chair_left", 154, 110),
            ("table_round", 224, 128),
            ("chair_left", 244, 124),
            ("chair_right", 204, 124),
            ("bench", 40, 144),
            ("plant_small", 88, 144),
            ("plant_tall", 288, 120),
            ("plant_wilted", 16, 148),
        ],
    },
}


def render(name, spec):
    floor, walls = base_layers(*spec["floor"],
                               overrides=spec.get("floor_overrides", ()))
    img = Image.new("RGBA", (W, H), (0x4a, 0x3b, 0x5c, 255))  # void = outline purple

    for layer in (floor, walls):
        for r in range(ROWS):
            for c in range(COLS):
                if layer[r][c]:
                    img.alpha_composite(crop(layer[r][c]), (c * T, r * T))

    # painter's order: lower bottom edge drawn last
    objs = sorted(spec["objects"],
                  key=lambda o: o[2] + FRAMES[o[0]]["frame"]["h"])
    for frame, x, y in objs:
        img.alpha_composite(crop(frame), (x, y))

    img.resize((W * 4, H * 4), Image.NEAREST).save(
        os.path.join(OUT_DIR, f"{name}_x4.png"))

    data = {
        "name": name,
        "grid": {"cols": COLS, "rows": ROWS, "tileSize": T},
        "pixelSize": {"w": W, "h": H},
        "doors": {"north": True, "southGap": [9, 10]},
        "tiles": {"floor": floor, "walls": walls},
        "objects": [{"frame": f, "x": x, "y": y} for f, x, y in spec["objects"]],
        "meta": {"tileset": "../tileset/hospital_tileset.png",
                 "atlas": "../tileset/hospital_tileset.json",
                 "note": "tile layers reference atlas frame names; "
                         "null = empty. objects are pixel-positioned sprites."},
    }
    with open(os.path.join(OUT_DIR, f"{name}.json"), "w") as f:
        json.dump(data, f, indent=1)
    return img


images = {name: render(name, spec) for name, spec in ROOMS.items()}

# contact sheet 2 cols x 3 rows at x2
contact = Image.new("RGBA", (W * 2 * 2 + 24, H * 3 * 2 + 32), (0x4a, 0x3b, 0x5c, 255))
for i, (name, img) in enumerate(images.items()):
    cx = (i % 2) * (W * 2 + 8) + 8
    cy = (i // 2) * (H * 2 + 8) + 8
    contact.alpha_composite(img.resize((W * 2, H * 2), Image.NEAREST), (cx, cy))
contact.save(os.path.join(OUT_DIR, "all_rooms_x2.png"))

print(f"OK: {len(images)} rooms -> {OUT_DIR}")
