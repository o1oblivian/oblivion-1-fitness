import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRadarStore } from '../../stores/useRadarStore';
import { DemoAthlete } from './types';
import { AthleteGridCard } from './components/AthleteGridCard';
import { DiscoverHeader } from './components/DiscoverHeader';
import { RadarModalsContainer } from './components/RadarModalsContainer';
import { tactileEngine } from '../../services/tactileEngine';
import { CheckCircle2, Radar, RotateCcw, Users, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { searchAthletesWithSupabase } from './services/buddyService';
import { useBuddyRealtime } from './hooks/useBuddyRealtime';
import { useBuddyMessageStore } from '../../stores/useBuddyMessageStore';
import { TacticalRadarScanner } from './components/TacticalRadarScanner';

export const BuddyView: React.FC = () => {
  const storeBuddies = useRadarStore((s) => s.buddies);
  const travelCity = useRadarStore((s) => s.travelCity);
  const travelOrigin = useRadarStore((s) => s.travelOrigin);
  const travelRadiusKm = useRadarStore((s) => s.travelRadiusKm);
  const setTravelDetails = useRadarStore((s) => s.setTravelDetails);

  const buddies = useMemo(() => {
    return storeBuddies;
  }, [storeBuddies]);

  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'MATCHED'>('DISCOVER');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(travelRadiusKm || 25);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [likedAthletes, setLikedAthletes] = useState<Record<string, boolean>>({});
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Keep radius in sync with travelRadiusKm if changed in modal
  useEffect(() => {
    if (travelRadiusKm) {
      setRadiusKm(travelRadiusKm);
    }
  }, [travelRadiusKm]);

  // Genuine Wired Search State & Supabase Integration
  const [searchResults, setSearchResults] = useState<DemoAthlete[]>(buddies);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);

  // Initial and reactive live Supabase buddy_profiles sync
  useEffect(() => {
    let isCancelled = false;

    const loadLiveBuddies = async () => {
      setIsSearchingSupabase(true);
      setSupabaseError(null);
      try {
        const activeQuery = searchQuery.trim() || travelCity || '';
        const { results } = await searchAthletesWithSupabase(
          activeQuery,
          [],
          { latitude: -33.8688, longitude: 151.2093 },
          radiusKm
        );
        if (!isCancelled) {
          useRadarStore.getState().setBuddies(results);
          setSearchResults(results);
          setIsSearchingSupabase(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[Radar] Live buddy_profiles query error:', err);
          setSupabaseError(err?.message || 'Database network error reading buddy_profiles');
          setIsSearchingSupabase(false);
        }
      }
    };

    loadLiveBuddies();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, travelCity, radiusKm]);

  const [selectedProfileAthlete, setSelectedProfileAthlete] = useState<DemoAthlete | null>(null);
  const [selectedMessageAthlete, setSelectedMessageAthlete] = useState<DemoAthlete | null>(null);
  const [selectedBookingAthlete, setSelectedBookingAthlete] = useState<DemoAthlete | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Realtime Supabase CDC Listener for buddy_messages
  useBuddyRealtime({
    currentUserId: 'current-athlete',
    onMessageReceived: (msg) => {
      tactileEngine.triggerSelectionBuzz();
      setToastMessage(`💬 New message received`);
      setTimeout(() => setToastMessage(null), 3000);
    },
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isTravelHubOpen, setIsTravelHubOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'PROFILE' | 'FILTERS' | 'PREVIEW'>('PROFILE');

  useEffect(() => {
    const handleOpenStudio = () => {
      setIsStudioOpen(true);
      setStudioTab('PROFILE');
    };
    window.addEventListener('o1fc_open_radar_profile_studio', handleOpenStudio);
    return () => {
      window.removeEventListener('o1fc_open_radar_profile_studio', handleOpenStudio);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { isPro, openPaywall } = useSubscription();

  const handleScan = async () => {
    if (!isPro) {
      openPaywall('Buddy Match Radar');
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    setIsScanning(true);
    setDismissedIds([]);
    setSupabaseError(null);

    try {
      const activeQuery = searchQuery.trim() || travelCity || '';
      const { results } = await searchAthletesWithSupabase(
        activeQuery,
        [],
        { latitude: -33.8688, longitude: 151.2093 },
        radiusKm
      );
      useRadarStore.getState().setBuddies(results);
      setSearchResults(results);
      showToast(`Scan complete: ${results.length} athletes nearby`);
    } catch (err: any) {
      console.error('[Radar Scan] Live Supabase query error:', err);
      setSupabaseError(err?.message || 'Database network error');
      showToast('Scan complete: 0 athletes detected');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTabChange = (tab: 'DISCOVER' | 'MATCHED') => {
    if (tab === 'MATCHED' && !isPro) {
      openPaywall('Buddy Match Radar');
      return;
    }
    setActiveTab(tab);
  };

  const filteredAthletes = useMemo(() => {
    return searchResults.filter((ath) => {
      if (dismissedIds.includes(ath.id)) return false;
      if (activeTab === 'MATCHED' && !likedAthletes[ath.id]) return false;
      if (verifiedOnly && !ath.is_verified) return false;
      return true;
    });
  }, [searchResults, dismissedIds, activeTab, likedAthletes, verifiedOnly]);

  return (
    <div className="w-full h-auto min-h-full bg-[#F4F4F7] dark:bg-[#09090b] text-neutral-900 dark:text-white pb-10 px-3.5 pt-1 transition-colors">
      <DiscoverHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        matchedCount={Object.values(likedAthletes).filter(Boolean).length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        count={filteredAthletes.length}
        radiusKm={radiusKm}
        isScanning={isScanning || isSearchingSupabase}
        onScan={handleScan}
        onBack={() => { if (searchQuery) setSearchQuery(''); else if (activeTab === 'MATCHED') setActiveTab('DISCOVER'); }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenProfile={() => {
          setIsStudioOpen(true);
          setStudioTab('PROFILE');
        }}
        onOpenFilters={() => {
          setIsStudioOpen(true);
          setStudioTab('FILTERS');
        }}
        onOpenTravelHub={() => {
          if (!isPro) {
            openPaywall('Global Travel Radar Pass');
            return;
          }
          setIsTravelHubOpen(true);
        }}
        onOpenSetup={() => {
          setIsStudioOpen(true);
          setStudioTab('PROFILE');
        }}
        travelCity={travelCity}
        travelOrigin={travelOrigin}
        onClearTravelCorridor={() => {
          setTravelDetails({
            travelCity: '',
            travelDestinationCode: '',
            travelOrigin: '',
            travelOriginCode: '',
          });
          showToast('Switched back to local radar');
        }}
      />

      {supabaseError && (
        <div className="mx-3 my-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono font-bold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-0.5">
            <span className="block font-tactical tracking-wide uppercase">RADAR SUPABASE QUERY ERROR</span>
            <span className="text-[11px] font-mono text-red-400 font-normal">{supabaseError}</span>
          </div>
        </div>
      )}

      <div className="px-3 pt-1">
        {buddies.length === 0 ? (
          <div id="radar-empty-state" className="mt-4 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 text-center space-y-5 shadow-md dark:shadow-xl">
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-sm font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                NO ATHLETES IN PROXIMITY • RADIUS SEARCH ACTIVE
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono leading-relaxed">
                Scanning {travelCity ? `${travelCity} athletes` : 'nearby athletes'} · Awaiting peer beacon signal.
              </p>
            </div>

            {/* Tactical Radar Scanner with 3 Concentric Rings & Rotating Crimson Sweep */}
            <TacticalRadarScanner radiusKm={radiusKm || 5} className="py-2" />

            <div className="flex items-center justify-center pt-1 w-full max-w-xs">
              <button
                id="rescan-radar-corridor-btn"
                type="button"
                onClick={handleScan}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#c40812] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>RESCAN NEARBY</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 mt-1 pb-3">
            <div className="flex items-center justify-between px-1 py-1 select-none">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                {filteredAthletes.length} ATHLETES FOUND
              </span>
              <button
                id="radar-verified-only-btn"
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setVerifiedOnly((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer border ${
                  verifiedOnly
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-white dark:bg-[#121214] border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className={`w-3 h-3 ${verifiedOnly ? 'text-cyan-300' : 'text-neutral-400'}`} />
                <span>VERIFIED ATHLETES ONLY</span>
              </button>
            </div>

            {filteredAthletes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
                <p className="text-xs font-mono font-bold uppercase text-neutral-400">NO VERIFIED ATHLETES IN THIS CORRIDOR</p>
                <p className="text-[11px] text-neutral-500">Toggle "VERIFIED ATHLETES ONLY" off or verify your own athlete profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredAthletes.map((athlete) => {
                  const isLiked = Boolean(likedAthletes[athlete.id]);
                  return (
                    <AthleteGridCard
                      key={athlete.id}
                      athlete={athlete}
                      isLiked={isLiked}
                      onOpenProfile={(ath) => setSelectedProfileAthlete(ath)}
                      onOpenMessage={(ath) => setSelectedMessageAthlete(ath)}
                      onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
                      onLikeToggle={(ath, newLikedState) => {
                        tactileEngine.triggerSelectionBuzz();
                        if (!isPro && Object.keys(likedAthletes).length >= 5 && newLikedState) {
                          openPaywall('Unlimited Radar Connections');
                          return;
                        }
                        setLikedAthletes((prev) => ({ ...prev, [ath.id]: newLikedState }));
                        showToast(newLikedState ? `Saved ${ath.name}` : `Removed ${ath.name}`);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {buddies.length > 0 && filteredAthletes.length === 0 && (
          <div className="py-16 text-center space-y-3 px-4">
            {activeTab === 'MATCHED' ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-tactical font-bold text-neutral-900 dark:text-white uppercase">NO SAVED ATHLETES YET</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Heart athletes in Discover to add them to your active chats & training syncs.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-xs text-neutral-400 font-mono font-bold uppercase tracking-wide">
                  NO ATHLETES IN PROXIMITY • RADIUS SEARCH ACTIVE
                </p>
                <TacticalRadarScanner radiusKm={radiusKm || 5} className="py-1" />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (travelCity) setTravelDetails({ travelCity: '' });
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-[#141418] border border-neutral-300 dark:border-white/10 text-white text-xs font-mono font-bold shadow-xs hover:bg-neutral-800 dark:hover:bg-[#1a1a20] cursor-pointer"
                >
                  Reset Radar Corridor
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <RadarModalsContainer
        profileTarget={selectedProfileAthlete}
        onCloseProfile={() => setSelectedProfileAthlete(null)}
        onPassProfile={(ath) => {
          setSelectedProfileAthlete(null);
          setDismissedIds((prev) => [...prev, ath.id]);
          showToast(`Passed on ${ath.name}`);
        }}
        onAcceptProfile={(ath) => {
          setSelectedProfileAthlete(null);
          setLikedAthletes((prev) => ({ ...prev, [ath.id]: true }));
          showToast(`Mutual match with ${ath.name}!`);
          // Automatically unlock curated icebreaker messaging request modal
          setTimeout(() => {
            setSelectedMessageAthlete(ath);
          }, 300);
        }}
        messageTarget={selectedMessageAthlete}
        onCloseMessage={() => setSelectedMessageAthlete(null)}
        onSendInvite={({ gym, dateTime }) => showToast(`Session invite sent for ${gym} (${dateTime})`)}
        scheduleTarget={selectedBookingAthlete}
        onCloseSchedule={() => setSelectedBookingAthlete(null)}
        onInviteSent={({ gym, dateTime }) => showToast(`Training session booked at ${gym} (${dateTime})`)}
        isPrivacyOpen={isPrivacyOpen}
        onClosePrivacy={() => setIsPrivacyOpen(false)}
        onPrivacySaved={() => showToast('Stealth & privacy parameters updated')}
        isFiltersOpen={isFiltersOpen}
        onCloseFilters={() => setIsFiltersOpen(false)}
        onApplyFilters={(f) => { if (f.radiusKm) setRadiusKm(f.radiusKm); showToast(`Filters applied: ${f.radiusKm || radiusKm} km`); }}
        isTravelHubOpen={isTravelHubOpen}
        onCloseTravelHub={() => setIsTravelHubOpen(false)}
        onSelectDestination={(city, newRadius, originCity) => {
          if (newRadius) setRadiusKm(newRadius);
          showToast(`Corridor active: ${originCity || 'Origin'} ➔ ${city} (${newRadius || radiusKm} km radius)`);
        }}
        isSetupOpen={isSetupOpen}
        onCloseSetup={() => setIsSetupOpen(false)}
        onSetupActivated={(p) => showToast(`Radar pass active: ${p.name}`)}
        isStudioOpen={isStudioOpen}
        studioInitialTab={studioTab}
        onCloseStudio={() => setIsStudioOpen(false)}
        destinationCity={travelCity || ''}
        travelRadiusKm={radiusKm}
      />

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 dark:bg-[#18181c] border border-neutral-700 dark:border-white/15 text-white px-4 py-2.5 rounded-full text-xs font-mono font-medium shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default BuddyView;
