import React, { useState, useEffect } from 'react';
import { Users, Zap, Flame, Camera, ChevronRight, Sparkles, Check, Clock } from 'lucide-react';
import {
  getActivePair,
  getPartnerProfile,
  subscribeToTandemLive,
  broadcastTandemLiveEvent,
  TandemLiveEvent,
  TandemPair,
} from '@/utils/tandemStore';
import { TandemStoryCardModal } from './TandemStoryCardModal';
import { triggerHaptic } from '../utils/haptics';

interface LiveTandemWorkoutHUDProps {
  currentUserEmail?: string;
  currentVolume?: number;
  currentSets?: number;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToTandem?: () => void;
}

export const LiveTandemWorkoutHUD: React.FC<LiveTandemWorkoutHUDProps> = ({
  currentUserEmail,
  currentVolume = 0,
  currentSets = 0,
  showToast,
  onNavigateToTandem,
}) => {
  const [activePair, setActivePair] = useState<TandemPair | null>(null);
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const [partnerHandle, setPartnerHandle] = useState<string>('partner');
  const [latestEvent, setLatestEvent] = useState<TandemLiveEvent | null>(null);
  const [isFistBumpActive, setIsFistBumpActive] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Check active pair on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const pair = await getActivePair();
        if (!isMounted) return;
        if (pair) {
          setActivePair(pair);
          const currentId = currentUserEmail || '';
          const partnerId = pair.user_a === currentId ? pair.user_b : pair.user_a;
          if (partnerId) {
            const prof = await getPartnerProfile(partnerId);
            if (prof && isMounted) {
              setPartnerName(prof.name || 'Partner');
              setPartnerHandle(prof.handle || prof.name || 'partner');
            }
          }
        }
      } catch (err) {
        console.warn('Error loading active tandem pair:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUserEmail]);

  // Subscribe to live events
  useEffect(() => {
    if (!activePair) return;

    const unsubscribe = subscribeToTandemLive(activePair.id, (event) => {
      setLatestEvent(event);
      if (event.type === 'fist_bump') {
        setIsFistBumpActive(true);
        triggerHaptic('double');
        showToast?.(`👊 Fist bump received from ${event.senderName}!`, 'info');
        setTimeout(() => setIsFistBumpActive(false), 2500);
      } else if (event.type === 'set_completed') {
        triggerHaptic('impact');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activePair, showToast]);

  const handleSendFistBump = () => {
    triggerHaptic('impact');
    const userHandle = currentUserEmail?.split('@')[0] || 'Athlete';
    broadcastTandemLiveEvent({
      pairId: activePair?.id,
      senderId: currentUserEmail || 'me',
      senderName: userHandle,
      type: 'fist_bump',
      timestamp: new Date().toISOString(),
    });
    setIsFistBumpActive(true);
    showToast?.(`Sent fist bump to @${partnerHandle}!`, 'success');
    setTimeout(() => setIsFistBumpActive(false), 2000);
  };

  // If not paired in active workout, show subtle prompt
  if (!activePair) {
    return (
      <div
        onClick={onNavigateToTandem}
        className="w-full px-3 py-2 rounded-2xl bg-black/40 dark:bg-black/60 border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-between cursor-pointer group select-none mb-1"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-white group-hover:text-red-400 transition-colors">
              TRAIN IN TANDEM MODE
            </p>
            <p className="text-[9px] font-mono text-white/50">
              Live set sync, rest timers & duo story card
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-red-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>Pair</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // Live in-workout HUD when actively paired
  return (
    <>
      <div
        className={`w-full rounded-2xl border transition-all p-2.5 sm:p-3 relative overflow-hidden select-none mb-2 ${
          isFistBumpActive
            ? 'bg-red-950/80 border-red-500 ring-2 ring-red-500/50 shadow-xl shadow-red-600/30 animate-pulse'
            : 'bg-black/80 dark:bg-[#070709] border-white/15 shadow-lg'
        }`}
      >
        {/* Subtle red accent glow */}
        <div className="absolute top-0 right-0 w-32 h-12 bg-red-600/10 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          {/* Partner & Live Sync Status */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {partnerHandle.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black animate-ping" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-black uppercase text-white truncate">
                  @{partnerHandle}
                </span>
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  LIVE HUD
                </span>
              </div>

              {/* Dynamic live event subtitle */}
              <p className="text-[10px] font-mono text-white/70 truncate flex items-center gap-1">
                {latestEvent ? (
                  <>
                    <Zap className="w-3 h-3 text-red-400 shrink-0 inline" />
                    <span>
                      {latestEvent.type === 'set_completed' &&
                        `Set ${latestEvent.setNumber || '✓'} • ${latestEvent.exerciseName || 'Exercise'} (${latestEvent.weightLbs || 0}kg × ${latestEvent.reps || 0})`}
                      {latestEvent.type === 'rest_started' &&
                        `Resting: ${latestEvent.restDurationSec || 90}s timer`}
                      {latestEvent.type === 'fist_bump' && `👊 Fist bump from ${latestEvent.senderName}`}
                      {latestEvent.type === 'workout_started' && 'Started active session'}
                    </span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3 h-3 text-red-400 shrink-0 inline" />
                    <span>Synchronized in live Tandem channel</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Quick-Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fist Bump / Nudge */}
            <button
              type="button"
              onClick={handleSendFistBump}
              title="Send live fist bump"
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-red-400 text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <span>👊</span>
              <span className="hidden sm:inline text-[10px]">BUMP</span>
            </button>

            {/* High-Contrast Story Card Creator */}
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(true)}
              title="Export Tandem Duo Story Card"
              className="px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase">Story</span>
            </button>
          </div>
        </div>
      </div>

      {/* Story Card Modal Integration */}
      {isStoryModalOpen && (
        <TandemStoryCardModal
          isOpen={isStoryModalOpen}
          onClose={() => setIsStoryModalOpen(false)}
          userHandle={currentUserEmail ? currentUserEmail.split('@')[0] : 'athlete'}
          partnerHandle={partnerHandle}
          sessionTitle="LIVE TANDEM PROTOCOL"
          totalVolumeLbs={Math.max(currentVolume, 16800)}
          totalSets={Math.max(currentSets, 20)}
          durationMinutes={48}
          inviteCode={activePair.invite_code || 'O1FC'}
          showToast={showToast}
        />
      )}
    </>
  );
};
