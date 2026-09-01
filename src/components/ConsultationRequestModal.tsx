import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ClipboardCheck,
  Target,
  Calendar,
  TrendingUp,
  Dumbbell,
  Utensils,
  Moon,
  Scale,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Pill,
  Footprints,
  Heart,
  Shield,
  Sparkles,
  Clock,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
  coachEmail: string;
  clientEmail: string;
  showToast: (msg: string) => void;
}

interface ProgressSnapshot {
  workouts: { totalSessions: number; avgPerWeek: number; recentPRs: string[] };
  nutrition: { avgCalories: number; avgProtein: number; adherencePct: number };
  sleep: { avgHours: number; qualityScore: number };
  bodyweight: { current: number; trend: string; changeKg: number };
  steps: { avgDaily: number };
}

const GOALS = [
  'Fat Loss & Body Recomposition',
  'Muscle Building & Hypertrophy',
  'Strength & Powerlifting',
  'Sport-Specific Performance',
  'General Fitness & Health',
  'Competition Prep',
  'Rehabilitation & Mobility',
  'Endurance & Cardio',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Less than 1 year' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
];

const SERVICES = [
  { id: 'training_program', label: 'Training Program', icon: Dumbbell, desc: 'Custom workout plan' },
  { id: 'nutrition_plan', label: 'Nutrition Plan', icon: Utensils, desc: 'Balanced diet guidance' },
  { id: 'supplement_review', label: 'Supplement Review', icon: Pill, desc: 'Optimize your stack' },
  { id: 'accountability', label: 'Accountability', icon: Shield, desc: 'Check-ins & tracking' },
  { id: 'mobility_rehab', label: 'Mobility & Rehab', icon: Heart, desc: 'Injury prevention' },
  { id: 'step_cardio', label: 'Step & Cardio Goals', icon: Footprints, desc: 'Daily movement targets' },
];

const TIMELINES = [
  { value: '4wk', label: '4 Weeks', desc: 'Quick focus' },
  { value: '8wk', label: '8 Weeks', desc: 'Short block' },
  { value: '12wk', label: '12 Weeks', desc: 'Standard' },
  { value: '16wk', label: '16 Weeks', desc: 'Deep transform' },
  { value: 'ongoing', label: 'Ongoing', desc: 'Long term' },
];

const BUDGETS = [
  { value: 'budget', label: 'Budget', desc: 'Essential coaching' },
  { value: 'standard', label: 'Standard', desc: 'Full support' },
  { value: 'premium', label: 'Premium', desc: 'Elite 1-on-1' },
];

const STEP_PRESETS = [5000, 7500, 8000, 10000, 12000, 15000];

