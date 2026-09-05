import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HeartPulse, Flame, BatteryCharging, ShieldCheck, Dna, BarChart3 } from 'lucide-react';
import { useModalBackHandler } from '../utils/modalHistory';

export type BiometricType = 'hrv' | 'strain' | 'recovery';

interface BiometricModalProps {
  type: BiometricType | null;
  onClose: () => void;
  wearables?: Record<string, boolean>;
  onToggleWearable?: (deviceKey: string) => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  type,
  onClose,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default Sunday (latest)

  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [type]);

  useModalBackHandler(!!type, onClose, 'biometric_modal');

  if (!type) return null;

  const DATA_MAP = {
    hrv: {
      title: 'Heart Rhythm (HRV)',
      badge: 'HEALTHY RHYTHM',
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      value: '68 ms',
      status: 'Normal & Steady',
      statusColor: 'text-blue-500',
      explanation:
        'Heart Rate Variability measures the natural timing between your heartbeats. A steady rhythm means your body is calm, well-rested, and handling stress well.',
      trend: [
        { day: 'Mon', val: '62 ms', height: '62%' },
        { day: 'Tue', val: '65 ms', height: '68%' },
        { day: 'Wed', val: '58 ms', height: '52%' },
        { day: 'Thu', val: '71 ms', height: '88%' },
        { day: 'Fri', val: '64 ms', height: '65%' },
        { day: 'Sat', val: '70 ms', height: '84%' },
        { day: 'Sun', val: '68 ms', height: '78%' },
      ],
    },
    strain: {
      title: 'Daily Activity (Workout Load)',
      badge: 'DAILY EFFORT',
      badgeBg: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/30',
      value: '14.2 / 21',
      status: 'Target Reached',
      statusColor: 'text-[#EA4335]',
      explanation:
        'Daily Activity measures how much work your heart and muscles did today on a scale from 0 to 21 based on your workouts, steps, and movement.',
      trend: [
        { day: 'Mon', val: '11.5', height: '52%' },
        { day: 'Tue', val: '16.8', height: '82%' },
        { day: 'Wed', val: '8.2', height: '38%' },
        { day: 'Thu', val: '15.1', height: '72%' },
        { day: 'Fri', val: '12.4', height: '59%' },
        { day: 'Sat', val: '17.5', height: '88%' },
        { day: 'Sun', val: '14.2', height: '68%' },
      ],
    },
    recovery: {
      title: 'Recovery & Energy',
      badge: 'READY TO TRAIN',
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      value: '88%',
      status: 'High Energy • Ready',
      statusColor: 'text-blue-500',
      explanation:
        'Shows how recharged your body is today based on your sleep, resting heart rate, and heart rhythm. An 88% score means your body is fully rested and ready to train.',
      trend: [
        { day: 'Mon', val: '75%', height: '75%' },
        { day: 'Tue', val: '82%', height: '82%' },
        { day: 'Wed', val: '91%', height: '91%' },
        { day: 'Thu', val: '68%', height: '68%' },
        { day: 'Fri', val: '84%', height: '84%' },
        { day: 'Sat', val: '80%', height: '80%' },
        { day: 'Sun', val: '88%', height: '88%' },
      ],
    },
  };

  const currentData = DATA_MAP[type];
  const activePoint = currentData.trend[selectedDayIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#16171B] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white w-full max-w-sm rounded-2xl p-3.5 sm:p-4 shadow-2xl relative my-auto animate-slideUpFade space-y-3 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-neutral-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase ${currentData.badgeBg}`}>
                {currentData.badge}
              </span>
            </div>
            <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white mt-1 font-mono">
              {currentData.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 active:scale-90 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
            title="Close modal"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Current Metric Display */}
        <div className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 flex justify-between items-center shadow-xs">
          <div>
            <div className="text-[9px] font-mono font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
              Today's Score
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white my-0.5">
              {currentData.value}
            </div>
            <div className={`text-[10px] font-mono font-bold ${currentData.statusColor}`}>
              ● {currentData.status}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1C28] border border-neutral-200 dark:border-white/10 flex items-center justify-center shadow-2xs">
            {type === 'hrv' ? (
              <HeartPulse className="w-5 h-5 text-red-500" />
            ) : type === 'strain' ? (
              <Flame className="w-5 h-5 text-amber-500" />
            ) : (
              <BatteryCharging className="w-5 h-5 text-blue-500" />
            )}
          </div>
        </div>

        {/* Physiological Explanation */}
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-display font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-blue-500" />
            <span>What This Means</span>
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-gray-300 leading-snug font-sans bg-neutral-50 dark:bg-[#12141C] p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 shadow-2xs">
            {currentData.explanation}
          </p>
        </div>

        {/* Interactive Trend Chart */}
        <div className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 space-y-2 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
              7-Day Trend
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-stone-400 bg-neutral-100 dark:bg-stone-900/40 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-stone-700/40">
              Selected: {activePoint.day} ({activePoint.val})
            </span>
          </div>

          <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
            {currentData.trend.map((point, i) => {
              const isSelected = i === selectedDayIndex;
              return (
                <button
                  key={point.day}
                  onClick={() => setSelectedDayIndex(i)}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
                >
                  <span className={`text-[8.5px] font-mono font-bold transition-colors ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-gray-500'}`}>
                    {point.val}
                  </span>
                  <div className="w-full bg-neutral-200/70 dark:bg-[#1A1C28] rounded-lg h-16 relative overflow-hidden p-0.5 flex items-end border border-neutral-200/60 dark:border-transparent">
                    <div
                      className={`w-full rounded transition-all duration-300 ${
                        isSelected
                          ? type === 'strain'
                            ? 'bg-[#EA4335]'
                            : 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-neutral-400 dark:bg-white/10 group-hover:bg-blue-400/40'
                      }`}
                      style={{ height: point.height }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-neutral-900 dark:text-white underline' : 'text-neutral-400 dark:text-gray-500'}`}>
                    {point.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-mono font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs mt-1 flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400 dark:text-blue-600" />
          Done
        </button>
      </div>
    </div>,
    document.body
  );
};
