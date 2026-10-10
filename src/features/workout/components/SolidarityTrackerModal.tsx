import React, { useState } from 'react';
import { Heart, Pill } from 'lucide-react';
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
        iconContainerClassName="p-1.5 rounded-lg bg-[#C4121A]/10 text-[#C4121A]"
      >
        {/* Top Vitals Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-o1-card border border-white/[0.07] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-zinc-400">
              Heart Rate Variability
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-sky-400">
                88
              </span>
              <span className="text-xs font-telemetry text-zinc-400">ms</span>
            </div>
            <span className="text-[9px] font-telemetry text-sky-400 font-bold">
              +12ms ABOVE BASELINE
            </span>
          </div>

          <div className="bg-o1-card border border-white/[0.07] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-zinc-400">
              Resting Heart Rate
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-white">
                48
              </span>
              <span className="text-xs font-telemetry text-zinc-400">bpm</span>
            </div>
            <span className="text-[9px] font-telemetry text-zinc-400">
              Optimal Recovery
            </span>
          </div>

          <div className="bg-o1-card border border-white/[0.07] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-zinc-400">
              CNS Readiness Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-[#4F8F9A]">
                98%
              </span>
            </div>
            <span className="text-[9px] font-telemetry text-[#4F8F9A] font-bold">
              GRADE-A Primed
            </span>
          </div>

          <div className="bg-o1-card border border-white/[0.07] p-3 rounded-2xl transition-colors">
            <span className="text-[9px] font-telemetry text-zinc-400">
              Core Body Temp
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-telemetry font-black text-2xl text-white">
                36.6
              </span>
              <span className="text-xs font-telemetry text-zinc-400">°C</span>
            </div>
            <span className="text-[9px] font-telemetry text-zinc-400">
              Homeostatic
            </span>
          </div>
        </div>

        {/* Quick Supplement Card Shortcut */}
        <div className="bg-o1-card border border-white/[0.07] rounded-2xl p-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black border border-white/[0.07] text-sky-400">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-tactical font-bold text-xs text-white">
                Daily Supplement Timing
              </h4>
              <p className="text-[10px] font-telemetry text-zinc-400">
                Creatine 5000mg, D3+K2, Omega-3, Zinc, Magnesium
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSupplements(true)}
            className="py-1.5 px-3 rounded-xl bg-white/[0.08] hover:bg-zinc-700 text-white font-tactical text-xs font-bold tracking-wider border border-white/[0.07] active:scale-95 transition-all cursor-pointer"
          >
            Open
          </button>
        </div>

        <button
          onClick={() => {
            if (onShowToast) onShowToast('All vitals synchronised with Apple Health & Whoop.');
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-semibold text-xs tracking-wide active:scale-[0.98] transition-all cursor-pointer"
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
