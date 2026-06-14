import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, PAPER, YELLOW, RED, GREEN }
  from "../ui/theme.js";
import { completeLevel } from "../systems/Progress.js";
import { shouldShowShop, avgSuspicion, favoriteCombo, getRunState }
  from "../systems/RunState.js";
import { COMBOS } from "../data/medical.js";
import MenuNav from "../ui/MenuNav.js";

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function starRating(stats) {
  const susp = stats.avgSuspicion || 0;
  const timeBonus = stats.timeMs < 180000;
  if (susp < 20 && timeBonus) return 3;
  if (susp < 50) return 2;
  return 1;
}

function humorLine(stats, stars) {
  if (stars >= 3) return "Muerte natural. Nadie sospecha. Ni un alma protesta.";
  if (stars === 2) return "Algunas 'coincidencias', pero nada que no se pueda archivar.";
  return "Has dejado huella. La funeraria te envía un catálogo.";
}

class EndScene extends Phaser.Scene {
  goRestart() { this.fadeTo("GameScene", { levelId: this.stats.levelId }); }
  goNext() { this.routeNext(); }
  goMenu() { this.fadeTo("MenuScene"); }

  routeNext() {
    const nextId = this.nextId;
    if (!nextId) { this.goMenu(); return; }
    if (shouldShowShop(this.stats.levelId)) {
      this.fadeTo("ShopScene", { nextLevelId: nextId });
    } else {
      this.fadeTo("NewspaperScene", {
        nextLevelId: nextId, levelName: this.stats.levelName,
      });
    }
  }

  fadeTo(key, data) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(180, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start(key, data));
  }

  show({ bg, titleText, titleColor, lines, stats, nextId = null, extraLines = "" }) {
    this.leaving = false;
    this.stats = stats;
    this.nextId = nextId;
    this.cameras.main.setBackgroundColor(bg);
    this.cameras.main.fadeIn(180, 0x2e, 0x24, 0x38);

    const stars = starRating(stats);
    const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);

    const t = this.add.text(UI_W / 2, 110, titleText, title(28, titleColor))
      .setOrigin(0.5).setStroke(INK, 10).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 550, ease: "Back.easeOut" });

    this.add.text(UI_W / 2, 168, starStr, title(24, YELLOW))
      .setOrigin(0.5).setStroke(INK, 6);

    const bodyTxt = this.add.text(UI_W / 2, 248, lines, {
      ...body(28, PAPER), align: "center", lineSpacing: 10,
    }).setOrigin(0.5).setStroke(INK, 6).setAlpha(0);
    this.tweens.add({ targets: bodyTxt, alpha: 1, duration: 600, delay: 300 });

    const rs = stats.runStats || {};
    const favId = favoriteCombo(this.game);
    const favName = favId
      ? (COMBOS.find((c) => c.id === favId)?.name || favId) : "—";
    const statBlock =
      `Nivel ${stats.levelId} · ${stats.kills}/${stats.total} pacientes` +
      ` · Turno: ${fmtTime(stats.timeMs)}\n` +
      `XP: ${stats.xp || 0} · Sospechas finales: ${Math.round(stats.avgSuspicion || 0)}\n` +
      `Combo favorito: ${favName}` +
      (rs.fastestKillMs ? ` · Kill más rápido: ${fmtTime(rs.fastestKillMs)}` : "") +
      (extraLines ? `\n${extraLines}` : "");

    this.add.text(UI_W / 2, 360, statBlock, {
      ...body(24, YELLOW), align: "center", lineSpacing: 6,
    }).setOrigin(0.5).setStroke(INK, 5);

    this.add.text(UI_W / 2, 440, humorLine(stats, stars),
      body(22, PAPER)).setOrigin(0.5).setStroke(INK, 4).setAlpha(0.85);

    const nav = new MenuNav(this);
    if (nextId) {
      nav.add(makeButton(this, UI_W / 2 - 300, 510, 250, 56, "SIGUIENTE", () => this.goNext()));
      nav.add(makeButton(this, UI_W / 2, 510, 250, 56, "REINTENTAR", () => this.goRestart()));
      nav.add(makeButton(this, UI_W / 2 + 300, 510, 250, 56, "MENÚ", () => this.goMenu()));
      this.input.keyboard.once("keydown-SPACE", () => this.goNext());
      this.input.keyboard.once("keydown-ESC", () => this.goMenu());
    } else {
      nav.add(makeButton(this, UI_W / 2 - 150, 510, 260, 56, "REINTENTAR", () => this.goRestart()));
      nav.add(makeButton(this, UI_W / 2 + 150, 510, 260, 56, "MENÚ", () => this.goMenu()));
      this.input.keyboard.once("keydown-SPACE", () => this.goMenu());
    }
    this.input.keyboard.once("keydown-R", () => this.goRestart());
    this.game.music.bindKeys(this);
  }
}

export class GameOverScene extends EndScene {
  constructor() { super("GameOverScene"); }

  create(stats) {
    this.game.music.stopMusic();
    this.game.music.playBackgroundMusic(false, 0.25);
    const caught = stats.cause === "caught";
    const avg = avgSuspicion(this.game);
    const lines = caught
      ? "El inspector te ha alcanzado en pleno pasillo.\nTu otra carrera también ha terminado."
      : "Demasiadas 'casualidades' en un solo turno.\nLa funeraria ya no te devuelve las llamadas.";
    this.show({
      bg: "#4a3b5c",
      titleText: "MEDICAL LICENSE REVOKED",
      titleColor: RED,
      lines,
      stats: { ...stats, avgSuspicion: avg },
      extraLines: `Partida: ${stats.runStats?.totalKills || 0} kills · ` +
        `${stats.xp || 0} XP acumulados`,
    });
    const insp = this.add.sprite(UI_W / 2, UI_H + 80, "inspector").setScale(7);
    insp.play("inspector_idle_down");
    this.tweens.add({ targets: insp, y: UI_H - 64, duration: 700,
                      ease: "Sine.easeOut", delay: 200 });
    this.cameras.main.flash(250, 239, 93, 111);
  }
}

export class VictoryScene extends EndScene {
  constructor() { super("VictoryScene"); }

  create(stats) {
    this.game.music.stopMusic();
    this.game.music.playBackgroundMusic(false, 0.25);
    const nextId = completeLevel(stats.levelId, stats);
    const lines = nextId
      ? `All patients have been successfully 'treated'.\n` +
        `Has superado ${stats.levelName}.\n` +
        (shouldShowShop(stats.levelId)
          ? "Tienda de mejoras disponible. Elige con cabeza."
          : "Siguiente hospital desbloqueado.")
      : "All patients have been successfully 'treated'.\n" +
        "Has limpiado TODOS los hospitales del país.\nLa Muerte se jubila. Por ahora.";
    this.show({
      bg: "#6fd293",
      titleText: nextId ? "DEATH CERTIFICATES COMPLETED" : "CARRERA LEGENDARIA",
      titleColor: PAPER,
      lines,
      stats,
      nextId,
    });
    for (let i = 0; i < 6; i++) {
      const soul = this.add.image(
        100 + Math.random() * (UI_W - 200), UI_H + 40, "soul")
        .setScale(4 + Math.random() * 3).setAlpha(0.9);
      this.tweens.add({
        targets: soul, y: -60, x: soul.x + Phaser.Math.Between(-80, 80),
        duration: 4000 + Math.random() * 3000, delay: i * 600,
        repeat: -1, ease: "Sine.easeInOut",
      });
    }
    const doc = this.add.sprite(UI_W / 2, UI_H - 70, "doctor").setScale(7);
    doc.play("doctor_idle_down");
  }
}
