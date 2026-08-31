import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  X,
  Share2,
  Users,
  Shield,
  Activity,
  Video,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Inbox,
  MessageSquare,
  Building2,
  Layers,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/ui/FullScreenModal';
import { ConsentShareModal } from '@/components/ConsentShareModal';
import { ClientCommandCard } from '@/components/ClientCommandCard';
import { fetchEarningsSummary, fetchCoachEarnings, type CoachEarning } from '@/utils/subscriptionStore';
import { ConsultationQueue } from '@/components/ConsultationQueue';
import { AthleteIntelligenceFeed } from '@/components/AthleteIntelligenceFeed';
import { WelcomeCrewCards } from '@/components/WelcomeCrewCards';
import { ProgramCreatorModal } from '@/components/ProgramCreatorModal';
import { CoachEarningsModal } from '@/components/CoachEarningsModal';
import { COACH_CLIENTS } from '@/data/exerciseDatabase';
import type { AthleteData } from '@/types';

interface Submission {
  id: string;
  athleteName: string;
  avatar: string;
  title: string;
  volume: string;
  duration: string;
  status: 'pending' | 'approved';
  exercises: string[];
  hasVideo: boolean;
  videoUrl?: string;
  notes?: string;
}

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    athleteName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'PULL B (Hypertrophy & Grip)',
    volume: '14,200 LBS',
    duration: '52 MIN',
    status: 'pending',
    exercises: ['Barbell Deadlift (4x6 @ 140kg)', 'Lat Pulldowns (3x12 @ 75kg)', 'Incline DB Curls (3x12 @ 18kg)'],
    hasVideo: true,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-the-gym-40504-large.mp4',
    notes: 'Felt slight fatigue on the 4th set of deadlifts. Kept form tight.',
  },
  {
    id: 'sub-2',
    athleteName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    title: 'PUSH A (Overhead Strength)',
    volume: '9,850 LBS',
    duration: '44 MIN',
    status: 'approved',
    exercises: ['Overhead Press (4x5 @ 45kg)', 'Incline Bench (3x8 @ 55kg)', 'Lateral Raises (4x15 @ 10kg)'],
    hasVideo: false,
    notes: 'Hit a new PR on OHP 45kg! Felt solid.',
  },
  {
    id: 'sub-3',
    athleteName: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'LEGS HYPERTROPHY',
    volume: '18,400 LBS',
    duration: '58 MIN',
    status: 'pending',
    exercises: ['Barbell Back Squat (4x8 @ 120kg)', 'Romanian Deadlifts (3x10 @ 100kg)', 'Walking Lunges (3x20)'],
    hasVideo: true,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-the-gym-40504-large.mp4',
    notes: 'Depth checked on set 3 video. Ready for coach sign-off.',
  },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Apple Health-Grade Smooth 7-day sparkline generator
function renderMiniSparkline(data: number[], readinessScore: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 22;

  // Generate smooth cubic bezier SVG path
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (w - 6) + 3,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));

  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const lastPt = pts[pts.length - 1];
  const isHigh = readinessScore >= 88;
  const isMed = readinessScore >= 75 && readinessScore < 88;
  const strokeColor = isHigh ? '#34A853' : isMed ? '#C48B4F' : '#EA4335';

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="2.5"
        fill={strokeColor}
      />
    </svg>
  );
}

