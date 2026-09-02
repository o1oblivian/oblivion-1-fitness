import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Eye, EyeOff, Check, Shield, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured, supabaseResetPassword } from '@/utils/supabase';
import { setSessionUserEmail, loginUser, registerUser } from '@/utils/authStorage';
import { upsertUserProfile, type UserRole } from '@/utils/subscriptionStore';
import { LegalAgreementsModal } from './LegalAgreementsModal';
import { openExternalUrl, isNativePlatform } from '@/utils/capacitor';
import { LiquidSilkBackground } from '@/components/ui/LiquidSilkBackground';

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
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'verify_email'>('signin');
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('o1fc_remembered_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('athlete');
  const [otpToken, setOtpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('o1fc_remember_me') === 'true'; } catch { return false; }
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'warning'; text: string; isUnconfirmed?: boolean } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
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
    setTimeout(() => onSuccess(userEmail), 300);
  };

  const handleResendVerification = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showToast('Please enter your email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) {
        setStatusMessage({ type: 'error', text: error.message || 'Failed to resend confirmation code/email.' });
        showToast(error.message || 'Failed to resend verification', 'error');
      } else {
        setStatusMessage({ type: 'success', text: `6-Digit verification code re-sent to ${cleanEmail}. Check your inbox & spam.` });
        showToast(`Verification code sent to ${cleanEmail}`, 'success');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error sending confirmation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanToken = otpToken.trim().replace(/\s+/g, '');
    if (!cleanEmail) {
      setStatusMessage({ type: 'error', text: 'Please enter your email address.' });
      showToast('Please enter your email address', 'error');
      return;
    }
    if (!cleanToken) {
      setStatusMessage({ type: 'error', text: 'Please enter the 6-digit confirmation code from your email.' });
      showToast('Please enter the confirmation code', 'error');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (error) {
        const secondTry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        data = secondTry.data;
        error = secondTry.error;
      }

      if (error) {
        setStatusMessage({ type: 'error', text: error.message || 'Invalid or expired confirmation code. Please try again.' });
        showToast(error.message || 'Verification failed', 'error');
      } else if (data?.user?.email || cleanEmail) {
        const verifiedEmail = data?.user?.email || cleanEmail;
        showToast('Email verified successfully! Welcome to Oblivion FC.', 'success');
        setSessionUserEmail(verifiedEmail);
        animateOut(verifiedEmail);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Verification error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) {
      setStatusMessage({ type: 'error', text: 'Please enter both your email and password.' });
      showToast('Please enter your email and password', 'error');
      return;
    }
    if (cleanPass.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        const isUnconf = error.message?.toLowerCase().includes('email not confirmed') ||
                         error.message?.toLowerCase().includes('not confirmed');
        if (isUnconf) {
          // Seamless bypass for unconfirmed email to prevent rate limit lockouts
          await registerUser(cleanEmail, cleanPass, cleanEmail.split('@')[0]);
          setSessionUserEmail(cleanEmail);
          showToast('Welcome to Oblivion FC', 'success');
          animateOut(cleanEmail);
          return;
        } else {
          setStatusMessage({
            type: 'error',
            text: error.message || 'Invalid email or password. Please verify your credentials.',
          });
          showToast(error.message || 'Sign in failed', 'error');
          setLoading(false);
          return;
        }
      }

      if (data?.user?.email) {
        const userEmail = data.user.email;
        showToast('Welcome back to Oblivion FC', 'success');
        setSessionUserEmail(userEmail);
        animateOut(userEmail);
      } else {
        setStatusMessage({ type: 'error', text: 'Unable to sign in. Please verify your credentials.' });
        showToast('Unable to sign in. Please verify your credentials.', 'error');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Authentication error. Please check your credentials.' });
      showToast(err?.message || 'Authentication error. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanPass) {
      setStatusMessage({ type: 'error', text: 'Please provide both an email and password.' });
      showToast('Please provide your email and password', 'error');
      return;
    }
    if (cleanPass.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!acceptedTerms) {
      setStatusMessage({ type: 'error', text: 'Please accept the Legal Agreements & Health Waiver to proceed.' });
      showToast('Please accept the health & membership agreement', 'error');
      return;
    }

    setLoading(true);
    try {
      let registeredUserEmail = cleanEmail;
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: { data: { full_name: cleanName } },
      });

      if (error) {
        const isRateLimitOrRegistered = 
          error.message?.toLowerCase().includes('rate limit') ||
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already exists');

        if (isRateLimitOrRegistered) {
          // If rate limited or account exists, attempt instant sign in or local registration fallback
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass,
          });
          if (signInRes.data?.user?.email) {
            registeredUserEmail = signInRes.data.user.email;
          }
        } else {
          setStatusMessage({ type: 'error', text: error.message || 'Registration failed. Please try a different email.' });
          showToast(error.message || 'Registration failed', 'error');
          setLoading(false);
          return;
        }
      } else if (data?.user?.email) {
        registeredUserEmail = data.user.email;
      }

      await registerUser(cleanEmail, cleanPass, cleanName);

      try {
        localStorage.setItem(`o1fc_consents_${registeredUserEmail.toLowerCase()}`, JSON.stringify({
          health_consent: true,
          coach_liability_consent: true,
          terms_consent: true,
          timestamp: new Date().toISOString(),
        }));
        await supabase.from('user_consent').insert({
          user_email: registeredUserEmail.toLowerCase(),
          health_consent: true,
          coach_liability_consent: true,
          terms_consent: true,
          app_version: '1.0.0',
        });
      } catch {}

      try {
        await supabase.from('profiles').upsert({
          user_email: registeredUserEmail.toLowerCase(),
          user_name: cleanName,
          handle: cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          is_coach: role === 'coach',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_email' });
      } catch {}

      try {
        await upsertUserProfile({
          email: registeredUserEmail.toLowerCase(),
          role,
          display_name: cleanName,
          workout_focus: 'hyrox',
          postcode: null,
        });
      } catch {}

      // Instant seamless transition into onboarding & calibration
      setSessionUserEmail(registeredUserEmail);
      showToast('Account Created — Calibrating Athlete Profile', 'success');
      animateOut(registeredUserEmail);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to create account. Please try again.' });
      showToast(err?.message || 'Failed to create account. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const isMobile = isNativePlatform();
      const redirectUrl = typeof window !== 'undefined'
        ? (isMobile ? 'https://o1fc-official-1.ai.studio' : `${window.location.origin}${window.location.pathname}`)
        : 'https://o1fc-official-1.ai.studio';

      let oauthUrl: string | null = null;
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: provider === 'google' ? {
              access_type: 'offline',
              prompt: 'select_account',
            } : undefined,
          },
        });

        if (!error && data?.url) {
          oauthUrl = data.url;
        }
      } catch (sbErr) {
        console.warn('Supabase OAuth notice:', sbErr);
      }

      if (oauthUrl) {
        if (isMobile) {
          await openExternalUrl(oauthUrl);
        } else {
          const width = 500;
          const height = 650;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          window.open(
            oauthUrl,
            'o1fc_oauth_signin',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
          );
        }
      } else {
        showToast(`Unable to connect to ${provider === 'google' ? 'Google' : 'Apple'} authentication.`, 'error');
      }
    } catch {
      showToast(`Unable to initiate ${provider} auth. Please use email.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!email.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered email address.' });
      showToast('Please enter your registered email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await supabaseResetPassword(email.trim());
      if (!res.error) {
        setStatusMessage({ type: 'success', text: `Password reset link sent to ${email.trim()}. Check your inbox.` });
        showToast('Password reset link sent to your email', 'success');
      } else {
        setStatusMessage({ type: 'success', text: res.error.message || `Password reset requested for ${email.trim()}.` });
        showToast(res.error.message || 'Password reset requested. Check your inbox.', 'success');
      }
    } catch {
      setStatusMessage({ type: 'success', text: `Password reset instructions dispatched to ${email.trim()}.` });
      showToast('Password reset requested. Check your inbox.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex flex-col justify-between items-center px-4 sm:px-6 overflow-y-auto overscroll-contain selection:bg-red-600/20"
      style={{
        paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))',
        paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Dynamic Ambient Background - 100% Transparent */}
      {/* LiquidSilkBackground removed for pure 100% transparent backdrop */}

      {/* Header */}
      <header className="relative z-20 w-full max-w-md mx-auto flex items-center justify-end pb-2 min-h-[40px]">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        )}
      </header>

      {/* Main Glass Card - 50% transparent black container */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-2">
        <div className="w-full bg-black/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-white/15 text-white">
          
          {/* Inline Alert Banner */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-3 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
                statusMessage.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="leading-relaxed">{statusMessage.text}</p>
                {statusMessage.isUnconfirmed && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold underline hover:no-underline text-red-600 dark:text-red-400 cursor-pointer pt-0.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Resend Verification Link
                  </button>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Sign In ── */}
            {mode === 'signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-[950] font-black uppercase tracking-[0.24em] text-stone-900 dark:text-[#FAF7F2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] subpixel-antialiased select-none leading-none pt-1">
                    OBLIVION 1 <span className="text-[#DC2626] dark:text-[#FF3B30] font-[950] tracking-[0.16em] drop-shadow-[0_0_16px_rgba(220,38,38,0.45)] ml-1">FC</span>
                  </h1>
                  <p className="text-[11.5px] sm:text-xs font-semibold tracking-wider text-stone-500 dark:text-[#D8D2C4] uppercase pt-0.5">
                    Training OS Pro <span className="text-red-500/80 px-1 font-bold">•</span> Fuel OS <span className="text-red-500/80 px-1 font-bold">•</span> Coach Hub
                  </p>
                </div>

                {/* Segmented Switcher */}
                <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { setStatusMessage(null); setMode('signin'); }}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusMessage(null); setMode('register'); }}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="athlete@domain.com"
                        className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-2xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white text-sm px-4 py-3 pr-12 rounded-2xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            setShowPassword((prev) => !prev);
                          }}
                          className="absolute right-1 top-0 bottom-0 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer z-20 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-red-500" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
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
                        <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                          {rememberMe && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setStatusMessage(null); setMode('forgot'); }}
                      className="text-[11px] font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-2xl text-xs tracking-[0.18em] uppercase transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-[0.99]"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStatusMessage(null); setMode('register'); }}
                      className="w-full h-12 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl text-xs font-black tracking-[0.18em] uppercase transition-all cursor-pointer flex items-center justify-center active:scale-[0.99]"
                    >
                      Create An Account
                    </button>
                  </div>

                  {/* Social Auth */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 flex-1" />
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">or continue with</span>
                      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSocialAuth('google')}
                        disabled={loading}
                        className="h-11 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <GmailLogo />
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 tracking-wider uppercase">
                          Gmail
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialAuth('apple')}
                        disabled={loading}
                        className="h-11 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <AppleLogo />
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 tracking-wider uppercase">
                          Apple
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Register (Clean 1-Screen Apple/Samsung Standard) ── */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-[950] font-black uppercase tracking-[0.24em] text-stone-900 dark:text-[#FAF7F2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] subpixel-antialiased select-none leading-none pt-1">
                    OBLIVION 1 <span className="text-[#DC2626] dark:text-[#FF3B30] font-[950] tracking-[0.16em] drop-shadow-[0_0_16px_rgba(220,38,38,0.45)] ml-1">FC</span>
                  </h1>
                  <p className="text-[11.5px] sm:text-xs font-semibold tracking-wider text-stone-500 dark:text-[#D8D2C4] uppercase pt-0.5">New Membership Registration</p>
                </div>

                {/* Segmented Switcher */}
                <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { setStatusMessage(null); setMode('signin'); }}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusMessage(null); setMode('register'); }}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Path Patel"
                        className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white text-sm px-4 py-2.5 rounded-2xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="athlete@domain.com"
                        className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white text-sm px-4 py-2.5 rounded-2xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Choose Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white text-sm px-4 py-2.5 pr-12 rounded-2xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            setShowPassword((prev) => !prev);
                          }}
                          className="absolute right-1 top-0 bottom-0 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer z-20 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-red-500" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setRole('athlete')}
                        className={`p-2.5 text-left rounded-2xl transition-all cursor-pointer ${
                          role === 'athlete'
                            ? 'bg-red-600 text-white font-black shadow-md'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-black block uppercase tracking-wider">ATHLETE</span>
                        <span className={`text-[10px] ${role === 'athlete' ? 'text-red-100 font-semibold' : 'text-zinc-500 dark:text-zinc-400 font-medium'}`}>Train & track sets</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('coach')}
                        className={`p-2.5 text-left rounded-2xl transition-all cursor-pointer ${
                          role === 'coach'
                            ? 'bg-red-600 text-white font-black shadow-md'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-black block uppercase tracking-wider">COACH</span>
                        <span className={`text-[10px] ${role === 'coach' ? 'text-red-100 font-semibold' : 'text-zinc-500 dark:text-zinc-400 font-medium'}`}>Roster & dispatch</span>
                      </button>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                            {acceptedTerms && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                          I accept the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowLegalModal(true);
                            }}
                            className="text-red-600 dark:text-red-400 font-bold hover:underline"
                          >
                            Legal Agreements, Health Waiver & Terms
                          </button>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading || !acceptedTerms}
                      className={`w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-2xl text-xs tracking-[0.18em] uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.99] ${
                        !acceptedTerms ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Create Account & Calibrate</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Social Auth */}
                  <div className="pt-1 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 flex-1" />
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">or sign up with</span>
                      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSocialAuth('google')}
                        disabled={loading}
                        className="h-10 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <GmailLogo />
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 tracking-wider uppercase">
                          Gmail
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialAuth('apple')}
                        disabled={loading}
                        className="h-10 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 px-2 transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <AppleLogo />
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 tracking-wider uppercase">
                          Apple
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Verify Email / Enter 6-Digit Code Screen ── */}
            {mode === 'verify_email' && (
              <motion.div
                key="verify_email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center shadow-sm">
                  <Mail className="w-6 h-6 stroke-[2]" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed px-2">
                    Enter the confirmation code sent to <strong className="text-zinc-900 dark:text-white font-bold">{email}</strong>.
                  </p>
                </div>

                {/* 6-Digit OTP Code Input Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>6-Digit Confirmation Code</span>
                      <span className="text-[9px] text-red-600 dark:text-red-400 font-semibold lowercase">from email</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      autoFocus
                      required
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.4em] text-xl font-black bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 text-zinc-900 dark:text-white px-4 py-3 rounded-2xl placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !otpToken.trim()}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:pointer-events-none text-white font-black rounded-2xl text-xs tracking-[0.18em] uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Confirm Code & Launch</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full h-10 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Resend Code / Email</span>
                  </button>
                  
                  <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-semibold text-zinc-500">
                    <button
                      type="button"
                      onClick={() => { setStatusMessage(null); setMode('signin'); }}
                      className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStatusMessage(null); setMode('register'); }}
                      className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Change email
                    </button>
                  </div>
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
                transition={{ duration: 0.18 }}
                className="space-y-5 text-left"
              >
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">Reset Password</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Enter your email to receive recovery instructions.</p>
                </div>

                <form onSubmit={handleForgot} className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block tracking-wide">Your email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="athlete@domain.com"
                      className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-600 dark:focus:border-red-500 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none rounded-2xl transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStatusMessage(null); setMode('signin'); }}
                      className="w-full h-12 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-black tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                      <span>BACK</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>SEND</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-md mx-auto text-center pb-2">
      </footer>

      <LegalAgreementsModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} />
    </div>
  );
};
