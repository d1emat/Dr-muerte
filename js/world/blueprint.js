// Hospital layout: one connected map, 60x30 tiles.
// Top rooms (rows 3-10):    Reception | ICU | Pharmacy
// Corridor  (rows 14-17)
// Bottom rooms (rows 21-28): Staff | Laboratory | Operating
// Horizontal wall bands are 3 tiles (cap + 2 face rows); vertical walls 1 tile.

export const ROOMS = [
  { name: "reception", x: 1,  y: 3,  w: 18, h: 8, floor: ["floor_white_a", "floor_white_b"] },
  { name: "icu",       x: 20, y: 3,  w: 19, h: 8, floor: ["floor_blue_a", "floor_blue_b"] },
  { name: "pharmacy",  x: 40, y: 3,  w: 19, h: 8, floor: ["floor_white_a", "floor_white_b"] },
  { name: "corridor",  x: 1,  y: 14, w: 58, h: 4, floor: ["floor_white_a", "floor_white_b"] },
  { name: "staff",     x: 1,  y: 21, w: 18, h: 8, floor: ["floor_white_a", "floor_white_b"] },
  { name: "lab",       x: 20, y: 21, w: 19, h: 8, floor: ["floor_lab_a", "floor_lab_b"] },
  { name: "operating", x: 40, y: 21, w: 19, h: 8, floor: ["floor_white_a", "floor_white_b"] },
];

// red OR-zone markings around the surgery table
export const FLOOR_OVERRIDES = [
  { c: 46, r: 22, t: "floor_er_b" }, { c: 51, r: 22, t: "floor_er_b" },
  { c: 46, r: 26, t: "floor_er_b" }, { c: 51, r: 26, t: "floor_er_b" },
];

// wall bands (cap row + 2 face rows below); bottom band is cap-only
export const BANDS = { top: 0, mid1: 11, mid2: 18, bottom: 29 };

// door gaps carved through bands (2 tiles wide)
export const DOORS = [
  { cols: [9, 10],  band: 11 },   // reception <-> corridor
  { cols: [28, 29], band: 11 },   // icu <-> corridor
  { cols: [48, 49], band: 11 },   // pharmacy <-> corridor
  { cols: [9, 10],  band: 18 },   // corridor <-> staff
  { cols: [28, 29], band: 18 },   // corridor <-> lab
  { cols: [48, 49], band: 18 },   // corridor <-> operating
];

export const INNER_WALL_COLS = [19, 39];

