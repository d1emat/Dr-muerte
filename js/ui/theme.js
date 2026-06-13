// Shared UI theme: fonts, colors, text styles, buttons.
// World art is 16px pixel art; UI renders at canvas resolution (1280x720)
// with real fonts so text is sharp.

export const FONT_TITLE = '"Press Start 2P", monospace';
export const FONT_BODY = '"VT323", monospace';

export const INK = "#4a3b5c";
export const INK_N = 0x4a3b5c;
export const PAPER = "#fff6ee";
export const PAPER_N = 0xfff6ee;
export const SHADOW_N = 0x7a6890;
export const YELLOW = "#ffd970";
export const YELLOW_N = 0xffd970;
export const RED = "#ef5d6f";
export const RED_N = 0xef5d6f;
export const GREEN = "#6fd293";
export const GREEN_N = 0x6fd293;
export const GHOST = "#b9a8e8";

export function title(size, color = PAPER, extra = {}) {
  return { fontFamily: FONT_TITLE, fontSize: `${size}px`, color, ...extra };
}

export function body(size, color = INK, extra = {}) {
  return { fontFamily: FONT_BODY, fontSize: `${size}px`, color, ...extra };
}

/**
 * Professional button: drop shadow, hover lift + tint, press feedback.
 */
export function makeButton(scene, x, y, w, h, label, onClick) {
  const shadow = scene.add.rectangle(x + 4, y + 5, w, h, SHADOW_N).setOrigin(0.5);
  const bg = scene.add.rectangle(x, y, w, h, PAPER_N).setOrigin(0.5)
    .setStrokeStyle(3, INK_N).setInteractive({ useHandCursor: true });
  const txt = scene.add.text(x, y, label, title(13, INK)).setOrigin(0.5);

  const lift = (on) => scene.tweens.add({
    targets: [bg, txt], scale: on ? 1.06 : 1, duration: 110, ease: "Sine.easeOut",
  });
  bg.on("pointerover", () => {
    bg.setFillStyle(YELLOW_N);
    lift(true);
    scene.game.music.sfx("tick");
  });
  bg.on("pointerout", () => {
    bg.setFillStyle(PAPER_N);
    lift(false);
  });
  bg.on("pointerdown", () => {
    scene.tweens.add({ targets: [bg, txt], scale: 0.94, duration: 70 });
  });
  bg.on("pointerup", () => {
    scene.game.music.sfx("confirm");
    lift(true);
    onClick();
  });
  return { shadow, bg, txt };
}
