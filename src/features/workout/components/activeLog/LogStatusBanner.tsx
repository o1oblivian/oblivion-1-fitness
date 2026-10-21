import React from 'react';
import { X } from 'lucide-react';

export type BackupState = 'pending' | 'saved' | 'signed-out' | 'queued';

export interface LogStatus {
  kind: 'saved' | 'info' | 'warn';
  text: string;
  backup?: BackupState;
  routineDay?: string;
}

const BACKUP_TEXT: Record<BackupState, string> = {
  pending: 'Backing up to your account…',
  saved: 'Backed up to your account.',
  'signed-out': 'Saved on this device. Sign in to back it up.',
  queued: 'Saved on this device. Backup retries automatically.',
};

const STATUS_DOT: Record<LogStatus['kind'], string> = {
  saved: 'bg-o1-emerald',
  info: 'bg-o1-sky',
  warn: 'bg-o1-amber',
};

interface LogStatusBannerProps {
  status: LogStatus;
  onDismiss: () => void;
}

/** The note under the Active log header: what just happened, and whether the backup finished. */
export const LogStatusBanner: React.FC<LogStatusBannerProps> = ({ status, onDismiss }) => (
  <div
    role="status"
    className="flex items-start gap-2.5 rounded-xl bg-o1-well border border-white/[0.07] pl-3 pr-1 py-1.5"
  >
    <span
      aria-hidden
      className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status.kind]}`}
    />
    <div className="min-w-0 flex-1 py-0.5 space-y-0.5">
      <p className="text-o1-caption text-o1-text leading-snug">{status.text}</p>
      {status.routineDay && (
        <p className="text-o1-label text-o1-muted leading-snug">
          Loads again every {status.routineDay}.
        </p>
      )}
      {status.backup && (
        <p
          className={`text-o1-label leading-snug ${status.backup === 'queued' ? 'text-o1-amber' : 'text-o1-muted'}`}
        >
          {BACKUP_TEXT[status.backup]}
        </p>
      )}
    </div>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss"
      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-o1-muted hover:text-o1-text cursor-pointer"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);
