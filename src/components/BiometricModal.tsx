import React, { useState, useEffect } from 'react';
import { X, Activity, Zap, Heart, Check, Plus, HeartPulse, Flame, BatteryCharging, Dna, BarChart3, Watch, Smartphone, ShieldCheck } from 'lucide-react';

export type BiometricType = 'hrv' | 'strain' | 'recovery';

interface BiometricModalProps {
  type: BiometricType | null;
  onClose: () => void;
  wearables: Record<string, boolean>;
  onToggleWearable: (deviceKey: string) => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  type,
  onClose,
  wearables,
  onToggleWearable,
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

  if (!type) return null;

  const DATA_MAP = {
    hrv: {
      title: 'HRV Stream (Heart Rate Variability)',
      badge: 'PARASYMPATHETIC TONE',
      badgeBg: 'bg-[#7A9382]/15 text-[#7A9382] border-[#7A9382]/30',
      value: '68 ms',
      status: 'Optimal Baseline',
      statusColor: 'text-[#7A9382]',
      explanation:
        'Heart Rate Variability (HRV) measures the millisecond variations between consecutive heartbeats. High HRV reflects strong parasympathetic nervous system activity, rapid muscular recovery, and high stress resilience.',
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
      title: 'Day Strain (Cardiovascular Load)',
      badge: 'STRESS & ADAPTATION',
      badgeBg: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
      value: '14.2 / 21',
      status: 'High Target Reached',
      statusColor: 'text-[#DC2626]',
      explanation:
        'Day Strain quantifies accumulated cardiovascular and muscular stress throughout your day on a logarithmic 0–21 scale. It aggregates heart rate zone durations to optimize conditioning without risking overreaching.',
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
      title: 'Recovery Stream (CNS & Readiness)',
      badge: 'PERFORMANCE READINESS',
      badgeBg: 'bg-[#7A9382]/15 text-[#7A9382] border-[#7A9382]/30',
      value: '88%',
      status: 'Primed for Max Output',
      statusColor: 'text-[#7A9382]',
      explanation:
        'Your Recovery rating synthesizes nocturnal HRV, resting heart rate, respiratory stability, and deep sleep duration into a single readiness percentage. An 88% score indicates complete central nervous system restoration.',
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

  const WEARABLES_LIST = [
    { key: 'appleHealth', name: 'Apple Health (HealthKit)', icon: Watch, desc: 'Syncs heart rate, sleep & workout telemetry' },
    { key: 'googleFit', name: 'Google Fit / Health Connect', icon: Smartphone, desc: 'Continuous biometrics & step telemetry' },
    { key: 'whoop', name: 'Whoop Strap 4.0', icon: Zap, desc: 'Live HRV, Strain & Sleep score streaming' },
    { key: 'oura', name: 'Oura Ring Gen3', icon: Activity, desc: 'Temperature, sleep stages & readiness data' },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] bg-white dark:bg-[#121414] overflow-y-auto font-sans animate-fadeIn"
    >
      <div
        className="bg-white dark:bg-[#1C1D21] border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-[#000000] dark:text-white w-full h-full min-h-screen p-3.5 shadow-2xl relative my-0 animate-slideUpFade space-y-3.5 overflow-y-auto select-none pb-28"
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
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 active:scale-90"
            title="Close modal"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Current Metric Display */}
        <div className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 flex justify-between items-center shadow-xs">
          <div>
            <div className="text-[9px] font-mono font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
              Real-time Telemetry Value
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
              <BatteryCharging className="w-5 h-5 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Physiological Explanation */}
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-display font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-zinc-600 dark:text-[#7A9382]" />
            <span>Physiological Science & Importance</span>
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-gray-300 leading-snug font-sans bg-white dark:bg-[#12141C] p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 shadow-2xs">
            {currentData.explanation}
          </p>
        </div>

        {/* Interactive Trend Chart */}
        <div className="bg-white dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 space-y-2 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
              7-Day Metric Trend
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
                  <div className="w-full bg-neutral-100 dark:bg-[#1A1C28] rounded-lg h-16 relative overflow-hidden p-0.5 flex items-end border border-neutral-200/60 dark:border-transparent">
                    <div
                      className={`w-full rounded transition-all duration-300 ${
                        isSelected
                          ? type === 'strain'
                            ? 'bg-[#DC2626]'
                            : 'bg-stone-800 dark:bg-zinc-500'
                          : 'bg-neutral-300 dark:bg-white/10 group-hover:bg-stone-400 dark:group-hover:bg-zinc-500/40'
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

        {/* Wearable Device Pairing & Native Phone Data Connection Section */}
        <div className="pt-2 border-t border-neutral-200 dark:border-white/10 space-y-1.5">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-display font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Watch className="w-3.5 h-3.5 text-blue-500" />
              <span>Wearable Pairing</span>
            </h4>
            <span className="text-[8.5px] font-mono font-bold bg-neutral-100 dark:bg-stone-900/50 text-neutral-700 dark:text-stone-400 px-1.5 py-0.2 rounded-full border border-neutral-200 dark:border-stone-700/50">
              BACKGROUND SYNC
            </span>
          </div>

          <div className="space-y-1.5">
            {WEARABLES_LIST.map((device) => {
              const isConnected = !!wearables[device.key];
              const DeviceIcon = device.icon;
              return (
                <div
                  key={device.key}
                  className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-2 sm:p-2 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
                      <DeviceIcon className="w-4 h-4 text-neutral-700 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                        {device.name}
                      </div>
                      <div className="text-[9px] text-neutral-500 dark:text-gray-400 font-mono truncate">
                        {device.desc}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleWearable(device.key)}
                    className={`px-2.5 py-1 rounded-full font-mono text-[9.5px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                      isConnected
                        ? 'bg-neutral-900 dark:bg-stone-600 text-white border-neutral-900 dark:border-stone-600 shadow-2xs'
                        : 'bg-white dark:bg-[#1A1C28] text-neutral-700 dark:text-gray-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:border-white/20'
                    }`}
                  >
                    {isConnected ? <><Check className="w-3 h-3" /> Connected</> : <><Plus className="w-3 h-3" /> Connect</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-mono font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs mt-1 flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          Done & Save Telemetry
        </button>
      </div>
    </div>
  );
};
