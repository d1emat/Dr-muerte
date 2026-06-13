import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, PAPER, RED } from "../ui/theme.js";
import { tutorialDone, markTutorialDone } from "./TutorialScene.js";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9f0dd");
    this.cameras.main.fadeIn(400, 0x2e, 0x24, 0x38);

    // decorative checker floor band
    const g = this.add.graphics();
    g.fillStyle(0xb49adf).fillRect(0, UI_H - 174, UI_W, 6);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < UI_W / 64 + 1; x++) {
        g.fillStyle((x + y) % 2 === 0 ? 0xfdf2e0 : 0xf6e2c8);
        g.fillRect(x * 64, UI_H - 168 + y * 56, 64, 56);
      }
    }

    const titleTxt = this.add.text(UI_W / 2, 110, "FATAL TREATMENT", title(46))
      .setOrigin(0.5).setStroke(INK, 10).setScale(0);
    this.tweens.add({ targets: titleTxt, scale: 1, duration: 500,
                      ease: "Back.easeOut" });
    this.add.text(UI_W / 2, 170,
      "Dr. Muerte — turno de noche en el Hospital Pastelito",
      body(30)).setOrigin(0.5);

    // the doctor, looking perfectly trustworthy
    const doc = this.add.sprite(UI_W / 2, 350, "doctor").setScale(10);
    doc.play("doctor_idle_down");
    const soul = this.add.image(UI_W / 2 + 110, 290, "soul").setScale(7);
    this.tweens.add({
      targets: soul, y: 250, alpha: 0.4,
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.add.text(UI_W / 2, 470,
      "WASD mover · E atender · W/S elegir · Q cerrar",
      body(28)).setOrigin(0.5);
    this.add.text(UI_W / 2, 504,
      "Trata a 3 pacientes… hasta el final. Que nadie sospeche.",
      body(28, RED)).setOrigin(0.5);
    this.add.text(UI_W / 2, 534, "M música · , . volumen",
      body(22, "#7a6890")).setOrigin(0.5);

    const done = tutorialDone();
    makeButton(this, UI_W / 2 - 220, UI_H - 84, 300, 56, "EMPEZAR TURNO",
      () => this.startGame());
    makeButton(this, UI_W / 2 + 96, UI_H - 84, 220, 56, "NIVELES",
      () => this.goTo("LevelSelectScene"));
    makeButton(this, UI_W / 2 + 320, UI_H - 84, 200, 56, "TUTORIAL",
      () => this.goTo("TutorialScene"));
    const hintTxt = done
      ? "o pulsa ESPACIO"
      : "primera vez: empieza por el área de prácticas (ESPACIO)";
    const hint = this.add.text(UI_W / 2, UI_H - 36, hintTxt,
      body(22, INK)).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 600,
                      yoyo: true, repeat: -1 });
    if (!done) {
      const skip = this.add.text(UI_W - 24, UI_H - 24,
        "saltar tutorial ›", body(22, "#7a6890"))
        .setOrigin(1).setInteractive({ useHandCursor: true });
      skip.on("pointerover", () => skip.setColor(INK));
      skip.on("pointerout", () => skip.setColor("#7a6890"));
      skip.on("pointerdown", () => {
        markTutorialDone();
        this.goTo("LevelSelectScene");
      });
    }

    this.game.music.bindKeys(this);
    this.game.music.playMenuMusic();
    // browsers unlock audio on first gesture; any key or click starts the tune
    this.input.keyboard.once("keydown", () => this.game.music.playMenuMusic());
    this.input.once("pointerdown", () => this.game.music.playMenuMusic());

    this.showHelpHints = this.loadHelpHints();
    this.createSettingsPanel();
    const journalBtn = makeButton(this, 160, 70, 240, 52, "CUADERNO",
      () => this.goTo("JournalScene", { back: "MenuScene" }));
    journalBtn.bg.setDepth(9000);
    journalBtn.txt.setDepth(9001);
    this.input.keyboard.on("keydown-J",
      () => this.goTo("JournalScene", { back: "MenuScene" }));
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.startedOnce = false;
  }

  createSettingsPanel() {
    const x = UI_W - 160;
    const settingsBtn = makeButton(this, x, 70, 240, 52, "AJUSTES", () =>
      this.toggleSettingsPanel(true));
    settingsBtn.bg.setDepth(10000);
    settingsBtn.txt.setDepth(10001);

    this.settingsPanel = this.add.container(0, 0).setVisible(false).setDepth(10000);
    const CX = UI_W / 2, CY = UI_H / 2;
    const frame = this.add.rectangle(CX, CY, 940, 548, 0x4a3b5c, 0.96)
      .setStrokeStyle(3, 0xfff6ee);
    const headerTxt = this.add.text(CX, CY - 238,
      "Ajustes del juego", title(26, PAPER)).setOrigin(0.5);

    // two columns so nothing overflows the 1280x720 screen
    const Lx = CX - 410;          // left column labels
    const Bx = CX - 120;          // left column controls (buttons/sliders)
    const Rx = CX + 60;           // right column

    const soundSection = this.add.text(Lx, CY - 168, "Sonido",
      body(24, PAPER)).setOrigin(0, 0.5);
    const muteLabel = this.add.text(Lx, CY - 118, "Silenciar:",
      body(20, PAPER)).setOrigin(0, 0.5);
    const muteButton = makeButton(this, Bx, CY - 118, 168, 46, "",
      () => this.toggleMute());

    const musicToggleLabel = this.add.text(Lx, CY - 62, "Música ON/OFF:",
      body(20, PAPER)).setOrigin(0, 0.5);
    const toggleButton = makeButton(this, Bx, CY - 62, 168, 46, "",
      () => this.toggleMusicEnabled());

    const musicVolLabel = this.add.text(Lx, CY - 6, "Volumen música:",
      body(20, PAPER)).setOrigin(0, 0.5);
    const musicSlider = this.add.rectangle(Lx + 120, CY + 26, 240, 10, 0x7a6890)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const musicKnob = this.add.circle(Lx + 120, CY + 26, 12, 0xffd970)
      .setInteractive({ useHandCursor: true });
    const musicValue = this.add.text(Lx + 270, CY + 26, "",
      body(20, PAPER)).setOrigin(0.5);

    const sfxVolLabel = this.add.text(Lx, CY + 64, "Volumen efectos:",
      body(20, PAPER)).setOrigin(0, 0.5);
    const sfxSlider = this.add.rectangle(Lx + 120, CY + 96, 240, 10, 0x7a6890)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const sfxKnob = this.add.circle(Lx + 120, CY + 96, 12, 0xffd970)
      .setInteractive({ useHandCursor: true });
    const sfxValue = this.add.text(Lx + 270, CY + 96, "",
      body(20, PAPER)).setOrigin(0.5);

    const controlsSection = this.add.text(Rx, CY - 168, "Controles",
      body(24, PAPER)).setOrigin(0, 0.5);
    const controlsText = this.add.text(Rx, CY - 132,
      "WASD: mover\nE: interactuar\nQ: cerrar menú\nJ: cuaderno\n" +
      "T: omitir tutorial\nESC: pausa\nM: silencio",
      body(20, PAPER)).setOrigin(0, 0).setLineSpacing(7);

    const accessibilitySection = this.add.text(Rx, CY + 108, "Accesibilidad",
      body(24, PAPER)).setOrigin(0, 0.5);
    const hintsLabel = this.add.text(Rx, CY + 152, "Mostrar consejos:",
      body(20, PAPER)).setOrigin(0, 0.5);
    const hintsButton = makeButton(this, Rx + 300, CY + 152, 150, 46, "",
      () => this.toggleHelpHints());

    const closeButton = makeButton(this, CX, CY + 222, 220, 54, "CERRAR",
      () => this.toggleSettingsPanel(false));

    this.settingsPanel.add([frame, headerTxt, soundSection, muteLabel,
      muteButton.shadow, muteButton.bg, muteButton.txt, musicToggleLabel,
      toggleButton.shadow, toggleButton.bg, toggleButton.txt,
      musicVolLabel, musicSlider, musicKnob, musicValue,
      sfxVolLabel, sfxSlider, sfxKnob, sfxValue, controlsSection,
      controlsText, accessibilitySection, hintsLabel, hintsButton.shadow,
      hintsButton.bg, hintsButton.txt, closeButton.shadow, closeButton.bg,
      closeButton.txt]);

    this.settingsState = {
      muteButton,
      toggleButton,
      musicSlider,
      musicKnob,
      musicValue,
      sfxSlider,
      sfxKnob,
      sfxValue,
      hintsButton,
    };

    const updateVolumeKnob = (slider, knob, value) => {
      const left = slider.x - slider.width / 2;
      knob.x = left + value * slider.width;
    };
    const pointerToVolume = (pointerX, slider) => {
      const left = slider.x - slider.width / 2;
      const right = slider.x + slider.width / 2;
      const clamped = Phaser.Math.Clamp(pointerX, left, right);
      return (clamped - left) / (right - left);
    };

    this.musicDrag = false;
    this.sfxDrag = false;

    const updateMusicVolume = (pointerX) => {
      this.setMusicVolume(pointerToVolume(pointerX, musicSlider));
    };
    const updateSfxVolume = (pointerX) => {
      this.setSfxVolume(pointerToVolume(pointerX, sfxSlider));
    };

    musicSlider.on("pointerdown", (pointer) => updateMusicVolume(pointer.x));
    musicKnob.on("pointerdown", () => { this.musicDrag = true; });
    sfxSlider.on("pointerdown", (pointer) => updateSfxVolume(pointer.x));
    sfxKnob.on("pointerdown", () => { this.sfxDrag = true; });

    this.input.on("pointermove", (pointer) => {
      if (this.musicDrag) updateMusicVolume(pointer.x);
      if (this.sfxDrag) updateSfxVolume(pointer.x);
    });
    this.input.on("pointerup", () => {
      this.musicDrag = false;
      this.sfxDrag = false;
    });

    this.updateAudioSettings = () => {
      const manager = this.game.music;
      muteButton.txt.setText(manager.muted ? "SI" : "NO");
      toggleButton.txt.setText(manager.enabled ? "ON" : "OFF");
      const musicPct = Math.round(manager.volume * 100);
      musicValue.setText(`${musicPct}%`);
      updateVolumeKnob(musicSlider, musicKnob, manager.volume);
      const sfxPct = Math.round(manager.sfxVolume * 100);
      sfxValue.setText(`${sfxPct}%`);
      updateVolumeKnob(sfxSlider, sfxKnob, manager.sfxVolume);
      hintsButton.txt.setText(this.showHelpHints ? "SI" : "NO");
    };
    this.updateAudioSettings();
  }

  loadHelpHints() {
    try {
      const raw = localStorage.getItem("ft_help_hints");
      return raw === null ? true : raw === "true";
    } catch (e) {
      return true;
    }
  }

  saveHelpHints() {
    try {
      localStorage.setItem("ft_help_hints", String(this.showHelpHints));
    } catch (e) {
      // ignore
    }
  }

  toggleSettingsPanel(visible) {
    if (visible == null) visible = !this.settingsPanel.visible;
    this.settingsPanel.setVisible(visible);
    if (visible) this.updateAudioSettings();
  }

  toggleMute() {
    this.game.music.toggleMute();
    this.updateAudioSettings();
  }

  toggleMusicEnabled() {
    this.game.music.toggleEnabled();
    this.updateAudioSettings();
  }

  setMusicVolume(value) {
    this.game.music.setVolume(value);
    this.updateAudioSettings();
  }

  setSfxVolume(value) {
    this.game.music.setSfxVolume(value);
    this.updateAudioSettings();
  }

  toggleHelpHints() {
    this.showHelpHints = !this.showHelpHints;
    this.saveHelpHints();
    this.updateAudioSettings();
  }

  startGame() {
    this.goTo(tutorialDone() ? "LevelSelectScene" : "TutorialScene");
  }

  goTo(key, data) {
    if (this.startedOnce) return;
    this.startedOnce = true;
    this.game.music.sfx("confirm");
    this.cameras.main.fadeOut(400, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start(key, data));
  }
}
