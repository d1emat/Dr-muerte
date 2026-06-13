import { UI_W } from "../config.js";
import { MEDICINES, CONDITIONS, MENU_CATEGORIES, DOSES, MED_LABEL,
         medEffectHint } from "../data/medical.js";
import { title, body, INK, RED, GREEN } from "../ui/theme.js";

const PANEL_W = 640, PANEL_H = 460;
const MAX_ROWS = 6;
const ROW_H = 40;
const ROWS_Y = 196;

export default class TreatmentMenu {
  constructor(scene, treatment) {
    this.scene = scene;
    this.treatment = treatment;
    this.patient = null;
    this.mode = "cat";
    this.category = null;
    this.index = 0;
    this.built = false;
    this.rowHitAreas = [];
  }

  build() {
    const ui = this.scene.scene.get("UIScene");
    const x = (UI_W - PANEL_W) / 2, y = 96;
    const objs = [];

    this.shadow = ui.add.rectangle(6, 8, PANEL_W, PANEL_H, 0x7a6890, 0.7)
      .setOrigin(0);
    this.panel = ui.add.rectangle(0, 0, PANEL_W, PANEL_H, 0xfff6ee, 0.97)
      .setOrigin(0).setStrokeStyle(3, 0x4a3b5c);
    this.clip = ui.add.rectangle(PANEL_W / 2 - 44, -10, 88, 22, 0xcfc6d9)
      .setOrigin(0).setStrokeStyle(3, 0x4a3b5c);

    this.title = ui.add.text(28, 24, "", title(16, INK));
    this.symptoms = ui.add.text(28, 60, "", {
      ...body(26, INK), wordWrap: { width: PANEL_W - 150 }, lineSpacing: 4,
    });
    this.icon = ui.add.image(PANEL_W - 64, 56, "items", "clipboard").setScale(4);

    this.hpLabel = ui.add.text(28, 130, "Salud", body(24, INK));
    this.hpShadow = ui.add.rectangle(106, 134, 360, 24, 0x7a6890).setOrigin(0);
    this.hpBg = ui.add.rectangle(102, 130, 360, 24, 0x4a3b5c).setOrigin(0);
    this.hpFill = ui.add.rectangle(106, 134, 0, 16, 0x6fd293).setOrigin(0);
    this.hpText = ui.add.text(478, 130, "", body(24, INK));

    this.selBar = ui.add.rectangle(20, 0, PANEL_W - 40, ROW_H - 6, 0xffd970, 0.45)
      .setOrigin(0);
    this.rows = [];
    for (let i = 0; i < MAX_ROWS; i++) {
      const row = ui.add.text(44, ROWS_Y + i * ROW_H, "", body(30, INK));
      this.rows.push(row);
      const hit = ui.add.rectangle(20, ROWS_Y + i * ROW_H - 2,
        PANEL_W - 40, ROW_H - 4, 0xffffff, 0.001)
        .setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => {
        if (!this.isOpen) return;
        const opts = this.options();
        if (i < opts.length) { this.index = i; this.refresh(); }
      });
      hit.on("pointerdown", () => {
        if (!this.isOpen) return;
        const opts = this.options();
        if (i < opts.length) { this.index = i; this.confirm(opts[i]); }
      });
      this.rowHitAreas.push(hit);
      objs.push(hit);
    }
    this.hint = ui.add.text(PANEL_W / 2, PANEL_H - 22,
      "W/S elegir · E confirmar · Q atrás · ratón OK", body(22, "#7a6890"))
      .setOrigin(0.5);

