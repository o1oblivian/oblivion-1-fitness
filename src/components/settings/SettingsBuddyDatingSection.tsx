import React from 'react';
import { EyeOff, Shield, Radio } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';

export const SettingsBuddyDatingSection: React.FC = () => {
  const buddy = useBuddyProfileStore();

  return (
    <div className="space-y-2 select-none">
      <div className="px-1">
        <h3 className="text-xs font-sans font-semibold text-neutral-400">
          Workout Partner &amp; Buddy Radar
        </h3>
      </div>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5 text-white transition-colors">
        {/* 1. MASTER SWITCH */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {buddy.isBuddyProfileActive ? <Radio className="w-4 h-4 text-[#6B8F5E] shrink-0" /> : <EyeOff className="w-4 h-4 text-neutral-400 shrink-0" />}
              <span className="text-xs font-tactical font-semibold text-neutral-100 block truncate">Enable Buddy Dating &amp; Radar</span>
            </div>
            <span className="text-[11px] font-sans text-neutral-400 block pt-0.5 leading-tight">
              {buddy.isBuddyProfileActive ? 'Discover nearby training partners and spotters' : 'Turned off — Pure fitness mode'}
            </span>
          </div>
          <CrimsonSwitch checked={buddy.isBuddyProfileActive} onChange={(val) => buddy.toggleBuddyProfile(val)} />
        </div>

        {/* 2. STEALTH MODE */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-3 min-h-[44px]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 shrink-0 ${buddy.ghostMode ? 'text-amber-500' : 'text-neutral-500'}`} />
              <span className="text-xs font-tactical font-semibold text-neutral-100 block truncate">Stealth / Ghost Mode</span>
            </div>
            <span className="text-[11px] font-sans text-neutral-400 block pt-0.5 leading-tight">Browse radar without revealing your profile</span>
          </div>
          <CrimsonSwitch checked={buddy.ghostMode} onChange={(val) => buddy.toggleGhostMode(val)} />
        </div>
      </div>
    </div>
  );
};
export default SettingsBuddyDatingSection;
