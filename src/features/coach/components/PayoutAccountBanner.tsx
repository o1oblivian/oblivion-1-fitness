import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { stripeConnectService, CoachProfileData } from '../../../services/stripeConnectService';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  profile: CoachProfileData | null;
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const PayoutAccountBanner: React.FC<Props> = ({ profile, onShowToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isConnected = Boolean(profile?.stripe_connect_account_id && profile?.stripe_payouts_enabled);

  const handleStartOnboarding = async () => {
    setIsLoading(true);
    tactileEngine.triggerSelectionBuzz();
    try {
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?stripe_connected=true` : undefined;
      const res = await stripeConnectService.createConnectAccount(returnUrl);
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        onShowToast(res?.error || 'Unable to initiate onboarding. Please try again.');
      }
    } catch (err) {
      console.error('Onboarding exception:', err);
      onShowToast('Unable to initiate onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsLoading(true);
    tactileEngine.triggerSelectionBuzz();
    try {
      const res = await stripeConnectService.createStripeLoginLink();
      if (res?.url) {
        window.open(res.url, '_blank');
      } else {
        window.open('https://dashboard.stripe.com/express', '_blank');
      }
    } catch {
      window.open('https://dashboard.stripe.com/express', '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  return isConnected ? (
    <div className="bg-black border border-white/[0.07] rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-tactical font-black uppercase tracking-wider text-white">DIRECT PAYOUTS</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 tracking-wider">
              Payouts Active
            </span>
          </div>
          <p className="text-xs font-sans text-neutral-300 mt-0.5 font-medium">
            Stripe Express • {profile?.stripe_connect_account_id ? `••••${profile.stripe_connect_account_id.slice(-6)}` : 'Bank Verified'}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleOpenDashboard}
        className="text-xs font-tactical font-bold text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-o1-card border border-white/[0.07] hover:border-white/[0.14] transition cursor-pointer disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />}
        <span>Open Stripe Express Dashboard</span>
      </button>
    </div>
  ) : (
    <div className="bg-black border border-white/[0.07] rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0">
          <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
        </div>
        <div>
          <span className="text-xs font-tactical font-black uppercase tracking-wider text-[#F59E0B] block">SETUP BANK PAYOUTS (STRIPE EXPRESS)</span>
          <p className="text-xs font-sans text-neutral-300 mt-0.5 font-medium">Link your bank account via Stripe Express to receive direct coaching disbursements.</p>
        </div>
      </div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleStartOnboarding}
        className="shrink-0 px-4 py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ShieldCheck className="w-4 h-4 text-white" />}
        <span>ONBOARD WITH STRIPE</span>
      </button>
    </div>
  );
};
export default PayoutAccountBanner;
