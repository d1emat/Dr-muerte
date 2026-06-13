#!/usr/bin/env python3
"""
Hospital level generator for FATAL TREATMENT.

Builds 5 levels of increasing size using a single-corridor-per-floor model
(rooms above and below each corridor, every room doored into it, so the floor
is always fully connected). The final level stacks two floors linked by an
elevator. Geometry is validated (no furniture on walls, doors clear, NPC
routes never cross walls) and rendered to assets/levels/ for visual review.

Output: js/data/levels.js  (static `export const LEVELS = [...]`)

Run:  python3 tools/gen_levels.py
"""
import json
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
T = 16

ATLAS = json.load(open(os.path.join(ROOT, "assets", "tileset",
                                    "hospital_tileset.json")))["frames"]


def fsize(frame):
    f = ATLAS[frame]["frame"]
    return f["w"], f["h"]


# ---------------------------------------------------------------- floors
FLOORS = {
    "white": ["floor_white_a", "floor_white_b"],
    "blue":  ["floor_blue_a", "floor_blue_b"],
    "lab":   ["floor_lab_a", "floor_lab_b"],
    "er":    ["floor_er_a", "floor_er_b"],
}

ROOM_FLOOR = {
    "reception": "white", "waiting": "white", "emergency": "white",
    "icu": "blue", "pharmacy": "white", "laboratory": "lab",
    "operating": "white", "wardA": "blue", "wardB": "blue", "staff": "white",
    "cafeteria": "white", "radiology": "lab", "mri": "lab",
    "administration": "white", "psychiatric": "blue", "maintenance": "white",
    "storage": "white", "security": "white", "ward": "blue",
}

# rooms that get a red-cross floor emblem (clean base + a single decal)
EMBLEM_ROOMS = {"emergency", "operating"}

# room display names (for signage / readability)
ROOM_LABEL = {
    "reception": "Recepción", "waiting": "Sala de espera", "emergency": "Urgencias",
    "icu": "UCI", "pharmacy": "Farmacia", "laboratory": "Laboratorio",
    "operating": "Quirófano", "wardA": "Planta A", "wardB": "Planta B",
    "staff": "Personal", "cafeteria": "Cafetería", "radiology": "Radiología",
    "mri": "Resonancia", "administration": "Administración",
    "psychiatric": "Psiquiatría", "maintenance": "Mantenimiento",
    "storage": "Almacén", "security": "Seguridad", "ward": "Planta",
}

# furniture kits: list of (frame, interact_type|None). decor=cosmetic only.
KITS = {
    "reception": [("reception_desk", "files"), ("plant_tall", None), ("bench", None)],
    "waiting":   [("bench", None), ("chair_down", None), ("vending_machine", None),
                  ("plant_small", None)],
    "emergency": [("bed", None), ("heart_monitor", "monitor"), ("oxygen_machine", None),
                  ("iv_stand", None)],
    "icu":       [("bed", None), ("heart_monitor", "monitor"), ("oxygen_machine", None),
                  ("bed", None)],
    "pharmacy":  [("medicine_shelf", None), ("cabinet", None), ("refrigerator", None),
                  ("medicine_box", None)],
    "laboratory": [("lab_machine", None), ("microscope", None), ("test_tubes", None),
                   ("flask_set", None)],
    "operating": [("surgery_table", None), ("surgery_lamp", None),
                  ("heart_monitor", "monitor"), ("iv_stand", None)],
    "wardA":     [("bed", None), ("iv_stand", None), ("bed", None), ("plant_small", None)],
    "wardB":     [("bed", None), ("heart_monitor", "monitor"), ("bed", None)],
    "staff":     [("locker", None), ("coffee_machine", None), ("microwave", None),
                  ("vending_machine", None)],
    "cafeteria": [("table_rect", None), ("vending_machine", None),
                  ("water_dispenser", None), ("table_round", None)],
    "radiology": [("ct_scanner", None), ("desk", None), ("computer", None)],
    "mri":       [("ct_scanner", None), ("lab_machine", None), ("heart_monitor", "monitor")],
    "administration": [("desk", None), ("computer", None), ("cabinet", None),
                       ("plant_tall", None)],
    "psychiatric": [("bed", None), ("bed", None), ("plant_small", None)],
    "maintenance": [("lab_machine", None), ("cleaning_cart", None), ("cabinet", None)],
    "storage":   [("cabinet", None), ("medicine_box", None), ("medicine_shelf", None)],
    "security":  [("desk", None), ("computer", None), ("locker", None),
                  ("heart_monitor", "monitor")],
    "ward":      [("bed", None), ("iv_stand", None), ("bed", None)],
}

