import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Dumbbell,
  Flame,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MessageCircle,
  AlertCircle,
  Trophy,
  TrendingUp,
  Lightbulb,
  Moon,
  Zap,
  Activity,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

interface AthleteInsight {
  id: string;
  athleteName: string;
  avatar: string;
  type: 'alert' | 'milestone' | 'trend' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  metric?: { label: string; value: string; delta: string; direction: 'up' | 'down' | 'flat' };
  actionLabel?: string;
  timestamp: string;
  category: 'recovery' | 'training' | 'nutrition' | 'performance';
}

const DEFAULT_MOCK_INSIGHTS: AthleteInsight[] = [
  // ── RECOVERY ──
  {
    id: 'rec-1',
    athleteName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'alert',
    priority: 'high',
    title: 'ACWR Acute Workload Spike (1.58)',
    body: 'Marcus has accumulated 18,450 kg mechanical volume across 48 hours without deload. ACWR has surged to 1.58, indicating high neuromuscular fatigue and increased tendon strain risk. Recommend substituting heavy secondary sets with Zone 2 active recovery.',
    metric: { label: 'Acute:Chronic Ratio', value: '1.58', delta: '+0.38 above optimal', direction: 'up' },
    actionLabel: 'Prescribe deload protocol',
    timestamp: '25m ago',
    category: 'recovery',
  },
  {
    id: 'rec-2',
    athleteName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80',
    type: 'trend',
    priority: 'medium',
    title: 'CNS Recovery Index: 78%',
    body: 'Resting readiness dropped 12% following consecutive high-intensity sprint intervals and heavy squats. Allow a full 48–72h recovery window before the next maximum velocity session.',
    metric: { label: 'CNS Readiness', value: '78%', delta: '-12% 48h trend', direction: 'down' },
    actionLabel: 'Adjust rest intervals',
    timestamp: '2h ago',
    category: 'recovery',
  },

  // ── TRAINING ──
  {
    id: 'train-1',
    athleteName: 'Liam Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'suggestion',
    priority: 'medium',
    title: 'Bench Press Sticking Point Detection',
    body: 'Barbell Flat Bench velocity slows significantly 2 inches off the chest during top sets at 140kg. Recommend incorporating 3-second pause pin presses and Larsen presses to strengthen the mid-range transition.',
    metric: { label: 'Top Set Tonnage', value: '140kg x 3', delta: 'Plateau (3 wks)', direction: 'flat' },
    actionLabel: 'Dispatch pin press routine',
    timestamp: '1h ago',
    category: 'training',
  },
  {
    id: 'train-2',
    athleteName: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    type: 'trend',
    priority: 'low',
    title: 'Training Compliance: 100% (6-Week Streak)',
    body: 'Sarah has logged 24/24 scheduled compound sessions on time with an optimal average RPE of 8.2. Hypertrophy volume progression is on target.',
    metric: { label: 'Weekly Adherence', value: '100%', delta: '6 Wk Streak', direction: 'up' },
    actionLabel: 'Send acknowledgement',
    timestamp: '4h ago',
    category: 'training',
  },

  // ── NUTRITION ──
  {
    id: 'nut-1',
    athleteName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80',
    type: 'alert',
    priority: 'high',
    title: 'Protein Intake Below Optimal Threshold (1.3 g/kg)',
    body: 'Elena logged 98g of protein on a 14,200kg heavy leg training day. To optimize muscle protein synthesis and tissue remodeling, minimum target is 140g (2.0 g/kg).',
    metric: { label: 'Protein Logged', value: '98g / 140g', delta: '-42g deficit', direction: 'down' },
    actionLabel: 'Send Fuel OS nutrition reminder',
    timestamp: '3h ago',
    category: 'nutrition',
  },
  {
    id: 'nut-2',
    athleteName: 'David Okafor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    type: 'suggestion',
    priority: 'medium',
    title: 'Post-Workout Glycogen Replenishment',
    body: 'Carbohydrate intake was 45g below prescribed target following a 90-minute high-output training block. Suggest increasing intra-workout or post-workout complex carbs.',
    metric: { label: 'Daily Carbs', value: '225g / 270g', delta: '-45g', direction: 'down' },
    actionLabel: 'Review macro split',
    timestamp: '5h ago',
    category: 'nutrition',
  },

  // ── PERFORMANCE ──
  {
    id: 'perf-1',
    athleteName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'milestone',
    priority: 'medium',
    title: 'New PR Milestone: Bench Press 142.5kg',
    body: 'Marcus hit 142.5kg x 3 reps on Barbell Bench Press, establishing a new personal record (+5.0kg). Calculated Estimated 1RM increased to 154kg.',
    metric: { label: 'Estimated 1RM', value: '154.0kg', delta: '+5.0kg PR', direction: 'up' },
    actionLabel: 'Congratulate & update 1RM',
    timestamp: '45m ago',
    category: 'performance',
  },
  {
    id: 'perf-2',
    athleteName: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    type: 'milestone',
    priority: 'medium',
    title: 'New PR Milestone: Back Squat 135kg x 5',
    body: 'Sarah surpassed her previous 5RM baseline with 135kg x 5 reps at RPE 8.5. Bar speed remained consistent across all working sets.',
    metric: { label: 'Squat 5RM', value: '135.0kg', delta: '+7.5kg PR', direction: 'up' },
    actionLabel: 'Acknowledge milestone',
    timestamp: '1h ago',
    category: 'performance',
  },
];

