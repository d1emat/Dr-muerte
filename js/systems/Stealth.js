import { TILE, STEALTH } from "../config.js";

const FACING = {
  down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0],
};
const FOV_COS = Math.cos(Phaser.Math.DegToRad(STEALTH.fovDeg / 2));

/**
 * Vision model: detection radius + field-of-view cone + walls block sight.
 * observers: [{ npc, bonus }]
 */
export default class Stealth {
  constructor(wallsGrid, observers) {
    this.walls = wallsGrid;
    this.observers = observers;
    this.visionMul = 1;        // temporary multiplier (e.g. blackout shrinks it)
  }

  /** Everyone who can see world position (x, y) right now. */
  witnessesAt(x, y) {
    const seen = [];
    for (const o of this.observers) {
      if (!o.npc.active || o.npc.dead) continue;
      if (this.canSee(o.npc, x, y)) seen.push(o);
    }
    return seen;
  }

  /** True if any observer currently sees (x, y). */
  anyoneSees(x, y) {
    return this.witnessesAt(x, y).length > 0;
  }

  canSee(npc, tx, ty) {
    const ex = npc.x, ey = npc.y - 8;          // eye height
    const dx = tx - ex, dy = ty - ey;
    const dist = Math.hypot(dx, dy);
    if (dist > STEALTH.viewRadius * this.visionMul) return false;
    if (dist > STEALTH.closeRange) {
      const [fx, fy] = FACING[npc.lastDir] || FACING.down;
      if ((dx * fx + dy * fy) / dist < FOV_COS) return false;
    }
    return this.lineOfSight(ex, ey, tx, ty);
  }

  /** Sample the segment against the wall grid every 4px. */
  lineOfSight(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 4));
    for (let i = 1; i < steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      const r = Math.floor(y / TILE), c = Math.floor(x / TILE);
      if (this.walls[r] && this.walls[r][c]) return false;
    }
    return true;
  }
}
