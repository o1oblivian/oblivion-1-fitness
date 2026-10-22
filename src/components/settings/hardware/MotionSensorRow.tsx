import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { CrimsonSwitch } from '../CrimsonSwitch';
import { MotionEngineStatus } from '../../../services/motion/motionTypes';

interface MotionSensorRowProps {
  status: MotionEngineStatus;
  error: string | null;
  onToggle: (enable: boolean) => void;
}

export const MotionSensorRow: React.FC<MotionSensorRowProps> = ({ status, error, onToggle }) => {
  return (
    <div className="pt-3 border-t border-white/[0.05] space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-o1-olive/20 text-o1-olive flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-tactical font-semibold text-o1-bone block">
              Phone step counter
            </span>
            <span className="text-o1-label font-sans text-o1-muted block truncate">
              {!status.isSupported
                ? "This phone can't count steps"
                : status.isActive
                  ? `On · ${status.stepsToday.toLocaleString()} steps today`
                  : 'Off'}
            </span>
          </div>
        </div>

        <CrimsonSwitch checked={status.isActive} onChange={onToggle} label="Phone step counter" />
      </div>

      {error && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-o1-yellow/10 border border-o1-yellow/20 flex items-start gap-2 text-o1-label text-o1-yellow-soft"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {status.isActive && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07] text-center font-num">
            <span className="text-o1-label text-o1-muted block font-tactical">
              Acceleration Vector
            </span>
            <span className="text-sm font-bold text-white">
              {status.liveMagnitude ?? '--'}{' '}
              <span className="text-o1-label text-o1-muted">m/s²</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07] text-center font-num">
            <span className="text-o1-label text-o1-muted block font-tactical">
              Barbell Velocity (VBT)
            </span>
            <span className="text-sm font-bold text-o1-crimson block">
              {status.estimatedVelocityMs === null ? '--' : status.estimatedVelocityMs.toFixed(1)}{' '}
              <span className="text-o1-label text-o1-muted">m/s</span>
            </span>
            <span className="text-o1-label text-o1-muted block mt-0.5 truncate">
              {status.vbtStatus || 'Awaiting Barbell Motion'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
