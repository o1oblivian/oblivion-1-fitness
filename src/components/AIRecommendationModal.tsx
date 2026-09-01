import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Sparkles, Dumbbell, Utensils, Footprints, Moon, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Pill, Zap, Target,
  Activity, Calendar, ArrowRight, Copy, CheckCircle2, Loader2,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface ConsultationIntake {
  clientEmail: string;
  goal: string;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  whyNow: string;
  currentSupplements: string;
  dietPreferences: string;
  injuriesLimitations: string;
  dailyStepGoal: number;
  currentDailySteps: number;
  timelineGoal: string;
  desiredServices: string[];
  snapshotData: any;
}

interface TrainingDay {
  day: string;
  focus: string;
  exercises: { name: string; sets: number; reps: string; notes: string }[];
}

interface Recommendation {
  programName: string;
  summary: string;
  duration_weeks: number;
  training: {
    split: string;
    days: TrainingDay[];
    progressionModel: string;
    deloadProtocol: string;
  };
  nutrition: {
    dailyCalories: number;
    macros: { protein_g: number; carbs_g: number; fat_g: number };
    mealTiming: string;
    sampleDay: { meal: string; foods: string; macros: string }[];
    supplements: string[];
  };
  weeklyCardio: { type: string; frequency: string; duration: string };
  recoveryProtocol: { sleepTarget: string; mobilityWork: string; stepsTarget: number };
  coachNotes: string;
}

interface AIRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  intake: ConsultationIntake;
  showToast: (msg: string) => void;
}

