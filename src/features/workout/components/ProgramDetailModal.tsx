import React from 'react';
import { X, Dumbbell } from 'lucide-react';
import { getProgramDetailData } from '../data/programDetailsData';

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  programTitle: string;
  onLoadWorkouts: (programTitle: string) => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  isOpen,
  onClose,
  programTitle,
  onLoadWorkouts,
}) => {
  if (!isOpen) return null;

  const program = getProgramDetailData(programTitle);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D0D10] border border-neutral-200 dark:border-[#1F1F23] w-full max-w-[480px] max-h-[90dvh] h-auto rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-colors">
        {/* Banner with Title and Close */}
        <div className="relative h-44 w-full bg-zinc-950 shrink-0">
          <img
            src={program.banner}
            alt={programTitle}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Program Title Overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-telemetry bg-[#FF3B30] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                TACTICAL PROTOCOL
              </span>
              <span className="text-[9px] font-telemetry bg-black/60 text-cyan-400 px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                VERIFIED
              </span>
            </div>
            <h2 className="font-tactical font-black text-xl uppercase tracking-wider text-white">
              {programTitle}
            </h2>
            <p className="text-[11px] font-telemetry text-zinc-300">
              {program.subtitle}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Tags */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl">
              <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-500 uppercase block">
                PRIMARY FOCUS
              </span>
              <span className="font-tactical font-bold text-xs uppercase text-cyan-600 dark:text-[#00E5FF] mt-0.5 block">
                {program.focus}
              </span>
            </div>

            <div className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] p-3 rounded-2xl">
              <span className="text-[9px] font-telemetry text-neutral-500 dark:text-zinc-500 uppercase block">
                ATHLETE TIER
              </span>
              <span className="font-tactical font-bold text-xs uppercase text-cyan-600 dark:text-[#00E5FF] mt-0.5 block">
                {program.level}
              </span>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-telemetry text-neutral-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                SESSION EXERCISE SCHEDULE
              </span>
              <span className="text-[10px] font-telemetry text-neutral-500 dark:text-zinc-500">
                {program.exercises.length} MOVEMENTS
              </span>
            </div>

            <div className="space-y-2">
              {program.exercises.map((ex, idx) => (
                <div
                  key={ex.name}
                  className="bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 flex items-center justify-center font-telemetry font-bold text-xs text-neutral-700 dark:text-zinc-300">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-tactical font-bold text-xs uppercase text-neutral-900 dark:text-white">
                        {ex.name}
                      </h4>
                      <p className="text-[10px] font-telemetry text-neutral-500 dark:text-zinc-400">
                        {ex.sets} • {ex.reps}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-telemetry font-bold text-neutral-700 dark:text-zinc-300 bg-neutral-200 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-neutral-300 dark:border-zinc-700">
                    {ex.load}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Red Action Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-[#1F1F23] bg-neutral-50 dark:bg-[#121214] shrink-0">
          <button
            type="button"
            onClick={() => {
              onLoadWorkouts(programTitle);
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#FF3B30] hover:bg-[#ff4e44] text-white font-tactical text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,59,48,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Dumbbell className="w-4 h-4" />
            <span>LOAD &amp; APPEND 7 WORKOUTS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
