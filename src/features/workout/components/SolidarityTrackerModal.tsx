import React, { useState } from 'react';
import { Heart, Shield, Activity, Pill, Check, Clock } from 'lucide-react';
import { SupplementTimingModal } from './SupplementTimingModal';
import { DrawerSheet } from '../../../components/ui';

interface SolidarityTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SolidarityTrackerModal: React.FC<SolidarityTrackerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [showSupplements, setShowSupplements] = useState(false);

  return (
    <>
      <DrawerSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Biometric Solidarity & Vitals"
        subtitle="Real-time Autonomic & Systemic Readiness"
        icon={<Heart className="w-4 h-4" />}
        iconContainerClassName="p-1.5 rounded-lg bg-[#FF3B30]/10 text-[#FF3B30]"
      >
        {/* Top Vitals Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400 uppercase">
              HEART RATE VARIABILITY
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-cyan-600 dark:text-cyan-400">
                88
              </span>
              <span className="text-xs font-telemetry text-neutral-500 dark:text-zinc-400">ms</span>
            </div>
            <span className="text-[9px] font-telemetry text-cyan-600 dark:text-cyan-400 font-bold">
              +12ms ABOVE BASELINE
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400 uppercase">
              RESTING HEART RATE
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-neutral-900 dark:text-white">
                48
              </span>
              <span className="text-xs font-telemetry text-neutral-500 dark:text-zinc-400">bpm</span>
            </div>
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400">
              OPTIMAL RECOVERY
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400 uppercase">
              CNS READINESS SCORE
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-cyan-600 dark:text-[#00E5FF]">
                98%
              </span>
            </div>
            <span className="text-[9px] font-telemetry text-cyan-600 dark:text-[#00E5FF] font-bold">
              GRADE-A PRIMED
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400 uppercase">
              CORE BODY TEMP
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-neutral-900 dark:text-white">
                36.6
              </span>
              <span className="text-xs font-telemetry text-neutral-500 dark:text-zinc-400">°C</span>
            </div>
            <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-400">
              HOMEOSTATIC
            </span>
          </div>
        </div>

        {/* Quick Supplement Card Shortcut */}
        <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] rounded-2xl p-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-[#08080A] border border-neutral-200 dark:border-[#1F1F23] text-cyan-600 dark:text-cyan-400">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-tactical font-bold text-xs uppercase text-neutral-900 dark:text-white">
                Daily Supplement Timing
              </h4>
              <p className="text-[10px] font-telemetry text-neutral-500 dark:text-zinc-400">
                Creatine 5000mg, D3+K2, Omega-3, Zinc, Magnesium
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSupplements(true)}
            className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white font-tactical text-xs font-bold uppercase tracking-wider border border-neutral-300 dark:border-zinc-700 active:scale-95 transition-all cursor-pointer"
          >
            Open
          </button>
        </div>

        <button
          onClick={() => {
            if (onShowToast) onShowToast('All vitals synchronised with Apple Health & Whoop.');
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-[#C4121A] hover:bg-red-700 text-white font-tactical text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950/30 active:scale-95 transition-all cursor-pointer"
        >
          Sync Biometrics &amp; Close
        </button>
      </DrawerSheet>

      <SupplementTimingModal
        isOpen={showSupplements}
        onClose={() => setShowSupplements(false)}
        onShowToast={onShowToast}
      />
    </>
  );
};
