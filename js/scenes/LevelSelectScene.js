import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, INK_N, PAPER, PAPER_N,
         YELLOW_N, RED, GREEN } from "../ui/theme.js";
import { LEVELS } from "../data/levels.js";
import { highestUnlocked, bestFor } from "../systems/Progress.js";

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default class LevelSelectScene extends Phaser.Scene {
  constructor() { super("LevelSelectScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9f0dd");
    this.cameras.main.fadeIn(350, 0x2e, 0x24, 0x38);
    this.leaving = false;

    // decorative checker floor band
    const g = this.add.graphics();
    g.fillStyle(0xb49adf).fillRect(0, UI_H - 90, UI_W, 6);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < UI_W / 64 + 1; x++) {
        g.fillStyle((x + y) % 2 === 0 ? 0xfdf2e0 : 0xf6e2c8);
        g.fillRect(x * 64, UI_H - 84 + y * 48, 64, 48);
      }
    }

    this.add.text(UI_W / 2, 70, "SELECCIONA NIVEL", title(34))
      .setOrigin(0.5).setStroke(INK, 8);

    const unlocked = highestUnlocked();
    const n = LEVELS.length;
    const cardW = 218, gap = 22;
    const totalW = n * cardW + (n - 1) * gap;
    const startX = (UI_W - totalW) / 2 + cardW / 2;
    const cy = 360;

    LEVELS.forEach((lv, i) => {
      const cx = startX + i * (cardW + gap);
      this.makeCard(cx, cy, cardW, lv, lv.id <= unlocked);
    });

    makeButton(this, UI_W / 2, UI_H - 50, 280, 56, "VOLVER",
      () => this.back());
    this.input.keyboard.on("keydown-ESC", () => this.back());
    this.game.music.bindKeys(this);
    this.game.music.playMenuMusic();
  }

  makeCard(cx, cy, w, lv, unlocked) {
    const h = 320;
    const shadow = this.add.rectangle(cx + 5, cy + 6, w, h, 0x7a6890).setOrigin(0.5);
    const card = this.add.rectangle(cx, cy, w, h,
      unlocked ? PAPER_N : 0xcfc6d9)
      .setOrigin(0.5).setStrokeStyle(3, INK_N);

    // level number badge
    this.add.text(cx, cy - 116, `${lv.id}`, title(40, unlocked ? RED : "#7a6890"))
      .setOrigin(0.5);
    this.add.text(cx, cy - 64, lv.name, {
      ...body(24, unlocked ? INK : "#7a6890"),
      align: "center", wordWrap: { width: w - 24 },
    }).setOrigin(0.5);

    if (unlocked) {
      this.add.text(cx, cy - 6, `${lv.patientCount} pacientes`,
        body(22, INK)).setOrigin(0.5);
      // difficulty dots
      const dots = "●".repeat(lv.difficulty) + "○".repeat(5 - lv.difficulty);
      this.add.text(cx, cy + 28, dots, body(22, RED)).setOrigin(0.5);
      const best = bestFor(lv.id);
      this.add.text(cx, cy + 64,
        best ? `Mejor: ${fmtTime(best.timeMs)}` : "Sin completar",
        body(20, best ? GREEN : "#7a6890")).setOrigin(0.5);

      const btn = makeButton(this, cx, cy + 120, w - 40, 50, "JUGAR",
        () => this.play(lv.id));
      void btn;
    } else {
      // drawn padlock (pixel font has no emoji)
      const lk = this.add.graphics();
      lk.fillStyle(0x7a6890);
      lk.fillRoundedRect(cx - 22, cy + 4, 44, 34, 5);     // body
      lk.lineStyle(7, 0x7a6890);
      lk.beginPath();
      lk.arc(cx, cy + 4, 15, Math.PI, 0);                 // shackle
      lk.strokePath();
      lk.fillStyle(0xfff6ee);
      lk.fillCircle(cx, cy + 18, 5);                       // keyhole
      lk.fillRect(cx - 2, cy + 18, 4, 12);
      this.add.text(cx, cy + 92, "Bloqueado", body(22, "#7a6890")).setOrigin(0.5);
      card.setInteractive({ useHandCursor: false });
      card.on("pointerdown", () => {
        this.game.music.sfx("damage");
        this.tweens.add({ targets: [card, shadow], x: "+=6", duration: 50,
                          yoyo: true, repeat: 2 });
      });
    }
  }

  play(levelId) {
    if (this.leaving) return;
    this.leaving = true;
    this.game.music.sfx("confirm");
    this.cameras.main.fadeOut(350, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start("GameScene", { levelId, freshRun: levelId === 1 }));
  }

  back() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start("MenuScene"));
  }
}