// furniture: world-pixel positions (top-left). id+type marks interactables.
export const FURNITURE = [
  // --- reception
  { frame: "plant_tall", x: 16, y: 48 },
  { frame: "vending_machine", x: 256, y: 48 },
  { frame: "water_dispenser", x: 272, y: 48 },
  { frame: "reception_desk", x: 96, y: 80, id: "reception_files", type: "files" },
  { frame: "computer", x: 102, y: 74, decor: true },
  { frame: "chair_down", x: 208, y: 120 },
  { frame: "chair_down", x: 232, y: 120 },
  { frame: "chair_down", x: 256, y: 120 },
  { frame: "table_round", x: 180, y: 144 },
  { frame: "bench", x: 32, y: 152 },
  { frame: "plant_wilted", x: 288, y: 152 },
  // --- icu
  { frame: "bed", x: 336, y: 48 },
  { frame: "heart_monitor", x: 352, y: 48, id: "monitor_icu_1", type: "monitor" },
  { frame: "bed", x: 400, y: 48 },
  { frame: "heart_monitor", x: 416, y: 48, id: "monitor_icu_2", type: "monitor" },
  { frame: "bed", x: 464, y: 48 },
  { frame: "iv_stand", x: 480, y: 48 },
  { frame: "bed", x: 528, y: 48 },
  { frame: "oxygen_machine", x: 544, y: 48 },
  { frame: "desk", x: 336, y: 128 },
  { frame: "computer", x: 342, y: 118, decor: true },
  // --- pharmacy
  { frame: "medicine_shelf", x: 656, y: 48 },
  { frame: "medicine_shelf", x: 704, y: 48 },
  { frame: "refrigerator", x: 752, y: 48 },
  { frame: "cabinet", x: 776, y: 48, id: "cabinet_1", type: "cabinet" },
  { frame: "cabinet", x: 792, y: 48, id: "cabinet_2", type: "cabinet" },
  { frame: "medicine_box", x: 664, y: 104 },
  { frame: "medicine_box", x: 728, y: 100 },
  { frame: "desk", x: 816, y: 120 },
  { frame: "computer", x: 822, y: 110, decor: true },
  // --- corridor
  { frame: "bench", x: 192, y: 224 },
  { frame: "plant_small", x: 240, y: 224 },
  { frame: "cleaning_cart", x: 340, y: 222 },
  { frame: "bench", x: 560, y: 224 },
  { frame: "water_dispenser", x: 740, y: 222 },
  { frame: "plant_tall", x: 904, y: 222 },
  // --- staff room
  { frame: "locker", x: 32, y: 336 },
  { frame: "locker", x: 48, y: 336 },
  { frame: "locker", x: 64, y: 336 },
  { frame: "locker", x: 80, y: 336 },
  { frame: "desk", x: 104, y: 344 },
  { frame: "coffee_machine", x: 106, y: 335, id: "coffee_1", type: "coffee", decor: true },
  { frame: "microwave", x: 122, y: 335, decor: true },
  { frame: "refrigerator", x: 192, y: 336 },
  { frame: "vending_machine", x: 272, y: 336 },
  { frame: "table_rect", x: 120, y: 408 },
  { frame: "chair_down", x: 124, y: 392 },
  { frame: "chair_left", x: 154, y: 406 },
  { frame: "bench", x: 32, y: 440 },
  { frame: "plant_small", x: 272, y: 440 },
  // --- lab
  { frame: "lab_machine", x: 336, y: 336 },
  { frame: "lab_machine", x: 368, y: 336 },
  { frame: "medicine_shelf", x: 416, y: 336 },
  { frame: "cabinet", x: 592, y: 336 },
  { frame: "table_rect", x: 400, y: 400 },
  { frame: "microscope", x: 404, y: 390, decor: true },
  { frame: "test_tubes", x: 420, y: 390, decor: true },
  { frame: "table_rect", x: 496, y: 400 },
  { frame: "flask_set", x: 500, y: 390, decor: true },
  { frame: "plant_wilted", x: 600, y: 440 },
  // --- operating room
  { frame: "cabinet", x: 656, y: 336, id: "cabinet_3", type: "cabinet" },
  { frame: "medicine_shelf", x: 672, y: 336 },
  { frame: "oxygen_machine", x: 704, y: 336 },
  { frame: "surgery_lamp", x: 728, y: 356 },
  { frame: "surgery_table", x: 768, y: 376 },
  { frame: "heart_monitor", x: 792, y: 376, id: "monitor_or", type: "monitor" },
  { frame: "iv_stand", x: 744, y: 388 },
  { frame: "table_round", x: 816, y: 408 },
  { frame: "surgery_tools", x: 816, y: 400, decor: true },
];

// wall decorations (no collision), on the corridor's north face
export const DECOR = [
  { frame: "sign_cross", x: 40, y: 196 },
  { frame: "sign_arrow_right", x: 200, y: 196 },
  { frame: "sign_exit", x: 420, y: 196 },
  { frame: "emergency_light", x: 600, y: 196 },
  { frame: "sign_arrow_left", x: 680, y: 196 },
  { frame: "sign_cross", x: 840, y: 196 },
];

// tutorial starts in reception, next to Doña Pura
export const PLAYER_SPAWN = { x: 170, y: 108 };

export const PATIENTS = [
  { name: "Don Ernesto (74)", x: 430, y: 110,
    route: [[410, 110], [450, 110]],
    conditions: ["weak_heart", "fever"] },
  { name: "Doña Pura (89)",   x: 232, y: 152,
    route: [[212, 152], [268, 152]],
    conditions: ["low_blood_pressure", "infection"] },
  { name: "Andrés (19)",      x: 724, y: 432,
    route: [[704, 432], [744, 432]],
    conditions: ["diabetes"] },
];

// full map definition for the parametric MapBuilder
export const HOSPITAL = {
  cols: 60, rows: 30,
  rooms: ROOMS,
  bands: [{ row: 0 }, { row: 11 }, { row: 18 }, { row: 29, capOnly: true }],
  vwalls: [
    { col: 0, from: 1, to: 28 }, { col: 59, from: 1, to: 28 },
    { col: 19, from: 3, to: 10 }, { col: 39, from: 3, to: 10 },
    { col: 19, from: 21, to: 28 }, { col: 39, from: 21, to: 28 },
  ],
  doors: DOORS,
  floorOverrides: FLOOR_OVERRIDES.map((o) => ({ c: o.c, r: o.r, t: o.t })),
  furniture: FURNITURE,
  decor: DECOR,
};

export const NURSE_ROUTE = [[80, 268], [880, 268]];

export const INSPECTOR_ROUTE = [
  [60, 268], [464, 268], [464, 124], [380, 120],
  [464, 124], [464, 268], [784, 268], [784, 308],
  [784, 268], [900, 268],
];
