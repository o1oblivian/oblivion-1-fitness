import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, Lock, ArrowRight, Loader2, Sparkles, AlertCircle,
  ShieldCheck, Crown, Plane, Dumbbell, MessageSquare, Heart,
  MapPin, Camera, BarChart3, Droplets, Pill, Wine, Share2,
  Eye, Palette, Watch, FileDown, Bot, Users, Video, Mic,
  Award, TrendingUp, DollarSign, Upload, BadgeCheck, ChevronDown, Zap,
  RotateCcw, FileText, CreditCard,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { upsertUserProfile, fetchFounderPassLiveStats, type SubscriptionTier, type FounderPassStats } from '@/utils/subscriptionStore';
import { LegalAgreementsModal } from './LegalAgreementsModal';
import { apiFetch } from '@/utils/apiUrl';
import { openExternalUrl, isNativePlatform } from '@/utils/capacitor';

/* ═══════════════════════════════════════════
   PLAN & FEATURE DATA
   ═══════════════════════════════════════════ */

type PlanTab = 'athlete' | 'coach';

interface PlanDef {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  popular?: boolean;
  accent: string;
  accentBg: string;
  icon: React.ReactNode;
}

const ATHLETE_PLANS: PlanDef[] = [
  {
    id: 'founder_pass',
    name: 'Founder Pass',
    tagline: 'Lifetime All-Access (First 1K)',
    price: '$24.00',
    period: 'once',
    popular: true,
    accent: 'text-red-600 dark:text-red-400',
    accentBg: 'bg-red-500/10 dark:bg-red-950/30',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'free',
    name: 'Core Free',
    tagline: '90-day full trial included',
    price: '$0',
    period: 'forever',
    accent: 'text-zinc-600 dark:text-zinc-300',
    accentBg: 'bg-zinc-50 dark:bg-white/[0.03]',
    icon: <Dumbbell className="w-4 h-4" />,
  },
  {
    id: 'premium',
    name: 'Premium Pro',
    tagline: 'Full training & fuel OS',
    price: '$9.99',
    period: 'mo',
    accent: 'text-red-600 dark:text-red-400',
    accentBg: 'bg-red-500/5 dark:bg-red-950/20',
    icon: <Crown className="w-4 h-4" />,
  },
  {
    id: 'premium_travel',
    name: 'Pro + Travel',
    tagline: 'Global corridor everywhere',
    price: '$15.99',
    period: 'mo',
    accent: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    icon: <Plane className="w-4 h-4" />,
  },
];

const COACH_PLANS: PlanDef[] = [
  {
    id: 'coach_free',
    name: 'Coach Free',
    tagline: 'Start coaching today',
    price: '$0',
    period: 'forever',
    accent: 'text-zinc-600 dark:text-zinc-300',
    accentBg: 'bg-zinc-50 dark:bg-white/[0.03]',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'coach_pro',
    name: 'Coach Pro',
    tagline: 'Unlimited roster & dispatch',
    price: '$29.99',
    period: 'mo',
    popular: true,
    accent: 'text-red-600 dark:text-red-400',
    accentBg: 'bg-red-500/5 dark:bg-red-950/20',
    icon: <Award className="w-4 h-4" />,
  },
];

type CellValue = string | boolean;

interface FeatureRow {
  icon: React.ReactNode;
  label: string;
  values: CellValue[];
}

