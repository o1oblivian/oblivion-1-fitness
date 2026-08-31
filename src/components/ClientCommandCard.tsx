import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ClipboardList,
  History,
  MessageCircle,
  StickyNote,
  Share2,
  Send,
  Flame,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Calendar,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Check,
  ShieldCheck,
  Lock,
  Loader2,
  Clock,
  Brain,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  Shield,
  Sparkles,
  Crown,
} from 'lucide-react';
import type { AthleteData } from '@/types';
import { getAthleteTelemetryByCoachLog } from '@/data/athleteTelemetry';
import { fetchLiveTelemetry } from '@/utils/telemetryStore';
import { supabase } from '@/utils/supabase';

type TabId = 'log' | 'history' | 'chat' | 'comment' | 'share';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'log', label: 'Log', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { id: 'comment', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { id: 'share', label: 'Share', icon: <Share2 className="w-3.5 h-3.5" /> },
];

interface ChatMessage { id: string; from: 'coach' | 'athlete'; text: string; time: string; }
interface CoachNote { id: string; text: string; date: string; }

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-5 h-5" />, bg: 'bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45]' },
  { id: 'twitter', label: 'X (Twitter)', icon: <Twitter className="w-5 h-5" />, bg: 'bg-[#000000]' },
  { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-5 h-5" />, bg: 'bg-[#1877F2]' },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, bg: 'bg-[#0A66C2]' },
  { id: 'link', label: 'Copy Link', icon: <Link2 className="w-5 h-5" />, bg: 'bg-gray-600' },
];

// Mini sparkline SVG for exercise progression
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 28;
  const pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={parseFloat(points[points.length - 1].split(',')[0])}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// Intel Insights data generator
function generateInsights(telemetry: any, athleteName: string) {
  const sessions = telemetry?.sessions ?? [];
  const completedSessions = sessions.filter((s: any) => s.completed);
  const avgRPE = completedSessions.length > 0
    ? completedSessions.reduce((sum: number, s: any) => sum + (s.avgRPE || 0), 0) / completedSessions.length
    : 0;
  const totalVolume = completedSessions.reduce((sum: number, s: any) => sum + (s.totalVolume || 0), 0);
  const highRPESessions = completedSessions.filter((s: any) => s.avgRPE >= 8.5).length;
  const recoveryScore = telemetry?.recoveryScore ?? 80;
  const compliance = telemetry?.compliance ?? { trainingAdherence: 80, nutritionAdherence: 80 };
  const macros = telemetry?.macroHistory ?? [];
  const proteinDays = macros.filter((m: any) => m.protein < m.proteinTarget).length;

  const overtrainingRisk = highRPESessions >= 4 ? 'HIGH' : highRPESessions >= 2 ? 'MODERATE' : 'LOW';
  const overtrainingColor = overtrainingRisk === 'HIGH' ? '#EA4335' : overtrainingRisk === 'MODERATE' ? '#FBBC05' : '#34A853';

  // Find plateau exercises
  const plateauExercises: string[] = [];
  if (telemetry?.exerciseProgress) {
    Object.entries(telemetry.exerciseProgress).forEach(([name, data]: [string, any]) => {
      if (data.length >= 4) {
        const recent = data.slice(-3);
        const allSameWeight = recent.every((d: any) => d.topWeight === recent[0].topWeight);
        if (allSameWeight) plateauExercises.push(name);
      }
    });
  }

  return {
    overtrainingRisk,
    overtrainingColor,
    avgRPE: avgRPE.toFixed(1),
    highRPESessions,
    totalVolume: totalVolume.toFixed(1),
    recoveryScore,
    plateauExercises,
    proteinDeficitDays: proteinDays,
    nutritionAdherence: compliance.nutritionAdherence,
    trainingAdherence: compliance.trainingAdherence,
    deloadRecommended: highRPESessions >= 4 || recoveryScore < 65,
    periodizationNote: recoveryScore >= 85
      ? `${athleteName} is primed for progressive overload. Increase top sets by 2.5% this block.`
      : recoveryScore >= 70
      ? `Recovery trending flat. Maintain current loads and focus on sleep quality and hydration.`
      : `Recovery below threshold. Recommend a strategic deload week before next progression.`,
    injuryFlags: avgRPE >= 8.8
      ? [`Sustained high RPE (${avgRPE.toFixed(1)}) across ${highRPESessions} sessions raises connective tissue fatigue risk`]
      : [],
    nutritionInsight: proteinDays >= 3
      ? `Protein intake below target on ${proteinDays}/7 days. Correlating with slower recovery. Recommend adding a post-workout shake on deficit days.`
      : `Nutrition tracking is solid. Protein target hit on most days -- maintain current strategy.`,
    programmingSuggestion: plateauExercises.length > 0
      ? `${plateauExercises.join(', ')} ${plateauExercises.length > 1 ? 'have' : 'has'} stalled for 3+ weeks. Prescribe tempo variation (3-1-1-0) or drop sets to break through.`
      : `No plateau detected. Current programming is driving consistent progression across all tracked lifts.`,
  };
}

