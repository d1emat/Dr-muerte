import { WORLD_ZOOM, STEALTH, COSTS, MUSIC, HELP_COOLDOWNS, TILE }
  from "../config.js";
import { FONT_BODY } from "../ui/theme.js";
import { buildMap } from "../world/MapBuilder.js";
import { getLevel, setCurrent } from "../systems/Progress.js";
import { randomizePatient } from "../data/patients.js";
import { getRunState, addRunXp, recordKill, recordSuspicionSample,
         resetRunState } from "../systems/RunState.js";
import { ROOM_OBJECTS } from "../systems/RoomObjects.js";
import { COMBO_HINTS } from "../data/combo_hints.js";
import Player from "../entities/Player.js";
import Patient from "../entities/Patient.js";
import Nurse from "../entities/Nurse.js";
import Inspector from "../entities/Inspector.js";
import Stealth from "../systems/Stealth.js";
import Pathfinder from "../systems/Pathfinder.js";
import Suspicion from "../systems/Suspicion.js";
import Interactions from "../systems/Interactions.js";
import Treatment from "../systems/Treatment.js";
import Maintenance from "../systems/Maintenance.js";
import TreatmentMenu from "../ui/TreatmentMenu.js";

const NURSE_THANKS = [
  "Llevas las vendas. La enfermera te dedica una sonrisa.",
  "Sujetas la puerta del carro. Qué doctor tan atento.",
  "Ayudas con el papeleo de la enfermera. Modélico.",
];

const REACTIVE_LINES = {
  nurse: {
    low: ["El mejor doctor que hemos tenido.", "Qué profesional, siempre."],
    mid: ["Otro paciente 'indispuesto', doctor?", "Qué mala suerte ha tenido…"],
    high: ["¿Seguro que sabes lo que haces?", "Esto empieza a oler raro…"],
  },
  inspector: {
    low: ["Siga así, doctor. Impecable.", "Nada que reportar. Por ahora."],
    mid: ["Demasiadas coincidencias para mi gusto.", "Vigilaré de cerca este turno."],
    high: ["¡Alto ahí! ¡Eso no me gusta nada!", "Se acabó el disimulo, doctor."],
  },
};

export default class GameScene extends Phaser.Scene {
  constructor() { super("GameScene"); }

  init(data) {
    if (data && data.freshRun) resetRunState(this.game);
  }

