// Level progression + persistence (localStorage).
// Tracks which levels are unlocked, the best result per level, and the
// last-played level so "EMPEZAR TURNO" can continue.

import { LEVELS } from "../data/levels.js";

const KEY = "ft_progress";

export const LEVEL_COUNT = LEVELS.length;

function blank() {
  return { unlocked: 1, current: 1, best: {} };   // best: { [id]: {kills,total,timeMs} }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data.unlocked !== "number") return blank();
    return {
      unlocked: Phaser.Math.Clamp(data.unlocked, 1, LEVEL_COUNT),
      current: Phaser.Math.Clamp(data.current || 1, 1, LEVEL_COUNT),
      best: data.best || {},
    };
  } catch (e) {
    return blank();
  }
}

function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ok */ }
}

export function isUnlocked(id) {
  return id <= loadProgress().unlocked;
}

export function highestUnlocked() {
  return loadProgress().unlocked;
}

export function setCurrent(id) {
  const p = loadProgress();
  p.current = Phaser.Math.Clamp(id, 1, LEVEL_COUNT);
  save(p);
}

export function getCurrent() {
  return loadProgress().current;
}

/** Record a win: unlock the next level, store best result. Returns next id|null. */
export function completeLevel(id, stats) {
  const p = loadProgress();
  const prev = p.best[id];
  if (!prev || stats.timeMs < prev.timeMs) {
    p.best[id] = { kills: stats.kills, total: stats.total, timeMs: stats.timeMs };
  }
  const next = id + 1;
  if (next <= LEVEL_COUNT) {
    p.unlocked = Math.max(p.unlocked, next);
    p.current = next;
  } else {
    p.current = id;
  }
  save(p);
  return next <= LEVEL_COUNT ? next : null;
}

export function bestFor(id) {
  return loadProgress().best[id] || null;
}

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function resetProgress() {
  save(blank());
}
