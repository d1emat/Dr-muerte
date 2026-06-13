// Medical simulation: conditions, medicines, interactions, realistic outcomes.

import { COSTS, TREATMENT } from "../config.js";

export const CONDITIONS = {
  weak_heart:         { label: "cardiopatía",      symptom: "pulso irregular y fatiga" },
  diabetes:           { label: "diabetes",         symptom: "sed constante y mareos" },
  low_blood_pressure: { label: "hipotensión",      symptom: "palidez y debilidad extrema" },
  fever:              { label: "fiebre alta",      symptom: "sudores y temblores" },
  infection:          { label: "infección",        symptom: "herida inflamada y fiebre" },
  allergy:            { label: "reacción alérgica", symptom: "ronchas e hinchazón" },
  pain:               { label: "dolor agudo",      symptom: "dolor continuo sin alivio" },
  arrhythmia:         { label: "arritmia",         symptom: "palpitaciones irregulares" },
  dehydration:        { label: "deshidratación",   symptom: "labios secos y confusión" },
};

/**
 * Each medicine:
 *   correctFor    — condition it cures
 *   contraindications — real conditions where it's dangerous { dmg, susp, note }
 *   plausibleFor  — off-label but defensible (low harm, low suspicion)
 *   wrongDmg      — base harm when irrelevant
 *   wrongSeverity — mild | moderate | severe (scales harm & suspicion)
 */
export const MEDICINES = [
  { id: "aspirin", label: "Aspirina 100 mg", cat: "PILLS",
    correctFor: "fever", wrongDmg: 4, wrongSeverity: "mild",
    plausibleFor: ["pain"],
    contraindications: {
      weak_heart: { dmg: 18, susp: 8,
        note: "Aspirina en cardiópata: riesgo hemorrágico." },
    } },
  { id: "paracetamol", label: "Paracetamol 500 mg", cat: "PILLS",
    correctFor: "pain", wrongDmg: 3, wrongSeverity: "mild",
    plausibleFor: ["fever"],
    contraindications: {
      dehydration: { dmg: 12, susp: 4,
        note: "Paracetamol en hepatopatía/deshidratación severa: hepatotóxico." },
    } },
  { id: "antibiotic", label: "Amoxicilina 500 mg", cat: "PILLS",
    correctFor: "infection", wrongDmg: 6, wrongSeverity: "moderate",
    plausibleFor: [],
    contraindications: {
      allergy: { dmg: 22, susp: 12,
        note: "Antibiótico con alergia activa: reacción cruzada." },
    } },
  { id: "antihistamine", label: "Loratadina 10 mg", cat: "PILLS",
    correctFor: "allergy", wrongDmg: 2, wrongSeverity: "mild",
    plausibleFor: [] },
  { id: "sedative", label: "Diazepam 5 mg", cat: "PILLS",
    correctFor: null, wrongDmg: 8, wrongSeverity: "moderate",
    plausibleFor: ["pain"],
    contraindications: {
      low_blood_pressure: { dmg: 28, susp: 10,
        note: "Sedante con hipotensión: colapso inminente." },
      weak_heart: { dmg: 20, susp: 8,
        note: "Depresión respiratoria en cardiópata." },
    } },
  { id: "insulin", label: "Insulina rápida 10 UI", cat: "INJECTIONS",
    correctFor: "diabetes", wrongDmg: 0, wrongSeverity: "severe",
    plausibleFor: [],
    contraindications: {} },
  { id: "adrenaline", label: "Adrenalina 1 mg IV", cat: "INJECTIONS",
    correctFor: "low_blood_pressure", wrongDmg: 12, wrongSeverity: "severe",
    plausibleFor: ["allergy"],
    contraindications: {
      arrhythmia: { dmg: 35, susp: 14,
        note: "Adrenalina con arritmia: taquicardia letal." },
      weak_heart: { dmg: 32, susp: 12,
        note: "Adrenalina en cardiópata: infarto agudo." },
    } },
  { id: "antiarrhythmic", label: "Amiodarona 150 mg", cat: "INJECTIONS",
    correctFor: "arrhythmia", wrongDmg: 10, wrongSeverity: "moderate",
    plausibleFor: ["weak_heart"],
    contraindications: {
      low_blood_pressure: { dmg: 24, susp: 9,
        note: "Amiodarona hunde más la tensión." },
    } },
  { id: "morphine", label: "Morfina 10 mg", cat: "INJECTIONS",
    correctFor: null, wrongDmg: 10, wrongSeverity: "moderate",
    plausibleFor: ["pain"],
    contraindications: {
      low_blood_pressure: { dmg: 30, susp: 11,
        note: "Morfina + hipotensión: shock." },
      weak_heart: { dmg: 22, susp: 9,
        note: "Depresión respiratoria en cardiópata." },
    } },
  { id: "anesthetic", label: "Propofol 20 mg", cat: "INJECTIONS",
    correctFor: null, wrongDmg: 14, wrongSeverity: "severe",
    plausibleFor: [],
    contraindications: {
      weak_heart: { dmg: 38, susp: 13,
        note: "Anestésico en cardiópata: paro cardiaco." },
      low_blood_pressure: { dmg: 28, susp: 10,
        note: "Propofol colapsa la tensión arterial." },
    } },
  { id: "anticoagulant", label: "Heparina 5000 UI", cat: "IV",
    correctFor: "weak_heart", wrongDmg: 10, wrongSeverity: "moderate",
    plausibleFor: [],
    contraindications: {
      infection: { dmg: 16, susp: 7,
        note: "Anticoagulante con hemorragia activa: sangrado incontrolable." },
    } },
  { id: "saline", label: "Suero fisiológico 500 ml", cat: "IV",
    correctFor: "dehydration", wrongDmg: 0, wrongSeverity: "mild",
    plausibleFor: ["low_blood_pressure"] },
  { id: "diuretic", label: "Furosemida 40 mg", cat: "IV",
    correctFor: null, wrongDmg: 10, wrongSeverity: "moderate",
    plausibleFor: ["dehydration"],
    contraindications: {
      low_blood_pressure: { dmg: 30, susp: 11,
        note: "Diurético con hipotensión: deshidratación fatal." },
      dehydration: { dmg: 26, susp: 9,
        note: "Más diuresis en un paciente ya deshidratado." },
    } },
  { id: "glucose", label: "Glucosa 10% 250 ml", cat: "IV",
    correctFor: null, wrongDmg: 6, wrongSeverity: "moderate",
    plausibleFor: ["dehydration"],
    contraindications: {
      diabetes: { dmg: 28, susp: 10,
        note: "Glucosa IV en diabético: hiperglucemia severa." },
    } },
  { id: "potassium", label: "KCl 20 mEq IV", cat: "IV",
    correctFor: null, wrongDmg: 18, wrongSeverity: "severe",
    plausibleFor: [],
    contraindications: {
      weak_heart: { dmg: 45, susp: 15,
        note: "Potasio en cardiópata: arritmia maligna fulminante." },
      arrhythmia: { dmg: 40, susp: 14,
        note: "Potasio con arritmia: paro cardiaco." },
    } },
];

