import NPC from "./NPC.js";

export default class Patient extends NPC {
  constructor(scene, def) {
    super(scene, def.x, def.y, "patient", def.route,
          { speed: 18, pauseMs: 2600 });
    this.displayName = def.name;
    this.dead = false;
  }

  update(time, delta) {
    if (this.dead) return;            // corpses don't idle
    super.update(time, delta);
  }

  die(message) {
    if (this.dead) return;
    this.dead = true;
    this.halted = true;
    this.body.enable = false;
    this.anims.stop();
    this.setFrame(0);
    // lie down, fade to ghost-gray
    this.setOrigin(0.5, 0.5);
    this.y -= 10;
    this.setAngle(-90);
    this.setTint(0xcfc6d9);
    this.setDepth(this.y - 20);

    // the smiling soul floats up (the whole tone of the game)
    const soul = this.scene.add.image(this.x, this.y - 8, "soul")
      .setDepth(5000);
    this.scene.tweens.add({
      targets: soul, y: soul.y - 28, alpha: 0,
      duration: 2200, ease: "Sine.easeOut",
      onComplete: () => soul.destroy(),
    });

    this.scene.game.events.emit("message", message);
    this.scene.events.emit("patient-died", this);
  }
}