export const CoachHubView: React.FC<{
  onOpen1MinBuilder?: () => void;
  onOpenVault?: () => void;
  onViewRoster?: () => void;
  coachEmail?: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}> = ({ onOpen1MinBuilder, onOpenVault, onViewRoster, coachEmail = 'coach@o1fc.app', showToast = () => {} }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [activeVideo, setActiveVideo] = useState<Submission | null>(null);
  const [shareTarget, setShareTarget] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'earnings' | 'consultations' | 'intelligence'>('intelligence');
  const [commandCardAthlete, setCommandCardAthlete] = useState<AthleteData | null>(null);
  const [showProgramCreator, setShowProgramCreator] = useState(false);
  
  // Modals
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Filter for Roster Strip
  const [rosterFilter, setRosterFilter] = useState<'all' | 'review' | 'live' | 'pr'>('all');
  const [isRosterExpanded, setIsRosterExpanded] = useState(true);

  const [earningsSummary, setEarningsSummary] = useState({ totalEarned: 142000, pendingPayout: 38500, totalPaid: 103500, salesCount: 14 });
  const [recentEarnings, setRecentEarnings] = useState<CoachEarning[]>([]);
  const [showAllEarnings, setShowAllEarnings] = useState(false);

  useEffect(() => {
    (async () => {
      const [summary, earnings] = await Promise.all([fetchEarningsSummary(), fetchCoachEarnings()]);
      if (summary.totalEarned > 0) {
        setEarningsSummary(summary);
      }
      setRecentEarnings(earnings);
    })();
  }, [activeTab]);

  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'approved' } : sub))
    );
    showToast('Workout verified & signed by Head Coach', 'success');
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const clientList = Object.values(COACH_CLIENTS);

  const filteredClients = clientList.filter((client) => {
    if (rosterFilter === 'review') return client.status === 'PENDING' || client.badge?.includes('PENDING');
    if (rosterFilter === 'pr') return client.badge?.includes('PR');
    return true;
  });

  const filteredSubmissions = submissions.filter((sub) => {
    if (rosterFilter === 'review') return sub.status === 'pending';
    if (rosterFilter === 'pr') return sub.notes?.toLowerCase().includes('pr') || sub.title.includes('PR');
    return true;
  });

  return (
    <div className="w-full bg-transparent text-zinc-900 dark:text-white p-1 sm:p-2 space-y-2.5 pb-3">
      {/* ── Unified Mission Control Card ── */}
      <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl space-y-3 text-zinc-900 dark:text-white">
        
        {/* Top Meta: Pulse Status & Live Telemetry Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30] dark:bg-[#FF453A]" />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF3B30] dark:text-[#FF453A] uppercase">
              {clientList.length} Athletes Active
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Title, Subtitle & Vault Action */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              <span>Athlete Performance Center</span>
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
              Real-time telemetry, 1-tap rapid dispatch & coaching signals
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500/10 dark:bg-red-500/15 hover:bg-red-500/20 text-[#FF3B30] dark:text-[#FF453A] transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Vault</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-zinc-200/80 dark:bg-white/10 -mx-3.5 sm:-mx-4" />

        {/* ── Tactical Command Dock ── */}
        <div className="space-y-2">
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] dark:bg-[#FF453A]" />
              <span>Tactical Command Dock</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">Core Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowProgramCreator(true)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-900 dark:text-white transition-all active:scale-[0.98] cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-[#FF3B30] dark:text-[#FF453A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Program</div>
                <div className="text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 truncate">Dispatch & Edit</div>
              </div>
            </button>

            <button
              onClick={onOpen1MinBuilder}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-900 dark:text-white transition-all active:scale-[0.98] cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Studio Engine</div>
                <div className="text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 truncate">Fast Builder</div>
              </div>
            </button>
          </div>
        </div>

        {/* Hub Switcher Rail */}
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04]">
          {[
            { key: 'intelligence' as const, label: 'INTEL', badge: null },
            { key: 'submissions' as const, label: 'INBOX', badge: pendingCount > 0 ? pendingCount : null },
            { key: 'consultations' as const, label: 'CONSULTS', badge: null },
            { key: 'earnings' as const, label: 'EARNINGS', badge: null },
          ].map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-[#FF3B30] dark:bg-[#FF453A] text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/5'
                }`}
              >
                <span>{t.label}</span>
                {t.badge !== null && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white text-[#FF3B30]'
                      : 'bg-[#FF3B30] dark:bg-[#FF453A] text-white'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {activeTab === 'intelligence' ? (
        <div className="space-y-2.5">
          {/* Athlete Micro-Telemetry Command Grid — Apple Pro Inset Grouped Collapsible */}
          <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3 text-zinc-900 dark:text-white shadow-sm dark:shadow-xl transition-all">
            {/* Collapsible Header */}
            <div
              onClick={() => setIsRosterExpanded((prev) => !prev)}
              className={`flex items-center justify-between gap-2 flex-wrap cursor-pointer select-none group/header ${
                isRosterExpanded ? 'pb-2 border-b border-zinc-100 dark:border-white/5' : ''
              }`}
              role="button"
              tabIndex={0}
              aria-expanded={isRosterExpanded}
              title={isRosterExpanded ? 'Collapse Active Roster' : 'Expand Active Roster'}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-800 dark:text-white group-hover/header:bg-zinc-200 dark:group-hover/header:bg-white/20 transition-colors">
                  <Activity className="w-3.5 h-3.5 text-zinc-700 dark:text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Active Roster Telemetry</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                    {filteredClients.length}
                  </span>
                </div>
              </div>

              {/* Right Controls: Filter Pills (when expanded) or Summary Avatars (when collapsed) + Rotating Chevron */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {isRosterExpanded ? (
                  /* Segmented Filter Pills */
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-0.5 rounded-lg border border-zinc-200/80 dark:border-white/10">
                    {(['all', 'review', 'pr'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRosterFilter(filter)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          rosterFilter === filter
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter === 'review' ? 'Needs Review' : 'PRs'}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Collapsed Quick Summary Preview */
                  <div
                    onClick={() => setIsRosterExpanded(true)}
                    className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-mono cursor-pointer"
                  >
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {clientList.slice(0, 4).map((c) => (
                        <div
                          key={c.key}
                          className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#12141A] bg-zinc-200 dark:bg-white/20 text-[8px] font-bold flex items-center justify-center text-zinc-800 dark:text-white shrink-0"
                        >
                          {c.name[0]}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono hidden sm:inline">
                      {clientList.length} athletes
                    </span>
                  </div>
                )}

                {/* Apple Standard Collapse/Expand Toggle Chevron */}
                <button
                  onClick={() => setIsRosterExpanded((prev) => !prev)}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-zinc-600 dark:text-zinc-300"
                  aria-label={isRosterExpanded ? 'Collapse Active Roster' : 'Expand Active Roster'}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isRosterExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Collapsible Animated Container */}
            <AnimatePresence initial={false}>
              {isRosterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  {/* Apple Inset Grouped Roster Cell List */}
                  <div className="divide-y divide-stone-100 dark:divide-white/5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-black/30 overflow-hidden">
                    {filteredClients.map((client, idx) => {
                      const sparkData = idx === 0 ? [12, 14, 13, 16, 15, 18, 19] : idx === 1 ? [8, 9, 8, 10, 11, 10, 12] : idx === 2 ? [15, 16, 18, 17, 19, 21, 22] : idx === 3 ? [11, 12, 14, 13, 16, 17, 18] : [10, 11, 13, 12, 14, 15, 16];
                      const readinessScore = idx === 0 ? 92 : idx === 1 ? 78 : idx === 2 ? 88 : idx === 3 ? 91 : 85;
                      const initials = client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      const isPending = client.status === 'PENDING' || client.badge?.includes('PENDING');
                      const isPR = client.badge?.includes('PR');

                      return (
                        <div
                          key={client.key}
                          onClick={() => setCommandCardAthlete(client)}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] active:scale-[0.995] transition-all cursor-pointer group"
                          role="button"
                          tabIndex={0}
                          title="Tap to open Command Card & Telemetry"
                        >
                          {/* Left: Avatar + Identity + Submetrics */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar with Status Pip */}
                            <div className="relative shrink-0">
                              {client.avatar && (client.avatar.startsWith('http') || client.avatar.startsWith('/')) ? (
                                <img
                                  src={client.avatar}
                                  alt={client.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-zinc-200/80 dark:border-white/10 shrink-0 bg-zinc-100 dark:bg-white/5"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/15 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-white shrink-0 ${
                                  client.avatar && (client.avatar.startsWith('http') || client.avatar.startsWith('/')) ? 'hidden' : 'flex'
                                }`}
                              >
                                {initials}
                              </div>
                              {/* Live status dot */}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#12141A] ${
                                  isPending ? 'bg-[#C48B4F]' : 'bg-[#34A853]'
                                }`}
                              />
                            </div>

                            {/* Name, Handle, Badge & Volume */}
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#EA4335] dark:group-hover:text-[#EA4335] transition-colors">
                                  {client.name}
                                </h4>
                                {client.badge && (
                                  <span
                                    className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                                      isPending
                                        ? 'bg-[#C48B4F]/10 text-[#C48B4F] border-[#C48B4F]/25'
                                        : isPR
                                        ? 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/25'
                                        : 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/25'
                                    }`}
                                  >
                                    {client.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                                {client.handle} <span className="opacity-40">•</span> {client.volume}
                              </p>
                            </div>
                          </div>

                          {/* Right: Sparkline, Readiness Pill & Apple Disclosure Chevron */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Sparkline & Readiness Pill */}
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                                  readinessScore >= 88
                                    ? 'border-[#34A853]/30 text-[#34A853] bg-[#34A853]/10'
                                    : readinessScore >= 75
                                    ? 'border-[#C48B4F]/30 text-[#C48B4F] bg-[#C48B4F]/10'
                                    : 'border-[#EA4335]/30 text-[#EA4335] bg-[#EA4335]/10'
                                }`}
                              >
                                {readinessScore}% READY
                              </span>
                              {renderMiniSparkline(sparkData, readinessScore)}
                            </div>

                            {/* Disclosure Chevron */}
                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/5 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 flex items-center justify-center transition-colors">
                              <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredClients.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          No athletes matching this filter.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Athlete Intelligence Feed */}
          <AthleteIntelligenceFeed showToast={showToast} />
        </div>
      ) : activeTab === 'consultations' ? (
        <ConsultationQueue coachEmail={coachEmail} showToast={showToast} />
      ) : activeTab === 'earnings' ? (
        <div className="space-y-4 text-zinc-900 dark:text-white">
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Gross Volume', value: formatCents(earningsSummary.totalEarned), icon: <TrendingUp className="w-4 h-4 text-zinc-900 dark:text-white" />, iconBg: 'bg-zinc-100 dark:bg-white/10' },
              { label: 'Pending Payout', value: formatCents(earningsSummary.pendingPayout), icon: <Clock className="w-4 h-4 text-zinc-900 dark:text-white" />, iconBg: 'bg-zinc-100 dark:bg-white/10' },
              { label: 'Total Paid Out', value: formatCents(earningsSummary.totalPaid), icon: <DollarSign className="w-4 h-4 text-zinc-900 dark:text-white" />, iconBg: 'bg-zinc-100 dark:bg-white/10' },
              { label: 'Platform Margin', value: '5% (Pro Tier)', icon: <Shield className="w-4 h-4 text-zinc-900 dark:text-white" />, iconBg: 'bg-zinc-100 dark:bg-white/10' },
            ].map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Payout Rails Configuration Card */}
          <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 text-zinc-900 dark:text-white shadow-sm dark:shadow-xl">
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span>Payouts & Direct Deposit</span>
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                Direct bank settlement, transfer schedule, and verified deposit account.
              </p>
            </div>
            <button
              onClick={() => setShowEarningsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-mono font-bold text-xs shrink-0 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Manage Payouts
            </button>
          </div>

          {/* Recent Sales History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Recent Client Transactions
              </span>
              {recentEarnings.length > 5 && (
                <button
                  onClick={() => setShowAllEarnings(!showAllEarnings)}
                  className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer flex items-center gap-0.5"
                >
                  {showAllEarnings ? 'Show Less' : 'View All'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAllEarnings ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {recentEarnings.length === 0 ? (
              <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-6 text-center text-zinc-900 dark:text-white shadow-sm">
                <DollarSign className="w-8 h-8 text-stone-400 dark:text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-900 dark:text-white">14 Client Subscriptions Active</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                  Gross volume of {formatCents(earningsSummary.totalEarned)} is accruing on your 5% Pro plan.
                </p>
              </div>
            ) : (
              (showAllEarnings ? recentEarnings : recentEarnings.slice(0, 5)).map((earning) => (
                <div
                  key={earning.id}
                  className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-xl p-3 flex items-center justify-between text-zinc-900 dark:text-white shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{earning.program_title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {earning.buyer_email} -- {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
                      +{formatCents(earning.coach_payout_cents)}
                    </p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300`}>
                      {earning.payout_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Submissions Queue */}
          <div className="space-y-3 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wider">Workout Submissions & Review Queue</span>
              {pendingCount > 0 && (
                <span className="bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-white border border-zinc-300 dark:border-white/20 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                  {pendingCount} Pending Review
                </span>
              )}
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-8 text-center text-zinc-900 dark:text-white shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-stone-400 dark:text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-900 dark:text-white">No submissions pending</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                  All athlete workout logs are up to date and verified.
                </p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-[#12141A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm dark:shadow-xl text-zinc-900 dark:text-white"
              >
                <div className="flex items-start gap-3">
                  {sub.avatar ? (
                    <img
                      src={sub.avatar}
                      alt={sub.athleteName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/20 shrink-0 flex items-center justify-center text-sm font-bold text-zinc-800 dark:text-white">
                      {sub.athleteName[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight truncate">{sub.athleteName}</h3>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold truncate">{sub.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {sub.duration} &middot; {sub.volume}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShareTarget(sub); }}
                      className="btn-nude-close !p-1.5"
                      title="Share client progress"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <span
                      className="shrink-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-1"
                    >
                      {sub.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {sub.exercises.map((ex, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono"
                    >
                      {ex}{i < sub.exercises.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>

                {sub.hasVideo && (
                  <button
                    onClick={() => setActiveVideo(sub)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-current text-zinc-900 dark:text-white" />
                      Form Check Video Attached
                    </span>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-300 underline font-mono">Watch Form</span>
                  </button>
                )}

                {sub.notes && (
                  <div className="p-2 text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                    &ldquo;{sub.notes}&rdquo;
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10">
                  {sub.status === 'pending' ? (
                    <button
                      onClick={() => handleApprove(sub.id)}
                      className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      1-Tap Head Coach Approval
                    </button>
                  ) : (
                    <div className="w-full py-1.5 text-zinc-500 dark:text-zinc-400 font-medium text-xs text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Session Verified & Synced to Athlete Record
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <CoachEarningsModal
        isOpen={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
      />

      {/* Consent Share Modal */}
      <ConsentShareModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        submission={shareTarget}
        coachEmail={coachEmail}
        showToast={showToast}
      />

      {/* Client Command Card */}
      <ClientCommandCard
        isOpen={!!commandCardAthlete}
        onClose={() => setCommandCardAthlete(null)}
        athlete={commandCardAthlete}
        showToast={showToast}
        onBuildWorkout={() => {
          setCommandCardAthlete(null);
          onOpen1MinBuilder?.();
        }}
      />

      {/* Program Creator */}
      <ProgramCreatorModal
        isOpen={showProgramCreator}
        onClose={() => setShowProgramCreator(false)}
        coachEmail={coachEmail}
        showToast={showToast}
      />

      {/* Video Player Modal */}
      {activeVideo && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-white dark:bg-[#12141A] border border-neutral-200 dark:border-white/10 rounded-3xl p-4 max-w-sm w-full space-y-3 text-zinc-900 dark:text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Form Check: {activeVideo.athleteName}
              </h4>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <video
              src={activeVideo.videoUrl}
              controls
              autoPlay
              className="w-full rounded-2xl aspect-video bg-black object-cover"
            />
            {activeVideo.notes && (
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300 italic bg-neutral-50 dark:bg-white/5 p-2.5 rounded-xl border border-neutral-200 dark:border-white/5">
                &ldquo;{activeVideo.notes}&rdquo;
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CoachHubView;
