import { NPC_SPEED } from "../config.js";

export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sheet, route, { speed = NPC_SPEED, pauseMs = 1200 } = {}) {
    super(scene, x, y, sheet, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 6);
    this.body.setOffset(3, 18);
    this.setPushable(false);

    this.sheet = sheet;
    this.route = route;
    this.speed = speed;
    this.pauseMs = pauseMs;
    this.wpIndex = 0;
    this.pausedUntil = 0;
    this.stuckMs = 0;
    this.lastDir = "down";
    this.halted = false;
  }

  update(time, delta) {
    if (this.halted || this.route.length === 0) {
      this.body.setVelocity(0, 0);
      this.anims.play(`${this.sheet}_idle_${this.lastDir}`, true);
      return;
    }
    if (time < this.pausedUntil) {
      this.body.setVelocity(0, 0);
      this.anims.play(`${this.sheet}_idle_${this.lastDir}`, true);
      this.setDepth(this.y);
      return;
    }

    const [wx, wy] = this.route[this.wpIndex];
    const dist = Phaser.Math.Distance.Between(this.x, this.y, wx, wy);
    if (dist < 4) {
      this.body.setVelocity(0, 0);
      this.pausedUntil = time + this.pauseMs;
      this.wpIndex = (this.wpIndex + 1) % this.route.length;
      this.stuckMs = 0;
      return;
    }

    this.scene.physics.moveTo(this, wx, wy, this.speed);

    // failsafe: blocked by something — skip the waypoint
    if (this.body.speed > 1 && this.body.deltaAbsX() + this.body.deltaAbsY() < 0.05) {
      this.stuckMs += delta;
      if (this.stuckMs > 800) {
        this.wpIndex = (this.wpIndex + 1) % this.route.length;
        this.stuckMs = 0;
      }
    } else {
      this.stuckMs = 0;
    }

    const vx = this.body.velocity.x, vy = this.body.velocity.y;
    this.lastDir = Math.abs(vx) >= Math.abs(vy)
      ? (vx > 0 ? "right" : "left")
      : (vy > 0 ? "down" : "up");
    this.anims.play(`${this.sheet}_walk_${this.lastDir}`, true);
    this.setDepth(this.y);
  }
}
