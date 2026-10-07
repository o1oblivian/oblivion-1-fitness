import React, { useState, useEffect, useCallback } from 'react';
import { X, ShieldCheck, CheckCircle2, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { stripeConnectService, CoachProfileData } from '../../../services/stripeConnectService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  coachId?: string;
}

export const CoachPayoutSettingsModal: React.FC<Props> = ({ isOpen, onClose, coachId }) => {
  const authUser = useAuthStore((s) => s.user);
  const activeCoachId = coachId || authUser?.id || '';
  const [profile, setProfile] = useState<CoachProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const prof = await stripeConnectService.getCoachProfile(activeCoachId);
    setProfile(prof);
    setLoading(false);
  }, [activeCoachId]);

  useEffect(() => { if (isOpen) checkStatus(); }, [isOpen, checkStatus]);

  const isConnected = Boolean(profile?.stripe_payouts_enabled && profile?.stripe_connect_account_id);

  const handleConnect = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    tactileEngine.triggerSelectionBuzz();
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?stripe_connected=true`;
      const res = await stripeConnectService.createConnectAccount(returnUrl);
      if (res?.url) {
        window.open(res.url, '_blank');
      } else {
        console.error('No onboarding URL returned');
        setErrorMsg(res?.error || 'Unable to initiate onboarding. Please try again.');
      }
    } catch (e: any) {
      console.error('Onboarding exception:', e);
      setErrorMsg('Unable to initiate onboarding. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setActionLoading(true);
    tactileEngine.triggerSelectionBuzz();
    const res = await stripeConnectService.createStripeLoginLink();
    setActionLoading(false);
    window.open(res?.url || 'https://dashboard.stripe.com/express', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-5 shadow-xl space-y-4 text-white overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-o1-crimson" />
            <h3 className="font-tactical text-xs font-bold uppercase tracking-wider text-white">COACH PAYOUT SETTINGS</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-o1-crimson" />
            <span>Checking Stripe Payout Status...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tactical font-semibold text-neutral-400 uppercase">Payout Gateway</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Payouts Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">Not Connected</span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                {isConnected ? 'Your bank account is verified. Coaching fees and program purchases disburse automatically.' : 'Link your direct deposit account via Stripe Express to receive client coaching earnings.'}
              </p>
            </div>
            {errorMsg && <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono">{errorMsg}</div>}
            {isConnected ? (
              <button type="button" disabled={actionLoading} onClick={handleOpenDashboard} className="w-full py-3.5 px-4 rounded-2xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ExternalLink className="w-4 h-4 text-emerald-400" />}
                <span>Open Stripe Express Dashboard</span>
              </button>
            ) : (
              <button type="button" disabled={actionLoading} onClick={handleConnect} className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4" />}
                <span>Connect Direct Payouts (Stripe Express)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default CoachPayoutSettingsModal;
