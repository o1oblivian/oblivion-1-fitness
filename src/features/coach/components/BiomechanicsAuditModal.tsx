import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Activity, Send, Play, Sparkles } from 'lucide-react';
import { SquadAthlete } from '../../../types';

interface BiomechanicsAuditModalProps {
  athlete: SquadAthlete | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteAudit: (athleteId: string, verdict: string) => void;
}

export const BiomechanicsAuditModal: React.FC<BiomechanicsAuditModalProps> = ({
  athlete,
  isOpen,
  onClose,
  onCompleteAudit,
}) => {
  const [tacticalNote, setTacticalNote] = useState(
    'Tempo strictly maintained at 3-1-1. Minor left knee medial collapse during ascend out of the hole at set 4. Prescribe banded terminal knee extensions.'
  );
  const [isAudited, setIsAudited] = useState(false);

  if (!isOpen || !athlete) return null;

  const handleDispatch = () => {
    setIsAudited(true);
    setTimeout(() => {
      onCompleteAudit(athlete.id, tacticalNote);
      setIsAudited(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-[9px] font-telemetry text-cyan-600 dark:text-[#00E5FF] uppercase block font-bold">
              TACTICAL KINEMATIC AUDIT
            </span>
            <h3 className="font-tactical text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Biomechanics // {athlete.callsign}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kinematic Wireframe / Joint Angle HUD Simulation */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 relative overflow-hidden text-center">
          <div className="flex items-center justify-between text-[9px] font-telemetry text-zinc-500 dark:text-zinc-400 mb-2">
            <span>OPTICAL SENSOR: RIG-04</span>
            <span className="text-cyan-600 dark:text-[#00E5FF] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#00E5FF] animate-pulse" />
              120 FPS TRACKING
            </span>
          </div>

          {/* SVG Kinematic Joint Skeleton */}
          <div className="w-full h-32 flex items-center justify-center relative">
            <svg className="w-36 h-32" viewBox="0 0 100 100">
              {/* Head */}
              <circle cx="50" cy="15" r="7" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
              {/* Spine */}
              <line x1="50" y1="22" x2="50" y2="52" stroke="#00E5FF" strokeWidth="2" />
              {/* Barbell Across Shoulders */}
              <line x1="20" y1="24" x2="80" y2="24" stroke="#FF3B30" strokeWidth="2.5" />
              <circle cx="20" cy="24" r="3" fill="#FF3B30" />
              <circle cx="80" cy="24" r="3" fill="#FF3B30" />
              {/* Pelvis & Hips */}
              <circle cx="50" cy="52" r="3" fill="#00E5FF" />
              {/* Femurs / Thighs (Squat Angle) */}
              <line x1="50" y1="52" x2="35" y2="68" stroke="#00E5FF" strokeWidth="2" />
              <line x1="50" y1="52" x2="65" y2="68" stroke="#00E5FF" strokeWidth="2" />
              {/* Knees */}
              <circle cx="35" cy="68" r="3" fill="#00E5FF" />
              <circle cx="65" cy="68" r="3" fill="#00E5FF" />
              {/* Tibias / Shins */}
              <line x1="35" y1="68" x2="33" y2="90" stroke="#00E5FF" strokeWidth="2" />
              <line x1="65" y1="68" x2="67" y2="90" stroke="#00E5FF" strokeWidth="2" />
              {/* Feet Anchors */}
              <line x1="26" y1="90" x2="38" y2="90" stroke="#A1A1AA" strokeWidth="2" />
              <line x1="62" y1="90" x2="74" y2="90" stroke="#A1A1AA" strokeWidth="2" />
            </svg>

            {/* Floating Telemetry Badges */}
            <div className="absolute top-2 left-2 text-[8px] font-telemetry text-left text-zinc-500 dark:text-zinc-400">
              HIP ANGLE: <span className="text-zinc-900 dark:text-white font-bold">118°</span>
            </div>
            <div className="absolute top-2 right-2 text-[8px] font-telemetry text-right text-zinc-500 dark:text-zinc-400">
              BAR PATH: <span className="text-cyan-600 dark:text-[#00E5FF] font-bold">98.2% TRUE</span>
            </div>
          </div>
        </div>

        {/* Joint Angle Telemetry Matrix */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[8px] font-telemetry text-zinc-500 dark:text-zinc-400 uppercase block">
              Knee Valgus Deviation
            </span>
            <span className="font-telemetry font-bold text-xs text-cyan-600 dark:text-[#00E5FF]">
              1.8° // NOMINAL
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[8px] font-telemetry text-zinc-500 dark:text-zinc-400 uppercase block">
              Bar Path Drift
            </span>
            <span className="font-telemetry font-bold text-xs text-cyan-600 dark:text-[#00E5FF]">
              8mm LATERAL
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[8px] font-telemetry text-zinc-500 dark:text-zinc-400 uppercase block">
              Hip Hinge Depth
            </span>
            <span className="font-telemetry font-bold text-xs text-zinc-800 dark:text-zinc-200">
              PARALLEL (118°)
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[8px] font-telemetry text-zinc-500 dark:text-zinc-400 uppercase block">
              Tempo Adherence
            </span>
            <span className="font-telemetry font-bold text-xs text-red-600 dark:text-[#FF3B30]">
              {athlete.tempoScore}% COMPLIANT
            </span>
          </div>
        </div>

        {/* Tactical Directive / Coach Feedback Note */}
        <div>
          <label className="text-[10px] font-tactical uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1 font-bold">
            Coach Tactical Directive & Correction
          </label>
          <textarea
            rows={3}
            value={tacticalNote}
            onChange={(e) => setTacticalNote(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isAudited ? (
            <div className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biomechanics Verdict Transmitted!</span>
            </div>
          ) : (
            <button
              onClick={handleDispatch}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00E5FF] text-black font-tactical text-xs font-bold uppercase tracking-wider shadow-[0_0_14px_rgba(0,229,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Biomechanics Correction</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
