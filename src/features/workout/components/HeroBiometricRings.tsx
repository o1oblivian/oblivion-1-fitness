import React from 'react';

export interface HeroBiometricRingsProps {
  hydrationCurrentL: number;
  sleepHours?: number;
  sleepQuality?: number;
}

export const HeroBiometricRings: React.FC<HeroBiometricRingsProps> = ({
  hydrationCurrentL,
  sleepHours = 7.8,
  sleepQuality = 92,
}) => {
  const restorationScore = Math.min(100, Math.round((sleepQuality * 0.6) + (Math.min(hydrationCurrentL / 3.0, 1) * 40)));

  return (
    <div className="relative flex flex-col items-center justify-center w-40 h-40">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="#C4121A"
          strokeWidth="6"
          strokeDasharray="264"
          strokeDashoffset={264 - (264 * (restorationScore / 100))}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx="50" cy="50" r="33" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="33"
          stroke="#0284c7"
          strokeWidth="5"
          strokeDasharray="207"
          strokeDashoffset={207 - (207 * (Math.min(hydrationCurrentL / 3.5, 1)))}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx="50" cy="50" r="25" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="#10b981"
          strokeWidth="4"
          strokeDasharray="157"
          strokeDashoffset={157 - (157 * (Math.min(sleepHours / 8.0, 1)))}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-mono font-bold tracking-tight text-white">{restorationScore}</span>
        <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">RESTORATION</span>
      </div>
    </div>
  );
};

export default HeroBiometricRings;
