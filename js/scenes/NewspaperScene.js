import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, PAPER } from "../ui/theme.js";
import { getRunState } from "../systems/RunState.js";

const HEADLINES = {
  clean: [
    "DOCTOR DEL AÑO: NI UNA QUEJA EN EL TURNO",
    "HOSPITAL PASTELITO: MORTALIDAD 'NORMAL'",
    "PACIENTES SATISFECHOS… HASTA EL FINAL",
  ],
  suspicious: [
    "MISTERIOSO BROTE DE 'ACCIDENTES' EN CLÍNICA LOCAL",
    "ENFERMERAS SOSPECHAN DE 'COINCIDENCIAS' MÉDICAS",
    "INSPECTOR: 'ALGO NO CUADRA EN URGENCIAS'",
  ],
  bloody: [
    "BROTE DE MUERTES 'NATURALES' ALARMA AL BARRIO",
    "¿NEGLIGENCIA O DESTINO? EL DEBATE SIGUE",
    "FUNERARIAS REPORTAN AUMENTO DE PEDIDOS",
  ],
};

function pickHeadline(stats, levelName) {
  const avg = stats.suspicionSamples > 0
    ? stats.suspicionSum / stats.suspicionSamples : 0;
  const pool = avg < 25 ? HEADLINES.clean
    : avg < 50 ? HEADLINES.suspicious : HEADLINES.bloody;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return `${line}\n— Tras ${levelName}`;
}

export default class NewspaperScene extends Phaser.Scene {
  constructor() { super("NewspaperScene"); }

  create(data) {
    this.nextLevelId = data.nextLevelId;
    this.leaving = false;
    const rs = getRunState(this.game);
    const headline = data.headline
      || pickHeadline(rs.stats, data.levelName || "el hospital");

    this.cameras.main.setBackgroundColor("#f6e2c8");
    this.cameras.main.fadeIn(400, 0x2e, 0x24, 0x38);

    // newspaper panel
    this.add.rectangle(UI_W / 2 + 6, UI_H / 2 + 8, 720, 520, 0x7a6890).setOrigin(0.5);
    this.add.rectangle(UI_W / 2, UI_H / 2, 720, 520, 0xfff6ee).setOrigin(0.5)
      .setStrokeStyle(3, INK);

    this.add.text(UI_W / 2, UI_H / 2 - 210, "EL PASTELITO DIARIO", title(22, INK))
      .setOrigin(0.5);
    this.add.text(UI_W / 2, UI_H / 2 - 170, "Edición especial · turno de noche",
      body(24, "#7a6890")).setOrigin(0.5);

    this.add.text(UI_W / 2, UI_H / 2 - 60, headline, {
      ...title(18, INK), align: "center", wordWrap: { width: 640 }, lineSpacing: 12,
    }).setOrigin(0.5);

    const sub = rs.stats.totalKills > 0
      ? `Pacientes fallecidos esta noche: ${rs.stats.totalKills}. ` +
        `La dirección no ha querido hacer comentarios.`
      : "Una noche tranquila en urgencias. Por ahora.";
    this.add.text(UI_W / 2, UI_H / 2 + 80, sub, {
      ...body(28, INK), align: "center", wordWrap: { width: 620 }, lineSpacing: 8,
    }).setOrigin(0.5);

    makeButton(this, UI_W / 2, UI_H / 2 + 200, 300, 56, "SIGUIENTE",
      () => this.continueRun());

    this.add.text(UI_W / 2, UI_H - 40, "ESPACIO para continuar",
      body(22, PAPER)).setOrigin(0.5).setStroke(INK, 4);

    this.input.keyboard.once("keydown-SPACE", () => this.continueRun());
    this.game.music.bindKeys(this);
  }

  continueRun() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { levelId: this.nextLevelId });
    });
  }
}
