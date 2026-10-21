import { round1 } from '../../../../utils/mathUtils';
import type { MacroBudget } from '../../data/mealBudget';

interface PortionMacrosProps {
  /** Macros in grams per one unit of nutrition scale. */
  food: { protein: number; carbs: number; fats: number };
  /** How many of those units the chosen portion is. */
  scale: number;
  /** What is left today; null when targets are not calibrated. */
  budget?: MacroBudget | null;
}

/** Protein, carbs, and fat for the chosen portion, each with its share of what is left today. */
export function PortionMacros({ food, scale, budget }: PortionMacrosProps) {
  const macros = [
    {
      key: 'P',
      name: 'Protein',
      value: round1(food.protein * scale),
      left: budget?.protein,
      color: 'bg-o1-crimson',
      text: 'text-o1-crimson',
    },
    {
      key: 'C',
      name: 'Carbs',
      value: round1(food.carbs * scale),
      left: budget?.carbs,
      color: 'bg-amber-500',
      text: 'text-amber-500',
    },
    {
      key: 'F',
      name: 'Fat',
      value: round1(food.fats * scale),
      left: budget?.fats,
      color: 'bg-emerald-500',
      text: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {macros.map((m) => {
        const hasBudget = budget != null && m.left != null && m.left > 0;
        const share = hasBudget ? m.value / (m.left as number) : 0;
        const over = hasBudget && share > 1;
        return (
          <div key={m.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-o1-label font-semibold text-o1-muted">{m.name}</span>
              <span className={`text-xs font-bold tabular-nums ${m.text}`}>{m.value}g</span>
            </div>
            {hasBudget && (
              <>
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${over ? 'bg-amber-500' : m.color} transition-[width] duration-150`}
                    style={{ width: `${Math.min(100, share * 100)}%` }}
                  />
                </div>
                <p
                  className={`mt-1 text-o1-label tabular-nums ${over ? 'text-amber-500' : 'text-o1-muted'}`}
                >
                  {over
                    ? `+${round1(m.value - (m.left as number))}g over`
                    : `${Math.round(share * 100)}% of left`}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
