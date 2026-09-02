import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Search,
  Lock,
  Sparkles,
  X,
  Plane,
  Dumbbell,
  Users,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  Send,
  Navigation,
  Globe,
} from 'lucide-react';
import {
  fetchGymVenues,
  fetchBuddyProfiles,
  sendBuddyConnectionRequest,
  type GymVenue,
  type BuddyMatchResult,
} from '@/utils/gymNetworkStore';
import { upsertUserProfile } from '@/utils/subscriptionStore';
import { getSessionUserEmail, getUserState } from '@/utils/authStorage';
import { triggerHaptic } from '@/utils/haptics';

interface TravelPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const TravelPassModal: React.FC<TravelPassModalProps> = ({
  isOpen,
  onClose,
  onOpenPayPlan,
  showToast,
}) => {
  const [destination, setDestination] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'athletes' | 'gyms'>('athletes');

  const [travelRadiusKm, setTravelRadiusKm] = useState(50);
  const [travelVenues, setTravelVenues] = useState<GymVenue[]>([]);
  const [travelBuddies, setTravelBuddies] = useState<BuddyMatchResult[]>([]);
  const [connectedBuddyIds, setConnectedBuddyIds] = useState<Set<string>>(new Set());

  const [promoCode, setPromoCode] = useState('');
  const [promoNotice, setPromoNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isVip, setIsVip] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('o1fc_vip_creator') === 'true';
  });

  const userEmail = getSessionUserEmail() || 'athlete@ofc.com';
  const userState = getUserState(userEmail);
  const userName = userState?.athleteName || userEmail.split('@')[0] || 'Athlete';

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search query executor
  const performSearch = useCallback(async (query: string, customRadius?: number) => {
    const term = query.trim();
    if (!term) {
      setTravelVenues([]);
      setTravelBuddies([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    const radiusToUse = customRadius ?? travelRadiusKm;
    try {
      const [venues, buddies] = await Promise.all([
        fetchGymVenues(term),
        fetchBuddyProfiles({
          city_town: term,
          searchQuery: term,
          maxDistanceKm: radiusToUse,
        }),
      ]);

      setTravelVenues(venues);
      setTravelBuddies(buddies);
    } catch {
      // Graceful fallback
    } finally {
      setIsSearching(false);
    }
  }, [travelRadiusKm]);

  // Live Instant Search with Debounce
  useEffect(() => {
    if (!isOpen) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (destination.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        performSearch(destination);
      }, 250);
    } else if (!destination.trim()) {
      setTravelVenues([]);
      setTravelBuddies([]);
      setHasSearched(false);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [destination, isOpen, performSearch]);

  if (!isOpen) return null;

  const handleManualSearch = () => {
    triggerHaptic('medium');
    if (!destination.trim()) {
      setDestination('Sydney');
      performSearch('Sydney');
    } else {
      performSearch(destination);
    }
  };

  // Connect with Athlete
  const handleConnectAthlete = async (buddy: BuddyMatchResult) => {
    if (connectedBuddyIds.has(buddy.user.id)) return;
    triggerHaptic('medium');

    try {
      const tripNote = destination ? ` traveling to ${destination}` : '';
      await sendBuddyConnectionRequest(
        userEmail,
        userName,
        '',
        buddy.user.user_email,
        `Hey ${buddy.user.user_name}! I'm an athlete${tripNote} and would love to train together.`
      );

      setConnectedBuddyIds((prev) => new Set(prev).add(buddy.user.id));
      showToast?.(`Connection request sent to ${buddy.user.user_name}`, 'success');
      triggerHaptic('success');
    } catch {
      showToast?.('Could not send connection request.', 'error');
    }
  };

  // Promo Code Engine
  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    triggerHaptic('medium');

    setPromoNotice({ text: 'Promo codes are applied at checkout', type: 'info' as any });
    showToast?.('Enter your promotion code at Stripe checkout for discount', 'success');
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto font-sans select-none flex justify-center items-start sm:p-4">
      <div className="bg-white dark:bg-[#0D0D0E] text-zinc-900 dark:text-white w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col my-0 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* TOP DRAG HANDLE */}
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
        </div>

        {/* TOP BAR */}
        <div className="px-5 py-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:pt-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 text-xs font-semibold tracking-tight transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Plane className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-bold tracking-widest uppercase font-mono text-zinc-800 dark:text-zinc-200">
              Travel Hub
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-nude-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-5 sm:p-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1.75rem))] space-y-6 flex-1 overflow-y-auto">
          {/* TITLE & BADGE */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold">
              <Plane className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <span>TRAVEL MODE</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Train Anywhere in the World
            </h2>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Set your travel destination and trip dates to discover verified gym partners, book day passes, and train with local athletes before you land.
            </p>
          </div>

          {/* INPUT FIELDS */}
          <div className="space-y-4">
            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                <span>Destination City / Gym</span>
                {isSearching && (
                  <span className="text-zinc-500 font-normal normal-case flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-500 dark:text-zinc-400" />
                    Searching...
                  </span>
                )}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where are you headed?"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-9 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors"
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
                  Arrival
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
                  Departure
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Search Radius / Regional Corridor Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  <span>Search Corridor Radius</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-red-500 dark:text-red-400">
                  {travelRadiusKm} km
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '25 km', km: 25 },
                  { label: '50 km', km: 50 },
                  { label: '100 km', km: 100 },
                  { label: '250 km', km: 250 },
                ].map((preset) => (
                  <button
                    key={preset.km}
                    type="button"
                    onClick={() => {
                      setTravelRadiusKm(preset.km);
                      if (destination.trim()) {
                        performSearch(destination, preset.km);
                      }
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      travelRadiusKm === preset.km
                        ? 'bg-zinc-800 dark:bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearching}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search Local Athletes</span>
            </button>
          </div>

          {/* LIVE SEARCH RESULTS (Shown when user searches) */}
          {hasSearched && (
            <div className="space-y-3 pt-2">
              {/* Segmented Filter */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('athletes')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'athletes'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Athletes ({travelBuddies.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gyms')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'gyms'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Gyms ({travelVenues.length})</span>
                </button>
              </div>

              {/* Athletes Tab */}
              {activeTab === 'athletes' && (
                <div className="space-y-2">
                  {travelBuddies.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-center space-y-2.5">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        No athletes indexed directly within {travelRadiusKm} km of {destination || 'this location'}.
                      </p>
                      {travelRadiusKm < 250 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTravelRadiusKm(250);
                            performSearch(destination, 250);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Expand to 250 km Corridor</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    travelBuddies.map((b) => {
                      const isConnected = connectedBuddyIds.has(b.user.id);
                      return (
                        <div
                          key={b.user.id}
                          className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {b.user.user_avatar ? (
                              <img
                                src={b.user.user_avatar}
                                alt={b.user.user_name}
                                className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center">
                                {b.user.user_name?.[0]?.toUpperCase() || 'A'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                {b.user.user_name}
                              </p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {b.user.training_focus || b.user.favorite_gym || 'Athlete'}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isConnected ? (
                              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Sent</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConnectAthlete(b)}
                                className="px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Send className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                                <span>Connect</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Gyms Tab */}
              {activeTab === 'gyms' && (
                <div className="space-y-2">
                  {travelVenues.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      No verified gym locations found.
                    </div>
                  ) : (
                    travelVenues.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{v.name}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            <span>{v.address}</span>
                          </p>
                        </div>

                        {v.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${v.name} ${v.address}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                            title="View on Google Maps"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* PREMIUM TRAVEL MODE CARD */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/90 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h4 className="text-xs sm:text-sm font-semibold">
                  Upgrade to Premium to message athletes before landing.
                </h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Search for gyms and athletes at your destination. Unlock day passes, buddy matching, and direct messaging.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>Buddy Matching</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>Gym Finding</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>Verified Profiles</span>
              </span>
            </div>

            {/* Unlock Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onClose();
                onOpenPayPlan?.('premium');
              }}
              className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-[#607368] dark:hover:bg-[#6e8377] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Unlock Travel Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Premium Travel • $15.99/mo
              </span>
            </div>

            {/* Promo Code Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoNotice(null);
                }}
                placeholder="PROMO CODE"
                className="flex-1 bg-white dark:bg-black/60 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none uppercase"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {promoNotice && (
              <p
                className={`text-[11px] font-mono text-center ${
                  promoNotice.type === 'success' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {promoNotice.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
