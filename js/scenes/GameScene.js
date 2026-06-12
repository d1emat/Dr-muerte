import { WORLD_W, WORLD_H, STEALTH } from "../config.js";
import { buildMap } from "../world/MapBuilder.js";
import { PLAYER_SPAWN, PATIENTS, CABINET_LOOT } from "../world/blueprint.js";
import { COSTS } from "../config.js";
import Player from "../entities/Player.js";
import Patient from "../entities/Patient.js";
import Nurse from "../entities/Nurse.js";
import Inspector from "../entities/Inspector.js";
import Inventory from "../systems/Inventory.js";
import Stealth from "../systems/Stealth.js";
import Suspicion from "../systems/Suspicion.js";
import Interactions from "../systems/Interactions.js";
import Kills from "../systems/Kills.js";

export default class GameScene extends Phaser.Scene {
  constructor() { super("GameScene"); }

  create() {
    this.ended = false;
    this.startTime = this.time.now;

    // ---------------- world
    const { wallColliders, furnitureColliders, interactables, wallsGrid } =
      buildMap(this);

    // ---------------- entities
    this.player = new Player(this, PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.patients = PATIENTS.map((def) => new Patient(this, def));
    this.nurse = new Nurse(this);
    this.inspector = new Inspector(this);
    this.npcs = [...this.patients, this.nurse, this.inspector];

    const movers = [this.player, ...this.npcs];
    this.physics.add.collider(movers, wallColliders);
    this.physics.add.collider(movers, furnitureColliders);
    this.physics.add.collider(this.player, this.npcs);

    // ---------------- camera
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    // ---------------- systems
    this.inventory = new Inventory(this);
    this.stealth = new Stealth(wallsGrid, [
      { npc: this.nurse, bonus: COSTS.witnessNurse },
      { npc: this.inspector, bonus: COSTS.witnessInspector },
    ]);
    this.suspicion = new Suspicion(this, this.stealth);
    this.kills = new Kills({
      scene: this, inventory: this.inventory,
      suspicion: this.suspicion, patients: this.patients,
    });
    this.interactions = new Interactions(this, this.player);
    this.cabinetLoot = CABINET_LOOT.slice();
    this.registerInteractables(interactables);

    // ---------------- input
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,ONE,TWO,THREE,FOUR");

    // ---------------- UI
    if (this.scene.isActive("UIScene")) {
      this.game.events.emit("ui:reset");
    } else {
      this.scene.launch("UIScene");
    }

    // ---------------- flow events (scene emitter survives restarts: clean first)
    this.events.off("patient-died");
    this.events.off("busted");
    this.events.off("witnessed");
    this.events.off("suspicion-gain");

    this.killCount = 0;
    this.events.on("patient-died", () => {
      this.killCount++;
      this.game.events.emit("kills", this.killCount, this.patients.length);
      if (this.killCount >= this.patients.length) {
        this.time.delayedCall(1200, () => this.endGame("victory"));
      }
    });
    this.events.on("busted", (cause) => this.endGame("gameover", cause));
    this.events.on("witnessed", ({ npc, bonus }) => {
      this.floatText(npc.x, npc.y - 26, "!", "#ef5d6f");
      this.game.events.emit("message",
        npc === this.inspector ? `¡El INSPECTOR lo ha visto! (+${bonus})`
                               : `La enfermera lo ha visto… (+${bonus})`);
    });
    this.events.on("suspicion-gain", ({ x, y, total }) => {
      this.floatText(x, y - 18, `+${Math.round(total)}`, "#ffd970");
    });

    this.inventory.add("syringe");
    this.game.events.emit("kills", 0, this.patients.length);
    this.time.delayedCall(400, () => {
      this.game.events.emit("message",
        "Turno de noche. Tres pacientes. Cero testigos… idealmente.");
    });
  }

  registerInteractables(interactables) {
    for (const p of this.patients) {
      this.interactions.register({
        getPos: () => ({ x: p.x, y: p.y }),
        label: () => `E: 'tratar' a ${p.displayName}`,
        enabled: () => !p.dead,
        action: () => this.kills.overdose(p),
      });
    }
    for (const it of Object.values(interactables)) {
      if (it.type === "cabinet") {
        this.interactions.register({
          getPos: () => ({ x: it.x, y: it.y }),
          label: "E: registrar armario de medicinas",
          action: () => this.kills.searchCabinet(it, this.cabinetLoot),
        });
      } else if (it.type === "coffee") {
        this.interactions.register({
          getPos: () => ({ x: it.x, y: it.y }),
          label: "E: 'mejorar' el café",
          action: () => this.kills.poisonCoffee(it),
        });
      } else if (it.type === "monitor") {
        this.interactions.register({
          getPos: () => ({ x: it.x, y: it.y }),
          label: "E: 'recalibrar' el monitor",
          action: () => this.kills.sabotage(it),
        });
      }
    }
  }

  floatText(x, y, str, color = "#fff6ee") {
    const t = this.add.text(x, y, str, {
      fontFamily: "monospace", fontSize: "8px", color,
    }).setOrigin(0.5, 1).setDepth(9000).setStroke("#4a3b5c", 2);
    this.tweens.add({
      targets: t, y: y - 14, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  endGame(kind, cause = "max") {
    if (this.ended) return;
    this.ended = true;
    const stats = {
      kills: this.killCount,
      total: this.patients.length,
      timeMs: this.time.now - this.startTime,
      cause,
    };
    this.scene.stop("UIScene");
    this.scene.start(kind === "victory" ? "VictoryScene" : "GameOverScene", stats);
  }

  update(time, delta) {
    if (this.ended) return;

    this.player.update(this.keys);
    for (const n of this.npcs) n.update(time, delta);

    // inspector alert state
    if (!this.inspector.chasing && this.suspicion.value >= STEALTH.chaseAt) {
      this.inspector.startChase(this.player);
    } else if (this.inspector.chasing && this.suspicion.value < STEALTH.calmAt) {
      this.inspector.stopChase();
    }

    this.interactions.update(this.keys.E);
    this.suspicion.update();
    const sel = [this.keys.ONE, this.keys.TWO, this.keys.THREE, this.keys.FOUR];
    sel.forEach((k, i) => {
      if (Phaser.Input.Keyboard.JustDown(k)) this.inventory.select(i);
    });
  }
}
