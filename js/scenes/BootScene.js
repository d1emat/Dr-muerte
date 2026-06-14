import { UI_W, UI_H, ANIM_ROWS } from "../config.js";
import { title, body, INK } from "../ui/theme.js";
import AudioManager from "../systems/AudioManager.js";

const SHEETS = ["doctor", "nurse", "patient", "inspector"];

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    if (!this.game.music) this.game.music = new AudioManager(this.game);
    this.game.music.preload(this);

    this.drawLoadingScreen();

    this.load.on("progress", (p) => {
      this.barFill.width = Math.round(708 * p);
    });

    this.load.atlas("tiles",
      "assets/tileset/hospital_tileset.png",
      "assets/tileset/hospital_tileset.json");
    this.load.atlas("items", "assets/items/items.png", "assets/items/items.json");
    this.load.image("vignette", "assets/vignette.png");
    for (const s of SHEETS) {
      this.load.spritesheet(s, `assets/characters/${s}.png`,
        { frameWidth: 16, frameHeight: 24 });
    }
  }

  drawLoadingScreen() {
    const g = this.add.graphics();
    // hospital backdrop: mint wall + baseboard + cream checker floor
    g.fillStyle(0xc9f0dd).fillRect(0, 0, UI_W, 480);
    g.fillStyle(0xb49adf).fillRect(0, 440, UI_W, 6);
    g.fillStyle(0x9bdbc1).fillRect(0, 462, UI_W, 18);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < UI_W / 64 + 1; x++) {
        g.fillStyle((x + y) % 2 === 0 ? 0xfdf2e0 : 0xf6e2c8);
        g.fillRect(x * 64, 480 + y * 64, 64, 64);
      }
    }
    // big red cross with soft shadow
    g.fillStyle(0x7a6890, 0.4).fillRect(UI_W / 2 - 20, 78, 48, 128);
    g.fillStyle(0x7a6890, 0.4).fillRect(UI_W / 2 - 60, 118, 128, 48);
    g.fillStyle(0xef5d6f).fillRect(UI_W / 2 - 24, 72, 48, 128);
    g.fillStyle(0xef5d6f).fillRect(UI_W / 2 - 64, 112, 128, 48);

    this.add.text(UI_W / 2 + 4, 294, "FATAL TREATMENT", title(44, "#4a3b5c"))
      .setOrigin(0.5);
    this.add.text(UI_W / 2, 290, "FATAL TREATMENT", title(44))
      .setOrigin(0.5).setStroke(INK, 10);
    this.add.text(UI_W / 2, 348, "Dr. Muerte — turno de noche", body(30))
      .setOrigin(0.5);

    // loading bar (shadow + frame + fill)
    this.add.rectangle(UI_W / 2 + 4, 564 + 5, 720, 28, 0x7a6890).setOrigin(0.5);
    this.add.rectangle(UI_W / 2, 564, 720, 28, 0x4a3b5c).setOrigin(0.5);
    this.barFill = this.add
      .rectangle(UI_W / 2 - 354, 564, 0, 16, 0x6fd293).setOrigin(0, 0.5);
    const loadTxt = this.add.text(UI_W / 2, 604, "preparando el turno…",
      body(26, INK)).setOrigin(0.5);
    this.tweens.add({ targets: loadTxt, alpha: 0.35, duration: 500,
                      yoyo: true, repeat: -1 });
  }

  create() {
    // animations: 8 rows x 4 frames per sheet
    for (const sheet of SHEETS) {
      ANIM_ROWS.forEach((row, i) => {
        this.anims.create({
          key: `${sheet}_${row}`,
          frames: this.anims.generateFrameNumbers(sheet,
            { start: i * 4, end: i * 4 + 3 }),
          frameRate: row.startsWith("idle") ? 6 : 10,
          repeat: -1,
        });
      });
    }

    // soul ghost texture (8x10, ART_STYLE.md: smiling, ghost purple)
    const g = this.add.graphics();
    g.fillStyle(0xb9a8e8);
    g.fillRect(1, 0, 6, 9);
    g.fillRect(0, 1, 8, 7);
    g.fillStyle(0x4a3b5c);
    g.fillRect(2, 3, 1, 2);
    g.fillRect(5, 3, 1, 2);
    g.fillRect(3, 6, 2, 1);
    g.fillStyle(0xfff6ee);
    g.fillRect(2, 1, 1, 1);
    g.generateTexture("soul", 8, 10);
    g.destroy();

    // tutorial guide textures: bouncing arrow + floor ring
    const ga = this.add.graphics();
    ga.fillStyle(0x4a3b5c);
    ga.fillRect(0, 0, 11, 3);
    ga.fillRect(1, 3, 9, 2);
    ga.fillRect(3, 5, 5, 2);
    ga.fillRect(5, 7, 1, 1);
    ga.fillStyle(0xffd970);
    ga.fillRect(1, 1, 9, 1);
    ga.fillRect(2, 2, 7, 2);
    ga.fillRect(4, 4, 3, 2);
    ga.generateTexture("guide_arrow", 11, 8);
    ga.destroy();

    const gr = this.add.graphics();
    gr.lineStyle(2, 0x4a3b5c).strokeCircle(10, 10, 8);
    gr.lineStyle(2, 0xffd970).strokeCircle(10, 10, 7);
    gr.generateTexture("guide_ring", 20, 20);
    gr.destroy();

    // global music singleton
    if (!this.game.music) this.game.music = new AudioManager(this.game);
    this.game.music.create(this);
    this.game.music.playMenuMusic();

    // smooth transition into the menu
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(180, 0x2e, 0x24, 0x38);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("MenuScene"));
    });
  }
}
