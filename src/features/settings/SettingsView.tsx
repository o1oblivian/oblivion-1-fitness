import React, { useState } from 'react';
import { LogOut, Trash2, FileText, Lock, Download } from 'lucide-react';
import { useProductionSettings } from '../../hooks/useAthleteSettings';
import { DeleteConfirmModal } from '../../components/settings/DeleteConfirmModal';
import { TermsOfServiceModal, PrivacyPolicyModal } from '../legal';
import { tactileEngine } from '../../services/tactileEngine';

interface SettingsViewProps {
  onLogout?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout, onShowToast }) => {
  const settings = useProductionSettings(onShowToast);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const activeEmail =
    (typeof window !== 'undefined' && window.localStorage.getItem('o1fc_user_email')) ||
    'athlete@oblivion1.club';

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4 text-white select-none pb-12">
      {/* Header Profile Section */}
      <div className="bg-[#121214] border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/40 border border-red-900/60 text-[#C4121A] flex items-center justify-center font-bold font-mono">
              O1
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-white">Athlete Sanctuary</h3>
              <p className="text-[11px] font-mono text-neutral-400 truncate max-w-[200px]">{activeEmail}</p>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
            Verified
          </span>
        </div>

        {/* Export & Sign Out Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={settings.handleExportVault}
            className="py-2.5 px-3 rounded-xl border border-neutral-800 bg-[#16161a] hover:bg-neutral-800 text-neutral-200 text-xs font-mono font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>Vault Backup</span>
          </button>
          <button
            type="button"
            onClick={() => settings.handleLogout(onLogout)}
            className="py-2.5 px-3 rounded-xl border border-neutral-800 bg-[#16161a] hover:bg-neutral-800 text-neutral-200 text-xs font-mono font-semibold uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dedicated Red-Accented Delete Account Button Below Sign Out */}
        <div className="pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              settings.setShowDeleteConfirm(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-500 hover:text-red-400 text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete Account &amp; Erase All Data</span>
          </button>
        </div>
      </div>

      {/* Live Legal Modals Section (OLED Working Links) */}
      <div className="bg-[#121214] border border-neutral-800 rounded-3xl p-4 space-y-2">
        <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold tracking-wider px-1">
          Legal &amp; Data Governance
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowTerms(true); }}
            className="py-2.5 px-3 rounded-xl border border-neutral-800 bg-[#18181b] hover:bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center gap-2 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setShowPrivacy(true); }}
            className="py-2.5 px-3 rounded-xl border border-neutral-800 bg-[#18181b] hover:bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center gap-2 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={settings.showDeleteConfirm}
        isDeleting={settings.isDeleting}
        onClose={() => settings.setShowDeleteConfirm(false)}
        onConfirm={() => settings.handleConfirmDelete(onLogout)}
      />
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default SettingsView;