function buildSnapshot(): ProgressSnapshot {
  const storedLogs = localStorage.getItem('o1fc_workout_logs');
  let totalSessions = 0;
  let recentPRs: string[] = [];
  if (storedLogs) {
    try {
      const logs = JSON.parse(storedLogs);
      totalSessions = Array.isArray(logs) ? logs.length : 0;
      const recent = Array.isArray(logs) ? logs.slice(-5) : [];
      recentPRs = recent
        .filter((l: any) => l.pr || l.isPR)
        .map((l: any) => l.exercise || l.name || 'PR')
        .slice(0, 3);
    } catch { /* empty */ }
  }

  const storedMacros = localStorage.getItem('o1fc_daily_macros');
  let avgCalories = 0;
  let avgProtein = 0;
  let adherencePct = 0;
  if (storedMacros) {
    try {
      const macros = JSON.parse(storedMacros);
      if (Array.isArray(macros) && macros.length > 0) {
        const recent = macros.slice(-7);
        avgCalories = Math.round(recent.reduce((s: number, m: any) => s + (m.calories || 0), 0) / recent.length);
        avgProtein = Math.round(recent.reduce((s: number, m: any) => s + (m.protein || 0), 0) / recent.length);
        adherencePct = Math.round((recent.filter((m: any) => m.logged).length / recent.length) * 100);
      }
    } catch { /* empty */ }
  }

  const storedSleep = localStorage.getItem('o1fc_sleep_logs');
  let avgHours = 7.2;
  let qualityScore = 72;
  if (storedSleep) {
    try {
      const sleepLogs = JSON.parse(storedSleep);
      if (Array.isArray(sleepLogs) && sleepLogs.length > 0) {
        const recent = sleepLogs.slice(-7);
        avgHours = +(recent.reduce((s: number, l: any) => s + (l.hours || 0), 0) / recent.length).toFixed(1);
        qualityScore = Math.round(recent.reduce((s: number, l: any) => s + (l.quality || 70), 0) / recent.length);
      }
    } catch { /* empty */ }
  }

  const storedBW = localStorage.getItem('o1fc_bodyweight_logs');
  let current = 0;
  let trend = 'stable';
  let changeKg = 0;
  if (storedBW) {
    try {
      const bwLogs = JSON.parse(storedBW);
      if (Array.isArray(bwLogs) && bwLogs.length > 0) {
        current = bwLogs[bwLogs.length - 1]?.weight || 0;
        if (bwLogs.length >= 2) {
          const first = bwLogs[0]?.weight || current;
          changeKg = +(current - first).toFixed(1);
          trend = changeKg > 0.5 ? 'gaining' : changeKg < -0.5 ? 'losing' : 'stable';
        }
      }
    } catch { /* empty */ }
  }

  let avgSteps = 0;
  try {
    const stepsRaw = localStorage.getItem('o1fc_daily_steps_' + '');
    if (stepsRaw) {
      const stepsArr = JSON.parse(stepsRaw);
      if (Array.isArray(stepsArr) && stepsArr.length > 0) {
        const recent = stepsArr.slice(-7);
        avgSteps = Math.round(recent.reduce((s: number, e: any) => s + (e.steps || 0), 0) / recent.length);
      }
    }
  } catch { /* empty */ }

  return {
    workouts: { totalSessions, avgPerWeek: Math.min(totalSessions, 7), recentPRs },
    nutrition: { avgCalories: avgCalories || 2200, avgProtein: avgProtein || 140, adherencePct: adherencePct || 65 },
    sleep: { avgHours, qualityScore },
    bodyweight: { current: current || 78, trend, changeKg },
    steps: { avgDaily: avgSteps || 6500 },
  };
}

const TOTAL_STEPS = 4;

