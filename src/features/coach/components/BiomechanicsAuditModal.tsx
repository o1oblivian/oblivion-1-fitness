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
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150">
      <div className="o1-sheet-card bg-o1-well border border-white/[0.07] text-zinc-100 w-full p-5 shadow-xl space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div>
            <span className="text-[9px] font-telemetry text-[#4F8F9A] block font-bold">
              Tactical Kinematic Audit
            </span>
            <h3 className="font-tactical text-sm font-bold text-zinc-100 tracking-wider">
              Biomechanics // {athlete.callsign}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kinematic Wireframe / Joint Angle HUD Simulation */}
        <div className="bg-black border border-white/[0.07] rounded-xl p-3 relative overflow-hidden text-center">
          <div className="flex items-center justify-between text-[9px] font-telemetry text-zinc-400 mb-2">
            <span>Optical Sensor: RIG-04</span>
            <span className="text-[#4F8F9A] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8F9A] animate-pulse" />
              120 Fps Tracking
            </span>
          </div>

          {/* SVG Kinematic Joint Skeleton */}
          <div className="w-full h-32 flex items-center justify-center relative">
            <svg className="w-36 h-32" viewBox="0 0 100 100">
              {/* Head */}
              <circle cx="50" cy="15" r="7" fill="none" stroke="#4F8F9A" strokeWidth="1.5" />
              {/* Spine */}
              <line x1="50" y1="22" x2="50" y2="52" stroke="#4F8F9A" strokeWidth="2" />
              {/* Barbell Across Shoulders */}
              <line x1="20" y1="24" x2="80" y2="24" stroke="#C4121A" strokeWidth="2.5" />
              <circle cx="20" cy="24" r="3" fill="#C4121A" />
              <circle cx="80" cy="24" r="3" fill="#C4121A" />
              {/* Pelvis & Hips */}
              <circle cx="50" cy="52" r="3" fill="#4F8F9A" />
              {/* Femurs / Thighs (Squat Angle) */}
              <line x1="50" y1="52" x2="35" y2="68" stroke="#4F8F9A" strokeWidth="2" />
              <line x1="50" y1="52" x2="65" y2="68" stroke="#4F8F9A" strokeWidth="2" />
              {/* Knees */}
              <circle cx="35" cy="68" r="3" fill="#4F8F9A" />
              <circle cx="65" cy="68" r="3" fill="#4F8F9A" />
              {/* Tibias / Shins */}
              <line x1="35" y1="68" x2="33" y2="90" stroke="#4F8F9A" strokeWidth="2" />
              <line x1="65" y1="68" x2="67" y2="90" stroke="#4F8F9A" strokeWidth="2" />
              {/* Feet Anchors */}
              <line x1="26" y1="90" x2="38" y2="90" stroke="#A1A1AA" strokeWidth="2" />
              <line x1="62" y1="90" x2="74" y2="90" stroke="#A1A1AA" strokeWidth="2" />
            </svg>

            {/* Floating Telemetry Badges */}
            <div className="absolute top-2 left-2 text-[8px] font-telemetry text-left text-zinc-400">
              Hip Angle: <span className="text-white font-bold">118°</span>
            </div>
            <div className="absolute top-2 right-2 text-[8px] font-telemetry text-right text-zinc-400">
              Bar Path: <span className="text-[#4F8F9A] font-bold">98.2% True</span>
            </div>
          </div>
        </div>

        {/* Joint Angle Telemetry Matrix */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="bg-black p-2.5 rounded-xl border border-white/[0.07]">
            <span className="text-[8px] font-telemetry text-zinc-400 block">
              Knee Valgus Deviation
            </span>
            <span className="font-telemetry font-bold text-xs text-[#4F8F9A]">
              1.8° // Nominal
            </span>
          </div>

          <div className="bg-black p-2.5 rounded-xl border border-white/[0.07]">
            <span className="text-[8px] font-telemetry text-zinc-400 block">
              Bar Path Drift
            </span>
            <span className="font-telemetry font-bold text-xs text-[#4F8F9A]">
              8mm LATERAL
            </span>
          </div>

          <div className="bg-black p-2.5 rounded-xl border border-white/[0.07]">
            <span className="text-[8px] font-telemetry text-zinc-400 block">
              Hip Hinge Depth
            </span>
            <span className="font-telemetry font-bold text-xs text-zinc-200">
              Parallel (118°)
            </span>
          </div>

          <div className="bg-black p-2.5 rounded-xl border border-white/[0.07]">
            <span className="text-[8px] font-telemetry text-zinc-400 block">
              Tempo Adherence
            </span>
            <span className="font-telemetry font-bold text-xs text-[#C4121A]">
              {athlete.tempoScore}% COMPLIANT
            </span>
          </div>
        </div>

        {/* Tactical Directive / Coach Feedback Note */}
        <div>
          <label className="text-[10px] font-tactical tracking-wider text-zinc-400 block mb-1 font-bold">
            Coach Tactical Directive & Correction
          </label>
          <textarea
            rows={3}
            value={tacticalNote}
            onChange={(e) => setTacticalNote(e.target.value)}
            className="w-full bg-black border border-white/[0.07] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isAudited ? (
            <div className="w-full py-2.5 rounded-xl bg-[#4F8F9A] text-black font-tactical text-xs font-bold tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biomechanics Verdict Transmitted!</span>
            </div>
          ) : (
            <button
              onClick={handleDispatch}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4F8F9A] text-black font-tactical text-xs font-bold tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
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
