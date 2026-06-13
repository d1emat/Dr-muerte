import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, PAPER, YELLOW, GREEN, RED }
  from "../ui/theme.js";
import { getRunState, spendRunXp } from "../systems/RunState.js";
import { pickUpgrades } from "../systems/Upgrades.js";

/** Upgrade shop — shown every 3 completed levels. */
export default class ShopScene extends Phaser.Scene {
  constructor() { super("ShopScene"); }

  create(data) {
    this.nextLevelId = data.nextLevelId;
    this.leaving = false;
    const rs = getRunState(this.game);

    this.cameras.main.setBackgroundColor("#dcc8f2");
    this.cameras.main.fadeIn(400, 0x2e, 0x24, 0x38);

    this.add.text(UI_W / 2, 56, "TIENDA DE MEJORAS", title(28))
      .setOrigin(0.5).setStroke(INK, 8);
    this.add.text(UI_W / 2, 108,
      `XP disponible: ${rs.xp}  (total ganado: ${rs.totalEarned})`,
      body(30, YELLOW)).setOrigin(0.5).setStroke(INK, 5);

    this.offers = pickUpgrades(rs.upgrades.ownedIds, 3);
    this.cards = [];
    const cardW = 340, gap = 40;
    const startX = (UI_W - (this.offers.length * cardW + (this.offers.length - 1) * gap)) / 2
      + cardW / 2;

    this.offers.forEach((up, i) => {
      const cx = startX + i * (cardW + gap);
      this.makeOfferCard(cx, 340, up, rs);
    });

    makeButton(this, UI_W / 2 - 160, UI_H - 80, 280, 56, "CONTINUAR",
      () => this.continueRun());
    makeButton(this, UI_W / 2 + 160, UI_H - 80, 280, 56, "SALTAR",
      () => this.continueRun());

    this.add.text(UI_W / 2, UI_H - 28,
      "Compra una mejora o continúa sin comprar",
      body(22, INK)).setOrigin(0.5);

    this.game.music.bindKeys(this);
    this.game.music.playMenuMusic();
    this.input.keyboard.on("keydown-ESC", () => this.continueRun());
  }

  makeOfferCard(cx, cy, up, rs) {
    const owned = rs.upgrades.has(up.id);
    const canAfford = rs.xp >= up.cost;
    const h = 360;

    this.add.rectangle(cx + 4, cy + 5, 320, h, 0x7a6890).setOrigin(0.5);
    const card = this.add.rectangle(cx, cy, 320, h, owned ? 0xcfc6d9 : PAPER)
      .setOrigin(0.5).setStrokeStyle(3, INK);

    this.add.text(cx, cy - 140, up.icon || "?", title(36)).setOrigin(0.5);
    this.add.text(cx, cy - 88, up.name, {
      ...body(26, INK), align: "center", wordWrap: { width: 280 },
    }).setOrigin(0.5);
    this.add.text(cx, cy - 20, up.desc, {
      ...body(22, "#7a6890"), align: "center", wordWrap: { width: 280 },
    }).setOrigin(0.5);
    this.add.text(cx, cy + 60, `${up.cost} XP`, body(28, canAfford ? GREEN : RED))
      .setOrigin(0.5);

    if (owned) {
      this.add.text(cx, cy + 120, "Ya adquirida", body(24, "#7a6890")).setOrigin(0.5);
    } else if (up.uses) {
      this.add.text(cx, cy + 100, `Usos: ${up.uses}`, body(20, INK)).setOrigin(0.5);
      makeButton(this, cx, cy + 140, 240, 48, "COMPRAR",
        () => this.buy(up));
    } else {
      makeButton(this, cx, cy + 130, 240, 48, "COMPRAR",
        () => this.buy(up));
    }
    void card;
  }

  buy(up) {
    const rs = getRunState(this.game);
    if (rs.upgrades.has(up.id)) return;
    if (!spendRunXp(this.game, up.cost)) {
      this.game.music.sfx("damage");
      this.cameras.main.shake(80, 0.002);
      return;
    }
    if (up.uses) rs.upgrades.addActive(up);
    else rs.upgrades.addPassive(up);
    this.game.music.sfx("confirm");
    this.scene.restart({ nextLevelId: this.nextLevelId });
  }

  continueRun() {
    if (this.leaving) return;
    this.leaving = true;
    this.game.music.sfx("confirm");
    this.cameras.main.fadeOut(350, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("NewspaperScene", { nextLevelId: this.nextLevelId, fromShop: true });
    });
  }
}