const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }> = {
  alert: { bg: 'bg-[#C4121A]/10 dark:bg-[#D91F28]/10', border: 'border-[#C4121A]/30 dark:border-[#D91F28]/30', color: '#C4121A', icon: AlertCircle, label: 'ALERT' },
  milestone: { bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30', color: '#3B82F6', icon: Trophy, label: 'MILESTONE' },
  trend: { bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/30', color: '#10B981', icon: TrendingUp, label: 'TREND' },
  suggestion: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', color: '#F59E0B', icon: Lightbulb, label: 'COACHING CUE' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

import { useCoachRosterStore } from '@/utils/coachRosterStore';

export const AthleteIntelligenceFeed: React.FC<{
  showToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ showToast }) => {
  const [categoryFilter, setCategoryFilter] = useState<'recovery' | 'training' | 'nutrition' | 'performance'>('recovery');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { isDemoMode } = useCoachRosterStore();
  const [realInsights, setRealInsights] = useState<AthleteInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const coachEmail = typeof window !== 'undefined'
    ? localStorage.getItem('o1fc_user_email') || localStorage.getItem('lumina_user_email') || ''
    : '';

  useEffect(() => {
    if (!isSupabaseConfigured() || !coachEmail) {
      setLoading(false);
      return;
    }
    loadRealData();
  }, [coachEmail]);

  async function loadRealData() {
    try {
      const generatedInsights: AthleteInsight[] = [];

      // Fetch recent completed sessions for PR detection
      const { data: sessions } = await supabase
        .from('completed_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const exercises = (session.exercises as any[]) || [];
          for (const ex of exercises) {
            if (ex.isPR || ex.is_pr) {
              generatedInsights.push({
                id: `pr_${session.id}_${ex.name}`,
                athleteName: session.athlete_name || session.user_email?.split('@')[0] || 'Client',
                avatar: '',
                type: 'milestone',
                priority: 'medium',
                title: `New PR: ${ex.name}`,
                body: `Hit a personal record on ${ex.name}. ${ex.prDelta ? `+${ex.prDelta}kg improvement.` : ''}`,
                metric: ex.sets?.[0]
                  ? {
                      label: ex.name,
                      value: `${ex.sets[0].weight}kg x ${ex.sets[0].reps}`,
                      delta: ex.prDelta ? `+${ex.prDelta}kg` : 'PR',
                      direction: 'up',
                    }
                  : undefined,
                actionLabel: 'Celebrate & adjust program',
                timestamp: timeAgo(session.created_at),
                category: 'performance',
              });
            }
          }
        }
      }

      // Fetch recent nutrition logs for adherence tracking
      const { data: macros } = await supabase
        .from('daily_macros')
        .select('*')
        .order('log_date', { ascending: false })
        .limit(14);

      if (macros && macros.length > 0) {
        const recentLogs = macros.slice(0, 7);
        const avgProtein = recentLogs.reduce((sum, m) => sum + (m.protein || 0), 0) / recentLogs.length;
        if (avgProtein > 0 && avgProtein < 100) {
          generatedInsights.push({
            id: 'nutrition_low_protein',
            athleteName: macros[0].user_email?.split('@')[0] || 'Client',
            avatar: '',
            type: 'trend',
            priority: 'medium',
            title: 'Protein intake below target',
            body: `Averaging ${Math.round(avgProtein)}g protein over the last 7 logged days. Consider checking in about meal planning.`,
            metric: { label: 'Avg Protein', value: `${Math.round(avgProtein)}g`, delta: 'Below target', direction: 'down' },
            actionLabel: 'Check in about nutrition',
            timestamp: timeAgo(macros[0].log_date || macros[0].created_at),
            category: 'nutrition',
          });
        }
      }

      if (generatedInsights.length > 0) {
        setRealInsights(generatedInsights);
      }
    } catch (e) {
      console.warn('Intelligence feed load error:', e);
    }
  }

  const activeInsights = useMemo(() => {
    if (realInsights.length > 0) return realInsights;
    if (isDemoMode) return DEFAULT_MOCK_INSIGHTS;
    return [];
  }, [realInsights, isDemoMode]);

  const filteredInsights = useMemo(() => {
    return activeInsights
      .filter((ins) => !dismissed.has(ins.id))
      .filter((ins) => ins.category === categoryFilter)
      .sort((a, b) => {
        const prio = { high: 0, medium: 1, low: 2 };
        return prio[a.priority] - prio[b.priority];
      });
  }, [activeInsights, categoryFilter, dismissed]);

  const alertCount = activeInsights.filter((i) => i.type === 'alert' && !dismissed.has(i.id)).length;

  const handleAction = (insight: AthleteInsight) => {
    showToast(`Action transmitted to ${insight.athleteName}`, 'success');
    setDismissed((prev) => new Set(prev).add(insight.id));
  };

  const CATEGORIES = [
    { key: 'recovery' as const, label: 'Recovery', icon: Moon, color: '#8B5CF6', count: activeInsights.filter(i => i.category === 'recovery' && !dismissed.has(i.id)).length },
    { key: 'training' as const, label: 'Training', icon: Dumbbell, color: '#C4121A', count: activeInsights.filter(i => i.category === 'training' && !dismissed.has(i.id)).length },
    { key: 'nutrition' as const, label: 'Nutrition', icon: Utensils, color: '#F59E0B', count: activeInsights.filter(i => i.category === 'nutrition' && !dismissed.has(i.id)).length },
    { key: 'performance' as const, label: 'Performance', icon: Trophy, color: '#3B82F6', count: activeInsights.filter(i => i.category === 'performance' && !dismissed.has(i.id)).length },
  ];

  return (
    <div className="space-y-2.5 text-zinc-900 dark:text-white">
      {/* ── Intelligence Header & Category Filters ── */}
      <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl space-y-3 text-zinc-900 dark:text-white">
        
        {/* Top Meta: Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-white animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-600 dark:text-zinc-400 uppercase">
              Athlete Intelligence Signals
            </span>
          </div>
          {alertCount > 0 ? (
            <span className="bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/20 px-2 py-0.5 rounded-md font-bold text-[9px] font-mono">
              {alertCount} Alert{alertCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 font-medium uppercase">
              Live Telemetry
            </span>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          Auto-generated coaching signals & telemetry triggers from client tracking data
        </p>

        {/* Category filters (4 Core Categories: Recovery, Training, Nutrition, Performance) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-black font-bold shadow-xs border border-stone-900 dark:border-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5'
                }`}
              >
                <IconComponent className="w-3 h-3 shrink-0" style={{ color: isActive ? undefined : cat.color }} />
                <span className="truncate">{cat.label}</span>
                {cat.count > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ml-0.5 ${
                    isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-6">
          <div className="w-5 h-5 border-2 border-zinc-300 dark:border-white/30 border-t-stone-800 dark:border-t-white rounded-full animate-spin mx-auto mb-2" />
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Loading client telemetry...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-2.5 text-zinc-900 dark:text-white">
          {filteredInsights.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-5 text-zinc-900 dark:text-white shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-stone-400 dark:text-zinc-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-900 dark:text-white">All Clear</p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {activeInsights.length === 0
                  ? 'Intelligence signals will trigger as your clients log workouts and nutrition'
                  : 'No actionable signals matching current filter'}
              </p>
            </div>
          )}

          {filteredInsights.map((ins) => {
            const style = TYPE_STYLE[ins.type] || TYPE_STYLE.alert;
            return (
              <div
                key={ins.id}
                className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-sm dark:shadow-md transition-all text-zinc-900 dark:text-white"
              >
                {/* Header */}
                <div className="flex items-start gap-2.5">
                  {ins.avatar ? (
                    <img src={ins.avatar} alt={ins.athleteName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-zinc-300 dark:border-white/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-zinc-800 dark:text-white">
                      {ins.athleteName[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{ins.athleteName}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-white" />
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono ml-auto">{ins.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {React.createElement(style.icon, { className: 'w-3 h-3', style: { color: style.color } })}
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: style.color }}>
                        {style.label}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{ins.title}</h4>
                  </div>
                </div>

                {/* Body */}
                <p className="text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{ins.body}</p>

                {/* Metric chip */}
                {ins.metric && (
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200/80 dark:border-white/5 rounded-xl px-3 py-2">
                    <div>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">{ins.metric.label}</span>
                      <p className="text-sm font-black text-zinc-900 dark:text-white leading-none mt-0.5">{ins.metric.value}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {ins.metric.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />}
                      {ins.metric.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-[#C4121A] dark:text-[#D91F28]" />}
                      {ins.metric.direction === 'flat' && <Minus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-white">
                        {ins.metric.delta}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {ins.actionLabel && (
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => handleAction(ins)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{ins.actionLabel}</span>
                    </button>
                    <button
                      onClick={() => setDismissed((prev) => new Set(prev).add(ins.id))}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer active:scale-[0.98] transition-all border border-zinc-200/80 dark:border-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
