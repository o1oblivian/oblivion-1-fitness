import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { TermsOfServiceModal, PrivacyPolicyModal } from '../../features/legal';

interface LoginViewProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const handleReviewerAutofill = () => {
    tactileEngine.triggerDialHaptic();
    setEmail('reviewer@o1fc.club');
    setPassword('ReviewerPass2026!');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tactileEngine.triggerDialHaptic();
    const res = await (mode === 'signin' ? signIn : signUp)(email, password);
    if (res.success) {
      tactileEngine.playPRCelebration();
      onSuccess?.();
      onClose?.();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-5 bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl text-neutral-900 dark:text-white select-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
            {mode === 'signin' ? 'Athletic ID Access' : 'Create Profile'}
          </h2>
          <p className="text-[10px] text-neutral-400 font-mono">Local Vault · Secured Session</p>
        </div>
        <button type="button" onClick={handleReviewerAutofill}
          className="px-2 py-0.5 bg-[#C4121A]/10 border border-[#C4121A]/30 rounded text-[9px] font-mono text-[#C4121A] flex items-center gap-1 cursor-pointer">
          <Sparkles className="w-3 h-3" /> Reviewer Key
        </button>
      </div>

      <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-[#18181b] rounded-xl mb-3 text-xs font-bold font-mono">
        <button type="button" onClick={() => { setMode('signin'); clearError(); }}
          className={`py-1.5 rounded-lg transition-all ${mode === 'signin' ? 'bg-[#C4121A] text-white shadow' : 'text-neutral-500'}`}>
          SIGN IN
        </button>
        <button type="button" onClick={() => { setMode('signup'); clearError(); }}
          className={`py-1.5 rounded-lg transition-all ${mode === 'signup' ? 'bg-[#C4121A] text-white shadow' : 'text-neutral-500'}`}>
          SIGN UP
        </button>
      </div>

      {error && (
        <div className="mb-2.5 p-2 bg-[#C4121A]/15 border border-[#C4121A] rounded-xl flex items-center gap-2 text-xs text-[#C4121A]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@oblivion1.club" required
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-[#C4121A] font-mono" />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full pl-9 pr-10 py-2 bg-neutral-50 dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-[#C4121A] font-mono" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full mt-1 py-2.5 bg-[#C4121A] hover:bg-[#A30F16] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{mode === 'signin' ? 'Sign In To Terminal' : 'Register Account'}</span>
        </button>
      </form>

      {/* Live Legal Modals / OLED Links */}
      <div className="pt-2.5 text-center text-[10px] font-mono text-neutral-400">
        <span>By continuing, you accept our </span>
        <button type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowTerms(true); }}
          className="underline hover:text-white font-semibold cursor-pointer">Terms</button>
        <span> &amp; </span>
        <button type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowPrivacy(true); }}
          className="underline hover:text-white font-semibold cursor-pointer">Privacy Policy</button>
      </div>

      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};
export default LoginView;
