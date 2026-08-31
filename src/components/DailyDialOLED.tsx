import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';

export type DailyDialThemeDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface DailyDialFaceProps {
  day: DailyDialThemeDay;
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  dailyKm: number;
  onOpenStepDial: () => void;
  onOpenReels: () => void;
}

export const DIAL_CONFIGS: Record<
  DailyDialThemeDay,
  {
    name: string;
    dayLabel: string;
    accentColor: string;
    accentHex: string;
    subAccentHex: string;
    tagline: string;
    description: string;
  }
> = {
  Mon: {
    name: 'Filament',
    dayLabel: 'MONDAY',
    accentColor: 'text-white',
    accentHex: '#FFFFFF',
    subAccentHex: 'rgba(255, 255, 255, 0.25)',
    tagline: 'Technical Blueprint',
    description: 'Ultra-thin concentric hairlines tracing daily progress rings in pure white.',
  },
  Tue: {
    name: 'Meridian',
    dayLabel: 'TUESDAY',
    accentColor: 'text-amber-400',
    accentHex: '#F59E0B',
    subAccentHex: 'rgba(245, 158, 11, 0.25)',
    tagline: 'Seismograph Vector',
    description: 'A single vertical gold line with metrics fanning out horizontally at precision heights.',
  },
  Wed: {
    name: 'Orbital',
    dayLabel: 'WEDNESDAY',
    accentColor: 'text-cyan-400',
    accentHex: '#00E5FF',
    subAccentHex: 'rgba(0, 229, 255, 0.25)',
    tagline: 'Planetary Orrery',
    description: 'Precision orbital paths orbiting the central chronometer.',
  },
  Thu: {
    name: 'Crosshair',
    dayLabel: 'THURSDAY',
    accentColor: 'text-emerald-400',
    accentHex: '#10B981',
    subAccentHex: 'rgba(16, 185, 129, 0.25)',
    tagline: 'Tactical Scope',
    description: 'Cold military crosshair precision with dead-center value and monospace telemetry.',
  },
  Fri: {
    name: 'Helix',
    dayLabel: 'FRIDAY',
    accentColor: 'text-purple-400',
    accentHex: '#C084FC',
    subAccentHex: 'rgba(192, 132, 252, 0.25)',
    tagline: 'Biotech Helix',
    description: 'DNA-style double helix ascending vertically with dot matrix target illumination.',
  },
  Sat: {
    name: 'Pendulum',
    dayLabel: 'SATURDAY',
    accentColor: 'text-blue-400',
    accentHex: '#60A5FA',
    subAccentHex: 'rgba(96, 165, 250, 0.25)',
    tagline: 'Harmonic Metronome',
    description: 'Hypnotic pendulum swinging through strain arc with central pivot count.',
  },
  Sun: {
    name: 'Eclipse',
    dayLabel: 'SUNDAY',
    accentColor: 'text-red-400',
    accentHex: '#F87171',
    subAccentHex: 'rgba(251, 113, 133, 0.25)',
    tagline: 'Solar Corona & Eclipse',
    description: 'Pure recovery crescent shadow closing into a glowing corona at 100% completion.',
  },
};