const ATHLETE_FEATURES: FeatureRow[] = [
  { icon: <Heart className="w-3.5 h-3.5" />, label: 'Likes / Connections', values: ['Unlimited + VIP', '5 / day', 'Unlimited', 'Unlimited + VIP'] },
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Direct Messages', values: ['Unlimited', '3 / day', 'Unlimited', 'Unlimited'] },
  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Radar Radius', values: ['Global Corridor', '25 km', '250 km', 'Global Corridor'] },
  { icon: <Plane className="w-3.5 h-3.5" />, label: 'Travel Pass', values: [true, false, false, true] },
  { icon: <Video className="w-3.5 h-3.5" />, label: 'HD Form Reels', values: [true, true, true, true] },
  { icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Workout Logger', values: ['All exercises', 'All exercises', 'All exercises', 'All exercises'] },
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Fuel Tracker', values: ['Full + Intel Scan', 'Basic', 'Full + Intel Scan', 'Full + Intel Scan'] },
  { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Hydration Tracker', values: [true, true, true, true] },
  { icon: <Pill className="w-3.5 h-3.5" />, label: 'Supplement Tracker', values: [true, true, true, true] },
  { icon: <Wine className="w-3.5 h-3.5" />, label: 'Alcohol Impact Tracker', values: [true, true, true, true] },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Weekly Progress Charts', values: [true, true, true, true] },
  { icon: <Share2 className="w-3.5 h-3.5" />, label: 'Share Progress Cards', values: [true, true, true, true] },
  { icon: <Users className="w-3.5 h-3.5" />, label: 'Coach Marketplace', values: ['Browse + VIP', 'Browse + message', 'Browse + purchase', 'Browse + purchase'] },
  { icon: <Palette className="w-3.5 h-3.5" />, label: 'Wallpapers', values: ['All wallpapers', '3 presets', 'All wallpapers', 'All wallpapers'] },
  { icon: <Watch className="w-3.5 h-3.5" />, label: 'Watch Dial Faces', values: ['All 5 dials', '1 default', 'All 5 dials', 'All 5 dials'] },
  { icon: <Eye className="w-3.5 h-3.5" />, label: 'Telemetry / Body Metrics', values: ['Full edit + history', 'View only', 'Full edit + history', 'Full edit + history'] },
  { icon: <Camera className="w-3.5 h-3.5" />, label: 'Progress Photo Vault', values: ['Unlimited', '5 photos', 'Unlimited', 'Unlimited'] },
  { icon: <FileDown className="w-3.5 h-3.5" />, label: 'Data Export', values: ['CSV + PDF', false, 'CSV', 'CSV + PDF'] },
  { icon: <Bot className="w-3.5 h-3.5" />, label: 'O1FC Intelligence Insights', values: ['Included (Lifetime)', false, 'Included in Pro', 'Included in Pro'] },
];

const COACH_FEATURES: FeatureRow[] = [
  { icon: <Users className="w-3.5 h-3.5" />, label: 'Client Roster', values: ['Up to 5', 'Unlimited'] },
  { icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Workout Dispatch', values: [true, true] },
  { icon: <Eye className="w-3.5 h-3.5" />, label: 'Client Detail View', values: [true, true] },
  { icon: <Video className="w-3.5 h-3.5" />, label: 'Form Check Video Review', values: [true, true] },
  { icon: <Share2 className="w-3.5 h-3.5" />, label: 'Client Consent Sharing', values: [true, true] },
  { icon: <Camera className="w-3.5 h-3.5" />, label: 'Transformation Studio', values: [false, true] },
  { icon: <FileDown className="w-3.5 h-3.5" />, label: 'Client Progress Export', values: [false, true] },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Earnings Dashboard', values: [false, true] },
  { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Program Sales (80% rev)', values: [false, true] },
  { icon: <Upload className="w-3.5 h-3.5" />, label: 'Reels Upload', values: ['3 reels', 'Unlimited'] },
  { icon: <Award className="w-3.5 h-3.5" />, label: 'Branded Coach Profile', values: ['Basic', 'Full customization'] },
  { icon: <BadgeCheck className="w-3.5 h-3.5" />, label: 'PRO COACH Badge', values: [false, true] },
  { icon: <Bot className="w-3.5 h-3.5" />, label: 'Intel Coach Insights', values: ['+$9.99/mo', '+$9.99/mo'] },
];

/* ═══════════════════════════════════════════
   CELL RENDERER & VALUE FORMATTER
   ═══════════════════════════════════════════ */

const FeatureValuePill: React.FC<{ value: CellValue; isSelectedTier?: boolean }> = ({ value, isSelectedTier }) => {
  if (value === true) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
        isSelectedTier
          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300'
      }`}>
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 dark:text-gray-600 bg-slate-100/60 dark:bg-white/[0.02]">
        Not Included
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-tight text-right ${
      isSelectedTier
        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300'
    }`}>
      {value}
    </span>
  );
};

/* ═══════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════ */

export interface PayPlanHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: 'premium' | 'coach' | string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  initialHighlightTier?: string;
  defaultTab?: string;
  initialOpenCheckout?: boolean;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export const PayPlanHubModal: React.FC<PayPlanHubModalProps> = ({
  isOpen,
  onClose,
  defaultTier,
  showToast,
}) => {
  const isCoachDefault = defaultTier === 'coach' || defaultTier === 'coach_pro';

  const [activeTab, setActiveTab] = useState<PlanTab>(isCoachDefault ? 'coach' : 'athlete');
  const [selectedPlan, setSelectedPlan] = useState<string>(isCoachDefault ? 'coach_pro' : 'premium');
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoNotice, setPromoNotice] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState(false);
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [activatedSuccessTier, setActivatedSuccessTier] = useState<string | null>(null);
  const [founderPassStats, setFounderPassStats] = useState<FounderPassStats>({
    totalLimit: 5000,
    claimedCount: 0,
    remainingCount: 5000,
    isLive: true,
  });

  useEffect(() => {
    if (isOpen) {
      const coachMode = defaultTier === 'coach' || defaultTier === 'coach_pro';
      setActiveTab(coachMode ? 'coach' : 'athlete');
      setSelectedPlan(coachMode ? 'coach_pro' : 'premium');
      setLoadingMethod(null);
      setErrorMessage(null);
      setPromoCode('');
      setPromoNotice(null);
      setExpandedFeatures(false);
      setShowComparisonMatrix(false);
      setIsRestoring(false);
      setShowLegalModal(false);
      setActivatedSuccessTier(null);

      // Query live Founder Pass sales counter
      fetchFounderPassLiveStats().then((stats) => {
        if (stats) setFounderPassStats(stats);
      }).catch(() => {});
    }
  }, [isOpen, defaultTier]);

  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleOpenBillingPortal = useCallback(async () => {
    setIsOpeningPortal(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const userEmail = authSession?.user?.email || 'o1oblivianfitness@gmail.com';
      const baseUrl = window.location.origin;

      const res = await apiFetch('/api/stripe-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          returnUrl: baseUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      showToast?.('Stripe Billing Portal is available once your live customer profile is active.', 'info' as any);
    } catch {
      showToast?.('Unable to launch customer billing portal.', 'error');
    } finally {
      setIsOpeningPortal(false);
    }
  }, [showToast]);

  const handleRestorePurchases = useCallback(async () => {
    setIsRestoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const localSub = localStorage.getItem('o1fc_active_subscription');
      let restoredTier: string | null = null;

      if (session?.user?.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_email', session.user.email)
          .maybeSingle();
        if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
          restoredTier = profile.subscription_tier;
        }
      }

      if (!restoredTier && localSub) {
        try {
          const parsed = JSON.parse(localSub);
          if (parsed?.tier && parsed?.tier !== 'free') {
            restoredTier = parsed.tier;
          }
        } catch {
          // ignore parse error
        }
      }

      if (restoredTier) {
        setActivatedSuccessTier(restoredTier);
        showToast?.(`Purchases restored: Active tier is ${restoredTier.replace('_', ' ').toUpperCase()}`, 'success');
      } else {
        showToast?.('No active subscriptions found to restore. Your account is on Core Free.', 'success');
      }
    } catch {
      showToast?.('Unable to restore purchases at this moment. Please try again.', 'error');
    } finally {
      setIsRestoring(false);
    }
  }, [showToast]);

  const isAthlete = activeTab === 'athlete';
  const plans = isAthlete ? ATHLETE_PLANS : COACH_PLANS;
  const features = isAthlete ? ATHLETE_FEATURES : COACH_FEATURES;
  const selectedIndex = plans.findIndex(p => p.id === selectedPlan);
  const currentPlan = plans[selectedIndex] || plans[0];
  const isFree = currentPlan.price === '$0';

  const visibleFeatures = expandedFeatures ? features : features.slice(0, 8);

  const openStripeCheckout = (url: string) => {
    openExternalUrl(url).catch((err) => {
      console.warn('Checkout navigation error:', err);
    });
  };

  /* ── Stripe Checkout Flow (Cards, Apple Pay, Google Pay & Link) ── */
  const handleCheckout = useCallback(async (method: string) => {
    if (loadingMethod) return;
    if (isFree) {
      const targetTier = 'freemium';
      try {
        await upsertUserProfile({ subscription_tier: targetTier });
      } catch {}
      localStorage.setItem('o1fc_active_subscription', JSON.stringify({
        tier: targetTier,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      }));
      localStorage.setItem('o1fc_cached_tier', targetTier);
      window.dispatchEvent(new CustomEvent('o1fc-subscription-updated', { detail: { tier: targetTier } }));
      window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { subscription_tier: targetTier } }));
      showToast?.('Core Free Plan active.', 'success');
      onClose();
      return;
    }

    setLoadingMethod(method);
    setErrorMessage(null);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const userEmail = authSession?.user?.email || 'o1oblivianfitness@gmail.com';
      const isMobile = isNativePlatform();
      const baseUrl = isMobile || !window.location.origin || window.location.origin.includes('localhost') || window.location.protocol.startsWith('capacitor')
        ? 'https://ais-pre-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app'
        : window.location.origin;

      const response = await apiFetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          paymentMethodType: method,
          userEmail,
          successUrl: `${baseUrl}?payment=success&tier=${selectedPlan}`,
          cancelUrl: `${baseUrl}?payment=cancel`,
        }),
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.url) {
        setLoadingMethod(null);
        openStripeCheckout(resData.url);
        return;
      }

      // If Stripe did not return a valid checkout session, DO NOT activate. Display real error.
      const errorMsg = resData?.error || 'Stripe checkout could not be created. Please verify payment details and retry.';
      setLoadingMethod(null);
      setErrorMessage(errorMsg);
      showToast?.(errorMsg, 'error');
    } catch (err: any) {
      setLoadingMethod(null);
      const msg = err?.message || 'Payment service error. Please check your connection and retry.';
      setErrorMessage(msg);
      showToast?.(msg, 'error');
    }
  }, [loadingMethod, selectedPlan, isFree, showToast, onClose]);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoNotice('Promotion codes and discounts are validated and applied securely at Stripe Checkout.');
    showToast?.('Stripe will validate your promo code during checkout.', 'info' as any);
  }, [promoCode, showToast]);

  const switchTab = (tab: PlanTab) => {
    setActiveTab(tab);
    setSelectedPlan(tab === 'athlete' ? 'premium' : 'coach_pro');
    setExpandedFeatures(false);
  };

  // Lock Body Scroll safely without killing touch interactions
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99990] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121214] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xl my-0 sm:my-auto max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">

        {/* ── HEADER ── */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-4 pt-3.5 pb-2.5 rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {activatedSuccessTier ? 'Membership Status' : 'Choose Your Plan'}
              </h2>
              <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 leading-tight mt-1">O1FC Official Membership</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-nude-close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!activatedSuccessTier && (
            /* ── TAB SWITCHER (Segmented Capsule) ── */
            <div className="flex bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
              {(['athlete', 'coach'] as PlanTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab)}
                  className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    activeTab === tab
                      ? 'bg-white dark:bg-[#181B22] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab === 'athlete' ? 'Athletes' : 'Coaches'}
                </button>
              ))}
            </div>
          )}
        </div>

        {activatedSuccessTier ? (
          <div className="px-5 py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                Active Membership
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {activatedSuccessTier.replace('_', ' ').toUpperCase()} ACTIVE
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Your O1FC Official privileges and telemetry intelligence are active and synchronized across all sessions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Unlocked Privileges</span>
              <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-800 dark:text-zinc-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full Training OS Pro & Custom Dial Calibration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fuel OS Macro Intelligence & Scan Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Global Radar Proximity & Partner Tandem Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Coach Dispatch & Transformation Intelligence</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Continue to O1FC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="px-4 py-3.5 space-y-3">
          {/* ── EARLY-BIRD FOUNDER PASS BANNER (athlete only) ── */}
          {activeTab === 'athlete' && (
            <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600/10 via-red-500/5 to-amber-500/10 border border-red-500/25 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Launch Special • First {founderPassStats.totalLimit.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {founderPassStats.remainingCount.toLocaleString()} Remaining
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-snug">
                <span className="font-bold text-slate-900 dark:text-white">$24.00 Lifetime Founder Pass</span> — Training OS Pro + Global Radar forever.
              </p>
            </div>
          )}

          {/* ── PLAN SELECTOR CARDS ── */}
          <div className={`grid gap-2.5 ${plans.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : plans.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-3 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer min-h-[92px] ${
                    isSelected
                      ? 'bg-red-500/[0.04] dark:bg-red-950/20 border-2 border-red-500 dark:border-red-500 shadow-sm shadow-red-500/10'
                      : 'bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-[8px] font-bold text-white uppercase tracking-wider shadow-xs whitespace-nowrap">
                      Popular
                    </span>
                  )}
                  
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight pr-1">{plan.name}</span>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-red-500 bg-red-500' 
                          : 'border-slate-300 dark:border-zinc-600'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1 mb-2 leading-tight">{plan.tagline}</span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5 w-full">
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-sm font-bold tracking-tight ${
                        isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-zinc-200'
                      }`}>
                        {plan.price}
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-zinc-500">/{plan.period}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── ERROR BANNER ── */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── DEDICATED PLAN FEATURES ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
                Included in {currentPlan.name}
              </span>
              <button
                type="button"
                onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
                className="text-[10.5px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>{showComparisonMatrix ? 'Hide Matrix' : 'Compare Plans'}</span>
              </button>
            </div>

            {!showComparisonMatrix ? (
              <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] divide-y divide-slate-100/90 dark:divide-white/5 overflow-hidden">
                {visibleFeatures.map((feature, idx) => {
                  const val = feature.values[selectedIndex];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 leading-none truncate">
                          {feature.label}
                        </span>
                      </div>
                      <div className="shrink-0">
                        <FeatureValuePill value={val} isSelectedTier={val !== false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden overflow-x-auto bg-slate-50/40 dark:bg-white/[0.02]">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-white/[0.05] border-b border-slate-200 dark:border-white/10 text-[9px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      <th className="py-2 px-2.5 font-bold">Feature</th>
                      {plans.map((p) => (
                        <th
                          key={p.id}
                          className={`py-2 px-1.5 text-center font-bold ${
                            p.id === selectedPlan ? 'text-red-600 dark:text-red-400 bg-red-500/5' : ''
                          }`}
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                    {visibleFeatures.map((feature, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/40 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 px-2.5">
                          <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{feature.label}</span>
                        </td>
                        {feature.values.map((val, vi) => (
                          <td
                            key={vi}
                            className={`py-1.5 px-1 text-center ${
                              plans[vi]?.id === selectedPlan ? 'bg-red-500/[0.03]' : ''
                            }`}
                          >
                            <FeatureValuePill value={val} isSelectedTier={plans[vi]?.id === selectedPlan && val !== false} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Show more / less */}
            {features.length > 8 && (
              <button
                type="button"
                onClick={() => setExpandedFeatures(!expandedFeatures)}
                className="w-full py-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedFeatures ? 'rotate-180' : ''}`} />
                <span>{expandedFeatures ? 'Show less' : `Show all ${features.length} features`}</span>
              </button>
            )}
          </div>

          {/* ── AI INSIGHTS ADD-ON CALLOUT (COMPACT) ── */}
          <div className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight">O1FC Intelligence Insights</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight truncate mt-0.5">
                Smart recovery, nutrition & volume periodization
              </p>
            </div>
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0">Included with Pro</span>
          </div>

          {/* ── 1-TAP EXPRESS (paid plans only) ── */}
          {!isFree && (
            <>
              {/* ── Supported Payment Methods (Apple Pay, G Pay, PayPal) ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    1-Tap Express Checkout
                  </span>
                  <span className="text-[9.5px] font-medium text-slate-400 dark:text-zinc-500">Instant Activation</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Apple Pay */}
                  <button
                    type="button"
                    onClick={() => handleCheckout('apple_pay')}
                    disabled={!!loadingMethod}
                    title="Pay with Apple Pay"
                    className="h-9 rounded-xl bg-black hover:bg-zinc-900 border border-black dark:border-white/20 flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50 group"
                  >
                    {loadingMethod === 'apple_pay' ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg className="h-3.5 w-auto fill-white group-hover:scale-105 transition-transform" viewBox="0 0 170 170">
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.64-7.81-11.87-14.3-6.42-9.78-11.53-21.36-15.34-34.74-3.8-13.38-5.71-25.79-5.71-37.24 0-15.02 3.73-27.42 11.19-37.21 7.46-9.79 17.07-14.88 28.84-15.26 4.79 0 10.15 1.25 16.08 3.77 5.92 2.51 9.87 3.82 11.83 3.92 1.63-.1 5.64-1.41 12.02-3.92 6.38-2.52 11.96-3.7 16.74-3.55 12.42.66 22.38 5.43 29.89 14.32-10.89 6.64-16.22 15.78-16 27.42.22 9.15 3.75 16.88 10.6 23.18 6.84 6.31 15.04 9.93 24.59 10.86-2.17 6.74-4.89 13.59-8.17 20.55zM119.22 33.64c0-7.18 2.61-13.91 7.82-20.2 5.22-6.28 11.75-10.45 19.6-12.51.22 1.52.33 2.93.33 4.24 0 7.07-2.67 13.9-8.02 20.48-5.34 6.58-11.91 10.87-19.73 12.87-.22-1.3-.33-2.66-.33-4.08z" />
                        </svg>
                        <span className="text-xs font-bold text-white tracking-tight">Pay</span>
                      </div>
                    )}
                  </button>

                  {/* Google Pay */}
                  <button
                    type="button"
                    onClick={() => handleCheckout('google_pay')}
                    disabled={!!loadingMethod}
                    title="Pay with Google Pay"
                    className="h-9 rounded-xl bg-slate-900 dark:bg-[#1a1e2b] hover:bg-slate-800 border border-slate-700 dark:border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50 group"
                  >
                    {loadingMethod === 'google_pay' ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1 group-hover:scale-105 transition-transform">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span className="text-xs font-bold text-white tracking-tight">Pay</span>
                      </div>
                    )}
                  </button>

                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => handleCheckout('paypal')}
                    disabled={!!loadingMethod}
                    title="Pay with PayPal"
                    className="h-9 rounded-xl bg-[#003087] hover:bg-[#002569] border border-blue-400/30 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50 group"
                  >
                    {loadingMethod === 'paypal' ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <span className="text-xs font-bold tracking-tight leading-none group-hover:scale-105 transition-transform">
                        <span className="text-white">Pay</span>
                        <span className="text-[#0079C1]">Pal</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Promo Code ── */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMO CODE"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    if (promoNotice) setPromoNotice(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-all active:scale-95 cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoNotice && (
                <p className="text-[10px] text-red-600 dark:text-red-400 -mt-1">{promoNotice}</p>
              )}
            </>
          )}

          {/* ── PRIMARY CTA ── */}
          <button
            type="button"
            onClick={() => isFree ? onClose() : handleCheckout('card')}
            disabled={!!loadingMethod}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loadingMethod ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Secure Checkout...</span>
              </div>
            ) : isFree ? (
              <span>Continue with Free</span>
            ) : (
              <>
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Secure Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* ── TRUST BADGES & RESTORE PURCHASES ── */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-white/10 text-[10px] text-slate-400 dark:text-zinc-500 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                Stripe 256-Bit SSL
              </span>
              <span>&middot;</span>
              <span>Cancel Anytime</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
                className="flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isOpeningPortal ? (
                  <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                ) : (
                  <CreditCard className="w-3 h-3" />
                )}
                <span>Manage Sub</span>
              </button>
              <span>&middot;</span>
              <button
                type="button"
                onClick={handleRestorePurchases}
                disabled={isRestoring}
                className="flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? (
                  <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>Restore</span>
              </button>
            </div>
          </div>

          {/* ── STORE COMPLIANCE & LEGAL EULA DISCLOSURE ── */}
          <div className="text-[9px] text-slate-400 dark:text-zinc-500 leading-tight space-y-1.5 pt-1">
            <p>
              Auto-renewing subscriptions renew automatically unless cancelled at least 24 hours prior to the end of the billing period. Manage subscriptions in Account Settings or your App Store / Google Play account.
            </p>
            <div className="flex items-center justify-center gap-3 pt-0.5 text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="underline hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Terms of Use (EULA)
              </button>
              <span>&middot;</span>
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="underline hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>&middot;</span>
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="underline hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Health Disclaimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      <LegalAgreementsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
