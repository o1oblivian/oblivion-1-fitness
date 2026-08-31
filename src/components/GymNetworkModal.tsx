import React, { useState, useEffect } from 'react';
import {
  X,
  Instagram,
  Music,
  Share2,
  Heart,
  MessageSquare,
  Calendar,
  Ticket,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Compass,
  SlidersHorizontal,
  CalendarPlus,
  ArrowRight,
  Zap,
  Bell,
  Users,
  Send,
  Copy,
  CheckCircle2,
  Dumbbell,
  Utensils,
  Activity,
  TrendingUp,
  Play,
  Pause,
  Check,
  Trophy,
  Loader2,
} from 'lucide-react';
import { UpSellPaywallModal, UpSellType } from './UpSellPaywallModal';
import { SocialAuthModal } from './SocialAuthModal';
// VenueMapPreview removed per UI update ticket

const TIME_SLOTS = [
  '06:00 AM',
  '07:15 AM',
  '08:30 AM',
  '10:00 AM',
  '12:00 PM',
  '04:30 PM',
  '05:15 PM',
  '06:00 PM',
  '06:45 PM',
  '07:30 PM',
  '08:15 PM',
  '09:00 PM',
];

const formatMeetingTimeString = (date: Date, timeSlot: string) => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = date.getDate();
  return `${dayName}, ${monthName} ${dayNum} @ ${timeSlot}`;
};

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
import {
  GymVenue,
  UserTrainingVector,
  GymPass,
  PartnerStatus,
  fetchGymVenues,
  checkInToGym,
  issueGymDayPass,
  fetchUserPasses,
  redeemGymPass,
  sendDirectMessage,
  fetchDirectMessages,
  fetchBuddyProfiles,
  DirectMessage,
  BuddyNotification,
  sendBuddyConnectionRequest,
  suggestBuddyMeetingTime,
  fetchBuddyNotifications,
  respondToBuddyNotification,
  subscribeToBuddyNotificationsRealtime,
  BuddyMatchResult,
  MatchBreakdown,
  getDailyMatchState,
  consumeDailyMatch,
  findMidpointGyms,
  MidpointGym,
  haversineKm,
} from '../utils/gymNetworkStore';
import { VaultPhoto, fetchVaultPhotos } from '../utils/profileMediaStore';

interface GymNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserName: string;
  currentUserAvatar: string;
  showToast: (msg: string) => void;
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
}

const GENDERS = ['Female', 'Male', 'Non-Binary'];
const WORKOUT_PREFS = ['Hypertrophy', 'Powerlifting', 'Cardio', 'Recovery', 'CrossFit', 'Calisthenics'];

const POPULAR_ACTIVITIES = [
  { id: 'Gyms', label: 'Gyms & Barbell Clubs', color: '#DC2626' },
  { id: 'Padel', label: 'Padel & Pickleball', color: '#D4A843' },
  { id: 'Climbing', label: 'Bouldering & Climbing', color: '#8B5A2B' },
  { id: 'Running', label: 'Run Club & Coffee Loops', color: '#4A90D9' },
  { id: 'Sauna', label: 'Recovery Bathhouses & Saunas', color: '#E84855' },
  { id: 'Pilates', label: 'Reformer Pilates & Yoga', color: '#7A9382' },
  { id: 'Trails', label: 'Scenic Trails & Hikes', color: '#3B624E' },
  { id: 'CrossFit', label: 'CrossFit & HIIT', color: '#FF6B35' },
  { id: 'Swimming', label: 'Swimming', color: '#00B8D9' },
  { id: 'Boxing', label: 'Boxing & MMA', color: '#1A1E1D' },
  { id: 'Cycling', label: 'Cycling & Spin', color: '#2EC4B6' },
  { id: 'Spa', label: 'Spa & Wellness', color: '#B388EB' },
  { id: 'Dance', label: 'Dance & Barre', color: '#E0507E' },
  { id: 'Basketball', label: 'Basketball', color: '#FF8C42' },
  { id: 'Yoga', label: 'Yoga & Flow', color: '#5FBE6F' },
  { id: 'Calisthenics', label: 'Calisthenics', color: '#3B624E' },
  { id: 'Hyrox', label: 'Hyrox Racing', color: '#FF3B30' },
  { id: 'Sports', label: 'Sports Courts', color: '#5A8F3E' },
];

const COMPREHENSIVE_SPORTS_DIRECTORY = [
  {
    category: 'Racquet Sports',
    sports: [
      { name: 'Padel', color: '#D4A843' },
      { name: 'Tennis', color: '#D4A843' },
      { name: 'Pickleball', color: '#5FBE6F' },
      { name: 'Badminton', color: '#4A90D9' },
      { name: 'Squash', color: '#FF6B35' },
      { name: 'Table Tennis', color: '#5FBE6F' },
    ],
  },
  {
    category: 'Strength & Conditioning',
    sports: [
      { name: 'Gyms', color: '#DC2626' },
      { name: 'Bodybuilding', color: '#DC2626' },
      { name: 'Powerlifting', color: '#1A1E1D' },
      { name: 'Calisthenics', color: '#3B624E' },
      { name: 'Olympic Weightlifting', color: '#D4A843' },
      { name: 'Strongman', color: '#8B5A2B' },
    ],
  },
  {
    category: 'Mind, Core & Mobility',
    sports: [
      { name: 'Pilates Reformer', color: '#7A9382' },
      { name: 'Mat Pilates', color: '#7A9382' },
      { name: 'Hot Yoga', color: '#B388EB' },
      { name: 'Vinyasa Flow', color: '#5FBE6F' },
      { name: 'Barre', color: '#E0507E' },
      { name: 'Breathwork', color: '#00B8D9' },
      { name: 'Stretching & Mobility', color: '#7A9382' },
    ],
  },
  {
    category: 'HIIT & Endurance Racing',
    sports: [
      { name: 'CrossFit', color: '#FF6B35' },
      { name: 'Hyrox', color: '#FF3B30' },
      { name: 'Running', color: '#4A90D9' },
      { name: 'Marathon & Track', color: '#D4A843' },
      { name: 'Spinning / Indoor Cycling', color: '#2EC4B6' },
      { name: 'Road Cycling', color: '#2EC4B6' },
      { name: 'Swimming', color: '#00B8D9' },
      { name: 'Triathlon', color: '#00B8D9' },
      { name: 'Rowing', color: '#3B624E' },
    ],
  },
  {
    category: 'Combat & Martial Arts',
    sports: [
      { name: 'Boxing', color: '#1A1E1D' },
      { name: 'Muay Thai', color: '#FF6B35' },
      { name: 'Brazilian Jiu Jitsu (BJJ)', color: '#8B5A2B' },
      { name: 'Kickboxing', color: '#DC2626' },
      { name: 'Karate', color: '#1A1E1D' },
      { name: 'Judo', color: '#5A5F5D' },
      { name: 'MMA & Grappling', color: '#DC2626' },
    ],
  },
  {
    category: 'Recovery & Biohacking',
    sports: [
      { name: 'Sauna', color: '#E84855' },
      { name: 'Cold Plunge / Ice Bath', color: '#4A90D9' },
      { name: 'Infrared Spa', color: '#B388EB' },
      { name: 'Cryotherapy', color: '#00B8D9' },
      { name: 'Hydrotherapy Pool', color: '#00B8D9' },
      { name: 'Sports Massage', color: '#7A9382' },
    ],
  },
  {
    category: 'Team & Court Sports',
    sports: [
      { name: 'Basketball', color: '#FF8C42' },
      { name: 'Soccer / Football', color: '#5A8F3E' },
      { name: 'Volleyball', color: '#4A90D9' },
      { name: 'American Football', color: '#1A1E1D' },
      { name: 'Rugby', color: '#5A5F5D' },
      { name: 'Golf', color: '#5A8F3E' },
      { name: 'Baseball', color: '#FF8C42' },
    ],
  },
  {
    category: 'Adventure & Outdoor',
    sports: [
      { name: 'Bouldering', color: '#8B5A2B' },
      { name: 'Rock Climbing', color: '#8B5A2B' },
      { name: 'Surfing', color: '#00B8D9' },
      { name: 'Kite Surfing', color: '#4A90D9' },
      { name: 'Kayaking & SUP', color: '#2EC4B6' },
      { name: 'Hiking & Trail Running', color: '#3B624E' },
      { name: 'Skateboarding', color: '#FF6B35' },
    ],
  },
];

