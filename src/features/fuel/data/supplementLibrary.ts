import type { SupplementEvidence, SupplementTiming, SupplementUnit } from '../services/fuelCloud';

export interface LibrarySupplement {
  name: string;
  aliases: string[];
  category: 'Performance' | 'Health' | 'Recovery' | 'Hydration';
  amount: number;
  unit: SupplementUnit;
  /** When set, the dose scales with body weight (amount is used if weight is unknown). */
  perKg?: number;
  timing: SupplementTiming;
  evidence: SupplementEvidence;
  caffeineMgPerUnit?: number;
  note: string;
}

export const SUPPLEMENT_LIBRARY: LibrarySupplement[] = [
  { name: 'Creatine monohydrate', aliases: ['creatine'], category: 'Performance', amount: 5, unit: 'g', timing: 'Anytime', evidence: 'strong', note: 'Daily, any time. Timing matters less than consistency.' },
  { name: 'Caffeine', aliases: ['coffee', 'stim'], category: 'Performance', amount: 200, unit: 'mg', perKg: 3, timing: 'Pre-Workout', evidence: 'strong', caffeineMgPerUnit: 1, note: '3 mg/kg about 60 min before training. Avoid within 8 h of sleep.' },
  { name: 'Beta-alanine', aliases: ['beta alanine', 'carnosine'], category: 'Performance', amount: 3.2, unit: 'g', timing: 'Anytime', evidence: 'strong', note: 'Split doses with meals to limit tingling. Builds over 4+ weeks.' },
  { name: 'Sodium bicarbonate', aliases: ['bicarb', 'baking soda'], category: 'Performance', amount: 20, unit: 'g', perKg: 0.3, timing: 'Pre-Workout', evidence: 'strong', note: '0.3 g/kg 60 to 180 min before high-intensity work. Trial in training first.' },
  { name: 'Beetroot juice (nitrate)', aliases: ['beetroot', 'nitrate', 'beet'], category: 'Performance', amount: 70, unit: 'ml', timing: 'Pre-Workout', evidence: 'strong', note: 'Concentrated shot 2 to 3 h before endurance sessions.' },
  { name: 'Vitamin D3', aliases: ['vitamin d', 'd3', 'cholecalciferol'], category: 'Health', amount: 1000, unit: 'IU', timing: 'Morning', evidence: 'moderate', note: 'Worth it when blood levels are low. Take with a meal containing fat.' },
  { name: 'Omega-3 (EPA + DHA)', aliases: ['omega 3', 'fish oil', 'epa', 'dha'], category: 'Health', amount: 2, unit: 'caps', timing: 'Anytime', evidence: 'moderate', note: 'Take with food. Check the label for EPA + DHA per capsule.' },
  { name: 'Magnesium glycinate', aliases: ['magnesium', 'mag'], category: 'Recovery', amount: 300, unit: 'mg', timing: 'Evening', evidence: 'moderate', note: 'Evening dose. Useful when dietary intake is low.' },
  { name: 'Iron', aliases: ['ferritin', 'ferrous'], category: 'Health', amount: 18, unit: 'mg', timing: 'Morning', evidence: 'moderate', note: 'Only with confirmed low ferritin. Take away from coffee and calcium.' },
  { name: 'Electrolyte tablet', aliases: ['electrolytes', 'hydration tab', 'salt tab', 'nuun'], category: 'Hydration', amount: 1, unit: 'tabs', timing: 'Anytime', evidence: 'strong', note: 'For long or hot sessions and heavy sweaters.' },
  { name: 'Multivitamin', aliases: ['multi', 'multivit'], category: 'Health', amount: 1, unit: 'tabs', timing: 'Morning', evidence: 'limited', note: 'Insurance when the diet is restricted or energy intake is low.' },
  { name: 'Probiotic', aliases: ['probiotics', 'gut'], category: 'Health', amount: 1, unit: 'caps', timing: 'Morning', evidence: 'moderate', note: 'May reduce gut and upper respiratory issues in heavy training blocks.' },
  { name: 'Zinc', aliases: ['zinc picolinate'], category: 'Health', amount: 15, unit: 'mg', timing: 'Evening', evidence: 'limited', note: 'Short courses at the onset of a cold. Not long-term high doses.' },
  { name: 'Vitamin C', aliases: ['ascorbic acid', 'vit c'], category: 'Health', amount: 500, unit: 'mg', timing: 'Morning', evidence: 'limited', note: 'Avoid chronic high doses right after training; they can blunt adaptation.' },
  { name: 'Tart cherry', aliases: ['cherry', 'montmorency'], category: 'Recovery', amount: 30, unit: 'ml', timing: 'Evening', evidence: 'moderate', note: 'Twice daily around hard competition blocks.' },
  { name: 'Collagen + vitamin C', aliases: ['collagen', 'gelatin'], category: 'Recovery', amount: 15, unit: 'g', timing: 'Pre-Workout', evidence: 'limited', note: '30 to 60 min before loading tendons or ligaments.' },
  { name: 'Ashwagandha', aliases: ['ksm-66', 'withania'], category: 'Recovery', amount: 600, unit: 'mg', timing: 'Evening', evidence: 'limited', note: 'Check medications first. Not for pregnancy or thyroid conditions.' },
  { name: 'L-theanine', aliases: ['theanine'], category: 'Performance', amount: 200, unit: 'mg', timing: 'Pre-Workout', evidence: 'limited', note: 'Often paired with caffeine to smooth the stimulant effect.' },
  { name: 'Citrulline malate', aliases: ['citrulline'], category: 'Performance', amount: 8, unit: 'g', timing: 'Pre-Workout', evidence: 'limited', note: '60 min before training.' },
  { name: 'HMB', aliases: ['hydroxymethylbutyrate'], category: 'Recovery', amount: 3, unit: 'g', timing: 'Anytime', evidence: 'limited', note: 'Most relevant for untrained lifters or during a calorie deficit.' },
  { name: 'Glycerol', aliases: ['glycerin'], category: 'Hydration', amount: 70, unit: 'g', perKg: 1, timing: 'Pre-Workout', evidence: 'moderate', note: '1 g/kg with fluid to hyperhydrate before events in heat.' },
  { name: 'Pre-workout blend', aliases: ['preworkout', 'pre workout', 'pre'], category: 'Performance', amount: 1, unit: 'scoop', timing: 'Pre-Workout', evidence: 'limited', caffeineMgPerUnit: 200, note: 'Check the label for caffeine per scoop and edit if it differs.' },
];

