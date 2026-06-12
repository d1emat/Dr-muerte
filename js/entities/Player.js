import { PLAYER_SPEED } from "../config.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "doctor", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 6);
    this.body.setOffset(3, 18);
    this.lastDir = "down";
    this.frozen = false;
  }

  update(keys) {
    if (this.frozen) {
      this.body.setVelocity(0, 0);
      this.anims.play(`doctor_idle_${this.lastDir}`, true);
      return;
    }
    let vx = (keys.D.isDown ? 1 : 0) - (keys.A.isDown ? 1 : 0);
    let vy = (keys.S.isDown ? 1 : 0) - (keys.W.isDown ? 1 : 0);
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      this.body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
      this.lastDir = Math.abs(vx) >= Math.abs(vy)
        ? (vx > 0 ? "right" : "left")
        : (vy > 0 ? "down" : "up");
      this.anims.play(`doctor_walk_${this.lastDir}`, true);
    } else {
      this.body.setVelocity(0, 0);
      this.anims.play(`doctor_idle_${this.lastDir}`, true);
    }
    this.setDepth(this.y);
  }
}
