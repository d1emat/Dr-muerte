import NPC from "./NPC.js";
import { TREATMENT } from "../config.js";
import { CONDITIONS } from "../data/medical.js";

export default class Patient extends NPC {
  constructor(scene, def) {
    super(scene, def.x, def.y, "patient", def.route,
          { speed: 18, pauseMs: 2600 });
    this.displayName = def.displayName || def.name;
    this.conditions = [...(def.conditions || [])];
    this.allergies = def.allergies || [];
    this.age = def.age;
    this.bracket = def.bracket;
    this.xpValue = def.xpValue || 20;
    this.suspicionMul = def.suspicionMul || 1;
    this.treated = new Set();
    this.given = new Set();
    this.diagnosed = false;
    this.maxHealth = def.maxHealth || 100;
    this.health = this.maxHealth;
    this.lastDamageAt = -Infinity;
    this.dead = false;
    this._killedByCombo = false;
    this._killedByAllergy = false;
    this.immortal = def.immortal || false;

    this.hpBg = scene.add.rectangle(0, 0, 14, 3, 0x4a3b5c).setDepth(8000);
    this.hpFill = scene.add.rectangle(0, 0, 12, 1, 0x6fd293)
      .setOrigin(0, 0.5).setDepth(8001);
  }

  hasCondition(id) { return this.conditions.includes(id); }
  wasGiven(id) { return this.given.has(id); }
  activeConditions() { return this.conditions.filter((c) => !this.treated.has(c)); }

  /** Symptoms shown before diagnosis. */
  symptoms() {
    return this.conditions.map((c) => CONDITIONS[c].symptom);
  }

  /** Conditions shown after diagnosis. */
  displayedConditions() {
    if (!this.diagnosed) return [];
    return [...this.conditions];
  }

  allergyLabels() {
    return this.allergies.map((a) => a.label).join(", ") || "ninguna";
  }

  hasAllergyToMed(medId) {
    return this.allergies.some((a) => a.meds && a.meds.includes(medId));
  }

  harm(d) {
    if (this.immortal && this.health - d <= 0) {
      this.health = 10;
      this.lastDamageAt = this.scene.time.now;
      this.scene.floatText(this.x, this.y - 44, "¡Sigue vivo!", "#ffd970");
      return;
    }
    this.health = Math.max(0, this.health - d);
    this.lastDamageAt = this.scene.time.now;
  }

  heal(h) { this.health = Math.min(this.maxHealth, this.health + h); }
  treatCondition(id) { this.treated.add(id); }

  update(time, delta) {
    if (this.dead) return;
    super.update(time, delta);

    // untreated conditions drain health over time
    const drain = TREATMENT.drainPerCondition * this.activeConditions().length;
    if (drain > 0) {
      this.health = Math.max(0, this.health - (drain * delta) / 1000);
    }

    const pct = this.health / this.maxHealth;
    this.hpBg.setPosition(this.x, this.y - 28);
    this.hpFill.setPosition(this.x - 6, this.y - 28);
    this.hpFill.width = Math.max(0.5, pct * 12);
    this.hpFill.fillColor =
      pct > 0.5 ? 0x6fd293 : pct > 0.25 ? 0xffd970 : 0xef5d6f;

    if (this.health <= 0) this.expire();
  }

  expire() {
    const recent = this.scene.time.now - this.lastDamageAt
      < TREATMENT.recentHarmWindowMs;
    const cause = recent ? "treatment" : "natural";
    const message = recent
      ? `${this.displayName} ha muerto 'inesperadamente' durante el tratamiento.`
      : `${this.displayName} ha fallecido de causas 'naturales'. Nadie pestañea.`;
    this.die(message, cause);
  }

  die(message, cause = "natural") {
    if (this.dead) return;
    this.dead = true;
    this.halted = true;
    this.body.enable = false;
    this.anims.stop();
    this.setFrame(0);
    this.hpBg.destroy();
    this.hpFill.destroy();
    this.setOrigin(0.5, 0.5);
    this.y -= 10;
    this.setAngle(-90);
    this.setTint(0xcfc6d9);
    this.setDepth(this.y - 20);

    const soul = this.scene.add.image(this.x, this.y - 8, "soul").setDepth(5000);
    this.scene.tweens.add({
      targets: soul, y: soul.y - 28, alpha: 0,
      duration: 2200, ease: "Sine.easeOut",
      onComplete: () => soul.destroy(),
    });

    this.scene.game.events.emit("message", message);
    this.scene.events.emit("patient-died", this, cause);
  }
}
