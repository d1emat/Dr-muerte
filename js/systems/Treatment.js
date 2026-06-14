import { MEDICINES, CONDITIONS, matchCombo, evaluateMed } from "../data/medical.js";
import { discover } from "./Journal.js";
import { COSTS, TREATMENT } from "../config.js";
import { getRunState } from "./RunState.js";

export default class Treatment {
  constructor(scene, suspicion) {
    this.scene = scene;
    this.suspicion = suspicion;
    this.readyAt = 0;
  }

  msg(text) {
    this.scene.game.events.emit("message", text);
  }

  upgrades() {
    return getRunState(this.scene.game).upgrades;
  }

  showRealEffect() {
    return !!this.upgrades().getEffect("showRealEffect");
  }

  cooldownLeft() {
    return Math.max(0, this.readyAt - this.scene.time.now);
  }

  diagnose(patient) {
    patient.diagnosed = true;
    const names = patient.conditions
      .map((c) => CONDITIONS[c].label).join(", ");
    const allergy = patient.allergyLabels();
    this.msg(`Diagnóstico de ${patient.displayName}: ${names}. ` +
      `Alergias: ${allergy}. Cuadro clínico coherente.`);
    this.scene.game.music.sfx("confirm");
  }

  applySuspicion(base, x, y) {
    if (base > 0) this.suspicion.add(base, x, y);
  }

  administer(patient, medId, dose = 1) {
    if (patient.dead) return;
    if (this.cooldownLeft() > 0) {
      this.msg("Espera a que el fármaco anterior haga efecto…");
      return;
    }
    const med = MEDICINES.find((m) => m.id === medId);
    const priorMeds = patient.given.size;
    patient.given.add(med.id);

    let dmg = 0, susp = 0, heal = 0, note, correct = false;
    const combo = matchCombo(patient, med);
    const doseTag = dose >= 1.5 ? " (sobredosis)"
      : dose <= 0.5 ? " (dosis baja)" : "";

    if (patient.hasAllergyToMed(medId)) {
      dmg = Math.round(50 * dose);
      susp = COSTS.treatAllergy + (dose >= 1.5 ? 8 : 0);
      const up = this.upgrades();
      if (up.getEffect("freeAllergyUse") && !up.freeAllergyUsed) {
        up.freeAllergyUsed = true;
        susp = 0;
      }
      note = "Anafilaxia. El historial alérgico estaba en la carpeta.";
      patient._killedByAllergy = true;
    } else if (combo) {
      const extra = Math.max(0, patient.given.size - combo.meds.length);
      dmg = Math.round(combo.baseDmg * (1 + 0.2 * extra) * dose);
      susp = COSTS.treatCombo + (dose >= 1.5 ? 6 : 0);
      note = combo.note + (extra > 0 ? " Interacción agravada por polifarmacia." : "");
      patient._killedByCombo = true;
      this.scene.cameras.main.shake(200, 0.003);
      this.spawnParticles(patient.x, patient.y, 0xef5d6f, 12);
      if (discover(combo.id)) {
        this.scene.events.emit("combo-discovered", combo, patient);
      }
    } else {
      const outcome = evaluateMed(patient, med, dose, priorMeds);
      dmg = outcome.dmg;
      heal = outcome.heal;
      susp = outcome.susp;
      note = outcome.note;
      correct = outcome.type === "correct";
      if (correct) {
        patient.treatCondition(med.correctFor);
        patient.heal(heal);
      }
    }

    if (dmg > 0) {
      patient.harm(dmg);
      this.scene.floatText(patient.x, patient.y - 28, `-${dmg} PV`, "#ef5d6f");
      this.scene.floatText(patient.x, patient.y - 38,
        combo ? "☠ interacción" : patient._killedByAllergy ? "⚠ anafilaxia" : "✗ iatrogenia",
        "#ef5d6f");
      this.scene.game.music.sfx("damage");
      if (dmg >= 25) this.scene.cameras.main.shake(100, 0.002);
      this.spawnParticles(patient.x, patient.y, 0xef5d6f, 6);
    } else if (correct && heal > 0) {
      this.scene.floatText(patient.x, patient.y - 28, `+${heal} PV`, "#6fd293");
      this.scene.floatText(patient.x, patient.y - 38, "✓ indicado", "#6fd293");
      this.scene.game.music.sfx("heal");
      this.spawnParticles(patient.x, patient.y, 0x6fd293, 4);
    } else if (heal > 0) {
      patient.heal(heal);
    }

    this.applySuspicion(susp, patient.x, patient.y);
    // remember if an observer saw this harmful act (breaks the discreet-kill streak)
    if (dmg > 0 && this.suspicion.stealth
        && this.suspicion.stealth.witnessesAt(patient.x, patient.y).length > 0) {
      patient._seenHarm = true;
    }
    if (correct) {
      this.suspicion.reduce(COSTS.correctTreatment, patient.x, patient.y);
    }

    const preview = this.showRealEffect()
      ? ` [efecto: ${dmg > 0 ? "-" + dmg : heal > 0 ? "+" + heal : "0"}]`
      : "";
    this.msg(`${med.label}${doseTag} → ${patient.displayName}. ${note}${preview}`);
    this.readyAt = this.scene.time.now + TREATMENT.cooldownMs;
    this.scene.interactions.setLock(this.readyAt);
    this.scene.events.emit("treated", { patient, correct, dmg });

    if (patient.health <= 0 && dmg > 0) {
      this.scene.cameras.main.flash(120, 239, 93, 111, false, null, 0.25);
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.rectangle(x, y, 3, 3, color).setDepth(8500);
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 20;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }
}
