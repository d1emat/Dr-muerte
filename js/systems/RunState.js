// Run-wide state: XP, upgrades, and session stats across multiple levels.
import { UpgradeState } from "./Upgrades.js";

function blankStats() {
  return {
    totalKills: 0,
    comboKills: 0,
    allergyKills: 0,
    misdiagnosisKills: 0,
    suspicionSum: 0,
    suspicionSamples: 0,
    fastestKillMs: null,
    comboCounts: {},
    levelsWon: 0,
    headlines: [],
  };
}

export function getRunState(game) {
  if (!game.runState) game.runState = createRunState();
  return game.runState;
}

export function resetRunState(game) {
  game.runState = createRunState();
}

export function createRunState(ngPlus = false) {
  return {
    xp: 0,
    totalEarned: 0,
    upgrades: new UpgradeState(),
    levelsCompleted: 0,
    ngPlus,
    stats: blankStats(),
    levelStartTime: 0,
    activeUpgrades: [],
  };
}

export function runXp(game) {
  return getRunState(game).xp;
}

export function addRunXp(game, amount, reason = "") {
  const rs = getRunState(game);
  rs.xp += amount;
  rs.totalEarned += amount;
  game.events.emit("xp", rs.xp);
  if (amount > 0) game.events.emit("xp-gain", { amount, reason });
  return amount;
}

export function spendRunXp(game, amount) {
  const rs = getRunState(game);
  if (rs.xp < amount) return false;
  rs.xp -= amount;
  game.events.emit("xp", rs.xp);
  return true;
}

/** Shop appears between every level (routeNext only reaches here with a next). */
export function shouldShowShop(completedLevelId) {
  return completedLevelId > 0;
}

export function recordKill(game, patient, meta = {}) {
  const rs = getRunState(game);
  rs.stats.totalKills++;
  if (meta.combo) {
    rs.stats.comboKills++;
    const id = meta.comboId || "combo";
    rs.stats.comboCounts[id] = (rs.stats.comboCounts[id] || 0) + 1;
  }
  if (meta.allergy) rs.stats.allergyKills++;
  if (meta.misdiagnosis) rs.stats.misdiagnosisKills++;
  if (meta.timeMs != null) {
    const t = meta.timeMs;
    if (rs.stats.fastestKillMs == null || t < rs.stats.fastestKillMs) {
      rs.stats.fastestKillMs = t;
    }
  }
}

export function recordSuspicionSample(game, value) {
  const rs = getRunState(game);
  rs.stats.suspicionSum += value;
  rs.stats.suspicionSamples++;
}

export function avgSuspicion(game) {
  const s = getRunState(game).stats;
  return s.suspicionSamples > 0
    ? Math.round(s.suspicionSum / s.suspicionSamples) : 0;
}

export function favoriteCombo(game) {
  const counts = getRunState(game).stats.comboCounts;
  let best = null, n = 0;
  for (const [id, c] of Object.entries(counts)) {
    if (c > n) { best = id; n = c; }
  }
  return best;
}

export function addHeadline(game, text) {
  getRunState(game).stats.headlines.push(text);
}
