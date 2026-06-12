import { VIEW_W, VIEW_H } from "../config.js";

const INK = "#4a3b5c";
const PAPER = "#fff6ee";

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

class EndScene extends Phaser.Scene {
  show({ bg, title, titleColor, lines, stats }) {
    this.cameras.main.setBackgroundColor(bg);
    this.add.text(VIEW_W / 2, 44, title, {
      fontFamily: "monospace", fontSize: "18px", fontStyle: "bold",
      color: titleColor,
    }).setOrigin(0.5).setStroke(INK, 5);
    this.add.text(VIEW_W / 2, 84, lines, {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
      align: "center", lineSpacing: 4,
    }).setOrigin(0.5).setStroke(INK, 3);
    this.add.text(VIEW_W / 2, 122,
      `Pacientes: ${stats.kills}/${stats.total}    Turno: ${fmtTime(stats.timeMs)}`, {
        fontFamily: "monospace", fontSize: "8px", color: "#ffd970",
      }).setOrigin(0.5).setStroke(INK, 3);
    this.add.text(VIEW_W / 2, 156, "[R] reintentar      [ESPACIO] menú", {
      fontFamily: "monospace", fontSize: "8px", color: PAPER,
    }).setOrigin(0.5).setStroke(INK, 3);

    this.input.keyboard.once("keydown-R", () => this.scene.start("GameScene"));
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("MenuScene"));
  }
}

export class GameOverScene extends EndScene {
  constructor() { super("GameOverScene"); }
  create(stats) {
    const caught = stats.cause === "caught";
    this.show({
      bg: "#4a3b5c",
      title: "TE HAN PILLADO",
      titleColor: "#ef5d6f",
      lines: caught
        ? "El inspector te ha alcanzado en pleno pasillo.\nTu carrera como médico ha terminado.\nY también la otra."
        : "Demasiadas 'casualidades' en un solo turno.\nTu carrera como médico ha terminado.\nY también la otra.",
      stats,
    });
  }
}

export class VictoryScene extends EndScene {
  constructor() { super("VictoryScene"); }
  create(stats) {
    this.show({
      bg: "#6fd293",
      title: "MISIÓN CUMPLIDA",
      titleColor: PAPER,
      lines: "El hospital tiene la tasa de mortalidad\nmás alta del país. Nadie sospecha nada.\nLa Muerte ficha y se va a casa.",
      stats,
    });
    const soul = this.add.image(VIEW_W / 2 - 70, 50, "soul").setScale(2);
    this.tweens.add({ targets: soul, y: 38, duration: 1200, yoyo: true,
                      repeat: -1, ease: "Sine.easeInOut" });
  }
}
