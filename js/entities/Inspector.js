import NPC from "./NPC.js";
import { INSPECTOR_ROUTE } from "../world/blueprint.js";
import { STEALTH } from "../config.js";

export default class Inspector extends NPC {
  constructor(scene) {
    super(scene, INSPECTOR_ROUTE[0][0], INSPECTOR_ROUTE[0][1], "inspector",
          INSPECTOR_ROUTE, { speed: 38, pauseMs: 2000 });
    this.target = null;
    this.chasing = false;
  }

  startChase(target) {
    if (this.chasing) return;
    this.chasing = true;
    this.target = target;
    this.setTint(0xffb3c6);   // flushed with righteous fury
    this.scene.floatText(this.x, this.y - 26, "!!", "#ef5d6f");
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
    this.scene.physics.moveTo(this, t.x, t.y, STEALTH.chaseSpeed);
    const vx = this.body.velocity.x, vy = this.body.velocity.y;
    this.lastDir = Math.abs(vx) >= Math.abs(vy)
      ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    this.anims.play(`inspector_walk_${this.lastDir}`, true);
    this.setDepth(this.y);
  }
}
