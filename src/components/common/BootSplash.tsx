import React from 'react';
import { Loader2 } from 'lucide-react';

/** Plain black holding screen while the app asks Supabase whether anyone is signed in. */
export const BootSplash: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Starting"
    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black text-o1-muted"
  >
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);
