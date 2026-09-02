import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Search,
  MessageSquare,
  Star,
  Clock,
  Users,
  Check,
  X,
  Layers,
  Sparkles,
  Send,
  Zap,
  Award,
  ArrowUpRight,
  Dumbbell,
  Shield,
  ShieldCheck,
  Bookmark,
} from 'lucide-react';
import { getDispatchedWorkouts, DispatchedWorkout } from '@/utils/dispatchStore';
import {
  getMarketplaceCoaches,
  fetchMarketplaceCoaches,
  addCoachReview,
  CoachMarketplaceProfile,
  AthleteReview,
} from '@/utils/coachMarketplaceStore';
import { subscribeToRealtimeTable } from '@/utils/supabase';

interface AthleteCoachPortalProps {
  currentUserEmail?: string;
  userName?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onSwitchToWorkout?: () => void;
  onOpenPayPlan?: (tier?: string) => void;
  onOpenShowroom?: (coachEmail: string, coachName: string) => void;
  onOpenConsultation?: (coach: CoachMarketplaceProfile) => void;
  onSwitchToCoachMode?: () => void;
  isCoachUnlocked?: boolean;
}

const COACH_SPECIALTY_FILTERS = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'hypertrophy', label: 'Hypertrophy & Mass' },
  { id: 'hyrox', label: 'HYROX & Engine' },
  { id: 'strength', label: 'Strength & Power' },
  { id: 'biomechanics', label: 'Biomechanics & Longevity' },
];

const CURATED_COACH_PROGRAMS = [
  {
    id: 'prog-hyp-12',
    title: '12-Week Hypertrophy OS Pro',
    coachName: 'Marcus Vance',
    coachAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    category: 'Hypertrophy',
    duration: '12 Weeks',
    sessionsPerWeek: '5 Sessions / Wk',
    price: '$89',
    rating: 4.98,
    reviews: 142,
    enrolledCount: 318,
    difficulty: 'Intermediate / Advanced',
    coverUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    description: 'High-volume progressive overload protocol engineered for dense contractile mass, lengthened partials, and mechanical tension.',
    syllabus: [
      { phase: 'Phase 1 (Wks 1-4)', focus: 'Mechanical Tension & Base Volume Accumulation', split: 'Upper / Lower / Rest / Push / Pull' },
      { phase: 'Phase 2 (Wks 5-8)', focus: 'Lengthened Partials & Density Overload', split: 'Chest-Back / Legs / Shoulders-Arms / Lower' },
      { phase: 'Phase 3 (Wks 9-12)', focus: 'Intensification & Peak Hypertrophy Deload', split: 'PPL Undulating Intensity' },
    ],
  },
  {
    id: 'prog-hyrox-8',
    title: 'HYROX Race Ready: Sub-60 Blueprint',
    coachName: 'Sarah Jenkins',
    coachAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    category: 'HYROX & Engine',
    duration: '8 Weeks',
    sessionsPerWeek: '4 Sessions / Wk',
    price: '$69',
    rating: 4.95,
    reviews: 98,
    enrolledCount: 245,
    difficulty: 'Pace Calibrated',
    coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    description: 'Lactate threshold intervals, sled push pacing, SkiErg stamina, and compromised running mechanics.',
    syllabus: [
      { phase: 'Phase 1 (Wks 1-3)', focus: 'Zone 2 Aerobic Base & Sled Mechanics', split: 'Run Aerobic / Sled Volume / Erg Sprints / Hybrid' },
      { phase: 'Phase 2 (Wks 4-6)', focus: 'Compromised Running Simulation', split: 'Race Pacing 1K Loops + Stations' },
      { phase: 'Phase 3 (Wks 7-8)', focus: 'Taper & 100% Station Speed Efficiency', split: 'Full Simulation Test' },
    ],
  },
  {
    id: 'prog-power-10',
    title: 'Iron Peak: Squat & Deadlift Specialization',
    coachName: 'David Chen',
    coachAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    category: 'Strength & Power',
    duration: '10 Weeks',
    sessionsPerWeek: '4 Sessions / Wk',
    price: '$79',
    rating: 4.99,
    reviews: 210,
    enrolledCount: 412,
    difficulty: 'Competitive Level',
    coverUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    description: 'RPE autoregulated block periodization designed to peak 1RM squat and deadlift with clinical joint longevity.',
    syllabus: [
      { phase: 'Phase 1 (Wks 1-4)', focus: 'Hypertrophy & Pause Movement Economy', split: 'Squat Heavy / Bench RPE / Deadlift Pause / Accessories' },
      { phase: 'Phase 2 (Wks 5-8)', focus: 'Singles Priming & Heavy Overload', split: 'Squat 1RM Priming / Speed Work / Heavy Pulls' },
      { phase: 'Phase 3 (Wks 9-10)', focus: 'Deload & Meet-Day 1RM Peak', split: 'Taper & Max Force Production' },
    ],
  },
];