  create(data) {
    this.ended = false;
    this.startTime = this.time.now;
    this.levelId = (data && data.levelId) || 1;
    this.level = getLevel(this.levelId);
    setCurrent(this.levelId);
    this.runState = getRunState(this.game);
    this.runState.levelStartTime = this.time.now;
    this.runUpgrades = this.runState.upgrades;
    this.runUpgrades.enterRoom();
    this.cameras.main.fadeIn(450, 0x2e, 0x24, 0x38);

    const { wallColliders, furnitureColliders, interactables, wallsGrid,
            worldW, worldH } = buildMap(this, this.level.map);
    this.wallsGrid = wallsGrid;
    this.pathfinder = new Pathfinder(wallsGrid);
    this.rooms = this.level.map.rooms || [];

    const diff = this.level.difficulty || 1;
    const patientDefs = this.level.patients.map((def) =>
      randomizePatient(def, diff));

    // boss overrides
    if (this.level.boss === "triple") {
      // extra stationary head nurse handled below
    }
    if (this.level.boss === "immortal" && patientDefs.length > 0) {
      patientDefs[0].immortal = true;
    }

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    this.patients = patientDefs.map((def) => new Patient(this, def));
    this.nurses = this.level.nurses.map((n) =>
      new Nurse(this, enrichRoute(n.route), { speed: n.speed, pauseMs: 1600 }));
    this.inspectors = this.level.inspectors.map((n) =>
      new Inspector(this, enrichRoute(n.route), { speed: n.speed, pauseMs: 2000 }));

    // ambient bystander NPCs (familiares / pacientes desconfiados) were removed

    if (this.level.boss === "inspector") {
      for (const insp of this.inspectors) insp.halted = false;
    }
    if (this.level.boss === "triple") {
      const c = this.level.nurses[0]?.route;
      if (c) {
        const headNurse = new Nurse(this, [[c[0][0], c[0][1]]],
          { speed: 0, pauseMs: 99999 });
        headNurse.halted = true;
        this.nurses.push(headNurse);
      }
    }

    this.npcs = [...this.patients, ...this.nurses, ...this.inspectors];

    const movers = [this.player, ...this.npcs];
    this.physics.add.collider(movers, wallColliders);
    this.physics.add.collider(movers, furnitureColliders);
    this.physics.add.collider(this.player, this.npcs);

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(WORLD_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    const observers = [
      ...this.nurses.map((npc) => ({ npc, bonus: COSTS.witnessNurse })),
      ...this.inspectors.map((npc) => ({ npc, bonus: COSTS.witnessInspector })),
    ];
    this.stealth = new Stealth(wallsGrid, observers);
    this.suspicion = new Suspicion(this, this.stealth);
    this.treatment = new Treatment(this, this.suspicion);
    this.menu = new TreatmentMenu(this, this.treatment);
    this.interactions = new Interactions(this, this.player);
    this.registerInteractables(interactables);
    this.registerRoomObjects();
    this.registerComboHints(interactables);
    this.registerElevators();

    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,Q,ONE,TWO,THREE,FOUR");
    this.input.keyboard.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard.on("keydown-J", () => this.openJournal());
    this.game.music.bindKeys(this);
    this.game.music.playIdleMusic();

    this._onPatientDied = (p, cause) => this.handlePatientDied(p, cause);
    this._onBusted = (cause) => this.endGame("gameover", cause);
    this._onWitnessed = (d) => this.handleWitnessed(d);
    this._onSuspicionGain = (d) => {
      this.floatText(d.x, d.y - 18, `Sospecha +${Math.round(d.total)}`, "#ffd970");
    };
    this._onSuspicionDrop = (d) => {
      this.floatText(d.x, d.y - 18, `Sospecha -${Math.round(d.amount)}`, "#6fd293");
    };
    this._onComboDiscovered = (combo, patient) => {
      this.game.music.sfx("confirm");
      this.floatText(patient.x, patient.y - 48, "★ combinación nueva", "#ffd970");
      this.game.events.emit("message",
        `Nueva combinación: ${combo.name}. Anotada en el cuaderno (J).`);
    };

    for (const e of ["patient-died", "busted", "witnessed",
                     "suspicion-gain", "suspicion-drop", "combo-discovered"]) {
      this.events.off(e);
    }
    this.events.on("patient-died", this._onPatientDied);
    this.events.on("busted", this._onBusted);
    this.events.on("witnessed", this._onWitnessed);
    this.events.on("suspicion-gain", this._onSuspicionGain);
    this.events.on("suspicion-drop", this._onSuspicionDrop);
    this.events.on("combo-discovered", this._onComboDiscovered);

    this.events.once("shutdown", () => {
      this.events.off("patient-died", this._onPatientDied);
      this.events.off("busted", this._onBusted);
      this.events.off("witnessed", this._onWitnessed);
      this.events.off("suspicion-gain", this._onSuspicionGain);
      this.events.off("suspicion-drop", this._onSuspicionDrop);
      this.events.off("combo-discovered", this._onComboDiscovered);
      if (this.reactiveTimer) this.reactiveTimer.remove();
    });

    if (this.scene.isActive("UIScene")) {
      this.game.events.emit("ui:reset");
      this.syncUI();
    } else {
      this.game.events.once("ui:ready", () => this.syncUI());
      this.scene.launch("UIScene");
    }

    this.killCount = 0;
    this.reactiveTimer = this.time.addEvent({
      delay: 12000, loop: true,
      callback: () => this.reactiveDialogue(),
    });

    this.time.delayedCall(600, () => {
      this.game.events.emit("message",
        `${this.level.name}: ${this.patients.length} pacientes. ` +
        `${this.level.subtitle}`);
    });
  }

  handlePatientDied(p, cause) {
    if (cause === "treatment") {
      let cost = COSTS.instantDeath * (p.suspicionMul || 1);
      this.suspicion.add(cost, p.x, p.y);
    }
    this.killCount++;

    let base = p.xpValue || 20;
    let bonus = 0;
    if (this.suspicion.value < 20) bonus += 10;
    if (p._killedByCombo) bonus += 15;
    if (p._killedByAllergy) bonus += 10;
    addRunXp(this.game, base + bonus,
      `${p.displayName}: ${base + bonus} XP`);

    recordKill(this.game, p, {
      combo: p._killedByCombo,
      comboId: p._lastComboId,
      allergy: p._killedByAllergy,
      timeMs: this.time.now - this.runState.levelStartTime,
    });

    this.game.music.sfx("death");
    this.game.events.emit("kills", this.killCount, this.patients.length);
    if (this.killCount >= this.patients.length) {
      this.time.delayedCall(1400, () => this.endGame("victory"));
    }
  }

  handleWitnessed({ npc, bonus }) {
    this.floatText(npc.x, npc.y - 26, "!", "#ef5d6f");
    this.game.music.sfx("alarm");
    const label = this.inspectors.includes(npc) ? "INSPECTOR" : "enfermera";
    this.game.events.emit("message",
      `¡El ${label} lo ha visto! (+${bonus})`);
  }

  reactiveDialogue() {
    if (this.ended) return;
    const v = this.suspicion.value;
    const tier = v < 30 ? "low" : v < 60 ? "mid" : "high";
    const pool = this.inspectors.length && v > 40
      ? REACTIVE_LINES.inspector[tier]
      : REACTIVE_LINES.nurse[tier];
    const npc = this.inspectors[0] || this.nurses[0];
    if (!npc) return;
    const line = Phaser.Utils.Array.GetRandom(pool);
    this.floatText(npc.x, npc.y - 36, line, "#fff6ee");
  }

  registerRoomObjects() {
    for (const obj of this.level.roomObjects || []) {
      const def = ROOM_OBJECTS[obj.type] || ROOM_OBJECTS[obj.id];
      if (!def) continue;
      const used = { done: false };
      this.interactions.register({
        getPos: () => ({ x: obj.x, y: obj.y }),
        label: () => `E: ${def.label}`,
        enabled: () => !used.done,
        action: () => {
          used.done = true;
          const nearPatient = this.nearestLivingPatient(obj.x, obj.y);
          if (!nearPatient) {
            this.game.events.emit("message", "No hay paciente cerca para usar esto.");
            return;
          }
          const dmg = def.dmg;
          nearPatient.harm(dmg);
          let susp = def.stealthy ? def.suspicion * 0.5 : def.suspicion;
          this.treatment.applySuspicion(susp, obj.x, obj.y);
          this.floatText(obj.x, obj.y - 20, `-${dmg}`, "#ef5d6f");
          this.game.events.emit("message", def.msg);
          this.game.music.sfx("damage");
          if (def.drain) nearPatient.drainBonus = def.drain;
          if (nearPatient.health <= 0) nearPatient.expire();
        },
      });
    }
  }

  registerComboHints(interactables) {
    for (const hint of this.level.comboHints || []) {
      this.interactions.register({
        getPos: () => ({ x: hint.x, y: hint.y }),
        label: "E: leer nota clínica",
        enabled: () => true,
        action: () => {
          this.game.events.emit("message", hint.text);
          this.game.music.sfx("tick");
        },
      });
    }
  }

  findPath(x0, y0, x1, y1) {
    return this.pathfinder.find(x0, y0, x1, y1);
  }

  nearestLivingPatient(x, y) {
    let best = null, d = 80;
    for (const p of this.patients) {
      if (p.dead) continue;
      const dist = Phaser.Math.Distance.Between(x, y, p.x, p.y);
      if (dist < d) { best = p; d = dist; }
    }
    return best;
  }

  registerInteractables(interactables) {
    for (const p of this.patients) {
      this.interactions.register({
        getPos: () => ({ x: p.x, y: p.y }),
        label: () => `E: atender a ${p.displayName}`,
        enabled: () => !p.dead,
        action: () => this.menu.open(p),
      });
    }

    const machines = Object.values(interactables)
      .filter((it) => it.type === "monitor");
    this.maintenance = new Maintenance(this, this.suspicion, machines);
    for (const m of machines) {
      this.interactions.register({
        getPos: () => ({ x: m.x, y: m.y }),
        label: "E: reparar la máquina averiada",
        enabled: () => this.maintenance.isBroken(m.id),
        action: () => this.maintenance.repair(m),
      });
    }

    this.helpCd = { nurses: this.nurses.map(() => 0), files: 0 };
    this.nurses.forEach((nurse, i) => {
      this.interactions.register({
        getPos: () => ({ x: nurse.x, y: nurse.y }),
        label: "E: ayudar a la enfermera",
        enabled: () => this.time.now > this.helpCd.nurses[i],
        action: () => {
          this.helpCd.nurses[i] = this.time.now + HELP_COOLDOWNS.nurse;
          this.suspicion.reduce(COSTS.helpNurse, nurse.x, nurse.y);
          this.game.events.emit("message",
            Phaser.Utils.Array.GetRandom(NURSE_THANKS));
          this.game.music.sfx("heal");
        },
      });
    });

    const desk = interactables.reception_files;
    if (desk) {
      this.interactions.register({
        getPos: () => ({ x: desk.x, y: desk.y }),
        label: "E: ordenar historiales",
        enabled: () => this.time.now > this.helpCd.files,
        action: () => {
          this.helpCd.files = this.time.now + HELP_COOLDOWNS.files;
          this.suspicion.reduce(COSTS.checkFiles, desk.x, desk.y);
          this.game.events.emit("message",
            "Historiales ordenados alfabéticamente. Impecable. Sin tachaduras.");
          this.game.music.sfx("heal");
        },
      });
    }
  }

  registerElevators() {
    for (const ev of this.level.elevators || []) {
      this.interactions.register({
        getPos: () => ({ x: ev.x, y: ev.y }),
        label: "E: tomar el ascensor",
        action: () => {
          this.cameras.main.flash(220, 74, 59, 92);
          this.player.setPosition(ev.toX, ev.toY);
          this.player.body.reset(ev.toX, ev.toY);
          this.interactions.clearPrompt();
          this.game.music.sfx("confirm");
          this.currentFloor = ev.floorTo || this.currentFloor;
          this.game.events.emit("message", "Cambio de planta. Ding.");
          this.syncUI();
        },
      });
    }
    this.currentFloor = 1;
  }

  syncUI() {
    this.game.events.emit("kills", this.killCount, this.patients.length);
    this.game.events.emit("suspicion", this.suspicion.value);
    this.game.events.emit("xp", this.runState.xp);
    this.game.events.emit("level-info", {
      id: this.levelId, name: this.level.name,
      floor: this.currentFloor,
      room: this.currentRoomLabel(),
    });
    this.game.events.emit("minimap", {
      playerX: this.player.x, playerY: this.player.y,
      worldW: this.level.map.cols * TILE,
      worldH: this.level.map.rows * TILE,
    });
  }

  currentRoomLabel() {
    const c = Math.floor(this.player.x / TILE);
    const r = Math.floor(this.player.y / TILE);
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (c >= room.x && c < room.x + room.w && r >= room.y && r < room.y + room.h) {
        return `Sala ${i + 1}`;
      }
    }
    return "Pasillo";
  }

