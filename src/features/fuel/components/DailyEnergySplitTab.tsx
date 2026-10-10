import React from 'react';

interface DailyEnergySplitTabProps {
  proteinG: number;
  proteinTarget: number;
  carbsG: number;
  carbsTarget: number;
  fatsG: number;
  fatsTarget: number;
  dailyTargetKcal: number;
  eatenKcal?: number;
  burnedKcal?: number;
}

function MacroWell({
  label,
  grams,
  target,
  color,
  track,
}: {
  label: string;
  grams: number;
  target: number;
  color: string;
  track: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((grams / target) * 100)) : 0;
  const left = Math.max(0, Math.round(target - grams));
  return (
    <div className={`rounded-2xl p-2.5 ${track}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold tracking-wide text-neutral-400">
          {label}
        </span>
        <span className="text-[10px] font-mono font-semibold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <p className="text-[15px] font-semibold tabular-nums text-white leading-none">
        {Math.round(grams)}
        <span className="text-[10px] font-medium text-neutral-400 ml-0.5">g</span>
      </p>
      <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1 text-[9px] text-neutral-400 tabular-nums">{left}g left · {target}g</p>
    </div>
  );
}

export const DailyEnergySplitTab: React.FC<DailyEnergySplitTabProps> = ({
  proteinG,
  proteinTarget,
  carbsG,
  carbsTarget,
  fatsG,
  fatsTarget,
  dailyTargetKcal,
  eatenKcal = 0,
  burnedKcal = 0,
}) => {
  const effectiveTargetKcal = dailyTargetKcal > 0 ? dailyTargetKcal : 2200;
  const consumedKcal = eatenKcal > 0 ? eatenKcal : proteinG * 4 + carbsG * 4 + fatsG * 9;
  const remainingKcal = Math.max(0, effectiveTargetKcal + burnedKcal - consumedKcal);
  const budgetPct = Math.min(100, Math.round((consumedKcal / effectiveTargetKcal) * 100));

  const radius = 46;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, budgetPct)) / 100) * circumference;

  return (
    <div className="space-y-2.5 select-none">
      <div className="flex items-center gap-3">
        <div className="relative w-[108px] h-[108px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 116 116">
            <circle
              cx="58"
              cy="58"
              r={radius}
              className="text-white/10"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {consumedKcal > 0 && (
              <circle
                cx="58"
                cy="58"
                r={radius}
                stroke="#C4121A"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums text-white leading-none">
              {Math.round(remainingKcal).toLocaleString()}
            </span>
            <span className="text-[9px] tracking-wider text-neutral-400 mt-0.5">left</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-1.5">
          <div className="rounded-xl bg-o1-well border border-white/[0.07] px-1.5 py-2 text-center">
            <p className="text-[9px] tracking-wide text-neutral-400">Eaten</p>
            <p className="text-[13px] font-semibold tabular-nums text-white">
              {Math.round(consumedKcal)}
            </p>
          </div>
          <div className="rounded-xl bg-red-950/20 border border-red-900/30 px-1.5 py-2 text-center">
            <p className="text-[9px] tracking-wide text-o1-crimson">Burn</p>
            <p className="text-[13px] font-semibold tabular-nums text-o1-crimson">+{Math.round(burnedKcal)}</p>
          </div>
          <div className="rounded-xl bg-o1-well border border-white/[0.07] px-1.5 py-2 text-center">
            <p className="text-[9px] tracking-wide text-neutral-400">Goal</p>
            <p className="text-[13px] font-semibold tabular-nums text-white">
              {dailyTargetKcal > 0 ? Math.round(dailyTargetKcal) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <MacroWell
          label="Protein"
          grams={proteinG}
          target={proteinTarget}
          color="#C4121A"
          track="bg-red-950/20 border border-red-900/30"
        />
        <MacroWell
          label="Carbs"
          grams={carbsG}
          target={carbsTarget}
          color="#d97706"
          track="bg-amber-950/20 border border-amber-900/30"
        />
        <MacroWell
          label="Fats"
          grams={fatsG}
          target={fatsTarget}
          color="#6B8F5E"
          track="bg-emerald-950/20 border border-emerald-900/30"
        />
      </div>
    </div>
  );
};

export default DailyEnergySplitTab;
