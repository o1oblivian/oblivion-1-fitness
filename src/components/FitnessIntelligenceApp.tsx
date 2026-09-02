import React, { useState, useEffect } from 'react';
import { HistoryLogView } from './HistoryLogView';
import { DualAvatarHeader } from './DualAvatarHeader';
import { 
  Camera, 
  Activity, 
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  User,
  Check,
  ChevronRight,
  X,
  PlayCircle,
  Moon,
  Send,
  Fingerprint,
  Radio,
  Radar,
  Database,
  Eye,
  Dumbbell,
  Download,
  AlertCircle,
  Instagram,
  Music,
  Share2,
  Copy,
  ExternalLink,
  Edit3,
  Mic,
  Video,
  Plus,
  Play,
  Award,
  Sparkles,
  Snowflake,
  Flame,
  Pill,
  Watch,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { COACH_CLIENTS } from '../data/exerciseDatabase';
import { useCoachRosterStore } from '@/utils/coachRosterStore';
import { AthleteData } from '../types';
import { ClientRosterModal } from './ClientRosterModal';
import { WorkoutDispatchModal } from './WorkoutDispatchModal';
import { PayPlanHubModal } from './PayPlanHubModal';
import { CaloriesDetailModal } from './CaloriesDetailModal';
import { EditCoachProfileModal, CoachProfileData } from './EditCoachProfileModal';
import { MediaVaultModal, VaultMediaItem } from './MediaVaultModal';
import { SocialAuthModal } from './SocialAuthModal';
import {
  getSavedAthleteVaultItems,
  saveAthleteVaultItems,
  deleteAthleteVaultItem,
  getSavedCoachVaultItems,
  saveCoachVaultItems,
  deleteCoachVaultItem,
} from '../utils/vaultPersistenceStore';

import { ClientProgressShareModal } from './ClientProgressShareModal';
import { ShareResultModal } from './ShareResultModal';
import { ShareProgressModal } from './ShareProgressModal';
import { ReelsFeed } from './ReelsFeed';
import { CoachHubView } from './CoachView';
import { ClientConsentBanner } from './ClientConsentBanner';
import { getDispatchedWorkouts, getDispatchedWorkoutsForClient, DispatchedWorkout } from '../utils/dispatchStore';
import { ProgressPhotoVault } from './ProgressPhotoVault';
import { loadCoachFeed, saveCoachFeedEntry, type CoachFeedEntry } from '@/utils/coachFeedStore';
import { AthleteDossierCard } from './telemetry/AthleteDossierCard';
import { AthleteIntelligenceModal } from './telemetry/AthleteIntelligenceModal';
import { getAthleteTelemetryByCoachLog } from '../data/athleteTelemetry';
import { fetchLiveTelemetry, getStaticTelemetry } from '../utils/telemetryStore';
import { AthleteTelemetry } from '../types';

export interface SetDetail {
  weight: number | string;
  reps: number | string;
  rpe: number | string;
}

export interface ExerciseItem {
  name: string;
  sets: SetDetail[];
  hasVideo?: boolean;
  coachNote?: string;
}

export interface CoachLog {
  id: string;
  athleteName: string;
  handle: string;
  volume: string;
  timeAgo: string;
  approved: boolean;
  duration: string;
  readiness: number;
  exercises: ExerciseItem[];
  title?: string;
  date?: string;
}

export interface AthleteHistoryItem {
  id: string;
  date: string;
  title: string;
  volume: string;
  duration: string;
  exercises: {
    name: string;
    sets: SetDetail[];
  }[];
}

export interface AthleteProfile {
  name: string;
  handle: string;
  weight: number;
  streak: number;
  totalVolume: number;
  readinessScore: number;
  sleep: string;
  hrv: string;
  calories: number;
  calorieTarget: number;
  recovery: {
    chest: number;
    legs: number;
    back: number;
    core: number;
  };
}

const ENRICHED_LOGS: CoachLog[] = [];

const ATHLETE_PROFILE_DATA: AthleteProfile = {
  name: '',
  handle: 'ATHLETE',
  weight: 0,
  streak: 0,
  totalVolume: 0,
  readinessScore: 0,
  sleep: '--:--:--',
  hrv: '--',
  calories: 0,
  calorieTarget: 2500,
  recovery: {
    chest: 0,
    legs: 0,
    back: 0,
    core: 0
  }
};

const ATHLETE_HISTORY: AthleteHistoryItem[] = [];

interface WorkoutRegistration {
  historyEntry: AthleteHistoryItem;
  coachLog: CoachLog;
}

interface FitnessIntelligenceAppProps {
  initialTab?: 'Coach' | 'Client' | 'Reels';
  onTabChange?: (tab: 'Coach' | 'Client' | 'Reels') => void;
  showTopNavTabs?: boolean;
  onSelectClient?: (client: AthleteData) => void;
  currentUserEmail?: string;
  setActiveLogs?: React.Dispatch<React.SetStateAction<import('../types').ExerciseLog[]>>;
  onSwitchToWorkout?: () => void;
  registerWorkoutRef?: React.MutableRefObject<((reg: WorkoutRegistration) => void) | null>;
  sessionVaultRefresh?: number;
  profileImage?: string;
  userName?: string;
  handle?: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  onTapSelf?: () => void;
  onTapPartner?: () => void;
}

export type { WorkoutRegistration };

export default function FitnessIntelligenceApp({
  initialTab = 'Coach',
  onTabChange,
  showTopNavTabs = true,
  onSelectClient,
  currentUserEmail = '',
  setActiveLogs: setActiveLogsExternal,
  onSwitchToWorkout,
  registerWorkoutRef,
  sessionVaultRefresh = 0,
  profileImage,
  userName,
  handle,
  showToast: showToastProp,
  onTapSelf,
  onTapPartner,
}: FitnessIntelligenceAppProps) {
  const [activeTab, setActiveTab] = useState<'Coach' | 'Client' | 'Reels'>(initialTab);
  const [logs, setLogs] = useState<CoachLog[]>(ENRICHED_LOGS);
  const [athleteHistory, setAthleteHistory] = useState<AthleteHistoryItem[]>(ATHLETE_HISTORY);
  const [stats, setStats] = useState<AthleteProfile>({
    ...ATHLETE_PROFILE_DATA,
    name: currentUserEmail ? currentUserEmail.split('@')[0] : '',
  });
  const [feedLoaded, setFeedLoaded] = useState(false);

  useEffect(() => {
    if (!currentUserEmail) return;
    loadCoachFeed(currentUserEmail).then(entries => {
      if (entries.length > 0) {
        const loaded: CoachLog[] = entries.map(e => ({
          id: e.id,
          athleteName: e.athlete_name,
          handle: e.athlete_handle,
          volume: e.volume,
          timeAgo: e.time_ago,
          approved: e.approved,
          duration: e.duration,
          readiness: e.readiness,
          title: e.title,
          date: e.date_label,
          exercises: e.exercises,
        }));
        setLogs(loaded);
      }
      setFeedLoaded(true);
    }).catch(() => setFeedLoaded(true));
  }, [currentUserEmail]);

  useEffect(() => {
    if (registerWorkoutRef) {
      registerWorkoutRef.current = (reg: WorkoutRegistration) => {
        setAthleteHistory((prev) => [reg.historyEntry, ...prev]);
        setLogs((prev) => [reg.coachLog, ...prev]);
        setStats((prev) => ({
          ...prev,
          streak: prev.streak + 1,
          totalVolume: prev.totalVolume + parseFloat(reg.historyEntry.volume) || 0,
        }));
        if (currentUserEmail) {
          saveCoachFeedEntry({
            user_email: currentUserEmail,
            athlete_name: reg.coachLog.athleteName,
            athlete_handle: reg.coachLog.handle,
            volume: reg.coachLog.volume,
            title: reg.coachLog.title || '',
            date_label: reg.coachLog.date || 'TODAY',
            time_ago: reg.coachLog.timeAgo,
            approved: reg.coachLog.approved,
            duration: reg.coachLog.duration,
            readiness: reg.coachLog.readiness,
            exercises: reg.coachLog.exercises.map(e => ({
              name: e.name,
              sets: e.sets,
              hasVideo: e.hasVideo || false,
              coachNote: e.coachNote || '',
            })),
          }).catch(() => {});
        }
      };
    }
    return () => { if (registerWorkoutRef) registerWorkoutRef.current = null; };
  }, [registerWorkoutRef, currentUserEmail]);

  // Native System Time & Calendar Live Sync
  const [currentDateString, setCurrentDateString] = useState<string>('');
  const [currentTimeString, setCurrentTimeString] = useState<string>('');
  const [isHealthSyncing, setIsHealthSyncing] = useState<boolean>(false);

  useEffect(() => {
    const updateSystemClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateString(dateStr);
      setCurrentTimeString(timeStr);
    };
    updateSystemClock();
    const interval = setInterval(updateSystemClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncDeviceHealth = () => {
    setIsHealthSyncing(true);
    showToast('Connecting to Apple HealthKit / Google Health Connect...');
    setTimeout(() => {
      setIsHealthSyncing(false);
      const randomHrv = Math.floor(64 + Math.random() * 12);
      const randomReadiness = (89 + Math.random() * 6).toFixed(1);
      setStats((prev) => ({
        ...prev,
        sleep: '07h 48m (REM: 1h 52m • Deep: 2h 15m)',
        hrv: `${randomHrv}ms`,
        readinessScore: parseFloat(randomReadiness),
      }));
      showToast('HealthKit / Google Health Connect Sleep Telemetry Synced!', 'success');
    }, 1200);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: 'Coach' | 'Client' | 'Reels') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Modals & Interactive State
  const [selectedLog, setSelectedLog] = useState<CoachLog | null>(null);
  const [showBioModal, setShowBioModal] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Feature Overlay Modals
  const [isCaloriesModalOpen, setIsCaloriesModalOpen] = useState<boolean>(false);
  const [isEditCoachModalOpen, setIsEditCoachModalOpen] = useState<boolean>(false);
  const [isClientVaultOpen, setIsClientVaultOpen] = useState<boolean>(false);
  const [isCoachVaultOpen, setIsCoachVaultOpen] = useState<boolean>(false);

  const [shareClientAthlete, setShareClientAthlete] = useState<AthleteData | null>(null);
  const [shareResultLog, setShareResultLog] = useState<CoachLog | null>(null);
  const [isShareProgressOpen, setIsShareProgressOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [intelligenceTelemetry, setIntelligenceTelemetry] = useState<AthleteTelemetry | null>(null);
  const [intelligenceLogId, setIntelligenceLogId] = useState<string | null>(null);

  // Editable Coach Profile Data
  const [coachProfileData, setCoachProfileData] = useState<CoachProfileData>({
    name: '',
    title: '',
    bio: '',
    specialties: ['Hypertrophy', 'Powerlifting', 'Contest Prep', 'Biomechanics'],
    pricingTiers: [
      { title: '1:1 Elite Coaching', price: '$149/mo', desc: 'Custom programming, weekly video check-ins, macro adjustments' },
      { title: 'Protocol Only', price: '$49/mo', desc: 'Dispatched workout programming & performance tracking' }
    ],
    credentials: ['CSCS (NSCA)', 'USAW Level 2', 'Precision Nutrition L1'],
    socials: {
      instagram: '@path.patel_coach',
      tiktok: '@path.patel.fit',
      thirdPlatform: { platform: 'Strava', handle: '@path_patel_runner' }
    }
  });

  // Client Triple Social Media Slots
  const [clientSocials, setClientSocials] = useState({
    instagram: '@path.patel.fit',
    tiktok: '@path.lifts.official',
    thirdPlatform: { platform: 'Strava', handle: '@path_runner_22' }
  });

  // Global Social Media Authorization Modal State
  const [socialAuthModalOpen, setSocialAuthModalOpen] = useState<boolean>(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string>('Instagram');
  const [linkedPlatforms, setLinkedPlatforms] = useState<Record<string, boolean>>({
    Instagram: true,
    TikTok: true,
    Strava: true,
    YouTube: true,
  });

  const handleOpenSocialAuth = (platform: string) => {
    setSelectedSocialPlatform(platform);
    setSocialAuthModalOpen(true);
  };

  const handleConfirmSocialLink = (platform: string, handle?: string) => {
    setLinkedPlatforms((prev) => ({ ...prev, [platform]: true }));
    if (handle) {
      setClientSocials((prev) => {
        if (platform === 'Instagram') return { ...prev, instagram: handle };
        if (platform === 'TikTok') return { ...prev, tiktok: handle };
        return { ...prev, thirdPlatform: { ...prev.thirdPlatform, handle } };
      });
      setCoachProfileData((prev) => {
        if (platform === 'Instagram') return { ...prev, socials: { ...prev.socials, instagram: handle } };
        if (platform === 'TikTok') return { ...prev, socials: { ...prev.socials, tiktok: handle } };
        return { ...prev, socials: { ...prev.socials, thirdPlatform: { ...prev.socials.thirdPlatform, handle } } };
      });
    }
    showToast(`${platform} account successfully linked & verified!`, 'success');
  };

  const handleUnlinkSocialPlatform = (platform: string) => {
    setLinkedPlatforms((prev) => ({ ...prev, [platform]: false }));
    showToast(`${platform} connection unlinked.`);
  };

  const handleSwapSocialPlatform = (oldPlatform: string, newPlatform: string) => {
    setSelectedSocialPlatform(newPlatform);
    setLinkedPlatforms((prev) => ({ ...prev, [newPlatform]: true }));
    setClientSocials((prev) => ({
      ...prev,
      thirdPlatform: { ...prev.thirdPlatform, platform: newPlatform }
    }));
    setCoachProfileData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        thirdPlatform: { ...prev.socials.thirdPlatform, platform: newPlatform }
      }
    }));
    showToast(`Swapped platform from ${oldPlatform} to ${newPlatform}`);
  };

  // Media Vault Items for Client & Coach (Hydrated from persistent store)
  const [clientVaultItems, setClientVaultItems] = useState<VaultMediaItem[]>(() => getSavedAthleteVaultItems());

  const [coachVaultItems, setCoachVaultItems] = useState<VaultMediaItem[]>(() => getSavedCoachVaultItems());

  useEffect(() => {
    const handleAthleteVaultSync = () => {
      setClientVaultItems(getSavedAthleteVaultItems());
    };
    const handleCoachVaultSync = () => {
      setCoachVaultItems(getSavedCoachVaultItems());
    };
    window.addEventListener('o1fc_athlete_vault_updated', handleAthleteVaultSync);
    window.addEventListener('o1fc_coach_vault_updated', handleCoachVaultSync);
    return () => {
      window.removeEventListener('o1fc_athlete_vault_updated', handleAthleteVaultSync);
      window.removeEventListener('o1fc_coach_vault_updated', handleCoachVaultSync);
    };
  }, []);

  // Coach Roster & Workout Dispatch States

  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isPayPlanOpen, setIsPayPlanOpen] = useState<boolean>(false);
  const [dispatchTargetKeys, setDispatchTargetKeys] = useState<string[]>([]);
  const [dispatchedList, setDispatchedList] = useState<DispatchedWorkout[]>([]);

  // Load dispatched workouts on mount & listen to window events
  useEffect(() => {
    async function loadDispatched() {
      const data = await getDispatchedWorkouts();
      setDispatchedList(data);
    }
    loadDispatched();

    const handleUpdate = () => {
      loadDispatched();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dispatched_workouts_updated', handleUpdate);
      return () => {
        window.removeEventListener('dispatched_workouts_updated', handleUpdate);
      };
    }
  }, []);

  const showToast = (msg: string, _type?: 'success' | 'error') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDownloadCode = () => {
    const dataContent = JSON.stringify({
      athleteName: stats.name,
      handle: stats.handle,
      exportDate: new Date().toISOString(),
      logs: logs,
      athleteHistory: athleteHistory,
      coachProfile: coachProfileData,
    }, null, 2);
    const blob = new Blob([dataContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `o1fc_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Your workout data exported successfully!');
  };

  const handleApprove = (logId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAuthorizingId(logId);
    
    setTimeout(() => {
      setLogs((prev) => prev.map((log) => log.id === logId ? { ...log, approved: true } : log));
      setSelectedLog((prev) => (prev && prev.id === logId ? { ...prev, approved: true } : prev));
      setAuthorizingId(null);
      showToast('Workout successfully verified & approved');
    }, 1200);
  };

  const submitFeedback = () => {
    if (!feedbackText.trim() || !selectedLog) return;
    const updatedLog: CoachLog = {
      ...selectedLog, 
      exercises: selectedLog.exercises.map((ex, i) => 
        i === 0 ? { ...ex, coachNote: feedbackText } : ex
      )
    };
    setSelectedLog(updatedLog);
    setLogs((prev) => prev.map((l) => l.id === updatedLog.id ? updatedLog : l));
    setFeedbackText('');
    showToast('Trainer feedback transmitted to athlete');
  };

  const PULL_B_EXERCISES = [
    { name: 'Lat Pulldown', numSets: 4 },
    { name: 'Barbell Deadlift', numSets: 4 },
    { name: 'Seated Cable Row', numSets: 3 },
    { name: 'Incline Dumbbell Curls', numSets: 3 },
    { name: 'Face Pulls', numSets: 3 },
    { name: 'Hammer Curls', numSets: 3 },
  ];

  const simulateWorkoutComplete = () => {
    if (!setActiveLogsExternal) return;
    setIsUpdating(true);

    const newLogs: import('../types').ExerciseLog[] = PULL_B_EXERCISES.map((ex) => ({
      id: `log-${Date.now()}-${Math.random()}`,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.numSets }, () => ({
        id: `s-${Date.now()}-${Math.random()}`,
        reps: '',
        weight: 0,
        rpe: 0,
      })),
    }));

    setActiveLogsExternal((prev) => [...newLogs, ...prev]);

    showToast('PULL B Routine loaded into Active Log! Let\'s work!', 'success');

    setTimeout(() => {
      setIsUpdating(false);
      if (onSwitchToWorkout) onSwitchToWorkout();
      setTimeout(() => {
        document.getElementById('solo-workout-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }, 400);
  };

  const renderClientUI = () => {
    const prData = [92.5, 95, 97.5, 97.5, 100, 100, 102.5, 105];
    const prMax = Math.max(...prData);
    const prMin = Math.min(...prData);
    const prRange = prMax - prMin || 1;
    const svgW = 280, svgH = 50, pad = 6;
    const points = prData.map((v, i) => ({
      x: pad + (i / (prData.length - 1)) * (svgW - pad * 2),
      y: pad + (1 - (v - prMin) / prRange) * (svgH - pad * 2),
    }));
    const pathD = points.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpx1 = prev.x + (p.x - prev.x) * 0.4;
      const cpx2 = prev.x + (p.x - prev.x) * 0.6;
      return `C${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
    }).join(' ');
    const areaD = `${pathD} L${points[points.length - 1].x},${svgH} L${points[0].x},${svgH} Z`;

    return (
    <div className="px-1 sm:px-2.5 pb-2 max-w-md mx-auto w-full animate-fade-in space-y-2 relative z-10">

      {/* ── Unified Tactical Hero Card (Profile, Today's Session, 1RM Telemetry, Vault) ── */}
      <div className="bg-white dark:bg-[#13161A] border border-zinc-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-md dark:shadow-2xl space-y-3 text-zinc-900 dark:text-white">
        
        {/* Profile Logo & Tandem Header inside glass panel */}
        <DualAvatarHeader
          profileImage={profileImage}
          userName={userName || currentUserEmail?.split('@')[0] || 'Athlete'}
          handle={handle || '@pathik23'}
          currentUserEmail={currentUserEmail}
          onTapSelf={() => onTapSelf?.()}
          onTapPartner={() => onTapPartner?.()}
          showToast={showToastProp || (() => {})}
        />

        <div className="h-px bg-zinc-200 dark:bg-white/10 -mx-3.5 sm:-mx-4" />

        {/* Top Meta: • TODAY'S SESSION | Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">Today's Session</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500 font-medium">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Title, Subtitle, Info tags and RPE Meter */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">PULL B</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">Back & Biceps Hypertrophy</p>
            <div className="flex items-center gap-2.5 mt-1.5 text-[9.5px] font-mono text-zinc-500 dark:text-zinc-500 font-semibold tracking-wider uppercase">
              <span>45 MIN</span>
              <span>•</span>
              <span>6 EXERCISES</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="flex flex-col items-end">
              <span className="text-[8.5px] font-mono text-zinc-500 dark:text-zinc-500 font-bold tracking-wider">RPE</span>
              <span className="text-lg font-black text-[#EA4335] leading-none">8.5</span>
            </div>
            <div className="w-1.5 h-6 rounded-full bg-[#EA4335] mt-0.5" />
          </div>
        </div>

        {/* CTA Button: Solid Natural Matte Terracotta */}
        <button
          onClick={simulateWorkoutComplete}
          disabled={isUpdating}
          className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer text-white shadow-sm disabled:opacity-60 bg-[#EA4335] hover:bg-[#963426]"
        >
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>{isUpdating ? 'Session Synced' : 'Start Assigned Session'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </button>

        {/* 1RM Telemetry Header */}
        <div className="pt-1 flex items-end justify-between">
          <div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              105.0<span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 font-bold ml-1">KG</span>
            </div>
            <p className="text-[8.5px] font-mono text-zinc-500 dark:text-zinc-500 tracking-widest uppercase mt-0.5">Bench Press · 1RM Estimate</p>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-[#34A853] dark:text-[#34A853] flex items-center justify-end gap-0.5">
              <span>↗ 12.5 KG</span>
            </div>
            <p className="text-[8px] font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">This Month</p>
          </div>
        </div>

        {/* Smooth Natural Matte Sage Curve */}
        <div className="relative w-full" style={{ height: 38 }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="prFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34A853" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#34A853" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#prFill)" className="animate-fade-in" />
            <path d={pathD} fill="none" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round" className="animate-draw-line" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#34A853" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="6" fill="none" stroke="#34A853" strokeWidth="1.5" opacity="0.5" />
          </svg>
        </div>

        {/* Milestone Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['105kg Bench Milestone', '7-Day Perfect Streak', `${stats.totalVolume > 0 ? stats.totalVolume.toFixed(1) : '0.0'} MT Volume`].map((badge) => (
            <span key={badge} className="text-[8.5px] font-medium text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.03] px-2 py-0.5 rounded-md border border-zinc-200/80 dark:border-white/5 whitespace-nowrap shrink-0 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#C48B4F]" /> {badge}
            </span>
          ))}
        </div>

        {/* Bottom Actions Row: SHARE & VAULT */}
        <div className="pt-0.5 flex items-center gap-2">
          <button
            onClick={() => setIsShareProgressOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-white/10 transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
            <span>Share</span>
          </button>
          <button
            onClick={() => setIsVaultOpen(!isVaultOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              isVaultOpen
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-zinc-200/80 dark:border-white/10'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>Vault</span>
          </button>
        </div>

        {/* Expandable Photo Vault */}
        {isVaultOpen && (
          <div className="pt-2 animate-fade-in border-t border-zinc-200/80 dark:border-white/10 mt-3">
            <ProgressPhotoVault onOpenPayPlan={() => setIsPayPlanOpen(true)} showToast={showToastProp} />
          </div>
        )}

      </div>

      {/* ── History Log (Collapsible Accordion) ── */}
      <HistoryLogView
        currentUserEmail={currentUserEmail}
        showToast={showToast}
        onOpenPayPlan={() => setIsPayPlanOpen(true)}
        refreshTrigger={sessionVaultRefresh}
      />
    </div>
    );
  };

  const renderLogDetailsModal = () => {
    if (!selectedLog) return null;

    return (
      <div className="fixed inset-0 z-[160] flex justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in p-3 items-start pt-10 sm:pt-14 pb-28 overflow-y-auto" onClick={() => setSelectedLog(null)}>
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] w-full max-w-sm rounded-[2rem] flex flex-col shadow-2xl overflow-hidden animate-slideDownFade max-h-[80dvh]" onClick={(e) => e.stopPropagation()}>
          
          <div className="p-3.5 flex justify-between items-center border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-black/20">
            <div>
              <div className="text-[9px] text-slate-500 dark:text-gray-400 font-mono uppercase tracking-[0.15em] mb-1 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> WORKOUT DOSSIER
              </div>
              <h2 className="text-base font-medium text-slate-900 dark:text-white tracking-tight">{selectedLog.title || 'WORKOUT LOG'}</h2>
              <p className="text-[10px] text-slate-500 dark:text-gray-500 font-mono tracking-widest mt-1">{selectedLog.handle}</p>
            </div>
            <button onClick={() => setSelectedLog(null)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 hide-scrollbar">
            {selectedLog.exercises.map((ex, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-white/[0.02] rounded-[1.2rem] p-4 border border-slate-200 dark:border-white/[0.05]">
                <div className="flex justify-between items-center mb-2.5">
                  <h3 className="font-sans font-medium text-slate-900 dark:text-white text-sm tracking-tight opacity-90">
                    {ex.name}
                  </h3>
                  {ex.hasVideo && (
                    <button
                      onClick={() => setIsClientVaultOpen(true)}
                      className="w-7 h-7 rounded-full bg-[#EA4335] hover:bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Play Form Check Video"
                    >
                      ▶
                    </button>
                  )}
                </div>
                
                <div className="space-y-1.5 font-mono">
                  {ex.sets.map((set, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/[0.02]">
                      <span className="text-slate-500 dark:text-gray-500 w-12">SET {sIdx + 1}</span>
                      <span className="text-slate-700 dark:text-gray-300">{set.weight}{typeof set.weight === 'number' ? '.0 KG' : ''} × {set.reps}</span>
                      <span className="text-slate-600 dark:text-gray-400">RPE {typeof set.rpe === 'number' ? set.rpe.toFixed(1) : set.rpe}</span>
                    </div>
                  ))}
                </div>

                {ex.coachNote && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl flex items-start">
                    <Radio className="w-3.5 h-3.5 text-[#0A84FF] mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#0A84FF] font-mono tracking-[0.1em] block mb-1">TRAINER FEEDBACK</span>
                      <p className="text-[11px] text-slate-600 dark:text-gray-300 font-sans font-light leading-relaxed">{ex.coachNote}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'Coach' && (
              <div className="mt-2.5 bg-white/[0.02] p-3 rounded-[1.2rem] border border-white/[0.05]">
                <div className="flex items-center text-[9px] text-gray-500 font-mono tracking-[0.1em] mb-2">
                  <Send className="w-3 h-3 mr-1.5" /> ADD TRAINER NOTE
                </div>
                <div className="flex bg-black/30 rounded-xl border border-white/[0.08] p-1 focus-within:border-[#0A84FF]/50 transition-colors">
                  <input 
                    type="text" 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Type feedback for athlete..." 
                    className="flex-1 bg-transparent border-none text-xs text-white px-3 focus:outline-none placeholder-gray-600 font-sans font-light"
                  />
                  <button onClick={submitFeedback} className="bg-[#0A84FF]/10 text-[#0A84FF] p-2 rounded-lg hover:bg-[#0A84FF]/20 transition-colors active:scale-95">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'Coach' && !selectedLog.approved && (
            <div className="p-4 bg-black/40 border-t border-white/[0.05] backdrop-blur-xl">
               <button 
                  onClick={(e) => handleApprove(selectedLog.id, e)}
                  className="w-full bg-[#0A84FF] hover:bg-[#007AFF] text-white font-mono font-medium tracking-[0.15em] text-[11px] py-4 rounded-[1.2rem] transition-all flex items-center justify-center active:scale-95 shadow-lg shadow-[#0A84FF]/20"
                >
                  {authorizingId === selectedLog.id ? (
                      <><Fingerprint className="w-4 h-4 mr-2" /> VERIFYING...</>
                    ) : (
                      <><Shield className="w-4 h-4 mr-2" /> APPROVE WORKOUT</>
                  )}
                </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBioMetricsModal = () => {
    if (!showBioModal) return null;

    return (
      <div className="fixed inset-0 z-[160] flex justify-center bg-[#F8F9FA] dark:bg-[#0A0A0C] animate-fade-in p-4 items-start pt-10 sm:pt-14 pb-28 overflow-y-auto" onClick={() => setShowBioModal(false)}>
        <div className="relative w-full max-w-md rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-slideDownFade max-h-[80dvh] border border-[rgba(0,0,0,0.08)] dark:border-white/15 bg-white dark:bg-[#14171F] text-[#1A1E1D] dark:text-white" onClick={(e) => e.stopPropagation()}>
          {/* Atmospheric Wallpaper */}
          <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0B0E14]/70 to-[#0B0E14]/95 backdrop-blur-[2px] pointer-events-none" />
          
          <div className="relative z-10 p-3.5 flex justify-between items-start border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">RECOVERY & WELLBEING HUB</h2>
                <span className="text-[9px] font-mono font-bold bg-[#34A853]/20 text-[#34A853] px-1.5 py-0.5 rounded-md border border-[#34A853]/30">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-[10px] text-white/50 font-mono tracking-wider mt-1">
                {currentDateString || 'TODAY'} • {currentTimeString}
              </p>
            </div>
            <button onClick={() => setShowBioModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 active:scale-95 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-3.5 space-y-3 hide-scrollbar">
            {/* Native Health Framework Sync Banner */}
            <button
              onClick={handleSyncDeviceHealth}
              disabled={isHealthSyncing}
              className="w-full bg-slate-100 dark:bg-[#14171F] border border-slate-200 dark:border-white/10 hover:border-red-500/50 p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                  <Watch className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Apple HealthKit / Health Connect</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono">
                    {isHealthSyncing ? 'Syncing biometric sensors...' : 'Tap to sync sleep & HRV telemetry'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-stone-300 font-bold shrink-0 flex items-center gap-1.5">
                {isHealthSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync</span>
                  </>
                )}
              </span>
            </button>
            
            {/* Daily Readiness Ring */}
            <div className="bg-slate-100 dark:bg-[#14171F] rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
              <div className="text-[10px] text-zinc-600 dark:text-white/60 font-mono font-bold tracking-wider mb-2 z-10 uppercase">
                Daily Readiness Score
              </div>
              
              <div className="relative w-36 h-36 flex items-center justify-center z-10 my-1">
                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                    <circle cx="72" cy="72" r="60" fill="none" stroke="#34A853" strokeWidth="12" strokeLinecap="round" strokeDasharray="377" strokeDashoffset={377 - (377 * stats.readinessScore) / 100} className="transition-all duration-1000 ease-out" style={{ filter: 'drop-shadow(0 0 6px rgba(90,139,115,0.4))' }} />
                 </svg>
                 <div className="text-center flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{stats.readinessScore}</span>
                    <span className="text-[9px] text-[#34A853] font-mono font-bold tracking-widest uppercase mt-0.5">OPTIMAL</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 dark:bg-[#14171F] rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
                <Moon className="w-4 h-4 text-[#EA4335] mb-2" />
                <div className="text-[9px] text-white/50 font-mono font-bold tracking-wider mb-0.5 uppercase">SLEEP DURATION</div>
                <div className="text-sm font-bold text-white font-sans">{stats.sleep}</div>
              </div>
              <div className="bg-slate-100 dark:bg-[#14171F] rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
                <Activity className="w-4 h-4 text-[#34A853] mb-2" />
                <div className="text-[9px] text-white/50 font-mono font-bold tracking-wider mb-0.5 uppercase">HRV SCORE</div>
                <div className="text-sm font-bold text-white font-sans">{stats.hrv}</div>
              </div>
            </div>

            {/* Advanced Recovery & Biohacking Section */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                  ADVANCED RECOVERY & BIOHACKING
                </span>
                <span className="text-[9px] font-mono font-bold bg-[#EA4335]/15 text-[#EA4335] px-1.5 py-0.5 rounded-full border border-[#EA4335]/30">
                  GLOBAL TREND
                </span>
              </div>

              {[
                { icon: Snowflake, title: 'Cold Plunge Protocol', desc: '3 mins @ 4°C \u2022 Vagus Nerve Reset', status: 'COMPLETED', hex: '#78716c' },
                { icon: Flame, title: 'Infrared Sauna & Heat Therapy', desc: '25 mins @ 70°C \u2022 GH & Cellular Repair', status: 'SCHEDULED', hex: '#EA4335' },
                { icon: Pill, title: 'Supplementation Protocol', desc: 'Mg L-Threonate + Omega-3 + Creatine 5g', status: 'TAKEN', hex: '#34A853' },
              ].map((row) => {
                const IconComponent = row.icon;
                return (
                  <div key={row.title} className="bg-slate-100 dark:bg-[#14171F] border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${row.hex}15`, borderColor: `${row.hex}30`, border: `1px solid ${row.hex}40`, color: row.hex }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{row.title}</div>
                        <div className="text-[10px] text-white/50 font-mono leading-tight">{row.desc}</div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color: row.hex, backgroundColor: `${row.hex}18`, border: `1px solid ${row.hex}30` }}
                    >
                      {row.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTopNav = () => (
    <div className="flex flex-col items-center pt-1.5 pb-2 px-3 sticky top-0 z-40 border-b border-zinc-200/80/80 dark:border-white/[0.05] mb-2 bg-white/90 dark:bg-[#0A0C10]/90 backdrop-blur-md transition-colors">
      <div className="flex w-full max-w-xs bg-zinc-100 dark:bg-white/[0.05] rounded-xl p-1 border border-zinc-200/80 dark:border-white/10 relative">
        {(['Coach', 'Reels'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabSwitch(tab)}
            className={`flex-1 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-200 z-10 cursor-pointer ${
              activeTab === tab 
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white font-bold shadow-xs border border-zinc-200/80 dark:border-white/10' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-transparent text-slate-900 dark:text-[#F5F5F7] font-sans overflow-x-hidden relative selection:bg-[#0A84FF]/30 transition-colors">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideDownFade { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDownFade { animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes drawLine { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
        @keyframes scan { 
          0% { transform: translateY(-100%); } 
          50% { transform: translateY(100%); } 
          100% { transform: translateY(100%); } 
        }
        
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-draw-line { animation: drawLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {showTopNavTabs && renderTopNav()}
      
      <main className="relative z-10 pt-0.5 pb-2">
        {activeTab === 'Coach' && (
          <div className="tab-view-enter">
            <CoachHubView
              onOpen1MinBuilder={() => { setDispatchTargetKeys(Object.keys(COACH_CLIENTS)); setIsDispatchModalOpen(true); }}
              onOpenVault={() => setIsCoachVaultOpen(true)}
              onViewRoster={() => setIsRosterModalOpen(true)}
              onOpenPayPlan={() => setIsPayPlanOpen(true)}
              coachEmail={currentUserEmail}
              showToast={showToast}
            />
          </div>
        )}
        {activeTab === 'Reels' && <div className="tab-view-enter"><ReelsFeed currentUserEmail={currentUserEmail} showToast={showToast} /></div>}
        {activeTab === 'Client' && <div className="tab-view-enter">{renderClientUI()}</div>}
      </main>

      {renderLogDetailsModal()}
      {renderBioMetricsModal()}

      {/* Top-Anchored Client Roster Modal */}
      <ClientRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        clients={useCoachRosterStore.getState().isDemoMode || useCoachRosterStore.getState().clients.length === 0 ? COACH_CLIENTS : Object.fromEntries(useCoachRosterStore.getState().clients.map(c => [c.id, { key: c.id, name: c.name, handle: c.handle, avatar: c.avatar, status: c.status, badge: c.badge || 'ACTIVE', volume: `${c.weeklyVolumeKg.toLocaleString()} KG`, lastSeen: c.lastActive, todayLog: [], history: [] }]))}
        onOpenDispatchForClients={(keys) => {
          setDispatchTargetKeys(keys);
          setIsDispatchModalOpen(true);
        }}
        onOpenShareClientProgress={(client) => {
          setShareClientAthlete(client);
        }}
        onSelectClientDetail={(client) => {
          if (onSelectClient) {
            onSelectClient(client);
          }
        }}
      />

      {/* Top-Anchored Workout Dispatch Modal */}
      <WorkoutDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        clients={useCoachRosterStore.getState().isDemoMode || useCoachRosterStore.getState().clients.length === 0 ? COACH_CLIENTS : Object.fromEntries(useCoachRosterStore.getState().clients.map(c => [c.id, { key: c.id, name: c.name, handle: c.handle, avatar: c.avatar, status: c.status, badge: c.badge || 'ACTIVE', volume: `${c.weeklyVolumeKg.toLocaleString()} KG`, lastSeen: c.lastActive, todayLog: [], history: [] }]))}
        initialSelectedClientKeys={dispatchTargetKeys}
        coachName={coachProfileData.name}
        onDispatchSuccess={(count) => {
          showToast(`Workout dispatched to ${count} athlete${count !== 1 ? 's' : ''} & synced to database!`, 'success');
          getDispatchedWorkouts().then((data) => setDispatchedList(data));
        }}
      />

      {/* Subscription Comparison & Checkout Matrix */}
      <PayPlanHubModal
        isOpen={isPayPlanOpen}
        onClose={() => setIsPayPlanOpen(false)}
        showToast={showToast}
      />

      {/* Interactive Calories & Macros Detail Breakdown Modal */}
      <CaloriesDetailModal
        isOpen={isCaloriesModalOpen}
        onClose={() => setIsCaloriesModalOpen(false)}
        stats={stats}
      />

      {/* Editable Coach Profile & Socials Modal */}
      <EditCoachProfileModal
        isOpen={isEditCoachModalOpen}
        onClose={() => setIsEditCoachModalOpen(false)}
        coachData={coachProfileData}
        onSave={(updatedData) => {
          setCoachProfileData(updatedData);
        }}
        showToast={showToast}
      />

      {/* Client Media & Progress Vault Modal */}
      <MediaVaultModal
        isOpen={isClientVaultOpen}
        onClose={() => setIsClientVaultOpen(false)}
        vaultTitle="Athlete Media & Progress Vault"
        ownerName={stats.name}
        items={clientVaultItems}
        onAddItem={(item) => {
          const itemWithDefaults = item as VaultMediaItem;
          const newItem: VaultMediaItem = {
            ...item,
            id: itemWithDefaults.id || `v-${Date.now()}`,
            likes: itemWithDefaults.likes ?? 0,
          };
          const updated = [newItem, ...clientVaultItems.filter(i => i.id !== newItem.id)];
          setClientVaultItems(updated);
          saveAthleteVaultItems(updated);
          showToast('Media saved & persisted to Athlete Vault!', 'success');
        }}
        onDeleteItem={(item) => {
          const updated = clientVaultItems.filter((i) => i.id !== item.id);
          setClientVaultItems(updated);
          deleteAthleteVaultItem(item.id);
          showToast('Media deleted from Athlete Vault', 'success');
        }}
        onToggleBuddy={(item) => {
          const updated = clientVaultItems.map((i) => (i.id === item.id ? { ...i, show_on_buddy: item.show_on_buddy } : i));
          setClientVaultItems(updated);
          saveAthleteVaultItems(updated);
          showToast(item.show_on_buddy ? 'Visible on Buddy Card' : 'Hidden from Buddy Card', 'success');
        }}
        showToast={showToast}
      />

      {/* Coach Exercise Vault Modal */}
      <MediaVaultModal
        isOpen={isCoachVaultOpen}
        onClose={() => setIsCoachVaultOpen(false)}
        vaultTitle="Coach Exercise Vault"
        ownerName={coachProfileData.name}
        items={coachVaultItems}
        onAddItem={(item) => {
          const itemWithDefaults = item as VaultMediaItem;
          const newItem: VaultMediaItem = {
            ...item,
            id: itemWithDefaults.id || `v-${Date.now()}`,
            likes: itemWithDefaults.likes ?? 0,
          };
          const updated = [newItem, ...coachVaultItems.filter(i => i.id !== newItem.id)];
          setCoachVaultItems(updated);
          saveCoachVaultItems(updated);
          showToast('Media saved & persisted to Coach Vault!', 'success');
        }}
        onDeleteItem={(item) => {
          const updated = coachVaultItems.filter((i) => i.id !== item.id);
          setCoachVaultItems(updated);
          deleteCoachVaultItem(item.id);
          showToast('Media deleted from Coach Vault', 'success');
        }}
        onToggleBuddy={(item) => {
          const updated = coachVaultItems.map((i) => (i.id === item.id ? { ...i, show_on_buddy: item.show_on_buddy } : i));
          setCoachVaultItems(updated);
          saveCoachVaultItems(updated);
          showToast(item.show_on_buddy ? 'Visible on Buddy Card' : 'Hidden from Buddy Card', 'success');
        }}
        showToast={showToast}
      />

      {/* Global Top-Anchored Social Media Authorization Modal */}
      <SocialAuthModal
        isOpen={socialAuthModalOpen}
        platform={selectedSocialPlatform}
        onClose={() => setSocialAuthModalOpen(false)}
        onConfirmLink={handleConfirmSocialLink}
        onUnlinkPlatform={handleUnlinkSocialPlatform}
        onSwapPlatform={handleSwapSocialPlatform}
        isLinked={!!linkedPlatforms[selectedSocialPlatform]}
        currentHandle={
          selectedSocialPlatform === 'Instagram'
            ? clientSocials.instagram
            : selectedSocialPlatform === 'TikTok'
            ? clientSocials.tiktok
            : clientSocials.thirdPlatform.handle
        }
      />

      {/* Coach-to-Social Secure Client Progress Share Modal */}
      <ClientProgressShareModal
        isOpen={!!shareClientAthlete}
        onClose={() => setShareClientAthlete(null)}
        athlete={shareClientAthlete}
        showToast={showToast}
      />

      {/* Share Client Result Modal (9:16 Story-ready) */}
      <ShareResultModal
        log={shareResultLog}
        coachName={coachProfileData.name}
        onClose={() => setShareResultLog(null)}
        showToast={showToast}
      />

      {/* Share Progress Modal (Story-ready with photo + social sharing) */}
      <ShareProgressModal
        isOpen={isShareProgressOpen}
        onClose={() => setIsShareProgressOpen(false)}
        userName={stats.name}
        benchPr="105.0kg"
        streak={String(stats.streak).padStart(2, '0') + ' Days'}
        volume={String(stats.totalVolume)}
      />

      {/* Full-Screen Athlete Intelligence & Telemetry Modal */}
      <AthleteIntelligenceModal
        isOpen={!!intelligenceTelemetry}
        onClose={() => {
          setIntelligenceTelemetry(null);
          setIntelligenceLogId(null);
        }}
        telemetry={intelligenceTelemetry}
        onApprove={intelligenceLogId ? () => handleApprove(intelligenceLogId) : undefined}
        onSendFeedback={(fb) => {
          setFeedbackText(fb);
          setTimeout(() => setFeedbackText(''), 100);
        }}
        showToast={showToast}
      />
      {/* Client Consent Banner (visible when athlete receives share request) */}
      <ClientConsentBanner clientEmail={currentUserEmail} showToast={showToast} />
    </div>
  );
}