export const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({
  isOpen,
  onClose,
  coachName,
  coachEmail,
  clientEmail,
  showToast,
}) => {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('intermediate');
  const [trainingDays, setTrainingDays] = useState(4);
  const [whyNow, setWhyNow] = useState('');
  const [supplements, setSupplements] = useState('');
  const [dietPreferences, setDietPreferences] = useState('');
  const [injuries, setInjuries] = useState('');
  const [stepGoal, setStepGoal] = useState(10000);
  const [customStepGoal, setCustomStepGoal] = useState('');
  const [showCustomSteps, setShowCustomSteps] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('12wk');
  const [budget, setBudget] = useState('standard');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshot(buildSnapshot());
      setSent(false);
      setStep(0);
      setGoal('');
      setWhyNow('');
      setSupplements('');
      setDietPreferences('');
      setInjuries('');
      setStepGoal(10000);
      setCustomStepGoal('');
      setShowCustomSteps(false);
      setSelectedServices([]);
      setTimeline('12wk');
      setBudget('standard');
      setShowGoalPicker(false);
    }
  }, [isOpen]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canAdvance = () => {
    if (step === 0) return !!goal;
    if (step === 1) return true;
    if (step === 2) return selectedServices.length > 0;
    if (step === 3) return !!whyNow.trim();
    return true;
  };

  const handleSubmit = async () => {
    if (!goal || !whyNow.trim()) return;
    setSending(true);

    const finalStepGoal = showCustomSteps && customStepGoal ? parseInt(customStepGoal, 10) || stepGoal : stepGoal;

    const { error } = await supabase.from('consultation_requests').insert({
      client_email: clientEmail,
      coach_email: coachEmail,
      goal,
      experience_level: experience,
      training_days_per_week: trainingDays,
      why_now: whyNow.trim(),
      snapshot_data: snapshot || {},
      current_supplements: supplements.trim(),
      diet_preferences: dietPreferences.trim(),
      injuries_limitations: injuries.trim(),
      daily_step_goal: finalStepGoal,
      current_daily_steps: snapshot?.steps.avgDaily || 0,
      desired_services: selectedServices,
      budget_range: budget,
      timeline_goal: timeline,
    });

    setSending(false);

    if (error) {
      showToast('Failed to send request. Try again.');
      return;
    }

    setSent(true);
    showToast('Consultation request sent!');
    setTimeout(() => onClose(), 2400);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        style={{ zIndex: 999 }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex items-start justify-center pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-3 sm:px-4 pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <div
          className="w-full max-w-md max-h-[92vh] flex flex-col pointer-events-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-2xl text-zinc-900 dark:text-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between z-10 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-500 uppercase tracking-wider block mb-0.5">
                Intel Coach Consultation
              </span>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white font-mono tracking-tight leading-tight truncate">
                {coachName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0 ml-3"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          {!sent && (
            <div className="px-5 pt-3 pb-1 shrink-0 bg-white dark:bg-[#121214]">
              <div className="flex items-center gap-1.5 mb-1.5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: i < step ? '100%' : i === step ? '50%' : '0%',
                        backgroundColor: i <= step ? '#DC2626' : 'transparent',
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                Step {step + 1} of {TOTAL_STEPS}
              </p>
            </div>
          )}

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Request Sent</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-xs">
                  {coachName} will review your full profile, training data, supplement stack, and goals to craft a tailored program.
                </p>
              </div>
            ) : (
              <div className="space-y-5">

                {/* ── STEP 0: Goals & Foundation ── */}
                {step === 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-zinc-500" /> Primary Goal
                      </label>
                      <button
                        onClick={() => setShowGoalPicker(!showGoalPicker)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-sm font-semibold text-zinc-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-red-500/50 transition-colors"
                      >
                        <span className={goal ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}>{goal || 'Select your primary goal...'}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showGoalPicker ? 'rotate-180' : ''}`} />
                      </button>
                      {showGoalPicker && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                          {GOALS.map((g) => (
                            <button
                              key={g}
                              onClick={() => { setGoal(g); setShowGoalPicker(false); }}
                              className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 ${
                                goal === g ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-zinc-500" /> Experience Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPERIENCE_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            onClick={() => setExperience(lvl.value)}
                            className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                              experience === lvl.value
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400'
                                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{lvl.label}</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{lvl.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Training Days per Week
                      </label>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5, 6, 7].map((d) => (
                          <button
                            key={d}
                            onClick={() => setTrainingDays(d)}
                            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              trainingDays === d
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400'
                                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" /> Timeline
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIMELINES.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setTimeline(t.value)}
                            className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                              timeline === t.value
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400'
                                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{t.label}</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── STEP 1: Body, Supplements & Diet ── */}
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-zinc-500" /> Current Supplements
                      </label>
                      <textarea
                        value={supplements}
                        onChange={(e) => setSupplements(e.target.value)}
                        placeholder="List your current supplements (e.g. Whey Protein, Creatine 5g, Vitamin D 4000IU, Fish Oil, Pre-workout...)"
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 italic">Your coach will factor these into your nutrition plan to avoid doubling up</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-zinc-500" /> Dietary Preferences & Restrictions
                      </label>
                      <textarea
                        value={dietPreferences}
                        onChange={(e) => setDietPreferences(e.target.value)}
                        placeholder="Any dietary approach, allergies, or restrictions (e.g. Keto, Vegan, Gluten-free, Lactose intolerant, Halal, no red meat...)"
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" /> Injuries & Limitations
                      </label>
                      <textarea
                        value={injuries}
                        onChange={(e) => setInjuries(e.target.value)}
                        placeholder="Any current injuries, mobility issues, or medical conditions your coach should know about (e.g. Lower back pain, shoulder impingement, knee surgery 2024...)"
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>
                  </>
                )}

                {/* ── STEP 2: Services, Steps & Budget ── */}
                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> What Do You Need From Your Coach?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SERVICES.map((svc) => {
                          const Icon = svc.icon;
                          const active = selectedServices.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              onClick={() => toggleService(svc.id)}
                              className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'bg-red-50 dark:bg-red-950/30 border-red-500'
                                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${active ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`} />
                                <span className={`text-xs font-bold ${active ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}`}>{svc.label}</span>
                              </div>
                              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block">{svc.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Footprints className="w-3.5 h-3.5 text-zinc-500" /> Daily Step Goal
                      </label>
                      {!showCustomSteps ? (
                        <div className="grid grid-cols-3 gap-2">
                          {STEP_PRESETS.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStepGoal(s)}
                              className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                stepGoal === s && !showCustomSteps
                                  ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400 font-bold'
                                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <span className="text-xs font-bold">{s.toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={customStepGoal}
                          onChange={(e) => setCustomStepGoal(e.target.value)}
                          placeholder="Enter step goal..."
                          min={1000}
                          max={50000}
                          className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                        />
                      )}
                      <button
                        onClick={() => setShowCustomSteps(!showCustomSteps)}
                        className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 hover:text-red-700 cursor-pointer transition-colors"
                      >
                        {showCustomSteps ? 'Use preset goals' : 'Enter custom number'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-zinc-500" /> Budget Range
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {BUDGETS.map((b) => (
                          <button
                            key={b.value}
                            onClick={() => setBudget(b.value)}
                            className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                              budget === b.value
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400 font-bold'
                                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{b.label}</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{b.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── STEP 3: Why Now & Review ── */}
                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-zinc-500" /> Why are you seeking coaching now?
                      </label>
                      <textarea
                        value={whyNow}
                        onChange={(e) => setWhyNow(e.target.value)}
                        placeholder="Tell the coach what's driving you -- a goal, a plateau, an event, a life change..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>

                    {/* Summary card */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Your Consultation Summary</h4>

                      <SummaryRow label="Goal" value={goal} />
                      <SummaryRow label="Experience" value={experience} />
                      <SummaryRow label="Training Days" value={`${trainingDays}x/week`} />
                      <SummaryRow label="Timeline" value={TIMELINES.find((t) => t.value === timeline)?.label || timeline} />
                      <SummaryRow label="Step Goal" value={`${(showCustomSteps && customStepGoal ? parseInt(customStepGoal, 10) || stepGoal : stepGoal).toLocaleString()} steps/day`} />
                      <SummaryRow label="Budget" value={BUDGETS.find((b) => b.value === budget)?.label || budget} />
                      {selectedServices.length > 0 && (
                        <SummaryRow
                          label="Services"
                          value={selectedServices.map((s) => SERVICES.find((sv) => sv.id === s)?.label || s).join(', ')}
                        />
                      )}
                      {supplements && <SummaryRow label="Supplements" value={supplements} />}
                      {dietPreferences && <SummaryRow label="Diet" value={dietPreferences} />}
                      {injuries && <SummaryRow label="Injuries" value={injuries} />}
                    </div>

                    {/* Snapshot */}
                    {snapshot && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                            Auto-Attached Progress Data
                          </span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-2 gap-4">
                          <SnapshotCard
                            icon={<Dumbbell className="w-3.5 h-3.5 text-blue-500" />}
                            label="Workouts"
                            value={`${snapshot.workouts.totalSessions} sessions`}
                            sub={`~${snapshot.workouts.avgPerWeek}/week`}
                          />
                          <SnapshotCard
                            icon={<Utensils className="w-3.5 h-3.5 text-amber-500" />}
                            label="Nutrition"
                            value={`${snapshot.nutrition.avgCalories} cal`}
                            sub={`${snapshot.nutrition.avgProtein}g protein`}
                          />
                          <SnapshotCard
                            icon={<Moon className="w-3.5 h-3.5 text-indigo-500" />}
                            label="Sleep"
                            value={`${snapshot.sleep.avgHours} hrs avg`}
                            sub={`${snapshot.sleep.qualityScore}% quality`}
                          />
                          <SnapshotCard
                            icon={<Scale className="w-3.5 h-3.5 text-teal-500" />}
                            label="Bodyweight"
                            value={`${snapshot.bodyweight.current} kg`}
                            sub={snapshot.bodyweight.trend}
                          />
                          <SnapshotCard
                            icon={<Footprints className="w-3.5 h-3.5 text-emerald-500" />}
                            label="Avg Steps"
                            value={`${snapshot.steps.avgDaily.toLocaleString()}`}
                            sub="steps/day"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 italic text-center">
                          This data is shared with {coachName} to help assess your starting point
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {step < TOTAL_STEPS - 1 ? (
                    <button
                      onClick={() => canAdvance() && setStep(step + 1)}
                      disabled={!canAdvance()}
                      className="flex-1 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-40 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98] transition-all"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canAdvance() || sending}
                      className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      {sending ? (
                        <span className="animate-pulse">Sending...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-semibold shrink-0 w-20 pt-0.5">{label}</span>
    <span className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold leading-snug">{value}</span>
  </div>
);

const SnapshotCard: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string }> = ({
  icon, label, value, sub,
}) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5">{icon}</div>
    <div>
      <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">{label}</span>
      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{value}</p>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{sub}</p>
    </div>
  </div>
);
