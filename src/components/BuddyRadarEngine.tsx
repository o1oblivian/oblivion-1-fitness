import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Sliders, MapPin, Clock, Dumbbell,
  Heart, Shield, Zap, Activity, Ruler, Weight,
  Radio, RefreshCw, Check, Star, Navigation,
  Search, MessageCircle, UserPlus, ChevronLeft,
  Eye, EyeOff, RotateCcw, Send, Sparkles,
  CalendarPlus, Calendar, MapPinned, CheckCircle2, XCircle,
  Compass, Users, Scale, Car, Footprints, ExternalLink,
  SlidersHorizontal, Building2, ArrowLeftRight, LocateFixed, Globe,
  MoreVertical, Lock, AlertTriangle, UserX, Flag, Share2, ShieldAlert,
} from 'lucide-react';
import {
  type BuddyProfile,
  type RadarFilters,
  DEFAULT_FILTERS,
  DISCIPLINES,
  TIME_SLOTS,
  fetchRadarBuddies,
  fetchMyConnections,
  sendFistBump,
  recordBuddySwipe,
  updateMyRadarProfile,
  generateMockBuddies,
} from '@/utils/buddyRadarStore';
import { useSubscription } from '@/utils/useSubscription';

interface BuddyRadarEngineProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
}

const AGE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: 'All', range: [18, 65] },
  { label: '18-24', range: [18, 24] },
  { label: '25-34', range: [25, 34] },
  { label: '35-44', range: [35, 44] },
  { label: '45+', range: [45, 65] },
];

const MY_PROFILE = {
  discipline: 'Hypertrophy',
  preferred_time: 'Evening (4-7 PM)',
  experience_level: 'Intermediate',
  home_gym: 'Iron Works',
};

const ICEBREAKERS = [
  'Hey! Looks like we train at similar times. Want to team up?',
  'Nice discipline focus! Want to swap programs sometime?',
  'I see you train nearby -- fancy a session together?',
  'Your stats are impressive! What does your split look like?',
  'Looking for a spotter on heavy compound lifts. Are you down?',
  'Let us link up for a joint hypertrophy session this week!',
];

const BOOKING_TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
];

function computeMatchPercent(buddy: BuddyProfile): number {
  let score = 0;
  let total = 0;
  total += 30;
  if (buddy.discipline === MY_PROFILE.discipline) score += 30;
  else if (['Powerlifting', 'Bodybuilding'].includes(buddy.discipline) && ['Hypertrophy', 'Powerlifting', 'Bodybuilding'].includes(MY_PROFILE.discipline)) score += 18;
  else score += 6;
  total += 25;
  if (buddy.preferred_time === MY_PROFILE.preferred_time) score += 25;
  else {
    const allTimes = TIME_SLOTS;
    const myIdx = allTimes.indexOf(MY_PROFILE.preferred_time);
    const bIdx = allTimes.indexOf(buddy.preferred_time);
    if (Math.abs(myIdx - bIdx) <= 1) score += 15;
    else score += 4;
  }
  total += 20;
  if (buddy.experience_level === MY_PROFILE.experience_level) score += 20;
  else {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
    const diff = Math.abs(levels.indexOf(buddy.experience_level) - levels.indexOf(MY_PROFILE.experience_level));
    if (diff === 1) score += 12;
    else score += 4;
  }
  total += 15;
  if ((buddy.current_gym || buddy.home_gym) === MY_PROFILE.home_gym) score += 15;
  else score += 3;
  total += 10;
  const dist = buddy.distance_km ?? 50;
  if (dist < 2) score += 10;
  else if (dist < 5) score += 7;
  else if (dist < 15) score += 4;
  else score += 1;
  return Math.round((score / total) * 100);
}

