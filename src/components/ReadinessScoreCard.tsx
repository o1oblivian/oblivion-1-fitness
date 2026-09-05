import React, { useState, useEffect } from 'react';
import { Activity, Zap, Moon, HeartPulse, ChevronRight, RefreshCw } from 'lucide-react';
import { calculateRecoveryScore, getCachedRecoveryScore, saveCachedRecoveryScore, RecoveryReadiness } from '../utils/recoveryScore';
import { fetchHealthTelemetry } from '../utils/healthTelemetryStore';
import { haptic } from '../utils/haptics';

interface ReadinessScoreCardProps {
  onOpenBiometrics?: (type: 'recovery' | 'hrv' | 'strain') => void;
  className?: string;
  userEmail?: string;
}

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  onOpenBiometrics,
  className = '',
  userEmail = 'athlete@o1fc.app',
}) => {
  const [readiness, setReadiness] = useState<RecoveryReadiness>(() => getCachedRecoveryScore());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const telemetry = await fetchHealthTelemetry(userEmail);
      const computed = calculateRecoveryScore({
        hrvMs: telemetry.hrv_ms || undefined,
        sleepHours: telemetry.sleep_hours || undefined,
        recentWorkouts: telemetry.workout_count || 1,
      });
      setReadiness(computed);
      saveCachedRecoveryScore(computed);
    } catch (e) {
      // fallback to cached
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('health_telemetry_updated', handleUpdate);
    window.addEventListener('o1fc_recovery_updated', handleUpdate);

    return () => {
      window.removeEventListener('health_telemetry_updated', handleUpdate);
      window.removeEventListener('o1fc_recovery_updated', handleUpdate);
    };
  }, [userEmail]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.tap();
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // SVG Gauge calculations — ultra-compact slim radius
  const radius = 17;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (readiness.score / 100) * circumference;

  return (
    <div
      onClick={() => {
        haptic.tap();
        if (onOpenBiometrics) onOpenBiometrics('recovery');
      }}
      className={`group relative overflow-hidden rounded-xl bg-white dark:bg-[#121417] border border-[#EAE8E3] dark:border-white/10 px-3 py-2 transition-all hover:border-stone-400 dark:hover:border-white/20 active:scale-[0.99] cursor-pointer shadow-2xs ${className}`}
    >
      {/* Single-row ultra-slim layout */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Gauge + Title + State */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Compact Circular Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
              <circle
                stroke="currentColor"
                className="text-stone-200 dark:text-white/10"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={readiness.color}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-mono font-black text-zinc-900 dark:text-white leading-none">
                {readiness.score}
              </span>
            </div>
          </div>

          {/* Title & Effort */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider truncate">
                Recovery & Energy
              </span>
              <span
                className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-semibold tracking-wide border ${readiness.badgeBg} ${readiness.badgeBorder} whitespace-nowrap`}
              >
                {readiness.statusLabel}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-stone-400 font-mono truncate flex items-center gap-1">
              <span>{readiness.cnsState}</span>
              <span className="opacity-40">•</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                {readiness.targetRpeMax >= 9 ? 'Full 10/10' : readiness.targetRpeMax >= 8 ? 'Normal 8.5/10' : 'Light 7/10'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Inline Vitals Chips & Refresh */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* HRV Chip */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/10 text-[9.5px] font-mono">
            <HeartPulse className="w-2.5 h-2.5 text-red-500 shrink-0" />
            <span className="font-bold text-zinc-900 dark:text-white">{readiness.details.hrvMs}</span>
            <span className="text-[8px] text-zinc-400">ms</span>
          </div>

          {/* Sleep Chip */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/10 text-[9.5px] font-mono">
            <Moon className="w-2.5 h-2.5 text-blue-500 shrink-0" />
            <span className="font-bold text-zinc-900 dark:text-white">{readiness.details.sleepHours}</span>
            <span className="text-[8px] text-zinc-400">h</span>
          </div>

          {/* RHR Chip */}
          <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/10 text-[9.5px] font-mono">
            <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            <span className="font-bold text-zinc-900 dark:text-white">{readiness.details.restingBpm}</span>
            <span className="text-[8px] text-zinc-400">bpm</span>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefresh}
            className={`p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
              isRefreshing ? 'animate-spin text-red-600' : ''
            }`}
            title="Refresh Recovery"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
