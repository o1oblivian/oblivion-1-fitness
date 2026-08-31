import React from 'react';
import { Target, Calculator } from 'lucide-react';

interface DailyTargetsCardProps {
  goalCals: number;
  setGoalCals: (cals: number) => void;
  goalP: number;
  setGoalP: (p: number) => void;
  goalC: number;
  setGoalC: (c: number) => void;
  goalF: number;
  setGoalF: (f: number) => void;
  bmr: number;
  setBmr: (bmr: number) => void;
  onOpenAutoPilot: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DailyTargetsCard: React.FC<DailyTargetsCardProps> = ({
  goalCals,
  setGoalCals,
  goalP,
  setGoalP,
  goalC,
  setGoalC,
  goalF,
  setGoalF,
  bmr,
  setBmr,
  onOpenAutoPilot,
  showToast,
}) => {
  return (
    <div className="bg-white dark:bg-[#13161A] rounded-2xl p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-white/10 relative overflow-hidden text-zinc-900 dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-[#EA4335] dark:text-[#EA4335]" />
          <span>Daily Targets</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onOpenAutoPilot}
            className="text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 px-3 py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 border border-zinc-200 dark:border-white/10 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Macro Calculator</span>
          </button>
          <button
            onClick={() => showToast('Targets Saved!', 'success')}
            className="text-xs font-bold text-white bg-[#EA4335] hover:bg-[#EA4335] px-3.5 py-1.5 rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
        <div className="col-span-2">
          <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
            Daily Cals
          </label>
          <input
            type="number"
            value={goalCals === 0 ? '' : goalCals}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value.replace(/^0+(?=\d)/, '');
              const val = parseInt(clean) || 0;
              setGoalCals(val);
              if (val > 0) {
                setGoalP(Math.round((val * 0.3) / 4));
                setGoalC(Math.round((val * 0.45) / 4));
                setGoalF(Math.round((val * 0.25) / 9));
              }
            }}
            className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 outline-none font-mono font-black text-base text-zinc-900 dark:text-white transition-all focus:border-[#EA4335] dark:focus:border-[#EA4335]"
          />
        </div>
        <div className="col-span-1 flex flex-col">
          <label className="text-[10px] font-mono font-bold text-[#EA4335] dark:text-red-400 uppercase tracking-wider mb-1 block text-center">
            Pro(g)
          </label>
          <input
            type="number"
            value={goalP === 0 ? '' : goalP}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value.replace(/^0+(?=\d)/, '');
              setGoalP(parseInt(clean) || 0);
            }}
            className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-zinc-900 dark:text-white transition-all focus:border-[#EA4335] dark:focus:border-[#EA4335]"
          />
        </div>
        <div className="col-span-1 flex flex-col">
          <label className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1 block text-center">
            Carb(g)
          </label>
          <input
            type="number"
            value={goalC === 0 ? '' : goalC}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value.replace(/^0+(?=\d)/, '');
              setGoalC(parseInt(clean) || 0);
            }}
            className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-zinc-900 dark:text-white transition-all focus:border-[#EA4335] dark:focus:border-[#EA4335]"
          />
        </div>
        <div className="col-span-1 flex flex-col">
          <label className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 block text-center">
            Fat(g)
          </label>
          <input
            type="number"
            value={goalF === 0 ? '' : goalF}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value.replace(/^0+(?=\d)/, '');
              setGoalF(parseInt(clean) || 0);
            }}
            className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-zinc-900 dark:text-white transition-all focus:border-[#EA4335] dark:focus:border-[#EA4335]"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-white/10">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Base Metabolic Rate (BMR)
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={bmr}
            onChange={(e) => setBmr(parseInt(e.target.value) || 0)}
            className="w-24 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 text-right rounded-xl px-2.5 py-1 font-mono font-bold text-zinc-900 dark:text-white outline-none text-xs focus:border-[#EA4335] dark:focus:border-[#EA4335]"
          />
          <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500">kcal</span>
        </div>
      </div>
    </div>
  );
};
