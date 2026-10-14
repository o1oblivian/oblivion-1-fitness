import { supabase } from './services/supabaseClient';
import { claimDeviceAtBoot, claimDeviceForUser } from './services/accountScope';

claimDeviceAtBoot();

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) claimDeviceForUser(session.user);
});
