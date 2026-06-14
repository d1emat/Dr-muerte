import { TILE } from "../config.js";

/**
 * Parametric tilemap builder. A map definition contains:
 *   cols, rows
 *   rooms:  [{ x, y, w, h, floor: [a, b] }]          checkered floor rects
 *   bands:  [{ row, capOnly? }]                      horizontal walls (cap + 2 faces)
 *   vwalls: [{ col, from, to }]                      vertical wall runs (caps)
 *   doors:  [{ cols: [c1, c2], band: row }]          gaps carved through bands
 *   floorOverrides: [{ c, r, t }]
 *   furniture: [{ frame, x, y, id?, type?, decor? }] world-pixel placements
 *   decor: [{ frame, x, y }]                         wall decorations, no collision
 */
function emptyGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

const DOOR_FLOOR = ["floor_white_a", "floor_white_b"];

function computeGrids(def) {
  const { cols, rows } = def;
  const floor = emptyGrid(cols, rows);
  const walls = emptyGrid(cols, rows);

  for (const room of def.rooms) {
    for (let r = room.y; r < room.y + room.h; r++) {
      for (let c = room.x; c < room.x + room.w; c++) {
        floor[r][c] = room.floor[(r + c) % 2];
      }
    }
  }
  for (const o of def.floorOverrides || []) floor[o.r][o.c] = o.t;

  for (const band of def.bands) {
    for (let c = 1; c < cols - 1; c++) {
      walls[band.row][c] = "wall_cap_h";
      if (!band.capOnly) {
        walls[band.row + 1][c] = "wall_face_top";
        walls[band.row + 2][c] = "wall_face_bottom";
      }
    }
  }

  for (const vw of def.vwalls) {
    for (let r = vw.from; r <= vw.to; r++) walls[r][vw.col] = "wall_cap_v";
  }

  walls[0][0] = "wall_cap_corner_tl";
  walls[0][cols - 1] = "wall_cap_corner_tr";
  walls[rows - 1][0] = "wall_cap_corner_bl";
  walls[rows - 1][cols - 1] = "wall_cap_corner_br";

  for (const door of def.doors) {
    for (const c of door.cols) {
      for (let r = door.band; r < door.band + 3; r++) {
        walls[r][c] = null;
        floor[r][c] = DOOR_FLOOR[(r + c) % 2];
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
function buildWallColliders(scene, walls, cols, rows) {
  const rects = [];
  for (let r = 0; r < rows; r++) {
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const solid = c < cols && walls[r][c] !== null;
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

export function buildMap(scene, def) {
  const { cols, rows } = def;
  const worldW = cols * TILE, worldH = rows * TILE;
  const { floor, walls } = computeGrids(def);

  const rt = scene.add.renderTexture(0, 0, worldW, worldH)
    .setOrigin(0, 0).setDepth(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (floor[r][c]) rt.drawFrame("tiles", floor[r][c], c * TILE, r * TILE);
      if (walls[r][c]) rt.drawFrame("tiles", walls[r][c], c * TILE, r * TILE);
    }
  }

  const wallColliders = buildWallColliders(scene, walls, cols, rows);

  for (const dec of def.decor || []) {
    scene.add.image(dec.x, dec.y, "tiles", dec.frame).setOrigin(0).setDepth(1);
  }

  // soft contact shadows so furniture sits on the floor instead of floating
  const furnitureShadows = scene.add.graphics().setDepth(0.5);
  furnitureShadows.fillStyle(0x2e2438, 0.16);

  const furnitureColliders = [];
  const interactables = {};
  for (const f of def.furniture || []) {
    const frame = scene.textures.getFrame("tiles", f.frame);
    if (!f.decor) {
      furnitureShadows.fillEllipse(f.x + frame.width / 2,
        f.y + frame.height - 2, frame.width * 0.72, 6);
    }
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

  return { wallColliders, furnitureColliders, interactables,
           wallsGrid: walls, worldW, worldH };
}