  togglePause() {
    if (this.ended) return;
    if (this.scene.isPaused("GameScene")) return;
    this.scene.launch("PauseScene");
    this.scene.pause();
  }

  openJournal() {
    if (this.ended || this.menu.isOpen) return;
    if (this.scene.isPaused("GameScene")) return;
    this.scene.launch("JournalScene", { resume: "GameScene" });
    this.scene.pause();
  }

  useActiveUpgrade(slot) {
    const active = this.runUpgrades.active.filter((a) => a.remaining > 0);
    const item = active[slot];
    if (!item || !this.runUpgrades.useActive(item.id)) return;

    if (item.id === "distraction") {
      this.suspicion.value = 0;
      this.suspicion.emit();
      this.game.events.emit("message", "Distracción perfecta. Sospechas a cero.");
    } else if (item.id === "everyone_out") {
      for (const n of [...this.nurses, ...this.inspectors]) {
        n.halted = true;
        n.body.setVelocity(0, 0);
      }
      this.time.delayedCall(15000, () => {
        for (const n of [...this.nurses, ...this.inspectors]) {
          if (!n.dead) n.halted = false;
        }
      });
      this.game.events.emit("message", "Todos fuera. 15 segundos de libertad.");
    } else if (item.id === "urgent_call") {
      for (const insp of this.inspectors) {
        insp.halted = true;
        insp.stopChase?.();
      }
      this.time.delayedCall(20000, () => {
        for (const insp of this.inspectors) insp.halted = false;
      });
      this.game.events.emit("message", "Llamada urgente. El inspector se va.");
    } else if (item.id === "mystery_shot") {
      const p = this.nearestLivingPatient(this.player.x, this.player.y);
      if (p) {
        p.harm(60);
        this.suspicion.add(Phaser.Math.Between(5, 25), p.x, p.y);
        this.floatText(p.x, p.y - 30, "-60", "#ef5d6f");
        if (p.health <= 0) p.expire();
      }
    }
    this.game.music.sfx("confirm");
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

  endGame(kind, cause = "max") {
    if (this.ended) return;
    this.ended = true;
    recordSuspicionSample(this.game, this.suspicion.value);
    const stats = {
      levelId: this.levelId,
      levelName: this.level.name,
      kills: this.killCount,
      total: this.patients.length,
      timeMs: this.time.now - this.startTime,
      cause,
      xp: this.runState.xp,
      avgSuspicion: this.suspicion.value,
      runStats: { ...this.runState.stats },
    };
    this.scene.stop("UIScene");
    this.cameras.main.fadeOut(450, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (kind === "victory") {
        this.runState.levelsCompleted++;
        this.runState.stats.levelsWon++;
        this.scene.start("VictoryScene", stats);
      } else {
        this.scene.start("GameOverScene", stats);
      }
    });
  }

