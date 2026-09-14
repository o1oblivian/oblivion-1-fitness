import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';
import { initializeIAP } from './services/iapService';
import { upsertCurrentUserBuddyProfile } from './services/buddyService';

export const AppRoot: React.FC = () => {
  const [isIAPReady, setIsIAPReady] = useState(false);

  useEffect(() => {
    // Upsert authenticated user buddy profile on startup
    upsertCurrentUserBuddyProfile();

    // Listen to Supabase auth state changes to auto-upsert profile
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        upsertCurrentUserBuddyProfile();
      }
    });

    // 1. Immediately initialize and await RevenueCat on app startup before paywall renders
    if (Capacitor.isNativePlatform()) {
      initializeIAP()
        .then((configured) => {
          if (configured) {
            console.log('RevenueCat initialized on app startup.');
          }
        })
        .catch((err) => {
          console.error('Failed to initialize RevenueCat on startup:', err);
        })
        .finally(() => {
          setIsIAPReady(true);
        });
    } else {
      setIsIAPReady(true);
    }

    // 2. Google OAuth Deep Link Callback listener
    if (Capacitor.isNativePlatform()) {
      const listenerPromise = App.addListener('appUrlOpen', async ({ url }) => {
        if (!url || !url.includes('auth/callback')) return;

        // Immediately call await Browser.close() before exchanging the session
        try {
          await Browser.close();
        } catch {
          // In-app browser might already be dismissed
        }

        try {
          let access_token: string | null = null;
          let refresh_token: string | null = null;
          let code: string | null = null;

          // 1. Parse hash parameters if present (#access_token=...&refresh_token=... or #code=...)
          if (url.includes('#')) {
            const hashPart = url.split('#')[1] || '';
            const hashParams = new URLSearchParams(hashPart);
            access_token = hashParams.get('access_token');
            refresh_token = hashParams.get('refresh_token');
            code = hashParams.get('code');
          }

          // 2. Parse query parameters if tokens or code not found in hash (?code=... or ?access_token=...)
          if (!access_token || !code) {
            const queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
              const queryPart = url.slice(queryIndex + 1).split('#')[0];
              const queryParams = new URLSearchParams(queryPart);
              if (!access_token) access_token = queryParams.get('access_token');
              if (!refresh_token) refresh_token = queryParams.get('refresh_token');
              if (!code) code = queryParams.get('code');
            }
          }

          let authResponse: any = null;

          if (access_token && refresh_token) {
            console.log('Authenticating via deep link access_token/refresh_token...');
            authResponse = await supabase.auth.setSession({ access_token, refresh_token });
          } else if (code) {
            console.log('Exchanging auth code via deep link for session...');
            authResponse = await supabase.auth.exchangeCodeForSession(code);
          }

          const user = authResponse?.data?.user;
          const session = authResponse?.data?.session;

          if (session || user) {
            const email = user?.email || session?.user?.email;
            console.log('Successfully established session for:', email);

            // Dispatch global events to ensure user logs in automatically and modals close
            window.dispatchEvent(
              new CustomEvent('o1fc-auth-success', {
                detail: { user, session, email },
              })
            );
            window.dispatchEvent(
              new CustomEvent('supabase-auth-state-change', {
                detail: { session, user },
              })
            );
          }
        } catch (authErr) {
          console.error('Failed to handle auth/callback deep link:', authErr);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
        listenerPromise.then(handler => handler.remove()).catch(() => {});
      };
    } else {
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  return null;
};

export default AppRoot;
export { AppRoot as App };
