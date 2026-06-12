// Global tuning constants
export const TILE = 16;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 30;
export const WORLD_W = WORLD_COLS * TILE;   // 960
export const WORLD_H = WORLD_ROWS * TILE;   // 480

export const VIEW_W = 320;
export const VIEW_H = 180;

export const PLAYER_SPEED = 75;
export const NPC_SPEED = 40;
export const INTERACT_RADIUS = 26;

export const SUSPICION = {
  max: 100,
  decayPerSec: 1.5,     // slow recovery
  decayDelayMs: 2000,
};

// base action costs + witness bonuses (stealth system)
export const COSTS = {
  overdose: 10,
  poisonCoffee: 5,
  poisonDeath: 5,
  sabotage: 20,
  sabotageDeath: 5,
  searchCabinet: 4,
  witnessNurse: 20,
  witnessInspector: 40,
};

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

export const ITEM_DATA = {
  syringe:        { frame: "syringe",        name: "Jeringuilla" },
  poison_bottle:  { frame: "poison_bottle",  name: "Veneno" },
  electric_cable: { frame: "electric_cable", name: "Cable eléctrico" },
};
