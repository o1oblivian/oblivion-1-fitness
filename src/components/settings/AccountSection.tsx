import React, { useState } from 'react';
import { Loader2, Trash2, Download, Check } from 'lucide-react';
import { SectionHeader, SettingsGroup, SettingsRow } from './SettingsShared';
import { purgeAllUserData } from '@/utils/accountDeletion';

interface Props {
  userEmail?: string;
  onLogout?: () => void;
  onDeleteAccount?: (email: string) => void;
  onRerunLaunchProtocol?: () => void;
  triggerToast?: (msg: string) => void;
}

export function AccountSection({ userEmail, onLogout, onDeleteAccount, onRerunLaunchProtocol, triggerToast }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        userEmail: userEmail || 'athlete@o1fc.app',
        storage: {},
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const raw = localStorage.getItem(key);
            exportPayload.storage[key] = raw ? JSON.parse(raw) : raw;
          } catch {
            exportPayload.storage[key] = localStorage.getItem(key);
          }
        }
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `O1FC_Athlete_Data_Archive_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast?.('Athlete archive exported successfully.');
    } catch {
      triggerToast?.('Failed to export data archive.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!userEmail) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await purgeAllUserData(userEmail);
      onDeleteAccount?.(userEmail);
    } catch {
      setDeleteError('Something went wrong. Please try again.');
    }
    setIsDeleting(false);
  };

  return (
    <div>
      <SectionHeader title="Account" />
      <SettingsGroup>
        {userEmail && (
          <div className="min-h-[52px] px-3.5 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider block">
              Signed in as
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block truncate">
              {userEmail}
            </span>
          </div>
        )}

        {onRerunLaunchProtocol && (
          <SettingsRow
            label="Launch Protocol"
            sublabel="Re-customize athlete discipline & profile onboarding"
            onClick={onRerunLaunchProtocol}
          />
        )}

        {onLogout && (
          <SettingsRow
            label="Log out"
            onClick={onLogout}
          />
        )}

        <SettingsRow
          label={isExporting ? "Preparing Archive..." : "Export My Data Archive"}
          sublabel="Download full JSON export of all workouts, logs and profile telemetry (GDPR / CCPA)"
          onClick={handleExportData}
        />

        <SettingsRow
          label="Delete Account & Purge Data"
          sublabel="Permanently erase all workouts, logs and profile data"
          destructive
          onClick={() => setShowDeleteConfirm(true)}
        />
      </SettingsGroup>

      {/* Delete Confirmation Sheet */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[400] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="w-full max-w-sm bg-zinc-50 dark:bg-zinc-950 rounded-t-[1.5rem] sm:rounded-2xl p-4 shadow-2xl border-t sm:border border-zinc-200/80 dark:border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#C4121A]/10 dark:bg-[#D91F28]/10 flex items-center justify-center text-[#C4121A] dark:text-[#D91F28]">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Delete Account?</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This action is permanent. All your workout history, telemetry logs, and personal settings will be permanently erased.
            </p>
            {deleteError && (
              <p className="text-xs text-[#C4121A] dark:text-[#D91F28] mt-2 font-medium">{deleteError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-[#C4121A] dark:bg-[#D91F28] text-white text-xs font-semibold hover:bg-[#B8121A] dark:hover:bg-[#C4121A] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
