import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, INK, PAPER, RED } from "../ui/theme.js";
import { tutorialDone, markTutorialDone } from "./TutorialScene.js";
import MenuNav from "../ui/MenuNav.js";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#c9f0dd");
    this.cameras.main.fadeIn(180, 0x2e, 0x24, 0x38);

    // decorative checker floor band
    const g = this.add.graphics();
    g.fillStyle(0xb49adf).fillRect(0, UI_H - 174, UI_W, 6);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < UI_W / 64 + 1; x++) {
        g.fillStyle((x + y) % 2 === 0 ? 0xfdf2e0 : 0xf6e2c8);
        g.fillRect(x * 64, UI_H - 168 + y * 56, 64, 56);
      }
    }

    // title
    const titleTxt = this.add.text(UI_W / 2, 82, "FATAL TREATMENT", title(46))
      .setOrigin(0.5).setStroke(INK, 10).setScale(0);
    this.tweens.add({ targets: titleTxt, scale: 1, duration: 420,
                      ease: "Back.easeOut" });
    this.add.text(UI_W / 2, 134,
      "Dr. Muerte — turno de noche en el Hospital Pastelito",
      body(28)).setOrigin(0.5);

    // doctor mascot on the right, looking perfectly trustworthy
    const doc = this.add.sprite(1015, 430, "doctor").setScale(11);
    doc.play("doctor_idle_down");
    const soul = this.add.image(1095, 350, "soul").setScale(7);
    this.tweens.add({
      targets: soul, y: 312, alpha: 0.4,
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    this.add.text(1015, 568, "«Qué doctor tan majo.»",
      body(22, "#7a6890")).setOrigin(0.5);

    // single clean button column (keyboard-navigable)
    this.nav = new MenuNav(this);
    const done = tutorialDone();
    const colX = 430, colW = 380, step = 66;
    let by = 232;
    this.nav.add(makeButton(this, colX, by, colW, 60, "EMPEZAR TURNO",
      () => this.startGame()));
    by += step + 4;
    this.nav.add(makeButton(this, colX, by, colW, 54, "SELECCIONAR NIVEL",
      () => this.goTo("LevelSelectScene")));
    by += step;
    this.nav.add(makeButton(this, colX, by, colW, 54, "TURNO INFINITO",
      () => this.goTo("GameScene", { arcade: true, freshRun: true })));
    by += step;
    this.nav.add(makeButton(this, colX, by, colW, 54, "TUTORIAL",
      () => this.goTo("TutorialScene")));
    by += step;
    this.nav.add(makeButton(this, colX, by, colW, 54, "CUADERNO",
      () => this.goTo("JournalScene", { back: "MenuScene" })));
    by += step;
    this.nav.add(makeButton(this, colX, by, colW, 54, "AJUSTES",
      () => this.toggleSettingsPanel(true)));

    // bottom hint
    this.add.text(UI_W / 2, UI_H - 50,
      "↑↓ moverse · ENTER elegir · ESPACIO empezar · M música",
      body(24, INK)).setOrigin(0.5);
    if (!done) {
      this.add.text(UI_W / 2, UI_H - 22,
        "¿primera vez? prueba el TUTORIAL", body(20, RED)).setOrigin(0.5);
    }

    this.game.music.bindKeys(this);
    this.game.music.playMenuMusic();
    // browsers unlock audio on first gesture; any key or click starts the tune
    this.input.keyboard.once("keydown", () => this.game.music.playMenuMusic());
    this.input.once("pointerdown", () => this.game.music.playMenuMusic());

    this.showHelpHints = this.loadHelpHints();
    this.createSettingsPanel();
    this.input.keyboard.on("keydown-J",
      () => this.goTo("JournalScene", { back: "MenuScene" }));
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.startedOnce = false;
  }

  createSettingsPanel() {
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

    const dataSection = this.add.text(Lx, CY + 138, "Datos",
      body(24, PAPER)).setOrigin(0, 0.5);
    const resetButton = makeButton(this, CX - 260, CY + 178, 280, 46,
      "BORRAR PROGRESO", () => this.confirmResetProgress(resetButton));
    this._resetButton = resetButton;

    const closeButton = makeButton(this, CX, CY + 222, 220, 54, "CERRAR",
      () => this.toggleSettingsPanel(false));

    this.settingsPanel.add([frame, headerTxt, soundSection, muteLabel,
      muteButton.shadow, muteButton.bg, muteButton.txt, musicToggleLabel,
      toggleButton.shadow, toggleButton.bg, toggleButton.txt,
      musicVolLabel, musicSlider, musicKnob, musicValue,
      sfxVolLabel, sfxSlider, sfxKnob, sfxValue, controlsSection,
      controlsText, accessibilitySection, hintsLabel, hintsButton.shadow,
      hintsButton.bg, hintsButton.txt,
      dataSection, resetButton.shadow, resetButton.bg, resetButton.txt,
      closeButton.shadow, closeButton.bg, closeButton.txt]);

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
    if (this.nav) this.nav.enabled = !visible;   // suspend menu nav while modal
    if (visible) {
      this.updateAudioSettings();
      // re-arm the destructive reset button fresh each time the panel opens
      this._resetArmed = false;
      if (this._resetTimer) this._resetTimer.remove();
      if (this._resetButton) this._resetButton.txt.setText("BORRAR PROGRESO").setColor(INK);
    }
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
    if (tutorialDone()) {
      this.goTo("LevelSelectScene");
    } else {
      // first run: play the origin cinematic, then the tutorial
      this.goTo("StoryScene", { chapter: "intro", next: "TutorialScene" });
    }
  }

  /** Wipe saved progress (levels, tutorial, records, journal). Two-click confirm. */
  confirmResetProgress(btn) {
    if (!this._resetArmed) {
      this._resetArmed = true;
      btn.txt.setText("¿SEGURO? OTRA VEZ").setColor(RED);
      this.game.music.sfx("tick");
      if (this._resetTimer) this._resetTimer.remove();
      this._resetTimer = this.time.delayedCall(3000, () => {
        this._resetArmed = false;
        btn.txt.setText("BORRAR PROGRESO").setColor(INK);
      });
      return;
    }
    this._resetArmed = false;
    if (this._resetTimer) this._resetTimer.remove();
    for (const k of ["ft_progress", "ft_tutorial_done", "ft_arcade_best",
                     "ft_journal"]) {
      try { localStorage.removeItem(k); } catch (e) { /* ok */ }
    }
    btn.txt.setText("✓ PROGRESO BORRADO").setColor(RED);
    this.game.music.sfx("confirm");
    this.time.delayedCall(1800, () => {
      btn.txt.setText("BORRAR PROGRESO").setColor(INK);
    });
  }

  goTo(key, data) {
    if (this.startedOnce) return;
    this.startedOnce = true;
    this.game.music.sfx("confirm");
    this.cameras.main.fadeOut(180, 0x2e, 0x24, 0x38);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start(key, data));
  }
}
