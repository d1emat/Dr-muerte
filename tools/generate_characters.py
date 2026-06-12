#!/usr/bin/env python3
"""
Dr. Muerte — character sprite sheet generator
Style: "Pastel Malpractice" (ART_STYLE.md): 16x24 frames, chibi 2-heads-tall,
auto 1px outline #4a3b5c, purple contact shadow, no anti-aliasing.

Sheets (assets/characters/<name>.png), 4 cols x 8 rows of 16x24:
  row 0 idle_down | 1 idle_up | 2 idle_right | 3 idle_left
  row 4 walk_down | 5 walk_up | 6 walk_right | 7 walk_left
Left rows are mirrored right rows. characters.json carries Phaser 3 config.
"""
import json
import os
from PIL import Image, ImageDraw

OUT    = (0x4a, 0x3b, 0x5c, 255)
SHAD   = (0x7a, 0x68, 0x90, 255)
WHITE  = (0xff, 0xf6, 0xee, 255)
GRAY   = (0xcf, 0xc6, 0xd9, 255)
MINT   = (0xc9, 0xf0, 0xdd, 255)
CREAM  = (0xfd, 0xf2, 0xe0, 255)
WOOD_S = (0xb8, 0x83, 0x5c, 255)
BLUE   = (0xa8, 0xd8, 0xf5, 255)
BLUE_S = (0x7d, 0xb3, 0xdd, 255)
LAV    = (0xdc, 0xc8, 0xf2, 255)
SKIN   = (0xff, 0xd9, 0xb8, 255)
SKIN_D = (0xc6, 0x8a, 0x5c, 255)
PINK   = (0xff, 0xb3, 0xc6, 255)
RED    = (0xef, 0x5d, 0x6f, 255)
YELLOW = (0xff, 0xd9, 0x70, 255)

FW, FH = 16, 24
ROWS = ["idle_down", "idle_up", "idle_right", "idle_left",
        "walk_down", "walk_up", "walk_right", "walk_left"]


class F:
    def __init__(self):
        self.img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def px(self, x, y, c):
        if 0 <= x < FW and 0 <= y < FH:
            self.d.point((x, y), fill=c)

    def rect(self, x, y, w, h, c):
        if w > 0 and h > 0:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)

    def hline(self, x, y, w, c):
        self.rect(x, y, w, 1, c)

    def vline(self, x, y, h, c):
        self.rect(x, y, 1, h, c)


def auto_outline(img):
    """1px OUT outline around the silhouette."""
    src = img.load()
    marks = []
    for y in range(FH):
        for x in range(FW):
            if src[x, y][3] == 0:
                for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                    if 0 <= nx < FW and 0 <= ny < FH and src[nx, ny][3] != 0:
                        marks.append((x, y))
                        break
    for x, y in marks:
        src[x, y] = OUT
    return img


# ---------------------------------------------------------------- specs
DOCTOR = dict(
    name="doctor", skin=GRAY, hair=SHAD, top=WHITE, top_s=GRAY,
    pants=OUT, shoes=OUT, eyes="sockets", cheeks=False, mouth="grin",
    extra="coat",
)
NURSE = dict(
    name="nurse", skin=SKIN, hair=WOOD_S, top=BLUE_S, top_s=BLUE,
    pants=BLUE_S, shoes=WHITE, eyes="normal", cheeks=True, mouth="smile",
    extra="nurse",
)
PATIENT = dict(
    name="patient", skin=SKIN, hair=WOOD_S, top=BLUE, top_s=BLUE_S,
    pants=SKIN, shoes=GRAY, eyes="tired", cheeks=True, mouth="flat",
    extra="gown", slouch=1,
)
INSPECTOR = dict(
    name="inspector", skin=SKIN_D, hair=SHAD, top=SHAD, top_s=SHAD,
    pants=OUT, shoes=OUT, eyes="visor", cheeks=True, mouth="frown",
    extra="inspector",
)


# ---------------------------------------------------------------- pieces
def head_shape(f, dy, c):
    f.rect(4, 3 + dy, 8, 10, c)
    f.rect(3, 4 + dy, 10, 8, c)


