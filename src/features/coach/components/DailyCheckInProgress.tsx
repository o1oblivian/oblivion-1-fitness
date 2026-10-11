import React, { useState } from 'react';
import { ClipboardCheck, Send, ChevronDown } from 'lucide-react';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { CoachFinishedWorkoutLog } from '../../../stores/coachTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';

export interface CheckinDraft {
  weightKg: number | null;
  sleepHours: number | null;
  soreness: number | null;
  stress: number | null;
  notes: string;
}

export interface DailyCheckInProgressProps {
  coachName: string;
  /** Null while loading; the athlete's own check-ins, newest first. */
  checkins: AthleteCheckInSubmission[] | null;
  workouts: CoachFinishedWorkoutLog[] | null;
  loadFailed: boolean;
  onRetry: () => void;
  /** Resolves true once the coach can see the check-in. */
  onSubmit: (draft: CheckinDraft) => Promise<boolean>;
}

function positive(raw: string): number | null {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sessionDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/[0.07] bg-o1-sheet p-2 text-center">
    <span className="block text-[10px] text-o1-muted">{label}</span>
    <span className="text-[12px] font-semibold tabular-nums text-o1-text">{value}</span>
  </div>
);

const CoachReply: React.FC<{ coachName: string; text: string; when: string }> = ({ coachName, text, when }) => (
  <div className="space-y-1 rounded-xl border border-white/[0.07] bg-o1-sheet p-2.5">
    <div className="flex items-center justify-between text-[11px] text-o1-muted">
      <span className="font-semibold text-o1-text">{coachName}</span>
      {when ? <span>{when}</span> : null}
    </div>
    <p className="text-[13px] leading-relaxed text-o1-text">{text}</p>
  </div>
);

export const DailyCheckInProgress: React.FC<DailyCheckInProgressProps> = ({ coachName, checkins, workouts, loadFailed, onRetry, onSubmit }) => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [soreness, setSoreness] = useState(0);
  const [stress, setStress] = useState(0);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendFailed(false);
    const ok = await onSubmit({
      weightKg: positive(weightKg),
      sleepHours: positive(sleepHours),
      soreness: soreness || null,
      stress: stress || null,
      notes,
    });
    setSending(false);
    if (!ok) {
      setSendFailed(true);
      return;
    }
    tactileEngine.playPRCelebration();
    setWeightKg('');
    setSleepHours('');
    setSoreness(0);
    setStress(0);
    setNotes('');
    setIsSubmitOpen(false);
  };

  const reviewed = (workouts ?? []).filter((w) => w.feedback);

  return (
    <div className="w-full space-y-4 select-none">
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-o1-surface p-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-o1-crimson/20 bg-o1-crimson/10 text-o1-crimson">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-o1-text">Check-in</h4>
            <p className="text-[11px] text-o1-muted">Weight, sleep, and how the day felt</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsSubmitOpen((v) => !v);
          }}
          className="flex min-h-[44px] items-center gap-1 rounded-xl bg-o1-crimson px-3 text-[12px] font-semibold text-white active:scale-95"
        >
          <span>{isSubmitOpen ? 'Close' : 'New check-in'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSubmitOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {loadFailed ? (
        <div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2">
          <p className="text-[12px] text-o1-text">Could not load your check-ins.</p>
          <button type="button" onClick={onRetry} className="min-h-[36px] px-2 text-[12px] font-semibold text-o1-text">
            Retry
          </button>
        </div>
      ) : null}

      {isSubmitOpen && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[11px] text-o1-muted">Bodyweight (kg)</span>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="--"
                value={weightKg}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWeightKg(sanitizeNumericInput(e.target.value))}
                className="h-10 w-full rounded-xl border border-white/[0.07] bg-o1-sheet px-3 text-[13px] tabular-nums text-o1-text focus:border-o1-crimson focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-o1-muted">Sleep (hours)</span>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="--"
                value={sleepHours}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
                className="h-10 w-full rounded-xl border border-white/[0.07] bg-o1-sheet px-3 text-[13px] tabular-nums text-o1-text focus:border-o1-crimson focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-[11px] text-o1-muted">
                Soreness
                <span className="font-semibold tabular-nums text-o1-text">{soreness || '--'}</span>
              </span>
              <input type="range" min="0" max="10" value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="w-full accent-o1-crimson" />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-[11px] text-o1-muted">
                Stress
                <span className="font-semibold tabular-nums text-o1-text">{stress || '--'}</span>
              </span>
              <input type="range" min="0" max="10" value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full accent-o1-crimson" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] text-o1-muted">Notes for {coachName}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How training felt, anything sore or tight"
              className="w-full rounded-xl border border-white/[0.07] bg-o1-sheet p-2.5 text-[13px] text-o1-text placeholder:text-o1-muted focus:border-o1-crimson focus:outline-none"
            />
          </label>

          {sendFailed ? (
            <p role="alert" className="text-[12px] text-o1-text">Could not send. Check your connection and try again.</p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="flex h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-o1-crimson text-[13px] font-semibold text-white active:scale-[0.98] disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{sending ? 'Sending…' : `Send to ${coachName}`}</span>
          </button>
        </form>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-semibold text-o1-text">Session feedback</p>
          {reviewed.map((w) => (
            <div key={w.id} className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-o1-text">{w.title}</p>
                <p className="shrink-0 text-[11px] tabular-nums text-o1-muted">
                  {[sessionDate(w.completedAt), w.tonnageKg ? `${w.tonnageKg.toLocaleString()} kg` : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
              <CoachReply coachName={coachName} text={w.feedback || ''} when={w.feedbackGivenAt ? sessionDate(w.feedbackGivenAt) : ''} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {checkins === null ? (
          <p className="py-6 text-center text-[13px] text-o1-muted">Loading check-ins…</p>
        ) : checkins.length === 0 ? (
          <div className="space-y-1 rounded-2xl border border-dashed border-white/[0.07] bg-o1-surface p-6 text-center">
            <p className="text-[13px] font-semibold text-o1-text">No check-ins yet</p>
            <p className="text-[12px] text-o1-muted">Your check-ins and {coachName}'s replies show here.</p>
          </div>
        ) : (
          checkins.map((chk) => (
            <div key={chk.id} className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
              <p className="text-[12px] text-o1-muted">{chk.date || 'Check-in'}</p>
              <div className="grid grid-cols-4 gap-2">
                <Metric label="Weight" value={chk.weightKg > 0 ? `${chk.weightKg} kg` : '--'} />
                <Metric label="Sleep" value={chk.sleepHours > 0 ? `${chk.sleepHours} h` : '--'} />
                <Metric label="Soreness" value={chk.sorenessRating > 0 ? `${chk.sorenessRating}/10` : '--'} />
                <Metric label="Stress" value={chk.stressRating > 0 ? `${chk.stressRating}/10` : '--'} />
              </div>
              {chk.notes ? <p className="text-[13px] leading-relaxed text-o1-text">{chk.notes}</p> : null}
              {chk.coachFeedback?.feedbackText ? (
                <CoachReply coachName={coachName} text={chk.coachFeedback.feedbackText} when={chk.coachFeedback.givenAt} />
              ) : (
                <p className="text-[12px] text-o1-muted">Waiting for {coachName} to reply</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
