// Patient archetypes: personality + behaviour, assigned at random.
// Each one tweaks how a patient looks, moves, reacts and pays out, so no two
// rounds feel the same. Properties are read by Patient.js and GameScene.js.

export const PATIENT_TYPES = [
  { id: "normal", label: "", weight: 38, lines: [] },

  { id: "loud", label: "Escandaloso", weight: 12, loud: true,
    lines: ["¿Eso para qué es, doctor?", "¡Esto no me da buena espina!",
            "¡Me está usted matando!"] },

  { id: "restless", label: "Inquieto", weight: 12, wanders: true,
    speed: 30, pauseMs: 700,
    lines: ["No aguanto quieto.", "¿Cuándo me dan el alta?",
            "Necesito estirar las piernas."] },

  { id: "distrustful", label: "Desconfiado", weight: 10, watches: true,
    lines: ["Le estoy observando, doctor.", "Mmm… ¿seguro que es eso?",
            "Aquí pasa algo raro."] },

  { id: "vip", label: "VIP", weight: 6, marked: true, xpMul: 2.5,
    deathSuspBonus: 18,
    lines: ["¿Sabe usted quién soy yo?", "Exijo la mejor atención.",
            "Mi abogado conoce a su jefe."] },

  { id: "hypochondriac", label: "Hipocondríaco", weight: 12, xpMul: 1.2,
    lines: ["Doctor, me duele todo.", "Creo que me muero, ¿verdad que sí?",
            "¿No será algo grave?"] },

  { id: "sedated", label: "Sedado", weight: 10, sedated: true, xpMul: 0.8,
    lines: ["zzz…", "mmh…"] },
];

/** Weighted random archetype. */
export function pickPatientType() {
  const total = PATIENT_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of PATIENT_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return PATIENT_TYPES[0];
}
