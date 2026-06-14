import { WORLD_ZOOM, COSTS, STEALTH } from "../config.js";
import { FONT_BODY } from "../ui/theme.js";
import { buildMap } from "../world/MapBuilder.js";
import { TUTORIAL_MAP, TUT_SPAWN, TUT_PATIENT, TUT_NURSE_HOME,
         TUT_NURSE_WATCH_ROUTE, TUT_NURSE_WATCH_POS, TUT_MARKER }
  from "../world/tutorial_blueprint.js";
import Player from "../entities/Player.js";
import Patient from "../entities/Patient.js";
import NPC from "../entities/NPC.js";
import Stealth from "../systems/Stealth.js";
import Suspicion from "../systems/Suspicion.js";
import Interactions from "../systems/Interactions.js";
import Treatment from "../systems/Treatment.js";
import Maintenance from "../systems/Maintenance.js";
import TreatmentMenu from "../ui/TreatmentMenu.js";

export function tutorialDone() {
  try { return localStorage.getItem("ft_tutorial_done") === "1"; }
  catch (e) { return false; }
}

export function markTutorialDone() {
  try { localStorage.setItem("ft_tutorial_done", "1"); } catch (e) { /* ok */ }
}

export default class TutorialScene extends Phaser.Scene {
  constructor() { super("TutorialScene"); }