  update(time, delta) {
    if (this.ended) return;

    this.player.update(this.keys);
    for (const n of this.npcs) n.update(time, delta);

    let anyChasing = false;
    for (const insp of this.inspectors) {
      if (!insp.chasing && this.suspicion.value >= STEALTH.chaseAt) {
        insp.startChase(this.player);
      } else if (insp.chasing && this.suspicion.value < STEALTH.calmAt) {
        insp.stopChase();
      }
      if (insp.chasing) anyChasing = true;
    }

    if (anyChasing || this.suspicion.value >= MUSIC.alertOn) {
      this.game.music.playChaseMusic();
    } else if (this.suspicion.value < MUSIC.alertOff) {
      this.game.music.playIdleMusic();
    }

    if (this.menu.isOpen) {
      this.menu.update(this.keys);
    } else {
      this.interactions.update(this.keys.E);
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.useActiveUpgrade(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.useActiveUpgrade(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.useActiveUpgrade(2);
      if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.useActiveUpgrade(3);
    }

    this.suspicion.update();
    if (time % 500 < delta) {
      recordSuspicionSample(this.game, this.suspicion.value);
      this.game.events.emit("minimap", {
        playerX: this.player.x, playerY: this.player.y,
        worldW: this.level.map.cols * TILE,
        worldH: this.level.map.rows * TILE,
      });
      this.game.events.emit("level-info", {
        id: this.levelId, name: this.level.name,
        floor: this.currentFloor,
        room: this.currentRoomLabel(),
      });
    }
  }
}

/** Add L-shaped mid-waypoints to simple A-B patrol routes. */
function enrichRoute(route) {
  if (!route || route.length !== 2) return route;
  const [[x0, y0], [x1, y1]] = route;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  if (dx > dy * 2) {
    const mx = Math.round((x0 + x1) / 2);
    const off = y0 > 100 ? -18 : 18;
    return [[x0, y0], [mx, y0 + off], [mx, y0 - off], [x1, y1]];
  }
  if (dy > dx * 2) {
    const my = Math.round((y0 + y1) / 2);
    const off = 18;
    return [[x0, y0], [x0 + off, my], [x0 - off, my], [x1, y1]];
  }
  return route;
}
