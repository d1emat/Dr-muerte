import { VIEW_W, VIEW_H, SUSPICION, ITEM_DATA } from "../config.js";

const INK = "#4a3b5c";
const PAPER = "#fff6ee";

export default class UIScene extends Phaser.Scene {
  constructor() { super("UIScene"); }

  create() {
    this.suspicionValue = 0;

    // ---- suspicion bar (top-left)
    this.add.text(8, 4, "SOSPECHAS", {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
    }).setStroke(INK, 2);
    this.barBg = this.add.rectangle(8, 15, 64, 6, 0x4a3b5c).setOrigin(0);
    this.barFill = this.add.rectangle(9, 16, 0, 4, 0x6fd293).setOrigin(0);

    // ---- kill counter (top-right)
    this.killText = this.add.text(VIEW_W - 8, 4, "Pacientes: 0/3", {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
    }).setOrigin(1, 0).setStroke(INK, 2);

    // ---- inventory (bottom-left), 4 slots
    this.slotRects = [];
    this.slotIcons = [];
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 20;
      const r = this.add.rectangle(x, VIEW_H - 24, 18, 18, 0xfff6ee, 0.9)
        .setOrigin(0).setStrokeStyle(1, 0x4a3b5c);
      this.slotRects.push(r);
      this.slotIcons.push(null);
      this.add.text(x + 1, VIEW_H - 24, String(i + 1), {
        fontFamily: "monospace", fontSize: "7px", color: INK,
      });
    }

    // ---- prompt + messages
    this.promptText = this.add.text(VIEW_W / 2, VIEW_H - 34, "", {
      fontFamily: "monospace", fontSize: "8px", color: "#ffd970",
    }).setOrigin(0.5).setStroke(INK, 3);
    this.msgText = this.add.text(VIEW_W / 2, VIEW_H - 8, "", {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
      align: "center", wordWrap: { width: VIEW_W - 60 },
    }).setOrigin(0.5, 1).setStroke(INK, 3);
    this.msgTimer = null;

    // ---- end-of-game overlay
    this.overlay = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x4a3b5c, 0.88)
      .setOrigin(0).setVisible(false);
    this.overlayTitle = this.add.text(VIEW_W / 2, VIEW_H / 2 - 16, "", {
      fontFamily: "monospace", fontSize: "14px", color: PAPER,
    }).setOrigin(0.5).setVisible(false);
    this.overlayBody = this.add.text(VIEW_W / 2, VIEW_H / 2 + 8, "", {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
      align: "center", wordWrap: { width: VIEW_W - 40 },
    }).setOrigin(0.5).setVisible(false);

    // ---- events from GameScene
    const ev = this.game.events;
    ev.on("suspicion", this.onSuspicion, this);
    ev.on("inventory", this.onInventory, this);
    ev.on("prompt", this.onPrompt, this);
    ev.on("message", this.onMessage, this);
    ev.on("kills", this.onKills, this);
    ev.on("victory", () => this.showEnd(
      "VICTORIA",
      "El hospital tiene la tasa de mortalidad más alta del país.\nMisión cumplida.\n\n[R] para otro turno"));
    ev.on("gameover", () => this.showEnd(
      "TE HAN PILLADO",
      "Tu carrera como médico ha terminado.\nY también la otra.\n\n[R] para reintentar"));
    ev.on("ui:reset", this.reset, this);

    this.input.keyboard.on("keydown-R", () => {
      this.scene.get("GameScene").scene.restart();
    });

    this.events.once("shutdown", () => {
      ev.off("suspicion", this.onSuspicion, this);
      ev.off("inventory", this.onInventory, this);
      ev.off("prompt", this.onPrompt, this);
      ev.off("message", this.onMessage, this);
      ev.off("kills", this.onKills, this);
      ev.removeListener("victory");
      ev.removeListener("gameover");
      ev.off("ui:reset", this.reset, this);
    });
  }

  reset() {
    this.onSuspicion(0);
    this.onInventory([null, null, null, null], 0);
    this.onKills(0, 3);
    this.onPrompt(null);
    this.msgText.setText("");
    this.overlay.setVisible(false);
    this.overlayTitle.setVisible(false);
    this.overlayBody.setVisible(false);
  }

  onSuspicion(v) {
    this.suspicionValue = v;
    const pct = v / SUSPICION.max;
    this.barFill.width = Math.round(62 * pct);
    this.barFill.fillColor =
      pct < 0.5 ? 0x6fd293 : pct < 0.8 ? 0xffd970 : 0xef5d6f;
  }

  onInventory(slots, selected) {
    slots.forEach((itemId, i) => {
      if (this.slotIcons[i]) {
        this.slotIcons[i].destroy();
        this.slotIcons[i] = null;
      }
      if (itemId) {
        this.slotIcons[i] = this.add.image(
          this.slotRects[i].x + 9, this.slotRects[i].y + 9,
          "items", ITEM_DATA[itemId].frame);
      }
      this.slotRects[i].setStrokeStyle(
        i === selected ? 2 : 1,
        i === selected ? 0xffd970 : 0x4a3b5c);
    });
  }

  onPrompt(label) {
    this.promptText.setText(label || "");
  }

  onMessage(text) {
    this.msgText.setText(text);
    if (this.msgTimer) this.msgTimer.remove();
    this.msgTimer = this.time.delayedCall(3500, () => this.msgText.setText(""));
  }

  onKills(n, total) {
    this.killText.setText(`Pacientes: ${n}/${total}`);
  }

  showEnd(title, body) {
    this.overlay.setVisible(true);
    this.overlayTitle.setText(title).setVisible(true);
    this.overlayBody.setText(body).setVisible(true);
  }
}
