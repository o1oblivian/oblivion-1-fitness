import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { TermsOfServiceModal, PrivacyPolicyModal } from '../legal';

interface SignUpProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onSwitchToSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    tactileEngine.triggerDialHaptic();
    const res = await signUp(email, password);
    if (res.success) {
      tactileEngine.playPRCelebration();
      onSuccess?.();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-[#09090b] border border-neutral-800 rounded-3xl shadow-2xl text-white select-none">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-red-950/40 border border-red-900/60 text-[#C4121A]">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">Create Athlete Profile</h2>
          <p className="text-[10px] font-mono text-neutral-400">Tactical Telemetry &amp; Local Vault</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            placeholder="athlete@oblivion1.club"
            required
            className="w-full pl-9 pr-3 py-2.5 bg-[#121214] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-[#C4121A] font-mono transition-colors"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            placeholder="Choose Password (min 6 chars)"
            required
            className="w-full pl-9 pr-10 py-2.5 bg-[#121214] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-[#C4121A] font-mono transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-neutral-500 hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#C4121A] hover:bg-[#A30F16] active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>INITIALIZE ATHLETE ACCOUNT</span>
        </button>
      </form>

      {/* Live Working Legal Modals / OLED Links */}
      <div className="pt-4 text-center text-[10px] font-mono text-neutral-400">
        <span>By signing up, you accept our </span>
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowTerms(true); }}
          className="text-neutral-300 underline hover:text-white cursor-pointer font-bold"
        >
          Terms
        </button>
        <span> &amp; </span>
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowPrivacy(true); }}
          className="text-neutral-300 underline hover:text-white cursor-pointer font-bold"
        >
          Privacy Policy
        </button>
      </div>

      {onSwitchToSignIn && (
        <div className="pt-3 text-center">
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-[11px] font-mono text-neutral-400 hover:text-white cursor-pointer"
          >
            Already an athlete? <span className="text-[#C4121A] font-bold">Sign In</span>
          </button>
        </div>
      )}

      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default SignUp;