def face(f, s, dy, blink, facing):
    """Eyes / cheeks / mouth for down or right facing."""
    ey = 8 + dy
    if facing == "down":
        exs = (5, 9)
        cheek_xs = (3, 11)
        mx = 7
    else:  # right
        exs = (9,)
        cheek_xs = (10,)
        mx = 10

    if s["eyes"] == "visor":
        if facing == "down":
            f.rect(4, ey, 8, 2, OUT)
        else:
            f.rect(8, ey, 4, 2, OUT)
    elif s["eyes"] == "tired":
        for ex in exs:
            f.rect(ex, ey + 1, 2, 1, OUT)
    elif s["eyes"] == "sockets":
        for ex in exs:
            f.rect(ex, ey, 2, 2, OUT)
    else:  # normal
        for ex in exs:
            if blink:
                f.rect(ex, ey + 1, 2, 1, OUT)
            else:
                f.rect(ex, ey, 2, 2, OUT)
                f.px(ex + 1, ey, WHITE)

    if s["cheeks"]:
        for cx in cheek_xs:
            f.px(cx, 10 + dy, PINK)

    my = 11 + dy
    if s["mouth"] == "grin":          # Death: wide fixed smile
        if facing == "down":
            f.hline(6, my, 4, OUT)
            f.px(5, my - 1, OUT)
            f.px(10, my - 1, OUT)
        else:
            f.hline(9, my, 3, OUT)
    elif s["mouth"] == "smile":
        f.hline(mx, my, 2, OUT)
    elif s["mouth"] == "frown":
        f.hline(mx, my, 2, OUT)
        if facing == "down":
            f.px(mx - 1, my - 1, OUT)      # downturned corners
            f.px(mx + 2, my - 1, OUT)
    # "flat": no mouth — patients are too weak to emote


def hair_down(f, s, dy):
    f.rect(4, 3 + dy, 8, 2, s["hair"])
    f.rect(3, 4 + dy, 10, 2, s["hair"])
    f.px(3, 6 + dy, s["hair"])           # sideburns
    f.px(12, 6 + dy, s["hair"])
    n = s["extra"]
    if n == "nurse":                      # white cap + red cross
        f.rect(5, 1 + dy, 6, 2, WHITE)
        f.px(7, 1 + dy, RED)
        f.px(8, 1 + dy, RED)
    elif n == "gown":                     # messy strands
        f.px(4, 2 + dy, s["hair"])
        f.px(8, 2 + dy, s["hair"])
        f.px(11, 2 + dy, s["hair"])
    elif n == "inspector":                # cap + brim + badge
        f.rect(4, 2 + dy, 8, 2, SHAD)
        f.rect(3, 4 + dy, 10, 2, SHAD)
        f.hline(3, 6 + dy, 10, OUT)
        f.px(7, 3 + dy, YELLOW)
        f.px(8, 3 + dy, YELLOW)


def hair_up(f, s, dy):
    head_shape(f, dy, s["hair"])          # back of head: all hair
    n = s["extra"]
    if n == "nurse":
        f.rect(5, 1 + dy, 6, 2, WHITE)
        f.rect(6, 5 + dy, 4, 3, WOOD_S)   # bun
        f.px(6, 5 + dy, OUT); f.px(9, 5 + dy, OUT)
    elif n == "inspector":
        f.rect(4, 2 + dy, 8, 2, SHAD)
    elif n == "gown":
        f.px(4, 2 + dy, s["hair"])
        f.px(9, 2 + dy, s["hair"])


def hair_right(f, s, dy):
    f.rect(5, 3 + dy, 7, 2, s["hair"])    # top
    f.rect(4, 4 + dy, 3, 7, s["hair"])    # back of head
    n = s["extra"]
    if n == "nurse":
        f.rect(6, 1 + dy, 5, 2, WHITE)
        f.px(7, 1 + dy, RED)
        f.rect(3, 5 + dy, 2, 3, WOOD_S)   # bun
    elif n == "gown":
        f.px(6, 2 + dy, s["hair"])
        f.px(10, 2 + dy, s["hair"])
    elif n == "inspector":
        f.rect(5, 2 + dy, 7, 2, SHAD)
        f.rect(4, 4 + dy, 3, 7, SHAD)
        f.hline(8, 5 + dy, 5, OUT)        # brim forward
        f.px(7, 3 + dy, YELLOW)


