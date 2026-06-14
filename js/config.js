// Global tuning constants
export const TILE = 16;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 30;
export const WORLD_W = WORLD_COLS * TILE;   // 960
export const WORLD_H = WORLD_ROWS * TILE;   // 480

// world view (one camera screen, in world pixels) — main camera zooms x4
export const VIEW_W = 320;
export const VIEW_H = 180;
export const WORLD_ZOOM = 4;

// canvas / UI resolution: crisp hi-res text over a pixel-perfect world
export const UI_W = VIEW_W * WORLD_ZOOM;   // 1280
export const UI_H = VIEW_H * WORLD_ZOOM;   // 720

export const PLAYER_SPEED = 75;
export const NPC_SPEED = 40;
export const INTERACT_RADIUS = 26;

export const SUSPICION = {
  max: 100,
  decayPerSec: 1.5,     // slow recovery
  decayDelayMs: 2000,
};

// suspicion costs (treatment system) + witness bonuses (stealth system)
export const COSTS = {
  treatWrong: 5,        // suspicious treatment
  treatCombo: 10,       // dangerous combination
  treatAllergy: 25,     // ignored allergy
  discharge: 4,         // medical discharge (low suspicion)
  instantDeath: 30,     // patient dies right after your treatment
  witnessNurse: 20,
  witnessInspector: 40,
  witnessFamily: 26,    // family member (×1.3)
  witnessSuspicious: 30, // suspicious patient observer (×1.5)
  // suspicion REDUCERS (look like a model employee)
  correctTreatment: 3,
  helpNurse: 5,
  checkFiles: 8,
  repairMachine: 10,
};

export const TREATMENT = {
  healOnCorrect: 8,
  dischargeDmg: 25,
  drainPerCondition: 0.25,   // hp/s per untreated condition
  recentHarmWindowMs: 5000,  // death within this of a treatment = "instant death"
  cooldownMs: 0,             // no wait between treatments
};

export const XP_SHOP_INTERVAL = 3;  // shop every N completed levels

export const HELP_COOLDOWNS = { nurse: 14000, files: 16000 };

export const MAINTENANCE = {
  firstAfterMs: [9000, 16000],
  nextAfterMs: [18000, 30000],
};

export const MUSIC = { alertOn: 70, alertOff: 50 };

export const STEALTH = {
  viewRadius: 120,      // px
  fovDeg: 110,          // full cone angle
  closeRange: 12,       // inside this, facing doesn't matter
  chaseAt: 60,          // suspicion at which the inspector hunts you
  calmAt: 40,           // ...and at which he gives up
  chaseSpeed: 56,
  catchDist: 13,        // touch = busted
};

export const ANIM_ROWS = [
  "idle_down", "idle_up", "idle_right", "idle_left",
  "walk_down", "walk_up", "walk_right", "walk_left",
];

