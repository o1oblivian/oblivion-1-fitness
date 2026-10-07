import React, { useEffect, useState } from 'react';
import { ChevronDown, Scale, Sliders } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { COUNTRIES } from './ClientCountryMarketModal';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { getDietProtocol } from '../data/dietProtocols';
import { DailyEnergyTargetsTab } from './DailyEnergyTargetsTab';
import { MifflinStJeorModal } from './MifflinStJeorModal';

export interface FuelHeroDashboardProps {
  countryMarket: string;
  dietPreference: string;
  weightKg: number;
  remainingKcal: number;
  eatenKcal: number;
  burnedKcal: number;
  dailyTargetKcal: number;
  proteinG: number;
  proteinTarget: number;
  carbsG: number;
  carbsTarget: number;
  fatsG: number;
  fatsTarget: number;
  onOpenCountry: () => void;
  onOpenDiet: () => void;
  onSaveWeight: (kg: number) => void;
  onApplyTargets: (kcal: number, p: number, c: number, f: number, weight?: number) => void;
}

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return Math.min(100, Math.round((n / d) * 100));
}

export const FuelHeroDashboard: React.FC<FuelHeroDashboardProps> = ({
  countryMarket,
  dietPreference,
  weightKg,
  remainingKcal,
  eatenKcal,
  burnedKcal,
  dailyTargetKcal,
  proteinG,
  proteinTarget,
  carbsG,
  carbsTarget,
  fatsG,
  fatsTarget,
  onOpenCountry,
  onOpenDiet,
  onSaveWeight,
  onApplyTargets,
}) => {
  const [engineOpen, setEngineOpen] = useState(false);
  const [mifflinOpen, setMifflinOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightDraft, setWeightDraft] = useState(String(weightKg || ''));
  const [kcalIn, setKcalIn] = useState(dailyTargetKcal || 2200);
  const [pIn, setPIn] = useState(proteinTarget || 165);
  const [cIn, setCIn] = useState(carbsTarget || 250);
  const [fIn, setFIn] = useState(fatsTarget || 60);

  useEffect(() => {
    setWeightDraft(String(weightKg || ''));
  }, [weightKg]);

  useEffect(() => {
    if (dailyTargetKcal > 0) setKcalIn(dailyTargetKcal);
    if (proteinTarget > 0) setPIn(proteinTarget);
    if (carbsTarget > 0) setCIn(carbsTarget);
    if (fatsTarget > 0) setFIn(fatsTarget);
  }, [dailyTargetKcal, proteinTarget, carbsTarget, fatsTarget]);

  const country = COUNTRIES.find((c) => c.code === countryMarket) || COUNTRIES.find((c) => c.code === 'AU')!;
  const diet = getDietProtocol(dietPreference);
  const goal = dailyTargetKcal > 0 ? dailyTargetKcal : 2200;
  const used = pct(eatenKcal, goal);
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = circ - (used / 100) * circ;

  const macros = [
    { label: 'P', grams: proteinG, target: proteinTarget, color: '#C4121A' },
    { label: 'C', grams: carbsG, target: carbsTarget, color: '#d97706' },
    { label: 'F', grams: fatsG, target: fatsTarget, color: '#059669' },
  ];

  return (
    <section
      id="fuel-hero-dashboard"
      className="rounded-2xl bg-o1-card border border-white/[0.07] shadow-sm overflow-hidden select-none"
    >
      <div className="px-3.5 pt-3.5 pb-3">
        <div className="flex items-center gap-1.5 mb-3">
          <h1 className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mr-1">Fuel</h1>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenCountry();
            }}
            className="h-8 pl-1.5 pr-2 rounded-full bg-o1-well border border-white/[0.07] inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 cursor-pointer"
          >
            <span className="text-sm leading-none">{country.flag}</span>
            <span>{country.code}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenDiet();
            }}
            className="h-8 pl-2.5 pr-2 rounded-full bg-o1-well border border-white/[0.07] inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 cursor-pointer"
          >
            <span className="max-w-[92px] truncate">{diet.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setEngineOpen((v) => !v);
            }}
            className={`h-8 px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 border cursor-pointer active:scale-95 ml-auto ${
              engineOpen
                ? 'bg-white text-neutral-900 border-transparent'
                : 'bg-o1-well text-zinc-400 border-white/[0.07]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Engine
          </button>
        </div>

        <div className="flex items-center justify-end mb-3 -mt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setEditingWeight((v) => !v);
            }}
            className="h-8 px-2.5 rounded-full bg-o1-well border border-white/[0.07] inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 cursor-pointer ml-auto"
          >
            <Scale className="w-3 h-3 text-neutral-400" />
            <span className="tabular-nums">{weightKg || '—'}</span>
            <span className="text-[9px] text-neutral-400">kg</span>
          </button>
        </div>

        {editingWeight && (
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              step="0.1"
              value={weightDraft}
              autoFocus
              onFocus={(e) => e.target.select()}
              onChange={(e) => setWeightDraft(sanitizeNumericInput(e.target.value))}
              className="flex-1 h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const v = parseFloat(weightDraft);
                if (!isNaN(v) && v > 0) onSaveWeight(v);
                setEditingWeight(false);
              }}
              className="h-9 px-3 rounded-xl bg-white text-neutral-900 text-xs font-semibold"
            >
              Save
            </button>
          </div>
        )}

        {!engineOpen && (
          <div className="flex items-center gap-3">
            <div className="relative w-[100px] h-[100px] shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r={radius} className="text-white/10" stroke="currentColor" strokeWidth="7" fill="none" />
                <circle
                  cx="54"
                  cy="54"
                  r={radius}
                  stroke="#C4121A"
                  strokeWidth="7"
                  strokeDasharray={circ}
                  strokeDashoffset={dash}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-semibold tabular-nums leading-none text-white">
                  {Math.round(remainingKcal).toLocaleString()}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">kcal left</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wide text-neutral-400">Eaten</p>
                  <p className="text-[13px] font-semibold tabular-nums">{Math.round(eatenKcal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wide text-o1-crimson">Burn</p>
                  <p className="text-[13px] font-semibold tabular-nums text-o1-crimson">+{Math.round(burnedKcal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wide text-neutral-400">Goal</p>
                  <p className="text-[13px] font-semibold tabular-nums">{Math.round(goal)}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {macros.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="w-3 text-[10px] font-bold" style={{ color: m.color }}>
                      {m.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-o1-well overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct(m.grams, m.target)}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-neutral-500 w-[52px] text-right">
                      {Math.round(m.grams)}/{m.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {engineOpen && (
        <div className="px-3.5 pb-3.5 border-t border-white/[0.05] pt-3">
          <DailyEnergyTargetsTab
            targetKcalInput={kcalIn}
            setTargetKcalInput={setKcalIn}
            targetProteinInput={pIn}
            setTargetProteinInput={setPIn}
            targetCarbsInput={cIn}
            setTargetCarbsInput={setCIn}
            targetFatsInput={fIn}
            setTargetFatsInput={setFIn}
            bmr={weightKg ? Math.round(10 * weightKg + 6.25 * 178 - 5 * 28 + 5) : 1775}
            onOpenMifflinModal={() => setMifflinOpen(true)}
            onSaveTargets={() => {
              tactileEngine.triggerImpactPulse();
              onApplyTargets(kcalIn, pIn, cIn, fIn, weightKg);
              setEngineOpen(false);
            }}
          />
        </div>
      )}

      <MifflinStJeorModal
        isOpen={mifflinOpen}
        currentWeightKg={weightKg || 78.5}
        onClose={() => setMifflinOpen(false)}
        onApplyTargets={(cal, p, c, f, weight) => {
          setKcalIn(cal);
          setPIn(p);
          setCIn(c);
          setFIn(f);
          onApplyTargets(cal, p, c, f, weight);
          setMifflinOpen(false);
          setEngineOpen(false);
        }}
      />
    </section>
  );
};

export default FuelHeroDashboard;
