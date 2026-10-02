import React, { useState } from 'react';
import { DollarSign, Calendar, CheckSquare, Square, TrendingUp } from 'lucide-react';
import { ProgramFormData } from './types';
import { tactileEngine } from '../../../../services/tactileEngine';

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
  const platformFee = effectivePrice * 0.10;
  const coachPayout = effectivePrice * 0.90;

  const totalGross = effectivePrice * projectedAthletes;
  const totalPlatform = platformFee * projectedAthletes;
  const totalPayout = coachPayout * projectedAthletes;

  return (
    <div className="space-y-4 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Pricing & Access
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Set program pricing, tier structures, and flexible athlete volume projections
        </p>
      </div>

      {/* Free Community Program Card */}
      <div
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChange({ isFreeCommunity: !data.isFreeCommunity });
        }}
        className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs"
      >
        <div className="space-y-1 pr-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              Free Community Program
            </span>
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono font-semibold">
              Free Access
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Give athletes free access to build your coaching community, roster, and reputation.
          </p>
        </div>
        <div className="shrink-0">
          {data.isFreeCommunity ? (
            <CheckSquare className="w-5 h-5 text-[#C4121A]" />
          ) : (
            <Square className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
          )}
        </div>
      </div>

      {!data.isFreeCommunity && (
        <div className="space-y-4">
          {/* Price Input Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 space-y-2 shadow-2xs">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
              Program Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400 font-mono">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={data.priceUsd === 0 ? '' : data.priceUsd}
                onChange={(e) => onChange({ priceUsd: parseFloat(e.target.value) || 0 })}
                placeholder="29.99"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white text-sm text-neutral-900 dark:text-white font-mono font-bold outline-none transition-colors"
              />
            </div>
          </div>

          {basePrice > 0 && (
            <div className="space-y-4">
              {/* Discount Selector */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Promotional Discount
                </label>
                <div className="grid grid-cols-6 gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-800">
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
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {d === 0 ? 'None' : `${d}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Net Revenue Split Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Net Revenue Split (90% Coach / 10% Platform)
                  </span>
                  <span className="text-[10px] font-mono text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold">
                    <TrendingUp size={11} /> Live Modeling
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[9px] uppercase text-neutral-400 block font-semibold">
                      Sale Price
                    </span>
                    <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                      ${effectivePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[9px] uppercase text-neutral-400 block font-semibold">
                      Platform (10%)
                    </span>
                    <span className="text-xs font-bold font-mono text-neutral-500 dark:text-neutral-400">
                      ${platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40">
                    <span className="text-[9px] uppercase text-green-600 dark:text-green-400 block font-semibold">
                      Your Payout (90%)
                    </span>
                    <span className="text-xs font-bold font-mono text-green-600 dark:text-green-400">
                      ${coachPayout.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Projected Volume Slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Projected Athletes:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={projectedAthletes}
                        onChange={(e) => setProjectedAthletes(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 px-2 py-0.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-center text-neutral-900 dark:text-white focus:outline-none"
                      />
                      <span className="text-[11px] text-neutral-400">athletes</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={500}
                    value={projectedAthletes}
                    onChange={(e) => setProjectedAthletes(Number(e.target.value))}
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />

                  {/* Presets Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    <span className="text-[10px] text-neutral-400 font-semibold mr-1">Presets:</span>
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
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Total Gross Revenue ({projectedAthletes} athletes):</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      ${totalGross.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Platform Fee (10%):</span>
                    <span className="font-mono">${totalPlatform.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-bold text-green-600 dark:text-green-400 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <span>Coach Net Payout (90%):</span>
                    <span className="font-mono text-sm">${totalPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Program Schedule (Cohort Dates) Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
            Program Schedule
          </h4>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Specify cohort start and end dates, or leave blank for self-paced perpetual access.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={data.startDate || ''}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProgramPricingStep;
