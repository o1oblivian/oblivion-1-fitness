import React from 'react';
import { UserCheck, MessageSquare, Send, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachProfile } from '../types/coachPlatformTypes';

interface AthleteMyCoachSectionProps {
  linkedCoach: CoachProfile | null;
  onFindCoach: () => void;
  onOpenMessage: (coach: CoachProfile) => void;
  onSubmitCheckin: (coach: CoachProfile) => void;
}

export const AthleteMyCoachSection: React.FC<AthleteMyCoachSectionProps> = ({
  linkedCoach,
  onFindCoach,
  onOpenMessage,
  onSubmitCheckin,
}) => {
  if (!linkedCoach) {
    return (
      <section className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
              STATUS // DIRECT ROSTER
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
            STANDALONE
          </span>
        </div>

        <div className="flex items-start gap-3.5 pt-0.5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              UNASSIGNED TO DIRECT COACH
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              Pair with an Oblivion 1 certified coach for custom programming, form audits, and direct weekly telemetry check-ins.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onFindCoach();
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4 stroke-[2.2]" />
          <span>FIND A COACH</span>
        </button>
      </section>
    );
  }

  const primarySpecialty = linkedCoach.specialties?.[0] || linkedCoach.role;
  const primaryCert = linkedCoach.certifications?.[0] || 'O1 Certified';

  return (
    <section className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
            ACTIVE MENTORSHIP
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase flex items-center gap-1">
          <UserCheck className="w-3 h-3 stroke-[2.2]" />
          <span>LINKED</span>
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <img
            src={linkedCoach.avatar}
            alt={linkedCoach.name}
            className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 dark:border-white/10"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#C4121A] text-white flex items-center justify-center text-[10px] shadow-sm">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
            {linkedCoach.name}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {primarySpecialty}
          </p>
          <p className="text-[10px] font-mono font-semibold text-[#C4121A] mt-0.5">
            {linkedCoach.rating.toFixed(2)} ★ • {primaryCert}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenMessage(linkedCoach);
          }}
          className="py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181b] dark:hover:bg-[#222226] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
        >
          <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
          <span>MESSAGE</span>
        </button>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onSubmitCheckin(linkedCoach);
          }}
          className="py-2.5 px-3 rounded-2xl bg-[#C4121A] hover:bg-[#a30f16] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm transition-all cursor-pointer uppercase tracking-wider"
        >
          <Send className="w-3.5 h-3.5" />
          <span>SUBMIT CHECK-IN</span>
        </button>
      </div>
    </section>
  );
};
