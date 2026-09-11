import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Check,
  Copy,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  DollarSign,
  Smartphone,
  Eye,
  Camera,
  Activity,
  Layers,
  Award,
  HelpCircle,
  Share2,
  Calculator,
  Flame,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useModalBackHandler } from '@/utils/modalHistory';

interface CoachPlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachEmail?: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  onOpenDispatch?: () => void;
}

type ChapterId = 'advantage' | 'calculator' | 'migration' | 'scripts' | 'cheatsheet';

interface ScriptTemplate {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  body: string;
}

const CLIENT_SCRIPTS: ScriptTemplate[] = [
  {
    id: 'upgrade-pro',
    title: 'The Elite Athletic Upgrade',
    badge: 'Standard 1-on-1',
    subtitle: 'High-retention message establishing your elevated technology standard',
    body: `Hey [Client Name]!

I am upgrading our coaching operations to our custom athletic operating platform: Oblivion 1 Fitness Club (O1FC).

Starting today, we are consolidating your training, nutrition, and form analysis into one unified system:

1. Training OS: Your personalized training protocol, progressive overload tracking, and auto-timed rest intervals with tactile gym controls.
2. Fuel OS: Instant AI meal scanning from your phone camera—no tedious manual database searches.
3. Form Check Desk: Upload your working set videos directly to my coach desk for frame-by-frame biomechanical breakdown.
4. Telemetry & PR Radar: Real-time tracking of every personal record and milestone.

Tap here to connect directly to my coach roster:
[Insert Your Coach Invite Link]

Once signed in, your active training program will automatically sync to your device. Let me know once you're inside!`,
  },
  {
    id: 'macro-focus',
    title: 'Effortless AI Fuel & Nutrition',
    badge: 'Nutrition & Recomp',
    subtitle: 'For clients frustrated with manual calorie counting and clunky third-party apps',
    body: `Hey [Client Name]!

Quick upgrade on how we are tracking your fuel and body composition moving forward.

We are dropping standalone calorie tracking apps. Our platform has Fuel OS built-in with Google Gemini AI vision:

• Simply photograph your plate with your camera.
• The AI automatically breaks down protein, carbs, fats, and calories in seconds.
• Your daily macronutrient adherence syncs directly to my coach telemetry desk.

Get started with your direct access link:
[Insert Your Coach Invite Link]

Sign in, link to my roster, and snap your next meal. It takes 3 seconds and eliminates manual logging friction completely.`,
  },
  {
    id: 'fast-text',
    title: 'Rapid WhatsApp / SMS Migration',
    badge: 'Quick Link',
    subtitle: 'Concise 2-step direct message for mobile-first athletes',
    body: `Hey [Client Name]! We are officially transferring your training and nutrition to our new dedicated training platform (O1FC).

2 quick steps to activate:
1. Tap the invite link: [Insert Your Coach Invite Link]
2. Sign in with your email to connect directly to my athlete roster.

Your updated program is already queued up and waiting for you. Drop me a reply when you are set up!`,
  },
];

