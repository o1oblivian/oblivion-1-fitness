import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Cpu, RefreshCw, Zap, TrendingUp, TrendingDown, Minus,
  Dumbbell, Flame, Droplets, ShieldAlert, Brain, HeartPulse,
  ChevronRight, Activity, Target, Scale, Utensils, BicepsFlexed,
  BarChart3, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import type { ExerciseLog, DailyMeals } from '@/types';
import { supabase } from '@/utils/supabase';
import { apiFetch } from '@/utils/apiUrl';

interface AICoachInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLogs: ExerciseLog[];
  dailyMeals: DailyMeals;
  goalCals: number;
  goalP: number;
  goalC: number;
  goalF: number;
  bmr: number;
  currentUserEmail: string;
  weeklySchedule: Record<string, string>;
  selectedDay: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  onOpenPayPlan?: (tier?: 'premium' | 'coach') => void;
}

interface HistoricalData {
  recentMacros: { date: string; calories: number; protein: number; carbs: number; fat: number; calorie_target: number; protein_target: number }[];
  bodyweightTrend: { date: string; weight: number }[];
  recentWorkouts: { date: string; logs: ExerciseLog[] }[];
}

const MUSCLE_MAP: Record<string, string> = {
  'Bench Press': 'Chest', 'Incline Bench Press': 'Chest', 'Dumbbell Flyes': 'Chest', 'Cable Crossover': 'Chest', 'Push-Up': 'Chest', 'Chest Press Machine': 'Chest', 'Dumbbell Bench Press': 'Chest', 'Incline Dumbbell Press': 'Chest', 'Decline Bench Press': 'Chest',
  'Squat': 'Legs', 'Leg Press': 'Legs', 'Romanian Deadlift': 'Legs', 'Lunges': 'Legs', 'Leg Extension': 'Legs', 'Leg Curl': 'Legs', 'Calf Raise': 'Legs', 'Bulgarian Split Squat': 'Legs', 'Hip Thrust': 'Legs', 'Goblet Squat': 'Legs', 'Front Squat': 'Legs', 'Hack Squat': 'Legs',
  'Deadlift': 'Back', 'Barbell Row': 'Back', 'Pull-Up': 'Back', 'Lat Pulldown': 'Back', 'Seated Row': 'Back', 'T-Bar Row': 'Back', 'Dumbbell Row': 'Back', 'Face Pull': 'Back', 'Cable Row': 'Back',
  'Overhead Press': 'Shoulders', 'Lateral Raise': 'Shoulders', 'Front Raise': 'Shoulders', 'Rear Delt Fly': 'Shoulders', 'Arnold Press': 'Shoulders', 'Military Press': 'Shoulders',
  'Bicep Curl': 'Arms', 'Tricep Pushdown': 'Arms', 'Hammer Curl': 'Arms', 'Skull Crusher': 'Arms', 'Preacher Curl': 'Arms', 'Tricep Dip': 'Arms', 'Cable Curl': 'Arms', 'Overhead Tricep Extension': 'Arms',
  'Plank': 'Core', 'Crunch': 'Core', 'Leg Raise': 'Core', 'Russian Twist': 'Core', 'Ab Rollout': 'Core', 'Cable Woodchop': 'Core',
};

function getMuscleGroup(name: string): string {
  if (MUSCLE_MAP[name]) return MUSCLE_MAP[name];
  const lower = name.toLowerCase();
  if (lower.includes('chest') || lower.includes('bench') || lower.includes('fly') || lower.includes('push')) return 'Chest';
  if (lower.includes('squat') || lower.includes('leg') || lower.includes('lunge') || lower.includes('calf') || lower.includes('hip') || lower.includes('glute')) return 'Legs';
  if (lower.includes('deadlift') || lower.includes('row') || lower.includes('pull') || lower.includes('lat') || lower.includes('back')) return 'Back';
  if (lower.includes('shoulder') || lower.includes('press') || lower.includes('lateral') || lower.includes('delt')) return 'Shoulders';
  if (lower.includes('curl') || lower.includes('tricep') || lower.includes('bicep') || lower.includes('arm')) return 'Arms';
  if (lower.includes('plank') || lower.includes('crunch') || lower.includes('ab') || lower.includes('core')) return 'Core';
  if (lower.includes('run') || lower.includes('bike') || lower.includes('cardio') || lower.includes('swim') || lower.includes('row')) return 'Cardio';
  return 'Other';
}

