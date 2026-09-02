import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, Share2, ShieldCheck, Send, Flame, TrendingUp, Lock, CheckCircle2, Trophy } from 'lucide-react';
import { CoachTransformationStudioModal } from './CoachTransformationStudioModal';
import { AthleteData, AthleteTelemetry } from '../types';
import { getAthleteTelemetryByCoachLog } from '../data/athleteTelemetry';
import { fetchLiveTelemetry } from '../utils/telemetryStore';
import { getCoachClientProgress, ProgramEnrollment, ScheduleEntry } from '@/utils/programScheduleStore';

export type { AthleteData };

interface ClientDetailModalProps {
  athlete: AthleteData | null;
  onSendFeedback: (text: string) => void;
  onApproveProtocol: () => void;
  onClose: () => void;
  onOpenShareClientProgress?: (athlete: AthleteData) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  athlete,
  onSendFeedback,
  onApproveProtocol,
  onClose,
  onOpenShareClientProgress,
  showToast,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isTransformationOpen, setIsTransformationOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(() =>
    athlete ? getAthleteTelemetryByCoachLog(athlete.name) : null
  );

  useEffect(() => {
    if (!athlete) { setTelemetry(null); return; }
    setTelemetry(getAthleteTelemetryByCoachLog(athlete.name));
    let cancelled = false;
    fetchLiveTelemetry(athlete.name).then((live) => {
      if (!cancelled) setTelemetry(live);
    });
    return () => { cancelled = true; };
  }, [athlete]);

  if (!athlete || !telemetry) return null;
  const recoveryScore = telemetry.recoveryScore;
  const recoveryColor =
    recoveryScore >= 85 ? '#34A853' : recoveryScore >= 70 ? '#FBBC05' : '#EA4335';
  const tierColor = athlete.badge?.includes('PR')
    ? '#EA4335'
    : athlete.badge?.includes('PENDING')
    ? '#FBBC05'
    : '#34A853';

