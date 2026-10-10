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
            <span className="text-xs font-sans font-semibold text-white block">
              Active session
            </span>
            <span className="text-[11px] font-sans text-neutral-400 block truncate">
              {activeEmail}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-sans text-neutral-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-o1-ok" />
            Secured
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onExportData();
            }}
            className="o1-pill border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Vault backup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onLogout();
            }}
            className="o1-pill border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign out</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onDeleteAccount();
            }}
            className="o1-pill border border-o1-crimson/40 bg-transparent hover:bg-o1-crimson/10 text-o1-crimson text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsFooterSection;