export const MED_LABEL = Object.fromEntries(MEDICINES.map((m) => [m.id, m.label]));

const SEVERITY_MUL = { mild: 0.6, moderate: 1.0, severe: 1.4 };
const SEVERITY_SUSP = { mild: 2, moderate: 5, severe: 9 };

export const COMBOS = [
  { id: "morphine_sedative", name: "Cóctel del sueño eterno",
    meds: ["morphine", "sedative"], baseDmg: 35,
    note: "Depresión respiratoria por opiáceo + benzodiacepina." },
  { id: "potassium_weak_heart", name: "Adiós con potasio",
    meds: ["potassium"], condition: "weak_heart", baseDmg: 70,
    note: "Paro cardiaco por hiperpotasemia." },
  { id: "insulin_healthy", name: "Bajón de azúcar",
    meds: ["insulin"], conditionAbsent: "diabetes", baseDmg: 30,
    note: "Hipoglucemia severa en paciente no diabético." },
  { id: "sedative_low_bp", name: "Siesta sin retorno",
    meds: ["sedative"], condition: "low_blood_pressure", baseDmg: 45,
    note: "Colapso circulatorio por sedación." },
  { id: "adrenaline_weak_heart", name: "Corazón al límite",
    meds: ["adrenaline"], condition: "weak_heart", baseDmg: 40,
    note: "Estrés miocárdico agudo." },
  { id: "anticoagulant_aspirin", name: "Sangre que no para",
    meds: ["anticoagulant", "aspirin"], baseDmg: 38,
    note: "Doble antiagregación: hemorragia interna." },
  { id: "adrenaline_morphine", name: "Acelerón y freno",
    meds: ["adrenaline", "morphine"], baseDmg: 42,
    note: "Estimulante + depresor: caos autonómico." },
  { id: "potassium_insulin", name: "Tormenta de electrolitos",
    meds: ["potassium", "insulin"], baseDmg: 50,
    note: "Desplazamiento iónico masivo." },
  { id: "morphine_low_bp", name: "Tensión bajo cero",
    meds: ["morphine"], condition: "low_blood_pressure", baseDmg: 40,
    note: "Vasodilatación sobre hipotensión." },
  { id: "glucose_diabetes", name: "Subidón de azúcar",
    meds: ["glucose"], condition: "diabetes", baseDmg: 35,
    note: "Hiperglucemia aguda." },
  { id: "adrenaline_arrhythmia", name: "Corazón desbocado",
    meds: ["adrenaline"], condition: "arrhythmia", baseDmg: 48,
    note: "Taquicardia ventricular." },
  { id: "anesthetic_sedative", name: "Doble apagón",
    meds: ["anesthetic", "sedative"], baseDmg: 52,
    note: "Depresión del SNC combinada." },
  { id: "diuretic_low_bp", name: "Tensión vaciada",
    meds: ["diuretic"], condition: "low_blood_pressure", baseDmg: 42,
    note: "Hipovolemia crítica." },
  { id: "anesthetic_weak_heart", name: "Anestesia traicionera",
    meds: ["anesthetic"], condition: "weak_heart", baseDmg: 46,
    note: "Miocardio deprimido por anestésico." },
];

