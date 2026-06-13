import { TILE } from "../config.js";

/**
 * Grid A* over the wall layer. A cell is walkable when wallsGrid[r][c] is null.
 * Used by the inspector so it routes around walls instead of pushing into them.
 * 4-directional (no diagonal corner-cutting through walls).
 */
export default class Pathfinder {
  constructor(walls) {
    this.walls = walls;
    this.rows = walls.length;
    this.cols = walls[0].length;
  }

  passable(c, r) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols &&
      this.walls[r][c] === null;
  }

  /** Nearest walkable cell to (c, r) via a small expanding ring search. */
  nearestPassable(c, r) {
    if (this.passable(c, r)) return { c, r };
    for (let rad = 1; rad <= 6; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
          if (this.passable(c + dc, r + dr)) return { c: c + dc, r: r + dr };
        }
      }
    }
    return null;
  }

  /** Path in pixels from (x0,y0) to (x1,y1) -> [{x,y}, ...] cell centres, or null. */
  find(x0, y0, x1, y1) {
    const cols = this.cols;
    let s = { c: Math.floor(x0 / TILE), r: Math.floor(y0 / TILE) };
    let g = { c: Math.floor(x1 / TILE), r: Math.floor(y1 / TILE) };
    if (!this.passable(s.c, s.r)) { s = this.nearestPassable(s.c, s.r); if (!s) return null; }
    if (!this.passable(g.c, g.r)) { g = this.nearestPassable(g.c, g.r); if (!g) return null; }

    const start = s.r * cols + s.c, goal = g.r * cols + g.c;
    const center = (idx) => {
      const c = idx % cols, r = (idx - c) / cols;
      return { x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
    };
    if (start === goal) return [center(goal)];

    const h = (c, r) => Math.abs(c - g.c) + Math.abs(r - g.r);
    const open = [start];
    const inOpen = new Set([start]);
    const closed = new Set();
    const came = new Map();
    const gScore = new Map([[start, 0]]);
    const fScore = new Map([[start, h(s.c, s.r)]]);
    let guard = 0;

    while (open.length && guard++ < 6000) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) {
        if ((fScore.get(open[i]) ?? 1e9) < (fScore.get(open[bi]) ?? 1e9)) bi = i;
      }
      const cur = open.splice(bi, 1)[0];
      inOpen.delete(cur);
      if (cur === goal) return this.reconstruct(came, cur, center);
      closed.add(cur);

      const cc = cur % cols, cr = (cur - cc) / cols;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = cc + dc, nr = cr + dr;
        if (!this.passable(nc, nr)) continue;
        const ni = nr * cols + nc;
        if (closed.has(ni)) continue;
        const tentative = (gScore.get(cur) ?? 1e9) + 1;
        if (tentative < (gScore.get(ni) ?? 1e9)) {
          came.set(ni, cur);
          gScore.set(ni, tentative);
          fScore.set(ni, tentative + h(nc, nr));
          if (!inOpen.has(ni)) { open.push(ni); inOpen.add(ni); }
        }
      }
    }
    return null;
  }

  reconstruct(came, cur, center) {
    const path = [center(cur)];
    while (came.has(cur)) {
      cur = came.get(cur);
      path.unshift(center(cur));
    }
    if (path.length > 1) path.shift();   // drop the cell we're already in
    return path;
  }
}
