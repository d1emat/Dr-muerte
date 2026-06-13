import { UI_W, UI_H } from "../config.js";
import { title, body, makeButton, PAPER, INK } from "../ui/theme.js";

/**
 * Reusable audio/settings panel. All elements live inside `panel` so hiding
 * it never leaves orphan labels on screen.
 */
export function createSettingsPanel(scene, { depth = 10000, onClose } = {}) {
  const panel = scene.add.container(0, 0).setVisible(false).setDepth(depth);
  const CX = UI_W / 2, CY = UI_H / 2;

  const frame = scene.add.rectangle(CX, CY, 560, 420, 0x4a3b5c, 0.97)
    .setStrokeStyle(3, 0xfff6ee);
  const headerTxt = scene.add.text(CX, CY - 190, "Ajustes", title(28, PAPER))
    .setOrigin(0.5);

  const muteLabel = scene.add.text(CX - 220, CY - 120, "Silenciar:",
    body(22, PAPER)).setOrigin(0, 0.5);
  const muteButton = makeButton(scene, CX + 160, CY - 120, 180, 48, "",
    () => { scene.game.music.toggleMute(); update(); });
  muteButton.bg.setScale(0.9);

  const musicToggleLabel = scene.add.text(CX - 220, CY - 60, "Música ON/OFF:",
    body(22, PAPER)).setOrigin(0, 0.5);
  const toggleButton = makeButton(scene, CX + 160, CY - 60, 180, 48, "",
    () => { scene.game.music.toggleEnabled(); update(); });
  toggleButton.bg.setScale(0.9);

  const musicVolLabel = scene.add.text(CX - 220, CY, "Volumen música:",
    body(22, PAPER)).setOrigin(0, 0.5);
  const musicSlider = scene.add.rectangle(CX, CY + 40, 360, 10, 0x7a6890)
    .setOrigin(0.5).setInteractive({ useHandCursor: true });
  const musicKnob = scene.add.circle(CX, CY + 40, 12, 0xffd970)
    .setInteractive({ useHandCursor: true });
  const musicValue = scene.add.text(CX + 210, CY, "", body(20, PAPER)).setOrigin(0.5);

  const sfxVolLabel = scene.add.text(CX - 220, CY + 70, "Volumen efectos:",
    body(22, PAPER)).setOrigin(0, 0.5);
  const sfxSlider = scene.add.rectangle(CX, CY + 110, 360, 10, 0x7a6890)
    .setOrigin(0.5).setInteractive({ useHandCursor: true });
  const sfxKnob = scene.add.circle(CX, CY + 110, 12, 0xffd970)
    .setInteractive({ useHandCursor: true });
  const sfxValue = scene.add.text(CX + 210, CY + 70, "", body(20, PAPER)).setOrigin(0.5);

  let showHelpHints = loadHelpHints();
  const hintsLabel = scene.add.text(CX - 220, CY + 150, "Ayudas en juego:",
    body(22, PAPER)).setOrigin(0, 0.5);
  const hintsButton = makeButton(scene, CX + 160, CY + 150, 180, 48, "",
    () => { showHelpHints = !showHelpHints; saveHelpHints(showHelpHints); update(); });
  hintsButton.bg.setScale(0.9);

  const closeButton = makeButton(scene, CX, CY + 190, 220, 56, "CERRAR",
    () => { toggle(false); if (onClose) onClose(); });
  closeButton.bg.setScale(0.95);

  panel.add([
    frame, headerTxt,
    muteLabel, muteButton.shadow, muteButton.bg, muteButton.txt,
    musicToggleLabel, toggleButton.shadow, toggleButton.bg, toggleButton.txt,
    musicVolLabel, musicSlider, musicKnob, musicValue,
    sfxVolLabel, sfxSlider, sfxKnob, sfxValue,
    hintsLabel, hintsButton.shadow, hintsButton.bg, hintsButton.txt,
    closeButton.shadow, closeButton.bg, closeButton.txt,
  ]);

  function updateKnob(slider, knob, value) {
    const half = 180;
    knob.x = slider.x - half + value * (half * 2);
  }

  function setVol(slider, knob, setter, pointerX) {
    const half = 180;
    const v = Phaser.Math.Clamp((pointerX - (slider.x - half)) / (half * 2), 0, 1);
    setter(v);
    update();
  }

  musicSlider.on("pointerdown", (p) => setVol(musicSlider, musicKnob,
    (v) => scene.game.music.setVolume(v), p.x));
  musicKnob.on("pointerdown", () => { scene._musicDrag = true; });
  sfxSlider.on("pointerdown", (p) => setVol(sfxSlider, sfxKnob,
    (v) => scene.game.music.setSfxVolume(v), p.x));
  sfxKnob.on("pointerdown", () => { scene._sfxDrag = true; });

  scene.input.on("pointermove", (pointer) => {
    if (scene._musicDrag) setVol(musicSlider, musicKnob,
      (v) => scene.game.music.setVolume(v), pointer.x);
    if (scene._sfxDrag) setVol(sfxSlider, sfxKnob,
      (v) => scene.game.music.setSfxVolume(v), pointer.x);
  });
  scene.input.on("pointerup", () => {
    scene._musicDrag = false;
    scene._sfxDrag = false;
  });

  function update() {
    const m = scene.game.music;
    muteButton.txt.setText(m.muted ? "SI" : "NO");
    toggleButton.txt.setText(m.enabled ? "ON" : "OFF");
    musicValue.setText(`${Math.round(m.volume * 100)}%`);
    updateKnob(musicSlider, musicKnob, m.volume);
    sfxValue.setText(`${Math.round(m.sfxVolume * 100)}%`);
    updateKnob(sfxSlider, sfxKnob, m.sfxVolume);
    hintsButton.txt.setText(showHelpHints ? "SI" : "NO");
  }

  function toggle(visible) {
    if (visible == null) visible = !panel.visible;
    panel.setVisible(visible);
    if (visible) update();
  }

  update();

  return {
    panel,
    update,
    toggle,
    get showHelpHints() { return showHelpHints; },
    set showHelpHints(v) { showHelpHints = v; saveHelpHints(v); },
  };
}

function loadHelpHints() {
  try {
    const raw = localStorage.getItem("ft_help_hints");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}

function saveHelpHints(v) {
  try { localStorage.setItem("ft_help_hints", String(v)); } catch (e) { /* ok */ }
}

export { loadHelpHints, saveHelpHints };
