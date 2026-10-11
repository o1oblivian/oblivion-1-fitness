import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRadarStore } from '../../stores/useRadarStore';
import { DemoAthlete } from './types';
import { BuddyDeckCard } from './components/BuddyDeckCard';
import { DiscoverHeader } from './components/DiscoverHeader';
import { RadarModalsContainer } from './components/RadarModalsContainer';
import { tactileEngine } from '../../services/tactileEngine';
import { CheckCircle2 } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { searchAthletesWithSupabase, localBuddyCards } from './services/buddyService';
import { capRadius, rankAthletes, readDeckFilters, readMutuals, readOutgoing, readPasses, rememberLike, rememberPass, sendLike, writeDeckFilters, DeckFilters, FREE_RADIUS_KM, searchRadius, rememberMutual, readBlocks, readLastLines, syncMutuals, syncBlocks, publishBlock, publishReport, fetchBuddyCardsById, withdrawLike, clearPasses } from './services/buddyMatch';
import { BuddyFilterSheet } from './components/BuddyFilterSheet';
import { publishBuddyCard } from '../../services/buddyPresenceSync';
import { readBuddyGate, subscribeBuddyGate } from './services/buddyLaunch';
import { FoundingLiftersQueue } from './components/FoundingLiftersQueue';
import { getDeviceCoordinates, requestDeviceLocation } from '../../services/deviceLocation';
import { useBuddyRealtime } from './hooks/useBuddyRealtime';
import { getAuthenticatedUserId } from '../../services/authUser';
import { readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';
import { findNearbyCoaches, NearbyCoach } from './services/coachesNearby';
import { CoachesNearbyStrip } from './components/CoachesNearbyStrip';
import { CoachNearbySheet } from './components/CoachNearbySheet';

export const BuddyView: React.FC = () => {
  const storeBuddies = useRadarStore((s) => s.buddies);
  const travelCity = useRadarStore((s) => s.travelCity);
  const travelOrigin = useRadarStore((s) => s.travelOrigin);
  const travelRadiusKm = useRadarStore((s) => s.travelRadiusKm);
  const travelLat = useRadarStore((s) => s.travelLat);
  const travelLng = useRadarStore((s) => s.travelLng);
  const setTravelDetails = useRadarStore((s) => s.setTravelDetails);

  const buddies = useMemo(() => {
    return storeBuddies;
  }, [storeBuddies]);

  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'MATCHED'>('DISCOVER');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(travelRadiusKm || 25);
  const [deckFilters, setDeckFilters] = useState<DeckFilters>(() => readDeckFilters());
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => readPasses());
  const [likedAthletes, setLikedAthletes] = useState<Record<string, boolean>>(() => readOutgoing());
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Genuine Wired Search State & Supabase Integration
  const [searchResults, setSearchResults] = useState<DemoAthlete[]>(buddies);
  const [nearbyPeople, setNearbyPeople] = useState<DemoAthlete[]>([]);
  const [coaches, setCoaches] = useState<NearbyCoach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<NearbyCoach | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationOn, setLocationOn] = useState<boolean | null>(null);
  const [locating, setLocating] = useState(false);
  const [radarUid, setRadarUid] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [buddyLive, setBuddyLive] = useState(false);
  const [buddyReady, setBuddyReady] = useState(false);
  const [areaCount, setAreaCount] = useState<number | null>(null);
  const [areaThreshold, setAreaThreshold] = useState(250);
  const [queueRevision, setQueueRevision] = useState(0);
  const photoWarningShown = useRef(false);
  const ghostMode = useBuddyProfileStore((s) => s.ghostMode);
  const isBuddyProfileActive = useBuddyProfileStore((s) => s.isBuddyProfileActive);
  const buddyProfile = useBuddyProfileStore();
  const { isPro, openPaywall } = useSubscription();
  const [mutuals, setMutuals] = useState<Record<string, true>>(() => readMutuals());
  const [blocks, setBlocks] = useState<string[]>(() => readBlocks());
  const [remoteChats, setRemoteChats] = useState<DemoAthlete[]>([]);
  const [lastLines, setLastLines] = useState<Record<string, string>>(() => readLastLines());

  useEffect(() => {
    const cap = capRadius(isPro, travelRadiusKm || radiusKm);
    if (cap !== radiusKm) setRadiusKm(cap);
  }, [isPro, travelRadiusKm, radiusKm]);

  useEffect(() => {
    void getAuthenticatedUserId().then((id) => {
      setRadarUid(id || '');
      setAuthReady(true);
    });
    void getDeviceCoordinates().then((coords) => {
      if (!coords) {
        setLocationOn(false);
        return;
      }
      setLocationOn(true);
      setUserCoords(coords);
    });
  }, []);

  useEffect(() => {
    if (!userCoords || !buddyProfile.displayName.trim() || buddyProfile.age < 18) return;
    let cancelled = false;
    const looking = buddyProfile.partnerBio.split('\n')[1]?.trim() || '';
    void publishBuddyCard(userCoords, {
      displayName: buddyProfile.displayName,
      age: buddyProfile.age,
      homeGym: buddyProfile.homeGym,
      discipline: buddyProfile.selectedDisciplines[0] || '',
      split: buddyProfile.favoriteWorkouts[0] || '',
      time: buddyProfile.preferredTimes[0] || '',
      bio: buddyProfile.partnerBio,
      photo: buddyProfile.buddyPhotos[0] || '',
      experience: buddyProfile.experienceLevel,
      ghost: buddyProfile.ghostMode,
      gender: buddyProfile.gender,
      lookingFor: looking,
      place: buddyProfile.trainingPlace || (buddyProfile.homeGym ? 'gym' : ''),
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setToastMessage(result.error || 'Your card did not save');
        window.setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (result.warning && !photoWarningShown.current) {
        photoWarningShown.current = true;
        setToastMessage(result.warning);
        window.setTimeout(() => setToastMessage(null), 3000);
      }
      setQueueRevision((n) => n + 1);
    });
    return () => { cancelled = true; };
  }, [userCoords, buddyProfile.displayName, buddyProfile.age, buddyProfile.homeGym, buddyProfile.selectedDisciplines, buddyProfile.favoriteWorkouts, buddyProfile.preferredTimes, buddyProfile.partnerBio, buddyProfile.buddyPhotos, buddyProfile.experienceLevel, buddyProfile.ghostMode, buddyProfile.gender, buddyProfile.trainingPlace]);

  useEffect(() => {
    let stopped = false;
    const pull = async () => {
      const gate = await readBuddyGate(userCoords);
      if (stopped) return;
      setBuddyLive(gate.active);
      setAreaThreshold(gate.threshold);
      setAreaCount(gate.count);
      setBuddyReady(true);
    };
    void pull();
    const timer = window.setInterval(() => { void pull(); }, 5000);
    const unsubscribe = subscribeBuddyGate(() => { void pull(); });
    return () => {
      stopped = true;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [userCoords, queueRevision]);

  useEffect(() => {
    let isCancelled = false;

    const loadLiveBuddies = async () => {
      if (!buddyReady || !buddyLive) {
        if (!isCancelled) {
          useRadarStore.getState().setBuddies([]);
          setSearchResults([]);
        }
        return;
      }
      const snap = readAthleteSettingsSnapshot();
      if (!snap.buddyRadarDiscovery || ghostMode) {
        setSearchResults([]);
        useRadarStore.getState().setBuddies([]);
        return;
      }
      const flying = Boolean(travelCity) && Number.isFinite(travelLat) && Number.isFinite(travelLng) && travelLat !== 0 && travelLng !== 0;
      const origin = flying ? { latitude: travelLat, longitude: travelLng } : userCoords;
      if (!origin) {
        if (locationOn === false) {
          if (!isCancelled) {
            useRadarStore.getState().setBuddies([]);
            setSearchResults([]);
          }
          return;
        }
        const profile = useBuddyProfileStore.getState();
        const seeded = import.meta.env.DEV ? localBuddyCards() : [];
        const ranked = rankAthletes({
          discipline: profile.selectedDisciplines[0] || '',
          split: profile.favoriteWorkouts[0] || '',
          time: profile.preferredTimes[0] || '',
          gym: profile.homeGym,
          age: profile.age,
          ageMin: deckFilters.ageMin,
          ageMax: deckFilters.ageMax,
        }, seeded, searchRadius(isPro, deckFilters), deckFilters);
        if (!isCancelled) {
          useRadarStore.getState().setBuddies(ranked);
          setSearchResults(ranked);
        }
        return;
      }
      setSupabaseError(null);
      try {
        const activeQuery = flying ? '' : searchQuery.trim();
        const { results } = await searchAthletesWithSupabase(
          activeQuery,
          [],
          origin,
          searchRadius(isPro, deckFilters)
        );
        if (!isCancelled) {
          setNearbyPeople(results.filter((row) => row.id !== radarUid));
          const profile = useBuddyProfileStore.getState();
          const ranked = rankAthletes({
            discipline: profile.selectedDisciplines[0] || '',
            split: profile.favoriteWorkouts[0] || '',
            time: profile.preferredTimes[0] || '',
            gym: profile.homeGym,
            age: profile.age,
            ageMin: deckFilters.ageMin,
            ageMax: deckFilters.ageMax,
          }, results, searchRadius(isPro, deckFilters), deckFilters).filter((row) => row.id !== radarUid && (import.meta.env.DEV || !String(row.id).startsWith('preview-')) && (!flying || !String(row.id).startsWith('preview-')));
          useRadarStore.getState().setBuddies(ranked);
          setSearchResults(ranked);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[Radar] Live buddy_profiles query error:', err);
          setSupabaseError(err?.message || 'Database network error reading buddy_profiles');
        }
      }
    };

    void loadLiveBuddies();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, travelCity, travelLat, travelLng, userCoords, locationOn, ghostMode, isBuddyProfileActive, isPro, deckFilters, buddyProfile.selectedDisciplines, buddyProfile.homeGym, radarUid, buddyLive, buddyReady]);

  const [selectedProfileAthlete, setSelectedProfileAthlete] = useState<DemoAthlete | null>(null);
  const [selectedMessageAthlete, setSelectedMessageAthlete] = useState<DemoAthlete | null>(null);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [selectedBookingAthlete, setSelectedBookingAthlete] = useState<DemoAthlete | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useBuddyRealtime({
    currentUserId: radarUid,
    onMessageReceived: () => {
      tactileEngine.triggerSelectionBuzz();
      showToast('New message received');
    },
  });
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isTravelHubOpen, setIsTravelHubOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  useEffect(() => {
    if (!radarUid) return;
    let stopped = false;
    const pull = async () => {
      const [hits, blocked] = await Promise.all([syncMutuals(radarUid), syncBlocks(radarUid)]);
      if (stopped) return;
      if (blocked.length) setBlocks(blocked);
      if (!hits) return;
      const next: Record<string, true> = {};
      hits.forEach((id) => { next[id] = true; });
      setMutuals(next);
    };
    void pull();
    const timer = window.setInterval(() => { void pull(); }, 8000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [radarUid]);

  useEffect(() => {
    const known = new Set([...localBuddyCards(), ...searchResults, ...remoteChats].map((row) => row.id));
    const missing = Object.keys(mutuals).filter((id) => !known.has(id) && !blocks.includes(id));
    if (!missing.length) return;
    let stopped = false;
    void fetchBuddyCardsById(missing).then((rows) => {
      if (!stopped && rows.length) setRemoteChats((prev) => {
        const map = new Map(prev.map((row) => [row.id, row]));
        rows.forEach((row) => map.set(row.id, row));
        return [...map.values()];
      });
    });
    return () => { stopped = true; };
  }, [mutuals, searchResults, blocks, remoteChats]);

  useEffect(() => {
    const handleOpenStudio = () => {
      setIsStudioOpen(true);
    };
    window.addEventListener('o1fc_open_radar_profile_studio', handleOpenStudio);
    return () => {
      window.removeEventListener('o1fc_open_radar_profile_studio', handleOpenStudio);
    };
  }, []);

  const offerLike = async (athlete: DemoAthlete) => {
    if (!radarUid) {
      showToast('Sign in to like someone');
      return;
    }
    const preview = athlete.id.startsWith('preview-');
    if (preview) {
      rememberLike(athlete.id, true);
      rememberMutual(athlete.id);
      setLikedAthletes((prev) => ({ ...prev, [athlete.id]: true }));
      setMutuals((prev) => ({ ...prev, [athlete.id]: true }));
      setOpenSchedule(false);
      setSelectedMessageAthlete(athlete);
      showToast(`${athlete.name} is in Chats`);
      return;
    }
    const result = await sendLike(radarUid, athlete.id, isPro || Boolean(likedAthletes[athlete.id]));
    if (!result.ok) {
      if (result.reason === 'cap') openPaywall('Unlimited Buddy likes');
      else showToast('Like did not save. Check your connection and try again.');
      return;
    }
    rememberLike(athlete.id, true);
    setLikedAthletes((prev) => ({ ...prev, [athlete.id]: true }));
    if (result.mutual) {
      rememberMutual(athlete.id);
      setMutuals((prev) => ({ ...prev, [athlete.id]: true }));
    }
    setOpenSchedule(false);
    setSelectedMessageAthlete(athlete);
    showToast(result.mutual ? `${athlete.name} is in Chats` : `Liked ${athlete.name}`);
  };

  const enableLocation = async () => {
    if (locating) return;
    setLocating(true);
    const result = await requestDeviceLocation();
    setLocating(false);
    if (result.status === 'granted') {
      setLocationOn(true);
      setUserCoords(result.coords);
      showToast('Location on');
      return;
    }
    setLocationOn(false);
    showToast(result.status === 'unavailable' ? 'This device cannot share location' : 'Location is blocked. Allow it in your phone or browser settings.');
  };

  const handleTabChange = (tab: 'DISCOVER' | 'MATCHED') => {
    setActiveTab(tab);
  };

  useEffect(() => {
    let live = true;
    void findNearbyCoaches(nearbyPeople, buddyProfile.homeGym)
      .then((rows) => live && setCoaches(rows.filter((coach) => !blocks.includes(coach.id))))
      .catch(() => live && setCoaches([]));
    return () => {
      live = false;
    };
  }, [nearbyPeople, blocks, buddyProfile.homeGym]);

  const coachIds = useMemo(() => new Set(coaches.map((coach) => coach.id)), [coaches]);

  const deckCard = useMemo(() => {
    return searchResults.find((ath) => {
      if (coachIds.has(ath.id)) return false;
      if (dismissedIds.includes(ath.id)) return false;
      if (mutuals[ath.id]) return false;
      if (blocks.includes(ath.id)) return false;
      if (deckFilters.verifiedOnly && !ath.is_verified) return false;
      return true;
    }) || null;
  }, [searchResults, coachIds, dismissedIds, mutuals, blocks, deckFilters.verifiedOnly]);

  const chatPeople = useMemo(() => {
    const known = new Map<string, DemoAthlete>();
    [...localBuddyCards(), ...searchResults, ...remoteChats].forEach((row) => known.set(row.id, row));
    return Object.keys(mutuals)
      .filter((id) => !blocks.includes(id))
      .map((id) => known.get(id))
      .filter((row): row is DemoAthlete => Boolean(row));
  }, [searchResults, mutuals, blocks, remoteChats]);

  return (
    <div className="w-full h-auto min-h-full bg-transparent text-white pb-10 pt-1 transition-colors">
      <DiscoverHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        matchedCount={chatPeople.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        radiusKm={radiusKm}
        onBack={() => { if (searchQuery) setSearchQuery(''); else if (activeTab === 'MATCHED') setActiveTab('DISCOVER'); }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenProfile={() => {
          setIsStudioOpen(true);
        }}
        onOpenFilters={() => setFiltersOpen(true)}
        onOpenTravelHub={() => {
          if (!isPro) {
            openPaywall('Global Travel Radar Pass');
            return;
          }
          setIsTravelHubOpen(true);
        }}
        onOpenSetup={() => {
          setIsStudioOpen(true);
        }}
        travelCity={travelCity}
        travelOrigin={travelOrigin}
        onClearTravelCorridor={() => {
          setTravelDetails({
            travelCity: '',
            travelDestinationCode: '',
            travelOrigin: '',
            travelOriginCode: '',
            travelLat: 0,
            travelLng: 0,
          });
          showToast('Switched back to local radar');
        }}
      />

      {supabaseError && (
        <div className="my-2 p-3 rounded-2xl bg-o1-well border border-white/[0.07] text-zinc-400 text-xs">
          <p className="font-semibold text-zinc-300">Radar unavailable</p>
          <p className="text-[11px] mt-0.5">{supabaseError}</p>
        </div>
      )}

      {authReady && !radarUid && (
        <div className="mx-3 mt-3 w-[calc(100%-1.5rem)] rounded-2xl border border-white/[0.07] bg-[#121214] px-4 py-3 text-left">
          <p className="text-[13px] font-semibold text-white">Sign in to be seen</p>
          <p className="mt-0.5 text-[12px] text-neutral-400">Likes and your card save only after you are signed in.</p>
        </div>
      )}

      {radarUid && (!buddyProfile.displayName.trim() || buddyProfile.age < 18) && (
        <button
          type="button"
          onClick={() => {
            setIsStudioOpen(true);
          }}
          className="mx-3 mt-3 w-[calc(100%-1.5rem)] rounded-2xl border border-white/[0.07] bg-[#121214] px-4 py-3 text-left"
        >
          <span className="block text-[13px] font-semibold text-white">Your card is not live</span>
          <span className="mt-0.5 block text-[12px] text-neutral-400">Add your name and an age of 18 or older so people can find you.</span>
        </button>
      )}

      {radarUid && buddyProfile.displayName.trim() && buddyProfile.age >= 18 && !buddyProfile.gender && (
        <button
          type="button"
          onClick={() => {
            setIsStudioOpen(true);
          }}
          className="mx-3 mt-3 w-[calc(100%-1.5rem)] rounded-2xl border border-white/[0.07] bg-[#121214] px-4 py-3 text-left"
        >
          <span className="block text-[13px] font-semibold text-white">Set Woman or Man</span>
          <span className="mt-0.5 block text-[12px] text-neutral-400">People filtering by that will not see a blank card.</span>
        </button>
      )}

      {activeTab === 'DISCOVER' && buddyLive ? <CoachesNearbyStrip coaches={coaches} onOpen={setSelectedCoach} /> : null}

      <div className="px-3 pt-1">
        {activeTab === 'MATCHED' ? (
          chatPeople.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-o1-card p-8 text-center">
              <h3 className="text-sm font-semibold text-white">No matches yet</h3>
              <p className="mt-1 text-xs text-neutral-400">When you both say yes, they show up here.</p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-card">
              {chatPeople.map((athlete) => {
                const photo = athlete.image_url || athlete.avatar || athlete.photos?.[0] || '';
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setOpenSchedule(false);
                      setSelectedMessageAthlete(athlete);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    {photo ? <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="h-12 w-12 rounded-full bg-[#161616]" />}
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-white">{athlete.name}</span>
                      <span className="block truncate text-[12px] text-neutral-400">{lastLines[athlete.id] || 'New match'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : !buddyReady ? (
          <p className="px-5 pt-16 text-center text-[13px] text-neutral-400">Checking your area</p>
        ) : !buddyLive ? (
          <FoundingLiftersQueue
            count={areaCount}
            threshold={areaThreshold}
            locationOn={locationOn}
            locating={locating}
            onEnableLocation={() => void enableLocation()}
            cardLive={Boolean(radarUid && buddyProfile.displayName.trim() && buddyProfile.age >= 18)}
            onOpenProfile={() => {
              setIsStudioOpen(true);
            }}
          />
        ) : deckCard ? (
          <BuddyDeckCard
            athlete={deckCard}
            onOpen={(ath) => setSelectedProfileAthlete(ath)}
            onPass={(ath) => {
              rememberPass(ath.id);
              setDismissedIds((prev) => [...prev, ath.id]);
            }}
            onAccept={(ath) => { void offerLike(ath); }}
          />
        ) : locationOn === null ? null : (
          <div id="radar-empty-state" className="flex flex-col items-center px-5 pt-16 text-center">
            <p className="o1-num text-[42px] leading-none text-[#F2EFE6]">{deckFilters.distanceKm}</p>
            <p className="mt-1 text-[13px] text-neutral-400">km radius</p>
            <h3 className="mt-6 text-[22px] font-semibold leading-tight text-white">No training partners in this radius.</h3>
            <p className="mt-2 max-w-[18rem] text-[14px] leading-relaxed text-neutral-400">
              {locationOn === false
                ? 'Location is off, so the search has no starting point.'
                : 'Widen the radius and bring back people you passed.'}
            </p>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                void (async () => {
                  if (!userCoords) {
                    const coords = await getDeviceCoordinates();
                    if (!coords) {
                      setLocationOn(false);
                      showToast('Turn location on to search');
                      return;
                    }
                    setLocationOn(true);
                    setUserCoords(coords);
                  }
                  const hadPasses = dismissedIds.length > 0;
                  if (hadPasses) {
                    clearPasses();
                    setDismissedIds([]);
                  }
                  const cap = isPro ? 250 : 25;
                  const wider = Math.min(cap, deckFilters.distanceKm + 10);
                  const strict = deckFilters.verifiedOnly || deckFilters.photoOnly || deckFilters.sameGymOnly || deckFilters.disciplines.length > 0 || deckFilters.times.length > 0 || deckFilters.levels.length > 0 || deckFilters.intents.length > 0 || deckFilters.show !== 'all' || deckFilters.place !== 'any';
                  const next: DeckFilters = wider > deckFilters.distanceKm
                    ? { ...deckFilters, distanceKm: wider, stretchDistance: true, verifiedOnly: false, photoOnly: false, sameGymOnly: false }
                    : strict
                      ? { ...deckFilters, verifiedOnly: false, photoOnly: false, sameGymOnly: false, disciplines: [], times: [], levels: [], intents: [], show: 'all', place: 'any' }
                      : deckFilters;
                  if (next === deckFilters && !hadPasses) {
                    if (deckFilters.distanceKm >= 25 && !isPro) openPaywall('Buddy radius past 25 km');
                    else showToast(`No one else inside ${deckFilters.distanceKm} km`);
                    return;
                  }
                  if (next !== deckFilters) {
                    writeDeckFilters(next);
                    setDeckFilters(next);
                    setRadiusKm(next.distanceKm);
                  }
                  showToast(wider > deckFilters.distanceKm ? `Radius ${wider} km` : hadPasses ? 'Passed people are back' : 'Filters cleared');
                })();
              }}
              className="mt-6 h-12 w-full max-w-sm rounded-full bg-o1-crimson text-[15px] font-semibold text-white active:bg-o1-crimson-press"
            >
              Widen search
            </button>
          </div>
        )}
      </div>

      <RadarModalsContainer
        profileTarget={selectedProfileAthlete}
        onCloseProfile={() => setSelectedProfileAthlete(null)}
        onPassProfile={(ath) => {
          setSelectedProfileAthlete(null);
          rememberPass(ath.id);
          setDismissedIds((prev) => [...prev, ath.id]);
          showToast(`Passed on ${ath.name}`);
        }}
        onAcceptProfile={(ath) => {
          setSelectedProfileAthlete(null);
          void offerLike(ath);
        }}
        onMessageProfile={(ath) => {
          setSelectedProfileAthlete(null);
          if (!mutuals[ath.id]) {
            showToast('Chat opens when you both say yes');
            return;
          }
          setOpenSchedule(false);
          setSelectedMessageAthlete(ath);
        }}
        onBookProfile={(ath) => {
          setSelectedProfileAthlete(null);
          if (!mutuals[ath.id]) {
            showToast('Book a session from the chat after you both say yes');
            return;
          }
          setOpenSchedule(true);
          setSelectedMessageAthlete(ath);
        }}
        onUnmatch={() => {
          const person = selectedMessageAthlete;
          if (!person) return;
          void withdrawLike(radarUid, person.id);
          rememberPass(person.id);
          setMutuals((prev) => {
            const next = { ...prev };
            delete next[person.id];
            return next;
          });
          setDismissedIds((prev) => [...prev, person.id]);
          setSelectedMessageAthlete(null);
          showToast(`Unmatched ${person.name}`);
        }}
        onBlock={() => {
          const person = selectedMessageAthlete;
          if (!person) return;
          void publishBlock(radarUid, person.id).then((saved) => {
            showToast(saved ? `Blocked ${person.name}` : 'Blocked on this phone. It did not save to your account.');
          });
          setBlocks((prev) => [person.id, ...prev.filter((id) => id !== person.id)]);
          setMutuals((prev) => {
            const next = { ...prev };
            delete next[person.id];
            return next;
          });
          setSelectedMessageAthlete(null);
        }}
        onReport={(reason) => {
          const person = selectedMessageAthlete;
          if (!person) return;
          void publishReport(radarUid, person.id, person.name, reason).then((saved) => {
            showToast(saved ? 'Report saved' : 'Report stayed on this phone. It did not save to your account.');
          });
        }}
        onLine={(text) => {
          const person = selectedMessageAthlete;
          if (!person) return;
          setLastLines((prev) => ({ ...prev, [person.id]: text }));
        }}
        messageTarget={selectedMessageAthlete}
        sessionUserId={radarUid}
        onCloseMessage={() => {
          setSelectedMessageAthlete(null);
          setOpenSchedule(false);
        }}
        onSendInvite={({ gym, dateTime }) => showToast(`Session invite sent for ${gym} (${dateTime})`)}
        allowCompose
        scheduleOpen={openSchedule}
        scheduleTarget={selectedBookingAthlete}
        onCloseSchedule={() => setSelectedBookingAthlete(null)}
        onInviteSent={({ gym, dateTime }) => showToast(`Training session booked at ${gym} (${dateTime})`)}
        isPrivacyOpen={isPrivacyOpen}
        onClosePrivacy={() => setIsPrivacyOpen(false)}
        onPrivacySaved={() => showToast('Stealth & privacy parameters updated')}
        isFiltersOpen={isFiltersOpen}
        onCloseFilters={() => setIsFiltersOpen(false)}
        onApplyFilters={(f) => {
          const next = capRadius(isPro, f.radiusKm || radiusKm);
          if ((f.radiusKm || 0) > FREE_RADIUS_KM && !isPro) openPaywall('Buddy radius past 25 km');
          setRadiusKm(next);
          showToast(`${next} km`);
        }}
        isTravelHubOpen={isTravelHubOpen}
        onCloseTravelHub={() => setIsTravelHubOpen(false)}
        onSelectDestination={(city, newRadius, originCity) => {
          const next = capRadius(true, newRadius || radiusKm);
          setRadiusKm(next);
          showToast(`${originCity || 'Here'} to ${city}, ${next} km`);
        }}
        isSetupOpen={isSetupOpen}
        onCloseSetup={() => setIsSetupOpen(false)}
        onSetupActivated={(p) => {
          const name = typeof p?.name === 'string' ? p.name.trim() : '';
          if (name) showToast(`Radar pass active: ${name}`);
        }}
        isStudioOpen={isStudioOpen}
        onCloseStudio={() => setIsStudioOpen(false)}
        destinationCity={travelCity || ''}
        travelRadiusKm={radiusKm}
      />

      <CoachNearbySheet
        coach={selectedCoach}
        viewerId={radarUid}
        viewerName={buddyProfile.displayName}
        onClose={() => setSelectedCoach(null)}
        onToast={showToast}
      />

      {filtersOpen && (
        <BuddyFilterSheet
          open
          filters={deckFilters}
          isPro={isPro}
          onClose={() => setFiltersOpen(false)}
          onNeedPremium={() => openPaywall('Buddy radius past 25 km')}
          onApply={(next) => {
            const distanceKm = capRadius(isPro, next.distanceKm);
            const saved = { ...next, distanceKm, ageMin: Math.min(next.ageMin, next.ageMax), ageMax: Math.max(next.ageMin, next.ageMax) };
            writeDeckFilters(saved);
            setDeckFilters(saved);
            setRadiusKm(distanceKm);
            setFiltersOpen(false);
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-o1-well border border-white/[0.07] text-white px-4 py-2.5 rounded-full text-xs font-mono font-medium shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default BuddyView;
