import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabaseClient';
import { claimDeviceForUser } from '../../../services/accountScope';
import { tactileEngine } from '../../../services/tactileEngine';

const MIN_PASSWORD = 8;

let recoveryUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

supabase.auth.onAuthStateChange((event, session) => {
  if (event !== 'PASSWORD_RECOVERY' || !session?.user) return;
  recoveryUser = session.user;
  listeners.forEach((listener) => listener(recoveryUser));
});

export function PasswordRecoverySheet() {
  const [user, setUserState] = useState<User | null>(recoveryUser);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listeners.add(setUserState);
    return () => {
      listeners.delete(setUserState);
    };
  }, []);

  const setUser = (next: User | null) => {
    recoveryUser = next;
    setUserState(next);
  };

  if (!user) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    tactileEngine.playPRCelebration();
    const signedIn = user;
    setUser(null);
    setPassword('');
    claimDeviceForUser({ id: signedIn.id, email: signedIn.email });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <form
        onSubmit={save}
        noValidate
        className="o1-machined w-full max-w-[440px] rounded-t-[28px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-o1-text sm:rounded-[28px]"
      >
        <h2 className="text-o1-heading font-light tracking-[-0.01em]">Choose a new password</h2>
        <p className="mt-1.5 text-o1-body font-normal text-o1-muted">For {user.email}</p>
        <label className="mt-5 block">
          <span className="relative block">
            <input
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              aria-label="New password"
              placeholder={`New password (${MIN_PASSWORD}+ characters)`}
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="h-11 w-full rounded-xl border-0 bg-white/[0.05] px-3.5 pr-12 text-o1-control font-normal outline-none placeholder:text-o1-placeholder focus:bg-white/[0.08] focus:ring-1 focus:ring-o1-crimson/60"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-o1-muted"
            >
              {show ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </span>
        </label>
        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-xl bg-o1-bad-wash/60 px-3.5 py-2.5 text-o1-caption font-normal text-o1-bad-ink"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-o1-crimson text-o1-control font-medium text-white active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save password'}
        </button>
      </form>
    </div>
  );
}
