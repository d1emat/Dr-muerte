import { VIEW_W, VIEW_H } from "../config.js";

const INK = "#4a3b5c";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9f0dd");

    this.add.text(VIEW_W / 2, 34, "DR. MUERTE", {
      fontFamily: "monospace", fontSize: "24px", fontStyle: "bold",
      color: "#fff6ee",
    }).setOrigin(0.5).setStroke(INK, 5);
    this.add.text(VIEW_W / 2, 52, "turno de noche en el Hospital Pastelito", {
      fontFamily: "monospace", fontSize: "8px", color: INK,
    }).setOrigin(0.5);

    // the doctor, looking perfectly trustworthy
    const doc = this.add.sprite(VIEW_W / 2, 100, "doctor").setScale(3);
    doc.play("doctor_idle_down");
    const soul = this.add.image(VIEW_W / 2 + 28, 84, "soul").setScale(2);
    this.tweens.add({
      targets: soul, y: 74, alpha: 0.4,
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.add.text(VIEW_W / 2, 130,
      "WASD mover   E interactuar   1-4 inventario", {
        fontFamily: "monospace", fontSize: "8px", color: INK,
      }).setOrigin(0.5);
    this.add.text(VIEW_W / 2, 142,
      "Elimina 3 pacientes. Que nadie te vea hacerlo.", {
        fontFamily: "monospace", fontSize: "8px", color: "#ef5d6f",
      }).setOrigin(0.5);

    const go = this.add.text(VIEW_W / 2, 162, "[ ESPACIO para empezar ]", {
      fontFamily: "monospace", fontSize: "9px", color: "#fff6ee",
    }).setOrigin(0.5).setStroke(INK, 3);
    this.tweens.add({ targets: go, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("GameScene"));
  }
}
