import { COSTS } from "../config.js";
import Inventory from "./Inventory.js";

/** The three kill methods. ctx = { scene, inventory, suspicion, patients } */
export default class Kills {
  constructor(ctx) {
    this.ctx = ctx;
    this.coffeePoisoned = false;
  }

  msg(text) {
    this.ctx.scene.game.events.emit("message", text);
  }

  alivePatients() {
    return this.ctx.patients.filter((p) => !p.dead);
  }

  // -------------------------------------------------- 1) overdose
  overdose(patient) {
    const { inventory, suspicion } = this.ctx;
    if (inventory.selectedItem() !== "syringe") {
      this.msg("Necesitas una JERINGUILLA en la mano para 'tratar' así.");
      return;
    }
    if (patient.dead) return;
    inventory.consumeSelected();
    suspicion.add(COSTS.overdose, patient.x, patient.y);
    patient.die(`${patient.displayName}: dosis 'terapéutica' administrada. Muerte natural, obviamente.`);
  }

  // -------------------------------------------------- 2) poisoned coffee
  poisonCoffee(machine) {
    const { scene, inventory, suspicion } = this.ctx;
    if (inventory.selectedItem() !== "poison_bottle") {
      this.msg("El café está… normal. Una pena. (Necesitas VENENO)");
      return;
    }
    if (this.coffeePoisoned) {
      this.msg("Este café ya es bastante letal.");
      return;
    }
    inventory.consumeSelected();
    this.coffeePoisoned = true;
    suspicion.add(COSTS.poisonCoffee, machine.x, machine.y);
    this.msg("El café de personal ahora es… especial. La enfermera lo repartirá.");

    scene.time.delayedCall(4500, () => {
      const alive = this.alivePatients();
      if (alive.length === 0) {
        this.msg("Café envenenado y nadie que lo beba. Desperdicio.");
        return;
      }
      const victim = Phaser.Utils.Array.GetRandom(alive);
      this.ctx.suspicion.add(COSTS.poisonDeath, victim.x, victim.y);
      victim.die(`${victim.displayName} tomó su último café. Nadie sospecha del doctor.`);
    });
  }

  // -------------------------------------------------- 3) sabotage machine
  sabotage(monitor) {
    const { scene, inventory, suspicion } = this.ctx;
    if (inventory.selectedItem() !== "electric_cable") {
      this.msg("Habría que 'recalibrar' esto… con un CABLE adecuado.");
      return;
    }
    inventory.consumeSelected();
    suspicion.add(COSTS.sabotage, monitor.x, monitor.y);
    this.msg("Monitor 'recalibrado'. Esto se arregla solo…");
    scene.tweens.add({
      targets: monitor.img, alpha: 0.4, yoyo: true, repeat: 5, duration: 120,
    });

    scene.time.delayedCall(2500, () => {
      const alive = this.alivePatients();
      let victim = null, best = 90;
      for (const p of alive) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, monitor.x, monitor.y);
        if (d < best) { victim = p; best = d; }
      }
      if (!victim) {
        this.msg("El monitor chispea… pero no había nadie conectado.");
        return;
      }
      this.ctx.suspicion.add(COSTS.sabotageDeath, victim.x, victim.y);
      victim.die(`${victim.displayName}: fallo técnico fatal. Qué pena de mantenimiento.`);
    });
  }

  // -------------------------------------------------- cabinets (loot)
  searchCabinet(cabinet, lootQueue) {
    const { inventory, suspicion } = this.ctx;
    if (lootQueue.length === 0) {
      this.msg("El armario está vacío. Sospechosamente vacío.");
      return;
    }
    const itemId = lootQueue[0];
    if (!inventory.add(itemId)) {
      this.msg("Inventario lleno (4 huecos). Suelta algo… o úsalo.");
      return;
    }
    lootQueue.shift();
    suspicion.add(COSTS.searchCabinet, cabinet.x, cabinet.y);
    this.msg(`Has encontrado: ${Inventory.nameOf(itemId)}.`);
  }
}
