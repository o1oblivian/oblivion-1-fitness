import React from 'react';
import { EyeOff, Shield, Radio } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';

export const SettingsBuddyDatingSection: React.FC = () => {
  const buddy = useBuddyProfileStore();

  const getStatusBadge = () => {
    if (!buddy.isBuddyProfileActive) {
      return { label: 'SOLO FITNESS MODE', classes: 'bg-neutral-100 dark:bg-[#18181b] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800' };
    }
    if (buddy.ghostMode) {
      return { label: 'STEALTH GHOST MODE', classes: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 text-amber-700 dark:text-amber-400' };
    }
    return { label: 'RADAR ACTIVE', classes: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400' };
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-tactical tracking-wider text-neutral-500 dark:text-neutral-400 font-bold uppercase">
          Workout Partner &amp; Buddy Radar
        </h3>
        <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${badge.classes}`}>{badge.label}</span>
      </div>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 space-y-4 text-neutral-900 dark:text-white transition-colors">
        {/* 1. MASTER SWITCH */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {buddy.isBuddyProfileActive ? <Radio className="w-4 h-4 text-[#C4121A] shrink-0" /> : <EyeOff className="w-4 h-4 text-neutral-400 shrink-0" />}
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block truncate">Enable Buddy Dating &amp; Radar</span>
            </div>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block pt-0.5 leading-tight">
              {buddy.isBuddyProfileActive ? 'Discover nearby training partners and spotters' : 'Turned off — Pure fitness mode'}
            </span>
          </div>
          <CrimsonSwitch checked={buddy.isBuddyProfileActive} onChange={(val) => buddy.toggleBuddyProfile(val)} />
        </div>

        {/* 2. STEALTH MODE */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 shrink-0 ${buddy.ghostMode ? 'text-amber-500' : 'text-neutral-400 dark:text-neutral-500'}`} />
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block truncate">Stealth / Ghost Mode</span>
            </div>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block pt-0.5 leading-tight">Browse radar without revealing your profile</span>
          </div>
          <CrimsonSwitch checked={buddy.ghostMode} onChange={(val) => buddy.toggleGhostMode(val)} />
        </div>
      </div>
    </div>
  );
};
export default SettingsBuddyDatingSection;
