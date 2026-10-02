import React from 'react';
import { BookOpen, FileText, AlignLeft, PlusCircle } from 'lucide-react';
import { ProgramFormData, ProgramCategory, ProgramDifficulty } from './types';
import { ProgramCoverArtworkPicker } from './ProgramCoverArtworkPicker';
import { tactileEngine } from '../../../../services/tactileEngine';

const CATEGORIES: ProgramCategory[] = [
  'Hypertrophy', 'Push Pull Legs', 'Strength', 'Powerlifting', 'HYROX',
  'Combat & Boxing', 'Endurance', 'Mobility', 'Sport-Specific', 'Calisthenics',
  'Conditioning', 'Body Recomp', 'Weight Loss', 'Upper / Lower', 'Full Body', 'Beginner Friendly',
];
const DIFFICULTIES: ProgramDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const DURATIONS = [1, 2, 3, 4, 6, 8, 10, 12, 16];
const DAYS_PER_WEEK = [2, 3, 4, 5, 6, 7];

export const ProgramDetailsStep: React.FC<{
  data: ProgramFormData;
  onChange: (u: Partial<ProgramFormData>) => void;
}> = ({ data, onChange }) => {
  const currentShortOverview = data.shortOverview !== undefined ? data.shortOverview : data.description;
  const currentMethodology = data.fullMethodology || '';

  const handleAppendMethodologySection = (sectionTitle: string, templateBody: string) => {
    tactileEngine.triggerImpactPulse();
    const existing = currentMethodology.trim();
    const addition = `\n\n### ${sectionTitle}\n${templateBody}`;
    const next = existing ? `${existing}${addition}` : `### ${sectionTitle}\n${templateBody}`;
    onChange({ fullMethodology: next });
  };

  const wordCount = currentMethodology.trim() ? currentMethodology.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Program Details
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Set title, athletic overview, cover asset, and training schedule
        </p>
      </div>

      {/* Program Title */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
          Program Title *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. 12-Week Strength & Power Protocol"
          className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none transition-colors"
        />
      </div>

      {/* Program Overview & Methodology Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {data.descriptionMode === 'short' ? 'Short Overview' : 'Full Methodology'}
          </label>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#18181B] p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onChange({ descriptionMode: 'short' });
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                data.descriptionMode === 'short'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft size={11} />
              <span>Short Overview</span>
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onChange({ descriptionMode: 'methodology' });
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                data.descriptionMode === 'methodology'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileText size={11} />
              <span>Full Methodology</span>
            </button>
          </div>
        </div>

        {/* View 1: Short Overview */}
        {data.descriptionMode === 'short' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>Catchy 1–2 sentence hook for program cards & marketplace preview</span>
              <span>{currentShortOverview.length}/140</span>
            </div>

            <textarea
              rows={3}
              maxLength={140}
              value={currentShortOverview}
              onChange={(e) => {
                onChange({
                  shortOverview: e.target.value,
                  description: e.target.value,
                });
              }}
              placeholder="e.g. High-volume hypertrophy system engineering maximum myofibrillar growth with calibrated mechanical tension."
              className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none resize-none transition-colors"
            />
          </div>
        ) : (
          /* View 2: Full Methodology */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>In-depth training philosophy, periodization phases, fatigue rules & athlete guidelines</span>
              <span>{wordCount} words</span>
            </div>

            {/* Structured Section Quick Inserts */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <PlusCircle size={11} /> Add Section:
              </span>
              <button
                type="button"
                onClick={() => handleAppendMethodologySection(
                  'Periodization Architecture',
                  '- Phase 1 (Weeks 1-2): Accumulation & motor recruitment (RPE 7-8)\n- Phase 2 (Weeks 3-4): Mechanical tension & progressive overload (RPE 8-9)\n- Deload Week: 40% reduction in compound training volume'
                )}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                + Periodization
              </button>
              <button
                type="button"
                onClick={() => handleAppendMethodologySection(
                  'Progressive Overload Directives',
                  '- Micro-load compounds by 2.5kg once top rep bracket is completed across all working sets.\n- Maintain 2-3 minutes rest between compound multi-joint efforts.'
                )}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                + Overload Rules
              </button>
              <button
                type="button"
                onClick={() => handleAppendMethodologySection(
                  'Fatigue & Recovery Protocol',
                  '- Hydration threshold: minimum 3.5L fluids on training days.\n- Sleep target: 7.5 - 9.0 hours sleep for optimal endocrine restoration.\n- Ensure 48 hours recovery before retraining matching prime movers.'
                )}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                + Recovery & Fatigue
              </button>
              <button
                type="button"
                onClick={() => handleAppendMethodologySection(
                  'Nutrition & Fueling Framework',
                  '- Daily protein requirement: 2.0g - 2.2g per kg target bodyweight.\n- Pre-session fueling: 40-60g fast-acting carbohydrates 45 mins prior.'
                )}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                + Nutrition
              </button>
            </div>

            <textarea
              rows={7}
              value={currentMethodology}
              onChange={(e) => onChange({ fullMethodology: e.target.value })}
              placeholder="Detail your scientific rationale, split structure, periodization phases, warm-up protocols, and recovery expectations. Athletes will be able to read this comprehensive syllabus in their program portal."
              className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none resize-y min-h-[140px] transition-colors leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Category & Discipline */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
          Category & Discipline
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const isSelected = data.category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange({ category: c });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-2xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
          Difficulty Level
        </label>
        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 gap-1">
          {DIFFICULTIES.map((d) => {
            const isSelected = data.difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange({ difficulty: d });
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration (Weeks) */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
          Duration (Weeks)
        </label>
        <div className="p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {DURATIONS.map((w) => {
            const isSelected = data.durationWeeks === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange({ durationWeeks: w });
                }}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Training Days / Week */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
          Training Days / Week
        </label>
        <div className="p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between gap-1">
          {DAYS_PER_WEEK.map((days) => {
            const isSelected = data.trainingDaysPerWeek === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange({ trainingDaysPerWeek: days });
                }}
                className={`flex-1 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {days}
              </button>
            );
          })}
        </div>
      </div>

      {/* Program Artwork Picker */}
      <div>
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
          Program Artwork
        </label>
        <ProgramCoverArtworkPicker
          coverImage={data.coverImage}
          coverSource={data.coverSource}
          category={data.category}
          onUpdate={onChange}
        />
      </div>
    </div>
  );
};

export default ProgramDetailsStep;