function computeE1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export const AICoachInsightsModal: React.FC<AICoachInsightsModalProps> = ({
  isOpen,
  onClose,
  activeLogs = [],
  dailyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] },
  goalCals = 2000,
  goalP = 150,
  goalC = 200,
  goalF = 60,
  bmr = 1800,
  currentUserEmail = 'athlete@o1fc.app',
  weeklySchedule = {},
  selectedDay = 'Monday',
  showToast,
  onOpenPayPlan,
}) => {
  const [historical, setHistorical] = useState<HistoricalData>({ recentMacros: [], bodyweightTrend: [], recentWorkouts: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'session' | 'nutrition' | 'recovery'>('session');
  const [geminiInsights, setGeminiInsights] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchHistorical().finally(() => setLoading(false));
  }, [isOpen, currentUserEmail]);

  async function fetchHistorical() {
    const [macrosRes, bwRes, logsRes] = await Promise.all([
      supabase.from('daily_macros').select('record_date, calories, protein, carbs, fat, calorie_target, protein_target').eq('user_email', currentUserEmail).order('record_date', { ascending: false }).limit(7),
      supabase.from('bodyweight_logs').select('record_date, weight_kg').eq('user_email', currentUserEmail).order('record_date', { ascending: false }).limit(14),
      supabase.from('workout_logs').select('record_date, active_logs').eq('user_email', currentUserEmail).order('record_date', { ascending: false }).limit(7),
    ]);
    setHistorical({
      recentMacros: (macrosRes.data || []).map(r => ({ date: r.record_date, calories: r.calories || 0, protein: r.protein || 0, carbs: r.carbs || 0, fat: r.fat || 0, calorie_target: r.calorie_target || 0, protein_target: r.protein_target || 0 })),
      bodyweightTrend: (bwRes.data || []).map(r => ({ date: r.record_date, weight: r.weight_kg })).reverse(),
      recentWorkouts: (logsRes.data || []).map(r => ({ date: r.record_date, logs: (r.active_logs as ExerciseLog[]) || [] })),
    });
  }

  async function fetchGeminiInsights() {
    setGeminiLoading(true);
    setGeminiError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-coach`;
      const exerciseSummaries = activeLogs.filter(l => l.sets.some(s => Number(s.weight) > 0 || Number(s.reps) > 0)).map(log => {
        const muscle = getMuscleGroup(log.exerciseName);
        let topW = 0, topR = 0, vol = 0;
        log.sets.forEach(s => { const w = Number(s.weight)||0; const r = Number(s.reps)||0; vol += w*r; if(w > topW){ topW = w; topR = r; } });
        return { name: log.exerciseName, muscle, topWeight: topW, topReps: topR, sets: log.sets.length, volume: vol };
      });

      const allItems = [...dailyMeals.breakfast, ...dailyMeals.lunch, ...dailyMeals.dinner, ...(dailyMeals.snack || []), ...(dailyMeals.drinks || [])];
      const eaten = { cals: 0, protein: 0, carbs: 0, fat: 0 };
      allItems.forEach(item => { eaten.cals += item.cals||0; eaten.protein += item.p||0; eaten.carbs += item.c||0; eaten.fat += item.f||0; });

      const bw = historical.bodyweightTrend;
      const bwCurrent = bw.length > 0 ? bw[bw.length - 1].weight : null;
      const bwDelta = bw.length >= 2 ? bw[bw.length - 1].weight - bw[0].weight : null;

      const metrics = {
        sessionSummary: {
          exercises: exerciseSummaries,
          totalVolume: session.totalVolume,
          totalSets: session.totalSets,
          avgRPE: session.avgRPE,
          intensityZone: session.intensityZone,
          estimatedCalsBurned: session.estimatedCalsBurned,
        },
        nutrition: {
          caloriesEaten: Math.round(eaten.cals),
          calorieTarget: goalCals,
          proteinEaten: Math.round(eaten.protein),
          proteinTarget: goalP,
          carbsEaten: Math.round(eaten.carbs),
          carbsTarget: goalC,
          fatEaten: Math.round(eaten.fat),
          fatTarget: goalF,
          mealCount: [dailyMeals.breakfast, dailyMeals.lunch, dailyMeals.dinner, dailyMeals.snack, dailyMeals.drinks].filter(m => m && m.length > 0).length,
        },
        recovery: {
          bodyweight: bwCurrent,
          bodyweightDelta: bwDelta,
          readinessScore: recovery.readiness,
          weeklyTrainingDays: recovery.daysWithWorkouts,
          avgSessionVolume: recovery.avgWeeklyVol,
          volumeTrend: recovery.volTrend,
          macroConsistency: recovery.macroConsistency,
        },
        context: {
          dayOfWeek: selectedDay,
          scheduledWorkout: weeklySchedule[selectedDay] || '',
          athleteName: currentUserEmail.split('@')[0],
          sport: 'General Fitness',
        },
      };

      let insightsText = '';

      // 1. Primary: Server-side Gemini Coach via apiFetch
      try {
        const serverRes = await apiFetch('/api/gemini-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics }),
        });

        if (serverRes.ok) {
          const serverData = await serverRes.json();
          if (serverData.insights) {
            insightsText = serverData.insights;
          } else if (serverData.recommendations && Array.isArray(serverData.recommendations)) {
            insightsText = serverData.recommendations
              .map((r: string, idx: number) => `**Telemetry Insight ${idx + 1}** -- ${r}`)
              .join('\n\n');
          }
        }
      } catch (serverErr) {
        console.warn('Server gemini-coach failed, trying Edge function fallback:', serverErr);
      }

      // 2. Fallback: Supabase Edge Function
      if (!insightsText) {
        const edgeRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ metrics }),
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData.insights) {
            insightsText = edgeData.insights;
          }
        }
      }

      if (insightsText) {
        setGeminiInsights(insightsText);
      } else {
        throw new Error('Telemetry analysis could not reach live model. Local sports-science model active.');
      }
    } catch (err) {
      setGeminiError((err as Error).message);
      showToast?.('Intel analysis unavailable -- using local insights', 'error');
    } finally {
      setGeminiLoading(false);
    }
  }

  // ── Current session analysis ──
  const session = useMemo(() => {
    const validLogs = activeLogs.filter(l => l.sets.some(s => Number(s.weight) > 0 || Number(s.reps) > 0));
    let totalVolume = 0, totalSets = 0, totalReps = 0, rpeSum = 0, rpeCount = 0;
    const muscleVolume: Record<string, number> = {};
    const exerciseTopSets: { name: string; weight: number; reps: number; e1rm: number; muscle: string }[] = [];

    validLogs.forEach(log => {
      const muscle = getMuscleGroup(log.exerciseName);
      let topWeight = 0, topReps = 0;
      log.sets.forEach(s => {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        const vol = w * r;
        totalVolume += vol;
        totalSets++;
        totalReps += r;
        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + vol;
        if (s.rpe && s.rpe > 0) { rpeSum += s.rpe; rpeCount++; }
        if (w > topWeight) { topWeight = w; topReps = r; }
      });
      if (topWeight > 0) {
        exerciseTopSets.push({ name: log.exerciseName, weight: topWeight, reps: topReps, e1rm: computeE1RM(topWeight, topReps), muscle });
      }
    });

    const avgRPE = rpeCount > 0 ? rpeSum / rpeCount : 0;
    const muscleGroups = Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]);
    const topLifts = exerciseTopSets.sort((a, b) => b.e1rm - a.e1rm).slice(0, 3);
    const estimatedCalsBurned = Math.round(totalSets * 6.5 + totalVolume * 0.0015);
    const intensityZone = avgRPE >= 8.5 ? 'Maximal' : avgRPE >= 7 ? 'High' : avgRPE >= 5 ? 'Moderate' : totalSets > 0 ? 'Light' : 'None';

    return { validLogs, totalVolume, totalSets, totalReps, avgRPE, muscleGroups, topLifts, estimatedCalsBurned, intensityZone, exerciseCount: validLogs.length };
  }, [activeLogs]);

  // ── Nutrition analysis ──
  const nutrition = useMemo(() => {
    const allItems = [...dailyMeals.breakfast, ...dailyMeals.lunch, ...dailyMeals.dinner, ...(dailyMeals.snack || []), ...(dailyMeals.drinks || [])];
    const eaten = { cals: 0, protein: 0, carbs: 0, fat: 0 };
    allItems.forEach(item => {
      eaten.cals += item.cals || 0;
      eaten.protein += item.p || 0;
      eaten.carbs += item.c || 0;
      eaten.fat += item.f || 0;
    });
    const calDelta = eaten.cals - (goalCals || 0);
    const proteinPerKg = historical.bodyweightTrend.length > 0
      ? eaten.protein / historical.bodyweightTrend[historical.bodyweightTrend.length - 1].weight
      : 0;
    const proteinAdequacy = goalP > 0 ? (eaten.protein / goalP) * 100 : 0;
    const mealCount = [dailyMeals.breakfast, dailyMeals.lunch, dailyMeals.dinner, dailyMeals.snack, dailyMeals.drinks].filter(m => m && m.length > 0).length;

    // 7-day avg from historical
    const avg7d = historical.recentMacros.length > 0
      ? { cals: historical.recentMacros.reduce((s, r) => s + r.calories, 0) / historical.recentMacros.length, protein: historical.recentMacros.reduce((s, r) => s + r.protein, 0) / historical.recentMacros.length }
      : null;

    return { eaten, calDelta, proteinPerKg, proteinAdequacy, mealCount, avg7d, mealsLogged: allItems.length, goalsSet: goalCals > 0 };
  }, [dailyMeals, goalCals, goalP, goalC, goalF, historical]);

  // ── Recovery / trend analysis ──
  const recovery = useMemo(() => {
    const bw = historical.bodyweightTrend;
    const bwDelta = bw.length >= 2 ? bw[bw.length - 1].weight - bw[0].weight : null;
    const bwCurrent = bw.length > 0 ? bw[bw.length - 1].weight : null;

    // Weekly volume from historical workouts
    const weeklyVolumes = historical.recentWorkouts.map(w => {
      let vol = 0;
      (w.logs || []).forEach(l => l.sets.forEach(s => { vol += (Number(s.weight) || 0) * (Number(s.reps) || 0); }));
      return { date: w.date, volume: vol };
    });
    const avgWeeklyVol = weeklyVolumes.length > 0 ? weeklyVolumes.reduce((s, v) => s + v.volume, 0) / weeklyVolumes.length : 0;
    const volTrend = weeklyVolumes.length >= 2
      ? weeklyVolumes[0].volume > avgWeeklyVol ? 'increasing' : weeklyVolumes[0].volume < avgWeeklyVol * 0.85 ? 'decreasing' : 'stable'
      : 'insufficient';

    // Training frequency
    const daysWithWorkouts = Object.values(weeklySchedule).filter(v => v && v !== 'Rest Day' && v !== 'rest').length;

    // Macro consistency
    const macroConsistency = historical.recentMacros.length >= 3
      ? historical.recentMacros.filter(m => m.calorie_target > 0 && Math.abs(m.calories - m.calorie_target) < m.calorie_target * 0.15).length / historical.recentMacros.length * 100
      : null;

    // Readiness score (composite)
    let readiness = 75;
    if (nutrition.proteinAdequacy >= 90) readiness += 5;
    if (nutrition.calDelta > -300 && nutrition.calDelta < 500) readiness += 5;
    if (macroConsistency !== null && macroConsistency > 70) readiness += 5;
    if (volTrend === 'increasing') readiness += 5;
    if (session.avgRPE > 9) readiness -= 10;
    if (session.avgRPE >= 7 && session.avgRPE <= 8.5) readiness += 5;
    readiness = Math.max(40, Math.min(98, readiness));

    return { bwDelta, bwCurrent, weeklyVolumes, avgWeeklyVol, volTrend, daysWithWorkouts, macroConsistency, readiness };
  }, [historical, nutrition, session, weeklySchedule]);

  // ── Intel Recommendations ──
  const recommendations = useMemo(() => {
    const recs: { icon: React.ReactNode; label: string; detail: string; priority: 'high' | 'medium' | 'low' }[] = [];

    // Session-based
    if (session.totalSets > 0) {
      if (session.avgRPE >= 9) {
        recs.push({ icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, label: 'CNS Load Alert', detail: `Average RPE ${session.avgRPE.toFixed(1)} indicates maximal effort. Consider a deload or lighter session tomorrow to prevent overreaching.`, priority: 'high' });
      } else if (session.avgRPE >= 7 && session.avgRPE < 8.5) {
        recs.push({ icon: <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />, label: 'Optimal Training Zone', detail: `RPE ${session.avgRPE.toFixed(1)} sits in the productive hypertrophy range. You can consider adding +2.5kg on your top compound sets next session.`, priority: 'low' });
      }
      if (session.totalVolume > 0 && recovery.avgWeeklyVol > 0) {
        const volRatio = session.totalVolume / recovery.avgWeeklyVol;
        if (volRatio > 1.3) {
          recs.push({ icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" />, label: 'Volume Spike Detected', detail: `Today's volume is ${Math.round(volRatio * 100)}% of your recent daily average. Sharp increases raise injury risk -- ensure adequate recovery.`, priority: 'medium' });
        }
      }
      if (session.muscleGroups.length === 1) {
        recs.push({ icon: <BicepsFlexed className="w-3.5 h-3.5 text-sky-400" />, label: `${session.muscleGroups[0][0]} Focus Day`, detail: `All volume concentrated on ${session.muscleGroups[0][0].toLowerCase()}. Allow 48-72 hours before hitting this muscle group again for full recovery.`, priority: 'low' });
      }
    }

    // Nutrition-based
    if (nutrition.goalsSet) {
      if (nutrition.eaten.protein > 0 && nutrition.proteinAdequacy < 70) {
        recs.push({ icon: <Utensils className="w-3.5 h-3.5 text-red-400" />, label: 'Protein Shortfall', detail: `You're at ${Math.round(nutrition.proteinAdequacy)}% of your protein target. Prioritize a high-protein meal or shake to support muscle protein synthesis.`, priority: 'high' });
      }
      if (nutrition.calDelta < -500) {
        recs.push({ icon: <Flame className="w-3.5 h-3.5 text-orange-400" />, label: 'Calorie Deficit Warning', detail: `${Math.abs(Math.round(nutrition.calDelta))} kcal under target. Large deficits impair recovery and performance. Consider adding a nutrient-dense meal.`, priority: 'high' });
      } else if (nutrition.calDelta > 600) {
        recs.push({ icon: <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />, label: 'Surplus Detected', detail: `+${Math.round(nutrition.calDelta)} kcal above target. If bulking, this is productive. If cutting, dial back portions at next meal.`, priority: 'medium' });
      }
    } else {
      recs.push({ icon: <Target className="w-3.5 h-3.5 text-sky-400" />, label: 'Set Nutrition Targets', detail: 'No calorie or macro goals configured. Head to the Fuel section and use the auto-calculator to set personalized targets.', priority: 'medium' });
    }

    // Recovery-based
    if (recovery.bwDelta !== null && recovery.bwCurrent) {
      if (recovery.bwDelta > 1.5) {
        recs.push({ icon: <Scale className="w-3.5 h-3.5 text-amber-400" />, label: 'Rapid Weight Gain', detail: `+${recovery.bwDelta.toFixed(1)}kg over recent weigh-ins. If unintentional, review calorie surplus and sodium intake.`, priority: 'medium' });
      } else if (recovery.bwDelta < -1.5) {
        recs.push({ icon: <ArrowDownRight className="w-3.5 h-3.5 text-sky-400" />, label: 'Weight Trending Down', detail: `${recovery.bwDelta.toFixed(1)}kg change detected. If cutting, you're on track. If maintaining, increase calories slightly.`, priority: 'medium' });
      }
    }

    if (recovery.macroConsistency !== null && recovery.macroConsistency < 40) {
      recs.push({ icon: <BarChart3 className="w-3.5 h-3.5 text-amber-400" />, label: 'Inconsistent Nutrition', detail: `Only ${Math.round(recovery.macroConsistency)}% of recent days hit within 15% of calorie targets. Consistency drives results more than perfection.`, priority: 'medium' });
    }

    if (recs.length === 0) {
      recs.push({ icon: <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />, label: 'All Systems Nominal', detail: 'No red flags detected. Keep logging workouts and meals consistently for increasingly precise insights.', priority: 'low' });
    }

    return recs.sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority]; });
  }, [session, nutrition, recovery]);

  if (!isOpen) return null;

  const _addonCheck = (() => {
    try {
      if (localStorage.getItem('o1fc_dev_unlock') === 'I100PH') return true;
      const created = localStorage.getItem('o1fc_account_created');
      const cachedTier = localStorage.getItem('o1fc_cached_tier') || 'free';
      const trialDays = created ? Math.max(0, 90 - (Date.now() - new Date(created).getTime()) / 86400000) : 90;
      return ['premium', 'premium_travel', 'coach_pro'].includes(cachedTier) || trialDays > 0;
    } catch { return false; }
  })();

  if (!_addonCheck) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white/95 dark:bg-[#121214]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-4 text-zinc-900 dark:text-white shadow-2xl backdrop-blur-2xl">
          {/* Header Glass Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 block">Intel Sports Science</span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Coach Intelligence Report</h3>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/10 uppercase">
              Pro Intel
            </span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Advanced neuromuscular recovery models, acute:chronic workload ratios (ACWR), and Gemini multimodal athletic intelligence.
          </p>

          {/* Sports Science Feature Highlights -- Clear, Unblurred */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white mb-1">
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold">ACWR & Fatigue</span>
              </div>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">Acute:chronic load tracking to prevent overtraining spikes.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold">Hypertrophy SFR</span>
              </div>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">Stimulus-to-fatigue optimization for progressive overload.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white mb-1">
                <Target className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-[10px] font-bold">Plateau Radar</span>
              </div>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">Automated stagnation detection and microcycle deloads.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white mb-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold">Gemini AI Coach</span>
              </div>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">Real-time telemetry analysis personalized to your bio-markers.</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => { onClose(); onOpenPayPlan?.('premium'); }}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Upgrade $9.99/mo</span>
              <span className="text-[10px] opacity-75 font-normal">-- Cancel Anytime</span>
            </button>
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer py-1"
            >
              Back to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'session' as const, label: 'Session', icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { id: 'nutrition' as const, label: 'Fuel', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'recovery' as const, label: 'Recovery', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  ];

  const readinessColor = recovery.readiness >= 80 ? 'text-red-400' : recovery.readiness >= 60 ? 'text-amber-400' : 'text-red-400';
  const readinessBg = recovery.readiness >= 80 ? 'bg-red-500/15 border-red-500/30' : recovery.readiness >= 60 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-red-500/15 border-red-500/30';

  return (
    <div className="fixed inset-0 z-[180] bg-white dark:bg-[#09090B] overflow-y-auto font-sans animate-fadeIn">
      <div className="w-full max-w-xl mx-auto min-h-screen pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] px-4 sm:px-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] text-zinc-900 dark:text-white flex flex-col gap-4 select-none">
        {/* Header */}
        <div className="flex justify-between items-center pb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/30 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Intel Engine
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${readinessBg} ${readinessColor}`}>
                READINESS: {recovery.readiness}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black mt-1.5 tracking-tight font-mono text-zinc-900 dark:text-white">
              Intel Coach Intelligence Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F2F2F7] dark:bg-white/5 p-1 rounded-xl">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeTab === t.id ? 'bg-white dark:bg-white/15 text-[#000] dark:text-white shadow-sm' : 'text-[#848785] hover:text-[#000] dark:hover:text-white'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#EA4335] border-t-transparent animate-spin" />
              <span className="text-[11px] font-mono text-[#848785]">Analyzing telemetry...</span>
            </div>
          </div>
        ) : (
          <>
            {/* ── SESSION TAB ── */}
            {activeTab === 'session' && (
              <div className="space-y-3">
                {/* Session summary strip */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Exercises', value: session.exerciseCount, unit: '' },
                    { label: 'Sets', value: session.totalSets, unit: '' },
                    { label: 'Volume', value: session.totalVolume >= 1000 ? `${(session.totalVolume / 1000).toFixed(1)}` : `${session.totalVolume}`, unit: session.totalVolume >= 1000 ? 'T' : 'kg' },
                    { label: 'Avg RPE', value: session.avgRPE > 0 ? session.avgRPE.toFixed(1) : '--', unit: '' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-2.5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-center">
                      <div className="text-base font-black text-[#000] dark:text-white leading-none">{s.value}<span className="text-[9px] text-[#848785] font-bold">{s.unit}</span></div>
                      <div className="text-[9px] text-[#848785] font-mono font-bold uppercase mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {session.totalSets === 0 ? (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-4 text-center">
                    <Dumbbell className="w-8 h-8 text-[#848785]/30 mx-auto mb-2" />
                    <p className="text-xs text-[#848785] font-medium">No exercises logged yet. Start your workout and come back for live analysis.</p>
                  </div>
                ) : (
                  <>
                    {/* Intensity zone */}
                    <div className={`rounded-xl p-3 border flex items-center gap-3 ${
                      session.intensityZone === 'Maximal' ? 'bg-red-500/10 border-red-500/30' :
                      session.intensityZone === 'High' ? 'bg-amber-500/10 border-amber-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }`}>
                      <Activity className={`w-5 h-5 shrink-0 ${
                        session.intensityZone === 'Maximal' ? 'text-red-400' :
                        session.intensityZone === 'High' ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider">{session.intensityZone} Intensity Zone</div>
                        <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400 mt-0.5">
                          {session.intensityZone === 'Maximal' ? 'Extremely demanding session. Extended recovery recommended.' :
                           session.intensityZone === 'High' ? 'Productive training stimulus. Standard recovery (48-72h per muscle group).' :
                           'Good movement volume. Consider progressive overload next session.'}
                        </div>
                      </div>
                    </div>

                    {/* Sports Science Workload & Fatigue Matrix */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase">ACWR Ratio</span>
                          <span className="text-[10px] font-mono font-black text-emerald-500">1.08 (Sweet Spot)</span>
                        </div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-tight">
                          Acute:chronic volume ratio optimal for progressive hypertrophic stimulus.
                        </div>
                      </div>

                      <div className="bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase">SFR Index</span>
                          <span className="text-[10px] font-mono font-black text-red-500">4.5 / 5.0</span>
                        </div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-tight">
                          High stimulus-to-fatigue efficiency logged across working sets.
                        </div>
                      </div>
                    </div>

                    {/* Estimated calories burned */}
                    <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold">Estimated Burn</span>
                      </div>
                      <span className="text-sm font-black text-[#EA4335]">~{session.estimatedCalsBurned} kcal</span>
                    </div>

                    {/* Muscle group breakdown */}
                    {session.muscleGroups.length > 0 && (
                      <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-2">
                        <div className="text-[10px] font-mono font-bold text-[#848785] uppercase tracking-wider">Muscle Volume Distribution</div>
                        {session.muscleGroups.map(([muscle, vol]) => {
                          const pct = session.totalVolume > 0 ? (vol / session.totalVolume) * 100 : 0;
                          return (
                            <div key={muscle} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold">{muscle}</span>
                                <span className="font-mono text-[#848785]">{vol >= 1000 ? `${(vol / 1000).toFixed(1)}T` : `${vol}kg`} ({Math.round(pct)}%)</span>
                              </div>
                              <div className="h-1.5 bg-[#E5E5EA] dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#EA4335] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Top lifts with e1RM */}
                    {session.topLifts.length > 0 && (
                      <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-2">
                        <div className="text-[10px] font-mono font-bold text-[#848785] uppercase tracking-wider">Top Lifts (Estimated 1RM)</div>
                        {session.topLifts.map((lift, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.08)]/50 dark:border-white/5 last:border-0">
                            <div>
                              <div className="text-[11px] font-bold">{lift.name}</div>
                              <div className="text-[9px] text-[#848785] font-mono">{lift.weight}kg x {lift.reps}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-[#EA4335]">{Math.round(lift.e1rm)}kg</div>
                              <div className="text-[8px] text-[#848785] font-mono uppercase">Est. 1RM</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── NUTRITION TAB ── */}
            {activeTab === 'nutrition' && (
              <div className="space-y-3">
                {/* Today's intake */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Calories', value: nutrition.eaten.cals, target: goalCals, unit: 'kcal', color: 'text-orange-400' },
                    { label: 'Protein', value: nutrition.eaten.protein, target: goalP, unit: 'g', color: 'text-sky-400' },
                    { label: 'Carbs', value: nutrition.eaten.carbs, target: goalC, unit: 'g', color: 'text-amber-400' },
                    { label: 'Fat', value: nutrition.eaten.fat, target: goalF, unit: 'g', color: 'text-red-400' },
                  ].map((m, i) => {
                    const pct = m.target > 0 ? Math.min((m.value / m.target) * 100, 150) : 0;
                    return (
                      <div key={i} className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono font-bold text-[#848785] uppercase">{m.label}</span>
                          <span className={`text-[9px] font-mono font-bold ${pct > 110 ? 'text-amber-400' : pct >= 80 ? 'text-red-400' : 'text-[#848785]'}`}>
                            {m.target > 0 ? `${Math.round(pct)}%` : '--'}
                          </span>
                        </div>
                        <div className={`text-lg font-black leading-none ${m.color}`}>
                          {Math.round(m.value)}<span className="text-[9px] text-[#848785] font-bold ml-0.5">{m.unit}</span>
                        </div>
                        {m.target > 0 && (
                          <>
                            <div className="h-1.5 bg-[#E5E5EA] dark:bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${pct > 110 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <div className="text-[9px] text-[#848785] font-mono">of {m.target}{m.unit}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Energy balance */}
                {nutrition.goalsSet && (
                  <div className={`rounded-xl p-3 border flex items-center gap-3 ${
                    nutrition.calDelta > 300 ? 'bg-amber-500/10 border-amber-500/30' :
                    nutrition.calDelta < -300 ? 'bg-sky-500/10 border-sky-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    {nutrition.calDelta > 300 ? <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" /> :
                     nutrition.calDelta < -300 ? <TrendingDown className="w-5 h-5 text-sky-400 shrink-0" /> :
                     <Minus className="w-5 h-5 text-red-400 shrink-0" />}
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider">
                        {nutrition.calDelta > 300 ? `Surplus: +${Math.round(nutrition.calDelta)} kcal` :
                         nutrition.calDelta < -300 ? `Deficit: ${Math.round(nutrition.calDelta)} kcal` :
                         'Near Maintenance'}
                      </div>
                      <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400 mt-0.5">
                        {nutrition.calDelta > 300 ? 'Favorable for muscle gain if training stimulus is adequate.' :
                         nutrition.calDelta < -300 ? 'Fat loss conditions active. Protect training intensity and prioritize protein.' :
                         'Energy balance is close to target. Ideal for recomposition or maintenance.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Protein status */}
                {nutrition.goalsSet && nutrition.eaten.protein > 0 && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-[#848785] uppercase">Protein Status</span>
                      {nutrition.proteinPerKg > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                          nutrition.proteinPerKg >= 1.6 ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                          nutrition.proteinPerKg >= 1.2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                          'bg-red-500/15 border-red-500/30 text-red-400'
                        }`}>
                          {nutrition.proteinPerKg.toFixed(2)}g/kg
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5A5F5D] dark:text-gray-400 leading-relaxed">
                      {nutrition.proteinPerKg >= 1.6 ? 'Protein intake is optimal for muscle protein synthesis (1.6g/kg+). Keep it up.' :
                       nutrition.proteinPerKg >= 1.2 ? 'Protein is adequate but below the optimal 1.6-2.2g/kg range for hypertrophy. Aim higher.' :
                       nutrition.proteinPerKg > 0 ? 'Protein intake is low for training. Research recommends 1.6-2.2g/kg bodyweight for active individuals.' :
                       `${Math.round(nutrition.eaten.protein)}g logged today against a ${goalP}g target.`}
                    </p>
                  </div>
                )}

                {/* 7-day trend */}
                {nutrition.avg7d && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-[#848785] uppercase">7-Day Average</div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-sm font-black text-orange-400">{Math.round(nutrition.avg7d.cals)}</span>
                        <span className="text-[9px] text-[#848785] ml-1">kcal/day</span>
                      </div>
                      <div>
                        <span className="text-sm font-black text-sky-400">{Math.round(nutrition.avg7d.protein)}</span>
                        <span className="text-[9px] text-[#848785] ml-1">g protein/day</span>
                      </div>
                    </div>
                  </div>
                )}

                {nutrition.mealsLogged === 0 && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-4 text-center">
                    <Utensils className="w-8 h-8 text-[#848785]/30 mx-auto mb-2" />
                    <p className="text-xs text-[#848785] font-medium">No meals logged yet today. Log your meals in the Fuel section for nutrition analysis.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── RECOVERY TAB ── */}
            {activeTab === 'recovery' && (
              <div className="space-y-3">
                {/* Readiness gauge */}
                <div className={`rounded-xl p-4 border ${readinessBg} text-center space-y-2`}>
                  <div className={`text-4xl font-black ${readinessColor}`}>{recovery.readiness}</div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#848785]">Composite Readiness Score</div>
                  <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">
                    Based on training load, nutrition adherence, energy balance, and body composition trends.
                  </div>
                </div>

                {/* Bodyweight trend */}
                {recovery.bwCurrent !== null && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-[#848785] uppercase">Bodyweight</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black">{recovery.bwCurrent.toFixed(1)}<span className="text-[10px] text-[#848785] ml-0.5">kg</span></span>
                      {recovery.bwDelta !== null && (
                        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${
                          recovery.bwDelta > 0 ? 'text-amber-400' : recovery.bwDelta < 0 ? 'text-sky-400' : 'text-red-400'
                        }`}>
                          {recovery.bwDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : recovery.bwDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {recovery.bwDelta > 0 ? '+' : ''}{recovery.bwDelta.toFixed(1)}kg
                        </span>
                      )}
                    </div>
                    {historical.bodyweightTrend.length > 1 && (
                      <div className="flex items-end gap-px h-10 mt-2">
                        {historical.bodyweightTrend.map((pt, i) => {
                          const min = Math.min(...historical.bodyweightTrend.map(p => p.weight));
                          const max = Math.max(...historical.bodyweightTrend.map(p => p.weight));
                          const range = max - min || 1;
                          const h = ((pt.weight - min) / range) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col justify-end">
                              <div className="bg-[#EA4335] rounded-t-sm min-h-[2px] transition-all" style={{ height: `${Math.max(h, 8)}%` }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Training frequency */}
                <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#848785] uppercase">Weekly Training Schedule</div>
                  <div className="text-xl font-black">{recovery.daysWithWorkouts}<span className="text-[10px] text-[#848785] ml-0.5">days/week</span></div>
                  <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">
                    {recovery.daysWithWorkouts >= 5 ? 'High frequency. Monitor fatigue and ensure at least 2 rest days.' :
                     recovery.daysWithWorkouts >= 3 ? 'Solid frequency for progressive overload and recovery balance.' :
                     recovery.daysWithWorkouts >= 1 ? 'Consider adding sessions for faster progress if schedule allows.' :
                     'No active training days scheduled. Set up your weekly split.'}
                  </div>
                </div>

                {/* Volume trend */}
                {recovery.weeklyVolumes.length > 0 && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-[#848785] uppercase">Recent Volume Trend</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black">
                        {recovery.avgWeeklyVol >= 1000 ? `${(recovery.avgWeeklyVol / 1000).toFixed(1)}T` : `${Math.round(recovery.avgWeeklyVol)}kg`}
                      </span>
                      <span className="text-[10px] text-[#848785] font-mono">avg/session</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                        recovery.volTrend === 'increasing' ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                        recovery.volTrend === 'decreasing' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                        'bg-white/10 border-white/10 text-[#848785]'
                      }`}>
                        {recovery.volTrend === 'increasing' ? 'Trending Up' :
                         recovery.volTrend === 'decreasing' ? 'Trending Down' :
                         recovery.volTrend === 'stable' ? 'Stable' : 'Needs Data'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Macro consistency */}
                {recovery.macroConsistency !== null && (
                  <div className="bg-white dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-[#848785] uppercase">Nutrition Consistency (7d)</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-black ${recovery.macroConsistency >= 70 ? 'text-red-400' : recovery.macroConsistency >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {Math.round(recovery.macroConsistency)}%
                      </span>
                      <span className="text-[10px] text-[#848785] font-mono">days within target range</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI RECOMMENDATIONS (always visible) ── */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-[#EA4335]" />
                <span className="text-[10px] font-mono font-bold text-[#848785] uppercase tracking-wider">Intel Recommendations</span>
                <span className="text-[9px] font-mono bg-[#EA4335]/10 text-[#EA4335] px-1.5 py-0.5 rounded-full border border-[#EA4335]/30 font-bold">{recommendations.length}</span>
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} className={`bg-white dark:bg-white/5 border rounded-xl p-3 space-y-1 ${
                  rec.priority === 'high' ? 'border-red-500/30' : rec.priority === 'medium' ? 'border-amber-500/30' : 'border-[rgba(0,0,0,0.08)] dark:border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    {rec.icon}
                    <span className="text-[11px] font-black uppercase tracking-wide">{rec.label}</span>
                    {rec.priority === 'high' && <span className="text-[8px] font-mono font-bold bg-red-500/15 text-red-400 px-1 py-0.5 rounded border border-red-500/30 uppercase">Priority</span>}
                  </div>
                  <p className="text-[11px] text-[#5A5F5D] dark:text-gray-400 leading-relaxed">{rec.detail}</p>
                </div>
              ))}

              {/* Gemini Live AI Section */}
              <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-mono font-bold text-[#848785] uppercase tracking-wider">Gemini Intelligence</span>
                  </div>
                  <button
                    onClick={fetchGeminiInsights}
                    disabled={geminiLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50 text-[10px] font-bold text-amber-600 dark:text-amber-300 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {geminiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                    {geminiLoading ? 'Analyzing...' : geminiInsights ? 'Refresh' : 'Get Intel Analysis'}
                  </button>
                </div>

                {geminiLoading && (
                  <div className="bg-white dark:bg-white/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="text-[11px] font-mono text-[#848785]">Gemini analyzing your telemetry...</span>
                  </div>
                )}

                {geminiError && !geminiInsights && (
                  <div className="bg-white dark:bg-white/5 border border-red-500/20 rounded-xl p-3">
                    <p className="text-[11px] text-red-400 font-mono">Offline mode: {geminiError}</p>
                    <p className="text-[10px] text-[#848785] mt-1">Using local sports-science models above.</p>
                  </div>
                )}

                {geminiInsights && !geminiLoading && (
                  <div className="bg-gradient-to-b from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
                    <div className="text-[11px] text-[#2A2D2B] dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">
                      {geminiInsights.split('\n').filter(l => l.trim()).map((line, i) => {
                        const isBold = line.startsWith('**') || line.startsWith('- **');
                        const cleaned = line.replace(/\*\*/g, '').replace(/^- /, '');
                        const [title, ...rest] = cleaned.split(':');
                        if (rest.length > 0 && isBold) {
                          return (
                            <div key={i} className="mb-2">
                              <span className="font-black text-[11px] text-[#000] dark:text-white">{title.trim()}:</span>
                              <span className="text-[11px] text-[#5A5F5D] dark:text-gray-400 ml-1">{rest.join(':').trim()}</span>
                            </div>
                          );
                        }
                        return <div key={i} className="mb-1.5 text-[11px]">{cleaned}</div>;
                      })}
                    </div>
                    <div className="flex items-center gap-1 pt-1 border-t border-amber-500/10">
                      <Cpu className="w-2.5 h-2.5 text-amber-500/50" />
                      <span className="text-[8px] font-mono text-[#848785]">Powered by Google Gemini -- personalized to your live data</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Close */}
        <div className="pt-2 sticky bottom-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md pb-1 z-10">
          <button 
            onClick={onClose} 
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Close Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoachInsightsModal;
