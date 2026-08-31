import React, { useState, useEffect } from 'react';
import { Flame, Video, Eye, Zap, ShieldCheck, Activity, Droplet, ChevronRight, Share2 } from 'lucide-react';
import { CoachLog } from '../FitnessIntelligenceApp';
import { getAthleteTelemetryByCoachLog } from '../../data/athleteTelemetry';
import { fetchDailyMacros, getEmailForAthlete } from '../../utils/telemetryStore';
import { DailyMacroLog } from '../../types';

interface AthleteDossierCardProps {
  log: CoachLog;
  onClick: () => void;
  onApprove: (e: React.MouseEvent) => void;
  onViewTelemetry: () => void;
  onShare: () => void;
  approving: boolean;
}

function calcSessionVolume(exercises: { sets: { weight: number | string; reps: number | string }[] }[]): number {
  let total = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const w = typeof s.weight === 'number' ? s.weight : 0;
      const r = typeof s.reps === 'number' ? s.reps : 0;
      total += w * r;
    });
  });
  return total / 1000;
}

function calcAvgRPE(exercises: { sets: { rpe: number | string }[] }[]): number {
  let sum = 0;
  let count = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const r = typeof s.rpe === 'number' ? s.rpe : 0;
      if (r > 0) {
        sum += r;
        count++;
      }
    });
  });
  return count > 0 ? sum / count : 0;
}