  const completedSessions = telemetry.sessions.filter((s) => s.completed).length;
  const totalTonnage = telemetry.sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const latestMacro = telemetry.macroHistory[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-t-[1.5rem] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200/80/90 dark:border-zinc-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — sleek identity row */}
        <div className="pt-2 pb-2 px-3.5 flex flex-col items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
          <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mb-1.5 sm:hidden" />
          
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: tierColor }}
                >
                  {athlete.name.charAt(0)}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-900"
                  style={{ backgroundColor: recoveryColor }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                    {athlete.name}
                  </h3>
                  <span
                    className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
                    style={{ backgroundColor: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}
                  >
                    {athlete.badge?.replace('PENDING', 'ACTIVE') || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  {athlete.handle} &bull; Protocol Review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onOpenShareClientProgress && (
                <button
                  type="button"
                  onClick={() => onOpenShareClientProgress(athlete)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Share Progress"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-200/70 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-4 gap-1.5 w-full mt-2">
            {[
              { label: 'Recovery', value: <span style={{ color: recoveryColor }}>{recoveryScore}%</span> },
              { label: 'Sessions', value: `${completedSessions}/7` },
              { label: 'Tonnage', value: <>{totalTonnage.toFixed(0)}<span className="text-[8px] text-stone-400 dark:text-zinc-500"> MT</span></> },
              { label: 'PRs', value: <span className="flex items-center justify-center gap-0.5 text-red-600 dark:text-red-400"><Flame className="w-3 h-3" />{telemetry.prs.length}</span> },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-100/80 dark:bg-zinc-900/60 rounded-lg p-1.5 text-center border border-zinc-200/80/70 dark:border-zinc-800/70">
                <div className="text-[8px] font-mono text-stone-400 dark:text-zinc-500 uppercase">{stat.label}</div>
                <div className="text-xs font-bold tabular-nums text-zinc-900 dark:text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* PR Banner */}
          {telemetry.prs.length > 0 && (
            <div className="bg-red-50/60 dark:bg-red-950/30 rounded-xl border border-red-200/80 dark:border-red-900/40 p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span className="text-[10px] font-mono font-bold text-red-900 dark:text-red-300 uppercase tracking-wider">
                  Personal Records This Week
                </span>
              </div>
              <div className="space-y-1">
                {telemetry.prs.map((pr, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pr.exercise}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 dark:text-zinc-500 text-[10px]">{pr.date}</span>
                      <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">{pr.weight}kg</span>
                      <span className="text-[9px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-1 py-0.2 rounded">
                        +{pr.delta}kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's workout log */}
          <div className="bg-white dark:bg-zinc-900/90 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-2.5 shadow-xs">
            <h4 className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Today's Workout Log
            </h4>
            <div className="space-y-1.5">
              {athlete.todayLog.map((item, idx) => {
                const sessionEx = telemetry.sessions[0]?.exercises[idx];
                const hasVideo = sessionEx?.hasVideo;
                const isPR = sessionEx?.isPR;
                return (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isPR && <Flame className="w-3 h-3 text-red-500 shrink-0" />}
                      <span className="text-[11px] font-semibold text-zinc-900 dark:text-white truncate font-mono">
                        {item.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasVideo && (
                        <span className="text-[8px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                          0:18
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.sets}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nutrition fuel summary */}
          {latestMacro && (
            <div className="bg-white dark:bg-zinc-900/90 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-2.5 shadow-xs">
              <h4 className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Today's Fuel Intake
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Calories', value: latestMacro.calories, target: latestMacro.calorieTarget, unit: 'kcal', color: '#34A853' },
                  { label: 'Protein', value: latestMacro.protein, target: latestMacro.proteinTarget, unit: 'g', color: '#4285F4' },
                  { label: 'Carbs', value: latestMacro.carbs, target: latestMacro.carbsTarget, unit: 'g', color: '#EA4335' },
                  { label: 'Fat', value: latestMacro.fat, target: latestMacro.fatTarget, unit: 'g', color: '#FBBC05' },
                ].map((m, i) => {
                  const pct = Math.min(100, (m.value / m.target) * 100);
                  return (
                    <div key={i} className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg p-1.5 border border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-[8px] font-mono text-stone-400 dark:text-zinc-500 uppercase mb-0.5">{m.label}</div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xs font-bold tabular-nums text-zinc-900 dark:text-white">{m.value.toLocaleString()}</span>
                        <span className="text-[8px] text-stone-400 dark:text-zinc-500 font-mono">/ {m.target.toLocaleString()} {m.unit}</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Program Progress (coach view) */}
          <ClientProgramProgress athleteEmail={athlete.handle?.replace('@', '') ? `${athlete.handle.replace('@', '')}@o1fc.app` : ''} athleteName={athlete.name} />

          {/* AI Briefing */}
          <div className="bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Telemetry Coach Briefing
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {telemetry.aiBriefing}
            </p>
          </div>
        </div>

        {/* Feedback action bar */}
        <div className="p-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] border-t border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 space-y-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type coach feedback..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-stone-400 dark:focus:border-zinc-500"
            />
            <button
              onClick={() => {
                if (feedbackText.trim()) {
                  onSendFeedback?.(feedbackText.trim());
                  setFeedbackText('');
                }
              }}
              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onApproveProtocol?.()}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approve Protocol</span>
            </button>
            <button
              onClick={() => setIsTransformationOpen(true)}
              className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Wins</span>
            </button>
          </div>
        </div>
      </div>

      <CoachTransformationStudioModal
        isOpen={isTransformationOpen}
        onClose={() => setIsTransformationOpen(false)}
        clientData={athlete ? { clientName: athlete.name } : undefined}
        showToast={showToast}
      />
    </div>,
    document.body
  );
};

/* ── Coach-side program progress for a client ── */
const ClientProgramProgress: React.FC<{ athleteEmail: string; athleteName: string }> = ({ athleteEmail, athleteName }) => {
  const [progress, setProgress] = useState<{
    enrollment: ProgramEnrollment;
    sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
    completedCount: number;
    totalCount: number;
  }[]>([]);

  useEffect(() => {
    if (!athleteEmail) return;
    const coachEmail = localStorage.getItem('o1fc_user_email') || '';
    if (!coachEmail) return;
    getCoachClientProgress(coachEmail).then(all => {
      const forClient = all.filter(p => p.enrollment.athlete_email === athleteEmail);
      setProgress(forClient);
    });
  }, [athleteEmail]);

  if (progress.length === 0) return null;

  return (
    <>
      {progress.map(p => {
        const pct = p.totalCount > 0 ? Math.round((p.completedCount / p.totalCount) * 100) : 0;
        const currentWeek = p.sessions[p.completedCount]?.week_number || p.sessions[p.sessions.length - 1]?.week_number || 1;
        const weekSessions = p.sessions.filter(s => s.week_number === currentWeek);

        return (
          <div key={p.enrollment.id} className="bg-white dark:bg-zinc-900/90 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-2.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Program Progress
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">{pct}%</span>
            </div>

            <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 mb-1.5">
              Week {currentWeek} &bull; {p.completedCount}/{p.totalCount} sessions done
            </div>

            <div className="space-y-1">
              {weekSessions.map((session, i) => {
                const globalIdx = p.sessions.findIndex(s => s.id === session.id);
                const isCompleted = !!session.completed;
                const isNext = globalIdx === p.completedCount;

                return (
                  <div
                    key={session.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${
                      isCompleted
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : isNext
                        ? 'border-amber-300/40 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-800/30'
                    }`}
                  >
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isNext ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-stone-400 dark:text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-semibold truncate block ${
                        isCompleted ? 'text-emerald-700 dark:text-emerald-300' : isNext ? 'text-zinc-900 dark:text-white' : 'text-stone-400 dark:text-zinc-500'
                      }`}>
                        Day {i + 1}{session.focus_label ? ` — ${session.focus_label}` : ''}
                      </span>
                    </div>
                    {isCompleted && session.completed_at && (
                      <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400">
                        {new Date(session.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};
