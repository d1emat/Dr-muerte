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

  /** Forget the current target so the prompt re-emits next frame. */
  clearPrompt() {
    this.current = null;
  }

  /** Block interactions until the given scene time (action cooldown). */
  setLock(until) {
    this.lockedUntil = Math.max(this.lockedUntil || 0, until);
  }

  update(eKey) {
    if (this.scene.time.now < (this.lockedUntil || 0)) {
      if (this.current) {
        this.current = null;
        this.scene.game.events.emit("prompt", null);
      }
      return;
    }
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
      // clear the prompt now; it re-emits next frame if still interactable
      this.current = null;
      this.scene.game.events.emit("prompt", null);
    }
  }
}
