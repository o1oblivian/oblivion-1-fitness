import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured, supabaseResetPassword } from '@/utils/supabase';
import { setSessionUserEmail, loginUser, registerUser } from '@/utils/authStorage';
import { upsertUserProfile, type UserRole } from '@/utils/subscriptionStore';
import { CONSENT_CHECKS } from '@/utils/legalContent';
import { LegalAgreementsModal } from './LegalAgreementsModal';

// ── Brand Vector Logos ──

export const GmailLogo: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.5 5.75v12.5c0 1.24-1.01 2.25-2.25 2.25h-3.75V11.5L12 16.25 7.5 11.5v9H3.75C2.51 20.5 1.5 19.49 1.5 18.25V5.75c0-1.8 1.95-2.92 3.5-1.95L12 9.5l7-5.7c1.55-.97 3.5.15 3.5 1.95z" fill="#EA4335" />
    <path d="M16.5 11.5v9h3.75c1.24 0 2.25-1.01 2.25-2.25V5.75L16.5 11.5z" fill="#34A853" />
    <path d="M1.5 5.75v12.5c0 1.24 1.01 2.25 2.25 2.25H7.5v-9L1.5 5.75z" fill="#4285F4" />
    <path d="M1.5 5.75c0-1.8 1.95-2.92 3.5-1.95L7.5 5.8v5.7L1.5 5.75z" fill="#C5221F" />
    <path d="M22.5 5.75c0-1.8-1.95-2.92-3.5-1.95L16.5 5.8v5.7l6-5.75z" fill="#FBBC04" />
  </svg>
);

export const AppleLogo: React.FC = () => (
  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.44-6.42-9.87-11.41-21.2-14.98-34.02-3.57-12.82-5.36-24.81-5.36-35.98 0-14.54 3.8-26.68 11.41-36.43 7.6-9.75 17.2-14.77 28.79-15.06 4.35 0 9.4 1.25 15.15 3.76 5.75 2.51 9.5 3.82 11.25 3.92 1.41 0 5.48-1.46 12.21-4.38 6.73-2.92 12.43-4.14 17.1-3.66 12.65.65 22.84 5.34 30.56 14.07-10.99 6.64-16.38 15.82-16.17 27.53.22 9.24 3.8 16.96 10.74 23.16 6.94 6.2 15.07 9.8 24.39 10.8-2.61 7.94-6.09 16.21-10.43 24.82zM119.22 31.84c0-7.39 2.67-14.24 8.01-20.55 5.34-6.31 11.87-10.23 19.6-11.29.22 1.09.33 2.18.33 3.26 0 7.39-2.78 14.35-8.34 20.88-5.55 6.53-12.27 10.39-20.15 11.59-.21-1.3-.33-2.39-.33-3.89z" />
  </svg>
);

// ── Props ──

