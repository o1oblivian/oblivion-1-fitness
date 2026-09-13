import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';

export const AppRoot: React.FC = () => {
  useEffect(() => {
    // 3. In the root useEffect of App:
    // When running on native mobile (Capacitor.isNativePlatform()):
    if (Capacitor.isNativePlatform()) {
      const listenerPromise = App.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('auth/callback')) {
          try {
            await Browser.close();
          } catch (e) {
            // browser already closed
          }
          const hash = url.split('#')[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      });

      return () => {
        listenerPromise.then(handler => handler.remove()).catch(() => {});
      };
    }
  }, []);

  return null;
};

export default AppRoot;
export { AppRoot as App };