    objs.push(this.shadow, this.panel, this.clip, this.title, this.symptoms,
              this.icon, this.hpLabel, this.hpShadow, this.hpBg, this.hpFill,
              this.hpText, this.selBar, ...this.rows, this.hint);
    this.container = ui.add.container(x, y, objs)
      .setDepth(10000).setVisible(false);
    this.built = true;
  }

  get isOpen() { return this.patient !== null; }

  open(patient) {
    if (!this.built) this.build();
    this.patient = patient;
    this.mode = "cat";
    this.index = 0;
    this.scene.player.frozen = true;
    this.container.setVisible(true);
    this.container.setAlpha(0).setScale(0.95);
    this.scene.tweens.add({ targets: this.container, alpha: 1, scale: 1,
                            duration: 140, ease: "Sine.easeOut" });
    this.scene.game.events.emit("prompt", null);
    this.scene.interactions.clearPrompt();
    this.scene.game.music.sfx("tick");
    this.refresh();
  }

  close() {
    this.patient = null;
    this.container.setVisible(false);
    this.scene.player.frozen = false;
  }

  options() {
    if (this.mode === "cat") return MENU_CATEGORIES;
    if (this.mode === "med") {
      const meds = MEDICINES.filter((m) => m.cat === this.category);
      return [...meds, { id: "__back", label: "« Atrás" }];
    }
    return [...DOSES.map((d) => ({ id: d.key, label: d.label, factor: d.factor })),
            { id: "__back", label: "« Atrás" }];
  }

  update(keys) {
    if (!this.isOpen) return;
    if (this.patient.dead) { this.close(); return; }

    const opts = this.options();
    if (Phaser.Input.Keyboard.JustDown(keys.W)) {
      this.index = (this.index + opts.length - 1) % opts.length;
      this.scene.game.music.sfx("tick");
    }
    if (Phaser.Input.Keyboard.JustDown(keys.S)) {
      this.index = (this.index + 1) % opts.length;
      this.scene.game.music.sfx("tick");
    }
    if (Phaser.Input.Keyboard.JustDown(keys.Q)) this.goBack();
    if (Phaser.Input.Keyboard.JustDown(keys.E)) this.confirm(opts[this.index]);
    if (this.isOpen) this.refresh();
  }

  goBack() {
    if (this.mode === "dose") { this.mode = "med"; this.index = 0; }
    else if (this.mode === "med") {
      this.mode = "cat"; this.index = 0;
    } else this.close();
  }

  confirm(opt) {
    if (this.mode === "cat") {
      if (opt.key === "LEAVE") { this.close(); return; }
      if (opt.key === "DIAG") { this.treatment.diagnose(this.patient); return; }
      this.mode = "med";
      this.category = opt.key;
      this.index = 0;
    } else if (this.mode === "med") {
      if (opt.id === "__back") { this.mode = "cat"; this.index = 0; return; }
      this.medId = opt.id;
      this.mode = "dose";
      this.index = 1;
      this.scene.game.music.sfx("tick");
    } else {
      if (opt.id === "__back") { this.mode = "med"; this.index = 0; return; }
      this.scene.game.music.sfx("confirm");
      this.treatment.administer(this.patient, this.medId, opt.factor);
      if (this.patient && this.patient.dead) this.close();
      else { this.mode = "med"; this.index = 0; }
    }
  }

  refresh() {
    const p = this.patient;
    this.title.setText(p.displayName);
    if (p.diagnosed) {
      const parts = p.displayedConditions().map((c) =>
        CONDITIONS[c].label + (p.treated.has(c) ? " (tratada)" : ""));
      const allergy = p.allergies.length ? ` · Alergias: ${p.allergyLabels()}` : "";
      this.symptoms.setText("Dx: " + parts.join(", ") + allergy);
      this.symptoms.setColor(RED);
    } else {
      const allergy = p.allergies.length
        ? `\nHistorial: alergias a ${p.allergyLabels()}`
        : "";
      this.symptoms.setText("Síntomas: " + p.symptoms().join(", ") + allergy);
      this.symptoms.setColor(INK);
    }
    const hp = Math.max(0, Math.round(p.health));
    const max = p.maxHealth || 100;
    this.hpFill.width = Math.max(2, Math.round(352 * (hp / max)));
    this.hpFill.fillColor =
      hp / max > 0.5 ? 0x6fd293 : hp / max > 0.25 ? 0xffd970 : 0xef5d6f;
    this.hpText.setText(`${hp}/${max}`);

    const opts = this.options();
    const catIcon = (this.mode === "med" || this.mode === "dose")
      ? MENU_CATEGORIES.find((c) => c.key === this.category)?.icon
      : this.mode === "diag" ? "clipboard" : "clipboard";
    if (catIcon) this.icon.setFrame(catIcon).setVisible(true);
    else this.icon.setVisible(false);

    if (this.mode === "dose") {
      this.symptoms.setText(`Medicina: ${MED_LABEL[this.medId]}`);
      this.symptoms.setColor(INK);
    }

    this.selBar.y = ROWS_Y + this.index * ROW_H - 2;
    this.rows.forEach((row, i) => {
      const o = opts[i];
      if (!o) { row.setText(""); return; }
      const sel = i === this.index;
      let label = o.label;
      if (this.mode === "med" && o.id && o.id !== "__back"
          && this.treatment.showRealEffect()) {
        label += `  [${medEffectHint(
          MEDICINES.find((m) => m.id === o.id), this.patient)}]`;
      }
      row.setText(`${sel ? "› " : "  "}${label}`);
      row.setColor(sel ? RED : INK);
    });

    const cd = this.treatment.cooldownLeft();
    this.hint.setText(cd > 0
      ? `Haciendo efecto… ${(cd / 1000).toFixed(1)}s`
      : "W/S elegir · E confirmar · Q atrás · ratón OK");
    this.hint.setColor(cd > 0 ? GREEN : "#7a6890");
  }
}