export const AthleteDossierCard: React.FC<AthleteDossierCardProps> = ({
  log,
  onClick,
  onApprove,
  onViewTelemetry,
  onShare,
  approving,
}) => {
  const telemetry = getAthleteTelemetryByCoachLog(log.athleteName);
  const sessionVolume = calcSessionVolume(log.exercises);
  const avgRPE = calcAvgRPE(log.exercises);
  const prs = telemetry.prs;
  const recoveryScore = log.readiness;
  const recoveryColor =
    recoveryScore >= 85 ? '#3B7A57' : recoveryScore >= 70 ? '#B8860B' : '#C05050';

  const [liveMacro, setLiveMacro] = useState<DailyMacroLog | undefined>(telemetry.macroHistory[0]);

  useEffect(() => {
    let cancelled = false;
    const email = getEmailForAthlete(log.athleteName);
    fetchDailyMacros(email, 1).then((macros) => {
      if (!cancelled && macros.length > 0) setLiveMacro(macros[0]);
    });
    return () => { cancelled = true; };
  }, [log.athleteName]);

  const latestMacro = liveMacro;

  const tierColor =
    log.handle.includes('PRO-ELITE')
      ? { bg: '#EA4335', text: 'white' }
      : log.handle.includes('HYPERTROPHY')
      ? { bg: '#C9A227', text: 'white' }
      : { bg: '#34A853', text: 'white' };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${log.approved ? 'border-[rgba(0,0,0,0.08)]' : 'border-[#EA4335]/40'} shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99] overflow-hidden`}
    >
      {/* Sleek identity row */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: tierColor.bg }}
            >
              {log.athleteName.charAt(0)}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ backgroundColor: recoveryColor }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1C1C1E] tracking-tight truncate">{log.athleteName}</span>
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0"
                style={{ backgroundColor: `${tierColor.bg}15`, color: tierColor.bg, border: `1px solid ${tierColor.bg}30` }}
              >
                {log.handle.replace('ATHLETE // ', '')}
              </span>
            </div>
            <div className="text-[10px] text-[#848785] font-mono mt-0.5">{log.timeAgo}</div>
          </div>
        </div>

        {/* Recovery pill */}
        <div
          className="flex items-center gap-2 px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${recoveryColor}12`, border: `1px solid ${recoveryColor}30` }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: recoveryColor }} />
          <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: recoveryColor }}>
            {recoveryScore}% REC
          </span>
        </div>
      </div>

      {/* High-density telemetry strip */}
      <div className="flex items-center gap-3 px-4 pb-3 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Volume</span>
          <span className="text-sm font-black tabular-nums text-[#1C1C1E]">
            {sessionVolume.toFixed(1)} <span className="text-[9px] text-[#848785] font-mono">MT</span>
          </span>
        </div>
        <div className="w-px h-7 bg-[#E5E5EA]" />
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Avg RPE</span>
          <span className="text-sm font-black tabular-nums text-[#1C1C1E]">
            {avgRPE.toFixed(1)} <span className="text-[9px] text-[#848785] font-mono">/ 10</span>
          </span>
        </div>
        <div className="w-px h-7 bg-[#E5E5EA]" />
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">Duration</span>
          <span className="text-sm font-black tabular-nums text-[#1C1C1E]">
            {log.duration.replace(/^00:/, '').replace(/:00$/, '')}
          </span>
        </div>
        {prs.length > 0 && (
          <>
            <div className="w-px h-7 bg-[#E5E5EA]" />
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-[#848785] uppercase tracking-wider">PRs</span>
              <span className="text-sm font-black tabular-nums text-[#EA4335] flex items-center gap-0.5">
                <Flame className="w-3 h-3" />
                {prs.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Exercise list with inline video pills */}
      <div className="px-4 py-3 space-y-1.5">
        {log.exercises.map((ex, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="font-bold text-[#1C1C1E] truncate flex-1 font-mono">{ex.name.toUpperCase()}</span>
            {ex.hasVideo && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EA4335]/10 border border-[#EA4335]/25 shrink-0">
                <Video className="w-2.5 h-2.5 text-[#EA4335]" />
                <span className="text-[8px] font-mono font-bold text-[#EA4335]">0:18</span>
              </span>
            )}
            <span className="text-[9px] font-mono text-[#848785] tabular-nums shrink-0">
              [{ex.sets.length} SETS]
            </span>
          </div>
        ))}

        {/* PR badges */}
        {prs.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {prs.slice(0, 2).map((pr, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#EA4335]/10 to-[#C9A227]/10 border border-[#EA4335]/25 text-[9px] font-mono font-bold"
              >
                <Flame className="w-2.5 h-2.5 text-[#EA4335]" />
                <span className="text-[#EA4335]">+{pr.delta}kg PR</span>
                <span className="text-[#848785]">{pr.exercise}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Compact nutrition fuel bar */}
      {latestMacro && (
        <div className="px-4 py-2 bg-[#F2F2F7] border-t border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1 shrink-0">
              <Activity className="w-3 h-3 text-[#34A853]" />
              <span className="font-bold tabular-nums text-[#1C1C1E]">
                {latestMacro.calories.toLocaleString()}
              </span>
              <span className="text-[#848785]">/ {latestMacro.calorieTarget.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center gap-2 text-[#848785]">
              <span><span className="font-bold text-[#34A853]">P</span> {latestMacro.protein}g</span>
              <span><span className="font-bold text-[#EA4335]">C</span> {latestMacro.carbs}g</span>
              <span><span className="font-bold text-[#C9A227]">F</span> {latestMacro.fat}g</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Droplet className="w-3 h-3 text-[#4285F4]" />
              <span className="font-bold tabular-nums text-[#1C1C1E]">{latestMacro.hydration}L</span>
            </div>
          </div>
          {/* Calorie progress bar */}
          <div className="mt-1.5 h-1 rounded-full bg-[#E5E5EA] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (latestMacro.calories / latestMacro.calorieTarget) * 100)}%`,
                backgroundColor:
                  latestMacro.calories / latestMacro.calorieTarget >= 0.9 ? '#3B7A57' : '#B8860B',
              }}
            />
          </div>
        </div>
      )}

      {/* High-contrast action bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(0,0,0,0.08)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewTelemetry();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-[rgba(0,0,0,0.08)] text-[10px] font-mono font-bold text-[#1C1C1E] transition-all active:scale-95 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-[#34A853]" />
          <span>Telemetry</span>
          <ChevronRight className="w-3 h-3 text-[#848785]" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 border border-[#0A84FF]/25 text-[10px] font-mono font-bold text-[#0A84FF] transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Result</span>
        </button>

        {log.approved ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-800/10 border border-red-800/25 text-[10px] font-mono font-bold text-red-700 dark:text-red-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED</span>
          </div>
        ) : (
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#EA4335] to-[#C24343] hover:from-[#C24343] hover:to-[#EA4335] text-white text-[10px] font-mono font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border border-[#EA4335]"
          >
            {approving ? (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>VERIFYING</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>APPROVE</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
