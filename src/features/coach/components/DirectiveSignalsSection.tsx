import React, { useState } from 'react';
import { DIRECTIVES_LIST, DirectiveItem } from '../types/coachDirectives';
import { tactileEngine } from '../../../services/tactileEngine';

export { DIRECTIVES_LIST };
export type { DirectiveItem };

export interface NoteDraft {
  tag: DirectiveItem['tag'];
  title: string;
  summary: string;
}

export interface DirectiveSignalsSectionProps {
  directives?: DirectiveItem[];
  onSendNote: (draft: NoteDraft) => void;
}

const TOPICS: { tag: DirectiveItem['tag']; label: string }[] = [
  { tag: 'TRAINING', label: 'Training' },
  { tag: 'RECOVERY', label: 'Recovery' },
  { tag: 'NUTRITION', label: 'Food' },
  { tag: 'PERFORMANCE', label: 'Progress' },
];

/** Notes the coach sends to every client on the roster. */
export const DirectiveSignalsSection: React.FC<DirectiveSignalsSectionProps> = ({
  directives = [],
  onSendNote,
}) => {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<DirectiveItem['tag']>('TRAINING');
  const visible = directives.filter((dir) => dir.tag === topic);

  const send = () => {
    const clean = text.trim();
    if (!clean) return;
    tactileEngine.triggerImpactPulse();
    onSendNote({ tag: topic, title: clean.slice(0, 80), summary: clean });
    setText('');
  };

  return (
    <div className="space-y-2">
      <div className="px-1">
        <p className="text-[13px] font-semibold text-[#EAE8DF]">Notes to all clients</p>
        <p className="text-[12px] text-[#8A887F]">Everyone on your roster sees these.</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-1">
        {TOPICS.map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setTopic(item.tag);
            }}
            className={`o1-pill shrink-0 text-[12px] font-semibold active:scale-[0.98] ${
              topic === item.tag ? 'bg-white text-neutral-950' : 'border border-[#1F1F1F] bg-[#0E0E0E] text-[#EAE8DF]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note for everyone"
          className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-[#161616] px-3 text-[13px] text-white outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-[44px] rounded-xl bg-white px-4 text-[13px] font-semibold text-neutral-950 disabled:opacity-40"
        >
          Send
        </button>
      </form>
      {visible.length === 0 ? (
        <p className="px-1 py-4 text-center text-[12px] text-[#8A887F]">No notes yet.</p>
      ) : (
        visible.map((dir) => (
          <div key={dir.id} className="rounded-2xl border border-white/[0.07] bg-o1-card px-3 py-3">
            <p className="text-[13px] font-semibold text-white">{dir.title}</p>
            {dir.summary && dir.summary !== dir.title ? (
              <p className="mt-1 text-[12px] text-neutral-400">{dir.summary}</p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
};

export default DirectiveSignalsSection;
