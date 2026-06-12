import { TILE, WORLD_COLS, WORLD_ROWS, WORLD_W, WORLD_H } from "../config.js";
import { ROOMS, FLOOR_OVERRIDES, BANDS, DOORS, INNER_WALL_COLS,
         FURNITURE, DECOR } from "./blueprint.js";

function emptyGrid() {
  return Array.from({ length: WORLD_ROWS }, () => Array(WORLD_COLS).fill(null));
}

function computeGrids() {
  const floor = emptyGrid();
  const walls = emptyGrid();

  for (const room of ROOMS) {
    for (let r = room.y; r < room.y + room.h; r++) {
      for (let c = room.x; c < room.x + room.w; c++) {
        floor[r][c] = room.floor[(r + c) % 2];
      }
    }
  }
  for (const o of FLOOR_OVERRIDES) floor[o.r][o.c] = o.t;

  // horizontal bands: cap + 2 face rows (bottom band: cap only)
  for (const band of [BANDS.top, BANDS.mid1, BANDS.mid2]) {
    for (let c = 1; c < WORLD_COLS - 1; c++) {
      walls[band][c] = "wall_cap_h";
      walls[band + 1][c] = "wall_face_top";
      walls[band + 2][c] = "wall_face_bottom";
    }
  }
  for (let c = 1; c < WORLD_COLS - 1; c++) walls[BANDS.bottom][c] = "wall_cap_h";

  // outer vertical walls
  for (let r = 1; r < WORLD_ROWS - 1; r++) {
    walls[r][0] = "wall_cap_v";
    walls[r][WORLD_COLS - 1] = "wall_cap_v";
  }
  walls[0][0] = "wall_cap_corner_tl";
  walls[0][WORLD_COLS - 1] = "wall_cap_corner_tr";
  walls[WORLD_ROWS - 1][0] = "wall_cap_corner_bl";
  walls[WORLD_ROWS - 1][WORLD_COLS - 1] = "wall_cap_corner_br";

  // inner vertical walls between rooms (top + bottom row of rooms)
  for (const c of INNER_WALL_COLS) {
    for (let r = 3; r <= 10; r++) walls[r][c] = "wall_cap_v";
    for (let r = 21; r <= 28; r++) walls[r][c] = "wall_cap_v";
  }

  // carve door gaps through bands; add end caps on the cap row
  for (const door of DOORS) {
    const corridorFloor = ROOMS.find((r) => r.name === "corridor").floor;
    for (const c of door.cols) {
      for (let r = door.band; r < door.band + 3; r++) {
        walls[r][c] = null;
        floor[r][c] = corridorFloor[(r + c) % 2];
      }
    }
    const left = Math.min(...door.cols) - 1;
    const right = Math.max(...door.cols) + 1;
    if (walls[door.band][left]) walls[door.band][left] = "wall_cap_end_r";
    if (walls[door.band][right]) walls[door.band][right] = "wall_cap_end_l";
  }

  return { floor, walls };
}

/** Merge horizontal runs of solid cells into collision rectangles. */
function buildWallColliders(scene, walls) {
  const rects = [];
  for (let r = 0; r < WORLD_ROWS; r++) {
    let start = -1;
    for (let c = 0; c <= WORLD_COLS; c++) {
      const solid = c < WORLD_COLS && walls[r][c] !== null;
      if (solid && start < 0) start = c;
      if (!solid && start >= 0) {
        const w = (c - start) * TILE;
        const rect = scene.add.rectangle(
          start * TILE + w / 2, r * TILE + TILE / 2, w, TILE);
        scene.physics.add.existing(rect, true);
        rects.push(rect);
        start = -1;
      }
    }
  }
  return rects;
}

export function buildMap(scene) {
  const { floor, walls } = computeGrids();

  const rt = scene.add.renderTexture(0, 0, WORLD_W, WORLD_H)
    .setOrigin(0, 0).setDepth(0);
  for (let r = 0; r < WORLD_ROWS; r++) {
    for (let c = 0; c < WORLD_COLS; c++) {
      if (floor[r][c]) rt.drawFrame("tiles", floor[r][c], c * TILE, r * TILE);
      if (walls[r][c]) rt.drawFrame("tiles", walls[r][c], c * TILE, r * TILE);
    }
  }

  const wallColliders = buildWallColliders(scene, walls);

  for (const dec of DECOR) {
    scene.add.image(dec.x, dec.y, "tiles", dec.frame).setOrigin(0).setDepth(1);
  }

  const furnitureColliders = [];
  const interactables = {};
  for (const f of FURNITURE) {
    const frame = scene.textures.getFrame("tiles", f.frame);
    const img = scene.add.image(f.x, f.y, "tiles", f.frame)
      .setOrigin(0).setDepth(f.y + frame.height);
    if (!f.decor) {
      const fw = frame.width, fh = frame.height;
      const rect = scene.add.rectangle(
        f.x + fw / 2, f.y + fh * 0.45 + (fh * 0.55) / 2,
        Math.max(4, fw - 2), fh * 0.55);
      scene.physics.add.existing(rect, true);
      furnitureColliders.push(rect);
    }
    if (f.id) {
      interactables[f.id] = {
        id: f.id, type: f.type, img,
        x: f.x + frame.width / 2, y: f.y + frame.height / 2,
      };
    }
  }

  return { wallColliders, furnitureColliders, interactables, wallsGrid: walls };
}
