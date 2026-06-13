// XP system: tracks experience gained during a run.
// Persists only within a single game session (resets on level start).

export default class XPSystem {
  constructor(scene) {
    this.scene = scene;
    this.xp = 0;
    this.totalEarned = 0;       // lifetime total for stats
    this.history = [];          // [{reason, amount}]
  }

  get value() { return this.xp; }

  add(amount, reason = "") {
    this.xp += amount;
    this.totalEarned += amount;
    this.history.push({ reason, amount });
    this.scene.game.events.emit("xp", this.xp);
    this.scene.game.events.emit("xp-gain", { amount, reason });
    return amount;
  }

  spend(amount) {
    if (this.xp < amount) return false;
    this.xp -= amount;
    this.scene.game.events.emit("xp", this.xp);
    return true;
  }

  canAfford(cost) { return this.xp >= cost; }

  /** Standard XP for killing a patient */
  awardKill(patient, suspicionValue) {
    let base = patient.xpValue || 20;
    let bonus = 0;
    const reasons = [];

    reasons.push(`${patient.displayName}: ${base} XP`);

    // low suspicion bonus
    if (suspicionValue < 20) {
      bonus += 10;
      reasons.push("+10 (sin sospechas)");
    }

    // used a combo
    if (patient._killedByCombo) {
      bonus += 15;
      reasons.push("+15 (combinación letal)");
    }

    // exploited allergy
    if (patient._killedByAllergy) {
      bonus += 10;
      reasons.push("+10 (alergia explotada)");
    }

    const total = base + bonus;
    this.add(total, reasons.join(" · "));
    return { total, reasons };
  }
}