export const GymNetworkModal: React.FC<GymNetworkModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserName,
  currentUserAvatar,
  showToast,
  onOpenPayPlan,
}) => {
  // Navigation Tabs: 'buddy' (Main dating/buddy discovery), 'venues' (Gym venues & passes), 'passes' (My Day Passes), 'notifications' (Real-time requests)
  const [activeTab, setActiveTab] = useState<'buddy' | 'venues' | 'passes' | 'notifications'>('buddy');

  // Monetization Quota & Distance Cap States
  const [userTier, setUserTier] = useState<string>(() => localStorage.getItem('o1fc_cached_tier') || localStorage.getItem('lumina_user_tier') || 'free');
  const [actionCount, setActionCount] = useState<number>(() => {
    const saved = localStorage.getItem('lumina_action_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [distanceKm, setDistanceKm] = useState<number>(250);
  const [upSellState, setUpSellState] = useState<{ isOpen: boolean; type: UpSellType }>({
    isOpen: false,
    type: 'action_quota',
  });

  const isFreeTier = userTier !== 'premium' && userTier !== 'coach';

  // Global Social Media Authorization State
  const [socialAuthModalOpen, setSocialAuthModalOpen] = useState<boolean>(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string>('Instagram');
  const [linkedPlatforms, setLinkedPlatforms] = useState<Record<string, boolean>>({
    Instagram: true,
    TikTok: true,
    Strava: true,
  });

  const handleOpenSocialAuth = (platform: string) => {
    setSelectedSocialPlatform(platform);
    setSocialAuthModalOpen(true);
  };

  const handleConfirmSocialLink = (platform: string, handle?: string) => {
    setLinkedPlatforms((prev) => ({ ...prev, [platform]: true }));
    showToast?.(`${platform} account successfully linked & verified!`);
  };

  const handleUnlinkSocialPlatform = (platform: string) => {
    setLinkedPlatforms((prev) => ({ ...prev, [platform]: false }));
    showToast?.(`${platform} connection unlinked.`);
  };

  const handleSwapSocialPlatform = (oldPlatform: string, newPlatform: string) => {
    setSelectedSocialPlatform(newPlatform);
    setLinkedPlatforms((prev) => ({ ...prev, [newPlatform]: true }));
    showToast?.(`Swapped platform from ${oldPlatform} to ${newPlatform}`);
  };

  // Refresh user tier on modal open
  useEffect(() => {
    if (isOpen) {
      setUserTier(localStorage.getItem('o1fc_cached_tier') || localStorage.getItem('lumina_user_tier') || 'free');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setDailyMatchState(getDailyMatchState());
  }, [isOpen]);

  // Helper to consume action quota
  const consumeActionQuota = (): boolean => {
    if (!isFreeTier) return true;
    if (actionCount >= 5) {
      setUpSellState({ isOpen: true, type: 'action_quota' });
      return false;
    }
    const nextCount = actionCount + 1;
    setActionCount(nextCount);
    localStorage.setItem('lumina_action_count', nextCount.toString());
    return true;
  };

  // Filter States for Buddy Dating & Matchmaking Hub
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [postcodeFilter, setPostcodeFilter] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedPref, setSelectedPref] = useState<string>('');
  const [selectedBuddyCategory, setSelectedBuddyCategory] = useState<string>('');
  const [universalSearchQuery, setUniversalSearchQuery] = useState<string>('');
  const [isSportsSearchOpen, setIsSportsSearchOpen] = useState<boolean>(false);
  const [sportsSearchQuery, setSportsSearchQuery] = useState<string>('');
  const [placeSearchInput, setPlaceSearchInput] = useState<string>('');
  const [activitySearchInput, setActivitySearchInput] = useState<string>('');

  // Buddy Profiles Data
  const [buddyProfiles, setBuddyProfiles] = useState<BuddyMatchResult[]>([]);
  const [isLoadingBuddy, setIsLoadingBuddy] = useState<boolean>(false);
  const [likedUserIds, setLikedUserIds] = useState<Record<string, boolean>>({});
  const [dismissedUserIds, setDismissedUserIds] = useState<Record<string, boolean>>({});
  const [selectedDetailedUser, setSelectedDetailedUser] = useState<BuddyMatchResult | null>(null);
  const [dailyMatchState, setDailyMatchState] = useState(() => getDailyMatchState());
  const [midpointGyms, setMidpointGyms] = useState<MidpointGym[]>([]);
  const [isLoadingMidpoint, setIsLoadingMidpoint] = useState(false);

  // Profile Modal Tab & Media Lightbox State
  const [profileModalTab, setProfileModalTab] = useState<'overview' | 'vault' | 'metrics'>('overview');
  const [buddyMediaItems, setBuddyMediaItems] = useState<VaultPhoto[]>([]);
  const [lightboxMedia, setLightboxMedia] = useState<{
    id: string;
    type: 'photo' | 'video';
    url: string;
    title: string;
    category: string;
    date: string;
    likes: number;
    caption: string;
  } | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState<boolean>(false);

  // Venues & Passes
  const [venues, setVenues] = useState<GymVenue[]>([]);
  const [postcodeSearch, setPostcodeSearch] = useState<string>('');
  const [venueCategoryFilter, setVenueCategoryFilter] = useState<string>('');
  const [isLoadingVenues, setIsLoadingVenues] = useState<boolean>(false);
  const [venueDateFilter, setVenueDateFilter] = useState<string>('');
  const [userPasses, setUserPasses] = useState<GymPass[]>([]);
  const [selectedPass, setSelectedPass] = useState<GymPass | null>(null);

  // Live Geo-location state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Detect real GPS location
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      showToast?.('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setPostcodeSearch('Near Me');
        setPostcodeFilter('Near Me');
        showToast?.(`Live GPS synced (${lat.toFixed(3)}, ${lng.toFixed(3)})! Venue distances updated.`);
        loadVenues('nearby');
      },
      (err) => {
        setIsLocating(false);
        showToast?.('Using standard city/postal code search.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // User Partner Status & Heart Popover
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>('Open for Gym Date');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const [rpeTarget, setRpeTarget] = useState<number>(8.5);
  const [trainingFocus, setTrainingFocus] = useState<string>('Hypertrophy');

  // Active Direct Chat
  const [activeChatUser, setActiveChatUser] = useState<UserTrainingVector | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');

  // Real-Time Buddy Notifications & Meeting Suggestions State
  const [notifications, setNotifications] = useState<BuddyNotification[]>([]);
  const [showNotifTray, setShowNotifTray] = useState<boolean>(false);
  const [meetingTargetUser, setMeetingTargetUser] = useState<UserTrainingVector | null>(null);
  const [meetingVenueInput, setMeetingVenueInput] = useState<string>('');
  const [venuePostcodeInput, setVenuePostcodeInput] = useState<string>('');
  const [meetingDateInput, setMeetingDateInput] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [meetingTimeSlotInput, setMeetingTimeSlotInput] = useState<string>('18:00');
  const [meetingTimeInput, setMeetingTimeInput] = useState<string>('Wed, Aug 12 @ 06:00 PM');
  const [meetingNoteInput, setMeetingNoteInput] = useState<string>('');

  // Sync formatted meeting time string when date or time slot inputs change
  useEffect(() => {
    if (meetingDateInput && meetingTimeSlotInput) {
      try {
        const [year, month, day] = meetingDateInput.split('-').map(Number);
        const [hours, minutes] = meetingTimeSlotInput.split(':').map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hours) && !isNaN(minutes)) {
          const d = new Date(year, month - 1, day, hours, minutes);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const monthName = d.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = d.getDate();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
          const formattedMins = minutes.toString().padStart(2, '0');
          setMeetingTimeInput(`${dayName}, ${monthName} ${dayNum} @ ${formattedHours}:${formattedMins} ${ampm}`);
        }
      } catch {
        // preserve current meetingTimeInput
      }
    }
  }, [meetingDateInput, meetingTimeSlotInput]);

  // Interactive Venue Search State
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [venueSearchQuery, setVenueSearchQuery] = useState<string>('');
  const [showVenueDropdown, setShowVenueDropdown] = useState<boolean>(false);
  const [meetingVenueResults, setMeetingVenueResults] = useState<GymVenue[]>([]);
  const [isSearchingVenues, setIsSearchingVenues] = useState<boolean>(false);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<{ name: string; address: string; distance: string; status: string } | null>(null);

  // Digital Calendar Picker State
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('06:00 PM');

  // Invite a Friend state
  const [inviteCopied, setInviteCopied] = useState(false);

  const userHandle = currentUserName
    ? `@${currentUserName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`
    : `@${currentUserEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`;

  useEffect(() => {
    if (isOpen) {
      // load any needed state
    }
  }, [isOpen]);

  const handleShareLink = async () => {
    const shareText = `Join me on O1FC!`;
    const shareUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'O1FC - Train Together', text: shareText, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showToast?.('Share link copied to clipboard!');
    }
  };

  const handleCopyHandle = async () => {
    await navigator.clipboard.writeText(userHandle);
    setInviteCopied(true);
    showToast?.('Handle copied!');
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // Initial Data Fetch & Real-time Subscription
  useEffect(() => {
    if (isOpen) {
      loadBuddyProfiles();
      loadVenues(postcodeSearch);
      loadPasses();
      loadNotifications();
    }
  }, [isOpen, selectedCity, postcodeFilter, selectedGender, selectedPref, selectedBuddyCategory, universalSearchQuery, distanceKm, userCoords]);

  useEffect(() => {
    if (selectedDetailedUser) {
      fetchVaultPhotos(selectedDetailedUser.user.id).then(setBuddyMediaItems);
    } else {
      setBuddyMediaItems([]);
    }
  }, [selectedDetailedUser]);

  useEffect(() => {
    if (!isOpen) return;

    // Realtime subscription listener for incoming Buddy connection requests & meeting suggestions
    const unsubscribe = subscribeToBuddyNotificationsRealtime(
      currentUserEmail,
      (newNotif) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });

        // Trigger real-time audio beep / toast alert
        if (newNotif.type === 'connection_request') {
          showToast?.(`Real-time: Connection Request from ${newNotif.sender_name}!`);
        } else if (newNotif.type === 'meeting_suggestion') {
          showToast?.(`Real-time: Meeting Time Suggested by ${newNotif.sender_name}!`);
        } else if (newNotif.type === 'request_accepted') {
          showToast?.(`Real-time: ${newNotif.sender_name} accepted your request!`);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentUserEmail]);

  const loadNotifications = async () => {
    const list = await fetchBuddyNotifications(currentUserEmail);
    setNotifications(list);
  };

  const handleSendConnectionRequest = async (user: UserTrainingVector) => {
    if (!consumeActionQuota()) return;
    const notif = await sendBuddyConnectionRequest(
      currentUserEmail,
      currentUserName,
      currentUserAvatar,
      user.user_email,
      `Hey ${user.user_name}! Want to connect as gym partners?`
    );
    showToast?.(`Connection Request sent to ${user.user_name}!`);
    loadNotifications();
  };

  const handleOpenMeetingModal = (user: UserTrainingVector) => {
    if (!consumeActionQuota()) return;
    setMeetingTargetUser(user);
    const gymName = user.favorite_gym || '';
    setMeetingVenueInput(gymName);
    setVenueSearchQuery(gymName);
    setVenuePostcodeInput(user.postcode || '');

    const match = {
      name: gymName,
      address: `Near ${user.city_town || 'your location'}`,
      distance: '',
      status: '',
    };
    setSelectedVenueDetails(match);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setMeetingDateInput(dateStr);
    setMeetingTimeSlotInput('18:00');
  };

  // Live venue search for booking form — queries real database via fetchGymVenues
  const haversineKmLocal = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const searchBookingVenues = async (query: string) => {
    const combined = query.trim();
    if (!combined) {
      setMeetingVenueResults([]);
      return;
    }
    setIsSearchingVenues(true);
    try {
      const results = await fetchGymVenues(combined, 'All');
      setMeetingVenueResults(results.slice(0, 8));
    } catch (e) {
      setMeetingVenueResults([]);
    } finally {
      setIsSearchingVenues(false);
    }
  };

  const filteredVenuesList: GymVenue[] = meetingVenueResults.length > 0
    ? meetingVenueResults.map((v) => ({
        ...v,
        distance: v.lat && v.lng && userCoords ? `${haversineKmLocal(userCoords.lat, userCoords.lng, v.lat, v.lng).toFixed(1)} km` : '',
        status: 'Open Access',
      })) as any
    : [];

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const updateFormattedTimeInput = (date: Date, slot: string) => {
    setMeetingTimeInput(formatMeetingTimeString(date, slot));
  };

  const calendarDaysGrid = (() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: ({ dayNum: number; date: Date } | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        dayNum: i,
        date: new Date(year, month, i),
      });
    }
    return days;
  })();

  const handleSendMeetingSuggestion = async () => {
    if (!meetingTargetUser) return;
    await suggestBuddyMeetingTime(
      currentUserEmail,
      currentUserName,
      currentUserAvatar,
      meetingTargetUser.user_email,
      meetingVenueInput,
      meetingTimeInput,
      meetingNoteInput
    );
    showToast?.(`Meeting suggestion sent to ${meetingTargetUser.user_name}!`);
    setMeetingTargetUser(null);
    loadNotifications();
  };

  const handleRespondNotification = async (notifId: string, status: 'accepted' | 'declined') => {
    await respondToBuddyNotification(notifId, status);
    if (status === 'accepted') {
      showToast?.('Connection / Meeting Time Accepted! Chat open.');
    } else {
      showToast?.('Declined request.');
    }
    loadNotifications();
  };

  const loadBuddyProfiles = async (categoryOverride?: string, searchOverride?: string) => {
    setIsLoadingBuddy(true);
    try {
      const cat = categoryOverride !== undefined ? categoryOverride : selectedBuddyCategory;
      const search = searchOverride !== undefined ? searchOverride : universalSearchQuery;
      const data = await fetchBuddyProfiles(
        {
          city_town: selectedCity,
          postcode: postcodeFilter,
          searchQuery: search,
          category: cat,
          gender: selectedGender,
          preference: selectedPref,
          maxDistanceKm: userCoords ? distanceKm : undefined,
        },
        currentUserEmail,
        userCoords?.lat,
        userCoords?.lng,
        {
          rpe_target: rpeTarget,
          volume_level: 18,
          training_focus: trainingFocus,
          partner_status: partnerStatus,
          city_town: selectedCity || undefined,
          workout_preferences: [trainingFocus],
        }
      );
      setBuddyProfiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBuddy(false);
    }
  };

  const loadVenues = async (query?: string, category?: string) => {
    setIsLoadingVenues(true);
    try {
      const q = query !== undefined ? query : venueSearchQuery;
      const cat = category !== undefined ? category : venueCategoryFilter;
      const data = await fetchGymVenues(q, cat);
      setVenues(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const handleCheckInCustom = async (customVenueName: string) => {
    if (!customVenueName.trim()) return;
    const customId = `custom_venue_${Date.now()}`;
    await checkInToGym(
      currentUserEmail,
      currentUserName,
      currentUserAvatar,
      customId,
      partnerStatus,
      rpeTarget,
      18,
      trainingFocus,
      `Custom Registered Venue: ${customVenueName.trim()}`
    );
    showToast?.(`Registered & Checked in at custom venue: ${customVenueName.trim()}!`);
  };

  const loadPasses = async () => {
    const passes = await fetchUserPasses(currentUserEmail);
    setUserPasses(passes);
  };

  const handleLikeBuddy = (user: UserTrainingVector) => {
    const isLiked = likedUserIds[user.id];
    if (!isLiked) {
      if (isFreeTier) {
        const { allowed, remaining } = consumeDailyMatch();
        if (!allowed) {
          setUpSellState({ isOpen: true, type: 'action_quota' });
          return;
        }
        setDailyMatchState(getDailyMatchState());
      }
      if (!consumeActionQuota()) return;
    }
    setLikedUserIds((prev) => ({ ...prev, [user.id]: !isLiked }));
    if (!isLiked) {
      showToast?.(`Connected with ${user.user_name}!`);
    }
  };

  const handleCheckIn = async (venueId: string) => {
    const targetVenue = venues.find((v) => v.id === venueId);
    await checkInToGym(
      currentUserEmail,
      currentUserName,
      currentUserAvatar,
      venueId,
      partnerStatus,
      rpeTarget,
      18,
      trainingFocus,
      'Active Buddy & Gym Date Match'
    );
    showToast?.(`Checked in at ${targetVenue?.name || 'Venue'}! Visible on Buddy Radar.`);
  };

  const handleBuyPass = async (venue: GymVenue) => {
    const newPass = await issueGymDayPass(venue.id, currentUserEmail, currentUserName);
    setSelectedPass(newPass);
    loadPasses();
    showToast?.(`Day Pass Issued for ${venue.name}! Digital QR active.`);
  };

  const handleRedeemPass = async (passToken: string) => {
    const success = await redeemGymPass(passToken);
    if (success) {
      showToast?.('Day Pass Redeemed at Turnstile Gate!');
      if (selectedPass) {
        setSelectedPass({ ...selectedPass, redeemed: true });
      }
      loadPasses();
    }
  };

  const handleOpenChat = async (matchedUser: UserTrainingVector) => {
    if (!consumeActionQuota()) return;
    setActiveChatUser(matchedUser);
    const msgs = await fetchDirectMessages(currentUserEmail, matchedUser.user_email);
    setChatMessages(msgs);
  };

  const FREE_MSG_LIMIT = 3;
  const _msgCountKey = `o1fc_msg_count_${new Date().toISOString().slice(0,10)}`;
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeChatUser) return;
    const isPaid = localStorage.getItem('o1fc_dev_unlock') === 'I100PH' || ['premium','premium_travel','coach_pro'].includes(userTier);
    if (!isPaid) {
      const sent = parseInt(localStorage.getItem(_msgCountKey) || '0', 10);
      if (sent >= FREE_MSG_LIMIT) {
        showToast?.('Free plan: 3 messages/day limit reached');
        return;
      }
      localStorage.setItem(_msgCountKey, String(sent + 1));
    }
    const msg = await sendDirectMessage(
      currentUserEmail,
      activeChatUser.user_email,
      newMessageText.trim()
    );
    setChatMessages((prev) => [...prev, msg]);
    setNewMessageText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-[#0B0C0E] font-sans text-zinc-900 dark:text-white">
      <div className="bg-white dark:bg-[#0B0C0E] border border-slate-200 dark:border-zinc-800 w-full h-full text-zinc-900 dark:text-white shadow-2xl relative flex flex-col overflow-hidden box-border">
        {/* COMPACT TOP NAVIGATION HEADER */}
        <div className="safe-top shrink-0 bg-white/95 dark:bg-[#0B0C0E]/95 backdrop-blur-md px-2 pt-1 pb-0 space-y-0.5 relative z-[100]">
          {/* Main Clean Header Row */}
          <div className="flex items-center justify-between gap-2 min-h-[30px] px-0.5 relative">
            {/* Left: Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                selectedCity || postcodeFilter || selectedGender || selectedPref || universalSearchQuery || selectedBuddyCategory
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Filter Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Centre: BUDDY Branding */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none">
              <h2 className="font-display font-black tracking-[0.2em] text-base sm:text-lg text-zinc-900 dark:text-white uppercase">
                BUDDY
              </h2>
            </div>

            {/* Right: Heart Availability Status Button (Blinking Health) & Close Button */}
            <div className="flex items-center gap-1 shrink-0 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title={`Status: ${partnerStatus}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: partnerStatus === 'Open for Gym Date' ? '#5FBE6F' : partnerStatus === 'Training Partner' ? '#FF6B35' : '#5A5F5D' }} />
                </button>

                {/* Heart Popover Menu with all 3 Options */}
                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[490]" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1 z-[500] text-[11px] animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        Availability Status
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPartnerStatus('Open for Gym Date');
                          setIsStatusDropdownOpen(false);
                          showToast?.('Status: Open for Gym Date');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                          partnerStatus === 'Open for Gym Date'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5FBE6F] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold">Open for Gym Date</span>
                          <span className="text-[8.5px] text-zinc-500 dark:text-zinc-400">Available to match</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPartnerStatus('Training Partner');
                          setIsStatusDropdownOpen(false);
                          showToast?.('Status: Training Partner');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                          partnerStatus === 'Training Partner'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold">Training Partner</span>
                          <span className="text-[8.5px] text-zinc-500 dark:text-zinc-400">Serious training buddy</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPartnerStatus('Busy / Solo Grind');
                          setIsStatusDropdownOpen(false);
                          showToast?.('Status: Solo Grind / Busy');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                          partnerStatus === 'Busy / Solo Grind'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5A5F5D] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold">Busy / Solo Grind</span>
                          <span className="text-[8.5px] text-zinc-500 dark:text-zinc-400">Not taking invites</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onClose}
                className="btn-nude-close shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Uber-style Tab Bar */}
          <div className="flex select-none border-b border-zinc-200 dark:border-zinc-800">
            {([
              { key: 'buddy' as const, label: 'Matches', count: buddyProfiles.length },
              { key: 'venues' as const, label: 'Gyms', count: venues.length },
              { key: 'passes' as const, label: 'Passes', count: userPasses.length },
              { key: 'notifications' as const, label: 'Alerts', count: notifications.filter((n) => n.status === 'pending').length },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 pb-2.5 pt-2 font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 relative ${
                  activeTab === tab.key
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === tab.key ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2.5px] bg-red-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE BODY CONTENT WRAPPER */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-28">
          {/* TAB 1: BUDDY DATING & MATCHMAKING DISCOVERY HUB */}
        {activeTab === 'buddy' && (
          <div className="p-3 space-y-2.5">
            {/* Freemium Daily Match Counter */}
            {isFreeTier && (
              <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {Math.max(0, 5 - dailyMatchState.used)} / 5 Daily Free Matches
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-700">
                    {distanceKm}km Corridor
                  </span>
                </div>
                {dailyMatchState.used >= 5 && (
                  <button
                    type="button"
                    onClick={() => onOpenPayPlan?.('premium')}
                    className="text-[11px] font-bold text-amber-500 hover:text-amber-400 underline cursor-pointer uppercase tracking-wider"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}
            {/* OPEN & SHUT FILTER SETTINGS WINDOW MODAL */}
            {isFilterOpen && (
              <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn" onClick={() => setIsFilterOpen(false)}>
                <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white w-full max-w-md rounded-2xl p-4 sm:p-5 shadow-2xl relative border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 animate-slideDownFade my-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header & Shut Button */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-red-500" />
                      <h3 className="font-display font-black text-sm text-zinc-900 dark:text-white uppercase tracking-widest">
                        SEARCH & FILTER
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Universal Keyword Search Input */}
                  <div className="space-y-1">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 focus-within:border-red-500 rounded-xl px-3 py-2 gap-2 transition-all">
                      <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        value={universalSearchQuery}
                        onChange={(e) => {
                          setUniversalSearchQuery(e.target.value);
                          loadBuddyProfiles(selectedBuddyCategory, e.target.value);
                        }}
                        placeholder="Sport, gym, or athlete name..."
                        className="bg-transparent text-zinc-900 dark:text-white text-xs font-semibold outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-500"
                      />
                      {universalSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setUniversalSearchQuery('');
                            loadBuddyProfiles(selectedBuddyCategory, '');
                          }}
                          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Sport / Activity Category Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        ACTIVITY CATEGORY
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterOpen(false);
                          setIsSportsSearchOpen(true);
                        }}
                        className="text-[10px] font-bold text-amber-500 hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        + 50+ Sports
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {POPULAR_ACTIVITIES.map((cat) => {
                        const isActive = selectedBuddyCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedBuddyCategory(cat.id);
                              setVenueCategoryFilter(cat.id);
                              loadBuddyProfiles(cat.id, universalSearchQuery);
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                              isActive
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. PLACE SEARCH with GO button */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      SEARCH LOCATION & REGION
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2 gap-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <input
                          type="text"
                          value={placeSearchInput}
                          onChange={(e) => setPlaceSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const place = placeSearchInput.trim();
                              if (place) {
                                setSelectedCity(place);
                                setPostcodeFilter('');
                                loadBuddyProfiles();
                                showToast?.(`Searching buddies near ${place}`);
                              }
                            }
                          }}
                          placeholder="Suburb, postcode, city..."
                          className="bg-transparent text-zinc-900 dark:text-white text-xs font-semibold outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const place = placeSearchInput.trim();
                          if (place) {
                            setSelectedCity(place);
                            setPostcodeFilter('');
                            loadBuddyProfiles();
                            showToast?.(`Searching buddies near ${place}`);
                          }
                        }}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        GO
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* More Filters Toggle: Radius, Gender, Style (collapsible) */}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wider px-1 py-1.5 transition-colors cursor-pointer"
                    >
                      <span>CORRIDOR & DEMOGRAPHICS</span>
                      <span className="text-red-500 font-bold">{showAdvancedFilters ? '− Hide' : '+ Show'}</span>
                    </button>
                    {showAdvancedFilters && (
                      <div className="space-y-3 pt-1">
                        {/* Radius Slider & Presets */}
                        <div className="space-y-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-2.5 border border-zinc-200 dark:border-zinc-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              CORRIDOR RADIUS: <strong className="text-red-500 font-extrabold">{distanceKm} KM</strong>
                            </span>
                            <div className="flex items-center gap-1">
                              {[10, 25, 50, 100, 250].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setDistanceKm(preset)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                    distanceKm === preset
                                      ? 'bg-red-600 text-white'
                                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300'
                                  }`}
                                >
                                  {preset === 250 ? '250km' : `${preset}k`}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="250"
                            step="5"
                            value={distanceKm}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setDistanceKm(val);
                            }}
                            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                          />
                        </div>

                        {/* GENDER & WORKOUT STYLE */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            GENDER & TRAINING STYLE
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-2.5 py-2 gap-1.5">
                              <select
                                value={selectedGender}
                                onChange={(e) => {
                                  setSelectedGender(e.target.value);
                                  loadBuddyProfiles();
                                }}
                                className="bg-transparent text-zinc-900 dark:text-white text-xs font-semibold uppercase outline-none cursor-pointer w-full tracking-wider"
                              >
                                <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">ALL GENDERS</option>
                                {GENDERS.map((g) => (
                                  <option key={g} value={g} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white uppercase">
                                    {g.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-2.5 py-2 gap-1.5">
                              <select
                                value={selectedPref}
                                onChange={(e) => {
                                  setSelectedPref(e.target.value);
                                  loadBuddyProfiles();
                                }}
                                className="bg-transparent text-zinc-900 dark:text-white text-xs font-semibold uppercase outline-none cursor-pointer w-full tracking-wider"
                              >
                                <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">ALL STYLES</option>
                                {WORKOUT_PREFS.map((p) => (
                                  <option key={p} value={p} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white uppercase">
                                    {p.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. ACTIVITY SEARCH BAR */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      SEARCH ACTIVITIES
                    </label>
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2 gap-2">
                      <Search className="w-4 h-4 text-red-500 shrink-0" />
                      <input
                        type="text"
                        value={activitySearchInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivitySearchInput(val);
                          setUniversalSearchQuery(val);
                          loadBuddyProfiles(selectedBuddyCategory, val);
                        }}
                        placeholder="Search workouts, sports, recovery..."
                        className="bg-transparent text-zinc-900 dark:text-white text-xs font-semibold outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-500"
                      />
                      {activitySearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivitySearchInput('');
                            setUniversalSearchQuery('');
                            loadBuddyProfiles(selectedBuddyCategory, '');
                          }}
                          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions: RESET ALL & GO FIND PEOPLE */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity('');
                        setPlaceSearchInput('');
                        setPostcodeFilter('');
                        setSelectedGender('');
                        setSelectedPref('');
                        setDistanceKm(250);
                        setSelectedBuddyCategory('');
                        setUniversalSearchQuery('');
                        setActivitySearchInput('');
                        loadBuddyProfiles('', '');
                        showToast?.('Reset all search filters');
                      }}
                      className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer uppercase tracking-wider px-1"
                    >
                      RESET ALL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        loadBuddyProfiles();
                        setIsFilterOpen(false);
                        showToast?.('Finding your training partners...');
                      }}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <Users className="w-4 h-4" />
                      DISCOVER ATHLETES
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* INSTAGRAM-STYLE VERTICAL REEL MATCHES */}
            {isLoadingBuddy ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Scanning 250km Regional Corridor...
                </p>
              </div>
            ) : buddyProfiles.length === 0 ? (
              <div className="text-center py-8 px-6 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Athletes Found in Current Filter</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                    Expand your search corridor or reset filters to discover more athletes and training partners across the region.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  {distanceKm < 250 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceKm(250);
                        loadBuddyProfiles(selectedBuddyCategory, universalSearchQuery);
                        showToast?.('Expanded corridor to 250 km');
                      }}
                      className="px-3.5 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Expand to 250 km Corridor
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity('');
                      setPlaceSearchInput('');
                      setPostcodeFilter('');
                      setUniversalSearchQuery('');
                      setActivitySearchInput('');
                      setSelectedBuddyCategory('');
                      setSelectedGender('');
                      setSelectedPref('');
                      setDistanceKm(250);
                      loadBuddyProfiles('', '');
                      showToast?.('Reset all filters');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {buddyProfiles.filter(({ user }) => !dismissedUserIds[user.id]).map(({ user, matchPercentage, matchBreakdown }) => {
                  const matchColor = matchPercentage >= 85 ? '#5FBE6F' : matchPercentage >= 70 ? '#D4A843' : '#DC2626';
                  return (
                    <div
                      key={user.id}
                      className="relative aspect-[3/4] rounded-[16px] overflow-hidden bg-neutral-200 dark:bg-neutral-800 group select-none cursor-pointer transition-transform duration-500 active:scale-[0.98]"
                      onClick={() => setSelectedDetailedUser({ user, matchPercentage, matchBreakdown })}
                    >
                      {/* Photo */}
                      {user.user_avatar ? (
                        <img
                          src={user.user_avatar}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const sib = e.currentTarget.nextElementSibling as HTMLElement | null; if (sib) sib.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center" style={{ display: user.user_avatar ? 'none' : 'flex' }}>
                        <Users className="w-8 h-8 text-neutral-500 dark:text-neutral-400" />
                      </div>
                      {/* Cinematic gradient stack */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95" />
                      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
                      {/* Subtle inner border glow */}
                      <div className="absolute inset-0 rounded-[16px] ring-1 ring-white/10 group-hover:ring-white/25 transition-all duration-500" />

                      {/* TOP ROW: Tiny match badge + distance */}
                      <div className="absolute top-0 inset-x-0 z-10 p-1 flex items-center justify-between pointer-events-none">
                        <span
                          className="text-[7px] font-mono font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded backdrop-blur-md border whitespace-nowrap"
                          style={{ color: matchColor, backgroundColor: `${matchColor}20`, borderColor: `${matchColor}40` }}
                        >
                          {matchPercentage}%
                        </span>
                        {matchBreakdown?.distanceKm != null && (
                          <span className="text-[7px] font-mono font-extrabold bg-black/40 backdrop-blur-md text-white/80 px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap">
                            {matchBreakdown.distanceKm < 1 ? '<1km' : `${matchBreakdown.distanceKm.toFixed(0)}km`}
                          </span>
                        )}
                      </div>

                      {/* BOTTOM SECTION: Centered identity with corner actions */}
                      <div className="absolute bottom-0 inset-x-0 z-10 p-1.5 pb-2">
                        <div className="px-7 text-center">
                          <h3 className="text-[11px] font-extrabold text-white tracking-tight drop-shadow-lg truncate leading-tight">
                            {user.user_name.split(' ')[0]}, {user.age || 24}
                          </h3>
                          <p className="text-[8px] text-white/75 font-mono font-semibold truncate leading-tight mt-0.5">
                            {user.city_town}{user.favorite_gym ? ` · ${user.favorite_gym}` : ''}
                          </p>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setDismissedUserIds((prev) => ({ ...prev, [user.id]: true })); showToast?.('Passed'); }}
                          className="absolute bottom-2 left-1.5 w-6 h-6 rounded-md bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10 flex items-center justify-center transition-all active:scale-90"
                          title="Pass"
                        >
                          <X className="w-3 h-3 text-white/60" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenChat(user); }}
                          className="absolute bottom-2 right-1.5 w-6 h-6 rounded-md bg-black/40 backdrop-blur-md hover:bg-red-500/40 hover:border-red-400/50 border border-white/10 flex items-center justify-center transition-all active:scale-90"
                          title="Chat"
                        >
                          <MessageSquare className="w-3 h-3 text-white/80" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* INVITE A FRIEND PANEL */}
            <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="" className="w-10 h-10 rounded-full border-2 border-red-500/40 object-cover shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Invite a Friend</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Pair up for shared workouts and accountability</p>
                </div>
              </div>

              {/* Your Handle Row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-2">
                  <span className="text-sm font-mono font-bold text-red-500 truncate">{userHandle}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHandle}
                  className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 text-xs font-bold"
                >
                  {inviteCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{inviteCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Share App Link Button */}
              <button
                type="button"
                onClick={handleShareLink}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Share App Link
              </button>
            </div>
          </div>
        )}
        {activeTab === 'venues' && (
          <div className="p-3 space-y-2.5">
            {/* Structured Search Capsules */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 h-9 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 rounded-xl text-xs focus-within:border-red-500 transition-all flex-1 min-w-[140px]">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <input
                  type="text"
                  value={venueSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVenueSearchQuery(val);
                    loadVenues(val, venueCategoryFilter);
                  }}
                  placeholder="Search suburb, postcode or gym..."
                  className="bg-transparent text-zinc-900 dark:text-white outline-none w-full text-xs font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
                {venueSearchQuery && (
                  <button
                    onClick={() => {
                      setVenueSearchQuery('');
                      loadVenues('', venueCategoryFilter);
                    }}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs px-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={handleDetectGPSLocation}
                disabled={isLocating}
                className="h-9 px-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
              >
                <Compass className="w-3.5 h-3.5 text-red-500 dark:text-red-600" />
                <span>{isLocating ? 'Locating...' : 'GPS'}</span>
              </button>
            </div>

            {/* Category Pills Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {POPULAR_ACTIVITIES.map((cat) => {
                const isActive = venueCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setVenueCategoryFilter(cat.id);
                      loadVenues(venueSearchQuery, cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsSportsSearchOpen(true)}
                className="px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:border-amber-500 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3 h-3 text-amber-500" />
                <span>More Sports...</span>
              </button>
            </div>

            {/* Booking Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 rounded-xl text-xs focus-within:border-red-500 transition-all">
                <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <input
                  type="date"
                  value={venueDateFilter}
                  onChange={(e) => setVenueDateFilter(e.target.value)}
                  className="bg-transparent text-zinc-900 dark:text-white outline-none w-full text-xs font-semibold [color-scheme:light dark] cursor-pointer"
                />
                {venueDateFilter && (
                  <button
                    onClick={() => setVenueDateFilter('')}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs px-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {venueDateFilter && (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 whitespace-nowrap">
                  {new Date(venueDateFilter).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {/* Venue Cards List */}
            <div className="space-y-2.5">
              {isLoadingVenues ? (
                <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                  <span>Searching regional venue network...</span>
                </div>
              ) : venues.length === 0 ? (
                venueSearchQuery.trim() ? (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Can't find exact match?</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Use "{venueSearchQuery}" as your custom meetup spot.</p>
                    </div>
                    <button
                      onClick={() => {
                        handleCheckInCustom(venueSearchQuery);
                        showToast?.(`"${venueSearchQuery}" selected as meetup spot`);
                      }}
                      className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      + Use "{venueSearchQuery}" as Meetup Spot
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
                    <MapPin className="w-6 h-6 text-red-500 mx-auto" />
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">No Gyms or Venues in Corridor</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Search by suburb, postcode, or select another activity category above.</p>
                  </div>
                )
              ) : (
                venues.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-white dark:bg-[#14171F] p-4 hover:border-[#1A1E1D] dark:hover:border-white/20 transition-all shadow-2xs w-full max-w-full overflow-hidden"
                  >
                    {/* Row 1: Name + Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.category === 'Gym' ? '#DC2626' : v.category === 'Barbell Club' ? '#FF6B35' : v.category === '24/7 Gym' ? '#4A90D9' : v.category === 'CrossFit' ? '#E84855' : v.category === 'Functional' ? '#D4A843' : v.category === 'Yoga' ? '#5FBE6F' : v.category === 'Pilates' ? '#7A9382' : v.category === 'Climbing' ? '#8B5A2B' : v.category === 'Sauna' ? '#E84855' : v.category === 'Combat' ? '#1A1E1D' : v.category === 'Padel' ? '#D4A843' : '#5A8F3E' }} />
                        <h4 className="text-[13px] font-bold text-[#000000] dark:text-white truncate">
                          {v.name}
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-full border border-[#DC2626]/20 uppercase shrink-0 whitespace-nowrap">
                        {v.category}
                      </span>
                    </div>

                    {/* Row 2: Address + Distance + Rating */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {v.distance && (
                        <span className="text-[10px] font-bold text-[#4A90D9] bg-[#4A90D9]/10 px-2 py-0.5 rounded-full border border-[#4A90D9]/20">
                          {v.distance}
                        </span>
                      )}
                      {v.rating && (
                        <span className="text-[10px] font-bold text-[#D4A843] flex items-center gap-0.5">
                          <span>&#9733;</span> {v.rating}
                        </span>
                      )}
                      {v.status && (
                        <span className="text-[10px] font-bold text-[#5FBE6F] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5FBE6F]" />
                          {v.status}
                        </span>
                      )}
                    </div>

                    {/* Row 3: Address link */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + ' ' + (v.address || v.city))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-1.5 min-w-0 max-w-full hover:text-[#DC2626] transition-colors mb-2"
                    >
                      <MapPin className="w-3 h-3 text-[#DC2626] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#5A5F5D] dark:text-gray-400 font-semibold leading-relaxed line-clamp-1">
                        {v.address || v.city}{v.city && v.country ? `, ${v.country}` : ''}
                      </p>
                    </a>

                    {/* Row 4: Vibe tags */}
                    {v.vibe_tags && v.vibe_tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {v.vibe_tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold text-[#5A5F5D] dark:text-gray-300 bg-[#F2F2F7] dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-[rgba(0,0,0,0.08)] dark:border-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                        {v.active_checkins_count > 0 && (
                          <span className="text-[9px] text-[#7A9382] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7A9382]" />
                            {v.active_checkins_count} training now
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 5: Action Buttons */}
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => {
                          handleCheckIn(v.id);
                          handleOpenMeetingModal({ user_email: '', user_name: '', user_avatar: '', gender: '' as any, city_town: v.city || '', postcode: '', partner_status: 'Open for Gym Date', venue_id: v.id, rpe_target: 8, volume_level: 18, training_focus: 'Hypertrophy', workout_preferences: [], age: 0, favorite_gym: v.name, vector_array: [], updated_at: '', id: v.id } as any);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#1A1E1D] dark:bg-white text-white dark:text-black font-bold text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="w-3 h-3" />
                        Set Meetup
                      </button>
                      <button
                        onClick={() => handleBuyPass(v)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Ticket className="w-3 h-3" />
                        Passes
                      </button>
                      <button
                        onClick={() => {
                          handleCheckIn(v.id);
                          showToast?.(`Invite sent for ${v.name}!`);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-white/10 hover:bg-[#E5E5EA] dark:hover:bg-white/20 text-[#000000] dark:text-white font-bold text-[11px] cursor-pointer transition-all border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3 h-3" />
                        Invite
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY DAY PASSES */}
        {activeTab === 'passes' && (
          <div className="p-2 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#DC2626]" />
                My Day Passes
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 rounded-full border border-[#DC2626]/20">
                {userPasses.filter(p => !p.redeemed).length} Active
              </span>
            </div>

            {userPasses.length === 0 ? (
              <div className="text-center py-4 bg-gradient-to-br from-[#F7F5F0] to-white dark:from-white/5 dark:to-black/20 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 p-4 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#FF6B35] flex items-center justify-center shadow-lg shadow-[#DC2626]/20">
                  <Ticket className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-sm font-mono font-black text-slate-900 dark:text-white">No Passes Yet</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 font-mono max-w-[220px] mx-auto">
                  Visit the Gym Venues tab to grab a day pass from any nearby gym. Walk-ins also accepted at front desk.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userPasses.map((pass) => (
                  <div
                    key={pass.id}
                    onClick={() => setSelectedPass(pass)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer space-y-2 overflow-hidden ${
                      pass.redeemed
                        ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-60'
                        : 'bg-gradient-to-br from-slate-50 to-white dark:from-[#1A1E1D] dark:to-[#0A0A0B] border-[#DC2626]/30 hover:border-[#DC2626]/60 shadow-lg shadow-[#DC2626]/10'
                    }`}
                  >
                    {/* Decorative corner notch */}
                    {!pass.redeemed && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#DC2626]/20 to-transparent rounded-bl-full pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${
                        pass.redeemed ? 'text-slate-400' : 'text-[#FF6B35]'
                      }`}>
                        {pass.pass_type}
                      </span>
                      <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md ${
                        pass.redeemed
                          ? 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-gray-500'
                          : 'bg-[#5FBE6F]/20 text-[#5FBE6F] border border-[#5FBE6F]/30'
                      }`}>
                        {pass.redeemed ? 'REDEEMED' : 'READY TO SCAN'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-mono font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                        {pass.venue_name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">Token</span>
                      <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-300">{pass.pass_token}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REAL-TIME NOTIFICATIONS & CONNECTION REQUESTS */}
        {activeTab === 'notifications' && (
          <div className="p-2 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Real-time Buddy Notifications</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                  {notifications.filter((n) => n.status === 'pending').length} Pending
                </span>
              </h3>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                <Bell className="w-7 h-7 text-slate-600 dark:text-gray-300 mx-auto" />
                <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white">No Buddy Notifications Yet</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 font-mono">
                  When potential partners connect or suggest a meeting time, alerts will appear here in real time!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${
                      notif.status === 'pending'
                        ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/40 shadow-lg'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {notif.sender_avatar ? (
                          <img
                            src={notif.sender_avatar}
                            alt={notif.sender_name}
                            className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-mono font-black text-xs flex items-center justify-center">
                            {notif.sender_name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{notif.sender_name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                notif.type === 'meeting_suggestion'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                                  : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30'
                              }`}
                            >
                              {notif.type === 'meeting_suggestion' ? 'Meeting Time' : 'Connection Request'}
                            </span>
                          </h4>
                          <span className="text-[9.5px] font-mono text-slate-500 dark:text-gray-400">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          notif.status === 'pending'
                            ? 'bg-amber-500 text-black'
                            : notif.status === 'accepted'
                            ? 'bg-red-500 text-black'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {notif.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-800 dark:text-gray-200 bg-white/60 dark:bg-black/40 p-2 rounded-xl border border-slate-200 dark:border-white/10">
                      {notif.message}
                    </p>

                    {notif.meeting_venue && (
                      <div className="flex items-center justify-between text-[11px] font-mono bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> Venue: <strong>{notif.meeting_venue}</strong></span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" /> Time: <strong>{notif.meeting_time}</strong></span>
                      </div>
                    )}

                    {notif.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRespondNotification(notif.id, 'accepted')}
                          className="flex-1 py-1.5 bg-red-500 hover:bg-red-400 text-black font-mono font-bold text-xs rounded-xl cursor-pointer shadow-md active:scale-95"
                        >
                          Accept {notif.type === 'meeting_suggestion' ? 'Meeting' : 'Partner'}
                        </button>
                        <button
                          onClick={() => handleRespondNotification(notif.id, 'declined')}
                          className="flex-1 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-600 dark:text-gray-300 font-mono font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        </div>

        {selectedPass && (
          <div
            className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center pt-10 sm:pt-14 p-3 overflow-y-auto"
            onClick={() => setSelectedPass(null)}
          >
            <div
              className="bg-white dark:bg-gradient-to-b dark:from-[#1A1E1D] dark:to-[#0A0A0B] border border-neutral-200 dark:border-[#DC2626]/40 rounded-3xl p-3.5 max-w-xs w-full text-center space-y-4 shadow-2xl relative text-zinc-900 dark:text-white my-0 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPass(null)}
                className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#FF6B35] uppercase tracking-widest block font-black">
                  Digital Turnstile Pass
                </span>
                <h3 className="text-sm font-mono font-black flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                  {selectedPass.venue_name}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedPass.venue_name || '') + ' gym')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-100 dark:bg-[#14171F] hover:bg-slate-200 dark:hover:bg-[#2A2E2D] text-slate-900 dark:text-white font-mono font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                  Open in Maps
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPass(null);
                    if (meetingTargetUser) {
                      setMeetingVenueInput(selectedPass.venue_name || '');
                    }
                    showToast?.('Ready to propose a workout session!');
                  }}
                  className="w-full py-2.5 bg-[#5FBE6F] hover:bg-[#4ea85e] text-black font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Propose Workout Session
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <span className="text-[10px] font-mono text-gray-400 block">Token</span>
                <span className="text-[11px] font-mono font-black text-cyan-300">{selectedPass.pass_token}</span>
              </div>

              {!selectedPass.redeemed ? (
                <button
                  onClick={() => handleRedeemPass(selectedPass.pass_token)}
                  className="w-full py-2 bg-gradient-to-r from-[#DC2626] to-[#FF6B35] hover:from-[#B91C1C] hover:to-[#e55a2b] text-white font-mono font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-[#DC2626]/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Simulate Gate Scan
                </button>
              ) : (
                <div className="w-full py-2 bg-white/5 text-gray-400 font-mono font-black text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pass Redeemed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: SUGGEST MEETING TIME */}
        {meetingTargetUser && (
          <div
            className="fixed inset-0 z-[220] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
            onClick={() => setMeetingTargetUser(null)}
          >
            <div
              className="w-full max-w-[400px] bg-white dark:bg-[#151518] text-slate-900 dark:text-white rounded-3xl p-3.5 shadow-2xl border border-slate-200 dark:border-gray-800 relative z-10 my-auto max-h-[92vh] overflow-y-auto select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {meetingTargetUser.user_avatar ? (
                    <img
                      src={meetingTargetUser.user_avatar}
                      alt=""
                      className="w-10 h-10 rounded-full border border-gray-700 object-cover shrink-0 shadow-md"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const sib = e.currentTarget.nextElementSibling as HTMLElement | null; if (sib) sib.style.display = 'flex'; }}
                    />
                  ) : null}
                  {!meetingTargetUser.user_avatar && (
                    <div className="w-10 h-10 rounded-full border border-gray-700 bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center shrink-0 shadow-md">
                      <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-red-500 tracking-widest uppercase">
                      PROPOSE GYM DATE & TIME
                    </p>
                    <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">
                      Schedule with {meetingTargetUser.user_name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setMeetingTargetUser(null)}
                  className="text-gray-500 hover:text-white transition cursor-pointer p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Gym Venue Search Section */}
              <div className="mb-5 relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-bold tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> GYM VENUE SEARCH
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider">
                    {selectedVenueDetails?.status || 'OPEN 24/7'}
                  </p>
                </div>

                {/* Unified Venue Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={venueSearchQuery}
                    onChange={(e) => {
                      setVenueSearchQuery(e.target.value);
                      setMeetingVenueInput(e.target.value);
                      setShowVenueDropdown(true);
                      searchBookingVenues(e.target.value);
                    }}
                    onFocus={() => setShowVenueDropdown(true)}
                    placeholder="Search any gym, sport venue, suburb or postcode..."
                    className="w-full buddy-input rounded-2xl pl-10 pr-10 py-3 text-sm font-medium outline-none focus:border-red-500/50 transition-colors"
                    autoComplete="off"
                  />
                  {venueSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setVenueSearchQuery('');
                        setMeetingVenueInput('');
                        setSelectedVenueDetails(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Functional Dropdown Search Results */}
                {showVenueDropdown && (
                  <div className="absolute top-16 left-0 right-0 w-full bg-white dark:bg-[#18181D] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-30 overflow-hidden max-h-56 overflow-y-auto">
                    {/* Always show custom meetup spot option at top */}
                    {venueSearchQuery.trim() && (
                      <div
                        onClick={() => {
                          setMeetingVenueInput(venueSearchQuery);
                          setSelectedVenueDetails({
                            name: venueSearchQuery,
                            address: 'Custom meetup location',
                            distance: 'Near You',
                            status: 'Open Access',
                          });
                          setShowVenueDropdown(false);
                        }}
                        className="p-3 hover:bg-[#2A2A35] cursor-pointer transition flex justify-between items-center text-sm font-bold text-red-400 border-b border-slate-200 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="truncate">+ Use "{venueSearchQuery}" as Meetup Spot</span>
                        </div>
                        <span className="text-[10px] bg-red-950 text-red-400 px-2 py-1 rounded-md font-bold uppercase shrink-0">
                          Select
                        </span>
                      </div>
                    )}
                    {isSearchingVenues && (
                      <div className="p-3 text-center text-xs text-gray-500 animate-pulse">Searching venues...</div>
                    )}
                    {filteredVenuesList.length > 0 && (
                      <>
                        {filteredVenuesList.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setMeetingVenueInput(v.name);
                              setVenueSearchQuery(v.name);
                              if ((v as any).postcode) setVenuePostcodeInput((v as any).postcode);
                              setSelectedVenueDetails({
                                name: v.name,
                                address: v.address,
                                distance: v.distance,
                                status: v.status,
                              });
                              setShowVenueDropdown(false);
                            }}
                            className="p-3 hover:bg-[#2A2A35] cursor-pointer transition border-b border-slate-200 dark:border-gray-800 last:border-none flex justify-between items-center"
                          >
                            <div className="min-w-0 pr-2">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span className="truncate">{v.name}</span>
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{v.address}</p>
                            </div>
                            <span className="text-[10px] bg-red-950 text-red-400 px-2 py-1 rounded-md font-bold shrink-0">
                              {v.distance}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                    {!isSearchingVenues && filteredVenuesList.length === 0 && venueSearchQuery.trim() && (
                      <div className="p-3 text-center text-xs text-gray-500">No venues found -- use the custom option above</div>
                    )}
                  </div>
                )}

                {/* Selected Venue Tag */}
                {selectedVenueDetails && !showVenueDropdown && (
                  <div className="mt-2.5 bg-slate-50 dark:bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-slate-200 dark:border-gray-800 rounded-2xl p-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-white flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate">{selectedVenueDetails.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{selectedVenueDetails.address}</p>
                    </div>
                    <span className="text-[10px] bg-red-950/80 text-red-400 px-2 py-1 rounded-md font-bold shrink-0 border border-red-900/50">
                      {selectedVenueDetails.distance}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Date & Time Section */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-bold tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" /> PROPOSED DATE & TIME
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider">FORMAL SCHEDULE</p>
                </div>

                {/* Date & Time Row */}
                <div className="flex gap-2">
                  {/* Date Capsule */}
                  <div className="flex-[3] buddy-input rounded-full flex items-center px-4 py-2 relative hover:border-slate-400 dark:hover:border-gray-600 focus-within:border-red-500/80 transition">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                    <input
                      type="date"
                      value={meetingDateInput}
                      onChange={(e) => setMeetingDateInput(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-sm text-white appearance-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>

                  {/* Time Capsule */}
                  <div className="flex-[2] buddy-input rounded-full flex items-center px-4 py-2 relative hover:border-slate-400 dark:hover:border-gray-600 focus-within:border-red-500/80 transition">
                    <Clock className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                    <input
                      type="time"
                      value={meetingTimeSlotInput}
                      onChange={(e) => setMeetingTimeSlotInput(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-sm text-white appearance-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Formatted Date & Time Badge */}
                {meetingTimeInput && (
                  <div className="mt-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-gray-800 rounded-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 dark:text-gray-300 font-mono">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-white font-bold">{meetingTimeInput}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMeetingTimeInput('')}
                      className="text-gray-500 hover:text-white text-xs cursor-pointer ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Workout Note */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 font-bold tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                  <Dumbbell className="w-3.5 h-3.5 text-red-500" />
                  <span>WORKOUT NOTE / PLAN</span>
                </p>
                <textarea
                  value={meetingNoteInput}
                  onChange={(e) => setMeetingNoteInput(e.target.value)}
                  placeholder="E.g., Down for heavy leg day & post-workout protein shake!"
                  className="w-full buddy-input rounded-xl p-3 text-sm outline-none hover:border-slate-400 dark:hover:border-gray-600 focus:border-red-500 transition resize-none h-20"
                />
              </div>

              {/* Footer Action */}
              <button
                onClick={handleSendMeetingSuggestion}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition text-sm cursor-pointer shadow-lg active:scale-98"
              >
                <CalendarPlus className="w-5 h-5" />
                <span>Send Real-time Proposal</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL: DIRECT CHAT CHANNEL */}
        {activeChatUser && (
          <div
            className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center pt-10 sm:pt-14 p-3 overflow-y-auto"
            onClick={() => setActiveChatUser(null)}
          >
            <div
              className="bg-white dark:bg-[#12141C] border border-red-500/40 rounded-2xl w-full max-w-sm h-[460px] text-slate-900 dark:text-white shadow-2xl relative flex flex-col overflow-hidden my-0 max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeChatUser.user_avatar ? (
                    <img
                      src={activeChatUser.user_avatar}
                      alt=""
                      className="w-8 h-8 rounded-full border border-red-400 object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const sib = e.currentTarget.nextElementSibling as HTMLElement | null; if (sib) sib.style.display = 'flex'; }}
                    />
                  ) : null}
                  {!activeChatUser.user_avatar && (
                    <div className="w-8 h-8 rounded-full border border-red-400 bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {activeChatUser.user_name}
                    </h4>
                    <span className="text-[9.5px] font-mono text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{activeChatUser.partner_status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const userToPropose = activeChatUser;
                      setActiveChatUser(null);
                      handleOpenMeetingModal(userToPropose);
                    }}
                    className="px-2 py-1 bg-gradient-to-r from-[#DC2626] to-[#FF6B35] hover:from-[#B91C1C] hover:to-[#e55a2b] text-white border border-[#DC2626]/40 font-mono text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-[#DC2626]/20"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Book Gym Date</span>
                  </button>

                  <button
                    onClick={() => setActiveChatUser(null)}
                    className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#F2F2F7] dark:bg-[#000000] text-xs font-mono">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-gray-500 text-[11px]">
                    Propose a workout or start communicating with your training partner.
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender_email === currentUserEmail;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] p-2 rounded-xl text-[11px] ${
                            isMe
                              ? 'bg-red-500 text-black font-bold'
                              : 'bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/80 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type message..."
                  className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 text-xs font-mono text-slate-900 dark:text-white p-2 rounded-xl outline-none flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-red-500 hover:bg-red-400 text-black font-mono font-bold text-xs rounded-xl cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

      {/* DETAILED PROFILE & MEDIA VAULT MODAL VIEW */}
      {selectedDetailedUser && (
        <div
          className="fixed inset-0 z-[210] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center pt-6 sm:pt-10 p-2 sm:p-4 overflow-y-auto"
          onClick={() => {
            setSelectedDetailedUser(null);
            setLightboxMedia(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#000000] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-3xl w-full max-w-xl text-[#000000] dark:text-[#FFFFFF] shadow-2xl relative max-h-[85vh] overflow-y-auto flex flex-col my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header with Back Button & Tab Bar */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md p-2 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedDetailedUser(null);
                    setLightboxMedia(null);
                  }}
                  className="flex items-center gap-1 text-xs font-mono font-bold text-[#000000] dark:text-white hover:text-[#DC2626] bg-[#F2F2F7] dark:bg-white/10 px-1.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] dark:border-white/10 transition-colors cursor-pointer"
                >
                  <span>← Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDetailedUser(null);
                      setLightboxMedia(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-[#F2F2F7] dark:hover:bg-white/10 text-[#848785] transition-colors cursor-pointer"
                    title="Close Profile"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Overview | Media Vault | Training Metrics */}
              <div className="flex items-center gap-2 p-1 bg-[#F2F2F7] dark:bg-black/60 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-xs overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setProfileModalTab('overview')}
                  className={`px-1.5 py-0.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap text-center shrink-0 tracking-wide ${
                    profileModalTab === 'overview'
                      ? 'bg-[#1A1E1D] dark:bg-white text-white dark:text-black shadow-2xs font-black'
                      : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#000000] dark:hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setProfileModalTab('vault')}
                  className={`px-1.5 py-0.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap text-center flex items-center justify-center gap-2 shrink-0 tracking-wide ${
                    profileModalTab === 'vault'
                      ? 'bg-[#DC2626] text-white shadow-2xs font-black'
                      : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#DC2626]'
                  }`}
                >
                  <span>Vault</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">4</span>
                </button>
                <button
                  onClick={() => setProfileModalTab('metrics')}
                  className={`px-1.5 py-0.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap text-center shrink-0 tracking-wide ${
                    profileModalTab === 'metrics'
                      ? 'bg-[#7A9382] text-white shadow-2xs font-black'
                      : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#7A9382]'
                  }`}
                >
                  Metrics
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & BIO */}
            {profileModalTab === 'overview' && (
              <div className="space-y-0">
                {/* HERO COVER — full-bleed cinematic photo */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  {selectedDetailedUser.user.user_avatar ? (
                    <img
                      src={selectedDetailedUser.user.user_avatar}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const sib = e.currentTarget.nextElementSibling as HTMLElement | null; if (sib) sib.style.display = 'flex'; }}
                    />
                  ) : null}
                  {!selectedDetailedUser.user.user_avatar && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                      <Users className="w-12 h-12 text-neutral-500 dark:text-neutral-400" />
                    </div>
                  )}
                  {/* Cinematic gradient stack */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Top-right: Match ring + close */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {(() => {
                      const pct = selectedDetailedUser.matchPercentage;
                      const ringColor = pct >= 85 ? '#5FBE6F' : pct >= 70 ? '#D4A843' : '#DC2626';
                      return (
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/15">
                          <div className="relative w-8 h-8 flex items-center justify-center">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
                              <circle
                                cx="16" cy="16" r="13" fill="none"
                                stroke={ringColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={`${(pct / 100) * 81.6} 81.6`}
                                style={{ filter: `drop-shadow(0 0 4px ${ringColor}80)` }}
                              />
                            </svg>
                            <span className="absolute text-[8px] font-black text-white leading-none">{pct}</span>
                          </div>
                          <span className="text-[10px] font-mono font-black" style={{ color: ringColor }}>
                            MATCH
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom: Name, verified badge, location */}
                  <div className="absolute bottom-0 inset-x-0 p-4 text-white space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-display font-black tracking-tight drop-shadow-2xl">
                        {selectedDetailedUser.user.user_name.split(' ')[0]}, {selectedDetailedUser.user.age || 24}
                      </h2>
                      <div className="w-5 h-5 rounded-full bg-[#5FBE6F] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-200">
                      <MapPin className="w-3 h-3 text-[#DC2626]" />
                      <span className="font-semibold">{selectedDetailedUser.user.city_town}</span>
                      {selectedDetailedUser.user.favorite_gym && (
                        <>
                          <span className="text-white/30">·</span>
                          <span className="text-slate-600 dark:text-gray-300">{selectedDetailedUser.user.favorite_gym}</span>
                        </>
                      )}
                    </div>
                    {/* Vibe tags row */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[9px] font-mono font-bold text-red-300 bg-red-500/20 border border-red-400/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                        {selectedDetailedUser.user.partner_status}
                      </span>
                      {selectedDetailedUser.user.workout_preferences?.slice(0, 2).map((pref, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono font-bold text-white/80 bg-white/10 backdrop-blur-sm border border-white/15 px-1.5 py-0.5 rounded-md"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONTENT BODY */}
                <div className="p-4 space-y-3">
                  {/* Quick Stats Strip — 3-column premium */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-[#F7F5F0] to-white dark:from-white/5 dark:to-black/20 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col items-center text-center">
                      <span className="text-lg font-black text-[#DC2626]">{selectedDetailedUser.user.rpe_target}</span>
                      <span className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase mt-0.5">RPE / 10</span>
                    </div>
                    <div className="bg-gradient-to-br from-[#F7F5F0] to-white dark:from-white/5 dark:to-black/20 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col items-center text-center">
                      <span className="text-lg font-black text-[#000000] dark:text-white">{selectedDetailedUser.user.volume_level || 18}</span>
                      <span className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase mt-0.5">Sets / Wk</span>
                    </div>
                    <div className="bg-gradient-to-br from-[#F7F5F0] to-white dark:from-white/5 dark:to-black/20 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col items-center text-center">
                      <span className="text-lg font-black text-[#7A9382]">{selectedDetailedUser.user.training_focus?.slice(0, 4) || 'Hyper'}</span>
                      <span className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase mt-0.5">Focus</span>
                    </div>
                  </div>

                  {/* Match Breakdown — premium animated bars */}
                  {selectedDetailedUser.matchBreakdown && (() => {
                    const mb = selectedDetailedUser.matchBreakdown;
                    const bars = [
                      { label: 'Training Style', value: mb.trainingSimilarity, color: '#DC2626' },
                      { label: 'Activity Overlap', value: mb.activityOverlap, color: '#7A9382' },
                      { label: 'Proximity', value: mb.proximity, color: '#D4A843' },
                      { label: 'Status Align', value: mb.statusAlignment, color: '#5FBE6F' },
                      { label: 'Intensity Match', value: mb.intensityCompatibility, color: '#FF6B35' },
                    ];
                    return (
                      <div className="bg-gradient-to-br from-[#F7F5F0] to-white dark:from-white/5 dark:to-black/20 p-4 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono font-black text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider">
                            Match Breakdown
                          </h3>
                          {mb.distanceKm != null && (
                            <span className="text-[10px] font-mono font-bold text-white bg-[#DC2626] px-1.5 py-0.5 rounded-full">
                              {mb.distanceKm < 1 ? '<1 km' : `${mb.distanceKm.toFixed(1)} km`}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {bars.map((bar, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bar.color }} />
                              <span className="text-[10px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 w-28 shrink-0">{bar.label}</span>
                              <div className="flex-1 h-2.5 bg-[#E5E5EA] dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${Math.round(bar.value * 100)}%`,
                                    background: bar.value > 0.7
                                      ? 'linear-gradient(90deg, #5B8C5A, #3B7A57)'
                                      : bar.value > 0.4
                                      ? 'linear-gradient(90deg, #D4A843, #F59E0B)'
                                      : 'linear-gradient(90deg, #DC2626, #FF6B35)',
                                    boxShadow: bar.value > 0.7 ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-black text-[#000000] dark:text-white w-8 text-right shrink-0">
                                {Math.round(bar.value * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bio — premium quote-card style */}
                  <div className="space-y-1.5">
                    <h3 className="text-[10px] font-mono font-black text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider">
                      About
                    </h3>
                    <div className="relative bg-gradient-to-br from-white to-[#F7F5F0] dark:from-black/40 dark:to-white/5 p-4 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-sm leading-relaxed font-sans text-[#000000] dark:text-gray-200">
                      <span className="absolute top-2 left-3 text-3xl text-[#DC2626]/15 font-serif leading-none">“</span>
                      <p className="pl-5">
                        {selectedDetailedUser.user.bio || "Looking for a deadlift or leg day partner at Equinox! Heavy sets & post-workout protein smoothies"}
                      </p>
                    </div>
                  </div>

                  {/* Training Matrix — premium card */}
                  <div className="space-y-1.5">
                    <h3 className="text-[10px] font-mono font-black text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider">
                      Training Matrix
                    </h3>
                    <div className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center pb-2 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                        <span className="text-[#5A5F5D] dark:text-gray-400">Home Gym</span>
                        <span className="font-bold text-[#000000] dark:text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#DC2626]" />
                          {selectedDetailedUser.user.favorite_gym || 'Equinox Hudson Yards'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                        <span className="text-[#5A5F5D] dark:text-gray-400">Focus Split</span>
                        <span className="font-bold text-[#DC2626]">{selectedDetailedUser.user.training_focus}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5A5F5D] dark:text-gray-400">Target Volume</span>
                        <span className="font-bold text-[#000000] dark:text-white">{selectedDetailedUser.user.volume_level || 18} Sets / Wk</span>
                      </div>
                    </div>
                  </div>

                  {/* Vibe Tags */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {selectedDetailedUser.user.workout_preferences?.map((pref, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono font-bold bg-gradient-to-r from-[#F7F5F0] to-white dark:from-white/5 dark:to-white/10 border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-[#000000] dark:text-slate-600 dark:text-gray-300 px-2 py-1 rounded-full whitespace-nowrap shrink-0"
                      >
                        #{pref}
                      </span>
                    ))}
                  </div>

                  {/* Halfway Between Us - Mutual Gym Finder */}
                  {userCoords && selectedDetailedUser.user.lat && selectedDetailedUser.user.lng && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoadingMidpoint(true);
                          const gyms = await findMidpointGyms(
                            userCoords.lat, userCoords.lng,
                            selectedDetailedUser.user.lat!, selectedDetailedUser.user.lng!
                          );
                          setMidpointGyms(gyms);
                          setIsLoadingMidpoint(false);
                        }}
                        className="w-full py-2 bg-[#D4A843]/20 hover:bg-[#D4A843]/30 text-[#D4A843] font-mono font-black text-xs rounded-xl border border-[#D4A843]/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Compass className="w-4 h-4" />
                        Find Gyms Halfway Between Us
                      </button>
                      {isLoadingMidpoint && (
                        <div className="text-center py-2 text-[11px] font-mono text-gray-400 animate-pulse">
                          Searching gyms near the midpoint...
                        </div>
                      )}
                      {midpointGyms.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-mono font-black text-[#D4A843] uppercase tracking-wider">
                            Mutual Meetup Gyms
                          </h4>
                          {midpointGyms.slice(0, 5).map((gym) => (
                            <div key={gym.id} className="bg-slate-100 dark:bg-[#14171F] border border-slate-200 dark:border-[#2A2E2D] rounded-xl p-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[11px] font-bold text-white truncate flex-1">{gym.name}</h5>
                                <div className="flex gap-1 shrink-0">
                                  {gym.amenityTags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-[8px] font-mono font-bold text-gray-400 bg-white/5 px-1 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 leading-relaxed break-words line-clamp-2">{gym.address}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-[#7A9382]">
                                  {gym.distFromA.toFixed(1)}km from you &middot; {gym.distFromB.toFixed(1)}km from {selectedDetailedUser.user.user_name.split(' ')[0]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMeetingVenueInput(gym.name);
                                    setVenueSearchQuery(gym.name);
                                    setSelectedVenueDetails({
                                      name: gym.name,
                                      address: gym.address,
                                      distance: `${gym.distFromA.toFixed(1)}km`,
                                      status: 'Open Access',
                                    });
                                    handleOpenMeetingModal(selectedDetailedUser.user);
                                    setSelectedDetailedUser(null);
                                  }}
                                  className="text-[9px] font-mono font-black text-[#5FBE6F] hover:text-white bg-[#5FBE6F]/10 hover:bg-[#5FBE6F]/20 px-2 py-1 rounded-lg border border-[#5FBE6F]/30 cursor-pointer transition-all"
                                >
                                  Propose Session Here
                                </button>
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name + ' ' + gym.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold text-[#4A90D9] hover:text-white bg-[#4A90D9]/10 hover:bg-[#4A90D9]/20 px-2 py-1 rounded-lg border border-[#4A90D9]/30 transition-all w-full text-center"
                              >
                                <MapPin className="w-3 h-3" />
                                Open in Maps
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA & PROGRESS VAULT */}
            {profileModalTab === 'vault' && (
              <div className="p-4 space-y-3 font-mono text-xs">
                {/* Real uploaded media from profile_media */}
                {buddyMediaItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider">
                      Profile Gallery
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {buddyMediaItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setLightboxMedia({ id: item.id, type: item.media_type === 'video' ? 'video' : 'photo', url: item.media_url, title: item.caption || '', category: item.media_type, date: new Date(item.created_at).toLocaleDateString(), likes: 0, caption: item.caption || '' })}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {item.media_type === 'video' ? (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          ) : (
                            <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media & Progress Vault Grid */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider">
                      Curated Vault & Form Checks
                    </h3>
                    <span className="text-[10px] text-[#848785]">Tap thumbnail to expand high-res viewer</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: `${selectedDetailedUser.user.id}-v1`,
                        type: 'photo' as const,
                        url: selectedDetailedUser.user.gender === 'Female'
                          ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=800&q=80',
                        title: 'Physique & Conditioning Check',
                        category: 'Physique Update',
                        date: '2 days ago',
                        likes: 184,
                        caption: `Sub 10% condition update ahead of peak block. Average training intensity RPE ${selectedDetailedUser.user.rpe_target}.`,
                      },
                      {
                        id: `${selectedDetailedUser.user.id}-v2`,
                        type: 'video' as const,
                        url: selectedDetailedUser.user.gender === 'Female'
                          ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
                        title: `${selectedDetailedUser.user.training_focus} Top Set Form Check`,
                        category: 'PR Form Check',
                        date: '5 days ago',
                        likes: 242,
                        caption: `Heavy PR attempt at ${selectedDetailedUser.user.favorite_gym || 'Equinox'}. Depth locked in with solid lockouts!`,
                      },
                      {
                        id: `${selectedDetailedUser.user.id}-v3`,
                        type: 'video' as const,
                        url: selectedDetailedUser.user.gender === 'Female'
                          ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
                        title: 'High-Volume Hypertrophy Set',
                        category: 'Training Reel',
                        date: '1 week ago',
                        likes: 310,
                        caption: 'Supersetting cable flyes with incline presses. Focus on time under tension and peak contraction.',
                      },
                      {
                        id: `${selectedDetailedUser.user.id}-v4`,
                        type: 'photo' as const,
                        url: selectedDetailedUser.user.gender === 'Female'
                          ? 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
                        title: 'Post-Workout Recovery Protocol',
                        category: 'Conditioning Clip',
                        date: '2 weeks ago',
                        likes: 129,
                        caption: 'Post-session recovery: 20 min infrared sauna session + 80g carbs & whey isolate refuel.',
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setLightboxMedia(item);
                          setIsMediaPlaying(item.type === 'video');
                        }}
                        className="group relative h-40 rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-black cursor-pointer shadow-2xs hover:border-[#DC2626] transition-all"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

                        {/* Top Category Tag */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white shadow-2xs">
                            {item.category}
                          </span>
                        </div>

                        {/* Center Play Icon for Video */}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform shadow-lg">
                              ▶
                            </div>
                          </div>
                        )}

                        {/* Bottom Title & Likes */}
                        <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] space-y-0.5">
                          <div className="font-bold truncate">{item.title}</div>
                          <div className="flex justify-between items-center text-[8.5px] text-slate-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500/20" />
                              <span>{item.likes}</span>
                            </span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TRAINING & METRICS */}
            {profileModalTab === 'metrics' && (
              <div className="p-4 space-y-2 font-mono text-xs">
                {/* Exercise PR History */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-[#DC2626]" /> Exercise History & Personal Records
                  </h3>
                  <div className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2">
                    <div className="flex justify-between items-center pb-1.5 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                      <div>
                        <div className="font-bold text-[#000000] dark:text-white">Barbell Back Squat</div>
                        <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">3 sets x 3 reps • RPE 9.0</div>
                      </div>
                      <span className="font-black text-[#DC2626] text-sm">210 kg</span>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                      <div>
                        <div className="font-bold text-[#000000] dark:text-white">Bench Press</div>
                        <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">4 sets x 5 reps • RPE 8.5</div>
                      </div>
                      <span className="font-black text-[#000000] dark:text-white text-sm">145 kg</span>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                      <div>
                        <div className="font-bold text-[#000000] dark:text-white">Conventional Deadlift</div>
                        <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">2 sets x 2 reps • RPE 9.0</div>
                      </div>
                      <span className="font-black text-[#7A9382] text-sm">255 kg</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#000000] dark:text-white">Overhead Press</div>
                        <div className="text-[10px] text-[#5A5F5D] dark:text-gray-400">3 sets x 4 reps • RPE 8.0</div>
                      </div>
                      <span className="font-black text-[#000000] dark:text-white text-sm">95 kg</span>
                    </div>
                  </div>
                </div>

                {/* Nutrition Summary */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-500" /> Nutrition Tracking Summary
                  </h3>
                  <div className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#5A5F5D] dark:text-gray-400">Daily Calorie Target</span>
                      <span className="font-bold text-[#000000] dark:text-white">2,650 kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
                      <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl">
                        <span className="text-[9px] text-[#DC2626] font-bold block">PROTEIN</span>
                        <span className="font-bold text-xs text-[#000000] dark:text-white">195g</span>
                      </div>
                      <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl">
                        <span className="text-[9px] text-[#000000] dark:text-slate-600 dark:text-gray-300 font-bold block">CARBS</span>
                        <span className="font-bold text-xs text-[#000000] dark:text-white">310g</span>
                      </div>
                      <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl">
                        <span className="text-[9px] text-[#7A9382] font-bold block">FAT</span>
                        <span className="font-bold text-xs text-[#000000] dark:text-white">70g</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px] pt-1">
                      <span className="text-[#5A5F5D] dark:text-gray-400">Meal Logging Consistency</span>
                      <span className="font-bold text-[#7A9382]">96% Adherence (30 Days)</span>
                    </div>
                  </div>
                </div>

                {/* Biometrics */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#7A9382]" /> Biometric Performance Matrix
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-black/40 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400 font-bold">RECOVERY SCORE</span>
                      <span className="text-lg font-black text-[#7A9382]">88%</span>
                      <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#7A9382] h-full w-[88%]" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-black/40 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400 font-bold">HRV AVG</span>
                      <span className="text-lg font-black text-[#000000] dark:text-white">76 ms</span>
                      <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#DC2626] h-full w-[76%]" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-black/40 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400 font-bold">DAY STRAIN</span>
                      <span className="text-lg font-black text-[#DC2626]">14.8 / 20</span>
                      <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#DC2626] h-full w-[74%]" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-black/40 p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400 font-bold">SLEEP EFFICIENCY</span>
                      <span className="text-lg font-black text-[#000000] dark:text-white">92%</span>
                      <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#7A9382] h-full w-[92%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STICKY ACTION BAR */}
            <div className="p-2 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md sticky bottom-0 z-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setDismissedUserIds((prev) => ({ ...prev, [selectedDetailedUser.user.id]: true }));
                    setSelectedDetailedUser(null);
                    showToast?.('Passed');
                  }}
                  className="w-11 h-11 rounded-full bg-[#F2F2F7] dark:bg-white/10 hover:bg-[#E5E5EA] dark:hover:bg-white/20 text-[#5A5F5D] dark:text-slate-600 dark:text-gray-300 border border-[rgba(0,0,0,0.08)] dark:border-white/10 transition-all cursor-pointer flex items-center justify-center active:scale-90"
                  title="Pass"
                  aria-label="Pass"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleLikeBuddy(selectedDetailedUser.user)}
                  className={`w-11 h-11 rounded-full font-mono transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                    likedUserIds[selectedDetailedUser.user.id]
                      ? 'bg-[#DC2626] text-white shadow-[0_0_12px_rgba(217,79,79,0.4)]'
                      : 'bg-[#F2F2F7] dark:bg-white/10 hover:bg-[#E5E5EA] dark:hover:bg-white/20 text-[#DC2626] border border-[rgba(0,0,0,0.08)] dark:border-white/10'
                  }`}
                  title={likedUserIds[selectedDetailedUser.user.id] ? 'Unlike' : 'Like'}
                  aria-label={likedUserIds[selectedDetailedUser.user.id] ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-5 h-5 ${likedUserIds[selectedDetailedUser.user.id] ? 'fill-current text-white' : 'text-[#DC2626]'}`} />
                </button>
                <button
                  onClick={() => {
                    const target = selectedDetailedUser.user;
                    setSelectedDetailedUser(null);
                    handleOpenChat(target);
                  }}
                  className="w-11 h-11 rounded-full bg-[#7A9382] hover:bg-[#5FBE6F] text-white transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-90"
                  title={`Chat with ${selectedDetailedUser.user.user_name.split(' ')[0]}`}
                  aria-label={`Chat with ${selectedDetailedUser.user.user_name.split(' ')[0]}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX HIGH-RES MEDIA VIEWER MODAL */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-[230] bg-black/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-3.5"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="bg-white dark:bg-[#15171E] border border-neutral-200 dark:border-white/10 rounded-3xl max-w-lg w-full text-zinc-900 dark:text-white shadow-2xl relative overflow-hidden flex flex-col space-y-3 p-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/10 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                  {lightboxMedia.category}
                </span>
                <span className="text-neutral-400 dark:text-gray-400">{lightboxMedia.date}</span>
              </div>
              <button
                onClick={() => setLightboxMedia(null)}
                className="p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-500 hover:text-neutral-900 dark:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image / Video Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-black h-72 sm:h-80 border border-neutral-200 dark:border-white/10 flex items-center justify-center group">
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />

              {lightboxMedia.type === 'video' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-2">
                  <button
                    onClick={() => setIsMediaPlaying(!isMediaPlaying)}
                    className="w-16 h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center font-bold text-xl shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    {isMediaPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <span className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/20">
                    {isMediaPlaying ? 'Playing Form Check Video...' : 'Tap to Play Clip'}
                  </span>
                </div>
              )}
            </div>

            {/* Media Information */}
            <div className="space-y-1.5 font-mono text-xs">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{lightboxMedia.title}</h3>
              <p className="text-neutral-600 dark:text-gray-300 font-sans leading-relaxed text-xs">
                {lightboxMedia.caption}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-white/10">
                <button
                  onClick={() => {
                    setLightboxMedia({
                      ...lightboxMedia,
                      likes: lightboxMedia.likes + 1,
                    });
                    showToast?.('Liked vault item!');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-800 dark:text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                  <span>{lightboxMedia.likes} Likes</span>
                </button>
                <span className="text-neutral-400 dark:text-gray-400 text-[11px]">High-Res Verified Asset</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UpSell Paywall Modal */}
      <UpSellPaywallModal
        isOpen={upSellState.isOpen}
        onClose={() => setUpSellState((prev) => ({ ...prev, isOpen: false }))}
        type={upSellState.type}
        showToast={showToast}
        onUnlockSuccess={() => {
          setUserTier('premium');
          setActionCount(0);
          showToast?.('Admin Access Granted: Premium Unlocked!');
        }}
        onViewPlans={(tier) => {
          setUpSellState((prev) => ({ ...prev, isOpen: false }));
          if (onOpenPayPlan) {
            onOpenPayPlan(tier);
          }
        }}
      />

      {/* Global Social Authorization Modal */}
      <SocialAuthModal
        isOpen={socialAuthModalOpen}
        platform={selectedSocialPlatform}
        onClose={() => setSocialAuthModalOpen(false)}
        onConfirmLink={handleConfirmSocialLink}
        onUnlinkPlatform={handleUnlinkSocialPlatform}
        onSwapPlatform={handleSwapSocialPlatform}
        isLinked={!!linkedPlatforms[selectedSocialPlatform]}
      />

      {/* Sports & Activity Search Modal */}
      {isSportsSearchOpen && (
        <div className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="p-4 sm:p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-100 dark:bg-[#14171F]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Sports & Activity Discovery
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Search or select from 40+ trending sports, activities & workouts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSportsSearchOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-600 dark:text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Search bar & Sports Grid */}
            <div className="p-4 sm:p-3.5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Activity Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={sportsSearchQuery}
                  onChange={(e) => setSportsSearchQuery(e.target.value)}
                  placeholder="Type sport or activity e.g. Pickleball, Muay Thai, Hot Yoga, BJJ, Hyrox, Golf..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-100 dark:bg-[#14171F] border border-white/15 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-gray-500 outline-none transition-all shadow-inner"
                  autoFocus
                />
                {sportsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSportsSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Popular Instant Search Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Most Searched on App & Web</span>
                  <span>Instant Selection</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ACTIVITIES.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedBuddyCategory(act.id);
                        setVenueCategoryFilter(act.id);
                        setUniversalSearchQuery(act.id);
                        loadBuddyProfiles(act.id, act.id);
                        loadVenues(act.id, act.id);
                        setIsSportsSearchOpen(false);
                        showToast?.(`Filtered by ${act.label}`);
                      }}
                      className={`px-2 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 border ${
                        selectedBuddyCategory === act.id
                          ? 'bg-[#DC2626] text-white border-[#DC2626]'
                          : 'bg-white/5 hover:bg-white/15 text-gray-200 border-white/10 hover:border-amber-400/50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: act.color }} />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorized Sports Directory */}
              <div className="pt-3 border-t border-white/10 space-y-4">
                {COMPREHENSIVE_SPORTS_DIRECTORY.map((catGroup) => {
                  const filteredSports = sportsSearchQuery.trim()
                    ? catGroup.sports.filter((s) =>
                        s.name.toLowerCase().includes(sportsSearchQuery.toLowerCase()) ||
                        catGroup.category.toLowerCase().includes(sportsSearchQuery.toLowerCase())
                      )
                    : catGroup.sports;

                  if (filteredSports.length === 0) return null;

                  return (
                    <div key={catGroup.category} className="space-y-2">
                      <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        {catGroup.category}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredSports.map((sport) => (
                          <button
                            key={sport.name}
                            type="button"
                            onClick={() => {
                              setSelectedBuddyCategory(sport.name);
                              setVenueCategoryFilter(sport.name);
                              setUniversalSearchQuery(sport.name);
                              loadBuddyProfiles(sport.name, sport.name);
                              loadVenues(sport.name, sport.name);
                              setIsSportsSearchOpen(false);
                              showToast?.(`Filtered by ${sport.name}!`);
                            }}
                            className={`p-2 rounded-xl border text-left font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${
                              selectedBuddyCategory === sport.name ||
                              universalSearchQuery.toLowerCase() === sport.name.toLowerCase()
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                                : 'bg-slate-100 dark:bg-[#14171F] text-gray-200 border-white/10 hover:border-amber-400/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sport.color }} />
                              <span className="truncate">{sport.name}</span>
                            </span>
                            <span className="text-[10px] text-gray-500 group-hover:text-amber-400 transition-colors">
                              View
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-[#14171F] border-t border-white/10 flex items-center justify-between font-mono text-xs text-gray-400">
              <span>Looking for a specific sport? Type above to filter.</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedBuddyCategory('');
                  setVenueCategoryFilter('');
                  setUniversalSearchQuery('');
                  loadBuddyProfiles('', '');
                  loadVenues('', '');
                  setIsSportsSearchOpen(false);
                  showToast?.('Reset activity filter!');
                }}
                className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
