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
  const topicLabel = (tag: DirectiveItem['tag']) => TOPICS.find((item) => item.tag === tag)?.label || tag;

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
        <p className="text-[13px] font-semibold text-o1-text">Notes to all clients</p>
        <p className="text-[12px] text-o1-muted">Everyone on your roster sees these.</p>
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
              topic === item.tag ? 'bg-white text-neutral-950' : 'border border-white/[0.07] bg-o1-surface text-o1-text'
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
          maxLength={500}
          className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-o1-canvas px-3 text-[13px] text-o1-text outline-none focus:border-o1-crimson"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-[44px] rounded-xl bg-o1-crimson px-4 text-[13px] font-semibold text-o1-text active:scale-[0.98] disabled:opacity-40"
        >
          Send
        </button>
      </form>
      {directives.length === 0 ? (
        <p className="px-1 py-4 text-center text-[12px] text-o1-muted">No notes yet.</p>
      ) : (
        directives.map((dir) => (
          <div key={dir.id} className="rounded-2xl border border-white/[0.07] bg-o1-surface px-3 py-3">
            <span className="text-[11px] font-semibold text-o1-muted">{topicLabel(dir.tag)}</span>
            <p className="text-[13px] font-semibold text-o1-text">{dir.title}</p>
            {dir.summary && dir.summary !== dir.title ? (
              <p className="mt-1 text-[12px] text-o1-muted">{dir.summary}</p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
};

export default DirectiveSignalsSection;