export const EVIDENCE_COPY: Record<SupplementEvidence, { label: string; className: string }> = {
  strong: { label: 'Strong evidence', className: 'text-emerald-500 border-emerald-600/40' },
  moderate: { label: 'Moderate evidence', className: 'text-amber-500 border-amber-600/40' },
  limited: { label: 'Limited evidence', className: 'text-o1-muted border-white/[0.12]' },
};

export const CAFFEINE_DAILY_LIMIT_MG = 400;

const ROUNDING: Partial<Record<SupplementUnit, number>> = { mg: 10, g: 0.5, ml: 5 };

export function scaledAmount(entry: LibrarySupplement, weightKg: number | null): number {
  if (!entry.perKg || !weightKg || weightKg <= 0) return entry.amount;
  const step = ROUNDING[entry.unit] ?? 1;
  return Math.round((entry.perKg * weightKg) / step) * step;
}

export function formatDose(amount: number | undefined, unit: SupplementUnit | undefined): string {
  if (amount == null || !unit) return '1 serving';
  const n = Number.isInteger(amount) ? amount.toLocaleString() : String(Math.round(amount * 100) / 100);
  return `${n} ${unit}`;
}

export function searchLibrary(query: string): LibrarySupplement[] {
  const q = query.trim().toLowerCase();
  if (!q) return SUPPLEMENT_LIBRARY;
  return SUPPLEMENT_LIBRARY.filter(
    (s) => s.name.toLowerCase().includes(q) || s.aliases.some((a) => a.includes(q)) || s.category.toLowerCase().includes(q),
  );
}