def torso_front(f, s, dy, back=False):
    f.rect(4, 12 + dy, 8, 8, s["top"])
    # arms + hands
    for ax in (3, 12):
        f.vline(ax, 14 + dy, 3, s["top"])
        f.px(ax, 17 + dy, s["skin"])
    n = s["extra"]
    if n == "coat":
        if back:
            f.vline(7, 14 + dy, 6, s["top_s"])     # back vent
            f.hline(5, 12 + dy, 6, SHAD)           # collar
        else:
            f.rect(7, 12 + dy, 2, 8, OUT)          # dark tunic shows through
            f.px(6, 12 + dy, s["top_s"])           # lapels
            f.px(9, 12 + dy, s["top_s"])
    elif n == "nurse":
        if back:
            f.hline(6, 13 + dy, 4, WHITE)          # apron ties
        else:
            f.px(7, 12 + dy, WHITE)                # collar
            f.px(8, 12 + dy, WHITE)
            f.rect(6, 15 + dy, 4, 4, WHITE)        # clipboard
            f.px(7, 15 + dy, GRAY)
            f.px(8, 15 + dy, GRAY)
    elif n == "gown":
        if back:
            f.px(7, 13 + dy, WHITE)                # gown ties (bow)
            f.px(8, 14 + dy, WHITE)
            f.px(7, 16 + dy, WHITE)
        else:
            f.hline(6, 12 + dy, 4, WHITE)          # neckline
    elif n == "inspector":
        f.hline(4, 18 + dy, 8, OUT)                # belt
        if not back:
            f.px(5, 14 + dy, YELLOW)               # chest badge
            f.vline(8, 12 + dy, 5, OUT)            # tie


def torso_right(f, s, dy):
    f.rect(5, 12 + dy, 7, 8, s["top"])
    n = s["extra"]
    if n == "coat":
        f.vline(10, 13 + dy, 7, s["top_s"])        # coat front edge
    elif n == "inspector":
        f.hline(5, 18 + dy, 7, OUT)                # belt
    # near arm
    f.rect(7, 14 + dy, 2, 3, s["top_s"] if s["top_s"] != s["top"] else s["top"])
    f.rect(7, 17 + dy, 2, 1, s["skin"])
    if n == "nurse":                               # clipboard in hand
        f.rect(10, 14 + dy, 3, 4, WHITE)
        f.px(11, 14 + dy, GRAY)


def legs_front(f, s, pose):
    for side, lx in (("l", 5), ("r", 9)):
        lift = 1 if (pose == "a" and side == "l") or (pose == "b" and side == "r") else 0
        top = 19 - lift
        f.rect(lx, top, 2, 4, s["pants"])
        f.rect(lx, top + 2, 2, 2, s["shoes"])


def legs_right(f, s, pose):
    if pose == "a":
        back_x, front_x = 5, 10
    elif pose == "b":
        back_x, front_x = 6, 9
    else:
        back_x, front_x = 6, 9
    f.rect(back_x, 19, 2, 4, s["pants"])
    f.rect(back_x, 21, 2, 2, s["shoes"])
    f.rect(front_x, 19, 2, 4, s["pants"])
    f.rect(front_x, 21, 3 if pose != "stand" else 2, 2, s["shoes"])
    if pose == "stand":
        f.rect(front_x, 21, 3, 2, s["shoes"])


