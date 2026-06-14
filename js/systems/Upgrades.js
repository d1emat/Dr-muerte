// Upgrade definitions and state for the shop between levels.

// iconFrame: a frame in the "items" atlas (the pixel font can't draw emojis).
export const PASSIVE_UPGRADES = [
  { id: "poker_face",     name: "Cara de buena persona", cost: 30,
    desc: "Sospechas suben 20% más lento",
    iconFrame: "hospital_badge", effect: { suspicionMul: 0.8 } },
  { id: "shaky_hands",    name: "Manos temblorosas",     cost: 25,
    desc: "Acciones dañinas parecen accidentales (-15% sospechas por error)",
    iconFrame: "syringe", effect: { accidentalMul: 0.85 } },
  { id: "new_coat",       name: "Bata nueva",            cost: 20,
    desc: "Primera acción de cada sala sin sospechas",
    iconFrame: "medicine_box_icon", effect: { freeFirstAction: true } },
  { id: "fake_records",   name: "Historial falso",       cost: 40,
    desc: "Usar alergias no genera sospechas (1x por sala)",
    iconFrame: "patient_records", effect: { freeAllergyUse: true } },
  { id: "fancy_steth",    name: "Estetoscopio de lujo",  cost: 35,
    desc: "Ves el efecto real de cada tratamiento",
    iconFrame: "heart_monitor_icon", effect: { showRealEffect: true } },
  { id: "rehearsed_smile", name: "Sonrisa ensayada",     cost: 30,
    desc: "Sospechas bajan el doble de rápido",
    iconFrame: "coffee_mug", effect: { decayMul: 2.0 } },
];

export const ACTIVE_UPGRADES = [
  { id: "everyone_out",   name: "Fuera todos",    cost: 25, uses: 1,
    desc: "Echa observadores de la sala por 15 segundos",
    iconFrame: "keycard" },
  { id: "distraction",    name: "Distracción",    cost: 20, uses: 1,
    desc: "Resetea sospechas a 0",
    iconFrame: "clipboard" },
  { id: "urgent_call",    name: "Llamada urgente", cost: 15, uses: 1,
    desc: "El inspector sale de la sala por 20 segundos",
    iconFrame: "iv_bag" },
  { id: "mystery_shot",   name: "Inyección misteriosa", cost: 35, uses: 1,
    desc: "Daño masivo al paciente más cercano, sospechas aleatorias",
    iconFrame: "chemical_bottle" },
];

export const ALL_UPGRADES = [...PASSIVE_UPGRADES, ...ACTIVE_UPGRADES];

/** Pick N random upgrades from the pool (no duplicates with already owned) */
export function pickUpgrades(owned, count = 3) {
  const available = ALL_UPGRADES.filter(u => !owned.includes(u.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Upgrade state manager for a single run */
export class UpgradeState {
  constructor() {
    this.passive = new Map();  // id -> upgrade def
    this.active = [];          // [{...def, remaining}]
    this.freeActionUsed = false;
    this.freeAllergyUsed = false;
  }

  get ownedIds() {
    return [...this.passive.keys(), ...this.active.map(a => a.id)];
  }

  addPassive(upgrade) {
    this.passive.set(upgrade.id, upgrade);
  }

  addActive(upgrade) {
    this.active.push({ ...upgrade, remaining: upgrade.uses });
  }

  has(id) {
    return this.passive.has(id) || this.active.some(a => a.id === id);
  }

  getEffect(key) {
    for (const [, u] of this.passive) {
      if (u.effect && u.effect[key] !== undefined) return u.effect[key];
    }
    return undefined;
  }

  /** Use an active upgrade. Returns true if successful. */
  useActive(id) {
    const item = this.active.find(a => a.id === id && a.remaining > 0);
    if (!item) return false;
    item.remaining--;
    return true;
  }

  /** Reset per-room flags */
  enterRoom() {
    this.freeActionUsed = false;
    this.freeAllergyUsed = false;
  }
}