  create() {
    this.finished = false;
    this.flags = { marker: false, greeted: false, treatedAt: 0, wrongAt: 0,
                   dropAt: 0, witnessAt: 0, repaired: false };
    this.cameras.main.fadeIn(180, 0x2e, 0x24, 0x38);

    // ---------------- world
    const { wallColliders, furnitureColliders, interactables, wallsGrid,
            worldW, worldH } = buildMap(this, TUTORIAL_MAP);

    // ---------------- entities
    this.player = new Player(this, TUT_SPAWN.x, TUT_SPAWN.y);
    this.patient = new Patient(this, TUT_PATIENT);
    this.nurse = new NPC(this, TUT_NURSE_HOME[0][0], TUT_NURSE_HOME[0][1],
                         "nurse", TUT_NURSE_HOME, { speed: 40, pauseMs: 1800 });
    this.npcs = [this.patient, this.nurse];

    const movers = [this.player, ...this.npcs];
    this.physics.add.collider(movers, wallColliders);
    this.physics.add.collider(movers, furnitureColliders);
    this.physics.add.collider(this.player, this.npcs);

    // ---------------- camera
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(WORLD_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    // ---------------- systems (nurse is the only observer here)
    this.stealth = new Stealth(wallsGrid, [
      { npc: this.nurse, bonus: COSTS.witnessNurse },
    ]);
    this.suspicion = new Suspicion(this, this.stealth);
    this.treatment = new Treatment(this, this.suspicion);
    this.menu = new TreatmentMenu(this, this.treatment);
    this.interactions = new Interactions(this, this.player);

    // soft contact shadows under characters
    this.shadowFx = this.add.graphics().setDepth(1.2);

    // visible vision cone + ?/! icon for the nurse (teach how to read it)
    this.visionFx = this.add.graphics().setDepth(2);
    this.alertIcon = this.add.text(0, 0, "", {
      fontFamily: FONT_BODY, fontSize: "18px", color: "#ef5d6f",
    }).setOrigin(0.5).setDepth(8700).setStroke("#4a3b5c", 4).setVisible(false);

    const monitor = interactables.tut_monitor;
    this.maintenance = new Maintenance(this, this.suspicion, [monitor],
                                       { auto: false });
    this.registerInteractables(monitor);

    // ---------------- input
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,Q,T");
    this.input.keyboard.on("keydown-ESC", () => this.togglePause());
    this.game.music.bindKeys(this);
    this.game.music.playIdleMusic();

    // ---------------- UI
    if (this.scene.isActive("UIScene")) {
      this.game.events.emit("ui:reset");
      this.syncUI();
    } else {
      this.game.events.once("ui:ready", () => this.syncUI());
      this.scene.launch("UIScene");
    }

    // ---------------- flow events
    for (const e of ["treated", "witnessed", "suspicion-gain",
                     "suspicion-drop", "busted", "patient-died"]) {
      this.events.off(e);
    }
    this.events.on("treated", ({ dmg }) => {
      this.flags.treatedAt = this.time.now;
      if (dmg > 0) this.flags.wrongAt = this.time.now;
    });
    this.events.on("witnessed", ({ npc, bonus }) => {
      this.flags.witnessAt = this.time.now;
      this.floatText(npc.x, npc.y - 26, "!", "#ef5d6f");
      this.game.music.sfx("alarm");
      this.game.events.emit("message", `La enfermera lo ha visto… (+${bonus})`);
    });
    this.events.on("suspicion-gain", ({ x, y, total }) => {
      this.floatText(x, y - 18, `Sospecha +${Math.round(total)}`, "#ffd970");
    });
    this.events.on("suspicion-drop", ({ x, y, amount }) => {
      this.flags.dropAt = this.time.now;
      this.floatText(x, y - 18, `Sospecha -${Math.round(amount)}`, "#6fd293");
    });
    // here failure only teaches
    this.events.on("busted", () => {
      this.suspicion.done = false;
      this.suspicion.value = 45;
      this.game.events.emit("message",
        "En el turno REAL eso habría sido GAME OVER. Aquí no cuenta. Respira.");
    });
    this.events.on("patient-died", () => this.revivePatient(true));

    // ---------------- guides
    this.arrow = this.add.image(0, 0, "guide_arrow")
      .setDepth(9500).setVisible(false);
    this.arrowBob = { v: 0 };
    this.tweens.add({ targets: this.arrowBob, v: 4, duration: 380,
                      yoyo: true, repeat: -1 });
    this.ring = this.add.image(TUT_MARKER.x, TUT_MARKER.y, "guide_ring")
      .setDepth(2).setVisible(false);
    this.tweens.add({ targets: this.ring, scale: 1.25, alpha: 0.5,
                      duration: 600, yoyo: true, repeat: -1 });

    // ---------------- checkpoints
    this.steps = this.buildSteps();
    this.stepIdx = -1;
    this.stepStart = 0;
    this.time.delayedCall(500, () => this.advance());
  }

  // ------------------------------------------------------------ steps
  buildSteps() {
    const playerNear = (x, y, d) => () =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < d;
    return [
      { text: "Bienvenido al área de prácticas. Los pacientes son maniquíes… " +
        "en el turno real, no tanto.", ms: 3400 },
      { text: "Muévete con WASD hasta la marca amarilla. Estira esos huesos. " +
        "Metafóricamente.",
        guide: TUT_MARKER, ring: true,
        done: playerNear(TUT_MARKER.x, TUT_MARKER.y, 16) },
      { text: "Saluda a la enfermera (E). Una sonrisa abre puertas… y baja " +
        "sospechas.",
        guide: () => this.nurse,
        done: () => this.flags.greeted },
      { text: "Acércate al paciente (E) → DIAGNÓSTICO. Saber qué tiene es saber " +
        "cómo 'ayudarle'.",
        guide: () => this.patient,
        done: () => this.patient.diagnosed },
      { text: "Ahora trátalo: categoría → medicina → DOSIS. La dosis alta cura " +
        "más… o lo contrario.",
        guide: () => this.patient,
        done: () => this.flags.treatedAt > this.stepStart },
      { text: "Prueba a posta una medicina que NO le toca. Mira su salud caer. " +
        "Es de mentira, tranquilo.",
        guide: () => this.patient,
        done: () => this.flags.wrongAt > this.stepStart },
      { text: "Cada chapuza baja su salud y SUBE tu sospecha (barra de arriba). " +
        "Ese es el arte.", ms: 4200 },
      { text: "Mezclar fármacos puede ser letal. Cada combinación que descubras " +
        "se anota sola en tu cuaderno (J).", ms: 4400 },
      { text: "¡Avería! Repárala (E): el doctor servicial baja sospechas. Nadie " +
        "duda del que ayuda.",
        guide: () => ({ x: this.monitorRef.x, y: this.monitorRef.y }),
        enter: () => {
          this.flags.repaired = false;
          this.maintenance.breakNow("tut_monitor");
          if (this.suspicion.value < 15) {        // give it something to lower
            this.suspicion.value = 20;
            this.suspicion.emit();
          }
        },
        done: () => this.flags.repaired },
      { text: "Ese CONO amarillo es lo que ve la enfermera. Si te pilla, se " +
        "pone rojo. Apréndetelo bien.", ms: 4600 },
      { text: "Haz algo turbio DELANTE de ella para que te vea (+sospecha). " +
        "Las paredes la ciegan: úsalas.",
        guide: () => this.patient,
        enter: () => {
          this.nurse.route = TUT_NURSE_WATCH_ROUTE.slice();
          this.nurse.wpIndex = 0;
          this.nurse.pausedUntil = 0;
          this.nurse.halted = false;
          this._watchStep = true;
        },
        done: () => this.flags.witnessAt > this.stepStart },
      { text: "En el turno real, tras 'tratar' a alguien, TAPA el cuerpo antes " +
        "de que lo vean. Aquí no hace falta.", ms: 4600 },
      { text: "Eso es todo. Tres pacientes por turno, que parezca natural, y la " +
        "Muerte estará orgullosa. Suerte, doctor.", ms: 4600 },
    ];
  }

  advance() {
    this.stepIdx++;
    this.stepStart = this.time.now;
    const s = this.steps[this.stepIdx];
    if (!s) { this.finish(false); return; }
    if (s.enter) s.enter();
    this.ring.setVisible(!!s.ring);
    this.game.events.emit("tutorial",
      `${this.stepIdx + 1}/${this.steps.length} · ${s.text}  [T salta]`);
    if (this.stepIdx > 0) this.game.music.sfx("tick");
  }

  registerInteractables(monitor) {
    this.monitorRef = monitor;
    this.interactions.register({
      getPos: () => ({ x: this.patient.x, y: this.patient.y }),
      label: () => `E: atender a ${this.patient.displayName}`,
      enabled: () => !this.patient.dead,
      action: () => this.menu.open(this.patient),
    });
    this.interactions.register({
      getPos: () => ({ x: this.nurse.x, y: this.nurse.y }),
      label: "E: saludar a la enfermera",
      action: () => {
        this.flags.greeted = true;
        this.game.events.emit("message",
          "«Buenas noches, doctor. Los maniquíes de prácticas están al fondo.»");
        this.game.music.sfx("confirm");
      },
    });
    this.interactions.register({
      getPos: () => ({ x: monitor.x, y: monitor.y }),
      label: "E: reparar la máquina averiada",
      enabled: () => this.maintenance.isBroken(monitor.id),
      action: () => {
        this.maintenance.repair(monitor);
        this.flags.repaired = true;
      },
    });
  }

  updateShadows() {
    const g = this.shadowFx;
    if (!g) return;
    g.clear();
    g.fillStyle(0x2e2438, 0.22);
    for (const e of [this.player, ...this.npcs]) {
      if (e.dead) continue;
      g.fillEllipse(e.x, e.y - 1, 13, 5);
    }
  }

  updateVision() {
    const g = this.visionFx;
    if (!g) return;
    g.clear();
    const n = this.nurse;
    if (!n.active || n.dead) { this.alertIcon.setVisible(false); return; }
    const radius = STEALTH.viewRadius * this.stealth.visionMul;
    const half = Phaser.Math.DegToRad(STEALTH.fovDeg / 2);
    const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const ex = n.x, ey = n.y - 8;
    const base = ANG[n.lastDir] !== undefined ? ANG[n.lastDir] : Math.PI / 2;
    const sees = this.stealth.canSee(n, this.player.x, this.player.y);
    g.fillStyle(sees ? 0xef5d6f : 0xffd970, sees ? 0.22 : 0.10);
    g.slice(ex, ey, radius, base - half, base + half, false);
    g.fillPath();
    const dist = Phaser.Math.Distance.Between(ex, ey, this.player.x, this.player.y);
    if (sees) this.alertIcon.setText("!").setColor("#ef5d6f").setVisible(true);
    else if (dist < radius) this.alertIcon.setText("?").setColor("#ffd970").setVisible(true);
    else { this.alertIcon.setVisible(false); return; }
    this.alertIcon.setPosition(n.x, n.y - 30);
  }

  syncUI() {
    this.game.events.emit("kills", 0, 0);    // hides the patient counter
    this.game.events.emit("suspicion", this.suspicion.value);
  }

  floatText(x, y, str, color = "#fff6ee") {
    const t = this.add.text(x, y, str, {
      fontFamily: FONT_BODY, fontSize: "12px", color,
    }).setOrigin(0.5, 1).setDepth(9000).setStroke("#4a3b5c", 3).setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 120, ease: "Back.easeOut" });
    this.tweens.add({
      targets: t, y: y - 16, x: x + Phaser.Math.Between(-4, 4),
      alpha: 0, duration: 1000, delay: 150,
      onComplete: () => t.destroy(),
    });
  }

  revivePatient(full) {
    // the training dummy never really dies
    const p = this.patient;
    p.health = full ? 100 : 70;
    p.given.clear();
    if (p.dead) {
      // resurrect: simplest robust path is restarting the tutorial scene
      this.game.events.emit("message",
        "El paciente de prácticas se 'reinicia'. Magia hospitalaria.");
      this.scene.restart();
      return;
    }
    this.game.events.emit("message",
      "El paciente de prácticas se recupera solo. Es su trabajo.");
  }

  finish(skipped) {
    if (this.finished) return;
    this.finished = true;
    markTutorialDone();
    this.game.events.emit("tutorial", null);
    if (this.menu.built) this.menu.container.destroy();
    this.game.music.sfx("confirm");
    this.cameras.main.fadeOut(180, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start("GameScene"));
  }

  update(time, delta) {
    if (this.finished) return;

    this.player.update(this.keys);
    for (const n of this.npcs) n.update(time, delta);
    this.updateShadows();
    this.updateVision();

    // nurse arrives at her observation post and stays
    if (this._watchStep && !this.nurse.halted &&
        Phaser.Math.Distance.Between(this.nurse.x, this.nurse.y,
          TUT_NURSE_WATCH_POS.x, TUT_NURSE_WATCH_POS.y) < 8) {
      this.nurse.halted = true;
      this.nurse.lastDir = "down";
    }

    // training dummy failsafe
    if (!this.patient.dead && this.patient.health <= 12) this.revivePatient(false);

    if (this.menu.isOpen) {
      this.menu.update(this.keys);
    } else {
      this.interactions.update(this.keys.E);
    }
    this.suspicion.update();

    // guide arrow follows the current step's target (with a bob)
    const s = this.steps[this.stepIdx];
    if (s && s.guide) {
      const g = typeof s.guide === "function" ? s.guide() : s.guide;
      this.arrow.setVisible(true);
      this.arrow.setPosition(g.x, g.y - 26 - this.arrowBob.v);
    } else {
      this.arrow.setVisible(false);
    }

    // checkpoint progression
    if (s && ((s.done && s.done()) || (s.ms && time - this.stepStart > s.ms))) {
      this.advance();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.T)) this.finish(true);
  }

  togglePause() {
    if (this.finished) return;
    if (this.scene.isPaused("TutorialScene")) return;
    this.scene.launch("PauseScene");
    this.scene.pause();
  }
}
