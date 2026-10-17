import React from 'react';
import { flushSync, useSyncStatus } from '../../services/syncOutbox';

/** Online changes normally land within seconds; only a backlog older than this is worth showing. */
const STALE_MS = 30_000;

export const BasementOfflineBanner: React.FC = () => {
  const { online, pending, oldestAt, syncing } = useSyncStatus();
  const changes = `${pending} change${pending === 1 ? '' : 's'}`;

  if (!online) {
    return (
      <aside
        aria-label="Offline status"
        className="w-full bg-o1-well border-b border-white/[0.07] px-3 py-1.5 flex items-center gap-2 text-[11px] text-o1-muted select-none z-40"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span className="truncate">
          Offline. Saved on this phone{pending > 0 ? ` · ${changes} to back up` : ''}
        </span>
      </aside>
    );
  }

  if (pending > 0 && oldestAt !== null && Date.now() - oldestAt > STALE_MS) {
    return (
      <aside
        aria-label="Backup status"
        className="w-full bg-o1-well border-b border-white/[0.07] px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] text-o1-muted select-none z-40"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="truncate">
            {syncing ? 'Backing up…' : `${changes} waiting to back up`}
          </span>
        </span>
        {!syncing && (
          <button
            type="button"
            onClick={() => void flushSync()}
            className="shrink-0 px-2.5 py-0.5 rounded-full border border-white/[0.14] text-o1-text text-[11px]"
          >
            Retry
          </button>
        )}
      </aside>
    );
  }

  return null;
};