export const BuddyRadarEngine: React.FC<BuddyRadarEngineProps> = ({
  isOpen, onClose, currentUserEmail, showToast, onOpenPayPlan,
}) => {
  const { isPaid } = useSubscription();
  const myLat = -33.8688;
  const myLng = 151.2093;

  const [activeTab, setActiveTab] = useState<'discover' | 'matched'>('discover');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [filters, setFilters] = useState<RadarFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<BuddyProfile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [chatBuddy, setChatBuddy] = useState<BuddyProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bumpedEmails, setBumpedEmails] = useState<Set<string>>(new Set());
  const [likedEmails, setLikedEmails] = useState<Set<string>>(new Set());
  const [dismissedEmails, setDismissedEmails] = useState<Set<string>>(new Set());
  const [dismissingEmail, setDismissingEmail] = useState<string | null>(null);
  const [acceptedEmails, setAcceptedEmails] = useState<Set<string>>(new Set());
  const [blockedEmails, setBlockedEmails] = useState<Set<string>>(new Set());
  const [reportingBuddy, setReportingBuddy] = useState<BuddyProfile | null>(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [ghostMode, setGhostMode] = useState(false);
  const [gymSharing, setGymSharing] = useState(true);
  const [publicTelemetry, setPublicTelemetry] = useState(true);
  const [showUserWeight, setShowUserWeight] = useState(false);
  const [homeGymOnly, setHomeGymOnly] = useState(false);
  const [scanning, setScanning] = useState(false);

  const activeFilterCount = [
    filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65,
    filters.radiusKm !== 25,
    filters.disciplines.length > 0,
    filters.preferredTimes.length > 0,
    homeGymOnly,
  ].filter(Boolean).length;

  const loadData = useCallback(async (showBlockingSpinner = false) => {
    if (showBlockingSpinner) setLoading(true);
    try {
      const [b, c] = await Promise.all([
        fetchRadarBuddies(currentUserEmail, myLat, myLng, filters, 40, isDemoMode),
        fetchMyConnections(currentUserEmail),
      ]);
      setBuddies(b || []);
      const bumpSet = new Set(c.filter(cn => cn.status === 'fist_bumped').map(cn =>
        cn.user_email === currentUserEmail ? cn.buddy_email : cn.user_email
      ));
      setBumpedEmails(bumpSet);
    } catch (e) {
      console.warn('[BuddyRadarEngine] Refresh error:', e);
    } finally {
      if (showBlockingSpinner) setLoading(false);
    }
  }, [currentUserEmail, filters, isDemoMode]);

  useEffect(() => {
    if (isOpen) {
      loadData(false);
    }
  }, [isOpen, loadData]);

  const filteredBuddies = useMemo(() => {
    return buddies
      .filter((b) => {
        if (blockedEmails.has(b.user_email)) return false;
        if (dismissedEmails.has(b.user_email)) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return b.user_name.toLowerCase().includes(q) ||
          b.home_gym.toLowerCase().includes(q) ||
          b.current_gym.toLowerCase().includes(q) ||
          b.discipline.toLowerCase().includes(q);
      })
      .sort((a, b) => computeMatchPercent(b) - computeMatchPercent(a));
  }, [buddies, searchQuery, dismissedEmails, blockedEmails]);

  const matchedBuddies = useMemo(() => {
    return buddies.filter(b => !blockedEmails.has(b.user_email) && (likedEmails.has(b.user_email) || bumpedEmails.has(b.user_email)));
  }, [buddies, likedEmails, bumpedEmails, blockedEmails]);

  const handleFistBump = async (buddy: BuddyProfile) => {
    const ok = await sendFistBump(currentUserEmail, buddy.user_email);
    if (ok) {
      setBumpedEmails(prev => new Set([...prev, buddy.user_email]));
      showToast(`Fist bump sent to ${buddy.user_name}!`, 'success');
    }
  };

  const handleLike = (buddy: BuddyProfile) => {
    recordBuddySwipe(currentUserEmail, buddy.user_email, 'like');
    setLikedEmails(prev => {
      const next = new Set(prev);
      if (next.has(buddy.user_email)) {
        next.delete(buddy.user_email);
      } else {
        next.add(buddy.user_email);
        const isMutual = Math.random() > 0.35;
        if (isMutual) {
          showToast(`Matched with ${buddy.user_name}! You can now send an icebreaker request.`, 'success');
        } else {
          showToast(`You liked ${buddy.user_name}`, 'success');
        }
      }
      return next;
    });
  };

  const handleAcceptRequest = (buddy: BuddyProfile) => {
    recordBuddySwipe(currentUserEmail, buddy.user_email, 'like');
    setAcceptedEmails(prev => new Set([...prev, buddy.user_email]));
    setLikedEmails(prev => new Set([...prev, buddy.user_email]));
    showToast(`Connection request accepted! You can now chat freely with ${buddy.user_name}.`, 'success');
  };

  const handlePassRequest = (buddy: BuddyProfile) => {
    recordBuddySwipe(currentUserEmail, buddy.user_email, 'pass');
    setDismissedEmails(prev => new Set([...prev, buddy.user_email]));
    if (chatBuddy?.user_email === buddy.user_email) setChatBuddy(null);
    if (selectedBuddy?.user_email === buddy.user_email) setSelectedBuddy(null);
    showToast(`Declined request from ${buddy.user_name}`, 'success');
  };

  const handleUnmatch = (buddy: BuddyProfile) => {
    setLikedEmails(prev => {
      const next = new Set(prev);
      next.delete(buddy.user_email);
      return next;
    });
    setBumpedEmails(prev => {
      const next = new Set(prev);
      next.delete(buddy.user_email);
      return next;
    });
    setAcceptedEmails(prev => {
      const next = new Set(prev);
      next.delete(buddy.user_email);
      return next;
    });
    if (chatBuddy?.user_email === buddy.user_email) setChatBuddy(null);
    if (selectedBuddy?.user_email === buddy.user_email) setSelectedBuddy(null);
    showToast(`Unmatched with ${buddy.user_name}`, 'success');
  };

  const handleBlock = (buddy: BuddyProfile) => {
    setBlockedEmails(prev => new Set([...prev, buddy.user_email]));
    setLikedEmails(prev => {
      const next = new Set(prev);
      next.delete(buddy.user_email);
      return next;
    });
    setBumpedEmails(prev => {
      const next = new Set(prev);
      next.delete(buddy.user_email);
      return next;
    });
    if (chatBuddy?.user_email === buddy.user_email) setChatBuddy(null);
    if (selectedBuddy?.user_email === buddy.user_email) setSelectedBuddy(null);
    showToast(`${buddy.user_name} has been blocked and removed from your radar.`, 'success');
  };

  const handleReportSubmit = () => {
    if (!reportingBuddy) return;
    const name = reportingBuddy.user_name;
    setBlockedEmails(prev => new Set([...prev, reportingBuddy.user_email]));
    setLikedEmails(prev => {
      const next = new Set(prev);
      next.delete(reportingBuddy.user_email);
      return next;
    });
    setReportingBuddy(null);
    if (chatBuddy?.user_email === reportingBuddy.user_email) setChatBuddy(null);
    if (selectedBuddy?.user_email === reportingBuddy.user_email) setSelectedBuddy(null);
    showToast(`Report submitted for ${name}. Athlete blocked and flagged for safety moderation.`, 'success');
  };

  const handleDismiss = (buddy: BuddyProfile) => {
    setDismissingEmail(buddy.user_email);
    setTimeout(() => {
      setDismissedEmails(prev => new Set([...prev, buddy.user_email]));
      setDismissingEmail(null);
    }, 300);
  };

  const handleRefresh = async () => {
    setScanning(true);
    setDismissedEmails(new Set());
    await loadData();
    setTimeout(() => setScanning(false), 1200);
  };

  const handlePrivacyToggle = async (field: string, value: boolean) => {
    if (field === 'is_ghost_mode') setGhostMode(value);
    if (field === 'gym_zone_sharing') setGymSharing(value);
    if (field === 'public_telemetry') setPublicTelemetry(value);
    if (field === 'show_weight') setShowUserWeight(value);
    await updateMyRadarProfile(currentUserEmail, { [field]: value } as any);
  };

  if (!isOpen) return null;

  const isFilterOrPrivacy = showFilters || showPrivacy;
  const isDedicatedView = !!chatBuddy || !!selectedBuddy;

  const handleBack = () => {
    if (chatBuddy) { setChatBuddy(null); return; }
    if (selectedBuddy) { setSelectedBuddy(null); return; }
    if (showFilters) { setShowFilters(false); return; }
    if (showPrivacy) { setShowPrivacy(false); return; }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FFFFFF] dark:bg-[#060608] flex flex-col">
      {/* Top Header - Rendered only for main Radar views & Settings, Dedicated subviews (Chat & Profile) render their own single tier header */}
      {!isDedicatedView && (
        <div className="shrink-0 safe-top px-3 pt-2.5 pb-1.5 border-b border-zinc-200/60 dark:border-white/[0.06] bg-white/70 dark:bg-[#0A0A0E]/80 backdrop-blur-md">
          <div className="flex items-center justify-between min-h-[38px] mb-1.5">
            {isFilterOrPrivacy ? (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0"
                title="Back"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2]" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-1.5 -ml-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            )}

            {/* Center Segmented Toggle or Screen Title */}
            {!isFilterOrPrivacy ? (
              <div className="flex-1 max-w-xs mx-2">
                <div className="relative flex bg-black/[0.04] dark:bg-white/[0.06] rounded-full p-[3px] border border-gray-200/40 dark:border-white/[0.06]">
                  <div
                    className="absolute top-[3px] bottom-[3px] w-[calc(50%-3px)] rounded-full bg-white dark:bg-white/[0.12] shadow-sm transition-transform duration-200 ease-out"
                    style={{ transform: activeTab === 'discover' ? 'translateX(0)' : 'translateX(100%)' }}
                  />
                  <button
                    onClick={() => setActiveTab('discover')}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                      activeTab === 'discover' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-white/40'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Discover
                  </button>
                  <button
                    onClick={() => setActiveTab('matched')}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                      activeTab === 'matched' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-white/40'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Matched
                    {matchedBuddies.length > 0 && (
                      <span className="ml-0.5 w-4 h-4 rounded-full bg-red-500 text-[8.5px] font-bold text-white flex items-center justify-center">
                        {matchedBuddies.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-900 dark:text-white flex items-center gap-1.5">
                {showFilters ? (
                  <>
                    <Sliders className="w-3.5 h-3.5 text-red-500" />
                    Filters & Zone
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                    Privacy & Stealth
                  </>
                )}
              </h1>
            )}

            {/* Right Action Buttons */}
            {!isFilterOrPrivacy ? (
              <div className="flex items-center gap-0.5">
                {activeTab === 'discover' && (
                  <>
                    <button
                      onClick={() => setIsDemoMode((prev) => !prev)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer mr-1 ${
                        isDemoMode
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      title={isDemoMode ? 'Showing Demo Radar Athletes' : 'Showing Real Supabase Athletes'}
                    >
                      {isDemoMode ? 'Demo' : 'Live'}
                    </button>
                    <button
                      onClick={() => { setShowPrivacy(!showPrivacy); setShowFilters(false); }}
                      className={`p-1.5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0 ${
                        showPrivacy ? '!text-red-500 font-bold' : ''
                      }`}
                      title="Privacy Settings"
                    >
                      <Shield className="w-4.5 h-4.5 stroke-[1.75]" />
                    </button>
                    <button
                      onClick={() => { setShowFilters(!showFilters); setShowPrivacy(false); }}
                      className={`p-1.5 -mr-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0 relative ${
                        showFilters ? '!text-red-500 font-bold' : ''
                      }`}
                      title="Radar Filters"
                    >
                      <Sliders className="w-4.5 h-4.5 stroke-[1.75]" />
                      {activeFilterCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </button>
                  </>
                )}
                {activeTab === 'matched' && (
                  <div className="w-7 h-7" />
                )}
              </div>
            ) : (
              <div className="flex items-center">
                {showFilters ? (
                  <button
                    onClick={() => { setFilters(DEFAULT_FILTERS); setHomeGymOnly(false); }}
                    className="text-[11px] font-semibold text-red-500 hover:text-red-400 p-1.5 active:scale-95 transition-all bg-transparent border-0 cursor-pointer"
                  >
                    Reset
                  </button>
                ) : (
                  <div className="w-8" />
                )}
              </div>
            )}
          </div>

          {/* Search bar - show on discover or matched */}
          {!isFilterOrPrivacy && (
            <div className="relative pb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'discover' ? "Search gym, name, discipline..." : "Search matches..."}
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-gray-200/60 dark:border-white/[0.06] text-gray-900 dark:text-white text-xs placeholder:text-gray-400 dark:placeholder:text-white/25 outline-none focus:border-red-500/40 transition-colors"
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {showFilters ? (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            homeGymOnly={homeGymOnly}
            setHomeGymOnly={setHomeGymOnly}
            onApply={() => { setShowFilters(false); loadData(); }}
            onReset={() => { setFilters(DEFAULT_FILTERS); setHomeGymOnly(false); }}
            isPaid={isPaid}
            onOpenPayPlan={onOpenPayPlan}
            showToast={showToast}
          />
        ) : showPrivacy ? (
          <PrivacyPanel
            ghostMode={ghostMode}
            gymSharing={gymSharing}
            publicTelemetry={publicTelemetry}
            showWeight={showUserWeight}
            onToggle={handlePrivacyToggle}
          />
        ) : chatBuddy ? (
          <ChatDrawer
            buddy={chatBuddy}
            isAccepted={acceptedEmails.has(chatBuddy.user_email)}
            onAcceptRequest={() => handleAcceptRequest(chatBuddy)}
            onPassRequest={() => handlePassRequest(chatBuddy)}
            onUnmatch={() => handleUnmatch(chatBuddy)}
            onBlock={() => handleBlock(chatBuddy)}
            onReport={() => setReportingBuddy(chatBuddy)}
            onBack={() => setChatBuddy(null)}
            showToast={showToast}
          />
        ) : selectedBuddy ? (
          <BuddyDetailCard
            buddy={selectedBuddy}
            isAccepted={acceptedEmails.has(selectedBuddy.user_email)}
            isBumped={bumpedEmails.has(selectedBuddy.user_email)}
            isLiked={likedEmails.has(selectedBuddy.user_email)}
            matchPercent={computeMatchPercent(selectedBuddy)}
            onAccept={() => handleAcceptRequest(selectedBuddy)}
            onPass={() => handlePassRequest(selectedBuddy)}
            onFistBump={() => handleFistBump(selectedBuddy)}
            onLike={() => handleLike(selectedBuddy)}
            onDismiss={() => { handleDismiss(selectedBuddy); setSelectedBuddy(null); }}
            onChat={() => { setChatBuddy(selectedBuddy); setSelectedBuddy(null); }}
            onUnmatch={() => handleUnmatch(selectedBuddy)}
            onBlock={() => handleBlock(selectedBuddy)}
            onReport={() => setReportingBuddy(selectedBuddy)}
            onBack={() => setSelectedBuddy(null)}
          />
        ) : activeTab === 'discover' ? (
          <RadarGrid
            buddies={filteredBuddies}
            loading={loading}
            scanning={scanning}
            currentRadiusKm={filters.radiusKm}
            onExpandRadius={(newKm) => {
              if (newKm > 25 && !isPaid) {
                showToast('Search radius above 25 km requires Premium Pro or Founder Pass.', 'error');
                onOpenPayPlan?.('premium');
                return;
              }
              setFilters(prev => ({ ...prev, radiusKm: newKm }));
            }}
            likedEmails={likedEmails}
            bumpedEmails={bumpedEmails}
            dismissingEmail={dismissingEmail}
            onSelectBuddy={setSelectedBuddy}
            onLike={handleLike}
            onDismiss={handleDismiss}
            onChat={setChatBuddy}
            onRefresh={handleRefresh}
            isPaid={isPaid}
            onOpenPayPlan={onOpenPayPlan}
          />
        ) : (
          <MatchedInbox
            matchedBuddies={matchedBuddies}
            allBuddies={buddies}
            likedEmails={likedEmails}
            searchQuery={searchQuery}
            onSelectBuddy={setSelectedBuddy}
            onChat={setChatBuddy}
          />
        )}
      </div>

      {/* Safety Report Modal */}
      {reportingBuddy && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#121217] border border-red-500/30 p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xs">Report Athlete</h3>
                  <p className="text-zinc-400 text-[10px]">{reportingBuddy.user_name} ({reportingBuddy.handle || '@athlete'})</p>
                </div>
              </div>
              <button
                onClick={() => setReportingBuddy(null)}
                className="p-1.5 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer bg-transparent border-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-zinc-300 text-[11px] font-medium">Select reason for safety moderation:</p>
              {[
                { id: 'inappropriate', label: 'Inappropriate or offensive messages' },
                { id: 'harassment', label: 'Harassment or intimidation' },
                { id: 'spam', label: 'Spam or commercial promotion' },
                { id: 'fake', label: 'Fake profile or stolen photos' },
                { id: 'safety', label: 'Safety concern or gym etiquette violation' },
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => setReportReason(opt.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reportReason === opt.id
                      ? 'bg-red-500/15 border-red-500/40 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    checked={reportReason === opt.id}
                    onChange={() => setReportReason(opt.id)}
                    className="accent-red-500"
                  />
                  <span className="text-[11px] leading-tight font-medium">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setReportingBuddy(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" /> Submit & Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════ Matched Inbox ═══════════════════ */
const FAKE_CONVERSATIONS: { [email: string]: { lastMessage: string; time: string; unread: number; hasBooking?: boolean; isTyping?: boolean; fromMe?: boolean } } = {};

function getConversationData(buddy: BuddyProfile) {
  if (!FAKE_CONVERSATIONS[buddy.user_email]) {
    const messages = [
      'Sounds great, let me check my schedule!',
      'I am usually at the gym around that time too.',
      'Absolutely, let us do it!',
      'Nice one! See you there.',
      'I am down for a session this week.',
      'Just finished a solid chest day!',
      'Want to hit legs tomorrow?',
      'What time works for you?',
      'Great session today, thanks!',
      'Let me know when you are free next.',
    ];
    const times = ['2m', '5m', '12m', '23m', '1h', '2h', '5h', '1d', '2d', '3d'];
    const unread = Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0;
    FAKE_CONVERSATIONS[buddy.user_email] = {
      lastMessage: messages[Math.floor(Math.random() * messages.length)],
      time: times[Math.floor(Math.random() * times.length)],
      unread,
      hasBooking: Math.random() > 0.75,
      isTyping: unread === 0 && Math.random() > 0.85,
      fromMe: unread === 0 && Math.random() > 0.5,
    };
  }
  return FAKE_CONVERSATIONS[buddy.user_email];
}

function isOnlineFromLastActive(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 30 * 60000;
}

const MatchedInbox: React.FC<{
  matchedBuddies: BuddyProfile[];
  allBuddies: BuddyProfile[];
  likedEmails: Set<string>;
  searchQuery: string;
  onSelectBuddy: (b: BuddyProfile) => void;
  onChat: (b: BuddyProfile) => void;
}> = ({ matchedBuddies, allBuddies, likedEmails, searchQuery, onSelectBuddy, onChat }) => {
  const filteredMatches = useMemo(() => {
    if (!searchQuery) return matchedBuddies;
    const q = searchQuery.toLowerCase();
    return matchedBuddies.filter(b =>
      b.user_name.toLowerCase().includes(q) ||
      b.home_gym.toLowerCase().includes(q) ||
      b.current_gym.toLowerCase().includes(q) ||
      b.discipline.toLowerCase().includes(q)
    );
  }, [matchedBuddies, searchQuery]);

  const conversations = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      const cA = getConversationData(a);
      const cB = getConversationData(b);
      if (cA.unread && !cB.unread) return -1;
      if (!cA.unread && cB.unread) return 1;
      const timeOrder = ['2m', '5m', '12m', '23m', '1h', '2h', '5h', '1d', '2d', '3d'];
      return timeOrder.indexOf(cA.time) - timeOrder.indexOf(cB.time);
    });
  }, [filteredMatches]);

  const totalUnread = useMemo(() => {
    return matchedBuddies.reduce((sum, b) => sum + getConversationData(b).unread, 0);
  }, [matchedBuddies]);

  if (matchedBuddies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
          <Heart className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-zinc-900 dark:text-white font-bold text-sm">No matches yet</h3>
        <p className="text-zinc-500 dark:text-white/40 text-xs text-center leading-relaxed">
          Like athletes on the Discover tab to start matching. When someone likes you back, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3">
      {/* Match Queue Strip - always visible */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <p className="text-zinc-500 dark:text-white/40 text-[10px] font-semibold uppercase tracking-wider">Match Queue</p>
          <span className="text-zinc-400 dark:text-white/25 text-[9px]">{filteredMatches.length} athletes</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {filteredMatches.map(buddy => {
            const matchPct = computeMatchPercent(buddy);
            const photos = buddy.photos?.length ? buddy.photos : (buddy.avatar_url ? [buddy.avatar_url] : []);
            const initials = buddy.user_name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const isOnline = isOnlineFromLastActive(buddy.last_active_at);
            const ringColor = matchPct >= 90
              ? 'from-amber-400 to-amber-500'
              : matchPct >= 70
                ? 'from-teal-400 to-emerald-500'
                : 'from-red-400 to-red-500';
            const conv = getConversationData(buddy);

            return (
              <button
                key={buddy.id}
                onClick={() => onChat(buddy)}
                className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform group"
              >
                <div className={`relative w-[56px] h-[56px] rounded-full p-[2.5px] bg-gradient-to-br ${ringColor} shadow-md group-hover:shadow-lg transition-shadow`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10 border-2 border-white dark:border-[#060608]">
                    {photos.length > 0 ? (
                      <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 dark:text-white/50 text-sm font-bold">{initials}</div>
                    )}
                  </div>
                  {/* Match badge - green if online, amber if offline */}
                  <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full shadow-sm ${
                    isOnline
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}>
                    <span className="text-[8px] font-mono font-black text-white flex items-center gap-0.5">
                      <Zap className="w-1.5 h-1.5" />{matchPct}%
                    </span>
                  </div>
                  {/* Unread dot on avatar */}
                  {conv.unread > 0 && (
                    <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-[#060608] flex items-center justify-center">
                      <span className="text-[6px] font-bold text-white">{conv.unread}</span>
                    </div>
                  )}
                </div>
                <span className="text-zinc-700 dark:text-white/70 text-[9px] font-medium truncate max-w-[56px]">
                  {buddy.user_name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <p className="text-zinc-500 dark:text-white/40 text-[10px] font-semibold uppercase tracking-wider">Messages</p>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 dark:text-red-400 text-[9px] font-bold">
              {totalUnread} unread
            </span>
          )}
        </div>
        <div className="space-y-1">
          {conversations.map(buddy => {
            const conv = getConversationData(buddy);
            const photos = buddy.photos?.length ? buddy.photos : (buddy.avatar_url ? [buddy.avatar_url] : []);
            const initials = buddy.user_name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const matchPct = computeMatchPercent(buddy);
            const isOnline = isOnlineFromLastActive(buddy.last_active_at);

            return (
              <button
                key={buddy.id}
                onClick={() => onChat(buddy)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                  conv.unread > 0
                    ? 'bg-white dark:bg-white/[0.05] border-red-200/50 dark:border-red-500/15 shadow-sm'
                    : 'bg-white/60 dark:bg-white/[0.03] border-gray-200/40 dark:border-white/[0.05] hover:bg-white dark:hover:bg-white/[0.06]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden">
                    {photos.length > 0 ? (
                      <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-white/50 text-sm font-bold">{initials}</div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs truncate ${conv.unread > 0 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-800 dark:text-white/80 font-semibold'}`}>
                      {buddy.user_name}
                    </h4>
                    {buddy.experience_level === 'Elite' && (
                      <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                    )}
                    <span className={`text-[8px] font-mono font-bold px-1 rounded ${
                      isOnline
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    }`}>{matchPct}%</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {conv.isTyping ? (
                      <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        </span>
                        typing...
                      </span>
                    ) : conv.hasBooking ? (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                        <Calendar className="w-2.5 h-2.5" />
                        Session booked
                      </span>
                    ) : (
                      <p className={`text-[10px] truncate ${conv.unread > 0 ? 'text-zinc-700 dark:text-white/60 font-medium' : 'text-zinc-500 dark:text-white/35'}`}>
                        {conv.fromMe && <span className="text-zinc-400 dark:text-white/25">You: </span>}
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time & unread */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[9px] ${conv.unread > 0 ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-zinc-400 dark:text-white/25'}`}>
                    {conv.time}
                  </span>
                  {conv.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ 2-Column Radar Grid ═══════════════════ */
const RadarGrid: React.FC<{
  buddies: BuddyProfile[];
  loading: boolean;
  scanning: boolean;
  currentRadiusKm: number;
  onExpandRadius: (newKm: number) => void;
  likedEmails: Set<string>;
  bumpedEmails: Set<string>;
  dismissingEmail: string | null;
  onSelectBuddy: (b: BuddyProfile) => void;
  onLike: (b: BuddyProfile) => void;
  onDismiss: (b: BuddyProfile) => void;
  onChat: (b: BuddyProfile) => void;
  onRefresh: () => void;
  isPaid?: boolean;
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
}> = ({
  buddies, loading, scanning, currentRadiusKm, onExpandRadius,
  likedEmails, bumpedEmails, dismissingEmail, onSelectBuddy,
  onLike, onDismiss, onChat, onRefresh, isPaid = false, onOpenPayPlan,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-red-400/20" />
          <div className="absolute inset-2 rounded-full border-2 border-red-400/30" />
          <div className="absolute inset-4 rounded-full border-2 border-red-400/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <p className="text-zinc-500 dark:text-white/50 text-sm">Scanning nearby athletes...</p>
      </div>
    );
  }

  return (
    <div className="px-2.5 md:px-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-zinc-500 dark:text-white/50 text-[10px] font-medium">
            {buddies.length} athletes within {currentRadiusKm} km
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={scanning}
          className="flex items-center gap-1 text-red-400 text-[10px] font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {/* Zero-Ghost-Town / Regional Corridor Auto-Suggest Banner */}
      {buddies.length < 3 && currentRadiusKm < 250 && (
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/25 flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
              {isPaid ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-white text-[11px] font-bold truncate">
                {isPaid ? 'Regional Corridor Available' : 'Regional Corridor (250 km) • Pro'}
              </p>
              <p className="text-zinc-400 text-[9px] leading-tight">
                {isPaid
                  ? 'Expand search up to 250 km for neighboring cities'
                  : 'Unlock 250 km corridor with Premium Pro or Founder Pass'}
              </p>
            </div>
          </div>
          {isPaid ? (
            <button
              onClick={() => onExpandRadius(250)}
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              250 km Scan
            </button>
          ) : (
            <button
              onClick={() => onOpenPayPlan?.('premium')}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" /> Unlock 250km
            </button>
          )}
        </div>
      )}

      {scanning && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center gap-2.5">
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-0 rounded-full border border-red-400/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio className="w-3 h-3 text-red-400" />
            </div>
          </div>
          <div>
            <p className="text-red-400 text-[10px] font-semibold">Radar Active</p>
            <p className="text-zinc-500 dark:text-white/35 text-[9px]">Scanning regional corridor up to {currentRadiusKm} km...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {buddies.map((buddy) => {
          const matchPct = computeMatchPercent(buddy);
          const isDismissing = dismissingEmail === buddy.user_email;
          return (
            <GridBuddyCard
              key={buddy.id}
              buddy={buddy}
              matchPercent={matchPct}
              isLiked={likedEmails.has(buddy.user_email)}
              isDismissing={isDismissing}
              onTap={() => onSelectBuddy(buddy)}
              onLike={() => onLike(buddy)}
              onDismiss={() => onDismiss(buddy)}
              onChat={() => onChat(buddy)}
            />
          );
        })}
      </div>

      {buddies.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <Radio className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-zinc-900 dark:text-white font-bold text-sm">No athletes in {currentRadiusKm} km radius</h3>
          <p className="text-zinc-500 dark:text-white/40 text-xs text-center max-w-xs leading-relaxed">
            {isPaid
              ? 'Expand to the 250 km regional corridor to discover gym partners, crossfitters, and lifters across neighboring hubs.'
              : 'Unlock the 250 km regional corridor or Global Travel Pass with Premium Pro to discover gym partners, crossfitters, and lifters across neighboring hubs.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {isPaid && currentRadiusKm < 250 ? (
              <button
                onClick={() => onExpandRadius(250)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Expand to 250 km
              </button>
            ) : !isPaid ? (
              <button
                onClick={() => onOpenPayPlan?.('premium')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-red-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Unlock 250 km (Premium)
              </button>
            ) : null}
            <button onClick={onRefresh} className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold active:scale-95 transition-transform cursor-pointer">
              Rescan Area
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════ Luxury Grid Card ═══════════════════ */
const GridBuddyCard: React.FC<{
  buddy: BuddyProfile;
  matchPercent: number;
  isLiked: boolean;
  isDismissing: boolean;
  onTap: () => void;
  onLike: () => void;
  onDismiss: () => void;
  onChat: () => void;
}> = ({ buddy, matchPercent, isLiked, isDismissing, onTap, onLike, onDismiss, onChat }) => {
  const photos = buddy.photos?.length ? buddy.photos : (buddy.avatar_url ? [buddy.avatar_url] : []);
  const initials = buddy.user_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const timeAgo = getTimeAgo(buddy.last_active_at);
  const isOnline = timeAgo.includes('min') && parseInt(timeAgo) < 30;
  const gym = buddy.current_gym || buddy.home_gym || 'No gym';

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-300"
      style={{
        opacity: isDismissing ? 0 : 1,
        transform: isDismissing ? 'scale(0.85) translateY(12px)' : 'scale(1) translateY(0)',
      }}
    >
      {/* Portrait photo */}
      <div className="relative aspect-[3/4] cursor-pointer" onClick={onTap}>
        {photos.length > 0 ? (
          <>
          <img
            src={photos[0]}
            alt={buddy.user_name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex'; }}
          />
          <div className="w-full h-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-900 items-center justify-center absolute inset-0" style={{ display: 'none' }}>
            <span className="text-3xl font-bold text-white/60">{initials}</span>
          </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-900 flex items-center justify-center">
            <span className="text-3xl font-bold text-white/60">{initials}</span>
          </div>
        )}

        {/* Match badge - green when online, amber/yellow when offline */}
        <div className={`absolute top-2 left-2 px-1.5 py-[2px] rounded-full backdrop-blur-sm shadow-lg flex items-center gap-0.5 z-10 ${
          isOnline
            ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20'
            : 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 shadow-amber-500/20'
        }`}>
          <Zap className="w-2 h-2 text-white" />
          <span className="text-[9px] font-mono font-black text-white tracking-tight">{matchPercent}%</span>
        </div>

        {/* Gradient for text + action overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Name & info overlay at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-14 z-10">
          <h3 className="text-[13px] font-bold text-white leading-tight truncate drop-shadow-md">{buddy.user_name}, {buddy.age}</h3>
          <p className="text-[9px] text-white/65 flex items-center gap-0.5 truncate mt-0.5">
            <MapPin className="w-2 h-2 shrink-0" />
            {gym}
          </p>
          <p className="text-[9px] text-white/50 flex items-center gap-0.5 truncate">
            <Navigation className="w-2 h-2 shrink-0" />
            {buddy.distance_km?.toFixed(1)} km
          </p>
        </div>

        {/* Frameless action row flush with the card bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 w-full flex items-center justify-around pt-2 pb-1 mt-auto">
          <button
            aria-label={`Like ${buddy.user_name}`}
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`text-zinc-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all p-2 flex items-center justify-center ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            aria-label={`Message ${buddy.user_name}`}
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="text-zinc-400 hover:text-emerald-400 hover:scale-110 active:scale-95 transition-all p-2 flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            aria-label={`Skip ${buddy.user_name}`}
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="text-zinc-500 hover:text-zinc-300 hover:scale-110 active:scale-95 transition-all p-2 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ Chat Drawer + Gym Date Booking ═══════════════════ */
type ChatMessage =
  | { type: 'text'; text: string; fromMe: boolean; time: string }
  | { type: 'booking'; fromMe: boolean; time: string; booking: BookingProposal };

export interface BookingProposal {
  date: string;
  timeSlot: string;
  gym: string;
  gymAddress?: string;
  isMidpoint?: boolean;
  travelSplit?: {
    userDist: string;
    buddyDist: string;
    userTime: string;
    buddyTime: string;
    parityPercent?: number;
  };
  status: 'pending' | 'accepted' | 'declined';
}

export interface MidpointGymLocation {
  id: string;
  name: string;
  category: string;
  address: string;
  suburb: string;
  lat: number;
  lng: number;
  distFromUserKm: number;
  distFromBuddyKm: number;
  driveTimeUserMin: number;
  driveTimeBuddyMin: number;
  transitTimeUserMin: number;
  transitTimeBuddyMin: number;
  parityScore: number;
  amenityTags: string[];
  passType: 'O1FC Pass' | 'Day Pass' | 'Member Only' | 'Open Access' | 'Free Pass';
  rating: number;
  badge?: string;
}

const ChatDrawer: React.FC<{
  buddy: BuddyProfile;
  isAccepted: boolean;
  onAcceptRequest: () => void;
  onPassRequest: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
  onReport: () => void;
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ buddy, isAccepted, onAcceptRequest, onPassRequest, onUnmatch, onBlock, onReport, onBack, showToast }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const initials = buddy.user_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const photos = buddy.photos?.length ? buddy.photos : (buddy.avatar_url ? [buddy.avatar_url] : []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { type: 'text', text: text.trim(), fromMe: true, time: now }]);
    setInput('');

    setTimeout(() => {
      const replies = [
        'Sounds great, let me check my schedule!',
        'I am usually at the gym around that time too.',
        'Absolutely, let us do it!',
        'Nice one! What program are you running?',
        'I am down for a session this week.',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { type: 'text', text: reply, fromMe: false, time: t }]);
    }, 1200 + Math.random() * 1500);
  };

  const sendBooking = (booking: BookingProposal) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { type: 'booking', fromMe: true, time: now, booking }]);
    setShowBooking(false);
    showToast(booking.isMidpoint ? 'Midpoint session invite sent!' : 'Session invite sent!', 'success');

    setTimeout(() => {
      const accepted = Math.random() > 0.25;
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (accepted) {
        setMessages(prev => {
          const updated = prev.map(m =>
            m.type === 'booking' && m.booking.status === 'pending'
              ? { ...m, booking: { ...m.booking, status: 'accepted' as const } }
              : m
          );
          return [...updated, {
            type: 'text' as const,
            text: booking.isMidpoint
              ? `Locked in! Meeting halfway at ${booking.gym} (${booking.travelSplit?.userTime || '12 min'} for you · ${booking.travelSplit?.buddyTime || '14 min'} for me) on ${booking.date} at ${booking.timeSlot}. Let's crush this session!`
              : `Locked in! See you at ${booking.gym} on ${booking.date} at ${booking.timeSlot}. Let's crush it!`,
            fromMe: false,
            time: t,
          }];
        });
        showToast(`${buddy.user_name} accepted your session!`, 'success');
      } else {
        setMessages(prev => {
          const updated = prev.map(m =>
            m.type === 'booking' && m.booking.status === 'pending'
              ? { ...m, booking: { ...m.booking, status: 'declined' as const } }
              : m
          );
          return [...updated, {
            type: 'text' as const,
            text: `Hey, that time doesn't work for me. Can we try another slot or a different gym?`,
            fromMe: false,
            time: t,
          }];
        });
      }
    }, 2500 + Math.random() * 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccepted) return;
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#060608]">
      {/* Chat header - Single tier nude header */}
      <div className="shrink-0 safe-top px-3 py-2 border-b border-zinc-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-[#0A0A0E]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10 shrink-0">
            {photos.length > 0 ? (
              <img src={photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 dark:text-white/50 text-xs font-bold">{initials}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-zinc-900 dark:text-white font-bold text-xs truncate flex items-center gap-1.5">
              {buddy.user_name}
              {!isAccepted && (
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Request
                </span>
              )}
            </h3>
            <p className="text-zinc-500 dark:text-white/40 text-[10px] truncate">{buddy.discipline} · {buddy.current_gym || buddy.home_gym || 'Partner Gym'}</p>
          </div>

          <button
            onClick={() => setShowBooking(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <CalendarPlus className="w-3 h-3" />
            Book
          </button>

          {/* 3 dots menu with nude button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 -mr-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0"
              title="More options"
            >
              <MoreVertical className="w-4.5 h-4.5 stroke-[1.75]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#14141A] border border-white/[0.1] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setShowMenu(false); onUnmatch(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-zinc-300 hover:bg-white/[0.08] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-zinc-400" /> Unmatch
                </button>
                <button
                  onClick={() => { setShowMenu(false); onBlock(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-red-400 hover:bg-red-500/15 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Block Athlete
                </button>
                <button
                  onClick={() => { setShowMenu(false); onReport(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-red-400 hover:bg-red-500/15 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-red-400" /> Report Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Sheet */}
      {showBooking && (
        <BookingSheet
          buddy={buddy}
          onClose={() => setShowBooking(false)}
          onSend={sendBooking}
        />
      )}

      {/* Connection request policy banner */}
      {!isAccepted && (
        <div className="shrink-0 px-3 py-2 bg-black/[0.03] dark:bg-black/40 border-b border-zinc-200/60 dark:border-white/[0.06] flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[10px] text-zinc-600 dark:text-white/60 leading-tight">
            <strong className="text-zinc-900 dark:text-white font-semibold">Message Request Protection:</strong> Free-form messaging opens when request is accepted. Choose an icebreaker below.
          </p>
        </div>
      )}

      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.length === 0 && !showBooking && (
          <div className="space-y-3 pt-2">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10 mx-auto mb-2">
                {photos.length > 0 ? (
                  <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 dark:text-white/50 text-lg font-bold">{initials}</div>
                )}
              </div>
              <p className="text-zinc-700 dark:text-white/80 text-xs font-semibold mb-0.5">Send a Message Request to {buddy.user_name}</p>
              <p className="text-zinc-400 dark:text-white/35 text-[10px]">Select a curated athletic icebreaker to initiate connection</p>
            </div>

            <div className="space-y-1.5 pt-1">
              {ICEBREAKERS.map((ib, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(ib)}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#121217] border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium leading-relaxed hover:border-red-500/50 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                >
                  <span className="text-red-500 mr-1.5 font-bold">›</span>
                  {ib}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === 'text' ? (
              <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  msg.fromMe
                    ? 'bg-red-600 text-white rounded-br-md shadow-sm'
                    : 'bg-black/90 text-white dark:bg-[#141419] dark:text-white border border-zinc-800 rounded-bl-md'
                }`}>
                  <p className="text-[12px] leading-relaxed">{msg.text}</p>
                  <p className={`text-[8px] mt-0.5 ${msg.fromMe ? 'text-white/60' : 'text-zinc-400'}`}>{msg.time}</p>
                </div>
              </div>
            ) : (
              <BookingCard
                booking={msg.booking}
                fromMe={msg.fromMe}
                time={msg.time}
                buddyName={buddy.user_name.split(' ')[0]}
                onSuggestAlternative={() => setShowBooking(true)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Center Accept / Pass Buttons if incoming request not yet accepted */}
      {!isAccepted && !showBooking && (
        <div className="shrink-0 p-3 bg-white/90 dark:bg-[#0A0A0E] border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-center gap-3">
          <button
            onClick={onAcceptRequest}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Accept
          </button>
          <button
            onClick={onPassRequest}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#121217] hover:bg-zinc-800 text-zinc-300 hover:text-red-400 text-xs font-bold border border-zinc-700/60 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" /> Pass
          </button>
        </div>
      )}

      {/* Input row (removed redundant calendar icon) */}
      {!showBooking && (
        <form onSubmit={handleSubmit} className="shrink-0 px-3 py-2 border-t border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0E]">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                disabled={!isAccepted}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAccepted ? "Type a message..." : "Select an icebreaker above to initiate request..."}
                className="w-full pl-3 pr-8 py-2 rounded-full bg-zinc-100 dark:bg-[#121217] border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-white/25 outline-none focus:border-red-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              />
              {!isAccepted && (
                <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-white/30 absolute right-3 pointer-events-none" />
              )}
            </div>
            <button
              type="submit"
              disabled={!isAccepted || !input.trim()}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all disabled:opacity-30 disabled:active:scale-100 cursor-pointer shadow-md shadow-red-600/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/* ═══════════════════ Booking Sheet with Dropdown Calendar, Small Time Select & Real Worldwide Search ═══════════════════ */
const BookingSheet: React.FC<{
  buddy: BuddyProfile;
  onClose: () => void;
  onSend: (booking: BookingProposal) => void;
}> = ({ buddy, onClose, onSend }) => {
  // Default to tomorrow's date format YYYY-MM-DD
  const defaultDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState('07:00 AM');
  
  // Selected gym details
  const [selectedGym, setSelectedGym] = useState(buddy.current_gym || buddy.home_gym || 'Iron Works Barbell HQ');
  const [selectedGymAddress, setSelectedGymAddress] = useState('15 Bridge Road, Inner West');
  const [selectedSuburb, setSelectedSuburb] = useState('Inner West');
  const [selectedPostcode, setSelectedPostcode] = useState('2042');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: -33.8688,
    lng: 151.2093,
  });

  // Toggle for commute / meet halfway inspection (only active if they decide to meet/check)
  const [showCommuteSplit, setShowCommuteSplit] = useState(false);

  // Manual search fields
  const [searchName, setSearchName] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searchPostcode, setSearchPostcode] = useState('');
  const [splitBias, setSplitBias] = useState(50); // 50 = exact midpoint

  // Live worldwide search state
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<Array<{
    id: string;
    name: string;
    address: string;
    suburb: string;
    postcode: string;
    lat: number;
    lng: number;
    category?: string;
    source: 'live' | 'local';
  }>>([]);

  // User & Buddy Coordinates
  const myLat = -33.8688;
  const myLng = 151.2093;
  const buddyLat = buddy.latitude || -33.8850;
  const buddyLng = buddy.longitude || 151.2180;
  const buddyShortName = buddy.user_name.split(' ')[0];

  // Helper distance calculator
  const calcHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Base preset gyms in case offline or initial state
  const baseVenues = useMemo(() => [
    {
      id: 'iron_works_hq',
      name: 'Iron Works Barbell HQ',
      category: 'Powerlifting & Heavy Iron',
      address: '15 Bridge Road',
      suburb: 'Inner West',
      postcode: '2042',
      lat: myLat - 0.004,
      lng: myLng + 0.003,
      rating: 5.0,
    },
    {
      id: 'fitlab_metro',
      name: 'FitLab Central Metro',
      category: 'Commercial & Functional',
      address: '240 George St',
      suburb: 'Metro Central',
      postcode: '2000',
      lat: (myLat + buddyLat) / 2 + 0.002,
      lng: (myLng + buddyLng) / 2 - 0.001,
      rating: 4.9,
    },
    {
      id: 'powerhouse_gym',
      name: 'PowerHouse Strength & Conditioning',
      category: 'Bodybuilding & Machines',
      address: '88 Campbell Ave',
      suburb: 'South Quarter',
      postcode: '2010',
      lat: buddyLat + 0.003,
      lng: buddyLng - 0.002,
      rating: 4.8,
    },
    {
      id: 'anytime_crossway',
      name: 'Anytime Fitness',
      category: '24/7 Franchise',
      address: '56 Elizabeth Way',
      suburb: 'Junction Square',
      postcode: '2022',
      lat: (myLat + buddyLat) / 2 + 0.004,
      lng: (myLng + buddyLng) / 2 + 0.001,
      rating: 4.7,
    },
    {
      id: 'alpha_barbell',
      name: 'Alpha Barbell Club',
      category: 'Powerlifting & Strongman',
      address: '77 Commerce Lane',
      suburb: 'Midtown District',
      postcode: '2015',
      lat: (myLat + buddyLat) / 2 - 0.003,
      lng: (myLng + buddyLng) / 2 - 0.002,
      rating: 4.9,
    },
  ], [myLat, myLng, buddyLat, buddyLng]);

  // Worldwide live search API with debouncing
  useEffect(() => {
    const combinedQuery = [searchName, searchSuburb, searchPostcode].filter(Boolean).join(' ').trim();
    if (!combinedQuery || combinedQuery.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        // Query Photon (OpenStreetMap global place/address search)
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(combinedQuery)}&limit=10`;
        const res = await fetch(photonUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.features) && data.features.length > 0) {
            const mapped = data.features.map((f: any, idx: number) => {
              const p = f.properties || {};
              const coords = f.geometry?.coordinates || [myLng, myLat];
              const name = p.name || searchName || 'Fitness Venue';
              const street = [p.housenumber, p.street].filter(Boolean).join(' ');
              const suburb = p.city || p.district || p.suburb || p.town || p.state || '';
              const postcode = p.postcode || '';
              const country = p.country || '';
              const address = [street, suburb, postcode, country].filter(Boolean).join(', ') || 'Global Location';

              return {
                id: `live-photon-${idx}-${p.osm_id || idx}`,
                name: name,
                address: address,
                suburb: suburb || searchSuburb || 'Area',
                postcode: postcode || searchPostcode || '',
                lat: coords[1],
                lng: coords[0],
                category: p.osm_value ? p.osm_value.replace(/_/g, ' ') : 'Gym / Fitness',
                source: 'live' as const,
              };
            });
            setLiveSearchResults(mapped);
            setIsSearchingOnline(false);
            return;
          }
        }

        // Fallback to Nominatim if Photon returns empty
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(combinedQuery)}&format=json&addressdetails=1&limit=8`;
        const nomRes = await fetch(nomUrl);
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            const mapped = nomData.map((item: any, idx: number) => {
              const addr = item.address || {};
              const name = item.name || addr.fitness_centre || addr.leisure || searchName || item.display_name.split(',')[0];
              const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
              const suburb = addr.suburb || addr.city || addr.town || addr.municipality || addr.state || '';
              const postcode = addr.postcode || '';
              const fullAddr = [street, suburb, postcode, addr.country].filter(Boolean).join(', ') || item.display_name;

              return {
                id: `live-nom-${idx}-${item.place_id || idx}`,
                name: name,
                address: fullAddr,
                suburb: suburb || searchSuburb || '',
                postcode: postcode || searchPostcode || '',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                category: item.type ? item.type.replace(/_/g, ' ') : 'Gym / Fitness',
                source: 'live' as const,
              };
            });
            setLiveSearchResults(mapped);
          } else {
            setLiveSearchResults([]);
          }
        }
      } catch (err) {
        console.warn('Live search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchName, searchSuburb, searchPostcode, myLat, myLng]);

  // Combined Results (Live global search + Local matching filter)
  const displayResults = useMemo(() => {
    const hasSearch = Boolean(searchName.trim() || searchSuburb.trim() || searchPostcode.trim());
    if (liveSearchResults.length > 0) {
      return liveSearchResults;
    }

    if (!hasSearch) {
      return baseVenues.map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        suburb: v.suburb,
        postcode: v.postcode,
        lat: v.lat,
        lng: v.lng,
        category: v.category,
        source: 'local' as const,
      }));
    }

    // Local filter fallback
    const qName = searchName.toLowerCase();
    const qSuburb = searchSuburb.toLowerCase();
    const qPost = searchPostcode.toLowerCase();

    return baseVenues.filter(g => {
      if (qName && !g.name.toLowerCase().includes(qName) && !g.category.toLowerCase().includes(qName)) return false;
      if (qSuburb && !g.suburb.toLowerCase().includes(qSuburb) && !g.address.toLowerCase().includes(qSuburb)) return false;
      if (qPost && !g.postcode.toLowerCase().includes(qPost)) return false;
      return true;
    }).map(v => ({
      id: v.id,
      name: v.name,
      address: v.address,
      suburb: v.suburb,
      postcode: v.postcode,
      lat: v.lat,
      lng: v.lng,
      category: v.category,
      source: 'local' as const,
    }));
  }, [liveSearchResults, searchName, searchSuburb, searchPostcode, baseVenues]);

  // Commute metrics for currently selected gym
  const commuteMetrics = useMemo(() => {
    const distUser = Math.max(0.4, calcHaversine(myLat, myLng, selectedCoords.lat, selectedCoords.lng));
    const distBuddy = Math.max(0.4, calcHaversine(buddyLat, buddyLng, selectedCoords.lat, selectedCoords.lng));

    const driveTimeUser = Math.max(3, Math.round(distUser * 2.4 + 2));
    const driveTimeBuddy = Math.max(3, Math.round(distBuddy * 2.4 + 2));

    const distDiff = Math.abs(distUser - distBuddy);
    const parityScore = Math.max(30, Math.min(100, Math.round(100 - distDiff * 14)));

    return {
      distUser,
      distBuddy,
      driveTimeUser,
      driveTimeBuddy,
      parityScore,
    };
  }, [myLat, myLng, buddyLat, buddyLng, selectedCoords]);

  const handleSelectGym = (gym: {
    name: string;
    address: string;
    suburb?: string;
    postcode?: string;
    lat: number;
    lng: number;
  }) => {
    setSelectedGym(gym.name);
    setSelectedGymAddress(gym.address);
    if (gym.suburb) setSelectedSuburb(gym.suburb);
    if (gym.postcode) setSelectedPostcode(gym.postcode);
    setSelectedCoords({ lat: gym.lat, lng: gym.lng });
  };

  const handleApplyCustomGym = () => {
    const name = searchName.trim() || 'Custom Training Facility';
    const addr = [searchSuburb.trim(), searchPostcode.trim()].filter(Boolean).join(' ') || 'Metro Area';
    setSelectedGym(name);
    setSelectedGymAddress(addr);
    setSelectedSuburb(searchSuburb.trim() || 'Metro');
    setSelectedPostcode(searchPostcode.trim() || '');
  };

  const canSend = Boolean(selectedDate && selectedTime && selectedGym);

  return (
    <div className="px-3 py-3 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#15171E] space-y-3 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-zinc-900 dark:text-white font-bold text-xs">
              Schedule Training Session
            </h3>
            <p className="text-[9.5px] text-zinc-500 dark:text-white/40">
              Invite {buddy.user_name} to a gym session
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-zinc-400 dark:text-white/40 hover:text-zinc-700 dark:hover:text-white active:scale-90 transition-transform cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Row 1: Minimalist Dropdown Calendar & Small Time Select */}
      <div className="grid grid-cols-2 gap-2">
        {/* Dropdown / Native Date Picker */}
        <div>
          <label className="text-[10px] font-bold text-zinc-600 dark:text-white/60 mb-1 flex items-center gap-1 uppercase tracking-wider">
            <Calendar className="w-3 h-3 text-red-500" />
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-xs font-mono font-medium outline-none focus:border-red-500 shadow-2xs cursor-pointer"
          />
        </div>

        {/* Small Time Select Dropdown */}
        <div>
          <label className="text-[10px] font-bold text-zinc-600 dark:text-white/60 mb-1 flex items-center gap-1 uppercase tracking-wider">
            <Clock className="w-3 h-3 text-red-500" />
            Time
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-xs font-mono font-medium outline-none focus:border-red-500 shadow-2xs cursor-pointer"
          >
            {BOOKING_TIME_SLOTS.map(t => (
              <option key={t} value={t} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real Live Worldwide Gym Search (Name, Suburb, Postcode) */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-200/60 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-zinc-600 dark:text-white/60 uppercase tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-red-500" />
            <span>Search Gym Worldwide</span>
            {isSearchingOnline && (
              <span className="inline-flex items-center gap-1 text-[8.5px] font-mono text-red-500 font-normal ml-1">
                <Globe className="w-2.5 h-2.5 animate-spin" /> Live searching...
              </span>
            )}
          </label>
          {(searchName || searchSuburb || searchPostcode) && (
            <button
              onClick={() => {
                setSearchName('');
                setSearchSuburb('');
                setSearchPostcode('');
                setLiveSearchResults([]);
              }}
              className="text-[9px] text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* 3 Compact inputs: Name, Suburb, Postcode */}
        <div className="grid grid-cols-12 gap-1.5">
          <div className="col-span-6 relative">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Gym name / brand (e.g. Anytime)..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-white/30 outline-none focus:border-red-500 shadow-2xs"
            />
          </div>
          <div className="col-span-4 relative">
            <input
              type="text"
              value={searchSuburb}
              onChange={(e) => setSearchSuburb(e.target.value)}
              placeholder="Suburb / City (e.g. Ringwood)..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-white/30 outline-none focus:border-red-500 shadow-2xs"
            />
          </div>
          <div className="col-span-2 relative">
            <input
              type="text"
              value={searchPostcode}
              onChange={(e) => setSearchPostcode(e.target.value)}
              placeholder="Post / ZIP..."
              className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 dark:placeholder:text-white/30 outline-none focus:border-red-500 shadow-2xs text-center"
            />
          </div>
        </div>

        {/* Instant Action: Always provide 1-tap "Use [Search Term]" when user types */}
        {(searchName.trim() || searchSuburb.trim() || searchPostcode.trim()) && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs">
            <span className="text-[9.5px] text-zinc-700 dark:text-white/80 truncate">
              Entered: <span className="font-bold text-red-600 dark:text-red-400">{[searchName, searchSuburb, searchPostcode].filter(Boolean).join(' ')}</span>
            </span>
            <button
              type="button"
              onClick={handleApplyCustomGym}
              className="px-2 py-0.5 rounded bg-red-500 text-white text-[9.5px] font-bold shrink-0 hover:bg-red-600 active:scale-95 cursor-pointer shadow-2xs"
            >
              Select This
            </button>
          </div>
        )}

        {/* Live Search & Local Results List */}
        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5 mt-1">
          {displayResults.length > 0 ? (
            displayResults.map(gym => {
              const isSelected = selectedGym === gym.name || (selectedGymAddress && selectedGymAddress === gym.address);
              return (
                <div
                  key={gym.id}
                  onClick={() => handleSelectGym(gym)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-500/10 dark:bg-red-500/15 border-red-500 shadow-2xs ring-1 ring-red-400/40'
                      : 'bg-white dark:bg-white/[0.03] border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {gym.name}
                      </span>
                      {gym.source === 'live' && (
                        <span className="text-[7.5px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          LIVE MAP
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                      {gym.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isSelected
                        ? 'bg-red-500 text-white'
                        : 'border border-zinc-300 dark:border-white/20 text-transparent'
                    }`}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/[0.04] text-center space-y-1.5">
              <p className="text-[10px] text-zinc-500 dark:text-white/50">
                {isSearchingOnline ? 'Querying global gym directory...' : 'No exact match found in global directory'}
              </p>
              <button
                type="button"
                onClick={handleApplyCustomGym}
                className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9.5px] font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <MapPinned className="w-3 h-3" />
                Use &ldquo;{[searchName, searchSuburb, searchPostcode].filter(Boolean).join(' ') || 'Custom Gym'}&rdquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional: "You & Blake" Commute parity & corridor (Only opens if user toggles to check) */}
      <div className="pt-1 border-t border-zinc-200/60 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => setShowCommuteSplit(!showCommuteSplit)}
          className="w-full flex items-center justify-between text-[9.5px] font-semibold text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-emerald-500" />
            {showCommuteSplit ? 'Hide Commute Split' : `Check Commute Split (You & ${buddyShortName})`}
          </span>
          <span className="text-[8.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {commuteMetrics.parityScore}% Fair Split
          </span>
        </button>

        {showCommuteSplit && (
          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/25 space-y-1.5 mt-1 animate-fadeIn">
            <div className="flex items-center justify-between text-[9.5px]">
              <div className="flex items-center gap-1 font-bold text-zinc-800 dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>You ({commuteMetrics.driveTimeUser}m · {commuteMetrics.distUser.toFixed(1)}km)</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-zinc-800 dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>{buddyShortName} ({commuteMetrics.driveTimeBuddy}m · {commuteMetrics.distBuddy.toFixed(1)}km)</span>
              </div>
            </div>

            <div className="h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden flex items-center relative">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full border-2 border-emerald-500 shadow-md"
                style={{
                  left: `${Math.min(85, Math.max(15, (commuteMetrics.distUser / (commuteMetrics.distUser + commuteMetrics.distBuddy)) * 100))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Summary pill */}
      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between text-xs">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[9px] font-mono text-zinc-500 dark:text-white/40 uppercase block">Selected Gym:</span>
          <p className="font-bold text-zinc-900 dark:text-white truncate text-[11px]">
            {selectedGym}
          </p>
          <p className="text-[9px] text-zinc-500 dark:text-white/40 truncate">
            {selectedGymAddress}
          </p>
        </div>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 shrink-0">
          {selectedDate} @ {selectedTime}
        </span>
      </div>

      {/* Send Booking CTA */}
      <button
        type="button"
        onClick={() => {
          if (!canSend) return;
          onSend({
            date: selectedDate,
            timeSlot: selectedTime,
            gym: selectedGym,
            gymAddress: selectedGymAddress,
            isMidpoint: showCommuteSplit,
            travelSplit: {
              userDist: `${commuteMetrics.distUser.toFixed(1)} km`,
              buddyDist: `${commuteMetrics.distBuddy.toFixed(1)} km`,
              userTime: `${commuteMetrics.driveTimeUser} min`,
              buddyTime: `${commuteMetrics.driveTimeBuddy} min`,
              parityPercent: commuteMetrics.parityScore,
            },
            status: 'pending',
          });
        }}
        disabled={!canSend}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        <span>Send Session Invite</span>
      </button>
    </div>
  );
};

/* ═══════════════════ Booking Card (in chat) ═══════════════════ */
const BookingCard: React.FC<{
  booking: BookingProposal;
  fromMe: boolean;
  time: string;
  buddyName?: string;
  onSuggestAlternative?: () => void;
}> = ({ booking, fromMe, time, buddyName = 'Buddy', onSuggestAlternative }) => {
  const statusConfig = {
    pending: { icon: <Clock className="w-3 h-3" />, label: 'Pending Response', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    accepted: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Session Confirmed!', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    declined: { icon: <XCircle className="w-3 h-3" />, label: 'Slot Declined', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };
  const st = statusConfig[booking.status];

  const dateObj = new Date(booking.date + 'T00:00:00');
  const dateLabel = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : booking.date;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.gym + ' ' + (booking.gymAddress || ''))}`;

  return (
    <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[88%] rounded-2xl overflow-hidden border border-emerald-500/25 dark:border-emerald-400/20 bg-white dark:bg-[#151722] shadow-sm">
        {/* Header banner */}
        <div className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CalendarPlus className="w-3.5 h-3.5" />
            Gym Session Invite
          </p>
          {booking.isMidpoint && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white flex items-center gap-0.5">
              <Scale className="w-2 h-2" /> MIDPOINT
            </span>
          )}
        </div>

        {/* Body content */}
        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold">{dateLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold">{booking.timeSlot}</span>
          </div>

          <div className="flex items-start gap-2 text-zinc-800 dark:text-white">
            <MapPinned className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight">{booking.gym}</p>
              {booking.gymAddress && (
                <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{booking.gymAddress}</p>
              )}
            </div>
          </div>

          {/* Commute split badge if available */}
          {booking.travelSplit && (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-[9px] font-mono space-y-1">
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="flex items-center gap-1">
                  <Scale className="w-2.5 h-2.5" /> Commute Parity:
                </span>
                <span>{booking.travelSplit.parityPercent || 95}% Fair Split</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Car className="w-2.5 h-2.5 text-zinc-500" /> You: {booking.travelSplit.userTime} ({booking.travelSplit.userDist})</span>
                <span className="flex items-center gap-1"><Car className="w-2.5 h-2.5 text-zinc-500" /> {buddyName}: {booking.travelSplit.buddyTime} ({booking.travelSplit.buddyDist})</span>
              </div>
            </div>
          )}

          {/* Status badge & Map button */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-white/[0.06]">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${st.bg} border`}>
              <span className={st.color}>{st.icon}</span>
              <span className={`text-[9.5px] font-bold ${st.color}`}>{st.label}</span>
              {booking.status === 'pending' && <span className="w-1 h-1 rounded-full bg-amber-500" />}
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>Directions</span>
            </a>
          </div>

          {/* Action buttons if invite is pending and not from me */}
          {!fromMe && booking.status === 'pending' && onSuggestAlternative && (
            <div className="pt-1 flex gap-1.5">
              <button
                onClick={onSuggestAlternative}
                className="flex-1 py-1 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[9.5px] font-bold hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
              >
                Suggest Different Midpoint
              </button>
            </div>
          )}
        </div>

        {/* Footer timestamp */}
        <div className="px-3 pb-1.5 pt-0">
          <p className={`text-[8px] ${fromMe ? 'text-zinc-400 dark:text-white/25 text-right' : 'text-zinc-400 dark:text-white/25'}`}>{time}</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ Buddy Detail Card ═══════════════════ */
const BuddyDetailCard: React.FC<{
  buddy: BuddyProfile;
  isAccepted: boolean;
  isBumped: boolean;
  isLiked: boolean;
  matchPercent: number;
  onAccept: () => void;
  onPass: () => void;
  onFistBump: () => void;
  onLike: () => void;
  onDismiss: () => void;
  onChat: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
  onReport: () => void;
  onBack: () => void;
}> = ({
  buddy, isAccepted, isBumped, isLiked, matchPercent,
  onAccept, onPass, onFistBump, onLike, onDismiss, onChat,
  onUnmatch, onBlock, onReport, onBack
}) => {
  const photos = buddy.photos?.length ? buddy.photos : (buddy.avatar_url ? [buddy.avatar_url] : []);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const initials = buddy.user_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const isOnline = isOnlineFromLastActive(buddy.last_active_at);

  const handlePhotoTap = (e: React.MouseEvent) => {
    if (photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) setPhotoIndex(Math.max(0, photoIndex - 1));
    else setPhotoIndex((photoIndex + 1) % photos.length);
  };

  const statWeightOrFocus = buddy.show_weight !== false
    ? { icon: <Scale className="w-3.5 h-3.5" />, label: 'Weight', value: `${buddy.weight} kg` }
    : { icon: <Activity className="w-3.5 h-3.5" />, label: 'Focus', value: buddy.training_focus || 'Conditioning' };

  return (
    <div className="px-3 pb-6">
      {/* Top action bar: Nude Back button on left, Screen Title in center, Nude 3-dots on right */}
      <div className="safe-top pt-2.5 flex items-center justify-between min-h-[40px] mb-2">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 flex items-center gap-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-xs font-semibold active:scale-90 transition-all cursor-pointer bg-transparent border-0"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
          Athlete Profile
        </span>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 -mr-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all cursor-pointer bg-transparent border-0"
            title="More options"
          >
            <MoreVertical className="w-4.5 h-4.5 stroke-[1.75]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#14141A] border border-white/[0.1] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => { setShowMenu(false); onUnmatch(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-zinc-300 hover:bg-white/[0.08] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5 text-zinc-400" /> Unmatch
              </button>
              <button
                onClick={() => { setShowMenu(false); onBlock(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-red-400 hover:bg-red-500/15 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Block Athlete
              </button>
              <button
                onClick={() => { setShowMenu(false); onReport(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-red-400 hover:bg-red-500/15 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-red-400" /> Report Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-200 dark:bg-white/[0.03] mb-3 cursor-pointer shadow-lg" onClick={handlePhotoTap}>
        {photos.length > 0 ? (
          <>
          <img
            src={photos[photoIndex] || photos[0]}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex'; }}
          />
          <div className="w-full h-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-900 items-center justify-center absolute inset-0" style={{ display: 'none' }}>
            <span className="text-6xl font-bold text-white/60">{initials}</span>
          </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-900 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/60">{initials}</span>
          </div>
        )}

        {photos.length > 1 && (
          <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3">
            {photos.map((_, i) => (
              <div key={i} className={`h-[2px] flex-1 rounded-full transition-all ${i === photoIndex ? 'bg-white' : i < photoIndex ? 'bg-white/60' : 'bg-white/25'}`} />
            ))}
          </div>
        )}

        {/* Match badge - green when online, amber/yellow when offline */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg flex items-center gap-1 z-10 ${
          isOnline
            ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20'
            : 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 shadow-amber-500/20'
        }`}>
          <Zap className="w-3 h-3 text-white" />
          <span className="text-[10px] font-mono font-black text-white">{matchPercent}% Match</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-xl font-bold text-white leading-tight">{buddy.user_name}, {buddy.age}</h2>
          <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-red-400" /> {buddy.distance_km?.toFixed(1)} km away · {buddy.current_gym || buddy.home_gym || 'Partner Gym'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Discipline', value: buddy.discipline },
          { icon: <Star className="w-3.5 h-3.5" />, label: 'Level', value: buddy.experience_level },
          { icon: <Clock className="w-3.5 h-3.5" />, label: 'Time', value: buddy.preferred_time.split(' ')[0] },
          { icon: <Ruler className="w-3.5 h-3.5" />, label: 'Height', value: `${buddy.height} cm` },
          statWeightOrFocus,
          { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Gym', value: buddy.current_gym || buddy.home_gym || '-' },
        ].map((s, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-[#121217] border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-red-500 flex justify-center mb-0.5">{s.icon}</div>
            <p className="text-zinc-900 dark:text-white font-bold text-[10px] truncate">{s.value}</p>
            <p className="text-zinc-500 dark:text-white/40 text-[9px] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Streamlined Apple Pro 2-State Action Bar */}
      {!isAccepted ? (
        /* State A: Discovering / Pending Request Action Bar: 50/50 Even Symmetrical Actions */
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onPass}
            className="flex-1 py-3.5 rounded-2xl bg-[#121217] hover:bg-zinc-800 text-zinc-300 hover:text-red-400 font-bold text-xs border border-zinc-700/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" /> Pass
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Accept
          </button>
        </div>
      ) : (
        /* State B: Connected Athlete: Fast Action Row */
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onChat}
            className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </button>
          <button
            onClick={onDismiss}
            className="w-12 h-12 rounded-2xl bg-[#121217] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-90 cursor-pointer shrink-0"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════ Filter Panel ═══════════════════ */
const FilterPanel: React.FC<{
  filters: RadarFilters;
  setFilters: (f: RadarFilters) => void;
  homeGymOnly: boolean;
  setHomeGymOnly: (v: boolean) => void;
  onApply: () => void;
  onReset: () => void;
  isPaid?: boolean;
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}> = ({ filters, setFilters, homeGymOnly, setHomeGymOnly, onApply, onReset, isPaid = false, onOpenPayPlan, showToast }) => {
  return (
    <div className="px-3 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-red-400" /> All Filters
        </h2>
        <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white/80 active:scale-95 transition-all">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Age Range */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-zinc-700 dark:text-white/60 text-xs font-medium">Age Range</label>
          <span className="text-red-500 dark:text-red-400 text-xs font-bold">{filters.ageRange[0]} - {filters.ageRange[1]}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {AGE_PRESETS.map((p) => {
            const active = filters.ageRange[0] === p.range[0] && filters.ageRange[1] === p.range[1];
            return (
              <button
                key={p.label}
                onClick={() => setFilters({ ...filters, ageRange: p.range })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-95 ${
                  active
                    ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-zinc-500 dark:text-white/35 text-[10px] w-7">Min</span>
            <input type="range" min={16} max={65} value={filters.ageRange[0]}
              onChange={(e) => setFilters({ ...filters, ageRange: [+e.target.value, Math.max(+e.target.value, filters.ageRange[1])] })}
              className="flex-1 accent-red-500 h-1 rounded-full appearance-none bg-zinc-200 dark:bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-zinc-500 dark:text-white/35 text-[10px] w-7">Max</span>
            <input type="range" min={16} max={65} value={filters.ageRange[1]}
              onChange={(e) => setFilters({ ...filters, ageRange: [Math.min(filters.ageRange[0], +e.target.value), +e.target.value] })}
              className="flex-1 accent-red-500 h-1 rounded-full appearance-none bg-zinc-200 dark:bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Distance & Regional Corridor */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-zinc-700 dark:text-white/60 text-xs font-medium">Search Radius</label>
            {filters.radiusKm > 25 && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-[8px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">
                {!isPaid && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                {filters.radiusKm > 50 ? 'Regional Corridor' : 'Expanded Radius'}
              </span>
            )}
          </div>
          <span className="text-red-500 dark:text-red-400 text-xs font-bold font-mono">{filters.radiusKm} km</span>
        </div>

        {/* Quick Distance Presets */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {[
            { label: '10 km', km: 10, locked: false },
            { label: '25 km', km: 25, locked: false },
            { label: '50 km', km: 50, locked: !isPaid },
            { label: '100 km', km: 100, locked: !isPaid },
            { label: '150 km', km: 150, locked: !isPaid },
            { label: '250 km', km: 250, locked: !isPaid },
          ].map((preset) => {
            const active = filters.radiusKm === preset.km;
            return (
              <button
                key={preset.km}
                type="button"
                onClick={() => {
                  if (preset.locked) {
                    showToast?.('Radiuses above 25 km require Premium Pro or Founder Pass.', 'error');
                    onOpenPayPlan?.('premium');
                    return;
                  }
                  setFilters({ ...filters, radiusKm: preset.km });
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  active
                    ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                    : preset.locked
                    ? 'bg-zinc-900/60 text-zinc-500 border border-zinc-800'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]'
                }`}
              >
                {preset.locked && <Lock className="w-2.5 h-2.5 text-amber-400/80" />}
                {preset.label}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={1}
          max={isPaid ? 250 : 25}
          value={Math.min(filters.radiusKm, isPaid ? 250 : 25)}
          onChange={(e) => {
            const val = +e.target.value;
            if (val > 25 && !isPaid) {
              showToast?.('Radius above 25 km is locked to Premium Pro.', 'error');
              onOpenPayPlan?.('premium');
              return;
            }
            setFilters({ ...filters, radiusKm: val });
          }}
          className="w-full accent-red-500 h-1 rounded-full appearance-none bg-zinc-200 dark:bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
        />
        <div className="flex justify-between mt-1 mb-2">
          <span className="text-zinc-400 dark:text-white/25 text-[9px]">1 km (Local)</span>
          <span className="text-zinc-400 dark:text-white/25 text-[9px]">25 km (Free Cap)</span>
          <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${isPaid ? 'text-red-400/80' : 'text-amber-400/80'}`}>
            {!isPaid && <Lock className="w-2.5 h-2.5" />} 250 km (Pro)
          </span>
        </div>

        <button
          onClick={() => setHomeGymOnly(!homeGymOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
            homeGymOnly
              ? 'bg-red-500/15 text-red-400 border border-red-500/25'
              : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]'
          }`}
        >
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
            homeGymOnly ? 'bg-red-500 border-red-500' : 'border-zinc-400 dark:border-white/25'
          }`}>
            {homeGymOnly && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          My home gym only
        </button>
      </div>

      {/* Discipline */}
      <div className="mb-5">
        <label className="text-zinc-700 dark:text-white/60 text-xs font-medium mb-2 block">Discipline</label>
        <div className="flex flex-wrap gap-1.5">
          {DISCIPLINES.map((d) => {
            const active = filters.disciplines.includes(d);
            return (
              <button
                key={d}
                onClick={() => setFilters({
                  ...filters,
                  disciplines: active ? filters.disciplines.filter(x => x !== d) : [...filters.disciplines, d],
                })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                  active
                    ? 'bg-red-500/25 text-red-400 border border-red-500/35'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time */}
      <div className="mb-6">
        <label className="text-zinc-700 dark:text-white/60 text-xs font-medium mb-2 block">Workout Time</label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_SLOTS.map((t) => {
            const active = filters.preferredTimes.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFilters({
                  ...filters,
                  preferredTimes: active ? filters.preferredTimes.filter(x => x !== t) : [...filters.preferredTimes, t],
                })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                  active
                    ? 'bg-red-500/25 text-red-400 border border-red-500/35'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onApply}
        className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 active:scale-[0.97] transition-transform"
      >
        <Check className="w-4 h-4" /> Apply Filters
      </button>
    </div>
  );
};

/* ═══════════════════ Privacy Panel ═══════════════════ */
const PrivacyPanel: React.FC<{
  ghostMode: boolean;
  gymSharing: boolean;
  publicTelemetry: boolean;
  showWeight: boolean;
  onToggle: (field: string, value: boolean) => void;
}> = ({ ghostMode, gymSharing, publicTelemetry, showWeight, onToggle }) => (
  <div className="px-3 pb-6">
    <h2 className="text-zinc-900 dark:text-white font-bold text-sm mb-1.5 flex items-center gap-1.5">
      <Shield className="w-4 h-4 text-red-400" /> Privacy & Body Metrics
    </h2>
    <p className="text-zinc-500 dark:text-white/35 text-[10px] mb-4">Control profile visibility and athlete body telemetry</p>

    <div className="space-y-3">
      <PrivacyToggleRow
        icon={<Scale className="w-4 h-4" />}
        title="Display Body Weight"
        description="Show your body weight on your public profile card. If disabled, your athletic focus is shown instead."
        value={showWeight}
        onChange={(v) => onToggle('show_weight', v)}
      />
      <PrivacyToggleRow
        icon={<EyeOff className="w-4 h-4" />}
        title="Ghost Mode"
        description="Hide completely from the radar. You can still browse others."
        value={ghostMode}
        onChange={(v) => onToggle('is_ghost_mode', v)}
        destructive
      />
      <PrivacyToggleRow
        icon={<Radio className="w-4 h-4" />}
        title="Gym Zone Sharing"
        description="Broadcasts your info on the Buddy Radar."
        value={gymSharing}
        onChange={(v) => onToggle('gym_zone_sharing', v)}
      />
      <PrivacyToggleRow
        icon={<Activity className="w-4 h-4" />}
        title="Public Telemetry"
        description="Share your PRs and streak on your public card."
        value={publicTelemetry}
        onChange={(v) => onToggle('public_telemetry', v)}
      />
    </div>
  </div>
);

const PrivacyToggleRow: React.FC<{
  icon: React.ReactNode; title: string; description: string;
  value: boolean; onChange: (v: boolean) => void; destructive?: boolean;
}> = ({ icon, title, description, value, onChange, destructive }) => (
  <div className={`p-3 rounded-xl border transition-all ${
    destructive && value ? 'bg-red-500/10 border-red-500/25' : 'bg-zinc-100 dark:bg-white/[0.03] border-zinc-200/60 dark:border-white/[0.06]'
  }`}>
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-red-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-zinc-900 dark:text-white font-semibold text-xs">{title}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            style={{
              minWidth: '48px',
              width: '48px',
              maxWidth: '48px',
              minHeight: '26px',
              height: '26px',
              maxHeight: '26px',
            }}
            className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none select-none ${
              value ? 'bg-[#EA4335]' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
              }}
              className={`pointer-events-none inline-block shrink-0 rounded-full transition-transform duration-200 ease-in-out ${
                value ? 'translate-x-[22px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-zinc-500 dark:text-white/35 text-[10px] mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
