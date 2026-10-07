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
    <div className="p-4 rounded-2xl bg-o1-card border border-white/[0.07] text-neutral-100 space-y-3 shadow-md select-none transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-o1-crimson animate-pulse" />
          <div>
            <span className="text-[10px] font-tactical uppercase text-neutral-500 font-semibold tracking-wide block">
              Broadcast Channel
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-tactical">
              Directive Signals
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-tactical text-neutral-400 font-medium tabular-nums">
          {filtered.length} Directives
        </span>
      </div>

      <div className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto overscroll-x-contain no-scrollbar scrollbar-none after:w-2 after:shrink-0 after:content-['']">
        {(['ALL', 'RECOVERY', 'TRAINING', 'NUTRITION', 'PERFORMANCE'] as const).map((tag) => (
          <button
            key={tag}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setSelectedTag(tag);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-tactical font-semibold uppercase whitespace-nowrap shrink-0 transition-all border cursor-pointer ${
              selectedTag === tag
                ? 'bg-o1-crimson text-white border-o1-crimson'
                : 'bg-o1-well text-neutral-400 border-white/[0.07] hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-2xl bg-o1-well border border-dashed border-white/[0.07] text-center space-y-2">
          <Radio className="w-5 h-5 text-neutral-500 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-300 font-tactical uppercase tracking-wider">
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
              className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-tactical font-semibold px-2 py-0.5 rounded-md border uppercase ${dir.badgeStyle}`}
                >
                  {dir.tag}
                </span>
                <span className="text-[10px] font-tactical text-neutral-400 tabular-nums">
                  Affects {dir.affectedCount} Athletes
                </span>
              </div>
              <h4 className="font-tactical font-bold text-xs uppercase text-white">
                {dir.title}
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                {dir.summary}
              </p>
              <button
                onClick={() => {
                  tactileEngine.triggerImpactPulse();
                  onDeployDirective(dir);
                }}
                className="w-full py-2 px-3 rounded-xl bg-o1-card hover:bg-o1-well border border-white/[0.07] text-neutral-200 text-[10px] font-tactical font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3 text-o1-crimson" />
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
