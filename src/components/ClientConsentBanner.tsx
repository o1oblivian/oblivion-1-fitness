import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, X, CheckCircle2, XCircle, Clock, Share2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface ConsentRequest {
  id: string;
  coach_email: string;
  client_name: string;
  share_type: string;
  share_description: string | null;
  otp_code: string;
  expires_at: string;
}

interface ClientConsentBannerProps {
  clientEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ClientConsentBanner: React.FC<ClientConsentBannerProps> = ({ clientEmail, showToast }) => {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ConsentRequest | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [responding, setResponding] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchPending = useCallback(async () => {
    if (!clientEmail) return;
    const { data } = await supabase
      .from('share_consent_requests')
      .select('id, coach_email, client_name, share_type, share_description, otp_code, expires_at')
      .eq('client_email', clientEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setRequests(data);
      setActiveRequest(prev => prev || data[0]);
    } else {
      setRequests([]);
      setActiveRequest(null);
    }
  }, [clientEmail]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleApprove = async () => {
    if (!activeRequest) return;
    if (otpInput.length < 3) {
      showToast('Enter the full 3-digit code', 'error');
      return;
    }
    if (otpInput !== activeRequest.otp_code) {
      showToast('Incorrect code. Please check and try again.', 'error');
      return;
    }
    setResponding(true);
    try {
      await supabase.from('share_consent_requests')
        .update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('id', activeRequest.id);
      showToast('Share consent approved!');
      setActiveRequest(null);
      setOtpInput('');
      setRequests(prev => prev.filter(r => r.id !== activeRequest.id));
    } catch {
      showToast('Failed to approve', 'error');
    } finally {
      setResponding(false);
    }
  };

  const handleDeny = async () => {
    if (!activeRequest) return;
    setResponding(true);
    try {
      await supabase.from('share_consent_requests')
        .update({ status: 'denied', responded_at: new Date().toISOString() })
        .eq('id', activeRequest.id);
      showToast('Share request denied');
      setActiveRequest(null);
      setOtpInput('');
      setRequests(prev => prev.filter(r => r.id !== activeRequest.id));
    } catch {
      showToast('Failed to deny', 'error');
    } finally {
      setResponding(false);
    }
  };

  const handleDismiss = async () => {
    if (activeRequest) {
      await supabase.from('share_consent_requests')
        .update({ status: 'dismissed', responded_at: new Date().toISOString() })
        .eq('id', activeRequest.id);
      setRequests(prev => prev.filter(r => r.id !== activeRequest.id));
    }
    setActiveRequest(null);
    setOtpInput('');
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const chars = otpInput.split('');
    while (chars.length < 3) chars.push('');
    chars[index] = digit;
    setOtpInput(chars.join('').replace(/\s/g, ''));
    if (digit && index < 2) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!activeRequest) return null;

  const coachName = activeRequest.coach_email.split('@')[0].replace(/\./g, ' ');
  const minutesLeft = Math.max(0, Math.round((new Date(activeRequest.expires_at).getTime() - Date.now()) / 60000));

  return (
    <div className="fixed top-4 left-4 right-4 z-[250] animate-in slide-in-from-top-5 duration-500">
      <div className="max-w-md mx-auto bg-[#0E1118]/98 backdrop-blur-2xl border border-stone-500/30 rounded-2xl shadow-2xl shadow-stone-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Share Consent Request</h4>
              <p className="text-[10px] font-mono text-gray-400">
                from <span className="text-stone-400 capitalize">{coachName}</span>
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="px-4 pb-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3 text-stone-400" />
              <span className="text-[10px] font-mono text-gray-300">
                Wants to share your <span className="text-white font-bold">{activeRequest.share_type}</span>
              </span>
            </div>
            {activeRequest.share_description && (
              <p className="text-[10px] font-mono text-gray-400 italic pl-4.5">
                &ldquo;{activeRequest.share_description}&rdquo;
              </p>
            )}
            <div className="flex items-center gap-1 text-[9px] font-mono text-amber-400 pl-4.5">
              <Clock className="w-2.5 h-2.5" />
              <span>Expires in {minutesLeft} min</span>
            </div>
          </div>
        </div>

        {/* 3-Digit Code Input */}
        <div className="px-4 pb-3">
          <p className="text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-wider text-center">Enter 3-digit consent code</p>
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map(i => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpInput[i] || ''}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-14 h-16 text-center text-2xl font-black font-mono text-stone-400 bg-black/40 border-2 border-white/15 rounded-xl focus:border-stone-500/60 focus:outline-none focus:shadow-lg focus:shadow-stone-500/10 transition-all"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-3.5 flex gap-2">
          <button
            onClick={handleDeny}
            disabled={responding}
            className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Deny
          </button>
          <button
            onClick={handleApprove}
            disabled={responding || otpInput.length < 3}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 text-black font-black text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-stone-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve Share
          </button>
        </div>

        {/* Multiple requests indicator */}
        {requests.length > 1 && (
          <div className="px-4 pb-3 text-center">
            <span className="text-[9px] font-mono text-gray-500">
              +{requests.length - 1} more consent request{requests.length > 2 ? 's' : ''} pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
