// Persistent "Cuaderno de combinaciones": records dangerous combinations the
// player discovers, saved across runs in localStorage.

import { COMBOS } from "../data/medical.js";

const KEY = "ft_journal";

export function loadDiscovered() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function save(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) { /* ok */ }
}

export function isDiscovered(id) {
  return loadDiscovered().has(id);
}

/** Record a discovery. Returns true if it was new. */
export function discover(id) {
  const set = loadDiscovered();
  if (set.has(id)) return false;
  set.add(id);
  save(set);
  return true;
}

export function discoveredCount() {
  return loadDiscovered().size;
}

export const TOTAL_COMBOS = COMBOS.length;

/** All combos with a discovered flag, for the journal UI. */
export function journalEntries() {
  const set = loadDiscovered();
  return COMBOS.map((c) => ({ ...c, discovered: set.has(c.id) }));
}

export function resetJournal() {
  save(new Set());
}