export const DailyDialOLED: React.FC<DailyDialFaceProps> = ({
  day,
  dailySteps,
  stepTarget,
  dailyMove,
  dailyKm,
  onOpenStepDial,
  onOpenReels,
}) => {
  const [animationTick, setAnimationTick] = useState(0);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });

  // Smooth continuous animation for dynamics (orbits, pendulum, waves)
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const loop = (now: number) => {
      setAnimationTick((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const config = DIAL_CONFIGS[day] || DIAL_CONFIGS.Mon;

  // Normalized percentages (0.0 to 1.0)
  const stepsPct = Math.min(dailySteps / (stepTarget || 10000), 1);
  const movePct = Math.min(dailyMove / 800, 1);
  const kmPct = Math.min(dailyKm / 10, 1);
  const hrRate = 72; // baseline rest bpm

  return (
    <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center my-1 select-none bg-black rounded-full overflow-hidden">
      {/* Absolute Pure #000000 True Pixel-Off OLED Void */}
      <div className="absolute inset-0 bg-[#000000] pointer-events-none" />

      {/* SVG Pure-Line Art Geometry Vector Canvas */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 340 340"
      >
        <g transform="translate(170, 170)">
          {/* ========================================================
              MONDAY: "FILAMENT"
              Ultra-thin concentric arcs (1px strokes) tracing daily progress.
              Pure white hairlines on black, like a technical blueprint.
             ======================================================== */}
          {day === 'Mon' && (
            <>
              {/* Outer Calibration Ring */}
              <circle
                r="156"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.15"
                strokeDasharray="2 6"
              />
              {/* Arc 1: Steps (Outer, 1px) */}
              <circle
                r="142"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.15"
              />
              <circle
                r="142"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${stepsPct * (2 * Math.PI * 142)} ${2 * Math.PI * 142}`}
                transform="rotate(-90)"
              />
              {/* Arc 2: Calories Move (Middle, 1px) */}
              <circle
                r="124"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.15"
              />
              <circle
                r="124"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${movePct * (2 * Math.PI * 124)} ${2 * Math.PI * 124}`}
                transform="rotate(-90)"
              />
              {/* Arc 3: Distance Km (Inner, 1px) */}
              <circle
                r="106"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.15"
              />
              <circle
                r="106"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${kmPct * (2 * Math.PI * 106)} ${2 * Math.PI * 106}`}
                transform="rotate(-90)"
              />
              {/* Precision 12-hour technical tick lines */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={Math.cos(angle) * 150}
                    y1={Math.sin(angle) * 150}
                    x2={Math.cos(angle) * 158}
                    y2={Math.sin(angle) * 158}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />
                );
              })}
            </>
          )}

          {/* ========================================================
              TUESDAY: "MERIDIAN"
              A single vertical gold line bisects the screen.
              Metrics fan out left and right as horizontal tick marks
              at different heights, like a seismograph readout.
             ======================================================== */}
          {day === 'Tue' && (
            <>
              {/* Central Gold Meridian Line */}
              <line
                x1="0"
                y1="-150"
                x2="0"
                y2="150"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />
              {/* Top & Bottom Anchor Reticles */}
              <circle cx="0" cy="-150" r="3" fill="#F59E0B" />
              <circle cx="0" cy="150" r="3" fill="#F59E0B" />
              
              {/* Seismograph Horizontal Metric Ticks */}
              {/* Step Frequency Bar (Top) */}
              {Array.from({ length: 15 }).map((_, i) => {
                const y = -120 + i * 5;
                const width = Math.sin((i / 15) * Math.PI) * 55 * stepsPct;
                return (
                  <g key={`step-${i}`}>
                    <line
                      x1={-width}
                      y1={y}
                      x2={width}
                      y2={y}
                      stroke="#F59E0B"
                      strokeWidth="1"
                      strokeOpacity={0.4 + (i / 15) * 0.6}
                    />
                  </g>
                );
              })}

              {/* KCAL Burn Ticks (Middle Left) */}
              {Array.from({ length: 10 }).map((_, i) => {
                const y = 50 + i * 6;
                const width = 30 * movePct + Math.cos(i) * 10;
                return (
                  <line
                    key={`kcal-${i}`}
                    x1={-width}
                    y1={y}
                    x2="0"
                    y2={y}
                    stroke="#F59E0B"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />
                );
              })}

              {/* KM Distance Ticks (Middle Right) */}
              {Array.from({ length: 10 }).map((_, i) => {
                const y = 50 + i * 6;
                const width = 30 * kmPct + Math.sin(i) * 10;
                return (
                  <line
                    key={`km-${i}`}
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#F59E0B"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />
                );
              })}
            </>
          )}

          {/* ========================================================
              WEDNESDAY: "ORBITAL"
              Tiny dots orbit in elliptical paths around center time.
              Each orbit = a metric (steps, cals, HR). Speed reflects progress.
             ======================================================== */}
          {day === 'Wed' && (
            <>
              {/* Orbit 1: Steps (Outer Ellipse) */}
              <ellipse
                rx="140"
                ry="75"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="1"
                strokeOpacity="0.2"
                transform="rotate(-25)"
              />
              {(() => {
                const angle = animationTick * (0.8 + stepsPct * 1.5);
                const ex = 140 * Math.cos(angle);
                const ey = 75 * Math.sin(angle);
                // Apply rotation -25 deg
                const rad = (-25 * Math.PI) / 180;
                const rx = ex * Math.cos(rad) - ey * Math.sin(rad);
                const ry = ex * Math.sin(rad) + ey * Math.cos(rad);
                return (
                  <circle cx={rx} cy={ry} r="3" fill="#00E5FF" />
                );
              })()}

              {/* Orbit 2: KCAL (Middle Ellipse) */}
              <ellipse
                rx="110"
                ry="95"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="1"
                strokeOpacity="0.25"
                transform="rotate(35)"
              />
              {(() => {
                const angle = -animationTick * (1.0 + movePct * 1.8);
                const ex = 110 * Math.cos(angle);
                const ey = 95 * Math.sin(angle);
                const rad = (35 * Math.PI) / 180;
                const rx = ex * Math.cos(rad) - ey * Math.sin(rad);
                const ry = ex * Math.sin(rad) + ey * Math.cos(rad);
                return (
                  <circle cx={rx} cy={ry} r="2.5" fill="#00E5FF" />
                );
              })()}

              {/* Orbit 3: Distance / Cadence (Inner Circle) */}
              <circle
                r="78"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="2 4"
              />
              {(() => {
                const angle = animationTick * (1.5 + kmPct * 2.0);
                const cx = 78 * Math.cos(angle);
                const cy = 78 * Math.sin(angle);
                return <circle cx={cx} cy={cy} r="2" fill="#00E5FF" />;
              })()}
            </>
          )}

          {/* ========================================================
              THURSDAY: "CROSSHAIR"
              Military-scope aesthetic. Fine crosshair lines with your
              value in the dead center. Monospace corner readouts.
             ======================================================== */}
          {day === 'Thu' && (
            <>
              {/* Outer Tactical Scope Ring */}
              <circle
                r="150"
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <circle
                r="138"
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                strokeOpacity="0.2"
                strokeDasharray="4 8"
              />
              {/* Crosshair Hairlines */}
              <line x1="-155" y1="0" x2="-80" y2="0" stroke="#10B981" strokeWidth="1" />
              <line x1="80" y1="0" x2="155" y2="0" stroke="#10B981" strokeWidth="1" />
              <line x1="0" y1="-155" x2="0" y2="-65" stroke="#10B981" strokeWidth="1" />
              <line x1="0" y1="65" x2="0" y2="155" stroke="#10B981" strokeWidth="1" />

              {/* Corner Rangefinder Brackets */}
              {/* Top-Left */}
              <path d="M -110 -90 L -110 -110 L -90 -110" fill="none" stroke="#10B981" strokeWidth="1.5" />
              {/* Top-Right */}
              <path d="M 110 -90 L 110 -110 L 90 -110" fill="none" stroke="#10B981" strokeWidth="1.5" />
              {/* Bottom-Left */}
              <path d="M -110 90 L -110 110 L -90 110" fill="none" stroke="#10B981" strokeWidth="1.5" />
              {/* Bottom-Right */}
              <path d="M 110 90 L 110 110 L 90 110" fill="none" stroke="#10B981" strokeWidth="1.5" />

              {/* Reticle Calibration Ticks */}
              {[-50, -30, 30, 50].map((val) => (
                <React.Fragment key={val}>
                  <line x1={val} y1="-5" x2={val} y2="5" stroke="#10B981" strokeWidth="1" strokeOpacity="0.6" />
                  <line x1="-5" y1={val} x2="5" y2={val} stroke="#10B981" strokeWidth="1" strokeOpacity="0.6" />
                </React.Fragment>
              ))}
            </>
          )}

          {/* ========================================================
              FRIDAY: "HELIX"
              DNA-style double helix spirals vertically, built from dots.
              Strand fills upward as daily targets are reached.
             ======================================================== */}
          {day === 'Fri' && (
            <>
              {/* Vertical Helix Dot Matrix Array */}
              {Array.from({ length: 28 }).map((_, i) => {
                const y = -140 + i * 10;
                const phase = (i * 0.35) + (animationTick * 1.5);
                const x1 = Math.sin(phase) * 55;
                const x2 = -x1;
                // Progress threshold from bottom to top
                const normalizedY = 1 - (i / 27);
                const isTargetFilled = normalizedY <= stepsPct;

                return (
                  <g key={`helix-${i}`}>
                    {/* Horizontal Base Pair Connector Hairline */}
                    <line
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="#C084FC"
                      strokeWidth="0.8"
                      strokeOpacity={isTargetFilled ? 0.6 : 0.15}
                    />
                    {/* Strand 1 Node */}
                    <circle
                      cx={x1}
                      cy={y}
                      r={isTargetFilled ? 2.5 : 1.5}
                      fill="#C084FC"
                      fillOpacity={isTargetFilled ? 1 : 0.25}
                    />
                    {/* Strand 2 Node */}
                    <circle
                      cx={x2}
                      cy={y}
                      r={isTargetFilled ? 2.5 : 1.5}
                      fill="#C084FC"
                      fillOpacity={isTargetFilled ? 1 : 0.25}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* ========================================================
              SATURDAY: "PENDULUM"
              Single thin line swings slowly like a metronome.
              Arc length = strain. Minimal counter at pivot point.
             ======================================================== */}
          {day === 'Sat' && (
            <>
              {/* Top Pivot Node */}
              <circle cx="0" cy="-130" r="3" fill="#60A5FA" />
              
              {/* Strain Arc Track Hairline */}
              <path
                d="M -90 90 A 220 220 0 0 0 90 90"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="1"
                strokeOpacity="0.2"
              />
              
              {/* Animated Swinging Pendulum Line */}
              {(() => {
                // Amplitude determined by strain/move %
                const maxAngle = (20 + movePct * 30) * (Math.PI / 180);
                const currentAngle = Math.sin(animationTick * 2.2) * maxAngle;
                const length = 220;
                const px = Math.sin(currentAngle) * length;
                const py = -130 + Math.cos(currentAngle) * length;

                return (
                  <g>
                    <line
                      x1="0"
                      y1="-130"
                      x2={px}
                      y2={py}
                      stroke="#60A5FA"
                      strokeWidth="1.2"
                      strokeOpacity="0.9"
                    />
                    <circle cx={px} cy={py} r="4.5" fill="#60A5FA" />
                  </g>
                );
              })()}

              {/* Harmonic Metronome Calibration Points */}
              {[-60, -30, 0, 30, 60].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const cx = Math.sin(rad) * 220;
                const cy = -130 + Math.cos(rad) * 220;
                return (
                  <circle
                    key={deg}
                    cx={cx}
                    cy={cy}
                    r="1.5"
                    fill="#60A5FA"
                    fillOpacity="0.4"
                  />
                );
              })}
            </>
          )}

          {/* ========================================================
              SUNDAY: "ECLIPSE"
              Thin ring (goal) with subtle crescent shadow closing as
              100% approaches. When complete, ring glows faintly.
             ======================================================== */}
          {day === 'Sun' && (
            <>
              {/* Outer Corona Base Ring (1px) */}
              <circle
                r="130"
                fill="none"
                stroke="#F87171"
                strokeWidth="1"
                strokeOpacity={stepsPct >= 1 ? 1 : 0.3}
              />
              {/* Sun Crescent Orbit Path */}
              <circle
                r="130"
                fill="none"
                stroke="#F87171"
                strokeWidth="2"
                strokeDasharray={`${stepsPct * (2 * Math.PI * 130)} ${2 * Math.PI * 130}`}
                transform="rotate(-90)"
                strokeLinecap="round"
              />
              {/* Subtle inner eclipse crescent shadow */}
              <circle
                cx={40 * (1 - stepsPct)}
                cy="0"
                r={120}
                fill="#000000"
                stroke="#F87171"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />
              {/* Solar Flare Ticks at 4 Cardinal Points */}
              {[0, 90, 180, 270].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <line
                    key={deg}
                    x1={Math.cos(rad) * 134}
                    y1={Math.sin(rad) * 134}
                    x2={Math.cos(rad) * 142}
                    y2={Math.sin(rad) * 142}
                    stroke="#F87171"
                    strokeWidth="1"
                    strokeOpacity="0.7"
                  />
                );
              })}
            </>
          )}
        </g>
      </svg>

      {/* ========================================================
          CENTRAL HIGH-END HOROLOGY DIGITAL READOUT (OLED HIGH-CONTRAST BEZEL)
         ======================================================== */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-52 pointer-events-auto">
        {/* Bezel Backing Plate to guarantee 100% contrast over SVG lines */}
        <div className="w-full py-2.5 px-3 rounded-2xl bg-[#000000]/85 border border-white/15 shadow-2xl flex flex-col items-center backdrop-blur-xs">
          {/* Cue Pill */}
          <button
            onClick={onOpenReels}
            className={`mb-1 px-2.5 py-0.5 rounded-full bg-[#111622] border border-white/20 text-[9px] font-mono font-bold tracking-widest uppercase transition-all active:scale-95 cursor-pointer shadow-xs ${config.accentColor}`}
          >
            <span className="flex items-center gap-1">
              <Play className="w-2 h-2 fill-current" />
              <span>{config.name} · {config.dayLabel}</span>
            </span>
          </button>

          {/* Primary Metric: Press & hold for 1s on step count to configure target */}
          <div
            {...stepLongPressHandlers}
            className={`cursor-pointer select-none group flex flex-col items-center transition-all duration-300 my-0.5 ${
              isPressing ? 'scale-95 opacity-80 ring-1 ring-white/30 rounded-xl px-2 py-0.5 bg-white/5' : ''
            }`}
            title="Press and hold 1s to set step target"
          >
            <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {dailySteps.toLocaleString()}
            </span>

            <div
              className={`flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase mt-1 ${config.accentColor}`}
            >
              <span>STEPS</span>
              <span className="text-white/50">/ {(stepTarget / 1000).toFixed(0)}K</span>
            </div>

            {/* Apple-grade Micro Hint Pill */}
            <div className="mt-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1 text-[8px] font-mono text-zinc-400 tracking-wider uppercase transition-all group-hover:border-white/25 group-hover:text-zinc-200">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span>HOLD TO SET GOAL</span>
            </div>
          </div>

          {/* Secondary Monospace Telemetry Vector Readouts */}
          <div className="mt-1.5 pt-1.5 border-t border-white/10 w-full flex items-center justify-around font-mono text-[10px] text-white/90">
            <span className="tracking-wider">
              <span className={`font-bold ${config.accentColor}`}>{dailyMove}</span> KCAL
            </span>
            <span className="text-white/30">|</span>
            <span className="tracking-wider">
              <span className={`font-bold ${config.accentColor}`}>{dailyKm.toFixed(2)}</span> KM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
