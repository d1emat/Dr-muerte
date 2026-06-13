import { SUSPICION } from "../config.js";

export default class Suspicion {
  constructor(scene, stealth) {
    this.scene = scene;
    this.stealth = stealth;
    this.value = 0;
    this.lastGain = 0;
    this.lastEmitted = -1;
    this.done = false;
  }

  emit() {
    const v = Math.round(this.value);
    if (v !== this.lastEmitted) {
      this.lastEmitted = v;
      this.scene.game.events.emit("suspicion", this.value);
    }
  }

  /**
   * Suspicious action at (x, y): base cost + witness bonuses
   * for every NPC that actually sees the spot (radius + FOV + walls).
   */
  add(base, x, y) {
    let total = base;
    const up = this.scene.runUpgrades;
    if (up) {
      const mul = up.getEffect("suspicionMul");
      if (mul) total *= mul;
      if (up.getEffect("freeFirstAction") && !up.freeActionUsed) {
        up.freeActionUsed = true;
        total = 0;
      }
      const acc = up.getEffect("accidentalMul");
      if (acc) total *= acc;
    }
    for (const w of this.stealth.witnessesAt(x, y)) {
      total += w.bonus;
      this.scene.events.emit("witnessed", { npc: w.npc, bonus: w.bonus, x, y });
    }
    this.value = Math.min(SUSPICION.max, this.value + total);
    this.lastGain = this.scene.time.now;
    this.scene.events.emit("suspicion-gain", { x, y, total });
    this.emit();
    if (this.value >= SUSPICION.max && !this.done) {
      this.done = true;
      this.scene.events.emit("busted", "max");
    }
  }

  /** Helpful deed at (x, y): lower suspicion, with feedback. */
  reduce(amount, x, y) {
    if (this.done) return;
    const before = this.value;
    this.value = Math.max(0, this.value - amount);
    const delta = before - this.value;
    if (delta > 0) {
      this.scene.events.emit("suspicion-drop", { x, y, amount: delta });
    }
    this.emit();
  }

  update() {
    if (this.done || this.value <= 0) return;
    if (this.scene.time.now - this.lastGain > SUSPICION.decayDelayMs) {
      const dt = this.scene.game.loop.delta / 1000;
      let rate = SUSPICION.decayPerSec;
      const up = this.scene.runUpgrades;
      if (up) {
        const mul = up.getEffect("decayMul");
        if (mul) rate *= mul;
      }
      this.value = Math.max(0, this.value - rate * dt);
      this.emit();
    }
  }
}
