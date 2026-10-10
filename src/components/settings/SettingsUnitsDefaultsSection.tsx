import React, { useState, useEffect } from 'react';
import {
  Scale,
  Footprints,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Minus,
  Plus,
  Check,
} from 'lucide-react';
import { WeightUnit, HeightUnit, DistanceUnit } from '../../hooks/useAthleteSettings';
import { tactileEngine } from '../../services/tactileEngine';

interface UnitsDefaultsSectionProps {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  distanceUnit: DistanceUnit;
  defaultRestSeconds: number;
  defaultBarbellKg: number;
  stepTarget: number;
  onSetWeightUnit: (u: WeightUnit) => void;
  onSetHeightUnit: (u: HeightUnit) => void;
  onSetDistanceUnit: (u: DistanceUnit) => void;
  onSetDefaultRest: (s: number) => void;
  onSetDefaultBarbell: (kg: number) => void;
  onSetStepTarget: (steps: number) => void;
}

const MIN_STEPS = 1000;
const MAX_STEPS = 50000;
const STEP_INCREMENT = 500;

export const SettingsUnitsDefaultsSection: React.FC<UnitsDefaultsSectionProps> = ({
  weightUnit,
  heightUnit,
  distanceUnit,
  defaultRestSeconds,
  defaultBarbellKg,
  stepTarget,
  onSetWeightUnit,
  onSetHeightUnit,
  onSetDistanceUnit,
  onSetDefaultRest,
  onSetDefaultBarbell,
  onSetStepTarget,
}) => {
  // Collapsible accordion states
  const [unitsExpanded, setUnitsExpanded] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [inputVal, setInputVal] = useState<string>(String(stepTarget));
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setInputVal(String(stepTarget));
  }, [stepTarget]);

  const restPresets = [
    { label: 'Off', value: 0 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '120s', value: 120 },
    { label: '180s', value: 180 },
  ];
  const barbellPresets = [
    { label: '20kg / 45lb (Olympic)', value: 20 },
    { label: "15kg / 35lb (Women's)", value: 15 },
    { label: '10kg / 22lb (EZ/Tech)', value: 10 },
  ];

  // Mobile Keypad Input Handlers - commits only when Set button is pressed or +/- adjusted
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
  };

  const handleInputBlur = () => {
    let parsed = parseInt(inputVal, 10);
    if (isNaN(parsed) || parsed < MIN_STEPS) parsed = MIN_STEPS;
    if (parsed > MAX_STEPS) parsed = MAX_STEPS;
    const snapped = Math.round(parsed / 250) * 250;
    setInputVal(String(snapped));
  };

  const adjustSteps = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    const current = parseInt(inputVal, 10) || stepTarget;
    const next = Math.max(MIN_STEPS, Math.min(MAX_STEPS, current + delta));
    setInputVal(String(next));
    onSetStepTarget(next);
  };

  const handleApplySet = () => {
    tactileEngine.triggerSelectionBuzz();
    let parsed = parseInt(inputVal, 10);
    if (isNaN(parsed) || parsed < MIN_STEPS) parsed = MIN_STEPS;
    if (parsed > MAX_STEPS) parsed = MAX_STEPS;
    const snapped = Math.round(parsed / 250) * 250;
    setInputVal(String(snapped));
    onSetStepTarget(snapped);
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2000);
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Units &amp; Targets
      </h3>

      <div className="space-y-2 text-white">
        {/* ============================================================== */}
        {/* COLLAPSIBLE BOX 1: DAILY STEP TARGET (MOBILE KEYPAD INPUT)     */}
        {/* ============================================================== */}
        <div className="border border-white/[0.07] rounded-2xl bg-o1-card overflow-hidden shadow-sm transition-colors">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setStepsExpanded(!stepsExpanded);
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-[#4F8F9A] shrink-0">
                <Footprints className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-tactical font-semibold text-neutral-100 block">
                  Daily Step Target
                </span>
                <span className="text-[10px] font-sans text-white tabular-nums block truncate font-semibold">
                  {stepTarget.toLocaleString()} steps / day
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <span className="text-[10px] font-mono">
                {stepsExpanded ? 'Close' : 'Adjust'}
              </span>
              {stepsExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          {stepsExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3.5 animate-in fade-in duration-150">
              {/* Tactical Mobile Keypad Input Card */}
              <div className="p-4 rounded-xl bg-o1-well border border-white/[0.07] flex flex-col items-center gap-3">
                <span className="text-[10px] font-tactical font-bold text-neutral-400 tracking-wider">
                  Target Steps / Day
                </span>

                <div className="flex items-center justify-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => adjustSteps(-STEP_INCREMENT)}
                    className="w-12 h-12 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-neutral-200 flex items-center justify-center font-mono font-bold cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="Decrease 500 steps"
                    aria-label="Decrease 500 steps"
                  >
                    <Minus className="w-5 h-5 text-neutral-300" />
                  </button>

                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={MIN_STEPS}
                        max={MAX_STEPS}
                        step={STEP_INCREMENT}
                        value={inputVal}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                            handleApplySet();
                          }
                        }}
                        className="w-44 text-center font-mono font-black text-3xl text-white bg-black border border-white/[0.07] focus:border-o1-crimson rounded-2xl py-2 px-3 outline-none transition-all shadow-inner tracking-tight"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustSteps(STEP_INCREMENT)}
                    className="w-12 h-12 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-neutral-200 flex items-center justify-center font-mono font-bold cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="Increase 500 steps"
                    aria-label="Increase 500 steps"
                  >
                    <Plus className="w-5 h-5 text-neutral-300" />
                  </button>
                </div>

                {/* Telemetry Estimation */}
                <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-neutral-400">
                  <span>
                    ~{distanceUnit === 'mi'
                      ? (((stepTarget * 0.75) / 1000) * 0.621371).toFixed(1) + ' mi'
                      : ((stepTarget * 0.75) / 1000).toFixed(1) + ' km'}
                  </span>
                  <span>•</span>
                  <span>~{Math.round(stepTarget * 0.04)} kcal est.</span>
                </div>

                {/* Small Capsule Set Button */}
                <div className="pt-0.5 flex items-center justify-center w-full">
                  <button
                    type="button"
                    onClick={handleApplySet}
                    className={`o1-pill font-sans font-semibold text-xs cursor-pointer active:scale-95 ${
                      isSavedRecently
                        ? 'bg-emerald-600 text-white'
                        : 'bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isSavedRecently ? 'Target Locked & Saved' : 'Set Target'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* COLLAPSIBLE BOX 2: UNITS & LIFTING DEFAULTS                    */}
        {/* ============================================================== */}
        <div className="border border-white/[0.07] rounded-2xl bg-o1-card overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setUnitsExpanded(!unitsExpanded);
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-[#D4A017] shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-tactical font-semibold text-neutral-100 block">
                  Units &amp; Barbell Defaults
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block truncate">
                  {weightUnit.toUpperCase()} · {distanceUnit.toUpperCase()} · Bar: {defaultBarbellKg}kg · Rest: {defaultRestSeconds === 0 ? 'Off' : `${defaultRestSeconds}s`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <span className="text-[10px] font-mono">
                {unitsExpanded ? 'Close' : 'Adjust'}
              </span>
              {unitsExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          {unitsExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3.5 animate-in fade-in duration-150">
              {/* Unit System Toggles */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-tactical font-bold text-neutral-400 block mb-1">
                    Weight Unit
                  </span>
                  <div className="grid grid-cols-2 bg-o1-well p-0.5 rounded-lg border border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetWeightUnit('kg');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        weightUnit === 'kg' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      KG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetWeightUnit('lbs');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        weightUnit === 'lbs' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      LBS
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-tactical font-bold text-neutral-400 block mb-1">
                    Distance
                  </span>
                  <div className="grid grid-cols-2 bg-o1-well p-0.5 rounded-lg border border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetDistanceUnit('km');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        distanceUnit === 'km' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      KM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetDistanceUnit('mi');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        distanceUnit === 'mi' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Mi
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-tactical font-bold text-neutral-400 block mb-1">
                    Height Unit
                  </span>
                  <div className="grid grid-cols-2 bg-o1-well p-0.5 rounded-lg border border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetHeightUnit('cm');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        heightUnit === 'cm' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Cm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetHeightUnit('in');
                      }}
                      className={`py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        heightUnit === 'in' ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      In
                    </button>
                  </div>
                </div>
              </div>

              {/* Default Barbell Preset */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[10px] font-tactical font-bold text-neutral-400 block">
                    Default Olympic Barbell Type
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {barbellPresets.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetDefaultBarbell(b.value);
                      }}
                      className={`p-2 rounded-xl border text-xs font-tactical flex items-center justify-between transition-all cursor-pointer ${
                        defaultBarbellKg === b.value
                          ? 'bg-o1-crimson border-o1-crimson text-white font-bold'
                          : 'bg-o1-well border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{b.label}</span>
                      <span className="font-mono text-[11px] text-neutral-400">
                        {weightUnit === 'lbs' ? `${Math.round(b.value * 2.20462)} lbs` : `${b.value} kg`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Rest Timer Preset */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[10px] font-tactical font-bold text-neutral-400 block">
                      Auto Rest Timer Duration
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-o1-crimson">
                    {defaultRestSeconds === 0 ? 'Off (Manual)' : `${defaultRestSeconds} seconds`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {restPresets.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetDefaultRest(opt.value);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        defaultRestSeconds === opt.value
                          ? 'bg-o1-crimson text-white shadow-xs'
                          : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
