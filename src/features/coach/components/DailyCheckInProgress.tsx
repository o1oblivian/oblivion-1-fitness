import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, Send, MessageCircle, AlertCircle, CheckCircle2, ChevronDown, Activity, Dumbbell, Bell } from 'lucide-react';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { useCoachStore } from '../../../stores/useCoachStore';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';

export interface DailyCheckInProgressProps {
  checkins: AthleteCheckInSubmission[];
  onReplyFeedback: (checkinId: string, feedback: string) => void;
  onSubmitNewCheckin: (checkin: Omit<AthleteCheckInSubmission, 'id' | 'coachFeedback'>) => void;
}

export const DailyCheckInProgress: React.FC<DailyCheckInProgressProps> = ({
  checkins,
  onReplyFeedback,
  onSubmitNewCheckin,
}) => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Athlete Form State
  const [weightKg, setWeightKg] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sorenessRating, setSorenessRating] = useState(0);
  const [stressRating, setStressRating] = useState(0);
  const [notes, setNotes] = useState('');

  // Coach Live Telemetry & Workout Finish Records
  const liveTelemetry = useCoachStore((s) => s.liveTelemetry);
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const submitCoachFeedback = useCoachStore((s) => s.submitCoachFeedback);
  const [workoutFeedbackText, setWorkoutFeedbackText] = useState<{ [id: string]: string }>({});

  const handleSendFeedback = (id: string) => {
    if (!replyText.trim()) return;
    tactileEngine.triggerImpactPulse();
    onReplyFeedback(id, replyText.trim());
    setActiveReplyId(null);
    setReplyText('');
  };

  const handleSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    tactileEngine.playPRCelebration();
    onSubmitNewCheckin({
      athleteId: localStorage.getItem('o1fc_user_id') || '',
      athleteName: 'You',
      coachId: localStorage.getItem('o1fc_user_id') || '',
      date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      weightKg: parseFloat(weightKg) || 0,
      sleepHours: parseFloat(sleepHours) || 0,
      sorenessRating,
      stressRating,
      nutritionAdherence: 0,
      completedSessionsCount: 0,
      targetSessionsCount: 0,
      notes: notes.trim(),
    });
    setNotes('');
    setIsSubmitOpen(false);
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* 1. Header with Quick Check-In CTA */}
      <div className="p-2.5 rounded-2xl bg-o1-card border border-white/[0.07] shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-o1-crimson/10 border border-o1-crimson/20 flex items-center justify-center text-o1-crimson">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">
              Check-in
            </h4>
            <p className="text-[10px] text-neutral-500">
              Weight, sleep, and how the day felt
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsSubmitOpen((v) => !v);
          }}
          className="px-3 py-1.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-[11px] font-tactical font-black tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
        >
          <span>{isSubmitOpen ? 'Close' : 'Check-in'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSubmitOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Real-time Client Live Telemetry stream */}
      {Object.values(liveTelemetry).some((t) => t.isLive) && (
        <div className="p-2.5 rounded-2xl bg-o1-well border border-white/[0.07] text-white space-y-2 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Live athlete telemetry in progress
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400">Realtime</span>
          </div>

          {Object.values(liveTelemetry)
            .filter((t) => t.isLive)
            .map((t) => (
              <div key={t.athleteId} className="p-3 rounded-2xl bg-black border border-white/[0.07] flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-white tracking-wide">{t.athleteName}</h5>
                  <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    {t.activeExercise || 'In session'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-o1-crimson">
                    {t.sessionTonnageKg.toLocaleString()} KG
                  </span>
                  <span className="block text-[9px] font-mono text-neutral-500">Session Volume</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Finished Workout History & Daily Feedback Ledger */}
      {finishedWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-o1-crimson" />
              <span className="text-xs font-tactical font-black tracking-wider text-white">
                Finished workouts ({finishedWorkouts.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● Ready for feedback
            </span>
          </div>

          <div className="space-y-2.5">
            {finishedWorkouts.map((w) => (
              <div
                key={w.id}
                className="p-2.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2 shadow-sm transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-tactical">
                        {w.athleteName}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">• {w.completedAt}</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-black text-o1-crimson mt-0.5">{w.title}</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white">
                      {w.tonnageKg.toLocaleString()} KG
                    </span>
                    <span className="block text-[9px] font-mono text-neutral-500">
                      {w.totalSets} sets • {w.totalReps} reps
                    </span>
                  </div>
                </div>

                {/* Exercises Summary */}
                <div className="flex flex-wrap gap-1.5">
                  {w.exercises.map((e, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-xl bg-white/[0.08] text-[10px] font-mono text-neutral-300 border border-white/[0.07]"
                    >
                      {e.name} ({e.sets}×{e.reps} @ {e.weightKg}kg)
                    </span>
                  ))}
                </div>

                {/* Coach Feedback Given or Input Form */}
                {w.feedback ? (
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-sky-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Reply
                      </span>
                      <span>{w.feedbackGivenAt || 'Just now'}</span>
                    </div>
                    <p className="text-xs text-neutral-200 font-sans italic">
                      "{w.feedback}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span className="font-bold text-neutral-300">
                        Give Daily Feedback to {w.athleteName}:
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={workoutFeedbackText[w.id] || ''}
                        onChange={(e) =>
                          setWorkoutFeedbackText((prev) => ({ ...prev, [w.id]: e.target.value }))
                        }
                        placeholder="Type coaching cues, recovery notes or volume adjustments..."
                        className="flex-1 px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-o1-crimson"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = (workoutFeedbackText[w.id] || '').trim();
                          if (!text) return;
                          submitCoachFeedback(w.id, text);
                          setWorkoutFeedbackText((prev) => ({ ...prev, [w.id]: '' }));
                        }}
                        className="px-3 py-2 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. New Athlete Check-in Form Drawer */}
      {isSubmitOpen && (
        <form
          onSubmit={handleSubmitCheckin}
          className="p-2.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2.5 shadow-sm animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
            <span className="text-xs font-tactical font-bold text-white">
              Today
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1">
                Bodyweight (KG)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={weightKg}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWeightKg(sanitizeNumericInput(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white focus:outline-none focus:border-o1-crimson"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1">
                Sleep Duration (HRS)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={sleepHours}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white focus:outline-none focus:border-o1-crimson"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500">
                  Muscle Soreness
                </label>
                <span className="text-xs font-mono font-bold text-o1-crimson">{sorenessRating || '--'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={sorenessRating}
                onChange={(e) => setSorenessRating(Number(e.target.value))}
                className="w-full accent-o1-crimson"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500">
                  Life Stress Level
                </label>
                <span className="text-xs font-mono font-bold text-neutral-200">{stressRating || '--'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={stressRating}
                onChange={(e) => setStressRating(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1">
              Workout Notes & Sensation
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Felt great on squats, slight tightness on left shoulder during overhead press..."
              className="w-full p-2.5 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.98] text-white text-xs font-tactical font-black tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      )}

      {/* 3. Check-in Timeline & Feedback Stream */}
      <div className="space-y-3">
        {checkins.length === 0 ? (
          <div className="p-6 rounded-2xl bg-o1-card border border-dashed border-white/[0.07] text-center space-y-2 shadow-xs">
            <ClipboardCheck className="w-7 h-7 text-neutral-400 mx-auto" />
            <p className="text-xs font-semibold text-neutral-300">
              No daily check-ins submitted yet.
            </p>
            <p className="text-[11px] text-neutral-400">
              A check-in shows here after it is sent.
            </p>
          </div>
        ) : (
          checkins.map((chk) => (
          <div
            key={chk.id}
            className="p-2.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs font-tactical text-white">
                  {chk.athleteName}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">• {chk.date}</span>
              </div>
              {chk.nutritionAdherence > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-o1-well border border-white/[0.07] text-[10px] text-neutral-300">
                  {chk.nutritionAdherence}% food
                </span>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-o1-well border border-white/[0.07]">
                <span className="text-[9px] font-mono text-neutral-400 block">Weight</span>
                <span className="text-xs font-mono font-bold text-white">
                  {chk.weightKg > 0 ? `${chk.weightKg} kg` : '--'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-o1-well border border-white/[0.07]">
                <span className="text-[9px] font-mono text-neutral-400 block">Sleep</span>
                <span className="text-xs font-mono font-bold text-white">
                  {chk.sleepHours > 0 ? `${chk.sleepHours} h` : '--'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-o1-well border border-white/[0.07]">
                <span className="text-[9px] font-mono text-neutral-400 block">Soreness</span>
                <span className="text-xs font-mono font-bold text-white">
                  {chk.sorenessRating > 0 ? `${chk.sorenessRating}/10` : '--'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-o1-well border border-white/[0.07]">
                <span className="text-[9px] font-mono text-neutral-400 block">Stress</span>
                <span className="text-xs font-mono font-bold text-white">
                  {chk.stressRating > 0 ? `${chk.stressRating}/10` : '--'}
                </span>
              </div>
            </div>

            {/* Athlete Notes */}
            {chk.notes ? (
              <p className="text-xs text-neutral-300 leading-relaxed bg-o1-well p-2.5 rounded-xl border border-white/[0.07]">
                {chk.notes}
              </p>
            ) : null}

            {/* Coach Feedback Section */}
            {chk.coachFeedback?.feedbackText ? (
              <div className="p-3 rounded-2xl bg-sky-950/20 border border-sky-800/40 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold text-sky-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Reply
                  </span>
                  <span className="text-neutral-400">{chk.coachFeedback.givenAt}</span>
                </div>
                <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                  {chk.coachFeedback.feedbackText}
                </p>

                {chk.coachFeedback.suggestedAdjustments && chk.coachFeedback.suggestedAdjustments.length > 0 && (
                  <div className="pt-1.5 border-t border-sky-800/40 flex flex-wrap gap-1.5">
                    {chk.coachFeedback.suggestedAdjustments.map((adj, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-o1-card border border-sky-700/60 text-[10px] font-mono font-semibold text-sky-400"
                      >
                        ⚡ {adj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Awaiting coach review & dispatch adjustment
                </span>

                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setActiveReplyId(activeReplyId === chk.id ? null : chk.id);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-tactical font-black tracking-wider cursor-pointer"
                >
                  Add Feedback
                </button>
              </div>
            )}

            {/* Coach Feedback Input Box (If reviewing as coach) */}
            {activeReplyId === chk.id && (
              <div className="pt-2 border-t border-white/[0.05] space-y-2 animate-in fade-in duration-150">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide feedback or program adjustments..."
                  className="w-full p-2.5 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(null)}
                    className="px-3 py-1 rounded-xl text-xs font-mono text-neutral-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendFeedback(chk.id)}
                    className="px-3.5 py-1 rounded-xl bg-o1-crimson text-white text-xs font-tactical font-bold tracking-wider"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        )))}
      </div>
    </div>
  );
};