# ---------------------------------------------------------------- frame
def draw_frame(s, facing, anim, fi):
    f = F()
    slouch = s.get("slouch", 0)

    if anim == "idle":
        body_dy = 0
        head_dy = (1 if fi >= 2 else 0) + slouch
        blink = fi == 3
        pose = "stand"
    else:
        body_dy = -1 if fi % 2 == 1 else 0
        head_dy = body_dy + slouch
        blink = False
        pose = ("a", "pass", "b", "pass")[fi]

    if facing in ("down", "up"):
        legs_front(f, s, pose)
        torso_front(f, s, body_dy, back=(facing == "up"))
        head_shape(f, head_dy, s["skin"])
        if facing == "down":
            hair_down(f, s, head_dy)
            face(f, s, head_dy, blink, "down")
        else:
            hair_up(f, s, head_dy)
    else:  # right (left is mirrored later)
        legs_right(f, s, pose)
        torso_right(f, s, body_dy)
        f.rect(5, 3 + head_dy, 7, 10, s["skin"])
        f.rect(4, 4 + head_dy, 9, 8, s["skin"])
        hair_right(f, s, head_dy)
        face(f, s, head_dy, blink, "right")

    auto_outline(f.img)

    out = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    od = ImageDraw.Draw(out)
    od.rectangle([4, 23, 11, 23], fill=SHAD)       # contact shadow
    out.alpha_composite(f.img)
    return out


def build_sheet(s):
    sheet = Image.new("RGBA", (FW * 4, FH * 8), (0, 0, 0, 0))
    for r, row_name in enumerate(ROWS):
        anim, facing = row_name.split("_")
        for fi in range(4):
            if facing == "left":
                frame = draw_frame(s, "right", anim, fi).transpose(
                    Image.FLIP_LEFT_RIGHT)
            else:
                frame = draw_frame(s, facing, anim, fi)
            sheet.alpha_composite(frame, (fi * FW, r * FH))
    return sheet


# ---------------------------------------------------------------- output
out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "characters")
os.makedirs(out_dir, exist_ok=True)

SPECS = [DOCTOR, NURSE, PATIENT, INSPECTOR]
sheets = {}
for s in SPECS:
    sheets[s["name"]] = build_sheet(s)
    sheets[s["name"]].save(os.path.join(out_dir, f"{s['name']}.png"))

config = {
    "frameWidth": FW, "frameHeight": FH,
    "sheets": {s["name"]: f"{s['name']}.png" for s in SPECS},
    "animations": {},
    "meta": {"rows": ROWS, "framesPerRow": 4,
             "note": "load with this.load.spritesheet(name, file, "
                     "{frameWidth:16, frameHeight:24}); left rows are "
                     "pre-mirrored, no flipX needed."},
}
for r, row_name in enumerate(ROWS):
    config["animations"][row_name] = {
        "frames": list(range(r * 4, r * 4 + 4)),
        "frameRate": 6 if row_name.startswith("idle") else 8,
        "repeat": -1,
    }
with open(os.path.join(out_dir, "characters.json"), "w") as fjson:
    json.dump(config, fjson, indent=1)

# preview: all four sheets side by side, x4
PAD = 8
pw = (FW * 4 + PAD) * len(SPECS) + PAD
ph = FH * 8 + PAD * 2
preview = Image.new("RGBA", (pw, ph), (0x4a, 0x3b, 0x5c, 255))
for i, s in enumerate(SPECS):
    preview.alpha_composite(sheets[s["name"]], (PAD + i * (FW * 4 + PAD), PAD))
preview.resize((pw * 4, ph * 4), Image.NEAREST).save(
    os.path.join(out_dir, "preview_x4.png"))

# cast standing in the reception room (cohesion check)
room_path = os.path.join(os.path.dirname(__file__), "..", "assets", "rooms",
                         "room1_reception_x4.png")
if os.path.exists(room_path):
    room = Image.open(room_path).convert("RGBA")
    for i, s in enumerate(SPECS):
        frame = sheets[s["name"]].crop((0, 0, FW, FH))   # idle_down f0
        big = frame.resize((FW * 4, FH * 4), Image.NEAREST)
        room.alpha_composite(big, ((120 + i * 24) * 4, 96 * 4))
    room.save(os.path.join(out_dir, "cast_in_room_x4.png"))

print(f"OK: {len(SPECS)} sheets -> {out_dir}")
