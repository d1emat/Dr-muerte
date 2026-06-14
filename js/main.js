import { UI_W, UI_H } from "./config.js";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import LevelSelectScene from "./scenes/LevelSelectScene.js";
import TutorialScene from "./scenes/TutorialScene.js";
import GameScene from "./scenes/GameScene.js";
import PauseScene from "./scenes/PauseScene.js";
import JournalScene from "./scenes/JournalScene.js";
import UIScene from "./scenes/UIScene.js";
import { GameOverScene, VictoryScene } from "./scenes/EndScenes.js";
import ShopScene from "./scenes/ShopScene.js";
import NewspaperScene from "./scenes/NewspaperScene.js";
import StoryScene from "./scenes/StoryScene.js";

let started = false;
function start() {
  if (started) return;
  started = true;
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: UI_W,                      // hi-res canvas: crisp text...
    height: UI_H,                     // ...world camera zooms x4 (pixel art)
    backgroundColor: "#2e2438",
    pixelArt: true,                   // nearest-neighbour textures
    antialias: false,                 // no smoothing, ever
    roundPixels: true,                // no sub-pixel jitter
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,         // fill #game (90% viewport), keep aspect
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: false,
    },
    scene: [BootScene, MenuScene, LevelSelectScene, TutorialScene, GameScene,
            PauseScene, JournalScene, UIScene, ShopScene, NewspaperScene,
            StoryScene, GameOverScene, VictoryScene],
  });
}

// wait for the pixel fonts so no text renders with a fallback font
if (document.fonts && document.fonts.load) {
  Promise.all([
    document.fonts.load('16px "Press Start 2P"'),
    document.fonts.load('16px "VT323"'),
  ]).then(start, start);
  setTimeout(start, 2500);            // failsafe
} else {
  start();
}
