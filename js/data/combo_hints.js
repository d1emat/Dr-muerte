// Vague clinical notes placed on furniture in levels.
// hintId maps to a combo id in medical.js COMBOS.

export const COMBO_HINTS = [
  { id: "morphine_sedative",
    text: "Nota: nunca mezclar sedantes con opiáceos. El paciente no despertará." },
  { id: "potassium_weak_heart",
    text: "Potasio IV + cardiopatía = paro. Lo vimos el mes pasado." },
  { id: "insulin_healthy",
    text: "Insulina sin diabetes confirmada es negligencia grave." },
  { id: "adrenaline_weak_heart",
    text: "Adrenalina en cardiópatas débiles: receta para desastre." },
  { id: "anticoagulant_aspirin",
    text: "Doble anticoagulación: la sangre no perdona." },
  { id: "anesthetic_sedative",
    text: "Anestesia + sedante = coma profundo. Ojalá temporal." },
  { id: "glucose_diabetes",
    text: "Glucosa a diabéticos descontrolados: cuidado con la dosis." },
  { id: "potassium_insulin",
    text: "Potasio e insulina juntos alteran electrolitos peligrosamente." },
];

export function hintForCombo(comboId) {
  return COMBO_HINTS.find((h) => h.id === comboId);
}
