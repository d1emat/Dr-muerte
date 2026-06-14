import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, INK_N, PAPER, PAPER_N, YELLOW, RED, GREEN }
  from "../ui/theme.js";
import { CONDITIONS, MED_LABEL } from "../data/medical.js";
import { journalEntries, discoveredCount, TOTAL_COMBOS } from "../systems/Journal.js";

export default class JournalScene extends Phaser.Scene {
  constructor() { super("JournalScene"); }

  create(data) {
    this.leaving = false;
    this.resumeKey = data && data.resume;      // launched over a paused scene
    this.backKey = (data && data.back) || "MenuScene";
    this.scene.bringToTop();                    // render above the HUD/game

    this.add.rectangle(0, 0, UI_W, UI_H, 0x2e2438, 0.95).setOrigin(0);
    this.cameras.main.fadeIn(180, 0x2e, 0x24, 0x38);

    this.add.text(UI_W / 2, 48, "CUADERNO DE COMBINACIONES", title(26, PAPER))
      .setOrigin(0.5).setStroke(INK, 8);
    this.add.text(UI_W / 2, 92,
      `${discoveredCount()} / ${TOTAL_COMBOS} descubiertas`,
      body(24, YELLOW)).setOrigin(0.5).setStroke(INK, 4);

    // adaptive grid: more columns as the recipe list grows
    const entries = journalEntries();
    const n = entries.length;
    const cols = n > 12 ? 5 : n > 9 ? 4 : 3;
    const rows = Math.ceil(n / cols);
    const areaX = 36, areaY = 132, areaW = UI_W - 72, areaH = UI_H - 132 - 96;
    const cellW = areaW / cols, cellH = areaH / rows;

    entries.forEach((e, i) => {
      const cx = areaX + (i % cols) * cellW + cellW / 2;
      const cy = areaY + Math.floor(i / cols) * cellH + cellH / 2;
      this.makeEntry(cx, cy, cellW - 18, cellH - 14, e);
    });

    makeButton(this, UI_W / 2, UI_H - 46, 260, 54, "VOLVER", () => this.close());
    this.input.keyboard.on("keydown-ESC", () => this.close());
    this.input.keyboard.on("keydown-J", () => this.close());
    this.input.keyboard.on("keydown-Q", () => this.close());
    this.game.music.bindKeys(this);
  }

  makeEntry(cx, cy, w, h, e) {
    this.add.rectangle(cx + 3, cy + 4, w, h, 0x7a6890).setOrigin(0.5);
    this.add.rectangle(cx, cy, w, h, e.discovered ? PAPER_N : 0x4a3b5c)
      .setOrigin(0.5).setStrokeStyle(2, INK_N);

    if (!e.discovered) {
      this.add.text(cx, cy - 8, "???", title(22, "#cfc6d9")).setOrigin(0.5);
      this.add.text(cx, cy + 24, "sin descubrir", body(15, "#cfc6d9"))
        .setOrigin(0.5);
      return;
    }

    let req = "mezcla directa";
    if (e.condition) req = `con ${CONDITIONS[e.condition].label}`;
    else if (e.conditionAbsent) req = `sin ${CONDITIONS[e.conditionAbsent].label}`;

    this.add.text(cx, cy - h / 2 + 18, e.name, {
      ...body(19, RED), align: "center", wordWrap: { width: w - 16 },
    }).setOrigin(0.5, 0);
    this.add.text(cx, cy - 2, e.meds.map((m) => MED_LABEL[m]).join(" + "), {
      ...body(16, INK), align: "center", wordWrap: { width: w - 16 },
    }).setOrigin(0.5);
    this.add.text(cx, cy + 22, req, body(14, "#7a6890")).setOrigin(0.5);
    this.add.text(cx, cy + h / 2 - 16, `Daño base ${e.baseDmg}`,
      body(16, GREEN)).setOrigin(0.5);
  }

  close() {
    if (this.leaving) return;
    this.leaving = true;
    this.game.music.sfx("tick");
    if (this.resumeKey) {
      if (this.scene.isPaused(this.resumeKey)) {
        this.scene.resume(this.resumeKey);
      }
      this.scene.stop();
    } else {
      this.cameras.main.fadeOut(180, 0x2e, 0x24, 0x38);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start(this.backKey));
    }
  }
}
