import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, AlignLeft, FileText, CheckCircle2 } from 'lucide-react';
import { ProgramFormData } from './types';
import { tactileEngine } from '../../../../services/tactileEngine';

export const ProgramReviewStep: React.FC<{ data: ProgramFormData }> = ({ data }) => {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
  const [showFullMethodology, setShowFullMethodology] = useState<boolean>(true);

  const totalExercises = data.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.exercises.length, 0),
    0
  );

  const toggleWeek = (weekNum: number) => {
    tactileEngine.triggerSelectionBuzz();
    setExpandedWeeks((prev) =>
      prev.includes(weekNum) ? prev.filter((w) => w !== weekNum) : [...prev, weekNum]
    );
  };

  const shortText = data.shortOverview || data.description || 'No short hook provided.';
  const methodologyText = data.fullMethodology?.trim();

  return (
    <div className="space-y-4 text-neutral-100 select-none">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-neutral-300" />
          <h3 className="text-sm font-bold text-white">
            Review & Publish
          </h3>
        </div>
        <p className="text-xs text-neutral-400">
          Confirm full curriculum integrity and syllabus before publishing
        </p>
      </div>

      {/* Program Summary Card */}
      <div className="rounded-2xl bg-o1-card border border-white/[0.07] overflow-hidden space-y-3.5 p-3.5 shadow-2xs">
        <div className="relative h-40 rounded-2xl overflow-hidden bg-black">
          <img
            src={data.coverImage}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider border border-white/[0.07]">
                {data.category}
              </span>
              <span className="px-3 py-1 rounded-xl bg-o1-crimson text-white text-xs font-mono font-bold shadow-xs">
                {data.isFreeCommunity ? 'Free Access' : `$${data.priceUsd.toFixed(2)}`}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-white leading-tight">
                {data.title || 'Untitled Protocol'}
              </h4>
              <p className="text-xs text-neutral-200 line-clamp-1 mt-0.5">{shortText}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-neutral-400 block font-semibold">
              Duration
            </span>
            <span className="text-xs font-bold text-white">
              {data.durationWeeks} Weeks
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-neutral-400 block font-semibold">
              Frequency
            </span>
            <span className="text-xs font-bold text-white">
              {data.trainingDaysPerWeek} Days/Wk
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-neutral-400 block font-semibold">
              Tier
            </span>
            <span className="text-xs font-bold text-white">
              {data.difficulty}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-neutral-400 block font-semibold">
              Volume
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {totalExercises} Exercises
            </span>
          </div>
        </div>
      </div>

      {/* Short Overview & Full Methodology Card */}
      <div className="p-4 rounded-2xl bg-o1-card border border-white/[0.07] space-y-3.5 shadow-2xs">
        {/* Short Hook */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <AlignLeft size={13} className="text-neutral-500" />
            <span>Marketplace Hook (Short Overview)</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed bg-o1-well p-3 rounded-xl border border-white/[0.07]">
            {shortText}
          </p>
        </div>

        {/* Full Methodology */}
        {methodologyText && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowFullMethodology((v) => !v);
              }}
              className="w-full flex items-center justify-between py-1 text-xs font-bold text-white cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <FileText size={13} className="text-neutral-500" />
                <span>Full Methodology & Periodization Syllabus</span>
              </div>
              {showFullMethodology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFullMethodology && (
              <div className="p-3.5 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {methodologyText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Curriculum Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-300 px-1">
          Curriculum Breakdown
        </h4>
        <div className="space-y-2">
          {data.weeks.map((w) => {
            const isExpanded = expandedWeeks.includes(w.weekNumber);
            const weekExCount = w.days.reduce((a, d) => a + d.exercises.length, 0);

            return (
              <div
                key={w.weekNumber}
                className="rounded-2xl bg-o1-card border border-white/[0.07] overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleWeek(w.weekNumber)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-o1-well transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Week {w.weekNumber}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      · {weekExCount} total exercises
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 space-y-2.5 border-t border-white/[0.05]">
                    {w.days.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl bg-o1-well border border-white/[0.07] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {d.dayName} — {d.splitFocus}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {d.exercises.length} exercises
                          </span>
                        </div>
                        {d.exercises.length === 0 ? (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Rest or Active Recovery
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {d.exercises.map((ex, idx) => (
                              <div
                                key={ex.id}
                                className="flex items-center justify-between text-[11px] text-neutral-300"
                              >
                                <span className="truncate pr-2 font-medium">
                                  {idx + 1}. {ex.name || 'Unnamed Exercise'}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                                  {ex.sets}×{ex.reps} ({ex.restSeconds}s rest)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default ProgramReviewStep;
