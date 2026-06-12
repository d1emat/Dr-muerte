import { ANIM_ROWS } from "../config.js";

const SHEETS = ["doctor", "nurse", "patient", "inspector"];

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    this.load.atlas("tiles",
      "assets/tileset/hospital_tileset.png",
      "assets/tileset/hospital_tileset.json");
    this.load.atlas("items", "assets/items/items.png", "assets/items/items.json");
    for (const s of SHEETS) {
      this.load.spritesheet(s, `assets/characters/${s}.png`,
        { frameWidth: 16, frameHeight: 24 });
    }
  }

  create() {
    // animations: 8 rows x 4 frames per sheet
    for (const sheet of SHEETS) {
      ANIM_ROWS.forEach((row, i) => {
        this.anims.create({
          key: `${sheet}_${row}`,
          frames: this.anims.generateFrameNumbers(sheet,
            { start: i * 4, end: i * 4 + 3 }),
          frameRate: row.startsWith("idle") ? 6 : 8,
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
    g.fillRect(2, 3, 1, 2);   // eyes
    g.fillRect(5, 3, 1, 2);
    g.fillRect(3, 6, 2, 1);   // smile
    g.fillStyle(0xfff6ee);
    g.fillRect(2, 1, 1, 1);   // shine
    g.generateTexture("soul", 8, 10);
    g.destroy();

    this.scene.start("GameScene");
  }
}