PATIENT_ROOMS = {"emergency", "icu", "operating", "wardA", "wardB",
                 "psychiatric", "ward"}

ROOM_OBJECT_TYPES = ["coffee", "cable", "thermostat", "window", "pills", "syringe"]

COMBO_HINT_TEXTS = [
    ("morphine_sedative", "Nota: nunca mezclar sedantes con opiáceos…"),
    ("potassium_weak_heart", "Potasio IV + cardiopatía = paro. Lo vimos el mes pasado."),
    ("insulin_healthy", "Insulina sin diabetes confirmada es negligencia grave."),
    ("adrenaline_weak_heart", "Adrenalina en cardiópatas débiles: receta para desastre."),
    ("anticoagulant_aspirin", "Doble anticoagulación: la sangre no perdona."),
    ("anesthetic_sedative", "Anestesia + sedante = coma profundo. Ojalá temporal."),
    ("glucose_diabetes", "Glucosa a diabéticos descontrolados: cuidado con la dosis."),
    ("potassium_insulin", "Potasio e insulina juntos alteran electrolitos peligrosamente."),
]
SIGNS = ["sign_cross", "sign_arrow_right", "sign_exit", "sign_arrow_left"]


def make_hospital(spec):
    cols = spec["cols"]
    bands = spec["bands"]

    # assign row ranges; wall band (3 rows) precedes each content band
    wall_rows = []
    r = 0
    for b in bands:
        wall_rows.append(r)
        b["_top"] = r + 3
        b["_bot"] = r + 3 + b["h"] - 1
        r = r + 3 + b["h"]
    cap_row = r
    rows = cap_row + 1

    out_bands = [{"row": wr} for wr in wall_rows] + [{"row": cap_row, "capOnly": True}]
    vwalls = [{"col": 0, "from": 1, "to": cap_row - 1},
              {"col": cols - 1, "from": 1, "to": cap_row - 1}]
    rooms, doors, furniture, decor = [], [], [], []
    floor_overrides = []
    corridors, patient_slots, elevator_pads = [], [], []
    ids = {"monitor": 0, "files": 0}

    # split a rooms band into rooms across interior cols 1..cols-2
    def split_rooms(band):
        n = len(band["rooms"])
        interior = cols - 2
        total = interior - (n - 1)            # tiles for rooms (minus dividers)
        base, rem = divmod(total, n)
        result, x = [], 1
        for i, room in enumerate(band["rooms"]):
            w = base + (1 if i < rem else 0)
            result.append((room, x, w))
            x += w
            if i < n - 1:
                vwalls.append({"col": x, "from": band["_top"], "to": band["_bot"]})
                x += 1
        return result

    # record corridor centerlines
    for bi, b in enumerate(bands):
        if b["kind"] == "corridor":
            cy = (b["_top"] + b["_bot"]) // 2
            corridors.append({"band": bi, "cy": cy,
                              "y": cy * T + T,
                              "x0": 3 * T, "x1": (cols - 4) * T})

    def adjacent_corridor_wall(bi):
        # door target: wall band toward an adjacent corridor (below preferred)
        if bi + 1 < len(bands) and bands[bi + 1]["kind"] == "corridor":
            return wall_rows[bi + 1]      # door on the room's bottom side
        if bi - 1 >= 0 and bands[bi - 1]["kind"] == "corridor":
            return wall_rows[bi]          # door on the room's top side
        return None

    def place_kit(room_type, rx, ry, rw, rh, door_top_cols):
        kit = KITS.get(room_type, KITS["ward"])
        placed = []
        tx = rx
        ki = 0
        guard = 0
        while tx < rx + rw and guard < 40:
            guard += 1
            frame, itype = kit[ki % len(kit)]
            ki += 1
            fw, fh = fsize(frame)
            tw = fw // T
            if tx + tw > rx + rw:
                break
            # skip if this span hits a top-side door column
            span = set(range(tx, tx + tw))
            if span & door_top_cols:
                tx += 1
                continue
            item = {"frame": frame, "x": tx * T, "y": ry * T}
            if itype == "monitor":
                ids["monitor"] += 1
                item["id"] = f"monitor_{ids['monitor']}"
                item["type"] = "monitor"
            elif itype == "files":
                ids["files"] += 1
                item["id"] = "reception_files" if ids["files"] == 1 else f"files_{ids['files']}"
                item["type"] = "files"
            placed.append(item)
            tx += tw + 1
        return placed

    # build rooms + furniture + doors
    for bi, b in enumerate(bands):
        if b["kind"] == "corridor":
            # a couple of wall signs on the corridor's top wall face
            wr = wall_rows[bi] + 1
            for k, sx in enumerate(range(4, cols - 4, max(6, (cols - 8) // 3 or 6))):
                decor.append({"frame": SIGNS[k % len(SIGNS)], "x": sx * T,
                              "y": wr * T})
            continue

        door_wall = adjacent_corridor_wall(bi)
        door_on_top = (door_wall == wall_rows[bi])
        for room, rx, rw in split_rooms(b):
            rtype = room["type"]
            floor = FLOORS[ROOM_FLOOR.get(rtype, "white")]
            rooms.append({"x": rx, "y": b["_top"], "w": rw, "h": b["h"],
                          "floor": floor})
            # red-cross floor emblem for trauma/surgery bays (clean decal)
            if rtype in EMBLEM_ROOMS:
                ex = rx + rw // 2
                ey = b["_top"] + b["h"] // 2
                for dx, dy in ((-1, 0), (0, 0), (-1, 1), (0, 1)):
                    floor_overrides.append({"c": ex + dx, "r": ey + dy,
                                            "t": "floor_er_b"})
            # door at room centre (2 tiles)
            dc = rx + rw // 2 - 1
            top_door_cols = set()
            if door_wall is not None:
                doors.append({"cols": [dc, dc + 1], "band": door_wall})
                if door_on_top:
                    top_door_cols = {dc, dc + 1}
            furniture.extend(place_kit(rtype, rx, b["_top"], rw, b["h"], top_door_cols))
            # patient slot(s) at room bottom (two for wide multi-bed rooms)
            if rtype in PATIENT_ROOMS:
                py = (b["_bot"]) * T + 14
                centres = ([rx + rw // 3, rx + 2 * rw // 3] if rw >= 11
                           else [rx + rw // 2])
                for cx in centres:
                    px = cx * T
                    patient_slots.append({"x": px, "y": py,
                                          "route": [[px - 14, py], [px + 14, py]]})

    # elevators: connect two corridor bands at a column
    for ev in spec.get("elevators", []):
        ca = next(c for c in corridors if c["band"] == ev["a"])
        cb = next(c for c in corridors if c["band"] == ev["b"])
        col = ev["col"]
        ax, ay = col * T, ca["y"]
        bx, by = col * T, cb["y"]
        # elevator doors as decor on each corridor (no collider)
        decor.append({"frame": "door_auto", "x": (col - 1) * T,
                      "y": (ca["cy"] - 1) * T})
        decor.append({"frame": "door_auto", "x": (col - 1) * T,
                      "y": (cb["cy"] - 1) * T})
        elevator_pads.append({"x": ax, "y": ay, "toX": bx, "toY": by})
        elevator_pads.append({"x": bx, "y": by, "toX": ax, "toY": ay})

    mapdef = {
        "cols": cols, "rows": rows, "rooms": rooms, "bands": out_bands,
        "vwalls": vwalls, "doors": doors, "floorOverrides": floor_overrides,
        "furniture": furniture, "decor": decor,
    }
    # player spawn: centre of first corridor
    c0 = corridors[0]
    spawn = {"x": (cols // 2) * T, "y": c0["y"]}
    meta = {"corridors": corridors, "patient_slots": patient_slots,
            "elevators": elevator_pads, "spawn": spawn,
            "wall_rows": wall_rows, "cap_row": cap_row}
    return mapdef, meta


# ---------------------------------------------------------------- validate
def build_grids(m):
    cols, rows = m["cols"], m["rows"]
    floor = [[None] * cols for _ in range(rows)]
    walls = [[None] * cols for _ in range(rows)]
    for room in m["rooms"]:
        for r in range(room["y"], room["y"] + room["h"]):
            for c in range(room["x"], room["x"] + room["w"]):
                floor[r][c] = room["floor"][(r + c) % 2]
    for o in m.get("floorOverrides", []):
        floor[o["r"]][o["c"]] = o["t"]
    for b in m["bands"]:
        for c in range(1, cols - 1):
            walls[b["row"]][c] = "wall_cap_h"
            if not b.get("capOnly"):
                walls[b["row"] + 1][c] = "wall_face_top"
                walls[b["row"] + 2][c] = "wall_face_bottom"
    for vw in m["vwalls"]:
        for r in range(vw["from"], vw["to"] + 1):
            walls[r][vw["col"]] = "wall_cap_v"
    walls[0][0] = "wall_cap_corner_tl"
    walls[0][cols - 1] = "wall_cap_corner_tr"
    walls[rows - 1][0] = "wall_cap_corner_bl"
    walls[rows - 1][cols - 1] = "wall_cap_corner_br"
    for door in m["doors"]:
        for c in door["cols"]:
            for r in range(door["band"], door["band"] + 3):
                walls[r][c] = None
                floor[r][c] = ["floor_white_a", "floor_white_b"][(r + c) % 2]
    return floor, walls


def validate(level, m, meta):
    floor, walls = build_grids(m)
    problems = []

    for f in m["furniture"]:
        fw, fh = fsize(f["frame"])
        for (px, py) in ((f["x"], f["y"] + fh - 1), (f["x"] + fw - 1, f["y"] + fh - 1)):
            r, c = py // T, px // T
            if r < len(walls) and c < len(walls[0]) and walls[r][c]:
                problems.append(f"{level}: {f['frame']} @ {f['x']},{f['y']} overlaps wall")
                break

    def route_ok(name, route):
        for i in range(len(route) - 1):
            (x0, y0), (x1, y1) = route[i], route[i + 1]
            steps = max(abs(x1 - x0), abs(y1 - y0)) // 4 + 1
            for s in range(steps + 1):
                x = x0 + (x1 - x0) * s / steps
                y = y0 + (y1 - y0) * s / steps
                if walls[int(y) // T][int(x) // T]:
                    problems.append(f"{level}: route {name} crosses wall @ {int(x)},{int(y)}")
                    return

    for slot in meta["patient_slots"]:
        r, c = slot["y"] // T, slot["x"] // T
        if walls[r][c]:
            problems.append(f"{level}: patient slot @ {slot['x']},{slot['y']} in wall")
        route_ok("patient", slot["route"])
    sp = meta["spawn"]
    if walls[sp["y"] // T][sp["x"] // T]:
        problems.append(f"{level}: spawn in wall")
    return problems, floor, walls


def render(level, m, meta, floor, walls):
    from PIL import Image, ImageDraw
    sheet = Image.open(os.path.join(ROOT, "assets", "tileset",
                                    "hospital_tileset.png")).convert("RGBA")

    def crop(n):
        f = ATLAS[n]["frame"]
        return sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))

    W, H = m["cols"] * T, m["rows"] * T
    img = Image.new("RGBA", (W, H), (0x2e, 0x24, 0x38, 255))
    for r in range(m["rows"]):
        for c in range(m["cols"]):
            if floor[r][c]:
                img.alpha_composite(crop(floor[r][c]), (c * T, r * T))
            if walls[r][c]:
                img.alpha_composite(crop(walls[r][c]), (c * T, r * T))
    for d in m["decor"]:
        img.alpha_composite(crop(d["frame"]), (d["x"], d["y"]))
    for f in sorted(m["furniture"], key=lambda o: o["y"] + fsize(o["frame"])[1]):
        img.alpha_composite(crop(f["frame"]), (f["x"], f["y"]))
    dr = ImageDraw.Draw(img)
    for slot in meta["patient_slots"]:
        dr.ellipse([slot["x"] - 3, slot["y"] - 3, slot["x"] + 3, slot["y"] + 3],
                   fill=(111, 210, 147))
    for ev in meta["elevators"]:
        dr.line([ev["x"], ev["y"], ev["toX"], ev["toY"]], fill=(185, 168, 232), width=1)
    sp = meta["spawn"]
    dr.ellipse([sp["x"] - 3, sp["y"] - 3, sp["x"] + 3, sp["y"] + 3], fill=(255, 217, 112))

    out = os.path.join(ROOT, "assets", "levels")
    os.makedirs(out, exist_ok=True)
    scale = 2 if W < 700 else 1
    img.resize((W * scale, H * scale), Image.NEAREST).save(
        os.path.join(out, f"{level}.png"))


# ---------------------------------------------------------------- specs
def rooms_band(h, names):
    return {"kind": "rooms", "h": h,
            "rooms": [{"type": n} for n in names]}


SPECS = [
    # L1 — small clinic, 2 patients, 1 nurse, no inspector
    {"id": 1, "name": "Clínica de Barrio", "subtitle": "Tu primer turno de verdad",
     "patients": 2, "nurses": 1, "inspectors": 0, "difficulty": 1,
     "cols": 38,
     "bands": [rooms_band(7, ["reception", "emergency", "ward"]),
               {"kind": "corridor", "h": 4},
               rooms_band(7, ["pharmacy", "staff"])]},
    # L2 — district hospital, 3 patients
    {"id": 2, "name": "Hospital de Distrito", "subtitle": "Más ojos, más cuidado",
     "patients": 3, "nurses": 1, "inspectors": 1, "difficulty": 2,
     "cols": 52,
     "bands": [rooms_band(8, ["reception", "icu", "pharmacy"]),
               {"kind": "corridor", "h": 4},
               rooms_band(8, ["staff", "laboratory", "operating"])]},
    # L3 — general hospital, 5 patients, BOSS: head nurse
    {"id": 3, "name": "Hospital General", "subtitle": "El inspector ronda",
     "patients": 5, "nurses": 1, "inspectors": 1, "difficulty": 3,
     "boss": "triple",
     "cols": 66,
     "bands": [rooms_band(8, ["reception", "emergency", "icu", "pharmacy"]),
               {"kind": "corridor", "h": 4},
               rooms_band(8, ["laboratory", "operating", "wardA", "staff"])]},
    # L4 — large hospital, more NPCs
    {"id": 4, "name": "Complejo Hospitalario", "subtitle": "Plantilla completa",
     "patients": 5, "nurses": 2, "inspectors": 1, "difficulty": 4,
     "cols": 78,
     "bands": [rooms_band(8, ["reception", "waiting", "emergency", "icu", "pharmacy"]),
               {"kind": "corridor", "h": 4},
               rooms_band(8, ["laboratory", "operating", "wardA", "wardB", "cafeteria"])]},
    # L5 — final hospital, two floors + elevator, BOSS: immortal patient
    {"id": 5, "name": "Hospital Central", "subtitle": "Dos plantas. Sin descanso.",
     "patients": 6, "nurses": 2, "inspectors": 2, "difficulty": 5,
     "boss": "immortal",
     "cols": 60,
     "bands": [rooms_band(8, ["reception", "waiting", "emergency",
                              "icu", "pharmacy", "laboratory"]),       # band 0 rowA
               {"kind": "corridor", "h": 4},                          # band 1 corr1
               rooms_band(8, ["operating", "wardA", "wardB", "staff", "cafeteria"]),  # band 2 rowB
               rooms_band(8, ["radiology", "mri", "administration", "psychiatric"]),  # band 3 rowC
               {"kind": "corridor", "h": 4},                          # band 4 corr2
               rooms_band(8, ["maintenance", "storage", "security"])],  # band 5 rowD
     "elevators": [{"col": 4, "a": 1, "b": 4}]},
]


def enrich_route(route):
    """Add mid-waypoints so NPCs patrol in L/U shapes instead of straight lines."""
    if not route or len(route) != 2:
        return route
    (x0, y0), (x1, y1) = route
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    if dx > dy * 2:
        mx = (x0 + x1) // 2
        off = 18 if y0 > 100 else -18
        return [[x0, y0], [mx, y0 + off], [mx, y0 - off], [x1, y1]]
    if dy > dx * 2:
        my = (y0 + y1) // 2
        off = 18
        return [[x0, y0], [x0 + off, my], [x0 - off, my], [x1, y1]]
    return route


def build_npc_routes(meta, n_nurse, n_insp):
    corrs = meta["corridors"]
    nurses, inspectors = [], []
    for i in range(n_nurse):
        c = corrs[i % len(corrs)]
        nurses.append({"route": enrich_route([[c["x0"], c["y"]], [c["x1"], c["y"]]]),
                       "speed": 42})
    for i in range(n_insp):
        c = corrs[(i + 1) % len(corrs)] if len(corrs) > 1 else corrs[0]
        inspectors.append({"route": enrich_route([[c["x1"], c["y"]], [c["x0"], c["y"]]]),
                           "speed": 38 + i * 4})
    return nurses, inspectors


def build_observers(meta, difficulty):
    """Ambient bystander NPCs (familiares / pacientes desconfiados) were
    removed from the game, so levels no longer spawn any."""
    return [], []


def build_patients(meta, count):
    slots = meta["patient_slots"]
    if len(slots) <= count:
        chosen = slots
    else:
        step = len(slots) / count
        chosen = [slots[int(i * step)] for i in range(count)]
    # positions only — identity randomized at runtime by patients.js
    return [{"x": slot["x"], "y": slot["y"], "route": slot["route"]}
            for slot in chosen]


def build_room_objects(meta, difficulty):
    """Place 1-3 usable covert weapons near patient areas."""
    objs = []
    types = ROOM_OBJECT_TYPES[:]
    n = min(len(meta["patient_slots"]), 1 + difficulty // 2)
    for i, slot in enumerate(meta["patient_slots"][:n]):
        t = types[i % len(types)]
        objs.append({"type": t, "x": slot["x"] + 24, "y": slot["y"] - 20})
    return objs


def build_combo_hints(furniture, difficulty):
    """Attach clinical notes to desks/cabinets with combo clues."""
    hints = []
    desks = [f for f in furniture if f.get("frame") in
             ("desk", "cabinet", "medicine_shelf", "computer")]
    for i, (hint_id, text) in enumerate(COMBO_HINT_TEXTS[:max(1, difficulty)]):
        if i < len(desks):
            d = desks[i]
            hints.append({"x": d["x"] + 8, "y": d["y"] + 4,
                          "text": text, "hintId": hint_id})
    return hints


def main():
    levels_out = []
    all_problems = []
    for spec in SPECS:
        m, meta = make_hospital(spec)
        problems, floor, walls = validate(spec["id"], m, meta)
        all_problems += problems
        render(f"level{spec['id']}", m, meta, floor, walls)

        nurses, inspectors = build_npc_routes(meta, spec["nurses"], spec["inspectors"])
        patients = build_patients(meta, spec["patients"])
        family, suspicious = build_observers(meta, spec["difficulty"])
        room_objects = build_room_objects(meta, spec["difficulty"])
        combo_hints = build_combo_hints(m["furniture"], spec["difficulty"])
        if len(patients) < spec["patients"]:
            all_problems.append(
                f"L{spec['id']}: only {len(patients)} patient slots "
                f"for {spec['patients']} requested")
        levels_out.append({
            "id": spec["id"], "name": spec["name"], "subtitle": spec["subtitle"],
            "difficulty": spec["difficulty"],
            "boss": spec.get("boss"),
            "patientCount": len(patients),
            "map": m, "spawn": meta["spawn"], "patients": patients,
            "nurses": nurses, "inspectors": inspectors,
            "family": family, "suspicious": suspicious,
            "roomObjects": room_objects, "comboHints": combo_hints,
            "elevators": meta["elevators"],
        })

    js = ("// AUTO-GENERATED by tools/gen_levels.py — do not edit by hand.\n"
          "// Static level definitions consumed by GameScene / LevelSelectScene.\n"
          "export const LEVELS = " + json.dumps(levels_out, separators=(",", ":")) +
          ";\n")
    with open(os.path.join(ROOT, "js", "data", "levels.js"), "w") as fh:
        fh.write(js)

    if all_problems:
        print("PROBLEMS:")
        for p in all_problems:
            print(" -", p)
    else:
        print("ALL LEVELS OK")
    for lv in levels_out:
        print(f"  L{lv['id']} {lv['name']}: {lv['map']['cols']}x{lv['map']['rows']} "
              f"tiles, {len(lv['map']['rooms'])} rooms, {lv['patientCount']} patients, "
              f"{len(lv['nurses'])} nurse(s), {len(lv['inspectors'])} inspector(s), "
              f"{len(lv['elevators'])} elevator pads")


if __name__ == "__main__":
    main()