interface ClientCommandCardProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteData | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onBuildWorkout?: (athlete: AthleteData) => void;
}

export const ClientCommandCard: React.FC<ClientCommandCardProps> = ({
  isOpen,
  onClose,
  athlete,
  showToast,
  onBuildWorkout,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('log');
  const [closing, setClosing] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);

  // Expandable states
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Intel Insights
  const [insightsUnlocked, setInsightsUnlocked] = useState(false);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Coach notes
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [noteInput, setNoteInput] = useState('');

  // Share state
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentCode, setConsentCode] = useState('');
  const [consentRequestId, setConsentRequestId] = useState<string | null>(null);
  const [consentSending, setConsentSending] = useState(false);
  const [consentPolling, setConsentPolling] = useState(false);
  const [shareItems, setShareItems] = useState<Record<string, boolean>>({ prs: true, volume: true, transformation: false, macros: false });
  const [sharedTo, setSharedTo] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !athlete) return;
    setActiveTab('log');
    setClosing(false);
    setSharedTo(null);
    setConsentGranted(false);
    setConsentCode('');
    setConsentRequestId(null);
    setConsentSending(false);
    setConsentPolling(false);
    setExpandedExercise(null);
    setExpandedSession(null);
    setShowInsightsPanel(false);

    const local = getAthleteTelemetryByCoachLog(athlete.name);
    setTelemetry(local);
    let cancelled = false;
    fetchLiveTelemetry(athlete.name).then((live) => {
      if (!cancelled) setTelemetry(live);
    });

    setChatMessages([
      { id: '1', from: 'athlete', text: 'Hey coach, feeling strong today. Ready for the pull session!', time: '9:14 AM' },
      { id: '2', from: 'coach', text: 'Great to hear! Focus on the 3s eccentric on every lat movement. Push hard.', time: '9:16 AM' },
      { id: '3', from: 'athlete', text: 'Got it. Should I increase weight on deadlifts this week?', time: '9:18 AM' },
    ]);
    setNotes([
      { id: '1', text: 'Watch left shoulder mobility -- slight impingement pattern noted', date: 'Aug 16' },
      { id: '2', text: 'Increase protein target to 2.2g/kg next block', date: 'Aug 14' },
    ]);

    return () => { cancelled = true; };
  }, [isOpen, athlete]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), from: 'coach', text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }]);
    setChatInput('');
    showToast('Message sent', 'success');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    setNotes(prev => [{ id: Date.now().toString(), text: noteInput.trim(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }, ...prev]);
    setNoteInput('');
    showToast('Note saved', 'success');
  };

  const handleRequestConsent = async () => {
    if (!athlete) return;
    setConsentSending(true);
    const code = String(Math.floor(100 + Math.random() * 900));
    setConsentCode(code);
    const clientEmail = `${athlete.name.toLowerCase().replace(/\s+/g, '.')}@o1fc.app`;
    try {
      const { data, error } = await supabase.from('share_consent_requests').insert({
        coach_email: 'coach@o1fc.app',
        client_email: clientEmail,
        client_name: athlete.name,
        share_type: Object.entries(shareItems).filter(([,v]) => v).map(([k]) => k).join(', ') || 'progress',
        share_description: `Sharing selected data for ${athlete.name}`,
        otp_code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select('id').maybeSingle();
      if (error) throw error;
      if (data) setConsentRequestId(data.id);
      showToast(`3-digit consent code sent to ${athlete.name}`);
    } catch {
      showToast('Failed to send consent request', 'error');
      setConsentCode('');
    } finally {
      setConsentSending(false);
    }
  };

  const pollConsentStatus = useCallback(async () => {
    if (!consentRequestId) return;
    try {
      const { data } = await supabase
        .from('share_consent_requests')
        .select('status')
        .eq('id', consentRequestId)
        .maybeSingle();
      if (data?.status === 'approved') {
        setConsentGranted(true);
        setConsentPolling(false);
        showToast(`${athlete?.name} approved sharing!`);
      } else if (data?.status === 'denied') {
        setConsentPolling(false);
        setConsentCode('');
        setConsentRequestId(null);
        showToast(`${athlete?.name} denied the share request`, 'error');
      }
    } catch { /* silent retry */ }
  }, [consentRequestId, athlete?.name, showToast]);

  useEffect(() => {
    if (!consentRequestId || consentGranted) return;
    setConsentPolling(true);
    const interval = setInterval(pollConsentStatus, 3000);
    return () => { clearInterval(interval); setConsentPolling(false); };
  }, [consentRequestId, consentGranted, pollConsentStatus]);

  const handleShare = (platformId: string) => {
    if (!consentGranted) { showToast('Client consent required before sharing', 'error'); return; }
    setSharedTo(platformId);
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    showToast(`Progress shared to ${platform?.label}`, 'success');
  };

  if (!isOpen || !athlete) return null;

  const recoveryScore = telemetry?.recoveryScore ?? 85;
  const recoveryColor = recoveryScore >= 85 ? '#3B7A57' : recoveryScore >= 70 ? '#B8860B' : '#C05050';
  const completedSessions = telemetry?.sessions?.filter((s: any) => s.completed).length ?? 0;
  const totalTonnage = telemetry?.sessions?.reduce((sum: number, s: any) => sum + s.totalVolume, 0) ?? 0;
  const insights = telemetry ? generateInsights(telemetry, athlete.name) : null;

  const todaySession = telemetry?.sessions?.[0];
  const todayExercises = todaySession?.exercises ?? [];

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-[#F2F2F7] dark:bg-[#12141A] text-zinc-900 dark:text-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-white/10 shadow-2xl max-h-[92vh] flex flex-col transition-transform duration-300 ${closing ? 'translate-y-full sm:scale-95' : 'translate-y-0 sm:scale-100'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Header */}
        <div className="shrink-0 px-5 pt-5 pb-3">
          {/* Identity Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img src={athlete.avatar} alt={athlete.name} className="w-14 h-14 rounded-full object-cover border-[3px] shadow-sm" style={{ borderColor: recoveryColor }} />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#12141A] flex items-center justify-center" style={{ backgroundColor: recoveryColor }}>
                  <span className="text-[7px] font-black text-white">{recoveryScore}</span>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight truncate">{athlete.name}</h2>
                <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{athlete.handle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onBuildWorkout && (
                <button onClick={() => { onBuildWorkout(athlete); handleClose(); }} className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white/10 hover:bg-zinc-800 dark:hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs">
                  <Dumbbell className="w-3.5 h-3.5" /> Build
                </button>
              )}
              <button onClick={handleClose} className="btn-nude-close" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Recovery', value: `${recoveryScore}%`, color: recoveryColor },
              { label: 'Sessions', value: `${completedSessions}/7`, isDynamic: true },
              { label: 'Tonnage', value: `${totalTonnage.toFixed(0)}`, isDynamic: true },
              { label: 'PRs', value: `${telemetry?.prs?.length ?? 0}`, color: '#EA4335' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-white/[0.04] rounded-xl p-2 text-center border border-neutral-200 dark:border-white/10 shadow-xs">
                <div className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{s.label}</div>
                <div className={`text-sm font-black tabular-nums ${s.isDynamic ? 'text-zinc-900 dark:text-white' : ''}`} style={s.color ? { color: s.color } : undefined}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Intel Insights Strip */}
          {insights && (
            <div
              className={`mb-3 rounded-xl border overflow-hidden transition-all duration-300 shadow-xs ${
                insightsUnlocked
                  ? 'bg-white dark:bg-white/[0.04] border-neutral-200 dark:border-white/15'
                  : 'bg-white dark:bg-white/[0.02] border-neutral-200 dark:border-white/10'
              }`}
            >
              <button
                onClick={() => {
                  if (!insightsUnlocked) {
                    setInsightsUnlocked(true);
                    showToast('Coach Intelligence Pro activated', 'success');
                  } else {
                    setShowInsightsPanel(!showInsightsPanel);
                  }
                }}
                className="w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer group hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${insightsUnlocked ? 'bg-zinc-900 text-white dark:bg-white/20 dark:border dark:border-white/20' : 'bg-neutral-100 dark:bg-white/10'}`}>
                    {insightsUnlocked ? <Brain className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Coach Intelligence Pro</span>
                      {!insightsUnlocked && (
                        <span className="text-[8px] font-bold bg-neutral-100 dark:bg-white/10 text-zinc-700 dark:text-white px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-white/10 uppercase">$9.99/mo</span>
                      )}
                    </div>
                    {insightsUnlocked ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded`} style={{ color: insights.overtrainingColor, backgroundColor: `${insights.overtrainingColor}20` }}>
                          OT Risk: {insights.overtrainingRisk}
                        </span>
                        {insights.plateauExercises.length > 0 && (
                          <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {insights.plateauExercises.length} Plateau{insights.plateauExercises.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {insights.deloadRecommended && (
                          <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Deload</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Deep Intel insights for all your clients -- <span className="blur-[3px] select-none">2 plateau risks, overtraining alert</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  {insightsUnlocked ? (
                    <ChevronDown className={`w-4 h-4 text-zinc-700 dark:text-white transition-transform duration-200 ${showInsightsPanel ? 'rotate-180' : ''}`} />
                  ) : (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </button>

              {/* Expanded Insights Panel */}
              {insightsUnlocked && showInsightsPanel && (
                <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-neutral-200 dark:border-white/10 pt-2.5 animate-fadeIn">
                  {/* Overtraining Risk */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${insights.overtrainingColor}20` }}>
                      <AlertTriangle className="w-3 h-3" style={{ color: insights.overtrainingColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-white">Overtraining Risk</span>
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase" style={{ color: insights.overtrainingColor, backgroundColor: `${insights.overtrainingColor}20` }}>{insights.overtrainingRisk}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                        Avg RPE {insights.avgRPE} across {insights.highRPESessions} high-intensity sessions. {insights.highRPESessions >= 3 ? 'Volume accumulation may exceed recovery capacity.' : 'Intensity is well managed.'}
                      </p>
                    </div>
                  </div>

                  {/* Plateau Detection */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Target className="w-3 h-3 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-zinc-900 dark:text-white">Plateau Detection</span>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">{insights.programmingSuggestion}</p>
                    </div>
                  </div>

                  {/* Periodization */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Activity className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-zinc-900 dark:text-white">Periodization Timing</span>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">{insights.periodizationNote}</p>
                    </div>
                  </div>

                  {/* Injury Risk */}
                  {insights.injuryFlags.length > 0 && (
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                      <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
                        <Shield className="w-3 h-3 text-red-600 dark:text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Injury Risk Alert</span>
                        {insights.injuryFlags.map((flag: string, i: number) => (
                          <p key={i} className="text-[10px] text-red-700 dark:text-red-300/80 leading-relaxed mt-0.5">{flag}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutrition-Performance Link */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-zinc-900 dark:text-white">Nutrition-Performance Link</span>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">{insights.nutritionInsight}</p>
                    </div>
                  </div>

                  {/* Compliance Meters */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Training', value: insights.trainingAdherence, color: '#0284C7' },
                      { label: 'Nutrition', value: insights.nutritionAdherence, color: '#34A853' },
                    ].map((m, i) => (
                      <div key={i} className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">{m.label}</span>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: m.color }}>{m.value}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.value}%`, backgroundColor: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex gap-0.5 p-0.5 rounded-xl bg-neutral-200/60 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setExpandedExercise(null); setExpandedSession(null); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-xs border border-neutral-200/70 dark:border-white/10'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">

          {/* LOG TAB -- Clickable Exercises */}
          {activeTab === 'log' && (
            <div className="space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Today's Workout Log</span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">{todayExercises.length} exercises</span>
              </div>
              {todayExercises.map((ex: any, idx: number) => {
                const isExpanded = expandedExercise === idx;
                const progressData = telemetry?.exerciseProgress?.[ex.name];
                const e1rmData = progressData?.map((p: any) => p.estimated1RM) ?? [];
                const topSet = ex.sets?.reduce((best: any, s: any) => (s.weight > (best?.weight ?? 0) ? s : best), null);
                const totalExVolume = ex.sets?.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0) ?? 0;

                return (
                  <div key={idx} className="rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 overflow-hidden transition-all shadow-xs">
                    {/* Exercise Row -- Clickable */}
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                          {idx + 1}
                        </span>
                        {ex.isPR && <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-500 shrink-0" />}
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{ex.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {ex.sets?.length ?? 0}x{topSet?.reps ?? 0} @ {topSet?.weight ?? 0}kg
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2.5 border-t border-neutral-200 dark:border-white/10 pt-2.5">
                        {/* Sets Table */}
                        <div className="bg-neutral-50 dark:bg-white/[0.03] rounded-lg border border-neutral-200 dark:border-white/5 overflow-hidden">
                          <div className="grid grid-cols-12 text-[8px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold px-2.5 py-1.5 border-b border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-white/[0.02]">
                            <span className="col-span-2">Set</span>
                            <span className="col-span-3 text-center">Weight</span>
                            <span className="col-span-3 text-center">Reps</span>
                            <span className="col-span-2 text-center">RPE</span>
                            <span className="col-span-2 text-right">Vol</span>
                          </div>
                          {(ex.sets ?? []).map((s: any, si: number) => (
                            <div key={si} className="grid grid-cols-12 items-center px-2.5 py-1.5 text-[10px] font-mono border-b border-neutral-100 dark:border-white/[0.03] last:border-0">
                              <span className="col-span-2 font-bold text-amber-600 dark:text-amber-400">{si + 1}</span>
                              <span className="col-span-3 text-center font-bold text-zinc-900 dark:text-white tabular-nums">{s.weight}kg</span>
                              <span className="col-span-3 text-center text-zinc-600 dark:text-zinc-300 tabular-nums">{s.reps}</span>
                              <span className="col-span-2 text-center" style={{ color: s.rpe >= 9 ? '#EA4335' : s.rpe >= 8 ? '#FBBC05' : '#34A853' }}>
                                {s.rpe?.toFixed(1)}
                              </span>
                              <span className="col-span-2 text-right text-zinc-500 dark:text-zinc-400 tabular-nums">{(s.weight * s.reps).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="grid grid-cols-12 items-center px-2.5 py-1.5 text-[10px] font-mono bg-neutral-100/50 dark:bg-white/[0.02] font-bold border-t border-neutral-200 dark:border-white/5">
                            <span className="col-span-2 text-zinc-500 dark:text-zinc-400">Total</span>
                            <span className="col-span-6"></span>
                            <span className="col-span-4 text-right text-zinc-900 dark:text-white tabular-nums">{totalExVolume.toLocaleString()} kg</span>
                          </div>
                        </div>

                        {/* Progression Sparkline */}
                        {e1rmData.length > 1 && (
                          <div className="flex items-center justify-between bg-neutral-50 dark:bg-white/[0.03] rounded-lg border border-neutral-200 dark:border-white/5 px-3 py-2">
                            <div>
                              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Est. 1RM Trend (8 Weeks)</span>
                              <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{e1rmData[e1rmData.length - 1]}kg</span>
                              {e1rmData.length >= 2 && (
                                <span className="text-[9px] font-bold text-red-600 dark:text-red-500 ml-1.5">+{e1rmData[e1rmData.length - 1] - e1rmData[0]}kg</span>
                              )}
                            </div>
                            <MiniSparkline data={e1rmData} color="#0284C7" />
                          </div>
                        )}

                        {/* Video badge */}
                        {ex.hasVideo && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/15">
                            <span className="w-5 h-5 rounded-md bg-red-500/15 flex items-center justify-center">
                              <Zap className="w-3 h-3 text-red-600 dark:text-red-500" />
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400">Form Check Video -- {ex.videoDuration}</span>
                          </div>
                        )}

                        {/* PR badge */}
                        {ex.isPR && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/15">
                            <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                            <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400">NEW PR +{ex.prDelta}kg</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* PRs Summary */}
              {telemetry?.prs?.length > 0 && (
                <div className="bg-red-500/10 dark:bg-red-500/10 rounded-xl border border-red-500/20 p-3 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                    <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Personal Records</span>
                  </div>
                  {telemetry.prs.map((pr: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-red-500/10 last:border-0">
                      <span className="font-bold text-zinc-800 dark:text-white">{pr.exercise}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-red-600 dark:text-red-500 tabular-nums">{pr.weight}kg</span>
                        <span className="text-[9px] font-bold text-red-700 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">+{pr.delta}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB -- Clickable Sessions */}
          {activeTab === 'history' && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">7-Day Training History</span>
              {(telemetry?.sessions ?? []).map((s: any, i: number) => {
                const isExpanded = expandedSession === i;
                return (
                  <div key={s?.id ?? i} className="rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 overflow-hidden transition-all shadow-xs">
                    {/* Session Row -- Clickable */}
                    <button
                      onClick={() => s.completed && setExpandedSession(isExpanded ? null : i)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${s.completed ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/[0.06]' : 'cursor-default'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.completed ? 'bg-neutral-100 dark:bg-white/10 text-zinc-700 dark:text-white' : 'bg-neutral-100/50 dark:bg-white/5 text-zinc-400'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{s.title}</div>
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                          {s.completed ? `${s.totalVolume} MT -- RPE ${s.avgRPE?.toFixed(1)} -- ${s.duration}` : 'Rest Day'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.completed && s.exercises?.some((e: any) => e.isPR) && <Flame className="w-3 h-3 text-red-600 dark:text-red-500" />}
                        <span className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400">{s.dateLabel}</span>
                        {s.completed && <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
                      </div>
                    </button>

                    {/* Expanded Session Breakdown */}
                    {isExpanded && s.completed && (
                      <div className="px-3 pb-3 space-y-2 border-t border-neutral-200 dark:border-white/10 pt-2.5">
                        {/* Previous session comparison */}
                        {i > 0 && (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                            <TrendingUp className="w-3 h-3" />
                            {(() => {
                              const prevSimilar = (telemetry?.sessions ?? []).slice(i + 1).find((ps: any) => ps.completed);
                              if (!prevSimilar) return <span>First session of this type</span>;
                              const volDelta = s.totalVolume - prevSimilar.totalVolume;
                              return (
                                <span>
                                  vs previous: <span className={volDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                                    {volDelta >= 0 ? '+' : ''}{volDelta.toFixed(1)} MT
                                  </span> volume change
                                </span>
                              );
                            })()}
                          </div>
                        )}

                        {(s.exercises ?? []).map((ex: any, exIdx: number) => (
                          <div key={exIdx} className="bg-neutral-50 dark:bg-white/[0.03] rounded-lg border border-neutral-200 dark:border-white/5 p-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {ex.isPR && <Flame className="w-3 h-3 text-red-600 dark:text-red-500 shrink-0" />}
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">{ex.name}</span>
                              </div>
                              {ex.hasVideo && (
                                <span className="text-[8px] font-mono font-bold text-red-700 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">{ex.videoDuration}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(ex.sets ?? []).map((set: any, si: number) => (
                                <span key={si} className="text-[9px] font-mono bg-white dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md border border-neutral-200 dark:border-white/5 shadow-2xs">
                                  {set.weight > 0 ? `${set.weight}kg` : 'BW'} x {set.reps} <span className="text-zinc-400 dark:text-zinc-500" style={{ color: set.rpe >= 9 ? '#EA4335' : undefined }}>@{set.rpe}</span>
                                </span>
                              ))}
                            </div>
                            {ex.isPR && (
                              <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-500 mt-1.5 block">PR +{ex.prDelta}kg</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Volume Trend */}
              <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-neutral-200 dark:border-white/10 p-3 mt-3 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Weekly Volume Trend</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {(telemetry?.sessions ?? []).map((s: any, i: number) => {
                    const maxVol = Math.max(...(telemetry?.sessions ?? []).map((ss: any) => ss.totalVolume || 0), 1);
                    const pct = (s.totalVolume || 0) / maxVol;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct * 100, 4)}%`, backgroundColor: s.completed ? '#EA4335' : 'rgba(120,120,120,0.15)' }} />
                        <span className="text-[7px] font-mono text-zinc-500 dark:text-zinc-400">{s.dateLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex flex-col pt-3 min-h-[300px]">
              <div className="flex-1 space-y-3 mb-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'coach' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                      msg.from === 'coach'
                        ? 'bg-zinc-900 text-white dark:bg-white/15 dark:text-white rounded-br-md border border-zinc-900 dark:border-white/15 shadow-xs'
                        : 'bg-white text-zinc-900 dark:bg-white/[0.06] dark:text-white rounded-bl-md border border-neutral-200 dark:border-white/10 shadow-xs'
                    }`}>
                      <p className="text-[12px] leading-relaxed">{msg.text}</p>
                      <span className={`text-[8px] font-mono mt-1 block ${msg.from === 'coach' ? 'text-zinc-300 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 sticky bottom-0 bg-[#F2F2F7] dark:bg-[#12141A] pt-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type a message..."
                  className="flex-1 bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-2xs" />
                <button onClick={handleSendChat} className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white/15 hover:bg-zinc-800 dark:hover:bg-white/25 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 border border-zinc-900 dark:border-white/15 shadow-xs">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'comment' && (
            <div className="space-y-3 pt-3">
              <div className="flex gap-2">
                <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} placeholder="Add a private coach note..."
                  className="flex-1 bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500 shadow-2xs" />
                <button onClick={handleAddNote} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs">Save</button>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Coach Notes</span>
              {notes.map(note => (
                <div key={note.id} className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.06] border border-amber-500/20 text-zinc-800 dark:text-zinc-200 shadow-xs">
                  <p className="text-xs leading-relaxed">{note.text}</p>
                  <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-1.5 block">{note.date}</span>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="py-8 text-center">
                  <StickyNote className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No notes yet</p>
                </div>
              )}
            </div>
          )}

          {/* SHARE TAB */}
          {activeTab === 'share' && (
            <div className="space-y-4 pt-3">
              <div className={`p-3.5 rounded-xl border transition-all shadow-xs ${consentGranted ? 'bg-white dark:bg-white/[0.06] border-neutral-200 dark:border-white/20' : consentRequestId ? 'bg-amber-500/[0.08] border-amber-500/30' : 'bg-white dark:bg-white/[0.04] border-neutral-200 dark:border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${consentGranted ? 'bg-zinc-900 text-white dark:bg-white/20 dark:border dark:border-white/20' : consentRequestId ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-white/10'}`}>
                    {consentGranted ? <ShieldCheck className="w-4 h-4 text-white" /> : consentPolling ? <Loader2 className="w-4 h-4 text-zinc-900 dark:text-white animate-spin" /> : <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{consentGranted ? 'Client Consent Granted' : consentRequestId ? 'Awaiting Client Response' : 'Client Consent Required'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{consentGranted ? `${athlete.name} has approved sharing` : consentRequestId ? 'Listening for approval...' : `${athlete.name} must approve before sharing`}</p>
                  </div>
                  {consentGranted && (
                    <div className="w-5 h-5 rounded-md flex items-center justify-center bg-emerald-500 text-white shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                {consentRequestId && !consentGranted && consentCode && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 text-center">
                    <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">3-Digit Consent Code</p>
                    <div className="flex justify-center gap-3">
                      {consentCode.split('').map((d, i) => (
                        <div key={i} className="w-12 h-14 rounded-xl bg-neutral-100 dark:bg-black/40 border-2 border-amber-500/40 flex items-center justify-center shadow-xs">
                          <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{d}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>Expires in 10 minutes</span>
                    </div>
                  </div>
                )}
                {!consentRequestId && !consentGranted && (
                  <button
                    onClick={handleRequestConsent}
                    disabled={consentSending}
                    className="mt-3 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white/15 hover:bg-zinc-800 dark:hover:bg-white/25 border border-zinc-900 dark:border-white/20 text-white font-bold text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-xs"
                  >
                    {consentSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Request Consent from {athlete.name.split(' ')[0]}
                  </button>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Select Data to Share</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'prs', label: 'Personal Records', icon: <Flame className="w-3.5 h-3.5" /> },
                    { key: 'volume', label: 'Volume & Stats', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    { key: 'transformation', label: 'Transformation', icon: <Share2 className="w-3.5 h-3.5" /> },
                    { key: 'macros', label: 'Nutrition Data', icon: <ClipboardList className="w-3.5 h-3.5" /> },
                  ].map(item => (
                    <button key={item.key} onClick={() => setShareItems(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs ${shareItems[item.key] ? 'bg-white dark:bg-white/10 border-neutral-300 dark:border-white/20 text-zinc-900 dark:text-white' : 'bg-white/50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 text-zinc-400'}`}>
                      {item.icon}
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Share To</span>
                <div className="space-y-2">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <button key={platform.id} onClick={() => handleShare(platform.id)} disabled={!consentGranted}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] shadow-xs ${!consentGranted ? 'opacity-40 cursor-not-allowed bg-white/40 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5' : sharedTo === platform.id ? 'bg-white dark:bg-white/10 border-neutral-300 dark:border-white/25' : 'bg-white dark:bg-white/[0.04] border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/[0.08]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${platform.bg} flex items-center justify-center text-white shadow-sm`}>{platform.icon}</div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{platform.label}</span>
                      </div>
                      {sharedTo === platform.id ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Check className="w-4 h-4" /><span className="text-[10px] font-bold">Shared</span></div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
