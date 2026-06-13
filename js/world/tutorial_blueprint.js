// Tutorial training area: small isolated wing.
//
//            [ START ROOM ]
//                  |
//   [========= MAIN HALLWAY =========]
//        |         |          |
//  [PATIENT RM] [NURSE RM] [MACHINE RM]

export const TUTORIAL_MAP = {
  cols: 30, rows: 24,
  rooms: [
    { x: 10, y: 3,  w: 10, h: 5, floor: ["floor_white_a", "floor_white_b"] },  // start
    { x: 1,  y: 11, w: 28, h: 4, floor: ["floor_white_a", "floor_white_b"] },  // hallway
    { x: 1,  y: 18, w: 9,  h: 5, floor: ["floor_blue_a", "floor_blue_b"] },    // patient
    { x: 11, y: 18, w: 9,  h: 5, floor: ["floor_white_a", "floor_white_b"] },  // nurse
    { x: 21, y: 18, w: 8,  h: 5, floor: ["floor_lab_a", "floor_lab_b"] },      // machine
  ],
  bands: [
    { row: 0 }, { row: 8 }, { row: 15 }, { row: 23, capOnly: true },
  ],
  vwalls: [
    { col: 0, from: 1, to: 22 }, { col: 29, from: 1, to: 22 },   // outer
    { col: 9, from: 3, to: 7 }, { col: 20, from: 3, to: 7 },     // start room sides
    { col: 10, from: 18, to: 22 }, { col: 20, from: 18, to: 22 }, // bottom dividers
  ],
  doors: [
    { cols: [14, 15], band: 8 },    // start room -> hallway
    { cols: [4, 5],   band: 15 },   // hallway -> patient room
    { cols: [14, 15], band: 15 },   // hallway -> nurse room
    { cols: [24, 25], band: 15 },   // hallway -> machine room
  ],
  furniture: [
    // start room
    { frame: "locker", x: 176, y: 48 },
    { frame: "locker", x: 192, y: 48 },
    { frame: "plant_tall", x: 296, y: 48 },
    // hallway
    { frame: "bench", x: 112, y: 176 },
    { frame: "water_dispenser", x: 336, y: 174 },
    { frame: "plant_wilted", x: 448, y: 200 },
    // patient room
    { frame: "bed", x: 24, y: 288 },
    { frame: "heart_monitor", x: 40, y: 288 },
    { frame: "iv_stand", x: 120, y: 288 },
    // nurse room
    { frame: "desk", x: 184, y: 296 },
    { frame: "computer", x: 190, y: 286, decor: true },
    { frame: "cabinet", x: 288, y: 288 },
    { frame: "medicine_shelf", x: 248, y: 288 },
    // machine room
    { frame: "heart_monitor", x: 352, y: 288, id: "tut_monitor", type: "monitor" },
    { frame: "lab_machine", x: 424, y: 288 },
    { frame: "oxygen_machine", x: 336, y: 320 },
  ],
  decor: [
    { frame: "sign_arrow_right", x: 180, y: 148 },
    { frame: "sign_cross", x: 264, y: 148 },
    { frame: "sign_exit", x: 40, y: 148 },
  ],
};

export const TUT_SPAWN = { x: 240, y: 100 };

export const TUT_PATIENT = {
  name: "Paciente de prácticas (99)",
  x: 80, y: 332,
  route: [[64, 332], [96, 332]],
  conditions: ["fever"],
};

// nurse idles in her room; step 7 walks her to the patient room
export const TUT_NURSE_HOME = [[272, 330], [246, 330]];
export const TUT_NURSE_WATCH_ROUTE = [
  [240, 300], [240, 210], [80, 210], [80, 314],
];
export const TUT_NURSE_WATCH_POS = { x: 80, y: 314 };

export const TUT_MARKER = { x: 240, y: 212 };   // step 1 walk target
