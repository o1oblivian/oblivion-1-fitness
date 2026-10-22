import React, { useState } from 'react';
import { SegmentedTowers, SegmentedTower } from '../../../components/ui/SegmentedTowers';
import { MacroTotals, WeekDayEntry, weeklyTrajectory } from '../utils/fuelMath';

interface FuelWeekSlideProps {
  days: WeekDayEntry[];
  targets: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
  };
}

type TowerTheme = { slabs: string[]; accent: string };

const STATE_THEME: Record<'on' | 'under' | 'over' | 'today', TowerTheme> = {
  on: { slabs: ['#059669', '#10B981'], accent: '#10B981' },
  under: { slabs: ['#C9A000', '#F7C600'], accent: '#F7C600' },
  over: { slabs: ['#A30F16', '#C4121A'], accent: '#C4121A' },
  today: { slabs: ['#CFCCC1', '#EAE8DF'], accent: '#EAE8DF' },
};

const STATUS_COPY = {
  on_track: { label: 'On track', className: 'text-emerald-500' },
  under: { label: 'Under', className: 'text-amber-500' },
  over: { label: 'Over', className: 'text-o1-crimson' },
} as const;

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmt(n: number | null, unit = ''): string {
  return n == null ? '--' : `${Math.round(n).toLocaleString()}${unit}`;
}

function signed(n: number): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toLocaleString()}`;
}

export const FuelWeekSlide: React.FC<FuelWeekSlideProps> = ({ days, targets }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const t = weeklyTrajectory(days, targets);
  const first = parseKey(days[0].dateKey);
  const last = parseKey(days[days.length - 1].dateKey);
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  const range =
    first.getMonth() === last.getMonth()
      ? `${month(first)} ${first.getDate()}–${last.getDate()}`
      : `${month(first)} ${first.getDate()} – ${month(last)} ${last.getDate()}`;

  const towers: SegmentedTower[] = days.map((d, i) => {
    const kcal = d.totals && d.totals.calories > 0 ? d.totals.calories : null;
    const state = t.dayStates[i];
    const theme =
      d.isToday && state !== 'over'
        ? STATE_THEME.today
        : state === 'empty'
          ? STATE_THEME.on
          : STATE_THEME[state];
    return {
      key: d.dateKey,
      label: parseKey(d.dateKey).toLocaleDateString(undefined, { weekday: 'narrow' }),
      value: kcal,
      slabs: theme.slabs,
      accent: theme.accent,
      ariaValue: kcal != null ? `${kcal.toLocaleString()} kcal` : 'nothing logged',
    };
  });

  const selected = selectedKey ? days.find((d) => d.dateKey === selectedKey) : null;
  const selectedTotals: MacroTotals | null = selected?.totals ?? null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="o1-unread text-2xl font-semibold tabular-nums leading-none">
            {fmt(selected ? (selectedTotals?.calories ?? null) : t.avgCalories)}
          </span>
          <span className="text-o1-label text-o1-muted truncate">
            {selected
              ? 'kcal'
              : `avg kcal${targets.calories ? ` / ${targets.calories.toLocaleString()}` : ''}`}
          </span>
        </div>
        <span
          className={`shrink-0 text-o1-label ${selected ? 'text-o1-text font-medium' : 'text-o1-muted'}`}
        >
          {selected
            ? parseKey(selected.dateKey).toLocaleDateString(undefined, { weekday: 'long' })
            : range}
        </span>
      </div>
      <p
        className={`text-o1-label tabular-nums mt-1 text-o1-muted truncate ${selected ? 'o1-unread' : ''}`}
      >
        {selected ? (
          selectedTotals ? (
            `${fmt(selectedTotals.protein)}g P · ${fmt(selectedTotals.carbs)}g C · ${fmt(selectedTotals.fats)}g F`
          ) : (
            'Nothing logged'
          )
        ) : t.balancePerDay != null && t.status ? (
          <>
            {signed(t.balancePerDay)} kcal/day ·{' '}
            <span className={STATUS_COPY[t.status].className}>{STATUS_COPY[t.status].label}</span>
            {' · '}
            {t.loggedDays} full {t.loggedDays === 1 ? 'day' : 'days'}
          </>
        ) : t.loggedDays === 0 ? (
          'Log a full day to see your trend'
        ) : (
          'Set a calorie target to see your balance'
        )}
      </p>

      <div className="mt-2">
        <SegmentedTowers
          towers={towers}
          tubeHeightPx={57}
          maxTubeWidthPx={20}
          reference={
            targets.calories
              ? {
                  value: targets.calories,
                  label: `TARGET ${targets.calories.toLocaleString()} kcal`,
                }
              : null
          }
          activeKey={selectedKey ?? days[days.length - 1].dateKey}
          onSelect={(key) => setSelectedKey((cur) => (cur === key ? null : key))}
          ariaLabel="Calories by day, last 7 days"
        />
      </div>

      <dl className="o1-unread mt-auto pt-2 space-y-1 text-o1-label tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-o1-crimson font-medium w-14 shrink-0">Protein</dt>
          <dd className="text-o1-text">
            {targets.protein && t.proteinDays > 0
              ? `${t.proteinHits}/${t.proteinDays} days hit`
              : '--'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-amber-500 font-medium w-14 shrink-0">Carbs</dt>
          <dd className="text-o1-text">
            {fmt(t.avgCarbs, 'g')}
            <span className="text-o1-muted"> / {fmt(targets.carbs, 'g')}</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-emerald-500 font-medium w-14 shrink-0">Fats</dt>
          <dd className="text-o1-text">
            {fmt(t.avgFats, 'g')}
            <span className="text-o1-muted"> / {fmt(targets.fats, 'g')}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
};
