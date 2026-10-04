import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { CrimsonSwitch } from '../CrimsonSwitch';
import { MotionEngineStatus } from '../../../services/motion/motionTypes';

interface MotionSensorRowProps {
  status: MotionEngineStatus;
  error: string | null;
  onToggle: (enable: boolean) => void;
}

export const MotionSensorRow: React.FC<MotionSensorRowProps> = ({
  status,
  error,
  onToggle,
}) => {
  return (
    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block">
              Motion Pedometer &amp; VBT Accelerometer
            </span>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block truncate">
              {status.isActive
                ? `Live Stride Active • ${status.liveMagnitude} m/s²`
                : 'Native device motion dynamic stride peak-detection'}
            </span>
          </div>
        </div>

        <CrimsonSwitch checked={status.isActive} onChange={onToggle} />
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {status.isActive && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 text-center font-mono">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase block font-tactical">
              Acceleration Vector
            </span>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {status.liveMagnitude} <span className="text-[10px] text-neutral-400">m/s²</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 text-center font-mono">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase block font-tactical">
              Barbell Velocity (VBT)
            </span>
            <span className="text-sm font-bold text-[#C4121A] block">
              {status.estimatedVelocityMs.toFixed(1)} <span className="text-[10px] text-neutral-400">m/s</span>
            </span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block mt-0.5 truncate">
              {status.vbtStatus || 'Awaiting Barbell Motion'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
