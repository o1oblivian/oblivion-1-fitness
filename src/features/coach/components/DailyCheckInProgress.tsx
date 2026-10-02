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
  const [weightKg, setWeightKg] = useState('84.5');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sorenessRating, setSorenessRating] = useState(4);
  const [stressRating, setStressRating] = useState(3);
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
      athleteId: 'ath-current',
      athleteName: 'You (Current Athlete)',
      coachId: 'coach_alpha',
      date: 'Just now',
      weightKg: parseFloat(weightKg) || 84.0,
      sleepHours: parseFloat(sleepHours) || 8.0,
      sorenessRating,
      stressRating,
      nutritionAdherence: 95,
      completedSessionsCount: 4,
      targetSessionsCount: 4,
      notes: notes || 'Daily check-in completed. Feeling ready for upcoming sessions.',
    });
    setNotes('');
    setIsSubmitOpen(false);
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* 1. Header with Quick Check-In CTA */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#C4121A]/10 border border-[#C4121A]/20 flex items-center justify-center text-[#C4121A]">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
              DAILY PROGRESS & COACH AUDIT
            </h4>
            <p className="text-[10px] font-mono text-neutral-500">
              Biometric check-ins, soreness ratings & feedback loop
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsSubmitOpen((v) => !v);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] active:scale-95 text-white text-[11px] font-tactical font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
        >
          <span>{isSubmitOpen ? 'CLOSE FORM' : 'LOG CHECK-IN'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSubmitOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Real-time Client Live Telemetry stream */}
      {Object.values(liveTelemetry).some((t) => t.isLive) && (
        <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 text-white space-y-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                LIVE ATHLETE TELEMETRY IN PROGRESS
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400">REALTIME</span>
          </div>

          {Object.values(liveTelemetry)
            .filter((t) => t.isLive)
            .map((t) => (
              <div key={t.athleteId} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-white tracking-wide">{t.athleteName}</h5>
                  <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    Executing: {t.activeExercise || 'Prescribed Protocol'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-[#C4121A]">
                    {t.sessionTonnageKg.toLocaleString()} KG
                  </span>
                  <span className="block text-[9px] font-mono text-neutral-500">SESSION VOLUME</span>
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
              <Bell className="w-4 h-4 text-[#C4121A]" />
              <span className="text-xs font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                CLIENT WORKOUT LOGS &amp; NOTIFICATIONS ({finishedWorkouts.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● READY FOR FEEDBACK
            </span>
          </div>

          <div className="space-y-2.5">
            {finishedWorkouts.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-sm transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white font-tactical">
                        {w.athleteName}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">• {w.completedAt}</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-black text-[#C4121A] mt-0.5">{w.title}</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
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
                      className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                    >
                      {e.name} ({e.sets}×{e.reps} @ {e.weightKg}kg)
                    </span>
                  ))}
                </div>

                {/* Coach Feedback Given or Input Form */}
                {w.feedback ? (
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        COACH FEEDBACK DISPATCHED
                      </span>
                      <span>{w.feedbackGivenAt || 'Just now'}</span>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 font-sans italic">
                      "{w.feedback}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">
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
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#C4121A]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = (workoutFeedbackText[w.id] || '').trim();
                          if (!text) return;
                          submitCoachFeedback(w.id, text);
                          setWorkoutFeedbackText((prev) => ({ ...prev, [w.id]: '' }));
                        }}
                        className="px-3 py-2 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] active:scale-95 text-white text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1 shrink-0"
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
          className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 space-y-3.5 shadow-sm animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-tactical font-bold text-neutral-900 dark:text-white uppercase">
              Submit Today's Readiness Check-In
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Direct Sync to Coach</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-500 block mb-1">
                Bodyweight (KG)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={weightKg}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWeightKg(sanitizeNumericInput(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-[#C4121A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-500 block mb-1">
                Sleep Duration (HRS)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={sleepHours}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-[#C4121A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  Muscle Soreness
                </label>
                <span className="text-xs font-mono font-bold text-[#C4121A]">{sorenessRating}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sorenessRating}
                onChange={(e) => setSorenessRating(Number(e.target.value))}
                className="w-full accent-[#C4121A]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  Life Stress Level
                </label>
                <span className="text-xs font-mono font-bold text-sky-500">{stressRating}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressRating}
                onChange={(e) => setStressRating(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-neutral-500 block mb-1">
              Workout Notes & Sensation
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Felt great on squats, slight tightness on left shoulder during overhead press..."
              className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C4121A]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] active:scale-[0.98] text-white text-xs font-tactical font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>DISPATCH CHECK-IN TO COACH</span>
          </button>
        </form>
      )}

      {/* 3. Check-in Timeline & Feedback Stream */}
      <div className="space-y-3">
        {checkins.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2 shadow-xs">
            <ClipboardCheck className="w-7 h-7 text-neutral-400 mx-auto" />
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              No daily check-ins submitted yet.
            </p>
            <p className="text-[11px] text-neutral-400">
              Tap "LOG CHECK-IN" above to submit your first readiness audit to your coach.
            </p>
          </div>
        ) : (
          checkins.map((chk) => (
          <div
            key={chk.id}
            className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs font-tactical text-neutral-900 dark:text-white">
                  {chk.athleteName}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">• {chk.date}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 text-[10px] font-mono font-bold text-green-600 dark:text-green-400">
                {chk.nutritionAdherence}% Diet Adherence
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[9px] font-mono text-neutral-400 block">WEIGHT</span>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                  {chk.weightKg} kg
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[9px] font-mono text-neutral-400 block">SLEEP</span>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                  {chk.sleepHours} hrs
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[9px] font-mono text-neutral-400 block">SORENESS</span>
                <span className="text-xs font-mono font-bold text-[#C4121A]">
                  {chk.sorenessRating}/10
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[9px] font-mono text-neutral-400 block">SESSIONS</span>
                <span className="text-xs font-mono font-bold text-sky-500">
                  {chk.completedSessionsCount}/{chk.targetSessionsCount}
                </span>
              </div>
            </div>

            {/* Athlete Notes */}
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed bg-neutral-50 dark:bg-[#18181B] p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
              "{chk.notes}"
            </p>

            {/* Coach Feedback Section */}
            {chk.coachFeedback?.feedbackText ? (
              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    COACH MARCUS VANCE AUDIT
                  </span>
                  <span className="text-neutral-400">{chk.coachFeedback.givenAt}</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-200 font-sans leading-relaxed">
                  {chk.coachFeedback.feedbackText}
                </p>

                {chk.coachFeedback.suggestedAdjustments && chk.coachFeedback.suggestedAdjustments.length > 0 && (
                  <div className="pt-1.5 border-t border-sky-200/60 dark:border-sky-800/40 flex flex-wrap gap-1.5">
                    {chk.coachFeedback.suggestedAdjustments.map((adj, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-[#121214] border border-sky-300 dark:border-sky-700/60 text-[10px] font-mono font-semibold text-sky-600 dark:text-sky-400"
                      >
                        ⚡ {adj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Awaiting coach review & dispatch adjustment
                </span>

                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setActiveReplyId(activeReplyId === chk.id ? null : chk.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-tactical font-black uppercase tracking-wider cursor-pointer"
                >
                  ADD FEEDBACK
                </button>
              </div>
            )}

            {/* Coach Feedback Input Box (If reviewing as coach) */}
            {activeReplyId === chk.id && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2 animate-in fade-in duration-150">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide feedback or program adjustments..."
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C4121A]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(null)}
                    className="px-3 py-1 rounded-lg text-xs font-mono text-neutral-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendFeedback(chk.id)}
                    className="px-3.5 py-1 rounded-lg bg-[#C4121A] text-white text-xs font-tactical font-bold uppercase tracking-wider"
                  >
                    SUBMIT FEEDBACK
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