export function matchCombo(patient, med) {
  for (const c of COMBOS) {
    if (!c.meds.includes(med.id)) continue;
    if (!c.meds.every((m) => patient.wasGiven(m))) continue;
    if (c.condition && !patient.hasCondition(c.condition)) continue;
    if (c.conditionAbsent && patient.hasCondition(c.conditionAbsent)) continue;
    return c;
  }
  return null;
}

export const DOSES = [
  { key: "low",    label: "Dosis terapéutica baja", factor: 0.5 },
  { key: "normal", label: "Dosis estándar",         factor: 1.0 },
  { key: "high",   label: "Sobredosis",             factor: 1.6 },
];

export const MENU_CATEGORIES = [
  { key: "PILLS",      label: "PASTILLAS",   icon: "pills_bottle" },
  { key: "INJECTIONS", label: "INYECCIONES", icon: "syringe" },
  { key: "IV",         label: "VÍA IV",      icon: "iv_bag" },
  { key: "DIAG",       label: "DIAGNÓSTICO", icon: "clipboard" },
  { key: "LEAVE",      label: "SALIR",       icon: null },
];

export const ALL_CONDITIONS = Object.keys(CONDITIONS);

/** Real active conditions (ignores false diagnosis). */
function realActive(patient) {
  return patient.conditions.filter((c) => !patient.treated.has(c));
}

/** Conditions the doctor is treating against (the real active ones). */
function treatTargets(patient) {
  return realActive(patient);
}

/**
 * Realistic treatment outcome before combos/allergies.
 * Returns { type, dmg, heal, susp, note }.
 */
export function evaluateMed(patient, med, dose, priorMedCount) {
  const real = realActive(patient);
  const targets = treatTargets(patient);
  const sev = med.wrongSeverity || "moderate";
  const sevMul = SEVERITY_MUL[sev] || 1;
  const doseHigh = dose >= 1.5;
  const doseMul = dose;

  // Contraindications always checked against REAL conditions
  if (med.contraindications) {
    for (const c of real) {
      const ci = med.contraindications[c];
      if (ci) {
        const dmg = Math.round(ci.dmg * doseMul * (doseHigh ? 1.3 : 1));
        const susp = ci.susp + (doseHigh ? 4 : 0);
        return { type: "contraindicated", dmg, heal: 0, susp, note: ci.note };
      }
    }
  }

  // Correct for the target condition
  if (med.correctFor && targets.includes(med.correctFor)) {
    const heal = Math.round(TREATMENT.healOnCorrect * doseMul);
    return {
      type: "correct",
      dmg: 0, heal, susp: 0,
      note: doseHigh
        ? "Dosis correcta pero alta. Efectivo, aunque arriesgado."
        : "Tratamiento acorde al cuadro clínico.",
    };
  }

  // Off-label but medically plausible (low suspicion)
  if (med.plausibleFor?.some((c) => real.includes(c))) {
    const dmg = Math.round(3 * doseMul);
    return {
      type: "plausible",
      dmg, heal: 0, susp: 2 + (doseHigh ? 2 : 0),
      note: "No es lo indicado, pero podría defenderse ante un comité.",
    };
  }

  // Harmless IV fluids etc.
  if (med.wrongDmg === 0 && med.id !== "insulin") {
    return {
      type: "neutral",
      dmg: 0, heal: dose <= 0.5 ? 2 : 0, susp: 1,
      note: "Inocuo en principio. El paciente no empeora… por ahora.",
    };
  }

  // Clearly wrong prescription
  const poly = priorMedCount * 3;
  const base = med.wrongDmg + poly;
  const dmg = Math.round(base * sevMul * doseMul * (doseHigh ? 1.25 : 1));
  const susp = SEVERITY_SUSP[sev] + (doseHigh ? 4 : 0) + Math.min(poly, 6);
  const notes = {
    mild: "Error menor. Nadie debería notarlo.",
    moderate: "Medicación inadecuada para este cuadro.",
    severe: "Prescripción peligrosa e indefendible.",
  };
  return {
    type: "wrong",
    dmg, heal: 0, susp,
    note: poly > 0
      ? `${notes[sev]} Polifarmacia empeora el riesgo.`
      : notes[sev],
  };
}

/** Preview text for treatment menu (with luxury stethoscope upgrade). */
export function medEffectHint(med, patient) {
  const ev = evaluateMed(patient, med, 1.0, patient.given.size);
  if (ev.type === "correct") return `+${ev.heal} salud`;
  if (ev.dmg > 0) return `-${ev.dmg} salud`;
  if (ev.type === "neutral") return "inocuo";
  return "incierto";
}
