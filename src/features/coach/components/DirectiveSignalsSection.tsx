import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { DirectiveItem } from '../types/coachDirectives';
import { tactileEngine } from '../../../services/tactileEngine';

;
;

export interface NoteDraft {
  tag: DirectiveItem['tag'];
  title: string;
  summary: string;
}

export interface DirectiveSignalsSectionProps {
  /** Null while loading. */
  directives: DirectiveItem[] | null;
  loadFailed?: boolean;
  onRetry?: () => void;
  /** Each resolves true once the change is saved. */
  onSendNote: (draft: NoteDraft) => Promise<boolean>;
  onEditNote: (id: string, draft: NoteDraft) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
}

const TOPICS: { tag: DirectiveItem['tag']; label: string }[] = [
  { tag: 'TRAINING', label: 'Training' },
  { tag: 'RECOVERY', label: 'Recovery' },
  { tag: 'NUTRITION', label: 'Food' },
  { tag: 'PERFORMANCE', label: 'Progress' },
];

const topicLabel = (tag: DirectiveItem['tag']) => TOPICS.find((item) => item.tag === tag)?.label || tag;

function noteDate(iso?: string): string {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

function draftFrom(tag: DirectiveItem['tag'], text: string): NoteDraft {
  const clean = text.trim();
  return { tag, title: clean.slice(0, 80), summary: clean };
}

const TopicPicker: React.FC<{ value: DirectiveItem['tag']; onChange: (tag: DirectiveItem['tag']) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1.5 overflow-x-auto px-1 no-scrollbar">
    {TOPICS.map((item) => (
      <button
        key={item.tag}
        type="button"
        aria-pressed={value === item.tag}
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChange(item.tag);
        }}
        className={`o1-pill shrink-0 border text-[12px] font-semibold active:scale-[0.98] ${
          value === item.tag ? 'border-o1-crimson bg-o1-crimson text-white' : 'border-white/[0.07] bg-o1-surface text-o1-text'
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
);

const NoteRow: React.FC<{
  note: DirectiveItem;
  onEdit: (draft: NoteDraft) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}> = ({ note, onEdit, onDelete }) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm'>('view');
  const [tag, setTag] = useState(note.tag);
  const [text, setText] = useState(note.summary || note.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<boolean>, failure: string) => {
    setBusy(true);
    setError('');
    const ok = await action();
    setBusy(false);
    if (ok) setMode('view');
    else setError(failure);
  };

  if (mode === 'edit') {
    return (
      <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
        <TopicPicker value={tag} onChange={setTag} />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={500}
          aria-label="Edit note"
          className="w-full resize-none rounded-xl border border-white/[0.07] bg-o1-canvas px-3 py-2 text-[13px] text-o1-text outline-none focus:border-o1-crimson"
        />
        {error ? <p role="alert" className="text-[12px] text-o1-text">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('view');
              setTag(note.tag);
              setText(note.summary || note.title);
              setError('');
            }}
            className="h-[44px] flex-1 rounded-xl border border-white/[0.07] text-[13px] font-semibold text-o1-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => void run(() => onEdit(draftFrom(tag, text)), 'Could not save the change. Try again.')}
            className="h-[44px] flex-1 rounded-xl bg-o1-crimson text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-o1-surface px-3 py-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-o1-muted">
            {[topicLabel(note.tag), noteDate(note.createdAt)].filter(Boolean).join(' · ')}
          </span>
          <p className="text-[13px] font-semibold text-o1-text">{note.title}</p>
          {note.summary && note.summary !== note.title ? <p className="mt-1 text-[12px] text-o1-muted">{note.summary}</p> : null}
        </div>
        {mode === 'view' ? (
          <div className="flex shrink-0">
            <button
              type="button"
              aria-label="Edit note"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setMode('edit');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-o1-muted active:bg-white/[0.06]"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label="Delete note"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setMode('confirm');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-o1-muted active:bg-white/[0.06]"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : null}
      </div>
      {mode === 'confirm' ? (
        <div className="mt-2 space-y-2">
          <p className="text-[12px] text-o1-text">Delete this note for every client?</p>
          {error ? <p role="alert" className="text-[12px] text-o1-text">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('view');
                setError('');
              }}
              className="h-[44px] flex-1 rounded-xl border border-white/[0.07] text-[13px] font-semibold text-o1-text"
            >
              Keep
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onDelete, 'Could not delete the note. Try again.')}
              className="h-[44px] flex-1 rounded-xl bg-o1-crimson text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** Notes the coach sends to every client on the roster. */
export const DirectiveSignalsSection: React.FC<DirectiveSignalsSectionProps> = ({
  directives,
  loadFailed = false,
  onRetry,
  onSendNote,
  onEditNote,
  onDeleteNote,
}) => {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<DirectiveItem['tag']>('TRAINING');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  const send = async () => {
    if (!text.trim() || sending) return;
    tactileEngine.triggerImpactPulse();
    setSending(true);
    setSendFailed(false);
    const ok = await onSendNote(draftFrom(topic, text));
    setSending(false);
    if (ok) setText('');
    else setSendFailed(true);
  };

  return (
    <div className="space-y-2">
      <div className="px-1">
        <p className="text-[13px] font-semibold text-o1-text">Notes to all clients</p>
        <p className="text-[12px] text-o1-muted">Everyone on your roster sees these.</p>
      </div>
      <TopicPicker value={topic} onChange={setTopic} />
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
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
          disabled={!text.trim() || sending}
          className="h-[44px] rounded-xl bg-o1-crimson px-4 text-[13px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {sendFailed ? <p role="alert" className="px-1 text-[12px] text-o1-text">Could not send. Check your connection and try again.</p> : null}
      {loadFailed ? (
        <div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2">
          <p className="text-[12px] text-o1-text">Could not load your notes.</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="min-h-[36px] px-2 text-[12px] font-semibold text-o1-text">
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {directives === null ? (
        <p className="px-1 py-4 text-center text-[12px] text-o1-muted">Loading notes…</p>
      ) : directives.length === 0 ? (
        <p className="px-1 py-4 text-center text-[12px] text-o1-muted">No notes yet.</p>
      ) : (
        directives.map((dir) => (
          <NoteRow key={dir.id} note={dir} onEdit={(draft) => onEditNote(dir.id, draft)} onDelete={() => onDeleteNote(dir.id)} />
        ))
      )}
    </div>
  );
};