export const AIRecommendationModal: React.FC<AIRecommendationModalProps> = ({
  isOpen,
  onClose,
  intake,
  showToast,
}) => {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-program-recommend`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ intake }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      } else {
        throw new Error('No recommendation returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProgram = async () => {
    if (!recommendation) return;
    const text = formatProgramText(recommendation);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Program copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" style={{ zIndex: 999 }} onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-3 pointer-events-none" style={{ zIndex: 1000 }}>
        <div
          className="w-full max-w-md max-h-[92vh] flex flex-col pointer-events-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14171F] text-zinc-900 dark:text-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-[#14171F]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between z-10 shrink-0">
            <div>
              <span className="text-[10px] font-mono font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider block mb-0.5">
                Intel Recommendation Engine
              </span>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                Program & Diet Generator
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {/* Intake Summary */}
            <div className="bg-zinc-50 dark:bg-[#1E222A] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
              <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Client Intake</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <InfoRow icon={<Target className="w-3 h-3 text-blue-500 dark:text-blue-400" />} label="Goal" value={intake.goal} />
                <InfoRow icon={<Dumbbell className="w-3 h-3 text-orange-500 dark:text-orange-400" />} label="Level" value={intake.experienceLevel} />
                <InfoRow icon={<Calendar className="w-3 h-3 text-teal-500 dark:text-teal-400" />} label="Days/wk" value={`${intake.trainingDaysPerWeek}`} />
                <InfoRow icon={<Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />} label="Timeline" value={intake.timelineGoal} />
                {intake.dietPreferences && (
                  <InfoRow icon={<Utensils className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />} label="Diet" value={intake.dietPreferences} />
                )}
                {intake.injuriesLimitations && (
                  <InfoRow icon={<AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400" />} label="Injuries" value={intake.injuriesLimitations} />
                )}
              </div>
            </div>

            {/* Generate Button or Result */}
            {!recommendation && !loading && (
              <button
                onClick={generate}
                className="w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-gradient-to-r dark:from-orange-600 dark:to-red-600 dark:hover:from-orange-500 dark:hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Generate Intel Program & Diet Plan
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-orange-500 dark:text-orange-400 animate-spin" />
                <p className="text-xs text-zinc-600 dark:text-gray-400 font-mono animate-pulse">Intel building custom program...</p>
                <p className="text-[10px] text-zinc-400 dark:text-gray-500">This may take 10-15 seconds</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 text-center">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
                <button onClick={generate} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {recommendation && (
              <>
                {/* Program Header */}
                <div className="bg-orange-50/70 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span className="text-[10px] font-mono font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider">Generated Program</span>
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">{recommendation.programName}</h3>
                  <p className="text-xs text-zinc-600 dark:text-gray-300 mt-2 leading-relaxed">{recommendation.summary}</p>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <span className="text-[10px] font-mono text-zinc-600 dark:text-gray-400 bg-white/70 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-1 rounded">{recommendation.duration_weeks} weeks</span>
                    <span className="text-[10px] font-mono text-zinc-600 dark:text-gray-400 bg-white/70 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-1 rounded">{recommendation.training.split}</span>
                  </div>
                </div>

                {/* Training Days */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    <span className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Training Split</span>
                  </div>
                  {recommendation.training.days.map((day, i) => (
                    <div key={i} className="bg-zinc-50 dark:bg-[#1E222A] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{day.day}</span>
                          <span className="text-[10px] text-gray-400">{day.focus}</span>
                        </div>
                        {expandedDay === i ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                      {expandedDay === i && (
                        <div className="px-4 pb-3 border-t border-white/5 pt-2 space-y-1.5">
                          {day.exercises.map((ex, j) => (
                            <div key={j} className="flex items-center justify-between py-1">
                              <span className="text-[11px] text-gray-300">{ex.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-400">{ex.sets}x{ex.reps}</span>
                                {ex.notes && (
                                  <span className="text-[9px] text-gray-500 max-w-[80px] truncate">{ex.notes}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progression */}
                <div className="bg-[#1E222A] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingIcon />
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Progression</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{recommendation.training.progressionModel}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Deload: {recommendation.training.deloadProtocol}</p>
                </div>

                {/* Nutrition Plan */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Nutrition Plan</span>
                  </div>
                  <div className="bg-[#1E222A] border border-white/10 rounded-xl p-4">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <MacroBox label="Calories" value={`${recommendation.nutrition.dailyCalories}`} color="text-amber-400" />
                      <MacroBox label="Protein" value={`${recommendation.nutrition.macros.protein_g}g`} color="text-red-400" />
                      <MacroBox label="Carbs" value={`${recommendation.nutrition.macros.carbs_g}g`} color="text-blue-400" />
                      <MacroBox label="Fat" value={`${recommendation.nutrition.macros.fat_g}g`} color="text-orange-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">{recommendation.nutrition.mealTiming}</p>

                    {recommendation.nutrition.sampleDay?.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        <span className="text-[9px] font-mono text-gray-500 uppercase">Sample Day</span>
                        {recommendation.nutrition.sampleDay.map((meal, i) => (
                          <div key={i} className="flex items-start gap-2 py-1 border-t border-white/5 first:border-0">
                            <span className="text-[10px] font-bold text-white shrink-0 w-16">{meal.meal}</span>
                            <span className="text-[10px] text-gray-400 flex-1">{meal.foods}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {recommendation.nutrition.supplements?.length > 0 && (
                      <div className="border-t border-white/5 pt-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <Pill className="w-3 h-3 text-teal-400" />
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Supplements</span>
                        </div>
                        {recommendation.nutrition.supplements.map((s, i) => (
                          <p key={i} className="text-[10px] text-gray-300 pl-4">- {s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cardio & Recovery */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1E222A] border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity className="w-3 h-3 text-teal-400" />
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">Cardio</span>
                    </div>
                    <p className="text-[10px] text-gray-300">{recommendation.weeklyCardio.type}</p>
                    <p className="text-[9px] text-gray-500">{recommendation.weeklyCardio.frequency}, {recommendation.weeklyCardio.duration}</p>
                  </div>
                  <div className="bg-[#1E222A] border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">Recovery</span>
                    </div>
                    <p className="text-[10px] text-gray-300">Sleep: {recommendation.recoveryProtocol.sleepTarget}</p>
                    <p className="text-[9px] text-gray-500">{recommendation.recoveryProtocol.mobilityWork}</p>
                    <p className="text-[9px] text-gray-500">Steps: {recommendation.recoveryProtocol.stepsTarget?.toLocaleString()}/day</p>
                  </div>
                </div>

                {/* Coach Notes */}
                {recommendation.coachNotes && (
                  <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Coach Notes</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{recommendation.coachNotes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyProgram}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-[#1E222A] hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Program'}
                  </button>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl border border-orange-500/30 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 min-w-0">
    {icon}
    <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0">{label}:</span>
    <span className="text-[10px] font-bold text-white truncate">{value}</span>
  </div>
);

const MacroBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`text-sm font-black font-mono ${color}`}>{value}</div>
    <div className="text-[8px] font-mono text-gray-500 uppercase">{label}</div>
  </div>
);

const TrendingIcon = () => <ArrowRight className="w-3.5 h-3.5 text-gray-400" />;

function formatProgramText(r: Recommendation): string {
  let text = `${r.programName}\n${'='.repeat(40)}\n${r.summary}\n\nDuration: ${r.duration_weeks} weeks | Split: ${r.training.split}\n\n`;
  text += `TRAINING\n${'-'.repeat(30)}\n`;
  r.training.days.forEach((d) => {
    text += `\n${d.day} - ${d.focus}\n`;
    d.exercises.forEach((ex) => {
      text += `  ${ex.name}: ${ex.sets}x${ex.reps}${ex.notes ? ` (${ex.notes})` : ''}\n`;
    });
  });
  text += `\nProgression: ${r.training.progressionModel}\nDeload: ${r.training.deloadProtocol}\n`;
  text += `\nNUTRITION\n${'-'.repeat(30)}\n`;
  text += `Calories: ${r.nutrition.dailyCalories} | P: ${r.nutrition.macros.protein_g}g | C: ${r.nutrition.macros.carbs_g}g | F: ${r.nutrition.macros.fat_g}g\n`;
  text += `Timing: ${r.nutrition.mealTiming}\n`;
  if (r.nutrition.sampleDay?.length) {
    text += `\nSample Day:\n`;
    r.nutrition.sampleDay.forEach((m) => { text += `  ${m.meal}: ${m.foods}\n`; });
  }
  if (r.nutrition.supplements?.length) {
    text += `\nSupplements:\n`;
    r.nutrition.supplements.forEach((s) => { text += `  - ${s}\n`; });
  }
  text += `\nCARDIO: ${r.weeklyCardio.type} | ${r.weeklyCardio.frequency} | ${r.weeklyCardio.duration}\n`;
  text += `RECOVERY: Sleep ${r.recoveryProtocol.sleepTarget} | Steps ${r.recoveryProtocol.stepsTarget}/day\n`;
  if (r.coachNotes) text += `\nCOACH NOTES: ${r.coachNotes}\n`;
  return text;
}
