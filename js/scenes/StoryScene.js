import { UI_W, UI_H } from "../config.js";
import { title, body, INK, PAPER, YELLOW } from "../ui/theme.js";

// ----------------------------------------------------------------- helpers
// All actor helpers add their objects to `layer` (a container wiped each beat).

function souls(scene, layer, n, dir = -1) {
  for (let i = 0; i < n; i++) {
    const x = Phaser.Math.Between(150, UI_W - 150);
    const y = Phaser.Math.Between(150, 360);
    const s = scene.add.image(x, y, "soul")
      .setScale(5 + Math.random() * 4).setAlpha(0.9).setDepth(6);
    layer.add(s);
    scene.tweens.add({
      targets: s, y: y + dir * (240 + Math.random() * 160),
      x: x + Phaser.Math.Between(-70, 70), alpha: 0,
      duration: 3600 + Math.random() * 2600, delay: i * 240,
      repeat: -1, ease: "Sine.easeInOut",
    });
  }
}

function deathFigure(scene, layer, x, y) {
  const g = scene.add.graphics().setDepth(8);
  g.fillStyle(0x2a2140, 1);
  g.fillRoundedRect(x - 46, y - 150, 92, 210, { tl: 46, tr: 46, bl: 8, br: 8 });
  g.fillStyle(0x140f20, 1);
  g.fillEllipse(x, y - 108, 68, 76);            // hood shadow
  g.fillStyle(0xef5d6f, 1);
  g.fillRect(x - 17, y - 116, 9, 9);            // glowing eyes
  g.fillRect(x + 8, y - 116, 9, 9);
  layer.add(g);
  scene.tweens.add({ targets: g, y: "+=8", duration: 1700,
                     yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return g;
}

function scythe(scene, layer, x, y) {
  const g = scene.add.graphics().setDepth(9);
  g.lineStyle(9, 0x6b5b8a, 1);
  g.beginPath(); g.moveTo(x, y - 190); g.lineTo(x, y + 70); g.strokePath();
  g.lineStyle(11, 0xcfc6d9, 1);
  g.beginPath(); g.arc(x, y - 190, 78, Math.PI, Math.PI * 1.72, false); g.strokePath();
  layer.add(g);
  return g;
}

function actor(scene, layer, x, y, sheet, anim, scale = 9) {
  const s = scene.add.sprite(x, y, sheet).setScale(scale).setDepth(10);
  if (scene.anims.exists(anim)) s.play(anim);
  layer.add(s);
  return s;
}

function bigText(scene, layer, x, y, text, style) {
  const t = scene.add.text(x, y, text, style).setOrigin(0.5).setDepth(12)
    .setStroke(INK, 8).setAlpha(0);
  layer.add(t);
  scene.tweens.add({ targets: t, alpha: 1, duration: 600, delay: 250 });
  return t;
}

function healGlow(scene, layer, x, y) {
  const ring = scene.add.circle(x, y, 24, 0x6fd293, 0.5).setDepth(7);
  layer.add(ring);
  scene.tweens.add({ targets: ring, scale: 6, alpha: 0, duration: 1400,
                     repeat: -1, ease: "Sine.easeOut" });
}

// ----------------------------------------------------------------- scripts
// Each beat: { bg, text, build?(scene, layer) }.
const SCRIPTS = {
  intro: [
    { bg: "#15101f",
      text: "Durante milenios, la Muerte llegaba al final. Esperaba fuera de la " +
            "habitación, paciente, hasta que un cuerpo terminaba su tiempo.",
      build: (s, l) => { deathFigure(s, l, UI_W / 2, 360); scythe(s, l, UI_W / 2 + 90, 360); souls(s, l, 2, -1); } },
    { bg: "#15101f",
      text: "Entonces los humanos inventaron los HOSPITALES. Y empezaron a " +
            "robarle almas que ya eran suyas.",
      build: (s, l) => { deathFigure(s, l, UI_W / 2 - 30, 360); souls(s, l, 6, -1); } },
    { bg: "#c9f0dd",
      text: "Batas blancas. Juramentos. «Primero, no hacer daño.» Cada año, " +
            "los médicos le quitaban más trabajo.",
      build: (s, l) => { hospitalWall(s, l); actor(s, l, UI_W / 2, 430, "doctor", "doctor_idle_down"); souls(s, l, 4, -1); } },
    { bg: "#15101f",
      text: "Así que leyó ese juramento… del revés. «Si no puedes vencerlos, " +
            "hazte pasar por uno de ellos.»",
      build: (s, l) => {
        const sc = scythe(s, l, UI_W / 2, 380);
        s.tweens.add({ targets: sc, alpha: 0, y: "-=40", duration: 1400, ease: "Sine.easeIn" });
        const clip = s.add.image(UI_W / 2, 360, "items", "clipboard").setScale(9).setDepth(11).setAlpha(0);
        l.add(clip);
        s.tweens.add({ targets: clip, alpha: 1, scale: 11, duration: 1200, delay: 700, ease: "Back.easeOut" });
      } },
    { bg: "#c9f0dd",
      text: "Se pone la bata, firma como Dr. Mortis y empieza su turno. Que cada " +
            "muerte parezca natural. Nadie sospecha del que ayuda.",
      build: (s, l) => {
        hospitalWall(s, l);
        actor(s, l, UI_W / 2, 430, "doctor", "doctor_idle_down");
        bigText(s, l, UI_W / 2, 170, "Dr. MUERTE", title(46, PAPER));
        bigText(s, l, UI_W / 2, 230, "turno de noche", body(30, YELLOW));
      } },
  ],

  finale: [
    { bg: "#4a3b5c",
      text: "Ocho hospitales. Ocho turnos perfectos. La guerra que empezó con la " +
            "penicilina, por fin, ganada.",
      build: (s, l) => { actor(s, l, UI_W / 2, 440, "doctor", "doctor_idle_down"); souls(s, l, 7, -1); } },
    { bg: "#4a3b5c",
      text: "Y, sin embargo, esa última noche, la Muerte se quedó mirando un " +
            "historial clínico más tiempo del necesario.",
      build: (s, l) => {
        actor(s, l, UI_W / 2 - 80, 440, "doctor", "doctor_idle_right");
        const clip = s.add.image(UI_W / 2 + 70, 380, "items", "patient_records").setScale(9).setDepth(11);
        l.add(clip);
        s.tweens.add({ targets: clip, y: "-=10", duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      } },
    { bg: "#c9f0dd",
      text: "De tanto fingir, había aprendido de verdad. A leer las alergias. A " +
            "medir las dosis. A… mirar al paciente.",
      build: (s, l) => {
        hospitalWall(s, l);
        actor(s, l, UI_W / 2 - 120, 440, "doctor", "doctor_idle_right");
        actor(s, l, UI_W / 2 + 120, 440, "patient", "patient_idle_left");
      } },
    { bg: "#c9f0dd",
      text: "La mano que firmaba certificados de defunción tembló… y, por una vez, " +
            "curó.",
      build: (s, l) => {
        hospitalWall(s, l);
        healGlow(s, l, UI_W / 2 + 120, 420);
        actor(s, l, UI_W / 2 - 120, 440, "doctor", "doctor_idle_right");
        const p = actor(s, l, UI_W / 2 + 120, 440, "patient", "patient_idle_down");
        s.tweens.add({ targets: p, y: "-=14", scale: 9.5, duration: 900, ease: "Back.easeOut" });
      } },
    { bg: "#15101f",
      text: "La Muerte había aprendido a curar. El reverso del reverso.",
      build: (s, l) => {
        actor(s, l, UI_W / 2, 430, "doctor", "doctor_idle_down");
        // a soul that descends — returning to life instead of leaving
        const soul = s.add.image(UI_W / 2 + 70, 180, "soul").setScale(7).setDepth(6);
        l.add(soul);
        s.tweens.add({ targets: soul, y: 380, alpha: 0.2, duration: 2600, repeat: -1, ease: "Sine.easeInOut" });
        bigText(s, l, UI_W / 2, 150, "FIN", title(54, YELLOW));
      } },
  ],
};

function hospitalWall(scene, layer) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0xb7e7d3, 1).fillRect(0, 0, UI_W, 470);
  g.fillStyle(0xb49adf, 1).fillRect(0, 462, UI_W, 6);
  g.fillStyle(0x9bdbc1, 1).fillRect(0, 468, UI_W, UI_H - 468);
  // red cross emblem
  g.fillStyle(0xef5d6f, 1);
  g.fillRect(UI_W / 2 - 16, 70, 32, 96);
  g.fillRect(UI_W / 2 - 48, 102, 96, 32);
  layer.add(g);
}

// ----------------------------------------------------------------- scene
export default class StoryScene extends Phaser.Scene {
  constructor() { super("StoryScene"); }

  create(data) {
    this.next = (data && data.next) || "MenuScene";
    this.nextData = (data && data.nextData) || undefined;
    this.beats = SCRIPTS[(data && data.chapter)] || SCRIPTS.intro;
    this.idx = -1;
    this.busy = false;
    this.leaving = false;

    this.cameras.main.setBackgroundColor("#15101f");
    this.layer = this.add.container(0, 0);

    // cinematic letterbox bars
    this.add.rectangle(0, 0, UI_W, 56, 0x000000, 0.85).setOrigin(0).setDepth(18);
    this.add.rectangle(0, UI_H - 56, UI_W, 56, 0x000000, 0.85).setOrigin(0).setDepth(18);

    this.narr = this.add.text(UI_W / 2, UI_H - 96, "", {
      ...body(32, PAPER), align: "center", wordWrap: { width: 1000 }, lineSpacing: 8,
    }).setOrigin(0.5).setDepth(20);

    this.hint = this.add.text(UI_W - 28, UI_H - 26, "ESPACIO continúa · ESC saltar",
      body(22, "#b9a8e8")).setOrigin(1, 0.5).setDepth(20);

    this.input.keyboard.on("keydown-SPACE", () => this.advance());
    this.input.keyboard.on("keydown-ENTER", () => this.advance());
    this.input.on("pointerdown", () => this.advance());
    this.input.keyboard.on("keydown-ESC", () => this.finish());

    this.game.music.bindKeys(this);
    this.game.music.playMenuMusic();
    this.cameras.main.fadeIn(240, 0x2e, 0x24, 0x38);
    this.advance();
  }

  advance() {
    if (this.leaving || this.busy) return;
    if (this.autoTimer) this.autoTimer.remove();
    this.idx++;
    const beat = this.beats[this.idx];
    if (!beat) { this.finish(); return; }
    this.busy = true;

    this.tweens.killTweensOf(this.layer.list);
    this.layer.removeAll(true);
    this.cameras.main.setBackgroundColor(beat.bg || "#15101f");
    if (beat.build) beat.build(this, this.layer);

    this.narr.setText(beat.text || "").setAlpha(0);
    this.tweens.add({ targets: this.narr, alpha: 1, duration: 450 });
    this.game.music.sfx("tick");

    this.time.delayedCall(280, () => { this.busy = false; });
    this.autoTimer = this.time.delayedCall(8000, () => this.advance());
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    if (this.autoTimer) this.autoTimer.remove();
    this.cameras.main.fadeOut(260, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start(this.next, this.nextData));
  }
}
