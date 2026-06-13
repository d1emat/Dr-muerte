// Usable room objects — covert weapons with different risk profiles.

export const ROOM_OBJECTS = {
  coffee: {
    id: "coffee", label: "Café envenenado", icon: "☕",
    dmg: 18, suspicion: 3, stealthy: true,
    msg: "Un café 'de cortesía'. Qué amable eres.",
  },
  cable: {
    id: "cable", label: "Cable eléctrico", icon: "⚡",
    dmg: 35, suspicion: 12, stealthy: false,
    msg: "Accidente eléctrico en la cama. Qué mala suerte.",
  },
  thermostat: {
    id: "thermostat", label: "Termostato", icon: "🌡️",
    dmg: 8, suspicion: 2, stealthy: true, drain: 0.4,
    msg: "Demasiado frío… o demasiado calor. El cuerpo protesta.",
  },
  window: {
    id: "window", label: "Ventana abierta", icon: "🪟",
    dmg: 22, suspicion: 5, stealthy: true,
    msg: "Corriente de aire 'inesperada'. El paciente tirita.",
  },
  pills: {
    id: "pills", label: "Pastillas sueltas", icon: "💊",
    dmg: 20, suspicion: 6, stealthy: false,
    msg: "Unas pastillas 'olvidadas' en la mesilla.",
  },
  syringe: {
    id: "syringe", label: "Jeringuilla", icon: "💉",
    dmg: 30, suspicion: 10, stealthy: false,
    msg: "Inyección 'accidental'. El cuerpo reacciona mal.",
  },
};

/** Pick 1-2 random objects for a level based on difficulty. */
export function pickRoomObjects(count, seed = 0) {
  const ids = Object.keys(ROOM_OBJECTS);
  const rng = mulberry32(seed || Date.now());
  const n = Math.min(count, ids.length);
  const picked = [];
  const pool = [...ids];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.map((id) => ROOM_OBJECTS[id]);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
