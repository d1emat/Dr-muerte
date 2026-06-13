import NPC from "./NPC.js";
import { INSPECTOR_ROUTE } from "../world/blueprint.js";
import { STEALTH } from "../config.js";

export default class Inspector extends NPC {
  constructor(scene, route = INSPECTOR_ROUTE, opts = { speed: 38, pauseMs: 2000 }) {
    super(scene, route[0][0], route[0][1], "inspector", route, opts);
    this.target = null;
    this.chasing = false;
  }

  startChase(target) {
    if (this.chasing) return;
    this.chasing = true;
    this.target = target;
    this.setTint(0xffb3c6);   // flushed with righteous fury
    this.scene.floatText(this.x, this.y - 26, "!!", "#ef5d6f");
    this.scene.game.music.sfx("alarm");
    this.scene.game.events.emit("message",
      "El inspector viene a por ti. Disimula. CORRE disimulando.");
  }

  stopChase() {
    if (!this.chasing) return;
    this.chasing = false;
    this.clearTint();
    this.scene.game.events.emit("message",
      "El inspector vuelve a su ronda, refunfuñando.");
  }

  update(time, delta) {
    if (!this.chasing || this.halted || !this.target) {
      super.update(time, delta);
      return;
    }
    const t = this.target;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
    if (dist < STEALTH.catchDist) {
      this.body.setVelocity(0, 0);
      this.scene.events.emit("busted", "caught");
      return;
    }

    // Up close, head straight at the player; otherwise follow an A* path
    // around walls so we don't get stuck on corners.
    if (dist < 40 || !this.scene.findPath) {
      this._path = null;
      this.scene.physics.moveTo(this, t.x, t.y, STEALTH.chaseSpeed);
    } else {
      const tc = Math.floor(t.x / 16), tr = Math.floor(t.y / 16);
      if (!this._path || time > (this._nextRepath || 0) ||
          tc !== this._tgtC || tr !== this._tgtR) {
        this._path = this.scene.findPath(this.x, this.y, t.x, t.y);
        this._pathIdx = 0;
        this._nextRepath = time + 400;
        this._tgtC = tc; this._tgtR = tr;
      }
      const path = this._path;
      if (path && path.length) {
        while (this._pathIdx < path.length - 1 &&
               Phaser.Math.Distance.Between(this.x, this.y,
                 path[this._pathIdx].x, path[this._pathIdx].y) < 8) {
          this._pathIdx++;
        }
        const wp = path[this._pathIdx];
        this.scene.physics.moveTo(this, wp.x, wp.y, STEALTH.chaseSpeed);
      } else {
        this.scene.physics.moveTo(this, t.x, t.y, STEALTH.chaseSpeed);
      }
    }

    const vx = this.body.velocity.x, vy = this.body.velocity.y;
    this.lastDir = Math.abs(vx) >= Math.abs(vy)
      ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    this.anims.play(`inspector_walk_${this.lastDir}`, true);
    this.setDepth(this.y);
  }
}
