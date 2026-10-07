import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useOfflineStatus } from '../../services/offlineSyncService';

export const BasementOfflineBanner: React.FC = () => {
  const { isOnline } = useOfflineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <aside
        aria-label="Basement safe offline mode status"
        className="w-full bg-o1-well border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono select-none animate-in fade-in slide-in-from-top-2 duration-200 z-40"
      >
        <div className="flex items-center gap-2 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-amber-300">
            BASEMENT SAFE • OFFLINE ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">All sets, timers &amp; logs saving locally</span>
          <span className="sm:hidden">Saving locally</span>
        </div>
      </aside>
    );
  }

  if (showRestored) {
    return (
      <aside
        aria-label="Online connection restored status"
        className="w-full bg-emerald-950/80 border-b border-emerald-500/40 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono select-none animate-in fade-in slide-in-from-top-2 duration-200 z-40"
      >
        <div className="flex items-center gap-2 text-emerald-300 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="uppercase tracking-wider">CONNECTED • GYM LOGS SYNCED</span>
        </div>
        <span className="text-[10px] text-emerald-200/80 font-normal">Cloud sync complete</span>
      </aside>
    );
  }

  return null;
};
export default BasementOfflineBanner;
