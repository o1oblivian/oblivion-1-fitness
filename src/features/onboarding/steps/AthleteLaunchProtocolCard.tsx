import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { OnboardingData, DevicePermissions, AthleticFocusType } from '../types/onboardingTypes';
import { titleCase } from '../../../utils/displayCase';

interface AthleteLaunchProtocolCardProps {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onLaunch: () => void;
  onSkip?: () => void;
}

const ATHLETIC_FOCUSES: AthleticFocusType[] = [
  'HYROX & RACING',
  'STRENGTH & 1RM',
  'HYPERTROPHY & VOLUME',
  'FUNCTIONAL METCON',
  'LONGEVITY & HEALTH',
];

export const AthleteLaunchProtocolCard: React.FC<AthleteLaunchProtocolCardProps> = ({
  data,
  onUpdate,
  onLaunch,
  onSkip,
}) => {
  const [perms, setPerms] = useState<DevicePermissions>(
    data.permissions || {
      location: false,
      camera: false,
      microphone: false,
      notifications: false,
    }
  );
  const currentFocus = data.primaryFocus || 'HYROX & RACING';

  const updatePerm = (key: keyof DevicePermissions, val: boolean) => {
    tactileEngine.triggerDialHaptic();
    const next = { ...perms, [key]: val };
    setPerms(next);
    onUpdate({ permissions: next });
  };

  const handleEnableAll = () => {
    tactileEngine.triggerSelectionBuzz();
    const allEnabled: DevicePermissions = {
      location: true,
      camera: true,
      microphone: true,
      notifications: true,
    };
    setPerms(allEnabled);
    onUpdate({ permissions: allEnabled });
  };

  const requestLocation = () => updatePerm('location', !perms.location);
  const requestCamera = () => updatePerm('camera', !perms.camera);
  const requestMic = () => updatePerm('microphone', !perms.microphone);
  const requestNotifications = () => updatePerm('notifications', !perms.notifications);

  return (
    <div className="relative w-full max-w-sm mx-auto select-none text-white space-y-5 animate-in fade-in duration-500">
      {/* 1. Top Horology Precision Gauge (Celestial Alignment) */}
      <div className="flex items-center justify-center gap-2 opacity-50 select-none pt-1">
        <span className="font-mono text-[8px] tracking-[0.35em] text-neutral-400">
          ||||||||||||||||
        </span>
        <span className="text-[10px] text-o1-crimson leading-none">▾</span>
        <span className="font-mono text-[8px] tracking-[0.35em] text-neutral-400">
          ||||||||||||||||
        </span>
      </div>

      {/* 2. Header: Premium Industrial Athletic Typography */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-tactical font-bold tracking-[0.24em] text-o1-crimson block">
          Oblivion 1fc
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black tracking-[0.2em] bg-gradient-to-b from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(255,255,255,0.2)]">
          Launch Protocol
        </h2>
        <p className="text-[11px] font-sans text-neutral-400 max-w-xs mx-auto leading-relaxed">
          Calibrate your high-performance training, fuel intelligence, and live biometric telemetry.
        </p>
      </div>

      {/* 3. Three Core Pillars (Nude Frameless Row Integration) */}
      <div className="space-y-2 pt-1">
        <div className="py-2.5 px-3 rounded-2xl bg-white/[0.03] border-b border-white/[0.05] flex items-start gap-3 backdrop-blur-xs">
          <div className="w-2 h-2 rounded-full bg-o1-crimson shrink-0 mt-1" />
          <div>
            <h4 className="text-[11px] font-tactical font-bold text-white tracking-[0.12em]">
              Training OS &bull; Rotary Dial
            </h4>
            <p className="text-[11px] font-sans text-neutral-400 mt-0.5">
              Calibrate daily targets with tactile rotary gestures, log high-precision sets, and track 1RM curves.
            </p>
          </div>
        </div>

        <div className="py-2.5 px-3 rounded-2xl bg-white/[0.03] border-b border-white/[0.05] flex items-start gap-3 backdrop-blur-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1 " />
          <div>
            <h4 className="text-[11px] font-tactical font-bold text-white tracking-[0.12em]">
              Fuel OS &bull; Vision Scanner
            </h4>
            <p className="text-[11px] font-sans text-neutral-400 mt-0.5">
              Deconstruct athletic meals with computer vision and verified nutritional macro breakdowns in seconds.
            </p>
          </div>
        </div>

        <div className="py-2.5 px-3 rounded-2xl bg-white/[0.03] border-b border-white/[0.05] flex items-start gap-3 backdrop-blur-xs">
          <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1 " />
          <div>
            <h4 className="text-[11px] font-tactical font-bold text-white tracking-[0.12em]">
              Coach Hub &bull; Tandem Sync
            </h4>
            <p className="text-[11px] font-sans text-neutral-400 mt-0.5">
              Sync live workout sets with training partners in real time and monitor athlete telemetry.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Device Integrations (100% Apple Compliant: Optional, "Enable", No Reviewer Text) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" />
            <span className="text-[9.5px] font-tactical font-bold tracking-[0.16em] text-neutral-300">
              Device Integrations (Optional)
            </span>
          </div>
          <button
            type="button"
            onClick={handleEnableAll}
            className="text-[9px] font-mono text-neutral-400 hover:text-white tracking-wider underline cursor-pointer transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-o1-crimson" />
            <span>Enable All</span>
          </button>
        </div>

        <p className="text-[10px] font-sans text-neutral-400 leading-normal">
          Optional. The phone asks only when you open meal scan, voice log, radar, or reminders. You can skip this and turn each one on later.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Location */}
          <button
            type="button"
            onClick={requestLocation}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
              perms.location
                ? 'bg-o1-well border-white/[0.14]'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-white block">Location</span>
              <span className="text-[10px] font-sans text-neutral-400">Gym &amp; Radar</span>
            </div>
            {perms.location ? (
              <span className="flex items-center gap-1 text-[10px] font-sans font-semibold text-o1-ok">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>On</span>
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/[0.07]">
                Enable
              </span>
            )}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={requestCamera}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
              perms.camera
                ? 'bg-o1-well border-white/[0.14]'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-white block">Camera</span>
              <span className="text-[10px] font-sans text-neutral-400">Meal Vision</span>
            </div>
            {perms.camera ? (
              <span className="flex items-center gap-1 text-[10px] font-sans font-semibold text-o1-ok">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>On</span>
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/[0.07]">
                Enable
              </span>
            )}
          </button>

          {/* Microphone */}
          <button
            type="button"
            onClick={requestMic}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
              perms.microphone
                ? 'bg-o1-well border-white/[0.14]'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-white block">Microphone</span>
              <span className="text-[10px] font-sans text-neutral-400">Voice Fuel Log</span>
            </div>
            {perms.microphone ? (
              <span className="flex items-center gap-1 text-[10px] font-sans font-semibold text-o1-ok">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>On</span>
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/[0.07]">
                Enable
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={requestNotifications}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
              perms.notifications
                ? 'bg-o1-well border-white/[0.14]'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-white block">Notifications</span>
              <span className="text-[10px] font-sans text-neutral-400">Sync &amp; Targets</span>
            </div>
            {perms.notifications ? (
              <span className="flex items-center gap-1 text-[10px] font-sans font-semibold text-o1-ok">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>On</span>
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/[0.07]">
                Enable
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. Primary Athletic Focus Selection */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-tactical font-bold text-neutral-400 tracking-[0.16em]">
            Primary Athletic Focus
          </span>
          <span className="text-[10px] font-mono text-neutral-500">1-Tap Select</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ATHLETIC_FOCUSES.map((focus) => {
            const isSel = currentFocus === focus;
            return (
              <button
                key={focus}
                type="button"
                onClick={() => {
                  tactileEngine.triggerDialHaptic();
                  onUpdate({ primaryFocus: focus });
                }}
                className={`py-2 px-3.5 rounded-full text-xs font-sans font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-o1-crimson text-white shadow-xs border border-white/[0.07]'
                    : 'bg-white/[0.04] text-neutral-300 border border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                {isSel && <Check className="w-3.5 h-3.5" />}
                <span>{titleCase(focus)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Primary Action: Oblivion 1 Crimson Ignition */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerDialHaptic();
            onLaunch();
          }}
          className="w-full py-3.5 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.98] text-white font-tactical font-bold text-xs tracking-[0.2em] transition-all shadow-md border border-white/[0.07] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Enter training os pro</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSkip();
            }}
            className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-tactical font-semibold tracking-wider cursor-pointer"
          >
            Close tutorial — stay signed in
          </button>
        )}
        <p className="text-center text-[10px] font-sans text-neutral-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Biometric telemetry is encrypted on device. Configurable anytime in Settings.</span>
        </p>
      </div>
    </div>
  );
};

export default AthleteLaunchProtocolCard;
