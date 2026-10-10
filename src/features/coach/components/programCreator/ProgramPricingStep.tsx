import React, { useState } from 'react';
import { DollarSign, Calendar, CheckSquare, Square, TrendingUp } from 'lucide-react';
import { ProgramFormData } from './types';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useSubscription } from '../../../../context/SubscriptionContext';
import { COACH_PLANS, coachPlanFromTier, formatFeePercent } from '../../../../../shared/coachPlans';

const DISCOUNTS = [0, 10, 15, 20, 25, 50];
const ATHLETE_PRESETS = [5, 15, 25, 50, 100, 250, 500];

export const ProgramPricingStep: React.FC<{
  data: ProgramFormData;
  onChange: (u: Partial<ProgramFormData>) => void;
}> = ({ data, onChange }) => {
  const [projectedAthletes, setProjectedAthletes] = useState<number>(25);

  const basePrice = Math.max(0, data.priceUsd || 0);
  const discountMultiplier = (100 - data.discountPercent) / 100;
  const effectivePrice = data.isFreeCommunity ? 0 : basePrice * discountMultiplier;
  const { currentPlan } = useSubscription();
  const plan = COACH_PLANS[coachPlanFromTier(currentPlan)];
  const feePct = formatFeePercent(plan.platformFeeRate);
  const payoutPct = formatFeePercent(1 - plan.platformFeeRate);
  const platformFee = effectivePrice * plan.platformFeeRate;
  const coachPayout = effectivePrice - platformFee;

  const totalGross = effectivePrice * projectedAthletes;
  const totalPlatform = platformFee * projectedAthletes;
  const totalPayout = coachPayout * projectedAthletes;

  return (
    <div className="space-y-4 text-o1-text select-none">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-o1-text" />
          <h3 className="text-sm font-bold text-o1-text">
            Pricing & Access
          </h3>
        </div>
        <p className="text-xs text-o1-muted">
          Set program pricing, tier structures, and flexible athlete volume projections
        </p>
      </div>

      {/* Free Community Program Card */}
      <div
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChange({ isFreeCommunity: !data.isFreeCommunity });
        }}
        className="p-4 rounded-2xl bg-o1-surface border border-white/[0.07] flex items-center justify-between cursor-pointer hover:border-white/[0.07] transition-all shadow-2xs"
      >
        <div className="space-y-1 pr-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-o1-text">
              Free Community Program
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-o1-muted text-[10px] font-mono font-semibold">
              Free Access
            </span>
          </div>
          <p className="text-[11px] text-o1-muted leading-relaxed">
            Give athletes free access to build your coaching community, roster, and reputation.
          </p>
        </div>
        <div className="shrink-0">
          {data.isFreeCommunity ? (
            <CheckSquare className="w-5 h-5 text-o1-crimson" />
          ) : (
            <Square className="w-5 h-5 text-o1-muted" />
          )}
        </div>
      </div>

      {!data.isFreeCommunity && (
        <div className="space-y-4">
          {/* Price Input Card */}
          <div className="p-4 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-2 shadow-2xs">
            <label className="text-xs font-semibold text-o1-text block">
              Program Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-o1-muted font-mono">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={data.priceUsd === 0 ? '' : data.priceUsd}
                onChange={(e) => onChange({ priceUsd: parseFloat(e.target.value) || 0 })}
                placeholder="29.99"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-o1-sheet border border-white/[0.07] focus:border-white text-sm text-o1-text font-mono font-bold outline-none transition-colors"
              />
            </div>
          </div>

          {basePrice > 0 && (
            <div className="space-y-4">
              {/* Discount Selector */}
              <div>
                <label className="text-xs font-semibold text-o1-text block mb-1.5">
                  Promotional Discount
                </label>
                <div className="grid grid-cols-6 gap-1 bg-white/[0.08] p-1 rounded-2xl border border-white/[0.07]">
                  {DISCOUNTS.map((d) => {
                    const isSelected = data.discountPercent === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          tactileEngine.triggerSelectionBuzz();
                          onChange({ discountPercent: d });
                        }}
                        className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                            : 'text-o1-muted hover:text-o1-text'
                        }`}
                      >
                        {d === 0 ? 'None' : `${d}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Net Revenue Split Card */}
              <div className="p-4 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-o1-text">
                    Net Revenue Split ({payoutPct} Coach / {feePct} Platform)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <TrendingUp size={11} /> Live Modeling
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
                    <span className="text-[9px] text-o1-muted block font-semibold">
                      Sale Price
                    </span>
                    <span className="text-xs font-bold font-mono text-o1-text">
                      ${effectivePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
                    <span className="text-[9px] text-o1-muted block font-semibold">
                      Platform ({feePct})
                    </span>
                    <span className="text-xs font-bold font-mono text-o1-muted">
                      ${platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                    <span className="text-[9px] text-emerald-400 block font-semibold">
                      Your Payout ({payoutPct})
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ${coachPayout.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Projected Volume Slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-o1-text">
                      Projected Athletes:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={projectedAthletes}
                        onChange={(e) => setProjectedAthletes(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 px-2 py-0.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs font-mono font-bold text-center text-o1-text focus:outline-none"
                      />
                      <span className="text-[11px] text-o1-muted">athletes</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={500}
                    value={projectedAthletes}
                    onChange={(e) => setProjectedAthletes(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />

                  {/* Presets Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    <span className="text-[10px] text-o1-muted font-semibold mr-1">Presets:</span>
                    {ATHLETE_PRESETS.map((p) => {
                      const isSel = projectedAthletes === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            tactileEngine.triggerSelectionBuzz();
                            setProjectedAthletes(p);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-white text-neutral-900 font-bold'
                              : 'bg-white/[0.08] text-o1-muted hover:text-o1-text'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="pt-2 border-t border-white/[0.07] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-o1-muted">
                    <span>Total Gross Revenue ({projectedAthletes} athletes):</span>
                    <span className="font-mono font-semibold text-o1-text">
                      ${totalGross.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-o1-muted">
                    <span>Platform Fee ({feePct}):</span>
                    <span className="font-mono">${totalPlatform.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-bold text-emerald-400 border-t border-dashed border-white/[0.07]">
                    <span>Coach Net Payout ({payoutPct}):</span>
                    <span className="font-mono text-sm">${totalPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Program Schedule (Cohort Dates) Card */}
      <div className="p-4 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-o1-text" />
          <h4 className="text-xs font-bold text-o1-text">
            Program Schedule
          </h4>
        </div>
        <p className="text-[11px] text-o1-muted">
          Specify cohort start and end dates, or leave blank for self-paced perpetual access.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] font-semibold text-o1-muted block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={data.startDate || ''}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs font-mono text-o1-text outline-none focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-o1-muted block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs font-mono text-o1-text outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProgramPricingStep;
