import React from 'react';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface FooterActionsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
}

export const SettingsFooterSection: React.FC<FooterActionsProps> = ({
  onLogout,
  onDeleteAccount,
  onExportData,
}) => {
  const activeEmail =
    (typeof window !== 'undefined' && window.localStorage.getItem('o1fc_user_email')) ||
    'athlete@oblivion1.club';

  return (
    <div className="space-y-3 pt-2 pb-6 select-none">
      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-neutral-800 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block tracking-wider">
              Active Session
            </span>
            <span className="text-xs font-mono text-neutral-900 dark:text-neutral-200 font-semibold block truncate">
              {activeEmail}
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase bg-emerald-50 dark:bg-green-950/60 border border-emerald-200 dark:border-green-800/60 text-emerald-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
            Secured
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onExportData();
            }}
            className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#16161a] dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-tactical font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>Vault Backup (.o1fc)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onLogout();
            }}
            className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#16161a] dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-tactical font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dedicated Red-Accented Delete Account Button Below Sign Out */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onDeleteAccount();
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-500 hover:text-red-400 text-xs font-tactical font-bold uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete Account &amp; Erase All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsFooterSection;
