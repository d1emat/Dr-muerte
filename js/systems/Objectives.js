// Per-run objective modifiers. They tweak the rules so each level plays
// differently without changing the core "treat them all" win condition.

export const OBJECTIVES = [
  { id: "normal", name: "Turno normal",
    desc: "Atiende a todos los pacientes sin que te pillen." },
  { id: "tense", name: "Comité de vigilancia",
    desc: "Hoy TODO levanta más sospechas. Sé impecable.",
    suspMul: 1.6 },
  { id: "no_witnesses", name: "Cero testigos",
    desc: "Si alguien te ve haciendo algo turbio, estás acabado.",
    witnessInstant: true },
  { id: "timed", name: "Contrarreloj",
    desc: "Termina antes de que llegue la auditoría sorpresa.",
    timeLimitMs: 150000 },
  { id: "vip", name: "Paciente VIP",
    desc: "Hay un paciente importante (★): x3 XP, pero su muerte llama la atención.",
    vip: true },
  { id: "frugal", name: "Bisturí de oro",
    desc: "Tus 'errores' rinden más XP… pero levantan más sospecha.",
    suspMul: 1.3, xpMul: 1.5 },
];

/** Level 1 always teaches with a normal shift; later levels roll a modifier. */
export function pickObjective(levelId) {
  if (levelId <= 1) return OBJECTIVES[0];
  const pool = OBJECTIVES.slice(1);
  return pool[Math.floor(Math.random() * pool.length)];
}
