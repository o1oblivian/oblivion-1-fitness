import React, { useState, useEffect } from 'react';
import { X, Sparkles, Zap, Users, Globe, Lock } from 'lucide-react';
import { fetchUserProfile, isPremium, upsertUserProfile } from '@/utils/subscriptionStore';

export type UpSellType = 'action_quota' | 'distance_travel' | 'coach_roster';

interface UpSellPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: UpSellType;
  onViewPlans: (tier: 'premium' | 'coach') => void;
  onUnlockSuccess?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const UpSellPaywallModal: React.FC<UpSellPaywallModalProps> = ({
  isOpen,
  onClose,
  type,
  onViewPlans,
  onUnlockSuccess,
  showToast,
}) => {
  const [checking, setChecking] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoNotice, setPromoNotice] = useState<string | null>(null);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoNotice('Promotional codes can be applied directly at Stripe checkout.');
    showToast?.('Enter your promo code on the Stripe checkout page for instant discount.', 'success');
  };

  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    (async () => {
      const profile = await fetchUserProfile();
      if (profile && isPremium(profile.subscription_tier)) {
        onUnlockSuccess?.();
        onClose();
      }
      setChecking(false);
    })();
  }, [isOpen]);

  if (!isOpen || checking) return null;

  const content = {
    action_quota: {
      badge: 'ACTION QUOTA REACHED (5/5)',
      header: 'Unlimited Connections with Premium',
      text: "$9.99 / month. You've used your 5 free actions. Upgrade to instantly message this athlete and unlock unlimited daily matches.",
      buttonText: 'View Premium Plans',
      tier: 'premium' as const,
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
    },
    distance_travel: {
      badge: 'REGIONAL CORRIDOR & TRAVEL PASS',
      header: 'Expand Your Reach & Travel Mode',
      text: 'Upgrade to Premium for $9.99/mo to connect with athletes across regional 250km corridors and unlock Travel Mode to find training partners anywhere in the world.',
      buttonText: 'View Premium Plans',
      tier: 'premium' as const,
      icon: <Globe className="w-6 h-6 text-red-500" />,
    },
    coach_roster: {
      badge: 'COACH ROSTER LIMIT (10 CLIENTS)',
      header: 'Unlock Unlimited Client Roster',
      text: 'Upgrade to Coach Pro for $29.99/mo to manage unlimited clients, dispatch bulk workout protocols, and track live athlete telemetry.',
      buttonText: 'View Coach Pro Plans',
      tier: 'coach' as const,
      icon: <Users className="w-6 h-6 text-amber-400" />,
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[220] bg-white dark:bg-[#121414] overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white text-[#000000] w-full h-full min-h-screen p-3.5 shadow-2xl space-y-3 border border-[rgba(0,0,0,0.08)] relative animate-slideDownFade my-0">
        
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#34A853] text-white flex items-center justify-center shadow-none">
              {content.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#34A853] uppercase tracking-widest block">
                {content.badge}
              </span>
              <h3 className="text-base font-black text-[#000000] tracking-tight leading-snug font-mono">
                {content.header}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#F2F2F7] text-[#848785] hover:text-[#000000] cursor-pointer transition-colors active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#000000] leading-relaxed font-sans bg-[#F2F2F7] p-4 rounded-2xl border border-[rgba(0,0,0,0.08)]">
          {content.text}
        </p>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onViewPlans(content.tier);
            }}
            className="w-full py-3.5 bg-[#34A853] hover:bg-[#688070] text-white font-mono font-bold text-xs rounded-xl shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{content.buttonText}</span>
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="PROMO CODE"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoNotice(null); }}
              className="flex-1 bg-[#F2F2F7] dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#000000] dark:text-white placeholder-[#B8B0A2] dark:placeholder-gray-500 focus:outline-none focus:border-[#34A853]"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2 rounded-xl bg-[#E5E5EA] dark:bg-white/10 hover:bg-[#DDD8D0] dark:hover:bg-white/15 text-xs font-mono font-bold text-[#000000] dark:text-gray-200 transition-all active:scale-95 cursor-pointer"
            >
              Apply
            </button>
          </div>
          {promoNotice && (
            <p className="text-[11px] font-mono text-red-500 -mt-1">{promoNotice}</p>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-transparent hover:bg-gray-100 text-gray-500 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
          <Lock className="w-3 h-3 text-red-600" />
          <span>No commitment -- Cancel anytime in settings</span>
        </div>

      </div>
    </div>
  );
};
