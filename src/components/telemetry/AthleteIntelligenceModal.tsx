import React, { useState, useEffect } from 'react';
import { X, Flame, TrendingUp, Activity, Sparkles, ChevronRight, Send } from 'lucide-react';
import { AthleteTelemetry } from '../../types';
import {
  ProgressionChart,
  ComplianceHeatmap,
  MacroAdherenceChart,
  RecoveryTrendChart,
  VolumeTrendChart,
  BodyweightChart,
} from './TelemetryCharts';
import { fetchLiveTelemetry, getStaticTelemetry } from '../../utils/telemetryStore';

interface AthleteIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: AthleteTelemetry | null;
  onApprove?: () => void;
  onSendFeedback?: (feedback: string) => void;
  showToast?: (msg: string) => void;
}

type Tab = 'training' | 'fuel' | 'insights';

export const AthleteIntelligenceModal: React.FC<AthleteIntelligenceModalProps> = ({
  isOpen,
  onClose,
  telemetry: initialTelemetry,
  onApprove,
  onSendFeedback,
  showToast,
}) => {
  const [tab, setTab] = useState<Tab>('training');
  const [feedback, setFeedback] = useState('');
  const [telemetry, setTelemetry] = useState(initialTelemetry);

  useEffect(() => {
    setTelemetry(initialTelemetry);
    if (initialTelemetry) {
      let cancelled = false;
      fetchLiveTelemetry(initialTelemetry.name).then((live) => {
        if (!cancelled) setTelemetry(live);
      });
      return () => { cancelled = true; };
    }
  }, [initialTelemetry]);

  if (!isOpen || !telemetry) return null;

  const recoveryColor =
    telemetry.recoveryScore >= 85 ? '#3B7A57' : telemetry.recoveryScore >= 70 ? '#B8860B' : '#C05050';

  const tierColor =
    telemetry.tier === 'PRO-ELITE'
      ? '#EA4335'
      : telemetry.tier === 'HYPERTROPHY'
      ? '#C9A227'
      : '#34A853';

  const completedSessions = telemetry.sessions.filter((s) => s.completed).length;
  const totalTonnage = telemetry.sessions.reduce((sum, s) => sum + s.totalVolume, 0);

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    onSendFeedback?.(feedback);
    setFeedback('');
    showToast?.('Feedback transmitted to athlete');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'training', label: 'TRAINING', icon: <Activity className="w-3 h-3" /> },
    { key: 'fuel', label: 'FUEL', icon: <TrendingUp className="w-3 h-3" /> },
    { key: 'insights', label: 'INSIGHTS', icon: <Sparkles className="w-3 h-3" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center p-0 sm:p-4"
    >
      <div
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-2xl shadow-2xl animate-slideDownFade flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white shadow-sm"
                  style={{ backgroundColor: tierColor }}
                >
                  {telemetry.name.charAt(0)}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#FDFCFB]"
                  style={{ backgroundColor: recoveryColor }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1C1E] tracking-tight">{telemetry.name}</h2>
                  <span
                    className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                    style={{ backgroundColor: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}
                  >
                    {telemetry.tier}
                  </span>
                </div>
                <p className="text-[10px] text-[#848785] font-mono">{telemetry.handle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-nude-close shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-[rgba(0,0,0,0.08)]">
              <div className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Recovery</div>
              <div className="text-sm font-black tabular-nums" style={{ color: recoveryColor }}>
                {telemetry.recoveryScore}%
              </div>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-[rgba(0,0,0,0.08)]">
              <div className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Sessions</div>
              <div className="text-sm font-black tabular-nums text-[#1C1C1E]">{completedSessions}/7</div>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-[rgba(0,0,0,0.08)]">
              <div className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Tonnage</div>
              <div className="text-sm font-black tabular-nums text-[#1C1C1E]">{totalTonnage.toFixed(0)}<span className="text-[8px] text-[#848785]"> MT</span></div>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-[rgba(0,0,0,0.08)]">
              <div className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">PRs</div>
              <div className="text-sm font-black tabular-nums text-[#EA4335] flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3" />
                {telemetry.prs.length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-[#F2F2F7] rounded-xl p-1 border border-[rgba(0,0,0,0.08)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  tab === t.key
                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                    : 'text-[#848785] hover:text-[#1C1C1E]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3 flex-1">
          {tab === 'training' && (
            <>
              {/* PR Banner */}
              {telemetry.prs.length > 0 && (
                <div className="bg-gradient-to-r from-[#EA4335]/8 to-[#C9A227]/8 rounded-2xl border border-[#EA4335]/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-3.5 h-3.5 text-[#EA4335]" />
                    <span className="text-[10px] font-mono font-bold text-[#1C1C1E] uppercase tracking-wider">Personal Records This Week</span>
                  </div>
                  <div className="space-y-1.5">
                    {telemetry.prs.map((pr, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#1C1C1E]">{pr.exercise}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#848785]">{pr.date}</span>
                          <span className="font-black text-[#EA4335] tabular-nums">{pr.weight}kg</span>
                          <span className="text-[9px] font-bold text-red-700 bg-red-700/10 px-1.5 py-0.5 rounded-md">
                            +{pr.delta}kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progression charts */}
              {Object.entries(telemetry.exerciseProgress).map(([name, data]) => (
                <ProgressionChart key={name} data={data} exerciseName={name} />
              ))}

              {/* Volume trend */}
              <VolumeTrendChart sessions={telemetry.sessions} />

              {/* Compliance heatmap */}
              <ComplianceHeatmap sessions={telemetry.sessions} macroHistory={telemetry.macroHistory} />

              {/* Session history list */}
              <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
                <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-3">Session History</h4>
                <div className="space-y-2">
                  {telemetry.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#F2F2F7] border border-[rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.completed ? 'bg-[#34A853]/15' : 'bg-[#E5E5EA]'}`}>
                          <span className="text-[9px] font-mono font-bold text-[#34A853]">{s.dateLabel}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-[#1C1C1E] truncate">{s.title}</div>
                          <div className="text-[9px] font-mono text-[#848785]">
                            {s.completed ? `${s.totalVolume} MT • ${s.duration} • RPE ${s.avgRPE.toFixed(1)}` : 'Rest Day'}
                          </div>
                        </div>
                      </div>
                      {s.completed && s.exercises.some((e) => e.isPR) && (
                        <Flame className="w-3.5 h-3.5 text-[#EA4335] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'fuel' && (
            <>
              {/* Today's macro summary */}
              {telemetry.macroHistory[0] && (
                <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
                  <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-3">Today's Fuel Intake</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Calories', value: telemetry.macroHistory[0].calories, target: telemetry.macroHistory[0].calorieTarget, unit: 'kcal', color: '#1C1C1E' },
                      { label: 'Protein', value: telemetry.macroHistory[0].protein, target: telemetry.macroHistory[0].proteinTarget, unit: 'g', color: '#34A853' },
                      { label: 'Carbs', value: telemetry.macroHistory[0].carbs, target: telemetry.macroHistory[0].carbsTarget, unit: 'g', color: '#EA4335' },
                      { label: 'Fat', value: telemetry.macroHistory[0].fat, target: telemetry.macroHistory[0].fatTarget, unit: 'g', color: '#C9A227' },
                    ].map((m, i) => {
                      const pct = Math.min(100, (m.value / m.target) * 100);
                      return (
                        <div key={i} className="bg-[#F2F2F7] rounded-xl p-2 border border-[rgba(0,0,0,0.08)]">
                          <div className="text-[8px] font-mono text-[#848785] uppercase tracking-wider mb-1">{m.label}</div>
                          <div className="flex items-baseline gap-1 mb-1.5">
                            <span className="text-sm font-black tabular-nums" style={{ color: m.color }}>{m.value.toLocaleString()}</span>
                            <span className="text-[9px] text-[#848785] font-mono">/ {m.target.toLocaleString()} {m.unit}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4285F4' }} />
                        <span className="text-[9px] font-mono text-[#848785]">Hydration</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold tabular-nums text-[#1C1C1E]">
                        {telemetry.macroHistory[0].hydration}L / {telemetry.macroHistory[0].hydrationTarget}L
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{
                      color: telemetry.macroHistory[0].hydration >= telemetry.macroHistory[0].hydrationTarget ? '#3B7A57' : '#B8860B'
                    }}>
                      {telemetry.macroHistory[0].hydration >= telemetry.macroHistory[0].hydrationTarget ? 'HYDRATED' : 'BELOW TARGET'}
                    </span>
                  </div>
                </div>
              )}

              {/* Macro adherence chart */}
              <MacroAdherenceChart macroHistory={telemetry.macroHistory} />

              {/* Compliance heatmap */}
              <ComplianceHeatmap sessions={telemetry.sessions} macroHistory={telemetry.macroHistory} />

              {/* Bodyweight chart */}
              <BodyweightChart history={telemetry.bodyweightHistory} />
            </>
          )}

          {tab === 'insights' && (
            <>
              {/* AI Briefing */}
              <div className="bg-gradient-to-br from-[#34A853]/8 to-[#EA4335]/8 rounded-2xl border border-[#34A853]/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#34A853]" />
                  <span className="text-[10px] font-mono font-bold text-[#1C1C1E] uppercase tracking-wider">Intel Coach Briefing</span>
                </div>
                <p className="text-[12px] text-[#1C1C1E] leading-relaxed">{telemetry.aiBriefing}</p>
              </div>

              {/* Recovery trend */}
              <RecoveryTrendChart recoveryTrend={telemetry.recoveryTrend} recoveryScore={telemetry.recoveryScore} />

              {/* Compliance summary */}
              <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
                <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-3">Compliance Summary</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#848785] uppercase tracking-wider">Training Adherence</span>
                      <span className="font-bold tabular-nums text-[#1C1C1E]">{telemetry.compliance.trainingAdherence}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${telemetry.compliance.trainingAdherence}%`,
                          backgroundColor: telemetry.compliance.trainingAdherence >= 80 ? '#3B7A57' : telemetry.compliance.trainingAdherence >= 60 ? '#B8860B' : '#C05050',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#848785] uppercase tracking-wider">Nutrition Adherence</span>
                      <span className="font-bold tabular-nums text-[#1C1C1E]">{telemetry.compliance.nutritionAdherence}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${telemetry.compliance.nutritionAdherence}%`,
                          backgroundColor: telemetry.compliance.nutritionAdherence >= 80 ? '#3B7A57' : telemetry.compliance.nutritionAdherence >= 60 ? '#B8860B' : '#C05050',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#848785] uppercase tracking-wider">Weekly Streak</span>
                      <span className="font-bold tabular-nums text-[#1C1C1E]">{telemetry.compliance.weeklyStreak} Days</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-2 rounded-full"
                          style={{
                            backgroundColor: i < telemetry.compliance.weeklyStreak ? '#34A853' : 'rgba(0,0,0,0.08)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* All PRs */}
              <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
                <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-3">All-Time PRs</h4>
                <div className="space-y-2">
                  {telemetry.prs.map((pr, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#F2F2F7] border border-[rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#EA4335]/10 flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 text-[#EA4335]" />
                        </div>
                        <span className="text-[11px] font-bold text-[#1C1C1E]">{pr.exercise}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-[#848785]">{pr.date}</span>
                        <span className="text-sm font-black tabular-nums text-[#1C1C1E]">{pr.weight}kg</span>
                        <span className="text-[9px] font-bold text-red-700 bg-red-700/10 px-1.5 py-0.5 rounded-md">+{pr.delta}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Feedback + approve action bar */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[rgba(0,0,0,0.08)] px-4 py-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Type coach feedback..."
              className="flex-1 bg-[#F2F2F7] border border-[rgba(0,0,0,0.08)] rounded-xl px-3 py-2 text-[11px] font-mono text-[#1C1C1E] placeholder-[#848785] focus:outline-none focus:border-[#34A853] transition-colors"
            />
            <button
              onClick={handleSendFeedback}
              disabled={!feedback.trim()}
              className="w-10 h-10 rounded-xl bg-[#34A853] hover:bg-[#5C7568] disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {onApprove && (
            <button
              onClick={() => {
                onApprove();
                showToast?.('Workout approved & verified');
              }}
              className="w-full py-3 bg-gradient-to-r from-[#EA4335] to-[#C24343] hover:from-[#C24343] hover:to-[#EA4335] text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#EA4335]"
            >
              <Sparkles className="w-4 h-4" />
              APPROVE & SEND FEEDBACK
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
