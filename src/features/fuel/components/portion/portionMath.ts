export type Unit = 'g' | 'serv';

/** Ruler spacing per unit: value per snap step, tick intervals, and pixels per unit. */
export const SCALE = {
  g: { step: 1, minor: 5, mid: 25, major: 50, ppu: 2 },
  serv: { step: 0.25, minor: 0.25, mid: 0.5, major: 1, ppu: 88 },
} as const;

export const MAX_SERVINGS = 10;

export interface LastPortion {
  unit: Unit;
  amount: number;
}

/** The portion last logged for each food, kept so the dial opens where the athlete left it. */
export type PortionMemory = Record<string, LastPortion>;

export const snap = (v: number, unit: Unit) => Math.round(v / SCALE[unit].step) * SCALE[unit].step;

/** 1.25 becomes "1¼"; whole numbers and quarters only. */
export const formatServings = (n: number) => {
  const whole = Math.floor(n + 1e-9);
  const frac = Math.round((n - whole) * 4) / 4;
  const glyph = frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : '';
  if (!glyph) return String(whole);
  return whole === 0 ? glyph : `${whole}${glyph}`;
};

/** "1 burger (352g)" → "1 burger"; pure weights like "100g" → null. */
export function countLabel(serving?: string): string | null {
  if (!serving) return null;
  const stripped = serving.replace(/\(?\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*\)?/gi, '').trim();
  return /[a-z]/i.test(stripped) ? stripped : null;
}

/** The ruler's top end in grams: about five servings, between 500 g and 3 kg, or 2 kg with no serving size. */
export function maxGramsFor(servingG: number | null): number {
  return servingG ? Math.min(3000, Math.max(500, Math.ceil((servingG * 5) / 100) * 100)) : 2000;
}

/** How many servings (or per-100 g units) of the food's nutrition values the chosen amount is. */
export function nutritionScale(unit: Unit, shown: number, servingG: number | null): number {
  if (unit === 'serv') return shown;
  return servingG ? shown / servingG : shown / 100;
}

export interface PortionChip {
  id: string;
  text: string;
  unit: Unit;
  value: number;
}

/** The quick-pick buttons under the ruler, with the last logged portion first when it is not already one. */
export function portionChips(input: {
  unit: Unit;
  servingG: number | null;
  label: string | null;
  maxG: number;
  lastPortion: LastPortion | null;
}): PortionChip[] {
  const { unit, servingG, label, maxG, lastPortion } = input;
  const chips: PortionChip[] = [];
  if (unit === 'g' && servingG) {
    chips.push(
      { id: 'half', text: '½ serve', unit: 'g', value: snap(servingG / 2, 'g') },
      { id: 'one', text: label ? `1 · ${servingG}g` : `${servingG} g`, unit: 'g', value: servingG },
      { id: 'two', text: '2 serves', unit: 'g', value: Math.min(maxG, servingG * 2) },
    );
    if (servingG !== 100) chips.push({ id: '100', text: '100 g', unit: 'g', value: 100 });
  } else if (unit === 'serv') {
    [0.5, 1, 1.5, 2, 3].forEach((v) =>
      chips.push({ id: `s${v}`, text: `${formatServings(v)}×`, unit: 'serv', value: v }),
    );
  }
  if (
    lastPortion &&
    lastPortion.unit === unit &&
    !chips.some((c) => c.value === lastPortion.amount)
  ) {
    chips.unshift({
      id: 'last',
      text: `Last · ${unit === 'g' ? `${lastPortion.amount} g` : `${formatServings(lastPortion.amount)}×`}`,
      unit,
      value: lastPortion.amount,
    });
  }
  return chips;
}
