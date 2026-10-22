import React, { useState } from 'react';
import { AlertTriangle, Download, LogOut, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { flushSync, useSyncStatus } from '../../services/syncOutbox';
import { safeStorage } from '../../utils/safeStorage';

interface FooterActionsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  onExportData: () => Promise<void>;
}

export const SettingsFooterSection: React.FC<FooterActionsProps> = ({
  onLogout,
  onDeleteAccount,
  onExportData,
}) => {
  const { pending, online, syncing } = useSyncStatus();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const activeEmail = safeStorage.getItem<string>('o1fc_user_email', '') || 'Signed in';
  const changes = `${pending} unsynced ${pending === 1 ? 'change' : 'changes'}`;

  return (
    <div className="space-y-2 pt-1 pb-4 select-none">
      {pending > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-o1-crimson/50 bg-o1-crimson/10 p-3 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-o1-crimson shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">{changes} on this phone</p>
            <p className="text-o1-label text-o1-stone leading-snug">
              Do not sign out or uninstall the app until they are backed up.
              {!online && ' Connect to the internet to back them up.'}
            </p>
          </div>
          {online && (
            <button
              type="button"
              disabled={syncing}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                void flushSync();
              }}
              className="shrink-0 text-o1-label font-semibold text-white underline disabled:opacity-50 cursor-pointer"
            >
              {syncing ? 'Backing up…' : 'Back up now'}
            </button>
          )}
        </div>
      )}
      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xs font-sans font-semibold text-white block">Active session</span>
            <span className="text-o1-label font-sans text-o1-muted block truncate">
              {activeEmail}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-o1-label font-sans text-o1-muted shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-o1-ok" />
            Secured
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              void onExportData();
            }}
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-well text-o1-ink-soft text-xs font-sans font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-o1-muted" />
            <span>Export my data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              if (pending > 0) setConfirmSignOut(true);
              else onLogout();
            }}
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-well text-o1-ink-soft text-xs font-sans font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-o1-muted" />
            <span>Sign out</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onDeleteAccount();
            }}
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-o1-crimson/40 bg-transparent text-o1-crimson text-xs font-sans font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete account</span>
          </button>
        </div>
      </div>

      {confirmSignOut && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="unsynced-signout-title"
          className="fixed inset-0 z-[80000] bg-black/85 o1-sheet-scrim flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[360px] rounded-2xl bg-o1-sheet border border-white/[0.07] p-4 space-y-3">
            <h3 id="unsynced-signout-title" className="text-sm font-semibold text-white">
              Unsynced data on this phone
            </h3>
            <p className="text-xs text-o1-stone leading-relaxed">
              {pending > 0
                ? `${changes} ${pending === 1 ? 'has' : 'have'} not reached your account yet. Signing out deletes ${pending === 1 ? 'it' : 'them'} from this phone for good.`
                : 'Everything is backed up. You can sign out safely.'}
            </p>
            <div className="flex flex-col gap-2">
              {pending > 0 && online && (
                <button
                  type="button"
                  disabled={syncing}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    void flushSync();
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-o1-pure text-o1-surface text-xs font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {syncing ? 'Backing up…' : 'Back up now'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setConfirmSignOut(false);
                  onLogout();
                }}
                className={`w-full min-h-[44px] rounded-xl text-xs font-semibold cursor-pointer ${
                  pending > 0
                    ? 'border border-o1-crimson/50 text-o1-crimson bg-transparent'
                    : 'bg-o1-pure text-o1-surface'
                }`}
              >
                {pending > 0 ? 'Sign out anyway' : 'Sign out'}
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setConfirmSignOut(false);
                }}
                className="w-full min-h-[44px] rounded-xl border border-white/[0.07] text-o1-ink-soft text-xs font-semibold cursor-pointer"
              >
                Wait
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
