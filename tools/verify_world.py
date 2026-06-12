#!/usr/bin/env python3
"""Render the Phaser world map by mirroring MapBuilder.js + blueprint.js.
Verifies layout, door carving, furniture placement and patrol lanes."""
import json
import os
import re
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..")
COLS, ROWS, T = 60, 30, 16

src = open(os.path.join(ROOT, "js", "world", "blueprint.js")).read()

def parse_objs(name):
    block = re.search(rf"export const {name} = \[(.*?)\n\];", src, re.S).group(1)
    out = []
    for m in re.finditer(r"\{(.*?)\}", block, re.S):
        body = m.group(1)
        o = {}
        for kv in re.finditer(r"(\w+):\s*(\"[^\"]*\"|\[(?:[^\[\]]|\[[^\]]*\])*\]|true|false|[-\d.]+)", body):
            k, v = kv.group(1), kv.group(2)
            o[k] = json.loads(v.replace("'", '"')) if v[0] in '"[-0123456789tf' else v
        out.append(o)
    return out

ROOMS = parse_objs("ROOMS")
FURNITURE = parse_objs("FURNITURE")
DECOR = parse_objs("DECOR")
DOORS = parse_objs("DOORS")
OVERRIDES = parse_objs("FLOOR_OVERRIDES")
PATIENTS = parse_objs("PATIENTS")
NURSE_ROUTE = json.loads(re.search(r"NURSE_ROUTE = (\[.*?\]);", src, re.S).group(1))
_insp = re.search(r"INSPECTOR_ROUTE = (\[.*?\n\]);", src, re.S).group(1)
INSPECTOR_ROUTE = json.loads(re.sub(r",\s*\]", "]", _insp))

floor = [[None] * COLS for _ in range(ROWS)]
walls = [[None] * COLS for _ in range(ROWS)]
for room in ROOMS:
    for r in range(room["y"], room["y"] + room["h"]):
        for c in range(room["x"], room["x"] + room["w"]):
            floor[r][c] = room["floor"][(r + c) % 2]
for o in OVERRIDES:
    floor[o["r"]][o["c"]] = o["t"]
for band in (0, 11, 18):
    for c in range(1, COLS - 1):
        walls[band][c] = "wall_cap_h"
        walls[band + 1][c] = "wall_face_top"
        walls[band + 2][c] = "wall_face_bottom"
for c in range(1, COLS - 1):
    walls[29][c] = "wall_cap_h"
for r in range(1, ROWS - 1):
    walls[r][0] = walls[r][COLS - 1] = "wall_cap_v"
walls[0][0] = "wall_cap_corner_tl"; walls[0][COLS - 1] = "wall_cap_corner_tr"
walls[29][0] = "wall_cap_corner_bl"; walls[29][COLS - 1] = "wall_cap_corner_br"
for c in (19, 39):
    for r in list(range(3, 11)) + list(range(21, 29)):
        walls[r][c] = "wall_cap_v"
corridor = next(r for r in ROOMS if r["name"] == "corridor")
for door in DOORS:
    for c in door["cols"]:
        for r in range(door["band"], door["band"] + 3):
            walls[r][c] = None
            floor[r][c] = corridor["floor"][(r + c) % 2]
    lo, hi = min(door["cols"]) - 1, max(door["cols"]) + 1
    if walls[door["band"]][lo]: walls[door["band"]][lo] = "wall_cap_end_r"
    if walls[door["band"]][hi]: walls[door["band"]][hi] = "wall_cap_end_l"

sheet = Image.open(os.path.join(ROOT, "assets", "tileset", "hospital_tileset.png")).convert("RGBA")
FR = json.load(open(os.path.join(ROOT, "assets", "tileset", "hospital_tileset.json")))["frames"]
def crop(n):
    f = FR[n]["frame"]
    return sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))

img = Image.new("RGBA", (COLS * T, ROWS * T), (0x2e, 0x24, 0x38, 255))
for r in range(ROWS):
    for c in range(COLS):
        if floor[r][c]: img.alpha_composite(crop(floor[r][c]), (c * T, r * T))
        if walls[r][c]: img.alpha_composite(crop(walls[r][c]), (c * T, r * T))
for dlist in (DECOR,):
    for dd in dlist:
        img.alpha_composite(crop(dd["frame"]), (dd["x"], dd["y"]))
problems = []
for f in sorted(FURNITURE, key=lambda o: o["y"] + FR[o["frame"]]["frame"]["h"]):
    fr = FR[f["frame"]]["frame"]
    img.alpha_composite(crop(f["frame"]), (f["x"], f["y"]))
    # furniture must sit fully on floor (not overlap walls)
    if not f.get("decor"):
        for (px, py) in ((f["x"], f["y"] + fr["h"] - 1), (f["x"] + fr["w"] - 1, f["y"] + fr["h"] - 1)):
            if walls[py // T][px // T]:
                problems.append(f"{f['frame']} at {f['x']},{f['y']} overlaps wall")

dr = ImageDraw.Draw(img)
def draw_route(route, color):
    pts = [(x, y) for x, y in route]
    dr.line(pts, fill=color, width=1)
    for p in pts: dr.ellipse([p[0]-1, p[1]-1, p[0]+1, p[1]+1], fill=color)
draw_route(NURSE_ROUTE, (255, 179, 198, 255))
draw_route(INSPECTOR_ROUTE, (239, 93, 111, 255))
for p in PATIENTS:
    draw_route(p["route"], (111, 210, 147, 255))

# routes must not cross wall cells
for name, route in [("nurse", NURSE_ROUTE), ("inspector", INSPECTOR_ROUTE)] + \
                   [(p["name"], p["route"]) for p in PATIENTS]:
    for i in range(len(route) - 1):
        (x0, y0), (x1, y1) = route[i], route[i + 1]
        steps = max(abs(x1 - x0), abs(y1 - y0)) // 4 + 1
        for s in range(steps + 1):
            x = x0 + (x1 - x0) * s / steps
            y = y0 + (y1 - y0) * s / steps
            if walls[int(y) // T][int(x) // T]:
                problems.append(f"route '{name}' crosses wall near {int(x)},{int(y)}")
                break

img.resize((COLS * T * 2, ROWS * T * 2), Image.NEAREST).save(
    os.path.join(ROOT, "assets", "world_check_x2.png"))
print("PROBLEMS:" if problems else "LAYOUT OK")
for p in problems: print(" -", p)
