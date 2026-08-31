import React from 'react';
import { Lock, Crown } from 'lucide-react';

interface PremiumLockProps {
  featureName: string;
  onUpgrade: () => void;
  variant?: 'overlay' | 'inline' | 'badge';
  tier?: 'premium' | 'pro';
}

export const PremiumLock: React.FC<PremiumLockProps> = ({
  featureName,
  onUpgrade,
  variant = 'overlay',
  tier = 'premium',
}) => {
  const tierLabel = tier === 'pro' ? 'Pro + Travel' : 'Premium';

  if (variant === 'badge') {
    return (
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/10 border border-stone-500/20 text-[9px] font-mono font-bold text-zinc-500 dark:text-stone-400 uppercase tracking-wider hover:bg-zinc-500/20 transition-colors cursor-pointer active:scale-95"
      >
        <Lock className="w-2.5 h-2.5" />
        {tierLabel}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-500/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-zinc-500 dark:text-stone-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-gray-300">{featureName}</p>
            <p className="text-[10px] text-slate-400 dark:text-gray-500">{tierLabel} feature</p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="px-3 py-1.5 rounded-xl bg-stone-600 hover:bg-zinc-500 text-white text-[10px] font-bold transition-all cursor-pointer active:scale-95"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-black/70 backdrop-blur-sm rounded-2xl">
      <div className="flex flex-col items-center gap-2 p-4 text-center">
        <div className="w-10 h-10 rounded-2xl bg-zinc-500/15 flex items-center justify-center">
          <Crown className="w-5 h-5 text-zinc-500 dark:text-stone-400" />
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-gray-200">{featureName}</p>
        <p className="text-[10px] text-slate-400 dark:text-gray-500 max-w-[180px]">
          Upgrade to {tierLabel} to unlock this feature
        </p>
        <button
          onClick={onUpgrade}
          className="mt-1 px-4 py-2 rounded-xl bg-stone-600 hover:bg-zinc-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
        >
          View Plans
        </button>
      </div>
    </div>
  );
};