export const CoachPlaybookModal: React.FC<CoachPlaybookModalProps> = ({
  isOpen,
  onClose,
  coachEmail = 'coach@o1fc.app',
  showToast,
  onOpenDispatch,
}) => {
  useModalBackHandler(isOpen, onClose, 'coach_playbook_modal');

  const [activeChapter, setActiveChapter] = useState<ChapterId>('advantage');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Dynamic Savings Calculator State
  const [clientCount, setClientCount] = useState<number>(35);
  const [avgClientFee, setAvgClientFee] = useState<number>(175);

  const calculations = useMemo(() => {
    // Traditional Stack Breakdown:
    // 1. Legacy per-seat coaching platform (Base fee $25 + sliding $2.50/client above 15)
    const legacyPlatformFee = clientCount <= 15 ? 39 : Math.round(39 + (clientCount - 15) * 3.2);
    // 2. Video analysis add-on / external markup app
    const legacyVideoApp = 29;
    // 3. Nutrition tracker add-on or athlete friction cost
    const legacyNutritionAddon = 19;
    // 4. Invoicing / platform cut (typically 3-5% higher processing or platform fee on traditional hubs)
    const monthlyGrossRevenue = clientCount * avgClientFee;
    const legacyPlatformFeeCut = Math.round(monthlyGrossRevenue * 0.025); // 2.5% platform surcharge

    const totalLegacyMonthly = legacyPlatformFee + legacyVideoApp + legacyNutritionAddon + legacyPlatformFeeCut;
    const totalLegacyAnnual = totalLegacyMonthly * 12;

    // O1FC Stack:
    // Flat $49/mo Coach Pro, 0 per-client tax, 0 video fee, 0 nutrition surcharge, direct Stripe Connect (0 platform fee)
    const o1fcMonthly = 49;
    const o1fcAnnual = o1fcMonthly * 12;

    const monthlySavings = Math.max(0, totalLegacyMonthly - o1fcMonthly);
    const annualSavings = Math.max(0, totalLegacyAnnual - o1fcAnnual);

    return {
      legacyPlatformFee,
      legacyVideoApp,
      legacyNutritionAddon,
      legacyPlatformFeeCut,
      totalLegacyMonthly,
      totalLegacyAnnual,
      o1fcMonthly,
      o1fcAnnual,
      monthlySavings,
      annualSavings,
      monthlyGrossRevenue,
    };
  }, [clientCount, avgClientFee]);

  if (!isOpen) return null;

  const handleCopyScript = (script: ScriptTemplate) => {
    navigator.clipboard.writeText(script.body);
    setCopiedScriptId(script.id);
    if (showToast) {
      showToast(`Copied "${script.title}" template to clipboard`, 'success');
    }
    setTimeout(() => {
      setCopiedScriptId((prev) => (prev === script.id ? null : prev));
    }, 2500);
  };

  const handleShareInviteLink = () => {
    const inviteUrl = `${window.location.origin}?coach=${encodeURIComponent(coachEmail)}`;
    navigator.clipboard.writeText(inviteUrl);
    if (showToast) {
      showToast('Coach invite link copied to clipboard', 'success');
    }
  };

  const CHAPTERS: { id: ChapterId; label: string; icon: React.ElementType }[] = [
    { id: 'advantage', label: 'Why O1FC Wins', icon: Zap },
    { id: 'calculator', label: 'Cost & Savings', icon: Calculator },
    { id: 'migration', label: '48h Transfer', icon: ArrowRight },
    { id: 'scripts', label: 'Client Scripts', icon: Copy },
    { id: 'cheatsheet', label: 'Coach Desk', icon: Activity },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Coach Field Manual & Client Migration Booklet"
    >
      <div className="w-full h-full sm:h-[92vh] sm:max-w-3xl bg-[#08080a] text-white sm:rounded-2xl border-0 sm:border sm:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="shrink-0 bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-[#EF4444] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#EF4444] font-bold">
                  O1FC Coach Masterclass
                </span>
                <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 text-zinc-400 font-semibold">
                  Field Manual
                </span>
              </div>
              <h2 className="text-sm font-black text-white truncate tracking-tight">
                Coach Playbook & Operational Guide
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShareInviteLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
              title="Copy Coach Invite Link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Copy Invite Link</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Playbook"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Chapter Navigation Rail */}
        <div className="shrink-0 bg-[#09090b] border-b border-white/[0.06] px-3 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-500/15 text-white border border-red-500/30'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[2] ${isActive ? 'text-[#EF4444]' : 'text-zinc-400'}`} />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Booklet Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 text-zinc-300 text-xs leading-relaxed">
          {/* ════════ CHAPTER 1: WHY O1FC WINS (ARCHITECTURAL ADVANTAGE) ════════ */}
          {activeChapter === 'advantage' && (
            <motion.div
              key="advantage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Core Positioning Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e11] border border-[#DC2626]/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DC2626] uppercase">
                    The Competitive Edge
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  One Unified Engine vs. 4 Fragmented Apps
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Traditional coaches force athletes to juggle separate subscriptions for workout logging, barcode food tracking, video messaging, and biometric monitoring. O1FC eliminates all app switching by housing every athletic discipline inside a unified Apple Pro-grade operating system.
                </p>
              </div>

              {/* Head-to-Head Comparison Matrix */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Direct Technological Comparison
                </h4>
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/60">
                  <div className="grid grid-cols-3 bg-white/[0.04] p-3 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-white/10 text-zinc-400">
                    <div>Capability</div>
                    <div className="text-zinc-400">Traditional Stack</div>
                    <div className="text-white flex items-center gap-1.5 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                      <span>O1FC Official</span>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.06] text-[11px]">
                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-semibold text-zinc-200">Fuel & Nutrition</div>
                      <div className="text-zinc-400">Tedious manual barcode scans</div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#DC2626] stroke-[2.5]" />
                        <span>Multimodal AI Vision</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-semibold text-zinc-200">Workout Logging</div>
                      <div className="text-zinc-400">Clumsy keyboard input</div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#DC2626] stroke-[2.5]" />
                        <span>Tactile Rotary Dial & Timers</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-semibold text-zinc-200">Video Form Check</div>
                      <div className="text-zinc-400">Scattered WhatsApp / DM clips</div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#DC2626] stroke-[2.5]" />
                        <span>Integrated Telestrator Markup</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-semibold text-zinc-200">Gym Cell Reception</div>
                      <div className="text-zinc-400">Freezes & drops data offline</div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#DC2626] stroke-[2.5]" />
                        <span>100% Offline-First IndexedDB</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-semibold text-zinc-200">Roster Scaling</div>
                      <div className="text-zinc-400">Costs rise per athlete added</div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#DC2626] stroke-[2.5]" />
                        <span>Flat rate, zero per-seat tax</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Value Grid */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Camera className="w-3.5 h-3.5 text-[#DC2626]" />
                    </div>
                    <span>Gemini AI Food Decomposition</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Clients photograph their plate in Fuel OS. The AI computes protein, carbohydrates, fats, and calories in 2 seconds, ending food tracking dropout.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5 text-[#DC2626]" />
                    </div>
                    <span>Coach Biomechanical Telestrator</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Scrub athlete working set footage frame-by-frame, trace barbell path vectors on-screen, and attach precise cues without leaving the app.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-[#DC2626]" />
                    </div>
                    <span>Tactile Rotary Gym Controls</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Engineered specifically for heavy lifting and chalky hands. Adjust weights and reps with an analog rotary wheel and audible rest intervals.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
                    </div>
                    <span>Direct Stripe Connect Payouts</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Client fees deposit directly into your bank account via Stripe Connect. Zero platform escrow delays, zero revenue cuts taken from your coaching.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ CHAPTER 2: COSTS & SAVINGS CALCULATOR ════════ */}
          {activeChapter === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DC2626] uppercase">
                    Interactive ROI Breakdown
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Calculate Your Exact Annual Tech Stack Savings
                </h3>
                <p className="text-zinc-400 text-xs">
                  Adjust the sliders to reflect your current roster size and average client fee to see how much profit traditional software is draining from your business.
                </p>
              </div>

              {/* Interactive Sliders */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                {/* Client Count Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">Active Athletes on Roster:</span>
                    <span className="font-mono font-black text-white px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/20">
                      {clientCount} Clients
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={5}
                    value={clientCount}
                    onChange={(e) => setClientCount(Number(e.target.value))}
                    className="w-full accent-[#DC2626] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>5 clients</span>
                    <span>50 clients</span>
                    <span>100 clients</span>
                    <span>150+ clients</span>
                  </div>
                </div>

                {/* Avg Client Retainer Slider */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">Average Monthly Retainer / Client:</span>
                    <span className="font-mono font-black text-white px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/20">
                      ${avgClientFee} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={25}
                    value={avgClientFee}
                    onChange={(e) => setAvgClientFee(Number(e.target.value))}
                    className="w-full accent-[#DC2626] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>$50/mo</span>
                    <span>$200/mo</span>
                    <span>$350/mo</span>
                    <span>$500/mo</span>
                  </div>
                </div>
              </div>

              {/* Big Impact Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Traditional Stack Cost</div>
                  <div className="text-lg font-black text-zinc-200">
                    ${calculations.totalLegacyMonthly}
                    <span className="text-[10px] font-normal text-zinc-500">/mo</span>
                  </div>
                  <div className="text-[9.5px] font-mono text-zinc-500">
                    ${calculations.totalLegacyAnnual.toLocaleString()}/year
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/50 border border-[#DC2626]/30 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#DC2626]">O1FC Flat License</div>
                  <div className="text-lg font-black text-white">
                    ${calculations.o1fcMonthly}
                    <span className="text-[10px] font-normal text-zinc-500">/mo</span>
                  </div>
                  <div className="text-[9.5px] font-mono text-zinc-400">
                    ${calculations.o1fcAnnual.toLocaleString()}/year flat
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#121216] border border-[#DC2626]/40 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#DC2626] font-bold">Net Annual Savings</div>
                  <div className="text-xl font-black text-white">
                    +${calculations.annualSavings.toLocaleString()}
                  </div>
                  <div className="text-[9.5px] font-mono text-zinc-400">
                    +${calculations.monthlySavings.toLocaleString()}/mo profit preserved
                  </div>
                </div>
              </div>

              {/* Itemized Traditional Cost Leakage Breakdown */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.08] space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Where Your Money Gets Lost in Traditional Stacks
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-300">1. Per-Client Platform Surcharge ({clientCount} athletes)</span>
                    <span className="font-mono text-zinc-300 font-bold">${calculations.legacyPlatformFee}/mo</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-300">2. External Video Markup Software</span>
                    <span className="font-mono text-zinc-300 font-bold">${calculations.legacyVideoApp}/mo</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-300">3. Third-Party Nutrition Tracker Subscription</span>
                    <span className="font-mono text-zinc-300 font-bold">${calculations.legacyNutritionAddon}/mo</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-300">4. Marketplace / Platform Payment Cut (2.5% on ${calculations.monthlyGrossRevenue.toLocaleString()})</span>
                    <span className="font-mono text-zinc-300 font-bold">${calculations.legacyPlatformFeeCut}/mo</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-zinc-100 font-bold">
                    <span>Total Lost Every Month:</span>
                    <span className="font-mono text-[#DC2626] text-xs font-black">${calculations.totalLegacyMonthly}/month</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ CHAPTER 3: 48-HOUR CLIENT MIGRATION ════════ */}
          {activeChapter === 'migration' && (
            <motion.div
              key="migration"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DC2626] uppercase">
                    Rapid Execution Roadmap
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Migrate Your Complete Roster in 3 Lean Steps
                </h3>
                <p className="text-zinc-400 text-xs">
                  Frame the move as a major technological upgrade. Execute this streamlined sequence to achieve 100% client adoption without confusion.
                </p>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#DC2626]/15 text-[#DC2626] text-[11px] font-mono font-black flex items-center justify-center">
                        01
                      </span>
                      <span className="font-bold text-white text-xs">Pre-Load Workouts into the Dispatcher</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">15 Minutes</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Before inviting clients, queue their next mesocycle in the <strong className="text-zinc-200">Workout Dispatcher</strong>. When they complete signup, their workouts appear automatically on their home dashboard.
                  </p>
                  {onOpenDispatch && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDispatch();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Open Dispatcher</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#DC2626]/15 text-[#DC2626] text-[11px] font-mono font-black flex items-center justify-center">
                        02
                      </span>
                      <span className="font-bold text-white text-xs">Broadcast Your Invite Link with Pre-Written Scripts</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">5 Minutes</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Head to the <strong className="text-zinc-200">Client Scripts</strong> tab in this booklet. Copy your preferred template and broadcast it directly across WhatsApp, email, or direct messaging.
                  </p>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 truncate">
                      {window.location.origin}?coach={coachEmail}
                    </span>
                    <button
                      onClick={handleShareInviteLink}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold font-mono transition-colors shrink-0 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#DC2626]/15 text-[#DC2626] text-[11px] font-mono font-black flex items-center justify-center">
                        03
                      </span>
                      <span className="font-bold text-white text-xs">Acknowledge First PR & Lock In Retention</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Immediate</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    When an athlete completes their first workout, an alert appears on your coach desk. Tap to acknowledge their progress and review their AI meal scan to solidify instant client buy-in.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ CHAPTER 4: OUTREACH SCRIPTS ════════ */}
          {activeChapter === 'scripts' && (
            <motion.div
              key="scripts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DC2626] uppercase">
                    Ready-to-Send Client Scripts
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Copy, Paste, and Send Directly to Your Athletes
                </h3>
                <p className="text-zinc-400 text-xs">
                  Tailored message templates engineered for high response rates. Tap "Copy Script", insert your invite link, and deliver via messaging or email.
                </p>
              </div>

              <div className="space-y-4">
                {CLIENT_SCRIPTS.map((script) => (
                  <div
                    key={script.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xs">{script.title}</h4>
                          <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 text-zinc-400 font-semibold">
                            {script.badge}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[10.5px] mt-0.5">{script.subtitle}</p>
                      </div>
                      <button
                        onClick={() => handleCopyScript(script)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer shrink-0 ${
                          copiedScriptId === script.id
                            ? 'bg-white text-black font-black'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {copiedScriptId === script.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 stroke-[2]" />
                            <span>Copy Script</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-zinc-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                      {script.body}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════════ CHAPTER 5: COACH DESK QUICK REFERENCE ════════ */}
          {activeChapter === 'cheatsheet' && (
            <motion.div
              key="cheatsheet"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DC2626] uppercase">
                    Tactical Cheat Sheet
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Coach Command Desk Quick Reference
                </h3>
                <p className="text-zinc-400 text-xs">
                  Summary of essential coach actions to keep your roster engaged and thriving.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Activity className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span>Reviewing Unread Form Checks</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Switch to the <strong className="text-zinc-200">INBOX</strong> tab in your coach desk. Tap any pending video to launch the telestrator, scrub playback, draw biomechanical vectors, and record feedback cues.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Award className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span>Handling PR Breakthrough Alerts</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    When an athlete achieves a personal record, a banner appears at the top of your screen. Tap <strong className="text-zinc-200">Acknowledge</strong> to confirm the progression and notify the athlete.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span>Bulk Mesocycle Dispatch</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Use the <strong className="text-zinc-200">Program Dispatcher</strong> to select multiple athletes or an entire roster tier at once. Push multi-week workout protocols instantly with one confirmation tap.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span>Athlete Access & Fees</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Athletes do not pay any app subscription to train under your coaching. Workout logging, rest timers, and communication are completely free for your clients.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-[#0c0c0e] border-t border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span className="text-[10px] font-mono text-zinc-400">
              Active Coach License: <strong className="text-white">Verified</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareInviteLink}
              className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B8121A] text-white text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Invite Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
