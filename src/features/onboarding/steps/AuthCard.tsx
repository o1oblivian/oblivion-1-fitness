import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { ACCOUNT_EXISTS, EMAIL_NOT_CONFIRMED, useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';
import {
  AUTH_ERROR_EVENT,
  resendSignupEmail,
  sendPasswordReset,
  startAppleOAuth,
  takeAuthCallbackError,
} from '../../../services/oauthDeepLink';
import {
  appleSignInAvailable,
  hasNativeAppleSignIn,
  nativeAppleSignIn,
} from '../../../services/nativeSocialSignIn';
import { OnboardingData } from '../types/onboardingTypes';
import {
  applyRememberPreference,
  loadRememberedCredentials,
} from '../../../utils/rememberCredentials';

interface AuthCardProps {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

type View = 'form' | 'reset' | 'confirm';
type Mode = 'signin' | 'signup';

const MIN_PASSWORD = 8;
const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

const fieldClass =
  'o1-auth-field h-11 w-full rounded-xl border-0 bg-o1-surface/60 px-3.5 text-[14px] font-normal text-o1-text placeholder:text-[#5E5C55] outline-none transition-colors focus:bg-white/[0.08] focus:ring-1 focus:ring-o1-crimson/60';

function cleanEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(value));
}

export const AuthCard: React.FC<AuthCardProps> = ({ data, onUpdate, onNext, onOpenLegal }) => {
  const [remembered] = useState(loadRememberedCredentials);
  const [email, setEmail] = useState(remembered.email || data.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'apple' | 'reset' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(takeAuthCallbackError);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(data.isSignUp ? 'signup' : 'signin');
  const [view, setView] = useState<View>('form');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const onAuthError = () => {
      const message = takeAuthCallbackError();
      if (!message) return;
      setBusy(null);
      setError(message);
    };
    window.addEventListener(AUTH_ERROR_EVENT, onAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, onAuthError);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const go = (next: View) => {
    tactileEngine.triggerSelectionBuzz();
    setError(null);
    setNotice(null);
    setView(next);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    tactileEngine.triggerSelectionBuzz();
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const signInWithApple = async () => {
    setError(null);
    setBusy('apple');
    tactileEngine.triggerDialHaptic();
    try {
      if (hasNativeAppleSignIn()) {
        if (await nativeAppleSignIn()) {
          onUpdate({ isSignUp: mode === 'signup' });
          onNext();
        }
        return;
      }
      await startAppleOAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open Apple sign-in.');
    } finally {
      setBusy(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = cleanEmail(email);
    if (!validEmail(address)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    setError(null);
    setBusy('email');
    tactileEngine.triggerDialHaptic();
    const store = useAuthStore.getState();
    const res =
      mode === 'signup'
        ? await store.signUp(address, password)
        : await store.signIn(address, password);
    setBusy(null);
    if (!res.success) {
      if (res.error === EMAIL_NOT_CONFIRMED) {
        setPassword('');
        setView('confirm');
        setNotice('Your email is not confirmed yet. Open the link we sent, or resend it below.');
        return;
      }
      if (res.error === ACCOUNT_EXISTS) {
        setMode('signin');
        setPassword('');
        setNotice(ACCOUNT_EXISTS);
        return;
      }
      setError(res.error || 'Something went wrong. Try again.');
      return;
    }
    applyRememberPreference(true, address);
    onUpdate({ email: address, isSignUp: mode === 'signup', rememberMe: true });
    if ('needsConfirmation' in res && res.needsConfirmation) {
      setPassword('');
      setResendIn(30);
      setView('confirm');
      return;
    }
    onNext();
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = cleanEmail(email);
    if (!validEmail(address)) {
      setError('Enter the email you signed up with.');
      return;
    }
    setError(null);
    setBusy('reset');
    try {
      await sendPasswordReset(address);
      setNotice(
        `If an account exists for ${address}, a reset link is on its way. Open it on this device to choose a new password.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    setError(null);
    setBusy('resend');
    try {
      await resendSignupEmail(cleanEmail(email));
      setNotice('A fresh confirmation link has been sent.');
      setResendIn(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the email.');
    } finally {
      setBusy(null);
    }
  };

  const messages = (
    <>
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-o1-bad-wash/60 backdrop-blur-md px-3.5 py-2.5 text-[12px] font-normal leading-snug text-o1-bad-ink"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 backdrop-blur-md text-[12px] font-normal leading-snug text-o1-text"
        >
          {notice}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none text-o1-text animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center">
        <img
          src="/brand/o1fc-hero.png"
          alt="Oblivion 1 Fitness Club"
          width={1466}
          height={900}
          className="h-auto w-[70%] max-w-[250px] select-none"
          draggable={false}
        />
        <h1 className="mt-3 font-display text-[23px] font-light leading-tight tracking-[-0.01em] text-o1-text">
          {view === 'reset'
            ? 'Reset your password'
            : view === 'confirm'
              ? 'Confirm your email'
              : mode === 'signin'
                ? 'Welcome back'
                : 'Create your membership'}
        </h1>
        {view !== 'form' ? (
          <p className="mt-1.5 max-w-[280px] text-[13px] font-normal leading-relaxed text-o1-muted/80">
            {view === 'reset'
              ? 'We will email you a secure link to choose a new password.'
              : `We sent a link to ${cleanEmail(email)}. Open it on this phone to activate your account.`}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        {view === 'form' ? (
          <>
            <div
              role="tablist"
              aria-label="Account"
              className="grid grid-cols-2 rounded-full bg-o1-surface/60 p-0.5"
            >
              {(['signin', 'signup'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => switchMode(key)}
                  className={`h-8 rounded-full text-[13px] font-normal transition-colors ${mode === key ? 'bg-white/[0.1] text-o1-text' : 'text-o1-muted'}`}
                >
                  {key === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {appleSignInAvailable() && (
              <>
                <div className="mt-4 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => void signInWithApple()}
                    disabled={busy !== null}
                    style={{ fontFamily: SYSTEM_FONT }}
                    className="flex h-11 w-full items-center justify-center gap-2 o1-machined o1-see-through rounded-full text-[15px] font-normal text-[#FFFFFF] transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {busy === 'apple' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg
                        className="h-[18px] w-[18px] shrink-0 -translate-y-px fill-[#FFFFFF]"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8.92-2.85-.92.04-2.02.62-2.67 1.38-.58.67-.99 1.73-.87 2.76 1.02.08 2.01-.54 2.62-1.29z" />
                      </svg>
                    )}
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div className="my-4 h-[0.5px] bg-white/[0.1]" />
              </>
            )}

            <form onSubmit={submit} noValidate className="space-y-2.5">
              <label className="block">
                <input
                  aria-label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  placeholder="Email"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className="relative block">
                  <input
                    aria-label="Password"
                    placeholder={
                      mode === 'signup' ? `Password (${MIN_PASSWORD}+ characters)` : 'Password'
                    }
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError(null);
                    }}
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-o1-muted"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </span>
              </label>

              {mode === 'signin' ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => go('reset')}
                    className="h-8 text-[12px] font-normal text-o1-muted"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              {messages}

              <button
                type="submit"
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center rounded-full bg-o1-crimson text-[14px] font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press disabled:opacity-60"
              >
                {busy === 'email' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </>
        ) : null}

        {view === 'reset' ? (
          <form onSubmit={requestReset} noValidate className="space-y-4">
            <label className="block">
              <input
                aria-label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder="Email"
                className={fieldClass}
              />
            </label>
            {messages}
            <button
              type="submit"
              disabled={busy !== null}
              className="flex h-11 w-full items-center justify-center rounded-full bg-o1-crimson text-[14px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy === 'reset' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => go('form')}
              className="flex h-11 w-full items-center justify-center gap-2 text-[14px] font-normal text-o1-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </form>
        ) : null}

        {view === 'confirm' ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] backdrop-blur-md">
                <MailCheck className="h-6 w-6 text-o1-text" />
              </span>
            </div>
            {messages}
            <button
              type="button"
              onClick={() => void resend()}
              disabled={busy !== null || resendIn > 0}
              className="flex h-11 w-full items-center justify-center rounded-full bg-white/[0.08] text-[14px] backdrop-blur-md font-normal text-o1-text transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy === 'resend' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : resendIn > 0 ? (
                `Resend email in ${resendIn}s`
              ) : (
                'Resend email'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                go('form');
              }}
              className="flex h-11 w-full items-center justify-center rounded-full bg-o1-crimson text-[14px] font-medium text-white transition active:scale-[0.98]"
            >
              I confirmed, sign in
            </button>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-o1-muted/80">
        By continuing you agree to our{' '}
        <button
          type="button"
          onClick={() => onOpenLegal('terms')}
          className="font-normal text-o1-muted underline decoration-white/25 underline-offset-2"
        >
          Terms
        </button>{' '}
        and{' '}
        <button
          type="button"
          onClick={() => onOpenLegal('privacy')}
          className="font-normal text-o1-muted underline decoration-white/25 underline-offset-2"
        >
          Privacy Policy
        </button>
        .
      </p>
    </div>
  );
};
