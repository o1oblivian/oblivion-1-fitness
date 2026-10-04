import React, { useState } from 'react';
import { Send, Radio } from 'lucide-react';
import { DIRECTIVES_LIST, DirectiveItem } from '../types/coachDirectives';
import { tactileEngine } from '../../../services/tactileEngine';

export { DIRECTIVES_LIST };
export type { DirectiveItem };

export interface DirectiveSignalsSectionProps {
  directives?: DirectiveItem[];
  onDeployDirective: (dir: DirectiveItem) => void;
}

export const DirectiveSignalsSection: React.FC<DirectiveSignalsSectionProps> = ({
  directives = [],
  onDeployDirective,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const activeList = directives;
  const filtered = activeList.filter((d) => (selectedTag === 'ALL' ? true : d.tag === selectedTag));

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 space-y-3 shadow-md select-none transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#C4121A] animate-pulse" />
          <div>
            <span className="text-[10px] font-tactical uppercase text-neutral-500 font-semibold tracking-wide block">
              Broadcast Channel
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-tactical">
              Directive Signals
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-tactical text-neutral-500 dark:text-neutral-400 font-medium tabular-nums">
          {filtered.length} Directives
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {(['ALL', 'RECOVERY', 'TRAINING', 'NUTRITION', 'PERFORMANCE'] as const).map((tag) => (
          <button
            key={tag}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setSelectedTag(tag);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-tactical font-semibold uppercase whitespace-nowrap transition-all border cursor-pointer ${
              selectedTag === tag
                ? 'bg-[#C4121A] text-white border-[#C4121A]'
                : 'bg-neutral-100 dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2">
          <Radio className="w-5 h-5 text-neutral-400 dark:text-neutral-500 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-tactical uppercase tracking-wider">
            NO RECORDS FOUND // SYNCHRONIZING...
          </h4>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
            Broadcast channel idle · Directives stream directly from database
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {filtered.map((dir) => (
            <div
              key={dir.id}
              className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-tactical font-semibold px-2 py-0.5 rounded-md border uppercase ${dir.badgeStyle}`}
                >
                  {dir.tag}
                </span>
                <span className="text-[10px] font-tactical text-neutral-500 dark:text-neutral-400 tabular-nums">
                  Affects {dir.affectedCount} Athletes
                </span>
              </div>
              <h4 className="font-tactical font-bold text-xs uppercase text-neutral-900 dark:text-white">
                {dir.title}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                {dir.summary}
              </p>
              <button
                onClick={() => {
                  tactileEngine.triggerImpactPulse();
                  onDeployDirective(dir);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#121214] hover:bg-neutral-100 dark:hover:bg-[#1a1a20] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[10px] font-tactical font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3 text-[#C4121A]" />
                <span>DEPLOY DIRECTIVE</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectiveSignalsSection;
