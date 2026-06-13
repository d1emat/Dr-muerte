import { COSTS, MAINTENANCE } from "../config.js";

/**
 * Hospital machines break down periodically; repairing one is a visible
 * good deed: -10 suspicion. Broken machines flash and show a "!" marker.
 */
export default class Maintenance {
  constructor(scene, suspicion, machines, { auto = true } = {}) {
    this.scene = scene;
    this.suspicion = suspicion;
    this.machines = machines;          // [{ id, img, x, y }]
    this.broken = new Set();
    this.fx = new Map();
    this.auto = auto;
    if (auto) this.schedule(MAINTENANCE.firstAfterMs);
  }

  schedule([a, b]) {
    this.scene.time.delayedCall(Phaser.Math.Between(a, b), () => this.breakOne());
  }

  /** Break a specific machine on demand (used by the tutorial). */
  breakNow(id) {
    const m = this.machines.find((x) => x.id === id);
    if (m && !this.broken.has(id)) this.applyBreak(m);
  }

  breakOne() {
    const candidates = this.machines.filter((m) => !this.broken.has(m.id));
    if (candidates.length > 0) {
      this.applyBreak(Phaser.Utils.Array.GetRandom(candidates));
    }
    if (this.auto) this.schedule(MAINTENANCE.nextAfterMs);
  }

  applyBreak(m) {
    this.broken.add(m.id);
    const mark = this.scene.add.text(m.x, m.y - 20, "!", {
      fontFamily: '"VT323", monospace', fontSize: "14px", color: "#ef5d6f",
    }).setOrigin(0.5).setDepth(9000).setStroke("#4a3b5c", 3);
    const bounce = this.scene.tweens.add({
      targets: mark, y: m.y - 25, duration: 380, yoyo: true, repeat: -1,
    });
    const flash = this.scene.tweens.add({
      targets: m.img, alpha: 0.45, duration: 320, yoyo: true, repeat: -1,
    });
    this.fx.set(m.id, { mark, bounce, flash, img: m.img });
    this.scene.game.events.emit("message",
      "Una máquina ha empezado a hacer 'clac-clac' en alguna parte…");
    this.scene.game.music.sfx("alarm");
  }

  isBroken(id) {
    return this.broken.has(id);
  }

  repair(m) {
    if (!this.broken.has(m.id)) return;
    this.broken.delete(m.id);
    const fx = this.fx.get(m.id);
    fx.bounce.stop(); fx.flash.stop();
    fx.mark.destroy();
    fx.img.setAlpha(1);
    this.fx.delete(m.id);
    this.suspicion.reduce(COSTS.repairMachine, m.x, m.y);
    this.scene.game.events.emit("message",
      "Máquina reparada. El personal asiente con aprobación.");
    this.scene.game.music.sfx("repair");
  }
}
