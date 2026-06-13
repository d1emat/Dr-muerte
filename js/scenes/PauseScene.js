import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, PAPER, INK } from "../ui/theme.js";
import { createSettingsPanel } from "../ui/SettingsPanel.js";

export default class PauseScene extends Phaser.Scene {
  constructor() { super("PauseScene"); }

  create() {
    this.scene.bringToTop();
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0.55)");

    const CX = UI_W / 2, CY = UI_H / 2;

    this.pausePanel = this.add.container(0, 0).setDepth(5000);
    const bg = this.add.rectangle(CX, CY, 520, 500, 0x2e2438, 0.97)
      .setStrokeStyle(4, 0x4a3b5c);
    const titleTxt = this.add.text(CX, CY - 200, "PAUSA", title(42, PAPER))
      .setOrigin(0.5).setStroke(INK, 10);
    const hintTxt = this.add.text(CX, CY - 148, "ESC para continuar",
      body(22, "#cfc6d9")).setOrigin(0.5);

    const btnW = 300, btnH = 52, gap = 16;
    const firstY = CY - 70;

    const continueBtn = makeButton(this, CX, firstY, btnW, btnH,
      "CONTINUAR", () => this.resumeGame());
    const journalBtn = makeButton(this, CX, firstY + btnH + gap, btnW, btnH,
      "CUADERNO", () => this.openJournal());
    const settingsBtn = makeButton(this, CX, firstY + (btnH + gap) * 2, btnW, btnH,
      "AJUSTES", () => this.settings.toggle(true));
    const menuBtn = makeButton(this, CX, firstY + (btnH + gap) * 3, btnW, btnH,
      "MENÚ", () => this.goToMenu());

    this.pausePanel.add([
      bg, titleTxt, hintTxt,
      continueBtn.shadow, continueBtn.bg, continueBtn.txt,
      journalBtn.shadow, journalBtn.bg, journalBtn.txt,
      settingsBtn.shadow, settingsBtn.bg, settingsBtn.txt,
      menuBtn.shadow, menuBtn.bg, menuBtn.txt,
    ]);

    this.settings = createSettingsPanel(this, {
      depth: 6000,
      onClose: () => this.settings.toggle(false),
    });

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.settings.panel.visible) this.settings.toggle(false);
      else this.resumeGame();
    });
    this.input.keyboard.on("keydown-J", () => this.openJournal());
    this.input.keyboard.once("keydown-M", () => this.resumeGame());
  }

  openJournal() {
    if (this.settings.panel.visible) this.settings.toggle(false);
    this.scene.launch("JournalScene", { resume: "PauseScene" });
    this.scene.pause();
  }

  resumeGame() {
    if (this.settings.panel.visible) {
      this.settings.toggle(false);
      return;
    }
    if (this.scene.isPaused("PauseScene")) this.scene.resume();
    if (this.scene.isPaused("GameScene")) this.scene.resume("GameScene");
    if (this.scene.isPaused("TutorialScene")) this.scene.resume("TutorialScene");
    this.scene.stop();
  }

  goToMenu() {
    if (this.scene.isPaused("GameScene")) this.scene.stop("GameScene");
    if (this.scene.isPaused("TutorialScene")) this.scene.stop("TutorialScene");
    if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
    this.scene.stop();
    this.scene.start("MenuScene");
  }
}
