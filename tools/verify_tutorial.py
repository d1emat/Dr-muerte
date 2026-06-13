#!/usr/bin/env python3
"""Render the tutorial map by mirroring MapBuilder.js + tutorial_blueprint.js.
Validates furniture placement and the scripted nurse route."""
import json
import os
import re
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..")
T = 16
src = open(os.path.join(ROOT, "js", "world", "tutorial_blueprint.js")).read()

def parse_objs(name):
    block = re.search(rf"{name}\s*[:=]\s*\[(.*?)\n\s*\]", src, re.S).group(1)
    out = []
    for m in re.finditer(r"\{(.*?)\}", block, re.S):
        o = {}
        for kv in re.finditer(
                r"(\w+):\s*(\"[^\"]*\"|\[(?:[^\[\]]|\[[^\]]*\])*\]|true|false|[-\d.]+)",
                m.group(1)):
            k, v = kv.group(1), kv.group(2)
            o[k] = json.loads(v)
        out.append(o)
    return out

ROOMS = parse_objs("rooms")
BANDS = parse_objs("bands")
VWALLS = parse_objs("vwalls")
DOORS = parse_objs("doors")
FURNITURE = parse_objs("furniture")
DECOR = parse_objs("decor")
COLS = int(re.search(r"cols:\s*(\d+)", src).group(1))
ROWS = int(re.search(r"rows:\s*(\d+)", src).group(1))

def parse_route(name):
    raw = re.search(rf"{name} = (\[.*?\n\]);", src, re.S).group(1)
    return json.loads(re.sub(r",\s*\]", "]", raw))

WATCH = parse_route("TUT_NURSE_WATCH_ROUTE")
HOME = json.loads(re.search(r"TUT_NURSE_HOME = (\[\[.*?\]\]);", src).group(1))
PATIENT_ROUTE = json.loads(
    re.search(r"route:\s*(\[\[.*?\]\])", src).group(1))
SPAWN = [int(x) for x in re.search(
    r"TUT_SPAWN = \{ x: (\d+), y: (\d+) \}", src).groups()]
MARKER = [int(x) for x in re.search(
    r"TUT_MARKER = \{ x: (\d+), y: (\d+) \}", src).groups()]

floor = [[None] * COLS for _ in range(ROWS)]
walls = [[None] * COLS for _ in range(ROWS)]
for room in ROOMS:
    for r in range(room["y"], room["y"] + room["h"]):
        for c in range(room["x"], room["x"] + room["w"]):
            floor[r][c] = room["floor"][(r + c) % 2]
for band in BANDS:
    for c in range(1, COLS - 1):
        walls[band["row"]][c] = "wall_cap_h"
        if not band.get("capOnly"):
            walls[band["row"] + 1][c] = "wall_face_top"
            walls[band["row"] + 2][c] = "wall_face_bottom"
for vw in VWALLS:
    for r in range(vw["from"], vw["to"] + 1):
        walls[r][vw["col"]] = "wall_cap_v"
walls[0][0] = "wall_cap_corner_tl"; walls[0][COLS - 1] = "wall_cap_corner_tr"
walls[ROWS - 1][0] = "wall_cap_corner_bl"
walls[ROWS - 1][COLS - 1] = "wall_cap_corner_br"
for door in DOORS:
    for c in door["cols"]:
        for r in range(door["band"], door["band"] + 3):
            walls[r][c] = None
            floor[r][c] = ["floor_white_a", "floor_white_b"][(r + c) % 2]
    lo, hi = min(door["cols"]) - 1, max(door["cols"]) + 1
    if walls[door["band"]][lo]: walls[door["band"]][lo] = "wall_cap_end_r"
    if walls[door["band"]][hi]: walls[door["band"]][hi] = "wall_cap_end_l"

sheet = Image.open(os.path.join(ROOT, "assets", "tileset",
                                "hospital_tileset.png")).convert("RGBA")
FR = json.load(open(os.path.join(ROOT, "assets", "tileset",
                                 "hospital_tileset.json")))["frames"]
def crop(n):
    f = FR[n]["frame"]
    return sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))

img = Image.new("RGBA", (COLS * T, ROWS * T), (0x2e, 0x24, 0x38, 255))
for r in range(ROWS):
    for c in range(COLS):
        if floor[r][c]: img.alpha_composite(crop(floor[r][c]), (c * T, r * T))
        if walls[r][c]: img.alpha_composite(crop(walls[r][c]), (c * T, r * T))
for dd in DECOR:
    img.alpha_composite(crop(dd["frame"]), (dd["x"], dd["y"]))

problems = []
for f in sorted(FURNITURE, key=lambda o: o["y"] + FR[o["frame"]]["frame"]["h"]):
    fr = FR[f["frame"]]["frame"]
    img.alpha_composite(crop(f["frame"]), (f["x"], f["y"]))
    if not f.get("decor"):
        for (px, py) in ((f["x"], f["y"] + fr["h"] - 1),
                         (f["x"] + fr["w"] - 1, f["y"] + fr["h"] - 1)):
            if walls[py // T][px // T]:
                problems.append(f"{f['frame']} at {f['x']},{f['y']} overlaps wall")

dr = ImageDraw.Draw(img)
def check_route(name, route, color):
    dr.line([tuple(p) for p in route], fill=color, width=1)
    for i in range(len(route) - 1):
        (x0, y0), (x1, y1) = route[i], route[i + 1]
        steps = max(abs(x1 - x0), abs(y1 - y0)) // 3 + 1
        for s in range(steps + 1):
            x = x0 + (x1 - x0) * s / steps
            y = y0 + (y1 - y0) * s / steps
            if walls[int(y) // T][int(x) // T]:
                problems.append(f"route '{name}' crosses wall near {int(x)},{int(y)}")
                return

check_route("nurse-watch", WATCH, (239, 93, 111, 255))
check_route("nurse-home", HOME, (255, 179, 198, 255))
check_route("patient", PATIENT_ROUTE, (111, 210, 147, 255))
dr.ellipse([SPAWN[0]-2, SPAWN[1]-2, SPAWN[0]+2, SPAWN[1]+2], fill=(255, 217, 112))
dr.ellipse([MARKER[0]-3, MARKER[1]-3, MARKER[0]+3, MARKER[1]+3],
           outline=(255, 217, 112))
for pt in (SPAWN, MARKER):
    if walls[pt[1] // T][pt[0] // T]:
        problems.append(f"point {pt} is inside a wall")

img.resize((COLS * T * 3, ROWS * T * 3), Image.NEAREST).save(
    os.path.join(ROOT, "assets", "tutorial_check_x3.png"))
print("PROBLEMS:" if problems else "TUTORIAL MAP OK")
for p in problems: print(" -", p)