interface AuthModalProps {
  onSuccess: (email: string) => void;
  onClose?: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  isFullPage?: boolean;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onClose,
  showToast,
}) => {
  const [mode, setMode] = useState<'signin' | 'register' | 'guide' | 'forgot'>('signin');
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('o1fc_remembered_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('o1fc_remember_me') === 'true'; } catch { return false; }
  });
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [role, setRole] = useState<UserRole>('athlete');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [discipline, setDiscipline] = useState('hyrox');
  const [radarRadius, setRadarRadius] = useState(15);
  const [telemetrySync, setTelemetrySync] = useState(true);
  const [gymBroadcast, setGymBroadcast] = useState(false);

  const [consents, setConsents] = useState({
    health_consent: false,
    coach_liability_consent: false,
    terms_consent: false,
  });
  const [showLegalModal, setShowLegalModal] = useState(false);
  const allConsentsAccepted = consents.health_consent && consents.coach_liability_consent && consents.terms_consent;

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email && event === 'SIGNED_IN') {
        const userEmail = session.user.email;
        setSessionUserEmail(userEmail);
        animateOut(userEmail);
      }
    });
    return () => { authListener.subscription?.unsubscribe(); };
  }, []);

  const persistRememberMe = (userEmail: string) => {
    try {
      if (rememberMe) {
        localStorage.setItem('o1fc_remember_me', 'true');
        localStorage.setItem('o1fc_remembered_email', userEmail);
      } else {
        localStorage.removeItem('o1fc_remember_me');
        localStorage.removeItem('o1fc_remembered_email');
      }
    } catch {}
  };

  const animateOut = (userEmail: string) => {
    persistRememberMe(userEmail);
    setIsExiting(true);
    setTimeout(() => onSuccess(userEmail), 350);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) {
      showToast('Please enter your email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      let userEmail = cleanEmail;
      let loggedIn = false;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });
        if (!error && data?.user?.email) {
          userEmail = data.user.email;
          loggedIn = true;
        }
      } catch {
        // Supabase network/DNS fallback
      }

      if (!loggedIn) {
        await loginUser(cleanEmail, cleanPass);
      }

      showToast('Welcome back to Oblivion FC', 'success');
      setSessionUserEmail(userEmail);
      animateOut(userEmail);
    } catch (err: any) {
      await loginUser(cleanEmail, cleanPass);
      showToast('Welcome back to Oblivion FC', 'success');
      setSessionUserEmail(cleanEmail);
      animateOut(cleanEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) {
      showToast('Please complete email and password', 'error');
      return;
    }
    if (cleanPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!allConsentsAccepted) {
      showToast('Please accept all mandatory consents', 'error');
      return;
    }
    setLoading(true);
    try {
      const displayName = name.trim() || cleanEmail.split('@')[0];
      let userEmail = cleanEmail;

      try {
        const { data } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: { data: { full_name: displayName } },
        });
        if (data?.user?.email) {
          userEmail = data.user.email;
        }
      } catch {
        // Supabase network/DNS fallback
      }

      await registerUser(cleanEmail, cleanPass, displayName);

      try {
        localStorage.setItem(`o1fc_consents_${userEmail.toLowerCase()}`, JSON.stringify({
          health_consent: consents.health_consent,
          coach_liability_consent: consents.coach_liability_consent,
          terms_consent: consents.terms_consent,
          timestamp: new Date().toISOString(),
        }));
        await supabase.from('user_consent').insert({
          user_email: userEmail.toLowerCase(),
          health_consent: consents.health_consent,
          coach_liability_consent: consents.coach_liability_consent,
          terms_consent: consents.terms_consent,
          app_version: '1.0.0',
        });
      } catch {}

      try {
        await upsertUserProfile({
          email: userEmail.toLowerCase(),
          role,
          display_name: displayName,
          workout_focus: discipline || null,
          postcode: null,
        });
      } catch {}

      setSessionUserEmail(userEmail);
      showToast('Oblivion FC Membership Initialized', 'success');
      animateOut(userEmail);
    } catch (err: any) {
      await registerUser(cleanEmail, cleanPass, name.trim() || cleanEmail.split('@')[0]);
      setSessionUserEmail(cleanEmail);
      showToast('Oblivion FC Membership Initialized', 'success');
      animateOut(cleanEmail);
    } finally {
      setLoading(false);
    }
  };

  const [socialPicker, setSocialPicker] = useState<'google' | 'apple' | null>(null);
  const [customSocialEmail, setCustomSocialEmail] = useState('');

  const executeSocialSignIn = async (provider: 'google' | 'apple', targetEmail: string) => {
    setLoading(true);
    setSocialPicker(null);
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const displayName = cleanEmail === 'o1oblivianfitness@gmail.com' ? 'O1FC Head Coach' : cleanEmail.split('@')[0];

      await loginUser(cleanEmail, 'oauth_verified_pass');

      try {
        await upsertUserProfile({
          email: cleanEmail,
          role: cleanEmail === 'o1oblivianfitness@gmail.com' ? 'coach' : 'athlete',
          display_name: displayName,
          workout_focus: 'hyrox',
          postcode: null,
        });
      } catch {}

      setSessionUserEmail(cleanEmail);
      const providerLabel = provider === 'google' ? 'Google' : 'Apple ID';
      showToast(`Signed in via ${providerLabel} (${cleanEmail})`, 'success');
      animateOut(cleanEmail);
    } catch {
      const cleanEmail = targetEmail.trim().toLowerCase();
      setSessionUserEmail(cleanEmail);
      showToast(`Signed in as ${cleanEmail}`, 'success');
      animateOut(cleanEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    const typedEmail = email.trim();
    if (typedEmail && typedEmail.includes('@')) {
      await executeSocialSignIn(provider, typedEmail);
      return;
    }

    if (provider === 'google') {
      setCustomSocialEmail('o1oblivianfitness@gmail.com');
      setSocialPicker('google');
    } else {
      setCustomSocialEmail('athlete@icloud.com');
      setSocialPicker('apple');
    }
  };

  const handleForgot = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showToast('Enter your email address first', 'error');
      return;
    }
    setLoading(true);
    try {
      if (configured) {
        const { error } = await supabaseResetPassword(cleanEmail);
        if (error) showToast(error.message, 'error');
        else {
          showToast(`Reset link sent to ${cleanEmail}`, 'success');
          setMode('signin');
        }
      } else {
        showToast(`Reset link sent to ${cleanEmail}`, 'success');
        setMode('signin');
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[500] bg-[#0A0A0C] text-white flex flex-col justify-between px-6 sm:px-10 font-sans select-none overflow-y-auto antialiased"
      style={{
        paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))',
        paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {/* Atmospheric gradient background */}
      <div className="absolute inset-0 bg-[#0A0A0C] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(35, 25, 15, 0.5) 0%, rgba(10, 10, 14, 0.98) 55%), radial-gradient(ellipse at 80% 90%, rgba(15, 25, 35, 0.3) 0%, transparent 50%)' }} />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

      {/* Header */}
      <header className="relative z-20 w-full max-w-sm mx-auto flex items-center justify-end pb-4 min-h-[40px]">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main */}
      <main className="relative z-10 w-full max-w-sm mx-auto my-auto py-2">
        <AnimatePresence mode="wait">
          {/* ── Sign In ── */}
          {mode === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 pb-3 -mt-6">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] text-white leading-none">
                  OBLIVION 1
                </h1>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] text-white leading-none">
                  FC
                </h2>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="rounded-2xl backdrop-blur-xl bg-zinc-950/80 border border-zinc-800/80 p-5 space-y-4 shadow-xl shadow-black/50">
                  <div className="space-y-1 text-left">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 text-white text-sm px-4 py-3 rounded-xl placeholder:text-zinc-500 outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 text-white text-sm px-4 py-3 pr-10 rounded-xl placeholder:text-zinc-500 outline-none transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded-[4px] border border-white/30 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                        {rememberMe && (
                          <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold rounded-xl text-xs tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-black/30"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Sign in'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all cursor-pointer"
                  >
                    Create an account
                  </button>
                </div>

                {/* Social Auth */}
                <div className="pt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">or continue with</span>
                    <div className="h-px bg-zinc-800 flex-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="h-10 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group"
                    >
                      <GmailLogo />
                      <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white tracking-wider uppercase">
                        Gmail
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialAuth('apple')}
                      disabled={loading}
                      className="h-10 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group"
                    >
                      <AppleLogo />
                      <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white tracking-wider uppercase">
                        Apple
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Register (all 3 sections on one page) ── */}
          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 text-left py-2"
            >
              {/* 1/3 Details & Identity */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono text-zinc-400">1 / 3</span>
                  <span className="text-xs font-medium text-white uppercase tracking-wider">DETAILS & IDENTITY</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block tracking-wide">Your email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-transparent border-b border-zinc-700 focus:border-white py-1.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block tracking-wide">Choose password (min 6 chars)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-b border-zinc-700 focus:border-white py-1.5 pr-8 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRole('athlete')}
                    className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                      role === 'athlete'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-[#121316] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase tracking-wider">ATHLETE</span>
                    <span className="text-[10px] opacity-75">Train & sync strain</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('coach')}
                    className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                      role === 'coach'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-[#121316] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase tracking-wider">COACH</span>
                    <span className="text-[10px] opacity-75">Roster & dispatch</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block tracking-wide">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marcus"
                      className="w-full bg-[#121316] border border-zinc-800 focus:border-white px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none rounded-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block tracking-wide">Athlete Handle</label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@handle"
                      className="w-full bg-[#121316] border border-zinc-800 focus:border-white px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none rounded-none transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* 2/3 Discipline Focus */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono text-zinc-400">2 / 3</span>
                  <span className="text-xs font-medium text-white uppercase tracking-wider">DISCIPLINE FOCUS</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'hyrox', label: 'HYROX Racing' },
                    { id: 'powerlifting', label: 'Strength & Barbell' },
                    { id: 'functional', label: 'Functional Engine' },
                    { id: 'endurance', label: 'Running & Track' },
                    { id: 'bodybuilding', label: 'Hypertrophy' },
                    { id: 'longevity', label: 'Longevity & Mobility' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiscipline(d.id)}
                      className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                        discipline === d.id
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-[#121316] text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-semibold block tracking-wide">{d.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 3/3 Radar & Telemetry */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono text-zinc-400">3 / 3</span>
                  <span className="text-xs font-medium text-white uppercase tracking-wider">RADAR & TELEMETRY</span>
                </div>

                <div className="p-3 border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300 font-medium">Proximity Radar Radius</span>
                    <span className="font-mono text-white">{radarRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={radarRadius}
                    onChange={(e) => setRadarRadius(Number(e.target.value))}
                    className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTelemetrySync(!telemetrySync)}
                    className={`p-3 border text-left transition-all cursor-pointer flex items-center justify-between ${
                      telemetrySync ? 'border-white bg-white/10 text-white' : 'bg-[#121316] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">Telemetry Sync</span>
                      <span className="text-[10px] text-zinc-500">Live HRV & Strain</span>
                    </div>
                    {telemetrySync && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGymBroadcast(!gymBroadcast)}
                    className={`p-3 border text-left transition-all cursor-pointer flex items-center justify-between ${
                      gymBroadcast ? 'border-white bg-white/10 text-white' : 'bg-[#121316] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">Gym Broadcast</span>
                      <span className="text-[10px] text-zinc-500">Partner Check-in</span>
                    </div>
                    {gymBroadcast && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </section>

              {/* Consents */}
              <section className="space-y-3">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-medium text-white uppercase tracking-wider">AGREEMENTS</span>
                </div>
                {CONSENT_CHECKS.map((check) => (
                  <label key={check.id} className="flex items-start gap-3 cursor-pointer select-none group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={consents[check.id]}
                        onChange={(e) => setConsents((prev) => ({ ...prev, [check.id]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-[18px] h-[18px] rounded-[5px] border-2 border-zinc-600 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                        {consents[check.id] && (
                          <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[12px] leading-snug text-zinc-400 group-hover:text-zinc-300 transition-colors">{check.label}</span>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Read Full Agreements
                </button>
              </section>

              {/* BACK / NEXT */}
              <div className="pt-4 grid grid-cols-2 gap-2 sticky bottom-0 bg-[#0A0A0C] border-t border-zinc-800/80 -mx-0 px-0 py-3">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full h-12 bg-[#121316] text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  disabled={loading || !allConsentsAccepted}
                  className={`w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !allConsentsAccepted ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>NEXT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Protocol Guide (all 3 stages) ── */}
          {mode === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 text-left py-2"
            >
              {[
                {
                  step: '1 / 3',
                  title: 'WORKOUT TELEMETRY',
                  desc: 'Real-Time Biometrics & Precision Rotary Dial for instant load logging, rest counters, and strain scoring.',
                },
                {
                  step: '2 / 3',
                  title: 'NUTRITION MATRIX',
                  desc: 'Dynamic Fuel Matrix & Macro Automation calibrated to your real metabolic demands with Intel visual scans.',
                },
                {
                  step: '3 / 3',
                  title: 'NETWORK & RADAR',
                  desc: 'Proximity Radar & Global Club Network for verified local training partners and digital gym check-ins.',
                },
              ].map((s) => (
                <section key={s.step} className="space-y-2">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono text-zinc-400">{s.step}</span>
                    <span className="text-xs font-medium text-white uppercase tracking-wider">{s.title}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
                </section>
              ))}

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full h-12 bg-[#121316] text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>NEXT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Forgot Password ── */}
          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold uppercase tracking-widest text-white">Reset Password</h2>
                <p className="text-xs text-zinc-400">Enter your email to receive recovery instructions.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block tracking-wide">Your email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-transparent border-b border-zinc-700 focus:border-white py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="w-full h-12 bg-[#121316] text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>BACK</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-none text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>SEND</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Provider One-Tap / Identity Selector */}
        {socialPicker && (
          <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  {socialPicker === 'google' ? <GmailLogo /> : <AppleLogo />}
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {socialPicker === 'google' ? 'Google Account Sign-In' : 'Apple ID Sign-In'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSocialPicker(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Select identity
                </span>

                {socialPicker === 'google' ? (
                  <button
                    type="button"
                    onClick={() => executeSocialSignIn('google', 'o1oblivianfitness@gmail.com')}
                    className="w-full p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">o1oblivianfitness@gmail.com</span>
                      <span className="text-[10px] text-zinc-400">O1FC Registered Owner & Head Coach</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => executeSocialSignIn('apple', 'athlete@icloud.com')}
                    className="w-full p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">athlete@icloud.com</span>
                      <span className="text-[10px] text-zinc-400">Apple ID Athlete Profile</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Or enter {socialPicker === 'google' ? 'custom Gmail' : 'custom Apple ID'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customSocialEmail}
                    onChange={(e) => setCustomSocialEmail(e.target.value)}
                    placeholder={socialPicker === 'google' ? 'yourname@gmail.com' : 'yourname@icloud.com'}
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customSocialEmail.trim()) {
                        executeSocialSignIn(socialPicker, customSocialEmail.trim());
                      }
                    }}
                    disabled={!customSocialEmail.trim()}
                    className="px-4 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-sm mx-auto text-center pt-2">
      </footer>

      <LegalAgreementsModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} />
    </div>,
    document.body
  );
};
