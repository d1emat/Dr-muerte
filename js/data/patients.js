// Random patient generation: names, ages, allergies, conditions.
// The level defines position + route; this module randomizes the identity.

import { CONDITIONS, MEDICINES } from "./medical.js";
import { pickPatientType } from "./patientTypes.js";

const FIRST_NAMES = [
  "Ernesto", "Pura", "Andrés", "Remedios", "Casimiro", "Paquita",
  "Dolores", "Manolo", "Concha", "Pepe", "Lola", "Fermín",
  "Rosario", "Joaquín", "Milagros", "Alfonso", "Esperanza",
  "Gerardo", "Amparo", "Eusebio", "Virtudes", "Blas",
  "Socorro", "Ramón", "Tomasa", "Lucía", "Hugo", "Valeria",
  "Pablo", "Carmen", "Iván", "Nerea", "Nico", "Sofía",
];

const TITLES_OLD_M = ["Don"];
const TITLES_OLD_F = ["Doña"];

const ALLERGIES = [
  { id: "penicillin",  label: "Penicilina",  meds: ["antibiotic"] },
  { id: "ibuprofen",   label: "Ibuprofeno",  meds: [] },
  { id: "aspirin",     label: "Aspirina",    meds: ["aspirin"] },
  { id: "morphine",    label: "Morfina",     meds: ["morphine"] },
  { id: "sulfonamide", label: "Sulfonamidas", meds: ["antibiotic"] },
  { id: "latex",       label: "Látex",       meds: [] },        // environmental
];

export { ALLERGIES };

const CONDITION_IDS = Object.keys(CONDITIONS);

/** Age brackets with gameplay implications */
export function ageBracket(age) {
  if (age <= 10)  return { key: "child",  label: "niño",    resistMul: 0.6, suspMul: 2.0, xp: 50 };
  if (age <= 25)  return { key: "young",  label: "joven",   resistMul: 1.4, suspMul: 0.7, xp: 35 };
  if (age <= 50)  return { key: "adult",  label: "adulto",  resistMul: 1.0, suspMul: 1.0, xp: 20 };
  if (age <= 70)  return { key: "senior", label: "mayor",   resistMul: 0.75, suspMul: 0.6, xp: 15 };
  return              { key: "elder",  label: "anciano", resistMul: 0.5, suspMul: 0.3, xp: 10 };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * Generate a random patient profile. `def` comes from the level and
 * provides x, y, route. Everything else is randomized unless explicitly set.
 */
export function randomizePatient(def, levelDifficulty = 1) {
  const age = def.age || (5 + Math.floor(Math.random() * 91));
  const bracket = ageBracket(age);

  // name
  const firstName = def.firstName || pick(FIRST_NAMES);
  const isFemale = firstName.endsWith("a") || ["Lola", "Concha", "Carmen", "Nerea", "Sofía", "Valeria", "Lucía"].includes(firstName);
  const titlePrefix = age >= 60
    ? (isFemale ? pick(TITLES_OLD_F) : pick(TITLES_OLD_M)) + " "
    : "";
  const displayName = def.name || `${titlePrefix}${firstName} (${age})`;

  // conditions: 1-2 based on difficulty
  let conditions = def.conditions;
  if (!conditions || conditions.length === 0) {
    const numConditions = levelDifficulty >= 3 ? (Math.random() < 0.4 ? 2 : 1) : 1;
    conditions = pickN(CONDITION_IDS, numConditions);
  }

  // allergies: 0-2, more likely at higher difficulty
  let allergies = def.allergies;
  if (allergies === undefined) {
    const allergyChance = 0.15 + levelDifficulty * 0.1;
    const numAllergies = Math.random() < allergyChance
      ? (Math.random() < 0.3 ? 2 : 1) : 0;
    allergies = pickN(ALLERGIES, numAllergies);
  }

  // health: age-based resistance
  const baseHp = 100;
  const hp = Math.round(baseHp * bracket.resistMul);

  // personality / behaviour archetype
  const archetype = def.archetype || pickPatientType();

  return {
    ...def,
    name: displayName,
    displayName,
    age,
    bracket,
    conditions,
    allergies,
    maxHealth: hp,
    xpValue: bracket.xp,
    suspicionMul: bracket.suspMul,
    archetype,
    speed: archetype.speed || 18,
    pauseMs: archetype.pauseMs || 2600,
  };
}
