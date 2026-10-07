import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { LEGAL_URLS, openLegalUrl } from '../../services/apiBase';

interface LoginViewProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

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
    <div className="w-full max-w-sm mx-auto p-5 bg-o1-card border border-white/[0.07] rounded-2xl shadow-2xl text-white select-none">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
          {mode === 'signin' ? 'Athletic ID Access' : 'Create Profile'}
        </h2>
        <p className="text-[10px] text-neutral-400 font-mono">Supabase Cloud Vault · Live Session</p>
      </div>

      <div className="grid grid-cols-2 p-1 bg-o1-well rounded-xl mb-3 text-xs font-bold font-mono">
        <button type="button" onClick={() => { setMode('signin'); clearError(); }}
          className={`py-1.5 rounded-xl transition-all ${mode === 'signin' ? 'bg-o1-crimson text-white shadow' : 'text-neutral-500'}`}>
          SIGN IN
        </button>
        <button type="button" onClick={() => { setMode('signup'); clearError(); }}
          className={`py-1.5 rounded-xl transition-all ${mode === 'signup' ? 'bg-o1-crimson text-white shadow' : 'text-neutral-500'}`}>
          SIGN UP
        </button>
      </div>

      {error && (
        <div className="mb-2.5 p-2 bg-o1-crimson/15 border border-o1-crimson rounded-xl flex items-center gap-2 text-xs text-o1-crimson">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@oblivion1.club" required
            className="w-full pl-9 pr-3 py-2 bg-o1-well border border-white/[0.07] rounded-xl text-xs outline-none focus:border-o1-crimson font-mono" />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full pl-9 pr-10 py-2 bg-o1-well border border-white/[0.07] rounded-xl text-xs outline-none focus:border-o1-crimson font-mono" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full mt-1 py-2.5 bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{mode === 'signin' ? 'Sign In To Terminal' : 'Register Account'}</span>
        </button>
      </form>

      {/* Live Legal Modals / OLED Links */}
      <div className="pt-2.5 text-center text-[10px] font-mono text-neutral-400">
        <span>By continuing, you accept our </span>
        <a href={LEGAL_URLS.terms} target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); tactileEngine.triggerSelectionBuzz(); void openLegalUrl('terms'); }}
          className="underline hover:text-white font-semibold cursor-pointer">Terms</a>
        <span> &amp; </span>
        <a href={LEGAL_URLS.privacy} target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); tactileEngine.triggerSelectionBuzz(); void openLegalUrl('privacy'); }}
          className="underline hover:text-white font-semibold cursor-pointer">Privacy Policy</a>
      </div>
    </div>
  );
};
export default LoginView;
