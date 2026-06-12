import { INTERACT_RADIUS } from "../config.js";

/**
 * Registry of interactable things. Each entry:
 *   { getPos(): {x, y}, label: string | () => string, action(), enabled(): bool }
 */
export default class Interactions {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.entries = [];
    this.current = null;
  }

  register(entry) {
    this.entries.push(entry);
  }

  update(eKey) {
    let best = null;
    let bestDist = INTERACT_RADIUS;
    for (const e of this.entries) {
      if (e.enabled && !e.enabled()) continue;
      const p = e.getPos();
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
      if (d < bestDist) { best = e; bestDist = d; }
    }
    if (best !== this.current) {
      this.current = best;
      const label = best
        ? (typeof best.label === "function" ? best.label() : best.label)
        : null;
      this.scene.game.events.emit("prompt", label);
    }
    if (best && Phaser.Input.Keyboard.JustDown(eKey)) {
      best.action();
      // label may change after acting (e.g. emptied cabinet)
      this.current = null;
    }
  }
}
