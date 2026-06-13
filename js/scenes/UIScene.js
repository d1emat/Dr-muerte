import { UI_W, UI_H, SUSPICION } from "../config.js";
import { title, body, INK, PAPER, YELLOW, GREEN } from "../ui/theme.js";
import { getRunState } from "../systems/RunState.js";

export default class UIScene extends Phaser.Scene {
  constructor() { super("UIScene"); }

  create() {
    this.add.text(32, 22, "SOSPECHAS", title(13)).setStroke(INK, 6);
    this.add.rectangle(36, 52, 260, 26, 0x7a6890).setOrigin(0);
    this.add.rectangle(32, 48, 260, 26, 0x4a3b5c).setOrigin(0);
    this.barFill = this.add.rectangle(36, 52, 0, 18, 0x6fd293).setOrigin(0);

    // XP bar beneath suspicion
    this.add.text(32, 82, "XP", title(11)).setStroke(INK, 5);
    this.add.rectangle(36, 104, 160, 14, 0x7a6890).setOrigin(0);
    this.add.rectangle(32, 100, 160, 14, 0x4a3b5c).setOrigin(0);
    this.xpFill = this.add.rectangle(36, 104, 0, 10, 0xb9a8e8).setOrigin(0);
    this.xpText = this.add.text(200, 100, "0", body(20, PAPER)).setOrigin(0, 0.5)
      .setStroke(INK, 4);

    this.killText = this.add.text(UI_W - 32, 22, "Pacientes: 0/3", title(13))
      .setOrigin(1, 0).setStroke(INK, 6);
    this.levelText = this.add.text(UI_W - 32, 50, "", body(24, PAPER))
      .setOrigin(1, 0).setStroke(INK, 5);
    this.roomText = this.add.text(UI_W - 32, 78, "", body(22, YELLOW))
      .setOrigin(1, 0).setStroke(INK, 4);

    // minimap (top-right corner)
    const mmW = 100, mmH = 70;
    const mmX = UI_W - 32 - mmW;
    this.add.rectangle(mmX + 3, 118 + 3, mmW, mmH, 0x7a6890, 0.6).setOrigin(0);
    this.minimapBg = this.add.rectangle(mmX, 118, mmW, mmH, 0x4a3b5c, 0.85)
      .setOrigin(0).setStrokeStyle(1, 0xfff6ee, 0.5);
    this.minimapDot = this.add.rectangle(mmX + mmW / 2, 118 + mmH / 2, 5, 5, 0xffd970)
      .setOrigin(0.5);
    this.minimapSize = { w: mmW, h: mmH, x: mmX, y: 118 };

    this.tutBg = this.add.rectangle(UI_W / 2, 44, 760, 56, 0x4a3b5c, 0.85)
      .setStrokeStyle(2, 0xfff6ee, 0.6).setVisible(false);
    this.tutText = this.add.text(UI_W / 2, 44, "", {
      ...body(26, YELLOW), align: "center", wordWrap: { width: 720 },
    }).setOrigin(0.5);

    this.promptText = this.add.text(UI_W / 2, UI_H - 118, "", body(30, YELLOW))
      .setOrigin(0.5).setStroke(INK, 6);

    this.msgBg = this.add.rectangle(UI_W / 2, UI_H - 46, 880, 58, 0x4a3b5c, 0.88)
      .setStrokeStyle(2, 0xfff6ee, 0.6).setVisible(false);
    this.msgText = this.add.text(UI_W / 2, UI_H - 46, "", {
      ...body(28, PAPER), align: "center", wordWrap: { width: 840 },
    }).setOrigin(0.5);
    this.msgTimer = null;

    const ev = this.game.events;
    this._handlers = {
      suspicion: (v) => this.onSuspicion(v),
      xp: (v) => this.onXp(v),
      "xp-gain": (d) => this.onXpGain(d),
      prompt: (l) => this.onPrompt(l),
      message: (t) => this.onMessage(t),
      kills: (n, t) => this.onKills(n, t),
      tutorial: (t) => this.onTutorial(t),
      "level-info": (i) => this.onLevelInfo(i),
      minimap: (d) => this.onMinimap(d),
      "ui:reset": () => this.reset(),
    };
    for (const [e, fn] of Object.entries(this._handlers)) {
      ev.on(e, fn);
    }

    this.events.once("shutdown", () => {
      for (const [e, fn] of Object.entries(this._handlers)) {
        ev.off(e, fn);
      }
    });

    this.reset();
    this.game.events.emit("ui:ready");
  }

  reset() {
    this.onSuspicion(0);
    this.onXp(getRunState(this.game).xp);
    this.onKills(0, 3);
    this.onPrompt(null);
    this.onTutorial(null);
    this.levelText.setText("");
    this.roomText.setText("");
    this.msgText.setText("");
    this.msgBg.setVisible(false);
  }

  onLevelInfo({ id, name, floor, room }) {
    this.levelText.setText(`Nivel ${id} · ${name}`);
    const parts = [];
    if (floor) parts.push(`Planta ${floor}`);
    if (room) parts.push(room);
    this.roomText.setText(parts.join(" · "));
  }

  onMinimap({ playerX, playerY, worldW, worldH }) {
    const { w, h, x, y } = this.minimapSize;
    const px = x + (playerX / worldW) * w;
    const py = y + (playerY / worldH) * h;
    this.minimapDot.setPosition(px, py);
  }

  onXp(v) {
    const pct = Math.min(1, v / 100);
    this.xpFill.width = Math.round(152 * pct);
    this.xpText.setText(String(v));
  }

  onXpGain({ amount }) {
    const t = this.add.text(200, 88, `+${amount}`, body(22, GREEN))
      .setStroke(INK, 4);
    this.tweens.add({
      targets: t, y: 70, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  onTutorial(text) {
    this.tutText.setText(text || "");
    this.tutBg.setVisible(!!text);
  }

  onSuspicion(v) {
    const pct = v / SUSPICION.max;
    this.barFill.width = Math.round(252 * pct);
    this.barFill.fillColor =
      pct < 0.5 ? 0x6fd293 : pct < 0.8 ? 0xffd970 : 0xef5d6f;
    if (pct >= 0.7 && !this.barPulse) {
      this.barPulse = this.tweens.add({
        targets: this.barFill, alpha: 0.35, duration: 280,
        yoyo: true, repeat: -1,
      });
    } else if (pct < 0.7 && this.barPulse) {
      this.barPulse.stop();
      this.barPulse = null;
      this.barFill.setAlpha(1);
    }
  }

  onPrompt(label) {
    this.promptText.setText(label || "");
  }

  onMessage(text) {
    this.msgText.setText(text);
    this.msgBg.setVisible(true);
    this.msgBg.setAlpha(0);
    this.msgText.setAlpha(0);
    this.tweens.add({ targets: [this.msgBg, this.msgText], alpha: 1,
                      duration: 150 });
    if (this.msgTimer) this.msgTimer.remove();
    this.msgTimer = this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: [this.msgBg, this.msgText], alpha: 0, duration: 300,
        onComplete: () => {
          this.msgText.setText("");
          this.msgBg.setVisible(false);
          this.msgText.setAlpha(1);
          this.msgBg.setAlpha(1);
        },
      });
    });
  }

  onKills(n, total) {
    this.killText.setVisible(total > 0);
    this.killText.setText(`Pacientes: ${n}/${total}`);
  }
}