type DetailScreen =
  | { type: 'reviews'; coach: CoachMarketplaceProfile }
  | { type: 'hire'; coach: CoachMarketplaceProfile }
  | { type: 'program'; program: typeof CURATED_COACH_PROGRAMS[0] }
  | null;

export const AthleteCoachPortal: React.FC<AthleteCoachPortalProps> = ({
  currentUserEmail = 'athlete@o1fc.app',
  userName = 'Athlete',
  showToast,
  onSwitchToWorkout,
  onOpenPayPlan,
  onOpenShowroom,
  onOpenConsultation,
  onSwitchToCoachMode,
  isCoachUnlocked = false,
}) => {
  // Main Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'coaches' | 'reviews' | 'programs'>('coaches');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [dispatches, setDispatches] = useState<DispatchedWorkout[]>([]);
  const [coachesList, setCoachesList] = useState<CoachMarketplaceProfile[]>(() => getMarketplaceCoaches());
  const [isLoadingCoaches, setIsLoadingCoaches] = useState<boolean>(false);

  // Review Submission State
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewProgram, setReviewProgram] = useState<string>('1:1 Coaching');
  const [reviewPrGain, setReviewPrGain] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Straight On-Screen Detail View (Zero Popups)
  const [activeDetail, setActiveDetail] = useState<DetailScreen>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('Hypertrophy Mass');

  // Load real dispatches & Supabase marketplace coaches
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoadingCoaches(true);
      try {
        const [allDispatches, liveCoaches] = await Promise.all([
          getDispatchedWorkouts(),
          fetchMarketplaceCoaches(),
        ]);
        if (!cancelled) {
          setDispatches(allDispatches);
          if (liveCoaches && liveCoaches.length > 0) {
            setCoachesList(liveCoaches);
          }
        }
      } catch (e) {
        console.warn('Marketplace fetch note:', e);
      } finally {
        if (!cancelled) {
          setIsLoadingCoaches(false);
        }
      }
    };

    loadData();

    // Supabase Realtime Subscription for Coach Marketplace Updates
    const coachChannel = subscribeToRealtimeTable('coach_profiles', () => {
      fetchMarketplaceCoaches().then((data) => {
        if (!cancelled && data) setCoachesList(data);
      });
    });

    const reviewsChannel = subscribeToRealtimeTable('coach_reviews', () => {
      fetchMarketplaceCoaches().then((data) => {
        if (!cancelled && data) setCoachesList(data);
      });
    });

    return () => {
      cancelled = true;
      if (coachChannel) coachChannel.unsubscribe();
      if (reviewsChannel) reviewsChannel.unsubscribe();
    };
  }, [currentUserEmail]);

  const coaches = coachesList;
  const activeQuery = searchQuery.trim().toLowerCase();

  const filteredCoaches = useMemo(() => {
    let list = coaches;
    if (selectedSpecialty !== 'all') {
      list = list.filter(
        (c) =>
          c.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
          c.bio.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
          c.tags?.some((t) => t.toLowerCase().includes(selectedSpecialty.toLowerCase()))
      );
    }
    if (activeQuery) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(activeQuery) ||
          c.specialty.toLowerCase().includes(activeQuery) ||
          c.bio.toLowerCase().includes(activeQuery) ||
          c.tags?.some((t) => t.toLowerCase().includes(activeQuery)) ||
          c.certifications?.some((cert) => cert.toLowerCase().includes(activeQuery))
      );
    }
    return list;
  }, [coaches, selectedSpecialty, activeQuery]);

  const latestDispatch = dispatches.length > 0 ? dispatches[0] : null;

  // ─────────────────────────────────────────────────────────────
  // 1. STRAIGHT ON-SCREEN: COACH REVIEWS & OUTCOMES DOSSIER
  // ─────────────────────────────────────────────────────────────
  if (activeDetail?.type === 'reviews') {
    const coach = activeDetail.coach;
    return (
      <div className="w-full max-w-md mx-auto space-y-2.5 tab-enter pb-2">
        {/* Top Back Action */}
        <div className="flex items-center justify-between pb-0.5">
          <button
            type="button"
            onClick={() => setActiveDetail(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Coaches</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Coach Dossier
          </span>
        </div>

        {/* Coach Summary Header Card */}
        <div className="bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl p-3.5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px]">
              <img
                src={coach.avatar}
                alt={coach.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl object-cover border border-black/5 dark:border-white/10 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121214] flex items-center justify-center text-white shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      Coach {coach.name}
                    </h2>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-[9px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                      {coach.badge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                    {coach.specialty}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono block">
                    {coach.monthlyRate}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium block">
                    1:1 Telemetry
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{coach.athletesCount}</strong> Athletes
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{coach.rating}</strong> ({coach.reviewsCount})
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {coach.responseTime || '< 1h'}
                </span>
              </div>
            </div>
          </div>

          {/* Credentials & Philosophy */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono block">
              Philosophy & Method
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {coach.bio}
            </p>
            {coach.certifications && coach.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {coach.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 text-[10px] font-mono font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Direct Action Switch to 1:1 Hire */}
          <button
            type="button"
            onClick={() => setActiveDetail({ type: 'hire', coach })}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shadow-red-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Retain Coach {coach.name.split(' ')[0]} ({coach.monthlyRate})</span>
          </button>
        </div>

        {/* Verified Athlete Outcomes Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
              Verified Athlete Outcomes ({coach.reviews?.length || 0})
            </h3>
            <button
              type="button"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-[10.5px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{showReviewForm ? 'Cancel Review' : '+ Leave Review'}</span>
            </button>
          </div>

          {/* Inline Review Form */}
          {showReviewForm && (
            <div className="rounded-2xl border border-red-500/20 bg-white dark:bg-[#121214] p-3.5 shadow-sm space-y-3 tab-enter">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Submit Verified Outcome</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="cursor-pointer text-amber-500 p-0.5"
                    >
                      <Star className={`w-4 h-4 ${s <= reviewRating ? 'fill-amber-500' : 'text-zinc-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono block mb-1">
                    Program / Protocol Completed
                  </label>
                  <input
                    type="text"
                    value={reviewProgram}
                    onChange={(e) => setReviewProgram(e.target.value)}
                    placeholder="e.g. 1:1 Elite Coaching or Hypertrophy OS"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono block mb-1">
                    PR Progression / Result (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewPrGain}
                    onChange={(e) => setReviewPrGain(e.target.value)}
                    placeholder="e.g. +30 lbs Squat PR, -8 lbs Fat Loss"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono block mb-1">
                    Athlete Feedback & Review
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience, form video coaching speed, and results..."
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  onClick={async () => {
                    if (!reviewComment.trim()) return;
                    setIsSubmittingReview(true);
                    try {
                      await addCoachReview(coach.id, {
                        athleteName: userName || 'Verified Athlete',
                        rating: reviewRating,
                        programName: reviewProgram || '1:1 Coaching',
                        prGain: reviewPrGain.trim() || undefined,
                        comment: reviewComment.trim(),
                      });
                      showToast('Review verified and published live!', 'success');
                      setReviewComment('');
                      setReviewPrGain('');
                      setShowReviewForm(false);
                      const updated = await fetchMarketplaceCoaches();
                      setCoachesList(updated);
                    } catch (e) {
                      showToast('Error publishing review', 'error');
                    } finally {
                      setIsSubmittingReview(false);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Publishing...' : 'Publish Verified Review'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {coach.reviews?.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121214] p-3.5 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {rev.athleteName}
                      </span>
                      {rev.verified && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          [VERIFIED]
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {rev.programName} • {rev.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>

                {rev.prGain && (
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold inline-flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>PR Progression: {rev.prGain}</span>
                  </div>
                )}

                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  &quot;{rev.comment}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STRAIGHT ON-SCREEN: 1:1 COACHING RETAINER & ENROLLMENT
  // ─────────────────────────────────────────────────────────────
  if (activeDetail?.type === 'hire') {
    const coach = activeDetail.coach;
    return (
      <div className="w-full max-w-md mx-auto space-y-2.5 tab-enter pb-2">
        {/* Top Back Action */}
        <div className="flex items-center justify-between pb-0.5">
          <button
            type="button"
            onClick={() => setActiveDetail(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Coaches</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            1:1 Retainer
          </span>
        </div>

        {/* Coach Header Summary Card */}
        <div className="bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl p-3.5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={coach.avatar}
              alt={coach.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl object-cover border border-black/5 dark:border-white/10 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                1:1 Coaching with {coach.name}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {coach.monthlyRate} • Direct In-App Dispatches & Video Reviews
              </p>
            </div>
          </div>

          {/* 1:1 Deliverables Checklist */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 space-y-2">
            <span className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider font-mono block">
              1:1 Roster Deliverables
            </span>
            <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Personalized workout dispatch directly to Training OS</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Weekly video form checks & RPE load autoregulation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Direct coach messaging & metabolic Fuel OS calibration</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>ACWR fatigue intelligence & injury prevention monitoring</span>
              </div>
            </div>
          </div>

          {/* Select Primary Focus */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block font-mono">
              Select Primary Focus
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Hypertrophy Mass', 'HYROX & Engine', '1RM Strength Peak', 'Injury Rehab & Longevity'].map((goal) => {
                const isSelected = selectedGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setSelectedGoal(goal)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-600 text-white font-bold shadow-xs shadow-red-600/20'
                        : 'border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stripe Checkout Action */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
            <button
              type="button"
              onClick={() => {
                showToast(`Proceeding to checkout for Coach ${coach.name} (${coach.monthlyRate})`, 'success');
                onOpenPayPlan?.('coach_pro');
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shadow-red-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm 1:1 Enrollment ({coach.monthlyRate})</span>
            </button>
            <p className="text-[10px] text-center text-zinc-400 font-medium">
              Secured via Stripe Payments • Cancel or pause anytime in Settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. STRAIGHT ON-SCREEN: PROTOCOL SYLLABUS & DETAILS
  // ─────────────────────────────────────────────────────────────
  if (activeDetail?.type === 'program') {
    const prog = activeDetail.program;
    return (
      <div className="w-full max-w-md mx-auto space-y-2.5 tab-enter pb-2">
        {/* Top Back Action */}
        <div className="flex items-center justify-between pb-0.5">
          <button
            type="button"
            onClick={() => setActiveDetail(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Protocols</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Periodization Blueprint
          </span>
        </div>

        {/* Protocol Hero Card */}
        <div className="bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-32 w-full bg-zinc-900">
            <img
              src={prog.coverUrl}
              alt={prog.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                  {prog.category} • {prog.duration}
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">
                  {prog.title}
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                {prog.price}
              </span>
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {prog.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                <span className="text-zinc-400 block text-[10px]">Frequency</span>
                <strong className="text-zinc-900 dark:text-white font-bold">{prog.sessionsPerWeek}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                <span className="text-zinc-400 block text-[10px]">Head Coach</span>
                <strong className="text-zinc-900 dark:text-white font-bold">{prog.coachName}</strong>
              </div>
            </div>

            {/* Periodization Syllabus Breakdown */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono block">
                Periodization Syllabus
              </span>
              <div className="space-y-2">
                {prog.syllabus?.map((syl, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 space-y-1"
                  >
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      {syl.phase}
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {syl.focus}
                    </p>
                    <p className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                      Split: {syl.split}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Checkout Action */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  showToast(`Opening ${prog.title} preview & checkout`, 'success');
                  onOpenPayPlan?.('premium');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shadow-red-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Acquire Protocol ({prog.price})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MAIN DEFAULT SCREEN (COACHES CATALOG / REVIEWS / PROTOCOLS)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto space-y-2.5 tab-enter pb-2">
      {/* ── TOP DASHBOARD (HERO + SEARCH + FILTERS + SEGMENTED TABS) ── */}
      <div className="w-full bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3.5">
        {/* Top Badges & Become Coach Action */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 text-[10px] font-bold text-red-600 dark:text-red-400 tracking-wider">
              <Shield className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
              <span>ATHLETE CLIENT HUB</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              {coaches.length} Master Coaches Live
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSwitchToCoachMode) {
                onSwitchToCoachMode();
              } else {
                onOpenPayPlan?.('coach_starter');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-zinc-50 dark:bg-[#18181B] text-zinc-900 dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Become Coach</span>
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            Coach Network & Telemetry
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Train under certified IFBB & CSCS strength specialists. Load dispatched sessions directly into Solo Workout mode, track verified PR reviews, and access 1:1 programming.
          </p>
        </div>

        {/* Integrated Search Bar */}
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coaches, disciplines, or credentials..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Refined Category Filter Strip (Red active capsules) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {COACH_SPECIALTY_FILTERS.map((f) => {
            const isActive = selectedSpecialty === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedSpecialty(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-tight shrink-0 transition-all cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600 dark:bg-red-600 dark:text-white dark:border-red-600 shadow-xs shadow-red-600/20'
                    : 'bg-zinc-100 dark:bg-[#18181B] text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Segmented Tab Switcher (Matching Global UI standards) */}
        <div className="pt-1 border-t border-black/5 dark:border-white/5">
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-100 dark:bg-[#18181B] border border-black/[0.04] dark:border-white/5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('coaches')}
              className={`py-2 px-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'coaches'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight text-[11px] sm:text-xs">Certified Specialists</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
              }`}
            >
              <Star className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" />
              <span className="leading-tight text-[11px] sm:text-xs">Live Reviews & PRs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('programs')}
              className={`py-2 px-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'programs'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight text-[11px] sm:text-xs">Curated Curriculums</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Workout Dispatch Prescribed Card ── */}
      {latestDispatch && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-500/20" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
                Prescription from Coach {latestDispatch.coachName}
              </span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                {latestDispatch.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              showToast(`Prescription loaded into Training OS`, 'success');
              if (onSwitchToWorkout) onSwitchToWorkout();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open Session</span>
          </button>
        </div>
      )}

      {/* ── TAB 1: COACHES ROSTER ── */}
      {activeTab === 'coaches' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {filteredCoaches.length} Verified Head Coach{filteredCoaches.length !== 1 ? 'es' : ''}
            </span>
            {selectedSpecialty !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedSpecialty('all')}
                className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {filteredCoaches.length > 0 ? (
            <div className="space-y-2.5">
              {filteredCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121214] p-3.5 shadow-sm space-y-2.5 transition-all hover:border-black/10 dark:hover:border-white/20"
                >
                  {/* Coach Identity Row (Fixed 56px Avatar) */}
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative shrink-0 w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px]">
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl object-cover border border-black/5 dark:border-white/10 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121214] flex items-center justify-center text-white shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {coach.name}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-[9px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                              {coach.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                            {coach.specialty}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono block">
                            {coach.monthlyRate}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium block">
                            1:1 Telemetry
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{coach.athletesCount}</strong> Athletes
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{coach.rating}</strong> ({coach.reviewsCount})
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {coach.responseTime || '< 1h'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                    {coach.bio}
                  </p>

                  {coach.tags && coach.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {coach.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-medium text-zinc-600 dark:text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dual Action Controls - Opens Straight On-Screen (No Modals) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveDetail({ type: 'reviews', coach })}
                      className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1C1C1E] dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-black/5 dark:border-white/10"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Reviews ({coach.reviewsCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDetail({ type: 'hire', coach })}
                      className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-xs shadow-red-600/20 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Retain Coach</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10">
              No verified coaches match your criteria.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ATHLETE REVIEWS FEED ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-2.5">
          <div className="px-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Verified Athlete Outcomes & PR Progression Logs
            </span>
          </div>

          <div className="space-y-2.5">
            {coaches.flatMap((coach) => (coach.reviews || []).map((rev) => ({ rev, coach }))).map(({ rev, coach }) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121214] p-3.5 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={coach.avatar}
                      alt={coach.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl object-cover border border-black/5 dark:border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          {rev.athleteName}
                        </span>
                        {rev.verified && (
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            [VERIFIED]
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Coached by <strong>{coach.name}</strong> • {rev.programName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>

                {rev.prGain && (
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>PR Progression: {rev.prGain}</span>
                  </div>
                )}

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                  &quot;{rev.comment}&quot;
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/5 text-[11px]">
                  <span className="text-zinc-400 font-mono">{rev.date}</span>
                  <button
                    type="button"
                    onClick={() => setActiveDetail({ type: 'hire', coach })}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Retain Coach {coach.name.split(' ')[0]}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: CURATED PROTOCOLS CATALOG ── */}
      {activeTab === 'programs' && (
        <div className="space-y-2.5">
          <div className="px-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Periodization Protocols & Specialized Training Blueprints
            </span>
          </div>

          <div className="space-y-2.5">
            {CURATED_COACH_PROGRAMS.map((prog) => (
              <div
                key={prog.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121214] overflow-hidden shadow-sm flex flex-col"
              >
                <div className="relative h-28 w-full bg-zinc-900">
                  <img
                    src={prog.coverUrl}
                    alt={prog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                        {prog.category} • {prog.duration}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {prog.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-md">
                      {prog.price}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2.5">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10">
                      <span className="text-zinc-400 block text-[10px] font-medium">Frequency</span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{prog.sessionsPerWeek}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-black/5 dark:border-white/10">
                      <span className="text-zinc-400 block text-[10px] font-medium">Head Coach</span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{prog.coachName}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveDetail({ type: 'program', program: prog })}
                      className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1C1C1E] dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold text-center cursor-pointer border border-black/5 dark:border-white/10"
                    >
                      View Syllabus
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        showToast(`Opening ${prog.title} preview & checkout`, 'success');
                        onOpenPayPlan?.('premium');
                      }}
                      className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center cursor-pointer active:scale-[0.98] shadow-xs shadow-red-600/20"
                    >
                      Acquire Protocol
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteCoachPortal;
