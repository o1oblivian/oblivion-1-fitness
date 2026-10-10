import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, AlignLeft, FileText } from 'lucide-react';
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
    <div className="space-y-4 text-o1-text select-none">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-o1-text" />
          <h3 className="text-sm font-bold text-o1-text">
            Review & Publish
          </h3>
        </div>
        <p className="text-xs text-o1-muted">
          Confirm full curriculum integrity and syllabus before publishing
        </p>
      </div>

      {/* Program Summary Card */}
      <div className="rounded-2xl bg-o1-surface border border-white/[0.07] overflow-hidden space-y-3.5 p-3.5 shadow-2xs">
        <div className="relative h-40 rounded-2xl overflow-hidden bg-o1-canvas">
          <img
            src={data.coverImage}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-o1-text text-[10px] font-bold tracking-wider border border-white/[0.07]">
                {data.category}
              </span>
              <span className="px-3 py-1 rounded-xl bg-o1-crimson text-o1-text text-xs font-mono font-bold shadow-xs">
                {data.isFreeCommunity ? 'Free Access' : `$${data.priceUsd.toFixed(2)}`}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-o1-text leading-tight">
                {data.title || 'Untitled Protocol'}
              </h4>
              <p className="text-xs text-o1-text line-clamp-1 mt-0.5">{shortText}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-o1-muted block font-semibold">
              Duration
            </span>
            <span className="text-xs font-bold text-o1-text">
              {data.durationWeeks} Weeks
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-o1-muted block font-semibold">
              Frequency
            </span>
            <span className="text-xs font-bold text-o1-text">
              {data.trainingDaysPerWeek} Days/Wk
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-o1-muted block font-semibold">
              Tier
            </span>
            <span className="text-xs font-bold text-o1-text">
              {data.difficulty}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07]">
            <span className="text-[9px] tracking-wider text-o1-muted block font-semibold">
              Volume
            </span>
            <span className="text-xs font-bold text-o1-text font-mono">
              {totalExercises} Exercises
            </span>
          </div>
        </div>
      </div>

      {/* Short Overview & Full Methodology Card */}
      <div className="p-4 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-3.5 shadow-2xs">
        {/* Short Hook */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-o1-text">
            <AlignLeft size={13} className="text-o1-muted" />
            <span>Marketplace Hook (Short Overview)</span>
          </div>
          <p className="text-xs text-o1-text leading-relaxed bg-o1-sheet p-3 rounded-xl border border-white/[0.07]">
            {shortText}
          </p>
        </div>

        {/* Full Methodology */}
        {methodologyText && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowFullMethodology((v) => !v);
              }}
              className="w-full flex items-center justify-between py-1 text-xs font-bold text-o1-text cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <FileText size={13} className="text-o1-muted" />
                <span>Full Methodology & Periodization Syllabus</span>
              </div>
              {showFullMethodology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFullMethodology && (
              <div className="p-3.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {methodologyText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Curriculum Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-o1-text px-1">
          Curriculum Breakdown
        </h4>
        <div className="space-y-2">
          {data.weeks.map((w) => {
            const isExpanded = expandedWeeks.includes(w.weekNumber);
            const weekExCount = w.days.reduce((a, d) => a + d.exercises.length, 0);

            return (
              <div
                key={w.weekNumber}
                className="rounded-2xl bg-o1-surface border border-white/[0.07] overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleWeek(w.weekNumber)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-o1-sheet transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-o1-text">
                      Week {w.weekNumber}
                    </span>
                    <span className="text-[10px] font-mono text-o1-muted">
                      · {weekExCount} total exercises
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-o1-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-o1-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 space-y-2.5 border-t border-white/[0.07]">
                    {w.days.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl bg-o1-sheet border border-white/[0.07] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-o1-text">
                            {d.dayName} — {d.splitFocus}
                          </span>
                          <span className="text-[10px] font-mono text-o1-muted">
                            {d.exercises.length} exercises
                          </span>
                        </div>
                        {d.exercises.length === 0 ? (
                          <div className="text-[10px] text-o1-muted font-mono">
                            Rest or Active Recovery
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {d.exercises.map((ex, idx) => (
                              <div
                                key={ex.id}
                                className="flex items-center justify-between text-[11px] text-o1-text"
                              >
                                <span className="truncate pr-2 font-medium">
                                  {idx + 1}. {ex.name || 'Unnamed Exercise'}
                                </span>
                                <span className="text-[10px] font-mono text-o1-muted shrink-0">
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
