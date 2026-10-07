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
    <div className="space-y-2 pt-1 pb-4 select-none">
      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-tactical uppercase font-bold text-neutral-400 block tracking-wider">
              Active Session
            </span>
            <span className="text-xs font-mono text-neutral-200 font-semibold block truncate">
              {activeEmail}
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
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
            className="py-2.5 px-3 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-tactical font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-o1-crimson" />
            <span>Vault Backup (.o1fc)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onLogout();
            }}
            className="py-2.5 px-3 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-tactical font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dedicated Red-Accented Delete Account Button Below Sign Out */}
        <div className="pt-2 border-t border-white/[0.05]">
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
